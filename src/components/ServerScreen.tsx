import { useState } from 'react';
import { usePOS } from '../store';
import { motion, AnimatePresence } from 'framer-motion';
import { Plus, Minus, Send, Trash2, CreditCard, Banknote, ArrowLeft, Search, X, StickyNote, Percent, LogOut, Grid3X3, Printer, Loader2, CheckCircle2, XCircle } from 'lucide-react';
import { categories, menuItems } from '../data';
import { MenuItem, OrderItem } from '../types';
import { v4 as uuidv4 } from 'uuid';
import { usePrinter, usePaymentTerminal } from '../lib/hooks';
import { PaymentModal } from './PaymentModal';

export default function ServerScreen() {
  const { state, dispatch } = usePOS();
  const { printReceipt, sendToKitchen } = usePrinter();
  const { processPayment, status: terminalStatus, progress: paymentProgress } = usePaymentTerminal();
  const [view, setView] = useState<'tables' | 'order'>('tables');
  const [activeCategory, setActiveCategory] = useState('Tous');
  const [searchQuery, setSearchQuery] = useState('');
  const [showPayment, setShowPayment] = useState(false);
  const [showModifier, setShowModifier] = useState<MenuItem | null>(null);
  const [selectedModifiers, setSelectedModifiers] = useState<Record<string, string>>({});
  const [itemNotes, setItemNotes] = useState('');
  const [showNotes, setShowNotes] = useState<string | null>(null);
  const [noteText, setNoteText] = useState('');
  const [showDiscount, setShowDiscount] = useState(false);
  const [discountValue, setDiscountValue] = useState('');
  const [paymentProcessing, setPaymentProcessing] = useState(false);
  const [paymentResult, setPaymentResult] = useState<{ success: boolean; message: string } | null>(null);
  const [sendingToKitchen, setSendingToKitchen] = useState(false);
  const [showPaymentModal, setShowPaymentModal] = useState(false);

  const server = state.currentServer;
  const currentOrder = state.orders.find(o => o.id === state.currentOrderId);
  const currentTable = state.tables.find(t => t.id === state.currentTableId);

  const filteredItems = menuItems.filter(item => {
    const matchesCategory = activeCategory === 'Tous' || item.category === activeCategory;
    const matchesSearch = item.name.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesCategory && matchesSearch;
  });

  const handleTableClick = (tableId: string) => {
    console.log('[ServerScreen] Ouverture table:', tableId, 'par', server?.name);
    dispatch({ type: 'OPEN_TABLE', payload: tableId });
    setView('order');
  };

  const handleAddItem = (item: MenuItem) => {
    if (!state.currentOrderId) return;
    if (item.modifiers && item.modifiers.length > 0) {
      setShowModifier(item);
      setSelectedModifiers({});
      setItemNotes('');
    } else {
      const orderItem: OrderItem = {
        id: uuidv4(),
        menuItem: item,
        quantity: 1,
        notes: '',
        modifiers: {},
        status: 'pending',
      };
      dispatch({ type: 'ADD_ITEM', payload: { orderId: state.currentOrderId, item: orderItem } });
    }
  };

  const handleConfirmModifier = () => {
    if (showModifier && state.currentOrderId) {
      const orderItem: OrderItem = {
        id: uuidv4(),
        menuItem: showModifier,
        quantity: 1,
        notes: itemNotes,
        modifiers: selectedModifiers,
        status: 'pending',
      };
      dispatch({ type: 'ADD_ITEM', payload: { orderId: state.currentOrderId, item: orderItem } });
      setShowModifier(null);
      setSelectedModifiers({});
      setItemNotes('');
    }
  };

  const handlePayment = async (method: 'cash' | 'card') => {
    if (!currentOrder || !state.currentOrderId || !currentTable) return;

    setPaymentProcessing(true);
    setPaymentResult(null);

    try {
      if (method === 'card') {
        // Utiliser le terminal de paiement
        const response = await processPayment(currentOrder.total, state.currentOrderId);
        
        if (response.success) {
          setPaymentResult({
            success: true,
            message: `✓ Paiement accepté • ${response.cardType} ****${response.cardLast4} • Auto: ${response.authorizationCode}`
          });
          
          // Enregistrer le paiement
          dispatch({ type: 'ADD_PAYMENT', payload: { orderId: state.currentOrderId, method: 'card', amount: currentOrder.total } });
          
          // Imprimer le ticket
          await printReceipt(currentOrder, currentTable);
          
          setTimeout(() => {
            setShowPayment(false);
            setPaymentResult(null);
            if (state.currentOrderId) {
              dispatch({ type: 'CLOSE_ORDER', payload: state.currentOrderId });
            }
            setView('tables');
            setPaymentProcessing(false);
          }, 2000);
        } else {
          setPaymentResult({
            success: false,
            message: `✗ Paiement refusé : ${response.errorMessage}`
          });
          setPaymentProcessing(false);
        }
      } else {
        // Espèces - pas besoin de TPE
        dispatch({ type: 'ADD_PAYMENT', payload: { orderId: state.currentOrderId, method: 'cash', amount: currentOrder.total } });
        
        // Imprimer le ticket
        await printReceipt(currentOrder, currentTable);
        
        setPaymentResult({
          success: true,
          message: '✓ Paiement espèces enregistré • Ticket imprimé'
        });
        
        setTimeout(() => {
          setShowPayment(false);
          setPaymentResult(null);
          if (state.currentOrderId) {
            dispatch({ type: 'CLOSE_ORDER', payload: state.currentOrderId });
          }
          setView('tables');
          setPaymentProcessing(false);
        }, 1500);
      }
    } catch (error) {
      setPaymentResult({
        success: false,
        message: '✗ Erreur de communication avec le terminal'
      });
      setPaymentProcessing(false);
    }
  };

  const handleApplyDiscount = () => {
    if (!state.currentOrderId) return;
    const value = parseFloat(discountValue);
    if (!isNaN(value) && value >= 0 && value <= 100) {
      dispatch({ type: 'APPLY_DISCOUNT', payload: { orderId: state.currentOrderId, discount: value } });
      setShowDiscount(false);
      setDiscountValue('');
    }
  };

  const getTableColor = (status: string, paymentStatus?: string) => {
    // Si la table est occupée, utiliser le statut de paiement pour la couleur
    if (status === 'occupied' && paymentStatus) {
      switch (paymentStatus) {
        case 'paid': return 'from-green-500/20 to-green-600/10 border-green-500/50';
        case 'partial': return 'from-orange-500/20 to-orange-600/10 border-orange-500/50';
        case 'unpaid': return 'from-red-500/20 to-red-600/10 border-red-500/50';
        default: return 'from-red-500/20 to-red-600/10 border-red-500/50';
      }
    }
    
    switch (status) {
      case 'free': return 'from-emerald-500/20 to-emerald-600/10 border-emerald-500/50';
      case 'occupied': return 'from-red-500/20 to-red-600/10 border-red-500/50';
      case 'reserved': return 'from-amber-500/20 to-amber-600/10 border-amber-500/50';
      case 'cleaning': return 'from-blue-500/20 to-blue-600/10 border-blue-500/50';
      default: return 'from-slate-500/20 to-slate-600/10 border-slate-500/50';
    }
  };

  // Tables view
  if (view === 'tables' || !currentOrder) {
    return (
      <div className="h-screen flex flex-col bg-slate-900">
        {/* Header */}
        <header className="h-14 bg-slate-800/90 border-b border-slate-700/50 flex items-center justify-between px-4 shrink-0">
          <div className="flex items-center gap-3">
            <div
              className="w-8 h-8 rounded-full flex items-center justify-center text-white text-sm font-bold"
              style={{ backgroundColor: server?.color || '#64748b' }}
            >
              {server?.name[0] || '?'}
            </div>
            <div>
              <p className="text-sm font-bold text-white">{server?.name || 'Serveur'}</p>
              <p className="text-[10px] text-slate-400">Tablette de commande</p>
            </div>
          </div>
          <button
            onClick={() => dispatch({ type: 'LOGOUT_SERVER' })}
            className="p-2 text-slate-400 hover:text-white rounded-lg"
          >
            <LogOut className="w-5 h-5" />
          </button>
        </header>

        {/* Tables Grid */}
        <div className="flex-1 overflow-y-auto p-4">
          <h2 className="text-lg font-bold text-white mb-4 flex items-center gap-2">
            <Grid3X3 className="w-5 h-5 text-blue-400" />
            Sélectionnez une table
          </h2>
          <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-5 lg:grid-cols-6 gap-3">
            {state.tables.map(table => {
              const order = state.orders.find(o => o.tableId === table.id && o.status === 'open');
              const totalPaid = order?.payments.reduce((sum, p) => sum + p.amount, 0) || 0;
              const isPartiallyPaid = order && totalPaid > 0 && totalPaid < order.total;
              const isFullyPaid = order && totalPaid >= order.total;
              
              return (
                <motion.button
                  key={table.id}
                  whileTap={{ scale: 0.93 }}
                  onClick={() => handleTableClick(table.id)}
                  className={`aspect-square rounded-2xl border-2 bg-gradient-to-br ${getTableColor(table.status, table.paymentStatus)} 
                    flex flex-col items-center justify-center gap-1 p-3 transition-all relative`}
                >
                  <span className="text-xl font-bold text-white">{table.name}</span>
                  <span className="text-xs text-slate-400">{table.seats}p</span>
                  {order && (
                    <div className="mt-1 text-center">
                      <p className="text-xs font-bold text-emerald-400">{order.total.toFixed(2)}€</p>
                      <p className="text-[10px] text-slate-400">{order.items.length} art.</p>
                      {isPartiallyPaid && (
                        <p className="text-[10px] text-orange-400 font-medium">
                          {totalPaid.toFixed(2)}€ payés
                        </p>
                      )}
                      {isFullyPaid && (
                        <p className="text-[10px] text-green-400 font-medium">
                          ✓ Payé
                        </p>
                      )}
                    </div>
                  )}
                  {/* Indicateur de commande en attente */}
                  {table.status === 'occupied' && order && order.items.some(i => i.status === 'pending') && (
                    <div className="absolute top-2 right-2 w-2.5 h-2.5 bg-amber-500 rounded-full animate-pulse" />
                  )}
                  {/* Indicateur de paiement partiel */}
                  {isPartiallyPaid && (
                    <div className="absolute top-2 left-2 px-1.5 py-0.5 bg-orange-500/80 rounded text-[9px] font-bold text-white">
                      PARTIEL
                    </div>
                  )}
                  {/* Indicateur de paiement complet */}
                  {isFullyPaid && (
                    <div className="absolute top-2 left-2 px-1.5 py-0.5 bg-green-500/80 rounded text-[9px] font-bold text-white">
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

  // Order view
  return (
    <div className="h-screen flex flex-col md:flex-row bg-slate-900">
      {/* Left - Menu */}
      <div className="flex-1 flex flex-col h-[55vh] md:h-full border-r border-slate-700/50">
        {/* Header */}
        <div className="p-3 border-b border-slate-700/50 shrink-0">
          <div className="flex items-center justify-between mb-2">
            <button
              onClick={() => { setView('tables'); dispatch({ type: 'OPEN_TABLE', payload: state.currentTableId! }); }}
              className="flex items-center gap-1 text-slate-400 hover:text-white text-sm"
            >
              <ArrowLeft className="w-4 h-4" />
              Tables
            </button>
            <div className="text-right">
              <span className="text-lg font-bold text-white">{currentTable?.name}</span>
            </div>
          </div>
          {/* Search */}
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
            <input
              type="text"
              placeholder="Rechercher..."
              value={searchQuery}
              onChange={e => setSearchQuery(e.target.value)}
              className="w-full pl-9 pr-8 py-2 bg-slate-700/50 border border-slate-600/50 rounded-xl text-white placeholder-slate-400 text-sm focus:outline-none focus:border-blue-500/50"
            />
            {searchQuery && (
              <button onClick={() => setSearchQuery('')} className="absolute right-3 top-1/2 -translate-y-1/2">
                <X className="w-4 h-4 text-slate-400" />
              </button>
            )}
          </div>
          {/* Categories */}
          <div className="flex gap-1.5 overflow-x-auto pt-2 scrollbar-hide">
            <button
              onClick={() => setActiveCategory('Tous')}
              className={`px-3 py-1 rounded-full text-xs font-medium whitespace-nowrap ${
                activeCategory === 'Tous' ? 'bg-white text-slate-900' : 'bg-slate-700/50 text-slate-300'
              }`}
            >
              Tous
            </button>
            {categories.map(cat => (
              <button
                key={cat.id}
                onClick={() => setActiveCategory(cat.name)}
                className={`px-3 py-1 rounded-full text-xs font-medium whitespace-nowrap flex items-center gap-1 ${
                  activeCategory === cat.name ? 'text-white' : 'bg-slate-700/50 text-slate-300'
                }`}
                style={activeCategory === cat.name ? { backgroundColor: cat.color } : {}}
              >
                {cat.emoji} {cat.name}
              </button>
            ))}
          </div>
        </div>

        {/* Items Grid */}
        <div className="flex-1 overflow-y-auto p-3">
          <div className="grid grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-2">
            {filteredItems.map(item => (
              <motion.button
                key={item.id}
                whileTap={{ scale: 0.9 }}
                onClick={() => handleAddItem(item)}
                className="bg-slate-800/80 border border-slate-700/50 rounded-xl p-2 flex flex-col items-center justify-center gap-1 hover:border-slate-500/50 active:bg-slate-700/50"
              >
                <span className="text-2xl">{item.emoji}</span>
                <span className="text-[10px] text-white font-medium text-center leading-tight">{item.name}</span>
                <span className="text-xs font-bold" style={{ color: item.color }}>{item.price.toFixed(2)}€</span>
              </motion.button>
            ))}
          </div>
        </div>
      </div>

      {/* Right - Current Order */}
      <div className="flex-1 flex flex-col h-[45vh] md:h-full bg-slate-800/30">
        {/* Order Header */}
        <div className="p-3 border-b border-slate-700/50 flex items-center justify-between shrink-0">
          <div>
            <h2 className="text-base font-bold text-white">Commande • {currentTable?.name}</h2>
            <p className="text-xs text-slate-400">{server?.name}</p>
          </div>
          <div className="flex gap-2">
            <button
              onClick={() => setShowDiscount(true)}
              className="p-2 bg-amber-500/10 border border-amber-500/30 rounded-lg text-amber-400"
            >
              <Percent className="w-4 h-4" />
            </button>
            <button
              onClick={async () => {
                if (state.currentOrderId && currentOrder && currentTable) {
                  dispatch({ type: 'SEND_TO_KITCHEN', payload: state.currentOrderId });
                  // Imprimer le ticket cuisine
                  await sendToKitchen(currentOrder, currentTable);
                }
              }}
              className="p-2 bg-blue-500/10 border border-blue-500/30 rounded-lg text-blue-400"
            >
              <Send className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Items */}
        <div className="flex-1 overflow-y-auto p-3 space-y-2">
          {currentOrder.items.length === 0 ? (
            <div className="text-center py-8 text-slate-500">
              <p className="text-3xl mb-2">🍽️</p>
              <p className="text-sm">Ajoutez des articles</p>
            </div>
          ) : (
            <AnimatePresence>
              {currentOrder.items.map(item => (
                <motion.div
                  key={item.id}
                  initial={{ opacity: 0, x: 20 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: -20 }}
                  className="bg-slate-700/30 rounded-xl p-3 border border-slate-600/30"
                >
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <div className="flex items-center gap-2">
                        <span>{item.menuItem.emoji}</span>
                        <span className="text-sm font-medium text-white">{item.menuItem.name}</span>
                      </div>
                      {item.notes && <p className="text-xs text-amber-400 ml-6 italic">📝 {item.notes}</p>}
                      {Object.keys(item.modifiers).length > 0 && (
                        <p className="text-xs text-blue-400 ml-6">
                          {Object.entries(item.modifiers).map(([k, v]) => `${k}: ${v}`).join(', ')}
                        </p>
                      )}
                    </div>
                    <div className="flex items-center gap-2">
                      <div className="flex items-center bg-slate-600/50 rounded-lg">
                        <button
                          onClick={() => {
                            if (item.quantity <= 1) {
                              dispatch({ type: 'REMOVE_ITEM', payload: { orderId: state.currentOrderId!, itemId: item.id } });
                            } else {
                              dispatch({ type: 'UPDATE_QTY', payload: { orderId: state.currentOrderId!, itemId: item.id, qty: item.quantity - 1 } });
                            }
                          }}
                          className="p-1.5 hover:bg-slate-500/50 rounded-l-lg"
                        >
                          <Minus className="w-3 h-3 text-white" />
                        </button>
                        <span className="text-sm font-bold text-white w-5 text-center">{item.quantity}</span>
                        <button
                          onClick={() => dispatch({ type: 'UPDATE_QTY', payload: { orderId: state.currentOrderId!, itemId: item.id, qty: item.quantity + 1 } })}
                          className="p-1.5 hover:bg-slate-500/50 rounded-r-lg"
                        >
                          <Plus className="w-3 h-3 text-white" />
                        </button>
                      </div>
                      <span className="text-sm font-bold text-white min-w-[45px] text-right">
                        {(item.menuItem.price * item.quantity).toFixed(2)}€
                      </span>
                    </div>
                  </div>
                  <div className="flex justify-end gap-2 mt-1">
                    <button
                      onClick={() => { setShowNotes(item.id); setNoteText(item.notes); }}
                      className="p-1 text-slate-500 hover:text-amber-400"
                    >
                      <StickyNote className="w-3 h-3" />
                    </button>
                    <button
                      onClick={() => dispatch({ type: 'REMOVE_ITEM', payload: { orderId: state.currentOrderId!, itemId: item.id } })}
                      className="p-1 text-slate-500 hover:text-red-400"
                    >
                      <Trash2 className="w-3 h-3" />
                    </button>
                  </div>
                </motion.div>
              ))}
            </AnimatePresence>
          )}
        </div>

        {/* Total & Pay */}
        <div className="p-3 border-t border-slate-700/50 bg-slate-800/50 shrink-0">
          <div className="flex justify-between items-center mb-2">
            <span className="text-slate-400 text-sm">Total</span>
            <span className="text-xl font-bold text-emerald-400">{currentOrder.total.toFixed(2)} €</span>
          </div>
          {currentOrder.payments.length > 0 && (
            <div className="flex justify-between items-center mb-2 text-xs">
              <span className="text-slate-400">Payé</span>
              <span className="text-green-400 font-medium">
                {currentOrder.payments.reduce((sum, p) => sum + p.amount, 0).toFixed(2)} €
              </span>
            </div>
          )}
          {currentOrder.payments.length > 0 && currentOrder.payments.reduce((sum, p) => sum + p.amount, 0) < currentOrder.total && (
            <div className="flex justify-between items-center mb-2 text-xs">
              <span className="text-slate-400">Reste</span>
              <span className="text-orange-400 font-medium">
                {(currentOrder.total - currentOrder.payments.reduce((sum, p) => sum + p.amount, 0)).toFixed(2)} €
              </span>
            </div>
          )}
          <button
            onClick={() => setShowPaymentModal(true)}
            disabled={currentOrder.items.length === 0}
            className="w-full py-3 bg-gradient-to-r from-emerald-500 to-emerald-600 disabled:from-slate-600 disabled:to-slate-700 disabled:text-slate-400 text-white rounded-xl font-bold text-base active:scale-[0.98] transition-all"
          >
            {currentOrder.payments.length > 0 ? 'Paiement partiel' : 'Encaisser'}
          </button>
          {currentOrder.payments.length > 0 && currentOrder.payments.reduce((sum, p) => sum + p.amount, 0) >= currentOrder.total && (
            <button
              onClick={() => {
                if (state.currentOrderId) {
                  dispatch({ type: 'CLOSE_ORDER', payload: state.currentOrderId });
                  setView('tables');
                }
              }}
              className="w-full py-2 mt-2 bg-green-600 hover:bg-green-700 text-white rounded-xl font-bold text-sm active:scale-[0.98] transition-all"
            >
              ✓ Fermer la table (tout payé)
            </button>
          )}
        </div>
      </div>

      {/* Modifier Modal */}
      {showModifier && (
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="fixed inset-0 bg-black/60 flex items-center justify-center z-50 p-4" onClick={() => setShowModifier(null)}>
          <motion.div initial={{ scale: 0.9 }} animate={{ scale: 1 }} className="bg-slate-800 rounded-2xl border border-slate-700 p-5 w-full max-w-sm" onClick={e => e.stopPropagation()}>
            <div className="text-center mb-4">
              <span className="text-3xl">{showModifier.emoji}</span>
              <h3 className="text-lg font-bold text-white mt-1">{showModifier.name}</h3>
            </div>
            {showModifier.modifiers?.map(mod => (
              <div key={mod.id} className="mb-3">
                <p className="text-sm text-slate-300 mb-2">{mod.name}</p>
                <div className="grid grid-cols-2 gap-2">
                  {mod.options.map(opt => (
                    <button key={opt} onClick={() => setSelectedModifiers(p => ({ ...p, [mod.name]: opt }))}
                      className={`py-2 px-3 rounded-lg text-sm font-medium ${selectedModifiers[mod.name] === opt ? 'bg-blue-500 text-white' : 'bg-slate-700 text-slate-300'}`}>
                      {opt}
                    </button>
                  ))}
                </div>
              </div>
            ))}
            <textarea value={itemNotes} onChange={e => setItemNotes(e.target.value)} placeholder="Notes cuisine..."
              className="w-full p-2 bg-slate-700/50 border border-slate-600/50 rounded-xl text-white text-sm h-16 resize-none mb-3 focus:outline-none" />
            <button onClick={handleConfirmModifier} className="w-full py-3 bg-blue-500 hover:bg-blue-600 text-white rounded-xl font-bold">
              Ajouter
            </button>
          </motion.div>
        </motion.div>
      )}

      {/* Payment Modal */}
      {showPayment && (
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="fixed inset-0 bg-black/60 flex items-center justify-center z-50 p-4" onClick={() => !paymentProcessing && setShowPayment(false)}>
          <motion.div initial={{ scale: 0.9 }} animate={{ scale: 1 }} className="bg-slate-800 rounded-2xl border border-slate-700 p-5 w-full max-w-sm" onClick={e => e.stopPropagation()}>
            <h3 className="text-xl font-bold text-white text-center mb-2">Paiement</h3>
            <p className="text-2xl font-bold text-emerald-400 text-center mb-5">{currentOrder?.total.toFixed(2)} €</p>
            
            {/* Payment Progress */}
            {paymentProcessing && paymentProgress && (
              <div className="mb-4 p-3 bg-blue-500/10 border border-blue-500/30 rounded-xl">
                <div className="flex items-center gap-2">
                  <Loader2 className="w-4 h-4 text-blue-400 animate-spin" />
                  <span className="text-sm text-blue-300">{paymentProgress.message}</span>
                </div>
                <div className="mt-2 h-1 bg-slate-700 rounded-full overflow-hidden">
                  <motion.div
                    initial={{ width: '0%' }}
                    animate={{ width: '100%' }}
                    transition={{ duration: 3 }}
                    className="h-full bg-blue-500 rounded-full"
                  />
                </div>
              </div>
            )}

            {/* Payment Result */}
            {paymentResult && (
              <div className={`mb-4 p-3 rounded-xl border ${
                paymentResult.success ? 'bg-emerald-500/10 border-emerald-500/30' : 'bg-red-500/10 border-red-500/30'
              }`}>
                <div className="flex items-center gap-2">
                  {paymentResult.success ? (
                    <CheckCircle2 className="w-5 h-5 text-emerald-400" />
                  ) : (
                    <XCircle className="w-5 h-5 text-red-400" />
                  )}
                  <span className={`text-sm ${paymentResult.success ? 'text-emerald-300' : 'text-red-300'}`}>
                    {paymentResult.message}
                  </span>
                </div>
              </div>
            )}

            <div className="space-y-3">
              <button 
                onClick={() => handlePayment('cash')} 
                disabled={paymentProcessing}
                className="w-full py-4 bg-emerald-500 hover:bg-emerald-600 disabled:bg-slate-600 text-white rounded-xl font-bold flex items-center justify-center gap-2 active:scale-[0.98] transition-all"
              >
                <Banknote className="w-5 h-5" /> Espèces
              </button>
              <button 
                onClick={() => handlePayment('card')} 
                disabled={paymentProcessing}
                className="w-full py-4 bg-blue-500 hover:bg-blue-600 disabled:bg-slate-600 text-white rounded-xl font-bold flex items-center justify-center gap-2 active:scale-[0.98] transition-all"
              >
                <CreditCard className="w-5 h-5" /> Carte bancaire
                {terminalStatus === 'ready' && <span className="text-xs bg-white/20 px-2 py-0.5 rounded-full">TPE OK</span>}
              </button>
              <button 
                onClick={() => setShowPayment(false)} 
                disabled={paymentProcessing}
                className="w-full py-3 bg-slate-700 disabled:opacity-50 text-slate-300 rounded-xl"
              >
                Annuler
              </button>
            </div>
          </motion.div>
        </motion.div>
      )}

      {/* Notes Modal */}
      {showNotes && (
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="fixed inset-0 bg-black/60 flex items-center justify-center z-50 p-4" onClick={() => setShowNotes(null)}>
          <motion.div initial={{ scale: 0.9 }} animate={{ scale: 1 }} className="bg-slate-800 rounded-2xl border border-slate-700 p-5 w-full max-w-sm" onClick={e => e.stopPropagation()}>
            <h3 className="text-lg font-bold text-white mb-3">Note cuisine</h3>
            <textarea value={noteText} onChange={e => setNoteText(e.target.value)} placeholder="Ex: Sans gluten..."
              className="w-full p-3 bg-slate-700/50 border border-slate-600/50 rounded-xl text-white text-sm h-24 resize-none mb-3 focus:outline-none" />
            <div className="flex gap-2">
              <button onClick={() => setShowNotes(null)} className="flex-1 py-2 bg-slate-700 text-slate-300 rounded-xl">Annuler</button>
              <button onClick={() => {
                if (showNotes && state.currentOrderId) {
                  dispatch({ type: 'UPDATE_NOTES', payload: { orderId: state.currentOrderId, itemId: showNotes, notes: noteText } });
                }
                setShowNotes(null);
              }} className="flex-1 py-2 bg-blue-500 text-white rounded-xl">Sauver</button>
            </div>
          </motion.div>
        </motion.div>
      )}

      {/* Discount Modal */}
      {showDiscount && (
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="fixed inset-0 bg-black/60 flex items-center justify-center z-50 p-4" onClick={() => setShowDiscount(false)}>
          <motion.div initial={{ scale: 0.9 }} animate={{ scale: 1 }} className="bg-slate-800 rounded-2xl border border-slate-700 p-5 w-full max-w-sm" onClick={e => e.stopPropagation()}>
            <h3 className="text-lg font-bold text-white mb-3">Remise (%)</h3>
            <div className="flex gap-2 mb-3">
              {['5', '10', '15', '20'].map(v => (
                <button key={v} onClick={() => setDiscountValue(v)}
                  className={`flex-1 py-2 rounded-xl font-bold text-sm ${discountValue === v ? 'bg-amber-500 text-white' : 'bg-slate-700 text-slate-300'}`}>
                  {v}%
                </button>
              ))}
            </div>
            <input type="number" value={discountValue} onChange={e => setDiscountValue(e.target.value)} placeholder="Personnalisé"
              className="w-full p-2 bg-slate-700/50 border border-slate-600/50 rounded-xl text-white text-sm mb-3 focus:outline-none" />
            <div className="flex gap-2">
              <button onClick={() => setShowDiscount(false)} className="flex-1 py-2 bg-slate-700 text-slate-300 rounded-xl">Annuler</button>
              <button onClick={handleApplyDiscount} className="flex-1 py-2 bg-amber-500 text-white rounded-xl">Appliquer</button>
            </div>
          </motion.div>
        </motion.div>
      )}

      {/* Payment Modal (paiement partiel) */}
      {showPaymentModal && currentOrder && (
        <PaymentModal
          order={currentOrder}
          onClose={() => setShowPaymentModal(false)}
        />
      )}
    </div>
  );
}
