-- ============================================================================
-- AUDITORÍA ESTÁTICA — Plataforma de Cursos (Psicología)
-- Correr en el SQL Editor del proyecto:
-- https://supabase.com/dashboard/project/urevyngawcybyrfvahgk/sql/new
-- ============================================================================
--
-- SOLO LECTURA. No crea, no modifica y no borra nada: es una sola consulta que
-- interroga el catálogo de Postgres y las tablas del proyecto. Se puede correr
-- en producción, en cualquier momento, tantas veces como haga falta.
--
-- Devuelve UNA fila por control. Leer de arriba hacia abajo: el orden es por
-- severidad, así que si la primera fila dice OK no hay nada crítico abierto.
--
--   nivel      CRITICO  agujero real o riesgo legal — arreglar antes de deployar
--              ALTO     invariante roto; la app puede estar mostrando datos mal
--              MEDIO    deuda o inconsistencia que todavía no explota
--              BAJO     prolijidad / performance
--              INFO     inventario para revisar a ojo (no es un hallazgo)
--              OK       el control pasó
--   hallazgos  cuántos objetos incumplen
--   detalle    cuáles
--
-- La contraparte de este archivo es 02-tests-rls-dinamica.sql, que en vez de
-- leer el catálogo se hace pasar por un alumno y prueba las policies de verdad.
-- Este archivo dice "la policy está escrita"; el otro dice "la policy funciona".
-- Correr los dos.
--
-- Convención de la Ley 25.326 en esta base (ver AGENTS.md): el modelo del alumno
-- es cuenta + contenido asignado + agenda + progreso EDUCATIVO. Los controles
-- D01/D02/D03 son los que vigilan que eso no se corra de lugar.
-- ============================================================================

with

-- ----------------------------------------------------------------------------
-- Inventario esperado. Si mañana se agrega una tabla, el control E01 la marca
-- como desconocida: es a propósito, obliga a decidir sus policies acá.
-- ----------------------------------------------------------------------------
tablas_conocidas(nombre) as (
  values ('alumnos'),('programas'),('modulos'),('lecciones'),('cohortes'),
         ('cohortes_alumnos'),('cohortes_programas'),('programas_asignados'),
         ('biblioteca_recursos'),('recursos_asignados'),('progreso_lecciones'),
         ('quiz_preguntas'),('quiz_intentos'),('entregas'),('agenda_sesiones'),
         ('solicitudes_registro'),('ebooks'),('ordenes'),('emails_enviados'),
         ('opiniones_curso')
),

-- Tablas que a propósito NO tienen policies: se leen y escriben únicamente con
-- service-role desde el servidor. Cualquier otra tabla sin policies es un error.
sin_policies_esperado(nombre) as (
  values ('solicitudes_registro')
),

-- Funciones que tienen que existir sí o sí. Si falta una, hay policies
-- apuntando al vacío (o un trigger que dejó de proteger lo que protegía).
funciones_esperadas(nombre) as (
  values ('es_psicologo'),('tiene_acceso_programa'),('archivo_url_pertenece_alumno'),
         ('registrar_intento_quiz'),('handle_new_user'),('proteger_entrega_de_alumno')
),

triggers_esperados(tabla, nombre) as (
  values ('auth.users','on_auth_user_created'),
         ('public.entregas','trg_proteger_entrega'),
         ('public.ebooks','trg_ebooks_updated_at'),
         ('public.opiniones_curso','trg_opiniones_updated_at')
),

tablas_public as (
  select c.oid, c.relname::text as nombre, c.relrowsecurity, c.relforcerowsecurity
  from pg_class c
  join pg_namespace n on n.oid = c.relnamespace
  where n.nspname = 'public' and c.relkind = 'r'
),

resultados as (

-- ############################################################################
-- A) EXPOSICIÓN PÚBLICA — qué puede tocar alguien sin sesión (rol anon)
--    La anon key viaja en el bundle del navegador: cualquiera en internet la
--    tiene. Todo lo que anon pueda leer es, literalmente, público.
-- ############################################################################

