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
import { CrearPacienteDialog } from './CrearPacienteDialog'
import { Video } from 'lucide-react'

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export function AdminPacientesClient({ pacientes, todosLosProgramas }: { pacientes: any[], todosLosProgramas: any[] }) {
  const [searchTerm, setSearchTerm] = useState('')

  const activos = pacientes.filter(a => a.estado === 'activo' || !a.estado)
  const suspendidos = pacientes.filter(a => a.estado === 'suspendido')
  const eliminados = pacientes.filter(a => a.estado === 'eliminado')

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const renderUsersTable = (users: any[], stateType: string) => {
    const filteredUsers = users.filter((u: { nombre: string, email: string }) =>
      u.nombre?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      u.email?.toLowerCase().includes(searchTerm.toLowerCase())
    )

    return (
      <div className="flex flex-col">
        <div className="p-4 border-b border-gray-100 bg-gray-50/50">
          <Input
            placeholder="Buscar por nombre o email..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="max-w-md bg-white"
          />
        </div>
        <Table>
          <TableHeader className="bg-gray-50">
            <TableRow>
              <TableHead className="font-heading font-semibold text-tinta">Nombre / Email</TableHead>
              <TableHead className="font-heading font-semibold text-tinta">Teléfono</TableHead>
              <TableHead className="font-heading font-semibold text-tinta">Videollamada</TableHead>
              <TableHead className="font-heading font-semibold text-tinta">Programas asignados</TableHead>
              <TableHead className="text-right font-heading font-semibold text-tinta">Acciones</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {filteredUsers.length === 0 ? (
              <TableRow>
                <TableCell colSpan={5} className="text-center py-8 text-muted-foreground">No hay resultados para la búsqueda.</TableCell>
              </TableRow>
            ) : filteredUsers.map((paciente) => (
              <TableRow key={paciente.id}>
                <TableCell>
                  <div className="font-medium text-tinta">{paciente.nombre}</div>
                  <div className="text-muted-foreground text-sm">{paciente.email}</div>
                </TableCell>
                <TableCell className="text-muted-foreground text-sm">{paciente.telefono || 'N/A'}</TableCell>
                <TableCell>
                  {paciente.link_videollamada ? (
                    <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-medium bg-marca/10 text-marca">
                      <Video className="w-3 h-3" /> Configurada
                    </span>
                  ) : (
                    <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-gray-100 text-gray-500">
                      Sin link
                    </span>
                  )}
                </TableCell>
                <TableCell>
                  {paciente.programasSeleccionados?.length || 0} programas
                </TableCell>
                <TableCell className="text-right">
                  <UserActionsCell
                    paciente={paciente}
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

  return (
    <div className="space-y-4">
      <div className="flex justify-end">
        <CrearPacienteDialog todosLosProgramas={todosLosProgramas} />
      </div>
      <Tabs defaultValue="activos" className="w-full">
        <TabsList className="grid w-full grid-cols-3 mb-6 h-12 bg-white border border-gray-200">
          <TabsTrigger value="activos" className="font-sans font-bold text-tinta data-[state=active]:bg-crema">Activos</TabsTrigger>
          <TabsTrigger value="suspendidos" className="font-sans font-bold text-tinta data-[state=active]:bg-crema relative">
            Suspendidos
            {suspendidos.length > 0 && (
              <span className="absolute top-1 right-2 bg-orange-500 text-white text-[10px] w-5 h-5 flex items-center justify-center rounded-full">
                {suspendidos.length}
              </span>
            )}
          </TabsTrigger>
          <TabsTrigger value="historial" className="font-sans font-bold text-tinta data-[state=active]:bg-crema relative">
            Historial
          </TabsTrigger>
        </TabsList>

        <TabsContent value="activos" className="bg-white border border-gray-200 rounded-xl overflow-hidden shadow-sm">
          {renderUsersTable(activos, 'activo')}
        </TabsContent>
        <TabsContent value="suspendidos" className="bg-white border border-gray-200 rounded-xl overflow-hidden shadow-sm">
          {renderUsersTable(suspendidos, 'suspendido')}
        </TabsContent>
        <TabsContent value="historial" className="bg-white border border-gray-200 rounded-xl overflow-hidden shadow-sm opacity-70">
          {renderUsersTable(eliminados, 'eliminado')}
        </TabsContent>
      </Tabs>
    </div>
  )
}
