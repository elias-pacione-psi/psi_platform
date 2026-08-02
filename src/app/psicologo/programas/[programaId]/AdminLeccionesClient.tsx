'use client'

import { useState, useTransition } from 'react'
import Link from 'next/link'
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from "@/components/ui/table"
import {
  Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle,
} from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { guardarLeccion, eliminarLeccion, guardarModulo, eliminarModulo, moverModulo, moverLeccion, guardarQuizPreguntas } from '../../actions'
import { QuizBuilder, jsonAPreguntas, preguntasAJson, type PreguntaQuiz } from './QuizBuilder'
import { Loader2, Settings2, Plus, ArrowLeft, Trash2, FolderOpen, ChevronUp, ChevronDown, ListChecks, FileUp } from 'lucide-react'
import { createClient } from '@/utils/supabase/client'
import { toast } from 'sonner'
import { SelectorArchivoR2 } from '@/components/SelectorArchivoR2'
import { LABEL_TIPO_MEDIO, LABEL_ORIGEN } from '@/utils/taxonomia-labels'

const TIPO_LABEL: Record<string, string> = {
  drive_video: 'Video', drive_audio: 'Audio', drive_pdf: 'PDF', drive_image: 'Imagen',
  dropbox_video: 'Video', dropbox_audio: 'Audio', dropbox_pdf: 'PDF',
  supabase_video: 'Video', supabase_audio: 'Audio', supabase_pdf: 'PDF',
  texto_markdown: 'Texto', quiz: 'Quiz', entrega: 'Entrega',
}

const TIPO_CONTENIDO_DEFAULT = 'drive_video'

