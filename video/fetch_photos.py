"""Télécharge depuis brtc.fr les photos retenues pour la vidéo promotionnelle.

Sélection faite à la main : uniquement des photos de réalisations, de l'atelier
et des locaux SANS AUCUNE PERSONNE visible (règle interne).

Usage : python3 fetch_photos.py <dossier_destination>
"""
import os
import sys
import time
import urllib.request

BASE = "https://brtc.fr/wp-content/uploads/"

PHOTOS = [
    # Identité
    "2020/10/LOGO-BRTC_fond3.png",
    # Résidentiel
    "2025/03/Raynouard_01.jpg",
    "2025/03/Raynouard_09.jpg",
    "2025/03/Raynouard_18.jpg",
    "2022/03/Poincare_211b.jpg",
    "2022/03/Poincare_219.jpg",
    "2024/08/Coetlogon_01.jpg",
    "2026/07/Kleber_10.jpg",
    "2026/07/Kleber_20.jpg",
    "2026/04/Henri_4_12.jpg",
    "2026/04/Henri_4_18.jpg",
    "2026/04/Henri_4_24.jpg",
    "2026/01/Rivoli_du_08.jpg",
    "2026/01/Rivoli_du_20.jpg",
    "2025/07/Malakoff_005w.jpg",
    "2025/07/Malakoff_015w.jpg",
    "2024/03/ValeryA_01.jpg",
    # Tertiaire
    "2025/07/Washington_001w.jpg",
    "2025/07/Washington_006w.jpg",
    "2025/07/Washington_018w.jpg",
    "2025/07/Washington_024w.jpg",
    "2026/01/Equinoxe_05.jpg",
    "2026/01/Equinoxe_23.jpg",
    "2025/03/Musee_W_05.jpg",
    "2025/03/Musee_W_09.jpg",
    "2023/04/Honore_aa.jpg",
    "2023/04/Honore_300b.jpg",
    "2020/10/Miromesnil_01.jpg",
    "2020/09/Miromesnil_84.jpg",
    "2021/04/Boetie_01.jpg",
    # Atelier & entrepôt
    "2026/07/Atelier_web_02.jpg",
    "2026/07/Atelier_web_06.jpg",
    "2021/08/BRTC_interieur_10.jpg",
    "2021/08/BRTC_interieur_12.jpg",
    # Locaux
    "2020/08/BRTC_accueil_002.jpg",
    "2020/10/BRTC_diapo_02.jpg",
    "2021/10/pl12_024.jpg",
    "2021/10/BRTC_octobre21_01_web.jpg",
    "2021/10/BRTC_octobre21_03_web.jpg",
    "2021/10/BRTC_octobre21_11_web.jpg",
    "2021/11/terasse_BRTC_01.jpg",
]


def main():
    dest = sys.argv[1] if len(sys.argv) > 1 else "photos"
    os.makedirs(dest, exist_ok=True)
    for rel in PHOTOS:
        out = os.path.join(dest, os.path.basename(rel))
        if os.path.exists(out):
            continue
        for attempt in range(5):
            try:
                with urllib.request.urlopen(BASE + rel, timeout=60) as r, open(out, "wb") as f:
                    f.write(r.read())
                break
            except OSError:
                time.sleep(2 ** attempt)
        else:
            sys.exit(f"Échec du téléchargement : {rel}")
        print("ok", rel)


if __name__ == "__main__":
    main()
