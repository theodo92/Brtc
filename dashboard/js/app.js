
const $ = (s, r = document) => r.querySelector(s);
const $$ = (s, r = document) => [...r.querySelectorAll(s)];
const main = $("#main");

// ---------- Icônes ----------
const I = {
  dash: '<path d="M3 13h8V3H3zM13 21h8V11h-8zM3 21h8v-6H3zM13 3v6h8V3z"/>',
  users: '<path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M22 21v-2a4 4 0 0 0-3-3.87M16 3.13a4 4 0 0 1 0 7.75"/>',
  file: '<path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><path d="M14 2v6h6M8 13h8M8 17h5"/>',
  plus: '<path d="M12 5v14M5 12h14"/>',
  site: '<path d="M2 20h20M5 20V9l7-5 7 5v11"/><path d="M9 20v-6h6v6"/>',
  cal: '<rect x="3" y="4" width="18" height="18" rx="2"/><path d="M16 2v4M8 2v4M3 10h18"/>',
  calc: '<rect x="4" y="2" width="16" height="20" rx="2"/><path d="M8 6h8M8 10h.01M12 10h.01M16 10h.01M8 14h.01M12 14h.01M16 14h.01M8 18h.01M12 18h4"/>',
  palette: '<circle cx="13.5" cy="6.5" r="1.5"/><circle cx="17.5" cy="10.5" r="1.5"/><circle cx="8.5" cy="7.5" r="1.5"/><circle cx="6.5" cy="12.5" r="1.5"/><path d="M12 2a10 10 0 0 0 0 20c1.1 0 2-.9 2-2 0-.5-.2-1-.5-1.3-.3-.4-.5-.8-.5-1.3 0-1.1.9-2 2-2h2.4A5.6 5.6 0 0 0 22 9.8C22 5.5 17.5 2 12 2z"/>',
  bell: '<path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9M13.7 21a2 2 0 0 1-3.4 0"/>',
  alert: '<path d="M10.3 3.9 1.8 18a2 2 0 0 0 1.7 3h17a2 2 0 0 0 1.7-3L13.7 3.9a2 2 0 0 0-3.4 0zM12 9v4M12 17h.01"/>',
  clock: '<circle cx="12" cy="12" r="10"/><path d="M12 6v6l4 2"/>',
  euro: '<path d="M4 10h12M4 14h9M19 6a7.7 7.7 0 0 0-5.2-2A7.9 7.9 0 0 0 6 12c0 4.4 3.5 8 7.8 8 2 0 3.8-.8 5.2-2"/>',
  send: '<path d="m22 2-7 20-4-9-9-4zM22 2 11 13"/>',
  print: '<path d="M6 9V2h12v7M6 18H4a2 2 0 0 1-2-2v-5a2 2 0 0 1 2-2h16a2 2 0 0 1 2 2v5a2 2 0 0 1-2 2h-2"/><rect x="6" y="14" width="12" height="8"/>',
  check: '<path d="M20 6 9 17l-5-5"/>',
  x: '<path d="M18 6 6 18M6 6l12 12"/>',
  play: '<path d="m5 3 14 9-14 9z"/>',
};
const icon = (n, extra = "") => `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" ${extra}>${I[n]}</svg>`;

// ---------- Utilitaires d'interface ----------
function toast(msg) {
  const t = document.createElement("div");
  t.className = "toast"; t.textContent = msg;
  document.body.appendChild(t);
  setTimeout(() => t.remove(), 3200);
}
const tip = $("#tooltip");
document.addEventListener("mousemove", e => {
  const el = e.target.closest?.("[data-tip]");
  if (!el) { tip.style.display = "none"; return; }
  tip.innerHTML = el.dataset.tip;
  tip.style.display = "block";
  const x = Math.min(e.clientX + 14, innerWidth - tip.offsetWidth - 8);
  tip.style.left = x + "px"; tip.style.top = (e.clientY + 14) + "px";
});

function modal(title, body, onOk, okLabel = "Enregistrer") {
  const bg = document.createElement("div");
  bg.className = "modal-bg";
  bg.innerHTML = `<div class="modal"><div class="card-h"><h2>${esc(title)}</h2><button class="btn ghost sm" data-close>${icon("x")}</button></div>
    <form class="card-b">${body}<div class="actions" style="justify-content:flex-end;margin-top:16px">
    <button type="button" class="btn" data-close>Annuler</button><button class="btn primary">${okLabel}</button></div></form></div>`;
  document.body.appendChild(bg);
  const close = () => bg.remove();
  $$("[data-close]", bg).forEach(b => b.onclick = close);
  bg.onclick = e => { if (e.target === bg) close(); };
  $("form", bg).onsubmit = e => { e.preventDefault(); if (onOk(new FormData(e.target)) !== false) close(); };
  $("input,select", bg)?.focus();
}

// ---------- Indicateurs métier ----------
const totalDevis = d => calculDevis(d).ht;
const devisOuverts = () => db.devis.filter(d => d.statut === "envoye" || d.statut === "negociation");
const chantiersActifs = () => db.chantiers.filter(c => c.statut !== "livre");
const tempsEcoule = c => {
  const tot = diffDays(c.debut, c.fin);
  return Math.max(0, Math.min(100, tot > 0 ? diffDays(c.debut, TODAY) / tot * 100 : 0));
};
const aFacturer = c => Math.max(0, round2(c.montantHT * c.avancement / 100 - c.factureHT));

// Automatisations : règles qui scannent devis et chantiers et produisent des actions à faire.
function alertes() {
  const out = [];
  for (const d of devisOuverts()) {
    const age = diffDays(d.date, TODAY);
    const echeance = addDays(d.date, d.validite);
    const reste = diffDays(TODAY, echeance);
    const c = client(d.clientId);
    if (reste < 0) out.push({ niv: "crit", ic: "clock", t1: `Devis ${d.numero} expiré`, t2: `${c?.nom} · expiré le ${fmtDate(echeance)} — prolonger ou classer`, href: `#/devis/${d.id}` });
    else if (reste <= 10) out.push({ niv: "warn", ic: "clock", t1: `Devis ${d.numero} expire dans ${reste} j`, t2: `${c?.nom} · ${fmtK(totalDevis(d))} HT — dernière relance avant échéance`, href: `#/devis/${d.id}` });
    else if (age >= 15) out.push({ niv: "warn", ic: "send", t1: `Relancer ${c?.nom}`, t2: `Devis ${d.numero} envoyé il y a ${age} jours sans réponse · ${fmtK(totalDevis(d))} HT`, href: `#/devis/${d.id}` });
  }
  for (const k of db.chantiers) {
    if (k.statut === "en_cours") {
      const te = tempsEcoule(k);
      if (k.fin < TODAY) out.push({ niv: "crit", ic: "alert", t1: `${k.nom} : date de fin dépassée`, t2: `Fin prévue le ${fmtDate(k.fin)} · avancement ${k.avancement} % — prévenir le client, recaler le planning`, href: `#/planning/${k.id}` });
      else if (k.avancement < te - 10) out.push({ niv: "crit", ic: "alert", t1: `${k.nom} : retard probable`, t2: `Avancement ${k.avancement} % pour ${Math.round(te)} % du délai écoulé`, href: `#/planning/${k.id}` });
      const af = aFacturer(k);
      if (af >= 10000) out.push({ niv: "info", ic: "euro", t1: `Situation à émettre : ${k.nom}`, t2: `${fmtEur(af)} HT de travaux réalisés non facturés`, href: `#/chantiers` });
    }
    if (k.statut === "preparation") {
      const j = diffDays(TODAY, k.debut);
      if (j >= 0 && j <= 14) out.push({ niv: "info", ic: "cal", t1: `${k.nom} démarre dans ${j} j`, t2: "Ordre de service, DICT, commandes atelier & approvisionnements à lancer", href: `#/planning/${k.id}` });
    }
    if (k.statut === "reception") out.push({ niv: "warn", ic: "check", t1: `${k.nom} : levée des réserves`, t2: `Réception en cours — solde à facturer : ${fmtEur(k.montantHT - k.factureHT)} HT`, href: `#/chantiers` });
  }
  const ordre = { crit: 0, warn: 1, info: 2 };
  return out.sort((a, b) => ordre[a.niv] - ordre[b.niv]);
}
const ALERT_STYLE = { crit: "b-crit", warn: "b-warn", info: "b-info" };
const ALERT_LABEL = { crit: "Urgent", warn: "À faire", info: "À planifier" };
const renderAlerte = a => `<div class="alert"><div class="ico ${ALERT_STYLE[a.niv]}">${icon(a.ic)}</div>
  <div class="txt"><div class="t1">${esc(a.t1)}</div><div class="t2">${esc(a.t2)}</div></div>
  <span class="badge ${ALERT_STYLE[a.niv]}">${ALERT_LABEL[a.niv]}</span>
  <a class="btn sm" href="${a.href}">Ouvrir</a></div>`;

