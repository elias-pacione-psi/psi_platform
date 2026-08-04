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

// Mismo esquema (largo y requisitos) que /configurar-password: si difiere, una
// contraseña que pasa acá podría ser rechazada por Supabase igual (o al revés, esta
// pantalla podría ser más floja que la política real) — ver supabase/config.toml
// [auth] minimum_password_length / password_requirements.
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

  // Con el cliente del usuario (no admin): así, si Supabase no exige confirmar el email
  // (enable_confirmations = false en supabase/config.toml), la sesión que arma signUp
  // queda puesta en la cookie de esta respuesta y la persona entra ya logueada.
  const supabase = await createClient()
  const { data, error } = await supabase.auth.signUp({
    email,
    password,
    options: { data: { nombre } }, // handle_new_user() lee esto para el nombre inicial del perfil
  })
  if (error) return { error: error.message }
  if (!data.user) return { error: 'No se pudo crear la cuenta. Intentá de nuevo.' }

  // Con admin client: recién creada, esta cuenta no tiene forma de pasar la policy de
  // `ordenes` por su cuenta (ordenes_select_propia exige alumno_id = auth.uid(), que es
  // justo la columna que se está por completar acá).
  await supabaseAdmin
    .from('ordenes')
    .update({ alumno_id: data.user.id })
    .eq('email_comprador', email)
    .eq('estado', 'pagada')
    .is('alumno_id', null)

  return { success: true, haySesion: Boolean(data.session) }
}
