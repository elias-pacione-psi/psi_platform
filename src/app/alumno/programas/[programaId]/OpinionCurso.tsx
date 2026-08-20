'use client'

import { useState, useTransition } from 'react'
import { Star, Loader2, Pencil, Trash2, MessageSquareHeart } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { toast } from 'sonner'
import { guardarOpinionCurso, borrarOpinionCurso } from '@/app/alumno/actions'

export type Opinion = {
  puntuacion: number
  lo_que_sirvio: string | null
  lo_que_mejoraria: string | null
} | null

// Encuesta de fin de curso. Deliberadamente corta: una puntuación obligatoria y dos
// preguntas abiertas opcionales. Cuanto más larga, menos gente la contesta, y la
// puntuación sola ya dice bastante.
export function OpinionCurso({
  programaId,
  opinionInicial,
  cursoCompleto,
}: {
  programaId: string
  opinionInicial: Opinion
  cursoCompleto: boolean
}) {
  const [isPending, startTransition] = useTransition()
  const [editando, setEditando] = useState(opinionInicial === null)
  const [puntuacion, setPuntuacion] = useState(opinionInicial?.puntuacion ?? 0)
  const [hover, setHover] = useState(0)
  const [sirvio, setSirvio] = useState(opinionInicial?.lo_que_sirvio ?? '')
  const [mejoraria, setMejoraria] = useState(opinionInicial?.lo_que_mejoraria ?? '')

  function enviar() {
    if (puntuacion === 0) {
      toast.error('Elegí una puntuación de 1 a 5 estrellas')
      return
    }
    startTransition(async () => {
      const res = await guardarOpinionCurso(programaId, puntuacion, sirvio, mejoraria)
      if (res?.error) toast.error(res.error)
      else {
        toast.success('¡Gracias! Tu opinión le llega a Elias.')
        setEditando(false)
      }
    })
  }

  function borrar() {
    startTransition(async () => {
      const res = await borrarOpinionCurso(programaId)
      if (res?.error) toast.error(res.error)
      else {
        toast.success('Se borró tu opinión')
        setPuntuacion(0)
        setSirvio('')
        setMejoraria('')
        setEditando(true)
      }
    })
  }

  // Ya opinó y no está editando: resumen compacto.
  if (!editando) {
    return (
      <div className="bg-card rounded-2xl border border-border shadow-sm p-6">
        <div className="flex items-start justify-between gap-4">
          <div>
            <h2 className="text-lg font-heading font-semibold text-tinta mb-1">Tu opinión sobre este curso</h2>
            <div className="flex items-center gap-1 mb-3" aria-label={`${puntuacion} de 5 estrellas`}>
              {[1, 2, 3, 4, 5].map((n) => (
                <Star
                  key={n}
                  className={`w-4 h-4 ${n <= puntuacion ? 'fill-marca text-marca' : 'text-muted-foreground'}`}
                />
              ))}
            </div>
            {sirvio && <p className="text-sm text-tinta/80 leading-relaxed mb-2">{sirvio}</p>}
            {mejoraria && (
              <p className="text-sm text-muted-foreground leading-relaxed">
                <span className="font-medium">A mejorar:</span> {mejoraria}
              </p>
            )}
          </div>
          <div className="flex gap-1 shrink-0">
            <Button variant="ghost" size="sm" onClick={() => setEditando(true)} disabled={isPending} title="Editar">
              <Pencil className="w-4 h-4" />
            </Button>
            <Button
              variant="ghost"
              size="sm"
              onClick={borrar}
              disabled={isPending}
              title="Borrar mi opinión"
              className="text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-950/40"
            >
              {isPending ? <Loader2 className="w-4 h-4 animate-spin" /> : <Trash2 className="w-4 h-4" />}
            </Button>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="bg-card rounded-2xl border border-border shadow-sm p-6 space-y-5">
      <div className="flex items-start gap-3">
        <MessageSquareHeart className="w-5 h-5 text-marca shrink-0 mt-0.5" strokeWidth={1.75} />
        <div>
          <h2 className="text-lg font-heading font-semibold text-tinta">
            {cursoCompleto ? '¡Terminaste el curso! ¿Cómo te fue?' : '¿Qué te está pareciendo el curso?'}
          </h2>
          <p className="text-sm text-muted-foreground mt-1 leading-relaxed">
            Tu respuesta la lee solamente Elias y le sirve para mejorar el material. No se
            publica en ningún lado. Podés editarla o borrarla cuando quieras.
          </p>
        </div>
      </div>

      <div className="space-y-2">
        <Label className="font-bold text-tinta">¿Cómo lo puntuás?</Label>
        <div className="flex items-center gap-1.5">
          {[1, 2, 3, 4, 5].map((n) => (
            <button
              key={n}
              type="button"
              onClick={() => setPuntuacion(n)}
              onMouseEnter={() => setHover(n)}
              onMouseLeave={() => setHover(0)}
              disabled={isPending}
              aria-label={`${n} ${n === 1 ? 'estrella' : 'estrellas'}`}
              className="p-1 rounded-md hover:bg-muted transition-colors disabled:opacity-50"
            >
              <Star
                className={`w-7 h-7 transition-colors ${
                  n <= (hover || puntuacion) ? 'fill-marca text-marca' : 'text-muted-foreground'
                }`}
              />
            </button>
          ))}
        </div>
      </div>

      <div className="space-y-2">
        <Label htmlFor="sirvio" className="font-bold text-tinta">
          ¿Qué te sirvió más? <span className="font-normal text-muted-foreground">(opcional)</span>
        </Label>
        <Textarea
          id="sirvio"
          value={sirvio}
          onChange={(e) => setSirvio(e.target.value)}
          disabled={isPending}
          maxLength={2000}
          className="bg-background border-border h-24 resize-none"
          placeholder="Lo que más te aportó del material, una lección puntual, un ejercicio..."
        />
      </div>

      <div className="space-y-2">
        <Label htmlFor="mejoraria" className="font-bold text-tinta">
          ¿Qué mejorarías? <span className="font-normal text-muted-foreground">(opcional)</span>
        </Label>
        <Textarea
          id="mejoraria"
          value={mejoraria}
          onChange={(e) => setMejoraria(e.target.value)}
          disabled={isPending}
          maxLength={2000}
          className="bg-background border-border h-24 resize-none"
          placeholder="Algo que te faltó, que no se entendió, o que sumarías..."
        />
      </div>

      <div className="flex items-center gap-3">
        <Button onClick={enviar} disabled={isPending} className="bg-marca hover:bg-marca/90 text-crema px-8">
          {isPending ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : null}
          {opinionInicial ? 'Guardar cambios' : 'Enviar opinión'}
        </Button>
        {opinionInicial && (
          <Button variant="ghost" onClick={() => setEditando(false)} disabled={isPending}>
            Cancelar
          </Button>
        )}
      </div>
    </div>
  )
}
