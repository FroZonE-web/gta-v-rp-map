-- Ashen Wolves HUB v1.4.1 — Ajout du type de stockage Frigo
-- À exécuter uniquement sur une installation existante.

do $$
declare
  constraint_name text;
begin
  select con.conname
    into constraint_name
  from pg_constraint con
  join pg_class rel on rel.oid = con.conrelid
  join pg_namespace nsp on nsp.oid = rel.relnamespace
  where nsp.nspname = 'public'
    and rel.relname = 'stock_locations'
    and con.contype = 'c'
    and pg_get_constraintdef(con.oid) ilike '%type%home%vehicle%'
  limit 1;

  if constraint_name is not null then
    execute format('alter table public.stock_locations drop constraint %I', constraint_name);
  end if;
end $$;

alter table public.stock_locations
  add constraint stock_locations_type_check
  check (type in ('home', 'vehicle', 'fridge'));
