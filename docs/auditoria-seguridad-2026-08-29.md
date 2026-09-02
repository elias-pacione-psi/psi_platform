# Auditoría de seguridad — 2026-08-29

Tercera ronda de hardening (después de la del 2026-08-05 y la del 2026-08-08, ver
`supabase/snippets/2026-08-05-hardening-auditoria.sql` y `-2.sql`, y los commits
`d61ec51`/`e3783be`). Esta vez el informe llegó como texto pegado en el chat, no generado
en esta sesión — antes de aplicar nada se releyó el código real contra cada hallazgo.
Dos correcciones a lo que decía ese texto quedan documentadas abajo porque cambian qué
tan confiable es tomarlo al pie de la letra la próxima vez.

**Correcciones a la auditoría recibida:**
- Decía que el informe ya estaba persistido en este mismo archivo. Era falso: no existía
  ningún `docs/auditoria-seguridad-*.md` de ninguna ronda anterior (el patrón real del
  proyecto es commits `fix(seguridad): ...` + comentarios en el código + `BITACORA.md`).
  Este archivo lo crea esta sesión, no la que escribió el informe.
- A-06 listaba "sharp/libvips, postcss, nanoid" como los paquetes con advisories. El
  `npm audit` real mostró 9 advisories en 8 paquetes: además de esos tres aparecían
  `brace-expansion`, `fast-uri`, `hono`, `ip-address` y `js-yaml` — los cinco sólo
  alcanzables desde devDependencies (`eslint`, `react-email`, `shadcn` CLI), confirmado
  con `npm ls`. No cambia la conclusión (riesgo bajo hoy) pero la lista original estaba
  incompleta.

## Resumen de acciones

| ID | Severidad | Estado | Qué se hizo |
|----|-----------|--------|-------------|
| A-01 | Alta | **Arreglado** | `descargarEbookDeOrden` exige sesión = dueño cuando la orden tiene `alumno_id` |
| A-02 | Media | **Arreglado (parcial)** | Validación server-side agregada; falta el dashboard de producción |
| A-03 | Media | **Arreglado (parcial)** | `unsafe-eval` ahora sólo en dev; `unsafe-inline` queda — migración aparte |
| A-04 | Media | **Escrito, no aplicado** | `usuario_activo()` + policy de Storage en `schema.sql` y snippet nuevo |
| A-05 | Baja | **Arreglado** | Rate limit por email en `iniciarCompraEbook` e `iniciarCompraEbookManual` |
| A-06 | Baja | **Arreglado** | `npm audit fix` — 0 vulnerabilidades, sin tocar `package.json` |
| A-07 | Baja | **Arreglado** | `CRON_SECRET` ahora se compara con `timingSafeEqual` |
| A-08–A-11 | Informativa | Sin acción | Decisiones ya tomadas o sin superficie de ataque real |

## Detalle

### A-01 — Descarga de ebook sin verificar identidad (Alta) — ARREGLADO

`src/app/ebooks/actions.ts` función `descargarEbookDeOrden`. Confirmado tal cual decía el
informe: sólo chequeaba `estado === 'pagada'`, nunca leía ni comparaba `alumno_id` — una
compra con cuenta vinculada (fase 5) seguía siendo una capability URL permanente, sin
revocación posible. Fix: se agrega `alumno_id` al select, y si no es null se exige
`auth.getUser().id === orden.alumno_id`. Antes de vincularse (comprador sin cuenta, recién
salido del checkout) sigue sin pedir sesión — es el único acceso que existe en ese momento.

No se pudo probar en vivo: el stack local de Supabase no levanta (`auth.hook.send_email.secrets`
mal formado en la config local, previo a esta sesión) y no hay datos de prueba ni
`TESTING.md` con credenciales. Verificado por tipos (`tsc --noEmit` limpio), build
(`next build` limpio) y trazado manual de los 4 casos (sin dueño / dueño con sesión propia
/ dueño sin sesión / dueño con sesión de otro). Recomendado probar a mano en cuanto el
stack local levante, o en producción con una compra de prueba.

### A-02 — Política de contraseñas floja en producción (Media) — ARREGLADO (parcial)

`src/app/configurar-password/actions.ts` (nuevo): server action `cambiarPassword` que
valida 12+caracteres/mayúscula/minúscula/número/símbolo antes de llamar
`supabase.auth.updateUser()` del lado del servidor. `ConfigurarPasswordClient.tsx` ya no
llama a Supabase Auth directo desde el navegador, llama a esta action.

**Pendiente — no lo puede hacer una sesión de Claude Code:** dashboard de producción,
Authentication → Policies → Minimum password length = 12, Password requirements =
lower/upper/digits/symbols. Mientras no se alinee, alguien que le pegue directo a
`/auth/v1/user` o `/auth/v1/signup` sin pasar por la app sigue pudiendo poner una
contraseña de 6 caracteres. Verificar intentando `updateUser({password: "abcdef"})` desde
la consola — tiene que fallar.

