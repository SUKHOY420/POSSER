# Écran Barman - Documentation

## 🍸 Vue d'ensemble

L'écran Barman est un poste de travail dédié au personnel du bar, affichant uniquement les commandes de boissons en temps réel. Il fonctionne de manière similaire à l'écran Cuisine mais est spécifiquement optimisé pour la préparation des boissons.

## 🎯 Fonctionnalités

### Affichage en Temps Réel
- **Synchronisation automatique** : Les nouvelles commandes de boissons apparaissent instantanément
- **Notifications sonores** : Alertes audio lors de nouvelles commandes
- **Indicateurs visuels** : Animations et couleurs pour attirer l'attention

### Gestion des Commandes
- **Statuts de préparation** :
  - 🟡 **Envoyée** : Commande reçue, en attente de préparation
  - 🔵 **En préparation** : Barman en train de préparer
  - 🟢 **Prête** : Boisson prête à être servie

- **Actions rapides** :
  - Bouton "Prêt" pour chaque boisson individuelle
  - Bouton "Tout prêt" pour valider toute une commande
  - Feedback visuel immédiat

### Informations Affichées
- **Numéro de table** : Pour identifier où servir
- **Nom du serveur** : Qui a pris la commande
- **Temps écoulé** : Depuis la validation de la commande
- **Détails des boissons** :
  - Quantité
  - Nom de la boisson
  - Emoji représentatif
  - Notes spéciales (ex: "sans glaçons")
  - Modificateurs (ex: "avec citron")

## 🎨 Design et UX

### Code Couleur
- **Violet/Bleu** : Thème principal de l'écran Bar
- **Rouge** : Commandes urgentes (> 10 minutes)
- **Vert** : Commandes prêtes
- **Orange** : Alertes et notifications

### Animations
- **Apparition** : Fade-in avec translation
- **Pulsation** : Pour les commandes urgentes
- **Scale** : Feedback au clic sur les boutons
- **Rotation** : Icône Wine lors des nouvelles commandes

### Responsive Design
- **Mobile** : 1 colonne
- **Tablette** : 2 colonnes
- **Desktop** : 3-4 colonnes
- **Large screen** : 4+ colonnes

## 🔄 Synchronisation

### Événements BroadcastChannel
```typescript
// Quand un serveur envoie une commande avec des boissons
syncManager.broadcast('BAR_NOTIFY', {
  message: `Commande envoyée: ${drinkCount} boissons`,
});

// Mise à jour du ticket
syncManager.broadcast('TICKET_UPDATE', ticket);
```

### Flux de Données
1. **Serveur** : Valide la commande → `SEND_TO_KITCHEN`
2. **Store** : Détecte les boissons → Broadcast `BAR_NOTIFY`
3. **Écran Bar** : Reçoit la notification → Affiche la commande
4. **Barman** : Marque comme prête → Broadcast `TICKET_UPDATE`
5. **Autres écrans** : Reçoivent la mise à jour

## 📊 Statistiques Rapides

En haut de l'écran, trois indicateurs affichent :
- **En attente** : Nombre de commandes avec des boissons en statut "sent"
- **En préparation** : Nombre de commandes avec des boissons en statut "preparing"
- **Prêtes** : Nombre de commandes où toutes les boissons sont "ready"

## 🎵 Notifications Sonores

L'écran Barman émet un son (600Hz, 0.5s) lors de chaque nouvelle commande pour attirer l'attention du barman, même s'il ne regarde pas l'écran.

## ⚡ Performance

- **GPU Acceleration** : Animations fluides à 60fps
- **Optimisation React** : Rendu minimal grâce à `React.memo`
- **Lazy Loading** : Seules les commandes ouvertes sont affichées
- **Filtrage efficace** : Seules les boissons sont traitées

## 🔧 Configuration

### Dans le fichier `types.ts`
```typescript
export type ScreenType = 'select' | 'main' | 'kitchen' | 'bar' | 'server' | 'admin';
```

### Dans le fichier `data.ts`
Les boissons sont identifiées par `isFood: false` :
```typescript
{
  id: '13',
  name: 'Mojito',
  price: 9.00,
  category: 'Cocktails',
  emoji: '🍹',
  isFood: false  // ← Identifie comme boisson
}
```

## 🚀 Utilisation

### Démarrer l'écran Barman
1. Ouvrir l'application dans un nouvel onglet
2. Sélectionner "Écran Bar"
3. L'écran se connecte automatiquement au système de synchronisation

### Workflow typique
1. **Réception** : Nouvelle commande apparaît avec notification sonore
2. **Préparation** : Cliquer sur "Prêt" pour chaque boisson
3. **Validation** : Cliquer sur "Tout prêt" pour valider la commande
4. **Service** : La commande passe en statut "ready" et est visible par les serveurs

## 🎯 Cas d'Usage

### Bar seul
- Un seul écran Bar pour tout le bar
- Toutes les boissons affichées

### Bar + Cuisine
- Écran Cuisine pour la nourriture
- Écran Bar pour les boissons
- Séparation claire des responsabilités

### Grand établissement
- Plusieurs écrans Bar (bar principal, bar terrasse, etc.)
- Synchronisation entre tous les écrans
- Chaque barman voit les commandes de son zone

## 🔮 Améliorations Futures

- [ ] Priorisation des commandes (VIP, régulières)
- [ ] Historique des préparations
- [ ] Statistiques de performance par barman
- [ ] Intégration avec systèmes de stock
- [ ] Alertes de stock faible
- [ ] Recettes et guides de préparation
- [ ] Mode nuit (luminosité réduite)
- [ ] Commandes prioritaires (express)

---

**Écran Barman** - Optimisé pour la rapidité et l'efficacité au bar 🍸✨
