-- 02_seed.sql
-- Datos iniciales para desarrollo local.

begin;

update eventos set activo = false;

with new_event as (
  insert into eventos (nombre, fecha_evento, fecha_cierre_reservas, activo)
  values (
    'Funcion Escolar (Local)',
    now() + interval '7 day',
    now() + interval '6 day 20 hour',
    true
  )
  returning id
)
insert into configuracion (evento_id, max_entradas_por_persona, reservas_habilitadas)
select id, 1, true
from new_event;

do $$
declare
  v_evento_id uuid;
  v_planta_baja uuid;
  v_planta_alta uuid;
  v_palco uuid;
  v_fila text;
  v_numero int;
begin
  select id into v_evento_id from eventos where activo = true limit 1;

  insert into secciones (evento_id, nombre, orden)
  values
    (v_evento_id, 'Planta Baja', 1),
    (v_evento_id, 'Planta Alta', 2),
    (v_evento_id, 'Palco', 3)
  on conflict (evento_id, nombre) do update set orden = excluded.orden;

  select id into v_planta_baja from secciones where evento_id = v_evento_id and nombre = 'Planta Baja';
  select id into v_planta_alta from secciones where evento_id = v_evento_id and nombre = 'Planta Alta';
  select id into v_palco from secciones where evento_id = v_evento_id and nombre = 'Palco';

  foreach v_fila in array array['A','B','C','D'] loop
    for v_numero in 1..10 loop
      insert into asientos (seccion_id, fila, numero, codigo_asiento)
      values (v_planta_baja, v_fila, v_numero, v_fila || '-' || v_numero)
      on conflict (seccion_id, fila, numero) do nothing;
    end loop;
  end loop;

  foreach v_fila in array array['E','F','G'] loop
    for v_numero in 1..8 loop
      insert into asientos (seccion_id, fila, numero, codigo_asiento)
      values (v_planta_alta, v_fila, v_numero, v_fila || '-' || v_numero)
      on conflict (seccion_id, fila, numero) do nothing;
    end loop;
  end loop;

  for v_numero in 1..6 loop
    insert into asientos (seccion_id, fila, numero, codigo_asiento)
    values (v_palco, 'P', v_numero, 'P-' || v_numero)
    on conflict (seccion_id, fila, numero) do nothing;
  end loop;
end;
$$;

commit;
