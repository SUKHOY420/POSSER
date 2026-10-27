# QuickPOS - Système de Caisse Multi-Postes

## 🎯 Architecture Multi-Postes

QuickPOS est un système de caisse professionnel avec **synchronisation en temps réel** entre tous les postes :

### Postes disponibles :

1. **🖥️ Écran Principal (Caisse)**
   - Vue globale de toutes les commandes
   - Suivi en temps réel de l'activité
   - Statistiques et CA du jour

2. **👨‍🍳 Écran Cuisine (KDS)**
   - Affiche uniquement les commandes de nourriture
   - Workflow : Reçue → En préparation → Prête
   - Alertes sonores et visuelles pour les nouvelles commandes

3. **📱 Tablettes Serveurs** (plusieurs possibles)
   - Chaque serveur a son propre espace
   - Prise de commandes et encaissement
   - Envoi automatique en cuisine

## 🔄 Synchronisation en Temps Réel

### Comment tester la synchronisation :

1. **Ouvrez l'application dans votre navigateur**
2. **Ouvrez-la à nouveau dans un NOUVEL onglet ou une nouvelle fenêtre**
   - Ctrl+T (nouvel onglet) ou Ctrl+N (nouvelle fenêtre)
   - Ou cliquez droit → "Ouvrir dans un nouvel onglet"
3. **Dans chaque onglet/fenêtre, choisissez un poste différent** :
   - Onglet 1 : Écran Principal (Caisse)
   - Onglet 2 : Écran Cuisine
   - Onglet 3+ : Tablette Serveur (plusieurs serveurs)

### Ce qui est synchronisé :

✅ **Commandes** : Création, modification, fermeture  
✅ **Articles** : Ajout, suppression, quantités, notes  
✅ **Statuts cuisine** : En préparation, Prêt, Servi  
✅ **Tables** : Occupation, libération  
✅ **Paiements** : Espèces, carte  
✅ **Notifications** : Alertes en temps réel  

### Indicateurs visuels :

- **🔵 Indicateur de sync** (en haut à gauche) : Montre le type de poste et la dernière synchronisation
- **🔔 Notifications** (en haut à droite) : Alertes en temps réel
- **🔊 Son cuisine** : Alertes sonores quand une nouvelle commande arrive

## 🖨️ Imprimante Thermique (ESC/POS)

### Configuration :
- Allez dans **Paramètres → Configuration Périphériques**
- Choisissez le type de connexion : USB, Série, Bluetooth, Réseau
- Configurez l'adresse (IP/MAC/Port)
- Options : coupe automatique, ouverture tiroir-caisse

### Impression automatique :
- **Ticket client** : À l'encaissement
- **Ticket cuisine** : À l'envoi en cuisine
- **Rapport Z** : À la clôture de session

## 💳 Terminal de Paiement (TPE)

### Fournisseurs supportés :
- **Ingenico** (protocole EPAS)
- **Verifone** (protocole VIP)
- **SumUp** (Bluetooth/API)
- **Stripe Terminal** (SDK Cloud)
- **Simulateur** (mode démo)

### Configuration :
- Allez dans **Paramètres → Configuration Périphériques → Terminal Paiement**
- Choisissez votre fournisseur
- Configurez la connexion et les clés API

### Flux de paiement :
1. Serveur clique sur "Encaisser"
2. Choix : Espèces ou Carte
3. Si Carte : Communication avec le TPE
4. Affichage de la progression
5. Impression automatique du ticket
6. Synchronisation avec tous les postes

## 📊 Clôture de Session

### Rapport Z automatique :
- Total général de la journée
- Détail par serveur (commandes, CA, espèces, CB)
- Comptage caisse (attendu vs réel)
- Écart de caisse
- Impression du rapport Z

### Nouvelle session :
- Toutes les données sont réinitialisées
- Prêt pour le lendemain

## 🎨 Fonctionnalités

### Pour les serveurs :
- ✅ Plan de tables interactif
- ✅ Menu avec catégories et recherche
- ✅ Modificateurs (cuisson, sauces...)
- ✅ Notes cuisine (allergies, préférences)
- ✅ Remises (%)
- ✅ Encaissement espèces/carte
- ✅ Impression tickets

### Pour la cuisine :
- ✅ Affichage des commandes food uniquement
- ✅ Tri par ancienneté
- ✅ Alertes urgentes (+15 min)
- ✅ Workflow visuel (reçue → préparation → prêt)
- ✅ Bouton "Tout prêt"
- ✅ Notifications sonores

### Pour la caisse :
- ✅ Vue globale de toutes les commandes
- ✅ Filtres par statut
- ✅ Statistiques en temps réel
- ✅ Suivi du CA
- ✅ Indicateurs périphériques

## 🔧 Technologies

- **React 18** + TypeScript
- **Tailwind CSS** (responsive)
- **Framer Motion** (animations)
- **BroadcastChannel API** (sync cross-tab)
- **WebUSB/WebSerial/WebBluetooth** (périphériques)
- **ESC/POS** (protocole imprimante)

## 🚀 Démarrage

```bash
# Installation
npm install

# Développement
npm run dev

# Build production
npm run build
```

## 📱 Responsive

L'application s'adapte automatiquement :
- **Mobile** : Navigation bottom bar
- **Tablette** : Interface tactile optimisée
- **Desktop** : Sidebar + vue complète

## 🔒 Sécurité

- Codes PIN pour les serveurs
- Rôles : Admin, Serveur, Cuisine
- Inaltérabilité des données (commandes fermées non modifiables)
- Conformité NF525 (prévu)

## 📝 Notes

- La synchronisation fonctionne entre onglets/fenêtres du **même navigateur**
- Pour une utilisation multi-appareils, il faudrait un backend (WebSocket/Firebase)
- Les périphériques (imprimante/TPE) nécessitent les API navigateur (Chrome/Edge)
- Mode démo disponible pour tester sans matériel

---

**QuickPOS** - Système de caisse professionnel, agile et moderne 🚀
