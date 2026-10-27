import { useState, useEffect, useReducer, useCallback, useRef, createContext, useContext, ReactNode } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { v4 as uuidv4 } from 'uuid';
import {
  Monitor, ChefHat, Tablet, LogOut, Lock, Settings, Printer, CreditCard,
  Clock, Users, DollarSign, AlertCircle, CheckCircle2, Timer, Flame,
  Plus, Minus, Send, Trash2, Banknote, ArrowLeft, Search, X, StickyNote,
  Percent, Grid3X3, Check, Play, Bell, Wifi, Zap, WifiOff
} from 'lucide-react';

// ============================================
// TYPES - Architecture Ticket-based
// ============================================
interface MenuItem {
  id: string;
  name: string;
  price: number;
  category: string;
  color: string;
  emoji: string;
  isFood: boolean;
  modifiers?: { id: string; name: string; options: string[]; required: boolean }[];
}

interface TicketItem {
  id: string;
  menuItem: MenuItem;
  quantity: number;
  notes: string;
  modifiers: Record<string, string>;
  status: 'pending' | 'sent' | 'preparing' | 'ready' | 'served';
  sentAt?: Date;
}

interface Payment {
  id: string;
  ticketId: string;
  amount: number;
  method: 'CASH' | 'CARD';
  transactionRef?: string;
  timestamp: Date;
}

interface Ticket {
  id: string;
  tableId: string;
  items: TicketItem[];
  status: 'OPEN' | 'PAID' | 'CANCELLED';
  totalAmount: number;
  paidAmount: number;
  createdAt: Date;
  closedAt?: Date;
  serverId: string;
  serverName: string;
  payments: Payment[];
  discount: number;
}

type TableStatus = 'FREE' | 'OCCUPIED' | 'PARTIALLY_PAID' | 'RESERVED' | 'CLEANING';

interface Table {
  id: string;
  name: string;
  seats: number;
  status: TableStatus;
  ticketIds: string[];
  totalToPay: number;
  totalPaid: number;
}

interface Server {
  id: string;
  name: string;
  pin: string;
  color: string;
}

type ScreenType = 'select' | 'main' | 'kitchen' | 'server';

// ============================================
// DONNÉES
// ============================================
const servers: Server[] = [
  { id: 'srv-1', name: 'Marie', pin: '1234', color: '#3b82f6' },
  { id: 'srv-2', name: 'Thomas', pin: '2345', color: '#8b5cf6' },
  { id: 'srv-3', name: 'Julie', pin: '3456', color: '#ec4899' },
  { id: 'srv-4', name: 'Karim', pin: '4567', color: '#f59e0b' },
];

const categories = [
  { name: 'Entrées', emoji: '🥗', color: '#10b981' },
  { name: 'Plats', emoji: '🍽️', color: '#f59e0b' },
  { name: 'Desserts', emoji: '🍰', color: '#ec4899' },
  { name: 'Boissons', emoji: '🥤', color: '#3b82f6' },
  { name: 'Cocktails', emoji: '🍹', color: '#8b5cf6' },
  { name: 'Vins', emoji: '🍷', color: '#ef4444' },
  { name: 'Bières', emoji: '🍺', color: '#f97316' },
  { name: 'Cafés', emoji: '☕', color: '#92400e' },
];

const menuItems: MenuItem[] = [
  { id: '1', name: 'Salade César', price: 9.50, category: 'Entrées', color: '#10b981', emoji: '🥗', isFood: true },
  { id: '2', name: 'Soupe oignon', price: 7.00, category: 'Entrées', color: '#10b981', emoji: '🍲', isFood: true },
  { id: '3', name: 'Bruschetta', price: 8.00, category: 'Entrées', color: '#10b981', emoji: '🍞', isFood: true },
  { id: '4', name: 'Burger', price: 14.50, category: 'Plats', color: '#f59e0b', emoji: '🍔', isFood: true },
  { id: '5', name: 'Entrecôte', price: 24.00, category: 'Plats', color: '#f59e0b', emoji: '🥩', isFood: true,
    modifiers: [{ id: 'm1', name: 'Cuisson', options: ['Bleu', 'Saignant', 'À point', 'Bien cuit'], required: true }]
  },
  { id: '6', name: 'Pâtes Carbonara', price: 13.50, category: 'Plats', color: '#f59e0b', emoji: '🍝', isFood: true },
  { id: '7', name: 'Pizza', price: 12.00, category: 'Plats', color: '#f59e0b', emoji: '🍕', isFood: true },
  { id: '8', name: 'Tiramisu', price: 7.50, category: 'Desserts', color: '#ec4899', emoji: '🍰', isFood: true },
  { id: '9', name: 'Fondant chocolat', price: 8.00, category: 'Desserts', color: '#ec4899', emoji: '🍫', isFood: true },
  { id: '10', name: 'Coca-Cola', price: 3.50, category: 'Boissons', color: '#3b82f6', emoji: '🥤', isFood: false },
  { id: '11', name: 'Eau', price: 2.50, category: 'Boissons', color: '#3b82f6', emoji: '💧', isFood: false },
  { id: '12', name: 'Jus orange', price: 4.00, category: 'Boissons', color: '#3b82f6', emoji: '🍊', isFood: false },
  { id: '13', name: 'Mojito', price: 9.00, category: 'Cocktails', color: '#8b5cf6', emoji: '🍹', isFood: false },
  { id: '14', name: 'Margarita', price: 10.00, category: 'Cocktails', color: '#8b5cf6', emoji: '🍸', isFood: false },
  { id: '15', name: 'Rouge Bordeaux', price: 6.00, category: 'Vins', color: '#ef4444', emoji: '🍷', isFood: false },
  { id: '16', name: 'Blanc Chablis', price: 7.00, category: 'Vins', color: '#ef4444', emoji: '🥂', isFood: false },
  { id: '17', name: 'Blonde pression', price: 4.50, category: 'Bières', color: '#f97316', emoji: '🍺', isFood: false },
  { id: '18', name: 'IPA', price: 6.00, category: 'Bières', color: '#f97316', emoji: '🍺', isFood: false },
  { id: '19', name: 'Espresso', price: 2.00, category: 'Cafés', color: '#92400e', emoji: '☕', isFood: false },
  { id: '20', name: 'Cappuccino', price: 3.50, category: 'Cafés', color: '#92400e', emoji: '☕', isFood: false },
];

