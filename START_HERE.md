# 🚀 Guide de Démarrage Rapide - QuickPOS Pro

## 📦 Installation

### 1. Frontend (Déjà installé)
```bash
npm install
```

### 2. Backend (Nouveau)
```bash
cd server
npm install
```

## 🏃 Démarrage

### Option 1 : Mode Complet (Recommandé)

**Terminal 1 - Backend :**
```bash
cd server
npm start
```

**Terminal 2 - Frontend :**
```bash
npm run dev
```

### Option 2 : Mode Démo (Sans Backend)

```bash
npm run dev
```

L'application fonctionnera avec localStorage (données perdues au rechargement).

## 🌐 Accès

Ouvrez votre navigateur sur : **http://localhost:5173**

## 🎯 Premiers Pas

### 1. Choisir un Poste

Sur l'écran d'accueil, vous verrez un indicateur de statut :
- 🟢 **Backend connecté** : Mode production
- 🟡 **Mode démo** : Mode localStorage

### 2. Tester la Synchronisation

Ouvrez **plusieurs onglets** du navigateur :

**Onglet 1 - Caisse Principale :**
- Sélectionner "Caisse Principale"
- Voir toutes les tables en temps réel

**Onglet 2 - Écran Cuisine :**
- Sélectionner "Écran Cuisine"
- Voir les commandes de nourriture

**Onglet 3 - Écran Bar :**
- Sélectionner "Écran Bar"
- Voir les commandes de boissons

**Onglet 4 - Tablette Serveur :**
- Sélectionner "Tablette Serveur"
- Se connecter avec Marie (PIN: 1234)
- Ouvrir une table et prendre une commande

### 3. Workflow Complet

1. **Serveur** (Onglet 4) :
   - Cliquer sur une table (ex: T1)
   - Ajouter des articles (nourriture + boissons)
   - Cliquer sur "Valider"
   - Cliquer sur "Envoyer en cuisine"

2. **Cuisine** (Onglet 2) :
   - Voir la commande apparaître
   - Cliquer sur "En préparation"
   - Cliquer sur "Prêt"

3. **Bar** (Onglet 3) :
   - Voir les boissons apparaître
   - Cliquer sur "Prêt"

4. **Caisse** (Onglet 1) :
   - Voir la table mise à jour en temps réel
   - Cliquer sur 💳 pour encaisser
   - Choisir le mode de paiement

## 📊 Fonctionnalités à Tester

### ✅ Gestion des Tables
- Ouvrir une table
- Voir le statut changer (Libre → Occupée → Partiel → Payé)
- Fermer la table

### ✅ Paiements Partiels
- Encaisser une partie de la note
- Voir le statut "Partiel"
- Encaisser le reste
- Voir le statut "Payé"

### ✅ Encaissement d'Urgence
- Depuis la caisse, cliquer sur 💳 sur une table
- Encaisser sans passer par le serveur

### ✅ Historique
- Cliquer sur 📊 sur une table
- Voir l'historique des tickets
- Filtrer par statut

### ✅ Administration
- Cliquer sur ⚙️ dans la caisse
- Entrer le mot de passe admin (0000)
- Modifier les produits, tables, serveurs
- Changer le mot de passe admin

## 🗄️ Persistance des Données

### Avec Backend
- Les données sont sauvegardées dans `server/quickpos.db`
- Persistance entre les redémarrages
- Synchronisation entre tous les postes

### Sans Backend (Mode Démo)
- Les données sont sauvegardées dans localStorage
- Persistance entre les rechargements
- Synchronisation uniquement entre onglets du même navigateur

## 🔧 Dépannage

### Le backend ne démarre pas
```bash
# Vérifier le port
lsof -i :3001

# Tuer le processus
kill -9 <PID>

# Redémarrer
cd server
npm start
```

### Le frontend ne se connecte pas au backend
1. Vérifier que le backend tourne
2. Ouvrir la console du navigateur (F12)
3. Vérifier les erreurs CORS
4. Vérifier l'URL : http://localhost:3001/api/health

### Les données disparaissent
- **Avec backend** : Vérifier que le backend tourne
- **Sans backend** : Normal, utiliser le mode backend pour la persistance

### La synchronisation ne fonctionne pas
- **Avec backend** : Vérifier la connexion WebSocket
- **Sans backend** : Ouvrir dans plusieurs onglets du même navigateur

## 📚 Documentation Complète

- `README.md` - Documentation générale
- `server/README.md` - Documentation backend
- `BACKEND_INTEGRATION.md` - Intégration backend/frontend
- `FINAL_AUDIT.md` - Audit complet de l'application
- `ADVANCED_FEATURES.md` - Fonctionnalités avancées

## 🎓 Comptes de Test

### Serveurs
- **Marie** : PIN 1234
- **Thomas** : PIN 2345
- **Julie** : PIN 3456
- **Karim** : PIN 4567

### Admin
- **Admin** : PIN 0000 (modifiable dans les paramètres)

## 🎯 Scénarios de Test

### Scénario 1 : Service Normal
1. Serveur ouvre une table
2. Prend une commande (nourriture + boissons)
3. Valide et envoie en cuisine/bar
4. Cuisine et bar préparent
5. Serveur encaisse (paiement complet)
6. Ferme la table

### Scénario 2 : Paiement Partiel
1. Table de 3 personnes
2. Chaque personne paie sa part
3. Voir le statut "Partiel"
4. Dernière personne paie le reste
5. Voir le statut "Payé"
6. Fermer la table

### Scénario 3 : Encaissement d'Urgence
1. Serveur occupé avec une autre table
2. Client demande l'addition
3. Manager encaisse depuis la caisse
4. Synchronisation automatique

### Scénario 4 : Tablette en Panne
1. Serveur prend une commande
2. Tablette tombe en panne
3. Manager voit la table sur la caisse
4. Encaisse depuis la caisse
5. Service continu

## 🚀 Prochaines Étapes

1. ✅ Backend créé
2. ✅ Client API frontend
3. ✅ Détection automatique
4. ⏳ Intégrer l'API dans le store
5. ⏳ Ajouter les sessions de caisse
6. ⏳ Ajouter l'impression de tickets
7. ⏳ Ajouter la gestion des stocks

## 💡 Conseils

- **Développement** : Utiliser le mode démo pour tester rapidement
- **Production** : Toujours utiliser le backend
- **Tests** : Ouvrir plusieurs onglets pour tester la synchronisation
- **Données** : Le backend persiste les données, pas le mode démo

## 🆘 Support

En cas de problème :
1. Vérifier les logs du backend (terminal)
2. Vérifier la console du navigateur (F12)
3. Consulter la documentation
4. Vérifier `BACKEND_INTEGRATION.md`

---

**QuickPOS Pro** - Prêt à l'emploi ! 🎉
