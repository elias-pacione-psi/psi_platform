# Plan — de plataforma por invitación a venta directa

Estado: **las 6 fases implementadas y mergeadas a `main`** (2026-08-04, mismo día:
PRs #7 a #12). Quedan 3 bloqueos externos antes de que un comprador real pueda
completar una venta — ninguno es código, los tres están detallados abajo en
"## 10. Bloqueos externos, no resueltos por código".

Decisiones tomadas (Lucas, 2026-08-04):
- **Solo los ebooks se venden online.** Cursos, formaciones, supervisiones y
  terapia individual pasan por el formulario de Consultas, con un desplegable
  nuevo para elegir qué le interesa a la persona.
- Se puede **comprar sin cuenta**; el registro va después del pago.

## 1. Qué cambia

Hoy la plataforma es **cerrada y manual**: el psicólogo invita por email, crea la
cuenta y asigna el contenido a mano. No hay registro público ni forma de pagar.

El modelo nuevo es **abierto y autoservicio**: la gente llega a la web, compra y
obtiene el acceso sin que nadie intervenga.

Eso no es una feature más — cambia el supuesto sobre el que está construido todo
lo demás (auth, RLS, política de privacidad, obligaciones legales).

## 2. Dos caminos, no tres

| Producto | Camino | Qué entrega |
|---|---|---|
| **Ebook** | **Compra directa** — precio, pago, descarga | PDF, acceso permanente |
| Curso asincrónico | Consulta por formulario | El psicólogo asigna el programa a mano |
| Formación | Consulta por formulario | Inscripción a comisión + programa + ebook |
| Supervisiones | Consulta por formulario | Coordinación por fuera |
| Terapia individual | Consulta por formulario | Coordinación por fuera |

**Esto achica el trabajo enormemente.** El único circuito de cobro que hay que
construir es el del ebook: sin comisión, sin agenda, sin cupo, entrega inmediata.

Para todo lo demás, lo que hay que hacer es mucho más chico: sumarle al formulario
de Consultas que ya existe un desplegable de "¿qué te interesa?", para que la
solicitud llegue con contexto en vez de texto libre. El resto del circuito —
asignar programa, inscribir en comisión — ya funciona hoy y no se toca.

## 3. Bloqueos a resolver antes de tocar código

### 3.1 Contradice una regla del proyecto

`AGENTS.md` dice, textual:

> Prohibido reintroducir: chat/tutor IA, **registro público de usuarios**,
> escalas clínicas como instrumento.

Abrir la venta al público exige registro público. La regla existe por la postura
de protección de datos del proyecto (Ley 25.326). **No la voy a saltar por mi
cuenta**: hay que decidirlo explícitamente y reescribir esa línea de AGENTS.md
diciendo qué se permite ahora y qué sigue prohibido.

Mi lectura: el espíritu de la regla es *no acumular datos personales de gente que
no es alumna*. Eso se puede sostener incluso vendiendo, si la cuenta que se crea
al comprar guarda lo mínimo (nombre, email) y nada clínico. Pero es una decisión
de ustedes dos, no mía.

### 3.2 Obligaciones legales de vender al público en Argentina

No soy abogado ni contador. Esto es lo que **sé que hay que preguntarle a uno**,
no asesoramiento:

- **Botón de arrepentimiento** — la Resolución 424/2020 lo exige visible en la
  home de todo comercio electrónico que venda a consumidores en Argentina.
- **Derecho de revocación (Ley 24.240)** — 10 días corridos. Para contenido
  digital descargado hay matices: suele requerir consentimiento expreso del
  comprador a la entrega inmediata. Hay que redactarlo bien.
- **Términos y condiciones** — hoy no existen.
- **Política de privacidad** — hoy existe pero con **9 `[COMPLETAR]`**. Vender
  con una política a medio escribir es un problema real, no cosmético.
- **Facturación** — Mercado Pago cobra, no factura por vos. Hay que resolver
  cómo se emite el comprobante (AFIP/ARCA, monotributo o lo que corresponda).
- **Datos del titular** — razón social/CUIT visibles en el sitio.

### 3.3 La landing dice lo contrario

`src/app/page.tsx` promete *"Acceso únicamente por invitación. Acá no se publica
ni se comparte nada de lo tuyo."* Hay que reescribir ese bloque.

## 4. Modelo de datos propuesto

Como solo se venden ebooks, alcanza con esto. Nada de `producto_componentes` ni
bundles: eso se agrega el día que se venda una formación online.

```
ebooks
  id, slug, titulo, descripcion
  portada_key (R2), archivo_key (R2)     -- el PDF que se entrega
  precio_centavos, moneda ('ARS')
  estado ('borrador' | 'publicado')
  created_at

ordenes
  id, ebook_id
  email_comprador                        -- la identidad de la compra: se pide en
                                         -- el checkout, no se toma del proveedor
  alumno_id                              -- se completa cuando hay cuenta (nullable)
  precio_cobrado, moneda                 -- congelado al comprar
  estado ('pendiente' | 'pagada' | 'fallida' | 'reembolsada')
  proveedor, referencia_externa, token_descarga
  created_at, pagada_at

-- No hace falta tabla de entitlement aparte: una orden pagada ES el permiso.
-- El día que un ebook se regale o se incluya en una formación, ahí sí conviene.
```

**El precio se congela en la orden.** Si mañana sube, quien ya compró conserva lo
que pagó y el comprobante coincide.

**`solicitudes_registro`** suma una columna `interes` para el desplegable nuevo
(curso / formación / supervisión / terapia). Es un `text` con check, no una tabla.

RLS: `ebooks` en estado publicado se lee sin login (es la vidriera); `ordenes`
solo su dueño y el psicólogo.

### Comprar sin cuenta: cómo se resuelve

El riesgo de este camino es el desacople de identidad: pagó con un mail y después
se registra con otro. Se evita así:

1. El checkout **pide el email** — no se toma el del proveedor de pago.
2. La orden se guarda con ese email antes de mandar a pagar.
3. Confirmado el pago, se manda a ese email un enlace de descarga con token.
4. En paralelo se le ofrece crear la cuenta con **ese mismo email**. Si ya
   existe, la orden se ata sola. Si no, al registrarse se atan todas las órdenes
   pagadas con ese email.

Así el email del pago es la única identidad que importa, y la cuenta es opcional
hasta que la persona quiera tenerla.

## 5. Flujo de pago

La regla que ordena todo el diseño:

> **El acceso NUNCA se otorga desde el navegador.** El redirect de "pago exitoso"
> es una sugerencia, no una prueba. La verdad es el webhook servidor-a-servidor.

```
1. El comprador elige el producto        → se crea `orden` en estado 'pendiente'
                                            con el precio leído DE LA BASE
2. Se le manda al checkout del proveedor  (nunca se manda el precio desde el cliente)
3. El proveedor cobra
4. Webhook → verificar firma → marcar 'pagada' → otorgar acceso
5. El redirect solo muestra "estamos confirmando tu pago"
```

Puntos que suelen romperse y hay que cubrir:

- **Idempotencia**: el webhook llega repetido. Otorgar dos veces no puede duplicar
  accesos ni órdenes.
- **Verificación de firma**: sin eso, cualquiera puede simular un pago con un POST.
- **Webhook demorado**: el comprador vuelve antes de que confirme. Necesita una
  pantalla de "procesando" que refresque, no un error.
- **Reembolso**: revoca el entitlement.

**Proveedor**: Mercado Pago es lo natural para Argentina (cobertura, transferencia,
tarjetas, cuotas). Alternativas a evaluar: Uala Bis, MODO. Nada de esto lo puedo
decidir yo: depende de comisiones, tiempos de acreditación y de qué cuenta tiene
el psicólogo. **Sigue pendiente.**

## 6. Entrega del ebook

Buena noticia: **ya está resuelto el 80%**. `firmarDescargaR2()` genera URLs
firmadas y temporales que fuerzan descarga, y ya se usa para las entregas.

Lo que falta:

- Chequear el entitlement server-side antes de firmar.
- URL de vida corta generada por click (no un link permanente que se pueda
  reenviar por WhatsApp).
- Opcional: marca de agua con el email del comprador en el PDF. Disuade la
  redistribución. Requiere procesar el PDF al vuelo — decidir si vale la pena.

## 7. Qué hay que adaptar de lo que ya existe

| Pieza | Cambio |
|---|---|
| `AGENTS.md` | Reescribir la prohibición de registro público |
| `/privacidad` | Completar los 9 placeholders |
| Términos y condiciones | Crear |
| Landing — bloque "Privado" | Reescribir: ya no es solo por invitación |
| Landing — nav | Los 5 botones ya están puestos, falta darles destino |
| `/registro` | No existe, hay que crearlo |
| Login | Sumar "crear cuenta" |
| Panel del psicólogo | Sección nueva: productos, precios, ventas |
| `alumnos.rol` | Decidir si quien solo compró un ebook es 'alumno' |

Lo que **no** cambia: el visor de lecciones, comisiones, agenda, entregas, quizzes,
biblioteca. Todo eso sigue igual — solo cambia cómo llega la gente.

## 8. Fases sugeridas

1. **Desplegable de intereses en Consultas** — chico y sin riesgo. Suma la columna
   `interes`, el `<select>` en el formulario y muestra el dato en el panel. Los
   cuatro botones de la nav (Cursos, Formaciones, Supervisiones, Terapia) pasan a
   llevar al formulario con el interés ya elegido. **Con esto solo, cuatro de los
   cinco botones de la nav quedan funcionando.**

2. **Catálogo de ebooks sin cobro** — ABM en el panel (título, descripción,
   portada, PDF, precio) + vidriera pública: listado, detalle con portada y precio.
   Botón "Comprar" deshabilitado con un "próximamente". Ya se ve el negocio
   entero sin tocar dinero ni datos personales.

3. **Legales** — bloqueante para seguir. T&C, política de privacidad completa,
   botón de arrepentimiento, datos fiscales, decisión sobre `AGENTS.md`.

4. **Cobro del ebook** — proveedor, checkout, webhook, entrega por token.

5. **Cuentas** — registro público y atado de órdenes por email.

6. **Administración** — panel de ventas, reembolsos, comprobantes.

Las fases 1 y 2 no tocan pagos ni datos sensibles, así que se pueden hacer ya
mientras se resuelve lo legal en paralelo.

## 9. Preguntas abiertas (resueltas o superadas por la implementación)

1. ~~Proveedor de pago y quién emite la factura.~~ Se implementó contra Mercado
   Pago (lo más natural para Argentina), pero **sin credenciales reales** — ver
   bloqueo 2 abajo. Quién factura sigue sin decidir (bloqueo 3).
2. **Precios**: quedó solo ARS. Vender al exterior no se implementó.
3. ~~¿Qué pasa con AGENTS.md?~~ Resuelto: la prohibición de registro público
   quedó acotada (no eliminada) a la fase 5, con fecha y referencia a este plan.

## 10. Bloqueos externos, no resueltos por código

Las 6 fases están implementadas, pero un comprador real todavía no puede
completar una compra por tres cosas que nadie más que Lucas/Elias puede resolver:

1. **La migración SQL no está corrida en producción.**
   `supabase/snippets/2026-08-04-ebooks-y-desplegable-interes.sql` — sin esto,
   `ebooks`/`ordenes`/`solicitudes_registro.interes` no existen y toda la fase 1
   en adelante falla. Es aditiva e idempotente, se puede correr con producción
   como está. Correrla en
   `https://supabase.com/dashboard/project/urevyngawcybyrfvahgk/sql/new`
   (¡ojo con confundir el proyecto — ver `reference-github-repo` en la memoria!).

2. **No hay credenciales de Mercado Pago.** `MERCADOPAGO_ACCESS_TOKEN` y
   `MERCADOPAGO_WEBHOOK_SECRET` (ver `.env.example`) no están configuradas.
   Mientras tanto, el botón "Comprar" degrada solo a "próximamente" en toda la
   plataforma — no hay riesgo en dejar esto así por un tiempo. El código de
   `utils/mercadopago.ts` / `api/webhooks/mercadopago` sigue el contrato
   documentado de Checkout Pro pero **nunca corrió contra un pago real**:
   probarlo contra el sandbox de Mercado Pago antes de pasar a producción.

3. **`enable_signup` de Supabase Auth no está sincronizado en el proyecto real.**
   `supabase/config.toml` ya dice `true` (con el guardrail real viviendo en la
   aplicación, no en este flag — ver el comentario ahí), pero ese archivo describe
   la configuración deseada, no la aplica sola contra el proyecto hosteado. Hace
   falta `supabase config push` (si el CLI está linkeado) o replicarlo a mano:
   Dashboard → Authentication → "Allow new users to sign up", en el proyecto
   `urevyngawcybyrfvahgk`.

Ninguno de los tres bloquea que el resto de la plataforma (cursos, comisiones,
agenda, todo lo que ya existía) siga funcionando exactamente igual que antes.
