-- ============================================================================
-- Programa de Formación: Psicología Aplicada a la Tarea Pastoral
-- ----------------------------------------------------------------------------
-- Estructura real del programa (4 módulos virtuales + 4 encuentros presenciales),
-- reconstruida desde los 16 PDFs del material y el proyecto del Lic. Elías Pacione.
-- Ver docs/curso-pastoral/analisis-material.md para el mapeo archivo → tema.
--
-- Idempotente: se puede correr más de una vez.
--
-- IMPORTANTE — los PDFs no se cargan desde acá.
--   Las lecciones quedan con url_recurso = '' y tipo_contenido = 'r2_pdf'.
--   El instructor adjunta cada archivo desde /psicologo/programas/{id}, que sube
--   a R2 y completa el campo. El visor del alumno tolera url_recurso vacío.
--
-- IMPORTANTE — lo que NO se modela, por regla del proyecto (Ley 25.326 / AGENTS.md):
--   · El "termómetro del desgaste" (M4T3) y los Planes de Seguridad (M1T3, M1T4)
--     son material descargable, NUNCA formularios de la plataforma. Guardarían
--     estado emocional del alumno y datos de terceros.
--   · El feligrés/aconsejado no es una entidad del sistema y no debe llegar a serlo.
-- ============================================================================

-- ============================================================ PROGRAMA
insert into public.programas (id, titulo, descripcion) values
  ('22222222-2222-2222-2222-222222222222',
   'Psicología Aplicada a la Tarea Pastoral',
   'Formación híbrida de 8 semanas para la detección temprana, contención inicial y derivación responsable de problemáticas de salud mental en la comunidad de fe. Enfoques: TCC, TREC, ACT y habilidades de comunicación. 4 módulos virtuales + 4 encuentros presenciales.')
on conflict (id) do nothing;

-- ============================================================ MÓDULOS
insert into public.modulos (id, programa_id, titulo, descripcion, orden) values
  ('a2222222-2222-2222-2222-000000000001', '22222222-2222-2222-2222-222222222222',
   'Módulo 1 · Marco ético, crisis y escucha',
   'Dónde termina el consejo pastoral y empieza la psicoterapia. Primeros Auxilios Psicológicos, planes de seguridad y escucha activa.', 0),
  ('a2222222-2222-2222-2222-000000000002', '22222222-2222-2222-2222-222222222222',
   'Módulo 2 · Modelo cognitivo (TCC / TREC)',
   'El modelo ABC de Ellis, las distorsiones cognitivas más frecuentes en el liderazgo y la técnica de la flecha descendente.', 1),
  ('a2222222-2222-2222-2222-000000000003', '22222222-2222-2222-2222-222222222222',
   'Módulo 3 · Aceptación y Compromiso (ACT)',
   'Flexibilidad psicológica: evitación experiencial, defusión cognitiva, valores y metáforas aplicadas al acompañamiento.', 2),
  ('a2222222-2222-2222-2222-000000000004', '22222222-2222-2222-2222-222222222222',
   'Módulo 4 · Comunicación y autocuidado',
   'Comunicación asertiva, método socrático y prevención del burnout en el ministerio.', 3)
on conflict (id) do nothing;

-- ============================================================ LECCIONES
-- ---- Módulo 1 ----
insert into public.lecciones (id, programa_id, modulo_id, titulo, tipo_contenido, url_recurso, orden) values
  ('b2222222-2222-2222-2222-000000000101', '22222222-2222-2222-2222-222222222222', 'a2222222-2222-2222-2222-000000000001',
   'Tema 1 · Límites entre el Consejo Pastoral y la Psicoterapia', 'r2_pdf', '', 0),
  ('b2222222-2222-2222-2222-000000000102', '22222222-2222-2222-2222-222222222222', 'a2222222-2222-2222-2222-000000000001',
   'Tema 2 · Protocolo ABCDE de Primeros Auxilios Psicológicos', 'r2_pdf', '', 1),
  ('b2222222-2222-2222-2222-000000000103', '22222222-2222-2222-2222-222222222222', 'a2222222-2222-2222-2222-000000000001',
   'Tema 3 · Plan de Seguridad para la Prevención del Riesgo Suicida', 'r2_pdf', '', 2),
  ('b2222222-2222-2222-2222-000000000104', '22222222-2222-2222-2222-222222222222', 'a2222222-2222-2222-2222-000000000001',
   'Tema 4 · Plan de Seguridad para Situaciones de Violencia Interpersonal', 'r2_pdf', '', 3),
  ('b2222222-2222-2222-2222-000000000105', '22222222-2222-2222-2222-222222222222', 'a2222222-2222-2222-2222-000000000001',
   'Tema 5 · La Escucha Activa como Herramienta de Intervención', 'r2_pdf', '', 4),
  ('b2222222-2222-2222-2222-000000000106', '22222222-2222-2222-2222-222222222222', 'a2222222-2222-2222-2222-000000000001',
   'Autoevaluación · Módulo 1', 'quiz', '', 5),

