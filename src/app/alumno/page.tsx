import { createClient } from '@/utils/supabase/server'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { LayoutList, FolderHeart, ArrowRight } from 'lucide-react'
import Link from 'next/link'
import { JoinMeetButton } from './JoinMeetButton'

export const dynamic = 'force-dynamic';
export const revalidate = 0;

export default async function AlumnoHomePage() {
  const supabase = await createClient()

  const { data: { user } } = await supabase.auth.getUser()

  const { data: perfil } = await supabase.from('alumnos').select('rol, nombre, link_videollamada').eq('id', user?.id).single()
  const esPsicologo = perfil?.rol === 'psicologo'

  const [{ data: proximaSesion }, { count: countProg }, { count: countRec }] = await Promise.all([
    supabase
      .from('agenda_sesiones')
      .select('fecha_hora, duracion_minutos, tipo, lugar, enlace, cohortes(nombre)')
      .gte('fecha_hora', new Date().toISOString())
      .order('fecha_hora', { ascending: true })
      .limit(1)
      .maybeSingle(),
    esPsicologo
      ? supabase.from('programas').select('*', { count: 'exact', head: true })
      : supabase.from('programas_asignados').select('*', { count: 'exact', head: true }).eq('alumno_id', user?.id),
    esPsicologo
      ? supabase.from('biblioteca_recursos').select('*', { count: 'exact', head: true })
      : supabase.from('recursos_asignados').select('*', { count: 'exact', head: true }).eq('alumno_id', user?.id),
  ])

  const alumno = perfil
  const cantidadProgramas = countProg || 0
  const cantidadMateriales = countRec || 0

  const linkFinal = proximaSesion?.enlace || alumno?.link_videollamada || (esPsicologo ? 'https://meet.google.com' : null)

  return (
    <div className="space-y-8 max-w-4xl mx-auto">
      <div>
        <h1 className="text-4xl font-heading font-bold text-tinta">
          Hola, {alumno?.nombre || 'Alumno'}
        </h1>
        <p className="text-lg font-sans text-tinta/70 mt-2">
          Bienvenido a tu espacio de formación. Acá está el material de tus cursos.
        </p>
      </div>

      <div className="grid gap-6 md:grid-cols-2">
        <Card className="border-none shadow-md hover:shadow-lg transition-shadow duration-300 bg-[#1e293b]">
          <CardHeader>
            <CardTitle className="font-heading text-2xl text-white">Tu clase en vivo</CardTitle>
            <CardDescription className="font-sans text-base text-white/70">
              Únete a nuestra sesión de Google Meet programada.
            </CardDescription>
          </CardHeader>
          <CardContent>
            {proximaSesion?.fecha_hora ? (
              <div className="mb-6 p-4 bg-white/5 rounded-xl border border-white/10 text-center">
                <p className="font-sans font-medium text-white mb-1">
                  Tu próxima clase es el <span className="font-bold">{new Date(proximaSesion.fecha_hora).toLocaleDateString('es-AR', { weekday: 'long', day: 'numeric', month: 'long' })}</span> a las <span className="font-bold">{new Date(proximaSesion.fecha_hora).toLocaleTimeString('es-AR', { hour: '2-digit', minute: '2-digit', hour12: false })}hs</span>
                </p>
              </div>
            ) : (
              <div className="mb-6 p-4 bg-white/5 rounded-xl border border-white/10 text-center">
                <p className="text-white/70 font-sans text-sm">No hay clases en vivo agendadas por ahora.</p>
              </div>
            )}

            {linkFinal ? (
              <JoinMeetButton linkVideollamada={linkFinal} />
            ) : null}
          </CardContent>
        </Card>

        <Card className="border-none shadow-md hover:shadow-lg transition-shadow duration-300">
          <CardHeader>
            <CardTitle className="font-heading text-2xl text-tinta">Tu material</CardTitle>
            <CardDescription className="font-sans text-base">
              Contenido asignado para trabajar entre sesiones.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-3">
            <Link href="/alumno/programas" className="flex items-center justify-between p-4 bg-crema rounded-xl border border-tinta/10 hover:border-marca/40 hover:shadow-sm transition-all group">
              <span className="flex items-center gap-3">
                <LayoutList className="w-5 h-5 text-marca" />
                <span className="font-sans font-semibold text-tinta">
                  {cantidadProgramas || 0} {cantidadProgramas === 1 ? 'programa asignado' : 'programas asignados'}
                </span>
              </span>
              <ArrowRight className="w-4 h-4 text-tinta/40 group-hover:text-marca transition-colors" />
            </Link>
            <Link href="/alumno/materiales" className="flex items-center justify-between p-4 bg-crema rounded-xl border border-tinta/10 hover:border-marca/40 hover:shadow-sm transition-all group">
              <span className="flex items-center gap-3">
                <FolderHeart className="w-5 h-5 text-marca" />
                <span className="font-sans font-semibold text-tinta">
                  {cantidadMateriales || 0} {cantidadMateriales === 1 ? 'material de apoyo' : 'materiales de apoyo'}
                </span>
              </span>
              <ArrowRight className="w-4 h-4 text-tinta/40 group-hover:text-marca transition-colors" />
            </Link>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
