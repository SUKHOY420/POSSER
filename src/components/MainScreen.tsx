import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Clock, Users, DollarSign, LogOut, ChefHat, AlertCircle, CheckCircle2, Timer, Settings, Lock, Eye, History, CreditCard, FileText, Power } from 'lucide-react';
import { usePOS } from '../store';
import { Ticket } from '../types';
import TicketDetailModal from './TicketDetailModal';
import TicketHistoryModal from './TicketHistoryModal';
import EmergencyPaymentModal from './EmergencyPaymentModal';
import ReportPrinterModal from './ReportPrinterModal';
import CloseSessionModal from './CloseSessionModal';

export default function MainScreen() {
  const { state, dispatch } = usePOS();
  const [currentTime, setCurrentTime] = useState(new Date());
  const [filter, setFilter] = useState<'all' | 'occupied' | 'partial'>('all');
  const [showAdminLogin, setShowAdminLogin] = useState(false);
  const [adminPassword, setAdminPassword] = useState('');
  const [passwordError, setPasswordError] = useState(false);
  const [lastSaved, setLastSaved] = useState<Date | null>(null);
  
  // Nouveaux états pour les modals
  const [selectedTicket, setSelectedTicket] = useState<Ticket | null>(null);
  const [showHistory, setShowHistory] = useState<{ type: 'table' | 'server'; id: string; name: string } | null>(null);
  const [emergencyTicket, setEmergencyTicket] = useState<Ticket | null>(null);
  const [showReportPrinter, setShowReportPrinter] = useState(false);
  const [showCloseSession, setShowCloseSession] = useState(false);

  useEffect(() => {
    const timer = setInterval(() => setCurrentTime(new Date()), 1000);
    return () => clearInterval(timer);
  }, []);

  // Vérifier la dernière sauvegarde
  useEffect(() => {
    const checkSave = () => {
      const saved = localStorage.getItem('quickpos-state');
      if (saved) {
        setLastSaved(new Date());
      }
    };
    checkSave();
    const interval = setInterval(checkSave, 5000);
    return () => clearInterval(interval);
  }, []);

  const openTickets = state.tickets.filter(t => t.status === 'OPEN' || t.status === 'DRAFT');
  const totalRevenue = state.tickets.filter(t => t.status === 'PAID').reduce((sum, t) => sum + t.paidAmount, 0);

  const filteredTables = state.tables.filter(t => {
    if (filter === 'all') return true;
    if (filter === 'occupied') return t.status === 'OCCUPIED';
    if (filter === 'partial') return t.status === 'PARTIALLY_PAID';
    return true;
  });

  const handleAdminLogin = () => {
    const adminServer = state.servers.find(s => s.role === 'admin');
    if (adminServer && adminPassword === adminServer.pin) {
      setShowAdminLogin(false);
      setAdminPassword('');
      setPasswordError(false);
      dispatch({ type: 'SET_SCREEN', payload: 'admin' });
    } else {
      setPasswordError(true);
      setTimeout(() => {
        setPasswordError(false);
        setAdminPassword('');
      }, 1500);
    }
  };

  return (
    <div className="h-screen-safe w-screen flex flex-col gradient-dark overflow-hidden">
      {/* Header */}
      <header className="h-16 glass border-b border-white/10 flex items-center justify-between px-4 md:px-6 shrink-0 shadow-lg overflow-hidden">
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
            {lastSaved && (
              <p className="text-[10px] text-slate-400">
                Sauvegardé à {lastSaved.toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' })}
              </p>
            )}
          </div>
          <motion.button 
            whileHover={{ scale: 1.1 }}
            whileTap={{ scale: 0.9 }}
            onClick={() => setShowReportPrinter(true)}
            className="p-2 text-slate-400 hover:text-blue-400 touch-target transition-colors"
            title="Imprimer rapport"
          >
            <FileText className="w-5 h-5" />
          </motion.button>
          <motion.button 
            whileHover={{ scale: 1.1 }}
            whileTap={{ scale: 0.9 }}
            onClick={() => setShowCloseSession(true)}
            className="p-2 text-slate-400 hover:text-red-400 touch-target transition-colors"
            title="Clôturer la session"
          >
            <Power className="w-5 h-5" />
          </motion.button>
          <motion.button 
            whileHover={{ scale: 1.1 }}
            whileTap={{ scale: 0.9 }}
            onClick={() => setShowAdminLogin(true)}
            className="p-2 text-slate-400 hover:text-purple-400 touch-target transition-colors"
            title="Accès administrateur"
          >
            <Settings className="w-5 h-5" />
          </motion.button>
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

      {/* Admin Login Modal */}
      <AnimatePresence>
        {showAdminLogin && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4"
            onClick={() => setShowAdminLogin(false)}
          >
            <motion.div
              initial={{ scale: 0.9, y: 20 }}
              animate={{ scale: 1, y: 0 }}
              exit={{ scale: 0.9, y: 20 }}
              className="glass-card rounded-2xl p-6 w-full max-w-sm"
              onClick={e => e.stopPropagation()}
            >
              <div className="text-center mb-6">
                <div className="w-16 h-16 mx-auto rounded-full bg-gradient-to-br from-purple-500 to-purple-700 flex items-center justify-center mb-4">
                  <Lock className="w-8 h-8 text-white" />
                </div>
                <h2 className="text-2xl font-bold text-white mb-2">Accès Administrateur</h2>
                <p className="text-slate-400 text-sm">Entrez le mot de passe administrateur</p>
              </div>

              <div className="space-y-4">
                <div>
                  <input
                    type="password"
                    value={adminPassword}
                    onChange={e => setAdminPassword(e.target.value)}
                    onKeyDown={e => e.key === 'Enter' && handleAdminLogin()}
                    placeholder="Mot de passe"
                    className={`w-full px-4 py-3 glass rounded-xl text-white text-center text-lg font-mono tracking-wider focus:outline-none focus:ring-2 transition-all ${
                      passwordError ? 'ring-2 ring-red-500' : 'focus:ring-purple-500'
                    }`}
                    autoFocus
                  />
                  {passwordError && (
                    <motion.p
                      initial={{ opacity: 0, y: -10 }}
                      animate={{ opacity: 1, y: 0 }}
                      className="text-red-400 text-sm text-center mt-2"
                    >
                      Mot de passe incorrect
                    </motion.p>
                  )}
                </div>

                <div className="flex gap-3">
                  <button
                    onClick={() => {
                      setShowAdminLogin(false);
                      setAdminPassword('');
                      setPasswordError(false);
                    }}
                    className="flex-1 py-3 bg-slate-700 hover:bg-slate-600 text-white rounded-xl font-medium transition-colors"
                  >
                    Annuler
                  </button>
                  <button
                    onClick={handleAdminLogin}
                    disabled={!adminPassword}
                    className="flex-1 py-3 bg-gradient-to-r from-purple-500 to-purple-600 hover:from-purple-600 hover:to-purple-700 disabled:from-slate-600 disabled:to-slate-700 text-white rounded-xl font-bold transition-all"
                  >
                    Connexion
                  </button>
                </div>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

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
            const allTableTickets = state.tickets.filter(t => table.ticketIds.includes(t.id));
            
            return (
              <motion.div 
                key={table.id} 
                layout
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ delay: index * 0.05 }}
                whileHover={{ scale: 1.05, y: -5 }}
                className={`rounded-2xl border-2 ${colors.bg} p-4 flex flex-col items-center justify-center gap-2 relative hover-lift touch-target min-h-[180px]`}
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
                
                {/* Action Buttons - Only for occupied tables */}
                {table.status !== 'FREE' && (
                  <div className="absolute bottom-2 left-2 right-2 flex gap-1">
                    {tickets.length > 0 && (
                      <>
                        <motion.button
                          whileHover={{ scale: 1.1 }}
                          whileTap={{ scale: 0.9 }}
                          onClick={(e) => {
                            e.stopPropagation();
                            setSelectedTicket(tickets[0]);
                          }}
                          className="flex-1 p-1.5 glass rounded-lg text-white hover:bg-white/20 transition-colors"
                          title="Voir le ticket"
                        >
                          <Eye className="w-3 h-3 mx-auto" />
                        </motion.button>
                        <motion.button
                          whileHover={{ scale: 1.1 }}
                          whileTap={{ scale: 0.9 }}
                          onClick={(e) => {
                            e.stopPropagation();
                            setEmergencyTicket(tickets[0]);
                          }}
                          className="flex-1 p-1.5 bg-orange-500/20 border border-orange-500/30 rounded-lg text-orange-400 hover:bg-orange-500/30 transition-colors"
                          title="Encaisser d'urgence"
                        >
                          <CreditCard className="w-3 h-3 mx-auto" />
                        </motion.button>
                      </>
                    )}
                    <motion.button
                      whileHover={{ scale: 1.1 }}
                      whileTap={{ scale: 0.9 }}
                      onClick={(e) => {
                        e.stopPropagation();
                        setShowHistory({ type: 'table', id: table.id, name: table.name });
                      }}
                      className="flex-1 p-1.5 glass rounded-lg text-white hover:bg-white/20 transition-colors"
                      title="Historique de la table"
                    >
                      <History className="w-3 h-3 mx-auto" />
                    </motion.button>
                  </div>
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

      {/* Ticket Detail Modal */}
      <AnimatePresence>
        {selectedTicket && (
          <TicketDetailModal
            ticket={selectedTicket}
            onClose={() => setSelectedTicket(null)}
          />
        )}
      </AnimatePresence>

      {/* Ticket History Modal */}
      <AnimatePresence>
        {showHistory && (
          <TicketHistoryModal
            filterType={showHistory.type}
            filterId={showHistory.id}
            filterName={showHistory.name}
            onClose={() => setShowHistory(null)}
            onViewTicket={(ticket) => {
              setShowHistory(null);
              setSelectedTicket(ticket);
            }}
          />
        )}
      </AnimatePresence>

      {/* Emergency Payment Modal */}
      <AnimatePresence>
        {emergencyTicket && (
          <EmergencyPaymentModal
            ticket={emergencyTicket}
            onClose={() => setEmergencyTicket(null)}
          />
        )}
      </AnimatePresence>

      {/* Report Printer Modal */}
      <AnimatePresence>
        {showReportPrinter && (
          <ReportPrinterModal onClose={() => setShowReportPrinter(false)} />
        )}
      </AnimatePresence>

      {/* Close Session Modal */}
      <AnimatePresence>
        {showCloseSession && (
          <CloseSessionModal onClose={() => setShowCloseSession(false)} />
        )}
      </AnimatePresence>
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
