-- ============================================================================
-- Hardening — Resolución de warnings del Database Linter de Supabase
-- Fecha: 2026-09-02
-- Correr en el SQL Editor del proyecto urevyngawcybyrfvahgk:
-- https://supabase.com/dashboard/project/urevyngawcybyrfvahgk/sql/new
-- ============================================================================
--
-- Resuelve:
-- 1. function_search_path_mutable:
--    - public.tocar_ebook_updated_at
--    - public.tocar_opinion_updated_at
-- 2. anon_security_definer_function_executable:
--    - public.handle_new_user()
--    - public.proteger_entrega_de_alumno()
--    - public.es_psicologo()
--    - public.tiene_acceso_programa(uuid)
--    - public.usuario_activo()
-- 3. authenticated_security_definer_function_executable (para triggers):
--    - public.handle_new_user()
--    - public.proteger_entrega_de_alumno()
--
-- Idempotente y aditiva: no borra datos ni bloquea queries legítimas.
-- ============================================================================

begin;

-- ----------------------------------------------------------------------------
-- 1) function_search_path_mutable: fijar search_path en triggers de updated_at
-- ----------------------------------------------------------------------------

create or replace function public.tocar_ebook_updated_at()
returns trigger
language plpgsql
set search_path = ''
as $$
begin
  new.updated_at := pg_catalog.now();
  return new;
end;
$$;

create or replace function public.tocar_opinion_updated_at()
returns trigger
language plpgsql
set search_path = ''
as $$
begin
  new.updated_at := pg_catalog.now();
  return new;
end;
$$;

-- Revocar permisos EXECUTE a roles de API pública (no los necesitan, son triggers)
revoke all on function public.tocar_ebook_updated_at() from public, anon, authenticated;
revoke all on function public.tocar_opinion_updated_at() from public, anon, authenticated;


-- ----------------------------------------------------------------------------
-- 2) Triggers SECURITY DEFINER: revocar EXECUTE a anon y authenticated
-- ----------------------------------------------------------------------------
-- handle_new_user (trigger en auth.users) y proteger_entrega_de_alumno (trigger en
-- public.entregas) no son RPCs y nunca deben invocarse directamente vía API.
-- Postgres no exige el permiso EXECUTE en runtime para disparar triggers existentes.

revoke all on function public.handle_new_user() from public, anon, authenticated;
revoke all on function public.proteger_entrega_de_alumno() from public, anon, authenticated;


-- ----------------------------------------------------------------------------
-- 3) Desdoblar policy de ebooks_select para desacoplar a anon de es_psicologo()
-- ----------------------------------------------------------------------------
-- La policy actual permitía select a anon y authenticated evaluando
-- `(estado = 'publicado' or public.es_psicologo())`. Al separar anon en su propia
-- policy, anon ya no necesita jamás ejecutar public.es_psicologo().

drop policy if exists "ebooks_select" on public.ebooks;
drop policy if exists "ebooks_select_anon" on public.ebooks;
drop policy if exists "ebooks_select_authenticated" on public.ebooks;

create policy "ebooks_select_anon" on public.ebooks
  for select to anon
  using (estado = 'publicado');

create policy "ebooks_select_authenticated" on public.ebooks
  for select to authenticated
  using (estado = 'publicado' or public.es_psicologo());


-- ----------------------------------------------------------------------------
-- 4) anon_security_definer_function_executable: revocar EXECUTE a anon y public
-- ----------------------------------------------------------------------------
-- Los usuarios no autenticados (anon) no tienen sesión (auth.uid() = null), nunca son
-- psicólogos, nunca tienen cohortes ni lecciones activas. Revocar su acceso RPC.
-- Se revoca de `public` y `anon` para que no hereden el permiso default de Postgres.

revoke execute on function public.es_psicologo() from public, anon;
revoke execute on function public.usuario_activo() from public, anon;
revoke execute on function public.tiene_acceso_programa(uuid) from public, anon;

-- Asegurar explícitamente que authenticated y service_role mantengan EXECUTE
-- (necesario para la evaluación de las policies RLS en el contexto del usuario logueado)
grant execute on function public.es_psicologo() to authenticated, service_role;
grant execute on function public.usuario_activo() to authenticated, service_role;
grant execute on function public.tiene_acceso_programa(uuid) to authenticated, service_role;

commit;
