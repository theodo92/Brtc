// Données de référence + jeu de démonstration.
// Les clients ci-dessous sont FICTIFS (exemples) ; les prix unitaires sont indicatifs
// et doivent être remplacés par la bibliothèque de prix BRTC.

const ENTREPRISE = {
  nom: "BRTC",
  activite: "Entreprise générale de rénovation — tous corps d'état",
  adresse: "4 rue de l'Écluse des Vertus, 93300 Aubervilliers",
  site: "brtc.fr",
  depuis: 1991,
  siret: "[SIRET à compléter]",
  tvaIntra: "[N° TVA intracommunautaire à compléter]",
  assurance: "[Assureur décennale & n° de police à compléter]",
  certifications: "Qualibat (7 certificats)",
};

// Lots tous corps d'état, dans l'ordre d'enchaînement chantier.
// pred = lots qui doivent être terminés avant de démarrer.
// prod = production moyenne d'une équipe en € HT / jour ouvré (sert au planning auto).
const LOTS = [
  { code: "INST",   nom: "Installation de chantier",     pred: [],                     prod: 1500 },
  { code: "DEMO",   nom: "Démolition / curage",          pred: ["INST"],               prod: 1800 },
  { code: "GO",     nom: "Gros œuvre",                   pred: ["DEMO"],               prod: 2600 },
  { code: "MAC",    nom: "Maçonnerie générale",          pred: ["GO"],                 prod: 2200 },
  { code: "MENEXT", nom: "Menuiserie extérieure",        pred: ["MAC"],                prod: 3500 },
  { code: "ELEC",   nom: "Électricité",                  pred: ["MAC"],                prod: 1700 },
  { code: "PLB",    nom: "Plomberie / CVC",              pred: ["MAC"],                prod: 1900 },
  { code: "PLAT",   nom: "Plâtrerie / isolation",        pred: ["MENEXT", "ELEC", "PLB"], prod: 2000 },
  { code: "CAR",    nom: "Carrelage / faïence",          pred: ["PLAT"],               prod: 1600 },
  { code: "MENINT", nom: "Menuiserie intérieure",        pred: ["PLAT"],               prod: 2400 },
  { code: "PEINT",  nom: "Peinture / revêtements",       pred: ["CAR", "MENINT"],      prod: 1500 },
  { code: "NET",    nom: "Nettoyage & réception",        pred: ["PEINT"],              prod: 1200 },
];

