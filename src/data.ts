import { MenuItem, Table, Category } from './types';

export const categories: Category[] = [
  { id: 'cat-1', name: 'Entrées', emoji: '🥗', color: '#10b981' },
  { id: 'cat-2', name: 'Plats', emoji: '🍽️', color: '#f59e0b' },
  { id: 'cat-3', name: 'Desserts', emoji: '🍰', color: '#ec4899' },
  { id: 'cat-4', name: 'Boissons', emoji: '🥤', color: '#3b82f6' },
  { id: 'cat-5', name: 'Cocktails', emoji: '🍹', color: '#8b5cf6' },
  { id: 'cat-6', name: 'Vins', emoji: '🍷', color: '#ef4444' },
  { id: 'cat-7', name: 'Bières', emoji: '🍺', color: '#f97316' },
  { id: 'cat-8', name: 'Cafés', emoji: '☕', color: '#92400e' },
];

export const menuItems: MenuItem[] = [
  // Entrées
  { id: 'item-1', name: 'Salade César', price: 9.50, category: 'Entrées', color: '#10b981', emoji: '🥗' },
  { id: 'item-2', name: 'Soupe à l\'oignon', price: 7.00, category: 'Entrées', color: '#10b981', emoji: '🍲' },
  { id: 'item-3', name: 'Bruschetta', price: 8.00, category: 'Entrées', color: '#10b981', emoji: '🍞' },
  { id: 'item-4', name: 'Carpaccio', price: 12.00, category: 'Entrées', color: '#10b981', emoji: '🥩' },
  { id: 'item-5', name: 'Mozzarella', price: 8.50, category: 'Entrées', color: '#10b981', emoji: '🧀' },
  { id: 'item-6', name: 'Tartare saumon', price: 13.00, category: 'Entrées', color: '#10b981', emoji: '🐟' },
  
  // Plats
  { id: 'item-7', name: 'Burger Classic', price: 14.50, category: 'Plats', color: '#f59e0b', emoji: '🍔' },
  { id: 'item-8', name: 'Entrecôte', price: 24.00, category: 'Plats', color: '#f59e0b', emoji: '🥩',
    modifiers: [{ id: 'mod-1', name: 'Cuisson', options: ['Bleu', 'Saignant', 'À point', 'Bien cuit'], required: true }]
  },
  { id: 'item-9', name: 'Pâtes Carbonara', price: 13.50, category: 'Plats', color: '#f59e0b', emoji: '🍝' },
  { id: 'item-10', name: 'Pizza Margherita', price: 12.00, category: 'Plats', color: '#f59e0b', emoji: '🍕' },
  { id: 'item-11', name: 'Saumon grillé', price: 18.00, category: 'Plats', color: '#f59e0b', emoji: '🐟' },
  { id: 'item-12', name: 'Risotto', price: 15.00, category: 'Plats', color: '#f59e0b', emoji: '🍚' },
  
  // Desserts
  { id: 'item-13', name: 'Tiramisu', price: 7.50, category: 'Desserts', color: '#ec4899', emoji: '🍰' },
  { id: 'item-14', name: 'Crème brûlée', price: 7.00, category: 'Desserts', color: '#ec4899', emoji: '🍮' },
  { id: 'item-15', name: 'Fondant chocolat', price: 8.00, category: 'Desserts', color: '#ec4899', emoji: '🍫' },
  { id: 'item-16', name: 'Salade fruits', price: 6.00, category: 'Desserts', color: '#ec4899', emoji: '🍓' },
  
  // Boissons
  { id: 'item-17', name: 'Coca-Cola', price: 3.50, category: 'Boissons', color: '#3b82f6', emoji: '🥤' },
  { id: 'item-18', name: 'Eau minérale', price: 2.50, category: 'Boissons', color: '#3b82f6', emoji: '💧' },
  { id: 'item-19', name: 'Jus d\'orange', price: 4.00, category: 'Boissons', color: '#3b82f6', emoji: '🍊' },
  { id: 'item-20', name: 'Limonade', price: 4.50, category: 'Boissons', color: '#3b82f6', emoji: '🍋' },
  
  // Cocktails
  { id: 'item-21', name: 'Mojito', price: 9.00, category: 'Cocktails', color: '#8b5cf6', emoji: '🍹' },
  { id: 'item-22', name: 'Margarita', price: 10.00, category: 'Cocktails', color: '#8b5cf6', emoji: '🍸' },
  { id: 'item-23', name: 'Piña Colada', price: 10.00, category: 'Cocktails', color: '#8b5cf6', emoji: '🥥' },
  { id: 'item-24', name: 'Negroni', price: 11.00, category: 'Cocktails', color: '#8b5cf6', emoji: '🍹' },
  { id: 'item-25', name: 'Gin Tonic', price: 9.50, category: 'Cocktails', color: '#8b5cf6', emoji: '🥂' },
  
  // Vins
  { id: 'item-26', name: 'Rouge Bordeaux', price: 6.00, category: 'Vins', color: '#ef4444', emoji: '🍷' },
  { id: 'item-27', name: 'Blanc Chablis', price: 7.00, category: 'Vins', color: '#ef4444', emoji: '🥂' },
  { id: 'item-28', name: 'Rosé Provence', price: 5.50, category: 'Vins', color: '#ef4444', emoji: '🌸' },
  { id: 'item-29', name: 'Champagne', price: 12.00, category: 'Vins', color: '#ef4444', emoji: '🍾' },
  
  // Bières
  { id: 'item-30', name: 'Blonde pression', price: 4.50, category: 'Bières', color: '#f97316', emoji: '🍺' },
  { id: 'item-31', name: 'IPA artisanale', price: 6.00, category: 'Bières', color: '#f97316', emoji: '🍺' },
  { id: 'item-32', name: 'Blanche', price: 5.00, category: 'Bières', color: '#f97316', emoji: '🍻' },
  { id: 'item-33', name: 'Stout', price: 5.50, category: 'Bières', color: '#f97316', emoji: '🍺' },
  
  // Cafés
  { id: 'item-34', name: 'Espresso', price: 2.00, category: 'Cafés', color: '#92400e', emoji: '☕' },
  { id: 'item-35', name: 'Cappuccino', price: 3.50, category: 'Cafés', color: '#92400e', emoji: '☕' },
  { id: 'item-36', name: 'Café crème', price: 3.00, category: 'Cafés', color: '#92400e', emoji: '☕' },
  { id: 'item-37', name: 'Thé', price: 3.00, category: 'Cafés', color: '#92400e', emoji: '🍵' },
];

