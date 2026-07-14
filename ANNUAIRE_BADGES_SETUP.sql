-- Ashen Wolves HUB v1.2 — Couleurs et valeurs personnalisées de l’annuaire
-- À exécuter une seule fois sur une installation existante.

create extension if not exists pgcrypto;

create table if not exists public.directory_contact_labels (
  id uuid primary key default gen_random_uuid(),
  label_type text not null check (label_type in ('job', 'entity')),
  name text not null check (char_length(trim(name)) between 1 and 120),
  color text not null default '#7c3aed' check (color ~ '^#[0-9A-Fa-f]{6}$'),
  text_color text not null default '#ffffff' check (text_color ~ '^#[0-9A-Fa-f]{6}$'),
  created_at timestamptz not null default now(),
  created_by uuid default auth.uid()
);

create unique index if not exists directory_contact_labels_type_name_unique
  on public.directory_contact_labels (label_type, lower(trim(name)));

alter table public.directory_contact_labels enable row level security;

drop policy if exists "directory_contact_labels_public_read" on public.directory_contact_labels;
create policy "directory_contact_labels_public_read"
  on public.directory_contact_labels for select to anon, authenticated using (true);

drop policy if exists "directory_contact_labels_public_insert" on public.directory_contact_labels;
create policy "directory_contact_labels_public_insert"
  on public.directory_contact_labels for insert to anon, authenticated
  with check (label_type in ('job', 'entity'));

drop policy if exists "directory_contact_labels_admin_update" on public.directory_contact_labels;
create policy "directory_contact_labels_admin_update"
  on public.directory_contact_labels for update to authenticated
  using (public.is_admin()) with check (public.is_admin());

drop policy if exists "directory_contact_labels_admin_delete" on public.directory_contact_labels;
create policy "directory_contact_labels_admin_delete"
  on public.directory_contact_labels for delete to authenticated
  using (public.is_admin());

grant select, insert on public.directory_contact_labels to anon;
grant select, insert, update, delete on public.directory_contact_labels to authenticated;

insert into public.directory_contact_labels (label_type, name, color, text_color)
values
  ('job', 'DMC', '#606060', '#ffffff'),
  ('job', 'LSMC', '#2bb741', '#ffffff'),
  ('job', 'STONKS', '#2b6300', '#ffffff'),
  ('job', 'UPW', '#42878d', '#ffffff'),
  ('job', 'MTP', '#e08f23', '#101010'),
  ('job', 'CJR', '#d7c72e', '#101010'),
  ('job', 'MDR', '#af4848', '#ffffff'),
  ('job', 'GOUV', '#4468a7', '#ffffff'),
  ('job', 'STAND-BY', '#101010', '#ffffff'),
  ('job', 'CM', '#af3333', '#ffffff'),
  ('job', 'PAWL', '#734739', '#ffffff'),
  ('job', 'NG', '#976f4d', '#ffffff'),
  ('job', 'BB', '#45b2d2', '#101010'),
  ('job', 'TN', '#5c327d', '#ffffff'),
  ('job', 'BAUN', '#bf8ee5', '#101010'),
  ('job', 'CASINO', '#101010', '#ffffff'),
  ('job', 'YN', '#c52a2a', '#ffffff'),
  ('job', 'MAIRIE', '#2e7268', '#ffffff'),
  ('entity', 'FROST', '#1e4278', '#ffffff'),
  ('entity', 'OBSIDIAN', '#101010', '#ffffff'),
  ('entity', 'GLORY', '#ffffff', '#101010'),
  ('entity', 'G7', '#6ab2bc', '#101010'),
  ('entity', '88', '#099b1b', '#ffffff')
on conflict do nothing;
