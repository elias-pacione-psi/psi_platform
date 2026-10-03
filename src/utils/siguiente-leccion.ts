// Orden de recorrido del curso para el botón "Siguiente lección". Tiene que coincidir con
// lo que el alumno ve en la página del programa (alumno/programas/[programaId]/page.tsx):
// los módulos en su orden, las lecciones de cada módulo en el suyo, y las entregas fuera
// de los módulos — ahí se muestran aparte, como "Trabajo Final", así que van al final.
// Quien llama pasa `modulos` y `lecciones` ya ordenados (orden, created_at) por la query.

type ModuloOrdenado = { id: string }
type LeccionOrdenada = { id: string, titulo: string, modulo_id: string, tipo_contenido: string }

export function siguienteLeccion(
  modulos: ModuloOrdenado[],
  lecciones: LeccionOrdenada[],
  leccionActualId: string,
): { id: string, titulo: string } | null {
  const recorrido = [
    ...modulos.flatMap(m => lecciones.filter(l => l.modulo_id === m.id && l.tipo_contenido !== 'entrega')),
    ...lecciones.filter(l => l.tipo_contenido === 'entrega'),
  ]
  const i = recorrido.findIndex(l => l.id === leccionActualId)
  return i === -1 ? null : recorrido[i + 1] ?? null
}
