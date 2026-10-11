# Vidéo promotionnelle BRTC

Film de présentation de BRTC (~1 min 54, 1920×1080, 30 i/s, H.264 + AAC), réalisé
à partir des photos publiées sur [brtc.fr](https://brtc.fr).

Fichier final : [`BRTC_video_promo.mp4`](BRTC_video_promo.mp4)

## Déroulé

| Temps | Séquence | Contenu |
|---|---|---|
| 0:00 | Ouverture | Logo BRTC, « Entreprise générale de rénovation — tous corps d'état, depuis 1991 » |
| 0:05 | Accroche | Rénovation & réhabilitation · Résidentiel & tertiaire · Au service des professionnels de l'immobilier |
| 0:15 | Chiffres clés | 35 ans, 50 collaborateurs, 18 M€ de CA 2025, 2 500 m² d'entrepôt, Qualibat · RGE |
| 0:21 | 01 — Résidentiel | Av. Poincaré, Av. Kléber, Rue Coëtlogon, Rue Raynouard, Rue de Rivoli, Av. Malakoff |
| 0:38 | Nos cœurs de métier | Gros œuvre, maçonnerie, plâtrerie, carrelage, menuiseries intérieure et extérieure |
| 0:43 | Du chantier à la livraison | Écrans partagés avant / après : Bd Henri IV, Av. Kléber, Rue Washington |
| 0:52 | 02 — Tertiaire | Rue Washington, Av. de France, Musée des Arts Décoratifs, Rue Saint-Honoré, Rue de Miromesnil, Rue La Boétie |
| 1:10 | 03 — L'atelier | Atelier de menuiserie (600 m², BIESSE, CABINET VISION), entrepôt de 2 500 m² |
| 1:25 | 04 — Nos locaux | Bâtiment d'Aubervilliers, accueil, bureau d'études, toiture végétalisée (RSE) |
| 1:39 | Valeurs | Service. Qualité. Exigence. |
| 1:43 | Clients | Investisseurs institutionnels, foncières, bailleurs sociaux, collectivités, architectes |
| 1:47 | Clôture | Logo, brtc.fr, adresse |

## Choix

- **Photos** : uniquement des photos du site, et seulement celles où l'on ne voit
  **aucune personne** (règle de l'entreprise). Les photos de l'atelier avec des
  menuisiers ou des passants dans la rue ont été écartées.
- **Charte** : orange BRTC `#FBAD1C`, anthracite, typographie Inter Display. Le
  logo est passé en version blanche (texte « BRTC ») pour la lecture sur fond sombre.
- **Mise en scène** : mouvements de caméra lents sur chaque photo (Ken Burns),
  titres animés, volets diagonaux orange entre les sections, écrans partagés
  « chantier / livraison », compteurs animés.
- **Musique** : composition originale générée par programme (`music.py`), donc
  libre de droits. Montage calé sur le tempo (120 BPM), avec un impact à chaque section.
  Elle peut être remplacée par une musique sous licence (voir ci-dessous).

## Régénérer la vidéo

Prérequis : Python 3 avec `numpy` et `Pillow`, `ffmpeg`, police Inter Display.

```bash
cd video
python3 fetch_photos.py photos                  # télécharge les photos depuis brtc.fr
python3 make_video.py photos BRTC_video_promo.mp4
```

Les textes, l'ordre et la durée des plans sont tous dans la fonction `build()`
de `make_video.py`. Pour contrôler une image sans tout recalculer :
`BRTC_PREVIEW=12.5,40 python3 make_video.py photos x.mp4`.

Pour remplacer la musique par un autre fichier audio :

```bash
ffmpeg -i BRTC_video_promo.mp4 -i musique.mp3 -map 0:v -map 1:a -c:v copy -c:a aac -b:a 192k -shortest BRTC_video_promo_v2.mp4
```
