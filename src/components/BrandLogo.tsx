import Link from 'next/link'
import { BrandMark } from '@/components/BrandMark'

// Lockup horizontal del brandbook: isotipo a la izquierda, "Elias Pacione" en
// Poppins y el claim en serif debajo. El isotipo es apaisado (~1.5:1), por eso
// va en una caja ancha y no dentro de un círculo.
export function BrandLogo({ href = '/alumno' }: { href?: string }) {
  return (
    <Link
      href={href}
      className="flex items-center gap-3 w-full px-2 py-3 transition-opacity hover:opacity-80 duration-200"
    >
      <BrandMark className="w-9 h-6 shrink-0 text-tinta" />
      <span className="flex flex-col leading-tight min-w-0">
        <span className="font-heading font-semibold text-[15px] tracking-tight text-tinta whitespace-nowrap">
          Elias Pacione
        </span>
        <span className="font-serif text-[11px] text-muted-foreground whitespace-nowrap">
          Psicología con sentido.
        </span>
      </span>
    </Link>
  )
}
