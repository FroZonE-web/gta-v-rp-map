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
