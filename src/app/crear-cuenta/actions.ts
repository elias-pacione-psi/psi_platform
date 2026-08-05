'use server'

import { z } from 'zod'
import { createClient } from '@/utils/supabase/server'
import { createAdminClient } from '@/utils/supabase/admin'

// El guardrail real de "quién puede crear una cuenta acá" no es un flag de Supabase — es
// esta consulta. Ver la decisión en AGENTS.md y docs/plan-modelo-comercial.md (fase 5):
// el registro dejó de estar prohibido en general, pero sigue acotado a quien ya pagó un
// ebook. Supabase Auth (enable_signup, supabase/config.toml) no tiene forma de saber
// eso — por eso este chequeo pasa ANTES de siquiera intentar el signUp.
async function tieneCompraPagada(
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  supabaseAdmin: any,
  email: string,
): Promise<boolean> {
  const { count } = await supabaseAdmin
    .from('ordenes')
    .select('*', { count: 'exact', head: true })
    .eq('email_comprador', email)
    .eq('estado', 'pagada')
  return (count ?? 0) > 0
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
})

export async function crearCuentaComprador(formData: FormData) {
  const parsed = schema.safeParse({
    nombre: formData.get('nombre') ?? '',
    email: formData.get('email') ?? '',
    password: formData.get('password') ?? '',
  })
  if (!parsed.success) return { error: parsed.error.issues[0]?.message ?? 'Datos inválidos' }

  const { nombre, email, password } = parsed.data
  const errorPassword = errorEnPassword(password)
  if (errorPassword) return { error: errorPassword }

  const supabaseAdmin = createAdminClient()

  const { data: yaExiste } = await supabaseAdmin.from('alumnos').select('id').eq('email', email).maybeSingle()
  if (yaExiste) return { error: 'Ya existe una cuenta con ese email. Iniciá sesión en vez de crear una nueva.' }

  if (!(await tieneCompraPagada(supabaseAdmin, email))) {
    return { error: 'No encontramos ninguna compra confirmada con ese email.' }
  }

  // Con admin.createUser() y NO con signUp(): el endpoint público /auth/v1/signup queda
  // DESHABILITADO en el dashboard a propósito (Authentication → Sign In / Providers →
  // "Allow new users to sign up" = OFF, espejado en supabase/config.toml).
  //
  // Con signUp() abierto, el chequeo de tieneCompraPagada() de arriba era decorativo: la
  // anon key viaja en el bundle del navegador, así que cualquiera podía hacer un POST a
  // /auth/v1/signup salteándose esta función entera y quedarse con una sesión
  // `authenticated` sin haber comprado nada. Con eso no llegaba a los datos de otros
  // alumnos (la RLS aguanta), pero sí a escribir progreso y entregas sin límite y a subir
  // archivos al bucket de R2 — o sea, a la factura de Cloudflare. Además rompía la regla
  // de AGENTS.md: el alta es por invitación del psicólogo o por compra, nunca abierta.
  //
  // Ahora el alta sólo existe donde ya se validó la compra, y eso lo garantiza Supabase
  // (no hay endpoint público que crear cuentas) y no sólo el orden de las líneas de acá.
  // email_confirm: true porque la identidad ya está probada — pagó con este email.
  const { data: creado, error: errorCreacion } = await supabaseAdmin.auth.admin.createUser({
    email,
    password,
    email_confirm: true,
    user_metadata: { nombre }, // handle_new_user() lo lee para el nombre inicial del perfil
  })
  if (errorCreacion) return { error: errorCreacion.message }
  if (!creado.user) return { error: 'No se pudo crear la cuenta. Intentá de nuevo.' }

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
