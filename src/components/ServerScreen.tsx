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
  const [view, setView] = useState<'tables' | 'order' | 'validate'>('tables');
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
    setView('validate');
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

  // View validate (après validation)
  if (view === 'validate' && currentTicket?.status === 'OPEN') {
    return (
      <div className="h-screen flex flex-col bg-slate-900">
        <header className="h-14 bg-slate-800/90 border-b border-slate-700/50 flex items-center justify-between px-4 shrink-0">
          <div className="flex items-center gap-3">
            <button onClick={() => setView('order')} className="p-2 text-slate-400 hover:text-white">
              <ArrowLeft className="w-5 h-5" />
            </button>
            <div>
              <p className="text-sm font-bold text-white">{currentTable?.name} • Validée ✓</p>
              <p className="text-[10px] text-emerald-400">Commande validée - Prête à encaisser</p>
            </div>
          </div>
          <button onClick={() => dispatch({ type: 'LOGOUT' })} className="p-2 text-slate-400 hover:text-white">
            <LogOut className="w-5 h-5" />
          </button>
        </header>

        <div className="flex-1 flex flex-col items-center justify-center p-6">
          <motion.div initial={{ scale: 0 }} animate={{ scale: 1 }} className="text-center">
            <CheckCircle className="w-20 h-20 text-emerald-500 mx-auto mb-4" />
            <h2 className="text-2xl font-bold text-white mb-2">Commande Validée !</h2>
            <p className="text-slate-400 mb-6">La commande a été validée et est prête à être encaissée</p>
            
            <div className="bg-slate-800/50 rounded-2xl p-6 mb-6 max-w-md">
              <div className="flex justify-between items-center mb-4">
                <span className="text-slate-400">Total</span>
                <span className="text-3xl font-bold text-emerald-400">{currentTicket.totalAmount.toFixed(2)} €</span>
              </div>
              <div className="flex justify-between items-center text-sm">
                <span className="text-slate-400">Articles</span>
                <span className="text-white">{currentTicket.items.length}</span>
              </div>
            </div>

            <div className="flex gap-3">
              <button onClick={() => setView('order')}
                className="px-6 py-3 bg-slate-700 hover:bg-slate-600 text-white rounded-xl font-medium">
                Modifier
              </button>
              <button onClick={() => setShowPayment(true)}
                className="px-6 py-3 bg-gradient-to-r from-emerald-500 to-emerald-600 hover:from-emerald-600 hover:to-emerald-700 text-white rounded-xl font-bold">
                Encaisser
              </button>
            </div>
          </motion.div>
        </div>

        {/* Payment Modal */}
        {showPayment && <PaymentModal ticket={currentTicket} onClose={() => setShowPayment(false)} />}
      </div>
    );
  }

  // View order (DRAFT)
  return (
    <div className="h-screen flex flex-col md:flex-row bg-slate-900">
      {/* Menu */}
      <div className="flex-1 flex flex-col h-[55vh] md:h-full border-r border-slate-700/50">
        <div className="p-3 border-b border-slate-700/50 shrink-0">
          <div className="flex items-center justify-between mb-2">
            <button onClick={() => setView('tables')} className="flex items-center gap-1 text-slate-400 hover:text-white text-sm">
              <ArrowLeft className="w-4 h-4" /> Tables
            </button>
            <div className="text-right">
              <span className="text-lg font-bold text-white">{currentTable?.name}</span>
              {currentTicket?.status === 'DRAFT' && (
                <span className="ml-2 px-2 py-0.5 bg-amber-500/20 text-amber-400 rounded-full text-xs">Brouillon</span>
              )}
            </div>
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
            <h2 className="text-base font-bold text-white">Commande • {currentTable?.name}</h2>
            <p className="text-xs text-slate-400">{server?.name}</p>
          </div>
          {currentTicket?.status === 'DRAFT' && currentTicket.items.length > 0 && (
            <button onClick={handleValidate}
              className="px-4 py-2 bg-emerald-500 hover:bg-emerald-600 text-white rounded-xl font-bold text-sm flex items-center gap-2">
              <CheckCircle className="w-4 h-4" />
              Valider
            </button>
          )}
          {currentTicket?.status === 'OPEN' && (
            <button onClick={handleSendToKitchen}
              className="px-4 py-2 bg-blue-500 hover:bg-blue-600 text-white rounded-xl font-bold text-sm flex items-center gap-2">
              <Send className="w-4 h-4" />
              Cuisine
            </button>
          )}
        </div>

        <div className="flex-1 overflow-y-auto p-3 space-y-2">
          {currentTicket?.items.length === 0 ? (
            <div className="text-center py-8 text-slate-500">
              <p className="text-3xl mb-2">🍽️</p>
              <p className="text-sm">Ajoutez des articles</p>
            </div>
          ) : (
            currentTicket?.items.map(item => (
              <div key={item.id} className="bg-slate-700/30 rounded-xl p-3 border border-slate-600/30">
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <div className="flex items-center gap-2">
                      <span>{item.menuItem.emoji}</span>
                      <span className="text-sm font-medium text-white">{item.menuItem.name}</span>
                      {item.status === 'validated' && (
                        <CheckCircle className="w-3 h-3 text-emerald-400" />
                      )}
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

        {/* Total */}
        <div className="p-3 border-t border-slate-700/50 bg-slate-800/50 shrink-0">
          <div className="flex justify-between items-center mb-1">
            <span className="text-slate-400 text-sm">Total</span>
            <span className="text-xl font-bold text-emerald-400">{currentTicket?.totalAmount.toFixed(2)} €</span>
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
          {currentTicket?.status === 'OPEN' && (
            <button onClick={() => setShowPayment(true)}
              className="w-full py-3 bg-gradient-to-r from-emerald-500 to-emerald-600 text-white rounded-xl font-bold active:scale-[0.98] transition-all">
              {totalPaid > 0 ? 'Paiement partiel' : 'Encaisser'}
            </button>
          )}
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
