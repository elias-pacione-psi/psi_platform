# Feedback de alumnos: análisis y plan

Escrito el 2026-08-09, a pedido de Lucas ("incorporar feedback de ida y vuelta
real de usuarios, comentarios"). La etapa A ya está implementada; el resto es
decisión pendiente.

## 1. La distinción que ordena todo el problema

**Feedback de un _alumno_ sobre un _curso_ ≠ testimonio de un _paciente_ sobre
_terapia_.** Son cosas legalmente distintas y mezclarlas es donde esto se rompe.

Un alumno que dice "el módulo 3 me resultó claro" no revela nada de su salud. Un
paciente que dice "Elías me ayudó con mi ansiedad" está revelando un dato
sensible de salud propio —que está o estuvo en tratamiento— y encima desde una
relación asimétrica, donde cuesta decirle que no al terapeuta que te lo pide.

Por eso la decisión tomada el 2026-08-09: **el feedback y los eventuales
testimonios se limitan a cursos y formaciones. Terapia individual queda afuera.**

## 2. Marco normativo

Del [Código de Ética de la FePRA](https://colegiodepsicologos.org.ar/wp-content/uploads/2022/08/Codigo-de-Etica-de-la-FePRA.pdf)
(aprobado 1999, reformado 2013), aplican al caso:

- **6.1.1.1** — quien publicita servicios debe incluir nombre y matrícula, y
  abstenerse de publicitar honorarios.
- **6.1.1.2** — la publicidad debe ser mesurada; "en ningún caso deberá ser
  exagerada de modo que tergiverse en algún sentido la índole y **eficacia de
  los servicios**". Un testimonio del tipo "me cambió la vida en tres sesiones"
  cae acá.
- **6.1.1.4** — los psicólogos no participan, como tales, "en avisos que
  recomienden la adquisición o uso de un determinado producto".
- **6.2.2** — nada falso, engañoso o desorientador, "ya sea por lo que ellas
  establecen, transmiten o sugieren, **o por lo que omiten**". Publicar solo las
  cinco estrellas y ocultar el resto entra en "por lo que omiten".
- **5.1.9** — al usar casos como material ilustrativo, extremar los cuidados
  para mantener reserva sobre datos identificatorios.

FePRA **no prohíbe** los testimonios de plano (a diferencia del código de la APA,
que sí veta los de pacientes actuales), pero los encuadra fuerte.

De la Ley 25.326: el consentimiento debe ser **libre, expreso e informado**
(art. 5). Un checkbox genérico enterrado en los términos no alcanza para
publicar la frase de alguien con su nombre.

## 3. Las cuatro variantes evaluadas

| | Qué es | Riesgo | Estado |
|---|---|---|---|
| **A** | Encuesta de fin de curso, privada | Bajo | ✅ Implementada |
| **B** | Testimonios públicos curados en `/cursos` | Medio | Pendiente de decisión |
| **C** | Preguntas/comentarios dentro de una lección | Medio | No planificada |
| **D** | Foro o comunidad entre alumnos | Alto | Descartada |

**Por qué D se descarta:** alumnos hablando entre sí implica revelaciones
personales ante terceros, con el titular del sitio responsable del contenido, y
exige moderación diaria. El costo recurrente recae sobre Elías.

**Por qué C queda para después:** es la puerta por la que entra "a mí me pasa
que cuando me agarra ansiedad…". Si algún día se hace, conviene ampliar lo que
ya existe en `entregas` (`comentario_alumno` / `comentario_instructor`) antes que
construir mensajería nueva — un sistema de mensajes libres chocaría con la regla
de `AGENTS.md` que prohíbe reintroducir chat.

## 4. Etapa A — implementada

Tabla `opiniones_curso` (snippet `2026-08-09-opiniones-curso.sql`):

- Puntuación de 1 a 5 obligatoria, dos textos libres opcionales.
- Una opinión por alumno y curso, editable y borrable por el alumno.
- RLS: cada alumno ve **solo la suya**; el psicólogo ve todas pero **no puede
  insertar, editar ni borrar** — no hay policy que se lo permita, a propósito.
  Poder retocarlas volvería ficción el feedback.
- Es identificada, no anónima: hace falta saber quién escribió para poder pedirle
  permiso después (etapa B), y con cohortes chicas el anonimato sería ficticio de
  todos modos. La UI se lo dice al alumno de forma explícita.

Dónde vive: formulario al pie de `/alumno/programas/[programaId]`, panel de
lectura en `/psicologo/opiniones`.

## 5. Etapa B — pendiente de decisión

El circuito propuesto, si se decide avanzar:

1. Elías ve una opinión que le parece publicable en su panel.
2. Toca "pedir permiso para publicar" y **redacta el texto exacto** que se
   publicaría (recortado, sin nada clínico).
3. Sale un mail al alumno con ese texto textual y dos botones: acepto / no.
4. Si acepta, aparece en `/cursos` con nombre de pila e inicial del apellido.
5. Revocable por el alumno en cualquier momento, sin dar razones.

Lo que hace sólido al diseño: **nada se publica solo**. El consentimiento es
sobre un texto concreto, no genérico — que es lo que pide el art. 5 de la Ley
25.326 y lo que cubre frente al 6.1.1.2 de FePRA.

Campos que haría falta agregar a `opiniones_curso`: `permiso_publicar`
(`no_solicitado` / `solicitado` / `otorgado` / `revocado`) y `texto_publicable`.
No se agregaron ahora para no arrastrar columnas de una etapa que quizás no se
haga.

Si se avanza, revisar también: mostrar el promedio real y no solo las mejores
(por el 6.2.2, "por lo que omiten"), y no publicar la puntuación numérica junto
al precio del curso (roza el 6.1.1.3, que veta usar el precio como propaganda).
