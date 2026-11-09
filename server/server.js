import express from 'express';
import cors from 'cors';
import { createServer } from 'http';
import { WebSocketServer } from 'ws';
import { initializeDatabase, db } from './database.js';
import { v4 as uuidv4 } from 'uuid';

const app = express();
const PORT = process.env.PORT || 3001;

// Middleware
app.use(cors());
app.use(express.json());

// ============================================
// INITIALISATION
// ============================================
initializeDatabase();
console.log('✅ Base de données initialisée');

// ============================================
// WEBSOCKET - Synchronisation temps réel
// ============================================
const server = createServer(app);
const wss = new WebSocketServer({ server, path: '/ws' });

const clients = new Map(); // clientId -> { ws, type, serverName }

wss.on('connection', (ws, req) => {
  const clientId = uuidv4();
  const url = new URL(req.url, `http://${req.headers.host}`);
  const type = url.searchParams.get('type') || 'unknown';
  const serverName = url.searchParams.get('name') || '';

  clients.set(clientId, { ws, type, serverName });
  console.log(`🔌 Client connecté: ${type} (${serverName}) - ${clientId}`);

  // Envoyer l'état initial au client
  const initialState = getFullState();
  ws.send(JSON.stringify({ type: 'INIT', payload: initialState }));

  ws.on('message', (data) => {
    try {
      const message = JSON.parse(data);
      handleWebSocketMessage(clientId, message);
    } catch (e) {
      console.error('Erreur WebSocket:', e);
    }
  });

  ws.on('close', () => {
    clients.delete(clientId);
    console.log(`🔌 Client déconnecté: ${clientId}`);
  });
});

function broadcast(event, payload, excludeClientId = null) {
  const message = JSON.stringify({ type: event, payload });
  clients.forEach((client, id) => {
    if (id !== excludeClientId && client.ws.readyState === 1) {
      client.ws.send(message);
    }
  });
}

function handleWebSocketMessage(clientId, message) {
  const { type, payload } = message;
  const client = clients.get(clientId);

  switch (type) {
    case 'TICKET_UPDATE':
      broadcast('TICKET_UPDATE', payload, clientId);
      break;
    case 'TABLE_UPDATE':
      broadcast('TABLE_UPDATE', payload, clientId);
      break;
    case 'KITCHEN_NOTIFY':
      broadcast('KITCHEN_NOTIFY', payload, clientId);
      break;
    case 'BAR_NOTIFY':
      broadcast('BAR_NOTIFY', payload, clientId);
      break;
    case 'SERVER_NOTIFY':
      broadcast('SERVER_NOTIFY', payload, clientId);
      break;
  }
}

function getFullState() {
  const tables = db.prepare('SELECT * FROM tables').all();
  const servers = db.prepare('SELECT * FROM servers WHERE is_active = 1').all();
  const menuItems = db.prepare('SELECT * FROM menu_items WHERE is_available = 1').all();
  const tickets = db.prepare(`
    SELECT t.*, 
      (SELECT json_group_array(json_object(
        'id', ti.id,
        'menu_item_id', ti.menu_item_id,
        'menu_item_name', ti.menu_item_name,
        'menu_item_emoji', ti.menu_item_emoji,
        'menu_item_price', ti.menu_item_price,
        'menu_item_category', ti.menu_item_category,
        'is_food', ti.is_food,
        'quantity', ti.quantity,
        'notes', ti.notes,
        'modifiers', json(ti.modifiers),
        'status', ti.status,
        'validated_at', ti.validated_at,
        'sent_at', ti.sent_at
      )) FROM ticket_items ti WHERE ti.ticket_id = t.id) as items,
      (SELECT json_group_array(json_object(
        'id', p.id,
        'amount', p.amount,
        'method', p.method,
        'transaction_ref', p.transaction_ref,
        'timestamp', p.timestamp
      )) FROM payments p WHERE p.ticket_id = t.id) as payments
    FROM tickets t
    WHERE t.status != 'CANCELLED'
  `).all();

  const currentSession = db.prepare(`
    SELECT * FROM sessions WHERE closed_at IS NULL ORDER BY opened_at DESC LIMIT 1
  `).get();

  return { tables, servers, menuItems, tickets, currentSession };
}

