-- ============================================================================
-- Hardening salido de la auditoría de seguridad del 2026-08-05
-- Correr en el SQL Editor del proyecto urevyngawcybyrfvahgk.
-- https://supabase.com/dashboard/project/urevyngawcybyrfvahgk/sql/new
-- ============================================================================
--
-- Aditiva e idempotente: no borra ni renombra nada, se puede correr con producción
-- como está y correr dos veces sin efecto. Los cambios de código que la acompañan
-- están en la rama fix/auditoria-seguridad-2026-08-05.
--
-- OJO — esto NO es todo el fix. El hallazgo más grave de la auditoría (registro
-- público abierto) no se arregla con SQL: hay que apagar el toggle en
-- Authentication → Sign In / Providers → "Allow new users to sign up".
-- Sin eso, cualquiera con la anon key (que viaja en el bundle del navegador) crea
-- una cuenta `authenticated` salteándose el chequeo de compra pagada.

begin;

-- ----------------------------------------------------------------------------
-- 1) search_path fijo en archivo_url_pertenece_alumno
-- ----------------------------------------------------------------------------
-- Era la única función del esquema sin `set search_path` (es_psicologo,
-- tiene_acceso_programa y handle_new_user ya lo tenían). El riesgo real es bajo
-- —`authenticated` no tiene CREATE sobre public en PG15+, así que no puede plantar
-- un operador que shadowee a `like` o `||`— pero es exactamente lo que marca el
-- linter de Supabase como function_search_path_mutable, y esta función decide una
-- policy: no es el lugar para dejar resolución de nombres al azar.

create or replace function public.archivo_url_pertenece_alumno(url text)
returns boolean
language sql
stable
set search_path = public, pg_catalog
as $$
  select
    url like ('r2key://entregas/' || auth.uid()::text || '/%')
    or url like (auth.uid()::text || '/%')
$$;

-- ----------------------------------------------------------------------------
-- 2) Entregas y progreso: sólo sobre lecciones a las que el alumno tiene acceso
-- ----------------------------------------------------------------------------
-- Antes las dos policies sólo exigían `alumno_id = auth.uid()`, o sea "esto es mío",
-- sin preguntar si la lección le corresponde. Un alumno podía insertar filas
-- apuntando a cualquier leccion_id del sistema (los ids no se enumeran vía RLS, pero
-- que un id sea difícil de adivinar no es un control de acceso). No es fuga de datos
-- —no se lee nada ajeno— pero sí escritura sin cota en tablas del negocio.
--
-- El chequeo va SOLO en el WITH CHECK y no en el USING a propósito: si el psicólogo
-- le revoca un programa a un alumno, las filas viejas tienen que seguir siendo
-- borrables (y legibles por el propio alumno). Meterlo en el USING dejaría progreso
-- huérfano imposible de limpiar.

drop policy if exists "entregas_insert_propio" on public.entregas;
create policy "entregas_insert_propio" on public.entregas
  for insert to authenticated
  with check (
    alumno_id = auth.uid()
    and public.archivo_url_pertenece_alumno(archivo_url)
    and exists (
      select 1 from public.lecciones l
      where l.id = leccion_id and public.tiene_acceso_programa(l.programa_id)
    )
  );

drop policy if exists "entregas_update_propio" on public.entregas;
create policy "entregas_update_propio" on public.entregas
  for update to authenticated
  using (alumno_id = auth.uid())
  with check (
    alumno_id = auth.uid()
    and public.archivo_url_pertenece_alumno(archivo_url)
    and exists (
      select 1 from public.lecciones l
      where l.id = leccion_id and public.tiene_acceso_programa(l.programa_id)
    )
  );

drop policy if exists "progreso_write_propio" on public.progreso_lecciones;
create policy "progreso_write_propio" on public.progreso_lecciones
  for all to authenticated
  using (alumno_id = auth.uid())
  with check (
    alumno_id = auth.uid()
    and exists (
      select 1 from public.lecciones l
      where l.id = leccion_id and public.tiene_acceso_programa(l.programa_id)
    )
  );