// ---------- Graphiques (SVG) ----------
function barChart(data, { h = 220, cur } = {}) {
  const W = 640, padL = 44, padB = 24, padT = 12;
  const max = Math.max(...data.map(d => d.v)) * 1.1 || 1;
  const step = Math.pow(10, Math.floor(Math.log10(max))) / 2;
  const tick = Math.ceil(max / 4 / step) * step;
  const iw = (W - padL) / data.length, bw = Math.min(32, iw - 6);
  const y = v => padT + (h - padT - padB) * (1 - v / (tick * 4));
  let s = `<svg class="chart" viewBox="0 0 ${W} ${h}" role="img" aria-label="CA signé par mois">`;
  for (let i = 0; i <= 4; i++) {
    const v = tick * i;
    s += `<line class="gridline" x1="${padL}" x2="${W}" y1="${y(v)}" y2="${y(v)}"/><text x="${padL - 6}" y="${y(v) + 4}" text-anchor="end">${fmtK(v).replace(" k€", "k").replace(" M€", "M")}</text>`;
  }
  data.forEach((d, i) => {
    const x = padL + i * iw + (iw - bw) / 2, top = y(d.v), bh = Math.max(0, y(0) - top);
    const r = Math.min(4, bh);
    const path = bh > 0 ? `M${x},${y(0)} V${top + r} Q${x},${top} ${x + r},${top} H${x + bw - r} Q${x + bw},${top} ${x + bw},${top + r} V${y(0)} Z` : "";
    s += `<g class="col" data-tip="${esc(d.tip)}"><rect class="hit" x="${padL + i * iw}" y="${padT}" width="${iw}" height="${h - padT - padB}"/>
      <path class="bar${d.k === cur ? " prev" : ""}" d="${path}"/>
      <text x="${padL + i * iw + iw / 2}" y="${h - 6}" text-anchor="middle">${esc(d.label)}</text></g>`;
  });
  return s + "</svg>";
}

// ---------- Vues ----------
const views = {};

views.dashboard = () => {
  const ouverts = devisOuverts();
  const montantOuverts = ouverts.reduce((a, d) => a + totalDevis(d), 0);
  const decides = db.devis.filter(d => d.statut === "accepte" || d.statut === "refuse");
  const tx = decides.length ? db.devis.filter(d => d.statut === "accepte").length / decides.length * 100 : 0;
  const an = TODAY.slice(0, 4);
  const caAn = db.caSigne.filter(m => m.mois.startsWith(an)).reduce((a, m) => a + m.ht, 0);
  const actifs = chantiersActifs();
  const carnet = actifs.reduce((a, c) => a + c.montantHT * (1 - c.avancement / 100), 0);
  const resteFact = actifs.reduce((a, c) => a + aFacturer(c), 0);
  const al = alertes();

  const caData = db.caSigne.map(m => ({ k: m.mois, v: m.ht, label: fmtMonth(m.mois), tip: `<b>${fmtMonth(m.mois)} ${m.mois.slice(0, 4)}</b><br>${fmtEur(m.ht)} HT signés${m.mois === TODAY.slice(0, 7) ? "<br>(mois en cours)" : ""}` }));

  const pipe = ["brouillon", "envoye", "negociation", "accepte", "refuse"].map(st => {
    const list = db.devis.filter(d => d.statut === st);
    return { st, n: list.length, v: list.reduce((a, d) => a + totalDevis(d), 0) };
  });
  const pmax = Math.max(...pipe.map(p => p.v)) || 1;
  const pipeColor = { brouillon: "var(--neutral)", envoye: "var(--info)", negociation: "var(--warn)", accepte: "var(--ok)", refuse: "var(--crit)" };

  const parType = TYPES_CLIENT.map(t => ({ t, v: db.chantiers.filter(k => client(k.clientId)?.type === t).reduce((a, k) => a + k.montantHT, 0) })).filter(x => x.v > 0).sort((a, b) => b.v - a.v);
  const tmax = Math.max(...parType.map(x => x.v)) || 1;

  return `
  <div class="topbar"><div><h1>Tableau de bord</h1><div class="sub">Bonjour — voici l'état de l'activité au ${fmtDate(TODAY)}.</div></div>
    <div class="actions"><a class="btn" href="#/planning">${icon("cal")} Générer un planning</a><a class="btn primary" href="#/devis/nouveau">${icon("plus")} Nouveau devis</a></div></div>

  <div class="grid g-4">
    <div class="card kpi accent"><div class="label">${icon("euro", 'width="14" height="14"')} CA signé ${an}</div><div class="value">${fmtK(caAn)}</div><div class="delta">HT, devis acceptés depuis janvier</div></div>
    <div class="card kpi"><div class="label">${icon("file", 'width="14" height="14"')} Devis en cours</div><div class="value">${fmtK(montantOuverts)}</div><div class="delta">${ouverts.length} devis envoyés / en négociation</div></div>
    <div class="card kpi"><div class="label">${icon("check", 'width="14" height="14"')} Taux de transformation</div><div class="value">${fmtPct(tx)}</div><div class="delta">${decides.length} devis décidés</div></div>
    <div class="card kpi"><div class="label">${icon("site", 'width="14" height="14"')} Carnet de commandes</div><div class="value">${fmtK(carnet)}</div><div class="delta">${actifs.length} chantiers actifs · ${fmtK(resteFact)} à facturer</div></div>
  </div>

  <div class="grid g-21 mt">
    <div class="card"><div class="card-h"><h2>CA signé par mois</h2><span class="hint">12 derniers mois · € HT</span></div>
      <div class="card-b">${barChart(caData, { cur: TODAY.slice(0, 7) })}</div></div>
    <div class="card"><div class="card-h"><h2>Pipeline des devis</h2><a class="hint" href="#/devis">Tout voir →</a></div>
      <div class="card-b"><div class="pipe">${pipe.map(p => `
        <div class="pipe-row" data-tip="<b>${STATUT_DEVIS[p.st].label}</b><br>${p.n} devis · ${fmtEur(p.v)} HT">
          <span class="small">${badge(STATUT_DEVIS, p.st)}</span>
          <div class="bar-wrap"><div class="bar-in" style="width:${Math.max(2, p.v / pmax * 100)}%;background:${pipeColor[p.st]}"></div></div>
          <span class="num small"><b>${fmtK(p.v)}</b> · ${p.n}</span></div>`).join("")}
      </div></div></div>
  </div>

  <div class="grid g-21 mt">
    <div class="card"><div class="card-h"><h2>${icon("bell", 'width="16" height="16" style="vertical-align:-3px"')} Actions automatiques du jour</h2><span class="hint">${al.length} actions détectées</span></div>
      <div class="card-b">${al.length ? al.slice(0, 8).map(renderAlerte).join("") : '<div class="empty">Rien à signaler 👍</div>'}</div></div>
    <div class="card"><div class="card-h"><h2>Volume de chantiers par type de client</h2></div>
      <div class="card-b"><div class="pipe">${parType.map(x => `
        <div class="pipe-row" style="grid-template-columns:1fr" data-tip="<b>${esc(x.t)}</b><br>${fmtEur(x.v)} HT">
          <div class="small" style="display:flex;justify-content:space-between"><span>${esc(x.t)}</span><b>${fmtK(x.v)}</b></div>
          <div class="bar-wrap" style="height:10px"><div class="bar-in" style="width:${x.v / tmax * 100}%;background:var(--series-2)"></div></div></div>`).join("")}
      </div></div></div>
  </div>

  <div class="card mt"><div class="card-h"><h2>Chantiers en cours</h2><span class="legend"><span><i style="background:var(--brtc-orange)"></i>Avancement</span><span><i style="background:var(--text);width:3px"></i>Temps écoulé</span></span></div>
    <div class="card-b table-wrap">${tableChantiers(actifs, { compact: true })}</div></div>`;
};

function tableChantiers(list, { compact } = {}) {
  return `<table class="t"><thead><tr><th>Chantier</th><th>Client</th>${compact ? "" : "<th>Conducteur</th>"}<th>Période</th><th style="width:200px">Avancement</th><th class="num">Montant HT</th><th class="num">Reste à facturer</th><th>Statut</th>${compact ? "" : "<th></th>"}</tr></thead><tbody>
  ${list.map(k => {
    const te = tempsEcoule(k), af = aFacturer(k);
    const retard = k.statut === "en_cours" && k.avancement < te - 10;
    return `<tr class="link" data-href="#/planning/${k.id}">
      <td><div class="strong">${esc(k.nom)}</div><div class="small muted">${esc(k.ref)} · ${esc(k.adresse)}</div></td>
      <td>${esc(client(k.clientId)?.nom)}</td>
      ${compact ? "" : `<td class="muted">${esc(k.conducteur)}</td>`}
      <td class="small">${fmtDateShort(k.debut)} → ${fmtDate(k.fin)}</td>
      <td><div style="display:flex;align-items:center;gap:8px"><div class="progress" style="flex:1" data-tip="Avancement <b>${k.avancement} %</b><br>Temps écoulé ${Math.round(te)} %"><span style="width:${k.avancement}%"></span><i style="left:${te}%"></i></div>
        ${compact ? `<span class="small num" style="width:36px">${k.avancement} %</span>` : `<input type="number" min="0" max="100" step="5" value="${k.avancement}" data-av="${k.id}" style="width:64px" title="Mettre à jour l'avancement">`}</div>
        ${retard ? '<span class="badge b-crit" style="margin-top:4px">Retard</span>' : ""}</td>
      <td class="num">${fmtEur(k.montantHT)}</td>
      <td class="num ${af > 0 ? "strong" : "muted"}">${fmtEur(af)}</td>
      <td>${badge(STATUT_CHANTIER, k.statut)}</td>
      ${compact ? "" : `<td>${af > 0 ? `<button class="btn sm" data-sit="${k.id}">Émettre situation</button>` : ""}</td>`}
    </tr>`;
  }).join("")}</tbody></table>`;
}

