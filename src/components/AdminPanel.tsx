import { useState } from 'react';
import { motion } from 'framer-motion';
import { v4 as uuidv4 } from 'uuid';
import {
  Package, Users, Table as TableIcon, Receipt, Settings, BarChart3,
  Plus, Edit, Trash2, Save, X, LogOut, Download, Filter, Shield, Lock
} from 'lucide-react';
import { usePOS } from '../store';
import { MenuItem, Table, Server, TicketFormat } from '../types';

export default function AdminPanel() {
  const { state, dispatch } = usePOS();
  const [activeTab, setActiveTab] = useState<'products' | 'tables' | 'servers' | 'tickets' | 'format' | 'reports' | 'security'>('products');

  const tabs = [
    { id: 'products', label: 'Produits', icon: Package },
    { id: 'tables', label: 'Tables', icon: TableIcon },
    { id: 'servers', label: 'Serveurs', icon: Users },
    { id: 'tickets', label: 'Tickets', icon: Receipt },
    { id: 'format', label: 'Format', icon: Settings },
    { id: 'reports', label: 'Rapports', icon: BarChart3 },
    { id: 'security', label: 'Sécurité', icon: Shield },
  ];

  return (
    <div className="h-screen flex flex-col bg-slate-900">
      {/* Header */}
      <header className="h-16 bg-slate-800/90 border-b border-slate-700/50 flex items-center justify-between px-4 md:px-6 shrink-0">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-purple-500 to-purple-700 flex items-center justify-center">
            <Settings className="w-4 h-4 text-white" />
          </div>
          <div>
            <h1 className="text-sm font-bold text-white">Administration</h1>
            <p className="text-[10px] text-slate-400">Gérer l'ensemble du système</p>
          </div>
        </div>
        <button onClick={() => dispatch({ type: 'LOGOUT' })} className="p-2 text-slate-400 hover:text-white">
          <LogOut className="w-5 h-5" />
        </button>
      </header>

      {/* Tabs */}
      <div className="px-4 py-3 border-b border-slate-700/50 flex gap-2 overflow-x-auto shrink-0">
        {tabs.map(tab => (
          <button key={tab.id} onClick={() => setActiveTab(tab.id as any)}
            className={`px-4 py-2 rounded-xl text-sm font-medium whitespace-nowrap transition-colors flex items-center gap-2 ${
              activeTab === tab.id ? 'bg-purple-500 text-white' : 'bg-slate-800 text-slate-300 hover:bg-slate-700'
            }`}>
            <tab.icon className="w-4 h-4" />
            {tab.label}
          </button>
        ))}
      </div>

      {/* Content */}
      <div className="flex-1 overflow-y-auto p-4 md:p-6">
        {activeTab === 'products' && <ProductsManager />}
        {activeTab === 'tables' && <TablesManager />}
        {activeTab === 'servers' && <ServersManager />}
        {activeTab === 'tickets' && <TicketsManager />}
        {activeTab === 'format' && <FormatManager />}
        {activeTab === 'reports' && <ReportsView />}
        {activeTab === 'security' && <SecuritySettings />}
      </div>
    </div>
  );
}

// ============================================
// PRODUCTS MANAGER
// ============================================
function ProductsManager() {
  const { state, dispatch } = usePOS();
  const [editingItem, setEditingItem] = useState<MenuItem | null>(null);
  const [showForm, setShowForm] = useState(false);

  const handleSave = (item: MenuItem) => {
    if (state.menuItems.find(i => i.id === item.id)) {
      dispatch({ type: 'UPDATE_MENU_ITEM', payload: item });
    } else {
      dispatch({ type: 'ADD_MENU_ITEM', payload: item });
    }
    setShowForm(false);
    setEditingItem(null);
  };

  const handleDelete = (id: string) => {
    if (confirm('Supprimer ce produit ?')) {
      dispatch({ type: 'DELETE_MENU_ITEM', payload: id });
    }
  };

  return (
    <div>
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-xl font-bold text-white">Produits ({state.menuItems.length})</h2>
        <button onClick={() => { setEditingItem(null); setShowForm(true); }}
          className="px-4 py-2 bg-purple-500 hover:bg-purple-600 text-white rounded-xl font-medium flex items-center gap-2">
          <Plus className="w-4 h-4" /> Ajouter
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
        {state.menuItems.map(item => (
          <div key={item.id} className="bg-slate-800/50 border border-slate-700/50 rounded-xl p-4">
            <div className="flex items-start justify-between mb-2">
              <div className="flex items-center gap-2">
                <span className="text-2xl">{item.emoji}</span>
                <div>
                  <p className="font-medium text-white">{item.name}</p>
                  <p className="text-xs text-slate-400">{item.category}</p>
                </div>
              </div>
              <span className="text-lg font-bold" style={{ color: item.color }}>{item.price.toFixed(2)}€</span>
            </div>
            <div className="flex gap-2 mt-3">
              <button onClick={() => { setEditingItem(item); setShowForm(true); }}
                className="flex-1 px-3 py-1.5 bg-blue-500/20 hover:bg-blue-500/30 text-blue-400 rounded-lg text-sm flex items-center justify-center gap-1">
                <Edit className="w-3 h-3" /> Modifier
              </button>
              <button onClick={() => handleDelete(item.id)}
                className="px-3 py-1.5 bg-red-500/20 hover:bg-red-500/30 text-red-400 rounded-lg text-sm flex items-center justify-center gap-1">
                <Trash2 className="w-3 h-3" />
              </button>
            </div>
          </div>
        ))}
      </div>

      {showForm && (
        <ProductForm item={editingItem} onSave={handleSave} onClose={() => { setShowForm(false); setEditingItem(null); }} />
      )}
    </div>
  );
}

