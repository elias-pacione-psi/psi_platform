-- ============================================================================
-- 2026-09-05 — Módulo Pacientes: rol 'paciente' en public.alumnos
--
-- ⚠️ REEMPLAZADO por 2026-09-05b-alumno-y-paciente-no-excluyentes.sql, del mismo
-- día. Este enfoque metía 'paciente' como valor de `rol`, y eso hacía imposible
-- que una misma persona fuera alumna Y paciente a la vez (que es lo que hacía
-- falta: alguien puede cursar una formación y además atenderse). El snippet "b"
-- deshace este cambio y mueve el vínculo a dos flags independientes.
--
-- Queda versionado sólo como registro de lo que se corrió: NO lo corras de nuevo.
-- Si estás poniendo la base al día desde cero, corré directamente el "b".
-- ============================================================================
--
-- El psicólogo no solo dicta cursos: también atiende pacientes. En la plataforma
-- un paciente es exactamente lo mismo que un alumno menos el contenido de cursos:
-- cuenta + agenda de sesiones + material puntual que se le entrega desde Biblioteca.
-- Por eso NO es una tabla nueva: es un valor más de `alumnos.rol`, y así toda la
-- maquinaria que ya existe (invitación por email, ban/suspensión, agenda_sesiones,
-- recursos_asignados, URLs firmadas) sirve igual sin duplicar nada.
--
-- LÍMITE LEGAL (Ley 25.326, ver AGENTS.md): el modelo del paciente es cuenta +
-- material asignado + agenda. NO se agrega ningún campo de diagnóstico, motivo de
-- consulta ni notas clínicas — el rol dice a quién se le agenda una sesión, no
-- qué le pasa a esa persona.
--
-- RLS: no hace falta tocar ninguna policy. Las del lado del psicólogo van por
-- es_psicologo() (que sigue mirando rol = 'psicologo'), y las del lado del usuario
-- van por `alumno_id = auth.uid()`, que no mira el rol. Un paciente entra por el
-- mismo camino que un alumno y ve solo lo suyo.

alter table public.alumnos drop constraint if exists alumnos_rol_check;
alter table public.alumnos add constraint alumnos_rol_check
  check (rol in ('alumno', 'psicologo', 'paciente'));

-- ----------------------------------------------------------------------------
-- Verificación
-- ----------------------------------------------------------------------------

-- 1) El check acepta los tres roles:
select pg_get_constraintdef(oid) as definicion
from pg_constraint
where conrelid = 'public.alumnos'::regclass and conname = 'alumnos_rol_check';

-- 2) Cómo queda repartida la gente hoy:
select rol, estado, count(*) from public.alumnos group by rol, estado order by rol, estado;
