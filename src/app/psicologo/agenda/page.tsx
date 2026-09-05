import { createClient } from '@/utils/supabase/server'
import { redirect } from 'next/navigation'
import { CalendarWidget } from '@/components/CalendarWidget'
import { obtenerEventosCalendario } from '@/app/calendarActions'
import { AgendaAdminPanel } from './AgendaAdminPanel'

export const metadata = { title: 'Agenda | Elias Pacione' }

export default async function AdminAgendaPage() {
  const supabase = await createClient()

  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const { data: perfil } = await supabase.from('alumnos').select('rol').eq('id', user.id).single()
  if (perfil?.rol !== 'psicologo') redirect('/alumno')

  const eventos = await obtenerEventosCalendario()
  // Alumnos y pacientes en la misma query: para la agenda son lo mismo (una sesión
  // individual con alguien que recibe el aviso por email), y se separan sólo para
  // mostrarlos en dos grupos del selector.
  const [{ data: personas }, { data: cohortes }] = await Promise.all([
    supabase
      .from('alumnos')
      .select('id, nombre, email, rol')
      .eq('estado', 'activo')
      .in('rol', ['alumno', 'paciente'])
      .order('nombre', { ascending: true }),
    supabase
      .from('cohortes')
      .select('id, nombre')
      .order('created_at', { ascending: false }),
  ])

  const alumnos = (personas ?? []).filter((p: { rol: string }) => p.rol === 'alumno')
  const pacientes = (personas ?? []).filter((p: { rol: string }) => p.rol === 'paciente')

  return (
    <div className="space-y-6 max-w-7xl mx-auto">
      <div>
        <h1 className="text-3xl font-heading font-bold text-tinta">Agenda de sesiones</h1>
        <p className="text-muted-foreground mt-2 font-sans">
          Agendá sesiones únicas o recurrentes con alumnos, pacientes o una formación
          entera. Cada persona recibe el aviso por email.
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
        <div className="lg:col-span-1">
          <AgendaAdminPanel alumnos={alumnos} pacientes={pacientes} cohortes={cohortes || []} />
        </div>

        <div className="lg:col-span-3 space-y-4">
          <div className="flex flex-wrap gap-4 text-sm font-semibold font-sans bg-card p-3 rounded-xl border border-border">
            <div className="flex items-center gap-2"><div className="w-3 h-3 rounded-full bg-marca"></div> Sesiones</div>
            <div className="flex items-center gap-2"><div className="w-3 h-3 rounded-full bg-slate-300"></div> Feriados</div>
          </div>

          <CalendarWidget eventos={eventos} esPsicologo={true} />
        </div>
      </div>
    </div>
  )
}