// ============================================
// ROUTES API REST
// ============================================

// Health check
app.get('/api/health', (req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

// ----- TABLES -----
app.get('/api/tables', (req, res) => {
  const tables = db.prepare('SELECT * FROM tables').all();
  res.json(tables);
});

app.post('/api/tables', (req, res) => {
  const { id, name, seats } = req.body;
  const tableId = id || uuidv4();
  db.prepare('INSERT INTO tables (id, name, seats) VALUES (?, ?, ?)').run(tableId, name, seats);
  const table = db.prepare('SELECT * FROM tables WHERE id = ?').get(tableId);
  broadcast('TABLE_UPDATE', table);
  res.json(table);
});

app.put('/api/tables/:id', (req, res) => {
  const { name, seats, status } = req.body;
  db.prepare('UPDATE tables SET name = ?, seats = ?, status = ?, updated_at = CURRENT_TIMESTAMP WHERE id = ?')
    .run(name, seats, status, req.params.id);
  const table = db.prepare('SELECT * FROM tables WHERE id = ?').get(req.params.id);
  broadcast('TABLE_UPDATE', table);
  res.json(table);
});

app.delete('/api/tables/:id', (req, res) => {
  db.prepare('DELETE FROM tables WHERE id = ?').run(req.params.id);
  res.json({ success: true });
});

// ----- SERVERS -----
app.get('/api/servers', (req, res) => {
  const servers = db.prepare('SELECT * FROM servers WHERE is_active = 1').all();
  res.json(servers);
});

app.post('/api/servers/login', (req, res) => {
  const { pin } = req.body;
  const server = db.prepare('SELECT * FROM servers WHERE pin = ? AND is_active = 1').get(pin);
  if (server) {
    res.json(server);
  } else {
    res.status(401).json({ error: 'PIN incorrect' });
  }
});

app.post('/api/servers', (req, res) => {
  const { id, name, pin, color, role } = req.body;
  const serverId = id || uuidv4();
  db.prepare('INSERT INTO servers (id, name, pin, color, role) VALUES (?, ?, ?, ?, ?)')
    .run(serverId, name, pin, color, role);
  const server = db.prepare('SELECT * FROM servers WHERE id = ?').get(serverId);
  res.json(server);
});

app.put('/api/servers/:id', (req, res) => {
  const { name, pin, color, role } = req.body;
  db.prepare('UPDATE servers SET name = ?, pin = ?, color = ?, role = ? WHERE id = ?')
    .run(name, pin, color, role, req.params.id);
  const server = db.prepare('SELECT * FROM servers WHERE id = ?').get(req.params.id);
  res.json(server);
});

app.delete('/api/servers/:id', (req, res) => {
  db.prepare('UPDATE servers SET is_active = 0 WHERE id = ?').run(req.params.id);
  res.json({ success: true });
});

// ----- MENU ITEMS -----
app.get('/api/menu', (req, res) => {
  const items = db.prepare('SELECT * FROM menu_items WHERE is_available = 1').all();
  res.json(items);
});

app.post('/api/menu', (req, res) => {
  const { id, name, price, category, color, emoji, is_food } = req.body;
  const itemId = id || uuidv4();
  db.prepare(`
    INSERT INTO menu_items (id, name, price, category, color, emoji, is_food)
    VALUES (?, ?, ?, ?, ?, ?, ?)
  `).run(itemId, name, price, category, color, emoji, is_food ? 1 : 0);
  const item = db.prepare('SELECT * FROM menu_items WHERE id = ?').get(itemId);
  res.json(item);
});

app.put('/api/menu/:id', (req, res) => {
  const { name, price, category, color, emoji, is_food, stock, track_stock } = req.body;
  db.prepare(`
    UPDATE menu_items SET name = ?, price = ?, category = ?, color = ?, emoji = ?,
    is_food = ?, stock = ?, track_stock = ?, updated_at = CURRENT_TIMESTAMP
    WHERE id = ?
  `).run(name, price, category, color, emoji, is_food ? 1 : 0, stock, track_stock ? 1 : 0, req.params.id);
  const item = db.prepare('SELECT * FROM menu_items WHERE id = ?').get(req.params.id);
  res.json(item);
});

app.delete('/api/menu/:id', (req, res) => {
  db.prepare('UPDATE menu_items SET is_available = 0 WHERE id = ?').run(req.params.id);
  res.json({ success: true });
});

// ----- SESSIONS -----
app.get('/api/sessions', (req, res) => {
  const sessions = db.prepare('SELECT * FROM sessions ORDER BY opened_at DESC LIMIT 50').all();
  res.json(sessions);
});

app.get('/api/sessions/current', (req, res) => {
  const session = db.prepare('SELECT * FROM sessions WHERE closed_at IS NULL ORDER BY opened_at DESC LIMIT 1').get();
  res.json(session || null);
});

app.post('/api/sessions/open', (req, res) => {
  const { opened_by, initial_cash } = req.body;
  const sessionId = uuidv4();
  db.prepare(`
    INSERT INTO sessions (id, opened_by, initial_cash)
    VALUES (?, ?, ?)
  `).run(sessionId, opened_by, initial_cash || 0);
  const session = db.prepare('SELECT * FROM sessions WHERE id = ?').get(sessionId);
  broadcast('SESSION_UPDATE', session);
  res.json(session);
});

app.post('/api/sessions/:id/close', (req, res) => {
  const { closed_by, final_cash, notes } = req.body;
  const sessionId = req.params.id;
  
  // Calculer les totaux de la session
  const stats = db.prepare(`
    SELECT 
      COUNT(DISTINCT t.id) as ticket_count,
      COALESCE(SUM(t.paid_amount), 0) as total_revenue,
      COALESCE(SUM(CASE WHEN p.method = 'CASH' THEN p.amount ELSE 0 END), 0) as total_cash,
      COALESCE(SUM(CASE WHEN p.method = 'CARD' THEN p.amount ELSE 0 END), 0) as total_card
    FROM tickets t
    LEFT JOIN payments p ON p.ticket_id = t.id
    WHERE t.session_id = ?
  `).get(sessionId);

  db.prepare(`
    UPDATE sessions SET 
      closed_at = CURRENT_TIMESTAMP,
      closed_by = ?,
      final_cash = ?,
      total_revenue = ?,
      total_cash = ?,
      total_card = ?,
      ticket_count = ?,
      notes = ?
    WHERE id = ?
  `).run(
    closed_by, final_cash,
    stats.total_revenue, stats.total_cash, stats.total_card,
    stats.ticket_count, notes, sessionId
  );

  const session = db.prepare('SELECT * FROM sessions WHERE id = ?').get(sessionId);
  broadcast('SESSION_UPDATE', session);
  res.json(session);
});

// ----- TICKETS -----
app.get('/api/tickets', (req, res) => {
  const { status, table_id, server_id, session_id } = req.query;
  let query = 'SELECT * FROM tickets WHERE status != ?';
  const params = ['CANCELLED'];

  if (status) { query += ' AND status = ?'; params.push(status); }
  if (table_id) { query += ' AND table_id = ?'; params.push(table_id); }
  if (server_id) { query += ' AND server_id = ?'; params.push(server_id); }
  if (session_id) { query += ' AND session_id = ?'; params.push(session_id); }

  query += ' ORDER BY created_at DESC';
  const tickets = db.prepare(query).all(...params);
  res.json(tickets);
});

app.get('/api/tickets/:id', (req, res) => {
  const ticket = db.prepare('SELECT * FROM tickets WHERE id = ?').get(req.params.id);
  if (!ticket) return res.status(404).json({ error: 'Ticket non trouvé' });

  const items = db.prepare('SELECT * FROM ticket_items WHERE ticket_id = ?').all(req.params.id);
  const payments = db.prepare('SELECT * FROM payments WHERE ticket_id = ?').all(req.params.id);

  res.json({ ...ticket, items, payments });
});

app.post('/api/tickets', (req, res) => {
  const { table_id, server_id, server_name, session_id } = req.body;
  const ticketId = uuidv4();
  
  db.prepare(`
    INSERT INTO tickets (id, table_id, server_id, server_name, session_id)
    VALUES (?, ?, ?, ?, ?)
  `).run(ticketId, table_id, server_id, server_name, session_id);

  // Mettre à jour le statut de la table
  db.prepare("UPDATE tables SET status = 'OCCUPIED' WHERE id = ?").run(table_id);

  const ticket = db.prepare('SELECT * FROM tickets WHERE id = ?').get(ticketId);
  const table = db.prepare('SELECT * FROM tables WHERE id = ?').get(table_id);

  broadcast('TICKET_UPDATE', ticket);
  broadcast('TABLE_UPDATE', table);

  res.json(ticket);
});

app.post('/api/tickets/:id/items', (req, res) => {
  const { menu_item_id, menu_item_name, menu_item_emoji, menu_item_price, menu_item_category, is_food, quantity, notes, modifiers } = req.body;
  const itemId = uuidv4();

  db.prepare(`
    INSERT INTO ticket_items (id, ticket_id, menu_item_id, menu_item_name, menu_item_emoji, menu_item_price, menu_item_category, is_food, quantity, notes, modifiers)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
  `).run(itemId, req.params.id, menu_item_id, menu_item_name, menu_item_emoji, menu_item_price, menu_item_category, is_food ? 1 : 0, quantity || 1, notes || '', JSON.stringify(modifiers || {}));

  // Recalculer le total du ticket
  recalcTicketTotal(req.params.id);

  const ticket = getTicketWithDetails(req.params.id);
  broadcast('TICKET_UPDATE', ticket);
  res.json(ticket);
});

app.put('/api/tickets/:ticketId/items/:itemId', (req, res) => {
  const { quantity, notes, status } = req.body;
  
  if (quantity !== undefined) {
    db.prepare('UPDATE ticket_items SET quantity = ? WHERE id = ?').run(quantity, req.params.itemId);
  }
  if (notes !== undefined) {
    db.prepare('UPDATE ticket_items SET notes = ? WHERE id = ?').run(notes, req.params.itemId);
  }
  if (status !== undefined) {
    const timestampField = status === 'validated' ? 'validated_at' :
                          status === 'sent' ? 'sent_at' :
                          status === 'ready' ? 'ready_at' :
                          status === 'served' ? 'served_at' : null;
    
    if (timestampField) {
      db.prepare(`UPDATE ticket_items SET status = ?, ${timestampField} = CURRENT_TIMESTAMP WHERE id = ?`)
        .run(status, req.params.itemId);
    } else {
      db.prepare('UPDATE ticket_items SET status = ? WHERE id = ?').run(status, req.params.itemId);
    }
  }

  recalcTicketTotal(req.params.ticketId);
  const ticket = getTicketWithDetails(req.params.ticketId);
  broadcast('TICKET_UPDATE', ticket);
  res.json(ticket);
});

app.delete('/api/tickets/:ticketId/items/:itemId', (req, res) => {
  db.prepare('DELETE FROM ticket_items WHERE id = ?').run(req.params.itemId);
  recalcTicketTotal(req.params.ticketId);
  const ticket = getTicketWithDetails(req.params.ticketId);
  broadcast('TICKET_UPDATE', ticket);
  res.json(ticket);
});

app.post('/api/tickets/:id/validate', (req, res) => {
  db.prepare(`
    UPDATE tickets SET status = 'OPEN', validated_at = CURRENT_TIMESTAMP WHERE id = ?
  `).run(req.params.id);
  
  db.prepare(`
    UPDATE ticket_items SET status = 'validated', validated_at = CURRENT_TIMESTAMP
    WHERE ticket_id = ? AND status = 'pending'
  `).run(req.params.id);

  const ticket = getTicketWithDetails(req.params.id);
  broadcast('TICKET_UPDATE', ticket);
  res.json(ticket);
});

app.post('/api/tickets/:id/send-to-kitchen', (req, res) => {
  db.prepare(`
    UPDATE ticket_items SET status = 'sent', sent_at = CURRENT_TIMESTAMP
    WHERE ticket_id = ? AND is_food = 1 AND status = 'validated'
  `).run(req.params.id);

  const ticket = getTicketWithDetails(req.params.id);
  const foodCount = ticket.items.filter(i => i.is_food && i.status === 'sent').length;
  const drinkCount = ticket.items.filter(i => !i.is_food && i.status === 'validated').length;

  broadcast('TICKET_UPDATE', ticket);
  if (foodCount > 0) broadcast('KITCHEN_NOTIFY', { message: `Commande envoyée: ${foodCount} plats` });
  if (drinkCount > 0) broadcast('BAR_NOTIFY', { message: `Commande envoyée: ${drinkCount} boissons` });

  res.json(ticket);
});

app.post('/api/tickets/:ticketId/payments', (req, res) => {
  const { amount, method, transaction_ref } = req.body;
  const paymentId = uuidv4();

  db.prepare(`
    INSERT INTO payments (id, ticket_id, amount, method, transaction_ref)
    VALUES (?, ?, ?, ?, ?)
  `).run(paymentId, req.params.ticketId, amount, method, transaction_ref);

  // Mettre à jour paid_amount
  const totalPaid = db.prepare('SELECT SUM(amount) as total FROM payments WHERE ticket_id = ?').get(req.params.ticketId).total;
  const ticket = db.prepare('SELECT * FROM tickets WHERE id = ?').get(req.params.ticketId);
  
  const isFullyPaid = totalPaid >= ticket.total_amount;
  db.prepare(`
    UPDATE tickets SET paid_amount = ?, status = ?, closed_at = ?
    WHERE id = ?
  `).run(totalPaid, isFullyPaid ? 'PAID' : ticket.status, isFullyPaid ? new Date().toISOString() : null, req.params.ticketId);

  // Mettre à jour le statut de la table
  recalcTableStatus(ticket.table_id);

  const updatedTicket = getTicketWithDetails(req.params.ticketId);
  const table = db.prepare('SELECT * FROM tables WHERE id = ?').get(ticket.table_id);

  broadcast('TICKET_UPDATE', updatedTicket);
  broadcast('TABLE_UPDATE', table);

  res.json(updatedTicket);
});

app.post('/api/tickets/:id/close', (req, res) => {
  const ticket = db.prepare('SELECT * FROM tickets WHERE id = ?').get(req.params.id);
  if (!ticket) return res.status(404).json({ error: 'Ticket non trouvé' });

  db.prepare("UPDATE tables SET status = 'FREE' WHERE id = ?").run(ticket.table_id);
  const table = db.prepare('SELECT * FROM tables WHERE id = ?').get(ticket.table_id);
  
  broadcast('TABLE_UPDATE', table);
  res.json({ success: true });
});

// ----- REPORTS -----
app.get('/api/reports/summary', (req, res) => {
  const { session_id, server_id, from_date, to_date } = req.query;
  
  let query = `
    SELECT 
      COUNT(DISTINCT t.id) as ticket_count,
      COALESCE(SUM(t.total_amount), 0) as total_revenue,
      COALESCE(SUM(t.paid_amount), 0) as total_paid,
      COALESCE(SUM(CASE WHEN p.method = 'CASH' THEN p.amount ELSE 0 END), 0) as total_cash,
      COALESCE(SUM(CASE WHEN p.method = 'CARD' THEN p.amount ELSE 0 END), 0) as total_card
    FROM tickets t
    LEFT JOIN payments p ON p.ticket_id = t.id
    WHERE t.status = 'PAID'
  `;
  const params = [];

  if (session_id) { query += ' AND t.session_id = ?'; params.push(session_id); }
  if (server_id) { query += ' AND t.server_id = ?'; params.push(server_id); }

  const summary = db.prepare(query).get(...params);

  // Par serveur
  const byServer = db.prepare(`
    SELECT t.server_id, t.server_name,
      COUNT(DISTINCT t.id) as ticket_count,
      COALESCE(SUM(t.paid_amount), 0) as revenue
    FROM tickets t
    WHERE t.status = 'PAID'
    GROUP BY t.server_id
  `).all();

  // Par catégorie
  const byCategory = db.prepare(`
    SELECT ti.menu_item_category,
      SUM(ti.quantity) as quantity,
      SUM(ti.menu_item_price * ti.quantity) as revenue
    FROM ticket_items ti
    JOIN tickets t ON t.id = ti.ticket_id
    WHERE t.status = 'PAID'
    GROUP BY ti.menu_item_category
  `).all();

  res.json({ summary, byServer, byCategory });
});

// ============================================
// HELPERS
// ============================================
function recalcTicketTotal(ticketId) {
  const result = db.prepare(`
    SELECT SUM(menu_item_price * quantity) as total
    FROM ticket_items WHERE ticket_id = ?
  `).get(ticketId);

  db.prepare('UPDATE tickets SET total_amount = ? WHERE id = ?')
    .run(result.total || 0, ticketId);
}

function getTicketWithDetails(ticketId) {
  const ticket = db.prepare('SELECT * FROM tickets WHERE id = ?').get(ticketId);
  if (!ticket) return null;

  const items = db.prepare('SELECT * FROM ticket_items WHERE ticket_id = ?').all(ticketId);
  const payments = db.prepare('SELECT * FROM payments WHERE ticket_id = ?').all(ticketId);

  return { ...ticket, items, payments };
}

function recalcTableStatus(tableId) {
  const tickets = db.prepare(`
    SELECT * FROM tickets WHERE table_id = ? AND status != 'CANCELLED'
  `).all(tableId);

  let totalToPay = 0;
  let totalPaid = 0;
  let hasOpenTickets = false;

  tickets.forEach(ticket => {
    totalToPay += ticket.total_amount;
    totalPaid += ticket.paid_amount;
    if (ticket.status === 'OPEN' || ticket.status === 'DRAFT') hasOpenTickets = true;
  });

  let newStatus;
  if (tickets.length === 0) {
    newStatus = 'FREE';
  } else if (!hasOpenTickets && totalPaid >= totalToPay && totalToPay > 0) {
    newStatus = 'FREE';
  } else if (totalPaid > 0 && totalPaid < totalToPay) {
    newStatus = 'PARTIALLY_PAID';
  } else if (hasOpenTickets && totalPaid === 0) {
    newStatus = 'OCCUPIED';
  } else {
    newStatus = 'OCCUPIED';
  }

  db.prepare('UPDATE tables SET status = ? WHERE id = ?').run(newStatus, tableId);
}

// ============================================
// DÉMARRAGE
// ============================================
server.listen(PORT, () => {
  console.log(`
╔═══════════════════════════════════════════════════╗
║                                                   ║
║   🚀 QuickPOS Pro Backend                         ║
║                                                   ║
║   📡 API:      http://localhost:${PORT}              ║
║   🔌 WebSocket: ws://localhost:${PORT}/ws           ║
║                                                   ║
║   ✅ Serveur démarré avec succès                  ║
║                                                   ║
╚═══════════════════════════════════════════════════╝
  `);
});
