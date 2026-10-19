# Additional Claude Code skills, plugins, MCP servers and CLIs for video, motion graphics and audio (round 2, state as of 19 Oct 2026)

### Method note
- **Vendor sites were unreachable in this session.** DNS or proxy failed for remotion.dev, elevenlabs.io, fal.ai, replicate.com, twelvelabs.io, heygen.com and mcp.remotion.dev.
- **Primary sources therefore come from GitHub.** I read repos by shallow `git clone` (READMEs, SKILL.md, `.mcp.json`, plugin manifests, docs sources such as `remotion/packages/docs`, `FFmpeg/doc/filters.texi` and `hyperframes/docs`), plus the npm registry and PyPI JSON APIs.
- **Stars** are from the GitHub search API (via the GitHub MCP), read 19 Oct 2026.
- **"Last commit"** is the HEAD commit date of the default branch at clone time.
- **Labels:**
  - Anything taken only from WebSearch summaries of vendor pages is marked **(secondary)**.
  - Commands I built from general Claude Code syntax, rather than copying from a README, are marked **(inferred)**.

### Quick shortlist of NEW items (details and sources below)
| Need | Pick | Maintainer | Install (verified unless marked) | Stars / last commit |
|---|---|---|---|---|
| Remotion as a Claude Code plugin | `remotion@remotion` | Remotion (official) | `claude plugin marketplace add remotion-dev/claude-code-plugin` + `claude plugin install remotion@remotion` | 52★ / 16 Oct 2026 |
| Runway (what `runway-api` really is) | Runway Dev plugin | Runway (official) | `claude plugin marketplace add runwayml/skills` + `claude plugin install runway-api@runway-dev` | 74★ / 16 Oct 2026 |
| ElevenLabs hosted MCP + skills | `elevenlabs` plugin | ElevenLabs (official) | `/plugin marketplace add elevenlabs/plugin` + `/plugin install elevenlabs@elevenlabs` | 3★ (new) / 5 Oct 2026 |
| ElevenLabs SDK skills (TTS, music, SFX, isolator, dubbing) | `elevenlabs/skills` | ElevenLabs (official) | `npx skills add elevenlabs/skills` | 495★ / 18 Oct 2026 |
| Replicate | `replicate/skills` (+ hosted MCP) | Replicate (official) | `npx skills add replicate/skills` | 135★ / 4 Jun 2026 |
| Manim (CE + ManimGL) skills | `manim_skill` | adithya-s-k (community) | `npx skills add adithya-s-k/manim_skill` | 1,188★ / 24 Jan 2026 |
| 3b1b-style explainer pipeline with voiceover | `manim-skill` | Yusuke710 (community) | clone + `uv sync` + `ln -s "$PWD/skills/manim-skill" ~/.claude/skills/manim-skill` | 178★ / 7 Oct 2026 |
| Final Cut Pro (FCPXML) | `fcp-mcp-server` | DareDev256 (community) | `claude mcp add fcpxml -e FCP_PROJECTS_DIR=~/Movies -- uvx fcp-mcp-server` | 127★ / 9 Oct 2026 |
| Final Cut Pro (transactional, approval-gated) | `fcp-mcp` | dreliq9 (community) | `pipx install fcp-mcp` + `claude mcp add-json fcp '{"type":"stdio","command":"fcp-mcp"}' --scope user` | 10★ / 12 Oct 2026 |
| Shotcut / MLT | `shotcut-mcp` | matrodrigs (community) | `/plugin marketplace add matrodrigs/shotcut-mcp` + `/plugin install shotcut-mcp@matrodrigs` | 22★ / 17 Oct 2026 |
| OBS Studio | `OBS-MCP` (full obs-websocket v5) | Tom-R-Main (community) | build from source (no npm release) | 3★ / 14 Oct 2026 |
| OBS Studio (simple) | `obs-mcp` | royshil (community) | `npx -y obs-mcp@latest` | 146★ / 26 Aug 2025 (stale) |
| Adobe cloud video (Quick Cut, resize, render) | `adobe-for-creativity` | Adobe (official, in official marketplace) | official marketplace | — |
| Audacity 3.x | `Audacity-MCP` | xDarkzx (community) | `pip install audacity-mcp-server` | 111★ / 8 Oct 2026 |
| REAPER | `Reaper-MCP` | xDarkzx (community) | `pip install xdarkzx-reaper-mcp` | 103★ / 5 Oct 2026 |
| Video understanding | TwelveLabs plugin | TwelveLabs (official) | `/plugin marketplace add twelvelabs-io/twelve-labs-claude-code-plugin` + `/plugin install twelvelabs@twelvelabs-plugins` | 25★ / 15 May 2026 |
| AI presenter / avatar | HeyGen skills + hosted MCP | HeyGen (official) | `claude mcp add --transport http heygen https://mcp.heygen.com/mcp/v1/` | 502★ / 14 Jul 2026 |
| YouTube upload | `youtube-uploader-mcp` | anwerj (community) | install script + Google OAuth `client_secret.json` | 59★ / 20 Sep 2026 |
| Word-level ASR | WhisperX | m-bain (community OSS) | `uvx whisperx` / `pip install whisperx` | 24.7k★ / 18 Oct 2026 |
| Stems | Demucs (maintained fork) | adefossez | `uvx demucs --two-stems=vocals file.mp3` | facebookresearch repo archived |
| Loudness | ffmpeg-normalize | slhck | `uvx ffmpeg-normalize in.mp4` | 1.5k★ / 14 Oct 2026 (v1.43.0) |
| Local TTS | Kokoro-82M / Kokoro-FastAPI / Piper (piper1-gpl) | hexgrad / remsky / OHF-Voice | `pip install kokoro`; `docker run -p 8880:8880 ghcr.io/remsky/kokoro-fastapi-cpu:latest`; `pip install piper-tts` | 9.5k★ / 5.6k★ / 5.9k★ |
| GIF | gifski | ImageOptim | `brew install gifski` | 5.7k★ (AGPL-3) |

---

## Q1. Resolve earlier gaps: Remotion MCP shutdown, exact Claude Code commands (ElevenLabs, fal, Replicate), what `runway-api` connects to, and render-time/cost benchmarks

### Takeaway
- **Remotion MCP:** As of 19 Oct 2026 no primary source says the hosted MCP has actually shut down. The docs still say "no earlier than August 31, 2026", the tracking issue was closed in July with no dates, and the `@remotion/mcp` client was still published (4.0.536, 16 Oct 2026) and getting fixes in October. Remotion now also ships an official Claude Code plugin.
- **`runway-api`:** The official-marketplace plugin connects to the hosted **Runway Dev MCP** (`https://dev.runwayml.com/mcp`, browser OAuth), not the archived `runway-api-mcp-server`. The marketplace pins an older v3.0.0 commit that has no MCP config.
- **ElevenLabs:** The verified route is the official `elevenlabs/plugin`, which bundles the hosted MCP with OAuth. The hosted MCP now has `creative_*` generation tools.
- **Replicate:** Replicate's own plugin config uses `"type": "http"` on the `/sse` URL.
- **fal:** Its docs are self-contradictory: `/mcp` with a Bearer header, or `/mcp-relay` with browser OAuth. Neither could be verified first-hand.
- **Remotion Lambda cost:** about $0.001–$0.11 per render in Remotion's own examples, roughly $0.01 per output minute for a 10-minute HD video.
- **HyperFrames:** No published numbers, but it has a built-in `benchmark` command and a Lambda cost tally.

