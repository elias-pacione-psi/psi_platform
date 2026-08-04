<!-- BEGIN:nextjs-agent-rules -->
# This is NOT the Next.js you know

This version has breaking changes — APIs, conventions, and file structure may all differ from your training data. Read the relevant guide in `node_modules/next/dist/docs/` before writing any code. Heed deprecation notices.
<!-- END:nextjs-agent-rules -->

# Plataforma de Cursos (Psicología) — reglas del proyecto

- Es una **plataforma de cursos/LMS**: un psicólogo (rol `psicologo`) dicta formaciones a **alumnos** (rol `alumno`). Jerarquía: `programas` (curso) → `modulos` → `lecciones`. Alumnos organizados en `cohortes`.
- **Regla legal (Ley 25.326)**: el modelo del alumno = cuenta + contenido asignado + agenda + progreso EDUCATIVO (lección completada, intento de quiz, entrega). Prohibido agregar campos de diagnóstico, motivo de consulta o notas clínicas. Aunque los cursos enseñen sobre escalas clínicas (PHQ-9/GAD-7), NO implementarlas como instrumentos: son materia, no funciones.
- Progreso/evaluación permitidos SOLO en clave educativa (lección vista, quiz de comprensión con umbral 70%, entrega de trabajo con devolución pedagógica).
- Auth: rol en `alumnos.rol`, nunca en metadata de auth. Server actions siempre con `requireUser()`/`requirePsicologo()` de `src/utils/supabase/guards.ts`. `createAdminClient()` (service-role) solo cuando hay que saltar RLS explícitamente (invitar, inscribir, banear, borrar, corregir quiz).
- RLS es la capa real (ver `supabase/schema.sql`). Tabla nueva: RLS habilitado desde el día uno, policies con scope (`auth.uid()`, `es_psicologo()`, `tiene_acceso_programa()`), nunca `qual = true`.
- Quiz: `quiz_preguntas` tiene `respuesta_correcta` y es de acceso solo-instructor por RLS. El alumno recibe preguntas sin respuesta y la corrección es server-side vía `src/utils/supabase/quiz.ts` (service-role). Nunca mandar la respuesta correcta al navegador antes del envío.
- Storage: **Cloudflare R2 es el default** para material nuevo (lecciones, biblioteca y entregas de alumnos) — código en `src/utils/r2/`. Drive/Dropbox/bucket privado de Supabase (`materiales`/`entregas`, carpeta `{uid}/…`) quedan como alternativas en el selector, no eliminar esas opciones. Todo se sirve con URLs firmadas vía `firmarUrlsRecursos` / `firmarUrlEntrega` en RSC, que ya distinguen el backend por el path.
- Validar `url_recurso`/enlaces (https + host del proveedor) antes de guardar — terminan en iframes/embeds.
- Prohibido reintroducir: chat/tutor IA, escalas clínicas como instrumento.
- **Registro público (decisión del 2026-08-04, ver `docs/plan-modelo-comercial.md`)**: dejó de estar prohibido en general, pero sigue acotado. Solo existe como consecuencia de comprar un ebook — la cuenta se ofrece recién después del pago, atada al email que pagó (fase 5 del plan). Sigue prohibido un link abierto de "creá tu cuenta" que dé de alta alumnos sin pasar por una compra o por la invitación del psicólogo: eso seguiría siendo el registro público de LMS que la regla original quería evitar. Cursos, formaciones, supervisiones y terapia individual NO se compran online — el psicólogo los sigue asignando a mano tras la consulta.
- **Bitácora de sesiones**: cuando Lucas indique que la sesión/conversación terminó (o se va a cerrar), agregar una entrada nueva arriba de todo en `BITACORA.md` con lo importante que se trabajó — qué se hizo, decisiones tomadas, qué quedó pendiente y de quién. Sin esto, la sesión siguiente arranca sin contexto de lo que se decidió acá. No hace falta que Lucas lo pida cada vez: es un hábito de cierre de sesión, como correr los checks antes de terminar.