// ---- Clients ----
views.clients = () => {
  const rows = db.clients.map(c => {
    const dv = db.devis.filter(d => d.clientId === c.id);
    const ouverts = dv.filter(d => d.statut === "envoye" || d.statut === "negociation");
    const ks = db.chantiers.filter(k => k.clientId === c.id);
    const last = dv.map(d => d.date).sort().pop();
    return { c, ouverts, ks, actifs: ks.filter(k => k.statut !== "livre"), ca: ks.reduce((a, k) => a + k.montantHT, 0), last };
  }).sort((a, b) => b.ca - a.ca);
  return `<div class="topbar"><div><h1>Clients</h1><div class="sub">${db.clients.length} clients · foncières, bailleurs, investisseurs, collectivités, architectes</div></div>
    <div class="actions"><button class="btn primary" id="addClient">${icon("plus")} Ajouter un client</button></div></div>
  <div class="toolbar"><input type="search" id="q" placeholder="Rechercher un client, un contact…"><select id="ft"><option value="">Tous les types</option>${TYPES_CLIENT.map(t => `<option>${t}</option>`).join("")}</select></div>
  <div class="card table-wrap"><table class="t" id="tbl"><thead><tr><th>Client</th><th>Type</th><th>Contact</th><th class="num">Devis en cours</th><th class="num">Chantiers actifs</th><th class="num">Volume chantiers HT</th><th>Dernier devis</th></tr></thead><tbody>
  ${rows.map(r => `<tr class="link" data-href="#/clients/${r.c.id}" data-type="${esc(r.c.type)}" data-s="${esc((r.c.nom + " " + r.c.contact + " " + r.c.ville).toLowerCase())}">
    <td><div class="strong">${esc(r.c.nom)}</div><div class="small muted">${esc(r.c.ville)} · client depuis ${r.c.depuis}</div></td>
    <td><span class="tag">${esc(r.c.type)}</span></td>
    <td><div>${esc(r.c.contact)}</div><div class="small muted">${esc(r.c.tel)}</div></td>
    <td class="num">${r.ouverts.length ? `<b>${r.ouverts.length}</b> · ${fmtK(r.ouverts.reduce((a, d) => a + totalDevis(d), 0))}` : '<span class="muted">—</span>'}</td>
    <td class="num">${r.actifs.length || '<span class="muted">—</span>'}</td>
    <td class="num strong">${fmtEur(r.ca)}</td>
    <td class="small muted">${r.last ? fmtDate(r.last) : "—"}</td></tr>`).join("")}
  </tbody></table></div>`;
};
views.clients.bind = () => {
  const filt = () => {
    const q = $("#q").value.toLowerCase(), t = $("#ft").value;
    $$("#tbl tbody tr").forEach(tr => tr.hidden = !(tr.dataset.s.includes(q) && (!t || tr.dataset.type === t)));
  };
  $("#q").oninput = filt; $("#ft").onchange = filt;
  $("#addClient").onclick = () => formClient();
};

function formClient(c = {}) {
  modal(c.id ? "Modifier le client" : "Nouveau client", `<div class="form-grid" style="grid-template-columns:1fr 1fr">
    <div class="field span-4"><label>Raison sociale</label><input name="nom" required value="${esc(c.nom)}"></div>
    <div class="field"><label>Type</label><select name="type">${TYPES_CLIENT.map(t => `<option ${t === c.type ? "selected" : ""}>${t}</option>`).join("")}</select></div>
    <div class="field"><label>Ville</label><input name="ville" value="${esc(c.ville)}"></div>
    <div class="field"><label>Contact</label><input name="contact" value="${esc(c.contact)}"></div>
    <div class="field"><label>Téléphone</label><input name="tel" value="${esc(c.tel)}"></div>
    <div class="field span-4"><label>E-mail</label><input name="email" type="email" value="${esc(c.email)}"></div></div>`, fd => {
    const o = Object.fromEntries(fd);
    if (c.id) Object.assign(c, o);
    else db.clients.push({ id: uid("c"), depuis: new Date().getFullYear(), ...o });
    save(); route(); toast("Client enregistré");
  });
}

views.client = id => {
  const c = client(id);
  if (!c) return `<div class="empty">Client introuvable</div>`;
  const dv = db.devis.filter(d => d.clientId === id).sort((a, b) => b.date.localeCompare(a.date));
  const ks = db.chantiers.filter(k => k.clientId === id);
  const signe = dv.filter(d => d.statut === "accepte").reduce((a, d) => a + totalDevis(d), 0);
  const ouverts = dv.filter(d => d.statut === "envoye" || d.statut === "negociation");
  return `<div class="topbar"><div><div class="small muted"><a href="#/clients">Clients</a> /</div><h1>${esc(c.nom)}</h1><div class="sub"><span class="tag">${esc(c.type)}</span> · ${esc(c.ville)} · client depuis ${c.depuis}</div></div>
    <div class="actions"><button class="btn" id="editC">Modifier</button><a class="btn primary" href="#/devis/nouveau?client=${c.id}">${icon("plus")} Nouveau devis</a></div></div>
  <div class="grid g-4">
    <div class="card kpi accent"><div class="label">Volume chantiers</div><div class="value">${fmtK(ks.reduce((a, k) => a + k.montantHT, 0))}</div><div class="delta">${ks.length} chantiers</div></div>
    <div class="card kpi"><div class="label">Devis en cours</div><div class="value">${fmtK(ouverts.reduce((a, d) => a + totalDevis(d), 0))}</div><div class="delta">${ouverts.length} devis</div></div>
    <div class="card kpi"><div class="label">Devis signés (période)</div><div class="value">${fmtK(signe)}</div><div class="delta">${dv.filter(d => d.statut === "accepte").length} acceptés</div></div>
    <div class="card kpi"><div class="label">Contact</div><div class="value" style="font-size:16px">${esc(c.contact)}</div><div class="delta">${esc(c.tel)} · <a href="mailto:${esc(c.email)}">${esc(c.email)}</a></div></div>
  </div>
  <div class="card mt"><div class="card-h"><h2>Devis</h2></div><div class="card-b table-wrap">${dv.length ? tableDevis(dv) : '<div class="empty">Aucun devis</div>'}</div></div>
  <div class="card mt"><div class="card-h"><h2>Chantiers</h2></div><div class="card-b table-wrap">${ks.length ? tableChantiers(ks, { compact: true }) : '<div class="empty">Aucun chantier</div>'}</div></div>`;
};
views.client.bind = id => { $("#editC") && ($("#editC").onclick = () => formClient(client(id))); };

// ---- Devis ----
function tableDevis(list) {
  return `<table class="t"><thead><tr><th>N°</th><th>Client / objet</th><th>Date</th><th>Échéance</th><th class="num">Montant HT</th><th class="num">TTC</th><th>Statut</th></tr></thead><tbody>
  ${list.map(d => {
    const t = calculDevis(d), ech = addDays(d.date, d.validite), reste = diffDays(TODAY, ech);
    const ouvert = d.statut === "envoye" || d.statut === "negociation";
    const flag = ouvert ? (reste < 0 ? '<span class="badge b-crit">Expiré</span>' : reste <= 10 ? `<span class="badge b-warn">J-${reste}</span>` : diffDays(d.date, TODAY) >= 15 ? '<span class="badge b-warn">À relancer</span>' : "") : "";
    return `<tr class="link" data-href="#/devis/${d.id}" data-st="${d.statut}" data-s="${esc((d.numero + " " + d.objet + " " + client(d.clientId)?.nom + " " + d.adresse).toLowerCase())}">
      <td class="strong">${esc(d.numero)}</td>
      <td><div class="strong">${esc(client(d.clientId)?.nom)}</div><div class="small muted">${esc(d.objet)}</div></td>
      <td class="small">${fmtDate(d.date)}</td>
      <td class="small">${fmtDate(ech)} ${flag}</td>
      <td class="num strong">${fmtEur(t.ht)}</td><td class="num muted">${fmtEur(t.ttc)}</td>
      <td>${badge(STATUT_DEVIS, d.statut)}</td></tr>`;
  }).join("")}</tbody></table>`;
}

