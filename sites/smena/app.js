/* Смена: табло сплит-флэп, решатель смен (жадный проход + отжиг в Web Worker), сетка с drag, экспорт */
(() => {
'use strict';
const $ = (s, r = document) => r.querySelector(s), $$ = (s, r = document) => [...r.querySelectorAll(s)], on = (el, t, fn, o) => el.addEventListener(t, fn, o);
const reduced = matchMedia('(prefers-reduced-motion: reduce)').matches;
const ROLES = [{ n: 'бариста', c: '#F2B134' }, { n: 'кассир', c: '#86C5F0' }, { n: 'повар', c: '#E88A6A' }, { n: 'администратор', c: '#B59BE0' }];
const WD = ['Пн', 'Вт', 'Ср', 'Чт', 'Пт', 'Сб', 'Вс'];
const EX = [['Аня', 0, 40], ['Марат', 0, 30, [0]], ['Лена', 1, 40], ['Игорь', 2, 40], ['Оля', 2, 30, [5, 6]], ['Дима', 3, 40], ['Катя', 0, 20, [6]], ['Саша', 1, 30], ['Нина', 2, 40, [], [10, 16]], ['Рома', 0, 40], ['Вика', 3, 30], ['Тимур', 1, 20]];
const EMPTY = '#16241C';
const pad = n => String(n).padStart(2, '0'), esc = s => String(s).replace(/[&<>"]/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]));
const fmt = n => String(Math.round(n)).replace(/\B(?=(\d{3})+(?!\d))/g, ' ');
const ru = n => String(n).replace('.', ',');
const pl = (n, a, b, c) => { const m = n % 100, k = n % 10; return m > 10 && m < 20 ? c : k === 1 ? a : k > 1 && k < 5 ? b : c; }; // 1 смена, 2 смены, 5 смен

// ---- reveal по прокрутке, count-up ----
const seen = new WeakSet();
const onIn = el => { if (seen.has(el)) return; seen.add(el); $$('[data-count]', el).forEach(e => countUp(e)); if (el.matches('[data-count]')) countUp(el); };
const revealAll = () => { const h = innerHeight; $$('.reveal:not(.in)').forEach(el => { if (el.getBoundingClientRect().top < h * .92) { el.classList.add('in'); onIn(el); } }); };
on(window, 'scroll', revealAll, { passive: true }); on(window, 'resize', revealAll); revealAll(); setTimeout(revealAll, 300);
function countUp(el, from = 0, dur = 650) {
  const end = parseFloat(el.dataset.count); if (!isFinite(end) || !(dur > 0) || reduced) return; // защита от forEach(countUp): текст из HTML остаётся
  const t0 = performance.now(); cancelAnimationFrame(el.raf);
  const step = t => { const k = Math.min(1, (t - t0) / dur), e = 1 - Math.pow(1 - k, 3); el.textContent = fmt(from + (end - from) * e); if (k < 1) el.raf = requestAnimationFrame(step); };
  el.raf = requestAnimationFrame(step);
}

// ---- навигация ----
const nav = $('#nav'), burger = $('#burger');
on(burger, 'click', () => { const o = nav.classList.toggle('open'); burger.setAttribute('aria-expanded', o); });
on($('#menu'), 'click', () => { nav.classList.remove('open'); burger.setAttribute('aria-expanded', 'false'); });

// ---- звук щелчка: Web Audio, шум 20 мс, по умолчанию выключен ----
let ac = null, sound = false, lastClick = 0;
function click() {
  const now = performance.now(); if (!sound || now - lastClick < 28) return; lastClick = now;
  try {
    ac = ac || new AudioContext();
    const n = ac.sampleRate * .02 | 0, buf = ac.createBuffer(1, n, ac.sampleRate), d = buf.getChannelData(0);
    for (let i = 0; i < n; i++) d[i] = (Math.random() * 2 - 1) * (1 - i / n) ** 2;
    const src = ac.createBufferSource(), g = ac.createGain(); src.buffer = buf; g.gain.value = .35; src.connect(g); g.connect(ac.destination); src.start();
  } catch (e) { /* тишина */ }
}
const snd = $('#snd');
on(snd, 'click', () => { sound = !sound; snd.setAttribute('aria-pressed', sound); snd.textContent = 'Звук щелчков: ' + (sound ? 'вкл' : 'выкл'); if (sound) { lastClick = 0; click(); } });

// ---- перекидная пластинка: две половины + вращающийся лист ----
function makeCell(txt) {
  const el = document.createElement('div'); el.className = 'cell' + (txt ? ' txt' : '');
  const sp = txt ? '<span></span>' : '';
  el.innerHTML = `<div class="h u">${sp}</div><div class="h d">${sp}</div><div class="lf"><div class="f">${sp}</div><div class="b">${sp}</div></div>`;
  const lf = el.children[2];
  return { el, u: el.children[0], d: el.children[1], lf, f: lf.children[0], b: lf.children[1], txt, cur: null, pend: null, t: 0 };
}
const setFace = (face, s, txt) => { face.style.background = s.c; if (txt) face.firstChild.textContent = s.t || ''; };
const same = (a, b) => a && b && a.c === b.c && a.t === b.t;
function settle(c) { const s = c.pend; if (!s) return; setFace(c.d, s, c.txt); setFace(c.f, s, c.txt); c.lf.style.transition = 'none'; c.el.classList.remove('go'); void c.lf.offsetWidth; c.lf.style.transition = ''; c.pend = null; }
function flip(c, next, inst) {
  if (same(c.cur, next)) return;
  if (c.t) { clearTimeout(c.t); c.t = 0; settle(c); }
  if (inst || reduced) { [c.u, c.d, c.f, c.b].forEach(f => setFace(f, next, c.txt)); c.cur = next; return; }
  setFace(c.u, next, c.txt); setFace(c.f, c.cur || next, c.txt); setFace(c.b, next, c.txt); c.pend = next; c.cur = next;
  c.el.classList.add('go'); click();
  c.t = setTimeout(() => { c.t = 0; settle(c); }, 370);
}

// ---- hero: табло 12×14 (8×7 на мобильном), цикл хаос → решение ----
const board = $('#board'), strip = $('#strip'), violN = $('#viol-n'), solved = $('#solved'), cap = $('.hero .eyebrow');
const mobileMQ = matchMedia('(max-width: 700px)');
let cells = [], rows = 12, cols = 14, timers = [], cycleT = 0, rnd = Math.random;
const roleOf = i => EX[i][1];
const pattern = (r, d) => (r % 3 === 2) ? (d % 7 < 5) : (Math.floor((d + r % 4) / 2) % 2 === 0); // 5/2 и 2/2 со сдвигом
const stateOf = (r, d) => pattern(r, d) ? { c: ROLES[roleOf(r)].c } : { c: EMPTY };
const clearTimers = () => { timers.forEach(clearTimeout); timers = []; clearTimeout(cycleT); cancelAnimationFrame(violN.raf); };
const later = (fn, ms) => timers.push(setTimeout(fn, ms));
function buildBoard() {
  clearTimers(); cells = []; const mob = mobileMQ.matches; rows = mob ? 8 : 12; cols = mob ? 7 : 14;
  cap.textContent = `Табло · ${rows} сотрудников · ${cols} дней${mob ? '' : ' · ноябрь 2026'}`;
  board.innerHTML = ''; strip.innerHTML = '';
  const frag = document.createDocumentFragment();
  const div = (cls, txt) => { const e = document.createElement('div'); e.className = cls; e.textContent = txt; return frag.appendChild(e); };
  div('rl', ''); for (let d = 0; d < cols; d++) div('ch', d + 1);
  for (let r = 0; r < rows; r++) {
    div('rl', EX[r][0]);
    for (let d = 0; d < cols; d++) { const c = makeCell(false); c.row = r; c.col = d; flip(c, stateOf(r, d), true); frag.appendChild(c.el); cells.push(c);
      on(c.el, 'click', () => { c.k = ((c.k ?? roleOf(r)) + 1) % 5; flip(c, c.k === 4 ? { c: EMPTY } : { c: ROLES[c.k].c }); }); }
  }
  board.appendChild(frag);
  strip.innerHTML = '<i style="background:transparent"></i>' + '<i class="ok"></i>'.repeat(cols);
  measure(); violN.textContent = '0'; solved.classList.remove('dim');
  if (!reduced) cycleT = setTimeout(cycle, 2200);
}
function measure() { cells.forEach(c => { const e = c.el; c.cx = e.offsetLeft + e.offsetWidth / 2; c.cy = e.offsetTop + e.offsetHeight / 2; }); }
function cycle() {
  // хаос: случайные роли и пустые ячейки; через 2 с — решение каскадом, полоска зеленеет, счётчик 14 → 0 за 1,2 с
  cells.forEach(c => { const k = rnd(); later(() => flip(c, k < .3 ? { c: EMPTY } : { c: ROLES[Math.floor(rnd() * 4)].c }), rnd() * 450); });
  $$('i', strip).forEach((i, k) => { if (k) later(() => i.classList.remove('ok'), k * 30); });
  violN.dataset.count = 14; countUp(violN, 0, 450); solved.classList.add('dim');
  later(() => {
    cells.forEach(c => later(() => flip(c, stateOf(c.row, c.col)), c.col * 80 + c.row * 25));
    $$('i', strip).forEach((i, k) => { if (k) later(() => i.classList.add('ok'), (k - 1) * 80 + 320); });
    violN.dataset.count = 0; countUp(violN, 14, 1200); later(() => solved.classList.remove('dim'), 1300);
  }, 2000);
  cycleT = setTimeout(cycle, 6000);
}
// курсор встряхивает пластинки в радиусе 90 px (±6°)
let shakeRaf = 0, px = 0, py = 0;
on(board, 'pointermove', e => {
  if (reduced) return; const b = board.getBoundingClientRect(); px = e.clientX - b.left; py = e.clientY - b.top;
  if (shakeRaf) return;
  shakeRaf = requestAnimationFrame(() => { shakeRaf = 0; cells.forEach(c => { const dx = c.cx - px, dy = c.cy - py, d2 = dx * dx + dy * dy; if (d2 < 8100) { const k = 1 - Math.sqrt(d2) / 90; c.el.style.transform = `rotateX(${(dy < 0 ? -6 : 6) * k}deg)`; c.shaken = true; } else if (c.shaken) { c.shaken = false; c.el.style.transform = ''; } }); });
});
on(board, 'pointerleave', () => cells.forEach(c => { if (c.shaken) { c.shaken = false; c.el.style.transform = ''; } }));
buildBoard();
on(mobileMQ, 'change', buildBoard); on(window, 'resize', measure);
on(document, 'visibilitychange', () => { if (document.hidden) clearTimers(); else if (!reduced) cycleT = setTimeout(cycle, 800); });

// ---- «Для кого»: строка-табло с перелистыванием слов ----
const who = $('#who'), WORDS = ['КАФЕ', 'ПЕКАРНИ', 'АПТЕКИ', 'САЛОНА', 'КЛИНИКИ', 'МАГАЗИНА'];
const letters = Array.from({ length: 8 }, () => { const c = makeCell(true); who.appendChild(c.el); flip(c, { c: EMPTY, t: '' }, true); return c; });
let wi = 0;
function showWord(w, inst) { [...w.padEnd(8)].forEach((ch, k) => setTimeout(() => flip(letters[k], { c: EMPTY, t: ch.trim() }, inst), inst ? 0 : k * 60)); }
showWord(WORDS[0], true);
if (!reduced) setInterval(() => { if (document.hidden) return; wi = (wi + 1) % WORDS.length; showWord(WORDS[wi]); }, 2600);

// ---- ядро решателя: общее для Web Worker и главного потока ----
const CORE = function () {
  function mulberry32(seed) { let a = seed | 0; return function () { a = a + 0x6D2B79F5 | 0; let t = Math.imul(a ^ a >>> 15, 1 | a); t = t + Math.imul(t ^ t >>> 7, 61 | t) ^ t; return ((t ^ t >>> 14) >>> 0) / 4294967296; }; }
  const templates = P => { const t = []; for (let s = P.open; s + P.L <= P.close; s += 2) t.push(s); return t; };
  const onVac = (em, d) => !!(em.vac && d + 1 >= em.vac[0] && d + 1 <= em.vac[1]), sr = em => em.role % 3 === 0; // старший: бариста или администратор
  const blocks = N => (N % 7 && N % 7 < 4) ? Math.floor(N / 7) : Math.ceil(N / 7), bDays = (N, b) => b < blocks(N) - 1 ? 7 : N - 7 * (blocks(N) - 1), bOf = (N, d) => Math.min(d / 7 | 0, blocks(N) - 1);
  // стоимость = 10·дыры + 5·переработка + 3·нежелательные дни + 8·отдых < 12 ч + σ
  function evaluate(P, sh, detail) {
    const { E, N, open, close, L, need, emps, wd0 } = P, H = close - open;
    const cov = new Int16Array(H), sen = new Uint8Array(H), hours = new Array(E).fill(0), dayCov = new Array(N), dayHole = new Array(N), items = detail ? [] : null;
    let unc = 0, over = 0, bad = 0, rest = 0;
    for (let d = 0; d < N; d++) {
      cov.fill(0); sen.fill(0);
      for (let e = 0; e < E; e++) {
        const s = sh[e * N + d]; if (s < 0) continue; const em = emps[e]; hours[e] += L;
        for (let h = s - open, hh = h + L; h < hh; h++) { cov[h]++; if (sr(em)) sen[h] = 1; }
        if (em.bad[(wd0 + d) % 7]) { bad++; if (items) items.push({ d, e, k: 'bad', t: 'нежелательный день' }); }
        if (d > 0) { const p = sh[e * N + d - 1]; if (p >= 0) { const gap = s + 24 - (p + L); if (gap < 12) { rest++; if (items) items.push({ d, e, k: 'rest', t: 'отдых ' + gap + ' ч' }); } } }
      }
      let needH = 0, okH = 0, u = 0, noSen = 0;
      for (let h = 0; h < H; h++) { const n = need[h], c = cov[h]; if (n > 0) { needH++; if (c >= n && sen[h]) okH++; } if (c < n) u += n - c; else if (n > 0 && !sen[h]) { u++; noSen++; } }
      unc += u; dayCov[d] = needH ? okH / needH : 1; dayHole[d] = u;
      if (items && u > 0) items.push({ d, e: -1, k: 'unc', t: 'не хватает ' + u + ' чел.-ч' + (noSen ? ', без старшего ' + noSen + ' ч' : '') });
    }
    const NB = blocks(N); for (let e = 0; e < E; e++) for (let b = 0; b < NB; b++) {
      const from = b * 7, days = bDays(N, b); let hrs = 0; for (let d = from; d < from + days; d++) if (sh[e * N + d] >= 0) hrs += L;
      const norm = emps[e].norm * days / 7; if (hrs > norm + 1e-6) { over += hrs - norm; if (items) items.push({ d: from, e, k: 'over', t: 'переработка ' + Math.round(hrs - norm) + ' ч за ' + (from + 1) + '–' + (from + days) }); }
    }
    const dev = hours.map((h, e) => h - emps[e].norm * N / 7), m = dev.reduce((a, v) => a + v, 0) / (E || 1), sd = Math.sqrt(dev.reduce((a, x) => a + (x - m) ** 2, 0) / (E || 1));
    return { cost: 10 * unc + 5 * over + 3 * bad + 8 * rest + sd, unc, over, bad, rest, sd, hours, dayCov, dayHole, items };
  }
  // жадный проход: смена с максимальным покрытием дефицита, кандидат по цене штрафов
  function greedy(P, sh, rnd) {
    const { E, N, open, L, need, emps, wd0 } = P, H = P.close - open, T = templates(P); if (!T.length) return;
    const cov = new Int16Array(H), sen = new Uint8Array(H), hb = new Float64Array(E * 5);
    for (let e = 0; e < E; e++) for (let d = 0; d < N; d++) if (sh[e * N + d] >= 0) hb[e * 5 + bOf(N, d)] += L;
    for (let d = 0; d < N; d++) {
      cov.fill(0); sen.fill(0); const blk = bOf(N, d), days = bDays(N, blk);
      for (let e = 0; e < E; e++) { const s = sh[e * N + d]; if (s >= 0) for (let h = s - open, hh = h + L; h < hh; h++) { cov[h]++; if (sr(emps[e])) sen[h] = 1; } }
      for (let guard = 0; guard < E; guard++) {
        let best = -1, bg = 0, bs = 0;
        for (const s of T) { let g = 0, gs = 0; for (let h = s - open, hh = h + L; h < hh; h++) { if (cov[h] < need[h]) g++; else if (need[h] > 0 && !sen[h]) gs++; } if (g + gs * .5 > bg + bs * .5) { best = s; bg = g; bs = gs; } }
        if (best < 0) break;
        let pick = -1, ps = 1e9;
        for (let e = 0; e < E; e++) {
          const i = e * N + d, em = emps[e]; if (sh[i] >= 0 || P.frozen[i] || onVac(em, d)) continue;
          const gain = 10 * (bg + (sr(em) ? bs : 0)); if (!gain) continue;
          const prev = d > 0 ? sh[i - 1] : -1, next = d < N - 1 ? sh[i + 1] : -1; let extra = 0;
          if (prev >= 0 && best + 24 - (prev + L) < 12) extra += 8; if (next >= 0 && next + 24 - (best + L) < 12) extra += 8;
          const nb = em.norm * days / 7 || 1, ot = hb[e * 5 + blk] + L - nb; if (ot > 1e-6) extra += 5 * ot;
          if (em.bad[(wd0 + d) % 7]) extra += 3;
          if (extra >= gain) continue;
          const score = extra + hb[e * 5 + blk] / nb + rnd() * .01;
          if (score < ps) { pick = e; ps = score; }
        }
        if (pick < 0) break;
        sh[pick * N + d] = best; hb[pick * 5 + blk] += L; for (let h = best - open, hh = h + L; h < hh; h++) { cov[h]++; if (sr(emps[pick])) sen[h] = 1; }
      }
    }
  }
  // отжиг: 3 000 итераций, T0 = 10, охлаждение ×0,998, добавления целятся в дни с дырами
  function anneal(P, sh, rnd, iters, prog) {
    const T = templates(P), { E, N } = P; if (!T.length || !E) return sh;
    let ev = evaluate(P, sh, false), cur = ev.cost, best = cur, bestSh = sh.slice(), temp = 10;
    const free = (e, d) => !P.frozen[e * N + d] && !onVac(P.emps[e], d);
    for (let i = 0; i < iters; i++) {
      if (prog && i % 150 === 0) prog(i / iters);
      temp *= .998;
      const mv = rnd(); let d = rnd() * N | 0;
      if (mv >= .72 && rnd() < .7) { const holes = []; for (let k = 0; k < N; k++) if (ev.dayHole[k] > 0) holes.push(k); if (holes.length) d = holes[rnd() * holes.length | 0]; }
      const e1 = rnd() * E | 0, e2 = rnd() * E | 0, i1 = e1 * N + d, i2 = e2 * N + d;
      if (!free(e1, d)) continue;
      const o1 = sh[i1], o2 = sh[i2]; let two = false;
      if (mv < .3) { if (e1 === e2 || !free(e2, d) || o1 === o2) continue; sh[i1] = o2; sh[i2] = o1; two = true; }
      else if (mv < .55) { if (o1 < 0) continue; const k = T.indexOf(o1) + (rnd() < .5 ? -1 : 1); if (k < 0 || k >= T.length) continue; sh[i1] = T[k]; }
      else if (mv < .72) { if (o1 < 0) continue; sh[i1] = -1; }
      else { if (o1 >= 0) continue; sh[i1] = T[rnd() * T.length | 0]; }
      const nev = evaluate(P, sh, false), delta = nev.cost - cur;
      if (delta <= 0 || rnd() < Math.exp(-delta / temp)) { ev = nev; cur = nev.cost; if (cur < best) { best = cur; bestSh = sh.slice(); } }
      else { sh[i1] = o1; if (two) sh[i2] = o2; }
    }
    return bestSh;
  }
  function solve(P, seed, prog) {
    const rnd = mulberry32(seed || 1), { E, N } = P, sh = new Array(E * N);
    for (let e = 0; e < E; e++) for (let d = 0; d < N; d++) { const i = e * N + d; sh[i] = onVac(P.emps[e], d) ? -1 : (P.frozen[i] ? P.sh[i] : -1); }
    greedy(P, sh, rnd); if (prog) prog(0);
    return anneal(P, sh, rnd, 3000, prog);
  }
  return { evaluate, solve, templates, onVac };
};
const core = CORE();
let worker = null;
try { worker = new Worker(URL.createObjectURL(new Blob([`const core=(${CORE.toString()})();onmessage=e=>{const{P,seed,id}=e.data;const sh=core.solve(P,seed,p=>postMessage({id,p}));postMessage({id,sh})}`], { type: 'text/javascript' }))); } catch (e) { worker = null; }

// ---- ссылка: deflate (CompressionStream) + base64url; без него — просто base64url ----
const b64u = u => btoa(String.fromCharCode(...u)).replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '');
const b64d = s => Uint8Array.from(atob(s.replace(/-/g, '+').replace(/_/g, '/')), c => c.charCodeAt(0));
const pipe = (bytes, T) => new Response(new Blob([bytes]).stream().pipeThrough(new T('deflate-raw'))).arrayBuffer().then(b => new Uint8Array(b));
const enc = s => new TextEncoder().encode(s), dec = u => new TextDecoder().decode(u);
const lzEnc = str => typeof CompressionStream == 'function' ? pipe(enc(str), CompressionStream).then(b => '#s=' + b64u(b)) : Promise.resolve('#j=' + b64u(enc(str)));
const lzDec = (k, str) => k === 's' ? pipe(b64d(str), DecompressionStream).then(dec) : Promise.resolve(dec(b64d(str)));

// ---- состояние демо ----
const mkEmp = (name, role, norm, bad = [], vac = null) => ({ name, role, norm, bad: WD.map((_, k) => bad.includes(k)), vac });
const defNeed = (o, c) => { const a = []; for (let h = o; h < c; h++) a.push(h < 12 ? 2 : h < 17 ? 4 : 3); return a; };
let state = { month: '2026-11', open: 8, close: 22, L: 10, need: defNeed(8, 22), emps: [], sh: [], fz: [], seed: 1 }, lastEval = null, sel = -1;
const dayName = d => new Date(C.y, C.m - 1, d + 1).toLocaleDateString('ru', { day: 'numeric', month: 'long' });
const cal = () => { const [y, m] = state.month.split('-').map(Number), N = new Date(y, m, 0).getDate(); return { y, m, N, wd0: (new Date(y, m - 1, 1).getDay() + 6) % 7 }; };
let C = cal();
const problem = () => ({ E: state.emps.length, N: C.N, open: state.open, close: state.close, L: state.L, need: state.need.slice(), wd0: C.wd0, emps: state.emps, frozen: state.fz, sh: state.sh });
const resetGrid = () => { const n = state.emps.length * C.N; state.sh = new Array(n).fill(-1); state.fz = new Array(n).fill(0); };
const compact = () => ({ m: state.month, o: state.open, c: state.close, L: state.L, n: state.need, k: state.seed, e: state.emps, s: state.sh.map(v => v < 0 ? '.' : String.fromCharCode(65 + v)).join(''), f: state.fz.join('') });
const expand = o => ({ month: o.m, open: +o.o, close: +o.c, L: +o.L, need: o.n.map(Number), seed: o.k || 1, emps: o.e.map(a => ({ name: String(a.name).slice(0, 14), role: +a.role & 3, norm: +a.norm || 40, bad: WD.map((_, k) => !!a.bad[k]), vac: a.vac ? [+a.vac[0], +a.vac[1]] : null })), sh: [...o.s].map(ch => ch === '.' ? -1 : ch.charCodeAt(0) - 65), fz: [...o.f].map(Number) });
const valid = st => { const [y, m] = String(st.month).split('-').map(Number), N = new Date(y, m, 0).getDate(); return N > 0 && st.need.length === st.close - st.open && st.sh.length === st.emps.length * N && st.fz.length === st.sh.length; };
const save = () => { try { localStorage.setItem('smena:state', JSON.stringify(compact())); } catch (e) { /* без хранилища */ } };
let toastT = 0; const toast = t => { const el = $('#toast'); el.textContent = t; el.classList.add('show'); clearTimeout(toastT); toastT = setTimeout(() => el.classList.remove('show'), 2600); };
const emps = $('#emps'), grid = $('#grid'), gridNote = grid.innerHTML, hist = $('#hist'), pbar = $('#pbar'), pstat = $('#pstat'), selName = $('#sel-name'), histSel = $('#hist-sel'), icsWho = $('#ics-who');

// ---- вход: настройки точки ----
function renderSettings() {
  const opt = (from, to, v) => { let s = ''; for (let h = from; h <= to; h++) s += `<option value="${h}"${h === v ? ' selected' : ''}>${pad(h)}:00</option>`; return s; };
  $('#open').innerHTML = opt(6, 12, state.open); $('#close').innerHTML = opt(16, 24, state.close); $('#month').value = state.month;
  $$('#len button').forEach(b => b.setAttribute('aria-pressed', +b.dataset.l === state.L));
  hist.innerHTML = state.need.map((v, k) => `<div class="bar" role="slider" tabindex="0" aria-label="${pad(state.open + k)}:00–${pad(state.open + k + 1)}:00" aria-valuemin="0" aria-valuemax="6" aria-valuenow="${v}" style="--v:${v}"><i></i><b>${v}</b><small>${pad(state.open + k)}</small></div>`).join('');
  $('#print-title').textContent = `${new Date(C.y, C.m - 1).toLocaleString('ru', { month: 'long' })} ${C.y} · ${state.open}:00–${state.close}:00, смены по ${state.L} ч`;
}
const reclamp = () => { const T = core.templates(state); state.sh = state.sh.map(s => T.includes(s) ? s : -1); }; // смены вне новых шаблонов снимаются
function setHours(o, c) { if (c - o < state.L) { toast('Часы работы короче смены'); renderSettings(); return; } state.need = Array.from({ length: c - o }, (_, k) => state.need[o + k - state.open] ?? 2); state.open = o; state.close = c; renderSettings(); reclamp(); commit(); }
on($('#open'), 'change', e => setHours(+e.target.value, state.close)); on($('#close'), 'change', e => setHours(state.open, +e.target.value));
on($('#len'), 'click', e => { const b = e.target.closest('button'); if (!b) return; const l = +b.dataset.l; if (state.close - state.open < l) { toast('Смена длиннее рабочего дня'); return; } state.L = l; renderSettings(); reclamp(); commit(); });
on($('#month'), 'change', e => { if (!/^\d{4}-\d{2}$/.test(e.target.value)) return; const oldN = C.N; state.month = e.target.value; C = cal(); remap(oldN); renderAll(); commit(); });
function remap(oldN) { const N = C.N, pick = (a, fill) => Array.from({ length: state.emps.length * N }, (_, i) => i % N < oldN ? a[(i / N | 0) * oldN + i % N] : fill); state.sh = pick(state.sh, -1); state.fz = pick(state.fz, 0); }
// гистограмма покрытия: тянем столбики, стрелки с клавиатуры
let histDown = false;
const setBar = (bar, v) => { v = Math.max(0, Math.min(6, v)); const k = [...hist.children].indexOf(bar); if (k < 0 || state.need[k] === v) return; state.need[k] = v; bar.style.setProperty('--v', v); bar.setAttribute('aria-valuenow', v); $('b', bar).textContent = v; commit(); };
const barAt = e => { const el = document.elementFromPoint(e.clientX, e.clientY); return el && el.closest('.bar'); };
const valAt = (bar, y) => { const r = bar.getBoundingClientRect(); return Math.round((1 - (y - r.top) / r.height) * 6); };
on(hist, 'pointerdown', e => { histDown = true; hist.setPointerCapture(e.pointerId); const b = barAt(e); if (b) setBar(b, valAt(b, e.clientY)); });
on(hist, 'pointermove', e => { if (!histDown) return; const b = barAt(e); if (b) setBar(b, valAt(b, e.clientY)); });
['pointerup', 'pointercancel'].forEach(t => on(hist, t, () => { histDown = false; }));
on(hist, 'keydown', e => { const b = e.target.closest('.bar'), d = { ArrowUp: 1, ArrowRight: 1, ArrowDown: -1, ArrowLeft: -1 }[e.key]; if (b && d) { setBar(b, +b.getAttribute('aria-valuenow') + d); e.preventDefault(); } });

// ---- вход: сотрудники; на мобильном строка свёрнута в сводку ----
const opened = new WeakSet();
const sumOf = em => { const b = WD.filter((_, k) => em.bad[k]); return `· ${ROLES[em.role].n} · ${em.norm} ч${b.length ? ' · не ' + b.join('/') : ''}${em.vac ? ` · отпуск ${em.vac[0]}–${em.vac[1]}` : ''}`; };
const syncIcs = () => { $('#x-ics').textContent = 'Скачать ICS · ' + icsWho.options[icsWho.selectedIndex].textContent; };
const tpl = $('#emp-t').content, emptyNote = emps.innerHTML;
function renderEmps() {
  $('#emp-n').textContent = state.emps.length; emps.innerHTML = state.emps.length ? '' : emptyNote;
  state.emps.forEach((em, i) => { const row = tpl.cloneNode(true).firstElementChild, o = opened.has(em); row.dataset.i = i; row.classList.toggle('open', o); $('.emp-sum', row).setAttribute('aria-expanded', o);
    $('.emp-sum b', row).textContent = em.name; $('.emp-sum span', row).textContent = sumOf(em); $('.emp-name', row).value = em.name; $('.emp-role', row).value = em.role; $('.emp-norm', row).value = em.norm;
    $$('.chip', row).forEach((c, k) => c.setAttribute('aria-pressed', em.bad[k])); if (em.vac) [$('.vac-a', row).value, $('.vac-b', row).value] = em.vac; emps.appendChild(row); });
  icsWho.innerHTML = state.emps.map((em, i) => `<option value="${i}">${esc(em.name)}</option>`).join('') || '<option value="">нет сотрудников</option>'; syncIcs();
}
on(emps, 'change', e => { const row = e.target.closest('.emp'); if (!row) return; const i = +row.dataset.i, em = state.emps[i], t = e.target;
  if (t.matches('.emp-name')) { em.name = t.value.trim() || 'Без имени'; $('.emp-sum b', row).textContent = em.name; icsWho.options[i].textContent = em.name; syncIcs(); } // без перерисовки списка: фокус остаётся в строке
  else if (t.matches('.emp-role')) em.role = +t.value; else if (t.matches('.emp-norm')) em.norm = +t.value;
  else if (t.matches('.vac-a,.vac-b')) { let a = +$('.vac-a', row).value, b = +$('.vac-b', row).value; if (a && b) { if (a > b) [a, b] = [b, a]; em.vac = [a, b]; for (let d = a - 1; d < b && d < C.N; d++) state.sh[i * C.N + d] = -1; } else em.vac = null; }
  else return; $('.emp-sum span', row).textContent = sumOf(em); commit(); });
on(emps, 'click', e => { const row = e.target.closest('.emp'); if (!row) return; const i = +row.dataset.i, em = state.emps[i], chip = e.target.closest('.chip'), del = e.target.closest('.del'), sum = e.target.closest('.emp-sum');
  if (sum) { const o = !opened.has(em); opened[o ? 'add' : 'delete'](em); row.classList.toggle('open', o); sum.setAttribute('aria-expanded', o); }
  if (chip) { const k = +chip.dataset.k; em.bad[k] = !em.bad[k]; chip.setAttribute('aria-pressed', em.bad[k]); $('.emp-sum span', row).textContent = sumOf(em); commit(); }
  if (del) { state.emps.splice(i, 1); state.sh.splice(i * C.N, C.N); state.fz.splice(i * C.N, C.N); sel = -1; renderEmps(); commit(); $('#add').focus(); } });
on($('#add'), 'click', () => { const em = mkEmp('Новый', 0, 40); state.emps.push(em); opened.add(em); state.sh.push(...new Array(C.N).fill(-1)); state.fz.push(...new Array(C.N).fill(0)); renderEmps(); commit(); $$('.emp-name', emps).pop().focus(); });
function loadExample() { state.emps = EX.map(a => mkEmp(...a)); resetGrid(); sel = -1; renderAll(); commit(); pbar.style.width = '0%'; pstat.textContent = 'Пример загружен. Нажмите «Составить»'; }
on($('#example'), 'click', loadExample);
const renderAll = () => { renderSettings(); renderEmps(); };

// ---- механика: решатель в Web Worker ----
let solveId = 0, t0 = 0;
const progress = p => { pbar.style.width = Math.round(p * 100) + '%'; pstat.textContent = p === 0 ? 'Жадный проход готов, отжиг…' : `Отжиг… ${Math.round(p * 100)} %`; };
function solve() {
  if (!state.emps.length) loadExample();
  const P = problem(), id = ++solveId; t0 = performance.now(); $('#run').disabled = true; pbar.style.width = '0%'; pstat.textContent = 'Считаю…';
  const done = sh => { if (id !== solveId) return; state.sh = Array.from(sh); $('#run').disabled = false; pbar.style.width = '100%'; evalNow(); renderGrid(true); updateSel();
    const s = `Решено за ${ru((Math.max(10, performance.now() - t0) / 1000).toFixed(2))} с`; pstat.textContent = `${s} · 3 000 итераций · нарушений: ${lastEval.items.length}`; solved.textContent = s; pushHistory(); save(); };
  if (worker) { worker.onmessage = e => { if (e.data.id !== id) return; if (e.data.sh) done(e.data.sh); else progress(e.data.p); }; worker.onerror = () => { worker = null; solve(); }; worker.postMessage({ P, seed: state.seed, id }); }
  else setTimeout(() => done(core.solve(P, state.seed, progress)), 30);
}
on($('#run'), 'click', solve);
on($('#shuffle'), 'click', () => { state.seed = 1 + Math.floor(Math.random() * 9999); $('#seed').textContent = state.seed; solve(); });
$$('[data-act=solve]').forEach(a => on(a, 'click', solve));
$$('[data-act=example]').forEach(a => on(a, 'click', loadExample));
function evalNow() {
  lastEval = state.emps.length ? core.evaluate(problem(), state.sh, true) : { items: [], cost: 0, unc: 0, over: 0, bad: 0, rest: 0, sd: 0, hours: [], dayCov: [], dayHole: [] };
  const ev = lastEval, n = ev.items.length; $('#vn').textContent = n; $('#vn').classList.toggle('zero', n === 0);
  $('#vlist').innerHTML = ev.items.sort((a, b) => a.d - b.d).slice(0, 80).map(it => `<li class="${it.k}">${WD[(C.wd0 + it.d) % 7]} ${it.d + 1}: ${it.e >= 0 ? esc(state.emps[it.e].name) + ', ' : ''}${it.t}</li>`).join('') || '<li>нарушений нет</li>';
  $('#cost').textContent = `стоимость ${ru(ev.cost.toFixed(1))} = 10×${ev.unc} + 5×${ru(ev.over.toFixed(1))} + 3×${ev.bad} + 8×${ev.rest} + σ ${ru(ev.sd.toFixed(1))}`;
  const now = { unc: ev.unc, over: Math.round(ev.over), bad: ev.bad, rest: ev.rest, sd: ru(ev.sd.toFixed(1)) };
  $$('[data-now]').forEach(el => { el.textContent = now[el.dataset.now]; el.classList.toggle('hot', el.dataset.now !== 'sd' && now[el.dataset.now] > 0); });
  if (pstat.textContent.includes('Решено')) pstat.textContent = pstat.textContent.replace(/нарушений: \d+/, 'нарушений: ' + n); // статус после ручных правок
}
const commit = () => { evalNow(); renderGrid(false); updateSel(); save(); };

// ---- выход: сетка сотрудники × дни ----
function renderGrid(anim) {
  const { N, wd0 } = C, L = state.L, ev = lastEval || { hours: [], dayHole: [], dayCov: [] }; grid.style.setProperty('--n', N);
  if (!state.emps.length) { grid.innerHTML = gridNote; return; }
  let h = '<div class="gh corner">Сотрудник</div>';
  for (let d = 0; d < N; d++) { const w = (wd0 + d) % 7; h += `<div class="gh${w > 4 ? ' we' : ''}"><b>${d + 1}</b>${WD[w]}</div>`; }
  h += '<div class="gh tot">Часы</div>';
  state.emps.forEach((em, e) => {
    const norm = Math.round(em.norm * N / 7), hrs = ev.hours[e] || 0; h += `<div class="gr" style="--i:${e}"><div class="gn"><b>${esc(em.name)}</b><span>${ROLES[em.role].n}</span></div>`;
    for (let d = 0; d < N; d++) {
      const i = e * N + d, s = state.sh[i];
      if (core.onVac(em, d)) { h += '<span class="pl vac"></span>'; continue; }
      const lock = state.fz[i], lab = `${esc(em.name)}, ${dayName(d)}: ${s < 0 ? 'нет смены' : 'смена ' + pad(s) + '–' + pad(s + L)}${lock ? ', заморожено' : ''}`;
      h += `<button type="button" class="pl ${s < 0 ? 'empty' : 'r' + em.role}${lock ? ' lock' : ''}" data-i="${i}" aria-label="${lab}">${s < 0 ? '' : `<i>${pad(s)}</i><i>${pad(s + L)}</i>`}</button>`;
    }
    h += `<div class="gt${hrs > norm ? ' over' : ''}"><b>${hrs}</b>/${norm}</div></div>`;
  });
  h += '<div class="gc corner label">Покрытие</div>';
  for (let d = 0; d < N; d++) { const u = ev.dayHole[d] || 0, w = u > 0 && ev.dayCov[d] >= .8, t = u ? `${w ? 'покрыто ≥ 80 %' : 'дыра'}: не хватает ${u} чел.-ч` : 'покрыто'; h += `<div class="gc" role="img" aria-label="${t}" title="${t}"><i class="${u ? w ? 'warn' : '' : 'ok'}"></i></div>`; }
  grid.innerHTML = h + '<div class="gc"></div>'; grid.classList.toggle('anim', anim && !reduced);
}
function updateSel() {
  const old = $('.pl.sel', grid); if (old) { old.classList.remove('sel'); old.removeAttribute('aria-pressed'); } const el = sel >= 0 && $(`.pl[data-i="${sel}"]`, grid); if (!el) sel = -1;
  if (el) { el.classList.add('sel'); el.setAttribute('aria-pressed', 'true'); const e = sel / C.N | 0, d = sel % C.N; selName.textContent = `${state.emps[e].name}, ${dayName(d)}${state.sh[sel] >= 0 ? ' · пустая ячейка = перенести' : ''}`; } else selName.textContent = 'Щёлкните по ячейке';
  $('#freeze').textContent = el && state.fz[sel] ? 'Разморозить' : 'Заморозить';
}
let drag = null, dragged = false;
on(grid, 'click', e => {
  if (dragged) { dragged = false; return; } const el = e.target.closest('.pl'); if (!el || el.matches('.vac')) return; const i = +el.dataset.i;
  if (el.matches('.empty')) {
    if (state.fz[i] || (sel >= 0 && state.sh[sel] >= 0 && state.fz[sel])) { toast('Ячейка заморожена'); return; }
    if (sel >= 0 && sel !== i && state.sh[sel] >= 0) { state.sh[i] = state.sh[sel]; state.sh[sel] = -1; sel = i; }
    else { const T = core.templates(state); if (!T.length) return; state.sh[i] = T[0]; sel = i; }
    commit(); return;
  }
  sel = sel === i ? -1 : i; updateSel();
});
// drag мышью: полупрозрачная копия, пересчёт после броска
on(grid, 'pointerdown', e => { if (e.pointerType === 'touch' || e.button !== 0) return; const el = e.target.closest('.pl'); if (!el || el.matches('.empty,.vac') || state.fz[+el.dataset.i]) return; drag = { i: +el.dataset.i, el, x: e.clientX, y: e.clientY }; e.preventDefault(); });
on(window, 'pointermove', e => {
  if (!drag) return;
  if (!drag.ghost) { if (Math.hypot(e.clientX - drag.x, e.clientY - drag.y) < 6) return; const g = drag.el.cloneNode(true); g.classList.add('ghost'); g.classList.remove('sel'); document.body.appendChild(g); drag.ghost = g; drag.el.classList.add('drag'); dragged = true; }
  drag.ghost.style.left = e.clientX + 'px'; drag.ghost.style.top = e.clientY + 'px';
  const under = document.elementFromPoint(e.clientX, e.clientY), t = under && under.closest('.pl'), ok = t && t !== drag.el && !t.matches('.vac') && !state.fz[+t.dataset.i];
  if (drag.over && drag.over !== t) drag.over.classList.remove('over'); drag.over = ok ? t : null; if (ok) t.classList.add('over');
});
const endDrag = () => { if (!drag) return; const { ghost, over, i, el } = drag; drag = null; if (!ghost) return; ghost.remove(); el.classList.remove('drag');
  if (over) { over.classList.remove('over'); const j = +over.dataset.i, t = state.sh[j]; state.sh[j] = state.sh[i]; state.sh[i] = t; sel = j; commit(); } setTimeout(() => { dragged = false; }, 0); };
on(window, 'pointerup', endDrag); on(window, 'pointercancel', endDrag);
const noSel = () => sel < 0 || state.sh[sel] < 0 ? (toast('Выберите ячейку со сменой'), true) : state.fz[sel] ? (toast('Ячейка заморожена'), true) : false;
on($('#freeze'), 'click', () => { if (sel < 0) return toast('Сначала выберите ячейку'); state.fz[sel] ^= 1; commit(); });
on($('#shift'), 'click', () => { if (noSel()) return; const T = core.templates(state); state.sh[sel] = T[(T.indexOf(state.sh[sel]) + 1) % T.length]; commit(); });
on($('#remove'), 'click', () => { if (noSel()) return; state.sh[sel] = -1; commit(); });
on(window, 'keydown', e => { if (e.key === 'Escape') { sel = -1; updateSel(); } });

// ---- экспорт: печать, CSV, ICS, ссылка, история ----
const download = (txt, name, type) => { const a = document.createElement('a'); a.href = URL.createObjectURL(new Blob([txt], { type })); a.download = name; a.click(); setTimeout(() => URL.revokeObjectURL(a.href), 2000); };
const noEmps = () => !state.emps.length && (toast('Сначала добавьте людей'), true);
const shifts = n => `${n} ${pl(n, 'смена', 'смены', 'смен')}`;
function csv() { if (noEmps()) return; let s = '﻿сотрудник;дата;старт;конец\r\n', n = 0; state.emps.forEach((em, e) => { for (let d = 0; d < C.N; d++) { const st = state.sh[e * C.N + d]; if (st >= 0) { n++; s += `${em.name};${C.y}-${pad(C.m)}-${pad(d + 1)};${pad(st)}:00;${pad(st + state.L)}:00\r\n`; } } }); download(s, `smena-${state.month}.csv`, 'text/csv;charset=utf-8'); toast('CSV: ' + shifts(n)); }
function ics() { if (noEmps()) return; const e = +icsWho.value, em = state.emps[e]; const stamp = new Date().toISOString().replace(/[-:]/g, '').slice(0, 15) + 'Z', f = x => `${x.getFullYear()}${pad(x.getMonth() + 1)}${pad(x.getDate())}T${pad(x.getHours())}0000`; let s = `BEGIN:VCALENDAR\r\nVERSION:2.0\r\nPRODID:-//Smena//RU\r\nX-WR-CALNAME:Смена · ${em.name}\r\n`, n = 0;
  for (let d = 0; d < C.N; d++) { const st = state.sh[e * C.N + d]; if (st < 0) continue; n++; s += `BEGIN:VEVENT\r\nUID:smena-${state.month}-${e}-${d}@smena.app\r\nDTSTAMP:${stamp}\r\nDTSTART:${f(new Date(C.y, C.m - 1, d + 1, st))}\r\nDTEND:${f(new Date(C.y, C.m - 1, d + 1, st + state.L))}\r\nSUMMARY:Смена ${pad(st)}–${pad(st + state.L)}, ${ROLES[em.role].n}\r\nEND:VEVENT\r\n`; }
  download(s + 'END:VCALENDAR\r\n', `smena-${state.month}-${e + 1}.ics`, 'text/calendar;charset=utf-8'); toast(`ICS · ${em.name}: ${shifts(n)}`); }
async function copyLink() { let code; try { code = await lzEnc(JSON.stringify(compact())); } catch (e) { return toast('Не удалось собрать ссылку'); } const url = location.href.split('#')[0] + code; history.replaceState(null, '', code);
  try { await navigator.clipboard.writeText(url); toast('Ссылка скопирована, график внутри'); } catch (e) { const o = $('#link-out'); o.hidden = false; o.value = url; o.focus(); o.select(); toast('Скопируйте ссылку из поля ниже'); } }
const readHist = () => { try { return JSON.parse(localStorage.getItem('smena:history') || '[]'); } catch (e) { return []; } };
function pushHistory() { try { const h = readHist(); h.unshift({ t: Date.now(), n: lastEval.items.length, s: compact() }); h.splice(30); localStorage.setItem('smena:history', JSON.stringify(h)); renderHist(h); } catch (e) { /* без хранилища */ } }
function renderHist(h) { histSel.innerHTML = `<option value="">история: ${h.length} из 30</option>` + h.map((x, i) => `<option value="${i}">${new Date(x.t).toLocaleString('ru', { dateStyle: 'short', timeStyle: 'short' })} · нарушений: ${x.n}</option>`).join(''); }
on(histSel, 'change', () => { const x = readHist()[+histSel.value]; if (!x) return; const st = expand(x.s); if (!valid(st)) return; state = st; C = cal(); sel = -1; renderAll(); commit(); $('#seed').textContent = state.seed; histSel.value = ''; toast('Версия восстановлена'); });
$$('#print,#x-print').forEach(b => on(b, 'click', () => { if (!noEmps()) print(); }));
$$('#csv,#x-csv').forEach(b => on(b, 'click', csv)); $$('#ics,#x-ics').forEach(b => on(b, 'click', ics)); on($('#link'), 'click', copyLink); on(icsWho, 'change', syncIcs);

// ---- тарифы: месяц / год ----
const setPeriod = y => { $('#per-month').setAttribute('aria-pressed', !y); $('#per-year').setAttribute('aria-pressed', y); $$('.price b').forEach(b => { const v = +(y ? b.dataset.y : b.dataset.m); b.dataset.count = v; b.textContent = fmt(v); countUp(b); }); };
on($('#per-month'), 'click', () => setPeriod(false)); on($('#per-year'), 'click', () => setPeriod(true));

// ---- старт: ссылка → localStorage → пример ----
(async function init() {
  let st = null; const h = location.hash.match(/^#([sj])=([\w-]+)$/);
  if (h) { try { st = expand(JSON.parse(await lzDec(h[1], h[2]))); } catch (e) { st = null; } }
  if (!st) { try { const raw = localStorage.getItem('smena:state'); if (raw) st = expand(JSON.parse(raw)); } catch (e) { st = null; } }
  renderHist(readHist());
  let ok; try { ok = st && valid(st) && st.emps.length; } catch (e) {}
  if (ok) { state = st; C = cal(); $('#seed').textContent = state.seed; renderAll(); commit(); pstat.textContent = h ? 'График из ссылки' : 'Восстановлено из прошлого сеанса'; }
  else { loadExample(); solve(); }
})();
})();
