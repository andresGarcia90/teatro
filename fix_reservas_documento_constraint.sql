-- Ejecutar una sola vez sobre una base existente.
-- Quita la restriccion unica por documento para permitir hasta max_entradas_por_persona.

alter table if exists public.reservas
  drop constraint if exists reservas_evento_documento_unico;

alter table if exists reservas
  drop constraint if exists reservas_evento_documento_unico;
