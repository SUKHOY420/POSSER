// ============================================
// API CLIENT - QuickPOS Pro
// ============================================

const API_URL = 'http://localhost:3001/api';
const WS_URL = 'ws://localhost:3001/ws';

let ws: WebSocket | null = null;
const wsListeners: Map<string, Set<Function>> = new Map();
let reconnectAttempts = 0;
const MAX_RECONNECT_ATTEMPTS = 10;

// ============================================
// WEBSOCKET
// ============================================
export function connectWebSocket(type: string, serverName: string = '') {
  if (ws && ws.readyState === WebSocket.OPEN) return;

  try {
    ws = new WebSocket(`${WS_URL}?type=${type}&name=${encodeURIComponent(serverName)}`);

    ws.onopen = () => {
      console.log(`[WS] ✅ Connecté au serveur (${type})`);
      reconnectAttempts = 0;
    };

    ws.onmessage = (event) => {
      try {
        const message = JSON.parse(event.data);
        const listeners = wsListeners.get(message.type);
        if (listeners) {
          listeners.forEach(cb => cb(message.payload));
        }
      } catch (e) {
        console.error('[WS] Erreur parsing message:', e);
      }
    };

    ws.onclose = () => {
      console.log('[WS] 🔌 Déconnecté du serveur');
      attemptReconnect(type, serverName);
    };

    ws.onerror = () => {
      console.error('[WS] ❌ Erreur de connexion');
    };
  } catch (e) {
    console.error('[WS] Impossible de se connecter:', e);
  }
}

function attemptReconnect(type: string, serverName: string) {
  if (reconnectAttempts >= MAX_RECONNECT_ATTEMPTS) {
    console.error('[WS] Nombre max de tentatives atteint');
    return;
  }
  reconnectAttempts++;
  const delay = Math.min(1000 * Math.pow(2, reconnectAttempts), 30000);
  console.log(`[WS] Reconnexion ${reconnectAttempts}/${MAX_RECONNECT_ATTEMPTS} dans ${delay}ms`);
  setTimeout(() => connectWebSocket(type, serverName), delay);
}

export function sendWS(type: string, payload: any) {
  if (ws && ws.readyState === WebSocket.OPEN) {
    ws.send(JSON.stringify({ type, payload }));
  }
}

export function onWS(type: string, callback: Function): () => void {
  if (!wsListeners.has(type)) {
    wsListeners.set(type, new Set());
  }
  wsListeners.get(type)!.add(callback);
  return () => {
    wsListeners.get(type)?.delete(callback);
  };
}

export function disconnectWS() {
  if (ws) {
    ws.close();
    ws = null;
  }
}

// ============================================
// API REST
// ============================================
async function request<T>(endpoint: string, options: RequestInit = {}): Promise<T> {
  const url = `${API_URL}${endpoint}`;
  const response = await fetch(url, {
    ...options,
    headers: {
      'Content-Type': 'application/json',
      ...options.headers,
    },
  });

  if (!response.ok) {
    const error = await response.json().catch(() => ({ error: 'Erreur serveur' }));
    throw new Error(error.error || `HTTP ${response.status}`);
  }

  return response.json();
}

// ----- TABLES -----
export const tablesApi = {
  getAll: () => request<any[]>('/tables'),
  create: (data: any) => request<any>('/tables', { method: 'POST', body: JSON.stringify(data) }),
  update: (id: string, data: any) => request<any>(`/tables/${id}`, { method: 'PUT', body: JSON.stringify(data) }),
  delete: (id: string) => request<any>(`/tables/${id}`, { method: 'DELETE' }),
};

// ----- SERVERS -----
export const serversApi = {
  getAll: () => request<any[]>('/servers'),
  login: (pin: string) => request<any>('/servers/login', { method: 'POST', body: JSON.stringify({ pin }) }),
  create: (data: any) => request<any>('/servers', { method: 'POST', body: JSON.stringify(data) }),
  update: (id: string, data: any) => request<any>(`/servers/${id}`, { method: 'PUT', body: JSON.stringify(data) }),
  delete: (id: string) => request<any>(`/servers/${id}`, { method: 'DELETE' }),
};

// ----- MENU -----
export const menuApi = {
  getAll: () => request<any[]>('/menu'),
  create: (data: any) => request<any>('/menu', { method: 'POST', body: JSON.stringify(data) }),
  update: (id: string, data: any) => request<any>(`/menu/${id}`, { method: 'PUT', body: JSON.stringify(data) }),
  delete: (id: string) => request<any>(`/menu/${id}`, { method: 'DELETE' }),
};

// ----- SESSIONS -----
export const sessionsApi = {
  getAll: () => request<any[]>('/sessions'),
  getCurrent: () => request<any>('/sessions/current'),
  open: (data: any) => request<any>('/sessions/open', { method: 'POST', body: JSON.stringify(data) }),
  close: (id: string, data: any) => request<any>(`/sessions/${id}/close`, { method: 'POST', body: JSON.stringify(data) }),
};

// ----- TICKETS -----
export const ticketsApi = {
  getAll: (filters?: any) => {
    const params = new URLSearchParams(filters || {}).toString();
    return request<any[]>(`/tickets${params ? '?' + params : ''}`);
  },
  get: (id: string) => request<any>(`/tickets/${id}`),
  create: (data: any) => request<any>('/tickets', { method: 'POST', body: JSON.stringify(data) }),
  addItem: (ticketId: string, data: any) => request<any>(`/tickets/${ticketId}/items`, { method: 'POST', body: JSON.stringify(data) }),
  updateItem: (ticketId: string, itemId: string, data: any) =>
    request<any>(`/tickets/${ticketId}/items/${itemId}`, { method: 'PUT', body: JSON.stringify(data) }),
  deleteItem: (ticketId: string, itemId: string) =>
    request<any>(`/tickets/${ticketId}/items/${itemId}`, { method: 'DELETE' }),
  validate: (id: string) => request<any>(`/tickets/${id}/validate`, { method: 'POST' }),
  sendToKitchen: (id: string) => request<any>(`/tickets/${id}/send-to-kitchen`, { method: 'POST' }),
  addPayment: (ticketId: string, data: any) =>
    request<any>(`/tickets/${ticketId}/payments`, { method: 'POST', body: JSON.stringify(data) }),
  close: (id: string) => request<any>(`/tickets/${id}/close`, { method: 'POST' }),
};

// ----- REPORTS -----
export const reportsApi = {
  getSummary: (filters?: any) => {
    const params = new URLSearchParams(filters || {}).toString();
    return request<any>(`/reports/summary${params ? '?' + params : ''}`);
  },
};

// ----- HEALTH -----
export const healthApi = {
  check: () => request<{ status: string }>('/health'),
};

// ============================================
// CONNECTION STATUS
// ============================================
export function isBackendAvailable(): Promise<boolean> {
  return healthApi.check()
    .then(() => true)
    .catch(() => false);
}
