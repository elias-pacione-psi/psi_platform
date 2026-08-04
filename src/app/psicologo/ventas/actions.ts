'use server'

import { revalidatePath } from 'next/cache'
import { requirePsicologo } from '@/utils/supabase/guards'

// Marca la orden como reembolsada de este lado — NO devuelve la plata. Eso se hace en el
// panel de Mercado Pago (ahí es donde vive la plata de verdad); esta acción es la
// contraparte administrativa: registra que se reembolsó y, con eso, descargarEbookDeOrden
// deja de entregar el PDF (exige estado === 'pagada' exacto). Sin este paso manual, un
// comprador reembolsado seguiría pudiendo bajar el ebook indefinidamente.
export async function marcarOrdenReembolsada(ordenId: string) {
  const auth = await requirePsicologo()
  if ('error' in auth) return { error: auth.error }
  const { supabase } = auth

  const { data: orden } = await supabase.from('ordenes').select('estado').eq('id', ordenId).maybeSingle()
  if (!orden) return { error: 'No se encontró esa orden.' }
  if (orden.estado !== 'pagada') return { error: 'Solo se puede reembolsar una orden que esté pagada.' }

  const { error } = await supabase.from('ordenes').update({ estado: 'reembolsada' }).eq('id', ordenId)
  if (error) return { error: error.message }

  revalidatePath('/psicologo/ventas')
  return { success: true }
}
