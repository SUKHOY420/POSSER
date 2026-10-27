import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Bell, X, ChefHat, DollarSign, AlertCircle } from 'lucide-react';
import { syncManager } from '../lib/sync';

interface Notification {
  id: string;
  type: 'order' | 'kitchen' | 'payment' | 'info';
  title: string;
  message: string;
  timestamp: Date;
}

export function NotificationSystem() {
  const [notifications, setNotifications] = useState<Notification[]>([]);

  useEffect(() => {
    const unsubs: (() => void)[] = [];

    // Notifications de nouvelles commandes
    unsubs.push(syncManager.on('KITCHEN_NOTIFICATION', (event: any) => {
      addNotification({
        type: 'kitchen',
        title: '🔥 Nouvelle commande en cuisine',
        message: event.message,
      });
    }));

    // Notifications pour les serveurs
    unsubs.push(syncManager.on('SERVER_NOTIFICATION', (event: any) => {
      addNotification({
        type: 'order',
        title: event.from === 'Cuisine' ? '✅ Commande prête' : '📢 Notification',
        message: event.message,
      });
    }));

    // Notifications de paiement
    unsubs.push(syncManager.on('PAYMENT_PROCESSED', (event: any) => {
      addNotification({
        type: 'payment',
        title: '💰 Paiement reçu',
        message: `${event.amount.toFixed(2)} € par ${event.method === 'cash' ? 'espèces' : 'carte'}`,
      });
    }));

    // Notifications de nouvelles commandes pour la caisse
    unsubs.push(syncManager.on('ORDER_CREATED', (event: any) => {
      addNotification({
        type: 'order',
        title: '📝 Nouvelle commande',
        message: `Table ${event.order?.tableId || '?'} par ${event.order?.serverName || '?'}`,
      });
    }));

    return () => {
      unsubs.forEach(unsub => unsub());
    };
  }, []);

  const addNotification = (notif: Omit<Notification, 'id' | 'timestamp'>) => {
    const newNotif: Notification = {
      ...notif,
      id: Date.now().toString(),
      timestamp: new Date(),
    };
    setNotifications(prev => [newNotif, ...prev].slice(0, 5)); // Max 5 notifications

    // Auto-dismiss après 5 secondes
    setTimeout(() => {
      setNotifications(prev => prev.filter(n => n.id !== newNotif.id));
    }, 5000);
  };

  const removeNotification = (id: string) => {
    setNotifications(prev => prev.filter(n => n.id !== id));
  };

  const getIcon = (type: Notification['type']) => {
    switch (type) {
      case 'order': return <Bell className="w-5 h-5" />;
      case 'kitchen': return <ChefHat className="w-5 h-5" />;
      case 'payment': return <DollarSign className="w-5 h-5" />;
      case 'info': return <AlertCircle className="w-5 h-5" />;
    }
  };

  const getColor = (type: Notification['type']) => {
    switch (type) {
      case 'order': return 'from-blue-500/20 to-blue-600/10 border-blue-500/50';
      case 'kitchen': return 'from-amber-500/20 to-amber-600/10 border-amber-500/50';
      case 'payment': return 'from-emerald-500/20 to-emerald-600/10 border-emerald-500/50';
      case 'info': return 'from-slate-500/20 to-slate-600/10 border-slate-500/50';
    }
  };

  return (
    <div className="fixed top-20 right-4 z-50 space-y-2 max-w-sm">
      <AnimatePresence>
        {notifications.map(notif => (
          <motion.div
            key={notif.id}
            initial={{ opacity: 0, x: 100, scale: 0.8 }}
            animate={{ opacity: 1, x: 0, scale: 1 }}
            exit={{ opacity: 0, x: 100, scale: 0.8 }}
            className={`bg-gradient-to-r ${getColor(notif.type)} border backdrop-blur-xl rounded-xl p-4 shadow-2xl`}
          >
            <div className="flex items-start gap-3">
              <div className="text-white shrink-0">
                {getIcon(notif.type)}
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-bold text-white">{notif.title}</p>
                <p className="text-xs text-slate-300 mt-0.5">{notif.message}</p>
              </div>
              <button
                onClick={() => removeNotification(notif.id)}
                className="text-slate-400 hover:text-white shrink-0"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
          </motion.div>
        ))}
      </AnimatePresence>
    </div>
  );
}
