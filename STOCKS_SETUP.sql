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
-- Ashen Wolves HUB v1.4 — Mouvements de stock
-- À exécuter après STOCKS_SETUP.sql et STOCK_LOCATIONS_SETUP.sql.

create table if not exists public.stock_balances (
  id uuid primary key default gen_random_uuid(),
  item_id uuid not null references public.stock_items(id) on update cascade on delete restrict,
  location_id uuid not null references public.stock_locations(id) on update cascade on delete restrict,
  quantity integer not null default 0 check (quantity >= 0),
  updated_at timestamptz not null default now(),
  unique (item_id, location_id)
);

create table if not exists public.stock_movements (
  id uuid primary key default gen_random_uuid(),
  item_id uuid not null references public.stock_items(id) on update cascade on delete restrict,
  location_id uuid not null references public.stock_locations(id) on update cascade on delete restrict,
  movement_type text not null check (movement_type in ('deposit', 'withdrawal')),
  quantity integer not null check (quantity > 0),
  unit_weight_snapshot numeric(14,3) not null check (unit_weight_snapshot >= 0),
  total_weight numeric(16,3) not null check (total_weight >= 0),
  created_by uuid references auth.users(id) on delete set null,
  created_by_label text check (created_by_label is null or char_length(trim(created_by_label)) <= 100),
  created_at timestamptz not null default now()
);

create index if not exists idx_stock_balances_item on public.stock_balances(item_id);
create index if not exists idx_stock_balances_location on public.stock_balances(location_id);
create index if not exists idx_stock_movements_created_at on public.stock_movements(created_at desc);
create index if not exists idx_stock_movements_item on public.stock_movements(item_id);
create index if not exists idx_stock_movements_location on public.stock_movements(location_id);

alter table public.stock_balances enable row level security;
alter table public.stock_movements enable row level security;

drop policy if exists "stock_balances_read" on public.stock_balances;
create policy "stock_balances_read" on public.stock_balances
for select to anon, authenticated using (true);

drop policy if exists "stock_movements_read" on public.stock_movements;
create policy "stock_movements_read" on public.stock_movements
for select to anon, authenticated using (true);

-- Aucun INSERT/UPDATE/DELETE direct n'est autorisé sur les quantités.
-- Tous les mouvements passent par cette fonction atomique.
create or replace function public.create_stock_movement(
  p_item_id uuid,
  p_location_id uuid,
  p_movement_type text,
  p_quantity integer,
  p_actor_label text default null
) returns jsonb
language plpgsql
security definer
set search_path = public
as $$
declare
  v_unit_weight numeric(14,3);
  v_capacity numeric(14,3);
  v_used numeric(14,3);
  v_current_quantity integer;
  v_new_quantity integer;
  v_total_weight numeric(16,3);
  v_new_used numeric(14,3);
  v_movement_id uuid;
begin
  if p_movement_type not in ('deposit', 'withdrawal') then
    raise exception 'Type de mouvement invalide.';
  end if;
  if p_quantity is null or p_quantity <= 0 then
    raise exception 'La quantité doit être supérieure à zéro.';
  end if;

  select unit_weight into v_unit_weight
  from public.stock_items
  where id = p_item_id
  for share;
  if not found then raise exception 'Item introuvable.'; end if;

  select capacity_weight, used_weight into v_capacity, v_used
  from public.stock_locations
  where id = p_location_id
  for update;
  if not found then raise exception 'Lieu de stockage introuvable.'; end if;

  insert into public.stock_balances(item_id, location_id, quantity)
  values (p_item_id, p_location_id, 0)
  on conflict (item_id, location_id) do nothing;

  select quantity into v_current_quantity
  from public.stock_balances
  where item_id = p_item_id and location_id = p_location_id
  for update;

  v_total_weight := round(v_unit_weight * p_quantity, 3);

  if p_movement_type = 'deposit' then
    v_new_quantity := v_current_quantity + p_quantity;
    v_new_used := round(v_used + v_total_weight, 3);
    if v_new_used > v_capacity then
      raise exception 'Capacité dépassée : % kg disponibles, % kg nécessaires.', greatest(v_capacity - v_used, 0), v_total_weight;
    end if;
  else
    if p_quantity > v_current_quantity then
      raise exception 'Stock insuffisant : % unité(s) disponible(s).', v_current_quantity;
    end if;
    v_new_quantity := v_current_quantity - p_quantity;
    v_new_used := greatest(0, round(v_used - v_total_weight, 3));
  end if;

  update public.stock_balances
  set quantity = v_new_quantity, updated_at = now()
  where item_id = p_item_id and location_id = p_location_id;

  update public.stock_locations
  set used_weight = v_new_used, updated_at = now()
  where id = p_location_id;

  insert into public.stock_movements(
    item_id, location_id, movement_type, quantity,
    unit_weight_snapshot, total_weight, created_by, created_by_label
  ) values (
    p_item_id, p_location_id, p_movement_type, p_quantity,
    v_unit_weight, v_total_weight, auth.uid(), nullif(trim(p_actor_label), '')
  ) returning id into v_movement_id;

  return jsonb_build_object(
    'movement_id', v_movement_id,
    'quantity', v_new_quantity,
    'used_weight', v_new_used,
    'capacity_weight', v_capacity
  );
end;
$$;

grant execute on function public.create_stock_movement(uuid, uuid, text, integer, text) to anon, authenticated;

