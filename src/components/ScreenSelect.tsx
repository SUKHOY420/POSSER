import { useState } from 'react';
import { usePOS } from '../store';
import { motion } from 'framer-motion';
import { Monitor, ChefHat, Tablet, LogOut, Lock, Settings, Printer, CreditCard } from 'lucide-react';
import { servers } from '../data';
import { Server } from '../types';
import { usePrinter, usePaymentTerminal } from '../lib/hooks';

export default function ScreenSelect() {
  const { state, dispatch } = usePOS();
  const { isConnected: printerConnected } = usePrinter();
  const { status: terminalStatus } = usePaymentTerminal();
  const [selectedRole, setSelectedRole] = useState<'main' | 'kitchen' | 'server' | null>(null);
  const [selectedServer, setSelectedServer] = useState<Server | null>(null);
  const [pinInput, setPinInput] = useState('');
  const [pinError, setPinError] = useState(false);
  const [step, setStep] = useState<'role' | 'server' | 'pin'>('role');

  const handleRoleSelect = (role: 'main' | 'kitchen' | 'server') => {
    if (role === 'main') {
      dispatch({ type: 'LOGIN_SERVER', payload: servers.find(s => s.role === 'admin')! });
      dispatch({ type: 'SET_SCREEN', payload: 'main' });
    } else if (role === 'kitchen') {
      dispatch({ type: 'SET_SCREEN', payload: 'kitchen' });
    } else {
      setSelectedRole(role);
      setStep('server');
    }
  };

  const handleServerSelect = (server: Server) => {
    setSelectedServer(server);
    setStep('pin');
    setPinInput('');
    setPinError(false);
  };

  const handlePinSubmit = () => {
    if (selectedServer && pinInput === selectedServer.pin) {
      dispatch({ type: 'LOGIN_SERVER', payload: selectedServer });
      dispatch({ type: 'SET_SCREEN', payload: 'server' });
    } else {
      setPinError(true);
      setTimeout(() => setPinError(false), 1500);
      setPinInput('');
    }
  };

  const handlePinDigit = (digit: string) => {
    if (pinInput.length < 4) {
      const newPin = pinInput + digit;
      setPinInput(newPin);
      if (newPin.length === 4) {
        setTimeout(() => {
          if (selectedServer && newPin === selectedServer.pin) {
            dispatch({ type: 'LOGIN_SERVER', payload: selectedServer });
            dispatch({ type: 'SET_SCREEN', payload: 'server' });
          } else {
            setPinError(true);
            setTimeout(() => {
              setPinError(false);
              setPinInput('');
            }, 1500);
          }
        }, 200);
      }
    }
  };

  const handlePinDelete = () => {
    setPinInput(pinInput.slice(0, -1));
  };

  return (
    <div className="h-screen w-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 flex items-center justify-center p-4">
      {/* Background pattern */}
      <div className="absolute inset-0 opacity-5">
        <div className="absolute inset-0" style={{
          backgroundImage: 'radial-gradient(circle at 1px 1px, white 1px, transparent 0)',
          backgroundSize: '40px 40px'
        }} />
      </div>

      <div className="relative w-full max-w-lg">
        {/* Logo */}
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="text-center mb-6"
        >
          <div className="w-16 h-16 mx-auto rounded-2xl bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center mb-4 shadow-lg shadow-blue-500/20">
            <Monitor className="w-8 h-8 text-white" />
          </div>
          <h1 className="text-3xl font-bold text-white">QuickPOS</h1>
          <p className="text-slate-400 mt-1">Sélectionnez votre poste</p>
        </motion.div>

        {/* Peripheral Status */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.2 }}
          className="flex items-center justify-center gap-3 mb-6"
        >
          <div className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs ${
            printerConnected ? 'bg-emerald-500/10 border border-emerald-500/30 text-emerald-400' : 'bg-slate-700/50 border border-slate-600/30 text-slate-400'
          }`}>
            <Printer className="w-3 h-3" />
            <span>{printerConnected ? 'Imprimante OK' : 'Imprimante'}</span>
          </div>
          <div className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs ${
            terminalStatus === 'ready' ? 'bg-emerald-500/10 border border-emerald-500/30 text-emerald-400' : 'bg-slate-700/50 border border-slate-600/30 text-slate-400'
          }`}>
            <CreditCard className="w-3 h-3" />
            <span>{terminalStatus === 'ready' ? 'TPE Prêt' : 'TPE'}</span>
          </div>
          <button
            onClick={() => dispatch({ type: 'SET_SCREEN', payload: 'hardware' })}
            className="p-1.5 bg-slate-700/50 border border-slate-600/30 rounded-full text-slate-400 hover:text-white hover:bg-slate-600/50 transition-colors"
            title="Configuration périphériques"
          >
            <Settings className="w-3.5 h-3.5" />
          </button>
        </motion.div>

        {/* Step 1: Role Selection */}
        {step === 'role' && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="space-y-3"
          >
            <button
              onClick={() => handleRoleSelect('main')}
              className="w-full p-5 bg-slate-800/80 border border-slate-700/50 rounded-2xl hover:border-blue-500/50 hover:bg-slate-700/50 transition-all group flex items-center gap-4"
            >
              <div className="w-14 h-14 rounded-xl bg-gradient-to-br from-blue-500 to-blue-700 flex items-center justify-center shrink-0 group-hover:scale-110 transition-transform">
                <Monitor className="w-7 h-7 text-white" />
              </div>
              <div className="text-left">
                <p className="text-lg font-bold text-white">Écran Principal</p>
                <p className="text-sm text-slate-400">Caisse - Vue globale des commandes</p>
              </div>
            </button>

            <button
              onClick={() => handleRoleSelect('kitchen')}
              className="w-full p-5 bg-slate-800/80 border border-slate-700/50 rounded-2xl hover:border-amber-500/50 hover:bg-slate-700/50 transition-all group flex items-center gap-4"
            >
              <div className="w-14 h-14 rounded-xl bg-gradient-to-br from-amber-500 to-orange-700 flex items-center justify-center shrink-0 group-hover:scale-110 transition-transform">
                <ChefHat className="w-7 h-7 text-white" />
              </div>
              <div className="text-left">
                <p className="text-lg font-bold text-white">Écran Cuisine</p>
                <p className="text-sm text-slate-400">KDS - Commandes à préparer</p>
              </div>
            </button>

            <button
              onClick={() => handleRoleSelect('server')}
              className="w-full p-5 bg-slate-800/80 border border-slate-700/50 rounded-2xl hover:border-emerald-500/50 hover:bg-slate-700/50 transition-all group flex items-center gap-4"
            >
              <div className="w-14 h-14 rounded-xl bg-gradient-to-br from-emerald-500 to-emerald-700 flex items-center justify-center shrink-0 group-hover:scale-110 transition-transform">
                <Tablet className="w-7 h-7 text-white" />
              </div>
              <div className="text-left">
                <p className="text-lg font-bold text-white">Tablette Serveur</p>
                <p className="text-sm text-slate-400">Prendre des commandes</p>
              </div>
            </button>

            {/* Close session button */}
            {state.session.totalOrders > 0 && (
              <button
                onClick={() => dispatch({ type: 'SET_SCREEN', payload: 'close' })}
                className="w-full p-4 bg-red-500/10 border border-red-500/30 rounded-2xl hover:bg-red-500/20 transition-all flex items-center gap-4"
              >
                <div className="w-12 h-12 rounded-xl bg-red-500/20 flex items-center justify-center shrink-0">
                  <LogOut className="w-6 h-6 text-red-400" />
                </div>
                <div className="text-left">
                  <p className="text-base font-bold text-red-400">Clôturer la session</p>
                  <p className="text-xs text-slate-400">{state.session.totalOrders} commandes • {state.session.totalRevenue.toFixed(2)} €</p>
                </div>
              </button>
            )}
          </motion.div>
        )}

        {/* Step 2: Server Selection */}
        {step === 'server' && (
          <motion.div
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
          >
            <button
              onClick={() => setStep('role')}
              className="text-slate-400 hover:text-white text-sm mb-4 flex items-center gap-1"
            >
              ← Retour
            </button>
            <h2 className="text-xl font-bold text-white mb-4">Choisissez votre profil</h2>
            <div className="grid grid-cols-2 gap-3">
              {servers.filter(s => s.role === 'server').map(server => (
                <button
                  key={server.id}
                  onClick={() => handleServerSelect(server)}
                  className="p-4 bg-slate-800/80 border border-slate-700/50 rounded-2xl hover:border-emerald-500/50 transition-all flex flex-col items-center gap-2"
                >
                  <div
                    className="w-12 h-12 rounded-full flex items-center justify-center text-white text-lg font-bold"
                    style={{ backgroundColor: server.color }}
                  >
                    {server.name[0]}
                  </div>
                  <span className="text-white font-medium">{server.name}</span>
                </button>
              ))}
            </div>
          </motion.div>
        )}

        {/* Step 3: PIN Entry */}
        {step === 'pin' && selectedServer && (
          <motion.div
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            className="text-center"
          >
            <button
              onClick={() => { setStep('server'); setPinInput(''); }}
              className="text-slate-400 hover:text-white text-sm mb-4 flex items-center gap-1"
            >
              ← Retour
            </button>

            <div
              className="w-16 h-16 mx-auto rounded-full flex items-center justify-center text-white text-2xl font-bold mb-4"
              style={{ backgroundColor: selectedServer.color }}
            >
              {selectedServer.name[0]}
            </div>
            <h2 className="text-xl font-bold text-white mb-1">Bonjour {selectedServer.name}</h2>
            <p className="text-slate-400 text-sm mb-6">Entrez votre code PIN</p>

            {/* PIN dots */}
            <div className="flex justify-center gap-3 mb-8">
              {[0, 1, 2, 3].map(i => (
                <div
                  key={i}
                  className={`w-4 h-4 rounded-full transition-all ${
                    pinError ? 'bg-red-500 animate-pulse' :
                    i < pinInput.length ? 'bg-emerald-500 scale-110' : 'bg-slate-600'
                  }`}
                />
              ))}
            </div>

            {/* Numpad */}
            <div className="grid grid-cols-3 gap-3 max-w-[240px] mx-auto">
              {['1', '2', '3', '4', '5', '6', '7', '8', '9', '', '0', 'del'].map(key => (
                <button
                  key={key || 'empty'}
                  onClick={() => {
                    if (key === 'del') handlePinDelete();
                    else if (key) handlePinDigit(key);
                  }}
                  disabled={!key}
                  className={`h-14 rounded-xl text-xl font-bold transition-all ${
                    !key ? 'invisible' :
                    key === 'del' ? 'bg-slate-700 text-slate-300 hover:bg-slate-600 active:scale-95' :
                    'bg-slate-800 text-white hover:bg-slate-700 active:scale-95 border border-slate-700/50'
                  }`}
                >
                  {key === 'del' ? '⌫' : key}
                </button>
              ))}
            </div>

            <p className="text-xs text-slate-500 mt-4">
              <Lock className="w-3 h-3 inline mr-1" />
              Code par défaut : {selectedServer.pin}
            </p>
          </motion.div>
        )}
      </div>
    </div>
  );
}
