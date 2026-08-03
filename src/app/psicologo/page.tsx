import Link from 'next/link'
import { redirect } from 'next/navigation'
import { createClient } from '@/utils/supabase/server'
import { createAdminClient } from '@/utils/supabase/admin'
import {
  Users, LayoutList, GraduationCap, Inbox, Library, FolderCog, Calendar,
  ArrowRight, CheckCircle2, UserPlus, MapPin, Video,
} from 'lucide-react'

export const metadata = { title: 'Inicio | Elias Pacione' }

// El panel arrancaba directo en la tabla de Alumnos. Esta página es el aterrizaje: qué
// hay para revisar hoy, cuándo es el próximo encuentro y un mapa del resto del panel.
// Todo lo que se muestra es educativo o administrativo (conteos, agenda, entregas
// esperando devolución) — nada de contenido clínico, igual que el resto de la app.
export default async function PsicologoHomePage() {
  const supabase = await createClient()

  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const { data: perfil } = await supabase
    .from('alumnos')
    .select('rol, nombre')
    .eq('id', user.id)
    .single()

  // El layout ya redirige a quien no sea psicólogo, pero acá abajo se lee con
  // service-role (solicitudes_registro no tiene policy de lectura): un permiso que salta
  // RLS no puede depender solo del gating de render.
  if (perfil?.rol !== 'psicologo') redirect('/alumno')

  const supabaseAdmin = createAdminClient()
  const ahora = new Date().toISOString()

  const [
    { count: alumnosActivos },
    { count: entregasPendientes },
    { count: solicitudesPendientes },
    { count: totalProgramas },
    { count: totalCohortes },
    { count: totalRecursos },
    { data: proximaSesion },
  ] = await Promise.all([
    supabase.from('alumnos').select('*', { count: 'exact', head: true }).eq('estado', 'activo').eq('rol', 'alumno'),
    supabase.from('entregas').select('*', { count: 'exact', head: true }).eq('estado', 'entregada'),
    supabaseAdmin.from('solicitudes_registro').select('*', { count: 'exact', head: true }).eq('estado', 'pendiente'),
    supabase.from('programas').select('*', { count: 'exact', head: true }),
    supabase.from('cohortes').select('*', { count: 'exact', head: true }),
    supabase.from('biblioteca_recursos').select('*', { count: 'exact', head: true }),
    supabase
      .from('agenda_sesiones')
      .select('fecha_hora, tipo, lugar, alumnos(nombre), cohortes(nombre)')
      .gte('fecha_hora', ahora)
      .order('fecha_hora', { ascending: true })
      .limit(1)
      .maybeSingle(),
  ])

  const entregas = entregasPendientes ?? 0
  const solicitudes = solicitudesPendientes ?? 0
  const todoAlDia = entregas === 0 && solicitudes === 0

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const conQuien = (proximaSesion as any)?.cohortes?.nombre
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    ?? (proximaSesion as any)?.alumnos?.nombre
    ?? null

  const secciones = [
    { titulo: 'Alumnos', descripcion: 'Cuentas, contacto y programas asignados', url: '/psicologo/alumnos', icon: Users, dato: `${alumnosActivos ?? 0} ${alumnosActivos === 1 ? 'activo' : 'activos'}` },
    { titulo: 'Programas', descripcion: 'Módulos y lecciones de cada formación', url: '/psicologo/programas', icon: LayoutList, dato: `${totalProgramas ?? 0} ${totalProgramas === 1 ? 'programa' : 'programas'}` },
    { titulo: 'Comisiones', descripcion: 'Camadas que cursan juntas', url: '/psicologo/cohortes', icon: GraduationCap, dato: `${totalCohortes ?? 0} ${totalCohortes === 1 ? 'comisión' : 'comisiones'}` },
    { titulo: 'Biblioteca', descripcion: 'Material suelto, con acceso por alumno', url: '/psicologo/biblioteca', icon: Library, dato: `${totalRecursos ?? 0} ${totalRecursos === 1 ? 'recurso' : 'recursos'}` },
    { titulo: 'Archivos', descripcion: 'El bucket: subir y organizar el material', url: '/psicologo/archivos', icon: FolderCog, dato: 'Gestor' },
    { titulo: 'Agenda', descripcion: 'Sesiones únicas o recurrentes', url: '/psicologo/agenda', icon: Calendar, dato: 'Calendario' },
  ]

  return (
    <div className="space-y-8 max-w-5xl mx-auto">
      <div>
        <h1 className="text-4xl font-heading font-bold text-tinta">
          Hola, {perfil?.nombre || 'Elias'}
        </h1>
        <p className="text-lg font-sans text-tinta/70 mt-2">
          Este es tu panel. Acá abajo está lo que espera respuesta y el acceso al resto.
        </p>
      </div>

      <section className="space-y-3">
        <h2 className="text-sm font-sans font-bold uppercase tracking-wide text-muted-foreground">
          Para revisar
        </h2>

        {todoAlDia ? (
          <div className="flex items-center gap-3 bg-card border border-border rounded-2xl p-5 font-sans">
            <CheckCircle2 className="w-5 h-5 text-marca shrink-0" />
            <p className="text-tinta">
              Todo al día: no hay entregas esperando devolución ni solicitudes sin responder.
            </p>
          </div>
        ) : (
          <div className="grid gap-4 sm:grid-cols-2">
            {entregas > 0 && (
              <Link
                href="/psicologo/entregas"
                className="group flex items-center justify-between gap-4 bg-marca/10 border border-marca/30 rounded-2xl p-5 hover:border-marca/60 hover:shadow-sm transition-all"
              >
                <span className="flex items-center gap-4">
                  <Inbox className="w-6 h-6 text-marca shrink-0" />
                  <span className="font-sans">
                    <span className="block text-2xl font-bold text-tinta leading-tight">{entregas}</span>
                    <span className="text-sm text-muted-foreground">
                      {entregas === 1 ? 'entrega espera devolución' : 'entregas esperan devolución'}
                    </span>
                  </span>
                </span>
                <ArrowRight className="w-4 h-4 text-tinta/40 group-hover:text-marca transition-colors shrink-0" />
              </Link>
            )}

            {solicitudes > 0 && (
              <Link
                href="/psicologo/alumnos"
                className="group flex items-center justify-between gap-4 bg-marca/10 border border-marca/30 rounded-2xl p-5 hover:border-marca/60 hover:shadow-sm transition-all"
              >
                <span className="flex items-center gap-4">
                  <UserPlus className="w-6 h-6 text-marca shrink-0" />
                  <span className="font-sans">
                    <span className="block text-2xl font-bold text-tinta leading-tight">{solicitudes}</span>
                    <span className="text-sm text-muted-foreground">
                      {solicitudes === 1 ? 'solicitud sin responder' : 'solicitudes sin responder'}
                    </span>
                  </span>
                </span>
                <ArrowRight className="w-4 h-4 text-tinta/40 group-hover:text-marca transition-colors shrink-0" />
              </Link>
            )}
          </div>
        )}
      </section>

      <section className="space-y-3">
        <h2 className="text-sm font-sans font-bold uppercase tracking-wide text-muted-foreground">
          Próximo encuentro
        </h2>
        <div className="bg-card border border-border rounded-2xl p-5 font-sans">
          {proximaSesion?.fecha_hora ? (
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              <div>
                <p className="text-tinta font-semibold first-letter:uppercase">
                  {new Date(proximaSesion.fecha_hora).toLocaleDateString('es-AR', {
                    weekday: 'long', day: 'numeric', month: 'long',
                  })}
                  {' · '}
                  {new Date(proximaSesion.fecha_hora).toLocaleTimeString('es-AR', {
                    hour: '2-digit', minute: '2-digit', hour12: false,
                  })}
                  {' hs'}
                </p>
                <p className="text-sm text-muted-foreground mt-1 flex items-center gap-1.5">
                  {proximaSesion.tipo === 'presencial'
                    ? <><MapPin className="w-3.5 h-3.5" /> Presencial{proximaSesion.lugar ? ` · ${proximaSesion.lugar}` : ''}</>
                    : <><Video className="w-3.5 h-3.5" /> Virtual</>}
                  {conQuien ? ` · ${conQuien}` : ''}
                </p>
              </div>
              <Link href="/psicologo/agenda" className="text-marca font-semibold text-sm hover:underline underline-offset-4 shrink-0">
                Ver la agenda
              </Link>
            </div>
          ) : (
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              <p className="text-muted-foreground">No hay encuentros agendados por ahora.</p>
              <Link href="/psicologo/agenda" className="text-marca font-semibold text-sm hover:underline underline-offset-4 shrink-0">
                Agendar uno
              </Link>
            </div>
          )}
        </div>
      </section>

      <section className="space-y-3">
        <h2 className="text-sm font-sans font-bold uppercase tracking-wide text-muted-foreground">
          El panel
        </h2>
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {secciones.map((s) => (
            <Link
              key={s.url}
              href={s.url}
              className="group bg-card border border-border rounded-2xl p-5 hover:border-marca/40 hover:shadow-md transition-all"
            >
              <div className="flex items-start justify-between gap-3">
                <s.icon className="w-5 h-5 text-marca shrink-0" />
                <ArrowRight className="w-4 h-4 text-tinta/30 group-hover:text-marca transition-colors shrink-0" />
              </div>
              <h3 className="font-heading font-bold text-tinta mt-3 group-hover:text-marca transition-colors">
                {s.titulo}
              </h3>
              <p className="text-sm text-muted-foreground font-sans mt-1">{s.descripcion}</p>
              <p className="text-xs font-sans font-semibold text-marca mt-3">{s.dato}</p>
            </Link>
          ))}
        </div>
      </section>
    </div>
  )
}
