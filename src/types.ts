export interface MenuItem {
  id: string;
  name: string;
  price: number;
  category: string;
  color: string;
  emoji: string;
  isFood: boolean;
  modifiers?: Modifier[];
}

export interface Modifier {
  id: string;
  name: string;
  options: string[];
  required: boolean;
}

export interface OrderItem {
  id: string;
  menuItem: MenuItem;
  quantity: number;
  notes: string;
  modifiers: Record<string, string>;
  status: 'pending' | 'sent' | 'preparing' | 'ready' | 'served';
  sentAt?: Date;
  readyAt?: Date;
}

export interface Payment {
  id: string;
  method: 'cash' | 'card';
  amount: number;
  timestamp: Date;
}

export interface Order {
  id: string;
  tableId: string;
  items: OrderItem[];
  status: 'open' | 'closed' | 'paid';
  createdAt: Date;
  closedAt?: Date;
  serverId: string;
  serverName: string;
  payments: Payment[];
  subtotal: number;
  discount: number;
  total: number;
}

export interface Table {
  id: string;
  name: string;
  seats: number;
  status: 'free' | 'occupied' | 'reserved' | 'cleaning';
  currentOrderId?: string;
}

export interface Server {
  id: string;
  name: string;
  pin: string;
  role: 'admin' | 'server' | 'kitchen';
  color: string;
  isActive: boolean;
}

export interface Category {
  id: string;
  name: string;
  emoji: string;
  color: string;
}

export type ScreenType = 'select' | 'main' | 'kitchen' | 'server' | 'close';

export interface Session {
  id: string;
  date: Date;
  openedAt: Date;
  closedAt?: Date;
  totalRevenue: number;
  totalCash: number;
  totalCard: number;
  totalOrders: number;
  serverTotals: Record<string, { name: string; orders: number; revenue: number; cash: number; card: number }>;
}
