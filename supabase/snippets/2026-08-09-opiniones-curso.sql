-- ============================================================================
-- Opiniones de curso: feedback del alumno sobre el material (privado)
-- Correr en el SQL Editor del proyecto ANTES de deployar.
-- https://supabase.com/dashboard/project/urevyngawcybyrfvahgk/sql/new
-- ============================================================================
--
-- Aditiva e idempotente. Es la etapa A del análisis de feedback: una encuesta
-- corta al terminar un curso, que SOLO ve Elías. No es un foro, no es un chat
-- y no se publica en ningún lado — publicar un testimonio requiere pedirle
-- permiso al alumno sobre un texto concreto, y eso es una etapa aparte que
-- todavía no está implementada.
--
-- Por qué es identificada y no anónima: para poder pedir ese permiso después
-- hace falta saber quién escribió. Y con cohortes de pocos alumnos el anonimato
-- sería ficticio de todos modos. La UI se lo dice al alumno de forma explícita.
--
-- Alcance del dato (Ley 25.326): es opinión sobre MATERIAL EDUCATIVO, no sobre
-- un tratamiento. No hay campo clínico, y los dos textos libres son opcionales.

begin;

create table if not exists public.opiniones_curso (
  id uuid primary key default gen_random_uuid(),
  programa_id uuid not null references public.programas(id) on delete cascade,
  alumno_id uuid not null references public.alumnos(id) on delete cascade,
  puntuacion int not null check (puntuacion between 1 and 5),
  lo_que_sirvio text,
  lo_que_mejoraria text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  -- Una opinión por alumno y curso: si vuelve a enviarla, se actualiza la suya.
  unique (programa_id, alumno_id)
);

create index if not exists idx_opiniones_programa on public.opiniones_curso (programa_id);

alter table public.opiniones_curso enable row level security;

-- Cada alumno ve ÚNICAMENTE la suya. Que un alumno pueda leer lo que opinaron
-- sus compañeros convertiría esto en un foro, que es justo lo que no es.
drop policy if exists "opiniones_select" on public.opiniones_curso;
create policy "opiniones_select" on public.opiniones_curso
  for select to authenticated
  using (alumno_id = auth.uid() or public.es_psicologo());

-- Solo se puede opinar sobre un curso al que se tiene acceso asignado, y solo
-- en nombre propio.
drop policy if exists "opiniones_insert_propia" on public.opiniones_curso;
create policy "opiniones_insert_propia" on public.opiniones_curso
  for insert to authenticated
  with check (alumno_id = auth.uid() and public.tiene_acceso_programa(programa_id));

drop policy if exists "opiniones_update_propia" on public.opiniones_curso;
create policy "opiniones_update_propia" on public.opiniones_curso
  for update to authenticated
  using (alumno_id = auth.uid())
  with check (alumno_id = auth.uid());

-- El alumno puede retirar su opinión cuando quiera.
drop policy if exists "opiniones_delete_propia" on public.opiniones_curso;
create policy "opiniones_delete_propia" on public.opiniones_curso
  for delete to authenticated
  using (alumno_id = auth.uid());

-- Deliberadamente NO hay policy que permita al psicólogo insertar, editar o
-- borrar opiniones: son de los alumnos. Poder retocarlas haría del feedback una
-- ficción, y de un futuro testimonio algo que el alumno nunca dijo.

create or replace function public.tocar_opinion_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at := now();
  return new;
end;
$$;

drop trigger if exists trg_opiniones_updated_at on public.opiniones_curso;
create trigger trg_opiniones_updated_at
  before update on public.opiniones_curso
  for each row execute function public.tocar_opinion_updated_at();

commit;
