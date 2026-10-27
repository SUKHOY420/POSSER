export interface MenuItem {
  id: string;
  name: string;
  price: number;
  category: string;
  color: string;
  emoji: string;
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
  status: 'pending' | 'sent' | 'ready' | 'served';
}

export interface Order {
  id: string;
  tableId: string;
  items: OrderItem[];
  status: 'open' | 'closed' | 'paid';
  createdAt: Date;
  closedAt?: Date;
  server: string;
  payments: Payment[];
  total: number;
  discount: number;
}

export interface Payment {
  id: string;
  method: 'cash' | 'card' | 'split';
  amount: number;
  timestamp: Date;
}

export interface Table {
  id: string;
  name: string;
  seats: number;
  x: number;
  y: number;
  width: number;
  height: number;
  status: 'free' | 'occupied' | 'reserved' | 'cleaning';
  currentOrder?: string;
}

export interface Category {
  id: string;
  name: string;
  emoji: string;
  color: string;
}

export type ViewMode = 'dashboard' | 'floor' | 'order' | 'reports' | 'settings';
