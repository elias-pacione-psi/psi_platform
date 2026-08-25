'use client'

import { useState } from 'react'
import { Download, PencilLine, ShieldCheck } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { MarkdownRico } from '@/components/MarkdownRico'

// Ejercicios personales, distintos del quiz a propósito:
//
//   quiz      → comprensión del contenido, se corrige server-side y el intento QUEDA
//               guardado (quiz_intentos), porque es progreso educativo evaluable.
//   ejercicio → reflexión personal, opcional, y las respuestas NO tocan el servidor:
//               viven en el estado de este componente y se van cuando cierra la pestaña.
//
// Que no se guarden no es una limitación técnica, es el punto: una respuesta a "¿qué
// situación te genera más ansiedad?" es material sensible que la Ley 25.326 no nos deja
// tratar, y la plataforma es educativa, no clínica. La única forma de conservarla es que
// el alumno se la descargue a su propia máquina.

// Cada línea que arranca con "?" es una consigna con su campo de respuesta; todo lo demás
// es markdown normal. Formato deliberadamente simple para que el psicólogo lo escriba sin
// aprender una sintaxis nueva.
function parsear(contenido: string) {
  const bloques: Array<{ tipo: 'texto'; valor: string } | { tipo: 'consigna'; valor: string; indice: number }> = []
  let buffer: string[] = []
  let indice = 0

  const volcarTexto = () => {
    const texto = buffer.join('\n').trim()
    if (texto) bloques.push({ tipo: 'texto', valor: texto })
    buffer = []
  }

  for (const linea of contenido.split('\n')) {
    if (linea.trimStart().startsWith('?')) {
      volcarTexto()
      bloques.push({ tipo: 'consigna', valor: linea.trimStart().slice(1).trim(), indice: indice++ })
    } else {
      buffer.push(linea)
    }
  }
  volcarTexto()
  return bloques
}

