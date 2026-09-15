// Etiquetas para mostrar tipo_medio/origen en la UI. Separado de taxonomia.ts (que es
// server-only) porque esto lo consumen componentes cliente.
export const LABEL_TIPO_MEDIO: Record<string, string> = {
  video: 'Video',
  audio: 'Audio',
  pdf: 'PDF',
  imagen: 'Imagen',
  markdown: 'Texto',
  quiz: 'Quiz',
  ejercicio: 'Ejercicios',
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
  psicologia_fe: 'Psicología y Fe',
  otro: 'Otro / no especificado',
}

// Tipo de programa. Mismos valores que el check de la migración
// 2026-08-22-programas-tipo.sql — si se agrega una opción, hay que sumarla en los dos
// lugares. Una formación se dicta con clases en vivo y un grupo; un curso asincrónico
// lo recorre el alumno solo.
// Qué vínculo pre-marcar en el diálogo de aprobación según lo que la persona eligió en el
// desplegable del formulario público. Es sólo una sugerencia para ahorrar un clic: el
// psicólogo confirma o cambia, y la decisión final siempre es suya (nadie se auto-asigna
// nada desde un formulario abierto a internet).
export const VINCULO_SUGERIDO_POR_INTERES: Record<string, { esAlumno: boolean, esPaciente: boolean }> = {
  curso: { esAlumno: true, esPaciente: false },
  formacion: { esAlumno: true, esPaciente: false },
  supervision: { esAlumno: true, esPaciente: false },
  terapia_individual: { esAlumno: false, esPaciente: true },
  psicologia_fe: { esAlumno: true, esPaciente: false },
  otro: { esAlumno: true, esPaciente: false },
}

export const LABEL_TIPO_PROGRAMA: Record<string, string> = {
  curso_asincronico: 'Curso asincrónico',
  formacion: 'Material de formación',
}
