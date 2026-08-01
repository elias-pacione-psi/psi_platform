# Bitácora de sesiones

Resumen de lo importante trabajado en cada sesión de Claude Code sobre este
proyecto. Se agrega una entrada nueva cuando Lucas indica que la sesión
terminó (ver instrucción en `AGENTS.md`) — más reciente arriba. El objetivo es
que una sesión nueva pueda entender el estado y las decisiones tomadas sin
tener que releer toda la conversación anterior.

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
