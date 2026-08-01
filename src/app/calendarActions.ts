'use server'

import { createClient } from '@/utils/supabase/server'

export type EventoCalendario = {
  id: string;
  title: string;
  start: string;
  end: string;
  type: 'sesion' | 'feriado';
  allDay: boolean;
  alumno_id?: string;
  cohorte_id?: string;
  tipo?: 'virtual' | 'presencial';
  lugar?: string | null;
  enlace?: string | null;
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
function armarSesion(sesion: any, titulo: string): EventoCalendario {
  const start = new Date(sesion.fecha_hora)
  const end = new Date(start.getTime() + 60 * 60 * 1000) // 1 hr
  // Enlace de la sesión, o el del alumno como fallback en sesiones individuales virtuales
  const enlace = sesion.enlace || sesion.alumnos?.link_videollamada || null
  return {
    id: `sesion-${sesion.id}`,
    title: titulo,
    start: start.toISOString(),
    end: end.toISOString(),
    type: 'sesion',
    allDay: false,
    alumno_id: sesion.alumno_id || undefined,
    cohorte_id: sesion.cohorte_id || undefined,
    tipo: sesion.tipo,
    lugar: sesion.lugar,
    enlace,
  }
}

export async function obtenerEventosCalendario(): Promise<EventoCalendario[]> {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return []

  const { data: perfil } = await supabase.from('alumnos').select('rol').eq('id', user.id).single()
  const esPsicologo = perfil?.rol === 'psicologo'

  const eventos: EventoCalendario[] = []

  // 1. SESIONES (RLS ya limita al alumno a las suyas + las de su cohorte)
  const { data: sesiones } = await supabase
    .from('agenda_sesiones')
    .select('id, fecha_hora, alumno_id, cohorte_id, tipo, lugar, enlace, alumnos(nombre, link_videollamada), cohortes(nombre)')

  if (sesiones) {
    sesiones.forEach(sesion => {
      let titulo: string
      if (esPsicologo) {
        titulo = sesion.cohorte_id
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          ? `Cohorte: ${(sesion.cohortes as any)?.nombre || ''}`
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          : `Sesión - ${(sesion.alumnos as any)?.nombre || 'Alumno'}`
      } else {
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        titulo = sesion.cohorte_id ? `${(sesion.cohortes as any)?.nombre || 'Cohorte'}` : 'Sesión'
      }
      eventos.push(armarSesion(sesion, titulo))
    })
  }

  // 2. FERIADOS ARGENTINA (API pública)
  try {
    const year = new Date().getFullYear()
    const res = await fetch(`https://date.nager.at/api/v3/PublicHolidays/${year}/AR`, { next: { revalidate: 86400 } })
    if (res.ok) {
      const feriados = await res.json()
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      feriados.forEach((feriado: any, index: number) => {
        const dateStr = `${feriado.date}T00:00:00`
        eventos.push({
          id: `feriado-${year}-${index}`,
          title: `Feriado: ${feriado.localName}`,
          start: new Date(dateStr).toISOString(),
          end: new Date(dateStr).toISOString(),
          type: 'feriado',
          allDay: true,
        })
      })
    }
  } catch (err) {
    console.error('Error fetching feriados', err)
  }

  return eventos
}
