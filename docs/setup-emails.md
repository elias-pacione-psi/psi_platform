# Guía de Setup — Emails + Cron de Recordatorios

Dos sistemas separados que comparten el mismo proveedor (Resend) y la misma marca:

1. **Emails de Auth de Supabase** (invitación, recuperar contraseña) — van por el
   **Send Email Hook** (`supabase/functions/send-email`), que intercepta lo que Supabase
   manda por defecto y lo re-manda con nuestro template.
2. **Emails de la app** (asignación de programa, entrega revisada, clase agendada,
   recordatorio diario) — se mandan directo desde las server actions y desde el cron,
   vía `src/utils/email/resend.ts`.

Sin la Parte 1, un alumno invitado recibe el mail default de Supabase (sin marca, en
inglés). Sin la Parte 2, no pasa nada raro — esos mails simplemente no salen
(`enviarMail`/`enviarMailBatch` degradan solo con `RESEND_API_KEY` vacía).

---

## 1. Crear cuenta en Resend

1. Ir a [resend.com](https://resend.com) → **Sign up** (gratis, 100 mails/día, 3.000/mes)
2. Confirmar el email de Resend

---

## 2. Verificar el dominio en Resend (Cloudflare)

1. En Resend: **Domains** → **Add Domain**
2. Escribir: `eliaspacione.com`
3. Con Cloudflare como proveedor detectado, Resend ofrece el botón **Auto configure**:
   autoriza a Resend a escribir directo en el DNS de la zona y agrega los registros
   (SPF/DKIM/etc.) ya en modo "DNS only", sin proxy — es el camino recomendado, evita
   copiar registros a mano y el error de dejarlos con el proxy naranja prendido (eso
   rompe la verificación). Si se prefiere hacerlo a mano:
   - Resend muestra los registros DNS a agregar (la cantidad exacta la define Resend
     en el momento — puede variar).
   - Ir a **Cloudflare** → **eliaspacione.com** → **DNS** → **Add record** para cada uno.
   - **Importante**: apagar el proxy (nube naranja → gris) en esos registros.
4. Esperar a que propague — Resend lo muestra como "Pending" mientras tanto, puede
   tardar de minutos a un par de horas. Verifica solo, no hace falta apretar nada más.

### 2.1. Alias de Cloudflare Email Routing (para el remitente y las respuestas)

Cloudflare **no puede mandar** los mails a los alumnos (Email Routing exige que cada
dirección de destino verifique un link a mano antes de poder recibir algo — no sirve
para mandarle un mail de bienvenida a alguien que recién se está dando de alta). Lo que
sí aporta es un alias profesional en el dominio propio que reenvía a un mail real:

1. **Cloudflare** → **eliaspacione.com** → **Email** → **Email Routing**
2. Activarlo si no está activo (agrega automáticamente los registros MX necesarios)
3. **Create address** → `notificaciones@eliaspacione.com` → **Action**: Send to an
   email → tu Gmail real (`elias.psicologiaconsentido@gmail.com`)
4. Ese es el valor que va en `RESEND_FROM` — Resend manda CON esa dirección como
   remitente, y si un alumno responde el mail, la respuesta cae en tu Gmail.

---

## 3. Crear la API Key de Resend

1. En Resend: **API Keys** → **Create API Key**
2. Nombre: `Plataforma Psicologo`
3. Permission: **Sending access** (no necesita Full access)
4. Domain: seleccionar `eliaspacione.com`
5. Copiar la key (`re_XXXX...`)

---

## 4. Variables de entorno de la app (Next.js / Vercel)

### En local (`.env.local`)

```env
RESEND_API_KEY=re_XXXX...
RESEND_FROM=notificaciones@eliaspacione.com
CRON_SECRET=$(openssl rand -hex 32)
```

### En Vercel

1. **Vercel Dashboard** → tu proyecto → **Settings** → **Environment Variables**
2. Agregar las 3 variables de arriba (marcar _Production_, _Preview_ y _Development_
   según corresponda)

---

## 5. Send Email Hook — mails de Supabase Auth con marca propia

Reemplaza el mail default de Supabase (invite, recovery, magiclink) sin tocar nada del
lado de la app — Supabase llama a nuestra Edge Function ANTES de mandar cualquier mail
de Auth, y esa función es la que efectivamente lo manda (por Resend, con marca).

### 5.1. Generar el secret del hook

1. **Supabase Dashboard** → tu proyecto → **Authentication** → **Hooks**
2. **Send Email** → **Enable hook** → tipo **HTTPS**
3. URL: `https://<project-ref>.supabase.co/functions/v1/send-email` (se completa
   después de deployar la función, paso 5.3)
4. Copiar el **Secret** que genera el Dashboard — formato `v1,whsec_...`. Ese es
   `SEND_EMAIL_HOOK_SECRET`.

### 5.2. Cargar los secrets de la Edge Function

La función corre en Deno, aparte del runtime de Next.js — sus variables de entorno se
cargan con la CLI de Supabase, no en Vercel:

```bash
# supabase/functions/.env (no se commitea — agregar a .gitignore si no está)
RESEND_API_KEY=re_XXXX...
RESEND_FROM=notificaciones@eliaspacione.com
SEND_EMAIL_HOOK_SECRET=v1,whsec_...
```

```bash
supabase secrets set --env-file supabase/functions/.env
```

### 5.3. Deployar la función

```bash
supabase functions deploy send-email --no-verify-jwt
```

**`--no-verify-jwt` es obligatorio acá, no opcional.** Por default, Supabase exige un JWT
de usuario válido en el header `Authorization` de cada request a una Edge Function. Pero
quien llama a esta función es el propio Supabase Auth (el Send Email Hook), no un
usuario logueado — no manda ningún JWT, manda la firma de `standardwebhooks` que ya
verifica `index.ts` por su cuenta. Con la verificación de JWT prendida, TODAS las
invocaciones del hook rebotan con 401 antes de llegar siquiera a nuestro código, así
que el hook queda roto en silencio (los mails de Auth simplemente no salen) hasta que
se note. Si ya se deployó sin este flag, se puede corregir así:
```bash
supabase functions deploy send-email --no-verify-jwt
```
(vuelve a deployar la misma función con la config correcta, no hace falta borrar nada).

### 5.4. Local (`supabase start`)

`supabase/config.toml` ya tiene la sección `[auth.hook.send_email]` apuntando al
contenedor local de Edge Runtime. Para que funcione, `supabase/functions/.env` (mismo
archivo del paso 5.2) tiene que existir localmente con las 3 variables — `supabase
start` las lee de ahí.

### 5.5. Verificar

Crear un alumno de prueba (`crearAlumnoDirecto`) y confirmar que llega **un solo mail**,
con nuestra marca, y que el botón "Activar mi cuenta" funciona de punta a punta (lleva
a `/configurar-password` con la sesión ya autenticada). Si llega el mail default de
Supabase en vez del nuestro (o además), el hook no está activo o la URL/secret no
coinciden — revisar los logs de la función: `supabase functions logs send-email`.

> Nota sobre `SEND_EMAIL_HOOK_SECRET`: en `supabase/functions/send-email/index.ts` se
> le saca el prefijo `"v1,"` antes de pasarlo a `Webhook` (queda `"whsec_..."`). No está
> confirmado contra un hook real todavía si la librería `standardwebhooks` espera el
> secret con `whsec_` incluido o sin él — si la verificación de firma falla apenas se
> pruebe esto, esa línea es la primera sospechosa.

---

## 6. Configurar el Cron de Recordatorios

El endpoint es `GET /api/cron/recordatorios` y requiere el header:
```
Authorization: Bearer $CRON_SECRET
```

`vercel.json` ya lo declara (`0 12 * * *` — 12:00 UTC = 09:00 AM Argentina, corre una
vez por día, funciona en cualquier plan de Vercel incluido Hobby). Con
`CRON_SECRET` cargado en las env vars de Vercel, no hace falta ningún paso más — Vercel
invoca el cron solo y manda el header automáticamente.

Manda un resumen para las clases del **día siguiente** (no del mismo día): un alumno
con sesión el martes recibe el aviso el lunes a las 9am, no el mismo martes.

---

## 7. Testear localmente

```bash
# Generar un CRON_SECRET de prueba
export CRON_SECRET=$(openssl rand -hex 32)

# En otro terminal, con el dev server corriendo:
curl -H "Authorization: Bearer $CRON_SECRET" http://localhost:3000/api/cron/recordatorios
```

Respuesta esperada (sin sesiones mañana):
```json
{ "mensaje": "Sin sesiones mañana", "enviados": 0 }
```

Con sesiones agendadas para mañana, correrlo dos veces seguidas: la segunda corrida
tiene que devolver `omitidos_ya_notificados` igual a la cantidad de mails preparados y
`enviados: 0` — así se confirma que el dedup contra `emails_enviados` funciona antes de
confiar en que el cron real (que Vercel puede invocar más de una vez) no duplique nada.

---

## 8. Verificar que los emails llegan

En el [dashboard de Resend](https://resend.com) → **Emails** se puede ver el historial
con estado de entrega, rebotes y clicks. También queda un registro en la tabla
`emails_enviados` de Supabase (solo para los mails de la app — los del Send Email Hook
se ven en `supabase functions logs send-email`, no en esa tabla).

**Pendiente de probar empíricamente** (no confirmado contra la API real de Resend):
qué pasa si `resend.batch.send()` recibe un lote con una dirección inválida — si
rechaza el batch entero o procesa el resto. `enviarMailBatch` hoy asume "rechaza todo"
(el diseño más conservador). Antes de una comisión grande, mandar un batch de prueba
con una dirección claramente inválida mezclada para confirmar el comportamiento real.

---

## Resumen de variables requeridas

| Variable | Dónde vive | Descripción |
|----------|-----------|-------------|
| `RESEND_API_KEY` | Vercel + secret de la función | Clave de la API de Resend |
| `RESEND_FROM` | Vercel + secret de la función | Remitente (el alias de Cloudflare Email Routing) |
| `CRON_SECRET` | Vercel | Protege `/api/cron/recordatorios` |
| `SEND_EMAIL_HOOK_SECRET` | Secret de la función | Verifica la firma del Send Email Hook |
