import 'server-only'
import { createAdminClient } from '@/utils/supabase/admin'
import { keyDeMarcadorR2, seccionBibliotecaR2 } from '@/utils/r2-marcador'

// ¿Quién está usando este archivo del bucket?
//
// El mismo objeto de R2 puede estar referenciado desde varias filas a la vez, y en
// producción pasa seguido: el PDF de un ebook que se vende también figura como recurso de
// Biblioteca, y los audios de un curso están tanto en la lección como en la Biblioteca.
// Antes nada chequeaba esto antes de borrar, así que sacar "Consulta-Cero" de Biblioteca
// borraba el PDF del ebook que ya le habían pagado — sin ningún aviso, y sin forma de
// recuperarlo salvo volver a subirlo a mano.
//
// Se lee con service-role a propósito: la respuesta ("este archivo lo usa un ebook") tiene
// que ser completa aunque quien pregunta no tenga RLS para ver esa tabla. Igual el único
// que llega acá es el psicólogo, que ya pasó por requirePsicologo().

export type UsoDeArchivo = {
  key: string
  usos: string[]
}

type Fila = { url: string | null; etiqueta: string }

// Cada tabla que puede apuntar a un archivo del bucket. Si mañana se agrega otra columna
// con una marca r2key://, va acá — es el único lugar que hay que tocar para que el
// chequeo de borrado y el de renombrado la tengan en cuenta.
async function todasLasReferencias(): Promise<Fila[]> {
  const supabaseAdmin = createAdminClient()

  const [lecciones, biblioteca, ebooks, programas] = await Promise.all([
    supabaseAdmin.from('lecciones').select('titulo, url_recurso'),
    supabaseAdmin.from('biblioteca_recursos').select('titulo, url_recurso, origen'),
    supabaseAdmin.from('ebooks').select('titulo, archivo_key, portada_key'),
    supabaseAdmin.from('programas').select('titulo, portada_key'),
  ])

  const filas: Fila[] = []

  for (const l of lecciones.data ?? []) {
    filas.push({ url: l.url_recurso, etiqueta: `la lección "${l.titulo}"` })
  }
  for (const b of biblioteca.data ?? []) {
    // Las filas espejadas desde la carpeta Libros/ NO cuentan como uso: existen solo
    // porque el archivo está en el bucket, y la sincronización las borra sola cuando el
    // archivo deja de estar. Si contaran, la fila que creó el propio espejo bloquearía
    // borrar el libro desde Disco Duro — un candado que el sistema se pone a sí mismo, y
    // que obligaba a borrar desde el panel de Cloudflare para poder sacar un PDF.
    const key = b.url_recurso ? keyDeMarcadorR2(b.url_recurso) : null
    if (b.origen === 'r2' && key && seccionBibliotecaR2(key)) continue
    filas.push({ url: b.url_recurso, etiqueta: `el recurso de Biblioteca "${b.titulo}"` })
  }
  for (const e of ebooks.data ?? []) {
    filas.push({ url: e.archivo_key, etiqueta: `el ebook "${e.titulo}"` })
    filas.push({ url: e.portada_key, etiqueta: `la portada del ebook "${e.titulo}"` })
  }
  for (const p of programas.data ?? []) {
    filas.push({ url: p.portada_key, etiqueta: `la portada del programa "${p.titulo}"` })
  }

  return filas
}

/**
 * De las keys que se quieren borrar, cuáles siguen en uso y por quién.
 * Devuelve solo las que tienen al menos un uso — array vacío = se pueden borrar tranquilo.
 */
export async function usosDeKeys(keys: string[]): Promise<UsoDeArchivo[]> {
  if (keys.length === 0) return []

  const buscadas = new Set(keys)
  const porKey = new Map<string, string[]>()

  for (const fila of await todasLasReferencias()) {
    if (!fila.url) continue
    // keyDeMarcadorR2 y no extraerKeyDeR2: acá solo interesan las referencias internas al
    // bucket (marca r2key://). Una URL https de Drive o Dropbox no apunta a nada que este
    // borrado pueda romper.
    const key = keyDeMarcadorR2(fila.url)
    if (!key || !buscadas.has(key)) continue

    const previos = porKey.get(key) ?? []
    // Sin repetir: dos lecciones con el mismo título no aportan información nueva.
    if (!previos.includes(fila.etiqueta)) previos.push(fila.etiqueta)
    porKey.set(key, previos)
  }

  return [...porKey.entries()].map(([key, usos]) => ({ key, usos }))
}

/**
 * Las keys de `keys` que NO están referenciadas por nadie — o sea, las que se pueden
 * borrar del bucket sin romper nada. Se usa al borrar una lección o un recurso de
 * Biblioteca: la fila ya no está, pero el archivo puede seguir siendo de otro.
 */
export async function keysHuerfanas(keys: string[]): Promise<string[]> {
  const enUso = new Set((await usosDeKeys(keys)).map((u) => u.key))
  return keys.filter((k) => !enUso.has(k))
}

/**
 * Mensaje de error listo para mostrar cuando el borrado se bloquea, o null si no hay
 * nada que bloquear. Nombra qué lo está usando: "no se puede borrar" a secas obliga a
 * adivinar, y adivinar termina en borrarlo desde el panel de Cloudflare.
 */
export async function errorSiEstanEnUso(keys: string[]): Promise<string | null> {
  const usos = await usosDeKeys(keys)
  if (usos.length === 0) return null

  const detalle = usos
    .slice(0, 3)
    .map((u) => {
      const nombre = u.key.split('/').pop() || u.key
      return `"${nombre}" (lo usa ${u.usos.join(', ')})`
    })
    .join('; ')

  const resto = usos.length > 3 ? ` y ${usos.length - 3} archivo(s) más` : ''

  return (
    `No se puede borrar: ${detalle}${resto}. `
    + 'Sacá primero esa referencia (desde Programas, Biblioteca o ebooks) y después borrá el archivo.'
  )
}
