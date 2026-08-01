# Plataforma de Cursos (Psicología)

Plataforma para que un psicólogo dicte **cursos / formaciones** a sus alumnos: contenido organizado en programas → módulos → lecciones (video, PDF, audio, texto, quiz, entrega de trabajos), cohortes (camadas), progreso, y agenda de sesiones (virtuales y presenciales).

Derivada de la arquitectura de [Think_Like_a_Native](https://github.com/luqqas96/Think_Like_a_Native) (Next.js 16 + Supabase), sin el chat de IA.

## Stack

- **Next.js 16** (App Router / RSC, middleware en `src/proxy.ts`)
- **React 19** + **Tailwind 4** + **shadcn** (`base-nova`)
- **Supabase**: Auth + Postgres (con RLS) + Storage (buckets privados)
- **zod** para validación en server actions
- Deploy pensado para **Vercel** (+ Cloudflare)

## Qué hace

**Panel del instructor** (`/psicologo`, rol `psicologo`):
- **Alumnos**: crear e invitar por email, editar, suspender/archivar (ban de Auth), eliminar.
- **Programas** (cursos): módulos y lecciones ordenables; tipos de lección video/PDF/audio/imagen/texto (Markdown), **quiz** (editor de preguntas) y **entrega** (consigna).
- **Cohortes**: camadas que cursan un programa; inscripción masiva de alumnos (les da acceso al contenido automáticamente).
- **Entregas**: bandeja de trabajos subidos por alumnos; descarga + devolución pedagógica + marcar revisado.
- **Biblioteca**: recursos sueltos con asignación por alumno.
- **Agenda**: sesiones individuales o **grupales por cohorte**, **virtuales** (con enlace) o **presenciales** (con lugar), únicas o recurrentes.

**Portal del alumno** (`/alumno`, rol `alumno`):
- Ve solo los programas asignados (vía cohorte o asignación directa; garantizado por RLS).
- **Progreso** del curso (barra + tildes de lección completada).
- **Quiz** autocorregido (aprobación ≥ 70%; la corrección es server-side, la respuesta correcta nunca viaja antes del envío).
- **Entrega** de trabajos (sube su archivo a un bucket privado; ve la devolución del instructor).
- Contenido de texto renderizado con **Markdown enriquecido** (tablas + cajas `[!DATO]`, `[!ERROR]`, `[!TIP]`, `[!NOTE]`…).
- Agenda con sus sesiones (individuales y de su cohorte).

## Regla de datos (Ley 25.326 — leer antes de tocar el esquema)

El modelo del alumno se limita a **cuenta + contenido asignado + agenda + progreso educativo** (lección completada, intento de quiz, entrega de trabajo). No hay (ni deben agregarse) campos de diagnóstico, motivo de consulta ni notas clínicas: eso convertiría la base en un registro de **datos sensibles de salud**, con compliance mucho más pesado. Aunque los cursos **enseñen** sobre escalas clínicas (PHQ-9/GAD-7), la plataforma **no las implementa** como instrumentos: son materia, no funciones.

## Setup

### 1. Supabase

1. Crear un proyecto nuevo en [supabase.com](https://supabase.com).
2. Abrir **SQL Editor** y correr entero [`supabase/schema.sql`](supabase/schema.sql) (idempotente). Crea tablas, RLS, trigger `handle_new_user`, helpers y los buckets privados `materiales` y `entregas` con sus policies.
3. Crear la cuenta del instructor: **Authentication → Add user** (email + contraseña), y después en SQL Editor:
   ```sql
   update public.alumnos set rol = 'psicologo' where email = 'EMAIL_DEL_INSTRUCTOR';
   ```
4. En **Authentication → URL Configuration**, agregar a *Redirect URLs*: `http://localhost:3000/auth/confirm` y `https://TU-DOMINIO/auth/confirm`.

### 2. App

```bash
cp .env.example .env.local   # completar con las claves del proyecto
npm install
npm run dev
```

### 3. Deploy

Importar el repo en Vercel y cargar las mismas variables de entorno (`NEXT_PUBLIC_SUPABASE_URL`, `NEXT_PUBLIC_SUPABASE_ANON_KEY`, `SUPABASE_SERVICE_ROLE_KEY`, `NEXT_PUBLIC_SITE_URL` con el dominio final).

## Modelo de datos

`alumnos` (rol psicologo/alumno) · `programas` → `modulos` → `lecciones` · `cohortes` + `cohortes_alumnos` · `programas_asignados` (acceso a contenido) · `progreso_lecciones` · `quiz_preguntas` + `quiz_intentos` · `entregas` · `biblioteca_recursos` + `recursos_asignados` · `agenda_sesiones` (individual/cohorte, virtual/presencial).

## Arquitectura de seguridad

- **Middleware** `src/proxy.ts` → `updateSession()`: refresca sesión y redirige anónimos a `/login` (rutas públicas: `/`, `/login`, `/recuperar-contrasena`, `/auth/confirm`, `/configurar-password`, `/privacidad`).
- **Guards** `src/utils/supabase/guards.ts`: `requireUser()` / `requirePsicologo()`. El rol vive en `alumnos.rol`, nunca en metadata de auth.
- **RLS como capa real**: el alumno solo lee lo propio (`auth.uid()`) o contenido asignado; el instructor se identifica con `es_psicologo()` (security definer). Acceso a contenido vía `tiene_acceso_programa()`. Nunca policies `qual = true` sin scope.
- **Quiz sin fugas**: `quiz_preguntas` (con la respuesta) es de acceso **solo instructor** por RLS; el alumno recibe las preguntas sin respuesta y la corrección ocurre server-side (`src/utils/supabase/quiz.ts`, service-role).
- **Storage privado**: bucket `materiales` (sube el instructor) y `entregas` (el alumno sube en su carpeta `{uid}/…`, forzado por RLS de Storage). Ambos se sirven con **URLs firmadas de 1 hora** generadas server-side (`src/utils/supabase/recursos.ts`).
- **Validación de URLs**: `url_recurso` y enlaces se validan https + host del proveedor antes de guardarse (evita inyección en iframes/embeds).

## Branding

Marca personal de Elias Pacione ("Psicología con sentido."), **Concepto 1 "La Escucha"** del brief — ver [`docs/marca/`](docs/marca/README.md) para el detalle y las decisiones de contraste. Isotipo `///P` extraído del PDF original en `src/components/BrandMark.tsx` (pintado con `mask-image` para heredar `currentColor`), tipografías Poppins + Lora en `src/app/layout.tsx`, y la paleta sage/crema en `src/app/globals.css` (`--color-tinta`, `--color-marca`, `--color-crema`, `--color-sage`, `--color-gris-calido`).
