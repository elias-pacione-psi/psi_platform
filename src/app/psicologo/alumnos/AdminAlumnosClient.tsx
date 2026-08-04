'use client'

import { useState, useTransition } from 'react'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { UserActionsCell } from './UserActionsCell'
import { CrearAlumnoDialog } from './CrearAlumnoDialog'
import { Check, Loader2, X } from 'lucide-react'
import { toast } from 'sonner'
import { aprobarSolicitud, rechazarSolicitud } from '../actions'
import { LABEL_INTERES } from '@/utils/taxonomia-labels'

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export function AdminAlumnosClient({ alumnos, todosLosProgramas, solicitudes }: { alumnos: any[], todosLosProgramas: any[], solicitudes?: any[] }) {
  const [searchTerm, setSearchTerm] = useState('')
  const [isPending, startTransition] = useTransition()
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const [porAprobar, setPorAprobar] = useState<any>(null)
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const [porRechazar, setPorRechazar] = useState<any>(null)

  const activos = alumnos.filter(a => a.estado === 'activo' || !a.estado)
  const suspendidos = alumnos.filter(a => a.estado === 'suspendido')
  const eliminados = alumnos.filter(a => a.estado === 'eliminado')
  const consultas = solicitudes || []

  const handleAprobar = () => {
    if (!porAprobar) return
    startTransition(async () => {
      const res = await aprobarSolicitud(porAprobar.id)
      if (res?.error) {
        toast.error(res.error)
      } else {
        toast.success(`Invitación enviada a ${porAprobar.email}`)
        setPorAprobar(null)
      }
    })
  }

  const handleRechazar = () => {
    if (!porRechazar) return
    startTransition(async () => {
      const res = await rechazarSolicitud(porRechazar.id)
      if (res?.error) {
        toast.error(res.error)
      } else {
        toast.success('Solicitud descartada')
        setPorRechazar(null)
      }
    })
  }

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const renderUsersTable = (users: any[], stateType: string) => {
    const filteredUsers = users.filter((u: { nombre: string, email: string }) =>
      u.nombre?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      u.email?.toLowerCase().includes(searchTerm.toLowerCase())
    )

    return (
      <div className="flex flex-col">
        <div className="p-4 border-b border-border bg-muted/50">
          <Input
            placeholder="Buscar por nombre o email..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="max-w-md bg-card"
          />
        </div>
        <Table>
          <TableHeader className="bg-muted">
            <TableRow>
              <TableHead className="font-heading font-semibold text-tinta">Nombre / Email</TableHead>
              <TableHead className="font-heading font-semibold text-tinta">Comisión</TableHead>
              <TableHead className="font-heading font-semibold text-tinta">Progreso</TableHead>
              <TableHead className="font-heading font-semibold text-tinta">Entregas</TableHead>
              <TableHead className="text-right font-heading font-semibold text-tinta">Acciones</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {filteredUsers.length === 0 ? (
              <TableRow>
                <TableCell colSpan={5} className="text-center py-8 text-muted-foreground">No hay resultados para la búsqueda.</TableCell>
              </TableRow>
            ) : filteredUsers.map((alumno) => (
              <TableRow key={alumno.id}>
                <TableCell>
                  <div className="font-medium text-tinta">{alumno.nombre}</div>
                  <div className="text-muted-foreground text-sm">{alumno.email}</div>
                </TableCell>
                <TableCell className="text-muted-foreground text-sm">
                  {alumno.cohorteNombre || 'Sin comisión'}
                </TableCell>
                <TableCell className="text-muted-foreground text-sm">
                  {alumno.progresoTexto || '0/0 · 0%'}
                </TableCell>
                <TableCell>
                  <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                    alumno.estadoEntregas?.includes('pendientes')
                      ? 'bg-orange-100 text-orange-800 dark:bg-orange-900/30 dark:text-orange-300'
                      : alumno.estadoEntregas?.includes('Al día')
                      ? 'bg-marca/10 text-marca'
                      : 'bg-muted text-muted-foreground'
                  }`}>
                    {alumno.estadoEntregas || 'Sin entregas'}
                  </span>
                </TableCell>
                <TableCell className="text-right">
                  <UserActionsCell
                    alumno={alumno}
                    todosLosProgramas={todosLosProgramas}
                    stateType={stateType}
                  />
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>
    )
  }

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const renderConsultasTable = (lista: any[]) => {
    return (
      <div className="flex flex-col">
        <Table>
          <TableHeader className="bg-muted">
            <TableRow>
              <TableHead className="font-heading font-semibold text-tinta">Contacto</TableHead>
              <TableHead className="font-heading font-semibold text-tinta">Interés</TableHead>
              <TableHead className="font-heading font-semibold text-tinta">Teléfono</TableHead>
              <TableHead className="font-heading font-semibold text-tinta max-w-sm">Motivo / Objetivos</TableHead>
              <TableHead className="font-heading font-semibold text-tinta">Fecha</TableHead>
              <TableHead className="text-right font-heading font-semibold text-tinta">Acciones</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {lista.length === 0 ? (
              <TableRow>
                <TableCell colSpan={6} className="text-center py-8 text-muted-foreground">No hay solicitudes nuevas.</TableCell>
              </TableRow>
            ) : lista.map((req) => (
              <TableRow key={req.id}>
                <TableCell>
                  <div className="font-medium text-tinta">{req.nombre}</div>
                  <div className="text-muted-foreground text-sm">{req.email}</div>
                </TableCell>
                <TableCell className="text-sm">
                  {req.interes ? (
                    <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-marca/10 text-marca whitespace-nowrap">
                      {LABEL_INTERES[req.interes] ?? req.interes}
                    </span>
                  ) : (
                    <span className="text-muted-foreground">—</span>
                  )}
                </TableCell>
                <TableCell className="text-muted-foreground text-sm">
                  {req.telefono || '-'}
                </TableCell>
                <TableCell className="text-muted-foreground text-sm whitespace-pre-wrap">
                  {req.objetivos || '-'}
                </TableCell>
                <TableCell className="text-muted-foreground text-sm whitespace-nowrap">
                  {new Date(req.created_at).toLocaleDateString('es-AR', {
                    day: 'numeric',
                    month: 'short',
                    year: 'numeric'
                  })}
                </TableCell>
                <TableCell className="text-right whitespace-nowrap space-x-2">
                  <Button
                    size="sm"
                    onClick={() => setPorAprobar(req)}
                    disabled={isPending}
                    className="font-sans bg-marca hover:bg-marca/90 text-crema"
                  >
                    <Check className="w-4 h-4 mr-2" />
                    Aprobar
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setPorRechazar(req)}
                    disabled={isPending}
                    className="font-sans text-red-600 dark:text-red-400 border-red-200 dark:border-red-700 hover:bg-red-50 dark:hover:bg-red-950/40"
                    title="Descartar solicitud"
                  >
                    <X className="w-4 h-4" />
                  </Button>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>
    )
  }

  return (
    <div className="space-y-4">
      <div className="flex justify-end">
        <CrearAlumnoDialog todosLosProgramas={todosLosProgramas} />
      </div>
      <Tabs defaultValue="activos" className="w-full">
        <TabsList className="grid w-full grid-cols-4 mb-6 h-12 bg-card border border-border">
          <TabsTrigger value="activos" className="font-sans font-bold text-tinta data-[state=active]:bg-crema">Activos</TabsTrigger>
          <TabsTrigger value="suspendidos" className="font-sans font-bold text-tinta data-[state=active]:bg-crema relative">
            Suspendidos
            {suspendidos.length > 0 && (
              <span className="absolute top-1 right-2 bg-orange-500 text-white text-[10px] w-5 h-5 flex items-center justify-center rounded-full">
                {suspendidos.length}
              </span>
            )}
          </TabsTrigger>
          <TabsTrigger value="historial" className="font-sans font-bold text-tinta data-[state=active]:bg-crema">
            Historial
          </TabsTrigger>
          <TabsTrigger value="solicitudes" className="font-sans font-bold text-tinta data-[state=active]:bg-crema relative">
            Solicitudes
            {consultas.length > 0 && (
              <span className="absolute top-1 right-2 bg-marca text-white text-[10px] w-5 h-5 flex items-center justify-center rounded-full">
                {consultas.length}
              </span>
            )}
          </TabsTrigger>
        </TabsList>

        <TabsContent value="activos" className="bg-card border border-border rounded-xl overflow-hidden shadow-sm">
          {renderUsersTable(activos, 'activo')}
        </TabsContent>
        <TabsContent value="suspendidos" className="bg-card border border-border rounded-xl overflow-hidden shadow-sm">
          {renderUsersTable(suspendidos, 'suspendido')}
        </TabsContent>
        <TabsContent value="historial" className="bg-card border border-border rounded-xl overflow-hidden shadow-sm opacity-70">
          {renderUsersTable(eliminados, 'eliminado')}
        </TabsContent>
        <TabsContent value="solicitudes" className="bg-card border border-border rounded-xl overflow-hidden shadow-sm">
          {renderConsultasTable(consultas)}
        </TabsContent>
      </Tabs>

      <AlertDialog open={!!porAprobar} onOpenChange={(abierto) => !abierto && setPorAprobar(null)}>
        <AlertDialogContent className="bg-crema">
          <AlertDialogHeader>
            <AlertDialogTitle className="font-heading text-2xl text-tinta">¿Aprobar esta solicitud?</AlertDialogTitle>
            <AlertDialogDescription className="font-sans text-muted-foreground">
              Se crea la cuenta de <b>{porAprobar?.nombre}</b> y se manda una invitación a{' '}
              <b>{porAprobar?.email}</b> para que elija su contraseña. Después le asignás
              programas desde la pestaña Activos.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={isPending} className="font-sans">Cancelar</AlertDialogCancel>
            <AlertDialogAction
              onClick={(e) => { e.preventDefault(); handleAprobar() }}
              disabled={isPending}
              className="bg-marca hover:bg-marca/90 text-crema font-sans"
            >
              {isPending ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : <Check className="w-4 h-4 mr-2" />}
              Aprobar e invitar
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      <AlertDialog open={!!porRechazar} onOpenChange={(abierto) => !abierto && setPorRechazar(null)}>
        <AlertDialogContent className="bg-crema">
          <AlertDialogHeader>
            <AlertDialogTitle className="font-heading text-2xl text-tinta">¿Descartar esta solicitud?</AlertDialogTitle>
            <AlertDialogDescription className="font-sans text-muted-foreground">
              La solicitud de <b>{porRechazar?.nombre}</b> sale de la bandeja. No se manda
              ningún aviso a esa persona.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={isPending} className="font-sans">Cancelar</AlertDialogCancel>
            <AlertDialogAction
              onClick={(e) => { e.preventDefault(); handleRechazar() }}
              disabled={isPending}
              className="bg-red-600 hover:bg-red-700 text-white font-sans"
            >
              {isPending ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : <X className="w-4 h-4 mr-2" />}
              Descartar
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  )
}
