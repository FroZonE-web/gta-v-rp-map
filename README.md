Atlas RP v0.5 - recherche, favoris et administration Supabase.


## v0.7 — Polyzones
- Polygones et rectangles persistants via Supabase (`zones`).
- Création publique, suppression réservée aux administrateurs.
- Couleurs automatiques pour gangs et productions.


## v0.8.0 — Médias
Les administrateurs peuvent ajouter, choisir comme principale et supprimer des images sur les marqueurs et polyzones via Supabase Storage (`atlas-media`) et la table `atlas_media`.


## Ashen Wolves HUB v1.2 fix Badges Annuaire
Couleurs personnalisées des badges, tableau Contacts compacté et création de nouveaux emplois/entités avec choix de couleur. Voir ANNUAIRE_BADGES_README.txt.

## Stocks — Mouvements

Pour activer les dépôts, retraits et l'historique, exécuter `STOCK_MOVEMENTS_SETUP.sql` dans l'éditeur SQL Supabase après les scripts Stocks précédents.

## Ashen Wolves HUB v1.4.1 — Amélioration Stocks

Pour une base Supabase existante, exécuter `STOCK_BULK_MOVEMENTS_SETUP.sql` afin d’activer les mouvements multiples atomiques. Les autres changements sont uniquement côté interface.

## Comptabilité v1.5.3

Cette version ajoute le prototype de la Caisse noire, le calcul des valeurs théoriques des opérations d'items et un thème local plus sombre pour la Comptabilité. Aucune migration SQL n'est nécessaire : les validations restent simulées.

## Comptabilité v1.5.4

Exécuter `COMPTABILITE_SETUP.sql` dans Supabase pour activer les soldes, recettes rapides, transferts, caisse noire, historique et temps réel.
