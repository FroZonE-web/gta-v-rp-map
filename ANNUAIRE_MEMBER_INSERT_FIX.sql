-- =========================================================
-- ASHEN WOLVES HUB v1.2 — FIX AJOUT MEMBRE POUR UTILISATEURS
-- À exécuter si ANNUAIRE_SETUP.sql a déjà été installé.
-- =========================================================

alter table public.directory_members enable row level security;

drop policy if exists "directory_members_admin_insert" on public.directory_members;
drop policy if exists "directory_members_member_insert" on public.directory_members;

create policy "directory_members_member_insert"
on public.directory_members
for insert
to authenticated
with check (auth.uid() is not null);

-- La modification et la suppression restent réservées aux administrateurs.
