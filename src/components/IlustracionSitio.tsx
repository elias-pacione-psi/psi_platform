import type { LucideIcon } from 'lucide-react'
import { cn } from '@/lib/utils'
import { resolverIlustracion, type SlugIlustracion } from '@/utils/ilustraciones'
import { ImagenMuestra } from './ImagenMuestra'

type Props = {
  slug: SlugIlustracion
  /** Ícono del placeholder, para cuando la ilustración no está disponible en el bucket. */
  icon: LucideIcon
  etiqueta: string
  variante?: 'marca' | 'sage' | 'grisCalido'
  /** La del hero: se carga enseguida. Las de más abajo esperan a que se las vaya a ver. */
  prioridad?: boolean
  className?: string
}

// Muestra la ilustración que está guardada en el bucket del psicólogo. Si no se pudo
// resolver (R2 sin configurar, archivo borrado del bucket), cae al placeholder de siempre
// en vez de dejar el hueco de una imagen rota — la página tiene que sostenerse igual.
export async function IlustracionSitio({
  slug,
  icon,
  etiqueta,
  variante = 'marca',
  prioridad = false,
  className,
}: Props) {
  const ilustracion = await resolverIlustracion(slug)

  if (!ilustracion) {
    return <ImagenMuestra icon={icon} etiqueta={etiqueta} variante={variante} className={className} />
  }

  // Dos archivos y no uno: el SVG viaja dentro de un <img>, así que no ve la clase `dark`
  // del documento y no puede resolver el tema por su cuenta. El intercambio lo hace CSS
  // desde afuera. Con `loading="lazy"` el navegador no baja la que está en `display: none`
  // (no tiene caja, así que nunca "entra" en pantalla): en la práctica se descarga una sola,
  // y la otra recién cuando alguien cambia de tema.
  // Nada de next/image: son SVG chicos y la URL ya es estable (ver utils/ilustraciones.ts),
  // así que el optimizador no aportaría nada.
  const carga = prioridad
    ? ({ loading: 'eager', fetchPriority: 'high' } as const)
    : ({ loading: 'lazy' } as const)

  return (
    <figure className={cn('overflow-hidden rounded-2xl border border-border bg-card', className)}>
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img
        src={ilustracion.claro}
        alt={ilustracion.alt}
        width={1200}
        height={900}
        decoding="async"
        {...carga}
        className="block aspect-[4/3] w-full object-cover dark:hidden"
      />
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img
        src={ilustracion.oscuro}
        alt={ilustracion.alt}
        width={1200}
        height={900}
        decoding="async"
        {...carga}
        className="hidden aspect-[4/3] w-full object-cover dark:block"
      />
      {/* Sin el rótulo "· ilustración" que llevaba el placeholder: acá la imagen es el
          asset definitivo, así que el pie solo nombra lo que se ve. */}
      <figcaption className="border-t border-border px-4 py-2.5 font-sans text-sm text-tinta/75">
        {etiqueta}
      </figcaption>
    </figure>
  )
}
