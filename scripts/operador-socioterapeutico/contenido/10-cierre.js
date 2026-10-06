const { nota } = require('./notas')

module.exports = {
  orden: 10,
  archivo: '10-cierre-del-programa',
  etiqueta: 'Cierre del programa',
  moduloTitulo: 'Cierre del programa, bibliografía e índice de herramientas',
  moduloDescripcion: 'Cierre del programa, criterios de finalización sugeridos, bibliografía y fuentes de referencia, e índice de las ocho herramientas.',
  leccionTitulo: 'Diapositivas · Cierre del programa',
  slides: [
    {
      tipo: 'cierre', kicker: 'Cierre del programa',
      titulo: 'Un mapa sólido, con base clínica y humana, para empezar a acompañar con fundamento',
      texto: 'Quien lo completa no termina siendo un especialista definitivo: dejó de mirar el problema desde lejos y aprendió a acercarse con las herramientas adecuadas.',
      notas: nota('C0'),
    },
    {
      tipo: 'frase',
      texto: 'No necesitás ver toda la escalera. Solo necesitás ver el próximo peldaño.',
      autor: 'Martin Luther King Jr.',
      notas: nota('C0'),
    },
    {
      tipo: 'lista', kicker: 'Criterios de finalización sugeridos',
      titulo: 'Qué se espera para completar el programa',
      items: [
        { t: 'Asistencia mínima al 80% de los encuentros', d: '7 de los 8 módulos.' },
        { t: 'Entrega de la Plantilla de Plan de Tratamiento Integral completa', d: 'Trabajada sobre el caso práctico del módulo 8.' },
        { t: 'Participación activa en al menos dos de las dinámicas grupales', d: 'Del programa.' },
      ],
      notas: nota('C1'),
    },
    {
      tipo: 'tabla', kicker: 'Índice de herramientas del programa',
      titulo: 'Las ocho herramientas, una por módulo',
      cols: ['#', 'Herramienta', 'Módulo'], anchos: [0.9, 8.9, 2.4], pt: 16,
      filas: [
        ['1', 'Mi mapa de prejuicios', 'Módulo 1'],
        ['2', 'Ficha de psicoeducación: qué le pasa al cerebro', 'Módulo 2'],
        ['3', 'Mapa de disparadores y estadio de cambio', 'Módulo 3'],
        ['4', 'Guía para familiares: qué sí y qué no', 'Módulo 4'],
        ['5', 'El espejo de la comunidad', 'Módulo 5'],
        ['6', 'Mapa de dispositivos y derivación', 'Módulo 6'],
        ['7', 'Protocolo de alerta temprana del operador', 'Módulo 7'],
        ['8', 'Plantilla de Plan de Tratamiento Integral', 'Módulo 8'],
      ],
      notas: nota('C3'),
    },
    {
      tipo: 'puntos', kicker: 'Bibliografía', titulo: 'Bibliografía y fuentes de referencia', max: 21, espacio: 0.2,
      items: [
        'Prochaska, J. O. y DiClemente, C. C. — Modelo transteórico de cambio de conducta (estadios de cambio).',
        'Miller, W. R. y Rollnick, S. — Entrevista motivacional: principios y práctica.',
        'Marlatt, G. A. y Gordon, J. R. (1985) — Relapse Prevention: Maintenance Strategies in the Treatment of Addictive Behaviors.',
        'Instituto Nacional sobre el Abuso de Drogas de Estados Unidos (NIDA) — Principios de tratamiento para la drogadicción y modelos con evidencia (modelo matriz, terapia familiar, refuerzo comunitario, entre otros).',
        'Oficina de Naciones Unidas contra la Droga y el Delito (UNODC) — Informe Mundial sobre las Drogas.',
        'Organización Mundial de la Salud (OMS) — Datos sobre mortalidad asociada al consumo de sustancias.',
        'Elias Pacione — Seminario en Adicciones: Guión del facilitador y Cuadernillo de hojas de trabajo para participantes (material propio, base del enfoque experiencial y espiritual integrado en el programa).',
      ],
      notas: nota('C2'),
    },
    {
      tipo: 'cierre', kicker: 'Gracias',
      titulo: 'Operador Socioterapéutico en Adicciones',
      texto: 'Un recorrido clínico, familiar, social y espiritual para acompañar procesos de recuperación con fundamento y sin prejuicio.',
      pie: 'Elias Pacione · Psicología con sentido',
    },
  ],
}