export function EjerciciosCliente({ contenido, titulo }: { contenido: string; titulo: string }) {
  const bloques = parsear(contenido)
  const consignas = bloques.filter((b) => b.tipo === 'consigna') as Array<{ tipo: 'consigna'; valor: string; indice: number }>
  const [respuestas, setRespuestas] = useState<Record<number, string>>({})

  const algunaRespondida = Object.values(respuestas).some((r) => r.trim())

  function descargar() {
    // Se arma un HTML autocontenido con la paleta de la marca en hex: el archivo sale de
    // la app, así que no puede depender de las variables CSS de globals.css. Los mismos
    // colores que usan los emails (src/emails/EmailLayout.tsx).
    const filas = consignas
      .map((c) => {
        const respuesta = (respuestas[c.indice] ?? '').trim() || '(sin responder)'
        return `
        <section style="margin:0 0 28px">
          <p style="color:#4e6478;font-size:13px;font-weight:700;margin:0 0 6px;text-transform:uppercase;letter-spacing:.4px">Consigna ${c.indice + 1}</p>
          <p style="color:#2f3e46;font-size:16px;font-weight:600;margin:0 0 10px;line-height:1.5">${escapar(c.valor)}</p>
          <div style="background:#ffffff;border:1px solid #dce3e8;border-left:3px solid #a8b79f;border-radius:8px;padding:14px 16px;color:#2f3e46;font-size:15px;line-height:1.7;white-space:pre-wrap">${escapar(respuesta)}</div>
        </section>`
      })
      .join('')

    const fecha = new Date().toLocaleDateString('es-AR', { day: '2-digit', month: 'long', year: 'numeric' })
    const html = `<!doctype html>
<html lang="es"><head><meta charset="utf-8">
<meta name="viewport" content="width=device-width,initial-scale=1">
<title>${escapar(titulo)} · Mis respuestas</title></head>
<body style="margin:0;padding:0;background:#f1f0eb;font-family:'Inter','Segoe UI','Helvetica Neue',Arial,sans-serif">
  <div style="background:#2f3e46;padding:26px 32px">
    <div style="max-width:720px;margin:0 auto">
      <p style="color:#ffffff;font-size:20px;font-weight:700;margin:0;letter-spacing:-.3px">Elías Pacione</p>
      <p style="color:#d6dee5;font-size:13px;margin:2px 0 0">Plataforma de Formación</p>
    </div>
  </div>
  <div style="max-width:720px;margin:0 auto;background:#ffffff;padding:36px 40px 32px;border-radius:0 0 8px 8px">
    <h1 style="color:#2f3e46;font-size:25px;font-weight:700;margin:0 0 4px;line-height:1.3">${escapar(titulo)}</h1>
    <p style="color:#5f6d77;font-size:14px;margin:0 0 28px">Tus respuestas · ${fecha}</p>
    ${filas}
    <hr style="border:none;border-top:1px solid #dce3e8;margin:26px 0 16px">
    <p style="color:#5f6d77;font-size:12px;line-height:1.6;margin:0">
      Este archivo se generó en tu navegador y es solo tuyo: las respuestas nunca se
      enviaron ni se guardaron en la plataforma. Guardalo donde quieras conservarlo.
    </p>
  </div>
</body></html>`

    const url = URL.createObjectURL(new Blob([html], { type: 'text/html;charset=utf-8' }))
    const a = document.createElement('a')
    a.href = url
    a.download = `${titulo.replace(/[^\w\sáéíóúñÁÉÍÓÚÑ-]/g, '').trim().replace(/\s+/g, '-').toLowerCase()}-respuestas.html`
    document.body.appendChild(a)
    a.click()
    document.body.removeChild(a)
    URL.revokeObjectURL(url)
  }

  return (
    <div className="space-y-6">
      <div className="bg-card rounded-2xl border border-border shadow-sm p-6 md:p-8">
        <h2 className="text-xl font-heading font-bold text-tinta flex items-center gap-2 mb-1">
          <PencilLine className="w-5 h-5 text-marca" /> Ejercicios personales
        </h2>
        <p className="text-muted-foreground font-serif mb-6">
          Son opcionales y para vos. No hay respuestas correctas ni corrección.
        </p>

        <div className="flex items-start gap-3 rounded-xl border border-sage/40 bg-sage/10 p-4 mb-8">
          <ShieldCheck className="w-5 h-5 text-sage-hondo shrink-0 mt-0.5" />
          <p className="text-sm text-tinta leading-relaxed">
            <b>Lo que escribas no se guarda.</b> Queda solo en este navegador y se pierde al
            cerrar la pestaña — no viaja a la plataforma ni lo ve nadie más. Si querés
            conservarlo, descargalo con el botón de abajo.
          </p>
        </div>

        <div className="space-y-8">
          {bloques.map((bloque, i) =>
            bloque.tipo === 'texto' ? (
              <div key={`t${i}`}>
                <MarkdownRico>{bloque.valor}</MarkdownRico>
              </div>
            ) : (
              <div key={`c${bloque.indice}`}>
                <label
                  htmlFor={`consigna-${bloque.indice}`}
                  className="block font-sans font-semibold text-tinta mb-2 leading-relaxed"
                >
                  <span className="text-marca mr-1.5">{bloque.indice + 1}.</span>
                  {bloque.valor}
                </label>
                <textarea
                  id={`consigna-${bloque.indice}`}
                  value={respuestas[bloque.indice] ?? ''}
                  onChange={(e) => setRespuestas((prev) => ({ ...prev, [bloque.indice]: e.target.value }))}
                  rows={4}
                  placeholder="Escribí lo que quieras acá…"
                  className="w-full rounded-xl border border-border bg-background px-4 py-3 text-tinta placeholder:text-muted-foreground/70 focus:border-marca focus:outline-none focus:ring-2 focus:ring-marca/25 resize-y font-serif leading-relaxed"
                />
              </div>
            ),
          )}
        </div>

        {consignas.length > 0 && (
          <div className="mt-8 pt-6 border-t border-border flex flex-col sm:flex-row sm:items-center gap-3">
            <Button
              onClick={descargar}
              disabled={!algunaRespondida}
              className="bg-marca hover:bg-marca/90 text-crema font-sans h-11 rounded-lg shadow-sm shadow-marca/20 disabled:opacity-50"
            >
              <Download className="w-4 h-4 mr-2" /> Descargar mis respuestas
            </Button>
            <p className="text-sm text-muted-foreground">
              {algunaRespondida
                ? 'Se descarga un archivo a tu dispositivo. Podés abrirlo o imprimirlo cuando quieras.'
                : 'Respondé al menos una consigna para poder descargarlas.'}
            </p>
          </div>
        )}
      </div>
    </div>
  )
}

function escapar(texto: string): string {
  return texto
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
}
