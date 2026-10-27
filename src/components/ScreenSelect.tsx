import { useState } from 'react';
import { motion } from 'framer-motion';
import { Monitor, ChefHat, Tablet, Settings, Lock } from 'lucide-react';
import { usePOS } from '../store';
import { Server } from '../types';

export default function ScreenSelect() {
  const { dispatch } = usePOS();
  const [step, setStep] = useState<'role' | 'server' | 'pin'>('role');
  const [selectedServer, setSelectedServer] = useState<Server | null>(null);
  const [pin, setPin] = useState('');
  const [pinError, setPinError] = useState(false);

  const handleRoleSelect = (role: 'main' | 'kitchen' | 'server' | 'admin') => {
    if (role === 'main') {
      dispatch({ type: 'LOGIN', payload: { id: 'admin', name: 'Admin', pin: '0000', color: '#10b981', role: 'admin' } });
      dispatch({ type: 'SET_SCREEN', payload: 'main' });
    } else if (role === 'kitchen') {
      dispatch({ type: 'SET_SCREEN', payload: 'kitchen' });
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
    <div className="h-screen w-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 flex items-center justify-center p-4">
      <div className="w-full max-w-lg">
        <motion.div initial={{ opacity: 0, y: -20 }} animate={{ opacity: 1, y: 0 }} className="text-center mb-8">
          <div className="w-16 h-16 mx-auto rounded-2xl bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center mb-4 shadow-lg">
            <Monitor className="w-8 h-8 text-white" />
          </div>
          <h1 className="text-3xl font-bold text-white">QuickPOS Pro</h1>
          <p className="text-slate-400 mt-1">Système de caisse professionnel</p>
          <p className="text-xs text-slate-500 mt-2">
            💡 Ouvrez cette page dans plusieurs onglets pour tester la synchronisation temps réel
          </p>
        </motion.div>

        {step === 'role' && (
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="space-y-3">
            <button onClick={() => handleRoleSelect('main')}
              className="w-full p-5 bg-slate-800/80 border border-slate-700/50 rounded-2xl hover:border-blue-500/50 transition-all group flex items-center gap-4">
              <div className="w-14 h-14 rounded-xl bg-gradient-to-br from-blue-500 to-blue-700 flex items-center justify-center shrink-0 group-hover:scale-110 transition-transform">
                <Monitor className="w-7 h-7 text-white" />
              </div>
              <div className="text-left">
                <p className="text-lg font-bold text-white">Caisse Principale</p>
                <p className="text-sm text-slate-400">Vue globale temps réel</p>
              </div>
            </button>
            <button onClick={() => handleRoleSelect('kitchen')}
              className="w-full p-5 bg-slate-800/80 border border-slate-700/50 rounded-2xl hover:border-amber-500/50 transition-all group flex items-center gap-4">
              <div className="w-14 h-14 rounded-xl bg-gradient-to-br from-amber-500 to-orange-700 flex items-center justify-center shrink-0 group-hover:scale-110 transition-transform">
                <ChefHat className="w-7 h-7 text-white" />
              </div>
              <div className="text-left">
                <p className="text-lg font-bold text-white">Écran Cuisine</p>
                <p className="text-sm text-slate-400">KDS - Commandes à préparer</p>
              </div>
            </button>
            <button onClick={() => handleRoleSelect('server')}
              className="w-full p-5 bg-slate-800/80 border border-slate-700/50 rounded-2xl hover:border-emerald-500/50 transition-all group flex items-center gap-4">
              <div className="w-14 h-14 rounded-xl bg-gradient-to-br from-emerald-500 to-emerald-700 flex items-center justify-center shrink-0 group-hover:scale-110 transition-transform">
                <Tablet className="w-7 h-7 text-white" />
              </div>
              <div className="text-left">
                <p className="text-lg font-bold text-white">Tablette Serveur</p>
                <p className="text-sm text-slate-400">Prendre des commandes</p>
              </div>
            </button>
            <button onClick={() => handleRoleSelect('admin')}
              className="w-full p-5 bg-slate-800/80 border border-slate-700/50 rounded-2xl hover:border-purple-500/50 transition-all group flex items-center gap-4">
              <div className="w-14 h-14 rounded-xl bg-gradient-to-br from-purple-500 to-purple-700 flex items-center justify-center shrink-0 group-hover:scale-110 transition-transform">
                <Settings className="w-7 h-7 text-white" />
              </div>
              <div className="text-left">
                <p className="text-lg font-bold text-white">Administration</p>
                <p className="text-sm text-slate-400">Gérer produits, tables, serveurs, rapports</p>
              </div>
            </button>
          </motion.div>
        )}

        {step === 'server' && (
          <motion.div initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }}>
            <button onClick={() => setStep('role')} className="text-slate-400 hover:text-white text-sm mb-4 flex items-center gap-1">
              ← Retour
            </button>
            <h2 className="text-xl font-bold text-white mb-4">Choisissez votre profil</h2>
            <div className="grid grid-cols-2 gap-3">
              {usePOS().state.servers.map(server => (
                <button key={server.id} onClick={() => handleServerSelect(server)}
                  className="p-4 bg-slate-800/80 border border-slate-700/50 rounded-2xl hover:border-emerald-500/50 transition-all flex flex-col items-center gap-2">
                  <div className="w-12 h-12 rounded-full flex items-center justify-center text-white text-lg font-bold"
                    style={{ backgroundColor: server.color }}>
                    {server.name[0]}
                  </div>
                  <span className="text-white font-medium">{server.name}</span>
                  <span className="text-xs text-slate-400">{server.role === 'admin' ? 'Admin' : 'Serveur'}</span>
                </button>
              ))}
            </div>
          </motion.div>
        )}

        {step === 'pin' && selectedServer && (
          <motion.div initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} className="text-center">
            <button onClick={() => { setStep('server'); setPin(''); }} className="text-slate-400 hover:text-white text-sm mb-4 flex items-center gap-1">
              ← Retour
            </button>
            <div className="w-16 h-16 mx-auto rounded-full flex items-center justify-center text-white text-2xl font-bold mb-4"
              style={{ backgroundColor: selectedServer.color }}>
              {selectedServer.name[0]}
            </div>
            <h2 className="text-xl font-bold text-white mb-1">Bonjour {selectedServer.name}</h2>
            <p className="text-slate-400 text-sm mb-6">Entrez votre code PIN</p>
            <div className="flex justify-center gap-3 mb-8">
              {[0, 1, 2, 3].map(i => (
                <div key={i} className={`w-4 h-4 rounded-full transition-all ${
                  pinError ? 'bg-red-500 animate-pulse' :
                  i < pin.length ? 'bg-emerald-500 scale-110' : 'bg-slate-600'
                }`} />
              ))}
            </div>
            <div className="grid grid-cols-3 gap-3 max-w-[240px] mx-auto">
              {['1', '2', '3', '4', '5', '6', '7', '8', '9', '', '0', 'del'].map(key => (
                <button key={key || 'empty'}
                  onClick={() => { if (key === 'del') setPin(pin.slice(0, -1)); else if (key) handlePinDigit(key); }}
                  disabled={!key}
                  className={`h-14 rounded-xl text-xl font-bold transition-all ${
                    !key ? 'invisible' :
                    key === 'del' ? 'bg-slate-700 text-slate-300 hover:bg-slate-600 active:scale-95' :
                    'bg-slate-800 text-white hover:bg-slate-700 active:scale-95 border border-slate-700/50'
                  }`}>
                  {key === 'del' ? '⌫' : key}
                </button>
              ))}
            </div>
            <p className="text-xs text-slate-500 mt-4 flex items-center justify-center gap-1">
              <Lock className="w-3 h-3" /> PIN: {selectedServer.pin}
            </p>
          </motion.div>
        )}
      </div>
    </div>
  );
}