function ProductForm({ item, onSave, onClose }: { item: MenuItem | null; onSave: (item: MenuItem) => void; onClose: () => void }) {
  const [formData, setFormData] = useState<MenuItem>(item || {
    id: uuidv4(),
    name: '',
    price: 0,
    category: 'Plats',
    color: '#f59e0b',
    emoji: '🍽️',
    isFood: true,
  });

  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }}
      className="fixed inset-0 bg-black/60 flex items-center justify-center z-50 p-4" onClick={onClose}>
      <motion.div initial={{ scale: 0.9 }} animate={{ scale: 1 }}
        className="bg-slate-800 rounded-2xl border border-slate-700 p-6 w-full max-w-md" onClick={e => e.stopPropagation()}>
        <h3 className="text-xl font-bold text-white mb-4">{item ? 'Modifier' : 'Ajouter'} un produit</h3>
        
        <div className="space-y-3">
          <div>
            <label className="text-sm text-slate-400 mb-1 block">Nom</label>
            <input type="text" value={formData.name} onChange={e => setFormData({ ...formData, name: e.target.value })}
              className="w-full px-3 py-2 bg-slate-700 border border-slate-600 rounded-lg text-white focus:outline-none focus:border-purple-500" />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="text-sm text-slate-400 mb-1 block">Prix (€)</label>
              <input type="number" step="0.01" value={formData.price} onChange={e => setFormData({ ...formData, price: parseFloat(e.target.value) || 0 })}
                className="w-full px-3 py-2 bg-slate-700 border border-slate-600 rounded-lg text-white focus:outline-none focus:border-purple-500" />
            </div>
            <div>
              <label className="text-sm text-slate-400 mb-1 block">Emoji</label>
              <input type="text" value={formData.emoji} onChange={e => setFormData({ ...formData, emoji: e.target.value })}
                className="w-full px-3 py-2 bg-slate-700 border border-slate-600 rounded-lg text-white focus:outline-none focus:border-purple-500" />
            </div>
          </div>
          <div>
            <label className="text-sm text-slate-400 mb-1 block">Catégorie</label>
            <select value={formData.category} onChange={e => setFormData({ ...formData, category: e.target.value })}
              className="w-full px-3 py-2 bg-slate-700 border border-slate-600 rounded-lg text-white focus:outline-none focus:border-purple-500">
              <option>Entrées</option>
              <option>Plats</option>
              <option>Desserts</option>
              <option>Boissons</option>
              <option>Cocktails</option>
              <option>Vins</option>
              <option>Bières</option>
              <option>Cafés</option>
            </select>
          </div>
          <div>
            <label className="text-sm text-slate-400 mb-1 block">Type</label>
            <div className="flex gap-2">
              <button onClick={() => setFormData({ ...formData, isFood: true })}
                className={`flex-1 py-2 rounded-lg ${formData.isFood ? 'bg-purple-500 text-white' : 'bg-slate-700 text-slate-300'}`}>
                🍽️ Nourriture
              </button>
              <button onClick={() => setFormData({ ...formData, isFood: false })}
                className={`flex-1 py-2 rounded-lg ${!formData.isFood ? 'bg-purple-500 text-white' : 'bg-slate-700 text-slate-300'}`}>
                🥤 Boisson
              </button>
            </div>
          </div>
        </div>

        <div className="flex gap-3 mt-6">
          <button onClick={onClose} className="flex-1 py-2 bg-slate-700 hover:bg-slate-600 text-white rounded-xl">Annuler</button>
          <button onClick={() => onSave(formData)} className="flex-1 py-2 bg-purple-500 hover:bg-purple-600 text-white rounded-xl font-medium flex items-center justify-center gap-2">
            <Save className="w-4 h-4" /> Sauvegarder
          </button>
        </div>
      </motion.div>
    </motion.div>
  );
}