views.devis = () => {
  const list = [...db.devis].sort((a, b) => b.date.localeCompare(a.date));
  const cnt = st => db.devis.filter(d => d.statut === st).length;
  return `<div class="topbar"><div><h1>Devis</h1><div class="sub">${devisOuverts().length} devis en cours · ${fmtK(devisOuverts().reduce((a, d) => a + totalDevis(d), 0))} HT en attente de signature</div></div>
    <div class="actions"><a class="btn primary" href="#/devis/nouveau">${icon("plus")} Nouveau devis</a></div></div>
  <div class="toolbar"><div class="seg" id="seg"><button class="on" data-f="">Tous (${db.devis.length})</button><button data-f="ouverts">En cours (${devisOuverts().length})</button>
    ${Object.entries(STATUT_DEVIS).map(([k, v]) => `<button data-f="${k}">${v.label} (${cnt(k)})</button>`).join("")}</div>
    <input type="search" id="q" placeholder="N°, client, adresse…"></div>
  <div class="card table-wrap" id="tbl">${tableDevis(list)}</div>`;
};
views.devis.bind = () => {
  let f = "";
  const apply = () => {
    const q = $("#q").value.toLowerCase();
    $$("#tbl tbody tr").forEach(tr => {
      const st = tr.dataset.st;
      const okF = !f || (f === "ouverts" ? (st === "envoye" || st === "negociation") : st === f);
      tr.hidden = !(okF && tr.dataset.s.includes(q));
    });
  };
  $$("#seg button").forEach(b => b.onclick = () => { $$("#seg button").forEach(x => x.classList.remove("on")); b.classList.add("on"); f = b.dataset.f; apply(); });
  $("#q").oninput = apply;
};

// ---- Générateur de devis ----
let draft = null;
views.devisEdit = (id, params) => {
  if (id === "nouveau") {
    draft = { id: null, numero: prochainNumeroDevis(), clientId: params.get("client") || db.clients[0].id, objet: "", adresse: "", date: TODAY, validite: 60,
      statut: "brouillon", local: "logement", regime: "direct", remise: 0, retenue: true, acompte: 30, lignes: [] };
  } else {
    const d = db.devis.find(x => x.id === id);
    if (!d) return `<div class="empty">Devis introuvable</div>`;
    draft = JSON.parse(JSON.stringify(d));
  }
  const d = draft;
  return `<div class="topbar"><div><div class="small muted"><a href="#/devis">Devis</a> /</div><h1>${d.id ? `Devis ${esc(d.numero)}` : "Nouveau devis"}</h1>
      <div class="sub">Générateur automatique : choisissez les ouvrages, la TVA et les totaux se calculent seuls.</div></div>
    <div class="actions">${d.id ? `<a class="btn" href="#/devis/${d.id}/apercu">${icon("print")} Aperçu PDF</a>` : ""}<button class="btn primary" id="saveD">${icon("check")} Enregistrer</button></div></div>
  <div class="grid g-21">
    <div>
      <div class="card"><div class="card-b form-grid">
        <div class="field span-2"><label>Client</label><select data-h="clientId">${db.clients.map(c => `<option value="${c.id}" ${c.id === d.clientId ? "selected" : ""}>${esc(c.nom)}</option>`).join("")}</select></div>
        <div class="field"><label>N° de devis</label><input data-h="numero" value="${esc(d.numero)}"></div>
        <div class="field"><label>Statut</label><select data-h="statut">${Object.entries(STATUT_DEVIS).map(([k, v]) => `<option value="${k}" ${k === d.statut ? "selected" : ""}>${v.label}</option>`).join("")}</select></div>
        <div class="field span-2"><label>Objet des travaux</label><input data-h="objet" value="${esc(d.objet)}" placeholder="Ex. Rénovation complète appartement 120 m²"></div>
        <div class="field span-2"><label>Adresse du chantier</label><input data-h="adresse" value="${esc(d.adresse)}"></div>
        <div class="field"><label>Date</label><input type="date" data-h="date" value="${d.date}"></div>
        <div class="field"><label>Validité (jours)</label><input type="number" data-h="validite" value="${d.validite}"></div>
        <div class="field span-2"><label>Nature du local (détermine la TVA)</label><select data-h="local" data-rerender>${Object.entries(LOCAUX).map(([k, v]) => `<option value="${k}" ${k === d.local ? "selected" : ""}>${v}</option>`).join("")}</select></div>
        <div class="field span-2"><label>Régime</label><select data-h="regime" data-rerender>${Object.entries(REGIMES).map(([k, v]) => `<option value="${k}" ${k === d.regime ? "selected" : ""}>${v}</option>`).join("")}</select></div>
        <div class="field"><label>Remise globale (%)</label><input type="number" step="0.5" min="0" data-h="remise" value="${d.remise}"></div>
        <div class="field"><label>Acompte à la commande (%)</label><input type="number" step="5" min="0" max="100" data-h="acompte" value="${d.acompte ?? 30}"></div>
        <div class="field span-2"><label>&nbsp;</label><label style="display:flex;gap:8px;align-items:center;color:var(--text)"><input type="checkbox" data-h="retenue" ${d.retenue ? "checked" : ""}> Retenue de garantie 5 % (loi du 16 juillet 1971)</label></div>
      </div></div>

      <div class="card mt"><div class="card-h"><h2>Ajouter des ouvrages</h2><span class="hint">Bibliothèque de prix · ${BIBLIO.length} ouvrages</span></div>
        <div class="card-b"><div class="form-grid" style="grid-template-columns:1fr 2fr 100px auto;align-items:end">
          <div class="field"><label>Lot</label><select id="addLot">${LOTS.map(l => `<option value="${l.code}">${l.nom}</option>`).join("")}</select></div>
          <div class="field"><label>Ouvrage</label><select id="addOuv"></select></div>
          <div class="field"><label>Quantité</label><input type="number" id="addQte" value="1" min="0" step="any"></div>
          <div class="actions"><button class="btn dark" id="addBtn">${icon("plus")} Ajouter</button><button class="btn" id="addLibre">Ligne libre</button></div>
        </div>
        <div class="actions" style="margin-top:12px"><span class="small muted">Modèles rapides :</span>
          <button class="btn sm" data-tpl="appart">Appartement (au m²)</button><button class="btn sm" data-tpl="bureaux">Plateau de bureaux (au m²)</button><button class="btn sm" data-tpl="sdb">Salle d'eau</button><button class="btn sm" data-tpl="energie">Rénovation énergétique</button></div></div></div>

      <div id="lignes" class="mt"></div>
    </div>
    <div><div class="sticky">
      <div class="card"><div class="card-h"><h2>Totaux</h2></div><div class="card-b" id="totaux"></div></div>
      <div class="card mt"><div class="card-b" id="actionsDevis"></div></div>
    </div></div>
  </div>`;
};

const TEMPLATES = {
  appart: m2 => [["INST-01", 1], ["INST-02", 1], ["DEMO-01", m2], ["MAC-01", m2], ["ELEC-01", m2], ["PLB-01", 1], ["PLAT-01", m2 * .5], ["PLAT-02", m2 * .6], ["CAR-01", 8], ["CAR-02", 25], ["MENINT-01", Math.ceil(m2 / 20)], ["MENINT-03", m2 * .8], ["PEINT-02", m2 * 2.8], ["PEINT-01", m2 * 2.8], ["NET-01", m2], ["NET-02", 1]],
  bureaux: m2 => [["INST-01", 1], ["DEMO-02", m2 * .4], ["DEMO-03", m2], ["ELEC-03", Math.ceil(m2 / 3)], ["PLAT-01", m2 * .6], ["PLAT-03", m2], ["MENINT-01", Math.ceil(m2 / 30)], ["PEINT-01", m2 * 2.6], ["NET-01", m2], ["NET-02", 1]],
  sdb: () => [["DEMO-01", 6], ["PLB-01", 1], ["PLAT-01", 10], ["CAR-01", 6], ["CAR-02", 22], ["PEINT-01", 8]],
  energie: m2 => [["INST-01", 1], ["PLAT-04", m2], ["PLAT-02", m2 * .8], ["MENEXT-01", Math.ceil(m2 / 12)], ["PLB-02", 1], ["NET-02", 1]],
};
const ligneDe = (code, qte) => { const b = BIBLIO.find(x => x.code === code); return { lot: b.lot, designation: b.designation, unite: b.unite, qte: round2(qte), pu: b.pu, energie: !!b.energie }; };

views.devisEdit.bind = () => {
  const d = draft;
  const fillOuv = () => { $("#addOuv").innerHTML = BIBLIO.filter(b => b.lot === $("#addLot").value).map(b => `<option value="${b.code}">${esc(b.designation)} — ${fmtEur2(b.pu)}/${b.unite}${b.energie ? " ⚡" : ""}</option>`).join(""); };
  $("#addLot").onchange = fillOuv; fillOuv();
  $("#addBtn").onclick = () => { d.lignes.push(ligneDe($("#addOuv").value, +$("#addQte").value || 1)); renderLignes(); };
  $("#addLibre").onclick = () => { d.lignes.push({ lot: $("#addLot").value, designation: "Ouvrage à décrire", unite: "u", qte: 1, pu: 0 }); renderLignes(); };
  $$("[data-tpl]").forEach(b => b.onclick = () => {
    const k = b.dataset.tpl;
    const ajouter = m2 => { TEMPLATES[k](m2).forEach(([c, q]) => d.lignes.push(ligneDe(c, q))); renderLignes(); toast("Modèle ajouté — ajustez les quantités"); };
    if (k === "sdb") return ajouter(1);
    modal("Surface concernée", `<div class="field"><label for="m2">Surface (m²)</label><input id="m2" name="m2" type="number" min="1" step="any" value="100" required></div>`,
      fd => { ajouter(+fd.get("m2")); }, "Ajouter le modèle");
  });
  $$("[data-h]").forEach(el => el.addEventListener(el.type === "checkbox" ? "change" : "input", () => {
    const f = el.dataset.h;
    d[f] = el.type === "checkbox" ? el.checked : el.type === "number" ? +el.value : el.value;
    if (el.hasAttribute("data-rerender")) renderLignes(); else renderTotaux();
  }));
  $("#saveD").onclick = () => saveDraft(true);
  renderLignes();
};

