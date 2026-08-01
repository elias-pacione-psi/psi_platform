# Qué incorporar a nuestra plataforma

> Lectura del [modelo de dominio de psimammoliti.com](./modelo-de-dominio.md) contra
> nuestro esquema actual (`supabase/schema.sql`, 14 tablas) y las reglas de
> [`AGENTS.md`](../../../AGENTS.md).
>
> **Contexto de la comparación**: psimammoliti es B2C, catálogo abierto, pago por curso,
> ~180 profesionales. Nosotros somos **cerrado por invitación, un instructor, alumnos
> inscriptos por cohorte, sin comercio**. La mayor parte de su producto no aplica. Lo que
> sí aplica es su **modelo pedagógico** y el vertical `Entre Psicos`, que es formación
> profesional a psicólogos y estudiantes — casi exactamente nuestro caso de uso.

---

## 0. Filtro legal — lo que NO se copia

Antes de la lista de features, lo que hay que descartar de forma explícita, porque es la
parte más visible del sitio y la más fácil de importar por inercia:

| Del sitio | Por qué no |
|---|---|
| Los **17 tests** (apego, burnout, ansiedad, depresión post parto, agorafobia, fobias…) | `AGENTS.md`: prohibido implementar escalas clínicas como instrumento. Ellos pueden porque son una clínica con consentimiento y descargo; nosotros somos un LMS. Si un curso enseña sobre PHQ-9, es **materia**, no una función que le corramos al alumno. |
| Resultado de test guardado por usuario | Sería un registro de estado psicológico del alumno en nuestra base → exactamente el campo prohibido por Ley 25.326. |
| **Matching alumno↔profesional** | No aplica (un solo instructor) y arrastra el modelo de datos de consulta clínica. |
| Comunidad abierta / foro entre alumnos | Riesgo alto: un espacio de intercambio en contexto de salud mental deriva en contenido clínico no moderado que quedaría alojado en nuestra base. Si algún día se hace, tiene que ser diseñado aparte y con moderación, no como feature de LMS. |
| Checkout, precios regionales, Stripe, cupones | No hay comercio en el producto. Si el negocio cambia, es un proyecto propio. |
| Blog SEO público, newsletter, lead magnets, registro público | `AGENTS.md`: prohibido registro público de usuarios. El alta es por invitación. |

---

## 1. Alto impacto — el modelo pedagógico

### 1.1 Lección corta con duración declarada

**Lo que hacen**: clases de 3–10 minutos. Un curso "de 2 horas" son 19 clases. La ficha
muestra `19 clases · 2 horas` antes de comprar, y cada clase muestra su duración.

**Lo nuestro**: `lecciones` tiene `titulo`, `tipo_contenido`, `url_recurso`, `orden`.
No hay duración ni descripción.

**Propuesta**:
```sql
alter table public.lecciones
  add column duracion_estimada_min int,
  add column descripcion text;
```
Con eso el alumno ve "Módulo 2 · 6 clases · 34 min" y puede decidir si le entra una clase
antes de salir. Es la diferencia entre un índice y un plan de estudio. Barato de agregar,
cambia por completo la percepción de avance.

### 1.2 Progreso agregado y "continuar donde quedaste"

**Lo que hacen**: *"podrás ver qué lecciones y qué porcentaje del curso has completado en
todo momento"*.

**Lo nuestro**: `progreso_lecciones` guarda el dato crudo pero **no hay ninguna vista ni
función que lo agregue** (verificado: el esquema no define ninguna `view`). Cada pantalla
que quiera mostrar progreso tiene que recalcularlo.

**Propuesta**: una vista con RLS heredado —
```sql
create or replace view public.vista_progreso_programa as
select pa.alumno_id, p.id as programa_id,
       count(l.id)                                   as total_lecciones,
       count(pl.leccion_id)                          as completadas,
       round(100.0 * count(pl.leccion_id) / nullif(count(l.id),0)) as porcentaje
from ...
```
más un `ultima_leccion_vista` para el botón **"Continuar"** en el dashboard del alumno.
Es la feature de retención más rentable de todo el listado.

### 1.3 Taxonomía `Aprende → Practica → Aplica`

**Lo que hacen**: cada curso declara tres tipos de momento pedagógico, y tres dispositivos
de refuerzo **que no se mezclan**: quiz de módulo (evaluar), actividad en clase (aplicar),
mini-test de reflexión (metacognición).

**Lo nuestro**: `lecciones.tipo_contenido` es `text` sin `check`, y mezcla dos cosas
distintas — el **formato** (`r2_video`, `supabase_pdf`, `enlace_externo`,
`texto_markdown`) con el **propósito** (`quiz`, `entrega`). Eso ya se nota en el código,
que ramifica sobre strings sueltos en varios componentes.