-- Si le poids d'un item est modifié, les poids utilisés des lieux concernés
-- sont recalculés automatiquement à partir des quantités réelles.
create or replace function public.recalculate_stock_location_weights_for_item()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  if new.unit_weight is distinct from old.unit_weight then
    update public.stock_locations l
    set used_weight = coalesce((
      select round(sum(b.quantity * i.unit_weight), 3)
      from public.stock_balances b
      join public.stock_items i on i.id = b.item_id
      where b.location_id = l.id
    ), 0), updated_at = now()
    where exists (
      select 1 from public.stock_balances b
      where b.location_id = l.id and b.item_id = new.id
    );
  end if;
  return new;
end;
$$;

drop trigger if exists trg_recalculate_location_weights_on_item_weight on public.stock_items;
create trigger trg_recalculate_location_weights_on_item_weight
after update of unit_weight on public.stock_items
for each row execute function public.recalculate_stock_location_weights_for_item();

-- Active les mises à jour instantanées pour les clients ouverts.
do $$
begin
  begin alter publication supabase_realtime add table public.stock_balances; exception when duplicate_object then null; end;
  begin alter publication supabase_realtime add table public.stock_movements; exception when duplicate_object then null; end;
  begin alter publication supabase_realtime add table public.stock_locations; exception when duplicate_object then null; end;
end $$;

-- v1.4.5 — Publication Realtime complète du module Stocks.
do $$
begin
  begin alter publication supabase_realtime add table public.stock_categories; exception when duplicate_object then null; end;
  begin alter publication supabase_realtime add table public.stock_items; exception when duplicate_object then null; end;
  begin alter publication supabase_realtime add table public.stock_locations; exception when duplicate_object then null; end;
  begin alter publication supabase_realtime add table public.stock_balances; exception when duplicate_object then null; end;
  begin alter publication supabase_realtime add table public.stock_movements; exception when duplicate_object then null; end;
end $$;
-- Ashen Wolves HUB v1.4.1 — mouvements de stock multiples atomiques
create or replace function public.create_stock_movements_bulk(
  p_location_id uuid,
  p_movement_type text,
  p_entries jsonb,
  p_actor_label text default null
) returns jsonb
language plpgsql
security definer
set search_path = public
as $$
declare
  v_capacity numeric(14,3);
  v_used numeric(14,3);
  v_new_used numeric(14,3);
  v_entry jsonb;
  v_item_id uuid;
  v_quantity integer;
  v_unit_weight numeric(14,3);
  v_current_quantity integer;
  v_new_quantity integer;
  v_total_weight numeric(16,3);
  v_count integer := 0;
begin
  if p_movement_type not in ('deposit', 'withdrawal') then
    raise exception 'Type de mouvement invalide.';
  end if;
  if p_entries is null or jsonb_typeof(p_entries) <> 'array' or jsonb_array_length(p_entries) = 0 then
    raise exception 'Ajoute au moins un item.';
  end if;

  select capacity_weight, used_weight into v_capacity, v_used
  from public.stock_locations where id = p_location_id for update;
  if not found then raise exception 'Lieu de stockage introuvable.'; end if;
  v_new_used := v_used;

  for v_entry in select value from jsonb_array_elements(p_entries)
  loop
    v_item_id := nullif(v_entry->>'item_id','')::uuid;
    v_quantity := (v_entry->>'quantity')::integer;
    if v_item_id is null or v_quantity is null or v_quantity <= 0 then
      raise exception 'Une ligne du mouvement est invalide.';
    end if;

    select unit_weight into v_unit_weight from public.stock_items where id = v_item_id for share;
    if not found then raise exception 'Un item est introuvable.'; end if;

    insert into public.stock_balances(item_id, location_id, quantity)
    values (v_item_id, p_location_id, 0)
    on conflict (item_id, location_id) do nothing;

    select quantity into v_current_quantity
    from public.stock_balances
    where item_id = v_item_id and location_id = p_location_id
    for update;

    v_total_weight := round(v_unit_weight * v_quantity, 3);
    if p_movement_type = 'deposit' then
      v_new_quantity := v_current_quantity + v_quantity;
      v_new_used := round(v_new_used + v_total_weight, 3);
      if v_new_used > v_capacity then
        raise exception 'Capacité dépassée : % kg disponibles.', greatest(v_capacity - (v_new_used - v_total_weight), 0);
      end if;
    else
      if v_quantity > v_current_quantity then
        raise exception 'Stock insuffisant pour un item : % unité(s) disponible(s).', v_current_quantity;
      end if;
      v_new_quantity := v_current_quantity - v_quantity;
      v_new_used := greatest(0, round(v_new_used - v_total_weight, 3));
    end if;

    update public.stock_balances
    set quantity = v_new_quantity, updated_at = now()
    where item_id = v_item_id and location_id = p_location_id;

    insert into public.stock_movements(
      item_id, location_id, movement_type, quantity,
      unit_weight_snapshot, total_weight, created_by, created_by_label
    ) values (
      v_item_id, p_location_id, p_movement_type, v_quantity,
      v_unit_weight, v_total_weight, auth.uid(), nullif(trim(p_actor_label), '')
    );
    v_count := v_count + 1;
  end loop;

  update public.stock_locations
  set used_weight = v_new_used, updated_at = now()
  where id = p_location_id;

  return jsonb_build_object('movements', v_count, 'used_weight', v_new_used, 'capacity_weight', v_capacity);
end;
$$;
grant execute on function public.create_stock_movements_bulk(uuid, text, jsonb, text) to anon, authenticated;
