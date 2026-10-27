import React, { useState } from 'react';
import { Order, OrderItem } from '../types';
import { usePOS } from '../store';
import { X, Plus, Minus, CreditCard, Banknote, Check } from 'lucide-react';

interface PaymentModalProps {
  order: Order;
  onClose: () => void;
}

export const PaymentModal: React.FC<PaymentModalProps> = ({ order, onClose }) => {
  const { dispatch } = usePOS();
  const [selectedItems, setSelectedItems] = useState<Set<string>>(new Set());
  const [customAmount, setCustomAmount] = useState<string>('');
  const [paymentMethod, setPaymentMethod] = useState<'cash' | 'card'>('cash');

  const totalPaid = order.payments.reduce((sum, p) => sum + p.amount, 0);
  const remaining = order.total - totalPaid;

  // Sélectionner tous les items
  const selectAll = () => {
    const allIds = new Set(order.items.map(item => item.id));
    setSelectedItems(allIds);
  };

  // Désélectionner tout
  const selectNone = () => {
    setSelectedItems(new Set());
  };

  // Calculer le montant des items sélectionnés
  const selectedAmount = order.items
    .filter(item => selectedItems.has(item.id))
    .reduce((sum, item) => sum + (item.menuItem.price * item.quantity), 0);

  // Montant à payer (soit items sélectionnés, soit montant personnalisé)
  const amountToPay = customAmount ? parseFloat(customAmount) : selectedAmount;

  // Payer
  const handlePayment = () => {
    if (amountToPay <= 0) return;

    dispatch({
      type: 'ADD_PAYMENT',
      payload: {
        orderId: order.id,
        amount: amountToPay,
        method: paymentMethod,
      },
    });

    onClose();
  };

  // Fermer la table (si tout est payé)
  const handleCloseTable = () => {
    if (remaining > 0.01) {
      alert(`Il reste ${remaining.toFixed(2)}€ à payer`);
      return;
    }

    dispatch({
      type: 'CLOSE_ORDER',
      payload: order.id,
    });

    onClose();
  };

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-slate-800 rounded-lg w-full max-w-2xl max-h-[90vh] overflow-hidden flex flex-col">
        {/* Header */}
        <div className="p-4 border-b border-slate-700 flex items-center justify-between">
          <div>
            <h2 className="text-xl font-bold text-white">
              Paiement - Table {order.tableId}
            </h2>
            <p className="text-sm text-slate-400">
              Total: {order.total.toFixed(2)}€ | Payé: {totalPaid.toFixed(2)}€ | Reste: {remaining.toFixed(2)}€
            </p>
          </div>
          <button
            onClick={onClose}
            className="p-2 hover:bg-slate-700 rounded-lg transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-4">
          {/* Sélection des items */}
          <div className="mb-6">
            <div className="flex items-center justify-between mb-3">
              <h3 className="text-lg font-semibold text-white">Articles à payer</h3>
              <div className="flex gap-2">
                <button
                  onClick={selectAll}
                  className="px-3 py-1 text-sm bg-blue-600 hover:bg-blue-700 rounded transition-colors"
                >
                  Tout sélectionner
                </button>
                <button
                  onClick={selectNone}
                  className="px-3 py-1 text-sm bg-slate-700 hover:bg-slate-600 rounded transition-colors"
                >
                  Désélectionner
                </button>
              </div>
            </div>

            <div className="space-y-2">
              {order.items.map((item) => (
                <div
                  key={item.id}
                  onClick={() => {
                    const newSet = new Set(selectedItems);
                    if (newSet.has(item.id)) {
                      newSet.delete(item.id);
                    } else {
                      newSet.add(item.id);
                    }
                    setSelectedItems(newSet);
                    setCustomAmount(''); // Reset custom amount
                  }}
                  className={`p-3 rounded-lg border-2 cursor-pointer transition-all ${
                    selectedItems.has(item.id)
                      ? 'border-blue-500 bg-blue-500/10'
                      : 'border-slate-700 bg-slate-800 hover:border-slate-600'
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <div className="text-2xl">{item.menuItem.emoji}</div>
                      <div>
                        <p className="font-medium text-white">{item.menuItem.name}</p>
                        <p className="text-sm text-slate-400">
                          {item.quantity}x {item.menuItem.price.toFixed(2)}€
                        </p>
                      </div>
                    </div>
                    <div className="text-right">
                      <p className="text-lg font-bold text-white">
                        {(item.menuItem.price * item.quantity).toFixed(2)}€
                      </p>
                      {selectedItems.has(item.id) && (
                        <Check className="w-5 h-5 text-blue-500 ml-auto" />
                      )}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Montant personnalisé */}
          <div className="mb-6">
            <h3 className="text-lg font-semibold text-white mb-3">Ou montant personnalisé</h3>
            <div className="flex gap-2">
              <input
                type="number"
                value={customAmount}
                onChange={(e) => {
                  setCustomAmount(e.target.value);
                  selectNone(); // Deselect items when using custom amount
                }}
                placeholder="Montant exact"
                className="flex-1 px-4 py-2 bg-slate-700 border border-slate-600 rounded-lg text-white focus:outline-none focus:border-blue-500"
                step="0.01"
                min="0"
              />
              <button
                onClick={() => {
                  setCustomAmount(remaining.toFixed(2));
                  selectNone();
                }}
                className="px-4 py-2 bg-slate-700 hover:bg-slate-600 rounded-lg transition-colors"
              >
                Reste ({remaining.toFixed(2)}€)
              </button>
            </div>
          </div>

          {/* Méthode de paiement */}
          <div className="mb-6">
            <h3 className="text-lg font-semibold text-white mb-3">Méthode de paiement</h3>
            <div className="grid grid-cols-2 gap-3">
              <button
                onClick={() => setPaymentMethod('cash')}
                className={`p-4 rounded-lg border-2 transition-all ${
                  paymentMethod === 'cash'
                    ? 'border-green-500 bg-green-500/10'
                    : 'border-slate-700 bg-slate-800 hover:border-slate-600'
                }`}
              >
                <Banknote className="w-8 h-8 mx-auto mb-2" />
                <p className="font-medium text-white">Espèces</p>
              </button>
              <button
                onClick={() => setPaymentMethod('card')}
                className={`p-4 rounded-lg border-2 transition-all ${
                  paymentMethod === 'card'
                    ? 'border-blue-500 bg-blue-500/10'
                    : 'border-slate-700 bg-slate-800 hover:border-slate-600'
                }`}
              >
                <CreditCard className="w-8 h-8 mx-auto mb-2" />
                <p className="font-medium text-white">Carte</p>
              </button>
            </div>
          </div>

          {/* Résumé */}
          <div className="bg-slate-900 rounded-lg p-4">
            <div className="flex items-center justify-between mb-2">
              <span className="text-slate-400">Montant à encaisser:</span>
              <span className="text-2xl font-bold text-white">
                {amountToPay.toFixed(2)}€
              </span>
            </div>
            {remaining > 0.01 && (
              <div className="flex items-center justify-between text-sm">
                <span className="text-orange-400">Reste à payer après:</span>
                <span className="text-orange-400 font-medium">
                  {(remaining - amountToPay).toFixed(2)}€
                </span>
              </div>
            )}
          </div>
        </div>

        {/* Footer */}
        <div className="p-4 border-t border-slate-700 flex gap-3">
          <button
            onClick={onClose}
            className="flex-1 px-4 py-3 bg-slate-700 hover:bg-slate-600 rounded-lg font-medium transition-colors"
          >
            Annuler
          </button>
          <button
            onClick={handlePayment}
            disabled={amountToPay <= 0}
            className="flex-1 px-4 py-3 bg-blue-600 hover:bg-blue-700 disabled:bg-slate-700 disabled:cursor-not-allowed rounded-lg font-medium transition-colors"
          >
            Encaisser {amountToPay.toFixed(2)}€
          </button>
          {remaining <= 0.01 && (
            <button
              onClick={handleCloseTable}
              className="px-4 py-3 bg-green-600 hover:bg-green-700 rounded-lg font-medium transition-colors"
            >
              Fermer table
            </button>
          )}
        </div>
      </div>
    </div>
  );
};
