# Claude Code for FRONTEND: best Skills, Plugins and MCP servers (state as of 2026-10-19)

Method note for the report writer: star counts and "updated" timestamps come from a live GitHub search-API query made on 2026-10-19 (`updated_at` changes on any repo activity, starring included, so it is a weak maintenance signal; I could not get `pushed_at`/last-commit dates because direct GitHub API access was blocked in this session). Install commands were copied verbatim from the current READMEs/docs, which I downloaded raw from GitHub on 2026-10-19. Commands I assembled myself from two sources are marked "(constructed)".

## Q1. Official Anthropic skills/plugins for frontend: what they do, how to install

### Takeaway
Anthropic ships two official frontend pieces worth installing in Claude Code. One is `frontend-design`, a design-quality skill available as a standalone plugin in the official marketplace and inside `example-skills`. The other is `webapp-testing`, a Python-Playwright self-test skill. `web-artifacts-builder`, `theme-factory` and `brand-guidelines` are niche: they target claude.ai artifacts, slide/doc theming and Anthropic's own brand, not production web apps. The `frontend-design` SKILL.md was substantially rewritten after the Nov-2025 blog post. It now has a two-pass "plan tokens, then critique, then build" process and an explicit list of current AI-design "tells".

### Cited Findings
**Repos and marketplaces**
- `anthropics/skills`: 182,158 stars, 1,422 open issues, not archived. It is the "Public repository for Agent Skills" and follows the Agent Skills standard (agentskills.io) — [GitHub](https://github.com/anthropics/skills)
- Install as a marketplace in Claude Code: `/plugin marketplace add anthropics/skills`, then `/plugin install example-skills@anthropic-agent-skills`. There is also `/plugin install document-skills@anthropic-agent-skills` for docx/pdf/pptx/xlsx — [anthropics/skills README](https://github.com/anthropics/skills/blob/main/README.md)
- The marketplace is named `anthropic-agent-skills`. The `example-skills` plugin bundles 12 skills: algorithmic-art, brand-guidelines, canvas-design, doc-coauthoring, frontend-design, internal-comms, mcp-builder, skill-creator, slack-gif-creator, theme-factory, web-artifacts-builder, webapp-testing — [marketplace.json](https://github.com/anthropics/skills/blob/main/.claude-plugin/marketplace.json)
- README: "These example skills are all already available to paid plans in Claude.ai". Skills can also be uploaded via the Claude API Skills endpoint. Disclaimer: "provided for demonstration and educational purposes only" — [README](https://github.com/anthropics/skills/blob/main/README.md)
- The official plugin directory `anthropics/claude-plugins-official` has 43,079 stars and lists 315 plugins in `marketplace.json` (counted 2026-10-19). Claude Code adds this marketplace automatically the first time you start an interactive terminal session — [GitHub](https://github.com/anthropics/claude-plugins-official), [Claude Code docs: discover plugins](https://code.claude.com/docs/en/discover-plugins)
- Official marketplace warning: "Anthropic does not control what MCP servers, files, or other software are included in plugins and cannot verify that they will work as intended" — [claude-plugins-official README](https://github.com/anthropics/claude-plugins-official/blob/main/README.md)

**frontend-design**
- In the official marketplace the entry is `frontend-design`, author Anthropic: "Create distinctive, production-grade frontend interfaces with high design quality. Generates creative, polished code that avoids generic AI aesthetics." Install with `/plugin install frontend-design@claude-plugins-official`. The command follows the docs pattern `/plugin install <plugin>@claude-plugins-official` — [marketplace.json](https://github.com/anthropics/claude-plugins-official/blob/main/.claude-plugin/marketplace.json), [docs](https://code.claude.com/docs/en/discover-plugins)
- Plugin README in anthropics/claude-code: "Claude automatically uses this skill for frontend work". Authors are Prithvi Rajasekaran and Alexander Bricken. It points to the "Frontend Aesthetics Cookbook" `coding/prompting_for_frontend_aesthetics.ipynb` in anthropics/claude-cookbooks — [plugins/frontend-design/README.md](https://github.com/anthropics/claude-code/blob/main/plugins/frontend-design/README.md)
- Current frontend-design SKILL.md frontmatter, verbatim: "Guidance for distinctive, intentional visual design when building new UI or reshaping an existing one. Helps with aesthetic direction, typography, and making choices that don't read as templated defaults." — [SKILL.md](https://github.com/anthropics/skills/blob/main/skills/frontend-design/SKILL.md)
- Current SKILL.md content:
  - Persona: "the design lead at a design studio". Ground the design in the subject matter, and propose a subject, audience and primary job if the brief has none.
  - Typography: use one or two families and a type scale per *The Elements of Typographic Style*. Keep lines under 80 characters.
  - Typographic tells to avoid: accenting one word in a headline, ALL-CAPS labels, unnecessary labels above content.
  - Use numbered 01/02/03 markers only for real sequences.
  - Use motion sparingly. "fade-and-slide-up entrances on each section and hover transitions on every card are the generic default and read as AI-generated".
  - Five "calibration" clusters of current AI design:
    1. Cream #F4F1EA with a serif display and a terracotta #D97757 accent. The skill notes #D97757 is "Anthropic's own Claude-interaction accent".
    2. Near-black with one acid-green or vermilion accent.
    3. Broadsheet hairline layout.
    4. The "SaaS-card kit": identical rounded cards, one radius everywhere, the same rgba(0,0,0,.1) shadow, gradient washes.
    5. "Template chrome": tracked-out ALL-CAPS eyebrows, 'A · B · C' meta strings, '→' appended to buttons, #0B0B0B/#111 standing in for black, monospace data labels.
  - Two-pass process. First a token plan: 4–6 named hex colors, typefaces and their roles, a layout with ASCII wireframes, principles. Then review the plan against the brief and revise generic parts. Only then build.
  - Watch CSS selector specificity conflicts.
  - Quality floor: responsive down to mobile, visible keyboard focus, reduced motion respected.
  - "Critique your own work as you build, taking screenshots to review if your environment supports it"
  - "remove one accessory" (Chanel), plus a UX-writing section (active voice, "Save changes" not "Submit", errors never vague).
  - Source: [SKILL.md](https://github.com/anthropics/skills/blob/main/skills/frontend-design/SKILL.md)
- Original rationale (blog, 2025-11-12, authors Prithvi Rajasekaran, Justin Wei, Alexander Bricken):
  - Problem: "distributional convergence". Without guidance Claude produces "AI slop": Inter fonts, purple gradients on white, minimal animation.
  - Why a skill: it loads on demand instead of bloating every prompt. The general-purpose prompt is ~400 tokens.
  - Guidance areas: typography (avoid Inter, Roboto, Open Sans, Lato and system fonts), color/theme with CSS variables, motion (CSS-only for HTML, the Motion library for React, one orchestrated page load), and layered backgrounds.
  - Source: [Claude blog: Improving frontend design through Skills](https://claude.com/blog/improving-frontend-design-through-skills)

**webapp-testing**
- "Toolkit for interacting with and testing local web applications using Playwright. Supports verifying frontend functionality, debugging UI behavior, capturing browser screenshots, and viewing browser logs."
- Claude writes native Python Playwright scripts. The helper `scripts/with_server.py` manages dev-server lifecycle, including multiple servers.
- "Always run scripts with `--help` first… DO NOT read the source" (it says the scripts would pollute context).
- Decision tree: static HTML → read selectors directly. Dynamic app → "reconnaissance-then-action": wait for `networkidle`, take a screenshot or inspect the DOM, then act.
- Source: [webapp-testing/SKILL.md](https://github.com/anthropics/skills/blob/main/skills/webapp-testing/SKILL.md)

**web-artifacts-builder**
- For "elaborate, multi-component claude.ai HTML artifacts".
- Stack: React 18 + TypeScript + Vite + Parcel + Tailwind CSS 3.4.1 + shadcn/ui, with 40+ components preinstalled. `scripts/init-artifact.sh` scaffolds and `scripts/bundle-artifact.sh` bundles into a single HTML file.
- Explicit anti-slop rule: "avoid using excessive centered layouts, purple gradients, uniform rounded corners, and Inter font".
- Source: [web-artifacts-builder/SKILL.md](https://github.com/anthropics/skills/blob/main/skills/web-artifacts-builder/SKILL.md)
- Blog: in claude.ai you enable the skill and ask Claude to "use the web-artifacts-builder skill" — [Claude blog](https://claude.com/blog/improving-frontend-design-through-skills)

**theme-factory, brand-guidelines, canvas-design**
- `theme-factory`: 10 preset font+color themes (Ocean Depths, Sunset Boulevard, Forest Canopy, Modern Minimalist, Golden Hour, …) for "slides, docs, reportings, HTML landing pages". It shows `theme-showcase.pdf`, asks the user to pick, waits for confirmation, then applies — [theme-factory/SKILL.md](https://github.com/anthropics/skills/blob/main/skills/theme-factory/SKILL.md)
- `brand-guidelines` applies Anthropic's own brand: #141413, #faf9f5, accent #d97757 / #6a9bcc / #788c5d, Poppins headings, Lora body — [brand-guidelines/SKILL.md](https://github.com/anthropics/skills/blob/main/skills/brand-guidelines/SKILL.md)
- `canvas-design` creates visual art as PNG/PDF, not web UI — [ComposioHQ list entry](https://github.com/ComposioHQ/awesome-claude-skills)

**Other Anthropic-authored plugins relevant to frontend** (all in claude-plugins-official)
- `playground`: "Creates interactive HTML playgrounds — self-contained single-file explorers with visual controls, live preview…"
- `typescript-lsp`: TypeScript/JavaScript language server for code intelligence.
- `skill-creator`, `code-simplifier` and `feature-dev` are generic.
- Source: [marketplace.json](https://github.com/anthropics/claude-plugins-official/blob/main/.claude-plugin/marketplace.json)

**How skills load in Claude Code**
- Skill locations:
  - Personal: `~/.claude/skills/<skill-name>/SKILL.md`. Loads in all your projects but not in Cowork/cloud sessions.
  - Project: `.claude/skills/<skill-name>/SKILL.md`. Commit it to share with the team.
  - Nested `<subdir>/.claude/skills/` folders load once Claude touches files there.
  - Source: [Claude Code docs: skills](https://code.claude.com/docs/en/skills)
- Only the skill listing (name + description) is always in context. The combined `description` + `when_to_use` is truncated at 1,536 characters. The listing budget scales at 1% of the model's context window and is configurable via `skillListingBudgetFraction`. `/skill-doctor` shows each skill's context cost and how often it is used — [Claude Code docs: skills](https://code.claude.com/docs/en/skills)
- Cowork/cloud sessions don't read `~/.claude/skills/`. To have a skill there, enable it on your claude.ai account; synced skills land in `~/.claude/skills/synced/` — [Claude Code docs: skills](https://code.claude.com/docs/en/skills)

### Inferences
- For Claude Code frontend work, the minimum "official" kit is `frontend-design@claude-plugins-official`. Add `webapp-testing` only if you want Python Playwright scripts. Most users get better verification from an MCP or CLI browser tool (see Q2). Installing all of `example-skills` adds 12 skill descriptions to every session's listing, mostly irrelevant ones (Slack GIFs, internal comms).
- The rewrite of `frontend-design` matters for usage advice. The 2025 guidance ("avoid Inter/purple gradients, use bold fonts, layered gradients, staggered reveals") produced its own recognizable look. The current version names the cream/terracotta look and the "SaaS-card kit" as tells and pushes restraint ("spend your boldness in one place"). Tutorials written in late 2025 describe the old behavior.
- `web-artifacts-builder` is for claude.ai artifacts (single bundled HTML). Its Tailwind 3.4.1 pin means it is not a template for modern Tailwind v4 production apps.
- `brand-guidelines` is useful only as a template: copy it and swap in your own tokens to make a project brand skill.

### Gaps
- I did not diff the SKILL.md shipped inside `claude-plugins-official/plugins/frontend-design` against `anthropics/skills/skills/frontend-design`. The plugin README still describes the older "bold aesthetic / high-impact animations" framing, so the two copies may differ.
- I found no official token-count figure for the current, longer frontend-design SKILL.md (~9.4 KB file). The ~400-token figure refers to the 2025 prompt.

## Q2. Best MCP servers for frontend: official vs community, overlaps

### Takeaway
The strongest, actively maintained, vendor-official servers are:
- Playwright MCP (Microsoft) for browser automation and E2E.
- Chrome DevTools MCP (Google) for performance traces, Lighthouse, console and network.
- Figma's remote MCP for design-to-code.
- shadcn MCP plus the shadcn skill for components.
- Context7 (Upstash) for version-accurate docs.
- next-devtools-mcp (Vercel) for live Next.js 16+ runtime state.

Storybook's MCP/plugin is official but experimental. 21st.dev "Magic MCP" has been renamed to "21st MCP". In 2026 the vendors themselves (Microsoft, Upstash, Vercel) push coding agents toward CLI + skills variants as more token-efficient than MCP.

### Cited Findings
**Playwright MCP** — `microsoft/playwright-mcp`, official Microsoft
- 38,367 stars, only 5 open issues — [GitHub](https://github.com/microsoft/playwright-mcp)
- Install: `claude mcp add playwright npx @playwright/mcp@latest` — [README](https://github.com/microsoft/playwright-mcp/blob/main/README.md)
- Also in the official marketplace as plugin `playwright` (category testing). Its `.mcp.json` runs `npx @playwright/mcp@latest`. Install with `/plugin install playwright@claude-plugins-official` (constructed from the docs pattern) — [external_plugins/playwright](https://github.com/anthropics/claude-plugins-official/tree/main/external_plugins/playwright)
- It works via "structured accessibility snapshots, bypassing the need for screenshots or visually-tuned models"
  - `browser_snapshot` is "better than screenshot".
  - `browser_take_screenshot`: "You can't perform actions based on the screenshot".
  - A find-in-snapshot tool searches the snapshot by text or regex and is "cheaper than capturing the whole snapshot".
- Key flags:
  - `--caps vision,pdf,devtools`.
  - `--headless` (headed by default).
  - `--isolated`.
  - `--extension` connects to your running Chrome/Edge.
  - `--mobile` ("Mobile pages are usually lighter, which saves tokens").
  - `--snapshot-mode none`.
  - `--snapshot-boxes`.
- A persistent profile can only be used by one browser instance at a time. For parallel clients use `--isolated` or a distinct `--user-data-dir`.
- Microsoft's own positioning: "If you are using a **coding agent**, you might benefit from using the CLI+SKILLS instead… CLI invocations are more token-efficient". MCP remains for "exploratory automation, self-healing tests, or long-running autonomous workflows".
- Source for the bullets above: [README](https://github.com/microsoft/playwright-mcp/blob/main/README.md)

**Playwright CLI + Skills** — `microsoft/playwright-cli`, official
- 14,373 stars (the repo dates from 2020 and has been repurposed) — [GitHub](https://github.com/microsoft/playwright-cli)
- Install: `npm install -g @playwright/cli@latest`, then `playwright-cli install --skills`.
- Headless by default, with `--headed` to watch. Sessions: `-s=<name>` or `PLAYWRIGHT_CLI_SESSION=todo-app claude .`. `playwright-cli show` opens a dashboard of running sessions.
- Example prompt: "Use playwright skills to test https://demo.playwright.dev/todomvc/. Take screenshots for all successful and failing scenarios."
- Source: [README](https://github.com/microsoft/playwright-cli/blob/main/README.md)

**Chrome DevTools MCP** — `ChromeDevTools/chrome-devtools-mcp`, official Google Chrome DevTools team
- 53,839 stars, 156 open issues. Also listed in the official marketplace — [GitHub](https://github.com/ChromeDevTools/chrome-devtools-mcp), [marketplace.json](https://github.com/anthropics/claude-plugins-official/blob/main/.claude-plugin/marketplace.json)
- Install, MCP only: `claude mcp add chrome-devtools --scope user npx chrome-devtools-mcp@latest`.
- Install as a plugin with MCP + skills: `/plugin marketplace add ChromeDevTools/chrome-devtools-mcp`, then `/plugin install chrome-devtools-mcp@chrome-devtools-plugins`. Remove any earlier MCP-only install first, then restart and check `/skills`.
- Source: [docs/client-configurations.md](https://github.com/ChromeDevTools/chrome-devtools-mcp/blob/main/docs/client-configurations.md)
- Tool reference lists 59 tools across input, navigation, emulation, performance, network, debugging, memory, extensions, third-party, WebMCP and PWA. Frontend-relevant ones:
  - `performance_start_trace` / `performance_stop_trace` / `performance_analyze_insight`.
  - `lighthouse_audit`: "accessibility, SEO, best practices, and agentic browsing", excluding performance.
  - `get_css_styles`, `list_console_messages` (source-mapped), `list_network_requests`, `emulate`, `resize_page`, `take_screenshot`, `take_snapshot`, `screencast_start`.
  - The 14 heap-snapshot tools require `--memoryDebugging=true`. `click_at` requires `--experimentalVision=true`.
  - Source: [docs/tool-reference.md](https://github.com/ChromeDevTools/chrome-devtools-mcp/blob/main/docs/tool-reference.md)
- `--slim` mode is for basic browser tasks.
- Usage statistics are enabled by default (opt out with `--no-usage-statistics`). Performance tools may send trace URLs to the CrUX API (`--no-performance-crux` disables this).
- It officially supports only Chrome and Chrome for Testing.
- First test prompt: "Check the performance of https://developers.chrome.com".
- Source: [README](https://github.com/ChromeDevTools/chrome-devtools-mcp/blob/main/README.md)

**agent-browser** — `vercel-labs/agent-browser`, Vercel Labs, a CLI rather than an MCP
- 44,248 stars, created 2026-01-11, 797 open issues — [GitHub](https://github.com/vercel-labs/agent-browser)
- A Rust CLI. Install: `npm install -g agent-browser`, then `agent-browser install` (downloads Chrome for Testing).
- `agent-browser snapshot` returns an accessibility tree with refs, and you click by ref (`click @e2`). `screenshot --if-changed` is "Recommended: skip unchanged images to save tokens". `diff snapshot` compares against a baseline.
- An optional MCP mode defaults to a small `core` tools profile.
- Source: [README](https://github.com/vercel-labs/agent-browser/blob/main/README.md)

**Token-cost comparisons** (third-party, low confidence)
- Browser Use's 100-task eval reported median input tokens: Playwright MCP 4.4M, Chrome DevTools MCP 6.7M, agent-browser 3.3M, with overlapping confidence intervals. It is a vendor benchmark and I could not open the page to verify.
- A competing vendor's single-page test showed the reverse Playwright/DevTools ordering.
- Blog estimates put tool-definition overhead at ~13.7k tokens for Playwright MCP and ~17–18k for DevTools MCP.
- Sources: [browser-use.com](https://browser-use.com/posts/best-mcp-servers-for-browser-automation), [OpenBrowser comparison](https://docs.openbrowser.me/comparison), [paddo.dev](https://paddo.dev/blog/agent-browser-context-efficiency/), [dev.to](https://dev.to/chen_zhang_bac430bc7f6b95/why-vercels-agent-browser-is-winning-the-token-efficiency-war-for-ai-browser-automation-4p87)

**Figma MCP** — official Figma, remote server
- Recommended in Claude Code: `claude plugin install figma@claude-plugins-official`. The plugin bundles the MCP config plus skills for implementing designs, Code Connect and design-system rules.
- Manual: `claude mcp add --transport http figma https://mcp.figma.com/mcp`.
- Source: [figma/mcp-server-guide README](https://github.com/figma/mcp-server-guide/blob/main/README.md)
- `figma/mcp-server-guide` has 2,090 stars — [GitHub](https://github.com/figma/mcp-server-guide)
- Rate limits:
  - Starter plan or View/Collab seats: "up to 6 tool calls per month".
  - Dev/Full seats on Professional/Organization/Enterprise: per-minute limits equal to Tier 1 of the REST API.
  - Write-to-canvas (remote only) is free during beta, "will eventually be a usage-based paid feature".
- Key tools:
  - `get_design_context` returns a "structured **React + Tailwind** representation" of the selection.
  - `get_variable_defs` returns tokens.
  - `get_metadata` returns a node map when output is too large.
  - `get_screenshot`.
  - `generate_image` uses Figma AI credits.
- Workflow: paste a Figma frame or layer link. The client extracts the node-id; it can't browse the URL.
- Source for the three groups above: [README](https://github.com/figma/mcp-server-guide/blob/main/README.md)
- Desktop server: Figma "strongly recommends the remote version". The desktop server stays for specific org/enterprise use cases. Community reports say the Dev Mode "Enable desktop MCP server" toggle was replaced by "Connect to AI agent" in late July — [Figma Help: compare remote and desktop](https://help.figma.com/hc/en-us/articles/35281385065751-Figma-MCP-collection-Compare-Figma-s-remote-and-desktop-MCP-servers), [Figma forum](https://forum.figma.com/report-a-problem-6/mcp-desktop-server-not-an-option-56762)

**Framelink MCP for Figma** — `GLips/Figma-Context-MCP`, community
- 16,009 stars, 28 open issues — [GitHub](https://github.com/GLips/Figma-Context-MCP)
- Uses a Figma personal access token via the REST API and "simplifies and translates the response so only the most relevant layout and styling information is provided".
- Config: `npx -y figma-developer-mcp --figma-api-key=YOUR-KEY --stdio`.
- Claude Code (constructed): `claude mcp add framelink -- npx -y figma-developer-mcp --figma-api-key=YOUR-KEY --stdio`. The `--` separator syntax is from the Claude Code MCP docs.
- Sources: [README](https://github.com/GLips/Figma-Context-MCP/blob/main/README.md), [Claude Code MCP docs](https://code.claude.com/docs/en/mcp)

**shadcn/ui MCP and skill** — official, shadcn
- The `shadcn-ui/ui` repo has 125,943 stars — [GitHub](https://github.com/shadcn-ui/ui)
- MCP install: `npx shadcn@latest mcp init --client claude`. This writes `.mcp.json` → `{"mcpServers":{"shadcn":{"command":"npx","args":["shadcn@latest","mcp"]}}}`. Then restart Claude Code and debug with `/mcp`.
- Registries are configured in `components.json` (e.g. `"@acme": "https://acme.com/r/{name}.json"`) and support private and namespaced registries.
- Example prompts: "Show me all available components in the shadcn registry", "Add the button, dialog and card components to my project", "Create a contact form using components from the shadcn registry".
- Source for the three bullets above: [docs/mcp.mdx](https://github.com/shadcn-ui/ui/blob/main/apps/v4/content/docs/(root)/mcp.mdx)
- shadcn skill install: `npx skills add shadcn/ui`.
  - It activates when `components.json` exists and runs `shadcn info --json` to inject framework, Tailwind version, aliases, base library (radix/base/aria), icon library and installed components.
  - It covers Tailwind v3 and v4 theming (OKLCH, CSS variables) — [docs/skills.mdx](https://github.com/shadcn-ui/ui/blob/main/apps/v4/content/docs/(root)/skills.mdx)
  - The SKILL.md has `user-invocable: false` and `allowed-tools: Bash(npx shadcn@latest *)…`.
  - Rules: semantic colors, never `bg-blue-500`. `flex gap-*`, not `space-y-*`. `size-10`, not `w-10 h-10`. `cn()` for conditional classes. "Use existing components first" via `npx shadcn@latest search`.
  - Source: [skills/shadcn/SKILL.md](https://github.com/shadcn-ui/ui/blob/main/skills/shadcn/SKILL.md)

**Context7** — `upstash/context7`, official Upstash
- 63,304 stars, 49 open issues — [GitHub](https://github.com/upstash/context7)
- Setup: `npx ctx7 setup` (Node.js ≥22.13). It runs OAuth, generates an API key and installs a skill. You choose "CLI + Skills" (no MCP) or MCP mode; `--claude` targets Claude Code.
- Manual setup uses the server URL `https://mcp.context7.com/mcp` with an `Authorization: Bearer YOUR_API_KEY` header.
- MCP tools: `resolve-library-id`, `query-docs`. CLI: `ctx7 library <name> <query>`, `ctx7 docs <libraryId> <query>` (e.g. `/vercel/next.js`).
- Example prompt suffix: "use context7". Suggested CLAUDE.md rule: "Always use Context7 when I need library/API documentation, code generation, setup or configuration steps without me having to explicitly ask."
- Source: [README](https://github.com/upstash/context7/blob/master/README.md)
- Official marketplace plugin `context7`, tagged "community-managed". It connects to the hosted remote server, so no Node/npx is needed, and "Works anonymously out of the box; set CONTEXT7_API_KEY for higher rate limits". Its `.mcp.json` URL is `https://mcp.context7.com/mcp?client=claude-code-plugin` — [marketplace.json](https://github.com/anthropics/claude-plugins-official/blob/main/.claude-plugin/marketplace.json), [external_plugins/context7](https://github.com/anthropics/claude-plugins-official/tree/main/external_plugins/context7)
- Manual Claude Code command (constructed from the README's header guidance and Claude Code's `claude mcp add --transport http <name> <url>` syntax): `claude mcp add --transport http context7 https://mcp.context7.com/mcp --header "Authorization: Bearer YOUR_API_KEY"` — [Context7 README](https://github.com/upstash/context7/blob/master/README.md), [Claude Code MCP docs](https://code.claude.com/docs/en/mcp)

**Next.js DevTools MCP** — `vercel/next-devtools-mcp`, official Vercel
- 830 stars — [GitHub](https://github.com/vercel/next-devtools-mcp)
- Install: `claude mcp add next-devtools npx next-devtools-mcp@latest`, or `npx add-mcp next-devtools-mcp@latest`.
- It is a "thin connector": it discovers Next.js 16+ dev servers and proxies their built-in `/_next/mcp` endpoint for runtime errors, routes, logs and Server Actions.
- Tools:
  - `nextjs_index` and `nextjs_call`.
  - Gateway `nextjs_docs` points to the version-matched docs in `node_modules/next/dist/docs/`.
  - Gateway `browser_eval` points to the `agent-browser` CLI.
- Changed in the migration from 0.3.x:
  - Docs are no longer fetched over the network.
  - The `upgrade_nextjs_16` and `enable_cache_components` tools were removed; they are "now distributed as agent skills".
  - The `nextjs-docs://`, `cache-components://` and `nextjs16://` resources were removed.
- Example prompts: "Next Devtools, what errors are in my Next.js application?"
- Source for the bullets above: [README](https://github.com/vercel/next-devtools-mcp/blob/main/README.md)
- Next.js official agent setup: version-matched docs in `node_modules/next/dist/docs/`, with `AGENTS.md` generated by `next dev` on 16.3+, plus workflow skills via `npx skills add vercel/next.js` — [vercel-plugin README](https://github.com/vercel/vercel-plugin/blob/main/README.md) (it links nextjs.org/docs/app/guides/ai-agents)

**Storybook MCP** — official Storybook, experimental
- `@storybook/addon-mcp` runs an MCP server inside the Storybook dev server at `/mcp`. The endpoint is configurable in `.storybook/main.ts` — [addon-mcp README](https://github.com/storybookjs/mcp/blob/main/packages/addon-mcp/README.md)
- Claude Code plugin, which requires Storybook 10.5+: `claude plugin marketplace add storybookjs/mcp@main --scope user`, then `claude plugin install storybook@storybook --scope user`.
- Skills: `init`, `setup`, `stories` ("use stories for all UI work"), `upgrade`. It works in Claude Desktop too, where it opens stories in the ADE preview.
- It is "experimental" and not yet in Claude's marketplace.
- Source: [claude-plugin README](https://github.com/storybookjs/mcp/blob/main/packages/claude-plugin/README.md)
- Status: the `storybookjs/mcp` repo is archived (271 stars). Its README says it "has moved to storybookjs/storybook as of Storybook v10.6.0" — [GitHub](https://github.com/storybookjs/mcp)
- Claude Code docs specify `#ref` for pinning a branch (`owner/repo#v1.2.0`), whereas Storybook's README uses `@main` — [Claude Code docs](https://code.claude.com/docs/en/discover-plugins)

**21st.dev Magic MCP → "21st MCP"** — official 21st.dev, a commercial service
- `21st-dev/magic-mcp` has 6,113 stars: "Magic MCP is now the 21st MCP; this package keeps old configs working" — [GitHub](https://github.com/21st-dev/magic-mcp)
- Install: `npx @21st-dev/cli@latest init --client claude`, or HTTP `https://21st.dev/api/mcp` with an `x-api-key` header.
- As a plugin: `claude plugin marketplace add 21st-dev/magic-mcp`, then `/plugin install 21st`, with the env var `API_KEY_21ST`.
- "Old Magic API keys were reset".
- The `generate` and `iterate_generation` tools appear only when hosted AI access is enabled. Without it, use `search` and `get_component`.
- Legacy tool names map to new ones (`21st_magic_component_builder` → `generate`, `logo_search` → `search_logo`).
- Source: [README](https://github.com/21st-dev/magic-mcp/blob/main/README.md)

**Magic UI MCP** — official Magic UI
- `magicuidesign/mcp` has 206 stars; the Magic UI library itself has 22,742 — [GitHub](https://github.com/magicuidesign/mcp), [magicui](https://github.com/magicuidesign/magicui)
- Install: `npx @magicuidesign/cli@latest install claude`.
- Tools: `listRegistryItems`, `searchRegistryItems`, `getRegistryItem`. Example: "Make a marquee of logos" — [README](https://github.com/magicuidesign/mcp/blob/main/README.md)

**Google Chrome "Modern Web Guidance"** — official Google Chrome; skills plus a CLI, not an MCP
- Listed in the official marketplace. 2,502 stars, created 2026-03-23, "preview release" — [GitHub](https://github.com/GoogleChrome/modern-web-guidance)
- Install in Claude Code: `/plugin marketplace add GoogleChrome/modern-web-guidance`, then `/plugin install modern-web-guidance@googlechrome`. Alternatives: `npx modern-web-guidance@latest install` or `npx skills add GoogleChrome/modern-web-guidance`.
- The skill pack is ~234 tokens. The CLI searches and retrieves guides (e.g. `search "animate a dialog modal backdrop"`).
- The maintainers' own eval for claude_code: sonnet-5-5 went from 59% to 87% (+28pp, 153 tasks); opus-5-5 from 61% to 89%.
- Telemetry: it collects agent name, guide IDs and agent search queries.
- Source: [README](https://github.com/GoogleChrome/modern-web-guidance/blob/main/README.md)

**Accessibility-specific**
- Deque's axe MCP Server lists Claude Code support and offers analyze and remediate tools.
- A third-party listing says it needs Docker and an Axe DevTools for Web subscription. That is commercial and I did not verify it directly.
- Source: [Deque](https://www.deque.com/axe/mcp-server/), [claudemarketplaces listing](https://claudemarketplaces.com/mcp/io.github.dequelabs/axe-mcp-server)

**Vercel plugin**
- In the official marketplace as `vercel`. Alternative install: `npx plugins add vercel/vercel-plugin`, which requires Bun.
- It has 37 skills and the Vercel MCP at `https://mcp.vercel.com`, which can read and write deployments. It collects telemetry such as the install UUID and harness.
- 310 stars.
- Source: [README](https://github.com/vercel/vercel-plugin/blob/main/README.md), [GitHub](https://github.com/vercel/vercel-plugin)

### Inferences
**Browser-tool overlap.** Playwright MCP, Playwright CLI, Chrome DevTools MCP, agent-browser, Anthropic's `webapp-testing`, `browser-use`, `dev-browser` and `playwright-skill` all drive a browser. Installing several wastes listing space and confuses tool choice. A reasonable split:
- One automation tool: Playwright CLI + skill, or agent-browser for token thrift, or Playwright MCP for long exploratory loops.
- Plus Chrome DevTools MCP only when you need perf traces, Lighthouse or heap analysis, in `--slim` mode otherwise.

**Component-source overlap.** The shadcn MCP and the shadcn skill overlap. The skill already covers CLI-based search/add/docs, so for shadcn projects the skill alone may suffice. Add the MCP for multi-registry browsing. Magic UI and 21st are add-on component catalogs. 21st's generation features are paywalled.

**Docs overlap.** Context7 overlaps with Next.js bundled docs, which are preferable for Next 16+ because they match the installed version. It also overlaps with Modern Web Guidance, which covers platform APIs rather than libraries. Context7 is still the general answer for React, Vue, Svelte, Tailwind and other libraries.

**Figma choice.** The official Figma MCP is the default for teams with Dev/Full seats. With a Starter or View seat the 6-calls/month limit makes it nearly unusable, and Framelink with a personal token is the practical community alternative.

**Context cost in Claude Code.** Raw "tool-definition overhead" numbers from blogs (13–18k tokens) matter less in current Claude Code. MCP tool search is on by default and loads only tool names. The real costs are per-call payloads: snapshots, screenshots, traces.

### Gaps
- No official Tailwind Labs MCP server or skill turned up in this research. Tailwind knowledge comes via Context7, the shadcn skill (v3/v4 theming) or general CSS skills.
- No dedicated, widely adopted official Vue/Nuxt or Svelte/SvelteKit MCP turned up for Claude Code in the sources I checked. I didn't search Nuxt/Svelte vendor repos specifically. Expo has official skills in the marketplace, for React Native.
- I couldn't fetch shadcn's, Figma's developer and Context7's websites (DNS/proxy blocks), so Context7's exact Claude-Code-specific manual command comes only from the README and the Claude docs syntax.
- The Browser Use benchmark numbers come from a search summary; I could not open the page.
- I didn't verify where the Storybook Claude plugin marketplace lives after the move to `storybookjs/storybook`.

## Q3. Community skills and marketplaces for frontend: high quality vs hype

### Takeaway
Vendor-authored community skills are the most reliable, because they are rule-based, maintained and specific: Vercel's `agent-skills` (`react-best-practices`, `web-design-guidelines`), the shadcn skill and Google's Modern Web Guidance. Large generalist marketplaces (obra/superpowers, wshobson/agents) are process/methodology tools, not frontend-quality tools. Mega-popular "design-intelligence" catalogs such as `ui-ux-pro-max-skill` have huge star counts but no independent quality evidence. Their style-catalog approach runs counter to Anthropic's "avoid template defaults" guidance.

### Cited Findings
**vercel-labs/agent-skills** — 32,636 stars, "Vercel's official collection of agent skills" — [GitHub](https://github.com/vercel-labs/agent-skills)
- Install: `npx skills add vercel-labs/agent-skills`.
- Skills:
  - `react-best-practices`: 40+ rules in 8 categories prioritized by impact: waterfalls, bundle size, server, client fetching, re-renders, rendering, JS micro-optimizations.
  - `web-design-guidelines`: 100+ rules on accessibility, focus, forms, animation, typography, images, performance, URL state, dark mode, touch, i18n.
  - `composition-patterns`, `react-view-transitions`, `react-native-guidelines`, `vercel-optimize`, `writing-guidelines`.
  - `vercel-deploy-claimable` is "Designed for use with claude.ai and Claude Desktop".
  - Source: [README](https://github.com/vercel-labs/agent-skills/blob/main/README.md)
- The `react-best-practices` folder's SKILL.md `name` is `vercel-react-best-practices` — [SKILL.md](https://github.com/vercel-labs/agent-skills/blob/main/skills/react-best-practices/SKILL.md)
- `web-design-guidelines` fetches the latest rules at run time from `https://raw.githubusercontent.com/vercel-labs/web-interface-guidelines/main/command.md` via WebFetch. It outputs terse `file:line` findings and is triggered by "review my UI", "check accessibility", "audit design" — [SKILL.md](https://github.com/vercel-labs/agent-skills/blob/main/skills/web-design-guidelines/SKILL.md)

**The `skills` CLI** (`vercel-labs/skills`) — 35,611 stars, "The open agent skills tool - npx skills"
- Supports Claude Code plus 75+ other agents.
- Flags: `-g` (global), `-a claude-code`, `--skill <name>`, `npx skills find [query]`.
- Try a skill without installing: `npx skills use vercel-labs/agent-skills@web-design-guidelines | claude`.
- Source: [README](https://github.com/vercel-labs/skills/blob/main/README.md)
- skills.sh badges are present on the anthropics/skills and vercel-labs repos — [anthropics/skills README](https://github.com/anthropics/skills/blob/main/README.md)

**obra/superpowers** — 301,966 stars, created 2025-10-09
- "An agentic skills framework & software development methodology". It runs brainstorm → design sign-off → plan → "true red/green TDD, YAGNI, DRY".
- Install: `/plugin install superpowers@claude-plugins-official`, or `/plugin marketplace add obra/superpowers-marketplace` then `/plugin install superpowers@superpowers-marketplace`.
- Source: [README](https://github.com/obra/superpowers/blob/main/README.md), [GitHub](https://github.com/obra/superpowers)

**wshobson/agents** — 41,111 stars, 3 open issues
- 94 plugins, 202 agents, 185 skills, 105 commands, multi-harness.
- Marketplace: `/plugin marketplace add wshobson/agents`. Plugins install as `<plugin>@claude-code-workflows`, e.g. `/plugin install python-development@claude-code-workflows`.
- Single skill: `npx skills add wshobson/agents --skill <name>` or `gh skill install wshobson/agents <name>`.
- Source: [README](https://github.com/wshobson/agents/blob/main/README.md)
- Frontend plugins:
  - `frontend-mobile-development`.
  - `ui-design`: skills design-system-patterns, accessibility-compliance (WCAG 2.2), responsive-design, web-component-design (React/Vue/Svelte), interaction-design, visual-design-foundations; agents ui-designer, accessibility-expert, design-system-architect.
  - `accessibility-compliance`, `frontend-mobile-security`.
  - Source: [docs/plugins.md](https://github.com/wshobson/agents/blob/main/docs/plugins.md), [plugins/ui-design/README.md](https://github.com/wshobson/agents/blob/main/plugins/ui-design/README.md)

**nextlevelbuilder/ui-ux-pro-max-skill** — 137,500 stars, 14,606 forks, created 2025-11-30
- Install: `/plugin marketplace add nextlevelbuilder/ui-ux-pro-max-skill`, then `/plugin install ui-ux-pro-max@ui-ux-pro-max-skill`. Or `npm install -g ui-ux-pro-max-cli` and `uipro init --ai claude`.
- Contents: "79 searchable UI styles (50 active)" (Glassmorphism, Claymorphism, Neumorphism, Bento Grid…), 192 palettes, 74 font pairings, 22 tech stacks, 119 UX guidelines, 192 reasoning rules.
- There is a paid "Premium Version".
- Source: [README](https://github.com/nextlevelbuilder/ui-ux-pro-max-skill/blob/main/README.md), [GitHub](https://github.com/nextlevelbuilder/ui-ux-pro-max-skill)

**Superdesign** — `superdesigndev/superdesign-skill`, 846 stars
- In the official marketplace as `superdesign`: "Design or redesign frontend UI… on the Superdesign infinite canvas". It depends on the external superdesign.dev service.
- Install: `npx skills add superdesigndev/superdesign-skill`.
- Source: [GitHub](https://github.com/superdesigndev/superdesign-skill), [marketplace.json](https://github.com/anthropics/claude-plugins-official/blob/main/.claude-plugin/marketplace.json)

**Other community items, verified to exist**
- `SawyerHood/dev-browser`: 6,670 stars, "A Claude Skill to give your agent the ability to use a web browser". awesome-claude-code describes it as letting Claude "test and verify its own work — full Playwright API plus pixel- and DOM-level" checks.
- `lackeyjb/playwright-skill`: 3,221 stars.
- `bitjaru/styleseed`: 979 stars, 23 design-judgment skills.
- `educlopez/ui-craft`: 392 stars, "anti-slop" design engineering skill.
- Sources: [dev-browser](https://github.com/SawyerHood/dev-browser), [playwright-skill](https://github.com/lackeyjb/playwright-skill), [styleseed](https://github.com/bitjaru/styleseed), [ui-craft](https://github.com/educlopez/ui-craft), [awesome-claude-code](https://github.com/hesreallyhim/awesome-claude-code)

**Curated lists**
- `ComposioHQ/awesome-claude-skills`: 77,423 stars but 1,788 open issues/PRs. Many entries are SaaS automation via Composio.
- `hesreallyhim/awesome-claude-code`: 56,003 stars, with a dedicated "Design & UI/UX" section.
- `travisvn/awesome-claude-skills`: 15,460 stars. It notes frontend-design "Works very well for React & Tailwind".
- Sources: [ComposioHQ](https://github.com/ComposioHQ/awesome-claude-skills), [hesreallyhim](https://github.com/hesreallyhim/awesome-claude-code), [travisvn](https://github.com/travisvn/awesome-claude-skills)

### Inferences
**High quality.** These have vendor ownership, concrete rules and, in Google's case, published evals:
- `vercel-react-best-practices`
- `web-design-guidelines`
- shadcn skill
- Modern Web Guidance
- Figma plugin skills
- Chrome DevTools plugin skills

**Useful but generic.** Superpowers is a workflow methodology. For UI it adds brainstorming and design sign-off, and TDD discipline for components. It does not improve visual taste. wshobson's `ui-design` / `accessibility-compliance` are broad knowledge skills of unknown eval quality.

**Likely hype or caution.** `ui-ux-pro-max-skill` has 137.5k stars after about 11 months and a premium upsell. Its premise is picking from a catalog of named styles such as glassmorphism and neumorphism. That is the "default rather than choice" pattern Anthropic's current frontend-design skill warns against. I found no independent evaluation. Star counts across this ecosystem, superpowers at ~302k included, are very high relative to typical dev-tool repos and should not be read as a quality signal on their own.

**Overlap between design skills.** Don't stack several "taste" skills (frontend-design + ui-ux-pro-max + superdesign + ui-craft). Each pushes different aesthetic rules and adds listing cost. Choose one design skill and pair it with one review skill (`web-design-guidelines`).

### Gaps
- I found no independent, methodologically sound benchmark comparing design-quality skills (frontend-design vs ui-ux-pro-max vs others). Only vendor examples exist.
- I could not obtain last-commit dates for the community repos. "Updated" timestamps reflect any activity.

## Q4. Recommended workflows, best practices and anti-patterns

### Takeaway
The most consistently recommended loop is: design skill (plan tokens first) → implement with up-to-date docs (Context7 / Next bundled docs) and real components (shadcn/Figma Code Connect) → verify visually and functionally in a real browser (screenshot + accessibility snapshot) → audit (Lighthouse / web-design-guidelines) → iterate. The main anti-patterns:
- Generic "AI slop" aesthetics.
- Treating Figma's React+Tailwind output as final code.
- Letting the agent use stale APIs.
- Over-installing overlapping MCPs and skills.
- Ignoring the per-call payload cost of snapshots and screenshots.

### Cited Findings
**Visual self-verification**
- frontend-design itself says to "Critique your own work as you build, taking screenshots to review if your environment supports it — a picture is worth 1000 tokens" — [SKILL.md](https://github.com/anthropics/skills/blob/main/skills/frontend-design/SKILL.md)
- Playwright MCP acts on accessibility snapshots, not screenshots. Screenshots are for viewing only: "You can't perform actions based on the screenshot, use browser_snapshot for actions". The `--caps vision` flag enables coordinate-based interactions — [Playwright MCP README](https://github.com/microsoft/playwright-mcp/blob/main/README.md)
- webapp-testing recipe: start the server via `with_server.py`, wait for `networkidle`, take a screenshot or inspect the DOM, discover selectors, then act — [SKILL.md](https://github.com/anthropics/skills/blob/main/skills/webapp-testing/SKILL.md)
- Chrome DevTools MCP for quality audits:
  - `lighthouse_audit` returns scores, failing audits and flagged DOM nodes for accessibility, SEO and best practices.
  - `performance_start_trace` → `performance_analyze_insight` for Core-Web-Vitals-style analysis.
  - Source: [tool-reference](https://github.com/ChromeDevTools/chrome-devtools-mcp/blob/main/docs/tool-reference.md)

**Figma → code workflow** (Figma's own recommended CLAUDE.md rules)
- Required flow:
  1. `get_design_context` first.
  2. If the output is truncated, run `get_metadata` and re-fetch only the needed nodes.
  3. Run `get_screenshot`.
  4. Only then download assets and implement.
  5. "Treat the Figma MCP output (React + Tailwind) as a representation of design and behavior, not as final code style". Replace utilities with project tokens and reuse existing components.
  6. Validate against the screenshot for 1:1 parity.
- Asset rules: "If the Figma MCP server returns a localhost source for an image or an SVG, use that image or SVG source directly", and "DO NOT import/add new icon packages".
- File hygiene: use components, link them via Code Connect ("Without it, the model is guessing"), use variables for spacing/color/radius/type, name layers semantically (`CardContainer`, not `Group 5`), use Auto layout.
- Prompt examples: "Use `src/components/ui` components", "Add this to `src/components/marketing/PricingCard.tsx`".
- Source: [figma/mcp-server-guide README](https://github.com/figma/mcp-server-guide/blob/main/README.md)

**Avoiding outdated APIs**
- Context7: append "use context7" to prompts, or add a CLAUDE.md rule to always use it for library docs. `npx ctx7 setup` installs a skill that triggers this automatically. Example: "How do I set up a Next.js 16 proxy? use context7" — [Context7 README](https://github.com/upstash/context7/blob/master/README.md)
- For Next.js 16+, rely on the version-matched docs in `node_modules/next/dist/docs/`. next-devtools-mcp's `nextjs_docs` now just points there. On Next.js below 16 it recommends `npx @next/codemod@latest upgrade latest` — [next-devtools-mcp README](https://github.com/vercel/next-devtools-mcp/blob/main/README.md)
- Modern Web Guidance exists because "Coding agents often default to older patterns because LLM training data contains vast amounts of legacy code". It steers agents to native platform APIs (View Transitions, top-layer animations…) instead of heavy JS/polyfills — [README](https://github.com/GoogleChrome/modern-web-guidance/blob/main/README.md)

**Context and token hygiene**
- Claude Code MCP tool search is on by default: "Only tool names and server instructions load at session start, so adding more MCP servers has minimal impact on your context window". It is disabled with a custom `ANTHROPIC_BASE_URL`, `ENABLE_TOOL_SEARCH=false`, or older models — [Claude Code MCP docs](https://code.claude.com/docs/en/mcp)
- Claude Code warns when an MCP tool output exceeds 10,000 tokens and caps it at 25,000 by default (`MAX_MCP_OUTPUT_TOKENS`). Big accessibility snapshots and traces hit this — [Claude Code MCP docs](https://code.claude.com/docs/en/mcp)
- Every installed skill adds to the per-turn listing. Use `/skill-doctor` and `/context` to audit, and set `"name-only"` in `skillOverrides` for low-priority skills — [Claude Code skills docs](https://code.claude.com/docs/en/skills)
- Ways tools reduce payload:
  - Playwright MCP: `--snapshot-mode none`, the find-in-snapshot search, `--mobile`.
  - agent-browser: `screenshot --if-changed`, `snapshot -i`, the `core` MCP profile.
  - Chrome DevTools MCP: `--slim`.
  - Microsoft: CLI+skills "avoid loading large tool schemas and verbose accessibility trees".
  - Sources: [Playwright MCP](https://github.com/microsoft/playwright-mcp/blob/main/README.md), [agent-browser](https://github.com/vercel-labs/agent-browser/blob/main/README.md), [CDT](https://github.com/ChromeDevTools/chrome-devtools-mcp/blob/main/README.md), [playwright-cli](https://github.com/microsoft/playwright-cli/blob/main/README.md)

**Aesthetic anti-patterns ("AI slop")**
- 2025 list: Inter/Roboto/Open Sans/Lato, purple gradients on white, minimal animation — [Claude blog](https://claude.com/blog/improving-frontend-design-through-skills)
- web-artifacts-builder: "excessive centered layouts, purple gradients, uniform rounded corners, and Inter font" — [SKILL.md](https://github.com/anthropics/skills/blob/main/skills/web-artifacts-builder/SKILL.md)
- 2026 list in frontend-design:
  - Cream/terracotta (#F4F1EA/#D97757).
  - Black with an acid-green accent.
  - Broadsheet hairlines.
  - The SaaS-card kit.
  - ALL-CAPS eyebrows, '·'-joined meta strings, '→' on buttons, fake 01/02/03 numbering, fade-slide-up on every section.
  - "the brief's own words always win". If the brief asks for one of these looks, do it.
  - Source: [SKILL.md](https://github.com/anthropics/skills/blob/main/skills/frontend-design/SKILL.md)
- shadcn code-level anti-patterns: raw colors (`bg-blue-500`), manual `dark:` overrides, `space-y-*`, overriding component typography via `className` — [shadcn SKILL.md](https://github.com/shadcn-ui/ui/blob/main/skills/shadcn/SKILL.md)

**Security and privacy pitfalls**
- Chrome DevTools MCP "exposes content of the browser instance to the MCP clients". Avoid sensitive data. Telemetry and CrUX are on by default — [CDT README](https://github.com/ChromeDevTools/chrome-devtools-mcp/blob/main/README.md)
- Playwright `--extension` mode reuses your logged-in browser sessions — [Playwright MCP README](https://github.com/microsoft/playwright-mcp/blob/main/README.md)
- Anthropic does not verify third-party plugins — [claude-plugins-official](https://github.com/anthropics/claude-plugins-official/blob/main/README.md)
- Modern Web Guidance and the Vercel plugin collect telemetry — [MWG](https://github.com/GoogleChrome/modern-web-guidance/blob/main/README.md), [vercel-plugin](https://github.com/vercel/vercel-plugin/blob/main/README.md)

### Inferences
**Suggested lean frontend stack for Claude Code (Oct 2026).** Each item is sourced above; the combination is my synthesis.
1. `/plugin install frontend-design@claude-plugins-official`
2. Docs: `npx ctx7 setup --claude` (CLI+skill mode) or `/plugin install context7@claude-plugins-official`. For Next 16+, rely on the bundled docs plus `claude mcp add next-devtools npx next-devtools-mcp@latest`.
3. Components: `npx skills add shadcn/ui`, and optionally `npx shadcn@latest mcp init --client claude`.
4. Browser verification, one primary:
   - `npm install -g @playwright/cli@latest && playwright-cli install --skills`, or
   - `claude mcp add playwright npx @playwright/mcp@latest`.
   - Add Chrome DevTools MCP via its plugin for perf and Lighthouse work.
5. Review: `npx skills add vercel-labs/agent-skills --skill web-design-guidelines --skill react-best-practices -a claude-code` (constructed from the CLI flags). Optionally add Modern Web Guidance.
6. Design source: `claude plugin install figma@claude-plugins-official` if the team has Figma Dev/Full seats.

**Example prompts to pass along**
- "Use the frontend-design skill. First give me a token plan (4–6 hex colors, type, ASCII wireframe), critique it against the brief, then build. After building, open it with playwright-cli at 375px and 1440px, screenshot both, and fix anything that reads as a template default."
- "Implement this Figma frame <link> into src/components/marketing/PricingCard.tsx using our existing Button/Card; get_design_context + get_screenshot first; use our tokens, not raw Tailwind colors."
- "Run lighthouse_audit and a performance trace on http://localhost:3000 and fix the top 3 accessibility/perf issues."
- "Review src/app/**/*.tsx with web-design-guidelines."

**Pitfalls to flag**
- Generated UI often passes a screenshot check but fails keyboard focus and reduced-motion checks. The skill's "quality floor" plus Lighthouse covers this.
- Persistent Playwright profiles conflict across parallel sessions.
- Figma Starter/View seats get only 6 calls/month.
- 21st generation needs a paid AI subscription.
- Storybook plugin install paths may change after the repo move.

### Gaps
- No Anthropic doc found that formally prescribes "frontend-design + Playwright screenshot loop" as an official workflow. It is implied by the skill's screenshot advice and by vendor docs, not stated as an official recipe.
- No controlled data on how much the screenshot loop improves design quality.

## Q5. Consolidated shortlist: install commands and signals (objective deliverable)

### Takeaway
The table below collects all verified items. The tags mean:
- "Official" = authored by the vendor of the underlying product or by Anthropic.
- "Marketplace" = listed in `claude-plugins-official`.

Stars were checked 2026-10-19.

### Cited Findings
| Item | Maintainer / status | Stars (2026-10-19) | Install in Claude Code (verbatim unless marked) | Source |
|---|---|---|---|---|
| frontend-design (skill/plugin) | Anthropic, official, Marketplace | repo anthropics/skills 182,158 | `/plugin install frontend-design@claude-plugins-official` or `/plugin marketplace add anthropics/skills` + `/plugin install example-skills@anthropic-agent-skills` | [skills](https://github.com/anthropics/skills), [official mkt](https://github.com/anthropics/claude-plugins-official) |
| webapp-testing, web-artifacts-builder, theme-factory, brand-guidelines | Anthropic (in example-skills), also in Claude.ai paid plans | same | `/plugin install example-skills@anthropic-agent-skills` | [README](https://github.com/anthropics/skills/blob/main/README.md) |
| playground, typescript-lsp | Anthropic, Marketplace | — | `/plugin install playground@claude-plugins-official` (constructed pattern) | [marketplace.json](https://github.com/anthropics/claude-plugins-official/blob/main/.claude-plugin/marketplace.json) |
| Playwright MCP | Microsoft, official, Marketplace (`playwright`) | 38,367 | `claude mcp add playwright npx @playwright/mcp@latest` | [README](https://github.com/microsoft/playwright-mcp) |
| Playwright CLI + skills | Microsoft, official | 14,373 | `npm install -g @playwright/cli@latest` → `playwright-cli install --skills` | [README](https://github.com/microsoft/playwright-cli) |
| Chrome DevTools MCP | Google Chrome DevTools, official, Marketplace | 53,839 | `claude mcp add chrome-devtools --scope user npx chrome-devtools-mcp@latest` or `/plugin marketplace add ChromeDevTools/chrome-devtools-mcp` + `/plugin install chrome-devtools-mcp@chrome-devtools-plugins` | [client config](https://github.com/ChromeDevTools/chrome-devtools-mcp/blob/main/docs/client-configurations.md) |
| agent-browser (CLI) | Vercel Labs | 44,248 | `npm install -g agent-browser` → `agent-browser install` | [README](https://github.com/vercel-labs/agent-browser) |
| Figma MCP (remote) + skills | Figma, official, Marketplace | guide repo 2,090 | `claude plugin install figma@claude-plugins-official` or `claude mcp add --transport http figma https://mcp.figma.com/mcp` | [guide](https://github.com/figma/mcp-server-guide) |
| Framelink MCP for Figma | community (GLips) | 16,009 | (constructed) `claude mcp add framelink -- npx -y figma-developer-mcp --figma-api-key=YOUR-KEY --stdio` | [README](https://github.com/GLips/Figma-Context-MCP) |
| shadcn MCP | shadcn, official | ui repo 125,943 | `npx shadcn@latest mcp init --client claude` | [docs](https://github.com/shadcn-ui/ui/blob/main/apps/v4/content/docs/(root)/mcp.mdx) |
| shadcn skill | shadcn, official | same | `npx skills add shadcn/ui` | [docs](https://github.com/shadcn-ui/ui/blob/main/apps/v4/content/docs/(root)/skills.mdx) |
| Context7 | Upstash, official; Marketplace (community-managed tag) | 63,304 | `npx ctx7 setup --claude` or `/plugin install context7@claude-plugins-official` | [README](https://github.com/upstash/context7) |
| next-devtools-mcp | Vercel, official (Next.js 16+) | 830 | `claude mcp add next-devtools npx next-devtools-mcp@latest` | [README](https://github.com/vercel/next-devtools-mcp) |
| Storybook MCP addon + plugin | Storybook, official, experimental; repo archived and moved to storybookjs/storybook (v10.6.0) | 271 (archived repo) | `claude plugin marketplace add storybookjs/mcp@main --scope user` + `claude plugin install storybook@storybook --scope user` | [plugin README](https://github.com/storybookjs/mcp/blob/main/packages/claude-plugin/README.md) |
| 21st MCP (ex-Magic MCP) | 21st.dev, commercial | 6,113 | `npx @21st-dev/cli@latest init --client claude` | [README](https://github.com/21st-dev/magic-mcp) |
| Magic UI MCP | Magic UI, official | 206 | `npx @magicuidesign/cli@latest install claude` | [README](https://github.com/magicuidesign/mcp) |
| Modern Web Guidance | Google Chrome, official, preview, Marketplace | 2,502 | `/plugin marketplace add GoogleChrome/modern-web-guidance` + `/plugin install modern-web-guidance@googlechrome` | [README](https://github.com/GoogleChrome/modern-web-guidance) |
| vercel-labs/agent-skills | Vercel, official | 32,636 | `npx skills add vercel-labs/agent-skills` | [README](https://github.com/vercel-labs/agent-skills) |
| Vercel plugin | Vercel, official, Marketplace (`vercel`) | 310 | `npx plugins add vercel/vercel-plugin` | [README](https://github.com/vercel/vercel-plugin) |
| obra/superpowers | community (Jesse Vincent/obra), Marketplace | 301,966 | `/plugin install superpowers@claude-plugins-official` | [README](https://github.com/obra/superpowers) |
| wshobson/agents (ui-design, accessibility-compliance, frontend-mobile-development) | community | 41,111 | `/plugin marketplace add wshobson/agents` + `/plugin install ui-design@claude-code-workflows` (constructed from the README pattern) | [README](https://github.com/wshobson/agents), [plugins.md](https://github.com/wshobson/agents/blob/main/docs/plugins.md) |
| ui-ux-pro-max-skill | community (nextlevelbuilder), has premium tier | 137,500 | `/plugin marketplace add nextlevelbuilder/ui-ux-pro-max-skill` + `/plugin install ui-ux-pro-max@ui-ux-pro-max-skill` | [README](https://github.com/nextlevelbuilder/ui-ux-pro-max-skill) |
| superdesign | Superdesign dev, Inc., Marketplace | 846 | `npx skills add superdesigndev/superdesign-skill` | [GitHub](https://github.com/superdesigndev/superdesign-skill) |
| axe MCP Server | Deque, commercial | n/a | see Deque docs (not verified) | [Deque](https://www.deque.com/axe/mcp-server/) |

**Claude.ai / Claude Desktop compatibility**
- Anthropic example skills are available in Claude.ai paid plans — [anthropics/skills](https://github.com/anthropics/skills/blob/main/README.md)
- The Storybook plugin supports Claude Desktop — [plugin README](https://github.com/storybookjs/mcp/blob/main/packages/claude-plugin/README.md)
- `vercel-deploy-claimable` is designed for claude.ai and Claude Desktop — [agent-skills README](https://github.com/vercel-labs/agent-skills/blob/main/README.md)
- Plugins installed via `/plugin` stay on the local machine and are not added to the claude.ai account — [Claude Code docs](https://code.claude.com/docs/en/discover-plugins)

### Inferences
**Renames, deprecations and supersessions**
- "Magic MCP" is now "21st MCP", and old keys were reset.
- next-devtools-mcp 0.3.x removed its docs and upgrade tools.
- `storybookjs/mcp` is archived and moved.
- Figma's desktop MCP has been de-emphasized in favor of the remote server.
- frontend-design SKILL.md was rewritten, so older tutorials describe the "bold fonts / gradients" version.
- Playwright's maintainers now recommend the CLI+skills route over MCP for coding agents.

**Remote vs local servers.** Remote HTTP servers (Figma, Context7, Vercel, 21st) can also be added to Claude.ai/Desktop as connectors. Local stdio servers (Playwright, Chrome DevTools, shadcn, next-devtools) need the local machine. This is inferred from transport type; I did not check per-product Claude.ai connector listings.

### Gaps
- Exact last-commit dates for each repo were not obtainable in this session.
- I did not verify how Deque's axe MCP server is installed in Claude Code.
- I did not check whether `chrome-devtools-mcp@claude-plugins-official` includes the same skills as the `chrome-devtools-plugins` marketplace version.
