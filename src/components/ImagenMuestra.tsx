import type { LucideIcon } from 'lucide-react'
import { cn } from '@/lib/utils'

// Placeholder de respaldo. Las páginas públicas hoy muestran las ilustraciones que están
// en el bucket (ver IlustracionSitio.tsx); esto es a lo que caen si el bucket no responde
// o el archivo no está. Se rotula como "imagen de muestra" en vez de simular una foto
// real, para que se note que ahí falta el asset definitivo.
const FONDOS = {
  marca: 'from-marca/25 via-marca/10 to-transparent',
  sage: 'from-sage/50 via-sage/15 to-transparent',
  grisCalido: 'from-gris-calido dark:from-gris-calido/40 via-gris-calido/35 dark:via-gris-calido/15 to-transparent',
} as const

type Props = {
  icon: LucideIcon
  etiqueta: string
  variante?: keyof typeof FONDOS
  className?: string
}

export function ImagenMuestra({ icon: Icon, etiqueta, variante = 'marca', className }: Props) {
  return (
    <figure className={cn('overflow-hidden rounded-2xl border border-border bg-card', className)}>
      <div className={cn('flex aspect-[4/3] items-center justify-center bg-gradient-to-br', FONDOS[variante])}>
        <Icon className="w-16 h-16 text-tinta/40" strokeWidth={1.25} />
      </div>
      <figcaption className="border-t border-border px-4 py-2.5 font-serif text-xs text-muted-foreground">
        {etiqueta} · imagen de muestra
      </figcaption>
    </figure>
  )
}
