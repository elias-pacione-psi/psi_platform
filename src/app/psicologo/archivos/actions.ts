'use server'

import { revalidatePath } from 'next/cache'
import { requirePsicologo } from '@/utils/supabase/guards'
import {
  listarR2,
  listarKeysRecursivo,
  crearCarpetaR2,
  borrarDeR2,
  firmarSubidaR2,
  firmarUrlR2,
  firmarDescargaR2,
  renombrarR2,
  existeEnR2,
  extraerKeyDeR2,
  calcularUsoTotalR2,
  r2Configurado,
  type ListadoR2,
} from '@/utils/r2'
import {
  marcarKeyR2,
  esCarpetaFijaBibliotecaR2,
  esZonaBibliotecaR2,
  extensionDe,
  seccionBibliotecaR2,
  PREFIJO_BIBLIOTECA_R2,
  PREFIJO_ENTREGAS_R2,
  SECCIONES_BIBLIOTECA_R2,
} from '@/utils/r2-marcador'
import { sincronizarBibliotecaR2 } from '@/utils/supabase/biblioteca-r2'
import { tipoContenidoPorExtension } from '@/utils/medio-archivo'
import { tipoMedioPorTipoContenido } from '@/utils/taxonomia'

// El layout de /psicologo ya redirige a quien no sea psicólogo, pero eso es gating de
// render, no un límite de seguridad: una server action es un POST que cualquiera puede
// mandar sin pasar por la UI. Por eso cada action de acá vuelve a pedir requirePsicologo().

// Sin `export`: un archivo 'use server' solo puede exportar funciones async, porque cada
// export se convierte en un endpoint POST. Exportar una constante rompe el módulo entero.
const TAMANO_MAXIMO_MATERIAL_BYTES = 500 * 1024 * 1024

// Los materiales son variados (PDFs, videos, audio, imágenes, documentos de referencia).
// Sigue siendo allowlist: el Content-Type se firma, así que lo que no esté acá
// directamente no se puede escribir en el bucket.
const TIPOS_MATERIAL: Record<string, string[]> = {
  'application/pdf': ['pdf'],
  'text/plain': ['txt'],
  'text/markdown': ['md'],
  'image/jpeg': ['jpg', 'jpeg'],
  'image/png': ['png'],
  'image/webp': ['webp'],
  'image/gif': ['gif'],
  'image/svg+xml': ['svg'],
  'audio/mpeg': ['mp3'],
  'audio/mp4': ['m4a'],
  'audio/x-m4a': ['m4a'],
  'audio/ogg': ['ogg', 'oga'],
  'audio/wav': ['wav'],
  'video/mp4': ['mp4'],
  'video/webm': ['webm'],
  'video/quicktime': ['mov'],
  'application/msword': ['doc'],
  'application/vnd.openxmlformats-officedocument.wordprocessingml.document': ['docx'],
  'application/vnd.ms-powerpoint': ['ppt'],
  'application/vnd.openxmlformats-officedocument.presentationml.presentation': ['pptx'],
}

// Un prefijo/key viene del cliente (la navegación, el nombre que escribe el psicólogo).
// En S3 una key es un string cualquiera, así que no hay traversal de filesystem, pero sí
// conviene rechazar lo que rompa la UI o genere keys imposibles de volver a nombrar.
function prefijoValido(prefijo: string): boolean {
  if (prefijo === '') return true
  if (!prefijo.endsWith('/')) return false
  if (prefijo.startsWith('/') || prefijo.includes('//')) return false
  if (prefijo.split('/').includes('..')) return false

  return !/[\x00-\x1f]/.test(prefijo)
}

function keyValida(key: string): boolean {
  if (!key || key.endsWith('/')) return false
  if (key.startsWith('/') || key.includes('//')) return false
  if (key.split('/').includes('..')) return false

  return !/[\x00-\x1f]/.test(key)
}

// Las entregas de alumnos viven en el mismo bucket. Se pueden mirar y descargar desde
// acá (es material del psicólogo igual), pero no escribir ni borrar: la DB guarda esa
// key en entregas.archivo_url, así que borrar el objeto por afuera dejaría la fila
// apuntando a algo que ya no existe. Para eso está /psicologo/entregas.
function esZonaDeEntregas(ruta: string): boolean {
  return ruta.startsWith(PREFIJO_ENTREGAS_R2)
}

