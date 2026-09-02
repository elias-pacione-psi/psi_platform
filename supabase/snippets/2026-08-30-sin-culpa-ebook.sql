-- ============================================================================
-- Alta del ebook "Sin Culpa" a la vidriera — $20.000 ARS, publicado
-- Correr en el SQL Editor del proyecto urevyngawcybyrfvahgk.
-- https://supabase.com/dashboard/project/urevyngawcybyrfvahgk/sql/new
-- ============================================================================
--
-- Idempotente: si el slug ya existe actualiza los campos de la vidriera
-- (no crea duplicados ni toca órdenes). Los dos archivos ya están en el
-- bucket de R2:
--   PDF     -> r2key://Libros/Sin culpa.pdf           (subido el 2026-08-28)
--   portada -> r2key://Libros/portadas/Sin culpa.png  (reemplaza la versión
--              generada por IA del 28/08 por la portada con el sistema de
--              diseño de la familia — backup local en docs/portadas/)
--
-- El precio se congela en cada orden al comprar (ordenes.precio_cobrado),
-- así que subir el precio más adelante no afecta a quien ya compró.
--
-- link_pago queda NULL a propósito: sin link, el botón de compra muestra
-- "Próximamente" (mismo comportamiento que el resto de los ebooks antes de
-- cargar su link de Mercado Pago). Cuando haya link para este libro, se
-- carga en Panel → ebooks → editar, o acá mismo con un update.

insert into public.ebooks (slug, titulo, descripcion, portada_key, archivo_key, precio_centavos, moneda, estado)
values (
  'sin-culpa',
  'Sin Culpa',
  'Aprende a decir «NO» a tareas y solicitudes abusivas en menos de 60 segundos, protegiendo tu tiempo libre y tu reputación profesional desde el primer día.',
  'r2key://Libros/portadas/Sin culpa.png',
  'r2key://Libros/Sin culpa.pdf',
  2000000,           -- $20.000 ARS
  'ARS',
  'publicado'
)
on conflict (slug) do update
set
  titulo        = excluded.titulo,
  descripcion   = excluded.descripcion,
  portada_key   = excluded.portada_key,
  archivo_key   = excluded.archivo_key,
  precio_centavos = excluded.precio_centavos,
  estado        = excluded.estado,
  updated_at    = now();

-- Verificación: tiene que devolver la fila con precio 2000000 y estado publicado.
select slug, titulo, precio_centavos, moneda, estado, portada_key, archivo_key
from public.ebooks where slug = 'sin-culpa';