-- A01 -------------------------------------------------------------------------
select
  case when count(*) = 0 then 'OK' else 'CRITICO' end::text as nivel,
  'A · Exposición pública'::text as area,
  'A01 · Toda tabla de public tiene RLS habilitada'::text as control,
  count(*)::int as hallazgos,
  coalesce(string_agg(nombre, ', ' order by nombre), '—')::text as detalle
from tablas_public where not relrowsecurity

union all
-- A02 -------------------------------------------------------------------------
select
  case when count(*) = 0 then 'OK' else 'ALTO' end,
  'A · Exposición pública',
  'A02 · Tablas con RLS y sin ninguna policy (solo service-role) fuera de lo previsto',
  count(*)::int,
  coalesce(string_agg(nombre, ', ' order by nombre), '—')
from tablas_public t
where t.relrowsecurity
  and not exists (select 1 from pg_policies p where p.schemaname='public' and p.tablename = t.nombre)
  and t.nombre not in (select nombre from sin_policies_esperado)

union all
-- A03 -------------------------------------------------------------------------
select
  case when count(*) = 0 then 'OK' else 'CRITICO' end,
  'A · Exposición pública',
  'A03 · Policies sin scope (USING true / WITH CHECK true)',
  count(*)::int,
  coalesce(string_agg(tablename || '.' || policyname, ', ' order by tablename, policyname), '—')
from pg_policies
where schemaname in ('public','storage')
  and (btrim(coalesce(qual, '')) = 'true' or btrim(coalesce(with_check, '')) = 'true')

union all
-- A04 -------------------------------------------------------------------------
select
  case when count(*) = 0 then 'OK' else 'ALTO' end,
  'A · Exposición pública',
  'A04 · Policies otorgadas al rol public (alcanzan a anon sin decirlo)',
  count(*)::int,
  coalesce(string_agg(schemaname || '.' || tablename || '.' || policyname, ', ' order by tablename, policyname), '—')
from pg_policies
where schemaname in ('public','storage') and 'public' = any(roles)

union all
-- A05 -------------------------------------------------------------------------
select
  'INFO',
  'A · Exposición pública',
  'A05 · Policies que alcanzan a anon (revisar a ojo: deberían ser solo la vidriera)',
  count(*)::int,
  coalesce(string_agg(tablename || '.' || policyname || ' [' || cmd || '] USING ' || coalesce(qual,'—'),
           ' | ' order by tablename, policyname), '—')
from pg_policies
where schemaname in ('public','storage') and 'anon' = any(roles)

union all
-- A06 -------------------------------------------------------------------------
select
  case when count(*) = 0 then 'OK' else 'CRITICO' end,
  'A · Exposición pública',
  'A06 · Grants de tabla COMPLETA a anon (tienen que ser cero: solo por columna)',
  count(*)::int,
  coalesce(string_agg(nombre || ' → ' || priv, ', ' order by nombre, priv), '—')
from tablas_public t
cross join lateral (values ('SELECT'),('INSERT'),('UPDATE'),('DELETE')) as p(priv)
where has_table_privilege('anon', t.oid, p.priv)

union all
-- A07 -------------------------------------------------------------------------
select
  case when count(*) = 0 then 'OK' else 'CRITICO' end,
  'A · Exposición pública',
  'A07 · anon con permiso de ESCRITURA en alguna columna',
  count(*)::int,
  coalesce(string_agg(distinct table_name || '.' || column_name || ' (' || privilege_type || ')', ', '), '—')
from information_schema.column_privileges
where grantee = 'anon' and table_schema = 'public' and privilege_type <> 'SELECT'

union all
-- A08 -------------------------------------------------------------------------
-- Lo que hoy lee un visitante sin sesión. No es un hallazgo: es la superficie
-- pública, y tiene que caber en una línea que se pueda leer y aprobar.
select
  'INFO',
  'A · Exposición pública',
  'A08 · Columnas que anon puede LEER (superficie pública total)',
  count(*)::int,
  coalesce(string_agg(table_name || '.' || column_name, ', ' order by table_name, column_name), '—')
