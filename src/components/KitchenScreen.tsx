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
    <div className="h-screen flex flex-col bg-slate-900">
      <header className={`h-16 border-b flex items-center justify-between px-4 md:px-6 shrink-0 transition-colors ${
        alert ? 'bg-gradient-to-r from-red-900/70 to-orange-900/70 border-red-500/50' : 'bg-gradient-to-r from-amber-900/50 to-orange-900/50 border-amber-700/30'
      }`}>
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-amber-500 to-orange-600 flex items-center justify-center">
            <ChefHat className="w-5 h-5 text-white" />
          </div>
          <div>
            <h1 className="text-lg font-bold text-white flex items-center gap-2">
              Cuisine
              {alert && <span className="text-xs bg-red-500 text-white px-2 py-0.5 rounded-full animate-bounce">NOUVELLE !</span>}
            </h1>
            <p className="text-xs text-amber-300/70">{kitchenOrders.length} commande(s)</p>
          </div>
        </div>
        <div className="flex items-center gap-4">
          <p className="text-2xl font-mono font-bold text-white">
            {currentTime.toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit', second: '2-digit' })}
          </p>
          <button onClick={() => dispatch({ type: 'SET_SCREEN', payload: 'select' })} className="p-2 text-amber-300/70 hover:text-white">
            <LogOut className="w-5 h-5" />
          </button>
        </div>
      </header>

      <div className="flex-1 overflow-y-auto p-4 md:p-6">
        {kitchenOrders.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-full text-slate-500">
            <ChefHat className="w-20 h-20 mb-4 opacity-20" />
            <p className="text-xl">Aucune commande en cuisine</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 2xl:grid-cols-4 gap-4">
            {kitchenOrders.map(({ ticket, foodItems, table }) => {
              const allReady = foodItems.every(i => i.status === 'ready' || i.status === 'served');
              const elapsed = Math.floor((currentTime.getTime() - new Date(ticket.createdAt).getTime()) / 60000);

              return (
                <div key={ticket.id} className={`rounded-2xl border-2 overflow-hidden ${
                  allReady ? 'border-emerald-500/50 bg-emerald-900/10' :
                  elapsed > 15 ? 'border-red-500/70 bg-red-900/20' :
                  'border-amber-500/30 bg-slate-800/80'
                }`}>
                  <div className={`p-3 flex items-center justify-between ${elapsed > 15 ? 'bg-red-500/20' : 'bg-slate-700/30'}`}>
                    <div className="flex items-center gap-2">
                      <span className="text-2xl font-bold text-white">{table?.name}</span>
                      <div className="w-5 h-5 rounded-full flex items-center justify-center text-white text-[10px] font-bold"
                        style={{ backgroundColor: state.servers.find(s => s.name === ticket.serverName)?.color || '#64748b' }}>
                        {ticket.serverName[0]}
                      </div>
                    </div>
                    <div className="flex items-center gap-1 px-2 py-1 rounded-full text-xs bg-slate-600/50 text-slate-300">
                      <Clock className="w-3 h-3" />
                      {elapsed} min
                    </div>
                  </div>

                  <div className="p-3 space-y-2">
                    {foodItems.map(item => (
                      <div key={item.id} className={`p-3 rounded-xl border ${
                        item.status === 'ready' ? 'bg-emerald-500/10 border-emerald-500/30' :
                        item.status === 'preparing' ? 'bg-blue-500/10 border-blue-500/30' :
                        'bg-slate-700/30 border-slate-600/30'
                      }`}>
                        <div className="flex items-start justify-between">
                          <div>
                            <div className="flex items-center gap-2">
                              <span className="text-lg">{item.menuItem.emoji}</span>
                              <span className="text-lg font-bold text-white">{item.quantity}x {item.menuItem.name}</span>
                            </div>
                            {item.notes && <p className="text-xs text-amber-400 mt-1 italic">📝 {item.notes}</p>}
                            {Object.keys(item.modifiers).length > 0 && (
                              <p className="text-xs text-blue-400 mt-1">
                                {Object.entries(item.modifiers).map(([k, v]) => `${k}: ${v}`).join(' • ')}
                              </p>
                            )}
                          </div>
                          {item.status === 'sent' && (
                            <button onClick={() => dispatch({ type: 'MARK_STATUS', payload: { ticketId: ticket.id, itemId: item.id, status: 'preparing' } })}
                              className="p-2 bg-blue-500/20 border border-blue-500/30 rounded-lg text-blue-400">
                              <Play className="w-4 h-4" />
                            </button>
                          )}
                          {item.status === 'preparing' && (
                            <button onClick={() => dispatch({ type: 'MARK_STATUS', payload: { ticketId: ticket.id, itemId: item.id, status: 'ready' } })}
                              className="p-2 bg-emerald-500/20 border border-emerald-500/30 rounded-lg text-emerald-400">
                              <Check className="w-4 h-4" />
                            </button>
                          )}
                          {item.status === 'ready' && (
                            <div className="p-2 bg-emerald-500/20 border border-emerald-500/30 rounded-lg">
                              <Check className="w-4 h-4 text-emerald-400" />
                            </div>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>

                  {!allReady && (
                    <div className="p-3 border-t border-slate-700/50">
                      <button
                        onClick={() => foodItems.forEach(i => {
                          if (i.status !== 'ready' && i.status !== 'served') {
                            dispatch({ type: 'MARK_STATUS', payload: { ticketId: ticket.id, itemId: i.id, status: 'ready' } });
                          }
                        })}
                        className="w-full py-2 bg-emerald-500/20 border border-emerald-500/30 text-emerald-400 rounded-xl text-sm font-medium flex items-center justify-center gap-2">
                        <Check className="w-4 h-4" /> Tout prêt
                      </button>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
