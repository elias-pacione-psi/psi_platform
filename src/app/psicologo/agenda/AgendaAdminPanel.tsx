"use client";

import { useState, useTransition } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { CalendarPlus, Loader2 } from 'lucide-react'
import { toast } from 'sonner'
import { agregarSesionUnica, generarSesionesRecurrentes } from '../actions'

export function AgendaAdminPanel({ pacientes }: { pacientes: { id: string, nombre: string, email: string }[] }) {
  const [isPending, startTransition] = useTransition()
  const [selectedPaciente, setSelectedPaciente] = useState<string | null>('')

  const handleAgregarUnica = async (formData: FormData) => {
    if (!selectedPaciente) {
      toast.error('Primero seleccioná un paciente.')
      return;
    }
    formData.append('paciente_id', selectedPaciente)

    startTransition(async () => {
      try {
        const result = await agregarSesionUnica(formData)
        if (result?.error) {
          toast.error(result.error)
        } else {
          toast.success("Sesión agendada correctamente.")
          const form = document.getElementById('form-sesion-unica') as HTMLFormElement
          if (form) form.reset()
        }
      } catch {
        toast.error('Error inesperado al agendar.')
      }
    })
  }

  const handleGenerarRecurrentes = async (formData: FormData) => {
    if (!selectedPaciente) {
      toast.error('Primero seleccioná un paciente.')
      return;
    }
    formData.append('paciente_id', selectedPaciente)

    startTransition(async () => {
      try {
        const result = await generarSesionesRecurrentes(formData)
        if (result?.error) {
          toast.error(result.error)
        } else {
          toast.success(`Se agendaron ${formData.get('semanas')} sesiones recurrentes.`)
          const form = document.getElementById('form-recurrentes') as HTMLFormElement
          if (form) form.reset()
        }
      } catch {
        toast.error('Error inesperado al agendar recurrentes.')
      }
    })
  }

  return (
    <Card className="border-gray-200 shadow-sm bg-white sticky top-24">
      <CardHeader className="pb-3 border-b border-gray-100">
        <CardTitle className="font-heading text-lg text-tinta">Agendar sesiones</CardTitle>
      </CardHeader>
      <CardContent className="pt-4 space-y-6">

        <div className="space-y-2">
          <Label className="font-bold text-tinta text-sm">1. Seleccionar paciente</Label>
          <Select value={selectedPaciente || undefined} onValueChange={setSelectedPaciente} disabled={isPending}>
            <SelectTrigger className="bg-gray-50 border-gray-200">
              <SelectValue placeholder="Elegí un paciente..." />
            </SelectTrigger>
            <SelectContent>
              {pacientes.map(p => (
                <SelectItem key={p.id} value={p.id}>{p.nombre}</SelectItem>
              ))}
              {pacientes.length === 0 && <SelectItem value="none" disabled>No hay pacientes activos</SelectItem>}
            </SelectContent>
          </Select>
        </div>

        <div className="space-y-2">
          <Label className="font-bold text-tinta text-sm">2. Modo de agendamiento</Label>
          <Tabs defaultValue="unica" className="w-full">
            <TabsList className="grid w-full grid-cols-2 mb-4">
              <TabsTrigger value="unica">Única</TabsTrigger>
              <TabsTrigger value="recurrente">Recurrente</TabsTrigger>
            </TabsList>

            <TabsContent value="unica">
              <form id="form-sesion-unica" action={handleAgregarUnica} className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="fecha_hora" className="text-xs font-bold text-gray-500 uppercase tracking-wider">Fecha y hora exacta</Label>
                  <Input
                    type="datetime-local"
                    id="fecha_hora"
                    name="fecha_hora"
                    required
                    className="bg-gray-50 border-gray-200 h-10"
                    disabled={isPending || !selectedPaciente}
                  />
                </div>
                <Button type="submit" disabled={isPending || !selectedPaciente} className="w-full bg-marca hover:bg-marca/90 text-white shadow-sm">
                  {isPending ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : <CalendarPlus className="w-4 h-4 mr-2" />}
                  Agendar sesión
                </Button>
              </form>
            </TabsContent>

            <TabsContent value="recurrente">
              <form id="form-recurrentes" action={handleGenerarRecurrentes} className="space-y-4">
                <div className="grid grid-cols-2 gap-3">
                  <div className="space-y-2">
                    <Label htmlFor="dia_semana" className="text-xs font-bold text-gray-500 uppercase tracking-wider">Día</Label>
                    <Select name="dia_semana" required disabled={isPending || !selectedPaciente}>
                      <SelectTrigger id="dia_semana" className="bg-gray-50 border-gray-200 h-10">
                        <SelectValue placeholder="Día" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="1">Lunes</SelectItem>
                        <SelectItem value="2">Martes</SelectItem>
                        <SelectItem value="3">Miércoles</SelectItem>
                        <SelectItem value="4">Jueves</SelectItem>
                        <SelectItem value="5">Viernes</SelectItem>
                        <SelectItem value="6">Sábado</SelectItem>
                        <SelectItem value="0">Domingo</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="hora" className="text-xs font-bold text-gray-500 uppercase tracking-wider">Hora</Label>
                    <Input type="time" id="hora" name="hora" required className="bg-gray-50 border-gray-200 h-10" disabled={isPending || !selectedPaciente} />
                  </div>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="semanas" className="text-xs font-bold text-gray-500 uppercase tracking-wider">Cantidad de semanas</Label>
                  <Input type="number" id="semanas" name="semanas" min="1" max="52" defaultValue="4" required className="bg-gray-50 border-gray-200 h-10" disabled={isPending || !selectedPaciente} />
                </div>
                <Button type="submit" disabled={isPending || !selectedPaciente} className="w-full bg-tinta hover:bg-tinta/90 text-white shadow-sm">
                  {isPending ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : <CalendarPlus className="w-4 h-4 mr-2" />}
                  Generar en lote
                </Button>
              </form>
            </TabsContent>
          </Tabs>
        </div>

      </CardContent>
    </Card>
  )
}
