import { usePOS } from '../store';
import { motion } from 'framer-motion';
import { Users, Coffee, UtensilsCrossed, Sparkles } from 'lucide-react';
import { useState } from 'react';

export default function FloorPlan() {
  const { state, dispatch } = usePOS();
  const [selectedTable, setSelectedTable] = useState<string | null>(null);
  const [showActions, setShowActions] = useState(false);

  const handleTableClick = (tableId: string) => {
    const table = state.tables.find(t => t.id === tableId);
    if (!table) return;

    if (table.status === 'free') {
      dispatch({ type: 'OPEN_TABLE', payload: tableId });
    } else if (table.status === 'occupied') {
      setSelectedTable(tableId);
      setShowActions(true);
    } else if (table.status === 'cleaning') {
      dispatch({ type: 'SET_TABLE_STATUS', payload: { tableId, status: 'free' } });
    }
  };

  const getTableColor = (status: string) => {
    switch (status) {
      case 'free': return 'from-emerald-500/20 to-emerald-600/10 border-emerald-500/50 hover:border-emerald-400';
      case 'occupied': return 'from-red-500/20 to-red-600/10 border-red-500/50 hover:border-red-400';
      case 'reserved': return 'from-amber-500/20 to-amber-600/10 border-amber-500/50 hover:border-amber-400';
      case 'cleaning': return 'from-blue-500/20 to-blue-600/10 border-blue-500/50 hover:border-blue-400';
      default: return 'from-slate-500/20 to-slate-600/10 border-slate-500/50';
    }
  };

  const getTableOrder = (tableId: string) => {
    return state.orders.find(o => o.tableId === tableId && o.status === 'open');
  };

  const handleTransfer = (toTableId: string) => {
    if (selectedTable) {
      dispatch({ type: 'TRANSFER_TABLE', payload: { fromTableId: selectedTable, toTableId } });
      setShowActions(false);
      setSelectedTable(null);
    }
  };

  return (
    <div className="h-full flex flex-col p-4 md:p-6">
      <div className="flex items-center justify-between mb-4">
        <div>
          <h1 className="text-2xl md:text-3xl font-bold text-white">Plan de salle</h1>
          <p className="text-slate-400 text-sm mt-1">
            {state.tables.filter(t => t.status === 'free').length} tables libres •{' '}
            {state.tables.filter(t => t.status === 'occupied').length} occupées
          </p>
        </div>
        <div className="flex gap-2">
          <div className="flex items-center gap-1 px-2 py-1 rounded-full bg-emerald-500/10 border border-emerald-500/30">
            <div className="w-2 h-2 rounded-full bg-emerald-500" />
            <span className="text-xs text-emerald-400">Libre</span>
          </div>
          <div className="flex items-center gap-1 px-2 py-1 rounded-full bg-red-500/10 border border-red-500/30">
            <div className="w-2 h-2 rounded-full bg-red-500" />
            <span className="text-xs text-red-400">Occupée</span>
          </div>
          <div className="hidden md:flex items-center gap-1 px-2 py-1 rounded-full bg-amber-500/10 border border-amber-500/30">
            <div className="w-2 h-2 rounded-full bg-amber-500" />
            <span className="text-xs text-amber-400">Réservée</span>
          </div>
        </div>
      </div>

      {/* Floor Plan Grid */}
      <div className="flex-1 relative bg-slate-800/30 rounded-xl border border-slate-700/50 overflow-hidden">
        {/* Restaurant Layout */}
        <div className="absolute inset-0 p-4">
          {/* Section label: Salle principale */}
          <div className="absolute top-2 left-4 text-xs text-slate-500 uppercase tracking-wider">
            Salle principale
          </div>
          
          {/* Tables Grid */}
          <div className="grid grid-cols-4 md:grid-cols-4 gap-3 md:gap-4 h-full pt-6 pb-24">
            {state.tables.filter(t => !t.id.startsWith('bar')).map(table => {
              const order = getTableOrder(table.id);
              const isSelected = selectedTable === table.id;
              return (
                <motion.button
                  key={table.id}
                  whileTap={{ scale: 0.95 }}
                  onClick={() => handleTableClick(table.id)}
                  className={`relative rounded-xl border-2 bg-gradient-to-br ${getTableColor(table.status)} 
                    p-3 md:p-4 flex flex-col items-center justify-center transition-all duration-200
                    ${isSelected ? 'ring-2 ring-white ring-offset-2 ring-offset-slate-900' : ''}`}
                >
                  {/* Table number */}
                  <span className="text-lg md:text-xl font-bold text-white">{table.name}</span>
                  
                  {/* Seats */}
                  <div className="flex items-center gap-1 mt-1">
                    <Users className="w-3 h-3 text-slate-400" />
                    <span className="text-xs text-slate-400">{table.seats}</span>
                  </div>
                  
                  {/* Order info */}
                  {order && (
                    <div className="mt-2 text-center">
                      <p className="text-xs font-medium text-white">{order.total.toFixed(2)} €</p>
                      <p className="text-[10px] text-slate-400">{order.items.length} art.</p>
                    </div>
                  )}

                  {/* Status indicator */}
                  {table.status === 'occupied' && order && order.items.some(i => i.status === 'pending') && (
                    <div className="absolute top-1 right-1 w-3 h-3 bg-amber-500 rounded-full animate-pulse" />
                  )}
                </motion.button>
              );
            })}
          </div>

          {/* Bar Section */}
          <div className="absolute bottom-0 left-0 right-0 h-20 bg-slate-800/50 border-t border-slate-700/50 rounded-b-xl">
            <div className="absolute top-1 left-4 text-xs text-slate-500 uppercase tracking-wider flex items-center gap-1">
              <Coffee className="w-3 h-3" /> Bar
            </div>
            <div className="flex gap-2 p-2 pt-5 h-full items-center">
              {state.tables.filter(t => t.id.startsWith('bar')).map(table => {
                const order = getTableOrder(table.id);
                return (
                  <motion.button
                    key={table.id}
                    whileTap={{ scale: 0.9 }}
                    onClick={() => handleTableClick(table.id)}
                    className={`flex-1 h-full rounded-lg border-2 bg-gradient-to-br ${getTableColor(table.status)} 
                      flex flex-col items-center justify-center transition-all`}
                  >
                    <span className="text-xs font-bold text-white">{table.name}</span>
                    {order && (
                      <span className="text-[10px] text-emerald-400">{order.total.toFixed(2)}€</span>
                    )}
                  </motion.button>
                );
              })}
            </div>
          </div>
        </div>
      </div>

      {/* Table Actions Modal */}
      {showActions && selectedTable && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="fixed inset-0 bg-black/60 flex items-center justify-center z-50 p-4"
          onClick={() => setShowActions(false)}
        >
          <motion.div
            initial={{ scale: 0.9, y: 20 }}
            animate={{ scale: 1, y: 0 }}
            className="bg-slate-800 rounded-2xl border border-slate-700 p-6 w-full max-w-sm"
            onClick={e => e.stopPropagation()}
          >
            <h3 className="text-xl font-bold text-white mb-4">
              Table {state.tables.find(t => t.id === selectedTable)?.name}
            </h3>
            
            <div className="space-y-3">
              <button
                onClick={() => {
                  dispatch({ type: 'OPEN_TABLE', payload: selectedTable });
                  setShowActions(false);
                }}
                className="w-full py-3 px-4 bg-blue-500 hover:bg-blue-600 text-white rounded-xl font-medium flex items-center justify-center gap-2 transition-colors"
              >
                <UtensilsCrossed className="w-5 h-5" />
                Voir la commande
              </button>
              
              <button
                onClick={() => {
                  dispatch({ type: 'SET_TABLE_STATUS', payload: { tableId: selectedTable, status: 'cleaning' } });
                  setShowActions(false);
                  setSelectedTable(null);
                }}
                className="w-full py-3 px-4 bg-slate-700 hover:bg-slate-600 text-white rounded-xl font-medium flex items-center justify-center gap-2 transition-colors"
              >
                <Sparkles className="w-5 h-5" />
                Marquer nettoyage
              </button>

              <div className="pt-2 border-t border-slate-700">
                <p className="text-sm text-slate-400 mb-2">Transférer vers :</p>
                <div className="grid grid-cols-4 gap-2">
                  {state.tables.filter(t => t.status === 'free' && t.id !== selectedTable && !t.id.startsWith('bar')).map(t => (
                    <button
                      key={t.id}
                      onClick={() => handleTransfer(t.id)}
                      className="py-2 px-3 bg-emerald-500/20 hover:bg-emerald-500/30 border border-emerald-500/30 text-emerald-400 rounded-lg text-sm font-medium transition-colors"
                    >
                      {t.name}
                    </button>
                  ))}
                </div>
              </div>

              <button
                onClick={() => setShowActions(false)}
                className="w-full py-3 px-4 bg-slate-700/50 hover:bg-slate-700 text-slate-300 rounded-xl font-medium transition-colors"
              >
                Annuler
              </button>
            </div>
          </motion.div>
        </motion.div>
      )}
    </div>
  );
}
