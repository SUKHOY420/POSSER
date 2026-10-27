import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Wifi, WifiOff } from 'lucide-react';
import { syncManager } from '../lib/sync';

export function SyncIndicator() {
  const [isSyncing, setIsSyncing] = useState(false);
  const [lastSync, setLastSync] = useState<Date | null>(null);
  const [postType, setPostType] = useState<string>('');

  useEffect(() => {
    setPostType(syncManager.getPostType());

    // Écouter les événements de sync
    const events = [
      'ORDER_CREATED', 'ORDER_UPDATED', 'ORDER_CLOSED',
      'ITEM_ADDED', 'ITEM_REMOVED', 'ITEM_UPDATED',
      'ORDER_SENT_TO_KITCHEN', 'ITEM_STATUS_CHANGED',
      'TABLE_STATUS_CHANGED', 'PAYMENT_PROCESSED'
    ];

    const unsubs = events.map(event => 
      syncManager.on(event, () => {
        setIsSyncing(true);
        setLastSync(new Date());
        setTimeout(() => setIsSyncing(false), 1000);
      })
    );

    return () => unsubs.forEach(unsub => unsub());
  }, []);

  const getPostLabel = () => {
    switch (postType) {
      case 'main': return 'Caisse';
      case 'kitchen': return 'Cuisine';
      case 'server': return 'Serveur';
      default: return '';
    }
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: -20 }}
      animate={{ opacity: 1, y: 0 }}
      className="fixed top-4 left-4 z-40"
    >
      <div className={`flex items-center gap-2 px-3 py-1.5 rounded-full text-xs font-medium backdrop-blur-xl border ${
        isSyncing 
          ? 'bg-blue-500/20 border-blue-500/50 text-blue-300' 
          : 'bg-slate-800/80 border-slate-700/50 text-slate-400'
      }`}>
        {isSyncing ? (
          <>
            <Wifi className="w-3 h-3 animate-pulse" />
            <span>Sync...</span>
          </>
        ) : (
          <>
            <Wifi className="w-3 h-3" />
            <span>{getPostLabel()}</span>
            {lastSync && (
              <span className="text-[10px] opacity-60">
                • {lastSync.toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit', second: '2-digit' })}
              </span>
            )}
          </>
        )}
      </div>
    </motion.div>
  );
}
