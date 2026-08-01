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
