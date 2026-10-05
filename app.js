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

const defaultCats = () => [
  { id: 'comida', name: 'Comida', emoji: '🍽️', color: '#D9A441', points: 10 },
  { id: 'orden', name: 'Orden depto', emoji: '🧹', color: '#8AA07C', points: 10 },
  { id: 'ejercicio', name: 'Ejercicio', emoji: '💪', color: '#C47F7A', points: 20 },
  { id: 'reunion', name: 'Reunión', emoji: '💼', color: '#6E8CA8', points: 10 },
  { id: 'grabacion', name: 'Grabación Ahava', emoji: '🎬', color: '#9B86B0', points: 20 },
  { id: 'oracion', name: 'Oración', emoji: '🙏', color: '#B8A38A', points: 10 },
  { id: 'proyecto', name: 'Proyecto personal', emoji: '🌱', color: '#6FA3A0', points: 15 },
  { id: 'compras', name: 'Compras', emoji: '🛒', color: '#C8956B', points: 5 },
  { id: 'salida', name: 'Salida', emoji: '🥂', color: '#C47F7A', points: 5 }
];

function seedEvents() {
  const ws = startOfWeek(todayISO());
  const d = n => addDays(ws, n);
  const E = (title, owner, cat, date, start, end, extra = {}) => ({ id: uid(), title, owner, cat, date, start, end, repeat: 'none', demo: true, done: {}, ...extra });
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
  version: 1,
  people: { a: { name: 'Daniel', color: '#6E8CA8' }, b: { name: 'Cami', color: '#C47F7A' }, both: { name: 'Juntos', color: '#8AA07C' } },
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
let cursor = todayISO();
const save = () => Store.save(S);

const cat = id => S.cats.find(c => c.id === id) || { id, name: 'Otro', emoji: '•', color: '#B8A38A', points: 10 };
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
    out.push({ ev, date: d, done: !!(ev.done && ev.done[d]), pts: ev.points ?? cat(ev.cat).points ?? 10 });
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
const doneItems = (from, to) => {
  const out = [];
  for (let d = from; d <= to; d = addDays(d, 1)) itemsOn(d, true).forEach(it => it.done && out.push(it));
  return out;
};
const earliest = () => S.events.reduce((m, e) => (e.date < m ? e.date : m), todayISO());

function pointsFor(person, from, to) {
  return doneItems(from, to).filter(it => it.ev.owner === person || it.ev.owner === 'both').reduce((s, it) => s + it.pts, 0);
}
const teamPoints = (from, to) => doneItems(from, to).reduce((s, it) => s + it.pts, 0);
const plannedPoints = (from, to) => { let s = 0; for (let d = from; d <= to; d = addDays(d, 1)) s += itemsOn(d, true).reduce((a, it) => a + it.pts, 0); return s; };

function streak(person) {
  let d = todayISO(), n = 0;
  const has = x => itemsOn(x, true).some(it => it.done && (it.ev.owner === person || it.ev.owner === 'both'));
  if (!has(d)) d = addDays(d, -1);
  while (n < 365 && has(d)) { n++; d = addDays(d, -1); }
  return n;
}

const LEVELS = [[0, 'Semilla', '🌱'], [100, 'Brote', '🌿'], [300, 'Planta', '🪴'], [700, 'Árbol', '🌳'], [1500, 'Bosque', '🌲'], [3000, 'Jardín', '🌸']];
function level(total) {
  let i = 0; LEVELS.forEach((l, k) => { if (total >= l[0]) i = k; });
  const next = LEVELS[i + 1];
  return { cur: LEVELS[i], next, pct: next ? (total - LEVELS[i][0]) / (next[0] - LEVELS[i][0]) : 1 };
}
const stars = pts => '★'.repeat(Math.min(5, Math.floor(pts / 50))) + '☆'.repeat(Math.max(0, 5 - Math.floor(pts / 50)));

function dayInsight(d) {
  const t = todayISO(), items = itemsOn(d, true), total = items.length, done = items.filter(i => i.done).length;
  const ratio = loadRatio(d), lim = S.settings.dayLimit;
  if (d > t || (d === t && done === 0)) {
    if (total === 0) return { e: '🌤️', m: 'Día libre', s: 'Buen momento para planificar algo juntos.' };
    if (ratio > 1) return { e: '🌊', m: `Día muy cargado (${hrs(dayLoad(d))})`, s: 'Dosifiquen: ¿se puede mover algo a otro día?', warn: 1 };
    if (ratio > .75) return { e: '⚖️', m: 'Día bastante lleno', s: `Cerca del límite de ${lim} h. Dejen un respiro.`, warn: 1 };
    if (d === t) return { e: '☀️', m: `Hoy hay ${total} cosa${total > 1 ? 's' : ''} en el plan`, s: 'Empiecen por lo más simple para tomar ritmo.' };
    return { e: '🗓️', m: `${total} cosa${total > 1 ? 's' : ''} planificada${total > 1 ? 's' : ''}`, s: 'Se ve manejable.' };
  }
  if (total === 0) return { e: '🌤️', m: 'Día sin registros', s: '' };
  if (done === total) return { e: '🌟', m: '¡Día completo!', s: `Sumaron ${items.reduce((s, i) => s + i.pts, 0)} puntos. Así se hace.` };
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

function itemHTML(it, compact) {
  const { ev } = it, c = cat(ev.cat);
  const time = ev.start ? `<div class="time">${ev.start}<br>${ev.end || ''}</div>` : '';
  return `<div class="item ${it.done ? 'done' : ''}" data-id="${ev.id}" data-date="${it.date}">
    <i class="bar-o" style="background:${ownerColor(ev.owner)}"></i>${compact ? '' : time}
    <div class="body" data-act="edit"><div class="t">${c.emoji} ${esc(ev.title)}</div>
      <div class="m">${compact && ev.start ? `<span>${ev.start}</span>` : ''}<span class="tag" style="--c:${c.color}">${esc(c.name)}</span><span>${esc(who(ev.owner).name)}</span><span class="pts">+${it.pts}</span></div></div>
    <button class="check" data-act="toggle" aria-label="Completar">✓</button></div>`;
}

const insightHTML = i => `<div class="insight ${i.warn ? 'warn' : ''} fade"><div class="emoji">${i.e}</div><div><p>${esc(i.m)}${i.s ? `<small>${esc(i.s)}</small>` : ''}</p></div></div>`;

function renderDay() {
  const items = itemsOn(cursor), untimed = items.filter(i => !i.ev.start), timed = items.filter(i => i.ev.start);
  const all = itemsOn(cursor, true), done = all.filter(i => i.done).length;
  const ratio = all.length ? done / all.length : 0, free = freeSlots(cursor);
  return insightHTML(dayInsight(cursor)) + `
  <div class="card fade"><h2>Progreso del día</h2>
    <div style="display:flex;justify-content:space-between;margin-bottom:8px"><b>${done} de ${all.length} hechas</b><span class="pts">+${all.filter(i => i.done).reduce((s, i) => s + i.pts, 0)} pts</span></div>
    <div class="bar"><div style="width:${ratio * 100}%"></div></div>
    <div style="margin-top:12px;display:flex;justify-content:space-between;align-items:center;gap:12px"><span class="hint">Carga del día · ${hrs(dayLoad(cursor))}</span><div style="width:110px">${loadBar(loadRatio(cursor))}</div></div></div>
  <div class="card fade"><h2>Agenda</h2>${timed.length ? timed.map(i => itemHTML(i)).join('') : '<div class="empty">Nada con horario. Toca + para agregar.</div>'}</div>
  ${untimed.length ? `<div class="card fade"><h2>Por hacer (sin hora)</h2>${untimed.map(i => itemHTML(i)).join('')}</div>` : ''}
  <div class="card fade"><h2>Huecos libres juntos</h2>${free.length ? `<div class="free">${free.map(([a, b]) => `<span>${fromMin(a)} – ${fromMin(b)}</span>`).join('')}</div>` : '<div class="empty">No quedan huecos de 1 hora o más.</div>'}</div>`;
}

function renderWeek() {
  const ws = startOfWeek(cursor), t = todayISO();
  const days = [...Array(7)].map((_, i) => addDays(ws, i));
  return insightHTML(weekInsight(ws)) + `<div class="week">${days.map(d => {
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
  const done = monthItems.reduce((s, d) => s + itemsOn(d, true).filter(i => i.done).length, 0), tot = monthItems.reduce((s, d) => s + itemsOn(d, true).length, 0);
  return `<div class="card fade"><div class="month">${dows.map(x => `<div class="dow">${x}</div>`).join('')}${cells}</div>
    <div class="legend">${['a', 'b', 'both'].map(o => `<span><i style="background:${ownerColor(o)}"></i>${esc(who(o).name)}</span>`).join('')}<span>Más rojizo = día más cargado</span></div></div>
    <div class="card fade"><h2>Cómo va el mes</h2><div style="display:flex;justify-content:space-between;margin-bottom:8px"><b>${done} de ${tot} hechas</b><span class="hint">${tot ? Math.round(done / tot * 100) : 0}%</span></div><div class="bar"><div style="width:${tot ? done / tot * 100 : 0}%"></div></div></div>`;
}

function renderLogros() {
  const t = todayISO(), ws = startOfWeek(t), we = addDays(ws, 6), all0 = earliest();
  const A = pointsFor('a', ws, we), B = pointsFor('b', ws, we), T = teamPoints(ws, we), plan = plannedPoints(ws, we);
  const total = teamPoints(all0, t), lv = level(total);
  const person = (k, pts) => `<div class="card score fade"><div class="who"><i style="background:${ownerColor(k)}"></i>${esc(who(k).name)}</div><div class="big">${pts}</div><div class="stars">${stars(pts)}</div><small>🔥 Racha ${streak(k)} día${streak(k) === 1 ? '' : 's'}</small></div>`;
  const hist = [...Array(7)].map((_, i) => { const d = addDays(ws, i); return { d, p: teamPoints(d, d) }; }), mx = Math.max(20, ...hist.map(h => h.p));
  const allDone = doneItems(all0, t).length;
  const badges = [
    ['🔥', 'Racha de 3', streak('a') >= 3 || streak('b') >= 3],
    ['🌟', 'Día completo', [...Array(7)].some((_, i) => { const d = addDays(ws, i), it = itemsOn(d, true); return d <= t && it.length && it.every(x => x.done); })],
    ['🤝', 'Hicimos algo juntos', doneItems(all0, t).some(i => i.ev.owner === 'both')],
    ['💯', '10 tareas hechas', allDone >= 10],
    ['🏆', '100 puntos', total >= 100],
    ['🌳', 'Nivel Árbol', total >= 700]
  ];
  return `<div class="grid2">${person('a', A)}${person('b', B)}</div>
  <div class="card fade"><h2>Esta semana · juntos</h2><div style="display:flex;justify-content:space-between;margin-bottom:8px"><b>${T} de ${plan} puntos</b><span class="hint">${plan ? Math.round(T / plan * 100) : 0}%</span></div><div class="bar"><div style="width:${plan ? Math.min(100, T / plan * 100) : 0}%"></div></div>
    <div class="history" style="margin-top:16px">${hist.map(h => `<div class="${h.d === t ? 'today' : ''}"><span style="height:${h.p / mx * 100}%"></span>${fmt(h.d, { weekday: 'narrow' }).toUpperCase()}</div>`).join('')}</div></div>
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
  <div class="card fade"><h2>Categorías</h2><p class="hint" style="margin:-4px 0 10px">El número son los <b>puntos</b> que suma cada tarea de esa categoría al completarla. No limita cuántas veces la usas: eso lo decides al agregar cada cosa al calendario.</p><div class="catrow hint" style="margin:0 0 4px"><span style="width:52px;text-align:center">Emoji</span><span style="flex:1">Nombre</span><span style="width:62px">Puntos</span><span style="width:26px"></span><span style="width:34px"></span></div><div id="cats">${S.cats.map(c => `
    <div class="catrow" data-cat="${c.id}"><input class="inp" data-f="emoji" value="${esc(c.emoji)}" style="width:52px;text-align:center">
    <input class="inp" data-f="name" value="${esc(c.name)}" style="flex:1;min-width:0"><input class="inp" data-f="points" type="number" min="0" value="${c.points}" style="width:62px" title="Puntos que suma cada vez que completas una tarea de esta categoría">
    <button class="swatch" data-act="ccolor" style="background:${c.color}" title="Cambiar color"></button>
    <button class="icon-btn" data-act="delcat" aria-label="Eliminar">×</button></div>`).join('')}</div>
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
  const dr = ev ? JSON.parse(JSON.stringify(ev)) : { id: uid(), title: '', owner: 'both', cat: S.cats[0].id, date, start: '', end: '', repeat: 'none', days: [], done: {} };
  let timed = !!dr.start;
  const draw = () => {
    const c = cat(dr.cat);
    const html = `<h3>${isNew ? 'Nuevo' : 'Editar'}</h3>
    <div class="field"><label>Título</label><input class="inp" id="f-title" placeholder="${esc(c.name)}" value="${esc(dr.title)}"></div>
    <div class="field"><label>Para</label><div class="row">${['a', 'b', 'both'].map(k => `<button class="opt ${dr.owner === k ? 'on' : ''}" style="--c:${ownerColor(k)}" data-o="${k}">${esc(who(k).name)}</button>`).join('')}</div></div>
    <div class="field"><label>Categoría</label><div class="row">${S.cats.map(x => `<button class="opt ${dr.cat === x.id ? 'on' : ''}" style="--c:${x.color}" data-c="${x.id}">${x.emoji} ${esc(x.name)}</button>`).join('')}</div></div>
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
          if (dr.repeat !== 'none' ? confirm('Esto elimina todas las repeticiones. ¿Continuar?') : true) { S.events = S.events.filter(x => x.id !== dr.id); save(); closeSheet(); render(); toast('Eliminado'); }
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

function toggleDone(id, date, btn) {
  const ev = S.events.find(e => e.id === id); if (!ev) return;
  ev.done = ev.done || {};
  const now = !ev.done[date];
  now ? ev.done[date] = true : delete ev.done[date];
  save();
  if (now) {
    flyStar(btn);
    const items = itemsOn(date, true), all = items.every(i => i.done);
    toast(all && items.length > 1 ? '🌟 ¡Día completo! Muy bien' : `+${ev.points ?? cat(ev.cat).points} pts · ${PHRASES[Math.floor(Math.random() * PHRASES.length)]}`);
  }
  render();
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
  toggle: el => { const it = el.closest('.item'); toggleDone(it.dataset.id, it.dataset.date, el); },
  pcolor: el => { S.people[el.dataset.k].color = el.dataset.c; save(); render(); },
  ccolor: el => { const c = cat(el.closest('.catrow').dataset.cat), i = PALETTE.indexOf(c.color); c.color = PALETTE[(i + 1) % PALETTE.length]; save(); render(); },
  delcat: el => { const id = el.closest('.catrow').dataset.cat; if (S.cats.length <= 1) return toast('Debe quedar al menos una categoría'); if (S.events.some(e => e.cat === id) && !confirm('Hay eventos con esta categoría. Se mostrarán como "Otro". ¿Eliminar?')) return; S.cats = S.cats.filter(c => c.id !== id); save(); render(); },
  addcat: () => { S.cats.push({ id: 'c' + uid(), name: 'Nueva', emoji: '✨', color: PALETTE[S.cats.length % PALETTE.length], points: 10 }); save(); render(); },
  cleardemo: () => { S.events = S.events.filter(e => !e.demo); save(); render(); toast('Ejemplos eliminados'); },
  reset: () => { if (confirm('¿Borrar TODOS los datos de este dispositivo?')) { S = defaultState(); S.events = []; save(); render(); toast('Todo borrado'); } },
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
  const row = e.target.closest('.catrow[data-cat]');
  if (row && e.target.dataset.f) { const c = cat(row.dataset.cat), f = e.target.dataset.f; c[f] = f === 'points' ? Math.max(0, +e.target.value || 0) : e.target.value; save(); render(); return; }
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
