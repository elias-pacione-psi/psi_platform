#!/usr/bin/env python3
"""Sintetiza la música de fondo: pad ambient cálido (Cmaj7 - Am7 - Fmaj7 - G6,
~72 bpm) con punteos Karplus-Strong esparcidos (suena a guitarra criolla
suave). Escribre audio/musica.wav estéreo 44.1k con fade in/out.

Uso: ./venv/bin/python gen_musica.py [duracion_seg]
"""
import sys
import wave

import numpy as np

SR = 44100
TOTAL = float(sys.argv[1]) if len(sys.argv) > 1 else 42.0
N = int(SR * TOTAL)
t = np.arange(N) / SR

BPM = 72
BEAT = 60.0 / BPM
BARRA = BEAT * 4  # un acorde por compás

# Cmaj7, Am7, Fmaj7, G6 — raíz, 3ª, 5ª, 7ª/6ª
ACORDES = [
    [130.81, 164.81, 196.00, 246.94],
    [110.00, 130.81, 164.81, 196.00],
    [87.31, 110.00, 130.81, 164.81],
    [98.00, 123.47, 146.83, 164.81],
]


def pad_chord(freqs, n0, n1):
    """Suma de senos con desafinado L/R leve, envolvente con ataque y
    release suaves, solapada con el acorde vecino."""
    dur = (n1 - n0) / SR
    tt = np.arange(n1 - n0) / SR
    env = np.minimum(1.0, tt / 0.9) * np.minimum(1.0, (dur - tt) / 0.9)
    env = np.clip(env, 0.0, 1.0) ** 1.5
    l = np.zeros(n1 - n0)
    r = np.zeros(n1 - n0)
    for j, f in enumerate(freqs):
        amp = 0.20 if j == 0 else 0.15
        # leve desafinación entre canales = ancho estéreo cálido
        fl, fr = f * 0.9992, f * 1.0008
        l += amp * np.sin(2 * np.pi * fl * tt)
        r += amp * np.sin(2 * np.pi * fr * tt)
        # parcial una octava arriba, bien bajito
        l += 0.045 * np.sin(2 * np.pi * fl * 2 * tt)
        r += 0.045 * np.sin(2 * np.pi * fr * 2 * tt)
    return n0, n1, l * env, r * env


def karplus(freq, dur=1.4, amp=0.30):
    """Cuerda pulsada por el algoritmo de Karplus-Strong."""
    n = int(SR * dur)
    periodo = max(2, int(round(SR / freq)))
    buf = np.random.uniform(-1, 1, periodo)
    out = np.zeros(n)
    for i in range(n):
        out[i] = buf[i % periodo]
        buf[i % periodo] = 0.996 * 0.5 * (buf[i % periodo] + buf[(i + 1) % periodo])
    return out * amp


pistas_l = np.zeros(N)
pistas_r = np.zeros(N)

# --- pad: progresión en loop hasta cubrir TOTAL, con solape de medio segundo
solape = int(0.6 * SR)
paso = int(BARRA * SR)
k = 0
pos = 0
while pos < N:
    n0 = pos
    n1 = min(N, pos + paso + solape)
    i0, i1, l, r = pad_chord(ACORDES[k % len(ACORDES)], n0, n1)
    pistas_l[i0:i1] += l
    pistas_r[i0:i1] += r
    k += 1
    pos += paso

# --- bajo: raíz una octava abajo al inicio de cada compás, caída exponencial
rng = np.random.default_rng(20260916)
for k in range(int(TOTAL / BARRA) + 1):
    f0 = ACORDES[k % len(ACORDES)][0] / 2
    start = int(k * BARRA * SR)
    dur = int(1.6 * SR)
    if start + dur > N:
        break
    tt = np.arange(dur) / SR
    nota = 0.16 * np.sin(2 * np.pi * f0 * tt) * np.exp(-2.2 * tt)
    pistas_l[start:start + dur] += nota
    pistas_r[start:start + dur] += nota

# --- punteo: pentatónica de C, 2-3 notas por compás con prob. 0.75, pan alternado
ESCALA = [261.63, 293.66, 329.63, 392.00, 440.00, 523.25]
for k in range(int(TOTAL / BARRA)):
    if rng.random() > 0.78:
        continue
    for beat in rng.choice([0.0, 1.5, 2.0, 3.0], size=int(rng.integers(1, 3)), replace=False):
        f = ESCALA[rng.integers(0, len(ESCALA))]
        start = int((k * BARRA + beat * BEAT) * SR)
        nota = karplus(f, amp=0.24)
        if start + len(nota) > N:
            break
        pan = 0.5 + 0.3 * (1 if (k + int(beat)) % 2 == 0 else -1)
        pistas_l[start:start + len(nota)] += nota * (1 - pan * 0.5)
        pistas_r[start:start + len(nota)] += nota * (0.5 + pan * 0.5)

# --- eco suave sobre el conjunto (280 ms, feedback 0.3)
d = int(0.28 * SR)
for arr in (pistas_l, pistas_r):
    eco = np.zeros_like(arr)
    eco[d:] = arr[:-d]
    arr += 0.30 * eco

# --- master: normalizar suave, fades
def fade(arr):
    fi = int(1.5 * SR)
    fo = int(3.5 * SR)
    arr[:fi] *= np.linspace(0, 1, fi)
    arr[-fo:] *= np.linspace(1, 0, fo)
    return arr

for arr in (pistas_l, pistas_r):
    pico = np.max(np.abs(arr)) or 1.0
    arr *= 0.5 / pico
    fade(arr)

estereo = np.stack([pistas_l, pistas_r], axis=1)
pcm = (np.clip(estereo, -1, 1) * 32767).astype(np.int16)

with wave.open("audio/musica.wav", "wb") as w:
    w.setnchannels(2)
    w.setsampwidth(2)
    w.setframerate(SR)
    w.writeframes(pcm.tobytes())
print(f"audio/musica.wav  {TOTAL:.1f}s")
