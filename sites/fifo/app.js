/* Фифо: конвейер FIFO в hero, парсер выгрузок, расчёт НДФЛ по FIFO, отчёт к 3-НДФЛ. Всё в браузере. */
(() => {
const $ = (s, r = document) => r.querySelector(s), $$ = (s, r = document) => [...r.querySelectorAll(s)];
const NB = ' ', MI = '−', reduced = matchMedia('(prefers-reduced-motion: reduce)').matches;
function rng(seed) { let s = (seed * 9301 + 49297) % 2147483647; return () => { s = (s * 16807) % 2147483647; return (s % 10000) / 10000; }; }
const pick = (r, a) => a[Math.floor(r() * a.length)], lerp = (a, b, t) => a + (b - a) * t;
const eo = t => 1 - Math.pow(1 - t, 3), ei = t => t * t, eio = t => t < .5 ? 2 * t * t : 1 - Math.pow(-2 * t + 2, 2) / 2;
const esc = s => String(s).replace(/[&<>"]/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]));
const grp = (n, d = 0) => { const [i, f] = Math.abs(n).toFixed(d).split('.'); return i.replace(/\B(?=(\d{3})+(?!\d))/g, NB) + (f ? ',' + f : ''); };
const rub = n => (n < 0 ? MI : '') + grp(Math.round(Math.abs(n))) + NB + '₽';
const signed = n => (Math.round(n) < 0 ? MI : Math.round(n) ? '+' : '') + grp(Math.round(Math.abs(n))) + NB + '₽';
const qf = q => grp(q, q >= 1000 ? 0 : q >= 10 ? 2 : q >= 1 ? 3 : 4);
const dmy = s => s && s.length >= 10 ? s.slice(8, 10) + '.' + s.slice(5, 7) + '.' + s.slice(0, 4) : '—';
const p2 = n => String(n).padStart(2, '0'), go = s => $(s).scrollIntoView({ behavior: reduced ? 'auto' : 'smooth', block: 'start' });
const anim = (ms, fn) => { const t0 = performance.now(); const st = now => { const p = Math.min(1, (now - t0) / (reduced ? 1 : ms)); fn(eo(p), p); if (p < 1) requestAnimationFrame(st); }; requestAnimationFrame(st); };
const fill = (root, v) => $$('[data-k]', root).forEach(el => { if (v[el.dataset.k] != null) el.textContent = v[el.dataset.k]; });
const tpl = (id, v) => { const n = $(id).content.cloneNode(true); fill(n, v); return n; };

// ---------- reveal по прокрутке, count-up, шапка ----------
function show(el) { if (el.classList.contains('in')) return; el.classList.add('in'); $$('[data-count]', el).forEach(c => { const to = +c.dataset.count, d = +(c.dataset.dec || 0); if (!c.dataset.done && to > 0 && !reduced) anim(900, e => c.textContent = grp(to * e, d)); c.dataset.done = 1; }); }
const revealAll = () => { const h = innerHeight; $$('.reveal:not(.in)').forEach(el => { if (el.getBoundingClientRect().top < h * .92) show(el); }); };
addEventListener('scroll', revealAll, { passive: true }); addEventListener('resize', revealAll); revealAll(); setTimeout(revealAll, 400);
const top = $('#top'), burger = $('#burger');
burger.onclick = () => burger.setAttribute('aria-expanded', top.classList.toggle('open'));
$$('#menu a').forEach(a => a.onclick = () => { top.classList.remove('open'); burger.setAttribute('aria-expanded', 'false'); });

// ---------- таблицы (демо, обновляются релизом): цены USD, курс ЦБ по месяцам ----------
const tbl = (from, s) => { const o = {}; s.split('|').forEach((row, i) => o[from + i] = row.split(' ').map(Number)); return o; };
const PX = {
  BTC: tbl(2021, '32000 45000 58800 57700 37300 35000 41500 47100 43800 61300 61000 46300|38500 43200 45500 37700 31800 19900 23300 20000 19400 20500 16500 16500|23100 23100 28500 29200 27200 30500 29200 26000 27000 34600 37700 42000|42600 61200 70000 60600 67500 62700 64600 59000 63300 70200 96400 95000|100000 96000 84000 86000 103000 105000 116000 115000 112000 114000 108000 104000|102000 104000 106000 108000 110000 112000 114000 116000 115000 117000 118000 118000'),
  ETH: tbl(2021, '1300 1420 1920 2770 2700 2270 2530 3430 3000 4290 4630 3680|2690 2920 3280 2820 1940 1070 1680 1550 1330 1570 1290 1200|1580 1610 1820 1870 1870 1930 1860 1650 1670 1800 2050 2280|2280 3340 3650 3010 3760 3440 3230 2520 2600 2510 3700 3600|3300 2200 1830 1800 2530 2500 3700 4400 4200 4000 3600 3400|3300 3200 3100 3300 3400 3500 3600 3600 3500 3400 3300 3300'),
  TON: tbl(2021, '.6 .6 .7 .8 .9 1 1.2 1.5 1.8 2 3.3 3.5|2.5 2.3 2 1.9 1.3 1.1 1.3 1.5 1.6 1.5 1.7 2.4|2.3 2.5 2.3 2.1 1.9 1.4 1.3 1.6 2.1 2.1 2.4 2.3|2.2 2.1 5 6.1 6.4 7.5 6.8 5.4 5.7 5 5.7 5.4|3.5 3.6 3.7 3.1 3.1 2.8 3.4 3.2 2.8 2.2 1.9 1.8|1.8 1.9 2 2 2.1 2.1 2 2 1.9 1.9 1.9 1.9'),
};
const CBR = tbl(2017, '59.9 58.4 58.1 56.4 57.2 57.9 59.7 59.6 57.7 57.7 58.9 58.6|56.8 56.8 57 60.5 62.2 62.7 62.9 66.1 67.7 65.9 66.2 67.3|66.8 65.8 65.2 64.6 64.9 64.2 63.1 65.6 64.8 64.3 63.9 63|61.8 63.9 73.8 75.2 72.9 69.2 71.1 73.8 76.1 77.7 76.4 74|74 74.5 74.4 76.4 73.9 72.5 73.9 73.6 72.9 71.4 72.3 73.9|76.3 76.9 104 78.4 64.4 57 58.2 60.3 59.7 61.7 60.8 67.7|69.2 73.3 76.2 80.9 79.4 83.1 90.6 95.7 96.6 97 90.6 90|89.1 91.5 91.9 92.9 90.6 88.4 87.6 89.8 91.7 96.1 99.7 102|101 92 85 83.5 80.5 79 78.5 80 83 81 80 80|80 80 81 82 82 83 83 84 84 85 85 85');
const STABLE = /^(USDT|USDC|DAI|BUSD|TUSD|FDUSD|USD)$/, FIAT = /^(RUB|RUR|USD)$/;
function monthVal(t, y, m) { for (let k = y * 12 + m - 1; k >= 2017 * 12; k--) { const v = t[Math.floor(k / 12)]?.[k % 12]; if (v != null) return v; } return t[Object.keys(t).sort()[0]][0]; }
const ym = s => [+s.slice(0, 4), +s.slice(5, 7)], cbr = s => monthVal(CBR, ...ym(s));
const usd = (a, s) => STABLE.test(a) ? 1 : /^RU[BR]$/.test(a) ? 1 / cbr(s) : PX[a] ? monthVal(PX[a], ...ym(s)) : 0;
// ставки НДФЛ — конфиг с подписью года
const RATES = [{ from: 2025, thr: 24e5, low: .13, high: .15, label: '2025+: 13 % до 2,4 млн ₽, 15 % сверх' }, { from: 2021, thr: 5e6, low: .13, high: .15, label: '2021–2024: 13 % до 5 млн ₽, 15 % сверх' }, { from: 0, thr: Infinity, low: .13, high: .13, label: 'до 2021: 13 %' }];
const rateFor = y => RATES.find(r => y >= r.from);
// пресеты бирж и синонимы заголовков — в разметке рядом с полями
const PRESETS = {}; $$('#preset option[data-cols]').forEach(o => PRESETS[o.value] = [o.textContent, o.dataset.cols, o.dataset.quote]);
const MF = $('#map-fields').dataset, SYN = {}; for (const k in MF) if (k.startsWith('syn')) SYN[k.slice(3).toLowerCase()] = MF[k].split(',');

// ---------- Hero: конвейер FIFO на canvas, плоские формы без теней ----------
function initBelt() {
  const cv = $('#belt'), ctx = cv.getContext('2d'), INK = '#0A0A0A', ACID = '#B6FF3B', LOT = '#FFE347', RED = '#FF3B3B';
  const A = { BTC: { p: 64e5, qs: [.02, .03, .05, .08], ph: 0 }, ETH: { p: 3e5, qs: [.3, .5, 1, 1.5], ph: 2.1 }, TON: { p: 260, qs: [200, 400, 600], ph: 4.2 } };
  const r = rng(17), DUR = { stamp: .37, grab: .3, move: .5, drop: .3, ret: .3 }; let L, W = 0, H = 0, last = performance.now();
  const S = { speed: 1, t: 0, dist: 0, day: 100, lots: [], flashes: [], piles: { profit: [], loss: [] }, bins: { profit: 0, loss: 0 }, n: 0, tax: 0, tf: 0, tt: 0, tk: 1, nextLot: .5, nextSale: 1.6, sale: null, stamp: null, arm: { x: 0, y: 0, open: 1, cube: null }, hover: null };
  const price = a => A[a].p * (1 + .22 * Math.sin(S.t * .11 + A[a].ph) + .09 * Math.sin(S.t * .43 + A[a].ph * 1.7));
  const dayStr = d => new Date(Date.UTC(2025, 0, 1 + Math.floor(d))).toISOString().slice(0, 10);
  const T = (s, x, y, w, size, c = INK, al = 'center') => { ctx.font = `${w} ${size}px "Inter Tight", system-ui, sans-serif`; ctx.fillStyle = c; ctx.textAlign = al; ctx.fillText(s, x, y); };
  const B = (x, y, w, h, f, st, lw = 2) => { if (f) { ctx.fillStyle = f; ctx.fillRect(x, y, w, h); } if (st) { ctx.strokeStyle = st; ctx.lineWidth = lw; ctx.strokeRect(x, y, w, h); } };
  const ln = (lw, ...p) => { ctx.strokeStyle = INK; ctx.lineWidth = lw; ctx.beginPath(); for (let i = 0; i < p.length; i += 4) { ctx.moveTo(p[i], p[i + 1]); ctx.lineTo(p[i + 2], p[i + 3]); } ctx.stroke(); };
  function layout() {
    W = cv.clientWidth; H = cv.clientHeight; if (!W) return; const dpr = Math.min(devicePixelRatio || 1, 2); cv.width = Math.round(W * dpr); cv.height = Math.round(H * dpr); ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    const m = W < 640, pad = m ? 14 : 24, bw = m ? 92 : 118, bh = m ? 64 : 84, loss = { x: W - pad - bw, y: H - pad - 26 - bh, w: bw, h: bh }, profit = { x: loss.x - (m ? 10 : 16) - bw, y: loss.y, w: bw, h: bh };
    const board = m ? { x: pad, y: pad, w: W - 2 * pad, h: 64 } : { x: W - pad - 280, y: pad, w: 280, h: 110 }, railY = board.y + board.h + (m ? 10 : 16), idleY = railY + (m ? 10 : 24), liftY = idleY + (m ? 4 : 10);
    const beltY = Math.max(Math.round(H * (m ? .56 : .58)), liftY + 74), beltEnd = profit.x - (m ? 24 : 44);
    L = { m, loss, profit, board, railY, idleY, liftY, beltY, beltEnd, headX: beltEnd - 32, sp: m ? 74 : 88, top: beltY - 44, idleX: profit.x + profit.w / 2 };
    S.lots.forEach((l, i) => l.x = Math.min(l.x, L.headX - i * L.sp)); finish(); S.arm.x = L.idleX; S.arm.y = L.idleY;
  }
  function spawn(x) { const a = pick(r, ['BTC', 'BTC', 'ETH', 'ETH', 'TON']), qty = pick(r, A[a].qs), p = Math.round(price(a) / 100) * 100, lo = S.lots[S.lots.length - 1]; S.lots.push({ a, qty, p, cost: qty * p, x: x ?? Math.min(-30, lo ? lo.x - L.sp : -30), date: dayStr(S.day), sold: 0 }); }
  function take(h) { // снять лот с головы: результат = (цена продажи − покупки) × кол-во
    const s = S.sale, res = Math.round((s.px - h.p) * h.qty / 100) * 100;
    S.arm.cube = { a: h.a, x: h.x, y: L.top, sz: 44, ok: res >= 0, vy: 0 }; S.lots.shift(); s.left--; S.n++;
    S.flashes.push({ x: h.x, y: L.top - 30, txt: signed(res), ok: res >= 0, t: 0 }); S.bins[res >= 0 ? 'profit' : 'loss'] += res;
    const base = Math.max(0, S.bins.profit + S.bins.loss); S.tf = S.tax; S.tt = base <= 24e5 ? base * .13 : 24e5 * .13 + (base - 24e5) * .15; S.tk = 0;
  }
  function finish() { S.sale = S.stamp = S.arm.cube = null; S.arm.open = 1; S.lots.forEach(l => l.sold = 0); }
  function saleStep(dt) { // фазы: штамп → захват → перенос → сброс → возврат
    const s = S.sale, arm = S.arm; s.pt += dt; const p = Math.min(1, s.pt / (DUR[s.ph] / Math.pow(S.speed, .75))), h = S.lots[0], next = ph => { s.ph = ph; s.pt = 0; s.x0 = arm.x; s.y0 = arm.y; };
    if (s.ph === 'stamp') { S.stamp.y = lerp(-60, L.top - 62, ei(Math.min(1, p / .68))); S.stamp.sq = p > .68 ? Math.sin((p - .68) / .32 * Math.PI) * .16 : 0; if (p === 1) next('grab'); }
    else if (s.ph === 'grab') {
      if (!h || h.a !== s.a) return finish();
      if (S.stamp) { S.stamp.al = 1 - p; S.stamp.y = L.top - 62 - 50 * p; }
      arm.x = lerp(s.x0, h.x, eio(p)); arm.y = p < .5 ? s.y0 : lerp(L.idleY, L.top - 6, eio((p - .5) * 2)); arm.open = 1 - Math.max(0, p - .7) / .3;
      if (p === 1) { S.stamp = null; take(h); next('move'); }
    }
    else if (s.ph === 'move') { const b = arm.cube.ok ? L.profit : L.loss; arm.y = lerp(s.y0, L.liftY, eo(Math.min(1, p / .4))); arm.cube.y = arm.y + 6; arm.x = arm.cube.x = lerp(s.x0, b.x + b.w / 2, eio(Math.max(0, (p - .3) / .7))); if (p === 1) next('drop'); }
    else if (s.ph === 'drop') {
      const c = arm.cube, b = c.ok ? L.profit : L.loss; arm.open = Math.min(1, p * 3); c.vy += 1700 * dt; c.y += c.vy * dt; c.sz = lerp(44, 14, p);
      if (c.y >= b.y + b.h - 20) { const pile = S.piles[c.ok ? 'profit' : 'loss']; pile.push(c.ok); if (pile.length > 10) pile.shift(); arm.cube = null; next('ret'); }
    }
    else if (s.ph === 'ret') { arm.x = lerp(s.x0, L.idleX, eio(p)); arm.y = lerp(s.y0, L.idleY, eio(p)); if (p === 1) { if (s.left && S.lots[0] && S.lots[0].a === s.a) next('grab'); else finish(); } }
  }
  function step(dt) {
    const sp = S.speed; S.t += dt * sp; S.day += dt * sp * 1.5; S.dist += 40 * sp * dt;
    S.nextLot -= dt * sp; if (S.nextLot <= 0) { if (S.lots.length < 11) spawn(); S.nextLot = (S.lots.length < 3 ? .7 : S.lots.length > 8 ? 3.2 : 1.6) + r() * 1.2; }
    const v = 40 * sp * dt; S.lots.forEach((l, i) => l.x = Math.min(l.x + v, L.headX - i * L.sp));
    S.nextSale -= dt * sp;
    if (S.nextSale <= 0 && !S.sale) {
      const h = S.lots[0];
      if (h && h.x >= L.headX - L.sp * .6) {
        const k = r() < .3 && S.lots[1] && S.lots[1].a === h.a ? 2 : 1, qty = +(h.qty + (k > 1 ? S.lots[1].qty : 0)).toFixed(4); // иногда продажа закрывает два лота подряд
        S.lots.slice(0, k).forEach(l => l.sold = 1);
        S.sale = { a: h.a, left: k, ph: 'stamp', pt: 0, px: price(h.a), x0: S.arm.x, y0: S.arm.y }; S.stamp = { x: h.x, y: -60, txt: 'ПРОДАЖА ' + qf(qty) + ' ' + h.a, sq: 0, al: 1 }; S.nextSale = 2.5;
      } else S.nextSale = .4;
    }
    if (S.sale) saleStep(dt);
    S.flashes.forEach(f => f.t += dt); S.flashes = S.flashes.filter(f => f.t < .6);
    if (S.tk < 1) { S.tk = Math.min(1, S.tk + dt / .3); S.tax = lerp(S.tf, S.tt, eo(S.tk)); }
  }
  function draw() {
    ctx.clearRect(0, 0, W, H); const b = L.board, m = L.m;
    // табло
    B(b.x, b.y, b.w, b.h, null, INK, 3); T('НАЛОГ ЗА 2025 · 13 %', b.x + 14, b.y + 22, 700, 11, INK, 'left'); T(rub(S.tax), b.x + 14, b.y + (m ? 52 : 68), 800, m ? 26 : 40, INK, 'left');
    if (!m) { T('база ' + rub(Math.max(0, S.bins.profit + S.bins.loss)), b.x + 14, b.y + 92, 600, 11, '#5C5C5C', 'left'); T('КАЛЕНДАРЬ СДЕЛОК · ' + String(S.speed).replace('.', ',') + '×', 24, 46, 700, 11, INK, 'left'); T(dmy(dayStr(S.day)), 24, 86, 800, 34, INK, 'left'); T('лотов в очереди: ' + S.lots.length + ' · продаж: ' + S.n, 24, 110, 600, 11, '#5C5C5C', 'left'); }
    // корзины
    [['profit', L.profit, 'ПРИБЫЛЬ'], ['loss', L.loss, 'УБЫТОК']].forEach(([k, c, t]) => {
      ln(3, c.x, c.y, c.x, c.y + c.h, c.x, c.y + c.h, c.x + c.w, c.y + c.h, c.x + c.w, c.y + c.h, c.x + c.w, c.y); T(t, c.x + c.w / 2, c.y + 15, 700, 10);
      const gx = c.x + (c.w - 86) / 2; S.piles[k].forEach((ok, i) => { const x = gx + (i % 5) * 18, y = c.y + c.h - 20 - Math.floor(i / 5) * 17; B(x, y, 14, 14, ok ? ACID : '#fff', INK, 1.5); if (!ok) ln(1.5, x + 1, y + 13, x + 13, y + 1); });
      T(signed(S.bins[k]), c.x + c.w / 2, c.y + c.h + 19, 700, 13, k === 'loss' ? RED : INK);
    });
    // лента, штриховка, ролики, рельс
    const y1 = L.beltY, y2 = y1 + 28, e = L.beltEnd; ln(3, 0, y1, e, y1, 0, y2, e, y2, e, y1, e, y2 + 24, L.headX - 60, L.railY, L.loss.x + L.loss.w, L.railY);
    ctx.save(); ctx.beginPath(); ctx.rect(0, y1, e, 28); ctx.clip(); const hs = []; for (let x = -20 + S.dist % 16; x < e + 20; x += 16) hs.push(x, y2, x + 12, y1); ln(1.5, ...hs); ctx.restore();
    const ang = S.dist / 8; ctx.lineWidth = 2; for (let x = 30; x < e - 12; x += 72) { ctx.beginPath(); ctx.arc(x, y2 + 11, 8, 0, Math.PI * 2); ctx.moveTo(x - Math.cos(ang) * 8, y2 + 11 - Math.sin(ang) * 8); ctx.lineTo(x + Math.cos(ang) * 8, y2 + 11 + Math.sin(ang) * 8); ctx.stroke(); }
    // лоты
    S.lots.forEach(l => { const x = l.x - 22, y = L.top; if (x > W || x < -50) return; B(x, y, 44, 44, l.sold ? ACID : LOT, INK); T(l.a, l.x, y + 19, 700, 11); T(qf(l.qty), l.x, y + 34, 600, 11); T(rub(l.cost), l.x, y - 8, 600, 11); });
    S.flashes.forEach(f => { const p = f.t / .6, y = f.y - 20 * eo(p); ctx.save(); ctx.globalAlpha = 1 - ei(p); ctx.font = '700 13px "Inter Tight"'; const w = ctx.measureText(f.txt).width + 16; B(f.x - w / 2, y - 20, w, 22, f.ok ? ACID : '#fff', f.ok ? INK : RED); T(f.txt, f.x, y - 4, 700, 13, f.ok ? INK : RED); ctx.restore(); });
    const s = S.stamp; if (s) { ctx.save(); ctx.globalAlpha = s.al; ctx.font = '800 12px "Inter Tight"'; const w = ctx.measureText(s.txt).width + 26; ctx.translate(s.x, s.y + 36); ctx.scale(1 + s.sq, 1 - s.sq); B(-w / 2, -36, w, 36, ACID, INK, 2.5); T(s.txt, 0, -14, 800, 12); ctx.restore(); }
    // манипулятор
    const a = S.arm, hf = 26 + 12 * a.open; ln(3, a.x, L.railY, a.x, a.y, a.x - hf, a.y, a.x + hf, a.y, a.x - hf, a.y, a.x - hf, a.y + 34, a.x + hf, a.y, a.x + hf, a.y + 34); B(a.x - 9, L.railY - 6, 18, 12, INK);
    const c = a.cube; if (c) { B(c.x - c.sz / 2, c.y, c.sz, c.sz, ACID, INK); if (c.sz >= 30) T(c.a, c.x, c.y + c.sz / 2 + 4, 700, 11); }
    const hv = S.hover; if (hv) { const t1 = 'Куплено ' + dmy(hv.date) + ' по ' + rub(hv.p) + ' за 1 ' + hv.a; ctx.font = '600 12px "Inter Tight"'; const w = ctx.measureText(t1).width + 20, x = Math.max(4, Math.min(W - w - 4, hv.x - w / 2)); B(x, L.top - 58, w, 28, '#fff', INK); T(t1, x + 10, L.top - 40, 600, 12, INK, 'left'); }
  }
  function frame(now) { requestAnimationFrame(frame); const dt = Math.min(.05, (now - last) / 1000), b = cv.getBoundingClientRect(); last = now; if (!document.hidden && b.bottom > 0 && b.top < innerHeight) { step(dt); draw(); } }
  function staticScene() { let n = 0; while (n++ < 6000 && !(S.piles.profit.length + S.piles.loss.length > 3 && S.sale && S.sale.ph === 'move' && S.sale.pt > .34)) step(1 / 60); draw(); } // prefers-reduced-motion: кадр с одной снятой парой
  layout(); for (let i = 0; i < 7; i++) { spawn(L.headX - i * L.sp); S.lots[i].date = dayStr(S.day - (7 - i) * 9); } for (let i = 0; i < 540; i++) step(1 / 60);
  addEventListener('resize', () => { layout(); reduced ? staticScene() : draw(); });
  cv.onpointermove = e => { const b = cv.getBoundingClientRect(), x = e.clientX - b.left, y = e.clientY - b.top; S.hover = S.lots.find(l => Math.abs(l.x - x) <= 22 && y >= L.top - 22 && y <= L.top + 44) || null; cv.style.cursor = S.hover ? 'pointer' : ''; if (reduced) draw(); };
  cv.onpointerleave = () => { S.hover = null; if (reduced) draw(); };
  const sp = $('#speed'); sp.oninput = () => { S.speed = +sp.value; $('#speed-out').textContent = String(S.speed).replace('.', ',') + '×'; };
  document.fonts.ready.then(() => { if (reduced) staticScene(); else { last = performance.now(); requestAnimationFrame(frame); } });
}

// ---------- парсер: кодировка, разделитель, заголовки по синонимам ----------
function decode(buf) { try { return { text: new TextDecoder('utf-8', { fatal: true }).decode(buf), enc: 'UTF-8' }; } catch { return { text: new TextDecoder('windows-1251').decode(buf), enc: 'windows-1251' }; } }
function parseDelimited(text) {
  const first = text.slice(0, 5000).split(/\r?\n/)[0] || '', delim = [',', ';', '\t', '|'].map(d => [d, first.split(d).length]).sort((a, b) => b[1] - a[1])[0][0], rows = []; let row = [], cell = '', q = false;
  const end = () => { row.push(cell); if (row.some(x => x.trim())) rows.push(row); row = []; cell = ''; };
  for (let i = 0; i < text.length; i++) {
    const c = text[i];
    if (q) { if (c === '"') { if (text[i + 1] === '"') { cell += '"'; i++; } else q = false; } else cell += c; }
    else if (c === '"') q = true; else if (c === delim) { row.push(cell); cell = ''; }
    else if (c === '\n' || c === '\r') { if (c === '\r' && text[i + 1] === '\n') i++; end(); } else cell += c;
  }
  end(); return { rows, delim };
}
function parseDate(s) { // ISO, Д.М.Г, M/D/Y, unix → YYYY-MM-DD
  s = String(s ?? '').trim(); const m = s.match(/^(\d{4})[-/.](\d\d?)[-/.](\d\d?)/), n = m || s.match(/^(\d\d?)[-/.](\d\d?)[-/.](\d{4})/);
  if (!n) return /^\d{10}(\d{3})?$/.test(s) ? new Date(s.length > 10 ? +s : s * 1000).toISOString().slice(0, 10) : null;
  const y = +(m ? n[1] : n[3]), a = +(m ? n[2] : n[1]), b = +(m ? n[3] : n[2]), [mo, d] = m ? [a, b] : a > 12 ? [b, a] : b > 12 ? [a, b] : s.includes('/') ? [a, b] : [b, a];
  return mo >= 1 && mo <= 12 && d >= 1 && d <= 31 && y > 1990 ? `${y}-${p2(mo)}-${p2(d)}` : null;
}
function num(s) { if (s == null) return NaN; s = String(s).replace(MI, '-').replace(/[^\d.,\-]/g, ''); if (!s) return NaN; const c = s.lastIndexOf(','), d = s.lastIndexOf('.'); if (c > -1 && d > -1) s = c > d ? s.replace(/\./g, '').replace(',', '.') : s.replace(/,/g, ''); else if (c > -1) s = s.split(',').length > 2 ? s.replace(/,/g, '') : s.replace(',', '.'); return parseFloat(s); }
const QUOTES = 'USDT,USDC,FDUSD,BUSD,TUSD,DAI,USD,RUB,EUR,BTC,ETH,TON,BNB'.split(',');
function parsePair(p, q, def) {
  p = String(p || '').toUpperCase().replace(/\s+/g, ''); q = String(q || '').toUpperCase().replace(/[^A-Z]/g, ''); if (!p) return null;
  const parts = p.split(/[/\-_:]/).filter(Boolean); if (parts.length >= 2) return { base: parts[0], quote: parts[1] };
  if (q) return p.endsWith(q) && p.length > q.length ? { base: p.slice(0, -q.length), quote: q } : { base: p, quote: q };
  for (const s of QUOTES) if (p.length > s.length && p.endsWith(s)) return { base: p.slice(0, -s.length), quote: s };
  return { base: p, quote: def || 'USDT' };
}
const parseSide = s => /buy|покуп|bid|long|купл/i.test(s) ? 'buy' : /sell|прода|ask|short/i.test(s) ? 'sell' : null;
const looksData = row => row.filter(c => !isNaN(parseFloat(c)) || parseDate(c)).length >= 2;
function autoMap(headers) { // точное совпадение — 1, вхождение — 0,7; уверенность по 5 полям
  const H = headers.map(h => String(h).toLowerCase().trim().replace(/\s+/g, ' ')), map = {}, used = new Set(); let conf = 0;
  for (const f in SYN) for (const [s, test] of [[1, (h, k) => h === k], [.7, (h, k) => h.includes(k)]]) {
    const i = SYN[f].reduce((r, k) => r > -1 ? r : H.findIndex((h, j) => !used.has(j) && test(h, k)), -1);
    if (i > -1) { map[f] = i; used.add(i); if (f !== 'fee' && f !== 'quote') conf += s / 5; break; }
  }
  return { map, conf };
}
function rowsToTrades(rows, map, presetId) {
  const P = PRESETS[presetId], ex = P ? P[0] : 'Файл', out = []; let bad = 0;
  rows.forEach(row => {
    const g = k => map[k] >= 0 ? String(row[map[k]] ?? '').trim() : '', date = parseDate(g('date')), pr = parsePair(g('pair'), g('quote'), P && P[2]), side = parseSide(g('side')), qty = num(g('qty')), price = num(g('price')), fee = Math.abs(num(g('fee'))) || 0;
    if (!date || !pr || !side || !(qty > 0) || !(price > 0)) { bad++; return; } out.push({ date, asset: pr.base, quote: pr.quote, side, qty, price, fee, ex });
  });
  return { trades: out, bad };
}

// ---------- демо-выгрузка: 400 сделок 2021–2026, seeded PRNG по таблице цен ----------
function genDemo(seed) {
  const r = rng(seed), T = [{ date: '2021-09-03', asset: 'TON', quote: 'USDT', side: 'sell', qty: 50, price: 1.8, fee: .09, ex: 'OKX' }], hold = { BTC: 0, ETH: 0, TON: 0, USDT: 0 }, dec = { BTC: 4, ETH: 3, TON: 0 }, min = { BTC: .002, ETH: .02, TON: 20 };
  let i = 0; for (let y = 2021; y <= 2026; y++) for (let m = 1; m <= (y < 2026 ? 12 : 10); m++, i++) {
    const rate = CBR[y][m - 1]; let day = 0;
    for (let k = 0; k < 6; k++) {
      day = Math.min(28, day + 1 + Math.floor(r() * 4)); const date = `${y}-${p2(m)}-${p2(day)}`, ex = pick(r, ['Bybit', 'OKX', 'Binance']); // дни по порядку
      const p2p = hold.USDT < 300 || r() < .05 ? 1 : r() < .08 && hold.USDT > 2500 ? -1 : 0; // P2P: купить USDT за рубли или продать
      if (p2p) { const q = Math.round(p2p > 0 ? 400 + r() * 2600 : hold.USDT * (.3 + r() * .4)); T.push({ date, asset: 'USDT', quote: 'RUB', side: p2p > 0 ? 'buy' : 'sell', qty: q, price: +(rate * (p2p > 0 ? 1.005 + r() * .02 : .985 + r() * .015)).toFixed(2), fee: 0, ex: 'P2P' }); hold.USDT += p2p * q; continue; }
      let a = pick(r, ['BTC', 'BTC', 'BTC', 'ETH', 'ETH', 'TON']); if (a === 'TON' && y * 12 + m < 2021 * 12 + 10) a = 'ETH';
      const px = +(PX[a][y][m - 1] * (.96 + r() * .08)).toPrecision(5), sell = hold[a] > min[a] * 2 && r() < (y < 2024 ? .25 : .55), q = +(sell ? hold[a] * (.05 + r() * .15) : hold.USDT * (.25 + r() * .5) * (a === 'TON' ? .4 : 1) / px).toFixed(dec[a]);
      if (q < min[a]) continue; T.push({ date, asset: a, quote: 'USDT', side: sell ? 'sell' : 'buy', qty: q, price: px, fee: +(q * px * .001).toFixed(4), ex }); hold[a] += sell ? -q : q; hold.USDT += sell ? q * px : -q * px;
    }
  }
  return T.sort((a, b) => a.date < b.date ? -1 : a.date > b.date ? 1 : 0).slice(0, 400);
}

// ---------- расчёт: рубли → FIFO → год, перенос убытка, ставка ----------
function compute(trades) {
  const ev = [];
  trades.forEach((t, i) => {
    const q = t.quote, rate = cbr(t.date), qu = usd(q, t.date);
    const rubV = t.qty * t.price * qu * rate, feeRub = t.fee * qu * rate;
    ev.push({ i, date: t.date, asset: t.asset, side: t.side, qty: t.qty, rub: rubV, fee: feeRub, ex: t.ex });
    if (!FIAT.test(q)) ev.push({ i, date: t.date, asset: q, side: t.side === 'buy' ? 'sell' : 'buy', qty: t.qty * t.price, rub: rubV, fee: 0, ex: t.ex }); // обратное событие по котируемому активу
  });
  ev.sort((a, b) => a.date < b.date ? -1 : a.date > b.date ? 1 : a.i - b.i);
  const Q = {}, pairs = [], warn = [], nominal = {};
  ev.forEach(e => {
    const L = Q[e.asset] || (Q[e.asset] = []);
    if (e.side === 'buy') return L.push({ qty: e.qty, unit: (e.rub + e.fee) / e.qty, date: e.date });
    let left = e.qty; const pu = (e.rub - e.fee) / e.qty;
    while (left > 1e-12 && L.length) { const lot = L[0], take = Math.min(left, lot.qty), cost = lot.unit * take, pr = pu * take; pairs.push({ asset: e.asset, buyDate: lot.date, sellDate: e.date, qty: take, cost, proceeds: pr, result: pr - cost, ex: e.ex }); lot.qty -= take; left -= take; if (lot.qty <= 1e-12) L.shift(); }
    if (left > 1e-9) { // нет остатка: стейблкоин по номиналу, крипта — предупреждение
      const st = STABLE.test(e.asset), cost = st ? left * cbr(e.date) : 0; if (st) nominal[e.asset] = (nominal[e.asset] || 0) + left; else warn.push({ date: e.date, asset: e.asset, qty: left });
      pairs.push({ asset: e.asset, buyDate: '', sellDate: e.date, qty: left, cost, proceeds: pu * left, result: pu * left - cost, ex: e.ex, note: st ? 'по номиналу' : 'нет покупки' });
    }
  });
  const years = {};
  pairs.forEach(p => {
    const y = +p.sellDate.slice(0, 4), m = +p.sellDate.slice(5, 7) - 1, Y = years[y] || (years[y] = { year: y, result: 0, months: Array(12).fill(0), assets: {}, n: 0, proceeds: 0, cost: 0 }), A = Y.assets[p.asset] || (Y.assets[p.asset] = { qty: 0, proceeds: 0, result: 0, n: 0 });
    Y.result += p.result; Y.months[m] += p.result; Y.n++; Y.proceeds += p.proceeds; Y.cost += p.cost; A.qty += p.qty; A.proceeds += p.proceeds; A.result += p.result; A.n++;
  });
  let carry = 0; const yearList = Object.keys(years).map(Number).sort();
  yearList.forEach(y => { const Y = years[y], R = rateFor(y); let base = Y.result; Y.usedCarry = 0; if (base < 0) { carry -= base; base = 0; } else { Y.usedCarry = Math.min(carry, base); base -= Y.usedCarry; carry -= Y.usedCarry; } Y.base = base; Y.low = Math.min(base, R.thr) * R.low; Y.high = Math.max(0, base - R.thr) * R.high; Y.tax = Y.low + Y.high; Y.carryAfter = carry; Y.rate = R; });
  return { pairs, years, yearList, warn, nominal };
}

// ---------- интерфейс демо ----------
const UI = { filter: 'all', shown: 60, seed: 1, shownTax: 0 }, KEY = 'fifo:datasets', $st = $('#status'), MSG = $st.dataset;
const status = (k, v = {}) => { $st.textContent = MSG[k].replace(/\{(\w)\}/g, (_, c) => v[c]); }, exs = () => [...new Set(UI.data.trades.map(t => t.ex))].join(', ');
function save() { try { localStorage.setItem(KEY, JSON.stringify({ trades: UI.data.trades, meta: UI.data.meta })); } catch { } }
function dl(name, text) { const a = document.createElement('a'); a.download = name; a.href = URL.createObjectURL(new Blob(['\ufeff' + text], { type: 'text/csv;charset=utf-8' })); a.click(); }
function progress(ms, done) { const p = $('#progress'), bar = p.firstElementChild; p.hidden = false; anim(ms, (e, k) => { bar.style.width = k * 100 + '%'; if (k === 1) setTimeout(() => { p.hidden = true; bar.style.width = '0'; done(); }, 120); }); }
function setData(trades, meta) {
  const t0 = performance.now(); UI.data = { trades, meta }; UI.calc = compute(trades); const ms = Math.round(performance.now() - t0) || 1; save();
  const yl = UI.calc.yearList, ny = new Date().getFullYear() - 1; UI.year = yl.includes(UI.year) ? UI.year : yl.includes(ny) ? ny : yl[yl.length - 1]; UI.filter = 'all'; UI.shown = 60; render();
  const m = meta, D = m.delim; $st.replaceChildren(tpl('#tpl-status', { name: m.name, n: trades.length, exs: exs(), years: trades[0].date.slice(0, 4) + '–' + trades[trades.length - 1].date.slice(0, 4), enc: m.enc ? ` · ${m.enc} · «${D === '\t' ? 'Tab' : D}»` : '', conf: m.conf != null ? ` · уверенность ${Math.round(m.conf * 100)} %` : '', bad: m.bad ? ` · пропущено строк: ${m.bad}` : '', ms }));
}
const chips = (el, items, cur, label, on) => { el.innerHTML = items.map(v => `<button class="chip" type="button" data-v="${esc(v)}" aria-pressed="${v === cur}">${label(v)}</button>`).join(''); $$('.chip', el).forEach(b => b.onclick = () => on(b.dataset.v)); };
function render() {
  const C = UI.calc, Y = C.years[UI.year], R = Y.rate; $('#empty').hidden = true; $('#result').hidden = false; $('#mapping').hidden = true;
  chips($('#years'), C.yearList.map(String), String(UI.year), v => v, v => { UI.year = +v; UI.filter = 'all'; UI.shown = 60; render(); });
  $('#yr').textContent = UI.year; const from = UI.shownTax; anim(600, e => $('#tax').textContent = rub(lerp(from, Y.tax, e))); UI.shownTax = Y.tax;
  fill($('#tax-note'), { rate: R.label, n: Y.n });
  fill($('#kv'), { result: signed(Y.result), carry: rub(Y.usedCarry), base: rub(Y.base), lowL: `${R.low * 100} % до ${grp(R.thr / 1e6, 1)} млн ₽`, low: rub(Y.low), highL: `${R.high * 100} % сверх порога`, high: rub(Y.high), carryAfter: rub(Y.carryAfter) });
  renderChart(Y);
  const cls = v => v < 0 ? 'neg' : 'pos';
  $('#assets tbody').innerHTML = Object.entries(Y.assets).sort((a, b) => Math.abs(b[1].result) - Math.abs(a[1].result)).map(([a, A]) => `<tr><td>${esc(a)}</td><td class="num">${A.n}</td><td class="num">${qf(A.qty)}</td><td class="num">${grp(Math.round(A.proceeds))}</td><td class="num ${cls(A.result)}">${signed(A.result)}</td></tr>`).join('');
  $('#assets tfoot').innerHTML = `<tr><td>Итого</td><td class="num">${Y.n}</td><td></td><td class="num">${grp(Math.round(Y.proceeds))}</td><td class="num ${cls(Y.result)}">${signed(Y.result)}</td></tr>`;
  const w = $('#warn'); w.replaceChildren(...C.warn.filter(x => x.date.startsWith(UI.year)).map(x => tpl('#tpl-w', { q: qf(x.qty) + ' ' + x.asset, d: dmy(x.date) })), ...Object.entries(C.nominal).map(([a, q]) => tpl('#tpl-nom', { a, q: qf(q) + ' ' + a }))); w.hidden = !w.childElementCount;
  renderPairs(); $$('.reveal:not(.in)', $('#result')).forEach(show);
}
const kfmt = v => (v < 0 ? MI : '+') + (Math.abs(v) >= 1e4 ? grp(Math.abs(v) / 1000) + ' тыс.' : grp(Math.abs(v)));
function renderChart(Y) { // столбики; viewBox по ширине контейнера, чтобы подписи не мельчали
  const svg = $('#chart'), R = Math.round, W = Math.max(320, svg.clientWidth || 720), tp = 26, ph = 200, bw = (W - 20) / 12, v = Y.months, mp = Math.max(0, ...v), mn = Math.max(0, ...v.map(x => -x)), sum = mp + mn || 1, y0 = tp + ph * (mp / sum || (mn ? 0 : .5)), k = ph / sum;
  let s = `<line x1="10" x2="${W - 10}" y1="${R(y0)}" y2="${R(y0)}" stroke="#0A0A0A" stroke-width="2"/>`; svg.setAttribute('viewBox', `0 0 ${W} 260`);
  v.forEach((val, i) => {
    const x = R(14 + i * bw), w = R(bw - 8), h = R(Math.abs(val) * k), y = R(val >= 0 ? y0 - h : y0), cx = x + w / 2;
    if (val) s += `<rect x="${x}" y="${y}" width="${w}" height="${Math.max(2, h)}" fill="${val > 0 ? '#B6FF3B' : 'url(#hatch)'}" stroke="#0A0A0A" stroke-width="2"/>`;
    if (Math.abs(val) >= sum * .08 && bw >= 44) s += `<text x="${cx}" y="${val >= 0 ? y - 6 : y + h + 15 <= 234 ? y + h + 15 : y0 - 6}" text-anchor="middle" font-size="12">${kfmt(val)}</text>`;
    s += `<text x="${cx}" y="248" text-anchor="middle">${svg.dataset.m.split(' ')[i]}</text>`;
  });
  $('#bars').innerHTML = s;
}
addEventListener('resize', () => UI.calc && renderChart(UI.calc.years[UI.year]));
const pairRows = all => UI.calc.pairs.filter(p => p.sellDate.startsWith(UI.year) && (all || UI.filter === 'all' || p.asset === UI.filter));
const rowHtml = (p, i) => `<tr style="animation-delay:${Math.min(i, 40) * 15}ms"><td>${i + 1}</td><td>${esc(p.asset)}${p.note ? ' · ' + p.note : ''}</td><td>${dmy(p.buyDate)}</td><td class="num">${qf(p.qty)}</td><td class="num">${grp(Math.round(p.cost))}</td><td>${dmy(p.sellDate)}</td><td class="num">${grp(Math.round(p.proceeds))}</td><td class="num ${p.result < 0 ? 'neg' : 'pos'}">${signed(p.result)}</td></tr>`;
function renderPairs() {
  const rows = pairRows(); chips($('#filter'), ['all', ...Object.keys(UI.calc.years[UI.year].assets)], UI.filter, v => v === 'all' ? 'Все' : esc(v), v => { UI.filter = v; UI.shown = 60; renderPairs(); });
  $('#pairs-n').textContent = rows.length; $('#pairs tbody').innerHTML = rows.slice(0, UI.shown).map(rowHtml).join('');
  const more = $('#more'), rest = rows.length - UI.shown; more.hidden = rest <= 0; fill(more, { n: Math.min(60, rest) });
}
$('#more').onclick = () => { UI.shown += 60; renderPairs(); };

// ---------- загрузка, сопоставление столбцов, демо, хранение ----------
function handleFile(file) {
  if (!file) return;
  if (/\.xlsx?$/i.test(file.name)) return status('xlsx', { f: file.name });
  if (file.size > 10 * 1024 * 1024) return status('big');
  const fr = new FileReader(); fr.onload = () => { const { text, enc } = decode(fr.result); ingest(text, { name: file.name, enc }); }; fr.onerror = () => status('err'); fr.readAsArrayBuffer(file);
}
function ingest(text, meta) {
  const { rows, delim } = parseDelimited(text); if (rows.length < 2) return status('empty');
  const presetId = $('#preset').value, P = PRESETS[presetId], hasHeader = !looksData(rows[0]), headers = hasHeader ? rows[0] : P ? P[1].split(',') : rows[0].map((_, i) => 'Столбец ' + (i + 1)), body = hasHeader ? rows.slice(1) : rows, { map, conf } = autoMap(headers);
  UI.src = { rows: body, headers, map, meta: { ...meta, delim, preset: presetId, conf } }; $('#map-btn').hidden = false;
  if (conf < .8) { status('low', { f: meta.name, n: body.length, c: Math.round(conf * 100) }); openMapping(); } else applyMapping();
}
function applyMapping() {
  const S = UI.src, { trades, bad } = rowsToTrades(S.rows, S.map, S.meta.preset);
  if (!trades.length) { status('none'); return openMapping(); }
  progress(700, () => { setData(trades, { ...S.meta, bad }); go('#result'); });
}
function openMapping() {
  const S = UI.src; if (!S) return; $('#empty').hidden = true; $('#mapping').hidden = false; $('#map-conf').textContent = 'уверенность ' + Math.round(S.meta.conf * 100) + ' %';
  const mf = $('#map-fields'); mf.innerHTML = mf.dataset.fields.split('|').map(kv => { const [f, lab] = kv.split(':'); return `<label>${lab}<select data-f="${f}"><option value="-1">— нет —</option>${S.headers.map((h, i) => `<option value="${i}"${S.map[f] === i ? ' selected' : ''}>${esc(h)}</option>`).join('')}</select></label>`; }).join('');
  $('#map-preview').innerHTML = `<thead><tr>${S.headers.map(h => `<th>${esc(h)}</th>`).join('')}</tr></thead><tbody>${S.rows.slice(0, 5).map(r => `<tr>${S.headers.map((_, i) => `<td>${esc(r[i] ?? '')}</td>`).join('')}</tr>`).join('')}</tbody>`; go('#mapping');
}
$('#map-apply').onclick = () => { const S = UI.src; $$('#map-fields select').forEach(s => S.map[s.dataset.f] = +s.value); S.meta.conf = 1; applyMapping(); };
$('#map-cancel').onclick = () => { $('#mapping').hidden = true; if (!UI.data) $('#empty').hidden = false; };
$('#map-btn').onclick = openMapping;
['#file-hero', '#file-demo'].forEach(s => $(s).onchange = e => { handleFile(e.target.files[0]); e.target.value = ''; });
['#drop-hero', '#drop-demo'].forEach(s => { const d = $(s); d.ondragover = d.ondragenter = e => { e.preventDefault(); d.classList.add('over'); }; d.ondragleave = () => d.classList.remove('over'); d.ondrop = e => { e.preventDefault(); d.classList.remove('over'); handleFile(e.dataTransfer.files[0]); if (s === '#drop-hero') go('#demo'); }; });
function runDemo(silent) {
  const n = UI.seed++, trades = genDemo([1, 5, 9, 6, 4, 14, 8, 7][n % 8]), meta = { name: 'Демо-выгрузка №' + n, conf: 1 };
  if (silent) return setData(trades, meta);
  if ($('#result').hidden) go('#demo'); $('#empty').hidden = true; progress(900, () => { setData(trades, meta); go('#result'); });
}
['#demo-btn', '#demo-btn2', '#demo-btn3', '#demo-btn4'].forEach(s => $(s).onclick = () => runDemo(false));
$('#clear-btn').onclick = () => { try { localStorage.removeItem(KEY); localStorage.setItem('fifo:cleared', '1'); } catch { } UI.data = UI.calc = UI.src = null; UI.shownTax = 0; $('#result').hidden = $('#mapping').hidden = $('#map-btn').hidden = true; $('#empty').hidden = false; status('cleared'); };
(() => { let s, cleared; try { s = JSON.parse(localStorage.getItem(KEY)); cleared = !!localStorage.getItem('fifo:cleared'); } catch { } if (s && s.trades && s.trades.length) setData(s.trades, s.meta || { name: 'Сохранённая выгрузка' }); else if (!cleared) runDemo(true); })();

// ---------- экспорт: CSV, печатная форма A4 ----------
const csvRow = cells => cells.map(c => /[";\n]/.test(c = String(c)) ? '"' + c.replace(/"/g, '""') + '"' : c).join(';');
function ensureData() { if (!UI.data) runDemo(true); return UI.calc.years[UI.year]; }
function exportCsv(all) { // приложение — выбранный год; бухгалтеру — все годы
  ensureData();
  const f = n => String(+n.toFixed(2)).replace('.', ','), rows = all ? UI.calc.pairs : pairRows();
  const lines = [$('#dl-csv').dataset.head, ...rows.map((p, i) => csvRow([i + 1, p.asset, dmy(p.buyDate), f(p.qty), f(p.cost), dmy(p.sellDate), p.ex, f(p.proceeds), f(p.result), p.note || '']))];
  dl(`fifo-${UI.year}-${all ? 'buhgalter' : 'prilozhenie'}.csv`, lines.join('\r\n'));
}
function printReport() {
  const Y = ensureData(), rows = pairRows(1), pr = $('#print');
  pr.replaceChildren(tpl('#tpl-print', { year: UI.year, date: new Date().toLocaleDateString('ru-RU'), exs: exs(), n: UI.data.trades.length, proceeds: rub(Y.proceeds), cost: rub(Y.cost), result: signed(Y.result), carry: rub(Y.usedCarry), base: rub(Y.base), rate: Y.rate.label, tax: rub(Y.tax), pairs: rows.length }));
  $('[data-k="rows"]', pr).innerHTML = rows.map(rowHtml).join('') + `<tr class="tot"><td colspan="4">Итого</td><td class="num">${grp(Math.round(Y.cost))}</td><td></td><td class="num">${grp(Math.round(Y.proceeds))}</td><td class="num">${signed(Y.result)}</td></tr>`;
  window.print();
}
$('#dl-csv').onclick = () => exportCsv(false); $('#dl-xls').onclick = $('#acc-xls').onclick = () => exportCsv(true); $('#dl-print').onclick = $('#acc-print').onclick = printReport;

// ---------- форматы, шаблон, тарифы, сеть ----------
const fc = $('#fmt-chips');
function showFmt(id) { $$('.chip', fc).forEach(b => b.setAttribute('aria-pressed', b.dataset.v === id)); const P = PRESETS[id]; fill($('#fmt-cols'), { name: P[0], cols: P[1].split(',').join(' · '), q: P[2] ? ' · валюта по умолчанию — ' + P[2] : '' }); $('#preset').value = id; }
chips(fc, Object.keys(PRESETS), 'bybit', v => esc(PRESETS[v][0]), showFmt); showFmt('bybit'); $('#preset').value = 'auto';
$('#dl-template').onclick = () => dl('fifo-shablon.csv', $('#tpl-csv').textContent.trim() + '\n');
$$('[data-plan]').forEach(b => b.onclick = () => { const card = b.closest('.plan'); $$('.plan').forEach(p => p.classList.toggle('selected', p === card)); $('#plan-badge').textContent = 'Тариф: ' + $('h3', card).textContent + ' · ' + $('.price', card).firstChild.textContent; ensureData(); go('#result'); });
const on = $('#online'), setOnline = () => { on.textContent = on.dataset[navigator.onLine ? 'on' : 'off']; }; onoffline = ononline = setOnline; setOnline();
initBelt();
})();
