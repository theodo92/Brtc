# Tableau de bord BRTC (prototype v1)

Outil de pilotage pour BRTC : clients, devis, chantiers, planning et TVA.
Application web statique (HTML/CSS/JavaScript, sans installation ni dépendance).

## Ouvrir le tableau de bord

**Le plus simple :** double-cliquer sur `index.html` (aucune installation, aucun serveur).

Option serveur local (facultatif) :

```sh
./serve.sh            # puis ouvrir http://localhost:8080
# ou : python3 -m http.server 8080 (depuis ce dossier)
```

Le serveur doit rester lancé tant que la page est ouverte ; s'il est arrêté,
`localhost:8080` affiche « connexion refusée ».

## Écrans

| Écran | Ce qu'il fait |
|---|---|
| Tableau de bord | CA signé, devis en cours, taux de transformation, carnet de commandes, pipeline des devis, **actions automatiques du jour** |
| Clients | Liste filtrable, fiche client (devis, chantiers, volume) |
| Devis | Suivi par statut, alertes « à relancer » / « expire bientôt » |
| Générateur de devis | Bibliothèque d'ouvrages par lot TCE, modèles rapides (appartement, bureaux, salle d'eau, rénovation énergétique), TVA automatique par ligne, remise, acompte, retenue de garantie, aperçu PDF, conversion en chantier |
| Chantiers | Avancement vs temps écoulé, reste à facturer, émission de situation |
| Planning automatique | Gantt généré depuis un devis ou un chantier : enchaînement des corps d'état, durées calculées depuis les montants, jours fériés exclus, chemin critique |
| Calculateur TVA | 20 / 10 / 5,5 % / autoliquidation selon client, local et nature des travaux, avec la mention à porter |
| Charte graphique | `charte.html` |

## Règles automatiques (alertes)

- Devis envoyé depuis 15 jours ou plus sans réponse → relance
- Devis qui expire dans 10 jours ou moins, ou déjà expiré
- Chantier dont l'avancement a plus de 10 points de retard sur le temps écoulé, ou date de fin dépassée
- Travaux réalisés non facturés ≥ 10 000 € HT → situation à émettre
- Chantier qui démarre dans 14 jours ou moins → préparation (OS, DICT, commandes atelier)
- Chantier en réception → levée des réserves et solde

## Données

- Les clients sont **fictifs** (démonstration). Les prix de la bibliothèque (`js/data.js`) sont indicatifs : à remplacer par ceux de BRTC.
- Les modifications sont enregistrées dans le navigateur (localStorage). Bouton « Réinitialiser la démo » pour revenir au jeu de départ.
- Les mentions légales du devis (`ENTREPRISE` dans `js/data.js`) sont à compléter : SIRET, TVA intracommunautaire, assurance décennale.

## Fichiers

- `index.html`, `css/app.css` : interface et tokens de la charte
- `js/data.js` : lots, bibliothèque d'ouvrages, données de démonstration
- `js/utils.js` : calculs (devis, TVA, jours ouvrés et fériés, planning)
- `js/store.js` : stockage
- `js/app.js` : écrans et règles automatiques
