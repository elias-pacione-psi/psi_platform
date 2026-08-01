# Material de la formación pastoral — análisis y encaje con la plataforma

> Fuente: 16 PDFs en `~/Descargas/WhatSie_OCR` (~117 páginas), cruzados con
> `proyecto formacion psi pastores.pdf` (Lic. Elias Pacione, Dignos — Quilmes).
> Análisis del 2026-07-30.

---

## 1. Qué es el material

Es el cuerpo teórico del **Programa de Formación: Psicología Aplicada a la Tarea
Pastoral** — 8 semanas, **4 módulos virtuales + 4 encuentros presenciales** (sábados de
8 a 12 en Dignos), sobre TCC, TREC, ACT y habilidades de comunicación.

El objetivo declarado es capacitar a líderes religiosos en **detección temprana,
contención inicial y derivación responsable**, marcando el límite con la psicoterapia.
No los forma como terapeutas: los forma para reconocer cuándo *no* les corresponde.

---

## 2. Estructura reconstruida

Los nombres de archivo codifican `{tema}.{título}` y se agrupan en cuatro secuencias que
reinician en 1. Dos archivos traen el módulo escrito adentro, y eso ancla todo el mapeo:

- `2. PAP.pdf` abre con **"Módulo 1 — Tema 2"**
- `modulo 4 tema 3.pdf` es el tema de burnout

Con esos dos anclajes, la reconstrucción es:

### Módulo 1 · Marco ético, crisis y escucha — 5 temas
| # | Tema | Archivo |
|---|---|---|
| 1 | Límites entre el Consejo Pastoral y la Psicoterapia | `1.diferencias y alcances.pdf` |
| 2 | Protocolo ABCDE de Primeros Auxilios Psicológicos | `2. PAP.pdf` ✅ *confirmado* |
| 3 | Plan de Seguridad para la Prevención del Riesgo Suicida | `3.protocolo riesgo suicida.pdf` |
| 4 | Plan de Seguridad para Situaciones de Violencia Interpersonal | `4.protocolo violencia.pdf` |
| 5 | La Escucha Activa como Herramienta de Intervención | `5.escucha activa.pdf` |

### Módulo 2 · Modelo cognitivo (TCC / TREC) — 3 temas
| # | Tema | Archivo |
|---|---|---|
| 1 | Aplicación del Modelo TREC en la Consejería Pastoral | `1.TREC.pdf` |
| 2 | Distorsiones Cognitivas en el Liderazgo Pastoral | `2.distorsiones cognitivas.pdf` |
| 3 | La Técnica de la Flecha Descendente | `3.flecha descendente.pdf` |

### Módulo 3 · Aceptación y Compromiso (ACT) — 4 temas
| # | Tema | Archivo |
|---|---|---|
| 1 | Evitación Experiencial | `1 evitacion experiencial.pdf` |
| 2 | Defusión Cognitiva | `2 defusion cognitiva.pdf` |
| 3 | El proceso de valoración en ACT | `3 valoracion act.pdf` |
| 4 | Metáforas terapéuticas (10 metáforas) | `4 metaforas.pdf` |

### Módulo 4 · Comunicación y autocuidado — 4 temas
| # | Tema | Archivo |
|---|---|---|
| 1 | Comunicación Asertiva en el Liderazgo Cristiano | `1 asertividad.pdf` + anexo `guion 4 pasos.pdf` |
| 2 | **⚠️ FALTA** | — |
| 3 | Burnout y autocuidado del líder | `modulo 4 tema 3.pdf` ✅ *confirmado* |
| 4 | El Método Socrático | `4 metodo socratico.pdf` |

### Dos observaciones sobre el mapeo

**Falta el Tema 2 del Módulo 4.** No es una suposición: el módulo tiene tema 1
(asertividad), tema 3 (burnout, confirmado en el propio archivo) y tema 4 (método
socrático). El hueco es real. Por el índice del proyecto, lo más probable es que sea el
tratamiento de los **estilos pasivo / agresivo / asertivo aplicado a conflictos
ministeriales** — pero hay que pedirlo, no inventarlo.

**`4 metaforas.pdf` es el único archivo con ubicación dudosa.** Por numeración cae como
Tema 4 del Módulo 3 (ACT), y ACT usa metáforas intensivamente. Pero su contenido son 10
metáforas de autocuidado y límites ("El Huerto Olvidado", "El Filtro del Agua"), y el
proyecto las lista bajo el eje 6, *Autocuidado y prevención del burnout*. Lo dejé en
Módulo 3 siguiendo la numeración; moverlo a Módulo 4 es cambiar una línea del seed.

---

## 3. Chequeo de filosofía

### 3.1 Lo que encaja bien

El programa es **formación profesional a adultos**, no atención clínica. El alumno es un
líder pastoral que cursa; su modelo es cuenta + contenido asignado + agenda + progreso
educativo — exactamente lo que define `AGENTS.md`. Además:

- Los **4 encuentros presenciales** ya están modelados: `agenda_sesiones` tiene
  `tipo = 'presencial'` y `lugar`, y el comentario del esquema literalmente dice
  `"Dignos, Quilmes"`. Esto se diseñó pensando en esta formación.
- El **trabajo final integrador** cae en `entregas` con `comentario_instructor` como
  devolución pedagógica.
- Los **quizzes de comprensión** con umbral 70% son exactamente el dispositivo permitido.
- Los PDFs van al bucket privado `materiales`, servidos con URL firmada. ✅
- Los role-plays de los encuentros usan **casos ficticios** — el proyecto lo dice de forma
  explícita ("el docente distribuye tarjetas con casos ficticios"). Es la decisión
  correcta y hay que preservarla.

