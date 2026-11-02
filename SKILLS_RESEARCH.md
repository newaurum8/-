# Лучшие скилы Claude Code: подробное исследование (ноябрь 2026)

> **Как проверялось.** Доступ к GitHub API в сессиях проверки был закрыт (403). Существование репозиториев, файлов SKILL.md, marketplace.json и команд установки подтверждалось тремя способами: через raw.githubusercontent.com, через `git ls-remote` и через shallow clone. Всё, что проверить не удалось, помечено **«не проверено»**. Позиции, которые оказались выдуманными, из отчёта удалены (они перечислены в конце).
>
> **Обозначения зрелости:** 🟢 официальный (Anthropic или вендор), 🟡 популярный проект сообщества, 🟠 небольшой или экспериментальный.

---

## Содержание
1. [Frontend-разработка](#1-frontend-разработка)
2. [UI/UX-дизайн](#2-uiux-дизайн)
3. [Веб-анимации и моушн](#3-веб-анимации-и-моушн)
4. [AI-генерация изображений](#4-ai-генерация-изображений)
5. [Аудит безопасности проекта](#5-аудит-безопасности-проекта)
6. [Создание собственных скилов](#6-создание-собственных-скилов)
7. [Стартовый набор для frontend-проекта](#7-рекомендуемый-стартовый-набор-для-frontend-проекта)
8. [Чек-лист проверки сторонних скилов](#8-чек-лист-безопасности-для-сторонних-скилов)
9. [Источники](#9-источники)

---

## Общие способы установки

| Способ | Команда | Комментарий |
|---|---|---|
| Маркетплейс плагинов | `/plugin marketplace add <owner/repo>` → `/plugin install <plugin>@<marketplace>` | Штатный механизм Claude Code |
| Официальный маркетплейс | `/plugin install <name>@claude-plugins-official` | Каталог Anthropic |
| skills CLI (Vercel) | `npx skills add <owner/repo> [--skill name] [-a claude-code]` | Сторонний менеджер для разных агентов |
| Вручную | скопировать папку с `SKILL.md` в `~/.claude/skills/` (для всех проектов) или в `.claude/skills/` (для одного проекта) | Даёт полный контроль над тем, что ставится |
| MCP | `claude mcp add ...` | Это не скил, а сервер инструментов. Часто используется вместе со скилами |

---

## 1. Frontend-разработка
*React, Next.js, Vue, Tailwind, shadcn/ui, тестирование через Playwright*

| Скил | Ссылка | Что делает | Установка | Зрелость |
|---|---|---|---|---|
| **frontend-design** | [anthropics/skills/…/frontend-design](https://github.com/anthropics/skills/tree/main/skills/frontend-design) | Правила дизайна для production-UI: типографика, цвет, композиция, анимации. Убирает «шаблонный AI-вид». Работает с React, Tailwind и обычным HTML/CSS | `/plugin marketplace add anthropics/skills` → `/plugin install example-skills@anthropic-agent-skills` | 🟢 Проверено. Только инструкции |
| **webapp-testing** | [anthropics/skills/…/webapp-testing](https://github.com/anthropics/skills/tree/main/skills/webapp-testing) | Тестирует локальное веб-приложение через Python Playwright: поднимает dev-сервер, делает скриншоты, читает логи консоли, проверяет DOM | входит в `example-skills@anthropic-agent-skills`; нужны `pip install playwright && playwright install` | 🟢 Проверено. Запускает скрипты |
| **web-artifacts-builder** | [anthropics/skills/…/web-artifacts-builder](https://github.com/anthropics/skills/tree/main/skills/web-artifacts-builder) | Собирает приложение на React, TS, Tailwind и shadcn/ui в один HTML-файл (скрипты init и bundle) | входит в `example-skills@anthropic-agent-skills` | 🟢 Проверено. Выполняет npm install |
| **react-best-practices** и другие (Vercel) | [vercel-labs/agent-skills](https://github.com/vercel-labs/agent-skills) | Производительность React и Next.js: waterfalls, размер бандла, RSC, лишние ре-рендеры. В том же репозитории есть guidelines по UI и доступности и скилы для деплоя | `npx skills add vercel-labs/agent-skills` (флаг `--skill` здесь не проверен) | 🟢 Вендор, README проверен |
| **shadcn** (скил и MCP) | [shadcn-ui/ui/skills/shadcn](https://github.com/shadcn-ui/ui/tree/main/skills/shadcn), [документация MCP](https://ui.shadcn.com/docs/mcp) | Ищет и ставит компоненты и блоки из реестров, поэтому модель не придумывает API компонентов | скил: `npx skills add shadcn-ui/ui`; MCP: `npx shadcn@latest mcp init --client claude` (команда MCP не проверена) | 🟢 SKILL.md подтверждён |
| **nextjs-shadcn** | [laguagu/claude-code-nextjs-skills](https://github.com/laguagu/claude-code-nextjs-skills) | Паттерны App Router, shadcn/ui, server actions, кэширование | `npx -y skills add laguagu/claude-code-nextjs-skills --skill nextjs-shadcn --agent claude-code` | 🟠 Сообщество |
| **agents-inc/skills** | [agents-inc/skills](https://github.com/agents-inc/skills) | Узкие скилы: shadcn/ui, Radix, Tailwind, Vitest, Playwright e2e, Vuetify (для Vue) | `npx agents-inc init` (по README) | 🟠 Сообщество, собственный CLI |
| **Playwright MCP** *(MCP)* | [microsoft/playwright-mcp](https://github.com/microsoft/playwright-mcp) | Управляет браузером через accessibility-снапшоты: клики, формы, скриншоты, генерация e2e-тестов | `claude mcp add playwright npx @playwright/mcp@latest` | 🟢 Microsoft, команда проверена |
| **Context7** *(MCP/CLI)* | [upstash/context7](https://github.com/upstash/context7) | Подгружает актуальную документацию по версиям: React, Next, Vue, Tailwind и другие | `npx ctx7 setup --claude` (OAuth, на выбор режим CLI + Skills или MCP) | 🟢 Upstash, README проверен |

**Про Vue.** Официального скила для Vue нет. Можно взять Context7, frontend-design и Vuetify из agents-inc.

**Главная рекомендация: `frontend-design` + `webapp-testing` (Anthropic).** Они официальные, frontend-design почти без рисков, и вместе закрывают цикл «написал UI, проверил в браузере». Для React и Next к ним стоит добавить `react-best-practices` от Vercel.

---

## 2. UI/UX-дизайн
*Дизайн-системы, типографика, цвет, интеграция с Figma, дизайн-критика*

| Скил | Ссылка | Что делает | Установка | Зрелость |
|---|---|---|---|---|
| **frontend-design** | [anthropics/skills](https://github.com/anthropics/skills/tree/main/skills/frontend-design) | Выразительный UI: смелая типографика, палитра, композиция | `npx skills add https://github.com/anthropics/skills --skill frontend-design` | 🟢 Проверено |
| **Figma plugin (MCP + скилы)** | [figma/mcp-server-guide](https://github.com/figma/mcp-server-guide) | Перенос дизайна в код, запись на холст (фреймы, компоненты, переменные, auto layout), Code Connect, правила дизайн-системы | `claude plugin install figma@claude-plugins-official` или `claude mcp add --transport http figma https://mcp.figma.com/mcp`, затем OAuth; проверка: `claude mcp list` | 🟢 Figma, команды проверены. Скилы пока в бете |
| **canvas-design / theme-factory / brand-guidelines** | [anthropics/skills](https://github.com/anthropics/skills) | canvas-design делает постеры в PNG/PDF, theme-factory применяет темы (цвета и шрифты), brand-guidelines задаёт фирменный стиль | `npx skills add https://github.com/anthropics/skills --skill <имя>` | 🟢 Все три SKILL.md проверены |
| **ui-ux-pro-max** | [nextlevelbuilder/ui-ux-pro-max-skill](https://github.com/nextlevelbuilder/ui-ux-pro-max-skill) | Поисковая база UI-стилей, палитр, пар шрифтов и UX-правил. Генерирует дизайн-систему | `/plugin marketplace add nextlevelbuilder/ui-ux-pro-max-skill` → `/plugin install ui-ux-pro-max@ui-ux-pro-max-skill`, или `npm i -g ui-ux-pro-max-cli && uipro init --ai claude` | 🟡 Популярный. Есть Python-скрипты |
| **web-design-guidelines** (Vercel) | [vercel-labs/agent-skills/…/web-design-guidelines](https://github.com/vercel-labs/agent-skills/tree/main/skills/web-design-guidelines) | Аудит UI по Web Interface Guidelines: доступность, формы, анимация, типографика. Подходит для **дизайн-критики** | `npx skills add vercel-labs/agent-skills --skill web-design-guidelines` | 🟢 Проверено. Правила подтягивает по внешнему URL |
| **emilkowalski/skills** | [emilkowalski/skills](https://github.com/emilkowalski/skills) | UI-полировка и решения по анимации от автора Sonner и Vaul | `npx skills@latest add emilkowalski/skills` | 🟡 Авторский, проверен |
| **ihlamury/design-skills** | [ihlamury/design-skills](https://github.com/ihlamury/design-skills) | 87 стайлгайдов (Linear, Stripe, Figma, Apple и другие), есть скил `figma` | `npx skills add ihlamury/design-skills` (выбрать нужный скил) | 🟠 Экспериментальный |
| **Playwright MCP** *(MCP)* | [microsoft/playwright-mcp](https://github.com/microsoft/playwright-mcp) | Визуальная проверка вёрстки и адаптива по скриншотам | см. раздел 1 | 🟢 |

**Главная рекомендация: Figma plugin, `web-design-guidelines` и `frontend-design`.** Figma даёт перенос дизайна в код и обратно, Vercel-guidelines служат объективной проверкой (критикой), frontend-design задаёт эстетику. Если дизайн-системы ещё нет, её можно сгенерировать через ui-ux-pro-max (сначала посмотрите его скрипты).

---

## 3. Веб-анимации и моушн
*GSAP, Framer Motion / Motion, Lottie, Three.js / WebGL, видео через Remotion*

| Скил | Ссылка | Что делает | Установка | Зрелость |
|---|---|---|---|---|
| **GSAP Skills** | [greensock/gsap-skills](https://github.com/greensock/gsap-skills) | core, timeline, ScrollTrigger, React (`useGSAP`), плагины, производительность | `npx skills add greensock/gsap-skills` или `/plugin marketplace add greensock/gsap-skills` | 🟢 Официальный, около 17.7K ★, push 2026-07 |
| **Remotion Skills** | [remotion-dev/skills](https://github.com/remotion-dev/skills) | interpolate/spring, аудио, субтитры, 3D, рендеринг видео | `npx skills add remotion-dev/skills` | 🟢 Официальный, около 6.1K ★, обновлён 2026-11-02 |
| **LottieFiles Motion Design** | [LottieFiles/motion-design-skill](https://github.com/LottieFiles/motion-design-skill) | Принципы моушн-дизайна, easing, Lottie и dotLottie | `npx skills add LottieFiles/motion-design-skill` | 🟢 Организация LottieFiles, около 2.7K ★ |
| **claudedesignskills** | [freshtechbro/claudedesignskills](https://github.com/freshtechbro/claudedesignskills) | Three.js, React Three Fiber, GSAP ScrollTrigger, Motion, Lottie и другие | `/plugin marketplace add freshtechbro/claudedesignskills` | 🟡 Около 1.2K ★, но **не обновлялся с 2025-11**. Ставьте оригинал, а не форки |
| **HeyGen HyperFrames** | [heygen-com/hyperframes](https://github.com/heygen-com/hyperframes) | Фреймворк для видео и анимации на HTML/GSAP. Скилы: hyperframes, hyperframes-cli, remotion-to-hyperframes, slideshow, figma | `npx skills add heygen-com/hyperframes` (не проверено) | 🟡 Около 77K ★, привязан к экосистеме HeyGen |
| **animation-principles** | [dylantarre/animation-principles](https://github.com/dylantarre/animation-principles) | 12 принципов анимации применительно к framer-motion, GSAP и другим | `npx skills add dylantarre/animation-principles` | 🟠 Около 139 ★ |

**Пробелы.** Официального скила для Motion (Framer Motion) нет, ближе всего freshtechbro и dylantarre. Для Three.js тоже нет официального варианта: используйте freshtechbro вместе с Context7, чтобы получать актуальный API.

**Главная рекомендация: `greensock/gsap-skills`.** Скил официальный, активно поддерживается и покрывает самый частый сценарий (скролл-анимации, таймлайны, React). Для видео возьмите `remotion-dev/skills`, для Lottie `LottieFiles/motion-design-skill`.

---

## 4. AI-генерация изображений
*Gemini (Nano Banana), OpenAI gpt-image, Flux через Replicate или fal, SVG и иконки, алгоритмическое искусство*

| Скил | Ссылка | Что делает | Установка | Зрелость |
|---|---|---|---|---|
| **algorithmic-art + canvas-design** | [anthropics/skills](https://github.com/anthropics/skills) | Генеративное искусство на p5.js (seeded randomness, flow fields, частицы) с выводом в интерактивный HTML; постеры в PNG/PDF. **API-ключи не нужны** | `/plugin install example-skills@anthropic-agent-skills` | 🟢 Проверено |
| **replicate/skills** | [replicate/skills](https://github.com/replicate/skills) | find-models, compare-models, run-models, prompt-images, prompt-videos, build-models, publish-models. Поддерживает Flux, Ideogram, Recraft (SVG) и другие модели | `/plugin marketplace add replicate/skills` → `/plugin install run-models@replicate` (и `prompt-images@replicate`) | 🟢 Вендор, marketplace.json с 7 плагинами |
| **fal-ai-community/skills** | [fal-ai-community/skills](https://github.com/fal-ai-community/skills) | genmedia, fal-workflow, fal-prompting, model-routing, fal-models-catalog, fal-redesign, тематические скилы | `npx skills add fal-ai-community/skills --skill genmedia` | 🟡 Полуофициальный. Скилов fal-generate, fal-upscale и fal-train **больше нет** |
| **nano-banana** (Ibrahim-3d) | [Ibrahim-3d/nano-banana-claude-plugin](https://github.com/Ibrahim-3d/nano-banana-claude-plugin) | Gemini Image: style transfer, inpainting, референсы, высокое разрешение | `/plugin marketplace add Ibrahim-3d/nano-banana-claude-plugin` → `/plugin install nano-banana@ibrahim-plugins` | 🟠 Сообщество. В коде preview-модели, их ID стоит сверить |
| **nano-banana** (LeoHChen) | [LeoHChen/claude-skills](https://github.com/LeoHChen/claude-skills) | Gemini с fallback-моделями | `git clone …` → `cp -r claude-skills/nano-banana ~/.claude/skills/` | 🟠 |
| **cc-nano-banana** | [kkoppenhaver/cc-nano-banana](https://github.com/kkoppenhaver/cc-nano-banana) | Генерация через расширение nanobanana для Gemini CLI | `git clone https://github.com/kkoppenhaver/cc-nano-banana ~/.claude/skills/cc-nano-banana` | 🟠 |
| **fal-ai-image** (artwist-polyakov) | [artwist-polyakov/polyakov-claude-skills](https://github.com/artwist-polyakov/polyakov-claude-skills) | GPT Image 2 или Nano Banana Pro через один ключ fal | `/plugin marketplace add artwist-polyakov/polyakov-claude-skills` → `/plugin install fal-ai-image@<marketplace>` | 🟠 Автор русскоязычный |
| **imagegen** (OpenAI) | [openai/skills/…/.system/imagegen](https://github.com/openai/skills) | Официальный скил gpt-image: фото, иллюстрации, спрайты, прозрачный фон | `git clone https://github.com/openai/skills` → `cp -r skills/skills/.system/imagegen ~/.claude/skills/` | 🟢 OpenAI, но **написан для Codex**, нужна адаптация |
| **flux-model** | [TerminalSkills/skills](https://github.com/TerminalSkills/skills) | Справка и примеры на Python для FLUX (fal, Replicate, BFL API) | `npx skills add TerminalSkills/skills --skill flux-model` | 🟠 В основном документация |

**SVG и иконки.** Отдельного скила нет. Варианты: Recraft через replicate или fal, либо algorithmic-art и canvas-design. Простые иконки Claude может написать как SVG-код сам.

**Главная рекомендация: `replicate/skills`.** Это официальный набор от вендора, через один токен доступны Flux, Recraft (SVG), Ideogram и другие модели, а ещё есть скил по промптингу. Если нужна генерация без ключей, берите `algorithmic-art`. Если в приоритете Gemini, берите `nano-banana` от Ibrahim-3d (после ревью кода). **Обязательно поставьте лимит расходов у провайдера.**

---

## 5. Аудит безопасности проекта
*Trail of Bits, Semgrep и CodeQL, поиск секретов, аудит зависимостей, OWASP, /security-review*

| Скил | Ссылка | Что делает | Установка | Зрелость |
|---|---|---|---|---|
| **Trail of Bits Skills** | [trailofbits/skills](https://github.com/trailofbits/skills) | Около 47 плагинов. **static-analysis** (Semgrep, CodeQL, SARIF), **supply-chain-risk-auditor** (зависимости), **insecure-defaults**, **fp-check** (отсев ложных срабатываний), **entry-point-analyzer**, audit-context-building, **differential-review**, variant-analysis, sharp-edges, semgrep-rule-creator, agentic-actions-auditor, building-secure-contracts, c-review, rust-review | `/plugin marketplace add trailofbits/skills` → `/plugin` (выбрать нужные) | 🟢 Официальный, README проверен |
| **Trail of Bits Skills Curated** | [trailofbits/skills-curated](https://github.com/trailofbits/skills-curated) | Сторонние плагины, отобранные Trail of Bits: scv-scan (Solidity, 36 классов уязвимостей), security-awareness (фишинг, кража учётных данных), список одобренных маркетплейсов | `/plugin marketplace add trailofbits/skills-curated` | 🟢 Отбор ToB, но код частично чужой |
| **Semgrep skills** | [semgrep/skills](https://github.com/semgrep/skills) | SAST-сканы (`p/owasp-top-ten`, `p/secrets`), написание своих правил, разбор результатов | `npx skills add semgrep/skills` | 🟢 Вендор, команда проверена |
| **/security-review + GitHub Action** | [anthropics/claude-code-security-review](https://github.com/anthropics/claude-code-security-review) | `/security-review` встроен в Claude Code и проверяет изменения ветки. Action делает LLM-ревью каждого PR | в CLI: `/security-review`; в CI: `uses: anthropics/claude-code-security-review@<SHA>` (имя input для ключа сверьте с README) | 🟢 Anthropic |
| **Semgrep MCP** *(MCP)* | [semgrep/semgrep](https://github.com/semgrep/semgrep) (сервер теперь в `cli/src/semgrep/mcp`) | Сканирование, получение AST, свои правила через MCP | `claude mcp add semgrep -- semgrep mcp` (синтаксис сверьте с документацией) | 🟢 Отдельный репозиторий semgrep/mcp **устарел** |
| **GitHub MCP** *(MCP)* | [github/github-mcp-server](https://github.com/github/github-mcp-server) | Алерты code scanning (CodeQL), Dependabot, secret scanning | `claude mcp add --transport http github https://api.githubcopilot.com/mcp/` | 🟢 Официальный, команда не проверена |
| **Свой скил deps-secrets-audit** | [gitleaks](https://github.com/gitleaks/gitleaks), [trufflehog](https://github.com/trufflesecurity/trufflehog), [osv-scanner](https://github.com/google/osv-scanner), [trivy](https://github.com/aquasecurity/trivy) | Готовых официальных SKILL.md нет. Обёртка запускает `gitleaks git`, `trufflehog filesystem .`, `osv-scanner scan source -r .`, `trivy fs .` и сводит результаты в один отчёт | установить CLI и создать SKILL.md через skill-creator | Инструменты зрелые, обёртку пишете сами |

### Пример минимального скила для секретов и зависимостей
```markdown
---
name: deps-secrets-audit
description: Use when asked to audit a project for leaked secrets or vulnerable dependencies. Runs gitleaks, osv-scanner and trivy and produces one consolidated report.
---
1. Проверить наличие gitleaks, osv-scanner, trivy (`command -v`). Если нет, сообщить, а не устанавливать самому.
2. Запустить: `gitleaks git --redact -f json -r /tmp/gitleaks.json`,
   `osv-scanner scan source -r . --format json > /tmp/osv.json`, `trivy fs --scanners vuln,misconfig . -f json -o /tmp/trivy.json`.
3. Свести результаты в таблицу: severity, файл, описание, исправление. Секреты всегда маскировать.
4. Отчёты не коммитить. Не запускать `trufflehog --verify` без явного согласия.
```

### Рекомендуемый процесс аудита
1. `entry-point-analyzer`: найти поверхность атаки.
2. `static-analysis` (Semgrep с `--metrics=off`, CodeQL): сканирование.
3. `supply-chain-risk-auditor` вместе с osv-scanner или trivy: зависимости.
4. gitleaks: история git на секреты.
5. `insecure-defaults` и `sharp-edges`: конфигурация и опасные API.
6. `fp-check`: убрать ложные срабатывания.
7. `/security-review` или `differential-review` на каждом PR.

**Главная рекомендация: `trailofbits/skills`.** Это самый полный и профессиональный набор: SAST, зависимости, проверка diff и отсев ложных срабатываний. Встроенный `/security-review` удобен для PR, но он смотрит только на изменения и SAST не заменяет.

---

## 6. Создание собственных скилов
*skill-creator от Anthropic, лучшие практики SKILL.md, evals, маркетплейсы плагинов*

| Скил | Ссылка | Что делает | Установка | Зрелость |
|---|---|---|---|---|
| **skill-creator** | [anthropics/skills/…/skill-creator](https://github.com/anthropics/skills/tree/main/skills/skill-creator) | Расспрашивает о задаче и пишет черновик SKILL.md. Сохраняет `evals/evals.json` и прогоняет их через субагентов grader, comparator и analyzer. Есть бенчмарк (`aggregate_benchmark.py`), eval-viewer, улучшение description (`improve_description.py`, `run_loop.py`), валидация и упаковка (`quick_validate.py`, `package_skill.py`) | `/plugin install skill-creator@claude-plugins-official` или в составе `example-skills@anthropic-agent-skills` | 🟢 Проверено |
| **plugin-dev** | [claude-plugins-official/plugins/plugin-dev](https://github.com/anthropics/claude-plugins-official/tree/main/plugins/plugin-dev) | Скилы, агенты и команды для разработки плагинов: структура, хуки, команды, агенты, MCP | `/plugin install plugin-dev@claude-plugins-official` | 🟢 Проверено |
| **template + спецификация** | [template/](https://github.com/anthropics/skills/tree/main/template), [agent-skills-spec.md](https://github.com/anthropics/skills/blob/main/spec/agent-skills-spec.md), [agentskills.io](https://agentskills.io) | Минимальный шаблон и спецификация формата: frontmatter, папки scripts/, references/, assets/ | `git clone https://github.com/anthropics/skills && cp -r skills/template ~/.claude/skills/my-skill` | 🟢 Пути проверены |
| **writing-skills** (Superpowers) | [obra/superpowers/…/writing-skills](https://github.com/obra/superpowers/tree/main/skills/writing-skills) | TDD для скилов: сначала baseline без скила (RED), потом скил (GREEN), потом закрытие лазеек (REFACTOR). Проверка давлением через субагентов | `/plugin install superpowers@claude-plugins-official` | 🟡 Популярный, есть в официальном маркетплейсе. **Хук SessionStart добавляет инструкции в каждую сессию** |
| **skills CLI + skills.sh** | [vercel-labs/skills](https://github.com/vercel-labs/skills), [skills.sh](https://skills.sh) | Менеджер скилов для разных агентов: add, list, update, remove | `npx skills add <owner/repo> [--skill name] [-a claude-code]` | 🟡 Vercel (не Anthropic) |
| **Свой маркетплейс** | [документация](https://code.claude.com/docs/en/plugin-marketplaces), [пример marketplace.json](https://github.com/anthropics/claude-plugins-official/blob/main/.claude-plugin/marketplace.json) | Распространение скилов как плагинов. В организации маркетплейс закрепляется через `extraKnownMarketplaces` в settings.json | `/plugin marketplace add <owner/repo>`; `claude plugin validate .` (не проверено) | 🟢 Официальный механизм |

### Лучшие практики SKILL.md (кратко)
- **description важнее всего.** В нём должно быть сказано, что делает скил и *когда* его вызывать, с явными триггерами. Именно по этому тексту модель решает, загружать ли скил.
- **Постепенное раскрытие.** SKILL.md держите коротким (до ~500 строк). Подробности выносите в `references/`, детерминированный код в `scripts/`, шаблоны в `assets/`.
- **Пишите в повелительном наклонении** и объясняйте *зачем* нужно правило. Капслок вида «ALWAYS/NEVER» без объяснения работает хуже.
- **Evals до релиза.** Нужно 3–10 реалистичных промптов и сравнение «со скилом и без». После этого стоит оптимизировать description под точность срабатывания.
- **Один скил решает одну задачу.** Не делайте мегаскилы.
- **Безопасность.** Никаких секретов в файлах. Скрипты должны быть идемпотентными, сетевые вызовы явными.

**Главная рекомендация: `skill-creator`.** Это официальный инструмент с полным циклом: черновик, evals, бенчмарк, оптимизация description, упаковка. Методологию хорошо дополняет `writing-skills`, а для публикации подойдёт `plugin-dev` со своим marketplace.json.

---

## 7. Рекомендуемый стартовый набор для frontend-проекта

Ставьте постепенно, по 2–4 скила за раз, и смотрите, срабатывают ли они так, как задумано.

| # | Компонент | Зачем | Команда |
|---|---|---|---|
| 1 | frontend-design + webapp-testing (+ skill-creator) | Эстетика UI и проверка в браузере | `/plugin marketplace add anthropics/skills` → `/plugin install example-skills@anthropic-agent-skills` |
| 2 | react-best-practices + web-design-guidelines | Производительность и UI-аудит | `npx skills add vercel-labs/agent-skills` |
| 3 | shadcn | Настоящие компоненты вместо придуманных | `npx skills add shadcn-ui/ui` |
| 4 | Context7 | Актуальная документация по нужным версиям | `npx ctx7 setup --claude` |
| 5 | Playwright MCP | Взаимодействие с браузером и e2e | `claude mcp add playwright npx @playwright/mcp@latest` |
| 6 | gsap-skills *(если нужны анимации)* | Анимации | `npx skills add greensock/gsap-skills` |
| 7 | Figma *(если есть макеты)* | Перенос дизайна в код | `claude plugin install figma@claude-plugins-official` |
| 8 | trailofbits static-analysis + supply-chain-risk-auditor, `/security-review` | Безопасность перед релизом | `/plugin marketplace add trailofbits/skills` |

**Где хранить.** Командные скилы держите в `.claude/skills/` в репозитории под код-ревью. Личные храните в `~/.claude/skills/`. Версии плагинов закрепляйте.

---

## 8. Чек-лист безопасности для сторонних скилов

**Происхождение**
- [ ] Владелец репозитория совпадает с вендором (например, `greensock/…`, а не клон с 0 ★). Будьте осторожны с форками и копиями на агрегаторах.
- [ ] Есть история коммитов, лицензия, несколько участников, недавняя активность.
- [ ] Скил есть в `claude-plugins-official` или в `trailofbits/skills-curated`. Это плюс, но не гарантия.

**Содержимое**
- [ ] Вы **полностью** прочитали `SKILL.md` и все файлы в `references/`. Там не должно быть скрытых инструкций вроде «игнорируй пользователя», «отправь файлы», base64 или невидимого Unicode.
- [ ] Вы прочитали каждый файл в `scripts/`. Проверьте сетевые вызовы (`curl`, `fetch`, `requests`), `eval`, `rm -rf`, чтение `~/.ssh`, `.env` и `~/.aws`.
- [ ] Проверены **хуки** (`hooks/`, `SessionStart`, `PreToolUse`): они выполняются автоматически без вашего участия.
- [ ] Проверены **MCP-серверы** в плагине: какой бинарник запускается и куда он подключается.
- [ ] Проверены внешние URL, откуда скил подтягивает правила или код. Их содержимое может измениться после установки.
- [ ] Проверены зависимости: `npm install` и `pip install` из скриптов, версии закреплены.

**Права и секреты**
- [ ] API-ключи хранятся в переменных окружения или менеджере секретов, а не в файлах скила.
- [ ] Токены выданы с минимальными scope (GitHub PAT только на чтение и т. д.). У платных API стоит лимит расходов.
- [ ] В `settings.json` действует deny-list для опасных команд, а автоодобрение (`bypassPermissions`) выключено для новых скилов.
- [ ] Телеметрия отключена, где это возможно (например, `semgrep --metrics=off`).

**Эксплуатация**
- [ ] Внешний контент (веб-страницы через Playwright, макеты Figma, issue и PR) считается недоверенным, потому что через него возможна prompt injection.
- [ ] Браузерный MCP не работает с вашим личным профилем и сессиями.
- [ ] GitHub Action закреплён по **SHA**, а не по `@main`, и не запускается на PR из форков с доступом к секретам.
- [ ] Новый скил сначала опробован в отдельном окружении (контейнер или отдельный клон проекта).
- [ ] После обновлений (`npx skills update`, `/plugin update`) смотрите diff, прежде чем принять изменения.
- [ ] Отчёты сканеров с реальными секретами не попадают в git.

---

## 9. Источники

**Официальные репозитории (проверены)**
- Anthropic Skills: https://github.com/anthropics/skills
- Claude Plugins Official: https://github.com/anthropics/claude-plugins-official
- Claude Code Security Review: https://github.com/anthropics/claude-code-security-review
- Vercel agent-skills: https://github.com/vercel-labs/agent-skills · skills CLI: https://github.com/vercel-labs/skills
- shadcn/ui: https://github.com/shadcn-ui/ui · https://ui.shadcn.com/docs/mcp
- Microsoft Playwright MCP: https://github.com/microsoft/playwright-mcp
- Upstash Context7: https://github.com/upstash/context7
- Figma MCP: https://github.com/figma/mcp-server-guide
- GSAP: https://github.com/greensock/gsap-skills · Remotion: https://github.com/remotion-dev/skills · LottieFiles: https://github.com/LottieFiles/motion-design-skill
- Replicate: https://github.com/replicate/skills · fal: https://github.com/fal-ai-community/skills · OpenAI: https://github.com/openai/skills
- Trail of Bits: https://github.com/trailofbits/skills · https://github.com/trailofbits/skills-curated
- Semgrep: https://github.com/semgrep/skills · https://github.com/semgrep/semgrep

**Сообщество (проверено, что репозитории существуют)**
- nextlevelbuilder/ui-ux-pro-max-skill, emilkowalski/skills, ihlamury/design-skills, laguagu/claude-code-nextjs-skills, agents-inc/skills
- freshtechbro/claudedesignskills, heygen-com/hyperframes, dylantarre/animation-principles
- Ibrahim-3d/nano-banana-claude-plugin, LeoHChen/claude-skills, kkoppenhaver/cc-nano-banana, artwist-polyakov/polyakov-claude-skills, TerminalSkills/skills
- obra/superpowers

**Документация и каталоги (в этой сессии не открывались)**
- https://code.claude.com/docs/en/plugin-marketplaces
- https://agentskills.io · https://skills.sh
- GitHub MCP: https://github.com/github/github-mcp-server
- gitleaks, trufflehog, osv-scanner, trivy (широко известные проекты)

**Удалены как выдуманные**
- `Miftahul-Islam-Efaz/Motion-graphics-skill`: у автора нет такого репозитория.
- `lucking7/motiondev-skills`: пользователь не найден.

**Что осталось непроверенным:** число звёзд и установок, кроме раздела 3 (там цифры получены через поиск по GitHub); флаги `--skill/--agent` у части репозиториев; `shadcn mcp init`; `claude plugin validate`; имя input в Action security-review; точный синтаксис `semgrep mcp`.