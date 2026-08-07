'use server'

import { revalidatePath } from 'next/cache'
import { requirePsicologo } from '@/utils/supabase/guards'
import { esMarcadorR2, extensionDe } from '@/utils/r2-marcador'

// El psicólogo ya tiene acceso total a ebooks/ordenes vía las policies
// ebooks_all_psicologo / ordenes_all_psicologo (RLS), así que estas actions usan el
// cliente del usuario (auth.supabase) y no createAdminClient(): no hace falta saltar
// RLS para algo que la policy ya permite — ver la regla en AGENTS.md.

const EXTENSIONES_IMAGEN = ['jpg', 'jpeg', 'png', 'webp']
const PRECIO_MAXIMO_CENTAVOS = 500_000_00 // tope de seguridad contra un cero de más al tipear
const LINK_PAGO_MAX_LEN = 300

// Sin allowlist de host a propósito: hoy es Mercado Pago, pero puede ser un
// link de Ualá u otro proveedor más adelante — alcanza con exigir https.
function esUrlHttps(valor: string): boolean {
  try { return new URL(valor).protocol === 'https:' } catch { return false }
}

function slugificar(texto: string): string {
  return texto
    // \u0300-\u036f son los diacríticos combinados que deja NFD: "Así vivís" -> "asi
    // vivis". Se usa el escape unicode explícito y no el caracter literal para que no
    // dependa de cómo el editor guarde el archivo.
    .normalize('NFD').replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .slice(0, 80) || 'ebook'
}

// Reintenta con -2, -3... hasta encontrar uno libre. Nunca fallar la creación por un
// choque de slug es más importante que un slug prolijo: el título es lo que se edita
// después si hace falta, esto es solo la URL.
async function slugDisponible(
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  supabase: any,
  base: string,
  idAExcluir: string | null,
): Promise<string> {
  for (let intento = 1; intento <= 50; intento++) {
    const slug = intento === 1 ? base : `${base}-${intento}`
    let query = supabase.from('ebooks').select('id').eq('slug', slug)
    if (idAExcluir) query = query.neq('id', idAExcluir)
    const { data } = await query.maybeSingle()
    if (!data) return slug
  }
  // Prácticamente inalcanzable (51 ebooks con el mismo título), pero una función total
  // no puede quedar sin return.
  return `${base}-${Date.now()}`
}

export async function guardarEbook(formData: FormData) {
  const auth = await requirePsicologo()
  if ('error' in auth) return { error: auth.error }
  const { supabase } = auth

  const id = (formData.get('id') as string) || null
  const titulo = (formData.get('titulo') as string)?.trim()
  const descripcion = (formData.get('descripcion') as string)?.trim() || null
  const portada = (formData.get('portada_key') as string)?.trim() || ''
  const archivo = (formData.get('archivo_key') as string)?.trim() || ''
  const precioArsRaw = (formData.get('precio_ars') as string)?.trim()
  const linkPago = (formData.get('link_pago') as string)?.trim() || null
  const estado = formData.get('estado') === 'publicado' ? 'publicado' : 'borrador'

  if (!titulo) return { error: 'El título es obligatorio' }
  if (titulo.length > 150) return { error: 'El título es demasiado largo' }
  if (descripcion && descripcion.length > 2000) return { error: 'La descripción es demasiado larga' }

  if (!archivo || !esMarcadorR2(archivo)) return { error: 'Elegí el PDF del ebook desde el bucket' }
  if (extensionDe(archivo) !== 'pdf') return { error: 'El archivo del ebook tiene que ser un PDF' }

  if (portada) {
    if (!esMarcadorR2(portada)) return { error: 'La portada tiene que elegirse del bucket' }
    if (!EXTENSIONES_IMAGEN.includes(extensionDe(portada))) {
      return { error: `La portada tiene que ser una imagen (${EXTENSIONES_IMAGEN.join(', ')})` }
    }
  } else if (estado === 'publicado') {
    return { error: 'Para publicarlo hace falta una portada' }
  }

  const precioArs = Number(precioArsRaw)
  if (!precioArsRaw || !Number.isFinite(precioArs) || precioArs <= 0) {
    return { error: 'Ingresá un precio válido' }
  }
  const precio_centavos = Math.round(precioArs * 100)
  if (precio_centavos > PRECIO_MAXIMO_CENTAVOS) {
    return { error: 'Ese precio parece un error de tipeo — revisalo' }
  }

  if (linkPago) {
    if (linkPago.length > LINK_PAGO_MAX_LEN) return { error: 'El link de pago es demasiado largo' }
    if (!esUrlHttps(linkPago)) return { error: 'El link de pago tiene que ser una URL https válida' }
  }

  const slug = await slugDisponible(supabase, slugificar(titulo), id)
  const campos = {
    titulo, descripcion,
    portada_key: portada || null,
    archivo_key: archivo,
    precio_centavos,
    link_pago: linkPago,
    estado,
    slug,
  }

  if (id) {
    const { error } = await supabase.from('ebooks').update(campos).eq('id', id)
    if (error) return { error: error.message }
  } else {
    const { error } = await supabase.from('ebooks').insert(campos)
    if (error) return { error: error.message }
  }

  revalidatePath('/psicologo/ebooks')
  revalidatePath('/ebooks')
  revalidatePath(`/ebooks/${slug}`)
  return { success: true, slug }
}

export async function eliminarEbook(id: string) {
  const auth = await requirePsicologo()
  if ('error' in auth) return { error: auth.error }
  const { supabase } = auth

  // Si ya tiene alguna venta pagada, no se borra: perdería la trazabilidad de un ingreso
  // real (y con eso, de un comprador que espera poder volver a descargar su PDF). Pasarlo
  // a borrador lo saca de la vidriera sin tocar el historial.
  const { count } = await supabase
    .from('ordenes').select('*', { count: 'exact', head: true })
    .eq('ebook_id', id).eq('estado', 'pagada')
  if ((count ?? 0) > 0) {
    return { error: 'Este ebook tiene ventas registradas — no se puede borrar. Pasalo a borrador en cambio.' }
  }

  const { error } = await supabase.from('ebooks').delete().eq('id', id)
  if (error) return { error: error.message }

  revalidatePath('/psicologo/ebooks')
  revalidatePath('/ebooks')
  return { success: true }
}
