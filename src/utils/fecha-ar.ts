// Formateo de fechas SIEMPRE en hora de Argentina.
//
// Sin 'server-only': lo usan tanto RSC como componentes de cliente, y ese es
// justamente el punto. `toLocaleDateString('es-AR', …)` sin `timeZone` no formatea en
// hora argentina: formatea en la zona del runtime. En el servidor de Vercel eso es UTC,
// así que una clase de las 21:00 (guardada como 00:00 UTC del día siguiente, ver
// utils/horario-cohorte.ts) se mostraba como "mañana a las 00:00" — día equivocado y
// hora equivocada, en la tarjeta del inicio, en la agenda y en los mails.
//
// En un componente de cliente el bug es más sutil pero existe igual: el HTML del primer
// render lo produce el servidor (UTC) y recién la hidratación lo corrige con la zona del
// navegador, así que la fecha parpadea y React marca un mismatch. Fijar la zona explícita
// hace que servidor y navegador coincidan siempre.
//
// La contracara: es la misma decisión que ya toma horario-cohorte.ts al guardar con
// -03:00 fijo. La cursada pasa en Argentina; un alumno que viaje a otro país tiene que
// seguir viendo el horario de la clase, no el de donde esté.

export const ZONA_AR = 'America/Argentina/Buenos_Aires'

const conZona = (opciones: Intl.DateTimeFormatOptions): Intl.DateTimeFormatOptions => ({
  ...opciones,
  timeZone: ZONA_AR,
})

/** "lunes, 25 de agosto" — para encabezados de próxima clase. */
export function fechaLarga(iso: string | Date): string {
  return new Date(iso).toLocaleDateString(
    'es-AR',
    conZona({ weekday: 'long', day: 'numeric', month: 'long' }),
  )
}

/** "lunes, 25 de agosto de 2026" — cuando el año aporta (fechas de cohorte). */
export function fechaLargaConAnio(iso: string | Date): string {
  return new Date(iso).toLocaleDateString(
    'es-AR',
    conZona({ weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' }),
  )
}

/** "25 ago 2026" — para tablas y listados donde el espacio importa. */
export function fechaCorta(iso: string | Date): string {
  return new Date(iso).toLocaleDateString(
    'es-AR',
    conZona({ day: 'numeric', month: 'short', year: 'numeric' }),
  )
}

/** "25/8/2026" — numérica, para columnas de metadatos. */
export function fechaNumerica(iso: string | Date): string {
  return new Date(iso).toLocaleDateString('es-AR', conZona({}))
}

/** "21:00" — 24 horas, que es como se habla de horarios de cursada acá. */
export function hora(iso: string | Date): string {
  return new Date(iso).toLocaleTimeString(
    'es-AR',
    conZona({ hour: '2-digit', minute: '2-digit', hour12: false }),
  )
}

/** "25 ago 2026, 21:00" — fecha y hora juntas en una línea. */
export function fechaHoraCorta(iso: string | Date): string {
  return `${fechaCorta(iso)}, ${hora(iso)}`
}

// Una columna `date` de Postgres (fecha_inicio/fecha_fin de una cohorte) llega como
// "2026-09-01", sin hora ni zona. `new Date("2026-09-01")` la interpreta como medianoche
// UTC, que en Argentina es las 21:00 del 31 de agosto: la fecha se corre un día para
// atrás. Se le agrega el offset argentino explícito para que el día sea el que dice.
export function fechaSoloDia(fecha: string): string {
  return fechaLargaConAnio(new Date(`${fecha}T00:00:00-03:00`))
}
