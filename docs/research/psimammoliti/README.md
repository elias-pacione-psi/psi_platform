# Relevamiento: psimammoliti.com

Análisis del competidor/referente más grande en formación de psicología en español,
hecho por scraping del sitio público el **2026-07-30**.

| Documento | Contenido |
|---|---|
| [`modelo-de-dominio.md`](./modelo-de-dominio.md) | Qué es el producto, mapa de las 727 URLs, entidades y campos inferidos, diagrama ER, decisiones de producto observadas. |
| [`oportunidades.md`](./oportunidades.md) | Qué incorporar a nuestra plataforma, contrastado contra `supabase/schema.sql` y las reglas de `AGENTS.md`. Incluye el filtro de lo que **no** se copia. |
| [`data/sitemap-urls.txt`](./data/sitemap-urls.txt) | Las 727 URLs del `sitemap.xml`. |
| [`data/cursos.json`](./data/cursos.json) | Parseo estructurado de las 8 fichas de curso (precios, módulos, clases, duración). |

## Resumen en una línea

Su negocio (terapia B2C + venta de cursos + lead magnets) casi no aplica al nuestro, pero
su **modelo pedagógico** —lección de 3–10 min, progreso porcentual visible, triple
refuerzo, constancia de finalización, contenido secuenciado en retos de N días— sí, y su
vertical profesional `Entre Psicos` es prácticamente nuestro caso de uso.

**Cuidado**: sus 17 tests psicológicos son la parte más visible del sitio y la que
`AGENTS.md` prohíbe explícitamente replicar. Ver el §0 de `oportunidades.md` antes de
importar nada.
