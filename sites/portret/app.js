/* Портрет — иллюстрированные демо-портреты, пиксельные фильтры, сравнение до/после. Всё в браузере. */
(() => {
  const $ = (s, r = document) => r.querySelector(s);
  const revealAll = () => { const h = innerHeight; document.querySelectorAll('.reveal:not(.in)').forEach(el => { if (el.getBoundingClientRect().top < h * .92) el.classList.add('in'); }); };
  addEventListener('scroll', revealAll, { passive: true }); addEventListener('resize', revealAll); revealAll(); setTimeout(revealAll, 400);
  function rng(seed) { let s = (seed * 9301 + 49297) % 2147483647; return () => { s = (s * 16807) % 2147483647; return (s % 10000) / 10000; }; }
  const clamp = (v, a, b) => Math.max(a, Math.min(b, v));

  // ---------- иллюстрированный портрет ----------
  const SKIN = ['#f3d5c0', '#e8bfa0', '#d9a07c', '#b97a56', '#8d5a3c', '#5c3a26'];
  const HAIR = ['#1d1612', '#3b2a1e', '#6b4a2b', '#b5803d', '#d9c3a3', '#8c2f2f', '#2b2b30'];
  const SHIRT = ['#2b3a55', '#1b1917', '#7a2e2e', '#3f6b4e', '#c9b27c', '#f4f1ec', '#4a5a7a'];
  const BG = [['#e9e2d8', '#cfc4b4'], ['#d9e2e8', '#b3c2cc'], ['#efe4d8', '#d6c1ad'], ['#e2e8dd', '#bfcab8'], ['#ebe3ea', '#cbbccb']];
  function portrait(c, seed) {
    const W = c.width, H = c.height, x = c.getContext('2d'), r = rng(seed), u = W / 600;
    const skin = SKIN[Math.floor(r() * SKIN.length)], hair = HAIR[Math.floor(r() * HAIR.length)], shirt = SHIRT[Math.floor(r() * SHIRT.length)], bg = BG[Math.floor(r() * BG.length)];
    const style = Math.floor(r() * 4), glasses = r() > .7, beard = r() > .75, smile = .5 + r() * .6;
    const g = x.createRadialGradient(W * .4, H * .3, W * .1, W * .5, H * .5, W * .9); g.addColorStop(0, bg[0]); g.addColorStop(1, bg[1]); x.fillStyle = g; x.fillRect(0, 0, W, H);
    const cx = W * .5, hy = H * .42, hw = W * .19, hh = H * .17;
    x.save(); x.globalAlpha = .18; x.fillStyle = '#000'; x.filter = `blur(${30 * u}px)`; x.beginPath(); x.ellipse(cx + W * .05, H * .9, W * .32, H * .12, 0, 0, Math.PI * 2); x.fill(); x.restore();
    // волосы сзади
    x.fillStyle = hair;
    if (style === 1) { x.beginPath(); x.roundRect(cx - hw * 1.25, hy - hh * .9, hw * 2.5, hh * 2.9, hw * .5); x.fill(); }
    if (style === 3) { for (let i = 0; i < 26; i++) { const a = r() * Math.PI * 2, d = hw * (1.05 + r() * .25); x.beginPath(); x.arc(cx + Math.cos(a) * d, hy - hh * .2 + Math.sin(a) * d * .9, hw * .28, 0, Math.PI * 2); x.fill(); } }
    // плечи и шея
    x.fillStyle = shirt; x.beginPath(); x.moveTo(cx - W * .42, H * 1.05); x.quadraticCurveTo(cx - W * .4, H * .72, cx - W * .18, H * .68); x.lineTo(cx + W * .18, H * .68); x.quadraticCurveTo(cx + W * .4, H * .72, cx + W * .42, H * 1.05); x.closePath(); x.fill();
    x.fillStyle = '#000'; x.globalAlpha = .12; x.beginPath(); x.moveTo(cx - W * .18, H * .68); x.lineTo(cx + W * .18, H * .68); x.lineTo(cx, H * .8); x.closePath(); x.fill(); x.globalAlpha = 1;
    x.fillStyle = skin; x.beginPath(); x.roundRect(cx - hw * .42, hy + hh * .6, hw * .84, hh * 1.2, hw * .2); x.fill();
    x.fillStyle = 'rgba(0,0,0,.14)'; x.beginPath(); x.roundRect(cx - hw * .42, hy + hh * .6, hw * .84, hh * .5, hw * .2); x.fill();
    // голова
    x.fillStyle = skin; x.beginPath(); x.ellipse(cx - hw * .95, hy + hh * .1, hw * .14, hh * .18, 0, 0, Math.PI * 2); x.ellipse(cx + hw * .95, hy + hh * .1, hw * .14, hh * .18, 0, 0, Math.PI * 2); x.fill();
    x.beginPath(); x.moveTo(cx - hw, hy - hh * .2); x.bezierCurveTo(cx - hw, hy - hh * 1.35, cx + hw, hy - hh * 1.35, cx + hw, hy - hh * .2); x.bezierCurveTo(cx + hw * 1.02, hy + hh * .5, cx + hw * .55, hy + hh * 1.08, cx, hy + hh * 1.1); x.bezierCurveTo(cx - hw * .55, hy + hh * 1.08, cx - hw * 1.02, hy + hh * .5, cx - hw, hy - hh * .2); x.closePath(); x.fill();
    const sh = x.createLinearGradient(cx - hw, 0, cx + hw, 0); sh.addColorStop(0, 'rgba(0,0,0,0)'); sh.addColorStop(.7, 'rgba(0,0,0,0)'); sh.addColorStop(1, 'rgba(0,0,0,.18)'); x.fillStyle = sh; x.fill();
    const hl = x.createLinearGradient(cx - hw, 0, cx, 0); hl.addColorStop(0, 'rgba(255,255,255,.22)'); hl.addColorStop(1, 'rgba(255,255,255,0)'); x.fillStyle = hl; x.fill();
    if (beard) { x.fillStyle = hair; x.globalAlpha = .75; x.beginPath(); x.moveTo(cx - hw * .95, hy + hh * .2); x.bezierCurveTo(cx - hw * .9, hy + hh * 1.1, cx + hw * .9, hy + hh * 1.1, cx + hw * .95, hy + hh * .2); x.bezierCurveTo(cx + hw * .7, hy + hh * .55, cx - hw * .7, hy + hh * .55, cx - hw * .95, hy + hh * .2); x.fill(); x.globalAlpha = 1; }
    // глаза
    const ey = hy - hh * .12, ex = hw * .42;
    [-1, 1].forEach(s => { x.fillStyle = '#fff'; x.beginPath(); x.ellipse(cx + s * ex, ey, hw * .19, hh * .1, 0, 0, Math.PI * 2); x.fill(); x.fillStyle = ['#3b2a1e', '#2d5a3f', '#2f4a7a', '#6b4a2b'][Math.floor(r() * 4)]; x.beginPath(); x.arc(cx + s * ex + hw * .02, ey, hw * .085, 0, Math.PI * 2); x.fill(); x.fillStyle = '#111'; x.beginPath(); x.arc(cx + s * ex + hw * .02, ey, hw * .04, 0, Math.PI * 2); x.fill(); x.fillStyle = '#fff'; x.beginPath(); x.arc(cx + s * ex + hw * .055, ey - hh * .035, hw * .025, 0, Math.PI * 2); x.fill();
      x.strokeStyle = hair; x.lineWidth = hh * .06; x.lineCap = 'round'; x.beginPath(); x.moveTo(cx + s * (ex - hw * .22), ey - hh * .3); x.quadraticCurveTo(cx + s * ex, ey - hh * .42, cx + s * (ex + hw * .22), ey - hh * .28); x.stroke(); });
    x.strokeStyle = 'rgba(0,0,0,.25)'; x.lineWidth = hh * .035; x.beginPath(); x.moveTo(cx + hw * .04, hy + hh * .05); x.quadraticCurveTo(cx + hw * .12, hy + hh * .38, cx - hw * .02, hy + hh * .4); x.stroke();
    x.strokeStyle = '#a0463f'; x.lineWidth = hh * .07; x.beginPath(); x.moveTo(cx - hw * .3, hy + hh * .66); x.quadraticCurveTo(cx, hy + hh * (.66 + smile * .3), cx + hw * .3, hy + hh * .66); x.stroke();
    x.fillStyle = 'rgba(220,100,90,.18)'; [-1, 1].forEach(s => { x.beginPath(); x.ellipse(cx + s * hw * .62, hy + hh * .4, hw * .2, hh * .1, 0, 0, Math.PI * 2); x.fill(); });
    if (glasses) { x.strokeStyle = '#1b1917'; x.lineWidth = hh * .045; [-1, 1].forEach(s => { x.beginPath(); x.roundRect(cx + s * ex - hw * .27, ey - hh * .17, hw * .54, hh * .34, hw * .1); x.stroke(); }); x.beginPath(); x.moveTo(cx - hw * .15, ey - hh * .02); x.lineTo(cx + hw * .15, ey - hh * .02); x.stroke(); }
    // волосы спереди
    x.fillStyle = hair;
    if (style === 0) { x.beginPath(); x.moveTo(cx - hw * 1.02, hy - hh * .25); x.bezierCurveTo(cx - hw * 1.05, hy - hh * 1.45, cx + hw * 1.05, hy - hh * 1.45, cx + hw * 1.02, hy - hh * .25); x.bezierCurveTo(cx + hw * .8, hy - hh * .7, cx + hw * .2, hy - hh * .95, cx - hw * .3, hy - hh * .75); x.bezierCurveTo(cx - hw * .7, hy - hh * .6, cx - hw * .95, hy - hh * .4, cx - hw * 1.02, hy - hh * .25); x.fill(); }
    else if (style === 1) { x.beginPath(); x.moveTo(cx - hw * 1.08, hy); x.bezierCurveTo(cx - hw * 1.1, hy - hh * 1.5, cx + hw * 1.1, hy - hh * 1.5, cx + hw * 1.08, hy); x.lineTo(cx + hw * .95, hy - hh * .3); x.bezierCurveTo(cx + hw * .6, hy - hh * .75, cx - hw * .2, hy - hh * 1.05, cx - hw * .95, hy - hh * .3); x.closePath(); x.fill(); }
    else if (style === 2) { x.beginPath(); x.moveTo(cx - hw * 1.02, hy - hh * .3); x.bezierCurveTo(cx - hw * 1.05, hy - hh * 1.4, cx + hw * 1.05, hy - hh * 1.4, cx + hw * 1.02, hy - hh * .3); x.bezierCurveTo(cx + hw * .9, hy - hh * .9, cx - hw * .9, hy - hh * .9, cx - hw * 1.02, hy - hh * .3); x.fill(); x.beginPath(); x.arc(cx, hy - hh * 1.3, hw * .42, 0, Math.PI * 2); x.fill(); }
    else { for (let i = 0; i < 30; i++) { const a = Math.PI + r() * Math.PI, d = hw * (.85 + r() * .25); x.beginPath(); x.arc(cx + Math.cos(a) * d, hy - hh * .25 + Math.sin(a) * hh * 1.05 * .9, hw * .27, 0, Math.PI * 2); x.fill(); } }
    return c;
  }

  // ---------- фильтры ----------
  const STYLES = [
    { id: 'studio', name: 'Студия', note: 'мягкий свет', sw: '#e9d8c3', p: { bright: 10, contrast: 1.08, sat: 1.05, warm: 8, vignette: .35, soft: .25 } },
    { id: 'bw', name: 'Ч/Б классика', note: 'плёночное зерно', sw: '#8a8a8a', p: { gray: 1, contrast: 1.28, bright: 4, grain: 16, vignette: .45 } },
    { id: 'cinema', name: 'Кино', note: 'teal & orange', sw: '#2a7f86', p: { contrast: 1.14, sat: .9, split: [[20, 70, 95], [255, 170, 90], .28], vignette: .45 } },
    { id: 'film', name: 'Плёнка', note: 'выцветшие тени', sw: '#c9a67a', p: { lift: 26, warm: 12, sat: .85, contrast: .96, grain: 12, vignette: .2 } },
    { id: 'linkedin', name: 'Деловой', note: 'чисто и ярко', sw: '#4a8ad4', p: { bright: 14, contrast: 1.05, sat: 1.08, warm: -5, soft: .2 } },
    { id: 'mag', name: 'Журнал', note: 'жёсткий контраст', sw: '#333', p: { contrast: 1.4, sat: .65, bright: -4, vignette: .65 } },
    { id: 'neon', name: 'Неон', note: 'дуотон', sw: '#8b5cf6', p: { duotone: [[28, 8, 72], [120, 240, 255]], contrast: 1.1 } },
    { id: 'paint', name: 'Акварель', note: 'постеризация', sw: '#d98a6a', p: { posterize: 6, soft: .6, sat: 1.25, bright: 6 } },
  ];
  function applyStyle(src, p) {
    const W = src.width, H = src.height, c = document.createElement('canvas'); c.width = W; c.height = H; const x = c.getContext('2d'); x.drawImage(src, 0, 0);
    if (p.soft) { const t = document.createElement('canvas'); t.width = Math.max(1, W >> 2); t.height = Math.max(1, H >> 2); const tx = t.getContext('2d'); tx.drawImage(src, 0, 0, t.width, t.height); x.save(); x.globalAlpha = p.soft; x.imageSmoothingQuality = 'high'; x.drawImage(t, 0, 0, W, H); x.restore(); }
    const img = x.getImageData(0, 0, W, H), d = img.data, ct = p.contrast || 1, lift = p.lift || 0, br = p.bright || 0, sat = p.sat ?? 1, warm = p.warm || 0, grain = p.grain || 0, post = p.posterize ? 255 / (p.posterize - 1) : 0;
    let seed = 12345; const rnd = () => (seed = (seed * 16807) % 2147483647) / 2147483647;
    for (let i = 0; i < d.length; i += 4) {
      let r = d[i], g = d[i + 1], b = d[i + 2];
      if (lift) { r = lift + r * (255 - lift) / 255; g = lift + g * (255 - lift) / 255; b = lift + b * (255 - lift) / 255; }
      r += br; g += br; b += br; r = (r - 128) * ct + 128; g = (g - 128) * ct + 128; b = (b - 128) * ct + 128;
      let l = .299 * r + .587 * g + .114 * b;
      if (sat !== 1) { r = l + (r - l) * sat; g = l + (g - l) * sat; b = l + (b - l) * sat; }
      if (warm) { r += warm; b -= warm; }
      if (p.gray) { r = g = b = l; }
      if (p.split) { const ln = clamp(l / 255, 0, 1), [sh, hi, amt] = p.split, tint = ln < .5 ? sh : hi, a = amt * (ln < .5 ? 1 - ln * 2 : (ln - .5) * 2); r += (tint[0] - r) * a; g += (tint[1] - g) * a; b += (tint[2] - b) * a; }
      if (p.duotone) { const ln = clamp(l / 255, 0, 1), [dk, lt] = p.duotone; r = dk[0] + (lt[0] - dk[0]) * ln; g = dk[1] + (lt[1] - dk[1]) * ln; b = dk[2] + (lt[2] - dk[2]) * ln; }
      if (post) { r = Math.round(r / post) * post; g = Math.round(g / post) * post; b = Math.round(b / post) * post; }
      if (grain) { const n = (rnd() - .5) * grain * 2; r += n; g += n; b += n; }
      d[i] = clamp(r, 0, 255); d[i + 1] = clamp(g, 0, 255); d[i + 2] = clamp(b, 0, 255);
    }
    x.putImageData(img, 0, 0);
    if (p.vignette) { const v = x.createRadialGradient(W / 2, H * .45, Math.min(W, H) * .35, W / 2, H / 2, Math.max(W, H) * .8); v.addColorStop(0, 'rgba(0,0,0,0)'); v.addColorStop(1, `rgba(0,0,0,${p.vignette})`); x.fillStyle = v; x.fillRect(0, 0, W, H); }
    return c;
  }

  // ---------- hero и галерея стилей ----------
  const demo = seed => portrait(Object.assign(document.createElement('canvas'), { width: 600, height: 750 }), seed);
  const heroSrc = demo(3);
  [['studio', '.p1'], ['cinema', '.p2'], ['bw', '.p3']].forEach(([id, sel]) => { const c = $(sel + ' canvas'); c.getContext('2d').drawImage(applyStyle(heroSrc, STYLES.find(s => s.id === id).p), 0, 0, c.width, c.height); });
  STYLES.forEach((s, i) => { const card = document.createElement('div'); card.className = 'style-card reveal'; const c = document.createElement('canvas'); c.width = 360; c.height = 450; c.getContext('2d').drawImage(applyStyle(demo(11 + i * 3), s.p), 0, 0, 360, 450); card.appendChild(c); card.insertAdjacentHTML('beforeend', `<b>${s.name}</b><span>${s.note}</span>`); $('#styles-grid').appendChild(card); });
  revealAll();

  // ---------- студия ----------
  let source = demo(3), current = STYLES[0];
  const before = $('#before'), after = $('#after');
  function setSource(c) { source = c; before.width = after.width = c.width; before.height = after.height = c.height; before.getContext('2d').drawImage(c, 0, 0); renderGrid(); select(current); }
  function select(s) { current = s; after.getContext('2d').drawImage(applyStyle(source, s.p), 0, 0); $('#after-tag').textContent = s.name; document.querySelectorAll('#style-list button, #grid button').forEach(b => b.setAttribute('aria-pressed', String(b.dataset.id === s.id))); }
  function renderGrid() {
    const g = $('#grid'); g.innerHTML = ''; const small = document.createElement('canvas'); small.width = 240; small.height = 300; small.getContext('2d').drawImage(source, 0, 0, 240, 300);
    STYLES.forEach(s => { const b = document.createElement('button'); b.dataset.id = s.id; const c = document.createElement('canvas'); c.width = 240; c.height = 300; c.getContext('2d').drawImage(applyStyle(small, s.p), 0, 0); b.appendChild(c); b.insertAdjacentHTML('beforeend', `<span>${s.name}</span>`); b.onclick = () => select(s); g.appendChild(b); });
  }
  STYLES.forEach(s => { const b = document.createElement('button'); b.dataset.id = s.id; b.innerHTML = `<i style="background:${s.sw}"></i>${s.name}<span>${s.note}</span>`; b.onclick = () => select(s); $('#style-list').appendChild(b); });
  [3, 8, 21, 34].forEach((seed, i) => { const b = document.createElement('button'); b.setAttribute('aria-pressed', String(i === 0)); const c = document.createElement('canvas'); c.width = 120; c.height = 150; c.getContext('2d').drawImage(demo(seed), 0, 0, 120, 150); b.appendChild(c); b.onclick = () => { document.querySelectorAll('#demos button').forEach(x => x.setAttribute('aria-pressed', 'false')); b.setAttribute('aria-pressed', 'true'); setSource(demo(seed)); }; $('#demos').appendChild(b); });
  setSource(source);

  // загрузка
  const drop = $('#drop'), file = $('#file');
  function loadFile(f) { if (!f || !f.type.startsWith('image/')) return; const img = new Image(); img.onload = () => { const W = 720, H = 900, c = document.createElement('canvas'); c.width = W; c.height = H; const s = Math.max(W / img.width, H / img.height); c.getContext('2d').drawImage(img, (W - img.width * s) / 2, (H - img.height * s) / 2, img.width * s, img.height * s); document.querySelectorAll('#demos button').forEach(x => x.setAttribute('aria-pressed', 'false')); setSource(c); URL.revokeObjectURL(img.src); }; img.src = URL.createObjectURL(f); }
  file.onchange = () => loadFile(file.files[0]);
  ['dragenter', 'dragover'].forEach(ev => drop.addEventListener(ev, e => { e.preventDefault(); drop.classList.add('over'); }));
  ['dragleave', 'drop'].forEach(ev => drop.addEventListener(ev, e => { e.preventDefault(); drop.classList.remove('over'); }));
  drop.addEventListener('drop', e => loadFile(e.dataTransfer.files[0]));

  // слайдер до/после
  const cmp = $('#compare'), split = $('#split');
  const setX = v => { cmp.style.setProperty('--x', v + '%'); split.value = v; };
  split.addEventListener('input', () => setX(split.value));
  let dragging = false;
  cmp.addEventListener('pointerdown', e => { dragging = true; cmp.setPointerCapture(e.pointerId); move(e); });
  cmp.addEventListener('pointermove', e => dragging && move(e)); cmp.addEventListener('pointerup', () => dragging = false);
  function move(e) { const r = cmp.getBoundingClientRect(); setX(clamp((e.clientX - r.left) / r.width * 100, 0, 100).toFixed(1)); }
  setX(55);

  $('#download').onclick = () => { const a = document.createElement('a'); a.download = `portret-${current.id}.png`; a.href = after.toDataURL('image/png'); a.click(); };
})();