function saveDraft(notify) {
  const d = draft;
  if (!d.id) { d.id = uid("d"); db.devis.push(d); draft = d; }
  else { const i = db.devis.findIndex(x => x.id === d.id); db.devis[i] = d; }
  draft = JSON.parse(JSON.stringify(d));
  save();
  if (notify) { toast(`Devis ${d.numero} enregistré`); go(`#/devis/${d.id}`); }
}

function renderLignes() {
  const d = draft;
  const lots = LOTS.filter(l => d.lignes.some(x => x.lot === l.code));
  const tvaOpts = (l) => {
    const sug = tauxSuggere(d, l);
    return `<option value="" ${l.tva == null ? "selected" : ""}>Auto ${fmtNum(sug)} %</option>` + TAUX_TVA.map(t => `<option value="${t}" ${l.tva === t ? "selected" : ""}>${fmtNum(t)} %</option>`).join("");
  };
  $("#lignes").innerHTML = !d.lignes.length ? `<div class="card"><div class="empty">Ajoutez des ouvrages depuis la bibliothèque ou un modèle rapide.</div></div>` :
    lots.map(l => {
      const idx = d.lignes.map((x, i) => [x, i]).filter(([x]) => x.lot === l.code);
      const st = idx.reduce((a, [x]) => a + x.qte * x.pu, 0);
      return `<div class="lot-block card"><div class="lot-head"><span><span class="lot-code">${l.code}</span>${esc(l.nom)}</span><span class="num" data-lot="${l.code}">${fmtEur2(st)} HT</span></div>
      <div class="table-wrap"><table class="t lines"><thead><tr><th>Désignation</th><th class="c-qte">Qté</th><th class="c-u">Unité</th><th class="c-pu">PU HT</th><th class="c-tva">TVA</th><th class="c-tot num">Total HT</th><th class="c-x"></th></tr></thead><tbody>
      ${idx.map(([x, i]) => `<tr><td><input data-i="${i}" data-f="designation" value="${esc(x.designation)}">${x.energie ? '<span class="tag" style="margin-top:3px;display:inline-block">⚡ Éligible rénovation énergétique</span>' : ""}</td>
        <td><input type="number" step="any" min="0" data-i="${i}" data-f="qte" value="${x.qte}"></td>
        <td><input data-i="${i}" data-f="unite" value="${esc(x.unite)}"></td>
        <td><input type="number" step="0.01" min="0" data-i="${i}" data-f="pu" value="${x.pu}"></td>
        <td><select data-i="${i}" data-f="tva">${tvaOpts(x)}</select></td>
        <td class="num" data-tot="${i}">${fmtEur2(x.qte * x.pu)}</td>
        <td><button class="btn ghost sm" data-del="${i}" title="Supprimer">${icon("x")}</button></td></tr>`).join("")}
      </tbody></table></div></div>`;
    }).join("");
  $$("#lignes [data-f]").forEach(el => el.addEventListener(el.tagName === "SELECT" ? "change" : "input", () => {
    const l = d.lignes[+el.dataset.i], f = el.dataset.f;
    if (f === "tva") l.tva = el.value === "" ? undefined : +el.value;
    else l[f] = el.type === "number" ? +el.value : el.value;
    const cell = $(`[data-tot="${el.dataset.i}"]`); if (cell) cell.textContent = fmtEur2(l.qte * l.pu);
    const lotCell = $(`[data-lot="${l.lot}"]`); if (lotCell) lotCell.textContent = fmtEur2(d.lignes.filter(x => x.lot === l.lot).reduce((a, x) => a + x.qte * x.pu, 0)) + " HT";
    renderTotaux();
  }));
  $$("#lignes [data-del]").forEach(b => b.onclick = () => { d.lignes.splice(+b.dataset.del, 1); renderLignes(); });
  renderTotaux();
}

function renderTotaux() {
  const d = draft, t = calculDevis(d);
  const acompte = round2(t.ttc * (d.acompte || 0) / 100);
  $("#totaux").innerHTML = `<table class="totals">
    ${Object.entries(t.parLot).map(([k, v]) => `<tr><td class="small muted">${esc(lotNom(k))}</td><td class="num small">${fmtEur2(v)}</td></tr>`).join("")}
    <tr><td colspan="2"><hr style="border:0;border-top:1px solid var(--border)"></td></tr>
    <tr><td>Total HT brut</td><td class="num">${fmtEur2(t.brut)}</td></tr>
    ${t.remise ? `<tr><td>Remise ${fmtNum(d.remise)} %</td><td class="num">− ${fmtEur2(t.remise)}</td></tr>` : ""}
    <tr><td class="strong">Total HT</td><td class="num strong">${fmtEur2(t.ht)}</td></tr>
    ${Object.entries(t.tvaParTaux).sort((a, b) => b[0] - a[0]).map(([tx, e]) => `<tr><td class="muted">TVA ${fmtNum(+tx)} % <span class="small">sur ${fmtEur(e.base)}</span></td><td class="num">${fmtEur2(e.tva)}</td></tr>`).join("")}
    <tr class="grand"><td>Total TTC</td><td class="num">${fmtEur2(t.ttc)}</td></tr>
    ${d.acompte ? `<tr><td class="small muted">Acompte ${d.acompte} % à la commande</td><td class="num small">${fmtEur2(acompte)}</td></tr>` : ""}
    ${t.retenue ? `<tr><td class="small muted">Retenue de garantie 5 %</td><td class="num small">− ${fmtEur2(t.retenue)}</td></tr><tr><td class="small strong">Net à percevoir</td><td class="num small strong">${fmtEur2(t.net)}</td></tr>` : ""}
  </table>
  ${d.regime === "autoliquidation" ? `<div class="note brand mt">Autoliquidation : facturé HT, mention « Autoliquidation — TVA due par le preneur (art. 283-2 nonies du CGI) » ajoutée automatiquement.</div>` :
    d.local === "logement" ? `<div class="note mt">Taux réduits (10 % / 5,5 %) : logement achevé depuis plus de 2 ans. Le client doit certifier ces conditions (attestation ou mention sur le devis selon la réglementation en vigueur).</div>` : ""}`;
  const plan = d.id && db.chantiers.find(k => k.devisId === d.id);
  $("#actionsDevis").innerHTML = `<h3 style="margin-bottom:10px">Étapes suivantes</h3><div style="display:flex;flex-direction:column;gap:8px">
    ${d.id ? `<a class="btn" href="#/devis/${d.id}/apercu">${icon("print")} Aperçu & export PDF</a>` : `<span class="small muted">Enregistrez le devis pour l'exporter.</span>`}
    <button class="btn" id="genPlan">${icon("cal")} Prévisualiser le planning</button>
    ${plan ? `<a class="btn dark" href="#/planning/${plan.id}">${icon("site")} Voir le chantier ${esc(plan.ref)}</a>` : `<button class="btn dark" id="toChantier">${icon("check")} Devis signé → créer le chantier</button>`}
  </div>`;
  $("#genPlan").onclick = () => { saveDraft(false); go(`#/planning?devis=${draft.id}`); };
  $("#toChantier") && ($("#toChantier").onclick = () => convertirEnChantier());
}

function convertirEnChantier() {
  const d = draft;
  if (!d.lignes.length) return toast("Ajoutez au moins un ouvrage");
  d.statut = "accepte";
  saveDraft(false);
  const t = calculDevis(d);
  const debut = nextWorkday(addDays(TODAY, 14));
  const p = genererPlanning({ lotsMontants: t.parLot, debut, equipes: 1, aleas: 10 });
  const c = client(d.clientId);
  const k = { id: uid("k"), ref: prochainRefChantier(), nom: d.objet || `Chantier ${c?.nom}`, clientId: d.clientId, devisId: d.id, adresse: d.adresse,
    type: d.local === "tertiaire" ? "Tertiaire" : "Résidentiel", montantHT: t.ht, debut: p.debut, fin: p.fin, avancement: 0, factureHT: 0, conducteur: "À affecter", statut: "preparation" };
  db.chantiers.push(k);
  db.plannings[k.id] = { debut, equipes: 1, aleas: 10 };
  const mois = TODAY.slice(0, 7), m = db.caSigne.find(x => x.mois === mois);
  if (m) m.ht += t.ht;
  save();
  toast(`Chantier ${k.ref} créé et planifié`);
  go(`#/planning/${k.id}`);
}

