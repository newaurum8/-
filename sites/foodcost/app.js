/* Фудкост — себестоимость блюд, матрица меню Касаваны–Смита, симулятор цены. Данные пользователя — в localStorage (foodcost:v1). */
(() => {
'use strict';
const $ = (s, r = document) => r.querySelector(s), $$ = (s, r = document) => [...r.querySelectorAll(s)];
const RM = matchMedia('(prefers-reduced-motion: reduce)').matches;
const clamp = (v, a, b) => Math.max(a, Math.min(b, v)), lerp = (a, b, t) => a + (b - a) * t;
const easeIO = t => t < .5 ? 2 * t * t : 1 - (-2 * t + 2) ** 2 / 2;
const fmt = n => { n = Math.round(n); return (n < 0 ? '−' : '') + String(Math.abs(n)).replace(/\B(?=(\d{3})+(?!\d))/g, ' '); };
const fmtQ = v => String(Math.round(v * 10) / 10).replace('.', ',');
const rub = n => fmt(n) + ' ₽', signed = n => (n >= 0 ? '+' : '') + fmt(n), pct = v => Math.round(v * 100) + '%';
const esc = s => String(s).replace(/[&<>"]/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]));
const smooth = { behavior: RM ? 'auto' : 'smooth' };

// ---------- Справочники ----------
const QUAD = {
  star: { name: 'Звезда', pl: 'Звёзды', color: '#F2B541', ink: '#171717' },
  horse: { name: 'Лошадка', pl: 'Лошадки', color: '#2E8B57', ink: '#fff' },
  puzzle: { name: 'Загадка', pl: 'Загадки', color: '#3C6E9F', ink: '#fff' },
  dog: { name: 'Собака', pl: 'Собаки', color: '#8C8C8C', ink: '#fff' }
};
const citySel = $('#city'), cityK = () => +citySel.value || 1, cityName = () => citySel.selectedOptions[0].text.split(' ·')[0]; // города — в <select>
// База продуктов (в демо — 68 самых ходовых): название|единица|цена в Москве|отходы %
const PRODUCTS = `Куриное филе|кг|420|3
Курица на кости|кг|260|30
Говядина лопатка|кг|720|12
Говядина вырезка|кг|1450|8
Рибай|кг|2400|5
Фарш говяжий|кг|640|0
Свиная шея|кг|520|10
Бекон|кг|890|0
Лосось филе|кг|1650|8
Креветки|кг|1200|40
Кости говяжьи|кг|120|0
Яйцо|шт|12|10
Молоко|л|85|0
Сливки 33%|л|520|0
Сметана|кг|290|0
Творог|кг|380|0
Масло сливочное|кг|900|0
Пармезан|кг|1900|4
Моцарелла|кг|780|0
Чеддер|кг|950|3
Сливочный сыр|кг|720|0
Йогурт греческий|кг|340|0
Маскарпоне|кг|1150|0
Мука|кг|55|0
Сахар|кг|70|0
Соль|кг|20|0
Перец чёрный|кг|1500|0
Рис|кг|110|0
Спагетти|кг|160|0
Лапша рисовая|кг|210|0
Нут|кг|140|0
Булочка для бургера|шт|28|0
Хлеб бородинский|кг|120|8
Печенье савоярди|кг|650|0
Масло оливковое|л|950|0
Масло растительное|л|140|0
Кокосовое молоко|л|350|0
Соус рыбный|л|420|0
Паста том-ям|кг|1100|0
Тахини|кг|850|0
Майонез|кг|210|0
Горчица|кг|260|0
Какао-порошок|кг|900|0
Шоколад тёмный|кг|1200|0
Кофе зерно|кг|1400|0
Сироп ванильный|л|700|0
Вода газированная|л|60|0
Лук|кг|35|16
Картофель|кг|45|25
Морковь|кг|40|20
Свёкла|кг|38|20
Капуста|кг|30|15
Томаты|кг|220|5
Солёные огурцы|кг|210|5
Салат романо|кг|420|15
Шампиньоны|кг|280|5
Цветная капуста|кг|190|25
Перец болгарский|кг|240|18
Чеснок|кг|250|12
Имбирь|кг|380|15
Лайм|кг|450|10
Лимон|кг|160|10
Кинза|кг|900|20
Мята|кг|1500|20
Базилик|кг|1800|15
Ягоды замороженные|кг|520|0
Горошек зелёный|кг|180|0
Колбаса докторская|кг|480|3`.split('\n').map((s, id) => { const [name, unit, price, waste] = s.split('|'); return { id, name, unit, price: +price, waste: +waste }; });
// Демо-кафе: название|цена|продано за месяц|выход, г|индекс продукта:брутто,...
const DEMO = `Том-ям|590|310|380|9:60,36:150,38:30,55:50,52:40,60:20,62:5,27:60
Сырники|320|540|180|15:100,11:1,23:20,24:10,35:10,14:30
Карбонара|520|1253|330|28:140,7:110,13:120,17:50,11:2,16:15,58:5,34:10
Цезарь|450|410|260|0:90,54:80,17:15,11:1,32:30,34:15,40:25,58:3
Борщ|350|380|350|10:120,2:60,50:80,51:70,48:80,49:30,47:30,52:30,14:25,58:3
Бургер|490|450|320|5:150,31:1,19:30,52:30,47:20,54:15,53:20,40:20,41:5,48:120,35:20
Паста с лососем|690|120|320|28:130,8:90,13:100,17:20,47:20,16:15,58:3,64:3
Рибай|1890|60|420|4:350,16:20,58:5,25:3,26:2,48:150,35:20,54:30
Капучино|220|1450|250|44:18,12:180
Чизкейк|330|290|140|20:110,24:30,11:1,13:30,33:30,16:15,65:20
Том-кха|540|140|380|0:90,36:200,55:50,60:20,59:10,62:5,38:15,27:60
Фо-бо|490|210|450|10:200,3:70,29:80,47:30,59:10,62:5,60:15,37:10,64:3
Шакшука|390|260|300|11:2,52:180,57:50,47:40,58:5,34:15,32:40,62:3
Круассан|190|620|70|23:60,16:35,12:20,24:8,25:1
Оливье|290|150|200|48:80,49:40,11:2,67:60,53:40,66:30,40:40
Пельмени|380|330|300|23:100,11:1,5:100,6:30,47:30,14:30,16:10
Тирамису|390|240|150|22:50,33:25,11:1,24:20,44:6,42:3,13:20
Лимонад|250|520|400|61:60,24:25,46:300,63:5,60:20
Раф|280|480|300|44:18,13:100,45:20,12:100
Гренки|180|70|150|32:120,35:25,58:8,25:1,14:30
Хумус|340|90|200|30:80,39:30,34:20,61:20,58:5,32:60
Стейк из цветной капусты|420|50|280|56:300,34:20,39:20,58:5,61:15,62:3,21:40
Какао|230|180|300|42:20,12:220,24:15,43:15
Панкейки|340|200|220|23:80,12:120,11:1,24:20,16:20,65:40,45:15`.split('\n').map((s, i) => {
  const [name, price, sold, yld, ings] = s.split('|');
  return { id: i + 1, name, price: +price, sold: +sold, yield: +yld, ingredients: ings.split(',').map(x => { const [p, b] = x.split(':'); return { productId: +p, brutto: +b, waste: PRODUCTS[+p].waste }; }) };
});

// ---------- Расчёт: себестоимость, матрица, симуляция ----------
const ingCost = (i, k = 1, raw = 1) => { const p = PRODUCTS[i.productId]; return p ? (p.unit === 'шт' ? i.brutto : i.brutto / 1000) * (i.price != null ? i.price : p.price * k) * raw : 0; };
const dishCost = (d, k, raw) => d.ingredients.reduce((s, i) => s + ingCost(i, k, raw), 0);
const netto = i => { const p = PRODUCTS[i.productId]; return p && p.unit === 'шт' ? i.brutto : i.brutto * (1 - i.waste / 100); };
function analyze(dishes, k = 1, raw = 1) {
  const rows = dishes.map(d => { const cost = dishCost(d, k, raw), margin = d.price - cost; return { d, cost, margin, price: d.price, sold: d.sold, fc: d.price > 0 ? cost / d.price : 0, rev: d.price * d.sold, profit: margin * d.sold }; });
  const sold = rows.reduce((s, r) => s + r.sold, 0), thr = .7 / (rows.length || 1), avg = sold ? rows.reduce((s, r) => s + r.margin * r.sold, 0) / sold : 0;
  let costSum = 0, revSum = 0;
  rows.forEach(r => { r.share = sold ? r.sold / sold : 0; const pop = r.share >= thr, hi = r.margin >= avg; r.q = pop ? (hi ? 'star' : 'horse') : (hi ? 'puzzle' : 'dog'); costSum += r.cost * r.sold; revSum += r.rev; });
  return { rows, thr, avg, sold, fc: revSum ? costSum / revSum : 0, rev: revSum, profit: revSum - costSum, maxRev: Math.max(1, ...rows.map(r => r.rev)) };
}
const simulate = (r, price, el) => { const sold = r.sold * Math.pow(price / r.price, el), profit = sold * (price - r.cost); return { sold, profit, delta: profit - r.profit }; };
// Прогноз по правилам: Лошадки +5% к цене, Загадки +15% продаж
const forecast = (a, el) => a.rows.reduce((s, r) => s + (r.q === 'horse' ? simulate(r, r.price * 1.05, el).delta : r.q === 'puzzle' ? .15 * r.sold * r.margin : 0), 0);

// ---------- Count-up (500 мс) ----------
function countTo(el, value, format) {
  const from = el._cur ?? 0, start = performance.now(); el._to = value;
  if (RM || Math.abs(value - from) < .5) { el._cur = value; el.textContent = format(value); return; }
  const tick = now => { if (el._to !== value) return; const t = clamp((now - start) / 500, 0, 1); el._cur = lerp(from, value, easeIO(t)); el.textContent = format(el._cur); if (t < 1) requestAnimationFrame(tick); };
  requestAnimationFrame(tick);
}

// ---------- Матрица на canvas: стикеры, пунктирные оси, пузыри с дрейфом и отталкиванием ----------
function makeMatrix(canvas, onPick) {
  const ctx = canvas.getContext('2d');
  let W = 0, H = 0, s = 1, items = [], t0 = 0, hl = '', raf = 0, visible = true;
  const anchor = it => ({ x: W / 2 + clamp(Math.log2(it.share / it.thr || 1e-9), -3, 3) * (W / 2 - 80 * s) / 3, y: H / 2 - clamp(Math.log2(Math.max(it.margin, 1) / Math.max(it.avg, 1)), -2.2, 2.2) * (H / 2 - 64 * s) / 2.2 });
  const radius = it => (10 + 26 * Math.sqrt(it.rr)) * s;
  const snap = it => { const a = anchor(it); it.r = radius(it); it.x = it.ax = it.fx = it.tx = a.x; it.y = it.ay = it.fy = it.ty = a.y; };
  function resize() {
    const w = canvas.clientWidth; if (!w || w === W) return; W = w; H = w * .75; s = clamp(W / 960, .5, 1);
    const dpr = Math.min(devicePixelRatio || 1, 2); canvas.width = W * dpr; canvas.height = H * dpr; ctx.setTransform(dpr, 0, 0, dpr, 0, 0); items.forEach(snap); draw();
  }
  function setData(a, animate) {
    resize(); const prev = new Map(items.map(it => [it.name, it]));
    items = a.rows.map(r => {
      const it = prev.get(r.d.name) || { name: r.d.name, nx: 0, ny: 0, x: null };
      Object.assign(it, { share: r.share, margin: r.margin, thr: a.thr, avg: a.avg, rr: r.rev / a.maxRev }); it.r = radius(it);
      if (it.x === null || !animate || RM) snap(it); else { const p = anchor(it); it.fx = it.ax; it.fy = it.ay; it.tx = p.x; it.ty = p.y; }
      return it;
    });
    t0 = performance.now(); if (RM) step(t0); else kick();
  }
  function step(now) {
    const e = easeIO(clamp((now - t0) / 600, 0, 1)), cx = W / 2, cy = H / 2;
    for (const it of items) {
      it.ax = lerp(it.fx, it.tx, e); it.ay = lerp(it.fy, it.ty, e);
      if (RM) { it.x = it.ax; it.y = it.ay; } else { if (Math.random() < .03) { it.nx = Math.random() * 6 - 3; it.ny = Math.random() * 6 - 3; } it.x += (it.ax + it.nx - it.x) * .05; it.y += (it.ay + it.ny - it.y) * .05; }
      it.q = it.ax >= cx ? (it.ay <= cy ? 'star' : 'horse') : (it.ay <= cy ? 'puzzle' : 'dog');
    }
    if (!RM) for (let i = 0; i < items.length; i++) for (let j = i + 1; j < items.length; j++) {
      const a = items[i], b = items[j]; let dx = b.x - a.x, dy = b.y - a.y; const d = Math.hypot(dx, dy) || 1, min = a.r + b.r + 4;
      if (d < min) { const f = (min - d) / d * .18; dx *= f; dy *= f; a.x -= dx; a.y -= dy; b.x += dx; b.y += dy; }
    }
    draw();
  }
  const mono = px => `${Math.round(Math.max(9, px * s))}px "IBM Plex Mono", monospace`;
  function draw() {
    if (!W) return; const cx = W / 2, cy = H / 2;
    ctx.fillStyle = '#FFFDF4'; ctx.fillRect(0, 0, W, H);
    ctx.strokeStyle = 'rgba(23,23,23,.05)'; ctx.lineWidth = 1; ctx.beginPath(); for (let y = 18; y < H; y += 18) { ctx.moveTo(0, y + .5); ctx.lineTo(W, y + .5); } ctx.stroke();
    ctx.setLineDash([5, 4]); ctx.strokeStyle = '#171717'; ctx.beginPath(); ctx.moveTo(cx + .5, 14); ctx.lineTo(cx + .5, H - 14); ctx.moveTo(14, cy + .5); ctx.lineTo(W - 14, cy + .5); ctx.stroke(); ctx.setLineDash([]);
    const halo = (t, x, y) => { ctx.strokeText(t, x, y); ctx.fillText(t, x, y); }; ctx.lineJoin = 'round'; ctx.lineWidth = 3; ctx.strokeStyle = 'rgba(255,253,244,.9)';
    ctx.fillStyle = '#171717'; ctx.font = mono(12); ctx.textBaseline = 'alphabetic'; ctx.textAlign = 'right'; halo('популярность →', W - 18, cy - 7); ctx.textAlign = 'left'; halo('маржа ↑', cx + 8, 30 * s + 6);
    ctx.letterSpacing = '1px';
    ctx.font = `800 ${Math.round(12 * s + 2)}px Rubik, sans-serif`; ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
    for (const [q, x, y, right, top] of [['star', W - 18, 18, 1, 1], ['puzzle', 18, 18, 0, 1], ['horse', W - 18, H - 18, 1, 0], ['dog', 18, H - 18, 0, 0]]) {
      const Q = QUAD[q], txt = Q.pl.toUpperCase(), w = ctx.measureText(txt).width + 24 * s, h = 26 * s, ox = right ? -w : 0, oy = top ? 0 : -h;
      ctx.save(); ctx.translate(x, y); ctx.rotate((right ? -2 : 1.5) * Math.PI / 180); ctx.fillStyle = Q.color; ctx.fillRect(ox, oy, w, h); ctx.fillStyle = Q.ink; ctx.fillText(txt, ox + w / 2, oy + h / 2 + 1); ctx.restore();
    }
    ctx.letterSpacing = '0px';
    const sorted = [...items].sort((a, b) => b.r - a.r);
    for (const it of sorted) { ctx.beginPath(); ctx.arc(it.x, it.y, it.r, 0, Math.PI * 2); ctx.fillStyle = QUAD[it.q].color + 'd9'; ctx.fill(); ctx.lineWidth = it.name === hl ? 3 : 1.5; ctx.strokeStyle = '#171717'; ctx.stroke(); }
    ctx.font = mono(11); ctx.textAlign = 'center'; ctx.textBaseline = 'top'; ctx.lineWidth = 3; ctx.strokeStyle = 'rgba(255,253,244,.9)'; ctx.fillStyle = '#171717';
    for (const it of sorted) {
      if (W < 620 && it.r < 11 && it.name !== hl) continue;
      const tw = ctx.measureText(it.name).width, x = clamp(it.x, tw / 2 + 4, W - tw / 2 - 4), y = it.y + it.r + 3;
      halo(it.name, x, y);
    }
  }
  const loop = now => { raf = 0; if (visible) step(now); if (!RM) raf = requestAnimationFrame(loop); };
  const kick = () => { if (!raf) raf = requestAnimationFrame(loop); };
  if ('IntersectionObserver' in window) new IntersectionObserver(es => { visible = es[0].isIntersecting; }, { rootMargin: '80px' }).observe(canvas);
  new ResizeObserver(resize).observe(canvas);
  document.fonts?.ready.then(draw);
  canvas.addEventListener('click', e => {
    if (!onPick) return; const b = canvas.getBoundingClientRect(), x = e.clientX - b.left, y = e.clientY - b.top;
    const hit = [...items].sort((a, c) => a.r - c.r).find(it => Math.hypot(it.x - x, it.y - y) <= it.r + 4); if (hit) onPick(hit.name);
  });
  return { setData, highlight: n => { hl = n; if (RM) draw(); }, toImage: () => canvas.toDataURL('image/png') };
}

// ---------- Hero: демо-кафе, ползунок цены Карбонары, чековый принтер ----------
const heroM = makeMatrix($('#hero-matrix'));
const heroBase = DEMO.map(d => ({ ...d })), carb = heroBase.find(d => d.name === 'Карбонара'), P0 = carb.price, Q0 = carb.sold;
const heroAt = price => { carb.price = price; carb.sold = Q0 * Math.pow(price / P0, -1.2); return analyze(heroBase, 1); };
const baseProfit = heroAt(P0).rows.find(r => r.d === carb).profit;
const heroPrice = $('#hero-price'), heroDelta = $('#hero-delta'), tape = $('#tape'), tapeLines = $('#tape-lines'), note0 = $('#hero-note').textContent;
let heroA, printT = 0, printing = 0, auto = true;
const heroGain = r => Math.round((r.profit - baseProfit) / 100) * 100; // округление до сотни
function heroUpdate(animate) {
  const p = +heroPrice.value; heroA = heroAt(p); const r = heroA.rows.find(x => x.d === carb), gain = heroGain(r);
  $('#hero-price-out').textContent = rub(p); heroM.setData(heroA, animate); heroM.highlight('Карбонара');
  countTo(heroDelta, gain, v => signed(v) + ' ₽'); heroDelta.style.color = gain >= 0 ? '#2E8B57' : '#D62828';
  $('#hero-note').textContent = p === P0 ? note0 : `/мес к прибыли: продажи −${pct(1 - r.sold / Q0)}, зато +${fmt(p - P0)} ₽ с порции. Карбонара — ${QUAD[r.q].name}${r.q === 'star' ? ', переехала из Лошадок' : ''}.`;
  clearTimeout(printT); printT = setTimeout(printReceipt, 350);
}
function printReceipt() {
  const rows = heroA.rows, p = +heroPrice.value, r = rows.find(x => x.d === carb), pick = (q, asc) => rows.filter(x => x.q === q && x.d !== carb).sort((a, b) => (a.profit - b.profit) * (asc ? 1 : -1))[0];
  const star = pick('star'), horse = pick('horse'), puz = pick('puzzle'), dog = pick('dog', 1);
  const lines = [
    r.q === 'star' ? ['ЛОШАДКА → ЗВЕЗДА: Карбонара', `+${fmt(p - P0)} ₽ к цене, фудкост ${pct(r.fc)}`] : p > P0 ? ['ЛОШАДКА: Карбонара', `+${fmt(p - P0)} ₽ — ещё не Звезда, фудкост ${pct(r.fc)}`] : ['ЛОШАДКА: Карбонара', `фудкост ${pct(r.fc)} — выше нормы 35%`],
    star && [`ЗВЕЗДА: ${star.d.name}`, 'цену не трогать, место сверху'],
    horse && [`ЛОШАДКА: ${horse.d.name}`, '+5% к цене или −10% порция'],
    puz && [`ЗАГАДКА: ${puz.d.name}`, '«блюдо дня», поднять в меню'],
    dog && [`СОБАКА: ${dog.d.name}`, horse ? `убрать или в комбо с «${horse.d.name}»` : 'убрать из меню'],
    ['ИТОГО ПО КАРБОНАРЕ', `${signed(heroGain(r))} ₽/мес`]
  ].filter(Boolean);
  tapeLines.innerHTML = ''; const id = ++printing;
  lines.forEach(([b, t], i) => { const add = () => { if (id !== printing) return; const li = document.createElement('li'); if (i === lines.length - 1) li.className = 'total'; li.innerHTML = `<b>${esc(b)}</b>${esc(t)}`; tapeLines.appendChild(li); tape.classList.remove('tick'); void tape.offsetWidth; tape.classList.add('tick'); }; RM ? add() : setTimeout(add, 120 * i + 80); });
}
heroPrice.addEventListener('input', () => heroUpdate(true));
['pointerdown', 'keydown'].forEach(ev => heroPrice.addEventListener(ev, () => { auto = false; }, { passive: true }));
function autoplay() { // один раз сам двигает ползунок 520 → 590, пока пользователь его не тронул
  if (RM) { heroPrice.value = 590; heroUpdate(false); return; }
  const start = performance.now() + 1400, tick = now => { if (!auto) return; const t = clamp((now - start) / 1300, 0, 1); if (t > 0) { heroPrice.value = Math.round(lerp(520, 590, easeIO(t)) / 5) * 5; heroUpdate(true); } if (t < 1) requestAnimationFrame(tick); };
  requestAnimationFrame(tick);
}

// ---------- Демо: состояние и хранение ----------
const KEY = 'foodcost:v1';
const state = { city: 0, dishes: [], elasticity: -1.2, raw: 1, sel: null, sort: { key: 'profit', dir: -1 }, editing: null };
function save() { try { localStorage.setItem(KEY, JSON.stringify({ city: state.city, dishes: state.dishes, elasticity: state.elasticity })); } catch (e) { /* приватный режим */ } }
function load() { try { const s = JSON.parse(localStorage.getItem(KEY)); if (s && Array.isArray(s.dishes)) { state.city = clamp(s.city | 0, 0, citySel.options.length - 1); state.dishes = s.dishes.filter(d => d && d.name && Array.isArray(d.ingredients)); state.elasticity = +s.elasticity || -1.2; return true; } } catch (e) { /* нет данных */ } return false; }
const newId = () => Math.max(0, ...state.dishes.map(d => d.id)) + 1, demoCopy = () => JSON.parse(JSON.stringify(DEMO));
function loadDemo() { state.dishes = demoCopy(); state.sel = 3; save(); renderAll(); }

let A;
const demoM = makeMatrix($('#demo-matrix'), name => { const d = state.dishes.find(x => x.name === name); if (d) select(d.id); });
const selRow = () => A.rows.find(r => r.d.id === state.sel);
function renderAll() {
  A = analyze(state.dishes, cityK(), state.raw);
  if (!state.dishes.some(d => d.id === state.sel)) state.sel = state.dishes[0]?.id ?? null;
  renderKpis(); renderTable(); renderRecs(); demoM.setData(A, true); demoM.highlight(selRow()?.d.name || '');
  $$('.quad .ex').forEach(el => { const n = A.rows.filter(r => r.q === el.dataset.q).map(r => r.d.name); el.textContent = 'Сейчас в меню: ' + (n.length ? n.slice(0, 4).join(', ') + (n.length > 4 ? ` и ещё ${n.length - 4}` : '') : 'никого'); });
  const badge = $('#scenario-badge'); badge.hidden = state.raw === 1; badge.textContent = `сценарий: сырьё ${signed((state.raw - 1) * 100)}%`;
  renderSelects(); renderTech(); renderSim();
}
function select(id) { state.sel = id; renderTable(); demoM.highlight(selRow()?.d.name || ''); renderSelects(); renderTech(); renderSim(); }
function renderKpis() {
  countTo($('#k-n'), A.rows.length, fmt); countTo($('#k-fc'), A.fc * 100, v => Math.round(v) + '%'); $('#k-fc').style.color = A.fc > .35 ? '#D62828' : '';
  countTo($('#k-rev'), A.rev, fmt); countTo($('#k-profit'), A.profit, fmt); countTo($('#k-fore'), forecast(A, state.elasticity), v => signed(v) + ' ₽');
}
const stick = q => `<span class="sticker${q === 'horse' || q === 'dog' ? ' s2' : ''}" style="--c:${QUAD[q].color};--i:${QUAD[q].ink}">${QUAD[q].name}</span>`;
function renderTable() {
  const { key, dir } = state.sort, rows = [...A.rows].sort((a, b) => (a[key] - b[key]) * dir || a.d.name.localeCompare(b.d.name, 'ru'));
  $('#tbody').innerHTML = rows.map(r => `<tr data-id="${r.d.id}" class="${r.d.id === state.sel ? 'sel' : ''}" style="--qc:${QUAD[r.q].color}"><td>${esc(r.d.name)}${r.d.ingredients.length ? '' : ' <small>без техкарты</small>'}</td><td>${stick(r.q)}</td><td>${fmt(r.price)}</td><td>${fmt(r.cost)}</td><td class="${r.fc > .35 ? 'bad' : ''}">${r.d.ingredients.length ? pct(r.fc) : '—'}</td><td>${fmt(r.margin)}</td><td>${fmt(r.sold)}</td><td class="opt">${fmt(r.rev)}</td><td class="opt">${fmt(r.profit)}</td><td><span class="act"><button type="button" data-edit="${r.d.id}" aria-label="Изменить ${esc(r.d.name)}">изм.</button><button type="button" data-del="${r.d.id}" aria-label="Удалить ${esc(r.d.name)}">×</button></span></td></tr>`).join('');
  $('#empty').hidden = rows.length > 0;
  $$('#table th').forEach(th => { const b = th.querySelector('.sort'); if (b) b.dataset.sort === key ? th.setAttribute('aria-sort', dir < 0 ? 'descending' : 'ascending') : th.removeAttribute('aria-sort'); });
}
function renderRecs() {
  const el = state.elasticity, list = A.rows.map(r => {
    let gain = 0, text;
    if (r.q === 'horse') { const s5 = simulate(r, r.price * 1.05, el); gain = s5.delta; text = `+5% к цене → ${rub(Math.round(r.price * 1.05))}, продажи −${pct(1 - s5.sold / r.sold)}`; }
    else if (r.q === 'puzzle') { gain = .15 * r.sold * r.margin; text = 'поднять в меню, описание, «блюдо дня» (+15% продаж)'; }
    else text = r.q === 'dog' ? 'убрать из меню или в комбо с Лошадкой' : 'цену не трогать, место в меню — сверху';
    if (r.fc > .35 && r.d.ingredients.length) text += `. Фудкост ${pct(r.fc)} — выше нормы`;
    return { r, gain, text };
  });
  const top = list.filter(x => x.gain > 0).sort((a, b) => b.gain - a.gain).slice(0, 6), dog = list.filter(x => x.r.q === 'dog').sort((a, b) => a.r.profit - b.r.profit)[0], star = list.filter(x => x.r.q === 'star').sort((a, b) => b.r.profit - a.r.profit)[0];
  $('#recs').innerHTML = [...top, dog, star].filter(Boolean).map(({ r, gain, text }) => `<li>${stick(r.q)}<span><b>${esc(r.d.name)}</b>: ${esc(text)}</span><span class="mono">${gain ? signed(gain) + ' ₽/мес' : ''}</span></li>`).join('') || '<li>Добавьте блюда — появятся рекомендации.</li>';
}
function renderSelects() { const opts = state.dishes.map(d => `<option value="${d.id}"${d.id === state.sel ? ' selected' : ''}>${esc(d.name)}</option>`).join('') || '<option value="">— нет блюд —</option>'; $('#tc-dish').innerHTML = opts; $('#sim-dish').innerHTML = opts; }

// ---------- Техкарта, печать, CSV ----------
function techHTML(r) {
  const d = r.d, k = cityK(), rows = d.ingredients.map(i => { const p = PRODUCTS[i.productId]; if (!p) return ''; const u = p.unit === 'шт' ? 'шт' : 'г'; return `<tr><td>${esc(p.name)}</td><td>${fmtQ(i.brutto)} ${u}</td><td>${i.waste}%</td><td>${fmtQ(netto(i))} ${u}</td><td>${fmt((i.price != null ? i.price : p.price * k) * state.raw)} ₽/${p.unit}</td><td>${rub(ingCost(i, k, state.raw))}</td></tr>`; }).join('');
  return `<header><p>Технико-технологическая карта № ${d.id} · ${esc(cityName())} · ${new Date().toLocaleDateString('ru-RU')}${state.raw !== 1 ? ` · сценарий: сырьё ${signed((state.raw - 1) * 100)}%` : ''}</p><h3>${esc(d.name)}</h3><p>Выход ${fmt(d.yield || 0)} г · цена ${rub(d.price)} · продано ${fmt(d.sold)} шт/мес</p></header>
<table><thead><tr><th>Продукт</th><th>Брутто</th><th>Отходы</th><th>Нетто</th><th>Цена</th><th>Стоимость</th></tr></thead><tbody>${rows || '<tr><td colspan="6">Состав не задан — добавьте ингредиенты в демо</td></tr>'}</tbody>
<tfoot><tr><td>Себестоимость</td><td colspan="5">${rub(r.cost)}</td></tr><tr><td>Маржа</td><td colspan="5">${rub(r.margin)}</td></tr><tr><td>Фудкост</td><td colspan="5" class="${r.fc > .35 ? 'bad' : ''}">${pct(r.fc)}${r.fc > .35 ? ' — выше нормы 25–35%' : ' — в норме'}</td></tr></tfoot></table>
<div class="sign"><span>Шеф-повар</span><span>Калькулятор</span><span>Управляющий</span></div>`;
}
function renderTech() { const r = selRow(); $('#tc').innerHTML = r ? techHTML(r) : '<p class="hint">Меню пустое — добавьте блюдо в демо, и техкарта появится здесь.</p>'; }
function printHtml(html) { const root = $('#print-root'); root.innerHTML = html; root.setAttribute('aria-hidden', 'false'); setTimeout(() => window.print(), 60); }
function printAudit() {
  if (!state.dishes.length) loadDemo();
  printHtml(`<h1>Аудит меню · ${esc(cityName())} · ${new Date().toLocaleDateString('ru-RU')}</h1>
<p>Блюд: ${A.rows.length} · фудкост ${pct(A.fc)} · выручка ${rub(A.rev)}/мес · прибыль ${rub(A.profit)}/мес · при принятии рекомендаций ${signed(forecast(A, state.elasticity))} ₽/мес</p>
<h2>Матрица меню</h2><img src="${demoM.toImage()}" alt="Матрица меню"><h2 class="pb">Таблица блюд</h2>${$('#table').outerHTML.replace(/ id="[^"]*"/g, '')}<h2>Рекомендации</h2><ol class="rec-list">${$('#recs').innerHTML}</ol>`);
}
function exportCsv() {
  const lines = ['Блюдо;Квадрант;Цена;Себестоимость;Фудкост %;Маржа;Продано;Выручка;Прибыль', ...A.rows.map(r => [r.d.name, QUAD[r.q].name, r.price, Math.round(r.cost), Math.round(r.fc * 100), Math.round(r.margin), r.sold, Math.round(r.rev), Math.round(r.profit)].map(v => String(v).replace(/;/g, ',')).join(';'))];
  const a = document.createElement('a'); a.href = URL.createObjectURL(new Blob(['﻿' + lines.join('\r\n')], { type: 'text/csv;charset=utf-8' })); a.download = 'foodcost-menu.csv'; document.body.appendChild(a); a.click(); a.remove();
}

// ---------- Форма блюда ----------
const ings = $('#ings'), form = $('#dish-form'); let yieldTouched = false;
const findProduct = s => { s = s.trim().toLowerCase(); const n = p => p.name.toLowerCase(); return s ? PRODUCTS.find(p => n(p) === s) || PRODUCTS.find(p => n(p).startsWith(s)) || PRODUCTS.find(p => n(p).includes(s)) || null : null; };
function ingRow(i = {}) {
  const p = i.productId != null ? PRODUCTS[i.productId] : null, row = document.createElement('div'); row.className = 'ing';
  row.innerHTML = `<input class="ing-name" type="text" list="products" placeholder="Продукт из базы" aria-label="Продукт" value="${p ? esc(p.name) : ''}"><input class="ing-brutto" type="number" min="0" step="1" placeholder="г" aria-label="Брутто, г или шт" value="${i.brutto ?? ''}"><input class="ing-waste" type="number" min="0" max="99" step="1" placeholder="%" aria-label="Отходы, %" value="${i.waste ?? ''}"><input class="ing-price" type="number" min="0" step="1" placeholder="₽" aria-label="Цена за кг, л или шт" value="${i.price ?? (p ? Math.round(p.price * cityK()) : '')}"><output class="ing-net mono" aria-label="Нетто">—</output><button type="button" class="x" aria-label="Удалить ингредиент">×</button>`;
  row.dataset.pid = p ? p.id : ''; ings.appendChild(row); updRow(row); return row;
}
function updRow(row) {
  const p = findProduct($('.ing-name', row).value), out = $('.ing-net', row);
  if (!p) { out.textContent = '—'; row.dataset.pid = ''; return; }
  if (String(p.id) !== row.dataset.pid) { row.dataset.pid = p.id; $('.ing-waste', row).value = p.waste; $('.ing-price', row).value = Math.round(p.price * cityK()); } // новый продукт: отходы и цена из базы
  const b = +$('.ing-brutto', row).value || 0, u = p.unit === 'шт' ? 'шт' : 'г'; $('.ing-brutto', row).placeholder = u;
  out.textContent = (p.unit === 'шт' ? b : fmtQ(b * (1 - (+$('.ing-waste', row).value || 0) / 100))) + ' ' + u;
}
function readForm() {
  const ingredients = $$('.ing', ings).map(row => { const p = findProduct($('.ing-name', row).value), b = +$('.ing-brutto', row).value; if (!p || !(b > 0)) return null; const i = { productId: p.id, brutto: b, waste: clamp(+$('.ing-waste', row).value || 0, 0, 99) }, pr = +$('.ing-price', row).value; if (pr > 0 && pr !== Math.round(p.price * cityK())) i.price = pr; return i; }).filter(Boolean);
  return { name: $('#d-name').value.trim(), price: +$('#d-price').value, sold: +$('#d-sold').value, yield: +$('#d-yield').value || 0, ingredients };
}
function calcPreview() {
  const f = readForm(), cost = dishCost(f, cityK(), state.raw), c = $('#d-calc');
  c.textContent = `Себестоимость: ${rub(cost)}` + (f.price > 0 ? ` · фудкост ${pct(cost / f.price)} · маржа ${rub(f.price - cost)}` : ' · фудкост —'); c.style.color = f.price > 0 && cost / f.price > .35 ? '#D62828' : '';
  if (!yieldTouched) { const g = f.ingredients.reduce((s, i) => s + (PRODUCTS[i.productId].unit === 'шт' ? 0 : netto(i)), 0); $('#d-yield').value = g ? Math.round(g) : ''; }
}
function resetForm(d) {
  state.editing = d ? d.id : null; yieldTouched = !!d; ings.innerHTML = '';
  (d && d.ingredients.length ? d.ingredients : [{}, {}, {}]).forEach(ingRow);
  $('#d-name').value = d ? d.name : ''; $('#d-price').value = d ? d.price : ''; $('#d-sold').value = d ? d.sold : ''; $('#d-yield').value = d ? d.yield || '' : '';
  $('#form-title').textContent = d ? `Изменить: ${d.name}` : 'Новое блюдо'; $('#d-submit').textContent = d ? 'Сохранить' : 'Добавить блюдо'; $('#d-cancel').hidden = !d; calcPreview();
}
const say = t => { $('#form-msg').textContent = t; };
form.addEventListener('input', e => { if (e.target.id === 'd-yield') yieldTouched = true; const row = e.target.closest('.ing'); if (row) updRow(row); calcPreview(); });
form.addEventListener('click', e => { const x = e.target.closest('.x'); if (x) { x.closest('.ing').remove(); if (!ings.children.length) ingRow(); calcPreview(); } });
form.addEventListener('submit', e => {
  e.preventDefault(); const f = readForm();
  if (!f.name) return say('Введите название.'); if (!(f.price > 0)) return say('Укажите цену в меню.'); if ($('#d-sold').value === '' || !(f.sold >= 0)) return say('Укажите продажи за месяц.');
  if (state.editing) { const d = state.dishes.find(x => x.id === state.editing); Object.assign(d, f); state.sel = d.id; say(`Сохранено: ${f.name}.`); }
  else { const d = { id: newId(), ...f }; state.dishes.push(d); state.sel = d.id; say(`Добавлено: ${f.name}.`); }
  resetForm(); save(); renderAll();
});
$('#add-ing').addEventListener('click', () => $('.ing-name', ingRow()).focus());
$('#d-cancel').addEventListener('click', () => { resetForm(); say(''); });
function editDish(id) { const d = state.dishes.find(x => x.id === id); if (!d) return; resetForm(d); state.sel = id; renderTable(); form.scrollIntoView(smooth); $('#d-name').focus({ preventScroll: true }); }
function delDish(id) { state.dishes = state.dishes.filter(x => x.id !== id); if (state.editing === id) resetForm(); save(); renderAll(); }

// ---------- Таблица, панель, вставка продаж ----------
$('#tbody').addEventListener('click', e => { const b = e.target.closest('button'); if (b?.dataset.edit) return editDish(+b.dataset.edit); if (b?.dataset.del) return delDish(+b.dataset.del); const tr = e.target.closest('tr'); if (tr) select(+tr.dataset.id); });
$('#table thead').addEventListener('click', e => { const b = e.target.closest('.sort'); if (!b) return; const k = b.dataset.sort; state.sort = { key: k, dir: state.sort.key === k ? -state.sort.dir : -1 }; renderTable(); });
citySel.addEventListener('change', () => { state.city = citySel.selectedIndex; save(); resetForm(state.editing ? state.dishes.find(x => x.id === state.editing) : undefined); renderAll(); });
$('#demo-load').addEventListener('click', loadDemo);
$('#hero-demo').addEventListener('click', () => { loadDemo(); $('#demo').scrollIntoView(smooth); });
$('#demo-clear').addEventListener('click', () => { state.dishes = []; state.sel = null; resetForm(); save(); renderAll(); say('Меню очищено. Добавьте первое блюдо.'); });
$('#export-csv').addEventListener('click', exportCsv);
$('#print-audit').addEventListener('click', printAudit);
$('#plan-audit').addEventListener('click', printAudit);
$('#print-tc').addEventListener('click', () => { const r = selRow(); if (r) printHtml(`<h1>Техкарта</h1>${techHTML(r)}`); });
$('#paste-toggle').addEventListener('click', e => { const box = $('#paste-box'); box.hidden = !box.hidden; e.currentTarget.setAttribute('aria-expanded', String(!box.hidden)); if (!box.hidden) $('#paste').focus(); });
$('#paste-apply').addEventListener('click', () => {
  let upd = 0, add = 0, bad = 0;
  $('#paste').value.split(/\r?\n/).map(l => l.trim()).filter(Boolean).forEach(l => {
    const c = l.split(/[;\t]|,(?=\s*\d)/).map(s => s.trim().replace(/^"|"$/g, '')), num = v => parseFloat((v || '').replace(/\s/g, '').replace(',', '.'));
    const name = c[0], price = num(c[1]), sold = num(c[2]); if (!name || !(price > 0) || !(sold >= 0)) return bad++;
    const d = state.dishes.find(x => x.name.toLowerCase() === name.toLowerCase());
    if (d) { d.price = price; d.sold = Math.round(sold); upd++; } else { state.dishes.push({ id: newId(), name, price, sold: Math.round(sold), yield: 0, ingredients: [] }); add++; }
  });
  save(); renderAll(); $('#paste-out').textContent = `обновлено ${upd}, добавлено ${add}${bad ? `, пропущено строк: ${bad}` : ''}`;
});
$('#tc-dish').addEventListener('change', e => select(+e.target.value));
$('#sim-dish').addEventListener('change', e => select(+e.target.value));

// ---------- Симулятор цены: сырьё +X%, цена ±30%, эластичность ----------
const simRaw = $('#sim-raw'), simPrice = $('#sim-price'), simEl = $('#sim-el'), simApply = $('#sim-apply');
function renderSim() {
  const r0 = selRow(), out = $('#sim-out');
  if (!r0) { out.innerHTML = '<p class="hint">Добавьте блюдо в демо.</p>'; $('#sim-over').innerHTML = ''; $('#sim-over-title').textContent = 'Фудкост выше 35%'; return; }
  const raw = 1 + simRaw.value / 100, dp = simPrice.value / 100, el = clamp(+simEl.value || -1.2, -3, 0), d = r0.d, k = cityK();
  const cost0 = dishCost(d, k, 1), cost1 = dishCost(d, k, raw), price1 = Math.round(d.price * (1 + dp)), sold1 = d.sold * Math.pow(price1 / d.price, el);
  const profit0 = d.sold * (d.price - cost0), profit1 = sold1 * (price1 - cost1), delta = profit1 - profit0, fc1 = cost1 / price1;
  $('#sim-raw-out').textContent = `${simRaw.value}%`; $('#sim-price-out').textContent = `${rub(price1)} (${signed(dp * 100)}%)`;
  const line = (l, v, cls = '') => `<div class="r-line"><span>${l}</span><b class="${cls}">${v}</b></div>`;
  out.innerHTML = `<p class="r-head">${esc(d.name)} · ${QUAD[r0.q].name.toUpperCase()}</p>` + line('Себестоимость порции', `${rub(cost0)} → ${rub(cost1)}`) + line('Фудкост', `${pct(cost0 / d.price)} → ${pct(fc1)}`, fc1 > .35 ? 'down' : 'up') + line('Цена в меню', `${rub(d.price)} → ${rub(price1)}`) + line('Продажи, шт/мес', `${fmt(d.sold)} → ${fmt(sold1)}`) + line('Прибыль, ₽/мес', `${fmt(profit0)} → ${fmt(profit1)}`) + `<div class="r-total"><span>Итого к прибыли</span><b class="${delta >= 0 ? 'up' : 'down'}">${signed(delta)} ₽/мес</b></div>`;
  const over = analyze(state.dishes, k, raw).rows.filter(r => r.d.ingredients.length && r.fc > .35).sort((a, b) => b.fc - a.fc);
  $('#sim-over-title').textContent = `Фудкост выше 35% при сырье +${simRaw.value}%: ${over.length} из ${state.dishes.length}`;
  $('#sim-over').innerHTML = over.map(r => `<li>${esc(r.d.name)} ${pct(r.fc)}</li>`).join('') || '<li class="ok">Все блюда в норме</li>';
}
simRaw.addEventListener('input', () => { if (simApply.getAttribute('aria-pressed') === 'true') { state.raw = 1 + simRaw.value / 100; renderAll(); } else renderSim(); });
simPrice.addEventListener('input', renderSim);
simEl.addEventListener('input', () => { state.elasticity = clamp(+simEl.value || -1.2, -3, 0); save(); renderKpis(); renderRecs(); renderSim(); });
simApply.addEventListener('click', () => { const on = simApply.getAttribute('aria-pressed') !== 'true'; simApply.setAttribute('aria-pressed', String(on)); simApply.textContent = on ? 'Убрать сценарий из таблицы' : 'Показать сценарий в таблице'; state.raw = on ? 1 + simRaw.value / 100 : 1; renderAll(); if (on) $('#demo-matrix').scrollIntoView({ ...smooth, block: 'center' }); });

// ---------- Для кого, навигация, появление по прокрутке ----------
$('#keys').addEventListener('click', e => { const b = e.target.closest('.key'); if (!b) return; $$('.key').forEach(k => k.setAttribute('aria-pressed', String(k === b))); $$('#key-out p').forEach(p => { p.hidden = p.dataset.k !== b.dataset.k; }); });
const nav = $('.nav'), burger = $('#burger');
burger.addEventListener('click', () => { const open = nav.classList.toggle('open'); burger.setAttribute('aria-expanded', String(open)); burger.setAttribute('aria-label', open ? 'Закрыть меню' : 'Открыть меню'); });
$$('#menu a').forEach(a => a.addEventListener('click', () => { nav.classList.remove('open'); burger.setAttribute('aria-expanded', 'false'); }));
const countIn = el => $$('[data-count]', el).forEach(b => { if (b._to === undefined) countTo(b, +b.dataset.count, fmt); });
const revealEl = el => { if (!el.classList.contains('in')) el.classList.add('in'); countIn(el); };
const revealAll = () => { const h = innerHeight; $$('.reveal:not(.in)').forEach(el => { if (el.getBoundingClientRect().top < h * .92) revealEl(el); }); $$('.reveal.in').forEach(countIn); };
addEventListener('scroll', revealAll, { passive: true }); addEventListener('resize', revealAll);
if ('IntersectionObserver' in window) { const io = new IntersectionObserver(es => es.forEach(x => { if (x.isIntersecting) { revealEl(x.target); io.unobserve(x.target); } }), { rootMargin: '0px 0px -8% 0px' }); $$('.reveal').forEach(el => io.observe(el)); }

// ---------- Старт ----------
$('#products').innerHTML = PRODUCTS.map(p => `<option value="${esc(p.name)}">${p.price} ₽/${p.unit}</option>`).join('');
if (!load()) state.dishes = demoCopy();
citySel.selectedIndex = state.city; simEl.value = state.elasticity; state.sel = (state.dishes.find(d => d.name === 'Карбонара') || state.dishes[0])?.id ?? null;
resetForm(); renderAll();
heroUpdate(false); autoplay(); revealAll(); setTimeout(revealAll, 300);
})();
