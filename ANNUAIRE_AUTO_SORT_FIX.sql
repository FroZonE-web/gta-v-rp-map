-- ASHEN WOLVES HUB v1.2 — Tri automatique de l'annuaire
-- À exécuter sur une installation existante.

alter table public.directory_members
  add column if not exists grade_assigned_at timestamptz not null default now();

alter table public.directory_members
  alter column sort_order drop not null;

create or replace function public.directory_members_assign_sort_order()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  if new.sort_order is null then
    select candidate into new.sort_order
    from generate_series(1, 16) as candidate
    where not exists (
      select 1 from public.directory_members dm where dm.sort_order = candidate
    )
    order by candidate
    limit 1;
  end if;

  if new.sort_order is null then
    raise exception 'La limite de 16 membres actifs est atteinte.';
  end if;

  return new;
end;
$$;

drop trigger if exists directory_members_assign_sort_order on public.directory_members;
create trigger directory_members_assign_sort_order
before insert on public.directory_members
for each row execute function public.directory_members_assign_sort_order();

create or replace function public.directory_members_track_grade()
returns trigger
language plpgsql
security invoker
set search_path = public
as $$
begin
  if old.grade_code is distinct from new.grade_code then
    new.grade_assigned_at = now();
  end if;
  return new;
end;
$$;

drop trigger if exists directory_members_track_grade on public.directory_members;
create trigger directory_members_track_grade
before update on public.directory_members
for each row execute function public.directory_members_track_grade();
