'use client'

import { useTransition } from 'react'
import { crearSolicitud } from './actions'
import { toast } from 'sonner'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Button } from '@/components/ui/button'
import { Loader2 } from 'lucide-react'

export function LandingClient() {
  const [isPending, startTransition] = useTransition()

  async function handleSubmit(formData: FormData) {
    startTransition(async () => {
      const result = await crearSolicitud(formData)
      if (result?.error) {
        toast.error(result.error)
      } else {
        toast.success("¡Solicitud enviada! Te contactaremos pronto.")
        const form = document.getElementById('contact-form') as HTMLFormElement
        if (form) form.reset()
      }
    })
  }

  return (
    <section id="contacto" className="bg-crema py-20 px-6 md:px-10 border-t border-border">
      <div className="max-w-4xl mx-auto">
        <h2 className="text-3xl md:text-4xl text-tinta font-heading font-bold mb-4 border-l-8 border-marca pl-5">
          Consultas
        </h2>
        <p className="text-muted-foreground mb-10 max-w-2xl font-serif">
          ¿Interesado en comenzar tu proceso terapéutico? Completá este formulario y nos pondremos en contacto a la brevedad para coordinar una primera entrevista.
        </p>

        <form id="contact-form" action={handleSubmit} className="bg-card p-8 md:p-10 rounded-2xl shadow-sm border border-border space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="space-y-2">
              <Label htmlFor="nombre" className="text-tinta font-bold">Nombre Completo</Label>
              <Input id="nombre" name="nombre" required className="border-border bg-background" placeholder="Ej: Juan Pérez" disabled={isPending} />
            </div>
            <div className="space-y-2">
              <Label htmlFor="email" className="text-tinta font-bold">Correo Electrónico</Label>
              <Input id="email" name="email" type="email" required className="border-border bg-background" placeholder="juan@ejemplo.com" disabled={isPending} />
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="telefono" className="text-tinta font-bold">Teléfono / WhatsApp</Label>
            <Input id="telefono" name="telefono" required className="border-border bg-background" placeholder="+54 9 11 1234-5678" disabled={isPending} />
          </div>

          <div className="space-y-2">
            <Label htmlFor="objetivos" className="text-tinta font-bold">Tus Objetivos o Motivo de Consulta</Label>
            <Textarea
              id="objetivos"
              name="objetivos"
              required
              className="border-border bg-background h-32 resize-none"
              placeholder="Contanos brevemente qué te trae por acá..."
              disabled={isPending}
            />
          </div>

          <Button type="submit" disabled={isPending} className="w-full bg-tinta hover:bg-marca text-crema font-bold h-14 rounded-xl text-lg transition-transform hover:scale-[1.01]">
            {isPending ? <Loader2 className="w-5 h-5 mr-2 animate-spin" /> : "Enviar Solicitud"}
          </Button>
        </form>
      </div>
    </section>
  )
}
