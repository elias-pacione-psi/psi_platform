-- ============================================================================
-- Programas: portada + descripción ampliada + "Publicar en Home"
-- Correr en el SQL Editor del proyecto ANTES de deployar.
-- https://supabase.com/dashboard/project/urevyngawcybyrfvahgk/sql/new
-- ============================================================================
--
-- Aditiva e idempotente: no borra ni renombra nada. La sección "Cursos"
-- pública pasa de estática a listar los programas marcados con
-- publicado_en_home, mismo patrón que ebooks (portada_key + SelectorArchivoR2
-- + resolverUrlRecurso), pero sin exigir portada ni descripción ampliada para
-- publicar: las imágenes se cargan después y todos los cursos ya creados
-- tienen que aparecer ya.

begin;

-- ----------------------------------------------------------------------------
-- 1) Columnas nuevas
-- ----------------------------------------------------------------------------

alter table public.programas add column if not exists descripcion_larga text;
alter table public.programas add column if not exists portada_key text;
alter table public.programas add column if not exists publicado_en_home boolean not null default false;

-- ----------------------------------------------------------------------------
-- 2) Backfill: todo lo ya creado aparece ya en /cursos, sin tener que entrar a
-- tildar programa por programa. Los que se creen de acá en adelante arrancan
-- en false (opt-in manual vía el checkbox del form).
-- ----------------------------------------------------------------------------

update public.programas set publicado_en_home = true where publicado_en_home = false;
update public.programas set descripcion_larga = descripcion where descripcion_larga is null and descripcion is not null;

-- ----------------------------------------------------------------------------
-- 3) RLS: anon hoy no puede leer `programas` en absoluto (programas_select es
-- solo `to authenticated`, más el revoke global de anon en schema.sql). Se
-- suma una policy nueva y scopeada (nunca `qual = true`) que también cubre a
-- `authenticated`: así un alumno logueado mirando /cursos ve la vidriera
-- igual que un visitante sin sesión. Es un OR con programas_select, no la
-- reemplaza — lo asignado sigue viéndose exactamente igual que antes.
-- ----------------------------------------------------------------------------

drop policy if exists "programas_select_home" on public.programas;
create policy "programas_select_home" on public.programas
  for select to anon, authenticated
  using (publicado_en_home = true);

-- Columnas expuestas a anon: lista explícita y mínima, mismo patrón que ebooks.
revoke select on public.programas from anon; -- por si se corrió una versión previa del snippet
grant select (id, titulo, descripcion, descripcion_larga, portada_key, publicado_en_home, created_at) on public.programas to anon;

commit;
