-- 01_schema.sql
-- Esquema PostgreSQL local para desarrollo con Docker.

create extension if not exists pgcrypto;

create table if not exists eventos (
  id uuid primary key default gen_random_uuid(),
  nombre text not null,
  fecha_evento timestamptz not null,
  fecha_cierre_reservas timestamptz not null,
  activo boolean not null default false,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint eventos_fecha_cierre_valida check (fecha_cierre_reservas <= fecha_evento)
);

create unique index if not exists ux_eventos_activo_unico
  on eventos (activo)
  where activo = true;

create table if not exists configuracion (
  id uuid primary key default gen_random_uuid(),
  evento_id uuid not null references eventos(id) on delete cascade,
  max_entradas_por_persona int not null default 1,
  reservas_habilitadas boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint configuracion_evento_unico unique (evento_id),
  constraint configuracion_max_entradas_valida check (max_entradas_por_persona >= 1)
);

create table if not exists secciones (
  id uuid primary key default gen_random_uuid(),
  evento_id uuid not null references eventos(id) on delete cascade,
  nombre text not null,
  orden int not null default 0,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint secciones_evento_nombre_unico unique (evento_id, nombre)
);

create table if not exists asientos (
  id uuid primary key default gen_random_uuid(),
  seccion_id uuid not null references secciones(id) on delete cascade,
  fila text not null,
  numero int not null,
  codigo_asiento text not null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint asientos_numero_valido check (numero > 0),
  constraint asientos_seccion_fila_numero_unico unique (seccion_id, fila, numero),
  constraint asientos_seccion_codigo_unico unique (seccion_id, codigo_asiento)
);

create table if not exists reservas (
  id uuid primary key default gen_random_uuid(),
  evento_id uuid not null references eventos(id) on delete cascade,
  asiento_id uuid not null references asientos(id) on delete restrict,
  nombre_completo text not null,
  nombre text,
  apellido text,
  nombre_nino text,
  documento text not null,
  created_at timestamptz not null default now(),
  constraint reservas_evento_asiento_unico unique (evento_id, asiento_id),
  constraint reservas_documento_no_vacio check (length(trim(documento)) > 0),
  constraint reservas_nombre_no_vacio check (length(trim(nombre_completo)) > 0),
  constraint reservas_nombre_simple_no_vacio check (nombre is null or length(trim(nombre)) > 0),
  constraint reservas_apellido_no_vacio check (apellido is null or length(trim(apellido)) > 0),
  constraint reservas_nombre_nino_no_vacio check (nombre_nino is null or length(trim(nombre_nino)) > 0)
);

create index if not exists ix_reservas_evento_id on reservas(evento_id);
create index if not exists ix_reservas_asiento_id on reservas(asiento_id);
create index if not exists ix_reservas_documento on reservas(documento);

create or replace function fn_set_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

create or replace trigger trg_eventos_updated_at
before update on eventos
for each row execute function fn_set_updated_at();

create or replace trigger trg_configuracion_updated_at
before update on configuracion
for each row execute function fn_set_updated_at();

create or replace trigger trg_secciones_updated_at
before update on secciones
for each row execute function fn_set_updated_at();

create or replace trigger trg_asientos_updated_at
before update on asientos
for each row execute function fn_set_updated_at();

create or replace function fn_validar_reserva_asiento_evento()
returns trigger
language plpgsql
as $$
declare
  v_evento_id uuid;
begin
  select s.evento_id into v_evento_id
  from asientos a
  join secciones s on s.id = a.seccion_id
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

create or replace trigger trg_reservas_validar_asiento_evento
before insert or update on reservas
for each row execute function fn_validar_reserva_asiento_evento();
