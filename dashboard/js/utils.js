import { LOTS } from "./data.js";

// ---------- Formats ----------
const eur = new Intl.NumberFormat("fr-FR", { style: "currency", currency: "EUR", maximumFractionDigits: 0 });
const eur2 = new Intl.NumberFormat("fr-FR", { style: "currency", currency: "EUR", minimumFractionDigits: 2, maximumFractionDigits: 2 });
const num = new Intl.NumberFormat("fr-FR", { maximumFractionDigits: 2 });
export const fmtEur = v => eur.format(Math.round(v || 0));
export const fmtEur2 = v => eur2.format(v || 0);
export const fmtNum = v => num.format(v || 0);
export const fmtK = v => {
  const a = Math.abs(v);
  if (a >= 1e6) return (v / 1e6).toLocaleString("fr-FR", { maximumFractionDigits: 2 }) + " M€";
  if (a >= 1e3) return Math.round(v / 1e3).toLocaleString("fr-FR") + " k€";
  return fmtEur(v);
};
export const fmtPct = v => (v ?? 0).toLocaleString("fr-FR", { maximumFractionDigits: 1 }) + " %";
export const esc = s => String(s ?? "").replace(/[&<>"']/g, c => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]));
export const round2 = v => Math.round((v + Number.EPSILON) * 100) / 100;

// ---------- Dates (chaînes AAAA-MM-JJ, calculs en UTC) ----------
export const TODAY = new Date().toISOString().slice(0, 10);
export const toD = s => new Date(s + "T00:00:00Z");
export const toS = d => d.toISOString().slice(0, 10);
export const addDays = (s, n) => { const d = toD(s); d.setUTCDate(d.getUTCDate() + n); return toS(d); };
export const diffDays = (a, b) => Math.round((toD(b) - toD(a)) / 86400000);
export const fmtDate = s => s ? toD(s).toLocaleDateString("fr-FR", { day: "2-digit", month: "short", year: "numeric", timeZone: "UTC" }) : "—";
export const fmtDateShort = s => toD(s).toLocaleDateString("fr-FR", { day: "2-digit", month: "short", timeZone: "UTC" });
export const fmtMonth = ym => toD(ym + "-01").toLocaleDateString("fr-FR", { month: "short", timeZone: "UTC" }).replace(".", "");

function easter(y) { // algorithme de Meeus/Jones/Butcher
  const a = y % 19, b = Math.floor(y / 100), c = y % 100, d = Math.floor(b / 4), e = b % 4,
    f = Math.floor((b + 8) / 25), g = Math.floor((b - f + 1) / 3), h = (19 * a + b - d - g + 15) % 30,
    i = Math.floor(c / 4), k = c % 4, l = (32 + 2 * e + 2 * i - h - k) % 7, m = Math.floor((a + 11 * h + 22 * l) / 451),
    month = Math.floor((h + l - 7 * m + 114) / 31), day = ((h + l - 7 * m + 114) % 31) + 1;
  return `${y}-${String(month).padStart(2, "0")}-${String(day).padStart(2, "0")}`;
}
const ferieCache = {};
export function joursFeries(y) {
  if (ferieCache[y]) return ferieCache[y];
  const p = easter(y);
  const list = {
    [`${y}-01-01`]: "Jour de l'an", [addDays(p, 1)]: "Lundi de Pâques", [`${y}-05-01`]: "Fête du travail",
    [`${y}-05-08`]: "Victoire 1945", [addDays(p, 39)]: "Ascension", [addDays(p, 50)]: "Lundi de Pentecôte",
    [`${y}-07-14`]: "Fête nationale", [`${y}-08-15`]: "Assomption", [`${y}-11-01`]: "Toussaint",
    [`${y}-11-11`]: "Armistice", [`${y}-12-25`]: "Noël",
  };
  return (ferieCache[y] = list);
}
export const isFerie = s => joursFeries(+s.slice(0, 4))[s];
export const isWeekend = s => { const w = toD(s).getUTCDay(); return w === 0 || w === 6; };
export const isWorkday = s => !isWeekend(s) && !isFerie(s);
export const nextWorkday = s => { while (!isWorkday(s)) s = addDays(s, 1); return s; };
// Renvoie la date du n-ième jour ouvré en comptant `s` comme le jour 1.
export function endAfterWorkdays(s, n) {
  s = nextWorkday(s);
  let left = n - 1;
  while (left > 0) { s = addDays(s, 1); if (isWorkday(s)) left--; }
  return s;
}
export function workdaysBetween(a, b) {
  let n = 0;
  for (let s = a; s <= b; s = addDays(s, 1)) if (isWorkday(s)) n++;
  return n;
}

// ---------- TVA ----------
export const TAUX_TVA = [20, 10, 5.5, 0];
export const LOCAUX = {
  logement: "Logement achevé depuis plus de 2 ans",
  logement_neuf: "Logement de moins de 2 ans / construction",
  tertiaire: "Locaux professionnels / tertiaire",
};
export const REGIMES = {
  direct: "Client final (maître d'ouvrage)",
  autoliquidation: "Sous-traitance BTP — autoliquidation",
};
// Taux suggéré pour une ligne, selon le type de local et le régime du devis.
export function tauxSuggere(devis, ligne) {
  if (devis.regime === "autoliquidation") return 0;
  if (devis.local !== "logement") return 20;
  return ligne.energie ? 5.5 : 10;
}
export const tauxLigne = (devis, l) => (l.tva ?? tauxSuggere(devis, l));

export function calculDevis(devis) {
  const parLot = {};
  let brut = 0;
  for (const l of devis.lignes) {
    const t = round2((+l.qte || 0) * (+l.pu || 0));
    brut += t;
    parLot[l.lot] = (parLot[l.lot] || 0) + t;
  }
  const remisePct = +devis.remise || 0;
  const k = 1 - remisePct / 100;
  const tvaParTaux = {};
  for (const l of devis.lignes) {
    const taux = tauxLigne(devis, l);
    const base = round2((+l.qte || 0) * (+l.pu || 0) * k);
    const e = tvaParTaux[taux] || (tvaParTaux[taux] = { base: 0, tva: 0 });
    e.base += base;
  }
  let tva = 0;
  for (const [taux, e] of Object.entries(tvaParTaux)) { e.base = round2(e.base); e.tva = round2(e.base * taux / 100); tva += e.tva; }
  const ht = round2(brut * k);
  const ttc = round2(ht + tva);
  const retenue = devis.retenue ? round2(ttc * 0.05) : 0;
  return { brut: round2(brut), remise: round2(brut - ht), ht, tva: round2(tva), ttc, tvaParTaux, parLot, retenue, net: round2(ttc - retenue) };
}

// ---------- Planning automatique ----------
// lotsMontants : { CODE_LOT: montant HT }. Renvoie les tâches planifiées + chemin critique.
export function genererPlanning({ lotsMontants, debut, equipes = 1, aleas = 10, dureesForcees = {} }) {
  const presents = LOTS.filter(l => (lotsMontants[l.code] || 0) > 0 || dureesForcees[l.code]);
  const codes = new Set(presents.map(l => l.code));
  // Prédécesseurs effectifs : si un lot prédécesseur est absent, on remonte à ses propres prédécesseurs.
  const predEff = code => {
    const out = new Set();
    const walk = c => LOTS.find(x => x.code === c).pred.forEach(p => codes.has(p) ? out.add(p) : walk(p));
    walk(code);
    return [...out];
  };
  const tasks = presents.map(l => {
    const m = lotsMontants[l.code] || 0;
    const d = dureesForcees[l.code] || Math.max(1, Math.ceil(m / (l.prod * Math.max(1, equipes)) * (1 + aleas / 100)));
    return { code: l.code, nom: l.nom, montant: m, duree: d, pred: predEff(l.code) };
  });
  const byCode = Object.fromEntries(tasks.map(t => [t.code, t]));
  // Retire les prédécesseurs redondants (déjà ancêtres d'un autre prédécesseur).
  const anc = {};
  for (const t of tasks) anc[t.code] = new Set(t.pred.flatMap(p => [p, ...anc[p]]));
  for (const t of tasks) t.pred = t.pred.filter(p => !t.pred.some(q => q !== p && anc[q].has(p)));
  // Passe avant (en jours ouvrés, index 0 = premier jour ouvré)
  for (const t of tasks) {
    t.es = t.pred.length ? Math.max(...t.pred.map(p => byCode[p].ef)) : 0;
    t.ef = t.es + t.duree;
  }
  const fin = Math.max(0, ...tasks.map(t => t.ef));
  // Passe arrière
  for (const t of [...tasks].reverse()) {
    const succ = tasks.filter(s => s.pred.includes(t.code));
    t.lf = succ.length ? Math.min(...succ.map(s => s.ls)) : fin;
    t.ls = t.lf - t.duree;
    t.marge = t.ls - t.es;
    t.critique = t.marge === 0;
  }
  // Conversion en dates calendaires
  const start = nextWorkday(debut);
  const jour = [start];
  for (let i = 1; i <= fin + 1; i++) { let s = addDays(jour[i - 1], 1); s = nextWorkday(s); jour.push(s); }
  for (const t of tasks) { t.debut = jour[t.es]; t.fin = jour[t.ef - 1]; }
  return { tasks, debut: start, fin: tasks.length ? jour[fin - 1] : start, joursOuvres: fin };
}

export const STATUT_DEVIS = {
  brouillon: { label: "Brouillon", cls: "b-neutral" },
  envoye: { label: "Envoyé", cls: "b-info" },
  negociation: { label: "En négociation", cls: "b-warn" },
  accepte: { label: "Accepté", cls: "b-ok" },
  refuse: { label: "Refusé", cls: "b-crit" },
};
export const STATUT_CHANTIER = {
  preparation: { label: "Préparation", cls: "b-info" },
  en_cours: { label: "En cours", cls: "b-brand" },
  reception: { label: "Réception / réserves", cls: "b-warn" },
  livre: { label: "Livré", cls: "b-ok" },
};
export const badge = (map, k) => `<span class="badge ${map[k]?.cls || "b-neutral"}">${esc(map[k]?.label || k)}</span>`;
export const lotNom = code => LOTS.find(l => l.code === code)?.nom || code;
