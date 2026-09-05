import { createClient } from '@/utils/supabase/server'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { LayoutList, FolderHeart, ArrowRight } from 'lucide-react'
import Link from 'next/link'
import { JoinMeetButton } from './JoinMeetButton'
import { RecomendacionCursos } from '@/components/RecomendacionCursos'
import { fechaLarga, hora } from '@/utils/fecha-ar'

export const dynamic = 'force-dynamic';
export const revalidate = 0;

// Contador de la tarjeta "Tu material": lo asignado a mano (recursos_asignados) más lo
// que le llega por las comisiones en las que está (Libros y Documentos de la formación,
// tabla puente cohortes_recursos), sin duplicar los que llegan por ambos caminos. Misma
// lógica que la página de Biblioteca; acá solo hace falta el número.
// eslint-disable-next-line @typescript-eslint/no-explicit-any
async function contarMaterialesDeAlumno(supabase: any, uid: string): Promise<number> {
  const [{ data: directos }, { data: inscripciones }] = await Promise.all([
    supabase.from('recursos_asignados').select('recurso_id').eq('alumno_id', uid),
    supabase.from('cohortes_alumnos').select('cohorte_id').eq('alumno_id', uid),
  ])

  const ids = new Set<string>((directos ?? []).map((r: { recurso_id: string }) => r.recurso_id))

  const idsCohortes = (inscripciones ?? []).map((i: { cohorte_id: string }) => i.cohorte_id)
  if (idsCohortes.length > 0) {
    // Si la tabla puente todavía no existe (migración sin correr), el contador queda con
    // lo asignado a mano, como siempre.
    const { data: puente, error } = await supabase
      .from('cohortes_recursos')
      .select('recurso_id')
      .in('cohorte_id', idsCohortes)
    if (!error) for (const p of puente ?? []) ids.add(p.recurso_id)
  }

  return ids.size
}

export default async function AlumnoHomePage() {
  const supabase = await createClient()

  const { data: { user } } = await supabase.auth.getUser()

  const { data: perfil } = await supabase.from('alumnos').select('rol, nombre, link_videollamada, es_alumno, es_paciente').eq('id', user?.id).single()
  const esPsicologo = perfil?.rol === 'psicologo'
  // Quien es SÓLO paciente no cursa nada: no se le muestran programas ni se le recomiendan
  // cursos, y lo que tiene agendado es una sesión, no una clase. Si además es alumno ve la
  // vista completa, que ya cubre las dos cosas.
  const esPaciente = Boolean(perfil?.es_paciente) && !perfil?.es_alumno

  const [{ data: proximaSesion }, { count: countProg }, countRec] = await Promise.all([
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
      ? supabase.from('biblioteca_recursos').select('*', { count: 'exact', head: true }).then((r: { count: number | null }) => r.count ?? 0)
      : contarMaterialesDeAlumno(supabase, user?.id ?? ''),
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
          {esPaciente
            ? 'Acá están tus próximas sesiones y el material que te compartió tu psicólogo.'
            : 'Bienvenido a tu espacio de formación. Acá está el material de tus cursos.'}
        </p>
      </div>

      <div className="grid gap-6 md:grid-cols-2">
        <Card className="border-none shadow-md hover:shadow-lg transition-shadow duration-300 ring-1 ring-marca/20">
          <CardHeader>
            <CardTitle className="font-heading text-2xl text-tinta">
              {esPaciente ? 'Tu próxima sesión' : 'Tu clase en vivo'}
            </CardTitle>
            <CardDescription className="font-sans text-base">
              Únete a nuestra sesión de Google Meet programada.
            </CardDescription>
          </CardHeader>
          <CardContent>
            {proximaSesion?.fecha_hora ? (
              <div className="mb-6 p-4 bg-crema rounded-xl border border-tinta/10 text-center">
                <p className="font-sans font-medium text-tinta mb-1">
                  Tu próxima {esPaciente ? 'sesión' : 'clase'} es el <span className="font-bold">{fechaLarga(proximaSesion.fecha_hora)}</span> a las <span className="font-bold">{hora(proximaSesion.fecha_hora)}hs</span>
                </p>
              </div>
            ) : (
              <div className="mb-6 p-4 bg-crema rounded-xl border border-tinta/10 text-center">
                <p className="text-tinta/70 font-sans text-sm">
                  {esPaciente ? 'No tenés sesiones agendadas por ahora.' : 'No hay clases en vivo agendadas por ahora.'}
                </p>
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
            {!esPaciente && <Link href="/alumno/programas" className="flex items-center justify-between p-4 bg-crema rounded-xl border border-tinta/10 hover:border-marca/40 hover:shadow-sm transition-all group">
              <span className="flex items-center gap-3">
                <LayoutList className="w-5 h-5 text-marca" />
                <span className="font-sans font-semibold text-tinta">
                  {cantidadProgramas || 0} {cantidadProgramas === 1 ? 'programa asignado' : 'programas asignados'}
                </span>
              </span>
              <ArrowRight className="w-4 h-4 text-tinta/40 group-hover:text-marca transition-colors" />
            </Link>}
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

      {/* Cuenta recién creada desde la compra de un ebook: no tiene ningún programa
          asignado todavía, así que las dos tarjetas de arriba son dos ceros y la pantalla
          es un callejón sin salida. Ahí es donde la recomendación de cursos tiene sentido
          — con material asignado, en cambio, lo que corresponde es que siga con lo suyo,
          no que le ofrezcan otra cosa. */}
      {!esPsicologo && !esPaciente && cantidadProgramas === 0 && (
        <Card className="border-none shadow-md">
          <CardContent className="pt-6">
            <RecomendacionCursos />
          </CardContent>
        </Card>
      )}
    </div>
  )
}
