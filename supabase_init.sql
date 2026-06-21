-- supabase_init.sql
-- Esquema inicial para proyecto escolar de reserva de asientos.

create extension if not exists pgcrypto;

-- =========================
-- Tablas
-- =========================

create table if not exists public.eventos (
  id uuid primary key default gen_random_uuid(),
  nombre text not null,
  fecha_evento timestamptz not null,
  fecha_cierre_reservas timestamptz not null,
  activo boolean not null default false,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint eventos_fecha_cierre_valida
    check (fecha_cierre_reservas <= fecha_evento)
);

create unique index if not exists ux_eventos_activo_unico
  on public.eventos (activo)
  where activo = true;

create table if not exists public.configuracion (
  id uuid primary key default gen_random_uuid(),
  evento_id uuid not null references public.eventos(id) on delete cascade,
  max_entradas_por_persona int not null default 1,
  reservas_habilitadas boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint configuracion_evento_unico unique (evento_id),
  constraint configuracion_max_entradas_valida check (max_entradas_por_persona >= 1)
);

create table if not exists public.secciones (
  id uuid primary key default gen_random_uuid(),
  evento_id uuid not null references public.eventos(id) on delete cascade,
  nombre text not null,
  orden int not null default 0,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint secciones_evento_nombre_unico unique (evento_id, nombre)
);

create table if not exists public.asientos (
  id uuid primary key default gen_random_uuid(),
  seccion_id uuid not null references public.secciones(id) on delete cascade,
  fila text not null,
  numero int not null,
  codigo_asiento text not null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint asientos_numero_valido check (numero > 0),
  constraint asientos_seccion_fila_numero_unico unique (seccion_id, fila, numero),
  constraint asientos_seccion_codigo_unico unique (seccion_id, codigo_asiento)
);

create table if not exists public.reservas (
  id uuid primary key default gen_random_uuid(),
  evento_id uuid not null references public.eventos(id) on delete cascade,
  asiento_id uuid not null references public.asientos(id) on delete restrict,
  nombre_completo text not null,
  documento text not null,
  created_at timestamptz not null default now(),
  constraint reservas_evento_asiento_unico unique (evento_id, asiento_id),
  constraint reservas_documento_no_vacio check (length(trim(documento)) > 0),
  constraint reservas_nombre_no_vacio check (length(trim(nombre_completo)) > 0)
);

create index if not exists ix_reservas_evento_id on public.reservas(evento_id);
create index if not exists ix_reservas_asiento_id on public.reservas(asiento_id);
create index if not exists ix_reservas_documento on public.reservas(documento);

-- =========================
-- Triggers utilitarios
-- =========================

create or replace function public.fn_set_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

drop trigger if exists trg_eventos_updated_at on public.eventos;
create trigger trg_eventos_updated_at
before update on public.eventos
for each row execute procedure public.fn_set_updated_at();

drop trigger if exists trg_configuracion_updated_at on public.configuracion;
create trigger trg_configuracion_updated_at
before update on public.configuracion
for each row execute procedure public.fn_set_updated_at();

drop trigger if exists trg_secciones_updated_at on public.secciones;
create trigger trg_secciones_updated_at
before update on public.secciones
for each row execute procedure public.fn_set_updated_at();

drop trigger if exists trg_asientos_updated_at on public.asientos;
create trigger trg_asientos_updated_at
before update on public.asientos
for each row execute procedure public.fn_set_updated_at();

-- Valida que el asiento pertenezca al evento informado en la reserva.
create or replace function public.fn_validar_reserva_asiento_evento()
returns trigger
language plpgsql
as $$
declare
  v_evento_id uuid;
begin
  select s.evento_id
    into v_evento_id
  from public.asientos a
  join public.secciones s on s.id = a.seccion_id
  where a.id = new.asiento_id;

  if v_evento_id is null then
    raise exception 'El asiento no existe o no esta asociado a una seccion valida.';
  end if;

  if v_evento_id <> new.evento_id then
    raise exception 'El asiento seleccionado no pertenece al evento indicado.';
  end if;

  return new;
end;
$$;

drop trigger if exists trg_reservas_validar_asiento_evento on public.reservas;
create trigger trg_reservas_validar_asiento_evento
before insert or update on public.reservas
for each row execute procedure public.fn_validar_reserva_asiento_evento();

