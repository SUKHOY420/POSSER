import { createContext, useContext, useReducer, ReactNode, useCallback, useRef, useEffect } from 'react';
import { v4 as uuidv4 } from 'uuid';
import { AppState, Ticket, TicketItem, Table, Server, MenuItem, Payment, TicketFormat, TableStatus } from './types';
import { initialServers, initialMenuItems, initialTables } from './data';

// ============================================
// SYNCHRONISATION - BroadcastChannel
// ============================================
class SyncManager {
  private channel: BroadcastChannel | null = null;
  private listeners: Map<string, Set<Function>> = new Map();
  private postId: string;
  private postType: string = '';

  constructor() {
    this.postId = 'post-' + Math.random().toString(36).substr(2, 9);
  }

  initialize(postType: string) {
    if (this.channel) this.channel.close();
    this.postType = postType;
    this.channel = new BroadcastChannel('quickpos-sync-v4');
    
    this.channel.onmessage = (event) => {
      const msg = event.data;
      if (msg.postId === this.postId) return;
      console.log(`[Sync ${this.postType}] Reçu:`, msg.type);
      const cbs = this.listeners.get(msg.type);
      if (cbs) cbs.forEach(cb => cb(msg.payload));
    };
  }

  broadcast(type: string, payload: any) {
    if (!this.channel) return;
    this.channel.postMessage({
      postId: this.postId,
      postType: this.postType,
      timestamp: Date.now(),
      type,
      payload,
    });
    console.log(`[Sync ${this.postType}] Broadcast:`, type);
  }

  on(type: string, callback: Function): () => void {
    if (!this.listeners.has(type)) this.listeners.set(type, new Set());
    this.listeners.get(type)!.add(callback);
    return () => this.listeners.get(type)?.delete(callback);
  }
}

export const syncManager = new SyncManager();

// ============================================
// MACHINE À ÉTATS - recalculateTableStatus
// ============================================
export function recalculateTableStatus(
  tableId: string,
  tickets: Ticket[],
  currentStatus: TableStatus
): { status: TableStatus; totalToPay: number; totalPaid: number } {
  const tableTickets = tickets.filter(t => t.tableId === tableId && t.status !== 'CANCELLED');
  
  let totalToPay = 0;
  let totalPaid = 0;
  let hasOpenTickets = false;

  tableTickets.forEach(ticket => {
    totalToPay += ticket.totalAmount;
    totalPaid += ticket.paidAmount;
    if (ticket.status === 'OPEN' || ticket.status === 'DRAFT') hasOpenTickets = true;
  });

  let newStatus: TableStatus;

  if (tableTickets.length === 0) {
    newStatus = 'FREE';
  } else if (!hasOpenTickets && totalPaid >= totalToPay && totalToPay > 0) {
    newStatus = 'FREE';
  } else if (totalPaid > 0 && totalPaid < totalToPay) {
    newStatus = 'PARTIALLY_PAID';
  } else if (hasOpenTickets && totalPaid === 0) {
    newStatus = 'OCCUPIED';
  } else {
    newStatus = 'OCCUPIED';
  }

  return { status: newStatus, totalToPay, totalPaid };
}

// ============================================
// STATE & ACTIONS
// ============================================
const defaultTicketFormat: TicketFormat = {
  showLogo: true,
  showAddress: true,
  showPhone: true,
  showServer: true,
  showDate: true,
  showItems: true,
  showTotal: true,
  showPayment: true,
  showFooter: true,
  footerText: 'Merci de votre visite!',
};

const initialState: AppState = {
  screen: 'select',
  tables: initialTables,
  tickets: [],
  servers: initialServers,
  menuItems: initialMenuItems,
  currentServer: null,
  currentTicketId: null,
  cashBalance: 200,
  ticketFormat: defaultTicketFormat,
};

