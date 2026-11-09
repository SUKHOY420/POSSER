import { MenuItem, Table, Server } from './types';

export const initialServers: Server[] = [
  { id: 'srv-1', name: 'Marie', pin: '1234', color: '#3b82f6', role: 'server' },
  { id: 'srv-2', name: 'Thomas', pin: '2345', color: '#8b5cf6', role: 'server' },
  { id: 'srv-3', name: 'Julie', pin: '3456', color: '#ec4899', role: 'server' },
  { id: 'srv-4', name: 'Karim', pin: '4567', color: '#f59e0b', role: 'server' },
  { id: 'srv-admin', name: 'Admin', pin: '0000', color: '#10b981', role: 'admin' },
];

export const initialMenuItems: MenuItem[] = [
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

export const initialTables: Table[] = [
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

export const categories = [
  { name: 'Entrées', emoji: '🥗', color: '#10b981' },
  { name: 'Plats', emoji: '🍽️', color: '#f59e0b' },
  { name: 'Desserts', emoji: '🍰', color: '#ec4899' },
  { name: 'Boissons', emoji: '🥤', color: '#3b82f6' },
  { name: 'Cocktails', emoji: '🍹', color: '#8b5cf6' },
  { name: 'Vins', emoji: '🍷', color: '#ef4444' },
  { name: 'Bières', emoji: '🍺', color: '#f97316' },
  { name: 'Cafés', emoji: '☕', color: '#92400e' },
];
