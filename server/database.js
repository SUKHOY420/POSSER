import Database from 'better-sqlite3';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';
import bcrypt from 'bcryptjs';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const db = new Database(join(__dirname, 'quickpos.db'));

// Configuration SQLite pour performance
db.pragma('journal_mode = WAL');
db.pragma('synchronous = NORMAL');
db.pragma('foreign_keys = ON');

// ============================================
// INITIALISATION DES TABLES
// ============================================
export function initializeDatabase() {
  db.exec(`
    -- Tables physiques
    CREATE TABLE IF NOT EXISTS tables (
      id TEXT PRIMARY KEY,
      name TEXT NOT NULL,
      seats INTEGER NOT NULL DEFAULT 4,
      status TEXT NOT NULL DEFAULT 'FREE',
      x REAL,
      y REAL,
      width REAL,
      height REAL,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
    );

    -- Serveurs / Utilisateurs
    CREATE TABLE IF NOT EXISTS servers (
      id TEXT PRIMARY KEY,
      name TEXT NOT NULL,
      pin TEXT NOT NULL,
      color TEXT NOT NULL DEFAULT '#3b82f6',
      role TEXT NOT NULL DEFAULT 'server',
      is_active INTEGER DEFAULT 1,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP
    );

    -- Menu / Produits
    CREATE TABLE IF NOT EXISTS menu_items (
      id TEXT PRIMARY KEY,
      name TEXT NOT NULL,
      price REAL NOT NULL,
      category TEXT NOT NULL,
      color TEXT NOT NULL,
      emoji TEXT NOT NULL,
      is_food INTEGER NOT NULL DEFAULT 1,
      stock REAL DEFAULT NULL,
      min_stock REAL DEFAULT NULL,
      track_stock INTEGER DEFAULT 0,
      is_available INTEGER DEFAULT 1,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
    );

    -- Sessions de caisse (ouverture/fermeture)
    CREATE TABLE IF NOT EXISTS sessions (
      id TEXT PRIMARY KEY,
      opened_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
      closed_at DATETIME,
      opened_by TEXT NOT NULL,
      closed_by TEXT,
      initial_cash REAL NOT NULL DEFAULT 0,
      final_cash REAL,
      total_revenue REAL DEFAULT 0,
      total_cash REAL DEFAULT 0,
      total_card REAL DEFAULT 0,
      ticket_count INTEGER DEFAULT 0,
      notes TEXT,
      FOREIGN KEY (opened_by) REFERENCES servers(id),
      FOREIGN KEY (closed_by) REFERENCES servers(id)
    );

    -- Tickets (additions)
    CREATE TABLE IF NOT EXISTS tickets (
      id TEXT PRIMARY KEY,
      table_id TEXT NOT NULL,
      session_id TEXT,
      server_id TEXT NOT NULL,
      server_name TEXT NOT NULL,
      status TEXT NOT NULL DEFAULT 'DRAFT',
      total_amount REAL NOT NULL DEFAULT 0,
      paid_amount REAL NOT NULL DEFAULT 0,
      discount REAL DEFAULT 0,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      validated_at DATETIME,
      closed_at DATETIME,
      FOREIGN KEY (table_id) REFERENCES tables(id),
      FOREIGN KEY (session_id) REFERENCES sessions(id),
      FOREIGN KEY (server_id) REFERENCES servers(id)
    );

    -- Lignes de ticket
    CREATE TABLE IF NOT EXISTS ticket_items (
      id TEXT PRIMARY KEY,
      ticket_id TEXT NOT NULL,
      menu_item_id TEXT NOT NULL,
      menu_item_name TEXT NOT NULL,
      menu_item_emoji TEXT NOT NULL,
      menu_item_price REAL NOT NULL,
      menu_item_category TEXT NOT NULL,
      is_food INTEGER NOT NULL,
      quantity INTEGER NOT NULL DEFAULT 1,
      notes TEXT DEFAULT '',
      modifiers TEXT DEFAULT '{}',
      status TEXT NOT NULL DEFAULT 'pending',
      validated_at DATETIME,
      sent_at DATETIME,
      ready_at DATETIME,
      served_at DATETIME,
      FOREIGN KEY (ticket_id) REFERENCES tickets(id),
      FOREIGN KEY (menu_item_id) REFERENCES menu_items(id)
    );

    -- Paiements
    CREATE TABLE IF NOT EXISTS payments (
      id TEXT PRIMARY KEY,
      ticket_id TEXT NOT NULL,
      amount REAL NOT NULL,
      method TEXT NOT NULL,
      transaction_ref TEXT,
      timestamp DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (ticket_id) REFERENCES tickets(id)
    );

    -- Historique des actions (audit log)
    CREATE TABLE IF NOT EXISTS audit_log (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      action TEXT NOT NULL,
      entity_type TEXT,
      entity_id TEXT,
      user_id TEXT,
      user_name TEXT,
      details TEXT,
      timestamp DATETIME DEFAULT CURRENT_TIMESTAMP
    );

    -- Index pour performance
    CREATE INDEX IF NOT EXISTS idx_tickets_table ON tickets(table_id);
    CREATE INDEX IF NOT EXISTS idx_tickets_session ON tickets(session_id);
    CREATE INDEX IF NOT EXISTS idx_tickets_status ON tickets(status);
    CREATE INDEX IF NOT EXISTS idx_ticket_items_ticket ON ticket_items(ticket_id);
    CREATE INDEX IF NOT EXISTS idx_payments_ticket ON payments(ticket_id);
    CREATE INDEX IF NOT EXISTS idx_audit_timestamp ON audit_log(timestamp);
  `);

  // Insérer les données par défaut si vide
  const tablesCount = db.prepare('SELECT COUNT(*) as count FROM tables').get();
  if (tablesCount.count === 0) {
    seedDefaultData();
  }
}

