import os, sys, json, glob, subprocess
import fitz # PyMuPDF

SCRIPT_DIR = os.path.dirname(os.path.abspath(__file__))
FONTS_DIR = os.path.join(SCRIPT_DIR, "fonts")
POPPINS_REG = os.path.join(FONTS_DIR, "Poppins-Regular.ttf")
POPPINS_MED = os.path.join(FONTS_DIR, "Poppins-Medium.ttf")
POPPINS_BOLD = os.path.join(FONTS_DIR, "Poppins-Bold.ttf")

TEMP_DIR = os.path.join(SCRIPT_DIR, "temp_manuals")
OUT_DIR = os.path.join(SCRIPT_DIR, "out")
os.makedirs(TEMP_DIR, exist_ok=True)
os.makedirs(OUT_DIR, exist_ok=True)

R2_BASE = "/home/lucas_fedora/R2_Bucket_Psicologo/Formaciones"

with open(os.path.join(SCRIPT_DIR, "cursos_metadata.json"), "r", encoding="utf-8") as f:
    ALL_METADATA = json.load(f)

# Configuración de los 5 cursos a procesar
COURSES_CONFIG = [
    {
        "id": "4aa45448-284b-40d0-8ab1-06af3bc361cc",
        "folder": "Curso de ansiedad y fobias",
        "titulo": "Curso de Ansiedad y Fobias",
        "tituloLargo": "Curso de Ansiedad y Fobias",
        "out_filename": "Manual Completo - Curso de Ansiedad y Fobias (Elias Pacione).pdf",
    },
    {
        "id": "931b8dc3-2dc1-44c2-802f-6ff9987be08e",
        "folder": "Fundamentos Neurobiológicos del Comportamiento",
        "titulo": "Fundamentos Neurobiológicos del Comportamiento",
        "tituloLargo": "Fundamentos Neurobiológicos del Comportamiento",
        "out_filename": "Manual Completo - Fundamentos Neurobiologicos del Comportamiento (Elias Pacione).pdf",
    },
    {
        "id": "60de92a8-ef0d-4670-bfb6-25c9073f74ce",
        "folder": "La Depresión Mayor",
        "titulo": "La Depresión Mayor",
        "tituloLargo": "La Depresión Mayor: Comprensión y Recuperación",
        "out_filename": "Manual Completo - La Depresion Mayor (Elias Pacione).pdf",
    },
    {
        "id": "caef0085-8015-4480-902c-a2376fbc6141",
        "folder": "Reestructuracion Cognitiva Avanzada",
        "titulo": "Reestructuración Cognitiva Avanzada",
        "tituloLargo": "Reestructuración Cognitiva Avanzada",
        "out_filename": "Manual Completo - Reestructuracion Cognitiva Avanzada (Elias Pacione).pdf",
    },
    {
        "id": "ce105f1e-570e-4261-a1bc-e6a3e83bb597",
        "folder": "Técnicas de Regulación Emocional",
        "titulo": "Técnicas de Regulación Emocional",
        "tituloLargo": "Técnicas de Regulación Emocional",
        "out_filename": "Manual Completo - Tecnicas de Regulacion Emocional (Elias Pacione).pdf",
    }
]

def generate_node_components(curso_info, c_dir):
    """Llama a Node.js para generar portada, legal, separadores, quizzes y contraportada."""
    data_json_path = os.path.join(c_dir, "data.json")
    with open(data_json_path, "w", encoding="utf-8") as f:
        json.dump(curso_info, f, ensure_ascii=False, indent=2)

    script = f"""
    const path = require('path');
    const fs = require('fs');
    const {{
      generarPortada,
      generarLegal,
      generarSeparadores,
      generarQuizzes,
      generarContraportada
    }} = require('./generate_all_manuals');

    async function build() {{
      const cDir = '{c_dir}';
      const cursoData = JSON.parse(fs.readFileSync(path.join(cDir, 'data.json'), 'utf8'));

      await generarPortada(cursoData, path.join(cDir, 'portada.pdf'));
      await generarLegal(cursoData, path.join(cDir, 'legal.pdf'));
      await generarSeparadores(cursoData, path.join(cDir, 'separadores.pdf'));
      await generarQuizzes(cursoData, path.join(cDir, 'quizzes.pdf'));
      await generarContraportada(path.join(cDir, 'contraportada.pdf'));
      console.log('Componentes Node generados en ' + cDir);
    }}
    build().catch(err => {{ console.error(err); process.exit(1); }});
    """
    res = subprocess.run(["node", "-e", script], cwd=SCRIPT_DIR, capture_output=True, text=True)
    if res.returncode != 0:
        print("Error en Node:", res.stderr)
        raise RuntimeError(f"Fallo en generate_node_components: {res.stderr}")

