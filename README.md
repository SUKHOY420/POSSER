# QuickPOS Pro - Système de Caisse Professionnel

Système de caisse multi-postes avec synchronisation temps réel, validation de commande et panneau d'administration complet.

## 🚀 Fonctionnalités Principales

### 1. **Workflow de Validation de Commande**
Le serveur suit un workflow en 3 étapes :
1. **DRAFT** : Prendre la commande (brouillon)
2. **VALIDATE** : Valider la commande (confirmation)
3. **OPEN** : Encaisser et envoyer en cuisine

### 2. **Multi-Postes Synchronisés**
- **Caisse Principale** : Vue globale de toutes les tables en temps réel
- **Écran Cuisine (KDS)** : Affichage des commandes de nourriture à préparer
- **Écran Bar** : Affichage des commandes de boissons à préparer
- **Tablettes Serveurs** : Prise de commande avec validation
- **Administration** : Gestion complète du système

### 3. **Paiements Partiels**
- Paiement par articles sélectionnés
- Paiement par montant personnalisé
- Indicateurs visuels : 🔴 Occupée, 🟠 Partiel, 🟢 Payé
- Synchronisation instantanée entre tous les postes

### 4. **Panneau d'Administration**
- **Produits** : Ajouter, modifier, supprimer des articles
- **Tables** : Gérer le plan de salle
- **Serveurs** : Gérer les comptes et PIN
- **Tickets** : Voir l'historique des commandes
- **Format** : Personnaliser le format des tickets
- **Rapports** : Statistiques avec filtres (jour, semaine, mois, serveur, table)

## 📋 Utilisation

### Démarrage
```bash
npm install
npm run dev
```

### Ouvrir plusieurs postes
Ouvrez l'application dans **plusieurs onglets** du même navigateur :
- Onglet 1 : Caisse Principale
- Onglet 2 : Écran Cuisine
- Onglet 3 : Écran Bar
- Onglet 4+ : Tablettes Serveurs

La synchronisation se fait automatiquement via BroadcastChannel API.

### Comptes de test
- **Admin** : PIN `0000`
- **Marie** : PIN `1234`
- **Thomas** : PIN `2345`
- **Julie** : PIN `3456`
- **Karim** : PIN `4567`

## 🔄 Workflow Serveur

### 1. Sélectionner une table
- Les tables sont codées par couleur :
  - 🟢 **Vert** : Libre
  - 🔴 **Rouge** : Occupée
  - 🟠 **Orange** : Paiement partiel
  - 🔵 **Bleu** : Réservée

### 2. Prendre la commande (DRAFT)
- Ajouter des articles depuis le menu
- Modifier les quantités
- La commande est en mode **brouillon**

### 3. Valider la commande
- Cliquer sur le bouton **"Valider"**
- La commande passe en statut **OPEN**
- Un écran de confirmation s'affiche

### 4. Envoyer en cuisine
- Cliquer sur **"Cuisine"** pour envoyer les plats
- La cuisine reçoit la commande instantanément

### 5. Encaisser
- Cliquer sur **"Encaisser"**
- Sélectionner les articles à payer ou entrer un montant
- Choisir le mode de paiement (Espèces/Carte)
- Possibilité de paiement partiel

### 6. Fermer la table
- Quand tout est payé, cliquer sur **"Fermer la table"**
- La table redevient libre

## 🍳 Écran Cuisine (KDS)

- Affiche uniquement les plats (pas les boissons)
- Workflow : **Reçue** → **En préparation** → **Prête**
- Alertes sonores pour les nouvelles commandes
- Indicateur de temps écoulé
- Bouton "Tout prêt" pour valider tous les plats d'une commande

## 💰 Paiements Partiels

### Scénario : Table de 3 personnes
1. Commande totale : 60€
2. Personne 1 paie 20€ (sélectionner ses articles)
3. Table passe en 🟠 **PARTIEL**
4. Personne 2 paie 25€
5. Personne 3 paie 15€
6. Table passe en 🟢 **PAYÉ**
7. Fermer la table

