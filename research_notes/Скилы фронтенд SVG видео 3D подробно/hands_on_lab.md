# Hands-on lab: do the report's install commands and workflows actually work? (2026-10-19)

All tests were run on 2026-10-19 (15:28–15:45 UTC) in this Linux container: Claude Code `2.1.303` (`/opt/node22/bin/claude`), Node `v22.22.0`, npm `10.9.4`, `skills` CLI `1.7.2`, ffmpeg `6.1.1-3ubuntu5`, Playwright `1.56.1` with Chromium `141.0.7390.37` (build 1194 in `/opt/pw-browsers`). Everything ran under `/tmp/claude-0/-home-user--/74ca7a89-bc5d-56ec-9e06-c0d45ca31d9e/scratchpad/lab/` (below: `$LAB`). Every `claude` and `npx skills` command that could write config ran with a throwaway `HOME` (`$LAB/home-claude`, `$LAB/home-skills`, `$LAB/home-g`), and telemetry was off (`DISABLE_TELEMETRY=1 DO_NOT_TRACK=1`). The real `/root/.claude.json` still has its 14:56 mtime from session start, `/root/.agents` does not exist, and `git status` in `/home/user/-` is clean. No bundled skill scripts were run, no MCP server was started, and nothing was installed from `curl | sh`.

**How sources are cited.** `[lab: …]` means the command was run here and the quoted output came from it. Artifacts are under `$LAB`. URL citations are primary docs or source code; some of that source code was also read locally from the installed npm package.

The report under test is `/home/user/-/reports/Скилы Claude фронтенд SVG видео 3D.md`.

## 1. Skills installers (`npx skills add`): where files land, exact names, `-l`

### Takeaway
`npx skills add` (v1.7.2) works for every repo it was tried on, and `-l` lists skills without writing anything. Two claims in the report are wrong:
- **Without `-a`, Claude Code still sees the skills.** The CLI writes `./.agents/skills/<name>`, symlinks `./.claude/skills/<name>` to it, and also creates a stray `./agent/skills/` copy for the "Eve" agent. Claude Code's own validator states that sessions follow these symlinks.
- **The report's Vercel command quietly drops the React skill.** `--skill react-best-practices` does not match anything, yet the command exits 0. The correct name is `vercel-react-best-practices`.

`-a claude-code` is still the cleanest option: it gives plain copies in `.claude/skills/` and nothing else. For `-g` it is close to mandatory: without it, a global install creates about 53 agent dot-directories in `$HOME`.