from information_schema.column_privileges
where grantee = 'anon' and table_schema = 'public' and privilege_type = 'SELECT'

union all
-- A09 -------------------------------------------------------------------------
-- Un grant por columna es una lista blanca escrita a mano: no se actualiza sola
-- cuando alguien agrega una columna sensible a una tabla ya expuesta.
select
  case when count(*) = 0 then 'OK' else 'CRITICO' end,
  'A · Exposición pública',
  'A09 · Columna SENSIBLE legible por anon (email/teléfono/token/archivo/precio interno)',
  count(*)::int,
  coalesce(string_agg(table_name || '.' || column_name, ', ' order by table_name, column_name), '—')
from information_schema.column_privileges
where grantee = 'anon' and table_schema = 'public' and privilege_type = 'SELECT'
  and column_name ~* '(email|telefono|tel[eé]fono|token|password|secret|archivo_key|dni|documento|direccion|link_videollamada|objetivos|referencia_externa)'

union all
-- A10 -------------------------------------------------------------------------
-- Deriva de la lista blanca: columnas nuevas en tablas ya expuestas que quedaron
-- fuera del grant. No son un agujero (el default correcto es NO exponer), pero
-- si la app las pide en una página pública, la query devuelve 401 y la sección
-- se ve vacía sin error visible.
select
  case when count(*) = 0 then 'OK' else 'INFO' end,
  'A · Exposición pública',
  'A10 · Columnas nuevas fuera del grant de anon (decidir: exponer o no)',
  count(*)::int,
  coalesce(string_agg(c.table_name || '.' || c.column_name, ', ' order by c.table_name, c.column_name), '—')
from information_schema.columns c
where c.table_schema = 'public'
  and c.table_name in (
    select distinct table_name from information_schema.column_privileges
    where grantee = 'anon' and table_schema = 'public' and privilege_type = 'SELECT'
  )
  and not has_column_privilege('anon', ('public.' || c.table_name)::regclass, c.column_name, 'SELECT')

union all
-- A11 -------------------------------------------------------------------------
-- authenticated sí tiene grant de tabla completa (así está diseñado: RLS filtra
-- filas, no columnas). Por eso una policy que deja pasar la FILA deja pasar
-- TODAS sus columnas. Este control lista los casos donde eso importa.
select
  case when count(*) = 0 then 'OK' else 'MEDIO' end,
  'A · Exposición pública',
  'A11 · Columnas internas visibles a cualquier alumno logueado por una policy amplia',
  count(*)::int,
  coalesce(string_agg(det, ' | '), '—')
from (
  select 'ebooks.archivo_key + link_pago (policy ebooks_select deja ver todo ebook publicado a authenticated)'::text as det
  where exists (
    select 1 from pg_policies
    where schemaname='public' and tablename='ebooks' and cmd='SELECT'
      and 'authenticated' = any(roles) and qual ilike '%publicado%'
  )
) s

-- ############################################################################
-- B) FUNCIONES Y VISTAS — el otro camino de escalada, el que no pasa por RLS
-- ############################################################################

union all
-- B01 -------------------------------------------------------------------------
-- Una SECURITY DEFINER sin search_path fijo corre con los permisos del dueño
-- pero resuelve los nombres con el search_path de quien la llama: se le puede
-- colar una tabla o un operador propio y hacerle ejecutar cualquier cosa.
select
  case when count(*) = 0 then 'OK' else 'CRITICO' end,
  'B · Funciones',
  'B01 · SECURITY DEFINER sin search_path fijo',
  count(*)::int,
  coalesce(string_agg(p.proname, ', ' order by p.proname), '—')
from pg_proc p
join pg_namespace n on n.oid = p.pronamespace
where n.nspname = 'public' and p.prosecdef
  and not exists (select 1 from unnest(coalesce(p.proconfig, '{}')) cfg where cfg like 'search\_path=%')

