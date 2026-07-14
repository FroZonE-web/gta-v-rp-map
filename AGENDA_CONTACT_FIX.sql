-- Ashen Wolves HUB v1.3 - Ajout du champ Contact à l’Agenda
alter table public.agenda_events
  add column if not exists contact text;