// ============================================
// DONNÉES PAR DÉFAUT
// ============================================
function seedDefaultData() {
  const insertTable = db.prepare('INSERT INTO tables (id, name, seats) VALUES (?, ?, ?)');
  const insertServer = db.prepare('INSERT INTO servers (id, name, pin, color, role) VALUES (?, ?, ?, ?, ?)');
  const insertMenuItem = db.prepare(`
    INSERT INTO menu_items (id, name, price, category, color, emoji, is_food)
    VALUES (?, ?, ?, ?, ?, ?, ?)
  `);

  // Tables
  const tables = [
    ['t1', 'T1', 2], ['t2', 'T2', 4], ['t3', 'T3', 4], ['t4', 'T4', 6],
    ['t5', 'T5', 2], ['t6', 'T6', 4], ['t7', 'T7', 4], ['t8', 'T8', 8],
    ['t9', 'T9', 2], ['t10', 'T10', 4], ['t11', 'T11', 6], ['t12', 'T12', 2],
    ['b1', 'Bar 1', 1], ['b2', 'Bar 2', 1], ['b3', 'Bar 3', 1], ['b4', 'Bar 4', 1],
  ];

  const insertTables = db.transaction((items) => {
    for (const item of items) insertTable.run(...item);
  });
  insertTables(tables);

  // Serveurs
  const servers = [
    ['srv-1', 'Marie', '1234', '#3b82f6', 'server'],
    ['srv-2', 'Thomas', '2345', '#8b5cf6', 'server'],
    ['srv-3', 'Julie', '3456', '#ec4899', 'server'],
    ['srv-4', 'Karim', '4567', '#f59e0b', 'server'],
    ['srv-admin', 'Admin', '0000', '#10b981', 'admin'],
  ];

  const insertServers = db.transaction((items) => {
    for (const item of items) insertServer.run(...item);
  });
  insertServers(servers);

  // Menu
  const menuItems = [
    ['1', 'Salade César', 9.50, 'Entrées', '#10b981', '🥗', 1],
    ['2', 'Soupe oignon', 7.00, 'Entrées', '#10b981', '🍲', 1],
    ['3', 'Bruschetta', 8.00, 'Entrées', '#10b981', '🍞', 1],
    ['4', 'Burger', 14.50, 'Plats', '#f59e0b', '🍔', 1],
    ['5', 'Entrecôte', 24.00, 'Plats', '#f59e0b', '🥩', 1],
    ['6', 'Pâtes Carbonara', 13.50, 'Plats', '#f59e0b', '🍝', 1],
    ['7', 'Pizza', 12.00, 'Plats', '#f59e0b', '🍕', 1],
    ['8', 'Tiramisu', 7.50, 'Desserts', '#ec4899', '🍰', 1],
    ['9', 'Fondant chocolat', 8.00, 'Desserts', '#ec4899', '🍫', 1],
    ['10', 'Coca-Cola', 3.50, 'Boissons', '#3b82f6', '🥤', 0],
    ['11', 'Eau', 2.50, 'Boissons', '#3b82f6', '💧', 0],
    ['12', 'Jus orange', 4.00, 'Boissons', '#3b82f6', '🍊', 0],
    ['13', 'Mojito', 9.00, 'Cocktails', '#8b5cf6', '🍹', 0],
    ['14', 'Margarita', 10.00, 'Cocktails', '#8b5cf6', '🍸', 0],
    ['15', 'Rouge Bordeaux', 6.00, 'Vins', '#ef4444', '🍷', 0],
    ['16', 'Blanc Chablis', 7.00, 'Vins', '#ef4444', '🥂', 0],
    ['17', 'Blonde pression', 4.50, 'Bières', '#f97316', '🍺', 0],
    ['18', 'IPA', 6.00, 'Bières', '#f97316', '🍺', 0],
    ['19', 'Espresso', 2.00, 'Cafés', '#92400e', '☕', 0],
    ['20', 'Cappuccino', 3.50, 'Cafés', '#92400e', '☕', 0],
  ];

  const insertMenuItems = db.transaction((items) => {
    for (const item of items) insertMenuItem.run(...item);
  });
  insertMenuItems(menuItems);

  console.log('✅ Données par défaut insérées');
}

// ============================================
// HELPERS
// ============================================
export function logAction(action, entityType, entityId, userId, userName, details) {
  db.prepare(`
    INSERT INTO audit_log (action, entity_type, entity_id, user_id, user_name, details)
    VALUES (?, ?, ?, ?, ?, ?)
  `).run(action, entityType, entityId, userId, userName, JSON.stringify(details));
}

export { db };
