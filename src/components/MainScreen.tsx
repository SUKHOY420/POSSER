import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Clock, Users, DollarSign, LogOut, ChefHat, AlertCircle, CheckCircle2, Timer } from 'lucide-react';
import { usePOS } from '../store';

export default function MainScreen() {
  const { state, dispatch } = usePOS();
  const [currentTime, setCurrentTime] = useState(new Date());
  const [filter, setFilter] = useState<'all' | 'occupied' | 'partial'>('all');

  useEffect(() => {
    const timer = setInterval(() => setCurrentTime(new Date()), 1000);
    return () => clearInterval(timer);
  }, []);

  const openTickets = state.tickets.filter(t => t.status === 'OPEN' || t.status === 'DRAFT');
  const totalRevenue = state.tickets.filter(t => t.status === 'PAID').reduce((sum, t) => sum + t.paidAmount, 0);

  const filteredTables = state.tables.filter(t => {
    if (filter === 'all') return true;
    if (filter === 'occupied') return t.status === 'OCCUPIED';
    if (filter === 'partial') return t.status === 'PARTIALLY_PAID';
    return true;
  });

  return (
    <div className="h-screen flex flex-col bg-slate-900">
      {/* Header */}
      <header className="h-16 bg-slate-800/90 border-b border-slate-700/50 flex items-center justify-between px-4 md:px-6 shrink-0">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center">
            <DollarSign className="w-4 h-4 text-white" />
          </div>
          <div>
            <h1 className="text-sm font-bold text-white">Caisse Principale</h1>
            <p className="text-[10px] text-slate-400">Vue globale temps réel</p>
          </div>
        </div>
        <div className="flex items-center gap-4">
          <div className="hidden md:flex items-center gap-4">
            <div className="text-center">
              <p className="text-xs text-slate-400">CA Jour</p>
              <p className="text-sm font-bold text-emerald-400">{totalRevenue.toFixed(2)} €</p>
            </div>
            <div className="text-center">
              <p className="text-xs text-slate-400">Fonds</p>
              <p className="text-sm font-bold text-amber-400">{state.cashBalance.toFixed(2)} €</p>
            </div>
          </div>
          <div className="text-right">
            <p className="text-lg font-mono font-bold text-white">
              {currentTime.toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' })}
            </p>
          </div>
          <button onClick={() => dispatch({ type: 'LOGOUT' })} className="p-2 text-slate-400 hover:text-white">
            <LogOut className="w-5 h-5" />
          </button>
        </div>
      </header>

      {/* Filtres */}
      <div className="px-4 py-3 border-b border-slate-700/50 flex gap-2 shrink-0">
        {[
          { id: 'all', label: 'Toutes', count: state.tables.filter(t => t.status !== 'FREE').length },
          { id: 'occupied', label: '🔴 Occupées', count: state.tables.filter(t => t.status === 'OCCUPIED').length },
          { id: 'partial', label: '🟠 Paiement partiel', count: state.tables.filter(t => t.status === 'PARTIALLY_PAID').length },
        ].map(f => (
          <button key={f.id} onClick={() => setFilter(f.id as typeof filter)}
            className={`px-4 py-2 rounded-xl text-sm font-medium transition-colors flex items-center gap-2 ${
              filter === f.id ? 'bg-blue-500 text-white' : 'bg-slate-800 text-slate-300 hover:bg-slate-700'
            }`}>
            {f.label}
            <span className={`px-1.5 py-0.5 rounded-full text-xs ${filter === f.id ? 'bg-white/20' : 'bg-slate-700'}`}>
              {f.count}
            </span>
          </button>
        ))}
      </div>

      {/* Tables Grid */}
      <div className="flex-1 overflow-y-auto p-4 md:p-6">
        <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-3">
          {filteredTables.map(table => {
            const colors = getTableColors(table.status);
            const tickets = state.tickets.filter(t => table.ticketIds.includes(t.id) && (t.status === 'OPEN' || t.status === 'DRAFT'));
            
            return (
              <motion.div key={table.id} layout
                className={`rounded-2xl border-2 bg-gradient-to-br ${colors.bg} ${colors.border} p-4 flex flex-col items-center justify-center gap-1 relative`}>
                <span className="text-2xl font-bold text-white">{table.name}</span>
                <span className="text-xs text-slate-400">{table.seats}p</span>
                {table.status !== 'FREE' && (
                  <>
                    <p className={`text-sm font-bold ${colors.text}`}>{table.totalToPay.toFixed(2)} €</p>
                    {table.totalPaid > 0 && (
                      <p className="text-xs text-green-400">{table.totalPaid.toFixed(2)} € payés</p>
                    )}
                  </>
                )}
                <span className={`text-[10px] font-medium px-2 py-0.5 rounded-full ${colors.bg} ${colors.text} border ${colors.border}`}>
                  {getTableStatusLabel(table.status)}
                </span>
                {tickets.length > 0 && (
                  <div className="absolute top-1 right-1 text-[10px] bg-slate-700/80 px-1.5 py-0.5 rounded text-slate-300">
                    {tickets.reduce((sum, t) => sum + t.items.length, 0)} art.
                  </div>
                )}
              </motion.div>
            );
          })}
        </div>
      </div>

      {/* Légende */}
      <div className="p-3 border-t border-slate-700/50 flex items-center justify-center gap-4 shrink-0">
        <div className="flex items-center gap-1.5 text-xs">
          <div className="w-3 h-3 rounded-full bg-emerald-500" />
          <span className="text-slate-400">Libre</span>
        </div>
        <div className="flex items-center gap-1.5 text-xs">
          <div className="w-3 h-3 rounded-full bg-red-500" />
          <span className="text-slate-400">Occupée</span>
        </div>
        <div className="flex items-center gap-1.5 text-xs">
          <div className="w-3 h-3 rounded-full bg-orange-500" />
          <span className="text-slate-400">Partiel</span>
        </div>
        <div className="flex items-center gap-1.5 text-xs">
          <div className="w-3 h-3 rounded-full bg-blue-500" />
          <span className="text-slate-400">Réservée</span>
        </div>
      </div>
    </div>
  );
}

function getTableColors(status: string) {
  switch (status) {
    case 'FREE':
      return { bg: 'from-emerald-500/20 to-emerald-600/10', border: 'border-emerald-500/50', text: 'text-emerald-400' };
    case 'OCCUPIED':
      return { bg: 'from-red-500/20 to-red-600/10', border: 'border-red-500/50', text: 'text-red-400' };
    case 'PARTIALLY_PAID':
      return { bg: 'from-orange-500/20 to-orange-600/10', border: 'border-orange-500/50', text: 'text-orange-400' };
    case 'RESERVED':
      return { bg: 'from-blue-500/20 to-blue-600/10', border: 'border-blue-500/50', text: 'text-blue-400' };
    case 'CLEANING':
      return { bg: 'from-cyan-500/20 to-cyan-600/10', border: 'border-cyan-500/50', text: 'text-cyan-400' };
    default:
      return { bg: 'from-slate-500/20 to-slate-600/10', border: 'border-slate-500/50', text: 'text-slate-400' };
  }
}

function getTableStatusLabel(status: string) {
  switch (status) {
    case 'FREE': return 'Libre';
    case 'OCCUPIED': return 'Occupée';
    case 'PARTIALLY_PAID': return 'Partiel';
    case 'RESERVED': return 'Réservée';
    case 'CLEANING': return 'Nettoyage';
    default: return status;
  }
}
