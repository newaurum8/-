# Claude Code for FRONTEND, round 2: additional skills/plugins/MCP servers + deep dive into top skills (state as of 2026-10-19)

**Method note for the report writer**

How the data was gathered (all on 2026-10-19):
- **Stars:** live GitHub search API, called through the GitHub MCP tool.
- **"Last release":** the publish time of the package's `latest` dist-tag, read from registry.npmjs.org. This is a better maintenance signal than GitHub's `updated_at`.
- **READMEs, SKILL.md files and docs sources:** downloaded raw from raw.githubusercontent.com, or extracted from the npm tarballs of `@nuxt/docs`, `motion-ai`, `@sveltejs/mcp`, `@tanstack/cli` and `@tanstack/intent`.
- **Blocked sites:** the vendor docs sites svelte.dev, nuxt.com, docs.expo.dev, docs.deque.com, docs.lottiefiles.com, fal.ai and browserstack.com could not be opened directly (DNS/proxy blocks). Where a fact comes only from a search-engine summary of those pages, it is marked "(search summary)". Treat those as secondary.

Command labels:
- "(verbatim)": copied from the vendor README or docs source.
- "(constructed)": assembled by me from the vendor's generic config plus the standard `claude mcp add` syntax.

This round deliberately skips items already covered in round 1: frontend-design, Context7, shadcn, Playwright MCP/CLI, Chrome DevTools MCP, the Figma plugin and Framelink, next-devtools-mcp, vercel-labs agent-skills, Modern Web Guidance, 21st, Storybook MCP, agent-browser, ui-ux-pro-max and superpowers. The only exception is the deep dive in Q6.

## Q1. Framework-specific official MCPs/skills (Svelte, Angular, Vue/Nuxt, Astro, Tailwind v4, React Native/Expo, TanStack, React Router)

### Takeaway
Most major frameworks now ship official, maintained agent tooling, and none of it was in round 1:
- **Svelte:** MCP + Claude Code plugin with skills and a subagent.
- **Angular:** `ng mcp` built into the CLI, plus official skills.
- **Nuxt:** remote docs MCP.
- **Astro:** remote docs MCP.
- **Expo:** remote MCP + official plugin in the Anthropic marketplace.
- **React Router:** a lean skill that points the agent to the docs bundled in `node_modules`.

Two notable gaps:
- **Vue core:** has only a community skill set (`vuejs-ai/skills`).
- **Tailwind Labs:** publishes no official skill or MCP.

Several items were renamed, archived or slimmed down in 2026: `sveltejs/mcp` → `sveltejs/ai-tools`, `remix-run/agent-skills` was archived, TanStack CLI no longer ships an MCP command, and Recraft/Penpot moved (see Q4/Q5).

### Cited Findings

