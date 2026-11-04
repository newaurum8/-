/* Тарелка — сканер тарелки, калькулятор нормы, дневник. Всё на клиенте. */
(() => {
  const $ = (s, r = document) => r.querySelector(s);
  const fmt = n => Math.round(n).toLocaleString('ru-RU');

  // ---------- reveal + count-up ----------
  const revealAll = () => { const h = innerHeight; document.querySelectorAll('.reveal:not(.in)').forEach(el => { if (el.getBoundingClientRect().top < h * .92) el.classList.add('in'); }); };
  addEventListener('scroll', revealAll, { passive: true }); addEventListener('resize', revealAll); revealAll(); setTimeout(revealAll, 400);
  function countUp(el, to, dur = 1200) { const t0 = performance.now(); (function f(now) { const p = Math.min(1, (now - t0) / dur), e = 1 - Math.pow(1 - p, 3); el.textContent = fmt(to * e); if (p < 1) requestAnimationFrame(f); })(t0); }
  const cio = new IntersectionObserver(es => es.forEach(e => { if (e.isIntersecting) { countUp(e.target, +e.target.dataset.count); cio.unobserve(e.target); } }));
  document.querySelectorAll('[data-count]').forEach(el => cio.observe(el));

  // ---------- еда: отрисовка и нутриенты (на 100 г) ----------
  const FOODS = {
    salmon: { name: 'Лосось на гриле', color: '#ff8f6b', kcal: 208, p: 20, f: 13, c: 0, portion: 180,
      draw: (x, y, s, c) => { c.save(); c.translate(x, y); c.rotate(-.4); c.fillStyle = '#ff8f6b'; rr(c, -s * .5, -s * .3, s, s * .6, s * .18); c.fill(); c.strokeStyle = 'rgba(255,255,255,.55)'; c.lineWidth = s * .05; for (let i = -2; i <= 2; i++) { c.beginPath(); c.moveTo(i * s * .18 - s * .1, -s * .28); c.quadraticCurveTo(i * s * .18 + s * .05, 0, i * s * .18 - s * .1, s * .28); c.stroke(); } c.fillStyle = 'rgba(80,30,10,.25)'; rr(c, -s * .5, -s * .3, s, s * .6, s * .18); c.lineWidth = s * .03; c.strokeStyle = 'rgba(80,30,10,.3)'; c.stroke(); c.restore(); } },
    chicken: { name: 'Куриная грудка', color: '#e7b784', kcal: 165, p: 31, f: 3.6, c: 0, portion: 150,
      draw: (x, y, s, c) => { c.save(); c.translate(x, y); c.fillStyle = '#e7b784'; c.beginPath(); c.ellipse(0, 0, s * .5, s * .32, .3, 0, Math.PI * 2); c.fill(); c.strokeStyle = 'rgba(120,60,20,.35)'; c.lineWidth = s * .04; for (let i = -1; i <= 1; i++) { c.beginPath(); c.moveTo(-s * .4, i * s * .14); c.lineTo(s * .4, i * s * .14 + s * .1); c.stroke(); } c.restore(); } },
    egg: { name: 'Яйцо', color: '#fff2c4', kcal: 155, p: 13, f: 11, c: 1.1, portion: 60,
      draw: (x, y, s, c) => { c.save(); c.translate(x, y); c.fillStyle = '#fffaf0'; c.beginPath(); c.ellipse(0, 0, s * .42, s * .36, .2, 0, Math.PI * 2); c.fill(); c.fillStyle = '#ffb83d'; c.beginPath(); c.arc(s * .03, 0, s * .17, 0, Math.PI * 2); c.fill(); c.fillStyle = 'rgba(255,255,255,.6)'; c.beginPath(); c.arc(-s * .04, -s * .06, s * .05, 0, Math.PI * 2); c.fill(); c.restore(); } },
    quinoa: { name: 'Киноа', color: '#f3e3b0', kcal: 120, p: 4.4, f: 1.9, c: 21, portion: 150,
      draw: (x, y, s, c, r) => { c.save(); c.translate(x, y); c.fillStyle = '#f3e3b0'; c.beginPath(); c.ellipse(0, 0, s * .45, s * .36, 0, 0, Math.PI * 2); c.fill(); for (let i = 0; i < 70; i++) { const a = r() * Math.PI * 2, d = Math.sqrt(r()) * s * .4; c.fillStyle = i % 3 ? '#e9cf87' : '#c9a35a'; c.beginPath(); c.arc(Math.cos(a) * d, Math.sin(a) * d * .8, s * .03, 0, Math.PI * 2); c.fill(); } c.restore(); } },
    rice: { name: 'Рис отварной', color: '#fffdf5', kcal: 130, p: 2.7, f: .3, c: 28, portion: 150,
      draw: (x, y, s, c, r) => { c.save(); c.translate(x, y); c.fillStyle = '#f7f1e3'; c.beginPath(); c.ellipse(0, 0, s * .45, s * .36, 0, 0, Math.PI * 2); c.fill(); c.fillStyle = '#fff'; for (let i = 0; i < 60; i++) { const a = r() * Math.PI * 2, d = Math.sqrt(r()) * s * .4; c.save(); c.translate(Math.cos(a) * d, Math.sin(a) * d * .8); c.rotate(r() * 3); c.beginPath(); c.ellipse(0, 0, s * .05, s * .02, 0, 0, Math.PI * 2); c.fill(); c.restore(); } c.restore(); } },
    broccoli: { name: 'Брокколи', color: '#5fa052', kcal: 34, p: 2.8, f: .4, c: 7, portion: 120,
      draw: (x, y, s, c, r) => { c.save(); c.translate(x, y); for (let k = 0; k < 3; k++) { const ox = (k - 1) * s * .3, oy = (k % 2) * s * .12; c.strokeStyle = '#b7d98b'; c.lineWidth = s * .09; c.lineCap = 'round'; c.beginPath(); c.moveTo(ox, oy + s * .3); c.lineTo(ox, oy); c.stroke(); for (let i = 0; i < 9; i++) { const a = r() * Math.PI * 2, d = r() * s * .14; c.fillStyle = i % 2 ? '#5fa052' : '#3f7f3a'; c.beginPath(); c.arc(ox + Math.cos(a) * d, oy - s * .05 + Math.sin(a) * d, s * .1, 0, Math.PI * 2); c.fill(); } } c.restore(); } },
    avocado: { name: 'Авокадо', color: '#a4c96a', kcal: 160, p: 2, f: 15, c: 9, portion: 70,
      draw: (x, y, s, c) => { c.save(); c.translate(x, y); c.rotate(.5); c.fillStyle = '#3f6b2e'; c.beginPath(); c.ellipse(0, 0, s * .34, s * .46, 0, 0, Math.PI * 2); c.fill(); c.fillStyle = '#c9e39a'; c.beginPath(); c.ellipse(0, 0, s * .28, s * .4, 0, 0, Math.PI * 2); c.fill(); c.fillStyle = '#8b5a2b'; c.beginPath(); c.arc(0, s * .06, s * .14, 0, Math.PI * 2); c.fill(); c.restore(); } },
    tomato: { name: 'Черри', color: '#ff5a4a', kcal: 18, p: .9, f: .2, c: 3.9, portion: 80,
      draw: (x, y, s, c) => { c.save(); c.translate(x, y); [[-.25, .05], [.2, -.12], [.05, .25]].forEach(([dx, dy]) => { c.fillStyle = '#ff5a4a'; c.beginPath(); c.arc(dx * s, dy * s, s * .16, 0, Math.PI * 2); c.fill(); c.fillStyle = 'rgba(255,255,255,.5)'; c.beginPath(); c.arc(dx * s - s * .05, dy * s - s * .06, s * .04, 0, Math.PI * 2); c.fill(); c.fillStyle = '#4e8a3e'; c.beginPath(); c.arc(dx * s, dy * s - s * .15, s * .035, 0, Math.PI * 2); c.fill(); }); c.restore(); } },
    pasta: { name: 'Паста', color: '#ffd166', kcal: 158, p: 5.8, f: .9, c: 31, portion: 200,
      draw: (x, y, s, c, r) => { c.save(); c.translate(x, y); c.strokeStyle = '#ffd166'; c.lineWidth = s * .07; c.lineCap = 'round'; for (let i = 0; i < 9; i++) { c.beginPath(); const a = r() * 6; c.moveTo(Math.cos(a) * s * .3, Math.sin(a) * s * .25); c.bezierCurveTo((r() - .5) * s, (r() - .5) * s, (r() - .5) * s, (r() - .5) * s, Math.cos(a + 2) * s * .3, Math.sin(a + 2) * s * .25); c.stroke(); } c.strokeStyle = '#e9b949'; c.lineWidth = s * .02; c.beginPath(); c.arc(0, 0, s * .3, 0, 1); c.stroke(); c.restore(); } },
    potato: { name: 'Картофель запечённый', color: '#e8c07a', kcal: 93, p: 2.5, f: .1, c: 21, portion: 150,
      draw: (x, y, s, c) => { c.save(); c.translate(x, y); [[-.2, -.1, .4], [.18, .05, .35], [-.05, .22, .3]].forEach(([dx, dy, rad]) => { c.fillStyle = '#e8c07a'; c.beginPath(); c.ellipse(dx * s, dy * s, s * rad * .5, s * rad * .4, dx, 0, Math.PI * 2); c.fill(); c.fillStyle = 'rgba(150,90,20,.3)'; c.beginPath(); c.ellipse(dx * s + s * .05, dy * s - s * .03, s * rad * .2, s * rad * .12, 0, 0, Math.PI * 2); c.fill(); }); c.restore(); } },
    greens: { name: 'Салат микс', color: '#7cc35f', kcal: 17, p: 1.4, f: .2, c: 2.9, portion: 60,
      draw: (x, y, s, c, r) => { c.save(); c.translate(x, y); for (let i = 0; i < 10; i++) { c.save(); c.rotate(r() * 6); c.translate(r() * s * .25, 0); c.fillStyle = i % 2 ? '#7cc35f' : '#4e9a3c'; c.beginPath(); c.ellipse(0, 0, s * .22, s * .1, 0, 0, Math.PI * 2); c.fill(); c.restore(); } c.restore(); } },
    bread: { name: 'Хлеб цельнозерновой', color: '#c89562', kcal: 247, p: 13, f: 3.4, c: 41, portion: 40,
      draw: (x, y, s, c) => { c.save(); c.translate(x, y); c.rotate(-.3); c.fillStyle = '#c89562'; rr(c, -s * .36, -s * .3, s * .72, s * .6, s * .14); c.fill(); c.fillStyle = '#f0d9b0'; rr(c, -s * .3, -s * .24, s * .6, s * .48, s * .1); c.fill(); c.restore(); } },
  };
  function rr(c, x, y, w, h, r) { c.beginPath(); c.roundRect(x, y, w, h, r); }
  function rng(seed) { let s = seed * 9301 + 49297; return () => { s = (s * 16807) % 2147483647; return (s % 10000) / 10000; }; }

  function drawPlate(c, W, items, seed = 1) {
    const r = rng(seed), cx = W / 2, cy = W / 2;
    c.clearRect(0, 0, W, W);
    // стол
    c.fillStyle = '#f4ead8'; c.fillRect(0, 0, W, W);
    c.save(); c.globalAlpha = .35; c.strokeStyle = '#dcc9a6'; c.lineWidth = 2; for (let i = 0; i < W; i += 28) { c.beginPath(); c.moveTo(i, 0); c.lineTo(i, W); c.stroke(); } c.restore();
    // приборы
    c.save(); c.strokeStyle = '#bfc4c9'; c.lineCap = 'round'; c.lineWidth = W * .018;
    c.beginPath(); c.moveTo(W * .09, W * .3); c.lineTo(W * .09, W * .75); c.stroke(); for (let i = -1; i <= 1; i++) { c.beginPath(); c.moveTo(W * .09 + i * W * .02, W * .3); c.lineTo(W * .09 + i * W * .02, W * .2); c.stroke(); }
    c.beginPath(); c.moveTo(W * .91, W * .35); c.lineTo(W * .91, W * .78); c.stroke(); c.fillStyle = '#bfc4c9'; rr(c, W * .895, W * .2, W * .03, W * .16, W * .01); c.fill(); c.restore();
    // тарелка
    c.save(); c.shadowColor = 'rgba(0,0,0,.18)'; c.shadowBlur = W * .06; c.shadowOffsetY = W * .02; c.fillStyle = '#fff'; c.beginPath(); c.arc(cx, cy, W * .36, 0, Math.PI * 2); c.fill(); c.restore();
    c.strokeStyle = '#ebe6dc'; c.lineWidth = W * .006; c.beginPath(); c.arc(cx, cy, W * .3, 0, Math.PI * 2); c.stroke();
    // еда по кругу/центру
    const n = items.length, pos = [];
    if (n === 1) pos.push([cx, cy]);
    else items.forEach((_, i) => { const a = -Math.PI / 2 + i * Math.PI * 2 / n; const d = n === 2 ? W * .14 : W * .17; pos.push([cx + Math.cos(a) * d, cy + Math.sin(a) * d]); });
    const size = n <= 2 ? W * .3 : n <= 4 ? W * .25 : W * .2;
    items.forEach((id, i) => { c.save(); c.shadowColor = 'rgba(0,0,0,.15)'; c.shadowBlur = W * .02; c.shadowOffsetY = W * .008; FOODS[id].draw(pos[i][0], pos[i][1], size, c, r); c.restore(); });
    return { pos, size };
  }

  // hero-тарелка
  const hp = $('#hero-plate'); drawPlate(hp.getContext('2d'), 600, ['salmon', 'quinoa', 'broccoli'], 7);

  // ---------- сканер ----------
  const plate = $('#plate'), pc = plate.getContext('2d');
  let selected = ['salmon', 'rice', 'broccoli', 'tomato'];
  let layout = null;
  const chipsEl = $('#food-chips');
  Object.entries(FOODS).forEach(([id, f]) => {
    const b = document.createElement('button'); b.type = 'button'; b.className = 'chip'; b.innerHTML = `<i style="background:${f.color}"></i>${f.name}`;
    b.setAttribute('aria-pressed', String(selected.includes(id)));
    b.onclick = () => { if (selected.includes(id)) selected = selected.filter(x => x !== id); else if (selected.length < 6) selected.push(id); else return; b.setAttribute('aria-pressed', String(selected.includes(id))); redraw(); };
    chipsEl.appendChild(b);
  });
  function redraw() { layout = drawPlate(pc, 720, selected, 3); $('#boxes').innerHTML = ''; $('#scan-result').hidden = true; }
  redraw();

  let lastScan = null;
  $('#scan-btn').onclick = async () => {
    if (!selected.length) return;
    const btn = $('#scan-btn'); btn.disabled = true; btn.textContent = 'Анализ…';
    const boxes = $('#boxes'); boxes.innerHTML = ''; $('#scan-result').hidden = true;
    const line = $('#scan-line'); line.classList.remove('run'); void line.offsetWidth; line.classList.add('run');
    await new Promise(r => setTimeout(r, 1500));
    const list = $('#scan-list'); list.innerHTML = ''; let total = 0, P = 0, F = 0, C = 0; lastScan = [];
    for (let i = 0; i < selected.length; i++) {
      const id = selected[i], f = FOODS[id], [x, y] = layout.pos[i], s = layout.size;
      const g = f.portion * (0.9 + (i % 3) * .08), kcal = f.kcal * g / 100;
      total += kcal; P += f.p * g / 100; F += f.f * g / 100; C += f.c * g / 100;
      lastScan.push({ id, g: Math.round(g) });
      const d = document.createElement('div'); d.className = 'box';
      d.style.cssText = `left:${(x - s * .5) / 7.2}%;top:${(y - s * .42) / 7.2}%;width:${s / 7.2}%;height:${s * .84 / 7.2}%;animation-delay:${i * .18}s`;
      d.innerHTML = `<span>${f.name} · ${Math.round(g)} г · ${Math.round(kcal)} ккал</span>`; boxes.appendChild(d);
      const li = document.createElement('li'); li.innerHTML = `<span>${f.name} · ${Math.round(g)} г</span><b>${Math.round(kcal)} ккал</b>`; list.appendChild(li);
      await new Promise(r => setTimeout(r, 220));
    }
    $('#scan-result').hidden = false; countUp($('#scan-kcal'), total, 800);
    $('#scan-macros').innerHTML = `<span class="m-p">Б ${Math.round(P)} г</span><span class="m-f">Ж ${Math.round(F)} г</span><span class="m-c">У ${Math.round(C)} г</span>`;
    btn.disabled = false; btn.textContent = 'Сканировать ещё раз';
  };
  $('#scan-add').onclick = () => { lastScan?.forEach(({ id, g }) => addEntry(FOODS[id].name, FOODS[id], g)); $('#diary').scrollIntoView({ behavior: 'smooth' }); };

  // ---------- калькулятор ----------
  const calc = { sex: 'm', age: 29, height: 178, weight: 76, activity: 1.375, goal: 0 };
  function seg(id, key, parse = v => v) { $(`#${id}`).querySelectorAll('button').forEach(b => b.onclick = () => { $(`#${id}`).querySelectorAll('button').forEach(x => x.setAttribute('aria-pressed', 'false')); b.setAttribute('aria-pressed', 'true'); calc[key] = parse(b.dataset.v); compute(); }); }
  seg('sex', 'sex'); seg('activity', 'activity', Number); seg('goal', 'goal', Number);
  ['age', 'height', 'weight'].forEach(k => $('#' + k).addEventListener('input', e => { calc[k] = +e.target.value; $(`#${k}-v`).textContent = e.target.value; compute(); }));
  let goalKcal = +localStorage.getItem('tarelka-goal') || 2000;
  function compute() {
    const bmr = calc.sex === 'm' ? 10 * calc.weight + 6.25 * calc.height - 5 * calc.age + 5 : 10 * calc.weight + 6.25 * calc.height - 5 * calc.age - 161;
    const kcal = bmr * calc.activity * (1 + calc.goal);
    const p = calc.weight * (calc.goal < 0 ? 2 : 1.6), f = kcal * .27 / 9, c = (kcal - p * 4 - f * 9) / 4;
    countUp($('#kcal-out'), kcal, 700); countUp($('#bmr-out'), bmr, 700); countUp($('#p-out'), p, 700); countUp($('#f-out'), f, 700); countUp($('#c-out'), c, 700);
    const set = (k, v) => $(`.ring[data-ring=${k}] .bar`).style.strokeDashoffset = 264 - 264 * v;
    set('p', p * 4 / kcal); set('f', f * 9 / kcal); set('c', c * 4 / kcal);
    goalKcal = Math.round(kcal); localStorage.setItem('tarelka-goal', goalKcal); renderDay();
  }

  // ---------- дневник ----------
  const DB = [
    ['Гречка отварная', 110, 4.2, 1.1, 21], ['Овсянка на воде', 88, 3, 1.7, 15], ['Творог 5%', 121, 17, 5, 1.8], ['Банан', 89, 1.1, .3, 23], ['Яблоко', 52, .3, .2, 14],
    ['Куриная грудка', 165, 31, 3.6, 0], ['Говядина тушёная', 232, 25, 14, 0], ['Лосось', 208, 20, 13, 0], ['Тунец консервированный', 116, 26, 1, 0], ['Яйцо куриное', 155, 13, 11, 1.1],
    ['Рис отварной', 130, 2.7, .3, 28], ['Макароны отварные', 158, 5.8, .9, 31], ['Картофель отварной', 87, 1.9, .1, 20], ['Хлеб цельнозерновой', 247, 13, 3.4, 41], ['Хлеб белый', 265, 9, 3.2, 49],
    ['Молоко 2,5%', 52, 2.9, 2.5, 4.8], ['Йогурт греческий', 97, 9, 5, 3.6], ['Сыр твёрдый', 402, 25, 33, 1.3], ['Масло сливочное', 717, .9, 81, .1], ['Масло оливковое', 884, 0, 100, 0],
    ['Авокадо', 160, 2, 15, 9], ['Огурец', 15, .7, .1, 3.6], ['Помидор', 18, .9, .2, 3.9], ['Брокколи', 34, 2.8, .4, 7], ['Морковь', 41, .9, .2, 10],
    ['Орехи грецкие', 654, 15, 65, 14], ['Миндаль', 579, 21, 50, 22], ['Шоколад тёмный', 546, 5, 31, 61], ['Печенье овсяное', 437, 6.5, 14, 71], ['Мёд', 304, .3, 0, 82],
    ['Кофе с молоком', 30, 1.5, 1.2, 3], ['Капучино', 45, 2, 2, 4], ['Сок апельсиновый', 45, .7, .2, 10], ['Кола', 42, 0, 0, 10.6], ['Пиво светлое', 43, .5, 0, 3.6],
    ['Пицца Маргарита', 266, 11, 10, 33], ['Бургер', 295, 17, 14, 24], ['Суши лосось', 150, 7, 4, 22], ['Шаурма', 210, 10, 10, 20], ['Борщ', 49, 2.5, 2.2, 5],
    ['Плов', 190, 6, 7, 26], ['Сырники', 220, 15, 9, 20], ['Блины', 227, 6, 9, 30], ['Пельмени', 275, 12, 13, 28], ['Салат Цезарь', 180, 8, 13, 8],
    ['Протеиновый батончик', 380, 30, 12, 35], ['Хумус', 166, 8, 10, 14], ['Чечевица', 116, 9, .4, 20], ['Киноа', 120, 4.4, 1.9, 21], ['Тофу', 76, 8, 4.8, 1.9],
  ].map(([name, kcal, p, f, c]) => ({ name, kcal, p, f, c }));
  const todayKey = 'tarelka-' + new Date().toISOString().slice(0, 10);
  let entries = JSON.parse(localStorage.getItem(todayKey) || '[]');
  function save() { localStorage.setItem(todayKey, JSON.stringify(entries)); }
  function addEntry(name, n, g) { entries.push({ name, g, kcal: n.kcal * g / 100, p: n.p * g / 100, f: n.f * g / 100, c: n.c * g / 100 }); save(); renderDay(); }
  function renderDay() {
    const ul = $('#entries'); ul.innerHTML = '';
    entries.forEach((e, i) => { const li = document.createElement('li'); li.innerHTML = `<div>${e.name}<small>${e.g} г · Б ${Math.round(e.p)} Ж ${Math.round(e.f)} У ${Math.round(e.c)}</small></div><b>${Math.round(e.kcal)} ккал</b><button aria-label="Удалить" data-i="${i}">×</button>`; ul.appendChild(li); });
    ul.querySelectorAll('button').forEach(b => b.onclick = () => { entries.splice(+b.dataset.i, 1); save(); renderDay(); });
    const sum = k => entries.reduce((a, e) => a + e[k], 0), kcal = sum('kcal');
    $('#empty').hidden = entries.length > 0; $('#clear').hidden = entries.length === 0;
    $('#day-goal').textContent = fmt(goalKcal); countUp($('#day-kcal'), kcal, 600);
    const bar = $('#day-bar'); bar.style.strokeDashoffset = 540 - 540 * Math.min(1, kcal / goalKcal); bar.classList.toggle('over', kcal > goalKcal);
    const pG = goalKcal * .3 / 4, fG = goalKcal * .27 / 9, cG = goalKcal * .43 / 4;
    [['p', pG], ['f', fG], ['c', cG]].forEach(([k, g]) => { $(`#mb-${k}`).style.width = Math.min(100, sum(k) / g * 100) + '%'; $(`#mv-${k}`).textContent = Math.round(sum(k)) + ' г'; });
  }
  $('#clear').onclick = () => { entries = []; save(); renderDay(); };
  const q = $('#q'), sug = $('#suggest');
  q.addEventListener('input', () => {
    const v = q.value.trim().toLowerCase(); sug.innerHTML = '';
    if (v.length < 2) { sug.hidden = true; return; }
    const hits = DB.filter(d => d.name.toLowerCase().includes(v)).slice(0, 8);
    hits.forEach(d => { const b = document.createElement('button'); b.type = 'button'; b.innerHTML = `${d.name}<span>${d.kcal} ккал / 100 г</span>`; b.onclick = () => { addEntry(d.name, d, +$('#grams').value || 100); q.value = ''; sug.hidden = true; }; sug.appendChild(b); });
    sug.hidden = !hits.length;
  });
  document.addEventListener('click', e => { if (!e.target.closest('.search')) sug.hidden = true; });

  compute(); renderDay();
})();