const initialTables: Table[] = [
  { id: 't1', name: 'T1', seats: 2, status: 'FREE', ticketIds: [], totalToPay: 0, totalPaid: 0 },
  { id: 't2', name: 'T2', seats: 4, status: 'FREE', ticketIds: [], totalToPay: 0, totalPaid: 0 },
  { id: 't3', name: 'T3', seats: 4, status: 'FREE', ticketIds: [], totalToPay: 0, totalPaid: 0 },
  { id: 't4', name: 'T4', seats: 6, status: 'FREE', ticketIds: [], totalToPay: 0, totalPaid: 0 },
  { id: 't5', name: 'T5', seats: 2, status: 'FREE', ticketIds: [], totalToPay: 0, totalPaid: 0 },
  { id: 't6', name: 'T6', seats: 4, status: 'FREE', ticketIds: [], totalToPay: 0, totalPaid: 0 },
  { id: 't7', name: 'T7', seats: 4, status: 'FREE', ticketIds: [], totalToPay: 0, totalPaid: 0 },
  { id: 't8', name: 'T8', seats: 8, status: 'FREE', ticketIds: [], totalToPay: 0, totalPaid: 0 },
  { id: 'b1', name: 'Bar 1', seats: 1, status: 'FREE', ticketIds: [], totalToPay: 0, totalPaid: 0 },
  { id: 'b2', name: 'Bar 2', seats: 1, status: 'FREE', ticketIds: [], totalToPay: 0, totalPaid: 0 },
  { id: 'b3', name: 'Bar 3', seats: 1, status: 'FREE', ticketIds: [], totalToPay: 0, totalPaid: 0 },
  { id: 'b4', name: 'Bar 4', seats: 1, status: 'FREE', ticketIds: [], totalToPay: 0, totalPaid: 0 },
];

// ============================================
// SYNCHRONISATION - BroadcastChannel (WebSocket-like)
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
    this.channel = new BroadcastChannel('quickpos-sync-v3');
    
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

const syncManager = new SyncManager();

