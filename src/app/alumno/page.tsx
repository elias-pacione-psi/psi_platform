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
      .select('fecha_hora, duracion_minutos, tipo, lugar, cohortes(nombre)')
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
        <Card className="border-none shadow-md hover:shadow-lg transition-shadow duration-300">
          <CardHeader>
            <CardTitle className="font-heading text-2xl text-tinta">Tu próximo encuentro</CardTitle>
            <CardDescription className="font-sans text-base">
              Fecha de tu próximo encuentro y acceso a la videollamada.
            </CardDescription>
          </CardHeader>
          <CardContent>
            {proximaSesion?.fecha_hora ? (
              // Todo esto salía hardcodeado ("Presencial · Dignos, Quilmes", "8:00 a
              // 12:00 hs", "Encuentro 1 · Laboratorio de Escucha Activa"): mostraba lo
              // mismo para cualquier sesión, sin importar cuál fuera. Ahora sale de la
              // fila, con duracion_minutos para calcular la hora de fin.
              <div className="mb-4 p-4 bg-crema rounded-xl border border-tinta/10">
                <p className="text-marca font-sans font-semibold mb-1">
                  {proximaSesion.tipo === 'presencial'
                    ? `Presencial${proximaSesion.lugar ? ` · ${proximaSesion.lugar}` : ''}`
                    : 'Virtual'}
                </p>
                <p className="text-tinta font-serif font-medium mb-1">
                  <span className="font-bold first-letter:uppercase">
                    {new Date(proximaSesion.fecha_hora).toLocaleDateString('es-AR', { weekday: 'long', day: 'numeric', month: 'long' })}
                  </span>
                  {', '}
                  {new Date(proximaSesion.fecha_hora).toLocaleTimeString('es-AR', { hour: '2-digit', minute: '2-digit', hour12: false })}
                  {' a '}
                  {new Date(new Date(proximaSesion.fecha_hora).getTime() + (proximaSesion.duracion_minutos ?? 60) * 60000)
                    .toLocaleTimeString('es-AR', { hour: '2-digit', minute: '2-digit', hour12: false })}
                  {' hs'}
                </p>
                {/* eslint-disable-next-line @typescript-eslint/no-explicit-any */}
                {(proximaSesion as any).cohortes?.nombre && (
                  <p className="text-tinta font-sans font-medium border-t border-tinta/10 pt-3 mt-3">
                    {/* eslint-disable-next-line @typescript-eslint/no-explicit-any */}
                    {(proximaSesion as any).cohortes.nombre}
                  </p>
                )}
              </div>
            ) : (
              <div className="mb-4 p-4 bg-crema rounded-xl border border-tinta/10 text-center">
                <p className="text-muted-foreground font-sans text-sm">No hay encuentros agendados por ahora.</p>
              </div>
            )}

            {alumno?.link_videollamada ? (
              <JoinMeetButton linkVideollamada={alumno.link_videollamada} />
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
