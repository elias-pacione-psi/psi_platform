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

type Item = { id: string, nombre: string }

export function AgendaAdminPanel({ alumnos, cohortes }: { alumnos: Item[], cohortes: Item[] }) {
  const [isPending, startTransition] = useTransition()
  // destino con formato "alumno:<id>" | "cohorte:<id>"
  const [destino, setDestino] = useState<string>('')
  const [tipo, setTipo] = useState<'virtual' | 'presencial'>('virtual')

  // base-ui Select resuelve el label mostrado desde `items` (sin eso, muestra el value crudo)
  const destinoItems = {
    ...Object.fromEntries(cohortes.map(c => [`cohorte:${c.id}`, `👥 ${c.nombre}`])),
    ...Object.fromEntries(alumnos.map(a => [`alumno:${a.id}`, a.nombre])),
  }

  // Agrega alumno_id|cohorte_id + tipo al formData según el destino elegido
  const aplicarDestino = (formData: FormData): boolean => {
    if (!destino) { toast.error('Primero elegí un destino (alumno o cohorte).'); return false }
    const [clase, id] = destino.split(':')
    formData.append(clase === 'cohorte' ? 'cohorte_id' : 'alumno_id', id)
    formData.append('tipo', tipo)
    return true
  }

  const handleAgregarUnica = async (formData: FormData) => {
    if (!aplicarDestino(formData)) return
    startTransition(async () => {
      const result = await agregarSesionUnica(formData)
      if (result?.error) toast.error(result.error)
      else {
        toast.success("Sesión agendada correctamente.")
        ;(document.getElementById('form-sesion-unica') as HTMLFormElement)?.reset()
      }
    })
  }

  const handleGenerarRecurrentes = async (formData: FormData) => {
    if (!aplicarDestino(formData)) return
    startTransition(async () => {
      const result = await generarSesionesRecurrentes(formData)
      if (result?.error) toast.error(result.error)
      else {
        toast.success(`Se agendaron ${formData.get('semanas')} sesiones recurrentes.`)
        ;(document.getElementById('form-recurrentes') as HTMLFormElement)?.reset()
      }
    })
  }

  const camposTipo = (
    <>
      <div className="space-y-2">
        <Label className="text-xs font-bold text-muted-foreground uppercase tracking-wider">Modalidad</Label>
        <Select
          value={tipo}
          onValueChange={(v) => setTipo((v as 'virtual' | 'presencial') || 'virtual')}
          disabled={isPending}
          items={{ virtual: 'Virtual (videollamada)', presencial: 'Presencial' }}
        >
          <SelectTrigger className="bg-muted border-border h-10"><SelectValue /></SelectTrigger>
          <SelectContent>
            <SelectItem value="virtual">Virtual (videollamada)</SelectItem>
            <SelectItem value="presencial">Presencial</SelectItem>
          </SelectContent>
        </Select>
      </div>
      {tipo === 'virtual' ? (
        <div className="space-y-2">
          <Label htmlFor="enlace" className="text-xs font-bold text-muted-foreground uppercase tracking-wider">Enlace (opcional para individual)</Label>
          <Input name="enlace" placeholder="https://meet.google.com/..." className="bg-muted border-border h-10" disabled={isPending} />
        </div>
      ) : (
        <div className="space-y-2">
          <Label htmlFor="lugar" className="text-xs font-bold text-muted-foreground uppercase tracking-wider">Lugar</Label>
          <Input name="lugar" placeholder="Ej: Dignos, Quilmes" className="bg-muted border-border h-10" disabled={isPending} />
        </div>
      )}
    </>
  )

  return (
    <Card className="border-border shadow-sm bg-card sticky top-24">
      <CardHeader className="pb-3 border-b border-border">
        <CardTitle className="font-heading text-lg text-tinta">Agendar sesiones</CardTitle>
      </CardHeader>
      <CardContent className="pt-4 space-y-6">
        <div className="space-y-2">
          <Label className="font-bold text-tinta text-sm">1. Destino</Label>
          <Select value={destino} onValueChange={(v) => setDestino(v || '')} disabled={isPending} items={destinoItems}>
            <SelectTrigger className="bg-muted border-border">
              <SelectValue placeholder="Alumno o cohorte..." />
            </SelectTrigger>
            <SelectContent>
              {cohortes.length > 0 && (
                <>
                  <div className="px-2 py-1 text-xs font-bold text-tinta/50 uppercase">Cohortes</div>
                  {cohortes.map(c => <SelectItem key={c.id} value={`cohorte:${c.id}`}>👥 {c.nombre}</SelectItem>)}
                </>
              )}
              <div className="px-2 py-1 text-xs font-bold text-tinta/50 uppercase">Alumnos</div>
              {alumnos.map(a => <SelectItem key={a.id} value={`alumno:${a.id}`}>{a.nombre}</SelectItem>)}
              {alumnos.length === 0 && cohortes.length === 0 && <SelectItem value="none" disabled>No hay destinos</SelectItem>}
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
                  <Label htmlFor="fecha_hora" className="text-xs font-bold text-muted-foreground uppercase tracking-wider">Fecha y hora</Label>
                  <Input type="datetime-local" id="fecha_hora" name="fecha_hora" required className="bg-muted border-border h-10" disabled={isPending || !destino} />
                </div>
                {camposTipo}
                <Button type="submit" disabled={isPending || !destino} className="w-full bg-marca hover:bg-marca/90 text-crema shadow-sm">
                  {isPending ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : <CalendarPlus className="w-4 h-4 mr-2" />} Agendar sesión
                </Button>
              </form>
            </TabsContent>

            <TabsContent value="recurrente">
              <form id="form-recurrentes" action={handleGenerarRecurrentes} className="space-y-4">
                <div className="grid grid-cols-2 gap-3">
                  <div className="space-y-2">
                    <Label htmlFor="dia_semana" className="text-xs font-bold text-muted-foreground uppercase tracking-wider">Día</Label>
                    <Select
                      name="dia_semana"
                      required
                      disabled={isPending || !destino}
                      items={{ '1': 'Lunes', '2': 'Martes', '3': 'Miércoles', '4': 'Jueves', '5': 'Viernes', '6': 'Sábado', '0': 'Domingo' }}
                    >
                      <SelectTrigger id="dia_semana" className="bg-muted border-border h-10"><SelectValue placeholder="Día" /></SelectTrigger>
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
                    <Label htmlFor="hora" className="text-xs font-bold text-muted-foreground uppercase tracking-wider">Hora</Label>
                    <Input type="time" id="hora" name="hora" required className="bg-muted border-border h-10" disabled={isPending || !destino} />
                  </div>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="semanas" className="text-xs font-bold text-muted-foreground uppercase tracking-wider">Cantidad de semanas</Label>
                  <Input type="number" id="semanas" name="semanas" min="1" max="52" defaultValue="4" required className="bg-muted border-border h-10" disabled={isPending || !destino} />
                </div>
                {camposTipo}
                <Button type="submit" disabled={isPending || !destino} className="w-full bg-noche hover:bg-noche/90 text-white shadow-sm">
                  {isPending ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : <CalendarPlus className="w-4 h-4 mr-2" />} Generar en lote
                </Button>
              </form>
            </TabsContent>
          </Tabs>
        </div>
      </CardContent>
    </Card>
  )
}
