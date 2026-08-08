'use server'

import { z } from 'zod'
import { createClient } from '@/utils/supabase/server'
import { createAdminClient } from '@/utils/supabase/admin'

const RE_UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i

// Un único mensaje para TODOS los modos de falla del alta. Antes había dos distintos
// ("Ya existe una cuenta con ese email" / "No encontramos ninguna compra confirmada"), y
// esa diferencia era un oráculo: probando emails contra esta action se podía averiguar
// quién compró y quién ya tiene cuenta, sin ninguna credencial. La pantalla siempre dice
// lo mismo; el detalle real queda en los logs del servidor.
const ERROR_GENERICO = 'No pudimos crear la cuenta con esos datos. Revisá el enlace de tu compra o escribinos.'

// El guardrail de "quién puede crear una cuenta acá" son DOS cosas, no una:
//
//   1. que exista una compra pagada con ese email, y
//   2. que quien está completando el formulario tenga el id de esa orden.
//
// El (2) es la parte que faltaba y que hacía esto vulnerable a pre-hijacking. Con sólo
// el (1), saber el email de un comprador alcanzaba para crear SU cuenta con una
// contraseña elegida por el atacante: la cuenta nacía con email_confirm: true (o sea,
// Supabase la daba por verificada sin que nadie hubiera abierto ese buzón), las órdenes
// se le vinculaban, y desde /alumno/compras se bajaba el PDF que pagó otro. La víctima
// además quedaba trabada, porque el email ya "tenía cuenta".
//
// El id de la orden es un uuid que sólo conoce quien volvió del checkout de Mercado Pago
// (es la URL /pedido/[id] a la que redirige el pago). No es una prueba de control del
// buzón —para eso haría falta el salto por email— pero convierte "saber un email" en
// "tener el link privado de esa compra", que es exactamente la capability que el flujo
// ya le da al comprador y a nadie más.
async function ordenHabilitaAlta(
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  supabaseAdmin: any,
  ordenId: string,
  email: string,
): Promise<boolean> {
  if (!RE_UUID.test(ordenId)) return false

  const { data: orden } = await supabaseAdmin
    .from('ordenes')
    .select('email_comprador')
    .eq('id', ordenId)
    .eq('estado', 'pagada')
    .is('alumno_id', null)
    .maybeSingle()

  // El email del formulario tiene que ser el de ESA orden: si no, con el link de la
  // compra propia se podría dar de alta la cuenta de cualquier otro email.
  return orden?.email_comprador === email
}

const MIN_LEN = 12
const REQUISITOS: { regex: RegExp; label: string }[] = [
  { regex: /[a-z]/, label: 'una minúscula' },
  { regex: /[A-Z]/, label: 'una mayúscula' },
  { regex: /[0-9]/, label: 'un número' },
  { regex: /[^A-Za-z0-9]/, label: 'un símbolo' },
]

// Mismo esquema (largo y requisitos) que /configurar-password. Verificado contra
// producción el 2026-08-05: el servidor es MÁS FLOJO que esto (acepta 6 caracteres sin
// requisitos), así que acá el chequeo sí muerde — es el único que aplica en el alta por
// compra. Alinear el dashboard igual (Authentication → Policies), porque el cambio de
// contraseña posterior pasa por el navegador y no por esta función.
function errorEnPassword(password: string): string | null {
  if (password.length < MIN_LEN) return `La contraseña tiene que tener al menos ${MIN_LEN} caracteres.`
  const faltantes = REQUISITOS.filter((r) => !r.regex.test(password)).map((r) => r.label)
  if (faltantes.length > 0) return `Falta al menos ${faltantes.join(', ')}.`
  return null
}

const schema = z.object({
  nombre: z.string().trim().min(1, 'El nombre es obligatorio').max(100),
  email: z.string().trim().toLowerCase().regex(/^[^\s@]+@[^\s@]+\.[^\s@]+$/, 'El email no es válido').max(254),
  password: z.string(),
  ordenId: z.string().trim().max(64),
})

export async function crearCuentaComprador(formData: FormData) {
  const parsed = schema.safeParse({
    nombre: formData.get('nombre') ?? '',
    email: formData.get('email') ?? '',
    password: formData.get('password') ?? '',
    ordenId: formData.get('orden') ?? '',
  })
  if (!parsed.success) return { error: parsed.error.issues[0]?.message ?? 'Datos inválidos' }

  const { nombre, email, password, ordenId } = parsed.data
  // La contraseña sí devuelve el motivo real: no filtra nada sobre terceros (es la que la
  // persona acaba de tipear) y sin el detalle no sabría qué corregir.
  const errorPassword = errorEnPassword(password)
  if (errorPassword) return { error: errorPassword }

  const supabaseAdmin = createAdminClient()

  const { data: yaExiste } = await supabaseAdmin.from('alumnos').select('id').eq('email', email).maybeSingle()
  if (yaExiste) {
    console.warn('Alta rechazada: ya existe cuenta para ese email')
    return { error: ERROR_GENERICO }
  }

  if (!(await ordenHabilitaAlta(supabaseAdmin, ordenId, email))) {
    console.warn('Alta rechazada: la orden no habilita el alta para ese email')
    return { error: ERROR_GENERICO }
  }

  // Con admin.createUser() y NO con signUp(): el endpoint público /auth/v1/signup está en
  // OFF en el dashboard (Authentication → Sign In / Providers → "Allow new users to sign
  // up"), espejado en supabase/config.toml. Verificado CERRADO contra producción el
  // 2026-08-08: responde `signup_disabled`. Si alguien lo volviera a abrir, todo el
  // control de acá arriba pasaría a ser decorativo — cualquiera con la anon key crearía
  // cuentas por ese endpoint sin pasar por esta función.
  //
  // email_confirm: true significa "Supabase da este email por verificado". Es una
  // afirmación fuerte y acá se sostiene en la orden, no en el email del formulario:
  // ordenHabilitaAlta() ya exigió el id de la compra Y que el email coincida con el que
  // pagó. Sin ese chequeo, esto estaría marcando como verificado un buzón que nadie abrió.
  const { data: creado, error: errorCreacion } = await supabaseAdmin.auth.admin.createUser({
    email,
    password,
    email_confirm: true,
    user_metadata: { nombre }, // handle_new_user() lo lee para el nombre inicial del perfil
  })
  if (errorCreacion) {
    console.error('No se pudo crear el usuario:', errorCreacion.message)
    return { error: ERROR_GENERICO }
  }
  if (!creado.user) return { error: ERROR_GENERICO }

  // Con admin client: recién creada, esta cuenta no tiene forma de pasar la policy de
  // `ordenes` por su cuenta (ordenes_select_propia exige alumno_id = auth.uid(), que es
  // justo la columna que se está por completar acá).
  await supabaseAdmin
    .from('ordenes')
    .update({ alumno_id: creado.user.id })
    .eq('email_comprador', email)
    .eq('estado', 'pagada')
    .is('alumno_id', null)

  // createUser() no deja cookie de sesión (corre con service-role, fuera de esta request).
  // Se inicia sesión aparte con el cliente del usuario para que la persona entre ya
  // logueada, que es lo que antes hacía signUp() de arrastre.
  const supabase = await createClient()
  const { data: sesion } = await supabase.auth.signInWithPassword({ email, password })

  return { success: true, haySesion: Boolean(sesion?.session) }
}
