import 'server-only'
import { Resend } from 'resend'
import type { JSX } from 'react'
import { createAdminClient } from '@/utils/supabase/admin'

// Si la clave no está cargada, las funciones de email fallan silenciosamente
// (log de warning) en vez de romper toda la server action. Mismo patrón que
// mercadoPagoConfigurado() en utils/mercadopago.ts.
const resend = process.env.RESEND_API_KEY
  ? new Resend(process.env.RESEND_API_KEY)
  : null

export const REMITENTE =
  process.env.RESEND_FROM ?? 'notificaciones@eliaspacione.com'

export type TipoEmail =
  | 'asignacion_programa'
  | 'entrega_revisada'
  | 'clase_agendada'
  | 'recordatorio_clase'

export interface OpcionesEmail {
  to: string
  subject: string
  react: JSX.Element
  tipo: TipoEmail
  alumnoId: string
  /** Entrega/sesión/etc. relacionada, para trazabilidad. */
  referenciaId?: string | null
  /** Día (Argentina) que cubre el envío — solo lo usa 'recordatorio_clase' para el dedup. */
  fechaReferencia?: string | null
}

// Se registra con el admin client (no con el de la sesión del psicólogo, que puede no
// existir — el cron no tiene sesión) y nunca se deja que un fallo de auditoría tire el
// envío: el mail ya salió (o ya se decidió que no salía), lo único que puede fallar acá
// es la fila de registro.
async function registrarEnvio(
  opts: OpcionesEmail,
  resultado: { ok: boolean; error?: string; resendId?: string },
) {
  const supabaseAdmin = createAdminClient()
  const { error } = await supabaseAdmin.from('emails_enviados').insert({
    tipo: opts.tipo,
    alumno_id: opts.alumnoId,
    destinatario_email: opts.to,
    referencia_id: opts.referenciaId ?? null,
    fecha_referencia: opts.fechaReferencia ?? null,
    estado: resultado.ok ? 'enviado' : 'error',
    error: resultado.error ?? null,
    resend_id: resultado.resendId ?? null,
  })
  // Puede fallar por el índice único de dedup del recordatorio diario (dos invocaciones
  // del cron casi simultáneas) — eso no es un error real, es "ya lo registró la otra
  // invocación". En cualquier caso el mail en sí ya se mandó, no hay nada que deshacer.
  if (error) console.error('[email] No se pudo registrar en emails_enviados:', error.message)
}

/**
 * Envía un email transaccional. Nunca lanza — devuelve ok/error para que la
 * server action siga funcionando aunque el envío falle.
 */
export async function enviarMail(opts: OpcionesEmail): Promise<{ ok: boolean; error?: string }> {
  if (!resend) {
    console.warn('[resend] RESEND_API_KEY no está configurada — mail omitido:', opts.subject)
    return { ok: false, error: 'RESEND_API_KEY no configurada' }
  }

  const { data, error } = await resend.emails.send({
    from: REMITENTE,
    to: opts.to,
    subject: opts.subject,
    react: opts.react,
  })

  if (error) {
    console.error('[resend] Error al enviar mail:', error)
    await registrarEnvio(opts, { ok: false, error: error.message })
    return { ok: false, error: error.message }
  }

  await registrarEnvio(opts, { ok: true, resendId: data?.id })
  return { ok: true }
}

/**
 * Envía múltiples emails en batch. Resend permite hasta 100 por batch; esta función
 * trocea automáticamente si el array es más largo. Usar esto (no un loop de
 * enviarMail) para cualquier caso que pueda afectar a varios alumnos de una vez —
 * evita golpear el rate limit de Resend con llamadas individuales en paralelo.
 */
export async function enviarMailBatch(
  mails: OpcionesEmail[],
): Promise<{ ok: boolean; enviados: number; errores: string[] }> {
  if (!resend) {
    console.warn('[resend] RESEND_API_KEY no está configurada — batch omitido.')
    return { ok: false, enviados: 0, errores: ['RESEND_API_KEY no configurada'] }
  }
  if (mails.length === 0) return { ok: true, enviados: 0, errores: [] }

  const { render } = await import('react-email')
  const errores: string[] = []
  let enviados = 0

  // Resend batch acepta máximo 100 por llamada
  const CHUNK = 100
  for (let i = 0; i < mails.length; i += CHUNK) {
    const chunk = mails.slice(i, i + CHUNK)
    const payload = await Promise.all(
      chunk.map(async (m) => ({
        from: REMITENTE,
        to: m.to,
        subject: m.subject,
        html: await render(m.react),
      })),
    )

    const { data, error } = await resend.batch.send(payload)
    if (error) {
      // Sin confirmación empírica de si Resend rechaza el batch entero por una sola
      // dirección inválida o procesa el resto — tratamos todo el chunk como fallido,
      // que es el comportamiento seguro (nadie queda logueado como 'enviado' sin
      // haberlo estado). Ver docs/setup-emails.md para el test recomendado.
      errores.push(error.message)
      await Promise.all(chunk.map((m) => registrarEnvio(m, { ok: false, error: error.message })))
    } else {
      enviados += data?.data?.length ?? chunk.length
      await Promise.all(
        chunk.map((m, idx) => registrarEnvio(m, { ok: true, resendId: data?.data?.[idx]?.id })),
      )
    }
  }

  if (errores.length > 0) console.error('[resend] Errores en batch:', errores)

  return { ok: errores.length === 0, enviados, errores }
}
