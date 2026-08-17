import type { LucideIcon } from 'lucide-react'
import { cn } from '@/lib/utils'
import { firmarIlustracion, type SlugIlustracion } from '@/utils/ilustraciones'
import { ImagenMuestra } from './ImagenMuestra'

type Props = {
  slug: SlugIlustracion
  /** Ícono del placeholder, para cuando la ilustración no está disponible en el bucket. */
  icon: LucideIcon
  etiqueta: string
  variante?: 'marca' | 'sage' | 'grisCalido'
  className?: string
}

// Muestra la ilustración que está guardada en el bucket del psicólogo. Si no se pudo
// resolver (R2 sin configurar, archivo borrado del bucket), cae al placeholder de siempre
// en vez de dejar el hueco de una imagen rota — la página tiene que sostenerse igual.
export async function IlustracionSitio({ slug, icon, etiqueta, variante = 'marca', className }: Props) {
  const ilustracion = await firmarIlustracion(slug)

  if (!ilustracion) {
    return <ImagenMuestra icon={icon} etiqueta={etiqueta} variante={variante} className={className} />
  }

  // Dos archivos y no uno: el SVG viaja dentro de un <img>, así que no ve la clase `dark`
  // del documento y no puede resolver el tema por su cuenta. El intercambio lo hace CSS
  // desde afuera. Se descargan los dos (el navegador no saltea una imagen con
  // `display: none`), pero son ~4 KB cada una, así que no compensa complicarlo.
  // Nada de next/image: la URL viene firmada y cambia cada hora, con lo cual el
  // optimizador guardaría una copia nueva cada vez y nunca acertaría el caché.
  return (
    <figure className={cn('overflow-hidden rounded-2xl border border-border bg-card', className)}>
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img
        src={ilustracion.claro}
        alt={ilustracion.alt}
        width={1200}
        height={900}
        className="block aspect-[4/3] w-full object-cover dark:hidden"
      />
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img
        src={ilustracion.oscuro}
        alt={ilustracion.alt}
        width={1200}
        height={900}
        className="hidden aspect-[4/3] w-full object-cover dark:block"
      />
      <figcaption className="border-t border-border px-4 py-2.5 font-serif text-xs text-muted-foreground">
        {etiqueta} · ilustración
      </figcaption>
    </figure>
  )
}