union all
-- B02 -------------------------------------------------------------------------
-- SECURITY DEFINER + VOLATILE = escribe con permisos del dueño. Si además la
-- puede invocar el alumno vía /rest/v1/rpc, es una puerta lateral a las tablas
-- que la RLS protege. es_psicologo/tiene_acceso_programa quedan fuera porque son
-- STABLE (no escriben) y las policies necesitan que authenticated las ejecute.
select
  case when count(*) = 0 then 'OK' else 'CRITICO' end,
  'B · Funciones',
  'B02 · SECURITY DEFINER que ESCRIBE e invocable por anon/authenticated/public',
  count(*)::int,
  coalesce(string_agg(p.proname || ' ← ' || rol, ', ' order by p.proname), '—')
from pg_proc p
join pg_namespace n on n.oid = p.pronamespace
cross join lateral (values ('anon'),('authenticated'),('public')) as r(rol)
where n.nspname = 'public' and p.prosecdef and p.provolatile = 'v'
  and p.prorettype <> 'trigger'::regtype
  and has_function_privilege(r.rol, p.oid, 'EXECUTE')

union all
-- B03 -------------------------------------------------------------------------
-- El control explícito de la puerta del quiz: quiz_intentos se quedó sin policy
-- de insert justamente para que el único camino sea esta función, server-side.
-- Si vuelve a ser invocable por el alumno, se puede insertar aprobado=true.
select
  case when count(*) = 0 then 'OK' else 'CRITICO' end,
  'B · Funciones',
  'B03 · registrar_intento_quiz NO ejecutable por el alumno (solo service_role)',
  count(*)::int,
  coalesce(string_agg('ejecutable por ' || rol, ', '), '—')
from pg_proc p
join pg_namespace n on n.oid = p.pronamespace
cross join lateral (values ('anon'),('authenticated'),('public')) as r(rol)
where n.nspname = 'public' and p.proname = 'registrar_intento_quiz'
  and has_function_privilege(r.rol, p.oid, 'EXECUTE')

union all
-- B04 -------------------------------------------------------------------------
select
  case when count(*) = 0 then 'OK' else 'ALTO' end,
  'B · Funciones',
  'B04 · Funciones esperadas que faltan',
  count(*)::int,
  coalesce(string_agg(f.nombre, ', ' order by f.nombre), '—')
from funciones_esperadas f
where not exists (
  select 1 from pg_proc p join pg_namespace n on n.oid = p.pronamespace
  where n.nspname = 'public' and p.proname = f.nombre
)

union all
-- B05 -------------------------------------------------------------------------
-- Una vista sin security_invoker se ejecuta con los permisos de su dueño
-- (postgres), o sea que ignora la RLS de las tablas que lee. Es el "security
-- definer view" que marca el linter de Supabase.
select
  case when count(*) = 0 then 'OK' else 'ALTO' end,
  'B · Funciones',
  'B05 · Vistas en public sin security_invoker=on (saltean RLS)',
  count(*)::int,
  coalesce(string_agg(c.relname, ', ' order by c.relname), '—')
from pg_class c
join pg_namespace n on n.oid = c.relnamespace
where n.nspname = 'public' and c.relkind in ('v','m')
  and coalesce((select option_value from pg_options_to_table(c.reloptions)
                where option_name = 'security_invoker'), 'false') <> 'true'

union all
-- B06 -------------------------------------------------------------------------
select
  case when count(*) = 0 then 'OK' else 'ALTO' end,
  'B · Funciones',
  'B06 · Triggers críticos ausentes o deshabilitados',
  count(*)::int,
  coalesce(string_agg(te.tabla || '.' || te.nombre, ', ' order by te.nombre), '—')
from triggers_esperados te
where not exists (
  select 1 from pg_trigger t
  where t.tgname = te.nombre and t.tgrelid = te.tabla::regclass
    and not t.tgisinternal and t.tgenabled <> 'D'
)

