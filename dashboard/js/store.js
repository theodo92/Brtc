// Stockage local (navigateur). Remplaçable plus tard par une vraie base de données / API.

const KEY = "brtc-dashboard-v1";
const clone = o => JSON.parse(JSON.stringify(o));

function seed() {
  const s = { clients: clone(CLIENTS), devis: clone(DEVIS), chantiers: clone(CHANTIERS), caSigne: clone(CA_SIGNE), plannings: {} };
  for (const k of s.chantiers) {
    if (!k.montantHT && k.devisId) k.montantHT = calculDevis(s.devis.find(d => d.id === k.devisId)).ht;
  }
  return s;
}

function load() {
  try {
    const raw = localStorage.getItem(KEY);
    if (raw) return JSON.parse(raw);
  } catch { /* stockage indisponible : on repart des données de démonstration */ }
  return seed();
}

const db = load();

function save() {
  try { localStorage.setItem(KEY, JSON.stringify(db)); } catch { /* ignoré */ }
}
function reset() {
  try { localStorage.removeItem(KEY); } catch { /* ignoré */ }
  try { history.replaceState(null, "", "#/"); } catch { /* ignoré */ }
  location.reload();
}

const uid = p => p + Math.random().toString(36).slice(2, 8);
const client = id => db.clients.find(c => c.id === id);
function prochainNumeroDevis() {
  const y = new Date().getFullYear();
  const max = db.devis.map(d => d.numero).filter(n => n.startsWith(`D-${y}-`)).map(n => +n.split("-")[2]).reduce((a, b) => Math.max(a, b), 0);
  return `D-${y}-${String(max + 1).padStart(3, "0")}`;
}
function prochainRefChantier() {
  const y = new Date().getFullYear();
  const max = db.chantiers.map(c => c.ref).filter(n => n.startsWith(`CH-${y}-`)).map(n => +n.split("-")[2]).reduce((a, b) => Math.max(a, b), 0);
  return `CH-${y}-${String(max + 1).padStart(3, "0")}`;
}