// "Biblioteca R2" y sus carpetas de sección son la referencia que usa la sincronización
// con la sección Biblioteca: si se borran o se renombran, los recursos que colgaban de
// ahí dejan de tener sección y desaparecen del lado del alumno. Adentro se sube y se
// borra con normalidad; lo que está congelado es la estructura, no el contenido.
function errorSiCarpetaFijaBiblioteca(prefijo: string): string | null {
  return esCarpetaFijaBibliotecaR2(prefijo)
    ? 'Esta carpeta está enlazada con la sección Biblioteca: no se puede borrar ni renombrar.'
    : null
}

// Un archivo que no encaja en ninguna sección quedaría en el bucket sin aparecer nunca
// del lado del alumno — mejor rechazarlo al subir que dejarlo invisible.
function errorSubidaEnBiblioteca(prefijo: string, nombreArchivo: string): string | null {
  if (!esZonaBibliotecaR2(prefijo)) return null

  const seccion = seccionBibliotecaR2(`${prefijo}${nombreArchivo}`)
  if (!seccion) {
    return `Elegí una de las carpetas de sección (${SECCIONES_BIBLIOTECA_R2.map((s) => s.carpeta).join(', ')}): los archivos sueltos en la raíz no se publican.`
  }

  const extension = extensionDe(nombreArchivo)
  if (!(seccion.extensiones as readonly string[]).includes(extension)) {
    return `"${seccion.carpeta}" acepta ${seccion.extensiones.join(', ')}. Un archivo .${extension} va en otra sección.`
  }

  return null
}

export async function listarCarpeta(prefijo: string): Promise<{ error: string } | ListadoR2> {
  const auth = await requirePsicologo()
  if ('error' in auth) return { error: auth.error }

  if (!r2Configurado()) return { error: 'El almacenamiento no está configurado.' }
  if (!prefijoValido(prefijo)) return { error: 'Ruta inválida.' }

  try {
    return await listarR2(prefijo)
  } catch (err) {
    console.error('No se pudo listar R2:', err)
    return { error: 'No se pudo leer el contenido del bucket.' }
  }
}

export async function pedirSubidaMaterial(
  prefijo: string,
  nombreArchivo: string,
  contentType: string,
  tamanoBytes: number,
) {
  const auth = await requirePsicologo()
  if ('error' in auth) return { error: auth.error }

  if (!r2Configurado()) return { error: 'El almacenamiento no está configurado.' }
  if (!prefijoValido(prefijo)) return { error: 'Ruta inválida.' }
  if (esZonaDeEntregas(prefijo)) {
    return { error: 'No se puede subir dentro de las entregas de alumnos.' }
  }

  const permitidas = TIPOS_MATERIAL[contentType.toLowerCase()]
  if (!permitidas) {
    return { error: `No se aceptan archivos de tipo "${contentType || 'desconocido'}".` }
  }

  if (tamanoBytes > TAMANO_MAXIMO_MATERIAL_BYTES) {
    return { error: `El archivo supera el máximo de ${TAMANO_MAXIMO_MATERIAL_BYTES / 1024 / 1024} MB.` }
  }

  // Se conserva el nombre original: acá el nombre ES la forma en que el psicólogo
  // encuentra el archivo después. Solo se limpia lo que rompería la key.
  const nombre = nombreArchivo.replace(/[/\\]/g, '_').replace(/^\.+/, '').trim()
  if (!nombre) return { error: 'Nombre de archivo inválido.' }

  const extension = extensionDe(nombre)
  if (!permitidas.includes(extension)) {
    return { error: `La extensión ".${extension}" no coincide con el tipo ${contentType}.` }
  }

  const errorBiblioteca = errorSubidaEnBiblioteca(prefijo, nombre)
  if (errorBiblioteca) return { error: errorBiblioteca }

  const key = `${prefijo}${nombre}`
  if (!keyValida(key)) return { error: 'Nombre de archivo o ruta inválida.' }

  try {
    const url = await firmarSubidaR2(key, contentType)
    return { url, key }
  } catch (err) {
    console.error('No se pudo firmar la subida del material:', err)
    return { error: 'No se pudo preparar la subida. Intentá de nuevo.' }
  }
}

