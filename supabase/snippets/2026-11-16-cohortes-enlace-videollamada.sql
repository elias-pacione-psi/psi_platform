-- ============================================================================
-- Formaciones: enlace de videollamada (Meet) de la cursada
-- Correr en el SQL Editor del proyecto urevyngawcybyrfvahgk ANTES de deployar.
-- https://supabase.com/dashboard/project/urevyngawcybyrfvahgk/sql/new
-- ============================================================================
--
-- Qué agrega: un enlace por formación, que se carga una sola vez en Formaciones y
-- aparece en todas las clases de esa formación (agenda, inicio del alumno, mails de
-- aviso y recordatorio). Las clases siguen pudiendo tener un enlace propio
-- (agenda_sesiones.enlace): si lo tienen, gana ese; si no, se usa el de la formación.
--
-- Es ADITIVA a propósito (mismo criterio que 2026-08-03): no borra ni renombra nada y es
-- idempotente — se puede correr dos veces sin efecto. NO hace falta tocar la RLS: la
-- policy cohortes_select ya deja leer la fila a los inscriptos (necesitan el enlace para
-- entrar) y cohortes_all_psicologo deja escribirla solo al psicólogo.
--
-- Hay que correrla ANTES de deployar: la agenda, el inicio del alumno, el cron de
-- recordatorios y Formaciones leen esta columna en su query principal.

begin;

alter table public.cohortes add column if not exists enlace_videollamada text;

-- El enlace termina en un <a href> que abren los alumnos: solo https, sin espacios.
alter table public.cohortes drop constraint if exists cohortes_enlace_videollamada_https;
alter table public.cohortes add constraint cohortes_enlace_videollamada_https
  check (
    enlace_videollamada is null
    or (enlace_videollamada ~ '^https://[^[:space:]]+$' and length(enlace_videollamada) <= 500)
  );

commit;
