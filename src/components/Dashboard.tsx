import { usePOS } from '../store';
import { motion } from 'framer-motion';
import { TrendingUp, Users, Receipt, DollarSign, Clock, ShoppingBag } from 'lucide-react';

export default function Dashboard() {
  const { state } = usePOS();
  
  const occupiedTables = state.tables.filter(t => t.status === 'occupied').length;
  const totalTables = state.tables.length;
  const openOrders = state.orders.filter(o => o.status === 'open').length;
  const todayOrders = state.orders.filter(o => o.status === 'paid' || o.status === 'closed').length;

  const stats = [
    { label: 'CA du jour', value: `${state.dailyRevenue.toFixed(2)} €`, icon: DollarSign, color: 'from-emerald-500 to-emerald-700', change: '+12%' },
    { label: 'Tables occupées', value: `${occupiedTables}/${totalTables}`, icon: Users, color: 'from-blue-500 to-blue-700', change: '' },
    { label: 'Commandes ouvertes', value: openOrders.toString(), icon: Receipt, color: 'from-amber-500 to-amber-700', change: '' },
    { label: 'Commandes servies', value: todayOrders.toString(), icon: ShoppingBag, color: 'from-purple-500 to-purple-700', change: '+5%' },
  ];

  const recentOrders = state.orders
    .filter(o => o.status === 'paid' || o.status === 'closed')
    .slice(-5)
    .reverse();

  const hourlyData = [
    { hour: '10h', value: 120 },
    { hour: '11h', value: 280 },
    { hour: '12h', value: 520 },
    { hour: '13h', value: 680 },
    { hour: '14h', value: 340 },
    { hour: '15h', value: 150 },
    { hour: '16h', value: 90 },
    { hour: '17h', value: 200 },
    { hour: '18h', value: 450 },
    { hour: '19h', value: 720 },
    { hour: '20h', value: 890 },
    { hour: '21h', value: 650 },
  ];
  const maxHourly = Math.max(...hourlyData.map(d => d.value));

  return (
    <div className="p-4 md:p-6 h-full overflow-y-auto">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl md:text-3xl font-bold text-white">Tableau de bord</h1>
          <p className="text-slate-400 text-sm mt-1">
            <Clock className="inline w-4 h-4 mr-1" />
            {new Date().toLocaleDateString('fr-FR', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' })}
          </p>
        </div>
        <div className="text-right">
          <p className="text-sm text-slate-400">Serveur</p>
          <p className="text-lg font-semibold text-white">{state.server}</p>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 md:gap-4 mb-6">
        {stats.map((stat, i) => (
          <motion.div
            key={stat.label}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: i * 0.1 }}
            className="relative overflow-hidden rounded-xl bg-slate-800/50 border border-slate-700/50 p-4"
          >
            <div className={`absolute inset-0 bg-gradient-to-br ${stat.color} opacity-10`} />
            <div className="relative">
              <div className="flex items-center justify-between mb-2">
                <stat.icon className="w-5 h-5 text-slate-400" />
                {stat.change && (
                  <span className="text-xs text-emerald-400 flex items-center">
                    <TrendingUp className="w-3 h-3 mr-0.5" />
                    {stat.change}
                  </span>
                )}
              </div>
              <p className="text-2xl md:text-3xl font-bold text-white">{stat.value}</p>
              <p className="text-xs text-slate-400 mt-1">{stat.label}</p>
            </div>
          </motion.div>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 md:gap-6">
        {/* Hourly Revenue Chart */}
        <motion.div
          initial={{ opacity: 0, x: -20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ delay: 0.4 }}
          className="bg-slate-800/50 border border-slate-700/50 rounded-xl p-4 md:p-6"
        >
          <h3 className="text-lg font-semibold text-white mb-4">CA par heure</h3>
          <div className="flex items-end gap-1 md:gap-2 h-40">
            {hourlyData.map((d, i) => (
              <div key={d.hour} className="flex-1 flex flex-col items-center gap-1">
                <div className="w-full relative" style={{ height: '140px' }}>
                  <motion.div
                    initial={{ height: 0 }}
                    animate={{ height: `${(d.value / maxHourly) * 100}%` }}
                    transition={{ delay: 0.5 + i * 0.05, duration: 0.5 }}
                    className="absolute bottom-0 w-full bg-gradient-to-t from-blue-500 to-blue-400 rounded-t-sm"
                  />
                </div>
                <span className="text-[10px] text-slate-500">{d.hour}</span>
              </div>
            ))}
          </div>
        </motion.div>

        {/* Recent Orders */}
        <motion.div
          initial={{ opacity: 0, x: 20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ delay: 0.5 }}
          className="bg-slate-800/50 border border-slate-700/50 rounded-xl p-4 md:p-6"
        >
          <h3 className="text-lg font-semibold text-white mb-4">Dernières commandes</h3>
          {recentOrders.length === 0 ? (
            <div className="text-center py-8 text-slate-500">
              <Receipt className="w-12 h-12 mx-auto mb-2 opacity-50" />
              <p>Aucune commande aujourd'hui</p>
            </div>
          ) : (
            <div className="space-y-3">
              {recentOrders.map(order => (
                <div key={order.id} className="flex items-center justify-between p-3 bg-slate-700/30 rounded-lg">
                  <div>
                    <p className="text-sm font-medium text-white">
                      Table {state.tables.find(t => t.id === order.tableId)?.name || 'N/A'}
                    </p>
                    <p className="text-xs text-slate-400">
                      {order.items.length} articles • {order.server}
                    </p>
                  </div>
                  <div className="text-right">
                    <p className="text-sm font-bold text-emerald-400">{order.total.toFixed(2)} €</p>
                    <p className="text-xs text-slate-500">
                      {order.closedAt ? new Date(order.closedAt).toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' }) : ''}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          )}
        </motion.div>

        {/* Quick Actions */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.6 }}
          className="bg-slate-800/50 border border-slate-700/50 rounded-xl p-4 md:p-6 lg:col-span-2"
        >
          <h3 className="text-lg font-semibold text-white mb-4">État des tables</h3>
          <div className="grid grid-cols-3 md:grid-cols-6 gap-3">
            {state.tables.slice(0, 12).map(table => (
              <div
                key={table.id}
                className={`p-3 rounded-lg text-center border ${
                  table.status === 'free' ? 'bg-emerald-500/10 border-emerald-500/30' :
                  table.status === 'occupied' ? 'bg-red-500/10 border-red-500/30' :
                  table.status === 'reserved' ? 'bg-amber-500/10 border-amber-500/30' :
                  'bg-blue-500/10 border-blue-500/30'
                }`}
              >
                <p className="text-sm font-bold text-white">{table.name}</p>
                <p className={`text-xs ${
                  table.status === 'free' ? 'text-emerald-400' :
                  table.status === 'occupied' ? 'text-red-400' :
                  table.status === 'reserved' ? 'text-amber-400' :
                  'text-blue-400'
                }`}>
                  {table.status === 'free' ? 'Libre' :
                   table.status === 'occupied' ? 'Occupée' :
                   table.status === 'reserved' ? 'Réservée' : 'Nettoyage'}
                </p>
                <p className="text-[10px] text-slate-500">{table.seats}p</p>
              </div>
            ))}
          </div>
        </motion.div>
      </div>
    </div>
  );
}
