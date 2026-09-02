# Portadas de ebooks — sistema de diseño

Las portadas de la vidriera `/ebooks` viven en el bucket de R2, carpeta
`Libros/portadas/`, a 707×942 px (3:4). Este documento fija el sistema de
diseño medido al píxel sobre las portadas existentes (Primer Respiro, Kit de
Emergencia para la Ansiedad, Pastor Alerta, Consulta Cero, Vuelvo, Estrés
Pastoral y Sin Culpa) para que la próxima portada salga de la misma familia.

## El sistema (medido sobre las 3 más recientes)

| Elemento | Valor |
|---|---|
| Tamaño | 707 × 942 px |
| Banda superior | `#2F3E46`, alto fijo **134 px**, sin gradiente |
| Fondo del cuerpo | crema `#F1F0EB` |
| Nombre en banda | `Elias Pacione` — Poppins 600, 26 px, `#F7F6F3`, caja de tinta x42–213, y42–62 |
| Claim en banda | `Psicología con sentido.` — Lora italic, 17 px, `#AAB2B6`, y83–99 |
| Isotipo en banda | `public/brand/mark.png` recoloreado a `#EEEFF0`, arriba a la derecha, 83 × 54 px (x583–666, y42–95) |
| Título | abajo a la izquierda, x54, tinta de la banda `#2F3E46`, Poppins 700 (caja de tinta y785–833) |
| Subtítulo | abajo a la izquierda, x54, Poppins 400, 18 px / línea 30 px, `#4D595F`, 1–2 líneas (y850–895) |
| Ilustración central | zona libre y~150–760, paleta sage/marca/gris (`#A8B7A0`, `#54685B`, `#D8D5CF`) |

Las 4 portadas anteriores (2026-08-06) comparten la misma estructura pero con
el lockup centrado en la banda y el título centrado; las 3 nuevas (Vuelvo,
Estrés Pastoral, Sin Culpa) van alineadas a la izquierda y son el formato
vigente.

## Cómo se genera

`sin-culpa-fuente.html` es la fuente de la portada de Sin Culpa (HTML+CSS
autocontenido: el isotipo y la sombra de hoja van embebidos en base64).
Se renderiza con Chrome headless a 2× y se baja a 707×942:

```bash
google-chrome --headless=new --disable-gpu --no-sandbox \
  --user-data-dir=/tmp/chrome-perfil --hide-scrollbars \
  --force-device-scale-factor=2 --window-size=707,942 \
  --screenshot=render2x.png "file://$PWD/sin-culpa-fuente.html"
python3 -c "from PIL import Image; Image.open('render2x.png').convert('RGB').resize((707,942), Image.LANCZOS).save('portada.png')"
```

Para la próxima portada: cambiar título y subtítulo en el HTML, mantener todo
lo demás (banda, lockup, tipografías, paleta), y usar una ilustración central
plana en la paleta de marca.

## Archivos

- `Sin culpa.png` — portada final de Sin Culpa (la que va al bucket, mismo
  nombre que la que está para reemplazarla).
- `Sin culpa (IA anterior).png` — backup de la versión que ya estaba en el
  bucket (subida el 2026-08-28, generada por IA junto al PDF).
- `sin-culpa-fuente.html` — fuente editable de la portada.
