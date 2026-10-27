import { useState } from 'react';
import { usePOS } from '../store';
import { usePrinter, usePaymentTerminal } from '../lib/hooks';
import { motion } from 'framer-motion';
import { Printer, CreditCard, Wifi, Usb, Bluetooth, Check, X, Settings, ArrowLeft, Zap, AlertCircle } from 'lucide-react';

export default function HardwareSetup() {
  const { dispatch } = usePOS();
  const { config: printerConfig, updateConfig: updatePrinterConfig, isConnected: printerConnected, connect: connectPrinter } = usePrinter();
  const { config: terminalConfig, updateConfig: updateTerminalConfig, status: terminalStatus, connect: connectTerminal } = usePaymentTerminal();

  const [activeTab, setActiveTab] = useState<'printer' | 'terminal'>('printer');
  const [testing, setTesting] = useState(false);

  const handleTestPrinter = async () => {
    setTesting(true);
    await connectPrinter();
    setTimeout(() => setTesting(false), 2000);
  };

  const handleTestTerminal = async () => {
    setTesting(true);
    await connectTerminal();
    setTimeout(() => setTesting(false), 2000);
  };

  return (
    <div className="h-screen w-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 flex items-center justify-center p-4">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="w-full max-w-2xl bg-slate-800/80 border border-slate-700/50 rounded-2xl overflow-hidden"
      >
        {/* Header */}
        <div className="p-5 border-b border-slate-700/50 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <button
              onClick={() => dispatch({ type: 'SET_SCREEN', payload: 'select' })}
              className="p-2 text-slate-400 hover:text-white rounded-lg"
            >
              <ArrowLeft className="w-5 h-5" />
            </button>
            <div>
              <h1 className="text-xl font-bold text-white">Configuration Périphériques</h1>
              <p className="text-xs text-slate-400">Imprimantes et terminaux de paiement</p>
            </div>
          </div>
          <Settings className="w-6 h-6 text-slate-400" />
        </div>

        {/* Tabs */}
        <div className="flex border-b border-slate-700/50">
          <button
            onClick={() => setActiveTab('printer')}
            className={`flex-1 py-3 px-4 text-sm font-medium flex items-center justify-center gap-2 transition-colors ${
              activeTab === 'printer' ? 'text-blue-400 border-b-2 border-blue-400 bg-blue-500/5' : 'text-slate-400 hover:text-white'
            }`}
          >
            <Printer className="w-4 h-4" />
            Imprimante
          </button>
          <button
            onClick={() => setActiveTab('terminal')}
            className={`flex-1 py-3 px-4 text-sm font-medium flex items-center justify-center gap-2 transition-colors ${
              activeTab === 'terminal' ? 'text-emerald-400 border-b-2 border-emerald-400 bg-emerald-500/5' : 'text-slate-400 hover:text-white'
            }`}
          >
            <CreditCard className="w-4 h-4" />
            Terminal Paiement
          </button>
        </div>

        {/* Content */}
        <div className="p-5">
          {activeTab === 'printer' && (
            <PrinterSetup
              config={printerConfig}
              isConnected={printerConnected}
              onConfigChange={updatePrinterConfig}
              onTest={handleTestPrinter}
              testing={testing}
            />
          )}
          {activeTab === 'terminal' && (
            <TerminalSetup
              config={terminalConfig}
              status={terminalStatus}
              onConfigChange={updateTerminalConfig}
              onTest={handleTestTerminal}
              testing={testing}
            />
          )}
        </div>
      </motion.div>
    </div>
  );
}

