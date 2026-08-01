import Markdown from 'react-markdown'
import remarkGfm from 'remark-gfm'
import { ReactNode, cloneElement, isValidElement } from 'react'
import { Info, AlertTriangle, Lightbulb, AlertOctagon, CheckCircle2 } from 'lucide-react'

// Extrae el texto plano de los children de react-markdown (para detectar [!TIPO])
// eslint-disable-next-line @typescript-eslint/no-explicit-any
function extraerTexto(node: any): string {
  if (node == null) return ''
  if (typeof node === 'string') return node
  if (Array.isArray(node)) return node.map(extraerTexto).join('')
  if (node.props?.children) return extraerTexto(node.props.children)
  return ''
}

// Elimina el marcador `[!TIPO]` del primer nodo de texto, conservando el formato del resto
function quitarMarcador(children: ReactNode): ReactNode {
  let hecho = false
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const walk = (node: any): any => {
    if (hecho) return node
    if (typeof node === 'string') {
      const nuevo = node.replace(/^\s*\[!\w+\]\s*/, '')
      if (nuevo !== node) hecho = true
      return nuevo
    }
    if (Array.isArray(node)) return node.map(walk)
    if (isValidElement(node) && (node.props as { children?: ReactNode })?.children) {
      return cloneElement(node, {}, walk((node.props as { children?: ReactNode }).children))
    }
    return node
  }
  return walk(children)
}

const CALLOUTS: Record<string, { icon: ReactNode; cls: string; label: string }> = {
  NOTE: { icon: <Info className="w-4 h-4" />, cls: 'border-blue-300 dark:border-blue-700 bg-blue-50 dark:bg-blue-950/40 text-blue-900 dark:text-blue-300', label: 'Nota' },
  IMPORTANT: { icon: <AlertOctagon className="w-4 h-4" />, cls: 'border-marca/40 bg-marca/5 text-tinta', label: 'Importante' },
  TIP: { icon: <Lightbulb className="w-4 h-4" />, cls: 'border-emerald-300 dark:border-emerald-700 bg-emerald-50 dark:bg-emerald-950/40 text-emerald-900 dark:text-emerald-300', label: 'Consejo' },
  WARNING: { icon: <AlertTriangle className="w-4 h-4" />, cls: 'border-amber-300 dark:border-amber-700 bg-amber-50 dark:bg-amber-950/40 text-amber-900 dark:text-amber-300', label: 'Atención' },
  CAUTION: { icon: <AlertOctagon className="w-4 h-4" />, cls: 'border-red-300 dark:border-red-700 bg-red-50 dark:bg-red-950/40 text-red-900 dark:text-red-300', label: 'Cuidado' },
  DATO: { icon: <CheckCircle2 className="w-4 h-4" />, cls: 'border-blue-300 dark:border-blue-700 bg-blue-50 dark:bg-blue-950/40 text-blue-900 dark:text-blue-300', label: 'Dato' },
  CASO: { icon: <Info className="w-4 h-4" />, cls: 'border-marca/40 bg-marca/5 text-tinta', label: 'Caso' },
  ERROR: { icon: <AlertTriangle className="w-4 h-4" />, cls: 'border-red-300 dark:border-red-700 bg-red-50 dark:bg-red-950/40 text-red-900 dark:text-red-300', label: 'Error común' },
}

// Renderiza Markdown con GFM (tablas, listas de tareas) y cajas destacadas al estilo
// admonition: un blockquote que empieza con `[!NOTE]`, `[!DATO]`, `[!ERROR]`, etc.
export function MarkdownRico({ children }: { children: string }) {
  return (
    <div className="prose prose-slate max-w-none prose-headings:font-heading prose-a:text-marca prose-table:text-sm prose-th:bg-crema prose-th:text-tinta">
      <Markdown
        remarkPlugins={[remarkGfm]}
        components={{
          blockquote(props) {
            const texto = extraerTexto(props.children).trim()
            const m = texto.match(/^\[!(\w+)\]\s*/)
            const tipo = m?.[1]?.toUpperCase()
            const callout = tipo ? CALLOUTS[tipo] : null
            if (!callout) {
              return <blockquote className="border-l-4 border-tinta/20 pl-4 italic text-tinta/80">{props.children}</blockquote>
            }
            return (
              <div className={`not-prose my-4 rounded-xl border px-4 py-3 ${callout.cls}`}>
                <div className="flex items-center gap-2 font-bold text-sm mb-1">{callout.icon} {callout.label}</div>
                <div className="text-sm [&_p]:my-1">{quitarMarcador(props.children)}</div>
              </div>
            )
          },
          table(props) {
            return <div className="overflow-x-auto"><table>{props.children}</table></div>
          },
        }}
      >
        {children}
      </Markdown>
    </div>
  )
}
