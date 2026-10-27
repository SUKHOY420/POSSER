import React, { createContext, useContext, useReducer, ReactNode } from 'react';
import { Order, OrderItem, Table, Payment, ViewMode, MenuItem } from './types';
import { initialTables } from './data';
import { v4 as uuidv4 } from 'uuid';

interface State {
  tables: Table[];
  orders: Order[];
  currentView: ViewMode;
  selectedTableId: string | null;
  currentOrder: Order | null;
  server: string;
  cashBalance: number;
  dailyRevenue: number;
}

type Action =
  | { type: 'SET_VIEW'; payload: ViewMode }
  | { type: 'SELECT_TABLE'; payload: string }
  | { type: 'OPEN_TABLE'; payload: string }
  | { type: 'ADD_ITEM_TO_ORDER'; payload: { menuItem: MenuItem; notes?: string; modifiers?: Record<string, string> } }
  | { type: 'REMOVE_ITEM_FROM_ORDER'; payload: string }
  | { type: 'UPDATE_ITEM_QUANTITY'; payload: { itemId: string; quantity: number } }
  | { type: 'UPDATE_ITEM_NOTES'; payload: { itemId: string; notes: string } }
  | { type: 'SEND_ORDER_TO_KITCHEN' }
  | { type: 'PROCESS_PAYMENT'; payload: { method: Payment['method']; amount: number } }
  | { type: 'CLOSE_ORDER' }
  | { type: 'APPLY_DISCOUNT'; payload: number }
  | { type: 'TRANSFER_TABLE'; payload: { fromTableId: string; toTableId: string } }
  | { type: 'SET_TABLE_STATUS'; payload: { tableId: string; status: Table['status'] } }
  | { type: 'CLEAR_TABLE'; payload: string };

const initialState: State = {
  tables: initialTables,
  orders: [],
  currentView: 'dashboard',
  selectedTableId: null,
  currentOrder: null,
  server: 'Marie',
  cashBalance: 200,
  dailyRevenue: 0,
};

