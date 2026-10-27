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

export interface TicketItem {
  id: string;
  menuItem: MenuItem;
  quantity: number;
  notes: string;
  modifiers: Record<string, string>;
  status: 'pending' | 'sent' | 'preparing' | 'ready' | 'served';
  sentAt?: Date;
  readyAt?: Date;
}

// Un Ticket = une addition. Une table peut avoir plusieurs tickets (paiements séparés)
export interface Ticket {
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

export interface Payment {
  id: string;
  ticketId: string;
  amount: number;
  method: 'CASH' | 'CARD';
  transactionRef?: string;
  timestamp: Date;
}

export interface Table {
  id: string;
  name: string;
  seats: number;
  status: 'FREE' | 'OCCUPIED' | 'PARTIALLY_PAID' | 'RESERVED' | 'CLEANING';
  ticketIds: string[]; // Une table peut avoir plusieurs tickets
  totalToPay: number;
  totalPaid: number;
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

export type ScreenType = 'select' | 'main' | 'kitchen' | 'server' | 'close' | 'hardware';

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

// Queue d'actions pour gestion hors-ligne
export interface PendingAction {
  id: string;
  type: string;
  payload: any;
  timestamp: Date;
  retryCount: number;
}
