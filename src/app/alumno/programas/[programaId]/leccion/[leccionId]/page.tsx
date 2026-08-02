import { createClient } from '@/utils/supabase/server'
import { redirect } from 'next/navigation'
import Link from 'next/link'
import { ArrowLeft, ClipboardCheck } from 'lucide-react'
import { DriveIframe } from '@/components/DriveIframe'
import { PdfViewerSeguro } from '@/components/PdfViewerSeguro'
import { MarkdownRico } from '@/components/MarkdownRico'
import { Button } from '@/components/ui/button'
import { esPaginaDePreviewSandboxeable } from '@/lib/utils'
import { firmarUrlsRecursos, firmarUrlEntrega } from '@/utils/supabase/recursos'
import { obtenerPreguntasSinRespuesta } from '@/utils/supabase/quiz'
import { QuizSolver } from './QuizSolver'
import { EntregaForm } from './EntregaForm'
import { CompletarButton } from './CompletarButton'

export default async function LeccionPage(props: { params: Promise<{ programaId: string, leccionId: string }> }) {
  const params = await props.params
  const { programaId, leccionId } = params
  const supabase = await createClient()

  const { data: { user } } = await supabase.auth.getUser()

  const { data: leccionDB, error } = await supabase
    .from('lecciones')
    .select('*')
    .eq('id', leccionId)
    .eq('programa_id', programaId)
    .single()

  if (error || !leccionDB) {
    redirect(`/alumno/programas/${programaId}`)
  }

  // Acceso: programa asignado o ser el instructor
  const [{ data: asignacion }, { data: perfil }] = await Promise.all([
    supabase.from('programas_asignados').select('programa_id').eq('alumno_id', user?.id).eq('programa_id', programaId).maybeSingle(),
    supabase.from('alumnos').select('rol').eq('id', user?.id).single(),
  ])
  if (!asignacion && perfil?.rol !== 'psicologo') {
    redirect('/alumno/programas')
  }

  const { data: progreso } = await supabase
    .from('progreso_lecciones')
    .select('completado')
    .eq('alumno_id', user?.id)
    .eq('leccion_id', leccionId)
    .maybeSingle()
  const completado = !!progreso?.completado

  const [leccion] = await firmarUrlsRecursos([leccionDB])
  const tipo = leccion.tipo_contenido
  const tipoMedio = leccion.tipo_medio as string | null
  // tipo_contenido es una taxonomía histórica (drive_pdf/dropbox_pdf/etc.) que no
  // refleja el origen real del archivo — un PDF de R2 también se guarda como
  // 'drive_pdf' (ver src/utils/taxonomia.ts). Lo que decide si el navegador va a
  // mostrar su visor nativo (con descargar/imprimir) es si la URL es un archivo
  // directo o una página de preview HTML de Drive/Dropbox, no el tipo_contenido.
  const esArchivoDirecto = !!leccion.url_recurso && !esPaginaDePreviewSandboxeable(leccion.url_recurso)

  const Header = (
    <div className="mb-6 flex items-center gap-4">
      <Link href={`/alumno/programas/${programaId}`}>
        <Button variant="outline" size="icon" className="rounded-full"><ArrowLeft className="w-4 h-4" /></Button>
      </Link>
      <h1 className="text-3xl font-heading font-bold text-tinta">{leccion.titulo}</h1>
    </div>
  )

  // --- QUIZ ---
  if (tipo === 'quiz') {
    const preguntas = await obtenerPreguntasSinRespuesta(leccionId)
    return (
      <div className="max-w-4xl mx-auto">
        {Header}
        <QuizSolver preguntas={preguntas} leccionId={leccionId} programaId={programaId} />
      </div>
    )
  }

  // --- ENTREGA ---
  if (tipo === 'entrega') {
    const { data: entregaDB } = await supabase
      .from('entregas')
      .select('archivo_url, comentario_alumno, estado, comentario_instructor')
      .eq('alumno_id', user?.id)
      .eq('leccion_id', leccionId)
      .maybeSingle()
    const entrega = entregaDB ? { ...entregaDB, archivo_firmado: await firmarUrlEntrega(entregaDB.archivo_url) } : null
    return (
      <div className="max-w-4xl mx-auto">
        {Header}
        {leccion.url_recurso && (
          <div className="bg-card rounded-2xl border border-border shadow-sm p-6 md:p-8 mb-6">
            <MarkdownRico>{leccion.url_recurso}</MarkdownRico>
          </div>
        )}
        <div className="bg-card rounded-2xl border border-border shadow-sm p-6 md:p-8">
          <h2 className="text-xl font-heading font-bold text-tinta flex items-center gap-2 mb-4"><ClipboardCheck className="w-5 h-5 text-marca" /> Tu entrega</h2>
          {entrega?.archivo_firmado && (
            <p className="text-sm text-muted-foreground mb-4">Archivo actual: <a href={entrega.archivo_firmado} target="_blank" rel="noreferrer" className="text-marca underline">ver mi entrega</a></p>
          )}
          <EntregaForm leccionId={leccionId} programaId={programaId} entrega={entrega} />
        </div>
      </div>
    )
  }

  // --- VISOR (video/audio/pdf/imagen/texto/enlace) ---
  return (
    <div className="max-w-6xl mx-auto flex flex-col min-h-[calc(100vh-8rem)] pb-8">
      {Header}
      <div className="flex-1 bg-card rounded-2xl shadow-sm border border-border p-6 md:p-8 w-full">
        {tipoMedio === 'pdf' && leccion.url_recurso && (
          <div className="mb-8">
            {esArchivoDirecto
              ? <PdfViewerSeguro url={leccion.url_recurso} />
              : <DriveIframe url={leccion.url_recurso} />}
          </div>
        )}
        {tipoMedio === 'video' && leccion.url_recurso && (
          <div className="mb-8 flex justify-center">
            {esArchivoDirecto
              ? <video src={leccion.url_recurso} controls controlsList="nodownload noremoteplayback" className="w-full max-w-4xl rounded-xl shadow-sm bg-black" />
              : <div className="w-full"><DriveIframe url={leccion.url_recurso} /></div>}
          </div>
        )}
        {tipoMedio === 'audio' && leccion.url_recurso && (
          <div className="mb-8 flex justify-center bg-muted p-8 rounded-xl border border-border">
            {esArchivoDirecto
              ? <audio src={leccion.url_recurso} controls controlsList="nodownload noremoteplayback" className="w-full max-w-2xl" />
              : <div className="w-full"><DriveIframe url={leccion.url_recurso} /></div>}
          </div>
        )}
        {tipoMedio === 'imagen' && leccion.url_recurso && (
          <div className="mb-8 flex justify-center">
            {!esArchivoDirecto ? (
              <div className="w-full max-w-4xl"><DriveIframe url={leccion.url_recurso} /></div>
            ) : (
              // eslint-disable-next-line @next/next/no-img-element
              <img src={leccion.url_recurso} alt={leccion.titulo} className="max-w-full h-auto rounded-xl shadow-sm border border-border" />
            )}
          </div>
        )}
        {tipoMedio === 'markdown' && leccion.url_recurso && (
          <MarkdownRico>{leccion.url_recurso}</MarkdownRico>
        )}

        <div className="mt-12 pt-8 border-t border-border flex justify-center">
          <CompletarButton leccionId={leccionId} programaId={programaId} completadoInicial={completado} />
        </div>
      </div>
    </div>
  )
}
