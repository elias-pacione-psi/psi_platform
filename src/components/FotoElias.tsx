import { cn } from '@/lib/utils'
import { FOTO_PERFIL } from '@/utils/perfil-profesional'

// La foto de presentación de Elias en la introducción "Sobre Elías" de la landing. Se deja
// el encuadre original (retrato, luz de escenario) en vez de recortarla a un headshot de
// estudio: es la que hay y transmite mejor la trayectoria que un placeholder genérico.
// Cuando haya otra, se cambia en FOTO_PERFIL (utils/perfil-profesional.ts). /quien-soy no
// usa este componente: ahí va el carrusel de FOTOS_PERFIL (ver CarruselFotos), que arranca
// con esta misma foto, recortada a 4:5 aparte.
export function FotoElias({ className }: { className?: string }) {
  return (
    <div
      className={cn(
        'mx-auto max-w-xs overflow-hidden rounded-2xl border border-border bg-card md:mx-0 md:max-w-none',
        className,
      )}
    >
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img
        src={FOTO_PERFIL.src}
        alt={FOTO_PERFIL.alt}
        width={FOTO_PERFIL.width}
        height={FOTO_PERFIL.height}
        className="aspect-[2/3] w-full object-cover"
      />
    </div>
  )
}
