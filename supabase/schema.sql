-- Familia · esquema de Supabase
-- Pégalo completo en Supabase → SQL Editor → New query → Run.
-- ANTES: cambia los dos correos de la última sección por los reales (Daniel = a, Cami = b).

create table if not exists public.members (
  email text primary key,
  slot  text not null check (slot in ('a', 'b'))
);

create table if not exists public.config (
  id         int primary key default 1 check (id = 1),
  data       jsonb not null,
  updated_at timestamptz not null default now()
);

create table if not exists public.events (
  id         text primary key,
  data       jsonb not null,
  updated_at timestamptz not null default now()
);

-- Solo los correos de la tabla members pueden leer o escribir.
create or replace function public.is_member()
returns boolean
language sql stable security definer
set search_path = public
as $$
  select exists (
    select 1 from public.members m
    where lower(m.email) = lower(coalesce(auth.jwt() ->> 'email', ''))
  );
$$;

alter table public.members enable row level security;
alter table public.config  enable row level security;
alter table public.events  enable row level security;

drop policy if exists "ver mi membresia" on public.members;
create policy "ver mi membresia" on public.members
  for select to authenticated
  using (lower(email) = lower(coalesce(auth.jwt() ->> 'email', '')));

drop policy if exists "miembros config" on public.config;
create policy "miembros config" on public.config
  for all to authenticated
  using (public.is_member()) with check (public.is_member());

drop policy if exists "miembros eventos" on public.events;
create policy "miembros eventos" on public.events
  for all to authenticated
  using (public.is_member()) with check (public.is_member());

-- Permisos de la API (las reglas de arriba siguen decidiendo quién ve qué).
grant usage on schema public to authenticated;
grant select, insert, update, delete on public.events, public.config to authenticated;
grant select on public.members to authenticated;

-- Cambios en vivo entre los dos teléfonos.
do $$
begin
  begin alter publication supabase_realtime add table public.events; exception when duplicate_object then null; end;
  begin alter publication supabase_realtime add table public.config; exception when duplicate_object then null; end;
end $$;

-- ▼▼ CAMBIA ESTOS DOS CORREOS ▼▼
insert into public.members (email, slot) values
  ('correo-de-daniel@ejemplo.com', 'a'),
  ('correo-de-cami@ejemplo.com',   'b')
on conflict (email) do update set slot = excluded.slot;
