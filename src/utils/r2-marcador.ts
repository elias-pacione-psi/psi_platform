// Cuando se elige un archivo del bucket (picker o gestor de archivos), `url_recurso` /
// `archivo_url` deja de ser una URL real (Drive/Dropbox) y pasa a guardar esta marca en
// su lugar. No es una URI válida a propósito — nunca se manda al navegador tal cual,
// `extraerKeyDeR2` (server-only, en utils/r2.ts) la reconoce y la resuelve con
// `resolverUrlRecurso`/`firmarUrlR2` antes de renderizar. Vive en su propio archivo
// porque el picker la necesita en el cliente y utils/r2.ts es `server-only`.
// Misma convención para lecciones, biblioteca Y entregas de alumnos — una sola forma
// de decir "esto vive en R2" en todo el proyecto.
const PREFIJO_R2_KEY = 'r2key://'

export function marcarKeyR2(key: string): string {
  return `${PREFIJO_R2_KEY}${key}`
}

export function esMarcadorR2(valor: string): boolean {
  return valor.startsWith(PREFIJO_R2_KEY)
}

export function keyDeMarcadorR2(valor: string): string | null {
  return esMarcadorR2(valor) ? valor.slice(PREFIJO_R2_KEY.length) : null
}

// Carpeta reservada dentro del bucket para las entregas de alumnos (key real, sin la
// marca r2key:// — así es como vive en R2). El gestor de archivos la usa para bloquear
// escritura/borrado ahí (esa zona se administra desde Entregas, no desde Archivos), y
// alumno/actions.ts para armar la key al subir.
export const PREFIJO_ENTREGAS_R2 = 'entregas/'

// ---------------------------------------------------------------------------
// Biblioteca R2: la carpeta espejo de la sección Biblioteca
// ---------------------------------------------------------------------------
// Todo lo que se sube acá aparece solo por estar en el bucket — no hay que volver a
// cargarlo a mano desde Biblioteca. Cada subcarpeta corresponde 1 a 1 con una pestaña de
// /alumno/materiales, así que el psicólogo elige la sección poniendo el archivo en la
// carpeta que va. La carpeta raíz y las de sección son fijas: no se borran ni se
// renombran desde el gestor, porque el nombre ES la referencia que usa la sincronización.
export const PREFIJO_BIBLIOTECA_R2 = 'Biblioteca R2/'

export const SECCIONES_BIBLIOTECA_R2 = [
  { carpeta: 'Lecturas', pestana: 'Lecturas (PDF)', extensiones: ['pdf'], tipoContenido: 'r2_pdf' },
  { carpeta: 'Audios', pestana: 'Audios', extensiones: ['mp3', 'm4a', 'ogg', 'oga', 'wav'], tipoContenido: 'r2_audio' },
  { carpeta: 'Videos', pestana: 'Videos', extensiones: ['mp4', 'webm', 'mov'], tipoContenido: 'r2_video' },
  { carpeta: 'Otros', pestana: 'Otros recursos', extensiones: ['jpg', 'jpeg', 'png', 'webp', 'gif', 'svg'], tipoContenido: 'r2_imagen' },
] as const

export function esZonaBibliotecaR2(ruta: string): boolean {
  return ruta.startsWith(PREFIJO_BIBLIOTECA_R2)
}

// La raíz y las cuatro carpetas de sección. Cualquier otra carpeta que el psicólogo cree
// adentro (para ordenar por tema, por ejemplo) sí se puede borrar y renombrar.
export function esCarpetaFijaBibliotecaR2(prefijo: string): boolean {
  if (prefijo === PREFIJO_BIBLIOTECA_R2) return true
  return SECCIONES_BIBLIOTECA_R2.some((s) => prefijo === `${PREFIJO_BIBLIOTECA_R2}${s.carpeta}/`)
}

// Sección a la que pertenece una key, por la carpeta en la que está. Devuelve null para
// un archivo suelto en la raíz de Biblioteca R2: sin sección no hay pestaña donde
// mostrarlo, así que la sincronización lo ignora.
export function seccionBibliotecaR2(key: string) {
  if (!esZonaBibliotecaR2(key)) return null
  const resto = key.slice(PREFIJO_BIBLIOTECA_R2.length)
  return SECCIONES_BIBLIOTECA_R2.find((s) => resto.startsWith(`${s.carpeta}/`)) ?? null
}

export function extensionDe(nombreArchivo: string): string {
  return nombreArchivo.split('.').pop()?.toLowerCase() ?? ''
}
