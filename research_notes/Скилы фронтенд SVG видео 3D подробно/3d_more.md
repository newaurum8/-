# 3D для Claude Code, раунд 2: закрытие пробелов раунда 1 и новые MCP/скилы (движки, DCC/CAD, web 3D, 3D-печать, бенчмарки), октябрь 2026

> **Как собирались данные (2026-10-19).**
> - Официальные сайты (docs.unity3d.com, dev.epicgames.com, create.roblox.com, hyper3d.ai, threejs.org, blender.org, projects.blender.org, sketchup.trimble.com, help.sketchup.com, onshape.com, arxiv.org, mcneel.github.io) из сессии **не открывались**: WebFetch давал `ENOTFOUND`, прокси отвечал 403 или таймаутом. Всё, что про них сказано, взято из **поисковых выдержек** с этих доменов и помечено «(выдержка)».
> - Первоисточники, которые реально читались: `raw.githubusercontent.com` (README и docs репозиториев), npm registry API (`registry.npmjs.org`, README пакетов, версии, даты), PyPI JSON API и локальный клон зеркала Blender Lab из раунда 1.
> - Звёзды взяты из GitHub Search через GitHub MCP. Колонка «upd» означает `updated_at` репозитория. Это прокси активности (меняется и от звёзд), а не дата коммита.
> - Версии и даты релизов взяты из npm/PyPI. Официальный MCP Registry (`registry.modelcontextprotocol.io`) не ответил за 40 с.
> - «Сверено с README» означает: команда дословно взята из README или docs проекта, но **не запускалась**. «Сконструировано» означает вывод автора заметок.

## 1. Закрытие пробелов раунда 1: официальный Unity MCP, Epic Unreal MCP, Hyper3D Rodin, версия и инструменты Blender Lab MCP

### Takeaway
Все четыре пробела закрыты, но по-разному.
- **Unity**: в Claude Code прописывается relay-бинарник `~/.unity/relay/...` с аргументом `--mcp`, первое подключение нужно подтвердить в Project Settings.
- **Epic**: консольная команда `ModelContextProtocol.GenerateClientConfig ClaudeCode` сама пишет `.mcp.json` в корень проекта.
- **Hyper3D**: hosted MCP подключается командой `claude mcp add --transport http hyper3d-rodin --scope user https://api.hyper3d.com/api/mcp` с OAuth через браузер. Появился ещё официальный `@hyper3d/cli` (Rodin Gen-2.5), удобный для Claude Code через Bash.
- **Blender Lab MCP**: upstream add-on v1.0.3 (нужен Blender 5.1+), сервер на ветке 1.0.2+ с пином `mcp<2`, 26 инструментов (20 базовых и 6 `_for_cli`). Официальная установка сервера: `pip install git+https://projects.blender.org/lab/blender_mcp.git#subdirectory=mcp`.

### Cited Findings

