import { motion } from 'framer-motion';
import { X, Clock, User, CreditCard, Banknote } from 'lucide-react';
import { usePOS } from '../store';
import { Ticket } from '../types';

interface TicketDetailModalProps {
  ticket: Ticket;
  onClose: () => void;
}

export default function TicketDetailModal({ ticket, onClose }: TicketDetailModalProps) {
  const { state } = usePOS();
  const table = state.tables.find(t => t.id === ticket.tableId);

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
        className="glass-card rounded-2xl p-6 w-full max-w-2xl max-h-[90vh] overflow-y-auto"
        onClick={e => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-start justify-between mb-6">
          <div>
            <h2 className="text-2xl font-bold text-white mb-1">
              Ticket #{ticket.id.slice(0, 8)}
            </h2>
            <p className="text-slate-400">
              {table?.name} • {ticket.serverName}
            </p>
          </div>
          <button
            onClick={onClose}
            className="p-2 text-slate-400 hover:text-white transition-colors"
          >
            <X className="w-6 h-6" />
          </button>
        </div>

        {/* Status Badge */}
        <div className="mb-6">
          <span className={`inline-block px-4 py-2 rounded-xl text-sm font-bold ${
            ticket.status === 'DRAFT' ? 'bg-amber-500/20 text-amber-400' :
            ticket.status === 'OPEN' ? 'bg-blue-500/20 text-blue-400' :
            ticket.status === 'PAID' ? 'bg-emerald-500/20 text-emerald-400' :
            'bg-red-500/20 text-red-400'
          }`}>
            {ticket.status === 'DRAFT' ? 'Brouillon' :
             ticket.status === 'OPEN' ? 'En cours' :
             ticket.status === 'PAID' ? 'Payé' : 'Annulé'}
          </span>
        </div>

        {/* Info Cards */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-6">
          <div className="glass rounded-xl p-3">
            <div className="flex items-center gap-2 mb-1">
              <Clock className="w-4 h-4 text-slate-400" />
              <span className="text-xs text-slate-400">Créé</span>
            </div>
            <p className="text-sm font-bold text-white">
              {new Date(ticket.createdAt).toLocaleTimeString('fr-FR', { 
                hour: '2-digit', 
                minute: '2-digit' 
              })}
            </p>
          </div>
          
          <div className="glass rounded-xl p-3">
            <div className="flex items-center gap-2 mb-1">
              <User className="w-4 h-4 text-slate-400" />
              <span className="text-xs text-slate-400">Serveur</span>
            </div>
            <p className="text-sm font-bold text-white">{ticket.serverName}</p>
          </div>

          <div className="glass rounded-xl p-3">
            <div className="flex items-center gap-2 mb-1">
              <CreditCard className="w-4 h-4 text-slate-400" />
              <span className="text-xs text-slate-400">Total</span>
            </div>
            <p className="text-sm font-bold text-emerald-400">
              {ticket.totalAmount.toFixed(2)} €
            </p>
          </div>

          <div className="glass rounded-xl p-3">
            <div className="flex items-center gap-2 mb-1">
              <Banknote className="w-4 h-4 text-slate-400" />
              <span className="text-xs text-slate-400">Payé</span>
            </div>
            <p className="text-sm font-bold text-emerald-400">
              {ticket.paidAmount.toFixed(2)} €
            </p>
          </div>
        </div>

        {/* Items List */}
        <div className="mb-6">
          <h3 className="text-lg font-bold text-white mb-3">Articles</h3>
          <div className="space-y-2">
            {ticket.items.map(item => (
              <div key={item.id} className="glass rounded-xl p-3 flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <span className="text-2xl">{item.menuItem.emoji}</span>
                  <div>
                    <p className="text-sm font-medium text-white">
                      {item.quantity}x {item.menuItem.name}
                    </p>
                    {item.notes && (
                      <p className="text-xs text-amber-400 italic">📝 {item.notes}</p>
                    )}
                    {Object.keys(item.modifiers).length > 0 && (
                      <p className="text-xs text-blue-400">
                        {Object.entries(item.modifiers).map(([k, v]) => `${k}: ${v}`).join(', ')}
                      </p>
                    )}
                  </div>
                </div>
                <div className="text-right">
                  <p className="text-sm font-bold text-white">
                    {(item.menuItem.price * item.quantity).toFixed(2)} €
                  </p>
                  <p className={`text-xs ${
                    item.status === 'pending' ? 'text-amber-400' :
                    item.status === 'validated' ? 'text-blue-400' :
                    item.status === 'sent' ? 'text-purple-400' :
                    item.status === 'preparing' ? 'text-blue-400' :
                    item.status === 'ready' ? 'text-emerald-400' :
                    'text-slate-400'
                  }`}>
                    {item.status === 'pending' ? 'En attente' :
                     item.status === 'validated' ? 'Validé' :
                     item.status === 'sent' ? 'Envoyé' :
                     item.status === 'preparing' ? 'En préparation' :
                     item.status === 'ready' ? 'Prêt' :
                     item.status === 'served' ? 'Servi' : ''}
                  </p>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Payments */}
        {ticket.payments.length > 0 && (
          <div>
            <h3 className="text-lg font-bold text-white mb-3">Paiements</h3>
            <div className="space-y-2">
              {ticket.payments.map(payment => (
                <div key={payment.id} className="glass rounded-xl p-3 flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    {payment.method === 'CASH' ? (
                      <Banknote className="w-5 h-5 text-emerald-400" />
                    ) : (
                      <CreditCard className="w-5 h-5 text-blue-400" />
                    )}
                    <div>
                      <p className="text-sm font-medium text-white">
                        {payment.method === 'CASH' ? 'Espèces' : 'Carte'}
                      </p>
                      <p className="text-xs text-slate-400">
                        {new Date(payment.timestamp).toLocaleTimeString('fr-FR', { 
                          hour: '2-digit', 
                          minute: '2-digit' 
                        })}
                      </p>
                    </div>
                  </div>
                  <p className="text-sm font-bold text-emerald-400">
                    {payment.amount.toFixed(2)} €
                  </p>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Remaining Amount */}
        {ticket.totalAmount - ticket.paidAmount > 0 && (
          <div className="mt-6 p-4 bg-orange-500/10 border border-orange-500/30 rounded-xl">
            <div className="flex items-center justify-between">
              <span className="text-sm font-medium text-orange-400">Reste à payer</span>
              <span className="text-xl font-bold text-orange-400">
                {(ticket.totalAmount - ticket.paidAmount).toFixed(2)} €
              </span>
            </div>
          </div>
        )}
      </motion.div>
    </motion.div>
  );
}
