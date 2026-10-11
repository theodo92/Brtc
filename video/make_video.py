"""Vidéo promotionnelle BRTC — rendu 1920x1080 @ 30 i/s.

Les plans sont calés sur le tempo de la musique (120 BPM : 1 temps = 0,5 s).

Usage :
    python3 fetch_photos.py photos
    python3 make_video.py photos BRTC_video_promo.mp4
"""
import math
import os
import subprocess
import sys
import tempfile
from functools import lru_cache
from multiprocessing import Pool

import numpy as np
from PIL import Image, ImageDraw, ImageEnhance, ImageFilter, ImageFont

from music import make_music

W, H, FPS = 1920, 1080, 30
ORANGE = (251, 173, 28)
DARK = (17, 17, 19)
WHITE = (255, 255, 255)
LIGHT = (214, 214, 218)
SHADOW_PAD = 16
FONT_DIR = "/usr/share/fonts/opentype/inter/"
PHOTOS = os.environ.get("BRTC_PHOTOS", "photos")


# --------------------------------------------------------------------------- outils
def clamp(x, a=0.0, b=1.0):
    return a if x < a else b if x > b else x


def smooth(x):
    x = clamp(x)
    return x * x * (3 - 2 * x)


def out_cubic(x):
    x = clamp(x)
    return 1 - (1 - x) ** 3


def out_expo(x):
    x = clamp(x)
    return 1.0 if x >= 1 else 1 - 2 ** (-10 * x)


def in_out(x):
    x = clamp(x)
    return 4 * x ** 3 if x < 0.5 else 1 - (-2 * x + 2) ** 3 / 2


@lru_cache(None)
def font(weight, size):
    return ImageFont.truetype(f"{FONT_DIR}InterDisplay-{weight}.otf", size)


@lru_cache(None)
def photo(name):
    im = Image.open(os.path.join(PHOTOS, name)).convert("RGB")
    # certaines photos du site ont des marges blanches intégrées : on les retire
    g = np.asarray(im.convert("L")).astype(np.float32)
    cols = np.where(~((g.mean(0) > 243) & (g.std(0) < 8)))[0]
    rows = np.where(~((g.mean(1) > 243) & (g.std(1) < 8)))[0]
    im = im.crop((cols[0], rows[0], cols[-1] + 1, rows[-1] + 1))
    im = ImageEnhance.Contrast(im).enhance(1.07)
    im = ImageEnhance.Color(im).enhance(1.06)
    a = np.asarray(im).astype(np.float32)
    a[..., 0] *= 1.025
    a[..., 2] *= 0.97
    return Image.fromarray(np.clip(a, 0, 255).astype(np.uint8))


