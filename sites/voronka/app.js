/* Воронка: частицы на canvas, 200 прогонов Монте-Карло, рычаги, сценарии, печать, PNG */
(() => {
  'use strict';
  const $ = (s, r = document) => r.querySelector(s), $$ = (s, r = document) => [...r.querySelectorAll(s)];
  const RM = matchMedia('(prefers-reduced-motion: reduce)').matches;
  const mob = () => innerWidth < 861;
  const clamp = (v, a, b) => Math.max(a, Math.min(b, v)), lerp = (a, b, t) => a + (b - a) * t;
  const fmt = n => String(Math.round(n)).replace(/\B(?=(\d{3})+(?!\d))/g, ' '); // NBSP: числа не рвутся
  const rub = n => fmt(n) + ' ₽', pct = p => Math.round(p * 100) + '%';
  const sign = n => (n >= 0 ? '+' : '−') + rub(Math.abs(n));
  const plural = (n, f) => { const m = n % 100, k = n % 10; return f[(m > 10 && m < 20) ? 2 : k === 1 ? 0 : (k > 1 && k < 5) ? 1 : 2]; };
  const esc = s => String(s).replace(/[&<>"]/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]));
  const PINK = '#FF2D7A', YEL = '#F3FF4A', GRAY = '#3B3B3B', MUTED = '#9A9A9A', BG = '#0A0A0A', RED = '#FF3B3B', FONT = '14px Manrope, sans-serif';

  // ---- появление, count-up, меню, тост ----
  function countUp(el, to) { if (RM) { el.textContent = fmt(to); return; } const t0 = performance.now(); const f = now => { const t = Math.min(1, (now - t0) / 1200), e = 1 - Math.pow(1 - t, 3); el.textContent = fmt(to * e); if (t < 1) requestAnimationFrame(f); }; requestAnimationFrame(f); }
  const show = el => { el.classList.add('in'); if (el.dataset.count && !el.classList.contains('done')) { el.classList.add('done'); countUp(el, +el.dataset.count); } };
  const io = new IntersectionObserver(es => es.forEach(e => { if (e.isIntersecting) { io.unobserve(e.target); show(e.target); } }));
  $$('.reveal, [data-count]').forEach(el => io.observe(el));
  const nav = $('#nav'), burger = $('#burger');
  burger.addEventListener('click', () => { const open = nav.classList.toggle('open'); burger.setAttribute('aria-expanded', open); burger.setAttribute('aria-label', open ? 'Закрыть меню' : 'Открыть меню'); });
  $$('#menu a').forEach(a => a.addEventListener('click', () => { nav.classList.remove('open'); burger.setAttribute('aria-expanded', 'false'); }));
  let toastT; const toast = msg => { const t = $('#toast'); t.textContent = msg; t.classList.add('show'); clearTimeout(toastT); toastT = setTimeout(() => t.classList.remove('show'), 2600); };
  const fillRange = r => r.style.setProperty('--p', ((r.value - r.min) / (r.max - r.min) * 100) + '%');
  const openDoc = () => { const d = document.getElementById(location.hash.slice(1)); if (d?.tagName === 'DETAILS') d.open = true; }; addEventListener('hashchange', openDoc); openDoc();

  // ---- спрайты частиц ----
  function sprite(color, r, halo) { const s = Math.ceil((r + halo) * 2) + 2, c = document.createElement('canvas'); c.width = c.height = s * 2; c.s = s;
    const x = c.getContext('2d'); x.scale(2, 2); const g = x.createRadialGradient(s / 2, s / 2, 0, s / 2, s / 2, r + halo);
    g.addColorStop(0, color); g.addColorStop(r / (r + halo), color); g.addColorStop(1, color + '00'); x.fillStyle = g; x.fillRect(0, 0, s, s); return c; }

  // ---- воронка из частиц ----
  class Funnel {
    constructor(canvas, o) {
      this.c = canvas; this.ctx = canvas.getContext('2d'); this.o = o; const n = this.n = o.pool;
      this.u = new Float32Array(n); this.x = new Float32Array(n); this.y = new Float32Array(n); this.vx = new Float32Array(n); this.vy = new Float32Array(n);
      this.st = new Uint8Array(n); this.mode = new Uint8Array(n); this.age = new Float32Array(n); this.free = new Int32Array(n);
      this.sp = sprite(PINK, 1.6, 2.4); this.sg = sprite(GRAY, 1.6, .8); this.sc = sprite(YEL, 2.5, 4);
      this.deals = 0; this.t = 0; this.cycleT = 0; this.cycleDeals = 0; this.recent = []; this.reset(); this.fit();
    }
    reset() { this.mode.fill(0); for (let i = 0; i < this.n; i++) this.free[i] = this.n - 1 - i; this.nf = this.n; this.coins = []; this.sparks = []; this.acc = 0; this.lost = this.o.names.map(() => 0); }
    fit() { const r = this.c.getBoundingClientRect(), d = this.d = Math.min(devicePixelRatio || 1, 2); this.W = Math.max(1, Math.round(r.width)); this.H = Math.max(1, Math.round(r.height)); this.c.width = this.W * d; this.c.height = this.H * d; this.ctx.setTransform(d, 0, 0, d, 0, 0); this.ctx.letterSpacing = '1.2px'; this.layout(); }
    layout() {
      const o = this.o, W = this.W, H = this.H, N = o.names.length; let x0, x1, y0, y1, pileH;
      if (o.stage) { const cr = this.c.getBoundingClientRect(), s = o.stage.getBoundingClientRect(); x0 = s.left - cr.left + 4; x1 = s.right - cr.left - 4; y0 = s.top - cr.top + 10; pileH = clamp(s.height * .11, 36, 64); y1 = s.bottom - cr.top - pileH - 30; } // hero: место задаёт .hero-stage
      else { x0 = W * .05; x1 = W * .95; y0 = 28; y1 = H - 68; pileH = 44; }
      const aw = x1 - x0, gap = 7, sh = (y1 - y0 - gap * (N - 1)) / N, wAt = y => lerp(.70, .18, (y - y0) / (y1 - y0)) * aw / 2;
      this.cx = (x0 + x1) / 2; this.x0 = x0; this.y0 = y0; this.y1 = y1; this.gap = gap; this.sh = sh;
      this.steps = []; for (let i = 0; i < N; i++) { const yT = y0 + i * (sh + gap), yB = yT + sh; this.steps.push({ yT, yB, hT: wAt(yT), hB: wAt(yB) }); }
      this.pileTop = y1 + 10; this.pileH = pileH; this.pileHW = wAt(y1) * 1.6; this.sig = [W, H, x0, x1, y0, y1].join();
      this.outside = this.cx - this.steps[0].hB - 95 >= Math.max(2, x0 - 24); this.renderStatic(); // нет места слева → потери справа
    }
    hw(i, y) { const s = this.steps[i]; return lerp(s.hT, s.hB, clamp((y - s.yT) / (s.yB - s.yT), 0, 1)); }
    trap(x, s) { x.beginPath(); x.moveTo(this.cx - s.hT, s.yT); x.lineTo(this.cx + s.hT, s.yT); x.lineTo(this.cx + s.hB, s.yB); x.lineTo(this.cx - s.hB, s.yB); x.closePath(); }
    renderStatic() { // статичный слой + разметка подписей
      const L = document.createElement('canvas'); L.width = this.c.width; L.height = this.c.height; const x = L.getContext('2d'); x.setTransform(this.d, 0, 0, this.d, 0, 0); x.lineJoin = 'round';
      this.steps.forEach(s => { this.trap(x, s); x.fillStyle = 'rgba(255,45,122,.05)'; x.fill(); x.shadowColor = PINK; x.shadowBlur = 18; x.strokeStyle = PINK; x.lineWidth = 2; x.stroke(); x.shadowBlur = 0; });
      x.strokeStyle = GRAY; x.lineWidth = 2; const dir = this.outside ? -1 : 1;
      for (let i = 0; i < this.steps.length - 1; i++) { const s = this.steps[i], gy = s.yB + this.gap / 2, bx = this.cx + dir * (s.hB + 2); x.beginPath(); x.moveTo(bx, gy); x.lineTo(bx + dir * (this.outside ? 28 : 12), gy); x.stroke(); }
      const py = this.pileTop + this.pileH + 3; x.beginPath(); x.moveTo(this.cx - this.pileHW, py); x.lineTo(this.cx + this.pileHW, py); x.stroke();
      this.static = L;
      // подписи: слева (hero) / внутри / 2 строки / «…»
      x.font = '700 ' + FONT; x.letterSpacing = '1.2px'; const m = t => x.measureText(t).width, perW = m('ПЕРЕГРУЗ') + 24; this.labels = []; this.per = [];
      this.steps.forEach((s, i) => { const my = (s.yT + s.yB) / 2, hw = this.hw(i, my), name = this.o.names[i].toUpperCase(), cnt = this.o.counts ? fmt(this.o.counts[i]) : '', full = cnt ? name + ' · ' + cnt : name, inner = hw * 2 - 24, tw = m(full);
        const outL = this.cx - hw - 36, inL = this.cx - hw + 12, add = (t, X, Y, al) => this.labels.push({ t, x: X, y: Y, al, w: m(t), i }), per = ok => this.per.push({ x: this.cx + hw - 10, y: my, ok });
        if (this.o.stage && outL - tw >= this.x0 - 20) { add(full, outL, my, 'right'); per(inner >= perW); }
        else if (tw <= inner) { add(full, inL, my, 'left'); per(inner - tw >= perW); }
        else if (outL - tw >= 4) { add(full, outL, my, 'right'); per(inner >= perW); }
        else if (cnt && this.sh >= 36 && m(name) <= inner) { add(name, inL, my - 8, 'left'); add(cnt, inL, my + 8, 'left'); per(false); }
        else { let t = name, tail = '…' + (cnt ? ' · ' + cnt : ''); while (t.length > 2 && m(t + tail) > inner) t = t.slice(0, -1); add(t + tail, inL, my, 'left'); per(false); } });
    }
    spawn() { if (!this.nf) return false; const i = this.free[--this.nf]; this.mode[i] = 1; this.st[i] = 0; this.u[i] = Math.random() * 1.9 - .95; this.y[i] = this.y0 + Math.random() * 3; return true; }
    kill(i) { this.mode[i] = 0; this.free[this.nf++] = i; }
    coin(x, y) { // лид → монета в кучу
      this.deals++; this.cycleDeals++; this.recent.push(this.t);
      const rx = this.cx + (Math.random() + Math.random() - 1) * this.pileHW, m = 1 - Math.pow((rx - this.cx) / this.pileHW, 2);
      this.coins.push({ x, y, vy: 1.2, rx, ry: this.pileTop + this.pileH - Math.random() * m * this.pileH, rest: false, a: 1 });
      for (let k = 0; k < 4; k++) { const a = Math.random() * Math.PI * 2, sp = 1 + Math.random() * 1.6; this.sparks.push({ x, y, vx: Math.cos(a) * sp, vy: Math.sin(a) * sp - 1, t: 0 }); }
    }
    step(f) {
      const o = this.o, S = this.steps, N = S.length, P = o.p, over = o.over || [];
      this.acc += o.spawn() * f; while (this.acc >= 1) { this.acc--; if (!this.spawn()) { this.acc = 0; break; } }
      for (let i = 0; i < this.n; i++) {
        const m = this.mode[i]; if (!m) continue;
        if (m === 1) {
          const s = this.st[i], st = S[s]; let v = 2.2;
          if (over[s] && this.y[i] > st.yB - (st.yB - st.yT) * .4) v = .3; // перегруз: очередь у границы
          this.y[i] += v * f; this.u[i] = clamp(this.u[i] + (Math.random() - .5) * .05 * f, -.96, .96);
          if (this.y[i] >= st.yB) {
            if (s === N - 1) { this.coin(this.cx + this.u[i] * st.hB, st.yB); this.kill(i); }
            else if (Math.random() < P[s]) this.st[i] = s + 1;
            else { this.mode[i] = 2; this.x[i] = this.cx + this.u[i] * st.hB; this.vx[i] = (this.u[i] >= 0 ? 1 : -1) * 1.5; this.vy[i] = .5; this.age[i] = 0; this.lost[s]++; }
          }
        } else { this.x[i] += this.vx[i] * f; this.y[i] += this.vy[i] * f; this.age[i] += f; if (this.age[i] >= 40) this.kill(i); }
      }
      let resting = 0;
      for (const c of this.coins) { if (!c.rest) { c.vy += .12 * f; c.y += c.vy * f; c.x += (c.rx - c.x) * .08 * f; if (c.y >= c.ry) { c.y = c.ry; c.x = c.rx; c.rest = true; } } else if (c.dying) c.a -= .04 * f; else resting++; }
      if (resting > 320) { const old = this.coins.find(c => c.rest && !c.dying); if (old) old.dying = true; }
      this.coins = this.coins.filter(c => c.a > 0);
      for (const s of this.sparks) { s.x += s.vx * f; s.y += s.vy * f; s.vy += .08 * f; s.t += f; } this.sparks = this.sparks.filter(s => s.t < 14);
      this.t += f / 60; while (this.recent.length && this.recent[0] < this.t - 1) this.recent.shift();
      if (this.t - this.cycleT >= 20) { this.cycleT = this.t; this.cycleDeals = 0; }
    }
    draw() {
      const x = this.ctx, W = this.W, H = this.H, N = this.steps.length, over = this.o.over || []; x.globalCompositeOperation = 'source-over'; x.globalAlpha = 1; x.fillStyle = BG; x.fillRect(0, 0, W, H);
      const amp = Math.min(1, this.recent.length / 25), a = .12 * (1 + .7 * amp * Math.sin(this.t * Math.PI * 2.2)), gy0 = this.pileTop + this.pileH; // свечение у дна ∝ сделкам/с
      const g = x.createRadialGradient(this.cx, gy0, 0, this.cx, gy0, Math.max(W, H) * .45); g.addColorStop(0, `rgba(255,45,122,${a.toFixed(3)})`); g.addColorStop(1, 'rgba(255,45,122,0)'); x.fillStyle = g; x.fillRect(0, 0, W, H);
      x.drawImage(this.static, 0, 0, W, H);
      const blink = Math.floor(this.t * 2) % 2 ? .95 : .3;
      this.steps.forEach((s, i) => { if (!over[i]) return; this.trap(x, s); x.strokeStyle = RED; x.globalAlpha = blink; x.lineWidth = 2; x.stroke(); x.globalAlpha = 1; });
      const sp = this.sp, sz = sp.s, h = sz / 2; x.globalCompositeOperation = 'lighter';
      for (let i = 0; i < this.n; i++) if (this.mode[i] === 1) { const px = this.cx + this.u[i] * this.hw(this.st[i], this.y[i]); x.drawImage(sp, px - h, this.y[i] - h, sz, sz); }
      x.globalCompositeOperation = 'source-over'; const sg = this.sg, gz = sg.s, gh = gz / 2;
      for (let i = 0; i < this.n; i++) if (this.mode[i] === 2) { x.globalAlpha = 1 - this.age[i] / 40; x.drawImage(sg, this.x[i] - gh, this.y[i] - gh, gz, gz); }
      x.globalCompositeOperation = 'lighter'; const sc = this.sc, cz = sc.s, ch = cz / 2;
      for (const c of this.coins) { x.globalAlpha = c.a; x.drawImage(sc, c.x - ch, c.y - ch, cz, cz); }
      x.fillStyle = YEL; for (const s of this.sparks) { x.globalAlpha = 1 - s.t / 14; x.fillRect(s.x - 1, s.y - 1, 2, 2); }
      // подписи на плашке поверх частиц
      x.globalAlpha = 1; x.globalCompositeOperation = 'source-over'; x.font = '700 ' + FONT; x.textBaseline = 'middle';
      for (const l of this.labels) { x.textAlign = l.al; x.fillStyle = 'rgba(10,10,10,.72)'; x.fillRect((l.al === 'left' ? l.x : l.x - l.w) - 6, l.y - 10, l.w + 12, 20); x.fillStyle = over[l.i] ? RED : '#fff'; x.fillText(l.t, l.x, l.y); }
      x.font = '800 ' + FONT; x.textAlign = 'right'; x.fillStyle = RED; x.globalAlpha = blink;
      this.per.forEach((p, i) => { if (over[i] && p.ok) x.fillText('ПЕРЕГРУЗ', p.x, p.y); });
      x.globalAlpha = 1; x.font = '700 ' + FONT; x.fillStyle = MUTED;
      for (let i = 0; i < N - 1; i++) { const v = this.o.losses ? this.o.losses[i] : this.lost[i]; if (!v) continue; const s = this.steps[i], gy = s.yB + this.gap / 2;
        if (this.outside) x.fillText('−' + fmt(v), this.cx - s.hB - 36, gy); else { x.textAlign = 'left'; x.fillText('−' + fmt(v), this.cx + s.hB + 18, gy); x.textAlign = 'right'; } }
    }
    presim(n) { for (let i = 0; i < n; i++) this.step(1); this.recent.length = 0; }
    visible() { const r = this.c.getBoundingClientRect(); return r.bottom > 0 && r.top < innerHeight && !document.hidden; }
    start() { this.presim(420); this.draw(); if (RM) return; let last = performance.now(); // первый кадр всегда
      const loop = now => { const f = clamp((now - last) / 16.67, .5, 2.5); last = now; if (this.visible()) { this.step(f); this.draw(); } requestAnimationFrame(loop); }; requestAnimationFrame(loop); }
    refit() { // ресайз без сброса: та же геометрия — только перерисовка, иначе частицы переносятся
      const sg = this.sig, oy0 = this.y0, oy1 = this.y1, ocx = this.cx, ohw = this.pileHW, ob = this.pileTop + this.pileH, oph = this.pileH; this.fit(); if (this.sig === sg) { this.draw(); return; }
      const ky = (this.y1 - this.y0) / (oy1 - oy0), kx = this.pileHW / ohw, nb = this.pileTop + this.pileH;
      for (let i = 0; i < this.n; i++) { if (this.mode[i] === 1) this.y[i] = this.y0 + (this.y[i] - oy0) * ky; else if (this.mode[i] === 2) this.kill(i); }
      for (const c of this.coins) { c.rx = this.cx + (c.rx - ocx) * kx; c.x = this.cx + (c.x - ocx) * kx; c.ry = nb - (ob - c.ry) * this.pileH / oph; c.y = c.rest ? c.ry : this.y0 + (c.y - oy0) * ky; }
      this.sparks.length = 0; this.draw(); }
  }

  // ---- одометр: колонка на цифру ----
  class Odo {
    constructor(el) { this.el = el; this.n = 0; this.build(1); }
    build(n) { this.n = n; this.cols = []; this.prev = Array(n).fill(0); this.el.innerHTML = '';
      for (let i = 0; i < n; i++) { if (i && (n - i) % 3 === 0) { const s = document.createElement('i'); s.className = 'sep'; this.el.appendChild(s); }
        const c = document.createElement('span'); c.className = 'col'; c.innerHTML = '<span class="strip">' + '01234567890123456789'.replace(/\d/g, '<span>$&</span>') + '</span>'; this.el.appendChild(c); this.cols.push(c); }
      const cur = document.createElement('span'); cur.className = 'cur'; cur.textContent = '₽'; this.el.appendChild(cur); }
    set(v, instant) { const s = String(Math.max(0, Math.round(v))); if (s.length !== this.n) { this.build(s.length); instant = true; }
      this.cols.forEach((c, i) => { const d = +s[i], st = c.firstChild, pd = this.prev[i]; if (d === pd) return; this.prev[i] = d;
        if (instant || RM) { st.style.transition = 'none'; st.style.transform = `translateY(-${d}em)`; return; }
        st.style.transition = '';
        if (d < pd) { st.style.transform = `translateY(-${d + 10}em)`; setTimeout(() => { st.style.transition = 'none'; st.style.transform = `translateY(-${d}em)`; void st.offsetHeight; st.style.transition = ''; }, 420); } // через ноль и тихий откат
        else st.style.transform = `translateY(-${d}em)`; }); }
  }

  // ---- hero: частицы, ползунок КП, табло ----
  const heroP = [.6, .5, .6, .18], odoEl = $('#odo'), odo = new Odo(odoEl), heroDeals = $('#hero-deals');
  const hero = new Funnel($('#hero-canvas'), { stage: $('.hero-stage'), names: ['Лид', 'Квалификация', 'Встреча', 'КП', 'Сделка'], p: heroP, spawn: () => 40, pool: mob() ? 1200 : 3000 });
  const hc = $('#hero-conv'), heroOut = $('#hero-conv-out');
  const onHero = () => { heroP[3] = hc.value / 100; heroOut.textContent = hc.value + '%'; fillRange(hc); if (RM) { hero.reset(); hero.presim(420); hero.draw(); } };
  hc.addEventListener('input', onHero); onHero();
  hero.start(); const board = () => { const v = hero.deals * 150000; odo.set(v); heroDeals.textContent = fmt(hero.deals); odoEl.setAttribute('aria-label', 'Выручка ' + rub(v)); };
  if (RM) board(); else { hero.deals = 0; odo.set(0, true); setInterval(board, 1000); } // 1 Гц: цифры успевают остановиться

  // ---- модель: 200 прогонов Монте-Карло ----
  const DEF = () => ({ target: 3000000, check: 150000, cycle: 30, managers: 4, cap: 15, leads: 500, stages: [{ n: 'Лид', p: .6, d: 1 }, { n: 'Квалификация', p: .5, d: 3 }, { n: 'Встреча', p: .6, d: 7 }, { n: 'КП', p: .35, d: 10 }, { n: 'Сделка' }] });
  const PRESETS = [
    { id: 'b2b', name: 'B2B-услуги', s: DEF },
    { id: 'estate', name: 'Недвижимость', s: () => ({ target: 40000000, check: 8000000, cycle: 60, managers: 3, cap: 12, leads: 300, stages: [{ n: 'Лид', p: .4, d: 1 }, { n: 'Квалификация', p: .35, d: 4 }, { n: 'Показ', p: .5, d: 14 }, { n: 'Бронь', p: .3, d: 21 }, { n: 'Сделка' }] }) },
    { id: 'school', name: 'Онлайн-школа', s: () => ({ target: 6000000, check: 45000, cycle: 14, managers: 8, cap: 25, leads: 2000, stages: [{ n: 'Лид', p: .7, d: 1 }, { n: 'Квалификация', p: .4, d: 2 }, { n: 'Консультация', p: .55, d: 3 }, { n: 'Счёт', p: .45, d: 5 }, { n: 'Сделка' }] }) }];
  let S = DEF(), preset = 'b2b', curR = null;
  const mulberry = a => () => { a |= 0; a = a + 0x6D2B79F5 | 0; let t = Math.imul(a ^ a >>> 15, 1 | a); t = t + Math.imul(t ^ t >>> 7, 61 | t) ^ t; return ((t ^ t >>> 14) >>> 0) / 4294967296; };
  function calc(s) {
    const T = s.stages.length - 1, P = s.stages.slice(0, T).map(x => x.p), prod = P.reduce((a, b) => a * b, 1), flow = []; let n = s.leads;
    for (let i = 0; i < T; i++) { const out = n * P[i]; flow.push({ name: s.stages[i].n, in: n, p: P[i], out, lost: n - out, days: s.stages[i].d, wip: n * s.stages[i].d / 30 }); n = out; }
    const deals = n, base = deals * s.check, rnd = mulberry(20240), R = 200, revs = [], dls = []; let hit = 0;
    const gauss = () => Math.sqrt(-2 * Math.log(rnd() || 1e-9)) * Math.cos(2 * Math.PI * rnd());
    for (let r = 0; r < R; r++) { let m = s.leads * (1 + rnd() * .2 - .1);
      for (let i = 0; i < T; i++) { const p = clamp(P[i] * (1 + rnd() * .4 - .2), .005, .995), mu = m * p, sd = Math.sqrt(Math.max(0, mu * (1 - p))); m = Math.max(0, Math.round(mu + sd * gauss())); }
      dls.push(m); revs.push(m * s.check); if (m * s.check >= s.target) hit++; }
    revs.sort((a, b) => a - b); dls.sort((a, b) => a - b); const q = (a, k) => a[Math.min(R - 1, Math.floor(R * k))];
    const need = Math.ceil(s.target / (s.check * prod)), cap = s.managers * s.cap; let peak = flow[0];
    flow.forEach(f => { f.over = f.wip > cap; if (f.wip > peak.wip) peak = f; });
    const extra = peak.wip > cap ? Math.ceil((peak.wip - cap) / s.cap) : 0;
    const levers = P.map((p, i) => { const p2 = Math.min(1, p + .05); return { label: `+5 п. п. на этапе «${s.stages[i].n}»`, sub: `${pct(p)} → ${pct(p2)}`, delta: base * (p2 / p) - base }; });
    levers.push({ label: '+10% лидов', sub: `${fmt(s.leads)} → ${fmt(s.leads * 1.1)}`, delta: base * .1 });
    let best = 0; levers.forEach((l, i) => { if (l.delta > levers[best].delta) best = i; });
    return { flow, deals, base, prod, p10: q(revs, .1), p50: q(revs, .5), p90: q(revs, .9), d10: q(dls, .1), d50: q(dls, .5), d90: q(dls, .9), prob: hit / R, need, cap, peak, extra, load: peak.wip / cap, levers, best, days: s.stages.slice(0, T).reduce((a, x) => a + x.d, 0) };
  }

  // ---- форма демо ----
  const F = { target: $('#f-target'), check: $('#f-check'), leads: $('#f-leads'), cycle: $('#f-cycle'), managers: $('#f-managers'), cap: $('#f-cap') };
  const readFields = () => { for (const k in F) { const v = +F[k].value; if (v > 0) S[k] = v; } };
  const writeFields = () => { for (const k in F) F[k].value = S[k]; };
  Object.values(F).forEach(i => i.addEventListener('input', () => { readFields(); schedule(); }));
  $('#form').addEventListener('submit', e => { e.preventDefault(); readFields(); recalc(true); });
  let schedT; function schedule(structural) { preset = ''; syncPresets(); clearTimeout(schedT); schedT = setTimeout(() => recalc(structural), 16); }
  function renderStages() {
    const box = $('#stages'); box.innerHTML = ''; const many = S.stages.length > 2;
    S.stages.forEach((st, i) => {
      const last = i === S.stages.length - 1, el = document.createElement('div'); el.className = 'stage';
      el.innerHTML = `<div class="stage-top"><span class="idx">${String(i + 1).padStart(2, '0')}</span><input class="cap-input" id="sn${i}" aria-label="Название этапа ${i + 1}" type="text" maxlength="24" value="${esc(st.n)}">${many ? `<button type="button" class="rm" aria-label="Удалить этап «${esc(st.n)}»">×</button>` : ''}</div>`
        + (last ? '' : `<div class="trans"><div class="slider"><div class="slider-head"><label for="sp${i}" aria-label="Конверсия в «${esc(S.stages[i + 1].n)}»">→ «${esc(S.stages[i + 1].n)}»</label><output for="sp${i}">${pct(st.p)}</output></div><input id="sp${i}" type="range" min="1" max="100" step="1" value="${Math.round(st.p * 100)}"></div><label class="days">Дней<input type="number" aria-label="Дней на этапе" min="0" max="365" step="1" value="${st.d}"></label></div>`);
      const name = $('input[type=text]', el), rm = $('.rm', el);
      name.addEventListener('input', () => { st.n = name.value.trim() || `Этап ${i + 1}`; const prev = box.children[i - 1], pl = prev && $('.slider-head label', prev); if (pl) { pl.textContent = `→ «${st.n}»`; pl.setAttribute('aria-label', `Конверсия в «${st.n}»`); } if (rm) rm.setAttribute('aria-label', `Удалить этап «${st.n}»`); schedule(); });
      if (rm) rm.addEventListener('click', () => { S.stages.splice(i, 1); normalize(); renderStages(); schedule(true); });
      const r = $('input[type=range]', el); if (r) { const out = $('output', el); fillRange(r); r.addEventListener('input', () => { st.p = r.value / 100; out.textContent = pct(st.p); fillRange(r); schedule(); }); }
      const d = $('input[type=number]', el); if (d) d.addEventListener('input', () => { st.d = clamp(+d.value || 0, 0, 365); schedule(); });
      box.appendChild(el);
    });
  }
  function normalize() { const L = S.stages.length - 1; S.stages.forEach((x, j) => { if (j < L) { if (x.p == null) x.p = .5; if (x.d == null) x.d = 3; } else { delete x.p; delete x.d; } }); }
  $('#add-stage').addEventListener('click', () => { if (S.stages.length >= 8) { toast('Максимум 8 этапов'); return; } S.stages.splice(S.stages.length - 1, 0, { n: 'Новый этап', p: .5, d: 3 }); renderStages(); $(`#sn${S.stages.length - 2}`).focus(); schedule(true); });
  const pc = $('#presets'); PRESETS.forEach(p => { const b = document.createElement('button'); b.type = 'button'; b.className = 'chip'; b.id = 'preset-' + p.id; b.textContent = p.name;
    b.addEventListener('click', () => { S = p.s(); preset = p.id; applyState(); toast(`Пресет «${p.name}»: ${fmt(S.leads)} лидов, чек ${rub(S.check)}`); }); pc.appendChild(b); });
  const syncPresets = () => $$('#presets .chip').forEach(b => b.setAttribute('aria-pressed', b.id === 'preset-' + preset));
  function applyState() { writeFields(); renderStages(); syncPresets(); recalc(true); }
  $('#run').addEventListener('click', () => { readFields(); recalc(true); const t = $('.tile-main'); t.classList.remove('flash'); void t.offsetWidth; t.classList.add('flash'); toast(`Пересчитано: 200 прогонов, медиана ${rub(curR.p50)}`); });
  $('#reset').addEventListener('click', () => { S = DEF(); preset = 'b2b'; applyState(); toast('Сброшено к пресету «B2B-услуги»'); });

  // ---- вывод ----
  const tweens = new Map();
  function tween(el, to, f) { const from = tweens.get(el)?.v ?? 0; if (RM || !isFinite(to)) { el.textContent = isFinite(to) ? f(to) : '∞'; tweens.set(el, { v: to }); return; }
    const t0 = performance.now(), o = { v: from }; tweens.set(el, o);
    const step = now => { if (tweens.get(el) !== o) return; const t = Math.min(1, (now - t0) / 400), e = 1 - Math.pow(1 - t, 3); o.v = from + (to - from) * e; el.textContent = f(o.v); if (t < 1) requestAnimationFrame(step); }; requestAnimationFrame(step); }
  const MAN = ['менеджер', 'менеджера', 'менеджеров'];
  const scrollHints = () => $$('.tscroll').forEach(t => t.classList.toggle('scrollable', t.scrollWidth > t.clientWidth + 2)); // таблица шире панели → подсказка
  function render(R) {
    tween($('#r-p50'), R.p50, rub); $('#r-range').textContent = `${rub(R.p10)} – ${rub(R.p90)}`;
    const ok = R.p50 >= S.target, plan = $('#r-plan'); plan.textContent = ok ? `План ${rub(S.target)} выполняется с вероятностью ${pct(R.prob)}` : `До плана ${rub(S.target)} не хватает ${rub(S.target - R.p50)} · вероятность ${pct(R.prob)}`; plan.style.color = ok ? YEL : PINK;
    tween($('#r-deals'), R.d50, fmt); $('#r-deals-sub').textContent = `P10–P90: ${fmt(R.d10)}–${fmt(R.d90)} · сквозная конверсия ${(R.prod * 100).toFixed(1)}%`;
    tween($('#r-need'), R.need, fmt); $('#r-need-sub').textContent = R.need <= S.leads ? `у вас ${fmt(S.leads)} — хватает, запас ${fmt(S.leads - R.need)}` : `у вас ${fmt(S.leads)} — не хватает ${fmt(R.need - S.leads)}`;
    tween($('#r-load'), R.load * 100, v => Math.round(v) + '%'); $('#t-load').classList.toggle('over', R.extra > 0);
    $('#r-load-sub').textContent = R.extra ? `перегруз на этапе «${R.peak.name}»: нужен ещё ${R.extra} ${plural(R.extra, MAN)}` : `пик на этапе «${R.peak.name}»: ${Math.round(R.peak.wip)} из ${R.cap} сделок в работе`;
    $('#stage-rows').innerHTML = R.flow.map(f => { const ov = f.over ? ' · перегруз' : ''; return `<tr${ov ? ' class="over"' : ''}><td><span class="cap">${esc(f.name)}</span><small class="t-sub">−${fmt(f.lost)} · ${Math.round(f.wip)} в работе${ov}</small></td><td>${fmt(f.in)}</td><td>${pct(f.p)}</td><td>${fmt(f.out)}</td><td class="lost">−${fmt(f.lost)}</td><td>${Math.round(f.wip)}${ov}</td></tr>`; }).join('');
    $('#stage-foot').innerHTML = `<tr><td colspan="6"><span class="cap">${esc(S.stages[S.stages.length - 1].n)}</span> ${fmt(R.deals)} × ${rub(S.check)} = <b>${rub(R.base)}</b></td></tr>`;
    $('#cycle-warn').textContent = R.days > S.cycle ? `сумма дней по этапам (${R.days}) больше цикла сделки (${S.cycle})` : `деньги за лиды месяца придут через ${S.cycle} ${plural(S.cycle, ['день', 'дня', 'дней'])}`;
    const lv = $('#levers'), prevBest = lv.dataset.best;
    lv.innerHTML = R.levers.map((l, i) => `<div class="lever${i === R.best ? ' best' : ''}"><span>${esc(l.label)}${i === R.best ? '<i class="badge">самый выгодный</i>' : ''}<small>${l.sub}</small></span><b>${sign(l.delta)}/мес</b></div>`).join('');
    if (prevBest !== String(R.best)) { $('.lever.best', lv).classList.add('flash'); lv.dataset.best = R.best; }
    $('#sheet').innerHTML = planHTML(R, false); $('#print-page').innerHTML = planHTML(R, true); scrollHints();
  }
  function planHTML(R, full) { const bl = R.levers[R.best], H = full ? 'h2' : 'h3'; // full: печать (с «В работе»)
    return `${full ? '<h1>План продаж</h1>' : '<p class="sh-title">План продаж</p>'}<p class="sh-meta">${new Date().toLocaleDateString('ru-RU')} · цель ${rub(S.target)} в месяц · чек ${rub(S.check)} · ${fmt(S.leads)} лидов · ${S.managers} ${plural(S.managers, MAN)} · цикл сделки ${S.cycle} дн.</p>
<div class="sh-big"><div><b>${rub(R.p50)}</b><span>выручка P50, разброс ${rub(R.p10)} – ${rub(R.p90)}</span></div><div><b>${fmt(R.d50)}</b><span>сделок в месяц, вероятность плана ${pct(R.prob)}</span></div><div><b>${fmt(R.need)}</b><span>лидов нужно для плана</span></div></div>
<${H}>Этапы</${H}><div class="sh-tbl"><table><thead><tr><th>Этап</th><th>Вход</th><th>Конверсия</th><th>Выход</th><th>Потери</th>${full ? '<th>В работе</th>' : ''}</tr></thead><tbody>${R.flow.map(f => `<tr><td>${esc(f.name)}</td><td>${fmt(f.in)}</td><td>${pct(f.p)}</td><td>${fmt(f.out)}</td><td>−${fmt(f.lost)}</td>${full ? `<td>${Math.round(f.wip)}${f.over ? ' (перегруз)' : ''}</td>` : ''}</tr>`).join('')}</tbody></table></div>
<${H}>Рычаги</${H}><ul>${R.levers.map((l, i) => `<li${i === R.best ? ' class="sh-best"' : ''}>${esc(l.label)}: ${sign(l.delta)} в месяц${i === R.best ? ' — самый выгодный' : ''}</li>`).join('')}</ul>
<p>Загрузка менеджеров: ${Math.round(R.load * 100)}% (пик — «${esc(R.peak.name)}», ${Math.round(R.peak.wip)} из ${R.cap} сделок в работе)${R.extra ? `. Нужен ещё ${R.extra} ${plural(R.extra, MAN)}` : ''}. Рекомендация: ${esc(bl.label)} → ${sign(bl.delta)} в месяц.</p>
<p class="sh-sign">Расчёт: Воронка, 200 прогонов Монте-Карло, P10–P90. Подпись руководителя: __________</p>`; }

  // ---- демо-воронка: спавн ∝ лидам, 20 с = месяц ----
  const demoF = new Funnel($('#demo-canvas'), { names: S.stages.map(x => x.n), p: [], counts: null, losses: null, over: [], spawn: () => S.leads / 1200, pool: mob() ? 600 : 1200 });
  function syncDemo(R, structural) { const o = demoF.o; o.names = S.stages.map(x => x.n); o.p = R.flow.map(f => f.p); o.counts = R.flow.map(f => Math.round(f.in)).concat(Math.round(R.deals)); o.losses = R.flow.map(f => Math.round(f.lost)); o.over = R.flow.map(f => f.over);
    if (structural) { demoF.layout(); demoF.reset(); demoF.presim(240); } else demoF.renderStatic(); if (RM) demoF.draw(); }
  function recalc(structural) { curR = calc(S); render(curR); syncDemo(curR, structural); renderCompare(); }
  const cyc = $('#cycle-deals'); setInterval(() => { cyc.textContent = demoF.cycleDeals; }, 500);

  // ---- сценарии (localStorage) и сравнение ----
  const KEY = 'voronka:scenarios', loadScn = () => { try { return JSON.parse(localStorage.getItem(KEY)) || []; } catch { return []; } };
  const saveScn = list => { try { localStorage.setItem(KEY, JSON.stringify(list)); } catch { toast('Хранилище недоступно'); } };
  let cmpA = null;
  function renderScn() { const list = loadScn(), box = $('#scenarios'); box.innerHTML = list.length ? '' : '<p class="empty">Сохраните расчёт, измените ползунки — и сравните «было / стало».</p>';
    list.forEach((sc, i) => { const r = calc(sc.s), el = document.createElement('div'); el.className = 'scn';
      el.innerHTML = `<b>${esc(sc.name)}</b><span class="muted">${rub(r.p50)} · ${fmt(r.d50)} сд. · ${fmt(sc.s.leads)} лидов</span><button type="button" class="btn btn-sm" data-a="load">Загрузить</button><button type="button" class="btn btn-sm" data-a="cmp">Сравнить</button><button type="button" class="btn btn-sm" data-a="del" aria-label="Удалить сценарий «${esc(sc.name)}»">×</button>`;
      el.addEventListener('click', e => { const a = e.target.closest('[data-a]')?.dataset.a; if (!a) return;
        if (a === 'load') { S = JSON.parse(JSON.stringify(sc.s)); preset = ''; applyState(); toast(`Сценарий «${sc.name}» загружен`); }
        if (a === 'cmp') { cmpA = sc; renderCompare(); toast(`Сравниваем с «${sc.name}»`); }
        if (a === 'del') { list.splice(i, 1); saveScn(list); if (cmpA && cmpA.name === sc.name && cmpA.ts === sc.ts) cmpA = null; renderScn(); renderCompare(); } });
      box.appendChild(el); }); }
  $('#save').addEventListener('click', () => { const list = loadScn(), inp = $('#scn-name'), name = inp.value.trim() || `Сценарий ${list.length + 1}`, sc = { name, ts: Date.now(), s: JSON.parse(JSON.stringify(S)) };
    list.push(sc); saveScn(list); inp.value = ''; if (!cmpA) cmpA = sc; renderScn(); renderCompare(); toast(`Сценарий «${name}» сохранён — теперь двигайте ползунки`); });
  function renderCompare() { const box = $('#compare'); box.hidden = !cmpA || !curR; if (box.hidden) return; const A = calc(cmpA.s), B = curR;
    const rows = [['Лидов в месяц', cmpA.s.leads, S.leads, fmt], ['Сквозная конверсия', A.prod * 100, B.prod * 100, v => v.toFixed(1) + '%'], ['Сделок, P50', A.d50, B.d50, fmt], ['Выручка, P50', A.p50, B.p50, rub], ['Выручка, P10', A.p10, B.p10, rub], ['Выручка, P90', A.p90, B.p90, rub], ['Нужно лидов для плана', A.need, B.need, fmt, 1], ['Загрузка менеджеров', A.load * 100, B.load * 100, v => Math.round(v) + '%', 1]];
    box.innerHTML = `<div class="panel-head"><h3>Было / стало</h3><span class="muted">«${esc(cmpA.name)}» → текущий расчёт</span></div><div class="tscroll"><table><thead><tr><th>Показатель</th><th>Было</th><th>Стало</th><th>Разница</th></tr></thead><tbody>`
      + rows.map(([l, a, b, f, inv]) => { const d = b - a, rel = a ? d / a * 100 : 0, cls = Math.abs(d) < 1e-9 ? '' : ((d > 0) !== !!inv ? 'up' : 'down');
        return `<tr><td>${l}</td><td>${f(a)}</td><td>${f(b)}</td><td class="${cls}">${Math.abs(d) < 1e-9 ? '—' : (d > 0 ? '+' : '−') + f(Math.abs(d)) + ` <small>(${rel > 0 ? '+' : '−'}${Math.abs(rel).toFixed(0)}%)</small>`}</td></tr>`; }).join('') + '</tbody></table></div><p class="scroll-hint">Таблица прокручивается вбок →</p>'; scrollHints(); }

  // ---- печать, ссылка, PNG ----
  ['#print', '#print2'].forEach(s => $(s).addEventListener('click', () => window.print()));
  const shareURL = () => location.origin + location.pathname + '?' + new URLSearchParams({ t: S.target, c: S.check, l: S.leads, d: S.cycle, m: S.managers, k: S.cap, st: S.stages.map(x => x.n).join('|'), p: S.stages.slice(0, -1).map(x => Math.round(x.p * 100)).join(','), dd: S.stages.slice(0, -1).map(x => x.d).join(',') }) + '#demo';
  async function share() { const u = shareURL(), inp = $('#share-link'); inp.value = u; try { await navigator.clipboard.writeText(u); toast('Ссылка на расчёт скопирована'); } catch { inp.focus(); inp.select(); toast('Скопируйте ссылку из поля'); } }
  ['#share-btn', '#share-btn2'].forEach(s => $(s).addEventListener('click', share));
  function fromURL() { const q = new URLSearchParams(location.search); if (!q.has('t')) return; const s = DEF(), num = (k, d) => { const v = +q.get(k); return v > 0 ? v : d; };
    s.target = num('t', s.target); s.check = num('c', s.check); s.leads = num('l', s.leads); s.cycle = num('d', s.cycle); s.managers = num('m', s.managers); s.cap = num('k', s.cap);
    const names = (q.get('st') || '').split('|').filter(Boolean), ps = (q.get('p') || '').split(',').map(Number), dd = (q.get('dd') || '').split(',').map(Number);
    if (names.length >= 2 && names.length <= 8 && ps.length === names.length - 1) s.stages = names.map((n, i) => i < names.length - 1 ? { n: n.slice(0, 24), p: clamp(ps[i] / 100 || .5, .01, 1), d: clamp(dd[i] || 0, 0, 365) } : { n: n.slice(0, 24) });
    S = s; preset = ''; }
  $('#png').addEventListener('click', () => { const R = curR, c = document.createElement('canvas'); c.width = 1200; c.height = 630; const x = c.getContext('2d');
    x.fillStyle = BG; x.fillRect(0, 0, 1200, 630); const g = x.createRadialGradient(600, 650, 0, 600, 650, 640); g.addColorStop(0, 'rgba(255,45,122,.28)'); g.addColorStop(1, 'rgba(255,45,122,0)'); x.fillStyle = g; x.fillRect(0, 0, 1200, 630);
    const txt = (s, X, Y, font, col, al = 'left') => { x.font = font; x.fillStyle = col; x.textAlign = al; x.fillText(s, X, Y); };
    txt('ПЛАН ПРОДАЖ · ВОРОНКА', 60, 62, '800 16px Manrope, sans-serif', PINK); txt(`Цель ${rub(S.target)} в месяц`, 60, 120, '900 38px Unbounded, sans-serif', '#fff');
    txt(rub(R.p50), 60, 215, '800 72px Unbounded, sans-serif', YEL); txt(`выручка P50 · разброс ${rub(R.p10)} – ${rub(R.p90)} · вероятность плана ${pct(R.prob)}`, 60, 256, '600 21px Manrope, sans-serif', MUTED);
    [[fmt(R.d50), 'сделок в месяц'], [fmt(R.need), 'лидов нужно'], [Math.round(R.load * 100) + '%', 'загрузка']].forEach(([v, l], i) => { txt(v, 60 + i * 230, 332, '800 40px Unbounded, sans-serif', '#fff'); txt(l, 60 + i * 230, 362, '600 18px Manrope, sans-serif', MUTED); });
    const fx = 800, fw = 340, N = R.flow.length + 1, top = 90, h = (430 - top) / N; x.lineWidth = 2; x.strokeStyle = PINK; x.shadowColor = PINK; x.shadowBlur = 16;
    for (let i = 0; i < N; i++) { const w1 = lerp(fw, fw * .3, i / N), w2 = lerp(fw, fw * .3, (i + 1) / N), yT = top + i * h; x.beginPath(); x.moveTo(fx + (fw - w1) / 2, yT); x.lineTo(fx + (fw + w1) / 2, yT); x.lineTo(fx + (fw + w2) / 2, yT + h - 6); x.lineTo(fx + (fw - w2) / 2, yT + h - 6); x.closePath(); x.stroke(); }
    x.shadowBlur = 0; R.flow.forEach((f, i) => txt(`${f.name.toUpperCase()} · ${fmt(f.in)}`, fx + fw / 2, top + i * h + h / 2 + 2, '700 15px Manrope, sans-serif', '#fff', 'center'));
    txt(`${S.stages[N - 1].n.toUpperCase()} · ${fmt(R.deals)}`, fx + fw / 2, top + (N - 1) * h + h / 2 + 2, '700 15px Manrope, sans-serif', YEL, 'center');
    txt(`Самый выгодный рычаг: ${R.levers[R.best].label} → ${sign(R.levers[R.best].delta)}/мес`, 60, 445, '700 22px Manrope, sans-serif', YEL); txt('200 прогонов Монте-Карло · P10–P90 · voronka', 60, 590, '600 16px Manrope, sans-serif', MUTED);
    c.toBlob(b => { if (!b) { toast('Не удалось собрать PNG'); return; } const a = document.createElement('a'); a.href = URL.createObjectURL(b); a.download = 'voronka-plan.png'; document.body.appendChild(a); a.click(); a.remove(); setTimeout(() => URL.revokeObjectURL(a.href), 3000); toast('PNG табло скачан'); }); });

  // ---- тарифы и запуск ----
  const bill = y => { $('#bill-month').setAttribute('aria-pressed', !y); $('#bill-year').setAttribute('aria-pressed', y); $$('[data-month]').forEach(el => el.textContent = y ? el.dataset.year : el.dataset.month); };
  $('#bill-month').addEventListener('click', () => bill(false)); $('#bill-year').addEventListener('click', () => bill(true));
  $$('[data-plan]').forEach(a => a.addEventListener('click', () => toast(`Тариф «${a.dataset.plan}»: начните с бесплатного расчёта в калькуляторе`)));
  fromURL(); writeFields(); renderStages(); syncPresets(); recalc(true); renderScn(); demoF.start();
  let rt; addEventListener('resize', () => { clearTimeout(rt); rt = setTimeout(() => { hero.refit(); demoF.refit(); scrollHints(); }, 150); });
  if (document.fonts && document.fonts.ready) document.fonts.ready.then(() => { hero.refit(); demoF.renderStatic(); if (RM) demoF.draw(); scrollHints(); });
})();
