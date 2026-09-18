# Bitácora de sesiones

Resumen de lo importante trabajado en cada sesión de Claude Code sobre este
proyecto. Se agrega una entrada nueva cuando Lucas indica que la sesión
terminó (ver instrucción en `AGENTS.md`) — más reciente arriba. El objetivo es
que una sesión nueva pueda entender el estado y las decisiones tomadas sin
tener que releer toda la conversación anterior.

## 2026-09-18

**El video de cursos salió a producción: reemplaza el hero de `/cursos` en R2. Antes se
retocó el guion y se arregló la voz robotizada.**

- **Guion final** (`gen_voz.py`, variable `GUION`): S1 "…te anotaste en un curso…",
  S2 "contenido ya grabado", S4 "¿Tenés la agenda apretada? / ¿Te gusta aprender a tu
  manera, sin que nadie te apure? / Este formato fue pensado para eso.", S5 "y empezá
  cuando estés listo." Se sacó de S4 la idea de "sin la dinámica de un grupo" (sonaba a
  que el curso es para quien no quiere gente cerca) y de S5 el "vos" final repetido.
- **Voz v3 — por qué sonaba robotizada**: la v2 partía cada escena en muchas frases
  cortas y en la escena 2 llegaba a sintetizar "videos," / "lecturas," / "ejercicios,"
  como tres audios de UNA palabra cada uno. Un modelo neural sintetizando una palabra
  aislada pierde la prosodia de frase, y cada empalme por `ffmpeg concat` es un corte
  duro. La v3 sintetiza cada escena en **dos tramos**: el cuerpo entero en una sola
  llamada (el modelo maneja su propia entonación) + el remate lento/grave aparte.
- **`WordBoundary` SÍ funciona** en `edge-tts` 7.2.8, al contrario de lo que decía la
  entrada del 2026-09-16 ("edge-tts ya no emite WordBoundary"). `gen_voz.py` ahora pide
  `boundary="WordBoundary"` y lee los timestamps REALES de videos/lecturas/ejercicios
  dentro de la oración completa, en vez de estimarlos por duración de clips sueltos.
  `gen_boundaries.py` ya no hace falta.
- **Trampa que casi se publica**: el MP4 que estaba en `~/lucas-bucket/` (y que se
  subió primero a R2) era un render de las 11:23, ANTERIOR al arreglo de voz de las
  11:35 — o sea, tenía el audio robotizado. Se detectó por la duración (39,50 s del
  timeline viejo vs 39,45 s del nuevo). **Tocar `gen_voz.py` obliga a re-correr todo**:
  `timeline.mjs --write` → `mezclar-audio.mjs` → `render.mjs` → `armar.sh`.
- **Otra trampa del render**: `frames/` NO se limpia entre renders. El render nuevo
  escribió 1183 frames pero quedaban `f_001184/85.png` del anterior, y `armar.sh` los
  habría tragado porque ffmpeg lee el patrón `f_%06d.png` hasta el primer hueco. Hay que
  borrar las sobras (o limpiar la carpeta) cuando la duración se acorta.
- **Publicación**: `Biblioteca R2/Videos/Videos Main Principal/Cursos asincronicos.mp4`
  reemplazado vía API S3 (`PutObjectCommand` + verificación con `HeadObjectCommand`), NO
  por el mount de rclone — que sube async y no garantiza el reemplazo. Final: 39,43 s,
  3,39 MB, h264/aac. El video anterior (18 MB, foto realista con IA) quedó respaldado en
  `~/lucas-bucket/respaldos/Cursos asincronicos (respaldo 2026-09-18).mp4`, MD5 verificado
  contra el ETag que tenía en R2.
- **Poster regenerado**: `public/hero-cursos-poster.jpg` era un frame del video viejo
  (foto de alguien tecleando) y no pegaba con el nuevo estilo ilustrado. Ahora es el
  frame t=0 del video nuevo, recortado a 4:3 960×720 — el contenedor del hero es
  `aspect-[4/3]` con `object-cover` sobre un video 16:9, así que recorta ~12,5 % de cada
  lado; se verificó que no se come nada del contenido.
- **Verificado en el navegador**: `/cursos` carga el video con `readyState 4`, sin error,
  duración 39,43 s y sin errores de consola.
- **Pendiente**: el `curso-asincronico-9x16.mp4` (Reels/TikTok) sigue con el audio v2
  viejo — si se va a publicar, re-renderizar con `node src/render.mjs --aspect=tall` y
  `./armar.sh frames9 out/curso-asincronico-9x16.mp4`. Y queda por validar de oído si la
  voz v3 convence o si conviene grabar a Elias.

## 2026-09-16

**Video "qué es un curso asincrónico" (~40 s) para redes/landing — producido de punta a
punta como motion graphics programático, en `marketing/curso-asincronico/`.**

