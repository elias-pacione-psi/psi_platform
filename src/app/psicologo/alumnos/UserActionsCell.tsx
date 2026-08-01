"use client";

import { useState, useTransition } from "react";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuSeparator, DropdownMenuTrigger } from "@/components/ui/dropdown-menu"
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from "@/components/ui/alert-dialog"
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Checkbox } from "@/components/ui/checkbox"
import { Loader2, Settings2, CheckCircle2, MoreVertical, ArchiveRestore, Ban, ArchiveX, Trash2 } from 'lucide-react'
import { toast } from 'sonner'
import { actualizarAlumno, cambiarEstadoAlumno, eliminarUsuarioTotal } from '../actions'

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export function UserActionsCell({ alumno, todosLosProgramas, stateType }: { alumno: any, todosLosProgramas: any[], stateType: string }) {
  const [showEditDialog, setShowEditDialog] = useState(false)
  const [showDeleteDialog, setShowDeleteDialog] = useState(false)
  const [showPurgeDialog, setShowPurgeDialog] = useState(false)
  const [purgeText, setPurgeText] = useState('')
  const [isPurging, startPurgeTransition] = useTransition()
  const [isPending, startTransition] = useTransition()
  const [errorMsg, setErrorMsg] = useState<string | null>(null)

  // Estado local de los checkboxes de programas
  const [selectedProgramas, setSelectedProgramas] = useState<string[]>(alumno.programasSeleccionados || [])

  const handleCheckboxChange = (programaId: string, checked: boolean) => {
    if (checked) {
      setSelectedProgramas(prev => [...prev, programaId])
    } else {
      setSelectedProgramas(prev => prev.filter(id => id !== programaId))
    }
  }

  const handleSubmitEdit = async (formData: FormData) => {
    selectedProgramas.forEach(programaId => {
      formData.append('programas', programaId)
    })

    startTransition(async () => {
      try {
        const result = await actualizarAlumno(formData)
        if (result?.error) {
          setErrorMsg(result.error)
        } else {
          setShowEditDialog(false)
          toast.success("Perfil de alumno actualizado")
        }
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      } catch (err: any) {
        setErrorMsg(err.message || 'Error inesperado')
      }
    })
  }

  const handleEstado = async (id: string, estado: 'activo' | 'suspendido' | 'eliminado') => {
    startTransition(async () => {
      try {
        const result = await cambiarEstadoAlumno(id, estado)
        if (result.error) {
          toast.error(`Error al cambiar estado: ${result.error}`)
        } else {
          toast.success(`Estado del alumno actualizado a ${estado}`)
        }
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      } catch (err: any) {
        toast.error(err.message || 'Error inesperado al cambiar estado')
      }
    })
  }

  const handlePurge = () => {
    startPurgeTransition(async () => {
      try {
        const result = await eliminarUsuarioTotal(alumno.id)
        if (result?.error) {
          toast.error(result.error)
        } else {
          setShowPurgeDialog(false)
          toast.success(`${alumno.nombre} fue eliminado definitivamente.`)
        }
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      } catch (err: any) {
        toast.error(err.message || 'Error inesperado')
      }
    })
  }

  const executeArchive = () => {
    handleEstado(alumno.id, 'eliminado')
    setShowDeleteDialog(false)
  }

  return (
    <>
      <DropdownMenu>
        <DropdownMenuTrigger render={
          <Button variant="ghost" className="h-8 w-8 p-0">
            <span className="sr-only">Abrir menú</span>
            <MoreVertical className="h-4 w-4" />
          </Button>
        } />
        <DropdownMenuContent align="end">
          <DropdownMenuItem onClick={(e) => { e.preventDefault(); setShowEditDialog(true); }}>
            <Settings2 className="mr-2 h-4 w-4 text-tinta" />
            <span>Gestionar / Editar</span>
          </DropdownMenuItem>
          <DropdownMenuSeparator />

          {stateType !== 'eliminado' && (
            <>
              {stateType === 'activo' ? (
                <DropdownMenuItem onClick={(e) => { e.preventDefault(); handleEstado(alumno.id, 'suspendido'); }}>
                  <Ban className="mr-2 h-4 w-4 text-orange-600 dark:text-orange-400" />
                  <span className="text-orange-600 dark:text-orange-400">Suspender acceso</span>
                </DropdownMenuItem>
              ) : (
                <DropdownMenuItem onClick={(e) => { e.preventDefault(); handleEstado(alumno.id, 'activo'); }}>
                  <CheckCircle2 className="mr-2 h-4 w-4 text-green-600 dark:text-green-400" />
                  <span className="text-green-600 dark:text-green-400">Reactivar acceso</span>
                </DropdownMenuItem>
              )}

              <DropdownMenuSeparator />
              <DropdownMenuItem onClick={(e) => { e.preventDefault(); setShowDeleteDialog(true); }}>
                <ArchiveX className="mr-2 h-4 w-4 text-red-600 dark:text-red-400" />
                <span className="text-red-600 dark:text-red-400 font-bold">Eliminar / Archivar</span>
              </DropdownMenuItem>
            </>
          )}

          {stateType === 'eliminado' && (
            <>
              <DropdownMenuItem onClick={(e) => { e.preventDefault(); handleEstado(alumno.id, 'activo'); }}>
                <ArchiveRestore className="mr-2 h-4 w-4 text-green-600 dark:text-green-400" />
                <span className="text-green-600 dark:text-green-400">Restaurar usuario</span>
              </DropdownMenuItem>
              <DropdownMenuSeparator />
              <DropdownMenuItem onClick={(e) => { e.preventDefault(); setPurgeText(''); setShowPurgeDialog(true); }}>
                <Trash2 className="mr-2 h-4 w-4 text-red-700 dark:text-red-400" />
                <span className="text-red-700 dark:text-red-400 font-bold">Eliminar definitivamente</span>
              </DropdownMenuItem>
            </>
          )}
        </DropdownMenuContent>
      </DropdownMenu>

      <AlertDialog open={showDeleteDialog} onOpenChange={setShowDeleteDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle className="text-tinta font-serif text-2xl">¿Archivar este alumno?</AlertDialogTitle>
            <AlertDialogDescription className="font-sans">
              Esto bloquea el acceso del alumno a la plataforma (ban) y lo mueve al historial, conservando su cuenta y asignaciones por si vuelve a retomar.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction onClick={executeArchive} className="bg-red-600 hover:bg-red-700 text-white">
              Confirmar y archivar
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      <AlertDialog open={showPurgeDialog} onOpenChange={(open) => { setShowPurgeDialog(open); if (!open) setPurgeText('') }}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle className="text-red-700 dark:text-red-400 font-serif text-2xl">Eliminar definitivamente</AlertDialogTitle>
            <AlertDialogDescription className="font-sans">
              Esto borra de forma <strong>irreversible</strong> a <strong>{alumno.nombre}</strong> y todos sus datos: cuenta, asignaciones de contenido y agenda de sesiones. No se puede deshacer.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <div className="space-y-2">
            <Label className="font-sans text-sm text-tinta">Para confirmar, escribí el nombre del alumno: <strong>{alumno.nombre}</strong></Label>
            <Input
              value={purgeText}
              onChange={(e) => setPurgeText(e.target.value)}
              placeholder={alumno.nombre}
              className="bg-card border-border"
              disabled={isPurging}
            />
          </div>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={isPurging}>Cancelar</AlertDialogCancel>
            <Button
              onClick={handlePurge}
              disabled={isPurging || purgeText.trim() !== alumno.nombre}
              className="bg-red-700 hover:bg-red-800 text-white"
            >
              {isPurging ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : 'Eliminar todo'}
            </Button>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      <Dialog open={showEditDialog} onOpenChange={(open) => {
        if (!open) {
          setErrorMsg(null)
        }
        setShowEditDialog(open)
      }}>
        <DialogContent className="sm:max-w-[600px] max-h-[90vh] overflow-y-auto bg-crema">
          <DialogHeader>
            <DialogTitle className="font-heading text-2xl text-tinta">Gestionar alumno: {alumno.nombre}</DialogTitle>
            <DialogDescription className="font-sans">
              Actualizá los datos de contacto y asignale los programas que corresponda.
            </DialogDescription>
          </DialogHeader>

          <form action={handleSubmitEdit} className="space-y-6 mt-4">
            <input type="hidden" name="id" value={alumno.id} />

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor={`nombre-${alumno.id}`} className="font-bold text-tinta">Nombre del alumno</Label>
                <Input id={`nombre-${alumno.id}`} name="nombre" defaultValue={alumno.nombre} className="bg-card border-border" required />
              </div>
              <div className="space-y-2">
                <Label htmlFor={`email-${alumno.id}`} className="font-bold text-tinta">Correo electrónico</Label>
                <Input id={`email-${alumno.id}`} defaultValue={alumno.email} className="bg-muted border-border text-muted-foreground cursor-not-allowed" disabled />
                <p className="text-xs text-muted-foreground mt-1">El email no puede cambiarse acá por seguridad.</p>
              </div>
              <div className="space-y-2">
                <Label htmlFor={`telefono-${alumno.id}`} className="font-bold text-tinta">Teléfono / WhatsApp</Label>
                <Input id={`telefono-${alumno.id}`} name="telefono" defaultValue={alumno.telefono || ''} className="bg-card border-border" />
              </div>
              <div className="space-y-2">
                <Label htmlFor={`link_videollamada-${alumno.id}`} className="font-bold text-tinta">Link de videollamada</Label>
                <Input id={`link_videollamada-${alumno.id}`} name="link_videollamada" defaultValue={alumno.link_videollamada || ''} className="bg-card border-border" placeholder="https://meet.google.com/... o Zoom" />
              </div>
            </div>

            <div className="space-y-3 pt-4 border-t border-border">
              <Label className="font-bold text-tinta block">Programas asignados (contenido)</Label>
              <div className="grid gap-3 max-h-[200px] overflow-y-auto p-2 bg-card rounded-xl border border-border">
                {todosLosProgramas.length === 0 && (
                  <p className="text-sm text-muted-foreground p-2">No hay programas creados todavía.</p>
                )}
                {todosLosProgramas.map((programa) => (
                  <div key={programa.id} className="flex items-center space-x-3 bg-muted p-3 rounded-lg border border-border">
                    <Checkbox
                      id={`programa-${alumno.id}-${programa.id}`}
                      checked={selectedProgramas.includes(programa.id)}
                      onCheckedChange={(checked) => handleCheckboxChange(programa.id, checked as boolean)}
                    />
                    <div className="grid leading-none cursor-pointer" onClick={() => handleCheckboxChange(programa.id, !selectedProgramas.includes(programa.id))}>
                      <label className="text-sm font-medium leading-none text-tinta peer-disabled:cursor-not-allowed peer-disabled:opacity-70">
                        {programa.titulo}
                      </label>
                      <p className="text-xs text-muted-foreground mt-1 line-clamp-1">{programa.descripcion}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {errorMsg && <p className="text-red-600 dark:text-red-400 text-sm">{errorMsg}</p>}

            <div className="flex justify-end pt-4">
              <Button type="submit" disabled={isPending} className="bg-marca hover:bg-marca/90 text-crema w-full sm:w-auto px-8">
                {isPending ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : "Guardar cambios"}
              </Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>
    </>
  )
}