// Bibliothèque d'ouvrages (prix indicatifs Île-de-France, € HT).
// energie: true => éligible au taux réduit 5,5 % (rénovation énergétique, logement > 2 ans).
const BIBLIO = [
  { code: "INST-01", lot: "INST", designation: "Installation et repli de chantier (base vie, protections)", unite: "fft", pu: 2800 },
  { code: "INST-02", lot: "INST", designation: "Protection des parties communes", unite: "fft", pu: 950 },
  { code: "INST-03", lot: "INST", designation: "Benne et évacuation des gravats", unite: "u", pu: 620 },
  { code: "DEMO-01", lot: "DEMO", designation: "Curage complet appartement", unite: "m²", pu: 48 },
  { code: "DEMO-02", lot: "DEMO", designation: "Dépose de cloisons", unite: "m²", pu: 32 },
  { code: "DEMO-03", lot: "DEMO", designation: "Dépose de revêtements de sol", unite: "m²", pu: 18 },
  { code: "GO-01", lot: "GO", designation: "Ouverture de mur porteur avec IPN (étaiement compris)", unite: "u", pu: 4200 },
  { code: "GO-02", lot: "GO", designation: "Reprise en sous-œuvre", unite: "ml", pu: 680 },
  { code: "GO-03", lot: "GO", designation: "Dalle béton armé", unite: "m²", pu: 145 },
  { code: "MAC-01", lot: "MAC", designation: "Ragréage de sol", unite: "m²", pu: 28 },
  { code: "MAC-02", lot: "MAC", designation: "Chape fluide", unite: "m²", pu: 38 },
  { code: "MAC-03", lot: "MAC", designation: "Rebouchage et reprise de maçonnerie", unite: "fft", pu: 1500 },
  { code: "MENEXT-01", lot: "MENEXT", designation: "Fenêtre bois double vitrage (Uw ≤ 1,3)", unite: "u", pu: 1350, energie: true },
  { code: "MENEXT-02", lot: "MENEXT", designation: "Porte-fenêtre bois double vitrage (Uw ≤ 1,3)", unite: "u", pu: 1850, energie: true },
  { code: "MENEXT-03", lot: "MENEXT", designation: "Porte palière blindée", unite: "u", pu: 2400 },
  { code: "ELEC-01", lot: "ELEC", designation: "Mise aux normes NF C 15-100 (logement)", unite: "m²", pu: 95 },
  { code: "ELEC-02", lot: "ELEC", designation: "Tableau électrique complet", unite: "u", pu: 1650 },
  { code: "ELEC-03", lot: "ELEC", designation: "Point lumineux / prise", unite: "u", pu: 85 },
  { code: "PLB-01", lot: "PLB", designation: "Création salle d'eau complète (alimentations, évacuations)", unite: "u", pu: 4800 },
  { code: "PLB-02", lot: "PLB", designation: "Remplacement chaudière par PAC air/eau", unite: "u", pu: 11500, energie: true },
  { code: "PLB-03", lot: "PLB", designation: "Radiateur à eau chaude", unite: "u", pu: 520 },
  { code: "PLAT-01", lot: "PLAT", designation: "Cloison plaque de plâtre 72/48 isolée", unite: "m²", pu: 58 },
  { code: "PLAT-02", lot: "PLAT", designation: "Doublage isolant murs extérieurs (R ≥ 3,7)", unite: "m²", pu: 72, energie: true },
  { code: "PLAT-03", lot: "PLAT", designation: "Faux plafond plaque de plâtre", unite: "m²", pu: 52 },
  { code: "PLAT-04", lot: "PLAT", designation: "Isolation des combles perdus (R ≥ 7)", unite: "m²", pu: 38, energie: true },
  { code: "CAR-01", lot: "CAR", designation: "Carrelage sol grès cérame (pose collée)", unite: "m²", pu: 92 },
  { code: "CAR-02", lot: "CAR", designation: "Faïence murale", unite: "m²", pu: 85 },
  { code: "CAR-03", lot: "CAR", designation: "Plinthes carrelage", unite: "ml", pu: 18 },
  { code: "MENINT-01", lot: "MENINT", designation: "Bloc-porte intérieur fabriqué en atelier", unite: "u", pu: 680 },
  { code: "MENINT-02", lot: "MENINT", designation: "Placard sur mesure (atelier)", unite: "ml", pu: 950 },
  { code: "MENINT-03", lot: "MENINT", designation: "Parquet chêne massif", unite: "m²", pu: 115 },
  { code: "MENINT-04", lot: "MENINT", designation: "Agencement bois sur mesure (atelier)", unite: "fft", pu: 6500 },
  { code: "PEINT-01", lot: "PEINT", designation: "Peinture murs et plafonds (2 couches)", unite: "m²", pu: 26 },
  { code: "PEINT-02", lot: "PEINT", designation: "Enduit de lissage", unite: "m²", pu: 14 },
  { code: "PEINT-03", lot: "PEINT", designation: "Peinture menuiseries", unite: "u", pu: 120 },
  { code: "NET-01", lot: "NET", designation: "Nettoyage fin de chantier", unite: "m²", pu: 6 },
  { code: "NET-02", lot: "NET", designation: "Réception, levée des réserves, DOE", unite: "fft", pu: 650 },
];

const TYPES_CLIENT = ["Foncière", "Bailleur social", "Investisseur institutionnel", "Collectivité", "Agence d'architecture", "Gestion privée"];

const CLIENTS = [
  { id: "c1", nom: "Foncière Haussmann Patrimoine", type: "Foncière", contact: "M. Laurent", email: "contact@exemple-fonciere.fr", tel: "01 00 00 00 01", ville: "Paris 8e", depuis: 2014 },
  { id: "c2", nom: "Habitat Seine-Saint-Denis (exemple)", type: "Bailleur social", contact: "Mme Bernard", email: "travaux@exemple-bailleur.fr", tel: "01 00 00 00 02", ville: "Bobigny", depuis: 2009 },
  { id: "c3", nom: "Capital Pierre Gestion", type: "Investisseur institutionnel", contact: "M. Petit", email: "asset@exemple-invest.fr", tel: "01 00 00 00 03", ville: "Paris 16e", depuis: 2018 },
  { id: "c4", nom: "Ville d'exemple — Services techniques", type: "Collectivité", contact: "Mme Moreau", email: "st@exemple-ville.fr", tel: "01 00 00 00 04", ville: "Aubervilliers", depuis: 2020 },
  { id: "c5", nom: "Atelier d'architecture Lumière", type: "Agence d'architecture", contact: "M. Garnier", email: "agence@exemple-archi.fr", tel: "01 00 00 00 05", ville: "Paris 11e", depuis: 2016 },
  { id: "c6", nom: "Cabinet Gestion Rivoli", type: "Gestion privée", contact: "Mme Fontaine", email: "gestion@exemple-gp.fr", tel: "01 00 00 00 06", ville: "Paris 1er", depuis: 2021 },
  { id: "c7", nom: "Bureaux & Commerces SCI", type: "Foncière", contact: "M. Roux", email: "sci@exemple-bureaux.fr", tel: "01 00 00 00 07", ville: "Neuilly-sur-Seine", depuis: 2019 },
];

