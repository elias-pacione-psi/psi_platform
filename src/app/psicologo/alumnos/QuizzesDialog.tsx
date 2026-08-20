'use client'

import { useEffect, useState, useTransition } from 'react'
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Loader2, RotateCcw, Trophy, TriangleAlert } from 'lucide-react'
import { toast } from 'sonner'
import { obtenerIntentosQuizDeAlumno, reiniciarIntentosQuiz, type IntentosDeQuiz } from '../actions'
import { fechaCorta } from '@/utils/fecha-ar'

// Resultados de quiz de un alumno, con el botón para devolverle los intentos.
//
// Existe por dos agujeros que se tapan juntos: el psicólogo no tenía ninguna pantalla
// donde ver cómo le fue a alguien en un quiz (la tabla `quiz_intentos` no se leía en
// ningún lado), y un alumno que agotaba sus 3 intentos quedaba trabado sin salida — el
// mensaje le decía "escribile a tu instructor" y el instructor no tenía qué apretar.
export function QuizzesDialog(
  { alumnoId, alumnoNombre, onOpenChange }:
  { alumnoId: string; alumnoNombre: string; onOpenChange: (v: boolean) => void },
) {
  const [intentos, setIntentos] = useState<IntentosDeQuiz[] | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [reiniciando, setReiniciando] = useState<string | null>(null)
  const [isPending, startTransition] = useTransition()

  // Se carga al montar y no con la página: son datos de un alumno puntual, y traerlos
  // para los N de la tabla sería una query por fila para algo que casi nunca se mira.
  // El componente lo monta el padre recién cuando se abre el diálogo, así que no hace
  // falta resetear el estado acá — cada apertura arranca con uno nuevo.
  useEffect(() => {
    let vigente = true
    obtenerIntentosQuizDeAlumno(alumnoId).then((res) => {
      if (!vigente) return
      if ('error' in res) setError(res.error)
      else setIntentos(res.intentos)
    })
    return () => { vigente = false }
  }, [alumnoId])

  function handleReiniciar(leccionId: string) {
    setReiniciando(leccionId)
    startTransition(async () => {
      const res = await reiniciarIntentosQuiz(alumnoId, leccionId)
      setReiniciando(null)
      if (res?.error) { toast.error(res.error); return }
      toast.success('Intentos reiniciados. El alumno puede volver a rendir.')
      // Se relee en vez de sacar la fila a mano: reiniciar borra también el progreso de
      // esa lección, así que la fila desaparece entera del listado.
      const actualizado = await obtenerIntentosQuizDeAlumno(alumnoId)
      if (!('error' in actualizado)) setIntentos(actualizado.intentos)
    })
  }

  return (
    <Dialog open onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[640px] max-h-[85vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="font-heading text-xl text-tinta">Quizzes de {alumnoNombre}</DialogTitle>
          <DialogDescription className="font-sans">
            Cómo le fue en cada quiz. Si agotó los intentos sin aprobar, acá se los podés devolver.
          </DialogDescription>
        </DialogHeader>

        {error && <p className="text-sm text-red-600 dark:text-red-400 py-4">{error}</p>}

        {!error && intentos === null && (
          <div className="flex items-center gap-2 text-muted-foreground py-8 justify-center">
            <Loader2 className="w-4 h-4 animate-spin" /> Cargando…
          </div>
        )}

        {intentos?.length === 0 && (
          <p className="text-muted-foreground text-sm py-8 text-center">
            Todavía no rindió ningún quiz.
          </p>
        )}

        <div className="space-y-3">
          {(intentos ?? []).map((i) => (
            <div
              key={i.leccionId}
              className={`rounded-xl border p-4 ${
                i.bloqueado
                  ? 'border-amber-300 dark:border-amber-700 bg-amber-50 dark:bg-amber-950/40'
                  : 'border-border bg-card'
              }`}
            >
              <div className="flex items-start justify-between gap-4">
                <div className="min-w-0">
                  <p className="font-sans font-semibold text-tinta truncate">{i.leccion}</p>
                  <p className="text-xs text-muted-foreground truncate">{i.programa}</p>
                  <p className="text-sm text-tinta/80 mt-2 flex items-center gap-1.5">
                    {i.aprobado
                      ? <><Trophy className="w-4 h-4 text-marca shrink-0" /> Aprobado</>
                      : i.bloqueado
                        ? <><TriangleAlert className="w-4 h-4 text-amber-600 dark:text-amber-400 shrink-0" /> Sin intentos</>
                        : <>No aprobado</>}
                    {' · '}
                    mejor {i.mejorPuntaje}/{i.total}
                    {' · '}
                    {i.intentos} {i.intentos === 1 ? 'intento' : 'intentos'}
                  </p>
                  <p className="text-xs text-muted-foreground mt-1">
                    Último: {fechaCorta(i.ultimoIntento)}
                  </p>
                </div>

                <Button
                  variant="outline"
                  size="sm"
                  className="shrink-0"
                  disabled={isPending}
                  onClick={() => handleReiniciar(i.leccionId)}
                >
                  {reiniciando === i.leccionId
                    ? <Loader2 className="w-4 h-4 animate-spin" />
                    : <><RotateCcw className="w-4 h-4 mr-2" /> Reiniciar</>}
                </Button>
              </div>
            </div>
          ))}
        </div>
      </DialogContent>
    </Dialog>
  )
}
