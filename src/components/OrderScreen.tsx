import { useState } from 'react';
import { usePOS } from '../store';
import { motion, AnimatePresence } from 'framer-motion';
import { Plus, Minus, Send, Trash2, CreditCard, Banknote, ArrowLeft, Search, X, StickyNote, Percent } from 'lucide-react';
import { categories, menuItems } from '../data';
import { MenuItem } from '../types';

export default function OrderScreen() {
  const { state, dispatch } = usePOS();
  const [activeCategory, setActiveCategory] = useState<string>('Tous');
  const [searchQuery, setSearchQuery] = useState('');
  const [showPayment, setShowPayment] = useState(false);
  const [showModifier, setShowModifier] = useState<MenuItem | null>(null);
  const [selectedModifiers, setSelectedModifiers] = useState<Record<string, string>>({});
  const [itemNotes, setItemNotes] = useState('');
  const [showNotes, setShowNotes] = useState<string | null>(null);
  const [noteText, setNoteText] = useState('');
  const [showDiscount, setShowDiscount] = useState(false);
  const [discountValue, setDiscountValue] = useState('');

  const currentTable = state.tables.find(t => t.id === state.currentOrder?.tableId);
  const order = state.currentOrder;

  const filteredItems = menuItems.filter(item => {
    const matchesCategory = activeCategory === 'Tous' || item.category === activeCategory;
    const matchesSearch = item.name.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesCategory && matchesSearch;
  });

  const handleAddItem = (item: MenuItem) => {
    if (item.modifiers && item.modifiers.length > 0) {
      setShowModifier(item);
      setSelectedModifiers({});
      setItemNotes('');
    } else {
      dispatch({ type: 'ADD_ITEM_TO_ORDER', payload: { menuItem: item } });
    }
  };

  const handleConfirmModifier = () => {
    if (showModifier) {
      dispatch({
        type: 'ADD_ITEM_TO_ORDER',
        payload: { menuItem: showModifier, modifiers: selectedModifiers, notes: itemNotes }
      });
      setShowModifier(null);
      setSelectedModifiers({});
      setItemNotes('');
    }
  };

  const handlePayment = (method: 'cash' | 'card') => {
    if (order) {
      dispatch({ type: 'PROCESS_PAYMENT', payload: { method, amount: order.total } });
      setShowPayment(false);
      dispatch({ type: 'CLOSE_ORDER' });
    }
  };

  const handleApplyDiscount = () => {
    const value = parseFloat(discountValue);
    if (!isNaN(value) && value >= 0 && value <= 100) {
      dispatch({ type: 'APPLY_DISCOUNT', payload: value });
      setShowDiscount(false);
      setDiscountValue('');
    }
  };

  if (!order || !currentTable) return null;

  const subtotal = order.items.reduce((sum, item) => sum + (item.menuItem.price * item.quantity), 0);

  return (
    <div className="h-full flex flex-col md:flex-row">
      {/* Left Panel - Menu */}
      <div className="flex-1 flex flex-col h-full md:h-full border-r border-slate-700/50">
        {/* Search & Category Tabs */}
        <div className="p-3 md:p-4 border-b border-slate-700/50">
          {/* Back button + Table info */}
          <div className="flex items-center justify-between mb-3">
            <button
              onClick={() => dispatch({ type: 'SET_VIEW', payload: 'floor' })}
              className="flex items-center gap-2 text-slate-400 hover:text-white transition-colors"
            >
              <ArrowLeft className="w-5 h-5" />
              <span className="text-sm">Retour</span>
            </button>
            <div className="text-right">
              <span className="text-lg font-bold text-white">{currentTable.name}</span>
              <span className="text-xs text-slate-400 ml-2">{currentTable.seats} places</span>
            </div>
          </div>

          {/* Search */}
          <div className="relative mb-3">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
            <input
              type="text"
              placeholder="Rechercher un article..."
              value={searchQuery}
              onChange={e => setSearchQuery(e.target.value)}
              className="w-full pl-9 pr-4 py-2.5 bg-slate-700/50 border border-slate-600/50 rounded-xl text-white placeholder-slate-400 text-sm focus:outline-none focus:border-blue-500/50"
            />
            {searchQuery && (
              <button onClick={() => setSearchQuery('')} className="absolute right-3 top-1/2 -translate-y-1/2">
                <X className="w-4 h-4 text-slate-400" />
              </button>
            )}
          </div>

          {/* Categories */}
          <div className="flex gap-2 overflow-x-auto pb-1 scrollbar-hide">
            <button
              onClick={() => setActiveCategory('Tous')}
              className={`px-3 py-1.5 rounded-full text-xs font-medium whitespace-nowrap transition-colors ${
                activeCategory === 'Tous'
                  ? 'bg-white text-slate-900'
                  : 'bg-slate-700/50 text-slate-300 hover:bg-slate-700'
              }`}
            >
              Tous
            </button>
            {categories.map(cat => (
              <button
                key={cat.id}
                onClick={() => setActiveCategory(cat.name)}
                className={`px-3 py-1.5 rounded-full text-xs font-medium whitespace-nowrap transition-colors flex items-center gap-1 ${
                  activeCategory === cat.name
                    ? 'text-white'
                    : 'bg-slate-700/50 text-slate-300 hover:bg-slate-700'
                }`}
                style={activeCategory === cat.name ? { backgroundColor: cat.color } : {}}
              >
                <span>{cat.emoji}</span>
                <span>{cat.name}</span>
              </button>
            ))}
          </div>
        </div>

        {/* Menu Items Grid */}
        <div className="flex-1 overflow-y-auto p-3 md:p-4">
          <div className="grid grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-2 md:gap-3">
            {filteredItems.map(item => (
              <motion.button
                key={item.id}
                whileTap={{ scale: 0.93 }}
                onClick={() => handleAddItem(item)}
                className="bg-slate-800/80 border border-slate-700/50 rounded-xl p-2 md:p-3 flex flex-col items-center justify-center gap-1 hover:border-slate-500/50 transition-all active:bg-slate-700/50"
              >
                <span className="text-2xl md:text-3xl">{item.emoji}</span>
                <span className="text-[10px] md:text-xs text-white font-medium text-center leading-tight">{item.name}</span>
                <span className="text-xs md:text-sm font-bold" style={{ color: item.color }}>
                  {item.price.toFixed(2)} €
                </span>
              </motion.button>
            ))}
          </div>
        </div>
      </div>

      {/* Right Panel - Current Order */}
      <div className="w-full md:w-96 flex flex-col bg-slate-800/30 h-[45vh] md:h-full">
        {/* Order Header */}
        <div className="p-4 border-b border-slate-700/50">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-lg font-bold text-white">Commande</h2>
              <p className="text-xs text-slate-400">{currentTable.name} • {order.server}</p>
            </div>
            <div className="flex gap-2">
              <button
                onClick={() => setShowDiscount(true)}
                className="p-2 bg-amber-500/10 border border-amber-500/30 rounded-lg text-amber-400 hover:bg-amber-500/20 transition-colors"
              >
                <Percent className="w-4 h-4" />
              </button>
              <button
                onClick={() => dispatch({ type: 'SEND_ORDER_TO_KITCHEN' })}
                className="p-2 bg-blue-500/10 border border-blue-500/30 rounded-lg text-blue-400 hover:bg-blue-500/20 transition-colors"
              >
                <Send className="w-4 h-4" />
              </button>
            </div>
          </div>
        </div>

        {/* Order Items */}
        <div className="flex-1 overflow-y-auto p-3 space-y-2">
          <AnimatePresence>
            {order.items.length === 0 ? (
              <div className="text-center py-8 text-slate-500">
                <p className="text-4xl mb-2">🍽️</p>
                <p className="text-sm">Ajoutez des articles</p>
              </div>
            ) : (
              order.items.map(item => (
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
                        <span className="text-lg">{item.menuItem.emoji}</span>
                        <span className="text-sm font-medium text-white">{item.menuItem.name}</span>
                      </div>
                      {item.modifiers && Object.keys(item.modifiers).length > 0 && (
                        <p className="text-xs text-blue-400 mt-0.5 ml-7">
                          {Object.entries(item.modifiers).map(([k, v]) => `${k}: ${v}`).join(', ')}
                        </p>
                      )}
                      {item.notes && (
                        <p className="text-xs text-amber-400 mt-0.5 ml-7 italic">
                          📝 {item.notes}
                        </p>
                      )}
                      <div className={`ml-7 mt-1 inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] ${
                        item.status === 'pending' ? 'bg-amber-500/20 text-amber-400' :
                        item.status === 'sent' ? 'bg-blue-500/20 text-blue-400' :
                        item.status === 'ready' ? 'bg-emerald-500/20 text-emerald-400' :
                        'bg-slate-500/20 text-slate-400'
                      }`}>
                        {item.status === 'pending' ? '⏳ En attente' :
                         item.status === 'sent' ? '🔥 En cuisine' :
                         item.status === 'ready' ? '✅ Prêt' : '🍽️ Servi'}
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <div className="flex items-center gap-1 bg-slate-600/50 rounded-lg">
                        <button
                          onClick={() => {
                            if (item.quantity <= 1) {
                              dispatch({ type: 'REMOVE_ITEM_FROM_ORDER', payload: item.id });
                            } else {
                              dispatch({ type: 'UPDATE_ITEM_QUANTITY', payload: { itemId: item.id, quantity: item.quantity - 1 } });
                            }
                          }}
                          className="p-1.5 hover:bg-slate-500/50 rounded-l-lg transition-colors"
                        >
                          <Minus className="w-3 h-3 text-white" />
                        </button>
                        <span className="text-sm font-bold text-white w-6 text-center">{item.quantity}</span>
                        <button
                          onClick={() => dispatch({ type: 'UPDATE_ITEM_QUANTITY', payload: { itemId: item.id, quantity: item.quantity + 1 } })}
                          className="p-1.5 hover:bg-slate-500/50 rounded-r-lg transition-colors"
                        >
                          <Plus className="w-3 h-3 text-white" />
                        </button>
                      </div>
                      <div className="text-right min-w-[50px]">
                        <p className="text-sm font-bold text-white">{(item.menuItem.price * item.quantity).toFixed(2)} €</p>
                      </div>
                    </div>
                  </div>
                  
                  {/* Notes & Delete */}
                  <div className="flex items-center justify-end gap-2 mt-2">
                    <button
                      onClick={() => {
                        setShowNotes(item.id);
                        setNoteText(item.notes);
                      }}
                      className="p-1 text-slate-500 hover:text-amber-400 transition-colors"
                    >
                      <StickyNote className="w-3.5 h-3.5" />
                    </button>
                    <button
                      onClick={() => dispatch({ type: 'REMOVE_ITEM_FROM_ORDER', payload: item.id })}
                      className="p-1 text-slate-500 hover:text-red-400 transition-colors"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </motion.div>
              ))
            )}
          </AnimatePresence>
        </div>

        {/* Order Total & Actions */}
        <div className="p-4 border-t border-slate-700/50 bg-slate-800/50">
          <div className="space-y-2 mb-4">
            <div className="flex justify-between text-sm">
              <span className="text-slate-400">Sous-total</span>
              <span className="text-white">{subtotal.toFixed(2)} €</span>
            </div>
            {order.discount > 0 && (
              <div className="flex justify-between text-sm">
                <span className="text-amber-400">Remise ({order.discount}%)</span>
                <span className="text-amber-400">-{(subtotal - order.total).toFixed(2)} €</span>
              </div>
            )}
            <div className="flex justify-between text-lg font-bold pt-2 border-t border-slate-700/50">
              <span className="text-white">Total</span>
              <span className="text-emerald-400">{order.total.toFixed(2)} €</span>
            </div>
          </div>

          <button
            onClick={() => setShowPayment(true)}
            disabled={order.items.length === 0}
            className="w-full py-4 bg-gradient-to-r from-emerald-500 to-emerald-600 hover:from-emerald-600 hover:to-emerald-700 disabled:from-slate-600 disabled:to-slate-700 disabled:text-slate-400 text-white rounded-xl font-bold text-lg transition-all active:scale-[0.98] shadow-lg shadow-emerald-500/20"
          >
            Encaisser • {order.total.toFixed(2)} €
          </button>
        </div>
      </div>

      {/* Modifier Modal */}
      {showModifier && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="fixed inset-0 bg-black/60 flex items-center justify-center z-50 p-4"
          onClick={() => setShowModifier(null)}
        >
          <motion.div
            initial={{ scale: 0.9, y: 20 }}
            animate={{ scale: 1, y: 0 }}
            className="bg-slate-800 rounded-2xl border border-slate-700 p-6 w-full max-w-sm"
            onClick={e => e.stopPropagation()}
          >
            <div className="text-center mb-4">
              <span className="text-4xl">{showModifier.emoji}</span>
              <h3 className="text-xl font-bold text-white mt-2">{showModifier.name}</h3>
              <p className="text-emerald-400 font-bold">{showModifier.price.toFixed(2)} €</p>
            </div>

            {showModifier.modifiers?.map(mod => (
              <div key={mod.id} className="mb-4">
                <p className="text-sm font-medium text-slate-300 mb-2">
                  {mod.name} {mod.required && <span className="text-red-400">*</span>}
                </p>
                <div className="grid grid-cols-2 gap-2">
                  {mod.options.map(opt => (
                    <button
                      key={opt}
                      onClick={() => setSelectedModifiers(prev => ({ ...prev, [mod.name]: opt }))}
                      className={`py-2 px-3 rounded-lg text-sm font-medium transition-colors ${
                        selectedModifiers[mod.name] === opt
                          ? 'bg-blue-500 text-white'
                          : 'bg-slate-700 text-slate-300 hover:bg-slate-600'
                      }`}
                    >
                      {opt}
                    </button>
                  ))}
                </div>
              </div>
            ))}

            <div className="mb-4">
              <p className="text-sm font-medium text-slate-300 mb-2">Notes cuisine</p>
              <textarea
                value={itemNotes}
                onChange={e => setItemNotes(e.target.value)}
                placeholder="Ex: Sans oignons, bien cuit..."
                className="w-full p-3 bg-slate-700/50 border border-slate-600/50 rounded-xl text-white placeholder-slate-400 text-sm resize-none h-20 focus:outline-none focus:border-blue-500/50"
              />
            </div>

            <button
              onClick={handleConfirmModifier}
              className="w-full py-3 bg-blue-500 hover:bg-blue-600 text-white rounded-xl font-bold transition-colors"
            >
              Ajouter à la commande
            </button>
          </motion.div>
        </motion.div>
      )}

      {/* Payment Modal */}
      {showPayment && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="fixed inset-0 bg-black/60 flex items-center justify-center z-50 p-4"
          onClick={() => setShowPayment(false)}
        >
          <motion.div
            initial={{ scale: 0.9, y: 20 }}
            animate={{ scale: 1, y: 0 }}
            className="bg-slate-800 rounded-2xl border border-slate-700 p-6 w-full max-w-sm"
            onClick={e => e.stopPropagation()}
          >
            <h3 className="text-2xl font-bold text-white text-center mb-2">Paiement</h3>
            <p className="text-3xl font-bold text-emerald-400 text-center mb-6">{order.total.toFixed(2)} €</p>

            <div className="space-y-3">
              <button
                onClick={() => handlePayment('cash')}
                className="w-full py-4 bg-emerald-500 hover:bg-emerald-600 text-white rounded-xl font-bold text-lg flex items-center justify-center gap-3 transition-colors active:scale-[0.98]"
              >
                <Banknote className="w-6 h-6" />
                Espèces
              </button>
              <button
                onClick={() => handlePayment('card')}
                className="w-full py-4 bg-blue-500 hover:bg-blue-600 text-white rounded-xl font-bold text-lg flex items-center justify-center gap-3 transition-colors active:scale-[0.98]"
              >
                <CreditCard className="w-6 h-6" />
                Carte bancaire
              </button>
              <button
                onClick={() => setShowPayment(false)}
                className="w-full py-3 bg-slate-700/50 hover:bg-slate-700 text-slate-300 rounded-xl font-medium transition-colors"
              >
                Annuler
              </button>
            </div>
          </motion.div>
        </motion.div>
      )}

      {/* Notes Modal */}
      {showNotes && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="fixed inset-0 bg-black/60 flex items-center justify-center z-50 p-4"
          onClick={() => setShowNotes(null)}
        >
          <motion.div
            initial={{ scale: 0.9, y: 20 }}
            animate={{ scale: 1, y: 0 }}
            className="bg-slate-800 rounded-2xl border border-slate-700 p-6 w-full max-w-sm"
            onClick={e => e.stopPropagation()}
          >
            <h3 className="text-lg font-bold text-white mb-3">Note cuisine</h3>
            <textarea
              value={noteText}
              onChange={e => setNoteText(e.target.value)}
              placeholder="Ex: Sans gluten, allergie..."
              className="w-full p-3 bg-slate-700/50 border border-slate-600/50 rounded-xl text-white placeholder-slate-400 text-sm resize-none h-24 focus:outline-none focus:border-blue-500/50"
            />
            <div className="flex gap-3 mt-4">
              <button
                onClick={() => setShowNotes(null)}
                className="flex-1 py-2 bg-slate-700 hover:bg-slate-600 text-slate-300 rounded-xl font-medium transition-colors"
              >
                Annuler
              </button>
              <button
                onClick={() => {
                  if (showNotes) {
                    dispatch({ type: 'UPDATE_ITEM_NOTES', payload: { itemId: showNotes, notes: noteText } });
                  }
                  setShowNotes(null);
                }}
                className="flex-1 py-2 bg-blue-500 hover:bg-blue-600 text-white rounded-xl font-medium transition-colors"
              >
                Sauvegarder
              </button>
            </div>
          </motion.div>
        </motion.div>
      )}

      {/* Discount Modal */}
      {showDiscount && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="fixed inset-0 bg-black/60 flex items-center justify-center z-50 p-4"
          onClick={() => setShowDiscount(false)}
        >
          <motion.div
            initial={{ scale: 0.9, y: 20 }}
            animate={{ scale: 1, y: 0 }}
            className="bg-slate-800 rounded-2xl border border-slate-700 p-6 w-full max-w-sm"
            onClick={e => e.stopPropagation()}
          >
            <h3 className="text-lg font-bold text-white mb-3">Appliquer une remise</h3>
            <div className="flex gap-2 mb-4">
              {['5', '10', '15', '20'].map(v => (
                <button
                  key={v}
                  onClick={() => setDiscountValue(v)}
                  className={`flex-1 py-3 rounded-xl font-bold text-sm transition-colors ${
                    discountValue === v ? 'bg-amber-500 text-white' : 'bg-slate-700 text-slate-300 hover:bg-slate-600'
                  }`}
                >
                  {v}%
                </button>
              ))}
            </div>
            <input
              type="number"
              value={discountValue}
              onChange={e => setDiscountValue(e.target.value)}
              placeholder="Ou saisir un %"
              className="w-full p-3 bg-slate-700/50 border border-slate-600/50 rounded-xl text-white placeholder-slate-400 text-sm mb-4 focus:outline-none focus:border-amber-500/50"
            />
            <div className="flex gap-3">
              <button
                onClick={() => setShowDiscount(false)}
                className="flex-1 py-2 bg-slate-700 hover:bg-slate-600 text-slate-300 rounded-xl font-medium transition-colors"
              >
                Annuler
              </button>
              <button
                onClick={handleApplyDiscount}
                className="flex-1 py-2 bg-amber-500 hover:bg-amber-600 text-white rounded-xl font-medium transition-colors"
              >
                Appliquer
              </button>
            </div>
          </motion.div>
        </motion.div>
      )}
    </div>
  );
}
