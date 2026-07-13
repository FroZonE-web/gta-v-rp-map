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