views.apercu = id => {
  const d = db.devis.find(x => x.id === id);
  if (!d) return `<div class="empty">Devis introuvable</div>`;
  const c = client(d.clientId), t = calculDevis(d);
  const lots = LOTS.filter(l => d.lignes.some(x => x.lot === l.code));
  return `<div class="topbar no-print"><div><div class="small muted"><a href="#/devis/${d.id}">Devis ${esc(d.numero)}</a> /</div><h1>Aperçu</h1></div>
    <div class="actions"><a class="btn" href="#/devis/${d.id}">Modifier</a><button class="btn primary print-btn" onclick="window.print()">${icon("print")} Imprimer / PDF</button></div></div>
  <div class="note brand no-print" style="max-width:860px;margin:0 auto 16px">Mise en page provisoire — elle sera alignée sur votre trame de devis dès que vous me la transmettez.</div>
  <div class="doc">
    <div class="head"><div class="logo">BRTC<small>${esc(ENTREPRISE.activite)}</small><small>${esc(ENTREPRISE.adresse)} · ${esc(ENTREPRISE.site)}</small></div>
      <div style="text-align:right"><div style="font-size:20px;font-weight:800">DEVIS</div><div>N° <b>${esc(d.numero)}</b></div><div>Date : ${fmtDate(d.date)}</div><div>Validité : ${d.validite} jours</div></div></div>
    <div class="parties"><div class="box"><b>Entreprise</b><br>${esc(ENTREPRISE.nom)} — ${esc(ENTREPRISE.adresse)}<br>${esc(ENTREPRISE.siret)}<br>${esc(ENTREPRISE.tvaIntra)}<br>${esc(ENTREPRISE.certifications)}</div>
      <div class="box"><b>Client</b><br>${esc(c?.nom)}<br>À l'attention de ${esc(c?.contact)}<br>${esc(c?.email)}<br><br><b>Chantier :</b> ${esc(d.adresse)}</div></div>
    <p><b>Objet :</b> ${esc(d.objet)}</p>
    <table><thead><tr><th>Désignation</th><th style="text-align:right">Qté</th><th>U</th><th style="text-align:right">PU HT</th><th style="text-align:right">TVA</th><th style="text-align:right">Total HT</th></tr></thead><tbody>
    ${lots.map(l => `<tr class="lot-row"><td colspan="6">${l.code} — ${esc(l.nom)}</td></tr>` + d.lignes.filter(x => x.lot === l.code).map(x => `<tr><td>${esc(x.designation)}</td><td class="num">${fmtNum(x.qte)}</td><td>${esc(x.unite)}</td><td class="num">${fmtEur2(x.pu)}</td><td class="num">${fmtNum(tauxLigne(d, x))} %</td><td class="num">${fmtEur2(x.qte * x.pu)}</td></tr>`).join("") + `<tr><td colspan="5" style="text-align:right"><i>Sous-total ${esc(l.nom)}</i></td><td class="num"><b>${fmtEur2(t.parLot[l.code])}</b></td></tr>`).join("")}
    </tbody></table>
    <table style="width:50%;margin-left:auto;margin-top:16px"><tbody>
      ${t.remise ? `<tr><td>Total HT brut</td><td class="num">${fmtEur2(t.brut)}</td></tr><tr><td>Remise ${fmtNum(d.remise)} %</td><td class="num">− ${fmtEur2(t.remise)}</td></tr>` : ""}
      <tr><td><b>Total HT</b></td><td class="num"><b>${fmtEur2(t.ht)}</b></td></tr>
      ${Object.entries(t.tvaParTaux).sort((a, b) => b[0] - a[0]).map(([tx, e]) => `<tr><td>TVA ${fmtNum(+tx)} % (base ${fmtEur2(e.base)})</td><td class="num">${fmtEur2(e.tva)}</td></tr>`).join("")}
      <tr><td style="background:#FBAD1C"><b>Total TTC</b></td><td class="num" style="background:#FBAD1C"><b>${fmtEur2(t.ttc)}</b></td></tr>
      ${d.acompte ? `<tr><td>Acompte à la commande (${d.acompte} %)</td><td class="num">${fmtEur2(t.ttc * d.acompte / 100)}</td></tr>` : ""}
      ${t.retenue ? `<tr><td>Retenue de garantie 5 %</td><td class="num">${fmtEur2(t.retenue)}</td></tr>` : ""}
    </tbody></table>
    <div class="mentions">
      ${d.regime === "autoliquidation" ? "<p><b>Autoliquidation — TVA due par le preneur (article 283-2 nonies du CGI).</b></p>" : ""}
      ${d.local === "logement" && d.regime !== "autoliquidation" ? "<p>Taux réduits de TVA appliqués sous réserve que le client certifie que les travaux portent sur un local à usage d'habitation achevé depuis plus de deux ans.</p>" : ""}
      ${t.retenue ? "<p>Retenue de garantie de 5 % (loi n° 71-584 du 16 juillet 1971), libérable un an après la réception, pouvant être remplacée par une caution bancaire.</p>" : ""}
      <p>Conditions de paiement : [à compléter]. Pénalités de retard : [à compléter] ; indemnité forfaitaire pour frais de recouvrement : 40 €. Assurance : ${esc(ENTREPRISE.assurance)}.</p>
    </div>
    <div class="sign"><div>Pour BRTC<br>Date et signature</div><div>Pour le client — « Bon pour accord »<br>Date, cachet et signature</div></div>
  </div>`;
};

// ---- Chantiers ----
views.chantiers = () => {
  const actifs = chantiersActifs(), livres = db.chantiers.filter(k => k.statut === "livre");
  return `<div class="topbar"><div><h1>Chantiers</h1><div class="sub">Mettez à jour l'avancement : le reste à facturer et les alertes de retard se recalculent automatiquement.</div></div></div>
  <div class="card table-wrap"><div class="card-h"><h2>En cours (${actifs.length})</h2></div><div class="card-b">${tableChantiers(actifs)}</div></div>
  <div class="card table-wrap mt"><div class="card-h"><h2>Livrés (${livres.length})</h2></div><div class="card-b">${tableChantiers(livres)}</div></div>`;
};
views.chantiers.bind = () => {
  $$("[data-av]").forEach(el => {
    el.onclick = e => e.stopPropagation();
    el.onchange = () => {
      const k = db.chantiers.find(x => x.id === el.dataset.av);
      k.avancement = Math.max(0, Math.min(100, +el.value));
      if (k.avancement > 0 && k.statut === "preparation") k.statut = "en_cours";
      if (k.avancement === 100 && k.statut === "en_cours") k.statut = "reception";
      save(); route();
    };
  });
  $$("[data-sit]").forEach(b => b.onclick = e => {
    e.stopPropagation();
    const k = db.chantiers.find(x => x.id === b.dataset.sit), m = aFacturer(k);
    k.factureHT = round2(k.factureHT + m);
    save(); route(); toast(`Situation ${k.ref} : ${fmtEur(m)} HT à facturer`);
  });
};

// ---- Planning ----
const REPARTITION = {
  Résidentiel: { INST: 3, DEMO: 7, GO: 6, MAC: 6, MENEXT: 8, ELEC: 11, PLB: 12, PLAT: 15, CAR: 8, MENINT: 12, PEINT: 10, NET: 2 },
  Tertiaire: { INST: 3, DEMO: 8, MAC: 4, ELEC: 18, PLB: 9, PLAT: 22, CAR: 6, MENINT: 13, PEINT: 14, NET: 3 },
};
function sourcePlanning(params, id) {
  if (id) {
    const k = db.chantiers.find(x => x.id === id);
    if (!k) return null;
    const dv = k.devisId && db.devis.find(d => d.id === k.devisId);
    let lots;
    if (dv) lots = calculDevis(dv).parLot;
    else { const r = REPARTITION[k.type] || REPARTITION.Résidentiel; lots = Object.fromEntries(Object.entries(r).map(([c, p]) => [c, k.montantHT * p / 100])); }
    const cfg = db.plannings[k.id] || { debut: k.debut, equipes: k.montantHT > 400000 ? 3 : k.montantHT > 150000 ? 2 : 1, aleas: 10 };
    return { titre: k.nom, sous: `${k.ref} · ${client(k.clientId)?.nom} · ${fmtEur(k.montantHT)} HT${dv ? "" : " (répartition type)"}`, lots, cfg, chantier: k };
  }
  const dId = params.get("devis");
  const dv = dId && db.devis.find(d => d.id === dId);
  if (dv) return { titre: dv.objet || dv.numero, sous: `Prévisionnel depuis le devis ${dv.numero} · ${client(dv.clientId)?.nom}`, lots: calculDevis(dv).parLot, cfg: { debut: nextWorkday(addDays(TODAY, 14)), equipes: 1, aleas: 10 }, devis: dv };
  return null;
}

