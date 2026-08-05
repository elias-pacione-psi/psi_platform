'use client'

import { useState, useTransition } from 'react'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { Loader2, CheckCircle2, XCircle, Trophy, RotateCcw } from 'lucide-react'
import { responderQuiz } from '@/app/alumno/actions'
import { toast } from 'sonner'

type Pregunta = { id: string, pregunta: string, opciones: string[] }
// `correcta` es opcional a propósito: el servidor sólo la manda cuando ya no puede usarse
// para reintentar (aprobado o sin intentos restantes). Mientras queden, llega sólo
// `acertada` — el alumno ve qué falló, no cuál era la buena.
type Solucion = { correcta?: string, acertada: boolean }
type Resultado = {
  puntaje: number
  total: number
  aprobado: boolean
  intentosRestantes: number
  solucion: Record<string, Solucion>
}

export function QuizSolver({ preguntas, leccionId, programaId }: { preguntas: Pregunta[], leccionId: string, programaId: string }) {
  const [respuestas, setRespuestas] = useState<Record<string, string>>({})
  const [resultado, setResultado] = useState<Resultado | null>(null)
  const [isPending, startTransition] = useTransition()

  if (preguntas.length === 0) {
    return <div className="bg-card rounded-2xl border border-border p-8 text-center text-muted-foreground">Este quiz todavía no tiene preguntas.</div>
  }

  const todasRespondidas = preguntas.every(p => respuestas[p.id])

  const enviar = () => {
    startTransition(async () => {
      const r = await responderQuiz(leccionId, programaId, respuestas)
      if (r?.error) { toast.error(r.error); return }
      if (r?.success) setResultado({
        puntaje: r.puntaje!,
        total: r.total!,
        aprobado: r.aprobado!,
        intentosRestantes: r.intentosRestantes!,
        solucion: r.solucion!,
      })
    })
  }

  const reintentar = () => { setResultado(null); setRespuestas({}) }

  return (
    <div className="space-y-6">
      {resultado && (
        <Card className={`border-2 ${resultado.aprobado ? 'border-marca bg-marca/5' : 'border-amber-300 dark:border-amber-700 bg-amber-50 dark:bg-amber-950/40'}`}>
          <CardContent className="p-6 flex items-center gap-4">
            {resultado.aprobado ? <Trophy className="w-10 h-10 text-marca" /> : <RotateCcw className="w-10 h-10 text-amber-500 dark:text-amber-400" />}
            <div>
              <p className="text-2xl font-heading font-bold text-tinta">
                {resultado.puntaje} / {resultado.total} — {Math.round((resultado.puntaje / resultado.total) * 100)}%
              </p>
              <p className="text-sm text-muted-foreground">
                {resultado.aprobado
                  ? '¡Aprobado! La lección quedó completada.'
                  : resultado.intentosRestantes > 0
                    ? `No alcanzaste el 70%. Repasá y volvé a intentar — te ${resultado.intentosRestantes === 1 ? 'queda 1 intento' : `quedan ${resultado.intentosRestantes} intentos`}.`
                    : 'No alcanzaste el 70% y usaste todos tus intentos. Abajo están las respuestas correctas; escribile a tu instructor.'}
              </p>
            </div>
          </CardContent>
        </Card>
      )}

      {preguntas.map((p, i) => {
        const sol = resultado?.solucion[p.id]
        return (
          <Card key={p.id} className="border-border">
            <CardContent className="p-6">
              <p className="font-semibold text-tinta mb-4">{i + 1}. {p.pregunta}</p>
              <div className="space-y-2">
                {p.opciones.map((op) => {
                  const elegida = respuestas[p.id] === op
                  // Se distingue "ésta era la correcta" de "la tuya estuvo bien": cuando el
                  // servidor no manda `correcta` (todavía quedan intentos), lo único que se
                  // sabe de cada pregunta es `acertada`. Comparar contra un `correcta`
                  // undefined pintaría de rojo hasta la opción que el alumno acertó.
                  const esLaCorrecta = sol?.correcta !== undefined && op === sol.correcta
                  const marcarBien = esLaCorrecta || (elegida && sol?.acertada === true)
                  const marcarMal = elegida && sol?.acertada === false

                  let estilo = 'border-border hover:border-marca/40'
                  if (resultado && sol) {
                    if (marcarBien) estilo = 'border-marca bg-marca/10'
                    else if (marcarMal) estilo = 'border-red-300 dark:border-red-700 bg-red-50 dark:bg-red-950/40'
                  } else if (elegida) {
                    estilo = 'border-marca bg-marca/5'
                  }
                  return (
                    <label key={op} className={`flex items-center gap-3 p-3 rounded-lg border cursor-pointer transition-colors ${estilo} ${resultado ? 'cursor-default' : ''}`}>
                      <input
                        type="radio"
                        name={p.id}
                        value={op}
                        checked={elegida}
                        disabled={!!resultado || isPending}
                        onChange={() => setRespuestas(prev => ({ ...prev, [p.id]: op }))}
                        className="accent-marca"
                      />
                      <span className="text-sm text-tinta flex-1">{op}</span>
                      {resultado && sol && marcarBien && <CheckCircle2 className="w-4 h-4 text-marca" />}
                      {resultado && sol && marcarMal && <XCircle className="w-4 h-4 text-red-500 dark:text-red-400" />}
                    </label>
                  )
                })}
              </div>
            </CardContent>
          </Card>
        )
      })}

      <div className="flex justify-end">
        {resultado ? (
          // Sin intentos restantes no se ofrece reintentar: el servidor lo rechazaría igual
          // (MAXIMO_INTENTOS_QUIZ en alumno/actions.ts), y un botón que sólo sirve para
          // recibir un error es peor que no tenerlo.
          !resultado.aprobado && resultado.intentosRestantes > 0 && (
            <Button onClick={reintentar} className="bg-marca hover:bg-marca/90 text-crema px-8 h-12 rounded-xl">
              <RotateCcw className="w-4 h-4 mr-2" /> Reintentar ({resultado.intentosRestantes})
            </Button>
          )
        ) : (
          <Button onClick={enviar} disabled={!todasRespondidas || isPending} className="bg-marca hover:bg-marca/90 text-crema px-8 h-12 rounded-xl">
            {isPending ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : null} Enviar respuestas
          </Button>
        )}
      </div>
    </div>
  )
}