// ============================================
// MACHINE À ÉTATS - recalculateTableStatus
// ============================================
function recalculateTableStatus(
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
    if (ticket.status === 'OPEN') hasOpenTickets = true;
  });

  let newStatus: TableStatus;

  if (tableTickets.length === 0) {
    newStatus = 'FREE';
  } else if (!hasOpenTickets && totalPaid >= totalToPay && totalToPay > 0) {
    newStatus = 'FREE'; // Tout payé, table libérable
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
// STATE MANAGEMENT
// ============================================
interface State {
  screen: ScreenType;
  tables: Table[];
  tickets: Ticket[];
  servers: Server[];
  currentServer: Server | null;
  currentTicketId: string | null;
  cashBalance: number;
}

type Action =
  | { type: 'SET_SCREEN'; payload: ScreenType }
  | { type: 'LOGIN'; payload: Server }
  | { type: 'LOGOUT' }
  | { type: 'OPEN_TABLE'; payload: string }
  | { type: 'ADD_ITEM'; payload: { ticketId: string; item: TicketItem } }
  | { type: 'REMOVE_ITEM'; payload: { ticketId: string; itemId: string } }
  | { type: 'UPDATE_QTY'; payload: { ticketId: string; itemId: string; qty: number } }
  | { type: 'SEND_TO_KITCHEN'; payload: string }
  | { type: 'MARK_STATUS'; payload: { ticketId: string; itemId: string; status: TicketItem['status'] } }
  | { type: 'ADD_PAYMENT'; payload: { ticketId: string; amount: number; method: 'CASH' | 'CARD' } }
  | { type: 'CLOSE_TICKET'; payload: string }
  // Sync actions
  | { type: 'SYNC_TICKET'; payload: Ticket }
  | { type: 'SYNC_TABLE'; payload: Table };

const initialState: State = {
  screen: 'select',
  tables: initialTables,
  tickets: [],
  servers: servers,
  currentServer: null,
  currentTicketId: null,
  cashBalance: 200,
};

function calcTicketTotal(items: TicketItem[], discount: number): number {
  const subtotal = items.reduce((sum, i) => sum + i.menuItem.price * i.quantity, 0);
  return subtotal * (1 - discount / 100);
}

function reducer(state: State, action: Action): State {
  switch (action.type) {
    case 'SET_SCREEN':
      return { ...state, screen: action.payload };

    case 'LOGIN':
      return { ...state, currentServer: action.payload };

    case 'LOGOUT':
      return { ...state, currentServer: null, currentTicketId: null, screen: 'select' };

    case 'OPEN_TABLE': {
      const tableId = action.payload;
      // Chercher un ticket OPEN existant pour cette table
      const existingTicket = state.tickets.find(t => t.tableId === tableId && t.status === 'OPEN');
      if (existingTicket) {
        return { ...state, currentTicketId: existingTicket.id };
      }
      // Créer un nouveau ticket
      if (!state.currentServer) return state;
      const newTicket: Ticket = {
        id: uuidv4(),
        tableId,
        items: [],
        status: 'OPEN',
        totalAmount: 0,
        paidAmount: 0,
        createdAt: new Date(),
        serverId: state.currentServer.id,
        serverName: state.currentServer.name,
        payments: [],
        discount: 0,
      };
      const updatedTable = state.tables.find(t => t.id === tableId)!;
      const newTables = state.tables.map(t =>
        t.id === tableId ? { ...t, ticketIds: [...t.ticketIds, newTicket.id] } : t
      );
      // Recalculer le statut
      const allTickets = [...state.tickets, newTicket];
      const { status, totalToPay, totalPaid } = recalculateTableStatus(tableId, allTickets, updatedTable.status);
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

    case 'SEND_TO_KITCHEN': {
      const ticketId = action.payload;
      const tickets = state.tickets.map(t => {
        if (t.id !== ticketId) return t;
        return {
          ...t,
          items: t.items.map(i =>
            i.status === 'pending' ? { ...i, status: 'sent' as const, sentAt: new Date() } : i
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
      // Retirer le ticket de la table
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

    // Sync actions
    case 'SYNC_TICKET': {
      const newTicket = action.payload;
      const exists = state.tickets.find(t => t.id === newTicket.id);
      let tickets = exists
        ? state.tickets.map(t => t.id === newTicket.id ? newTicket : t)
        : [...state.tickets, newTicket];
      // Recalculer toutes les tables
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
  state: State;
  dispatch: React.Dispatch<Action>;
}

const POSContext = createContext<ContextType | undefined>(undefined);

function POSProvider({ children }: { children: ReactNode }) {
  const [state, dispatch] = useReducer(reducer, initialState);
  const stateRef = useRef(state);
  stateRef.current = state;

  // Wrapper dispatch avec sync
  const syncDispatch = useCallback((action: Action) => {
    dispatch(action);
    if (action.type.startsWith('SYNC_')) return;

    const s = stateRef.current;

    switch (action.type) {
      case 'OPEN_TABLE': {
        setTimeout(() => {
          const latest = stateRef.current;
          const ticket = latest.tickets.find(t => t.tableId === action.payload && t.status === 'OPEN');
          if (ticket) {
            syncManager.broadcast('TICKET_UPDATE', ticket);
            const table = latest.tables.find(t => t.id === action.payload);
            if (table) syncManager.broadcast('TABLE_UPDATE', table);
            syncManager.broadcast('KITCHEN_NOTIFY', {
              message: `Nouvelle commande ${table?.name} par ${ticket.serverName}`,
            });
          }
        }, 50);
        break;
      }
      case 'ADD_ITEM':
      case 'REMOVE_ITEM':
      case 'UPDATE_QTY': {
        const ticketId = action.type === 'ADD_ITEM' ? action.payload.ticketId :
                        action.type === 'REMOVE_ITEM' ? action.payload.ticketId : action.payload.ticketId;
        setTimeout(() => {
          const ticket = stateRef.current.tickets.find(t => t.id === ticketId);
          if (ticket) syncManager.broadcast('TICKET_UPDATE', ticket);
        }, 0);
        break;
      }
      case 'SEND_TO_KITCHEN': {
        setTimeout(() => {
          const ticket = stateRef.current.tickets.find(t => t.id === action.payload);
          if (ticket) {
            syncManager.broadcast('TICKET_UPDATE', ticket);
            syncManager.broadcast('KITCHEN_NOTIFY', {
              message: `Commande envoyée: ${ticket.items.filter(i => i.menuItem.isFood).length} plats`,
            });
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
          const table = stateRef.current.tables.find(t =>
            !t.ticketIds.includes(action.payload)
          );
          stateRef.current.tables.forEach(t => {
            syncManager.broadcast('TABLE_UPDATE', t);
          });
        }, 0);
        break;
      }
    }
  }, []);

  // Initialiser la sync
  useEffect(() => {
    if (state.screen !== 'select') {
      syncManager.initialize(state.screen);
    }
  }, [state.screen]);

  // Écouter les événements sync
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

function usePOS() {
  const ctx = useContext(POSContext);
  if (!ctx) throw new Error('usePOS must be used within POSProvider');
  return ctx;
}

// ============================================
// COMPOSANTS
// ============================================

// Codes couleurs universels
function getTableColors(status: TableStatus) {
  switch (status) {
    case 'FREE':
      return { bg: 'from-emerald-500/20 to-emerald-600/10', border: 'border-emerald-500/50', text: 'text-emerald-400', label: 'Libre' };
    case 'OCCUPIED':
      return { bg: 'from-red-500/20 to-red-600/10', border: 'border-red-500/50', text: 'text-red-400', label: 'Occupée' };
    case 'PARTIALLY_PAID':
      return { bg: 'from-orange-500/20 to-orange-600/10', border: 'border-orange-500/50', text: 'text-orange-400', label: 'Partiel' };
    case 'RESERVED':
      return { bg: 'from-blue-500/20 to-blue-600/10', border: 'border-blue-500/50', text: 'text-blue-400', label: 'Réservée' };
    case 'CLEANING':
      return { bg: 'from-cyan-500/20 to-cyan-600/10', border: 'border-cyan-500/50', text: 'text-cyan-400', label: 'Nettoyage' };
  }
}

// ============================================
// ÉCRAN DE SÉLECTION
// ============================================
function ScreenSelect() {
  const { dispatch } = usePOS();
  const [step, setStep] = useState<'role' | 'server' | 'pin'>('role');
  const [selectedServer, setSelectedServer] = useState<Server | null>(null);
  const [pin, setPin] = useState('');
  const [pinError, setPinError] = useState(false);

  const handleRoleSelect = (role: 'main' | 'kitchen' | 'server') => {
    if (role === 'main') {
      dispatch({ type: 'LOGIN', payload: { id: 'admin', name: 'Admin', pin: '0000', color: '#10b981' } });
      dispatch({ type: 'SET_SCREEN', payload: 'main' });
    } else if (role === 'kitchen') {
      dispatch({ type: 'SET_SCREEN', payload: 'kitchen' });
    } else {
      setStep('server');
    }
  };

  const handleServerSelect = (server: Server) => {
    setSelectedServer(server);
    setStep('pin');
    setPin('');
  };

  const handlePinDigit = (digit: string) => {
    if (pin.length >= 4) return;
    const newPin = pin + digit;
    setPin(newPin);
    if (newPin.length === 4 && selectedServer) {
      setTimeout(() => {
        if (newPin === selectedServer.pin) {
          dispatch({ type: 'LOGIN', payload: selectedServer });
          dispatch({ type: 'SET_SCREEN', payload: 'server' });
        } else {
          setPinError(true);
          setTimeout(() => { setPinError(false); setPin(''); }, 1500);
        }
      }, 200);
    }
  };

  return (
    <div className="h-screen w-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 flex items-center justify-center p-4">
      <div className="w-full max-w-lg">
        <motion.div initial={{ opacity: 0, y: -20 }} animate={{ opacity: 1, y: 0 }} className="text-center mb-8">
          <div className="w-16 h-16 mx-auto rounded-2xl bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center mb-4 shadow-lg">
            <Monitor className="w-8 h-8 text-white" />
          </div>
          <h1 className="text-3xl font-bold text-white">QuickPOS</h1>
          <p className="text-slate-400 mt-1">Sélectionnez votre poste</p>
          <p className="text-xs text-slate-500 mt-2">
            💡 Ouvrez cette page dans plusieurs onglets pour tester la synchronisation
          </p>
        </motion.div>

        {step === 'role' && (
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="space-y-3">
            <button onClick={() => handleRoleSelect('main')}
              className="w-full p-5 bg-slate-800/80 border border-slate-700/50 rounded-2xl hover:border-blue-500/50 transition-all group flex items-center gap-4">
              <div className="w-14 h-14 rounded-xl bg-gradient-to-br from-blue-500 to-blue-700 flex items-center justify-center shrink-0 group-hover:scale-110 transition-transform">
                <Monitor className="w-7 h-7 text-white" />
              </div>
              <div className="text-left">
                <p className="text-lg font-bold text-white">Écran Principal</p>
                <p className="text-sm text-slate-400">Caisse - Vue globale</p>
              </div>
            </button>
            <button onClick={() => handleRoleSelect('kitchen')}
              className="w-full p-5 bg-slate-800/80 border border-slate-700/50 rounded-2xl hover:border-amber-500/50 transition-all group flex items-center gap-4">
              <div className="w-14 h-14 rounded-xl bg-gradient-to-br from-amber-500 to-orange-700 flex items-center justify-center shrink-0 group-hover:scale-110 transition-transform">
                <ChefHat className="w-7 h-7 text-white" />
              </div>
              <div className="text-left">
                <p className="text-lg font-bold text-white">Écran Cuisine</p>
                <p className="text-sm text-slate-400">KDS - Commandes à préparer</p>
              </div>
            </button>
            <button onClick={() => handleRoleSelect('server')}
              className="w-full p-5 bg-slate-800/80 border border-slate-700/50 rounded-2xl hover:border-emerald-500/50 transition-all group flex items-center gap-4">
              <div className="w-14 h-14 rounded-xl bg-gradient-to-br from-emerald-500 to-emerald-700 flex items-center justify-center shrink-0 group-hover:scale-110 transition-transform">
                <Tablet className="w-7 h-7 text-white" />
              </div>
              <div className="text-left">
                <p className="text-lg font-bold text-white">Tablette Serveur</p>
                <p className="text-sm text-slate-400">Prendre des commandes</p>
              </div>
            </button>
          </motion.div>
        )}

        {step === 'server' && (
          <motion.div initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }}>
            <button onClick={() => setStep('role')} className="text-slate-400 hover:text-white text-sm mb-4">← Retour</button>
            <h2 className="text-xl font-bold text-white mb-4">Choisissez votre profil</h2>
            <div className="grid grid-cols-2 gap-3">
              {servers.map(server => (
                <button key={server.id} onClick={() => handleServerSelect(server)}
                  className="p-4 bg-slate-800/80 border border-slate-700/50 rounded-2xl hover:border-emerald-500/50 transition-all flex flex-col items-center gap-2">
                  <div className="w-12 h-12 rounded-full flex items-center justify-center text-white text-lg font-bold"
                    style={{ backgroundColor: server.color }}>
                    {server.name[0]}
                  </div>
                  <span className="text-white font-medium">{server.name}</span>
                </button>
              ))}
            </div>
          </motion.div>
        )}

        {step === 'pin' && selectedServer && (
          <motion.div initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} className="text-center">
            <button onClick={() => { setStep('server'); setPin(''); }} className="text-slate-400 hover:text-white text-sm mb-4">← Retour</button>
            <div className="w-16 h-16 mx-auto rounded-full flex items-center justify-center text-white text-2xl font-bold mb-4"
              style={{ backgroundColor: selectedServer.color }}>
              {selectedServer.name[0]}
            </div>
            <h2 className="text-xl font-bold text-white mb-1">Bonjour {selectedServer.name}</h2>
            <p className="text-slate-400 text-sm mb-6">Entrez votre code PIN</p>
            <div className="flex justify-center gap-3 mb-8">
              {[0, 1, 2, 3].map(i => (
                <div key={i} className={`w-4 h-4 rounded-full transition-all ${
                  pinError ? 'bg-red-500 animate-pulse' :
                  i < pin.length ? 'bg-emerald-500 scale-110' : 'bg-slate-600'
                }`} />
              ))}
            </div>
            <div className="grid grid-cols-3 gap-3 max-w-[240px] mx-auto">
              {['1', '2', '3', '4', '5', '6', '7', '8', '9', '', '0', 'del'].map(key => (
                <button key={key || 'empty'}
                  onClick={() => { if (key === 'del') setPin(pin.slice(0, -1)); else if (key) handlePinDigit(key); }}
                  disabled={!key}
                  className={`h-14 rounded-xl text-xl font-bold transition-all ${
                    !key ? 'invisible' :
                    key === 'del' ? 'bg-slate-700 text-slate-300 hover:bg-slate-600 active:scale-95' :
                    'bg-slate-800 text-white hover:bg-slate-700 active:scale-95 border border-slate-700/50'
                  }`}>
                  {key === 'del' ? '⌫' : key}
                </button>
              ))}
            </div>
            <p className="text-xs text-slate-500 mt-4">PIN: {selectedServer.pin}</p>
          </motion.div>
        )}
      </div>
    </div>
  );
}

// ============================================
// ÉCRAN PRINCIPAL (CAISSE)
// ============================================
function MainScreen() {
  const { state, dispatch } = usePOS();
  const [currentTime, setCurrentTime] = useState(new Date());
  const [filter, setFilter] = useState<'all' | 'occupied' | 'partial'>('all');

  useEffect(() => {
    const timer = setInterval(() => setCurrentTime(new Date()), 1000);
    return () => clearInterval(timer);
  }, []);

  const openTickets = state.tickets.filter(t => t.status === 'OPEN');
  const totalRevenue = state.tickets.filter(t => t.status === 'PAID').reduce((sum, t) => sum + t.paidAmount, 0);

  const filteredTables = state.tables.filter(t => {
    if (filter === 'all') return true;
    if (filter === 'occupied') return t.status === 'OCCUPIED';
    if (filter === 'partial') return t.status === 'PARTIALLY_PAID';
    return true;
  });

  return (
    <div className="h-screen flex flex-col bg-slate-900">
      {/* Header */}
      <header className="h-16 bg-slate-800/90 border-b border-slate-700/50 flex items-center justify-between px-4 md:px-6 shrink-0">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center">
            <DollarSign className="w-4 h-4 text-white" />
          </div>
          <div>
            <h1 className="text-sm font-bold text-white">Caisse Principale</h1>
            <p className="text-[10px] text-slate-400">Vue globale temps réel</p>
          </div>
        </div>
        <div className="flex items-center gap-4">
          <div className="hidden md:flex items-center gap-4">
            <div className="text-center">
              <p className="text-xs text-slate-400">CA Jour</p>
              <p className="text-sm font-bold text-emerald-400">{totalRevenue.toFixed(2)} €</p>
            </div>
            <div className="text-center">
              <p className="text-xs text-slate-400">Fonds</p>
              <p className="text-sm font-bold text-amber-400">{state.cashBalance.toFixed(2)} €</p>
            </div>
          </div>
          <div className="text-right">
            <p className="text-lg font-mono font-bold text-white">
              {currentTime.toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' })}
            </p>
          </div>
          <button onClick={() => dispatch({ type: 'LOGOUT' })} className="p-2 text-slate-400 hover:text-white">
            <LogOut className="w-5 h-5" />
          </button>
        </div>
      </header>

      {/* Filtres */}
      <div className="px-4 py-3 border-b border-slate-700/50 flex gap-2 shrink-0">
        {[
          { id: 'all', label: 'Toutes', count: state.tables.filter(t => t.status !== 'FREE').length },
          { id: 'occupied', label: '🔴 Occupées', count: state.tables.filter(t => t.status === 'OCCUPIED').length },
          { id: 'partial', label: '🟠 Paiement partiel', count: state.tables.filter(t => t.status === 'PARTIALLY_PAID').length },
        ].map(f => (
          <button key={f.id} onClick={() => setFilter(f.id as typeof filter)}
            className={`px-4 py-2 rounded-xl text-sm font-medium transition-colors flex items-center gap-2 ${
              filter === f.id ? 'bg-blue-500 text-white' : 'bg-slate-800 text-slate-300 hover:bg-slate-700'
            }`}>
            {f.label}
            <span className={`px-1.5 py-0.5 rounded-full text-xs ${filter === f.id ? 'bg-white/20' : 'bg-slate-700'}`}>
              {f.count}
            </span>
          </button>
        ))}
      </div>

      {/* Tables Grid */}
      <div className="flex-1 overflow-y-auto p-4 md:p-6">
        <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-3">
          {filteredTables.map(table => {
            const colors = getTableColors(table.status);
            const tickets = state.tickets.filter(t => table.ticketIds.includes(t.id) && t.status === 'OPEN');
            
            return (
              <motion.div key={table.id} layout
                className={`rounded-2xl border-2 bg-gradient-to-br ${colors.bg} ${colors.border} p-4 flex flex-col items-center justify-center gap-1 relative`}>
                <span className="text-2xl font-bold text-white">{table.name}</span>
                <span className="text-xs text-slate-400">{table.seats}p</span>
                {table.status !== 'FREE' && (
                  <>
                    <p className={`text-sm font-bold ${colors.text}`}>{table.totalToPay.toFixed(2)} €</p>
                    {table.totalPaid > 0 && (
                      <p className="text-xs text-green-400">{table.totalPaid.toFixed(2)} € payés</p>
                    )}
                  </>
                )}
                <span className={`text-[10px] font-medium px-2 py-0.5 rounded-full ${colors.bg} ${colors.text} border ${colors.border}`}>
                  {colors.label}
                </span>
                {tickets.length > 0 && (
                  <div className="absolute top-1 right-1 text-[10px] bg-slate-700/80 px-1.5 py-0.5 rounded text-slate-300">
                    {tickets.reduce((sum, t) => sum + t.items.length, 0)} art.
                  </div>
                )}
              </motion.div>
            );
          })}
        </div>
      </div>

      {/* Légende */}
      <div className="p-3 border-t border-slate-700/50 flex items-center justify-center gap-4 shrink-0">
        <div className="flex items-center gap-1.5 text-xs">
          <div className="w-3 h-3 rounded-full bg-emerald-500" />
          <span className="text-slate-400">Libre</span>
        </div>
        <div className="flex items-center gap-1.5 text-xs">
          <div className="w-3 h-3 rounded-full bg-red-500" />
          <span className="text-slate-400">Occupée</span>
        </div>
        <div className="flex items-center gap-1.5 text-xs">
          <div className="w-3 h-3 rounded-full bg-orange-500" />
          <span className="text-slate-400">Partiel</span>
        </div>
        <div className="flex items-center gap-1.5 text-xs">
          <div className="w-3 h-3 rounded-full bg-blue-500" />
          <span className="text-slate-400">Réservée</span>
        </div>
      </div>
    </div>
  );
}

// ============================================
// ÉCRAN CUISINE (KDS)
// ============================================
function KitchenScreen() {
  const { state, dispatch } = usePOS();
  const [currentTime, setCurrentTime] = useState(new Date());
  const [alert, setAlert] = useState(false);

  useEffect(() => {
    const timer = setInterval(() => setCurrentTime(new Date()), 1000);
    return () => clearInterval(timer);
  }, []);

  useEffect(() => {
    const unsub = syncManager.on('KITCHEN_NOTIFY', () => {
      setAlert(true);
      try {
        const ctx = new AudioContext();
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();
        osc.connect(gain); gain.connect(ctx.destination);
        osc.frequency.value = 800;
        gain.gain.setValueAtTime(0.3, ctx.currentTime);
        gain.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + 0.5);
        osc.start(); osc.stop(ctx.currentTime + 0.5);
      } catch (e) {}
      setTimeout(() => setAlert(false), 3000);
    });
    return unsub;
  }, []);

  const kitchenOrders = state.tickets
    .filter(t => t.status === 'OPEN')
    .map(ticket => {
      const foodItems = ticket.items.filter(i => i.menuItem.isFood && i.status !== 'served');
      const table = state.tables.find(t => t.id === ticket.tableId);
      return { ticket, foodItems, table };
    })
    .filter(o => o.foodItems.length > 0);

  return (
    <div className="h-screen flex flex-col bg-slate-900">
      <header className={`h-16 border-b flex items-center justify-between px-4 md:px-6 shrink-0 transition-colors ${
        alert ? 'bg-gradient-to-r from-red-900/70 to-orange-900/70 border-red-500/50' : 'bg-gradient-to-r from-amber-900/50 to-orange-900/50 border-amber-700/30'
      }`}>
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-amber-500 to-orange-600 flex items-center justify-center">
            <ChefHat className="w-5 h-5 text-white" />
          </div>
          <div>
            <h1 className="text-lg font-bold text-white flex items-center gap-2">
              Cuisine
              {alert && <span className="text-xs bg-red-500 text-white px-2 py-0.5 rounded-full animate-bounce">NOUVELLE !</span>}
            </h1>
            <p className="text-xs text-amber-300/70">{kitchenOrders.length} commande(s)</p>
          </div>
        </div>
        <div className="flex items-center gap-4">
          <p className="text-2xl font-mono font-bold text-white">
            {currentTime.toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit', second: '2-digit' })}
          </p>
          <button onClick={() => dispatch({ type: 'SET_SCREEN', payload: 'select' })} className="p-2 text-amber-300/70 hover:text-white">
            <LogOut className="w-5 h-5" />
          </button>
        </div>
      </header>

      <div className="flex-1 overflow-y-auto p-4 md:p-6">
        {kitchenOrders.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-full text-slate-500">
            <ChefHat className="w-20 h-20 mb-4 opacity-20" />
            <p className="text-xl">Aucune commande en cuisine</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 2xl:grid-cols-4 gap-4">
            {kitchenOrders.map(({ ticket, foodItems, table }) => {
              const allReady = foodItems.every(i => i.status === 'ready' || i.status === 'served');
              const elapsed = Math.floor((currentTime.getTime() - new Date(ticket.createdAt).getTime()) / 60000);

              return (
                <div key={ticket.id} className={`rounded-2xl border-2 overflow-hidden ${
                  allReady ? 'border-emerald-500/50 bg-emerald-900/10' :
                  elapsed > 15 ? 'border-red-500/70 bg-red-900/20' :
                  'border-amber-500/30 bg-slate-800/80'
                }`}>
                  <div className={`p-3 flex items-center justify-between ${elapsed > 15 ? 'bg-red-500/20' : 'bg-slate-700/30'}`}>
                    <div className="flex items-center gap-2">
                      <span className="text-2xl font-bold text-white">{table?.name}</span>
                      <div className="w-5 h-5 rounded-full flex items-center justify-center text-white text-[10px] font-bold"
                        style={{ backgroundColor: state.servers.find(s => s.name === ticket.serverName)?.color || '#64748b' }}>
                        {ticket.serverName[0]}
                      </div>
                    </div>
                    <div className="flex items-center gap-1 px-2 py-1 rounded-full text-xs bg-slate-600/50 text-slate-300">
                      <Clock className="w-3 h-3" />
                      {elapsed} min
                    </div>
                  </div>

                  <div className="p-3 space-y-2">
                    {foodItems.map(item => (
                      <div key={item.id} className={`p-3 rounded-xl border ${
                        item.status === 'ready' ? 'bg-emerald-500/10 border-emerald-500/30' :
                        item.status === 'preparing' ? 'bg-blue-500/10 border-blue-500/30' :
                        'bg-slate-700/30 border-slate-600/30'
                      }`}>
                        <div className="flex items-start justify-between">
                          <div>
                            <div className="flex items-center gap-2">
                              <span className="text-lg">{item.menuItem.emoji}</span>
                              <span className="text-lg font-bold text-white">{item.quantity}x {item.menuItem.name}</span>
                            </div>
                            {item.notes && <p className="text-xs text-amber-400 mt-1 italic">📝 {item.notes}</p>}
                            {Object.keys(item.modifiers).length > 0 && (
                              <p className="text-xs text-blue-400 mt-1">
                                {Object.entries(item.modifiers).map(([k, v]) => `${k}: ${v}`).join(' • ')}
                              </p>
                            )}
                          </div>
                          {item.status === 'sent' && (
                            <button onClick={() => dispatch({ type: 'MARK_STATUS', payload: { ticketId: ticket.id, itemId: item.id, status: 'preparing' } })}
                              className="p-2 bg-blue-500/20 border border-blue-500/30 rounded-lg text-blue-400">
                              <Play className="w-4 h-4" />
                            </button>
                          )}
                          {item.status === 'preparing' && (
                            <button onClick={() => dispatch({ type: 'MARK_STATUS', payload: { ticketId: ticket.id, itemId: item.id, status: 'ready' } })}
                              className="p-2 bg-emerald-500/20 border border-emerald-500/30 rounded-lg text-emerald-400">
                              <Check className="w-4 h-4" />
                            </button>
                          )}
                          {item.status === 'ready' && (
                            <div className="p-2 bg-emerald-500/20 border border-emerald-500/30 rounded-lg">
                              <Check className="w-4 h-4 text-emerald-400" />
                            </div>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>

                  {!allReady && (
                    <div className="p-3 border-t border-slate-700/50">
                      <button
                        onClick={() => foodItems.forEach(i => {
                          if (i.status !== 'ready' && i.status !== 'served') {
                            dispatch({ type: 'MARK_STATUS', payload: { ticketId: ticket.id, itemId: i.id, status: 'ready' } });
                          }
                        })}
                        className="w-full py-2 bg-emerald-500/20 border border-emerald-500/30 text-emerald-400 rounded-xl text-sm font-medium flex items-center justify-center gap-2">
                        <Check className="w-4 h-4" /> Tout prêt
                      </button>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}

// ============================================
// ÉCRAN SERVEUR (TABLETTE)
// ============================================
function ServerScreen() {
  const { state, dispatch } = usePOS();
  const [view, setView] = useState<'tables' | 'order'>('tables');
  const [activeCategory, setActiveCategory] = useState('Tous');
  const [searchQuery, setSearchQuery] = useState('');
  const [showPayment, setShowPayment] = useState(false);
  const [selectedItems, setSelectedItems] = useState<Set<string>>(new Set());
  const [customAmount, setCustomAmount] = useState('');
  const [paymentMethod, setPaymentMethod] = useState<'CASH' | 'CARD'>('CASH');

  const server = state.currentServer;
  const currentTicket = state.tickets.find(t => t.id === state.currentTicketId);
  const currentTable = currentTicket ? state.tables.find(t => t.id === currentTicket.tableId) : null;

  const filteredItems = menuItems.filter(item => {
    const matchCat = activeCategory === 'Tous' || item.category === activeCategory;
    const matchSearch = item.name.toLowerCase().includes(searchQuery.toLowerCase());
    return matchCat && matchSearch;
  });

  const handleTableClick = (tableId: string) => {
    dispatch({ type: 'OPEN_TABLE', payload: tableId });
    setView('order');
  };

  const handleAddItem = (item: MenuItem) => {
    if (!state.currentTicketId) return;
    const ticketItem: TicketItem = {
      id: uuidv4(),
      menuItem: item,
      quantity: 1,
      notes: '',
      modifiers: {},
      status: 'pending',
    };
    dispatch({ type: 'ADD_ITEM', payload: { ticketId: state.currentTicketId, item: ticketItem } });
  };

  const handlePayment = (amount: number) => {
    if (!state.currentTicketId) return;
    dispatch({ type: 'ADD_PAYMENT', payload: { ticketId: state.currentTicketId, amount, method: paymentMethod } });
    setShowPayment(false);
    setSelectedItems(new Set());
    setCustomAmount('');
  };

  const totalPaid = currentTicket?.payments.reduce((sum, p) => sum + p.amount, 0) || 0;
  const remaining = (currentTicket?.totalAmount || 0) - totalPaid;

  // View tables
  if (view === 'tables' || !currentTicket) {
    return (
      <div className="h-screen flex flex-col bg-slate-900">
        <header className="h-14 bg-slate-800/90 border-b border-slate-700/50 flex items-center justify-between px-4 shrink-0">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-full flex items-center justify-center text-white text-sm font-bold"
              style={{ backgroundColor: server?.color || '#64748b' }}>
              {server?.name[0] || '?'}
            </div>
            <div>
              <p className="text-sm font-bold text-white">{server?.name || 'Serveur'}</p>
              <p className="text-[10px] text-slate-400">Tablette de commande</p>
            </div>
          </div>
          <button onClick={() => dispatch({ type: 'LOGOUT' })} className="p-2 text-slate-400 hover:text-white">
            <LogOut className="w-5 h-5" />
          </button>
        </header>

        <div className="flex-1 overflow-y-auto p-4">
          <h2 className="text-lg font-bold text-white mb-4 flex items-center gap-2">
            <Grid3X3 className="w-5 h-5 text-blue-400" /> Sélectionnez une table
          </h2>
          <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-6 gap-3">
            {state.tables.map(table => {
              const colors = getTableColors(table.status);
              return (
                <motion.button key={table.id} whileTap={{ scale: 0.93 }}
                  onClick={() => handleTableClick(table.id)}
                  className={`aspect-square rounded-2xl border-2 bg-gradient-to-br ${colors.bg} ${colors.border} flex flex-col items-center justify-center gap-1 p-3 relative`}>
                  <span className="text-xl font-bold text-white">{table.name}</span>
                  <span className="text-xs text-slate-400">{table.seats}p</span>
                  {table.status !== 'FREE' && (
                    <p className={`text-xs font-bold ${colors.text}`}>{table.totalToPay.toFixed(2)}€</p>
                  )}
                  {table.totalPaid > 0 && table.totalPaid < table.totalToPay && (
                    <div className="absolute top-1 left-1 px-1.5 py-0.5 bg-orange-500/80 rounded text-[9px] font-bold text-white">
                      PARTIEL
                    </div>
                  )}
                  {table.totalPaid >= table.totalToPay && table.totalToPay > 0 && (
                    <div className="absolute top-1 left-1 px-1.5 py-0.5 bg-green-500/80 rounded text-[9px] font-bold text-white">
                      PAYÉ
                    </div>
                  )}
                </motion.button>
              );
            })}
          </div>
        </div>
      </div>
    );
  }

  // View order
  return (
    <div className="h-screen flex flex-col md:flex-row bg-slate-900">
      {/* Menu */}
      <div className="flex-1 flex flex-col h-[55vh] md:h-full border-r border-slate-700/50">
        <div className="p-3 border-b border-slate-700/50 shrink-0">
          <div className="flex items-center justify-between mb-2">
            <button onClick={() => setView('tables')} className="flex items-center gap-1 text-slate-400 hover:text-white text-sm">
              <ArrowLeft className="w-4 h-4" /> Tables
            </button>
            <span className="text-lg font-bold text-white">{currentTable?.name}</span>
          </div>
          <div className="relative mb-2">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
            <input type="text" placeholder="Rechercher..." value={searchQuery} onChange={e => setSearchQuery(e.target.value)}
              className="w-full pl-9 pr-4 py-2 bg-slate-700/50 border border-slate-600/50 rounded-xl text-white placeholder-slate-400 text-sm focus:outline-none" />
          </div>
          <div className="flex gap-1.5 overflow-x-auto scrollbar-hide">
            <button onClick={() => setActiveCategory('Tous')}
              className={`px-3 py-1 rounded-full text-xs font-medium whitespace-nowrap ${activeCategory === 'Tous' ? 'bg-white text-slate-900' : 'bg-slate-700/50 text-slate-300'}`}>
              Tous
            </button>
            {categories.map(cat => (
              <button key={cat.name} onClick={() => setActiveCategory(cat.name)}
                className={`px-3 py-1 rounded-full text-xs font-medium whitespace-nowrap flex items-center gap-1 ${
                  activeCategory === cat.name ? 'text-white' : 'bg-slate-700/50 text-slate-300'
                }`}
                style={activeCategory === cat.name ? { backgroundColor: cat.color } : {}}>
                {cat.emoji} {cat.name}
              </button>
            ))}
          </div>
        </div>

        <div className="flex-1 overflow-y-auto p-3">
          <div className="grid grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-2">
            {filteredItems.map(item => (
              <motion.button key={item.id} whileTap={{ scale: 0.9 }}
                onClick={() => handleAddItem(item)}
                className="bg-slate-800/80 border border-slate-700/50 rounded-xl p-2 flex flex-col items-center justify-center gap-1 hover:border-slate-500/50">
                <span className="text-2xl">{item.emoji}</span>
                <span className="text-[10px] text-white font-medium text-center leading-tight">{item.name}</span>
                <span className="text-xs font-bold" style={{ color: item.color }}>{item.price.toFixed(2)}€</span>
              </motion.button>
            ))}
          </div>
        </div>
      </div>

      {/* Current Order */}
      <div className="flex-1 flex flex-col h-[45vh] md:h-full bg-slate-800/30">
        <div className="p-3 border-b border-slate-700/50 flex items-center justify-between shrink-0">
          <div>
            <h2 className="text-base font-bold text-white">Ticket • {currentTable?.name}</h2>
            <p className="text-xs text-slate-400">{server?.name}</p>
          </div>
          <button
            onClick={() => dispatch({ type: 'SEND_TO_KITCHEN', payload: state.currentTicketId! })}
            className="p-2 bg-blue-500/10 border border-blue-500/30 rounded-lg text-blue-400">
            <Send className="w-4 h-4" />
          </button>
        </div>

        <div className="flex-1 overflow-y-auto p-3 space-y-2">
          {currentTicket.items.length === 0 ? (
            <div className="text-center py-8 text-slate-500">
              <p className="text-3xl mb-2">🍽️</p>
              <p className="text-sm">Ajoutez des articles</p>
            </div>
          ) : (
            currentTicket.items.map(item => (
              <div key={item.id} className="bg-slate-700/30 rounded-xl p-3 border border-slate-600/30">
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <div className="flex items-center gap-2">
                      <span>{item.menuItem.emoji}</span>
                      <span className="text-sm font-medium text-white">{item.menuItem.name}</span>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <div className="flex items-center bg-slate-600/50 rounded-lg">
                      <button onClick={() => {
                        if (item.quantity <= 1) dispatch({ type: 'REMOVE_ITEM', payload: { ticketId: state.currentTicketId!, itemId: item.id } });
                        else dispatch({ type: 'UPDATE_QTY', payload: { ticketId: state.currentTicketId!, itemId: item.id, qty: item.quantity - 1 } });
                      }} className="p-1.5 hover:bg-slate-500/50 rounded-l-lg">
                        <Minus className="w-3 h-3 text-white" />
                      </button>
                      <span className="text-sm font-bold text-white w-5 text-center">{item.quantity}</span>
                      <button onClick={() => dispatch({ type: 'UPDATE_QTY', payload: { ticketId: state.currentTicketId!, itemId: item.id, qty: item.quantity + 1 } })}
                        className="p-1.5 hover:bg-slate-500/50 rounded-r-lg">
                        <Plus className="w-3 h-3 text-white" />
                      </button>
                    </div>
                    <span className="text-sm font-bold text-white min-w-[45px] text-right">
                      {(item.menuItem.price * item.quantity).toFixed(2)}€
                    </span>
                  </div>
                </div>
              </div>
            ))
          )}
        </div>

        {/* Total & Payment */}
        <div className="p-3 border-t border-slate-700/50 bg-slate-800/50 shrink-0">
          <div className="flex justify-between items-center mb-1">
            <span className="text-slate-400 text-sm">Total</span>
            <span className="text-xl font-bold text-emerald-400">{currentTicket.totalAmount.toFixed(2)} €</span>
          </div>
          {totalPaid > 0 && (
            <>
              <div className="flex justify-between items-center mb-1 text-xs">
                <span className="text-slate-400">Payé</span>
                <span className="text-green-400">{totalPaid.toFixed(2)} €</span>
              </div>
              {remaining > 0 && (
                <div className="flex justify-between items-center mb-1 text-xs">
                  <span className="text-slate-400">Reste</span>
                  <span className="text-orange-400">{remaining.toFixed(2)} €</span>
                </div>
              )}
            </>
          )}
          <button onClick={() => setShowPayment(true)} disabled={currentTicket.items.length === 0}
            className="w-full py-3 bg-gradient-to-r from-emerald-500 to-emerald-600 disabled:from-slate-600 disabled:to-slate-700 text-white rounded-xl font-bold active:scale-[0.98] transition-all">
            {totalPaid > 0 ? 'Paiement partiel' : 'Encaisser'}
          </button>
          {remaining <= 0 && totalPaid > 0 && (
            <button onClick={() => {
              dispatch({ type: 'CLOSE_TICKET', payload: state.currentTicketId! });
              setView('tables');
            }} className="w-full py-2 mt-2 bg-green-600 hover:bg-green-700 text-white rounded-xl font-bold text-sm">
              ✓ Fermer la table (tout payé)
            </button>
          )}
        </div>
      </div>

      {/* Payment Modal */}
      {showPayment && currentTicket && (
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }}
          className="fixed inset-0 bg-black/60 flex items-center justify-center z-50 p-4"
          onClick={() => setShowPayment(false)}>
          <motion.div initial={{ scale: 0.9 }} animate={{ scale: 1 }}
            className="bg-slate-800 rounded-2xl border border-slate-700 p-5 w-full max-w-lg max-h-[90vh] overflow-y-auto"
            onClick={e => e.stopPropagation()}>
            <h3 className="text-xl font-bold text-white mb-2">Paiement</h3>
            <p className="text-sm text-slate-400 mb-4">
              Total: {currentTicket.totalAmount.toFixed(2)}€ | Payé: {totalPaid.toFixed(2)}€ | Reste: {remaining.toFixed(2)}€
            </p>

            {/* Sélection articles */}
            <div className="mb-4">
              <div className="flex items-center justify-between mb-2">
                <h4 className="text-sm font-semibold text-white">Articles à payer</h4>
                <div className="flex gap-2">
                  <button onClick={() => setSelectedItems(new Set(currentTicket.items.map(i => i.id)))}
                    className="px-2 py-1 text-xs bg-blue-600 hover:bg-blue-700 rounded">Tout</button>
                  <button onClick={() => setSelectedItems(new Set())}
                    className="px-2 py-1 text-xs bg-slate-700 hover:bg-slate-600 rounded">Aucun</button>
                </div>
              </div>
              <div className="space-y-1 max-h-40 overflow-y-auto">
                {currentTicket.items.map(item => (
                  <div key={item.id} onClick={() => {
                    const newSet = new Set(selectedItems);
                    if (newSet.has(item.id)) newSet.delete(item.id);
                    else newSet.add(item.id);
                    setSelectedItems(newSet);
                    setCustomAmount('');
                  }} className={`p-2 rounded-lg border-2 cursor-pointer ${
                    selectedItems.has(item.id) ? 'border-blue-500 bg-blue-500/10' : 'border-slate-700 bg-slate-800'
                  }`}>
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <span>{item.menuItem.emoji}</span>
                        <span className="text-sm text-white">{item.quantity}x {item.menuItem.name}</span>
                      </div>
                      <span className="text-sm font-bold text-white">{(item.menuItem.price * item.quantity).toFixed(2)}€</span>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Montant personnalisé */}
            <div className="mb-4">
              <h4 className="text-sm font-semibold text-white mb-2">Ou montant personnalisé</h4>
              <div className="flex gap-2">
                <input type="number" value={customAmount} onChange={e => { setCustomAmount(e.target.value); setSelectedItems(new Set()); }}
                  placeholder="Montant exact" step="0.01"
                  className="flex-1 px-3 py-2 bg-slate-700 border border-slate-600 rounded-lg text-white text-sm focus:outline-none" />
                <button onClick={() => { setCustomAmount(remaining.toFixed(2)); setSelectedItems(new Set()); }}
                  className="px-3 py-2 bg-slate-700 hover:bg-slate-600 rounded-lg text-sm text-white">
                  Reste ({remaining.toFixed(2)}€)
                </button>
              </div>
            </div>

            {/* Méthode */}
            <div className="mb-4">
              <h4 className="text-sm font-semibold text-white mb-2">Méthode</h4>
              <div className="grid grid-cols-2 gap-2">
                <button onClick={() => setPaymentMethod('CASH')}
                  className={`p-3 rounded-lg border-2 ${paymentMethod === 'CASH' ? 'border-green-500 bg-green-500/10' : 'border-slate-700'}`}>
                  <Banknote className="w-6 h-6 mx-auto mb-1" />
                  <p className="text-sm text-white">Espèces</p>
                </button>
                <button onClick={() => setPaymentMethod('CARD')}
                  className={`p-3 rounded-lg border-2 ${paymentMethod === 'CARD' ? 'border-blue-500 bg-blue-500/10' : 'border-slate-700'}`}>
                  <CreditCard className="w-6 h-6 mx-auto mb-1" />
                  <p className="text-sm text-white">Carte</p>
                </button>
              </div>
            </div>

            {/* Résumé */}
            {(() => {
              const selectedAmount = currentTicket.items.filter(i => selectedItems.has(i.id)).reduce((sum, i) => sum + i.menuItem.price * i.quantity, 0);
              const amountToPay = customAmount ? parseFloat(customAmount) : selectedAmount;
              return (
                <>
                  <div className="bg-slate-900 rounded-lg p-3 mb-4">
                    <div className="flex justify-between">
                      <span className="text-slate-400">À encaisser:</span>
                      <span className="text-xl font-bold text-white">{amountToPay.toFixed(2)}€</span>
                    </div>
                  </div>
                  <button onClick={() => handlePayment(amountToPay)} disabled={amountToPay <= 0}
                    className="w-full py-3 bg-blue-600 hover:bg-blue-700 disabled:bg-slate-700 text-white rounded-xl font-bold">
                    Encaisser {amountToPay.toFixed(2)}€
                  </button>
                </>
              );
            })()}
          </motion.div>
        </motion.div>
      )}
    </div>
  );
}

// ============================================
// APP PRINCIPAL
// ============================================
function AppContent() {
  const { state } = usePOS();

  return (
    <>
      {state.screen === 'select' && <ScreenSelect />}
      {state.screen === 'main' && <MainScreen />}
      {state.screen === 'kitchen' && <KitchenScreen />}
      {state.screen === 'server' && <ServerScreen />}
    </>
  );
}

export default function App() {
  return (
    <POSProvider>
      <AppContent />
    </POSProvider>
  );
}
