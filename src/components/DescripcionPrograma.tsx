import { cn } from '@/lib/utils'

// Las descripciones ampliadas de los programas (`programas.descripcion_larga`) son texto
// plano que se edita en /psicologo/programas: párrafos separados por una línea en blanco.
// El segundo párrafo suele ser la línea de datos ("6 lecciones · de 20 a 30 minutos cada una
// · a tu ritmo"), que es lo primero que se busca al elegir un curso: en vez de quedar
// enterrada entre párrafos, se dibuja como una fila de etiquetas. Todo lo demás se muestra
// tal cual, respetando los saltos de línea (por eso `whitespace-pre-line`).
//
// Lo usan /cursos (público) y la ficha del programa del alumno, para que el mismo texto se
// vea igual en los dos lados.

// Una línea de datos tiene varias partes cortas separadas por " · " y no es una oración:
// sin saltos de línea y sin un punto en el medio. Es una heurística a propósito acotada —
// un párrafo normal que casualmente lleve un " · " no debería convertirse en etiquetas.
function esLineaDeDatos(parrafo: string): boolean {
  if (parrafo.includes('\n') || parrafo.length > 220) return false
  const partes = parrafo.replace(/\.$/, '').split(' · ')
  return partes.length >= 2 && partes.every((p) => p.length <= 90 && !p.includes('. '))
}

export function DescripcionPrograma({ texto, className }: { texto: string; className?: string }) {
  const parrafos = texto
    .split(/\n{2,}/)
    .map((p) => p.trim())
    .filter(Boolean)

  return (
    <div className={cn('space-y-4', className)}>
      {parrafos.map((parrafo, i) =>
        esLineaDeDatos(parrafo) ? (
          <ul key={i} className="flex flex-wrap gap-2">
            {parrafo
              .replace(/\.$/, '')
              .split(' · ')
              .map((dato) => (
                <li
                  key={dato}
                  className="rounded-full border border-border bg-gris-calido/50 px-3 py-1 font-sans text-xs font-medium text-tinta/80 dark:bg-background"
                >
                  {dato}
                </li>
              ))}
          </ul>
        ) : (
          <p key={i} className="font-serif text-base leading-relaxed text-tinta/80 whitespace-pre-line">
            {parrafo}
          </p>
        ),
      )}
    </div>
  )
}
