import { useState } from 'react';
import { motion } from 'framer-motion';
import { Monitor, ChefHat, Tablet, Settings, Lock, Wine, Wifi, WifiOff, Server as ServerIcon } from 'lucide-react';
import { usePOS } from '../store';
import { Server } from '../types';
import { useBackend } from '../hooks';

export default function ScreenSelect() {
  const { dispatch } = usePOS();
  const { isAvailable: isBackendConnected } = useBackend();
  const [step, setStep] = useState<'role' | 'server' | 'pin'>('role');
  const [selectedServer, setSelectedServer] = useState<Server | null>(null);
  const [pin, setPin] = useState('');
  const [pinError, setPinError] = useState(false);

  const handleRoleSelect = (role: 'main' | 'kitchen' | 'bar' | 'server' | 'admin') => {
    if (role === 'main') {
      dispatch({ type: 'LOGIN', payload: { id: 'admin', name: 'Admin', pin: '0000', color: '#10b981', role: 'admin' } });
      dispatch({ type: 'SET_SCREEN', payload: 'main' });
    } else if (role === 'kitchen') {
      dispatch({ type: 'SET_SCREEN', payload: 'kitchen' });
    } else if (role === 'bar') {
      dispatch({ type: 'SET_SCREEN', payload: 'bar' });
    } else if (role === 'admin') {
      setStep('server');
    } else {
      setStep('server');
    }
  };

  const handleServerSelect = (server: Server) => {
    setSelectedServer(server);
    setStep('pin');
    setPin('');
    setPinError(false);
  };

  const handlePinDigit = (digit: string) => {
    if (pin.length >= 4) return;
    const newPin = pin + digit;
    setPin(newPin);
    if (newPin.length === 4 && selectedServer) {
      setTimeout(() => {
        if (newPin === selectedServer.pin) {
          dispatch({ type: 'LOGIN', payload: selectedServer });
          if (selectedServer.role === 'admin') {
            dispatch({ type: 'SET_SCREEN', payload: 'admin' });
          } else {
            dispatch({ type: 'SET_SCREEN', payload: 'server' });
          }
        } else {
          setPinError(true);
          setTimeout(() => { setPinError(false); setPin(''); }, 1500);
        }
      }, 200);
    }
  };

  return (
    <div className="h-screen w-screen gradient-dark flex items-center justify-center p-4 container-responsive">
      <div className="w-full max-w-lg">
        <motion.div initial={{ opacity: 0, y: -20 }} animate={{ opacity: 1, y: 0 }} className="text-center mb-8">
          <div className="w-20 h-20 mx-auto rounded-2xl gradient-primary flex items-center justify-center mb-4 shadow-2xl animate-glow">
            <Monitor className="w-10 h-10 text-white" />
          </div>
          <h1 className="text-4xl font-bold text-white mb-2">QuickPOS Pro</h1>
          <p className="text-slate-400 text-lg">Système de caisse professionnel</p>
          <p className="text-sm text-slate-500 mt-3">
            💡 Ouvrez cette page dans plusieurs onglets pour tester la synchronisation temps réel
          </p>
          
          {/* Backend Status Indicator */}
          <div className="mt-4 flex items-center justify-center gap-2">
            {isBackendConnected === null ? (
              <div className="flex items-center gap-2 px-3 py-1.5 rounded-full bg-slate-700/50 border border-slate-600/30">
                <div className="w-2 h-2 rounded-full bg-amber-400 animate-pulse" />
                <span className="text-xs text-slate-400">Connexion au serveur...</span>
              </div>
            ) : isBackendConnected ? (
              <div className="flex items-center gap-2 px-3 py-1.5 rounded-full bg-emerald-500/10 border border-emerald-500/30">
                <Wifi className="w-3 h-3 text-emerald-400" />
                <span className="text-xs text-emerald-400">Backend connecté</span>
              </div>
            ) : (
              <div className="flex items-center gap-2 px-3 py-1.5 rounded-full bg-amber-500/10 border border-amber-500/30">
                <WifiOff className="w-3 h-3 text-amber-400" />
                <span className="text-xs text-amber-400">Mode démo (localStorage)</span>
              </div>
            )}
          </div>
        </motion.div>

        {step === 'role' && (
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="space-y-4">
            <button onClick={() => handleRoleSelect('main')}
              className="w-full p-6 glass-card rounded-2xl hover-lift group flex items-center gap-5 touch-target">
              <div className="w-16 h-16 rounded-xl gradient-primary flex items-center justify-center shrink-0 group-hover:scale-110 transition-transform shadow-lg">
                <Monitor className="w-8 h-8 text-white" />
              </div>
              <div className="text-left flex-1">
                <p className="text-xl font-bold text-white mb-1">Caisse Principale</p>
                <p className="text-sm text-slate-400">Vue globale temps réel</p>
              </div>
            </button>
            <button onClick={() => handleRoleSelect('kitchen')}
              className="w-full p-6 glass-card rounded-2xl hover-lift group flex items-center gap-5 touch-target">
              <div className="w-16 h-16 rounded-xl gradient-warning flex items-center justify-center shrink-0 group-hover:scale-110 transition-transform shadow-lg">
                <ChefHat className="w-8 h-8 text-white" />
              </div>
              <div className="text-left flex-1">
                <p className="text-xl font-bold text-white mb-1">Écran Cuisine</p>
                <p className="text-sm text-slate-400">KDS - Commandes à préparer</p>
              </div>
            </button>
            <button onClick={() => handleRoleSelect('bar')}
              className="w-full p-6 glass-card rounded-2xl hover-lift group flex items-center gap-5 touch-target">
              <div className="w-16 h-16 rounded-xl bg-gradient-to-br from-purple-500 to-blue-600 flex items-center justify-center shrink-0 group-hover:scale-110 transition-transform shadow-lg">
                <Wine className="w-8 h-8 text-white" />
              </div>
              <div className="text-left flex-1">
                <p className="text-xl font-bold text-white mb-1">Écran Bar</p>
                <p className="text-sm text-slate-400">Commandes de boissons</p>
              </div>
            </button>
            <button onClick={() => handleRoleSelect('server')}
              className="w-full p-6 glass-card rounded-2xl hover-lift group flex items-center gap-5 touch-target">
              <div className="w-16 h-16 rounded-xl gradient-success flex items-center justify-center shrink-0 group-hover:scale-110 transition-transform shadow-lg">
                <Tablet className="w-8 h-8 text-white" />
              </div>
              <div className="text-left flex-1">
                <p className="text-xl font-bold text-white mb-1">Tablette Serveur</p>
                <p className="text-sm text-slate-400">Prendre des commandes</p>
              </div>
            </button>
            <button onClick={() => handleRoleSelect('admin')}
              className="w-full p-6 glass-card rounded-2xl hover-lift group flex items-center gap-5 touch-target">
              <div className="w-16 h-16 rounded-xl bg-gradient-to-br from-purple-500 to-purple-700 flex items-center justify-center shrink-0 group-hover:scale-110 transition-transform shadow-lg">
                <Settings className="w-8 h-8 text-white" />
              </div>
              <div className="text-left flex-1">
                <p className="text-xl font-bold text-white mb-1">Administration</p>
                <p className="text-sm text-slate-400">Gérer produits, tables, serveurs, rapports</p>
              </div>
            </button>
          </motion.div>
        )}

        {step === 'server' && (
          <motion.div initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }}>
            <button onClick={() => setStep('role')} className="text-slate-400 hover:text-white text-sm mb-4 flex items-center gap-1 hover-lift">
              ← Retour
            </button>
            <h2 className="text-2xl font-bold text-white mb-6">Choisissez votre profil</h2>
            <div className="grid grid-cols-2 gap-4">
              {usePOS().state.servers.map(server => (
                <motion.button key={server.id} onClick={() => handleServerSelect(server)}
                  whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}
                  className="p-5 glass-card rounded-2xl hover-lift flex flex-col items-center gap-3 touch-target">
                  <div className="w-14 h-14 rounded-full flex items-center justify-center text-white text-xl font-bold shadow-lg"
                    style={{ backgroundColor: server.color }}>
                    {server.name[0]}
                  </div>
                  <span className="text-white font-semibold text-lg">{server.name}</span>
                  <span className="text-xs text-slate-400 px-3 py-1 rounded-full bg-slate-700/50">
                    {server.role === 'admin' ? 'Admin' : 'Serveur'}
                  </span>
                </motion.button>
              ))}
            </div>
          </motion.div>
        )}

        {step === 'pin' && selectedServer && (
          <motion.div initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} className="text-center">
            <button onClick={() => { setStep('server'); setPin(''); }} className="text-slate-400 hover:text-white text-sm mb-4 flex items-center gap-1 hover-lift">
              ← Retour
            </button>
            <motion.div 
              animate={{ scale: pinError ? [1, 1.2, 1] : 1 }}
              transition={{ duration: 0.3 }}
              className="w-20 h-20 mx-auto rounded-full flex items-center justify-center text-white text-3xl font-bold mb-4 shadow-2xl"
              style={{ backgroundColor: selectedServer.color }}>
              {selectedServer.name[0]}
            </motion.div>
            <h2 className="text-2xl font-bold text-white mb-2">Bonjour {selectedServer.name}</h2>
            <p className="text-slate-400 mb-6">Entrez votre code PIN</p>
            <div className="flex justify-center gap-4 mb-8">
              {[0, 1, 2, 3].map(i => (
                <motion.div 
                  key={i}
                  animate={{ 
                    scale: i < pin.length ? 1.2 : 1,
                    backgroundColor: pinError ? '#ef4444' : i < pin.length ? '#10b981' : '#475569'
                  }}
                  transition={{ duration: 0.2 }}
                  className="w-5 h-5 rounded-full shadow-lg"
                />
              ))}
            </div>
            <div className="grid grid-cols-3 gap-3 max-w-[280px] mx-auto">
              {['1', '2', '3', '4', '5', '6', '7', '8', '9', '', '0', 'del'].map(key => (
                <motion.button key={key || 'empty'}
                  whileHover={{ scale: key ? 1.05 : 1 }}
                  whileTap={{ scale: key ? 0.95 : 1 }}
                  onClick={() => { if (key === 'del') setPin(pin.slice(0, -1)); else if (key) handlePinDigit(key); }}
                  disabled={!key}
                  className={`h-16 rounded-xl text-2xl font-bold transition-all touch-target ${
                    !key ? 'invisible' :
                    key === 'del' ? 'glass text-slate-300 hover:text-white' :
                    'glass-card text-white hover-glow'
                  }`}>
                  {key === 'del' ? '⌫' : key}
                </motion.button>
              ))}
            </div>
            <p className="text-xs text-slate-500 mt-6 flex items-center justify-center gap-1">
              <Lock className="w-3 h-3" /> PIN: {selectedServer.pin}
            </p>
          </motion.div>
        )}
      </div>
    </div>
  );
}
