# 📊 Gestion des Sessions et Rapports - QuickPOS Pro

## 🎯 Nouvelles Fonctionnalités

### 1. **Gestion des Sessions** ✅

#### Ouverture de Session
- Au démarrage de l'application, une session doit être ouverte
- Saisie du fonds de caisse initial
- Enregistrement de l'heure d'ouverture et du serveur

#### Clôture de Session
- Bouton **Power** (⏻) dans le header de la caisse principale
- Récapitulatif complet de la session :
  - Chiffre d'affaires total
  - Nombre de tickets
  - Total espèces / carte
  - Fonds initial + espèces encaissées = fonds attendu
  - Saisie du fonds réel compté
  - Calcul automatique de l'écart de caisse
- Notes de clôture optionnelles
- Confirmation en 2 étapes pour éviter les erreurs
- Impossible de clôturer si des tickets sont encore ouverts

#### Statistiques de Session
```typescript
{
  id: string;
  openedAt: Date;
  closedAt?: Date;
  openedBy: string;
  closedBy?: string;
  initialCash: number;
  finalCash?: number;
  totalRevenue: number;
  totalCash: number;
  totalCard: number;
  ticketCount: number;
  notes?: string;
}
```

### 2. **Impression de Rapports** ✅

#### Types de Rapports
- **Journalier** : Rapport du jour en cours
- **Mensuel** : Rapport du mois en cours
- **Personnalisé** : Tous les tickets payés

#### Contenu du Rapport
1. **En-tête**
   - Nom de l'établissement
   - Adresse et téléphone
   - Type de rapport
   - Période concernée

2. **Résumé**
   - Chiffre d'affaires total
   - Nombre de tickets
   - Total espèces
   - Total carte
   - Panier moyen

3. **Détails par Serveur**
   - Nom du serveur
   - Nombre de tickets
   - Total espèces
   - Total carte
   - Total général

4. **Détails par Catégorie**
   - Nom de la catégorie
   - Quantité vendue
   - Chiffre d'affaires

5. **Pied de page**
   - Date de génération
   - Nom du logiciel

#### Options d'Export
- **Impression** : Via window.print() avec styles CSS optimisés
- **Téléchargement JSON** : Export des données complètes en JSON

## 🎨 Interface Utilisateur

### Boutons dans le Header (Caisse Principale)

```
[📄 Rapport] [⏻ Clôturer] [⚙️ Admin] [🚪 Déconnexion]
```

- **📄 Rapport** : Ouvre le modal d'impression de rapport
- **⏻ Clôturer** : Ouvre le modal de clôture de session
- **⚙️ Admin** : Ouvre le modal de connexion admin
- **🚪 Déconnexion** : Déconnecte l'utilisateur

### Modal de Rapport

1. **Sélection du type** : 3 boutons (Journalier, Mensuel, Personnalisé)
2. **Aperçu du rapport** : Formaté pour l'impression
3. **Actions** :
   - Fermer
   - Télécharger JSON
   - Imprimer

### Modal de Clôture de Session

#### Étape 1 : Résumé
- Affichage des statistiques de la session
- Comptage de caisse (fonds attendu vs fonds réel)
- Calcul de l'écart
- Notes optionnelles
- Boutons : Annuler, Imprimer Rapport, Clôturer

#### Étape 2 : Confirmation
- Message d'avertissement
- Récapitulatif final
- Boutons : Annuler, Confirmer la Clôture

#### Étape 3 : Succès
- Animation de succès
- Résumé de la session clôturée
- Bouton : Ouvrir une Nouvelle Session

## 🖨️ Styles d'Impression

### Optimisations CSS
```css
@media print {
  /* Cache tout sauf le rapport */
  body * { visibility: hidden; }
  #printable-report, #printable-report * { visibility: visible; }
  
  /* Positionnement */
  #printable-report {
    position: absolute;
    left: 0;
    top: 0;
    width: 100%;
    padding: 20px;
  }
  
  /* Reset des styles */
  .glass, .glass-card { background: white !important; }
  .text-white { color: black !important; }
  
  /* Marges de page */
  @page { margin: 1cm; }
}
```

### Format du Rapport Imprimé
- Papier A4
- Marges : 1cm
- Police : Système (lisible)
- Couleurs : Noir et blanc (optimisé pour impression)
- Tableaux : Bordures fines
- En-têtes : Gras et soulignés

## 📊 Calculs Automatiques

### Écart de Caisse
```typescript
const expectedCash = initialCash + totalCash;
const cashDifference = actualCash - expectedCash;

// Affichage
if (cashDifference === 0) → "✓ Compte exact" (vert)
if (cashDifference > 0) → "↑ Excédent" (bleu)
if (cashDifference < 0) → "↓ Manquant" (rouge)
```

### Statistiques par Serveur
```typescript
serverStats = {
  "Marie": { tickets: 15, revenue: 450.50, cash: 300.00, card: 150.50 },
  "Thomas": { tickets: 12, revenue: 380.00, cash: 250.00, card: 130.00 },
  // ...
}
```

### Statistiques par Catégorie
```typescript
categoryStats = {
  "Entrées": { quantity: 25, revenue: 237.50 },
  "Plats": { quantity: 40, revenue: 580.00 },
  "Boissons": { quantity: 60, revenue: 210.00 },
  // ...
}
```

## 🔄 Workflow Complet

### Scénario 1 : Journée Normale