// ============================================
// PERSISTENCE - localStorage
// ============================================
const loadState = (): AppState => {
  const saved = localStorage.getItem('quickpos-state');
  if (saved) {
    try {
      const parsed = JSON.parse(saved);
      // Convertir les dates
      parsed.tickets = parsed.tickets.map((t: any) => ({
        ...t,
        createdAt: new Date(t.createdAt),
        validatedAt: t.validatedAt ? new Date(t.validatedAt) : undefined,
        closedAt: t.closedAt ? new Date(t.closedAt) : undefined,
        payments: t.payments.map((p: any) => ({
          ...p,
          timestamp: new Date(p.timestamp)
        }))
      }));
      return { ...initialState, ...parsed };
    } catch (e) {
      console.error('Error loading state:', e);
    }
  }
  return initialState;
};

const saveState = (state: AppState) => {
  try {
    localStorage.setItem('quickpos-state', JSON.stringify(state));
  } catch (e) {
    console.error('Error saving state:', e);
  }
};

type Action =
  | { type: 'SET_SCREEN'; payload: AppState['screen'] }
  | { type: 'LOGIN'; payload: Server }
  | { type: 'LOGOUT' }
  | { type: 'OPEN_TABLE'; payload: string }
  | { type: 'ADD_ITEM'; payload: { ticketId: string; item: TicketItem } }
  | { type: 'REMOVE_ITEM'; payload: { ticketId: string; itemId: string } }
  | { type: 'UPDATE_QTY'; payload: { ticketId: string; itemId: string; qty: number } }
  | { type: 'VALIDATE_TICKET'; payload: string }
  | { type: 'SEND_TO_KITCHEN'; payload: string }
  | { type: 'MARK_STATUS'; payload: { ticketId: string; itemId: string; status: TicketItem['status'] } }
  | { type: 'ADD_PAYMENT'; payload: { ticketId: string; amount: number; method: 'CASH' | 'CARD' } }
  | { type: 'CLOSE_TICKET'; payload: string }
  // Admin actions
  | { type: 'ADD_MENU_ITEM'; payload: MenuItem }
  | { type: 'UPDATE_MENU_ITEM'; payload: MenuItem }
  | { type: 'DELETE_MENU_ITEM'; payload: string }
  | { type: 'ADD_TABLE'; payload: Table }
  | { type: 'UPDATE_TABLE'; payload: Table }
  | { type: 'DELETE_TABLE'; payload: string }
  | { type: 'ADD_SERVER'; payload: Server }
  | { type: 'UPDATE_SERVER'; payload: Server }
  | { type: 'DELETE_SERVER'; payload: string }
  | { type: 'UPDATE_TICKET_FORMAT'; payload: TicketFormat }
  // Sync actions
  | { type: 'SYNC_TICKET'; payload: Ticket }
  | { type: 'SYNC_TABLE'; payload: Table };

function calcTicketTotal(items: TicketItem[], discount: number): number {
  const subtotal = items.reduce((sum, i) => sum + i.menuItem.price * i.quantity, 0);
  return subtotal * (1 - discount / 100);
}