union all
-- B07 -------------------------------------------------------------------------
select
  case when count(*) = 0 then 'OK' else 'MEDIO' end,
  'B · Funciones',
  'B07 · Extensiones instaladas en el schema public',
  count(*)::int,
  coalesce(string_agg(e.extname, ', ' order by e.extname), '—')
from pg_extension e
join pg_namespace n on n.oid = e.extnamespace
where n.nspname = 'public'

-- ############################################################################
-- C) STORAGE — los archivos, que es donde vive el material y las entregas
-- ############################################################################

union all
-- C01 -------------------------------------------------------------------------
select
  case when count(*) = 0 then 'OK' else 'CRITICO' end,
  'C · Storage',
  'C01 · Buckets públicos (materiales y entregas tienen que ser privados)',
  count(*)::int,
  coalesce(string_agg(id, ', ' order by id), '—')
from storage.buckets where public

union all
-- C02 -------------------------------------------------------------------------
select
  case when count(*) = 0 then 'OK' else 'ALTO' end,
  'C · Storage',
  'C02 · Policies de storage.objects que no filtran por bucket_id',
  count(*)::int,
  coalesce(string_agg(policyname, ', ' order by policyname), '—')
from pg_policies
where schemaname = 'storage' and tablename = 'objects'
  and coalesce(qual, '') || coalesce(with_check, '') not ilike '%bucket_id%'

union all
-- C03 -------------------------------------------------------------------------
-- La policy exige que el primer segmento del path sea el uid del que sube. Si
-- hay objetos que no cumplen, entraron por service-role saltándose esa regla.
select
  case when count(*) = 0 then 'OK' else 'ALTO' end,
  'C · Storage',
  'C03 · Objetos en el bucket entregas fuera de la carpeta de un alumno real',
  count(*)::int,
  coalesce(string_agg(left(name, 60), ', ' order by name), '—')
from storage.objects o
where o.bucket_id = 'entregas'
  and not exists (
    select 1 from public.alumnos a
    where (storage.foldername(o.name))[1] = a.id::text
  )

-- ############################################################################
-- D) LEY 25.326 Y REGLAS DEL DOMINIO — lo que no puede existir en esta base
-- ############################################################################

union all
-- D01 -------------------------------------------------------------------------
-- La plataforma dicta CURSOS. Aunque el material enseñe sobre PHQ-9/GAD-7, no
-- se implementan como instrumentos: son materia, no funciones. Una columna con
-- nombre clínico es la señal de que eso se corrió de lugar.
select
  case when count(*) = 0 then 'OK' else 'CRITICO' end,
  'D · Ley 25.326',
  'D01 · Columnas con semántica clínica (prohibidas por diseño)',
  count(*)::int,
  coalesce(string_agg(table_name || '.' || column_name, ', ' order by table_name, column_name), '—')
from information_schema.columns
where table_schema = 'public'
  and column_name ~* '(diagnostic|diagn[oó]stico|motivo_consulta|nota_clinica|notas_clinicas|historia_clinica|patolog|s[ií]ntoma|sintoma|medicaci|psicofarmac|phq|gad7|gad_7|escala_clinica|tratamiento_clinico|sesion_terapia)'

union all
-- D02 -------------------------------------------------------------------------
-- quiz_preguntas guarda respuesta_correcta. El alumno no puede tener NINGÚN
-- camino a esta tabla: las preguntas se le mandan sin respuesta desde el
-- servidor y la corrección es server-side.
select
  case when count(*) = 0 then 'OK' else 'CRITICO' end,
  'D · Ley 25.326',
  'D02 · quiz_preguntas: alguna policy que no exija ser psicólogo',
  count(*)::int,
  coalesce(string_agg(policyname || ' [' || cmd || '] USING ' || coalesce(qual,'—'), ' | '), '—')
from pg_policies
where schemaname = 'public' and tablename = 'quiz_preguntas'
  and coalesce(qual,'') || coalesce(with_check,'') not ilike '%es_psicologo%'

