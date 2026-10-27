import { usePOS } from '../store';
import { motion } from 'framer-motion';
import { DollarSign, Banknote, CreditCard, Users, Receipt, CheckCircle, AlertTriangle, Printer, LogOut } from 'lucide-react';
import { useState } from 'react';
import { usePrinter } from '../lib/hooks';

export default function CloseSession() {
  const { state, dispatch } = usePOS();
  const { printZReport } = usePrinter();
  const [confirmed, setConfirmed] = useState(false);
  const [expectedCash, setExpectedCash] = useState(state.cashBalance.toString());
  const [actualCash, setActualCash] = useState('');
  const [notes, setNotes] = useState('');
  const [printing, setPrinting] = useState(false);

  const session = state.session;
  const openOrders = state.orders.filter(o => o.status === 'open');
  const hasOpenOrders = openOrders.length > 0;

  const expectedCashNum = parseFloat(expectedCash) || 0;
  const actualCashNum = parseFloat(actualCash) || 0;
  const cashDifference = actualCashNum - expectedCashNum;

  const handleClose = async () => {
    setPrinting(true);
    // Imprimer le rapport Z
    await printZReport({
      ...session,
      closedAt: new Date(),
    });
    setPrinting(false);
    dispatch({ type: 'CLOSE_SESSION' });
  };

  return (
    <div className="h-screen w-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 flex items-center justify-center p-4 overflow-y-auto">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="w-full max-w-2xl"
      >
        {/* Header */}
        <div className="text-center mb-6">
          <div className="w-16 h-16 mx-auto rounded-2xl bg-gradient-to-br from-red-500 to-orange-600 flex items-center justify-center mb-4 shadow-lg shadow-red-500/20">
            <Receipt className="w-8 h-8 text-white" />
          </div>
          <h1 className="text-2xl md:text-3xl font-bold text-white">Clôture de Session</h1>
          <p className="text-slate-400 mt-1">
            {new Date().toLocaleDateString('fr-FR', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' })}
          </p>
          <p className="text-xs text-slate-500 mt-1">
            Session ouverte à {new Date(session.openedAt).toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' })}
          </p>
        </div>

        {/* Warning for open orders */}
        {hasOpenOrders && (
          <div className="mb-4 p-4 bg-red-500/10 border border-red-500/30 rounded-xl flex items-center gap-3">
            <AlertTriangle className="w-5 h-5 text-red-400 shrink-0" />
            <div>
              <p className="text-sm font-medium text-red-400">Attention : {openOrders.length} commande(s) encore ouverte(s)</p>
              <p className="text-xs text-slate-400">Veuillez clôturer toutes les commandes avant de fermer la session.</p>
            </div>
          </div>
        )}

        {/* Session Summary */}
        <div className="bg-slate-800/80 border border-slate-700/50 rounded-2xl p-5 mb-4">
          <h3 className="text-lg font-bold text-white mb-4 flex items-center gap-2">
            <DollarSign className="w-5 h-5 text-emerald-400" />
            Résumé de la session
          </h3>

          {/* Totals */}
          <div className="grid grid-cols-3 gap-3 mb-5">
            <div className="bg-slate-700/30 rounded-xl p-3 text-center">
              <p className="text-xs text-slate-400">Total Général</p>
              <p className="text-xl font-bold text-emerald-400">{session.totalRevenue.toFixed(2)} €</p>
            </div>
            <div className="bg-slate-700/30 rounded-xl p-3 text-center">
              <p className="text-xs text-slate-400">💵 Espèces</p>
              <p className="text-xl font-bold text-amber-400">{session.totalCash.toFixed(2)} €</p>
            </div>
            <div className="bg-slate-700/30 rounded-xl p-3 text-center">
              <p className="text-xs text-slate-400">💳 Carte</p>
              <p className="text-xl font-bold text-blue-400">{session.totalCard.toFixed(2)} €</p>
            </div>
          </div>

          {/* Orders count */}
          <div className="flex items-center justify-between p-3 bg-slate-700/30 rounded-xl mb-4">
            <div className="flex items-center gap-2">
              <Receipt className="w-4 h-4 text-slate-400" />
              <span className="text-sm text-slate-300">Nombre de commandes</span>
            </div>
            <span className="text-lg font-bold text-white">{session.totalOrders}</span>
          </div>

          {/* Server Breakdown */}
          <h4 className="text-sm font-semibold text-slate-300 mb-3 flex items-center gap-2">
            <Users className="w-4 h-4 text-purple-400" />
            Détail par serveur
          </h4>
          <div className="space-y-2 mb-4">
            {Object.entries(session.serverTotals).map(([serverId, data]) => {
              const server = state.servers.find(s => s.id === serverId);
              return (
                <div key={serverId} className="flex items-center justify-between p-3 bg-slate-700/20 rounded-xl">
                  <div className="flex items-center gap-3">
                    <div
                      className="w-8 h-8 rounded-full flex items-center justify-center text-white text-sm font-bold"
                      style={{ backgroundColor: server?.color || '#64748b' }}
                    >
                      {data.name[0]}
                    </div>
                    <div>
                      <p className="text-sm font-medium text-white">{data.name}</p>
                      <p className="text-xs text-slate-400">{data.orders} commande(s)</p>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className="text-sm font-bold text-emerald-400">{data.revenue.toFixed(2)} €</p>
                    <p className="text-[10px] text-slate-400">
                      💵 {data.cash.toFixed(2)} • 💳 {data.card.toFixed(2)}
                    </p>
                  </div>
                </div>
              );
            })}
            {Object.keys(session.serverTotals).length === 0 && (
              <p className="text-sm text-slate-500 text-center py-3">Aucune commande cette session</p>
            )}
          </div>

          {/* Cash Count */}
          <h4 className="text-sm font-semibold text-slate-300 mb-3 flex items-center gap-2">
            <Banknote className="w-4 h-4 text-amber-400" />
            Comptage caisse
          </h4>
          <div className="grid grid-cols-2 gap-3 mb-3">
            <div>
              <label className="text-xs text-slate-400 mb-1 block">Fonds attendu</label>
              <div className="relative">
                <input
                  type="number"
                  value={expectedCash}
                  onChange={e => setExpectedCash(e.target.value)}
                  className="w-full p-3 bg-slate-700/50 border border-slate-600/50 rounded-xl text-white text-sm pr-8 focus:outline-none focus:border-blue-500/50"
                />
                <span className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 text-sm">€</span>
              </div>
            </div>
            <div>
              <label className="text-xs text-slate-400 mb-1 block">Fonds réel (compté)</label>
              <div className="relative">
                <input
                  type="number"
                  value={actualCash}
                  onChange={e => setActualCash(e.target.value)}
                  placeholder="Saisir le montant"
                  className="w-full p-3 bg-slate-700/50 border border-slate-600/50 rounded-xl text-white text-sm pr-8 focus:outline-none focus:border-blue-500/50"
                />
                <span className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 text-sm">€</span>
              </div>
            </div>
          </div>

          {actualCash && (
            <div className={`p-3 rounded-xl border ${
              cashDifference === 0 ? 'bg-emerald-500/10 border-emerald-500/30' :
              cashDifference > 0 ? 'bg-blue-500/10 border-blue-500/30' :
              'bg-red-500/10 border-red-500/30'
            }`}>
              <div className="flex items-center justify-between">
                <span className="text-sm text-slate-300">Écart de caisse</span>
                <span className={`text-lg font-bold ${
                  cashDifference === 0 ? 'text-emerald-400' :
                  cashDifference > 0 ? 'text-blue-400' : 'text-red-400'
                }`}>
                  {cashDifference >= 0 ? '+' : ''}{cashDifference.toFixed(2)} €
                </span>
              </div>
              <p className="text-xs text-slate-400 mt-1">
                {cashDifference === 0 ? '✅ Compte exact' :
                 cashDifference > 0 ? '📈 Excédent' : '📉 Manquant'}
              </p>
            </div>
          )}

          {/* Notes */}
          <div className="mt-3">
            <label className="text-xs text-slate-400 mb-1 block">Notes de clôture</label>
            <textarea
              value={notes}
              onChange={e => setNotes(e.target.value)}
              placeholder="Observations, incidents, remarques..."
              className="w-full p-3 bg-slate-700/50 border border-slate-600/50 rounded-xl text-white text-sm h-20 resize-none focus:outline-none focus:border-blue-500/50"
            />
          </div>
        </div>

        {/* Actions */}
        <div className="flex gap-3">
          <button
            onClick={() => dispatch({ type: 'SET_SCREEN', payload: 'select' })}
            className="flex-1 py-4 bg-slate-700 hover:bg-slate-600 text-slate-300 rounded-xl font-medium flex items-center justify-center gap-2 transition-colors"
          >
            <LogOut className="w-4 h-4" />
            Annuler
          </button>
          <button
            onClick={() => setConfirmed(true)}
            disabled={hasOpenOrders}
            className="flex-1 py-4 bg-gradient-to-r from-red-500 to-orange-500 hover:from-red-600 hover:to-orange-600 disabled:from-slate-600 disabled:to-slate-700 disabled:text-slate-400 text-white rounded-xl font-bold flex items-center justify-center gap-2 transition-all active:scale-[0.98]"
          >
            <CheckCircle className="w-5 h-5" />
            Clôturer la journée
          </button>
        </div>

        {/* Confirmation Modal */}
        {confirmed && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="fixed inset-0 bg-black/70 flex items-center justify-center z-50 p-4"
          >
            <motion.div
              initial={{ scale: 0.9 }}
              animate={{ scale: 1 }}
              className="bg-slate-800 rounded-2xl border border-slate-700 p-6 w-full max-w-sm text-center"
            >
              <div className="w-16 h-16 mx-auto rounded-full bg-red-500/20 flex items-center justify-center mb-4">
                <AlertTriangle className="w-8 h-8 text-red-400" />
              </div>
              <h3 className="text-xl font-bold text-white mb-2">Confirmer la clôture ?</h3>
              <p className="text-sm text-slate-400 mb-2">
                Total : <span className="text-emerald-400 font-bold">{session.totalRevenue.toFixed(2)} €</span>
              </p>
              <p className="text-xs text-slate-500 mb-5">
                Cette action est irréversible. Une nouvelle session commencera demain.
              </p>
              <div className="flex gap-3">
                <button
                  onClick={() => setConfirmed(false)}
                  className="flex-1 py-3 bg-slate-700 text-slate-300 rounded-xl font-medium"
                >
                  Annuler
                </button>
                <button
                  onClick={handleClose}
                  className="flex-1 py-3 bg-red-500 hover:bg-red-600 text-white rounded-xl font-bold"
                >
                  Confirmer
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </motion.div>
    </div>
  );
}
