import React, { createContext, useContext, useReducer, ReactNode, useEffect } from 'react';
import { Order, OrderItem, Table, Payment, ScreenType, Server, Session } from './types';
import { initialTables, servers } from './data';
import { v4 as uuidv4 } from 'uuid';
import { syncManager } from './lib/sync';

interface State {
  screen: ScreenType;
  tables: Table[];
  orders: Order[];
  servers: Server[];
  currentServer: Server | null;
  currentOrderId: string | null;
  currentTableId: string | null;
  cashBalance: number;
  session: Session;
  closedSessions: Session[];
}

type Action =
  | { type: 'SET_SCREEN'; payload: ScreenType }
  | { type: 'LOGIN_SERVER'; payload: Server }
  | { type: 'LOGOUT_SERVER' }
  | { type: 'OPEN_TABLE'; payload: string }
  | { type: 'ADD_ITEM'; payload: { orderId: string; item: OrderItem } }
  | { type: 'REMOVE_ITEM'; payload: { orderId: string; itemId: string } }
  | { type: 'UPDATE_QTY'; payload: { orderId: string; itemId: string; qty: number } }
  | { type: 'UPDATE_NOTES'; payload: { orderId: string; itemId: string; notes: string } }
  | { type: 'SEND_TO_KITCHEN'; payload: string }
  | { type: 'MARK_PREPARING'; payload: { orderId: string; itemId: string } }
  | { type: 'MARK_READY'; payload: { orderId: string; itemId: string } }
  | { type: 'MARK_SERVED'; payload: { orderId: string; itemId: string } }
  | { type: 'APPLY_DISCOUNT'; payload: { orderId: string; discount: number } }
  | { type: 'ADD_PAYMENT'; payload: { orderId: string; amount: number; method: 'cash' | 'card' } }
  | { type: 'CLOSE_ORDER'; payload: string }
  | { type: 'SET_TABLE_STATUS'; payload: { tableId: string; status: Table['status'] } }
  | { type: 'TRANSFER_TABLE'; payload: { fromId: string; toId: string } }
  | { type: 'CLOSE_SESSION' }
  // Sync actions
  | { type: 'SYNC_ADD_ORDER'; payload: Order }
  | { type: 'SYNC_UPDATE_ORDER'; payload: Order }
  | { type: 'SYNC_CLOSE_ORDER'; payload: string }
  | { type: 'SYNC_ADD_ITEM'; payload: { orderId: string; item: OrderItem } }
  | { type: 'SYNC_REMOVE_ITEM'; payload: { orderId: string; itemId: string } }
  | { type: 'SYNC_UPDATE_ITEM'; payload: { orderId: string; itemId: string; updates: Partial<OrderItem> } }
  | { type: 'SYNC_SEND_TO_KITCHEN'; payload: string }
  | { type: 'SYNC_ITEM_STATUS'; payload: { orderId: string; itemId: string; status: OrderItem['status'] } }
  | { type: 'SYNC_TABLE_STATUS'; payload: { tableId: string; status: Table['status'] } }
  | { type: 'SYNC_PAYMENT'; payload: { orderId: string; method: 'cash' | 'card'; amount: number } };

function createSession(): Session {
  return {
    id: uuidv4(),
    date: new Date(),
    openedAt: new Date(),
    totalRevenue: 0,
    totalCash: 0,
    totalCard: 0,
    totalOrders: 0,
    serverTotals: {},
  };
}

const initialState: State = {
  screen: 'select',
  tables: initialTables,
  orders: [],
  servers: servers,
  currentServer: null,
  currentOrderId: null,
  currentTableId: null,
  cashBalance: 200,
  session: createSession(),
  closedSessions: [],
};

function calcSubtotal(items: OrderItem[]): number {
  return items.reduce((sum, i) => sum + i.menuItem.price * i.quantity, 0);
}

function calcTotal(subtotal: number, discount: number): number {
  return subtotal * (1 - discount / 100);
}

