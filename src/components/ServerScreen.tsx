import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { v4 as uuidv4 } from 'uuid';
import {
  Plus, Minus, Send, Trash2, CreditCard, Banknote, ArrowLeft, Search, X,
  LogOut, Grid3X3, CheckCircle, AlertCircle
} from 'lucide-react';
import { usePOS } from '../store';
import { MenuItem, TicketItem } from '../types';
import { categories } from '../data';

export default function ServerScreen() {
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

  const filteredItems = state.menuItems.filter(item => {
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

  const handleValidate = () => {
    if (!state.currentTicketId || !currentTicket) return;
    dispatch({ type: 'VALIDATE_TICKET', payload: state.currentTicketId });
    // Rediriger automatiquement vers les tables après validation
    setView('tables');
  };

  const handleSendToKitchen = () => {
    if (!state.currentTicketId) return;
    dispatch({ type: 'SEND_TO_KITCHEN', payload: state.currentTicketId });
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
      <div className="h-screen flex flex-col gradient-dark">
        <header className="h-16 glass border-b border-white/10 flex items-center justify-between px-4 shrink-0 shadow-lg">
          <div className="flex items-center gap-3">
            <motion.div 
              whileHover={{ scale: 1.1 }}
              className="w-10 h-10 rounded-full flex items-center justify-center text-white text-sm font-bold shadow-lg"
              style={{ backgroundColor: server?.color || '#64748b' }}>
              {server?.name[0] || '?'}
            </motion.div>
            <div>
              <p className="text-base font-bold text-white">{server?.name || 'Serveur'}</p>
              <p className="text-xs text-slate-400">Tablette de commande</p>
            </div>
          </div>
          <motion.button 
            whileHover={{ scale: 1.1 }}
            whileTap={{ scale: 0.9 }}
            onClick={() => dispatch({ type: 'LOGOUT' })} 
            className="p-2 text-slate-400 hover:text-white touch-target"
          >
            <LogOut className="w-5 h-5" />
          </motion.button>
        </header>

        <div className="flex-1 overflow-y-auto p-4 container-responsive">
          <h2 className="text-xl font-bold text-white mb-6 flex items-center gap-2">
            <Grid3X3 className="w-6 h-6 text-blue-400" /> Sélectionnez une table
          </h2>
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-3 md:gap-4">
            {state.tables.map((table, index) => {
              const colors = getTableColors(table.status);
              return (
                <motion.button 
                  key={table.id}
                  initial={{ opacity: 0, scale: 0.9 }}
                  animate={{ opacity: 1, scale: 1 }}
                  transition={{ delay: index * 0.05 }}
                  whileHover={{ scale: 1.05, y: -5 }}
                  whileTap={{ scale: 0.95 }}
                  onClick={() => handleTableClick(table.id)}
                  className={`aspect-square rounded-2xl border-2 ${colors.bg} flex flex-col items-center justify-center gap-2 p-3 relative hover-lift touch-target min-h-[120px]`}
                >
                  <span className="text-xl md:text-2xl font-bold text-white">{table.name}</span>
                  <span className="text-xs text-slate-400">{table.seats} places</span>
                  {table.status !== 'FREE' && (
                    <p className={`text-sm md:text-base font-bold ${colors.text}`}>{table.totalToPay.toFixed(2)}€</p>
                  )}
                  {table.totalPaid > 0 && table.totalPaid < table.totalToPay && (
                    <motion.div 
                      initial={{ scale: 0 }}
                      animate={{ scale: 1 }}
                      className="absolute top-2 left-2 px-2 py-1 gradient-warning rounded-lg text-[10px] font-bold text-white shadow-lg"
                    >
                      PARTIEL
                    </motion.div>
                  )}
                  {table.totalPaid >= table.totalToPay && table.totalToPay > 0 && (
                    <motion.div 
                      initial={{ scale: 0 }}
                      animate={{ scale: 1 }}
                      className="absolute top-2 left-2 px-2 py-1 gradient-success rounded-lg text-[10px] font-bold text-white shadow-lg"
                    >
                      PAYÉ
                    </motion.div>
                  )}
                </motion.button>
              );
            })}
          </div>
        </div>
      </div>
    );
  }



  // View order (DRAFT)
  return (
    <div className="h-screen flex flex-col md:flex-row gradient-dark">
      {/* Menu */}
      <div className="flex-1 flex flex-col h-[55vh] md:h-full border-r border-white/10">
        <div className="p-3 md:p-4 border-b border-white/10 glass shrink-0">
          <div className="flex items-center justify-between mb-3">
            <motion.button 
              whileHover={{ x: -3 }}
              onClick={() => setView('tables')} 
              className="flex items-center gap-1 text-slate-400 hover:text-white text-sm touch-target"
            >
              <ArrowLeft className="w-4 h-4" /> Tables
            </motion.button>
            <div className="text-right">
              <span className="text-lg md:text-xl font-bold text-white">{currentTable?.name}</span>
              {currentTicket?.status === 'DRAFT' && (
                <motion.span 
                  initial={{ scale: 0 }}
                  animate={{ scale: 1 }}
                  className="ml-2 px-2 py-1 gradient-warning text-white rounded-full text-xs font-bold shadow-lg"
                >
                  Brouillon
                </motion.span>
              )}
            </div>
          </div>
          <div className="relative mb-3">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
            <input type="text" placeholder="Rechercher..." value={searchQuery} onChange={e => setSearchQuery(e.target.value)}
              className="w-full pl-9 pr-4 py-2.5 input-modern text-sm" />
          </div>
          <div className="flex gap-2 overflow-x-auto scrollbar-hide pb-1">
            <motion.button 
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              onClick={() => setActiveCategory('Tous')}
              className={`px-4 py-2 rounded-xl text-xs font-medium whitespace-nowrap touch-target ${
                activeCategory === 'Tous' ? 'gradient-primary text-white shadow-lg' : 'glass text-slate-300 hover:bg-white/10'
              }`}
            >
              Tous
            </motion.button>
            {categories.map(cat => (
              <motion.button 
                key={cat.name}
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                onClick={() => setActiveCategory(cat.name)}
                className={`px-4 py-2 rounded-xl text-xs font-medium whitespace-nowrap flex items-center gap-1 touch-target ${
                  activeCategory === cat.name ? 'text-white shadow-lg' : 'glass text-slate-300 hover:bg-white/10'
                }`}
                style={activeCategory === cat.name ? { backgroundColor: cat.color } : {}}
              >
                <span className="text-sm">{cat.emoji}</span> {cat.name}
              </motion.button>
            ))}
          </div>
        </div>

        <div className="flex-1 overflow-y-auto p-3 md:p-4">
          <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-5 lg:grid-cols-6 gap-2 md:gap-3">
            {filteredItems.map((item, index) => (
              <motion.button 
                key={item.id}
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ delay: index * 0.02 }}
                whileHover={{ scale: 1.05, y: -3 }}
                whileTap={{ scale: 0.95 }}
                onClick={() => handleAddItem(item)}
                className="glass-card rounded-xl p-3 flex flex-col items-center justify-center gap-2 hover-lift touch-target min-h-[100px]"
              >
                <span className="text-3xl md:text-4xl">{item.emoji}</span>
                <span className="text-xs text-white font-medium text-center leading-tight">{item.name}</span>
                <span className="text-sm font-bold" style={{ color: item.color }}>{item.price.toFixed(2)}€</span>
              </motion.button>
            ))}
          </div>
        </div>
      </div>

      {/* Current Order */}
      <div className="flex-1 flex flex-col h-[45vh] md:h-full glass-light">
        <div className="p-3 md:p-4 border-b border-white/10 glass flex items-center justify-between shrink-0">
          <div>
            <h2 className="text-base md:text-lg font-bold text-white">Commande • {currentTable?.name}</h2>
            <p className="text-xs text-slate-400">{server?.name}</p>
          </div>
          {currentTicket?.status === 'DRAFT' && currentTicket.items.length > 0 && (
            <motion.button 
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              onClick={handleValidate}
              className="btn-success text-sm flex items-center gap-2 touch-target"
            >
              <CheckCircle className="w-4 h-4" />
              Valider
            </motion.button>
          )}
          {currentTicket?.status === 'OPEN' && (
            <motion.button 
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              onClick={handleSendToKitchen}
              className="btn-primary text-sm flex items-center gap-2 touch-target"
            >
              <Send className="w-4 h-4" />
              Cuisine
            </motion.button>
          )}
        </div>

        <div className="flex-1 overflow-y-auto p-3 md:p-4 space-y-2">
          {currentTicket?.items.length === 0 ? (
            <div className="text-center py-12 text-slate-500">
              <motion.div
                animate={{ y: [0, -10, 0] }}
                transition={{ duration: 2, repeat: Infinity }}
                className="text-5xl mb-3"
              >
                🍽️
              </motion.div>
              <p className="text-base">Ajoutez des articles</p>
            </div>
          ) : (
            currentTicket?.items.map((item, index) => (
              <motion.div 
                key={item.id}
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: index * 0.05 }}
                className="glass-card rounded-xl p-3 md:p-4"
              >
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <div className="flex items-center gap-2">
                      <span className="text-2xl">{item.menuItem.emoji}</span>
                      <span className="text-sm md:text-base font-medium text-white">{item.menuItem.name}</span>
                      {item.status === 'validated' && (
                        <motion.div
                          initial={{ scale: 0 }}
                          animate={{ scale: 1 }}
                        >
                          <CheckCircle className="w-4 h-4 text-emerald-400" />
                        </motion.div>
                      )}
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <div className="flex items-center glass rounded-lg">
                      <motion.button 
                        whileTap={{ scale: 0.9 }}
                        onClick={() => {
                          if (item.quantity <= 1) dispatch({ type: 'REMOVE_ITEM', payload: { ticketId: state.currentTicketId!, itemId: item.id } });
                          else dispatch({ type: 'UPDATE_QTY', payload: { ticketId: state.currentTicketId!, itemId: item.id, qty: item.quantity - 1 } });
                        }} 
                        className="p-2 hover:bg-white/10 rounded-l-lg touch-target"
                      >
                        <Minus className="w-4 h-4 text-white" />
                      </motion.button>
                      <span className="text-base font-bold text-white w-8 text-center">{item.quantity}</span>
                      <motion.button 
                        whileTap={{ scale: 0.9 }}
                        onClick={() => dispatch({ type: 'UPDATE_QTY', payload: { ticketId: state.currentTicketId!, itemId: item.id, qty: item.quantity + 1 } })}
                        className="p-2 hover:bg-white/10 rounded-r-lg touch-target"
                      >
                        <Plus className="w-4 h-4 text-white" />
                      </motion.button>
                    </div>
                    <span className="text-base font-bold text-white min-w-[50px] text-right">
                      {(item.menuItem.price * item.quantity).toFixed(2)}€
                    </span>
                  </div>
                </div>
              </motion.div>
            ))
          )}
        </div>

        {/* Total */}
        <div className="p-3 md:p-4 border-t border-white/10 glass shrink-0">
          <div className="flex justify-between items-center mb-2">
            <span className="text-slate-400 text-sm md:text-base">Total</span>
            <motion.span 
              key={currentTicket?.totalAmount}
              initial={{ scale: 1.2 }}
              animate={{ scale: 1 }}
              className="text-2xl md:text-3xl font-bold text-emerald-400"
            >
              {currentTicket?.totalAmount.toFixed(2)} €
            </motion.span>
          </div>
          {totalPaid > 0 && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: 'auto' }}
              className="space-y-1 mb-3"
            >
              <div className="flex justify-between items-center text-xs md:text-sm">
                <span className="text-slate-400">Payé</span>
                <span className="text-green-400 font-bold">{totalPaid.toFixed(2)} €</span>
              </div>
              {remaining > 0 && (
                <div className="flex justify-between items-center text-xs md:text-sm">
                  <span className="text-slate-400">Reste</span>
                  <span className="text-orange-400 font-bold">{remaining.toFixed(2)} €</span>
                </div>
              )}
            </motion.div>
          )}
          {currentTicket?.status === 'OPEN' && (
            <motion.button 
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              onClick={() => setShowPayment(true)}
              className="w-full py-3 md:py-4 btn-success text-base md:text-lg touch-target"
            >
              {totalPaid > 0 ? 'Paiement partiel' : 'Encaisser'}
            </motion.button>
          )}
          {remaining <= 0 && totalPaid > 0 && (
            <motion.button 
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              onClick={() => {
                dispatch({ type: 'CLOSE_TICKET', payload: state.currentTicketId! });
                setView('tables');
              }} 
              className="w-full py-3 mt-2 btn-success text-sm md:text-base touch-target"
            >
              ✓ Fermer la table (tout payé)
            </motion.button>
          )}
        </div>
      </div>

      {/* Payment Modal */}
      {showPayment && currentTicket && <PaymentModal ticket={currentTicket} onClose={() => setShowPayment(false)} />}
    </div>
  );
}

