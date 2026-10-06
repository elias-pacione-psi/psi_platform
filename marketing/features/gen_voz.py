#!/usr/bin/env python3
"""Voz en off para los videos-features silenciosos.

`armar.sh` ya deja claro que estos videos son "solo imagen, sin audio" — están
renderizados (psicologia-y-fe, supervisiones, terapia-individual, 11.2s cada
uno: 2.4s de título + 8.8s de viñeta) pero mudos. `formaciones` y `ebooks`
todavía no tienen ni el .mjs de video, pero se les arma el guion igual, en el
mismo formato corto, para cuando se sumen al pipeline.

Mismo enfoque que marketing/curso-asincronico/gen_voz.py v3: frases completas,
nunca palabra por palabra — eso fue lo que sonaba robotizado ahí. Acá el
formato es más corto todavía: una línea que hace eco del título en pantalla
(los 2.4s de `titulo.mjs`) y una o dos que describen el servicio (los 8.8s de
la viñeta), sacadas del copy real de cada página.

Escribe audio/<feature>.mp3 para cada feature.
"""
import asyncio
import json
from pathlib import Path
import subprocess
import tempfile

import edge_tts

VOZ = "es-AR-TomasNeural"

# (texto, rate, pitch, pausa_despues_seg)
# Línea A ≈ eco del título (2.4s en pantalla), pace casi neutro. Línea(s) B ≈
# la viñeta (8.8s), con el remate final más lento/grave de siempre.
GUIONES = {
    "psicologia-y-fe": [
        ("Psicología aplicada para la comunidad cristiana.", "-3%", "-1Hz", 0.4),
        ("Un puente entre la salud mental y la vida espiritual,", "-4%", "-1Hz", 0.3),
        ("con rigor profesional y respeto por tu fe.", "-8%", "-3Hz", 0.0),
    ],
    "supervisiones": [
        ("Un espacio para pensar tu práctica con otro.", "-3%", "-1Hz", 0.4),
        ("Para revisar casos, dudas técnicas, y sostener tu proceso profesional,", "-4%", "-1Hz", 0.3),
        ("acompañado por alguien con más recorrido.", "-8%", "-3Hz", 0.0),
    ],
    "terapia-individual": [
        ("Un espacio propio para tu proceso.", "-3%", "-1Hz", 0.4),
        ("Acompañamiento psicológico individual, confidencial, a tu ritmo.", "-6%", "-2Hz", 0.0),
    ],
    "formaciones": [
        ("Un recorrido en grupo, con encuentros en vivo.", "-3%", "-1Hz", 0.4),
        ("Clases en vivo, programa completo,", "-4%", "-1Hz", 0.3),
        ("y un ebook que te acompaña todo el trayecto.", "-8%", "-3Hz", 0.0),
    ],
    "ebooks": [
        ("Material para leer a tu propio ritmo.", "-3%", "-1Hz", 0.4),
        ("Comprás tu ebook y lo tenés al instante,", "-4%", "-1Hz", 0.3),
        ("sin esperar a nadie.", "-8%", "-3Hz", 0.0),
    ],
}

LIMPIEZA = (
    "silenceremove=start_periods=1:start_threshold=-45dB,"
    "areverse,silenceremove=start_periods=1:start_threshold=-45dB,areverse"
)


def duracion(path):
    return float(
        subprocess.check_output(
            ["ffprobe", "-v", "error", "-show_entries", "format=duration",
             "-of", "csv=p=0", path]
        ).strip()
    )


async def generar():
    out = Path("audio")
    out.mkdir(exist_ok=True)
    duraciones = {}

    with tempfile.TemporaryDirectory() as tmp:
        for feature, frases in GUIONES.items():
            partes = []
            for k, (texto, rate, pitch, pausa) in enumerate(frases):
                crudo = f"{tmp}/{feature}-{k}.mp3"
                await edge_tts.Communicate(texto, VOZ, rate=rate, pitch=pitch).save(crudo)
                limpio = f"{tmp}/{feature}-{k}.wav"
                subprocess.run(
                    ["ffmpeg", "-y", "-i", crudo, "-af",
                     f"{LIMPIEZA},apad=pad_dur={pausa}",
                     "-ar", "44100", "-ac", "1", limpio],
                    check=True, capture_output=True,
                )
                partes.append(limpio)

            lista = Path(tmp) / f"concat-{feature}.txt"
            lista.write_text("".join(f"file '{p}'\n" for p in partes))
            destino = out / f"{feature}.mp3"
            subprocess.run(
                ["ffmpeg", "-y", "-f", "concat", "-safe", "0", "-i", str(lista),
                 "-c:a", "libmp3lame", "-b:a", "96k", str(destino)],
                check=True, capture_output=True,
            )
            duraciones[feature] = round(duracion(str(destino)), 3)
            print(f"{feature}: {duraciones[feature]:.2f}s ({len(frases)} tramos)")

    Path("audio/duraciones.json").write_text(json.dumps(duraciones, indent=2) + "\n")
    print(f"\ntotal: {sum(duraciones.values()):.2f}s")


asyncio.run(generar())