### Cited Findings
**Remotion: hosted MCP status (gap from round 1)**
- The current docs (`main`, last changed by "Docs: Deprecate Remotion MCP (#9148)" on 16 Jul 2026) still say: "The Remotion MCP is deprecated… The hosted MCP will shut down no earlier than August 31, 2026. New installations are not recommended." They also say "Follow GitHub issue #9055 for shutdown updates." — [mcp.mdx](https://github.com/remotion-dev/remotion/blob/main/packages/docs/docs/ai/mcp.mdx); [commit e7475c71](https://github.com/remotion-dev/remotion/commit/e7475c71)
- Issue #9055 was **closed as completed on 16 Jul 2026**, one day after it was opened. Its body lists planned steps ("Retire the hosted MCP infrastructure", "Define a transition period") but no dates, and it has no comments about an actual shutdown. — [remotion issue #9055](https://github.com/remotion-dev/remotion/issues/9055)
- The `@remotion/mcp` npm package (bin `remotion-mcp`) is a local stdio shim with one tool, `remotion-documentation`. That tool fetches `https://mcp.remotion.dev/mcp/67cad4626afeae106c6ffb50?query=…`. Version 4.0.536 was published 16 Oct 2026 and has no npm deprecation flag. — [packages/mcp/src/index.ts](https://github.com/remotion-dev/remotion/blob/main/packages/mcp/src/index.ts); [npm @remotion/mcp](https://www.npmjs.com/package/@remotion/mcp)
- Community fixes to it were merged in October 2026:
  - "fix(mcp): abort documentation fetch after 10 seconds" (2 Oct 2026, PR #11952).
  - "fix(mcp): url-encode documentation query param" (PR #11937).
  - Source: [commit d79efb40](https://github.com/remotion-dev/remotion/commit/d79efb40); [PR #11952](https://github.com/remotion-dev/remotion/pull/11952)
- Remotion is moving agent integration to **Studio WebMCP** instead. Commits on 31 Aug–15 Sep 2026 added a `get_current_error` WebMCP tool, exposed "media jobs through WebMCP", and added `shutDownStudio()` and WebMCP lifecycle tools. — [commit a79dba5c](https://github.com/remotion-dev/remotion/commit/a79dba5c); [commit bdb0fc11](https://github.com/remotion-dev/remotion/commit/bdb0fc11); [commit a4697435](https://github.com/remotion-dev/remotion/commit/a4697435)

**Remotion: official Claude Code plugin (new item)**
- Terminal install: `claude plugin marketplace add remotion-dev/claude-code-plugin` then `claude plugin install remotion@remotion`, then restart Claude Code. Usage: `/remotion:remotion-create Make a promo video for a record store`. It is also listed in the Claude desktop app under Customize → Plugins → Discover. — [claude-code-plugin.mdx](https://github.com/remotion-dev/remotion/blob/main/packages/docs/docs/ai/claude-code-plugin.mdx)
- The plugin manifest is `"name": "remotion"`, `"version": "4.0.536"` (versioned with Remotion), MIT. It ships the same 12 skills (`remotion-best-practices`, `remotion-create`, `remotion-markup`, `remotion-render`, `remotion-captions`, `remotion-maps`, …). Repo: 52★, created 16 Jul 2026, last commit 16 Oct 2026. — [plugin.json](https://github.com/remotion-dev/claude-code-plugin/blob/main/.claude-plugin/plugin.json); [repo](https://github.com/remotion-dev/claude-code-plugin)

**Runway: what `runway-api` in claude-plugins-official connects to**
- The official marketplace entry `runway-api` (author Runway, category design) has source `https://github.com/runwayml/skills.git`, pinned to sha `e3dffc15…`. Its description: "Generate videos, images, and audio with Runway's API… Supports seedance2, gen4.5, veo3, Nano, Banana Pro". — [marketplace.json](https://github.com/anthropics/claude-plugins-official/blob/main/.claude-plugin/marketplace.json)
- The pinned commit is dated 28 Aug 2026 ("Encourage Dev MCP without blocking integration (#21)") and is plugin **v3.0.0**:
  - Skills: `runway-dev*` plus `rw-generate-video|image|audio`, `use-runway-api` and `rw-check-org-details`.
  - It contains **no `.mcp.json`**; the Dev MCP is only "encouraged".
  - Source: [runwayml/skills @ e3dffc15](https://github.com/runwayml/skills/tree/e3dffc15498e9588e7815f37b9ecf10e8bc2c902)
- Upstream `main` is v4.0.0 ("unreleased" in the changelog; last commit 16 Oct 2026):
  - It bundles the hosted **Runway Dev MCP** as `"runway-dev": {"type": "http", "url": "https://dev.runwayml.com/mcp"}`.
  - "MCP uses browser OAuth at `https://dev.runwayml.com/mcp`; do not put an API key in its configuration. Your application uses its own server-side `RUNWAYML_API_SECRET`."
  - The Dev MCP "can look up available models, prices and limits; set up Model Routers based on cost, speed or quality, with an optional credit cap; and manage real-time avatars… inspect failed tasks".
  - The seven skills are `runway-dev-setup`, `runway-dev`, `runway-dev-models`, `runway-dev-model-routers`, `runway-dev-characters`, `runway-dev-recipes`, `runway-dev-workflows`.
  - The legacy `rw-generate-*` skills moved to `legacy/` and are "retired from the active plugin".
  - Source: [README](https://github.com/runwayml/skills); [.mcp.json](https://github.com/runwayml/skills/blob/main/.mcp.json); [CHANGELOG](https://github.com/runwayml/skills/blob/main/CHANGELOG.md)
- Claude Code install from Runway's own marketplace: `claude plugin marketplace add runwayml/skills` then `claude plugin install runway-api@runway-dev`, then run `/runway-api:runway-dev-setup`. README: "The `runway-api@claude-plugins-official` listing is managed by Anthropic and may pin a different version from the Runway-maintained marketplace." — [README](https://github.com/runwayml/skills)
- Pricing data point from changelog 2.0.0: "Seedance 2… (TTV, ITV, VTV, 36 credits/sec)". — [CHANGELOG](https://github.com/runwayml/skills/blob/main/CHANGELOG.md). Repo: 74★, 16 open issues. — [GitHub](https://github.com/runwayml/skills)

**ElevenLabs: hosted MCP, exact Claude Code route**
- The `elevenlabs/elevenlabs-mcp` repo is now **archived** on GitHub (1,535★). Its README says the local server "is deprecated in favor of the ElevenLabs hosted MCP server… available at `https://api.elevenlabs.io/v1/mcp`… authenticates with OAuth". The PyPI `elevenlabs-mcp` package was last released as 0.12.2 on 4 Aug 2026. — [elevenlabs-mcp](https://github.com/elevenlabs/elevenlabs-mcp); [PyPI](https://pypi.org/project/elevenlabs-mcp/)
- **The verified Claude Code path is the official plugin:** `/plugin marketplace add elevenlabs/plugin` then `/plugin install elevenlabs@elevenlabs`. For development: `claude --plugin-dir /path/to/plugin`. — [elevenlabs/plugin README](https://github.com/elevenlabs/plugin)
- The plugin's `mcp.json` points at `https://api.us.elevenlabs.io/v1/mcp` with a pre-registered OAuth `CLIENT_ID` `0d057191-f2bd-4516-89f8-997e7bfe6bc6`. Scopes: `convai_read`, `convai_write`, `text_to_speech`, `speech_history_read`, `flows`, `image_video_generation`, `voice_generation`. Plugin v0.4.0; repo created 18 Feb 2026, 3★, last commit 5 Oct 2026. — [mcp.json](https://github.com/elevenlabs/plugin/blob/main/mcp.json); [plugin.json](https://github.com/elevenlabs/plugin/blob/main/.claude-plugin/plugin.json)
- The hosted MCP covers both agent management and **creative generation**:
  - Tools: `creative_generate_speech`, `creative_generate_image`, `creative_generate_video`, `creative_transcribe_audio`, `creative_list_voices`, `creative_create_flow`, `creative_edit_image`, `creative_get_flow_run_status` and others.
  - Rules from the skill:
    - "Generations spend credits. Pass `estimate_only: true` to price a long video… Never call a generation tool a second time to 'retry'".
    - `generations_count` defaults to 4.
    - `voice_id` "only ever comes from `creative_list_voices`".
    - The default TTS model is `eleven_multilingual_v2`; use `eleven_v3` for inline tags like `[whispering]`.
  - Source: [creative-studio SKILL.md](https://github.com/elevenlabs/plugin/blob/main/skills/mcp/creative-studio/SKILL.md)
- (secondary) The ElevenLabs hosted-MCP docs page lists a server URL, the Streamable HTTP transport and an OAuth client ID for generic clients, plus regional URLs (EU, India, Singapore). It warns that deleting an agent is destructive. — [ElevenLabs docs: Hosted MCP server](https://elevenlabs.io/docs/eleven-agents/operate/hosted-mcp) (via search summary)
- Claude Code supports pre-registered OAuth clients: `claude mcp add --transport http --client-id your-client-id --client-secret --callback-port 8080 my-server https://mcp.example.com/mcp`. The docs also say "The SSE (Server-Sent Events) transport is deprecated. Use HTTP servers instead, where available." — [Claude Code docs: MCP](https://code.claude.com/docs/en/mcp)

**Replicate: Streamable HTTP or SSE?**
- (secondary) Replicate's landing page at mcp.replicate.com still shows `claude mcp add replicate https://mcp.replicate.com/sse --transport sse --scope user`, then `/mcp` to authenticate in the browser. — [mcp.replicate.com](https://mcp.replicate.com/) (via search summary)
- Replicate's **own** Claude plugin config (`replicate/skills`, unchanged since the first commit on 15 Feb 2026) declares `"replicate": {"type": "http", "url": "https://mcp.replicate.com/sse"}`. This is Streamable-HTTP type on the `/sse` path. — [.mcp.json](https://github.com/replicate/skills/blob/main/.mcp.json)
- Replicate's plugin marketplace exposes 7 per-skill plugins: `find-models`, `compare-models`, `run-models`, `build-models`, `publish-models`, `prompt-images`, `prompt-videos`. The cross-agent install is `npx skills add replicate/skills`. 135★, last commit 4 Jun 2026. — [marketplace.json](https://github.com/replicate/skills/blob/main/.claude-plugin/marketplace.json); [README](https://github.com/replicate/skills)
- The local alternative is `npx -y replicate-mcp@latest` with `REPLICATE_API_TOKEN`; the `--client` values include `claude-code`, and `--tools=dynamic` is available. However, npm `replicate-mcp` was last published as 0.9.0 on 9 Jun 2025. — [npm replicate-mcp](https://www.npmjs.com/package/replicate-mcp)

**fal: conflicting official instructions (secondary only)**
- Newer fal docs page (`…/setting-up/mcp/claude-code.md`): add with `--transport http --scope user` pointing at `https://mcp.fal.ai/mcp-relay`, then `/mcp` → select fal → Authenticate (browser sign-in). — [fal docs: Claude Code](https://fal.ai/docs/documentation/setting-up/mcp/claude-code.md) (via search summary)
- Older fal setup page: `claude mcp add --transport http fal-ai https://mcp.fal.ai/mcp --header "Authorization: Bearer YOUR_FAL_KEY"`. — [fal docs: MCP](https://fal.ai/docs/documentation/setting-up/mcp) (via search summary)
- No official fal-ai GitHub repo for MCP or skills was found. npm `fal-mcp` (1.2.0) is a community package by danielrosehill. — [npm fal-mcp](https://www.npmjs.com/package/fal-mcp)

**Render-time and cost benchmarks**
- Remotion's official cost examples, run with 2048 MB RAM, 10 GB disk, default concurrency, `us-east-1` and Remotion 4.0.381:

  | Render | Warm Lambda | Cold Lambda |
  |---|---|---|
  | HelloWorld template | $0.001, 7.56 s | $0.001, 11.02 s |
  | 1-minute video embedded from the same S3 bucket | $0.017, 18.91 s | $0.021, 15.52 s |
  | 10-minute remote HD video | $0.103, 56.09 s | $0.108, 60.98 s |
  | 10-second remote 4K video | $0.013, 45.28 s | $0.014, 53.09 s |

  The page warns "Rendering a video inside your video increases the cost significantly" and "We always recommend to measure the cost of your composition yourself". — [cost-example.mdx](https://github.com/remotion-dev/remotion/blob/main/packages/docs/docs/lambda/cost-example.mdx)
- Remotion's cost levers: "Reducing the memory will linearly decrease the cost", lower concurrency, the new `<Video>` from `@remotion/media`, cheaper regions, and pre-computed input props. — [cost.mdx](https://github.com/remotion-dev/remotion/blob/main/packages/docs/docs/lambda/cost.mdx)
- HyperFrames local performance:
  - `npx hyperframes benchmark [dir]` "runs several configurations — varying fps, quality, and worker count — and compares time and file size" (`--runs` 1–20, default 3; `--json`).
  - `--workers` takes 1–24 workers, "Each is a separate Chrome, roughly 256 MB".
  - Page-side compositing is "~6× faster" for SDR shader transitions.
  - `--experimental-fast-capture` is "~2× faster".
  - Low-memory mode switches on automatically at 8 GB RAM or less.
  - Low-memory detection "reads host RAM, not cgroup or container limits", so set `PRODUCER_LOW_MEMORY_MODE` in Docker.
  - Source: [HyperFrames CLI docs](https://github.com/heygen-com/hyperframes/blob/main/docs/packages/cli.mdx)
- HyperFrames on Lambda:
  - Default function memory is 10240 MB.
  - `hyperframes lambda progress` shows a running tally. Example: 480 frames, 5 Lambdas, "Cost: $0.0214 (Lambda $0.0210 + SFN $0.0004)". The estimate excludes S3 transfer.
  - "The distributed AWS path is SDR-only".
  - "A chunk must also finish inside 15 minutes".
  - "a 26-minute 576×1024 24 fps H.264 clip plans in about 20 seconds".
  - Source: [aws-lambda.mdx](https://github.com/heygen-com/hyperframes/blob/main/docs/deploy/aws-lambda.mdx)
- The npm `hyperframes` CLI is at 0.8.175, published 19 Oct 2026 (first published 23 Mar 2026). — [npm hyperframes](https://www.npmjs.com/package/hyperframes)

**Other media plugins found in claude-plugins-official (not covered in round 1)**
- `cloudinary` ("Manage assets, apply transformations, optimize media"). — [marketplace.json](https://github.com/anthropics/claude-plugins-official/blob/main/.claude-plugin/marketplace.json)
- `save-to-spotify` (Spotify: "audio episodes with TTS narration… save them to Spotify via the save-to-spotify CLI"). — same source
- `postiz` (social scheduling and media upload, including YouTube and TikTok). — same source
- `togetherai-skills` (including audio and video generation). — same source
- `synthflow` (voice-agent platform via hosted MCP). — same source

### Inferences
- **Remotion MCP:** Treat it as "deprecated, possibly still answering". The shim is maintained and the endpoint was not confirmed down, but nothing new should depend on it. Use `/remotion-docs`, or the `remotion@remotion` plugin, which is the same skills package with a one-command install and update.
- **Runway:** If you install `runway-api@claude-plugins-official` today you probably get v3.0.0, with direct generation skills (`rw-generate-*` via `uv run` scripts) and no bundled MCP. Installing from `runwayml/skills` gets v4 with the OAuth Dev MCP and app-integration skills. Pick based on whether you want "generate media now" (v3/legacy) or "build Runway into my app" (v4).
- **ElevenLabs:** The most likely working manual command is (inferred):
  ```
  claude mcp add --transport http --client-id 0d057191-f2bd-4516-89f8-997e7bfe6bc6 --callback-port <port> elevenlabs https://api.elevenlabs.io/v1/mcp
  ```
  Omit `--client-id` if the server supports dynamic registration. The plugin route avoids guessing.
- **Replicate:** Prefer `claude mcp add --transport http replicate https://mcp.replicate.com/sse --scope user` (inferred from Replicate's own plugin config) over the deprecated `--transport sse` form. If HTTP fails, fall back to the SSE command from Replicate's page.
- **fal:** Try the `/mcp-relay` OAuth route first, then the `/mcp` Bearer-header route. Keep `FAL_KEY` out of `.mcp.json` committed to git (use `${FAL_KEY}`).
- **Rough unit costs:**
  - From Remotion's numbers, Lambda for "video-in-video" HD content runs about $0.01 per output minute, and a 1-minute single-bucket clip about $0.02. Motion-graphics-only compositions should be cheaper (HelloWorld was $0.001).
  - The HyperFrames example (480 frames, about 16–20 s of video depending on fps, which is not stated) works out to roughly $0.06–0.08 per output minute. That is a very rough extrapolation, and HyperFrames' default 10 GB memory makes it pricier per second than Remotion's 2 GB default.

### Gaps
- I could not probe live endpoints (`mcp.remotion.dev`, `api.elevenlabs.io/v1/mcp`, `mcp.replicate.com`, `mcp.fal.ai`) through the proxy, so whether the Remotion hosted MCP is actually up or down on 19 Oct 2026 is unconfirmed.
- No primary-source text of ElevenLabs' or fal's Claude Code instructions was readable (DNS failures). fal's two official pages conflict.
- No local render benchmarks (seconds per output minute on a given CPU/GPU) were found for either Remotion or HyperFrames. Only Lambda examples and HyperFrames' `benchmark` tool exist.
- It is unclear whether installing one of Replicate's per-skill plugins (for example `run-models@replicate`) also activates the root `.mcp.json`.

---

## Q2. Math and explainer animation: Manim skills and MCPs for Claude Code (3Blue1Brown-style workflows)

### Takeaway
Use a **skill plus Bash `manim`**, not an MCP:
- `adithya-s-k/manim_skill` (1.2k★) is the most popular. It is the only one covering both ManimCE and ManimGL, and it installs with `npx skills add`.
- `Yusuke710/manim-skill` is the most complete 3b1b-style pipeline: narration, local Kokoro TTS, code, render, mux, then a browser review viewer.
- The best-known Manim MCP (`abhiemj/manim-mcp-server`, 652★) is stale (last commit May 2025).
- Target ManimCE 0.22.0 (Python ≥3.11). ManimGL's last PyPI release was Dec 2024.

### Cited Findings
**Frameworks**
- **Manim Community Edition:** 41.7k★, last commit 16 Oct 2026. PyPI `manim` 0.22.0 was released 8 Oct 2026 and requires Python ≥3.11. — [ManimCommunity/manim](https://github.com/ManimCommunity/manim); [PyPI manim](https://pypi.org/project/manim/)
- **ManimGL** (3Blue1Brown's original): 95.4k★. PyPI `manimgl` 1.7.2 was released 13 Dec 2024. — [3b1b/manim](https://github.com/3b1b/manim); [PyPI manimgl](https://pypi.org/project/manimgl/)
- The two "are **separate, incompatible** frameworks. Code written for one will not work with the other". ManimCE uses `from manim import *` and the `manim` CLI; ManimGL uses `from manimlib import *` and `manimgl`. — [adithya-s-k/manim_skill README](https://github.com/adithya-s-k/manim_skill)
- `manim-voiceover` 0.4.0 (14 Jun 2026) is the ManimCommunity plugin "for all things voiceover". — [PyPI manim-voiceover](https://pypi.org/project/manim-voiceover/)

**Skills (community)**
- **adithya-s-k/manim_skill**
  - Install: `npx skills add adithya-s-k/manim_skill`, or individual skills: `npx skills add adithya-s-k/manim_skill/skills/manimce-best-practices` and `…/manimgl-best-practices`.
  - It has three skills: `manimce-best-practices`, `manimgl-best-practices`, `manim-composer`.
  - 1,188★, 98 forks, created 22 Jan 2026, last commit 24 Jan 2026.
  - Source: [README](https://github.com/adithya-s-k/manim_skill); [GitHub](https://github.com/adithya-s-k/manim_skill)
- **Yusuke710/manim-skill** (Claude Code and Codex)
  - "Your coding agent autonomously generates 3Blue1Brown-style videos following a structured workflow: Narration → TTS → Code → Render → Mux → View. Voiceover narration and time-synced subtitles are on by default."
  - Install:
    ```
    git clone https://github.com/Yusuke710/manim-skill
    brew install cairo pkg-config ffmpeg
    brew install --cask mactex-no-gui
    uv sync
    ln -s "$PWD/skills/manim-skill" ~/.claude/skills/manim-skill
    ```
  - 178★, last commit 7 Oct 2026.
  - Source: [README](https://github.com/Yusuke710/manim-skill)
- Yusuke710's SKILL.md rules (usable as a template):
  - "NEVER write artifacts into the user's working directory". Each video gets a session folder.
  - Kokoro "speaks ≈2.5 words/second — size the lines to the target video length". The default voice is `af_heart`, and unchanged lines are cached in `.tts-cache/`.
  - Iteration defaults: 854×480 at 15 fps (16:9), 480×854 (9:16), 480×480 (1:1).
  - "Each narration line becomes exactly one `self.add_subcaption(text, duration=…)` call… Never burn subtitles in as text mobjects".
  - Run `lint-subtitles.py` before rendering; exit 1 means timing issues.
  - "Verify `video.mp4` with `ffprobe`, inspect representative frames".
  - A browser viewer has a Capture key (`t`) that produces notes like `[0:07] Scene3_Identity: the c² label overlaps the triangle`. Then "re-render only the affected scenes, re-mux".
  - Source: [SKILL.md](https://github.com/Yusuke710/manim-skill/blob/main/skills/manim-skill/SKILL.md)
- **edoardob90/manim-skills**
  - Install: `npx skills add edoardob90/manim-skills` (or copy or symlink `manim/` to `~/.claude/skills/`).
  - It packages reference material for ManimCE **0.20.1**, which is now two minor versions behind.
  - Its rendering contract: "always emit the code to a file and print the exact command. Never shell out to `manim` yourself".
  - Gotchas: `Tex`/`MathTex` "need a real LaTeX install (with `dvisvgm`…)", otherwise use `Text` (Pango); "Always use a raw string (`r"..."`) for Tex/MathTex".
  - Example command: `uv run manim -ql scene.py SquareToCircle`.
  - 1★, last commit 23 Apr 2026.
  - Source: [SKILL.md](https://github.com/edoardob90/manim-skills/blob/main/manim/SKILL.md)
- **vumichien/manim-skill**
  - Claude Code plugin with a 4-role pipeline (researcher, planner, implementer, main).
  - Install: `/plugin marketplace add vumichien/manim-skill` then `/plugin install manim-skill@manim-video-marketplace`.
  - 7★, last commit 20 May 2026.
  - Source: [README](https://github.com/vumichien/manim-skill)
- (secondary) Other listings found: awesome-skills/manim-skill, AureClai/claude-code-manim-skills, jnsadailton/manim-skill, shihabshahrier/manim-coding-skill (ManimGL), and davila7/claude-code-templates (`skills/video/manim`). — [GitHub search results](https://github.com/davila7/claude-code-templates/blob/main/cli-tool/components/skills/video/manim/SKILL.md)

**MCPs**
- **abhiemj/manim-mcp-server** "executes Manim animation code and returns the generated video". Install: `pip install manim`, `pip install mcp`, then a `claude_desktop_config.json` entry. 652★, but the **last commit was 19 May 2025 (stale)**. — [README](https://github.com/abhiemj/manim-mcp-server)
- `antoniomachuca/MCP-Manim-Slides` is listed in awesome-mcp-servers (not inspected). — [awesome-mcp-servers](https://github.com/punkpeye/awesome-mcp-servers)
- video-use (round 1) already generates Manim overlays "in parallel sub-agents". — [video-use README](https://github.com/browser-use/video-use)

### Inferences
- Recommended setup:
  1. Run `npx skills add adithya-s-k/manim_skill -a claude-code`. The `-a claude-code` flag is needed so the skill lands in `.claude/skills` (see round-1 report).
  2. Install `uv add manim` and LaTeX with `dvisvgm`.
  3. Iterate with `manim -ql` (480p15).
  4. Check single frames with `manim -s` (last frame) before `-qh`/`-qk`. The `-s` flag is standard ManimCE CLI and was not re-verified here.
- For narrated explainers, copy Yusuke710's pattern: measure TTS duration first, then time animations to it, with `add_subcaption` producing SRT. It avoids the classic desync problem.
- Pitfalls:
  - Mixing ManimGL and ManimCE examples in one prompt.
  - LaTeX missing on CI or containers.
  - Rendering at high quality on every iteration.
  - Letting Claude generate `Tex` with non-raw strings.

### Gaps
- No benchmark or eval compares Manim skills. Star counts are the only signal.
- No official ManimCommunity or 3b1b agent skill or MCP was found.
- `adithya-s-k/manim_skill` has not been updated since Jan 2026, so whether it matches ManimCE 0.22.0 API changes is unverified.

---

## Q3. Other NLE and tool integrations: Final Cut Pro, Kdenlive/Shotcut/MLT, OBS, CapCut, Premiere UXP, and the Adobe for creativity connector

### Takeaway
- **File-based integrations** (FCPXML, MLT XML) are the safest. Two FCP MCPs and a transactional Shotcut plugin are actively maintained, but all are small community projects (≤127★).
- **OBS:** The obs-websocket route is mature. The most complete server (Tom-R-Main/OBS-MCP, 171 tools covering the full v5 protocol) is brand-new and unpublished; the popular `royshil/obs-mcp` has been idle since Aug 2025.
- **CapCut:** There is no official MCP. `pyJianYingDraft` (4.6k★) generates Jianying drafts, but export automation works only on Windows and not for Jianying 7+.
- **Premiere:** UXP reached GA in Premiere 25.6, and hybrid UXP+C++ plugins arrived in 26.2.
- **Adobe for creativity:** Adobe's official connector exposes **cloud** Premiere features (Quick Cut AI highlight reels, resize, render, speech enhance) on Creative Cloud assets. It does not control desktop timelines.

### Cited Findings
**Final Cut Pro**
- **DareDev256/fcp-mcp-server** (formerly fcpxml-mcp-server; PyPI `fcp-mcp-server`)
  - Install:
    ```
    claude mcp add fcpxml -e FCP_PROJECTS_DIR=~/Movies -- uvx fcp-mcp-server
    ```
    With extras:
    ```
    claude mcp add fcpxml -e FCP_PROJECTS_DIR=~/Movies -- uvx --from "fcp-mcp-server[intelligence,transcribe]" fcp-mcp-server
    ```
  - Features: "15 grouped tools, 102 operations: trims, splits, silence removal, markers from transcripts and beats, rough cuts, keyframes and speed ramps". It renders the timeline inline through an MCP App (`ui://fcp/timeline`).
  - Requirements: Python 3.10+ and FCP 10.4+ (FCPXML 1.8+). Output "imported into Final Cut Pro 12.4 without warnings".
  - Known pitfall: PyPI 0.19.2–0.21.0 shipped without `tools/` and failed with "Connection closed".
  - 127★, last commit 9 Oct 2026.
  - Source: [README](https://github.com/DareDev256/fcp-mcp-server); [GitHub](https://github.com/DareDev256/fcp-mcp-server)
- **dreliq9/fcp-mcp**
  - "Trusted, local, human-approved Final Cut Pro workflows… The default profile never performs direct live or offline mutation". The flow is "inspect, prepare, review, hash approval, then commit".
  - Install: `pipx install fcp-mcp`, then `claude mcp add-json fcp '{"type":"stdio","command":"fcp-mcp"}' --scope user`.
  - Requires macOS 15.6+ with Final Cut Pro.
  - PyPI 0.2.0 (23 Apr 2026). 10★, last commit 12 Oct 2026.
  - Source: [README](https://github.com/dreliq9/fcp-mcp); [PyPI](https://pypi.org/project/fcp-mcp/)

**Shotcut / Kdenlive / MLT**
- **matrodrigs/shotcut-mcp**
  - "Create, edit, validate, preview, and render saved Shotcut projects… The result stays an editable `.mlt` timeline, with transactional writes".
  - Claude Code install: `/plugin marketplace add matrodrigs/shotcut-mcp`, then `/plugin install shotcut-mcp@matrodrigs` and `/reload-plugins`.
  - Recommends Shotcut **26.8.1** (bundled MLT 7.41.0).
  - 22★, last commit 17 Oct 2026.
  - Source: [README](https://github.com/matrodrigs/shotcut-mcp)
- **NoBanks/shotcut-mcp** drives MLT headlessly. Render is "via the `melt` CLI" (Python 3.10+, `MELT_BIN`). 0★. — [README](https://github.com/NoBanks/shotcut-mcp)
- **tiagovignatti/kdenlive-editing-mcp**
  - "Verified against Kdenlive 26.08.1, MLT 7.41.0, document version 1.1". It warns that "a `.kdenlive` file is an undocumented internal serialisation and the toolchain around it fails silently — wrong frame rate, missing audio, clips in the wrong place". It proves results "by rendering frames back out of the finished timeline and comparing them against the source".
  - 0★, created 22 Sep 2026.
  - Source: [README](https://github.com/tiagovignatti/kdenlive-editing-mcp)
- **Va1bhav512/kdenlive-mcp-server** wraps `cli-anything-kdenlive` (75 tools; `uv run kdenlive-mcp`). — [README](https://github.com/Va1bhav512/kdenlive-mcp-server)
- PyPI `kdenlive-mcp` 0.2.1 (Dec 2025, IO-AtelierTech) also exists. — [PyPI](https://pypi.org/project/kdenlive-mcp/)
- (secondary) More Kdenlive servers: camilin7483 (77 tools), SrijanCherupally (Kdenlive 26.11.70+, OTIO export), jordantaylorfuller (patched Kdenlive fork over D-Bus/HTTP). — [GitHub search](https://github.com/SrijanCherupally/kdenlive-mcp)

**OBS Studio (obs-websocket v5)**
- **Tom-R-Main/OBS-MCP** (package name `obs-mcp` 1.1.1; author list includes Roy Shilkrot, so it is a successor to royshil's server)
  - Coverage: "exposes 171 tools… All 147 request types in the OBS WebSocket protocol". It needs no OBS plugin, Node.js 20.19+ and OBS 28+.
  - Install: it "does not yet have its own npm release". Build with `git clone … && npm ci && npm run check`, then point the client at `build/index.js` with `OBS_WEBSOCKET_PASSWORD`.
  - Safety and context controls:
    - `OBS_MCP_TOOLSETS=core OBS_MCP_READ_ONLY=true` gives a 42-tool inspection-only server.
    - `OBS_MCP_DYNAMIC_TOOLSETS=true` lets the model enable groups on demand.
    - With `OBS_MCP_CONFIRM_LIVE=true`, stop-stream and stop-record ask the user via elicitation, and `confirm: true` from the model does not bypass it.
  - Other tools: source screenshots return as MCP image content, plus `obs-contact-sheet`, `obs-record-clip` and `obs-snapshot`/`obs-restore`.
  - Shared-server mode:
    ```
    OBS_MCP_HTTP_PORT=8765 OBS_MCP_READ_OBS_CONFIG=true node /path/to/OBS-MCP/build/index.js
    claude mcp add --transport http obs 'http://127.0.0.1:8765/mcp?client=claude'
    ```
  - 3★, created 21 Aug 2026, last commit 14 Oct 2026.
  - Source: [README](https://github.com/Tom-R-Main/OBS-MCP)
- **royshil/obs-mcp**
  - `npx -y obs-mcp@latest` with `OBS_WEBSOCKET_PASSWORD`; requires OBS 31+.
  - Tools for scenes, sources, scene items, streaming/recording and transitions.
  - 146★, last commit 26 Aug 2025. npm `obs-mcp` 1.1.0 was published the same day.
  - Source: [README](https://github.com/royshil/obs-mcp); [npm](https://www.npmjs.com/package/obs-mcp)
- Python alternatives on PyPI: `obs-studio-mcp` 0.5.1 (28 Jul 2026, aaronckj, 2★) and `obs-mcp` 0.2.0 (25 Jul 2026, "148 tools", secondary). — [PyPI obs-studio-mcp](https://pypi.org/project/obs-studio-mcp/); [PyPI obs-mcp](https://pypi.org/project/obs-mcp/)

**CapCut / Jianying**
- **GuanYixuan/pyJianYingDraft**
  - A Python generator for Jianying drafts: tracks, keyframes, masks, chroma key, stickers, audio fades and effects. Feature tables are marked for Jianying 5.9 and "新版剪映 10.8".
  - Automatic export depends on old Jianying UI controls: "新版（7及以上）剪映通常不再满足这一前提" (Jianying 7+ usually no longer meets this). Export works only on Windows (via `uiautomation`). "Linux/MacOS：支持草稿生成…但不支持自动导出" (drafts can be generated, but automatic export is not supported). Drafts must be exported in Windows Jianying, and the docs warn about VIP features causing loops.
  - A CapCut-international version (`pyCapCut`) "正在开发中" (in development).
  - 4,606★; PyPI 0.3.1 (14 Oct 2026).
  - Source: [README](https://github.com/GuanYixuan/pyJianYingDraft); [PyPI](https://pypi.org/project/pyJianYingDraft/); [pyCapCut](https://github.com/GuanYixuan/pyCapCut)
- No official CapCut MCP or API was found. VectCutAPI (round 1) remains the MCP route.

**Premiere UXP progress**
- (secondary) Adobe's developer blog: UXP "officially graduated from beta and is now available in Adobe Premiere 25.6". The changelog lists "Official Release of UXP extensibility in Premiere Pro" under v25.6.0. — [Adobe blog, Dec 2025](https://blog.developer.adobe.com/en/publish/2025/12/uxp-arrives-in-premiere-a-new-era-for-plugin-development); [UXP changelog](https://developer.adobe.com/premiere-pro/uxp/changelog)
- (secondary) "UXP Hybrid Plugins Now Available for Premiere" (version 26.2, April 2026) adds C++ native add-ons. CEP support continues "for at least one more major release cycle". — [Adobe blog, Apr 2026](https://blog.developer.adobe.com/en/publish/2026/04/uxp-hybrid-plugins-now-available-for-premiere); [Adobe video partner update](https://www.adobevideopartner.com/customer-stories/extensibility-update/)

**Adobe for creativity connector: what the Premiere/video side can do (primary, from Adobe's skills)**
- The official-marketplace plugin `adobe-for-creativity` (author Adobe; source `adobe/skills`, `plugins/creative-cloud/adobe-for-creativity`, pinned sha `0f487c9b`) is v3.2.0 (Apache-2.0). Its `.mcp.json` is `"Adobe": {"type": "http", "url": "https://adobe-creativity.adobe.io/mcp"}`. — [marketplace.json](https://github.com/anthropics/claude-plugins-official/blob/main/.claude-plugin/marketplace.json); [plugin dir](https://github.com/adobe/skills/tree/main/plugins/creative-cloud/adobe-for-creativity)
- Video tools referenced in its skills: `video_create_quick_cut`, `video_resize` (+ `resizeVideoPoll`), `video_render` and `media_enhance_speech`, alongside `asset_add_file`, `asset_initialize_file_upload`/`asset_finalize_file_upload` and `asset_preview_file`. — [adobe-edit-quick-cut SKILL.md](https://github.com/adobe/skills/blob/main/plugins/creative-cloud/adobe-for-creativity/skills/adobe-edit-quick-cut/SKILL.md); [adobe-resize-photos-and-videos SKILL.md](https://github.com/adobe/skills/blob/main/plugins/creative-cloud/adobe-for-creativity/skills/adobe-resize-photos-and-videos/SKILL.md)
- Quick Cut semantics, from the same Quick Cut skill:
  - It is "an AI rough-cut tool", and `target_duration` "is a soft target, not a hard trim". The skill defaults to 30 s.
  - The output is "a transient presigned URL… The URL expires".
  - The job is async (`status: "working"`).
  - It does **not** remove "um"/"uh" or trim to timestamps; `video_render` "does these (use it for precise trims and for adding music/audio/images)".
  - "Never pass a raw local filesystem path… Local files must reach Creative Cloud first".
  - A 403 means Quick Cut isn't on the user's plan.
  - Quick Cut output cannot be chained into `video_resize` or `media_enhance_speech` without re-ingesting.
- The router skill maps "resize this video to 1080x1920 for reels" to Photoshop/Premiere, and "turn this hour of footage into a 60-second reel" to "Premiere (Quick Cut)". — [adobe/SKILL.md](https://github.com/adobe/skills/blob/main/plugins/creative-cloud/adobe-for-creativity/skills/adobe/SKILL.md)

### Inferences
- For FCP, **DareDev256/fcp-mcp-server** is the pragmatic pick: one-line `uvx` install and the most users. **dreliq9/fcp-mcp** fits teams that want hash-approved, transactional edits. Both work on FCPXML files, so pin the FCP version and re-import rather than expect live control.
- For Linux/OSS pipelines, prefer **Shotcut/MLT XML + `melt`**. It is a documented XML format and matrodrigs' plugin validates and backs up each write. Kdenlive project files change between releases, so pin versions as tiagovignatti does.
- OBS: for unattended or recording automation, use Tom-R-Main/OBS-MCP in read-only or `core` toolsets with `OBS_MCP_CONFIRM_LIVE=true`. Building from source is a cost. royshil's `npx` server is easier but frozen since Aug 2025. The Claude Code command for royshil's server would be `claude mcp add obs -e OBS_WEBSOCKET_PASSWORD=… -- npx -y obs-mcp@latest` (inferred).
- Adobe connector install in Claude Code is probably `/plugin install adobe-for-creativity@claude-plugins-official` (inferred from the marketplace naming). It needs a Creative Cloud plan with the relevant entitlements. Use it for "make a reel / resize for platforms / enhance speech" on uploaded assets, not for timeline editing.
- Premiere: with UXP GA (25.6) and hybrid plugins (26.2), expect community MCP bridges to move from CEP to UXP during 2026–27. Pin the Premiere version for CEP-based bridges such as hetpatel-11's (round 1).

### Gaps
- No primary Adobe documentation listing the full "Adobe for creativity" tool catalog was readable. Tools were inferred from the skill files only, and `video_render` and `media_enhance_speech` parameters are undocumented here.
- No reliability reports were found for any FCP, Shotcut or OBS MCP. Star counts are low and several repos are weeks old.
- Neither a CapCut-official API nor the state of `pyCapCut` could be verified.

---

## Q4. Audio: Audacity, REAPER, stem separation, cleanup, loudness, music generation, TTS alternatives, sound effects

### Takeaway
- **Audacity:** Use **Audacity-MCP** (xDarkzx, 144 tools), but it only works with **Audacity 3.x**. Audacity 4 removed `mod-script-pipe`.
- **REAPER:** `xDarkzx/Reaper-MCP` (181 tools, PyPI) is the most complete. `creaper` is a brand-new, polished alternative.
- **Stems:** Use the adefossez Demucs fork (`uvx demucs`); the Meta repo is archived.
- **Loudness:** `ffmpeg-normalize` presets (podcast −16 LUFS, streaming-video −14 LUFS) or `loudnorm` two-pass.
- **Music:** ElevenLabs Music (`music_v2_5`) via the official skill; Suno has no official API or MCP.
- **TTS alternatives:** OpenAI's official `speech` skill (gpt-4o-mini-tts), Gemini TTS via MCP, or local Kokoro-82M / Kokoro-FastAPI / Piper (now GPL, moved to OHF-Voice).

### Cited Findings
**Audacity**
- **xDarkzx/Audacity-MCP**
  - "144 tools spanning effects, cleanup, mastering, transcription… Everything runs locally through Audacity's named pipe interface."
  - **"AudacityMCP works with Audacity 3.x. Audacity 4 removed `mod-script-pipe`… and ships no replacement"**. The companion Audacity4-MCP (159 tools, TCP JSON-RPC) "is early alpha" and needs a source-built Audacity 4 fork (Visual Studio, Qt 6.10, CMake, Ninja).
  - Install for non-Desktop clients: `pip install audacity-mcp-server`, then config `{"command": "audacity-mcp"}`. Transcription needs `pip install faster-whisper`.
  - PyPI `audacity-mcp-server` 0.1.23 (5 Sep 2026). 111★, last commit 8 Oct 2026.
  - Source: [README](https://github.com/xDarkzx/Audacity-MCP); [PyPI](https://pypi.org/project/audacity-mcp-server/); [Audacity4-MCP](https://github.com/xDarkzx/Audacity4-MCP)
- **illia3/MCP-Audacity** merges xDarkzx's and An-3's servers. "The low-level layer is deliberately allow-listed: the server does not expose an arbitrary command or free-form Nyquist execution endpoint". It is tested on Audacity 3.x and is Codex-oriented. Last commit 13 Aug 2026. — [README](https://github.com/illia3/MCP-Audacity)
- Known setup pitfall: on Windows 10, `mod-script-pipe` "loads but no named pipe created". — [Audacity forum](https://forum.audacityteam.org/t/mod-script-pipe-loads-but-no-named-pipe-created-on-windows-10-claude-mcp-integration/152504)

**REAPER**
- **xDarkzx/Reaper-MCP**
  - "181 tools across 26 modules" via a "file-based Lua IPC bridge", REAPER 7+.
  - Install: `pip install xdarkzx-reaper-mcp` (0.8.2, 23 Sep 2026).
  - `REAPER_MCP_PROFILE` trims tools for small models.
  - It includes `analyze_loudness` (LUFS against streaming/broadcast/cinema targets), `analyze_clipping` and `analyze_silence`.
  - 103★, last commit 5 Oct 2026.
  - Source: [README](https://github.com/xDarkzx/Reaper-MCP); [PyPI](https://pypi.org/project/xdarkzx-reaper-mcp/)
- **nickcapron/creaper**
  - "Claude can't hear, so creaper measures the actual audio (loudness, tuning, clarity, the spectrum) and checks its own work". "Every change is a named undo step… Ctrl+Z undoes anything Claude did".
  - Install:
    ```
    pip install https://github.com/nickcapron/creaper/archive/refs/heads/main.zip
    creaper setup
    claude mcp add creaper -- python -m creaper
    ```
  - Requires REAPER 7. Optional extras: `creaper[ml]` (CLAP), `creaper[asr]` (faster-whisper).
  - Created 10 Oct 2026, 0★, last commit 18 Oct 2026.
  - Source: [README](https://github.com/nickcapron/creaper)
- Others:
  - shiehn/total-reaper-mcp: 87★, last commit 3 Aug 2026. — [repo](https://github.com/shiehn/total-reaper-mcp)
  - mthines/reaper-mcp: 5★. — [repo](https://github.com/mthines/reaper-mcp)
  - (secondary) dschuler36/reaper-mcp-server is read-only. — [repo](https://github.com/dschuler36/reaper-mcp-server)

**Stem separation and cleanup**
- facebookresearch/demucs is **archived** (10.4k★): "this repository is not maintained anymore… I've created a fork at github.com/adefossez/demucs". — [facebookresearch/demucs](https://github.com/facebookresearch/demucs)
- The adefossez fork is "the officially maintained Demucs", but "expect slow replies and no new feature".
  - "11/07/2026: Released Demucs v4.1.0 with modernized packaging, lighter inference dependencies… pretrained models hosted on Hugging Face" (PyPI 4.1.0, 11 Jul 2026).
  - Usage: `uvx demucs MY_TRACK.mp3`, `uvx demucs --two-stems=vocals myfile.mp3`, `-n htdemucs_ft` (fine-tuned), `--mp3 --mp3-bitrate`.
  - Source: [README](https://github.com/adefossez/demucs); [PyPI](https://pypi.org/project/demucs/)
- Alternatives: `audio-separator` 0.47.0 (27 Aug 2026; UVR models) — [PyPI](https://pypi.org/project/audio-separator/). Older denoisers are dormant: `deepfilternet` 0.5.6 (Aug 2023) — [PyPI](https://pypi.org/project/deepfilternet/); `noisereduce` 3.0.3 (Oct 2024) — [PyPI](https://pypi.org/project/noisereduce/).
- Cloud cleanup:
  - The ElevenLabs `voice-isolator` skill ("Remove background noise and isolate vocals/speech"). — [elevenlabs/skills](https://github.com/elevenlabs/skills)
  - Adobe `media_enhance_speech`, which needs a CC asset ID. — [adobe-edit-quick-cut SKILL.md](https://github.com/adobe/skills/blob/main/plugins/creative-cloud/adobe-for-creativity/skills/adobe-edit-quick-cut/SKILL.md)

**Loudness normalization**
- FFmpeg `loudnorm` is EBU R128 with single-pass and double-pass modes. Defaults: `I=-24.0`, `LRA=7.0`, `TP=-2.0`. "In dynamic mode… the audio stream will be upsampled to 192 kHz. Use the `-ar` option or `aresample`". — [FFmpeg filters.texi](https://github.com/FFmpeg/FFmpeg/blob/master/doc/filters.texi)
- **ffmpeg-normalize** 1.43.0 (14 Oct 2026; 1.5k★)
  - EBU R128 "Two-pass by default". Run with `uvx ffmpeg-normalize /path/to/file.mp4`.
  - Built-in presets:

    | Preset | Settings |
    |---|---|
    | `podcast` | EBU −16 LUFS, LRA 7, TP −2 |
    | `streaming-video` | EBU −14 LUFS |
    | `music` | RMS −20, batch |

  - `--threshold` skips files already at target.
  - Source: [README](https://github.com/slhck/ffmpeg-normalize); [presets.md](https://github.com/slhck/ffmpeg-normalize/blob/master/docs/usage/presets.md); [preset JSONs](https://github.com/slhck/ffmpeg-normalize/tree/master/src/ffmpeg_normalize/data/presets)
- `pyloudnorm` 0.2.0 (Jan 2026) implements ITU-R BS.1770-4 for measuring loudness in Python. — [PyPI](https://pypi.org/project/pyloudnorm/)

**Music generation**
- The ElevenLabs `music` skill uses `music_v2_5` by default ("most advanced"), with `music_v2`/`music_v1` on request: `client.music.compose(prompt=…, music_length_ms=30000, model_id="music_v2_5")`. It supports lyrics and "composition plans for granular control". Setup is `npx -y @elevenlabs/cli@latest onboard init`. — [music SKILL.md](https://github.com/elevenlabs/skills/blob/main/music/SKILL.md); [npm @elevenlabs/cli 1.6.1](https://www.npmjs.com/package/@elevenlabs/cli)
- (secondary) **No official Suno API or MCP was found.** Third-party wrappers:
  - `@runapi.ai/suno-mcp` (RunAPI key). — [socket.dev](https://socket.dev/npm/package/@runapi.ai/suno-mcp)
  - AceDataCloud `mcp-suno` (`ACEDATACLOUD_API_TOKEN`). — [getdrio](https://www.getdrio.com/mcp/io-github-acedatacloud-mcp-suno); [AceDataCloud/SunoMCP](https://github.com/AceDataCloud/SunoMCP)
  - A browser-automation `suno-mcp`, whose notes say direct API calls fail due to hCaptcha. — [glama](https://glama.ai/mcp/servers/@unforced/suno-mcp/blob/a9ba2aeda1f659cedb0b93e14ceca97826810a81/CLAUDE.md)
- Google Lyria remains available via the GoogleCloudPlatform Genmedia MCP (round 1).

**TTS alternatives**
- **OpenAI official `speech` skill** (openai/skills, curated)
  - "Defaults to `gpt-4o-mini-tts-2025-12-15` and built-in voices, and prefers the bundled CLI (`scripts/text_to_speech.py`)". It supports batch JSONL jobs.
  - The `transcribe` skill defaults to `gpt-4o-mini-transcribe`; diarization uses `gpt-4o-transcribe-diarize` with `diarized_json`.
  - Both require `OPENAI_API_KEY`. The repo targets Codex (`$skill-installer`).
  - Source: [speech SKILL.md](https://github.com/openai/skills/tree/main/skills/.curated/speech); [transcribe SKILL.md](https://github.com/openai/skills/tree/main/skills/.curated/transcribe); [README](https://github.com/openai/skills)
- **Gemini TTS via RLabs-Inc/gemini-mcp**: "Text-to-Speech: 30 unique voices, single speaker or two-speaker dialogues". Install: `claude mcp add gemini -s user -- env GEMINI_API_KEY=YOUR_KEY npx -y @rlabs-inc/gemini-mcp`. 218★, last commit 7 Jul 2026. — [README](https://github.com/RLabs-Inc/gemini-mcp)
- **Kokoro-82M** (hexgrad/kokoro; 9.5k★)
  - "open-weight TTS model with 82 million parameters… Apache-licensed weights".
  - Install: `pip install kokoro>=0.9.4 soundfile` plus `espeak-ng`.
  - PyPI `kokoro` 0.9.4 (Apr 2025; Python <3.13). `kokoro-onnx` 0.6.1 is newer (Aug 2026).
  - Source: [README](https://github.com/hexgrad/kokoro); [PyPI kokoro](https://pypi.org/project/kokoro/); [PyPI kokoro-onnx](https://pypi.org/project/kokoro-onnx/)
- **Kokoro-FastAPI** (remsky; 5.6k★; last commit 14 Oct 2026): "OpenAI-compatible Speech endpoint" with caption timestamps. Run `docker run -p 8880:8880 ghcr.io/remsky/kokoro-fastapi-cpu:latest`, or the GPU image `…-gpu:latest` with `--gpus all`. — [README](https://github.com/remsky/Kokoro-FastAPI)
- **Piper:** rhasspy/piper is **archived** ("Development has moved: https://github.com/OHF-Voice/piper1-gpl"). OHF-Voice/piper1-gpl (5.9k★, last commit 17 Oct 2026) ships `pip install piper-tts` (1.8.0, 4 Sep 2026). The licence changed to GPL. — [rhasspy/piper](https://github.com/rhasspy/piper); [piper1-gpl](https://github.com/OHF-Voice/piper1-gpl); [PyPI piper-tts](https://pypi.org/project/piper-tts/)

**Sound effects**
- The ElevenLabs `sound-effects` skill uses `client.text_to_sound_effects.convert(text="Thunder rumbling in the distance with light rain")` and "supports looping, custom duration, and prompt adherence control". — [sound-effects SKILL.md](https://github.com/elevenlabs/skills/blob/main/sound-effects/SKILL.md)
- Runway's API has a `sound_effect` endpoint (changelog 2.1.0 lists it with `voice_isolation`, `voice_dubbing` and `speech_to_speech`). The legacy `rw-generate-audio` skill wraps it. — [runwayml/skills CHANGELOG](https://github.com/runwayml/skills/blob/main/CHANGELOG.md)
- creaper can "design five variations of a hockey slap shot and export each as a trimmed, mono 24-bit WAV". — [creaper README](https://github.com/nickcapron/creaper)

### Inferences
- **For most video work, skip DAW MCPs.** Do audio in Bash:
  1. `uvx demucs --two-stems=vocals` to separate dialogue from music.
  2. ElevenLabs voice-isolator or Adobe enhance-speech for heavy cleanup.
  3. `uvx ffmpeg-normalize mix.wav --preset podcast` (or `streaming-video` for −14 LUFS).
  4. Verify with `ffmpeg -af loudnorm=print_format=json -f null -`.
- Use Audacity or REAPER MCPs only when a human will keep working in that app.
- Pin Audacity to 3.x for any MCP. The Audacity 4 upgrade silently breaks every `mod-script-pipe` bridge.
- Licensing pitfalls:
  - Piper is now GPL.
  - gifski (Q6) is AGPL.
  - Kokoro's weights are Apache.
  - Suno wrappers go through unofficial resellers or browser automation, which likely conflicts with Suno's terms (not verified).
- Cheapest local voiceover for Claude Code: run Kokoro-FastAPI in Docker and point the OpenAI-style `speech` script or any OpenAI-compatible client at `http://localhost:8880/v1`. This is inferred from "OpenAI-compatible" and was not tested.

### Gaps
- No independent quality comparison of TTS engines (Kokoro, Piper, OpenAI, Gemini, ElevenLabs) was found.
- ElevenLabs Music pricing and length limits were not retrievable (elevenlabs.io unreachable).
- Whether the ElevenLabs hosted MCP exposes a music tool is unclear. The creative-studio skill lists speech, image and video generation plus transcription, but no `creative_*` music tool.
- No official Audacity MCP or remote-control API for Audacity 4 exists, per xDarkzx's README. This was not confirmed against Audacity's own docs.

---

## Q5. Subtitles and transcription toolchain for Claude Code

### Takeaway
- **Plain SRT, CPU-friendly:** whisper.cpp, or the **FFmpeg whisper filter** if your ffmpeg is built with `--enable-whisper`.
- **Fast GPU batch:** faster-whisper.
- **Word-level timestamps and speakers** (needed for animated captions in Remotion or HyperFrames): **WhisperX**.
- **Burn-in:** use libass via `subtitles=…:force_style=` (with `shaping=complex` for RTL/Indic scripts).
- **Translation:** Whisper/FFmpeg translate only *to English*. For other languages, have Claude translate the SRT text, or use ElevenLabs dubbing or HeyGen translate for voice plus lip-sync.

### Cited Findings
- **FFmpeg whisper filter**
  - The "Whisper filter" appeared in the FFmpeg **8.0** changelog. It "requires the whisper.cpp library… enabled using: `./configure --enable-whisper`".
  - Options:

    | Option | Meaning |
    |---|---|
    | `model` | Path to the whisper.cpp model (mandatory) |
    | `language` | Language code, or `auto`/`eval`/`lock` for detection |
    | `translate` | "translate the transcription from the source language to English" (needs a multilingual model) |
    | `queue` | Default 3 s; "a large value (e.g. 10-20s) will produce more accurate results" |
    | `use_gpu` | Default true |
    | `destination` | Output file or URL |
    | `format` | `text`, `srt` or `json` |
    | `max_len` | Split segments by word to cap line length |
    | `vad_model` | Silero VAD, e.g. `ggml-silero-v5.1.2.bin`, together with a larger `queue` |

  - Example:
    ```
    ffmpeg -i input.mp4 -vn -af "whisper=model=../whisper.cpp/models/ggml-base.en.bin:language=en:queue=3:destination=output.srt:format=srt" -f null -
    ```
  - Source: [FFmpeg filters.texi](https://github.com/FFmpeg/FFmpeg/blob/master/doc/filters.texi); [FFmpeg Changelog](https://github.com/FFmpeg/FFmpeg/blob/master/Changelog)
- **faster-whisper** (SYSTRAN; 26.0k★; PyPI 1.2.1, 31 Oct 2025; last commit 16 Oct 2026): "up to 4 times faster than openai/whisper for the same accuracy while using less memory". Benchmark: 13 min of audio, large-v2, RTX 3070 Ti, CUDA 12.4.

  | Implementation | Time |
  |---|---|
  | openai/whisper fp16 | 2m23s |
  | whisper.cpp (Flash Attention) | 1m05s |
  | faster-whisper fp16 | 1m03s |
  | faster-whisper `batch_size=8` | 17s |
  | faster-whisper int8 batch 8 | 16s (4500 MB) |
  | CPU: whisper.cpp | 2m05s |
  | CPU: faster-whisper fp32 batch 8 | 1m06s |

  Source: [README](https://github.com/SYSTRAN/faster-whisper)
- **WhisperX** (m-bain; 24.7k★; PyPI 3.8.6, 25 May 2026; last commit 18 Oct 2026)
  - Speed: "70x realtime with large-v2", "requires <8GB gpu memory for large-v2 with beam_size=5".
  - Timestamps and speakers: "Accurate word-level timestamps using wav2vec2 alignment", and speaker diarization via pyannote, which needs `--hf_token` and accepting the model agreement.
  - Install: `pip install whisperx` or `uvx whisperx`. Optional `whisperx[fast]` (Numba) gives "30×–100×" faster alignment. GPU use needs CUDA 12.8.
  - Usage: `whisperx path/to/audio.wav --model large-v2 --diarize --highlight_words True`; on CPU/macOS `--compute_type int8 --device cpu`; `--interleaved_context` for technical vocabulary.
  - Limitations: "words which do not contain characters in the alignment models dictionary e.g. '2014.' or '£13.60' cannot be aligned"; overlapping speech is handled poorly; "Diarization is far from perfect"; a language-specific wav2vec2 model is needed.
  - Source: [README](https://github.com/m-bain/whisperX); [PyPI](https://pypi.org/project/whisperx/)
- whisper.cpp: 54.5k★, last updated 19 Oct 2026. — [ggml-org/whisper.cpp](https://github.com/ggml-org/whisper.cpp)
- `stable-ts` 2.19.1 (Aug 2025) "Modifies OpenAI's Whisper to produce more reliable timestamps". — [PyPI](https://pypi.org/project/stable-ts/)
- Cloud ASR with diarization:
  - OpenAI `transcribe` skill (`gpt-4o-transcribe-diarize`). — [openai/skills transcribe](https://github.com/openai/skills/tree/main/skills/.curated/transcribe)
  - ElevenLabs `speech-to-text` skill ("Scribe v2"). — [elevenlabs/plugin README](https://github.com/elevenlabs/plugin)
- **Burn-in (ASS styling)**
  - The `subtitles` filter draws "using the libass library" and needs `--enable-libass`.
  - Options:
    - `force_style` overrides "default style… ASS style format `KEY=VALUE` couples separated by ','". Example: `subtitles=sub.srt:force_style='Fontname=DejaVu Serif,PrimaryColour=&HCCFF0000'`.
    - `fontsdir` points at a font directory.
    - `original_size` is "necessary to correctly scale the fonts if the aspect ratio has been changed".
    - `shaping=complex` is "Required for correct rendering of complex scripts such as Arabic, Hebrew, Devanagari and Thai".
    - `wrap_unicode` needs libass ≥0.17.0 with libunibreak.
  - Source: [FFmpeg filters.texi](https://github.com/FFmpeg/FFmpeg/blob/master/doc/filters.texi)
- **Translation and dubbing**
  - HeyGen `heygen-translate`: "translated and dubbed version with voice cloning and lip-sync. 175+ languages". — [heygen-com/skills README](https://github.com/heygen-com/skills)
  - ElevenLabs `dubbing` skill: "Dub audio/video into other languages while preserving the original speakers' voices". — [elevenlabs/skills](https://github.com/elevenlabs/skills)
  - YouTube caption upload via youtube-uploader-mcp needs the `youtube.force-ssl` scope (see Q6). — [README](https://github.com/anwerj/youtube-uploader-mcp)

### Inferences
- **Default recipe for Claude Code:**
  1. `uvx whisperx in.wav --model large-v3 --highlight_words True` on GPU, or `--compute_type int8 --device cpu`, to get word-level JSON and SRT.
  2. Feed the JSON to Remotion `Caption[]` or HyperFrames captions.
  3. For a static burn-in, convert to ASS (or use `force_style`) and apply `subtitles=` last in the filter chain (video-use rule, round 1).
  4. Model names other than large-v2 were not checked against WhisperX docs.
- **Numbers and currency get no WhisperX timing.** Ask Claude to interpolate the missing word timings or to spell numbers out in the transcript before alignment.
- **FFmpeg whisper filter caveat:** the options `language=lock|eval`, `translate` and `max_len` are in the current `master` docs and may not exist in 8.0 builds. Check `ffmpeg -h filter=whisper` first. Most distro or Homebrew ffmpeg builds are probably not compiled with `--enable-whisper` (unverified), so whisper.cpp's `whisper-cli` remains the portable choice.
- **Auto-translation:** Claude can translate SRT/ASS text while preserving timestamps (cheap, no extra tool). Re-run line-length checks, since translated lines get longer. Use ElevenLabs or HeyGen only when you need dubbed audio.

### Gaps
- No head-to-head accuracy (WER) data for whisper.cpp vs faster-whisper vs WhisperX on the same audio was found, beyond faster-whisper's own speed table.
- The FFmpeg release that first shipped the newer whisper options (`lock`/`eval`, `max_len`, `translate`) was not determined.
- No maintained Claude Code skill dedicated to subtitle styling or translation was found.

---

## Q6. Letting Claude "watch" video, AI presenters/avatars, YouTube upload/metadata, and GIF best practice

### Takeaway
- **Video understanding:** The official **TwelveLabs Claude Code plugin** (index, search, Pegasus 1.5 analysis up to 1–2 h) is the only vendor-maintained option. Gemini-based MCPs are community-built; RLabs `gemini-mcp` is maintained and includes YouTube analysis. Frame sampling plus transcript (video-use's method) remains the cheapest default.
- **Avatars:** HeyGen is the only official avatar option, as skills plus a hosted MCP at `https://mcp.heygen.com/mcp/v1/` with a verified `claude mcp add` command. Synthesia has no official MCP.
- **YouTube upload:** Community `youtube-uploader-mcp` (OAuth, captions, thumbnails, scheduling).
- **GIF:** gifski, or ffmpeg `palettegen`/`paletteuse`. HyperFrames renders GIF natively.

### Cited Findings
**Video understanding**
- **TwelveLabs official plugin**
  - Install: `export TWELVELABS_API_KEY=…`, then `/plugin marketplace add twelvelabs-io/twelve-labs-claude-code-plugin` and `/plugin install twelvelabs@twelvelabs-plugins`. "You may need to restart Claude Code".
  - It bundles MCP, commands, skills and hooks.
  - Analysis limits: `/twelvelabs:sync-analyze` uses Pegasus 1.5 ("Cap: ≤1 hour video"); `/twelvelabs:async-analyze` handles "up to 2 hours" and supports `time_based_metadata` and `jsonSchema`.
  - Other features: `/twelvelabs:index-video` (local file, URL or Google Drive), `/twelvelabs:search` (text, image or entity), `/twelvelabs:embed`, entity collections ("find exactly when and where a specific person appears").
  - The MCP runs locally: `npx -y --package twelvelabs-mcp twelvelabs-mcp-stdio`. npm `twelvelabs-mcp` 1.0.0, 12 May 2026.
  - Plugin v1.3.0. 25★, last commit 15 May 2026.
  - Source: [README](https://github.com/twelvelabs-io/twelve-labs-claude-code-plugin); [.mcp.json](https://github.com/twelvelabs-io/twelve-labs-claude-code-plugin/blob/main/.mcp.json); [npm](https://www.npmjs.com/package/twelvelabs-mcp)
- (secondary) TwelveLabs' hosted MCP moved to `mcp-alpic.twelvelabs.io`, with the old address retired 15 Jul 2026. — [TwelveLabs MCP blog](https://twelvelabs.io/blog/twelve-labs-mcp-server); [TwelveLabs docs](https://docs.twelvelabs.io/docs/advanced/model-context-protocol)
- **Pitfall:** npm `twelvelabs-mcp-server` (micro-JAY) is "MCP server for ElevenLabs Conversational AI API (not affiliated with TwelveLabs video platform)". — [npm](https://www.npmjs.com/package/twelvelabs-mcp-server)
- **RLabs-Inc/gemini-mcp**
  - Install: `claude mcp add gemini -s user -- env GEMINI_API_KEY=YOUR_KEY npx -y @rlabs-inc/gemini-mcp`.
  - Features include "YouTube Analysis: Analyze videos by URL with timestamp clipping" (tool `gemini-youtube`), Veo video generation (`gemini-generate-video`, async 1–5 min) and TTS.
  - 218★, last commit 7 Jul 2026.
  - Source: [README](https://github.com/RLabs-Inc/gemini-mcp)
- **ugarchance/mcp-gemini-video-understanding** is a one-day project (0★, last commit 11 Oct 2025): abandoned. It notes "Files >20MB automatically use Gemini's File API". — [README](https://github.com/ugarchance/mcp-gemini-video-understanding)
- Google's official `google-gemini/gemini-skills` (last commit 13 Oct 2026) ships `gemini-api-dev`, `gemini-live-api-dev` and `gemini-omni-flash-api` skills. These help Claude write Gemini API code, including video input, rather than act as a video MCP. — [gemini-skills](https://github.com/google-gemini/gemini-skills)
- Frame-sampling building blocks:
  - OBS-MCP returns source screenshots as MCP images and has `obs-contact-sheet`. — [OBS-MCP README](https://github.com/Tom-R-Main/OBS-MCP)
  - kdenlive-editing-mcp renders frames back for comparison. — [README](https://github.com/tiagovignatti/kdenlive-editing-mcp)
  - Yusuke710's Manim skill extracts the exact frame referenced in feedback with `ffmpeg -ss`. — [SKILL.md](https://github.com/Yusuke710/manim-skill/blob/main/skills/manim-skill/SKILL.md)

**AI presenters / avatars**
- **HeyGen official skills** (`heygen-com/skills`, v3.2.0, 13 May 2026; 502★; last commit 14 Jul 2026)
  - Skills: `heygen-avatar` ("Photo → persistent digital twin (face + voice)"), `heygen-video` ("Idea → script → prompt-engineered video") and `heygen-translate`.
  - Install: `gh skill install heygen-com/skills heygen-avatar` (GitHub CLI v2.90+), or `git clone --single-branch --depth 1 https://github.com/heygen-com/skills.git ~/.claude/skills/heygen-skills`.
  - CLI: `curl -fsSL https://static.heygen.ai/cli/install.sh | bash`.
  - Hosted MCP: **`claude mcp add --transport http heygen https://mcp.heygen.com/mcp/v1/`** ("The first call triggers an OAuth consent flow").
  - Billing: "CLI mode bills against your HeyGen API usage (separately metered). MCP mode consumes your existing HeyGen plan credits". "If `HEYGEN_API_KEY` is set, CLI wins."
  - Source: [README](https://github.com/heygen-com/skills); [.mcp.json](https://github.com/heygen-com/skills/blob/master/.mcp.json)
- The repo's `.claude-plugin/marketplace.json` defines plugin `heygen` (v1.3.2) with `/heygen:avatar`, `/heygen:video`, `/heygen:translate`. — [marketplace.json](https://github.com/heygen-com/skills/blob/master/.claude-plugin/marketplace.json)
- The older `heygen-com/heygen-mcp` repo could not be cloned in this session (removed or renamed). A glama listing described it as "in early development… official support is limited" (secondary). — [glama](https://glama.ai/mcp/servers/@heygen-com/heygen-mcp/blob/d1d90e1f6a58a9a60901118704a051dc0804432f/README.md)
- (secondary) **Synthesia:** no official MCP found. There is a community MCP described as a "Phase 1 MVP" whose renders default to drafts, with Synthesia's API enterprise-tier on most plans, and Zapier offers a hosted Synthesia MCP. — [glama listing](https://glama.ai/mcp/servers/xwsno5or6d); [Zapier](https://zapier.com/mcp/synthesia)
- The Runway Dev MCP can "manage real-time avatars" (Characters). — [runwayml/skills README](https://github.com/runwayml/skills)

**YouTube upload and metadata**
- **anwerj/youtube-uploader-mcp** (Go)
  - Features: "Direct Uploads", "AI-Assisted Metadata", "OAuth2 Authentication… multi-channel", privacy and scheduling.
  - `update_video` can add videos to playlists, set custom thumbnails (<2MB), attach subtitles and schedule.
  - Install: a one-line `curl … install.sh | bash` that sets up `client_secret.json` from Google Cloud Console.
  - Subtitle upload "relies on the `https://www.googleapis.com/auth/youtube.force-ssl` scope… [older tokens] will fail with a 403 Forbidden".
  - 59★, last commit 20 Sep 2026.
  - Source: [README](https://github.com/anwerj/youtube-uploader-mcp)
- The official-marketplace `postiz` plugin covers scheduling and media upload "across 28+ platforms including… YouTube, TikTok, Instagram". — [marketplace.json](https://github.com/anthropics/claude-plugins-official/blob/main/.claude-plugin/marketplace.json)
- `yt-dlp` 2026.8.19 for downloading reference footage or YouTube captions. — [PyPI](https://pypi.org/project/yt-dlp/)

**GIF creation**
- **gifski** (5.7k★; AGPL-3)
  - Install: `brew install gifski` or `cargo install gifski`.
  - Usage: `ffmpeg -i video.mp4 -f yuv4mpegpipe - | gifski -o anim.gif -`.
  - Tips: "Use `--width` and `--height` to make the animation smaller. This makes the biggest difference", and `--quality=80`. "gifski may automatically downsize the video if it has resolution too high for a GIF".
  - Source: [README](https://github.com/ImageOptim/gifski)
- FFmpeg palette route: generate with `palettegen`, then `ffmpeg -i input.mkv -i palette.png -lavfi paletteuse output.gif`. — [FFmpeg filters.texi](https://github.com/FFmpeg/FFmpeg/blob/master/doc/filters.texi)
- HyperFrames renders GIF directly: `--format gif` (also `mp4`, `webm`, `mov`, `png-sequence`, `hls`) and `--gif-loop` (0 = forever). — [HyperFrames CLI docs](https://github.com/heygen-com/hyperframes/blob/main/docs/packages/cli.mdx)
- awesome-mcp-servers lists `ananddtyagi/gif-creator-mcp` ("Create GIFs from videos") among a long tail of multimedia MCPs. Official vendor servers in that list include `TopazLabs/topaz-mcp` (upscaling, denoising, sharpening). — [awesome-mcp-servers](https://github.com/punkpeye/awesome-mcp-servers)

### Inferences
- **Watching video:**
  - Default to transcript plus sampled frames, using the round-1 video-use approach or `ffmpeg -vf "fps=1/5,scale=320:-1,tile=4x4"` contact sheets that Claude reads as images.
  - Add TwelveLabs when you need semantic search across a library ("find every shot with the red car") or long-video Q&A.
  - Add RLabs gemini-mcp for quick YouTube-URL questions.
  - Uploading footage to TwelveLabs or Google sends content to third parties, so check data policies.
- **Avatars:** Use the HeyGen hosted MCP if you already pay for a HeyGen plan (plan credits). Use `HEYGEN_API_KEY` plus the CLI for CI or agents (separate API billing). Don't set both unless you want CLI behaviour.
- **YouTube:** Treat any upload MCP as high-risk.
  - Restrict Google OAuth scopes and test on a private or unlisted video first.
  - Don't let Claude publish publicly without confirmation; a PreToolUse hook on the upload tool works for this.
  - Review the `curl | bash` installer before running it.
- **GIF:**
  - Keep GIFs short and small: about 480–800 px wide, 10–15 fps (inferred from gifski's size advice).
  - Prefer MP4/WebM where the platform allows.
  - Use gifski for quality, or ffmpeg palettes when AGPL is a concern.

### Gaps
- No official Gemini "video understanding" MCP from Google was found. Google's offerings are the Genmedia MCP (round 1, generation-focused) and API skills.
- TwelveLabs pricing, indexing speed and the current hosted-MCP URL were not verifiable from primary pages.
- No official YouTube (Google) MCP for uploads was found, and no reliability reports exist for youtube-uploader-mcp.
- Synthesia's own docs were not reachable, so absence of an official MCP is not fully confirmed.
