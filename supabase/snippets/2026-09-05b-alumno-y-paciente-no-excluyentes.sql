-- ============================================================================
-- 2026-09-05 (segunda parte) — alumno y paciente dejan de ser excluyentes
-- Correr UNA VEZ en Supabase → SQL Editor. Es idempotente (se puede re-correr).
-- Reemplaza el enfoque de 2026-09-05-rol-paciente.sql: ese agregó 'paciente' como
-- valor de `rol`, y eso hacía imposible que una misma persona fuera las dos cosas.
-- ============================================================================
--
-- El problema: `rol` estaba haciendo dos trabajos a la vez.
--   1) rol de SEGURIDAD: es_psicologo() pregunta `rol = 'psicologo'` y de ahí cuelga
--      toda la RLS del panel.
--   2) etiqueta de QUÉ ES esa persona para el psicólogo (alumno / paciente).
--
-- Para la RLS, (2) no existe: un alumno y un paciente tienen exactamente los mismos
-- permisos (cada uno ve lo suyo y nada más). La distinción es organizativa, y como
-- alguien puede cursar una formación Y además atenderse, no puede vivir en una
-- columna de un solo valor.
--
-- Solución: `rol` vuelve a ser sólo el rol de seguridad, y el vínculo pasa a dos
-- flags independientes. Alguien puede ser alumno, paciente, o los dos.
--
-- LÍMITE LEGAL (Ley 25.326, ver AGENTS.md): `es_paciente` es un booleano y nada más.
-- No se agrega ningún campo de diagnóstico, motivo de consulta ni nota clínica.

alter table public.alumnos add column if not exists es_alumno boolean not null default true;
alter table public.alumnos add column if not exists es_paciente boolean not null default false;

-- ----------------------------------------------------------------------------
-- Backfill desde el rol que había hasta ahora
-- ----------------------------------------------------------------------------

-- Quien haya quedado con rol 'paciente' (del snippet anterior) pasa a ser paciente
-- por flag. Se hace ANTES de normalizar `rol`, que es de donde sale el dato.
update public.alumnos set es_paciente = true, es_alumno = false where rol = 'paciente';

-- El psicólogo no es ni alumno ni paciente de sí mismo: sin esto aparecería en su
-- propia lista de Alumnos (que ahora filtra por es_alumno).
update public.alumnos set es_alumno = false, es_paciente = false where rol = 'psicologo';

-- ----------------------------------------------------------------------------
-- `rol` vuelve a ser sólo seguridad
-- ----------------------------------------------------------------------------

update public.alumnos set rol = 'alumno' where rol = 'paciente';

alter table public.alumnos drop constraint if exists alumnos_rol_check;
alter table public.alumnos add constraint alumnos_rol_check
  check (rol in ('alumno', 'psicologo'));

-- Índices parciales: las dos listas del panel filtran por estos flags.
create index if not exists idx_alumnos_es_alumno on public.alumnos (es_alumno) where es_alumno;
create index if not exists idx_alumnos_es_paciente on public.alumnos (es_paciente) where es_paciente;

-- ----------------------------------------------------------------------------
-- Verificación
-- ----------------------------------------------------------------------------

-- 1) El check de rol volvió a dos valores:
select pg_get_constraintdef(oid) as definicion
from pg_constraint
where conrelid = 'public.alumnos'::regclass and conname = 'alumnos_rol_check';

-- 2) Cómo quedó cada persona (el psicólogo debe salir false/false):
select rol, es_alumno, es_paciente, estado, count(*)
from public.alumnos
group by rol, es_alumno, es_paciente, estado
order by rol, es_alumno desc, es_paciente desc;