let planState = null;
views.planning = (id, params) => {
  const src = sourcePlanning(params, id);
  const opts = db.chantiers.filter(k => k.statut !== "livre");
  const selecteur = `<select id="pickK"><option value="">— Choisir un chantier —</option>${opts.map(k => `<option value="${k.id}" ${k.id === id ? "selected" : ""}>${esc(k.ref)} · ${esc(k.nom)}</option>`).join("")}</select>
    <select id="pickD"><option value="">— ou un devis —</option>${db.devis.filter(d => d.statut !== "refuse").map(d => `<option value="${d.id}" ${d.id === params.get("devis") ? "selected" : ""}>${esc(d.numero)} · ${esc(d.objet)}</option>`).join("")}</select>`;
  if (!src) {
    planState = null;
    return `<div class="topbar"><div><h1>Planning</h1><div class="sub">Générateur automatique : enchaînement des corps d'état, durées calculées à partir des montants du devis, jours fériés exclus.</div></div></div>
      <div class="toolbar">${selecteur}</div>
      <div class="card"><div class="card-b"><h2>Comment ça marche</h2><ol class="muted" style="line-height:1.8">
        <li>Chaque lot du devis devient une tâche ; sa durée = montant HT ÷ (production journalière d'une équipe × nombre d'équipes) + marge d'aléas.</li>
        <li>Les lots s'enchaînent dans l'ordre réel d'un chantier TCE (démolition → gros œuvre → maçonnerie → réseaux & menuiseries ext. → plâtrerie → carrelage & menuiserie int. → peinture → réception).</li>
        <li>Les week-ends et jours fériés français sont exclus ; le chemin critique (lots sans marge) apparaît en anthracite.</li>
      </ol></div></div>`;
  }
  planState = src;
  return `<div class="topbar no-print"><div><div class="small muted"><a href="#/planning">Planning</a> /</div><h1>${esc(src.titre)}</h1><div class="sub">${esc(src.sous)}</div></div>
    <div class="actions">${src.chantier ? `<button class="btn" id="savePlan">${icon("check")} Appliquer au chantier</button>` : ""}<button class="btn primary print-btn" onclick="window.print()">${icon("print")} Imprimer</button></div></div>
  <div class="toolbar no-print">${selecteur}</div>
  <div class="card no-print"><div class="card-b form-grid">
    <div class="field"><label>Date de démarrage</label><input type="date" id="pDebut" value="${src.cfg.debut}"></div>
    <div class="field"><label>Nombre d'équipes en parallèle</label><input type="number" id="pEq" min="1" max="6" value="${src.cfg.equipes}"></div>
    <div class="field"><label>Marge d'aléas (%)</label><input type="number" id="pAl" min="0" max="50" step="5" value="${src.cfg.aleas}"></div>
    <div class="field"><label>Résultat</label><div id="pRes" class="strong" style="padding:8px 0"></div></div>
  </div></div>
  <div class="card mt"><div class="card-h"><h2>Diagramme de Gantt</h2><span class="legend"><span><i style="background:var(--brtc-anthracite)"></i>Chemin critique</span><span><i style="background:var(--brtc-orange)"></i>Lot avec marge</span><span><i style="background:var(--crit);width:2px"></i>Aujourd'hui</span></span></div>
    <div class="card-b"><div id="gantt"></div></div></div>
  <div class="card mt"><div class="card-h"><h2>Détail des lots</h2></div><div class="card-b table-wrap" id="pTable"></div></div>`;
};
views.planning.bind = id => {
  $("#pickK").onchange = e => go(e.target.value ? `#/planning/${e.target.value}` : "#/planning");
  $("#pickD").onchange = e => go(e.target.value ? `#/planning?devis=${e.target.value}` : "#/planning");
  if (!planState) return;
  const draw = () => {
    const cfg = { debut: $("#pDebut").value || TODAY, equipes: +$("#pEq").value || 1, aleas: +$("#pAl").value || 0 };
    planState.cfg = cfg;
    const p = genererPlanning({ lotsMontants: planState.lots, ...cfg });
    planState.result = p;
    const sem = Math.ceil(p.joursOuvres / 5);
    $("#pRes").innerHTML = `${p.joursOuvres} jours ouvrés (~${sem} sem.) · fin ${fmtDate(p.fin)}`;
    $("#gantt").innerHTML = gantt(p);
    $("#pTable").innerHTML = `<table class="t"><thead><tr><th>Lot</th><th class="num">Montant HT</th><th class="num">Durée</th><th>Début</th><th>Fin</th><th>Après</th><th class="num">Marge</th></tr></thead><tbody>
      ${p.tasks.map(t => `<tr><td><span class="tag">${t.code}</span> ${esc(t.nom)}</td><td class="num">${fmtEur(t.montant)}</td><td class="num">${t.duree} j</td><td>${fmtDate(t.debut)}</td><td>${fmtDate(t.fin)}</td>
      <td class="small muted">${t.pred.map(lotNom).join(", ") || "—"}</td><td class="num">${t.critique ? '<span class="badge b-neutral">Critique</span>' : t.marge + " j"}</td></tr>`).join("")}</tbody></table>`;
  };
  ["#pDebut", "#pEq", "#pAl"].forEach(s => $(s).oninput = draw);
  draw();
  $("#savePlan") && ($("#savePlan").onclick = () => {
    const k = planState.chantier, p = planState.result;
    db.plannings[k.id] = planState.cfg;
    k.debut = p.debut; k.fin = p.fin;
    save(); toast(`Dates du chantier ${k.ref} mises à jour : ${fmtDate(p.debut)} → ${fmtDate(p.fin)}`);
  });
};

function gantt(p) {
  if (!p.tasks.length) return '<div class="empty">Aucun lot à planifier</div>';
  const start = addDays(p.debut, -((toD(p.debut).getUTCDay() + 6) % 7)); // lundi de la 1re semaine
  const end = addDays(p.fin, 7);
  const nDays = diffDays(start, end) + 1;
  const dispo = ($("#gantt")?.clientWidth || 900) - 242;
  const W = Math.max(4, Math.min(26, Math.floor(dispo / nDays)));
  const every = Math.ceil(64 / (7 * W)); // une étiquette toutes les n semaines si la place manque
  let iw = 0;
  const x = s => diffDays(start, s) * W;
  let heads = "", shade = "";
  for (let s = start; s <= end; s = addDays(s, 7)) {
    const wk = Math.ceil((((toD(s) - Date.UTC(toD(s).getUTCFullYear(), 0, 1)) / 86400000) + new Date(Date.UTC(toD(s).getUTCFullYear(), 0, 1)).getUTCDay() + 1) / 7);
    heads += `<div class="g-head" style="position:absolute;left:${x(s)}px;width:${7 * W * every}px">${iw++ % every ? "" : (W * 7 >= 80 ? `S${wk} · ` : "") + fmtDateShort(s)}</div>`;
  }
  for (let s = start; s <= end; s = addDays(s, 1)) if (isWeekend(s) || isFerie(s)) shade += `<div class="g-weekend" style="left:${x(s)}px;width:${W}px" ${isFerie(s) ? `data-tip="${esc(isFerie(s))}"` : ""}></div>`;
  const today = TODAY >= start && TODAY <= end ? `<div class="g-today" style="left:${x(TODAY)}px" data-tip="Aujourd'hui"></div>` : "";
  const totalW = nDays * W;
  const row = inner => `<div class="g-row" style="width:${totalW}px">${shade}${today}${inner}</div>`;
  let html = `<div class="gantt"><div class="gantt-grid" style="grid-template-columns:240px ${totalW}px">
    <div class="g-label" style="height:30px;font-size:11px;color:var(--text-3)">LOT</div><div style="position:relative;height:30px;border-bottom:1px solid var(--border)">${heads}</div>`;
  for (const t of p.tasks) {
    const tipTxt = `<b>${esc(t.nom)}</b><br>${fmtDate(t.debut)} → ${fmtDate(t.fin)}<br>${t.duree} jours ouvrés · ${fmtEur(t.montant)} HT<br>${t.critique ? "Chemin critique" : `Marge : ${t.marge} j`}`;
    html += `<div class="g-label"><span class="tag">${t.code}</span>${esc(t.nom)}</div>` +
      row(`<div class="g-bar ${t.critique ? "crit" : ""}" style="left:${x(t.debut)}px;width:${Math.max(W, x(t.fin) - x(t.debut) + W)}px" data-tip="${esc(tipTxt)}">${t.duree} j</div>`);
  }
  html += `<div class="g-label strong">Réception des travaux</div>` + row(`<div class="g-bar ms" style="left:${x(p.fin) + W}px" data-tip="Réception prévue le ${fmtDate(p.fin)}">${fmtDate(p.fin)}</div>`);
  return html + "</div></div>";
}

// ---- Calculateur TVA ----
views.tva = () => `<div class="topbar"><div><h1>Calculateur de TVA</h1><div class="sub">Répondez à 3 questions : le bon taux et les mentions obligatoires sont proposés automatiquement.</div></div></div>
  <div class="grid g-2">
    <div class="card"><div class="card-b form-grid" style="grid-template-columns:1fr 1fr">
      <div class="field span-4"><label>1. Qui est votre client ?</label><select id="tReg"><option value="direct">Le maître d'ouvrage (client final)</option><option value="autoliquidation">Une entreprise du BTP (je suis sous-traitant)</option></select></div>
      <div class="field span-4"><label>2. Type de local</label><select id="tLoc">${Object.entries(LOCAUX).map(([k, v]) => `<option value="${k}">${v}</option>`).join("")}</select></div>
      <div class="field span-4"><label>3. Nature des travaux</label><select id="tNat">
        <option value="amelioration">Amélioration, transformation, aménagement, entretien</option>
        <option value="energie">Rénovation énergétique (isolation, menuiseries performantes, PAC…)</option>
        <option value="neuf">Travaux équivalant à du neuf (surélévation, extension, remise à neuf du gros œuvre)</option>
        <option value="equipement">Fourniture d'équipements ménagers / mobilier</option></select></div>
      <div class="field"><label>Montant</label><input type="number" id="tMt" value="100000" step="any"></div>
      <div class="field"><label>Le montant saisi est</label><div class="seg" id="tSens"><button class="on" data-v="ht">HT</button><button data-v="ttc">TTC</button></div></div>
      <div class="field"><label>Retenue de garantie</label><select id="tRet"><option value="5">5 %</option><option value="0">Aucune (caution bancaire)</option></select></div>
      <div class="field"><label>Acompte (%)</label><input type="number" id="tAc" value="30" min="0" max="100"></div>
    </div></div>
    <div class="card"><div class="card-h"><h2>Résultat</h2><span id="tTaux"></span></div><div class="card-b" id="tOut"></div></div>
  </div>
  <div class="card mt"><div class="card-h"><h2>Comparatif des taux</h2><span class="hint">même montant, tous taux</span></div><div class="card-b table-wrap" id="tCmp"></div></div>
  <div class="note mt">Aide à la décision basée sur les règles générales (CGI art. 278-0 bis A, 279-0 bis, 283-2 nonies). Les cas particuliers (logement social, travaux mixtes, parties communes d'immeubles mixtes) sont à valider avec votre expert-comptable.</div>`;
