"""Bande-son originale de la vidéo BRTC, entièrement synthétisée (libre de droits).

Style « corporate moderne » : 120 BPM, la mineur (Am - F - C - G), nappes,
arpège en croches doubles, kick / clap / charleston, impacts calés sur les
changements de section de la vidéo.
"""
import wave

import numpy as np

SR = 44100
BPM = 120
BEAT = 60 / BPM
BAR = 4 * BEAT

# Accords (midi) et basses, une mesure chacun
CHORDS = [
    (57, 60, 64, 69),  # Am
    (53, 57, 60, 65),  # F
    (55, 60, 64, 67),  # C
    (55, 59, 62, 67),  # G
]
BASS = [33, 29, 36, 31]

rng = np.random.default_rng(1991)


def hz(m):
    return 440.0 * 2 ** ((m - 69) / 12)


def tvec(n):
    return np.arange(n) / SR


def add(buf, sig, start):
    i = int(round(start * SR))
    if i >= len(buf):
        return
    j = min(len(buf), i + len(sig))
    if i < 0:
        sig = sig[-i:]
        i = 0
    buf[i:j] += sig[: j - i]


def fft_filter(x, lo=None, hi=None):
    """Filtre passe-bande brutal dans le domaine fréquentiel (pente douce)."""
    n = len(x)
    X = np.fft.rfft(x)
    f = np.fft.rfftfreq(n, 1 / SR)
    g = np.ones_like(f)
    if lo:
        g *= 1 / np.sqrt(1 + (lo / np.maximum(f, 1e-3)) ** 4)
    if hi:
        g *= 1 / np.sqrt(1 + (f / hi) ** 4)
    return np.fft.irfft(X * g, n)


def warm_tone(freq, n, harmonics=8, detune=(0.0,), bright=1.0):
    t = tvec(n)
    out = np.zeros(n)
    for d in detune:
        f0 = freq * 2 ** (d / 1200)
        ph = rng.uniform(0, 2 * np.pi)
        for k in range(1, harmonics + 1):
            if f0 * k > 12000:
                break
            out += np.sin(2 * np.pi * f0 * k * t + ph * k) / (k ** (1.6 / bright))
    return out / len(detune)


def pad_track(total, start, end):
    buf = np.zeros(int(total * SR))
    t = start
    idx = 0
    while t < end:
        chord = CHORDS[idx % 4]
        dur = BAR + 0.6
        n = int(dur * SR)
        seg = np.zeros(n)
        for m in chord:
            seg += warm_tone(hz(m), n, harmonics=7, detune=(-9, 0, 8))
        env = np.minimum(1, tvec(n) / 0.35) * np.minimum(1, (dur - tvec(n)) / 0.6)
        add(buf, seg * env * 0.05, t)
        t += BAR
        idx += 1
    return buf


def pluck(freq, dur=0.22):
    n = int(dur * SR)
    t = tvec(n)
    s = np.sin(2 * np.pi * freq * t) + 0.35 * np.sin(4 * np.pi * freq * t) + 0.1 * np.sin(6 * np.pi * freq * t)
    return s * np.exp(-t * 16) * np.minimum(1, t / 0.003)


