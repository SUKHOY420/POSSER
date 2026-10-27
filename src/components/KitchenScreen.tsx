import { usePOS } from '../store';
import { motion, AnimatePresence } from 'framer-motion';
import { Clock, ChefHat, Check, Play, LogOut, Flame, AlertCircle } from 'lucide-react';
import { useState, useEffect } from 'react';
import { Order, OrderItem, Table } from '../types';
import { syncManager } from '../lib/sync';

interface KitchenOrder {
  order: Order;
  foodItems: OrderItem[];
  table: Table | undefined;
}

export default function KitchenScreen() {
  const { state, dispatch } = usePOS();
  const [currentTime, setCurrentTime] = useState(new Date());
  const [newOrderAlert, setNewOrderAlert] = useState(false);

  useEffect(() => {
    const timer = setInterval(() => setCurrentTime(new Date()), 1000);
    return () => clearInterval(timer);
  }, []);

  // Écouter les nouvelles commandes pour alerter la cuisine
  useEffect(() => {
    const unsub = syncManager.on('KITCHEN_NOTIFICATION', (event: any) => {
      setNewOrderAlert(true);
      // Jouer un son de notification
      try {
        const audioContext = new (window.AudioContext || (window as any).webkitAudioContext)();
        const oscillator = audioContext.createOscillator();
        const gainNode = audioContext.createGain();
        oscillator.connect(gainNode);
        gainNode.connect(audioContext.destination);
        oscillator.frequency.value = 800;
        oscillator.type = 'sine';
        gainNode.gain.setValueAtTime(0.3, audioContext.currentTime);
        gainNode.gain.exponentialRampToValueAtTime(0.01, audioContext.currentTime + 0.5);
        oscillator.start(audioContext.currentTime);
        oscillator.stop(audioContext.currentTime + 0.5);
      } catch (e) {
        console.log('Audio not supported');
      }
      setTimeout(() => setNewOrderAlert(false), 3000);
    });
    return unsub;
  }, []);

  const kitchenOrders: KitchenOrder[] = state.orders
    .filter(o => o.status === 'open')
    .map(order => {
      const foodItems = order.items.filter(i => i.menuItem.isFood && i.status !== 'served');
      const table = state.tables.find(t => t.id === order.tableId);
      return { order, foodItems, table };
    })
    .filter(ko => ko.foodItems.length > 0)
    .sort((a, b) => {
      const aTime = a.foodItems.reduce((min, i) => {
        const t = i.sentAt ? new Date(i.sentAt).getTime() : new Date(a.order.createdAt).getTime();
        return t < min ? t : min;
      }, Infinity);
      const bTime = b.foodItems.reduce((min, i) => {
        const t = i.sentAt ? new Date(i.sentAt).getTime() : new Date(b.order.createdAt).getTime();
        return t < min ? t : min;
      }, Infinity);
      return aTime - bTime;
    });

  const getElapsedTime = (date: Date) => {
    const diff = Math.floor((currentTime.getTime() - new Date(date).getTime()) / 60000);
    if (diff < 1) return 'Maintenant';
    if (diff < 60) return `${diff} min`;
    return `${Math.floor(diff / 60)}h${diff % 60}`;
  };

  const isUrgent = (ko: KitchenOrder) => {
    const oldest = ko.foodItems.reduce((min, i) => {
      const t = i.sentAt ? new Date(i.sentAt).getTime() : new Date(ko.order.createdAt).getTime();
      return t < min ? t : min;
    }, Infinity);
    const diff = (currentTime.getTime() - oldest) / 60000;
    return diff > 15;
  };

  const handleMarkPreparing = (orderId: string, itemId: string) => {
    dispatch({ type: 'MARK_PREPARING', payload: { orderId, itemId } });
  };

  const handleMarkReady = (orderId: string, itemId: string) => {
    dispatch({ type: 'MARK_READY', payload: { orderId, itemId } });
  };

  const handleAllReady = (orderId: string, foodItems: OrderItem[]) => {
    foodItems.forEach(item => {
      if (item.status !== 'served' && item.status !== 'ready') {
        dispatch({ type: 'MARK_READY', payload: { orderId, itemId: item.id } });
      }
    });
  };

  return (
    <div className="h-screen flex flex-col bg-slate-900">
      {/* Header */}
      <header className={`h-16 border-b flex items-center justify-between px-4 md:px-6 shrink-0 transition-colors ${
        newOrderAlert 
          ? 'bg-gradient-to-r from-red-900/70 to-orange-900/70 border-red-500/50 animate-pulse' 
          : 'bg-gradient-to-r from-amber-900/50 to-orange-900/50 border-amber-700/30'
      }`}>
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-amber-500 to-orange-600 flex items-center justify-center">
            <ChefHat className="w-5 h-5 text-white" />
          </div>
          <div>
            <h1 className="text-lg font-bold text-white flex items-center gap-2">
              Cuisine
              {newOrderAlert && (
                <span className="text-xs bg-red-500 text-white px-2 py-0.5 rounded-full animate-bounce">
                  NOUVELLE COMMANDE !
                </span>
              )}
            </h1>
            <p className="text-xs text-amber-300/70">Kitchen Display System</p>
          </div>
        </div>

        <div className="flex items-center gap-4">
          <div className="text-center">
            <p className="text-xs text-amber-300/70">En attente</p>
            <p className="text-lg font-bold text-amber-400">{kitchenOrders.length}</p>
          </div>
          <div className="text-right">
            <p className="text-2xl font-mono font-bold text-white">
              {currentTime.toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit', second: '2-digit' })}
            </p>
          </div>
          <button
            onClick={() => dispatch({ type: 'SET_SCREEN', payload: 'select' })}
            className="p-2 text-amber-300/70 hover:text-white hover:bg-amber-800/30 rounded-lg transition-colors"
          >
            <LogOut className="w-5 h-5" />
          </button>
        </div>
      </header>

      {/* Kitchen Orders */}
      <div className="flex-1 overflow-y-auto p-4 md:p-6">
        {kitchenOrders.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-full text-slate-500">
            <ChefHat className="w-20 h-20 mb-4 opacity-20" />
            <p className="text-xl font-medium">Aucune commande en cuisine</p>
            <p className="text-sm mt-1">Les commandes de nourriture apparaîtront ici</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 2xl:grid-cols-4 gap-4">
            <AnimatePresence>
              {kitchenOrders.map((ko, idx) => {
                const { order, foodItems, table } = ko;
                const urgent = isUrgent(ko);
                const allReady = foodItems.every(i => i.status === 'ready' || i.status === 'served');
                const oldestItem = foodItems.reduce((min, i) => {
                  const t = i.sentAt ? new Date(i.sentAt).getTime() : new Date(order.createdAt).getTime();
                  return t < min ? t : min;
                }, Infinity);

                return (
                  <motion.div
                    key={order.id}
                    initial={{ opacity: 0, scale: 0.9 }}
                    animate={{ opacity: 1, scale: 1 }}
                    exit={{ opacity: 0, scale: 0.9 }}
                    transition={{ delay: idx * 0.05 }}
                    className={`rounded-2xl border-2 overflow-hidden transition-all ${
                      urgent ? 'border-red-500/70 bg-red-900/20' :
                      allReady ? 'border-emerald-500/50 bg-emerald-900/10' :
                      'border-amber-500/30 bg-slate-800/80'
                    }`}
                  >
                    {/* Header */}
                    <div className={`p-3 flex items-center justify-between ${
                      urgent ? 'bg-red-500/20' : 'bg-slate-700/30'
                    }`}>
                      <div className="flex items-center gap-2">
                        <span className="text-2xl font-bold text-white">{table?.name}</span>
                        <div className="flex items-center gap-1">
                          <div className="w-5 h-5 rounded-full flex items-center justify-center text-white text-[10px] font-bold"
                            style={{ backgroundColor: state.servers.find(s => s.name === order.serverName)?.color || '#64748b' }}>
                            {order.serverName[0]}
                          </div>
                          <span className="text-xs text-slate-300">{order.serverName}</span>
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        {urgent && <Flame className="w-5 h-5 text-red-400 animate-pulse" />}
                        <div className={`flex items-center gap-1 px-2 py-1 rounded-full text-xs font-medium ${
                          urgent ? 'bg-red-500/30 text-red-300' : 'bg-slate-600/50 text-slate-300'
                        }`}>
                          <Clock className="w-3 h-3" />
                          {getElapsedTime(new Date(oldestItem))}
                        </div>
                      </div>
                    </div>

                    {/* Items */}
                    <div className="p-3 space-y-2">
                      {foodItems.map(item => (
                        <motion.div
                          key={item.id}
                          layout
                          className={`p-3 rounded-xl border transition-all ${
                            item.status === 'ready' ? 'bg-emerald-500/10 border-emerald-500/30' :
                            item.status === 'preparing' ? 'bg-blue-500/10 border-blue-500/30' :
                            'bg-slate-700/30 border-slate-600/30'
                          }`}
                        >
                          <div className="flex items-start justify-between">
                            <div className="flex-1">
                              <div className="flex items-center gap-2">
                                <span className="text-lg">{item.menuItem.emoji}</span>
                                <span className="text-lg font-bold text-white">
                                  {item.quantity}x {item.menuItem.name}
                                </span>
                              </div>
                              {item.notes && (
                                <p className="text-xs text-amber-400 mt-1 italic">📝 {item.notes}</p>
                              )}
                              {Object.keys(item.modifiers).length > 0 && (
                                <p className="text-xs text-blue-400 mt-1">
                                  {Object.entries(item.modifiers).map(([k, v]) => `${k}: ${v}`).join(' • ')}
                                </p>
                              )}
                            </div>
                            
                            {item.status === 'sent' && (
                              <button
                                onClick={() => handleMarkPreparing(order.id, item.id)}
                                className="p-2 bg-blue-500/20 hover:bg-blue-500/30 border border-blue-500/30 rounded-lg text-blue-400 transition-colors"
                              >
                                <Play className="w-4 h-4" />
                              </button>
                            )}
                            {item.status === 'preparing' && (
                              <button
                                onClick={() => handleMarkReady(order.id, item.id)}
                                className="p-2 bg-emerald-500/20 hover:bg-emerald-500/30 border border-emerald-500/30 rounded-lg text-emerald-400 transition-colors"
                              >
                                <Check className="w-4 h-4" />
                              </button>
                            )}
                            {item.status === 'ready' && (
                              <div className="p-2 bg-emerald-500/20 border border-emerald-500/30 rounded-lg">
                                <Check className="w-4 h-4 text-emerald-400" />
                              </div>
                            )}
                          </div>

                          <div className="mt-2">
                            <span className={`text-[10px] font-medium px-2 py-0.5 rounded-full ${
                              item.status === 'sent' ? 'bg-blue-500/20 text-blue-400' :
                              item.status === 'preparing' ? 'bg-blue-500/20 text-blue-300' :
                              'bg-emerald-500/20 text-emerald-400'
                            }`}>
                              {item.status === 'sent' ? '📥 Reçue' :
                               item.status === 'preparing' ? '🔥 En préparation' :
                               '✅ Prête'}
                            </span>
                          </div>
                        </motion.div>
                      ))}
                    </div>

                    {/* Footer */}
                    {!allReady && (
                      <div className="p-3 border-t border-slate-700/50">
                        <button
                          onClick={() => handleAllReady(order.id, foodItems)}
                          className="w-full py-2 bg-emerald-500/20 hover:bg-emerald-500/30 border border-emerald-500/30 text-emerald-400 rounded-xl text-sm font-medium flex items-center justify-center gap-2 transition-colors"
                        >
                          <Check className="w-4 h-4" />
                          Tout prêt
                        </button>
                      </div>
                    )}
                    {allReady && (
                      <div className="p-3 border-t border-emerald-500/30 bg-emerald-500/10">
                        <p className="text-center text-sm font-medium text-emerald-400 flex items-center justify-center gap-2">
                          <Check className="w-4 h-4" />
                          Commande prête à servir
                        </p>
                      </div>
                    )}
                  </motion.div>
                );
              })}
            </AnimatePresence>
          </div>
        )}
      </div>
    </div>
  );
}
