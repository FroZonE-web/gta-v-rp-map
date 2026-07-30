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


## Correctif v1.4 — Routage Stocks

- La route `#/stocks` ouvre directement le module Banque d’items.
- Les versions de cache de `hub.js`, `stocks.js` et `stocks.css` sont renouvelées afin d’éviter le chargement de l’ancien placeholder par GitHub Pages ou le navigateur.

### Stocks — Phase 2 : lieux de stockage

La table `stock_locations` répertorie les habitations, véhicules et frigos.

Champs principaux : nom, type, capacité maximale, localisation, notes et poids utilisé. Le poids utilisé reste à zéro jusqu'à la mise en place des mouvements, puis sera maintenu automatiquement par la base.

Permissions provisoires : lecture, création et modification publiques ; suppression administrateur. La localisation d'un véhicule peut être modifiée directement depuis sa carte sans ouvrir le formulaire complet. Les frigos utilisent la même logique de capacité, de contenu et de mouvements que les autres lieux.

### Stocks — Phase 3 : mouvements

Les quantités sont stockées dans `stock_balances` et ne sont jamais modifiées directement par l'interface.
Chaque dépôt ou retrait passe par la fonction RPC atomique `create_stock_movement`.

La fonction vérifie :

- que l'item et le lieu existent ;
- que la quantité est strictement positive ;
- qu'un retrait ne dépasse pas le stock disponible ;
- qu'un dépôt ne dépasse pas la capacité en poids du lieu.

Chaque opération met à jour dans une même transaction :

- la quantité de l'item dans le lieu ;
- le poids utilisé du lieu ;
- l'historique `stock_movements`.

Les tables `stock_balances`, `stock_movements` et `stock_locations` sont écoutées avec Supabase Realtime. Les vues ouvertes se mettent donc à jour automatiquement après un mouvement, sans bouton d'actualisation.

Le changement du poids unitaire d'un item déclenche également un recalcul des poids utilisés dans les lieux concernés.

## Stocks — Stock global et synchronisation (v1.4.5)

La vue Stock global agrège `stock_balances` pour chaque item et affiche :

- quantité globale ;
- poids total ;
- valeur propre totale ;
- valeur sale totale ;
- état par rapport au seuil critique global ;
- répartition par lieu de stockage.

La synchronisation entre les navigateurs repose sur un canal Supabase Realtime écoutant :

- `stock_categories` ;
- `stock_items` ;
- `stock_locations` ;
- `stock_balances` ;
- `stock_movements`.

Le correctif important de cette version consiste à ne plus tester `window.supabaseClient`, car le client est déclaré par `const supabaseClient` dans `config.js` et n'est pas exposé comme propriété de `window`. Ce test empêchait auparavant l'abonnement Realtime de démarrer.


## Statuts du stock global

- `OK` (vert) : quantité globale supérieure au seuil critique, ou aucun seuil défini avec une quantité positive.
- `Stock bas` (orange) : quantité globale positive et inférieure ou égale au seuil critique.
- `Rupture` (rouge) : quantité globale égale à zéro.

Le module Stocks est considéré comme disponible à partir de la v1.4.


## Correctif v1.4.7 — couleurs des statuts Stocks
Les badges du Stock global utilisent désormais des couleurs explicites et forcées : vert pour OK, orange pour Stock bas et rouge pour Rupture.

### v1.4.1 — Améliorations Stocks
- Consultation du contenu d’un lieu depuis sa carte.
- Mouvement simple réordonné et aperçu enrichi avec la catégorie.
- Mouvement multiple atomique via `create_stock_movements_bulk`.
- Remplissage des lieux coloré progressivement, orange dès 80 %, rouge dès 95 %.
- Cartes de la banque d’items compactées et images maintenues en tête.
- Valeurs propres en vert et valeurs sales en rouge.
- Stock global triable par catégorie puis nom.
- Sélection des catégories d’items par saisie avec suggestions.

## v1.5 — Comptabilité (phase visuelle)

- Route : `#/comptabilite`
- Fichiers : `comptabilite.css`, `comptabilite.js`
- Interface inspirée du tableau de bord Fleeca, adaptée au thème noir et violet du HUB.
- Comptes prévus : Compte du club et Caisse noire.
- Soldes affichés : argent propre et argent sale.
- Opérations récentes regroupées par date.
- Actions rapides et transferts présents comme maquette interactive uniquement.
- Aucune table, donnée ou permission Supabase ajoutée dans cette phase.

### v1.5 fix Interface Comptabilité

- Le module Comptabilité utilise désormais le mode de page pleine largeur du HUB.
- Le tableau de bord Fleeca est centré dans la fenêtre.
- Le bloc IBAN a été retiré de la maquette.


## Comptabilité v1.5.2 — Prototype Compte du club

- Trois parcours visuels : vente d’items, achat d’items et achat de service.
- Les références sont lues depuis les tables existantes Stocks et Annuaire.
- Aucune écriture Supabase ni modification de stock/solde dans cette phase.
- La prochaine phase ajoutera les RPC atomiques et l’historique comptable.

## Comptabilité v1.5.3 — prototype Caisse noire

- La Caisse noire ne contient que de l'argent propre.
- Deux actions : ajout sans motif obligatoire et retrait avec motif obligatoire.
- Les ventes et achats d'items affichent une valeur théorique calculée depuis `stock_items`.
- Le calcul utilise uniquement la valeur propre ou la valeur sale selon le compte sélectionné.
- Cette étape reste un prototype sans écriture comptable ni modification de stock.
- L'interface Comptabilité utilise temporairement des panneaux plus sombres pour le confort visuel ; l'harmonisation globale reste prévue en fin de projet.

## Comptabilité — v1.5.4