-- ---- Módulo 2 ----
  ('b2222222-2222-2222-2222-000000000201', '22222222-2222-2222-2222-222222222222', 'a2222222-2222-2222-2222-000000000002',
   'Tema 1 · Aplicación del Modelo TREC en la Consejería Pastoral', 'r2_pdf', '', 0),
  ('b2222222-2222-2222-2222-000000000202', '22222222-2222-2222-2222-222222222222', 'a2222222-2222-2222-2222-000000000002',
   'Tema 2 · Distorsiones Cognitivas en el Liderazgo Pastoral', 'r2_pdf', '', 1),
  ('b2222222-2222-2222-2222-000000000203', '22222222-2222-2222-2222-222222222222', 'a2222222-2222-2222-2222-000000000002',
   'Tema 3 · La Técnica de la Flecha Descendente', 'r2_pdf', '', 2),
  ('b2222222-2222-2222-2222-000000000204', '22222222-2222-2222-2222-222222222222', 'a2222222-2222-2222-2222-000000000002',
   'Autoevaluación · Módulo 2', 'quiz', '', 3),

-- ---- Módulo 3 ----
  ('b2222222-2222-2222-2222-000000000301', '22222222-2222-2222-2222-222222222222', 'a2222222-2222-2222-2222-000000000003',
   'Tema 1 · Evitación Experiencial', 'r2_pdf', '', 0),
  ('b2222222-2222-2222-2222-000000000302', '22222222-2222-2222-2222-222222222222', 'a2222222-2222-2222-2222-000000000003',
   'Tema 2 · Defusión Cognitiva', 'r2_pdf', '', 1),
  ('b2222222-2222-2222-2222-000000000303', '22222222-2222-2222-2222-222222222222', 'a2222222-2222-2222-2222-000000000003',
   'Tema 3 · El proceso de valoración en ACT', 'r2_pdf', '', 2),
  ('b2222222-2222-2222-2222-000000000304', '22222222-2222-2222-2222-222222222222', 'a2222222-2222-2222-2222-000000000003',
   'Tema 4 · Metáforas terapéuticas para el acompañamiento', 'r2_pdf', '', 3),
  ('b2222222-2222-2222-2222-000000000305', '22222222-2222-2222-2222-222222222222', 'a2222222-2222-2222-2222-000000000003',
   'Autoevaluación · Módulo 3', 'quiz', '', 4),

-- ---- Módulo 4 ----
  ('b2222222-2222-2222-2222-000000000401', '22222222-2222-2222-2222-222222222222', 'a2222222-2222-2222-2222-000000000004',
   'Tema 1 · Comunicación Asertiva en el Liderazgo Cristiano', 'r2_pdf', '', 0),
  ('b2222222-2222-2222-2222-000000000402', '22222222-2222-2222-2222-222222222222', 'a2222222-2222-2222-2222-000000000004',
   'Tema 1 (anexo) · Guion de Comunicación Asertiva en 4 pasos', 'r2_pdf', '', 1),
  -- Tema 2: FALTA el material. Ver docs/curso-pastoral/analisis-material.md §2.
  ('b2222222-2222-2222-2222-000000000403', '22222222-2222-2222-2222-222222222222', 'a2222222-2222-2222-2222-000000000004',
   'Tema 3 · Burnout y autocuidado del líder', 'r2_pdf', '', 3),
  ('b2222222-2222-2222-2222-000000000404', '22222222-2222-2222-2222-222222222222', 'a2222222-2222-2222-2222-000000000004',
   'Tema 4 · El Método Socrático', 'r2_pdf', '', 4),
  ('b2222222-2222-2222-2222-000000000405', '22222222-2222-2222-2222-222222222222', 'a2222222-2222-2222-2222-000000000004',
   'Autoevaluación · Módulo 4', 'quiz', '', 5),