def generate_node_indice(curso_info, toc_entries, c_dir):
    """Llama a Node.js para generar el índice con los números de página exactos."""
    entries_json_path = os.path.join(c_dir, "toc_entries.json")
    with open(entries_json_path, "w", encoding="utf-8") as f:
        json.dump(toc_entries, f, ensure_ascii=False, indent=2)

    script = f"""
    const path = require('path');
    const fs = require('fs');
    const {{ generarIndice }} = require('./generate_all_manuals');

    async function build() {{
      const cDir = '{c_dir}';
      const cursoData = JSON.parse(fs.readFileSync(path.join(cDir, 'data.json'), 'utf8'));
      const tocEntries = JSON.parse(fs.readFileSync(path.join(cDir, 'toc_entries.json'), 'utf8'));

      await generarIndice(cursoData, tocEntries, path.join(cDir, 'indice.pdf'));
      console.log('Índice generado con éxito.');
    }}
    build().catch(err => {{ console.error(err); process.exit(1); }});
    """
    res = subprocess.run(["node", "-e", script], cwd=SCRIPT_DIR, capture_output=True, text=True)
    if res.returncode != 0:
        print("Error en Node Índice:", res.stderr)
        raise RuntimeError(f"Fallo en generate_node_indice: {res.stderr}")

