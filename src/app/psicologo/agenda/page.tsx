import { createClient } from '@/utils/supabase/server'
import { redirect } from 'next/navigation'
import { CalendarWidget } from '@/components/CalendarWidget'
import { obtenerEventosCalendario } from '@/app/calendarActions'
import { AgendaAdminPanel } from './AgendaAdminPanel'

export const metadata = { title: 'Agenda | Espacio Terapéutico' }

export default async function AdminAgendaPage() {
  const supabase = await createClient()

  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const { data: perfil } = await supabase.from('pacientes').select('rol').eq('id', user.id).single()
  if (perfil?.rol !== 'psicologo') redirect('/paciente')

  const eventos = await obtenerEventosCalendario()
  const { data: pacientes } = await supabase
    .from('pacientes')
    .select('id, nombre, email')
    .eq('estado', 'activo')
    .eq('rol', 'paciente')
    .order('nombre', { ascending: true })

  return (
    <div className="space-y-6 max-w-7xl mx-auto">
      <div>
        <h1 className="text-3xl font-heading font-bold text-tinta">Agenda de sesiones</h1>
        <p className="text-muted-foreground mt-2 font-sans">
          Agendá sesiones únicas o recurrentes y visualizá todo tu calendario.
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
        <div className="lg:col-span-1">
          <AgendaAdminPanel pacientes={pacientes || []} />
        </div>

        <div className="lg:col-span-3 space-y-4">
          <div className="flex flex-wrap gap-4 text-sm font-semibold font-sans bg-white p-3 rounded-xl border border-gray-200">
            <div className="flex items-center gap-2"><div className="w-3 h-3 rounded-full bg-marca"></div> Sesiones</div>
            <div className="flex items-center gap-2"><div className="w-3 h-3 rounded-full bg-slate-300"></div> Feriados</div>
          </div>

          <CalendarWidget eventos={eventos} esPsicologo={true} />
        </div>
      </div>
    </div>
  )
}
