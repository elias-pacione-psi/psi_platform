import { createClient } from '@/utils/supabase/server'
import { firmarUrlsRecursos } from '@/utils/supabase/recursos'
import { AdminActividadesClient } from './AdminActividadesClient'
import { redirect } from 'next/navigation'

export default async function AdminActividadesPage(props: { params: Promise<{ programaId: string }> }) {
  const params = await props.params;
  const programaId = params.programaId;
  const supabase = await createClient()

  const { data: programa, error: progError } = await supabase
    .from('programas')
    .select('*')
    .eq('id', programaId)
    .single()

  if (progError || !programa) {
    redirect('/psicologo/programas')
  }

  const { data: unidades } = await supabase
    .from('unidades')
    .select('*')
    .eq('programa_id', programaId)
    .order('created_at', { ascending: true })

  const { data: actividades } = await supabase
    .from('actividades')
    .select('*')
    .eq('programa_id', programaId)
    .order('created_at', { ascending: true })

  // Para el link "Ver archivo" del editor: firmar URLs de archivos del bucket,
  // preservando el path original para no romper la edición
  const firmadas = await firmarUrlsRecursos(actividades || [])
  const actividadesParaCliente = (actividades || []).map((a, i) => ({ ...a, url_abrible: firmadas[i].url_recurso }))

  return (
    <div className="space-y-6 max-w-6xl mx-auto">
      <AdminActividadesClient programa={programa} unidades={unidades || []} actividades={actividadesParaCliente} />
    </div>
  )
}
