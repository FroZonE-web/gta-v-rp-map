ASHEN WOLVES HUB v1.2 — ANNUAIRE

1. Ouvrir Supabase > SQL Editor.
2. Exécuter ANNUAIRE_SETUP.sql.
3. Déployer ensuite tous les fichiers du ZIP sur GitHub Pages.

Permissions de cette version :
- tout le monde, connecté ou non : consultation ;
- utilisateur connecté : ajout d’un membre ;
- administrateur : ajout, modification et suppression ;
- mode visiteur administrateur : mêmes droits d’ajout qu’un utilisateur classique.

Si ANNUAIRE_SETUP.sql avait déjà été exécuté, exécuter uniquement
ANNUAIRE_PUBLIC_ACCESS_FIX.sql pour ouvrir la consultation publique.

Les lignes vacantes ne sont pas stockées et ne sont donc jamais affichées.
La base et l'interface limitent l'annuaire à 16 membres actifs.


CORRECTIF AJOUT PUBLIC
-----------------------
Tout visiteur, connecté ou non, peut ajouter une fiche membre.
La modification et la suppression restent réservées à l’administrateur.
Pour une installation existante, exécuter ANNUAIRE_PUBLIC_INSERT_FIX.sql.

CORRECTIF TRI AUTOMATIQUE
------------------------
Sur une installation existante, exécuter ANNUAIRE_AUTO_SORT_FIX.sql.
Le champ d'ordre hiérarchique n'est plus demandé dans le formulaire.
L'ordre affiché est calculé à partir du grade (N1, N2, N3...) puis de la date d'arrivée dans ce grade.
