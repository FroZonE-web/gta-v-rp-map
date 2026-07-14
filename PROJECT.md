# Ashen Wolves HUB

## 1. Vision du projet

Ashen Wolves HUB est une application web unique destinée à centraliser l'organisation du groupe GTA RP Ashen Wolves MC.

La carte GTA V historique est conservée comme premier module du HUB. Les nouveaux modules doivent s'intégrer à l'application existante sans réécrire les systèmes fonctionnels.

Principes permanents :

- interface simple, moderne, sombre et professionnelle ;
- identité graphique noire et violette ;
- navigation rapide et intuitive ;
- développement progressif, une fonctionnalité à la fois ;
- réutilisation de l'existant avant toute nouvelle architecture ;
- compatibilité GitHub Pages ;
- Supabase comme source de données, authentification et permissions.

## 2. Technologies

- GitHub Pages
- HTML
- CSS
- JavaScript Vanilla
- Supabase Auth, Database, Storage et RPC
- Leaflet
- Leaflet Draw

Aucun framework front-end ni système de compilation n'est actuellement requis.

## 3. Architecture actuelle

### Fichiers communs

- `index.html` : structure générale du HUB et des modules.
- `hub.js` : routage par hash et affichage des modules.
- `hub.css` : tableau de bord et styles communs du HUB.
- `config.js` : initialisation Supabase.
- `app.js` / `style.css` : module Carte historique.

### Modules

- Carte : `app.js`, `style.css`, `places.js` et `assets/gta-v-map.jpg`.
- Règlement : `reglement.js`, `reglement.css`.
- Annuaire : `annuaire.js`, `contacts.js`, `law.js`, `annuaire.css`.
- Agenda : `agenda.js`, `agenda.css`.

### Navigation

Le site utilise un routage par hash compatible avec GitHub Pages :

- `#/` : accueil du HUB
- `#/carte`
- `#/reglement`
- `#/annuaire`
- `#/agenda`

Les futurs modules suivront la même convention.

## 4. Modules et état d'avancement

### Disponibles

- Carte — terminée.
- Règlement — terminé.
- Annuaire — terminé :
  - Membres du club ;
  - Personnes rencontrées ;
  - Forces de l'ordre.
- Agenda — terminé.

### À développer

- Stocks
- Comptabilité
- Plans d'OP
- Calculatrice de craft
- Notes des gradés

## 5. Permissions prévues

Les quatre niveaux définitifs seront :

1. Visiteur
2. Membre
3. Gradé
4. Administrateur

La gestion globale de ces rôles sera réalisée ultérieurement. En attendant, les modules Annuaire et Agenda suivent une règle provisoire :

- lecture publique ;
- ajout public ;
- modification et suppression réservées à l'administrateur.

Le mode visiteur de l'administrateur doit continuer à reproduire l'expérience d'un utilisateur classique.

## 6. Supabase

### Ressources historiques de la Carte

- `markers`
- `zones`
- `atlas_media`
- `deletion_requests`
- bucket Storage `atlas-media`
- RPC `is_admin`

Les noms historiques `atlas_*` sont conservés volontairement pour éviter les régressions.

### Annuaire

- `directory_members`
- `directory_contacts`
- `directory_contact_labels`
- `directory_law_enforcement`

Les scripts d'installation et migrations se trouvent à la racine sous les noms `ANNUAIRE_*.sql`.

### Agenda

- `agenda_events`

Scripts :

- `AGENDA_SETUP.sql`
- `AGENDA_CONTACT_FIX.sql` pour une installation existante antérieure au champ `contact`.

## 7. Décisions fonctionnelles importantes

### Carte

Le module Carte est considéré comme terminé. Toute modification doit être ciblée et validée au préalable.

### Règlement

- Le texte officiel ne doit jamais être réécrit ni réordonné.
- Seule sa présentation peut évoluer.

### Annuaire

- Membres du club : maximum 16 membres, tri automatique par grade, postes vacants non affichés.
- Personnes rencontrées : recherche, tris, regroupements, badges Emploi et Entité personnalisables.
- Forces de l'ordre : services, matricule, informations de contact, notes et statut Détective.

### Agenda

- Vues Calendrier, Liste et Archives.
- Types : Réunion, Opération, Balade, Événement RP, Recrutement, RDV Crimi et Divers.
- Les dates sont manipulées en heure locale pour éviter les décalages UTC.
- Une case du calendrier affiche au maximum deux lignes :
  - jusqu'à deux événements, ils sont tous affichés ;
  - à partir de trois événements, seul le premier est affiché, suivi de `et X autres événements`.
- Un clic sur une journée ouvre la liste complète des événements de cette date.
- Les fenêtres peuvent être fermées en cliquant sur l'arrière-plan.
- Le champ `contact` permet de noter le groupe ou la personne rencontrée.

## 8. Conventions de développement

- Ne jamais repartir de zéro si l'architecture existante suffit.
- Ne pas déplacer ou découper un système stable sans bénéfice validé.
- Isoler la logique et les styles de chaque nouveau module dans des fichiers dédiés.
- Conserver le JavaScript Vanilla et l'absence de build tant que cela reste adapté.
- Protéger les opérations sensibles à la fois dans l'interface et avec les politiques RLS Supabase.
- Toujours vérifier les affichages ordinateur et mobile.
- Toujours fournir le projet complet au format ZIP.
- Toujours indiquer les requêtes SQL nécessaires.
- Ne pas modifier une fonctionnalité existante sans accord explicite.

## 9. Convention des commits

Format demandé :

`Ashen Wolves HUB vX.Y Description`

Exemples :

- `Ashen Wolves HUB v1.2 Annuaire`
- `Ashen Wolves HUB v1.2 fix Badges Annuaire`
- `Ashen Wolves HUB v1.3 Agenda`
- `Ashen Wolves HUB v1.3 fix Agenda`

Les correctifs d'un module conservent son numéro de version. Le numéro augmente lors du lancement d'un nouveau module majeur.

## 10. Procédure de livraison

Pour chaque mise à jour :

1. partir du dernier ZIP validé ;
2. analyser les fichiers concernés ;
3. modifier uniquement la fonctionnalité demandée ;
4. vérifier la syntaxe JavaScript ;
5. fournir le ZIP complet ;
6. fournir les migrations SQL éventuelles ;
7. proposer le nom du commit GitHub.

## 11. Prochaine étape

Prochain module : **Stocks**.

La définition fonctionnelle sera précisée avant le développement. Aucun choix métier ne doit être inventé sans validation.

## Version 1.4 — Stocks

### Phase 1 : Banque d'items

Le module Stocks est développé par étapes afin de protéger la stabilité du HUB.

La première phase introduit les tables `stock_categories` et `stock_items`, ainsi que le bucket Storage public `stock-items`.

Chaque item possède :

- un nom unique ;
- une image facultative ;
- un poids unitaire en kilogrammes ;
- une catégorie ;
- une valeur propre ;
- une valeur sale calculée par valeur fixe, multiplicateur ou pourcentage ;
- un seuil critique facultatif, destiné à être évalué ultérieurement sur le stock global.

Permissions provisoires validées :

- lecture, création et modification des items : tous ;
- suppression des items : administrateur ;
- lecture, création et modification des catégories : tous ;
- suppression des catégories : administrateur.

Les quantités ne sont pas encore gérées dans cette phase. Elles seront exclusivement modifiées par des mouvements atomiques lors des prochaines phases.

Prochaines phases prévues :

1. lieux de stockage ;
2. mouvements d'entrée et de sortie ;
3. stock global et répartition par lieu ;
4. capacité, poids et alertes critiques ;
5. synchronisation Realtime.