**Svelte (official, Svelte core team)**
- Repo `sveltejs/ai-tools` ("The official svelte MCP for all your agentic needs"): 334 stars, not archived. The npm package `@sveltejs/mcp` 0.1.27 was published 2026-10-19 (created 2025-09-24), so releases are very frequent — [GitHub](https://github.com/sveltejs/ai-tools), [npm](https://www.npmjs.com/package/@sveltejs/mcp)
- Docs commands for Claude Code (search summary):
  - Remote: `claude mcp add -t http -s [scope] svelte https://mcp.svelte.dev/mcp`
  - Local: `claude mcp add -t stdio -s [scope] svelte -- npx -y @sveltejs/mcp`. The official page uses the `--` separator; some copies omit it.
  - `[scope]` = user / project / local.
  - The docs also recommend adding a usage prompt to `CLAUDE.md`.
  - Sources: [svelte.dev local setup](https://svelte.dev/docs/ai/local-setup), [remote setup](https://svelte.dev/docs/ai/remote-setup)
- Claude Code plugin. The repo contains `.claude-plugin/marketplace.json` with marketplace name `svelte`, plugin `svelte` and source `./plugins/claude/svelte`. Its description is "A plugin for all things Svelte development, MCP, skills, and more". It also declares an LSP server (`svelteserver --stdio` for `.svelte` files) — [marketplace.json](https://github.com/sveltejs/ai-tools/blob/main/.claude-plugin/marketplace.json)
  - Docs say to run `/plugin marketplace add sveltejs/mcp` then `/plugin install svelte` (search summary) — [svelte.dev plugin page](https://svelte.dev/docs/mcp/plugin)
  - Fully qualified, that is `/plugin install svelte@svelte` (constructed from marketplace.json). The repo is now `sveltejs/ai-tools`; `sveltejs/mcp` is the old name.
- The plugin's `.mcp.json` runs the **local** stdio server `npx -y @sveltejs/mcp`, not the remote URL. Plugin version is 1.0.11 — [.mcp.json](https://github.com/sveltejs/ai-tools/blob/main/plugins/claude/svelte/.mcp.json), [plugin.json](https://github.com/sveltejs/ai-tools/blob/main/plugins/claude/svelte/.claude-plugin/plugin.json)
- MCP tools in the published package: `list-sections`, `get-documentation`, `svelte-autofixer`, `playground-link`. I grepped these from the npm tarball of `@sveltejs/mcp` 0.1.27 — [npm](https://www.npmjs.com/package/@sveltejs/mcp)
- Plugin subagent `svelte-file-editor`:
  - "MUST BE USED PROACTIVELY when creating, editing, or reviewing any .svelte file…"
  - It sets `permissionMode: acceptEdits`.
  - It is told to "fetch documentation with `get-documentation` and validate the code with `svelte-autofixer`".
  - Source: [agent file](https://github.com/sveltejs/ai-tools/blob/main/plugins/claude/svelte/agents/svelte-file-editor.md)
- Skills are `svelte-code-writer` and `svelte-core-bestpractices`. `svelte-code-writer` says it "MUST be used whenever creating, editing or analyzing any Svelte component" and calls the `@sveltejs/mcp` **CLI** via `npx`, so it works without the MCP — [SKILL.md](https://github.com/sveltejs/ai-tools/blob/main/plugins/claude/svelte/skills/svelte-code-writer/SKILL.md), [@sveltejs/opencode README](https://www.npmjs.com/package/@sveltejs/opencode)
- Remote-server caveat from the repo README: the SSE channel is shut down immediately on Vercel, so "we can't use `server.log` and we are not sending `list-changed` notifications" — [README](https://github.com/sveltejs/ai-tools/blob/main/README.md)

**Angular (official, Angular team / Google)**
- The Angular CLI includes an MCP server, run with `npx @angular/cli mcp`. It is in `angular/angular-cli` (27,014 stars). `@angular/cli` 22.2.3 was published 2026-10-15 — [angular.dev/ai/mcp source](https://github.com/angular/angular/blob/main/adev/src/content/ai/mcp-server-setup.md), [npm](https://www.npmjs.com/package/@angular/cli)
- Default tools:
  - `ai_tutor`
  - `devserver_start` / `devserver_stop` / `devserver_wait_for_build`
  - `get_best_practices` ("crucial for standalone components, typed forms")
  - `list_projects`
  - `onpush_zoneless_migration`
  - `run_target` (build/test/lint/e2e/deploy)
  - `search_documentation` (searches angular.dev)
  - Flags: `--read-only` ("Only registers tools that do not modify the project") and `--local-only` (no internet).
  - Source: [mcp-server-setup.md](https://github.com/angular/angular/blob/main/adev/src/content/ai/mcp-server-setup.md)
- The docs have config tabs only for Antigravity, Cursor and VS Code, all `{"command":"npx","args":["-y","@angular/cli","mcp"]}`. They have **no Claude Code tab**. Claude Code equivalent: `claude mcp add angular-cli -- npx -y @angular/cli mcp` (constructed) — [source](https://github.com/angular/angular/blob/main/adev/src/content/ai/mcp-server-setup.md)
- Documented workflows:
  - Zoneless/OnPush migration loop: call `onpush_zoneless_migration`, apply "the single actionable change", run `run_target` "test", repeat.
  - TDD loop using `devserver_wait_for_build`.
  - Source: [mcp-server-setup.md](https://github.com/angular/angular/blob/main/adev/src/content/ai/mcp-server-setup.md)
- Official Angular Agent Skills:
  - `angular-developer` covers signals, linkedSignal, resource, httpResource, forms, DI, routing, SSR, ARIA, animations and testing.
  - `angular-new-app` scaffolds a new app.
  - Install: `npx skills add https://github.com/angular/skills` (verbatim).
  - The `angular/skills` repo has 691 stars and is a read-only mirror generated from `angular/angular` `skills/dev-skills/`.
  - Sources: [angular/skills](https://github.com/angular/skills), [agent-skills.md](https://github.com/angular/angular/blob/main/adev/src/content/ai/agent-skills.md)

**Vue / Nuxt**
- **Nuxt docs MCP (official, nuxt.com).** The `@nuxt/docs` 4.6.2 package gives `claude mcp add --transport http nuxt https://nuxt.com/mcp` (verbatim). It is a remote HTTP server with no auth ("Authentication: `None`" in the ChatGPT steps). A search snippet of an older page shows the name `nuxt-remote`, so the docs changed the server name — [Nuxt docs source (npm @nuxt/docs)](https://www.npmjs.com/package/@nuxt/docs), [nuxt.com/docs/4.x/guide/ai/mcp](https://nuxt.com/docs/4.x/guide/ai/mcp)
- Nuxt MCP contents:
  - Resources: `resource://nuxt-com/documentation-pages` (default v4.x), blog-posts, deploy-providers.
  - Tools: `list-documentation-pages` (with 3.x/4.x/5.x/all filter), `get-documentation-page`, `get-getting-started-guide`, `list-blog-posts`, `get-blog-post`, `list-deploy-providers`, `get-deploy-provider`, `list-modules`, `get-module`, `get-changelog`.
  - Prompts: `find-documentation-for-topic`, `deployment-guide`, `migration-help`.
  - An optional `X-MCP-Tools` header takes a comma-separated tool list, "to expose only the tools your assistant needs".
  - Source: [Nuxt docs source](https://www.npmjs.com/package/@nuxt/docs)
- **Nuxt UI MCP.** Endpoint `https://ui.nuxt.com/mcp`, added with `claude mcp add --transport http nuxt-ui https://ui.nuxt.com/mcp`. Tools: `search_components`, `search_composables`, `search_icons`, `get_component`, `get_component_metadata`. This comes from a secondary source only (search summary) — [claudeskills.info](https://claudeskills.info/skills/nuxt/ui/nuxt-ui/). `nuxt/ui` has 7,021 stars; `@nuxt/ui` 4.12.0 was published 2026-10-15 — [GitHub](https://github.com/nuxt/ui)
- **`nuxt-mcp-dev` / `vite-plugin-mcp`** (Anthony Fu, Nuxt/Vue core member; community-official grey zone):
  - "MCP server helping models to understand your local Vite/Nuxt app better"
  - The README flags "Experimental. Use with caution."
  - 911 stars. Both packages were last published at 0.3.2 on 2025-12-31, so there has been no release in ~10 months.
  - The README itself redirects: build your own MCP with `@nuxtjs/mcp-toolkit`; for docs use the Nuxt docs MCP.
  - Sources: [antfu/nuxt-mcp-dev](https://github.com/antfu/nuxt-mcp-dev), [npm vite-plugin-mcp](https://www.npmjs.com/package/vite-plugin-mcp)
- **`@nuxtjs/mcp-toolkit`** (nuxt-modules org) is for *building* an MCP server inside your Nuxt app, not for coding assistance. 179 stars; 0.24.2 published 2026-10-12 — [GitHub](https://github.com/nuxt-modules/mcp-toolkit)
- **Vue skills (community, not official).** `vuejs-ai/skills` has 2,909 stars. The README warns: "🚧 Early Experiment / Community Project… may be incomplete due to hallucinations". Claude Code install (verbatim):
  - `/plugin marketplace add vuejs-ai/skills`
  - `/plugin install vue-skills-bundle@vue-skills`, or individually `/plugin install vue-best-practices@vue-skills`
  - Skills: vue-best-practices, vue-options-api-best-practices, vue-router-best-practices, vue-pinia-best-practices, vue-testing-best-practices, vue-jsx-best-practices, vue-debug-guides, create-adaptable-composable.
  - Tip from the README: prefix prompts with "use vue skill", because "skill triggering may be inconsistent".
  - Source: [README](https://github.com/vuejs-ai/skills)

**Astro (official, withastro)**
- `withastro/docs-mcp` has 67 stars and was updated 2026-10-16. It is a remote, streamable-HTTP-only server. Claude Code command: `claude mcp add --transport http "Astro docs" https://mcp.docs.astro.build/mcp` (verbatim). "Some tools only support _SSE_ transport… not compatible with this server" — [README](https://github.com/withastro/docs-mcp)

**React Native / Expo (official, Expo)**
- Expo MCP Server:
  - Remote, URL `https://mcp.expo.dev/mcp`, OAuth.
  - Claude Code: `claude mcp add --transport http expo https://mcp.expo.dev/mcp`, then run `/mcp` to authenticate (verbatim).
  - "If you installed the `expo` plugin, it already registers this server."
  - It is also a Claude.ai connector (claude.ai/directory/expo).
  - Source: [Expo docs source docs/pages/mcp.mdx](https://github.com/expo/expo/blob/main/docs/pages/mcp.mdx)
- Local capabilities:
  - "only available in **SDK 54 and later**". Setup: `npx expo install expo-mcp --dev`, `npx expo whoami || npx expo login`, then `EXPO_UNSTABLE_MCP_SERVER=1 npx expo start`.
  - They add simulator screenshots, tap by testID, open React Native DevTools, and generate an expo-router sitemap.
  - Pitfall: "Whenever you start or stop the development server, you need to **reconnect or restart** your MCP server connection".
  - Limitations: a single dev server; iOS simulators only; iOS local features only on macOS hosts.
  - Privacy: local data (e.g. screenshots) is proxied *through* Expo's server.
  - Source: [mcp.mdx](https://github.com/expo/expo/blob/main/docs/pages/mcp.mdx)
- Plan requirement conflict:
  - The current docs source lists only "An Expo account" plus "An Expo project on the latest SDK" (`default@sdk-58`) — [mcp.mdx](https://github.com/expo/expo/blob/main/docs/pages/mcp.mdx)
  - Older pages and Expo's blog said an EAS paid plan was required (search summary) — [Expo blog](https://expo.dev/blog/become-an-ai-native-developer-with-the-expo-mcp-server), [docs.expo.dev/eas/ai/mcp](https://docs.expo.dev/eas/ai/mcp)
- `expo/expo-mcp` (local packages `expo-mcp`, `@expo/mcp-tunnel`): 9 stars; last npm release 0.2.4 on 2026-02-12 — [GitHub](https://github.com/expo/expo-mcp), [npm](https://www.npmjs.com/package/expo-mcp)
- Expo skills (official):
  - `expo/skills` has 2,937 stars. It is in the Anthropic marketplace as `expo`.
  - Install: `claude plugin install expo@claude-plugins-official` or `/plugin install expo@claude-plugins-official` (verbatim). Other agents: `npx skills@latest add expo/skills --skill '*'`.
  - The skills are split into "Framework (open source)" and "Services & paid distribution". Framework skills: expo-overview (entry point), expo-router, expo-animation, expo-native-ui, expo-design-system, expo-ui, expo-dom, expo-web-to-native, expo-upgrade, … EAS skills: eas-app-stores, eas-hosting, eas-workflows, eas-update, eas-simulator, …
  - "every services skill opens with a costs/plan-limits note".
  - Telemetry is off by default; `EXPO_SKILLS_TELEMETRY=0` / `DO_NOT_TRACK=1`.
  - Source: [expo/skills README](https://github.com/expo/skills)
- Callstack React Native skills (vendor-community; Callstack is a major RN consultancy):
  - `callstackincubator/agent-skills` has 1,675 stars. Install: `npx skills@latest add callstackincubator/agent-skills --skill '*'` (verbatim).
  - Skills: react-native-best-practices (FPS, startup, memory, bundle), react-navigation (v7), upgrading-react-native, github-actions (simulator/emulator artifacts), agent-device and dogfood (device automation / exploratory QA), brownfield migration.
  - Source: [README](https://github.com/callstackincubator/agent-skills)

**TanStack (official)**
- `TanStack/cli` (1,301 stars):
  - Its repo description still says "Project Scaffolding, MCP Server, Agent Skills Installation".
  - The current README and the `@tanstack/cli` 0.72.0 package (published 2026-10-16) show **no `mcp` command**. Commands in dist: add, add-on, create, doc, ecosystem, libraries, search-docs, …
  - The README promotes "Agent-friendly introspection" instead: `npx @tanstack/cli search-docs "loaders" --library router --framework react --json`, `npx @tanstack/cli libraries --json`.
  - Telemetry is on by default; disable with `DO_NOT_TRACK=1` or `TANSTACK_CLI_TELEMETRY_DISABLED=1`.
  - Sources: [README](https://github.com/TanStack/cli), [npm](https://www.npmjs.com/package/@tanstack/cli)
- `TanStack/intent` (352 stars; `@tanstack/intent` 0.5.6 published 2026-10-19):
  - "A CLI for library maintainers to generate, validate, and ship Agent Skills alongside their npm packages."
  - Consumer usage: `npx @tanstack/intent@latest install` "writes guidance that tells your agent to discover and load matching package skills. Update the package, and skills update too". `npx @tanstack/intent@latest list` and `npx @tanstack/intent@latest load @tanstack/query#fetching` also exist.
  - Sources: [README (npm tarball)](https://www.npmjs.com/package/@tanstack/intent), [GitHub](https://github.com/TanStack/intent)

**React Router / Remix (official)**
- `remix-run/agent-skills` (134 stars) is **archived**:
  - The skill moved into the main repo, the official docs now ship in `node_modules`, and the skill is "much leaner".
  - New install: `npx skills add https://github.com/remix-run/react-router --skill react-router` (verbatim).
  - "Moving forward, adding the Agent Skill will be part of React Router's CLI when initiating a new project."
  - Source: [archived README](https://github.com/remix-run/agent-skills)
- The new skill is mode-aware. It says to identify Framework / Data / Declarative / RSC mode by concrete signals (`react-router.config.ts`, `createBrowserRouter`, `<BrowserRouter>`, `unstable_reactRouterRSC`), "then read the installed docs for the installed package version". It also warns: "Do not apply Framework/Data patterns to a Declarative app" — [SKILL.md](https://github.com/remix-run/react-router/blob/main/.agents/skills/react-router/SKILL.md)

**Tailwind CSS v4**
- I found no official Tailwind Labs skill or MCP. A search returned only third-party skills (search summary) — [search summary sources: skillselion guide](https://skillselion.com/guides/best-tailwind-css-skills-for-claude-code). A raw check for `tailwindlabs/tailwindcss/.agents/skills/tailwindcss/SKILL.md` returned 404 — [tailwindlabs/tailwindcss](https://github.com/tailwindlabs/tailwindcss)
- Best community option for v4: `Lombiq/Tailwind-Agent-Skills` (77 stars), skill `tailwind-4-docs`. It provides "a curated gotchas list, an implementation playbook, and a local docs snapshot generator" and "Does not bundle the Tailwind docs themselves due to upstream licensing". You must initialize it: `python skills/tailwind-4-docs/scripts/sync_tailwind_docs.py --accept-docs-license`. It needs Python 3.8+, git and internet — [README](https://github.com/Lombiq/Tailwind-Agent-Skills)
- Other community options:
  - `jezweb/claude-skills` (1,069 stars), "Skills for Claude Code CLI such as full stack dev Cloudflare, React, Tailwind v4" — [GitHub](https://github.com/jezweb/claude-skills)
  - `edisonmbli/refactoring-ui-skill` (97 stars), an unofficial *Refactoring UI* rulebook "151 tracked rules, design token generation, and Tailwind mappings" — [GitHub](https://github.com/edisonmbli/refactoring-ui-skill)

### Inferences
- **Recommended per-framework picks:**
  - Svelte: the `svelte` plugin. It gives MCP + LSP + subagent + skills in one install. Its `.mcp.json` launches a local `npx` process, so it needs Node locally. Use the remote URL in cloud/sandboxed sessions.
  - Angular: `ng mcp` + `angular/skills`. Use `--read-only` for review-only sessions.
  - Nuxt: docs MCP plus Nuxt UI MCP if you use Nuxt UI.
  - Vue: community `vuejs-ai/skills` + Context7.
  - Astro: docs MCP.
  - Expo: the `expo` plugin. It wires the MCP, so don't add the server twice.
  - React Router: the in-repo `react-router` skill.
  - TanStack: Intent + `search-docs --json`.
  - Tailwind v4: Context7 or Lombiq. There is no official option.
- **Convergent pattern across vendors:** React Router, TanStack Intent, Next.js (round 1) and Angular all ship *version-matched docs/skills with the package* (`node_modules`) rather than relying on a remote docs MCP. When a framework does this, prefer it over Context7, because it matches the installed version.
- **Pitfall: duplicate registration.** Installing a vendor plugin (svelte, expo) *and* running `claude mcp add` for the same server registers two copies.
- **Pitfall: the TanStack CLI MCP.** It appears to have been removed. Old tutorials or registry entries that tell you to run a TanStack MCP command are likely stale. This is inferred from the absence of an `mcp` command in the 0.72.0 dist and README.

### Gaps
- I could not open svelte.dev directly, so the Svelte Claude Code commands come from a search summary. They match the plugin files I read raw.
- Expo plan requirement: the current docs source lists no paid plan, but older official pages and the blog said a paid EAS plan was required. I could not reach expo.dev/pricing.
- I found no official Vue-core MCP or skill, and no official Tailwind Labs MCP or skill. Absence is based on search and raw-path checks, not an exhaustive org listing; GitHub org listings were blocked.
- No official "Nuxt skills" repo was found; `nuxt/skills` returned 404.
- Nuxt UI MCP details are secondary-source only.

## Q2. Animation & interaction: Motion AI Kit, GSAP skills, Lottie/Rive for web UIs

### Takeaway
- **Motion:** in 2026 Motion (ex-Framer Motion) shipped an official **Motion AI Kit**. It provides skills, a reviewer subagent and a free hosted MCP at `mcp.motion.dev`, installed by `npx motion-ai`. Paid Motion+ adds MotionScore performance audits.
- **GSAP:** official skills (16.6k stars) installable as a Claude Code marketplace.
- **LottieFiles:** an official remote MCP for account assets.
- **Rive:** no MCP found.

### Cited Findings
- **Motion AI Kit (official, Motion / Matt Perry):**
  - Repo `motiondivision/ai-kit` has 48 stars, created 2026-07-27, description "A Cursor plugin for Motion". `motion-ai` 14.2.0 was published 2026-10-15; the core `motion` library (34,352 stars) shipped 14.4.0 on 2026-10-19 — [GitHub](https://github.com/motiondivision/ai-kit), [npm motion-ai](https://www.npmjs.com/package/motion-ai), [motion](https://github.com/motiondivision/motion)
  - Install for every non-Cursor agent: `npx motion-ai` (verbatim). It "Installs the Motion skills and configures the free hosted MCP server for Claude Code, Codex, Amp, OpenCode, Gemini CLI, Copilot… No API key needed". `npx motion-ai --plus` adds the Motion+ MCP — [README](https://github.com/motiondivision/ai-kit)
  - The installer configures `{ name: "motion", url: "https://mcp.motion.dev" }` and `{ name: "motion-plus", url: "https://mcp.motion.dev/plus" }`, and writes to `.claude` for Claude Code. The package also ships `content/agents/motion-reviewer.md` and `content/rules/motion.mdc`. I grepped these from the `motion-ai` tarball's `dist/install.js` and `dist/agents.js` — [npm](https://www.npmjs.com/package/motion-ai)
  - Skill `motion` covers best practices (vanilla JS, React, Vue, Base UI, Radix), docs and examples search, CSS spring generation via `linear()`, MotionScore audits and a transition preview. Its argument hints: "audit src/Modal.tsx", "spring bounce 0.3", "upgrade" — [SKILL.md in tarball](https://www.npmjs.com/package/motion-ai)
  - Free vs paid: "Best practices, search and easing generation work without an account". MotionScore audits are Motion+. They grade S–F: e.g. "`height` transition… Tier D… Upgrade: Motion's `layout` prop (B) or a `scaleY` transform (S)". Motion+ also unlocks source search over "450+ Motion Examples and Motion UI components" — [README](https://github.com/motiondivision/ai-kit)
  - Actionable rules quoted from `best-practices/index.md`:
    - "Prefer transforms… `opacity`, `clipPath` and `filter`… When an element's size or position changes because of layout, use Motion's `layout` animations instead of animating `width`"
    - "Accelerated animations are de-optimised to the main thread when they use `onUpdate`… `type: "inertia"`, layout animations, on SVG elements"
    - "Keep UI animations short: about 150 to 300 ms for small elements, and up to about 500 ms for large surfaces"
    - For a "serious website like stock trading, don't use overshoot"
    - Source: [motion-ai tarball](https://www.npmjs.com/package/motion-ai)
  - Upgrade rule: swap `framer-motion` imports to `motion/react`; "They must never both be installed". For migration guides: "Read the whole page and follow it in order. Do not summarise it" — [SKILL.md in tarball](https://www.npmjs.com/package/motion-ai)
- **GSAP skills (official, GreenSock; cross-ref SVG notes):**
  - `greensock/gsap-skills` has 16,642 stars, created 2026-03-04. It covers "core API, timelines, ScrollTrigger, plugins, React/Vue/Svelte, vanilla JS and performance" — [README](https://github.com/greensock/gsap-skills)
  - Claude Code: `/plugin marketplace add greensock/gsap-skills` (verbatim). The marketplace is named `gsap-skills` and so is the plugin, so `/plugin install gsap-skills@gsap-skills` (constructed from marketplace.json). Or `npx skills add https://github.com/greensock/gsap-skills` (verbatim) — [README](https://github.com/greensock/gsap-skills), [marketplace.json](https://github.com/greensock/gsap-skills/blob/main/.claude-plugin/marketplace.json)
  - `gsap` 3.15.0 was published 2026-04-13 — [npm](https://www.npmjs.com/package/gsap)
- **LottieFiles (official):**
  - Hosted remote MCP at `mcp.lottiefiles.com/mcp` with OAuth. It connects to your workspaces, projects and animations. Tools: `operations_list`, `schema_search`, `schema_details`, `graphql_execute`.
  - A separate local npm "Lottie Creator MCP" works inside Lottie Creator. Docs were last updated Aug 6, 2026.
  - All of this is a search summary — [LottieFiles docs: Connect your client](https://docs.lottiefiles.com/en/platform/mcp/connect), [security/FAQ](https://docs.lottiefiles.com/en/platform/mcp/security)
  - A community `junmer/mcp-server-lottiefiles` exists (search only) — [glama](https://glama.ai/mcp/servers/@junmer/mcp-server-lottiefiles)
- **Rive:** a combined Lottie/Rive search returned no Rive MCP, official or community. This is a negative result, so there is no source to cite (see Gaps).

### Inferences
- **Motion vs GSAP.** For React/Vue apps, Motion AI Kit is the most frontend-relevant of the two. Its free tier (docs MCP + skill + spring generator) has no account requirement. It complements `frontend-design`'s "one orchestrated moment" rule with concrete performance rules. GSAP skills fit marketing pages, ScrollTrigger and SVG work. Don't install both unless the project uses both libraries, because their advice on choosing between CSS and a library differs.
- **Motion pitfall:** `npx motion-ai` writes MCP config and skills automatically. Review what it wrote under `.claude/` and in your MCP config afterwards. MotionScore audit output is gated, so expect "refused" responses without Motion+.
- **LottieFiles MCP** is about managing account assets via GraphQL, not generating animations. It is useful only if your team stores animations in LottieFiles. A plausible Claude Code command is `claude mcp add --transport http lottiefiles https://mcp.lottiefiles.com/mcp` (constructed).

### Gaps
- Motion's MCP tool list and Motion+ pricing were not verified; motion.dev was unreachable.
- LottieFiles details come from a search summary only. No Claude-Code-specific command was verified.
- No Rive MCP found.

## Q3. Accessibility and quality: Deque axe MCP, other a11y tools, visual regression (Chromatic, Percy, Applitools, Playwright), Lighthouse CI

### Takeaway
For a11y from Claude Code:
- **Deque's axe MCP:** official, but needs Docker plus a **paid** Axe DevTools for Web subscription.
- **BrowserStack's official MCP:** a hosted alternative with accessibility scans, plus Percy visual tests when you have a Percy license.

For visual regression:
- **Playwright's built-in `toHaveScreenshot()`:** free, driven by plain test commands, no MCP needed.
- **Applitools:** an official MCP.
- **Chromatic:** works through Storybook's addons. I found no standalone official Chromatic MCP.

Lighthouse CI still works, but its CLI has not had a release since June 2025.

### Cited Findings
- **Deque axe MCP Server (official, commercial):**
  - Repo `dequelabs/axe-mcp-server-public`: 8 stars, created 2026-02-10. "Official MCP server for Axe DevTools for Web"; distributed as Docker image `dequesystems/axe-mcp-server`.
  - Tools: **analyze** ("Scan web pages for accessibility using axe") and **remediate** ("AI-powered, code-level guidance to fix accessibility issues").
  - Requirements: Docker; "Requires a paid Axe DevTools for Web subscription".
  - Source: [README](https://github.com/dequelabs/axe-mcp-server-public)
  - Deque has a dedicated Claude Code page. It runs the Docker image over stdio with the API key from your shell environment; the server URL defaults to Deque's US SaaS and can be overridden for private cloud or on-prem. An OAuth 2.0 alternative uses an `@deque/axe-auth` helper. Verify with `/mcp`. It recommends putting an analyze→remediate workflow in `CLAUDE.md`. (search summary) — [Deque docs: Setup in Claude Code](https://docs.deque.com/devtools-server/4.0.0/en/setup-claude-code)
  - No public price found (search summary) — [Deque product page](https://www.deque.com/axe/mcp-server/)
- **BrowserStack MCP (official):**
  - `browserstack/mcp-server` has 155 stars. `@browserstack/mcp-server` 2.2.4 was published 2026-10-19.
  - Local config: `"command": "npx"` with `BROWSERSTACK_USERNAME` / `BROWSERSTACK_ACCESS_KEY` env.
  - Hosted remote: `https://mcp.browserstack.com/mcp`, "now fully stateless over Streamable HTTP".
  - Accessibility scans are possible on localhost, e.g. "Scan & help fix accessibility issues for my website running locally on localhost:3000". Open-source projects can get a free plan.
  - Source: [README](https://github.com/browserstack/mcp-server)
  - Percy tools via BrowserStack MCP need a Percy license, enabled by BrowserStack support. The Visual Test Integration Agent is Percy Web only. (search summary) — [BrowserStack docs: Percy tools](https://www.browserstack.com/docs/browserstack-mcp-server/tools/percy)
- **Applitools MCP (official):**
  - `applitools/mcp`, `@applitools/mcp` 0.8.9, published 2026-10-19 (created 2026-03).
  - Config: `"command": "npx", "args": ["--yes", "@applitools/mcp@latest"]`. Claude Code equivalent: `claude mcp add applitools-mcp -- npx --yes @applitools/mcp@latest` (constructed).
  - Limits: setup and checkpoint tools (`eyes_setup_project`, `eyes_setup_ufg`, `eyes_add_checkpoints_to_test`) "support only our Playwright Fixtures SDK". The inspect/resolve/review tools "require additional separate read and write API keys".
  - Source: [README](https://github.com/applitools/mcp)
- **Chromatic:**
  - No standalone official Chromatic MCP surfaced (search summary) — [glama listing](https://glama.ai/mcp/servers/integrations/chromatic)
  - Visual tests in Storybook come from `@chromatic-com/storybook` (5.5.1, published 2026-10-12) — [Storybook docs: visual testing](https://storybook.js.org/docs/writing-tests/visual-testing), [npm](https://www.npmjs.com/package/@chromatic-com/storybook)
  - The Storybook MCP addon is `@storybook/addon-mcp` 10.6.2 (2026-10-12), now in `storybookjs/storybook` (91,337 stars) — [npm](https://www.npmjs.com/package/@storybook/addon-mcp), [GitHub](https://github.com/storybookjs/storybook)
- **Playwright visual comparisons (no MCP needed):**
  - `await expect(page).toHaveScreenshot()`. "On first execution, Playwright test will generate reference screenshots."
  - Update baselines with `npx playwright test --update-snapshots`.
  - Tolerances: `maxDiffPixels` / `threshold`, e.g. `toHaveScreenshot({ maxDiffPixels: 100, threshold: 0.1 })`; `stylePath` hides volatile elements.
  - Pitfall: rendering varies by "host OS, version, settings, hardware, power source… headless mode… For consistent screenshots, run tests in the same environment".
  - Source: [Playwright docs source](https://github.com/microsoft/playwright/blob/main/docs/src/test-snapshots-js.md)
- **Lighthouse CI (official, Google Chrome):**
  - `GoogleChrome/lighthouse-ci` has 7,115 stars. Recipe: `npm install -g @lhci/cli@0.15.x` then `lhci autorun`. It supports performance budgets and assertions — [README](https://github.com/GoogleChrome/lighthouse-ci)
  - `@lhci/cli` 0.15.1 was last published 2025-06-25. Core `lighthouse` 13.5.0 was published 2026-09-18 — [npm @lhci/cli](https://www.npmjs.com/package/@lhci/cli), [npm lighthouse](https://www.npmjs.com/package/lighthouse)
- **Other a11y skills:**
  - Shopify's `liquid-skills` in the official marketplace includes "WCAG accessibility patterns for Shopify themes" — [marketplace.json](https://github.com/anthropics/claude-plugins-official/blob/main/.claude-plugin/marketplace.json)
  - The a11y rules inside `web-design-guidelines` are covered in Q6.

### Inferences
**Practical a11y stack for Claude Code without paid tools:**
- `web-design-guidelines` review (static rules).
- Chrome DevTools MCP `lighthouse_audit` (round 1) for runtime checks.
- Optionally `@axe-core/playwright` inside Playwright tests. That last item is my suggestion; I did not verify it in this round.

Add Deque's MCP only if the org already pays for Axe DevTools. Its value-add is `remediate` and Deque's rule engine, and the Docker requirement makes it awkward in cloud sessions.

**Visual regression from Claude Code:**
- Simplest robust loop: Claude writes `toHaveScreenshot()` tests and runs `npx playwright test` itself.
- Run the tests in Docker or CI so baselines match the CI OS. Otherwise Claude will "fix" diffs that come from font rendering differences between OSes.
- Never let the agent run `--update-snapshots` without a human review of the diff images.

**Lighthouse CI** is fine as a CI gate, but its CLI release cadence is slow. For interactive work inside Claude Code, Chrome DevTools MCP's Lighthouse/perf tools are more convenient.

### Gaps
- Deque pricing: not public in the sources I reached. Exact Deque Claude Code JSON not seen verbatim, because docs.deque.com was unreachable.
- Percy's free-tier screenshot count is from a third-party source only, so I omitted it.
- I could not confirm whether Chromatic offers its own MCP endpoint.

## Q4. Design-to-code and design tools beyond Figma (Penpot, Framer, Webflow, Builder.io, Anima, Locofy, Canva)

### Takeaway
Official MCPs that work with Claude Code exist for:
- **Penpot:** open-source; local or hosted; needs the Penpot plugin tab open.
- **Webflow:** remote OAuth + Designer "Bridge App".
- **Canva:** plugin in Anthropic's marketplace; for marketing graphics rather than app UI.
- **Anima:** now branded "Agent Grid"; has its own Claude Code marketplace.
- **Locofy:** per-project token.

I found no official MCP for Framer, and nothing I could verify for Builder.io. For pure design-to-code in Claude Code, Figma (round 1) remains the most mature. Penpot is the best option for open-source or self-hosted teams.

### Cited Findings
- **Penpot (official):**
  - The standalone `penpot/penpot-mcp` (529 stars) "has been archived on 2026-02-03. Its contents have been fully integrated into the main Penpot repository" at `penpot/penpot/tree/develop/mcp`. The main repo has 61,372 stars — [archived README](https://github.com/penpot/penpot-mcp), [penpot/penpot mcp](https://github.com/penpot/penpot/tree/develop/mcp)
  - Architecture: the MCP server talks to a **Penpot MCP Plugin** over WebSocket. "The LLM is free to write and execute arbitrary code snippets within the Penpot Plugin environment". It supports "design-to-design, code-to-design and design-code" workflows — [README](https://github.com/penpot/penpot/tree/develop/mcp)
  - Local run: `npx -y @penpot/mcp@latest`. `@penpot/mcp` 2.15.4 was published 2026-06-02.
  - Connection steps: the server is at `http://localhost:4401/mcp`; load the plugin at `http://localhost:4400/manifest.json` in Penpot and click "Connect to MCP server". "Do not close the plugin's UI while using the MCP server".
  - "The legacy `/sse` and `/messages` endpoints are no longer supported."
  - Sources: [README](https://github.com/penpot/penpot/tree/develop/mcp), [npm](https://www.npmjs.com/package/@penpot/mcp)
  - A hosted remote server exists for design-only work; see the help center — [help.penpot.app/mcp](https://help.penpot.app/mcp/)
  - Model advice: "use the most capable model at your disposal… use a vision language model (VLM)" — [README](https://github.com/penpot/penpot/tree/develop/mcp)
  - Claude Code: `claude mcp add --transport http penpot http://localhost:4401/mcp` (constructed). The README itself suggests `npx -y add-mcp -g -n penpot http://localhost:4401/mcp` (verbatim) — [README](https://github.com/penpot/penpot/tree/develop/mcp)
  - Multi-file use: open each file in its own tab, run the plugin, and reference the session ID shown in the plugin UI. Env vars: `PENPOT_MCP_REMOTE_MODE` (disables filesystem access), `PENPOT_MCP_TOOL_TIMEOUT_S` (default 120) — [README](https://github.com/penpot/penpot/tree/develop/mcp)
- **Webflow (official):**
  - `webflow/mcp-server` has 141 stars and was updated 2026-10-13.
  - Remote server with OAuth at `https://mcp.webflow.com/sse`, plus "a companion app that syncs your live canvas with your AI agent". You launch the "Webflow MCP Bridge App" from the Designer Apps panel (press `E`).
  - Reset OAuth: `rm -rf ~/.mcp-auth`. The local mode needs your own Bridge App and `WEBFLOW_TOKEN`.
  - The README has Cursor and Claude Desktop configs only; Desktop uses `npx mcp-remote https://mcp.webflow.com/sse`.
  - Source: [README](https://github.com/webflow/mcp-server)
  - The local npm `webflow-mcp-server` was last published at 1.0.0 on 2025-09-17 — [npm](https://www.npmjs.com/package/webflow-mcp-server)
- **Canva (official):**
  - Listed in the Anthropic marketplace as `canva` (author Canva): "Create, edit, review, resize, and brand-check Canva designs with the Canva MCP server" — [marketplace.json](https://github.com/anthropics/claude-plugins-official/blob/main/.claude-plugin/marketplace.json)
  - Repo `canva-sdks/canva-skills` (129 stars): `/plugin marketplace add canva-sdks/canva-skills` + `/plugin install canva@canva-skills` (verbatim).
  - MCP server `https://mcp.canva.com/mcp` with sign-in.
  - Skills include `resize-for-social-media` and `bulk-create` (one design per CSV row via brand-template autofill).
  - Source: [README](https://github.com/canva-sdks/canva-skills)
- **Anima → "Agent Grid" (official):**
  - The README now reads "Agent Grid is a governed hub, by Anima, where AI agents build, host, publish, and share web apps".
  - Claude Code plugin: `/plugin marketplace add AnimaApp/mcp-server-guide` + `/plugin install anima@mcp-server-guide` (verbatim). Manual: `claude mcp add --transport http anima https://api.agentgrid.io/v1/mcp` (verbatim).
  - Example prompts: "Implement this Figma design in my project: https://figma.com/design/...".
  - "Design system access (Enterprise)" requires contacting sales. There is also an Anima CLI, `@animaapp/cli`.
  - The repo has 6 stars.
  - Source: [README](https://github.com/AnimaApp/mcp-server-guide)
  - Third-party mirrors still list the old URL `https://public-api.animaapp.com/v1/mcp`. One claims `/plugin install anima@claude-plugins-official`, but `anima` is **not** in the official marketplace.json, which I searched on 2026-10-19 (search summary vs primary) — [mcpservers.org mirror](https://mcpservers.org/servers/animaapp/mcp-server-guide), [marketplace.json](https://github.com/anthropics/claude-plugins-official/blob/main/.claude-plugin/marketplace.json)
- **Locofy (official):**
  - `@locofy/mcp` 1.1.20 was published 2026-09-08. It "connects AI code editors directly to your Locofy project. Convert Figma designs to code, pull generated components, and sync files". Claude Code is listed as supported.
  - "The MCP configuration must be set up **per project**". You download an `mcp.json` with `PROJECT_ID` + `PERSONAL_ACCESS_TOKEN` from the Locofy dashboard (token expiry 1 Month / No Expiry).
  - Pulling components requires converting and syncing in the Locofy Figma plugin first.
  - Known issue: "The Locofy proxy's `/variables/local` route currently returns 403 from Figma; the tool falls back to computed paints".
  - Source: [npm README](https://www.npmjs.com/package/@locofy/mcp)
- **Builder.io:** I found no official Builder.io docs for a Claude Code MCP. Only third-party listings describe a remote OAuth server (search summary) — [Pipedream listing](https://mcp.pipedream.com/app/builder_io), [Gamut](https://www.gamut.so/mcp/documents-content/builder-io)
- **Framer:** no official Framer MCP found. Community servers only, and one "Framer MCP" listing actually describes a Figma integration (search summary) — [glama](https://glama.ai/mcp/servers/jyxf65vagb), [mcp.so tag](https://mcp.so/tags/framer)
- **Adobe (official, in Anthropic marketplace):** `adobe-for-creativity`: "edit images, automate design workflows… from background removal to vectorization and professional retouching" — [marketplace.json](https://github.com/anthropics/claude-plugins-official/blob/main/.claude-plugin/marketplace.json), [adobe/skills](https://github.com/adobe/skills)
- **Wix / SAP:** also in the official marketplace. `wix` covers the Wix Design System + site MCP; `ui-theme-designer` covers SAP Fiori — [marketplace.json](https://github.com/anthropics/claude-plugins-official/blob/main/.claude-plugin/marketplace.json)

### Inferences
**How well each works with Claude Code:**
- **Penpot:** the strongest non-Figma option for two-way design↔code. Caveats: a browser tab must stay open, and the agent executes arbitrary plugin code in your design file, so work on copies.
- **Webflow:** relevant only if the site lives in Webflow. Its README uses the `/sse` URL, and Claude Code treats SSE as deprecated (round 1). Try `claude mcp add --transport http webflow https://mcp.webflow.com/mcp` first (constructed and unverified; the `/mcp` path is my guess). Fall back to `--transport sse … /sse`.
- **Canva:** for marketing assets (social sizes, bulk banners), not component code.
- **Anima/Agent Grid and Locofy:** wrap Figma-to-code behind their own accounts. Use them only if the team already uses those products; otherwise the official Figma MCP is more direct.

**Rename/deprecation flags:**
- `penpot/penpot-mcp` was archived in favour of `penpot/penpot/mcp`.
- Anima's MCP URL moved to `api.agentgrid.io`.
- Webflow's local npm package has been stale since 2025-09.

### Gaps
- Penpot hosted remote server URL: not verified (help.penpot.app unreachable).
- Webflow: no Claude Code command or Streamable HTTP endpoint is documented in the README.
- Builder.io and Framer: no primary-source MCP documentation found.
- I found no independent quality comparison of these design-to-code tools.

## Q5. Image/asset generation for frontend (hero images, illustrations, icons, favicons) via MCP from Claude Code

### Takeaway
Real, maintained options:
- **Recraft:** official remote MCP. The best fit for vector/SVG icons and illustrations.
- **Google GenMedia:** official but "experiments"; Nano Banana/Gemini Image on Vertex AI.
- **fal:** official hosted MCP; many models behind one key.
- **Community `shinpr/mcp-image`:** Gemini/OpenAI/Seedream, with prompt enhancement and a ready Claude Code command.

OpenAI publishes no official image MCP; only community wrappers exist. Recraft's old local npm server is deprecated.

### Cited Findings
- **Recraft (official):**
  - The local `@recraft-ai/mcp-recraft-server` is **deprecated** and the repo is **archived**: "Please use the **Recraft remote MCP server** instead, available at `https://mcp.recraft.ai/mcp`".
  - Claude Code migration: `claude mcp add --transport http recraft https://mcp.recraft.ai/mcp` (verbatim).
  - Capabilities: "raster and vector image generation… editing… vectorization of raster images". It needs a Recraft API key or account.
  - The npm deprecation message points to the same remote URL.
  - Sources: [README](https://github.com/recraft-ai/mcp-recraft-server), [npm](https://www.npmjs.com/package/@recraft-ai/mcp-recraft-server)
- **Google GenMedia MCP (official Google Cloud, experimental):**
  - Lives at `experiments/mcp-genmedia` in `GoogleCloudPlatform/genmedia-creative-studio`. The repo was renamed from vertex-ai-creative-studio; 1,223 stars.
  - Servers: "Nano Banana: Gemini 3.1 Flash Image & Gemini 3 Pro Image", Veo 3/3.1, Gemini TTS/Chirp, Lyria. "Imagen… (deprecated)".
  - Install: `curl -sL https://raw.githubusercontent.com/GoogleCloudPlatform/genmedia-creative-studio/main/experiments/mcp-genmedia/mcp-genmedia-go/install-online.sh | bash`. Run with `mcp-nanobanana-go --transport http`.
  - Skills `install-mcp-genmedia` / `build-mcp-genmedia` exist, aimed at Gemini CLI / Antigravity.
  - Source: [README](https://github.com/GoogleCloudPlatform/genmedia-creative-studio/tree/main/experiments/mcp-genmedia)
- **fal (official hosted MCP):**
  - Server at `mcp.fal.ai/mcp`, using your own fal API key as a Bearer header. Tools: model search, schema lookup, run inference, upload, docs.
  - fal's Claude-Code-specific page gives a user-scoped command to `mcp.fal.ai/mcp-relay` with browser auth via `/mcp`, and says "start a new session" if tools don't appear.
  - Both points are search summaries and the two pages differ — [fal docs: MCP](https://fal.ai/docs/documentation/setting-up/mcp), [fal docs: Claude Code](https://fal.ai/docs/documentation/setting-up/mcp/claude-code.md)
- **`shinpr/mcp-image` (community):**
  - 180 stars; `mcp-image` 0.18.0 published 2026-10-08.
  - "Supports Nano Banana (Gemini), OpenAI GPT Image, and BytePlus Seedream". It adds "visual direction" to prompts; disable that with `SKIP_PROMPT_ENHANCEMENT=true`.
  - Claude Code: `claude mcp add mcp-image --env GEMINI_API_KEY=your-api-key --env IMAGE_OUTPUT_DIR=/absolute/path/to/images -- npx -y mcp-image` (verbatim).
  - Quality presets: `fast` / `balanced` / `quality` ("Higher settings can take longer and cost more").
  - "OpenAI may require organization verification before it can generate images"; Google Search grounding is Gemini only.
  - It also ships a prompt-writing skill: `npx mcp-image skills install --path <skills-directory>`, e.g. `~/.claude/skills`.
  - Source: [README](https://github.com/shinpr/mcp-image)
- **`ConechoAI/Nano-Banana-MCP` (community):** 234 stars, but built on "Google's Gemini 2.5 Flash Image API", an older model generation — [README](https://github.com/ConechoAI/Nano-Banana-MCP)
- **OpenAI:** no official OpenAI image MCP found. Only community servers exist (e.g. `@lpenguin/openai-image-mcp`, `gpt-image-mcp`). gpt-image-2 "may require Organization Verification… without it, calls return HTTP 403" (search summary) — [glama gpt-image-mcp](https://glama.ai/mcp/servers/skyjoe66/gpt-image-mcp), [lpenguin README](https://glama.ai/mcp/servers/@lpenguin/openai-image-mcp/blob/98bf8f8dae22225a883f1fa6168d650a4e382d63/README.md)
- **Adobe:** the `adobe-for-creativity` plugin, in the official marketplace, covers background removal, vectorization and retouching of existing assets — [marketplace.json](https://github.com/anthropics/claude-plugins-official/blob/main/.claude-plugin/marketplace.json)
- Replicate's hosted MCP (also usable for image models) was covered in round 1 — [Replicate docs](https://replicate.com/docs/reference/mcp)

### Inferences
**Which tool for which frontend asset:**
- **Icons, logos, favicons, illustrations that must stay crisp:** Recraft. It produces vectors and vectorizes rasters, and SVG output can be inlined or optimized (SVGO) and converted to favicon sizes.
- **Photographic hero images or textures:** Gemini image models (via mcp-image, GenMedia or fal) or GPT Image (via mcp-image).
- **Many models, one bill:** fal.

**Pitfalls:**
1. Every call costs money. Set `IMAGE_OUTPUT_DIR` and quality presets, and tell Claude how many variants to make.
2. Generated text in images is unreliable for UI. Keep text in HTML.
3. The GenMedia installer is `curl | bash` from an experiments folder. Audit it, and prefer building from source in sensitive environments.
4. Community wrappers hold your API keys in env vars. Prefer the vendor-hosted OAuth servers (Recraft, fal relay) where available.
5. Commit generated assets with their prompts in a sidecar file for reproducibility. This is my suggestion.

### Gaps
- No dedicated, maintained "favicon generator" MCP found. The favicon pipeline (SVG → ICO/PNG sizes, manifest) is better done with a local CLI the agent runs. I did not verify any specific favicon tool in this round.
- fal's exact Claude Code commands were not seen verbatim, because fal.ai was unreachable.
- Recraft pricing and credit costs were not verified.
- I did not verify any official Gemini-API (AI Studio key) MCP from Google, as opposed to Vertex AI.

## Q6. Deep dive: actual SKILL.md content of frontend-design, web-design-guidelines, react-best-practices; frontend-design copies compared

### Takeaway
**Round-1 gap resolved:** the `frontend-design` SKILL.md is byte-identical in all three repos (MD5 `7d6df6b2…`, 9,390 bytes). Only the plugin README and plugin.json differ, and the README is stale: it still advertises "Bold aesthetic choices / High-impact animations", which the current skill explicitly argues against.

**The other two skills:**
- `web-design-guidelines` is a thin loader that **fetches its rules from GitHub at run time**. That means it is always fresh but not pinned, and it needs network/WebFetch.
- `react-best-practices` is a 70-rule, impact-ranked catalog. Its compiled AGENTS.md is ~108 KB, so it should be read rule-by-rule.

**One real conflict to tell users about:** web-design-guidelines wants "Title Case for headings/buttons (Chicago style)", while frontend-design wants "sentence case".

### Cited Findings
**frontend-design: copies compared (downloaded 2026-10-19)**
- Paths compared:
  - `anthropics/skills/skills/frontend-design/SKILL.md`
  - `anthropics/claude-plugins-official/plugins/frontend-design/skills/frontend-design/SKILL.md`
  - `anthropics/claude-code/plugins/frontend-design/skills/frontend-design/SKILL.md`
  - All three have identical MD5 `7d6df6b2e98e38f8b86046325dc6afd0` and 9,390 bytes.
  - Sources: [skills copy](https://github.com/anthropics/skills/blob/main/skills/frontend-design/SKILL.md), [official-marketplace copy](https://github.com/anthropics/claude-plugins-official/blob/main/plugins/frontend-design/skills/frontend-design/SKILL.md), [claude-code copy](https://github.com/anthropics/claude-code/blob/main/plugins/frontend-design/skills/frontend-design/SKILL.md)
- plugin.json differences:
  - claude-code: `"version": "1.1.0"`, authors "Prithvi Rajasekaran, Alexander Bricken".
  - claude-plugins-official: no version field, author "Anthropic".
  - Both: description "Frontend design skill for UI/UX implementation".
  - Sources: [claude-code plugin.json](https://github.com/anthropics/claude-code/blob/main/plugins/frontend-design/.claude-plugin/plugin.json), [official plugin.json](https://github.com/anthropics/claude-plugins-official/blob/main/plugins/frontend-design/.claude-plugin/plugin.json)
- The plugin README is identical in both plugin repos and still lists "Bold aesthetic choices… High-impact animations and visual details" — [README](https://github.com/anthropics/claude-code/blob/main/plugins/frontend-design/README.md)

**frontend-design: most actionable lines, verbatim** — [SKILL.md](https://github.com/anthropics/skills/blob/main/skills/frontend-design/SKILL.md)
- Persona: "the design lead at a design studio known for giving every client a distinct visual identity… This client has already rejected proposals that felt cliché or templated".
- Grounding: "If the brief does not identify what the product or subject matter is, identify it yourself before designing, and confirm with the client."
- Hero: "a big number with a small label, supporting stats, and a gradient accent is the default treatment, so only use it if that's truly the best option."
- Type: "use one family or two, and if two, make them clearly distinct"; "Default to line lengths of less than 80 characters"; "give serif body text slightly more line-height than a sans-serif."
- Tells to avoid: "Accenting just a single word or phrase in a headline… Using all caps for labels… Adding unnecessary typographic labels above content."
- Structure: "Before adding numbered markers, check the content really is a sequence."
- Motion: "A single orchestrated moment… lands better than scattered effects; fade-and-slide-up entrances on each section and hover transitions on every card are the generic default and read as AI-generated."
- Brief priority: "Where the brief pins down a visual direction, follow it exactly — the brief's own words always win, including when it asks for one of these looks."
- Two-pass plan: "Color: describe the core base palette as 4–6 named hex values… Layout: … ASCII wireframes… Include alignment guidance". Then "review that plan against the brief… revise that part, say what you changed and why."
- CSS: "be careful of structuring your CSS selector specificities… (especially with a type-based selector like .section and an element-based selector like .cta)".
- Restraint: "Spend your boldness in one place."
- Quality floor: "responsive down to mobile, visible keyboard focus, reduced motion respected". Plus "taking screenshots to review if your environment supports it — a picture is worth 1000 tokens".
- Memory: "if you have a space to quickly jot down notes about what you've tried, it can help you in future passes."
- Copy: "'Save changes,' not 'Submit.'"; "the button that says 'Publish' produces a toast that says 'Published.'"; "Errors don't apologize"; "sentence case, no filler".

**web-design-guidelines (Vercel)**
- The SKILL.md is only 1,231 bytes. Its process:
  1. "Fetch the latest guidelines from the source URL", i.e. `https://raw.githubusercontent.com/vercel-labs/web-interface-guidelines/main/command.md`, using WebFetch.
  2. Read the files.
  3. "Output findings in the terse `file:line` format".
  4. "If no files specified, ask the user which files to review."
  - Source: [SKILL.md](https://github.com/vercel-labs/agent-skills/blob/main/skills/web-design-guidelines/SKILL.md)
- The rules source repo `vercel-labs/web-interface-guidelines` has 1,009 stars. Install line from its README: `npx skills add https://github.com/vercel-labs/agent-skills --skill web-design-guidelines` (verbatim) — [README](https://github.com/vercel-labs/web-interface-guidelines)
- Key rules from `command.md`, verbatim — [command.md](https://github.com/vercel-labs/web-interface-guidelines/blob/main/command.md):
  - **A11y:** "Icon-only buttons need `aria-label`"; "`<button>` for actions, `<a>`/`<Link>` for navigation (not `<div onClick>`)"; "Async updates (toasts, validation) need `aria-live="polite"`"; "include skip link for main content".
  - **Focus:** "Never `outline-none` / `outline: none` without focus replacement"; "Use `:focus-visible` over `:focus`"; "Sticky headers/footers/overlays must not cover the focused element".
  - **Forms:**
    - "Inputs need `autocomplete` and meaningful `name`"
    - "Never block paste"
    - "Submit button stays enabled until request starts; spinner during request"
    - "Errors inline next to fields; focus first error on submit"
    - "Warn before navigation with unsaved changes"
  - **Animation:** "Honor `prefers-reduced-motion`"; "Animate `transform`/`opacity` only"; "Never `transition: all`"; "SVG: transforms on `<g>` wrapper with `transform-box: fill-box; transform-origin: center`"; "Autoplay motion >5 seconds… needs pause, stop, or hide controls".
  - **Typography:** "`…` not `...`"; "`font-variant-numeric: tabular-nums` for number columns"; "`text-wrap: balance` or `text-pretty` on headings".
  - **Content:** "Flex children need `min-w-0` to allow text truncation"; "Handle empty states".
  - **Images/perf:**
    - "`<img>` needs explicit `width` and `height` (prevents CLS)"
    - "Large lists (>50 items): virtualize"
    - "No layout reads in render (`getBoundingClientRect`…)"
    - "Critical fonts: `<link rel="preload" as="font">` with `font-display: swap`"
  - **State:** "URL reflects state—filters, tabs, pagination… in query params"; "Destructive actions need confirmation modal or undo window—never immediate".
  - **Touch:** "`touch-action: manipulation`"; "`overscroll-behavior: contain` in modals/drawers/sheets"; "Full-bleed layouts need `env(safe-area-inset-*)`".
  - **Theming:** "`color-scheme: dark` on `<html>`"; "`<meta name="theme-color">` matches page background"; "Native `<select>`: explicit `background-color` and `color` (Windows dark mode)".
  - **i18n/hydration:** "use `Intl.DateTimeFormat`… `Intl.NumberFormat`"; "Inputs with `value` need `onChange`"; "Date/time rendering: guard against hydration mismatch".
  - **Copy:** "Title Case for headings/buttons (Chicago style)"; "Specific button labels: 'Save API Key' not 'Continue'".
  - **Anti-patterns list:** "`user-scalable=no` or `maximum-scale=1`", "`onPaste` with `preventDefault`", "`transition: all`", "`<div>` or `<span>` with click handlers", "Images without dimensions", "Hardcoded date/number formats", "Animated GIF when compressed video is suitable".
  - **Output format:** grouped by file, "`file:line` format (VS Code clickable)… State issue + location. Skip explanation unless fix non-obvious. No preamble."

**react-best-practices (Vercel)**
- Frontmatter name is `vercel-react-best-practices`. "Contains 70 rules across 8 categories, prioritized by impact". Priority order:
  1. Eliminating Waterfalls (CRITICAL, `async-`)
  2. Bundle Size (CRITICAL, `bundle-`)
  3. Server-Side (HIGH, `server-`)
  4. Client Data Fetching (MEDIUM-HIGH)
  5. Re-render (MEDIUM)
  6. Rendering (MEDIUM)
  7. JS Performance (LOW-MEDIUM)
  8. Advanced (LOW)
  - Source: [SKILL.md](https://github.com/vercel-labs/agent-skills/blob/main/skills/react-best-practices/SKILL.md)
- Highest-value rules, verbatim one-liners — [SKILL.md](https://github.com/vercel-labs/agent-skills/blob/main/skills/react-best-practices/SKILL.md):
  - **Async:** "`async-defer-await` - Move await into branches where actually used"; "`async-parallel` - Use Promise.all() for independent operations"; "`async-suspense-boundaries` - Use Suspense to stream content".
  - **Bundle:**
    - "`bundle-barrel-imports` - Import directly, avoid barrel files"
    - "`bundle-dynamic-imports` - Use next/dynamic for heavy components"
    - "`bundle-defer-third-party` - Load analytics/logging after hydration"
    - "`bundle-preload` - Preload on hover/focus"
  - **Server:**
    - "`server-auth-actions` - Authenticate server actions like API routes"
    - "`server-cache-react` - Use React.cache() for per-request deduplication"
    - "`server-no-shared-module-state` - Avoid module-level mutable request state in RSC/SSR"
    - "`server-serialization` - Minimize data passed to client components"
    - "`server-after-nonblocking` - Use after()"
  - **Re-render:**
    - "`rerender-derived-state-no-effect` - Derive state during render, not effects"
    - "`rerender-no-inline-components` - Don't define components inside components"
    - "`rerender-transitions` - Use startTransition for non-urgent updates"
    - "`rerender-move-effect-to-event` - Put interaction logic in event handlers"
  - **Rendering:** "`rendering-animate-svg-wrapper` - Animate div wrapper, not SVG element"; "`rendering-conditional-render` - Use ternary, not && for conditionals"; "`rendering-activity` - Use Activity component for show/hide".
- Rule detail example from AGENTS.md, "2.1 Avoid Barrel File Imports — Impact: CRITICAL (200-800ms import cost, slow builds)":
  - `import { Check, X, Menu } from 'lucide-react'` "Loads 1,583 modules, takes ~2.8s extra in dev".
  - On Next.js 13.5+ you can keep standard imports because "Next.js transforms them to direct imports". Elsewhere import directly, e.g. `@mui/material/Button`.
  - Source: [AGENTS.md](https://github.com/vercel-labs/agent-skills/blob/main/skills/react-best-practices/AGENTS.md)
- Size: AGENTS.md is 108,261 bytes (downloaded 2026-10-19). The SKILL.md tells agents to read `rules/<rule>.md` files individually — [SKILL.md](https://github.com/vercel-labs/agent-skills/blob/main/skills/react-best-practices/SKILL.md)

### Inferences
**frontend-design**
- The marketplace copy (`frontend-design@claude-plugins-official`) and the `anthropics/skills` copy give identical behavior today. Choose by update channel, not content.
- The stale README is why many blog posts still describe the skill as "bold aesthetics". Users should read the SKILL.md, not the README.
- The skill is ~9.4 KB, roughly 2.3k tokens at ~4 chars/token. That is my estimate; the "~400 tokens" figure from 2025 no longer applies.

**web-design-guidelines**
- Its runtime fetch has three consequences:
  - It needs WebFetch permission and network. Offline or sandboxed sessions fail silently or ask permission.
  - Results can change between runs, because the rules are unpinned and the remote `command.md` changes.
  - It is a remote-content injection surface, small given that the repo is Vercel's.
- For reproducible CI-style reviews, vendor a pinned copy of `command.md` into the project as a skill or command. This is my suggestion.

**Resolving the style conflict.** Title Case (WIG) vs sentence case (frontend-design): tell Claude which wins in `CLAUDE.md`. Otherwise a review pass with WIG will "fix" copy that frontend-design wrote deliberately, and vice versa. The same goes for WIG's "`…`" and curly-quote rules, which are fine but noisy.

**react-best-practices**
- Its ordering is the useful part. Fix waterfalls and barrel imports before micro-optimizations (`js-*`).
- Don't let the agent load the 108 KB AGENTS.md into context. Point it to specific `rules/*.md`.
- Several rules are Next.js-specific (`next/dynamic`, `after()`, RSC serialization). For Vite SPAs, the `server-*` category mostly doesn't apply.

### Gaps
- I did not diff the `rules/*.md` files individually, and I did not verify the exact count of 70 against the directory. A GitHub directory listing was blocked; the count is from SKILL.md.
- No official token-count figure exists for the current frontend-design SKILL.md; the figure above is an estimate.
- I could not determine how Claude Code versions the official-marketplace `frontend-design` plugin given that its plugin.json has no `version` field.

## Q7. Consolidated table of NEW items (round 2)

### Takeaway
All rows were verified on 2026-10-19:
- "Stars" come from the GitHub search API.
- "Last release" is the npm `latest` publish date.
- "Official" means the item is published by the framework or product vendor.

### Cited Findings
| Item | Maintainer / status | Stars | Last release (npm) | Install in Claude Code | Source |
|---|---|---|---|---|---|
| Svelte MCP + `svelte` plugin (MCP, LSP, `svelte-file-editor` agent, skills) | Svelte core, official | sveltejs/ai-tools 334 | @sveltejs/mcp 0.1.27, 2026-10-19 | `/plugin marketplace add sveltejs/ai-tools` + `/plugin install svelte@svelte` (constructed); or `claude mcp add -t http -s user svelte https://mcp.svelte.dev/mcp` (search summary of docs) | [repo](https://github.com/sveltejs/ai-tools), [docs](https://svelte.dev/docs/ai/remote-setup) |
| Angular CLI MCP (`ng mcp`) | Angular team, official | angular-cli 27,014 | @angular/cli 22.2.3, 2026-10-15 | `claude mcp add angular-cli -- npx -y @angular/cli mcp` (constructed; add `--read-only` if needed) | [docs source](https://github.com/angular/angular/blob/main/adev/src/content/ai/mcp-server-setup.md) |
| Angular Agent Skills | Angular team, official | angular/skills 691 | n/a (git) | `npx skills add https://github.com/angular/skills` | [repo](https://github.com/angular/skills) |
| Nuxt docs MCP | Nuxt, official | nuxt/nuxt 60,970 | @nuxt/docs 4.6.2 | `claude mcp add --transport http nuxt https://nuxt.com/mcp` | [docs source](https://www.npmjs.com/package/@nuxt/docs) |
| Nuxt UI MCP | Nuxt UI, official (secondary-verified) | nuxt/ui 7,021 | @nuxt/ui 4.12.0, 2026-10-15 | `claude mcp add --transport http nuxt-ui https://ui.nuxt.com/mcp` (secondary) | [claudeskills.info](https://claudeskills.info/skills/nuxt/ui/nuxt-ui/) |
| nuxt-mcp-dev / vite-plugin-mcp | Anthony Fu, experimental | 911 | 0.3.2, 2025-12-31 | Nuxt module / Vite plugin (see README) | [repo](https://github.com/antfu/nuxt-mcp-dev) |
| Vue skills | community (vuejs-ai), "Early Experiment" | 2,909 | n/a | `/plugin marketplace add vuejs-ai/skills` + `/plugin install vue-skills-bundle@vue-skills` | [repo](https://github.com/vuejs-ai/skills) |
| Astro Docs MCP | Astro, official | 67 | n/a (remote) | `claude mcp add --transport http "Astro docs" https://mcp.docs.astro.build/mcp` | [repo](https://github.com/withastro/docs-mcp) |
| Expo MCP + `expo` plugin | Expo, official; plugin in Anthropic marketplace | expo/skills 2,937; expo-mcp 9 | expo-mcp 0.2.4, 2026-02-12 | `claude plugin install expo@claude-plugins-official`; or `claude mcp add --transport http expo https://mcp.expo.dev/mcp` → `/mcp` | [docs source](https://github.com/expo/expo/blob/main/docs/pages/mcp.mdx), [skills](https://github.com/expo/skills) |
| Callstack RN skills | Callstack (vendor-community) | 1,675 | n/a | `npx skills@latest add callstackincubator/agent-skills --skill '*'` | [repo](https://github.com/callstackincubator/agent-skills) |
| TanStack CLI (introspection; MCP apparently removed) | TanStack, official | 1,301 | @tanstack/cli 0.72.0, 2026-10-16 | `npx @tanstack/cli search-docs "<q>" --library router --framework react --json` | [repo](https://github.com/TanStack/cli) |
| TanStack Intent (package-shipped skills) | TanStack, official | 352 | 0.5.6, 2026-10-19 | `npx @tanstack/intent@latest install` | [repo](https://github.com/TanStack/intent) |
| React Router skill | Remix team, official; old repo archived | react-router 56,609 | n/a | `npx skills add https://github.com/remix-run/react-router --skill react-router` | [archived notice](https://github.com/remix-run/agent-skills) |
| Tailwind v4 docs skill | community (Lombiq) | 77 | n/a | via skills CLI (exact command not verified) + `sync_tailwind_docs.py --accept-docs-license` | [repo](https://github.com/Lombiq/Tailwind-Agent-Skills) |
| Motion AI Kit | Motion, official; free + Motion+ paid | ai-kit 48; motion 34,352 | motion-ai 14.2.0, 2026-10-15 | `npx motion-ai` (Motion+: `npx motion-ai --plus`) | [repo](https://github.com/motiondivision/ai-kit) |
| GSAP skills | GreenSock, official | 16,642 | gsap 3.15.0, 2026-04-13 | `/plugin marketplace add greensock/gsap-skills` + `/plugin install gsap-skills@gsap-skills` (constructed) | [repo](https://github.com/greensock/gsap-skills) |
| LottieFiles MCP | LottieFiles, official | n/a | n/a (remote) | `claude mcp add --transport http lottiefiles https://mcp.lottiefiles.com/mcp` (constructed; search-summary URL) | [docs](https://docs.lottiefiles.com/en/platform/mcp/connect) |
| axe MCP Server | Deque, official, paid subscription + Docker | 8 | Docker image | per Deque Claude Code guide (Docker stdio + API key env) | [repo](https://github.com/dequelabs/axe-mcp-server-public), [guide](https://docs.deque.com/devtools-server/4.0.0/en/setup-claude-code) |
| BrowserStack MCP (a11y, Percy) | BrowserStack, official, paid / OSS free plan | 155 | 2.2.4, 2026-10-19 | remote `https://mcp.browserstack.com/mcp` or local npx with `BROWSERSTACK_USERNAME`/`BROWSERSTACK_ACCESS_KEY` | [repo](https://github.com/browserstack/mcp-server) |
| Applitools MCP | Applitools, official, paid | 0 | 0.8.9, 2026-10-19 | `claude mcp add applitools-mcp -- npx --yes @applitools/mcp@latest` (constructed) | [repo](https://github.com/applitools/mcp) |
| Lighthouse CI | Google Chrome, official | 7,115 | @lhci/cli 0.15.1, 2025-06-25 | `npm install -g @lhci/cli@0.15.x` → `lhci autorun` | [repo](https://github.com/GoogleChrome/lighthouse-ci) |
| Penpot MCP | Penpot, official, moved into main repo | penpot 61,372 (old penpot-mcp 529, archived) | @penpot/mcp 2.15.4, 2026-06-02 | `npx -y @penpot/mcp@latest`, then `claude mcp add --transport http penpot http://localhost:4401/mcp` (constructed) + plugin in browser | [README](https://github.com/penpot/penpot/tree/develop/mcp) |
| Webflow MCP | Webflow, official | 141 | local pkg 1.0.0, 2025-09-17 | remote OAuth `https://mcp.webflow.com/sse` + Bridge App (Claude Code command not documented) | [repo](https://github.com/webflow/mcp-server) |
| Canva plugin | Canva, official; in Anthropic marketplace | 129 | n/a | `/plugin marketplace add canva-sdks/canva-skills` + `/plugin install canva@canva-skills` | [repo](https://github.com/canva-sdks/canva-skills) |
| Anima / Agent Grid | Anima, official, Enterprise for design systems | 6 | n/a | `/plugin marketplace add AnimaApp/mcp-server-guide` + `/plugin install anima@mcp-server-guide`; or `claude mcp add --transport http anima https://api.agentgrid.io/v1/mcp` | [repo](https://github.com/AnimaApp/mcp-server-guide) |
| Locofy MCP | Locofy, official, account required | n/a | @locofy/mcp 1.1.20, 2026-09-08 | per-project `mcp.json` from Locofy dashboard | [npm](https://www.npmjs.com/package/@locofy/mcp) |
| adobe-for-creativity | Adobe, official, in Anthropic marketplace | n/a | n/a | `/plugin install adobe-for-creativity@claude-plugins-official` (constructed pattern) | [marketplace.json](https://github.com/anthropics/claude-plugins-official/blob/main/.claude-plugin/marketplace.json) |
| Recraft remote MCP | Recraft, official; local server deprecated and archived | 60 (archived) | old pkg 1.6.5, deprecated | `claude mcp add --transport http recraft https://mcp.recraft.ai/mcp` | [README](https://github.com/recraft-ai/mcp-recraft-server) |
| Google GenMedia MCP (Nano Banana, Veo, Lyria) | Google Cloud, official "experiments" | genmedia-creative-studio 1,223 | binaries | installer script (`curl … install-online.sh | bash`), then `mcp-nanobanana-go --transport http` | [README](https://github.com/GoogleCloudPlatform/genmedia-creative-studio/tree/main/experiments/mcp-genmedia) |
| fal MCP | fal, official hosted | n/a | n/a | `mcp.fal.ai/mcp` (Bearer key) or `mcp.fal.ai/mcp-relay` (OAuth) (search summary) | [fal docs](https://fal.ai/docs/documentation/setting-up/mcp) |
| mcp-image | community (shinpr) | 180 | 0.18.0, 2026-10-08 | `claude mcp add mcp-image --env GEMINI_API_KEY=your-api-key --env IMAGE_OUTPUT_DIR=/absolute/path/to/images -- npx -y mcp-image` | [README](https://github.com/shinpr/mcp-image) |

### Inferences
**Deprecated, renamed or moved (round 2):**
- `sveltejs/mcp` → `sveltejs/ai-tools`.
- `remix-run/agent-skills` was archived; the skill now lives in `remix-run/react-router`.
- `penpot/penpot-mcp` was archived; the MCP now lives in `penpot/penpot/mcp`.
- `@recraft-ai/mcp-recraft-server` is deprecated in favor of the remote `mcp.recraft.ai/mcp`.
- Anima's MCP is now Agent Grid at `api.agentgrid.io`.
- `vertex-ai-creative-studio` was renamed `genmedia-creative-studio`. GenMedia's Imagen server is deprecated in favor of Gemini Image.
- TanStack CLI's MCP is no longer in the package.
- The Nuxt docs MCP server name changed from `nuxt-remote` to `nuxt` in the docs.

**Lean additions to the round-1 stack, chosen by project type:**
- the framework's own MCP/skill (Svelte plugin, `ng mcp`, Nuxt/Astro docs MCP, `expo` plugin, React Router skill);
- `npx motion-ai` if the project uses Motion;
- Playwright `toHaveScreenshot()` tests for visual regression;
- Recraft remote MCP for SVG assets.

Everything else in the table is situational: paid (Deque, Percy, Applitools, Anima Enterprise) or tied to a specific product (Webflow, Canva, Penpot, Locofy).

### Gaps
- Stars for LottieFiles, Locofy, fal and Adobe repos were not retrievable (no public repo found, or search access not available).
- Release dates for remote-only servers (Astro, Nuxt, LottieFiles, fal, Canva) are not applicable or not published.
