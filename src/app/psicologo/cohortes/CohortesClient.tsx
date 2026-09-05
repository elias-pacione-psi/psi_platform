'use client'

import { useState, useTransition } from 'react'
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Checkbox } from "@/components/ui/checkbox"
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from "@/components/ui/alert-dialog"
import {
  guardarCohorte, eliminarCohorte, inscribirAlumnosEnCohorte, quitarAlumnoDeCohorte,
  generarClasesDeCohorte, borrarClasesFuturasDeCohorte, asegurarRecursoDeR2,
} from '../actions'
import {
  Loader2, Plus, Settings2, Trash2, GraduationCap, Users, UserMinus, CalendarClock,
  CalendarPlus, TriangleAlert, BookOpen, FileText, FileAudio, FileVideo, FileImage,
  Folder, FolderOpen, ChevronRight, Check,
} from 'lucide-react'
import { toast } from 'sonner'
import { DIAS_SEMANA, etiquetaHorario, fechasDeClases, horarioCompleto } from '@/utils/horario-cohorte'
import { listarCarpeta } from '@/app/psicologo/archivos/actions'
import { keyDeMarcadorR2, PREFIJO_ENTREGAS_R2 } from '@/utils/r2-marcador'
import type { ListadoR2 } from '@/utils/r2'

// eslint-disable-next-line @typescript-eslint/no-explicit-any
type Cohorte = any

type RecursoBiblioteca = {
  id: string
  titulo: string
  tipo_medio: string | null
  tipo_contenido: string
  url_recurso?: string
}