export const initialTables: Table[] = [
  { id: 't1', name: 'T1', seats: 2, x: 5, y: 10, width: 14, height: 14, status: 'free' },
  { id: 't2', name: 'T2', seats: 4, x: 22, y: 10, width: 16, height: 14, status: 'free' },
  { id: 't3', name: 'T3', seats: 4, x: 41, y: 10, width: 16, height: 14, status: 'free' },
  { id: 't4', name: 'T4', seats: 6, x: 60, y: 10, width: 18, height: 14, status: 'free' },
  { id: 't5', name: 'T5', seats: 2, x: 5, y: 32, width: 14, height: 14, status: 'free' },
  { id: 't6', name: 'T6', seats: 4, x: 22, y: 32, width: 16, height: 14, status: 'free' },
  { id: 't7', name: 'T7', seats: 4, x: 41, y: 32, width: 16, height: 14, status: 'free' },
  { id: 't8', name: 'T8', seats: 8, x: 60, y: 32, width: 18, height: 14, status: 'free' },
  { id: 't9', name: 'T9', seats: 2, x: 5, y: 54, width: 14, height: 14, status: 'free' },
  { id: 't10', name: 'T10', seats: 4, x: 22, y: 54, width: 16, height: 14, status: 'free' },
  { id: 't11', name: 'T11', seats: 6, x: 41, y: 54, width: 16, height: 14, status: 'free' },
  { id: 't12', name: 'T12', seats: 2, x: 60, y: 54, width: 18, height: 14, status: 'free' },
  { id: 'bar1', name: 'Bar 1', seats: 1, x: 5, y: 78, width: 12, height: 12, status: 'free' },
  { id: 'bar2', name: 'Bar 2', seats: 1, x: 19, y: 78, width: 12, height: 12, status: 'free' },
  { id: 'bar3', name: 'Bar 3', seats: 1, x: 33, y: 78, width: 12, height: 12, status: 'free' },
  { id: 'bar4', name: 'Bar 4', seats: 1, x: 47, y: 78, width: 12, height: 12, status: 'free' },
  { id: 'bar5', name: 'Bar 5', seats: 1, x: 61, y: 78, width: 12, height: 12, status: 'free' },
  { id: 'bar6', name: 'Bar 6', seats: 1, x: 75, y: 78, width: 12, height: 12, status: 'free' },
];
