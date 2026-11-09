# 💾 Sauvegarde des Sessions & Rapports Comptables

## 🎯 Vue d'Ensemble

QuickPOS Pro sauvegarde automatiquement chaque session journalière avec son historique complet de tickets pour permettre :
- ✅ Statistiques mensuelles détaillées
- ✅ Rapports annuels complets
- ✅ Clôture d'exercice comptable
- ✅ Export des données pour la comptabilité
- ✅ Historique permanent de toutes les transactions

## 📊 Architecture de Sauvegarde

### Structure des Données

```typescript
Session {
  id: string;
  openedAt: Date;           // Date d'ouverture
  closedAt?: Date;          // Date de clôture
  openedBy: string;         // Serveur qui a ouvert
  closedBy?: string;        // Serveur qui a fermé
  initialCash: number;      // Fonds de caisse initial
  finalCash?: number;       // Fonds de caisse final
  totalRevenue: number;     // CA total
  totalCash: number;        // Total espèces
  totalCard: number;        // Total carte
  ticketCount: number;      // Nombre de tickets
  notes?: string;           // Notes de clôture
  tickets: Ticket[];        // ⭐ HISTORIQUE COMPLET DES TICKETS
}
```

### Persistance

#### localStorage (Frontend)
- **Clé** : `quickpos-sessions`
- **Format** : JSON
- **Contenu** : Toutes les sessions fermées avec leurs tickets
- **Avantage** : Accès instantané, pas de backend requis

#### Backend (Optionnel)
- **Table** : `sessions`
- **Table liée** : `tickets` (via `session_id`)
- **Avantage** : Multi-postes, backup centralisé

## 🔄 Workflow de Sauvegarde

### 1. Ouverture de Session
```
Utilisateur → Saisie fonds initial → OPEN_SESSION
                                         ↓
                              Création session (tickets: [])
                                         ↓
                              Sauvegarde dans state
```

### 2. Pendant la Session
```
Chaque ticket créé → Ajouté à state.tickets
                         ↓
Associé à la session via createdAt >= session.openedAt
```

### 3. Clôture de Session
```
Utilisateur → Saisie fonds final → CLOSE_SESSION
                                        ↓
              Filtrage des tickets de la session
                                        ↓
              Calcul des totaux (CA, espèces, carte)
                                        ↓
              Création Session fermée avec tickets[]
                                        ↓
              Sauvegarde dans localStorage
                                        ↓
              Ajout à closedSessions[]
```

## 📈 Rapports Disponibles

### 1. Rapport Journalier
**Période** : 1 session (1 jour)  
**Contenu** :
- CA total de la journée
- Nombre de tickets
- Répartition espèces/carte
- Détails par serveur
- Détails par catégorie

**Utilisation** :
- Clôture de caisse quotidienne
- Vérification des fonds
- Suivi journalier

### 2. Rapport Mensuel
**Période** : 1 mois (plusieurs sessions)  
**Contenu** :
- CA total du mois
- Nombre de sessions
- Nombre de tickets
- Panier moyen
- Évolution jour par jour

**Utilisation** :
- Analyse mensuelle
- Comparaison entre mois
- Prévisions

### 3. Rapport Annuel (Clôture d'Exercice)
**Période** : 1 an (toutes les sessions)  
**Contenu** :
- CA annuel total
- Répartition mensuelle
- Performance par serveur
- Ventes par catégorie
- Statistiques détaillées
- Export JSON pour comptabilité

**Utilisation** :
- Clôture d'exercice comptable
- Déclaration fiscale
- Analyse annuelle
- Audit

## 🎨 Interface Utilisateur

### Boutons dans le Header

```
[📊 Historique] [📄 Rapport] [⏻ Clôturer] [⚙️ Admin]
```

- **📊 Historique** : Ouvre le modal d'historique complet
- **📄 Rapport** : Rapport de la session en cours
- **⏻ Clôturer** : Clôture la session avec sauvegarde
- **⚙️ Admin** : Paramètres

### Modal d'Historique & Rapports

#### Onglet 1 : Sessions
- Liste de toutes les sessions fermées
- Date, serveur, CA, nombre de tickets
- Notes de clôture
- Détails de chaque session

