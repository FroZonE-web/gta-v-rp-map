-- Ashen Wolves HUB v1.7.0 — Module Craft
-- À exécuter après les scripts Stocks et Comptabilité.
create extension if not exists pgcrypto;

create table if not exists public.craft_categories (
  id uuid primary key default gen_random_uuid(),
  name text not null unique check (char_length(trim(name)) between 1 and 80),
  created_at timestamptz not null default now()
);

create table if not exists public.craft_recipes (
  id uuid primary key default gen_random_uuid(),
  category_id uuid not null references public.craft_categories(id) on update cascade on delete restrict,
  output_item_id uuid not null unique references public.stock_items(id) on update cascade on delete restrict,
  created_by uuid default auth.uid(),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.craft_recipe_ingredients (
  id uuid primary key default gen_random_uuid(),
  recipe_id uuid not null references public.craft_recipes(id) on delete cascade,
  item_id uuid not null references public.stock_items(id) on update cascade on delete restrict,
  quantity integer not null check (quantity > 0),
  unique(recipe_id, item_id)
);

create table if not exists public.craft_runs (
  id uuid primary key default gen_random_uuid(),
  recipe_id uuid references public.craft_recipes(id) on delete set null,
  recipe_name text not null,
  quantity integer not null check (quantity > 0),
  destination text not null check (destination in ('stock','sell','keep')),
  destination_location text,
  customer text,
  sale_amount numeric(14,2),
  money_type text check (money_type is null or money_type in ('clean','dirty')),
  actor_label text,
  created_by uuid default auth.uid(),
  created_at timestamptz not null default now()
);

create table if not exists public.craft_run_ingredients (
  id uuid primary key default gen_random_uuid(),
  run_id uuid not null references public.craft_runs(id) on delete cascade,
  item_name text not null,
  quantity integer not null check (quantity > 0),
  allocations jsonb not null default '[]'::jsonb
);

create index if not exists craft_recipes_category_idx on public.craft_recipes(category_id);
create index if not exists craft_runs_created_at_idx on public.craft_runs(created_at desc);

alter table public.craft_categories enable row level security;
alter table public.craft_recipes enable row level security;
alter table public.craft_recipe_ingredients enable row level security;
alter table public.craft_runs enable row level security;
alter table public.craft_run_ingredients enable row level security;

drop policy if exists "craft categories read" on public.craft_categories;
create policy "craft categories read" on public.craft_categories for select to anon, authenticated using (true);
drop policy if exists "craft categories insert" on public.craft_categories;
create policy "craft categories insert" on public.craft_categories for insert to anon, authenticated with check (true);
drop policy if exists "craft recipes read" on public.craft_recipes;
create policy "craft recipes read" on public.craft_recipes for select to anon, authenticated using (true);
drop policy if exists "craft ingredients read" on public.craft_recipe_ingredients;
create policy "craft ingredients read" on public.craft_recipe_ingredients for select to anon, authenticated using (true);
drop policy if exists "craft runs read" on public.craft_runs;
create policy "craft runs read" on public.craft_runs for select to anon, authenticated using (true);
drop policy if exists "craft run ingredients read" on public.craft_run_ingredients;
create policy "craft run ingredients read" on public.craft_run_ingredients for select to anon, authenticated using (true);

grant select on public.craft_categories, public.craft_recipes, public.craft_recipe_ingredients, public.craft_runs, public.craft_run_ingredients to anon, authenticated;

alter table public.stock_movements add column if not exists source_type text not null default 'manual';
alter table public.stock_movements drop constraint if exists stock_movements_source_type_check;
alter table public.stock_movements add constraint stock_movements_source_type_check
  check (source_type in ('manual','purchase','resale','craft'));

create or replace function public.create_craft_recipe(
  p_category_name text,
  p_item_name text,
  p_image_url text,
  p_ingredients jsonb
) returns uuid
language plpgsql security definer set search_path=public as $$
declare
  v_category_id uuid; v_stock_category_id uuid; v_item_id uuid; v_recipe_id uuid; v_line jsonb;
  v_ingredient_id uuid; v_qty integer;
begin
  if nullif(trim(p_category_name),'') is null or nullif(trim(p_item_name),'') is null then
    raise exception 'La catégorie et le nom du craft sont obligatoires.';
  end if;
  if jsonb_typeof(p_ingredients) <> 'array' or jsonb_array_length(p_ingredients)=0 then
    raise exception 'Ajoute au moins un composant.';
  end if;

  insert into public.craft_categories(name) values(trim(p_category_name))
  on conflict(name) do update set name=excluded.name returning id into v_category_id;

  select id into v_stock_category_id from public.stock_categories where lower(trim(name))=lower(trim(p_category_name)) limit 1;
  if v_stock_category_id is null then
    insert into public.stock_categories(name) values(trim(p_category_name)) returning id into v_stock_category_id;
  end if;

  select id into v_item_id from public.stock_items where lower(trim(name))=lower(trim(p_item_name)) limit 1;
  if v_item_id is null then
    insert into public.stock_items(name,image_url,unit_weight,category_id,clean_value,dirty_mode,dirty_input)
    values(trim(p_item_name),nullif(trim(p_image_url),''),0,v_stock_category_id,0,'fixed',0)
    returning id into v_item_id;
  elsif nullif(trim(p_image_url),'') is not null then
    update public.stock_items set image_url=trim(p_image_url) where id=v_item_id and coalesce(image_url,'')='';
  end if;

  if exists(select 1 from public.craft_recipes where output_item_id=v_item_id) then
    raise exception 'Un craft existe déjà pour cet item.';
  end if;

  insert into public.craft_recipes(category_id,output_item_id) values(v_category_id,v_item_id) returning id into v_recipe_id;
  for v_line in select value from jsonb_array_elements(p_ingredients) loop
    v_ingredient_id := nullif(v_line->>'item_id','')::uuid;
    v_qty := coalesce((v_line->>'quantity')::integer,0);
    if v_ingredient_id is null or v_qty<=0 then raise exception 'Un composant est invalide.'; end if;
    if v_ingredient_id=v_item_id then raise exception 'Un item ne peut pas être son propre composant.'; end if;
    insert into public.craft_recipe_ingredients(recipe_id,item_id,quantity)
    values(v_recipe_id,v_ingredient_id,v_qty);
  end loop;
  return v_recipe_id;
end; $$;
grant execute on function public.create_craft_recipe(text,text,text,jsonb) to anon, authenticated;

create or replace function public.execute_craft(
  p_recipe_id uuid,
  p_quantity integer,
  p_allocations jsonb,
  p_destination text,
  p_destination_location_id uuid default null,
  p_customer text default null,
  p_sale_amount numeric default null,
  p_money_type text default null,
  p_actor_label text default null
) returns uuid
language plpgsql security definer set search_path=public as $$
declare
  v_recipe record; v_ing record; v_alloc jsonb; v_location_id uuid; v_qty integer; v_total_alloc integer;
  v_required integer; v_current integer; v_weight numeric(14,3); v_used numeric(14,3); v_capacity numeric(14,3);
  v_delta numeric(16,3); v_run_id uuid; v_location_name text; v_alloc_snapshot jsonb; v_account_id uuid;
begin
  if p_quantity is null or p_quantity<=0 then raise exception 'La quantité doit être supérieure à zéro.'; end if;
  if p_destination not in ('stock','sell','keep') then raise exception 'Destination invalide.'; end if;
  if jsonb_typeof(p_allocations)<>'array' then raise exception 'Répartition des composants invalide.'; end if;

  select r.id, r.output_item_id, i.name output_name, i.unit_weight output_weight
  into v_recipe from public.craft_recipes r join public.stock_items i on i.id=r.output_item_id where r.id=p_recipe_id;
  if not found then raise exception 'Craft introuvable.'; end if;

  for v_ing in select cri.item_id, cri.quantity, si.name, si.unit_weight
    from public.craft_recipe_ingredients cri join public.stock_items si on si.id=cri.item_id where cri.recipe_id=p_recipe_id
  loop
    v_required := v_ing.quantity*p_quantity; v_total_alloc:=0; v_alloc_snapshot:='[]'::jsonb;
    for v_alloc in select value from jsonb_array_elements(p_allocations) where value->>'item_id'=v_ing.item_id::text loop
      v_location_id:=nullif(v_alloc->>'location_id','')::uuid; v_qty:=coalesce((v_alloc->>'quantity')::integer,0);
      if v_location_id is null or v_qty<=0 then continue; end if;
      select capacity_weight,used_weight,name into v_capacity,v_used,v_location_name from public.stock_locations where id=v_location_id for update;
      if not found then raise exception 'Lieu de prélèvement introuvable.'; end if;
      insert into public.stock_balances(item_id,location_id,quantity) values(v_ing.item_id,v_location_id,0) on conflict do nothing;
      select quantity into v_current from public.stock_balances where item_id=v_ing.item_id and location_id=v_location_id for update;
      if v_qty>v_current then raise exception 'Stock insuffisant pour % dans %.',v_ing.name,v_location_name; end if;
      v_delta:=round(v_ing.unit_weight*v_qty,3);
      update public.stock_balances set quantity=v_current-v_qty,updated_at=now() where item_id=v_ing.item_id and location_id=v_location_id;
      update public.stock_locations set used_weight=greatest(0,round(v_used-v_delta,3)),updated_at=now() where id=v_location_id;
      insert into public.stock_movements(item_id,location_id,movement_type,source_type,quantity,unit_weight_snapshot,total_weight,created_by,created_by_label)
      values(v_ing.item_id,v_location_id,'withdrawal','craft',v_qty,v_ing.unit_weight,v_delta,auth.uid(),nullif(trim(p_actor_label),''));
      v_total_alloc:=v_total_alloc+v_qty;
      v_alloc_snapshot:=v_alloc_snapshot||jsonb_build_array(jsonb_build_object('location',v_location_name,'quantity',v_qty));
    end loop;
    if v_total_alloc<>v_required then raise exception 'Répartition incomplète pour % : % sur %.',v_ing.name,v_total_alloc,v_required; end if;
  end loop;

  if p_destination='stock' then
    if p_destination_location_id is null then raise exception 'Le lieu de stockage de destination est obligatoire.'; end if;
    select capacity_weight,used_weight,name into v_capacity,v_used,v_location_name from public.stock_locations where id=p_destination_location_id for update;
    if not found then raise exception 'Lieu de destination introuvable.'; end if;
    v_delta:=round(v_recipe.output_weight*p_quantity,3);
    if v_used+v_delta>v_capacity then raise exception 'Capacité insuffisante dans le lieu de destination.'; end if;
    insert into public.stock_balances(item_id,location_id,quantity) values(v_recipe.output_item_id,p_destination_location_id,0) on conflict do nothing;
    select quantity into v_current from public.stock_balances where item_id=v_recipe.output_item_id and location_id=p_destination_location_id for update;
    update public.stock_balances set quantity=v_current+p_quantity,updated_at=now() where item_id=v_recipe.output_item_id and location_id=p_destination_location_id;
    update public.stock_locations set used_weight=round(v_used+v_delta,3),updated_at=now() where id=p_destination_location_id;
    insert into public.stock_movements(item_id,location_id,movement_type,source_type,quantity,unit_weight_snapshot,total_weight,created_by,created_by_label)
    values(v_recipe.output_item_id,p_destination_location_id,'deposit','craft',p_quantity,v_recipe.output_weight,v_delta,auth.uid(),nullif(trim(p_actor_label),''));
  elsif p_destination='sell' then
    if nullif(trim(p_customer),'') is null or p_sale_amount is null or p_sale_amount<=0 then raise exception 'Client et prix obligatoires.'; end if;
    if p_money_type not in ('clean','dirty') then raise exception 'Type d’argent invalide.'; end if;
    insert into public.accounting_transactions(account,money_type,direction,operation_type,title,amount,counterparty,label)
    values('club',p_money_type,'credit','craft_sale','Vente de craft — '||v_recipe.output_name,p_sale_amount,trim(p_customer),nullif(trim(p_actor_label),'')) returning id into v_account_id;
  end if;

  insert into public.craft_runs(recipe_id,recipe_name,quantity,destination,destination_location,customer,sale_amount,money_type,actor_label)
  values(p_recipe_id,v_recipe.output_name,p_quantity,p_destination,case when p_destination='stock' then v_location_name end,
    nullif(trim(p_customer),''),p_sale_amount,p_money_type,nullif(trim(p_actor_label),'')) returning id into v_run_id;

  for v_ing in select cri.item_id,cri.quantity,si.name from public.craft_recipe_ingredients cri join public.stock_items si on si.id=cri.item_id where cri.recipe_id=p_recipe_id loop
    v_alloc_snapshot:='[]'::jsonb;
    for v_alloc in select value from jsonb_array_elements(p_allocations) where value->>'item_id'=v_ing.item_id::text loop
      select name into v_location_name from public.stock_locations where id=(v_alloc->>'location_id')::uuid;
      v_alloc_snapshot:=v_alloc_snapshot||jsonb_build_array(jsonb_build_object('location',v_location_name,'quantity',(v_alloc->>'quantity')::integer));
    end loop;
    insert into public.craft_run_ingredients(run_id,item_name,quantity,allocations)
    values(v_run_id,v_ing.name,v_ing.quantity*p_quantity,v_alloc_snapshot);
  end loop;
  return v_run_id;
end; $$;
grant execute on function public.execute_craft(uuid,integer,jsonb,text,uuid,text,numeric,text,text) to anon, authenticated;

do $$ begin alter publication supabase_realtime add table public.craft_recipes; exception when duplicate_object then null; end $$;
do $$ begin alter publication supabase_realtime add table public.craft_runs; exception when duplicate_object then null; end $$;
