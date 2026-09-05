'use client'

import { useState } from 'react'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { Input } from '@/components/ui/input'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { PacienteActionsCell } from './PacienteActionsCell'
import { CrearPacienteDialog } from './CrearPacienteDialog'
import { fechaCorta, hora } from '@/utils/fecha-ar'

export type RecursoBiblioteca = { id: string; titulo: string; tipo_contenido: string }

// eslint-disable-next-line @typescript-eslint/no-explicit-any
type Paciente = any

export function PacientesClient({ pacientes, recursos }: { pacientes: Paciente[], recursos: RecursoBiblioteca[] }) {
  const [searchTerm, setSearchTerm] = useState('')

  const activos = pacientes.filter(p => p.estado === 'activo' || !p.estado)
  const suspendidos = pacientes.filter(p => p.estado === 'suspendido')
  const eliminados = pacientes.filter(p => p.estado === 'eliminado')

  const renderTabla = (lista: Paciente[], stateType: string) => {
    const filtrados = lista.filter((p: { nombre: string, email: string }) =>
      p.nombre?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      p.email?.toLowerCase().includes(searchTerm.toLowerCase())
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
              <TableHead className="font-heading font-semibold text-tinta">Teléfono</TableHead>
              <TableHead className="font-heading font-semibold text-tinta">Próxima sesión</TableHead>
              <TableHead className="font-heading font-semibold text-tinta">Material entregado</TableHead>
              <TableHead className="text-right font-heading font-semibold text-tinta">Acciones</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {filtrados.length === 0 ? (
              <TableRow>
                <TableCell colSpan={5} className="text-center py-8 text-muted-foreground">
                  {lista.length === 0 && stateType === 'activo'
                    ? 'Todavía no hay pacientes. Creá el primero con el botón de arriba.'
                    : 'No hay resultados para la búsqueda.'}
                </TableCell>
              </TableRow>
            ) : filtrados.map((paciente: Paciente) => (
              <TableRow key={paciente.id}>
                <TableCell>
                  <div className="font-medium text-tinta">{paciente.nombre}</div>
                  <div className="text-muted-foreground text-sm">{paciente.email}</div>
                </TableCell>
                <TableCell className="text-muted-foreground text-sm">
                  {paciente.telefono || '—'}
                </TableCell>
                <TableCell className="text-sm">
                  {paciente.proximaSesion ? (
                    <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-marca/10 text-marca whitespace-nowrap">
                      {fechaCorta(paciente.proximaSesion.fecha_hora)} · {hora(paciente.proximaSesion.fecha_hora)}hs
                      {paciente.proximaSesion.tipo === 'presencial' ? ' · presencial' : ''}
                    </span>
                  ) : (
                    <span className="text-muted-foreground">Sin sesiones agendadas</span>
                  )}
                </TableCell>
                <TableCell className="text-muted-foreground text-sm">
                  {paciente.materialesAsignados?.length || 0}{' '}
                  {paciente.materialesAsignados?.length === 1 ? 'recurso' : 'recursos'}
                </TableCell>
                <TableCell className="text-right">
                  <PacienteActionsCell
                    paciente={paciente}
                    recursos={recursos}
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
        <CrearPacienteDialog />
      </div>
      <Tabs defaultValue="activos" className="w-full">
        <TabsList className="grid w-full grid-cols-3 mb-6 h-12 bg-card border border-border">
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
        </TabsList>

        <TabsContent value="activos" className="bg-card border border-border rounded-xl overflow-hidden shadow-sm">
          {renderTabla(activos, 'activo')}
        </TabsContent>
        <TabsContent value="suspendidos" className="bg-card border border-border rounded-xl overflow-hidden shadow-sm">
          {renderTabla(suspendidos, 'suspendido')}
        </TabsContent>
        <TabsContent value="historial" className="bg-card border border-border rounded-xl overflow-hidden shadow-sm opacity-70">
          {renderTabla(eliminados, 'eliminado')}
        </TabsContent>
      </Tabs>
    </div>
  )
}
