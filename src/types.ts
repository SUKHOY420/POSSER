// ============================================
// TYPES - Architecture Ticket-based avec Admin
// ============================================

export interface MenuItem {
  id: string;
  name: string;
  price: number;
  category: string;
  color: string;
  emoji: string;
  isFood: boolean;
  modifiers?: { id: string; name: string; options: string[]; required: boolean }[];
}

export interface TicketItem {
  id: string;
  menuItem: MenuItem;
  quantity: number;
  notes: string;
  modifiers: Record<string, string>;
  status: 'pending' | 'validated' | 'sent' | 'preparing' | 'ready' | 'served';
  validatedAt?: Date;
  sentAt?: Date;
}

export interface Payment {
  id: string;
  ticketId: string;
  amount: number;
  method: 'CASH' | 'CARD';
  transactionRef?: string;
  timestamp: Date;
}

export interface Ticket {
  id: string;
  tableId: string;
  items: TicketItem[];
  status: 'DRAFT' | 'OPEN' | 'PAID' | 'CANCELLED';
  totalAmount: number;
  paidAmount: number;
  createdAt: Date;
  validatedAt?: Date;
  closedAt?: Date;
  serverId: string;
  serverName: string;
  payments: Payment[];
  discount: number;
}

export type TableStatus = 'FREE' | 'OCCUPIED' | 'PARTIALLY_PAID' | 'RESERVED' | 'CLEANING';

export interface Table {
  id: string;
  name: string;
  seats: number;
  status: TableStatus;
  ticketIds: string[];
  totalToPay: number;
  totalPaid: number;
}

export interface Server {
  id: string;
  name: string;
  pin: string;
  color: string;
  role: 'admin' | 'server';
}

export type ScreenType = 'select' | 'main' | 'kitchen' | 'bar' | 'server' | 'admin';

export interface TicketFormat {
  showLogo: boolean;
  showAddress: boolean;
  showPhone: boolean;
  showServer: boolean;
  showDate: boolean;
  showItems: boolean;
  showTotal: boolean;
  showPayment: boolean;
  showFooter: boolean;
  footerText: string;
}

export interface Session {
  id: string;
  openedAt: Date;
  closedAt?: Date;
  openedBy: string;
  closedBy?: string;
  initialCash: number;
  finalCash?: number;
  totalRevenue: number;
  totalCash: number;
  totalCard: number;
  ticketCount: number;
  notes?: string;
}

export interface AppState {
  screen: ScreenType;
  tables: Table[];
  tickets: Ticket[];
  servers: Server[];
  menuItems: MenuItem[];
  currentServer: Server | null;
  currentTicketId: string | null;
  cashBalance: number;
  ticketFormat: TicketFormat;
  currentSession: Session | null;
  closedSessions: Session[];
}