// Para abrir en una pestaña nueva y dejar que el navegador decida cómo mostrarlo (PDF,
// imagen, video, audio con su visor nativo).
export async function pedirVistaPrevia(key: string) {
  const auth = await requirePsicologo()
  if ('error' in auth) return { error: auth.error }

  if (!r2Configurado()) return { error: 'El almacenamiento no está configurado.' }
  if (!keyValida(key)) return { error: 'Archivo inválido.' }

  try {
    return { url: await firmarUrlR2(key) }
  } catch (err) {
    console.error('No se pudo firmar la vista previa:', err)
    return { error: 'No se pudo generar el link de vista previa.' }
  }
}

// A diferencia de pedirVistaPrevia, esta fuerza la descarga a disco sin importar el
// tipo — firmarDescargaR2 manda Content-Disposition: attachment, así que ni un PDF ni
// una imagen se navegan en el navegador.
export async function pedirDescargaArchivo(key: string) {
  const auth = await requirePsicologo()
  if ('error' in auth) return { error: auth.error }

  if (!r2Configurado()) return { error: 'El almacenamiento no está configurado.' }
  if (!keyValida(key)) return { error: 'Archivo inválido.' }

  const nombreArchivo = key.split('/').pop() ?? key

  try {
    return { url: await firmarDescargaR2(key, nombreArchivo) }
  } catch (err) {
    console.error('No se pudo firmar la descarga:', err)
    return { error: 'No se pudo generar el link de descarga.' }
  }
}

export async function obtenerUsoTotal(): Promise<{ error: string } | { bytes: number }> {
  const auth = await requirePsicologo()
  if ('error' in auth) return { error: auth.error }

  if (!r2Configurado()) return { error: 'El almacenamiento no está configurado.' }

  try {
    return { bytes: await calcularUsoTotalR2() }
  } catch (err) {
    console.error('No se pudo calcular el uso del bucket:', err)
    return { error: 'No se pudo calcular el uso del bucket.' }
  }
}

export async function crearCarpeta(prefijoPadre: string, nombre: string) {
  const auth = await requirePsicologo()
  if ('error' in auth) return { error: auth.error }

  if (!r2Configurado()) return { error: 'El almacenamiento no está configurado.' }
  if (!prefijoValido(prefijoPadre)) return { error: 'Ruta inválida.' }

  const limpio = nombre.replace(/[/\\]/g, '').trim()
  if (!limpio) return { error: 'Poné un nombre para la carpeta.' }

  const prefijo = `${prefijoPadre}${limpio}/`
  if (!prefijoValido(prefijo)) return { error: 'Nombre de carpeta inválido.' }
  if (esZonaDeEntregas(prefijo)) {
    return { error: 'No se puede crear carpetas dentro de las entregas de alumnos.' }
  }
  // Adentro de una sección sí (para ordenar por tema); al lado de las secciones no, porque
  // no habría pestaña del lado del alumno donde mostrar lo que se guarde ahí.
  if (prefijoPadre === PREFIJO_BIBLIOTECA_R2) {
    return { error: 'Las secciones de Biblioteca son fijas. Creá la carpeta dentro de una de ellas.' }
  }

  try {
    await crearCarpetaR2(prefijo)
    return { success: true }
  } catch (err) {
    console.error('No se pudo crear la carpeta:', err)
    return { error: 'No se pudo crear la carpeta.' }
  }
}

// Cuenta qué hay adentro de una carpeta antes de ofrecerla para borrar. Va separado del
// borrado para que el diálogo pueda decir cuántos archivos se lleva puestos.
export async function contarContenidoCarpeta(prefijo: string) {
  const auth = await requirePsicologo()
  if ('error' in auth) return { error: auth.error }

  if (!r2Configurado()) return { error: 'El almacenamiento no está configurado.' }
  if (!prefijoValido(prefijo) || prefijo === '') return { error: 'Ruta inválida.' }

  try {
    const keys = await listarKeysRecursivo(prefijo)
    return { archivos: keys.filter((k) => !k.endsWith('/')).length }
  } catch (err) {
    console.error('No se pudo contar el contenido de la carpeta:', err)
    return { error: 'No se pudo leer el contenido de la carpeta.' }
  }
}

