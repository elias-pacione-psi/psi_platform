# Bitácora de sesiones

Resumen de lo importante trabajado en cada sesión de Claude Code sobre este
proyecto. Se agrega una entrada nueva cuando Lucas indica que la sesión
terminó (ver instrucción en `AGENTS.md`) — más reciente arriba. El objetivo es
que una sesión nueva pueda entender el estado y las decisiones tomadas sin
tener que releer toda la conversación anterior.

---

## 2026-08-02

**Auditoría completa de funcionalidades y seguridad (a pedido de Lucas, "se agregaron muchas funciones últimamente"):**

Se revisó a fondo: `schema.sql`/RLS completo, todas las server actions (`alumno/actions.ts`, `psicologo/actions.ts`, `psicologo/archivos/actions.ts` — gestor de R2, `login/actions.ts`, `recuperar-contrasena/actions.ts`, `calendarActions.ts`), el flujo de quiz end-to-end, los guards (`guards.ts`/`admin.ts`), la firma de URLs (`recursos.ts`/`r2.ts`), validación de URLs externas e iframes (`DriveIframe.tsx`, `psicologo/actions.ts`), y los cambios sin commitear. Lint, `tsc --noEmit` y `next build` corren limpios (solo 4 errores preexistentes de `no-explicit-any` en `psicologo/alumnos/page.tsx:51-67`, no introducidos ahora).

**Hallazgo crítico — nuevo formulario público de contacto viola la regla de datos clínicos:**
Hay cambios sin commitear que agregan una sección "Consultas y Turnos" a la landing (`src/app/LandingClient.tsx`, `src/app/actions.ts` nuevos) con un textarea etiquetado **"Tus Objetivos o Motivo de Consulta"**, visible y enviable por cualquier visitante no autenticado de internet. Esto es exactamente lo que `AGENTS.md` prohíbe explícitamente: *"Prohibido agregar campos de diagnóstico, motivo de consulta o notas clínicas"*. Es un dato de salud sensible (Ley 25.326) recolectado pre-consentimiento, sin aviso de privacidad enlazado en el propio formulario. Recomendación: sacar el campo (o reemplazarlo por algo neutro tipo "¿cómo nos encontraste?"), o si se necesita, tratarlo como dato sensible (consentimiento explícito, acceso restringido, retención corta).

**Hallazgo crítico — tabla nueva `solicitudes_registro` no está en `schema.sql`, estado de RLS sin confirmar:**
Esa tabla (donde cae el formulario de arriba) no existe en ningún archivo del repo — se creó por fuera del flujo de migraciones documentado, rompiendo la regla propia del proyecto de "RLS habilitada desde el día uno". Confirmé con un curl directo contra la REST API que el rol `anon` NO tiene grants sobre la tabla (bien, error 42501 igual que el resto del esquema). NO pude confirmar el estado para el rol `authenticated` — el conector de Supabase MCP de esta sesión apunta a otra cuenta/proyecto (no el `urevyngawcybyrfvahgk` de este repo), y evité a propósito crear una cuenta de alumno de prueba para forjar una sesión real (fuera de las acciones que puedo tomar sin confirmación explícita). Como `schema.sql` deja `ALTER DEFAULT PRIVILEGES ... GRANT ALL ON TABLES TO authenticated` corriendo para toda tabla futura, si nadie habilitó RLS a mano en esta tabla, **cualquier alumno logueado podría leer todas las solicitudes de contacto** (incluido el motivo de consulta) llamando directo al cliente de Supabase desde el navegador, sin pasar por la app.
Acción pendiente para Lucas: correr en el SQL Editor de Supabase `select relrowsecurity from pg_class where relname = 'solicitudes_registro';` — si da `false`, correr `alter table public.solicitudes_registro enable row level security;` (sin policies para `authenticated`, ya que solo se lee con `createAdminClient()`) y sumar la tabla a `schema.sql` para que quede versionada.

