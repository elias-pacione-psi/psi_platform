#!/usr/bin/env python3
"""Voz en off v3 — menos cortes, más continuidad.

La v2 dividía cada escena en frases cortas para controlar rate/pitch/pausa
por tramo — y en la escena 2 llegaba a sintetizar "videos," / "lecturas," /
"ejercicios," como tres audios de una sola palabra, totalmente aislados. Un
modelo neural sintetizando una palabra suelta, sin el resto de la oración
alrededor, pierde la prosodia de frase — y cada empalme por ffmpeg concat es
un corte duro, sin continuidad entre clips. Eso es lo que sonaba robotizado.

v3 sintetiza cada escena en dos tramos: el cuerpo completo (una sola llamada
a edge-tts, así el modelo maneja solo la entonación interna de la oración) y
el remate final aparte, más lento y grave a propósito — la caída de tono al
cierre de una oración sí es prosodia humana real, no un artefacto.

Para los chips "Videos/Lecturas/Ejercicios" de la escena 2 esto cambia cómo
se mide: en vez de la duración de un clip aislado por palabra, se pide
boundary="WordBoundary" en la llamada del cuerpo completo y se leen los
timestamps reales de esas tres palabras dentro de la oración, del archivo de
metadata que edge-tts escribe al lado del audio.

Escribe audio/voz/escena{1..5}.mp3, audio/duraciones.json y
audio/boundaries.json. Después correr: node src/timeline.mjs --write."""
import asyncio
import json
import subprocess
import tempfile
from pathlib import Path

import edge_tts

VOZ = "es-AR-TomasNeural"

# (texto, rate, pitch, pausa_despues_seg)
# Cuerpo parejo, sin cortes internos — el remate de cada escena va más lento
# (-8/-9%) y grave (-3Hz), la única bajada de tono manual que vale la pena
# forzar porque imita el cierre natural de una oración.
GUION = {
    1: [
        ("¿Alguna vez te anotaste en un curso...", "-6%", "-1Hz", 0.65),
        ("pero el horario nunca te cerraba?", "-7%", "-2Hz", 0.0),
    ],
    2: [
        (
            "Un curso asincrónico es contenido ya grabado: videos, lecturas, "
            "ejercicios, que vas viendo cuando vos querés,",
            "-4%", "-1Hz", 0.28,
        ),
        ("a tu propio ritmo.", "-9%", "-3Hz", 0.0),
    ],
    3: [
        (
            "Nada de clases en vivo ni fechas fijas de inscripción. Entrás "
            "con tu usuario, avanzás lección por lección,",
            "-4%", "-1Hz", 0.28,
        ),
        ("y retomás justo donde quedaste.", "-8%", "-3Hz", 0.0),
    ],
    4: [
        (
            "¿Tenés la agenda apretada? ¿Te gusta aprender a tu manera, sin "
            "que nadie te apure?",
            "-4%", "-1Hz", 0.60,
        ),
        ("Este formato fue pensado para eso.", "-8%", "-3Hz", 0.0),
    ],
    5: [
        ("Elegí tu curso, escribinos,", "-5%", "-1Hz", 0.35),
        ("y empezá cuando estés listo.", "-9%", "-3Hz", 0.0),
    ],
}

# Palabras a ubicar en la escena 2 para los chips — se buscan por texto
# (sin puntuación, sin mayúsculas) en el tramo que las contenga.
PALABRAS_CHIPS = ["videos", "lecturas", "ejercicios"]

LIMPIEZA = (
    "silenceremove=start_periods=1:start_threshold=-45dB,"
    "areverse,silenceremove=start_periods=1:start_threshold=-45dB,areverse"
)

# edge-tts reporta offset/duration en "ticks" de 100ns (misma convención que
# el SDK de Azure Speech por debajo).
TICKS_POR_SEGUNDO = 10_000_000


def duracion(path):
    return float(
        subprocess.check_output(
            ["ffprobe", "-v", "error", "-show_entries", "format=duration",
             "-of", "csv=p=0", path]
        ).strip()
    )


def _normalizar(palabra):
    return palabra.strip(" ,.;:¿?¡!").lower()


async def generar():
    out = Path("audio/voz")
    out.mkdir(parents=True, exist_ok=True)
    duraciones = {}
    boundaries = {}

    with tempfile.TemporaryDirectory() as tmp:
        for escena, frases in GUION.items():
            partes = []
            base = 0.0
            faltan = list(PALABRAS_CHIPS) if escena == 2 else []

            for k, (texto, rate, pitch, pausa) in enumerate(frases):
                crudo = f"{tmp}/e{escena}f{k}.mp3"
                meta = f"{tmp}/e{escena}f{k}.jsonl" if faltan else None
                comm = edge_tts.Communicate(
                    texto, VOZ, rate=rate, pitch=pitch,
                    boundary="WordBoundary" if faltan else "SentenceBoundary",
                )
                if meta:
                    await comm.save(crudo, meta)
                else:
                    await comm.save(crudo)

                if meta:
                    for linea in Path(meta).read_text(encoding="utf-8").splitlines():
                        msg = json.loads(linea)
                        if msg.get("type") != "WordBoundary":
                            continue
                        palabra = _normalizar(msg["text"])
                        if palabra in faltan:
                            # +0.03: mismo margen que usaba la v2; si el chip
                            # se ve levemente adelantado o atrasado, ajustar
                            # o sacar directamente — ahora es tiempo real de
                            # la palabra, ya no una estimación por duración.
                            boundaries[palabra] = round(
                                base + msg["offset"] / TICKS_POR_SEGUNDO + 0.03, 3
                            )
                            faltan.remove(palabra)

                limpio = f"{tmp}/e{escena}f{k}.wav"
                subprocess.run(
                    ["ffmpeg", "-y", "-i", crudo, "-af",
                     f"{LIMPIEZA},apad=pad_dur={pausa}",
                     "-ar", "44100", "-ac", "1", limpio],
                    check=True, capture_output=True,
                )
                partes.append(limpio)
                base += duracion(limpio)

            lista = Path(tmp) / f"concat{escena}.txt"
            lista.write_text("".join(f"file '{p}'\n" for p in partes))
            destino = out / f"escena{escena}.mp3"
            subprocess.run(
                ["ffmpeg", "-y", "-f", "concat", "-safe", "0", "-i", str(lista),
                 "-c:a", "libmp3lame", "-b:a", "96k", str(destino)],
                check=True, capture_output=True,
            )
            duraciones[str(escena)] = round(duracion(str(destino)), 3)
            print(f"escena {escena}: {duraciones[str(escena)]:.2f}s ({len(frases)} tramos)")

    sin_encontrar = [p for p in PALABRAS_CHIPS if p not in boundaries]
    if sin_encontrar:
        raise RuntimeError(f"no se encontraron en la escena 2: {sin_encontrar}")

    boundaries_ordenado = {p: boundaries[p] for p in PALABRAS_CHIPS}
    Path("audio/duraciones.json").write_text(json.dumps(duraciones, indent=2) + "\n")
    Path("audio/boundaries.json").write_text(json.dumps(boundaries_ordenado, indent=2) + "\n")
    print("boundaries:", boundaries_ordenado)
    print(f"suma de voces: {sum(duraciones.values()):.2f}s")


asyncio.run(generar())
