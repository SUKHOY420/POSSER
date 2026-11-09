# 🚀 QuickPOS Pro - Backend

Backend Node.js/Express avec SQLite et WebSocket pour QuickPOS Pro.

## 📦 Installation

```bash
cd server
npm install
```

## 🏃 Démarrage

### Mode développement (avec hot-reload)
```bash
npm run dev
```

### Mode production
```bash
npm start
```

Le serveur démarre sur `http://localhost:3001`

## 🔌 Connexion Frontend

Le frontend se connecte automatiquement au backend via :
- **API REST** : `http://localhost:3001/api`
- **WebSocket** : `ws://localhost:3001/ws`

## 📡 API REST

### Tables
- `GET /api/tables` - Liste des tables
- `POST /api/tables` - Créer une table
- `PUT /api/tables/:id` - Modifier une table
- `DELETE /api/tables/:id` - Supprimer une table

### Serveurs
- `GET /api/servers` - Liste des serveurs
- `POST /api/servers/login` - Connexion par PIN
- `POST /api/servers` - Créer un serveur
- `PUT /api/servers/:id` - Modifier un serveur
- `DELETE /api/servers/:id` - Désactiver un serveur

### Menu
- `GET /api/menu` - Liste des produits
- `POST /api/menu` - Créer un produit
- `PUT /api/menu/:id` - Modifier un produit
- `DELETE /api/menu/:id` - Désactiver un produit

### Sessions
- `GET /api/sessions` - Historique des sessions
- `GET /api/sessions/current` - Session en cours
- `POST /api/sessions/open` - Ouvrir une session
- `POST /api/sessions/:id/close` - Fermer une session

### Tickets
- `GET /api/tickets` - Liste des tickets (filtres: status, table_id, server_id, session_id)
- `GET /api/tickets/:id` - Détail d'un ticket
- `POST /api/tickets` - Créer un ticket
- `POST /api/tickets/:id/items` - Ajouter un article
- `PUT /api/tickets/:ticketId/items/:itemId` - Modifier un article
- `DELETE /api/tickets/:ticketId/items/:itemId` - Supprimer un article
- `POST /api/tickets/:id/validate` - Valider un ticket
- `POST /api/tickets/:id/send-to-kitchen` - Envoyer en cuisine
- `POST /api/tickets/:ticketId/payments` - Ajouter un paiement
- `POST /api/tickets/:id/close` - Fermer un ticket

### Rapports
- `GET /api/reports/summary` - Rapport global (filtres: session_id, server_id, from_date, to_date)

### Santé
- `GET /api/health` - Vérifier l'état du serveur

## 🔌 WebSocket

### Connexion
```javascript
const ws = new WebSocket('ws://localhost:3001/ws?type=main&name=Caisse');
```

Types de postes :
- `main` - Caisse principale
- `kitchen` - Écran cuisine
- `bar` - Écran bar
- `server` - Tablette serveur
- `admin` - Administration

### Événements reçus
- `INIT` - État initial complet
- `TICKET_UPDATE` - Mise à jour d'un ticket
- `TABLE_UPDATE` - Mise à jour d'une table
- `KITCHEN_NOTIFY` - Notification cuisine
- `BAR_NOTIFY` - Notification bar
- `SERVER_NOTIFY` - Notification serveur
- `SESSION_UPDATE` - Mise à jour de session

### Événements envoyés
```javascript
ws.send(JSON.stringify({
  type: 'TICKET_UPDATE',
  payload: { /* ticket data */ }
}));
```

## 🗄️ Base de données

SQLite avec le fichier `quickpos.db` (créé automatiquement).

### Tables principales
- `tables` - Tables physiques
- `servers` - Serveurs/utilisateurs
- `menu_items` - Produits du menu
- `sessions` - Sessions de caisse
- `tickets` - Tickets/additions
- `ticket_items` - Lignes de ticket
- `payments` - Paiements
- `audit_log` - Journal d'audit

### Données par défaut
- 16 tables (12 salles + 4 bar)
- 5 serveurs (4 serveurs + 1 admin)
- 20 produits (nourriture + boissons)

## 🔒 Sécurité

- Authentification par PIN pour les serveurs
- Journal d'audit de toutes les actions
- Validation des données côté serveur

## 📊 Fonctionnalités

✅ Synchronisation temps réel via WebSocket  
✅ Gestion complète des tables  
✅ Gestion des serveurs avec authentification  
✅ Gestion du menu avec stocks  
✅ Sessions de caisse (ouverture/fermeture)  
✅ Tickets avec validation et envoi cuisine/bar  
✅ Paiements partiels  
✅ Rapports et statistiques  
✅ Journal d'audit  

## 🛠️ Technologies

- **Node.js** - Runtime
- **Express** - Framework HTTP
- **SQLite** (better-sqlite3) - Base de données
- **WebSocket** (ws) - Temps réel
- **bcryptjs** - Hachage (préparé pour JWT)
- **jsonwebtoken** - Tokens JWT (préparé)

## 📝 Notes

- Le backend est optionnel : le frontend fonctionne en mode démo avec localStorage
- Pour la production, le backend est recommandé pour la persistance et la synchronisation multi-appareils
- La base de données SQLite est locale au serveur (pas de cloud)
- Pour un déploiement multi-serveurs, migrer vers PostgreSQL

## 🚀 Déploiement

### Local
```bash
npm install
npm start
```

### Production (avec PM2)
```bash
npm install -g pm2
pm2 start server.js --name quickpos-backend
pm2 save
pm2 startup
```

### Docker (exemple)
```dockerfile
FROM node:20-alpine
WORKDIR /app
COPY package*.json ./
RUN npm install --production
COPY . .
EXPOSE 3001
CMD ["node", "server.js"]
```

---

**QuickPOS Pro Backend** - Système de caisse professionnel 🚀