**Hallazgo medio — RLS de `entregas`/`quiz_intentos` confía en la capa de aplicación, no en la policy:**
La policy `entregas_insert_propio` solo exige `alumno_id = auth.uid()`, no valida `archivo_url`. La validación real (`perteneceAlAlumno()` en `alumno/actions.ts`, con un comentario que ya reconoce el riesgo: *"sin este chequeo, un alumno podría registrar como propia la key de otro"*) vive solo en la server action, no en la DB — un alumno que llame a la API de Supabase directo con su propia sesión podría saltearla. Explotabilidad baja en la práctica (la key de R2 incluye un sufijo aleatorio de 8 hex que nunca se expone a otros alumnos), pero contradice el principio del propio `AGENTS.md` ("RLS es la capa real"). Mismo patrón en `quiz_intentos_insert_propio`: nada impide insertar un resultado con `aprobado: true` sin pasar por `corregirQuiz`. Sugerido: mirrorear en la policy de tabla lo que ya hace la policy de `storage.objects` para el bucket 'entregas' (exige que el primer segmento del path sea el uid).

**Hallazgo menor:** `marcarLeccionCompletada` (`alumno/actions.ts`) no llama a `tieneAcceso()` a diferencia de sus hermanas `responderQuiz`/`registrarEntrega` — un alumno podría marcar como completada una lección de un programa al que no está asignado (no expone contenido, solo ensucia el progreso reportado al psicólogo).

**Lo que está bien (para no perder de vista en el ruido):** RLS del resto del esquema sólida y con scope real (funciones `security definer` para evitar recursión, nunca `qual = true`), guards `requireUser`/`requirePsicologo` aplicados consistentemente en todas las actions revisadas, validación de URLs externas (https + allowlist de host por proveedor) prolija y bien documentada, gestor de archivos R2 (`psicologo/archivos/actions.ts`) valida traversal/extensión/Content-Type en todos lados, flujo de quiz nunca expone `respuesta_correcta` antes del envío y re-valida acceso al programa server-side.

**Actualización — misma sesión, Lucas siguió despierto y pidió corregir:** el formulario público queda tal cual (Lucas: "el psicólogo necesita un formulario... sino es imposible" — es una necesidad real del negocio, no se toca el campo de motivo de consulta). Se corrigieron los hallazgos #2, #3 y #4:
- **Código aplicado** (`src/app/alumno/actions.ts`): `marcarLeccionCompletada` ahora llama `tieneAcceso()` igual que sus hermanas; `responderQuiz` inserta `quiz_intentos` con `createAdminClient()` en vez del cliente del usuario.
- **`schema.sql` actualizado** con los 3 fixes de RLS (RLS en `solicitudes_registro`, `with check` de `archivo_url_pertenece_alumno()` en las policies de `entregas`, y se sacó `quiz_intentos_insert_propio` ya que el insert pasó a service-role) — documentado y versionado.
- **No se pudo aplicar el DDL contra producción en esta sesión**: el conector Supabase MCP apunta a otra cuenta (ni `ypqkybfcibmtftngozqb` ni `vjylkpucrrvouwblzsfg` son este proyecto, que es `urevyngawcybyrfvahgk`), `supabase link` da `LegacyLinkProjectStatusError` (la cuenta logueada en el CLI no tiene privilegios sobre este proyecto), y no hay `DATABASE_URL`/connection string en `.env.local` para psql directo. Evité a propósito crear una cuenta de alumno de prueba para forjar una sesión y confirmar el estado real de RLS.
- **Queda pendiente que Lucas corra el SQL a mano** en el SQL Editor de Supabase: bloque completo en `/tmp/claude-1000/.../scratchpad/fix-auditoria-2026-08-02.sql` de esa sesión (o copiarlo de los bloques agregados a `schema.sql`, son los mismos). Incluye 3 queries de verificación al final para confirmar que quedó bien aplicado.
- `tsc --noEmit`, `lint` y `next build` corren limpios después de los cambios de código (mismos 4 errores preexistentes de antes, sin warnings nuevos).

---

## 2026-07-31