-- =========================
-- Funcion publica para ver ocupacion sin exponer datos personales
-- =========================

create or replace function public.get_occupied_seat_ids(p_evento_id uuid)
returns table(asiento_id uuid)
language sql
security definer
set search_path = public
as $$
  select r.asiento_id
  from public.reservas r
  where r.evento_id = p_evento_id;
$$;

revoke all on function public.get_occupied_seat_ids(uuid) from public;
grant execute on function public.get_occupied_seat_ids(uuid) to anon, authenticated;

-- =========================
-- RLS minima
-- =========================

alter table public.eventos enable row level security;
alter table public.configuracion enable row level security;
alter table public.secciones enable row level security;
alter table public.asientos enable row level security;
alter table public.reservas enable row level security;

-- Limpieza de politicas para facilitar rerun del script.
drop policy if exists eventos_select_publico on public.eventos;
drop policy if exists eventos_admin_all on public.eventos;

drop policy if exists configuracion_select_publico on public.configuracion;
drop policy if exists configuracion_admin_all on public.configuracion;

drop policy if exists secciones_select_publico on public.secciones;
drop policy if exists secciones_admin_all on public.secciones;

drop policy if exists asientos_select_publico on public.asientos;
drop policy if exists asientos_admin_all on public.asientos;

drop policy if exists reservas_insert_publico on public.reservas;
drop policy if exists reservas_admin_all on public.reservas;

-- Lectura publica minima para portal.
create policy eventos_select_publico
on public.eventos
for select
to anon, authenticated
using (activo = true);

create policy configuracion_select_publico
on public.configuracion
for select
to anon, authenticated
using (
  exists (
    select 1
    from public.eventos e
    where e.id = configuracion.evento_id
      and e.activo = true
  )
);

create policy secciones_select_publico
on public.secciones
for select
to anon, authenticated
using (
  exists (
    select 1
    from public.eventos e
    where e.id = secciones.evento_id
      and e.activo = true
  )
);

create policy asientos_select_publico
on public.asientos
for select
to anon, authenticated
using (
  exists (
    select 1
    from public.secciones s
    join public.eventos e on e.id = s.evento_id
    where s.id = asientos.seccion_id
      and e.activo = true
  )
);

-- Insercion publica de reservas con validaciones de negocio.
create policy reservas_insert_publico
on public.reservas
for insert
to anon, authenticated
with check (
  exists (
    select 1
    from public.eventos e
    where e.id = reservas.evento_id
      and e.activo = true
      and now() <= e.fecha_cierre_reservas
  )
  and exists (
    select 1
    from public.configuracion c
    where c.evento_id = reservas.evento_id
      and c.reservas_habilitadas = true
  )
  and not exists (
    select 1
    from public.reservas r
    where r.evento_id = reservas.evento_id
      and r.asiento_id = reservas.asiento_id
  )
  and not exists (
    select 1
    from public.reservas r
    where r.evento_id = reservas.evento_id
      and lower(trim(r.documento)) = lower(trim(reservas.documento))
  )
);

-- Politicas admin (requiere login con usuario Supabase de tipo authenticated).
create policy eventos_admin_all
on public.eventos
for all
to authenticated
using (true)
with check (true);

create policy configuracion_admin_all
on public.configuracion
for all
to authenticated
using (true)
with check (true);

create policy secciones_admin_all
on public.secciones
for all
to authenticated
using (true)
with check (true);

create policy asientos_admin_all
on public.asientos
for all
to authenticated
using (true)
with check (true);

create policy reservas_admin_all
on public.reservas
for all
to authenticated
using (true)
with check (true);

-- =========================
-- Datos iniciales opcionales
-- =========================

-- Insertar evento y configuracion basica (ajustar fechas antes de ejecutar).
-- insert into public.eventos (nombre, fecha_evento, fecha_cierre_reservas, activo)
-- values ('Evento Escolar', '2026-12-10 21:00:00+00', '2026-12-10 19:00:00+00', true);
--
-- insert into public.configuracion (evento_id, max_entradas_por_persona, reservas_habilitadas)
-- select id, 1, true
-- from public.eventos
-- where activo = true
-- limit 1;
