-- Ashen Wolves HUB v1.5.5 — opérations comptables complexes
-- À exécuter après COMPTABILITE_SETUP.sql et les scripts Stocks v1.4.

alter table public.stock_movements
  add column if not exists source_type text not null default 'manual';

alter table public.stock_movements
  drop constraint if exists stock_movements_source_type_check;

alter table public.stock_movements
  add constraint stock_movements_source_type_check
  check (source_type in ('manual', 'purchase', 'resale'));

create or replace function public.create_complex_accounting_operation(
  p_operation text,
  p_money_type text,
  p_amount numeric,
  p_counterparty text,
  p_label text default null,
  p_lines jsonb default '[]'::jsonb,
  p_service_name text default null
)
returns jsonb
language plpgsql
security definer
set search_path = public
as $$
declare
  v_balance numeric(14,2);
  v_transaction_id uuid;
  v_line jsonb;
  v_allocation jsonb;
  v_item_id uuid;
  v_location_id uuid;
  v_qty integer;
  v_requested integer;
  v_allocated integer;
  v_unit_weight numeric(14,3);
  v_capacity numeric(14,3);
  v_used numeric(14,3);
  v_current integer;
  v_total_weight numeric(16,3);
  v_title text;
  v_direction text;
  v_source text;
  v_movement text;
begin
  if p_operation not in ('item_sale', 'item_purchase', 'service_expense') then
    raise exception 'Type d’opération complexe invalide.';
  end if;
  if p_money_type not in ('clean', 'dirty') then
    raise exception 'Type d’argent invalide.';
  end if;
  if p_amount is null or p_amount <= 0 then
    raise exception 'Le montant doit être supérieur à zéro.';
  end if;
  if nullif(trim(p_counterparty), '') is null then
    raise exception 'La personne ou l’entité concernée est obligatoire.';
  end if;

  select coalesce(sum(case when direction='credit' then amount else -amount end), 0)
    into v_balance
  from public.accounting_transactions
  where account='club' and money_type=p_money_type;

  if p_operation in ('item_purchase', 'service_expense') and v_balance < p_amount then
    raise exception 'Solde % insuffisant.', case when p_money_type='dirty' then 'sale' else 'propre' end;
  end if;

  if p_operation = 'service_expense' then
    if nullif(trim(p_service_name), '') is null then
      raise exception 'Le nom du service est obligatoire.';
    end if;
    insert into public.accounting_transactions(
      account, money_type, direction, operation_type, title, amount, counterparty, label
    ) values (
      'club', p_money_type, 'debit', 'service_expense',
      'Achat de service — ' || trim(p_service_name), p_amount,
      trim(p_counterparty), nullif(trim(p_label), '')
    ) returning id into v_transaction_id;

    return jsonb_build_object('transaction_id', v_transaction_id, 'movements', 0);
  end if;

  if jsonb_typeof(p_lines) <> 'array' or jsonb_array_length(p_lines) = 0 then
    raise exception 'Ajoute au moins un item à la transaction.';
  end if;

  -- Chaque modification ci-dessous fait partie de la même transaction SQL.
  -- Toute erreur annule à la fois les stocks et l’écriture comptable.
  for v_line in select value from jsonb_array_elements(p_lines)
  loop
    v_item_id := nullif(v_line->>'item_id', '')::uuid;
    v_requested := coalesce((v_line->>'quantity')::integer, 0);
    if v_item_id is null or v_requested <= 0 then
      raise exception 'Item ou quantité invalide.';
    end if;

    select unit_weight into v_unit_weight
    from public.stock_items where id=v_item_id for share;
    if not found then raise exception 'Item introuvable.'; end if;

    v_allocated := 0;
    if jsonb_typeof(v_line->'allocations') <> 'array' then
      raise exception 'Répartition manquante pour un item.';
    end if;

    for v_allocation in select value from jsonb_array_elements(v_line->'allocations')
    loop
      v_location_id := nullif(v_allocation->>'location_id', '')::uuid;
      v_qty := coalesce((v_allocation->>'quantity')::integer, 0);
      if v_qty < 0 then raise exception 'Quantité de répartition invalide.'; end if;
      if v_qty = 0 then continue; end if;
      v_allocated := v_allocated + v_qty;

      select capacity_weight, used_weight into v_capacity, v_used
      from public.stock_locations where id=v_location_id for update;
      if not found then raise exception 'Lieu de stockage introuvable.'; end if;

      insert into public.stock_balances(item_id, location_id, quantity)
      values(v_item_id, v_location_id, 0)
      on conflict(item_id, location_id) do nothing;

      select quantity into v_current
      from public.stock_balances
      where item_id=v_item_id and location_id=v_location_id
      for update;

      v_total_weight := round(v_unit_weight * v_qty, 3);

      if p_operation='item_sale' then
        if v_qty > v_current then
          raise exception 'Stock insuffisant dans un lieu : % unité(s) disponible(s).', v_current;
        end if;
        update public.stock_balances
          set quantity=v_current-v_qty, updated_at=now()
        where item_id=v_item_id and location_id=v_location_id;
        update public.stock_locations
          set used_weight=greatest(0, round(v_used-v_total_weight, 3)), updated_at=now()
        where id=v_location_id;
        v_movement := 'withdrawal';
        v_source := 'resale';
      else
        if round(v_used+v_total_weight, 3) > v_capacity then
          raise exception 'Capacité dépassée dans un lieu de stockage.';
        end if;
        update public.stock_balances
          set quantity=v_current+v_qty, updated_at=now()
        where item_id=v_item_id and location_id=v_location_id;
        update public.stock_locations
          set used_weight=round(v_used+v_total_weight, 3), updated_at=now()
        where id=v_location_id;
        v_movement := 'deposit';
        v_source := 'purchase';
      end if;

      insert into public.stock_movements(
        item_id, location_id, movement_type, source_type, quantity,
        unit_weight_snapshot, total_weight, created_by, created_by_label
      ) values (
        v_item_id, v_location_id, v_movement, v_source, v_qty,
        v_unit_weight, v_total_weight, auth.uid(), trim(p_counterparty)
      );
    end loop;

    if v_allocated <> v_requested then
      raise exception 'La répartition (%) ne correspond pas à la quantité demandée (%).', v_allocated, v_requested;
    end if;
  end loop;

  if p_operation='item_sale' then
    v_title := 'Vente d’items à ' || trim(p_counterparty);
    v_direction := 'credit';
  else
    v_title := 'Achat d’items auprès de ' || trim(p_counterparty);
    v_direction := 'debit';
  end if;

  insert into public.accounting_transactions(
    account, money_type, direction, operation_type, title, amount, counterparty, label
  ) values (
    'club', p_money_type, v_direction, p_operation, v_title, p_amount,
    trim(p_counterparty), nullif(trim(p_label), '')
  ) returning id into v_transaction_id;

  return jsonb_build_object(
    'transaction_id', v_transaction_id,
    'movements', (
      select coalesce(sum(jsonb_array_length(line->'allocations')), 0)
      from jsonb_array_elements(p_lines) line
    )
  );
end;
$$;

grant execute on function public.create_complex_accounting_operation(text,text,numeric,text,text,jsonb,text)
  to anon, authenticated;