@lru_cache(None)
def photo_soft(name, darken=0.32):
    """Version floutée et assombrie pour les fonds typographiques."""
    im = photo(name).resize((W // 2, int(W / 2 * photo(name).height / photo(name).width)), Image.BICUBIC)
    im = im.filter(ImageFilter.GaussianBlur(10))
    a = np.asarray(im).astype(np.float32) * darken
    return Image.fromarray(a.astype(np.uint8))


def kenburns(im, t, dur, size=(W, H), z=(1.0, 1.1), pan=(0, 0, 0, 0)):
    sw, sh = im.size
    tw, th = size
    p = clamp(t / dur)
    p = 0.8 * p + 0.2 * smooth(p)
    zoom = z[0] + (z[1] - z[0]) * p
    ar = tw / th
    if sw / sh > ar:
        bh, bw = sh, sh * ar
    else:
        bw, bh = sw, sw / ar
    cw, ch = bw / zoom, bh / zoom
    px = pan[0] + (pan[2] - pan[0]) * p
    py = pan[1] + (pan[3] - pan[1]) * p
    cx = sw / 2 + px * (sw - cw) / 2
    cy = sh / 2 + py * (sh - ch) / 2
    return im.resize((tw, th), Image.BICUBIC, box=(cx - cw / 2, cy - ch / 2, cx + cw / 2, cy + ch / 2))


@lru_cache(None)
def gradient(kind, strength=200):
    a = np.zeros((H, W), np.float32)
    if kind == "bottom":
        y = np.linspace(0, 1, H)[:, None]
        a[:] = np.clip((y - 0.3) / 0.7, 0, 1) ** 1.2
    elif kind == "left":
        x = np.linspace(0, 1, W)[None, :]
        a[:] = np.clip((0.68 - x) / 0.68, 0, 1) ** 1.2
    elif kind == "full":
        a[:] = 1
    rgba = np.zeros((H, W, 4), np.uint8)
    rgba[..., 3] = (a * strength).astype(np.uint8)
    return Image.fromarray(rgba, "RGBA")


@lru_cache(None)
def vignette():
    y, x = np.mgrid[0:H, 0:W].astype(np.float32)
    d = np.sqrt(((x - W / 2) / (W / 2)) ** 2 + ((y - H / 2) / (H / 2)) ** 2) / math.sqrt(2)
    return (1 - 0.32 * np.clip(d - 0.25, 0, 1) ** 1.5)[..., None]


@lru_cache(None)
def logo_white(width):
    im = Image.open(os.path.join(PHOTOS, "LOGO-BRTC_fond3.png")).convert("RGBA")
    a = np.asarray(im).astype(np.int16)
    r, g, b = a[..., 0], a[..., 1], a[..., 2]
    grey = (np.abs(r - g) < 14) & (np.abs(g - b) < 14) & (r < 170)
    a[grey, 0:3] = 246
    im = Image.fromarray(a.astype(np.uint8), "RGBA")
    return im.resize((width, int(width * im.height / im.width)), Image.LANCZOS)


# --------------------------------------------------------------------------- texte
@lru_cache(None)
def text_img(txt, weight, size, color=WHITE, tracking=0):
    f = font(weight, size)
    asc, desc = f.getmetrics()
    if tracking:
        width = int(sum(f.getlength(c) + tracking for c in txt) - tracking) + 4
    else:
        width = int(f.getlength(txt)) + 4
    m = SHADOW_PAD
    size = (max(width, 1) + 2 * m, asc + desc + 2 * m)

    def draw(fill):
        im = Image.new("RGBA", size, (0, 0, 0, 0))
        d = ImageDraw.Draw(im)
        if tracking:
            x = 0.0
            for c in txt:
                d.text((m + x, m), c, font=f, fill=fill)
                x += f.getlength(c) + tracking
        else:
            d.text((m, m), txt, font=f, fill=fill)
        return im

    # ombre portée douce pour la lisibilité sur photo
    sh = draw((0, 0, 0, 255)).filter(ImageFilter.GaussianBlur(max(3, size[1] // 14)))
    sh = with_alpha(sh, 0.55)
    sh.alpha_composite(draw(color))
    return sh


def with_alpha(im, a):
    if a >= 0.999:
        return im
    im = im.copy()
    im.putalpha(im.getchannel("A").point(lambda v: int(v * a)))
    return im


def reveal(canvas, timg, x, y, t, t0, dur=0.7, t1=None, out=0.35, anchor="l", rise=None):
    """Le texte monte depuis une ligne de masque, puis s'efface en fin de plan."""
    if t < t0:
        return
    x -= SHADOW_PAD
    y -= SHADOW_PAD
    if anchor == "m":
        x -= timg.width / 2 - SHADOW_PAD
    elif anchor == "r":
        x -= timg.width - 2 * SHADOW_PAD
    rise = timg.height * 0.85 if rise is None else rise
    p = out_expo((t - t0) / dur)
    a = clamp((t - t0) / (dur * 0.5))
    off = (1 - p) * rise
    if t1 is not None and t > t1:
        q = smooth((t - t1) / out)
        a *= 1 - q
        off = 0
        y -= q * 14
    if a <= 0.01:
        return
    vis = int(timg.height - off)
    if vis <= 0:
        return
    piece = timg.crop((0, 0, timg.width, vis))
    canvas.alpha_composite(with_alpha(piece, a), (int(round(x)), int(round(y + off))))


def bar(draw, x, y, w, h, p, color=ORANGE, vertical=False):
    p = clamp(p)
    if p <= 0:
        return
    if vertical:
        draw.rectangle((x, y + h * (1 - p), x + w, y + h), fill=color)
    else:
        draw.rectangle((x, y, x + w * p, y + h), fill=color)


def finish(base, overlay):
    base = base.convert("RGBA")
    base.alpha_composite(overlay)
    return base.convert("RGB")


# --------------------------------------------------------------------------- plans
class Shot:
    trans = "fade"
    tdur = 0.5

    def __init__(self, dur, trans=None, tdur=None):
        self.dur = dur
        if trans:
            self.trans = trans
        if tdur is not None:
            self.tdur = tdur


class Intro(Shot):
    def render(self, t):
        bg = kenburns(photo_soft("Raynouard_01.jpg", 0.22), t, self.dur, z=(1.15, 1.05))
        fade = smooth(t / 1.2)
        bg = Image.blend(Image.new("RGB", (W, H), DARK), bg, fade)
        ov = Image.new("RGBA", (W, H), (0, 0, 0, 0))
        d = ImageDraw.Draw(ov)
        lg = logo_white(820)
        p = out_cubic((t - 0.5) / 1.3)
        if p > 0:
            # révélation du logo depuis le centre
            vis = int(lg.width * p)
            x0 = (lg.width - vis) // 2
            piece = lg.crop((x0, 0, x0 + vis, lg.height))
            ov.alpha_composite(with_alpha(piece, clamp(p * 1.5)), ((W - lg.width) // 2 + x0, 300))
        lw = 820 * out_expo((t - 0.2) / 1.2)
        d.rectangle((W / 2 - lw / 2, 660, W / 2 + lw / 2, 664), fill=ORANGE)
        reveal(ov, text_img("ENTREPRISE GÉNÉRALE DE RÉNOVATION", "SemiBold", 34, WHITE, 9),
               W / 2, 700, t, 1.4, t1=self.dur - 0.6, anchor="m")
        reveal(ov, text_img("Tous corps d'état  ·  depuis 1991", "Light", 32, LIGHT, 2),
               W / 2, 760, t, 1.9, t1=self.dur - 0.6, anchor="m")
        return finish(bg, ov)


class PhotoShot(Shot):
    """Plan photo animé avec, au choix, un titre fort ou un bandeau projet."""

    def __init__(self, dur, name, z=(1.0, 1.1), pan=(0, 0, 0, 0), headline=None, kicker=None,
                 title=None, sub=None, grad="bottom", **kw):
        super().__init__(dur, **kw)
        self.name, self.z, self.pan = name, z, pan
        self.headline, self.kicker, self.title, self.sub, self.grad = headline, kicker, title, sub, grad

    def render(self, t):
        img = kenburns(photo(self.name), t, self.dur, z=self.z, pan=self.pan)
        ov = Image.new("RGBA", (W, H), (0, 0, 0, 0))
        if self.headline or self.title:
            ov.alpha_composite(gradient(self.grad, 235 if self.headline else 185))
        d = ImageDraw.Draw(ov)
        t1 = self.dur - 0.55
        if self.headline:
            lines = self.headline
            y = H - 140 - 110 * len(lines)
            if self.kicker:
                bar(d, 120, y - 64, 70, 6, out_expo((t - 0.25) / 0.6))
                reveal(ov, text_img(self.kicker, "SemiBold", 28, ORANGE, 7), 210, y - 80, t, 0.3, t1=t1)
            for i, (txt, weight, col) in enumerate(lines):
                reveal(ov, text_img(txt, weight, 96, col), 112, y + i * 110, t, 0.35 + 0.16 * i, dur=0.8, t1=t1)
            if self.sub:
                reveal(ov, text_img(self.sub, "Light", 36, LIGHT), 120, y + len(lines) * 110 + 18, t,
                       0.7 + 0.16 * len(lines), t1=t1)
        elif self.title:
            y = H - 210
            bar(d, 120, y + 6, 7, 120, out_expo((t - 0.2) / 0.6), vertical=True)
            if self.kicker:
                reveal(ov, text_img(self.kicker, "SemiBold", 26, ORANGE, 6), 156, y, t, 0.3, t1=t1)
            reveal(ov, text_img(self.title, "Bold", 60, WHITE), 152, y + 34, t, 0.42, t1=t1)
            if self.sub:
                reveal(ov, text_img(self.sub, "Light", 32, LIGHT), 156, y + 112, t, 0.58, t1=t1)
        return finish(img, ov)


class SectionCard(Shot):
    trans = "wipe"
    tdur = 0.5

    def __init__(self, dur, num, title, sub, bgname, **kw):
        super().__init__(dur, **kw)
        self.num, self.title, self.sub, self.bgname = num, title, sub, bgname

    def render(self, t):
        bg = kenburns(photo_soft(self.bgname), t, self.dur, z=(1.05, 1.15), pan=(-0.3, 0, 0.3, 0))
        ov = Image.new("RGBA", (W, H), (0, 0, 0, 0))
        d = ImageDraw.Draw(ov)
        t1 = self.dur - 0.45
        num = text_img(self.num, "Black", 300, ORANGE)
        reveal(ov, with_alpha(num, 0.9), 150, 250, t, 0.1, dur=0.9, t1=t1)
        bar(d, 160, 600, 160, 8, out_expo((t - 0.3) / 0.7))
        reveal(ov, text_img(self.title, "Black", 110, WHITE), 148, 630, t, 0.35, dur=0.8, t1=t1)
        reveal(ov, text_img(self.sub, "Light", 38, LIGHT), 156, 775, t, 0.55, t1=t1)
        return finish(bg, ov)


class Stats(Shot):
    ITEMS = [
        (35, "", "ans d'expérience"),
        (50, "", "collaborateurs"),
        (18, " M€", "de chiffre d'affaires 2025"),
        (2500, " m²", "d'entrepôt et d'atelier"),
    ]

    def render(self, t):
        bg = kenburns(photo_soft("Coetlogon_01.jpg", 0.3), t, self.dur, z=(1.1, 1.2))
        ov = Image.new("RGBA", (W, H), (0, 0, 0, 0))
        d = ImageDraw.Draw(ov)
        t1 = self.dur - 0.5
        reveal(ov, text_img("BRTC EN CHIFFRES", "SemiBold", 30, ORANGE, 10), W / 2, 210, t, 0.1, t1=t1, anchor="m")
        colw = (W - 160) / 4
        for i, (val, unit, label) in enumerate(self.ITEMS):
            cx = 80 + colw * (i + 0.5)
            t0 = 0.35 + 0.22 * i
            p = out_cubic((t - t0) / 1.6)
            v = int(round(val * p))
            num = text_img(f"{v:,}".replace(",", " "), "Black", 108, WHITE)
            # largeur finale fixe pour que le compteur ne « danse » pas
            full = text_img(f"{val:,}".replace(",", " "), "Black", 108, WHITE)
            u = text_img(unit.strip(), "Bold", 54, ORANGE) if unit else None
            uw = u.width - 2 * SHADOW_PAD + 10 if u else 0
            x0 = cx - (full.width - 2 * SHADOW_PAD + uw) / 2
            reveal(ov, num, x0 + (full.width - num.width), 420, t, t0, dur=0.6, t1=t1)
            if u:
                reveal(ov, u, x0 + full.width - 2 * SHADOW_PAD + 10, 466, t, t0 + 0.1, dur=0.6, t1=t1)
            reveal(ov, text_img(label, "Regular", 32, LIGHT), cx, 590, t, t0 + 0.15, t1=t1, anchor="m")
            if i:
                x = 80 + colw * i
                bar(d, x, 410, 2, 220, out_expo((t - t0) / 0.8), color=(255, 255, 255, 70), vertical=True)
        lw = 500 * out_expo((t - 1.4) / 0.8)
        d.rectangle((W / 2 - lw / 2, 720, W / 2 + lw / 2, 724), fill=ORANGE)
        reveal(ov, text_img("Certifications Qualibat  ·  RGE", "Medium", 40, WHITE, 2), W / 2, 760, t, 1.6,
               t1=t1, anchor="m")
        if t > self.dur - 0.5:
            ov = with_alpha(ov, 1 - smooth((t - (self.dur - 0.5)) / 0.4))
        return finish(bg, ov)


class Metiers(Shot):
    WORDS = ["Gros œuvre", "Maçonnerie générale", "Plâtrerie", "Carrelage",
             "Menuiserie intérieure", "Menuiserie extérieure"]

    def render(self, t):
        img = kenburns(photo("Rivoli_du_08.jpg"), t, self.dur, z=(1.05, 1.18), pan=(0.2, 0, -0.2, 0))
        img = Image.blend(img, Image.new("RGB", (W, H), DARK), 0.55)
        ov = Image.new("RGBA", (W, H), (0, 0, 0, 0))
        d = ImageDraw.Draw(ov)
        t1 = self.dur - 0.5
        bar(d, 120, 176, 70, 6, out_expo((t - 0.1) / 0.6))
        reveal(ov, text_img("NOS CŒURS DE MÉTIER", "SemiBold", 30, ORANGE, 8), 210, 160, t, 0.15, t1=t1)
        for i, w in enumerate(self.WORDS):
            reveal(ov, text_img(w, "Bold", 74, WHITE), 112, 240 + i * 96, t, 0.35 + 0.2 * i, dur=0.6, t1=t1)
        reveal(ov, text_img("+ la coordination de tous les corps d'état", "Light", 40, ORANGE), 120, 840, t,
               1.75, t1=t1)
        return finish(img, ov)


class Split(Shot):
    trans = "push"

    def __init__(self, dur, before, after, title, **kw):
        super().__init__(dur, **kw)
        self.before, self.after, self.title = before, after, title

    def render(self, t):
        half = (W // 2, H)
        a = kenburns(photo(self.before), t, self.dur, size=half, z=(1.12, 1.02))
        b = kenburns(photo(self.after), t, self.dur, size=half, z=(1.02, 1.12))
        img = Image.new("RGB", (W, H), DARK)
        img.paste(a, (0, 0))
        p = in_out((t - 0.15) / 0.75)
        vis = int(W // 2 * p)
        if vis > 0:
            img.paste(b.crop((0, 0, vis, H)), (W // 2, 0))
        ov = Image.new("RGBA", (W, H), (0, 0, 0, 0))
        ov.alpha_composite(gradient("bottom", 170))
        d = ImageDraw.Draw(ov)
        t1 = self.dur - 0.5
        if vis > 0:
            d.rectangle((W // 2 + vis - 4, 0, W // 2 + vis + 2, H), fill=ORANGE)
        self.tag(ov, "LE CHANTIER", 60, 60, t, 0.3, t1, dark=True)
        self.tag(ov, "LA LIVRAISON", W // 2 + 60, 60, t, 0.9, t1, dark=False)
        reveal(ov, text_img(self.title, "Bold", 54, WHITE), 60, H - 130, t, 0.5, t1=t1)
        return finish(img, ov)

    @staticmethod
    def tag(ov, txt, x, y, t, t0, t1, dark):
        ti = text_img(txt, "Bold", 26, WHITE if dark else DARK, 6)
        sp = SHADOW_PAD
        ti = ti.crop((sp, sp, ti.width - sp, ti.height - sp))
        pad = 18
        box = Image.new("RGBA", (ti.width + pad * 2, ti.height + pad), (17, 17, 19, 200) if dark else ORANGE + (255,))
        box.alpha_composite(ti, (pad, pad // 2))
        reveal(ov, box, x + sp, y + sp, t, t0, dur=0.5, t1=t1)


class Values(Shot):
    trans = "fade"

    def render(self, t):
        img = kenburns(photo("Miromesnil_01.jpg"), t, self.dur, z=(1.0, 1.1), pan=(0, 0.3, 0, -0.1))
        img = Image.blend(img, Image.new("RGB", (W, H), DARK), 0.7)
        ov = Image.new("RGBA", (W, H), (0, 0, 0, 0))
        t1 = self.dur - 0.5
        words = ["Service.", "Qualité.", "Exigence."]
        imgs = [text_img(w, "Black", 128, WHITE if i != 2 else ORANGE) for i, w in enumerate(words)]
        gap = 60
        total = sum(i.width for i in imgs) + gap * 2
        x = (W - total) / 2
        for i, im in enumerate(imgs):
            reveal(ov, im, x, 380, t, 0.25 + 0.5 * i, dur=0.7, t1=t1)
            x += im.width + gap
        reveal(ov, text_img("Une entreprise familiale. Une équipe pérenne. Des clients fidèles depuis 1991.",
                            "Light", 38, LIGHT), W / 2, 600, t, 1.9, t1=t1, anchor="m")
        return finish(img, ov)


class Clients(Shot):
    LINES = ["Investisseurs institutionnels", "Foncières", "Bailleurs sociaux", "Collectivités",
             "Agences d'architecture"]

    def render(self, t):
        bg = kenburns(photo_soft("Washington_001w.jpg", 0.3), t, self.dur, z=(1.05, 1.15))
        ov = Image.new("RGBA", (W, H), (0, 0, 0, 0))
        d = ImageDraw.Draw(ov)
        t1 = self.dur - 0.5
        reveal(ov, text_img("ILS NOUS CONFIENT LEURS PROJETS", "SemiBold", 30, ORANGE, 9), W / 2, 250, t, 0.1,
               t1=t1, anchor="m")
        for i, l in enumerate(self.LINES):
            reveal(ov, text_img(l, "Bold", 64, WHITE), W / 2, 340 + i * 88, t, 0.3 + 0.15 * i, dur=0.6, t1=t1,
                   anchor="m")
        lw = 300 * out_expo((t - 1.2) / 0.7)
        d.rectangle((W / 2 - lw / 2, 810, W / 2 + lw / 2, 813), fill=ORANGE)
        return finish(bg, ov)


class Outro(Shot):
    def render(self, t):
        bg = kenburns(photo_soft("BRTC_accueil_002.jpg", 0.2), t, self.dur, z=(1.0, 1.08))
        ov = Image.new("RGBA", (W, H), (0, 0, 0, 0))
        d = ImageDraw.Draw(ov)
        lg = logo_white(700)
        p = out_cubic((t - 0.2) / 1.1)
        if p > 0:
            s = 1.06 - 0.06 * p
            lgs = lg.resize((int(lg.width * s), int(lg.height * s)), Image.LANCZOS)
            ov.alpha_composite(with_alpha(lgs, p), (int((W - lgs.width) / 2), int(250 - (lgs.height - lg.height) / 2)))
        lw = 700 * out_expo((t - 0.6) / 1.0)
        d.rectangle((W / 2 - lw / 2, 560, W / 2 + lw / 2, 563), fill=ORANGE)
        reveal(ov, text_img("Rénovation & réhabilitation tous corps d'état", "Medium", 40, WHITE), W / 2, 600, t,
               0.9, anchor="m")
        reveal(ov, text_img("brtc.fr", "Bold", 64, ORANGE), W / 2, 690, t, 1.3, anchor="m")
        reveal(ov, text_img("4 rue de l'Écluse des Vertus  ·  93300 Aubervilliers", "Light", 32, LIGHT), W / 2, 790,
               t, 1.6, anchor="m")
        out = finish(bg, ov)
        k = smooth((t - (self.dur - 1.2)) / 1.1)
        if k > 0:
            out = Image.blend(out, Image.new("RGB", (W, H), (0, 0, 0)), k)
        return out


# --------------------------------------------------------------------------- montage
def build():
    R, T = "RÉSIDENTIEL", "TERTIAIRE"
    shots = [
        Intro(5.5),
        PhotoShot(4.5, "Raynouard_01.jpg", z=(1.12, 1.0), pan=(0.3, 0, 0.3, 0), trans="wipe",
                  kicker="BRTC  ·  DEPUIS 1991",
                  headline=[("Rénovation", "Black", WHITE), ("& réhabilitation", "Light", ORANGE)],
                  sub="Le spécialiste du bâti parisien, tous corps d'état."),
        PhotoShot(3.5, "Poincare_219.jpg", z=(1.0, 1.12), pan=(0, 0, 0.2, 0),
                  headline=[("Résidentiel", "Black", WHITE), ("& tertiaire", "Light", ORANGE)],
                  sub="Paris & Île-de-France"),
        PhotoShot(3.5, "Henri_4_18.jpg", z=(1.18, 1.02),
                  headline=[("Au service des", "Light", WHITE), ("professionnels", "Black", WHITE),
                            ("de l'immobilier", "Black", ORANGE)]),
        Stats(6.5, trans="fade"),

        SectionCard(3.0, "01", "Résidentiel", "Des immeubles du XVIIe siècle à l'haussmannien", "Poincare_211b.jpg"),
        PhotoShot(3.0, "Poincare_211b.jpg", z=(1.0, 1.1), pan=(0, 0.2, 0, -0.2), kicker=R, title="Avenue Poincaré",
                  sub="Restructuration lourde  ·  Paris"),
        PhotoShot(3.0, "Kleber_20.jpg", z=(1.12, 1.0), kicker=R, title="Avenue Kléber",
                  sub="Moulures, parquets et cheminées restitués"),
        PhotoShot(3.0, "Coetlogon_01.jpg", z=(1.0, 1.1), pan=(-0.3, 0, 0.3, 0), kicker=R, title="Rue Coëtlogon",
                  sub="Réhabilitation complète  ·  Paris", trans="push"),
        PhotoShot(3.0, "Raynouard_09.jpg", z=(1.0, 1.12), kicker=R, title="Rue Raynouard",
                  sub="Le patrimoine, avec les touches de modernité"),
        PhotoShot(3.0, "Rivoli_du_20.jpg", z=(1.12, 1.0), kicker=R, title="Rue de Rivoli",
                  sub="Création d'un duplex sous combles"),
        PhotoShot(3.0, "Malakoff_015w.jpg", z=(1.0, 1.1), kicker=R, title="Avenue Malakoff",
                  sub="Parties communes rénovées"),

        Metiers(5.0, trans="wipe"),
        Split(3.5, "Henri_4_12.jpg", "Henri_4_24.jpg", "Boulevard Henri IV", trans="fade"),
        Split(3.5, "Kleber_10.jpg", "Kleber_20.jpg", "Avenue Kléber"),
        Split(3.5, "Washington_018w.jpg", "Washington_006w.jpg", "Rue Washington"),

        SectionCard(3.0, "02", "Tertiaire", "Bureaux récents ou anciens, lots techniques et patrimoine",
                    "Washington_001w.jpg"),
        PhotoShot(3.0, "Washington_001w.jpg", z=(1.1, 1.0), kicker=T, title="Rue Washington",
                  sub="Plateaux de bureaux  ·  Paris 8e"),
        PhotoShot(3.0, "Equinoxe_23.jpg", z=(1.0, 1.12), pan=(0.2, 0, -0.2, 0), kicker=T, title="Avenue de France",
                  sub="Espaces de restauration et de travail"),
        PhotoShot(3.0, "Musee_W_05.jpg", z=(1.0, 1.1), trans="push", kicker=T, title="Musée des Arts Décoratifs",
                  sub="Bibliothèques et bureaux"),
        PhotoShot(3.0, "Honore_aa.jpg", z=(1.12, 1.0), pan=(0, 0.2, 0, 0), kicker=T, title="Rue Saint-Honoré",
                  sub="Hôtel particulier réhabilité"),
        PhotoShot(2.5, "Miromesnil_84.jpg", z=(1.0, 1.12), kicker=T, title="Rue de Miromesnil",
                  sub="Plâtrerie, parquet, menuiseries"),
        PhotoShot(2.5, "Boetie_01.jpg", z=(1.12, 1.0), kicker=T, title="Rue La Boétie", sub="Accueil & finitions"),
        PhotoShot(2.5, "Washington_024w.jpg", z=(1.0, 1.1), kicker=T, title="Le soin du détail",
                  sub="Jusqu'à la dernière finition"),

        SectionCard(3.0, "03", "L'atelier", "Notre menuiserie intégrée à Aubervilliers", "Atelier_web_02.jpg"),
        PhotoShot(3.5, "Atelier_web_02.jpg", z=(1.0, 1.12), kicker="L'ATELIER DE MENUISERIE",
                  title="600 m² de production", sub="Centre de sciage et centre d'usinage 5 axes BIESSE"),
        PhotoShot(3.0, "Equinoxe_05.jpg", z=(1.15, 1.0), pan=(0, -0.3, 0, 0.3), kicker="L'ATELIER DE MENUISERIE",
                  title="Du plan à la pose", sub="Conception CABINET VISION, commandes numériques"),
        PhotoShot(3.0, "Raynouard_18.jpg", z=(1.0, 1.1), kicker="L'ATELIER DE MENUISERIE",
                  title="Agencements & bois massif", sub="Tout est fabriqué chez nous"),
        PhotoShot(3.0, "BRTC_interieur_10.jpg", z=(1.12, 1.0), kicker="L'ENTREPÔT", title="2 500 m² de stockage",
                  sub="Un stock tampon pour approvisionner les chantiers", trans="push"),
        PhotoShot(3.0, "BRTC_interieur_12.jpg", z=(1.0, 1.1), pan=(-0.2, 0, 0.2, 0), kicker="L'ENTREPÔT",
                  title="Logistique mutualisée", sub="Livraisons regroupées par secteur"),

        SectionCard(3.0, "04", "Nos locaux", "Siège, entrepôt et atelier réunis depuis 2013", "BRTC_accueil_002.jpg"),
        PhotoShot(3.5, "BRTC_accueil_002.jpg", z=(1.0, 1.12), pan=(0, 0, -0.2, 0.2), kicker="AUBERVILLIERS",
                  title="Un bâtiment unique", sub="Siège social, entrepôt et atelier"),
        PhotoShot(3.0, "BRTC_octobre21_01_web.jpg", z=(1.12, 1.0), kicker="LE SIÈGE", title="Notre accueil",
                  sub="4 rue de l'Écluse des Vertus"),
        PhotoShot(3.0, "BRTC_octobre21_03_web.jpg", z=(1.0, 1.1), kicker="LE SIÈGE", title="Bureau d'études",
                  sub="Réponse aux appels d'offres, suivi des projets"),
        PhotoShot(3.0, "terasse_BRTC_01.jpg", z=(1.1, 1.0), kicker="RSE", title="Toiture végétalisée",
                  sub="100 % électricité verte  ·  6 bornes de recharge  ·  tri et recyclage",
                  trans="push"),

        Values(5.0, trans="fade"),
        Clients(4.0, trans="fade"),
        Outro(7.0, trans="wipe"),
    ]
    t = 0.0
    for i, s in enumerate(shots):
        if i:
            t -= s.tdur
        s.start = t
        t += s.dur
    return shots, t


SHOTS, TOTAL = build()


def wipe(a, b, p):
    """Volet diagonal avec bande orange aux couleurs BRTC."""
    p = in_out(p)
    skew, band = 300, 110
    xe = -skew - band + p * (W + 2 * skew + 2 * band)
    out = a.copy()
    m = Image.new("L", (W, H), 0)
    ImageDraw.Draw(m).polygon([(-10, 0), (xe + skew, 0), (xe, H), (-10, H)], fill=255)
    out.paste(b, (0, 0), m)
    ImageDraw.Draw(out).polygon([(xe + skew, 0), (xe + skew + band, 0), (xe + band, H), (xe, H)], fill=ORANGE)
    return out


def push(a, b, p):
    p = in_out(p)
    off = int(W * p)
    out = Image.new("RGB", (W, H))
    out.paste(a, (-off, 0))
    out.paste(b, (W - off, 0))
    return out


def frame(i):
    T = i / FPS
    act = [s for s in SHOTS if s.start <= T < s.start + s.dur]
    if not act:
        act = [SHOTS[-1]]
    if len(act) == 1:
        img = act[0].render(T - act[0].start)
    else:
        a, b = act[0], act[-1]
        p = (T - b.start) / b.tdur
        ia, ib = a.render(T - a.start), b.render(T - b.start)
        if b.trans == "wipe":
            img = wipe(ia, ib, p)
        elif b.trans == "push":
            img = push(ia, ib, p)
        else:
            img = Image.blend(ia, ib, smooth(p))
    arr = np.asarray(img).astype(np.float32) * vignette()
    return np.clip(arr, 0, 255).astype(np.uint8).tobytes()


def main():
    global PHOTOS
    photos_dir = sys.argv[1] if len(sys.argv) > 1 else PHOTOS
    out = sys.argv[2] if len(sys.argv) > 2 else "BRTC_video_promo.mp4"
    os.environ["BRTC_PHOTOS"] = PHOTOS = photos_dir
    only = os.environ.get("BRTC_PREVIEW")  # ex. "12.5,40" : images fixes pour contrôle

    if only:
        for ts in only.split(","):
            Image.frombytes("RGB", (W, H), frame(int(float(ts) * FPS))).save(f"preview_{ts}.jpg", quality=90)
        return

    sections = [s.start for s in SHOTS if isinstance(s, SectionCard)]
    values = next(s for s in SHOTS if isinstance(s, Values))
    clients = next(s for s in SHOTS if isinstance(s, Clients))
    outro = SHOTS[-1]
    cues = {
        "drop": SHOTS[1].start,
        "sections": sections + [next(s for s in SHOTS if isinstance(s, Metiers)).start],
        "breakdown": (values.start, clients.start),
        "outro": outro.start,
    }
    nframes = int(round(TOTAL * FPS))
    with tempfile.TemporaryDirectory() as tmp:
        wav = os.path.join(tmp, "music.wav")
        make_music(nframes / FPS, cues, wav)
        cmd = ["ffmpeg", "-y", "-loglevel", "error", "-f", "rawvideo", "-pix_fmt", "rgb24", "-s", f"{W}x{H}",
               "-r", str(FPS), "-i", "-", "-i", wav, "-c:v", "libx264", "-preset", "slow", "-crf", "19",
               "-pix_fmt", "yuv420p", "-profile:v", "high", "-c:a", "aac", "-b:a", "192k",
               "-movflags", "+faststart", "-shortest", out]
        ff = subprocess.Popen(cmd, stdin=subprocess.PIPE)
        with Pool(os.cpu_count()) as pool:
            for k, buf in enumerate(pool.imap(frame, range(nframes), chunksize=6)):
                ff.stdin.write(buf)
                if k % 150 == 0:
                    print(f"{k}/{nframes}", flush=True)
        ff.stdin.close()
        ff.wait()
    print(f"OK {out}  ({TOTAL:.1f} s)")


if __name__ == "__main__":
    main()