- **Qué se entregó**: `out/curso-asincronico-16x9.mp4` (1920×1080, landing/YouTube) y
  `out/curso-asincronico-9x16.mp4` (1080×1920, Reels/TikTok/Stories). 40.27 s, 30 fps,
  h264+aac, ~3.3 MB, -15.1 LUFS integrados. Las 5 escenas del brief de Lucas, con la
  paleta y el trazo del sitio, Poppins/Lora reales y el isotipo real de
  `public/brand/mark.png` en el cierre.
- **Cómo se hizo (stack)**: ilustraciones SVG por código en el MISMO idioma visual de
  `generar-ilustraciones.mjs` (trazo tinta 8-10, personas sin cara, planta/taza/libro),
  animadas frame a frame en JS y rasterizadas con `@resvg/resvg-js` (sin navegador);
  voz en off con edge-tts (`es-AR-TomasNeural`, rate -2% — rioplatense genuino pero se
  nota TTS); música ambient sintetizada con numpy (pad Cmaj7-Am7-Fmaj7-G6 + punteos
  Karplus-Strong); ensamblado con ffmpeg. Sin servicios de IA de video ni stock.
- **Línea de tiempo por audio, no por brief**: las duraciones de escena se calculan de
  los mp3 medidos (`src/timeline.mjs`: leadIn/tail por escena, total 40.26 s). Los chips
  "Videos/Lecturas/Ejercicios" de la escena 2 aparecen en sincronía con la voz: edge-tts
  ya no emite WordBoundary, así que `gen_boundaries.py` sintetiza la escena 2 en tres
  frases medidas y estima el offset de cada palabra.
- **Para re-render o retocar**: `cd marketing/curso-asincronico` → `./venv/bin/python
  gen_voz.py` (+ `gen_boundaries.py`), `node src/timeline.mjs --write`,
  `node src/mezclar-audio.mjs`, `node src/render.mjs --aspect=wide|tall`,
  `./armar.sh frames|frames9 out/<nombre>.mp4`. Frames sueltos para iterar diseño:
  `node src/render.mjs --probe=<t1,t2,...> [--aspect=tall]`. Frames/audio/MP4 no se
  versionan (`.gitignore`), igual que `.ilustraciones/`: el código es la fuente.
- **Pendiente de Lucas**: ver los dos MP4 y decidir si la voz TTS alcanza o si graba la
  voz real de Elias (basta reemplazar `audio/voz/escena*.mp3` y correr timeline + mezcla
  + armar, sin tocar el video); subir los archivos a donde se publiquen (no se subieron a
  R2 ni a redes). Si cambia el guion: editar `gen_voz.py` y repetir el pipeline.

**Revisión de audio (mismo día, pedido de Lucas: la v1 sonaba robotizada).**

- Causa: la v1 mandaba el párrafo entero de una a edge-tts → ritmo metronómico, pausas
  y pitch planos. La v2 de `gen_voz.py` sintetiza **frase por frase** con prosodia
  individual (remates de oración más lentos y graves, listas más ágiles) y pausas
  diseñadas entre frases; cada frase se limpia de silencios de borde y se rellena con la
  pausa exacta, así que los boundaries de los chips salen de tiempos reales medidos, no
  de estimación. `gen_voz_una.py` y `gen_boundaries.py` quedaron absorbidos y borrados.
- Mezcla: compresor suave + highpass sobre la voz antes del loudnorm
  (`src/mezclar-audio.mjs`). Duración final 39.07 s. Se re-renderizaron los dos MP4
  (la línea de tiempo cambió: aires leadIn/tail más generosos en `src/timeline.mjs`).
- Si sigue sin convencer la voz, el salto real es grabar a Elias (o ElevenLabs con API
  key): el pipeline acepta reemplazar `audio/voz/escena*.mp3` sin tocar el video.

**Cambios de guion (mismo día, Lucas editó `gen_voz.py` a mano y se re-corrió todo).**

- Guion final: S1 "...te anotaste en un curso...", S2 "contenido ya grabado", S4 "¿Tenés
  la agenda apretada? / ¿Te gusta aprender a tu manera, sin que nadie te apure? / Este
  formato fue pensado para eso.", S5 "y empezá cuando estés listo." Solo voz: el texto
  en pantalla no se tocó y las frases "videos/lecturas/ejercicios" quedaron intactas, así
  que la sincronía de los chips siguió funcionando sin cambios de código.
- Pipeline completo re-ejecutado (voz → timeline → mezcla → 1185 frames ×2 → MP4):
  duración final **39.50 s**. Los MP4 definitivos quedaron copiados en `~/lucas-bucket/`
  (reemplazando a los anteriores) además de en `marketing/curso-asincronico/out/`.

## 2026-09-05