#### Onglet 2 : Mensuel
- Sélection année/mois
- Statistiques du mois
- Liste des sessions du mois
- Graphiques d'évolution

#### Onglet 3 : Annuel / Clôture
- Sélection année
- Rapport annuel complet
- Répartition mensuelle
- Performance par serveur
- Ventes par catégorie
- Export JSON
- Impression

## 💾 Sauvegarde Automatique

### Quand ?
- **À la clôture de chaque session**
- **Automatiquement** après confirmation
- **Immédiatement** dans localStorage

### Quoi ?
- ✅ Session complète avec tous ses tickets
- ✅ Détails des paiements
- ✅ Informations serveur
- ✅ Notes de clôture
- ✅ Horodatage précis

### Où ?
```javascript
localStorage.setItem('quickpos-sessions', JSON.stringify(sessions));
```

### Combien ?
- **Illimité** (dépend de la limite localStorage ~5-10MB)
- **Recommandation** : Export annuel pour archivage long terme

## 📊 Calculs Statistiques

### Par Session
```javascript
totalRevenue = Σ(ticket.paidAmount)
totalCash = Σ(payment.amount WHERE method='CASH')
totalCard = Σ(payment.amount WHERE method='CARD')
ticketCount = tickets.filter(status='PAID').length
```

### Par Mois
```javascript
monthlyRevenue = Σ(session.totalRevenue WHERE month=X)
monthlyTickets = Σ(session.ticketCount WHERE month=X)
avgBasket = monthlyRevenue / monthlyTickets
```

### Par Année
```javascript
annualRevenue = Σ(session.totalRevenue WHERE year=X)
byMonth[month] = Σ(session WHERE month=month)
byServer[name] = Σ(ticket WHERE server=name)
byCategory[name] = Σ(item WHERE category=name)
```

## 🖨️ Export des Données

### Format JSON
```json
{
  "type": "annual",
  "year": 2024,
  "generatedAt": "2024-12-31T23:59:59.000Z",
  "summary": {
    "totalRevenue": 125450.50,
    "totalCash": 85320.30,
    "totalCard": 40130.20,
    "ticketCount": 4523,
    "sessionCount": 312
  },
  "byMonth": {
    "0": { "revenue": 10250.00, "tickets": 385, "sessions": 26 },
    "1": { "revenue": 9850.50, "tickets": 362, "sessions": 25 },
    ...
  },
  "serverStats": {
    "Marie": { "tickets": 1250, "revenue": 42500.00, ... },
    "Thomas": { "tickets": 1180, "revenue": 39800.00, ... },
    ...
  },
  "categoryStats": {
    "Entrées": { "quantity": 2450, "revenue": 22050.00 },
    "Plats": { "quantity": 3850, "revenue": 58520.00 },
    ...
  },
  "sessions": [...]
}
```

### Utilisation Comptable
1. **Export JSON** → Import dans logiciel comptable
2. **Impression** → Archive papier
3. **Analyse** → Tableur (Excel, Google Sheets)
4. **Audit** → Vérification des transactions

## 🔒 Sécurité & Intégrité

### Protection des Données
- ✅ Sessions fermées = **immuables**
- ✅ Tickets associés = **non modifiables**
- ✅ Historique complet = **traçabilité totale**
- ✅ Sauvegarde automatique = **pas de perte**

### Vérification
- ✅ Cohérence des totaux
- ✅ Écart de caisse calculé
- ✅ Nombre de tickets vérifié
- ✅ Paiements reconciliés

## 📋 Cas d'Usage

### Cas 1 : Clôture Quotidienne
```
23:00 → Clôturer session
      → Compter caisse
      → Saisir fonds final
      → Imprimer rapport journalier
      → Sauvegarde automatique ✓
```

### Cas 2 : Rapport Mensuel
```
Fin de mois → Historique & Rapports
           → Onglet Mensuel
           → Sélectionner mois
           → Analyser statistiques
           → Imprimer rapport
```