union all
-- D03 -------------------------------------------------------------------------
-- solicitudes_registro.objetivos es motivo de consulta contado por alguien que
-- todavía no es alumno: dato sensible recolectado pre-alta. Se escribe y se lee
-- SOLO con service-role. Cualquier policy acá abre ese dato a la Data API.
select
  case when count(*) = 0 then 'OK' else 'CRITICO' end,
  'D · Ley 25.326',
  'D03 · solicitudes_registro con policies (tiene que ser solo service-role)',
  count(*)::int,
  coalesce(string_agg(policyname || ' → ' || array_to_string(roles, '/'), ', '), '—')
from pg_policies
where schemaname = 'public' and tablename = 'solicitudes_registro'

union all
-- D04 -------------------------------------------------------------------------
-- El rol vive en alumnos.rol, nunca en la metadata del usuario de auth: la
-- metadata es editable por el propio usuario en varios flujos de GoTrue.
select
  case when count(*) = 0 then 'OK' else 'CRITICO' end,
  'D · Ley 25.326',
  'D04 · Usuarios con rol/permisos guardados en la metadata de auth',
  count(*)::int,
  coalesce(string_agg(email, ', ' order by email), '—')
from auth.users
where raw_user_meta_data ?| array['rol','role','is_admin','admin','permisos']
   or raw_app_meta_data ?| array['rol','is_admin','admin','permisos']

union all
-- D05 -------------------------------------------------------------------------
select
  'INFO',
  'D · Ley 25.326',
  'D05 · Cuentas con rol psicólogo (cada una ve TODO: revisar una por una)',
  count(*)::int,
  coalesce(string_agg(email || ' [' || estado || ']', ', ' order by email), '—')
from public.alumnos where rol = 'psicologo'

-- ############################################################################
-- E) INTEGRIDAD — invariantes que la RLS promete pero los datos pueden desmentir
-- ############################################################################

union all
-- E01 -------------------------------------------------------------------------
select
  case when count(*) = 0 then 'OK' else 'ALTO' end,
  'E · Integridad',
  'E01 · Tablas fuera del inventario auditado (definir sus policies)',
  count(*)::int,
  coalesce(string_agg(nombre, ', ' order by nombre), '—')
from tablas_public
where nombre not in (select nombre from tablas_conocidas)

union all
-- E02 -------------------------------------------------------------------------
-- El invariante de entregas: el archivo declarado tiene que vivir en la carpeta
-- del alumno dueño de la fila. Una fila que no cumple es una entrega ajena
-- registrada como propia (y después servida firmada desde Tareas).
select
  case when count(*) = 0 then 'OK' else 'ALTO' end,
  'E · Integridad',
  'E02 · entregas cuyo archivo_url no pertenece a la carpeta de su alumno',
  count(*)::int,
  coalesce(string_agg(id::text || ' → ' || left(archivo_url, 50), ', '), '—')
from public.entregas
where archivo_url not like ('r2key://entregas/' || alumno_id::text || '/%')
  and archivo_url not like (alumno_id::text || '/%')

union all
-- E03 -------------------------------------------------------------------------
select
  case when count(*) = 0 then 'OK' else 'MEDIO' end,
  'E · Integridad',
  'E03 · progreso_lecciones sobre programas que el alumno ya no tiene asignados',
  count(*)::int,
  count(*)::text || ' filas (esperable si se revocó un programa; no es un agujero)'
from public.progreso_lecciones pl
join public.lecciones l on l.id = pl.leccion_id
where not exists (
  select 1 from public.programas_asignados pa
  where pa.alumno_id = pl.alumno_id and pa.programa_id = l.programa_id
)

union all
-- E04 -------------------------------------------------------------------------
select
  case when count(*) = 0 then 'OK' else 'MEDIO' end,
  'E · Integridad',
  'E04 · opiniones_curso sobre programas no asignados',
  count(*)::int,
  coalesce(string_agg(o.id::text, ', '), '—')
