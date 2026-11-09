import { useState } from 'react';
import { motion } from 'framer-motion';
import { X, AlertTriangle, DollarSign, CreditCard, FileText, CheckCircle } from 'lucide-react';
import { usePOS } from '../store';

interface CloseSessionModalProps {
  onClose: () => void;
}

export default function CloseSessionModal({ onClose }: CloseSessionModalProps) {
  const { state, dispatch } = usePOS();
  const [finalCash, setFinalCash] = useState(state.cashBalance.toString());
  const [notes, setNotes] = useState('');
  const [step, setStep] = useState<'summary' | 'confirm' | 'success'>('summary');

  if (!state.currentSession) {
    return null;
  }

  // ✅ CORRECTION #2: Utiliser createdAt pour cohérence avec le store
  const sessionTickets = state.tickets.filter(t => 
    new Date(t.createdAt) >= state.currentSession!.openedAt
  );

  const paidTickets = sessionTickets.filter(t => t.status === 'PAID');
  const totalRevenue = paidTickets.reduce((sum, t) => sum + t.paidAmount, 0);
  const totalCash = paidTickets.reduce((sum, t) => 
    sum + t.payments.filter(p => p.method === 'CASH').reduce((s, p) => s + p.amount, 0), 0
  );
  const totalCard = paidTickets.reduce((sum, t) => 
    sum + t.payments.filter(p => p.method === 'CARD').reduce((s, p) => s + p.amount, 0), 0
  );

  const expectedCash = state.currentSession.initialCash + totalCash;
  const actualCash = parseFloat(finalCash) || 0;
  const cashDifference = actualCash - expectedCash;

  const openTickets = state.tickets.filter(t => t.status === 'OPEN' || t.status === 'DRAFT');
  const hasOpenTickets = openTickets.length > 0;

  const handleCloseSession = () => {
    dispatch({
      type: 'CLOSE_SESSION',
      payload: {
        finalCash: actualCash,
        notes,
      }
    });
    setStep('success');
  };

  const handlePrintReport = () => {
    window.print();
  };

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4"
      onClick={step !== 'success' ? onClose : undefined}
    >
      <motion.div
        initial={{ scale: 0.9, y: 20 }}
        animate={{ scale: 1, y: 0 }}
        exit={{ scale: 0.9, y: 20 }}
        className="glass-card rounded-2xl p-6 w-full max-w-2xl max-h-[90vh] overflow-y-auto"
        onClick={e => e.stopPropagation()}
      >
        {step === 'summary' && (
          <>
            {/* Header */}
            <div className="flex items-start justify-between mb-6">
              <div>
                <h2 className="text-2xl font-bold text-white mb-1">Clôturer la Session</h2>
                <p className="text-slate-400">
                  Session ouverte le {new Date(state.currentSession.openedAt).toLocaleString('fr-FR')}
                </p>
              </div>
              <button onClick={onClose} className="p-2 text-slate-400 hover:text-white transition-colors">
                <X className="w-6 h-6" />
              </button>
            </div>

            {/* Warning for open tickets */}
            {hasOpenTickets && (
              <div className="mb-6 p-4 bg-red-500/10 border border-red-500/30 rounded-xl flex items-start gap-3">
                <AlertTriangle className="w-5 h-5 text-red-400 shrink-0 mt-0.5" />
                <div>
                  <p className="text-sm font-medium text-red-400">
                    {openTickets.length} ticket(s) encore ouvert(s)
                  </p>
                  <p className="text-xs text-slate-400 mt-1">
                    Veuillez clôturer tous les tickets avant de fermer la session.
                  </p>
                </div>
              </div>
            )}

            {/* Résumé de la session */}
            <div className="mb-6">
              <h3 className="text-lg font-bold text-white mb-3">Résumé de la Session</h3>
              <div className="grid grid-cols-2 gap-3">
                <div className="glass rounded-xl p-4">
                  <p className="text-xs text-slate-400 mb-1">Chiffre d'affaires</p>
                  <p className="text-2xl font-bold text-emerald-400">{totalRevenue.toFixed(2)} €</p>
                </div>
                <div className="glass rounded-xl p-4">
                  <p className="text-xs text-slate-400 mb-1">Tickets</p>
                  <p className="text-2xl font-bold text-white">{sessionTickets.length}</p>
                </div>
                <div className="glass rounded-xl p-4">
                  <div className="flex items-center gap-2 mb-1">
                    <DollarSign className="w-4 h-4 text-emerald-400" />
                    <p className="text-xs text-slate-400">Espèces</p>
                  </div>
                  <p className="text-xl font-bold text-emerald-400">{totalCash.toFixed(2)} €</p>
                </div>
                <div className="glass rounded-xl p-4">
                  <div className="flex items-center gap-2 mb-1">
                    <CreditCard className="w-4 h-4 text-blue-400" />
                    <p className="text-xs text-slate-400">Carte</p>
                  </div>
                  <p className="text-xl font-bold text-blue-400">{totalCard.toFixed(2)} €</p>
                </div>
              </div>
            </div>

            {/* Comptage caisse */}
            <div className="mb-6">
              <h3 className="text-lg font-bold text-white mb-3">Comptage de Caisse</h3>
              <div className="glass rounded-xl p-4 mb-3">
                <div className="flex justify-between items-center mb-2">
                  <span className="text-sm text-slate-400">Fonds initial</span>
                  <span className="text-lg font-bold text-white">
                    {state.currentSession.initialCash.toFixed(2)} €
                  </span>
                </div>
                <div className="flex justify-between items-center mb-2">
                  <span className="text-sm text-slate-400">+ Espèces encaissées</span>
                  <span className="text-lg font-bold text-emerald-400">
                    + {totalCash.toFixed(2)} €
                  </span>
                </div>
                <div className="flex justify-between items-center pt-2 border-t border-white/10">
                  <span className="text-sm font-medium text-slate-300">Fonds attendu</span>
                  <span className="text-xl font-bold text-amber-400">
                    {expectedCash.toFixed(2)} €
                  </span>
                </div>
              </div>

              <div>
                <label className="text-sm text-slate-400 mb-2 block">Fonds réel compté</label>
                <div className="relative">
                  <input
                    type="number"
                    value={finalCash}
                    onChange={e => setFinalCash(e.target.value)}
                    step="0.01"
                    className="w-full px-4 py-3 glass rounded-xl text-white text-xl font-bold text-center focus:outline-none focus:ring-2 focus:ring-purple-500"
                    placeholder="0.00"
                  />
                  <span className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-400 text-lg">€</span>
                </div>
              </div>

              {finalCash && (
                <div className={`mt-3 p-3 rounded-xl border ${
                  cashDifference === 0 ? 'bg-emerald-500/10 border-emerald-500/30' :
                  cashDifference > 0 ? 'bg-blue-500/10 border-blue-500/30' :
                  'bg-red-500/10 border-red-500/30'
                }`}>
                  <div className="flex justify-between items-center">
                    <span className="text-sm text-slate-300">Écart de caisse</span>
                    <span className={`text-lg font-bold ${
                      cashDifference === 0 ? 'text-emerald-400' :
                      cashDifference > 0 ? 'text-blue-400' : 'text-red-400'
                    }`}>
                      {cashDifference >= 0 ? '+' : ''}{cashDifference.toFixed(2)} €
                    </span>
                  </div>
                  <p className="text-xs text-slate-400 mt-1">
                    {cashDifference === 0 ? '✓ Compte exact' :
                     cashDifference > 0 ? '↑ Excédent' : '↓ Manquant'}
                  </p>
                </div>
              )}
            </div>

            {/* Notes */}
            <div className="mb-6">
              <label className="text-sm text-slate-400 mb-2 block">Notes de clôture (optionnel)</label>
              <textarea
                value={notes}
                onChange={e => setNotes(e.target.value)}
                placeholder="Observations, incidents, remarques..."
                className="w-full px-4 py-3 glass rounded-xl text-white text-sm focus:outline-none focus:ring-2 focus:ring-purple-500 resize-none h-20"
              />
            </div>

            {/* Actions */}
            <div className="flex gap-3">
              <button
                onClick={onClose}
                className="flex-1 py-3 bg-slate-700 hover:bg-slate-600 text-white rounded-xl font-medium transition-colors"
              >
                Annuler
              </button>
              <button
                onClick={handlePrintReport}
                className="flex-1 py-3 bg-blue-500 hover:bg-blue-600 text-white rounded-xl font-medium transition-colors flex items-center justify-center gap-2"
              >
                <FileText className="w-4 h-4" />
                Imprimer Rapport
              </button>
              <button
                onClick={() => setStep('confirm')}
                disabled={hasOpenTickets || !finalCash}
                className="flex-1 py-3 bg-red-500 hover:bg-red-600 disabled:bg-slate-600 disabled:cursor-not-allowed text-white rounded-xl font-bold transition-colors"
              >
                Clôturer
              </button>
            </div>
          </>
        )}

        {step === 'confirm' && (
          <>
            <div className="text-center py-8">
              <div className="w-20 h-20 mx-auto rounded-full bg-red-500/20 flex items-center justify-center mb-4">
                <AlertTriangle className="w-10 h-10 text-red-400" />
              </div>
              <h2 className="text-2xl font-bold text-white mb-2">Confirmer la Clôture</h2>
              <p className="text-slate-400 mb-6">
                Cette action est irréversible. La session sera fermée et une nouvelle session pourra être ouverte.
              </p>

              <div className="glass rounded-xl p-4 mb-6 text-left">
                <div className="flex justify-between items-center mb-2">
                  <span className="text-sm text-slate-400">Chiffre d'affaires</span>
                  <span className="text-lg font-bold text-emerald-400">{totalRevenue.toFixed(2)} €</span>
                </div>
                <div className="flex justify-between items-center mb-2">
                  <span className="text-sm text-slate-400">Tickets</span>
                  <span className="text-lg font-bold text-white">{sessionTickets.length}</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-sm text-slate-400">Écart de caisse</span>
                  <span className={`text-lg font-bold ${
                    cashDifference === 0 ? 'text-emerald-400' :
                    cashDifference > 0 ? 'text-blue-400' : 'text-red-400'
                  }`}>
                    {cashDifference >= 0 ? '+' : ''}{cashDifference.toFixed(2)} €
                  </span>
                </div>
              </div>

              <div className="flex gap-3">
                <button
                  onClick={() => setStep('summary')}
                  className="flex-1 py-3 bg-slate-700 hover:bg-slate-600 text-white rounded-xl font-medium transition-colors"
                >
                  Annuler
                </button>
                <button
                  onClick={handleCloseSession}
                  className="flex-1 py-3 bg-red-500 hover:bg-red-600 text-white rounded-xl font-bold transition-colors"
                >
                  Confirmer la Clôture
                </button>
              </div>
            </div>
          </>
        )}

        {step === 'success' && (
          <div className="text-center py-8">
            <motion.div
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              transition={{ type: 'spring', stiffness: 200, damping: 15 }}
            >
              <div className="w-24 h-24 mx-auto rounded-full bg-emerald-500/20 flex items-center justify-center mb-4">
                <CheckCircle className="w-12 h-12 text-emerald-400" />
              </div>
              <h2 className="text-2xl font-bold text-white mb-2">Session Clôturée !</h2>
              <p className="text-slate-400 mb-6">
                La session a été fermée avec succès. Vous pouvez maintenant ouvrir une nouvelle session.
              </p>

              <div className="glass rounded-xl p-4 mb-6">
                <div className="flex justify-between items-center mb-2">
                  <span className="text-sm text-slate-400">Chiffre d'affaires</span>
                  <span className="text-xl font-bold text-emerald-400">{totalRevenue.toFixed(2)} €</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-sm text-slate-400">Tickets traités</span>
                  <span className="text-xl font-bold text-white">{sessionTickets.length}</span>
                </div>
              </div>

              <button
                onClick={() => window.location.reload()}
                className="w-full py-3 bg-gradient-to-r from-blue-500 to-purple-600 hover:from-blue-600 hover:to-purple-700 text-white rounded-xl font-bold transition-all"
              >
                Ouvrir une Nouvelle Session
              </button>
            </motion.div>
          </div>
        )}
      </motion.div>
    </motion.div>
  );
}
