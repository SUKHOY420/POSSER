import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Printer, Calendar, FileText, Download } from 'lucide-react';
import { usePOS } from '../store';

interface ReportPrinterModalProps {
  onClose: () => void;
}

export default function ReportPrinterModal({ onClose }: ReportPrinterModalProps) {
  const { state } = usePOS();
  const [reportType, setReportType] = useState<'daily' | 'monthly' | 'custom'>('daily');
  const [isPrinting, setIsPrinting] = useState(false);

  // Filtrer les tickets payés
  const paidTickets = state.tickets.filter(t => t.status === 'PAID');

  // Calculer les statistiques selon le type de rapport
  const getFilteredTickets = () => {
    const now = new Date();
    
    if (reportType === 'daily') {
      return paidTickets.filter(t => {
        const ticketDate = new Date(t.closedAt || t.createdAt);
        return ticketDate.toDateString() === now.toDateString();
      });
    } else if (reportType === 'monthly') {
      return paidTickets.filter(t => {
        const ticketDate = new Date(t.closedAt || t.createdAt);
        return ticketDate.getMonth() === now.getMonth() && 
               ticketDate.getFullYear() === now.getFullYear();
      });
    }
    return paidTickets;
  };

  const filteredTickets = getFilteredTickets();

  // Statistiques
  const totalRevenue = filteredTickets.reduce((sum, t) => sum + t.paidAmount, 0);
  const totalCash = filteredTickets.reduce((sum, t) => 
    sum + t.payments.filter(p => p.method === 'CASH').reduce((s, p) => s + p.amount, 0), 0
  );
  const totalCard = filteredTickets.reduce((sum, t) => 
    sum + t.payments.filter(p => p.method === 'CARD').reduce((s, p) => s + p.amount, 0), 0
  );
  const ticketCount = filteredTickets.length;
  const avgTicket = ticketCount > 0 ? totalRevenue / ticketCount : 0;

  // Statistiques par serveur
  const serverStats = filteredTickets.reduce((acc, ticket) => {
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
    return acc;
  }, {} as Record<string, { tickets: number; revenue: number; cash: number; card: number }>);

  // Statistiques par catégorie
  const categoryStats = filteredTickets.reduce((acc, ticket) => {
    ticket.items.forEach(item => {
      const category = item.menuItem.category;
      if (!acc[category]) {
        acc[category] = { quantity: 0, revenue: 0 };
      }
      acc[category].quantity += item.quantity;
      acc[category].revenue += item.menuItem.price * item.quantity;
    });
    return acc;
  }, {} as Record<string, { quantity: number; revenue: number }>);

  const handlePrint = () => {
    setIsPrinting(true);
    setTimeout(() => {
      window.print();
      setIsPrinting(false);
    }, 100);
  };

  const handleDownload = () => {
    const reportData = {
      type: reportType,
      date: new Date().toISOString(),
      summary: {
        totalRevenue,
        totalCash,
        totalCard,
        ticketCount,
        avgTicket,
      },
      serverStats,
      categoryStats,
      tickets: filteredTickets.map(t => ({
        id: t.id,
        table: state.tables.find(tab => tab.id === t.tableId)?.name,
        server: t.serverName,
        total: t.totalAmount,
        paid: t.paidAmount,
        date: new Date(t.closedAt || t.createdAt).toISOString(),
      })),
    };

    const blob = new Blob([JSON.stringify(reportData, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `rapport-${reportType}-${new Date().toISOString().split('T')[0]}.json`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const getReportTitle = () => {
    switch (reportType) {
      case 'daily': return 'Rapport Journalier';
      case 'monthly': return 'Rapport Mensuel';
      case 'custom': return 'Rapport Personnalisé';
    }
  };

  const getDateRange = () => {
    const now = new Date();
    if (reportType === 'daily') {
      return now.toLocaleDateString('fr-FR', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' });
    } else if (reportType === 'monthly') {
      return now.toLocaleDateString('fr-FR', { month: 'long', year: 'numeric' });
    }
    return 'Période personnalisée';
  };

  return (
    <>
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
          className="glass-card rounded-2xl p-6 w-full max-w-4xl max-h-[90vh] overflow-y-auto"
          onClick={e => e.stopPropagation()}
        >
          {/* Header */}
          <div className="flex items-start justify-between mb-6">
            <div>
              <h2 className="text-2xl font-bold text-white mb-1">Rapport de Caisse</h2>
              <p className="text-slate-400">{getDateRange()}</p>
            </div>
            <button onClick={onClose} className="p-2 text-slate-400 hover:text-white transition-colors">
              <X className="w-6 h-6" />
            </button>
          </div>

          {/* Type Selection */}
          <div className="grid grid-cols-3 gap-3 mb-6">
            <button
              onClick={() => setReportType('daily')}
              className={`p-4 rounded-xl border-2 transition-all ${
                reportType === 'daily'
                  ? 'border-blue-500 bg-blue-500/10'
                  : 'border-white/10 bg-white/5 hover:bg-white/10'
              }`}
            >
              <Calendar className={`w-6 h-6 mx-auto mb-2 ${reportType === 'daily' ? 'text-blue-400' : 'text-slate-400'}`} />
              <p className={`text-sm font-medium ${reportType === 'daily' ? 'text-blue-400' : 'text-slate-300'}`}>
                Journalier
              </p>
            </button>
            <button
              onClick={() => setReportType('monthly')}
              className={`p-4 rounded-xl border-2 transition-all ${
                reportType === 'monthly'
                  ? 'border-purple-500 bg-purple-500/10'
                  : 'border-white/10 bg-white/5 hover:bg-white/10'
              }`}
            >
              <FileText className={`w-6 h-6 mx-auto mb-2 ${reportType === 'monthly' ? 'text-purple-400' : 'text-slate-400'}`} />
              <p className={`text-sm font-medium ${reportType === 'monthly' ? 'text-purple-400' : 'text-slate-300'}`}>
                Mensuel
              </p>
            </button>
            <button
              onClick={() => setReportType('custom')}
              className={`p-4 rounded-xl border-2 transition-all ${
                reportType === 'custom'
                  ? 'border-emerald-500 bg-emerald-500/10'
                  : 'border-white/10 bg-white/5 hover:bg-white/10'
              }`}
            >
              <Calendar className={`w-6 h-6 mx-auto mb-2 ${reportType === 'custom' ? 'text-emerald-400' : 'text-slate-400'}`} />
              <p className={`text-sm font-medium ${reportType === 'custom' ? 'text-emerald-400' : 'text-slate-300'}`}>
                Personnalisé
              </p>
            </button>
          </div>

          {/* Report Content */}
          <div id="printable-report" className="bg-white rounded-xl p-6 text-slate-900 mb-6">
            {/* En-tête du rapport */}
            <div className="text-center mb-6 border-b-2 border-slate-300 pb-4">
              <h1 className="text-2xl font-bold mb-1">LE BISTROT DU COIN</h1>
              <p className="text-sm text-slate-600">12 Rue de la Paix, 75002 Paris</p>
              <p className="text-sm text-slate-600">Tel: 01 23 45 67 89</p>
              <h2 className="text-xl font-bold mt-4">{getReportTitle()}</h2>
              <p className="text-sm">{getDateRange()}</p>
            </div>

            {/* Résumé */}
            <div className="mb-6">
              <h3 className="text-lg font-bold mb-3 border-b border-slate-300 pb-2">RÉSUMÉ</h3>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <p className="text-sm text-slate-600">Chiffre d'affaires</p>
                  <p className="text-2xl font-bold text-emerald-600">{totalRevenue.toFixed(2)} €</p>
                </div>
                <div>
                  <p className="text-sm text-slate-600">Nombre de tickets</p>
                  <p className="text-2xl font-bold">{ticketCount}</p>
                </div>
                <div>
                  <p className="text-sm text-slate-600">Espèces</p>
                  <p className="text-xl font-bold">{totalCash.toFixed(2)} €</p>
                </div>
                <div>
                  <p className="text-sm text-slate-600">Carte</p>
                  <p className="text-xl font-bold">{totalCard.toFixed(2)} €</p>
                </div>
                <div className="col-span-2">
                  <p className="text-sm text-slate-600">Panier moyen</p>
                  <p className="text-xl font-bold">{avgTicket.toFixed(2)} €</p>
                </div>
              </div>
            </div>

            {/* Par serveur */}
            {Object.keys(serverStats).length > 0 && (
              <div className="mb-6">
                <h3 className="text-lg font-bold mb-3 border-b border-slate-300 pb-2">PAR SERVEUR</h3>
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

            {/* Par catégorie */}
            {Object.keys(categoryStats).length > 0 && (
              <div className="mb-6">
                <h3 className="text-lg font-bold mb-3 border-b border-slate-300 pb-2">PAR CATÉGORIE</h3>
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

            {/* Pied de page */}
            <div className="text-center text-xs text-slate-500 mt-6 pt-4 border-t border-slate-300">
              <p>Rapport généré le {new Date().toLocaleString('fr-FR')}</p>
              <p>QuickPOS Pro - Système de caisse professionnel</p>
            </div>
          </div>

          {/* Actions */}
          <div className="flex gap-3">
            <button
              onClick={onClose}
              className="flex-1 py-3 bg-slate-700 hover:bg-slate-600 text-white rounded-xl font-medium transition-colors"
            >
              Fermer
            </button>
            <button
              onClick={handleDownload}
              className="flex-1 py-3 bg-blue-500 hover:bg-blue-600 text-white rounded-xl font-medium transition-colors flex items-center justify-center gap-2"
            >
              <Download className="w-4 h-4" />
              Télécharger JSON
            </button>
            <button
              onClick={handlePrint}
              disabled={isPrinting}
              className="flex-1 py-3 bg-emerald-500 hover:bg-emerald-600 disabled:bg-slate-600 text-white rounded-xl font-medium transition-colors flex items-center justify-center gap-2"
            >
              <Printer className="w-4 h-4" />
              {isPrinting ? 'Impression...' : 'Imprimer'}
            </button>
          </div>
        </motion.div>
      </motion.div>
    </>
  );
}
