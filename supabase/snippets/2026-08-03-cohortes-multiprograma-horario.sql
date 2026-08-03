-- ============================================================================
-- Cohortes: varios programas + horario de cursada
-- Correr en el SQL Editor del proyecto urevyngawcybyrfvahgk ANTES de deployar.
-- https://supabase.com/dashboard/project/urevyngawcybyrfvahgk/sql/new
-- ============================================================================
--
-- Es ADITIVA a propósito: no borra ni renombra nada, así que se puede correr con
-- la versión actual del código todavía en producción sin romperla. `cohortes.
-- programa_id` queda en su lugar (solo deja de ser obligatoria) y el código nuevo
-- pasa a leer cohortes_programas. Limpiar esa columna es un paso posterior, una
-- vez que el deploy esté estable.
--
-- Es idempotente: se puede correr dos veces sin efecto.

begin;

-- ----------------------------------------------------------------------------
-- 1) Varios programas por cohorte
-- ----------------------------------------------------------------------------

create table if not exists public.cohortes_programas (
  cohorte_id uuid not null references public.cohortes(id) on delete cascade,
  programa_id uuid not null references public.programas(id) on delete cascade,
  created_at timestamptz not null default now(),
  primary key (cohorte_id, programa_id)
);

create index if not exists idx_cohortes_programas_programa
  on public.cohortes_programas (programa_id);

alter table public.cohortes_programas enable row level security;

-- Mismo criterio que cohortes_alumnos: el alumno ve las filas de las cohortes en
-- las que está (necesita saber qué programas cursa), el psicólogo gestiona todo.
drop policy if exists "cohortes_programas_select" on public.cohortes_programas;
create policy "cohortes_programas_select" on public.cohortes_programas
  for select to authenticated
  using (
    public.es_psicologo()
    or exists (
      select 1 from public.cohortes_alumnos ca
      where ca.cohorte_id = cohortes_programas.cohorte_id
        and ca.alumno_id = auth.uid()
    )
  );

drop policy if exists "cohortes_programas_all_psicologo" on public.cohortes_programas;
create policy "cohortes_programas_all_psicologo" on public.cohortes_programas
  for all to authenticated
  using (public.es_psicologo())
  with check (public.es_psicologo());

-- Backfill: cada cohorte que ya existe conserva el programa que tenía.
insert into public.cohortes_programas (cohorte_id, programa_id)
select id, programa_id
from public.cohortes
where programa_id is not null
on conflict do nothing;

-- La columna vieja deja de ser obligatoria. No se borra todavía: mientras el
-- deploy no esté arriba, el código actual la sigue leyendo.
alter table public.cohortes alter column programa_id drop not null;

-- ----------------------------------------------------------------------------
-- 2) Horario de cursada
-- ----------------------------------------------------------------------------
-- dias_semana usa la convención de JS/Postgres `dow`: 0 = domingo … 6 = sábado.
-- Es un array para poder decir "martes y jueves" sin inventar una tabla más.

alter table public.cohortes add column if not exists dias_semana smallint[];
alter table public.cohortes add column if not exists hora_inicio time;
alter table public.cohortes add column if not exists hora_fin time;

alter table public.cohortes drop constraint if exists cohortes_dias_semana_validos;
alter table public.cohortes add constraint cohortes_dias_semana_validos
  check (
    dias_semana is null
    or (array_length(dias_semana, 1) between 1 and 7
        and dias_semana <@ array[0,1,2,3,4,5,6]::smallint[])
  );

alter table public.cohortes drop constraint if exists cohortes_horario_coherente;
alter table public.cohortes add constraint cohortes_horario_coherente
  check (hora_inicio is null or hora_fin is null or hora_fin > hora_inicio);

-- ----------------------------------------------------------------------------
-- 3) Clases generadas desde el horario de la cohorte
-- ----------------------------------------------------------------------------
-- Las clases son filas normales de agenda_sesiones con cohorte_id: la policy
-- agenda_select ya hace que las vea cada inscripto, así que no hace falta
-- duplicar una fila por alumno.

-- Duración real de la sesión. Antes el calendario asumía 1 hora fija para todo;
-- con el horario de la cohorte una clase puede durar 4 (ej: sábados de 8 a 12).
alter table public.agenda_sesiones
  add column if not exists duracion_minutos int not null default 60;

alter table public.agenda_sesiones drop constraint if exists agenda_duracion_valida;
alter table public.agenda_sesiones add constraint agenda_duracion_valida
  check (duracion_minutos between 15 and 720);

-- Acá iría un índice único (cohorte_id, fecha_hora) para que generar las clases
-- sea idempotente, pero si esta base ya tuviera dos sesiones de la misma cohorte
-- en el mismo horario (un doble clic viejo), crearlo abortaría toda la migración
-- — y la alternativa sería que este archivo borre agenda sin avisar. La
-- idempotencia se resuelve en generarClasesDeCohorte(), que lee lo que ya está
-- agendado y solo inserta los horarios que faltan.

commit;
