-- ============================================================================
-- Programas: exponer `tipo` a anon para agrupar la sección pública /cursos
-- Correr en el SQL Editor del proyecto (no hace falta hacerlo ANTES de deployar:
-- la página cae sola a un listado sin agrupar mientras este grant no exista).
-- https://supabase.com/dashboard/project/urevyngawcybyrfvahgk/sql/new
-- ============================================================================
--
-- /cursos lista los programas con publicado_en_home y ahora los separa en
-- "Cursos grabados" (tipo = 'curso_asincronico') y "Formaciones en grupo"
-- (tipo = 'formacion'). Para eso necesita leer `tipo` sin sesión.
--
-- anon lee `programas` por columnas explícitas (ver 2026-08-09-programas-publicar-home.sql
-- y el hardening de la auditoría): `tipo` nunca se agregó a esa lista, así que pedirla
-- da "permission denied for table programas". Es un valor de dos opciones sin nada
-- sensible; la policy programas_select_home sigue limitando QUÉ filas se ven (solo las
-- publicadas), esto solo suma una columna a las que ya se exponen.
--
-- Aditivo e idempotente.

begin;

grant select (tipo) on public.programas to anon;

commit;
