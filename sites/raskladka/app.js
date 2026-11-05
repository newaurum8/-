/* Раскладка — планировщик плитки: раскладка по контуру комнаты, живой hero, демо, умный старт, PNG/PDF, проекты. */
const $ = (s, r = document) => r.querySelector(s), $$ = (s, r = document) => [...r.querySelectorAll(s)], E = id => document.getElementById(id);
const RM = matchMedia('(prefers-reduced-motion: reduce)').matches;
const clamp = (v, a, b) => Math.max(a, Math.min(b, v)), ease = t => 1 - (1 - t) ** 3;
const fmtN = n => Math.round(n).toLocaleString('ru-RU'), fmtCm = v => (Math.round(v * 2) / 2).toLocaleString('ru-RU'), fmt1 = (v, d = 1) => v.toLocaleString('ru-RU', { maximumFractionDigits: d });
const esc = s => String(s).replace(/[&<>"]/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]));
const INK = '#2A2A2A', TEAL = '#1E6F74', TEAL2 = '#175F64', AMBER = 'rgba(227,163,60,.85)', MILK = '#F4ECDD', TERRA = '#B8563B', FONT = 'Nunito, sans-serif';
const LS = { get: (k, d) => { try { return JSON.parse(localStorage.getItem(k)) ?? d; } catch { return d; } }, set: (k, v) => { try { localStorage.setItem(k, JSON.stringify(v)); } catch {} } };
const goDemo = () => E('demo').scrollIntoView({ behavior: RM ? 'auto' : 'smooth' });

// ---------- появление, count-up, тост, меню ----------
$$('[data-stagger]').forEach(g => [...g.children].forEach((el, i) => el.style.setProperty('--i', i)));
function tween(a, b, ms, fn) { if (RM) return fn(b); const t0 = performance.now(); const step = t => { const k = clamp((t - t0) / ms, 0, 1); fn(a + (b - a) * ease(k)); if (k < 1) requestAnimationFrame(step); }; requestAnimationFrame(step); }
const revealAll = () => { const h = innerHeight; $$('.reveal:not(.in)').forEach(el => { if (el.getBoundingClientRect().top < h * .92) el.classList.add('in'); }); };
addEventListener('scroll', revealAll, { passive: true }); addEventListener('resize', revealAll); setTimeout(revealAll, 400);
// count-up стартует, когда блок получил .in
const countUp = el => { if (el.dataset.done) return; el.dataset.done = 1; tween(0, +el.dataset.count, 600, v => el.textContent = (v < -.5 ? '−' : '') + fmtN(Math.abs(v))); };
new MutationObserver(ms => ms.forEach(m => { if (m.target.classList.contains('in')) $$('[data-count]', m.target).forEach(countUp); })).observe(document.body, { attributes: true, attributeFilter: ['class'], subtree: true });
const toastEl = E('toast'); let toastT; const toast = m => { toastEl.textContent = m; toastEl.classList.add('show'); clearTimeout(toastT); toastT = setTimeout(() => toastEl.classList.remove('show'), 2800); };
const burger = E('burger'), menu = E('menu');
burger.onclick = () => { const o = menu.classList.toggle('open'); burger.setAttribute('aria-expanded', o); burger.setAttribute('aria-label', o ? 'Закрыть меню' : 'Открыть меню'); };
menu.onclick = e => { if (e.target.tagName === 'A') { menu.classList.remove('open'); burger.setAttribute('aria-expanded', 'false'); } };

// ---------- геометрия: площадь, клиппинг Сазерленда–Ходжмана ----------
const polyArea = p => { let s = 0; for (let i = 0, n = p.length; i < n; i++) { const a = p[i], b = p[(i + 1) % n]; s += a[0] * b[1] - b[0] * a[1]; } return Math.abs(s) / 2; };
function clipAxis(poly, ax, bound, keepGreater) {
  const out = [], n = poly.length;
  for (let i = 0; i < n; i++) {
    const a = poly[i], b = poly[(i + 1) % n], ia = keepGreater ? a[ax] >= bound : a[ax] <= bound, ib = keepGreater ? b[ax] >= bound : b[ax] <= bound;
    if (ia) out.push(a);
    if (ia !== ib) { const t = (bound - a[ax]) / (b[ax] - a[ax]); out.push([a[0] + (b[0] - a[0]) * t, a[1] + (b[1] - a[1]) * t]); }
  }
  return out;
}
function clipRect(poly, r) {
  let p = clipAxis(poly, 0, r.x, true); if (p.length > 2) p = clipAxis(p, 0, r.x + r.w, false);
  if (p.length > 2) p = clipAxis(p, 1, r.y, true); if (p.length > 2) p = clipAxis(p, 1, r.y + r.h, false);
  return p.length > 2 ? p : null;
}
// комната = прямоугольник минус дыры (Г-вырез, проёмы) → выпуклые ячейки
function region(w, h, holes = []) {
  const hs = holes.map(o => ({ x: Math.max(0, o.x), y: Math.max(0, o.y), w: Math.min(w, o.x + o.w) - Math.max(0, o.x), h: Math.min(h, o.y + o.h) - Math.max(0, o.y), kind: o.kind })).filter(o => o.w > 0 && o.h > 0);
  const xs = [...new Set([0, w, ...hs.flatMap(o => [o.x, o.x + o.w])])].sort((a, b) => a - b), cells = [];
  for (let i = 0; i < xs.length - 1; i++) {
    const x0 = xs[i], x1 = xs[i + 1], xm = (x0 + x1) / 2; if (x1 - x0 < .01) continue;
    const ys = [...new Set([0, h, ...hs.filter(o => o.x < xm && o.x + o.w > xm).flatMap(o => [o.y, o.y + o.h])])].sort((a, b) => a - b);
    for (let j = 0; j < ys.length - 1; j++) { const y0 = ys[j], y1 = ys[j + 1], ym = (y0 + y1) / 2; if (y1 - y0 < .01) continue; if (!hs.some(o => o.x < xm && o.x + o.w > xm && o.y < ym && o.y + o.h > ym)) cells.push({ x: x0, y: y0, w: x1 - x0, h: y1 - y0 }); }
  }
  return { w, h, holes: hs, cells, area: cells.reduce((s, c) => s + c.w * c.h, 0) };
}
// ---------- решётки узоров (см); bb — охватывающий прямоугольник ----------
function* genTiles(pat, tw, th, g, bb) {
  const pw = tw + g, ph = th + g, L = Math.max(tw, th), W = Math.min(tw, th), n = Math.round(L / W);
  if (pat === 'herring45' || pat === 'herring90') { // ёлочка: решётка a·(L′,L′) + b·(−W′,W′)
    const Lp = L + g, Wp = W + g, cs = [[bb.x0, bb.y0], [bb.x1, bb.y0], [bb.x0, bb.y1], [bb.x1, bb.y1]], as = cs.map(([x, y]) => (x + y) / (2 * Lp)), bs = cs.map(([x, y]) => (y - x) / (2 * Wp));
    for (let b = Math.floor(Math.min(...bs)) - 1; b <= Math.ceil(Math.max(...bs)) + 1; b++) for (let a = Math.floor(Math.min(...as)) - 1; a <= Math.ceil(Math.max(...as)) + 1; a++) { const x = a * Lp - b * Wp, y = a * Lp + b * Wp; yield { x, y, w: L, h: W, row: b, col: a, rot: 0 }; yield { x: x + Lp, y, w: W, h: L, row: b, col: a, rot: 90 }; }
    return;
  }
  if (pat === 'checker' && n > 1 && Math.abs(L / W - n) < .03) { // прямоугольная шахматка = плетёнка блоками из n плиток
    const P = Math.max(L, n * W + (n - 1) * g) + g;
    for (let J = Math.floor(bb.y0 / P) - 1; J <= Math.ceil(bb.y1 / P); J++) for (let I = Math.floor(bb.x0 / P) - 1; I <= Math.ceil(bb.x1 / P); I++) for (let k = 0; k < n; k++)
      yield (I + J) & 1 ? { x: I * P + k * (W + g), y: J * P, w: W, h: L, row: J, col: I, rot: 90 } : { x: I * P, y: J * P + k * (W + g), w: L, h: W, row: J, col: I, rot: 0 };
    return;
  }
  const m = pat === 'half' ? 2 : pat === 'third' ? 3 : 1; // прямая, смещение ½ и ⅓, диагональ, шахматка квадратов
  for (let j = Math.floor(bb.y0 / ph) - 1; j <= Math.ceil(bb.y1 / ph); j++) {
    const shift = ((j % m) + m) % m * pw / m;
    for (let i = Math.floor((bb.x0 - shift) / pw) - 1; i <= Math.ceil((bb.x1 - shift) / pw); i++) yield { x: i * pw + shift, y: j * ph, w: tw, h: th, row: j, col: i, rot: pat === 'checker' ? ((i + j) & 1) * 90 : 0 };
  }
}
// ---------- раскладка: клиппинг каждой плитки; целая ≥ 99% площади, иначе подрезка ----------
function layout(reg, tile, g, pat, origin, light) {
  const th = (pat === 'diag' || pat === 'herring45') ? Math.PI / 4 : 0, c = Math.cos(th), s = Math.sin(th), tA = tile.w * tile.h;
  const inv = (x, y) => [(x - origin.x) * c + (y - origin.y) * s, -(x - origin.x) * s + (y - origin.y) * c];
  const cs = [[0, 0], [reg.w, 0], [0, reg.h], [reg.w, reg.h]].map(p => inv(p[0], p[1])), xs = cs.map(p => p[0]), ys = cs.map(p => p[1]);
  const bb = { x0: Math.min(...xs), x1: Math.max(...xs), y0: Math.min(...ys), y1: Math.max(...ys) }, tiles = [], cutTiles = []; let whole = 0, narrow = 0, covered = 0;
  for (const t of genTiles(pat, tile.w, tile.h, g, bb)) {
    const q = [[t.x, t.y], [t.x + t.w, t.y], [t.x + t.w, t.y + t.h], [t.x, t.y + t.h]].map(([x, y]) => [origin.x + x * c - y * s, origin.y + x * s + y * c]);
    let qx0 = 1e9, qy0 = 1e9, qx1 = -1e9, qy1 = -1e9; for (const p of q) { qx0 = Math.min(qx0, p[0]); qx1 = Math.max(qx1, p[0]); qy0 = Math.min(qy0, p[1]); qy1 = Math.max(qy1, p[1]); }
    if (qx1 <= 0 || qy1 <= 0 || qx0 >= reg.w || qy0 >= reg.h) continue;
    let A = 0; const parts = [];
    for (const cell of reg.cells) { if (qx1 <= cell.x || qx0 >= cell.x + cell.w || qy1 <= cell.y || qy0 >= cell.y + cell.h) continue; const p = clipRect(q, cell); if (p) { const a = polyArea(p); if (a > .5) { A += a; parts.push(p); } } }
    if (!A) continue;
    covered += A;
    let X0 = 1e9, Y0 = 1e9, X1 = -1e9, Y1 = -1e9; for (const p of parts) for (const [X, Y] of p) { X0 = Math.min(X0, X); X1 = Math.max(X1, X); Y0 = Math.min(Y0, Y); Y1 = Math.max(Y1, Y); }
    const o = { parts: light ? null : parts, rb: [X0, Y0, X1, Y1], row: t.row, col: t.col, rot: t.rot, cut: A < .99 * tA, dims: t.rot ? [t.h, t.w] : [t.w, t.h] };
    if (o.cut) { // габариты подрезки в системе плитки; рез по одной оси можно переиспользовать
      let x0 = 1e9, y0 = 1e9, x1 = -1e9, y1 = -1e9;
      for (const p of parts) for (const [X, Y] of p) { const [u, v] = inv(X, Y); x0 = Math.min(x0, u); x1 = Math.max(x1, u); y0 = Math.min(y0, v); y1 = Math.max(y1, v); }
      const bw = Math.min(t.w, Math.round((x1 - x0) * 2) / 2), bh = Math.min(t.h, Math.round((y1 - y0) * 2) / 2), cx = bw < t.w - .3, cy = bh < t.h - .3;
      o.dims = t.rot ? [bh, bw] : [bw, bh];
      if (cx !== cy) { o.len = cx ? bw : bh; o.T = cx ? t.w : t.h; if (o.len >= o.T / 3) o.key = t.row + (cx ? 'x' : 'y') + t.rot; o.narrow = o.len < 5; }
      else { o.len = A; o.T = tA * .95; if (A >= tA / 3) o.key = t.row + 'd'; o.narrow = Math.min(bw, bh) < 5; }
      if (o.narrow) narrow++;
      cutTiles.push(o);
    } else whole++;
    tiles.push(o);
  }
  // остатки одного ряда склеиваются парами, если сумма ≤ длины плитки
  const groups = {}; for (const t of cutTiles) if (t.key) (groups[t.key] ||= []).push(t);
  let reused = 0;
  for (const k in groups) { const arr = groups[k].sort((a, b) => a.len - b.len); let i = 0, j = arr.length - 1; while (i < j) { if (arr[i].len + arr[j].len <= arr[i].T) { reused++; i++; j--; } else j--; } }
  const pieces = whole + cutTiles.length - reused, rows = [...new Set(tiles.map(t => t.row))].sort((a, b) => a - b);
  return { tiles, whole, cuts: cutTiles.length, reused, pieces, narrow, covered, rowNo: new Map(rows.map((r, i) => [r, i + 1])), waste: pieces ? Math.max(0, 1 - covered / (pieces * tA)) : 0 };
}
function cutList(res, prefix) { // ряд — размер — сколько штук
  const m = new Map();
  for (const t of res.tiles) if (t.cut) { const k = prefix + res.rowNo.get(t.row) + '|' + t.dims[0] + '|' + t.dims[1] + '|' + (t.narrow ? 1 : 0); m.set(k, (m.get(k) || 0) + 1); }
  return [...m].map(([k, n]) => { const [row, a, b, w] = k.split('|'); return { row, a: +a, b: +b, n, narrow: w === '1' }; }).sort((p, q) => p.row.localeCompare(q.row, 'ru', { numeric: true }) || q.n - p.n);
}
function startAt(kind, reg, tile, g, door, wall) { // точка старта: от центра / от стены / от двери
  const cx = reg.w / 2 - tile.w / 2, cy = reg.h / 2 - tile.h / 2;
  if (kind === 'door' && door) { const d = door.pos + door.width / 2; return door.wall === 'top' ? { x: d - tile.w / 2, y: 0 } : door.wall === 'bottom' ? { x: d - tile.w / 2, y: reg.h + g } : door.wall === 'left' ? { x: 0, y: d - tile.h / 2 } : { x: reg.w + g, y: d - tile.h / 2 }; }
  if (kind === 'wall') return wall === 'bottom' ? { x: cx, y: reg.h + g } : wall === 'right' ? { x: reg.w + g, y: cy } : wall === 'left' ? { x: 0, y: cy } : { x: cx, y: 0 };
  return { x: cx, y: cy };
}
function edgeDiff(res, reg, wall) { // разница ширин крайних подрезок у стены — мера симметрии
  const horiz = wall === 'top' || wall === 'bottom', ax = horiz ? 0 : 1, ext = t => horiz ? t.rb[2] - t.rb[0] : t.rb[3] - t.rb[1];
  const touch = res.tiles.filter(t => t.cut && (wall === 'top' ? t.rb[1] < .5 : wall === 'bottom' ? t.rb[3] > reg.h - .5 : wall === 'left' ? t.rb[0] < .5 : t.rb[2] > reg.w - .5)).sort((a, b) => a.rb[ax] - b.rb[ax]);
  return touch.length < 2 ? 0 : Math.abs(ext(touch[0]) - ext(touch[touch.length - 1]));
}
const OPP = { top: 'bottom', bottom: 'top', left: 'right', right: 'left' };
// умный старт: до 144 смещений с шагом ≥ 5 см; штраф = 10·узкие + 3·асимметрия/10 + подрезки
function smart(reg, tile, g, pat, door) {
  const pw = tile.w + g, ph = tile.h + g, sx = Math.max(5, pw / 12), sy = Math.max(5, ph / 12); let best = null;
  for (let dy = 0; dy < ph - .01; dy += sy) for (let dx = 0; dx < pw - .01; dx += sx) {
    const r = layout(reg, tile, g, pat, { x: dx, y: dy }, true), sym = door ? edgeDiff(r, reg, OPP[door.wall]) + edgeDiff(r, reg, door.wall) : 0, pen = 10 * r.narrow + .3 * sym + r.cuts;
    if (!best || pen < best.pen - 1e-9 || (Math.abs(pen - best.pen) < 1e-9 && r.pieces < best.pieces)) best = { pen, origin: { x: dx, y: dy }, pieces: r.pieces, narrow: r.narrow };
  }
  return best;
}

// ---------- данные: форматы, схемы, салоны; пиктограммы рисует движок ----------
const FORMATS = [['600 × 600', 60, 60, 4, 1.44, 'straight'], ['300 × 600', 60, 30, 6, 1.08, 'half'], ['200 × 1200 «под дерево»', 120, 20, 5, 1.2, 'third'], ['100 × 100', 10, 10, 100, 1, 'straight'], ['Кабанчик 60 × 240', 24, 6, 50, .72, 'herring90'], ['Ламинат 1285 × 192', 128.5, 19.2, 8, 1.97, 'third']].map(([name, w, h, pack, m2, pat]) => ({ name, w, h, pack, m2, pat }));
const PATS = [['straight', 'прямая'], ['half', 'смещение ½'], ['third', 'смещение ⅓'], ['diag', 'диагональ 45°'], ['herring45', 'ёлочка 45°'], ['herring90', 'ёлочка 90°'], ['checker', 'шахматка']];
const patName = id => (PATS.find(p => p[0] === id) || PATS[0])[1];
const icon = id => { const sq = id === 'straight' || id === 'diag', res = layout(region(24, 24), { w: sq ? 6 : 8, h: sq ? 6 : 4 }, 1.2, id, { x: 1, y: 1 }); return `<svg viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">${res.tiles.map(t => t.parts.map(p => `<polygon points="${p.map(q => q.map(v => v.toFixed(1)).join(',')).join(' ')}"/>`).join('')).join('')}</svg>`; };
function makeChips(el, list, cur, onPick) {
  el.innerHTML = list.map(([id, name]) => `<button type="button" class="chip" data-id="${id}" aria-pressed="${id === cur}" title="${name}" aria-label="${name}">${icon(id)}</button>`).join('');
  el.onclick = e => { const b = e.target.closest('.chip'); if (!b) return; $$('.chip', el).forEach(c => c.setAttribute('aria-pressed', c === b)); onPick(b.dataset.id); };
}
const CITIES = ['Москва', 'Санкт-Петербург', 'Казань', 'Екатеринбург', 'Новосибирск', 'Краснодар'];
const SALONS = [[0, 'Керамика Холл', 'керамогранит 600 × 600'], [0, 'Плитка Дом', 'кабанчик, 300 × 600'], [1, 'Азулежу', 'метлахская 100 × 100'], [1, 'Гранит Сити', 'крупный формат'], [2, 'Мастер Керамик', 'под дерево 200 × 1200'], [3, 'Уральская плитка', 'керамогранит, мозаика'], [4, 'Сибирь Керамика', 'плитка и ламинат'], [5, 'Юг Керамика', 'кабанчик, мозаика']];

// ---------- рисование: canvas под DPR, плитки, подписи, стены и двери ----------
function fit(cv) {
  const dpr = Math.min(devicePixelRatio || 1, 2), w = cv.clientWidth || 300, h = cv.clientHeight || 150;
  if (cv.width !== Math.round(w * dpr) || cv.height !== Math.round(h * dpr)) { cv.width = Math.round(w * dpr); cv.height = Math.round(h * dpr); }
  const ctx = cv.getContext('2d'); ctx.setTransform(dpr, 0, 0, dpr, 0, 0); return { ctx, w, h };
}
const mapFor = (w, h, cw, ch, pad) => { const s = Math.min((w - pad * 2) / cw, (h - pad * 2) / ch); return { s, ox: (w - cw * s) / 2, oy: (h - ch * s) / 2 }; };
function pointIn(p, x, y) { let c = false; for (let i = 0, j = p.length - 1; i < p.length; j = i++) { const [xi, yi] = p[i], [xj, yj] = p[j]; if ((yi > y) !== (yj > y) && x < (xj - xi) * (y - yi) / (yj - yi) + xi) c = !c; } return c; }
function hitTile(res, x, y) { for (const t of res.tiles) { if (x < t.rb[0] || x > t.rb[2] || y < t.rb[1] || y > t.rb[3]) continue; for (const p of t.parts) if (pointIn(p, x, y)) return t; } return null; }
const doorSeg = (reg, d) => d.wall === 'bottom' ? [[d.pos, reg.h], [d.pos + d.width, reg.h]] : d.wall === 'top' ? [[d.pos, 0], [d.pos + d.width, 0]] : d.wall === 'left' ? [[0, d.pos], [0, d.pos + d.width]] : [[reg.w, d.pos], [reg.w, d.pos + d.width]];
// o: anim {t, order, step} · hover · labels · rows · dims · doors/sel · title · bg
function drawReg(ctx, reg, res, map, dx, dy, o) {
  const s = map.s, P = (x, y) => [map.ox + (x + dx) * s, map.oy + (y + dy) * s], bg = o.bg || MILK, C = t => [map.ox + ((t.rb[0] + t.rb[2]) / 2 + dx) * s, map.oy + ((t.rb[1] + t.rb[3]) / 2 + dy) * s];
  ctx.fillStyle = INK; for (const c of reg.cells) { const [X, Y] = P(c.x, c.y); ctx.fillRect(X, Y, c.w * s, c.h * s); }
  const labels = [];
  res.tiles.forEach((t, i) => {
    let k = 1, st = 0;
    if (o.anim) { st = o.anim.order[i] * o.anim.step; k = clamp((o.anim.t - st) / 180, 0, 1); if (k <= 0) return; }
    const [cx, cy] = C(t);
    ctx.save();
    if (k < 1) { const sc = 1.06 - .06 * ease(k); ctx.translate(cx, cy); ctx.transform(sc, 0, Math.tan(.035 * (1 - k)), sc, 0, 0); ctx.translate(-cx, -cy); }
    ctx.beginPath(); for (const p of t.parts) { p.forEach(([x, y], j) => { const [X, Y] = P(x, y); j ? ctx.lineTo(X, Y) : ctx.moveTo(X, Y); }); ctx.closePath(); }
    ctx.fillStyle = t.cut ? AMBER : (t.col + t.row + (t.rot ? 1 : 0)) & 1 ? TEAL2 : TEAL; ctx.fill();
    ctx.strokeStyle = INK; ctx.lineWidth = 1; ctx.stroke();
    if (o.anim) { const q = (o.anim.t - st) / 300; if (q > 0 && q < 1) { ctx.clip(); const r = Math.hypot(t.rb[2] - t.rb[0], t.rb[3] - t.rb[1]) * s; ctx.translate(cx, cy); ctx.rotate(-Math.PI / 4); ctx.fillStyle = 'rgba(255,255,255,.25)'; ctx.fillRect(-r + q * 2 * r - r * .12, -r, r * .24, 2 * r); } }
    else if (o.hover === t) { ctx.fillStyle = 'rgba(255,255,255,.22)'; ctx.fill(); }
    ctx.restore();
    if (k === 1 && (t.cut && o.labels || o.rows)) labels.push(t);
  });
  ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
  const seen = new Set();
  for (const t of labels) {
    const bw = (t.rb[2] - t.rb[0]) * s, bh = (t.rb[3] - t.rb[1]) * s, [cx, cy] = C(t), badge = o.rows && !seen.has(t.row) && bw >= 18 && bh >= 18;
    if (badge) { seen.add(t.row); const [X, Y] = P(t.rb[0], t.rb[1]); ctx.fillStyle = INK; ctx.fillRect(X + 2, Y + 2, 15, 15); ctx.fillStyle = MILK; ctx.font = '800 9px ' + FONT; ctx.fillText(res.rowNo.get(t.row), X + 9.5, Y + 10); }
    if (t.cut && o.labels) { // подпись размера; при номере ряда — чуть ниже, чтобы не наезжать
      const txt = fmtCm(t.dims[0]) + '×' + fmtCm(t.dims[1]); ctx.font = '700 11px ' + FONT; const tw = ctx.measureText(txt).width + 6, dy = badge ? 5 : 0; ctx.fillStyle = INK;
      if (bw >= tw && bh >= 13 + dy * 2) ctx.fillText(txt, cx, cy + dy); else if (bh >= tw && bw >= 13 + dy * 2) { ctx.save(); ctx.translate(cx + dy, cy); ctx.rotate(-Math.PI / 2); ctx.fillText(txt, 0, 0); ctx.restore(); }
    }
  }
  ctx.strokeStyle = INK; ctx.lineWidth = 2; const [X0, Y0] = P(0, 0); ctx.strokeRect(X0, Y0, reg.w * s, reg.h * s);
  for (const h of reg.holes) { // Г-вырез: внутренние стороны; проёмы: пунктир с подписью
    const [X, Y] = P(h.x, h.y), W = h.w * s, H = h.h * s; ctx.fillStyle = bg; ctx.fillRect(X - 1.5, Y - 1.5, W + 3, H + 3);
    if (h.kind) { ctx.lineWidth = 1; ctx.setLineDash([4, 3]); ctx.strokeRect(X, Y, W, H); ctx.setLineDash([]); if (W > 34 && H > 14) { ctx.fillStyle = INK; ctx.font = '700 11px ' + FONT; ctx.fillText(h.kind, X + W / 2, Y + H / 2); } }
    else { ctx.beginPath(); [[h.x > .01, X, Y, X, Y + H], [h.x + h.w < reg.w - .01, X + W, Y, X + W, Y + H], [h.y > .01, X, Y, X + W, Y], [h.y + h.h < reg.h - .01, X, Y + H, X + W, Y + H]].forEach(([ok, a, b, c, d]) => { if (ok) { ctx.moveTo(a, b); ctx.lineTo(c, d); } }); ctx.stroke(); }
  }
  if (o.doors) o.doors.forEach((d, i) => { // проём и створка двери
    const [a, b] = doorSeg(reg, d), A = P(...a), B = P(...b), r = d.width * s, ang = { bottom: [-Math.PI / 2, 0], top: [0, Math.PI / 2], left: [0, Math.PI / 2], right: [Math.PI / 2, Math.PI] }[d.wall], la = d.wall === 'bottom' ? -Math.PI / 2 : d.wall === 'top' ? Math.PI / 2 : d.wall === 'left' ? 0 : Math.PI;
    ctx.strokeStyle = bg; ctx.lineWidth = 5; ctx.beginPath(); ctx.moveTo(...A); ctx.lineTo(...B); ctx.stroke();
    ctx.strokeStyle = i === o.sel ? '#E3A33C' : TERRA; ctx.lineWidth = i === o.sel ? 3 : 2; ctx.beginPath(); ctx.arc(A[0], A[1], r, ang[0], ang[1]); ctx.moveTo(...A); ctx.lineTo(A[0] + Math.cos(la) * r, A[1] + Math.sin(la) * r); ctx.stroke();
  });
  ctx.fillStyle = INK; ctx.font = '700 12px ' + FONT;
  if (o.dims) { ctx.fillText(`${fmtCm(reg.w)} см`, X0 + reg.w * s / 2, Y0 - 12); ctx.save(); ctx.translate(X0 - 12, Y0 + reg.h * s / 2); ctx.rotate(-Math.PI / 2); ctx.fillText(`${fmtCm(reg.h)} см`, 0, 0); ctx.restore(); }
  if (o.title) { ctx.textAlign = 'left'; ctx.fillText(o.title, X0, Y0 - 12); }
}
const waveOrder = tiles => { const rank = []; tiles.map((t, i) => [Math.hypot(t.rb[0] + t.rb[2], t.rb[1] + t.rb[3]), i]).sort((a, b) => a[0] - b[0]).forEach(([, i], k) => rank[i] = k); return rank; };
function tipAt(tip, cv, map, res, e, dx = 0) { // тултип с размером плитки
  const r = cv.getBoundingClientRect(), px = e.clientX - r.left, py = e.clientY - r.top, t = res && hitTile(res, (px - map.ox) / map.s - dx, (py - map.oy) / map.s);
  tip.hidden = !t; if (t) { tip.textContent = (t.cut ? 'подрезка ' : '') + fmtCm(t.dims[0]) + ' × ' + fmtCm(t.dims[1]) + ' см · ряд ' + res.rowNo.get(t.row); tip.style.left = px + 'px'; tip.style.top = py + 'px'; }
  return t;
}

// ---------- hero: пол 240 × 180, волна укладки, блик глазури, счётчик ----------
const hero = { cv: E('hero-floor'), tip: E('hero-tip'), reg: region(240, 180), door: { wall: 'bottom', pos: 80, width: 80 }, tile: { w: 60, h: 30 }, g: 2, pat: 'half', res: null, anim: null, hover: null, map: null, shown: {} };
function heroLayout(animate) {
  const g = hero.g / 10; hero.res = layout(hero.reg, hero.tile, g, hero.pat, smart(hero.reg, hero.tile, g, hero.pat, hero.door).origin);
  hero.anim = animate && !RM ? { t: 0, order: waveOrder(hero.res.tiles), step: 18, t0: performance.now() } : null;
  const vals = { pieces: hero.res.pieces, packs: Math.ceil(hero.res.pieces / 6), waste: Math.round(hero.res.waste * 100) };
  $$('#hero-counter b').forEach(b => { const k = b.dataset.n, from = hero.shown[k] || 0; hero.shown[k] = vals[k]; tween(from, vals[k], 600, v => b.textContent = Math.round(v)); });
  heroDraw();
}
function heroDraw() {
  const { ctx, w, h } = fit(hero.cv); hero.map = mapFor(w, h, hero.reg.w, hero.reg.h, Math.max(16, w * .05));
  ctx.fillStyle = MILK; ctx.fillRect(0, 0, w, h); ctx.strokeStyle = 'rgba(42,42,42,.06)'; ctx.lineWidth = 1; ctx.beginPath(); // сетка швов 24 px
  for (let x = .5; x < w; x += 24) { ctx.moveTo(x, 0); ctx.lineTo(x, h); } for (let y = .5; y < h; y += 24) { ctx.moveTo(0, y); ctx.lineTo(w, y); } ctx.stroke();
  if (hero.anim) hero.anim.t = performance.now() - hero.anim.t0;
  drawReg(ctx, hero.reg, hero.res, hero.map, 0, 0, { anim: hero.anim, hover: hero.hover, labels: true, doors: [hero.door], sel: -1 });
  if (hero.anim) { if (hero.anim.t < hero.res.tiles.length * 18 + 300) requestAnimationFrame(heroDraw); else hero.anim = null; }
}
makeChips(E('hero-pats'), [['straight', 'прямая'], ['half', 'со смещением'], ['diag', 'диагональ'], ['herring45', 'ёлочка'], ['checker', 'шахматка']], 'half', id => { hero.pat = id; heroLayout(true); });
E('hero-grout').addEventListener('input', e => { hero.g = +e.target.value; E('hero-grout-v').textContent = hero.g + ' мм'; heroLayout(false); });
hero.cv.addEventListener('pointermove', e => { const t = tipAt(hero.tip, hero.cv, hero.map, hero.res, e); if (t !== hero.hover) { hero.hover = t; if (!hero.anim) heroDraw(); } });
hero.cv.addEventListener('pointerleave', () => { hero.tip.hidden = true; hero.hover = null; if (!hero.anim) heroDraw(); });

// ---------- демо: состояние ↔ форма ----------
const S = { mode: 'floor', w: 170, l: 240, shape: 'rect', corner: 'tl', cw: 60, cl: 80, fmt: 1, tw: 600, th: 600, pack: 4, rot: false, g: 2, pat: 'half', start: 'center', wall: 'top', z: 5, price: 0, dw: 80, win: false, bath: true, doors: [{ wall: 'bottom', pos: 45, width: 80 }], sel: 0 };
const BIND = [['w', 'room-w', 60, 1200], ['l', 'room-l', 60, 1200], ['corner', 'cut-corner'], ['cw', 'cut-w', 10, 1180], ['cl', 'cut-l', 10, 1180], ['dw', 'door-w', 40, 200], ['win', 'opt-window'], ['bath', 'opt-bath'], ['fmt', 'tile-sel', 0, 6], ['tw', 'tile-w', 20, 3000], ['th', 'tile-h', 20, 3000], ['pack', 'tile-pack', 1, 500], ['g', 'grout', 1, 10], ['z', 'reserve', 0, 15], ['price', 'price', 0, 1e7], ['wall', 'start-wall']]; // ключ, id поля, min, max
E('tile-sel').innerHTML = FORMATS.map((f, i) => `<option value="${i}">${f.name} · ${f.pack} шт/уп</option>`).join('') + '<option value="6">Свой размер</option>';
const tileOf = () => { const f = S.fmt < 6 ? FORMATS[S.fmt] : { w: S.tw / 10, h: S.th / 10, pack: S.pack, m2: S.pack * S.tw * S.th / 1e6 }; return { w: S.rot ? f.h : f.w, h: S.rot ? f.w : f.h, pack: f.pack, m2: f.m2 }; };
const tileName = () => S.fmt < 6 ? FORMATS[S.fmt].name : `${S.tw} × ${S.th}`;
const floorRegion = () => { const c = S.corner; return region(S.w, S.l, S.shape === 'l' ? [{ x: c === 'tr' || c === 'br' ? S.w - S.cw : 0, y: c === 'br' || c === 'bl' ? S.l - S.cl : 0, w: S.cw, h: S.cl }] : []); };
const labels = () => { E('grout-v').textContent = S.g + ' мм'; E('reserve-v').textContent = S.z + '%'; E('pat-name').textContent = patName(S.pat); E('custom-fields').hidden = S.fmt !== 6; };
function syncForm() {
  BIND.forEach(([k, id]) => { const el = E(id); if (el.type === 'checkbox') el.checked = S[k]; else el.value = k === 'price' && !S.price ? '' : S[k]; });
  $$('[data-mode],[data-shape],[data-start]').forEach(b => b.setAttribute('aria-pressed', b.dataset.mode === S.mode || b.dataset.shape === S.shape || b.dataset.start === S.start));
  $$('#pats .chip').forEach(c => c.setAttribute('aria-pressed', c.dataset.id === S.pat)); E('tile-rot').setAttribute('aria-pressed', S.rot);
  E('l-fields').hidden = S.shape !== 'l'; E('door-fields').hidden = S.mode !== 'floor'; E('wall-opts').hidden = S.mode !== 'walls'; E('wall-field').hidden = S.start !== 'wall'; labels();
}
function readForm() {
  BIND.forEach(([k, id, lo, hi]) => { const el = E(id); if (el.type === 'checkbox') S[k] = el.checked; else if (lo !== undefined) { const v = +el.value; if (!isNaN(v)) S[k] = clamp(v, lo, hi); } else S[k] = el.value; });
  S.cw = Math.min(S.cw, S.w - 20); S.cl = Math.min(S.cl, S.l - 20); if (S.doors[S.sel]) S.doors[S.sel].width = S.dw; labels();
}
makeChips(E('pats'), PATS, S.pat, id => { S.pat = id; labels(); update(); });
const form = E('form');
form.addEventListener('input', () => { readForm(); update(); });
form.addEventListener('submit', e => { e.preventDefault(); readForm(); update(); });
form.addEventListener('click', e => {
  const b = e.target.closest('[data-mode],[data-shape],[data-start],#tile-rot,#door-del'); if (!b) return;
  if (b.dataset.mode) S.mode = b.dataset.mode; else if (b.dataset.shape) S.shape = b.dataset.shape; else if (b.dataset.start) S.start = b.dataset.start; else if (b.id === 'tile-rot') S.rot = !S.rot;
  else if (S.doors.length) { S.doors.splice(S.sel >= 0 ? S.sel : S.doors.length - 1, 1); S.sel = S.doors.length - 1; toast(S.doors.length ? 'Дверь убрана' : 'Дверей нет. Кликните по стене, чтобы поставить'); }
  syncForm(); update();
});

// ---------- демо: расчёт пола или стен, числа и подрезки ----------
const sc = { cv: E('scene'), tip: E('scene-tip'), map: null, scene: null, hover: null, drag: null, out: null };
function wallItems(tile, g) { // развёртка 4 стен по 250 см: двери с плана, окно, ванна
  const names = ['top', 'right', 'bottom', 'left'], lens = [S.w, S.l, S.w, S.l], items = [], d0 = S.doors[0], winWall = d0 ? names.indexOf(OPP[d0.wall]) : 0, bathWall = S.l >= S.w ? 1 : 0; let dx = 0;
  lens.forEach((len, i) => {
    const holes = S.doors.filter(d => d.wall === names[i]).map(d => ({ x: names[i] === 'bottom' ? S.w - d.pos - d.width : names[i] === 'left' ? S.l - d.pos - d.width : d.pos, y: 40, w: d.width, h: 210, kind: 'дверь' }));
    if (S.win && i === winWall) holes.push({ x: len / 2 - 40, y: 60, w: 80, h: 100, kind: 'окно' });
    if (S.bath && i === bathWall) holes.push({ x: 0, y: 192, w: Math.min(170, len), h: 58, kind: 'ванна' });
    const reg = region(len, 250, holes), dh = holes[0]?.kind === 'дверь' ? holes[0] : null, door = dh && { wall: 'bottom', pos: dh.x, width: dh.w }, sm = smart(reg, tile, g, S.pat, door);
    const origin = S.start === 'smart' ? sm.origin : { x: S.start === 'door' && door ? door.pos + door.width / 2 - tile.w / 2 : S.start === 'center' ? len / 2 - tile.w / 2 : 0, y: 250 + g };
    items.push({ reg, res: layout(reg, tile, g, S.pat, origin), dx, dy: 0, title: `Стена ${i + 1} · ${len} см`, smart: sm.pieces }); dx += len + 24;
  });
  return { items, w: dx - 24, h: 250 };
}
function compute() {
  const tile = tileOf(), g = S.g / 10; let scene, sm, base;
  if (S.mode === 'floor') {
    const reg = floorRegion(), door = S.doors[S.sel] || S.doors[0], best = smart(reg, tile, g, S.pat, door);
    const res = layout(reg, tile, g, S.pat, S.start === 'smart' ? best.origin : startAt(S.start, reg, tile, g, door, S.wall));
    scene = { items: [{ reg, res, dx: 0, dy: 0 }], w: reg.w, h: reg.h }; sm = best.pieces; base = S.start === 'smart' ? layout(reg, tile, g, S.pat, startAt('wall', reg, tile, g, door, S.wall), true).pieces : res.pieces;
  } else { scene = wallItems(tile, g); sm = scene.items.reduce((s, it) => s + it.smart, 0); base = scene.items.reduce((s, it) => s + it.res.pieces, 0); }
  const sum = f => scene.items.reduce((s, it) => s + f(it), 0), pieces = sum(it => it.res.pieces), packs = Math.ceil(pieces * (1 + S.z / 100) / tile.pack);
  sc.scene = scene; sc.out = { tile, pieces, packs, area: sum(it => it.reg.area) / 1e4, waste: pieces ? Math.max(0, 1 - sum(it => it.res.covered) / (pieces * tile.w * tile.h)) : 0, cost: S.price ? packs * tile.m2 * S.price : 0, smart: sm, base, cuts: sum(it => it.res.cuts), reused: sum(it => it.res.reused), narrow: sum(it => it.res.narrow) };
}
const shown = {}, setStat = (id, v, fmt) => { const el = E(id), from = shown[id] ?? v; shown[id] = v; tween(from, v, 600, x => el.textContent = fmt(x)); };
const cutRows = () => sc.scene.items.flatMap((it, i) => cutList(it.res, S.mode === 'walls' ? `Стена ${i + 1}, ряд ` : 'Ряд '));
function render() {
  const o = sc.out, t = o.tile;
  setStat('s-pieces', o.pieces, fmtN); setStat('s-packs', o.packs, fmtN); setStat('s-area', o.area, fmt1); setStat('s-waste', o.waste * 100, v => Math.round(v) + '%');
  E('s-packs-sub').textContent = `упаковок по ${t.pack} шт · ${fmt1(o.packs * t.m2, 2)} м²`;
  if (o.cost) setStat('s-cost', o.cost, v => fmtN(v) + ' ₽'); else { E('s-cost').textContent = '—'; delete shown['s-cost']; }
  const n = E('smart-note'), diff = o.base - o.smart, ap = '<button type="button" class="chip-text" id="apply-smart">Применить умный старт</button>';
  n.className = 'smart-note' + (S.start === 'smart' || diff <= 0 ? ' ok' : '');
  n.innerHTML = S.start === 'smart' ? `<span>Умный старт: <b>${o.pieces} плиток</b>${diff > 0 ? ` вместо ${o.base} от стены — на ${diff} меньше` : ' — столько же, сколько от стены, но края ровнее'}${o.narrow ? '' : ', узких подрезок нет'}.</span>`
    : diff > 0 ? `<span>Умный старт даст <b>${o.smart} плиток</b> вместо ${o.pieces} — на ${diff} меньше.</span>${ap}` : `<span>По штукам ваш старт уже лучший${o.narrow ? `, но ${o.narrow} узких подрезок — попробуйте умный старт` : ', узких подрезок нет'}.</span>${o.narrow ? ap : ''}`;
  const apb = E('apply-smart'); if (apb) apb.onclick = () => { S.start = 'smart'; syncForm(); update(); };
  const rows = cutRows();
  E('cuts-body').innerHTML = rows.slice(0, 14).map(r => `<tr${r.narrow ? ' class="warn"' : ''}><td>${r.row}</td><td>${fmtCm(r.a)} × ${fmtCm(r.b)}${r.narrow ? ' · узкая' : ''}</td><td>${r.n}</td></tr>`).join('') + (rows.length > 14 ? `<tr class="more"><td colspan="3">и ещё ${rows.length - 14} позиций — все есть в PDF</td></tr>` : '') || '<tr><td colspan="3" class="muted">Подрезок нет — плитка легла целиком</td></tr>';
  E('cuts-sum').textContent = `${o.cuts} шт, ${o.reused} закрыты остатками${o.narrow ? `, ${o.narrow} узких` : ''}`;
  sc.cv.style.aspectRatio = S.mode === 'walls' ? '16/7' : sc.scene.w >= sc.scene.h ? '4/3' : '1/1'; // пропорция холста под комнату
  sceneDraw();
}
function sceneDraw() {
  const { ctx, w, h } = fit(sc.cv), scene = sc.scene; ctx.fillStyle = MILK; ctx.fillRect(0, 0, w, h); sc.map = mapFor(w, h, scene.w, scene.h, Math.max(26, w * .06));
  for (const it of scene.items) drawReg(ctx, it.reg, it.res, sc.map, it.dx, it.dy, { hover: sc.hover, labels: true, rows: true, dims: S.mode === 'floor', title: it.title, doors: S.mode === 'floor' ? S.doors : null, sel: S.sel });
}
let pending = 0, hashT;
function update() { if (pending) return; pending = requestAnimationFrame(() => { pending = 0; compute(); render(); clearTimeout(hashT); hashT = setTimeout(syncHash, 400); }); } // пересчёт и перерисовка за один кадр
// двери: клик по стене ставит проём, по двери — выбирает, тянуть вдоль стены
const sceneXY = e => { const r = sc.cv.getBoundingClientRect(); return [(e.clientX - r.left - sc.map.ox) / sc.map.s, (e.clientY - r.top - sc.map.oy) / sc.map.s]; };
const nearWall = (x, y, tol) => { let best = null; for (const [wall, d, p, len] of [['top', y, x, S.w], ['bottom', S.l - y, x, S.w], ['left', x, y, S.l], ['right', S.w - x, y, S.l]]) if (Math.abs(d) <= tol && p >= -tol && p <= len + tol && (!best || Math.abs(d) < best.d)) best = { wall, d: Math.abs(d), pos: p, len }; return best; };
const doorAt = (x, y, tol) => S.doors.findIndex(d => { const horiz = d.wall === 'top' || d.wall === 'bottom', along = horiz ? x : y, perp = horiz ? (d.wall === 'top' ? y : S.l - y) : (d.wall === 'left' ? x : S.w - x); return Math.abs(perp) <= tol && along >= d.pos - 3 && along <= d.pos + d.width + 3; });
sc.cv.addEventListener('pointerdown', e => {
  if (S.mode !== 'floor' || !sc.map) return; const [x, y] = sceneXY(e), tol = 12 / sc.map.s, i = doorAt(x, y, tol);
  if (i >= 0) { S.sel = i; S.dw = S.doors[i].width; E('door-w').value = S.dw; sc.drag = i; sc.cv.setPointerCapture(e.pointerId); update(); return; }
  const wl = nearWall(x, y, tol); if (!wl) return;
  if (S.doors.length >= 3) return toast('Больше трёх дверей в одной комнате не бывает');
  S.doors.push({ wall: wl.wall, pos: clamp(wl.pos - S.dw / 2, 0, wl.len - S.dw), width: S.dw }); S.sel = S.doors.length - 1; update(); toast('Дверь поставлена. Тяните её вдоль стены');
});
sc.cv.addEventListener('pointermove', e => {
  if (!sc.map) return;
  if (sc.drag !== null) { const [x, y] = sceneXY(e), d = S.doors[sc.drag], horiz = d.wall === 'top' || d.wall === 'bottom'; d.pos = clamp((horiz ? x : y) - d.width / 2, 0, (horiz ? S.w : S.l) - d.width); update(); return; }
  const x = sceneXY(e)[0], it = sc.scene.items.find(it => x >= it.dx && x <= it.dx + it.reg.w) || sc.scene.items[0], t = tipAt(sc.tip, sc.cv, sc.map, it.res, e, it.dx);
  if (t !== sc.hover) { sc.hover = t; sceneDraw(); }
});
const dragEnd = () => { sc.drag = null; syncHash(); };
sc.cv.addEventListener('pointerup', dragEnd); sc.cv.addEventListener('pointercancel', dragEnd);
sc.cv.addEventListener('pointerleave', () => { sc.tip.hidden = true; sc.hover = null; sceneDraw(); });

// ---------- параметры в ссылке, проекты в localStorage ----------
const HK = ['mode', 'w', 'l', 'shape', 'corner', 'cw', 'cl', 'fmt', 'tw', 'th', 'pack', 'rot', 'g', 'pat', 'start', 'wall', 'z', 'price', 'win', 'bath'];
const toHash = () => { const p = new URLSearchParams(); HK.forEach(k => p.set(k, typeof S[k] === 'boolean' ? +S[k] : S[k])); p.set('d', S.doors.map(d => `${d.wall}:${Math.round(d.pos)}:${d.width}`).join(';')); return p.toString(); };
function fromHash(h) {
  const p = new URLSearchParams(h.replace(/^#/, '')); if (!p.has('w')) return;
  HK.forEach(k => { if (!p.has(k)) return; const v = p.get(k); if (typeof S[k] === 'number') { if (!isNaN(+v)) S[k] = +v; } else S[k] = typeof S[k] === 'boolean' ? v === '1' : v; });
  S.doors = (p.get('d') || '').split(';').filter(Boolean).map(s => { const [wall, pos, width] = s.split(':'); return { wall, pos: +pos || 0, width: +width || 80 }; }).slice(0, 3); S.sel = S.doors.length - 1;
}
const syncHash = () => { try { history.replaceState(null, '', '#' + toHash()); } catch {} };
E('link').onclick = () => { syncHash(); const url = location.href; (navigator.clipboard ? navigator.clipboard.writeText(url) : Promise.reject()).then(() => toast('Ссылка с параметрами скопирована'), () => prompt('Скопируйте ссылку', url)); };
const PK = 'raskladka:projects', projList = E('projects');
const renderProjects = () => projList.innerHTML = LS.get(PK, []).map(p => `<li><b>${esc(p.name)}</b><span class="muted">${p.w} × ${p.l} · ${esc(p.tile)} · ${patName(p.pat)}</span><button type="button" data-open="${p.id}" aria-label="Открыть проект ${esc(p.name)}">Открыть</button><button type="button" data-del="${p.id}" aria-label="Удалить проект ${esc(p.name)}">Удалить</button></li>`).join('');
E('save').onclick = () => { // запись проекта: id, name, комната, двери, плитка, шов, схема, старт, запас, цена
  const name = E('proj-name').value.trim() || `Проект от ${new Date().toLocaleDateString('ru-RU')}`, list = LS.get(PK, []);
  list.unshift({ ...S, id: Date.now(), name, tile: tileName() }); LS.set(PK, list.slice(0, 20)); E('proj-name').value = ''; renderProjects(); toast(`Проект «${name}» сохранён в этом браузере`);
};
projList.onclick = e => {
  const b = e.target.closest('button'); if (!b) return; const list = LS.get(PK, []);
  if (b.dataset.del) { LS.set(PK, list.filter(p => p.id !== +b.dataset.del)); renderProjects(); return toast('Проект удалён'); }
  const p = list.find(x => x.id === +b.dataset.open); if (!p) return;
  HK.forEach(k => S[k] = p[k]); S.doors = p.doors || []; S.sel = S.doors.length - 1; syncForm(); update(); toast(`Проект «${p.name}» открыт`); goDemo();
};

// ---------- PNG схемы и лист A4 ----------
const title = () => `${S.mode === 'floor' ? 'Пол' : 'Стены ванной'} ${S.w} × ${S.l} см · плитка ${tileName()} · ${patName(S.pat)} · шов ${S.g} мм`;
const line = () => { const o = sc.out; return `${o.pieces} плиток · ${o.packs} упаковок по ${o.tile.pack} шт · площадь ${fmt1(o.area)} м² · отходы ${Math.round(o.waste * 100)}% · запас ${S.z}%${o.cost ? ` · ${fmtN(o.cost)} ₽` : ''}`; };
function exportCanvas(wm) {
  const scene = sc.scene, W = 1600, pad = 100, s = Math.min((W - pad * 2) / scene.w, 1000 / scene.h), H = Math.round(scene.h * s + pad * 2 + 40), cv = document.createElement('canvas');
  cv.width = W; cv.height = H; const ctx = cv.getContext('2d'); ctx.fillStyle = '#fff'; ctx.fillRect(0, 0, W, H);
  const map = { s, ox: (W - scene.w * s) / 2, oy: pad + 40 };
  for (const it of scene.items) drawReg(ctx, it.reg, it.res, map, it.dx, it.dy, { labels: true, rows: true, dims: S.mode === 'floor', title: it.title, doors: S.mode === 'floor' ? S.doors : null, sel: -1, bg: '#fff' });
  ctx.fillStyle = INK; ctx.textAlign = 'left'; ctx.textBaseline = 'alphabetic'; ctx.font = '700 28px ' + FONT; ctx.fillText(title(), pad, 52); ctx.font = '600 20px ' + FONT; ctx.fillText(line(), pad, 86);
  if (wm) { ctx.fillStyle = 'rgba(42,42,42,.4)'; ctx.font = '800 22px ' + FONT; ctx.textAlign = 'right'; ctx.fillText('Раскладка · бесплатный план', W - pad, H - 28); }
  return cv;
}
E('png').onclick = () => { const a = document.createElement('a'); a.download = 'raskladka.png'; a.href = exportCanvas(true).toDataURL('image/png'); a.click(); toast('PNG скачан. Без водяного знака — в PDF-схеме за 390 ₽'); };
function printSheet() {
  const o = sc.out, sheet = E('print-sheet');
  sheet.innerHTML = `<div class="brand"><h1>${esc(E('brand').value.trim() || 'Раскладка')}</h1><span>${new Date().toLocaleDateString('ru-RU')}</span></div><p>${esc(title())}</p><p><b>Купить: ${o.packs} упаковок</b> (${o.pieces} плиток, из них подрезок ${o.cuts}, остатками закрыты ${o.reused}; запас ${S.z}%)</p><img src="${exportCanvas(false).toDataURL('image/png')}" alt="Схема раскладки с номерами рядов"><h2>Подрезки</h2><table><tr><th>Ряд</th><th>Размер, см</th><th>Шт.</th></tr>${cutRows().map(r => `<tr><td>${r.row}</td><td>${fmtCm(r.a)} × ${fmtCm(r.b)}</td><td>${r.n}</td></tr>`).join('')}</table>`;
  sheet.setAttribute('aria-hidden', 'false'); toast('В диалоге печати выберите «Сохранить как PDF»'); setTimeout(() => window.print(), 300);
}
E('pdf').onclick = printSheet; E('pro-pdf').onclick = printSheet; E('buy-pdf').onclick = () => { goDemo(); printSheet(); };
E('buy-pro').onclick = () => { S.mode = 'walls'; syncForm(); update(); goDemo(); toast('«Мастер» на 7 дней: включили развёртки стен ванной'); };
E('brand').value = LS.get('raskladka:brand', ''); E('brand').addEventListener('input', e => LS.set('raskladka:brand', e.target.value));

// ---------- умный старт: до/после, ванная 155 × 245 ----------
const ba = { reg: region(155, 245), tile: { w: 30, h: 60 }, door: { wall: 'bottom', pos: 37.5, width: 80 } };
ba.before = layout(ba.reg, ba.tile, .2, 'half', startAt('wall', ba.reg, ba.tile, .2, ba.door, 'top'));
ba.after = layout(ba.reg, ba.tile, .2, 'half', smart(ba.reg, ba.tile, .2, 'half', ba.door).origin);
const strip = Math.min(99, ...ba.before.tiles.filter(t => t.cut && t.rb[3] > 244 && t.rb[2] > 37 && t.rb[0] < 118).map(t => t.rb[3] - t.rb[1]));
E('ba-before-txt').textContent = `${ba.before.pieces} плиток, ${ba.before.narrow} узких подрезок, у двери полоски ${fmtCm(strip)} см`;
E('ba-after-txt').textContent = `${ba.after.pieces} плиток, ${ba.after.narrow ? ba.after.narrow + ' узких подрезок' : 'узких подрезок нет'}, у двери целые плитки`;
E('ba-delta').textContent = (ba.after.pieces < ba.before.pieces ? '−' : '') + (ba.before.pieces - ba.after.pieces);
const baDraw = () => [['ba-before', ba.before], ['ba-after', ba.after]].forEach(([id, res]) => { const { ctx, w, h } = fit(E(id)); ctx.fillStyle = MILK; ctx.fillRect(0, 0, w, h); drawReg(ctx, ba.reg, res, mapFor(w, h, ba.reg.w, ba.reg.h, 22), 0, 0, { labels: true, doors: [ba.door], sel: -1 }); });

// ---------- каталог и салоны ----------
const fmtGrid = E('fmt-grid');
fmtGrid.onclick = e => { const b = e.target.closest('[data-use]'); if (!b) return; S.fmt = +b.dataset.use; S.rot = false; syncForm(); update(); goDemo(); toast(`${FORMATS[S.fmt].name} подставлен в планировщик`); };
const salons = city => { E('cities').innerHTML = CITIES.map((c, i) => `<button type="button" class="chip-text" data-c="${i}" aria-pressed="${i === city}">${c}</button>`).join(''); E('salons').innerHTML = SALONS.filter(s => s[0] === city).map(s => `<li><span>${s[1]}</span><span class="muted">${s[2]}</span></li>`).join(''); };
E('cities').onclick = e => { const b = e.target.closest('button'); if (b) salons(+b.dataset.c); };

// ---------- старт ----------
try { fromHash(location.hash); } catch {}
syncForm(); renderProjects(); update(); heroLayout(true); baDraw(); salons(0); revealAll();
let rz; addEventListener('resize', () => { cancelAnimationFrame(rz); rz = requestAnimationFrame(() => { if (!hero.anim) heroDraw(); if (sc.scene) sceneDraw(); baDraw(); }); });