### Cited Findings
- **Version.** `npx skills --version` prints `1.7.2`, and npm `time.modified` is `2026-10-09T16:49:31.897Z` — [lab: `npx skills --version`; `npm view skills version time.modified`]; CLI repo [vercel-labs/skills](https://github.com/vercel-labs/skills).
- **`-l` works; `-l --json` does not.** `-l` exits 0 and writes no files into the project (`proj-list` held only `.git` afterwards). Combining it with `--json` fails with `"error": "The --json flag cannot be combined with --list."` — [lab: `npx skills add <repo> -l`, `npx skills add <repo> -l --json`].
- **Skill counts and exact names from `-l`** [lab: `npx skills add <repo> -l`]:
  - `remotion-dev/skills`: "Found 12 skills". `remotion-best-practices remotion-captions remotion-create remotion-docs remotion-interactivity remotion-maps remotion-markup remotion-multimedia remotion-render remotion-saas remotion-studio remotion-upgrade`. This matches the report's "12 скилов".
  - `vercel-labs/agent-skills`: "Found 9 skills". `vercel-composition-patterns deploy-to-vercel vercel-react-best-practices vercel-react-native-skills vercel-react-view-transitions vercel-cli-with-tokens vercel-optimize web-design-guidelines writing-guidelines`.
  - `shadcn/ui`: "Found 2 skills". `migrate-radix-to-base shadcn`. The source resolved to `https://github.com/shadcn/ui.git`.
  - `cloudai-x/threejs-skills`: "Found 13 skills". `threejs-animation threejs-asset-pipeline threejs-fundamentals threejs-geometry threejs-interaction threejs-lighting threejs-loaders threejs-materials threejs-performance threejs-postprocessing threejs-react-three-fiber threejs-shaders threejs-textures`. This matches the report's "13 скилов".
  - `greensock/gsap-skills` (also works as `https://github.com/greensock/gsap-skills`): "Found 8 skills". `gsap-core gsap-frameworks gsap-performance gsap-plugins gsap-react gsap-scrolltrigger gsap-timeline gsap-utils`.
  - `anthropics/skills`: "Found 20 skills". `--skill frontend-design` selected 1.
  - Others: `WyattBlue/auto-editor` has 4 (`auto-editor auto-editor-effects auto-editor-export auto-editor-transcribe`). `LottieFiles/motion-design-skill` has 1 (`motion-design`). `jdilla1277/agentcad-skill` has 1 (`agentcad`). `majidmanzarpour/threejs-game-skills` has 9 (`threejs-3d-generator threejs-aaa-graphics-builder threejs-audio-generator threejs-debug-profiler threejs-game-director threejs-game-ui-designer threejs-gameplay-systems threejs-image-generator threejs-qa-release`). `vercel/next.js` has 7 (`next-bundle-optimizer next-cache-components-adoption next-cache-components-optimizer next-dev-loop next-partial-prefetching-adoption next-partial-prefetching-optimizer docs-diagrams`); none of them is named as an "upgrade" skill.
- **Agent auto-detection.** Inside Claude Code the env var `AI_AGENT=claude-code_2-1-303_agent` makes the CLI print `claude-code_2-1-303_agent  Agent detected — installing non-interactively`. Disk layout was identical with `AI_AGENT`/`CLAUDECODE` unset (`env -u AI_AGENT -u CLAUDECODE … -y`) — [lab: dirs `A_agentenv_noA` vs `B_human_noA`].
- **Project install without `-a`, with `-y`** (`npx skills add remotion-dev/skills -y`) [lab]:
  - Output: `79 agents`, `Installing to all agents`.
  - Per skill, the summary reads `✓ ./.agents/skills/remotion-render — universal: Amp, Antigravity, Antigravity CLI, Cline, Codex +18 more — symlinked: Claude Code, Eve — skipped: AiderDesk, … +49 more (project directory not found)`.
  - On disk: `.claude/skills/remotion-best-practices -> ../../.agents/skills/remotion-best-practices` (a relative symlink), plus a real directory `./agent/skills/<name>` (no dot; this is the "Eve" agent) and `skills-lock.json`.
  - Disk use: `.agents` 3.5 MB plus `agent/` 3.5 MB for the 12 Remotion skills.
  - The same layout appeared in an empty directory with no `.git` and no `.claude` (`B2_human_empty`), so `.claude/skills` is created even if it did not exist.
- **Why Claude Code always gets a symlink.** The CLI's agent table defines `"claude-code": { skillsDir: ".claude/skills", globalSkillsDir: join(claudeHome, "skills"), createProjectSkillsDirByDefault: true }`. `eve` uses `skillsDir: "agent/skills"` — [lab: read `node_modules/skills/dist/cli.mjs` lines 1509–1517, 1665–1672 of skills@1.7.2]; [vercel-labs/skills](https://github.com/vercel-labs/skills).
- **Claude Code follows those symlinks.** `claude plugin validate $LAB/A_agentenv_noA/.claude/skills` printed: `directory: 12 entries here are symlinks and were not read — components are read without following symlinks. A session loading this directory does follow them, so validate the real paths separately.` — [lab: `claude plugin validate`, Claude Code 2.1.303].
- **Project install with `-a claude-code`** (`npx skills add remotion-dev/skills -a claude-code -y`) gives `✓ remotion-render (copied) → ./.claude/skills/remotion-render` for all 12. There is no `.agents/` and no `agent/`; only `.claude/skills/*` (real dirs) and `skills-lock.json` (`{"version":1,"skills":{"remotion-render":{"source":"remotion-dev/skills","sourceType":"github","skillPath":"skills/remotion-render/SKILL.md","computedHash":"…"}}}`) — [lab: `C_withA`].
- **Report's Vercel command, run verbatim.** `npx skills add vercel-labs/agent-skills --skill web-design-guidelines --skill react-best-practices -a claude-code` printed `Selected 1 skill: web-design-guidelines`, exited 0, and installed only `web-design-guidelines`; no warning appeared in the visible output — [lab: `D_vercel`].
  - With only the wrong name (`--skill react-best-practices`) it exits 1 with `x  No matching skills found for: react-best-practices` and then lists the available skills — [lab: `D1b`].
  - The fixed command `--skill web-design-guidelines --skill vercel-react-best-practices -a claude-code -y` installed both — [lab].
- **Global installs** (temp HOME at `$LAB/home-g`):
  - `npx skills add greensock/gsap-skills --skill gsap-core -g -y` (no `-a`) created `~/.agents/skills/gsap-core` and **54 symlinks**. The HOME started with only `.gitconfig` and ended with **53 new dot-directories**: `.adal .aider-desk .astrbot .augment .autohand .bob .claude .codeartsdoer .codebuddy .codeium … .trae .trae-cn .vibe .zcode .zencoder`. The lock file is `~/.agents/.skill-lock.json` (`"version": 3`, with `sourceUrl`, `skillFolderHash`, `installedAt`) — [lab].
  - `-g -a claude-code` printed `✓ gsap-react (copied) → ~/.claude/skills/gsap-react` — [lab].
- **Remotion's own CLI.**
  - In a project with `@remotion/cli@4.0.536` installed, `npx remotion skills add` produced the same `.agents/skills` + `.claude/skills` symlink layout (plus `agent/`). This confirms the report's description of `npx remotion skills add` — [lab: `R_remotioncli`]; [Remotion: skills CLI](https://www.remotion.dev/docs/cli/skills).
  - Under the hood it spawns `npx --loglevel=error skills@1.7.0 add remotion-dev/skills … --yes`, i.e. a pinned `skills@1.7.0` — [lab: read `@remotion/cli/dist/skills.js`].
  - Outside a project it fails. `npx -y @remotion/cli@latest skills add` gives `npm error could not determine executable to run`. `npx -y -p @remotion/cli@4.0.536 remotion skills add` gives `sh: 1: skills@1.7.0: not found` / `The skills command failed with exit code 127` — [lab].
- **Playwright CLI.** The npm package is `@playwright/cli` (latest `0.1.22`, bin `playwright-cli`, bundles playwright-core `1.64.0-alpha-…`). `npx -y @playwright/cli@0.1.22 install --skills` printed `✅ Workspace initialized`, `✅ Added .playwright-cli/ to .gitignore`, and `✅ Skill installed to .claude/skills/playwright-cli`. It also created a `.playwright/` dir — [lab: `PW_cli`].
  - Reading the source shows that `install` then calls `ensureConfiguredBrowserInstalled()`, which **downloads Chromium unless Chrome/Edge is found or `PLAYWRIGHT_SKIP_BROWSER_DOWNLOAD=1` is set**. The test was run with that variable set — [lab: `playwright-core/lib/coreBundle.js` `initWorkspace`, `findOrInstallDefaultBrowser`]; [Playwright CLI README](https://github.com/microsoft/playwright-cli/blob/main/README.md).
  - `--skills` accepts `claude` (default) or `agents`, and `--global` writes to the home directory — [lab: `playwright-cli install --help`].

### Inferences
- The report says "Скил, который попал только в `.agents/skills`, Claude Code не увидит, поэтому добавляйте флаг `-a claude-code`". In skills 1.7.2 this cannot happen through `npx skills add`, because Claude Code always gets a symlink. `-a claude-code` is still worth recommending: you get real copies that are safe to commit, no `./agent/` folder in the repo root, and no 50+ dot-dirs in `$HOME` on `-g`.
- Symlinked skills may break when the repo is cloned on Windows or when only `.claude/` is committed. Teams that commit project skills should use `-a claude-code` (copies) or `--copy`. This is untested here; it follows from the observed relative symlinks.
- Any multi-skill `--skill a --skill b` line should be checked with `-l` first: a typo in one name drops that skill without an error, so CI scripts will not notice.
- `npx remotion skills add` belongs inside a Remotion project. Outside one, `npx skills add remotion-dev/skills -a claude-code` is the reliable equivalent.
- `playwright-cli install --skills` is not just "install skills": in a fresh environment it may also download a browser.

### Gaps
- No authenticated Claude Code session was started to confirm that the installed skills appear in `/skills` or `/context`; that would have touched the real `~/.claude` or needed separate auth. The "sessions follow symlinks" evidence comes from the validator's message, not from a live session.
- Not tested: `skills update`, `skills remove`, `experimental_install`, Windows symlink behavior, and whether `skills.sh` registry lag (the report's HyperFrames note) affects `add`.

## 2. Context cost of the top skills (SKILL.md size, descriptions, frontmatter vs spec, bundled files)

### Takeaway
Always-on cost is small per skill: about 20–340 tokens by Claude Code's own estimator, which matches the report's "~100 tokens per skill". It adds up per pack, though: threejs-skills ≈1.5k and gsap-skills ≈1.1k tokens every session. Two plugins are far heavier: HyperFrames ≈3.9k and Figma ≈2.4k. On-invoke cost is much larger, roughly 2.7k–12.4k tokens per skill, and up to 22.6k for one HyperFrames skill. All 13 threejs skills exceed the spec's "< 5000 tokens" body guidance while staying just under 500 lines.

- chars/4 underestimates code-heavy skills by about 1.5–1.7×; Claude Code's estimator works out to roughly 2.4 chars/token for them.
- No description comes close to the 1,024-char spec limit or the 1,536-char listing cap.
- Non-spec frontmatter keys: `version` (all 12 Remotion skills) and `user-invocable` (shadcn). Claude Code's validator accepts both.

### Cited Findings
- **Method.** Two independent measurements:
  - My read-only script `$LAB/tools/measure.mjs` (YAML via `yaml@2.9.1`), which reports bytes, words, lines and approx tokens = chars/4.
  - Claude Code's own estimator `claude --plugin-dir <wrapper> plugin details <wrapper>`. Each skill set was copied into a minimal wrapper plugin under `$LAB/tools/wrappers/`.
  — [lab]
- **Spec constraints.** `name` must be "Max 64 characters. Lowercase letters, numbers, and hyphens only" and "must match the parent directory name". `description` must be "Max 1024 characters". `compatibility` must be "Max 500 characters". `metadata` is "a map from string keys to string values". `allowed-tools` is a "Space-separated string … (Experimental)". The spec also says "Metadata (~100 tokens)… Instructions (< 5000 tokens recommended)… Keep your main SKILL.md under 500 lines." — [Agent Skills specification](https://raw.githubusercontent.com/agentskills/agentskills/main/docs/specification.mdx).
- **Per-set measurements.** `tok/4` is chars/4. "CC always-on" and "CC on-invoke" come from `claude plugin details` [lab]. Every `name` matched its directory name.

| Skill set (installed via) | # | SKILL.md bytes (sum) | tok/4 (sum) | CC always-on | CC on-invoke per skill | description chars | frontmatter keys / non-spec | bundled files (bytes) / scripts |
|---|---|---|---|---|---|---|---|---|
| `frontend-design` (`anthropics/skills`; byte-identical to the `claude-plugins-official` copy) | 1 | 9,390 (1,516 words, 67 body lines) | 2,341 | ~80 | ~2.7k | 204 | `name, description, license` / none | 1 (`LICENSE.txt`, 10,174) / 0 |
| `remotion-dev/skills` | 12 | 51,623 | 12,898 | ~299 total (~20–30 each) | ~220 (`multimedia`) to ~6.4k (`interactivity`); `markup` ~6.3k; `best-practices` ~1.5k | 23–47 | `name, description, version` / **`version`** (`4.0.536`) on all 12 | 271 files (2.30 MB) / 20 `.ts`/`.mjs` |
| `vercel-labs/agent-skills` (2 installed) | 2 | 8,482 | 2,121 | ~202 | `vercel-react-best-practices` ~2.6k; `web-design-guidelines` ~360 | 329; 184 | `name, description, license, metadata`; `name, description, metadata` (with `argument-hint` nested inside `metadata`) / none | 74 (222,211, `rules/`) / 0 |
| `shadcn/ui` | 2 | 30,919 | 7,705 | ~276 | `shadcn` ~8k; `migrate-radix-to-base` ~3.5k | 493; 256 | shadcn: `name, description, user-invocable, allowed-tools` / **`user-invocable`** | shadcn 20 (137,056) incl. `scripts/showcase-coverage.mjs`, `evals/evals.json`, `rules/*.md`; migrate 9 (167,332) / 1 |
| `cloudai-x/threejs-skills` | 13 | 314,523 | 78,448 | **~1,524** (~100–120 each) | **~7.4k–12.4k** (`react-three-fiber` ~12.4k, `postprocessing` ~11.2k, `materials` ~11k) | 239–298 | `name, description` / none | 0 / 0 |
| `greensock/gsap-skills` | 8 | 92,573 | 23,012 | **~1,127** | ~1.6k (`timeline`, `performance`) to ~8.6k (`plugins`); `scrolltrigger` ~7.3k; `core` ~5.8k | 228–541 (`gsap-core` 541) | `name, description, license` / none | 0 / 0 |
| `playwright-cli` (`@playwright/cli install --skills`) | 1 | 15,428 (485 lines) | 3,856 | ~44 | ~5.8k | 77 | `name, description, allowed-tools` / none | 10 (53,321, `references/`) / 0 |

  - The `shadcn/ui` and `cloudai-x/threejs-skills` sums were computed from the per-skill rows.
  - The `remotion-dev/skills` bundle is 271 files: `remotion-best-practices` alone holds 142 files (1.18 MB), because it nests a `REFERENCE.md` copy of every other Remotion skill. `assets/sample-data/country-meta.json` (333,134 B) appears 4× on disk. Each skill has `agents/openai.yaml` and `assets/remotion-icon.svg`.
- **threejs body length.** 8 of the 13 threejs SKILL.md bodies are 485–497 lines; the range is 236–497 — [lab: `measure.mjs`].
- **chars/4 vs Claude Code's estimate.** frontend-design 2,341 vs ~2.7k (×1.15). web-design-guidelines 308 vs ~360 (×1.17). remotion-interactivity 4,440 vs ~6.4k (×1.44). shadcn 5,377 vs ~8k (×1.49). playwright-cli 3,856 vs ~5.8k (×1.5). gsap-plugins 5,369 vs ~8.6k (×1.6). threejs-materials 6,671 vs ~11k (×1.65). threejs-react-three-fiber 7,482 vs ~12.4k (×1.66) — [lab].
- **Remotion descriptions are terse.** Examples: `remotion-render: "Export a Remotion video"`, `remotion-best-practices: "Router for all Remotion skills"`, `remotion-multimedia: "Interacting with Mediabunny"` — [lab: frontmatter dump].
- **Official plugins, measured the same way** (installed into temp HOME, `claude plugin details <name>`) [lab]:
  - `figma`: 16 skills, **~2,419 always-on**. On-invoke ranges from ~570 (`figma-create-new-file`) to ~13.7k (`figma-generate-design`); `figma-use` is ~12.1k. Plus an MCP server whose tool schemas are "resolved at runtime; not counted".
  - `hyperframes`: 21 skills, **~3,945 always-on**. On-invoke ranges from ~1.1k (`hyperframes-studio`) to **~22.6k** (`talking-head-recut`). `embedded-captions`, `pr-to-video` and `product-launch-video` are ~11.2k each.
  - `chrome-devtools-mcp`: 7 skills, ~806 always-on, ~1.5k–4.5k on invoke. Plus the MCP server `npx chrome-devtools-mcp@1.11.0`.
  - `modern-web-guidance`: 2 skills (`chrome-extensions` ~350/~9.7k, `modern-web-guidance` ~400/~2.6k), **~748 always-on**. The report says "Набор при этом стоит около 234 токенов"; the official-marketplace version measured here costs about 3× that.
  - `context7` and `playwright`: ~0 always-on (MCP only). context7 uses `"type": "http", "url": "https://mcp.context7.com/mcp?client=claude-code-plugin"`.
  - `frontend-design`: ~80 / ~2.7k.
- **The plugin and SKILL.md disagree on frontend-design's description.** The plugin manifest says "Create distinctive, production-grade frontend interfaces with high design quality…". The SKILL.md says "Guidance for distinctive, intentional visual design when building new UI or reshaping an existing one…" — [lab: `claude plugin details frontend-design`; SKILL.md frontmatter].
- **Claude Code accepts the non-spec keys.** `claude plugin validate` passed for every wrapper (frontend, remotion, vercel, shadcn, threejs, gsap) with no frontmatter errors; the only warning was the wrapper manifest's missing `author`. So `version` and `user-invocable` are accepted — [lab].
- **shadcn's `allowed-tools` is not in spec format.** It is comma-separated (`Bash(npx shadcn@latest *), Bash(pnpm dlx shadcn@latest *), Bash(bunx --bun shadcn@latest *)`), not the spec's space-separated string. `playwright-cli` uses the space-separated form `Bash(playwright-cli:*) Bash(npx playwright:*) Bash(npx --no-install playwright:*)` — [lab]; [spec](https://raw.githubusercontent.com/agentskills/agentskills/main/docs/specification.mdx).
- **`web-design-guidelines` fetches rules at runtime.** It instructs "Use WebFetch to retrieve the latest rules" from `https://raw.githubusercontent.com/vercel-labs/web-interface-guidelines/main/command.md`, which confirms the report's warning — [lab: SKILL.md line 26–29].

### Inferences
- **A full install is not cheap.** frontend-design, remotion (12), vercel (2), shadcn (2), threejs (13) and gsap (8) together are 38 skills at about 3.5k always-on tokens. Adding the figma and hyperframes plugins brings it to about 9.9k. Under the report's "skill listing = 1 % of the context window" rule (≈2k tokens on a 200k window), this would likely overflow and make Claude Code drop descriptions. Whether the budget counts tokens or characters was not verified.
- Install only the threejs and gsap skills you need, using `--skill`, instead of the whole pack. One threejs skill costs about 10k tokens when it fires.
- Use Claude Code's `plugin details` (or a wrapper plugin, as here) instead of chars/4 for budgeting. chars/4 underestimates code-heavy SKILL.md files by 40–70 %.
- Remotion's 23–47-character descriptions ("Export a Remotion video") go against the authoring guidance the report cites. They are probably meant to be reached through `/remotion-best-practices` routing or explicit invocation, not auto-triggering. This is untested.
- Per the report, shadcn (`user-invocable`) and Remotion (`version`) would hit `Unexpected key(s) in SKILL.md frontmatter` if uploaded to claude.ai or the API. In Claude Code they validate cleanly.

### Gaps
- Real tokenization was not checked: no Anthropic token-counting API call was made. "CC" numbers are Claude Code's own estimates, labeled "Token counts are estimates".
- claude.ai/API upload rejection of `version` and `user-invocable` could not be tested here.
- How the 1 % listing budget is computed (tokens vs characters) and the actual truncation behavior were not observed in a live session.

## 3. Claude Code plugin and MCP CLI: exact syntax and files written

### Takeaway
The report's CLI syntax is correct: `claude plugin install …@… --scope project`, `claude plugin details`, `claude plugin marketplace add`, `claude mcp add --transport http`, `claude mcp add-json`, `--scope project`, and options placed after the positional name. Every command tried exited 0. Two corrections:
- `claude plugin details <name>` works only for installed plugins or with `--plugin-dir`; there is no preview of a marketplace entry.
- `add-json --scope project` writes the literal API key into the committed `.mcp.json`. Use `${VAR}` instead.

Writes:
- project scope → `./.claude/settings.json` (`enabledPlugins`, plus `extraKnownMarketplaces` when the marketplace is added with `--scope project`) and `./.mcp.json`;
- user/local scope → `~/.claude/settings.json`, `~/.claude/plugins/*`, and `~/.claude.json` (local = `projects["<abs path>"].mcpServers`, user = top-level `mcpServers`).

### Cited Findings
- **`claude plugin --help` in 2.1.303** lists: `configure`, `details [options] <name>` ("Show a plugin's component inventory and projected token cost"), `disable`, `enable`, `eval [options] [target]`, `init|new`, `install|i`, `list`, `marketplace`, `prune|autoremove`, `tag`, `test`, `uninstall|remove`, `update`, `validate` — [lab].
- **`claude plugin install --help`** shows: `-s, --scope <scope> Installation scope: user, project, or local (default: "user")`, `--marketplace <source>`, `--config <key=value>`, `--json`, `-y, --yes … (required when stdin or stdout is not a TTY)` for marketplace-declared commands, and `--accept-command <sha256>` — [lab].
- **`claude plugin marketplace add --help`** shows: `--scope <scope> … user (default), project, or local`, `--sparse <paths...>`, `--claudeai`, `--json`. The subcommands are `add`, `list`, `remove|rm`, `update` — [lab].
- **`claude mcp add --help`** shows: `-s, --scope <scope> … (local, user, or project) (default: "local")`, `-t, --transport <transport> (stdio, sse, http). Defaults to stdio`, `-e, --env`, `-H, --header`, `--client-id`, `--client-secret`, `--callback-port`. `claude mcp add-json [options] <name> <json>` takes `-s, --scope` (default "local") and `--client-secret`. Help also notes that `get`/`list` health-check approved servers, which is why they were not run — [lab].
- **Marketplace add, fresh temp HOME.** `claude plugin marketplace add anthropics/claude-plugins-official` printed `√ Successfully added marketplace: claude-plugins-official (declared in user settings)` in 2.5 s [lab]. It wrote:
  - `~/.claude/settings.json` with `{"extraKnownMarketplaces":{"claude-plugins-official":{"source":{"source":"github","repo":"anthropics/claude-plugins-official"}}}}`;
  - `~/.claude/plugins/known_marketplaces.json` with `installLocation` and `lastUpdated`;
  - a clone in `~/.claude/plugins/marketplaces/claude-plugins-official`.
  
  `marketplace.json` lists **315 plugins**, matching the report's count. `remotion` and `shadcn` are not in it. `modern-web-guidance`, `hyperframes`, `runway-api`, `figma` and `chrome-devtools-mcp` are, as URL sources pinned to a commit `sha` — [lab].
- **A built-in marketplace is always present.** `claude plugin marketplace list` also shows `anthropic-plugin-directory — Source: Built in (Anthropic Directory)` without anything being added — [lab].
- **Marketplace names.** `claude plugin marketplace add anthropics/skills` registers it as `anthropic-agent-skills`, confirming the report — [lab]. `claude plugin marketplace add heygen-com/hyperframes --scope project` registered `hyperframes` and printed a warning: `At least 84 files … were checked out as Git LFS pointer files instead of their content — Claude Code never downloads Git LFS content there. To fetch it, run: git -C …/marketplaces/hyperframes lfs pull` — [lab].
- **`details` before install fails.** `claude plugin details frontend-design@claude-plugins-official` gives `Plugin "frontend-design@claude-plugins-official" not found. Run claude plugin list to see installed plugins, or pass --plugin-dir <path> to load one from disk.` with exit 1 — [lab].
- **`details` via `--plugin-dir` works without installing.** `claude --plugin-dir <marketplace>/plugins/frontend-design plugin details frontend-design` printed the inventory, `Always-on: ~80 tok`, and `frontend-design ~80 ~2.7k`. This confirms the report's audit syntax `claude --plugin-dir <clone> plugin details <name>` — [lab]; [Plugin security](https://code.claude.com/docs/en/plugins/security).
- **`details` does not start MCP servers.** A dummy plugin had a stdio MCP server `/bin/sh -c "date >> mcp_spawned.log"`. `plugin details` listed it as `MCP servers (1) probe (tool schemas resolved at runtime; not counted)` and the log file was never created — [lab: `$LAB/tools/dummy-plugin`].
- **CLI install shows no confirmation panel.** `claude plugin install frontend-design@claude-plugins-official --scope project` printed `√ Successfully installed plugin: frontend-design@claude-plugins-official (scope: project)` with no panel or prompt [lab]. It wrote:
  - `./.claude/settings.json` = `{"enabledPlugins": {"frontend-design@claude-plugins-official": true}}`;
  - the cache at `~/.claude/plugins/cache/claude-plugins-official/frontend-design/ea10b213686c/`;
  - `~/.claude/plugins/installed_plugins.json` (`"version": 2`, with `scope: "project"`, `projectPath`, `gitCommitSha: ea10b213686c90bb1984b2016937310e05336cf3`).
  
  The cache version is the git short SHA for in-repo plugins and the package version for URL plugins (`figma/2.2.157`, `chrome-devtools-mcp/1.11.0`). Six more plugins (context7, playwright, figma, chrome-devtools-mcp, hyperframes, modern-web-guidance) installed the same way, and no MCP process appeared in `ps` — [lab].
- **Marketplace at project scope.** After `marketplace add … --scope project` and `install hyperframes@hyperframes --scope project`, `./.claude/settings.json` held both `extraKnownMarketplaces.hyperframes` and `enabledPlugins["hyperframes@hyperframes"]: true` — [lab: `P2_proj`]; [Settings reference](https://code.claude.com/docs/en/settings-reference).
- **All 13 `claude mcp add` commands from the report were accepted** (exit 0) [lab: `M_mcp`]. Where each was stored:
  - project → `./.mcp.json`: `claude mcp add --transport http recraft https://mcp.recraft.ai/mcp --scope project` (`Added HTTP MCP server recraft … to project config`, stored as `{"type":"http","url":…}`) and the meshy `add-json … --scope project`.
  - local (default) → `~/.claude.json` under `projects["$LAB/M_mcp"].mcpServers`: openscad (`--transport stdio --` after the name), next-devtools (no `--`), unreal-engine (`--header "X-MCP-Capability-Token: <token>"`), blender, kinocut, godot, fusion360, playwright, elevenlabs (`--transport http`).
  - user → top-level `mcpServers` in `~/.claude.json`: replicate (`… --transport sse --scope user`, options after the URL) and chrome-devtools (`--scope user npx chrome-devtools-mcp@latest`).
- **SSE gets no warning at add time.** The output was just `Added SSE MCP server replicate2 with URL: https://mcp.replicate.com/sse to local config` — [lab].
- **Headers are stored in plain text.** The CLI echoes `Headers: {"X-MCP-Capability-Token": "[REDACTED]"}`, but `~/.claude.json` contains `"headers":{"X-MCP-Capability-Token":"abc"}` — [lab].
- **Secrets in `add-json`.** `claude mcp add-json meshy '{…"env":{"MESHY_API_KEY":"msy_YOUR_API_KEY"}}' --scope project` wrote the literal key into `./.mcp.json`. Writing `"${MESHY_API_KEY}"` is stored verbatim for runtime expansion — [lab]; [Claude Code: MCP](https://code.claude.com/docs/en/mcp).

### Inferences
- In scripts and CI, `claude plugin install` installs immediately. The "Context cost" review panel the report describes is only in the interactive `/plugin` flow. Run `claude --plugin-dir <clone> plugin details <name>` first to see the cost.
- `plugin details` is safe as a pre-install audit step, because it does not start MCP servers. The MCP tool-schema cost is not included in its numbers.
- The report's Meshy example puts a placeholder key in `.mcp.json`. Combined with `--scope project`, a real key would be committed, so recommend `${MESHY_API_KEY}`.
- HyperFrames installed from its own repo needs `git lfs pull` for some assets. The official-marketplace entry is a URL source pinned to a SHA; whether that also skips LFS was not checked.

### Gaps
- The interactive `/plugin install` panel (with "Every turn" / "When invoked") and `/reload-plugins`, `/mcp`, `/skill-doctor` and `/context` were not tested (they are TUI-only).
- `claude plugin eval` was not run: it executes plugin eval suites.
- Not tested: whether `.mcp.json` servers in `-p` mode connect without approval (the report's security claim), because that would start servers.

## 4. SVG pipeline: SVGO v4 default vs the report's "animation-safe" config, and SVG→PNG rendering

### Takeaway
SVGO 4.1.0 keeps `viewBox` and `<title>` by default, confirming the report. **The report's "animation-safe" config is not safe** for SVGs with an inline `<style>`: `inlineStyles` (left enabled) moved the `#id` rules into `style=""`, **deleted the `id` attributes** they targeted, and the `@media (prefers-reduced-motion: reduce)` block was **dropped**. Adding `inlineStyles: false` fixed all of it.

For IDs targeted by external JS/CSS (GSAP), the report's config works. The default config strips every ID, including the `<title>`/`<desc>` IDs, which leaves `aria-labelledby` pointing at nothing.

Rendering:
- The Rust `resvg` 0.48.1 binary accepts the report's syntax `resvg logo.svg logo.png -w 512`.
- The npm `@resvg/resvg-js-cli` does not: it uses `--fit-width` and is a 2024 beta.
- This ffmpeg build can rasterize SVG via librsvg.

All renderers produced identical static PNGs, which I checked visually.

### Cited Findings
- **Versions.** `svgo` `4.1.0` (npm modified `2026-08-24`). `@resvg/resvg-js-cli` `2.6.2-beta.1` (npm modified `2024-08-24`; bins `resvg-js` and `resvg-js-cli`; uses `@resvg/resvg-js` 2.6.2) — [lab: `npm view`, `npx svgo --version`].
- **`preset-default` in 4.1.0 runs, in order:** `removeDoctype, removeXMLProcInst, removeComments, removeDeprecatedAttrs, removeMetadata, removeEditorsNSData, cleanupAttrs, mergeStyles, inlineStyles, minifyStyles, cleanupIds, removeUselessDefs, cleanupNumericValues, convertColors, removeUnknownsAndDefaults, removeNonInheritableGroupAttrs, removeUselessStrokeAndFill, cleanupEnableBackground, removeHiddenElems, removeEmptyText, convertShapeToPath, convertEllipseToCircle, moveElemsAttrsToGroup, moveGroupAttrsToElems, collapseGroups, convertPathData, convertTransform, removeEmptyAttrs, removeEmptyContainers, mergePaths, removeUnusedNS, sortAttrs, sortDefsChildren, removeDesc`. There is no `removeViewBox` or `removeTitle` — [lab: `node_modules/svgo/plugins/preset-default.js`]; [preset-default.js](https://github.com/svg/svgo/blob/main/plugins/preset-default.js); [migration v3→v4](https://svgo.dev/docs/migrations/migration-from-v3-to-v4/).
- **Test file `logo.svg`** (1,409 B) contains: `viewBox`, `role="img" aria-labelledby="logo-title logo-desc"`, `<title id="logo-title">`, `<desc id="logo-desc">`, and an inline `<style>` with `#pulse-dot`/`#spinner` CSS animations, two `@keyframes` and `@media (prefers-reduced-motion: reduce) {…animation:none}`. It also has a gradient `#bg-gradient`, groups `#background-group`/`#decor-group`, and a zero-size `#unused-thing`. A second file, `logo-gsap.svg`, is the same without `<style>` (IDs meant for external GSAP/CSS) — [lab: `$LAB/svg/`].
- **Results (IDs surviving / reduced-motion):**
  - original `logo.svg`: all 9 IDs, reduced-motion 1.
  - `npx svgo logo.svg -o logo.default.svg` (`1.376 KiB - 28.8%`): IDs `logo-title logo-desc bg-gradient background-group bg-circle decor-group`. **`spinner` and `pulse-dot` were removed** and their rules became `style="animation:spin 4s linear infinite;transform-box:fill-box;transform-origin:center"`. **reduced-motion 0**. `<g id="decor-group">` was collapsed, so the `<rect>` now carries `id="decor-group"` — [lab].
  - `npx svgo logo.svg --config svgo.safe.config.mjs` (the report's config: `cleanupIds:false, collapseGroups:false, convertShapeToPath:false, mergePaths:false`; `-28.3%`): same loss. `spinner` and `pulse-dot` were deleted, **reduced-motion 0**, and only the group was kept — [lab].
  - `logo-gsap.svg` default (`-38.2%`): only `id="a"` survives (the gradient was renamed). `<title>` and `<desc>` lost their IDs while `aria-labelledby="logo-title logo-desc"` stayed, so it points at nothing — [lab].
  - `logo-gsap.svg` with the report's config (`-22.4%`): all IDs kept except `unused-thing`, which `removeHiddenElems` removed as zero-size — [lab].
  - **Fix:** a config that also sets `inlineStyles: false` (`svgo.safe2.config.mjs`) gives `-23.4%`, keeps all 8 meaningful IDs, keeps the `@media (prefers-reduced-motion:reduce){#pulse-dot,#spinner{animation:none}}` rule, and leaves `title`/`viewBox` intact — [lab].
- **Where the deletion happens.** `inlineStyles` deletes the ID of an element whose `#id` selector it inlined: `delete selectedEl.attributes.id;` at line 369 of `plugins/inlineStyles.js` in 4.1.0. `cleanupIds` skips work when the document has `<style>`/`<script>` (its `deoptimized` flag, lines 153–209) — [lab: read source]; [inlineStyles.js](https://github.com/svg/svgo/blob/main/plugins/inlineStyles.js); [cleanupIds.js](https://github.com/svg/svgo/blob/main/plugins/cleanupIds.js).
- **Config auto-discovery works.** With `svgo.config.mjs` in the current directory and no `--config`, SVGO used it (`id="spinner"` was preserved) — [lab].
- **resvg-js-cli rejects `-w`.** `npx resvg-js logo.svg out.png -w 512` printed `E|resvg-js: Unkonw option ==> --w` and exited 1. `npx resvg-js --fit-width 512 logo.svg logo_512.png` produced a 512×512 RGBA PNG; with no option the output is 128×128 (the declared size) — [lab].
- **Rust resvg works with the report's syntax.** `resvg-linux-x86_64.tar.gz` (1,930,514 B; binary 4,661,800 B; `resvg --version` gives `0.48.1`) came from `https://github.com/linebender/resvg/releases/latest/download/resvg-linux-x86_64.tar.gz`; `gh release view` was blocked with "GitHub access to this repository is not enabled for this session", but the plain HTTPS download worked [lab]. `resvg logo.svg logo_rust.png -w 512` exits 0 with a 512×512 PNG and prints warnings: `The @keyframes rule is not supported. Skipped.`, `The @media rule is not supported. Skipped.`, `Rect 'unused-thing' has an invalid 'width' value. Skipped.`. Without `-w` it gives 128×128 — [lab]; [resvg](https://github.com/linebender/resvg).
- **ffmpeg fallback.** This ffmpeg build is compiled with `--enable-librsvg`, so `ffmpeg -width 512 -i logo.svg logo_ffmpeg.png` produces a 512×512 PNG — [lab: `ffmpeg -version` configuration].
- **Visual check.** `$LAB/svg/compare_renderers.png` shows resvg-js, resvg (Rust), ffmpeg/librsvg and resvg-on-SVGO-default side by side. All four match: a blue gradient circle, a white rounded square and an orange dot. Only frame 0 is rendered; there is no animation — [lab: viewed with Read].
- **Sampling animation in a browser.** Loading `logo.svg` in Chromium through Playwright, `document.getAnimations()` returned 2. Pausing them and setting `currentTime=750` gave a frame with a scaled dot and a rotated square (`$LAB/web3d/svg_frames.png`, viewed). A context with `reducedMotion: 'reduce'` returned 0 animations, so the media query works in the original file — [lab: `$LAB/web3d/run.mjs`, `rm_check.mjs`].

### Inferences
- The report's config should add `inlineStyles: false`, or at least `inlineStyles: { onlyMatchedOnce: false }`; only `false` was tested. Otherwise, any SVG with an inline `<style>` that targets `#id` loses those IDs and its reduced-motion fallback, which defeats the report's own accessibility advice (`prefers-reduced-motion`, `<title id>` + `aria-labelledby`).
- After SVGO, re-check accessibility: `grep` that every `aria-labelledby` target ID still exists. The default preset breaks it for style-less SVGs.
- For the render step in Claude Code, either the official resvg binary (matches the report's syntax) or ffmpeg+librsvg (often already installed) is a better fit than `@resvg/resvg-js-cli`, whose flags differ and which has not been updated since 2024.
- resvg's stderr warnings ("@keyframes… Skipped") are a cheap automatic signal that a file is animated and needs browser sampling, not a static render.

### Gaps
- `rsvg-convert` and Inkscape are not installed, so they were not tested. ffmpeg's librsvg path is a proxy for the librsvg renderer.
- `prefixIds`, SMIL animations and text-heavy SVGs (font fallback differences between renderers) were not tested.

## 5. Video verification commands (ffprobe, frames, contact sheet, loudnorm, 16 kHz WAV, H.264 export, whisper filter)

### Takeaway
Most of the report's ffmpeg commands work as written. Two need fixes:
- The contact sheet `fps=1/5,scale=320:-1,tile=4x4` → `sheet.png` **fails on clips longer than 80 s** (`Cannot write more than one file with the same name…`, exit 234). On short clips most tiles are black. Fix with `-frames:v 1` and `fps=16/<duration>`, or use a `%02d` pattern.
- `-af loudnorm=print_format=json` is a fragment; it needs `-f null -`.

The 16 kHz WAV and H.264 `yuv420p` + `+faststart` commands are confirmed: `moov` moves before `mdat`, and without `-pix_fmt` an RGB source becomes "High 4:4:4 Predictive". This ffmpeg (6.1.1) has **no `whisper` filter**.

### Cited Findings
- **Test clip.** `ffmpeg -f lavfi -i testsrc2=duration=10:size=1280x720:rate=30 -f lavfi -i sine=frequency=440:duration=10 -c:v libx264 -c:a aac -shortest out.mp4` exits 0 and writes 3,871,252 B — [lab: `$LAB/video/`].
- **ffprobe, verbatim** (`ffprobe -v error -show_streams -of json out.mp4`): exits 0. Video: `h264 High 1280x720 yuv420p 30/1 10.000000`. Audio: `aac LC … 44100 Hz, 1 ch`. For a much smaller payload, `ffprobe -v error -show_entries format=duration,size,bit_rate:stream=codec_name,width,height -of json` returns `{"streams":[{"codec_name":"h264","width":1280,"height":720},{"codec_name":"aac"}],"format":{"duration":"10.000000","size":"3871252","bit_rate":"3097001"}}` — [lab].
- **Single frame, verbatim** (`ffmpeg -ss 4.5 -i out.mp4 -frames:v 1 check_4.5.png`): exits 0 with a 1280×720 PNG — [lab].
- **Contact sheet, verbatim** (`ffmpeg -i out.mp4 -vf "fps=1/5,scale=320:-1,tile=4x4" sheet.png`):
  - 10 s clip: exits 0 but warns `[image2] The specified filename 'sheet.png' does not contain an image sequence pattern`. The 1280×720 sheet has only 2 of 16 tiles filled; the rest is black (viewed `$LAB/video/sheets_compare.png`).
  - 100 s clip: `[image2] Cannot write more than one file with the same name. Are you missing the -update option or a sequence pattern?` → `Error muxing a packet`, **exit 234**; only the first sheet is written.
  - Working fixes: `sheet_%02d.png` (wrote `sheet_01.png`, `sheet_02.png`), or `-vf "fps=16/$DUR,scale=320:-1,tile=4x4" -frames:v 1 sheet_fit.png` with `DUR` taken from ffprobe (all 16 tiles evenly spread, viewed).
  
  — [lab].
- **loudnorm.** The report gives only `-af loudnorm=print_format=json`. The working command is `ffmpeg -hide_banner -nostats -i out.mp4 -af loudnorm=print_format=json -f null -`, exit 0. The JSON goes to stderr: `"input_i" : "-21.77", "input_tp" : "-11.99", "input_lra" : "0.00", "input_thresh" : "-31.77", "output_i" : "-24.00", … "normalization_type" : "dynamic"` — [lab].
- **16 kHz WAV, verbatim** (`ffmpeg -i out.mp4 -ar 16000 -ac 1 -c:a pcm_s16le in.wav`): exits 0. ffprobe shows `codec_name=pcm_s16le|sample_rate=16000|channels=1|bits_per_sample=16`; `file` reports `RIFF … WAVE audio, Microsoft PCM, 16 bit, mono 16000 Hz` — [lab]; [whisper.cpp](https://github.com/ggml-org/whisper.cpp).
- **Social H.264** (`ffmpeg -i out.mp4 -c:v libx264 -pix_fmt yuv420p -movflags +faststart -c:a aac out_social.mp4`): exits 0 with `h264 High yuv420p` and `aac LC`. Top-level MP4 atoms (my parser `$LAB/tools/atoms.py`) are `ftyp free mdat moov` for the plain encode and `ftyp moov free mdat` with `+faststart` — [lab].
- **Why `-pix_fmt yuv420p` matters.** An RGB source (`testsrc2…,format=rgb24`) encoded with plain `-c:v libx264` comes out as `profile=High 4:4:4 Predictive|pix_fmt=yuv444p`; adding `-pix_fmt yuv420p` gives `profile=High|pix_fmt=yuv420p` — [lab].
- **No whisper filter.** `ffmpeg -filters | grep -i whisper` finds nothing, and `ffmpeg -h filter=whisper` says `Unknown filter 'whisper'.` The build is `ffmpeg version 6.1.1-3ubuntu5` (Ubuntu package). The report places the filter in FFmpeg 8.0 — [lab]; [FFmpeg Changelog](https://github.com/FFmpeg/FFmpeg/blob/master/Changelog).

### Inferences
- In CLAUDE.md or skill instructions, write the contact-sheet command as `fps=16/<duration>` + `-frames:v 1`, or with a `%02d` pattern. The verbatim form silently produces a near-empty sheet on short clips and fails on clips over 80 s.
- Distro ffmpeg packages (Ubuntu 24.04 ships 6.1.1) will not have the `whisper` filter. Plan on whisper.cpp with the 16 kHz WAV step, or a static FFmpeg 8.x build.
- Single-pass `loudnorm` reports `"normalization_type" : "dynamic"`. For delivery, a two-pass flow (feed the measured values back) is the usual practice; that was not tested here.

### Gaps
- The Remotion still-frame command (`npx remotion render … --frames=0,30,90`), auto-editor and HyperFrames `render` were not tested: they need a Remotion/HyperFrames project and their compositor binaries.
- `-c copy` concat with 30 ms audio fades (video-use "Hard Rules") was not tested.

## 6. Web 3D: headless three.js screenshot with Playwright under different Chromium flags

### Takeaway
A minimal three.js r186 scene rendered correctly (not black) headless in **all six combinations**:
- headless-shell and new-headless (`channel: 'chromium'`);
- × default flags, `--disable-gpu`, and `--use-gl=angle --use-angle=swiftshader-webgl --enable-unsafe-swiftshader`.

Every run used WebGL2 on ANGLE/SwiftShader (Vulkan) and produced pixel-identical output. The report's claim that `--disable-gpu` breaks WebGL in Chrome 130+ **did not reproduce** on Chromium 141 in this GPU-less container. The real signal is a deprecation warning: without the explicit SwiftShader flags Chromium logs "Automatic fallback to software WebGL has been deprecated. Please use the --enable-unsafe-swiftshader…". WebGPU exposed `navigator.gpu`, but `requestAdapter()` returned null.

### Cited Findings
- **Setup.**
  - Playwright `1.56.1` (also installed globally at `/opt/node-tools/node_modules/playwright`), browser `141.0.7390.37` from `/opt/pw-browsers` (`chromium-1194`, `chromium_headless_shell-1194`; `PLAYWRIGHT_BROWSERS_PATH=/opt/pw-browsers`; no `playwright install` was run).
  - three `0.186.1` (`REVISION = '186'`), served from a local http server via import map.
  - Scene: a `WebGLRenderer({preserveDrawingBuffer:true})` at 640×360 with a `MeshStandardMaterial` cube and torus knot, plus ambient and directional light. The page sets `window.__frameReady = true` after the first `renderer.render`, then Playwright takes `canvas.screenshot()`.
  
  — [lab: `$LAB/web3d/index.html`, `$LAB/web3d/run.mjs`].
- **Results.** All 6 runs report `"webgl2":true` and `"glRenderer":"ANGLE (Google, Vulkan 1.3.0 (SwiftShader Device (Subzero) (0x0000C0DE)), SwiftShader driver)"`. All have center pixel `[169,65,31,255]` (lit orange cube) and identical screenshot stats: 11.1 % non-background pixels, 0 % black, 1,247 unique colors. Viewed side by side in `$LAB/web3d/shots3.png`, with the orange cube and blue torus knot visible in each — [lab].
- **Console warnings by flag set.**
  - Default and `--disable-gpu`: `Automatic fallback to software WebGL has been deprecated. Please use the --enable-unsafe-swiftshader (abo…` and `Failed to create WebGPU Context Provider`.
  - SwiftShader flag set: no fallback-deprecation warning, only `Failed to create WebGPU Context Provider` and `GPU stall due to ReadPixels`.
  
  — [lab].
- **WebGPU.** `navigator.gpu` exists (`webgpuApi: true`) but `await navigator.gpu.requestAdapter()` returns null (`webgpuAdapter: false`) in every mode. This is consistent with the report's "Headless-захват WebGPU на Linux не поддерживается" — [lab]; [agent-browser WebGPU note](https://agent-browser.dev/webgpu) (as cited by the report, not re-fetched).
- **The report's claim under test.** "В headless не используйте `--disable-gpu`: в Chrome 130+ он ломает WebGL" — [report source: microlink](https://microlink.io/blog/webgl-without-a-gpu). Not reproduced here: rendering with `--disable-gpu` was byte-for-byte equivalent in stats to the other runs [lab].

### Inferences
- In GPU-less containers (CI, cloud sessions), Chromium 141 already falls back to SwiftShader for WebGL, so `--disable-gpu` changes nothing. The deprecation warning suggests the automatic fallback may be removed in later Chrome versions. Passing `--use-gl=angle --use-angle=swiftshader-webgl --enable-unsafe-swiftshader` explicitly is the future-proof choice, and per the report it should only be used with trusted content.
- The `--disable-gpu` breakage the report describes may be specific to machines that have a GPU, or to other Chrome versions. It cannot be confirmed or ruled out from this container.
- The `window.__frameReady` + `preserveDrawingBuffer: true` + `canvas.screenshot()` pattern works and can go straight into a threejs/Playwright skill or CLAUDE.md. A `gl.readPixels` center check gives a cheap non-black assertion without a vision call.
- WebGPU-only scenes (the `WebGPURenderer`/TSL path that the threejs skills now steer toward) cannot be screenshot-verified headless here. Use a WebGL fallback for the verification loop.

### Gaps
- No GPU-equipped machine was available, so the GPU-present behavior of `--disable-gpu` and of `channel: 'chrome'` is untested.
- The Playwright MCP (`browser_take_screenshot`) and `playwright-cli` screenshot paths were not run: no MCP server was started, and playwright-cli's browser download was skipped. The Playwright library path tested here uses the same Chromium.
