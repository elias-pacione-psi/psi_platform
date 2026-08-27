import Link from 'next/link'
import { ArrowRight, GraduationCap } from 'lucide-react'
import { createClient } from '@/utils/supabase/server'

// Cierre del flujo de compra: quien terminó de comprar un ebook es la persona con más
// contexto para interesarse en un curso, y hasta acá el recorrido moría en el botón de
// descarga. Se muestra DESPUÉS de la descarga y del ofrecimiento de cuenta, nunca antes:
// primero se entrega lo que la persona ya pagó.
//
// Los cursos NO se compran online (regla de AGENTS.md: cursos, formaciones,
// supervisiones y terapia los sigue asignando el psicólogo a mano después de la
// consulta). Por eso esto recomienda y linkea a /cursos — no hay carrito ni checkout
// detrás, y no debe haberlo sin cambiar esa regla primero.
export async function RecomendacionCursos({ limite = 3 }: { limite?: number }) {
  const supabase = await createClient()

  // Mismo criterio que /cursos: publicado_en_home es lo que el psicólogo marcó como
  // visible al público. Un programa sin ese flag es material interno de una cohorte.
  const { data: programas } = await supabase
    .from('programas')
    .select('id, titulo, descripcion')
    .eq('publicado_en_home', true)
    .order('created_at', { ascending: false })
    .limit(limite)

  // Sin programas publicados no se pinta un encabezado vacío: mejor que no exista la
  // sección a que exista prometiendo algo que no hay.
  if (!programas || programas.length === 0) return null

  return (
    <section className="mt-8 text-left">
      <div className="flex items-center gap-2 mb-1">
        <GraduationCap className="w-5 h-5 text-marca shrink-0" />
        <h2 className="font-heading font-semibold text-lg text-tinta">Seguí formándote</h2>
      </div>
      <p className="text-sm text-muted-foreground mb-4">
        Si el ebook te sirvió, estos cursos van más a fondo.
      </p>

      <ul className="space-y-2">
        {programas.map((p) => (
          <li key={p.id}>
            <Link
              href="/cursos"
              className="block bg-crema hover:bg-crema/70 border border-border rounded-xl p-4 transition-colors group"
            >
              <span className="font-heading font-semibold text-tinta block mb-0.5">{p.titulo}</span>
              {p.descripcion && (
                <span className="text-sm text-muted-foreground line-clamp-2 block">{p.descripcion}</span>
              )}
            </Link>
          </li>
        ))}
      </ul>

      <Link
        href="/cursos"
        className="inline-flex items-center gap-1.5 text-sm text-marca font-semibold mt-4 hover:opacity-80 transition-opacity"
      >
        Ver todos los cursos
        <ArrowRight className="w-4 h-4" />
      </Link>
    </section>
  )
}
