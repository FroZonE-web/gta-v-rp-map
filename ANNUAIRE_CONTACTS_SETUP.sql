-- Ashen Wolves HUB v1.2 — Personnes rencontrées
create extension if not exists pgcrypto;

create table if not exists public.directory_contacts (
  id uuid primary key default gen_random_uuid(),
  job text not null check (char_length(trim(job)) between 1 and 100),
  entity text,
  first_name text not null check (char_length(trim(first_name)) between 1 and 80),
  last_name text,
  nickname text,
  phone text,
  address text,
  notes text,
  relation text,
  contacted_by text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

alter table public.directory_contacts enable row level security;

drop policy if exists "directory_contacts_public_read" on public.directory_contacts;
create policy "directory_contacts_public_read" on public.directory_contacts for select to anon, authenticated using (true);

drop policy if exists "directory_contacts_public_insert" on public.directory_contacts;
create policy "directory_contacts_public_insert" on public.directory_contacts for insert to anon, authenticated with check (true);

drop policy if exists "directory_contacts_admin_update" on public.directory_contacts;
create policy "directory_contacts_admin_update" on public.directory_contacts for update to authenticated using (public.is_admin()) with check (public.is_admin());

drop policy if exists "directory_contacts_admin_delete" on public.directory_contacts;
create policy "directory_contacts_admin_delete" on public.directory_contacts for delete to authenticated using (public.is_admin());

create or replace function public.set_directory_contacts_updated_at()
returns trigger language plpgsql as $$ begin new.updated_at = now(); return new; end; $$;
drop trigger if exists directory_contacts_updated_at on public.directory_contacts;
create trigger directory_contacts_updated_at before update on public.directory_contacts for each row execute function public.set_directory_contacts_updated_at();

grant select, insert on public.directory_contacts to anon;
grant select, insert, update, delete on public.directory_contacts to authenticated;
