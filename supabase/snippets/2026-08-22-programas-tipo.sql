-- ============================================================================
-- Programas: curso asincrónico vs. material de formación
-- Correr en el SQL Editor del proyecto urevyngawcybyrfvahgk.
-- https://supabase.com/dashboard/project/urevyngawcybyrfvahgk/sql/new
-- ============================================================================
--
-- Los dos productos se dictan distinto y hasta ahora eran indistinguibles en la base:
--   - curso_asincronico: el alumno lo recorre solo, a su ritmo.
--   - formacion: módulos con un PDF general + clases en vivo con su enlace, cursadas
--     por un grupo con fecha de inicio (lo que la UI llama "Formaciones").
--
-- Default 'curso_asincronico' a propósito: los 5 programas que ya existen son cursos
-- asincrónicos, así que el default los deja bien sin tener que tocarlos a mano.
--
-- Es idempotente: se puede correr dos veces sin efecto.

begin;

alter table public.programas
  add column if not exists tipo text not null default 'curso_asincronico';

alter table public.programas drop constraint if exists programas_tipo_valido;
alter table public.programas add constraint programas_tipo_valido
  check (tipo in ('curso_asincronico', 'formacion'));

commit;