def arp_track(total, start, end, gain=1.0):
    L = np.zeros(int(total * SR))
    R = np.zeros_like(L)
    step = BEAT / 4
    pattern = [0, 1, 2, 3, 2, 1, 3, 2]
    k = 0
    t = start
    while t < end:
        bar_idx = int((t + 1e-6) // BAR)
        chord = CHORDS[bar_idx % 4]
        note = chord[pattern[k % len(pattern)]] + 12
        s = pluck(hz(note)) * 0.06 * gain * (1.0 if k % 4 == 0 else 0.75)
        pan = 0.5 + 0.35 * np.sin(k * 0.9)
        add(L, s * (1 - pan) * 2, t)
        add(R, s * pan * 2, t)
        t += step
        k += 1
    # écho pointé (croche pointée), légèrement croisé
    d = int(0.75 * BEAT * SR)
    for tap, g in ((1, 0.38), (2, 0.18), (3, 0.08)):
        L[d * tap:] += R[: -d * tap] * g if tap % 2 else L[: -d * tap] * g
        R[d * tap:] += L[: -d * tap] * g if tap % 2 else R[: -d * tap] * g
    return L, R


def kick():
    n = int(0.45 * SR)
    t = tvec(n)
    f = 46 + 110 * np.exp(-t * 28)
    ph = 2 * np.pi * np.cumsum(f) / SR
    s = np.sin(ph) * np.exp(-t * 7.5)
    s[:120] += rng.uniform(-1, 1, 120) * np.linspace(0.5, 0, 120)
    return np.tanh(s * 1.6) * 0.55


def clap():
    n = int(0.25 * SR)
    t = tvec(n)
    noise = rng.uniform(-1, 1, n)
    noise = np.diff(noise, prepend=0)
    env = np.exp(-t * 22)
    for off in (0.0, 0.011, 0.022):
        i = int(off * SR)
        env[i:i + 300] += np.exp(-np.arange(300) / 60)[: n - i]
    return noise * env * 0.12


def hat(open_=False):
    n = int((0.18 if open_ else 0.05) * SR)
    t = tvec(n)
    noise = np.diff(np.diff(rng.uniform(-1, 1, n + 2)))
    return noise * np.exp(-t * (22 if open_ else 90)) * 0.05


def bass_note(freq, dur):
    n = int(dur * SR)
    t = tvec(n)
    s = np.sin(2 * np.pi * freq * t) + 0.45 * np.sin(4 * np.pi * freq * t) + 0.2 * np.sin(6 * np.pi * freq * t)
    env = np.minimum(1, t / 0.01) * np.exp(-t * 3.5)
    return np.tanh(s * env * 1.3) * 0.16


def drums_and_bass(total, segments):
    """segments : liste de (début, fin, intensité) où la rythmique joue."""
    buf = np.zeros(int(total * SR))
    hats = np.zeros_like(buf)
    k, c = kick(), clap()
    h, ho = hat(), hat(True)
    for start, end, level in segments:
        t = start
        b = 0
        while t < end - 1e-6:
            add(buf, k * level, t)
            if b % 2 == 1:
                add(buf, c * level, t)
            add(hats, (ho if b % 4 == 3 else h) * level, t + BEAT / 2)
            add(hats, h * 0.5 * level, t + BEAT / 4 * 3)
            bar_idx = int((t + 1e-6) // BAR)
            root = BASS[bar_idx % 4]
            add(buf, bass_note(hz(root), BEAT / 2 - 0.02) * level, t)
            add(buf, bass_note(hz(root + 12), BEAT / 2 - 0.02) * 0.7 * level, t + BEAT / 2)
            t += BEAT
            b += 1
    return buf, hats


def pump_env(total, segments, depth=0.45):
    env = np.ones(int(total * SR))
    for start, end, _ in segments:
        t = start
        while t < end - 1e-6:
            i = int(t * SR)
            n = int(BEAT * SR)
            seg = 1 - depth * np.exp(-tvec(n) * 9)
            env[i:i + n] = seg[: len(env[i:i + n])]
            t += BEAT
    return env


def riser(dur):
    n = int(dur * SR)
    t = tvec(n)
    noise = np.diff(rng.uniform(-1, 1, n + 1))
    f = 200 + 1800 * (t / dur) ** 2
    tone = np.sin(2 * np.pi * np.cumsum(f) / SR) * 0.25
    env = (t / dur) ** 2.2
    return (noise * 0.6 + tone) * env * 0.12


def impact(strength=1.0):
    n = int(2.2 * SR)
    t = tvec(n)
    boom = np.sin(2 * np.pi * (38 + 40 * np.exp(-t * 10)) * t) * np.exp(-t * 2.2)
    noise = rng.uniform(-1, 1, n)
    noise = np.convolve(noise, np.ones(8) / 8, mode="same") * np.exp(-t * 3.5)
    crash = np.diff(rng.uniform(-1, 1, n + 1)) * np.exp(-t * 1.6) * 0.25
    return (boom * 0.55 + noise * 0.25 + crash) * strength * 0.5


def reverb(x, seconds=2.6, seed=0, wet=0.28):
    n_ir = int(seconds * SR)
    r = np.random.default_rng(seed)
    t = tvec(n_ir)
    ir = r.normal(0, 1, n_ir) * np.exp(-t * 6.9 / seconds)
    ir = fft_filter(ir, lo=180, hi=6500)
    ir /= np.sqrt(np.sum(ir ** 2))
    n = len(x) + n_ir
    size = 1 << (n - 1).bit_length()
    y = np.fft.irfft(np.fft.rfft(x, size) * np.fft.rfft(ir, size), size)[: len(x)]
    return x + y * wet


def make_music(total, cues, out_path):
    """cues : dict avec 'drop', 'sections' (liste de temps), 'breakdown' (debut, fin), 'outro'."""
    n = int(total * SR)
    drop = cues["drop"]
    bd0, bd1 = cues["breakdown"]
    outro = cues["outro"]

    groove = [(drop, bd0, 1.0), (bd1, outro, 1.0)]
    pad = pad_track(total, 0.0, total)
    arpL, arpR = arp_track(total, BAR * 1, total - 1.0)
    # l'arpège entre progressivement pendant l'intro
    ramp = np.clip((tvec(n) - BAR) / max(drop - BAR, 0.1), 0, 1) * 0.6 + 0.4
    arpL *= ramp
    arpR *= ramp

    pump = pump_env(total, groove)
    pad *= pump
    drums, hats = drums_and_bass(total, groove)

    fx = np.zeros(n)
    add(fx, riser(drop), 0.0)
    add(fx, impact(1.0), drop)
    for s in cues["sections"]:
        add(fx, riser(BAR), s - BAR)
        add(fx, impact(0.6), s)
    add(fx, riser(BAR), bd1 - BAR)
    add(fx, impact(0.8), bd1)
    add(fx, impact(1.0), outro)

    wetL = reverb(pad + arpL * 0.8 + fx * 0.3, seed=1)
    wetR = reverb(pad + arpR * 0.8 + fx * 0.3, seed=2)
    L = wetL + drums + hats * 0.9 + fx * 0.7
    R = wetR + drums + hats * 1.1 + fx * 0.7

    st = np.stack([L, R], axis=1)
    st -= st.mean(axis=0)
    st = np.tanh(st / (np.abs(st).max() + 1e-9) * 1.4)
    fade_in = np.clip(tvec(n) / 0.3, 0, 1)
    fade_out = np.clip((total - tvec(n)) / 2.5, 0, 1)
    st *= (fade_in * fade_out)[:, None]
    st = st / (np.abs(st).max() + 1e-9) * 0.6
    pcm = (st * 32767).astype(np.int16)
    with wave.open(out_path, "wb") as w:
        w.setnchannels(2)
        w.setsampwidth(2)
        w.setframerate(SR)
        w.writeframes(pcm.tobytes())
