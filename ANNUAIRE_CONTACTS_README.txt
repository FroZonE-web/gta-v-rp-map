ASHEN WOLVES HUB v1.2 — PERSONNES RENCONTRÉES

1. Exécuter ANNUAIRE_CONTACTS_SETUP.sql dans Supabase > SQL Editor.
2. Lecture et ajout sont publics (anon et authenticated).
3. Modification et suppression restent réservées aux administrateurs via is_admin().
4. Les données visibles sur les captures Google Sheets ne sont pas injectées automatiquement : les captures ne constituent pas un export structuré fiable. Un export CSV pourra être importé sans ressaisie lors d'une étape dédiée.

MISE À JOUR DES DONNÉES FOURNIES
--------------------------------
Si la table directory_contacts existe déjà, exécuter ANNUAIRE_CONTACTS_DATA.sql.
Ce script ajoute les 163 contacts retranscrits depuis les captures fournies et évite les doublons sur les informations principales.

Pour une nouvelle installation, ANNUAIRE_CONTACTS_SETUP.sql crée la table, configure les permissions et ajoute directement ces contacts.
