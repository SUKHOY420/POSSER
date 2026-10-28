import { useState } from 'react';
import { motion } from 'framer-motion';
import { Play, DollarSign } from 'lucide-react';
import { usePOS } from '../store';

export default function OpenSessionModal() {
  const { state, dispatch } = usePOS();
  const [initialCash, setInitialCash] = useState('200');

  const handleOpenSession = () => {
    const cash = parseFloat(initialCash);
    if (isNaN(cash) || cash < 0) return;
    
    dispatch({
      type: 'OPEN_SESSION',
      payload: { initialCash: cash }
    });
  };

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4"
    >
      <motion.div
        initial={{ scale: 0.9, y: 20 }}
        animate={{ scale: 1, y: 0 }}
        className="glass-card rounded-2xl p-6 w-full max-w-md"
      >
        <div className="text-center mb-6">
          <div className="w-16 h-16 mx-auto rounded-full bg-gradient-to-br from-emerald-500 to-emerald-700 flex items-center justify-center mb-4">
            <Play className="w-8 h-8 text-white" />
          </div>
          <h2 className="text-2xl font-bold text-white mb-2">Ouvrir une Session</h2>
          <p className="text-slate-400 text-sm">
            Bienvenue {state.currentServer?.name || ''} !<br />
            Veuillez saisir le fonds de caisse initial
          </p>
        </div>

        <div className="mb-6">
          <label className="text-sm text-slate-400 mb-2 block">Fonds de caisse initial</label>
          <div className="relative">
            <DollarSign className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" />
            <input
              type="number"
              value={initialCash}
              onChange={e => setInitialCash(e.target.value)}
              step="0.01"
              min="0"
              className="w-full pl-12 pr-4 py-3 glass rounded-xl text-white text-xl font-bold text-center focus:outline-none focus:ring-2 focus:ring-emerald-500"
              placeholder="0.00"
              autoFocus
            />
          </div>
          <div className="flex gap-2 mt-3">
            {[100, 200, 300, 500].map(amount => (
              <button
                key={amount}
                onClick={() => setInitialCash(amount.toString())}
                className="flex-1 py-2 glass rounded-lg text-sm text-slate-300 hover:bg-white/10 transition-colors"
              >
                {amount}€
              </button>
            ))}
          </div>
        </div>

        <button
          onClick={handleOpenSession}
          disabled={!initialCash || parseFloat(initialCash) < 0}
          className="w-full py-3 bg-gradient-to-r from-emerald-500 to-emerald-600 hover:from-emerald-600 hover:to-emerald-700 disabled:from-slate-600 disabled:to-slate-700 text-white rounded-xl font-bold transition-all"
        >
          Ouvrir la Session
        </button>

        <p className="text-xs text-slate-500 text-center mt-4">
          La session sera enregistrée et pourra être clôturée en fin de journée
        </p>
      </motion.div>
    </motion.div>
  );
}
