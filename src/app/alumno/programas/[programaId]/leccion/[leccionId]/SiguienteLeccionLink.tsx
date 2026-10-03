import Link from 'next/link'
import { ArrowRight } from 'lucide-react'
import { buttonVariants } from '@/components/ui/button'
import { cn } from '@/lib/utils'

export function SiguienteLeccionLink({ programaId, siguiente }: { programaId: string, siguiente: { id: string, titulo: string } }) {
  return (
    <Link
      href={`/alumno/programas/${programaId}/leccion/${siguiente.id}`}
      title={siguiente.titulo}
      className={cn(buttonVariants(), 'bg-tinta text-crema hover:bg-marca h-12 px-8 rounded-xl text-sm')}
    >
      Siguiente lección <ArrowRight className="w-5 h-5 ml-2" />
    </Link>
  )
}
