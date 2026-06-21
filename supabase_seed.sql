-- supabase_seed.sql
-- Datos semilla para pruebas iniciales del proyecto escolar.
-- Requiere haber ejecutado antes: supabase_init.sql

begin;

-- 1) Deja todos los eventos en inactivo para respetar el indice de un unico evento activo.
update public.eventos
set activo = false;

-- 2) Crea un evento activo de prueba.
with new_event as (
  insert into public.eventos (
    nombre,
    fecha_evento,
    fecha_cierre_reservas,
    activo
  )
  values (
    'Funcion Escolar',
    now() + interval '7 day',
    now() + interval '6 day 20 hour',
    true
  )
  returning id
)
insert into public.configuracion (evento_id, max_entradas_por_persona, reservas_habilitadas)
select id, 1, true
from new_event;

-- 3) Recupera el evento activo para crear secciones y asientos.
do $$
declare
  v_evento_id uuid;
  v_planta_baja uuid;
  v_planta_alta uuid;
  v_palco uuid;
  v_fila text;
  v_numero int;
begin
  select id
  into v_evento_id
  from public.eventos
  where activo = true
  limit 1;

  if v_evento_id is null then
    raise exception 'No hay evento activo para cargar datos semilla.';
  end if;

  -- Secciones base.
  insert into public.secciones (evento_id, nombre, orden)
  values
    (v_evento_id, 'Planta Baja', 1),
    (v_evento_id, 'Planta Alta', 2),
    (v_evento_id, 'Palco', 3)
  on conflict (evento_id, nombre) do update
    set orden = excluded.orden;

  -- Como el RETURNING multiple filas no es util para 3 variables, se consultan luego.
  select id into v_planta_baja
  from public.secciones
  where evento_id = v_evento_id and nombre = 'Planta Baja';

  select id into v_planta_alta
  from public.secciones
  where evento_id = v_evento_id and nombre = 'Planta Alta';

  select id into v_palco
  from public.secciones
  where evento_id = v_evento_id and nombre = 'Palco';

  -- Planta Baja: filas A-D, asientos 1-10.
  foreach v_fila in array array['A','B','C','D']
  loop
    for v_numero in 1..10 loop
      insert into public.asientos (seccion_id, fila, numero, codigo_asiento)
      values (v_planta_baja, v_fila, v_numero, v_fila || '-' || v_numero)
      on conflict (seccion_id, fila, numero) do nothing;
    end loop;
  end loop;

  -- Planta Alta: filas E-G, asientos 1-8.
  foreach v_fila in array array['E','F','G']
  loop
    for v_numero in 1..8 loop
      insert into public.asientos (seccion_id, fila, numero, codigo_asiento)
      values (v_planta_alta, v_fila, v_numero, v_fila || '-' || v_numero)
      on conflict (seccion_id, fila, numero) do nothing;
    end loop;
  end loop;

  -- Palco: fila P, asientos 1-6.
  for v_numero in 1..6 loop
    insert into public.asientos (seccion_id, fila, numero, codigo_asiento)
    values (v_palco, 'P', v_numero, 'P-' || v_numero)
    on conflict (seccion_id, fila, numero) do nothing;
  end loop;
end;
$$;

commit;

-- Verificacion rapida.
select 'eventos_activos' as metrica, count(*)::text as valor
from public.eventos
where activo = true
union all
select 'secciones_evento_activo', count(*)::text
from public.secciones s
join public.eventos e on e.id = s.evento_id
where e.activo = true
union all
select 'asientos_evento_activo', count(*)::text
from public.asientos a
join public.secciones s on s.id = a.seccion_id
join public.eventos e on e.id = s.evento_id
where e.activo = true;