-- ---- Trabajo Final Integrador ----
  ('b2222222-2222-2222-2222-000000000499', '22222222-2222-2222-2222-222222222222', 'a2222222-2222-2222-2222-000000000004',
   'Trabajo Final Integrador · Proyecto de Contención Psicológica Pastoral', 'entrega',
   E'# Trabajo Final Integrador\n\nDiseñá el **Proyecto de Contención Psicológica Pastoral (PCPP)** de tu comunidad. Extensión sugerida: 20 a 30 páginas.\n\n## Contenido\n\n1. **Diagnóstico comunitario** — necesidades relevadas en tu congregación.\n2. **Protocolo de escucha** — cómo se recibe y contiene una primera consulta.\n3. **Sistema de triaje** — criterios del semáforo verde / amarillo / rojo.\n4. **Red de derivación** — psicólogos, psiquiatras, hospitales, centros de emergencia y dispositivos comunitarios de tu zona.\n5. **Plan de autocuidado** — supervisión, límites horarios, distribución de casos.\n\n> [!ERROR]\n> **No incluyas datos que permitan identificar a ninguna persona de tu comunidad.**\n> Nada de nombres, iniciales, edades exactas, vínculos familiares, cargos ni\n> situaciones reconocibles. Si necesitás ilustrar un caso, usá una situación\n> ficticia o compuesta. El diagnóstico comunitario se hace con datos agregados\n> (cantidades, tipos de consulta), nunca con historias individuales.\n\n> [!DATO]\n> Cada criterio se evalúa sobre 20 puntos. Se aprueba cuando el proyecto demuestra\n> que la congregación tiene un sistema organizado, ético y sostenible para contener,\n> reconocer riesgo y derivar a tiempo.', 6)
on conflict (id) do nothing;

-- ============================================================ QUIZZES
-- Preguntas de comprensión (umbral 70%). La respuesta correcta vive sólo en la
-- base: quiz_preguntas es solo-instructor por RLS y la corrección es server-side.

-- ---- Módulo 1 ----
insert into public.quiz_preguntas (leccion_id, pregunta, opciones, respuesta_correcta, orden) values
  ('b2222222-2222-2222-2222-000000000106',
   '¿Cuál es la diferencia central entre el consejo pastoral y la psicoterapia?',
   '["El consejo pastoral acompaña espiritualmente crisis vitales; la psicoterapia es una intervención científica sobre trastornos mentales","El consejo pastoral es gratuito y la psicoterapia se cobra","No hay diferencia real, cambia sólo el encuadre"]'::jsonb,
   'El consejo pastoral acompaña espiritualmente crisis vitales; la psicoterapia es una intervención científica sobre trastornos mentales', 0),
  ('b2222222-2222-2222-2222-000000000106',
   'En el protocolo ABCDE de Primeros Auxilios Psicológicos, ¿cuál es el primer paso?',
   '["Escucha activa","Psicoeducación","Derivación a un profesional"]'::jsonb,
   'Escucha activa', 1),
  ('b2222222-2222-2222-2222-000000000106',
   'Según el sistema de triaje, ¿qué situación corresponde al semáforo rojo?',
   '["Un conflicto interpersonal leve","Ideación suicida o autolesiones","Necesidad de ser escuchado"]'::jsonb,
   'Ideación suicida o autolesiones', 2),
  ('b2222222-2222-2222-2222-000000000106',
   'Ante una persona en crisis, ¿qué conviene evitar?',
   '["Reflejar la emoción que expresa","Minimizar el dolor o citar textos antes de contener","Resumir brevemente lo escuchado"]'::jsonb,
   'Minimizar el dolor o citar textos antes de contener', 3)
on conflict do nothing;

-- ---- Módulo 2 ----
insert into public.quiz_preguntas (leccion_id, pregunta, opciones, respuesta_correcta, orden) values
  ('b2222222-2222-2222-2222-000000000204',
   'En el modelo ABC de la TREC, ¿qué representa la letra B?',
   '["El acontecimiento objetivo que ocurrió","La creencia o interpretación que la persona hace del hecho","La conducta observable posterior"]'::jsonb,
   'La creencia o interpretación que la persona hace del hecho', 0),
  ('b2222222-2222-2222-2222-000000000204',
   'Pensar "si mis hijos se alejaron de la iglesia, fracasé como padre" es un ejemplo de…',
   '["Pensamiento dicotómico y sobregeneralización","Defusión cognitiva","Escucha activa"]'::jsonb,
   'Pensamiento dicotómico y sobregeneralización', 1),
  ('b2222222-2222-2222-2222-000000000204',
   '¿Para qué sirve la técnica de la flecha descendente?',
   '["Para identificar la creencia nuclear que sostiene el pensamiento automático","Para acelerar la derivación a un profesional","Para medir el nivel de ansiedad"]'::jsonb,
   'Para identificar la creencia nuclear que sostiene el pensamiento automático', 2)
on conflict do nothing;

