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
