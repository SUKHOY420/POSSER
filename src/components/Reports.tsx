import { usePOS } from '../store';
import { motion } from 'framer-motion';
import { BarChart3, TrendingUp, Clock, DollarSign, PieChart, Printer } from 'lucide-react';

export default function Reports() {
  const { state } = usePOS();

  const paidOrders = state.orders.filter(o => o.status === 'paid' || o.status === 'closed');
  const totalRevenue = paidOrders.reduce((sum, o) => sum + o.total, 0);
  const avgTicket = paidOrders.length > 0 ? totalRevenue / paidOrders.length : 0;
  
  const cashPayments = paidOrders.reduce((sum, o) => 
    sum + o.payments.filter(p => p.method === 'cash').reduce((s, p) => s + p.amount, 0), 0
  );
  const cardPayments = paidOrders.reduce((sum, o) => 
    sum + o.payments.filter(p => p.method === 'card').reduce((s, p) => s + p.amount, 0), 0
  );

  // Top selling items
  const itemCounts: Record<string, { name: string; emoji: string; count: number; revenue: number }> = {};
  paidOrders.forEach(order => {
    order.items.forEach(item => {
      if (!itemCounts[item.menuItem.id]) {
        itemCounts[item.menuItem.id] = {
          name: item.menuItem.name,
          emoji: item.menuItem.emoji,
          count: 0,
          revenue: 0,
        };
      }
      itemCounts[item.menuItem.id].count += item.quantity;
      itemCounts[item.menuItem.id].revenue += item.menuItem.price * item.quantity;
    });
  });
  const topItems = Object.values(itemCounts).sort((a, b) => b.count - a.count).slice(0, 8);

  // Category breakdown
  const categoryRevenue: Record<string, number> = {};
  paidOrders.forEach(order => {
    order.items.forEach(item => {
      const cat = item.menuItem.category;
      categoryRevenue[cat] = (categoryRevenue[cat] || 0) + (item.menuItem.price * item.quantity);
    });
  });
  const categoryData = Object.entries(categoryRevenue).sort((a, b) => b[1] - a[1]);
  const totalCatRevenue = categoryData.reduce((sum, [, v]) => sum + v, 0);

  // Server performance
  const serverStats: Record<string, { orders: number; revenue: number }> = {};
  paidOrders.forEach(order => {
    if (!serverStats[order.server]) {
      serverStats[order.server] = { orders: 0, revenue: 0 };
    }
    serverStats[order.server].orders++;
    serverStats[order.server].revenue += order.total;
  });

  const categoryColors: Record<string, string> = {
    'Entrées': '#10b981',
    'Plats': '#f59e0b',
    'Desserts': '#ec4899',
    'Boissons': '#3b82f6',
    'Cocktails': '#8b5cf6',
    'Vins': '#ef4444',
    'Bières': '#f97316',
    'Cafés': '#92400e',
  };

  return (
    <div className="p-4 md:p-6 h-full overflow-y-auto">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl md:text-3xl font-bold text-white">Rapports</h1>
          <p className="text-slate-400 text-sm mt-1">Analyse de la journée</p>
        </div>
        <button className="flex items-center gap-2 px-4 py-2 bg-slate-700 hover:bg-slate-600 text-white rounded-xl text-sm font-medium transition-colors">
          <Printer className="w-4 h-4" />
          Imprimer Z
        </button>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 md:gap-4 mb-6">
        {[
          { label: 'Chiffre d\'affaires', value: `${totalRevenue.toFixed(2)} €`, icon: DollarSign, color: 'text-emerald-400' },
          { label: 'Nombre de commandes', value: paidOrders.length.toString(), icon: BarChart3, color: 'text-blue-400' },
          { label: 'Panier moyen', value: `${avgTicket.toFixed(2)} €`, icon: TrendingUp, color: 'text-purple-400' },
          { label: 'Fonds de caisse', value: `${state.cashBalance.toFixed(2)} €`, icon: Clock, color: 'text-amber-400' },
        ].map((stat, i) => (
          <motion.div
            key={stat.label}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: i * 0.1 }}
            className="bg-slate-800/50 border border-slate-700/50 rounded-xl p-4"
          >
            <stat.icon className={`w-5 h-5 ${stat.color} mb-2`} />
            <p className="text-xl md:text-2xl font-bold text-white">{stat.value}</p>
            <p className="text-xs text-slate-400">{stat.label}</p>
          </motion.div>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 md:gap-6">
        {/* Payment Methods */}
        <motion.div
          initial={{ opacity: 0, x: -20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ delay: 0.3 }}
          className="bg-slate-800/50 border border-slate-700/50 rounded-xl p-4 md:p-6"
        >
          <h3 className="text-lg font-semibold text-white mb-4 flex items-center gap-2">
            <PieChart className="w-5 h-5 text-blue-400" />
            Répartition paiements
          </h3>
          <div className="space-y-4">
            <div>
              <div className="flex justify-between text-sm mb-1">
                <span className="text-slate-300">💵 Espèces</span>
                <span className="text-emerald-400 font-medium">{cashPayments.toFixed(2)} €</span>
              </div>
              <div className="h-3 bg-slate-700 rounded-full overflow-hidden">
                <motion.div
                  initial={{ width: 0 }}
                  animate={{ width: `${totalRevenue > 0 ? (cashPayments / totalRevenue) * 100 : 0}%` }}
                  transition={{ delay: 0.5, duration: 0.8 }}
                  className="h-full bg-gradient-to-r from-emerald-500 to-emerald-400 rounded-full"
                />
              </div>
            </div>
            <div>
              <div className="flex justify-between text-sm mb-1">
                <span className="text-slate-300">💳 Carte</span>
                <span className="text-blue-400 font-medium">{cardPayments.toFixed(2)} €</span>
              </div>
              <div className="h-3 bg-slate-700 rounded-full overflow-hidden">
                <motion.div
                  initial={{ width: 0 }}
                  animate={{ width: `${totalRevenue > 0 ? (cardPayments / totalRevenue) * 100 : 0}%` }}
                  transition={{ delay: 0.6, duration: 0.8 }}
                  className="h-full bg-gradient-to-r from-blue-500 to-blue-400 rounded-full"
                />
              </div>
            </div>
          </div>
        </motion.div>

        {/* Category Breakdown */}
        <motion.div
          initial={{ opacity: 0, x: 20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ delay: 0.4 }}
          className="bg-slate-800/50 border border-slate-700/50 rounded-xl p-4 md:p-6"
        >
          <h3 className="text-lg font-semibold text-white mb-4 flex items-center gap-2">
            <BarChart3 className="w-5 h-5 text-purple-400" />
            Ventes par catégorie
          </h3>
          <div className="space-y-3">
            {categoryData.map(([cat, revenue]) => (
              <div key={cat} className="flex items-center gap-3">
                <div
                  className="w-3 h-3 rounded-full"
                  style={{ backgroundColor: categoryColors[cat] || '#64748b' }}
                />
                <span className="text-sm text-slate-300 flex-1">{cat}</span>
                <span className="text-sm font-medium text-white">{revenue.toFixed(2)} €</span>
                <span className="text-xs text-slate-500 w-10 text-right">
                  {totalCatRevenue > 0 ? ((revenue / totalCatRevenue) * 100).toFixed(0) : 0}%
                </span>
              </div>
            ))}
            {categoryData.length === 0 && (
              <p className="text-sm text-slate-500 text-center py-4">Aucune vente aujourd'hui</p>
            )}
          </div>
        </motion.div>

        {/* Top Items */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.5 }}
          className="bg-slate-800/50 border border-slate-700/50 rounded-xl p-4 md:p-6"
        >
          <h3 className="text-lg font-semibold text-white mb-4">🏆 Top articles vendus</h3>
          <div className="space-y-2">
            {topItems.length === 0 ? (
              <p className="text-sm text-slate-500 text-center py-4">Aucune vente aujourd'hui</p>
            ) : (
              topItems.map((item, i) => (
                <div key={i} className="flex items-center gap-3 p-2 bg-slate-700/30 rounded-lg">
                  <span className="text-xl">{item.emoji}</span>
                  <div className="flex-1">
                    <p className="text-sm font-medium text-white">{item.name}</p>
                    <p className="text-xs text-slate-400">{item.count} vendus</p>
                  </div>
                  <span className="text-sm font-bold text-emerald-400">{item.revenue.toFixed(2)} €</span>
                </div>
              ))
            )}
          </div>
        </motion.div>

        {/* Server Performance */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.6 }}
          className="bg-slate-800/50 border border-slate-700/50 rounded-xl p-4 md:p-6"
        >
          <h3 className="text-lg font-semibold text-white mb-4">👥 Performance serveurs</h3>
          <div className="space-y-3">
            {Object.entries(serverStats).map(([server, stats]) => (
              <div key={server} className="flex items-center justify-between p-3 bg-slate-700/30 rounded-lg">
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 rounded-full bg-gradient-to-br from-blue-500 to-purple-500 flex items-center justify-center text-white text-sm font-bold">
                    {server[0]}
                  </div>
                  <div>
                    <p className="text-sm font-medium text-white">{server}</p>
                    <p className="text-xs text-slate-400">{stats.orders} commandes</p>
                  </div>
                </div>
                <span className="text-sm font-bold text-emerald-400">{stats.revenue.toFixed(2)} €</span>
              </div>
            ))}
            {Object.keys(serverStats).length === 0 && (
              <p className="text-sm text-slate-500 text-center py-4">Aucune donnée disponible</p>
            )}
          </div>
        </motion.div>
      </div>
    </div>
  );
}
