# SVG, vector, diagram and 2D design tools for Claude Code: second round (new items + deeper dive), state as of 2026-10-19

Scope note: this round excludes what round 1 already covered (Anthropic canvas-design/algorithmic-art/slack-gif-creator, logo-design-skill, svg-creator-skill, excalidraw-diagram-skill, mcp_excalidraw, official excalidraw-mcp, draw.io plugin, claude-mermaid, mcp-mermaid, gsap-skills, LottieFiles motion-design-skill, Recraft remote MCP, SVGMaker, Nakkas, iconify-mcp-server, SVGO v4, SVGR, resvg, vtracer, potrace, D2). Star counts come from the GitHub search API on 2026-10-19. "Last commit" means the date of the HEAD commit in a shallow clone made on 2026-10-19. npm and PyPI dates come from `npm view … time.modified` or the PyPI JSON API. I mark anything I built myself, as opposed to copied verbatim, as **(inferred)**.

Method note: in this session WebFetch could not resolve rive.app, docs.lottiefiles.com, weandthecolor.com, recraft.ai or pasqualepillitteri.it (DNS/proxy). The egress proxy also blocked the remote MCP endpoints (mcp.canva.com, app.quiver.ai, etc.), so I could not probe them live. Primary data therefore comes from cloned GitHub repos, raw GitHub files, the npm and PyPI registries, the Claude connector directory pages at claude.com/marketplace/connectors/* (fetched with curl), and the locally installed Canva CLI and fontTools.

**Cross-cutting finding: which official connectors work in Claude Code.** The Anthropic connector directory exposes a `worksWith` field per connector in the page payload. In the 2026-10-19 snapshot:
- `adobe-creativity`, `miro` and `whimsical` list `claude`, `claude-api`, `claude-code` and `claude-desktop`.
- `canva`, `figma`, `lucid` and `cloudinary` list `claude`, `claude-api` and `claude-code`.
- `tldraw` lists `claude`, `claude-api` and `claude-desktop`, with **no claude-code**.
- `mermaid-chart` lists **only `claude`**.
- Affinity by Canva (`affinity-106b90`) lists **only `claude-desktop`**.
— [claude.com connectors listing payload](https://claude.com/marketplace/connectors-plugins)

---

## 1. 2D vector design apps reachable from Claude Code: Penpot, Adobe Illustrator (Adobe for creativity), Canva, Inkscape MCPs, Affinity, Figma vector export

### Takeaway
- **Penpot** has an official MCP, now maintained inside the main Penpot monorepo (`penpot/penpot`, folder `mcp/`). It comes in two forms: a hosted remote server per account, and a local `npx -y @penpot/mcp@latest` server that needs a live browser tab running the MCP plugin. It is the most capable open-source design canvas you can drive from Claude Code.
- **Adobe for creativity** is in the official Claude plugin marketplace and the Anthropic directory lists it as working in Claude Code. It is a hosted Creative Cloud service with 109 tools, including `image_vectorize` and `document_render_vector`. It does not control desktop Illustrator, and its image tools only accept files already staged to Creative Cloud.
- Desktop Illustrator control comes from Adobe's **built-in Illustrator Beta MCP**, described only in a community README, or from the community **ie3jp/illustrator-mcp-server**.
- **Canva** (official plugin and MCP) handles designs, brand checks and resizes. It **cannot export SVG**: in the CLI's export contract I checked locally, the only formats that show up are JPG, MP4, PNG and PDF.
- **Affinity by Canva** has an official local scripting MCP, but it is listed for Claude Desktop only.
- **Inkscape** remains community-only. The best-packaged option for Claude Code is `aravindev/inkscape_mcp`, run with `uvx inkscape_mcp`.

### Cited Findings

**Penpot: official MCP (penpot/penpot `mcp/`)**
- `penpot/penpot`: **61,372 stars**. Its default branch is `develop` — [GitHub](https://github.com/penpot/penpot)
- The standalone repo `penpot/penpot-mcp` (529 stars) is **archived**: "This repository has been archived on 2026-02-03. Its contents have been fully integrated into the main Penpot repository: https://github.com/penpot/penpot/tree/develop/mcp" — [penpot-mcp README](https://github.com/penpot/penpot-mcp)
- npm `@penpot/mcp`: latest/stable **2.15.4**, registry modified 2026-07-08. Dist-tags are `beta` 2.15.0-rc.1.116 and `next` 2.17.0 — [npm](https://www.npmjs.com/package/@penpot/mcp)
- **Architecture.** The MCP server talks to a Penpot MCP Plugin over WebSocket. "The LLM is free to write and execute arbitrary code snippets within the Penpot Plugin environment" — [mcp/README](https://github.com/penpot/penpot/tree/develop/mcp)
- **Local server.** Launch with `npx -y @penpot/mcp@latest`. In Penpot, open the plugins menu and load `http://localhost:4400/manifest.json`, then click "Connect to MCP server". The endpoint is `http://localhost:4401/mcp`; the port is configurable with `PENPOT_MCP_SERVER_PORT`. "The legacy `/sse` and `/messages` endpoints are no longer supported." The recommended client setup is `npx -y add-mcp -g -n penpot http://localhost:4401/mcp` — [mcp/README](https://github.com/penpot/penpot/tree/develop/mcp)
- **Claude Code command.** The archived README gives it verbatim: `claude mcp add penpot -t http http://localhost:4401/mcp` — [penpot-mcp README](https://github.com/penpot/penpot-mcp)
- **Remote (hosted) server.** Enable it under "Your account → Integrations → MCP Server" and generate an MCP key, which "is shown only once". The URL has the form `https://<your-penpot-domain>/mcp/stream?userToken=YOUR_MCP_KEY`, and the domain is `design.penpot.app` on the SaaS. Then choose **MCP → Connect** in a file's toolbar, because "Enabling MCP does not connect a file automatically" — [docs/mcp/index.md](https://github.com/penpot/penpot/blob/develop/docs/mcp/index.md)
- **Tools.** Local mode has five: `execute_code`, `high_level_overview`, `penpot_api_info`, `export_shape` and `import_image`. In remote mode, `import_image` from local paths is unavailable, and `export_shape` is "limited compared to local mode (for example, no direct export to local file paths)" — [docs/mcp/index.md](https://github.com/penpot/penpot/blob/develop/docs/mcp/index.md)
- **Pitfalls**:
  - Chromium 142+ private-network-access rules: the browser must be allowed to reach `localhost`. In Brave, disable Shields. Firefox does not enforce these restrictions.
  - "Do not close the plugin's UI while using the MCP server". Keep the tab active (Chrome: Settings → Performance → Always keep these sites active).
  - Use "the most capable model at your disposal" and "a vision language model (VLM)".
  - With several connected tabs the agent must pick a session ID, e.g. "Use Penpot session `o37vgcqsvt`…".
  — [mcp/README](https://github.com/penpot/penpot/tree/develop/mcp)
- **Agents write to the file.** Docs advise starting "with read-only actions (inspect, list, export)" and preferring "small, reversible steps" — [docs/mcp/index.md](https://github.com/penpot/penpot/blob/develop/docs/mcp/index.md)

**Adobe for creativity (official Adobe connector and official-marketplace plugin)**
- **Official marketplace entry.** The marketplace lists `adobe-for-creativity` (category design) with the description "…from background removal to vectorization and professional retouching". Its source is `https://github.com/adobe/skills.git`, path `plugins/creative-cloud/adobe-for-creativity` — [marketplace.json](https://github.com/anthropics/claude-plugins-official/blob/main/.claude-plugin/marketplace.json)
- **Plugin.** `plugin.json` is version **3.2.0** ("Brings together Adobe Creative Cloud tools for images, vectors, design, and video"). `.mcp.json` registers a single HTTP server, `"Adobe": {"type": "http", "url": "https://adobe-creativity.adobe.io/mcp"}`. The adobe/skills repo has 226 stars; last commit 2026-10-19 — [plugin dir](https://github.com/adobe/skills/tree/main/plugins/creative-cloud/adobe-for-creativity); [GitHub](https://github.com/adobe/skills)
- **Directory listing.** "Anthropic verified", made by Adobe Inc., sign-in Required, added April 2026. It covers "Acrobat, Photoshop, Lightroom, Illustrator, Firefly, Premiere, Adobe Express, InDesign, and Stock". The UI says "Show all 109 tools" — [claude.com connector page](https://claude.com/marketplace/connectors/adobe-creativity)
- **Full tool list** (extracted from the same page payload). The vector- and type-relevant tools are `image_vectorize`, `document_render_vector`, `document_merge_data_vector`, `image_remove_background`, `image_select_by_prompt`, `image_generative_expand`, `find_fonts`, `font_search`, `font_recommend`, `font_details`, `font_styles`, `font_preview`, `font_activate`, `font_create_kit`, `get_fontkit_embed_url`, `get_type_palette`, `suggest_type_palettes`, `create_firefly_board`, `export_html_to_express`, `export_idml` and `animate_design`. Asset staging uses `asset_initialize_file_upload`, `asset_finalize_file_upload`, `asset_get_presigned_urls` and `asset_add_file` — [claude.com connector page](https://claude.com/marketplace/connectors/adobe-creativity)
- **Bundled skills.** `adobe`, the tour shown via `/adobe`, plus `adobe-batch-edit-photos`, `adobe-retouch-portraits`, `adobe-resize-photos-and-videos`, `adobe-create-social-variations`, `adobe-design-from-template`, `adobe-design-to-pdf`, `adobe-create-pdfs-from-data`, `adobe-document-review`, `adobe-edit-quick-cut`, `adobe-fonts`, and `adobe-any{pdf,docx,pptx,excel}`. Every workflow starts with `adobe_mandatory_init` — [skills dir](https://github.com/adobe/skills/tree/main/plugins/creative-cloud/adobe-for-creativity/skills); [adobe/SKILL.md](https://github.com/adobe/skills/blob/main/plugins/creative-cloud/adobe-for-creativity/skills/adobe/SKILL.md)
- **Local files are a key pitfall for Claude Code.** "Never pass a raw local filesystem path to any `image_*` tool. Local files must reach Creative Cloud first — selected via the `asset_add_file` picker, or (no-widget fallback) staged via `asset_initialize_file_upload` → PUT → `asset_finalize_file_upload`". With "egress **disabled**, no picker on this surface", the skill must "tell the user staging isn't possible on this surface". The compatibility line names "Claude Cowork" (widgets) and "Codex" (no widgets) as the two modes — [adobe-batch-edit-photos/SKILL.md](https://github.com/adobe/skills/blob/main/plugins/creative-cloud/adobe-for-creativity/skills/adobe-batch-edit-photos/SKILL.md)
- **Illustrator `.ai` files are rasterized in the shipped skills.** "PSD / AI file | `document_render_vector` (JPEG, 300 DPI)". The social-variations skill marks "PSD / AI (Illustrator) | ⚠️ Partial | Flatten first" — [adobe-resize-photos-and-videos/SKILL.md](https://github.com/adobe/skills/blob/main/plugins/creative-cloud/adobe-for-creativity/skills/adobe-resize-photos-and-videos/SKILL.md); [adobe-create-social-variations/SKILL.md](https://github.com/adobe/skills/blob/main/plugins/creative-cloud/adobe-for-creativity/skills/adobe-create-social-variations/SKILL.md)
- **Sibling plugin `run-workflow`** (Firefly workflows). Its MCP is `https://run-workflow.adobe.io/mcp`. It "Requires an enterprise Adobe account with a Firefly Services or Firefly Creative Production entitlement… Not available to individual/personal Adobe accounts". Install (verbatim): `/plugin marketplace add adobe/skills` then `/plugin install run-workflow@adobe-skills` — [run-workflow SKILL.md](https://github.com/adobe/skills/blob/main/plugins/creative-cloud/run-workflow/skills/run-workflow/SKILL.md); [adobe/skills README](https://github.com/adobe/skills)
- **Secondary sources** say the connector launched 28 Apr 2026 with "50+ tools", and that an Adobe account is optional: signing in "unlocks higher usage limits, access to more tools, Creative Cloud storage". The directory now shows 109 tools — [weandthecolor (search summary)](https://weandthecolor.com/how-does-the-adobe-for-creativity-connector-work-in-claude/210357); [pasqualepillitteri.it (search summary)](https://www.pasqualepillitteri.it/en/news/1558/claude-adobe-creative-cloud-50-tools-single-prompt-2026)

**Adobe Illustrator desktop control (not the connector)**
- **Built-in Illustrator Beta MCP.** A community README states: "Adobe ships a built-in MCP server in **Illustrator Beta** (30.4+, still beta-only as of August 2026), focused on analyzing and batch-processing existing documents… get an auth key + URL from the app settings, connect via `mcp-remote`", with "~40" tools and "No new objects, text frames, or documents" ("Based on user reports as of April 2026") — [ie3jp README comparison](https://github.com/ie3jp/illustrator-mcp-server). Adobe's own page, which I did not fetch: [helpx.adobe.com](https://helpx.adobe.com/illustrator/desktop/connect-with-other-apps-and-tools/about-using-ai-tools-with-illustrator.html)
- **ie3jp/illustrator-mcp-server** (community): **171 stars**; npm `illustrator-mcp-server` **1.10.3** (2026-09-26); 66 tools. Claude Code (verbatim): `claude mcp add illustrator-mcp -- npx illustrator-mcp-server`.
  - Runs on macOS and Windows via ExtendScript. "Illustrator 2024 (v28) and later are verified".
  - On macOS, allow Automation access the first time it runs. "Most modify tools bring Illustrator to the foreground".
  - It does not overwrite existing files unless `overwrite: true` is set.
  - Recipes include "Export all artboards as SVG with outlined text" and `import_svg_as_editable`.
  — [README](https://github.com/ie3jp/illustrator-mcp-server); [npm](https://www.npmjs.com/package/illustrator-mcp-server)
- Other community options: **krVatsal/illustrator-mcp** (165 stars) and **SFKislev/Flue** (98 stars, "Let agents control many desktop software directly from the cli… no MCP servers", tagged illustrator/photoshop/indesign) — [GitHub search](https://github.com/search?q=illustrator+mcp&type=repositories)

**Canva (official plugin + MCP + CLI)**
- **Official marketplace entry** `canva` (design): "Create, edit, review, resize, and brand-check Canva designs with the Canva MCP server". Its source is `canva-sdks/canva-skills`, path `plugins/canva` — [marketplace.json](https://github.com/anthropics/claude-plugins-official/blob/main/.claude-plugin/marketplace.json)
- **Install (verbatim, "Claude" section):** `/plugin marketplace add canva-sdks/canva-skills` then `/plugin install canva@canva-skills`; refresh with `/plugin marketplace update canva-skills`. The README says "This works in Claude Code, Claude Desktop, and other Claude clients". The MCP is `https://mcp.canva.com/mcp` (HTTP). The repo has 129 stars; last commit 2026-10-16 — [canva-skills README](https://github.com/canva-sdks/canva-skills); [plugin .mcp.json](https://github.com/canva-sdks/canva-skills/blob/main/plugins/canva/.mcp.json)
- **Active skills:** `resize-for-social-media`, `bulk-create` ("Requires Canva Enterprise for autofill"), `implement-feedback`, `edit-design` (transaction-based: `start-editing-transaction` → `perform-editing-operations` → `commit-editing-transaction`), `get-design-feedback`, `brand-check` and `cli`. Inactive skills: `branded-presentation`, `generate-deck`, `classroom-helper`, `presentation-time-fitting` and `design-translation` — [README](https://github.com/canva-sdks/canva-skills)
- **Directory tool list:** `search-designs`, `get-design`, `get-design-pages`, `get-design-content`, `search`, `fetch`, `import-design-from-url`, `get-design-import-from-url-status`, `export-design`, `get-export-formats`, `get-design-export-status`, `create-folder`, `move-item-to-folder`, `list-folder-items`, `add-comment-thread-to-design`, `generate-design` and `get-design-generation-job`. Added November 2025; sign-in required — [claude.com connector page](https://claude.com/marketplace/connectors/canva)
- **Canva CLI** (bundled `cli` skill). Install: `npm install -g @canva/cli@latest` (npm **2.14.1**, 2026-10-13). Log in with `canva login`, or `canva login --mode manual` "In a remote or headless environment". Use `--dry-run` before writes. The skill says the CLI "requires Node.js v24 and npm v11" — [cli/SKILL.md](https://github.com/canva-sdks/canva-skills/blob/main/plugins/canva/skills/cli/SKILL.md); [npm](https://www.npmjs.com/package/@canva/cli)
- **No SVG export (checked locally).** `canva api describe exports create` (CLI 2.14.1, run on Node 22 in this session) shows `POST /v1/exports` with flags `--format`, `--format-quality-jpg`, `--format-quality-mp4`, `--format-lossless` ("the PNG is exported without compression"), `--format-transparent-background`, and `--format-size` ("The paper size of the export PDF file"). "svg" does not appear anywhere in the contract. `rateLimitPerUserPerMinute: 20` — [Canva CLI (local run)](https://www.npmjs.com/package/@canva/cli); [docs URL from contract](https://www.canva.dev/docs/apps/rest-apis/reference/exports/create-design-export-job/)

**Affinity by Canva (official, local)**
- **Directory entry** `affinity-106b90`: made by Canva, added April 2026. "The Affinity MCP server runs locally on your device. It's only active when both Claude desktop and Affinity are running… Go to Settings, where you will find the MCP Server configuration options". Tools: `execute_script`, `render_spread`, `render_selection`, `list_sdk_documentation`, `read_sdk_documentation_topic`, `search_sdk_hints`, `list_library_scripts`, `read_library_script`, `save_script_to_library`, `add_sdk_hint` and `report_sdk_issue`. `worksWith: ["claude-desktop"]` — [claude.com connector page](https://claude.com/marketplace/connectors/affinity-106b90)
- **Community bridge** for other clients (search summary): `andre-carbajal/affinity-mcp-bridge` needs "Settings > Model Context Protocol > Enable MCP server", Affinity by Canva 3.2+, and the default endpoint `http://localhost:6767/sse` — [glama listing](https://glama.ai/mcp/servers/andre-carbajal/affinity-mcp-bridge)
- **Name collision.** The directory slug `affinity` is the unrelated **Affinity CRM** (`https://mcp.affinity.co/mcp`, deals and contacts) — [claude.com connector page](https://claude.com/marketplace/connectors/affinity)

**Inkscape MCPs (community, detail)**
- **aravindev/inkscape_mcp**: 79 stars; PyPI **`inkscape-mcp` 1.3.1** (2026-08-31); last commit 2026-08-31.
  - Claude Code (verbatim): `claude mcp add inkscape_mcp -s user -- uvx inkscape_mcp`, then check with `claude mcp list | grep inkscape_mcp`.
  - Exposes eight portmanteau tools (`inkscape_file`, `inkscape_vector`, `inkscape_analysis`, `inkscape_system`, `inkscape_extension`, `inkscape_gradient`, `inkscape_metadata`, `inkscape_live`), each taking an `operation` string.
  - Headless mode runs `inkscape --actions=...`. Live mode controls a running window over D-Bus, staging SVG through the clipboard, and it "rasterizes its own work to inspect and refine the result".
  - "Tested with **Inkscape 1.4.4** on Ubuntu 24.04".
  — [README](https://github.com/aravindev/inkscape_mcp); [PyPI](https://pypi.org/project/inkscape-mcp/)
- **sandraschi/inkscape-mcp**: 89 stars; last commit 2026-10-12. "17 tools, 60+ operations"; headless by default via `inkscape --actions`; optional live GUI with `--active-window`. It ships as an MCP server, a Claude Desktop `.mcpb` bundle, a web app and a Windows desktop app. Troubleshooting is Windows-centric (`winget install Inkscape.Inkscape`). Requires "Inkscape 1.0+ (1.2+ recommended for Actions API)" — [README](https://github.com/sandraschi/inkscape-mcp)
- **Shriinivas/inkmcp**: 75 stars; last commit 2026-01-14. GUI control over D-Bus (`gdbus introspect --session --dest org.inkscape.Inkscape …`); includes a CLI `python inkmcpcli.py export-document-image "format=png max_size=800"` — [README](https://github.com/Shriinivas/inkmcp)
- **grumpydevorg/inkscape-mcps**: 55 stars; last commit 2025-10-22. "Security hardened" (workspace-scoped paths, action allowlists, `INKS_WORKSPACE`, `INKS_TIMEOUT`). Tools include `action_list` and `action_run`. Its README says "`pip install inkscape-mcp` (when published)", but **that PyPI name now belongs to aravindev's project** — [README](https://github.com/grumpydevorg/inkscape-mcps); [PyPI](https://pypi.org/project/inkscape-mcp/)

**Figma: vector export specifics (deepening the round-1 pick)**
- **Directory note.** "The get_screenshot tool is currently limited to returning a descripton of screenshots in Figma when called in Claude and Claude Code". Tools: `generate_diagram`, `get_design_context`, `get_screenshot`, `get_metadata`, `create_design_system_rules`, `get_variable_defs`, `get_code_connect_map`, `get_figjam` and `whoami` — [claude.com Figma page](https://claude.com/marketplace/connectors/figma)
- **Vectors arrive as asset URLs.** "`get_design_context` often represents a vector as an asset URL rendered through `<img src={imgVectorUrl} />`". For path-level work, "fetch/inline the SVG markup from the asset URL (`curl <asset-url>`; don't pass the bytes to the Read tool…)" — [svg-and-path-motion.md](https://github.com/figma/mcp-server-guide/blob/main/skills/figma-implement-motion/references/svg-and-path-motion.md)
- **Fidelity limits.** "Vector networks (Figma's non-SVG vector format) and boolean operations… have limited export fidelity". The suggested workaround is "Export as flattened SVG". Also: "MCP can't produce GIFs or animated SVGs. Vector layers export as individual static SVGs with no motion data attached" — [unsupported-and-fallbacks.md](https://github.com/figma/mcp-server-guide/blob/main/skills/figma-implement-motion/references/unsupported-and-fallbacks.md)
- **Importing SVG into Figma.** "Import with `figma.createNodeFromSvg(svgString)`… The SVG string **must** include a `viewBox` plus explicit `width`/`height`… Without `width`/`height` it falls back to the `viewBox` size" — [figma-generate-design/SKILL.md](https://github.com/figma/mcp-server-guide/blob/main/skills/figma-generate-design/SKILL.md)
- The figma/mcp-server-guide repo now ships 17 skills, including `figma-generate-diagram`, `figma-use-figjam`, `figma-implement-motion`, `figma-use-motion`, `figma-shaders` and `figma-generative-plugins` (last commit 2026-10-19) — [repo](https://github.com/figma/mcp-server-guide)

### Inferences
- For **SVG deliverables**, the useful "app" integrations in Claude Code are Penpot (`export_shape`, plus code execution against the Plugin API), Illustrator (via ie3jp or the Beta MCP), Inkscape (headless CLI) and Figma (asset URLs). Canva and Adobe for creativity are raster, PDF and template workflows. Adobe is the exception for vectorization, through `image_vectorize`.
- **Manual remote setup (inferred, standard Claude Code syntax).** `claude mcp add --transport http adobe https://adobe-creativity.adobe.io/mcp` and `claude mcp add --transport http canva https://mcp.canva.com/mcp`. For the hosted Penpot server, quote the URL: `claude mcp add --transport http penpot "https://design.penpot.app/mcp/stream?userToken=<KEY>"`. The key sits in the URL, so keep the command out of shell history and project `.mcp.json` files.
- **Official-marketplace install (inferred** by analogy with the verified `claude plugin install figma@claude-plugins-official`**).** `/plugin install adobe-for-creativity@claude-plugins-official`, `/plugin install canva@claude-plugins-official` and `/plugin install miro@claude-plugins-official`.
- Under the Claude Code sandbox, Adobe's staging step (a PUT to a presigned URL) needs outbound network access to Adobe hosts. Without it, Adobe tools only work on assets already in Creative Cloud.
- Penpot's local mode is the only one of these app integrations that can write exports straight to your repo. Remote mode cannot.

### Gaps
- I could not read Adobe's own connector documentation (adobe.com/helpx were not fetched). The surface-specific behavior of `image_vectorize`, including its output format and whether it returns SVG, is undocumented in the sources I read.
- The official Illustrator Beta MCP is described only by a competing community README. Adobe's helpx page was not fetched.
- I found no first-party source for Affinity's MCP port or transport. The `localhost:6767/sse` endpoint comes from a community bridge listing.
- I could not determine whether the Canva MCP `export-design` tool exposes formats beyond what the REST contract shows. `get-export-formats` was not callable without login.

---

## 2. Diagram/whiteboard tools: tldraw, Mermaid Chart official MCP (endpoint discrepancy), PlantUML/Kroki/Graphviz MCPs, Miro plugin, FigJam via Figma MCP (plus Lucid and Whimsical)

### Takeaway
- **Mermaid Chart.** The Anthropic directory resolves the endpoint discrepancy. Mermaid Chart's directory connector is `https://chatgpt.mermaid.ai/anthropic/mcp`, not `mcp.mermaid.ai` or `mcp.mermaidchart.com`. It needs no sign-in and is listed for **claude.ai only**.
- **tldraw.** The official MCP App (`https://tldraw-mcp-app.tldraw.workers.dev/mcp`) is widget-based and **not listed for Claude Code**.
- **Miro** has an official plugin in the official marketplace that targets Claude Code, with 31 tools including `diagram_create` and `diagram_get_dsl`.
- **FigJam** diagrams come from the Figma MCP `generate_diagram` tool (Mermaid → editable FigJam).
- **New official remote connectors listed for Claude Code:** Lucid (`https://mcp.lucid.app/mcp`) and Whimsical (`https://mcp.whimsical.com/mcp`).
- **Kroki, PlantUML and Graphviz MCPs** are all small community projects, so calling `dot`, `plantuml` or Kroki over HTTP from Bash is simpler.

### Cited Findings

**Mermaid Chart: endpoint resolved via the Anthropic directory**
- **Directory entry** "Mermaid Chart | Anthropic verified", made by Mermaid Chart Inc, sign-in **Not required**, added November 2025, connector URL **`https://chatgpt.mermaid.ai/anthropic/mcp`**. It "Validates Mermaid syntax, renders diagrams as high-quality SVG, and displays them instantly in an interactive UI". Tools: `display_mermaid`, `list_personal_diagrams`, `save_diagram`, `update_diagram`, `repair_diagram`, `sign_in` and `get_diagram_by_url` — [claude.com connector page](https://claude.com/marketplace/connectors/mermaid-chart)
- **Surfaces.** `worksWith: ["claude"]` and `hasMcpApp: true` — [claude.com listing payload](https://claude.com/marketplace/connectors-plugins)
- **Conflicting third-party listings.** Third-party directories show `https://mcp.mermaid.ai/mcp` (Streamable HTTP, OAuth) and `https://mcp.mermaidchart.com/mcp` — [mcpservers.org](https://mcpservers.org/remote-mcp-servers/mermaid-chart); [mcpplaygroundonline (search summary)](https://mcpplaygroundonline.com/mcp-servers/com-mermaidchart-mermaid-mcp)
- **No MCP repo on GitHub.** The Mermaid-Chart GitHub org has no public MCP repo. Its repos include `vscode-mermaid-chart` (154 stars) and `vscode-mermaid-preview` (247 stars) — [GitHub org search](https://github.com/Mermaid-Chart)

**tldraw (official MCP App)**
- `apps/mcp-app/server.json` sets name `io.github.tldraw/tldraw` and version `0.1.0`, with remotes `streamable-http` `https://tldraw-mcp-app.tldraw.workers.dev/mcp` and `sse` `…/sse`. The description reads "Draw and visually collaborate with your agents on tldraw's canvas." — [server.json](https://github.com/tldraw/tldraw/blob/main/apps/mcp-app/server.json)
- **Architecture.** The app runs on Cloudflare Workers with a Durable Object (SQLite checkpoints). Tools: `search` ("query the extracted Editor API spec"), `exec` ("execute JavaScript against the live editor **in the widget** via a pending-request callback bridge"), the app-only `_exec_callback`, and `save_checkpoint`/`read_checkpoint`. The widget is "a full tldraw canvas inside the MCP host's iframe". The setup docs cover Cursor and Claude Desktop ("use the in-app connector flow… **Add custom connector** option is not available on the free plan") — [apps/mcp-app/README.md](https://github.com/tldraw/tldraw/blob/main/apps/mcp-app/README.md)
- **Directory listing.** It shows a *different* tool set: `diagram_drawing_read_me`, `create_shapes`, `update_shapes`, `delete_shapes`, `read_checkpoint` and `save_checkpoint`. Sign-in Not required; added March 2026; `worksWith` claude, claude-api and claude-desktop (no claude-code). The README and the directory therefore **conflict** on the tool names — [claude.com connector page](https://claude.com/marketplace/connectors/tldraw); [listing payload](https://claude.com/marketplace/connectors-plugins)
- **Separate tldraw.com MCP.** A second, board-screenshot MCP at `POST /api/app/mcp` on tldraw.com is being moved behind OAuth 2.1 with feature-flag rollout: "Status: implemented on this branch, not yet enabled". "Auth is required, not optional… This retires the 'point any agent at a public tldraw board' use case" — [mcp-server-auth.md](https://github.com/tldraw/tldraw/blob/main/apps/dotcom/mcp-server-auth.md)
- **SDK.** `tldraw/tldraw` has **50,989 stars**; npm `tldraw` **5.5.2** (2026-10-19) — [GitHub](https://github.com/tldraw/tldraw); [npm](https://www.npmjs.com/package/tldraw)
- **Community `.tldr` file servers** (all tiny): talhaorak/tldraw-mcp (3 stars, "managing local tldraw canvas files (.tldr)"), AndresMuelas2004/tldraw-mcp-server (3 stars, "30 tools, 14 shape types"), joelhooks/tldraw-agent (11 stars, "CLI, MCP, library") and jananadiw/codex-tldraw-mcp (25 stars) — [GitHub search](https://github.com/search?q=tldraw+mcp&type=repositories)

**Miro (official marketplace plugin)**
- **Official marketplace entry** `miro` (design): "Secure access to Miro boards. Enables AI to read board context, create diagrams, and generate code". Source: `miroapp/miro-ai`, path `claude-plugins/miro` — [marketplace.json](https://github.com/anthropics/claude-plugins-official/blob/main/.claude-plugin/marketplace.json)
- **Plugin.** v2.0.0; MCP `{"type":"http","url":"https://mcp.miro.com/","headers":{"X-AI-Source":"claude-code-plugin"}}`. Skills: `miro-code-explain-on-board`, `miro-code-review` and `miro-code-spec`. "Creating content on a board — diagrams, documents, tables, stickies… needs no skill". Install: "Ensure Miro MCP is configured (OAuth)… Enable this plugin". The miro-ai repo has 163 stars; last commit 2026-09-17 — [plugin README](https://github.com/miroapp/miro-ai/tree/main/claude-plugins/miro); [.mcp.json](https://github.com/miroapp/miro-ai/blob/main/claude-plugins/miro/.mcp.json)
- **Directory.** Added February 2026, 31 tools. These include `diagram_create`, `diagram_get_dsl`, `layout_create`, `layout_get_dsl`, `layout_read`, `layout_update`, `image_create`, `image_get_data`, `image_get_url`, `doc_create`, `table_create`, `table_sync_rows`, `board_create`, `board_search_boards`, `code_widget_create`, `comment_resolve`, `prototype_read` and `prototype_create`. `worksWith` includes claude-code — [claude.com connector page](https://claude.com/marketplace/connectors/miro)

**FigJam via Figma MCP**
- "`generate_diagram` takes Mermaid.js syntax and produces an editable FigJam diagram". The skill is a "MANDATORY prerequisite — load this skill BEFORE every `generate_diagram` tool call". Unsupported types include mindmaps, pie charts and class diagrams. Rules: "**No emojis**… The tool rejects them". Sequence diagram `Note over X` lines "are silently stripped". In FigJam, avoid `figma.createPage()`, which "throws `TypeError`" — [figma-generate-diagram/SKILL.md](https://github.com/figma/mcp-server-guide/blob/main/skills/figma-generate-diagram/SKILL.md)
- FigJam-specific Plugin API nodes: `createSticky`, `createShapeWithText`, `createConnector`, `createSection`, `createTable`, `createCodeBlock` and `createNodeFromSvg` — [plan-board-content.md](https://github.com/figma/mcp-server-guide/blob/main/skills/figma-use-figjam/references/plan-board-content.md)

**Lucid and Whimsical (official remote connectors new this round)**
- **Lucid.** Connector URL `https://mcp.lucid.app/mcp`; sign-in required; added April 2026. Tools: `search`, `fetch`, `lucid_create_diagram_from_specification`, `lucid_create_sequence_diagram`, `lucid_create_org_chart`, `lucid_create_mind_map`, `lucid_create_document_share_link`, `share_document_with_collaborators` and `lucid_export_document_as_PNG`. The only export tool is **PNG**. `worksWith` includes claude-code — [claude.com connector page](https://claude.com/marketplace/connectors/lucid)
- **Whimsical.** Connector URL `https://mcp.whimsical.com/mcp`; sign-in required; added May 2026. Tools: `create`, `edit`, `search`, `fetch`, `file_tree`, `list_workspaces`, `how_to`, `generate_diagram`, `generate_mind_map`, `generate_wireframe` and `doc_create`. `worksWith` includes claude-code — [claude.com connector page](https://claude.com/marketplace/connectors/whimsical)

**PlantUML / Kroki / Graphviz MCPs (community)**
- **utain/kroki-mcp**: 19 stars; Go; last commit 2026-08-15; "supports both local and remote Kroki servers… outputs multiple formats" — [repo](https://github.com/utain/kroki-mcp)
- **tohachan/diagram-bridge-mcp**: 14 stars; "Powered by Kroki" — [repo](https://github.com/tohachan/diagram-bridge-mcp)
- **tkoba1974/mcp-kroki**: 8 stars; uses kroki.io — [repo](https://github.com/tkoba1974/mcp-kroki)
- **antoinebou12/uml-mcp** (round 1) remains the largest at 107 stars — [repo](https://github.com/antoinebou12/uml-mcp)
- **Graphviz MCPs** are very small: dminkovski/azure-diagram-mcp (26 stars, PNG via Python Diagrams + Graphviz), teamchong/drawmode (15 stars, Excalidraw with Graphviz layout) and zavora-ai/flowchart-mcp (1 star, exports draw.io/Mermaid/DOT/SVG) — [GitHub search](https://github.com/search?q=graphviz+mcp&type=repositories)
- **Large draw.io-based figure tool** (Codex-first): **icebird1998/drawio-scientific-illustrator** has **1,456 stars** (last commit 2026-07-30). It draws "live inside the visible draw.io desktop canvas" through a localhost MCP, and a `drawio-file-utils` MCP "exports PNG, SVG, PDF, or JPG". It is packaged as a Codex plugin, not a Claude plugin — [README](https://github.com/icebird1998/drawio-scientific-illustrator)
- **draw.io gap from round 1 closed** (verbatim): `claude mcp add drawio -- npx -y @drawio/mcp` — [mcp-tool-server/README.md](https://github.com/jgraph/drawio-mcp/blob/main/mcp-tool-server/README.md)

### Inferences
- In the Claude Code CLI, prefer file-producing paths (`mmdc`, `d2`, draw.io plugin, Kroki/PlantUML over HTTP). Mermaid Chart's and tldraw's official connectors are MCP-App widgets aimed at claude.ai and Desktop.
- tldraw's `exec` resolves only when the widget picks up the pending request, so in a terminal client without MCP-App rendering it is likely to hang or time out. This is inferred from the README architecture and the missing `claude-code` in `worksWith`.
- Lucid exports only PNG and Miro's tools return board content, not SVG. They suit collaborative boards, not SVG assets in the repo.
- For Kroki, a no-MCP route works well: POST the diagram source to `https://kroki.io/<type>/svg` (**inferred** from Kroki's public API pattern; not re-verified this session). You can also run the `yuzutech/kroki` Docker image locally to keep diagrams private (prior knowledge, unverified).

### Gaps
- I could not probe the three Mermaid endpoints live (proxy blocked), so I cannot say whether `mcp.mermaid.ai/mcp` also serves the same server. The Anthropic-listed URL is the only first-party-curated one.
- The tldraw tool-name conflict (README `search`/`exec` vs directory `create_shapes`/…) is unresolved. Either the directory listing is stale or the deployed worker differs from `main`.
- I found no official PlantUML, Kroki or Graphviz MCP.

---

## 3. Animated vector formats: Rive, LottieFiles, SVGator, CSS/SMIL; verifying animated SVG frame-by-frame

### Takeaway
- **Rive** has an official MCP built into the desktop Editor (macOS and Windows only). Its docs give a verbatim Claude Code command, `claude mcp add --transport http rive http://127.0.0.1:9791/mcp`.
- **SVGator** has an official remote MCP (`https://mcp.svgator.com/mcp`, OAuth) with 22 tools. It exports **SVG, Lottie, React Native, Flutter, video or GIF**, and has a documented Claude Code command. It is the most complete SVG-animation MCP found.
- **LottieFiles** now ships an official Creator agent plugin with a Claude Code marketplace install (endpoint `https://creator-mcp.lottiefiles.com/mcp`), but its own docs say publication is not yet confirmed.
- **For frame-by-frame checks of CSS/SMIL SVG:** pause and seek in a real browser (`svg.pauseAnimations()` + `setCurrentTime(t)` for SMIL; `document.getAnimations()` + `currentTime` for CSS/WAAPI), then screenshot via Playwright. Playwright's clock API drives timers and `requestAnimationFrame` for JS animation (e.g. GSAP).

### Cited Findings

**Rive (official, local MCP in the Editor)**
- The note reads "MCP integration is currently available only in the desktop Editor for Windows and macOS". Supported actions:
  - artboards (add, rename, resize, arrange)
  - scene editing (query hierarchies, update properties, reparent, delete)
  - building shapes, paths, layouts and component instances
  - "linear animations, state machines, states, transitions, conditions, keyframes, and interpolation"
  - data binding (view models)
  - "Edit scripts and shaders — manage Luau scripts and WGSL shaders… run diagnostics, recompile"
  — [rive-docs editor/ai/mcp.mdx](https://github.com/rive-app/rive-docs/blob/main/editor/ai/mcp.mdx) (rendered at [rive.app/docs/editor/ai/mcp](https://rive.app/docs/editor/ai/mcp))
- **"Using Claude in Terminal" (verbatim):** `claude mcp add --transport http rive http://127.0.0.1:9791/mcp`, then run `claude`. The Cursor config uses the same URL. "For the Rive server to be available, you must have the Rive Early Access app opened". Example prompt: "Create a State Machine about birds with 20 states and 2 layers" — [mcp.mdx](https://github.com/rive-app/rive-docs/blob/main/editor/ai/mcp.mdx)
- **Conflicting setup snippet.** A search result summary of another Rive page cited `http://localhost:9791/sse`. The current docs source uses `/mcp` — [search summary](https://rive.app/docs/editor/mcp/integration)
- **Runtimes.** npm `@rive-app/canvas` **2.45.0** (2026-10-17); `rive-app/rive-wasm` has 1,008 stars — [npm](https://www.npmjs.com/package/@rive-app/canvas); [GitHub](https://github.com/rive-app/rive-wasm)

**SVGator (official remote MCP + skill)**
- **SVGator/mcp** (docs repo, 5 stars, last commit 2026-10-01): endpoint `https://mcp.svgator.com/mcp`, Streamable HTTP, OAuth 2.1. There are 22 tools:
  - Projects: `list_projects`, `get_project`, `create_project`, `replace_project`, `duplicate_project`, `move_project`
  - Editing loop: `get_skeleton` → `read_part` → `edit_part`, plus `describe_shape`
  - Assets: `list_assets`, `get_asset`, `create_asset`, `update_asset`
  - Folders: `list_folders`, `get_folder`, `create_folder`, `update_folder`
  - Export and account: `export_project`, `get_render`, `get_profile`
  — [README](https://github.com/SVGator/mcp)
- **Claude Code (verbatim):** `claude mcp add --transport http svgator https://mcp.svgator.com/mcp`, then "run `/mcp` inside Claude Code and pick **svgator** to authenticate". The server exposes "the `/svgator-motion-design` prompt… as a slash command". Remove with `claude mcp remove svgator` — [getting-started.md](https://github.com/SVGator/mcp/blob/main/getting-started.md)
- **Export.** `export_project` supports "SVG, Lottie, React Native, Flutter, video, or GIF" ("Six formats… in two families"). Raster renders are polled via `get_render`. "Exports count against your SVGator plan's limits". The README highlights prompts like "build me an animated logo reveal and export it as a CSS-only file" — [README](https://github.com/SVGator/mcp); [exporting.md](https://github.com/SVGator/mcp/blob/main/exporting.md)
- **SVGator/skills.** `svgator-motion-design` (5 stars, last commit 2026-09-29) can be "installed directly into a Claude Code `.claude/skills/` directory" and is "Also bundled directly into that MCP server" — [README](https://github.com/SVGator/skills)

**LottieFiles (official Creator agent plugin + hosted MCP)**
- **LottieFiles/creator-agent-plugin** (2 stars, last commit 2026-09-06, v0.1.0). Claude Code (verbatim): `claude plugin marketplace add LottieFiles/creator-agent-plugin` then `claude plugin install lottiefiles-creator@lottiefiles`. `.mcp.json`: `"lottiefiles-creator": {"type": "http", "url": "https://creator-mcp.lottiefiles.com/mcp"}` — [docs/installation.md](https://github.com/LottieFiles/creator-agent-plugin/blob/main/docs/installation.md); [.mcp.json](https://github.com/LottieFiles/creator-agent-plugin/blob/main/.mcp.json)
- **Status caveat.** "This repository supports source installation. It does not prove that a universal public directory listing or production remote endpoint is approved and live". MCP Registry: "Not listed at publication time" — [docs/installation.md](https://github.com/LottieFiles/creator-agent-plugin/blob/main/docs/installation.md)
- **Pinned tool contract.** `engine_docs`, `engine_document` (list/reset/delete), `engine_exec` (`code`), `engine_export` (`durationSec`, `fps`, `frameTimeSec`, `width`, `height`, `format`, `tiles`), `engine_job_status`, `engine_job_result`, `engine_cancel_job`, `request_upload` and `lf_graphql`. "Every tool requires OAuth 2.0 scope `mcp:full`". `lf_graphql` is annotated `destructiveHint: true` — [references/tool-contract.md](https://github.com/LottieFiles/creator-agent-plugin/blob/main/references/tool-contract.md)
- **Hosted LottieFiles MCP (search summary of docs.lottiefiles.com).** It is described as the official server for searching "100,000+ free animations". Its four tools are `operations_list`, `schema_search`, `schema_details` and `graphql_execute`, and "the Lottie Creator MCP is a separate, local MCP server" — [docs.lottiefiles.com/en/platform/mcp (search summary)](https://docs.lottiefiles.com/en/platform/mcp)
- **Community** `mcp-server-lottiefiles` (junmer): npm 1.0.3, last modified 2025-03-26, so stale. A directory gives `claude mcp add-json "lottiefiles" '{"command":"npx","args":["-y","mcp-server-lottiefiles"]}'` — [npm](https://www.npmjs.com/package/mcp-server-lottiefiles); [glama](https://glama.ai/mcp/servers/@junmer/mcp-server-lottiefiles)

**Figma motion → SVG**
- "SVG animation (SMIL) — limited browser support (deprecated-ish on Chromium but still works) — generally prefer CSS/JS over SMIL". Path trims map to "`stroke-dasharray` + `stroke-dashoffset`" — [unsupported-and-fallbacks.md](https://github.com/figma/mcp-server-guide/blob/main/skills/figma-implement-motion/references/unsupported-and-fallbacks.md)

**Frame-by-frame verification primitives**
- **SMIL clock.** `SVGSVGElement.pauseAnimations()` "suspends (i.e., pauses) all currently running animations… causing the animation clock… to stand still until it is unpaused". `setCurrentTime()` "adjusts the clock for this SVG document fragment, establishing a new current time" — [MDN pauseAnimations](https://developer.mozilla.org/en-US/docs/Web/API/SVGSVGElement/pauseAnimations); [MDN setCurrentTime](https://developer.mozilla.org/en-US/docs/Web/API/SVGSVGElement/setCurrentTime) (source: [mdn/content](https://github.com/mdn/content/tree/main/files/en-us/web/api/svgsvgelement))
- **CSS / WAAPI.** `document.getAnimations()` "returns an array of all Animation objects currently in effect… includes CSS Animations, CSS Transitions, and Web Animations" — [MDN getAnimations](https://developer.mozilla.org/en-US/docs/Web/API/Document/getAnimations)
- **Playwright clock.** The clock overrides timers including `requestAnimationFrame`/`cancelAnimationFrame`, and can "tick through time manually, firing all timers and animation frames in the process" — [Playwright clock docs source](https://github.com/microsoft/playwright/blob/main/docs/src/clock.md)

### Inferences
- **Recommended verification loop (synthesized; not a published recipe)** for an animated SVG in Claude Code:
  1. Load it in Playwright MCP (inline, or via `<object>`/`<embed>` so scripts and SMIL run).
  2. For SMIL, run `svg.pauseAnimations(); svg.setCurrentTime(t)`.
  3. For CSS, run `document.getAnimations().forEach(a => { a.pause(); a.currentTime = t*1000; })`.
  4. Screenshot at e.g. t = 0, 25, 50, 75 and 100 % of the duration, plus the loop seam.
  5. Montage the frames into one contact sheet (ImageMagick `montage`, if its SVG delegate is not involved) and `Read` that single PNG.
  For GSAP or other rAF-driven animation, use `page.clock.install()` and `runFor()`, or GSAP's own `timeline.pause().seek(t)`.
- SVGator is the only official MCP found that turns an agent-authored animation into **CSS-only SVG or Lottie** files with a documented Claude Code command. Rive suits interactive state-machine assets (`.riv`) rather than SVG. LottieFiles Creator suits Lottie JSON or dotLottie.
- Rive's MCP runs only while the desktop Editor is open on macOS or Windows, so it cannot run in a headless Linux CI or cloud Claude Code session.

### Gaps
- I could not fetch the official docs.lottiefiles.com page. The hosted-MCP tool list and its Claude Code command come from a search summary only.
- I found no official LottieFiles statement on whether `creator-mcp.lottiefiles.com` is live as of 2026-10-19, and the repo's own docs say it may not be.
- No source gave seek/pause APIs for SVGator's exported JS player or dotLottie frame stepping (e.g. `setFrame`). These were not verified this session.

---

## 4. AI vector generation beyond Recraft/SVGMaker: QuiverAI, StarVector, OmniSVG, Adobe Firefly/vectorize, Ideogram; the Recraft tool list

### Takeaway
- **QuiverAI** (Arrow models) is new since round 1. It has an **official Claude Code plugin** (`/plugin marketplace add quiverai/claude-plugin`) backed by a hosted MCP at `https://app.quiver.ai/mcp`, with seven tools for text→SVG, image→SVG, SVG edits and **SVG animation**. It is the most agent-ready hosted vector generator found.
- **StarVector** and **OmniSVG** are open-weights research models, available only as local GPU inference. Neither has an MCP.
- **Adobe's connector** includes `image_vectorize`.
- **Ideogram** has no official MCP, only tiny community wrappers.
- The **Recraft remote** tool list is still unverified. The archived local server documents nine tools with per-call prices.

### Cited Findings

**QuiverAI (official)**
- **quiverai/claude-plugin** (created 2026-10-07, last commit 2026-10-12, 0 stars): plugin `quiverai` v0.1.0 "Generate, refine, vectorize, and animate SVG assets with Arrow 2 through the hosted QuiverAI MCP server". MCP `{"type":"http","url":"https://app.quiver.ai/mcp"}` — [plugin.json / .mcp.json](https://github.com/quiverai/claude-plugin/tree/main/plugins/quiverai-claude)
- **Install (verbatim):** `/plugin marketplace add quiverai/claude-plugin` then `/plugin install quiverai@quiverai`. Sign in with "run `/mcp`, select `plugin:quiverai:quiverai`, and choose **Authenticate**". Verify with `claude plugin details quiverai` and `claude mcp list` — [README](https://github.com/quiverai/claude-plugin/blob/main/plugins/quiverai-claude/README.md)
- **Tools:** `list_models`, `send_prompt`, `get_chat`, `cancel_turn`, `search_library`, `get_artifact` and `get_artifact_svg` — [README](https://github.com/quiverai/claude-plugin/blob/main/plugins/quiverai-claude/README.md)
- **Usage rules from the bundled skill:**
  - "Send up to 4 images per prompt".
  - `send_prompt` "waits up to 40 seconds"; poll with `get_chat` and `waitSeconds` (up to 25).
  - "At most three prompts from connected apps run at once per user".
  - Use a new `idempotencyKey` for each request; repeating the same key "does not bill it twice".
  - "Each prompt consumes available QuiverAI account usage".
  - Fetch results with `get_artifact_svg({ "id": …, "includePng": true })`.
  - "Arrow 2 (`arrow-2`) is the flagship vector model".
  - Strong at "Flat vector illustrations… Wordmarks and typography… Raster-to-SVG vectorization when the source image is not heavily textured".
  — [skills/quiverai/SKILL.md](https://github.com/quiverai/claude-plugin/blob/main/plugins/quiverai-claude/skills/quiverai/SKILL.md)
- **SDK.** npm `@quiverai/sdk` **0.9.5** (2026-10-01); `quiverai/quiverai-node` 34 stars. Sibling Cursor and Codex plugins exist (`quiverai/cursor-plugin`, `quiverai/codex-plugin`) — [npm](https://www.npmjs.com/package/@quiverai/sdk); [GitHub org](https://github.com/quiverai)
- **REST and models (search summaries).** REST endpoints are `POST /v1/svgs/generations` and `POST /v1/svgs/vectorizations`. The AI SDK provider lists `arrow-1`, `arrow-1.1` and `arrow-1.1-max` (the last accepts 16 reference images) — [ai-sdk.dev provider](https://ai-sdk.dev/providers/ai-sdk-providers/quiverai); [skills.sh quiver-ai](https://skills.sh/mylesmcook/mcook-skills/quiver-ai)

**StarVector (open model)**
- `joanrod/star-vector`: **4,629 stars**; last commit 2025-11-07. It "transforms vectorization into a code generation task"; image2SVG and text2SVG. HF models: `starvector/starvector-1b-im2svg` and `starvector/starvector-8b-im2svg`. Accepted at CVPR 2025. Install with `pip install -e .`; generation via `starvector.generate_im2svg(batch, max_length=4000)` — [README](https://github.com/joanrod/star-vector)

**OmniSVG (open model)**
- `OmniSVG/OmniSVG`: **2,645 stars**; last commit 2026-03-01; NeurIPS 2025. Weights: `OmniSVG1.1_8B` (17.2 GB, 2025-12-02), `OmniSVG1.1_4B` (7.69 GB) and `OmniSVG-3B` (8.49 GB). There is an HF demo Space `OmniSVG/OmniSVG-3B`. "tested our environment with CUDA 12.1". The MMSVG-Icon dataset grew to 904K and MMSVG-Illustration to 255K — [README](https://github.com/OmniSVG/OmniSVG)

**Adobe (Firefly / vectorize)**
- The Adobe for creativity connector includes `image_vectorize`, `create_firefly_board` and `document_render_vector` among its 109 tools — [claude.com connector page](https://claude.com/marketplace/connectors/adobe-creativity). Firefly workflow automation (`run-workflow`) is enterprise-only — [run-workflow SKILL.md](https://github.com/adobe/skills/blob/main/plugins/creative-cloud/run-workflow/skills/run-workflow/SKILL.md)

**Recraft (round-1 gap)**
- The archived local server documents: `generate_image` ("raster/vector… $0.04/$0.08 per raster/vector image"), `create_style` ($0.04), `vectorize_image` ($0.01), `image_to_image`, `remove_background` ($0.01), `replace_background`, `crisp_upscale` ($0.004), `creative_upscale` ($0.25) and `get_user`. "Please keep in mind that the remote MCP server uses a different credits model" — [mcp-recraft-server README](https://github.com/recraft-ai/mcp-recraft-server)
- The recraft-ai GitHub org has only two public repos: the archived MCP and ComfyUI-RecraftAI (74 stars) — [GitHub org](https://github.com/recraft-ai). The hosted server's tool list was not found in any source I could fetch — [search summary](https://www.recraft.ai/docs/mcp-reference/getting-started)

**Ideogram and aggregators**
- No official Ideogram MCP was found. Community: flowluap/ideogram-mcp-server (4 stars) and devkindhq/ideogram-ai-toolkit (2 stars, Claude Code skill). The aggregator **MohamedAbdallah-14/prompt-to-asset** (23 stars) is an "MCP server + CLI for production-grade software assets (logos, app icons, favicons…) — routes across 30+ image models… validates before shipping" — [GitHub search](https://github.com/search?q=ideogram+mcp&type=repositories); [prompt-to-asset](https://github.com/MohamedAbdallah-14/prompt-to-asset)

### Inferences
- **Ranking for "real vector out of a prompt" inside Claude Code:**
  1. QuiverAI plugin: official, one install command, SVG via `get_artifact_svg`, animation too.
  2. Recraft remote MCP.
  3. SVGMaker.
  4. Adobe `image_vectorize`: vectorize only, behind CC staging.
  StarVector and OmniSVG need a CUDA box. Wrap them yourself (e.g. a small FastMCP server) only if self-hosting is required.
- AI-generated SVG still needs the round-1 post-processing: render, Read the PNG, SVGO with preserved IDs and viewBox. Quiver's skill shows the PNG preview to the user by default, but your repo needs the SVG text from `get_artifact_svg`.

### Gaps
- QuiverAI's pricing, plan gates (`access.state: "locked"`) and the current model list could not be checked without an account.
- I found no Claude-directory listing for QuiverAI or Recraft (`/connectors/quiverai` and `/connectors/recraft` returned 404).
- I found no published MCP for StarVector or OmniSVG, and no quality benchmark comparing Quiver, Recraft and SVGMaker.

---

## 5. Data-viz SVG: D3 / Vega-Lite / Observable Plot skills or MCPs that output SVG

### Takeaway
- No mature MCP outputs **SVG files**. **antvis/mcp-server-chart** returns a *chart image URL* from AntV's hosted renderer, which by default is an Alipay service, so the data leaves your machine. **mcp-vegalite-server** returns a PNG or the Vega-Lite spec and is stale.
- For SVG, the best Claude Code route is no MCP at all: Claude writes a Vega-Lite spec and **`vl-convert vl2svg`** renders it offline, with no browser or Node needed. Alternatively Claude writes D3 or Observable Plot code and you screenshot or serialize it in Playwright.

### Cited Findings
- **antvis/mcp-server-chart:** 4,403 stars; npm `@antv/mcp-server-chart` **0.9.10** (registry modified 2026-09-21); last commit 2026-08-27.
  - The tool result is `resultObj`: "`string` The chart image url".
  - The default `VIS_REQUEST_SERVER` is `https://antv-studio.alipay.com/api/gpt-vis`. For private deployment use GPT-Vis-SSR and set `VIS_REQUEST_SERVER`; "The private deployment solution currently does not support" the three geographic map tools.
  - `DISABLED_TOOLS` filters tools.
  - Companion skill: `npx skills add antvis/chart-visualization-skills`.
  — [README](https://github.com/antvis/mcp-server-chart); [npm](https://www.npmjs.com/package/@antv/mcp-server-chart)
- **isaacwasserman/mcp-vegalite-server:** 100 stars; last commit 2025-05-16. Tools: `save_data` and `visualize_data`. `--output_type text` returns the full spec; `png` returns "a base64 encoded PNG image". Setup is documented only for Claude Desktop via `uv --directory … run mcp_server_datavis` — [README](https://github.com/isaacwasserman/mcp-vegalite-server)
- **vega/vl-convert** (last commit 2026-10-01):
  - It produces "SVG, PNG, JPEG, PDF, HTML, scenegraphs, font metadata, and Vega Editor URLs" and "embeds the official Vega and Vega-Lite JavaScript libraries, so conversions do not require a browser or Node.js".
  - CLI (verbatim): `cargo install vl-convert --locked` then `vl-convert vl2svg --input chart.vl.json --output chart.svg`. Python: `uv add "vl-convert-python>=2.0.0rc1,<3"`.
  - Security: "Local files are blocked by default. Google Fonts and plugins use separate controls"; relative sample data "use[s] the `vega-datasets` CDN by default".
  — [README](https://github.com/vega/vl-convert)
- PyPI `vl-convert-python` stable is **1.9.0.post1** (2026-01-21), while the README recommends the 2.0 RC — [PyPI](https://pypi.org/project/vl-convert-python/)
- **Library versions:** npm `vega-lite` **6.5.0** (2026-10-08), `vega-cli` **6.4.0** (2026-08-14), `@observablehq/plot` **0.6.17** (2026-04-06) — [npm vega-lite](https://www.npmjs.com/package/vega-lite); [npm vega-cli](https://www.npmjs.com/package/vega-cli); [npm @observablehq/plot](https://www.npmjs.com/package/@observablehq/plot)
- **Other Vega MCPs** are tiny and MCP-App-oriented: hydrosquall/vega-mcp-server (7 stars, "Custom interactive charts in LLM conversations using MCP Apps") and DataZooDE/peacock (4 stars) — [GitHub search](https://github.com/search?q=vega-lite+mcp&type=repositories)

### Inferences
- **Recommended data-viz → SVG loop (synthesized):**
  1. Claude writes `chart.vl.json`.
  2. Run `vl-convert vl2svg … --output chart.svg`, then `vl-convert vl2png` (or resvg) to check it visually.
  3. Read the PNG.
  4. Run SVGO with `cleanupIds` care, because Vega emits many IDs and clipPaths.
  This avoids sending data to a third-party renderer, which is the main privacy pitfall with AntV's default.
- `vega-cli` also ships `vg2svg`/`vl2svg`-style Node CLIs (prior knowledge, not re-verified). D3 and Observable Plot in Node need a DOM (jsdom) to serialize SVG (prior knowledge).
- AntV suits quick "chart in chat" use, not repo assets. Its output is a URL to a raster on AntV's service, and the README does not say SVG.

### Gaps
- I did not verify the `vega-cli` binary names and flags, or Observable Plot server-side rendering, from primary docs this session.
- The `vl-convert` repo's star count was not retrieved.

---

## 6. Fonts and typography in SVG/logo work: Google Fonts tools, text-to-path (fontTools / opentype.js / Inkscape)

### Takeaway
- No mature Google Fonts MCP exists; every hit has 0–9 stars. For licensed type selection, the Adobe connector's font tools (`font_search`, `font_recommend`, `font_preview`, `font_create_kit` and others) are the only official MCP option.
- For **text→path**, which deterministic logo deliverables need, use one of three tools:
  - **fontTools 4.67.0:** `fonttools pens.svgPathPen font.ttf "text"`. I verified it locally; it outputs pure `<path>` with no `<text>`, but it also has **no viewBox**.
  - **opentype.js 2.0.0:** `Font.getPath(text, x, y, fontSize, {kerning, features})`, with kerning, and liga/rlig only.
  - **Inkscape:** `--export-text-to-path`.

### Cited Findings
- **Adobe Fonts via MCP.** Tools: `font_recommend`, `font_search`, `font_details`, `font_styles` and `font_preview`. The skill's "Hard constraint: every font this skill surfaces… must be a real, licensable Adobe Fonts family that came back in a tool's own results". `font_preview` "returns `image_markdown`" on hosts without the widget — [adobe-fonts/SKILL.md](https://github.com/adobe/skills/blob/main/plugins/creative-cloud/adobe-for-creativity/skills/adobe-fonts/SKILL.md). Additional connector tools: `find_fonts`, `font_activate`, `font_create_kit`, `get_fontkit_embed_url`, `get_type_palette` and `suggest_type_palettes` — [claude.com connector page](https://claude.com/marketplace/connectors/adobe-creativity)
- **Google Fonts MCPs are immature.** Maxamed-Maxamed/google-fonts-mcp and dannyball710/google-fonts-mcp have 0 stars. travisvaleri/fontpool (0 stars) "searches Fontshare, Fontsource, Google and Bunny… downloads real woff2 files into your project and writes the @font-face" — [GitHub search](https://github.com/search?q=google+fonts+mcp&type=repositories)
- **fontTools.** PyPI `fonttools` **4.67.0** (2026-10-14). `fontTools/pens/svgPathPen.py` has a `main()` "Generate per-character SVG from font and text", with options `-y` (face index), `--glyphs` and `--variations AXIS=LOC` — [svgPathPen.py](https://github.com/fonttools/fonttools/blob/main/Lib/fontTools/pens/svgPathPen.py); [PyPI](https://pypi.org/project/fonttools/)
  - **Local verification (this session).** I ran `python -I -m fontTools.pens.svgPathPen LiberationSans-Bold.ttf "Logo"` in a venv with fonttools 4.67.0. The output was `<svg width="5004" height="2288">` holding one `<g transform="translate(X 1854) scale(1 -1)"><path d="…"/></g>` per glyph, in font units, with **no `viewBox`** and **0 `<text>` elements**.
- **opentype.js.** npm **2.0.0** (2026-05-06). `Font.getPath(text, x, y, fontSize, options)`; options include `kerning` ("takes kerning information into account (default: `true`)") and `features` ("Currently only ligature features `"liga"` and `"rlig"` are supported"). It supports WOFF/OTF/TTF; WOFF2 must be decompressed first (e.g. wawoff2) — [README](https://github.com/opentypejs/opentype.js); [npm](https://www.npmjs.com/package/opentype.js)
- **Inkscape CLI.** "`-T`, `--export-text-to-path` Convert text objects to paths on export, where applicable (for PS, EPS, PDF and SVG export)". Example: `inkscape --export-filename=filename.eps --export-text-to-path filename.svg`. Also `-l, --export-plain-svg` ("without sodipodi: or inkscape: namespaces and without RDF metadata"), `--vacuum-defs` and `--actions=ACTION(:ARG)[;…]` — [inkscape.pod.in (man page source)](https://gitlab.com/inkscape/inkscape/-/blob/master/man/inkscape.pod.in)
- **Other font and vector utilities on PyPI and npm:**
  - `picosvg` 0.23.0 (2026-08-14, "svg simplification… for use playing with COLR fonts")
  - `nanoemoji` 0.16.0 ("Compiler for color fonts")
  - `skia-pathops` 0.9.2 (path boolean operations)
  - npm `svg2ttf` 6.1.0 (2026-05-02, icon fonts)
  - npm `text-to-svg` 3.1.5, last modified 2022 (stale)
  — [PyPI picosvg](https://pypi.org/project/picosvg/); [PyPI nanoemoji](https://pypi.org/project/nanoemoji/); [PyPI skia-pathops](https://pypi.org/project/skia-pathops/); [npm svg2ttf](https://www.npmjs.com/package/svg2ttf); [npm text-to-svg](https://www.npmjs.com/package/text-to-svg)

### Inferences
- **Suggested Claude Code typography workflow (synthesized):**
  1. Pick the font. Use Adobe `font_search` for licensed fonts, or download an OFL font from Google Fonts or Fontsource into the repo so the build is reproducible.
  2. Prototype the logo with live `<text>` plus `@font-face` for fast iteration.
  3. For the final file, convert to paths. Use `inkscape in.svg --export-text-to-path --export-plain-svg --export-filename=out.svg` if Inkscape is installed. Otherwise use opentype.js `getPath(...)`, which keeps kerning, or fontTools.
  4. Add a `viewBox` computed from the glyph bounds. fontTools output lacks one, and its coordinates are in font units with a y-flip transform.
  5. Render with resvg, Read the PNG, and run SVGO.
- fontTools' `svgPathPen` CLI lays glyphs out per character and applies no OpenType shaping. Do not use it for scripts that need shaping (Arabic, Indic) or for ligatures and kerning-sensitive wordmarks; use HarfBuzz shaping, e.g. `uharfbuzz` with a fontTools pen. This is inferred from its "per-character" docstring and the lack of a shaping step; HarfBuzz usage was not verified this session.
- Converting text to paths removes accessibility text. Keep `<title>`/`aria-label` on the outlined logo (round 1, accessibility).

### Gaps
- I did not verify the Google Fonts Developer API or CSS2 API parameters (`developers.google.com` not fetched), or Fontsource package naming, this session.
- I did not verify opentype.js `Path.toPathData()`/`toSVG()` in its current README; the README excerpt I read documents `getPath`.

---

## 7. Raster 2D editing adjacent to SVG work: GIMP MCP, Photoshop MCP (Adobe connector vs community), ImageMagick via Bash

### Takeaway
- **Photoshop.** Two routes. The Adobe for creativity connector is hosted, official and Claude Code-capable, with photo tools such as `image_remove_background` and `image_generative_expand`, but it works only on CC-staged files. The other route is community desktop bridges. **alisaitteke/photoshop-mcp** (684 stars, npm 1.7.37) is the most active and has a one-line Claude Code command. **mikechambers/adb-mcp** is a proof of concept "not endorsed by nor supported by Adobe".
- **GIMP.** **maorcc/gimp-mcp** (268 stars) supports GIMP 3.2 and has a Claude Code command.
- **ImageMagick 6** cannot rasterize SVG without its `rsvg-convert` delegate (verified locally). Use resvg or rsvg for SVG→PNG, and ImageMagick only for raster operations.

### Cited Findings
- **maorcc/gimp-mcp:** 268 stars; last commit 2026-05-29. "56 GIMP Tools"; "Fully compatible with GIMP 3.2.x"; "Works with Claude Desktop, Claude Code, Gemini CLI". Setup: `uv sync`, install the plug-in into the GIMP 3.x config dir, then "**Tools > MCP > Start MCP Server**". Claude Code (verbatim): `claude mcp add gimp-mcp -- uv run --directory /full/path/to/gimp-mcp gimp_mcp_server.py` — [README](https://github.com/maorcc/gimp-mcp)
- **alisaitteke/photoshop-mcp:** 684 stars; npm `@alisaitteke/photoshop-mcp` **1.7.37** (2026-10-15). Claude Code (verbatim): `claude mcp add photoshop -- npx -y @alisaitteke/photoshop-mcp`. It needs "**Photoshop running** (Windows or macOS, any version 2012+) and **Node.js 18+**". "Under the hood: 128 tools (111 atomic + 17 one-step recipes)"; the repo description says "118 tools", an internal inconsistency. An optional UI runs with `npx -p @alisaitteke/photoshop-mcp ui` — [README](https://github.com/alisaitteke/photoshop-mcp); [npm](https://www.npmjs.com/package/@alisaitteke/photoshop-mcp)
- **mikechambers/adb-mcp:** 728 stars; last commit 2026-07-08. "adb-mcp is a proof of concept project… The project is not endorsed by nor supported by Adobe". The chain is AI ↔ MCP Server ↔ Node command proxy ↔ UXP plugin, and it needs "Adobe Photoshop (26.0 or greater)" plus the UXP Developer Tool. It was tested with Claude Desktop — [README](https://github.com/mikechambers/adb-mcp)
- **loonghao/photoshop-python-api-mcp-server:** 322 stars — [GitHub search](https://github.com/search?q=photoshop+mcp&type=repositories)
- **Adobe connector raster tools** include `image_remove_background`, `image_select_subject`, `image_select_by_prompt`, `image_generative_expand`, `image_fill_area`, `image_crop_and_resize`, `image_apply_preset`, `image_apply_halftone` and `image_auto_straighten` — [claude.com connector page](https://claude.com/marketplace/connectors/adobe-creativity)
- **ImageMagick (verified locally in this session).** `convert -version` reported "ImageMagick 6.9.12-98 Q16". `convert ft_logo.svg ft_logo.png` failed with "delegate failed `'rsvg-convert' -o '%o' '%i''", and no PNG was written. ImageMagick 6 hands SVG to an external `rsvg-convert` delegate — [ImageMagick legacy site (from version string)](https://legacy.imagemagick.org)

### Inferences
- In Claude Code, keep raster editing on the side of SVG work. Use resvg or rsvg-convert to rasterize, and ImageMagick (`magick` on IM7, `convert` on IM6) for contact sheets, resizing and favicon `.ico` packing. GIMP or Photoshop MCPs are worth adding only when a human-quality raster edit is needed, and both require the desktop app running, which a headless cloud session lacks.
- Raster→vector stays in round-1 tools (vtracer/potrace), Adobe `image_vectorize`, Quiver or Recraft. None of the raster-editor MCPs produce clean SVG.

### Gaps
- I did not verify ImageMagick 7 behavior (`magick` and its built-in MSVG renderer vs the rsvg delegate) this session.
- I found no official Adobe statement on desktop Photoshop MCP support. The Illustrator Beta MCP is the only desktop-app MCP from Adobe, and a community README is the only source.
