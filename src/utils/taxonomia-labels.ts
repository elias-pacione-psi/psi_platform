// Etiquetas para mostrar tipo_medio/origen en la UI. Separado de taxonomia.ts (que es
// server-only) porque esto lo consumen componentes cliente.
export const LABEL_TIPO_MEDIO: Record<string, string> = {
  video: 'Video',
  audio: 'Audio',
  pdf: 'PDF',
  imagen: 'Imagen',
  markdown: 'Texto',
  quiz: 'Quiz',
  entrega: 'Entrega',
  enlace: 'Enlace',
}

export const LABEL_ORIGEN: Record<string, string> = {
  r2: 'R2',
  drive: 'Drive',
  dropbox: 'Dropbox',
  supabase: 'Supabase',
  externo: 'Externo',
}

// Qué eligió la persona en el desplegable del formulario público de Consultas
// (solicitudes_registro.interes). Mismos valores que el check de la migración
// 2026-08-04-ebooks-y-desplegable-interes.sql — si se agrega una opción, hay que
// sumarla en los dos lugares.
export const LABEL_INTERES: Record<string, string> = {
  curso: 'Curso asincrónico',
  formacion: 'Formación con clases en vivo',
  supervision: 'Supervisión',
  terapia_individual: 'Terapia individual',
  otro: 'Otro / no especificado',
}