const L = (code, qte, extra = {}) => {
  const b = BIBLIO.find(x => x.code === code);
  return { lot: b.lot, designation: b.designation, unite: b.unite, qte, pu: b.pu, energie: !!b.energie, ...extra };
};

// Statuts devis : brouillon, envoye, negociation, accepte, refuse
const DEVIS = [
  { id: "d1", numero: "D-2026-041", clientId: "c1", objet: "Rénovation complète appartement 180 m²", adresse: "Avenue Kléber, Paris 16e", date: "2026-09-02", validite: 60, statut: "envoye", local: "logement", regime: "direct", remise: 0, retenue: true,
    lignes: [L("INST-01",1),L("INST-02",1),L("DEMO-01",180),L("GO-01",1),L("MAC-02",150),L("MENEXT-01",8,{}),L("ELEC-01",180),L("PLB-01",2),L("PLAT-01",90),L("PLAT-02",110),L("CAR-01",35),L("CAR-02",48),L("MENINT-01",9),L("MENINT-03",120),L("PEINT-01",520),L("NET-01",180),L("NET-02",1)] },
  { id: "d2", numero: "D-2026-042", clientId: "c3", objet: "Réhabilitation plateau de bureaux 420 m²", adresse: "Rue de Miromesnil, Paris 8e", date: "2026-09-10", validite: 30, statut: "negociation", local: "tertiaire", regime: "direct", remise: 3, retenue: true,
    lignes: [L("INST-01",1),L("DEMO-02",210),L("DEMO-03",420),L("ELEC-03",140),L("PLAT-01",260),L("PLAT-03",420),L("MENINT-01",14),L("MENINT-04",1),L("PEINT-01",1100),L("NET-01",420),L("NET-02",1)] },
  { id: "d3", numero: "D-2026-043", clientId: "c2", objet: "Remplacement menuiseries ext. — 24 logements", adresse: "Résidence des Vertus, Aubervilliers", date: "2026-08-21", validite: 90, statut: "envoye", local: "logement", regime: "direct", remise: 0, retenue: true,
    lignes: [L("INST-01",1),L("MENEXT-01",72),L("MENEXT-02",24),L("PEINT-03",96),L("NET-02",1)] },
  { id: "d4", numero: "D-2026-044", clientId: "c5", objet: "Lot plâtrerie & menuiserie intérieure (sous-traitance)", adresse: "Rue Raynouard, Paris 16e", date: "2026-09-28", validite: 30, statut: "brouillon", local: "logement", regime: "autoliquidation", remise: 0, retenue: false,
    lignes: [L("PLAT-01",140),L("PLAT-03",95),L("MENINT-02",12),L("MENINT-01",7)] },
  { id: "d5", numero: "D-2026-038", clientId: "c6", objet: "Rénovation cage d'escalier & parties communes", adresse: "Rue de Rivoli, Paris 1er", date: "2026-07-15", validite: 60, statut: "accepte", local: "logement", regime: "direct", remise: 2, retenue: true,
    lignes: [L("INST-02",1),L("MAC-03",1),L("PEINT-02",380),L("PEINT-01",380),L("ELEC-03",24),L("NET-01",120)] },
  { id: "d6", numero: "D-2026-036", clientId: "c7", objet: "Aménagement boutique rez-de-chaussée", adresse: "Rue Saint-Honoré, Paris 1er", date: "2026-06-30", validite: 30, statut: "refuse", local: "tertiaire", regime: "direct", remise: 0, retenue: false,
    lignes: [L("DEMO-01",95),L("PLAT-03",95),L("CAR-01",95),L("MENINT-04",1),L("PEINT-01",260)] },
  { id: "d7", numero: "D-2026-045", clientId: "c4", objet: "Rénovation énergétique école — isolation & PAC", adresse: "Groupe scolaire, Aubervilliers", date: "2026-10-05", validite: 60, statut: "envoye", local: "tertiaire", regime: "direct", remise: 0, retenue: true,
    lignes: [L("INST-01",1),L("PLAT-04",650),L("PLAT-02",420),L("PLB-02",3),L("PLB-03",28),L("MENEXT-01",36),L("NET-02",1)] },
  { id: "d8", numero: "D-2026-039", clientId: "c1", objet: "Rénovation appartement 95 m²", adresse: "Avenue Poincaré, Paris 16e", date: "2026-07-22", validite: 60, statut: "accepte", local: "logement", regime: "direct", remise: 0, retenue: true,
    lignes: [L("INST-01",1),L("DEMO-01",95),L("ELEC-01",95),L("PLB-01",1),L("PLAT-01",45),L("CAR-02",30),L("MENINT-03",70),L("PEINT-01",280),L("NET-01",95)] },
];

