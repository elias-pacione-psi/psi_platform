import { CrearCuentaClient } from './CrearCuentaClient'

export const metadata = { title: 'Creá tu cuenta | Elias Pacione' }

type Props = { searchParams: Promise<{ email?: string }> }

// Público, pero NO es un registro abierto: crearCuentaComprador (actions.ts) exige una
// orden 'pagada' con ese email antes de crear nada. El único link real hacia acá es la
// confirmación de compra en /pedido/[id] — llegar acá sin haber pagado no alcanza para
// crear una cuenta, aunque se sepa la URL.
export default async function CrearCuentaPage({ searchParams }: Props) {
  const { email } = await searchParams
  return <CrearCuentaClient emailInicial={email ?? ''} />
}
