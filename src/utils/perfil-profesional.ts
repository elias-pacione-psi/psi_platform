import { Video, Users, MapPin } from 'lucide-react'

// Perfil profesional de Elias — tomado de su listado público en Psychology Today
// (colegiatura, especialidades y enfoques declarados ahí). Lo comparten la introducción
// "Sobre Elías" de la landing y la página /quien-soy, que lo desarrolla: un solo lugar
// donde corregirlo cuando cambie algo.
//
// Vive acá y no en page.tsx porque Next no deja exportar datos arbitrarios desde una
// página (sólo `metadata`, `revalidate` y compañía).

// Fotos de Elias que rotan en el carrusel de la landing y de /quien-soy (componente
// FotoElias), en el orden en que se muestran. Son de un seminario presencial, recortadas a
// 4:5 (960×1200) y sin metadatos; son cinco, con encuadres cerrados sobre él, y ninguna
// foto parecida va pegada a otra.
// Para sumar, quitar o reordenar alcanza con tocar esta lista y los archivos de
// public/elias/ — las dos páginas la toman de este único lugar.
export const FOTOS_PERFIL = [
  { src: '/elias/seminario-01.jpg', alt: 'Elías explicando con el micrófono en una mano y la otra abierta, durante un seminario' },
  { src: '/elias/seminario-02.jpg', alt: 'Elías de pie con el micrófono y el control de las diapositivas durante una charla' },
  { src: '/elias/seminario-03.jpg', alt: 'Elías con el micrófono en la mano, mirando al público durante una charla' },
  { src: '/elias/seminario-04.jpg', alt: 'Elías hablando en un seminario, micrófono en mano' },
  { src: '/elias/seminario-05.jpg', alt: 'Elías hablando con el micrófono, de perfil, en un seminario' },
]

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
