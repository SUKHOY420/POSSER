import { usePOS } from '../store';
import { motion } from 'framer-motion';
import { Clock, Users, DollarSign, LogOut, ChefHat, AlertCircle, CheckCircle2, Timer, Settings, Printer, CreditCard } from 'lucide-react';
import { useState, useEffect } from 'react';
import { usePrinter, usePaymentTerminal } from '../lib/hooks';

export default function MainScreen() {
  const { state, dispatch } = usePOS();
  const { isConnected: printerConnected } = usePrinter();
  const { status: terminalStatus } = usePaymentTerminal();
  const [currentTime, setCurrentTime] = useState(new Date());
  const [filter, setFilter] = useState<'all' | 'pending' | 'preparing' | 'ready' | 'partial'>('all');

  useEffect(() => {
    const timer = setInterval(() => setCurrentTime(new Date()), 1000);
    return () => clearInterval(timer);
  }, []);

  const openOrders = state.orders.filter(o => o.status === 'open');
  const todayPaid = state.orders.filter(o => o.status === 'closed');
  const totalRevenue = state.session.totalRevenue;

  const getElapsedTime = (date: Date) => {
    const diff = Math.floor((currentTime.getTime() - new Date(date).getTime()) / 60000);
    if (diff < 1) return 'Maintenant';
    if (diff < 60) return `${diff} min`;
    return `${Math.floor(diff / 60)}h${diff % 60}`;
  };

  const getOrderStatus = (order: typeof openOrders[0]) => {
    const items = order.items;
    const pending = items.filter(i => i.status === 'pending' || i.status === 'sent').length;
    const preparing = items.filter(i => i.status === 'preparing').length;
    const ready = items.filter(i => i.status === 'ready').length;
    const served = items.filter(i => i.status === 'served').length;

    if (pending > 0) return { label: 'En attente', color: 'text-amber-400', bg: 'bg-amber-500/10 border-amber-500/30' };
    if (preparing > 0) return { label: 'En préparation', color: 'text-blue-400', bg: 'bg-blue-500/10 border-blue-500/30' };
    if (ready > 0) return { label: 'Prêt', color: 'text-emerald-400', bg: 'bg-emerald-500/10 border-emerald-500/30' };
    if (served === items.length) return { label: 'Servi', color: 'text-slate-400', bg: 'bg-slate-500/10 border-slate-500/30' };
    return { label: 'En cours', color: 'text-slate-400', bg: 'bg-slate-500/10 border-slate-500/30' };
  };

  const filteredOrders = openOrders.filter(order => {
    if (filter === 'all') return true;
    const status = getOrderStatus(order);
    if (filter === 'pending') return status.label === 'En attente';
    if (filter === 'preparing') return status.label === 'En préparation';
    if (filter === 'ready') return status.label === 'Prêt';
    if (filter === 'partial') {
      const totalPaid = order.payments.reduce((sum, p) => sum + p.amount, 0);
      return totalPaid > 0 && totalPaid < order.total;
    }
    return true;
  });

  const getServerColor = (serverName: string) => {
    const server = state.servers.find(s => s.name === serverName);
    return server?.color || '#64748b';
  };

  return (
    <div className="h-screen flex flex-col bg-slate-900">
      {/* Header */}
      <header className="h-16 bg-slate-800/90 border-b border-slate-700/50 flex items-center justify-between px-4 md:px-6 shrink-0">
        <div className="flex items-center gap-4">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center">
              <DollarSign className="w-4 h-4 text-white" />
            </div>
            <div>
              <h1 className="text-sm font-bold text-white leading-tight">Caisse Principale</h1>
              <p className="text-[10px] text-slate-400">Vue globale</p>
            </div>
          </div>
        </div>

        <div className="flex items-center gap-4">
          {/* Stats */}
          <div className="hidden md:flex items-center gap-4">
            <div className="text-center">
              <p className="text-xs text-slate-400">Commandes</p>
              <p className="text-sm font-bold text-white">{openOrders.length}</p>
            </div>
            <div className="text-center">
              <p className="text-xs text-slate-400">CA Jour</p>
              <p className="text-sm font-bold text-emerald-400">{totalRevenue.toFixed(2)} €</p>
            </div>
            <div className="text-center">
              <p className="text-xs text-slate-400">Fonds</p>
              <p className="text-sm font-bold text-amber-400">{state.cashBalance.toFixed(2)} €</p>
            </div>
          </div>

          {/* Clock */}
          <div className="text-right">
            <p className="text-lg font-mono font-bold text-white">
              {currentTime.toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' })}
            </p>
          </div>

          {/* Peripheral status */}
          <div className="hidden md:flex items-center gap-2">
            <div className={`flex items-center gap-1 px-2 py-1 rounded-full text-xs ${
              printerConnected ? 'bg-emerald-500/10 text-emerald-400' : 'bg-slate-700/50 text-slate-400'
            }`}>
              <Printer className="w-3 h-3" />
              <span>{printerConnected ? 'OK' : '-'}</span>
            </div>
            <div className={`flex items-center gap-1 px-2 py-1 rounded-full text-xs ${
              terminalStatus === 'ready' ? 'bg-emerald-500/10 text-emerald-400' : 'bg-slate-700/50 text-slate-400'
            }`}>
              <CreditCard className="w-3 h-3" />
              <span>{terminalStatus === 'ready' ? 'OK' : '-'}</span>
            </div>
          </div>

          <button
            onClick={() => dispatch({ type: 'SET_SCREEN', payload: 'hardware' })}
            className="p-2 text-slate-400 hover:text-white hover:bg-slate-700 rounded-lg transition-colors"
            title="Configuration périphériques"
          >
            <Settings className="w-5 h-5" />
          </button>

          <button
            onClick={() => dispatch({ type: 'LOGOUT_SERVER' })}
            className="p-2 text-slate-400 hover:text-white hover:bg-slate-700 rounded-lg transition-colors"
          >
            <LogOut className="w-5 h-5" />
          </button>
        </div>
      </header>

      {/* Filter tabs */}
      <div className="px-4 md:px-6 py-3 border-b border-slate-700/50 flex gap-2 overflow-x-auto shrink-0">
        {[
          { id: 'all', label: 'Toutes', count: openOrders.length },
          { id: 'pending', label: 'En attente', count: openOrders.filter(o => getOrderStatus(o).label === 'En attente').length },
          { id: 'preparing', label: 'En cuisine', count: openOrders.filter(o => getOrderStatus(o).label === 'En préparation').length },
          { id: 'ready', label: 'Prêtes', count: openOrders.filter(o => getOrderStatus(o).label === 'Prêt').length },
          { id: 'partial', label: 'Paiement partiel', count: openOrders.filter(o => {
            const totalPaid = o.payments.reduce((sum, p) => sum + p.amount, 0);
            return totalPaid > 0 && totalPaid < o.total;
          }).length },
        ].map(f => (
          <button
            key={f.id}
            onClick={() => setFilter(f.id as typeof filter)}
            className={`px-4 py-2 rounded-xl text-sm font-medium whitespace-nowrap transition-colors flex items-center gap-2 ${
              filter === f.id ? 'bg-blue-500 text-white' : 'bg-slate-800 text-slate-300 hover:bg-slate-700'
            }`}
          >
            {f.label}
            <span className={`px-1.5 py-0.5 rounded-full text-xs ${
              filter === f.id ? 'bg-white/20' : 'bg-slate-700'
            }`}>{f.count}</span>
          </button>
        ))}
      </div>

      {/* Orders Grid */}
      <div className="flex-1 overflow-y-auto p-4 md:p-6">
        {filteredOrders.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-full text-slate-500">
            <ChefHat className="w-16 h-16 mb-4 opacity-30" />
            <p className="text-lg">Aucune commande en cours</p>
            <p className="text-sm">Les commandes apparaîtront ici</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
            {filteredOrders.map((order, idx) => {
              const table = state.tables.find(t => t.id === order.tableId);
              const status = getOrderStatus(order);
              const serverColor = getServerColor(order.serverName);
              const foodItems = order.items.filter(i => i.menuItem.isFood);
              const drinkItems = order.items.filter(i => !i.menuItem.isFood);

              return (
                <motion.div
                  key={order.id}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: idx * 0.05 }}
                  className={`bg-slate-800/80 border rounded-2xl overflow-hidden ${status.bg}`}
                >
                  {/* Order Header */}
                  <div className="p-4 border-b border-slate-700/50 flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <div className="text-center">
                        <p className="text-xl font-bold text-white">{table?.name || '?'}</p>
                        <p className="text-[10px] text-slate-400">{table?.seats}p</p>
                      </div>
                      <div>
                        <div className="flex items-center gap-1.5">
                          <div className="w-5 h-5 rounded-full flex items-center justify-center text-white text-[10px] font-bold" style={{ backgroundColor: serverColor }}>
                            {order.serverName[0]}
                          </div>
                          <span className="text-sm text-slate-300">{order.serverName}</span>
                        </div>
                        <div className="flex items-center gap-1 text-xs text-slate-400 mt-0.5">
                          <Clock className="w-3 h-3" />
                          {getElapsedTime(order.createdAt)}
                        </div>
                      </div>
                    </div>
                    <div className="text-right">
                      <p className="text-lg font-bold text-emerald-400">{order.total.toFixed(2)} €</p>
                      {order.payments.length > 0 && (
                        <p className="text-xs text-green-400">
                          {order.payments.reduce((sum, p) => sum + p.amount, 0).toFixed(2)} € payés
                        </p>
                      )}
                      <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-medium ${status.bg} ${status.color}`}>
                        {status.label === 'En attente' && <AlertCircle className="w-3 h-3" />}
                        {status.label === 'En préparation' && <Timer className="w-3 h-3" />}
                        {status.label === 'Prêt' && <CheckCircle2 className="w-3 h-3" />}
                        {status.label}
                      </span>
                      {order.payments.length > 0 && order.payments.reduce((sum, p) => sum + p.amount, 0) < order.total && (
                        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-medium bg-orange-500/10 border border-orange-500/30 text-orange-400 ml-1">
                          PARTIEL
                        </span>
                      )}
                    </div>
                  </div>

                  {/* Order Items */}
                  <div className="p-3 space-y-1 max-h-48 overflow-y-auto">
                    {foodItems.length > 0 && (
                      <div className="mb-2">
                        <p className="text-[10px] uppercase text-slate-500 font-medium mb-1 px-1">🍽️ Cuisine</p>
                        {foodItems.map(item => (
                          <div key={item.id} className="flex items-center justify-between py-1 px-2 rounded-lg hover:bg-slate-700/30">
                            <div className="flex items-center gap-2">
                              <span className={`w-2 h-2 rounded-full ${
                                item.status === 'pending' ? 'bg-amber-400' :
                                item.status === 'sent' ? 'bg-blue-400' :
                                item.status === 'preparing' ? 'bg-blue-500 animate-pulse' :
                                item.status === 'ready' ? 'bg-emerald-400' :
                                'bg-slate-500'
                              }`} />
                              <span className="text-sm text-white">{item.quantity}x {item.menuItem.name}</span>
                            </div>
                            <span className="text-xs text-slate-400">{(item.menuItem.price * item.quantity).toFixed(2)} €</span>
                          </div>
                        ))}
                      </div>
                    )}
                    {drinkItems.length > 0 && (
                      <div>
                        <p className="text-[10px] uppercase text-slate-500 font-medium mb-1 px-1">🥤 Bar</p>
                        {drinkItems.map(item => (
                          <div key={item.id} className="flex items-center justify-between py-1 px-2 rounded-lg hover:bg-slate-700/30">
                            <div className="flex items-center gap-2">
                              <span className={`w-2 h-2 rounded-full ${
                                item.status === 'pending' ? 'bg-amber-400' :
                                item.status === 'sent' ? 'bg-blue-400' :
                                item.status === 'preparing' ? 'bg-blue-500 animate-pulse' :
                                item.status === 'ready' ? 'bg-emerald-400' :
                                'bg-slate-500'
                              }`} />
                              <span className="text-sm text-white">{item.quantity}x {item.menuItem.name}</span>
                            </div>
                            <span className="text-xs text-slate-400">{(item.menuItem.price * item.quantity).toFixed(2)} €</span>
                          </div>
                        ))}
                      </div>
                    )}
                    {order.items.some(i => i.notes) && (
                      <div className="mt-2 p-2 bg-amber-500/10 border border-amber-500/20 rounded-lg">
                        {order.items.filter(i => i.notes).map(i => (
                          <p key={i.id} className="text-xs text-amber-400">📝 {i.notes}</p>
                        ))}
                      </div>
                    )}
                  </div>

                  {/* Order Footer */}
                  <div className="p-3 border-t border-slate-700/50 flex items-center justify-between bg-slate-800/50">
                    <div className="flex items-center gap-1 text-xs text-slate-400">
                      <Users className="w-3 h-3" />
                      <span>{order.items.reduce((s, i) => s + i.quantity, 0)} articles</span>
                    </div>
                    <span className="text-xs text-slate-500">
                      #{order.id.slice(0, 6)}
                    </span>
                  </div>
                </motion.div>
              );
            })}
          </div>
        )}
      </div>

      {/* Bottom Stats Bar */}
      <div className="h-12 bg-slate-800/90 border-t border-slate-700/50 flex items-center justify-around px-4 shrink-0 md:hidden">
        <div className="text-center">
          <p className="text-xs text-slate-400">Commandes</p>
          <p className="text-sm font-bold text-white">{openOrders.length}</p>
        </div>
        <div className="text-center">
          <p className="text-xs text-slate-400">CA</p>
          <p className="text-sm font-bold text-emerald-400">{totalRevenue.toFixed(2)} €</p>
        </div>
        <div className="text-center">
          <p className="text-xs text-slate-400">Fonds</p>
          <p className="text-sm font-bold text-amber-400">{state.cashBalance.toFixed(2)} €</p>
        </div>
      </div>
    </div>
  );
}
