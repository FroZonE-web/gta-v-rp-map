-- Ashen Wolves HUB v1.4 — Correctif Realtime Stocks
-- À exécuter sur une installation existante.

-- Ajoute toutes les tables utilisées par le module Stocks à la publication Realtime.
do $$
begin
  begin alter publication supabase_realtime add table public.stock_categories; exception when duplicate_object then null; end;
  begin alter publication supabase_realtime add table public.stock_items; exception when duplicate_object then null; end;
  begin alter publication supabase_realtime add table public.stock_locations; exception when duplicate_object then null; end;
  begin alter publication supabase_realtime add table public.stock_balances; exception when duplicate_object then null; end;
  begin alter publication supabase_realtime add table public.stock_movements; exception when duplicate_object then null; end;
end $$;
