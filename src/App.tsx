import { usePOS, POSProvider } from './store';
import { LayoutDashboard, Grid3X3, Receipt, BarChart3, Settings as SettingsIcon, Menu, X, Wifi, WifiOff } from 'lucide-react';
import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import Dashboard from './components/Dashboard';
import FloorPlan from './components/FloorPlan';
import OrderScreen from './components/OrderScreen';
import Reports from './components/Reports';
import Settings from './components/Settings';

function AppContent() {
  const { state, dispatch } = usePOS();
  const [showMobileMenu, setShowMobileMenu] = useState(false);
  const [currentTime, setCurrentTime] = useState(new Date());
  const [isOnline, setIsOnline] = useState(true);

  useEffect(() => {
    const timer = setInterval(() => setCurrentTime(new Date()), 1000);
    return () => clearInterval(timer);
  }, []);

  useEffect(() => {
    const handleOnline = () => setIsOnline(true);
    const handleOffline = () => setIsOnline(false);
    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);
    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, []);

  const navItems = [
    { id: 'dashboard' as const, label: 'Accueil', icon: LayoutDashboard },
    { id: 'floor' as const, label: 'Salle', icon: Grid3X3 },
    { id: 'reports' as const, label: 'Rapports', icon: BarChart3 },
    { id: 'settings' as const, label: 'Config', icon: SettingsIcon },
  ];

  const renderView = () => {
    switch (state.currentView) {
      case 'dashboard': return <Dashboard />;
      case 'floor': return <FloorPlan />;
      case 'order': return <OrderScreen />;
      case 'reports': return <Reports />;
      case 'settings': return <Settings />;
      default: return <Dashboard />;
    }
  };

  const showSidebar = state.currentView !== 'order';

  return (
    <div className="h-screen w-screen flex flex-col bg-slate-900 overflow-hidden">
      {/* Top Bar */}
      <header className="h-14 md:h-16 bg-slate-800/80 backdrop-blur-xl border-b border-slate-700/50 flex items-center justify-between px-4 md:px-6 z-40 shrink-0">
        <div className="flex items-center gap-3">
          {/* Mobile menu button */}
          <button
            onClick={() => setShowMobileMenu(!showMobileMenu)}
            className="md:hidden p-2 text-slate-400 hover:text-white"
          >
            {showMobileMenu ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
          </button>
          
          {/* Logo */}
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center">
              <Receipt className="w-4 h-4 text-white" />
            </div>
            <div className="hidden sm:block">
              <h1 className="text-sm font-bold text-white leading-tight">QuickPOS</h1>
              <p className="text-[10px] text-slate-400 leading-tight">Caisse Pro</p>
            </div>
          </div>
        </div>

        {/* Desktop Nav */}
        <nav className="hidden md:flex items-center gap-1">
          {navItems.map(item => (
            <button
              key={item.id}
              onClick={() => dispatch({ type: 'SET_VIEW', payload: item.id })}
              className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-all ${
                state.currentView === item.id
                  ? 'bg-blue-500/20 text-blue-400'
                  : 'text-slate-400 hover:text-white hover:bg-slate-700/50'
              }`}
            >
              <item.icon className="w-4 h-4" />
              {item.label}
            </button>
          ))}
        </nav>

        {/* Right section */}
        <div className="flex items-center gap-3">
          {/* Connection Status */}
          <div className={`flex items-center gap-1.5 px-2 py-1 rounded-full text-xs ${
            isOnline ? 'bg-emerald-500/10 text-emerald-400' : 'bg-red-500/10 text-red-400'
          }`}>
            {isOnline ? <Wifi className="w-3 h-3" /> : <WifiOff className="w-3 h-3" />}
            <span className="hidden sm:inline">{isOnline ? 'En ligne' : 'Hors-ligne'}</span>
          </div>

          {/* Time */}
          <div className="hidden lg:block text-right">
            <p className="text-sm font-medium text-white">
              {currentTime.toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' })}
            </p>
          </div>

          {/* Server */}
          <div className="hidden sm:flex items-center gap-2 px-3 py-1.5 bg-slate-700/50 rounded-lg">
            <div className="w-6 h-6 rounded-full bg-gradient-to-br from-blue-500 to-purple-500 flex items-center justify-center text-white text-xs font-bold">
              {state.server[0]}
            </div>
            <span className="text-xs text-slate-300">{state.server}</span>
          </div>
        </div>
      </header>

      {/* Main Content Area */}
      <div className="flex-1 flex overflow-hidden">
        {/* Sidebar - Desktop */}
        {showSidebar && (
          <aside className="hidden md:flex w-16 lg:w-56 bg-slate-800/50 border-r border-slate-700/50 flex-col shrink-0">
            <nav className="flex-1 p-2 space-y-1">
              {navItems.map(item => (
                <button
                  key={item.id}
                  onClick={() => dispatch({ type: 'SET_VIEW', payload: item.id })}
                  className={`w-full flex items-center gap-3 px-3 py-3 rounded-xl text-sm font-medium transition-all ${
                    state.currentView === item.id
                      ? 'bg-blue-500/20 text-blue-400'
                      : 'text-slate-400 hover:text-white hover:bg-slate-700/50'
                  }`}
                >
                  <item.icon className="w-5 h-5 shrink-0" />
                  <span className="hidden lg:inline">{item.label}</span>
                </button>
              ))}
            </nav>

            {/* Sidebar footer */}
            <div className="p-3 border-t border-slate-700/50">
              <div className="hidden lg:block p-3 bg-slate-700/30 rounded-xl">
                <p className="text-xs text-slate-400">Fonds de caisse</p>
                <p className="text-lg font-bold text-emerald-400">{state.cashBalance.toFixed(2)} €</p>
              </div>
            </div>
          </aside>
        )}

        {/* Main View */}
        <main className="flex-1 overflow-hidden">
          <AnimatePresence mode="wait">
            <motion.div
              key={state.currentView}
              initial={{ opacity: 0, y: 5 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -5 }}
              transition={{ duration: 0.2 }}
              className="h-full"
            >
              {renderView()}
            </motion.div>
          </AnimatePresence>
        </main>
      </div>

      {/* Mobile Bottom Nav */}
      {showSidebar && (
        <nav className="md:hidden h-16 bg-slate-800/90 backdrop-blur-xl border-t border-slate-700/50 flex items-center justify-around shrink-0">
          {navItems.map(item => (
            <button
              key={item.id}
              onClick={() => dispatch({ type: 'SET_VIEW', payload: item.id })}
              className={`flex flex-col items-center gap-1 px-3 py-2 rounded-xl transition-all ${
                state.currentView === item.id
                  ? 'text-blue-400'
                  : 'text-slate-500'
              }`}
            >
              <item.icon className="w-5 h-5" />
              <span className="text-[10px] font-medium">{item.label}</span>
            </button>
          ))}
        </nav>
      )}

      {/* Mobile Menu Overlay */}
      <AnimatePresence>
        {showMobileMenu && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="md:hidden fixed inset-0 bg-black/60 z-30"
            onClick={() => setShowMobileMenu(false)}
          >
            <motion.div
              initial={{ x: -280 }}
              animate={{ x: 0 }}
              exit={{ x: -280 }}
              className="absolute left-0 top-14 bottom-0 w-64 bg-slate-800 border-r border-slate-700/50 p-4"
              onClick={e => e.stopPropagation()}
            >
              <nav className="space-y-2">
                {navItems.map(item => (
                  <button
                    key={item.id}
                    onClick={() => {
                      dispatch({ type: 'SET_VIEW', payload: item.id });
                      setShowMobileMenu(false);
                    }}
                    className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-medium transition-all ${
                      state.currentView === item.id
                        ? 'bg-blue-500/20 text-blue-400'
                        : 'text-slate-300 hover:bg-slate-700/50'
                    }`}
                  >
                    <item.icon className="w-5 h-5" />
                    {item.label}
                  </button>
                ))}
              </nav>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

export default function App() {
  return (
    <POSProvider>
      <AppContent />
    </POSProvider>
  );
}
