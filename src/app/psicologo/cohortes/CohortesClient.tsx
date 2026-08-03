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
  generarClasesDeCohorte, borrarClasesFuturasDeCohorte,
} from '../actions'
import { Loader2, Plus, Settings2, Trash2, GraduationCap, Users, UserMinus, CalendarClock, CalendarPlus, TriangleAlert } from 'lucide-react'
import { toast } from 'sonner'
import { DIAS_SEMANA, etiquetaHorario, fechasDeClases, horarioCompleto } from '@/utils/horario-cohorte'

// eslint-disable-next-line @typescript-eslint/no-explicit-any
type Cohorte = any

export function CohortesClient({ cohortes, programas, alumnos }: { cohortes: Cohorte[], programas: { id: string, titulo: string }[], alumnos: Cohorte[] }) {
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
  const [dias, setDias] = useState<number[]>([])
  const [fechaInicio, setFechaInicio] = useState('')
  const [fechaFin, setFechaFin] = useState('')
  const [horaInicio, setHoraInicio] = useState('')
  const [horaFin, setHoraFin] = useState('')

  const openFormModal = (c: Cohorte = null) => {
    setSelected(c)
    setErrorMsg(null)
    setProgramasElegidos(c?.programaIds ?? [])
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
    dias.forEach((d) => formData.append('dias_semana', String(d)))
    startTransition(async () => {
      const result = await guardarCohorte(formData)
      if (result?.error) setErrorMsg(result.error)
      else { toast.success('Comisión guardada'); setOpenForm(false) }
    })
  }

  function handleDelete() {
    if (!toDelete) return
    startTransition(async () => {
      const result = await eliminarCohorte(toDelete)
      if (result?.error) toast.error(result.error)
      else toast.success('Comisión eliminada')
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
      else toast.success('Alumno dado de baja de la comisión')
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

  return (
    <div className="space-y-4">
      <div className="flex justify-end">
        <Button onClick={() => openFormModal(null)} className="bg-marca hover:bg-marca/90 text-crema">
          <Plus className="w-4 h-4 mr-2" /> Crear comisión
        </Button>
      </div>

      {cohortes.length === 0 ? (
        <div className="bg-card border border-border rounded-xl p-12 text-center text-muted-foreground">
          <GraduationCap className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
          Todavía no hay comisiones. Creá una para inscribir alumnos a uno o más programas.
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

      {/* Crear/editar comisión */}
      <Dialog open={openForm} onOpenChange={setOpenForm}>
        <DialogContent className="sm:max-w-[560px] bg-crema max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="font-heading text-2xl text-tinta">{selected ? 'Editar comisión' : 'Nueva comisión'}</DialogTitle>
            <DialogDescription className="font-sans">
              Los inscriptos ven el contenido de todos los programas que asocies acá.
            </DialogDescription>
          </DialogHeader>
          <form action={handleSubmit} className="space-y-4 mt-4">
            {selected && <input type="hidden" name="id" value={selected.id} />}

            <div className="space-y-2">
              <Label className="font-bold text-tinta">Nombre</Label>
              <Input name="nombre" defaultValue={selected?.nombre || ''} placeholder="Ej: Formación 2026 · Comisión A" className="bg-card border-border" required />
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
            <AlertDialogTitle className="font-heading text-2xl text-tinta">¿Eliminar esta comisión?</AlertDialogTitle>
            <AlertDialogDescription className="font-sans">
              Se elimina la comisión, sus inscripciones y las clases que tenga agendadas.
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
    </div>
  )
}
