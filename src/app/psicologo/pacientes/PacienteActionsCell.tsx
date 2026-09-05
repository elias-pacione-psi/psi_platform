'use client'

import { useState, useTransition } from 'react'
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuSeparator, DropdownMenuTrigger } from '@/components/ui/dropdown-menu'
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from '@/components/ui/alert-dialog'
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Checkbox } from '@/components/ui/checkbox'
import { Loader2, Settings2, CheckCircle2, MoreVertical, ArchiveRestore, Ban, ArchiveX, Trash2, BookMarked, GraduationCap } from 'lucide-react'
import { toast } from 'sonner'
import { actualizarPaciente, entregarMaterialAPaciente, cambiarVinculo } from './actions'
import { cambiarEstadoAlumno, eliminarUsuarioTotal } from '../actions'
import { LABEL_TIPO_MEDIO } from '@/utils/taxonomia-labels'
import type { RecursoBiblioteca } from './PacientesClient'

// Suspender, archivar y borrar salen de las actions de Alumnos a propósito: un paciente
// es una fila más de la misma tabla y el ban de Auth es el mismo, así que duplicar esa
// lógica sería tener dos formas distintas de bloquear a alguien.

// tipo_contenido ('r2_pdf', 'drive_video'…) → etiqueta corta. La versión server-only
// (tipoMedioPorTipoContenido) no se puede importar en un componente cliente.
function etiquetaDeTipo(tipoContenido: string): string {
  const medio = tipoContenido.split('_').pop() ?? ''
  return LABEL_TIPO_MEDIO[medio === 'image' ? 'imagen' : medio] ?? 'Recurso'
}

