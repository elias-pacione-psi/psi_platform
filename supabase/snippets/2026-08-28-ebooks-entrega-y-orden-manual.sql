-- ============================================================================
-- ebooks: registrar la venta por link manual + mail de entrega
-- Correr en el SQL Editor del proyecto urevyngawcybyrfvahgk.
-- https://supabase.com/dashboard/project/urevyngawcybyrfvahgk/sql/new
-- ============================================================================
--
-- Bug reportado 2026-08-28: Lucas pagó el ebook "Vuelvo" ($20.000, operación de
-- Mercado Pago #174999145029) y no pasó nada — ni redirect de vuelta al sitio,
-- ni PDF, ni registro de la venta en el panel. `public.ordenes` estaba vacía:
-- CERO filas desde que existe la tabla.
--
-- Causa: los 5 ebooks publicados tienen `link_pago` cargado, y el botón
-- "Comprar" priorizaba ese link por sobre el flujo automático. El link manual
-- (mpago.la) es una URL estática del proveedor: no lleva external_reference, no
-- lleva back_urls y no dispara el webhook. Se iba directo a pagar sin crear
-- orden, así que la plata entraba a Mercado Pago y del lado de la plataforma no
-- quedaba nada — ni a quién entregarle, ni qué entregarle, ni forma de volver.
--
-- El arreglo es de código (la orden se crea ANTES de mandar a pagar, y el
-- psicólogo confirma el pago desde Ventas). Esta migración cubre lo único que
-- el código no puede: que `emails_enviados` acepte el mail de entrega, cuyo
-- destinatario puede no tener cuenta.
--
-- Aditiva e idempotente: no borra ni renombra nada, se puede correr dos veces
-- sin efecto.

begin;

-- ----------------------------------------------------------------------------
-- 1) emails_enviados: aceptar el mail de entrega del ebook
-- ----------------------------------------------------------------------------
-- Se puede comprar un ebook sin cuenta (decisión del 2026-08-04), así que el
-- mail de "ya podés descargarlo" no siempre tiene un alumno al que colgarse.
-- La trazabilidad no se pierde: destinatario_email guarda a dónde se mandó y
-- referencia_id apunta a la orden.
alter table public.emails_enviados
  alter column alumno_id drop not null;

alter table public.emails_enviados
  drop constraint if exists emails_enviados_tipo_check;

alter table public.emails_enviados
  add constraint emails_enviados_tipo_check check (tipo in (
    'asignacion_programa', 'entrega_revisada', 'clase_agendada', 'recordatorio_clase',
    'ebook_entregado'
  ));

comment on column public.emails_enviados.alumno_id is
  'Null cuando el destinatario no tiene cuenta (tipo = ebook_entregado: se compra sin registrarse). En ese caso la identidad del envío es destinatario_email + referencia_id (la orden).';

-- ----------------------------------------------------------------------------
-- 2) ordenes.proveedor: dejar asentado que 'manual' es un valor válido
-- ----------------------------------------------------------------------------
-- La columna ya existía con default 'mercadopago' y sin check constraint, así
-- que 'manual' entra sin tocar el schema. Se documenta para que el valor no
-- parezca un dato sucio cuando aparezca en las consultas.
comment on column public.ordenes.proveedor is
  'mercadopago = checkout automático (Checkout Pro): lo confirma el webhook. manual = link de pago cargado a mano en ebooks.link_pago: no hay webhook, lo confirma el psicólogo desde Ventas (confirmarPagoOrden).';

-- ----------------------------------------------------------------------------
-- 3) Un link de pago manual por ebook
-- ----------------------------------------------------------------------------
-- "Pastor Alerta" y "Consulta Cero" tenían los dos el mismo link
-- (https://mpago.la/1cZFyda): quien compraba Pastor Alerta pagaba por la caja
-- de Consulta Cero. Como el cotejo del pago lo hace una persona mirando
-- importes en Mercado Pago, dos libros con la misma caja hacen imposible saber
-- cuál se vendió.
--
-- El índice es parcial (solo where link_pago is not null) porque la mayoría de
-- los ebooks pueden no tener link, y varios null no son un choque.
--
-- OJO: si esto falla con "could not create unique index", es que todavía hay
-- links repetidos en la tabla. Correr primero la consulta del final del archivo
-- para ver cuáles, corregirlos en el admin (/psicologo/ebooks) y reintentar.
create unique index if not exists idx_ebooks_link_pago_unico
  on public.ebooks (link_pago) where link_pago is not null;

commit;

-- ============================================================================
-- Verificación (correr después, fuera de la transacción)
-- ============================================================================
-- Links de pago repetidos — tiene que devolver 0 filas:
--   select link_pago, count(*), string_agg(titulo, ' / ')
--   from public.ebooks where link_pago is not null
--   group by link_pago having count(*) > 1;
--
-- Que el tipo nuevo esté aceptado — tiene que listar 'ebook_entregado':
--   select pg_get_constraintdef(oid) from pg_constraint
--   where conname = 'emails_enviados_tipo_check';
--
-- Órdenes pendientes de confirmar (las que esperan al psicólogo):
--   select id, email_comprador, estado, proveedor, created_at
--   from public.ordenes where estado = 'pendiente' order by created_at desc;
