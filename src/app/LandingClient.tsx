'use client'

import { useState, useTransition } from 'react'
import { useSearchParams } from 'next/navigation'
import { crearSolicitud } from './actions'
import { toast } from 'sonner'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Button } from '@/components/ui/button'
import { LABEL_INTERES } from '@/utils/taxonomia-labels'
import { Loader2 } from 'lucide-react'

// Mismo orden en el que aparecen los botones de la nav (page.tsx), menos "otro": ese
// solo lo ve quien entra directo al formulario sin pasar por un botón puntual.
const OPCIONES_INTERES = ['curso', 'formacion', 'supervision', 'terapia_individual', 'otro'] as const

export function LandingClient() {
  const [isPending, startTransition] = useTransition()
  const searchParams = useSearchParams()

  // Los botones "Cursos"/"Formaciones"/etc. de la nav traen `?interes=curso` y bajan
  // hasta acá: el desplegable llega preseleccionado para no hacer que la persona elija
  // de nuevo algo que ya dijo con el botón que tocó. Se deriva en el render (no en un
  // efecto que llame a setState) porque es un espejo de la URL en el primer render, no
  // un efecto secundario; el `key` de abajo fuerza a re-derivar si cambia el query sin
  // desmontar la página (clickear un botón de nav distinto estando ya en "/").
  const desdeUrl = searchParams.get('interes')
  const interesInicial = desdeUrl && (OPCIONES_INTERES as readonly string[]).includes(desdeUrl) ? desdeUrl : ''
  const [interes, setInteres] = useState(interesInicial)

  async function handleSubmit(formData: FormData) {
    startTransition(async () => {
      const result = await crearSolicitud(formData)
      if (result?.error) {
        toast.error(result.error)
      } else {
        toast.success("¡Solicitud enviada! Te contactaremos pronto.")
        const form = document.getElementById('contact-form') as HTMLFormElement
        if (form) form.reset()
        setInteres('')
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
          Contanos qué te interesa y coordinamos los próximos pasos: una formación, un espacio
          de supervisión o el inicio de tu proceso terapéutico.
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

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="space-y-2">
              <Label htmlFor="telefono" className="text-tinta font-bold">Teléfono / WhatsApp</Label>
              <Input id="telefono" name="telefono" required className="border-border bg-background" placeholder="+54 9 11 1234-5678" disabled={isPending} />
            </div>
            <div className="space-y-2">
              <Label htmlFor="interes" className="text-tinta font-bold">¿Qué te interesa?</Label>
              {/* <select> nativo y no el Select del design system: acá no hace falta la
                  lógica de opciones dinámicas, y con un formulario público es una fuente
                  menos de JS por cargar antes del primer render. */}
              <select
                key={interesInicial}
                id="interes"
                name="interes"
                required
                value={interes}
                onChange={(e) => setInteres(e.target.value)}
                disabled={isPending}
                className="flex h-9 w-full rounded-md border border-border bg-background px-3 py-1 text-sm text-tinta shadow-xs outline-none focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50 disabled:opacity-50"
              >
                <option value="" disabled>Elegí una opción</option>
                {OPCIONES_INTERES.map((op) => (
                  <option key={op} value={op}>{LABEL_INTERES[op]}</option>
                ))}
              </select>
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="objetivos" className="text-tinta font-bold">Contanos más</Label>
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