from public.opiniones_curso o
where not exists (
  select 1 from public.programas_asignados pa
  where pa.alumno_id = o.alumno_id and pa.programa_id = o.programa_id
)

union all
-- E05 -------------------------------------------------------------------------
-- La corrección compara texto contra texto: si respuesta_correcta no está entre
-- las opciones, esa pregunta es imposible de aprobar y nadie se entera.
select
  case when count(*) = 0 then 'OK' else 'ALTO' end,
  'E · Integridad',
  'E05 · quiz_preguntas cuya respuesta_correcta no figura entre las opciones',
  count(*)::int,
  coalesce(string_agg(left(pregunta, 45), ' | '), '—')
from public.quiz_preguntas q
where not exists (
  select 1 from jsonb_array_elements_text(q.opciones) op where op = q.respuesta_correcta
)

union all
-- E06 -------------------------------------------------------------------------
select
  case when count(*) = 0 then 'OK' else 'MEDIO' end,
  'E · Integridad',
  'E06 · Lecciones de tipo quiz sin ninguna pregunta cargada',
  count(*)::int,
  coalesce(string_agg(left(titulo, 45), ' | ' order by titulo), '—')
from public.lecciones l
where l.tipo_contenido = 'quiz'
  and not exists (select 1 from public.quiz_preguntas q where q.leccion_id = l.id)

union all
-- E07 -------------------------------------------------------------------------
-- url_recurso termina en un iframe/embed. http:// sin TLS es contenido mixto:
-- el navegador lo bloquea y además viaja en claro.
select
  case when count(*) = 0 then 'OK' else 'ALTO' end,
  'E · Integridad',
  'E07 · Recursos con URL sin TLS (http://) o con esquema raro',
  count(*)::int,
  coalesce(string_agg(origen_tabla || ': ' || left(url, 60), ' | '), '—')
from (
  select 'lecciones'::text as origen_tabla, url_recurso as url from public.lecciones
  union all
  select 'biblioteca_recursos', url_recurso from public.biblioteca_recursos
) u
where url like 'http://%'
   or url like 'javascript:%'
   or url like 'data:%'

union all
-- E08 -------------------------------------------------------------------------
select
  case when count(*) = 0 then 'OK' else 'ALTO' end,
  'E · Integridad',
  'E08 · agenda_sesiones sin destino único (ni alumno ni cohorte, o los dos)',
  count(*)::int,
  coalesce(string_agg(id::text, ', '), '—')
from public.agenda_sesiones
where (alumno_id is null) = (cohorte_id is null)

union all
-- E09 -------------------------------------------------------------------------
-- El tope de 3 intentos lo sostiene registrar_intento_quiz con un advisory lock.
-- Filas de más significan que alguna vez se escribió por otro camino.
select
  case when count(*) = 0 then 'OK' else 'MEDIO' end,
  'E · Integridad',
  'E09 · Pares (alumno, lección) con más de 3 intentos de quiz',
  count(*)::int,
  coalesce(string_agg(alumno_id::text || '/' || leccion_id::text || ': ' || n::text, ', '), '—')
from (
  select alumno_id, leccion_id, count(*) as n
  from public.quiz_intentos group by alumno_id, leccion_id having count(*) > 3
) t

union all
-- E10 -------------------------------------------------------------------------
select
  case when count(*) = 0 then 'OK' else 'MEDIO' end,
  'E · Integridad',
  'E10 · Órdenes pagadas sin fecha de pago o sin token de descarga',
  count(*)::int,
  coalesce(string_agg(id::text, ', '), '—')
from public.ordenes
where estado = 'pagada' and (pagada_at is null or token_descarga is null)

union all
-- E11 -------------------------------------------------------------------------
select
  case when count(*) = 0 then 'OK' else 'MEDIO' end,
  'E · Integridad',
  'E11 · Usuarios de auth sin perfil en alumnos (el trigger no corrió)',
  count(*)::int,
  coalesce(string_agg(u.email, ', ' order by u.email), '—')
