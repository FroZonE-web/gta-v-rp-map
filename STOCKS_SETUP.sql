-- Ashen Wolves HUB v1.4 — Banque d'items
create extension if not exists pgcrypto;

create table if not exists public.stock_categories (
  id uuid primary key default gen_random_uuid(),
  name text not null unique check (char_length(trim(name)) between 1 and 80),
  created_at timestamptz not null default now()
);

create table if not exists public.stock_items (
  id uuid primary key default gen_random_uuid(),
  name text not null unique check (char_length(trim(name)) between 1 and 120),
  image_url text,
  unit_weight numeric(12,3) not null default 0 check (unit_weight >= 0),
  category_id uuid not null references public.stock_categories(id) on update cascade on delete restrict,
  clean_value numeric(14,2) not null default 0 check (clean_value >= 0),
  dirty_mode text not null default 'fixed' check (dirty_mode in ('fixed','multiplier','percentage')),
  dirty_input numeric(14,4) not null default 0 check (dirty_input >= 0),
  critical_threshold integer check (critical_threshold is null or critical_threshold >= 0),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create or replace function public.set_stock_item_updated_at() returns trigger language plpgsql as $$
begin new.updated_at = now(); return new; end; $$;
drop trigger if exists trg_stock_item_updated_at on public.stock_items;
create trigger trg_stock_item_updated_at before update on public.stock_items for each row execute function public.set_stock_item_updated_at();

alter table public.stock_categories enable row level security;
alter table public.stock_items enable row level security;

drop policy if exists "stock_categories_read" on public.stock_categories;
drop policy if exists "stock_categories_insert" on public.stock_categories;
drop policy if exists "stock_categories_update" on public.stock_categories;
drop policy if exists "stock_categories_delete_admin" on public.stock_categories;
create policy "stock_categories_read" on public.stock_categories for select to anon, authenticated using (true);
create policy "stock_categories_insert" on public.stock_categories for insert to anon, authenticated with check (true);
create policy "stock_categories_update" on public.stock_categories for update to anon, authenticated using (true) with check (true);
create policy "stock_categories_delete_admin" on public.stock_categories for delete to authenticated using (public.is_admin());

drop policy if exists "stock_items_read" on public.stock_items;
drop policy if exists "stock_items_insert" on public.stock_items;
drop policy if exists "stock_items_update" on public.stock_items;
drop policy if exists "stock_items_delete_admin" on public.stock_items;
create policy "stock_items_read" on public.stock_items for select to anon, authenticated using (true);
create policy "stock_items_insert" on public.stock_items for insert to anon, authenticated with check (true);
create policy "stock_items_update" on public.stock_items for update to anon, authenticated using (true) with check (true);
create policy "stock_items_delete_admin" on public.stock_items for delete to authenticated using (public.is_admin());

insert into storage.buckets (id, name, public) values ('stock-items','stock-items',true) on conflict (id) do update set public=true;
drop policy if exists "stock_item_images_read" on storage.objects;
drop policy if exists "stock_item_images_insert" on storage.objects;
create policy "stock_item_images_read" on storage.objects for select to public using (bucket_id='stock-items');
create policy "stock_item_images_insert" on storage.objects for insert to anon, authenticated with check (bucket_id='stock-items');

-- Phase 2 : lieux de stockage
create table if not exists public.stock_locations (
  id uuid primary key default gen_random_uuid(),
  name text not null unique check (char_length(trim(name)) between 1 and 120),
  type text not null check (type in ('home', 'vehicle')),
  capacity_weight numeric(14,3) not null check (capacity_weight > 0),
  location text check (location is null or char_length(trim(location)) <= 220),
  notes text check (notes is null or char_length(notes) <= 800),
  used_weight numeric(14,3) not null default 0 check (used_weight >= 0),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create or replace function public.set_stock_location_updated_at() returns trigger language plpgsql as $$
begin new.updated_at = now(); return new; end; $$;
drop trigger if exists trg_stock_location_updated_at on public.stock_locations;
create trigger trg_stock_location_updated_at before update on public.stock_locations for each row execute function public.set_stock_location_updated_at();
alter table public.stock_locations enable row level security;
drop policy if exists "stock_locations_read" on public.stock_locations;
drop policy if exists "stock_locations_insert" on public.stock_locations;
drop policy if exists "stock_locations_update" on public.stock_locations;
drop policy if exists "stock_locations_delete_admin" on public.stock_locations;
create policy "stock_locations_read" on public.stock_locations for select to anon, authenticated using (true);
create policy "stock_locations_insert" on public.stock_locations for insert to anon, authenticated with check (true);
create policy "stock_locations_update" on public.stock_locations for update to anon, authenticated using (true) with check (true);
create policy "stock_locations_delete_admin" on public.stock_locations for delete to authenticated using (public.is_admin());
