<!-- BEGIN:nextjs-agent-rules -->
# This is NOT the Next.js you know

This version has breaking changes — APIs, conventions, and file structure may all differ from your training data. Read the relevant guide in `node_modules/next/dist/docs/` before writing any code. Heed deprecation notices.
<!-- END:nextjs-agent-rules -->

# Plataforma Psicólogo — reglas del proyecto

- Plataforma para que un psicólogo asigne material a pacientes. Los pacientes SOLO consumen contenido: no hay chat, no hay entregas, no hay ningún flujo donde el paciente escriba datos hacia la plataforma. No agregar features que rompan eso sin discutirlo antes.
- **Regla legal (Ley 25.326)**: el esquema del paciente se limita a cuenta + contenido asignado + agenda. Prohibido agregar campos de diagnóstico, motivo de consulta o notas clínicas — son "datos sensibles" y cambian el régimen de compliance. Es decisión de producto+legal, no técnica.
- Auth: rol en `pacientes.rol` (`'psicologo' | 'paciente'`), nunca en metadata de auth. Server actions siempre con `requireUser()`/`requirePsicologo()` de `src/utils/supabase/guards.ts`. `createAdminClient()` (service-role) solo cuando hay que saltar RLS explícitamente.
- RLS es la capa real de seguridad (ver `supabase/schema.sql`). Al crear una tabla nueva: RLS habilitado desde el día uno, policies con scope (`auth.uid()` o `es_psicologo()`), nunca `qual = true`.
- Storage: bucket `materiales` es PRIVADO. Los archivos se guardan por path en `url_recurso` (tipos `supabase_*`) y se sirven con URLs firmadas vía `firmarUrlsRecursos()` en RSC, después de que RLS filtró las filas.
- Prohibido reintroducir: chat/tutor IA, quiz o instrumentos de evaluación (PHQ-9/GAD-7 etc.), progreso del paciente, bitácora clínica, registro público de usuarios.
