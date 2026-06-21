-- Migración para agregar campos opcionales a tabla eventos
-- Esta migración agrega campos para descripción, horario y dirección del evento

alter table public.eventos
  add column if not exists descripcion text,
  add column if not exists horario time,
  add column if not exists direccion text;
