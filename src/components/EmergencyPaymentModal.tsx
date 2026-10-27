import { useState } from 'react';
import { motion } from 'framer-motion';
import { X, CreditCard, Banknote, AlertTriangle, CheckCircle } from 'lucide-react';
import { usePOS } from '../store';
import { Ticket } from '../types';

interface EmergencyPaymentModalProps {
  ticket: Ticket;
  onClose: () => void;
}

export default function EmergencyPaymentModal({ ticket, onClose }: EmergencyPaymentModalProps) {
  const { state, dispatch } = usePOS();
  const [paymentMethod, setPaymentMethod] = useState<'CASH' | 'CARD'>('CASH');
  const [amount, setAmount] = useState<string>((ticket.totalAmount - ticket.paidAmount).toFixed(2));
  const [isProcessing, setIsProcessing] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);

  const table = state.tables.find(t => t.id === ticket.tableId);
  const remaining = ticket.totalAmount - ticket.paidAmount;

  const handlePayment = async () => {
    const paymentAmount = parseFloat(amount);
    if (isNaN(paymentAmount) || paymentAmount <= 0) return;

    setIsProcessing(true);

    // Simuler un délai de traitement
    await new Promise(resolve => setTimeout(resolve, 1500));

    // Enregistrer le paiement
    dispatch({
      type: 'ADD_PAYMENT',
      payload: {
        ticketId: ticket.id,
        amount: paymentAmount,
        method: paymentMethod,
      }
    });

    setIsProcessing(false);
    setIsSuccess(true);

    // Fermer après 2 secondes
    setTimeout(() => {
      onClose();
    }, 2000);
  };

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
        className="glass-card rounded-2xl p-6 w-full max-w-lg"
        onClick={e => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-start justify-between mb-6">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-orange-500 to-red-600 flex items-center justify-center">
              <AlertTriangle className="w-6 h-6 text-white" />
            </div>
            <div>
              <h2 className="text-xl font-bold text-white">Encaissement d'urgence</h2>
              <p className="text-sm text-slate-400">
                {table?.name} • {ticket.serverName}
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 text-slate-400 hover:text-white transition-colors"
          >
            <X className="w-6 h-6" />
          </button>
        </div>

        {/* Success State */}
        {isSuccess ? (
          <motion.div
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            className="text-center py-8"
          >
            <div className="w-20 h-20 mx-auto rounded-full bg-gradient-to-br from-emerald-500 to-emerald-600 flex items-center justify-center mb-4">
              <CheckCircle className="w-10 h-10 text-white" />
            </div>
            <h3 className="text-2xl font-bold text-white mb-2">Paiement enregistré !</h3>
            <p className="text-slate-400">
              {parseFloat(amount).toFixed(2)} € en {paymentMethod === 'CASH' ? 'espèces' : 'carte'}
            </p>
          </motion.div>
        ) : (
          <>
            {/* Ticket Info */}
            <div className="glass rounded-xl p-4 mb-6">
              <div className="flex items-center justify-between mb-3">
                <span className="text-sm text-slate-400">Total du ticket</span>
                <span className="text-lg font-bold text-white">
                  {ticket.totalAmount.toFixed(2)} €
                </span>
              </div>
              {ticket.paidAmount > 0 && (
                <div className="flex items-center justify-between mb-3">
                  <span className="text-sm text-slate-400">Déjà payé</span>
                  <span className="text-lg font-bold text-emerald-400">
                    {ticket.paidAmount.toFixed(2)} €
                  </span>
                </div>
              )}
              <div className="flex items-center justify-between pt-3 border-t border-white/10">
                <span className="text-sm font-medium text-orange-400">Reste à payer</span>
                <span className="text-2xl font-bold text-orange-400">
                  {remaining.toFixed(2)} €
                </span>
              </div>
            </div>

            {/* Payment Method */}
            <div className="mb-6">
              <label className="text-sm font-medium text-white mb-3 block">
                Méthode de paiement
              </label>
              <div className="grid grid-cols-2 gap-3">
                <button
                  onClick={() => setPaymentMethod('CASH')}
                  className={`p-4 rounded-xl border-2 transition-all ${
                    paymentMethod === 'CASH'
                      ? 'border-emerald-500 bg-emerald-500/10'
                      : 'border-white/10 bg-white/5 hover:bg-white/10'
                  }`}
                >
                  <Banknote className={`w-8 h-8 mx-auto mb-2 ${
                    paymentMethod === 'CASH' ? 'text-emerald-400' : 'text-slate-400'
                  }`} />
                  <p className={`text-sm font-medium ${
                    paymentMethod === 'CASH' ? 'text-emerald-400' : 'text-slate-300'
                  }`}>
                    Espèces
                  </p>
                </button>
                <button
                  onClick={() => setPaymentMethod('CARD')}
                  className={`p-4 rounded-xl border-2 transition-all ${
                    paymentMethod === 'CARD'
                      ? 'border-blue-500 bg-blue-500/10'
                      : 'border-white/10 bg-white/5 hover:bg-white/10'
                  }`}
                >
                  <CreditCard className={`w-8 h-8 mx-auto mb-2 ${
                    paymentMethod === 'CARD' ? 'text-blue-400' : 'text-slate-400'
                  }`} />
                  <p className={`text-sm font-medium ${
                    paymentMethod === 'CARD' ? 'text-blue-400' : 'text-slate-300'
                  }`}>
                    Carte
                  </p>
                </button>
              </div>
            </div>

            {/* Amount Input */}
            <div className="mb-6">
              <label className="text-sm font-medium text-white mb-3 block">
                Montant à encaisser
              </label>
              <div className="relative">
                <input
                  type="number"
                  value={amount}
                  onChange={e => setAmount(e.target.value)}
                  step="0.01"
                  min="0"
                  max={remaining}
                  className="w-full px-4 py-3 glass rounded-xl text-white text-2xl font-bold text-center focus:outline-none focus:ring-2 focus:ring-purple-500"
                  disabled={isProcessing}
                />
                <span className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-400 text-lg">
                  €
                </span>
              </div>
              <div className="flex gap-2 mt-3">
                <button
                  onClick={() => setAmount(remaining.toFixed(2))}
                  className="flex-1 py-2 glass rounded-lg text-sm text-slate-300 hover:bg-white/10 transition-colors"
                  disabled={isProcessing}
                >
                  Total restant
                </button>
                <button
                  onClick={() => setAmount((remaining / 2).toFixed(2))}
                  className="flex-1 py-2 glass rounded-lg text-sm text-slate-300 hover:bg-white/10 transition-colors"
                  disabled={isProcessing}
                >
                  Moitié
                </button>
              </div>
            </div>

            {/* Payment Button */}
            <button
              onClick={handlePayment}
              disabled={isProcessing || !amount || parseFloat(amount) <= 0}
              className="w-full py-4 gradient-primary text-white rounded-xl font-bold text-lg transition-all hover:scale-105 disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:scale-100"
            >
              {isProcessing ? (
                <span className="flex items-center justify-center gap-2">
                  <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                  Traitement en cours...
                </span>
              ) : (
                `Encaisser ${parseFloat(amount || '0').toFixed(2)} €`
              )}
            </button>

            {/* Warning */}
            <div className="mt-4 p-3 bg-orange-500/10 border border-orange-500/30 rounded-xl">
              <p className="text-xs text-orange-400 text-center">
                ⚠️ Encaissement d'urgence - Le serveur n'a pas pu encaisser ce ticket
              </p>
            </div>
          </>
        )}
      </motion.div>
    </motion.div>
  );
}
