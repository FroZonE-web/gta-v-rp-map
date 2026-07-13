-- =========================================================
-- ASHEN WOLVES HUB v1.2 — FIX ACCÈS PUBLIC ANNUAIRE
-- À exécuter si ANNUAIRE_SETUP.sql a déjà été installé.
-- =========================================================

alter table public.directory_members enable row level security;

drop policy if exists "directory_members_authenticated_read" on public.directory_members;
drop policy if exists "directory_members_public_read" on public.directory_members;

create policy "directory_members_public_read"
on public.directory_members
for select
to anon, authenticated
using (true);
