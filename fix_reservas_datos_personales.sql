-- fix_reservas_datos_personales.sql
-- Agrega columnas para guardar datos personales separados en reservas existentes.

alter table if exists public.reservas
  add column if not exists nombre text,
  add column if not exists apellido text,
  add column if not exists nombre_nino text;

do $$
begin
  if not exists (
    select 1
    from pg_constraint
    where conname = 'reservas_nombre_simple_no_vacio'
      and conrelid = 'public.reservas'::regclass
  ) then
    alter table public.reservas
      add constraint reservas_nombre_simple_no_vacio
      check (nombre is null or length(trim(nombre)) > 0);
  end if;

  if not exists (
    select 1
    from pg_constraint
    where conname = 'reservas_apellido_no_vacio'
      and conrelid = 'public.reservas'::regclass
  ) then
    alter table public.reservas
      add constraint reservas_apellido_no_vacio
      check (apellido is null or length(trim(apellido)) > 0);
  end if;

  if not exists (
    select 1
    from pg_constraint
    where conname = 'reservas_nombre_nino_no_vacio'
      and conrelid = 'public.reservas'::regclass
  ) then
    alter table public.reservas
      add constraint reservas_nombre_nino_no_vacio
      check (nombre_nino is null or length(trim(nombre_nino)) > 0);
  end if;
end
$$;
