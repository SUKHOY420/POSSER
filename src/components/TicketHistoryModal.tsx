import { useState } from 'react';
import { motion } from 'framer-motion';
import { X, Clock, User, CreditCard, Banknote, Calendar } from 'lucide-react';
import { usePOS } from '../store';
import { Ticket } from '../types';

interface TicketHistoryModalProps {
  filterType: 'table' | 'server';
  filterId: string;
  filterName: string;
  onClose: () => void;
  onViewTicket: (ticket: Ticket) => void;
}

export default function TicketHistoryModal({ 
  filterType, 
  filterId, 
  filterName, 
  onClose, 
  onViewTicket 
}: TicketHistoryModalProps) {
  const { state } = usePOS();
  const [statusFilter, setStatusFilter] = useState<'all' | 'paid' | 'open'>('all');

  // Filtrer les tickets
  let tickets = state.tickets.filter(t => {
    if (filterType === 'table') {
      return t.tableId === filterId;
    } else {
      return t.serverId === filterId;
    }
  });

  // Filtrer par statut
  if (statusFilter === 'paid') {
    tickets = tickets.filter(t => t.status === 'PAID');
  } else if (statusFilter === 'open') {
    tickets = tickets.filter(t => t.status === 'OPEN' || t.status === 'DRAFT');
  }

  // Trier par date (plus récent en premier)
  tickets = tickets.sort((a, b) => 
    new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
  );

  // Calculer les statistiques
  const totalRevenue = tickets
    .filter(t => t.status === 'PAID')
    .reduce((sum, t) => sum + t.paidAmount, 0);
  
  const totalTickets = tickets.length;
  const avgTicket = totalTickets > 0 ? totalRevenue / totalTickets : 0;

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
        className="glass-card rounded-2xl p-6 w-full max-w-4xl max-h-[90vh] overflow-y-auto"
        onClick={e => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-start justify-between mb-6">
          <div>
            <h2 className="text-2xl font-bold text-white mb-1">
              Historique - {filterName}
            </h2>
            <p className="text-slate-400">
              {filterType === 'table' ? 'Table' : 'Serveur'} • {totalTickets} ticket(s)
            </p>
          </div>
          <button
            onClick={onClose}
            className="p-2 text-slate-400 hover:text-white transition-colors"
          >
            <X className="w-6 h-6" />
          </button>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-3 gap-3 mb-6">
          <div className="glass rounded-xl p-4">
            <div className="flex items-center gap-2 mb-1">
              <CreditCard className="w-4 h-4 text-emerald-400" />
              <span className="text-xs text-slate-400">Chiffre d'affaires</span>
            </div>
            <p className="text-xl font-bold text-emerald-400">
              {totalRevenue.toFixed(2)} €
            </p>
          </div>
          
          <div className="glass rounded-xl p-4">
            <div className="flex items-center gap-2 mb-1">
              <Calendar className="w-4 h-4 text-blue-400" />
              <span className="text-xs text-slate-400">Tickets</span>
            </div>
            <p className="text-xl font-bold text-white">{totalTickets}</p>
          </div>

          <div className="glass rounded-xl p-4">
            <div className="flex items-center gap-2 mb-1">
              <User className="w-4 h-4 text-purple-400" />
              <span className="text-xs text-slate-400">Panier moyen</span>
            </div>
            <p className="text-xl font-bold text-purple-400">
              {avgTicket.toFixed(2)} €
            </p>
          </div>
        </div>

        {/* Status Filter */}
        <div className="flex gap-2 mb-6">
          <button
            onClick={() => setStatusFilter('all')}
            className={`px-4 py-2 rounded-xl text-sm font-medium transition-all ${
              statusFilter === 'all' 
                ? 'gradient-primary text-white' 
                : 'glass text-slate-300 hover:bg-white/10'
            }`}
          >
            Tous ({tickets.length})
          </button>
          <button
            onClick={() => setStatusFilter('open')}
            className={`px-4 py-2 rounded-xl text-sm font-medium transition-all ${
              statusFilter === 'open' 
                ? 'gradient-primary text-white' 
                : 'glass text-slate-300 hover:bg-white/10'
            }`}
          >
            En cours ({tickets.filter(t => t.status === 'OPEN' || t.status === 'DRAFT').length})
          </button>
          <button
            onClick={() => setStatusFilter('paid')}
            className={`px-4 py-2 rounded-xl text-sm font-medium transition-all ${
              statusFilter === 'paid' 
                ? 'gradient-primary text-white' 
                : 'glass text-slate-300 hover:bg-white/10'
            }`}
          >
            Payés ({tickets.filter(t => t.status === 'PAID').length})
          </button>
        </div>

        {/* Tickets List */}
        <div className="space-y-3">
          {tickets.length === 0 ? (
            <div className="text-center py-12 text-slate-500">
              <Calendar className="w-16 h-16 mx-auto mb-4 opacity-30" />
              <p className="text-lg">Aucun ticket trouvé</p>
            </div>
          ) : (
            tickets.map(ticket => {
              const table = state.tables.find(t => t.id === ticket.tableId);
              return (
                <motion.div
                  key={ticket.id}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="glass rounded-xl p-4 hover:bg-white/5 transition-colors cursor-pointer"
                  onClick={() => onViewTicket(ticket)}
                >
                  <div className="flex items-start justify-between mb-3">
                    <div>
                      <div className="flex items-center gap-2 mb-1">
                        <p className="text-lg font-bold text-white">
                          Ticket #{ticket.id.slice(0, 8)}
                        </p>
                        <span className={`px-2 py-0.5 rounded-lg text-xs font-bold ${
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
                      <div className="flex items-center gap-3 text-sm text-slate-400">
                        <span className="flex items-center gap-1">
                          <Clock className="w-3 h-3" />
                          {new Date(ticket.createdAt).toLocaleDateString('fr-FR')} à{' '}
                          {new Date(ticket.createdAt).toLocaleTimeString('fr-FR', { 
                            hour: '2-digit', 
                            minute: '2-digit' 
                          })}
                        </span>
                        {filterType === 'table' && (
                          <span className="flex items-center gap-1">
                            <User className="w-3 h-3" />
                            {ticket.serverName}
                          </span>
                        )}
                        {filterType === 'server' && (
                          <span>{table?.name}</span>
                        )}
                      </div>
                    </div>
                    <div className="text-right">
                      <p className="text-xl font-bold text-emerald-400">
                        {ticket.totalAmount.toFixed(2)} €
                      </p>
                      <p className="text-xs text-slate-400">
                        {ticket.items.length} article{ticket.items.length > 1 ? 's' : ''}
                      </p>
                    </div>
                  </div>

                  {/* Payment Info */}
                  {ticket.payments.length > 0 && (
                    <div className="flex items-center gap-2 pt-3 border-t border-white/10">
                      {ticket.payments.map(payment => (
                        <div key={payment.id} className="flex items-center gap-1 text-xs">
                          {payment.method === 'CASH' ? (
                            <Banknote className="w-3 h-3 text-emerald-400" />
                          ) : (
                            <CreditCard className="w-3 h-3 text-blue-400" />
                          )}
                          <span className="text-slate-400">
                            {payment.amount.toFixed(2)} €
                          </span>
                        </div>
                      ))}
                      {ticket.totalAmount - ticket.paidAmount > 0 && (
                        <div className="flex items-center gap-1 text-xs ml-auto">
                          <span className="text-orange-400">
                            Reste: {(ticket.totalAmount - ticket.paidAmount).toFixed(2)} €
                          </span>
                        </div>
                      )}
                    </div>
                  )}
                </motion.div>
              );
            })
          )}
        </div>
      </motion.div>
    </motion.div>
  );
}
