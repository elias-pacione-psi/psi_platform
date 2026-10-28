import { cn } from '@/lib/utils'
import { FOTOS_PERFIL } from '@/utils/perfil-profesional'
import { CarruselFotos } from './CarruselFotos'

// Las fotos de presentación de Elias, iguales en la landing y en /quien-soy: un carrusel
// de retratos de él dando un seminario (ver FOTOS_PERFIL en utils/perfil-profesional.ts).
// Se muestran recortadas sobre él y no el salón entero: acá la página habla de quién es, y
// las fotos de los encuentros completos viven en la galería de /quien-soy. Para cambiar el
// set se edita esa lista y las dos páginas se actualizan a la vez.
export function FotoElias({ className }: { className?: string }) {
  return (
    <CarruselFotos
      fotos={FOTOS_PERFIL}
      etiqueta="Fotos de Elías en charlas y seminarios"
      className={cn('mx-auto max-w-sm md:mx-0 md:max-w-none', className)}
    />
  )
}