function updateSessionFromOrder(session: Session, order: Order): Session {
  const newSession = { ...session };
  const serverId = order.serverId;
  
  if (!newSession.serverTotals[serverId]) {
    newSession.serverTotals[serverId] = {
      name: order.serverName,
      orders: 0,
      revenue: 0,
      cash: 0,
      card: 0,
    };
  }
  
  newSession.serverTotals[serverId].orders++;
  newSession.serverTotals[serverId].revenue += order.total;
  newSession.totalOrders++;
  newSession.totalRevenue += order.total;
  
  order.payments.forEach(p => {
    if (p.method === 'cash') {
      newSession.totalCash += p.amount;
      newSession.serverTotals[serverId].cash += p.amount;
    } else {
      newSession.totalCard += p.amount;
      newSession.serverTotals[serverId].card += p.amount;
    }
  });
  
  return newSession;
}

function reducer(state: State, action: Action): State {
  switch (action.type) {
    case 'SET_SCREEN':
      return { ...state, screen: action.payload };

    case 'LOGIN_SERVER':
      return { ...state, currentServer: action.payload };

    case 'LOGOUT_SERVER':
      return { ...state, currentServer: null, currentOrderId: null, currentTableId: null, screen: 'select' };

    case 'OPEN_TABLE': {
      const tableId = action.payload;
      const table = state.tables.find(t => t.id === tableId);
      if (!table) return state;

      const existingOrder = state.orders.find(o => o.tableId === tableId && o.status === 'open');
      if (existingOrder) {
        return {
          ...state,
          currentOrderId: existingOrder.id,
          currentTableId: tableId,
        };
      }

      if (!state.currentServer) return state;

      const newOrder: Order = {
        id: uuidv4(),
        tableId,
        items: [],
        status: 'open',
        createdAt: new Date(),
        serverId: state.currentServer.id,
        serverName: state.currentServer.name,
        payments: [],
        subtotal: 0,
        discount: 0,
        total: 0,
      };

      const updatedTables = state.tables.map(t =>
        t.id === tableId ? { ...t, status: 'occupied' as const, currentOrderId: newOrder.id } : t
      );

      return {
        ...state,
        tables: updatedTables,
        orders: [...state.orders, newOrder],
        currentOrderId: newOrder.id,
        currentTableId: tableId,
      };
    }

    case 'ADD_ITEM': {
      const { orderId, item } = action.payload;
      const updatedOrders = state.orders.map(o => {
        if (o.id !== orderId) return o;
        const newItems = [...o.items, item];
        const subtotal = calcSubtotal(newItems);
        return { ...o, items: newItems, subtotal, total: calcTotal(subtotal, o.discount) };
      });
      return { ...state, orders: updatedOrders };
    }

    case 'REMOVE_ITEM': {
      const { orderId, itemId } = action.payload;
      const updatedOrders = state.orders.map(o => {
        if (o.id !== orderId) return o;
        const newItems = o.items.filter(i => i.id !== itemId);
        const subtotal = calcSubtotal(newItems);
        return { ...o, items: newItems, subtotal, total: calcTotal(subtotal, o.discount) };
      });
      return { ...state, orders: updatedOrders };
    }

    case 'UPDATE_QTY': {
      const { orderId, itemId, qty } = action.payload;
      const updatedOrders = state.orders.map(o => {
        if (o.id !== orderId) return o;
        const newItems = o.items.map(i =>
          i.id === itemId ? { ...i, quantity: Math.max(1, qty) } : i
        );
        const subtotal = calcSubtotal(newItems);
        return { ...o, items: newItems, subtotal, total: calcTotal(subtotal, o.discount) };
      });
      return { ...state, orders: updatedOrders };
    }

    case 'UPDATE_NOTES': {
      const { orderId, itemId, notes } = action.payload;
      const updatedOrders = state.orders.map(o => {
        if (o.id !== orderId) return o;
        const newItems = o.items.map(i =>
          i.id === itemId ? { ...i, notes } : i
        );
        return { ...o, items: newItems };
      });
      return { ...state, orders: updatedOrders };
    }

    case 'SEND_TO_KITCHEN': {
      const orderId = action.payload;
      const updatedOrders = state.orders.map(o => {
        if (o.id !== orderId) return o;
        const newItems = o.items.map(i =>
          i.status === 'pending' ? { ...i, status: 'sent' as const, sentAt: new Date() } : i
        );
        return { ...o, items: newItems };
      });
      return { ...state, orders: updatedOrders };
    }

    case 'MARK_PREPARING': {
      const { orderId, itemId } = action.payload;
      const updatedOrders = state.orders.map(o => {
        if (o.id !== orderId) return o;
        const newItems = o.items.map(i =>
          i.id === itemId ? { ...i, status: 'preparing' as const } : i
        );
        return { ...o, items: newItems };
      });
      return { ...state, orders: updatedOrders };
    }

    case 'MARK_READY': {
      const { orderId, itemId } = action.payload;
      const updatedOrders = state.orders.map(o => {
        if (o.id !== orderId) return o;
        const newItems = o.items.map(i =>
          i.id === itemId ? { ...i, status: 'ready' as const, readyAt: new Date() } : i
        );
        return { ...o, items: newItems };
      });
      return { ...state, orders: updatedOrders };
    }

    case 'MARK_SERVED': {
      const { orderId, itemId } = action.payload;
      const updatedOrders = state.orders.map(o => {
        if (o.id !== orderId) return o;
        const newItems = o.items.map(i =>
          i.id === itemId ? { ...i, status: 'served' as const } : i
        );
        return { ...o, items: newItems };
      });
      return { ...state, orders: updatedOrders };
    }

    case 'APPLY_DISCOUNT': {
      const { orderId, discount } = action.payload;
      const updatedOrders = state.orders.map(o => {
        if (o.id !== orderId) return o;
        return { ...o, discount, total: calcTotal(o.subtotal, discount) };
      });
      return { ...state, orders: updatedOrders };
    }

    case 'ADD_PAYMENT': {
      const { orderId, method, amount } = action.payload;
      const payment: Payment = {
        id: uuidv4(),
        method,
        amount,
        timestamp: new Date(),
      };
      const updatedOrders = state.orders.map(o => {
        if (o.id !== orderId) return o;
        return { ...o, payments: [...o.payments, payment] };
      });

      const cashDelta = method === 'cash' ? amount : 0;

      // Mettre à jour le statut de paiement de la table
      const order = state.orders.find(o => o.id === orderId);
      let updatedTables = state.tables;
      if (order) {
        const totalPaid = order.payments.reduce((sum, p) => sum + p.amount, 0) + amount;
        const isFullyPaid = totalPaid >= order.total;
        
        updatedTables = state.tables.map(t => {
          if (t.id !== order.tableId) return t;
          return {
            ...t,
            paymentStatus: isFullyPaid ? 'paid' : totalPaid > 0 ? 'partial' : 'unpaid',
            paidAmount: totalPaid,
          };
        });
      }

      return {
        ...state,
        orders: updatedOrders,
        tables: updatedTables,
        cashBalance: state.cashBalance + cashDelta,
      };
    }

    case 'CLOSE_ORDER': {
      const orderId = action.payload;
      const order = state.orders.find(o => o.id === orderId);
      if (!order) return state;

      const updatedOrders = state.orders.map(o =>
        o.id === orderId ? { ...o, status: 'closed' as const, closedAt: new Date() } : o
      );

      const updatedTables = state.tables.map(t =>
        t.id === order.tableId ? { ...t, status: 'free' as const, currentOrderId: undefined } : t
      );

      const newSession = updateSessionFromOrder(state.session, { ...order, status: 'closed', closedAt: new Date() });

      return {
        ...state,
        orders: updatedOrders,
        tables: updatedTables,
        session: newSession,
        currentOrderId: null,
        currentTableId: null,
      };
    }

    case 'SET_TABLE_STATUS': {
      const { tableId, status } = action.payload;
      const updatedTables = state.tables.map(t =>
        t.id === tableId ? { ...t, status } : t
      );
      return { ...state, tables: updatedTables };
    }

    case 'TRANSFER_TABLE': {
      const { fromId, toId } = action.payload;
      const order = state.orders.find(o => o.tableId === fromId && o.status === 'open');
      if (!order) return state;

      const updatedOrders = state.orders.map(o =>
        o.id === order.id ? { ...o, tableId: toId } : o
      );
      const updatedTables = state.tables.map(t => {
        if (t.id === fromId) return { ...t, status: 'free' as const, currentOrderId: undefined };
        if (t.id === toId) return { ...t, status: 'occupied' as const, currentOrderId: order.id };
        return t;
      });

      return { ...state, tables: updatedTables, orders: updatedOrders };
    }

    case 'CLOSE_SESSION': {
      const closedSession = { ...state.session, closedAt: new Date() };
      return {
        ...state,
        closedSessions: [...state.closedSessions, closedSession],
        session: createSession(),
        orders: [],
        tables: initialTables,
        cashBalance: 200,
        screen: 'select',
        currentServer: null,
        currentOrderId: null,
        currentTableId: null,
      };
    }

    // ===== SYNC ACTIONS =====
    
    case 'SYNC_ADD_ORDER': {
      const newOrder = action.payload;
      if (state.orders.find(o => o.id === newOrder.id)) return state;
      const updatedTables = state.tables.map(t =>
        t.id === newOrder.tableId ? { ...t, status: 'occupied' as const, currentOrderId: newOrder.id } : t
      );
      return {
        ...state,
        orders: [...state.orders, newOrder],
        tables: updatedTables,
      };
    }

    case 'SYNC_UPDATE_ORDER': {
      const updatedOrder = action.payload;
      return {
        ...state,
        orders: state.orders.map(o => o.id === updatedOrder.id ? updatedOrder : o),
      };
    }

    case 'SYNC_CLOSE_ORDER': {
      const orderId = action.payload;
      const order = state.orders.find(o => o.id === orderId);
      if (!order) return state;
      const updatedOrders = state.orders.map(o =>
        o.id === orderId ? { ...o, status: 'closed' as const, closedAt: new Date() } : o
      );
      const updatedTables = state.tables.map(t =>
        t.id === order.tableId ? { ...t, status: 'free' as const, currentOrderId: undefined } : t
      );
      const newSession = updateSessionFromOrder(state.session, { ...order, status: 'closed', closedAt: new Date() });
      return {
        ...state,
        orders: updatedOrders,
        tables: updatedTables,
        session: newSession,
      };
    }

    case 'SYNC_ADD_ITEM': {
      const { orderId, item } = action.payload;
      const updatedOrders = state.orders.map(o => {
        if (o.id !== orderId) return o;
        const newItems = [...o.items, item];
        const subtotal = calcSubtotal(newItems);
        return { ...o, items: newItems, subtotal, total: calcTotal(subtotal, o.discount) };
      });
      return { ...state, orders: updatedOrders };
    }

    case 'SYNC_REMOVE_ITEM': {
      const { orderId, itemId } = action.payload;
      const updatedOrders = state.orders.map(o => {
        if (o.id !== orderId) return o;
        const newItems = o.items.filter(i => i.id !== itemId);
        const subtotal = calcSubtotal(newItems);
        return { ...o, items: newItems, subtotal, total: calcTotal(subtotal, o.discount) };
      });
      return { ...state, orders: updatedOrders };
    }

    case 'SYNC_UPDATE_ITEM': {
      const { orderId, itemId, updates } = action.payload;
      const updatedOrders = state.orders.map(o => {
        if (o.id !== orderId) return o;
        const newItems = o.items.map(i =>
          i.id === itemId ? { ...i, ...updates } : i
        );
        const subtotal = calcSubtotal(newItems);
        return { ...o, items: newItems, subtotal, total: calcTotal(subtotal, o.discount) };
      });
      return { ...state, orders: updatedOrders };
    }

    case 'SYNC_SEND_TO_KITCHEN': {
      const orderId = action.payload;
      const updatedOrders = state.orders.map(o => {
        if (o.id !== orderId) return o;
        const newItems = o.items.map(i =>
          i.status === 'pending' ? { ...i, status: 'sent' as const, sentAt: new Date() } : i
        );
        return { ...o, items: newItems };
      });
      return { ...state, orders: updatedOrders };
    }

    case 'SYNC_ITEM_STATUS': {
      const { orderId, itemId, status } = action.payload;
      const updatedOrders = state.orders.map(o => {
        if (o.id !== orderId) return o;
        const newItems = o.items.map(i =>
          i.id === itemId ? { ...i, status } : i
        );
        return { ...o, items: newItems };
      });
      return { ...state, orders: updatedOrders };
    }

    case 'SYNC_TABLE_STATUS': {
      const { tableId, status } = action.payload;
      const updatedTables = state.tables.map(t =>
        t.id === tableId ? { ...t, status: status as Table['status'] } : t
      );
      return { ...state, tables: updatedTables };
    }

    case 'SYNC_PAYMENT': {
      const { orderId, method, amount } = action.payload;
      const payment: Payment = {
        id: uuidv4(),
        method,
        amount,
        timestamp: new Date(),
      };
      const updatedOrders = state.orders.map(o => {
        if (o.id !== orderId) return o;
        return { ...o, payments: [...o.payments, payment] };
      });
      const cashDelta = method === 'cash' ? amount : 0;
      return {
        ...state,
        orders: updatedOrders,
        cashBalance: state.cashBalance + cashDelta,
      };
    }

    default:
      return state;
  }
}