// ============================================
// TABLES MANAGER
// ============================================
function TablesManager() {
  const { state, dispatch } = usePOS();
  const [editingTable, setEditingTable] = useState<Table | null>(null);
  const [showForm, setShowForm] = useState(false);

  const handleSave = (table: Table) => {
    if (state.tables.find(t => t.id === table.id)) {
      dispatch({ type: 'UPDATE_TABLE', payload: table });
    } else {
      dispatch({ type: 'ADD_TABLE', payload: table });
    }
    setShowForm(false);
    setEditingTable(null);
  };

  const handleDelete = (id: string) => {
    if (confirm('Supprimer cette table ?')) {
      dispatch({ type: 'DELETE_TABLE', payload: id });
    }
  };

  return (
    <div>
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-xl font-bold text-white">Tables ({state.tables.length})</h2>
        <button onClick={() => { setEditingTable(null); setShowForm(true); }}
          className="px-4 py-2 bg-purple-500 hover:bg-purple-600 text-white rounded-xl font-medium flex items-center gap-2">
          <Plus className="w-4 h-4" /> Ajouter
        </button>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-3">
        {state.tables.map(table => (
          <div key={table.id} className="bg-slate-800/50 border border-slate-700/50 rounded-xl p-4 text-center">
            <p className="text-2xl font-bold text-white mb-1">{table.name}</p>
            <p className="text-xs text-slate-400 mb-3">{table.seats} places</p>
            <div className="flex gap-2">
              <button onClick={() => { setEditingTable(table); setShowForm(true); }}
                className="flex-1 px-2 py-1 bg-blue-500/20 hover:bg-blue-500/30 text-blue-400 rounded-lg text-xs">
                <Edit className="w-3 h-3 inline" />
              </button>
              <button onClick={() => handleDelete(table.id)}
                className="px-2 py-1 bg-red-500/20 hover:bg-red-500/30 text-red-400 rounded-lg text-xs">
                <Trash2 className="w-3 h-3 inline" />
              </button>
            </div>
          </div>
        ))}
      </div>

      {showForm && (
        <TableForm table={editingTable} onSave={handleSave} onClose={() => { setShowForm(false); setEditingTable(null); }} />
      )}
    </div>
  );
}

function TableForm({ table, onSave, onClose }: { table: Table | null; onSave: (table: Table) => void; onClose: () => void }) {
  const [formData, setFormData] = useState<Table>(table || {
    id: uuidv4(),
    name: '',
    seats: 4,
    status: 'FREE',
    ticketIds: [],
    totalToPay: 0,
    totalPaid: 0,
  });

  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }}
      className="fixed inset-0 bg-black/60 flex items-center justify-center z-50 p-4" onClick={onClose}>
      <motion.div initial={{ scale: 0.9 }} animate={{ scale: 1 }}
        className="bg-slate-800 rounded-2xl border border-slate-700 p-6 w-full max-w-md" onClick={e => e.stopPropagation()}>
        <h3 className="text-xl font-bold text-white mb-4">{table ? 'Modifier' : 'Ajouter'} une table</h3>
        
        <div className="space-y-3">
          <div>
            <label className="text-sm text-slate-400 mb-1 block">Nom</label>
            <input type="text" value={formData.name} onChange={e => setFormData({ ...formData, name: e.target.value })}
              className="w-full px-3 py-2 bg-slate-700 border border-slate-600 rounded-lg text-white focus:outline-none focus:border-purple-500" />
          </div>
          <div>
            <label className="text-sm text-slate-400 mb-1 block">Nombre de places</label>
            <input type="number" value={formData.seats} onChange={e => setFormData({ ...formData, seats: parseInt(e.target.value) || 1 })}
              className="w-full px-3 py-2 bg-slate-700 border border-slate-600 rounded-lg text-white focus:outline-none focus:border-purple-500" />
          </div>
        </div>

        <div className="flex gap-3 mt-6">
          <button onClick={onClose} className="flex-1 py-2 bg-slate-700 hover:bg-slate-600 text-white rounded-xl">Annuler</button>
          <button onClick={() => onSave(formData)} className="flex-1 py-2 bg-purple-500 hover:bg-purple-600 text-white rounded-xl font-medium flex items-center justify-center gap-2">
            <Save className="w-4 h-4" /> Sauvegarder
          </button>
        </div>
      </motion.div>
    </motion.div>
  );
}

