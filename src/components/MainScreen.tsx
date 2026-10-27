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
    <div className="h-screen flex flex-col gradient-dark">
      {/* Header */}
      <header className="h-16 glass border-b border-white/10 flex items-center justify-between px-4 md:px-6 shrink-0 shadow-lg">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl gradient-primary flex items-center justify-center shadow-lg animate-glow">
            <DollarSign className="w-5 h-5 text-white" />
          </div>
          <div>
            <h1 className="text-base md:text-lg font-bold text-white">Caisse Principale</h1>
            <p className="text-xs text-slate-400 hidden sm:block">Vue globale temps réel</p>
          </div>
        </div>
        <div className="flex items-center gap-3 md:gap-4">
          <div className="hidden md:flex items-center gap-4">
            <div className="text-center glass-card px-3 py-2 rounded-lg">
              <p className="text-xs text-slate-400">CA Jour</p>
              <p className="text-sm font-bold text-emerald-400">{totalRevenue.toFixed(2)} €</p>
            </div>
            <div className="text-center glass-card px-3 py-2 rounded-lg">
              <p className="text-xs text-slate-400">Fonds</p>
              <p className="text-sm font-bold text-amber-400">{state.cashBalance.toFixed(2)} €</p>
            </div>
          </div>
          <div className="text-right glass-card px-3 py-2 rounded-lg">
            <p className="text-lg md:text-xl font-mono font-bold text-white">
              {currentTime.toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' })}
            </p>
          </div>
          <motion.button 
            whileHover={{ scale: 1.1 }}
            whileTap={{ scale: 0.9 }}
            onClick={() => dispatch({ type: 'LOGOUT' })} 
            className="p-2 text-slate-400 hover:text-white touch-target"
          >
            <LogOut className="w-5 h-5" />
          </motion.button>
        </div>
      </header>

      {/* Filtres */}
      <div className="px-4 py-3 border-b border-white/10 flex gap-2 shrink-0 overflow-x-auto scrollbar-hide">
        {[
          { id: 'all', label: 'Toutes', count: state.tables.filter(t => t.status !== 'FREE').length },
          { id: 'occupied', label: '🔴 Occupées', count: state.tables.filter(t => t.status === 'OCCUPIED').length },
          { id: 'partial', label: '🟠 Paiement partiel', count: state.tables.filter(t => t.status === 'PARTIALLY_PAID').length },
        ].map(f => (
          <motion.button 
            key={f.id} 
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            onClick={() => setFilter(f.id as typeof filter)}
            className={`px-4 py-2 rounded-xl text-sm font-medium transition-all flex items-center gap-2 whitespace-nowrap touch-target ${
              filter === f.id ? 'gradient-primary text-white shadow-lg' : 'glass text-slate-300 hover:bg-white/10'
            }`}>
            {f.label}
            <span className={`px-2 py-0.5 rounded-full text-xs font-bold ${filter === f.id ? 'bg-white/20' : 'bg-slate-700/50'}`}>
              {f.count}
            </span>
          </motion.button>
        ))}
      </div>

      {/* Tables Grid */}
      <div className="flex-1 overflow-y-auto p-4 md:p-6 container-responsive">
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-3 md:gap-4">
          {filteredTables.map((table, index) => {
            const colors = getTableColors(table.status);
            const tickets = state.tickets.filter(t => table.ticketIds.includes(t.id) && (t.status === 'OPEN' || t.status === 'DRAFT'));
            
            return (
              <motion.div 
                key={table.id} 
                layout
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ delay: index * 0.05 }}
                whileHover={{ scale: 1.05, y: -5 }}
                className={`rounded-2xl border-2 ${colors.bg} p-4 flex flex-col items-center justify-center gap-2 relative hover-lift touch-target min-h-[140px]`}
              >
                <span className="text-2xl md:text-3xl font-bold text-white">{table.name}</span>
                <span className="text-xs text-slate-400">{table.seats} places</span>
                {table.status !== 'FREE' && (
                  <>
                    <p className={`text-base md:text-lg font-bold ${colors.text}`}>{table.totalToPay.toFixed(2)} €</p>
                    {table.totalPaid > 0 && (
                      <p className="text-xs text-green-400">{table.totalPaid.toFixed(2)} € payés</p>
                    )}
                  </>
                )}
                <span className={`text-xs font-medium px-3 py-1 rounded-full ${colors.bg} ${colors.text} border ${colors.border}`}>
                  {getTableStatusLabel(table.status)}
                </span>
                {tickets.length > 0 && (
                  <motion.div 
                    initial={{ scale: 0 }}
                    animate={{ scale: 1 }}
                    className="absolute top-2 right-2 text-xs glass px-2 py-1 rounded-lg text-white font-bold"
                  >
                    {tickets.reduce((sum, t) => sum + t.items.length, 0)} art.
                  </motion.div>
                )}
              </motion.div>
            );
          })}
        </div>
      </div>

      {/* Légende */}
      <div className="p-3 md:p-4 border-t border-white/10 glass flex items-center justify-center gap-3 md:gap-6 shrink-0 flex-wrap">
        <div className="flex items-center gap-2 text-xs md:text-sm">
          <div className="w-4 h-4 rounded-full bg-emerald-500 shadow-lg shadow-emerald-500/50" />
          <span className="text-slate-300">Libre</span>
        </div>
        <div className="flex items-center gap-2 text-xs md:text-sm">
          <div className="w-4 h-4 rounded-full bg-red-500 shadow-lg shadow-red-500/50" />
          <span className="text-slate-300">Occupée</span>
        </div>
        <div className="flex items-center gap-2 text-xs md:text-sm">
          <div className="w-4 h-4 rounded-full bg-orange-500 shadow-lg shadow-orange-500/50" />
          <span className="text-slate-300">Partiel</span>
        </div>
        <div className="flex items-center gap-2 text-xs md:text-sm">
          <div className="w-4 h-4 rounded-full bg-blue-500 shadow-lg shadow-blue-500/50" />
          <span className="text-slate-300">Réservée</span>
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
