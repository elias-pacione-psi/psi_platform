'use client'

import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Plus, Trash2 } from 'lucide-react'

export type PreguntaQuiz = { pregunta: string; opciones: string[]; correctaIdx: number }

// Convierte las filas de quiz_preguntas de la DB al formato del builder
// eslint-disable-next-line @typescript-eslint/no-explicit-any
export function jsonAPreguntas(pqs: any[]): PreguntaQuiz[] {
  return (pqs || []).map((p) => {
    const ops = Array.isArray(p.opciones)
      ? p.opciones
      : (() => { try { return JSON.parse(p.opciones) } catch { return [] } })()
    const opciones = ops.length ? ops : ['', '']
    const idx = opciones.indexOf(p.respuesta_correcta)
    return { pregunta: p.pregunta || '', opciones, correctaIdx: idx >= 0 ? idx : 0 }
  })
}

// Valida y serializa al JSON que espera guardarQuizPreguntas
export function preguntasAJson(value: PreguntaQuiz[]): { ok: true; json: string } | { ok: false; error: string } {
  if (value.length === 0) return { ok: false, error: 'Agregá al menos una pregunta.' }
  const out = []
  for (const q of value) {
    const pregunta = q.pregunta.trim()
    const opciones = q.opciones.map((o) => o.trim()).filter(Boolean)
    const correcta = (q.opciones[q.correctaIdx] || '').trim()
    if (!pregunta) return { ok: false, error: 'Cada pregunta necesita un enunciado.' }
    if (opciones.length < 2) return { ok: false, error: 'Cada pregunta necesita al menos 2 opciones no vacías.' }
    if (!correcta || !opciones.includes(correcta)) return { ok: false, error: 'Marcá la opción correcta (no vacía) en cada pregunta.' }
    out.push({ pregunta, opciones, respuesta_correcta: correcta })
  }
  return { ok: true, json: JSON.stringify(out) }
}

export function QuizBuilder({ value, onChange }: { value: PreguntaQuiz[]; onChange: (v: PreguntaQuiz[]) => void }) {
  const set = (fn: (p: PreguntaQuiz[]) => PreguntaQuiz[]) => onChange(fn(value))

  const addPregunta = () => set((p) => [...p, { pregunta: '', opciones: ['', ''], correctaIdx: 0 }])
  const removePregunta = (qi: number) => set((p) => p.filter((_, i) => i !== qi))
  const updatePregunta = (qi: number, v: string) => set((p) => p.map((q, i) => (i === qi ? { ...q, pregunta: v } : q)))
  const addOpcion = (qi: number) => set((p) => p.map((q, i) => (i === qi ? { ...q, opciones: [...q.opciones, ''] } : q)))
  const updateOpcion = (qi: number, oi: number, v: string) =>
    set((p) => p.map((q, i) => (i === qi ? { ...q, opciones: q.opciones.map((o, j) => (j === oi ? v : o)) } : q)))
  const setCorrecta = (qi: number, oi: number) => set((p) => p.map((q, i) => (i === qi ? { ...q, correctaIdx: oi } : q)))
  const removeOpcion = (qi: number, oi: number) =>
    set((p) => p.map((q, i) => {
      if (i !== qi) return q
      const opciones = q.opciones.filter((_, j) => j !== oi)
      let correctaIdx = q.correctaIdx
      if (oi === q.correctaIdx) correctaIdx = 0
      else if (oi < q.correctaIdx) correctaIdx = q.correctaIdx - 1
      return { ...q, opciones, correctaIdx }
    }))

  return (
    <div className="space-y-3">
      <p className="text-xs text-muted-foreground">Marcá con el círculo la opción correcta de cada pregunta.</p>

      {value.length === 0 && (
        <p className="text-sm text-muted-foreground bg-card border border-dashed border-border rounded-lg p-4 text-center">
          Todavía no hay preguntas. Agregá la primera.
        </p>
      )}

      {value.map((q, qi) => (
        <div key={qi} className="border border-border rounded-lg p-4 bg-card space-y-3">
          <div className="flex items-center gap-2">
            <span className="font-bold text-marca shrink-0">{qi + 1}.</span>
            <Input
              value={q.pregunta}
              onChange={(e) => updatePregunta(qi, e.target.value)}
              placeholder="Escribí la pregunta"
              className="flex-1 border-border"
            />
            <Button type="button" variant="ghost" size="sm" onClick={() => removePregunta(qi)} className="text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-950/40 shrink-0">
              <Trash2 className="w-4 h-4" />
            </Button>
          </div>

          <div className="space-y-2 pl-6">
            {q.opciones.map((op, oi) => (
              <div key={oi} className="flex items-center gap-2">
                <input
                  type="radio"
                  name={`correcta-${qi}`}
                  checked={q.correctaIdx === oi}
                  onChange={() => setCorrecta(qi, oi)}
                  className="accent-marca w-4 h-4 shrink-0"
                  aria-label={`Marcar opción ${oi + 1} como correcta`}
                />
                <Input
                  value={op}
                  onChange={(e) => updateOpcion(qi, oi, e.target.value)}
                  placeholder={`Opción ${oi + 1}`}
                  className="flex-1 border-border"
                />
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  onClick={() => removeOpcion(qi, oi)}
                  disabled={q.opciones.length <= 2}
                  className="text-red-500 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-950/40 shrink-0 disabled:opacity-30"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                </Button>
              </div>
            ))}
            <Button type="button" variant="outline" size="sm" onClick={() => addOpcion(qi)} className="text-tinta">
              <Plus className="w-3 h-3 mr-1" /> Agregar opción
            </Button>
          </div>
        </div>
      ))}

      <Button type="button" variant="outline" onClick={addPregunta} className="w-full border-marca text-marca hover:bg-marca hover:text-crema">
        <Plus className="w-4 h-4 mr-1" /> Agregar pregunta
      </Button>
    </div>
  )
}