**A. Официальный Unity MCP (пакет AI Assistant, `com.unity.ai.assistant@2.0`)**
- Relay-бинарник автоматически ставится в `~/.unity/relay/` при старте редактора: «This is the executable that MCP clients launch». Путь для macOS (Apple Silicon): `~/.unity/relay/relay_mac_arm64.app/Contents/MacOS/relay_mac_arm64`. В документации есть JSON-пример для Claude Code: в `mcpServers` сервер `"unity-mcp"`, `command` = путь к relay, `args: ["--mcp"]` — [Unity docs: unity-mcp-get-started (выдержка)](https://docs.unity3d.com/Packages/com.unity.ai.assistant@2.0/manual/unity-mcp-get-started.html)
- Пути для других ОС: Windows `%USERPROFILE%\.unity\relay\relay_win.exe`, Linux `~/.unity/relay/relay_linux` — [Unity docs: troubleshooting (выдержка)](https://docs.unity3d.com/Packages/com.unity.ai.assistant@2.0/manual/unity-mcp-troubleshooting.html). В китайской версии блога Unity бинарник для Linux назван `Relay_Linux` с заглавной буквы, поэтому регистр на Linux надо проверить — [Unity blog CN (выдержка)](https://unity.com/cn/blog/unity-ai-mcp-how-to-get-started)
- Первое подключение: Unity показывает «pending connection». Нужно открыть Edit > Project Settings > AI > Unity MCP, проверить данные клиента и нажать **Accept**. Раздел Integrations умеет настраивать поддерживаемые клиенты автоматически — [Unity docs (выдержка)](https://docs.unity3d.com/Packages/com.unity.ai.assistant@2.0/manual/unity-mcp-get-started.html)
- Если relay-бинарника нет: его копирует ServerInstaller при старте редактора; кнопка **Locate Server** в настройках Unity MCP находит бинарник внутри пакета — [Unity docs: troubleshooting (выдержка)](https://docs.unity3d.com/Packages/com.unity.ai.assistant@2.0/manual/unity-mcp-troubleshooting.html)
- Известный баг: на macOS прямое relay-подключение обрывается с ошибкой «no stable connected client is registered in Unity», на Windows 11 не воспроизводится. Обходной путь — подключение через шлюз Unity Assistant — [Unity Issue Tracker](https://issuetracker.unity.com/issues/9369/relay-error-no-stable-connected-client-is-registered-in-unity-is-thrown-when-configuring-an-external-mcp-client)

**B. Официальный Epic «Unreal MCP» (UE 5.8, experimental)**
- Порядок настройки:
  1. Запустить сервер: Auto Start Server или консольная команда `ModelContextProtocol.StartServer`.
  2. В консоли редактора выполнить `ModelContextProtocol.GenerateClientConfig ClaudeCode`. Команда пишет `.mcp.json` в корень проекта «with the correct entry pointing at the running server».
  3. Запускать Claude Code из того каталога, где появился `.mcp.json`.

  Поддерживаемые имена клиентов: `ClaudeCode`, `Cursor`, `VSCode`, `Gemini`, `Codex`, `All` — [Epic docs: Unreal MCP in Unreal Editor (выдержка)](https://dev.epicgames.com/documentation/unreal-engine/unreal-mcp-in-unreal-editor)
- Сгенерированная запись, по стороннему пересказу: HTTP-сервер `unreal-mcp`, `"type": "http"`, `"url": "http://127.0.0.1:8000/mcp"` — [a2a-mcp.org (вторичный)](https://a2a-mcp.org/entry/ue-5-8-mcp)
- Архитектура (сторонний гайд): Toolset Registry и слой «AllToolsets / individual toolsets», транспорт MCP over Streamable HTTP на локальном `/mcp` (порт 8000 на диаграмме). Сам Epic предупреждает, что API и форматы данных могут меняться — [DEV Community (вторичный)](https://dev.to/gamedevtoollab/using-unreal-mcp-in-ue-58-from-codex-setup-toolsets-and-safe-editor-automation-4pon)
- Сторонний helper-плагин на Fab перечисляет нужные плагины: Model Context Protocol (Unreal MCP), Toolset Registry через зависимость All Toolsets, All Toolsets и Unreal Terminal. Автор пишет, что его helper проверен только на Win64 — [Fab listing](https://www.fab.com/listings/651ed47d-db10-4dfa-9a6c-b8080d0d6b8e?lang=es-es), [Unreal forum](https://forums.unrealengine.com/t/free-ue-5-8-plugin-guided-setup-for-epic-s-native-mcp-workflow/2832596)

**C. Hyper3D Rodin: hosted MCP, новый CLI и plugin со скилом**
- Hosted MCP: `claude mcp add --transport http hyper3d-rodin --scope user https://api.hyper3d.com/api/mcp`, затем авторизация командой `claude mcp login hyper3d-rodin`. По описанию страницы, Claude Code откроет браузер, там выбирается billing workspace, а статус проверяется через `/mcp`. Для Codex: `codex mcp add hyper3d-rodin --url https://api.hyper3d.com/api/mcp` и `codex mcp login hyper3d-rodin` («No API key required») — [hyper3d.ai/features/mcp (выдержка)](https://hyper3d.ai/features/mcp), [hyper3d.ai/features/mcp/mcp-codex (выдержка)](https://hyper3d.ai/features/mcp/mcp-codex)
- **Новое: `@hyper3d/cli`**, официальный (репозиторий `DeemosTech/hyper3d-cli`, описание в npm «Hyper3D CLI backed by MCP»). Версия 0.2.0 от 2026-09-23, пакет создан 2026-09-22 — [npm](https://www.npmjs.com/package/@hyper3d/cli), [GitHub](https://github.com/DeemosTech/hyper3d-cli). По README:
  - нужен Node.js 22+; установка `npm install --global @hyper3d/cli@latest`, вход `hyper3d auth login` (с флагом `--no-browser` для удалённой машины); токены хранятся в `~/.hyper3d`;
  - генерация: `hyper3d generate --prompt "a ceramic teapot" --format glb` или `--image ./reference.png` (от 1 до 5 изображений);
  - тиры `Gen-2.5-Medium` / `Gen-2.5-High` / `Gen-2.5-Extreme-Low`; `--mesh-mode Raw|Quad`; `--quality` задаёт число полигонов (Raw от 500 до 1 000 000, Quad от 1 000 до 50 000);
  - форматы `glb`, `usdz`, `fbx`, `obj`, `stl`;
  - отслеживание: `hyper3d status|poll|result <generation-id>`. Команда `result` отдаёт только URL и файлы не скачивает;
  - разбиение на части: `hyper3d bang <id> --instruction "separate the handle and lid"`;
  - вывод для скриптов: `--output json`;
  - «the CLI never retries billable generation automatically».
- **rodin3d-skills (DeemosTech)**. Это Claude Code plugin со скилом, MCP-сервера в нём нет. Установка: `/plugin marketplace add DeemosTech/rodin3d-skills`, затем `/plugin install rodin3d-skill@rodin3d-skills`, затем `pip install requests pillow` и `export HYPER3D_API_KEY=...`. Вызывается как `/rodin3d-skill` — [GitHub README](https://github.com/DeemosTech/rodin3d-skills)

**D. Blender Lab MCP: версия, инструменты, установка**
- Официальный README сервера (`mcp/README.md` в зеркале upstream) — [зеркало SJJ-universe/blender-lab-mcp](https://github.com/SJJ-universe/blender-lab-mcp):
  - сервер ставится командой `pip install git+https://projects.blender.org/lab/blender_mcp.git#subdirectory=mcp`;
  - add-on ставится через extensions-репозиторий Blender Lab `https://lab.blender.org/`;
  - консольный скрипт называется `blender-mcp` (`[project.scripts] blender-mcp = "blmcp:main"`);
  - API и пользовательский мануал Blender встроены в сервер как ресурсы.
- Версии:
  - **add-on v1.0.3** требует Blender 5.1+. Это подтверждает форк `jordansoftware/blender-mcp-legacy`, описанный как «unofficial, minimally patched build of Blender Lab MCP v1.0.3» для Blender 4.2–4.5 и Intel Mac — [GitHub](https://github.com/jordansoftware/blender-mcp-legacy);
  - **сервер 1.0.2** с зависимостью `mcp[cli]>=1.2.0,<2` виден в зеркале от 2026-09-17 — [leolee9086/blender_mcp](https://github.com/leolee9086/blender_mcp). Это совпадает со вторичной хронологией: v1.0.2 от 08.09.2026 «Pins the MCP SDK below 2», v1.0.3 от 11.09.2026 с фиксом захвата скриншотов — [StraySpark (вторичный)](https://www.strayspark.studio/blog/official-blender-mcp-server-comparison-2026).
- **26 инструментов** (подсчёт по модулям `mcp/blmcp/tools/` в зеркале v1.0.0, совпадает с цифрой StraySpark) — [зеркало](https://github.com/SJJ-universe/blender-lab-mcp):
  - выполнение кода: `execute_blender_code`;
  - сводки по файлу: `get_blendfile_summary_datablocks`, `_missing_files`, `_of_linked_libraries`, `_path_info`, `_usage_guess`;
  - объекты: `get_objects_summary`, `get_object_detail_summary`;
  - документация: `get_python_api_docs`, `search_api_docs`, `search_manual_docs`;
  - скриншоты: `get_screenshot_of_area_as_image`, `get_screenshot_of_window_as_image`, `get_screenshot_of_window_as_json`;
  - навигация: `jump_to_tab_by_name`, `jump_to_tab_by_space_type`, `jump_to_view3d_object_by_name`, `jump_to_view3d_object_data_by_name`;
  - рендер: `render_thumbnail_to_path`, `render_viewport_to_path`;
  - плюс 6 `*_for_cli`-вариантов (для `execute_blender_code` и пяти `get_blendfile_summary_*`).
- Экосистема вокруг Blender Lab MCP (новое):
  - `bpy-dev/blender-mcp` (98★, upd 2026-10-06): «Independent enhanced distribution of Blender Lab MCP: standalone bpy, runtime API documentation, and benchmark tooling»;
  - `A-to-PC/blender-lab-mcp-client`: клиент под «null-byte wire protocol» официального add-on;
  - `nonuplet/blender-mcp-tools`: SKILL и утилиты для Blender Lab-версии.

  Источник: [GitHub search](https://github.com/search?q=blender_mcp+%22Blender+Lab%22&type=repositories)

### Inferences
- **Unity**, команда для Claude Code (сконструировано по JSON из документации, macOS arm64): `claude mcp add unity-mcp -- "$HOME/.unity/relay/relay_mac_arm64.app/Contents/MacOS/relay_mac_arm64" --mcp`. В CLI shell сам раскрывает `$HOME`, а в `.mcp.json` путь нужно писать абсолютным. После первого запуска Claude Code нажать **Accept** в Project Settings → AI → Unity MCP. Если на macOS соединение рвётся, использовать подключение через Unity Assistant.
- **Unreal**: генерировать `.mcp.json` через `GenerateClientConfig ClaudeCode`, а не писать вручную. Порт и URL при этом подставятся верно, даже если изменены в Editor Preferences. Ручной эквивалент (сконструировано): `claude mcp add --transport http unreal-mcp http://127.0.0.1:8000/mcp`. Claude Code при первом запуске в каталоге с `.mcp.json` спросит подтверждение для project-scoped сервера.
- **Hyper3D**: подкоманда `claude mcp login` в документации Claude Code этой сессией не проверялась. Если её нет в вашей версии, авторизоваться через `/mcp` → hyper3d-rodin → Authenticate. Для агентных конвейеров CLI удобнее MCP: JSON-вывод, явный `poll` и защита от двойной оплаты. Claude может вызвать `hyper3d generate ... --output json`, затем `poll`, скачать по URL из `result` через `curl` и импортировать в Blender, Unity или three.js.
- **Blender Lab**, команда для Claude Code без клона (сконструировано из официальной pip-команды): `claude mcp add blender-lab -- uvx --from "git+https://projects.blender.org/lab/blender_mcp.git#subdirectory=mcp" blender-mcp`. В облачных сессиях Claude Code `projects.blender.org` может блокироваться прокси (в этой сессии он был закрыт). Тогда помогает клон из GitHub-зеркала и `.mcp.json` с `uv --directory /abs/path/mcp run blender-mcp` (схема из раунда 1). На Blender 4.x работает только неофициальный форк `blender-mcp-legacy`.

### Gaps
- Страницы Unity, Epic и Hyper3D не открывались напрямую, всё выше взято из поисковых выдержек. Точный регистр имени Linux relay (`relay_linux` или `Relay_Linux`) и точное содержимое `.mcp.json`, которое генерирует Epic, не подтверждены первоисточником.
- Число инструментов и список toolsets в Epic Unreal MCP не найдены. Нет и подтверждения, что плагин работает на macOS и Linux.
- Дата последнего коммита и звёзды в `projects.blender.org` по-прежнему недоступны: Gitea закрыт прокси.

## 2. Другие движки и платформы: Roblox, PlayCanvas, Babylon.js, Needle Engine, Bevy, Defold, Minecraft

### Takeaway
Официальные MCP с поддержкой Claude Code есть у трёх платформ:
- **Roblox Studio**: встроенный в Studio MCP; Claude Code включается тумблером Quick connect, старый Rust-сервер заархивирован;
- **PlayCanvas**: `@playcanvas/editor-mcp-server`, 130 инструментов, есть runtime-скриншоты;
- **Babylon.js**: `@babylonjs/mcp-servers`; это набор серверов для графовых редакторов (NME, NGE, NRGE, NPE, GUI, Flow Graph, Smart Filters), а не для управления сценой целиком.

У Needle Engine MCP нет, вместо него есть `llms-full.txt`. Bevy закрывается community-сервером `bevy_brp_mcp` (через BRP), Defold только мелкими community-серверами. Для Minecraft есть один зрелый community-бот `yuniko-software/minecraft-mcp-server` (Mineflayer). Официального MCP для моддинга нет.

### Cited Findings

**Roblox**
- **Официальный встроенный Studio MCP**. Последовательность: Assistant Settings → MCP Servers → раскрыть **Quick connect** → включить нужный клиент, Claude Code есть в списке. Если клиента нет в списке, установить его и перезапустить Studio. Роблокс предупреждает, что MCP-клиенты могут читать и менять содержимое открытых мест, поэтому подключать стоит только доверенные — [create.roblox.com/docs/studio/mcp (выдержка)](https://create.roblox.com/docs/studio/mcp)
- Сторонние гайды описывают путь так: Assistant → меню «⋯» → **Manage MCP Servers** → **Enable Studio as MCP server**. Зелёный индикатор показывает число подключённых клиентов. Если MCP-пунктов нет, обновить Studio и перезапустить — [thespike.gg (вторичный)](https://www.thespike.gg/roblox/beginner-guides/how-to-connect-claude-to-roblox-studio), [obby.fun (вторичный)](https://www.obby.fun/blog/roblox-studio-mcp)
- **`Roblox/studio-rust-mcp-server`** (официальный, 495★): **archived**. Баннер README: «no longer being actively developed… shifted ongoing engineering investment to the built-in MCP Server included with Roblox Studio». Старые инструменты: `run_code`, `insert_model`, `get_console_output`, `start_stop_play`, `run_script_in_play_mode`, `get_studio_mode`. Ручная настройка: `"command": "…rbx-studio-mcp", "args": ["--stdio"]` — [GitHub](https://github.com/Roblox/studio-rust-mcp-server)
- **`boshyxd/robloxstudio-mcp`** (494★): **archived 06.06.2026**. Причина: автор потерял доступ к npm, когда сгорела материнская плата с аппаратными ключами. Он рекомендует форк `Chrrxs/robloxstudio-mcp`. Для старого пакета нужен Studio-плагин и **Allow HTTP Requests** в Experience Settings > Security. Последний npm `robloxstudio-mcp` 2.6.0 вышел 2026-04-09 — [GitHub](https://github.com/boshyxd/robloxstudio-mcp), [npm](https://www.npmjs.com/package/robloxstudio-mcp)
- **`Chrrxs/robloxstudio-mcp`** (314★, создан 2026-05-23, npm `@chrrxs/robloxstudio-mcp` 3.3.0 от 2026-10-18). Claude Code (сверено с README): `claude mcp add robloxstudio -- npx -y @chrrxs/robloxstudio-mcp@latest --auto-install-plugin`; этот флаг сам ставит Studio-плагин. Инструменты — [GitHub](https://github.com/Chrrxs/robloxstudio-mcp):
  - Luau в живом рантайме: `eval_server_runtime`, `eval_client_runtime`;
  - отладка и логи: `breakpoints` (записывают попадания, не останавливая игру), `get_runtime_logs`;
  - плейтесты: `solo_playtest`, `multiplayer_playtest`;
  - профилирование: `capture_script_profiler`, `capture_micro_profiler`, `get_memory_breakdown`;
  - вьюпорт: `capture_screenshot` плюс ввод мыши и клавиатуры;
  - ассеты: `insert_asset` (вырезает скрипты и package links перед вставкой);
  - документация: `get_roblox_docs`, `get_roblox_skills`;
  - монетизация: `manage_monetization` (нужен Open Cloud API key);
  - есть «verified chunk-staging workflow» для больших Luau-вставок.

**PlayCanvas** (официальный), `playcanvas/editor-mcp-server`: 149★, upd 2026-10-18, MIT, npm `@playcanvas/editor-mcp-server` 0.7.1 от 2026-09-09 — [GitHub README](https://github.com/playcanvas/editor-mcp-server), [npm](https://www.npmjs.com/package/@playcanvas/editor-mcp-server)
- Установка (сверено с README): `claude mcp add playcanvas -- npx -y @playcanvas/editor-mcp-server`. Нужен Node.js 22.18+. «Add the server once per agent: two servers take turns owning the Editor port».
- Подключение: в Editor нажать кнопку MCP под Publish, затем `CONNECT`. Chrome запросит разрешение «Apps on device»; без него Editor висит на `Connecting`. Порт по умолчанию `52000`, меняется через `--port`.
- 130 инструментов в 15 группах, среди них Entity, Scripts, Assets (до 512 MiB), Viewport capture, **Runtime** (запуск, скриншоты, логи, ввод), **VCS** (ветки, чекпоинты, merge), Store (включая импорт из Sketchfab).
- «The 130 tool definitions total about 43,000 tokens… Claude Code's MCP tool search is on by default and loads only tool names at start, about 1,000 tokens».
- Сеть и поведение: «no telemetry»; сервер «stops any other process holding that port»; runtime-инструменты открывают окно Launch, поэтому pop-ups должны быть разрешены; проекты удалять нельзя.
- Пример промпта из README: «Add a spinning cube with a rotate script… launch it, and capture a screenshot of the running app to confirm it turns».

**Babylon.js** (официальный), `@babylonjs/mcp-servers`: 9.31.0 от 2026-10-15, Apache-2.0, исходники в монорепозитории `BabylonJS/Babylon.js`, первая публикация 2026-06-04 — [npm README](https://www.npmjs.com/package/@babylonjs/mcp-servers)
- Семь серверов (имя dispatcher'а → бинарник):
  - `nme` → `babylonjs-nme-mcp-server` (Node Material Editor);
  - `nge` (Node Geometry Editor);
  - `nrge` (Node Render Graph Editor);
  - `npe` (Node Particle Editor);
  - `gui` (GUI Editor);
  - `flow-graph` (Flow Graph Editor);
  - `smart-filters` (Smart Filters Editor).
- Запуск: `npx -y @babylonjs/mcp-servers nme` или `npx -y -p @babylonjs/mcp-servers babylonjs-nme-mcp-server`.
- Live-сессии: сервер поднимает локальный session-сервер на `127.0.0.1` и возвращает URL. Его вставляют в панель MCP-Session нужного редактора, после чего изменения синхронизируются в обе стороны. Session-сервер останавливается после 15 минут без активности.
- Анонс на форуме Babylon: «first version of our MCP-servers suite for all of our tools»; VS Code-расширение в планах — [forum.babylonjs.com (выдержка)](https://forum.babylonjs.com/t/babylon-js-mcp-servers-are-out/63591)

**Needle Engine**
- Отдельного MCP нет. Сотрудник Needle пишет на форуме: «there isn't a Needle-specific MCP server yet», советует MCP для Unity и Blender и даёт `cloud.needle.tools/llms-full.txt` для локального AI. Пост без даты — [Needle forum (выдержка)](https://search.needle.tools/c/ai-thread-346560)
- Текущий npm `@needle-tools/engine`: 6.0.0-alpha.7 от 2026-10-12 — [npm](https://www.npmjs.com/package/@needle-tools/engine)

**Bevy**: `natepiano/bevy_brp` (community, 77★, upd 2026-10-16). Старый отдельный репозиторий `bevy_brp_mcp` архивирован, разработка перенесена сюда — [GitHub README (mcp/)](https://github.com/natepiano/bevy_brp), [mcpservers.org (выдержка)](https://mcpservers.org/servers/natepiano/bevy_brp_mcp)
- Установка: `cargo install bevy_brp_mcp`. Для Claude Code README предлагает вписать в `~/.claude.json` блок `"brp": {"type": "stdio", "command": "bevy_brp_mcp", "args": [], "env": {}}`.
- В приложении нужен `bevy::remote::RemotePlugin`. Для скриншотов, ввода и диагностики FPS дополнительно нужен `BrpExtrasPlugin` из `bevy_brp_extras`.
- Совместимость: Bevy 0.19 ↔ `bevy_brp_mcp` 0.22.10, Bevy 0.18 ↔ 0.19.0.

**Defold** (официального нет)
- `Fulviuus/defold-mcp` (13★, upd 2026-10-16) — [GitHub README](https://github.com/Fulviuus/defold-mcp):
  - работает headless: без редактора собирает через bob.jar, запускает `dmengine`, делает hot reload, снимает скриншоты запущенной игры и ищет по API-справке нужной версии;
  - подключение: `claude mcp add defold -- node /path/to/defold-mcp/dist/index.js`;
  - требования: Node 18+, JDK 17+ (только для сборки).
- Прочие — [GitHub search](https://github.com/search?q=defold+mcp&type=repositories&s=stars):
  - `ChadAragorn/defold-mcp`: 19★;
  - `zrnge/defold-mcp`: 6★;
  - `estebanrfp/defold-ai`: 4★, порт godot-ai.
- Опыт разработчика: Claude неточен в Defold API и склонен экспериментировать вместо чтения документации — [feedbagel (вторичный)](https://feedbagel.com/post/exploring-mcp-server-development-for-defold-editor-with-claude-integration)

**Minecraft**: `yuniko-software/minecraft-mcp-server` (787★, upd 2026-10-19) — [GitHub README](https://github.com/yuniko-software/minecraft-mcp-server)
- Это бот на Mineflayer; поддерживается версия 1.21.11, о более новых сказано «Newer versions may not work».
- Мир открывается в LAN (порт `25565`). Документация описывает только Claude Desktop: `"command": "npx", "args": ["-y", "github:yuniko-software/minecraft-mcp-server", "--host", "localhost", "--port", "25565", "--username", "ClaudeBot"]`.
- Инструменты: `move-to-position`, `fly-to`, `place-block`, `dig-block`, `find-blocks`, `smelt-item`, `find-entity` и другие.
- Ловушка при поиске: в Minecraft-сообществе «MCP» означает Mod Coder Pack. `Hexeption/MCP-Reborn` и тег `mcp` у `minecraft-dev/MinecraftDev` к Model Context Protocol отношения не имеют — [GitHub search](https://github.com/search?q=minecraft+mcp&type=repositories&s=stars)

### Inferences
- **Roblox**: включать встроенный MCP через Quick connect. Команду для ручного варианта в выдержках найти не удалось (см. Gaps). Chrrxs-форк полезен поверх встроенного, когда нужны мультиплеерные плейтесты, профайлер или брейкпоинты. Оба сервера пишут в открытое место, поэтому работать стоит на копии.
- **PlayCanvas** сейчас лучший web-3D-движок для агентной работы в Claude Code. В одном сервере собраны редактирование, запуск, скриншот рантайма и VCS-чекпоинт для отката. 43k токенов схем не мешают, пока включён tool search (по README он включён по умолчанию). Если tool search в вашей конфигурации выключен, контекст заметно сожмётся; как именно его включать и выключать, в этой сессии не проверялось.
- **Babylon.js**: сконструированная команда `claude mcp add babylon-nme -- npx -y @babylonjs/mcp-servers nme`, по одному серверу на редактор. Сценой и кодом Babylon сервер не управляет, проверять результат нужно через Playwright или Chrome DevTools MCP (раунд 1).
- **Bevy**: эквивалент через CLI (сконструировано) `claude mcp add brp -- bevy_brp_mcp`. Версию крейта держать согласованной с версией Bevy по таблице совместимости.
- **Minecraft**: эквивалент для Claude Code (сконструировано) `claude mcp add minecraft -- npx -y github:yuniko-software/minecraft-mcp-server --host localhost --port 25565 --username ClaudeBot`.

### Gaps
- Не найдены точная CLI- и JSON-команда встроенного Roblox MCP для ручной настройки и полный список его инструментов: страница create.roblox.com не открывалась.
- Звёзды и активность Babylon.js MCP отдельно не измерить, пакет живёт в монорепозитории. Независимых отзывов о нём не найдено.
- Для Needle Engine не найдено официальной даты и URL `llms.txt` на docs.needle.tools.
- MCP для моддинга Minecraft (Fabric/Forge, MCreator) и Bedrock не найдены.

## 3. Другие DCC и CAD: Rhino + Grasshopper, SketchUp, Cinema 4D, Maya, Substance/Adobe, Onshape, KiCad

### Takeaway
В 2026 году официальные MCP появились у нескольких вендоров:
- **McNeel**: Rhino MCP Platform (`mcneel/RhinoAI`); для Claude Code ставится плагин через Yak, потом команда `MCPConnect`;
- **Trimble**: SketchUp-коннектор, облачный и ориентированный на claude.ai; создаёт только новые `.skp`;
- **Maxon**: встроенный MCP в Cinema 4D 2026.4; официально поддержаны только Claude Desktop и ChatGPT Desktop;
- **PTC**: Onshape FeatureScript MCP, hosted; есть гайд именно для Claude Code.

Официального MCP нет у Autodesk Maya, у Adobe Substance 3D (Adobe-коннектор Substance не включает) и у KiCad. Для KiCad при этом есть очень зрелый community-сервер `mixelpixx/KiCAD-MCP-Server` (2,9k★).

### Cited Findings

**Rhino + Grasshopper**
- **`mcneel/RhinoAI`** («Rhino MCP Platform», официальный McNeel): 370★, создан 2026-04-25, ветка по умолчанию `rhino-9.x` — [GitHub](https://github.com/mcneel/RhinoAI). Шаги для Claude Code из официального гайда — [docs/content/docs/getting-started/cc-plugin.md](https://github.com/mcneel/RhinoAI/blob/rhino-9.x/docs/content/docs/getting-started/cc-plugin.md):
  1. Установить Rhino-плагин (подзаголовок гайда: «Rhino 8 only!»): `PackageManager` → **Rhino-MCP-Platform**; работает в Rhino 8 и Rhino 9 WIP/BETA.
  2. Выполнить в Rhino команду `MCPConnect`.
  3. Скопировать выданный промпт в новую сессию Claude Code; при запросе перезапустить Claude Code.
- В том же файле **закомментирован** (HTML-комментарий, т. е. не опубликован) вариант плагина Claude Code: `/plugin marketplace add mcneel/RhinoAI`, затем `/plugin install mcneel@rhino-mcp`. Он даёт slash-команды `/rhino-mcp:launch-rhino`, `/rhino-mcp:snapshot`, `/rhino-mcp:scene` и агентов `rhino-modeler`, `grasshopper-scripter`, `grasshopper-reviewer` и других — [тот же файл](https://github.com/mcneel/RhinoAI/blob/rhino-9.x/docs/content/docs/getting-started/cc-plugin.md)
- Claude Desktop: расширение `connector.mcpb` (connector-v0.1.6). Ставится через Settings → Extensions → Advanced settings → Install Extension и умеет само установить плагин через `yak install Rhino-MCP-Platform`. Обновление `yak update Rhino-MCP-Platform`, проверка командой `MCPStart` — [connector.md](https://github.com/mcneel/RhinoAI/blob/rhino-9.x/docs/content/docs/getting-started/connector.md)
- **`jingcheng-chen/rhinomcp`** (community, 1 155★, PyPI `rhinomcp` 0.4.1.1 от 2026-09-14) — [GitHub README](https://github.com/jingcheng-chen/rhinomcp), [PyPI](https://pypi.org/project/rhinomcp/):
  - Claude Code (сверено с README): `claude mcp add rhino -- uvx rhinomcp@latest`;
  - плагин: Rhino → Tools → Package Manager → `rhinomcp`;
  - поддержка: Rhino 8 на Windows и macOS; цепочка `rhinomcp (Python) ──TCP 127.0.0.1:1999──► Rhino plugin`;
  - инструменты `run_command` и `execute_rhinoscript_python_code`; первый отключается через `RHINO_MCP_ENABLE_RUN_COMMAND=0`;
  - пиннинг: без `@latest` `uvx` навсегда остаётся на первой скачанной версии;
  - Grasshopper поддерживается: поиск компонентов, их соединение, слайдеры, solve.
- Специализированные Grasshopper-серверы — [GitHub search](https://github.com/search?q=grasshopper+mcp&type=repositories&s=stars), [McNeel forum](https://discourse.mcneel.com/t/rhino-mcp-server/216568/38):
  - `brookstalley/cordyceps`: 105★;
  - `alfredatnycu/grasshopper-mcp`: 100★;
  - `gramaziokohler/lamcp`: 21★, от лаборатории Gramazio Kohler;
  - на форуме McNeel советуют rhinomcp для геометрии («create a sphere»), а lamcp для работы с Grasshopper-определениями («change the value of this slider»).

**SketchUp**
- **Официальный Trimble SketchUp connector**, анонс 28.04.2026 — [Trimble news](https://news.trimble.com/2026-04-28-Trimble-Links-SketchUp-with-Anthropics-Claude,-Bringing-New-Conversational-AI-powered-Capabilities-to-3D-Modeling), [help.sketchup.com (выдержка)](https://help.sketchup.com/en/sketchup-claude-connector):
  - Claude строит геометрию в облачной SketchUp-сессии и по ходу проверяет размеры;
  - подключается из каталога коннекторов Claude; нужны Trimble ID и аккаунт Claude;
  - бесплатный entitlement позволяет сохранить до 30 моделей;
  - версия 1 умеет только создавать новые `.skp` и использует три инструмента: `get_docs`, `evaluate_py`, `save_model`;
  - ограничения (вторичный источник): существующий `.skp` Claude не редактирует и не рендерит, модель между сессиями не сохраняется.
- Remote URL `https://api.sketchup.com/mcp/v1/sketchup/mcp` (streamable-http) приводят только сторонние каталоги; Trimble его не подтверждал — [skillsplayground (вторичный)](https://skillsplayground.com/connectors/sketchup/)
- **`mhyrr/sketchup-mcp`** (community, 498★):
  - Ruby-расширение `.rbz` плюс `uvx sketchup-mcp`;
  - TCP-порт **9876** (тот же, что у Blender MCP по умолчанию);
  - есть инструмент `eval_ruby`;
  - пакет на PyPI `sketchup-mcp` 0.1.17 датирован 2025-03-13, хотя репозиторий активен.

  Источники: [GitHub README](https://github.com/mhyrr/sketchup-mcp), [PyPI](https://pypi.org/project/sketchup-mcp/). Ещё есть `zinin/sketchup-mcp2` (48★, тег claude-code) — [GitHub](https://github.com/zinin/sketchup-mcp2)

**Cinema 4D**
- **Встроенный MCP от Maxon в Cinema 4D 2026.4** (Windows и macOS, бесплатно) — [Digital Production, 01.10.2026](https://digitalproduction.com/2026/10/01/cinema-4d-2026-4-mcp/), [AEC Magazine](https://aecmag.com/news/maxon-automates-cinema-4d-with-mcp-server/), [RedShark](https://www.redsharknews.com/cinema-4d-mcp-server-claude-chatgpt) (все выдержки):
  - выключен по умолчанию;
  - защищён adapter token; пользователь сам выбирает наборы инструментов; Python-исполнение ограничивается отдельно;
  - есть интеграция с undo и локальный audit log;
  - работает только локально, доступ по сети требует отдельного opt-in;
  - официально поддержаны Claude Desktop и ChatGPT Desktop; другие MCP-клиенты «should also work», но Maxon их не тестировал.
- Community-серверы — [GitHub search](https://github.com/search?q=cinema4d+mcp&type=repositories&s=stars):
  - `ttiimmaacc/cinema4d-mcp`: 133★;
  - `kumoproductions/mcp-cinema4d`: 26★, TypeScript, токен `C4D_MCP_TOKEN`;
  - `sdimaging/cinema4d-mcp`: 16★, 93 инструмента, совместим с C4D 2026;
  - `cuneytozseker/mcp4d`: 5★, нативный C++, нацелен на Claude Code.

**Maya**
- Официального MCP от Autodesk не найдено. Например, `GimbalGoats/GG_MayaMCP` (71 инструмент, Maya 2024+) прямо заявляет «not affiliated with or endorsed by Autodesk» — [glama (выдержка)](https://images.glama.ai/mcp/servers/GimbalGoats/GG_MayaMCP)
- Самые живые community-варианты — [GitHub search](https://github.com/search?q=maya+mcp&type=repositories&s=stars):
  - `dcc-mcp/dcc-mcp-maya`: 63★, upd 2026-10-19;
  - `dcc-mcp/dcc-mcp-core`: 70★, Rust/Python-шлюз для нескольких DCC с поиском скилов;
  - `PatrickPalmer/MayaMCP`: 113★, но заброшен (раунд 1).

**Substance / Adobe**
- Коннектор «Adobe for creativity» (28.04.2026) покрывает Photoshop, Lightroom, Illustrator, Premiere, InDesign, Express, Firefly и Adobe Stock, больше 50 инструментов. **Substance 3D в нём не упоминается** — [unite.ai (вторичный)](https://www.unite.ai/anthropic-wires-claude-into-photoshop-blender-and-ableton/), [mcpplaygroundonline (вторичный)](https://mcpplaygroundonline.com/blog/claude-creative-connectors-adobe-blender-ableton.md)
- «Substance 3D Connector» (2024, Apache-2.0) — это фреймворк обмена файлами между приложениями, к MCP он отношения не имеет — [CG Channel](https://www.cgchannel.com/2024/04/adobe-releases-substance-3d-connector)
- Community-серверы для Substance Painter — [GitHub search](https://github.com/search?q=substance+painter+mcp&type=repositories&s=stars):
  - `elliezu/SubstancePainterMCP`: 42★;
  - `parodyband/painter-mcp`: 2★;
  - `parodyband/patina`: headless-движок текстурирования для агентов (CLI + MCP).

**Onshape**
- **Официальный PTC Onshape FeatureScript MCP Server** (Onshape Labs, анонс 13.08.2026). Шаги из tech tip Onshape — [onshape.com tech tip (выдержка)](https://www.onshape.com/en/resource-center/tech-tips/connect-featurescript-mcp-server-claude-code), [PTC press release](https://www.placera.se/pressmeddelanden/ptc-ptc-advances-leadership-in-ai-driven-design-with-launch-of-onshape-featurescript-mcp-server-20260813):
  1. Подписаться на FeatureScript MCP Server в Onshape App Store.
  2. `claude mcp add --transport http onshape https://fs-mcp.labs.onshape.app/mcp`
  3. Запустить `claude`, нажать **Authorize** в браузере, затем выполнить `/mcp`.

  На Windows ещё нужно добавить local bin в PATH. Назначение сервера узкое: создание, тестирование и доработка **собственных FeatureScript-фич**, а не общее моделирование.
- Community-серверы для общего моделирования через REST API Onshape — [GitHub search](https://github.com/search?q=onshape+mcp&type=repositories&s=stars):
  - `ReshefElisha/jarvis-onshape-mcp`: 174★, Claude Code plugin с vision-decomposition skill и FeatureScript;
  - `hedless/onshape-mcp`: 154★.

**KiCad** (PCB, смежная область; официального MCP нет)
- **`mixelpixx/KiCAD-MCP-Server`** (2 855★, MIT, KiCad 9+) — [GitHub README](https://github.com/mixelpixx/KiCAD-MCP-Server):
  - в README есть отдельный раздел для Claude Code: «Claude Code does not read the Claude Desktop configuration file…»;
  - команда: `claude mcp add --scope user kicad --env KICAD_PYTHON=… --env PYTHONPATH=… --env LOG_LEVEL=info -- node /path/to/KiCAD-MCP-Server/dist/index.js`; на macOS `setup-macos.sh` печатает её с подставленными путями;
  - проверка: `claude mcp list` должен показать ✔ Connected;
  - преемник **Konnect**: переписан на Rust как нативный плагин KiCad 10 поверх IPC API, 171 инструмент, встроенные Claude skills, лицензия AGPL-3.0.
- Прочие — [GitHub search](https://github.com/search?q=kicad+mcp&type=repositories&s=stars), [PyPI](https://pypi.org/project/kicad-mcp-pro/):
  - `lamaalrajih/kicad-mcp`: 528★;
  - `salitronic/eda-agent`: 259★; Altium плюс KiCad и EasyEDA, больше 300 инструментов;
  - `Seeed-Studio/kicad-mcp-server`: 163★;
  - `oaslananka/kicad-mcp-pro`: 141★, PyPI 4.3.0 от 2026-10-11, `uvx kicad-mcp-pro`, «human-gated release workflows».

### Inferences
- **Rhino** с Claude Code: официальный путь сейчас «плагин через Yak + `MCPConnect`, который сам выдаёт промпт для настройки». Плагин для Claude Code, судя по закомментированному блоку, готовится. Если нужна воспроизводимая команда, проще взять community `uvx rhinomcp@latest`. Ставить оба под одним именем `rhino` нельзя.
- **SketchUp**: официальный коннектор рассчитан на claude.ai (облачная сессия, OAuth через Trimble ID). Если в Claude Code выполнен вход аккаунтом claude.ai, подключённые там коннекторы могут быть видны и в CLI; в этой сессии это не проверялось. Ручное добавление `api.sketchup.com/...` через `claude mcp add --transport http` не подтверждено. Для работы с существующими `.skp` локально нужен community `mhyrr/sketchup-mcp`. Его порт 9876 надо развести с Blender MCP, если оба работают одновременно.
- **Cinema 4D**: Claude Code официально не поддержан, но MCP-сервер локальный, поэтому подключение технически возможно. Точный transport/endpoint не найден (см. Gaps).
- **Onshape** — единственный найденный случай, где у вендора CAD есть официальный гайд именно для Claude Code CLI, а не только для Desktop.
- **KiCad**: при выборе сервера смотреть на версию KiCad. Для 9.x подходит `KiCAD-MCP-Server` (Python/TS, SWIG/pcbnew), для 10.x — Konnect через IPC (AGPL, для бизнеса нужна коммерческая лицензия).

### Gaps
- Не найдены официальные документы Maxon (где вводится adapter token, endpoint и порт, работает ли Claude Code) и инструкции Trimble для Claude Code.
- Не проверено, видит ли Claude Code CLI коннекторы claude.ai (SketchUp, Adobe, Fusion) при входе аккаунтом claude.ai.
- Официальных Autodesk-MCP для Maya и 3ds Max и Adobe-MCP для Substance 3D не найдено. Не найдены и звёзды и дата Konnect.

## 4. Web 3D вглубь: llms.txt у three.js, WebGPU/TSL, шейдеры/Shadertoy, R3F, оптимизация glTF (gltf-transform, gltfpack, KTX2), Gaussian splatting

### Takeaway
- **three.js** теперь сам публикует `docs/llms.txt` с прямыми инструкциями для LLM: import maps вместо старых CDN, `WebGLRenderer` по умолчанию, `WebGPURenderer` + TSL для кастомных шейдеров и compute. Есть и `llms-full.txt` (около 363 КБ).
- Для **WebGPU/TSL** и **GLSL** зрелых скилов нет, все они меньше 25★. Из заметного: официальный пример MCP Apps `@modelcontextprotocol/server-shadertoy` для живого рендера GLSL; он показывает UI только в хостах с MCP Apps.
- **glTF**: оптимизацию лучше делать CLI-инструментами через Bash: `gltf-transform optimize` (4.5.1) и `gltfpack -cc -tc` (KTX2/BasisU). MCP для этого не нужен.
- **Gaussian splatting**: стек Spark (рендер в three.js), `splat-transform` (CLI для конвертации и фильтрации) и SuperSplat (редактор). Агентных MCP для практической работы со сплатами нет, только исследовательские.

### Cited Findings

**three.js llms.txt** — [docs/llms.txt (GitHub mrdoob/three.js, ветка dev)](https://github.com/mrdoob/three.js/blob/dev/docs/llms.txt)
- Заголовок: «Instructions for Large Language Models».
- Пункт 1: «Use Import Maps (Not Old CDN Patterns)». Пример помечен «WRONG — outdated pattern» (`three.min.js` r128) и «CORRECT»: `"three": "https://cdn.jsdelivr.net/npm/three@0.186.0/build/three.module.js"`, `"three/addons/": ".../examples/jsm/"`.
- Пункт 2: «Use WebGLRenderer (default, mature)»; «Use WebGPURenderer when you need: Custom shaders/materials using TSL, Compute shaders, Advanced node-based materials». Для WebGPU обязателен `await renderer.init()`, импорт `from 'three/webgpu'`.
- Пункт 3: «When using WebGPURenderer, use TSL instead of raw GLSL». Импорт `from 'three/tsl'`, `MeshStandardNodeMaterial().colorNode = …`. TSL «Works with both WebGL and WebGPU backends», без `onBeforeCompile`-хаков.
- Перечислены NodeMaterial-классы `MeshBasicNodeMaterial`, `MeshStandardNodeMaterial`, `MeshPhysicalNodeMaterial`, `LineBasicNodeMaterial`, `SpriteNodeMaterial`. Есть ссылки на TSL Guide и TSL Reference.
- Рядом лежит `docs/llms-full.txt` размером 363 106 байт (замер этой сессии) — [GitHub](https://github.com/mrdoob/three.js/blob/dev/docs/llms-full.txt)
- Текущие версии в npm на 2026-10-19 — [npm three](https://www.npmjs.com/package/three):
  - `three` 0.186.1 (2026-09-24);
  - `@react-three/fiber` 9.8.2 (2026-10-14);
  - `@react-three/drei` 10.7.9 (2026-09-25).

**WebGPU / TSL скилы** (все community и маленькие) — [GitHub search](https://github.com/search?q=TSL+webgpu+skill&type=repositories&s=stars)
- `linegel/threejs-complete-set-of-skill` (11★, upd 2026-10-17): «25 expert agent skills for… Three.js WebGPU/TSL scenes — procedural oceans, clouds, planets… and screenshot-backed visual validation».
- `Picaresco/threejs-skill` (1★): r185, «canon WebGPU/TSL», harness проверки в реальном Chrome.
- Библиотека `tsl-textures` 3.0.5 (2026-09-09): готовые TSL-текстуры — [npm](https://www.npmjs.com/package/tsl-textures)

**Шейдеры / Shadertoy**
- **`@modelcontextprotocol/server-shadertoy`** — [npm README](https://www.npmjs.com/package/@modelcontextprotocol/server-shadertoy):
  - 2.0.3 от 2026-09-25, MIT, репозиторий `modelcontextprotocol/ext-apps` (`examples/shadertoy-server`);
  - описан как «A demo MCP App that renders ShaderToy-compatible GLSL fragment shaders in real-time using WebGL 2.0»;
  - поддержка `mainImage(out vec4 fragColor, in vec2 fragCoord)`, буферы A–D, `iTime`, `iMouse`, `iChannel0-3`;
  - конфиг: `"command": "npx", "args": ["-y", "--silent", "--registry=https://registry.npmjs.org/", "@modelcontextprotocol/server-shadertoy", "--stdio"]`;
  - для просмотра нужен «basic-host… or another MCP Apps-compatible host».
- Community-скилы — [GitHub search](https://github.com/search?q=shader+skill+claude+glsl&type=repositories&s=stars):
  - `iart-ai/webgl-animation-skills`: 23★, Three.js, GLSL, частицы, отладка GPU;
  - `FlutterFlow/shadertoy_to_flutter_skill`: 15★, вендорский скил для перевода Shadertoy-GLSL во Flutter;
  - `owenob1/web-shaders-agent-kit`: 3★, skill + llms.txt + MCP.

**R3F**
- Официального скила pmndrs по-прежнему нет. Самые заметные community-скилы — [GitHub search](https://github.com/search?q=react-three-fiber+skills+agent&type=repositories&s=stars):
  - `emalorenzo/three-agent-skills`: 62★, upd 2026-10-16;
  - `bullish0x/GameStudio`: 19★, 55 агентов и 182 скила для разных движков, в том числе R3F;
  - `cesartevisual/threejs-skills`: 5★.

**Оптимизация glTF**
- **glTF-Transform** (`donmccurdy`, 1 988★; `@gltf-transform/cli` 4.5.1 от 2026-09-28) — [GitHub README](https://github.com/donmccurdy/glTF-Transform), [npm](https://www.npmjs.com/package/@gltf-transform/cli):
  - установка: `npm install --global @gltf-transform/cli`;
  - всё сразу: `gltf-transform optimize input.glb output.glb --texture-compress webp`;
  - геометрия: `gltf-transform draco input.glb output.glb --method edgebreaker` или Meshopt (сжимает геометрию, morph targets и анимацию).
- **gltfpack** (`zeux/meshoptimizer`, 8 582★; npm `gltfpack` 1.3.0 от 2026-09-25) — [gltf/README.md](https://github.com/zeux/meshoptimizer/blob/master/gltf/README.md):
  - базовый вызов: `gltfpack -i scene.gltf -o scene.glb`;
  - сжатие: `-cc` (дополнительное, требует `EXT_meshopt_compression`), `-cz` (KHR_meshopt_compression);
  - текстуры: `-tc` («convert all textures to KTX2 with BasisU supercompression», требует `KHR_texture_basisu`) или `-tw` (WebP);
  - упрощение: `-si R`, R — доля треугольников от 0 до 1;
  - сохранение имён: `-kn` (именованные узлы), `-km` (именованные материалы);
  - на выходе сохраняются расширения `KHR_materials_*`, `EXT_mesh_gpu_instancing` и другие.

**Gaussian splatting**
- **Spark** (World Labs, 3 761★; `@sparkjsdev/spark` 2.3.1 от 2026-10-01, MIT) — [GitHub README](https://github.com/sparkjsdev/spark):
  - «An advanced 3D Gaussian Splatting renderer for THREE.js»; поддерживает больше 98 % устройств с WebGL2;
  - форматы: PLY (и compressed), SPZ и другие;
  - умеет смешивать сплаты с мешами, редактировать цвет, смещение и скелетную анимацию сплатов;
  - quick start в README пиннит `three@0.180.0`.
- **SuperSplat** (`playcanvas/supersplat`, 10 426★): веб-редактор сплатов — [GitHub](https://github.com/playcanvas/supersplat)
- **SplatTransform** (`playcanvas/splat-transform`, 1 388★; npm `@playcanvas/splat-transform` 3.10.1 от 2026-10-09) — [GitHub README](https://github.com/playcanvas/splat-transform):
  - установка: `npm install -g @playcanvas/splat-transform`;
  - синтаксис: `splat-transform [GLOBAL] input [ACTIONS] ... output [ACTIONS]`;
  - чтение: PLY, compressed PLY, SOG, Streamed SOG, SPZ, SPLAT, KSPLAT, LCC, LCC2;
  - запись: PLY, SOG (рекомендован как «Bundled super-compressed format»), Streamed SOG/LOD, SPZ, GLB, CSV, **HTML Viewer**, Voxel, WebP;
  - фильтры: `-N/--filter-nan`, `-H/--filter-harmonics`, `-B/--filter-box`, `-S/--filter-sphere`, `-F/--filter-floaters` и `-C/--filter-cluster` (два последних только на GPU).
- Агентные проекты по сплатам исследовательские — [GitHub](https://github.com/jaccen/Awesome-Gaussian-Skills):
  - `jaccen/Awesome-Gaussian-Skills` (164★): 900 методов с arXiv, 15 скилов, MCP на 34 инструмента;
  - `seemandhar/splatify`: превращает статьи в код на gsplat.
- Обучение сплатов: PyPI `gsplat` (nerfstudio) 1.5.3 от 2025-07-04 — [PyPI](https://pypi.org/project/gsplat/)

### Inferences
- **three.js-контекст для Claude Code**. Добавить в CLAUDE.md ссылку на `https://threejs.org/docs/llms.txt` (это `docs/llms.txt` из репозитория, опубликованный на сайте; вывод) и правило «import maps + WebGLRenderer по умолчанию, WebGPURenderer только для TSL/compute». `llms-full.txt` (около 90k токенов при ~4 символах на токен) целиком в контекст не грузить, читать фрагментами через Grep или WebFetch. Скилы CloudAI-X из раунда 1 совместимы с этим llms.txt: оба нацелены на r186.
- **Конфликт версий**. Spark 2.3.1 в quick start использует three 0.180, а llms.txt и скилы рассчитаны на 0.186. Перед смешиванием проверить peerDependencies Spark или явно запросить совместимую версию.
- **Shadertoy MCP App в Claude Code**: в терминале UI MCP-приложения не отрисуется. Для GLSL практичнее собрать мини-страницу с canvas и снимать её Playwright-скриншотом (раунд 1). Сервер Shadertoy полезен в claude.ai или Desktop, где MCP Apps поддерживаются. Сконструированная команда: `claude mcp add shadertoy -- npx -y --silent @modelcontextprotocol/server-shadertoy --stdio`.
- **glTF-конвейер для агента**:
  1. `gltf-transform inspect` (вывод: команда есть в CLI, здесь не проверялась);
  2. `gltfpack -cc -tc` или `gltf-transform optimize`;
  3. повторная загрузка в three.js и скриншот.

  Для KTX2 через gltf-transform нужен внешний `toktx` из KTX-Software (общеизвестно, здесь не проверено), а `gltfpack -tc` кодирует BasisU сам.
- **Сплаты**. Агенту удобно из `.ply` сделать `splat-transform -N -H 1 in.ply out.sog`, затем вывести `.html` viewer и проверить его Playwright-скриншотом. Флаги взяты из README, сама цепочка — вывод.

### Gaps
- Нет данных о качестве WebGPU/TSL-скилов: звёзд мало, бенчмарков нет. Официального TSL-скила от three.js или pmndrs не найдено.
- `gltf-transform.dev` и `sparkjs.dev` (документация CLI и peer deps) не открывались.
- MCP для SuperSplat и Spark с агентным workflow не найдены.

## 5. 3D-печать: MCP для принтеров и слайсеров, CLI слайсеров, починка мешей и проверка печатаемости

### Takeaway
Для Claude Code в 3D-печати есть три зрелых варианта:
- **`mcp-3D-printer-server`** (254★): OctoPrint, Klipper, Duet, Repetier, Bambu, PrusaLink/Connect, Creality; слайсинг через установленный слайсер; на каждый старт печати и нагрев человек подтверждает через MCP elicitation;
- **`bambu-printer-mcp`** (212★): только Bambu, LAN-режим и AMS;
- **облачный OctoEverywhere MCP**: статус, снимки с веб-камеры, пауза и отмена.

Печатаемость надёжнее проверять кодом через Bash: trimesh (`is_watertight`, `volume`), manifold3d, затем headless-слайсинг (PrusaSlicer `--export-gcode`, OrcaSlicer `--slice`) и разбор G-code. Только потом старт печати после подтверждения человеком.

### Cited Findings
- **`DMontgomery40/mcp-3D-printer-server`** (community, 254★, upd 2026-10-18; npm `mcp-3d-printer-server` 1.2.12 от 2026-10-13, GPL-2.0) — [GitHub](https://github.com/DMontgomery40/mcp-3D-printer-server), [npm README](https://www.npmjs.com/package/mcp-3d-printer-server):
  - поддержка: OctoPrint, Klipper (Moonraker), Duet, Repetier-Server, Bambu Lab, PrusaLink/Prusa Connect, Creality;
  - запуск: `npx -y mcp-3d-printer-server` (stdio), есть отдельные бинарники SSE и HTTP; рекомендован Node.js 24; в README есть готовый промпт «установи меня в свой harness»;
  - переменные окружения для OctoPrint: `PRINTER_HOST`, `PRINTER_PORT`, `API_KEY`; для Klipper порт обычно 7125;
  - `slice_stl` ищет установленные PrusaSlicer, OrcaSlicer, FULU OrcaSlicer-bambulab, Bambu Studio, CuraEngine;
  - есть мост к Blender MCP (`blender_mcp_export_stl`, «verified STL export»).
- **Safety gate** того же сервера — [npm README](https://www.npmjs.com/package/mcp-3d-printer-server):
  - «Every print start and positive heating command, on every backend, goes through a safety gate»;
  - сервер проверяет точный G-code, ограничения нагрева по железу и материалу и готовность принтера, а затем спрашивает человека через **MCP elicitation**;
  - выключение нагрева и `cancel_print` не гейтятся;
  - README просит не ставить `PRINT_REQUIRE_CONFIRMATION=0`;
  - в changelog-абзаце gate «на всех бэкендах» назван фичей «next release», так что формулировки README противоречат друг другу.
- **`DMontgomery40/bambu-printer-mcp`** (212★, upd 2026-10-19; npm 1.1.31 от 2026-10-19, GPL-2.0). Это урезанный до Bambu форк — [npm README](https://www.npmjs.com/package/bambu-printer-mcp), [GitHub](https://github.com/DMontgomery40/bambu-printer-mcp):
  - запуск: `npx -y bambu-printer-mcp`;
  - переменные: `PRINTER_HOST`, `BAMBU_MODEL`, `BAMBU_SERIAL`, `BAMBU_TOKEN` (LAN access code); README требует «Never guess the printer model»;
  - печать прямо по LAN (FTPS + MQTT); прошивка 01.08.05+ отклоняет MQTT-команды без LAN Only Mode и Developer Mode;
  - AMS: `get_printer_filaments`, автосопоставление лотков по RFID (`auto_match_ams`), холостой прогон `resolve_3mf_ams_slots`;
  - удаление файлов только с `confirm: true`;
  - предупреждение: «resending can duplicate a print»;
  - слайсинг через BambuStudio CLI или FULU OrcaSlicer-bambulab.
- **`griches/bambu-mcp`** (55★): управление флотом Bambu, AMS, камера. Claude Code: `claude mcp add bambu -- npx @griches/bambu-mcp` (сверено с README) — [GitHub](https://github.com/griches/bambu-mcp)
- **`OctoEverywhere/mcp`** (38★): «free, private, and secure cloud MCP server» для OctoPrint, Klipper, Bambu, Creality, Prusa, Elegoo и других. Даёт статус, слой, температуры, снимки с веб-камеры, pause/resume/cancel и статус AI-детекции сбоев Gadget. Нужны аккаунт и access token со страницы octoeverywhere.com/mcp — [GitHub README](https://github.com/OctoEverywhere/mcp)
- Прочие — [GitHub search](https://github.com/search?q=3D+printer+mcp&type=repositories&s=stars):
  - `codeofaxel/Kiln`: 95★, был в раунде 1;
  - `bjan/pycentauri`: 23★, Elegoo Centauri Carbon;
  - `GLechevalier/OpenGalatea`: 19★, Prusa.
- **CLI слайсеров** — [Debian manpage prusa-slicer](https://dokk.org/manpages/debian/12/prusa-slicer/prusa-slicer.1.en), [Prusa forum](https://forum.prusaprinters.org/forum/prusaslicer/running-prusaslicer-in-batch-command-line-mode-mixing-configurations-for-fff-and-sla-technologies/), [OrcaSlicer wiki: CLI mode](https://www.orcaslicer.com/wiki/cli/cli_mode), [CLI actions](https://www.orcaslicer.com/wiki/cli/cli_actions) (выдержки):
  - PrusaSlicer: `--export-gcode` (`-g`), `--load <ini>` (повторяемый), `--output`, `--center`. Явный `--printer-technology FFF` спасает от ошибки «Mixing configurations for FFF and SLA technologies».
  - OrcaSlicer: `orca-slicer [input files...] --slice 0` (все пластины) или `--slice N`; `--load-settings "machine.json;process.json"`, порядок важен: сначала machine, потом process. Профили в JSON, INI от PrusaSlicer не подходят.
- **Проверка и починка меша**:
  - `trimesh` (3 704★; PyPI 5.1.1 от 2026-10-02): «emphasis on watertight surfaces»; `mesh.is_watertight`, `mesh.volume`, ориентированные bounding box — [GitHub README](https://github.com/mikedh/trimesh), [PyPI](https://pypi.org/project/trimesh/);
  - `manifold3d` (`elalish/manifold`, 2 363★; PyPI 3.5.4 от 2026-09-25): «Library for geometric robustness», гарантированно манифолдные булевы операции — [GitHub](https://github.com/elalish/manifold), [PyPI](https://pypi.org/project/manifold3d/).

### Inferences
- **Порядок «модель → печать» в Claude Code** (сконструировано по возможностям инструментов):
  1. CAD-MCP или Blender MCP экспортирует STL/3MF (раунды 1–2).
  2. `python -I -c` с trimesh проверяет `is_watertight`, `is_winding_consistent`, `volume > 0`, габариты против стола принтера и единицы (мм).
  3. При ошибках прогнать через manifold3d (булевы операции, слияние) или Meshy `repair_printability` (раунд 1).
  4. Headless-слайсинг (PrusaSlicer или OrcaSlicer CLI) и разбор G-code: оценка времени и филамента из комментариев слайсера, пиковые температуры.
  5. Загрузить файл через printer-MCP **без старта**.
  6. Стартовать только после явного подтверждения человеком. Не повторять старт при неясном ответе: дубль печати.
- **Elicitation**. Safety gate в mcp-3D-printer-server держится на MCP elicitation. Если клиент или версия Claude Code elicitation не поддерживает, вызов старта печати, скорее всего, завершится ошибкой, и это правильно. Обходить его через `PRINT_REQUIRE_CONFIRMATION=0` не стоит. В этой сессии поддержка elicitation в Claude Code не проверялась.
- **Bambu**: в первую очередь `bambu-printer-mcp` (LAN, AMS, проверки моделей). OctoEverywhere подходит для удалённого мониторинга без открытия портов, но это сторонний облачный посредник.

### Gaps
- Официальных MCP от Bambu Lab, Prusa или OctoPrint не найдено, есть только community и OctoEverywhere.
- Независимых сравнений надёжности printer-MCP и отчётов об инцидентах не найдено.
- Официальная wiki PrusaSlicer CLI не открывалась, а GitHub-wiki по прямому raw-URL вернул 404. Флаги PrusaSlicer взяты из manpage и форумов.

## 6. Качество результатов: бенчмарки LLM-3D через Blender/MCP и что получается хорошо, а что плохо

### Takeaway
Бенчмарки 2025–2026 годов сходятся в одном: LLM/VLM-агенты в Blender неплохо справляются с **раскладкой объектов, артикуляцией (двери, ящики) и процедурным кодом**, если могут смотреть на рендер. Слабые места: **реконструкция сцены по изображениям, восстановление позы камеры, процедурные материалы и геометрия**.

В SceneActBench (headless Blender через MCP, июль 2026) общий балл лежит в диапазоне 38,6–50,2. Claude Opus 4.6 High занял второе место (48,9), а реконструкцию никто не решает (лучший результат 12,3 из 100). 3DHarnessBench (сентябрь 2026) показывает, что более богатый доступ к инструментам Blender MCP значимо улучшает результат у всех фронтир-моделей.

### Cited Findings
- **SceneActBench** (arXiv 2607.22393, 24–27.07.2026, Tencent Hunyuan и университеты) — [GitHub README с лидербордом](https://github.com/Feinaldo2/SceneActBench), [arXiv](https://arxiv.org/pdf/2607.22393):
  - агент управляет Blender в headless-режиме через общий MCP-интерфейс (инспекция сцены, Python, рендер видов для самопроверки);
  - 5 задач, 210 исходных экземпляров, 520 кейсов; оценка по скрытой 3D-разметке, во время прогона evaluator обратной связи не даёт;
  - лидерборд (Layout / Camera / Articulated / Reconstruction / Dynamic → Overall):

    | Модель | Layout | Camera | Articulated | Reconstruction | Dynamic | Overall |
    |---|---|---|---|---|---|---|
    | Doubao Seed 2.0 Pro High | 77.4 | 34.5 | 59.6 | 8.8 | 70.7 | **50.2** |
    | **Claude Opus 4.6 High** | 73.5 | 34.0 | 63.7 | 9.8 | 63.2 | **48.9** |
    | GPT 5.4 Medium | 72.7 | 29.6 | 62.3 | 10.4 | 68.5 | 48.7 |
    | GPT 5.4 High | 84.1 | 26.4 | 73.8 | 12.3 | 46.7 | 48.7 |
    | Gemini 3.1 Pro High | 65.4 | 33.9 | 56.5 | 7.1 | 63.9 | 45.4 |
    | Claude Sonnet 5 High | 51.9 | 27.3 | 57.8 | 10.5 | 49.9 | 39.5 |

  - выводы авторов: «Reconstruction is hard for every model (best score 12.3). No configuration leads on all tasks… Reasoning-heavy configurations do not translate into a uniform advantage»; Overall — «not evidence that ranks are statistically distinct».
- **3DHarnessBench** (arXiv 2609.06535, сентябрь 2026) — [arXiv (выдержка)](https://arxiv.org/pdf/2609.06535), [HF papers (выдержка)](https://huggingface.co/papers/2609.06535):
  - задача: восстановить 3D-геометрию в виде Blender Python-кода;
  - четыре harness-режима, от одного вида до полного интерактивного доступа «facilitated by recent Blender MCP functionality»;
  - итог: «all frontier models improve significantly with richer function call access», но прирост сильно зависит от модели;
  - метрики: внешнее сходство, Chamfer distance, Uni3D, топология по числам Бетти, эффективность взаимодействия.
- **BlenderGym** (CVPR 2025, arXiv 2504.01786) — [arXiv](https://arxiv.org/html/2504.01786v1), [CVPR supplemental](https://openaccess.thecvf.com/content/CVPR2025/supplemental/Gu_BlenderGym_Benchmarking_Foundational_CVPR_2025_supplemental.pdf), [themoonlight (вторичный)](https://www.themoonlight.io/en/review/blendergym-benchmarking-foundational-model-systems-for-graphics-editing):
  - 245 пар «стартовая сцена → целевая»; 5 задач: object placement, lighting, procedural material, blend shape, procedural geometry;
  - модели: GPT-4o, Claude 3.5 Sonnet, Gemini 1.5 Flash, InternVL2-8B, Qwen2-VL-7B;
  - вывод: «even the state-of-the-art VLM system struggles with tasks relatively easy for human Blender users»;
  - inference compute выгоднее делить между генерацией и верификацией;
  - в supplemental procedural material и geometry названы «significant challenges»;
  - открытый код (`BlenderGym-Open`) поддерживает в том числе Claude 3.7 Sonnet и Claude 3.5 Sonnet — [GitHub](https://github.com/richard-guyunqi/BlenderGym-Open).
- **3DCodeBench** (arXiv 2606.01057): 12 VLM на процедурной генерации кодом; основные сбои — «API mismatches and disconnected or floating geometry» — [arXiv (выдержка)](https://arxiv.org/pdf/2606.01057), [opentrain (выдержка)](https://www.opentrain.ai/papers/3dcodebench-benchmarking-agentic-procedural-3d-modeling-via-code--arxiv-2606.01057/)
- **CodeGen-3D** (IEEE Access, январь 2026): 100 промптов из Objaverse; специализированные и итеративные системы падают в 3–4 % случаев, общие LLM в 21–92 % — [SJSU ScholarWorks (выдержка)](https://scholarworks.sjsu.edu/faculty_rsca/6835)
- **LL3M** (arXiv 2508.08228, U. Chicago) — [GitHub README](https://github.com/threedle/ll3m), [arXiv](https://arxiv.org/html/2508.08228v1):
  - подход: мультиагентная генерация Blender-кода (planner, retrieval, coder, critic) с BlenderRAG по документации API;
  - в README: «The model used in the paper, Claude Sonnet 3.7, has been retired. As a result, we have discontinued the LL3M server»;
  - ограничение из README: результаты меняются от запуска к запуску, помогают детальные промпты вроде «a simple wooden-colored chair with 4 legs, 1 seat and 1 backrest».
- **ProcFunc** (arXiv 2604.26943): функциональные абстракции для процедурной генерации на Python заметно снижают ошибки редактирования материалов. В таблицах только Gemini 2.5 Pro и GPT-5.2 — [arXiv (выдержка)](https://arxiv.org/pdf/2604.26943)

### Inferences
- **Где Claude с Blender MCP надёжен**: расстановка и ориентация объектов, артикуляция и анимация по ключам, процедурный код с параметрами, правка существующих сцен. В SceneActBench у Opus 4.6 там 63–74 балла.
- **Где ненадёжен**: восстановление сцены по фото или мультиракурсу (~10 баллов у всех), подбор камеры по референсу (~34), тонкие процедурные материалы. Для таких задач лучше:
  - генерировать меши через AI-генераторы (Rodin, Meshy; раздел 1 и раунд 1) или брать ассеты (Poly Haven, Sketchfab);
  - камеру ставить по явным числам (позиция, FOV), а не «как на фото».
- **Практики, подтверждённые бенчмарками**:
  - давать агенту рендер и скриншоты на каждой итерации (3DHarnessBench, BlenderGym);
  - держать под рукой справку по API: у Blender Lab MCP встроены `search_api_docs` и `search_manual_docs`, у LL3M — BlenderRAG;
  - дробить объект на части;
  - отдельно проверять «висящую» и несвязанную геометрию, главный тип сбоя в 3DCodeBench.
- В SceneActBench Claude Sonnet 5 High (39,5) заметно отстаёт от Opus 4.6 High (48,9), особенно в Layout (51,9 против 73,5). Для сложных 3D-сцен разумно выбирать Opus-класс; это вывод из одного бенчмарка, ранги авторы не считают статистически значимыми.

### Gaps
- Поклассовые числа Claude в BlenderGym (Claude 3.5 Sonnet по задачам) и в 3DHarnessBench (Table 1) недоступны: arXiv не открывался.
- Нет бенчмарков именно для `ahujasid/mcp-for-blender` или Blender Lab MCP как продукта. SceneActBench и 3DHarnessBench используют собственные MCP-harness'ы.
- Нет бенчмарков для Unity, Unreal, Godot и Roblox MCP.