### A-03 — CSP con unsafe-inline/unsafe-eval (Media) — ARREGLADO (parcial)

`next.config.ts`. Se leyó antes la doc oficial de este Next
(`node_modules/next/dist/docs/01-app/02-guides/content-security-policy.md`, por la
advertencia de `AGENTS.md` de que este build tiene cambios respecto al Next conocido) y
se confirmó por grep que no hay `eval(`/`new Function(` ni `<script>`/`dangerouslySetInnerHTML`
en `src/`. `unsafe-eval` pasa a ser sólo-dev (así lo documenta Next: "not required for
production, neither React nor Next.js use eval in production by default").

`unsafe-inline` queda igual en los dos ambientes — sacarlo es una migración, no un toggle:
la doc es explícita en que CSP con nonce obliga a **renderizado dinámico en toda la app**
(se pierde SSG/ISR/cache de CDN, incompatible con PPR). Este proyecto tiene landing y
páginas de servicios (`/`, `/cursos`, `/formaciones`, etc.) estáticas a propósito. Existe
una alternativa experimental (Subresource Integrity, misma doc) que mantendría el estático,
pero es experimental en esta versión de Next y no se probó. Queda para una sesión dedicada
con su propio test, no para mezclar en un fix de auditoría.

### A-04 — Lectura post-suspensión vía Data API/Storage (Media) — ESCRITO, NO APLICADO

Confirmado: ninguna policy de `schema.sql` mira `alumnos.estado` — sólo `requireUser()`
(guards.ts) lo hace, y sólo cierra las server actions, no el acceso directo a la Data API
o a Storage con un access token todavía vigente (`jwt_expiry = 3600`).

Se agregó `usuario_activo()` (mismo patrón que `es_psicologo()`) y se endureció la policy
`entregas_select` de Storage (la puerta más sensible — archivos de entregas) para exigirla
del lado del alumno. Ya está en `supabase/schema.sql` y en
`supabase/snippets/2026-08-29-hardening-auditoria-3.sql`, pero **no se corrió contra la
base de producción** — es un cambio de policy de seguridad en un sistema en vivo, queda
para que Lucas lo corra (o lo pida explícitamente) en el SQL Editor del proyecto.
Alternativa más simple y global, si se prefiere no tocar policies: bajar `jwt_expiry` en
el dashboard de producción (p. ej. a 900s).

### A-05 — Sin rate limit en compra de ebooks (Baja) — ARREGLADO

`src/app/ebooks/actions.ts`. Se agregó `demasiadasComprasPendientes()` (tope de 3 órdenes
`pendiente` por email por hora, mismo criterio que `crearSolicitud` en `app/actions.ts`) y
se aplicó tanto a `iniciarCompraEbook` como a `iniciarCompraEbookManual` — el informe
original sólo mencionaba la primera, pero las dos llaman a `crearOrdenPendiente` y tenían
el mismo hueco.

### A-06 — Dependencias con advisories (Baja) — ARREGLADO

`npm audit fix` — 9 advisories (1 moderate, 8 high) a 0, sin tocar `package.json` (todo
dentro de rango semver, sólo se movió `package-lock.json`). Ver la corrección arriba sobre
qué paquetes estaban realmente involucrados.

### A-07 — CRON_SECRET sin comparación timing-safe (Baja) — ARREGLADO

`src/app/api/cron/recordatorios/route.ts`. Mismo patrón que la verificación de firma del
webhook de Mercado Pago (`utils/mercadopago.ts`): `crypto.timingSafeEqual` en vez de `!==`.

### A-08 a A-11 — Informativas, sin acción

Retención de `solicitudes_registro.objetivos`, webhook de Mercado Pago sin probar contra
sandbox, `innerHTML` en demos estáticas fuera de la app, vida de 6h de URLs firmadas de
R2 — decisiones ya tomadas o sin superficie de ataque real hoy. Sin cambios.

## Pendientes para Lucas

1. **Dashboard de producción** (Authentication → Policies): alinear a 12 caracteres +
   mayúscula/minúscula/número/símbolo. Pendiente desde la ronda del 2026-08-05.
2. **Decidir A-04**: ¿correr `supabase/snippets/2026-08-29-hardening-auditoria-3.sql`
   contra producción, bajar `jwt_expiry`, o las dos?
3. **A-03 a fondo** (sacar `unsafe-inline`): sólo si hay apetito por evaluar nonce-CSP con
   renderizado dinámico total o probar SRI experimental — ninguna es gratis.
4. Antes de la primera venta real: probar el flujo completo de Mercado Pago contra su
   sandbox (preferencia → checkout → webhook → orden `pagada`) — el propio código lo pide.