def assemble_course_manual(cfg):
    folder_name = cfg["folder"]
    print(f"==================================================")
    print(f"PROCESANDO: {cfg['titulo']} ({folder_name})")
    print(f"==================================================")

    # 1. Obtener metadata de la base de datos
    db_meta = next((c for c in ALL_METADATA if c["id"] == cfg["id"]), None)
    if not db_meta:
        raise ValueError(f"No se encontró metadata para ID: {cfg['id']}")

    # Filtrar módulos de lecciones 1 a 6
    lesson_mods = [m for m in db_meta["modulos"] if m["orden"] >= 0 and m["orden"] <= 5]
    lesson_mods.sort(key=lambda m: m["orden"])

    # Localizar archivos PDF existentes
    course_path = os.path.join(R2_BASE, folder_name)
    existing_pdfs = sorted(glob.glob(os.path.join(course_path, "leccion-*.pdf")))
    if len(existing_pdfs) != 6:
        raise ValueError(f"Se esperaban 6 lecciones en {course_path}, se encontraron {len(existing_pdfs)}")

    lecciones_info = []
    for i, m in enumerate(lesson_mods):
        # Título limpio de la lección
        full_title = m["titulo"]
        clean_title = full_title
        if "·" in full_title:
            clean_title = full_title.split("·", 1)[1].strip()
        elif "—" in full_title:
            clean_title = full_title.split("—", 1)[1].strip()

        pdf_file = existing_pdfs[i]
        pdf_doc = fitz.open(pdf_file)
        page_count = len(pdf_doc)
        pdf_doc.close()

        lecciones_info.append({
            "idx": i,
            "numero": i + 1,
            "titulo": clean_title,
            "full_titulo": full_title,
            "pdf_path": pdf_file,
            "page_count": page_count,
            "quiz": m.get("quiz")
        })

    curso_data = {
        "id": cfg["id"],
        "titulo": cfg["titulo"],
        "tituloLargo": cfg["tituloLargo"],
        "descripcion": db_meta["descripcion"] or "Formación asincrónica oficial de la plataforma de Elías Pacione.",
        "leccionesInfo": lecciones_info
    }

    c_dir = os.path.join(TEMP_DIR, folder_name.replace(" ", "_"))
    os.makedirs(c_dir, exist_ok=True)

    # 2. Generar componentes Node
    generate_node_components(curso_data, c_dir)

    # 3. Calcular paginación exacta para el Índice
    # Pág 1: Portada (1)
    # Pág 2: Legal (1)
    # Pág 3: Índice (1)
    current_page = 4
    toc_entries = []

    for l in lecciones_info:
        sep_page = current_page
        content_page = current_page + 1
        quiz_page = content_page + l["page_count"]

        toc_entries.append({
            "isLesson": True,
            "title": f"Lección {l['numero']} · {l['titulo']}",
            "pageNum": sep_page
        })
        toc_entries.append({
            "isLesson": False,
            "isQuiz": False,
            "title": "  Guía de Lectura y Fundamentos Teóricos",
            "pageNum": content_page
        })
        toc_entries.append({
            "isLesson": False,
            "isQuiz": True,
            "title": f"  Autoevaluación de Comprensión (5 Preguntas)",
            "pageNum": quiz_page
        })

        current_page = quiz_page + 1

    back_page = current_page
    total_pages = back_page

    print(f"Páginas totales calculadas: {total_pages}")

    # 4. Generar el Índice con las páginas exactas
    generate_node_indice(curso_data, toc_entries, c_dir)

    # 5. Ensamblar todo con PyMuPDF
    doc_final = fitz.open()

    # Portada (Pág 1)
    doc_portada = fitz.open(os.path.join(c_dir, "portada.pdf"))
    doc_final.insert_pdf(doc_portada)
    doc_portada.close()

    # Legal (Pág 2)
    doc_legal = fitz.open(os.path.join(c_dir, "legal.pdf"))
    doc_final.insert_pdf(doc_legal)
    doc_legal.close()

    # Índice (Pág 3)
    doc_indice = fitz.open(os.path.join(c_dir, "indice.pdf"))
    doc_final.insert_pdf(doc_indice)
    doc_indice.close()

    # Separadores y Quizzes
    doc_seps = fitz.open(os.path.join(c_dir, "separadores.pdf"))
    doc_quizzes = fitz.open(os.path.join(c_dir, "quizzes.pdf"))

    for i, l in enumerate(lecciones_info):
        # Insertar separador i
        doc_final.insert_pdf(doc_seps, from_page=i, to_page=i)

        # Insertar lección completa (y tapar pie antiguo)
        doc_lecc = fitz.open(l["pdf_path"])
        start_idx = len(doc_final)
        doc_final.insert_pdf(doc_lecc)
        doc_lecc.close()

        # Tapar el pie antiguo en las páginas recién insertadas
        for p_idx in range(start_idx, len(doc_final)):
            p = doc_final[p_idx]
            # Rectángulo blanco para cubrir pie anterior: y = 744 a 774
            p.draw_rect(fitz.Rect(54, 744, 558, 774), color=None, fill=(1, 1, 1))

        # Insertar quiz i
        doc_final.insert_pdf(doc_quizzes, from_page=i, to_page=i)

    doc_seps.close()
    doc_quizzes.close()

    # Contraportada
    doc_contra = fitz.open(os.path.join(c_dir, "contraportada.pdf"))
    doc_final.insert_pdf(doc_contra)
    doc_contra.close()

    assert len(doc_final) == total_pages, f"Inconsistencia en total de páginas: {len(doc_final)} vs {total_pages}"

    # 6. Estampar running footer en todas las páginas internas (1 a total_pages - 2)
    footer_font = "poppins"
    # Registrar fuente en doc
    for p_idx in range(1, total_pages - 1):
        p = doc_final[p_idx]
        p.insert_font(fontname=footer_font, fontfile=POPPINS_REG)

        # Línea separadora
        p.draw_line(fitz.Point(54, 750), fitz.Point(558, 750), color=(214/255, 222/255, 229/255), width=0.5)

        # Texto izquierdo
        left_txt = "Material educativo de la plataforma de Elías Pacione · Manual de estudio integral · Uso personal exclusivo"
        p.insert_text(fitz.Point(54, 762), left_txt, fontname=footer_font, fontsize=7.2, color=(95/255, 109/255, 119/255))

        # Texto derecho
        right_txt = f"Página {p_idx + 1} de {total_pages}"
        # Estimar ancho para alinear a la derecha
        # 558 - margen derecho
        p.insert_text(fitz.Point(485, 762), right_txt, fontname=footer_font, fontsize=7.2, color=(95/255, 109/255, 119/255))

    # Guardar en las rutas
    out_local_bucket = os.path.join(R2_BASE, folder_name, cfg["out_filename"])
    out_scripts = os.path.join(OUT_DIR, cfg["out_filename"])

    doc_final.save(out_local_bucket)
    doc_final.save(out_scripts)
    doc_final.close()

    size_mb = os.path.getsize(out_local_bucket) / (1024 * 1024)
    print(f"OK -> {out_local_bucket} ({size_mb:.2f} MB, {total_pages} páginas)")

    # 7. Subir a Cloudflare R2
    upload_script = f"""
    require('dotenv').config({{ path: '.env.local' }});
    const fs = require('fs');
    const {{ S3Client, PutObjectCommand }} = require('@aws-sdk/client-s3');

    const s3 = new S3Client({{
      region: 'auto',
      endpoint: 'https://' + process.env.R2_ACCOUNT_ID + '.r2.cloudflarestorage.com',
      forcePathStyle: true,
      credentials: {{
        accessKeyId: process.env.R2_ACCESS_KEY_ID,
        secretAccessKey: process.env.R2_SECRET_ACCESS_KEY,
      }},
    }});

    async function upload() {{
      const filePath = '{out_local_bucket}';
      const key = 'Formaciones/{folder_name}/{cfg["out_filename"]}';
      const body = fs.readFileSync(filePath);
      await s3.send(new PutObjectCommand({{
        Bucket: process.env.R2_BUCKET_NAME,
        Key: key,
        Body: body,
        ContentType: 'application/pdf',
      }}));
      console.log('Subido a R2: ' + key);
    }}
    upload();
    """
    up_res = subprocess.run(["node", "-e", upload_script], cwd="/home/lucas_fedora/Documentos/GitHub/Plataforma_Psicologo", capture_output=True, text=True)
    print(up_res.stdout.strip())

def main():
    for cfg in COURSES_CONFIG:
        assemble_course_manual(cfg)
    print("¡LOS 5 MANUALES COMPLETOS FUERON GENERADOS Y SUBIDOS CON ÉXITO!")

if __name__ == "__main__":
    main()