export async function borrarCarpeta(prefijo: string) {
  const auth = await requirePsicologo()
  if ('error' in auth) return { error: auth.error }

  if (!r2Configurado()) return { error: 'El almacenamiento no está configurado.' }
  // Sin el `!== ''` un prefijo vacío pasaría la validación y borraría el bucket entero.
  if (!prefijoValido(prefijo) || prefijo === '') return { error: 'Ruta inválida.' }
  if (esZonaDeEntregas(prefijo)) {
    return { error: 'Las entregas de alumnos se gestionan desde Entregas.' }
  }
  const errorFija = errorSiCarpetaFijaBiblioteca(prefijo)
  if (errorFija) return { error: errorFija }

  try {
    const keys = await listarKeysRecursivo(prefijo)
    if (keys.length === 0) return { error: 'Esa carpeta ya no existe.' }
    if (keys.some(esZonaDeEntregas)) {
      return { error: 'Esa carpeta contiene entregas de alumnos.' }
    }

    await borrarDeR2(keys)
    if (esZonaBibliotecaR2(prefijo)) await sincronizarBiblioteca()
    return { success: true, borrados: keys.filter((k) => !k.endsWith('/')).length }
  } catch (err) {
    console.error('No se pudo borrar la carpeta:', err)
    return { error: 'No se pudo borrar la carpeta.' }
  }
}

// Vuelve a alinear la sección Biblioteca con lo que hay en la carpeta "Biblioteca R2" del
// bucket. La llaman las acciones que tocan esa zona y el cliente después de subir; la
// sección Biblioteca también la corre al abrirse, para tomar lo que se haya subido desde
// el panel de Cloudflare.
export async function sincronizarBiblioteca() {
  const auth = await requirePsicologo()
  if ('error' in auth) return { error: auth.error }

  const res = await sincronizarBibliotecaR2(auth.supabase)
  if ('error' in res) return res

  revalidatePath('/psicologo/biblioteca')
  revalidatePath('/alumno/materiales')
  return res
}

// Actualiza las referencias de lecciones/biblioteca que apuntaban a `keyVieja`, para que
// no queden huérfanas tras un rename/move. Se compara con extraerKeyDeR2() (no un .eq()
// literal) porque entiende la marca r2key:// sin importar de dónde salió.
async function actualizarReferenciasR2(
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  supabase: any,
  keyVieja: string,
  keyNueva: string,
): Promise<number> {
  const marcaNueva = marcarKeyR2(keyNueva)
  const [{ data: lecs }, { data: recs }] = await Promise.all([
    supabase.from('lecciones').select('id, url_recurso').not('url_recurso', 'is', null),
    supabase.from('biblioteca_recursos').select('id, url_recurso').not('url_recurso', 'is', null),
  ])

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const idsLecciones = (lecs ?? []).filter((r: any) => extraerKeyDeR2(r.url_recurso) === keyVieja).map((r: any) => r.id)
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const idsRecursos = (recs ?? []).filter((r: any) => extraerKeyDeR2(r.url_recurso) === keyVieja).map((r: any) => r.id)

  await Promise.all([
    idsLecciones.length > 0
      ? supabase.from('lecciones').update({ url_recurso: marcaNueva, origen: 'r2' }).in('id', idsLecciones)
      : Promise.resolve(),
    idsRecursos.length > 0
      ? supabase.from('biblioteca_recursos').update({ url_recurso: marcaNueva, origen: 'r2' }).in('id', idsRecursos)
      : Promise.resolve(),
  ])

  return idsLecciones.length + idsRecursos.length
}

