-- Ashen Wolves HUB v1.2 — Annuaire Forces de l'ordre
-- Lecture et ajout publics. Modification et suppression réservées aux administrateurs.

create table if not exists public.directory_law_enforcement (
  id uuid primary key default gen_random_uuid(),
  service text,
  badge_number text,
  first_name text,
  last_name text,
  phone text,
  address text,
  notes text,
  is_detective boolean not null default false,
  seed_key text unique,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint directory_law_enforcement_identity_check check (
    nullif(trim(coalesce(service, '')), '') is not null
    or nullif(trim(coalesce(badge_number, '')), '') is not null
    or nullif(trim(coalesce(first_name, '')), '') is not null
    or nullif(trim(coalesce(last_name, '')), '') is not null
    or nullif(trim(coalesce(phone, '')), '') is not null
  )
);

alter table public.directory_law_enforcement enable row level security;

drop policy if exists "directory_law_enforcement_public_read" on public.directory_law_enforcement;
create policy "directory_law_enforcement_public_read"
on public.directory_law_enforcement for select
to anon, authenticated
using (true);

drop policy if exists "directory_law_enforcement_public_insert" on public.directory_law_enforcement;
create policy "directory_law_enforcement_public_insert"
on public.directory_law_enforcement for insert
to anon, authenticated
with check (true);

drop policy if exists "directory_law_enforcement_admin_update" on public.directory_law_enforcement;
create policy "directory_law_enforcement_admin_update"
on public.directory_law_enforcement for update
to authenticated
using (public.is_admin())
with check (public.is_admin());

drop policy if exists "directory_law_enforcement_admin_delete" on public.directory_law_enforcement;
create policy "directory_law_enforcement_admin_delete"
on public.directory_law_enforcement for delete
to authenticated
using (public.is_admin());

create or replace function public.set_directory_law_enforcement_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

drop trigger if exists directory_law_enforcement_updated_at on public.directory_law_enforcement;
create trigger directory_law_enforcement_updated_at
before update on public.directory_law_enforcement
for each row execute function public.set_directory_law_enforcement_updated_at();

insert into public.directory_law_enforcement
(service, badge_number, first_name, last_name, phone, address, notes, is_detective, seed_key)
values
('BSCO', null, 'Edwin', 'LAGARDE', '0339', null, null, false, 'fdo-001'),
('LSPD', '12', null, 'ANDERSON', '5979', null, null, false, 'fdo-002'),
('LSPD', '72', null, 'VARNAK', '1019', 'J''la trouve je vide tout', 'par pitié', false, 'fdo-003'),
('SASP', null, null, 'STROTHER', '4865', null, null, false, 'fdo-004'),
('SASP', null, null, 'PITT', '8598', null, null, false, 'fdo-005'),
('LSPD', '26', 'Ewen', 'FROST', '1475', null, 'à surveiller - parle beaucoup - sergent', false, 'fdo-006'),
('LSPD', '31', 'Ryan', 'O''CONNOR', '8997', null, null, false, 'fdo-007'),
('LSPD', '05', null, null, '7011', null, null, false, 'fdo-008'),
('BSCO', null, 'Aiden', 'CADWELL', '2534', null, 'Sergent', false, 'fdo-009'),
('LSCS', '(11)', null, 'WAKEFIELD', null, null, null, false, 'fdo-010'),
('LSPD', null, 'James', 'HARRIS', null, null, null, false, 'fdo-011'),
('LSPD', null, null, null, '3136', null, null, false, 'fdo-012'),
('LSPD', '10', null, 'ZAPPA', null, null, null, false, 'fdo-013'),
('LSPD', '17', null, 'CALVETTI', '3775', null, null, false, 'fdo-014'),
(null, '36', 'Francis', null, null, null, null, false, 'fdo-015'),
('BSCO', null, 'Caelan', 'REDFALL', '7329', null, null, false, 'fdo-016'),
('LSPD', null, 'Léo', 'MORGAN ?', null, null, null, false, 'fdo-017'),
('SASP', null, 'Ryusei', 'SHIMIZU', null, null, 'TROOPER', false, 'fdo-018'),
(null, null, null, 'GULLOQ', '5906', null, null, false, 'fdo-019'),
(null, null, null, 'COBB', '1662', null, null, false, 'fdo-020')
on conflict (seed_key) do nothing;
