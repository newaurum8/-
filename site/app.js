/* Kadr — клиентский движок генерации карточек, постов и коротких видео. */
(() => {
  const $ = (s, r = document) => r.querySelector(s);

  // ---------- данные ----------
  const FORMATS = [
    { id: 'wb', name: 'WB 3:4', w: 900, h: 1200 },
    { id: 'ozon', name: 'Ozon', w: 1200, h: 1600 },
    { id: 'ig', name: 'Пост 4:5', w: 1080, h: 1350 },
    { id: 'reels', name: 'Reels 9:16', w: 1080, h: 1920 },
    { id: 'avito', name: 'Avito 4:3', w: 1200, h: 900 },
    { id: 'tg', name: 'Telegram 16:9', w: 1280, h: 720 },
  ];
  const STYLES = [
    { id: 'pop', name: 'Поп', bg: ['#ff5a2d', '#ffb800'], ink: '#141210', paper: '#fff6ea', shape: '#ffd166' },
    { id: 'neon', name: 'Неон', bg: ['#1a0b3b', '#3d0f7a'], ink: '#ffffff', paper: '#0f0824', shape: '#00f0ff', glow: '#ff3cac' },
    { id: 'minimal', name: 'Минимал', bg: ['#f5f3ef', '#e6e1d8'], ink: '#141210', paper: '#ffffff', shape: '#d9d2c5' },
    { id: 'lux', name: 'Люкс', bg: ['#0e0e10', '#2a2522'], ink: '#f3e9d2', paper: '#1a1715', shape: '#c9a35a' },
    { id: 'eco', name: 'Эко', bg: ['#dfe9d6', '#b7cfa6'], ink: '#1e2e1a', paper: '#f4f8ef', shape: '#7aa05e' },
    { id: 'sky', name: 'Свежий', bg: ['#dff3ff', '#8fd0ff'], ink: '#0b2340', paper: '#ffffff', shape: '#2f80ed' },
  ];
  const SILHOUETTES = ['sneaker', 'bottle', 'bag', 'box', 'headphones', 'cream'];

  const state = {
    title: 'Кроссовки Nova Runner', hook: 'Лёгкие как облако. 210 г', price: '4 990 ₽', badge: '−35%',
    format: FORMATS[0], style: STYLES[0], seed: 1, img: null,
  };

  // ---------- утилиты ----------
  function rng(seed) { let s = seed * 9301 + 49297; return () => { s = (s * 16807) % 2147483647; return (s % 10000) / 10000; }; }
  const lerp = (a, b, t) => a + (b - a) * t;
  const isLight = hex => { const n = parseInt(hex.slice(1), 16); return ((n >> 16) * .299 + ((n >> 8) & 255) * .587 + (n & 255) * .114) > 140; };
  const onPaper = sty => isLight(sty.paper) ? '#141210' : (sty.glow || sty.shape);
  const ease = t => 1 - Math.pow(1 - t, 3);
  const clamp01 = t => Math.max(0, Math.min(1, t));
  function rr(ctx, x, y, w, h, r) { ctx.beginPath(); ctx.roundRect(x, y, w, h, r); }
  function fitText(ctx, text, maxW, size, weight, family, minSize) {
    let s = size;
    do { ctx.font = `${weight} ${s}px ${family}`; if (ctx.measureText(text).width <= maxW) break; s -= 2; } while (s > minSize);
    return s;
  }
  function wrap(ctx, text, maxW) {
    const words = text.split(' '), lines = []; let cur = '';
    for (const w of words) { const t = cur ? cur + ' ' + w : w; if (ctx.measureText(t).width > maxW && cur) { lines.push(cur); cur = w; } else cur = t; }
    if (cur) lines.push(cur); return lines;
  }

  // ---------- силуэты товара ----------
  function drawSilhouette(ctx, kind, cx, cy, size, color, r) {
    ctx.save(); ctx.translate(cx, cy); ctx.fillStyle = color; ctx.strokeStyle = color; ctx.lineJoin = 'round';
    const s = size;
    switch (kind) {
      case 'sneaker': {
        ctx.rotate(-0.25);
        ctx.beginPath(); ctx.moveTo(-s * .5, s * .15); ctx.quadraticCurveTo(-s * .55, -s * .05, -s * .3, -s * .1);
        ctx.quadraticCurveTo(-s * .05, -s * .15, s * .05, -s * .35); ctx.quadraticCurveTo(s * .25, -s * .3, s * .3, -s * .1);
        ctx.quadraticCurveTo(s * .45, 0, s * .5, s * .12); ctx.lineTo(s * .5, s * .22); ctx.lineTo(-s * .5, s * .22); ctx.closePath(); ctx.fill();
        ctx.globalAlpha = .35; ctx.fillStyle = '#000'; rr(ctx, -s * .5, s * .14, s, s * .09, s * .04); ctx.fill(); break; }
      case 'bottle': { rr(ctx, -s * .18, -s * .45, s * .36, s * .9, s * .09); ctx.fill(); rr(ctx, -s * .1, -s * .55, s * .2, s * .12, s * .03); ctx.fill();
        ctx.globalAlpha = .25; ctx.fillStyle = '#000'; rr(ctx, -s * .14, -s * .1, s * .28, s * .3, s * .03); ctx.fill(); break; }
      case 'bag': { rr(ctx, -s * .4, -s * .2, s * .8, s * .6, s * .08); ctx.fill(); ctx.lineWidth = s * .05; ctx.beginPath(); ctx.arc(0, -s * .2, s * .22, Math.PI, 0); ctx.stroke(); break; }
      case 'box': { ctx.beginPath(); ctx.moveTo(0, -s * .45); ctx.lineTo(s * .4, -s * .22); ctx.lineTo(s * .4, s * .25); ctx.lineTo(0, s * .48); ctx.lineTo(-s * .4, s * .25); ctx.lineTo(-s * .4, -s * .22); ctx.closePath(); ctx.fill();
        ctx.globalAlpha = .25; ctx.fillStyle = '#000'; ctx.beginPath(); ctx.moveTo(0, 0); ctx.lineTo(s * .4, -s * .22); ctx.lineTo(s * .4, s * .25); ctx.lineTo(0, s * .48); ctx.closePath(); ctx.fill(); break; }
      case 'headphones': { ctx.lineWidth = s * .07; ctx.beginPath(); ctx.arc(0, 0, s * .38, Math.PI, 0); ctx.stroke();
        rr(ctx, -s * .5, -s * .05, s * .2, s * .32, s * .07); ctx.fill(); rr(ctx, s * .3, -s * .05, s * .2, s * .32, s * .07); ctx.fill(); break; }
      default: { rr(ctx, -s * .35, -s * .25, s * .7, s * .55, s * .2); ctx.fill(); rr(ctx, -s * .35, -s * .42, s * .7, s * .2, s * .07); ctx.fill(); }
    }
    ctx.restore();
  }

  // ---------- главный рендер ----------
  // t — прогресс анимации 0..1 (1 для статичного кадра)
  function render(ctx, W, H, st, t = 1) {
    const r = rng(st.seed * 7 + st.format.w);
    const sty = st.style, u = Math.min(W, H) / 900;
    const landscape = W > H * 1.1;

    // фон
    const ang = r() * Math.PI;
    const g = ctx.createLinearGradient(W / 2 - Math.cos(ang) * W, H / 2 - Math.sin(ang) * H, W / 2 + Math.cos(ang) * W, H / 2 + Math.sin(ang) * H);
    g.addColorStop(0, sty.bg[0]); g.addColorStop(1, sty.bg[1]);
    ctx.fillStyle = g; ctx.fillRect(0, 0, W, H);

    // декоративные формы (дрейфуют в видео)
    const drift = (1 - t) * 60 * u;
    const nShapes = 3 + Math.floor(r() * 3);
    for (let i = 0; i < nShapes; i++) {
      const x = r() * W, y = r() * H, rad = (120 + r() * 260) * u;
      ctx.save(); ctx.globalAlpha = .18 + r() * .22; ctx.fillStyle = sty.glow && i % 2 ? sty.glow : sty.shape;
      ctx.beginPath(); ctx.arc(x + drift * (i % 2 ? 1 : -1), y + drift * .5, rad, 0, Math.PI * 2); ctx.fill(); ctx.restore();
    }
    if (r() > .5) { // полоски
      ctx.save(); ctx.globalAlpha = .12; ctx.strokeStyle = sty.ink; ctx.lineWidth = 2 * u;
      for (let i = 0; i < 14; i++) { ctx.beginPath(); ctx.moveTo(0, (i / 14) * H + drift); ctx.lineTo(W, (i / 14) * H - H * .3 + drift); ctx.stroke(); }
      ctx.restore();
    }

    // раскладка
    const pad = 56 * u;
    const prodArea = landscape
      ? { x: W * .55, y: pad, w: W * .45 - pad, h: H - pad * 2 }
      : { x: pad, y: H * .26, w: W - pad * 2, h: H * .46 };
    const textLeft = landscape ? pad : pad;
    const textW = landscape ? W * .5 - pad : W - pad * 2;

    // товар: подложка-пластина
    const pScale = lerp(.7, 1, ease(clamp01(t * 1.6)));
    const pcx = prodArea.x + prodArea.w / 2, pcy = prodArea.y + prodArea.h / 2;
    ctx.save(); ctx.translate(pcx, pcy); ctx.scale(pScale, pScale); ctx.translate(-pcx, -pcy);
    ctx.save(); ctx.globalAlpha = .9; ctx.fillStyle = sty.paper;
    ctx.shadowColor = 'rgba(0,0,0,.35)'; ctx.shadowBlur = 60 * u; ctx.shadowOffsetY = 30 * u;
    const plateR = r() > .5 ? 999 : 36 * u;
    if (plateR === 999) { ctx.beginPath(); ctx.ellipse(pcx, pcy, Math.min(prodArea.w, prodArea.h) * .5, Math.min(prodArea.w, prodArea.h) * .5, 0, 0, Math.PI * 2); ctx.fill(); }
    else { rr(ctx, prodArea.x, prodArea.y, prodArea.w, prodArea.h, plateR); ctx.fill(); }
    ctx.restore();

    const inner = Math.min(prodArea.w, prodArea.h) * .82;
    if (st.img) {
      const iw = st.img.width, ih = st.img.height, s = Math.min(inner / iw, inner / ih);
      ctx.save(); ctx.shadowColor = 'rgba(0,0,0,.4)'; ctx.shadowBlur = 40 * u; ctx.shadowOffsetY = 20 * u;
      ctx.drawImage(st.img, pcx - iw * s / 2, pcy - ih * s / 2, iw * s, ih * s); ctx.restore();
    } else {
      const kind = SILHOUETTES[Math.floor(r() * SILHOUETTES.length)];
      ctx.save(); ctx.shadowColor = 'rgba(0,0,0,.35)'; ctx.shadowBlur = 40 * u; ctx.shadowOffsetY = 24 * u;
      drawSilhouette(ctx, kind, pcx, pcy, inner, sty.glow || sty.bg[0] === '#f5f3ef' ? sty.ink : sty.bg[0], r); ctx.restore();
    }
    ctx.restore();

    // бейдж скидки
    if (st.badge) {
      const bt = ease(clamp01((t - .35) * 3));
      const bs = fitText(ctx, st.badge, 220 * u, 64 * u, 900, 'Unbounded', 30 * u);
      const bw = ctx.measureText(st.badge).width + 48 * u, bh = bs * 1.5;
      const bx = landscape ? W - pad - bw : W - pad - bw, by = landscape ? pad : prodArea.y - bh * .55;
      ctx.save(); ctx.translate(bx + bw / 2, by + bh / 2); ctx.rotate(-.12); ctx.scale(bt, bt);
      ctx.fillStyle = sty.ink === '#ffffff' || sty.ink === '#f3e9d2' ? sty.shape : sty.ink;
      rr(ctx, -bw / 2, -bh / 2, bw, bh, bh / 2); ctx.fill();
      ctx.fillStyle = sty.ink === '#ffffff' || sty.ink === '#f3e9d2' ? '#141210' : sty.paper;
      ctx.textAlign = 'center'; ctx.textBaseline = 'middle'; ctx.fillText(st.badge, 0, bs * .05); ctx.restore();
    }

    // текст
    const tt = ease(clamp01((t - .15) * 2));
    const slide = (1 - tt) * 40 * u;
    ctx.save(); ctx.globalAlpha = tt; ctx.fillStyle = sty.ink; ctx.textBaseline = 'alphabetic';
    const titleSize = fitText(ctx, st.title, textW, (landscape ? 72 : 96) * u, 900, 'Unbounded', 40 * u);
    ctx.font = `900 ${titleSize}px Unbounded`;
    const lines = wrap(ctx, st.title, textW);
    const lh = titleSize * 1.08;
    let y = landscape ? H * .42 : pad + titleSize;
    if (landscape) y -= (lines.length - 1) * lh / 2;
    lines.forEach((l, i) => ctx.fillText(l, textLeft, y + i * lh + slide));
    y += (lines.length - 1) * lh;

    // выгода
    ctx.font = `600 ${(landscape ? 30 : 36) * u}px Manrope`;
    const hl = wrap(ctx, st.hook, textW);
    hl.forEach((l, i) => ctx.fillText(l, textLeft, y + (landscape ? 52 : 60) * u + i * 44 * u + slide));
    ctx.restore();

    // ценник внизу
    if (st.price) {
      const pt = ease(clamp01((t - .5) * 2.5));
      const ps = fitText(ctx, st.price, textW * .6, 72 * u, 800, 'Unbounded', 36 * u);
      const pw = ctx.measureText(st.price).width + 56 * u, ph = ps * 1.6;
      const px = textLeft, py = H - pad - ph + (1 - pt) * 40 * u;
      ctx.save(); ctx.globalAlpha = pt; ctx.fillStyle = sty.paper; rr(ctx, px, py, pw, ph, 20 * u); ctx.fill();
      ctx.fillStyle = onPaper(sty); ctx.textBaseline = 'middle'; ctx.textAlign = 'left';
      ctx.font = `800 ${ps}px Unbounded`; ctx.fillText(st.price, px + 28 * u, py + ph / 2 + ps * .06); ctx.restore();
      // подпись бренда
      ctx.save(); ctx.globalAlpha = .7 * pt; ctx.fillStyle = sty.ink; ctx.font = `700 ${20 * u}px Manrope`; ctx.textAlign = 'right'; ctx.textBaseline = 'middle';
      ctx.fillText('kadr.app', W - pad, py + ph / 2); ctx.restore();
    }

    // зерно
    ctx.save(); ctx.globalAlpha = .05; ctx.fillStyle = sty.ink;
    const gr = rng(st.seed);
    for (let i = 0; i < 1400; i++) ctx.fillRect(gr() * W, gr() * H, 2 * u, 2 * u);
    ctx.restore();
  }

  // ---------- студия ----------
  const out = $('#out'), ctx = out.getContext('2d');
  function draw(t = 1) {
    const { w, h } = state.format;
    if (out.width !== w || out.height !== h) { out.width = w; out.height = h; }
    render(ctx, w, h, state, t);
    $('#meta-size').textContent = `${w} × ${h}`;
    $('#meta-seed').textContent = `вариант #${state.seed}`;
  }

  function chips(container, items, key, onPick) {
    container.innerHTML = '';
    items.forEach(it => {
      const b = document.createElement('button'); b.type = 'button'; b.className = 'chip';
      b.innerHTML = (it.bg ? `<span class="sw" style="background:linear-gradient(135deg,${it.bg[0]},${it.bg[1]})"></span>` : '') + it.name;
      b.setAttribute('aria-pressed', String(state[key].id === it.id));
      b.onclick = () => { state[key] = it; [...container.children].forEach(c => c.setAttribute('aria-pressed', 'false')); b.setAttribute('aria-pressed', 'true'); onPick && onPick(); draw(); };
      container.appendChild(b);
    });
  }
  chips($('#formats'), FORMATS, 'format');
  chips($('#styles'), STYLES, 'style');

  ['title', 'hook', 'price', 'badge'].forEach(k => $('#' + k).addEventListener('input', e => { state[k] = e.target.value; draw(); }));
  $('#regen').onclick = () => { state.seed++; draw(); };

  // фото
  const drop = $('#drop'), file = $('#file');
  function loadFile(f) {
    if (!f || !f.type.startsWith('image/')) return;
    const img = new Image(); img.onload = () => { state.img = img; $('#drop-text').textContent = `Фото: ${f.name}. Нажмите, чтобы заменить`; draw(); };
    img.src = URL.createObjectURL(f);
  }
  file.onchange = () => loadFile(file.files[0]);
  ['dragenter', 'dragover'].forEach(ev => drop.addEventListener(ev, e => { e.preventDefault(); drop.classList.add('over'); }));
  ['dragleave', 'drop'].forEach(ev => drop.addEventListener(ev, e => { e.preventDefault(); drop.classList.remove('over'); }));
  drop.addEventListener('drop', e => loadFile(e.dataTransfer.files[0]));

  // скачать PNG
  $('#dl-png').onclick = () => {
    draw(1);
    const a = document.createElement('a'); a.download = `kadr-${state.format.id}-${state.seed}.png`; a.href = out.toDataURL('image/png'); a.click();
    $('#status').textContent = 'PNG сохранён.';
  };

  // видео 6 секунд через MediaRecorder
  $('#dl-video').onclick = async () => {
    if (!('MediaRecorder' in window) || !out.captureStream) { $('#status').textContent = 'Браузер не поддерживает запись видео. Попробуйте Chrome.'; return; }
    const btn = $('#dl-video'); btn.disabled = true;
    const mime = ['video/mp4;codecs=avc1', 'video/webm;codecs=vp9', 'video/webm'].find(m => MediaRecorder.isTypeSupported(m)) || 'video/webm';
    const stream = out.captureStream(30), rec = new MediaRecorder(stream, { mimeType: mime, videoBitsPerSecond: 6e6 }), chunks = [];
    rec.ondataavailable = e => e.data.size && chunks.push(e.data);
    const done = new Promise(res => rec.onstop = res);
    rec.start(100);
    const DUR = 6000, t0 = performance.now();
    await new Promise(res => { (function frame(now) {
      const p = Math.min(1, (now - t0) / DUR);
      // 0–1.2 с въезд, затем лёгкое дыхание, последние 0.6 с держим кадр
      const a = Math.min(1, p / .2), breathe = 1 + Math.sin(p * Math.PI * 2) * .004;
      draw(a); if (breathe !== 1) { /* статичный кадр уже отрисован */ }
      $('#status').textContent = `Запись видео… ${Math.round(p * 100)}%`;
      p < 1 ? requestAnimationFrame(frame) : res();
    })(t0); });
    rec.stop(); await done;
    const ext = mime.startsWith('video/mp4') ? 'mp4' : 'webm';
    const a = document.createElement('a'); a.download = `kadr-${state.format.id}-${state.seed}.${ext}`; a.href = URL.createObjectURL(new Blob(chunks, { type: mime })); a.click();
    $('#status').textContent = `Видео ${ext.toUpperCase()} сохранено (6 с, ${state.format.w}×${state.format.h}).`;
    btn.disabled = false; draw(1);
  };

  // ---------- hero и галерея ----------
  const PRESETS = [
    { title: 'Кроссовки Nova Runner', hook: 'Лёгкие как облако. 210 г', price: '4 990 ₽', badge: '−35%', style: 'pop' },
    { title: 'Сыворотка Glow 2%', hook: 'Сияние за 7 дней', price: '1 290 ₽', badge: 'NEW', style: 'minimal' },
    { title: 'Наушники Pulse Pro', hook: 'Шумоподавление 40 дБ', price: '7 490 ₽', badge: '−20%', style: 'neon' },
    { title: 'Часы Meridian', hook: 'Сапфир. Швейцарский механизм', price: '54 000 ₽', badge: 'LIMITED', style: 'lux' },
    { title: 'Чай матча Origin', hook: 'Собран в Удзи, Япония', price: '890 ₽', badge: '−15%', style: 'eco' },
    { title: 'Бутылка Hydro 1 л', hook: 'Холод 24 часа', price: '1 590 ₽', badge: 'ХИТ', style: 'sky' },
    { title: 'Рюкзак Urban 20L', hook: 'Ноутбук 16″ и дождь не страшен', price: '3 490 ₽', badge: '−40%', style: 'pop' },
    { title: 'Свеча Amber Noir', hook: 'Горит 60 часов', price: '1 190 ₽', badge: 'GIFT', style: 'lux' },
  ];
  function presetState(p, seed, fmt = FORMATS[0]) { return { ...p, style: STYLES.find(s => s.id === p.style), format: fmt, seed, img: null }; }

  document.querySelectorAll('.stack-card').forEach((c, i) => { const p = PRESETS[[0, 2, 3][i]]; render(c.getContext('2d'), c.width, c.height, presetState(p, 3 + i, { w: 540, h: 720 })); });

  const gg = $('#gallery-grid');
  PRESETS.forEach((p, i) => {
    const b = document.createElement('button'), c = document.createElement('canvas'); c.width = 450; c.height = 600;
    render(c.getContext('2d'), 450, 600, presetState(p, 11 + i, { w: 450, h: 600 }));
    b.appendChild(c); b.title = p.title; b.setAttribute('aria-label', `Открыть «${p.title}» в студии`);
    b.onclick = () => {
      Object.assign(state, { title: p.title, hook: p.hook, price: p.price, badge: p.badge, style: STYLES.find(s => s.id === p.style), seed: 11 + i });
      ['title', 'hook', 'price', 'badge'].forEach(k => $('#' + k).value = state[k]);
      chips($('#styles'), STYLES, 'style'); draw(); $('#studio').scrollIntoView({ behavior: 'smooth' });
    };
    gg.appendChild(b);
  });

  // тема
  $('[data-theme-toggle]').onclick = () => {
    const root = document.documentElement, dark = root.dataset.theme === 'dark' || (!root.dataset.theme && matchMedia('(prefers-color-scheme: dark)').matches);
    root.dataset.theme = dark ? 'light' : 'dark';
  };

  // первый кадр после загрузки шрифтов
  draw();
  if (document.fonts) document.fonts.ready.then(() => { draw(); document.querySelectorAll('.stack-card').forEach((c, i) => render(c.getContext('2d'), c.width, c.height, presetState(PRESETS[[0, 2, 3][i]], 3 + i, { w: 540, h: 720 }))); [...gg.children].forEach((b, i) => render(b.firstChild.getContext('2d'), 450, 600, presetState(PRESETS[i], 11 + i, { w: 450, h: 600 }))); });
})();
