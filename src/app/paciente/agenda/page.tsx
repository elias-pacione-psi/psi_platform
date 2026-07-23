import { createClient } from '@/utils/supabase/server'
import { redirect } from 'next/navigation'
import { CalendarWidget } from '@/components/CalendarWidget'
import { obtenerEventosCalendario } from '@/app/calendarActions'

export const metadata = { title: 'Mi agenda | Espacio Terapéutico' }

export default async function PacienteAgendaPage() {
  const supabase = await createClient()

  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const eventos = await obtenerEventosCalendario()

  return (
    <div className="space-y-6 max-w-5xl mx-auto">
      <div>
        <h1 className="text-4xl font-heading font-bold text-tinta">Mi agenda</h1>
        <p className="text-muted-foreground mt-2 font-sans">
          Tus próximas sesiones. Hacé clic en una para acceder a la videollamada.
        </p>
      </div>

      <div className="flex gap-4 mb-4 text-sm font-semibold font-sans">
        <div className="flex items-center gap-2"><div className="w-3 h-3 rounded-full bg-marca"></div> Sesiones</div>
        <div className="flex items-center gap-2"><div className="w-3 h-3 rounded-full bg-slate-300"></div> Feriados nacionales</div>
      </div>

      <CalendarWidget eventos={eventos} />
    </div>
  )
}
