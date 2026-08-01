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
