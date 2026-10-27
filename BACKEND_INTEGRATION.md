# 🔌 Intégration Backend/Frontend - QuickPOS Pro

## 📋 Vue d'ensemble

QuickPOS Pro fonctionne maintenant en **mode hybride** :
- **Mode Démo** : localStorage (sans backend)
- **Mode Production** : Backend Node.js + WebSocket

L'application détecte automatiquement la disponibilité du backend et bascule entre les deux modes.

## 🚀 Démarrage Rapide

### 1. Démarrer le Backend

```bash
cd server
npm install
npm start
```

Le backend démarre sur `http://localhost:3001`

### 2. Démarrer le Frontend

```bash
# Dans un autre terminal
npm run dev
```

Le frontend démarre sur `http://localhost:5173`

### 3. Ouvrir l'application

Ouvrez `http://localhost:5173` dans votre navigateur.

**Indicateur de statut** : En haut de l'écran de sélection, vous verrez :
- 🟢 **Backend connecté** : Le backend est actif
- 🟡 **Mode démo (localStorage)** : Le backend n'est pas disponible

## 🔄 Mode Hybride

### Détection Automatique

L'application vérifie automatiquement la disponibilité du backend au démarrage :

```typescript
// src/hooks.ts
export function useBackend() {
  const [isAvailable, setIsAvailable] = useState<boolean | null>(null);

  useEffect(() => {
    isBackendAvailable().then(setIsAvailable);
  }, []);

  return { isAvailable };
}
```

### Basculement Transparent

- **Backend disponible** : Utilise l'API REST + WebSocket
- **Backend indisponible** : Utilise localStorage + BroadcastChannel

L'utilisateur ne voit aucune différence dans l'interface.

## 📡 Communication

### API REST (HTTP)

Toutes les opérations CRUD passent par l'API REST :

```typescript
// Exemple : Créer un ticket
const ticket = await ticketsApi.create({
  table_id: 't1',
  server_id: 'srv-1',
  server_name: 'Marie'
});
```

### WebSocket (Temps Réel)

Les mises à jour en temps réel passent par WebSocket :

```typescript
// Émettre un événement
sendWS('TICKET_UPDATE', ticket);

// Écouter un événement
const unsubscribe = onWS('TICKET_UPDATE', (ticket) => {
  // Mettre à jour l'interface
});
```

## 🗄️ Base de Données

### SQLite

Le backend utilise SQLite avec le fichier `server/quickpos.db`.

**Avantages** :
- ✅ Simple à déployer
- ✅ Pas de configuration
- ✅ Performant pour un POS
- ✅ Fichier unique

**Limites** :
- ❌ Pas de multi-serveur
- ❌ Pas de réplication
- ❌ Limité en écritures concurrentes

### Migration vers PostgreSQL

Pour la production multi-serveurs, migrer vers PostgreSQL :

1. Installer `pg` : `npm install pg`
2. Modifier `server/database.js` pour utiliser PostgreSQL
3. Configurer la connexion dans `server/.env`

## 🔐 Sécurité

### Authentification

- **Serveurs** : PIN à 4 chiffres
- **Admin** : Mot de passe modifiable
- **API** : Préparation pour JWT (non activé)

### Pour la Production

Activer l'authentification JWT :

```javascript
// server/middleware/auth.js
import jwt from 'jsonwebtoken';

export function authenticateToken(req, res, next) {
  const token = req.headers['authorization'];
  if (!token) return res.sendStatus(401);

  jwt.verify(token, process.env.JWT_SECRET, (err, user) => {
    if (err) return res.sendStatus(403);
    req.user = user;
    next();
  });
}
```

## 📊 Monitoring

### Logs

Le backend affiche des logs pour :
- Connexions/déconnexions WebSocket
- Requêtes API
- Erreurs

### Health Check

```bash
curl http://localhost:3001/api/health
# Réponse : {"status":"ok","timestamp":"2024-..."}
```

## 🐛 Dépannage

### Backend ne démarre pas

```bash
# Vérifier les ports
lsof -i :3001

# Tuer le processus
kill -9 <PID>

# Redémarrer
npm start
```

### Frontend ne se connecte pas

1. Vérifier que le backend tourne : `curl http://localhost:3001/api/health`
2. Vérifier la console du navigateur pour les erreurs
3. Vérifier les CORS dans `server/server.js`

### WebSocket ne se connecte pas

1. Vérifier l'URL : `ws://localhost:3001/ws`
2. Vérifier les logs du backend
3. Vérifier le pare-feu

## 🚀 Déploiement

### Local (Développement)

```bash
# Terminal 1 : Backend
cd server && npm start

# Terminal 2 : Frontend
npm run dev
```

### Production (PM2)

```bash
# Backend
cd server
npm install --production
pm2 start server.js --name quickpos-backend
pm2 save
pm2 startup

# Frontend
npm run build
# Servir le dossier dist/ avec nginx ou similaire
```

### Docker

```bash
# Backend
cd server
docker build -t quickpos-backend .
docker run -p 3001:3001 quickpos-backend

# Frontend
docker build -t quickpos-frontend .
docker run -p 80:80 quickpos-frontend
```

## 📝 Configuration

### Variables d'Environnement

Créer `server/.env` :

```env
PORT=3001
JWT_SECRET=your-secret-key
DATABASE_PATH=./quickpos.db
NODE_ENV=production
```

### Frontend

Modifier `src/api.ts` :

```typescript
const API_URL = process.env.REACT_APP_API_URL || 'http://localhost:3001/api';
const WS_URL = process.env.REACT_APP_WS_URL || 'ws://localhost:3001/ws';
```

## 📚 Documentation API

Voir `server/README.md` pour la documentation complète de l'API.

## 🎯 Prochaines Étapes

1. ✅ Backend fonctionnel
2. ✅ Client API frontend
3. ✅ Détection automatique du backend
4. ⏳ Intégrer l'API dans le store (remplacer localStorage)
5. ⏳ Ajouter l'authentification JWT
6. ⏳ Migrer vers PostgreSQL pour la production
7. ⏳ Ajouter les tests unitaires
8. ⏳ Ajouter les tests d'intégration

---

**QuickPOS Pro** - Backend intégré avec succès 🚀