interface ContextType {
  state: State;
  dispatch: React.Dispatch<Action>;
}

const POSContext = createContext<ContextType | undefined>(undefined);

export function POSProvider({ children }: { children: ReactNode }) {
  const [state, dispatch] = useReducer(reducer, initialState);
  
  // Ref pour garder le state le plus récent
  const stateRef = React.useRef(state);
  stateRef.current = state;

  // Wrapper dispatch qui broadcast les changements
  const syncDispatch = React.useCallback((action: Action) => {
    // Dispatch local
    dispatch(action);

    // Broadcast aux autres postes (sauf pour les actions SYNC)
    if (action.type.startsWith('SYNC_')) return;

    const currentState = stateRef.current;

    switch (action.type) {
      case 'OPEN_TABLE': {
        // Broadcast la table occupée immédiatement
        syncManager.broadcast('TABLE_STATUS_CHANGED', { tableId: action.payload, status: 'occupied' });
        
        // Créer l'ordre et le broadcaster après un court délai
        // pour laisser le reducer mettre à jour le state
        setTimeout(() => {
          const latestState = stateRef.current;
          const order = latestState.orders.find(o => o.tableId === action.payload && o.status === 'open');
          if (order) {
            syncManager.broadcast('ORDER_CREATED', { order });
          }
        }, 50);
        break;
      }

      case 'ADD_ITEM':
        syncManager.broadcast('ITEM_ADDED', action.payload);
        break;

      case 'REMOVE_ITEM':
        syncManager.broadcast('ITEM_REMOVED', action.payload);
        break;

      case 'UPDATE_QTY':
        syncManager.broadcast('ITEM_UPDATED', { 
          orderId: action.payload.orderId, 
          itemId: action.payload.itemId, 
          updates: { quantity: action.payload.qty } 
        });
        break;

      case 'UPDATE_NOTES':
        syncManager.broadcast('ITEM_UPDATED', { 
          orderId: action.payload.orderId, 
          itemId: action.payload.itemId, 
          updates: { notes: action.payload.notes } 
        });
        break;

      case 'SEND_TO_KITCHEN':
        syncManager.broadcast('ORDER_SENT_TO_KITCHEN', { orderId: action.payload });
        const kitchenOrder = currentState.orders.find(o => o.id === action.payload);
        if (kitchenOrder) {
          const table = currentState.tables.find(t => t.id === kitchenOrder.tableId);
          syncManager.broadcast('KITCHEN_NOTIFICATION', { 
            orderId: action.payload, 
            message: `Nouvelle commande ${table?.name || '?'} par ${kitchenOrder.serverName}` 
          });
        }
        break;

      case 'MARK_PREPARING':
      case 'MARK_READY':
      case 'MARK_SERVED': {
        const status = action.type === 'MARK_PREPARING' ? 'preparing' : 
                       action.type === 'MARK_READY' ? 'ready' : 'served';
        syncManager.broadcast('ITEM_STATUS_CHANGED', { 
          orderId: action.payload.orderId, 
          itemId: action.payload.itemId, 
          status 
        });
        if (status === 'ready') {
          const readyOrder = currentState.orders.find(o => o.id === action.payload.orderId);
          if (readyOrder) {
            const table = currentState.tables.find(t => t.id === readyOrder.tableId);
            syncManager.broadcast('SERVER_NOTIFICATION', { 
              message: `Commande ${table?.name || '?'} prête !`, 
              from: 'Cuisine' 
            });
          }
        }
        break;
      }

      case 'ADD_PAYMENT':
        syncManager.broadcast('PAYMENT_PROCESSED', action.payload);
        break;

      case 'CLOSE_ORDER':
        syncManager.broadcast('ORDER_CLOSED', { orderId: action.payload });
        const closedOrder = currentState.orders.find(o => o.id === action.payload);
        if (closedOrder) {
          syncManager.broadcast('TABLE_STATUS_CHANGED', { tableId: closedOrder.tableId, status: 'free' });
        }
        break;

      case 'SET_TABLE_STATUS':
        syncManager.broadcast('TABLE_STATUS_CHANGED', action.payload);
        break;
    }
  }, []);

  // Initialiser la synchronisation
  useEffect(() => {
    if (state.screen === 'main' || state.screen === 'kitchen' || state.screen === 'server') {
      const postType = state.screen as 'main' | 'kitchen' | 'server';
      const serverName = state.currentServer?.name || '';
      syncManager.initialize(postType, serverName);
    }
  }, [state.screen, state.currentServer]);

  // Écouter les événements de synchronisation
  useEffect(() => {
    const unsubs: (() => void)[] = [];

    unsubs.push(syncManager.on('ORDER_CREATED', (payload: any) => {
      console.log('[Store] Reçu ORDER_CREATED:', payload);
      dispatch({ type: 'SYNC_ADD_ORDER', payload: payload.order });
    }));

    unsubs.push(syncManager.on('ORDER_UPDATED', (payload: any) => {
      dispatch({ type: 'SYNC_UPDATE_ORDER', payload: payload.order });
    }));

    unsubs.push(syncManager.on('ORDER_CLOSED', (payload: any) => {
      dispatch({ type: 'SYNC_CLOSE_ORDER', payload: payload.orderId });
    }));

    unsubs.push(syncManager.on('ITEM_ADDED', (payload: any) => {
      dispatch({ type: 'SYNC_ADD_ITEM', payload });
    }));

    unsubs.push(syncManager.on('ITEM_REMOVED', (payload: any) => {
      dispatch({ type: 'SYNC_REMOVE_ITEM', payload });
    }));

    unsubs.push(syncManager.on('ITEM_UPDATED', (payload: any) => {
      dispatch({ type: 'SYNC_UPDATE_ITEM', payload });
    }));

    unsubs.push(syncManager.on('ORDER_SENT_TO_KITCHEN', (payload: any) => {
      dispatch({ type: 'SYNC_SEND_TO_KITCHEN', payload: payload.orderId });
    }));

    unsubs.push(syncManager.on('ITEM_STATUS_CHANGED', (payload: any) => {
      dispatch({ type: 'SYNC_ITEM_STATUS', payload });
    }));

    unsubs.push(syncManager.on('TABLE_STATUS_CHANGED', (payload: any) => {
      dispatch({ type: 'SYNC_TABLE_STATUS', payload });
    }));

    unsubs.push(syncManager.on('PAYMENT_PROCESSED', (payload: any) => {
      dispatch({ type: 'SYNC_PAYMENT', payload });
    }));

    return () => {
      unsubs.forEach(unsub => unsub());
    };
  }, []);

  return (
    <POSContext.Provider value={{ state, dispatch: syncDispatch }}>
      {children}
    </POSContext.Provider>
  );
}

export function usePOS() {
  const context = useContext(POSContext);
  if (!context) throw new Error('usePOS must be used within POSProvider');
  return context;
}