export async function renombrarArchivo(key: string, nuevoNombre: string) {
  const auth = await requirePsicologo()
  if ('error' in auth) return { error: auth.error }
  const { supabase } = auth

  if (!r2Configurado()) return { error: 'El almacenamiento no está configurado.' }
  if (!keyValida(key)) return { error: 'Archivo inválido.' }
  if (esZonaDeEntregas(key)) return { error: 'Las entregas de alumnos no se pueden renombrar.' }

  const limpio = nuevoNombre.replace(/[/\\]/g, '_').trim()
  if (!limpio) return { error: 'Poné un nombre para el archivo.' }

  const carpeta = key.slice(0, key.lastIndexOf('/') + 1)
  const keyNueva = `${carpeta}${limpio}`
  if (!keyValida(keyNueva)) return { error: 'Nombre inválido.' }
  if (keyNueva === key) return { success: true, keyNueva }

  // Cambiar la extensión acá puede sacar al archivo de su sección de biblioteca (y con
  // eso, de la vista del alumno) sin que nadie lo note. Se valida igual que al subir.
  const errorBiblioteca = errorSubidaEnBiblioteca(carpeta, limpio)
  if (errorBiblioteca) return { error: errorBiblioteca }

  if (await existeEnR2(keyNueva)) {
    return { error: 'Ya existe un archivo con ese nombre en esta carpeta.' }
  }

  try {
    await renombrarR2(key, keyNueva)
  } catch (err) {
    console.error('No se pudo renombrar en R2:', err)
    return { error: 'No se pudo renombrar el archivo.' }
  }

  const referenciasActualizadas = await actualizarReferenciasR2(supabase, key, keyNueva)
  // El título del recurso de biblioteca sale del nombre del archivo: sin esto quedaría
  // con el nombre viejo hasta la próxima vez que se abra Biblioteca.
  if (esZonaBibliotecaR2(keyNueva)) await sincronizarBiblioteca()
  return { success: true, keyNueva, referenciasActualizadas }
}

// A diferencia de "Agregar lección" en el módulo, acá no hay un dropdown previo donde
// el psicólogo elija el tipo de contenido: se infiere de la extensión (ver
// utils/medio-archivo.ts).
export async function asignarComoLeccion(key: string, moduloId: string, titulo: string) {
  const auth = await requirePsicologo()
  if ('error' in auth) return { error: auth.error }
  const { supabase } = auth

  if (!r2Configurado()) return { error: 'El almacenamiento no está configurado.' }
  if (!keyValida(key)) return { error: 'Archivo inválido.' }
  if (esZonaDeEntregas(key)) return { error: 'Las entregas de alumnos no se pueden asignar como material.' }

  const nombreLimpio = titulo.trim()
  if (!nombreLimpio) return { error: 'Poné un nombre para el material.' }
  if (!moduloId) return { error: 'Elegí un módulo.' }

  const nombreArchivo = key.split('/').pop() ?? key
  const tipoContenido = tipoContenidoPorExtension(nombreArchivo)
  if (!tipoContenido) {
    return { error: 'Este tipo de archivo no se puede asignar directamente. Usá "Agregar lección" desde el módulo.' }
  }

  const { data: modulo } = await supabase.from('modulos').select('id, programa_id').eq('id', moduloId).maybeSingle()
  if (!modulo) return { error: 'Ese módulo no existe.' }

  const { data: ultima } = await supabase
    .from('lecciones').select('orden').eq('modulo_id', moduloId)
    .order('orden', { ascending: false }).limit(1).maybeSingle()
  const orden = (ultima?.orden ?? -1) + 1

  const { error } = await supabase.from('lecciones').insert({
    programa_id: modulo.programa_id,
    modulo_id: moduloId,
    titulo: nombreLimpio,
    tipo_contenido: tipoContenido,
    url_recurso: marcarKeyR2(key),
    orden,
    tipo_medio: tipoMedioPorTipoContenido(tipoContenido),
    // Siempre 'r2': esta action solo crea materiales apuntando a un archivo del bucket.
    origen: 'r2',
  })
  if (error) return { error: error.message }

  revalidatePath(`/psicologo/programas/${modulo.programa_id}`)
  return { success: true }
}

export async function borrarObjetos(keys: string[]) {
  const auth = await requirePsicologo()
  if ('error' in auth) return { error: auth.error }

  if (!r2Configurado()) return { error: 'El almacenamiento no está configurado.' }
  if (keys.length === 0) return { error: 'No se seleccionó nada para borrar.' }
  if (keys.some((k) => !keyValida(k))) return { error: 'Selección inválida.' }
  if (keys.some(esZonaDeEntregas)) {
    return { error: 'Las entregas de alumnos se gestionan desde Entregas.' }
  }

  try {
    await borrarDeR2(keys)
    if (keys.some(esZonaBibliotecaR2)) await sincronizarBiblioteca()
    return { success: true, borrados: keys.length }
  } catch (err) {
    console.error('No se pudieron borrar objetos de R2:', err)
    return { error: 'No se pudieron borrar los archivos.' }
  }
}