// timestamptz de la DB -> formato que espera <input type="datetime-local"> (sin zona/segundos)
function aFechaLimiteInput(fechaIso?: string | null): string {
  if (!fechaIso) return ''
  const d = new Date(fechaIso)
  if (isNaN(d.getTime())) return ''
  const pad = (n: number) => String(n).padStart(2, '0')
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}`
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export function AdminLeccionesClient({ programa, modulos, lecciones }: { programa: any, modulos: any[], lecciones: any[] }) {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const [selectedLeccion, setSelectedLeccion] = useState<any>(null)
  const [openLeccion, setOpenLeccion] = useState(false)
  const [tipoContenido, setTipoContenido] = useState<string>(TIPO_CONTENIDO_DEFAULT)
  const [selectedModuloId, setSelectedModuloId] = useState<string | null>(null)

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const [selectedModulo, setSelectedModulo] = useState<any>(null)
  const [openModulo, setOpenModulo] = useState(false)

  // Editor de preguntas de quiz
  const [openQuiz, setOpenQuiz] = useState(false)
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const [quizLeccion, setQuizLeccion] = useState<any>(null)
  const [preguntas, setPreguntas] = useState<PreguntaQuiz[]>([])

  const [isPending, startTransition] = useTransition()
  const [errorMsg, setErrorMsg] = useState<string | null>(null)
  const [fileToUpload, setFileToUpload] = useState<File | null>(null)
  const [uploading, setUploading] = useState(false)
  const [urlRecurso, setUrlRecurso] = useState('')

  // ---- Módulos ----
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const openModalModulo = (modulo: any = null) => {
    setSelectedModulo(modulo); setOpenModulo(true); setErrorMsg(null)
  }
  async function handleModuloSubmit(formData: FormData) {
    setErrorMsg(null)
    formData.set('programa_id', programa.id)
    startTransition(async () => {
      const result = await guardarModulo(formData)
      if (result?.error) setErrorMsg(result.error)
      else setOpenModulo(false)
    })
  }
  async function handleModuloDelete(id: string) {
    if (!confirm('¿Seguro que querés eliminar este módulo? Esto borra todas sus lecciones.')) return
    startTransition(async () => { await eliminarModulo(id, programa.id) })
  }

  // ---- Lecciones ----
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const openModalLeccion = (moduloId: string, leccion: any = null) => {
    setSelectedModuloId(moduloId)
    setSelectedLeccion(leccion)
    setTipoContenido(leccion?.tipo_contenido || TIPO_CONTENIDO_DEFAULT)
    setUrlRecurso(leccion?.url_recurso || '')
    setFileToUpload(null)
    setOpenLeccion(true)
    setErrorMsg(null)
  }

  async function handleLeccionSubmit(formData: FormData) {
    setErrorMsg(null)
    if (tipoContenido.startsWith('supabase_') && fileToUpload) {
      // Alternativa: subida al bucket privado 'materiales' de Supabase (guardamos el PATH)
      setUploading(true)
      const supabase = createClient()
      const fileExt = fileToUpload.name.split('.').pop()
      const fileName = `lecciones/${Date.now()}_${Math.random().toString(36).substring(2, 10)}.${fileExt}`
      const { error } = await supabase.storage.from('materiales').upload(fileName, fileToUpload)
      if (error) { setErrorMsg(`Error al subir archivo: ${error.message}`); setUploading(false); return }
      formData.set('url_recurso', fileName)
      setUploading(false)
    } else if (tipoContenido.startsWith('supabase_') && selectedLeccion?.url_recurso) {
      formData.set('url_recurso', selectedLeccion.url_recurso)
    }

    formData.set('tipo_contenido', tipoContenido)
    formData.set('programa_id', programa.id)
    if (selectedModuloId) formData.set('modulo_id', selectedModuloId)

    startTransition(async () => {
      const result = await guardarLeccion(formData)
      if (result?.error) setErrorMsg(result.error)
      else { setOpenLeccion(false); setFileToUpload(null) }
    })
  }

  async function handleLeccionDelete(id: string) {
    if (!confirm('¿Seguro que querés eliminar esta lección? Esta acción no se puede deshacer.')) return
    startTransition(async () => { await eliminarLeccion(id, programa.id) })
  }

  // ---- Quiz ----
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const openQuizEditor = (leccion: any) => {
    setQuizLeccion(leccion)
    const cargadas = jsonAPreguntas(leccion.preguntas)
    setPreguntas(cargadas.length ? cargadas : [{ pregunta: '', opciones: ['', ''], correctaIdx: 0 }])
    setErrorMsg(null)
    setOpenQuiz(true)
  }
  async function handleQuizSubmit() {
    setErrorMsg(null)
    const r = preguntasAJson(preguntas)
    if (!r.ok) { setErrorMsg(r.error); return }
    startTransition(async () => {
      const result = await guardarQuizPreguntas(quizLeccion.id, programa.id, r.json)
      if (result?.error) setErrorMsg(result.error)
      else { toast.success('Preguntas guardadas'); setOpenQuiz(false) }
    })
  }

  // supabase_* sigue siendo "subir archivo" directo (bucket de Supabase, alternativa).
  // El resto usa el picker: escribir un link real (Drive/Dropbox) o elegir del bucket R2.
  const esArchivoSupabase = tipoContenido.startsWith('supabase_')

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-4">
        <Link href="/psicologo/programas">
          <Button variant="outline" size="icon" className="rounded-full"><ArrowLeft className="w-4 h-4" /></Button>
        </Link>
        <div>
          <h1 className="text-4xl font-heading font-bold text-tinta">Estructura del programa</h1>
          <p className="text-muted-foreground mt-2 font-sans">{programa.titulo}</p>
        </div>
      </div>

      <div className="flex justify-end">
        <Button onClick={() => openModalModulo(null)} className="bg-marca hover:bg-marca/90 text-crema shadow-md">
          <Plus className="w-4 h-4 mr-2" /> Crear nuevo módulo
        </Button>
      </div>

      {modulos.length === 0 ? (
        <div className="bg-card border-none shadow-sm rounded-xl p-12 text-center text-muted-foreground">
          <FolderOpen className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
          Aún no hay módulos creados en este programa.
        </div>
      ) : (
        <div className="space-y-8">
          {modulos.map((modulo, mIdx) => {
            const leccionesDeModulo = lecciones.filter(l => l.modulo_id === modulo.id)
            return (
              <div key={modulo.id} className="bg-card border border-border rounded-xl overflow-hidden shadow-sm">
                <div className="bg-muted border-b border-border p-4 flex items-center justify-between gap-3">
                  <div className="flex items-center gap-2">
                    <div className="flex flex-col">
                      <button onClick={() => startTransition(async () => { await moverModulo(modulo.id, programa.id, 'up') })} disabled={isPending || mIdx === 0} className="disabled:opacity-30 text-tinta/60 hover:text-marca"><ChevronUp className="w-4 h-4" /></button>
                      <button onClick={() => startTransition(async () => { await moverModulo(modulo.id, programa.id, 'down') })} disabled={isPending || mIdx === modulos.length - 1} className="disabled:opacity-30 text-tinta/60 hover:text-marca"><ChevronDown className="w-4 h-4" /></button>
                    </div>
                    <div>
                      <h2 className="font-heading font-bold text-xl text-tinta">{modulo.titulo}</h2>
                      {modulo.descripcion && <p className="text-sm text-muted-foreground">{modulo.descripcion}</p>}
                    </div>
                  </div>
                  <div className="flex items-center gap-2 shrink-0">
                    <Button variant="outline" size="sm" onClick={() => openModalLeccion(modulo.id)} className="font-sans text-marca border-marca hover:bg-marca hover:text-crema" disabled={isPending}>
                      <Plus className="w-4 h-4 mr-1" /> Agregar lección
                    </Button>
                    <Button variant="outline" size="sm" onClick={() => openModalModulo(modulo)} className="font-sans" disabled={isPending}><Settings2 className="w-4 h-4" /></Button>
                    <Button variant="destructive" size="sm" onClick={() => handleModuloDelete(modulo.id)} className="font-sans" disabled={isPending}><Trash2 className="w-4 h-4" /></Button>
                  </div>
                </div>

                <Table className="table-fixed">
                  <TableHeader>
                    <TableRow>
                      <TableHead className="font-heading font-semibold text-tinta w-24">Orden</TableHead>
                      <TableHead className="font-heading font-semibold text-tinta">Lección</TableHead>
                      <TableHead className="font-heading font-semibold text-tinta w-[200px]">Tipo</TableHead>
                      <TableHead className="text-right font-heading font-semibold text-tinta w-72">Acciones</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {leccionesDeModulo.length === 0 ? (
                      <TableRow><TableCell colSpan={4} className="text-center py-4 text-sm text-muted-foreground">Este módulo está vacío.</TableCell></TableRow>
                    ) : leccionesDeModulo.map((leccion, index) => (
                      <TableRow key={leccion.id}>
                        <TableCell>
                          <div className="flex items-center gap-1">
                            <span className="text-tinta font-medium w-5">{index + 1}</span>
                            <button onClick={() => startTransition(async () => { await moverLeccion(leccion.id, modulo.id, programa.id, 'up') })} disabled={isPending || index === 0} className="disabled:opacity-30 text-tinta/50 hover:text-marca"><ChevronUp className="w-4 h-4" /></button>
                            <button onClick={() => startTransition(async () => { await moverLeccion(leccion.id, modulo.id, programa.id, 'down') })} disabled={isPending || index === leccionesDeModulo.length - 1} className="disabled:opacity-30 text-tinta/50 hover:text-marca"><ChevronDown className="w-4 h-4" /></button>
                          </div>
                        </TableCell>
                        <TableCell className="font-medium text-tinta truncate">{leccion.titulo}</TableCell>
                        <TableCell>
                          <div className="flex items-center gap-1.5 flex-wrap">
                            <span className="px-2 py-1 rounded-md text-xs font-semibold bg-muted text-muted-foreground border border-border">
                              {LABEL_TIPO_MEDIO[leccion.tipo_medio] ?? TIPO_LABEL[leccion.tipo_contenido] ?? leccion.tipo_contenido}
                              {leccion.tipo_contenido === 'quiz' && ` · ${leccion.preguntas?.length || 0} preg.`}
                              {leccion.tipo_contenido === 'entrega' && leccion.fecha_limite && ` · vence ${new Date(leccion.fecha_limite).toLocaleDateString('es-AR', { day: 'numeric', month: 'short' })}`}
                            </span>
                            {leccion.origen && (
                              <span className="px-2 py-1 rounded-md text-xs font-semibold bg-blue-100 dark:bg-blue-950/40 text-blue-700 dark:text-blue-400" title="De dónde viene el archivo">
                                {LABEL_ORIGEN[leccion.origen] ?? leccion.origen}
                              </span>
                            )}
                          </div>
                        </TableCell>
                        <TableCell className="text-right space-x-1">
                          {leccion.tipo_contenido === 'quiz' && (
                            <Button variant="ghost" size="sm" onClick={() => openQuizEditor(leccion)} className="font-sans text-marca" disabled={isPending}>
                              <ListChecks className="w-4 h-4 mr-1" /> Preguntas
                            </Button>
                          )}
                          <Button variant="ghost" size="sm" onClick={() => openModalLeccion(modulo.id, leccion)} className="font-sans" disabled={isPending}>Editar</Button>
                          <Button variant="ghost" size="sm" onClick={() => handleLeccionDelete(leccion.id)} className="font-sans text-red-600 dark:text-red-400 hover:text-red-700 dark:hover:text-red-400 dark:hover:text-red-400 hover:bg-red-50 dark:hover:bg-red-950/40" disabled={isPending}>Borrar</Button>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            )
          })}
        </div>
      )}

      {/* Modal Módulo */}
      <Dialog open={openModulo} onOpenChange={setOpenModulo}>
        <DialogContent className="sm:max-w-[500px] bg-crema">
          <DialogHeader>
            <DialogTitle className="font-heading text-2xl text-tinta">{selectedModulo ? 'Editar módulo' : 'Crear nuevo módulo'}</DialogTitle>
            <DialogDescription className="font-sans">Definí el nombre y la descripción del módulo.</DialogDescription>
          </DialogHeader>
          <form action={handleModuloSubmit} className="space-y-4 mt-4">
            {selectedModulo && <input type="hidden" name="id" value={selectedModulo.id} />}
            <div className="space-y-2">
              <Label htmlFor="tituloModulo" className="font-bold text-tinta">Título del módulo</Label>
              <Input id="tituloModulo" name="titulo" defaultValue={selectedModulo?.titulo || ''} placeholder="Ej: Módulo 8 - Herramientas Digitales" className="bg-card border-border" required />
            </div>
            <div className="space-y-2">
              <Label htmlFor="descripcionModulo" className="font-bold text-tinta">Descripción (opcional)</Label>
              <Textarea id="descripcionModulo" name="descripcion" defaultValue={selectedModulo?.descripcion || ''} className="bg-card border-border resize-none h-20" />
            </div>
            {errorMsg && <p className="text-red-600 dark:text-red-400 text-sm">{errorMsg}</p>}
            <div className="flex justify-end pt-4">
              <Button type="submit" disabled={isPending} className="bg-marca hover:bg-marca/90 text-crema px-8">
                {isPending ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : "Guardar módulo"}
              </Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>

      {/* Modal Lección */}
      <Dialog open={openLeccion} onOpenChange={setOpenLeccion}>
        <DialogContent className="sm:max-w-[700px] max-h-[90vh] overflow-y-auto bg-crema">
          <DialogHeader>
            <DialogTitle className="font-heading text-2xl text-tinta">{selectedLeccion ? 'Editar lección' : 'Agregar nueva lección'}</DialogTitle>
            <DialogDescription className="font-sans">Elegí el tipo de contenido: material, texto, quiz o entrega de trabajo.</DialogDescription>
          </DialogHeader>
          <form action={handleLeccionSubmit} className="space-y-4 mt-4">
            {selectedLeccion && <input type="hidden" name="id" value={selectedLeccion.id} />}
            <div className="flex flex-col sm:flex-row gap-4">
              <div className="space-y-2 flex-1">
                <Label htmlFor="titulo" className="font-bold text-tinta">Nombre de la lección</Label>
                <Input id="titulo" name="titulo" defaultValue={selectedLeccion?.titulo || ''} className="bg-card border-border" required />
              </div>
              <div className="space-y-2 w-full sm:w-[280px] shrink-0">
                <Label className="font-bold text-tinta">Tipo de contenido</Label>
                <Select
                  value={tipoContenido}
                  onValueChange={(value) => setTipoContenido(value || TIPO_CONTENIDO_DEFAULT)}
                  items={{
                    drive_video: 'Video (Google Drive/R2)', drive_audio: 'Audio (Google Drive/R2)', drive_pdf: 'PDF (Google Drive/R2)', drive_image: 'Imagen (Google Drive/URL)',
                    dropbox_video: 'Video (Dropbox/R2)', dropbox_audio: 'Audio (Dropbox/R2)', dropbox_pdf: 'PDF (Dropbox/R2)',
                    supabase_video: 'Video (Subir archivo — Supabase)', supabase_audio: 'Audio (Subir archivo — Supabase)', supabase_pdf: 'PDF (Subir archivo — Supabase)',
                    texto_markdown: 'Texto (Markdown)', quiz: 'Quiz (autoevaluación)', entrega: 'Entrega de trabajo',
                  }}
                >
                  <SelectTrigger className="bg-card border-border"><SelectValue placeholder="Seleccioná un tipo" /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="drive_video">Video (Google Drive/R2)</SelectItem>
                    <SelectItem value="drive_audio">Audio (Google Drive/R2)</SelectItem>
                    <SelectItem value="drive_pdf">PDF (Google Drive/R2)</SelectItem>
                    <SelectItem value="drive_image">Imagen (Google Drive/URL)</SelectItem>
                    <SelectItem value="dropbox_video">Video (Dropbox/R2)</SelectItem>
                    <SelectItem value="dropbox_audio">Audio (Dropbox/R2)</SelectItem>
                    <SelectItem value="dropbox_pdf">PDF (Dropbox/R2)</SelectItem>
                    <SelectItem value="supabase_video">Video (Subir archivo — Supabase)</SelectItem>
                    <SelectItem value="supabase_audio">Audio (Subir archivo — Supabase)</SelectItem>
                    <SelectItem value="supabase_pdf">PDF (Subir archivo — Supabase)</SelectItem>
                    <SelectItem value="texto_markdown">Texto (Markdown)</SelectItem>
                    <SelectItem value="quiz">Quiz (autoevaluación)</SelectItem>
                    <SelectItem value="entrega">Entrega de trabajo</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            {tipoContenido === 'quiz' ? (
              <p className="text-sm text-muted-foreground bg-card border border-border rounded-lg p-3">
                <ListChecks className="w-4 h-4 inline mr-1 text-marca" />
                Guardá la lección y después usá el botón <b>Preguntas</b> en la fila para cargar el cuestionario.
              </p>
            ) : tipoContenido === 'entrega' ? (
              <div className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="url_recurso" className="font-bold text-tinta">Consigna del trabajo (Markdown, opcional)</Label>
                  <Textarea id="url_recurso" name="url_recurso" defaultValue={selectedLeccion?.url_recurso || ''} className="bg-card border-border h-32 font-mono text-sm" placeholder={'# Trabajo Final Integrador\n\nConsigna, rúbrica, formato de entrega...'} />
                  <p className="text-xs text-muted-foreground"><FileUp className="w-3 h-3 inline mr-1" />El alumno podrá subir su archivo desde esta lección.</p>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="fecha_limite" className="font-bold text-tinta">Fecha límite (opcional)</Label>
                  <Input
                    id="fecha_limite"
                    name="fecha_limite"
                    type="datetime-local"
                    defaultValue={aFechaLimiteInput(selectedLeccion?.fecha_limite)}
                    className="bg-card border-border"
                  />
                  <p className="text-xs text-muted-foreground">Aparece en &quot;Tareas&quot; del alumno; sin fecha, el trabajo queda sin vencimiento.</p>
                </div>
              </div>
            ) : (
              <div className="space-y-2">
                <Label htmlFor="url_recurso" className="font-bold text-tinta">
                  {tipoContenido === 'texto_markdown' ? 'Contenido del texto' : esArchivoSupabase ? 'Seleccionar archivo' : 'Enlace del recurso o archivo del bucket'}
                </Label>
                {tipoContenido === 'texto_markdown' ? (
                  <Textarea id="url_recurso" name="url_recurso" defaultValue={selectedLeccion?.url_recurso || ''} className="bg-card border-border h-40 font-mono text-sm" placeholder={'# Título\n\nAdmite **negrita**, listas, tablas y cajas > [!NOTE] ...'} required />
                ) : esArchivoSupabase ? (
                  <div className="space-y-2">
                    <Input id="archivo_subida" type="file" onChange={(e) => setFileToUpload(e.target.files?.[0] || null)} className="bg-card border-border cursor-pointer" accept={tipoContenido.includes('video') ? 'video/*' : tipoContenido.includes('audio') ? 'audio/*' : '.pdf'} required={!selectedLeccion?.url_recurso} />
                    {selectedLeccion?.url_recurso && (
                      <p className="text-xs text-muted-foreground">Archivo actual: <a href={selectedLeccion.url_abrible || '#'} target="_blank" rel="noreferrer" className="text-marca underline">Ver archivo</a> (subí uno nuevo para reemplazarlo)</p>
                    )}
                  </div>
                ) : (
                  <SelectorArchivoR2 id="url_recurso" name="url_recurso" value={urlRecurso} onChange={setUrlRecurso} required />
                )}
              </div>
            )}

            {errorMsg && <p className="text-red-600 dark:text-red-400 text-sm">{errorMsg}</p>}
            <div className="flex justify-end pt-4">
              <Button type="submit" disabled={isPending || uploading} className="bg-marca hover:bg-marca/90 text-crema px-8">
                {isPending || uploading ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : "Guardar lección"}
              </Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>

      {/* Editor de preguntas de quiz */}
      <Dialog open={openQuiz} onOpenChange={setOpenQuiz}>
        <DialogContent className="sm:max-w-[700px] max-h-[90vh] overflow-y-auto bg-crema">
          <DialogHeader>
            <DialogTitle className="font-heading text-2xl text-tinta">Preguntas del quiz</DialogTitle>
            <DialogDescription className="font-sans">{quizLeccion?.titulo}. Aprobación ≥ 70%.</DialogDescription>
          </DialogHeader>
          <div className="space-y-3 mt-4">
            <QuizBuilder value={preguntas} onChange={setPreguntas} />
            {errorMsg && <p className="text-red-600 dark:text-red-400 text-sm">{errorMsg}</p>}
            <div className="flex justify-end">
              <Button onClick={handleQuizSubmit} disabled={isPending} className="bg-marca hover:bg-marca/90 text-crema px-8">
                {isPending ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : "Guardar preguntas"}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  )
}
