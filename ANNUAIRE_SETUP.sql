-- =========================================================
-- ASHEN WOLVES HUB v1.2 — ANNUAIRE INTERNE
-- À exécuter une seule fois dans l'éditeur SQL Supabase.
-- =========================================================

create extension if not exists pgcrypto;

create table if not exists public.directory_members (
  id uuid primary key default gen_random_uuid(),
  grade_code text not null,
  sort_order smallint not null check (sort_order between 1 and 16),
  first_name text not null,
  nickname text,
  last_name text not null,
  identity_name text not null,
  rib text,
  phone text,
  address text,
  housing_type text,
  district text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint directory_members_sort_order_key unique (sort_order)
);

comment on table public.directory_members is
  'Annuaire interne du Ashen Wolves MC. Maximum 16 membres, triés par ordre hiérarchique.';

create or replace function public.directory_members_set_updated_at()
returns trigger
language plpgsql
security invoker
set search_path = public
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

drop trigger if exists directory_members_updated_at on public.directory_members;
create trigger directory_members_updated_at
before update on public.directory_members
for each row execute function public.directory_members_set_updated_at();

create or replace function public.directory_members_enforce_limit()
returns trigger
language plpgsql
security invoker
set search_path = public
as $$
begin
  if (select count(*) from public.directory_members) >= 16 then
    raise exception 'La limite de 16 membres actifs est atteinte.';
  end if;
  return new;
end;
$$;

drop trigger if exists directory_members_limit on public.directory_members;
create trigger directory_members_limit
before insert on public.directory_members
for each row execute function public.directory_members_enforce_limit();

alter table public.directory_members enable row level security;

drop policy if exists "directory_members_authenticated_read" on public.directory_members;
create policy "directory_members_authenticated_read"
on public.directory_members
for select
to authenticated
using (true);

drop policy if exists "directory_members_admin_insert" on public.directory_members;
create policy "directory_members_admin_insert"
on public.directory_members
for insert
to authenticated
with check (public.is_admin());

drop policy if exists "directory_members_admin_update" on public.directory_members;
create policy "directory_members_admin_update"
on public.directory_members
for update
to authenticated
using (public.is_admin())
with check (public.is_admin());

drop policy if exists "directory_members_admin_delete" on public.directory_members;
create policy "directory_members_admin_delete"
on public.directory_members
for delete
to authenticated
using (public.is_admin());

-- Données visibles dans le Google Sheet transmis.
-- Le script n'insère rien si l'ordre hiérarchique existe déjà.
insert into public.directory_members
  (grade_code, sort_order, first_name, nickname, last_name, identity_name, rib, phone, address, housing_type, district)
values
  ('N1', 1, 'Mason', 'Iron', 'MORETTI', 'Mason MORETTI', '900Z8057T432', '3515', '07 - PEACEFULSTREET', 'Duplex', 'PILLBOX HILL'),
  ('N3', 3, 'Silas', 'Lock', 'BLACKWOOD', 'Silas BLACKWOOD', '473z9292t133', '3015', '03 - PEACEFUL STREET', 'Plein pied', 'DEL PERRO'),
  ('N4', 4, 'Raven', null, 'BLACKWOOD', 'Raven BLACKWOOD', '389Z2363T129', '0940', '07 - PEACEFULSTREET', 'Duplex', 'PILLBOX HILL'),
  ('N9', 9, 'Sancho', null, 'RAMIREZ', 'Sancho RAMIREZ', '902Z6467T965', '9534', '01 - VITRUS STREET', 'Entrée de gamme mur vert bordeaux', 'Vespucci beach')
on conflict (sort_order) do nothing;
