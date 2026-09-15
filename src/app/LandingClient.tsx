'use client'

import { useState, useTransition } from 'react'
import { useSearchParams } from 'next/navigation'
import Link from 'next/link'
import { crearSolicitud } from './actions'
import { toast } from 'sonner'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Button } from '@/components/ui/button'
import { LABEL_INTERES } from '@/utils/taxonomia-labels'
import { Loader2, CheckCircle2 } from 'lucide-react'

// Mismo orden en el que aparecen los botones de la nav (page.tsx), menos "otro": ese
// solo lo ve quien entra directo al formulario sin pasar por un botón puntual.
const OPCIONES_INTERES = ['curso', 'formacion', 'supervision', 'terapia_individual', 'psicologia_fe', 'otro'] as const

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

  // Lo enviado queda en pantalla hasta que la persona decida hacer otra consulta. Antes
  // esto era sólo un toast: se desvanecía solo y no quedaba ningún rastro de que la
  // solicitud había salido ni de sobre qué era. Fue el primer pedido del feedback
  // ("agregar página de respuesta... porque si no uno después se olvida").
  const [enviado, setEnviado] = useState<{ nombre: string; email: string; interes: string } | null>(null)

  async function handleSubmit(formData: FormData) {
    // Se leen antes de la action porque después el formulario se desmonta.
    const nombre = ((formData.get('nombre') as string | null) ?? '').trim()
    const email = ((formData.get('email') as string | null) ?? '').trim()
    const interesElegido = (formData.get('interes') as string | null) ?? ''

    startTransition(async () => {
      const result = await crearSolicitud(formData)
      if (result?.error) {
        toast.error(result.error)
      } else {
        setEnviado({ nombre, email, interes: interesElegido })
      }
    })
  }

  function nuevaConsulta() {
    setEnviado(null)
    setInteres('')
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

        {enviado ? (
          <div className="bg-card p-8 md:p-10 rounded-2xl shadow-sm border border-border text-center">
            <CheckCircle2 className="w-14 h-14 text-marca mx-auto" aria-hidden />
            <h3 className="mt-5 text-2xl md:text-3xl font-heading font-bold text-tinta">
              ¡Gracias{enviado.nombre ? `, ${enviado.nombre.split(' ')[0]}` : ''}!
            </h3>
            <p className="mt-3 font-serif text-muted-foreground leading-relaxed max-w-lg mx-auto">
              Recibimos tu consulta sobre{' '}
              <strong className="text-tinta font-sans font-semibold">
                {LABEL_INTERES[enviado.interes] ?? 'lo que nos contaste'}
              </strong>
              . Elias te va a escribir a{' '}
              <strong className="text-tinta font-sans font-semibold break-all">{enviado.email}</strong>{' '}
              para coordinar los próximos pasos.
            </p>
            <p className="mt-4 font-serif text-sm text-muted-foreground">
              Si no ves la respuesta en unos días, revisá la carpeta de spam.
            </p>
            <Button
              type="button"
              onClick={nuevaConsulta}
              variant="outline"
              className="mt-7 font-sans font-semibold border-border text-tinta hover:bg-gris-calido/60"
            >
              Hacer otra consulta
            </Button>
          </div>
        ) : (
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

          {/* Sin `required` a propósito: acá alguien puede volcar su motivo de consulta,
              que es un dato sensible de salud, y el art. 7 de la Ley 25.326 dice que nadie
              puede ser obligado a darlos. Con el desplegable de interés ya alcanza para
              responder la consulta. */}
          <div className="space-y-2">
            <Label htmlFor="objetivos" className="text-tinta font-bold">
              Contanos más <span className="font-normal text-muted-foreground">(opcional)</span>
            </Label>
            <Textarea
              id="objetivos"
              name="objetivos"
              className="border-border bg-background h-32 resize-none"
              placeholder="Si querés, contanos brevemente qué estás buscando. No hace falta que entres en detalles."
              disabled={isPending}
            />
          </div>

          <Button type="submit" disabled={isPending} className="w-full bg-tinta hover:bg-marca text-crema font-bold h-14 rounded-xl text-lg transition-transform hover:scale-[1.01]">
            {isPending ? <Loader2 className="w-5 h-5 mr-2 animate-spin" /> : "Enviar Solicitud"}
          </Button>

          {/* Deber de información del art. 6 de la Ley 25.326: el titular tiene que saber
              para qué se usan sus datos y cómo ejercer sus derechos ANTES de entregarlos. */}
          <p className="text-xs text-muted-foreground leading-relaxed text-center">
            Tus datos se usan únicamente para responder esta consulta y quedan bajo secreto
            profesional. Podés pedir acceder a ellos, corregirlos o borrarlos cuando quieras.{' '}
            <Link href="/privacidad" className="underline underline-offset-2 hover:text-tinta transition-colors">
              Política de privacidad
            </Link>
            .
          </p>
        </form>
        )}
      </div>
    </section>
  )
}
