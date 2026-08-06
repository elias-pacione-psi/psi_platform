import { createClient } from '@/utils/supabase/server'
import { firmarUrlsRecursos } from '@/utils/supabase/recursos'
import { asegurarCarpetasBibliotecaR2, sincronizarBibliotecaR2 } from '@/utils/supabase/biblioteca-r2'
import { listarCarpeta, obtenerUsoTotal } from '../archivos/actions'
import { BibliotecaAdminClient } from './BibliotecaAdminClient'
import { ArchivosClient } from '../archivos/ArchivosClient'
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs'
import { redirect } from 'next/navigation'

export const metadata = { title: 'Biblioteca | Elias Pacione' }

type Props = { searchParams: Promise<{ tab?: string }> }

// Antes eran dos secciones del sidebar (Biblioteca + Archivos) para un solo flujo: subir
// el archivo y después darle acceso a un alumno. Quedan unificadas acá como pestañas de
// una sola página — "Gestor de Archivos" es el gestor crudo del bucket completo (lo que
// antes vivía en /psicologo/archivos), "Libros" es la vista curada con acceso por alumno
// (lo que ya era esta página, con value="asignado" porque son recursos asignados, no
// solo libros). /psicologo/archivos redirige acá con ?tab=archivos para no romper links
// viejos.
export default async function AdminBibliotecaPage({ searchParams }: Props) {
  const supabase = await createClient()

  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const { data: perfil } = await supabase
    .from('alumnos')
    .select('rol')
    .eq('id', user.id)
    .single()

  if (perfil?.rol !== 'psicologo') redirect('/alumno')

  const { tab } = await searchParams
  const tabInicial = tab === 'archivos' ? 'archivos' : 'asignado'

  // Antes de listar nada: si el bucket todavía no tiene la estructura de Biblioteca
  // (bucket nuevo, o alguien la borró desde el panel de Cloudflare), se recrea sola.
  await asegurarCarpetasBibliotecaR2()

  // Espejo de la carpeta "Biblioteca R2" antes de leer la tabla: así lo que se subió
  // desde la pestaña "Todos los archivos" (o directo desde el panel de Cloudflare) ya
  // está acá. Best-effort — si el bucket no responde, se muestra lo que haya en la tabla.
  // Va secuencial y no en el Promise.all de abajo porque la consulta a
  // biblioteca_recursos depende de que esta sincronización haya terminado.
  const sincronizacion = await sincronizarBibliotecaR2(supabase)
  if ('error' in sincronizacion) {
    console.error('No se pudo sincronizar Biblioteca R2:', sincronizacion.error)
  }

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  let recursos: any[] = []
  try {
    // La pestaña "Libros" muestra solo lo que se sincronizó desde la carpeta
    // Biblioteca R2/Lecturas/ (tipo_contenido = 'r2_pdf', ver SECCIONES_BIBLIOTECA_R2 en
    // utils/r2-marcador.ts) — audios, videos, otros recursos y lo cargado a mano con
    // "Añadir material" quedan fuera de esta vista a pedido de Lucas.
    const { data } = await supabase
      .from('biblioteca_recursos')
      .select('*, recursos_asignados(alumno_id)')
      .eq('tipo_contenido', 'r2_pdf')
      .order('created_at', { ascending: false })
    if (data) recursos = data
  } catch (err) {
    console.error("No se pudo cargar la biblioteca. ¿La tabla fue creada?", err)
  }

  const [recursosFirmados, { data: alumnos }, listado, usoTotal, { data: modulos }] = await Promise.all([
    firmarUrlsRecursos(recursos),
    supabase.from('alumnos').select('id, nombre, email').eq('estado', 'activo').eq('rol', 'alumno').order('nombre', { ascending: true }),
    listarCarpeta(''),
    obtenerUsoTotal(),
    supabase.from('modulos').select('id, titulo, programa_id, programas(titulo)').order('orden'),
  ])

  // Para el botón "Abrir": los archivos del bucket privado necesitan URL firmada.
  // Conservamos el path original para editar/asignar sin romper la referencia.
  const recursosParaCliente = recursos.map((r, i) => ({ ...r, url_abrible: recursosFirmados[i].url_recurso }))
  const usoTotalBytes = 'bytes' in usoTotal ? usoTotal.bytes : 0

  return (
    <div className="space-y-6 max-w-7xl mx-auto">
      <div>
        <h1 className="text-3xl font-heading font-bold text-tinta">Biblioteca</h1>
        <p className="text-muted-foreground mt-2 font-sans">
          Subí el PDF a la carpeta <span className="font-mono text-tinta">Biblioteca
          R2/Lecturas</span> desde &ldquo;Gestor de Archivos&rdquo; y dale acceso a un
          alumno en &ldquo;Libros&rdquo;. Esa pestaña muestra solo lo que está en
          Lecturas — audios, videos y otros recursos se administran desde &ldquo;Gestor
          de Archivos&rdquo;.
        </p>
      </div>

      <Tabs defaultValue={tabInicial}>
        <TabsList>
          <TabsTrigger value="asignado">Libros</TabsTrigger>
          <TabsTrigger value="archivos">Gestor de Archivos</TabsTrigger>
        </TabsList>
        <TabsContent value="asignado">
          <BibliotecaAdminClient recursos={recursosParaCliente} alumnos={alumnos || []} />
        </TabsContent>
        <TabsContent value="archivos">
          {'error' in listado ? (
            <div className="bg-red-50 dark:bg-red-950/20 border border-red-300 dark:border-red-900 text-red-700 dark:text-red-400 rounded-2xl p-6 font-sans">
              {listado.error}
            </div>
          ) : (
            // eslint-disable-next-line @typescript-eslint/no-explicit-any
            <ArchivosClient inicial={listado} usoTotalInicial={usoTotalBytes} modulos={(modulos || []) as any[]} />
          )}
        </TabsContent>
      </Tabs>
    </div>
  )
}
