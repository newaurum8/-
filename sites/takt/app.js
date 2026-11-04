/* Такт — процедурные сцены, раскадровка, плеер с движением камеры, экспорт видео. Всё в браузере. */
(() => {
  const $ = (s, r = document) => r.querySelector(s);
  const revealAll = () => { const h = innerHeight; document.querySelectorAll('.reveal:not(.in)').forEach(el => { if (el.getBoundingClientRect().top < h * .92) el.classList.add('in'); }); };
  addEventListener('scroll', revealAll, { passive: true }); addEventListener('resize', revealAll); revealAll(); setTimeout(revealAll, 400);
  const sleep = ms => new Promise(r => setTimeout(r, ms));
  function rng(seed) { let s = (seed * 9301 + 49297) % 2147483647; return () => { s = (s * 16807) % 2147483647; return (s % 10000) / 10000; }; }
  const clamp = (v, a, b) => Math.max(a, Math.min(b, v)), lerp = (a, b, t) => a + (b - a) * t, ease = t => t < .5 ? 2 * t * t : 1 - Math.pow(-2 * t + 2, 2) / 2;
  function hex(h) { const n = parseInt(h.slice(1), 16); return [n >> 16, (n >> 8) & 255, n & 255]; }
  function mix(a, b, t) { const A = hex(a), B = hex(b); return `rgb(${A.map((v, i) => Math.round(lerp(v, B[i], t))).join(',')})`; }
  const rgba = (h, a) => { const [r, g, b] = hex(h); return `rgba(${r},${g},${b},${a})`; };

  // ---------- настроения и форматы ----------
  const MOODS = {
    warm: { name: 'Тёплое', sky: ['#1a0f0a', '#8a3d22', '#f5b041'], light: '#ffd58a', accent: '#f5b041', dark: '#120906' },
    night: { name: 'Ночной город', sky: ['#04050f', '#141b3f', '#3a2b73'], light: '#9ad0ff', accent: '#ff5f9e', dark: '#05060f' },
    nature: { name: 'Природа', sky: ['#0d2a2a', '#2b7a68', '#e6ecd3'], light: '#f6e27a', accent: '#f4d35e', dark: '#0a1f1b' },
    techno: { name: 'Техно', sky: ['#02040a', '#071a2b', '#0c4457'], light: '#5dffe0', accent: '#39ffd4', dark: '#02040a' },
    mono: { name: 'Нуар', sky: ['#050505', '#262626', '#9c9c9c'], light: '#ffffff', accent: '#e6e6e6', dark: '#050505' },
  };
  const ASPECTS = [{ id: '916', name: '9:16', w: 1080, h: 1920, cls: '' }, { id: '11', name: '1:1', w: 1080, h: 1080, cls: 'a1' }, { id: '169', name: '16:9', w: 1920, h: 1080, cls: 'a169' }];

  // ---------- художники сцен ----------
  function sky(ctx, W, H, cols, flip = false) { const g = ctx.createLinearGradient(0, flip ? H : 0, 0, flip ? 0 : H); cols.forEach((c, i) => g.addColorStop(i / (cols.length - 1), c)); ctx.fillStyle = g; ctx.fillRect(0, 0, W, H); }
  function glow(ctx, x, y, r, color, a = .6) { const g = ctx.createRadialGradient(x, y, 0, x, y, r); g.addColorStop(0, rgba(color, a)); g.addColorStop(1, rgba(color, 0)); ctx.fillStyle = g; ctx.fillRect(x - r, y - r, r * 2, r * 2); }

  const PAINT = {
    city(ctx, W, H, t, r, m) {
      const u = Math.min(W, H) / 1000; sky(ctx, W, H, [m.sky[0], m.sky[1], m.sky[2]]);
      for (let i = 0; i < 90; i++) { const x = r() * W, y = r() * H * .55, tw = .3 + .7 * Math.abs(Math.sin(t * 7 + i)); ctx.fillStyle = `rgba(255,255,255,${tw * .8})`; ctx.fillRect(x, y, 2 * u, 2 * u); }
      const mx = W * .74, my = H * .2; glow(ctx, mx, my, W * .22, m.light, .35); ctx.fillStyle = m.light; ctx.beginPath(); ctx.arc(mx, my, W * .045, 0, Math.PI * 2); ctx.fill();
      const base = H * .93;
      [[.4, .55], [.65, .75], [1, 1]].forEach(([d, sh], L) => {
        const col = mix(m.sky[1], m.dark, .35 + L * .3), off = -(t - .5) * W * .05 * d; let x = -W * .1 + off;
        while (x < W * 1.1) {
          const w = (50 + r() * 110) * u, h = (H * .14 + r() * H * .38) * sh, y = base - h;
          ctx.fillStyle = col; ctx.fillRect(x, y, w, h);
          if (r() > .6) { ctx.fillRect(x + w * .3, y - h * .08, w * .4, h * .08); }
          const cols = Math.floor(w / (16 * u)), rows = Math.floor(h / (20 * u));
          for (let i = 0; i < cols; i++) for (let j = 0; j < rows; j++) { if (r() < .32) { const k = i * 7 + j * 13, a = .45 + .55 * Math.abs(Math.sin(t * 3 + k)); ctx.fillStyle = rgba(L === 2 && r() > .7 ? m.accent : m.light, a * (.4 + L * .3)); ctx.fillRect(x + 4 * u + i * 16 * u, y + 6 * u + j * 20 * u, 7 * u, 10 * u); } }
          x += w + (6 + r() * 20) * u;
        }
      });
      ctx.fillStyle = m.dark; ctx.fillRect(0, base, W, H - base);
      for (let i = 0; i < 7; i++) { const y = base + (H - base) * (.2 + (i % 3) * .3), sp = .9 + (i % 4) * .25, x = ((t * sp + i * .23) % 1) * W * 1.5 - W * .25, len = W * (.08 + (i % 3) * .04); ctx.strokeStyle = i % 2 ? rgba('#ff4040', .8) : rgba('#fff6d0', .85); ctx.lineWidth = 3 * u; ctx.lineCap = 'round'; ctx.beginPath(); ctx.moveTo(i % 2 ? W - x : x, y); ctx.lineTo((i % 2 ? W - x : x) + len * (i % 2 ? -1 : 1), y); ctx.stroke(); }
    },
    nature(ctx, W, H, t, r, m) {
      const u = Math.min(W, H) / 1000; sky(ctx, W, H, [m.sky[0], m.sky[1], m.sky[2]]);
      const sx = W * .3 + W * .2 * t, sy = H * .56 - H * .2 * t; glow(ctx, sx, sy, W * .45, m.light, .5); ctx.fillStyle = m.light; ctx.beginPath(); ctx.arc(sx, sy, W * .06, 0, Math.PI * 2); ctx.fill();
      for (let L = 0; L < 4; L++) {
        const baseY = H * (.5 + L * .13), amp = H * (.14 - L * .025), ph = r() * 10, f1 = 1.5 + r() * 2, f2 = 4 + r() * 3, off = -(t - .5) * W * .03 * (L + 1);
        ctx.fillStyle = mix(m.sky[2], m.dark, .25 + L * .22); ctx.beginPath(); ctx.moveTo(-W * .1, H);
        for (let x = -W * .1; x <= W * 1.1; x += 12 * u) { const nx = (x + off) / W; ctx.lineTo(x, baseY - amp * (Math.sin(nx * f1 * Math.PI + ph) * .6 + Math.sin(nx * f2 * Math.PI + ph * 2) * .3 + Math.sin(nx * 11 + ph) * .1)); }
        ctx.lineTo(W * 1.1, H); ctx.closePath(); ctx.fill();
        if (L > 0) { ctx.fillStyle = rgba(m.sky[2], .14); for (let k = 0; k < 2; k++) { const fx = ((t * .15 + r()) % 1) * W * 1.4 - W * .2, fy = baseY + H * .04 + k * H * .04; ctx.beginPath(); ctx.ellipse(fx, fy, W * (.25 + r() * .2), H * .022, 0, 0, Math.PI * 2); ctx.fill(); } }
      }
      ctx.strokeStyle = rgba(m.dark, .8); ctx.lineWidth = 2.5 * u; ctx.lineCap = 'round';
      for (let i = 0; i < 6; i++) { const bx = W * (.1 + i * .13) + t * W * .18, by = H * (.2 + (i % 3) * .07) + Math.sin(t * 6 + i) * H * .01, s = (10 + (i % 3) * 5) * u, fl = Math.sin(t * 14 + i) * .5; ctx.beginPath(); ctx.moveTo(bx - s, by + fl * s); ctx.quadraticCurveTo(bx, by - s * .6, bx + s, by + fl * s); ctx.stroke(); }
    },
    product(ctx, W, H, t, r, m, text) {
      const u = Math.min(W, H) / 1000; sky(ctx, W, H, [m.dark, m.sky[0], m.sky[1]]);
      const cx = W / 2, floorY = H * .72;
      ctx.save(); ctx.globalAlpha = .9; const cone = ctx.createLinearGradient(0, 0, 0, floorY); cone.addColorStop(0, rgba(m.light, .55)); cone.addColorStop(1, rgba(m.light, 0)); ctx.fillStyle = cone; ctx.beginPath(); ctx.moveTo(cx - W * .07, -H * .05); ctx.lineTo(cx + W * .07, -H * .05); ctx.lineTo(cx + W * .42, floorY); ctx.lineTo(cx - W * .42, floorY); ctx.closePath(); ctx.fill(); ctx.restore();
      glow(ctx, cx, floorY, W * .4, m.light, .35);
      for (let i = 0; i < 45; i++) { const px = r() * W, py = (r() * H + H - t * H * .25) % H, a = .2 + .6 * Math.abs(Math.sin(t * 5 + i)); ctx.fillStyle = rgba(m.light, a); ctx.beginPath(); ctx.arc(px, py, (1.5 + r() * 2.5) * u, 0, Math.PI * 2); ctx.fill(); }
      const pw = W * .34, ph = H * .07; ctx.fillStyle = mix(m.dark, '#ffffff', .12); ctx.fillRect(cx - pw / 2, floorY, pw, ph); ctx.fillStyle = mix(m.dark, '#ffffff', .22); ctx.beginPath(); ctx.ellipse(cx, floorY, pw / 2, ph * .35, 0, 0, Math.PI * 2); ctx.fill();
      const kind = /кофе|чашк|чай|какао|латте/i.test(text) ? 'cup' : /бутыл|флакон|парф|вод|сок|масл/i.test(text) ? 'bottle' : /телефон|смартфон|экран/i.test(text) ? 'phone' : 'box';
      const s = Math.min(W, H) * .42, body = mix(m.dark, '#ffffff', .08), ang = t * 1.2 - .6;
      ctx.save(); ctx.translate(cx, floorY - ph * .35);
      const rim = ctx.createLinearGradient(-s * .5, 0, s * .5, 0); rim.addColorStop(0, body); rim.addColorStop(clamp(.5 + Math.sin(ang) * .4, .05, .95), mix(body, m.light, .55)); rim.addColorStop(1, body);
      ctx.fillStyle = rim;
      if (kind === 'cup') { ctx.beginPath(); ctx.moveTo(-s * .3, -s * .55); ctx.lineTo(s * .3, -s * .55); ctx.lineTo(s * .22, 0); ctx.lineTo(-s * .22, 0); ctx.closePath(); ctx.fill(); ctx.strokeStyle = rim; ctx.lineWidth = s * .07; ctx.beginPath(); ctx.arc(s * .33, -s * .3, s * .14, -Math.PI / 2, Math.PI / 2); ctx.stroke(); ctx.fillStyle = mix(body, '#ffffff', .18); ctx.beginPath(); ctx.ellipse(0, -s * .55, s * .3, s * .07, 0, 0, Math.PI * 2); ctx.fill();
        ctx.strokeStyle = rgba('#ffffff', .25); ctx.lineWidth = s * .035; ctx.lineCap = 'round'; for (let i = -1; i <= 1; i++) { ctx.beginPath(); const bx = i * s * .12, by = -s * .62; for (let k = 0; k <= 10; k++) { const yy = by - k * s * .04 - t * s * .12, xx = bx + Math.sin(k * .8 + t * 8 + i) * s * .04; k ? ctx.lineTo(xx, yy) : ctx.moveTo(xx, yy); } ctx.globalAlpha = .6 - t * .3; ctx.stroke(); } }
      else if (kind === 'bottle') { ctx.beginPath(); ctx.roundRect(-s * .2, -s * .75, s * .4, s * .75, s * .05); ctx.fill(); ctx.beginPath(); ctx.roundRect(-s * .07, -s * .95, s * .14, s * .22, s * .03); ctx.fill(); ctx.fillStyle = mix(body, m.accent, .5); ctx.beginPath(); ctx.roundRect(-s * .1, -s * 1.02, s * .2, s * .09, s * .03); ctx.fill(); ctx.fillStyle = rgba(m.light, .18); ctx.beginPath(); ctx.roundRect(-s * .17, -s * .55, s * .34, s * .2, s * .02); ctx.fill(); }
      else if (kind === 'phone') { ctx.beginPath(); ctx.roundRect(-s * .22, -s * .9, s * .44, s * .9, s * .06); ctx.fill(); const scr = ctx.createLinearGradient(0, -s * .9, 0, 0); scr.addColorStop(0, m.sky[1]); scr.addColorStop(1, m.accent); ctx.fillStyle = scr; ctx.globalAlpha = .8; ctx.beginPath(); ctx.roundRect(-s * .19, -s * .86, s * .38, s * .82, s * .04); ctx.fill(); ctx.globalAlpha = 1; }
      else { ctx.beginPath(); ctx.moveTo(0, -s * .85); ctx.lineTo(s * .4, -s * .62); ctx.lineTo(s * .4, -s * .2); ctx.lineTo(0, 0); ctx.lineTo(-s * .4, -s * .2); ctx.lineTo(-s * .4, -s * .62); ctx.closePath(); ctx.fill(); ctx.fillStyle = rgba('#000', .3); ctx.beginPath(); ctx.moveTo(0, -s * .42); ctx.lineTo(s * .4, -s * .62); ctx.lineTo(s * .4, -s * .2); ctx.lineTo(0, 0); ctx.closePath(); ctx.fill(); ctx.fillStyle = rgba('#fff', .12); ctx.beginPath(); ctx.moveTo(0, -s * .85); ctx.lineTo(s * .4, -s * .62); ctx.lineTo(0, -s * .42); ctx.lineTo(-s * .4, -s * .62); ctx.closePath(); ctx.fill(); }
      ctx.restore();
      ctx.save(); ctx.globalAlpha = .35; ctx.fillStyle = '#000'; ctx.filter = `blur(${18 * u}px)`; ctx.beginPath(); ctx.ellipse(cx + Math.sin(ang) * s * .1, floorY + ph * .1, s * .32, s * .05, 0, 0, Math.PI * 2); ctx.fill(); ctx.restore();
    },
    cafe(ctx, W, H, t, r, m) {
      const u = Math.min(W, H) / 1000; sky(ctx, W, H, [m.dark, m.sky[0], m.sky[1]]);
      for (let i = 0; i < 3; i++) { ctx.save(); ctx.globalAlpha = .08; ctx.fillStyle = m.light; ctx.beginPath(); const x0 = W * (.55 + i * .15) + t * W * .05; ctx.moveTo(x0, -H * .1); ctx.lineTo(x0 + W * .1, -H * .1); ctx.lineTo(x0 - W * .35, H * 1.1); ctx.lineTo(x0 - W * .5, H * 1.1); ctx.closePath(); ctx.fill(); ctx.restore(); }
      const pal = [m.light, m.accent, '#ffffff', m.sky[2]];
      for (let i = 0; i < 46; i++) { const bx = r() * W + Math.sin(t * 2 + i) * W * .012, by = r() * H * .8 - t * H * .04, br = (12 + r() * 60) * u, a = .1 + r() * .35; ctx.fillStyle = rgba(pal[i % 4], a * (.6 + .4 * Math.sin(t * 4 + i))); ctx.beginPath(); ctx.arc(bx, by, br, 0, Math.PI * 2); ctx.fill(); ctx.strokeStyle = rgba(pal[i % 4], a * .8); ctx.lineWidth = 1.5 * u; ctx.stroke(); }
      const ty = H * .74; ctx.fillStyle = m.dark; ctx.fillRect(0, ty, W, H - ty); ctx.fillStyle = mix(m.dark, '#fff', .06); ctx.fillRect(0, ty, W, 6 * u);
      [[W * .3, .9], [W * .66, 1.05]].forEach(([cx, sc]) => { const s = Math.min(W, H) * .11 * sc; ctx.fillStyle = mix(m.dark, '#fff', .1); ctx.beginPath(); ctx.moveTo(cx - s * .5, ty - s * .8); ctx.lineTo(cx + s * .5, ty - s * .8); ctx.lineTo(cx + s * .38, ty); ctx.lineTo(cx - s * .38, ty); ctx.closePath(); ctx.fill(); ctx.strokeStyle = mix(m.dark, '#fff', .1); ctx.lineWidth = s * .1; ctx.beginPath(); ctx.arc(cx + s * .55, ty - s * .45, s * .2, -Math.PI / 2, Math.PI / 2); ctx.stroke(); ctx.strokeStyle = rgba('#fff', .2); ctx.lineWidth = 3 * u; ctx.lineCap = 'round'; for (let i = -1; i <= 1; i++) { ctx.beginPath(); for (let k = 0; k <= 8; k++) { const yy = ty - s * .9 - k * s * .09 - (t * s * .3) % (s * .2), xx = cx + i * s * .15 + Math.sin(k * .9 + t * 7 + i) * s * .06; k ? ctx.lineTo(xx, yy) : ctx.moveTo(xx, yy); } ctx.stroke(); } });
    },
    tech(ctx, W, H, t, r, m) {
      const u = Math.min(W, H) / 1000; sky(ctx, W, H, [m.dark, m.sky[0], m.sky[1]]);
      const hz = H * .56; ctx.strokeStyle = rgba(m.accent, .35); ctx.lineWidth = 1.5 * u;
      for (let i = -8; i <= 8; i++) { ctx.beginPath(); ctx.moveTo(W / 2 + i * W * .06, hz); ctx.lineTo(W / 2 + i * W * .45, H); ctx.stroke(); }
      for (let i = 0; i < 12; i++) { const p = ((i / 12 + t * .5) % 1), y = hz + (H - hz) * p * p; ctx.globalAlpha = .15 + p * .5; ctx.beginPath(); ctx.moveTo(0, y); ctx.lineTo(W, y); ctx.stroke(); } ctx.globalAlpha = 1;
      const g = ctx.createLinearGradient(0, hz - H * .1, 0, hz + H * .05); g.addColorStop(0, rgba(m.dark, 0)); g.addColorStop(1, rgba(m.dark, .9)); ctx.fillStyle = g; ctx.fillRect(0, hz - H * .1, W, H * .15);
      const nodes = []; for (let i = 0; i < 16; i++) nodes.push([r() * W, r() * hz * .9 + Math.sin(t * 2 + i) * H * .01]);
      ctx.strokeStyle = rgba(m.accent, .3); ctx.lineWidth = 1.2 * u;
      nodes.forEach((a, i) => nodes.slice(i + 1).forEach(b => { const d = Math.hypot(a[0] - b[0], a[1] - b[1]); if (d < W * .28) { ctx.globalAlpha = 1 - d / (W * .28); ctx.beginPath(); ctx.moveTo(a[0], a[1]); ctx.lineTo(b[0], b[1]); ctx.stroke(); } })); ctx.globalAlpha = 1;
      nodes.forEach(([x, y], i) => { glow(ctx, x, y, 18 * u, m.accent, .6); ctx.fillStyle = '#fff'; ctx.beginPath(); ctx.arc(x, y, (2 + (i % 3)) * u, 0, Math.PI * 2); ctx.fill(); });
      const cx = W / 2, cy = hz * .5, R = Math.min(W, H) * (.17 + Math.sin(t * Math.PI) * .02); glow(ctx, cx, cy, R * 1.6, m.accent, .35);
      ctx.strokeStyle = m.accent; ctx.lineWidth = 3 * u; for (let k = 0; k < 3; k++) { ctx.beginPath(); ctx.arc(cx, cy, R * (1 - k * .18), t * 2 * (k % 2 ? -1 : 1) + k, t * 2 * (k % 2 ? -1 : 1) + k + Math.PI * (1.2 - k * .3)); ctx.stroke(); }
      ctx.fillStyle = rgba('#fff', .9); ctx.beginPath(); ctx.arc(cx, cy, R * .12, 0, Math.PI * 2); ctx.fill();
    },
    title(ctx, W, H, t, r, m, text) {
      const u = Math.min(W, H) / 1000; ctx.fillStyle = m.dark; ctx.fillRect(0, 0, W, H); glow(ctx, W / 2, H / 2, Math.max(W, H) * .6, m.sky[1], .8);
      const words = text.replace(/[«»"]/g, '').replace(/[.!?]+$/, '').split(/\s+/), lines = []; let cur = '';
      words.forEach(w => { if ((cur + ' ' + w).trim().length > 16 && cur) { lines.push(cur); cur = w; } else cur = (cur + ' ' + w).trim(); }); if (cur) lines.push(cur);
      const fs = Math.min(W * .13, H * .09) * (lines.length > 2 ? .85 : 1), e = ease(clamp(t * 1.6, 0, 1));
      ctx.textAlign = 'center'; ctx.textBaseline = 'middle'; ctx.fillStyle = m.light; ctx.font = `italic 600 ${fs}px "Cormorant Garamond"`;
      if ('letterSpacing' in ctx) ctx.letterSpacing = `${(1 - e) * 14 * u}px`;
      lines.forEach((l, i) => { ctx.globalAlpha = e; ctx.fillText(l, W / 2, H / 2 + (i - (lines.length - 1) / 2) * fs * 1.05); }); ctx.globalAlpha = 1; if ('letterSpacing' in ctx) ctx.letterSpacing = '0px';
      const lw = W * .3 * e; ctx.strokeStyle = m.accent; ctx.lineWidth = 2 * u; [H / 2 - fs * lines.length * .62, H / 2 + fs * lines.length * .62].forEach(y => { ctx.beginPath(); ctx.moveTo(W / 2 - lw, y); ctx.lineTo(W / 2 + lw, y); ctx.stroke(); });
      ctx.fillStyle = m.accent; ctx.font = `600 ${16 * u}px "Golos Text"`; if ('letterSpacing' in ctx) ctx.letterSpacing = `${5 * u}px`; ctx.fillText('ТАКТ', W / 2, H * .9); if ('letterSpacing' in ctx) ctx.letterSpacing = '0px';
    },
  };

  // ---------- сцена целиком: камера + художник + виньетка ----------
  function paintScene(ctx, W, H, sc, t) {
    const s = sc.zoomIn ? 1.06 + .12 * t : 1.18 - .12 * t, px = sc.panX * (t - .5) * W * .05, py = sc.panY * (t - .5) * H * .03;
    ctx.save(); ctx.translate(W / 2 + px, H / 2 + py); ctx.scale(s, s); ctx.translate(-W / 2, -H / 2);
    PAINT[sc.kind](ctx, W, H, t, rng(sc.seed), MOODS[sc.mood], sc.text); ctx.restore();
    const v = ctx.createRadialGradient(W / 2, H / 2, Math.min(W, H) * .35, W / 2, H / 2, Math.max(W, H) * .75); v.addColorStop(0, 'rgba(0,0,0,0)'); v.addColorStop(1, 'rgba(0,0,0,.6)'); ctx.fillStyle = v; ctx.fillRect(0, 0, W, H);
  }
  function wrapText(ctx, text, maxW) { const words = text.split(' '), lines = []; let cur = ''; words.forEach(w => { const tst = cur ? cur + ' ' + w : w; if (ctx.measureText(tst).width > maxW && cur) { lines.push(cur); cur = w; } else cur = tst; }); if (cur) lines.push(cur); return lines; }
  function paintSubtitle(ctx, W, H, text, prog) {
    const n = Math.ceil(text.length * clamp(prog * 1.6, 0, 1)), shown = text.slice(0, n); if (!shown) return;
    const fs = Math.min(W, H) * .05; ctx.font = `600 ${fs}px "Golos Text"`; ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
    const lines = wrapText(ctx, shown, W * .8), lh = fs * 1.3, y0 = H * .8 - (lines.length - 1) * lh / 2;
    lines.forEach((l, i) => { const w = ctx.measureText(l).width; ctx.fillStyle = 'rgba(0,0,0,.55)'; ctx.beginPath(); ctx.roundRect(W / 2 - w / 2 - fs * .5, y0 + i * lh - lh / 2, w + fs, lh, fs * .3); ctx.fill(); ctx.fillStyle = '#f2ede4'; ctx.fillText(l, W / 2, y0 + i * lh); });
  }

  // ---------- сценарий → сцены ----------
  const KW = {
    city: /город|улиц|ночь|ноч|неон|огн|мегаполис|трафик|дорог|район|крыш/i, nature: /гор|лес|рек|природ|море|утро|рассвет|закат|поле|небо|плантац|океан|ветер|солнц|снег|тропа/i,
    product: /кофе|чашк|бутыл|товар|продукт|упаков|зёрн|зерн|обжар|глоток|крем|флакон|телефон|часы|кроссовк|вкус|аромат|сыворотк|ткань|модел/i,
    cafe: /друз|кафе|люди|встреч|вечер|разговор|команд|семь|вечеринк|бар|улыб|вместе|гост|клиент/i, tech: /технолог|нейро|ии\b|данн|код|будущ|алгоритм|робот|сервис|приложен|цифров|скорост|сеть|онлайн|автомат/i,
  };
  const SHOT = { city: 'Общий план', nature: 'Панорама', product: 'Крупный план', cafe: 'Средний план', tech: 'Абстракция', title: 'Титр' };
  function buildScenes(text, mood, seedBase = 1) {
    const sents = text.split(/(?<=[.!?])\s+|\n+/).map(s => s.trim()).filter(Boolean).slice(0, 12);
    const rot = ['city', 'nature', 'cafe', 'tech'];
    return sents.map((s, i) => {
      let kind = 'title';
      if (i < sents.length - 1 || sents.length === 1) { const scores = Object.entries(KW).map(([k, re]) => [k, (s.match(new RegExp(re.source, 'gi')) || []).length]).sort((a, b) => b[1] - a[1]); kind = scores[0][1] ? scores[0][0] : rot[i % 4]; if (s.split(' ').length <= 3) kind = 'title'; }
      const words = s.split(' ').length, r = rng(seedBase * 31 + i * 7);
      return { text: s, kind, shot: SHOT[kind], dur: kind === 'title' ? 2.8 : clamp(2.4 + words * .22, 2.6, 6), seed: seedBase * 31 + i * 7, mood, zoomIn: r() > .5, panX: r() > .5 ? 1 : -1, panY: r() > .5 ? 1 : -1 };
    });
  }

  // ---------- плеер ----------
  class Player {
    constructor(canvas, opts = {}) { this.c = canvas; this.ctx = canvas.getContext('2d'); this.prev = document.createElement('canvas'); this.clean = document.createElement('canvas'); this.scenes = []; this.time = 0; this.playing = false; this.loop = !!opts.loop; this.subs = opts.subs !== false; this.onFrame = opts.onFrame; this.onEnd = opts.onEnd; this.lastIdx = -1; }
    get total() { return this.scenes.reduce((a, s) => a + s.dur, 0); }
    load(scenes) { this.scenes = scenes; this.time = 0; this.lastIdx = -1; this.draw(); }
    at(time) { let acc = 0; for (let i = 0; i < this.scenes.length; i++) { if (time < acc + this.scenes[i].dur || i === this.scenes.length - 1) return { i, local: time - acc }; acc += this.scenes[i].dur; } return { i: 0, local: 0 }; }
    draw() {
      const { c, ctx } = this, W = c.width, H = c.height; if (!this.scenes.length) { ctx.fillStyle = '#000'; ctx.fillRect(0, 0, W, H); return; }
      const { i, local } = this.at(this.time), sc = this.scenes[i], t = clamp(local / sc.dur, 0, 1);
      if (i !== this.lastIdx) { if (this.lastIdx >= 0 && this.clean.width === W) { this.prev.width = W; this.prev.height = H; this.prev.getContext('2d').drawImage(this.clean, 0, 0); } else this.prev.width = 0; this.lastIdx = i; }
      paintScene(ctx, W, H, sc, t);
      if (local < .6 && i > 0 && this.prev.width) { ctx.save(); ctx.globalAlpha = 1 - local / .6; ctx.drawImage(this.prev, 0, 0); ctx.restore(); }
      if (this.clean.width !== W || this.clean.height !== H) { this.clean.width = W; this.clean.height = H; } this.clean.getContext('2d').drawImage(c, 0, 0);
      if (this.subs && sc.kind !== 'title') paintSubtitle(ctx, W, H, sc.text, local / sc.dur);
      if (local < .35) { ctx.fillStyle = `rgba(0,0,0,${(1 - local / .35) * (i === 0 ? 1 : 0)})`; ctx.fillRect(0, 0, W, H); }
      this.onFrame && this.onFrame(i, sc, this.time);
    }
    play() { if (this.playing) return; this.playing = true; let last = performance.now(); const step = now => { if (!this.playing) return; this.time += (now - last) / 1000; last = now; if (this.time >= this.total) { if (this.loop) { this.time = 0; this.lastIdx = -1; } else { this.time = this.total - .001; this.draw(); this.playing = false; this.onEnd && this.onEnd(); return; } } this.draw(); requestAnimationFrame(step); }; requestAnimationFrame(step); }
    pause() { this.playing = false; }
    seek(t) { this.time = clamp(t, 0, this.total - .001); this.lastIdx = -1; this.draw(); }
  }

  // ---------- hero-ролик ----------
  const HERO_SCRIPT = $('#script').value;
  const hero = new Player($('#hero-reel'), { loop: true, subs: false, onFrame: (i, sc) => { const cap = $('#hero-caption'); const txt = `Сцена ${i + 1} · ${sc.shot}`; if (cap.textContent !== txt) cap.textContent = txt; } });
  const fontsReady = Promise.all(['italic 600 40px "Cormorant Garamond"', '600 40px "Golos Text"'].map(f => document.fonts.load(f))).catch(() => {});
  fontsReady.then(() => { hero.load(buildScenes(HERO_SCRIPT, 'warm', 5)); hero.play(); });

  // ---------- студия ----------
  const state = { mood: 'warm', aspect: ASPECTS[0], seed: 1, scenes: [] };
  const player = new Player($('#player'), { subs: true, onFrame: (i, sc, time) => { badge(time); markActive(i); timelineProgress(time); }, onEnd: () => { $('#play').textContent = '▶ Смотреть'; } });
  function badge(time) { const m = Math.floor(time / 60), s = Math.floor(time % 60); $('#player-badge').textContent = `${m}:${String(s).padStart(2, '0')} / ${Math.floor(player.total / 60)}:${String(Math.round(player.total % 60)).padStart(2, '0')}`; }
  function chips(el, items, key, get, set) { el.innerHTML = ''; items.forEach(it => { const b = document.createElement('button'); b.type = 'button'; b.className = 'chip'; b.innerHTML = (it.swatch ? `<i style="background:${it.swatch}"></i>` : '') + it.name; b.setAttribute('aria-pressed', String(get() === it.id)); b.onclick = () => { set(it); [...el.children].forEach(c => c.setAttribute('aria-pressed', 'false')); b.setAttribute('aria-pressed', 'true'); }; el.appendChild(b); }); }
  chips($('#moods'), Object.entries(MOODS).map(([id, m]) => ({ id, name: m.name, swatch: `linear-gradient(135deg,${m.sky[1]},${m.accent})` })), 'mood', () => state.mood, it => { state.mood = it.id; if (state.scenes.length) build(); });
  chips($('#aspects'), ASPECTS, 'aspect', () => state.aspect.id, it => { state.aspect = it; $('#player').width = it.w; $('#player').height = it.h; $('#player-frame').className = 'player-frame ' + it.cls; if (state.scenes.length) build(); });

  function build() {
    state.seed++; state.scenes = buildScenes($('#script').value, state.mood, state.seed);
    if (!state.scenes.length) { $('#status').textContent = 'Напишите хотя бы одно предложение.'; return; }
    player.pause(); $('#play').textContent = '▶ Смотреть'; player.load(state.scenes); renderBoard(); renderTimeline(); badge(0);
    $('#play').disabled = $('#export').disabled = false;
    $('#status').textContent = `${state.scenes.length} сцен, ${player.total.toFixed(1)} с. Нажмите на сцену, чтобы перемотать, или «↻», чтобы пересобрать кадр.`;
  }
  function renderBoard() {
    const board = $('#board'); board.innerHTML = '';
    state.scenes.forEach((sc, i) => {
      const li = document.createElement('li'); li.className = 'scene'; li.style.animationDelay = `${i * 70}ms`;
      const c = document.createElement('canvas'); c.width = 400; c.height = 250; paintScene(c.getContext('2d'), 400, 250, sc, .5);
      li.appendChild(c); li.insertAdjacentHTML('beforeend', `<div class="scene-meta"><span>${i + 1} · ${sc.shot}</span><span>${sc.dur.toFixed(1)} с</span></div><p>${sc.text}</p><button type="button">↻ Пересобрать кадр</button>`);
      li.onclick = e => { if (e.target.tagName === 'BUTTON') { sc.seed += 101; const r = rng(sc.seed); sc.zoomIn = r() > .5; sc.panX = r() > .5 ? 1 : -1; if (sc.kind !== 'title') { const kinds = ['city', 'nature', 'cafe', 'tech', 'product']; sc.kind = kinds[(kinds.indexOf(sc.kind) + 1 + Math.floor(r() * 3)) % kinds.length]; sc.shot = SHOT[sc.kind]; } paintScene(c.getContext('2d'), 400, 250, sc, .5); li.querySelector('.scene-meta span').textContent = `${i + 1} · ${sc.shot}`; player.seek(startOf(i) + .7); return; } player.seek(startOf(i) + .01); };
      board.appendChild(li);
    });
  }
  const startOf = i => state.scenes.slice(0, i).reduce((a, s) => a + s.dur, 0);
  function markActive(i) { [...$('#board').children].forEach((li, k) => li.classList.toggle('active', k === i)); }
  function renderTimeline() { const tl = $('#timeline'); tl.innerHTML = ''; state.scenes.forEach((sc, i) => { const seg = document.createElement('i'); seg.style.flex = sc.dur; seg.onclick = () => player.seek(startOf(i) + .01); tl.appendChild(seg); }); }
  function timelineProgress(time) { [...$('#timeline').children].forEach((seg, i) => { const s = startOf(i), d = state.scenes[i].dur; seg.style.setProperty('--p', `${clamp((time - s) / d, 0, 1) * 100}%`); }); }

  $('#build').onclick = build;
  $('#play').onclick = () => { if (player.playing) { player.pause(); $('#play').textContent = '▶ Смотреть'; } else { if (player.time >= player.total - .01) player.seek(0); player.play(); $('#play').textContent = '❚❚ Пауза'; } };
  $('#export').onclick = async () => {
    const c = $('#player'); if (!('MediaRecorder' in window) || !c.captureStream) { $('#status').textContent = 'Браузер не умеет записывать видео. Попробуйте Chrome.'; return; }
    const mime = ['video/mp4;codecs=avc1', 'video/webm;codecs=vp9', 'video/webm'].find(m => MediaRecorder.isTypeSupported(m)) || 'video/webm';
    const rec = new MediaRecorder(c.captureStream(30), { mimeType: mime, videoBitsPerSecond: 8e6 }), chunks = []; rec.ondataavailable = e => e.data.size && chunks.push(e.data);
    $('#export').disabled = true; $('#play').disabled = true; $('#status').textContent = 'Запись… ролик проигрывается целиком в реальном времени.';
    player.pause(); player.seek(0); rec.start(200); player.onEnd = () => { rec.stop(); };
    const done = new Promise(r => rec.onstop = r); player.play(); await done;
    const ext = mime.startsWith('video/mp4') ? 'mp4' : 'webm', a = document.createElement('a'); a.download = `takt-${state.aspect.id}.${ext}`; a.href = URL.createObjectURL(new Blob(chunks, { type: mime })); a.click();
    $('#status').textContent = `Видео ${ext.toUpperCase()} сохранено: ${state.aspect.w}×${state.aspect.h}, ${player.total.toFixed(1)} с.`; $('#export').disabled = false; $('#play').disabled = false; $('#play').textContent = '▶ Смотреть';
    player.onEnd = () => { $('#play').textContent = '▶ Смотреть'; };
  };

  // ---------- примеры ----------
  const EXAMPLES = [
    { title: 'Реклама кофе', sub: 'тёплое · 6 сцен', mood: 'warm', text: HERO_SCRIPT },
    { title: 'Запуск приложения', sub: 'техно · 5 сцен', mood: 'techno', text: 'Данные приходят быстрее, чем вы успеваете моргнуть.\nНейросеть читает отчёты, пока команда пьёт кофе.\nГород не спит, и наши серверы тоже.\nВстречайте друзей, а не дедлайны.\nПриложение «Пульс». Скачайте сегодня.' },
    { title: 'Путешествие в горы', sub: 'природа · 5 сцен', mood: 'nature', text: 'Рассвет над горами начинается тихо.\nВетер в лесу пахнет хвоей и рекой.\nТермос с чаем греет руки на привале.\nДрузья смеются у костра до самого вечера.\nТур «Высота». Три дня без связи.' },
  ];
  fontsReady.then(() => {
    EXAMPLES.forEach(ex => {
      const b = document.createElement('button'); b.className = 'example reveal in'; const c = document.createElement('canvas'); c.width = 640; c.height = 360;
      const scs = buildScenes(ex.text, ex.mood, 9); paintScene(c.getContext('2d'), 640, 360, scs[0], .6);
      b.appendChild(c); b.insertAdjacentHTML('beforeend', `<div><b>${ex.title}</b><span>${ex.sub}</span></div>`);
      b.onclick = () => { $('#script').value = ex.text; state.mood = ex.mood; chips($('#moods'), Object.entries(MOODS).map(([id, m]) => ({ id, name: m.name, swatch: `linear-gradient(135deg,${m.sky[1]},${m.accent})` })), 'mood', () => state.mood, it => { state.mood = it.id; if (state.scenes.length) build(); }); build(); $('#studio').scrollIntoView({ behavior: 'smooth' }); };
      $('#examples-grid').appendChild(b);
    });
    player.load(buildScenes('Здесь будет ваш ролик.', 'warm', 1)); player.seek(2);
  });
})();
