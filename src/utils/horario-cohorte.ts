// Horario de cursada de una cohorte → fechas concretas de clase.
//
// Sin 'server-only': el diálogo de la cohorte usa las mismas funciones para mostrar la
// vista previa ("se van a agendar N clases") antes de que el psicólogo confirme. Que el
// preview y la generación real salgan del mismo código es justamente el punto — si
// fueran dos implementaciones, el número de la vista previa podría mentir.

// La cursada pasa en Argentina, que no tiene horario de verano: -03:00 todo el año. Se
// fija explícitamente porque `new Date('2026-08-08T08:00')` se interpreta en la zona del
// runtime, y en Vercel eso es UTC — una clase de las 8 quedaría agendada a las 5 de la
// mañana.
const OFFSET_ARGENTINA = '-03:00'

// Convierte "2026-08-05" + "21:00" en el instante UTC correspondiente a esa hora EN
// ARGENTINA. Lo usan las tres vías que agendan (sesión única, recurrentes y clases de
// comisión) para que "21:00" signifique lo mismo en todas: antes cada una hacía
// `new Date(...)` a secas y quedaba a merced de la zona del servidor — en Vercel UTC, en
// una máquina local la que tenga puesta — así que la misma hora escrita a mano y la
// generada automáticamente caían en instantes distintos.
export function instanteArgentina(fecha: string, hora: string): string {
  return new Date(`${fecha}T${hora.slice(0, 5)}:00${OFFSET_ARGENTINA}`).toISOString()
}

// El orden es el de la semana laboral, no el numérico: `valor` sigue la convención de
// JS/Postgres (0 = domingo) porque es la que se guarda en cohortes.dias_semana.
export const DIAS_SEMANA = [
  { valor: 1, corto: 'Lun', largo: 'lunes' },
  { valor: 2, corto: 'Mar', largo: 'martes' },
  { valor: 3, corto: 'Mié', largo: 'miércoles' },
  { valor: 4, corto: 'Jue', largo: 'jueves' },
  { valor: 5, corto: 'Vie', largo: 'viernes' },
  { valor: 6, corto: 'Sáb', largo: 'sábado' },
  { valor: 0, corto: 'Dom', largo: 'domingo' },
] as const

// Tope de seguridad: un rango de fechas mal cargado (2026 → 2126) generaría decenas de
// miles de filas de agenda antes de que nadie se dé cuenta.
export const MAXIMO_CLASES = 400

export type HorarioCohorte = {
  fecha_inicio: string | null // YYYY-MM-DD
  fecha_fin: string | null    // YYYY-MM-DD
  dias_semana: number[] | null
  hora_inicio: string | null  // HH:MM o HH:MM:SS
  hora_fin: string | null
}

export function horarioCompleto(c: HorarioCohorte): boolean {
  return Boolean(
    c.fecha_inicio && c.fecha_fin && c.hora_inicio &&
    c.dias_semana && c.dias_semana.length > 0,
  )
}

export function duracionMinutos(horaInicio: string, horaFin: string | null): number {
  if (!horaFin) return 60
  const min = (h: string) => {
    const [hh, mm] = h.split(':')
    return Number(hh) * 60 + Number(mm)
  }
  const diferencia = min(horaFin) - min(horaInicio)
  // El check de la tabla exige 15..720; devolver algo fuera de rango haría fallar el
  // insert entero en vez de degradarse a la duración por defecto.
  return diferencia >= 15 && diferencia <= 720 ? diferencia : 60
}

// Fechas (ISO, en UTC) de todas las clases del horario dentro del rango de la cohorte.
// El recorrido se hace sobre fechas ancladas en UTC para que el día de la semana no
// dependa de la zona horaria del runtime; recién al armar cada clase se aplica el offset
// de Argentina.
export function fechasDeClases(c: HorarioCohorte): string[] {
  if (!horarioCompleto(c)) return []

  const dias = new Set(c.dias_semana as number[])
  const [ai, mi, di] = (c.fecha_inicio as string).split('-').map(Number)
  const [af, mf, df] = (c.fecha_fin as string).split('-').map(Number)

  const cursor = new Date(Date.UTC(ai, mi - 1, di))
  const fin = Date.UTC(af, mf - 1, df)
  const hora = (c.hora_inicio as string).slice(0, 5)

  const fechas: string[] = []
  while (cursor.getTime() <= fin && fechas.length < MAXIMO_CLASES) {
    if (dias.has(cursor.getUTCDay())) {
      fechas.push(instanteArgentina(cursor.toISOString().slice(0, 10), hora))
    }
    cursor.setUTCDate(cursor.getUTCDate() + 1)
  }

  return fechas
}

export function etiquetaHorario(c: HorarioCohorte): string | null {
  if (!c.hora_inicio || !c.dias_semana || c.dias_semana.length === 0) return null

  const dias = DIAS_SEMANA
    .filter((d) => (c.dias_semana as number[]).includes(d.valor))
    .map((d) => d.largo)

  const lista = dias.length === 1
    ? dias[0]
    : `${dias.slice(0, -1).join(', ')} y ${dias[dias.length - 1]}`

  const desde = c.hora_inicio.slice(0, 5)
  return c.hora_fin ? `${lista} de ${desde} a ${c.hora_fin.slice(0, 5)}` : `${lista} a las ${desde}`
}
