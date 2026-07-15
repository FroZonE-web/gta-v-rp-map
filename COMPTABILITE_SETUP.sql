-- Ashen Wolves HUB v1.5.4 — opérations comptables simples

create table if not exists public.accounting_transactions (
  id uuid primary key default gen_random_uuid(),
  account text not null check (account in ('club', 'black')),
  money_type text not null check (money_type in ('clean', 'dirty')),
  direction text not null check (direction in ('credit', 'debit')),
  operation_type text not null,
  title text not null,
  amount numeric(14,2) not null check (amount > 0),
  counterparty text,
  label text,
  transfer_group uuid,
  created_by uuid default auth.uid(),
  created_at timestamptz not null default now()
);

create index if not exists accounting_transactions_created_at_idx
  on public.accounting_transactions (created_at desc);
create index if not exists accounting_transactions_account_idx
  on public.accounting_transactions (account, money_type);

alter table public.accounting_transactions enable row level security;

drop policy if exists "accounting public read" on public.accounting_transactions;
create policy "accounting public read"
  on public.accounting_transactions for select
  to anon, authenticated
  using (true);

-- Les écritures sont créées exclusivement par la RPC afin de centraliser les contrôles.
revoke insert, update, delete on public.accounting_transactions from anon, authenticated;
grant select on public.accounting_transactions to anon, authenticated;

create or replace function public.create_simple_accounting_operation(
  p_operation text,
  p_amount numeric,
  p_recipient text default null,
  p_label text default null
)
returns void
language plpgsql
security definer
set search_path = public
as $$
declare
  v_club_clean numeric(14,2);
  v_black numeric(14,2);
  v_group uuid;
begin
  if p_amount is null or p_amount <= 0 then
    raise exception 'Le montant doit être supérieur à zéro.';
  end if;

  select coalesce(sum(case when direction = 'credit' then amount else -amount end), 0)
  into v_club_clean
  from public.accounting_transactions
  where account = 'club' and money_type = 'clean';

  select coalesce(sum(case when direction = 'credit' then amount else -amount end), 0)
  into v_black
  from public.accounting_transactions
  where account = 'black';

  case p_operation
    when 'quick_income' then
      insert into public.accounting_transactions
        (account, money_type, direction, operation_type, title, amount, label)
      values
        ('club', 'clean', 'credit', 'quick_income', 'Recette rapide', p_amount,
         nullif(trim(p_label), ''));

    when 'member_payment' then
      if nullif(trim(p_recipient), '') is null then
        raise exception 'Le destinataire est obligatoire.';
      end if;
      if v_club_clean < p_amount then
        raise exception 'Solde propre insuffisant.';
      end if;
      insert into public.accounting_transactions
        (account, money_type, direction, operation_type, title, amount, counterparty, label)
      values
        ('club', 'clean', 'debit', 'member_payment', 'Paiement à ' || trim(p_recipient),
         p_amount, trim(p_recipient), nullif(trim(p_label), ''));

    when 'black_transfer' then
      if v_club_clean < p_amount then
        raise exception 'Solde propre insuffisant.';
      end if;
      v_group := gen_random_uuid();
      insert into public.accounting_transactions
        (account, money_type, direction, operation_type, title, amount, counterparty, label, transfer_group)
      values
        ('club', 'clean', 'debit', 'black_transfer_out', 'Transfert vers la caisse noire',
         p_amount, 'Caisse noire', nullif(trim(p_label), ''), v_group),
        ('black', 'clean', 'credit', 'black_transfer_in', 'Ajout à la caisse noire',
         p_amount, 'Compte du club', nullif(trim(p_label), ''), v_group);

    when 'black_deposit' then
      insert into public.accounting_transactions
        (account, money_type, direction, operation_type, title, amount, label)
      values
        ('black', 'clean', 'credit', 'black_deposit', 'Ajout à la caisse noire',
         p_amount, nullif(trim(p_label), ''));

    when 'black_withdrawal' then
      if nullif(trim(p_label), '') is null then
        raise exception 'La raison du retrait est obligatoire.';
      end if;
      if v_black < p_amount then
        raise exception 'Solde de la caisse noire insuffisant.';
      end if;
      insert into public.accounting_transactions
        (account, money_type, direction, operation_type, title, amount, label)
      values
        ('black', 'clean', 'debit', 'black_withdrawal', 'Retrait de la caisse noire',
         p_amount, trim(p_label));

    else
      raise exception 'Type d’opération non reconnu.';
  end case;
end;
$$;

grant execute on function public.create_simple_accounting_operation(text, numeric, text, text)
  to anon, authenticated;

-- Active Realtime sans échouer si la table est déjà publiée.
do $$
begin
  alter publication supabase_realtime add table public.accounting_transactions;
exception
  when duplicate_object then null;
end $$;
