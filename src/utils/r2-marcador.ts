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
// Libros: la carpeta espejo de la sección Biblioteca
// ---------------------------------------------------------------------------
// Todo PDF que se sube acá aparece en Biblioteca solo por estar en el bucket — no hay
// que volver a cargarlo a mano. La carpeta raíz es fija: no se borra ni se renombra
// desde el gestor, porque el nombre ES la referencia que usa la sincronización.
//
// Antes esto era "Biblioteca R2/" con cuatro subcarpetas de sección (Lecturas, Audios,
// Videos, Otros), una por pestaña de /alumno/materiales. Se simplificó a solo libros
// (2026-08-22): los audios eran material de curso duplicado acá, y las imágenes eran
// portadas de ebook — ambas cosas ya viven donde corresponde (junto al curso y en
// Libros/portadas/), así que la biblioteca dejó de ser un cajón mezclado.
export const PREFIJO_BIBLIOTECA_R2 = 'Libros/'

export const SECCION_LIBROS = {
  pestana: 'Libros',
  extensiones: ['pdf'],
  tipoContenido: 'r2_pdf',
} as const

// Subcarpetas de organización dentro de Libros/. NO publican nada por sí solas: al alumno
// solo llegan los PDF sueltos en la raíz (ver seccionBibliotecaR2). Existen para que el
// psicólogo tenga dónde dejar audios, videos y material suelto sin mezclarlo con los
// libros, y se crean siempre para que se vean en Disco Duro aunque estén vacías.
export const CARPETAS_ORGANIZACION_BIBLIOTECA = ['Audios', 'Videos', 'Otros'] as const

export function esZonaBibliotecaR2(ruta: string): boolean {
  return ruta.startsWith(PREFIJO_BIBLIOTECA_R2)
}

// La raíz y las carpetas de organización: son parte de la estructura, no material que el
// psicólogo cargó. Cualquier otra subcarpeta que cree él sí se puede borrar y renombrar.
export function esCarpetaFijaBibliotecaR2(prefijo: string): boolean {
  if (prefijo === PREFIJO_BIBLIOTECA_R2) return true
  return CARPETAS_ORGANIZACION_BIBLIOTECA.some((c) => prefijo === `${PREFIJO_BIBLIOTECA_R2}${c}/`)
}

// Un archivo se publica como libro si es un PDF que está SUELTO en la raíz de Libros/.
// Lo que cuelga de una subcarpeta (portadas/, fuente/) queda fuera a propósito: son
// insumos del ebook, no material para el alumno.
export function seccionBibliotecaR2(key: string) {
  if (!esZonaBibliotecaR2(key)) return null
  const resto = key.slice(PREFIJO_BIBLIOTECA_R2.length)
  if (!resto || resto.includes('/')) return null
  return SECCION_LIBROS.extensiones.includes(extensionDe(resto) as 'pdf') ? SECCION_LIBROS : null
}

export function extensionDe(nombreArchivo: string): string {
  return nombreArchivo.split('.').pop()?.toLowerCase() ?? ''
}