-- ----------------------------------------------------------------------------
-- 3) Tope de tamaño en el bucket 'entregas'
-- ----------------------------------------------------------------------------
-- El gestor del psicólogo ya validaba 500 MB por archivo; la subida del alumno no
-- validaba nada, ni en la action ni en la policy. La app ahora corta en 100 MB
-- (TAMANO_MAXIMO_ENTREGA_BYTES en src/app/alumno/actions.ts), pero eso es una cota
-- blanda: el tamaño lo declara el cliente. Esto es el techo duro del lado de Supabase.
--
-- PENDIENTE: para las entregas nuevas, que van a Cloudflare R2 y no a este bucket, el
-- equivalente hay que ponerlo del lado de R2 — no se hereda de acá. Mientras tanto, el
-- único tope de una entrega a R2 es TAMANO_MAXIMO_ENTREGA_BYTES en la action, que es una
-- cota blanda (el tamaño lo declara el cliente).

update storage.buckets
set file_size_limit = 104857600 -- 100 MB, espeja TAMANO_MAXIMO_ENTREGA_BYTES
where id = 'entregas';

-- ----------------------------------------------------------------------------
-- 4) ebooks: `anon` deja de ver archivo_key
-- ----------------------------------------------------------------------------
-- Verificado contra producción el 2026-08-05: un GET a
--   /rest/v1/ebooks?select=slug,titulo,estado,archivo_key
-- con la anon key (que viaja en el bundle del navegador, o sea que la tiene
-- cualquiera) devolvía la key de R2 del PDF pagado. No da acceso al archivo —R2 es
-- privado y hace falta una URL firmada— pero filtra el nombre real del PDF y la
-- estructura interna del bucket a quien todavía no compró.
--
-- El grant de la migración 2026-08-04b era sobre toda la tabla; la vidriera sólo
-- necesita seis columnas (ver los select de app/ebooks/page.tsx y [slug]/page.tsx),
-- más `estado` y `created_at` que se usan en el filtro y el orden. Un grant por
-- columna es lo que RLS no puede expresar: las policies filtran filas, no columnas.

revoke select on public.ebooks from anon;

grant select (id, slug, titulo, descripcion, portada_key, precio_centavos, moneda, estado, created_at)
  on public.ebooks to anon;

commit;

-- ----------------------------------------------------------------------------
-- 5) LO QUE NO SE ARREGLA CON SQL — hay que tocarlo en el dashboard
-- ----------------------------------------------------------------------------
-- Ambos verificados contra producción el 2026-08-05 con la anon key.
--
-- a) REGISTRO PÚBLICO ABIERTO (el hallazgo más grave de la auditoría).
--    Authentication → Sign In / Providers → "Allow new users to sign up" = OFF.
--    Comprobado: POST /auth/v1/signup con la anon key llega a validar el email, o
--    sea que con un email válido habría creado la cuenta. El chequeo de compra
--    pagada de crearCuentaComprador() no lo cubre: ese endpoint no pasa por ahí.
--    El código ya no necesita signUp() (usa admin.createUser), así que apagarlo no
--    rompe ni el alta por compra ni la invitación del psicólogo.
--
-- b) POLÍTICA DE CONTRASEÑA MÁS FLOJA QUE LA UI.
--    Authentication → Policies → Minimum password length = 12
--                              → Password requirements = lower/upper/digits/symbols
--    Comprobado: "abcdef" (6 caracteres, sin mayúscula, número ni símbolo) pasa la
--    validación del servidor. supabase/config.toml ya declara 12 + complejidad, pero
--    ese archivo sólo configura el stack local — producción quedó en el default de 6
--    sin requisitos. Las dos pantallas (/configurar-password y /crear-cuenta) validan
--    12 + complejidad en el cliente, así que hoy esa política es cosmética:
--    ConfigurarPasswordClient llama a supabase.auth.updateUser() desde el navegador,
--    y una llamada directa a ese mismo endpoint con "123456" la acepta el servidor.