function reducer(state: State, action: Action): State {
  switch (action.type) {
    case 'SET_VIEW':
      return { ...state, currentView: action.payload, currentOrder: null, selectedTableId: null };

    case 'SELECT_TABLE':
      return { ...state, selectedTableId: action.payload };

    case 'OPEN_TABLE': {
      const table = state.tables.find(t => t.id === action.payload);
      if (!table) return state;
      
      const existingOrder = state.orders.find(o => o.tableId === action.payload && o.status === 'open');
      if (existingOrder) {
        return { ...state, currentOrder: existingOrder, selectedTableId: action.payload, currentView: 'order' };
      }
      
      const newOrder: Order = {
        id: uuidv4(),
        tableId: action.payload,
        items: [],
        status: 'open',
        createdAt: new Date(),
        server: state.server,
        payments: [],
        total: 0,
        discount: 0,
      };
      
      const updatedTables = state.tables.map(t =>
        t.id === action.payload ? { ...t, status: 'occupied' as const, currentOrder: newOrder.id } : t
      );
      
      return {
        ...state,
        tables: updatedTables,
        orders: [...state.orders, newOrder],
        currentOrder: newOrder,
        selectedTableId: action.payload,
        currentView: 'order',
      };
    }

    case 'ADD_ITEM_TO_ORDER': {
      if (!state.currentOrder) return state;
      const { menuItem, notes = '', modifiers = {} } = action.payload;
      
      const orderItem: OrderItem = {
        id: uuidv4(),
        menuItem,
        quantity: 1,
        notes,
        modifiers,
        status: 'pending',
      };
      
      const updatedOrder = {
        ...state.currentOrder,
        items: [...state.currentOrder.items, orderItem],
        total: calculateTotal([...state.currentOrder.items, orderItem], state.currentOrder.discount),
      };
      
      return {
        ...state,
        currentOrder: updatedOrder,
        orders: state.orders.map(o => o.id === updatedOrder.id ? updatedOrder : o),
      };
    }

    case 'REMOVE_ITEM_FROM_ORDER': {
      if (!state.currentOrder) return state;
      const updatedItems = state.currentOrder.items.filter(i => i.id !== action.payload);
      const updatedOrder = {
        ...state.currentOrder,
        items: updatedItems,
        total: calculateTotal(updatedItems, state.currentOrder.discount),
      };
      return {
        ...state,
        currentOrder: updatedOrder,
        orders: state.orders.map(o => o.id === updatedOrder.id ? updatedOrder : o),
      };
    }

    case 'UPDATE_ITEM_QUANTITY': {
      if (!state.currentOrder) return state;
      const updatedItems = state.currentOrder.items.map(i =>
        i.id === action.payload.itemId ? { ...i, quantity: Math.max(1, action.payload.quantity) } : i
      );
      const updatedOrder = {
        ...state.currentOrder,
        items: updatedItems,
        total: calculateTotal(updatedItems, state.currentOrder.discount),
      };
      return {
        ...state,
        currentOrder: updatedOrder,
        orders: state.orders.map(o => o.id === updatedOrder.id ? updatedOrder : o),
      };
    }

    case 'UPDATE_ITEM_NOTES': {
      if (!state.currentOrder) return state;
      const updatedItems = state.currentOrder.items.map(i =>
        i.id === action.payload.itemId ? { ...i, notes: action.payload.notes } : i
      );
      const updatedOrder = { ...state.currentOrder, items: updatedItems };
      return {
        ...state,
        currentOrder: updatedOrder,
        orders: state.orders.map(o => o.id === updatedOrder.id ? updatedOrder : o),
      };
    }

    case 'SEND_ORDER_TO_KITCHEN': {
      if (!state.currentOrder) return state;
      const updatedItems = state.currentOrder.items.map(i =>
        i.status === 'pending' ? { ...i, status: 'sent' as const } : i
      );
      const updatedOrder = { ...state.currentOrder, items: updatedItems };
      return {
        ...state,
        currentOrder: updatedOrder,
        orders: state.orders.map(o => o.id === updatedOrder.id ? updatedOrder : o),
      };
    }

    case 'PROCESS_PAYMENT': {
      if (!state.currentOrder) return state;
      const payment: Payment = {
        id: uuidv4(),
        method: action.payload.method,
        amount: action.payload.amount,
        timestamp: new Date(),
      };
      const updatedOrder = {
        ...state.currentOrder,
        payments: [...state.currentOrder.payments, payment],
        status: 'paid' as const,
        closedAt: new Date(),
      };
      
      const paidTotal = updatedOrder.payments.reduce((sum, p) => sum + p.amount, 0);
      const newCashBalance = action.payload.method === 'cash' 
        ? state.cashBalance + action.payload.amount 
        : state.cashBalance;
      
      return {
        ...state,
        currentOrder: updatedOrder,
        orders: state.orders.map(o => o.id === updatedOrder.id ? updatedOrder : o),
        cashBalance: newCashBalance,
        dailyRevenue: state.dailyRevenue + paidTotal,
      };
    }

    case 'APPLY_DISCOUNT': {
      if (!state.currentOrder) return state;
      const updatedOrder = {
        ...state.currentOrder,
        discount: action.payload,
        total: calculateTotal(state.currentOrder.items, action.payload),
      };
      return {
        ...state,
        currentOrder: updatedOrder,
        orders: state.orders.map(o => o.id === updatedOrder.id ? updatedOrder : o),
      };
    }

    case 'CLOSE_ORDER': {
      if (!state.currentOrder) return state;
      const updatedOrder = { ...state.currentOrder, status: 'closed' as const, closedAt: new Date() };
      return {
        ...state,
        currentOrder: null,
        selectedTableId: null,
        currentView: 'floor',
        orders: state.orders.map(o => o.id === updatedOrder.id ? updatedOrder : o),
      };
    }

    case 'TRANSFER_TABLE': {
      const { fromTableId, toTableId } = action.payload;
      const order = state.orders.find(o => o.tableId === fromTableId && o.status === 'open');
      if (!order) return state;
      
      const updatedOrders = state.orders.map(o =>
        o.id === order.id ? { ...o, tableId: toTableId } : o
      );
      const updatedTables = state.tables.map(t => {
        if (t.id === fromTableId) return { ...t, status: 'free' as const, currentOrder: undefined };
        if (t.id === toTableId) return { ...t, status: 'occupied' as const, currentOrder: order.id };
        return t;
      });
      
      return { ...state, tables: updatedTables, orders: updatedOrders };
    }

    case 'SET_TABLE_STATUS': {
      const updatedTables = state.tables.map(t =>
        t.id === action.payload.tableId ? { ...t, status: action.payload.status } : t
      );
      return { ...state, tables: updatedTables };
    }

    case 'CLEAR_TABLE': {
      const updatedTables = state.tables.map(t =>
        t.id === action.payload ? { ...t, status: 'free' as const, currentOrder: undefined } : t
      );
      return { ...state, tables: updatedTables };
    }

    default:
      return state;
  }
}

function calculateTotal(items: OrderItem[], discount: number): number {
  const subtotal = items.reduce((sum, item) => sum + (item.menuItem.price * item.quantity), 0);
  return subtotal * (1 - discount / 100);
}

interface ContextType {
  state: State;
  dispatch: React.Dispatch<Action>;
}

const POSContext = createContext<ContextType | undefined>(undefined);

export function POSProvider({ children }: { children: ReactNode }) {
  const [state, dispatch] = useReducer(reducer, initialState);
  return (
    <POSContext.Provider value={{ state, dispatch }}>
      {children}
    </POSContext.Provider>
  );
}

export function usePOS() {
  const context = useContext(POSContext);
  if (!context) throw new Error('usePOS must be used within POSProvider');
  return context;
}
