import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Clock, ChefHat, Check, Play, LogOut } from 'lucide-react';
import { usePOS, syncManager } from '../store';

export default function KitchenScreen() {
  const { state, dispatch } = usePOS();
  const [currentTime, setCurrentTime] = useState(new Date());
  const [alert, setAlert] = useState(false);

  useEffect(() => {
    const timer = setInterval(() => setCurrentTime(new Date()), 1000);
    return () => clearInterval(timer);
  }, []);

  useEffect(() => {
    const unsub = syncManager.on('KITCHEN_NOTIFY', () => {
      setAlert(true);
      try {
        const ctx = new AudioContext();
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();
        osc.connect(gain); gain.connect(ctx.destination);
        osc.frequency.value = 800;
        gain.gain.setValueAtTime(0.3, ctx.currentTime);
        gain.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + 0.5);
        osc.start(); osc.stop(ctx.currentTime + 0.5);
      } catch (e) {}
      setTimeout(() => setAlert(false), 3000);
    });
    return unsub;
  }, []);

  const kitchenOrders = state.tickets
    .filter(t => t.status === 'OPEN')
    .map(ticket => {
      const foodItems = ticket.items.filter(i => i.menuItem.isFood && i.status !== 'served');
      const table = state.tables.find(t => t.id === ticket.tableId);
      return { ticket, foodItems, table };
    })
    .filter(o => o.foodItems.length > 0);

  return (
    <div className="h-screen-safe w-screen flex flex-col gradient-dark overflow-hidden">
      <header className={`h-16 md:h-20 border-b flex items-center justify-between px-4 md:px-6 shrink-0 transition-all overflow-hidden ${
        alert ? 'bg-gradient-to-r from-red-900/70 to-orange-900/70 border-red-500/50 animate-pulse-custom' : 'glass border-white/10'
      }`}>
        <div className="flex items-center gap-3">
          <motion.div
            animate={alert ? { rotate: [0, -10, 10, -10, 0] } : {}}
            transition={{ duration: 0.5 }}
            className="w-12 h-12 rounded-xl gradient-warning flex items-center justify-center shadow-lg"
          >
            <ChefHat className="w-6 h-6 text-white" />
          </motion.div>
          <div>
            <h1 className="text-lg md:text-xl font-bold text-white flex items-center gap-2">
              Cuisine
              {alert && (
                <motion.span
                  initial={{ scale: 0 }}
                  animate={{ scale: [1, 1.2, 1] }}
                  transition={{ duration: 0.5, repeat: Infinity }}
                  className="text-xs gradient-danger text-white px-3 py-1 rounded-full font-bold shadow-lg"
                >
                  NOUVELLE !
                </motion.span>
              )}
            </h1>
            <p className="text-xs text-slate-400">{kitchenOrders.length} commande(s)</p>
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
            className="p-2 text-amber-300/70 hover:text-white touch-target"
          >
            <LogOut className="w-5 h-5" />
          </motion.button>
        </div>
      </header>

      <div className="flex-1 overflow-y-auto p-4 md:p-6 container-responsive">
        {kitchenOrders.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-full text-slate-500">
            <motion.div
              animate={{ y: [0, -10, 0] }}
              transition={{ duration: 2, repeat: Infinity }}
            >
              <ChefHat className="w-24 h-24 mb-4 opacity-20" />
            </motion.div>
            <p className="text-xl">Aucune commande en cuisine</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 2xl:grid-cols-4 gap-4">
            {kitchenOrders.map(({ ticket, foodItems, table }, index) => {
              const allReady = foodItems.every(i => i.status === 'ready' || i.status === 'served');
              const elapsed = Math.floor((currentTime.getTime() - new Date(ticket.createdAt).getTime()) / 60000);

              return (
                <motion.div
                  key={ticket.id}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: index * 0.1 }}
                  className={`rounded-2xl border-2 overflow-hidden hover-lift ${
                    allReady ? 'border-emerald-500/50 status-free' :
                    elapsed > 15 ? 'border-red-500/70 status-occupied animate-pulse-custom' :
                    'border-amber-500/30 glass-card'
                  }`}
                >
                  <div className={`p-3 md:p-4 flex items-center justify-between ${
                    elapsed > 15 ? 'bg-red-500/20' : 'glass-light'
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
                      animate={elapsed > 15 ? { scale: [1, 1.1, 1] } : {}}
                      transition={{ duration: 1, repeat: Infinity }}
                      className="flex items-center gap-1 px-3 py-1.5 rounded-full text-xs glass font-bold"
                    >
                      <Clock className="w-3 h-3" />
                      {elapsed} min
                    </motion.div>
                  </div>

                  <div className="p-3 md:p-4 space-y-2">
                    {foodItems.map((item, itemIndex) => (
                      <motion.div
                        key={item.id}
                        initial={{ opacity: 0, x: -20 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{ delay: itemIndex * 0.05 }}
                        className={`p-3 md:p-4 rounded-xl border ${
                          item.status === 'ready' ? 'status-free' :
                          item.status === 'preparing' ? 'status-reserved' :
                          'glass-card'
                        }`}
                      >
                        <div className="flex items-start justify-between">
                          <div className="flex-1">
                            <div className="flex items-center gap-2 mb-1">
                              <span className="text-2xl">{item.menuItem.emoji}</span>
                              <span className="text-base md:text-lg font-bold text-white">{item.quantity}x {item.menuItem.name}</span>
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
                          {item.status === 'sent' && (
                            <motion.button
                              whileHover={{ scale: 1.1 }}
                              whileTap={{ scale: 0.9 }}
                              onClick={() => dispatch({ type: 'MARK_STATUS', payload: { ticketId: ticket.id, itemId: item.id, status: 'preparing' } })}
                              className="p-2 status-reserved rounded-lg text-blue-400 touch-target"
                            >
                              <Play className="w-5 h-5" />
                            </motion.button>
                          )}
                          {item.status === 'preparing' && (
                            <motion.button
                              whileHover={{ scale: 1.1 }}
                              whileTap={{ scale: 0.9 }}
                              onClick={() => dispatch({ type: 'MARK_STATUS', payload: { ticketId: ticket.id, itemId: item.id, status: 'ready' } })}
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
                      </motion.div>
                    ))}
                  </div>

                  {!allReady && (
                    <div className="p-3 md:p-4 border-t border-white/10">
                      <motion.button
                        whileHover={{ scale: 1.02 }}
                        whileTap={{ scale: 0.98 }}
                        onClick={() => foodItems.forEach(i => {
                          if (i.status !== 'ready' && i.status !== 'served') {
                            dispatch({ type: 'MARK_STATUS', payload: { ticketId: ticket.id, itemId: i.id, status: 'ready' } });
                          }
                        })}
                        className="w-full py-3 btn-success text-sm md:text-base font-medium flex items-center justify-center gap-2 touch-target"
                      >
                        <Check className="w-5 h-5" /> Tout prêt
                      </motion.button>
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