function PrinterSetup({ config, isConnected, onConfigChange, onTest, testing }: any) {
  const [localConfig, setLocalConfig] = useState(config || {
    id: 'printer-1',
    name: 'Imprimante Cuisine',
    type: 'network',
    connection: '192.168.1.100',
    paperWidth: 80,
    autoCut: true,
    isOpenDrawer: true,
  });

  const handleSave = () => {
    onConfigChange(localConfig);
  };

  return (
    <div className="space-y-4">
      {/* Status */}
      <div className={`p-4 rounded-xl border ${
        isConnected ? 'bg-emerald-500/10 border-emerald-500/30' : 'bg-slate-700/30 border-slate-600/30'
      }`}>
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${
              isConnected ? 'bg-emerald-500/20' : 'bg-slate-600/30'
            }`}>
              <Printer className={`w-5 h-5 ${isConnected ? 'text-emerald-400' : 'text-slate-400'}`} />
            </div>
            <div>
              <p className="text-sm font-medium text-white">
                {isConnected ? 'Connectée' : 'Non connectée'}
              </p>
              <p className="text-xs text-slate-400">{localConfig.name}</p>
            </div>
          </div>
          <button
            onClick={onTest}
            disabled={testing}
            className="px-4 py-2 bg-blue-500 hover:bg-blue-600 disabled:bg-slate-600 text-white rounded-lg text-sm font-medium flex items-center gap-2 transition-colors"
          >
            <Zap className="w-4 h-4" />
            {testing ? 'Test...' : 'Tester'}
          </button>
        </div>
      </div>

      {/* Configuration */}
      <div className="space-y-3">
        <div>
          <label className="text-xs text-slate-400 mb-1 block">Nom de l'imprimante</label>
          <input
            type="text"
            value={localConfig.name}
            onChange={e => setLocalConfig({ ...localConfig, name: e.target.value })}
            className="w-full p-3 bg-slate-700/50 border border-slate-600/50 rounded-xl text-white text-sm focus:outline-none focus:border-blue-500/50"
          />
        </div>

        <div>
          <label className="text-xs text-slate-400 mb-1 block">Type de connexion</label>
          <div className="grid grid-cols-2 gap-2">
            {[
              { id: 'usb', label: 'USB', icon: Usb },
              { id: 'serial', label: 'Série (RS232)', icon: Usb },
              { id: 'bluetooth', label: 'Bluetooth', icon: Bluetooth },
              { id: 'network', label: 'Réseau (TCP/IP)', icon: Wifi },
            ].map(type => (
              <button
                key={type.id}
                onClick={() => setLocalConfig({ ...localConfig, type: type.id })}
                className={`p-3 rounded-xl border text-sm font-medium flex items-center gap-2 transition-colors ${
                  localConfig.type === type.id
                    ? 'bg-blue-500/20 border-blue-500/50 text-blue-400'
                    : 'bg-slate-700/30 border-slate-600/30 text-slate-300 hover:bg-slate-700/50'
                }`}
              >
                <type.icon className="w-4 h-4" />
                {type.label}
              </button>
            ))}
          </div>
        </div>

        <div>
          <label className="text-xs text-slate-400 mb-1 block">
            {localConfig.type === 'network' ? 'Adresse IP' :
             localConfig.type === 'bluetooth' ? 'Adresse MAC' :
             'Port (ex: COM3, /dev/ttyUSB0)'}
          </label>
          <input
            type="text"
            value={localConfig.connection}
            onChange={e => setLocalConfig({ ...localConfig, connection: e.target.value })}
            placeholder={localConfig.type === 'network' ? '192.168.1.100' : 'COM3'}
            className="w-full p-3 bg-slate-700/50 border border-slate-600/50 rounded-xl text-white text-sm focus:outline-none focus:border-blue-500/50"
          />
        </div>

        <div>
          <label className="text-xs text-slate-400 mb-1 block">Largeur du papier</label>
          <div className="grid grid-cols-2 gap-2">
            {[58, 80].map(width => (
              <button
                key={width}
                onClick={() => setLocalConfig({ ...localConfig, paperWidth: width })}
                className={`p-3 rounded-xl border text-sm font-medium transition-colors ${
                  localConfig.paperWidth === width
                    ? 'bg-blue-500/20 border-blue-500/50 text-blue-400'
                    : 'bg-slate-700/30 border-slate-600/30 text-slate-300 hover:bg-slate-700/50'
                }`}
              >
                {width} mm
              </button>
            ))}
          </div>
        </div>

        <div className="space-y-2">
          <label className="flex items-center justify-between p-3 bg-slate-700/30 rounded-xl cursor-pointer">
            <span className="text-sm text-slate-300">Coupe automatique</span>
            <div
              onClick={() => setLocalConfig({ ...localConfig, autoCut: !localConfig.autoCut })}
              className={`w-10 h-6 rounded-full relative transition-colors ${localConfig.autoCut ? 'bg-blue-500' : 'bg-slate-600'}`}
            >
              <div className={`absolute top-1 w-4 h-4 bg-white rounded-full transition-transform ${localConfig.autoCut ? 'right-1' : 'left-1'}`} />
            </div>
          </label>
          <label className="flex items-center justify-between p-3 bg-slate-700/30 rounded-xl cursor-pointer">
            <span className="text-sm text-slate-300">Ouvrir tiroir-caisse</span>
            <div
              onClick={() => setLocalConfig({ ...localConfig, isOpenDrawer: !localConfig.isOpenDrawer })}
              className={`w-10 h-6 rounded-full relative transition-colors ${localConfig.isOpenDrawer ? 'bg-blue-500' : 'bg-slate-600'}`}
            >
              <div className={`absolute top-1 w-4 h-4 bg-white rounded-full transition-transform ${localConfig.isOpenDrawer ? 'right-1' : 'left-1'}`} />
            </div>
          </label>
        </div>
      </div>

      <button
        onClick={handleSave}
        className="w-full py-3 bg-blue-500 hover:bg-blue-600 text-white rounded-xl font-bold flex items-center justify-center gap-2 transition-colors"
      >
        <Check className="w-5 h-5" />
        Enregistrer
      </button>
    </div>
  );
}

function TerminalSetup({ config, status, onConfigChange, onTest, testing }: any) {
  const [localConfig, setLocalConfig] = useState(config || {
    id: 'terminal-1',
    name: 'TPE Principal',
    provider: 'simulator',
    connection: 'bluetooth',
    address: '',
    currency: 'EUR',
    autoPrint: true,
  });

  const handleSave = () => {
    onConfigChange(localConfig);
  };

  const statusColors = {
    disconnected: { bg: 'bg-slate-700/30', border: 'border-slate-600/30', text: 'text-slate-400', label: 'Non connecté' },
    connecting: { bg: 'bg-amber-500/10', border: 'border-amber-500/30', text: 'text-amber-400', label: 'Connexion...' },
    ready: { bg: 'bg-emerald-500/10', border: 'border-emerald-500/30', text: 'text-emerald-400', label: 'Prêt' },
    busy: { bg: 'bg-blue-500/10', border: 'border-blue-500/30', text: 'text-blue-400', label: 'Occupé' },
    error: { bg: 'bg-red-500/10', border: 'border-red-500/30', text: 'text-red-400', label: 'Erreur' },
  };

  const currentStatus = statusColors[status as keyof typeof statusColors] || statusColors.disconnected;

  return (
    <div className="space-y-4">
      {/* Status */}
      <div className={`p-4 rounded-xl border ${currentStatus.bg} ${currentStatus.border}`}>
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${
              status === 'ready' ? 'bg-emerald-500/20' : 'bg-slate-600/30'
            }`}>
              <CreditCard className={`w-5 h-5 ${currentStatus.text}`} />
            </div>
            <div>
              <p className={`text-sm font-medium ${currentStatus.text}`}>{currentStatus.label}</p>
              <p className="text-xs text-slate-400">{localConfig.name}</p>
            </div>
          </div>
          <button
            onClick={onTest}
            disabled={testing}
            className="px-4 py-2 bg-emerald-500 hover:bg-emerald-600 disabled:bg-slate-600 text-white rounded-lg text-sm font-medium flex items-center gap-2 transition-colors"
          >
            <Zap className="w-4 h-4" />
            {testing ? 'Test...' : 'Connecter'}
          </button>
        </div>
      </div>

      {/* Info */}
      <div className="p-3 bg-blue-500/10 border border-blue-500/20 rounded-xl flex items-start gap-2">
        <AlertCircle className="w-4 h-4 text-blue-400 shrink-0 mt-0.5" />
        <p className="text-xs text-blue-300">
          En mode démo, le simulateur de paiement est utilisé. En production, configurez votre TPE physique (Ingenico, Verifone, SumUp, Stripe).
        </p>
      </div>

      {/* Configuration */}
      <div className="space-y-3">
        <div>
          <label className="text-xs text-slate-400 mb-1 block">Nom du terminal</label>
          <input
            type="text"
            value={localConfig.name}
            onChange={e => setLocalConfig({ ...localConfig, name: e.target.value })}
            className="w-full p-3 bg-slate-700/50 border border-slate-600/50 rounded-xl text-white text-sm focus:outline-none focus:border-emerald-500/50"
          />
        </div>

        <div>
          <label className="text-xs text-slate-400 mb-2 block">Fournisseur TPE</label>
          <div className="grid grid-cols-2 gap-2">
            {[
              { id: 'simulator', label: 'Simulateur', desc: 'Mode démo' },
              { id: 'ingenico', label: 'Ingenico', desc: 'iCT250, iWL250' },
              { id: 'verifone', label: 'Verifone', desc: 'VX520, E355' },
              { id: 'sumup', label: 'SumUp', desc: 'Air, Solo' },
              { id: 'stripe', label: 'Stripe', desc: 'Terminal' },
            ].map(provider => (
              <button
                key={provider.id}
                onClick={() => setLocalConfig({ ...localConfig, provider: provider.id })}
                className={`p-3 rounded-xl border text-left transition-colors ${
                  localConfig.provider === provider.id
                    ? 'bg-emerald-500/20 border-emerald-500/50'
                    : 'bg-slate-700/30 border-slate-600/30 hover:bg-slate-700/50'
                }`}
              >
                <p className={`text-sm font-medium ${localConfig.provider === provider.id ? 'text-emerald-400' : 'text-slate-300'}`}>
                  {provider.label}
                </p>
                <p className="text-[10px] text-slate-500">{provider.desc}</p>
              </button>
            ))}
          </div>
        </div>

        <div>
          <label className="text-xs text-slate-400 mb-1 block">Type de connexion</label>
          <div className="grid grid-cols-3 gap-2">
            {[
              { id: 'usb', label: 'USB', icon: Usb },
              { id: 'bluetooth', label: 'Bluetooth', icon: Bluetooth },
              { id: 'wifi', label: 'WiFi', icon: Wifi },
            ].map(conn => (
              <button
                key={conn.id}
                onClick={() => setLocalConfig({ ...localConfig, connection: conn.id })}
                className={`p-3 rounded-xl border text-sm font-medium flex items-center justify-center gap-2 transition-colors ${
                  localConfig.connection === conn.id
                    ? 'bg-emerald-500/20 border-emerald-500/50 text-emerald-400'
                    : 'bg-slate-700/30 border-slate-600/30 text-slate-300 hover:bg-slate-700/50'
                }`}
              >
                <conn.icon className="w-4 h-4" />
                {conn.label}
              </button>
            ))}
          </div>
        </div>

        {(localConfig.provider === 'sumup' || localConfig.provider === 'stripe') && (
          <div>
            <label className="text-xs text-slate-400 mb-1 block">
              {localConfig.provider === 'sumup' ? 'Affiliate Key' : 'API Key'}
            </label>
            <input
              type="password"
              value={localConfig.apiKey || ''}
              onChange={e => setLocalConfig({ ...localConfig, apiKey: e.target.value })}
              placeholder="sk_test_..."
              className="w-full p-3 bg-slate-700/50 border border-slate-600/50 rounded-xl text-white text-sm focus:outline-none focus:border-emerald-500/50"
            />
          </div>
        )}

        <div>
          <label className="text-xs text-slate-400 mb-1 block">Adresse (IP / MAC / Port)</label>
          <input
            type="text"
            value={localConfig.address}
            onChange={e => setLocalConfig({ ...localConfig, address: e.target.value })}
            placeholder={localConfig.connection === 'wifi' ? '192.168.1.200' : 'Auto-détection'}
            className="w-full p-3 bg-slate-700/50 border border-slate-600/50 rounded-xl text-white text-sm focus:outline-none focus:border-emerald-500/50"
          />
        </div>

        <label className="flex items-center justify-between p-3 bg-slate-700/30 rounded-xl cursor-pointer">
          <span className="text-sm text-slate-300">Impression automatique du ticket</span>
          <div
            onClick={() => setLocalConfig({ ...localConfig, autoPrint: !localConfig.autoPrint })}
            className={`w-10 h-6 rounded-full relative transition-colors ${localConfig.autoPrint ? 'bg-emerald-500' : 'bg-slate-600'}`}
          >
            <div className={`absolute top-1 w-4 h-4 bg-white rounded-full transition-transform ${localConfig.autoPrint ? 'right-1' : 'left-1'}`} />
          </div>
        </label>
      </div>

      <button
        onClick={handleSave}
        className="w-full py-3 bg-emerald-500 hover:bg-emerald-600 text-white rounded-xl font-bold flex items-center justify-center gap-2 transition-colors"
      >
        <Check className="w-5 h-5" />
        Enregistrer
      </button>
    </div>
  );
}