**Biblioteca rota: causa raíz y arreglo (venía a medias de una sesión de qwen).**

- **Por qué dejó de andar**: la carpeta espejo era `Libros/` y la sincronización publicaba
  *solo los PDF sueltos en la raíz* (`listarKeysRecursivo(prefijo, true)`, con Delimiter).
  Cuando los 13 PDF se ordenaron dentro de `Libros/Libros Asigacion/`, el listado dejó de
  verlos y la Biblioteca quedó vacía. **Daño colateral que nadie había notado**: los 7
  ebooks apuntaban a `r2key://Libros/<archivo>.pdf` (raíz) y esos objetos ya no existían —
  las portadas y los PDF de los ebooks *vendidos* estaban rotos.
- **Lo que ya había hecho qwen** (sin terminar): renombró el prefijo a `Biblioteca R2/`,
  pasó la sincronización a recursiva (publica a cualquier profundidad, por extensión),
  agregó la carpeta fija "Herramientas de Terapia" y sacó las validaciones de subida que
  ya no aplican. **Faltaba todo lo demás**: el bucket seguía con las dos carpetas, la base
  seguía apuntando a `Libros/`, y quedaban copys/comentarios viejos.
- **Bucket** (`plataforma-archivos-psi`): se movió todo a `Biblioteca R2/` — los 13 PDF a
  `Biblioteca R2/Libros/`, `portadas/` y `fuente/` colgando de la raíz de la carpeta
  espejo — y se borró `Libros/` entera. También se borró `Biblioteca R2/Lecturas/` (vacía,
  era el concepto duplicado del esquema viejo de secciones). Método: copy → `rclone check`
  (21/21 idénticos) → delete, nunca move a ciegas.
- **Base**: 15 referencias reescritas (7 `ebooks.archivo_key`, 7 `ebooks.portada_key`,
  1 `biblioteca_recursos.url_recurso`), validando contra el bucket que la key destino
  existiera antes de escribir. Las 59 lecciones de `Formaciones/` no se tocaron.
- **Carpetas fijas de `Biblioteca R2/` ahora**: Libros, Audios, Videos, Herramientas de
  Terapia, Otros. Se publica por extensión (pdf/audio/video) a cualquier profundidad;
  `portadas/` (png) y `fuente/` (docx) quedan guardadas sin publicar, como insumos.
- Verificado con el módulo real (`seccionBibliotecaR2`) contra bucket + base: la próxima
  sincronización **agrega 13, quita 0** y no toca las 2 filas cargadas a mano.

**Módulo Pacientes nuevo.**

- Decisión: **no es una tabla nueva**, es `alumnos.rol = 'paciente'`. Así se reusa tal cual
  la invitación por email, el ban al suspender, `agenda_sesiones` y `recursos_asignados`.
  Un paciente es "un alumno sin cursos": cuenta + agenda + material puntual. **Cero campos
  clínicos** (Ley 25.326) — el rol dice a quién se le agenda una sesión, no qué le pasa.
- `/psicologo/pacientes`: lista con Activos/Suspendidos/Historial, próxima sesión y
  cantidad de material; crear/invitar; editar contacto; **"Entregar material"** (diálogo
  con todo lo de Biblioteca, marca y guarda → cae en `recursos_asignados` y aparece en la
  Biblioteca del paciente). Suspender/archivar/borrar reusan las actions de Alumnos.
- El helper de invitación salió de `psicologo/actions.ts` a `utils/supabase/invitaciones.ts`
  **a propósito**: exportarlo desde un archivo `'use server'` lo habría convertido en un
  endpoint RPC que acepta el rol por parámetro desde el navegador.
- Integrado en: sidebar del psicólogo, selector de destino de Agenda (grupo "Pacientes"),
  y "Gestionar accesos" de Biblioteca (con chip "Paciente" para distinguir homónimos).
  Del lado del paciente: menú reducido (Inicio / Biblioteca / Mi agenda) y `/alumno`
  sin programas ni recomendación de cursos.
- **Emails**: individual (alumno o paciente) ahora dice "sesión" y grupal dice "clase", que
  es lo que ya hacía el asunto del recordatorio diario. De paso se arregló un plural roto
  que generaba "2 clase virtuals".

**Corrección del mismo día — alumno y paciente dejan de ser excluyentes.**

Lucas corrió el primer snippet y ahí planteó el requisito real: *"quiero que el usuario se
anote como siempre y el psicólogo pueda elegir si lo asigna como Paciente o como Alumno (o
ambas de ser necesario)"*. Eso no entraba en el diseño de arriba, porque `rol` estaba
haciendo dos trabajos a la vez: rol de seguridad (`es_psicologo()` cuelga de ahí) y etiqueta
de qué es la persona. Se separaron:

