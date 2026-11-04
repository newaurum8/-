/* Patch — клиентский движок ревью: правила для JS и Python, стриминг находок, автофикс. */
(() => {
  const $ = (s, r = document) => r.querySelector(s);
  const esc = s => s.replace(/[&<>]/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;' }[c]));
  const fmt = n => Math.round(n).toLocaleString('ru-RU');
  const revealAll = () => { const h = innerHeight; document.querySelectorAll('.reveal:not(.in)').forEach(el => { if (el.getBoundingClientRect().top < h * .92) el.classList.add('in'); }); };
  addEventListener('scroll', revealAll, { passive: true }); addEventListener('resize', revealAll); revealAll(); setTimeout(revealAll, 400);
  function countUp(el, to, dur = 1400) { const t0 = performance.now(); (function f(now) { const p = Math.min(1, (now - t0) / dur), e = 1 - Math.pow(1 - p, 3); el.textContent = fmt(to * e); if (p < 1) requestAnimationFrame(f); })(t0); }
  let counted = false; const tryCount = () => { if (!counted && $('.proof').getBoundingClientRect().top < innerHeight) { counted = true; document.querySelectorAll('[data-count]').forEach(el => countUp(el, +el.dataset.count)); } };
  addEventListener('scroll', tryCount, { passive: true }); tryCount();

  // ---------- терминал в hero ----------
  const SCRIPT = [
    ['$ patch review --pr 482', 'c', 40], ['<span class="m">Индексирую репозиторий… 1 213 файлов</span>', 'm', 0], ['<span class="c">✔</span> Прочитано 14 файлов, 388 строк diff', '', 0],
    ['<span class="r">●</span> 2 критичных   <span class="a">●</span> 3 средних   <span class="v">●</span> 2 стилевых', '', 0],
    ['  <span class="r">src/cart.js:1</span>     Секрет в коде: API-ключ Stripe в репозитории', '', 0],
    ['  <span class="r">src/cart.js:24</span>    innerHTML с пользовательскими данными (XSS)', '', 0],
    ['  <span class="a">src/cart.js:19</span>    await в цикле: 40 последовательных запросов', '', 0],
    ['  <span class="a">src/cart.js:27</span>    Промис fetch без await и обработки ошибок', '', 0],
    ['', '', 0], ['$ patch fix --apply', 'c', 40], ['<span class="c">✔</span> 5 правок закоммичено в feature/cart-v2', '', 0], ['<span class="c">✔</span> npm test: 212 passed, 0 failed  <span class="m">(38 с)</span>', '', 0],
    ['<span class="v">→</span> Ревью опубликовано. Время: <b>41 с</b>', '', 0],
  ];
  const term = $('#term');
  async function runTerm() {
    while (true) {
      term.innerHTML = '';
      for (const [line, cls, typeMs] of SCRIPT) {
        const el = document.createElement('div'); term.appendChild(el);
        if (typeMs) { for (let i = 1; i <= line.length; i++) { el.innerHTML = `<span class="${cls}">${esc(line.slice(0, i))}</span><span class="cur"></span>`; await sleep(typeMs); } el.innerHTML = `<span class="${cls}">${esc(line)}</span>`; await sleep(500); }
        else { el.innerHTML = line; await sleep(line ? 260 : 120); }
      }
      const cur = document.createElement('div'); cur.innerHTML = '<span class="cur"></span>'; term.appendChild(cur);
      await sleep(5000);
    }
  }
  const sleep = ms => new Promise(r => setTimeout(r, ms));
  runTerm();

  // ---------- примеры ----------
  const SAMPLES = {
    'Корзина (JS)': `var API_KEY = "sk_live_51Hx9QmK2ZpL8vN3t";
var cart = [];

function addToCart(item, qty) {
  if (qty == null) qty = 1;
  for (var i = 0; i < cart.length; i++) {
    if (cart[i].id == item.id) {
      cart[i].qty += qty;
      return;
    }
  }
  cart.push({ id: item.id, price: item.price, qty: qty });
  console.log("added", item);
}

async function checkout(userId) {
  var total = 0;
  for (var i = 0; i < cart.length; i++) {
    var res = await fetch("http://api.shop.ru/price/" + cart[i].id);
    var data = JSON.parse(await res.text());
    total += data.price * cart[i].qty;
  }
  document.getElementById("total").innerHTML = "Итого: " + total + " ₽";
  try {
    fetch("/api/order", { method: "POST", body: JSON.stringify({ userId, cart, total }) });
  } catch (e) {}
  var orderId = Math.random().toString(36).slice(2);
  localStorage.setItem("lastOrder", orderId);
  return orderId;
}`,
    'Авторизация (Python)': `import os, hashlib, sqlite3
from flask import request, jsonify

SECRET = "hunter2-prod-2026"

def login():
    user = request.form["user"]
    pwd = request.form["password"]
    db = sqlite3.connect("app.db")
    row = db.execute("SELECT * FROM users WHERE name = '%s'" % user).fetchone()
    if row == None:
        return jsonify(ok=False)
    if row[2] == hashlib.md5(pwd.encode()).hexdigest():
        print("login ok", user, pwd)
        return jsonify(ok=True, token=SECRET)
    return jsonify(ok=False)

def export(user, items=[]):
    try:
        os.system("tar czf /tmp/export.tgz " + user)
    except:
        pass
    items.append(user)
    return eval(request.args.get("fmt", "'csv'"))`,
    'Чистый код (JS)': `const TAX = 0.2;

export function totalWithTax(items) {
  const subtotal = items.reduce((sum, it) => sum + it.price * it.qty, 0);
  return Math.round(subtotal * (1 + TAX) * 100) / 100;
}

export async function loadPrices(ids, signal) {
  const res = await fetch(\`/api/prices?ids=\${ids.join(',')}\`, { signal });
  if (!res.ok) throw new Error(\`prices: \${res.status}\`);
  return res.json();
}`,
  };

  // ---------- правила ----------
  const sev = { crit: 18, high: 12, med: 6, low: 2, info: 1 };
  const label = { crit: 'critical', high: 'high', med: 'medium', low: 'low', info: 'info' };
  const RULES_JS = [
    { re: /(api[_-]?key|secret|password|token)\s*[:=]\s*["'][^"']{6,}["']/i, s: 'crit', t: 'Секрет в коде', d: 'Ключ или пароль попадёт в историю git и ко всем, у кого есть доступ к репозиторию. Вынесите в переменные окружения и отзовите текущий ключ.', fix: l => [l, l.replace(/["'][^"']+["']/, 'process.env.' + (l.match(/\w+/g).find(w => /key|secret|password|token/i.test(w)) || 'SECRET').toUpperCase())] },
    { re: /\.innerHTML\s*(\+?=)/, s: 'high', t: 'XSS через innerHTML', d: 'Строка собирается из данных и вставляется как HTML. Любой `<script>` или `onerror` выполнится. Используйте textContent или безопасный шаблон.', fix: l => [l, l.replace('.innerHTML', '.textContent')] },
    { re: /\beval\s*\(/, s: 'high', t: 'eval с внешними данными', d: 'Выполнение произвольной строки как кода. Почти всегда заменяется на JSON.parse или таблицу функций.' },
    { re: /setTimeout\s*\(\s*["']/, s: 'high', t: 'setTimeout со строкой', d: 'Строка выполняется как eval. Передайте функцию.' },
    { re: /document\.write\s*\(/, s: 'high', t: 'document.write', d: 'Перезаписывает документ и открывает XSS. Используйте DOM API.' },
    { re: /if\s*\([^=!<>]*[^=!<>]=[^=][^)]*\)/, s: 'high', t: 'Присваивание в условии', d: 'В условии одиночное `=`, условие всегда истинно. Скорее всего имелось в виду `===`.' },
    { re: /http:\/\//, s: 'med', t: 'Незащищённый протокол', d: 'Запрос по http перехватывается в открытых сетях. Переключите на https.', fix: l => [l, l.replace('http://', 'https://')] },
    { re: /catch\s*\((\w+)?\)\s*\{\s*\}/, s: 'med', t: 'Пустой catch', d: 'Ошибка молча проглатывается, баг будет невозможно найти в проде. Залогируйте или пробросьте дальше.', fix: l => [l, l.replace(/\{\s*\}/, '{ console.error(e); throw e; }')] },
    { re: /^\s*fetch\s*\(/, s: 'med', t: 'Промис без обработки', d: 'Результат fetch не ожидается и не ловится. Если запрос упадёт, никто не узнает. Добавьте await и проверку res.ok.', fix: l => [l, l.replace(/^(\s*)fetch/, '$1await fetch')] },
    { re: /JSON\.parse\s*\(/, s: 'med', t: 'JSON.parse без try', d: 'Невалидный ответ сервера уронит функцию исключением. Оберните в try/catch или валидируйте схему.', ctx: (lines, i) => !lines.slice(Math.max(0, i - 6), i).some(l => /try\s*\{/.test(l)) },
    { re: /Math\.random\(\)/, s: 'med', t: 'Math.random для идентификатора', d: 'Не криптостойкий генератор, значения предсказуемы. Для id и токенов используйте crypto.randomUUID().', fix: l => [l, l.replace(/Math\.random\(\)\.toString\(36\)\.slice\(2\)/, 'crypto.randomUUID()')] },
    { re: /^\s*for\b/, s: 'med', t: 'await внутри цикла', d: 'Запросы идут по одному. При 40 товарах это 40 последовательных round-trip. Соберите промисы и дождитесь Promise.all.', ctx: (lines, i) => lines.slice(i + 1, i + 5).some(l => /\bawait\b/.test(l)) },
    { re: /\bvar\s+/, s: 'low', t: 'var вместо const/let', d: 'var поднимается во всю функцию и переопределяется незаметно. const по умолчанию, let для изменяемых.', fix: l => [l, l.replace(/\bvar\s+/, /=\s*\[\]|=\s*0\s*;/.test(l) ? 'let ' : 'const ')] },
    { re: /[^=!<>]==[^=]|!=[^=]/, s: 'low', t: 'Нестрогое сравнение', d: '`==` приводит типы: `0 == ""` истинно. Используйте `===` и `!==`.', fix: l => [l, l.replace(/([^=!<>])==([^=])/g, '$1===$2').replace(/!=([^=])/g, '!==$1')] },
    { re: /console\.log\s*\(/, s: 'low', t: 'console.log в продакшене', d: 'Шумит в консоли и может утечь персональными данными в логи. Удалите или замените логгером.', fix: l => [l, ''] },
    { re: /parseInt\s*\([^,)]+\)/, s: 'low', t: 'parseInt без основания', d: 'Строки с ведущим нулём могут разобраться как восьмеричные. Укажите 10.', fix: l => [l, l.replace(/parseInt\s*\(([^,)]+)\)/, 'parseInt($1, 10)')] },
    { re: /\b(TODO|FIXME|HACK)\b/, s: 'info', t: 'Незакрытый TODO', d: 'Заведите задачу в трекере и сошлитесь на неё, иначе комментарий останется навсегда.' },
    { re: /localStorage\.setItem\([^)]*(token|password|order)/i, s: 'info', t: 'Чувствительные данные в localStorage', d: 'localStorage доступен любому скрипту на странице. Для токенов используйте httpOnly-cookie.' },
  ];
  const RULES_PY = [
    { re: /(SECRET|PASSWORD|API_KEY|TOKEN)\s*=\s*["'][^"']{6,}["']/, s: 'crit', t: 'Секрет в коде', d: 'Ключ в репозитории. Вынесите в os.environ и отзовите текущий.', fix: l => [l, l.replace(/["'][^"']+["']/, 'os.environ["' + l.match(/\w+/)[0] + '"]')] },
    { re: /execute\s*\(.*%\s*\w+|execute\s*\(.*\+\s*\w+|execute\s*\(\s*f["']/, s: 'crit', t: 'SQL-инъекция', d: 'Запрос собирается из строки с пользовательским вводом. Передавайте параметры вторым аргументом execute.', fix: l => [l, l.replace(/'%s'"\s*%\s*(\w+)/, "?\", ($1,)")] },
    { re: /os\.system\s*\(|subprocess\.[a-z]+\([^)]*shell\s*=\s*True/, s: 'crit', t: 'Инъекция команд', d: 'Строка с пользовательскими данными уходит в shell. Используйте subprocess.run со списком аргументов без shell=True.' },
    { re: /\beval\s*\(/, s: 'high', t: 'eval с внешними данными', d: 'Выполнение произвольной строки из запроса. Используйте словарь допустимых значений.' },
    { re: /hashlib\.(md5|sha1)\(/, s: 'high', t: 'Слабый хеш для пароля', d: 'md5 и sha1 перебираются на GPU за минуты. Используйте bcrypt, argon2 или scrypt.', fix: l => [l, l.replace(/hashlib\.(md5|sha1)\(([^)]*)\)\.hexdigest\(\)/, 'bcrypt.hashpw($2, salt)')] },
    { re: /except\s*:/, s: 'med', t: 'Голый except', d: 'Ловит всё, включая KeyboardInterrupt и SystemExit. Укажите тип исключения.', fix: l => [l, l.replace('except:', 'except OSError as e:')] },
    { re: /^\s*pass\s*$/, s: 'med', t: 'Ошибка проглочена', d: 'Блок except ничего не делает. Залогируйте или пробросьте.', ctx: (lines, i) => /except/.test(lines[i - 1] || ''), fix: l => [l, l.replace('pass', 'logger.exception("export failed"); raise')] },
    { re: /def\s+\w+\([^)]*=\s*(\[\]|\{\})/, s: 'med', t: 'Изменяемый аргумент по умолчанию', d: 'Список создаётся один раз и копится между вызовами. Используйте None и создавайте внутри.', fix: l => [l, l.replace(/=\s*(\[\]|\{\})/, '=None')] },
    { re: /==\s*None|!=\s*None/, s: 'low', t: 'Сравнение с None через ==', d: 'PEP 8: используйте `is None` / `is not None`.', fix: l => [l, l.replace('== None', 'is None').replace('!= None', 'is not None')] },
    { re: /\bprint\s*\(/, s: 'low', t: 'print в продакшене', d: 'Здесь в stdout уходит пароль. Используйте logging и не логируйте секреты.', fix: l => [l, ''] },
    { re: /from\s+\w+\s+import\s+\*/, s: 'low', t: 'import *', d: 'Загрязняет пространство имён, ломает статический анализ.' },
    { re: /request\.(form|args)\[["']\w+["']\]/, s: 'info', t: 'Доступ к параметру без проверки', d: 'Отсутствие ключа даст 400 с трассировкой. Используйте .get с валидацией.' },
  ];

  function detectLang(code) { return /^\s*(def |import |from \w+ import|class \w+:)/m.test(code) && !/[{};]\s*$/m.test(code) ? 'py' : 'js'; }

  function analyze(code) {
    const lang = detectLang(code), rules = lang === 'py' ? RULES_PY : RULES_JS, lines = code.split('\n'), out = [];
    lines.forEach((line, i) => {
      if (/^\s*(\/\/|#)/.test(line)) return;
      rules.forEach(r => { if (r.re.test(line) && (!r.ctx || r.ctx(lines, i))) out.push({ ...r, line: i + 1, src: line }); });
    });
    // длинные функции
    const fnRe = lang === 'py' ? /^\s*def\s+(\w+)/ : /^\s*(?:async\s+)?function\s+(\w+)|^\s*(\w+)\s*=\s*(?:async\s*)?\(/;
    let start = -1, name = '';
    lines.forEach((l, i) => { const m = l.match(fnRe); if (m) { if (start >= 0 && i - start > 28) out.push({ s: 'med', t: `Длинная функция ${name}`, d: `${i - start} строк. Разбейте на шаги: валидация, загрузка, расчёт.`, line: start + 1, src: lines[start] }); start = i; name = m[1] || m[2]; } });
    // группировка одинаковых находок
    const grouped = [];
    out.forEach(f => { const g = grouped.find(x => x.t === f.t); if (g) { g.lines.push(f.line); g.srcs.push(f.src); } else grouped.push({ ...f, lines: [f.line], srcs: [f.src] }); });
    const order = ['crit', 'high', 'med', 'low', 'info'];
    grouped.sort((a, b) => order.indexOf(a.s) - order.indexOf(b.s) || a.line - b.line);
    const score = Math.max(4, Math.round(100 - grouped.reduce((a, f) => a + sev[f.s] * (1 + (f.lines.length - 1) * .25), 0)));
    return { lang, findings: grouped, score };
  }

  // ---------- UI ----------
  const code = $('#code'), gutter = $('#gutter'), findingsEl = $('#findings');
  let lastResult = null;
  function renderGutter(marks = {}) { const n = code.value.split('\n').length; gutter.innerHTML = Array.from({ length: n }, (_, i) => `<span class="${marks[i + 1] || ''}">${i + 1}</span>`).join(''); }
  code.addEventListener('scroll', () => gutter.scrollTop = code.scrollTop);
  code.addEventListener('input', () => { renderGutter(); $('#lang').textContent = detectLang(code.value) === 'py' ? 'PY' : 'JS'; $('#fix').disabled = true; });
  Object.keys(SAMPLES).forEach((k, i) => { const b = document.createElement('button'); b.className = 'tab'; b.textContent = k; b.setAttribute('aria-pressed', String(i === 0)); b.onclick = () => { document.querySelectorAll('.tab').forEach(t => t.setAttribute('aria-pressed', 'false')); b.setAttribute('aria-pressed', 'true'); code.value = SAMPLES[k]; code.dispatchEvent(new Event('input')); resetReview(); }; $('#samples').appendChild(b); });
  code.value = SAMPLES['Корзина (JS)']; renderGutter();
  function resetReview() { findingsEl.innerHTML = '<li class="placeholder">Нажмите «Запустить ревью». Находки появятся здесь с объяснением и готовым исправлением.</li>'; $('#score').textContent = '—'; $('#score-bar').style.strokeDashoffset = 327; $('#legend').innerHTML = ''; $('#run-status').textContent = ''; }

  async function typeInto(el, text) { for (let i = 0; i <= text.length; i += 3) { el.textContent = text.slice(0, i); await sleep(8); } el.textContent = text; }

  $('#run').onclick = async () => {
    const btn = $('#run'); btn.disabled = true; $('#fix').disabled = true; $('#run-status').textContent = 'Читаю код…';
    findingsEl.innerHTML = ''; $('#legend').innerHTML = '';
    const res = analyze(code.value); lastResult = res;
    const marks = {}; res.findings.forEach(f => f.lines.forEach(l => marks[l] = f.s === 'crit' || f.s === 'high' ? 'crit' : 'hit')); renderGutter(marks);
    await sleep(500);
    const counts = {}; res.findings.forEach(f => counts[f.s] = (counts[f.s] || 0) + 1);
    const colors = { crit: 'var(--red)', high: 'var(--red)', med: 'var(--amber)', low: 'var(--blue)', info: 'var(--violet)' };
    $('#legend').innerHTML = Object.entries(counts).map(([s, n]) => `<span><i style="background:${colors[s]}"></i>${label[s]} · ${n}</span>`).join('') || '<span><i style="background:var(--green)"></i>проблем не найдено</span>';
    if (!res.findings.length) findingsEl.innerHTML = '<li class="placeholder">Чисто. Patch не нашёл, к чему придраться. Так бывает.</li>';
    for (const f of res.findings) {
      const li = document.createElement('li'); li.className = 'finding';
      const loc = f.lines.length > 1 ? `${f.lines.length} места · :${f.lines.slice(0, 3).join(' :')}${f.lines.length > 3 ? ' …' : ''}` : `:${f.line}`;
      li.innerHTML = `<header><span class="sev sev-${f.s}">${label[f.s]}</span>${esc(f.t)}<span class="loc">${loc}</span></header><p></p>`;
      findingsEl.appendChild(li); $('#run-status').textContent = `Находка ${findingsEl.children.length} из ${res.findings.length}`;
      await typeInto(li.querySelector('p'), f.d);
      if (f.fix) { const [a, b] = f.fix(f.src); const d = document.createElement('pre'); d.className = 'diff'; d.innerHTML = `<div class="del">- ${esc(a.trim())}</div><div class="add">+ ${esc(b.trim()) || '(удалить строку)'}</div>`; li.appendChild(d); }
      li.scrollIntoView({ block: 'nearest', behavior: 'smooth' });
    }
    // счёт
    const sb = $('#score-bar'); sb.style.stroke = res.score > 75 ? 'var(--green)' : res.score > 45 ? 'var(--amber)' : 'var(--red)'; sb.style.strokeDashoffset = 327 - 327 * res.score / 100;
    countUp($('#score'), res.score, 900);
    $('#run-status').textContent = `Готово: ${res.findings.length} находок, ${res.findings.filter(f => f.fix).length} с автофиксом`;
    btn.disabled = false; $('#fix').disabled = !res.findings.some(f => f.fix);
  };

  $('#fix').onclick = () => {
    if (!lastResult) return;
    const lines = code.value.split('\n'); const fixed = {};
    lastResult.findings.filter(f => f.fix).forEach(f => f.lines.forEach(n => { const [, b] = f.fix(lines[n - 1]); lines[n - 1] = b; fixed[n] = 'fixed'; }));
    code.value = lines.filter((l, i) => !(fixed[i + 1] && l === '')).join('\n');
    renderGutter(); $('#fix').disabled = true; $('#run-status').textContent = `Применено правок: ${Object.keys(fixed).length}. Запустите ревью ещё раз.`;
    findingsEl.innerHTML = '<li class="placeholder">Правки применены. Нажмите «Запустить ревью», чтобы увидеть новый счёт.</li>';
  };
})();
