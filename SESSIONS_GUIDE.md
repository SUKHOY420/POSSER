# 🚀 Guide Rapide - Sessions et Rapports

## 📋 Nouvelle Interface

### Header de la Caisse Principale

```
┌─────────────────────────────────────────────────────────┐
│ 💰 Caisse Principale          📄 ⏻ ⚙️ 🚪  23:45       │
│    Vue globale temps réel                               │
└─────────────────────────────────────────────────────────┘
```

**Nouveaux boutons** :
- **📄** : Imprimer un rapport
- **⏻** : Clôturer la session
- **⚙️** : Accès administrateur
- **🚪** : Déconnexion

## 🎯 Workflow Quotidien

### 1️⃣ Ouverture de la Journée

```
1. Lancer l'application
2. Se connecter (Admin ou Serveur)
3. Saisir le fonds de caisse initial (ex: 200€)
4. Cliquer sur "Ouvrir la session"
5. Commencer à prendre des commandes
```

### 2️⃣ Service en Cours

```
- Serveurs prennent les commandes
- Cuisine et bar préparent
- Encaissements (espèces/carte)
- Paiements partiels si nécessaire
```

### 3️⃣ Vérification en Cours de Journée

```
1. Cliquer sur 📄 (Rapport)
2. Sélectionner "Journalier"
3. Voir le CA en cours
4. Vérifier les totaux
5. Fermer le rapport
```

### 4️⃣ Clôture de la Journée

```
1. Vérifier que TOUS les tickets sont payés
2. Cliquer sur ⏻ (Clôturer)
3. Compter la caisse physiquement
4. Saisir le fonds réel (ex: 1050€)
5. Vérifier l'écart de caisse
6. Ajouter des notes si nécessaire
7. Cliquer sur "Imprimer Rapport"
8. Cliquer sur "Clôturer"
9. Confirmer la clôture
10. La session est terminée !
```

## 📊 Types de Rapports

### 📅 Rapport Journalier
**Quand l'utiliser** :
- À la clôture de la journée
- Pour vérifier le CA du jour
- Pour la comptabilité quotidienne

**Contenu** :
- CA du jour
- Nombre de tickets
- Total espèces/carte
- Détails par serveur
- Détails par catégorie

### 📆 Rapport Mensuel
**Quand l'utiliser** :
- Fin de mois
- Pour la comptabilité mensuelle
- Analyse des performances

**Contenu** :
- CA du mois
- Tous les tickets du mois
- Statistiques complètes
- Tendances

### 📋 Rapport Personnalisé
**Quand l'utiliser** :
- Pour voir tous les tickets
- Analyse globale
- Export de données

**Contenu** :
- Tous les tickets payés
- Statistiques complètes

## 💰 Gestion de la Caisse

### Calcul Automatique

```
Fonds initial :        200,00 €
+ Espèces encaissées : 850,00 €
─────────────────────────────
= Fonds attendu :    1 050,00 €

Fonds réel compté :  1 050,00 €
─────────────────────────────
Écart de caisse :        0,00 € ✓
```

### Types d'Écarts

| Écart | Signification | Couleur |
|-------|---------------|---------|
| 0,00 € | Compte exact | 🟢 Vert |
| +10,00 € | Excédent | 🔵 Bleu |
| -5,00 € | Manquant | 🔴 Rouge |

## 🖨️ Impression des Rapports

### Méthode 1 : Impression Directe
1. Cliquer sur 📄 (Rapport)
2. Sélectionner le type de rapport
3. Cliquer sur "Imprimer"
4. Choisir l'imprimante
5. Valider l'impression

### Méthode 2 : Export JSON
1. Cliquer sur 📄 (Rapport)
2. Sélectionner le type de rapport
3. Cliquer sur "Télécharger JSON"
4. Fichier sauvegardé sur l'ordinateur
5. Traitement ultérieur possible

## 📱 Exemples d'Utilisation

### Exemple 1 : Journée Standard

```
08:00 - Ouverture
├─ Fonds initial : 200€
├─ Session ouverte par Marie
│
12:00 - Vérification midi
├─ CA : 450€
├─ 18 tickets
├─ Tout va bien ✓
│
23:00 - Clôture
├─ CA total : 1 250,50€
├─ 45 tickets
├─ Fonds compté : 1 050€
├─ Écart : 0€ ✓
├─ Rapport imprimé
└─ Session clôturée
```

### Exemple 2 : Écart de Caisse

```
23:00 - Clôture
├─ Fonds attendu : 1 050€
├─ Fonds réel : 1 045€
├─ Écart : -5€ ⚠️
├─ Note : "Pièce de 5€ tombée derrière la caisse"
├─ Rapport imprimé
└─ Session clôturée
```

### Exemple 3 : Rapport Mensuel

```
31 Janvier - Rapport mensuel
├─ Type : Mensuel
├─ CA total : 35 450€
├─ 1 250 tickets
├─ Imprimé pour la comptabilité
└─ Archivé
```

## ⚠️ Points Importants

### ✅ À Faire
- Toujours compter la caisse avant de clôturer
- Imprimer le rapport de clôture
- Vérifier l'écart de caisse
- Noter les incidents dans les notes
- Sauvegarder les rapports importants

### ❌ À Éviter
- Clôturer avec des tickets ouverts
- Oublier d'imprimer le rapport
- Ignorer les écarts de caisse
- Ne pas noter les incidents
- Fermer sans vérifier les totaux

## 🔍 Dépannage

### Problème : Impossible de clôturer
**Cause** : Des tickets sont encore ouverts  
**Solution** :
1. Vérifier les tables occupées
2. Encaisser tous les tickets
3. Réessayer la clôture

### Problème : Écart de caisse important
**Cause** : Erreur de comptage ou vol  
**Solution** :
1. Recompter la caisse
2. Vérifier les tickets de la session
3. Noter l'incident dans les notes
4. Prévenir le responsable

### Problème : Rapport ne s'imprime pas
**Cause** : Problème d'imprimante  
**Solution** :
1. Vérifier la connexion imprimante
2. Télécharger le rapport en JSON
3. Imprimer depuis un autre poste
4. Contacter le support technique

## 📞 Support

### Documentation Complète
- `SESSIONS_REPORTS.md` - Documentation détaillée
- `README.md` - Documentation générale
- `START_HERE.md` - Guide de démarrage

### Contact
- Support technique : support@quickpos.pro
- Documentation en ligne : docs.quickpos.pro

---

**QuickPOS Pro** - Gestion simplifiée des sessions et rapports 📊✨