### Indicateurs visuels
- **Badge "PARTIEL"** : Orange sur la table
- **Badge "PAYÉ"** : Vert sur la table
- **Montant payé** : Affiché en vert
- **Reste à payer** : Affiché en orange

## 🛠️ Administration

### Gestion des Produits
- Nom, prix, emoji, catégorie
- Type : Nourriture ou Boisson
- Couleur personnalisée

### Gestion des Tables
- Nom et nombre de places
- Statut automatique basé sur les tickets

### Gestion des Serveurs
- Nom, PIN, couleur
- Rôle : Admin ou Serveur

### Format des Tickets
Personnalisez ce qui apparaît sur le ticket :
- Logo, adresse, téléphone
- Nom du serveur, date
- Articles, total, paiement
- Texte de footer personnalisé

### Rapports
Filtres disponibles :
- **Période** : Aujourd'hui, semaine, mois, tout
- **Serveur** : Tous ou serveur spécifique
- **Table** : Toutes ou table spécifique

Statistiques affichées :
- Chiffre d'affaires
- Nombre de tickets
- Panier moyen
- Répartition espèces/carte

**Export CSV** : Télécharger les données filtrées

## 🏗️ Architecture Technique

### State Management
- **React Context + useReducer** : Gestion d'état centralisée
- **Actions typées** : Toutes les actions sont typées TypeScript
- **Machine à états** : `recalculateTableStatus()` calcule automatiquement le statut des tables

### Synchronisation Temps Réel
- **BroadcastChannel API** : Communication entre onglets
- **Événements** : TICKET_UPDATE, TABLE_UPDATE, KITCHEN_NOTIFY
- **Optimistic UI** : Mise à jour immédiate de l'interface

### Modèle de Données
```typescript
Table {
  id, name, seats, status
  ticketIds[] // Une table peut avoir plusieurs tickets
  totalToPay, totalPaid
}

Ticket {
  id, tableId, items[]
  status: 'DRAFT' | 'OPEN' | 'PAID' | 'CANCELLED'
  totalAmount, paidAmount
  payments[]
  serverId, serverName
}

TicketItem {
  id, menuItem, quantity, notes
  status: 'pending' | 'validated' | 'sent' | 'preparing' | 'ready' | 'served'
}
```

### Codes Couleurs Universels
- 🟢 **Vert** : Libre / Payé
- 🔴 **Rouge** : Occupée / Non payé
- 🟠 **Orange** : Paiement partiel
- 🔵 **Bleu** : Réservée / En cours
- 🟣 **Violet** : Administration

## 📱 Responsive Design

L'application s'adapte automatiquement :
- **Mobile** : Navigation simplifiée, boutons tactiles larges
- **Tablette** : Interface optimale pour les serveurs
- **Desktop** : Vue complète pour la caisse et l'administration

## 🔒 Sécurité

- **PIN requis** pour accéder aux postes serveur et admin
- **Validation de commande** : Évite les erreurs de saisie
- **Inaltérabilité** : Les tickets payés ne peuvent pas être modifiés
- **Traçabilité** : Tous les paiements sont enregistrés

## 🎯 Cas d'Usage

### Restaurant
- Serveurs avec tablettes
- Cuisine avec écran KDS
- Caisse principale pour le manager
- Paiements partiels pour les groupes

### Bar
- Commandes rapides au bar
- Encaissement immédiat
- Gestion des ardoises

### Café
- Commandes à table
- Addition séparée possible
- Rapports par serveur

## 🚧 Fonctionnalités Futures

- [ ] Intégration imprimante thermique (ESC/POS)
- [ ] Intégration TPE (Terminal de Paiement)
- [ ] Backend avec base de données (PostgreSQL)
- [ ] WebSockets pour synchronisation multi-appareils
- [ ] Gestion des stocks
- [ ] Programme de fidélité
- [ ] Commandes en ligne (QR Code)
- [ ] Intégration UberEats/Deliveroo

## 📄 Licence

MIT License - Libre d'utilisation et de modification

## 🤝 Contribution

Les contributions sont les bienvenues ! N'hésitez pas à ouvrir une issue ou une pull request.

---

**QuickPOS Pro** - Système de caisse professionnel, agile et moderne 🚀
