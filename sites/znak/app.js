/* Знак — генератор логотипов: знаки из правил, палитры по сфере, вордмарки, мокапы, экспорт SVG. */
(() => {
  const $ = (s, r = document) => r.querySelector(s);
  const revealAll = () => { const h = innerHeight; document.querySelectorAll('.reveal:not(.in)').forEach(el => { if (el.getBoundingClientRect().top < h * .92) el.classList.add('in'); }); };
  addEventListener('scroll', revealAll, { passive: true }); addEventListener('resize', revealAll); revealAll(); setTimeout(revealAll, 400);
  function rng(seed) { let s = (seed * 9301 + 49297) % 2147483647; return () => { s = (s * 16807) % 2147483647; return (s % 10000) / 10000; }; }
  const pick = (r, arr) => arr[Math.floor(r() * arr.length)];
  const esc = s => s.replace(/[&<>"]/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]));

  // ---------- данные ----------
  const INDUSTRIES = [
    { id: 'tech', name: 'Технологии', pals: [['#2b5cff', '#0a0a0a', '#7fd1ff'], ['#6a3dff', '#111', '#36e3c0'], ['#0a0a0a', '#2b5cff', '#ff2d20']] },
    { id: 'food', name: 'Еда', pals: [['#ff5a1f', '#1d1d1b', '#ffd23f'], ['#2e8b57', '#f4f1e8', '#ff5a1f'], ['#c8102e', '#1d1d1b', '#f7c59f']] },
    { id: 'beauty', name: 'Красота', pals: [['#d9437a', '#2b1a24', '#f4d2c8'], ['#7a3b69', '#f8efe9', '#e8b4a0'], ['#1d1d1b', '#e0a9a0', '#c9a35a']] },
    { id: 'fin', name: 'Финансы', pals: [['#0b2545', '#13315c', '#c9a35a'], ['#0d5c3f', '#0a0a0a', '#8fd19e'], ['#111', '#1e3a8a', '#60a5fa']] },
    { id: 'edu', name: 'Образование', pals: [['#1e40af', '#0a0a0a', '#fbbf24'], ['#ff7a00', '#1d1d1b', '#2b5cff'], ['#15803d', '#0a0a0a', '#facc15']] },
    { id: 'sport', name: 'Спорт', pals: [['#ff2d20', '#0a0a0a', '#c8f04d'], ['#0a0a0a', '#ff5a1f', '#ffffff'], ['#1d4ed8', '#0a0a0a', '#f97316']] },
    { id: 'estate', name: 'Недвижимость', pals: [['#1f2a44', '#8c7b6b', '#d9cdb8'], ['#0a0a0a', '#b08968', '#e6ccb2'], ['#355070', '#6d597a', '#eaac8b']] },
    { id: 'media', name: 'Медиа', pals: [['#0a0a0a', '#ff2d20', '#ffe600'], ['#ff2d20', '#0a0a0a', '#ffffff'], ['#7c3aed', '#0a0a0a', '#f0abfc']] },
  ];
  const VIBES = [
    { id: 'strict', name: 'Строгий', fonts: [['Inter Tight', 800, 'upper', .12], ['JetBrains Mono', 700, 'upper', .16], ['Inter Tight', 600, 'none', -.02]] },
    { id: 'friendly', name: 'Дружелюбный', fonts: [['Comfortaa', 700, 'lower', 0], ['Unbounded', 700, 'lower', -.02], ['Inter Tight', 800, 'none', -.03]] },
    { id: 'premium', name: 'Премиум', fonts: [['Playfair Display', 600, 'none', .02], ['Cormorant Garamond', 600, 'upper', .22, 'italic'], ['Inter Tight', 500, 'upper', .3]] },
    { id: 'bold', name: 'Дерзкий', fonts: [['Unbounded', 900, 'upper', -.04], ['Inter Tight', 900, 'upper', -.06], ['JetBrains Mono', 700, 'lower', 0]] },
  ];
  const state = { name: 'Vektor', industry: INDUSTRIES[0], vibe: VIBES[0], seed: 1, logos: [], active: null };

  // ---------- знаки (viewBox 0 0 100 100) ----------
  const fontCss = f => `font-family:'${f[0]}',sans-serif;font-weight:${f[1]};${f[4] ? 'font-style:italic;' : ''}`;
  const MARKS = {
    mono(r, c, L, f) { const shape = pick(r, ['circle', 'square', 'rsquare', 'hex']); const sh = shape === 'circle' ? `<circle cx="50" cy="50" r="48" fill="${c.a}"/>` : shape === 'square' ? `<rect width="100" height="100" fill="${c.a}"/>` : shape === 'rsquare' ? `<rect width="100" height="100" rx="24" fill="${c.a}"/>` : `<polygon points="50,2 94,26 94,74 50,98 6,74 6,26" fill="${c.a}"/>`; return sh + `<text x="50" y="52" text-anchor="middle" dominant-baseline="central" font-size="56" fill="${c.on}" style="${fontCss(f)}">${esc(L)}</text>`; },
    grid(r, c, L) { const n = pick(r, [3, 4]), s = 100 / n, cells = []; for (let y = 0; y < n; y++) for (let x = 0; x < Math.ceil(n / 2); x++) { if (r() < .55) { cells.push([x, y]); if (x !== n - 1 - x) cells.push([n - 1 - x, y]); } } if (!cells.length) cells.push([0, 0], [n - 1, n - 1]); const round = r() > .5; return cells.map(([x, y], i) => round && (x + y) % 2 ? `<circle cx="${x * s + s / 2}" cy="${y * s + s / 2}" r="${s / 2 - 1}" fill="${i % 5 === 0 ? c.b : c.a}"/>` : `<rect x="${x * s + 1}" y="${y * s + 1}" width="${s - 2}" height="${s - 2}" fill="${i % 5 === 0 ? c.b : c.a}"/>`).join(''); },
    arcs(r, c) { const n = 3, out = []; for (let i = 0; i < n; i++) { const rad = 16 + i * 14, start = r() * 360, len = 120 + r() * 160, a0 = start * Math.PI / 180, a1 = (start + len) * Math.PI / 180; out.push(`<path d="M${50 + rad * Math.cos(a0)},${50 + rad * Math.sin(a0)} A${rad},${rad} 0 ${len > 180 ? 1 : 0} 1 ${50 + rad * Math.cos(a1)},${50 + rad * Math.sin(a1)}" fill="none" stroke="${i === 1 ? c.b : c.a}" stroke-width="9" stroke-linecap="round"/>`); } out.push(`<circle cx="50" cy="50" r="6" fill="${c.a}"/>`); return out.join(''); },
    cut(r, c, L, f) { const ang = pick(r, [-30, 30, 45, -45]), gap = 6 + r() * 6; return `<text x="50" y="52" text-anchor="middle" dominant-baseline="central" font-size="96" fill="${c.a}" style="${fontCss(f)}">${esc(L)}</text><rect x="-30" y="${50 - gap / 2}" width="160" height="${gap}" fill="${c.bg}" transform="rotate(${ang} 50 50)"/>`; },
    bars(r, c) { const n = pick(r, [3, 4, 5]), w = 100 / (n * 2 - 1), tilt = r() > .5 ? -18 : 0, out = []; for (let i = 0; i < n; i++) { const h = 30 + r() * 70; out.push(`<rect x="${i * w * 2}" y="${100 - h}" width="${w}" height="${h}" rx="${w / 3}" fill="${i === n - 1 ? c.b : c.a}"/>`); } return `<g transform="skewX(${tilt}) translate(${tilt ? 12 : 0} 0)">${out.join('')}</g>`; },
    lens(r, c) { const rot = r() * 90 - 45; return `<g transform="rotate(${rot} 50 50)"><circle cx="38" cy="50" r="30" fill="${c.a}"/><circle cx="62" cy="50" r="30" fill="${c.b}"/><path d="M50,22.5 A30,30 0 0 1 50,77.5 A30,30 0 0 1 50,22.5Z" fill="${c.on}"/></g>`; },
    dots(r, c) { const rows = pick(r, [3, 4]), out = [], sp = 100 / (rows + .5); for (let y = 0; y < rows; y++) for (let x = 0; x <= y; x++) { const cx = 50 + (x - y / 2) * sp, cy = sp * .7 + y * sp; out.push(`<circle cx="${cx}" cy="${cy}" r="${sp * .32}" fill="${y === 0 ? c.b : c.a}"/>`); } return out.join(''); },
    crop(r, c, L, f) { const dx = pick(r, [-10, 0, 14]), dy = pick(r, [8, 22]); return `<clipPath id="cp${Math.floor(r() * 1e6)}"><rect width="100" height="100" rx="18"/></clipPath><g clip-path="url(#${'cp'})"></g><rect width="100" height="100" rx="18" fill="${c.a}"/><text x="${56 + dx}" y="${58 + dy}" text-anchor="middle" dominant-baseline="central" font-size="150" fill="${c.on}" style="${fontCss(f)}" clip-path="inset(0 round 18)">${esc(L)}</text>`; },
    ring(r, c) { const gap = 40 + r() * 80, rot = r() * 360; return `<circle cx="50" cy="50" r="38" fill="none" stroke="${c.a}" stroke-width="16" stroke-dasharray="${(360 - gap) * .663} ${gap * .663}" transform="rotate(${rot} 50 50)" stroke-linecap="${r() > .5 ? 'round' : 'butt'}"/><circle cx="${50 + 38 * Math.cos((rot - gap / 2 + 180) * Math.PI / 180)}" cy="${50 + 38 * Math.sin((rot - gap / 2 + 180) * Math.PI / 180)}" r="9" fill="${c.b}"/>`; },
  };
  // crop без clipPath-костылей: обрезка через вложенный svg
  MARKS.crop = (r, c, L, f) => { const dx = pick(r, [-12, 0, 14]), dy = pick(r, [10, 24]); return `<rect width="100" height="100" rx="18" fill="${c.a}"/><svg x="0" y="0" width="100" height="100" viewBox="0 0 100 100" style="overflow:hidden"><text x="${56 + dx}" y="${56 + dy}" text-anchor="middle" dominant-baseline="central" font-size="150" fill="${c.on}" style="${fontCss(f)}">${esc(L)}</text></svg>`; };

  function makeLogo(i, seed) {
    const r = rng(seed * 97 + i * 13), pal = pick(r, state.industry.pals), f = pick(r, state.vibe.fonts), kind = Object.keys(MARKS)[i % Object.keys(MARKS).length];
    const theme = pick(r, ['light', 'light', 'dark', 'color']);
    const c = theme === 'light' ? { bg: '#ffffff', a: pal[0], b: pal[2] } : theme === 'dark' ? { bg: pal[1], a: pal[2], b: pal[0] } : { bg: pal[0], a: '#ffffff', b: pal[2] };
    fixContrast(c, pal); if (kind === 'cut') c.on = c.bg;
    const L = state.name.trim().slice(0, 1).toUpperCase() || 'A';
    const word = f[2] === 'upper' ? state.name.toUpperCase() : f[2] === 'lower' ? state.name.toLowerCase() : state.name;
    return { kind, c, f, word, stack: r() > .6, mark: MARKS[kind](r, c, L, f), ls: f[3], seed: seed * 97 + i * 13, pal };
  }
  const svgEl = (lg, extra = '') => `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100" ${extra}>${lg.mark}</svg>`;
  const wordEl = (lg, size = '1em') => `<span class="word" style="${fontCss(lg.f)};letter-spacing:${lg.ls}em;color:${lg.c.text};font-size:${size}">${esc(lg.word)}</span>`;

  // ---------- SVG-файл целиком (знак + название) ----------
  function fullSvg(lg) {
    const m = document.createElement('canvas').getContext('2d'); m.font = `${lg.f[4] ? 'italic ' : ''}${lg.f[1]} 40px "${lg.f[0]}"`; const tw = m.measureText(lg.word).width + lg.word.length * lg.ls * 40 + 8;
    const W = lg.stack ? Math.max(100, tw) + 20 : 100 + 24 + tw + 20, H = lg.stack ? 100 + 70 : 120;
    const text = `<text x="${lg.stack ? W / 2 : 122}" y="${lg.stack ? 150 : 60}" text-anchor="${lg.stack ? 'middle' : 'start'}" dominant-baseline="central" font-size="40" fill="${lg.c.text}" letter-spacing="${lg.ls * 40}" style="${fontCss(lg.f)}">${esc(lg.word)}</text>`;
    return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${W} ${H}" width="${W * 4}" height="${H * 4}"><rect width="${W}" height="${H}" fill="${lg.c.bg}"/><svg x="${lg.stack ? W / 2 - 50 : 10}" y="10" width="100" height="100" viewBox="0 0 100 100">${lg.mark}</svg>${text}</svg>`;
  }
  function download(lg) { const a = document.createElement('a'); a.download = `${state.name.toLowerCase().replace(/\s+/g, '-') || 'logo'}-${lg.kind}.svg`; a.href = URL.createObjectURL(new Blob([fullSvg(lg)], { type: 'image/svg+xml' })); a.click(); }

  // ---------- UI ----------
  function chips(el, items, get, set) { el.innerHTML = ''; items.forEach(it => { const b = document.createElement('button'); b.type = 'button'; b.className = 'chip'; b.textContent = it.name; b.setAttribute('aria-pressed', String(get() === it)); b.onclick = () => { set(it); [...el.children].forEach(x => x.setAttribute('aria-pressed', 'false')); b.setAttribute('aria-pressed', 'true'); generate(); }; el.appendChild(b); }); }
  chips($('#industries'), INDUSTRIES, () => state.industry, v => state.industry = v);
  chips($('#vibes'), VIBES, () => state.vibe, v => state.vibe = v);
  $('#name').addEventListener('input', e => { state.name = e.target.value || 'Знак'; generate(false); });
  $('#generate').onclick = () => generate(true);

  function generate(newSeed = true) {
    if (newSeed) state.seed++;
    state.logos = Array.from({ length: 12 }, (_, i) => makeLogo(i, state.seed));
    const box = $('#logos'); box.innerHTML = '';
    state.logos.forEach((lg, i) => {
      const card = document.createElement('div'); card.className = 'lcard'; card.style.background = lg.c.bg; card.style.animationDelay = `${i * 40}ms`;
      card.innerHTML = `<div class="lg ${lg.stack ? 'stack' : ''}">${svgEl(lg)}${wordEl(lg, lg.stack ? '1.3em' : '1.5em')}</div><button class="dl" type="button">SVG ↓</button>`;
      card.querySelector('.dl').onclick = e => { e.stopPropagation(); download(lg); };
      card.onclick = () => { applyMock(lg, i); $('#mock').scrollIntoView({ behavior: 'smooth' }); };
      box.appendChild(card);
    });
    applyMock(state.logos[0], 0);
  }
  function applyMock(lg, i) {
    state.active = lg; document.querySelectorAll('.lcard').forEach((c, k) => c.classList.toggle('active', k === i));
    $('#mock-title').textContent = `${state.name} в жизни`;
    const bc = $('#bcard'); bc.style.background = lg.c.bg; bc.style.color = lg.c.text; $('#bc-logo').innerHTML = svgEl(lg) + wordEl(lg); $('#bc-site').textContent = `${state.name.toLowerCase().replace(/\s+/g, '')}.ru`;
    $('#bc-name').style.color = lg.c.text; $('#bc-role').style.color = $('#bc-site').style.color = lg.c.text; $('#bc-role').style.opacity = $('#bc-site').style.opacity = .7;
    const icon = $('#app-icon'); icon.style.background = lg.c.bg; icon.innerHTML = svgEl(lg); $('#favicon').innerHTML = svgEl(lg); $('#fav-url').textContent = `${state.name.toLowerCase().replace(/\s+/g, '')}.ru`;
    $('#sign-board').setAttribute('fill', lg.c.bg); $('#sign-logo').innerHTML = svgEl(lg) + wordEl(lg, '28px');
    const av = $('#avatar'); av.style.background = lg.c.bg; av.innerHTML = svgEl(lg); $('#soc-name').textContent = state.name;
    $('#palette').innerHTML = [lg.c.bg, lg.c.a, lg.c.b, lg.c.text].map(c => `<div style="background:${c};color:${isLight(c) ? '#0a0a0a' : '#fff'}">${c}</div>`).join('');
  }
  const lum = h => { const n = parseInt(h.slice(1), 16); return (n >> 16) * .299 + ((n >> 8) & 255) * .587 + (n & 255) * .114; };
  const isLight = h => lum(h) > 150;
  function fixContrast(c, pal) {
    if (Math.abs(lum(c.a) - lum(c.bg)) < 70) c.a = isLight(c.bg) ? [...pal, '#0a0a0a'].sort((x, y) => lum(x) - lum(y))[0] : '#ffffff';
    if (Math.abs(lum(c.b) - lum(c.bg)) < 50) c.b = c.a;
    c.text = isLight(c.bg) ? '#0a0a0a' : '#ffffff'; c.on = isLight(c.a) ? '#0a0a0a' : '#ffffff';
  }

  // ---------- стена знаков в hero ----------
  const wall = $('#wall'); let wi = 0;
  function wallMark(k) { const r = rng(k * 7919), ind = pick(r, INDUSTRIES), pal = pick(r, ind.pals), kind = pick(r, Object.keys(MARKS)), f = pick(r, pick(r, VIBES).fonts), theme = r(); const c = theme < .5 ? { bg: '#ffffff', a: pal[0], b: pal[2] } : theme < .8 ? { bg: pal[1], a: pal[2], b: pal[0] } : { bg: pal[0], a: '#ffffff', b: pal[2] }; fixContrast(c, pal); if (kind === 'cut') c.on = c.bg; return { svg: svgEl({ mark: MARKS[kind](r, c, pick(r, 'ABKMNVZSТЖ'.split('')), f) }), bg: c.bg }; }
  for (let i = 0; i < 9; i++) { const cell = document.createElement('div'); cell.className = 'cell'; const m = wallMark(i); cell.style.background = m.bg; cell.innerHTML = m.svg; wall.appendChild(cell); }
  setInterval(() => { const cell = wall.children[wi % 9]; cell.classList.add('swap'); setTimeout(() => { const m = wallMark(100 + wi); cell.style.background = m.bg; cell.innerHTML = m.svg; cell.classList.remove('swap'); }, 500); wi++; }, 900);

  const fonts = ['800 20px "Inter Tight"', '700 20px "JetBrains Mono"', '700 20px "Unbounded"', '600 20px "Playfair Display"', 'italic 600 20px "Cormorant Garamond"', '700 20px "Comfortaa"'];
  Promise.all(fonts.map(f => document.fonts.load(f))).catch(() => {}).finally(() => generate(false));
})();