// Payment Modal Component
function PaymentModal({ ticket, onClose }: { ticket: any; onClose: () => void }) {
  const { dispatch } = usePOS();
  const [selectedItems, setSelectedItems] = useState<Set<string>>(new Set());
  const [customAmount, setCustomAmount] = useState('');
  const [paymentMethod, setPaymentMethod] = useState<'CASH' | 'CARD'>('CASH');

  const totalPaid = ticket.payments.reduce((sum: number, p: any) => sum + p.amount, 0);
  const remaining = ticket.totalAmount - totalPaid;

  const handlePayment = (amount: number) => {
    dispatch({ type: 'ADD_PAYMENT', payload: { ticketId: ticket.id, amount, method: paymentMethod } });
    onClose();
  };

  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }}
      className="fixed inset-0 bg-black/60 flex items-center justify-center z-50 p-4"
      onClick={onClose}>
      <motion.div initial={{ scale: 0.9 }} animate={{ scale: 1 }}
        className="bg-slate-800 rounded-2xl border border-slate-700 p-5 w-full max-w-lg max-h-[90vh] overflow-y-auto"
        onClick={e => e.stopPropagation()}>
        <h3 className="text-xl font-bold text-white mb-2">Paiement</h3>
        <p className="text-sm text-slate-400 mb-4">
          Total: {ticket.totalAmount.toFixed(2)}€ | Payé: {totalPaid.toFixed(2)}€ | Reste: {remaining.toFixed(2)}€
        </p>

        {/* Sélection articles */}
        <div className="mb-4">
          <div className="flex items-center justify-between mb-2">
            <h4 className="text-sm font-semibold text-white">Articles à payer</h4>
            <div className="flex gap-2">
              <button onClick={() => setSelectedItems(new Set(ticket.items.map((i: any) => i.id)))}
                className="px-2 py-1 text-xs bg-blue-600 hover:bg-blue-700 rounded">Tout</button>
              <button onClick={() => setSelectedItems(new Set())}
                className="px-2 py-1 text-xs bg-slate-700 hover:bg-slate-600 rounded">Aucun</button>
            </div>
          </div>
          <div className="space-y-1 max-h-40 overflow-y-auto">
            {ticket.items.map((item: any) => (
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
          const selectedAmount = ticket.items.filter((i: any) => selectedItems.has(i.id)).reduce((sum: number, i: any) => sum + i.menuItem.price * i.quantity, 0);
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
  );
}

// Helper function
function getTableColors(status: string) {
  switch (status) {
    case 'FREE':
      return { bg: 'from-emerald-500/20 to-emerald-600/10', border: 'border-emerald-500/50', text: 'text-emerald-400' };
    case 'OCCUPIED':
      return { bg: 'from-red-500/20 to-red-600/10', border: 'border-red-500/50', text: 'text-red-400' };
    case 'PARTIALLY_PAID':
      return { bg: 'from-orange-500/20 to-orange-600/10', border: 'border-orange-500/50', text: 'text-orange-400' };
    case 'RESERVED':
      return { bg: 'from-blue-500/20 to-blue-600/10', border: 'border-blue-500/50', text: 'text-blue-400' };
    case 'CLEANING':
      return { bg: 'from-cyan-500/20 to-cyan-600/10', border: 'border-cyan-500/50', text: 'text-cyan-400' };
    default:
      return { bg: 'from-slate-500/20 to-slate-600/10', border: 'border-slate-500/50', text: 'text-slate-400' };
  }
}