function reducer(state: AppState, action: Action): AppState {
  switch (action.type) {
    case 'SET_SCREEN':
      return { ...state, screen: action.payload };

    case 'LOGIN':
      return { ...state, currentServer: action.payload };

    case 'LOGOUT':
      return { ...state, currentServer: null, currentTicketId: null, screen: 'select' };

    case 'OPEN_TABLE': {
      const tableId = action.payload;
      // Chercher un ticket DRAFT ou OPEN existant
      const existingTicket = state.tickets.find(
        t => t.tableId === tableId && (t.status === 'DRAFT' || t.status === 'OPEN')
      );
      if (existingTicket) {
        return { ...state, currentTicketId: existingTicket.id };
      }
      // Créer un nouveau ticket en DRAFT
      if (!state.currentServer) return state;
      const newTicket: Ticket = {
        id: uuidv4(),
        tableId,
        items: [],
        status: 'DRAFT',
        totalAmount: 0,
        paidAmount: 0,
        createdAt: new Date(),
        serverId: state.currentServer.id,
        serverName: state.currentServer.name,
        payments: [],
        discount: 0,
      };
      const newTables = state.tables.map(t =>
        t.id === tableId ? { ...t, ticketIds: [...t.ticketIds, newTicket.id] } : t
      );
      const allTickets = [...state.tickets, newTicket];
      const { status, totalToPay, totalPaid } = recalculateTableStatus(tableId, allTickets, 'FREE');
      const finalTables = newTables.map(t =>
        t.id === tableId ? { ...t, status, totalToPay, totalPaid } : t
      );
      return {
        ...state,
        tables: finalTables,
        tickets: allTickets,
        currentTicketId: newTicket.id,
      };
    }

    case 'ADD_ITEM': {
      const { ticketId, item } = action.payload;
      const tickets = state.tickets.map(t => {
        if (t.id !== ticketId) return t;
        const newItems = [...t.items, item];
        return { ...t, items: newItems, totalAmount: calcTicketTotal(newItems, t.discount) };
      });
      const ticket = tickets.find(t => t.id === ticketId)!;
      const { status, totalToPay, totalPaid } = recalculateTableStatus(ticket.tableId, tickets, 'OCCUPIED');
      const tables = state.tables.map(t =>
        t.id === ticket.tableId ? { ...t, status, totalToPay, totalPaid } : t
      );
      return { ...state, tickets, tables };
    }

    case 'REMOVE_ITEM': {
      const { ticketId, itemId } = action.payload;
      const tickets = state.tickets.map(t => {
        if (t.id !== ticketId) return t;
        const newItems = t.items.filter(i => i.id !== itemId);
        return { ...t, items: newItems, totalAmount: calcTicketTotal(newItems, t.discount) };
      });
      const ticket = tickets.find(t => t.id === ticketId)!;
      const { status, totalToPay, totalPaid } = recalculateTableStatus(ticket.tableId, tickets, 'OCCUPIED');
      const tables = state.tables.map(t =>
        t.id === ticket.tableId ? { ...t, status, totalToPay, totalPaid } : t
      );
      return { ...state, tickets, tables };
    }

    case 'UPDATE_QTY': {
      const { ticketId, itemId, qty } = action.payload;
      const tickets = state.tickets.map(t => {
        if (t.id !== ticketId) return t;
        const newItems = t.items.map(i => i.id === itemId ? { ...i, quantity: Math.max(1, qty) } : i);
        return { ...t, items: newItems, totalAmount: calcTicketTotal(newItems, t.discount) };
      });
      const ticket = tickets.find(t => t.id === ticketId)!;
      const { status, totalToPay, totalPaid } = recalculateTableStatus(ticket.tableId, tickets, 'OCCUPIED');
      const tables = state.tables.map(t =>
        t.id === ticket.tableId ? { ...t, status, totalToPay, totalPaid } : t
      );
      return { ...state, tickets, tables };
    }

    case 'VALIDATE_TICKET': {
      const ticketId = action.payload;
      const tickets = state.tickets.map(t => {
        if (t.id !== ticketId) return t;
        return {
          ...t,
          status: 'OPEN' as const,
          validatedAt: new Date(),
          items: t.items.map(i => ({ ...i, status: 'validated' as const, validatedAt: new Date() })),
        };
      });
      return { ...state, tickets };
    }

    case 'SEND_TO_KITCHEN': {
      const ticketId = action.payload;
      const tickets = state.tickets.map(t => {
        if (t.id !== ticketId) return t;
        return {
          ...t,
          items: t.items.map(i =>
            i.menuItem.isFood && i.status === 'validated'
              ? { ...i, status: 'sent' as const, sentAt: new Date() }
              : i
          ),
        };
      });
      return { ...state, tickets };
    }

    case 'MARK_STATUS': {
      const { ticketId, itemId, status } = action.payload;
      const tickets = state.tickets.map(t => {
        if (t.id !== ticketId) return t;
        return {
          ...t,
          items: t.items.map(i => i.id === itemId ? { ...i, status } : i),
        };
      });
      return { ...state, tickets };
    }

    case 'ADD_PAYMENT': {
      const { ticketId, amount, method } = action.payload;
      const payment: Payment = {
        id: uuidv4(),
        ticketId,
        amount,
        method,
        timestamp: new Date(),
      };
      const tickets = state.tickets.map(t => {
        if (t.id !== ticketId) return t;
        const newPayments = [...t.payments, payment];
        const newPaidAmount = newPayments.reduce((sum, p) => sum + p.amount, 0);
        const isFullyPaid = newPaidAmount >= t.totalAmount;
        return {
          ...t,
          payments: newPayments,
          paidAmount: newPaidAmount,
          status: isFullyPaid ? 'PAID' as const : t.status,
          closedAt: isFullyPaid ? new Date() : undefined,
        };
      });
      const ticket = tickets.find(t => t.id === ticketId)!;
      const { status, totalToPay, totalPaid } = recalculateTableStatus(ticket.tableId, tickets, 'PARTIALLY_PAID');
      const tables = state.tables.map(t =>
        t.id === ticket.tableId ? { ...t, status, totalToPay, totalPaid } : t
      );
      const cashDelta = method === 'CASH' ? amount : 0;
      return {
        ...state,
        tickets,
        tables,
        cashBalance: state.cashBalance + cashDelta,
      };
    }

    case 'CLOSE_TICKET': {
      const ticketId = action.payload;
      const ticket = state.tickets.find(t => t.id === ticketId);
      if (!ticket) return state;
      const tables = state.tables.map(t => {
        if (t.id !== ticket.tableId) return t;
        const newTicketIds = t.ticketIds.filter(id => id !== ticketId);
        const { status, totalToPay, totalPaid } = recalculateTableStatus(
          t.id,
          state.tickets.filter(tk => tk.id !== ticketId),
          'OCCUPIED'
        );
        return { ...t, ticketIds: newTicketIds, status, totalToPay, totalPaid };
      });
      return { ...state, tables, currentTicketId: null };
    }

    // Admin actions
    case 'ADD_MENU_ITEM':
      return { ...state, menuItems: [...state.menuItems, action.payload] };

    case 'UPDATE_MENU_ITEM':
      return {
        ...state,
        menuItems: state.menuItems.map(i => i.id === action.payload.id ? action.payload : i),
      };

    case 'DELETE_MENU_ITEM':
      return {
        ...state,
        menuItems: state.menuItems.filter(i => i.id !== action.payload),
      };

    case 'ADD_TABLE':
      return { ...state, tables: [...state.tables, action.payload] };

    case 'UPDATE_TABLE':
      return {
        ...state,
        tables: state.tables.map(t => t.id === action.payload.id ? action.payload : t),
      };

    case 'DELETE_TABLE':
      return {
        ...state,
        tables: state.tables.filter(t => t.id !== action.payload),
      };

    case 'ADD_SERVER':
      return { ...state, servers: [...state.servers, action.payload] };

    case 'UPDATE_SERVER':
      return {
        ...state,
        servers: state.servers.map(s => s.id === action.payload.id ? action.payload : s),
      };

    case 'DELETE_SERVER':
      return {
        ...state,
        servers: state.servers.filter(s => s.id !== action.payload),
      };

    case 'UPDATE_TICKET_FORMAT':
      return { ...state, ticketFormat: action.payload };

    // Sync actions
    case 'SYNC_TICKET': {
      const newTicket = action.payload;
      const exists = state.tickets.find(t => t.id === newTicket.id);
      let tickets = exists
        ? state.tickets.map(t => t.id === newTicket.id ? newTicket : t)
        : [...state.tickets, newTicket];
      const tables = state.tables.map(t => {
        const { status, totalToPay, totalPaid } = recalculateTableStatus(t.id, tickets, t.status);
        return { ...t, status, totalToPay, totalPaid };
      });
      return { ...state, tickets, tables };
    }

    case 'SYNC_TABLE': {
      const newTable = action.payload;
      return {
        ...state,
        tables: state.tables.map(t => t.id === newTable.id ? newTable : t),
      };
    }

    default:
      return state;
  }
}