1. **Matin - Ouverture**
   - Lancer l'application
   - Se connecter (Admin ou Serveur)
   - Ouvrir une session avec le fonds de caisse initial
   - Commencer à prendre des commandes

2. **Journée - Service**
   - Serveurs prennent les commandes
   - Cuisine et bar préparent
   - Encaissements (espèces/carte)
   - Paiements partiels si nécessaire

3. **Soir - Clôture**
   - Vérifier que tous les tickets sont payés
   - Cliquer sur ⏻ (Clôturer)
   - Compter la caisse
   - Saisir le fonds réel
   - Vérifier l'écart
   - Imprimer le rapport journalier
   - Confirmer la clôture
   - Nouvelle session le lendemain

### Scénario 2 : Rapport Mensuel

1. **Fin de mois**
   - Cliquer sur 📄 (Rapport)
   - Sélectionner "Mensuel"
   - Voir les statistiques du mois
   - Imprimer ou télécharger en JSON
   - Archiver pour la comptabilité

### Scénario 3 : Vérification de Caisse

1. **En cours de journée**
   - Cliquer sur 📄 (Rapport)
   - Sélectionner "Journalier"
   - Voir le CA en cours
   - Vérifier les totaux espèces/carte
   - Comparer avec la caisse physique

## 📁 Fichiers Créés/Modifiés

### Créés
1. `src/components/ReportPrinterModal.tsx` (250 lignes)
   - Modal d'impression de rapport
   - 3 types de rapports
   - Aperçu formaté
   - Export JSON
   - Impression optimisée

2. `src/components/CloseSessionModal.tsx` (280 lignes)
   - Modal de clôture de session
   - 3 étapes (résumé, confirmation, succès)
   - Calcul automatique des totaux
   - Gestion de l'écart de caisse
   - Notes de clôture

### Modifiés
1. `src/types.ts`
   - Ajout du type `Session`
   - Ajout de `currentSession` et `closedSessions` dans `AppState`

2. `src/store.tsx`
   - Ajout des actions `OPEN_SESSION` et `CLOSE_SESSION`
   - Logique de calcul des statistiques de session
   - Import du type `Session`

3. `src/components/MainScreen.tsx`
   - Ajout de 2 boutons dans le header (Rapport, Clôturer)
   - Intégration des 2 nouveaux modals
   - Import des composants

4. `src/index.css`
   - Styles d'impression optimisés
   - Reset des styles pour impression
   - Marges de page
   - Visibilité sélective

## 🎯 Avantages

### Pour le Gestionnaire
- ✅ Suivi précis des sessions
- ✅ Détection des écarts de caisse
- ✅ Rapports imprimés pour la comptabilité
- ✅ Historique des sessions clôturées
- ✅ Statistiques par serveur et catégorie

### Pour le Comptable
- ✅ Rapports formatés pour l'impression
- ✅ Export JSON pour traitement automatique
- ✅ Détail des paiements (espèces/carte)
- ✅ Ventilation par serveur
- ✅ Ventilation par catégorie

### Pour le Serveur
- ✅ Clôture de session simple
- ✅ Vérification rapide de la caisse
- ✅ Impression de rapport à la demande
- ✅ Pas de calculs manuels

## 🔒 Sécurité

### Protection de la Clôture
- Impossible de clôturer si tickets ouverts
- Confirmation en 2 étapes
- Affichage de l'écart avant confirmation
- Notes de clôture optionnelles

### Traçabilité
- Heure d'ouverture/clôture enregistrée
- Nom du serveur qui a ouvert/fermé
- Fonds initial et final
- Tous les tickets de la session
- Historique des sessions clôturées

## 📊 Exemple de Rapport Imprimé

```
═══════════════════════════════════════
      LE BISTROT DU COIN
   12 Rue de la Paix, 75002 Paris
      Tel: 01 23 45 67 89
═══════════════════════════════════════

      RAPPORT JOURNALIER
   lundi 15 janvier 2024

───────────────────────────────────────
RÉSUMÉ
───────────────────────────────────────
Chiffre d'affaires    1 250,50 €
Nombre de tickets     45
Espèces                 850,00 €
Carte                   400,50 €
Panier moyen             27,79 €

───────────────────────────────────────
PAR SERVEUR
───────────────────────────────────────
Serveur    Tickets  Espèces   Carte    Total
Marie         18    450,00   200,50   650,50 €
Thomas        15    300,00   150,00   450,00 €
Julie         12    100,00    50,00   150,00 €

───────────────────────────────────────
PAR CATÉGORIE
───────────────────────────────────────
Catégorie       Quantité    Total
Entrées             25     237,50 €
Plats               40     580,00 €
Desserts            30     225,00 €
Boissons            60     210,00 €

───────────────────────────────────────
Rapport généré le 15/01/2024 à 23:45
QuickPOS Pro - Système de caisse professionnel
```

## 🚀 Prochaines Améliorations

### Priorité Haute
- [ ] Export PDF des rapports
- [ ] Envoi par email des rapports
- [ ] Graphiques dans les rapports
- [ ] Comparaison entre sessions

### Priorité Moyenne
- [ ] Rapport par période personnalisée
- [ ] Rapport par article
- [ ] Rapport des annulations
- [ ] Rapport des réductions

### Priorité Basse
- [ ] Rapports automatiques (quotidien/hebdomadaire/mensuel)
- [ ] Intégration avec logiciels comptables
- [ ] Export Excel/CSV
- [ ] Rapports de performance serveur

---

**QuickPOS Pro** - Gestion complète des sessions et rapports 📊✨
