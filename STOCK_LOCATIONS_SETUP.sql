-- Ashen Wolves HUB v1.4 — Lieux de stockage
-- À exécuter après STOCKS_SETUP.sql sur une installation existante.

create table if not exists public.stock_locations (
  id uuid primary key default gen_random_uuid(),
  name text not null unique check (char_length(trim(name)) between 1 and 120),
  type text not null check (type in ('home', 'vehicle')),
  capacity_weight numeric(14,3) not null check (capacity_weight > 0),
  location text check (location is null or char_length(trim(location)) <= 220),
  notes text check (notes is null or char_length(notes) <= 800),
  -- Valeur provisoire à 0 tant que les mouvements ne sont pas encore développés.
  -- La prochaine phase la maintiendra automatiquement à partir des quantités.
  used_weight numeric(14,3) not null default 0 check (used_weight >= 0),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create or replace function public.set_stock_location_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

drop trigger if exists trg_stock_location_updated_at on public.stock_locations;
create trigger trg_stock_location_updated_at
before update on public.stock_locations
for each row execute function public.set_stock_location_updated_at();

alter table public.stock_locations enable row level security;

drop policy if exists "stock_locations_read" on public.stock_locations;
drop policy if exists "stock_locations_insert" on public.stock_locations;
drop policy if exists "stock_locations_update" on public.stock_locations;
drop policy if exists "stock_locations_delete_admin" on public.stock_locations;

create policy "stock_locations_read"
on public.stock_locations for select
to anon, authenticated
using (true);

create policy "stock_locations_insert"
on public.stock_locations for insert
to anon, authenticated
with check (true);

create policy "stock_locations_update"
on public.stock_locations for update
to anon, authenticated
using (true)
with check (true);

create policy "stock_locations_delete_admin"
on public.stock_locations for delete
to authenticated
using (public.is_admin());
