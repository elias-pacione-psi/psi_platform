-- ============================================================================
-- Modelo comercial: ebooks a la venta + desplegable de interés en Consultas
-- Correr en el SQL Editor del proyecto urevyngawcybyrfvahgk ANTES de deployar.
-- https://supabase.com/dashboard/project/urevyngawcybyrfvahgk/sql/new
-- ============================================================================
--
-- Aditiva e idempotente: no borra ni renombra nada, se puede correr con
-- producción como está y correr dos veces sin efecto. Ver docs/plan-modelo-comercial.md
-- para el porqué de este diseño (solo los ebooks se venden online; cursos,
-- formaciones, supervisiones y terapia individual siguen por consulta).

begin;

-- ----------------------------------------------------------------------------
-- 1) Desplegable "¿qué te interesa?" en el formulario público de Consultas
-- ----------------------------------------------------------------------------
-- Antes era un textarea de objetivos sin estructura. Con la landing ofreciendo
-- Cursos/Formaciones/Supervisiones/Terapia como botones de nav, hace falta saber
-- a cuál de esos apunta cada solicitud sin tener que leer el texto libre.

alter table public.solicitudes_registro add column if not exists interes text;

alter table public.solicitudes_registro drop constraint if exists solicitudes_interes_valido;
alter table public.solicitudes_registro add constraint solicitudes_interes_valido
  check (interes is null or interes in ('curso', 'formacion', 'supervision', 'terapia_individual', 'otro'));

-- ----------------------------------------------------------------------------
-- 2) Ebooks: el único producto con compra directa
-- ----------------------------------------------------------------------------
-- portada_key / archivo_key guardan la marca r2key:// (ver utils/r2-marcador.ts),
-- igual que url_recurso en lecciones y biblioteca_recursos — mismo picker
-- (SelectorArchivoR2), misma forma de resolver la URL firmada.

create table if not exists public.ebooks (
  id uuid primary key default gen_random_uuid(),
  slug text not null unique,
  titulo text not null,
  descripcion text,
  portada_key text,
  archivo_key text not null,
  precio_centavos int not null check (precio_centavos > 0),
  moneda text not null default 'ARS' check (moneda = 'ARS'),
  estado text not null default 'borrador' check (estado in ('borrador', 'publicado')),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

alter table public.ebooks enable row level security;

-- Público (incluso sin sesión) ve los publicados: es la vidriera. El psicólogo ve todo.
drop policy if exists "ebooks_select" on public.ebooks;
create policy "ebooks_select" on public.ebooks
  for select to anon, authenticated
  using (estado = 'publicado' or public.es_psicologo());

drop policy if exists "ebooks_all_psicologo" on public.ebooks;
create policy "ebooks_all_psicologo" on public.ebooks
  for all to authenticated
  using (public.es_psicologo())
  with check (public.es_psicologo());

-- ----------------------------------------------------------------------------
-- 3) Órdenes de compra
-- ----------------------------------------------------------------------------
-- email_comprador es la identidad real de la compra, no alumno_id: se puede
-- comprar sin cuenta (decisión del 2026-08-04). alumno_id se completa recién si
-- la persona se registra después con ese mismo email — ver fase 5 del plan.
-- precio_cobrado queda congelado: si el ebook sube de precio, las órdenes viejas
-- conservan lo que se pagó y el comprobante sigue coincidiendo.

create table if not exists public.ordenes (
  id uuid primary key default gen_random_uuid(),
  ebook_id uuid not null references public.ebooks(id) on delete restrict,
  email_comprador text not null,
  alumno_id uuid references public.alumnos(id) on delete set null,
  precio_cobrado int not null,
  moneda text not null default 'ARS',
  estado text not null default 'pendiente' check (estado in ('pendiente', 'pagada', 'fallida', 'reembolsada')),
  proveedor text not null default 'mercadopago',
  referencia_externa text,
  token_descarga text unique,
  created_at timestamptz not null default now(),
  pagada_at timestamptz
);

create index if not exists idx_ordenes_email on public.ordenes (email_comprador);
create index if not exists idx_ordenes_alumno on public.ordenes (alumno_id) where alumno_id is not null;
-- Único parcial (no en toda la tabla): antes de que el proveedor confirme,
-- referencia_externa puede venir null en más de una orden 'pendiente' a la vez.
create unique index if not exists idx_ordenes_referencia_externa
  on public.ordenes (proveedor, referencia_externa) where referencia_externa is not null;

alter table public.ordenes enable row level security;

-- El comprador ve sus propias órdenes solo una vez que tienen alumno_id (recién
-- ahí hay un auth.uid() con quien comparar) — antes de eso, la única forma de
-- consultar el estado de una compra es por el token_descarga, server-side, con
-- service-role (ver fase 4). El psicólogo ve y gestiona todo (reembolsos).
drop policy if exists "ordenes_select_propia" on public.ordenes;
create policy "ordenes_select_propia" on public.ordenes
  for select to authenticated
  using (alumno_id = auth.uid() or public.es_psicologo());

drop policy if exists "ordenes_all_psicologo" on public.ordenes;
create policy "ordenes_all_psicologo" on public.ordenes
  for all to authenticated
  using (public.es_psicologo())
  with check (public.es_psicologo());

-- Trigger de updated_at para ebooks, mismo patrón que entregas.
create or replace function public.tocar_ebook_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at := now();
  return new;
end;
$$;

drop trigger if exists trg_ebooks_updated_at on public.ebooks;
create trigger trg_ebooks_updated_at
  before update on public.ebooks
  for each row execute function public.tocar_ebook_updated_at();

commit;
