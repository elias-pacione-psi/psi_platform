import Link from 'next/link'
import { Sprout } from 'lucide-react'

// Marca provisoria en texto (sin assets). Cambiar acá el nombre/ícono
// cuando el psicólogo defina su identidad visual.
export function BrandLogo({ href = '/paciente' }: { href?: string }) {
  return (
    <Link href={href} className="flex items-center justify-center gap-2.5 w-full px-2 py-3 transition-transform hover:scale-[1.02] duration-200">
      <span className="w-10 h-10 rounded-full bg-marca/10 text-marca flex items-center justify-center shrink-0">
        <Sprout className="w-5 h-5" />
      </span>
      <span className="flex flex-col leading-tight">
        <span className="font-heading font-bold text-lg text-tinta">Espacio</span>
        <span className="font-heading text-lg text-marca -mt-1">Terapéutico</span>
      </span>
    </Link>
  )
}