export function CohortesClient({
  cohortes,
  programas,
  alumnos,
  recursos,
}: {
  cohortes: Cohorte[],
  programas: { id: string, titulo: string }[],
  alumnos: Cohorte[],
  recursos: RecursoBiblioteca[],
}) {
  const [isPending, startTransition] = useTransition()
  const [openForm, setOpenForm] = useState(false)
  const [selected, setSelected] = useState<Cohorte>(null)
  const [errorMsg, setErrorMsg] = useState<string | null>(null)
  const [toDelete, setToDelete] = useState<string | null>(null)
  const [aLimpiar, setALimpiar] = useState<Cohorte>(null)

  // Inscripción
  const [openEnroll, setOpenEnroll] = useState(false)
  const [enrollCohorte, setEnrollCohorte] = useState<Cohorte>(null)
  const [selectedAlumnos, setSelectedAlumnos] = useState<string[]>([])
  const [search, setSearch] = useState('')

  // Campos controlados del formulario: hacen falta para la vista previa de clases, que
  // tiene que recalcularse mientras se editan los días y las horas.
  const [programasElegidos, setProgramasElegidos] = useState<string[]>([])
  // Asignación de Libros y Material extra de cualquier parte del bucket / biblioteca
  const [recursosDisponibles, setRecursosDisponibles] = useState<RecursoBiblioteca[]>(recursos)
  const [recursosElegidos, setRecursosElegidos] = useState<string[]>([])
  const [busquedaRecursos, setBusquedaRecursos] = useState('')

  // Explorador del bucket R2 para adjuntar cualquier archivo de cualquier carpeta
  const [openBucket, setOpenBucket] = useState(false)
  const [bucketPrefijo, setBucketPrefijo] = useState('')
  const [bucketListado, setBucketListado] = useState<ListadoR2 | null>(null)
  const [bucketCargando, setBucketCargando] = useState(false)
  const [bucketError, setBucketError] = useState<string | null>(null)
  const [agregandoKey, setAgregandoKey] = useState<string | null>(null)

  const [dias, setDias] = useState<number[]>([])
  const [fechaInicio, setFechaInicio] = useState('')
  const [fechaFin, setFechaFin] = useState('')
  const [horaInicio, setHoraInicio] = useState('')
  const [horaFin, setHoraFin] = useState('')

  const openFormModal = (c: Cohorte = null) => {
    setSelected(c)
    setErrorMsg(null)
    setProgramasElegidos(c?.programaIds ?? [])
    setRecursosElegidos(c?.recursoIds ?? [])
    setBusquedaRecursos('')
    if (c?.recursos && Array.isArray(c.recursos)) {
      setRecursosDisponibles((prev) => {
        const nuevos = [...prev]
        for (const r of c.recursos) {
          if (!nuevos.some((item) => item.id === r.id)) {
            nuevos.push(r)
          }
        }
        return nuevos.sort((a, b) => a.titulo.localeCompare(b.titulo))
      })
    }
    setDias(c?.dias_semana ?? [])
    setFechaInicio(c?.fecha_inicio ?? '')
    setFechaFin(c?.fecha_fin ?? '')
    setHoraInicio(c?.hora_inicio?.slice(0, 5) ?? '')
    setHoraFin(c?.hora_fin?.slice(0, 5) ?? '')
    setOpenForm(true)
  }

  function handleSubmit(formData: FormData) {
    setErrorMsg(null)
    programasElegidos.forEach((p) => formData.append('programas', p))
    recursosElegidos.forEach((r) => formData.append('recursos', r))
    dias.forEach((d) => formData.append('dias_semana', String(d)))
    startTransition(async () => {
      const result = await guardarCohorte(formData)
      if (result?.error) setErrorMsg(result.error)
      else { toast.success('Formación guardada'); setOpenForm(false) }
    })
  }

  function handleDelete() {
    if (!toDelete) return
    startTransition(async () => {
      const result = await eliminarCohorte(toDelete)
      if (result?.error) toast.error(result.error)
      else toast.success('Formación eliminada')
      setToDelete(null)
    })
  }

  const openEnrollModal = (c: Cohorte) => {
    setEnrollCohorte(c)
    setSelectedAlumnos((c.cohortes_alumnos || []).map((ca: { alumno_id: string }) => ca.alumno_id))
    setSearch('')
    setOpenEnroll(true)
  }

  function handleEnroll() {
    startTransition(async () => {
      const result = await inscribirAlumnosEnCohorte(enrollCohorte.id, selectedAlumnos)
      if (result?.error) toast.error(result.error)
      else { toast.success('Inscripciones actualizadas'); setOpenEnroll(false) }
    })
  }

  function handleQuitar(cohorteId: string, alumnoId: string) {
    startTransition(async () => {
      const result = await quitarAlumnoDeCohorte(cohorteId, alumnoId)
      if (result?.error) toast.error(result.error)
      else toast.success('Alumno dado de baja de la formación')
    })
  }

  function handleGenerarClases(c: Cohorte) {
    startTransition(async () => {
      const result = await generarClasesDeCohorte(c.id)
      if ('error' in result) { toast.error(result.error); return }
      toast.success(
        result.creadas === 0
          ? `Ya estaban las ${result.total} clases agendadas: no hizo falta agregar ninguna.`
          : `${result.creadas} clase(s) agendadas (${result.total} en total para el horario).`,
      )
    })
  }

  function handleLimpiarFuturas() {
    if (!aLimpiar) return
    startTransition(async () => {
      const result = await borrarClasesFuturasDeCohorte(aLimpiar.id)
      if ('error' in result) { toast.error(result.error); return }
      toast.success(`${result.borradas} clase(s) futuras borradas.`)
      setALimpiar(null)
    })
  }

  const toggle = (id: string, checked: boolean) =>
    setSelectedAlumnos(prev => checked ? [...prev, id] : prev.filter(a => a !== id))

  const toggleDia = (valor: number) =>
    setDias(prev => prev.includes(valor) ? prev.filter(d => d !== valor) : [...prev, valor])

  const togglePrograma = (id: string) =>
    setProgramasElegidos(prev => prev.includes(id) ? prev.filter(p => p !== id) : [...prev, id])

  const toggleRecurso = (id: string) =>
    setRecursosElegidos(prev => prev.includes(id) ? prev.filter(r => r !== id) : [...prev, id])

  // Ícono chico por formato para la lista y los chips (reuso el mapeo mental de la
  // Biblioteca: pdf → texto, audio, video, resto → imagen/enlace/libro).
  function iconoRecurso(tipoMedio: string | null, tipoContenido: string) {
    const t = (tipoMedio ?? tipoContenido).toLowerCase()
    if (t.includes('video') || t.endsWith('.mp4') || t.endsWith('.webm') || t.endsWith('.mov')) return <FileVideo className="w-3.5 h-3.5 text-marca shrink-0" />
    if (t.includes('audio') || t.endsWith('.mp3') || t.endsWith('.m4a') || t.endsWith('.wav') || t.endsWith('.ogg')) return <FileAudio className="w-3.5 h-3.5 text-marca shrink-0" />
    if (t.includes('imagen') || t.endsWith('.jpg') || t.endsWith('.jpeg') || t.endsWith('.png') || t.endsWith('.webp') || t.endsWith('.svg')) return <FileImage className="w-3.5 h-3.5 text-marca shrink-0" />
    if (t.includes('pdf') || t.endsWith('.pdf')) return <FileText className="w-3.5 h-3.5 text-marca shrink-0" />
    return <BookOpen className="w-3.5 h-3.5 text-marca shrink-0" />
  }

  async function navegarBucket(prefijo: string) {
    setBucketCargando(true)
    setBucketError(null)
    const res = await listarCarpeta(prefijo)
    setBucketCargando(false)
    if ('error' in res) {
      setBucketError(res.error)
      toast.error(res.error)
      return
    }
    setBucketPrefijo(prefijo)
    setBucketListado(res)
  }

  function abrirExploradorBucket() {
    setOpenBucket(true)
    navegarBucket('')
  }

  async function handleToggleArchivoBucket(archivoKey: string, nombre: string) {
    const yaElegido = recursosDisponibles.find(
      (r) =>
        recursosElegidos.includes(r.id) &&
        (keyDeMarcadorR2(r.url_recurso || '') === archivoKey ||
          r.titulo.toLowerCase() === nombre.replace(/\.[^.]+$/, '').toLowerCase())
    )

    if (yaElegido) {
      setRecursosElegidos((prev) => prev.filter((id) => id !== yaElegido.id))
      toast.info(`"${yaElegido.titulo}" desmarcado`)
      return
    }

    setAgregandoKey(archivoKey)
    const res = await asegurarRecursoDeR2(archivoKey)
    setAgregandoKey(null)

    if ('error' in res) {
      toast.error(res.error)
      return
    }

    const { recurso } = res
    setRecursosDisponibles((prev) => {
      if (prev.some((r) => r.id === recurso.id)) return prev
      return [...prev, recurso].sort((a, b) => a.titulo.localeCompare(b.titulo))
    })

    setRecursosElegidos((prev) => (prev.includes(recurso.id) ? prev : [...prev, recurso.id]))
    toast.success(`"${recurso.titulo}" sumado a la formación`)
  }

  // Misma función que usa el servidor para generar: el número de la vista previa no puede
  // salir de otro cálculo, o diría una cosa y se agendaría otra.
  const horarioForm = {
    fecha_inicio: fechaInicio || null,
    fecha_fin: fechaFin || null,
    dias_semana: dias.length > 0 ? dias : null,
    hora_inicio: horaInicio || null,
    hora_fin: horaFin || null,
  }
  const clasesPreview = horarioCompleto(horarioForm) ? fechasDeClases(horarioForm).length : 0

  // Lista de "Asignación de Libros y Material extra" del formulario, filtrada por la búsqueda.
  const recursosFiltrados = recursosDisponibles.filter((r) =>
    r.titulo?.toLowerCase().includes(busquedaRecursos.toLowerCase())
  )

  const bucketTramos = bucketPrefijo.split('/').filter(Boolean)

  return (
    <div className="space-y-4">
      <div className="flex justify-end">
        <Button onClick={() => openFormModal(null)} className="bg-marca hover:bg-marca/90 text-crema">
          <Plus className="w-4 h-4 mr-2" /> Crear formación
        </Button>
      </div>

      {cohortes.length === 0 ? (
        <div className="bg-card border border-border rounded-xl p-12 text-center text-muted-foreground">
          <GraduationCap className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
          Todavía no hay formaciones. Creá una para inscribir alumnos a uno o más programas.
        </div>
      ) : (
        <div className="grid gap-4 md:grid-cols-2">
          {cohortes.map((c) => {
            const horario = etiquetaHorario(c)
            const clasesDelHorario = horarioCompleto(c) ? fechasDeClases(c).length : 0
            // Hay clases futuras agendadas que no coinciden con lo que da el horario
            // actual: casi siempre es que el horario se editó después de generarlas.
            const desalineada = clasesDelHorario > 0 && c.clases.futuras > 0 && c.clases.total !== clasesDelHorario

            return (
              <div key={c.id} className="bg-card border border-border rounded-xl shadow-sm p-5 space-y-3">
                <div className="flex items-start justify-between gap-2">
                  <div className="min-w-0">
                    <h3 className="font-heading font-bold text-xl text-tinta">{c.nombre}</h3>
                    <div className="flex flex-wrap gap-1.5 mt-1.5">
                      {c.programas.length === 0
                        ? <span className="text-sm text-muted-foreground">Sin programas asignados</span>
                        : c.programas.map((p: { id: string, titulo: string }) => (
                          <span key={p.id} className="text-xs bg-marca/10 text-marca border border-marca/20 rounded-full px-2 py-0.5">
                            {p.titulo}
                          </span>
                        ))}
                    </div>
                    {c.recursos?.length > 0 && (
                      <div className="flex flex-wrap gap-1.5 mt-1.5">
                        {c.recursos.map((r: { id: string, titulo: string }) => (
                          <span key={r.id} className="text-xs bg-crema border border-tinta/10 text-tinta rounded-full px-2 py-0.5 inline-flex items-center gap-1">
                            <BookOpen className="w-3 h-3 text-marca" /> {r.titulo}
                          </span>
                        ))}
                      </div>
                    )}
                    {(c.fecha_inicio || c.fecha_fin) && (
                      <p className="text-xs text-muted-foreground mt-2">
                        {c.fecha_inicio || '—'} → {c.fecha_fin || '—'}
                      </p>
                    )}
                    {horario && (
                      <p className="text-xs text-tinta mt-1 flex items-center gap-1.5">
                        <CalendarClock className="w-3.5 h-3.5 text-marca" /> {horario}
                      </p>
                    )}
                  </div>
                  <div className="flex gap-1 shrink-0">
                    <Button variant="ghost" size="sm" onClick={() => openFormModal(c)} className="h-8 px-2"><Settings2 className="w-4 h-4" /></Button>
                    <Button variant="ghost" size="sm" onClick={() => setToDelete(c.id)} className="h-8 px-2 text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-950/40"><Trash2 className="w-4 h-4" /></Button>
                  </div>
                </div>

                <div className="border-t border-border pt-3">
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-sm font-semibold text-tinta flex items-center gap-1.5"><Users className="w-4 h-4 text-marca" /> {c.cohortes_alumnos?.length || 0} inscriptos</span>
                    <Button variant="outline" size="sm" onClick={() => openEnrollModal(c)} className="text-marca border-marca hover:bg-marca hover:text-crema h-8">Gestionar</Button>
                  </div>
                  <div className="flex flex-wrap gap-1.5">
                    {(c.cohortes_alumnos || []).slice(0, 6).map((ca: { alumno_id: string, alumnos: { nombre: string } }) => (
                      <span key={ca.alumno_id} className="inline-flex items-center gap-1 text-xs bg-crema border border-tinta/10 rounded-full px-2 py-0.5 text-tinta">
                        {ca.alumnos?.nombre}
                        <button onClick={() => handleQuitar(c.id, ca.alumno_id)} disabled={isPending} className="text-tinta/40 hover:text-red-600 dark:hover:text-red-400"><UserMinus className="w-3 h-3" /></button>
                      </span>
                    ))}
                    {(c.cohortes_alumnos?.length || 0) > 6 && <span className="text-xs text-muted-foreground">+{c.cohortes_alumnos.length - 6} más</span>}
                  </div>
                </div>

                <div className="border-t border-border pt-3 space-y-2">
                  <div className="flex items-center justify-between gap-2">
                    <span className="text-sm text-muted-foreground">
                      {c.clases.total === 0
                        ? 'Sin clases agendadas'
                        : `${c.clases.total} clase(s) agendadas · ${c.clases.futuras} por delante`}
                    </span>
                    {clasesDelHorario > 0 && (
                      <Button
                        variant="outline" size="sm" disabled={isPending}
                        onClick={() => handleGenerarClases(c)}
                        className="h-8 shrink-0"
                        title={`El horario da ${clasesDelHorario} clases entre las dos fechas`}
                      >
                        <CalendarPlus className="w-4 h-4 mr-2" />
                        Generar clases
                      </Button>
                    )}
                  </div>

                  {clasesDelHorario === 0 && (
                    <p className="text-xs text-muted-foreground">
                      Cargá días, hora de inicio y las dos fechas para poder generar las clases.
                    </p>
                  )}

                  {desalineada && (
                    <div className="flex items-start gap-2 text-xs bg-orange-50 dark:bg-orange-950/30 border border-orange-200 dark:border-orange-900 text-orange-800 dark:text-orange-300 rounded-lg p-2.5">
                      <TriangleAlert className="w-4 h-4 shrink-0 mt-0.5" />
                      <span className="flex-1">
                        Hay {c.clases.total} clases agendadas pero el horario actual da {clasesDelHorario}.
                        Si cambiaste el horario, las viejas siguen ahí.
                        <button
                          onClick={() => setALimpiar(c)}
                          disabled={isPending}
                          className="ml-1 font-semibold underline underline-offset-2 hover:opacity-80"
                        >
                          Borrar las futuras
                        </button>
                      </span>
                    </div>
                  )}
                </div>
              </div>
            )
          })}
        </div>
      )}

      {/* Crear/editar formación */}
      <Dialog open={openForm} onOpenChange={setOpenForm}>
        <DialogContent className="sm:max-w-[560px] bg-crema max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="font-heading text-2xl text-tinta">{selected ? 'Editar formación' : 'Nueva formación'}</DialogTitle>
            <DialogDescription className="font-sans">
              Los inscriptos ven el contenido de todos los programas que asocies acá.
            </DialogDescription>
          </DialogHeader>
          <form action={handleSubmit} className="space-y-4 mt-4">
            {selected && <input type="hidden" name="id" value={selected.id} />}

            <div className="space-y-2">
              <Label className="font-bold text-tinta">Nombre</Label>
              <Input name="nombre" defaultValue={selected?.nombre || ''} placeholder="Ej: Formación 2026 · Grupo A" className="bg-card border-border" required />
            </div>

            <div className="space-y-2">
              <Label className="font-bold text-tinta">Programas</Label>
              <div className="space-y-2 border border-border bg-card rounded-lg p-2 max-h-[180px] overflow-y-auto">
                {programas.map((p) => (
                  <div key={p.id} className="flex items-center space-x-3 bg-muted p-2.5 rounded-lg border border-border">
                    <Checkbox
                      id={`prog-${p.id}`}
                      checked={programasElegidos.includes(p.id)}
                      onCheckedChange={() => togglePrograma(p.id)}
                      disabled={isPending}
                    />
                    <label
                      className="text-sm font-medium text-tinta cursor-pointer flex-1"
                      onClick={() => !isPending && togglePrograma(p.id)}
                    >
                      {p.titulo}
                    </label>
                  </div>
                ))}
                {programas.length === 0 && <p className="text-sm text-center text-muted-foreground py-3">No hay programas creados todavía.</p>}
              </div>
            </div>

            {/* Asignación de Libros y Material extra: material de Biblioteca o cualquier archivo del bucket R2 */}
            <div className="space-y-2">
              <div className="flex items-center justify-between gap-2">
                <Label className="font-bold text-tinta">Asignacion de Libros y Material extra</Label>
                <div className="flex items-center gap-2">
                  {recursosElegidos.length > 0 && (
                    <span className="text-xs text-muted-foreground font-sans">
                      {recursosElegidos.length === 1 ? '1 elegido' : `${recursosElegidos.length} elegidos`}
                    </span>
                  )}
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={abrirExploradorBucket}
                    className="h-7 text-xs px-2.5 font-sans border-marca/30 text-marca hover:bg-marca/10 flex items-center gap-1.5"
                  >
                    <FolderOpen className="w-3.5 h-3.5" />
                    Elegir del bucket
                  </Button>
                </div>
              </div>
              <Input
                placeholder="Buscar libro o material extra..."
                value={busquedaRecursos}
                onChange={(e) => setBusquedaRecursos(e.target.value)}
                className="bg-card border-border h-9"
              />
              <div className="space-y-2 border border-border bg-card rounded-lg p-2 max-h-[180px] overflow-y-auto">
                {recursosDisponibles.length === 0 ? (
                  <div className="text-center py-4 space-y-2">
                    <p className="text-sm text-muted-foreground">Todavía no hay material disponible.</p>
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      onClick={abrirExploradorBucket}
                      className="text-xs text-marca border-marca/30"
                    >
                      <FolderOpen className="w-3.5 h-3.5 mr-1" />
                      Explorar archivos del bucket
                    </Button>
                  </div>
                ) : recursosFiltrados.length === 0 ? (
                  <div className="text-center py-4 space-y-2">
                    <p className="text-sm text-muted-foreground">Ningún resultado para “{busquedaRecursos}”.</p>
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      onClick={abrirExploradorBucket}
                      className="text-xs text-marca border-marca/30"
                    >
                      <FolderOpen className="w-3.5 h-3.5 mr-1" />
                      Buscar en el bucket
                    </Button>
                  </div>
                ) : recursosFiltrados.map((r) => (
                  <div key={r.id} className="flex items-center space-x-3 bg-muted p-2.5 rounded-lg border border-border">
                    <Checkbox
                      id={`recurso-${r.id}`}
                      checked={recursosElegidos.includes(r.id)}
                      onCheckedChange={() => toggleRecurso(r.id)}
                      disabled={isPending}
                    />
                    <label
                      className="text-sm font-medium text-tinta cursor-pointer flex-1 flex items-center gap-2 min-w-0"
                      onClick={() => !isPending && toggleRecurso(r.id)}
                    >
                      {iconoRecurso(r.tipo_medio, r.tipo_contenido)}
                      <span className="truncate">{r.titulo}</span>
                    </label>
                  </div>
                ))}
              </div>
              <p className="text-xs text-muted-foreground">
                Material extra (libros, PDFs, audios, guías…), de cualquier carpeta del bucket: los
                inscriptos lo ven en su Biblioteca mientras dure la inscripción.
              </p>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-2">
                <Label className="font-bold text-tinta text-sm">Inicio</Label>
                <Input type="date" name="fecha_inicio" value={fechaInicio} onChange={(e) => setFechaInicio(e.target.value)} className="bg-card border-border" />
              </div>
              <div className="space-y-2">
                <Label className="font-bold text-tinta text-sm">Fin</Label>
                <Input type="date" name="fecha_fin" value={fechaFin} onChange={(e) => setFechaFin(e.target.value)} className="bg-card border-border" />
              </div>
            </div>

            <div className="space-y-2 border-t border-border pt-4">
              <Label className="font-bold text-tinta">Horario de cursada</Label>
              <div className="flex flex-wrap gap-1.5">
                {DIAS_SEMANA.map((d) => (
                  <button
                    key={d.valor}
                    type="button"
                    onClick={() => toggleDia(d.valor)}
                    disabled={isPending}
                    aria-pressed={dias.includes(d.valor)}
                    className={`px-3 py-1.5 rounded-full text-sm font-sans border transition-colors ${
                      dias.includes(d.valor)
                        ? 'bg-marca text-crema border-marca font-semibold'
                        : 'bg-card text-tinta border-border hover:border-marca/50'
                    }`}
                  >
                    {d.corto}
                  </button>
                ))}
              </div>
              <div className="grid grid-cols-2 gap-3 pt-1">
                <div className="space-y-2">
                  <Label className="text-tinta text-sm">Desde</Label>
                  <Input type="time" name="hora_inicio" value={horaInicio} onChange={(e) => setHoraInicio(e.target.value)} className="bg-card border-border" />
                </div>
                <div className="space-y-2">
                  <Label className="text-tinta text-sm">Hasta</Label>
                  <Input type="time" name="hora_fin" value={horaFin} onChange={(e) => setHoraFin(e.target.value)} className="bg-card border-border" />
                </div>
              </div>
              <p className="text-xs text-muted-foreground">
                {clasesPreview > 0
                  ? `Con este horario se pueden generar ${clasesPreview} clases entre las dos fechas. Se agendan desde la tarjeta, con el botón "Generar clases".`
                  : 'Con días, hora de inicio y las dos fechas cargadas, después vas a poder generarles las clases a los inscriptos.'}
              </p>
            </div>

            {errorMsg && <p className="text-red-600 dark:text-red-400 text-sm">{errorMsg}</p>}
            <div className="flex justify-end pt-2">
              <Button type="submit" disabled={isPending} className="bg-marca hover:bg-marca/90 text-crema px-8">
                {isPending ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : "Guardar"}
              </Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>

      {/* Inscripción */}
      <Dialog open={openEnroll} onOpenChange={setOpenEnroll}>
        <DialogContent className="sm:max-w-[500px] bg-crema">
          <DialogHeader>
            <DialogTitle className="font-heading text-2xl text-tinta">Inscriptos</DialogTitle>
            <DialogDescription className="font-sans">{enrollCohorte?.nombre}</DialogDescription>
          </DialogHeader>
          <div className="mt-4 space-y-4">
            <Input placeholder="Buscar alumno..." value={search} onChange={(e) => setSearch(e.target.value)} className="bg-card border-border" />
            <div className="max-h-[300px] overflow-y-auto space-y-2 border border-border bg-card rounded-lg p-2">
              {alumnos.filter((a: Cohorte) => a.nombre?.toLowerCase().includes(search.toLowerCase()) || a.email?.toLowerCase().includes(search.toLowerCase())).map((a: Cohorte) => (
                <div key={a.id} className="flex items-center space-x-3 bg-muted p-3 rounded-lg border border-border">
                  <Checkbox id={`al-${a.id}`} checked={selectedAlumnos.includes(a.id)} onCheckedChange={(c) => toggle(a.id, c as boolean)} disabled={isPending} />
                  <div className="grid leading-none cursor-pointer flex-1" onClick={() => !isPending && toggle(a.id, !selectedAlumnos.includes(a.id))}>
                    <label className="text-sm font-medium text-tinta">{a.nombre}</label>
                    <p className="text-xs text-muted-foreground mt-1 truncate">{a.email}</p>
                  </div>
                </div>
              ))}
              {alumnos.length === 0 && <p className="text-sm text-center text-muted-foreground py-4">No hay alumnos activos.</p>}
            </div>
            <div className="flex justify-end">
              <Button onClick={handleEnroll} disabled={isPending} className="bg-marca hover:bg-marca/90 text-crema px-8">
                {isPending ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : "Guardar inscripción"}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      <AlertDialog open={!!toDelete} onOpenChange={(o) => !o && setToDelete(null)}>
        <AlertDialogContent className="bg-crema">
          <AlertDialogHeader>
            <AlertDialogTitle className="font-heading text-2xl text-tinta">¿Eliminar esta formación?</AlertDialogTitle>
            <AlertDialogDescription className="font-sans">
              Se elimina la formación, sus inscripciones y las clases que tenga agendadas.
              Los alumnos NO se borran; conservan su cuenta.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={isPending}>Cancelar</AlertDialogCancel>
            <AlertDialogAction onClick={(e) => { e.preventDefault(); handleDelete() }} disabled={isPending} className="bg-red-600 hover:bg-red-700 text-white">Eliminar</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      <AlertDialog open={!!aLimpiar} onOpenChange={(o) => !o && setALimpiar(null)}>
        <AlertDialogContent className="bg-crema">
          <AlertDialogHeader>
            <AlertDialogTitle className="font-heading text-2xl text-tinta">¿Borrar las clases futuras?</AlertDialogTitle>
            <AlertDialogDescription className="font-sans">
              Se borran las {aLimpiar?.clases?.futuras} clases de <b>{aLimpiar?.nombre}</b> que todavía no
              ocurrieron, incluidas las que hayas cargado a mano desde Agenda. Las pasadas quedan.
              Después podés volver a generarlas con el horario nuevo.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={isPending}>Cancelar</AlertDialogCancel>
            <AlertDialogAction onClick={(e) => { e.preventDefault(); handleLimpiarFuturas() }} disabled={isPending} className="bg-red-600 hover:bg-red-700 text-white">
              {isPending ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : null} Borrar futuras
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Explorador de archivos de cualquier parte del bucket R2 */}
      <Dialog open={openBucket} onOpenChange={setOpenBucket}>
        <DialogContent className="sm:max-w-[640px] max-h-[85vh] overflow-y-auto bg-crema">
          <DialogHeader>
            <DialogTitle className="font-heading text-xl text-tinta flex items-center gap-2">
              <FolderOpen className="w-5 h-5 text-marca" />
              Elegir archivo del bucket (R2)
            </DialogTitle>
            <DialogDescription className="font-sans">
              Navegá cualquier carpeta del bucket y seleccioná libros o material extra para adjuntar a esta formación.
            </DialogDescription>
          </DialogHeader>

          {/* Breadcrumbs de navegación */}
          <div className="flex items-center gap-1.5 flex-wrap text-sm font-sans bg-card border border-border rounded-lg p-2.5">
            <button
              type="button"
              onClick={() => navegarBucket('')}
              className="text-tinta hover:text-marca font-bold hover:underline"
            >
              Inicio
            </button>
            {bucketTramos.map((tramo, i) => {
              const ruta = bucketTramos.slice(0, i + 1).join('/') + '/'
              return (
                <span key={i} className="flex items-center gap-1.5">
                  <ChevronRight className="w-3.5 h-3.5 text-muted-foreground" />
                  <button
                    type="button"
                    onClick={() => navegarBucket(ruta)}
                    className="text-tinta hover:text-marca hover:underline font-medium"
                  >
                    {tramo}
                  </button>
                </span>
              )
            })}
          </div>

          {bucketCargando ? (
            <div className="py-12 flex flex-col items-center justify-center text-muted-foreground gap-2">
              <Loader2 className="w-6 h-6 animate-spin text-marca" />
              <span className="text-sm font-sans">Leyendo carpeta del bucket...</span>
            </div>
          ) : bucketError ? (
            <div className="text-center py-8 space-y-2">
              <p className="text-red-600 dark:text-red-400 text-sm font-sans">{bucketError}</p>
              <Button size="sm" variant="outline" onClick={() => navegarBucket(bucketPrefijo)}>
                Reintentar
              </Button>
            </div>
          ) : !bucketListado || (bucketListado.carpetas.length === 0 && bucketListado.archivos.length === 0) ? (
            <div className="text-center py-12 text-muted-foreground text-sm font-sans">
              Carpeta vacía.
            </div>
          ) : (
            <div className="space-y-1.5 max-h-[380px] overflow-y-auto pr-1">
              {/* Carpetas del bucket */}
              {bucketListado.carpetas
                .filter((c) => c.prefijo !== PREFIJO_ENTREGAS_R2)
                .map((c) => (
                  <button
                    type="button"
                    key={c.prefijo}
                    onClick={() => navegarBucket(c.prefijo)}
                    className="w-full flex items-center justify-between px-3 py-2 rounded-lg bg-card border border-border hover:border-marca/40 hover:bg-marca/5 transition-colors text-left"
                  >
                    <div className="flex items-center gap-2.5 min-w-0">
                      <Folder className="w-4 h-4 text-marca shrink-0" />
                      <span className="text-sm font-medium text-tinta truncate font-sans">{c.nombre}</span>
                    </div>
                    <ChevronRight className="w-4 h-4 text-muted-foreground shrink-0" />
                  </button>
                ))}

              {/* Archivos del bucket */}
              {bucketListado.archivos.map((a) => {
                const yaElegido = recursosDisponibles.some(
                  (r) =>
                    recursosElegidos.includes(r.id) &&
                    (keyDeMarcadorR2(r.url_recurso || '') === a.key ||
                      r.titulo.toLowerCase() === a.nombre.replace(/\.[^.]+$/, '').toLowerCase())
                )
                const estaCargando = agregandoKey === a.key
                const tamanoMb = a.tamano ? `${(a.tamano / (1024 * 1024)).toFixed(1)} MB` : ''

                return (
                  <div
                    key={a.key}
                    className={`flex items-center justify-between px-3 py-2 rounded-lg border transition-colors ${
                      yaElegido
                        ? 'bg-marca/10 border-marca/30'
                        : 'bg-card border-border hover:border-marca/20'
                    }`}
                  >
                    <div className="flex items-center gap-2.5 min-w-0 flex-1 mr-2">
                      {iconoRecurso(null, a.nombre)}
                      <div className="min-w-0 flex-1">
                        <p className="text-sm font-medium text-tinta truncate font-sans">{a.nombre}</p>
                        {tamanoMb && <p className="text-xs text-muted-foreground font-mono">{tamanoMb}</p>}
                      </div>
                    </div>
                    <Button
                      type="button"
                      size="sm"
                      variant={yaElegido ? 'secondary' : 'outline'}
                      disabled={estaCargando}
                      onClick={() => handleToggleArchivoBucket(a.key, a.nombre)}
                      className={`h-8 text-xs font-sans shrink-0 ${
                        yaElegido
                          ? 'bg-marca text-crema hover:bg-red-600 hover:text-white'
                          : 'border-marca/40 text-marca hover:bg-marca hover:text-crema'
                      }`}
                    >
                      {estaCargando ? (
                        <Loader2 className="w-3.5 h-3.5 animate-spin" />
                      ) : yaElegido ? (
                        <>
                          <Check className="w-3.5 h-3.5 mr-1" />
                          Elegido
                        </>
                      ) : (
                        <>
                          <Plus className="w-3.5 h-3.5 mr-1" />
                          Seleccionar
                        </>
                      )}
                    </Button>
                  </div>
                )
              })}
            </div>
          )}

          <div className="flex items-center justify-between border-t border-border pt-3 mt-2">
            <span className="text-xs text-muted-foreground font-sans">
              {recursosElegidos.length === 1
                ? '1 material seleccionado en total'
                : `${recursosElegidos.length} materiales seleccionados en total`}
            </span>
            <Button
              type="button"
              onClick={() => setOpenBucket(false)}
              className="bg-marca hover:bg-marca/90 text-crema h-8 text-xs px-4"
            >
              Listo
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  )
}
