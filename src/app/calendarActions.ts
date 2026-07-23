'use server'

import { createClient } from '@/utils/supabase/server'

export type EventoCalendario = {
  id: string;
  title: string;
  start: string;
  end: string;
  type: 'sesion' | 'feriado';
  allDay: boolean;
  paciente_id?: string;
  link_videollamada?: string | null;
}

export async function obtenerEventosCalendario(): Promise<EventoCalendario[]> {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return []

  const { data: perfil } = await supabase.from('pacientes').select('rol').eq('id', user.id).single()
  const esPsicologo = perfil?.rol === 'psicologo'

  const eventos: EventoCalendario[] = []

  // 1. SESIONES AGENDADAS
  if (esPsicologo) {
    const { data: sesiones } = await supabase
      .from('agenda_sesiones')
      .select('id, fecha_hora, paciente_id, pacientes(nombre, link_videollamada)')

    if (sesiones) {
      sesiones.forEach(sesion => {
        const start = new Date(sesion.fecha_hora)
        const end = new Date(start.getTime() + 60 * 60 * 1000) // 1 hr
        eventos.push({
          id: `sesion-${sesion.id}`,
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          title: `Sesión - ${(sesion.pacientes as any)?.nombre || 'Paciente'}`,
          start: start.toISOString(),
          end: end.toISOString(),
          type: 'sesion',
          allDay: false,
          paciente_id: sesion.paciente_id,
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          link_videollamada: (sesion.pacientes as any)?.link_videollamada || null
        })
      })
    }
  } else {
    const { data: sesiones } = await supabase
      .from('agenda_sesiones')
      .select('id, fecha_hora, paciente_id, pacientes!inner(link_videollamada)')
      .eq('paciente_id', user.id)

    if (sesiones) {
      sesiones.forEach(sesion => {
        const start = new Date(sesion.fecha_hora)
        const end = new Date(start.getTime() + 60 * 60 * 1000) // 1 hr
        eventos.push({
          id: `sesion-${sesion.id}`,
          title: 'Sesión',
          start: start.toISOString(),
          end: end.toISOString(),
          type: 'sesion',
          allDay: false,
          paciente_id: sesion.paciente_id,
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          link_videollamada: (sesion.pacientes as any)?.link_videollamada || null
        })
      })
    }
  }

  // 2. FERIADOS ARGENTINA (API pública)
  try {
    const year = new Date().getFullYear()
    const res = await fetch(`https://date.nager.at/api/v3/PublicHolidays/${year}/AR`, { next: { revalidate: 86400 } })
    if (res.ok) {
      const feriados = await res.json()
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      feriados.forEach((feriado: any, index: number) => {
        // Feriados vienen como YYYY-MM-DD
        const dateStr = `${feriado.date}T00:00:00`
        eventos.push({
          id: `feriado-${year}-${index}`,
          title: `Feriado: ${feriado.localName}`,
          start: new Date(dateStr).toISOString(),
          end: new Date(dateStr).toISOString(),
          type: 'feriado',
          allDay: true
        })
      })
    }
  } catch (err) {
    console.error('Error fetching feriados', err)
  }

  return eventos
}