**Seguridad — paridad con Think_Like_a_Native (proyecto hermano):**
- Se auditó todo el proyecto contra el LMS original y se portaron los fixes de seguridad que faltaban: `grant` a `anon` revocado en `schema.sql` (daba acceso de escritura/lectura a todas las tablas con la clave pública), `server-only` en `utils/supabase/admin.ts`, open-redirect corregido en `auth/confirm` (allowlist de destinos), política de contraseña alineada (12 caracteres + símbolos, antes 8 sin requisitos), `enable_signup` cerrado en `config.toml`, MFA TOTP habilitado para la cuenta del psicólogo, CSP completa en `next.config.ts` (antes no existía).
- Bug de sandbox en iframes: `DriveIframe.tsx` y los visores de biblioteca aplicaban `sandbox` sin condición a todo, lo cual rompe el visor nativo del navegador para archivos directos (Dropbox `dl.dropboxusercontent.com`, futuros R2). Ahora `esPaginaDePreviewSandboxeable()` en `lib/utils.ts` decide caso por caso.

**Cloudflare R2 como storage default:**
- A pedido de Lucas, todo material nuevo (lecciones + biblioteca) sube a R2 por default; Drive/Dropbox/Supabase Storage quedan como alternativas en el selector. Código completo en `utils/r2/` (cliente S3-compatible, URLs firmadas de lectura 1h y de subida 5min, borrado).
- Extendido a las entregas de alumnos también (antes solo materiales): `EntregaForm.tsx` sube a R2 con key `entregas/{uid}/...`; `firmarUrlEntrega()` distingue automáticamente path viejo (Supabase) de nuevo (R2) por el prefijo.
- **Pendiente de Lucas**: el bucket de R2 todavía no existe. Cuando lo cree (Cloudflare → R2 → crear bucket + API token con permisos Object Read & Write), pasar `CLOUDFLARE_R2_ACCOUNT_ID` / `ACCESS_KEY_ID` / `SECRET_ACCESS_KEY` / `BUCKET` para completar `.env.local` (placeholders ya en `.env.example`). Hasta entonces, elegir un tipo `r2_*` en el editor genera un error claro al subir (no rompe la app).

**Feature nueva — Tareas del alumno:**
- Columna `lecciones.fecha_limite` (solo relevante para tipo `entrega`), editable en el editor de lecciones.
- Página `/alumno/tareas`: agrega todas las lecciones tipo `entrega` de todos los programas asignados al alumno, cruzadas con su propia fila en `entregas`. Título tachado (`line-through`) si ya entregó/revisó; badge "Vencida" si pasó la fecha sin entregar. Cada tarjeta linkea a la lección real (no duplica el formulario de entrega). Ítem nuevo en el sidebar del alumno.
- Inspirado en el feature de tareas de Think_Like_a_Native, pero **sin** su tabla `tareas` separada — acá se arma agregando `lecciones`+`entregas` que ya existían, porque nuestro modelo es por cursos/cohortes, no 1-a-1.

**Modo oscuro:** agregado (theme-provider + ThemeToggle + tokens de color en globals.css), con el fix de contraste que ya había pisado Think_Like_a_Native (botones invisibles en oscuro).

**Entorno local:** Docker (moby-engine) instalado en el host; `supabase start` levanta Postgres/Auth/Storage local. El volumen de datos **no siempre persiste** entre reinicios de Docker — si el login de prueba falla, no es que la cuenta se haya perdido para siempre: regenerar con el service-role key (ver `TESTING.md` en la raíz del repo, con las credenciales autorizadas y el snippet de reset).

**Research de mercado:** ya existía un análisis de scraping de psimammoliti.com en `docs/research/psimammoliti/` (hecho por otra sesión, 2026-07-30) con ideas de producto priorizadas. Se revisó y quedó **pausado** — Lucas quiere retomarlo después. Top de la lista: duración de lección + vista de progreso agregado, liberación progresiva por día de cohorte, constancia de finalización.

**Branding:** la landing ahora dice "Elias Pacione | Psicología con sentido" (antes "Espacio Terapéutico" — cambiado en otra sesión, no en esta).

---
