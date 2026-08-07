import { NextRequest, NextResponse } from 'next/server'
import { createAdminClient } from '@/utils/supabase/admin'
import { enviarMailBatch, type OpcionesEmail } from '@/utils/email/resend'
import { RecordatorioClaseEmail } from '@/emails/RecordatorioClaseEmail'
import { baseUrl } from '@/utils/site-url'

// Cron diario (ver vercel.json — 12:00 UTC = 09:00 AR, Argentina no tiene horario de
// verano). Protegido por CRON_SECRET: Vercel manda ese valor como header
// `Authorization: Bearer $CRON_SECRET` en cada invocación real. Ver docs/setup-emails.md
// para el paso de configuración y para probarlo a mano con curl.

export const maxDuration = 60

export async function GET(req: NextRequest) {
  const secret = process.env.CRON_SECRET
  const authHeader = req.headers.get('authorization')
  if (!secret || authHeader !== `Bearer ${secret}`) {
    return NextResponse.json({ error: 'No autorizado' }, { status: 401 })
  }

  const supabaseAdmin = createAdminClient()

  // Buscar sesiones del DÍA SIGUIENTE (Argentina, UTC-3). Se calcula en UTC:
  // "mañana" va de 03:00 UTC (00:00 AR) a 26:59:59.999 UTC (23:59:59.999 AR del día
  // siguiente) — setUTCHours acepta valores fuera de 0-23 y hace overflow al día
  // siguiente, así que "26" da exactamente las 02:59:59.999 UTC de dos días después de
  // hoy, que es 23:59:59.999 AR de mañana. La aritmética rara es a propósito, no un bug.
  const ahoraUTC = new Date()
  const mananaAR_inicio = new Date(ahoraUTC)
  mananaAR_inicio.setUTCHours(3, 0, 0, 0)     // 00:00 AR = 03:00 UTC
  mananaAR_inicio.setUTCDate(mananaAR_inicio.getUTCDate() + 1)

  const mananaAR_fin = new Date(mananaAR_inicio)
  mananaAR_fin.setUTCHours(26, 59, 59, 999)   // 23:59:59.999 AR del día siguiente

  // Día calendario (Argentina) que cubre este resumen — clave de dedup en emails_enviados.
  const fechaReferencia = mananaAR_inicio.toISOString().slice(0, 10)

  const { data: sesiones, error } = await supabaseAdmin
    .from('agenda_sesiones')
    .select(`
      id,
      alumno_id,
      cohorte_id,
      fecha_hora,
      tipo,
      lugar,
      enlace,
      duracion_minutos,
      alumnos(id, email, nombre, link_videollamada, estado),
      cohortes(nombre, cohortes_alumnos(alumnos(id, email, nombre, estado)))
    `)
    .gte('fecha_hora', mananaAR_inicio.toISOString())
    .lte('fecha_hora', mananaAR_fin.toISOString())

  if (error) {
    console.error('[cron/recordatorios] Error leyendo agenda:', error.message)
    return NextResponse.json({ error: error.message }, { status: 500 })
  }

  if (!sesiones || sesiones.length === 0) {
    return NextResponse.json({ mensaje: 'Sin sesiones mañana', enviados: 0 })
  }

  const urlAgenda = `${baseUrl()}/alumno/agenda`
  const mails: OpcionesEmail[] = []
  const alumnoIdsEnJuego = new Set<string>()

  for (const sesion of sesiones) {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const s = sesion as any
    const fechaHora: string = s.fecha_hora
    const tipo: 'virtual' | 'presencial' = s.tipo

    if (s.alumno_id && s.alumnos?.estado === 'activo') {
      // Sesión individual
      const enlace = s.enlace || s.alumnos.link_videollamada || undefined
      alumnoIdsEnJuego.add(s.alumnos.id)
      mails.push({
        to: s.alumnos.email,
        subject: 'Recordatorio: mañana tenés sesión',
        tipo: 'recordatorio_clase',
        alumnoId: s.alumnos.id,
        fechaReferencia,
        react: RecordatorioClaseEmail({
          nombre: s.alumnos.nombre,
          contexto: 'Sesión individual',
          tipo,
          fechaHora,
          duracionMinutos: s.duracion_minutos,
          lugar: s.lugar,
          enlace,
          urlAgenda,
        }),
      })
    } else if (s.cohorte_id && s.cohortes) {
      // Sesión grupal — un mail por cada alumno activo de la comisión
      const nombreCohorte: string = s.cohortes.nombre
      const inscriptos: { alumnos: { id: string; email: string; nombre: string; estado: string } | null }[] =
        s.cohortes.cohortes_alumnos ?? []

      for (const r of inscriptos) {
        if (!r.alumnos || r.alumnos.estado !== 'activo') continue
        alumnoIdsEnJuego.add(r.alumnos.id)
        mails.push({
          to: r.alumnos.email,
          subject: `Recordatorio: mañana tenés clase — ${nombreCohorte}`,
          tipo: 'recordatorio_clase',
          alumnoId: r.alumnos.id,
          fechaReferencia,
          react: RecordatorioClaseEmail({
            nombre: r.alumnos.nombre,
            contexto: nombreCohorte,
            tipo,
            fechaHora,
            duracionMinutos: s.duracion_minutos,
            lugar: s.lugar,
            enlace: s.enlace,
            urlAgenda,
          }),
        })
      }
    }
  }

  // Dedup real contra la tabla, no solo contra el índice único: si el cron ya corrió
  // hoy (Vercel puede invocar el mismo cron más de una vez), no se re-arma ni se
  // re-intenta mandar lo que ya salió.
  let mailsAEnviar = mails
  if (alumnoIdsEnJuego.size > 0) {
    const { data: yaNotificados } = await supabaseAdmin
      .from('emails_enviados')
      .select('alumno_id')
      .eq('tipo', 'recordatorio_clase')
      .eq('fecha_referencia', fechaReferencia)
      .eq('estado', 'enviado')
      .in('alumno_id', [...alumnoIdsEnJuego])

    const yaNotificadosSet = new Set((yaNotificados ?? []).map((r: { alumno_id: string }) => r.alumno_id))
    mailsAEnviar = mails.filter((m) => !yaNotificadosSet.has(m.alumnoId))
  }

  const resultado = mailsAEnviar.length > 0
    ? await enviarMailBatch(mailsAEnviar)
    : { ok: true, enviados: 0, errores: [] }

  console.log(
    `[cron/recordatorios] Sesiones mañana: ${sesiones.length} · Mails preparados: ${mails.length} · `
    + `Ya notificados (omitidos): ${mails.length - mailsAEnviar.length} · Enviados: ${resultado.enviados}`,
    resultado.errores.length > 0 ? `· Errores: ${resultado.errores.join(', ')}` : '',
  )

  return NextResponse.json({
    sesiones: sesiones.length,
    mails_preparados: mails.length,
    omitidos_ya_notificados: mails.length - mailsAEnviar.length,
    enviados: resultado.enviados,
    errores: resultado.errores,
  })
}
