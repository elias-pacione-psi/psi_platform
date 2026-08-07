-- ============================================================================
-- ebooks: link de pago manual por libro
-- Correr en el SQL Editor del proyecto urevyngawcybyrfvahgk.
-- https://supabase.com/dashboard/project/urevyngawcybyrfvahgk/sql/new
-- ============================================================================
--
-- Bug reportado 2026-08-07: el botón "Comprar" usaba un único link de Mercado
-- Pago hardcodeado en el frontend para TODOS los ebooks (ver commit bef405c).
-- Cada libro tiene su propio precio (precio_centavos) pero no tenía forma de
-- tener su propio link de pago.
--
-- `link_pago` es texto libre sin restricción de host: hoy se carga a mano un
-- link de Mercado Pago, pero puede ser de Ualá u otro proveedor a futuro — no
-- hay que tocar el schema para eso, solo cargar el link en el admin.
--
-- Aditiva e idempotente: no borra ni renombra nada, se puede correr dos veces
-- sin efecto.

begin;

alter table public.ebooks
  add column if not exists link_pago text;

comment on column public.ebooks.link_pago is
  'Link de pago manual (Mercado Pago, Ualá, etc.) cargado a mano por el psicólogo para este ebook puntual. Si es null, se usa el flujo automático de iniciarCompraEbook (cuando pagosHabilitados) o se muestra "Comprar — próximamente".';

-- Reemplaza el grant column-level de 2026-08-05-hardening-auditoria.sql (esa
-- migración excluyó a propósito archivo_key de lo que ve `anon`; hay que
-- mantener esa exclusión acá y sumar únicamente link_pago, que sí es público
-- a propósito: lo necesita la página pública del ebook para armar el botón.
grant select (id, slug, titulo, descripcion, portada_key, precio_centavos, moneda, estado, created_at, link_pago)
  on public.ebooks to anon;

-- Preserva el link de prueba que ya se había validado a mano en esta sesión
-- (redirige a mercadopago.com.ar/checkout/... con preference-id real) para no
-- perder el estado ya probado del ebook "Test" al pasar a la columna nueva.
update public.ebooks set link_pago = 'https://mpago.la/2CgXKwA' where slug = 'test';

commit;
