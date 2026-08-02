'use client'

import { useState } from 'react'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import { Input } from "@/components/ui/input"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { UserActionsCell } from './UserActionsCell'
import { CrearAlumnoDialog } from './CrearAlumnoDialog'
import { Video } from 'lucide-react'

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export function AdminAlumnosClient({ alumnos, todosLosProgramas, solicitudes }: { alumnos: any[], todosLosProgramas: any[], solicitudes?: any[] }) {
  const [searchTerm, setSearchTerm] = useState('')

  const activos = alumnos.filter(a => a.estado === 'activo' || !a.estado)
  const suspendidos = alumnos.filter(a => a.estado === 'suspendido')
  const eliminados = alumnos.filter(a => a.estado === 'eliminado')
  const consultas = solicitudes || []

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
              <TableHead className="font-heading font-semibold text-tinta">Cohorte</TableHead>
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
                  {alumno.cohorteNombre || 'Sin cohorte'}
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
              <TableHead className="font-heading font-semibold text-tinta">Teléfono</TableHead>
              <TableHead className="font-heading font-semibold text-tinta max-w-sm">Motivo / Objetivos</TableHead>
              <TableHead className="text-right font-heading font-semibold text-tinta">Fecha</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {lista.length === 0 ? (
              <TableRow>
                <TableCell colSpan={4} className="text-center py-8 text-muted-foreground">No hay solicitudes nuevas.</TableCell>
              </TableRow>
            ) : lista.map((req) => (
              <TableRow key={req.id}>
                <TableCell>
                  <div className="font-medium text-tinta">{req.nombre}</div>
                  <div className="text-muted-foreground text-sm">{req.email}</div>
                </TableCell>
                <TableCell className="text-muted-foreground text-sm">
                  {req.telefono || '-'}
                </TableCell>
                <TableCell className="text-muted-foreground text-sm whitespace-pre-wrap">
                  {req.objetivos || '-'}
                </TableCell>
                <TableCell className="text-right text-muted-foreground text-sm">
                  {new Date(req.created_at).toLocaleDateString('es-AR', {
                    day: 'numeric',
                    month: 'short',
                    year: 'numeric'
                  })}
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
    </div>
  )
}
