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
    { id: 'pop', name: 'Поп', bg: ['#ff5a2d', '#ffb800'], ink: '#141210', paper: '#fff6ea', shape: '#ffd166', accent: '#141210' },
    { id: 'neon', name: 'Неон', bg: ['#1a0b3b', '#3d0f7a'], ink: '#ffffff', paper: '#0f0824', shape: '#00f0ff', glow: '#ff3cac', accent: '#ff3cac' },
    { id: 'minimal', name: 'Минимал', bg: ['#f5f3ef', '#e6e1d8'], ink: '#141210', paper: '#ffffff', shape: '#d9d2c5', accent: '#ff5a2d' },
    { id: 'lux', name: 'Люкс', bg: ['#0e0e10', '#2a2522'], ink: '#f3e9d2', paper: '#1a1715', shape: '#c9a35a', accent: '#c9a35a' },
    { id: 'eco', name: 'Эко', bg: ['#dfe9d6', '#b7cfa6'], ink: '#1e2e1a', paper: '#f4f8ef', shape: '#7aa05e', accent: '#3f6b2e' },
    { id: 'sky', name: 'Свежий', bg: ['#dff3ff', '#8fd0ff'], ink: '#0b2340', paper: '#ffffff', shape: '#2f80ed', accent: '#2f80ed' },
    { id: 'candy', name: 'Кэнди', bg: ['#ffd6e8', '#ffb3d1'], ink: '#4a0f2e', paper: '#fff0f6', shape: '#ff6fae', accent: '#d1266e' },
    { id: 'mono', name: 'Моно', bg: ['#f2f2f2', '#dcdcdc'], ink: '#111111', paper: '#ffffff', shape: '#111111', accent: '#111111' },
    { id: 'sunset', name: 'Закат', bg: ['#2b0b3f', '#ff7a45'], ink: '#fff4e6', paper: '#2b0b3f', shape: '#ffb86b', glow: '#ff4f7b', accent: '#ffb86b' },
    { id: 'ocean', name: 'Океан', bg: ['#032b3a', '#0a6f8f'], ink: '#e8fbff', paper: '#063747', shape: '#4fd1c5', glow: '#9ff5ea', accent: '#4fd1c5' },
    { id: 'acid', name: 'Кислота', bg: ['#d9ff3d', '#b6ff00'], ink: '#101010', paper: '#101010', shape: '#101010', accent: '#101010' },
    { id: 'terra', name: 'Терра', bg: ['#e8d5c0', '#c98a5b'], ink: '#3a2316', paper: '#fbf3ea', shape: '#a35a35', accent: '#a35a35' },
  ];
  const LAYOUTS = [
    { id: 'auto', name: 'Авто' }, { id: 'classic', name: 'Классика' }, { id: 'poster', name: 'Постер' },
    { id: 'split', name: 'Сплит' }, { id: 'editorial', name: 'Журнал' }, { id: 'sticker', name: 'Стикеры' },
  ];
  const BACKDROPS = ['blobs', 'stripes', 'dots', 'rays', 'grid', 'halftone', 'rings', 'waves'];
  const SILHOUETTES = ['sneaker', 'bottle', 'bag', 'box', 'headphones', 'cream', 'phone', 'watch', 'mug', 'perfume', 'tshirt', 'chair'];
  const state = {
    title: 'Кроссовки Nova Runner', hook: 'Лёгкие как облако. 210 г', price: '4 990 ₽', badge: '−35%',
    format: FORMATS[0], style: STYLES[0], layout: LAYOUTS[0], seed: 1, img: null,
  };
  // ---------- утилиты ----------
  function rng(seed) { let s = seed * 9301 + 49297; return () => { s = (s * 16807) % 2147483647; return (s % 10000) / 10000; }; }
  const lerp = (a, b, t) => a + (b - a) * t;
  const isLight = hex => { const n = parseInt(hex.slice(1), 16); return ((n >> 16) * .299 + ((n >> 8) & 255) * .587 + (n & 255) * .114) > 140; };
  const onPaper = sty => isLight(sty.paper) ? '#141210' : (sty.glow && isLight(sty.glow) ? sty.glow : isLight(sty.shape) ? sty.shape : '#ffffff');
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
  let drawSilhouette = function (ctx, kind, cx, cy, size, color, r) {
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

  // ---------- силуэты (расширенные) ----------
  function drawSilhouetteExtra(ctx, kind, s, r) {
    switch (kind) {
      case 'phone': rr(ctx, -s * .22, -s * .45, s * .44, s * .9, s * .07); ctx.fill(); ctx.globalAlpha = .3; ctx.fillStyle = '#fff'; rr(ctx, -s * .19, -s * .41, s * .38, s * .82, s * .05); ctx.fill(); ctx.globalAlpha = 1; ctx.fillStyle = '#000'; ctx.globalAlpha = .4; rr(ctx, -s * .06, -s * .4, s * .12, s * .025, s * .01); ctx.fill(); return true;
      case 'watch': ctx.lineWidth = s * .18; ctx.beginPath(); ctx.moveTo(0, -s * .48); ctx.lineTo(0, s * .48); ctx.stroke(); ctx.beginPath(); ctx.arc(0, 0, s * .26, 0, Math.PI * 2); ctx.fill(); ctx.globalAlpha = .35; ctx.fillStyle = '#fff'; ctx.beginPath(); ctx.arc(0, 0, s * .19, 0, Math.PI * 2); ctx.fill(); return true;
      case 'mug': rr(ctx, -s * .3, -s * .3, s * .5, s * .62, s * .06); ctx.fill(); ctx.lineWidth = s * .07; ctx.beginPath(); ctx.arc(s * .22, 0, s * .17, -Math.PI / 2, Math.PI / 2); ctx.stroke(); ctx.globalAlpha = .25; ctx.fillStyle = '#000'; rr(ctx, -s * .3, -s * .3, s * .5, s * .08, s * .03); ctx.fill(); return true;
      case 'perfume': rr(ctx, -s * .25, -s * .15, s * .5, s * .6, s * .05); ctx.fill(); rr(ctx, -s * .08, -s * .35, s * .16, s * .2, s * .02); ctx.fill(); rr(ctx, -s * .12, -s * .48, s * .24, s * .14, s * .04); ctx.fill(); ctx.globalAlpha = .25; ctx.fillStyle = '#fff'; rr(ctx, -s * .18, -s * .05, s * .12, s * .4, s * .03); ctx.fill(); return true;
      case 'tshirt': ctx.beginPath(); ctx.moveTo(-s * .18, -s * .42); ctx.lineTo(s * .18, -s * .42); ctx.lineTo(s * .48, -s * .25); ctx.lineTo(s * .38, s * .0); ctx.lineTo(s * .28, -s * .06); ctx.lineTo(s * .28, s * .45); ctx.lineTo(-s * .28, s * .45); ctx.lineTo(-s * .28, -s * .06); ctx.lineTo(-s * .38, 0); ctx.lineTo(-s * .48, -s * .25); ctx.closePath(); ctx.fill(); ctx.globalAlpha = .3; ctx.fillStyle = '#000'; ctx.beginPath(); ctx.arc(0, -s * .42, s * .14, 0, Math.PI); ctx.fill(); return true;
      case 'chair': rr(ctx, -s * .3, -s * .48, s * .6, s * .5, s * .12); ctx.fill(); rr(ctx, -s * .36, -s * .02, s * .72, s * .14, s * .05); ctx.fill(); ctx.lineWidth = s * .05; ctx.beginPath(); ctx.moveTo(-s * .28, s * .12); ctx.lineTo(-s * .34, s * .48); ctx.moveTo(s * .28, s * .12); ctx.lineTo(s * .34, s * .48); ctx.stroke(); return true;
    }
    return false;
  }
  const _drawSil = drawSilhouette;
  drawSilhouette = function (ctx, kind, cx, cy, size, color, r) {
    ctx.save(); ctx.translate(cx, cy); ctx.fillStyle = color; ctx.strokeStyle = color; ctx.lineJoin = 'round'; ctx.lineCap = 'round';
    const ok = drawSilhouetteExtra(ctx, kind, size, r); ctx.restore();
    if (!ok) _drawSil(ctx, kind, cx, cy, size, color, r);
  };

  // ---------- фоны ----------
  function backdrop(ctx, W, H, sty, kind, r, drift, u) {
    const col = i => (sty.glow && i % 2 ? sty.glow : sty.shape);
    ctx.save();
    switch (kind) {
      case 'blobs': { const n = 3 + Math.floor(r() * 3); for (let i = 0; i < n; i++) { ctx.globalAlpha = .18 + r() * .22; ctx.fillStyle = col(i); ctx.beginPath(); ctx.arc(r() * W + drift * (i % 2 ? 1 : -1), r() * H + drift * .5, (120 + r() * 260) * u, 0, Math.PI * 2); ctx.fill(); } break; }
      case 'stripes': { ctx.globalAlpha = .14; ctx.strokeStyle = sty.shape; ctx.lineWidth = 3 * u; const k = .3 + r() * .5; for (let i = -4; i < 20; i++) { ctx.beginPath(); ctx.moveTo(0, (i / 14) * H + drift); ctx.lineTo(W, (i / 14) * H - H * k + drift); ctx.stroke(); } break; }
      case 'dots': { ctx.globalAlpha = .22; ctx.fillStyle = sty.shape; const g = 56 * u; for (let y = g / 2; y < H; y += g) for (let x = g / 2 + ((y / g) | 0) % 2 * g / 2; x < W; x += g) { ctx.beginPath(); ctx.arc(x + drift * .3, y, 5 * u, 0, Math.PI * 2); ctx.fill(); } break; }
      case 'rays': { ctx.globalAlpha = .13; ctx.fillStyle = sty.shape; const cx = W * (.3 + r() * .4), cy = H * (.3 + r() * .4), n = 16, L = Math.hypot(W, H); for (let i = 0; i < n; i += 2) { const a0 = (i / n) * Math.PI * 2 + drift * .002, a1 = ((i + 1) / n) * Math.PI * 2 + drift * .002; ctx.beginPath(); ctx.moveTo(cx, cy); ctx.lineTo(cx + Math.cos(a0) * L, cy + Math.sin(a0) * L); ctx.lineTo(cx + Math.cos(a1) * L, cy + Math.sin(a1) * L); ctx.closePath(); ctx.fill(); } break; }
      case 'grid': { ctx.globalAlpha = .16; ctx.strokeStyle = sty.ink; ctx.lineWidth = 1.5 * u; const g = 72 * u; for (let x = (drift % g); x < W; x += g) { ctx.beginPath(); ctx.moveTo(x, 0); ctx.lineTo(x, H); ctx.stroke(); } for (let y = 0; y < H; y += g) { ctx.beginPath(); ctx.moveTo(0, y); ctx.lineTo(W, y); ctx.stroke(); } break; }
      case 'halftone': { ctx.fillStyle = sty.shape; const g = 30 * u, cx = W * r(), cy = H * r(), R = Math.hypot(W, H); for (let y = 0; y < H; y += g) for (let x = 0; x < W; x += g) { const d = Math.hypot(x - cx, y - cy) / R; const rad = Math.max(0, (1 - d * 1.6)) * g * .55; if (rad > .4) { ctx.globalAlpha = .28; ctx.beginPath(); ctx.arc(x + drift * .2, y, rad, 0, Math.PI * 2); ctx.fill(); } } break; }
      case 'rings': { ctx.strokeStyle = sty.shape; const cx = W * (r() > .5 ? .85 : .15), cy = H * (r() > .5 ? .2 : .8); for (let i = 1; i < 9; i++) { ctx.globalAlpha = .25 - i * .02; ctx.lineWidth = (10 + i * 2) * u; ctx.beginPath(); ctx.arc(cx, cy, i * 110 * u + drift, 0, Math.PI * 2); ctx.stroke(); } break; }
      case 'waves': { ctx.globalAlpha = .2; ctx.fillStyle = sty.shape; const ph = r() * 6; for (let k = 0; k < 4; k++) { ctx.beginPath(); ctx.moveTo(0, H); for (let x = 0; x <= W; x += 20) ctx.lineTo(x, H * (.55 + k * .12) + Math.sin(x / (160 * u) + ph + k + drift * .01) * 40 * u); ctx.lineTo(W, H); ctx.closePath(); ctx.fill(); } break; }
    }
    ctx.restore();
  }

  function drawProduct(ctx, st, sty, area, r, u, t, plate = true) {
    const pScale = lerp(.7, 1, ease(clamp01(t * 1.6)));
    const pcx = area.x + area.w / 2, pcy = area.y + area.h / 2;
    ctx.save(); ctx.translate(pcx, pcy); ctx.scale(pScale, pScale); ctx.translate(-pcx, -pcy);
    if (plate) {
      ctx.save(); ctx.globalAlpha = .92; ctx.fillStyle = sty.paper; ctx.shadowColor = 'rgba(0,0,0,.35)'; ctx.shadowBlur = 60 * u; ctx.shadowOffsetY = 30 * u;
      const kind = Math.floor(r() * 3);
      const m = Math.min(area.w, area.h);
      if (kind === 0) { ctx.beginPath(); ctx.ellipse(pcx, pcy, m * .5, m * .5, 0, 0, Math.PI * 2); ctx.fill(); }
      else if (kind === 1) { rr(ctx, area.x, area.y, area.w, area.h, 36 * u); ctx.fill(); }
      else { ctx.beginPath(); ctx.roundRect(pcx - m * .5, pcy - m * .5, m, m, [m * .5, 36 * u, m * .5, 36 * u]); ctx.fill(); }
      ctx.restore();
    } else { // пол-тень
      ctx.save(); ctx.globalAlpha = .35; ctx.fillStyle = '#000'; ctx.filter = `blur(${24 * u}px)`; ctx.beginPath(); ctx.ellipse(pcx, pcy + area.h * .42, area.w * .35, area.h * .06, 0, 0, Math.PI * 2); ctx.fill(); ctx.restore();
    }
    const inner = Math.min(area.w, area.h) * (plate ? .82 : .96);
    ctx.save(); ctx.shadowColor = 'rgba(0,0,0,.4)'; ctx.shadowBlur = 40 * u; ctx.shadowOffsetY = 20 * u;
    if (st.img) { const iw = st.img.width, ih = st.img.height, s = Math.min(inner / iw, inner / ih); ctx.drawImage(st.img, pcx - iw * s / 2, pcy - ih * s / 2, iw * s, ih * s); }
    else { const kind = SILHOUETTES[Math.floor(r() * SILHOUETTES.length)]; const color = isLight(sty.paper) === isLight(sty.bg[0]) ? (isLight(sty.paper) ? sty.accent : sty.shape) : sty.bg[0]; drawSilhouette(ctx, kind, pcx, pcy, inner, plate ? color : (isLight(sty.bg[0]) ? sty.accent : sty.paper), r); }
    ctx.restore(); ctx.restore();
  }

  function drawBadge(ctx, text, x, y, sty, u, t, rot = -.12, big = false) {
    if (!text) return;
    const bt = ease(clamp01((t - .35) * 3));
    const bs = fitText(ctx, text, 220 * u, (big ? 80 : 64) * u, 900, 'Unbounded', 30 * u);
    const bw = ctx.measureText(text).width + 48 * u, bh = bs * 1.5;
    const fill = isLight(sty.bg[0]) ? sty.accent : sty.shape, ink = isLight(fill) ? '#141210' : '#ffffff';
    ctx.save(); ctx.translate(x, y); ctx.rotate(rot); ctx.scale(bt, bt);
    ctx.fillStyle = fill;
    if (big) { ctx.beginPath(); const n = 16, R = Math.max(bw, bh) * .62; for (let i = 0; i < n * 2; i++) { const a = (i / (n * 2)) * Math.PI * 2, rad = i % 2 ? R : R * .84; ctx.lineTo(Math.cos(a) * rad, Math.sin(a) * rad); } ctx.closePath(); ctx.fill(); }
    else { rr(ctx, -bw / 2, -bh / 2, bw, bh, bh / 2); ctx.fill(); }
    ctx.fillStyle = ink; ctx.textAlign = 'center'; ctx.textBaseline = 'middle'; ctx.font = `900 ${bs}px Unbounded`; ctx.fillText(text, 0, bs * .05); ctx.restore();
  }

  function drawPrice(ctx, st, sty, x, y, u, t, maxW, align = 'left') {
    if (!st.price) return 0;
    const pt = ease(clamp01((t - .5) * 2.5));
    const ps = fitText(ctx, st.price, maxW, 72 * u, 800, 'Unbounded', 36 * u);
    const pw = ctx.measureText(st.price).width + 56 * u, ph = ps * 1.6;
    const px = align === 'right' ? x - pw : x, py = y - ph + (1 - pt) * 40 * u;
    ctx.save(); ctx.globalAlpha = pt; ctx.fillStyle = sty.paper; ctx.shadowColor = 'rgba(0,0,0,.18)'; ctx.shadowBlur = 24 * u; ctx.shadowOffsetY = 8 * u; rr(ctx, px, py, pw, ph, 20 * u); ctx.fill(); ctx.shadowBlur = 0;
    ctx.fillStyle = onPaper(sty); ctx.textBaseline = 'middle'; ctx.textAlign = 'left'; ctx.font = `800 ${ps}px Unbounded`; ctx.fillText(st.price, px + 28 * u, py + ph / 2 + ps * .06); ctx.restore();
    return ph;
  }

  function drawTitle(ctx, st, sty, x, y, maxW, size, u, t, opts = {}) {
    const tt = ease(clamp01((t - .15) * 2)), slide = (1 - tt) * 40 * u;
    ctx.save(); ctx.globalAlpha = tt; ctx.textBaseline = 'alphabetic'; ctx.textAlign = opts.align || 'left';
    const ts = fitText(ctx, st.title, maxW, size, 900, 'Unbounded', size * .45);
    ctx.font = `900 ${ts}px Unbounded`;
    const lines = wrap(ctx, st.title, maxW), lh = ts * 1.06;
    lines.forEach((l, i) => {
      const ly = y + i * lh + slide;
      if (opts.highlight) { const w = ctx.measureText(l).width; ctx.fillStyle = sty.accent; const hx = opts.align === 'center' ? x - w / 2 : x; rr(ctx, hx - 12 * u, ly - ts * .82, w + 24 * u, ts * 1.05, 8 * u); ctx.fill(); ctx.fillStyle = isLight(sty.accent) ? '#141210' : '#fff'; }
      else if (opts.outline) { ctx.lineWidth = ts * .06; ctx.strokeStyle = sty.ink; ctx.lineJoin = 'round'; ctx.strokeText(l, x, ly); ctx.fillStyle = i % 2 ? 'transparent' : sty.ink; }
      else ctx.fillStyle = sty.ink;
      ctx.fillText(l, x, ly);
    });
    const hookSize = Math.max(26 * u, ts * .36);
    ctx.font = `600 ${hookSize}px Manrope`; ctx.fillStyle = sty.ink; ctx.globalAlpha = tt * .9;
    const hl = wrap(ctx, st.hook, maxW), hy = y + lines.length * lh + hookSize * .2;
    hl.forEach((l, i) => ctx.fillText(l, x, hy + i * hookSize * 1.3 + slide));
    ctx.restore();
    return { bottom: y + lines.length * lh + hl.length * hookSize * 1.3, ts };
  }

  // ---------- главный рендер ----------
  function render(ctx, W, H, st, t = 1) {
    const r = rng(st.seed * 7 + st.format.w);
    const sty = st.style, u = Math.min(W, H) / 900, pad = 56 * u;
    const landscape = W > H * 1.1, tall = H > W * 1.5;
    const layoutId = (st.layout && st.layout.id !== 'auto') ? st.layout.id : ['classic', 'poster', 'split', 'editorial', 'sticker'][Math.floor(r() * 5)];

    // фон
    const ang = r() * Math.PI;
    const g = ctx.createLinearGradient(W / 2 - Math.cos(ang) * W, H / 2 - Math.sin(ang) * H, W / 2 + Math.cos(ang) * W, H / 2 + Math.sin(ang) * H);
    g.addColorStop(0, sty.bg[0]); g.addColorStop(1, sty.bg[1]); ctx.fillStyle = g; ctx.fillRect(0, 0, W, H);
    const drift = (1 - t) * 60 * u;
    backdrop(ctx, W, H, sty, BACKDROPS[Math.floor(r() * BACKDROPS.length)], r, drift, u);
    if (sty.glow) { ctx.save(); ctx.globalAlpha = .5; const rg = ctx.createRadialGradient(W * .8, H * .1, 0, W * .8, H * .1, W * .7); rg.addColorStop(0, sty.glow); rg.addColorStop(1, 'transparent'); ctx.fillStyle = rg; ctx.fillRect(0, 0, W, H); ctx.restore(); }

    if (layoutId === 'classic') {
      if (landscape) {
        drawProduct(ctx, st, sty, { x: W * .55, y: pad, w: W * .45 - pad, h: H - pad * 2 }, r, u, t);
        drawTitle(ctx, st, sty, pad, H * .4, W * .5 - pad, 72 * u, u, t);
        drawPrice(ctx, st, sty, pad, H - pad, u, t, W * .4);
        drawBadge(ctx, st.badge, W - pad - 100 * u, pad + 50 * u, sty, u, t);
      } else {
        const ph = tall ? H * .4 : H * .46, py = tall ? H * .3 : H * .26;
        drawProduct(ctx, st, sty, { x: pad, y: py, w: W - pad * 2, h: ph }, r, u, t);
        drawTitle(ctx, st, sty, pad, pad + 90 * u, W - pad * 2, 96 * u, u, t);
        drawPrice(ctx, st, sty, pad, H - pad, u, t, W * .6);
        drawBadge(ctx, st.badge, W - pad - 110 * u, py - 10 * u, sty, u, t);
      }
    } else if (layoutId === 'poster') { // огромный заголовок за товаром
      const big = fitText(ctx, st.title.split(' ')[0], W - pad * 2, (landscape ? 180 : 230) * u, 900, 'Unbounded', 90 * u);
      ctx.save(); ctx.globalAlpha = .22; ctx.fillStyle = sty.ink; ctx.font = `900 ${big}px Unbounded`; ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
      const words = st.title.split(' ');
      words.slice(0, landscape ? 1 : 2).forEach((w, i) => ctx.fillText(w.toUpperCase(), W / 2, H * (landscape ? .5 : .32 + i * .18) + drift * .3));
      ctx.restore();
      const area = landscape ? { x: W * .3, y: pad, w: W * .4, h: H - pad * 2 } : { x: W * .12, y: H * .18, w: W * .76, h: H * .5 };
      drawProduct(ctx, st, sty, area, r, u, t, false);
      const tb = drawTitle(ctx, st, sty, W / 2, H - pad - (landscape ? 90 : 160) * u, W - pad * 2, (landscape ? 56 : 68) * u, u, t, { align: 'center', highlight: r() > .5 });
      drawPrice(ctx, st, sty, W - pad, landscape ? pad + 110 * u : pad + 110 * u, u, t, W * .5, 'right');
      drawBadge(ctx, st.badge, pad + 100 * u, pad + 90 * u, sty, u, t, -.2, true);
    } else if (layoutId === 'split') { // цветная половина + товар навылет
      const vert = !landscape;
      ctx.save(); ctx.fillStyle = (!isLight(sty.paper) && !isLight(sty.bg[0])) ? sty.paper : sty.paper; ctx.globalAlpha = .96;
      if (vert) { ctx.beginPath(); ctx.moveTo(0, H * .55); ctx.quadraticCurveTo(W * .5, H * .45, W, H * .58); ctx.lineTo(W, H); ctx.lineTo(0, H); ctx.fill(); }
      else { ctx.beginPath(); ctx.moveTo(0, 0); ctx.lineTo(W * .52, 0); ctx.quadraticCurveTo(W * .45, H * .5, W * .55, H); ctx.lineTo(0, H); ctx.fill(); }
      ctx.restore();
      const area = vert ? { x: W * .1, y: H * .06, w: W * .8, h: H * .5 } : { x: W * .55, y: H * .08, w: W * .4, h: H * .84 };
      drawProduct(ctx, st, sty, area, r, u, t, false);
      const inkSaved = sty.ink; const sty2 = { ...sty, ink: onPaper(sty), paper: isLight(sty.paper) ? sty.accent : sty.shape };
      if (vert) { drawTitle(ctx, st, sty2, pad, H * .66 + 30 * u, W - pad * 2, 84 * u, u, t); const sty3 = { ...sty2, paper: isLight(sty.paper) ? sty.accent : sty.shape }; ctx.save(); drawPrice(ctx, st, { ...sty3, ink: sty3.ink }, pad, H - pad, u, t, W * .55); ctx.restore(); }
      else { drawTitle(ctx, st, sty2, pad, H * .35, W * .45, 64 * u, u, t); drawPrice(ctx, st, sty2, pad, H - pad, u, t, W * .4); }
      drawBadge(ctx, st.badge, vert ? W - pad - 100 * u : W - pad - 100 * u, pad + 50 * u, sty, u, t, .1);
    } else if (layoutId === 'editorial') { // рамка, тонкие линии, журнальная типографика
      ctx.save(); ctx.strokeStyle = sty.ink; ctx.lineWidth = 3 * u; ctx.globalAlpha = .9; ctx.strokeRect(pad * .6, pad * .6, W - pad * 1.2, H - pad * 1.2); ctx.restore();
      ctx.save(); ctx.fillStyle = sty.ink; ctx.font = `700 ${18 * u}px Manrope`; ctx.globalAlpha = .7; ctx.letterSpacing = `${4 * u}px`;
      ctx.fillText('KADR  •  ' + (st.format.name || '').toUpperCase() + '  •  №' + String(st.seed).padStart(3, '0'), pad, pad + 6 * u); ctx.restore();
      ctx.save(); ctx.strokeStyle = sty.ink; ctx.globalAlpha = .5; ctx.lineWidth = 1.5 * u; ctx.beginPath(); ctx.moveTo(pad, pad + 24 * u); ctx.lineTo(W - pad, pad + 24 * u); ctx.stroke(); ctx.restore();
      const area = landscape ? { x: W * .5, y: pad * 1.4, w: W * .5 - pad * 1.4, h: H - pad * 2.8 } : { x: pad * 1.2, y: pad * 1.6, w: W - pad * 2.4, h: H * .5 };
      drawProduct(ctx, st, sty, area, r, u, t, true);
      const ty = landscape ? H * .4 : H * .5 + pad * 2.4;
      drawTitle(ctx, st, sty, pad, ty, landscape ? W * .45 : W - pad * 2, (landscape ? 60 : 78) * u, u, t, { outline: r() > .6 });
      drawPrice(ctx, st, sty, W - pad, H - pad, u, t, W * .45, 'right');
      drawBadge(ctx, st.badge, pad + 90 * u, H - pad - 50 * u, sty, u, t, 0);
    } else { // sticker: товар по центру, стикеры по кругу
      const area = landscape ? { x: W * .52, y: pad * 1.5, w: W * .4, h: H - pad * 3 } : { x: W * .1, y: H * .22, w: W * .8, h: H * .5 };
      drawProduct(ctx, st, sty, area, r, u, t, true);
      if (landscape) drawTitle(ctx, st, sty, pad, H * .42, W * .42, 56 * u, u, t, { highlight: true });
      else drawTitle(ctx, st, sty, W / 2, pad + 80 * u, W - pad * 2, 80 * u, u, t, { align: 'center', highlight: true });
      const stickers = [st.badge, 'ХИТ', 'ДОСТАВКА ЗАВТРА', st.price].filter(Boolean);
      const cx = area.x + area.w / 2, cy = area.y + area.h / 2, R = Math.min(area.w, area.h) * .52;
      stickers.forEach((s, i) => { const a = -Math.PI * .75 + i * (Math.PI * 2 / stickers.length) + r() * .3; drawBadge(ctx, s, cx + Math.cos(a) * R, cy + Math.sin(a) * R * (landscape ? .9 : 1.05), sty, u, t, (r() - .5) * .5, i === 0); });
    }

    // подпись бренда + зерно
    ctx.save(); ctx.globalAlpha = .55; ctx.fillStyle = sty.ink; ctx.font = `700 ${18 * u}px Manrope`; ctx.textAlign = 'right'; ctx.textBaseline = 'alphabetic'; ctx.fillText('kadr.app', W - pad * .6 - 8 * u, H - pad * .6 - 8 * u); ctx.restore();
    ctx.save(); ctx.globalAlpha = .05; ctx.fillStyle = sty.ink; const gr = rng(st.seed); for (let i = 0; i < 1400; i++) ctx.fillRect(gr() * W, gr() * H, 2 * u, 2 * u); ctx.restore();
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
  chips($('#layouts'), LAYOUTS, 'layout');

  ['title', 'hook', 'price', 'badge'].forEach(k => $('#' + k).addEventListener('input', e => { state[k] = e.target.value; draw(); }));
  $('#regen').onclick = () => { state.seed++; draw(); };

  // фото: убираем однородный светлый фон (поиск от углов)
  function cutout(img) {
    const c = document.createElement('canvas'), w = c.width = Math.min(img.width, 1400), h = c.height = Math.round(img.height * w / img.width), x = c.getContext('2d');
    x.drawImage(img, 0, 0, w, h); const d = x.getImageData(0, 0, w, h), p = d.data;
    const corner = (i) => [p[i], p[i + 1], p[i + 2]]; const refs = [corner(0), corner((w - 1) * 4), corner((h - 1) * w * 4), corner(((h - 1) * w + w - 1) * 4)];
    const near = (i, ref) => Math.abs(p[i] - ref[0]) + Math.abs(p[i + 1] - ref[1]) + Math.abs(p[i + 2] - ref[2]) < 60;
    const seen = new Uint8Array(w * h), stack = [0, w - 1, (h - 1) * w, h * w - 1];
    while (stack.length) { const k = stack.pop(); if (seen[k]) continue; seen[k] = 1; const i = k * 4; if (!refs.some(rf => near(i, rf))) continue; p[i + 3] = 0; const xx = k % w, yy = (k / w) | 0; if (xx > 0) stack.push(k - 1); if (xx < w - 1) stack.push(k + 1); if (yy > 0) stack.push(k - w); if (yy < h - 1) stack.push(k + w); }
    x.putImageData(d, 0, 0); return c;
  }
  const drop = $('#drop'), file = $('#file');
  function loadFile(f) {
    if (!f || !f.type.startsWith('image/')) return;
    const img = new Image(); img.onload = () => { state.img = cutout(img); $('#drop-text').textContent = `Фото: ${f.name}. Нажмите, чтобы заменить`; draw(); };
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
    { title: 'Смартфон Vega X', hook: '200 Мп и два дня без зарядки', price: '39 990 ₽', badge: '−10%', style: 'mono' },
    { title: 'Футболка Oversize', hook: 'Хлопок 240 г/м²', price: '1 490 ₽', badge: '2=3', style: 'candy' },
    { title: 'Кресло Loft', hook: 'Собирается за 5 минут', price: '12 900 ₽', badge: 'SALE', style: 'terra' },
    { title: 'Парфюм Nuit', hook: 'Стойкость 12 часов', price: '5 600 ₽', badge: 'NEW', style: 'sunset' },
  ];
  function presetState(p, seed, fmt = FORMATS[0]) { return { ...p, style: STYLES.find(s => s.id === p.style), layout: LAYOUTS[0], format: fmt, seed, img: null }; }

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
