import { createAdminClient } from '@/utils/supabase/admin'
import { CrearCuentaClient } from './CrearCuentaClient'

export const metadata = { title: 'Creá tu cuenta | Elias Pacione' }

type Props = { searchParams: Promise<{ orden?: string }> }

// Público, pero NO es un registro abierto: crearCuentaComprador (actions.ts) exige una
// orden 'pagada' con ese email antes de crear nada, y el endpoint /auth/v1/signup de
// Supabase está deshabilitado, así que tampoco hay forma de saltearse esa función. El
// único link real hacia acá es la confirmación de compra en /pedido/[id] — llegar acá sin
// haber pagado no alcanza para crear una cuenta, aunque se sepa la URL.
//
// El email se resuelve acá desde el id de la orden en vez de venir en el query string:
// mandarlo por URL lo deja en el historial del navegador, en los logs del server y en la
// cabecera Referer de cualquier recurso externo de esta página. El id de la orden ya es la
// capability que la persona tiene (es la URL que le dio Mercado Pago), así que no agrega
// exposición — sólo evita la del dato personal.
export default async function CrearCuentaPage({ searchParams }: Props) {
  const { orden } = await searchParams

  let emailInicial = ''
  if (orden) {
    const supabaseAdmin = createAdminClient()
    const { data } = await supabaseAdmin
      .from('ordenes')
      .select('email_comprador')
      .eq('id', orden)
      .eq('estado', 'pagada')
      .is('alumno_id', null)
      .maybeSingle()
    emailInicial = data?.email_comprador ?? ''
  }

  return <CrearCuentaClient emailInicial={emailInicial} />
}