### Cas 3 : Clôture d'Exercice
```
31 Décembre → Historique & Rapports
            → Onglet Annuel
            → Sélectionner année
            → Vérifier totaux
            → Exporter JSON
            → Imprimer rapport
            → Transmettre au comptable
```

### Cas 4 : Audit
```
Demande audit → Historique & Rapports
              → Sélectionner période
              → Exporter JSON
              → Fournir aux auditeurs
              → Justifier toutes transactions
```

## 🚀 Avantages

### Pour le Gestionnaire
- ✅ **Vision complète** : Toutes les données historiques
- ✅ **Analyse facile** : Statistiques automatiques
- ✅ **Décision éclairée** : Tendances et performances
- ✅ **Gain de temps** : Rapports automatiques

### Pour le Comptable
- ✅ **Données fiables** : Historique complet
- ✅ **Export facile** : JSON compatible
- ✅ **Traçabilité** : Toutes les transactions
- ✅ **Conformité** : Audit ready

### Pour l'Entreprise
- ✅ **Archivage** : Historique permanent
- ✅ **Sécurité** : Pas de perte de données
- ✅ **Transparence** : Tout est enregistré
- ✅ **Évolutivité** : Prêt pour la croissance

## 📊 Exemples de Rapports

### Rapport Mensuel
```
═══════════════════════════════════════
    RAPPORT MENSUEL - Janvier 2024
═══════════════════════════════════════

RÉSUMÉ
Chiffre d'affaires    42 580,50 €
Sessions              26
Tickets               1 523
Panier moyen             27,96 €

ÉVOLUTION
Semaine 1 : 10 250 € (240 tickets)
Semaine 2 : 11 050 € (265 tickets)
Semaine 3 : 10 850 € (258 tickets)
Semaine 4 : 10 430 € (260 tickets)

MEILLEUR JOUR
Samedi 13 janvier : 2 150 € (78 tickets)

SERVEURS
Marie    : 425 tickets  12 500 €
Thomas   : 398 tickets  11 800 €
Julie    : 365 tickets  10 250 €
Karim    : 335 tickets   8 030 €
```

### Rapport Annuel
```
═══════════════════════════════════════
    CLÔTURE D'EXERCICE 2024
═══════════════════════════════════════

RÉSUMÉ ANNUEL
Chiffre d'affaires   512 450,50 €
Sessions             312
Tickets              18 250
Panier moyen            28,08 €

RÉPARTITION MENSUELLE
Janvier   : 42 580 € (1 523 tickets)
Février   : 38 950 € (1 385 tickets)
Mars      : 45 250 € (1 620 tickets)
...
Décembre  : 48 750 € (1 725 tickets)

PERFORMANCE SERVEURS
Marie    : 4 850 tickets  142 500 €
Thomas   : 4 580 tickets  135 200 €
Julie    : 4 420 tickets  128 750 €
Karim    : 4 400 tickets  106 000 €

VENTES PAR CATÉGORIE
Plats      : 7 250 unités  285 450 € (55.7%)
Boissons   : 6 850 unités  125 320 € (24.5%)
Entrées    : 2 450 unités   62 050 € (12.1%)
Desserts   : 1 700 unités   39 630 € (7.7%)
```

## 🔮 Futures Améliorations

### Priorité Haute
- [ ] Graphiques interactifs (Chart.js)
- [ ] Comparaison entre périodes
- [ ] Alertes automatiques (anomalies)
- [ ] Export PDF professionnel

### Priorité Moyenne
- [ ] Intégration comptable (Sage, QuickBooks)
- [ ] Backup cloud automatique
- [ ] Partage par email
- [ ] Rapports personnalisés

### Priorité Basse
- [ ] Prévisions basées sur l'historique
- [ ] Analyse des tendances
- [ ] KPIs avancés
- [ ] Dashboard temps réel

## 📚 Documentation Liée

- `SESSIONS_REPORTS.md` - Gestion des sessions
- `SESSIONS_GUIDE.md` - Guide d'utilisation
- `BACKEND_SUMMARY.md` - Backend et persistance
- `FINAL_AUDIT.md` - Audit complet

---

**QuickPOS Pro** - Sauvegarde complète et rapports comptables professionnels 💾📊✨