from auth.users u
where not exists (select 1 from public.alumnos a where a.id = u.id)

union all
-- E12 -------------------------------------------------------------------------
select
  case when count(*) = 0 then 'OK' else 'MEDIO' end,
  'E · Integridad',
  'E12 · Alumnos dados de baja que siguen con contenido o agenda activa',
  count(*)::int,
  coalesce(string_agg(a.email, ', ' order by a.email), '—')
from public.alumnos a
where a.estado in ('suspendido','eliminado')
  and (exists (select 1 from public.programas_asignados pa where pa.alumno_id = a.id)
    or exists (select 1 from public.agenda_sesiones s where s.alumno_id = a.id and s.fecha_hora > now()))

union all
-- E13 -------------------------------------------------------------------------
select
  case when count(*) = 0 then 'OK' else 'BAJO' end,
  'E · Integridad',
  'E13 · Cohortes con fechas u horario invertidos',
  count(*)::int,
  coalesce(string_agg(nombre, ', ' order by nombre), '—')
from public.cohortes
where (fecha_inicio is not null and fecha_fin is not null and fecha_fin < fecha_inicio)
   or (hora_inicio is not null and hora_fin is not null and hora_fin <= hora_inicio)

-- ############################################################################
-- F) ESTRUCTURA — prolijidad y costo de las consultas
-- ############################################################################

union all
-- F01 -------------------------------------------------------------------------
select
  case when count(*) = 0 then 'OK' else 'MEDIO' end,
  'F · Estructura',
  'F01 · Tablas sin primary key',
  count(*)::int,
  coalesce(string_agg(nombre, ', ' order by nombre), '—')
from tablas_public t
where not exists (select 1 from pg_constraint c where c.conrelid = t.oid and c.contype = 'p')

union all
-- F02 -------------------------------------------------------------------------
-- Una FK sin índice hace que cada DELETE en el padre escanee la tabla hija
-- entera, y que los joins de la app lo paguen en cada request.
select
  case when count(*) = 0 then 'OK' else 'BAJO' end,
  'F · Estructura',
  'F02 · Claves foráneas sin índice de apoyo',
  count(*)::int,
  coalesce(string_agg(rel || '(' || col || ')', ', ' order by rel, col), '—')
from (
  select c.conrelid::regclass::text as rel,
         (select string_agg(a.attname, ',' order by k.ord)
            from unnest(c.conkey) with ordinality k(attnum, ord)
            join pg_attribute a on a.attrelid = c.conrelid and a.attnum = k.attnum) as col,
         c.conkey
  from pg_constraint c
  join pg_class cl on cl.oid = c.conrelid
  join pg_namespace n on n.oid = cl.relnamespace
  where c.contype = 'f' and n.nspname = 'public'
) fk
where not exists (
  select 1 from pg_index i
  where i.indrelid = fk.rel::regclass
    and (i.indkey::smallint[])[0:array_length(fk.conkey,1)-1] = fk.conkey
)

union all
-- F03 -------------------------------------------------------------------------
select
  'INFO',
  'F · Estructura',
  'F03 · Volumen actual de las tablas con datos de personas',
  count(*)::int,
  coalesce(string_agg(t || ': ' || n::text, ' · ' order by t), '—')
from (
  select 'alumnos'::text as t, count(*) as n from public.alumnos
  union all select 'entregas', count(*) from public.entregas
  union all select 'agenda_sesiones', count(*) from public.agenda_sesiones
  union all select 'solicitudes_registro', count(*) from public.solicitudes_registro
  union all select 'ordenes', count(*) from public.ordenes
  union all select 'opiniones_curso', count(*) from public.opiniones_curso
) v

)

select
  nivel,
  area,
  control,
  hallazgos,
  detalle
from resultados
order by
  case nivel
    when 'CRITICO' then 0 when 'ALTO' then 1 when 'MEDIO' then 2
    when 'BAJO' then 3 when 'INFO' then 4 else 5
  end,
  control;
