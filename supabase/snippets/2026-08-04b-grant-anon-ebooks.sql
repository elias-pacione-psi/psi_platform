-- ============================================================================
-- Fix: la vidriera pública de ebooks devolvía "permission denied for table ebooks"
-- Correr en el SQL Editor del proyecto urevyngawcybyrfvahgk, después de
-- 2026-08-04-ebooks-y-desplegable-interes.sql.
-- ============================================================================
--
-- Causa: schema.sql (sección de grants, ~línea 300) excluye a `anon` de los
-- privilegios por defecto sobre tablas nuevas a propósito:
--
--   alter default privileges in schema public revoke all on tables from anon;
--
-- Es una decisión de seguridad deliberada del proyecto — hasta ahora NINGUNA
-- tabla necesitaba que `anon` (sin sesión) leyera nada directo, todo pasaba por
-- `authenticated` o por service-role. `ebooks` es la primera excepción: la
-- vidriera pública (/ebooks) tiene que poder mostrarse a un comprador sin cuenta.
--
-- La policy `ebooks_select ... to anon` (ya creada en la migración anterior)
-- nunca alcanza a evaluarse sin este GRANT: en Postgres, el privilegio a nivel
-- de tabla es la puerta de entrada, y RLS filtra recién adentro. Sin el GRANT,
-- PostgREST devuelve "permission denied" antes de llegar a mirar ninguna policy.
--
-- Nota a propósito: SOLO select, y SOLO en `ebooks`. `ordenes` no necesita esto
-- — todo lo que el checkout público toca en esa tabla pasa por service-role
-- (ver app/ebooks/actions.ts), nunca por el cliente anon directo.

begin;

grant select on public.ebooks to anon;

commit;
