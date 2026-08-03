import 'server-only'
import {
  PREFIJO_BIBLIOTECA_R2,
  SECCIONES_BIBLIOTECA_R2,
  extensionDe,
  marcarKeyR2,
  seccionBibliotecaR2,
} from '@/utils/r2-marcador'
import {
  crearCarpetaR2,
  existeEnR2,
  extraerKeyDeR2,
  listarKeysRecursivo,
  r2Configurado,
} from '@/utils/r2'
import { tipoMedioPorTipoContenido } from '@/utils/taxonomia'

// La carpeta "Biblioteca R2" del bucket es un espejo de la sección Biblioteca: lo que hay
// adentro es lo que existe como recurso, y nada más. La sincronización es en un solo
// sentido (bucket → tabla) a propósito: si fuera bidireccional habría dos lugares donde
// crear lo mismo y ninguna forma de decidir cuál gana cuando difieren.
//
// Se corre al abrir Biblioteca y después de subir/borrar en el gestor de archivos, en vez
// de por trigger: el bucket también se puede tocar desde el panel de Cloudflare, y un
// trigger de la app no vería esos cambios.

// Se llama con el cliente del usuario (ya pasó por requirePsicologo / el guard de la
// página): la policy biblioteca_all_psicologo alcanza, no hace falta service-role acá.
// eslint-disable-next-line @typescript-eslint/no-explicit-any
type ClienteSupabase = any

export function tipoContenidoBibliotecaR2(key: string): string | null {
  const seccion = seccionBibliotecaR2(key)
  if (!seccion) return null
  const extension = extensionDe(key)
  return (seccion.extensiones as readonly string[]).includes(extension) ? seccion.tipoContenido : null
}

// Título por defecto: el nombre del archivo sin extensión. El psicólogo lo puede
// renombrar después desde el gestor de archivos (renombrar el archivo renombra el recurso
// en la próxima sincronización, porque la key es la identidad).
function tituloDesdeKey(key: string): string {
  const nombre = key.split('/').pop() ?? key
  return nombre.replace(/\.[^.]+$/, '') || nombre
}

// Crea los marcadores de carpeta que falten. Idempotente: si ya existen no toca nada, así
// que se puede llamar en cada carga de /psicologo/archivos sin costo real.
export async function asegurarCarpetasBibliotecaR2(): Promise<void> {
  if (!r2Configurado()) return

  const prefijos = [
    PREFIJO_BIBLIOTECA_R2,
    ...SECCIONES_BIBLIOTECA_R2.map((s) => `${PREFIJO_BIBLIOTECA_R2}${s.carpeta}/`),
  ]

  try {
    await Promise.all(
      prefijos.map(async (p) => {
        if (!(await existeEnR2(p))) await crearCarpetaR2(p)
      }),
    )
  } catch (err) {
    // Best-effort: que falle crear una carpeta no debería tirar abajo la página entera.
    console.error('No se pudieron asegurar las carpetas de Biblioteca R2:', err)
  }
}

export async function sincronizarBibliotecaR2(
  supabase: ClienteSupabase,
): Promise<{ agregados: number; quitados: number } | { error: string }> {
  if (!r2Configurado()) return { error: 'El almacenamiento no está configurado.' }

  let keys: string[]
  try {
    keys = await listarKeysRecursivo(PREFIJO_BIBLIOTECA_R2)
  } catch (err) {
    // Si el listado falla no se borra nada: sin la foto del bucket, "no está en R2" y "no
    // pude preguntar" son indistinguibles, y confundirlos vaciaría la biblioteca entera.
    console.error('No se pudo listar Biblioteca R2:', err)
    return { error: 'No se pudo leer la carpeta Biblioteca R2 del bucket.' }
  }

  const publicables = new Map<string, string>() // key → tipo_contenido
  for (const key of keys) {
    if (key.endsWith('/')) continue
    const tipo = tipoContenidoBibliotecaR2(key)
    if (tipo) publicables.set(key, tipo)
  }

  const { data: filas, error: errorFilas } = await supabase
    .from('biblioteca_recursos')
    .select('id, titulo, tipo_contenido, url_recurso')
    .not('url_recurso', 'is', null)
  if (errorFilas) return { error: errorFilas.message }

  // Solo las filas que ya vienen de esta carpeta entran en la comparación: un recurso
  // cargado a mano (Drive, enlace externo, otra carpeta del bucket) no se toca nunca.
  const espejadas = new Map<string, { id: string; titulo: string; tipo_contenido: string }>()
  for (const fila of filas ?? []) {
    const key = extraerKeyDeR2(fila.url_recurso)
    if (key && seccionBibliotecaR2(key)) {
      espejadas.set(key, { id: fila.id, titulo: fila.titulo, tipo_contenido: fila.tipo_contenido })
    }
  }

  const nuevas = [...publicables].filter(([key]) => !espejadas.has(key))
  if (nuevas.length > 0) {
    const { error } = await supabase.from('biblioteca_recursos').insert(
      nuevas.map(([key, tipo_contenido]) => ({
        titulo: tituloDesdeKey(key),
        tipo_contenido,
        url_recurso: marcarKeyR2(key),
        tipo_medio: tipoMedioPorTipoContenido(tipo_contenido),
        origen: 'r2',
      })),
    )
    if (error) return { error: error.message }
  }

  const huerfanas = [...espejadas].filter(([key]) => !publicables.has(key)).map(([, fila]) => fila.id)
  if (huerfanas.length > 0) {
    const { error } = await supabase.from('biblioteca_recursos').delete().in('id', huerfanas)
    if (error) return { error: error.message }
  }

  // Renombrar o mover un archivo desde el gestor deja la fila apuntando a la key nueva
  // (lo hace actualizarReferenciasR2), pero con el título y el formato viejos. Como acá el
  // archivo es la fuente de verdad, se corrigen contra la key.
  const desactualizadas = [...espejadas].filter(([key, fila]) => {
    const tipo = publicables.get(key)
    return tipo && (fila.titulo !== tituloDesdeKey(key) || fila.tipo_contenido !== tipo)
  })
  for (const [key, fila] of desactualizadas) {
    const tipo_contenido = publicables.get(key)!
    await supabase
      .from('biblioteca_recursos')
      .update({
        titulo: tituloDesdeKey(key),
        tipo_contenido,
        tipo_medio: tipoMedioPorTipoContenido(tipo_contenido),
      })
      .eq('id', fila.id)
  }

  return { agregados: nuevas.length, quitados: huerfanas.length }
}
