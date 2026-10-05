(() => {
'use strict';

/* ───────── utilidades ───────── */
const $ = (s, r = document) => r.querySelector(s);
const $$ = (s, r = document) => [...r.querySelectorAll(s)];
const esc = s => String(s ?? '').replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
const pad = n => String(n).padStart(2, '0');
const iso = d => `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
const parse = s => { const [y, m, d] = s.split('-').map(Number); return new Date(y, m - 1, d); };
const addDays = (s, n) => { const d = parse(s); d.setDate(d.getDate() + n); return iso(d); };
const startOfWeek = s => { const d = parse(s); const wd = (d.getDay() + 6) % 7; d.setDate(d.getDate() - wd); return iso(d); };
const todayISO = () => iso(new Date());
const uid = () => Math.random().toString(36).slice(2, 10) + Date.now().toString(36).slice(-4);
const toMin = t => { const [h, m] = t.split(':').map(Number); return h * 60 + m; };
const fromMin = m => `${pad(Math.floor(m / 60))}:${pad(m % 60)}`;
const L = new Intl.DateTimeFormat('es-CL');
const fmt = (s, o) => new Intl.DateTimeFormat('es-CL', o).format(parse(s));
const hrs = m => { const h = m / 60; return (Math.round(h * 10) / 10).toString().replace('.', ',') + ' h'; };
const PALETTE = ['#6E8CA8', '#C47F7A', '#8AA07C', '#D9A441', '#9B86B0', '#C8956B', '#6FA3A0', '#B8A38A'];

/* ───────── estado y almacenamiento ───────── */
// Toda la persistencia pasa por `Store`. Para sincronizar con Cami en la nube
// (siguiente etapa) solo hay que reemplazar load/save por Supabase/Firebase.
const KEY = 'familia.v1';
const Store = {
  load() { try { return JSON.parse(localStorage.getItem(KEY)); } catch { return null; } },
  save(s) { try { localStorage.setItem(KEY, JSON.stringify(s)); } catch { /* sin almacenamiento */ } }
};

const defaultAreas = () => [
  { id: 'espiritual', name: 'Espiritual', emoji: '🕊️', color: '#9B86B0' },
  { id: 'relaciones', name: 'Relaciones', emoji: '🤝', color: '#C47F7A' },
  { id: 'salud', name: 'Salud', emoji: '💪', color: '#8AA07C' },
  { id: 'hogar', name: 'Hogar', emoji: '🏠', color: '#D9A441' },
  { id: 'trabajo', name: 'Trabajo y proyectos', emoji: '🌱', color: '#6E8CA8' },
  { id: 'otros', name: 'Otros', emoji: '✨', color: '#B8A38A' }
];
// Las áreas agrupan categorías y se usan para medir el crecimiento. El color del tema viene del área.
const defaultCats = () => [
  { id: 'oracion', name: 'Oración', emoji: '🙏', area: 'espiritual', points: 10 },
  { id: 'biblia', name: 'Lectura bíblica', emoji: '📖', area: 'espiritual', points: 10 },
  { id: 'ayuno', name: 'Ayuno', emoji: '🌾', area: 'espiritual', points: 15 },
  { id: 'salida', name: 'Salida', emoji: '🥂', area: 'relaciones', points: 5 },
  { id: 'juntas', name: 'Amigos y familia', emoji: '👥', area: 'relaciones', points: 10 },
  { id: 'ejercicio', name: 'Ejercicio', emoji: '💪', area: 'salud', points: 20 },
  { id: 'comida', name: 'Comida', emoji: '🍽️', area: 'salud', points: 10 },
  { id: 'orden', name: 'Orden depto', emoji: '🧹', area: 'hogar', points: 10 },
  { id: 'compras', name: 'Compras', emoji: '🛒', area: 'hogar', points: 5 },
  { id: 'reunion', name: 'Reunión', emoji: '💼', area: 'trabajo', points: 10 },
  { id: 'grabacion', name: 'Grabación Ahava', emoji: '🎬', area: 'trabajo', points: 20 },
  { id: 'proyecto', name: 'Proyecto personal', emoji: '🌱', area: 'trabajo', points: 15 }
];

function seedEvents() {
  const ws = startOfWeek(todayISO());
  const d = n => addDays(ws, n);
  const E = (title, owner, cat, date, start, end, extra = {}) => ({ id: uid(), title, owner, cat, date, start, end, repeat: 'none', demo: true, res: {}, ...extra });
  return [
    E('Oración de la mañana', 'a', 'oracion', d(0), '07:00', '07:20', { repeat: 'daily' }),
    E('Oración de la mañana', 'b', 'oracion', d(0), '07:30', '07:50', { repeat: 'daily' }),
    E('Gimnasio', 'a', 'ejercicio', d(0), '18:30', '19:30', { repeat: 'weekly', days: [1, 3, 5] }),
    E('Caminata', 'b', 'ejercicio', d(1), '08:00', '09:00', { repeat: 'weekly', days: [2, 4] }),
    E('Reunión de trabajo', 'a', 'reunion', d(1), '10:00', '11:00'),
    E('Grabación Ahava', 'b', 'grabacion', d(2), '10:00', '14:00'),
    E('Compras de la semana', 'both', 'compras', d(5), '11:00', '12:30'),
    E('Cocinar para la semana', 'both', 'comida', d(6), '16:00', '18:00'),
    E('Ordenar el departamento', 'both', 'orden', d(5), '', '', { points: 15 }),
    E('Avanzar proyecto personal', 'a', 'proyecto', d(3), '20:00', '21:30'),
    E('Cena afuera', 'both', 'salida', d(4), '20:30', '22:30')
  ];
}

const defaultState = () => ({
  version: 2,
  people: { a: { name: 'Daniel', color: '#6E8CA8' }, b: { name: 'Cami', color: '#C47F7A' }, both: { name: 'Juntos', color: '#8AA07C' } },
  areas: defaultAreas(),
  cats: defaultCats(),
  events: seedEvents(),
  settings: { dayLimit: 6, winStart: '08:00', winEnd: '22:00' },
  ui: { tab: 'plan', view: 'week', layer: 'both' }
});

let S = Store.load() || defaultState();
S.ui = { tab: 'plan', view: 'week', layer: 'both', ...S.ui };
delete S.ui.layers;
// migraciones de datos guardados antes de estos cambios
S.events = (S.events || []).filter(e => !(e.demo && /yoga/i.test(e.title)));
S.cats.forEach(c => { c.name = c.name.replace(/Ajava/g, 'Ahava'); });
S.events.forEach(e => { e.title = e.title.replace(/Ajava/g, 'Ahava'); });
if (!S.areas) {
  S.areas = defaultAreas();
  const fresh = defaultCats(), byId = Object.fromEntries(fresh.map(c => [c.id, c]));
  S.cats.forEach(c => { c.area = (byId[c.id] || {}).area || 'otros'; delete c.color; });
  fresh.forEach(c => { if (!S.cats.some(x => x.id === c.id)) S.cats.push(c); });
}
S.cats.forEach(c => { if (!S.areas.some(a => a.id === c.area)) c.area = 'otros'; });
if (!S.areas.some(a => a.id === 'otros')) S.areas.push(defaultAreas().pop());
// estado de cada ocurrencia: ev.res[fecha] = done | missed | cancelled | moved
S.events.forEach(e => {
  e.res = e.res || {};
  if (e.done) { Object.keys(e.done).forEach(d => { if (e.done[d]) e.res[d] = 'done'; }); delete e.done; }
});
let cursor = todayISO();
const save = () => Store.save(S);

const area = id => S.areas.find(a => a.id === id) || S.areas[S.areas.length - 1];
const cat = id => {
  const c = S.cats.find(x => x.id === id) || { id, name: 'Otro', emoji: '•', area: 'otros', points: 10 };
  return { ...c, color: area(c.area).color };
};
const who = o => S.people[o];
const ownerColor = o => who(o).color;

/* ───────── lógica de calendario ───────── */
function occurs(ev, d) {
  if (d < ev.date) return false;
  if (ev.until && d > ev.until) return false;
  if (ev.repeat === 'daily') return true;
  if (ev.repeat === 'weekly') {
    const days = ev.days && ev.days.length ? ev.days : [parse(ev.date).getDay()];
    return days.includes(parse(d).getDay());
  }
  return d === ev.date;
}

function itemsOn(d, all = false) {
  const out = [];
  for (const ev of S.events) {
    if (!occurs(ev, d)) continue;
    if (!all && S.ui.layer !== 'both' && ev.owner !== S.ui.layer && ev.owner !== 'both') continue;
    const status = ev.res && ev.res[d];
    out.push({ ev, date: d, status, done: status === 'done', pts: ev.points ?? cat(ev.cat).points ?? 10 });
  }
  return out.sort((x, y) => (x.ev.start || '99').localeCompare(y.ev.start || '99'));
}

const dayLoad = d => itemsOn(d, true).reduce((m, it) => m + (it.ev.start && it.ev.end ? Math.max(0, toMin(it.ev.end) - toMin(it.ev.start)) : 20), 0);
const loadRatio = d => dayLoad(d) / (S.settings.dayLimit * 60);

function freeSlots(d) {
  const ws = toMin(S.settings.winStart), we = toMin(S.settings.winEnd);
  const busy = itemsOn(d, true).filter(i => i.ev.start && i.ev.end)
    .map(i => [Math.max(ws, toMin(i.ev.start)), Math.min(we, toMin(i.ev.end))]).filter(([a, b]) => b > a)
    .sort((x, y) => x[0] - y[0]);
  const free = []; let t = ws;
  for (const [a, b] of busy) { if (a - t >= 60) free.push([t, a]); t = Math.max(t, b); }
  if (we - t >= 60) free.push([t, we]);
  return free;
}

/* ───────── gamificación ───────── */
const earliest = () => S.events.reduce((m, e) => (e.date < m ? e.date : m), todayISO());

const signed = it => (it.status === 'done' ? it.pts : it.status === 'missed' ? -it.pts : 0);
const isActive = it => it.status !== 'cancelled' && it.status !== 'moved';
const itemsBetween = (from, to) => { const out = []; for (let d = from; d <= to; d = addDays(d, 1)) out.push(...itemsOn(d, true)); return out; };
const pointsFor = (person, from, to) => itemsBetween(from, to).filter(it => it.ev.owner === person || it.ev.owner === 'both').reduce((n, it) => n + signed(it), 0);
const teamPoints = (from, to) => itemsBetween(from, to).reduce((n, it) => n + signed(it), 0);
const plannedPoints = (from, to) => itemsBetween(from, to).filter(isActive).reduce((n, it) => n + it.pts, 0);

// Una racha sigue viva en los días con al menos una tarea hecha y ninguna sin cumplir.
function streak(person) {
  let d = todayISO(), n = 0;
  const ok = x => {
    const its = itemsOn(x, true).filter(it => it.ev.owner === person || it.ev.owner === 'both');
    return its.some(i => i.done) && !its.some(i => i.status === 'missed');
  };
  if (!ok(d)) d = addDays(d, -1);
  while (n < 365 && ok(d)) { n++; d = addDays(d, -1); }
  return n;
}

// Cosas de días pasados que nadie marcó todavía.
function openPast() {
  const t = todayISO(), out = [];
  for (let i = 1; i <= 14; i++) { const d = addDays(t, -i), n = itemsOn(d, true).filter(x => !x.status).length; if (n) out.push({ d, n }); }
  return out;
}

// Gana o pierde lo mismo según el área, para ver dónde crecen y dónde se descuidan.
function areaStats(areaId, from, to) {
  const its = itemsBetween(from, to).filter(it => cat(it.ev.cat).area === areaId);
  return { pts: its.reduce((n, it) => n + signed(it), 0), done: its.filter(i => i.done).length, missed: its.filter(i => i.status === 'missed').length, open: its.filter(i => !i.status && i.date <= todayISO()).length, total: its.filter(isActive).length };
}

const LEVELS = [[0, 'Semilla', '🌱'], [100, 'Brote', '🌿'], [300, 'Planta', '🪴'], [700, 'Árbol', '🌳'], [1500, 'Bosque', '🌲'], [3000, 'Jardín', '🌸']];
function level(total) {
  total = Math.max(0, total);
  let i = 0; LEVELS.forEach((l, k) => { if (total >= l[0]) i = k; });
  const next = LEVELS[i + 1];
  return { cur: LEVELS[i], next, pct: next ? (total - LEVELS[i][0]) / (next[0] - LEVELS[i][0]) : 1 };
}
const stars = pts => { const n = Math.max(0, Math.min(5, Math.floor(pts / 50))); return '★'.repeat(n) + '☆'.repeat(5 - n); };

function dayInsight(d) {
  const t = todayISO(), all = itemsOn(d, true), items = all.filter(isActive), total = items.length, done = items.filter(i => i.done).length;
  const ratio = loadRatio(d), lim = S.settings.dayLimit;
  const missed = all.filter(i => i.status === 'missed'), open = all.filter(i => !i.status);
  if (d < t && open.length) return { e: '📝', m: `${open.length} cosa${open.length > 1 ? 's' : ''} sin cerrar`, s: 'Marquen si se hizo, no se hizo, no se concretó o se reprogramó.', warn: 1 };
  if (d <= t && missed.length) return { e: '🌧️', m: `Sin cumplir: ${missed.map(i => i.ev.title).slice(0, 2).join(', ')}${missed.length > 2 ? ` y ${missed.length - 2} más` : ''}`, s: `Restó ${missed.reduce((n, i) => n + i.pts, 0)} puntos. Retómenlo mañana, un día malo no define la semana.`, warn: 1 };
  if (d > t || (d === t && done === 0)) {
    if (total === 0) return { e: '🌤️', m: 'Día libre', s: 'Buen momento para planificar algo juntos.' };
    if (ratio > 1) return { e: '🌊', m: `Día muy cargado (${hrs(dayLoad(d))})`, s: 'Dosifiquen: ¿se puede mover algo a otro día?', warn: 1 };
    if (ratio > .75) return { e: '⚖️', m: 'Día bastante lleno', s: `Cerca del límite de ${lim} h. Dejen un respiro.`, warn: 1 };
    if (d === t) return { e: '☀️', m: `Hoy hay ${total} cosa${total > 1 ? 's' : ''} en el plan`, s: 'Empiecen por lo más simple para tomar ritmo.' };
    return { e: '🗓️', m: `${total} cosa${total > 1 ? 's' : ''} planificada${total > 1 ? 's' : ''}`, s: 'Se ve manejable.' };
  }
  if (total === 0) return { e: '🌤️', m: 'Día sin registros', s: '' };
  if (done === total) return { e: '🌟', m: '¡Día completo!', s: `Sumaron ${items.reduce((n, i) => n + i.pts, 0)} puntos. Así se hace.` };
  if (done / total >= .6) return { e: '👏', m: 'Muy bien, sigan así', s: `Faltan ${total - done} para cerrar el día.` };
  return { e: '🌱', m: 'Buen avance', s: `${done} de ${total} hechas.` };
}

function weekInsight(ws) {
  const days = [...Array(7)].map((_, i) => addDays(ws, i));
  const load = days.reduce((m, d) => m + dayLoad(d), 0), prev = [...Array(7)].reduce((m, _, i) => m + dayLoad(addDays(ws, i - 7)), 0);
  const heavy = days.filter(d => loadRatio(d) > 1).length;
  const free = days.reduce((m, d) => m + freeSlots(d).reduce((a, [x, y]) => a + (y - x), 0), 0);
  const pts = teamPoints(ws, addDays(ws, 6)), plan = plannedPoints(ws, addDays(ws, 6));
  const t = todayISO();
  const wk = itemsBetween(ws, addDays(ws, 6)), miss = wk.filter(i => i.status === 'missed');
  if (miss.length >= 2) return { e: '🌧️', m: `${miss.length} cosas sin cumplir esta semana`, s: `Restaron ${miss.reduce((n, i) => n + i.pts, 0)} puntos. Revisen qué se repite y ajusten el plan.`, warn: 1 };
  if (heavy >= 2) return { e: '🌊', m: 'Semana muy cargada', s: `${heavy} días pasan del límite. Dosifiquen y dejen espacios libres.`, warn: 1 };
  if (prev > 0 && load > prev * 1.3) return { e: '📈', m: 'Estás sumando más tareas de lo normal', s: `${Math.round((load / prev - 1) * 100)}% más que la semana pasada. Ojo con el ritmo.`, warn: 1 };
  if (ws <= t && addDays(ws, 6) >= t && plan > 0) {
    const r = pts / plan;
    if (r >= .8) return { e: '🌟', m: 'Semana muy bien ajetreada', s: `${pts} de ${plan} puntos. Van excelente.` };
    if (r >= .4) return { e: '👏', m: 'Buen ritmo esta semana', s: `${pts} de ${plan} puntos. Sigan así.` };
  }
  if (load === 0) return { e: '📝', m: 'Semana en blanco', s: 'Siéntense 10 minutos a planificarla juntos.' };
  return { e: '🗓️', m: 'Semana equilibrada', s: `Tienen ${hrs(free)} libres para coordinar salidas.` };
}

const PHRASES = ['¡Bien hecho!', '¡Muy bien! Sigan así 🌿', '¡Eso suma!', '¡Un paso más!', '¡Gran trabajo!'];

/* ───────── render ───────── */
const main = $('#main');

function loadBar(ratio) {
  const f = Math.min(5, Math.ceil(ratio * 5 - 1e-9));
  const cls = ratio > 1 ? 'high' : ratio > .75 ? 'mid' : '';
  return `<div class="load ${cls}">${[0, 1, 2, 3, 4].map(i => `<span class="${i < f ? 'f' : ''}"></span>`).join('')}</div>`;
}

const STATUS = {
  done: { icon: '✓', label: 'Hecho' }, missed: { icon: '✕', label: 'No se hizo' },
  cancelled: { icon: '⊘', label: 'No se concretó' }, moved: { icon: '↻', label: 'Reprogramado' }
};

function itemHTML(it, compact) {
  const { ev } = it, c = cat(ev.cat), st = it.status, late = !st && it.date < todayISO();
  const time = ev.start ? `<div class="time">${ev.start}<br>${ev.end || ''}</div>` : '';
  const pts = st === 'missed' ? `<span class="neg">−${it.pts}</span>` : st === 'cancelled' || st === 'moved' ? `<span>${STATUS[st].label}</span>` : `<span class="pts">+${it.pts}</span>`;
  return `<div class="item ${st || ''} ${late ? 'late' : ''}" data-id="${ev.id}" data-date="${it.date}">
    <i class="bar-o" style="background:${ownerColor(ev.owner)}"></i>${compact ? '' : time}
    <div class="body" data-act="edit"><div class="t">${c.emoji} ${esc(ev.title)}</div>
      <div class="m">${compact && ev.start ? `<span>${ev.start}</span>` : ''}<span class="tag" style="--c:${c.color}">${esc(c.name)}</span><span>${esc(who(ev.owner).name)}</span>${pts}</div></div>
    <button class="check" data-act="outcome" aria-label="Marcar resultado">${st ? STATUS[st].icon : late ? '?' : '✓'}</button></div>`;
}

const alertHTML = () => {
  const o = openPast(); if (!o.length) return '';
  const n = o.reduce((m, x) => m + x.n, 0);
  return `<button class="insight warn alert fade" data-act="goDay" data-date="${o[o.length - 1].d}"><div class="emoji">📝</div><div><p>${n} cosa${n > 1 ? 's' : ''} de días pasados sin cerrar<small>Toca para marcar si se hizo, no se hizo o se reprogramó.</small></p></div></button>`;
};

const insightHTML = i => `<div class="insight ${i.warn ? 'warn' : ''} fade"><div class="emoji">${i.e}</div><div><p>${esc(i.m)}${i.s ? `<small>${esc(i.s)}</small>` : ''}</p></div></div>`;

function renderDay() {
  const items = itemsOn(cursor), untimed = items.filter(i => !i.ev.start), timed = items.filter(i => i.ev.start);
  const all = itemsOn(cursor, true).filter(isActive), done = all.filter(i => i.done).length;
  const ratio = all.length ? done / all.length : 0, free = freeSlots(cursor);
  return alertHTML() + insightHTML(dayInsight(cursor)) + `
  <div class="card fade"><h2>Progreso del día</h2>
    <div style="display:flex;justify-content:space-between;margin-bottom:8px"><b>${done} de ${all.length} hechas</b>${(n => `<span class="${n < 0 ? 'neg' : 'pts'}">${n === 0 ? '0' : n < 0 ? '−' + -n : '+' + n} pts</span>`)(itemsOn(cursor, true).reduce((n, i) => n + signed(i), 0))}</div>
    <div class="bar"><div style="width:${ratio * 100}%"></div></div>
    <div style="margin-top:12px;display:flex;justify-content:space-between;align-items:center;gap:12px"><span class="hint">Carga del día · ${hrs(dayLoad(cursor))}</span><div style="width:110px">${loadBar(loadRatio(cursor))}</div></div></div>
  <div class="card fade"><h2>Agenda</h2>${timed.length ? timed.map(i => itemHTML(i)).join('') : '<div class="empty">Nada con horario. Toca + para agregar.</div>'}</div>
  ${untimed.length ? `<div class="card fade"><h2>Por hacer (sin hora)</h2>${untimed.map(i => itemHTML(i)).join('')}</div>` : ''}
  <div class="card fade"><h2>Huecos libres juntos</h2>${free.length ? `<div class="free">${free.map(([a, b]) => `<span>${fromMin(a)} – ${fromMin(b)}</span>`).join('')}</div>` : '<div class="empty">No quedan huecos de 1 hora o más.</div>'}</div>`;
}

function renderWeek() {
  const ws = startOfWeek(cursor), t = todayISO();
  const days = [...Array(7)].map((_, i) => addDays(ws, i));
  return alertHTML() + insightHTML(weekInsight(ws)) + `<div class="week">${days.map(d => {
    const items = itemsOn(d), free = freeSlots(d).reduce((a, [x, y]) => a + (y - x), 0);
    return `<section class="day-card fade ${d === t ? 'today' : ''}" data-date="${d}">
      <header data-act="goDay" data-date="${d}"><span class="dn">${fmt(d, { weekday: 'short' })}<small>${parse(d).getDate()}</small></span><div style="width:54px">${loadBar(loadRatio(d))}</div></header>
      ${items.length ? items.map(i => itemHTML(i, true)).join('') : '<div class="hint" style="padding:6px 0">Libre</div>'}
      <div class="free-note">${hrs(free)} libres</div></section>`;
  }).join('')}</div>`;
}

function renderMonth() {
  const first = cursor.slice(0, 7) + '-01', gs = startOfWeek(first), t = todayISO(), m = cursor.slice(0, 7);
  const dows = ['L', 'M', 'M', 'J', 'V', 'S', 'D'];
  let cells = '';
  for (let i = 0; i < 42; i++) {
    const d = addDays(gs, i); if (i >= 35 && d.slice(0, 7) !== m) break;
    const items = itemsOn(d), owners = [...new Set(items.map(x => x.ev.owner))];
    const heat = Math.min(.35, Math.max(0, loadRatio(d) - .5) * .5);
    cells += `<div class="cell ${d.slice(0, 7) !== m ? 'out' : ''} ${d === t ? 'today' : ''}" data-act="goDay" data-date="${d}" style="--heat:${heat}">
      <span class="n">${parse(d).getDate()}</span><div class="dots">${owners.map(o => `<i style="background:${ownerColor(o)}"></i>`).join('')}</div><span class="cnt">${items.length || ''}</span></div>`;
  }
  const monthItems = []; for (let d = first; d.slice(0, 7) === m; d = addDays(d, 1)) monthItems.push(d);
  const done = monthItems.reduce((s, d) => s + itemsOn(d, true).filter(i => i.done).length, 0), tot = monthItems.reduce((s, d) => s + itemsOn(d, true).filter(isActive).length, 0);
  return `<div class="card fade"><div class="month">${dows.map(x => `<div class="dow">${x}</div>`).join('')}${cells}</div>
    <div class="legend">${['a', 'b', 'both'].map(o => `<span><i style="background:${ownerColor(o)}"></i>${esc(who(o).name)}</span>`).join('')}<span>Más rojizo = día más cargado</span></div></div>
    <div class="card fade"><h2>Cómo va el mes</h2><div style="display:flex;justify-content:space-between;margin-bottom:8px"><b>${done} de ${tot} hechas</b><span class="hint">${tot ? Math.round(done / tot * 100) : 0}%</span></div><div class="bar"><div style="width:${tot ? done / tot * 100 : 0}%"></div></div></div>`;
}

function growthHTML(ws) {
  const weeks = [3, 2, 1, 0].map(i => { const a = addDays(ws, -7 * i); return [a, addDays(a, 6)]; });
  const rows = S.areas.map(a => {
    const st = weeks.map(([f, to]) => areaStats(a.id, f, to)), cur = st[3], prev = st[2];
    const any = st.some(x => x.total || x.missed);
    return { a, st, cur, prev, any };
  }).filter(r => r.any || r.a.id !== 'otros');
  const neglected = rows.filter(r => !r.any).map(r => r.a.name);
  const hurt = rows.filter(r => r.cur.missed > 0).sort((x, y) => y.cur.missed - x.cur.missed)[0];
  const mx = Math.max(10, ...rows.flatMap(r => r.st.map(x => Math.abs(x.pts))));
  return `<div class="card fade"><h2>Crecimiento por área</h2>
    ${hurt ? `<p class="hint" style="margin:-4px 0 10px">Ojo con <b>${esc(hurt.a.name)}</b>: ${hurt.cur.missed} sin cumplir esta semana.</p>` : ''}
    ${rows.map(r => {
      const d = r.cur.pts - r.prev.pts, trend = !r.any ? '' : d > 0 ? `<span class="up">▲ ${d}</span>` : d < 0 ? `<span class="neg">▼ ${-d}</span>` : '<span>＝</span>';
      return `<div class="area-row"><div class="area-h"><span style="color:${r.a.color}">${r.a.emoji}</span> <b>${esc(r.a.name)}</b><span class="grow"></span>${trend}</div>
      <div class="area-b"><div class="spark">${r.st.map((x, i) => `<i class="${x.pts < 0 ? 'n' : ''}" style="height:${Math.max(4, Math.abs(x.pts) / mx * 100)}%;background:${x.pts < 0 ? 'var(--b)' : r.a.color};opacity:${i === 3 ? 1 : .45}"></i>`).join('')}</div>
      <small>${r.any ? `Esta semana: ${r.cur.done} hecha${r.cur.done === 1 ? '' : 's'}${r.cur.missed ? `, ${r.cur.missed} sin cumplir` : ''} · ${r.cur.pts >= 0 ? '+' : '−'}${Math.abs(r.cur.pts)} pts` : 'Sin actividad en 4 semanas'}</small></div></div>`;
    }).join('')}
    <div class="hint" style="margin-top:8px">Barras: puntos netos de las últimas 4 semanas (la última es la actual).${neglected.length ? ` Sin actividad: ${esc(neglected.join(', '))}.` : ''}</div></div>`;
}

function renderLogros() {
  const t = todayISO(), ws = startOfWeek(t), we = addDays(ws, 6), all0 = earliest();
  const A = pointsFor('a', ws, we), B = pointsFor('b', ws, we), T = teamPoints(ws, we), plan = plannedPoints(ws, we);
  const total = teamPoints(all0, t), lv = level(total);
  const person = (k, pts) => `<div class="card score fade"><div class="who"><i style="background:${ownerColor(k)}"></i>${esc(who(k).name)}</div><div class="big">${pts}</div><div class="stars">${stars(pts)}</div><small>🔥 Racha ${streak(k)} día${streak(k) === 1 ? '' : 's'}</small></div>`;
  const hist = [...Array(7)].map((_, i) => { const d = addDays(ws, i); return { d, p: teamPoints(d, d) }; }), mx = Math.max(20, ...hist.map(h => h.p));
  const allDone = itemsBetween(all0, t).filter(i => i.done).length;
  const badges = [
    ['🔥', 'Racha de 3', streak('a') >= 3 || streak('b') >= 3],
    ['🌟', 'Día completo', [...Array(7)].some((_, i) => { const d = addDays(ws, i), it = itemsOn(d, true); const a = it.filter(isActive); return d <= t && a.length && a.every(x => x.done); })],
    ['🤝', 'Hicimos algo juntos', itemsBetween(all0, t).some(i => i.done && i.ev.owner === 'both')],
    ['💯', '10 tareas hechas', allDone >= 10],
    ['🏆', '100 puntos', total >= 100],
    ['🌳', 'Nivel Árbol', total >= 700]
  ];
  return `<div class="grid2">${person('a', A)}${person('b', B)}</div>
  <div class="card fade"><h2>Esta semana · juntos</h2><div style="display:flex;justify-content:space-between;margin-bottom:8px"><b>${T < 0 ? '−' : ''}${Math.abs(T)} de ${plan} puntos</b><span class="hint">${plan ? Math.round(T / plan * 100) : 0}%</span></div><div class="bar"><div style="width:${plan ? Math.max(0, Math.min(100, T / plan * 100)) : 0}%"></div></div>
    <div class="history" style="margin-top:16px">${hist.map(h => `<div class="${h.d === t ? 'today' : ''}"><span style="height:${Math.max(0, h.p) / mx * 100}%"></span>${fmt(h.d, { weekday: 'narrow' }).toUpperCase()}</div>`).join('')}</div></div>
  ${growthHTML(ws)}
  <div class="card fade"><h2>Nivel de la pareja</h2><div style="font-size:34px">${lv.cur[2]} <b style="font-size:20px;vertical-align:middle">${lv.cur[1]}</b></div>
    <div class="bar" style="margin:10px 0 6px"><div style="width:${lv.pct * 100}%"></div></div>
    <div class="hint">${total} pts en total${lv.next ? ` · faltan ${lv.next[0] - total} para ${lv.next[2]} ${lv.next[1]}` : ' · ¡nivel máximo!'}</div></div>
  <div class="card fade"><h2>Insignias</h2><div class="badges">${badges.map(([e, n, ok]) => `<div class="badge ${ok ? '' : 'locked'}"><b>${e}</b>${n}</div>`).join('')}</div></div>`;
}

function renderAjustes() {
  return `<div class="card fade"><h2>Personas</h2>${['a', 'b'].map(k => `
    <div class="catrow"><input class="inp" data-person="${k}" value="${esc(who(k).name)}" style="flex:1">
    <div class="row" style="flex-wrap:nowrap">${PALETTE.slice(0, 5).map(c => `<button class="swatch ${who(k).color === c ? 'on' : ''}" data-act="pcolor" data-k="${k}" data-c="${c}" style="background:${c}"></button>`).join('')}</div></div>`).join('')}
    <div class="hint">El color de cada persona se usa en las líneas y puntos del calendario.</div></div>
  <div class="card fade"><h2>Áreas</h2><p class="hint" style="margin:-4px 0 10px">Una área agrupa categorías parecidas (por ejemplo Espiritual: oración, lectura bíblica, ayuno) y es lo que miden en Logros para ver dónde crecen. El color del área es el color de sus categorías.</p>
    ${S.areas.map(a => `<div class="catrow" data-area="${a.id}"><input class="inp" data-af="emoji" value="${esc(a.emoji)}" style="width:52px;text-align:center"><input class="inp" data-af="name" value="${esc(a.name)}" style="flex:1;min-width:0"><button class="swatch" data-act="acolor" style="background:${a.color}" title="Cambiar color"></button><button class="icon-btn" data-act="delarea" aria-label="Eliminar">×</button></div>`).join('')}
    <div class="actions"><button class="btn ghost" data-act="addarea">+ Nueva área</button></div></div>
  <div class="card fade"><h2>Categorías</h2><p class="hint" style="margin:-4px 0 10px">Los <b>puntos</b> son lo que suma una tarea de esa categoría al hacerla, y lo que resta si no se hace. No limitan cuántas veces la usas: eso lo decides al agregar cada cosa.</p><div id="cats">${S.cats.map(c => `
    <div class="catbox" data-cat="${c.id}"><div class="catrow"><input class="inp" data-f="emoji" value="${esc(c.emoji)}" style="width:52px;text-align:center"><input class="inp" data-f="name" value="${esc(c.name)}" style="flex:1;min-width:0"><button class="icon-btn" data-act="delcat" aria-label="Eliminar">×</button></div>
    <div class="catrow"><label class="hint" style="flex:none">Puntos</label><input class="inp" data-f="points" type="number" min="0" value="${c.points}" style="width:70px"><select class="inp" data-f="area" style="flex:1;min-width:0">${S.areas.map(a => `<option value="${a.id}" ${a.id === c.area ? 'selected' : ''}>${esc(a.emoji + ' ' + a.name)}</option>`).join('')}</select></div></div>`).join('')}</div>
    <div class="actions"><button class="btn ghost" data-act="addcat">+ Nueva categoría</button></div></div>
  <div class="card fade"><h2>Planificación</h2>
    <div class="field"><label>Límite de carga diaria: <span id="dlv">${S.settings.dayLimit}</span> h</label><input type="range" min="2" max="12" step="1" value="${S.settings.dayLimit}" id="dayLimit" style="width:100%"></div>
    <div class="row"><div class="field" style="flex:1"><label>Día empieza</label><input class="inp" type="time" id="winStart" value="${S.settings.winStart}"></div><div class="field" style="flex:1"><label>Día termina</label><input class="inp" type="time" id="winEnd" value="${S.settings.winEnd}"></div></div>
    <div class="hint">Se usan para calcular los huecos libres que tienen juntos.</div></div>
  <div class="card fade"><h2>Datos</h2>
    <p class="hint" style="margin-top:0">Por ahora los datos viven solo en este dispositivo. El siguiente paso es sincronizarlos en la nube para que Cami los vea en el suyo.</p>
    <div class="actions" style="flex-wrap:wrap"><button class="btn ghost" data-act="export">Exportar</button><button class="btn ghost" data-act="import">Importar</button><button class="btn ghost" data-act="cleardemo">Quitar ejemplos</button></div>
    <div class="actions"><button class="btn danger" data-act="reset">Borrar todo</button></div></div>`;
}

function periodTitle() {
  const v = S.ui.view;
  if (S.ui.tab === 'logros') return ['Logros', 'Su avance juntos'];
  if (S.ui.tab === 'ajustes') return ['Ajustes', 'Personaliza el espacio'];
  if (v === 'day') return [fmt(cursor, { weekday: 'long', day: 'numeric' }), fmt(cursor, { month: 'long', year: 'numeric' })];
  if (v === 'week') { const a = startOfWeek(cursor), b = addDays(a, 6); return [`${fmt(a, { day: 'numeric' })} – ${fmt(b, { day: 'numeric', month: 'short' })}`, fmt(b, { year: 'numeric' })]; }
  return [fmt(cursor, { month: 'long' }), fmt(cursor, { year: 'numeric' })];
}

function render() {
  const tab = S.ui.tab;
  $('#planTools').style.display = tab === 'plan' ? '' : 'none';
  $('.nav').style.visibility = tab === 'plan' ? 'visible' : 'hidden';
  $('#fab').style.display = tab === 'ajustes' ? 'none' : '';
  const [t, s] = periodTitle(); $('#periodTitle').textContent = t; $('#periodSub').textContent = s;
  $$('#viewSeg button').forEach(b => b.classList.toggle('on', b.dataset.view === S.ui.view));
  $$('.tabbar button').forEach(b => b.classList.toggle('on', b.dataset.tab === tab));
  $('#layers').innerHTML = ['a', 'b', 'both'].map(k => `<button class="chip ${S.ui.layer === k ? 'on' : ''}" data-act="layer" data-k="${k}" style="--c:${ownerColor(k)}"><i></i>${esc(who(k).name)}</button>`).join('');
  const y = window.scrollY;
  main.innerHTML = tab === 'logros' ? renderLogros() : tab === 'ajustes' ? renderAjustes() : S.ui.view === 'day' ? renderDay() : S.ui.view === 'week' ? renderWeek() : renderMonth();
  window.scrollTo(0, y);
}

/* ───────── hoja de edición ───────── */
const root = $('#sheetRoot');
function closeSheet() { root.innerHTML = ''; }
function openSheet(html, mount) {
  root.innerHTML = `<div class="scrim" data-act="closeSheet"></div><div class="sheet" role="dialog"><div class="grab"></div>${html}</div>`;
  mount && mount($('.sheet', root));
}

function eventSheet(ev, date) {
  const isNew = !ev;
  const dr = ev ? JSON.parse(JSON.stringify(ev)) : { id: uid(), title: '', owner: 'both', cat: S.cats[0].id, date, start: '', end: '', repeat: 'none', days: [], res: {} };
  let timed = !!dr.start;
  const draw = () => {
    const c = cat(dr.cat);
    const html = `<h3>${isNew ? 'Nuevo' : 'Editar'}</h3>
    <div class="field"><label>Título</label><input class="inp" id="f-title" placeholder="${esc(c.name)}" value="${esc(dr.title)}"></div>
    <div class="field"><label>Para</label><div class="row">${['a', 'b', 'both'].map(k => `<button class="opt ${dr.owner === k ? 'on' : ''}" style="--c:${ownerColor(k)}" data-o="${k}">${esc(who(k).name)}</button>`).join('')}</div></div>
    <div class="field"><label>Categoría</label>${S.areas.filter(a => S.cats.some(x => x.area === a.id)).map(a => `<div class="hint" style="margin:6px 0 4px">${a.emoji} ${esc(a.name)}</div><div class="row">${S.cats.filter(x => x.area === a.id).map(x => `<button class="opt ${dr.cat === x.id ? 'on' : ''}" style="--c:${a.color}" data-c="${x.id}">${x.emoji} ${esc(x.name)}</button>`).join('')}</div>`).join('')}</div>
    <div class="field"><label>Fecha</label><input class="inp" type="date" id="f-date" value="${dr.date}"></div>
    <div class="field"><label>Horario</label><div class="row"><button class="opt ${!timed ? 'on' : ''}" data-t="0">Sin hora</button><button class="opt ${timed ? 'on' : ''}" data-t="1">Con hora</button></div>
      ${timed ? `<div class="row" style="margin-top:8px"><input class="inp" type="time" id="f-start" value="${dr.start || '09:00'}"><input class="inp" type="time" id="f-end" value="${dr.end || '10:00'}"></div>` : ''}</div>
    <div class="field"><label>Repetir</label><div class="row">${[['none', 'No'], ['daily', 'Cada día'], ['weekly', 'Semanal']].map(([k, n]) => `<button class="opt ${dr.repeat === k ? 'on' : ''}" data-r="${k}">${n}</button>`).join('')}</div>
      ${dr.repeat === 'weekly' ? `<div class="row" style="margin-top:8px">${[1, 2, 3, 4, 5, 6, 0].map(n => `<button class="opt ${(dr.days || []).includes(n) ? 'on' : ''}" data-d="${n}">${'DLMMJVS'[n]}</button>`).join('')}</div>` : ''}</div>
    <div class="field"><label>Puntos (vacío = ${c.points} de la categoría)</label><input class="inp" type="number" min="0" id="f-pts" value="${dr.points ?? ''}"></div>
    <div class="actions">${isNew ? '' : '<button class="btn danger" data-del>Eliminar</button>'}<button class="btn ghost" data-act="closeSheet">Cancelar</button><button class="btn" data-save>Guardar</button></div>`;
    openSheet(html, sh => {
      const T = $('#f-title', sh);
      T.oninput = () => dr.title = T.value;
      $('#f-date', sh).onchange = e => dr.date = e.target.value || dr.date;
      const st = $('#f-start', sh), en = $('#f-end', sh);
      if (st) { st.onchange = () => dr.start = st.value; en.onchange = () => dr.end = en.value; dr.start = st.value; dr.end = en.value; }
      $('#f-pts', sh).oninput = e => dr.points = e.target.value === '' ? undefined : Math.max(0, +e.target.value);
      sh.onclick = e => {
        const b = e.target.closest('button'); if (!b) return;
        if (b.dataset.o) { dr.owner = b.dataset.o; draw(); }
        else if (b.dataset.c) { dr.cat = b.dataset.c; draw(); }
        else if (b.dataset.t) { timed = b.dataset.t === '1'; if (!timed) { dr.start = ''; dr.end = ''; } else { dr.start = dr.start || '09:00'; dr.end = dr.end || '10:00'; } draw(); }
        else if (b.dataset.r) { dr.repeat = b.dataset.r; if (dr.repeat === 'weekly' && !(dr.days || []).length) dr.days = [parse(dr.date).getDay()]; draw(); }
        else if (b.dataset.d !== undefined) { const n = +b.dataset.d, s = new Set(dr.days || []); s.has(n) ? s.delete(n) : s.add(n); dr.days = [...s]; draw(); }
        else if ('save' in b.dataset) {
          if (dr.start && dr.end && dr.end <= dr.start) { toast('La hora de fin debe ser después del inicio'); return; }
          dr.title = dr.title.trim() || cat(dr.cat).name; delete dr.demo;
          if (dr.repeat === 'weekly' && !(dr.days || []).length) dr.days = [parse(dr.date).getDay()];
          const i = S.events.findIndex(x => x.id === dr.id);
          i >= 0 ? S.events[i] = dr : S.events.push(dr);
          save(); closeSheet(); if (dr.date) cursor = dr.date, S.ui.tab = 'plan'; render(); toast(isNew ? 'Agregado ✓' : 'Guardado ✓');
        } else if ('del' in b.dataset) {
          const rm = () => { S.events = S.events.filter(x => x.id !== dr.id); save(); closeSheet(); render(); toast('Eliminado'); };
          dr.repeat !== 'none' ? confirmSheet('Esto elimina todas las repeticiones de este evento.', 'Eliminar todo', rm) : rm();
        }
      };
      if (isNew && !dr.title) setTimeout(() => T.focus(), 300);
    });
  };
  draw();
}

/* ───────── interacciones ───────── */
let toastT;
function toast(msg) { const t = $('#toast'); t.textContent = msg; t.classList.add('show'); clearTimeout(toastT); toastT = setTimeout(() => t.classList.remove('show'), 2200); }

function flyStar(el) {
  const r = el.getBoundingClientRect(), s = document.createElement('div');
  s.className = 'star-fly'; s.textContent = '⭐'; s.style.left = r.left + 'px'; s.style.top = r.top + 'px'; s.style.setProperty('--dx', (Math.random() * 40 - 20) + 'px');
  document.body.appendChild(s); setTimeout(() => s.remove(), 950);
}

function confirmSheet(msg, yes, fn) {
  openSheet(`<h3>${esc(msg)}</h3><div class="actions"><button class="btn ghost" data-act="closeSheet">Cancelar</button><button class="btn danger2" data-yes>${esc(yes)}</button></div>`, sh => { $('[data-yes]', sh).onclick = () => { closeSheet(); fn(); }; });
}

const fmtPts = n => `${n < 0 ? '−' : '+'}${Math.abs(n)}`;

function setOutcome(ev, date, status, newDate, btn) {
  const pts = ev.points ?? cat(ev.cat).points ?? 10;
  ev.res = ev.res || {}; ev.copies = ev.copies || {};
  if (ev.copies[date]) { S.events = S.events.filter(e => e.id !== ev.copies[date]); delete ev.copies[date]; }
  if (!status) delete ev.res[date]; else ev.res[date] = status;
  if (status === 'moved') {
    const copy = { ...ev, id: uid(), date: newDate, repeat: 'none', days: [], until: undefined, res: {}, copies: {}, demo: false, movedFrom: date };
    S.events.push(copy); ev.copies[date] = copy.id;
  }
  save(); closeSheet();
  if (status === 'done') {
    btn && flyStar(btn);
    const items = itemsOn(date, true).filter(isActive);
    toast(items.length > 1 && items.every(i => i.done) ? '🌟 ¡Día completo! Muy bien' : `+${pts} pts · ${PHRASES[Math.floor(Math.random() * PHRASES.length)]}`);
  } else if (status === 'missed') toast(`−${pts} pts · Se anota. Mañana se retoma 🌿`);
  else if (status === 'cancelled') toast('Sin puntos: no se concretó');
  else if (status === 'moved') toast(`Reprogramado para el ${fmt(newDate, { day: 'numeric', month: 'long' })}`);
  render();
}

function outcomeSheet(id, date, btn) {
  const ev = S.events.find(e => e.id === id); if (!ev) return;
  const pts = ev.points ?? cat(ev.cat).points ?? 10, cur = ev.res && ev.res[date];
  let moving = false, nd = addDays(date > todayISO() ? date : todayISO(), 1);
  const draw = () => {
    openSheet(`<h3>${cat(ev.cat).emoji} ${esc(ev.title)}</h3><p class="hint" style="margin:-8px 0 14px">${fmt(date, { weekday: 'long', day: 'numeric', month: 'long' })}${ev.start ? ' · ' + ev.start : ''}</p>
    <div class="outcomes">
      <button class="out ok ${cur === 'done' ? 'on' : ''}" data-s="done"><b>✓ Lo hice</b><small>${fmtPts(pts)} pts</small></button>
      <button class="out no ${cur === 'missed' ? 'on' : ''}" data-s="missed"><b>✕ No lo hice</b><small>${fmtPts(-pts)} pts</small></button>
      <button class="out zero ${cur === 'cancelled' ? 'on' : ''}" data-s="cancelled"><b>⊘ No se concretó</b><small>0 pts · no dependió de nosotros</small></button>
      <button class="out mv ${cur === 'moved' ? 'on' : ''}" data-s="moving"><b>↻ Reprogramar</b><small>0 pts · pasa a otro día</small></button>
    </div>
    ${moving ? `<div class="field" style="margin-top:12px"><label>Nueva fecha</label><div class="row"><input class="inp" type="date" id="f-nd" value="${nd}"><button class="btn" data-s="moved" style="flex:none">Reprogramar</button></div></div>` : ''}
    <div class="actions" style="margin-top:14px">${cur ? '<button class="btn ghost" data-s="clear">Quitar marca</button>' : ''}<button class="btn ghost" data-act="closeSheet">Cerrar</button></div>`, sh => {
      const f = $('#f-nd', sh); if (f) f.onchange = () => { nd = f.value || nd; };
      sh.onclick = e => {
        const b = e.target.closest('[data-s]'); if (!b) return;
        const k = b.dataset.s;
        if (k === 'moving') { moving = true; draw(); }
        else if (k === 'clear') setOutcome(ev, date, null);
        else if (k === 'moved') { if (!nd || nd === date) return toast('Elige otra fecha'); setOutcome(ev, date, 'moved', nd); }
        else setOutcome(ev, date, k, null, btn);
      };
    });
  };
  draw();
}

function move(dir) {
  const v = S.ui.view;
  if (v === 'day') cursor = addDays(cursor, dir);
  else if (v === 'week') cursor = addDays(cursor, 7 * dir);
  else { const d = parse(cursor); d.setDate(1); d.setMonth(d.getMonth() + dir); cursor = iso(d); }
  render();
}

const actions = {
  prev: () => move(-1), next: () => move(1),
  today: () => { cursor = todayISO(); render(); },
  add: () => eventSheet(null, S.ui.view === 'month' || S.ui.tab !== 'plan' ? todayISO() : S.ui.view === 'week' && !(cursor >= startOfWeek(todayISO()) && cursor <= addDays(startOfWeek(todayISO()), 6)) ? startOfWeek(cursor) : (S.ui.view === 'week' ? todayISO() : cursor)),
  closeSheet,
  layer: el => { S.ui.layer = el.dataset.k; save(); render(); },
  goDay: el => { cursor = el.dataset.date; S.ui.view = 'day'; save(); render(); window.scrollTo(0, 0); },
  edit: el => { const it = el.closest('.item'); const ev = S.events.find(e => e.id === it.dataset.id); ev && eventSheet(ev, it.dataset.date); },
  outcome: el => { const it = el.closest('.item'); outcomeSheet(it.dataset.id, it.dataset.date, el); },
  pcolor: el => { S.people[el.dataset.k].color = el.dataset.c; save(); render(); },
  acolor: el => { const a = area(el.closest('[data-area]').dataset.area), i = PALETTE.indexOf(a.color); a.color = PALETTE[(i + 1) % PALETTE.length]; save(); render(); },
  addarea: () => { S.areas.splice(S.areas.length - 1, 0, { id: 'a' + uid(), name: 'Nueva área', emoji: '⭐', color: PALETTE[S.areas.length % PALETTE.length] }); save(); render(); },
  delarea: el => { const id = el.closest('[data-area]').dataset.area; if (id === 'otros') return toast('El área Otros no se puede eliminar'); if (S.cats.some(c => c.area === id)) return toast('Mueve sus categorías a otra área primero'); S.areas = S.areas.filter(a => a.id !== id); save(); render(); },
  delcat: el => { const id = el.closest('[data-cat]').dataset.cat; if (S.cats.length <= 1) return toast('Debe quedar al menos una categoría'); const rm = () => { S.cats = S.cats.filter(c => c.id !== id); save(); render(); }; S.events.some(e => e.cat === id) ? confirmSheet('Hay eventos con esta categoría. Se mostrarán como "Otro".', 'Eliminar', rm) : rm(); },
  addcat: () => { S.cats.push({ id: 'c' + uid(), name: 'Nueva', emoji: '✨', area: 'otros', points: 10 }); save(); render(); },
  cleardemo: () => { S.events = S.events.filter(e => !e.demo); save(); render(); toast('Ejemplos eliminados'); },
  reset: () => confirmSheet('¿Borrar todos los datos de este dispositivo?', 'Borrar todo', () => { S = defaultState(); S.events = []; save(); render(); toast('Todo borrado'); }),
  export: () => { const a = document.createElement('a'); a.href = URL.createObjectURL(new Blob([JSON.stringify(S, null, 2)], { type: 'application/json' })); a.download = `familia-${todayISO()}.json`; a.click(); },
  import: () => { const i = document.createElement('input'); i.type = 'file'; i.accept = 'application/json'; i.onchange = async () => { try { const d = JSON.parse(await i.files[0].text()); if (!d.events || !d.cats) throw 0; S = d; save(); render(); toast('Importado ✓'); } catch { toast('Archivo no válido'); } }; i.click(); }
};

document.addEventListener('click', e => {
  const el = e.target.closest('[data-act]'); if (el && actions[el.dataset.act]) { e.stopPropagation(); actions[el.dataset.act](el); return; }
  const v = e.target.closest('#viewSeg button'); if (v) { S.ui.view = v.dataset.view; save(); render(); return; }
  const t = e.target.closest('.tabbar button'); if (t) { S.ui.tab = t.dataset.tab; save(); render(); window.scrollTo(0, 0); }
});

document.addEventListener('change', e => {
  const p = e.target.dataset.person; if (p) { S.people[p].name = e.target.value.trim() || S.people[p].name; save(); render(); return; }
  const box = e.target.closest('[data-cat]');
  if (box && e.target.dataset.f) { const c = S.cats.find(x => x.id === box.dataset.cat), f = e.target.dataset.f; c[f] = f === 'points' ? Math.max(0, +e.target.value || 0) : e.target.value; save(); render(); return; }
  const arow = e.target.closest('[data-area]');
  if (arow && e.target.dataset.af) { const a = area(arow.dataset.area); a[e.target.dataset.af] = e.target.value.trim() || a[e.target.dataset.af]; save(); render(); return; }
  if (e.target.id === 'dayLimit') { S.settings.dayLimit = +e.target.value; save(); render(); }
  if (e.target.id === 'winStart' || e.target.id === 'winEnd') { S.settings[e.target.id] = e.target.value; save(); render(); }
});
document.addEventListener('input', e => { if (e.target.id === 'dayLimit') $('#dlv').textContent = e.target.value; });
document.addEventListener('keydown', e => { if (e.key === 'Escape') closeSheet(); });

// swipe horizontal para cambiar de período
let sx = null;
main.addEventListener('touchstart', e => { sx = e.touches.length === 1 ? e.touches[0].clientX : null; }, { passive: true });
main.addEventListener('touchend', e => {
  if (sx === null || S.ui.tab !== 'plan' || root.children.length) return;
  const dx = e.changedTouches[0].clientX - sx; sx = null;
  if (Math.abs(dx) > 70) move(dx < 0 ? 1 : -1);
});

render();
save();
if ('serviceWorker' in navigator && location.protocol.startsWith('http')) navigator.serviceWorker.register('sw.js').catch(() => {});
})();
