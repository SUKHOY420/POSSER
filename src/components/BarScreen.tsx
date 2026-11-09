import { motion } from 'framer-motion';
import { Clock, Wine, Check, LogOut, AlertCircle } from 'lucide-react';
import { usePOS, syncManager } from '../store';
import { useEffect, useState } from 'react';

export default function BarScreen() {
  const { state, dispatch } = usePOS();
  const [currentTime, setCurrentTime] = useState(new Date());
  const [alert, setAlert] = useState(false);

  useEffect(() => {
    const timer = setInterval(() => setCurrentTime(new Date()), 1000);
    return () => clearInterval(timer);
  }, []);

  // Écouter les notifications de nouvelles commandes
  useEffect(() => {
    const unsub = syncManager.on('BAR_NOTIFY', () => {
      setAlert(true);
      // Son de notification
      try {
        const ctx = new AudioContext();
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();
        osc.connect(gain);
        gain.connect(ctx.destination);
        osc.frequency.value = 600;
        gain.gain.setValueAtTime(0.3, ctx.currentTime);
        gain.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + 0.5);
        osc.start();
        osc.stop(ctx.currentTime + 0.5);
      } catch (e) {}
      setTimeout(() => setAlert(false), 3000);
    });
    return unsub;
  }, []);

  // Filtrer uniquement les tickets avec des boissons
  const barOrders = state.tickets
    .filter(t => t.status === 'OPEN')
    .map(ticket => {
      const drinkItems = ticket.items.filter(i => !i.menuItem.isFood && i.status !== 'served');
      const table = state.tables.find(t => t.id === ticket.tableId);
      return { ticket, drinkItems, table };
    })
    .filter(o => o.drinkItems.length > 0);

  const handleMarkReady = (ticketId: string, itemId: string) => {
    dispatch({
      type: 'MARK_STATUS',
      payload: { ticketId, itemId, status: 'ready' }
    });
  };

  const handleAllReady = (ticketId: string, items: any[]) => {
    items.forEach(item => {
      if (item.status !== 'ready' && item.status !== 'served') {
        dispatch({
          type: 'MARK_STATUS',
          payload: { ticketId, itemId: item.id, status: 'ready' }
        });
      }
    });
  };

  return (
    <div className="h-screen-safe w-screen flex flex-col gradient-dark overflow-hidden">
      {/* Header */}
      <header className={`h-16 md:h-20 border-b flex items-center justify-between px-4 md:px-6 shrink-0 transition-all overflow-hidden ${
        alert ? 'bg-gradient-to-r from-purple-900/70 to-blue-900/70 border-purple-500/50 animate-pulse-custom' : 'glass border-white/10'
      }`}>
        <div className="flex items-center gap-3">
          <motion.div
            animate={alert ? { rotate: [0, -10, 10, -10, 0] } : {}}
            transition={{ duration: 0.5 }}
            className="w-12 h-12 rounded-xl bg-gradient-to-br from-purple-500 to-blue-600 flex items-center justify-center shadow-lg"
          >
            <Wine className="w-6 h-6 text-white" />
          </motion.div>
          <div>
            <h1 className="text-lg md:text-xl font-bold text-white flex items-center gap-2">
              Bar
              {alert && (
                <motion.span
                  initial={{ scale: 0 }}
                  animate={{ scale: [1, 1.2, 1] }}
                  transition={{ duration: 0.5, repeat: Infinity }}
                  className="text-xs bg-gradient-to-r from-purple-500 to-blue-600 text-white px-3 py-1 rounded-full font-bold shadow-lg"
                >
                  NOUVELLE !
                </motion.span>
              )}
            </h1>
            <p className="text-xs text-slate-400">{barOrders.length} commande(s) de boissons</p>
          </div>
        </div>
        <div className="flex items-center gap-3 md:gap-4">
          <div className="glass-card px-3 py-2 rounded-lg">
            <p className="text-xl md:text-2xl font-mono font-bold text-white">
              {currentTime.toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit', second: '2-digit' })}
            </p>
          </div>
          <motion.button 
            whileHover={{ scale: 1.1 }}
            whileTap={{ scale: 0.9 }}
            onClick={() => dispatch({ type: 'SET_SCREEN', payload: 'select' })} 
            className="p-2 text-purple-300/70 hover:text-white touch-target"
          >
            <LogOut className="w-5 h-5" />
          </motion.button>
        </div>
      </header>

      {/* Stats rapides */}
      <div className="px-4 md:px-6 py-3 border-b border-white/10 glass flex items-center gap-4 shrink-0">
        <div className="flex items-center gap-2">
          <div className="w-3 h-3 rounded-full bg-purple-500 shadow-lg shadow-purple-500/50" />
          <span className="text-sm text-slate-300">En attente: {barOrders.filter(o => o.drinkItems.some(i => i.status === 'sent')).length}</span>
        </div>
        <div className="flex items-center gap-2">
          <div className="w-3 h-3 rounded-full bg-blue-500 shadow-lg shadow-blue-500/50" />
          <span className="text-sm text-slate-300">En préparation: {barOrders.filter(o => o.drinkItems.some(i => i.status === 'preparing')).length}</span>
        </div>
        <div className="flex items-center gap-2">
          <div className="w-3 h-3 rounded-full bg-emerald-500 shadow-lg shadow-emerald-500/50" />
          <span className="text-sm text-slate-300">Prêtes: {barOrders.filter(o => o.drinkItems.every(i => i.status === 'ready' || i.status === 'served')).length}</span>
        </div>
      </div>

      {/* Orders Grid */}
      <div className="flex-1 overflow-y-auto p-4 md:p-6 container-responsive">
        {barOrders.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-full text-slate-500">
            <motion.div
              animate={{ y: [0, -10, 0] }}
              transition={{ duration: 2, repeat: Infinity }}
            >
              <Wine className="w-24 h-24 mb-4 opacity-20" />
            </motion.div>
            <p className="text-xl">Aucune commande de boissons</p>
            <p className="text-sm text-slate-600 mt-2">Les commandes apparaîtront ici en temps réel</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 2xl:grid-cols-4 gap-4">
            {barOrders.map(({ ticket, drinkItems, table }, index) => {
              const allReady = drinkItems.every(i => i.status === 'ready' || i.status === 'served');
              const elapsed = Math.floor((currentTime.getTime() - new Date(ticket.createdAt).getTime()) / 60000);
              const hasPending = drinkItems.some(i => i.status === 'sent');

              return (
                <motion.div
                  key={ticket.id}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: index * 0.1 }}
                  className={`rounded-2xl border-2 overflow-hidden hover-lift ${
                    allReady ? 'border-emerald-500/50 status-free' :
                    elapsed > 10 ? 'border-red-500/70 status-occupied animate-pulse-custom' :
                    'border-purple-500/30 glass-card'
                  }`}
                >
                  {/* Header */}
                  <div className={`p-3 md:p-4 flex items-center justify-between ${
                    elapsed > 10 ? 'bg-red-500/20' : 'glass-light'
                  }`}>
                    <div className="flex items-center gap-2">
                      <span className="text-2xl md:text-3xl font-bold text-white">{table?.name}</span>
                      <motion.div
                        whileHover={{ scale: 1.2 }}
                        className="w-6 h-6 rounded-full flex items-center justify-center text-white text-xs font-bold shadow-lg"
                        style={{ backgroundColor: state.servers.find(s => s.name === ticket.serverName)?.color || '#64748b' }}
                      >
                        {ticket.serverName[0]}
                      </motion.div>
                    </div>
                    <motion.div
                      animate={elapsed > 10 ? { scale: [1, 1.1, 1] } : {}}
                      transition={{ duration: 1, repeat: Infinity }}
                      className="flex items-center gap-1 px-3 py-1.5 rounded-full text-xs glass font-bold"
                    >
                      <Clock className="w-3 h-3" />
                      {elapsed} min
                    </motion.div>
                  </div>

                  {/* Drink Items */}
                  <div className="p-3 md:p-4 space-y-2">
                    {drinkItems.map((item, itemIndex) => (
                      <motion.div
                        key={item.id}
                        initial={{ opacity: 0, x: -20 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{ delay: itemIndex * 0.05 }}
                        className={`p-3 md:p-4 rounded-xl border ${
                          item.status === 'ready' ? 'status-free' :
                          item.status === 'preparing' ? 'bg-gradient-to-br from-blue-500/20 to-purple-500/20 border-blue-500/30' :
                          'glass-card'
                        }`}
                      >
                        <div className="flex items-start justify-between">
                          <div className="flex-1">
                            <div className="flex items-center gap-2 mb-1">
                              <span className="text-2xl">{item.menuItem.emoji}</span>
                              <span className="text-base md:text-lg font-bold text-white">
                                {item.quantity}x {item.menuItem.name}
                              </span>
                            </div>
                            {item.notes && (
                              <motion.p
                                initial={{ opacity: 0 }}
                                animate={{ opacity: 1 }}
                                className="text-xs text-amber-400 italic"
                              >
                                📝 {item.notes}
                              </motion.p>
                            )}
                            {Object.keys(item.modifiers).length > 0 && (
                              <p className="text-xs text-blue-400 mt-1">
                                {Object.entries(item.modifiers).map(([k, v]) => `${k}: ${v}`).join(' • ')}
                              </p>
                            )}
                          </div>
                          
                          {/* Status Badge */}
                          <div className="flex flex-col gap-2">
                            {item.status === 'sent' && (
                              <motion.button
                                whileHover={{ scale: 1.1 }}
                                whileTap={{ scale: 0.9 }}
                                onClick={() => handleMarkReady(ticket.id, item.id)}
                                className="px-3 py-2 bg-gradient-to-r from-purple-500 to-blue-600 rounded-lg text-white text-xs font-bold touch-target shadow-lg"
                              >
                                Prêt
                              </motion.button>
                            )}
                            {item.status === 'preparing' && (
                              <motion.button
                                whileHover={{ scale: 1.1 }}
                                whileTap={{ scale: 0.9 }}
                                onClick={() => handleMarkReady(ticket.id, item.id)}
                                className="p-2 status-free rounded-lg text-emerald-400 touch-target"
                              >
                                <Check className="w-5 h-5" />
                              </motion.button>
                            )}
                            {item.status === 'ready' && (
                              <motion.div
                                initial={{ scale: 0 }}
                                animate={{ scale: 1 }}
                                className="p-2 status-free rounded-lg"
                              >
                                <Check className="w-5 h-5 text-emerald-400" />
                              </motion.div>
                            )}
                          </div>
                        </div>
                      </motion.div>
                    ))}
                  </div>

                  {/* Footer Actions */}
                  {!allReady && (
                    <div className="p-3 md:p-4 border-t border-white/10">
                      <motion.button
                        whileHover={{ scale: 1.02 }}
                        whileTap={{ scale: 0.98 }}
                        onClick={() => handleAllReady(ticket.id, drinkItems)}
                        className="w-full py-3 bg-gradient-to-r from-emerald-500 to-emerald-600 text-white rounded-xl text-sm md:text-base font-medium flex items-center justify-center gap-2 touch-target shadow-lg"
                      >
                        <Check className="w-5 h-5" /> Tout prêt
                      </motion.button>
                    </div>
                  )}

                  {allReady && (
                    <div className="p-3 md:p-4 border-t border-emerald-500/30 bg-gradient-to-r from-emerald-500/10 to-emerald-600/10">
                      <p className="text-center text-sm font-medium text-emerald-400 flex items-center justify-center gap-2">
                        <Check className="w-4 h-4" />
                        Commande prête à servir
                      </p>
                    </div>
                  )}
                </motion.div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
