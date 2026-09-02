# Auditoría de la base

Dos scripts que se corren en el SQL Editor del proyecto y responden dos preguntas
distintas. Hay que correr los dos: uno solo no alcanza.

| Archivo | Qué pregunta | ¿Toca datos? |
|---|---|---|
| [`01-auditoria-estatica.sql`](01-auditoria-estatica.sql) | ¿Están puestos los candados? | No. Solo lectura. |
| [`02-tests-rls-dinamica.sql`](02-tests-rls-dinamica.sql) | ¿Los candados aguantan? | Crea datos de prueba y los deshace en la misma corrida. |

El primero lee el catálogo de Postgres: qué tablas tienen RLS, qué policies hay
escritas, quién tiene GRANT sobre qué, qué funciones son `security definer`. Es un
inventario.

El segundo **se hace pasar por un alumno** y prueba. Crea tres personas de mentira
(dos alumnos y un psicólogo), un curso asignado y uno ajeno, una entrega, un quiz,
una compra — y después intenta, con la sesión de uno de los alumnos, leer y escribir
todo lo que no debería poder. Es la diferencia entre revisar que la puerta tenga
cerradura y probar el picaporte.

Hacen falta los dos porque una policy puede estar impecablemente escrita y aun así
no cerrar nada: las policies se combinan con OR entre sí, y cualquiera de ellas que
sea demasiado amplia gana. Eso no se ve leyendo una policy sola.

## Cómo correrlos

1. Abrir el [SQL Editor](https://supabase.com/dashboard/project/urevyngawcybyrfvahgk/sql/new).
2. Pegar el contenido de un archivo completo y ejecutar.
3. Leer la primera columna. Repetir con el otro archivo.

Cada script devuelve **una sola tabla**, ordenada con lo peor arriba. Si la primera
fila dice `OK` (estático) o `PASA` (dinámico), no quedó nada abierto.

## Cómo leer los resultados

**01 — estático.** Una fila por control, `hallazgos` dice cuántos objetos incumplen
y `detalle` cuáles.

- `CRITICO` — agujero real o riesgo legal. No deployar así.
- `ALTO` — un invariante se rompió; la app puede estar mostrando datos mal.
- `MEDIO` / `BAJO` — deuda que todavía no explota, prolijidad, performance.
- `INFO` — inventario para mirar a ojo (la superficie pública, quién es psicólogo).
  No es un hallazgo: es lo que hay que poder aprobar de un vistazo.
- `OK` — el control pasó.

**02 — dinámico.** Una fila por prueba.

- `PASA` — el candado aguantó.
- `FALLA` — no aguantó. `esperado` vs `obtenido` dice exactamente qué pasó.
- `NOTA` — comportamiento real que conviene conocer, no necesariamente un bug.

En `obtenido`, un `-1` significa "la consulta ni siquiera fue permitida" (falta el
GRANT; PostgREST devolvería 401). Es distinto de `0`, que es "la consulta corrió y
la RLS no dejó pasar ninguna fila" (PostgREST devuelve lista vacía). Los dos son
cerrado; el `-1` cierra la puerta un paso antes.

**Las fallas se contagian.** Si una policy de más deja que el alumno de prueba se
haga psicólogo, a partir de ahí puede hacer casi todo y van a fallar veinte pruebas
que en realidad son la misma. Arreglar de arriba hacia abajo y volver a correr.

## Por qué el script 02 se puede correr en producción

Todo pasa dentro de una subtransacción que termina siempre con un `raise exception`
deliberado. Los datos de prueba se crean, se usan y se deshacen antes de que la
función devuelva la primera fila — no depende de que te acuerdes de hacer `rollback`,
ni de que la corrida termine bien: si algo revienta a la mitad, el rollback pasa
igual. Los resultados llegan porque las variables de PL/pgSQL viven en memoria y no
se revierten con la transacción.

Después de correrlo, `select count(*) from auth.users` da lo mismo que antes.

Los mails de prueba usan el dominio `@auditoria.invalid`. `.invalid` está reservado
por RFC 2606 y no puede existir: ni por accidente le llega un correo a alguien.

## Mantenerlos vivos

Los dos scripts tienen listas explícitas de lo que esperan encontrar:

- `tablas_conocidas` (01) — tabla nueva que no esté acá sale como hallazgo `ALTO`.
  Es a propósito: obliga a decidir sus policies antes de darla por hecha.
- `funciones_esperadas` y `triggers_esperados` (01) — si algo desaparece, se avisa.
- Las fixtures de 02 — al agregar una tabla con datos de alumno, agregarle su prueba
  de aislamiento acá. Si no, esa tabla queda sin nadie que le pruebe el picaporte.

Los controles se validaron rompiendo la base a propósito en una copia local
(Postgres 17 con el mismo esquema) y verificando que cada uno se encienda: sin eso,
un control con un error de tipeo da `OK` para siempre y no protege nada.