**Propuesta**: separar los ejes.
```sql
alter table public.lecciones
  add column proposito text not null default 'aprende'
    check (proposito in ('aprende','practica','aplica'));
```
`tipo_contenido` queda como formato, `proposito` como intención pedagógica. Permite
mostrar el recorrido del módulo y detectar módulos que son 100% video sin práctica.

### 1.4 Constancia de finalización

**Lo que hacen**: certificado al completar, enmarcado explícitamente como
*"reconocer y celebrar tu logro personal"* — no como credencial acreditada. Buena
jugada: entrega el cierre emocional sin prometer validez oficial.

**Lo nuestro**: no existe. Es la pieza que le falta al ciclo — el alumno termina el
programa y no pasa nada.

**Propuesta**: tabla `constancias` con emisión server-side y criterio explícito, alineado
al umbral que ya define `AGENTS.md`:
```sql
create table public.constancias (
  id uuid primary key default gen_random_uuid(),
  alumno_id uuid not null references public.alumnos(id) on delete cascade,
  programa_id uuid not null references public.programas(id) on delete cascade,
  emitida_at timestamptz not null default now(),
  codigo_verificacion text not null unique,
  unique (alumno_id, programa_id)
);
```
Criterio de emisión (server-side, service-role): 100% de lecciones completadas + todos los
quizzes con `aprobado = true` (≥70%) + entregas en estado `revisada`. Nombrarla
**"constancia de participación"**, no "certificado", por la misma razón por la que ellos
bajan la promesa.

---

## 2. Alto impacto — cohortes y contenido en vivo

### 2.1 Liberación progresiva (el formato "reto de N días")

**Lo que hacen**: 17 de sus 62 descargables son **retos de 7 o 10 días** — el formato más
repetido del catálogo. Contenido secuenciado por día, una acción por jornada.

**Lo nuestro**: `cohortes` ya tiene `fecha_inicio` y `fecha_fin`, pero todas las lecciones
de un programa asignado están disponibles desde el minuto cero. Tenemos la mitad del
mecanismo sin usar.

**Propuesta**:
```sql
alter table public.lecciones
  add column disponible_dia int not null default 0;  -- días desde cohortes.fecha_inicio
```
Con RLS que lo respete (`tiene_acceso_programa()` ya es el punto de enganche natural). Da
tres cosas de una: ritmo pedagógico real, cohortes que avanzan juntas, y un motivo
legítimo para que el alumno vuelva cada semana. Para una formación a pastores dictada en
vivo, es probablemente **la feature de mayor retorno de esta lista**.

### 2.2 Grabación de la sesión en vivo como activo del programa

**Lo que hacen**: venden el taller en vivo, entregan la grabación por 30 días, y después
la archivan — los suscriptores tienen *"acceso a los recursos y grabaciones de los meses
previos"*. El mismo contenido se cobra tres veces.

**Lo nuestro**: `agenda_sesiones` tiene `enlace` (videollamada) pero **nada después de que
la sesión termina**. El encuentro en vivo se evapora.

**Propuesta**:
```sql
alter table public.agenda_sesiones
  add column grabacion_url text,          -- path en bucket privado, URL firmada
  add column leccion_id uuid references public.lecciones(id) on delete set null;
```
La sesión en vivo queda enganchada a la lección del módulo que le corresponde, y la
grabación se sirve firmada como cualquier otro material. Cada cohorte que se dicta
enriquece el programa para la siguiente.

### 2.3 Ventana de acceso

**Lo que hacen**: 6 meses de acceso tras la compra. (Con una contradicción real en su
propio sitio: la tarjeta de precio dice "acceso por tiempo ilimitado" y el FAQ dice 6
meses. No copiar *esa* parte.)

**Lo nuestro**: `programas_asignados` es permanente.

**Propuesta**: `alter table public.programas_asignados add column acceso_hasta date;`
(`null` = sin vencimiento, comportamiento actual). Útil para cerrar el acceso de una
cohorte que terminó sin tener que borrar la asignación y perder el historial de progreso.
Requiere sumar la condición a `tiene_acceso_programa()`.

---

## 3. Impacto medio

### 3.1 Perfil del instructor / facilitador invitado

**Lo que hacen**: 180 fichas con `nombre + inicial`, título, universidad, bio y foto. Y en
`Entre Psicos` traen **facilitadores externos** — la masterclass de dilemas legales la
dicta un abogado, no un psicólogo.

**Lo nuestro**: un `alumno` con `rol = 'psicologo'` tiene email, nombre, teléfono. Sin
bio, sin título, sin foto. Y el modelo asume un único instructor.