// ============================================
// SERVERS MANAGER
// ============================================
function ServersManager() {
  const { state, dispatch } = usePOS();
  const [editingServer, setEditingServer] = useState<Server | null>(null);
  const [showForm, setShowForm] = useState(false);

  const handleSave = (server: Server) => {
    if (state.servers.find(s => s.id === server.id)) {
      dispatch({ type: 'UPDATE_SERVER', payload: server });
    } else {
      dispatch({ type: 'ADD_SERVER', payload: server });
    }
    setShowForm(false);
    setEditingServer(null);
  };

  const handleDelete = (id: string) => {
    if (confirm('Supprimer ce serveur ?')) {
      dispatch({ type: 'DELETE_SERVER', payload: id });
    }
  };

  return (
    <div>
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-xl font-bold text-white">Serveurs ({state.servers.length})</h2>
        <button onClick={() => { setEditingServer(null); setShowForm(true); }}
          className="px-4 py-2 bg-purple-500 hover:bg-purple-600 text-white rounded-xl font-medium flex items-center gap-2">
          <Plus className="w-4 h-4" /> Ajouter
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
        {state.servers.map(server => (
          <div key={server.id} className="bg-slate-800/50 border border-slate-700/50 rounded-xl p-4">
            <div className="flex items-center gap-3 mb-3">
              <div className="w-12 h-12 rounded-full flex items-center justify-center text-white text-lg font-bold"
                style={{ backgroundColor: server.color }}>
                {server.name[0]}
              </div>
              <div>
                <p className="font-medium text-white">{server.name}</p>
                <p className="text-xs text-slate-400">PIN: {server.pin}</p>
                <p className="text-xs text-slate-400">{server.role === 'admin' ? 'Admin' : 'Serveur'}</p>
              </div>
            </div>
            <div className="flex gap-2">
              <button onClick={() => { setEditingServer(server); setShowForm(true); }}
                className="flex-1 px-3 py-1.5 bg-blue-500/20 hover:bg-blue-500/30 text-blue-400 rounded-lg text-sm flex items-center justify-center gap-1">
                <Edit className="w-3 h-3" /> Modifier
              </button>
              <button onClick={() => handleDelete(server.id)}
                className="px-3 py-1.5 bg-red-500/20 hover:bg-red-500/30 text-red-400 rounded-lg text-sm flex items-center justify-center gap-1">
                <Trash2 className="w-3 h-3" />
              </button>
            </div>
          </div>
        ))}
      </div>

      {showForm && (
        <ServerForm server={editingServer} onSave={handleSave} onClose={() => { setShowForm(false); setEditingServer(null); }} />
      )}
    </div>
  );
}

function ServerForm({ server, onSave, onClose }: { server: Server | null; onSave: (server: Server) => void; onClose: () => void }) {
  const [formData, setFormData] = useState<Server>(server || {
    id: uuidv4(),
    name: '',
    pin: '',
    color: '#3b82f6',
    role: 'server',
  });

  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }}
      className="fixed inset-0 bg-black/60 flex items-center justify-center z-50 p-4" onClick={onClose}>
      <motion.div initial={{ scale: 0.9 }} animate={{ scale: 1 }}
        className="bg-slate-800 rounded-2xl border border-slate-700 p-6 w-full max-w-md" onClick={e => e.stopPropagation()}>
        <h3 className="text-xl font-bold text-white mb-4">{server ? 'Modifier' : 'Ajouter'} un serveur</h3>
        
        <div className="space-y-3">
          <div>
            <label className="text-sm text-slate-400 mb-1 block">Nom</label>
            <input type="text" value={formData.name} onChange={e => setFormData({ ...formData, name: e.target.value })}
              className="w-full px-3 py-2 bg-slate-700 border border-slate-600 rounded-lg text-white focus:outline-none focus:border-purple-500" />
          </div>
          <div>
            <label className="text-sm text-slate-400 mb-1 block">PIN</label>
            <input type="text" value={formData.pin} onChange={e => setFormData({ ...formData, pin: e.target.value })}
              className="w-full px-3 py-2 bg-slate-700 border border-slate-600 rounded-lg text-white focus:outline-none focus:border-purple-500" />
          </div>
          <div>
            <label className="text-sm text-slate-400 mb-1 block">Rôle</label>
            <div className="flex gap-2">
              <button onClick={() => setFormData({ ...formData, role: 'server' })}
                className={`flex-1 py-2 rounded-lg ${formData.role === 'server' ? 'bg-purple-500 text-white' : 'bg-slate-700 text-slate-300'}`}>
                Serveur
              </button>
              <button onClick={() => setFormData({ ...formData, role: 'admin' })}
                className={`flex-1 py-2 rounded-lg ${formData.role === 'admin' ? 'bg-purple-500 text-white' : 'bg-slate-700 text-slate-300'}`}>
                Admin
              </button>
            </div>
          </div>
        </div>

        <div className="flex gap-3 mt-6">
          <button onClick={onClose} className="flex-1 py-2 bg-slate-700 hover:bg-slate-600 text-white rounded-xl">Annuler</button>
          <button onClick={() => onSave(formData)} className="flex-1 py-2 bg-purple-500 hover:bg-purple-600 text-white rounded-xl font-medium flex items-center justify-center gap-2">
            <Save className="w-4 h-4" /> Sauvegarder
          </button>
        </div>
      </motion.div>
    </motion.div>
  );
}