Les opérations comptables simples sont stockées dans `accounting_transactions`. Les soldes ne sont jamais édités directement : ils sont recalculés depuis les crédits et débits.

La fonction RPC `create_simple_accounting_operation` gère les recettes rapides, paiements aux membres, transferts vers la caisse noire, ajouts et retraits de caisse noire. Les transferts vers la caisse noire créent deux écritures liées dans une seule transaction.

Les opérations complexes liées aux Stocks restent volontairement en mode prototype jusqu'à la prochaine phase.

## Comptabilité v1.5.5 — opérations complexes

Les ventes et achats d’items utilisent la RPC `create_complex_accounting_operation` afin de modifier les soldes, quantités, poids des lieux et historiques dans une seule transaction SQL. Une erreur annule intégralement l’opération.

Les mouvements physiques conservent `deposit` / `withdrawal` et utilisent `source_type` pour distinguer `manual`, `purchase` et `resale`.


## Correctif v1.5.6 — Interface et destinataires

- Retrait des mentions visuelles de prototype dans les opérations complexes.
- Les boutons décrivent désormais les validations réelles.
- Correction du chargement des membres de `directory_members` : utilisation de `grade_code` et tri hiérarchique par `sort_order`.
- Le transfert d’argent propose la Caisse noire et tous les membres du club.

## Version 1.6.0 — Amendes et améliorations transversales

### Carte
- Ajout des catégories `Radars` et `Poubelles` pour les marqueurs.

### Stocks
- Ajout d'une vue `Galerie` dans le détail d'un lieu de stockage.
- La galerie affiche uniquement les visuels, la quantité en bas à droite et le nom au survol.
- Le type `Frigo` était déjà présent et n'a pas été modifié.

### Comptabilité
- Ajout du raccourci `Argent sale trouvé` sur le tableau de bord.
- Cette opération crédite exclusivement l'argent sale du compte du club.
- Elle apparaît automatiquement dans l'historique et les transactions récentes.
- Elle n'alimente jamais la caisse noire, qui reste réservée à l'argent propre.
- Migration à exécuter : `COMPTABILITE_ARGENT_SALE_TROUVE.sql`.

### Amendes
- Nouveau module indépendant de la Comptabilité.
- Référentiel officiel des quatre catégories d'amendes.
- Liste des membres avec trois statuts : pas de récidive, récidive, récidives multiples.
- Une récidive multiple correspond à plusieurs infractions différentes encore actives.
- Casier individuel accessible par le prénom via `#/amendes/<prenom>`.
- Historique général filtrable par membre, catégorie, date, paiement et récidive.
- Le prénom des membres dans l'Annuaire redirige vers leur casier.
- Migration à exécuter : `AMENDES_SETUP.sql`.


## v1.6.1 — Correctifs Amendes et Stocks

- Amendes : module pleine largeur, contenu centré et référentiel adaptatif affichant les quatre catégories.
- Annuaire : le prénom pointe vers `#/amendes/<prenom>` et ouvre le casier correspondant.
- Stocks : la vue Galerie est disponible dans le détail d’un lieu, avec image, quantité et nom au survol.
- Cache : numéros de version des fichiers CSS/JS relevés pour garantir le chargement des correctifs sur GitHub Pages.
- SQL : aucune nouvelle migration.
## Ashen Wolves HUB v1.6.2 correctif mise en page Amendes

- Restauration complète du visuel initial du module Amendes.
- Affichage des quatre catégories sur une même ligne sur les grands écrans.
- Grille responsive en deux colonnes puis une colonne.
- Contenu recentré sur toute la largeur utile de l’écran.
- Aucun changement sur la Comptabilité, les Stocks ou la liaison Annuaire → casier.
- Aucun script SQL supplémentaire requis.

## Ashen Wolves HUB v1.6.3 correctif quatre colonnes Amendes

- Le référentiel des amendes affiche désormais exactement quatre colonnes sur les écrans de bureau, une par catégorie.
- La grille est centrée dans la largeur utile de la page.
- Le passage à deux colonnes n'intervient plus que sur les petits écrans, puis à une colonne sur mobile.
- Aucun changement sur la Comptabilité, les Stocks ou la liaison Annuaire → casier.
- Aucun script SQL supplémentaire requis.


## v1.6.4 — Correctifs généraux

- Refonte responsive de la Carte pour l’aligner visuellement avec les autres modules.
- Ajout des zones interdites en `#101010`, avec description disponible uniquement pour cette catégorie.
- Différenciation visuelle des dépôts et retraits de caisse noire par un fond noir à 50 % sur le montant.
- Tri des catégories de Stocks sans prise en compte des emojis.
- Recherche par catégorie pour les mouvements simples et multiples.
- Badges Annuaire `HC` et `NON-RENSEIGNE` en `#101010`.
- Système de déplacement entre les tableaux Membres, Contacts et Forces de l’ordre : création dans la destination puis suppression de la source.

Aucune migration SQL supplémentaire n’est requise si les politiques Supabase existantes autorisent déjà l’ajout et la suppression dans les trois tables de l’Annuaire.


## Version 1.6.5 — correctifs de stabilité

- Carte : ajout d’un véritable bandeau supérieur avec identité du HUB et retour cliquable vers l’accueil, y compris sur mobile.
- Stocks : réparation de la régression JavaScript qui bloquait les mouvements et l’affichage des stocks par lieu ; tri alphabétique des catégories en ignorant les emojis.
- Comptabilité : contraste noir à 50 % rendu visible sur les montants des dépôts et retraits de caisse noire.
- Annuaire : badges HC et NON-RENSEIGNÉ forcés en `#101010`.
- Cache : versionnement `v=1.6.5` des ressources modifiées.