**Propuesta**: `titulo_profesional`, `bio`, `foto_url` en `alumnos`, y — si el proyecto de
formación va a tener invitados — `programas.instructor_id` o una tabla `facilitadores`
desacoplada de `auth.users` (un invitado que dicta un módulo no necesariamente necesita
cuenta). Nótese además su decisión de **mostrar sólo la inicial del apellido**: privacidad
del profesional por default, vale la pena adoptarla.

### 3.2 Materiales anclados al programa, no sólo al alumno

**Lo que hacen**: cada curso incluye un **workbook** de actividades, y cada masterclass un
"qué te vas a llevar" con entregables concretos (modelo de consentimiento, protocolo).

**Lo nuestro**: `biblioteca_recursos` + `recursos_asignados` asigna recursos **por
alumno**. No hay forma de decir "este PDF es el workbook del Módulo 3" — hay que asignarlo
alumno por alumno.

**Propuesta**:
```sql
create table public.recursos_programa (
  recurso_id uuid not null references public.biblioteca_recursos(id) on delete cascade,
  programa_id uuid not null references public.programas(id) on delete cascade,
  modulo_id uuid references public.modulos(id) on delete cascade,
  primary key (recurso_id, programa_id)
);
```
El acceso se resuelve con `tiene_acceso_programa()`, que ya existe. Elimina trabajo manual
de asignación y hace que inscribir a un alumno le entregue el material completo.

### 3.3 FAQ por programa

**Lo que hacen**: FAQ en cada ficha de curso (3–5 preguntas específicas) **más** un FAQ
global de 16 preguntas que responde todo lo operativo: cómo accedo, cuánto dura, en qué
dispositivos, qué obtengo al terminar, a quién escribo si falla.

**Lo nuestro**: no existe. Cada duda operativa es un mensaje al instructor.

**Propuesta**: tabla `programa_faq (programa_id, pregunta, respuesta, orden)`. Barato,
y descarga soporte manual del psicólogo — que es tiempo clínico.

### 3.4 Política de reintentos del quiz

**Lo nuestro**: `quiz_intentos` acumula intentos sin límite ni política declarada. El
alumno puede reintentar hasta acertar por fuerza bruta, lo que vacía el umbral del 70%.

**Propuesta**: `programas.max_intentos_quiz int` (null = ilimitado) validado en
`src/utils/supabase/quiz.ts`, que ya es el punto server-side de corrección. Y mostrarle al
alumno el intento vigente. No es una feature de ellos — es una deuda nuestra que se ve al
comparar.

### 3.5 Huso horario en la agenda

**Lo que hacen**: toda sesión en vivo se anuncia en tres husos —
`18:00 ARG / 15:00 CDMX / 16:00 BOG`.

**Lo nuestro**: `agenda_sesiones.fecha_hora` es `timestamptz`, o sea el dato está bien
guardado. Es un tema de presentación: renderizar en la zona del navegador y mostrar el
huso explícito. Si la formación tiene alumnos fuera de Argentina, deja de ser cosmético.

---

## 4. No hacer todavía

| Idea | Por qué esperar |
|---|---|
| Lección de muestra pública (`es_muestra`) | Sólo sirve con catálogo público. Hoy el alta es por invitación; no hay a quién mostrarle la muestra. |
| Membresía / suscripción | Ellos mismos la tienen en waitlist. Requiere comercio, que no tenemos. |
| Badges, rachas, ranking entre alumnos | Gamificación competitiva en formación sobre salud mental tiene mal encaje. El progreso por porcentaje (§1.2) ya da el refuerzo sin comparar personas. |
| Comunidad / "cafecito" | Ver filtro legal. Aparte, necesita moderación activa que hoy nadie puede sostener. |

---

## 5. Orden sugerido

1. **§1.1 + §1.2** — duración de lección y vista de progreso con "Continuar". Cambio chico,
   efecto inmediato y visible para el alumno.
2. **§2.1** — liberación progresiva por día de cohorte. Es la que más se parece a cómo se
   dicta realmente una formación.
3. **§1.4** — constancia de finalización. Cierra el ciclo del alumno.
4. **§3.2 + §3.3** — materiales por programa y FAQ. Sacan carga operativa del instructor.
5. **§2.2** — grabaciones enganchadas al programa. Empieza a capitalizar cada cohorte
   dictada.
6. Resto según haga falta.

Todo lo anterior es **schema + RLS**: cada tabla nueva con RLS habilitado desde el día uno
y policies con scope (`auth.uid()`, `es_psicologo()`, `tiene_acceso_programa()`), nunca
`qual = true`.
