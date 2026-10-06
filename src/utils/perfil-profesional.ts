import { Video, Users, MapPin } from 'lucide-react'

// Perfil profesional de Elias — tomado de su listado público en Psychology Today
// (colegiatura, especialidades y enfoques declarados ahí). Lo comparten la introducción
// "Sobre Elías" de la landing y la página /quien-soy, que lo desarrolla: un solo lugar
// donde corregirlo cuando cambie algo.
//
// Vive acá y no en page.tsx porque Next no deja exportar datos arbitrarios desde una
// página (sólo `metadata`, `revalidate` y compañía).

// Foto de Elias que usan la landing y /quien-soy (componente FotoElias). Es una charla
// presencial, provisoria: para cambiarla alcanza con reemplazar el archivo de public/ y,
// si cambian las proporciones, ajustar width/height acá — las dos páginas la toman de este
// único lugar.
export const FOTO_PERFIL = {
  src: '/elias-charla.jpg',
  alt: 'Elías dando una charla presencial, micrófono en mano',
  width: 758,
  height: 1127,
}

// Año en que se recibió. Los años de ejercicio se calculan a partir de ahí en vez de
// escribirse a mano, para que "más de 12 años" no quede viejo en cada cumpleaños del título.
export const ANIO_TITULO = 2014

export function aniosDeEjercicio(): number {
  return new Date().getFullYear() - ANIO_TITULO
}

// Especialidades declaradas en el perfil. Quedan afuera a propósito las dos más delicadas
// del listado original (ideación suicida y psicosis): en una página pública de presentación
// se prefiere mostrar el área general y que el detalle se hable en la primera consulta.
export const ESPECIALIDADES = [
  'Ansiedad',
  'Depresión',
  'Estrés',
  'Autoestima',
  'Conflictos relacionales',
  'Trauma y estrés postraumático',
  'TOC',
  'Trastorno límite de la personalidad',
  'Duelo',
  'Divorcio',
  'Conflictos familiares',
  'Crianza',
  'Infidelidad',
  'Control de la ira',
  'Insomnio',
  'Codependencia',
  'Espiritualidad',
  'Orientación vocacional',
  'Coaching de vida',
  'Psicología deportiva',
]

// Su enfoque de especialidad según el perfil; los demás son herramientas que integra.
export const ENFOQUE_PRINCIPAL = 'Terapia cognitivo-conductual'

export const ENFOQUES = [
  'Terapia cognitivo-conductual',
  'Terapia racional emotiva conductual',
  'Programación neurolingüística',
  'Mindfulness',
  'Terapia sistémica familiar',
  'Terapia cristiana',
]

export const DATOS_RAPIDOS = [
  { icono: Video, titulo: 'Modalidad', texto: 'Presencial y virtual' },
  { icono: Users, titulo: 'Atiende a', texto: 'Adolescentes, adultos y parejas' },
  { icono: MapPin, titulo: 'Dónde', texto: 'Wilde y Quilmes, Buenos Aires' },
]

export const COLEGIATURA = 'Colegio de Psicólogos de la Provincia de Buenos Aires · Distrito XII (Quilmes)'

export const CITA = 'No son los hechos o problemas lo que nos afectan, sino lo que pensamos acerca de ellos.'
