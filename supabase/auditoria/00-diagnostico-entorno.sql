-- ============================================================================
-- DIAGNÓSTICO DEL ENTORNO — correr una sola vez, antes que los otros dos
-- ============================================================================
--
-- Solo lectura. No mira los datos del proyecto: mira si el SQL Editor tiene lo
-- que 02-tests-rls-dinamica.sql necesita para hacerse pasar por un alumno.
--
-- Los tests dinámicos hacen dos cosas que dependen de cómo esté armado ESTE
-- proyecto y no se pueden verificar desde afuera:
--   1. crear usuarios de prueba en auth.users (el esquema de GoTrue cambia entre
--      versiones: si hay una columna NOT NULL sin default que yo no conozca, la
--      fixture no entra);
--   2. cambiar de rol a `authenticated` para que la RLS se active de verdad.
--
-- Si las cuatro filas dicen OK, el 02 va a correr entero.
-- ============================================================================

with

-- Columnas de auth.users que hay que completar sí o sí al insertar.
obligatorias as (
  select string_agg(column_name, ', ' order by column_name) as cols
  from information_schema.columns
  where table_schema = 'auth' and table_name = 'users'
    and is_nullable = 'NO' and column_default is null
    and column_name <> 'id'
),

-- Roles de Supabase de los que el usuario del editor es miembro. Sin membresía
-- en `authenticated` no hay impersonación posible.
membresias as (
  select string_agg(r.rolname, ', ' order by r.rolname) as roles
  from pg_auth_members m
  join pg_roles r on r.oid = m.roleid
  join pg_roles u on u.oid = m.member
  where u.rolname = current_user and r.rolname in ('anon','authenticated','service_role')
),

extensiones as (
  select string_agg(e.extname || ' → ' || n.nspname, ', ' order by e.extname) as lista
  from pg_extension e join pg_namespace n on n.oid = e.extnamespace
)

select * from (
  select 1 as orden,
    'Usuario del editor'::text as control,
    case when current_user in ('postgres','supabase_admin') then 'OK' else 'REVISAR' end::text as estado,
    (current_user || ' (sesión: ' || session_user || ')')::text as detalle

  union all
  select 2,
    'Puede hacerse pasar por authenticated',
    case when (select roles from membresias) like '%authenticated%' then 'OK' else 'FALTA' end,
    coalesce((select roles from membresias), 'sin membresías — el script 02 no va a poder impersonar')

  union all
  select 3,
    'auth.users acepta una fixture mínima (id + email)',
    case when coalesce((select cols from obligatorias), '') = '' then 'OK' else 'REVISAR' end,
    coalesce('columnas NOT NULL sin default que habría que completar: ' || (select cols from obligatorias),
             'ninguna: alcanza con id y email')

  union all
  select 4,
    'Extensiones instaladas y en qué schema viven',
    'INFO',
    coalesce((select lista from extensiones), '—')
) t order by orden;
