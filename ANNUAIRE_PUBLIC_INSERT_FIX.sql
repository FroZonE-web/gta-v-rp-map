-- =========================================================
-- ASHEN WOLVES HUB v1.2 — FIX AJOUT ANNUAIRE PUBLIC
-- À exécuter si le module Annuaire est déjà installé.
-- Autorise l’ajout aux visiteurs anonymes et aux comptes connectés.
-- La modification et la suppression restent administrateur uniquement.
-- =========================================================

alter table public.directory_members enable row level security;

drop policy if exists "directory_members_admin_insert" on public.directory_members;
drop policy if exists "directory_members_member_insert" on public.directory_members;
drop policy if exists "directory_members_public_insert" on public.directory_members;

create policy "directory_members_public_insert"
on public.directory_members
for insert
to anon, authenticated
with check (true);
