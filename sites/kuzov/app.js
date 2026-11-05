/* Кузов: укладка (extreme points, Web Worker), изометрия на canvas, оси, лист для грузчиков */
(() => {
'use strict';
const $ = (s, r = document) => r.querySelector(s), $$ = (s, r = document) => [...r.querySelectorAll(s)], on = (el, ev, fn, o) => el.addEventListener(ev, fn, o), raf = requestAnimationFrame;
const RM = matchMedia('(prefers-reduced-motion: reduce)').matches, MQ_S = matchMedia('(max-width:900px)'), MQ_M = matchMedia('(max-width:640px)');
const clamp = (v, a, b) => Math.max(a, Math.min(b, v)), lerp = (a, b, t) => a + (b - a) * t, easeOut = t => 1 - Math.pow(1 - t, 3);
const fmt = n => String(Math.round(n)).replace(/\B(?=(\d{3})+(?!\d))/g, ' '), fmt1 = n => n.toFixed(1).replace('.', ',');
const esc = s => String(s).replace(/[&<>"]/g, c => `&#${c.charCodeAt(0)};`);
const plural = (n, a, b, c) => { const m = n % 10, k = n % 100; return k > 10 && k < 20 ? c : m === 1 ? a : m >= 2 && m <= 4 ? b : c; };
const places = n => `${n} ${plural(n, 'место', 'места', 'мест')}`, dims = b => `${fmt(b.L)} × ${fmt(b.W)} × ${fmt(b.H)} мм`;
const C = { bg: '#0E2A5C', panel: '#081A3A', line: '#8FD3FF', orange: '#FF7A1A', text: '#F4F7FB', green: '#5BE38A', red: '#FF4D4D', yellow: '#FFC857' };
const CARGO = ['#5CC8FF','#FFC857','#9BE564','#C792EA','#FF9E7A'],MONO = '"JetBrains Mono",monospace',M11 = `500 11px ${MONO}`;
const shade = (hex, k) => { const n = parseInt(hex.slice(1), 16), f = v => Math.round(v * (1 - k)); return `rgb(${f(n >> 16)},${f(n >> 8 & 255)},${f(n & 255)})`; };
const LIGHT = { line: '#1D4E9C', bg: '#fff', text: '#000' }; let PAL = C; // LIGHT — печать
const txt = (ctx, f, col, al = 'left', bl = 'top') => { ctx.font = f; ctx.fillStyle = col; ctx.textAlign = al; ctx.textBaseline = bl; };
let toastT; const toast = msg => { const t = $('#toast'); t.textContent = msg; t.classList.add('show'); clearTimeout(toastT); toastT = setTimeout(() => t.classList.remove('show'), 2800); };
const goDemo = () => $('#demo').scrollIntoView();
const download = (name, href) => { const a = document.createElement('a'); a.download = name; a.href = href; a.click(); if (href.startsWith('blob:')) setTimeout(() => URL.revokeObjectURL(href), 1000); };

// --- reveal + count-up
function countUp(root) { $$('[data-count]', root).forEach(el => { if (el.dataset.done) return; el.dataset.done = 1; if (RM) return; const to = +el.dataset.count, t0 = performance.now(); const f = now => { const t = clamp((now - t0) / 600, 0, 1); el.textContent = fmt(to * easeOut(t)); if (t < 1) raf(f); }; raf(f); }); }
const revealAll = () => { const h = innerHeight; $$('.reveal:not(.in)').forEach(el => { if (el.getBoundingClientRect().top < h * .92) { el.classList.add('in'); countUp(el); } }); };
on(window, 'scroll', revealAll, { passive: true }); on(window, 'resize', revealAll); revealAll(); setTimeout(revealAll, 400);

// --- данные: мм, кг; оси в м от передней стенки, лимиты — упрощённая доля груза на ось
const T = (n, l, w, h, kg, st, ti) => ({ n, l, w, h, kg, st, ti }), B = (id, n, L, W, H, kg, xf, xr, lf, lr) => ({ id, n, L, W, H, kg, xf, xr, lf, lr });
const TYPES = [T('Европаллета 1200×800',1200,800,1450,600,0,0),T('Коробка 600×400',600,400,400,12,1,1),T('Бочка 585×585',585,585,880,220,1,0),T('Диван 2200×900',2200,900,850,90,0,0),T('Рулон 1000×1000',1000,1000,1200,400,0,0),T('Мешок 800×500',800,500,200,50,1,1)];
const BODIES = [B('gazel','Газель',3000,1800,1800,1500,-1,2.1,900,1400),B('t5','5-тонник',6000,2400,2400,5000,-1.2,4.3,2200,4500),B('euro','Еврофура',13600,2450,2700,20000,1.5,10.5,10000,24000),B('c20','Контейнер 20′',5900,2350,2390,21700,.4,5.2,12000,18000),B('c40','Контейнер 40′',12030,2350,2390,26500,1.2,9.8,14000,24000),B('custom','Свой кузов',8000,2400,2500,10000,1,6.5,6000,10000)];
const mk = (t, qty, col = t % 5, o) => Object.assign({}, TYPES[t], { qty, col }, o);

// --- укладка: extreme points (функции уходят в Web Worker)
function pack(items, body, gap, flip) {
 const g = gap || 0, L = body.L, W = body.W, H = body.H, units = [];
 items.forEach((it, t) => { for (let k = 0; k < it.qty; k++) units.push({ t, l: it.l, w: it.w, h: it.h, kg: it.kg, st: it.st, ti: it.ti, v: it.l * it.w * it.h }); });
 units.sort((a, b) => a.st - b.st || b.kg - a.kg || b.v - a.v); // нештабелируемые и тяжёлые первыми
 const placed = [], left = {}, noFit = {}; let eps = [[0, 0, 0]], mass = 0, vol = 0;
 const inside = (e, p) => e[0] >= p.x && e[0] < p.x + p.le && e[1] >= p.y && e[1] < p.y + p.we && e[2] >= p.z && e[2] < p.z + p.h;
 for (const u of units) {
  const key = [u.l, u.w, u.h, u.st, u.ti].join();
  if (mass + u.kg > body.kg || noFit[key]) { left[u.t] = (left[u.t] || 0) + 1; continue; }
  const ors = [[u.l, u.w, u.h], [u.w, u.l, u.h]]; // 2 поворота, при кантовании 6; flip — обратный порядок
  if (u.ti) ors.push([u.l, u.h, u.w], [u.h, u.l, u.w], [u.w, u.h, u.l], [u.h, u.w, u.l]);
  if (flip) ors.reverse();
  let b = null;
  search: for (const e of eps) {
   const x = e[0], y = e[1], z = e[2];
   for (const o of ors) {
    const l = o[0], w = o[1], h = o[2];
    if (x + l > L || y + w > W || z + h > H) continue;
    const le = l + g, we = w + g; let ok = true, sup = z === 0 ? 1 : 0;
    for (const p of placed) {
     if (z < p.z + p.h && z + h > p.z && x < p.x + p.le && x + le > p.x && y < p.y + p.we && y + we > p.y) { ok = false; break; }
     if (z > 0 && p.st && Math.abs(p.z + p.h - z) < 1) { const ox = Math.min(x + l, p.x + p.l) - Math.max(x, p.x), oy = Math.min(y + w, p.y + p.w) - Math.max(y, p.y); if (ox > 0 && oy > 0) sup += ox * oy / (l * w); }
    }
    if (!ok || sup < .7) continue; // опора ≥ 70% основания
    b = { x, y, z, l, w, h, le, we }; break search;
   }
  }
  if (!b) { noFit[key] = 1; left[u.t] = (left[u.t] || 0) + 1; continue; }
  const p = Object.assign(b, { t: u.t, kg: u.kg, st: u.st, step: placed.length + 1 });
  placed.push(p); mass += u.kg; vol += u.v;
  eps = eps.filter(e => !inside(e, p));
  const cand = [[p.x + p.le, p.y, p.z], [p.x, p.y + p.we, p.z]]; if (p.st) cand.push([p.x, p.y, p.z + p.h]);
  for (const c of cand) if (c[0] < L && c[1] < W && c[2] < H && !placed.some(q => inside(c, q))) eps.push(c);
  eps.sort((a, b) => a[2] - b[2] || a[0] - b[0] || a[1] - b[1]);
 }
 const xf = body.xf * 1000, xr = body.xr * 1000, dx = Math.abs(xr - xf) > 10 ? xr - xf : 0; let rear = 0; // оси: рычаг; оси совпали — поровну
 for (const p of placed) rear += dx ? p.kg * (p.x + p.l / 2 - xf) / dx : p.kg / 2;
 return { placed, left, mass, vol, fill: vol / (L * W * H) || 0, rear, front: mass - rear, n: units.length };
}
function packBest(items, body, gap) { const a = pack(items, body, gap, 0), b = pack(items, body, gap, 1); return b.placed.length > a.placed.length || b.placed.length === a.placed.length && b.vol > a.vol ? b : a; } // два прохода, лучший по числу мест
let worker = null, calcSeq = 0;
try { worker = new Worker(URL.createObjectURL(new Blob([pack.toString() + packBest.toString() + ';onmessage=e=>{const d=e.data,t=performance.now(),r=packBest(d.items,d.body,d.gap);r.ms=performance.now()-t;r.id=d.id;postMessage(r)}'], { type: 'text/javascript' }))); worker.onerror = () => { worker = null; }; } catch (e) { worker = null; }
const calc = (items, body, gap) => new Promise(res => { const id = ++calcSeq; if (!worker) { const t = performance.now(), r = packBest(items, body, gap); r.ms = performance.now() - t; r.id = id; return res(r); } worker.onmessage = e => { if (e.data.id === id) res(e.data); }; worker.postMessage({ items, body, gap, id }); });

// --- проекция и отрисовка
function proj(view, ang, s, ox, oy) { const k = s / 1000, c = Math.cos(ang * Math.PI / 180) * k, sn = Math.sin(ang * Math.PI / 180) * k; return view === 'top' ? (x, y) => [ox + x * k, oy + y * k] : view === 'side' ? (x, y, z) => [ox + x * k, oy - z * k] : (x, y, z) => [ox + (x - y) * c, oy + (x + y) * sn - z * k]; }
const corners = b => [[0,0,0],[b.L,0,0],[b.L,b.W,0],[0,b.W,0],[0,0,b.H],[b.L,0,b.H],[b.L,b.W,b.H],[0,b.W,b.H]];
const EDGES = [[0,1],[1,2],[2,3],[3,0],[4,5],[5,6],[6,7],[7,4],[0,4],[1,5],[2,6],[3,7]], NEAR = [1, 2, 5, 6, 10];
function fitView(body, view, ang, r, pad, zoom = 1, pan = { x: 0, y: 0 }) {
 const P0 = proj(view, ang, 1000, 0, 0); let x0 = 1e9, y0 = 1e9, x1 = -1e9, y1 = -1e9;
 corners(body).forEach(c => { const [x, y] = P0(c[0], view === 'side' ? 0 : c[1], view === 'top' ? 0 : c[2]); x0 = Math.min(x0, x); y0 = Math.min(y0, y); x1 = Math.max(x1, x); y1 = Math.max(y1, y); });
 const s = Math.min((r.w - pad * 2) / (x1 - x0), (r.h - pad * 2) / (y1 - y0)) * 1000 * zoom, k = s / 1000;
 return { P: proj(view, ang, s, r.x + r.w / 2 - (x0 + x1) / 2 * k + pan.x, r.y + r.h / 2 - (y0 + y1) / 2 * k + pan.y), s };
}
const line = (ctx, a, b) => { ctx.beginPath(); ctx.moveTo(a[0], a[1]); ctx.lineTo(b[0], b[1]); ctx.stroke(); };
const poly = (ctx, pts, fill, stroke) => { ctx.beginPath(); pts.forEach((p, i) => i ? ctx.lineTo(p[0], p[1]) : ctx.moveTo(p[0], p[1])); ctx.closePath(); if (fill) { ctx.fillStyle = fill; ctx.fill(); } if (stroke) { ctx.strokeStyle = stroke; ctx.stroke(); } };
function grid(ctx, w, h) { ctx.strokeStyle = 'rgba(143,211,255,.08)'; ctx.lineWidth = 1; ctx.beginPath(); for (let i = .5; i < Math.max(w, h); i += 24) { ctx.moveTo(i, 0); ctx.lineTo(i, h); ctx.moveTo(0, i); ctx.lineTo(w, i); } ctx.stroke(); }
function drawBody(ctx, P, b, view, phase, t) { // штрихи кузова: back — дальние рёбра и пол, front — ближние (сбоку — колёса); t — прогресс
 const K = corners(b).map(c => P(c[0], c[1], c[2]));
 let edges = view === 'top' ? [0, 1, 2, 3] : view === 'side' ? [0, 9, 4, 8] : EDGES.map((_, i) => i);
 if (view === 'iso') edges = edges.filter(i => NEAR.includes(i) === (phase === 'front')); else if (phase === 'front') edges = [];
 ctx.save(); ctx.lineCap = 'round'; ctx.strokeStyle = PAL.line; ctx.setLineDash([]);
 if (phase === 'back' && view !== 'side') { ctx.globalAlpha = .28 * t; ctx.lineWidth = 1; for (let x = 1000; x < b.L; x += 1000) line(ctx, P(x, 0, 0), P(x, b.W, 0)); for (let y = 1000; y < b.W; y += 1000) line(ctx, P(0, y, 0), P(b.L, y, 0)); }
 if (phase === 'front' && view === 'side') { ctx.lineWidth = 1.5; [b.xf, b.xr].forEach(x => { const [cx, cy] = P(x * 1000, 0, 0); ctx.beginPath(); ctx.arc(cx, cy + 11, 8, 0, 7); ctx.stroke(); }); }
 ctx.globalAlpha = phase === 'front' ? .75 : 1; ctx.lineWidth = 1.5; ctx.setLineDash([7, 5]);
 const n = edges.length; edges.forEach((i, j) => { const u = t >= 1 ? 1 : clamp((t * (n + 2) - j) / 3, 0, 1); if (u <= 0) return; const a = K[EDGES[i][0]], c = K[EDGES[i][1]]; line(ctx, a, [lerp(a[0], c[0], u), lerp(a[1], c[1], u)]); });
 ctx.restore();
}
function dim(ctx, P, a, b, text, side, alpha = 1) { // размерная линия
 const A = P(a[0], a[1], a[2]), B = P(b[0], b[1], b[2]), dx = B[0] - A[0], dy = B[1] - A[1], len = Math.hypot(dx, dy) || 1, ux = dx / len, uy = dy / len;
 ctx.save(); ctx.globalAlpha = alpha; ctx.strokeStyle = PAL.line; ctx.fillStyle = PAL.line; ctx.lineWidth = 1; ctx.setLineDash([]); line(ctx, A, B);
 const arrow = (p, d) => { ctx.beginPath(); ctx.moveTo(p[0], p[1]); ctx.lineTo(p[0] - d * (ux * 7 - uy * 3), p[1] - d * (uy * 7 + ux * 3)); ctx.lineTo(p[0] - d * (ux * 7 + uy * 3), p[1] - d * (uy * 7 - ux * 3)); ctx.closePath(); ctx.fill(); };
 arrow(B, 1); arrow(A, -1);
 const mx = (A[0] + B[0]) / 2 - uy * 11 * side, my = (A[1] + B[1]) / 2 + ux * 11 * side;
 txt(ctx, M11, PAL.bg, 'center', 'middle'); const w = ctx.measureText(text).width + 8;
 ctx.fillRect(mx - w / 2, my - 8, w, 16); ctx.fillStyle = PAL.line; ctx.fillText(text, mx, my); ctx.restore();
}
const corner = (P, b) => (i, j, k) => P(b.x + i * b.l, b.y + j * b.w, b.z + k * b.h);
function silhouette(P, b, view) { const c = corner(P, b); return view === 'top' ? [c(0, 0, 0), c(1, 0, 0), c(1, 1, 0), c(0, 1, 0)] : view === 'side' ? [c(0, 0, 0), c(1, 0, 0), c(1, 0, 1), c(0, 0, 1)] : [c(0, 0, 1), c(1, 0, 1), c(1, 0, 0), c(1, 1, 0), c(0, 1, 0), c(0, 1, 1)]; }
function drawBox(ctx, P, b, col, view, label, fs, hl) { // верх 100%, бока −15% и −30%, рёбра #081A3A
 const c = corner(P, b), edge = hl ? C.orange : C.panel, Q = (pts, f) => poly(ctx, pts, f, edge); ctx.lineWidth = hl ? 2 : 1; ctx.lineJoin = 'round';
 if (view !== 'iso') Q(silhouette(P, b, view), view === 'top' ? col : shade(col, .15));
 else { Q([c(0, 1, 0), c(1, 1, 0), c(1, 1, 1), c(0, 1, 1)], shade(col, .15)); Q([c(1, 0, 0), c(1, 1, 0), c(1, 1, 1), c(1, 0, 1)], shade(col, .3)); Q([c(0, 0, 1), c(1, 0, 1), c(1, 1, 1), c(0, 1, 1)], col); }
 if (label != null) { const p = c(.5, view === 'side' ? 0 : .5, view === 'top' ? 0 : view === 'side' ? .5 : 1); txt(ctx, `700 ${fs}px ${MONO}`, C.panel, 'center', 'middle'); ctx.fillText(label, p[0], p[1]); }
}
const ORDER = { iso: (a, b) => a.x + a.y + a.z - b.x - b.y - b.z, top: (a, b) => a.z - b.z || a.step - b.step, side: (a, b) => b.y - a.y || a.z - b.z };
const DIMS = { iso: b => [[[0,b.W+350,0],[b.L,b.W+350,0],b.L,1],[[-350,0,b.H],[-350,b.W,b.H],b.W,1],[[-350,b.W,0],[-350,b.W,b.H],b.H,-1]], top: b => [[[0,b.W+350,0],[b.L,b.W+350,0],b.L,1],[[-350,0,0],[-350,b.W,0],b.W,1]], side: b => [[[0,0,-700],[b.L,0,-700],b.L,1],[[-350,0,0],[-350,0,b.H],b.H,-1]] };
function drawScheme(ctx, rect, o) { // кузов, размеры, груз по шагам; view ortho — план и вид сбоку в общем масштабе
 PAL = o.light ? LIGHT : C;
 const view = o.view || 'iso', body = o.body, pad = o.pad ?? 44, zoom = o.zoom || 1, pan = o.pan || { x: 0, y: 0 }, hits = o.hit ? [] : null;
 const boxes = (o.res ? o.res.placed : []).filter(b => b.step <= (o.steps ?? Infinity));
 const one = (v, P, s) => { const k = s / 1000; drawBody(ctx, P, body, v, 'back', 1); DIMS[v](body).forEach(d => dim(ctx, P, d[0], d[1], fmt(d[2]), d[3]));
  boxes.slice().sort(ORDER[v]).forEach(b => { const fs = clamp(Math.min(b.l, b.w) * k * .42, 0, 13), show = o.labels ? Math.max(fs, 9) : fs >= 8 ? fs : 0; drawBox(ctx, P, b, o.colors[b.t], v, show ? b.step : null, show, o.hl === b.t); if (hits) hits.push({ b, poly: silhouette(P, b, v) }); });
  drawBody(ctx, P, body, v, 'front', 1); };
 if (view === 'ortho') {
  const s = Math.min((rect.w - pad * 2) / body.L, (rect.h - pad * 2 - 44) / (body.W + body.H)) * 1000 * zoom, k = s / 1000, x0 = rect.x + rect.w / 2 - body.L * k / 2 + pan.x, y0 = rect.y + rect.h / 2 - ((body.W + body.H) * k + 44) / 2 + pan.y, ys = y0 + body.W * k + 44;
  const cap = (s, y) => { txt(ctx, M11, PAL.line); ctx.fillText(s, x0, y); };
  cap('ВИД СВЕРХУ', y0 - 20); one('top', proj('top', 0, s, x0, y0), s);
  cap('ВИД СБОКУ', ys - 20); one('side', proj('side', 0, s, x0, ys + body.H * k), s);
  return { hits };
 }
 const { P, s } = fitView(body, view, o.ang ?? 30, rect, pad, zoom, pan); one(view, P, s); return { P, s, hits };
}
function drawGauge(ctx, cx, cy, r, v, lim, label) { // шкала 0…120% лимита: зелёный ≤ 90%, жёлтый ≤ 100%, красный
 const seg = (a, b, col) => { ctx.beginPath(); ctx.arc(cx, cy, r, Math.PI + a * Math.PI, Math.PI + b * Math.PI); ctx.strokeStyle = col; ctx.stroke(); };
 ctx.lineWidth = 6; ctx.setLineDash([]); ctx.lineCap = 'butt'; seg(0, .75, C.green); seg(.75, .833, C.yellow); seg(.833, 1, C.red);
 const a = Math.PI + clamp(v / lim / 1.2, 0, 1) * Math.PI; ctx.strokeStyle = C.text; ctx.lineWidth = 2; line(ctx, [cx, cy], [cx + Math.cos(a) * (r - 5), cy + Math.sin(a) * (r - 5)]);
 ctx.fillStyle = C.text; ctx.beginPath(); ctx.arc(cx, cy, 3, 0, 7); ctx.fill();
 txt(ctx, M11, C.line, 'center'); ctx.fillText(label, cx, cy + 5);
}
const spring = (g, target, dt) => { const a = -120 * (g.v - target) - 14 * g.vel; g.vel += a * dt; g.v += g.vel * dt; }; // stiffness 120, damping 14
function sizeCanvas(cv, ctx) { const dpr = Math.min(devicePixelRatio || 1, 2), w = cv.clientWidth, h = cv.clientHeight; if (cv.width !== Math.round(w * dpr) || cv.height !== Math.round(h * dpr)) { cv.width = Math.round(w * dpr); cv.height = Math.round(h * dpr); } ctx.setTransform(dpr, 0, 0, dpr, 0, 0); return [w, h]; }
const inPoly = (x, y, p) => { let c = false; for (let i = 0, j = p.length - 1; i < p.length; j = i++) if (p[i][1] > y !== p[j][1] > y && x < (p[j][0] - p[i][0]) * (y - p[i][1]) / (p[j][1] - p[i][1]) + p[i][0]) c = !c; return c; };

// --- hero: синька, полёт коробок группами, гейджи, смена груза каждые 8 с
const HERO_SETS = [{ n: 'Паллеты и коробки', items: [mk(0, 33, 0, { kg: 420, st: 1 }), mk(1, 400, 1)] }, { n: 'Бочки', items: [mk(2, 276, 2, { kg: 70 })] }, { n: 'Мебель', items: [mk(3, 36, 3, { n: 'Диван 2200×1200', w: 1200, st: 1, kg: 120 }), mk(1, 30, 1, { kg: 20 })] }];
(function hero() {
 const cv = $('#hero-canvas'), sec = $('#hero'), copy = $('.hero-copy'); if (!cv) return; const ctx = cv.getContext('2d'), body = BODIES[2];
 HERO_SETS.forEach(s => { s.res = packBest(s.items, body, 0); s.colors = s.items.map(it => CARGO[it.col]); });
 const S = { last: 0, paused: 0, ang: 30, tAng: 30, px: 0, py: 0, tpx: 0, tpy: 0, fill: 0, gf: { v: 0, vel: 0 }, gr: { v: 0, vel: 0 } };
 function load(i) { S.set = i; S.t = RM ? 7.9 : 0; }
 function resize() { const r = cv.getBoundingClientRect(); S.W = r.width; S.H = r.height; S.top = MQ_S.matches ? parseFloat(getComputedStyle(copy).paddingTop) : 0; sizeCanvas(cv, ctx); if (RM) draw(0); }
 function draw(dt) {
  const { W, H, t } = S, set = HERO_SETS[S.set], placed = set.res.placed, N = placed.length, G = Math.ceil(N / 40), t0 = i => 1.3 + Math.floor(i / G) * .12; // группы по G мест, шаг 120 мс
  ctx.clearRect(0, 0, W, H); PAL = C;
  const stack = MQ_S.matches, mob = MQ_M.matches, rx = stack ? 12 : W * .46, rw = stack ? W - 24 : W * .54 - 28, ry = stack ? 14 : 36, rh = (stack ? S.top - 8 : H - 70) - 92 - ry;
  const { P } = fitView(body, 'iso', S.ang, { x: rx + S.px, y: ry + S.py, w: rw, h: rh }, 36);
  const edgeT = clamp(t / 1.2, 0, 1), dimA = clamp((t - .9) / .5, 0, 1);
  txt(ctx, M11, C.line); ctx.globalAlpha = dimA;
  ctx.fillText(`ЕВРОФУРА${mob ? '' : ' ' + dims(body)} · ${set.n.toUpperCase()} · ${places(N).toUpperCase()}`, rx, ry - (stack ? 2 : 12)); ctx.globalAlpha = 1;
  drawBody(ctx, P, body, 'iso', 'back', edgeT);
  if (dimA > 0) DIMS.iso(body).forEach(d => dim(ctx, P, d[0], d[1], fmt(d[2]), d[3], dimA));
  const wipe = clamp((t - 8) / .3, 0, 1), flying = [], landed = []; let vol = 0, mass = 0, rear = 0, cur = 0; // полёт 400 мс справа, bounce 4 px
  placed.forEach((b, i) => { const u = (t - t0(i)) / .4; if (u < 0) return; cur = i + 1; if (u < 1) flying.push([b, u]); else { landed.push(b); vol += b.l * b.w * b.h; mass += b.kg; rear += b.kg * (b.x + b.l / 2 - 1500) / 9000; } });
  ctx.globalAlpha = 1 - wipe;
  landed.sort(ORDER.iso).forEach(b => { const ub = (t - t0(b.step - 1) - .4) / .16, dy = ub >= 0 && ub < 1 ? -4 * Math.sin(ub * Math.PI) : 0; ctx.save(); ctx.translate(0, dy); drawBox(ctx, P, b, set.colors[b.t], 'iso', null, 0, false); ctx.restore(); });
  flying.forEach(([b, u]) => { const T = P(b.x + b.l / 2, b.y + b.w / 2, b.z), e = easeOut(u), m = 1 - e, bez = (a, c, d) => m * m * a + 2 * m * e * c + e * e * d - d; ctx.save(); ctx.translate(bez(W + 120, T[0] + 160, T[0]), bez(ry + 40, Math.max(T[1] - 200, ry + 20), T[1])); drawBox(ctx, P, b, set.colors[b.t], 'iso', null, 0, false); ctx.restore(); });
  if (wipe > 0) { // стирание штриховкой
   const K = corners(body).map(c => P(c[0], c[1], c[2])); ctx.save(); ctx.globalAlpha = wipe; ctx.beginPath(); [K[4], K[5], K[1], K[2], K[3], K[7]].forEach((p, i) => i ? ctx.lineTo(p[0], p[1]) : ctx.moveTo(p[0], p[1])); ctx.closePath(); ctx.clip();
   ctx.strokeStyle = C.line; ctx.lineWidth = 1; ctx.beginPath(); for (let x = -H; x < W + H; x += 9) { ctx.moveTo(x, 0); ctx.lineTo(x + H, H); } ctx.stroke(); ctx.restore();
  }
  ctx.globalAlpha = 1; drawBody(ctx, P, body, 'iso', 'front', edgeT);
  S.fill = RM ? vol / (body.L * body.W * body.H) : lerp(S.fill, vol / (body.L * body.W * body.H), .1);
  const front = mass - rear; if (RM) { S.gf.v = front; S.gr.v = rear; } else { spring(S.gf, front, dt); spring(S.gr, rear, dt); }
  const wy = ry + rh + 30, bw = mob ? 100 : W < 1200 ? 150 : 220, sp = mob ? 100 : 110, gx = mob ? rx + bw + 50 : rx + rw - 2 * sp, bx = mob ? rx : gx - 80 - bw;
  txt(ctx, M11, C.line); ctx.fillText('ОБЪЁМ', bx, wy - 20);
  ctx.strokeStyle = 'rgba(143,211,255,.38)'; ctx.lineWidth = 1; ctx.strokeRect(bx + .5, wy + .5, bw, 8); ctx.fillStyle = C.green; ctx.fillRect(bx + 1.5, wy + 1.5, (bw - 2) * clamp(S.fill, 0, 1), 6);
  ctx.font = `700 ${mob ? 18 : 24}px Tektur,sans-serif`; ctx.fillStyle = C.text; ctx.fillText(`${Math.round(S.fill * 100)}%`, bx + bw + 10, wy - 9);
  [[S.gf.v, body.lf, 'ПЕРЕД'], [S.gr.v, body.lr, 'ЗАД']].forEach(([v, lim, lab], i) => drawGauge(ctx, gx + i * sp + 35, wy + 14, 28, v, lim, `${lab} ${fmt1(Math.max(0, v) / 1000)}/${lim / 1000} т`));
  if (S.paused) { const b = placed[Math.max(0, cur - 1)], it = set.items[b.t]; txt(ctx, M11, C.orange); ctx.fillText(`ПАУЗА · ШАГ ${cur}/${N} · ${it.n.toUpperCase()} · ${it.kg} кг`, mob ? rx : bx, wy + 46); }
  if (t > 8.3 && !RM) load((S.set + 1) % HERO_SETS.length);
 }
 function frame(now) { const dt = clamp((now - S.last) / 1000, 0, .05); S.last = now; if (!document.hidden && cv.getBoundingClientRect().bottom > 0) { if (!S.paused) S.t += dt; S.ang = lerp(S.ang, S.tAng, .08); S.px = lerp(S.px, S.tpx, .08); S.py = lerp(S.py, S.tpy, .08); draw(dt || .016); } raf(frame); }
 load(0); resize(); on(window, 'resize', resize);
 if (RM) { $('#hero-hint').hidden = true; return; }
 on(sec, 'pointermove', e => { const r = sec.getBoundingClientRect(), mx = (e.clientX - r.left) / r.width - .5, my = (e.clientY - r.top) / r.height - .5; S.tAng = 30 + mx * 10; S.tpx = mx * 20; S.tpy = my * 20; });
 on(sec, 'pointerleave', () => { S.tAng = 30; S.tpx = S.tpy = 0; });
 on(cv, 'click', () => { S.paused = !S.paused; });
 raf(frame);
})();

// --- демо: таблица груза
const D = { items: [], body: BODIES[2], view: 'iso', zoom: 1, pan: { x: 0, y: 0 }, hl: -1 };
const scene = $('#scene'), sctx = scene.getContext('2d'), rowsEl = $('#rows'), slider = $('#step');
const EXAMPLE = () => [mk(0, 30, 0), mk(3, 2, 3), mk(2, 8, 2), mk(1, 12, 1)];
const tpl = $('#row-tpl').content; // разметка в index.html
function renderRows() {
 rowsEl.replaceChildren(...D.items.map((it, i) => { const r = tpl.cloneNode(true).firstElementChild; r.dataset.i = i; r.querySelector('.sw i').style.background = CARGO[it.col]; r.querySelectorAll('[data-k]').forEach(el => { const k = el.dataset.k; if (el.tagName === 'INPUT') el.value = it[k]; else el.setAttribute('aria-pressed', String(!!it[k])); }); return r; }));
 if (!D.items.length) rowsEl.innerHTML = '<p class="mono muted empty">Груза нет — добавьте место</p>';
 total();
}
function total() { const n = D.items.reduce((a, it) => a + (+it.qty || 0), 0), kg = D.items.reduce((a, it) => a + (+it.qty || 0) * (+it.kg || 0), 0); $('#cargo-total').textContent = `${places(n)} · ${fmt(kg)} кг`; }
let calcTimer; const scheduleCalc = () => { clearTimeout(calcTimer); calcTimer = setTimeout(runCalc, 250); };
on(rowsEl, 'input', e => { const row = e.target.closest('.row'), k = e.target.dataset.k; if (!row || !k) return; const it = D.items[+row.dataset.i]; it[k] = k === 'n' ? e.target.value : Math.max(0, +e.target.value || 0); total(); scheduleCalc(); });
on(rowsEl, 'click', e => { const btn = e.target.closest('button'), row = e.target.closest('.row'); if (!btn || !row) return; const it = D.items[+row.dataset.i];
 if (btn.classList.contains('del')) { D.items.splice(+row.dataset.i, 1); renderRows(); }
 else if (btn.classList.contains('sw')) { it.col = (it.col + 1) % 5; btn.firstChild.style.background = CARGO[it.col]; }
 else if (btn.classList.contains('tog')) { it[btn.dataset.k] = it[btn.dataset.k] ? 0 : 1; btn.setAttribute('aria-pressed', String(!!it[btn.dataset.k])); }
 scheduleCalc(); });
on($('#presets'), 'click', e => { const b = e.target.closest('button'); if (!b) return; const t = +b.dataset.t, ex = D.items.find(it => it.n === TYPES[t].n && it.l === TYPES[t].l); if (ex) ex.qty = (+ex.qty || 0) + 1; else D.items.push(mk(t, 1)); renderRows(); scheduleCalc(); });
$('#clear').onclick = () => { D.items = []; renderRows(); runCalc(); };
$('#run').onclick = runCalc;
$('#example').onclick = () => { D.items = EXAMPLE(); setBody('euro'); renderRows(); runCalc(); goDemo(); toast('Пример загружен'); };
// кузов; свой кузов клампится к min/max
const bodySel = $('#body'), CF = ['L', 'W', 'H', 'kg', 'xf', 'xr', 'lf', 'lr'], CID = CF.map(k => '#c' + k[0].toUpperCase() + k.slice(1));
const showDims = () => { $('#body-dims').textContent = `${dims(D.body)} · лимит ${fmt(D.body.kg)} кг`; };
function setBody(id, custom) { const b = BODIES.find(x => x.id === id) || BODIES[2]; D.body = b; bodySel.value = b.id; $('#custom').hidden = b.id !== 'custom'; if (custom) CF.forEach((k, i) => { b[k] = +custom[i]; $(CID[i]).value = b[k]; }); showDims(); }
on(bodySel, 'change', () => { setBody(bodySel.value); runCalc(); });
CID.forEach((id, i) => on($(id), 'input', () => { const el = $(id), v = clamp(+el.value, +el.min, +el.max); if (el.value !== '' && isFinite(v)) { BODIES[5][CF[i]] = v; showDims(); scheduleCalc(); } }));
on($('#gap'), 'input', () => { D.gap = clamp(+$('#gap').value || 0, 0, 300); scheduleCalc(); });

// --- расчёт и схема
async function runCalc() {
 clearTimeout(calcTimer); const body = D.body, items = D.items.filter(it => it.qty > 0 && it.l > 0 && it.w > 0 && it.h > 0);
 const res = await calc(items.map(it => ({ l: +it.l, w: +it.w, h: +it.h, kg: +it.kg, qty: Math.min(2000, Math.floor(it.qty)), st: it.st, ti: it.ti })), body, D.gap);
 if (res.id !== calcSeq) return;
 D.res = res; D.calcItems = items; D.total = D.steps = res.placed.length; D.anim = RM ? 0 : performance.now(); D.hl = -1; D.pan = { x: 0, y: 0 };
 slider.max = D.total; slider.value = D.total; updateMetrics(res, body); updateSheet(res, body, items); renderLoop();
}
function draw() { const [W, H] = sizeCanvas(scene, sctx); sctx.clearRect(0, 0, W, H); if (!D.res) return 0; const shown = D.anim ? Math.min(D.steps, Math.floor((performance.now() - D.anim) / 20)) : D.steps;
 D.hits = drawScheme(sctx, { x: 0, y: 0, w: W, h: H }, { body: D.body, res: D.res, view: D.view, zoom: D.zoom, pan: D.pan, steps: shown, colors: D.calcItems.map(i => CARGO[i.col]), hl: D.hl, hit: true, pad: W < 600 ? 24 : 40 }).hits;
 $('#step-out').value = `${shown} / ${D.total}`;
 if (!D.total) { txt(sctx, `500 14px ${MONO}`, C.line, 'center'); sctx.fillText('Добавьте груз и проверьте размеры', W / 2, 28); }
 return shown; }
function renderLoop() { if (D.raf) return; const f = () => { D.raf = 0; const shown = draw(); if (D.anim && shown < D.steps) D.raf = raf(f); else D.anim = 0; }; D.raf = raf(f); }
on(slider, 'input', () => { D.anim = 0; D.steps = +slider.value; draw(); });
$$('.seg button').forEach(b => on(b, 'click', () => { D.view = scene.dataset.view = b.dataset.view; D.pan = { x: 0, y: 0 }; $$('.seg button').forEach(x => x.setAttribute('aria-pressed', String(x === b))); draw(); }));
on(window, 'pointerdown', e => { D.active = scene.contains(e.target); }); // колесо: масштаб с Ctrl или после клика по схеме
on(scene, 'wheel', e => { if (!(e.ctrlKey || e.metaKey || D.active)) return; e.preventDefault(); D.zoom = clamp(D.zoom * (e.deltaY < 0 ? 1.12 : .89), .5, 3); draw(); }, { passive: false });
let drag = null;
on(scene, 'pointerdown', e => { drag = { x: e.clientX, y: e.clientY, px: D.pan.x, py: D.pan.y, moved: false }; scene.setPointerCapture(e.pointerId); });
on(scene, 'pointermove', e => { if (!drag) return; const dx = e.clientX - drag.x, dy = e.clientY - drag.y; if (Math.hypot(dx, dy) > 3) drag.moved = true; if (drag.moved) { D.pan = { x: drag.px + dx, y: drag.py + dy }; draw(); } });
on(scene, 'pointerup', e => { if (!drag) return; const was = drag; drag = null; if (!was.moved) pick(e); });
function pick(e) { const r = scene.getBoundingClientRect(), x = e.clientX - r.left, y = e.clientY - r.top, hits = D.hits || [];
 for (let i = hits.length - 1; i >= 0; i--) if (inPoly(x, y, hits[i].poly)) { const { b } = hits[i], it = D.calcItems[b.t], idx = D.items.indexOf(it); D.hl = b.t; $$('.row').forEach((row, j) => row.classList.toggle('hl', j === idx)); const row = $(`.row[data-i="${idx}"]`); if (row) row.scrollIntoView({ block: 'nearest' }); toast(`Шаг ${b.step} · ${it.n} · x ${fmt(b.x)} · z ${fmt(b.z)} мм`); draw(); return; }
 D.hl = -1; $$('.row.hl').forEach(row => row.classList.remove('hl')); draw(); }
on(window, 'resize', () => { draw(); renderGauges(); });
// метрики и гейджи
function tweenText(el, to, f) { const from = +el.dataset.v || 0; el.dataset.v = to; if (RM) { el.textContent = f(to); return; } const t0 = performance.now(), step = now => { const t = clamp((now - t0) / 600, 0, 1); el.textContent = f(lerp(from, to, easeOut(t))); if (t < 1) raf(step); }; raf(step); }
const G = { f: { v: 0, vel: 0, t: 0 }, r: { v: 0, vel: 0, t: 0 }, lf: D.body.lf, lr: D.body.lr, raf: 0, last: 0 };
function gaugeLoop(now) { const dt = clamp((now - G.last) / 1000, 0, .05) || .016; G.last = now; let active = false; for (const g of [G.f, G.r]) { if (RM) g.v = g.t; else { spring(g, g.t, dt); if (Math.abs(g.v - g.t) > 1 || Math.abs(g.vel) > 2) active = true; } } renderGauges(); G.raf = active ? raf(gaugeLoop) : 0; }
function renderGauges() { [['#g-front', G.f, G.lf, 'перед'], ['#g-rear', G.r, G.lr, 'зад']].forEach(([id, g, lim, lab]) => { const cv = $(id), ctx = cv.getContext('2d'), [W, H] = sizeCanvas(cv, ctx); if (W < 60 || H < 40) return; ctx.clearRect(0, 0, W, H); drawGauge(ctx, W / 2, H - 22, Math.min(W / 2 - 8, H - 32), g.v, lim, `${Math.round(Math.max(0, g.v) / lim * 100)}%`); $(id + '-t').innerHTML = `${lab} ${fmt(Math.max(0, g.v))}<br>из ${fmt(lim)} кг`; }); }
function updateMetrics(res, body) {
 const fill = res.fill * 100; tweenText($('#m-fill'), fill, v => `${v.toFixed(0)}%`); $('#m-fill-bar').style.width = `${clamp(fill, 0, 100)}%`;
 $('#m-vol').textContent = `${fmt1(res.vol / 1e9)} из ${fmt1(body.L * body.W * body.H / 1e9)} м³`;
 tweenText($('#m-mass'), res.mass, v => `${fmt(v)} кг`); const mr = res.mass / body.kg, mb = $('#m-mass-bar'); mb.style.width = `${clamp(mr * 100, 0, 100)}%`; mb.className = mr > 1 ? 'over' : mr > .9 ? 'warn' : ''; $('#m-mass-note').textContent = `лимит ${fmt(body.kg)} кг · ${Math.round(mr * 100)}%`;
 G.f.t = res.front; G.r.t = res.rear; G.lf = body.lf; G.lr = body.lr; if (!G.raf) { G.last = performance.now(); G.raf = raf(gaugeLoop); }
 const n = Object.values(res.left).reduce((a, b) => a + b, 0); $('#m-left').textContent = places(n); $('#m-left').style.color = n ? C.orange : '';
 $('#left-list').innerHTML = Object.entries(res.left).map(([t, c]) => `<li><span>${esc(D.calcItems[t].n)}</span><b>${c} шт</b></li>`).join('');
 $('#m-time').textContent = `расчёт ${fmt1(res.ms)} мс · уложено ${res.placed.length} из ${res.n}`;
}

// --- выход: PNG, A4, ссылка, localStorage, CSV
function renderPng(res, body, items, view, W, H, light) { // 2×: заголовок, легенда, схема с номерами
 const cv = document.createElement('canvas'); cv.width = W; cv.height = H; const ctx = cv.getContext('2d'); ctx.scale(2, 2); const w = W / 2, h = H / 2; PAL = light ? LIGHT : C;
 ctx.fillStyle = PAL.bg; ctx.fillRect(0, 0, w, h); if (!light) grid(ctx, w, h);
 txt(ctx, '700 18px Tektur,sans-serif', PAL.text); ctx.fillText(`${body.n} · ${dims(body)} · ${places(res.placed.length)} · ${fmt(res.mass)} кг · объём ${Math.round(res.fill * 100)}%`, 16, 12);
 ctx.font = `500 13px ${MONO}`; let lx = 16, ly = 42;
 items.forEach((it, i) => { if (!res.placed.some(b => b.t === i)) return; const tw = ctx.measureText(it.n).width + 34; if (lx + tw > w - 16) { lx = 16; ly += 18; } ctx.fillStyle = CARGO[it.col]; ctx.fillRect(lx, ly + 2, 10, 10); ctx.fillStyle = PAL.text; ctx.fillText(it.n, lx + 15, ly); lx += tw; });
 drawScheme(ctx, { x: 0, y: ly + 20, w, h: h - ly - 40 }, { body, res, view, labels: true, colors: items.map(i => CARGO[i.col]), pad: 36, light });
 txt(ctx, M11, PAL.line, 'right', 'bottom'); ctx.fillText('КУЗОВ · схема ориентировочная', w - 16, h - 10);
 return cv.toDataURL('image/png');
}
const sheetRows = (res, items, max) => res.placed.slice(0, max).map(b => `<tr><td class="num">${b.step}</td><td>${esc(items[b.t].n)}</td><td class="num">${fmt(b.x)}</td><td class="num">${fmt(b.z)}</td><td class="num">${fmt(b.kg)}</td></tr>`).join('');
function updateSheet(res, body, items) {
 $('#sheet-rows').innerHTML = sheetRows(res, items, 8) || '<tr><td colspan="5">Добавьте груз в демо</td></tr>';
 $('#sheet-more').textContent = res.placed.length > 8 ? `… ещё ${res.placed.length - 8} шагов — в печатной версии` : '';
 $('#sheet-meta').textContent = `${body.n} · ${places(res.placed.length)} · ${fmt(res.mass)} кг · ${Math.round(res.fill * 100)}%`;
 $('#sheet-img').src = renderPng(res, body, items, 'iso', 1600, 1000);
}
$('#png').onclick = () => { if (!D.res) return; download(`kuzov-${D.body.id}-${D.res.placed.length}.png`, renderPng(D.res, D.body, D.calcItems, D.view, 1600, 1000)); };
function printSheet() { if (!D.res) return; const { res, body, calcItems: items } = D;
 $('#p-title').textContent = `Лист погрузки — ${body.n}`;
 $('#p-meta').textContent = `${$('#sheet-meta').textContent} объёма · ${dims(body)} · оси ${fmt(Math.max(0, res.front))}/${fmt(body.lf)} и ${fmt(Math.max(0, res.rear))}/${fmt(body.lr)} кг`;
 $('#p-views').innerHTML = ['iso', 'ortho'].map(v => `<img src="${renderPng(res, body, items, v, 1600, 1000, true)}" alt="Схема ${v}">`).join('');
 $('#p-rows').innerHTML = sheetRows(res, items, Infinity); setTimeout(print, 60); }
$('#print').onclick = $('#print2').onclick = printSheet;
function stateHash() { const o = { i: D.items.map(it => [it.n, it.l, it.w, it.h, it.kg, it.qty, it.st, it.ti, it.col]), b: D.body.id, g: D.gap }; if (D.body.id === 'custom') o.c = CF.map(k => D.body[k]); return '#c=' + encodeURIComponent(JSON.stringify(o)); }
function applyState(hash) { const m = (hash || '').match(/^#c=(.+)/); if (!m) return false; try { const o = JSON.parse(decodeURIComponent(m[1]));
 D.items = o.i.slice(0, 60).map(a => ({ n: String(a[0]).slice(0, 40), l: +a[1] || 0, w: +a[2] || 0, h: +a[3] || 0, kg: +a[4] || 0, qty: +a[5] || 0, st: a[6] ? 1 : 0, ti: a[7] ? 1 : 0, col: Math.abs(+a[8] || 0) % 5 }));
 setBody(o.b, o.c?.length === 8 && o.c.every(v => isFinite(+v)) ? o.c : null); D.gap = clamp(+o.g || 0, 0, 300); $('#gap').value = D.gap; return true; } catch (e) { return false; } }
$('#link').onclick = async () => { history.replaceState(null, '', stateHash()); try { await navigator.clipboard.writeText(location.href); toast('Ссылка скопирована'); } catch (e) { toast('Ссылка в адресе'); } };
const LS = 'kuzov:calcs', loadSaved = () => { try { return JSON.parse(localStorage.getItem(LS)) || []; } catch (e) { return []; } };
const renderSaved = () => { $('#saved').innerHTML = loadSaved().map(s => `<div class="saved-item"><span>${esc(s.n)}</span><button type="button" data-open="${s.id}">Открыть</button><button type="button" data-del="${s.id}" aria-label="Удалить">×</button></div>`).join(''); };
$('#save').onclick = () => { if (!D.res) return; const list = loadSaved(); list.unshift({ id: Date.now(), n: `${D.body.n} · ${places(D.res.placed.length)} · ${Math.round(D.res.fill * 100)}%`, h: stateHash() }); try { localStorage.setItem(LS, JSON.stringify(list.slice(0, 12))); toast('Сохранено'); } catch (e) { toast('Хранилище недоступно'); } renderSaved(); };
on($('#saved'), 'click', e => { const b = e.target.closest('button'); if (!b) return; const list = loadSaved(), s = list.find(x => String(x.id) === (b.dataset.open || b.dataset.del));
 if (b.dataset.open) { if (s && applyState(s.h)) { renderRows(); runCalc(); toast('Расчёт открыт'); } } else { try { localStorage.setItem(LS, JSON.stringify(list.filter(x => x !== s))); } catch (e) {} renderSaved(); } });
$('#csv-out').onclick = () => { const rows = [['Груз', 'Д', 'Ш', 'В', 'кг', 'шт', 'Штаб', 'Кант'], ...D.items.map(it => [`"${String(it.n).replace(/"/g, '""')}"`, it.l, it.w, it.h, it.kg, it.qty, it.st ? 'да' : 'нет', it.ti ? 'да' : 'нет'])];
 download('kuzov-cargo.csv', URL.createObjectURL(new Blob(['﻿' + rows.map(r => r.join(';')).join('\n')], { type: 'text/csv' }))); };
$('#csv-in-btn').onclick = () => $('#csv-in').click();
on($('#csv-in'), 'change', e => { const file = e.target.files[0]; if (!file) return; file.text().then(txt => { // разделитель один на файл, кавычки, десятичная запятая
 const yes = v => /^(да|yes|1|true|y|д)$/i.test(v), sep = txt.includes(';') ? ';' : txt.includes('\t') ? '\t' : ',', num = s => parseFloat((s || '').replace(/\s/g, '').replace(',', '.'));
 const split = l => { const c = []; let s = '', q = false; for (const ch of l) { if (ch === '"') q = !q; else if (ch === sep && !q) { c.push(s.trim()); s = ''; } else s += ch; } c.push(s.trim()); return c; };
 let n = 0, bad = 0;
 txt.replace(/^﻿/, '').split(/\r?\n/).forEach((l, i) => { if (!l.trim()) return; const c = split(l), d = [1, 2, 3].map(j => num(c[j]));
  if (c.length < 4 || d.some(v => !(v > 0))) { if (i) bad++; return; } // первая строка без чисел — заголовок
  D.items.push({ n: c[0].slice(0, 40) || 'Груз', l: d[0], w: d[1], h: d[2], kg: Math.max(0, num(c[4])) || 0, qty: parseInt(c[5]) || 1, st: +yes(c[6]), ti: +yes(c[7]), col: n % 5 }); n++; });
 renderRows(); runCalc(); toast(n ? `Импортировано строк: ${n}${bad ? ` · пропущено ${bad}` : ''}` : 'Нужны строки название;Д;Ш;В;кг;шт'); e.target.value = ''; }); });

// --- кузова, тарифы, меню
$$('[data-pal]').forEach(td => { td.textContent = packBest([mk(0, 80, 0, { kg: 0 })], BODIES.find(b => b.id === td.dataset.pal), 0).placed.length; });
on($('#bodies'), 'click', e => { const b = e.target.closest('button[data-body]'); if (!b) return; setBody(b.dataset.body); runCalc(); goDemo(); toast(`Кузов: ${D.body.n}`); });
$$('[data-plan]').forEach(b => on(b, 'click', () => { toast(`Тариф «${b.dataset.plan}»: начните с демо`); goDemo(); }));
const nav = $('.nav'), burger = $('#burger');
burger.onclick = () => { const open = nav.classList.toggle('open'); burger.setAttribute('aria-expanded', String(open)); burger.setAttribute('aria-label', open ? 'Закрыть меню' : 'Открыть меню'); };
$$('#menu a').forEach(a => on(a, 'click', () => { nav.classList.remove('open'); burger.setAttribute('aria-expanded', 'false'); }));

// --- старт
if (!applyState(location.hash)) { D.items = EXAMPLE(); showDims(); }
renderRows(); renderSaved(); renderGauges(); runCalc();
if (document.fonts) document.fonts.ready.then(() => { draw(); renderGauges(); if (D.res) $('#sheet-img').src = renderPng(D.res, D.body, D.calcItems, 'iso', 1600, 1000); });
})();
