'use client'

import { useState, useTransition } from 'react'
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Checkbox } from "@/components/ui/checkbox"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from "@/components/ui/alert-dialog"
import { guardarCohorte, eliminarCohorte, inscribirAlumnosEnCohorte, quitarAlumnoDeCohorte } from '../actions'
import { Loader2, Plus, Settings2, Trash2, GraduationCap, Users, UserMinus } from 'lucide-react'
import { toast } from 'sonner'

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export function CohortesClient({ cohortes, programas, alumnos }: { cohortes: any[], programas: any[], alumnos: any[] }) {
  const [isPending, startTransition] = useTransition()
  const [openForm, setOpenForm] = useState(false)
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const [selected, setSelected] = useState<any>(null)
  const [errorMsg, setErrorMsg] = useState<string | null>(null)
  const [toDelete, setToDelete] = useState<string | null>(null)

  // Inscripción
  const [openEnroll, setOpenEnroll] = useState(false)
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const [enrollCohorte, setEnrollCohorte] = useState<any>(null)
  const [selectedAlumnos, setSelectedAlumnos] = useState<string[]>([])
  const [search, setSearch] = useState('')

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const openFormModal = (c: any = null) => { setSelected(c); setErrorMsg(null); setOpenForm(true) }

  function handleSubmit(formData: FormData) {
    setErrorMsg(null)
    startTransition(async () => {
      const result = await guardarCohorte(formData)
      if (result?.error) setErrorMsg(result.error)
      else { toast.success('Cohorte guardada'); setOpenForm(false) }
    })
  }

  function handleDelete() {
    if (!toDelete) return
    startTransition(async () => {
      const result = await eliminarCohorte(toDelete)
      if (result?.error) toast.error(result.error)
      else toast.success('Cohorte eliminada')
      setToDelete(null)
    })
  }

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const openEnrollModal = (c: any) => {
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
      else toast.success('Alumno dado de baja de la cohorte')
    })
  }

  const toggle = (id: string, checked: boolean) =>
    setSelectedAlumnos(prev => checked ? [...prev, id] : prev.filter(a => a !== id))

  return (
    <div className="space-y-4">
      <div className="flex justify-end">
        <Button onClick={() => openFormModal(null)} className="bg-marca hover:bg-marca/90 text-crema">
          <Plus className="w-4 h-4 mr-2" /> Crear cohorte
        </Button>
      </div>

      {cohortes.length === 0 ? (
        <div className="bg-card border border-border rounded-xl p-12 text-center text-muted-foreground">
          <GraduationCap className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
          Todavía no hay cohortes. Creá una para inscribir alumnos a un programa.
        </div>
      ) : (
        <div className="grid gap-4 md:grid-cols-2">
          {cohortes.map((c) => (
            <div key={c.id} className="bg-card border border-border rounded-xl shadow-sm p-5 space-y-3">
              <div className="flex items-start justify-between">
                <div>
                  <h3 className="font-heading font-bold text-xl text-tinta">{c.nombre}</h3>
                  <p className="text-sm text-muted-foreground">{c.programas?.titulo}</p>
                  {(c.fecha_inicio || c.fecha_fin) && (
                    <p className="text-xs text-muted-foreground mt-1">
                      {c.fecha_inicio || '—'} → {c.fecha_fin || '—'}
                    </p>
                  )}
                </div>
                <div className="flex gap-1">
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
                      <button onClick={() => handleQuitar(c.id, ca.alumno_id)} disabled={isPending} className="text-tinta/40 hover:text-red-600 dark:hover:text-red-400 dark:hover:text-red-400"><UserMinus className="w-3 h-3" /></button>
                    </span>
                  ))}
                  {(c.cohortes_alumnos?.length || 0) > 6 && <span className="text-xs text-muted-foreground">+{c.cohortes_alumnos.length - 6} más</span>}
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Crear/editar cohorte */}
      <Dialog open={openForm} onOpenChange={setOpenForm}>
        <DialogContent className="sm:max-w-[500px] bg-crema">
          <DialogHeader>
            <DialogTitle className="font-heading text-2xl text-tinta">{selected ? 'Editar cohorte' : 'Nueva cohorte'}</DialogTitle>
            <DialogDescription className="font-sans">Asociá la cohorte a un programa. Los inscriptos verán ese contenido.</DialogDescription>
          </DialogHeader>
          <form action={handleSubmit} className="space-y-4 mt-4">
            {selected && <input type="hidden" name="id" value={selected.id} />}
            <div className="space-y-2">
              <Label className="font-bold text-tinta">Nombre</Label>
              <Input name="nombre" defaultValue={selected?.nombre || ''} placeholder="Ej: Formación TCC 2026 - Comisión A" className="bg-card border-border" required />
            </div>
            <div className="space-y-2">
              <Label className="font-bold text-tinta">Programa</Label>
              <Select
                name="programa_id"
                defaultValue={selected?.programa_id || undefined}
                required
                items={Object.fromEntries(programas.map((p) => [p.id, p.titulo]))}
              >
                <SelectTrigger className="bg-card border-border"><SelectValue placeholder="Elegí un programa" /></SelectTrigger>
                <SelectContent>
                  {programas.map((p) => <SelectItem key={p.id} value={p.id}>{p.titulo}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-2">
                <Label className="font-bold text-tinta text-sm">Inicio</Label>
                <Input type="date" name="fecha_inicio" defaultValue={selected?.fecha_inicio || ''} className="bg-card border-border" />
              </div>
              <div className="space-y-2">
                <Label className="font-bold text-tinta text-sm">Fin</Label>
                <Input type="date" name="fecha_fin" defaultValue={selected?.fecha_fin || ''} className="bg-card border-border" />
              </div>
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
              {alumnos.filter(a => a.nombre?.toLowerCase().includes(search.toLowerCase()) || a.email?.toLowerCase().includes(search.toLowerCase())).map((a) => (
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
            <AlertDialogTitle className="font-heading text-2xl text-tinta">¿Eliminar esta cohorte?</AlertDialogTitle>
            <AlertDialogDescription className="font-sans">Se elimina la cohorte y sus inscripciones. Los alumnos NO se borran; conservan su cuenta.</AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={isPending}>Cancelar</AlertDialogCancel>
            <AlertDialogAction onClick={(e) => { e.preventDefault(); handleDelete() }} disabled={isPending} className="bg-red-600 hover:bg-red-700 text-white">Eliminar</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  )
}
