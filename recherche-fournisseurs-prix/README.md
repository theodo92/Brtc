# Recherche de fournisseurs et prix

Comparer, pour chaque besoin chantier, les prix que BRTC peut obtenir chez ses
fournisseurs et négoces, puis garder une trace des consultations.

## Organisation

```
recherche-fournisseurs-prix/
├── README.md                  ← ce fichier (méthode)
├── fournisseurs.csv           ← annuaire des fournisseurs consultés
└── consultations/
    └── AAAA-MM_produit/       ← une consultation = un dossier
        ├── README.md          ← besoin, comparatif, analyse, prochaines étapes
        ├── comparatif.csv     ← tableau de prix (s'ouvre dans Excel)
        ├── demande-de-prix.md ← modèle de demande à envoyer aux fournisseurs
        └── fournisseurs-paris.md ← fournisseurs locaux à appeler (stock, prix)
```

## Consultations

| Date | Produit | Statut | Dossier |
|---|---|---|---|
| Oct. 2026 | Plaque Rigitone Activ'Air 8/18 Q, bords droits, joints sans bande | Prix publics relevés, fournisseurs Paris identifiés, appels à passer | [`2026-10_rigitone-8-18-q`](consultations/2026-10_rigitone-8-18-q/README.md) |

## Méthode

1. **Fixer la référence exacte** : marque, gamme, référence fabricant, code EAN,
   dimensions, type de bord. Deux produits au nom proche peuvent être différents
   (ex. Rigitone 8/18 *à perforations rondes* ≠ Rigitone 8/18 **Q** *à perforations carrées*).
2. **Relever les prix publics** sur les sites des négoces (point de départ seulement).
3. **Envoyer une demande de prix** aux négoces retenus avec la quantité réelle,
   le lieu et la date de livraison. Les prix pros, remises et frais de livraison
   ne sont presque jamais publics.
4. **Comparer sur une base identique** : prix **HT au m²** *et* à la plaque, livraison
   comprise, délai, disponibilité, minimum de commande.
5. **Noter le résultat** dans `comparatif.csv` et mettre à jour `fournisseurs.csv`.

## Règles de lecture des prix

- Tous les montants sont ramenés en **€ HT** (TVA 20 % retirée quand le site affiche du TTC).
- Un prix sans date ou sans précision HT/TTC est marqué « à confirmer ».
- Les prix de sites de déstockage ou de revendeurs inconnus servent d'indication
  seulement : on n'achète que chez un fournisseur identifié (Kbis, adresse, facture).
