import { usePOS } from '../store';
import { motion } from 'framer-motion';
import { User, Printer, Wifi, Bell, Shield, Database, Smartphone, Monitor } from 'lucide-react';
import { useState } from 'react';

export default function Settings() {
  const { state } = usePOS();
  const [activeTab, setActiveTab] = useState('general');

  const tabs = [
    { id: 'general', label: 'Général', icon: Monitor },
    { id: 'hardware', label: 'Matériel', icon: Printer },
    { id: 'staff', label: 'Personnel', icon: User },
    { id: 'security', label: 'Sécurité', icon: Shield },
  ];

  return (
    <div className="p-4 md:p-6 h-full overflow-y-auto">
      <div className="mb-6">
        <h1 className="text-2xl md:text-3xl font-bold text-white">Paramètres</h1>
        <p className="text-slate-400 text-sm mt-1">Configuration du terminal</p>
      </div>

      {/* Tabs */}
      <div className="flex gap-2 mb-6 overflow-x-auto pb-2">
        {tabs.map(tab => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id)}
            className={`flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-medium whitespace-nowrap transition-colors ${
              activeTab === tab.id
                ? 'bg-blue-500 text-white'
                : 'bg-slate-800 text-slate-300 hover:bg-slate-700'
            }`}
          >
            <tab.icon className="w-4 h-4" />
            {tab.label}
          </button>
        ))}
      </div>

      {/* Content */}
      <motion.div
        key={activeTab}
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        className="space-y-4"
      >
        {activeTab === 'general' && (
          <>
            <div className="bg-slate-800/50 border border-slate-700/50 rounded-xl p-4 md:p-6">
              <h3 className="text-lg font-semibold text-white mb-4">Informations établissement</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="text-sm text-slate-400 mb-1 block">Nom de l'établissement</label>
                  <input
                    type="text"
                    defaultValue="Le Bistrot du Coin"
                    className="w-full p-3 bg-slate-700/50 border border-slate-600/50 rounded-xl text-white text-sm focus:outline-none focus:border-blue-500/50"
                  />
                </div>
                <div>
                  <label className="text-sm text-slate-400 mb-1 block">SIRET</label>
                  <input
                    type="text"
                    defaultValue="123 456 789 00012"
                    className="w-full p-3 bg-slate-700/50 border border-slate-600/50 rounded-xl text-white text-sm focus:outline-none focus:border-blue-500/50"
                  />
                </div>
                <div>
                  <label className="text-sm text-slate-400 mb-1 block">Adresse</label>
                  <input
                    type="text"
                    defaultValue="12 Rue de la Paix, 75002 Paris"
                    className="w-full p-3 bg-slate-700/50 border border-slate-600/50 rounded-xl text-white text-sm focus:outline-none focus:border-blue-500/50"
                  />
                </div>
                <div>
                  <label className="text-sm text-slate-400 mb-1 block">TVA</label>
                  <input
                    type="text"
                    defaultValue="20%"
                    className="w-full p-3 bg-slate-700/50 border border-slate-600/50 rounded-xl text-white text-sm focus:outline-none focus:border-blue-500/50"
                  />
                </div>
              </div>
            </div>

            <div className="bg-slate-800/50 border border-slate-700/50 rounded-xl p-4 md:p-6">
              <h3 className="text-lg font-semibold text-white mb-4">Terminal</h3>
              <div className="space-y-3">
                <div className="flex items-center justify-between p-3 bg-slate-700/30 rounded-lg">
                  <div className="flex items-center gap-3">
                    <Smartphone className="w-5 h-5 text-blue-400" />
                    <div>
                      <p className="text-sm font-medium text-white">Mode d'affichage</p>
                      <p className="text-xs text-slate-400">Adapté à votre appareil</p>
                    </div>
                  </div>
                  <span className="px-3 py-1 bg-blue-500/20 text-blue-400 rounded-full text-xs font-medium">
                    Responsive
                  </span>
                </div>
                <div className="flex items-center justify-between p-3 bg-slate-700/30 rounded-lg">
                  <div className="flex items-center gap-3">
                    <Database className="w-5 h-5 text-emerald-400" />
                    <div>
                      <p className="text-sm font-medium text-white">Mode hors-ligne</p>
                      <p className="text-xs text-slate-400">Fonctionne sans connexion</p>
                    </div>
                  </div>
                  <span className="px-3 py-1 bg-emerald-500/20 text-emerald-400 rounded-full text-xs font-medium">
                    Activé
                  </span>
                </div>
                <div className="flex items-center justify-between p-3 bg-slate-700/30 rounded-lg">
                  <div className="flex items-center gap-3">
                    <Wifi className="w-5 h-5 text-purple-400" />
                    <div>
                      <p className="text-sm font-medium text-white">Synchronisation</p>
                      <p className="text-xs text-slate-400">Dernière sync: il y a 2 min</p>
                    </div>
                  </div>
                  <span className="px-3 py-1 bg-emerald-500/20 text-emerald-400 rounded-full text-xs font-medium flex items-center gap-1">
                    <div className="w-1.5 h-1.5 rounded-full bg-emerald-400" />
                    Connecté
                  </span>
                </div>
              </div>
            </div>
          </>
        )}

        {activeTab === 'hardware' && (
          <>
            <div className="bg-slate-800/50 border border-slate-700/50 rounded-xl p-4 md:p-6">
              <h3 className="text-lg font-semibold text-white mb-4">Périphériques connectés</h3>
              <div className="space-y-3">
                <div className="flex items-center justify-between p-3 bg-slate-700/30 rounded-lg">
                  <div className="flex items-center gap-3">
                    <Printer className="w-5 h-5 text-emerald-400" />
                    <div>
                      <p className="text-sm font-medium text-white">Imprimante cuisine</p>
                      <p className="text-xs text-slate-400">EPSON TM-T88VI • USB</p>
                    </div>
                  </div>
                  <span className="px-3 py-1 bg-emerald-500/20 text-emerald-400 rounded-full text-xs font-medium">
                    Connectée
                  </span>
                </div>
                <div className="flex items-center justify-between p-3 bg-slate-700/30 rounded-lg">
                  <div className="flex items-center gap-3">
                    <Printer className="w-5 h-5 text-emerald-400" />
                    <div>
                      <p className="text-sm font-medium text-white">Imprimante ticket client</p>
                      <p className="text-xs text-slate-400">EPSON TM-T20III • USB</p>
                    </div>
                  </div>
                  <span className="px-3 py-1 bg-emerald-500/20 text-emerald-400 rounded-full text-xs font-medium">
                    Connectée
                  </span>
                </div>
                <div className="flex items-center justify-between p-3 bg-slate-700/30 rounded-lg">
                  <div className="flex items-center gap-3">
                    <Monitor className="w-5 h-5 text-blue-400" />
                    <div>
                      <p className="text-sm font-medium text-white">Tiroir-caisse</p>
                      <p className="text-xs text-slate-400">Via imprimante • RJ11</p>
                    </div>
                  </div>
                  <span className="px-3 py-1 bg-emerald-500/20 text-emerald-400 rounded-full text-xs font-medium">
                    Connecté
                  </span>
                </div>
                <div className="flex items-center justify-between p-3 bg-slate-700/30 rounded-lg">
                  <div className="flex items-center gap-3">
                    <Smartphone className="w-5 h-5 text-amber-400" />
                    <div>
                      <p className="text-sm font-medium text-white">TPE (Terminal Paiement)</p>
                      <p className="text-xs text-slate-400">SumUp • Bluetooth</p>
                    </div>
                  </div>
                  <span className="px-3 py-1 bg-amber-500/20 text-amber-400 rounded-full text-xs font-medium">
                    En attente
                  </span>
                </div>
              </div>
            </div>

            <div className="bg-slate-800/50 border border-slate-700/50 rounded-xl p-4 md:p-6">
              <h3 className="text-lg font-semibold text-white mb-4">Notifications</h3>
              <div className="space-y-3">
                <div className="flex items-center justify-between p-3 bg-slate-700/30 rounded-lg">
                  <div className="flex items-center gap-3">
                    <Bell className="w-5 h-5 text-amber-400" />
                    <div>
                      <p className="text-sm font-medium text-white">Alertes sonores</p>
                      <p className="text-xs text-slate-400">Notification nouvelle commande</p>
                    </div>
                  </div>
                  <div className="w-12 h-6 bg-emerald-500 rounded-full relative cursor-pointer">
                    <div className="absolute right-1 top-1 w-4 h-4 bg-white rounded-full" />
                  </div>
                </div>
                <div className="flex items-center justify-between p-3 bg-slate-700/30 rounded-lg">
                  <div className="flex items-center gap-3">
                    <Bell className="w-5 h-5 text-blue-400" />
                    <div>
                      <p className="text-sm font-medium text-white">Vibrations</p>
                      <p className="text-xs text-slate-400">Retour haptique tactile</p>
                    </div>
                  </div>
                  <div className="w-12 h-6 bg-emerald-500 rounded-full relative cursor-pointer">
                    <div className="absolute right-1 top-1 w-4 h-4 bg-white rounded-full" />
                  </div>
                </div>
              </div>
            </div>
          </>
        )}

        {activeTab === 'staff' && (
          <div className="bg-slate-800/50 border border-slate-700/50 rounded-xl p-4 md:p-6">
            <h3 className="text-lg font-semibold text-white mb-4">Équipe du jour</h3>
            <div className="space-y-3">
              {[
                { name: 'Marie', role: 'Serveuse', status: 'En service', color: 'emerald' },
                { name: 'Thomas', role: 'Barman', status: 'En service', color: 'emerald' },
                { name: 'Julie', role: 'Serveuse', status: 'Pause', color: 'amber' },
                { name: 'Karim', role: 'Cuisinier', status: 'En service', color: 'emerald' },
              ].map(person => (
                <div key={person.name} className="flex items-center justify-between p-3 bg-slate-700/30 rounded-lg">
                  <div className="flex items-center gap-3">
                    <div className={`w-10 h-10 rounded-full bg-gradient-to-br from-${person.color}-500 to-${person.color}-700 flex items-center justify-center text-white font-bold`}>
                      {person.name[0]}
                    </div>
                    <div>
                      <p className="text-sm font-medium text-white">{person.name}</p>
                      <p className="text-xs text-slate-400">{person.role}</p>
                    </div>
                  </div>
                  <span className={`px-3 py-1 rounded-full text-xs font-medium ${
                    person.status === 'En service' ? 'bg-emerald-500/20 text-emerald-400' : 'bg-amber-500/20 text-amber-400'
                  }`}>
                    {person.status}
                  </span>
                </div>
              ))}
            </div>
            <p className="text-xs text-slate-500 mt-4 text-center">
              Serveur actuel : <span className="text-white font-medium">{state.server}</span>
            </p>
          </div>
        )}

        {activeTab === 'security' && (
          <>
            <div className="bg-slate-800/50 border border-slate-700/50 rounded-xl p-4 md:p-6">
              <h3 className="text-lg font-semibold text-white mb-4">Conformité légale</h3>
              <div className="space-y-3">
                <div className="flex items-center justify-between p-3 bg-slate-700/30 rounded-lg">
                  <div>
                    <p className="text-sm font-medium text-white">Certification NF525</p>
                    <p className="text-xs text-slate-400">Logiciel de caisse certifié</p>
                  </div>
                  <span className="px-3 py-1 bg-emerald-500/20 text-emerald-400 rounded-full text-xs font-medium">
                    ✓ Conforme
                  </span>
                </div>
                <div className="flex items-center justify-between p-3 bg-slate-700/30 rounded-lg">
                  <div>
                    <p className="text-sm font-medium text-white">Inaltérabilité des données</p>
                    <p className="text-xs text-slate-400">Données de caisse protégées</p>
                  </div>
                  <span className="px-3 py-1 bg-emerald-500/20 text-emerald-400 rounded-full text-xs font-medium">
                    ✓ Actif
                  </span>
                </div>
                <div className="flex items-center justify-between p-3 bg-slate-700/30 rounded-lg">
                  <div>
                    <p className="text-sm font-medium text-white">RGPD</p>
                    <p className="text-xs text-slate-400">Protection des données</p>
                  </div>
                  <span className="px-3 py-1 bg-emerald-500/20 text-emerald-400 rounded-full text-xs font-medium">
                    ✓ Conforme
                  </span>
                </div>
              </div>
            </div>

            <div className="bg-slate-800/50 border border-slate-700/50 rounded-xl p-4 md:p-6">
              <h3 className="text-lg font-semibold text-white mb-4">Sauvegarde</h3>
              <div className="space-y-3">
                <div className="flex items-center justify-between p-3 bg-slate-700/30 rounded-lg">
                  <div>
                    <p className="text-sm font-medium text-white">Dernière sauvegarde</p>
                    <p className="text-xs text-slate-400">Il y a 15 minutes</p>
                  </div>
                  <button className="px-4 py-2 bg-blue-500 hover:bg-blue-600 text-white rounded-lg text-sm font-medium transition-colors">
                    Sauvegarder
                  </button>
                </div>
                <div className="flex items-center justify-between p-3 bg-slate-700/30 rounded-lg">
                  <div>
                    <p className="text-sm font-medium text-white">Sauvegarde automatique</p>
                    <p className="text-xs text-slate-400">Toutes les 30 minutes</p>
                  </div>
                  <div className="w-12 h-6 bg-emerald-500 rounded-full relative cursor-pointer">
                    <div className="absolute right-1 top-1 w-4 h-4 bg-white rounded-full" />
                  </div>
                </div>
              </div>
            </div>
          </>
        )}
      </motion.div>
    </div>
  );
}
