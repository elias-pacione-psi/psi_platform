import { createClient } from '@/utils/supabase/server'
import { redirect } from 'next/navigation'
import Link from 'next/link'
import { ArrowLeft } from 'lucide-react'
import { DriveIframe } from '@/components/DriveIframe'
import Markdown from 'react-markdown'
import { Button } from '@/components/ui/button'
import { firmarUrlsRecursos } from '@/utils/supabase/recursos'

export default async function ActividadPage(props: { params: Promise<{ programaId: string, actividadId: string }> }) {
  const params = await props.params;
  const programaId = params.programaId;
  const actividadId = params.actividadId;
  const supabase = await createClient()

  const { data: { user } } = await supabase.auth.getUser()

  const { data: actividadDB, error } = await supabase
    .from('actividades')
    .select('*')
    .eq('id', actividadId)
    .eq('programa_id', programaId)
    .single()

  if (error || !actividadDB) {
    redirect(`/paciente/programas/${programaId}`)
  }

  // Solo se puede acceder a actividades de programas asignados (o siendo el psicólogo)
  const [{ data: asignacion }, { data: perfil }] = await Promise.all([
    supabase
      .from('programas_asignados')
      .select('programa_id')
      .eq('paciente_id', user?.id)
      .eq('programa_id', programaId)
      .maybeSingle(),
    supabase
      .from('pacientes')
      .select('rol')
      .eq('id', user?.id)
      .single(),
  ])

  if (!asignacion && perfil?.rol !== 'psicologo') {
    redirect('/paciente/programas')
  }

  // Los archivos subidos al bucket privado se sirven con URL firmada (RLS ya validó el acceso)
  const [actividad] = await firmarUrlsRecursos([actividadDB])

  return (
    <div className="max-w-6xl mx-auto flex flex-col min-h-[calc(100vh-8rem)] pb-24">
      <div className="mb-6 flex items-center gap-4">
        <Link href={`/paciente/programas/${programaId}`}>
          <Button variant="outline" size="icon" className="rounded-full">
            <ArrowLeft className="w-4 h-4" />
          </Button>
        </Link>
        <div>
          <h1 className="text-3xl font-heading font-bold text-tinta">
            {actividad.titulo}
          </h1>
        </div>
      </div>

      <div className="flex-1 bg-white rounded-2xl shadow-sm border border-gray-100 p-6 md:p-8 w-full relative">
        {['drive_video', 'drive_audio', 'drive_pdf', 'dropbox_video', 'dropbox_audio', 'dropbox_pdf'].includes(actividad.tipo_contenido) && actividad.url_recurso && (
          <div className="mb-8">
            <DriveIframe url={actividad.url_recurso} />
          </div>
        )}

        {actividad.tipo_contenido === 'supabase_video' && actividad.url_recurso && (
          <div className="mb-8 flex justify-center">
            <video src={actividad.url_recurso} controls className="w-full max-w-4xl rounded-xl shadow-sm bg-black" />
          </div>
        )}

        {actividad.tipo_contenido === 'supabase_audio' && actividad.url_recurso && (
          <div className="mb-8 flex justify-center bg-gray-50 p-8 rounded-xl border border-gray-200">
            <audio src={actividad.url_recurso} controls className="w-full max-w-2xl" />
          </div>
        )}

        {actividad.tipo_contenido === 'supabase_pdf' && actividad.url_recurso && (
          <div className="mb-8">
            <iframe src={actividad.url_recurso} className="w-full h-[80vh] rounded-xl border border-gray-200" title="Documento PDF" />
          </div>
        )}

        {actividad.tipo_contenido === 'drive_image' && actividad.url_recurso && (
          <div className="mb-8 flex justify-center">
            {actividad.url_recurso.includes('drive.google.com') ? (
              <div className="w-full max-w-4xl">
                <DriveIframe url={actividad.url_recurso} />
              </div>
            ) : (
              // eslint-disable-next-line @next/next/no-img-element
              <img
                src={actividad.url_recurso}
                alt={actividad.titulo}
                className="max-w-full h-auto rounded-xl shadow-sm border border-gray-200"
              />
            )}
          </div>
        )}

        {actividad.tipo_contenido === 'texto_markdown' && actividad.url_recurso && (
          <div className="prose prose-lg prose-slate max-w-none prose-headings:font-heading prose-a:text-marca">
            <Markdown>{actividad.url_recurso}</Markdown>
          </div>
        )}
      </div>
    </div>
  )
}
