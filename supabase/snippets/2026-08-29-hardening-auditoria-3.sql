-- ============================================================================
-- Tercera ronda de hardening — auditoría del 2026-08-29
-- Correr en el SQL Editor del proyecto urevyngawcybyrfvahgk.
-- https://supabase.com/dashboard/project/urevyngawcybyrfvahgk/sql/new
-- ============================================================================
--
-- Aditiva e idempotente: agrega una función y reemplaza una policy, no borra datos, se
-- puede correr dos veces sin efecto. Espejo exacto de lo que ya quedó en schema.sql
-- (sección HELPERS y la policy entregas_select) — este archivo es solo la versión para
-- pegar en el SQL Editor.
--
-- NO APLICADO CONTRA PRODUCCIÓN TODAVÍA. A diferencia de las rondas anteriores, este
-- bloque quedó sólo escrito (código + schema.sql), pendiente de que Lucas lo corra.

begin;

-- ----------------------------------------------------------------------------
-- 1) usuario_activo(): cierra la ventana de lectura post-suspensión en Storage
-- ----------------------------------------------------------------------------
-- cambiarEstadoAlumno() (psicologo/actions.ts) banea en Auth (invalida el refresh token)
-- y requireUser() (guards.ts) ya cierra las server actions comparando `estado`. Lo que
-- ninguna de las dos cierra es el access token YA EMITIDO: con jwt_expiry = 3600 (ver
-- supabase/config.toml), quien se suspende conserva hasta una hora de lectura directa
-- contra la Data API / Storage con ese token, porque ninguna policy de acá abajo mira
-- `estado`. Se aplica acá solo a la puerta más sensible (archivos de entregas); el resto
-- de las tablas queda para una ronda aparte si se decide ir más a fondo — bajar
-- jwt_expiry en el dashboard de producción (p.ej. a 900s) es la alternativa más simple y
-- global, a costo de refrescos de sesión más frecuentes para todo el mundo.

create or replace function public.usuario_activo()
returns boolean
language sql
security definer
stable
set search_path = public
as $$
  select exists (
    select 1 from public.alumnos
    where id = auth.uid() and estado = 'activo'
  );
$$;

-- entregas: el alumno solo su carpeta y sólo si sigue activo; psicólogo todo, sin esa
-- condición (necesita seguir viendo entregas de alguien que acaba de suspender).
drop policy if exists "entregas_select" on storage.objects;
create policy "entregas_select" on storage.objects
  for select to authenticated
  using (
    bucket_id = 'entregas'
    and (public.es_psicologo()
         or ((storage.foldername(name))[1] = auth.uid()::text and public.usuario_activo()))
  );

commit;

-- ----------------------------------------------------------------------------
-- 2) ESTADO DE LOS PENDIENTES DEL DASHBOARD (sin cambios desde la ronda anterior)
-- ----------------------------------------------------------------------------
-- PENDIENTE desde el 2026-08-05, repetido en el 2026-08-08: Authentication → Policies →
-- Minimum password length = 12, Password requirements = lower/upper/digits/symbols.
-- El código ahora valida esto server-side en /configurar-password y /crear-cuenta
-- (defense-in-depth), pero mientras el dashboard no se alinee, cualquiera que le pegue
-- directo a /auth/v1/user o /auth/v1/signup sin pasar por esas actions sigue entrando
-- con una contraseña de 6 caracteres sin requisitos. Verificar intentando
-- updateUser({password: "abcdef"}) — tiene que fallar.
