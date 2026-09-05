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
// Todo archivo publicable (pdf/audio/video) que está en esta carpeta —en cualquier
// subcarpeta— aparece en Biblioteca solo por estar en el bucket, sin cargarlo a mano.
// La carpeta raíz es fija: no se borra ni se renombra desde el gestor, porque el nombre
// ES la referencia que usa la sincronización.
//
// Historia: primero fue "Biblioteca R2/" con cuatro subcarpetas de sección, después se
// simplificó a "Libros/" con solo PDFs sueltos en la raíz (2026-08-22). Esa regla de
// "solo la raíz" rompió la biblioteca cuando los PDFs se ordenaron en una subcarpeta
// (la sincronización los dejó de ver y borró los recursos con sus asignaciones), y el
// nombre no coincidía con la carpeta que el psicólogo veía en el bucket. Desde el
// 2026-09-05 vuelve a ser "Biblioteca R2/", única carpeta espejo, y publica en cualquier
// profundidad: organizar en subcarpetas ya no saca el material de la biblioteca. En esa
// misma fecha se movió todo lo que había en "Libros/" acá adentro y se borró esa carpeta
// del bucket, así que hay un solo lugar donde vive el material de biblioteca.
export const PREFIJO_BIBLIOTECA_R2 = 'Biblioteca R2/'

// Lo que se publica según su extensión, sin importar en qué subcarpeta esté. Las imágenes
// y los documentos de Office quedan fuera a propósito: en esta carpeta suelen vivir como
// insumos (portadas/ y fuente/ de los ebooks), no como material para el alumno.
export const SECCIONES_BIBLIOTECA_R2 = [
  { nombre: 'Libros', extensiones: ['pdf'], tipoContenido: 'r2_pdf' },
  { nombre: 'Audios', extensiones: ['mp3', 'm4a', 'ogg', 'oga', 'wav'], tipoContenido: 'r2_audio' },
  { nombre: 'Videos', extensiones: ['mp4', 'webm', 'mov'], tipoContenido: 'r2_video' },
] as const

// Subcarpetas de organización dentro de Biblioteca R2/. NO publican nada por sí solas:
// publica lo que hay adentro, según su extensión (ver seccionBibliotecaR2). Existen para
// que el psicólogo tenga el material ordenado desde el día uno, y se crean siempre para
// que se vean en Disco Duro aunque estén vacías. "Libros" es donde vive lo que antes
// estaba en la carpeta "Libros/" de la raíz del bucket (incluidos los PDF que se venden
// como ebooks). "Herramientas de Terapia" es el material puntual que el psicólogo le
// entrega a un paciente: libros de trabajo, guías, fichas.
export const CARPETAS_ORGANIZACION_BIBLIOTECA = ['Libros', 'Audios', 'Videos', 'Herramientas de Terapia', 'Otros'] as const

export function esZonaBibliotecaR2(ruta: string): boolean {
  return ruta.startsWith(PREFIJO_BIBLIOTECA_R2)
}

// La raíz y las carpetas de organización: son parte de la estructura, no material que el
// psicólogo cargó. Cualquier otra subcarpeta que cree él sí se puede borrar y renombrar.
export function esCarpetaFijaBibliotecaR2(prefijo: string): boolean {
  if (prefijo === PREFIJO_BIBLIOTECA_R2) return true
  return CARPETAS_ORGANIZACION_BIBLIOTECA.some((c) => prefijo === `${PREFIJO_BIBLIOTECA_R2}${c}/`)
}

// La sección en la que se publica un archivo de la carpeta espejo, o null si no se
// publica (extensión sin sección, ej. png/docx). Vale cualquier profundidad: lo que
// cuenta es la extensión, no dónde lo ordenó el psicólogo.
export function seccionBibliotecaR2(key: string) {
  if (!esZonaBibliotecaR2(key) || key.endsWith('/')) return null
  const extension = extensionDe(key)
  return SECCIONES_BIBLIOTECA_R2.find((s) => (s.extensiones as readonly string[]).includes(extension)) ?? null
}

export function extensionDe(nombreArchivo: string): string {
  return nombreArchivo.split('.').pop()?.toLowerCase() ?? ''
}
