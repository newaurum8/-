#!/usr/bin/env node
/* Проверка сайта: скриншоты десктоп/мобилка, ошибки консоли, горизонтальный скролл, сценарий действий.
   Использование: node tools/check.js /sites/<slug>/ <outdir> ['[{"click":"#btn"},{"wait":500},{"shot":"name"},{"scroll":"#id"},{"fill":["#input","text"]}]']
   Требует запущенный сервер: python3 -m http.server 8080 в корне репозитория. */
const { chromium } = require('playwright');
const fs = require('fs');
(async () => {
  const [path, out, actionsJson] = process.argv.slice(2);
  if (!path || !out) { console.error('usage: node tools/check.js /sites/<slug>/ <outdir> [actionsJson]'); process.exit(2); }
  fs.mkdirSync(out, { recursive: true });
  const b = await chromium.launch(); const errs = [];
  const url = 'http://localhost:8080' + path;
  const reveal = () => document.querySelectorAll('.reveal, [data-reveal]').forEach(e => e.classList.add('in'));
  const scrollThrough = async () => { for (let y = 0; y < document.body.scrollHeight; y += 500) { window.scrollTo(0, y); await new Promise(r => setTimeout(r, 50)); } window.scrollTo(0, 0); };
  const p = await b.newPage({ viewport: { width: 1400, height: 900 } });
  p.on('pageerror', e => errs.push('pageerror: ' + e.message)); p.on('console', m => m.type() === 'error' && errs.push('console: ' + m.text()));
  p.on('requestfailed', r => { if (!/fonts\.g/.test(r.url())) errs.push('requestfailed: ' + r.url()); });
  // сервер: если не отвечает, поднимаем python http.server из корня репозитория
  const { spawn } = require('child_process'); const path_ = require('path'); const root = path_.resolve(__dirname, '..');
  async function ensureServer() { for (let i = 0; i < 2; i++) { try { await fetch('http://localhost:8080/'); return; } catch { if (i === 0) { const srv = spawn('python3', ['-m', 'http.server', '8080', '--bind', '0.0.0.0'], { cwd: root, detached: true, stdio: 'ignore' }); srv.unref(); await new Promise(r => setTimeout(r, 1500)); } } } }
  await ensureServer();
  await p.goto(url, { waitUntil: 'load', timeout: 60000 }); await p.waitForTimeout(1500);
  await p.evaluate(scrollThrough); await p.evaluate(reveal); await p.waitForTimeout(800);
  if (actionsJson) {
    for (const a of JSON.parse(actionsJson)) {
      try {
        if (a.click) await p.click(a.click, { timeout: 5000 });
        if (a.fill) await p.fill(a.fill[0], a.fill[1]);
        if (a.scroll) await p.evaluate(s => document.querySelector(s)?.scrollIntoView(), a.scroll);
        if (a.wait) await p.waitForTimeout(a.wait);
        if (a.shot) await p.screenshot({ path: `${out}/${a.shot}.png` });
      } catch (e) { errs.push('action failed: ' + JSON.stringify(a) + ' → ' + e.message.split('\n')[0]); }
    }
  }
  await p.evaluate(() => window.scrollTo(0, 0)); await p.waitForTimeout(300);
  await p.screenshot({ path: `${out}/desktop.png`, fullPage: true });
  const deskW = await p.evaluate(() => document.documentElement.scrollWidth);
  const m = await b.newPage({ viewport: { width: 390, height: 844 }, deviceScaleFactor: 1 });
  m.on('pageerror', e => errs.push('mobile pageerror: ' + e.message));
  await m.goto(url, { waitUntil: 'load', timeout: 60000 }); await m.waitForTimeout(1200);
  await m.evaluate(scrollThrough); await m.evaluate(reveal); await m.waitForTimeout(800);
  await m.screenshot({ path: `${out}/mobile.png`, fullPage: true });
  const mobW = await m.evaluate(() => document.documentElement.scrollWidth);
  const tiny = await m.evaluate(() => [...document.querySelectorAll('button, a')].filter(e => { const r = e.getBoundingClientRect(); return r.width > 0 && r.height > 0 && r.height < 32; }).length);
  const unlabeled = await m.evaluate(() => [...document.querySelectorAll('input:not([type=hidden]), textarea, select')].filter(e => !e.labels?.length && !e.getAttribute('aria-label') && !e.getAttribute('placeholder') && !e.getAttribute('aria-labelledby')).length);
  const report = { url, errors: errs, desktopScrollWidth: deskW, mobileScrollWidth: mobW, mobileOverflow: mobW > 390, smallTapTargets: tiny, unlabeledInputs: unlabeled, screenshots: [`${out}/desktop.png`, `${out}/mobile.png`] };
  console.log(JSON.stringify(report, null, 2));
  await b.close();
  process.exit(errs.length || mobW > 390 ? 1 : 0);
})();