views.tva.bind = () => {
  let sens = "ht";
  $$("#tSens button").forEach(b => b.onclick = e => { e.preventDefault(); $$("#tSens button").forEach(x => x.classList.remove("on")); b.classList.add("on"); sens = b.dataset.v; calc(); });
  const regle = () => {
    const reg = $("#tReg").value, loc = $("#tLoc").value, nat = $("#tNat").value;
    if (reg === "autoliquidation") return { t: 0, why: "Sous-traitance BTP : vous facturez HT, c'est l'entreprise principale qui déclare la TVA.", mention: "Autoliquidation — TVA due par le preneur (art. 283-2 nonies du CGI)." };
    if (loc !== "logement") return { t: 20, why: loc === "tertiaire" ? "Locaux professionnels : taux normal." : "Logement de moins de 2 ans : taux normal.", mention: "" };
    if (nat === "neuf") return { t: 20, why: "Travaux qui reviennent à produire un immeuble neuf : taux normal, même dans un logement ancien.", mention: "" };
    if (nat === "equipement") return { t: 20, why: "Équipements ménagers et mobilier : exclus des taux réduits.", mention: "" };
    if (nat === "energie") return { t: 5.5, why: "Rénovation énergétique d'un logement de plus de 2 ans (et travaux induits).", mention: "Le client certifie que le logement est achevé depuis plus de deux ans et que les travaux remplissent les conditions du taux de 5,5 %." };
    return { t: 10, why: "Travaux d'amélioration / entretien d'un logement achevé depuis plus de 2 ans.", mention: "Le client certifie que le logement est achevé depuis plus de deux ans." };
  };
  const calc = () => {
    const r = regle(), mt = +$("#tMt").value || 0;
    const ht = sens === "ht" ? mt : mt / (1 + r.t / 100), tva = ht * r.t / 100, ttc = ht + tva;
    const ret = ttc * (+$("#tRet").value) / 100, ac = ttc * (+$("#tAc").value || 0) / 100;
    $("#tTaux").innerHTML = `<span class="badge b-brand" style="font-size:14px">TVA ${fmtNum(r.t)} %</span>`;
    $("#tOut").innerHTML = `<table class="totals"><tr><td>Montant HT</td><td class="num">${fmtEur2(ht)}</td></tr><tr><td>TVA ${fmtNum(r.t)} %</td><td class="num">${fmtEur2(tva)}</td></tr>
      <tr class="grand"><td>Montant TTC</td><td class="num">${fmtEur2(ttc)}</td></tr>
      <tr><td class="muted">Acompte à la commande</td><td class="num">${fmtEur2(ac)}</td></tr>
      ${ret ? `<tr><td class="muted">Retenue de garantie (libérée à 1 an)</td><td class="num">${fmtEur2(ret)}</td></tr>` : ""}
      <tr><td class="strong">Solde à percevoir après acompte${ret ? " et retenue" : ""}</td><td class="num strong">${fmtEur2(ttc - ac - ret)}</td></tr></table>
      <div class="note mt"><b>Pourquoi ce taux ?</b> ${esc(r.why)}</div>${r.mention ? `<div class="note brand mt"><b>Mention à porter sur le devis / la facture :</b><br>« ${esc(r.mention)} »</div>` : ""}`;
    $("#tCmp").innerHTML = `<table class="t"><thead><tr><th>Taux</th><th>Cas d'usage</th><th class="num">HT</th><th class="num">TVA</th><th class="num">TTC</th></tr></thead><tbody>
      ${[[20, "Tertiaire, neuf, équipements"], [10, "Amélioration / entretien logement > 2 ans"], [5.5, "Rénovation énergétique logement > 2 ans"], [0, "Autoliquidation (sous-traitance)"]].map(([t, u]) => {
        const h = sens === "ht" ? mt : mt / (1 + t / 100);
        return `<tr ${t === r.t ? 'style="background:var(--brtc-orange-50)"' : ""}><td class="strong">${fmtNum(t)} %</td><td class="muted">${u}</td><td class="num">${fmtEur2(h)}</td><td class="num">${fmtEur2(h * t / 100)}</td><td class="num strong">${fmtEur2(h * (1 + t / 100))}</td></tr>`;
      }).join("")}</tbody></table>`;
  };
  ["#tReg", "#tLoc", "#tNat", "#tMt", "#tRet", "#tAc"].forEach(s => $(s).oninput = calc);
  calc();
};

// ---------- Routeur ----------
// La route courante est gardée en mémoire : la navigation marche aussi quand
// la page est affichée dans un cadre qui ne transmet pas l'adresse (#…).
let courant = location.hash || "#/";
function go(h) {
  courant = h;
  try { history.pushState(null, "", h); } catch { /* cadre restreint : navigation en mémoire */ }
  route();
}
document.addEventListener("click", e => {
  const a = e.target.closest?.('a[href^="#"]');
  if (!a || e.defaultPrevented || e.metaKey || e.ctrlKey) return;
  e.preventDefault();
  go(a.getAttribute("href"));
});
function route() {
  const [path, qs] = courant.slice(1).split("?");
  const params = new URLSearchParams(qs || "");
  const seg = (path || "/").split("/").filter(Boolean);
  let v, arg;
  if (!seg.length) v = "dashboard";
  else if (seg[0] === "clients") { v = seg[1] ? "client" : "clients"; arg = seg[1]; }
  else if (seg[0] === "devis") { if (seg[2] === "apercu") { v = "apercu"; arg = seg[1]; } else if (seg[1]) { v = "devisEdit"; arg = seg[1]; } else v = "devis"; }
  else if (seg[0] === "chantiers") v = "chantiers";
  else if (seg[0] === "planning") { v = "planning"; arg = seg[1]; }
  else if (seg[0] === "tva") v = "tva";
  else v = "dashboard";

  main.innerHTML = views[v](arg, params);
  views[v].bind?.(arg, params);
  $$("tr[data-href]", main).forEach(tr => tr.onclick = e => { if (!e.target.closest("a,button,input,select")) go(tr.dataset.href); });
  const navKey = { client: "clients", devisEdit: "devis", apercu: "devis" }[v] || v;
  $$(".nav a").forEach(a => a.classList.toggle("active", a.dataset.v === navKey || (navKey === "devisEdit" && arg === "nouveau" && a.dataset.v === "nouveau")));
  if (v === "devisEdit" && arg === "nouveau") { $$(".nav a").forEach(a => a.classList.toggle("active", a.dataset.v === "nouveau")); }
  $("#cntDevis").textContent = devisOuverts().length;
  $("#cntAlert").textContent = alertes().length;
  window.scrollTo(0, 0);
}

// ---------- Navigation ----------
$("#nav").innerHTML = `
  <div class="nav-section">Pilotage</div>
  <a href="#/" data-v="dashboard">${icon("dash")} Tableau de bord <span class="count" id="cntAlert"></span></a>
  <a href="#/clients" data-v="clients">${icon("users")} Clients</a>
  <a href="#/chantiers" data-v="chantiers">${icon("site")} Chantiers</a>
  <div class="nav-section">Commercial</div>
  <a href="#/devis" data-v="devis">${icon("file")} Devis <span class="count" id="cntDevis"></span></a>
  <a href="#/devis/nouveau" data-v="nouveau">${icon("plus")} Générateur de devis</a>
  <div class="nav-section">Outils</div>
  <a href="#/planning" data-v="planning">${icon("cal")} Planning automatique</a>
  <a href="#/tva" data-v="tva">${icon("calc")} Calculateur TVA</a>
  <a href="charte.html">${icon("palette")} Charte graphique</a>`;
$("#reset").onclick = () => modal("Réinitialiser la démo", '<p class="muted">Remettre les données de démonstration ? Vos modifications enregistrées dans ce navigateur seront perdues.</p>', () => reset(), "Réinitialiser");
$("#theme").onclick = () => {
  const r = document.documentElement;
  const dark = r.dataset.theme ? r.dataset.theme === "dark" : matchMedia("(prefers-color-scheme: dark)").matches;
  r.dataset.theme = dark ? "light" : "dark";
  try { localStorage.setItem("brtc-theme", r.dataset.theme); } catch { /* ignoré */ }
};
window.addEventListener("popstate", () => { courant = location.hash || "#/"; route(); });
route();
