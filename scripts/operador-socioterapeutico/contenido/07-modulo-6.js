const { nota, bajada } = require('./notas')

module.exports = {
  orden: 7,
  archivo: '07-modulo-6-modelos-y-dispositivos-de-tratamiento',
  etiqueta: 'Módulo 6 · Modelos y dispositivos de tratamiento',
  moduloTitulo: 'Módulo 6 · Modelos y dispositivos de tratamiento',
  moduloDescripcion: 'Conocer los enfoques de tratamiento con mayor respaldo empírico y los distintos dispositivos disponibles según la gravedad del caso.',
  leccionTitulo: 'Diapositivas · Modelos y dispositivos de tratamiento',
  slides: [
    {
      tipo: 'portada', numero: 6, kicker: 'Módulo 6 de 8 · Semana 6',
      titulo: 'Modelos y dispositivos de tratamiento',
      bajada: 'Conocer los enfoques de tratamiento con mayor respaldo empírico y los distintos dispositivos disponibles según la gravedad del caso.',
      chips: ['3 horas cátedra', '120 minutos', '7 bloques'],
      notas: bajada(6),
    },
    {
      tipo: 'objetivos',
      items: [
        'Conocer la terapia cognitivo-conductual y el modelo de prevención de recaídas de Marlatt y Gordon.',
        'Identificar el modelo matriz y otros programas ambulatorios estructurados con evidencia de eficacia.',
        'Distinguir los distintos niveles de atención disponibles según la gravedad del caso.',
        'Incorporar criterios básicos para decidir cuándo y hacia dónde derivar.',
      ],
    },
    {
      tipo: 'agenda', total: 120,
      bloques: [
        { min: 10, t: '6.1 Reconexión' },
        { min: 30, t: '6.2 Terapia cognitivo-conductual y prevención de recaídas (Marlatt y Gordon)' },
        { min: 20, t: '6.3 Modelo matriz y otros programas basados en evidencia' },
        { min: 25, t: '6.4 Dispositivos de tratamiento: niveles de atención' },
        { min: 20, t: '6.5 Grupos de ayuda mutua y comunidades terapéuticas' },
        { min: 10, t: '6.6 Trabajo en red: cuándo y cómo derivar' },
        { min: 5, t: '6.7 Cierre' },
      ],
    },
    {
      tipo: 'mapa', kicker: '6.2 · Terapia cognitivo-conductual y prevención de recaídas',
      titulo: 'La TCC es el enfoque con mayor respaldo empírico; la prevención de recaídas, su eje',
      centro: 'Prevención de recaídas (Marlatt y Gordon, 1985)',
      ramas: [
        { rel: 'entiende la recaída como', t: 'Parte esperable del proceso de cambio', hijos: ['Una oportunidad de aprendizaje sobre las propias situaciones de riesgo'] },
        { rel: 'trabaja tres factores', t: 'Cognitivos', hijos: ['Autoeficacia: la confianza en la propia capacidad de afrontar el riesgo', 'Expectativas sobre los resultados de volver a consumir', 'Atribuciones sobre las causas de una recaída pasada'] },
        { rel: 'en la práctica', t: 'Identifica y entrena', hijos: ['Las situaciones de alto riesgo de cada persona', 'Estrategias de afrontamiento concretas'] },
      ],
      notas: nota('6.2'),
    },
    {
      tipo: 'tarjetas', kicker: '6.2 · Un lapso no es el fracaso total',
      titulo: 'Preparar a la persona para que un consumo puntual no sea el fin del proceso',
      tarjetas: [
        { kicker: 'Un «lapso»', titulo: 'Un consumo puntual', texto: 'Puede ocurrir en el proceso de cambio y es una oportunidad de aprendizaje.' },
        { kicker: 'El riesgo', titulo: 'Efecto de violación de la abstinencia', texto: 'Vivir el lapso como el fracaso total de todo el proceso.', oscura: true },
        { kicker: 'Lo que busca el modelo', titulo: 'Una señal para ajustar el plan', texto: 'No para abandonarlo.' },
      ],
      notas: nota('6.2'),
    },
    {
      tipo: 'tarjetas', kicker: '6.3 · Modelo matriz y otros programas basados en evidencia',
      titulo: 'Tres enfoques con mayor evidencia para el tratamiento ambulatorio',
      lead: 'Los organismos internacionales de referencia —como el NIDA de Estados Unidos— los reconocen con mayor evidencia de eficacia.',
      tarjetas: [
        { kicker: 'Programa estructurado', titulo: 'Modelo matriz', texto: 'Ambulatorio intensivo, desarrollado para dependencia a estimulantes: integra en un esquema semanal psicoeducación, TCC individual y grupal, trabajo familiar y derivación a grupos de ayuda mutua.' },
        { kicker: 'Módulo 3', titulo: 'Entrevista motivacional', texto: 'Trabajada en el módulo 3.' },
        { kicker: 'Módulo 4', titulo: 'Terapia familiar sistémica', texto: 'Trabajada en el módulo 4.' },
      ],
      notas: nota('6.3'),
    },
    {
      tipo: 'escalera', kicker: '6.4 · Dispositivos de tratamiento',
      titulo: 'Niveles de atención: de menor a mayor intensidad',
      niveles: [
        { t: 'Grupos de ayuda mutua', d: 'Apoyo entre pares, sin supervisión clínica directa.' },
        { t: 'Ambulatorio', d: 'Consultas periódicas; la persona sostiene su vida cotidiana.' },
        { t: 'Hospital de día', d: 'Varias horas al día, varios días a la semana, sin pernoctar.' },
        { t: 'Internación corta', d: 'Desintoxicación: manejo seguro de la abstinencia en riesgo físico.' },
        { t: 'Comunidad terapéutica', d: 'Convivencia estructurada, de mediana o larga estadía.' },
      ],
      notas: nota('6.4'),
    },
    {
      tipo: 'comparacion', kicker: '6.4 · Quién decide el nivel de atención',
      titulo: 'La decisión corresponde siempre al equipo profesional tratante',
      izq: { titulo: 'De qué depende la elección', tono: 'marca', items: ['La gravedad del cuadro', 'El riesgo de vida', 'La presencia de patología psiquiátrica asociada', 'El sostén familiar y social disponible', 'Los recursos existentes en la zona'] },
      der: { titulo: 'El rol del operador', tono: 'tinta', items: ['Reconocer las señales que ameritan una consulta o una derivación urgente', 'No decidir el nivel de atención por sí solo'] },
      notas: nota('6.4'),
    },
    {
      tipo: 'comparacion', kicker: '6.5 · Grupos de ayuda mutua y comunidades terapéuticas',
      titulo: 'Dos dispositivos distintos, que complementan al tratamiento profesional',
      izq: { titulo: 'Grupos de ayuda mutua (AA, NA, JA)', tono: 'sage', items: ['Modelo de pares: el testimonio de otra persona que atravesó el mismo proceso y sostiene su recuperación', 'Algo que ningún tratamiento profesional reemplaza por completo', 'Funcionan mejor como complemento del tratamiento profesional que como sustituto'] },
      der: { titulo: 'Comunidades terapéuticas', tono: 'marca', items: ['Dispositivo residencial de mediana o larga duración', 'Estructurado alrededor de la convivencia, el trabajo y la disciplina cotidiana', 'Indicado cuando el entorno habitual de la persona sostiene activamente el consumo'] },
      notas: nota('6.5'),
    },
    {
      tipo: 'frase',
      texto: 'Ningún operador socioterapéutico debería sostener en soledad un caso de riesgo.',
      autor: 'Antes de ejercer el rol, conviene mapear la propia red local: profesionales de referencia, centros de salud, hospitales con guardia de salud mental, comunidades terapéuticas de la zona y líneas de atención telefónica.',
      notas: nota('6.6'),
    },
    {
      tipo: 'lista', kicker: '6.6 · Trabajo en red',
      titulo: '¿Cuándo derivar con urgencia?',
      max: 21,
      items: [
        { t: 'Riesgo de vida por intoxicación aguda o síndrome de abstinencia grave', acento: 'b3372f' },
        { t: 'Ideación o intento de suicidio', acento: 'b3372f' },
        { t: 'Violencia activa hacia sí mismo o hacia terceros', acento: 'b3372f' },
        { t: 'Consumo activo y sin supervisión de un menor de edad', acento: 'b3372f' },
        { t: 'Deterioro físico o psíquico severo que excede claramente el rol de acompañamiento', acento: 'b3372f' },
      ],
      notas: nota('H6'),
    },
    {
      tipo: 'claves', titulo: 'Claves del módulo',
      items: [
        'La TCC es el enfoque con mayor respaldo empírico; la prevención de recaídas entiende la recaída como parte del proceso.',
        'Un lapso es una señal para ajustar el plan, no para abandonarlo.',
        'Los niveles de atención van de menor a mayor intensidad; la elección corresponde al equipo profesional.',
        'Los grupos de ayuda mutua funcionan mejor como complemento del tratamiento que como sustituto.',
        'Nunca sostener un caso de riesgo en soledad: mapear la red de derivación antes de empezar.',
      ],
    },
    {
      tipo: 'herramienta', numero: 6, nombre: 'Mapa de dispositivos y derivación',
      uso: 'Uso personal del operador · construir, antes de empezar a acompañar casos, la propia red de derivación local.',
      max: 16,
      partes: [
        { titulo: 'Mi red de derivación local', estilo: 'campos', items: [
          'Profesional o institución de referencia en salud mental: nombre y teléfono',
          'Centro de salud u hospital con guardia de salud mental más cercano: dirección y teléfono',
          'Comunidad terapéutica o dispositivo de internación de referencia: teléfono y requisitos de admisión',
          'Grupo de ayuda mutua más accesible (AA / NA / JA u otro): día, horario y lugar',
          'Línea telefónica de emergencia en salud mental / adicciones de mi región',
        ] },
      ],
      cierre: 'Los criterios para derivar con urgencia están en la diapositiva anterior.',
      notas: nota('H6'),
    },
  ],
}