// Chantiers. factureHT = cumul des situations déjà facturées.
const CHANTIERS = [
  { id: "k1", ref: "CH-2026-112", nom: "Appartement Poincaré", clientId: "c1", devisId: "d8", adresse: "Avenue Poincaré, Paris 16e", type: "Résidentiel", montantHT: 0, debut: "2026-09-07", fin: "2026-11-27", avancement: 55, factureHT: 38000, conducteur: "Conducteur A", statut: "en_cours" },
  { id: "k2", ref: "CH-2026-108", nom: "Parties communes Rivoli", clientId: "c6", devisId: "d5", adresse: "Rue de Rivoli, Paris 1er", type: "Résidentiel", montantHT: 0, debut: "2026-09-14", fin: "2026-10-30", avancement: 40, factureHT: 9000, conducteur: "Conducteur B", statut: "en_cours" },
  { id: "k3", ref: "CH-2026-097", nom: "Plateau bureaux Washington", clientId: "c3", adresse: "Rue Washington, Paris 8e", type: "Tertiaire", montantHT: 612000, debut: "2026-05-04", fin: "2026-10-23", avancement: 92, factureHT: 520000, conducteur: "Conducteur A", statut: "en_cours" },
  { id: "k4", ref: "CH-2026-101", nom: "Hôtel particulier Malakoff", clientId: "c1", adresse: "Avenue Malakoff, Paris 16e", type: "Résidentiel", montantHT: 845000, debut: "2026-06-01", fin: "2027-01-29", avancement: 48, factureHT: 360000, conducteur: "Conducteur C", statut: "en_cours" },
  { id: "k5", ref: "CH-2026-089", nom: "Réhabilitation logements Coëtlogon", clientId: "c2", adresse: "Rue Coëtlogon, Paris 6e", type: "Résidentiel", montantHT: 398000, debut: "2026-03-02", fin: "2026-09-25", avancement: 100, factureHT: 378100, conducteur: "Conducteur B", statut: "reception" },
  { id: "k6", ref: "CH-2026-115", nom: "Bureaux Avenue de France", clientId: "c7", adresse: "Avenue de France, Paris 13e", type: "Tertiaire", montantHT: 276000, debut: "2026-10-19", fin: "2027-02-12", avancement: 0, factureHT: 0, conducteur: "Conducteur C", statut: "preparation" },
  { id: "k7", ref: "CH-2025-074", nom: "Appartement Henri IV", clientId: "c3", adresse: "Boulevard Henri IV, Paris 4e", type: "Résidentiel", montantHT: 254000, debut: "2025-11-03", fin: "2026-04-17", avancement: 100, factureHT: 254000, conducteur: "Conducteur A", statut: "livre" },
];

// CA signé (devis acceptés) par mois, € HT — historique de démonstration.
const CA_SIGNE = [
  { mois: "2025-11", ht: 1210000 }, { mois: "2025-12", ht: 980000 }, { mois: "2026-01", ht: 1420000 },
  { mois: "2026-02", ht: 1150000 }, { mois: "2026-03", ht: 1680000 }, { mois: "2026-04", ht: 1390000 },
  { mois: "2026-05", ht: 1540000 }, { mois: "2026-06", ht: 1820000 }, { mois: "2026-07", ht: 1260000 },
  { mois: "2026-08", ht: 640000 },  { mois: "2026-09", ht: 1470000 }, { mois: "2026-10", ht: 0 },
];