-- ---- Módulo 3 ----
insert into public.quiz_preguntas (leccion_id, pregunta, opciones, respuesta_correcta, orden) values
  ('b2222222-2222-2222-2222-000000000305',
   '¿Qué describe la evitación experiencial?',
   '["El intento persistente de evitar o suprimir el malestar interno, que suele ampliarlo","La capacidad de aceptar el dolor inevitable","Una técnica de respiración para la ansiedad"]'::jsonb,
   'El intento persistente de evitar o suprimir el malestar interno, que suele ampliarlo', 0),
  ('b2222222-2222-2222-2222-000000000305',
   'El propósito de la defusión cognitiva es…',
   '["Cambiar el contenido del pensamiento por uno más positivo","Modificar la relación con el pensamiento, observándolo como un evento mental","Demostrar que el pensamiento es falso"]'::jsonb,
   'Modificar la relación con el pensamiento, observándolo como un evento mental', 1),
  ('b2222222-2222-2222-2222-000000000305',
   'Decir "noto que mi mente está produciendo el pensamiento de que fracasé" busca…',
   '["Aumentar la distancia psicológica respecto del pensamiento","Reprimir el pensamiento","Confirmar que el pensamiento es cierto"]'::jsonb,
   'Aumentar la distancia psicológica respecto del pensamiento', 2)
on conflict do nothing;

-- ---- Módulo 4 ----
insert into public.quiz_preguntas (leccion_id, pregunta, opciones, respuesta_correcta, orden) values
  ('b2222222-2222-2222-2222-000000000405',
   '¿Cuáles son los cuatro pasos del guion de comunicación asertiva?',
   '["Hechos, sentimientos, pedidos y consecuencias","Escuchar, interpretar, aconsejar y cerrar","Preguntar, discutir, acordar y registrar"]'::jsonb,
   'Hechos, sentimientos, pedidos y consecuencias', 0),
  ('b2222222-2222-2222-2222-000000000405',
   'El burnout se describe clásicamente mediante tres componentes. ¿Cuáles son?',
   '["Agotamiento emocional, despersonalización y baja realización personal","Ansiedad, insomnio y tristeza","Culpa, enojo y aislamiento"]'::jsonb,
   'Agotamiento emocional, despersonalización y baja realización personal', 1),
  ('b2222222-2222-2222-2222-000000000405',
   'El método socrático se caracteriza por…',
   '["Formular preguntas que promueven el discernimiento propio en lugar de imponer respuestas","Explicar la respuesta correcta con claridad","Confrontar directamente el error de la persona"]'::jsonb,
   'Formular preguntas que promueven el discernimiento propio en lugar de imponer respuestas', 2),
  ('b2222222-2222-2222-2222-000000000405',
   'Una creencia irracional según la TREC se reconoce porque…',
   '["Se expresa como exigencia absolutista: \"debo\", \"tengo que\", \"es imprescindible\"","Siempre se refiere al pasado","Aparece únicamente en personas con un trastorno"]'::jsonb,
   'Se expresa como exigencia absolutista: "debo", "tengo que", "es imprescindible"', 3)
on conflict do nothing;

-- ============================================================ COHORTE (8 semanas)
insert into public.cohortes (id, programa_id, nombre, fecha_inicio, fecha_fin) values
  ('c2222222-2222-2222-2222-000000000001', '22222222-2222-2222-2222-222222222222',
   'Cohorte 2026 · Dignos', current_date, current_date + 56)
on conflict (id) do nothing;

-- ============================================================ ENCUENTROS PRESENCIALES
-- 4 sábados de 8 a 12 en Dignos, Quilmes (semanas 2, 4, 6 y 8).
--   Encuentro 1 · Laboratorio de Escucha Activa y Triaje Pastoral
--   Encuentro 2 · Debate de Pensamientos y Reestructuración Cognitiva
--   Encuentro 3 · Taller de Mindfulness y Defusión Cognitiva
--   Encuentro 4 · Derivación Responsable y Diseño de Redes
insert into public.agenda_sesiones (cohorte_id, fecha_hora, tipo, lugar)
select 'c2222222-2222-2222-2222-000000000001'::uuid,
       -- primer sábado a partir del inicio de la cohorte, luego cada 14 días
       (current_date + ((6 - extract(dow from current_date)::int + 7) % 7))::timestamptz
         + (n * interval '14 days') + interval '8 hours',
       'presencial', 'Dignos, Quilmes'
from generate_series(0, 3) as n
where not exists (
  select 1 from public.agenda_sesiones
  where cohorte_id = 'c2222222-2222-2222-2222-000000000001'::uuid
);
