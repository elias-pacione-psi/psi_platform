-- ============================================================================
-- Comisiones: Libros y Documentos completos, aparte de los programas
-- Correr en el SQL Editor del proyecto urevyngawcybyrfvahgk ANTES de deployar.
-- https://supabase.com/dashboard/project/urevyngawcybyrfvahgk/sql/new
-- ============================================================================
--
-- Qué agrega: la posibilidad de adjuntar a una comisión (la formación) libros y
-- documentos completos de la Biblioteca — no lecciones de un programa — y que los
-- inscriptos los vean en su Biblioteca mientras dure la inscripción.
--
-- Cómo funciona: tabla puente cohortes_recursos (cohorte → biblioteca_recursos), igual
-- que cohortes_programas (cohorte → programas). La diferencia importante: el acceso del
-- alumno NO se materializa en recursos_asignados, se DERIVA de la inscripción (policy
-- biblioteca_select nueva). Razones:
--   1. asignarRecursoBiblioteca (Biblioteca → Gestionar accesos) borra y reinserta
--      recursos_asignados; si las filas de comisión vivieran ahí, cualquier guardado
--      manual las pizaría sin aviso.
--   2. Dar de baja a alguien de la comisión revoca el acceso solo, sin lógica de
--      restar conjuntos como en quitarAlumnoDeCohorte.
--
-- Es ADITIVA a propósito (mismo criterio que 2026-08-03): no borra ni renombra nada, y
-- es idempotente — se puede correr dos veces sin efecto. El código nuevo tolera que la
-- tabla no exista (degrada a "sin libros por comisión"), pero la página de Comisiones
-- usa el embed en su query principal: correr este archivo antes de deployar.

begin;

-- ----------------------------------------------------------------------------
-- 1) Tabla puente cohorte → recurso de biblioteca
-- ----------------------------------------------------------------------------

create table if not exists public.cohortes_recursos (
  cohorte_id uuid not null references public.cohortes(id) on delete cascade,
  recurso_id uuid not null references public.biblioteca_recursos(id) on delete cascade,
  created_at timestamptz not null default now(),
  primary key (cohorte_id, recurso_id)
);

create index if not exists idx_cohortes_recursos_recurso
  on public.cohortes_recursos (recurso_id);

alter table public.cohortes_recursos enable row level security;

-- Mismo criterio que cohortes_programas_select: el inscripto ve qué libros tiene su
-- formación (la vista de Biblioteca lo necesita para resolver el acceso), el psicólogo
-- gestiona todo.
drop policy if exists "cohortes_recursos_select" on public.cohortes_recursos;
create policy "cohortes_recursos_select" on public.cohortes_recursos
  for select to authenticated
  using (
    public.es_psicologo()
    or exists (
      select 1 from public.cohortes_alumnos ca
      where ca.cohorte_id = cohortes_recursos.cohorte_id
        and ca.alumno_id = auth.uid()
    )
  );

drop policy if exists "cohortes_recursos_all_psicologo" on public.cohortes_recursos;
create policy "cohortes_recursos_all_psicologo" on public.cohortes_recursos
  for all to authenticated
  using (public.es_psicologo())
  with check (public.es_psicologo());

-- ----------------------------------------------------------------------------
-- 2) biblioteca_select: sumar el camino por comisión
-- ----------------------------------------------------------------------------
-- Antes: psicólogo, o el recurso le fue asignado a mano (recursos_asignados).
-- Ahora también: el recurso está adjunto a una comisión en la que el alumno está
-- inscripto. Es la misma policy con un `or` más — nunca `qual = true`, siempre scope.

drop policy if exists "biblioteca_select" on public.biblioteca_recursos;
create policy "biblioteca_select" on public.biblioteca_recursos
  for select to authenticated
  using (
    public.es_psicologo()
    or exists (
      select 1 from public.recursos_asignados ra
      where ra.recurso_id = biblioteca_recursos.id and ra.alumno_id = auth.uid()
    )
    or exists (
      select 1
      from public.cohortes_recursos cr
      join public.cohortes_alumnos ca on ca.cohorte_id = cr.cohorte_id
      where cr.recurso_id = biblioteca_recursos.id
        and ca.alumno_id = auth.uid()
    )
  );

commit;

-- ----------------------------------------------------------------------------
-- 3) Verificación (correr después del commit; las tres tienen que dar bien)
-- ----------------------------------------------------------------------------
--
-- RLS habilitada:
--   select relrowsecurity from pg_class where relname = 'cohortes_recursos';
--   → true
--
-- Las dos policies creadas:
--   select policyname from pg_policies where tablename = 'cohortes_recursos';
--   → cohortes_recursos_select, cohortes_recursos_all_psicologo
--
-- biblioteca_select quedó con los tres caminos (psicólogo / asignado / comisión):
--   select count(*) from pg_policies
--   where tablename = 'biblioteca_recursos'
--     and policyname = 'biblioteca_select'
--     and qual::text like '%cohortes_recursos%';
--   → 1
