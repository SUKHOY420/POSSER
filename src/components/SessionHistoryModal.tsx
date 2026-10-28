import { useState } from 'react';
import { motion } from 'framer-motion';
import { X, Calendar, TrendingUp, Download, Printer, FileText } from 'lucide-react';
import { usePOS } from '../store';
import { Session } from '../types';

interface SessionHistoryModalProps {
  onClose: () => void;
}

export default function SessionHistoryModal({ onClose }: SessionHistoryModalProps) {
  const { state } = usePOS();
  const [viewMode, setViewMode] = useState<'sessions' | 'monthly' | 'annual'>('sessions');
  const [selectedYear, setSelectedYear] = useState(new Date().getFullYear());
  const [selectedMonth, setSelectedMonth] = useState(new Date().getMonth());

  // Obtenir toutes les sessions
  const allSessions = state.closedSessions;

  // Filtrer par année
  const sessionsByYear = allSessions.filter(s => 
    new Date(s.closedAt || s.openedAt).getFullYear() === selectedYear
  );

  // Filtrer par mois
  const sessionsByMonth = sessionsByYear.filter(s => 
    new Date(s.closedAt || s.openedAt).getMonth() === selectedMonth
  );

  // Calculer les statistiques mensuelles
  const monthlyStats = sessionsByMonth.reduce((acc, session) => {
    acc.totalRevenue += session.totalRevenue;
    acc.totalCash += session.totalCash;
    acc.totalCard += session.totalCard;
    acc.ticketCount += session.ticketCount;
    acc.sessionCount++;
    return acc;
  }, { totalRevenue: 0, totalCash: 0, totalCard: 0, ticketCount: 0, sessionCount: 0 });

  // Calculer les statistiques annuelles
  const annualStats = sessionsByYear.reduce((acc, session) => {
    acc.totalRevenue += session.totalRevenue;
    acc.totalCash += session.totalCash;
    acc.totalCard += session.totalCard;
    acc.ticketCount += session.ticketCount;
    acc.sessionCount++;
    
    // Statistiques par mois
    const month = new Date(session.closedAt || session.openedAt).getMonth();
    if (!acc.byMonth[month]) {
      acc.byMonth[month] = { revenue: 0, tickets: 0, sessions: 0 };
    }
    acc.byMonth[month].revenue += session.totalRevenue;
    acc.byMonth[month].tickets += session.ticketCount;
    acc.byMonth[month].sessions++;
    
    return acc;
  }, { totalRevenue: 0, totalCash: 0, totalCard: 0, ticketCount: 0, sessionCount: 0, byMonth: {} as Record<number, { revenue: number; tickets: number; sessions: number }> });

  // Statistiques par serveur (annuel)
  const serverStats = sessionsByYear.reduce((acc, session) => {
    session.tickets.forEach(ticket => {
      if (!acc[ticket.serverName]) {
        acc[ticket.serverName] = { tickets: 0, revenue: 0, cash: 0, card: 0 };
      }
      acc[ticket.serverName].tickets++;
      acc[ticket.serverName].revenue += ticket.paidAmount;
      acc[ticket.serverName].cash += ticket.payments
        .filter(p => p.method === 'CASH')
        .reduce((s, p) => s + p.amount, 0);
      acc[ticket.serverName].card += ticket.payments
        .filter(p => p.method === 'CARD')
        .reduce((s, p) => s + p.amount, 0);
    });
    return acc;
  }, {} as Record<string, { tickets: number; revenue: number; cash: number; card: number }>);

  // Statistiques par catégorie (annuel)
  const categoryStats = sessionsByYear.reduce((acc, session) => {
    session.tickets.forEach(ticket => {
      ticket.items.forEach(item => {
        const category = item.menuItem.category;
        if (!acc[category]) {
          acc[category] = { quantity: 0, revenue: 0 };
        }
        acc[category].quantity += item.quantity;
        acc[category].revenue += item.menuItem.price * item.quantity;
      });
    });
    return acc;
  }, {} as Record<string, { quantity: number; revenue: number }>);

  const handleExportAnnual = () => {
    const reportData = {
      type: 'annual',
      year: selectedYear,
      generatedAt: new Date().toISOString(),
      summary: annualStats,
      serverStats,
      categoryStats,
      sessions: sessionsByYear.map(s => ({
        id: s.id,
        openedAt: s.openedAt,
        closedAt: s.closedAt,
        openedBy: s.openedBy,
        closedBy: s.closedBy,
        totalRevenue: s.totalRevenue,
        totalCash: s.totalCash,
        totalCard: s.totalCard,
        ticketCount: s.ticketCount,
      })),
    };

    const blob = new Blob([JSON.stringify(reportData, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `cloture-exercice-${selectedYear}.json`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const handlePrintAnnual = () => {
    window.print();
  };

  const monthNames = ['Janvier', 'Février', 'Mars', 'Avril', 'Mai', 'Juin', 
                      'Juillet', 'Août', 'Septembre', 'Octobre', 'Novembre', 'Décembre'];

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4"
      onClick={onClose}
    >
      <motion.div
        initial={{ scale: 0.9, y: 20 }}
        animate={{ scale: 1, y: 0 }}
        exit={{ scale: 0.9, y: 20 }}
        className="glass-card rounded-2xl p-6 w-full max-w-6xl max-h-[90vh] overflow-y-auto"
        onClick={e => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-start justify-between mb-6">
          <div>
            <h2 className="text-2xl font-bold text-white mb-1">Historique & Rapports</h2>
            <p className="text-slate-400">Statistiques et clôture d'exercice</p>
          </div>
          <button onClick={onClose} className="p-2 text-slate-400 hover:text-white transition-colors">
            <X className="w-6 h-6" />
          </button>
        </div>

        {/* View Mode Selector */}
        <div className="grid grid-cols-3 gap-3 mb-6">
          <button
            onClick={() => setViewMode('sessions')}
            className={`p-4 rounded-xl border-2 transition-all ${
              viewMode === 'sessions'
                ? 'border-blue-500 bg-blue-500/10'
                : 'border-white/10 bg-white/5 hover:bg-white/10'
            }`}
          >
            <Calendar className={`w-6 h-6 mx-auto mb-2 ${viewMode === 'sessions' ? 'text-blue-400' : 'text-slate-400'}`} />
            <p className={`text-sm font-medium ${viewMode === 'sessions' ? 'text-blue-400' : 'text-slate-300'}`}>
              Sessions
            </p>
          </button>
          <button
            onClick={() => setViewMode('monthly')}
            className={`p-4 rounded-xl border-2 transition-all ${
              viewMode === 'monthly'
                ? 'border-purple-500 bg-purple-500/10'
                : 'border-white/10 bg-white/5 hover:bg-white/10'
            }`}
          >
            <TrendingUp className={`w-6 h-6 mx-auto mb-2 ${viewMode === 'monthly' ? 'text-purple-400' : 'text-slate-400'}`} />
            <p className={`text-sm font-medium ${viewMode === 'monthly' ? 'text-purple-400' : 'text-slate-300'}`}>
              Mensuel
            </p>
          </button>
          <button
            onClick={() => setViewMode('annual')}
            className={`p-4 rounded-xl border-2 transition-all ${
              viewMode === 'annual'
                ? 'border-emerald-500 bg-emerald-500/10'
                : 'border-white/10 bg-white/5 hover:bg-white/10'
            }`}
          >
            <FileText className={`w-6 h-6 mx-auto mb-2 ${viewMode === 'annual' ? 'text-emerald-400' : 'text-slate-400'}`} />
            <p className={`text-sm font-medium ${viewMode === 'annual' ? 'text-emerald-400' : 'text-slate-300'}`}>
              Annuel / Clôture
            </p>
          </button>
        </div>

        {/* Sessions View */}
        {viewMode === 'sessions' && (
          <div>
            <h3 className="text-lg font-bold text-white mb-3">Toutes les Sessions ({allSessions.length})</h3>
            <div className="space-y-2 max-h-96 overflow-y-auto">
              {allSessions.map(session => (
                <div key={session.id} className="glass rounded-xl p-4">
                  <div className="flex items-start justify-between mb-2">
                    <div>
                      <p className="text-sm font-medium text-white">
                        {new Date(session.openedAt).toLocaleDateString('fr-FR')}
                      </p>
                      <p className="text-xs text-slate-400">
                        Ouverte par {session.openedBy}
                        {session.closedBy && ` • Fermée par ${session.closedBy}`}
                      </p>
                    </div>
                    <div className="text-right">
                      <p className="text-lg font-bold text-emerald-400">
                        {session.totalRevenue.toFixed(2)} €
                      </p>
                      <p className="text-xs text-slate-400">
                        {session.ticketCount} tickets
                      </p>
                    </div>
                  </div>
                  <div className="flex gap-4 text-xs text-slate-400">
                    <span>💵 {session.totalCash.toFixed(2)} €</span>
                    <span>💳 {session.totalCard.toFixed(2)} €</span>
                    {session.notes && <span className="text-amber-400">📝 {session.notes}</span>}
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Monthly View */}
        {viewMode === 'monthly' && (
          <div>
            <div className="flex gap-3 mb-4">
              <select
                value={selectedYear}
                onChange={e => setSelectedYear(parseInt(e.target.value))}
                className="px-4 py-2 glass rounded-xl text-white"
              >
                {[2023, 2024, 2025].map(year => (
                  <option key={year} value={year}>{year}</option>
                ))}
              </select>
              <select
                value={selectedMonth}
                onChange={e => setSelectedMonth(parseInt(e.target.value))}
                className="px-4 py-2 glass rounded-xl text-white"
              >
                {monthNames.map((month, i) => (
                  <option key={i} value={i}>{month}</option>
                ))}
              </select>
            </div>

            <div className="glass rounded-xl p-6 mb-4">
              <h3 className="text-xl font-bold text-white mb-4">
                Rapport {monthNames[selectedMonth]} {selectedYear}
              </h3>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <p className="text-sm text-slate-400">Chiffre d'affaires</p>
                  <p className="text-2xl font-bold text-emerald-400">
                    {monthlyStats.totalRevenue.toFixed(2)} €
                  </p>
                </div>
                <div>
                  <p className="text-sm text-slate-400">Sessions</p>
                  <p className="text-2xl font-bold text-white">
                    {monthlyStats.sessionCount}
                  </p>
                </div>
                <div>
                  <p className="text-sm text-slate-400">Tickets</p>
                  <p className="text-2xl font-bold text-white">
                    {monthlyStats.ticketCount}
                  </p>
                </div>
                <div>
                  <p className="text-sm text-slate-400">Panier moyen</p>
                  <p className="text-2xl font-bold text-blue-400">
                    {monthlyStats.ticketCount > 0 
                      ? (monthlyStats.totalRevenue / monthlyStats.ticketCount).toFixed(2)
                      : '0.00'} €
                  </p>
                </div>
              </div>
            </div>

            <div className="space-y-2 max-h-64 overflow-y-auto">
              {sessionsByMonth.map(session => (
                <div key={session.id} className="glass rounded-xl p-3">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm font-medium text-white">
                        {new Date(session.openedAt).toLocaleDateString('fr-FR')}
                      </p>
                      <p className="text-xs text-slate-400">{session.openedBy}</p>
                    </div>
                    <p className="text-lg font-bold text-emerald-400">
                      {session.totalRevenue.toFixed(2)} €
                    </p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Annual View */}
        {viewMode === 'annual' && (
          <div>
            <div className="flex gap-3 mb-4">
              <select
                value={selectedYear}
                onChange={e => setSelectedYear(parseInt(e.target.value))}
                className="px-4 py-2 glass rounded-xl text-white"
              >
                {[2023, 2024, 2025].map(year => (
                  <option key={year} value={year}>{year}</option>
                ))}
              </select>
            </div>

            <div id="printable-report" className="bg-white rounded-xl p-6 text-slate-900 mb-4">
              <div className="text-center mb-6 border-b-2 border-slate-300 pb-4">
                <h1 className="text-2xl font-bold mb-1">LE BISTROT DU COIN</h1>
                <p className="text-sm text-slate-600">12 Rue de la Paix, 75002 Paris</p>
                <h2 className="text-xl font-bold mt-4">CLÔTURE D'EXERCICE {selectedYear}</h2>
              </div>

              <div className="mb-6">
                <h3 className="text-lg font-bold mb-3 border-b border-slate-300 pb-2">RÉSUMÉ ANNUEL</h3>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <p className="text-sm text-slate-600">Chiffre d'affaires total</p>
                    <p className="text-2xl font-bold text-emerald-600">
                      {annualStats.totalRevenue.toFixed(2)} €
                    </p>
                  </div>
                  <div>
                    <p className="text-sm text-slate-600">Nombre de sessions</p>
                    <p className="text-2xl font-bold">{annualStats.sessionCount}</p>
                  </div>
                  <div>
                    <p className="text-sm text-slate-600">Total tickets</p>
                    <p className="text-2xl font-bold">{annualStats.ticketCount}</p>
                  </div>
                  <div>
                    <p className="text-sm text-slate-600">Panier moyen</p>
                    <p className="text-2xl font-bold">
                      {annualStats.ticketCount > 0 
                        ? (annualStats.totalRevenue / annualStats.ticketCount).toFixed(2)
                        : '0.00'} €
                    </p>
                  </div>
                </div>
              </div>

              <div className="mb-6">
                <h3 className="text-lg font-bold mb-3 border-b border-slate-300 pb-2">RÉPARTITION MENSUELLE</h3>
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b border-slate-300">
                      <th className="text-left py-2">Mois</th>
                      <th className="text-right py-2">Sessions</th>
                      <th className="text-right py-2">Tickets</th>
                      <th className="text-right py-2">CA</th>
                    </tr>
                  </thead>
                  <tbody>
                    {monthNames.map((month, i) => {
                      const monthData = annualStats.byMonth[i];
                      if (!monthData) return null;
                      return (
                        <tr key={i} className="border-b border-slate-200">
                          <td className="py-2">{month}</td>
                          <td className="text-right py-2">{monthData.sessions}</td>
                          <td className="text-right py-2">{monthData.tickets}</td>
                          <td className="text-right py-2 font-bold">{monthData.revenue.toFixed(2)} €</td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>

              {Object.keys(serverStats).length > 0 && (
                <div className="mb-6">
                  <h3 className="text-lg font-bold mb-3 border-b border-slate-300 pb-2">PERFORMANCE PAR SERVEUR</h3>
                  <table className="w-full text-sm">
                    <thead>
                      <tr className="border-b border-slate-300">
                        <th className="text-left py-2">Serveur</th>
                        <th className="text-right py-2">Tickets</th>
                        <th className="text-right py-2">Espèces</th>
                        <th className="text-right py-2">Carte</th>
                        <th className="text-right py-2">Total</th>
                      </tr>
                    </thead>
                    <tbody>
                      {Object.entries(serverStats).map(([name, stats]) => (
                        <tr key={name} className="border-b border-slate-200">
                          <td className="py-2">{name}</td>
                          <td className="text-right py-2">{stats.tickets}</td>
                          <td className="text-right py-2">{stats.cash.toFixed(2)} €</td>
                          <td className="text-right py-2">{stats.card.toFixed(2)} €</td>
                          <td className="text-right py-2 font-bold">{stats.revenue.toFixed(2)} €</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}

              {Object.keys(categoryStats).length > 0 && (
                <div className="mb-6">
                  <h3 className="text-lg font-bold mb-3 border-b border-slate-300 pb-2">VENTES PAR CATÉGORIE</h3>
                  <table className="w-full text-sm">
                    <thead>
                      <tr className="border-b border-slate-300">
                        <th className="text-left py-2">Catégorie</th>
                        <th className="text-right py-2">Quantité</th>
                        <th className="text-right py-2">Total</th>
                      </tr>
                    </thead>
                    <tbody>
                      {Object.entries(categoryStats).map(([category, stats]) => (
                        <tr key={category} className="border-b border-slate-200">
                          <td className="py-2">{category}</td>
                          <td className="text-right py-2">{stats.quantity}</td>
                          <td className="text-right py-2 font-bold">{stats.revenue.toFixed(2)} €</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}

              <div className="text-center text-xs text-slate-500 mt-6 pt-4 border-t border-slate-300">
                <p>Rapport généré le {new Date().toLocaleString('fr-FR')}</p>
                <p>QuickPOS Pro - Système de caisse professionnel</p>
              </div>
            </div>

            <div className="flex gap-3">
              <button
                onClick={handlePrintAnnual}
                className="flex-1 py-3 bg-emerald-500 hover:bg-emerald-600 text-white rounded-xl font-medium transition-colors flex items-center justify-center gap-2"
              >
                <Printer className="w-4 h-4" />
                Imprimer
              </button>
              <button
                onClick={handleExportAnnual}
                className="flex-1 py-3 bg-blue-500 hover:bg-blue-600 text-white rounded-xl font-medium transition-colors flex items-center justify-center gap-2"
              >
                <Download className="w-4 h-4" />
                Exporter JSON
              </button>
            </div>
          </div>
        )}
      </motion.div>
    </motion.div>
  );
}