// ============================================
// TICKETS MANAGER
// ============================================
function TicketsManager() {
  const { state } = usePOS();

  return (
    <div>
      <h2 className="text-xl font-bold text-white mb-4">Tickets ({state.tickets.length})</h2>
      
      <div className="space-y-3">
        {state.tickets.map(ticket => {
          const table = state.tables.find(t => t.id === ticket.tableId);
          return (
            <div key={ticket.id} className="bg-slate-800/50 border border-slate-700/50 rounded-xl p-4">
              <div className="flex items-start justify-between mb-3">
                <div>
                  <p className="font-medium text-white">Ticket #{ticket.id.slice(0, 8)}</p>
                  <p className="text-xs text-slate-400">{table?.name} • {ticket.serverName}</p>
                  <p className="text-xs text-slate-400">{new Date(ticket.createdAt).toLocaleString('fr-FR')}</p>
                </div>
                <div className="text-right">
                  <p className="text-lg font-bold text-emerald-400">{ticket.totalAmount.toFixed(2)}€</p>
                  <span className={`text-xs px-2 py-0.5 rounded-full ${
                    ticket.status === 'DRAFT' ? 'bg-amber-500/20 text-amber-400' :
                    ticket.status === 'OPEN' ? 'bg-blue-500/20 text-blue-400' :
                    ticket.status === 'PAID' ? 'bg-emerald-500/20 text-emerald-400' :
                    'bg-red-500/20 text-red-400'
                  }`}>
                    {ticket.status}
                  </span>
                </div>
              </div>
              <div className="text-xs text-slate-400">
                {ticket.items.length} articles • Payé: {ticket.paidAmount.toFixed(2)}€
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

// ============================================
// SECURITY SETTINGS
// ============================================
function SecuritySettings() {
  const { state, dispatch } = usePOS();
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  const adminServer = state.servers.find(s => s.role === 'admin');

  const handleChangePassword = () => {
    if (!adminServer) {
      setMessage({ type: 'error', text: 'Aucun administrateur trouvé' });
      return;
    }

    if (currentPassword !== adminServer.pin) {
      setMessage({ type: 'error', text: 'Mot de passe actuel incorrect' });
      setTimeout(() => setMessage(null), 3000);
      return;
    }

    if (newPassword.length < 4) {
      setMessage({ type: 'error', text: 'Le nouveau mot de passe doit contenir au moins 4 caractères' });
      setTimeout(() => setMessage(null), 3000);
      return;
    }

    if (newPassword !== confirmPassword) {
      setMessage({ type: 'error', text: 'Les mots de passe ne correspondent pas' });
      setTimeout(() => setMessage(null), 3000);
      return;
    }

    dispatch({
      type: 'UPDATE_SERVER',
      payload: { ...adminServer, pin: newPassword }
    });

    setMessage({ type: 'success', text: 'Mot de passe modifié avec succès' });
    setCurrentPassword('');
    setNewPassword('');
    setConfirmPassword('');
    setTimeout(() => setMessage(null), 3000);
  };

  return (
    <div>
      <h2 className="text-xl font-bold text-white mb-4">Sécurité</h2>

      <div className="bg-slate-800/50 border border-slate-700/50 rounded-xl p-6 mb-6">
        <div className="flex items-center gap-3 mb-4">
          <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-purple-500 to-purple-700 flex items-center justify-center">
            <Lock className="w-6 h-6 text-white" />
          </div>
          <div>
            <h3 className="text-lg font-bold text-white">Mot de passe administrateur</h3>
            <p className="text-sm text-slate-400">Modifier le mot de passe pour accéder aux paramètres</p>
          </div>
        </div>

        {message && (
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            className={`mb-4 p-3 rounded-lg ${
              message.type === 'success' ? 'bg-emerald-500/20 border border-emerald-500/50 text-emerald-400' :
              'bg-red-500/20 border border-red-500/50 text-red-400'
            }`}
          >
            {message.text}
          </motion.div>
        )}

        <div className="space-y-4">
          <div>
            <label className="text-sm text-slate-400 mb-1 block">Mot de passe actuel</label>
            <input
              type="password"
              value={currentPassword}
              onChange={e => setCurrentPassword(e.target.value)}
              className="w-full px-3 py-2 bg-slate-700 border border-slate-600 rounded-lg text-white focus:outline-none focus:border-purple-500"
              placeholder="••••"
            />
          </div>

          <div>
            <label className="text-sm text-slate-400 mb-1 block">Nouveau mot de passe</label>
            <input
              type="password"
              value={newPassword}
              onChange={e => setNewPassword(e.target.value)}
              className="w-full px-3 py-2 bg-slate-700 border border-slate-600 rounded-lg text-white focus:outline-none focus:border-purple-500"
              placeholder="••••"
            />
          </div>

          <div>
            <label className="text-sm text-slate-400 mb-1 block">Confirmer le nouveau mot de passe</label>
            <input
              type="password"
              value={confirmPassword}
              onChange={e => setConfirmPassword(e.target.value)}
              className="w-full px-3 py-2 bg-slate-700 border border-slate-600 rounded-lg text-white focus:outline-none focus:border-purple-500"
              placeholder="••••"
            />
          </div>

          <button
            onClick={handleChangePassword}
            disabled={!currentPassword || !newPassword || !confirmPassword}
            className="w-full py-3 bg-gradient-to-r from-purple-500 to-purple-600 hover:from-purple-600 hover:to-purple-700 disabled:from-slate-600 disabled:to-slate-700 text-white rounded-xl font-bold transition-all"
          >
            Modifier le mot de passe
          </button>
        </div>
      </div>

      <div className="bg-slate-800/50 border border-slate-700/50 rounded-xl p-6">
        <h3 className="text-lg font-bold text-white mb-4">Informations de sécurité</h3>
        <div className="space-y-3">
          <div className="flex items-center justify-between p-3 bg-slate-700/30 rounded-lg">
            <span className="text-sm text-slate-300">Administrateur actuel</span>
            <span className="text-sm font-medium text-white">{adminServer?.name || 'Non défini'}</span>
          </div>
          <div className="flex items-center justify-between p-3 bg-slate-700/30 rounded-lg">
            <span className="text-sm text-slate-300">Nombre de serveurs</span>
            <span className="text-sm font-medium text-white">{state.servers.filter(s => s.role === 'server').length}</span>
          </div>
          <div className="flex items-center justify-between p-3 bg-slate-700/30 rounded-lg">
            <span className="text-sm text-slate-300">Protection activée</span>
            <span className="text-sm font-medium text-emerald-400">✓ Oui</span>
          </div>
        </div>
      </div>

      <div className="bg-red-500/10 border border-red-500/30 rounded-xl p-6 mt-6">
        <h3 className="text-lg font-bold text-red-400 mb-4">Zone de danger</h3>
        <p className="text-sm text-slate-300 mb-4">
          Réinitialiser toutes les données supprimera tous les tickets, paiements et configurations. 
          Cette action est irréversible.
        </p>
        <button
          onClick={() => {
            if (confirm('Êtes-vous sûr de vouloir réinitialiser toutes les données ? Cette action est irréversible.')) {
              localStorage.removeItem('quickpos-state');
              window.location.reload();
            }
          }}
          className="w-full py-3 bg-red-500 hover:bg-red-600 text-white rounded-xl font-bold transition-colors"
        >
          Réinitialiser toutes les données
        </button>
      </div>
    </div>
  );
}

// ============================================
// FORMAT MANAGER
// ============================================
function FormatManager() {
  const { state, dispatch } = usePOS();
  const [format, setFormat] = useState(state.ticketFormat);

  const handleSave = () => {
    dispatch({ type: 'UPDATE_TICKET_FORMAT', payload: format });
  };

  return (
    <div>
      <h2 className="text-xl font-bold text-white mb-4">Format des tickets</h2>
      
      <div className="bg-slate-800/50 border border-slate-700/50 rounded-xl p-6 space-y-4">
        <div className="flex items-center justify-between">
          <span className="text-white">Afficher le logo</span>
          <input type="checkbox" checked={format.showLogo} onChange={e => setFormat({ ...format, showLogo: e.target.checked })}
            className="w-5 h-5" />
        </div>
        <div className="flex items-center justify-between">
          <span className="text-white">Afficher l'adresse</span>
          <input type="checkbox" checked={format.showAddress} onChange={e => setFormat({ ...format, showAddress: e.target.checked })}
            className="w-5 h-5" />
        </div>
        <div className="flex items-center justify-between">
          <span className="text-white">Afficher le téléphone</span>
          <input type="checkbox" checked={format.showPhone} onChange={e => setFormat({ ...format, showPhone: e.target.checked })}
            className="w-5 h-5" />
        </div>
        <div className="flex items-center justify-between">
          <span className="text-white">Afficher le serveur</span>
          <input type="checkbox" checked={format.showServer} onChange={e => setFormat({ ...format, showServer: e.target.checked })}
            className="w-5 h-5" />
        </div>
        <div className="flex items-center justify-between">
          <span className="text-white">Afficher la date</span>
          <input type="checkbox" checked={format.showDate} onChange={e => setFormat({ ...format, showDate: e.target.checked })}
            className="w-5 h-5" />
        </div>
        <div className="flex items-center justify-between">
          <span className="text-white">Afficher les articles</span>
          <input type="checkbox" checked={format.showItems} onChange={e => setFormat({ ...format, showItems: e.target.checked })}
            className="w-5 h-5" />
        </div>
        <div className="flex items-center justify-between">
          <span className="text-white">Afficher le total</span>
          <input type="checkbox" checked={format.showTotal} onChange={e => setFormat({ ...format, showTotal: e.target.checked })}
            className="w-5 h-5" />
        </div>
        <div className="flex items-center justify-between">
          <span className="text-white">Afficher le paiement</span>
          <input type="checkbox" checked={format.showPayment} onChange={e => setFormat({ ...format, showPayment: e.target.checked })}
            className="w-5 h-5" />
        </div>
        <div className="flex items-center justify-between">
          <span className="text-white">Afficher le footer</span>
          <input type="checkbox" checked={format.showFooter} onChange={e => setFormat({ ...format, showFooter: e.target.checked })}
            className="w-5 h-5" />
        </div>
        <div>
          <label className="text-sm text-slate-400 mb-1 block">Texte du footer</label>
          <input type="text" value={format.footerText} onChange={e => setFormat({ ...format, footerText: e.target.value })}
            className="w-full px-3 py-2 bg-slate-700 border border-slate-600 rounded-lg text-white focus:outline-none focus:border-purple-500" />
        </div>
      </div>

      <button onClick={handleSave} className="mt-4 px-6 py-3 bg-purple-500 hover:bg-purple-600 text-white rounded-xl font-medium flex items-center gap-2">
        <Save className="w-4 h-4" /> Sauvegarder le format
      </button>
    </div>
  );
}

// ============================================
// REPORTS VIEW
// ============================================
function ReportsView() {
  const { state } = usePOS();
  const [period, setPeriod] = useState<'today' | 'week' | 'month' | 'all'>('today');
  const [serverFilter, setServerFilter] = useState<string>('all');
  const [tableFilter, setTableFilter] = useState<string>('all');

  const paidTickets = state.tickets.filter(t => t.status === 'PAID');
  
  const filteredTickets = paidTickets.filter(ticket => {
    const ticketDate = new Date(ticket.closedAt || ticket.createdAt);
    const now = new Date();
    
    if (period === 'today') {
      if (ticketDate.toDateString() !== now.toDateString()) return false;
    } else if (period === 'week') {
      const weekAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
      if (ticketDate < weekAgo) return false;
    } else if (period === 'month') {
      const monthAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
      if (ticketDate < monthAgo) return false;
    }

    if (serverFilter !== 'all' && ticket.serverId !== serverFilter) return false;
    if (tableFilter !== 'all' && ticket.tableId !== tableFilter) return false;

    return true;
  });

  const totalRevenue = filteredTickets.reduce((sum, t) => sum + t.paidAmount, 0);
  const totalCash = filteredTickets.reduce((sum, t) => sum + t.payments.filter(p => p.method === 'CASH').reduce((s, p) => s + p.amount, 0), 0);
  const totalCard = filteredTickets.reduce((sum, t) => sum + t.payments.filter(p => p.method === 'CARD').reduce((s, p) => s + p.amount, 0), 0);
  const avgTicket = filteredTickets.length > 0 ? totalRevenue / filteredTickets.length : 0;

  const handleExport = () => {
    const csv = [
      ['Date', 'Table', 'Serveur', 'Total', 'Payé', 'Méthode'],
      ...filteredTickets.map(t => [
        new Date(t.closedAt || t.createdAt).toLocaleString('fr-FR'),
        state.tables.find(tb => tb.id === t.tableId)?.name || '',
        t.serverName,
        t.totalAmount.toFixed(2),
        t.paidAmount.toFixed(2),
        t.payments.map(p => p.method).join(', '),
      ])
    ].map(row => row.join(',')).join('\n');

    const blob = new Blob([csv], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `rapport-${period}-${new Date().toISOString().split('T')[0]}.csv`;
    a.click();
  };

  return (
    <div>
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-xl font-bold text-white">Rapports</h2>
        <button onClick={handleExport}
          className="px-4 py-2 bg-purple-500 hover:bg-purple-600 text-white rounded-xl font-medium flex items-center gap-2">
          <Download className="w-4 h-4" /> Exporter CSV
        </button>
      </div>

      {/* Filters */}
      <div className="bg-slate-800/50 border border-slate-700/50 rounded-xl p-4 mb-4">
        <div className="flex items-center gap-2 mb-3">
          <Filter className="w-4 h-4 text-slate-400" />
          <span className="text-sm font-medium text-white">Filtres</span>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
          <div>
            <label className="text-xs text-slate-400 mb-1 block">Période</label>
            <select value={period} onChange={e => setPeriod(e.target.value as any)}
              className="w-full px-3 py-2 bg-slate-700 border border-slate-600 rounded-lg text-white text-sm">
              <option value="today">Aujourd'hui</option>
              <option value="week">Cette semaine</option>
              <option value="month">Ce mois</option>
              <option value="all">Tout</option>
            </select>
          </div>
          <div>
            <label className="text-xs text-slate-400 mb-1 block">Serveur</label>
            <select value={serverFilter} onChange={e => setServerFilter(e.target.value)}
              className="w-full px-3 py-2 bg-slate-700 border border-slate-600 rounded-lg text-white text-sm">
              <option value="all">Tous</option>
              {state.servers.map(s => <option key={s.id} value={s.id}>{s.name}</option>)}
            </select>
          </div>
          <div>
            <label className="text-xs text-slate-400 mb-1 block">Table</label>
            <select value={tableFilter} onChange={e => setTableFilter(e.target.value)}
              className="w-full px-3 py-2 bg-slate-700 border border-slate-600 rounded-lg text-white text-sm">
              <option value="all">Toutes</option>
              {state.tables.map(t => <option key={t.id} value={t.id}>{t.name}</option>)}
            </select>
          </div>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-4">
        <div className="bg-slate-800/50 border border-slate-700/50 rounded-xl p-4">
          <p className="text-xs text-slate-400 mb-1">Chiffre d'affaires</p>
          <p className="text-2xl font-bold text-emerald-400">{totalRevenue.toFixed(2)}€</p>
        </div>
        <div className="bg-slate-800/50 border border-slate-700/50 rounded-xl p-4">
          <p className="text-xs text-slate-400 mb-1">Tickets</p>
          <p className="text-2xl font-bold text-white">{filteredTickets.length}</p>
        </div>
        <div className="bg-slate-800/50 border border-slate-700/50 rounded-xl p-4">
          <p className="text-xs text-slate-400 mb-1">Panier moyen</p>
          <p className="text-2xl font-bold text-blue-400">{avgTicket.toFixed(2)}€</p>
        </div>
        <div className="bg-slate-800/50 border border-slate-700/50 rounded-xl p-4">
          <p className="text-xs text-slate-400 mb-1">Espèces / Carte</p>
          <p className="text-sm font-bold text-white">{totalCash.toFixed(0)}€ / {totalCard.toFixed(0)}€</p>
        </div>
      </div>

      {/* Tickets list */}
      <div className="space-y-2">
        {filteredTickets.map(ticket => {
          const table = state.tables.find(t => t.id === ticket.tableId);
          return (
            <div key={ticket.id} className="bg-slate-800/50 border border-slate-700/50 rounded-xl p-3 flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-white">{table?.name} • {ticket.serverName}</p>
                <p className="text-xs text-slate-400">{new Date(ticket.closedAt || ticket.createdAt).toLocaleString('fr-FR')}</p>
              </div>
              <div className="text-right">
                <p className="text-lg font-bold text-emerald-400">{ticket.paidAmount.toFixed(2)}€</p>
                <p className="text-xs text-slate-400">{ticket.items.length} articles</p>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