**Que el material enseñe sobre burnout, riesgo suicida o distorsiones cognitivas no es un
problema**: es materia, igual que PHQ-9/GAD-7 en la regla de `AGENTS.md`. El problema
aparece sólo si alguna de esas cosas se convierte en una *función* de la plataforma.

### 3.2 Lo que hay que sostener a raya

Hay un tercer actor en todo el material — el **feligrés / aconsejado** — que no es usuario
de la plataforma y **no debe existir como entidad en el esquema**. Es la línea que ordena
todo lo demás. Tres puntos concretos donde el material empuja hacia cruzarla:

#### a) El "termómetro del desgaste" (Módulo 4, Tema 3) — riesgo alto

El material pide *"que cada participante califique **semanalmente**, en una escala de 0 a
10"*: energía física, energía emocional, motivación para servir, calidad del descanso,
cercanía con Dios, satisfacción con la vida familiar y estrés percibido.

Eso es una **escala autoaplicada de estado emocional, con seguimiento longitudinal**. Si
se implementa como formulario de la plataforma, terminamos con una serie temporal del
estado anímico y espiritual de cada alumno en nuestra base — que es precisamente el campo
prohibido por Ley 25.326 y por `AGENTS.md`.

> **Decisión: va como material descargable (PDF/planilla), nunca como formulario.** El
> alumno lo completa en papel o en su propio archivo. La plataforma registra "vio la
> lección", no el puntaje. Es también lo que hace psimammoliti con sus tests: los sirve,
> no los guarda contra el perfil del usuario.

#### b) Los Planes de Seguridad (Módulo 1, Temas 3 y 4) — riesgo alto

El plan de riesgo suicida tiene 6 pasos e incluye señales de advertencia personales, red
de apoyo **con nombres y teléfonos**, servicios de emergencia y restricción de medios. El
de violencia incluye "constancias o denuncias previas".

Se enseña la técnica; **no se construye jamás un "completá tu plan de seguridad" en la
plataforma**. Almacenaría datos de riesgo vital y PII de terceros que nunca consintieron.
Van como plantilla descargable, igual que el termómetro.

#### c) La entrega del trabajo final — riesgo medio, y accionable ya

La rúbrica pide un **"Diagnóstico Comunitario"** de la congregación propia y una red de
derivación. A diferencia de los role-plays, acá no hay casos ficticios: el alumno va a
describir su comunidad real. Sin una consigna explícita, el bucket `entregas` puede
terminar recibiendo situaciones identificables de feligreses.

> **Decisión: la consigna de la entrega tiene que exigir anonimización.** Está redactada
> así en el seed (`supabase/seed-formacion-pastoral.sql`), con la advertencia dentro del
> enunciado que ve el alumno. Es la mitigación más barata y la única que actúa antes de
> que el dato entre.

#### d) La evaluación del role-play — riesgo bajo, pero no digitalizar

En el Encuentro 1 el "feligrés" califica de 1 a 10 si se sintió escuchado, comprendido,
respetado y contenido. Es evaluación entre pares sobre desempeño empático. Que quede en
el presencial: digitalizarlo crea un legajo de valoraciones personales por alumno.

---

## 4. Huecos del modelo que este material deja a la vista

Cosas que el programa necesita y el esquema hoy no da:

| # | Necesidad del material | Estado actual | Qué falta |
|---|---|---|---|
| 1 | **Trabajo final grupal** ("trabajo grupal institucional") | `entregas` tiene `unique (leccion_id, alumno_id)` | Una entrega por alumno. No hay forma de que un grupo entregue una vez ni de corregir una sola vez. Cada integrante sube copia y el instructor corrige N veces. |
| 2 | **Rúbrica de 5 criterios × 20 pts** | `entregas` sólo tiene `comentario_instructor` | Sin puntaje ni criterios. La corrección con rúbrica hoy no se puede registrar. |
| 3 | **Anexos de una lección** (`guion 4 pasos` cuelga de asertividad) | Lección = 1 `url_recurso` | Un tema con material principal + anexo necesita dos lecciones sueltas, o la tabla `recursos_programa` propuesta en el análisis de psimammoliti. |
| 4 | **Ritmo de 8 semanas** | Todo disponible desde el día uno | La liberación progresiva por día de cohorte (§2.1 de [`oportunidades.md`](../research/psimammoliti/oportunidades.md)) es justo lo que este programa necesita. |
| 5 | **Duración por tema** | `lecciones` no tiene duración | Sin señal de cuánto cuesta cada tema (van de 2 a 12 páginas — bastante desparejo). |

El (1) y el (2) son los que bloquean de verdad: sin ellos el trabajo final integrador, que
es el instrumento de acreditación del programa, no se puede administrar bien.

---

## 5. Qué se cargó

[`supabase/seed-formacion-pastoral.sql`](../../supabase/seed-formacion-pastoral.sql) crea
el programa completo: 4 módulos, 16 lecciones de contenido, 4 quizzes de comprensión, la
entrega del trabajo final con consigna anonimizada, la cohorte de 8 semanas y los 4
encuentros presenciales agendados.

Los PDFs **no** se suben desde el seed: las lecciones quedan con `url_recurso` vacío y el
instructor adjunta cada archivo desde el panel (`/psicologo/programas/{id}`), que ya sube
a R2 y completa el campo. Verificado que el visor tolera `url_recurso` vacío — la lección
se muestra con su título y el botón de completar, sin romper.
