import { createClient } from '@/utils/supabase/server'
import { redirect } from 'next/navigation'
import { listarCarpeta, obtenerUsoTotal } from './actions'
import { asegurarCarpetasBibliotecaR2 } from '@/utils/supabase/biblioteca-r2'
import { ArchivosClient } from './ArchivosClient'

export const metadata = { title: 'Archivos' }

export default async function ArchivosPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const { data: perfil } = await supabase.from('alumnos').select('rol').eq('id', user.id).single()
  if (perfil?.rol !== 'psicologo') redirect('/alumno')

  // Antes de listar: si el bucket todavía no tiene la estructura de Biblioteca (bucket
  // nuevo, o alguien la borró desde el panel de Cloudflare), se recrea sola.
  await asegurarCarpetasBibliotecaR2()

  const [inicial, usoTotal, { data: modulos }] = await Promise.all([
    listarCarpeta(''),
    obtenerUsoTotal(),
    supabase.from('modulos').select('id, titulo, programa_id, programas(titulo)').order('orden'),
  ])

  // Si el listado principal falla (bucket sin configurar), el uso total va a fallar
  // igual — no hace falta mostrar el error dos veces.
  const usoTotalBytes = 'bytes' in usoTotal ? usoTotal.bytes : 0

  return (
    <div className="space-y-6 max-w-6xl mx-auto">
      <div>
        <h1 className="text-4xl font-heading font-bold text-tinta">Archivos</h1>
        <p className="text-muted-foreground mt-2 font-sans">
          Subí y organizá el material del curso directamente acá, sin pasar por el panel de Cloudflare.
        </p>
      </div>

      {'error' in inicial ? (
        <div className="bg-red-50 dark:bg-red-950/20 border border-red-300 dark:border-red-900 text-red-700 dark:text-red-400 rounded-2xl p-6 font-sans">
          {inicial.error}
        </div>
      ) : (
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        <ArchivosClient inicial={inicial} usoTotalInicial={usoTotalBytes} modulos={(modulos || []) as any[]} />
      )}
    </div>
  )
}
