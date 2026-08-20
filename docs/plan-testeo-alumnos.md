# Preparación para el testeo con alumnos reales

Auditoría del **2026-08-20**, a pedido de Lucas ("considero que el sistema está
listo para pasar a ser testeado por pacientes/alumnos"). Cubre: revisión de todas
las server actions y guards, RLS/grants contra producción, inventario real de
contenido, integridad de los archivos en R2, recorrido de las rutas públicas en
producción, y `tsc` / `eslint`.

**Veredicto**: la base es sólida (seguridad, RLS, validación, contenido cargado).
Se detectaron **4 cosas para arreglar antes** de que entre el primer alumno — **las
cuatro ya están corregidas** (sección 1). Queda la lista de puntos ciegos y temas a
mirar durante el testeo.

---

## 0. Estado verificado (lo que ya está bien)

- **Auth cerrado**: `disable_signup: true` confirmado contra producción — el
  endpoint `/auth/v1/signup` responde `signup_disabled`. Nadie se da de alta solo.
- **RLS + grants**: las 20 tablas existen y tienen RLS. `anon` está bloqueado en
  todas menos las dos vidrieras públicas, y ahí con **grant por columna**:
  `ebooks` expone título/precio/portada pero **no** `archivo_key` (verificado:
  42501), y `programas` solo las columnas de la vidriera.
- **Guards**: `requireUser()` / `requirePsicologo()` aplicados en las 40+ server
  actions. Las únicas sin guard son públicas a propósito (formulario de consultas,
  compra de ebook, página de pedido, alta post-compra) y todas revalidan
  server-side.
- **Quiz**: la respuesta correcta nunca viaja antes del envío; la corrección y el
  conteo de intentos son server-side con service-role y transacción serializada.
- **Contenido cargado**: 5 programas · 38 módulos · 70 lecciones · 30 quizzes
  (5 preguntas cada uno) · 12 recursos de biblioteca · 5 ebooks. **Ningún módulo
  vacío, ningún quiz sin preguntas.**
- **R2 sano**: 127 objetos, 230 MB. Se verificaron las **92 referencias** de
  lecciones, biblioteca y ebooks contra el bucket: **0 rotas**.
- **Cabeceras de seguridad en producción**: CSP completa (con el host real de R2),
  HSTS, `frame-ancestors 'none'`, `X-Frame-Options: DENY`.
- `tsc --noEmit` limpio. `eslint`: 4 errores preexistentes de `no-explicit-any` en
  `psicologo/alumnos/page.tsx` + 1 warning de variable sin usar en `app/actions.ts`.

---

## 1. Arreglar antes del testeo — ✅ hecho el 2026-08-20

### 1.1 Las fechas y horas se muestran en UTC, no en hora de Argentina — ✅ corregido

`src/utils/horario-cohorte.ts` **guarda** bien (fija `-03:00` explícito), pero
**ningún** `toLocaleDateString` / `toLocaleTimeString` de la app pasa
`timeZone: 'America/Argentina/Buenos_Aires'`. Esas llamadas corren en el servidor
(RSC y plantillas de email), y en Vercel el runtime es UTC.

Consecuencia concreta: una clase de las **21:00** se guarda como `00:00 UTC del
día siguiente` y se muestra como **"mañana a las 00:00"**.

Afecta, entre otros:
- `src/app/alumno/page.tsx:63` — "Tu próxima clase es el…"
- `src/app/psicologo/page.tsx:159` — "Próximo encuentro"
- `src/emails/RecordatorioClaseEmail.tsx` — el recordatorio del día anterior
- `src/emails/ClaseAgendadaEmail.tsx` — el aviso de clase agendada

Peor todavía: `CalendarWidget` es `'use client'`, así que el calendario sí muestra
la hora correcta (zona del navegador). **El calendario y el email van a decir cosas
distintas sobre la misma clase.**

> **Corregido**: nuevo `src/utils/fecha-ar.ts` con la zona fija, usado en los 12
> puntos de formateo de la app. Ya no queda ningún `toLocaleDateString` suelto fuera
> de ese archivo. Incluye los componentes de cliente, que sufrían lo mismo en el
> primer render del servidor (y encima daban mismatch de hidratación), y
> `fechaSoloDia()` para las columnas `date` de cohorte, que se corrían un día.
> Verificado con `TZ=UTC`: una clase de las 21:00 pasaba de mostrarse como
> *"martes 25 de agosto 00:00hs"* a *"lunes 24 de agosto 21:00hs"*.

### 1.2 Borrar un archivo en el gestor destruye el ebook que se vende — ✅ corregido

Ninguna de las rutas de borrado chequea si la key de R2 sigue referenciada por otro
registro antes de borrar el objeto físico
(`limpiarArchivosDeStorage` en `psicologo/actions.ts:24`, `borrarObjetos` y
`borrarMultiples` en `psicologo/archivos/actions.ts`).

Hoy en producción hay **10 archivos compartidos entre dos o más registros**:

| Archivo | Lo usan |
|---|---|
| `Lecturas/Consulta-Cero.pdf` | biblioteca **+ ebook "Consulta Cero"** |
| `Lecturas/Kit_Emergencia_Ansiedad_Curso.pdf` | biblioteca **+ ebook "Kit de Emergencia"** |
| `Lecturas/Primer_Respiro-1.pdf` | biblioteca **+ ebook "Primer Respiro"** |
| 3 portadas en `Otros/Portadas/` | biblioteca + portada de ebook |
| 4 audios en `Audios/` | lección de curso + biblioteca |

Borrar "Consulta-Cero" desde Biblioteca **borra el PDF que se vende a $15.000** y
rompe la descarga de todos los que ya lo pagaron, sin ningún aviso.

> **Corregido**: nuevo `src/utils/supabase/referencias-r2.ts`, que sabe qué filas
> apuntan a cada key (lecciones, biblioteca, ebooks —archivo y portada— y portadas de
> programa). Dos comportamientos distintos según quién borra:
> - **Gestor de archivos** (`borrarObjetos` / `borrarMultiples` / `borrarCarpeta`):
>   se bloquea y el error nombra qué lo está usando.
> - **Borrar una lección o un recurso** (`limpiarArchivosDeStorage`): el archivo
>   físico se borra sólo si quedó huérfano.
>
> Verificado contra producción: borrar `Consulta-Cero.pdf` queda bloqueado con
> *"lo usa el recurso de Biblioteca «Consulta-Cero», el ebook «Consulta Cero»"*, y
> borrar la lección del audio compartido ya no se lleva puesto el archivo.

### 1.3 Renombrar un archivo rompe el ebook (pero no la lección) — ✅ corregido

`actualizarReferenciasR2` (`psicologo/archivos/actions.ts:335`) actualiza
`lecciones` y `biblioteca_recursos` cuando cambia la key — pero **no toca
`ebooks.archivo_key` ni `ebooks.portada_key`**.

Renombrar el PDF de un ebook desde el gestor deja el ebook apuntando a una key que
ya no existe: la portada pasa a ícono gris en la vidriera y la descarga falla con
"No se pudo generar el link de descarga" para todo el que haya pagado.

> **Corregido**: `actualizarReferenciasR2` ahora cubre también `ebooks.archivo_key`,
> `ebooks.portada_key` y `programas.portada_key`. La lista de tablas quedó espejada
> con la del chequeo de borrado — si se agrega una columna con key de R2, van las dos.

### 1.4 El quiz se puede trabar para siempre y no hay forma de destrabarlo — ✅ corregido

- Umbral 70% (`utils/supabase/quiz.ts`), pero **todos los quizzes tienen 5
  preguntas**: 3/5 = 60% reprueba, 4/5 = 80% aprueba. **El piso real es 4 de 5**,
  no lo que dice la consigna.
- Máximo 3 intentos (`MAXIMO_INTENTOS_QUIZ`, `alumno/actions.ts:161`).
- Agotados los 3, el mensaje dice *"Escribile a tu instructor"* — pero **no existe
  ninguna acción para resetear intentos**. `quiz_intentos` solo se borra al
  eliminar la cuenta entera.

Con 30 quizzes en el contenido cargado, es cuestión de tiempo que alguien quede
trabado sin salida y sin que Elías pueda hacer nada desde el panel.

> **Corregido**, en tres partes:
> - **Alumnos → ⋮ → Quizzes**: diálogo nuevo con los resultados de esa persona
>   (lección, mejor puntaje, intentos usados, si quedó trabada). Cierra también el
>   punto ciego #4: `quiz_intentos` no se leía en ninguna pantalla.
> - **Botón "Reiniciar"** por quiz (`reiniciarIntentosQuiz`): le devuelve los 3
>   intentos y limpia el progreso de esa lección, para que no quede tildada como
>   superada con cero intentos rendidos detrás.
> - **El mensaje del alumno dice el número real**: en vez de "no alcanzaste el 70%",
>   ahora dice *"para aprobar necesitás 4 de 5"*, y al quedarse sin intentos avisa
>   que el instructor puede devolvérselos.
>
> El umbral del 70% **no se tocó**: es una decisión pedagógica de Elías, no un bug.
> Lo que se arregló es que la pantalla dijera el requisito de verdad.

---

## 2. Puntos ciegos (callejones sin salida)

| # | Dónde | Qué pasa |
|---|---|---|
| 1 | `/login` | `auth/confirm` redirige a `/login?message=…` cuando un link venció o ya se usó, **pero `login/page.tsx` nunca lee `message`**. El alumno cae en el login sin explicación — y todavía no tiene contraseña, así que no puede entrar. Es lo primero que va a tocar cada invitado. |
| 2 | `/configurar-password` | Renderiza el formulario **sin chequear que haya sesión**. Sin sesión válida, `updateUser()` falla con un error en inglés ("Auth session missing!") en un toast, sin ningún camino de salida. |
| 3 | `crear-cuenta` | Si el `signInWithPassword` posterior al alta falla, la pantalla dice *"Te mandamos un email para confirmar la cuenta"* — **ese email no existe**: la cuenta se crea con `email_confirm: true`. La persona espera algo que nunca llega. |
| 4 | ~~Panel del psicólogo~~ | ~~No hay ninguna vista de resultados de quiz.~~ **Resuelto** junto con 1.4: Alumnos → ⋮ → Quizzes. |
| 5 | Alumno | **No hay pantalla de perfil ni de cambio de contraseña.** Para cambiarla hay que salir y usar "recuperar contraseña". |
| 6 | Alumno | El sidebar no tiene ningún link de vuelta al sitio público. |
| 7 | `cambiarEstadoAlumno` | No tiene el chequeo de "no te apliques esto a vos mismo" que sí tiene `eliminarUsuarioTotal`. Elías puede **suspenderse a sí mismo** → ban de Auth de 100 años, y la única salida es el dashboard de Supabase. |
| 8 | `/pedido/[id]` | Con estado `pendiente` se auto-refresca cada 5s **para siempre**. Un pago offline (Rapipago/PagoFácil, que tarda días) deja a la persona en un loop sin mensaje ni salida. |
| 9 | Formulario de consultas | **No le manda ningún email a Elías** cuando llega una consulta. Tiene que acordarse de mirar el panel. |
| 10 | Landing (móvil) | La nav es un scroll horizontal sin ninguna señal visual: en 375px **"Terapia individual" y "Psicología y Fe" quedan fuera de pantalla**. |
| 11 | Landing | El formulario de contacto es client-only (`useSearchParams()` dentro de un `<Suspense>` sin fallback): no está en el HTML del servidor. El ancla `#contacto` **no existe hasta que hidrata**, así que el botón "Comenzar proceso" no hace nada si se toca antes — en un teléfono lento eso es un click muerto en el CTA principal. |
| 12 | Panel del psicólogo | "Opiniones" está en el sidebar pero **falta en la grilla "El panel"** del inicio. |
| 13 | `crearAlumnoDirecto` | Si el invite sale bien pero falla la asignación de programas, la action devuelve error igual: Elías reintenta y el segundo invite falla con "email ya registrado". Queda un alumno creado sin programas y un mensaje confuso. |

---

## 3. Configuración pendiente

- **Mercado Pago no está configurado en producción** (verificado: `/ebooks/primer-respiro`
  muestra "Comprar — próximamente"). Todo el circuito **pago → webhook → descarga →
  crear cuenta** está escrito pero **nunca corrió contra un pago real**, ni siquiera
  en sandbox. Los 4 ebooks publicados no se pueden comprar. `link_pago` está en
  `null` en los 5.
- **El `link_pago` manual no entrega nada**: si Elías carga un link de pago externo,
  no se crea orden, no hay `/pedido/[id]`, no hay descarga ni alta de cuenta. El PDF
  lo tiene que mandar a mano.
- **Política de contraseña**: producción sigue aceptando 6 caracteres sin requisitos
  (documentado en `configurar-password/ConfigurarPasswordClient.tsx` desde el
  2026-08-05). Las validaciones del cliente son más estrictas que el servidor, así
  que son una sugerencia, no un límite. Alinear en Authentication → Policies.
- **`NEXT_PUBLIC_SITE_URL` en `.env.local` es `http://localhost:3000`.** Si alguien
  invita a un alumno corriendo `npm run dev` (y `.env.local` apunta a la base de
  **producción**), el mail de invitación va a llevar un link a `localhost` que el
  alumno no puede abrir. **No invitar gente desde local.**
- **`supabase/schema.sql` está desactualizado**: `ebooks`, `ordenes`,
  `opiniones_curso`, `emails_enviados` y `cohortes_programas` viven solo en
  `supabase/snippets/`. Levantar el proyecto de cero desde `schema.sql` da una base
  incompleta. (Las 5 tablas **sí** están aplicadas en producción, con RLS.)
- **Resend**: `RESEND_FROM = notificaciones@eliaspacione.com` — confirmar que el
  dominio esté verificado, o todos los emails transaccionales fallan en silencio.

---

## 4. Datos: el estado real antes de arrancar

- **4 cuentas**: 1 psicólogo (Elías) + 3 de prueba de Lucas. Ningún alumno real.
- **0 cohortes, 0 sesiones de agenda, 0 entregas, 0 opiniones, 0 órdenes.**
- **Las 5 asignaciones de programa que existen son de la cuenta de Elías**, no de
  alumnos.
- **Ninguna lección de tipo `entrega`** (solo `drive_pdf` ×36, `quiz` ×30,
  `drive_audio` ×4). O sea: `/alumno/tareas`, el formulario de entrega, la bandeja
  de Entregas y el mail de "entrega revisada" **no tienen contenido con qué
  probarse**.
- Los 5 programas están **sin portada** (`portada_key` null): en `/cursos` todos
  muestran el ícono gris de placeholder.

**Traducción**: comisiones, agenda, clases en vivo, recordatorios por mail y todo el
circuito de entregas **nunca corrieron con datos reales**. Son la mitad del sistema
y son exactamente lo que hay que ejercitar primero.

---

## 5. Checklist de testeo, por flujo

### A. Alta de alumno (el que más importa — es lo primero que ve todo el mundo)
1. Crear un alumno desde el panel **estando en producción**, no en local.
2. Que llegue el mail de invitación con la marca correcta y un link a `eliaspacione.com`.
3. Abrir el link → pantalla "Confirmá tu acceso" → Continuar → `/configurar-password`.
4. Poner la contraseña → que caiga en `/alumno` ya logueado.
5. **Probar el link vencido/reusado**: abrirlo dos veces. Confirmar qué ve el alumno
   (hoy: el login mudo, punto ciego #1).
6. Probar "recuperar contraseña" de punta a punta.
7. Aprobar una solicitud del formulario público y confirmar que hace exactamente lo
   mismo que el alta manual.

### B. Contenido y progreso
8. Asignar un programa y confirmar que llega el mail "Ahora tenés acceso a…".
9. Abrir lecciones de cada tipo cargado (PDF y audio) **desde el teléfono**.
10. Marcar completada / descompletar y ver que la barra de progreso acompaña.
11. **Hacer un quiz a propósito mal 3 veces** y ver qué pasa (punto 1.4).
12. Confirmar que el progreso que ve Elías en Alumnos coincide con el del alumno.

### C. Comisión, agenda y recordatorios (cero probado)
13. Crear una comisión con varios programas, horario y días.
14. Inscribir alumnos → confirmar que ganan acceso y que llega **un solo** mail.
15. Generar las clases y **verificar la hora en el calendario, en la tarjeta del
    inicio y en el mail** — hoy no van a coincidir (punto 1.1).
16. Correr el cron a mano (`curl` con `Authorization: Bearer $CRON_SECRET`) y
    revisar el recordatorio recibido.
17. Sacar un alumno de la comisión y confirmar que pierde el acceso correcto
    (ojo: hoy también le saca un programa asignado a mano si coincide).

### D. Entregas (hace falta crear contenido nuevo)
18. Crear una lección tipo `entrega` con consigna y fecha límite.
19. Subir un archivo como alumno (a R2), ver que aparece en Tareas.
20. Corregir desde Entregas → que llegue el mail y el alumno vea la devolución.
21. Volver a subir después de corregida → tiene que reaparecer como pendiente.

### E. Ebooks (bloqueado hasta configurar Mercado Pago)
22. Configurar credenciales de **sandbox** y hacer una compra de punta a punta.
23. Verificar el webhook: orden `pendiente` → `pagada` sin tocar nada a mano.
24. Descargar el PDF, crear la cuenta desde `/pedido/[id]`, entrar y volver a
    descargarlo desde "Mis compras".
25. Probar un pago rechazado y un reembolso.

### F. Administración de usuarios
26. Suspender un alumno **con la sesión abierta en otra ventana** y confirmar que
    queda afuera enseguida (el guard chequea `estado` en cada action).
27. Reactivarlo y confirmar que vuelve a entrar.
28. Eliminar una cuenta de prueba y revisar qué queda en la base
    (hoy **no se borran los archivos de sus entregas en R2** — revisar de cara al
    derecho de supresión de la Ley 25.326).

### G. Móvil
29. Recorrer todo en un teléfono real: nav de la landing, visor de PDF, quiz,
    subida de archivo, sidebar del portal.

---

## 6. Para más adelante (no bloquea el testeo)

- Vista de resultados de quiz para el psicólogo + botón de resetear intentos.
- Pantalla de perfil / cambio de contraseña para el alumno.
- Aviso por mail a Elías cuando entra una consulta nueva.
- Chequeo de referencias antes de borrar en el gestor de archivos (y aviso de
  "este archivo lo usan N cosas").
- Poner `ebooks` en `actualizarReferenciasR2`.
- Portadas para los 5 programas.
- Sincronizar `schema.sql` con los snippets ya aplicados.
- El ebook "Pastor Alerta" está en borrador, sin descripción y con la portada de
  "Consulta Cero".
- `crearRecursoBiblioteca` no acepta los tipos `r2_*` que usan los 12 recursos que
  ya existen (todos entraron por `sincronizarBiblioteca`): el alta manual de un
  recurso de R2 desde Biblioteca hoy se rechaza.
- El límite global anti-spam del formulario (50/hora) se puede usar para bloquear
  el canal de contacto de todos.