// ============================================
// CONTEXT
// ============================================
interface ContextType {
  state: AppState;
  dispatch: React.Dispatch<Action>;
}

const POSContext = createContext<ContextType | undefined>(undefined);

export function POSProvider({ children }: { children: ReactNode }) {
  const [state, dispatch] = useReducer(reducer, initialState, loadState);
  const stateRef = useRef(state);
  stateRef.current = state;

  // Sauvegarder l'état à chaque changement
  useEffect(() => {
    saveState(state);
  }, [state]);

  const syncDispatch = useCallback((action: Action) => {
    dispatch(action);
    if (action.type.startsWith('SYNC_')) return;

    const s = stateRef.current;

    switch (action.type) {
      case 'OPEN_TABLE': {
        setTimeout(() => {
          const latest = stateRef.current;
          const ticket = latest.tickets.find(t => t.tableId === action.payload && (t.status === 'DRAFT' || t.status === 'OPEN'));
          if (ticket) {
            syncManager.broadcast('TICKET_UPDATE', ticket);
            const table = latest.tables.find(t => t.id === action.payload);
            if (table) syncManager.broadcast('TABLE_UPDATE', table);
          }
        }, 50);
        break;
      }
      case 'ADD_ITEM':
      case 'REMOVE_ITEM':
      case 'UPDATE_QTY': {
        const ticketId = 'ticketId' in action.payload ? action.payload.ticketId : '';
        setTimeout(() => {
          const ticket = stateRef.current.tickets.find(t => t.id === ticketId);
          if (ticket) syncManager.broadcast('TICKET_UPDATE', ticket);
        }, 0);
        break;
      }
      case 'VALIDATE_TICKET':
      case 'SEND_TO_KITCHEN': {
        const ticketId = action.type === 'VALIDATE_TICKET' ? action.payload : action.payload;
        setTimeout(() => {
          const ticket = stateRef.current.tickets.find(t => t.id === ticketId);
          if (ticket) {
            syncManager.broadcast('TICKET_UPDATE', ticket);
            if (action.type === 'SEND_TO_KITCHEN') {
              const foodCount = ticket.items.filter(i => i.menuItem.isFood).length;
              const drinkCount = ticket.items.filter(i => !i.menuItem.isFood).length;
              
              if (foodCount > 0) {
                syncManager.broadcast('KITCHEN_NOTIFY', {
                  message: `Commande envoyée: ${foodCount} plats`,
                });
              }
              if (drinkCount > 0) {
                syncManager.broadcast('BAR_NOTIFY', {
                  message: `Commande envoyée: ${drinkCount} boissons`,
                });
              }
            }
          }
        }, 0);
        break;
      }
      case 'MARK_STATUS': {
        setTimeout(() => {
          const ticket = stateRef.current.tickets.find(t => t.id === action.payload.ticketId);
          if (ticket) syncManager.broadcast('TICKET_UPDATE', ticket);
          if (action.payload.status === 'ready') {
            syncManager.broadcast('SERVER_NOTIFY', {
              message: `Commande prête !`,
              from: 'Cuisine',
            });
          }
        }, 0);
        break;
      }
      case 'ADD_PAYMENT': {
        setTimeout(() => {
          const ticket = stateRef.current.tickets.find(t => t.id === action.payload.ticketId);
          if (ticket) {
            syncManager.broadcast('TICKET_UPDATE', ticket);
            const table = stateRef.current.tables.find(t => t.id === ticket.tableId);
            if (table) syncManager.broadcast('TABLE_UPDATE', table);
          }
        }, 0);
        break;
      }
      case 'CLOSE_TICKET': {
        setTimeout(() => {
          stateRef.current.tables.forEach(t => {
            syncManager.broadcast('TABLE_UPDATE', t);
          });
        }, 0);
        break;
      }
    }
  }, []);

  useEffect(() => {
    if (state.screen !== 'select') {
      syncManager.initialize(state.screen);
    }
  }, [state.screen]);

  useEffect(() => {
    const unsubs = [
      syncManager.on('TICKET_UPDATE', (ticket: Ticket) => {
        dispatch({ type: 'SYNC_TICKET', payload: ticket });
      }),
      syncManager.on('TABLE_UPDATE', (table: Table) => {
        dispatch({ type: 'SYNC_TABLE', payload: table });
      }),
    ];
    return () => unsubs.forEach(u => u());
  }, []);

  return (
    <POSContext.Provider value={{ state, dispatch: syncDispatch }}>
      {children}
    </POSContext.Provider>
  );
}

export function usePOS() {
  const ctx = useContext(POSContext);
  if (!ctx) throw new Error('usePOS must be used within POSProvider');
  return ctx;
}