export function PacienteActionsCell({
  paciente,
  recursos,
  stateType,
// eslint-disable-next-line @typescript-eslint/no-explicit-any
}: { paciente: any, recursos: RecursoBiblioteca[], stateType: string }) {
  const [showEditDialog, setShowEditDialog] = useState(false)
  const [showMaterialDialog, setShowMaterialDialog] = useState(false)
  const [showDeleteDialog, setShowDeleteDialog] = useState(false)
  const [showPurgeDialog, setShowPurgeDialog] = useState(false)
  const [purgeText, setPurgeText] = useState('')
  const [isPurging, startPurgeTransition] = useTransition()
  const [isPending, startTransition] = useTransition()
  const [errorMsg, setErrorMsg] = useState<string | null>(null)
  const [busquedaMaterial, setBusquedaMaterial] = useState('')

  const [seleccionados, setSeleccionados] = useState<string[]>(paciente.materialesAsignados || [])

  const toggleRecurso = (id: string, checked: boolean) => {
    setSeleccionados(prev => checked ? [...prev, id] : prev.filter(r => r !== id))
  }

  const handleSubmitEdit = (formData: FormData) => {
    startTransition(async () => {
      const result = await actualizarPaciente(formData)
      if (result?.error) setErrorMsg(result.error)
      else {
        setShowEditDialog(false)
        toast.success('Datos del paciente actualizados')
      }
    })
  }

  const handleGuardarMaterial = () => {
    startTransition(async () => {
      const result = await entregarMaterialAPaciente(paciente.id, seleccionados)
      if (result?.error) toast.error(result.error)
      else {
        setShowMaterialDialog(false)
        toast.success(
          seleccionados.length === 0
            ? `Se le quitó todo el material a ${paciente.nombre}.`
            : `${paciente.nombre} ya tiene ${seleccionados.length} recurso(s) en su Biblioteca.`,
        )
      }
    })
  }

  // Espejo del de Alumnos: suma o saca el lado de alumno sin tocar el de paciente.
  const handleVinculoAlumno = () => {
    startTransition(async () => {
      const result = await cambiarVinculo(paciente.id, { esAlumno: !paciente.es_alumno, esPaciente: true })
      if (result?.error) toast.error(result.error)
      else toast.success(paciente.es_alumno
        ? `${paciente.nombre} salió de la lista de alumnos (sigue siendo paciente).`
        : `${paciente.nombre} ahora también aparece en Alumnos.`)
    })
  }

  const handleEstado = (id: string, estado: 'activo' | 'suspendido' | 'eliminado') => {
    startTransition(async () => {
      const result = await cambiarEstadoAlumno(id, estado)
      if (result?.error) toast.error(`Error al cambiar estado: ${result.error}`)
      else toast.success(`Estado del paciente actualizado a ${estado}`)
    })
  }

  const handlePurge = () => {
    startPurgeTransition(async () => {
      const result = await eliminarUsuarioTotal(paciente.id)
      if (result?.error) toast.error(result.error)
      else {
        setShowPurgeDialog(false)
        toast.success(`${paciente.nombre} fue eliminado definitivamente.`)
      }
    })
  }

  const recursosFiltrados = recursos.filter((r) =>
    r.titulo?.toLowerCase().includes(busquedaMaterial.toLowerCase()),
  )

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
          <DropdownMenuItem onClick={(e) => { e.preventDefault(); setShowEditDialog(true) }}>
            <Settings2 className="mr-2 h-4 w-4 text-tinta" />
            <span>Gestionar / Editar</span>
          </DropdownMenuItem>
          <DropdownMenuItem onClick={(e) => { e.preventDefault(); setSeleccionados(paciente.materialesAsignados || []); setBusquedaMaterial(''); setShowMaterialDialog(true) }}>
            <BookMarked className="mr-2 h-4 w-4 text-marca" />
            <span>Entregar material</span>
          </DropdownMenuItem>
          <DropdownMenuItem onClick={(e) => { e.preventDefault(); handleVinculoAlumno() }}>
            <GraduationCap className="mr-2 h-4 w-4 text-marca" />
            <span>{paciente.es_alumno ? 'Quitar de Alumnos' : 'Marcar también como alumno'}</span>
          </DropdownMenuItem>
          <DropdownMenuSeparator />

          {stateType !== 'eliminado' && (
            <>
              {stateType === 'activo' ? (
                <DropdownMenuItem onClick={(e) => { e.preventDefault(); handleEstado(paciente.id, 'suspendido') }}>
                  <Ban className="mr-2 h-4 w-4 text-orange-600 dark:text-orange-400" />
                  <span className="text-orange-600 dark:text-orange-400">Suspender acceso</span>
                </DropdownMenuItem>
              ) : (
                <DropdownMenuItem onClick={(e) => { e.preventDefault(); handleEstado(paciente.id, 'activo') }}>
                  <CheckCircle2 className="mr-2 h-4 w-4 text-green-600 dark:text-green-400" />
                  <span className="text-green-600 dark:text-green-400">Reactivar acceso</span>
                </DropdownMenuItem>
              )}

              <DropdownMenuSeparator />
              <DropdownMenuItem onClick={(e) => { e.preventDefault(); setShowDeleteDialog(true) }}>
                <ArchiveX className="mr-2 h-4 w-4 text-red-600 dark:text-red-400" />
                <span className="text-red-600 dark:text-red-400 font-bold">Eliminar / Archivar</span>
              </DropdownMenuItem>
            </>
          )}

          {stateType === 'eliminado' && (
            <>
              <DropdownMenuItem onClick={(e) => { e.preventDefault(); handleEstado(paciente.id, 'activo') }}>
                <ArchiveRestore className="mr-2 h-4 w-4 text-green-600 dark:text-green-400" />
                <span className="text-green-600 dark:text-green-400">Restaurar paciente</span>
              </DropdownMenuItem>
              <DropdownMenuSeparator />
              <DropdownMenuItem onClick={(e) => { e.preventDefault(); setPurgeText(''); setShowPurgeDialog(true) }}>
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
            <AlertDialogTitle className="text-tinta font-serif text-2xl">¿Archivar este paciente?</AlertDialogTitle>
            <AlertDialogDescription className="font-sans">
              Esto bloquea su acceso a la plataforma (ban) y lo mueve al historial,
              conservando su cuenta, su agenda y el material que le entregaste por si vuelve.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction
              onClick={() => { handleEstado(paciente.id, 'eliminado'); setShowDeleteDialog(false) }}
              className="bg-red-600 hover:bg-red-700 text-white"
            >
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
              Esto borra de forma <strong>irreversible</strong> a <strong>{paciente.nombre}</strong> y
              todos sus datos: cuenta, material entregado y agenda de sesiones. No se puede deshacer.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <div className="space-y-2">
            <Label className="font-sans text-sm text-tinta">Para confirmar, escribí el nombre del paciente: <strong>{paciente.nombre}</strong></Label>
            <Input
              value={purgeText}
              onChange={(e) => setPurgeText(e.target.value)}
              placeholder={paciente.nombre}
              className="bg-card border-border"
              disabled={isPurging}
            />
          </div>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={isPurging}>Cancelar</AlertDialogCancel>
            <Button
              onClick={handlePurge}
              disabled={isPurging || purgeText.trim() !== paciente.nombre}
              className="bg-red-700 hover:bg-red-800 text-white"
            >
              {isPurging ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : 'Eliminar todo'}
            </Button>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      <Dialog open={showEditDialog} onOpenChange={(open) => { if (!open) setErrorMsg(null); setShowEditDialog(open) }}>
        <DialogContent className="sm:max-w-[600px] max-h-[90vh] overflow-y-auto bg-crema">
          <DialogHeader>
            <DialogTitle className="font-heading text-2xl text-tinta">Gestionar paciente: {paciente.nombre}</DialogTitle>
            <DialogDescription className="font-sans">
              Actualizá los datos de contacto. El material se entrega desde
              &quot;Entregar material&quot; y las sesiones se agendan desde Agenda.
            </DialogDescription>
          </DialogHeader>

          <form action={handleSubmitEdit} className="space-y-6 mt-4">
            <input type="hidden" name="id" value={paciente.id} />

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor={`nombre-${paciente.id}`} className="font-bold text-tinta">Nombre del paciente</Label>
                <Input id={`nombre-${paciente.id}`} name="nombre" defaultValue={paciente.nombre} className="bg-card border-border" required />
              </div>
              <div className="space-y-2">
                <Label htmlFor={`email-${paciente.id}`} className="font-bold text-tinta">Correo electrónico</Label>
                <Input id={`email-${paciente.id}`} defaultValue={paciente.email} className="bg-muted border-border text-muted-foreground cursor-not-allowed" disabled />
                <p className="text-xs text-muted-foreground mt-1">El email no puede cambiarse acá por seguridad.</p>
              </div>
              <div className="space-y-2">
                <Label htmlFor={`telefono-${paciente.id}`} className="font-bold text-tinta">Teléfono / WhatsApp</Label>
                <Input id={`telefono-${paciente.id}`} name="telefono" defaultValue={paciente.telefono || ''} className="bg-card border-border" />
              </div>
              <div className="space-y-2">
                <Label htmlFor={`link-${paciente.id}`} className="font-bold text-tinta">Link de videollamada</Label>
                <Input id={`link-${paciente.id}`} name="link_videollamada" defaultValue={paciente.link_videollamada || ''} className="bg-card border-border" placeholder="https://meet.google.com/... o Zoom" />
              </div>
            </div>

            {errorMsg && <p className="text-red-600 dark:text-red-400 text-sm">{errorMsg}</p>}

            <div className="flex justify-end pt-4">
              <Button type="submit" disabled={isPending} className="bg-marca hover:bg-marca/90 text-crema w-full sm:w-auto px-8">
                {isPending ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : 'Guardar cambios'}
              </Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>

      <Dialog open={showMaterialDialog} onOpenChange={setShowMaterialDialog}>
        <DialogContent className="sm:max-w-[600px] max-h-[90vh] overflow-y-auto bg-crema">
          <DialogHeader>
            <DialogTitle className="font-heading text-2xl text-tinta">Entregar material a {paciente.nombre}</DialogTitle>
            <DialogDescription className="font-sans">
              Lo que marques acá aparece en la Biblioteca del paciente, con el visor
              seguro. Es el mismo material de tu Biblioteca — para sumar libros nuevos,
              subilos a <span className="font-mono">Biblioteca R2</span> desde Disco Duro.
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4 mt-4">
            {recursos.length === 0 ? (
              <p className="text-sm text-muted-foreground p-4 bg-card rounded-xl border border-border">
                Todavía no hay material en la Biblioteca. Subí un PDF a la carpeta{' '}
                <span className="font-mono">Biblioteca R2</span> desde Disco Duro y aparece acá solo.
              </p>
            ) : (
              <>
                <Input
                  placeholder="Buscar material..."
                  value={busquedaMaterial}
                  onChange={(e) => setBusquedaMaterial(e.target.value)}
                  className="bg-card border-border"
                />
                <div className="grid gap-3 max-h-[320px] overflow-y-auto p-2 bg-card rounded-xl border border-border">
                  {recursosFiltrados.length === 0 ? (
                    <p className="text-sm text-muted-foreground p-2">No hay material que coincida con la búsqueda.</p>
                  ) : recursosFiltrados.map((recurso) => (
                    <div key={recurso.id} className="flex items-center space-x-3 bg-muted p-3 rounded-lg border border-border">
                      <Checkbox
                        id={`recurso-${paciente.id}-${recurso.id}`}
                        checked={seleccionados.includes(recurso.id)}
                        onCheckedChange={(checked) => toggleRecurso(recurso.id, checked as boolean)}
                      />
                      <div
                        className="grid leading-none cursor-pointer"
                        onClick={() => toggleRecurso(recurso.id, !seleccionados.includes(recurso.id))}
                      >
                        <label className="text-sm font-medium leading-none text-tinta">{recurso.titulo}</label>
                        <p className="text-xs text-muted-foreground mt-1">{etiquetaDeTipo(recurso.tipo_contenido)}</p>
                      </div>
                    </div>
                  ))}
                </div>
                <p className="text-xs text-muted-foreground">
                  {seleccionados.length} de {recursos.length} seleccionados. Al guardar, la
                  Biblioteca del paciente queda exactamente con lo que está marcado.
                </p>
              </>
            )}

            <div className="flex justify-end pt-2">
              <Button
                onClick={handleGuardarMaterial}
                disabled={isPending || recursos.length === 0}
                className="bg-marca hover:bg-marca/90 text-crema w-full sm:w-auto px-8"
              >
                {isPending ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : 'Guardar material'}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </>
  )
}