export async function borrarMultiples(seleccion: { id: string; tipo: 'archivo' | 'carpeta' }[]) {
  const auth = await requirePsicologo()
  if ('error' in auth) return { error: auth.error }

  if (!r2Configurado()) return { error: 'El almacenamiento no está configurado.' }
  if (seleccion.length === 0) return { error: 'No se seleccionó nada para borrar.' }

  try {
    const keysParaBorrar: string[] = []

    for (const item of seleccion) {
      if (esZonaDeEntregas(item.id)) continue
      if (esCarpetaFijaBibliotecaR2(item.id)) continue

      if (item.tipo === 'archivo') {
        if (keyValida(item.id)) keysParaBorrar.push(item.id)
      } else if (prefijoValido(item.id) && item.id !== '') {
        const folderKeys = await listarKeysRecursivo(item.id)
        keysParaBorrar.push(...folderKeys)
      }
    }

    if (keysParaBorrar.length === 0) return { error: 'No hay nada válido para borrar.' }

    const uniqueKeys = Array.from(new Set(keysParaBorrar))
    await borrarDeR2(uniqueKeys)
    if (uniqueKeys.some(esZonaBibliotecaR2)) await sincronizarBiblioteca()

    return { success: true, borrados: uniqueKeys.length }
  } catch (err) {
    console.error('No se pudieron borrar múltiples objetos de R2:', err)
    return { error: 'No se pudieron borrar los elementos seleccionados.' }
  }
}

export async function renombrarCarpeta(prefijo: string, nuevoNombre: string) {
  const auth = await requirePsicologo()
  if ('error' in auth) return { error: auth.error }
  const { supabase } = auth

  if (!r2Configurado()) return { error: 'El almacenamiento no está configurado.' }
  if (!prefijoValido(prefijo) || prefijo === '') return { error: 'Carpeta inválida.' }
  if (esZonaDeEntregas(prefijo)) return { error: 'Las entregas de alumnos no se pueden renombrar.' }
  const errorFijaRename = errorSiCarpetaFijaBiblioteca(prefijo)
  if (errorFijaRename) return { error: errorFijaRename }

  const limpio = nuevoNombre.replace(/[/\\]/g, '_').trim()
  if (!limpio) return { error: 'Poné un nombre para la carpeta.' }

  const tramos = prefijo.split('/').filter(Boolean)
  tramos.pop()
  const carpetaPadre = tramos.length > 0 ? tramos.join('/') + '/' : ''
  const prefijoNuevo = `${carpetaPadre}${limpio}/`

  if (!prefijoValido(prefijoNuevo)) return { error: 'Nombre inválido.' }
  if (prefijoNuevo === prefijo) return { success: true, prefijoNuevo }

  try {
    const keys = await listarKeysRecursivo(prefijo)
    if (keys.length === 0) return { error: 'Esa carpeta ya no existe.' }

    const keysNuevasCheck = await listarKeysRecursivo(prefijoNuevo)
    if (keysNuevasCheck.length > 0) return { error: 'Ya existe una carpeta con ese nombre.' }

    let referenciasActualizadas = 0
    for (let i = 0; i < keys.length; i += 20) {
      const tanda = keys.slice(i, i + 20)
      await Promise.all(
        tanda.map(async (keyVieja) => {
          const keyNueva = prefijoNuevo + keyVieja.slice(prefijo.length)
          await renombrarR2(keyVieja, keyNueva)
          if (!keyVieja.endsWith('/')) {
            referenciasActualizadas += await actualizarReferenciasR2(supabase, keyVieja, keyNueva)
          }
        }),
      )
    }

    if (esZonaBibliotecaR2(prefijoNuevo) || esZonaBibliotecaR2(prefijo)) await sincronizarBiblioteca()
    return { success: true, prefijoNuevo, referenciasActualizadas }
  } catch (err) {
    console.error('No se pudo renombrar la carpeta:', err)
    return { error: 'No se pudo renombrar la carpeta.' }
  }
}