- `rol` vuelve a `('alumno','psicologo')` — sólo seguridad.
- `es_alumno` / `es_paciente`: dos booleanos independientes. Para la RLS los dos vínculos
  son idénticos (cada uno ve lo suyo), así que la distinción es puramente organizativa y no
  tenía por qué vivir en una columna de un solo valor.
- **El alta pasa a ser por el formulario público**: la persona llena Consultas → cae en
  Solicitudes → al aprobar, el psicólogo tilda Alumno / Paciente / los dos. El diálogo
  pre-marca según el `interes` que eligió la persona (`terapia_individual` → Paciente, el
  resto → Alumno), pero decide el psicólogo. El alta manual de las dos listas se mantiene y
  también elige el vínculo.
- Se puede cambiar después: "Marcar también como paciente" desde la ficha en Alumnos y su
  espejo en Pacientes (`cambiarVinculo`). Desmarcar NO borra nada — saca de la lista, nada
  más; para dar de baja están suspender/archivar.
- Quien es las dos cosas aparece en las dos listas con un chip, ve el menú completo de
  alumno (el de paciente le escondería sus programas), y en el selector de Agenda aparece
  una sola vez, en Pacientes, con "· también alumno" (dos entradas con el mismo `alumno_id`
  romperían el Select).
- El psicólogo queda con los dos flags en false: antes aparecía en su propia lista de
  Alumnos, porque esa query no filtraba por rol.

**Pendiente de Lucas (bloquea el merge, no sólo la feature):** correr
`supabase/snippets/2026-09-05b-alumno-y-paciente-no-excluyentes.sql`. Las listas de Alumnos
y Pacientes ahora filtran por `es_alumno`/`es_paciente`, así que **hasta que esas columnas
existan, la página de Alumnos muestra el cartel de error**. El snippet hace el backfill
desde el rol viejo, así que es seguro correrlo sobre lo que ya está. El conector MCP sigue
apuntando a otra cuenta, por eso no se pudo aplicar desde acá.
`2026-09-05-rol-paciente.sql` quedó marcado como reemplazado (no correrlo de nuevo).

**No verificado en navegador**: el panel del psicólogo requiere login con contraseña, que
Claude no hace. Se verificó en cambio: `lint`/`tsc`/`next build` limpios (los 35 errores de
lint son los preexistentes de `scripts/curso-pastoral/*.js` y los 4 `any` de
`alumnos/page.tsx`), el guard de `/psicologo/pacientes` redirige a `/login`, y las queries
nuevas corridas contra la base real.

---

## 2026-08-09

**Botón y Sección "Psicología y Fe":**
- Se agregó la nueva propuesta de **Psicología y Fe** (psicología aplicada para la comunidad cristiana) en la plataforma.
- **Navegación**: Nuevo botón en la barra superior en `SiteHeader.tsx`.
- **Página dedicada**: Creada en `src/app/psicologia-y-fe/page.tsx` con sus 3 modalidades (charlas presenciales, consultas pastorales, supervisión a psicólogos cristianos).
- **Formulario de Consultas y Backend**: Agregada la opción `psicologia_fe` en `LandingClient.tsx`, `taxonomia-labels.ts`, la Server Action `actions.ts` y el snippet SQL `2026-08-09-agregar-interes-psicologia-fe.sql`.
- **Middleware**: Incorporado `'/psicologia-y-fe'` a la lista `publicRoutes` en `src/utils/supabase/middleware.ts` para permitir el acceso público sin requerir inicio de sesión.

---

## 2026-08-08

**Mejoras en UI del alumno y biblioteca:**
- Se forzó el uso del visor seguro (`PdfViewerSeguro`) en la sección **Biblioteca** para todo archivo que sea un PDF directo (sin importar su procedencia histórica como `drive_pdf`, mientras no sea un sandbox preview). Esto oculta el visor nativo del navegador que permitía descargas e impresiones, alineándose con el objetivo de evitar el robo de material.
- Rediseño de la tarjeta **"Tu clase en vivo"** en el inicio del alumno (`/alumno`), imitando un diseño similar al de *Think Like a Native* (fondo oscuro `bg-noche`/`bg-slate-800`, resaltado de fecha y botón rojo completo).
- Se agregó el campo `enlace` a la query de agenda_sesiones para darle prioridad sobre el link de perfil del alumno, y se implementó un fallback en el botón para que el usuario Psicólogo que pruebe la "Vista previa" siempre vea el botón renderizado (incluso si no tiene enlace en su tabla).

**Emails / Notificaciones (Revisión):**
- Se confirmó el funcionamiento del sistema dual de emails: creación de usuarios la hace Supabase Auth admin (que dispara los webhooks / envíos predeterminados, atrapables en Inbucket en local o directo en la nube), mientras que la gestión de sesiones/notificaciones usa Resend con las plantillas locales (con la API key configurada en `.env.local`).

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
