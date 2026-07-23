# Plataforma Psicólogo

Plataforma autocontenida para que un psicólogo asigne material (videos, PDFs, audios, lecturas, ejercicios) a sus pacientes. Los pacientes **no se comunican por acá**: solo ven el contenido que se les asignó y su agenda de sesiones.

Derivada de la arquitectura de [Think_Like_a_Native](https://github.com/luqqas96/Think_Like_a_Native) (Next.js 16 + Supabase), sin el chat de IA ni ninguna funcionalidad que capture datos del paciente.

## Stack

- **Next.js 16** (App Router / RSC, middleware en `src/proxy.ts`)
- **React 19** + **Tailwind 4** + **shadcn** (`base-nova`)
- **Supabase**: Auth + Postgres (con RLS) + Storage (bucket privado)
- **zod** para validación en server actions
- Deploy pensado para **Vercel**

## Qué hace

**Panel del psicólogo** (`/psicologo`, rol `psicologo`):
- Pacientes: crear e invitar por email (flujo `inviteUserByEmail` → `/configurar-password`), editar contacto, suspender/archivar (con ban de Auth), eliminar definitivamente.
- Programas: carpetas temáticas → unidades → actividades (video/PDF/audio/imagen/texto/enlace), asignables por paciente.
- Biblioteca: recursos sueltos con asignación estricta por paciente.
- Agenda: sesiones únicas o recurrentes; link de videollamada por paciente.
- Carga de contenido: enlaces (Drive/Dropbox/URL) o **subida de archivos** al bucket privado `materiales`.

**Portal del paciente** (`/paciente`, rol `paciente` — solo lectura):
- Ve únicamente sus programas y materiales asignados (garantizado por RLS, no solo por la app).
- Agenda con sus sesiones y botón para unirse a la videollamada.
- Ningún dato vuelve del paciente a la plataforma (sin progreso, sin entregas, sin notas).

## Regla de datos (Ley 25.326 — leer antes de tocar el esquema)

El modelo de datos del paciente se limita a **cuenta + contenido asignado + agenda**. No hay (ni deben agregarse) campos de diagnóstico, motivo de consulta ni notas clínicas: eso convertiría la base en un registro de **datos sensibles de salud**, con un régimen de compliance mucho más pesado. Si algún día se necesita, es una decisión de producto + legal, no un cambio técnico.

## Setup

### 1. Supabase

1. Crear un proyecto nuevo en [supabase.com](https://supabase.com).
2. Abrir **SQL Editor** y correr entero [`supabase/schema.sql`](supabase/schema.sql) (idempotente). Crea tablas, RLS, el trigger `handle_new_user` y el bucket privado `materiales` con sus policies.
3. Crear la cuenta del psicólogo: **Authentication → Add user** (email + contraseña), y después en SQL Editor:
   ```sql
   update public.pacientes set rol = 'psicologo' where email = 'EMAIL_DEL_PSICOLOGO';
   ```
4. En **Authentication → URL Configuration**, agregar a *Redirect URLs*:
   - `http://localhost:3000/auth/confirm`
   - `https://TU-DOMINIO/auth/confirm`

### 2. App

```bash
cp .env.example .env.local   # completar con las claves del proyecto
npm install
npm run dev
```

### 3. Vercel

Importar el repo y cargar las mismas variables de entorno (`NEXT_PUBLIC_SUPABASE_URL`, `NEXT_PUBLIC_SUPABASE_ANON_KEY`, `SUPABASE_SERVICE_ROLE_KEY`, `NEXT_PUBLIC_SITE_URL` con el dominio final).

## Arquitectura de seguridad

- **Middleware** `src/proxy.ts` → `updateSession()`: refresca sesión y redirige anónimos a `/login` (rutas públicas: `/`, `/login`, `/recuperar-contrasena`, `/auth/confirm`, `/configurar-password`).
- **Guards** `src/utils/supabase/guards.ts`: `requireUser()` / `requirePsicologo()` en cada server action. El rol vive en `pacientes.rol`, nunca en metadata de auth.
- **RLS como capa real**: el paciente solo lee filas propias (`auth.uid()`) o contenido asignado vía tablas puente; el psicólogo se identifica con la función `es_psicologo()` (security definer). Nunca policies `qual = true` sin scope.
- **Cliente admin** (`createAdminClient()`, service-role): solo en server actions donde el psicólogo gestiona datos de otro usuario (invitar, asignar, banear, borrar).
- **Storage privado**: el psicólogo sube directo desde el navegador (policies de Storage chequean `es_psicologo()`); el paciente recibe **URLs firmadas de 1 hora** generadas server-side (`src/utils/supabase/recursos.ts`) recién después de que RLS validó que ese contenido le pertenece.

## Branding

"Espacio Terapéutico" + ícono Sprout son **placeholders**. Para rebrandear: `src/components/BrandLogo.tsx`, `src/app/page.tsx` (landing), `src/app/layout.tsx` (metadata), títulos `metadata` de cada página y la paleta en `src/app/globals.css` (`--color-tinta`, `--color-marca`, `--color-crema`).
