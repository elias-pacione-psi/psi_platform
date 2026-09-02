// Cuestionarios de autoevaluación (educativos, NO instrumentos clínicos) por módulo.
// Cada módulo cuenta con 5 preguntas de comprensión basadas en el material.
// Umbral de aprobación 70%.

const quizzes = {
  "modulo_1": {
    "moduloNumero": 1,
    "titulo": "Autoevaluación · Módulo 1 (Marco ético, crisis y escucha)",
    "preguntas": [
      {
        "pregunta": "¿Cuál es la diferencia fundamental entre el consejo pastoral y la psicoterapia?",
        "opciones": [
          "El consejo pastoral acompaña espiritualmente crisis vitales normativas; la psicoterapia es una intervención científica sobre trastornos mentales",
          "El consejo pastoral es siempre gratuito y la psicoterapia siempre arancelada",
          "No existe distinción técnica, únicamente cambia el espacio físico institucional donde se realiza",
          "El consejo pastoral trata patologías severas mediante la oración y la psicoterapia solo casos leves"
        ],
        "respuesta_correcta": "El consejo pastoral acompaña espiritualmente crisis vitales normativas; la psicoterapia es una intervención científica sobre trastornos mentales"
      },
      {
        "pregunta": "En el protocolo ABCDE de Primeros Auxilios Psicológicos (PAP), ¿cuál es el primer paso a implementar?",
        "opciones": [
          "Escucha activa (A)",
          "Reanimación o ventilación respiratoria (B)",
          "Categorización de necesidades (C)",
          "Psicoeducación y normalización del malestar (E)"
        ],
        "respuesta_correcta": "Escucha activa (A)"
      },
      {
        "pregunta": "En el sistema de triaje pastoral para evaluación de riesgo, ¿qué situación corresponde al semáforo rojo (derivación urgente)?",
        "opciones": [
          "Ideación suicida activa, plan estructurado o presencia de autolesiones",
          "Desacuerdo conyugal sobre la crianza de los hijos",
          "Duelo reciente por fallecimiento de un familiar cercano sin ideación suicida",
          "Desánimo vocacional y fatiga por responsabilidades ministeriales"
        ],
        "respuesta_correcta": "Ideación suicida activa, plan estructurado o presencia de autolesiones"
      },
      {
        "pregunta": "¿Cuál es una pauta fundamental al diseñar un Plan de Seguridad para la prevención del riesgo suicida?",
        "opciones": [
          "Identificar señales de advertencia tempranas y restringir el acceso a medios letales",
          "Exigir que la persona prometa no volver a tener pensamientos de muerte",
          "Mantener el plan en secreto sin involucrar a ningún contacto de la red de apoyo",
          "Sustituir la consulta psiquiátrica por un ayuno congregacional de 40 días"
        ],
        "respuesta_correcta": "Identificar señales de advertencia tempranas y restringir el acceso a medios letales"
      },
      {
        "pregunta": "En la técnica de escucha activa, ¿cuál de las siguientes intervenciones debe evitarse?",
        "opciones": [
          "Minimizar el dolor de la persona citando pasajes bíblicos de forma apresurada antes de contener",
          "Reflejar con precisión el estado emocional expresado por el aconsejado",
          "Hacer preguntas abiertas que inviten a explorar los sentimientos",
          "Validar la dificultad de la situación antes de proponer posibles alternativas"
        ],
        "respuesta_correcta": "Minimizar el dolor de la persona citando pasajes bíblicos de forma apresurada antes de contener"
      }
    ]
  },
  "modulo_2": {
    "moduloNumero": 2,
    "titulo": "Autoevaluación · Módulo 2 (Modelo cognitivo TCC / TREC)",
    "preguntas": [
      {
        "pregunta": "En el modelo ABC de la Terapia Racional Emotiva Conductual (TREC), ¿qué representa el componente B?",
        "opciones": [
          "Las creencias e interpretaciones cognitivas que la persona hace del acontecimiento",
          "El acontecimiento activador objetivo e incuestionable que ocurre en el entorno",
          "Las consecuencias emocionales y conductuales observables",
          "El debate socrático guiado por el consejero pastoral"
        ],
        "respuesta_correcta": "Las creencias e interpretaciones cognitivas que la persona hace del acontecimiento"
      },
      {
        "pregunta": "Un líder pastoral piensa: 'Si un miembro de mi equipo no vino a la reunión, mi liderazgo es un fracaso absoluto'. ¿Qué distorsión cognitiva ilustra?",
        "opciones": [
          "Pensamiento dicotómico (todo o nada) y sobregeneralización",
          "Defusión cognitiva y distanciamiento reflexivo",
          "Validación emocional empática",
          "Razonamiento inductivo basado en evidencia científica"
        ],
        "respuesta_correcta": "Pensamiento dicotómico (todo o nada) y sobregeneralización"
      },
      {
        "pregunta": "¿Cuál es el propósito principal de la técnica de la flecha descendente (downward arrow)?",
        "opciones": [
          "Profundizar más allá del pensamiento automático superficial para identificar la creencia nuclear subyacente",
          "Calcular el puntaje numérico de depresión de una persona en crisis",
          "Debatir de forma agresiva para demostrar que el aconsejado está equivocado",
          "Acelerar una derivación médica sin escuchar el motivo de consulta"
        ],
        "respuesta_correcta": "Profundizar más allá del pensamiento automático superficial para identificar la creencia nuclear subyacente"
      },
      {
        "pregunta": "Según Albert Ellis, ¿cuál es la característica distintiva de una creencia irracional en la TREC?",
        "opciones": [
          "Se expresa en términos de demandas y exigencias absolutistas ('debo', 'tengo que', 'es intolerable si no sucede')",
          "Aparece exclusivamente en personas con cuadros psicóticos diagnosticados",
          "Se refiere únicamente a situaciones ocurridas durante la infancia temprana",
          "Siempre está motivada por malas intenciones morales del individuo"
        ],
        "respuesta_correcta": "Se expresa en términos de demandas y exigencias absolutistas ('debo', 'tengo que', 'es intolerable si no sucede')"
      },
      {
        "pregunta": "¿Qué busca lograr la reestructuración cognitiva en el contexto del liderazgo pastoral?",
        "opciones": [
          "Generar interpretaciones más realistas, flexibles y basadas en evidencia sobre las dificultades ministeriales",
          "Imponer un pensamiento positivo artificial que niegue la existencia de problemas reales",
          "Convencer al aconsejado de que sus emociones negativas son una falta de fe",
          "Eliminar completamente cualquier pensamiento automático de la mente humana"
        ],
        "respuesta_correcta": "Generar interpretaciones más realistas, flexibles y basadas en evidencia sobre las dificultades ministeriales"
      }
    ]
  },
  "modulo_3": {
    "moduloNumero": 3,
    "titulo": "Autoevaluación · Módulo 3 (Aceptación y Compromiso - ACT)",
    "preguntas": [
      {
        "pregunta": "¿Cómo define la Terapia de Aceptación y Compromiso (ACT) a la 'evitación experiencial'?",
        "opciones": [
          "La tendencia persistente a rechazar, controlar o suprimir el malestar interno, lo cual suele amplificar el sufrimiento a largo plazo",
          "La capacidad saludable de postergar una discusión conflictiva en el equipo",
          "Una fobia específica a espacios abiertos o concurridos",
          "El rechazo voluntario de hábitos perjudiciales mediante la fuerza de voluntad"
        ],
        "respuesta_correcta": "La tendencia persistente a rechazar, controlar o suprimir el malestar interno, lo cual suele amplificar el sufrimiento a largo plazo"
      },
      {
        "pregunta": "¿Cuál es el objetivo primordial del proceso de defusión cognitiva en ACT?",
        "opciones": [
          "Modificar la relación con el pensamiento, reconociéndolo como un evento mental transitorio y no como una verdad literal o mandato de acción",
          "Demostrar mediante argumentos lógicos que el pensamiento es falso y carece de sentido",
          "Reprimir o expulsar los pensamientos desagradables mediante la concentración mental",
          "Sustituir cada pensamiento negativo por una afirmación optimista automática"
        ],
        "respuesta_correcta": "Modificar la relación con el pensamiento, reconociéndolo como un evento mental transitorio y no como una verdad literal o mandato de acción"
      },
      {
        "pregunta": "Cuando un líder dice: 'Noto que mi mente me está diciendo que no soy competente para esta tarea', ¿qué ejercicio está aplicando?",
        "opciones": [
          "Defusión cognitiva y distanciamiento observador del diálogo interno",
          "Fusión cognitiva y aceptación sumisa del autojuicio",
          "Evitación experiencial mediante la distracción cognitiva",
          "Diagnóstico clínico de trastorno de personalidad"
        ],
        "respuesta_correcta": "Defusión cognitiva y distanciamiento observador del diálogo interno"
      },
      {
        "pregunta": "En ACT, ¿cuál es la diferencia crucial entre un 'valor' y una 'meta'?",
        "opciones": [
          "El valor es una dirección continua y continua en la vida (como una brújula); la meta es un hito puntual y alcanzable",
          "El valor es impuesto por la sociedad; la meta es una elección absolutamente individual",
          "No hay distinción conceptual; en la literatura de ACT se utilizan como sinónimos exactos",
          "Los valores se aplican solo a la vida espiritual y las metas solo a logros laborales"
        ],
        "respuesta_correcta": "El valor es una dirección continua y continua en la vida (como una brújula); la meta es un hito puntual y alcanzable"
      },
      {
        "pregunta": "¿Por qué son eficaces las metáforas terapéuticas (como 'El Pasajero del Autobús' o 'El Huerto') en el acompañamiento?",
        "opciones": [
          "Porque facilitan la comprensión vivencial y el cambio de perspectiva eludiendo la rigidez de la discusión puramente racional",
          "Porque permiten ocultar el verdadero significado de la intervención al aconsejado",
          "Porque son herramientas exclusivas para el trabajo con niños pequeños",
          "Porque garantizan que la persona nunca vuelva a experimentar ansiedad o tristeza"
        ],
        "respuesta_correcta": "Porque facilitan la comprensión vivencial y el cambio de perspectiva eludiendo la rigidez de la discusión puramente racional"
      }
    ]
  },
  "modulo_4": {
    "moduloNumero": 4,
    "titulo": "Autoevaluación · Módulo 4 (Comunicación y autocuidado)",
    "preguntas": [
      {
        "pregunta": "¿Cuáles son los 4 pasos secuenciales del Guion de Comunicación Asertiva?",
        "opciones": [
          "Hechos observables, Sentimientos expresados en primera persona, Pedido concreto y Consecuencias positivas del cambio",
          "Opinar, Confrontar con firmeza, Exigir cumplimiento y Advertir sobre sanciones",
          "Escuchar pasivamente, Evitar el conflicto, Ceder en la postura y Retirarse de la conversación",
          "Citar principios generales, Interpretar la intención del otro, Juzgar la conducta y Cerrar el tema"
        ],
        "respuesta_correcta": "Hechos observables, Sentimientos expresados en primera persona, Pedido concreto y Consecuencias positivas del cambio"
      },
      {
        "pregunta": "El síndrome de Burnout (desgaste profesional) se describe clásicamente mediante una tríada sintomática. ¿Cuál es?",
        "opciones": [
          "Agotamiento emocional, despersonalización (cinismo/frialdad hacia los demás) y baja sensación de realización personal",
          "Ansiedad generalizada, insomnio de conciliación y ataques de pánico repentinos",
          "Sentimientos de culpa espiritual, desmotivación teológica y aislamiento social voluntario",
          "Dolores de cabeza crónicos, hipertensión arterial y dificultades digestivas frecuentes"
        ],
        "respuesta_correcta": "Agotamiento emocional, despersonalización (cinismo/frialdad hacia los demás) y baja sensación de realización personal"
      },
      {
        "pregunta": "¿Cuál es la premisa pedagógica central del Método Socrático aplicado a la consejería pastoral?",
        "opciones": [
          "Formular preguntas guiadas que promuevan el discernimiento, la reflexión y el descubrimiento autónomo de la persona",
          "Dar rápidamente la respuesta correcta para resolver la consulta en el menor tiempo posible",
          "Confrontar el error moral del aconsejado utilizando preguntas capciosas",
          "Mantener silencio absoluto durante toda la sesión sin intervenir verbalmente"
        ],
        "respuesta_correcta": "Formular preguntas guiadas que promuevan el discernimiento, la reflexión y el descubrimiento autónomo de la persona"
      },
      {
        "pregunta": "¿Qué caracteriza a un estilo de comunicación asertivo en contraposición al pasivo o agresivo?",
        "opciones": [
          "Expresar las propias necesidades y límites con claridad y firmeza, respetando simultáneamente la dignidad del interlocutor",
          "Aceptar siempre las demandas del grupo para evitar tensiones interpersonales en la comunidad",
          "Imponer el propio criterio pastoral apelando a la autoridad jerárquica del cargo",
          "Utilizar el sarcasmo o la ironía para señalar los errores de los colaboradores"
        ],
        "respuesta_correcta": "Expresar las propias necesidades y límites con claridad y firmeza, respetando simultáneamente la dignidad del interlocutor"
      },
      {
        "pregunta": "Desde la perspectiva del autocuidado pastoral, ¿cuál de las siguientes estrategias es un factor protector comprobado frente al burnout?",
        "opciones": [
          "Establecer límites claros de disponibilidad horaria, delegar tareas y contar con un espacio de supervisión o acompañamiento entre pares",
          "Asumir personalmente todas las demandas de consejería para asegurar una atención homogénea",
          "Interpretar la necesidad de descanso como un indicador de debilidad en la vocación de servicio",
          "Evitar hablar sobre las propias emociones y dificultades con otros colegas del ministerio"
        ],
        "respuesta_correcta": "Establecer límites claros de disponibilidad horaria, delegar tareas y contar con un espacio de supervisión o acompañamiento entre pares"
      }
    ]
  }
};

module.exports = { quizzes };
