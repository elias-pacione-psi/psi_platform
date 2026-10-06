# Portadas de ebooks — sistema de diseño

Las portadas de la vidriera `/ebooks` viven en el bucket de R2, carpeta
`Biblioteca R2/portadas/` (hasta el 2026-09-05 era `Libros/portadas/`), a 707×942 px (3:4). Este documento fija el sistema de
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

## Portadas de programas (cursos y formaciones)

Los programas que se publican en `/cursos` (checkbox "Publicar en Home" del panel) tienen
su propia portada, con el mismo lienzo de 707×942. Se generan con
`generar-portadas-programas.mjs`, que es la fuente (una escena SVG por programa, mismo
criterio que `generar-ilustraciones.mjs` en la raíz):

```bash
node docs/portadas/generar-portadas-programas.mjs                  # PNG en docs/portadas/programas/
node docs/portadas/generar-portadas-programas.mjs --solo=<slug>    # iterar una sola
node docs/portadas/generar-portadas-programas.mjs --subir --asignar
```

`--subir` las sube a `Biblioteca R2/portadas/programas/` (y verifica el tamaño contra R2
con `HeadObject`, no por el mount de rclone, que sube en segundo plano). `--asignar` guarda
`r2key://…` en `programas.portada_key` de cada programa (por id, ver `PORTADAS` en el script).
Sin esas flags no toca nada externo. Requiere Chrome (`google-chrome`) y las fuentes Poppins
y Lora instaladas.

Hay dos escenas de "operador" a propósito: `operador-socioterapeutico` (el salvavidas) es la del programa
de prueba "Operador Terapeutico", y `operador-socioterapeutico-programa` (la persona en el centro de las
cuatro dimensiones —clínica, familiar, social y espiritual—) es la del programa real "Operador
Socioterapéutico", el que se crea con `scripts/operador-socioterapeutico/deploy.js`.

### Variante "panel ilustrado" (Vuelvo, Estrés Pastoral y las portadas de programas)

Esta variante es distinta de la de Sin Culpa que describe la tabla de arriba — medida sobre
Vuelvo y Estrés Pastoral — y es la que usan los programas:

| Elemento | Valor |
|---|---|
| Banda, nombre, claim, isotipo | idénticos a la tabla de arriba |
| Panel | x44, y158, **620 px de ancho**, radio 38, degradé diagonal `#DFE3E7 → #F3F5F6 → #FFFFFF`. Alto 620 en Vuelvo/Estrés; **568** en los programas (casi todos tienen título de dos líneas) |
| Trazo | tinta `#2F3E46`, **14 px** (10 el secundario), puntas y uniones redondeadas |
| Rellenos | sage `#A8B79F`, sage hondo `#7F95A6`, gris cálido `#D6DEE5`, hueso `#F7F6F3`, marca `#4E6478` — los tokens **actuales** de `globals.css`, no la paleta verde de Sin Culpa |
| "Pausa" | círculo sage r≈48 al 80 % sobre un brillo radial sage (45 % → 0 a 190 px) |
| Firma | tres barras del isotipo (ink al 12 %, 20 px de ancho, paso 44) abajo a la derecha, desde x482 del panel — más a la derecha, la tercera se corta con el borde |
| Personas | cabeza y hombros, **sin cara** (son cualquiera, no personajes) |
| Título | Poppins 700, 48 px (una línea) o 42 px (dos), x54; el script lo baja de a 1 px si una línea pasa de 600 px |
| Subtítulo | **Lora italic 20 px / 28 px**, tinta al 90 %, máximo dos líneas |
| Texto | el bloque título + subtítulo se centra verticalmente entre el panel y el borde inferior |

El título de la portada es el del programa sin el "Curso de" genérico (la portada ya está
en `/cursos`); el subtítulo sale de la descripción corta, en la voz neutra de las demás
portadas ("Aprende…", no voseo).

Para sumar una portada nueva: agregar la escena en `ESCENAS` y la entrada en `PORTADAS`
(slug, archivo, `programaId`, título, subtítulo) y correr con `--solo=<slug>` hasta que
quede bien. En `/cursos` se muestran en 3:4 (miniatura de 48×64 y recuadro de 200×267):
una portada cuadrada o apaisada se recortaría.
