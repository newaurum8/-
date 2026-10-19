# Claude Code skills, plugins and MCP servers for video editing, montage and motion graphics (state as of 19 Oct 2026)

Method note: GitHub's search API was blocked in this research session, so repositories were checked by reading their README/SKILL.md files from raw.githubusercontent.com. Star counts come from the github.com repo pages (rounded, read 19 Oct 2026). Last-commit dates come from each repo's `commits/<branch>.atom` feed. Anything taken only from directories or blogs (glama.ai, mcpservers.org, playbooks.com, PyPI listings, secondary blogs) is marked "secondary/unverified".

### Quick shortlist (details and sources in the sections below)

| Category | Pick | Maintainer | Install (verbatim from README/docs) | Stars / last commit (19 Oct 2026) | Status |
|---|---|---|---|---|---|
| Programmatic video (React) | Remotion Agent Skills | Remotion (official) | `npx skills add remotion-dev/skills` or `npx remotion skills add` | skills repo 5.4k stars, last commit 16 Oct 2026; Remotion 65.2k stars | Active; Remotion MCP **deprecated** |
| Programmatic video (HTML) | HyperFrames | HeyGen (official, Apache-2.0) | `claude plugin marketplace add heygen-com/hyperframes` then `claude plugin install hyperframes@hyperframes` (or `npx skills add heygen-com/hyperframes`) | 67.3k stars, last commit 19 Oct 2026 (v0.8.175) | Very active |
| Programmatic video (TS generators) | Revideo / Motion Canvas | redotvideo / motion-canvas (community OSS) | `npm init @revideo@latest` | 4.1k stars, last commit 15 Jul 2026 / 19.4k stars, last commit 2 Jul 2026 | Maintained, slower; no official agent skill found |
| Agentic footage editing (skill) | video-use | Browser Use | clone + `ln -sfn ~/Developer/video-use ~/.claude/skills/video-use` | 29.3k stars, last commit 8 Oct 2026 | Active, young (23 commits); needs ElevenLabs key |
| Silence cutting (CLI + skill) | auto-editor | WyattBlue | `npx skills add WyattBlue/auto-editor` | 5.6k stars, 2,577 commits | Mature |
| FFmpeg MCP | Kinocut (formerly mcp-video) | KyaniteLabs | `claude mcp add kinocut -- uvx --from kinocut kino --mcp` | 211 stars, v1.16.1 (5 Oct 2026) | Active |
| FFmpeg MCP (minimal) | ffmpeg-mcp | PedroMarianoAlmeida | `npm install -g ffmpeg-mcp-server` | n/a | Small, sandboxed |
| DaVinci Resolve | davinci-resolve-mcp | samuelgursky (community) | `npx davinci-resolve-mcp setup` | 3.6k stars, v4.14.4, last commit 19 Oct 2026 | Most mature NLE MCP; needs Resolve **Studio** |
| Premiere Pro | Adobe_Premiere_Pro_MCP | hetpatel-11 (community) | `npm install -g adobe-premiere-pro-mcp` + `premiere-pro-mcp --install-cep` | 724 stars, last commit 13 Oct 2026 | CEP production, UXP experimental |
| After Effects | after-effects-mcp | Dakkshin (community) | `npm install`, `npm run build`, `npm run install-bridge` | 765 stars, last commit 1 Apr 2026 | Basic; ExtendScript panel |
| CapCut / Jianying | VectCutAPI (formerly CapCutAPI) | sun-guannan | clone, Python 3.10+ | 2.3k stars, last commit 16 Oct 2026 | Active; tied to VectCut cloud |
| Voiceover | ElevenLabs hosted MCP | ElevenLabs (official) | remote `https://api.elevenlabs.io/v1/mcp` (OAuth) | local repo deprecated | Use hosted |
| Gen-video aggregators | fal MCP / Replicate MCP | fal / Replicate (official, hosted) | `mcp.fal.ai/mcp`; `claude mcp add replicate https://mcp.replicate.com/sse --transport sse --scope user` | hosted | Active |
| Veo / Lyria / TTS | MCP Servers for Google Cloud Genmedia | GoogleCloudPlatform (official samples) | `curl -sL .../install-online.sh \| bash` | n/a | Active, "experiments" |

---

## Q1. What do the official Remotion skills contain, how do you install them in Claude Code, and what's the recommended workflow? (plus HyperFrames, Revideo, Motion Canvas)

### Takeaway
Remotion has an official set of 12 Agent Skills (`remotion-dev/skills`, version-locked to Remotion 4.0.536). Install them with `npx skills add remotion-dev/skills` or `npx remotion skills add`. They replace the deprecated Remotion MCP. The workflow they encode is: keep `npx remotion studio` open for live preview, write compositions with `useCurrentFrame()`/`interpolate()`, and only run `npx remotion render` when the user explicitly asks. The serious newer alternative is HeyGen's HTML-based HyperFrames (67.3k stars, Apache-2.0, ships a first-class Claude Code plugin). Companies above the size limit must budget for Remotion's paid Company License.

### Cited Findings
**Remotion Agent Skills: install and contents**
- Install command: `npx skills add remotion-dev/skills`. You are also offered skills when you create a project with `bun create video`. The skills are aimed at "AI agents like Claude Code, Codex, Kimi Code or Cursor". — [remotion-dev/skills README](https://github.com/remotion-dev/skills); [Remotion docs: Agent Skills](https://www.remotion.dev/docs/ai/skills)
- There is also a CLI subcommand: `npx remotion skills add` and `npx remotion skills update`. "Skills are installed to the `.agents/skills` directory in your project. Claude Code compatibility is provided by symlinking `.claude/skills` to `.agents/skills`." — [Remotion docs: npx remotion skills](https://www.remotion.dev/docs/cli/skills)
- The 12 skills are `/remotion-best-practices` (a router that "encompasses all other skills"), `/remotion-create`, `/remotion-markup` (compositions, animations, layout, typography, media, effects, audio, fonts, timing), `/remotion-studio`, `/remotion-render`, `/remotion-maps` (Mapbox/MapLibre/MapTiler/GeoJSON/CesiumJS), `/remotion-captions`, `/remotion-saas`, `/remotion-interactivity`, `/remotion-docs` (searches the docs and fetches any page as Markdown), `/remotion-upgrade` and `/remotion-multimedia` (Mediabunny metadata, trimming and cropping). — [remotion-dev/skills README](https://github.com/remotion-dev/skills)
- Example prompts from the official docs: `/remotion-create Make a promo video for a record store`, `/remotion-markup Create an animated title card using Inter.`, `/remotion-maps Animate a route from Los Angeles to New York and make the camera follow it.`, `/remotion-docs How to set up Remotion Lambda?` — [Remotion docs: Agent Skills](https://www.remotion.dev/docs/ai/skills)
- Repository signals: 5.4k stars, 592 forks, 90 commits. The README is generated from the monorepo at `packages/skills`. The skills are versioned with Remotion (`"version": "4.0.536"`). Last commit was 16 Oct 2026 ("Update template"). — [GitHub page](https://github.com/remotion-dev/skills); [package.json](https://github.com/remotion-dev/skills/blob/main/package.json); [commits feed](https://github.com/remotion-dev/skills/commits/main.atom). The main Remotion repo has 65.2k stars and 5.2k forks. — [remotion-dev/remotion](https://github.com/remotion-dev/remotion)

**Workflow rules encoded in the router skill (`remotion-best-practices/SKILL.md`)**
- "Don't render the video by default unless they are very explicit. They want to instead see an interactive preview. As soon as the project can run, start Studio and open the preview…" Commands: `npx remotion studio`, or `npx remotion studio --no-open` for agents that have an in-app browser. You can reach a composition at `http://localhost:3000/[composition-id]`. "The Studio supports WebMCP tools." — [remotion-best-practices SKILL.md](https://github.com/remotion-dev/remotion/blob/main/packages/skills/skills/remotion-best-practices/SKILL.md)
- "Only render if the user is very explicit… E.g. 'Render the video', 'Export', 'Give me the MP4'." Use `npx remotion render`. The router also says: "Preserve user changes… If you detect a surprising change… don't overwrite it." — [same SKILL.md](https://github.com/remotion-dev/remotion/blob/main/packages/skills/skills/remotion-best-practices/SKILL.md)
- The render skill covers `npx remotion render`, `npx remotion still`, and multi-frame image export for checks: `npx remotion render [composition-id] out/frames --frames=0,30,90 --image-format=png`. It also has a separate transparent-videos guide. — [remotion-render SKILL.md](https://github.com/remotion-dev/remotion/blob/main/packages/skills/skills/remotion-render/SKILL.md)
- Studio flags: `--log=<level>`, `--port=<number>`, `--force-new`. — [remotion-studio SKILL.md](https://github.com/remotion-dev/remotion/blob/main/packages/skills/skills/remotion-studio/SKILL.md)
- Core API guidance from Remotion's own LLM system-prompt example: "Use useCurrentFrame() and useVideoConfig() from 'remotion'"; "Prefer interpolate() with Easing over spring() unless physics-based motion is explicitly requested"; "prefer scale, translate, rotate over transform strings". Remotion also publishes a general system prompt at `remotion.dev/system-prompt.txt` and warns about "context rot". — [Remotion docs: Generate Remotion Code using LLMs](https://www.remotion.dev/docs/ai/generate)

**Captions (`/remotion-captions`)**
- "All captions must be processed in JSON" using the `Caption` type from `@remotion/captions`: `{text, startMs, endMs, timestampMs, confidence, pageBreakAfter?}`. There are sub-guides for transcribing, displaying, and importing `.srt`. — [remotion-captions SKILL.md](https://github.com/remotion-dev/remotion/blob/main/packages/skills/skills/remotion-captions/SKILL.md)
- The current skill transcribes with `@remotion/whisper-webgpu`: `npx remotion add @remotion/whisper-webgpu @huggingface/transformers mediabunny @mediabunny/server`. Caveat: "A compatible GPU is required. ONNX Runtime does not work on Linux arm64." — [transcribe-captions.md](https://github.com/remotion-dev/remotion/blob/main/packages/skills/skills/remotion-captions/transcribe-captions.md)
- Display requires `npx remotion add @remotion/captions`. — [display-captions.md](https://github.com/remotion-dev/remotion/blob/main/packages/skills/skills/remotion-captions/display-captions.md)
- The older CPU route, `@remotion/install-whisper-cpp` (available from v4.0.115), is still documented. Its example installs Whisper.cpp `1.5.5` and the `medium.en` model, using `installWhisperCpp`, `downloadWhisperModel`, `transcribe` and `toCaptions`. — [Remotion docs: @remotion/install-whisper-cpp](https://www.remotion.dev/docs/install-whisper-cpp)

**Remotion MCP is deprecated**
- "The Remotion MCP is deprecated. Install Remotion Agent Skills and use `/remotion-docs` instead. The hosted MCP will shut down no earlier than August 31, 2026." The stated reasons: data less current than the docs, Remotion pays the token costs, "agents do not invoke them reliably", and it duplicates `/remotion-docs`. To migrate, remove `remotion-documentation` from your MCP config and run `npx remotion skills add`. — [Remotion docs: MCP (deprecated)](https://www.remotion.dev/docs/ai/mcp)
- AI-ready docs: append `.md` to any docs URL, or send `Accept: text/markdown`. "Paste any Remotion doc link into Claude Code… and they'll automatically fetch the markdown version." — [Remotion docs: Building with Remotion and AI](https://www.remotion.dev/docs/ai)

**Remotion licensing**
- The Free License covers individuals, "for-profit organization with up to 3 employees", non-profits, and evaluation. Commercial video creation is allowed for these. Everyone else "required to obtain a Company License" (see remotion.pro/license). It is not allowed to resell a derivative of Remotion. "In Remotion 5.0, the license will slightly change" (PR #3750). — [Remotion LICENSE.md](https://github.com/remotion-dev/remotion/blob/main/LICENSE.md)

**HyperFrames (HeyGen), the HTML-to-video alternative**
- "open-source framework for turning HTML, CSS, media, and seekable animations into deterministic MP4 videos". It is Apache-2.0 and requires Node.js 22+ and FFmpeg. — [heygen-com/hyperframes README](https://github.com/heygen-com/hyperframes)
- Claude Code install: `claude plugin marketplace add heygen-com/hyperframes` then `claude plugin install hyperframes@hyperframes`, invoked as `/hyperframes:hyperframes`. For standalone skills use `npx skills add heygen-com/hyperframes`; "the Core Skills group is all you need". Agents and non-interactive runs should use `npx hyperframes skills update`, because `skills add` "resolves the skills.sh registry blob, which can lag `main` by hours". — [README](https://github.com/heygen-com/hyperframes)
- It ships 21 skills, including the router `/hyperframes`, creation workflows (`/product-launch-video`, `/faceless-explainer`, `/pr-to-video`, `/embedded-captions`, `/talking-head-recut`, `/motion-graphics`, `/music-to-video`, `/slideshow`, `/general-video`, `/remotion-to-hyperframes`), and domain skills (`/hyperframes-core`, `/hyperframes-animation` (GSAP/Lottie/Three.js/Anime.js/CSS/WAAPI), `/hyperframes-keyframes`, `/hyperframes-creative`, `/media-use`, `/hyperframes-cli`, `/hyperframes-audio`, `/hyperframes-registry`, `/figma`). — [README](https://github.com/heygen-com/hyperframes)
- CLI loop: `npx hyperframes init my-video`, `npx hyperframes preview`, `npx hyperframes render`. Further commands are `lint`, `check`, `snapshot`, `doctor`, `cloud render` (hosted by HeyGen) and `lambda deploy/render` (AWS). Example prompt: "Using `/hyperframes`, create a 10-second product intro with a fade-in title, a background video, and subtle background music." — [README](https://github.com/heygen-com/hyperframes)
- Signals: 67.3k stars, 6.1k forks, about 5,700 commits. Last commits were on 19 Oct 2026 ("chore: release v0.8.175"). — [GitHub page](https://github.com/heygen-com/hyperframes); [commits feed](https://github.com/heygen-com/hyperframes/commits/main.atom). It was open-sourced on 17 Apr 2026 (secondary). — [noqta.tn](https://noqta.tn/en/blog/heygen-hyperframes-html-to-mp4-ai-agent-video-2026)

**Revideo and Motion Canvas**
- Revideo: "rendering engine for creating videos in code… A scene is plain TypeScript, so Claude or Codex can produce one from a prompt." It is a generator-function scene API (`makeScene2D`, `yield*`), with headless `renderVideo()` that runs on serverless platforms such as Cloud Run. Start with `npm init @revideo@latest`. It is "the engine behind Midrender". — [redotvideo/revideo README](https://github.com/redotvideo/revideo). 4.1k stars; last commit 15 Jul 2026. — [GitHub](https://github.com/redotvideo/revideo); [commits feed](https://github.com/redotvideo/revideo/commits/main.atom)
- Motion Canvas: a TypeScript generator-based animation library plus a real-time preview editor, "designed to create informative vector animations and synchronize them with voice-overs". — [motion-canvas README](https://github.com/motion-canvas/motion-canvas). 19.4k stars; last commit 2 Jul 2026 ("refactor(docs): update domain"). — [GitHub](https://github.com/motion-canvas/motion-canvas); [commits feed](https://github.com/motion-canvas/motion-canvas/commits/main.atom)

### Inferences
- For Claude Code in Oct 2026, pick Remotion when the team knows React or needs `<Player>`/Lambda/SaaS integration. Pick HyperFrames when you want HTML/GSAP, a zero-license-cost Apache-2.0 stack, or the ready-made agent workflows (product launch, captions, PR-to-video). HyperFrames also avoids Remotion's company-license question entirely.
- After `npx skills add remotion-dev/skills`, run `/remotion-upgrade` or `npx remotion skills update` whenever you bump Remotion. The skills are version-pinned to the Remotion release, and a mismatch risks outdated API advice.
- Revideo and Motion Canvas work with Claude Code as plain TypeScript projects, but neither has an official skill pack that I could verify. You would need to write your own `.claude/skills/<name>/SKILL.md` with the API conventions.
- Cheap visual verification in Remotion: render a few stills (`--frames=0,30,90`) and have Claude Read the PNGs, rather than rendering the full MP4 every iteration.

### Gaps
- Whether the hosted Remotion MCP has actually shut down after 31 Aug 2026 was not confirmed. Its status is tracked in [remotion issue #9055](https://github.com/remotion-dev/remotion/issues/9055).
- I found no reliable render-time benchmarks for Remotion or HyperFrames on typical hardware, and no exact Company License pricing (remotion.pro was not reachable).
- The exact Remotion 5.0 license changes (PR #3750) were not read.
- No official Motion Canvas or Revideo Agent Skill was found. Absence is not fully confirmed because GitHub search was blocked.

---

## Q2. Which FFmpeg MCP servers / skills are the most reliable? Is it better to let Claude just call ffmpeg via Bash vs. using an MCP?

### Takeaway
For most Claude Code work, Bash plus `ffmpeg`/`ffprobe` plus a skill (instructions and helper scripts) beats a generic FFmpeg MCP. Anthropic calls CLI tools "the most context-efficient" option, Remotion retired its MCP because agents invoked it unreliably, and the best-performing agentic editor (video-use, 29.3k stars) is a skill, not an MCP. If you want typed guardrails, Kinocut (formerly mcp-video) is the most active FFmpeg MCP. auto-editor (CLI plus an official skill) is the standard tool for silence cutting.

### Cited Findings
**Bash/CLI vs MCP**
- Claude Code docs: "CLI tools are the most context-efficient way to interact with external services… Claude is also effective at learning CLI tools it doesn't already know. Try prompts like `Use 'foo-cli-tool --help' to learn about foo tool`." They also say: "Most best practices are based on one constraint: Claude's context window fills up fast." — [Claude Code best practices](https://code.claude.com/docs/en/best-practices)
- Remotion deprecated its MCP partly because "Installing MCP servers is difficult, and agents do not invoke them reliably" and it "duplicates the `/remotion-docs` skill". — [Remotion docs: MCP (deprecated)](https://www.remotion.dev/docs/ai/mcp)
- The vendor case for MCP: Kinocut pitches "typed tools and Video Receipts — not invented FFmpeg flags", plus quality gates. This is a vendor claim, not an independent comparison. — [KyaniteLabs/kinocut README](https://github.com/KyaniteLabs/kinocut)
- No Reddit or HN comparison thread surfaced in search. Directory listings note that natural-language FFmpeg MCPs "may struggle with precise parameter tuning" (secondary). — [playbooks.com: Video Editor (FFmpeg) MCP](https://playbooks.com/mcp/kush36agrawal-video-editor)

**FFmpeg MCP servers (verified READMEs)**
- **Kinocut** (KyaniteLabs, formerly mcp-video): "Guardrailed video editing MCP server… Local-first FFmpeg tools, Video Receipts, quality gates, Hyperframes, and Shorts/Reels repurposing". It is Apache-2.0, Python 3.11+, with 203 MCP tools and 177 CLI commands; v1.16.1 was published 5 Oct 2026. Claude Code install: `claude mcp add kinocut -- uvx --from kinocut kino --mcp`. Check setup with `uvx --from kinocut kino doctor`. Optional extras: `pip install "kinocut[transcribe]"` (Whisper, about 1 GB torch), `[stems]` (demucs), `[upscale]`, `[image]`, `[audio]`. Hyperframes tools need Node 22+. Upgrading from mcp-video: `pip install --upgrade 'mcp-video==1.6.16'`. — [README](https://github.com/KyaniteLabs/kinocut). 211 stars, 1,611 commits. — [GitHub](https://github.com/KyaniteLabs/kinocut)
- **ffmpeg-mcp** (PedroMarianoAlmeida): `npm install -g ffmpeg-mcp-server`. It bundles `ffmpeg-static`. It has 6 tools: `cut_video`, `image_to_video`, `concat_videos`, `convert`, `remove_silence`, `ffmpeg_raw`. All I/O is confined to `FFMPEG_MCP_WORKSPACE`. `ffmpeg_raw` "does not accept filters, forced formats, or arbitrary FFmpeg flags", which is safe but limiting. — [README](https://github.com/PedroMarianoAlmeida/ffmpeg-mcp)
- **video-audio-mcp** (misbahsy): a broad Python FFmpeg toolset (trim, `add_subtitles`, `add_b_roll`, transitions, silence removal), but it has 89 stars and its last commit was 24 May 2025, so it is **stale**. — [README](https://github.com/misbahsy/video-audio-mcp); [GitHub](https://github.com/misbahsy/video-audio-mcp); [commits feed](https://github.com/misbahsy/video-audio-mcp/commits/main.atom)
- Others, from directories only (secondary/unverified): Kush36Agrawal/Video_Editor_MCP (a single `execute_ffmpeg` tool), bitscorp `mcp-ffmpeg` (npm/Smithery), kevinwatt/ffmpeg-mcp-lite. — [jsDelivr README mirror](https://cdn.jsdelivr.net/gh/kush36agrawal/video_editor_mcp@master/README.md); [npm mcp-ffmpeg](https://www.npmjs.com/package/mcp-ffmpeg)

**Skills and CLIs for FFmpeg-style editing**
- **auto-editor** (WyattBlue) is a CLI that "automatically edit[s] video and audio by analyzing… most notably audio loudness". It ships an official skill: `npx skills add WyattBlue/auto-editor`. The default is `--edit audio:threshold=0.04,stream=all`. Padding: `--margin 0.2sec` (default) or `--margin 0.3s,1.5sec`. Motion cuts: `--edit motion:threshold=0.02`. Combined: `--edit "(or audio:0.03 motion:0.06)"`. Units in dB: `--edit audio:-19dB`. Preview what would be cut: `--when-active cut --when-inactive nil`. NLE export: `--export premiere`, `--export resolve`, `--export final-cut-pro`, `--export shotcut`, `--export kdenlive`, `--export clip-sequence`. Public domain (Unlicense); written in Nim. — [README](https://github.com/WyattBlue/auto-editor). 5.6k stars, 692 forks, 2,577 commits. — [GitHub](https://github.com/WyattBlue/auto-editor)
- **video-use** (Browser Use) is a skill for Claude Code: "Drop raw footage in a folder, chat with Claude Code, get `final.mp4` back." It cuts filler words and dead space, auto color grades, adds 30 ms audio fades, burns subtitles, and generates overlays via HyperFrames, Remotion, Manim or PIL "in parallel sub-agents". It "Self-evaluates the rendered output at every cut boundary". Transcription uses ElevenLabs Scribe, with word-level timestamps and diarization, so an ElevenLabs API key is required. Manual install: `git clone https://github.com/browser-use/video-use ~/Developer/video-use` and `ln -sfn ~/Developer/video-use ~/.claude/skills/video-use`, then `uv sync` and `brew install ffmpeg`. — [README](https://github.com/browser-use/video-use). 29.3k stars, 3.5k forks, 23 commits; last commit 8 Oct 2026. — [GitHub](https://github.com/browser-use/video-use); [commits feed](https://github.com/browser-use/video-use/commits/main.atom)
- video-use's "Hard Rules" double as a good checklist for any ffmpeg pipeline:
  - Subtitles go last in the filter chain.
  - Extract each segment, then concat losslessly with `-c copy`, to avoid double-encoding.
  - Add 30 ms fades at every boundary: `afade=t=in:st=0:d=0.03,afade=t=out:st={dur-0.03}:d=0.03`.
  - Shift overlays with `setpts=PTS-STARTPTS+T/TB`.
  - Put the master SRT on output-timeline offsets.
  - Never cut inside a word.
  - Pad cut edges by 30–200 ms, because "Scribe timestamps drift 50–100ms".

  — [video-use SKILL.md](https://github.com/browser-use/video-use/blob/main/SKILL.md)
- **claude-code-video-toolkit** (digitalsamba, MIT) is a Claude Code workspace. Start with `git clone https://github.com/digitalsamba/claude-code-video-toolkit.git`, `uv sync`, `claude`, then `/setup` and `/video`. It uses open models (Qwen3-TTS, FLUX.2, ACE-Step) on your own cloud GPU (Modal or RunPod). Requires Node 18+. — [README](https://github.com/digitalsamba/claude-code-video-toolkit). 2.3k stars, 294 commits. — [GitHub](https://github.com/digitalsamba/claude-code-video-toolkit)

**Subtitles and scene detection building blocks**
- FFmpeg 8.0 added a "Whisper filter", so in-ffmpeg transcription is possible. The changelog already lists 8.1 and 9.0 sections. — [FFmpeg Changelog](https://github.com/FFmpeg/FFmpeg/blob/master/Changelog)
- whisper.cpp: `./build/bin/whisper-cli -m models/ggml-base.en.bin -f samples/jfk.wav`. Note: "whisper-cli… currently runs only with 16-bit WAV files, so make sure to convert your input". — [ggml-org/whisper.cpp README](https://github.com/ggml-org/whisper.cpp)
- PySceneDetect: `pip install scenedetect --upgrade`; `scenedetect -i video.mp4 split-video`, `save-images`, `time -s 10s`. — [Breakthrough/PySceneDetect README](https://github.com/Breakthrough/PySceneDetect)

### Inferences
- Recommended default: plain Bash `ffmpeg`/`ffprobe` + auto-editor + whisper.cpp (or the FFmpeg ≥8 whisper filter) + PySceneDetect, with a project skill or CLAUDE.md that encodes your house rules. video-use's hard rules are a ready template. Add Kinocut only if you want typed and sandboxed tools, for example in unattended runs or when you don't want Claude improvising complex `filter_complex` graphs.
- Avoid stale or minimal MCPs (misbahsy, single-`execute_ffmpeg` servers). They add context cost without adding knowledge beyond what Claude already has about ffmpeg via Bash.
- Pitfall: whisper.cpp needs 16 kHz mono 16-bit WAV. Run `ffmpeg -i in.mp4 -ar 16000 -ac 1 -c:a pcm_s16le in.wav` first. The command is standard ffmpeg usage, inferred from whisper.cpp's WAV requirement.

### Gaps
- Star count and last-commit date for PedroMarianoAlmeida/ffmpeg-mcp were not fetched. Last-commit dates for auto-editor were not fetched either.
- No independent benchmark compares MCP and Bash reliability for ffmpeg; the arguments above are vendor claims plus Anthropic/Remotion guidance.
- I could not verify whether there is a well-maintained standalone "ffmpeg" skill on skills.sh, because skills.sh was not searched successfully.

---

## Q3. Which NLE MCP integrations (DaVinci Resolve, Premiere, After Effects, CapCut, FCP/Kdenlive/Blender) actually work, what are their requirements, and how mature are they?

### Takeaway
Maturity ranking:
1. **DaVinci Resolve MCP** (samuelgursky) is clearly the most mature: 3.6k stars, released 19 Oct 2026, 37 compound / 390 granular tools, live-tested. It requires **Resolve Studio**, because external scripting is Studio-only and Resolve 21.1 closed the free-edition workaround.
2. **Premiere** has a usable community MCP (hetpatel-11, 283 tools) that depends on the **CEP** panel; UXP is still experimental.
3. **After Effects** MCPs are basic, ExtendScript panel-based, and only intermittently maintained.
4. **CapCut** is reachable via VectCutAPI drafts.
5. **FCP/Kdenlive** MCPs exist but are young and verified only through directories.

Adobe's official "Adobe for creativity" connector is a hosted claude.ai connector that includes Premiere tools. It is not desktop timeline control.

### Cited Findings
**DaVinci Resolve: samuelgursky/davinci-resolve-mcp (community, MIT)**
- What it is: "lets AI assistants control DaVinci Resolve Studio through the official Scripting API". It covers editing, media pool, render setup, review markers, grading, Fusion and Fairlight. Badges: version 4.14.4, "MCP Tools 37 (390 full)", "Live Tested 93.6%", Resolve 18.5+, Python 3.10+. — [README](https://github.com/samuelgursky/davinci-resolve-mcp)
- Install: `npx davinci-resolve-mcp setup`, or from source: `git clone https://github.com/samuelgursky/davinci-resolve-mcp.git`, `cd davinci-resolve-mcp`, `python install.py`. Before connecting, set **Preferences > General > External scripting using → Local**. — [README](https://github.com/samuelgursky/davinci-resolve-mcp)
- Free edition: "Blackmagic gates *external* scripting to Studio." The in-app bridge (`python scripts/install_resolve_bridge.py`, then Workspace > Scripts > resolve_bridge) works through Resolve 21.0.x. However, "**Resolve 21.1 moved Python scripting to Studio.**" The author calls the bridge "a supported-until-it-is-not tier". On macOS Resolve only finds Python via `PYTHON3HOME` or `/usr/local/bin/python3`; the fix is `launchctl setenv PYTHON3HOME …`, which does not survive a reboot. — [README](https://github.com/samuelgursky/davinci-resolve-mcp)
- Modes: compound `src/server.py` (37 tools, recommended to keep context low) and full `--full` (390 tools). There is an optional Node "advanced (offline)" server with 18 tools and a local control panel at `venv/bin/python -m src.control_panel`. Destructive API calls are refused with `known_limitation` notes; for example `TimelineItem.CopyGrades` is blocked. Tested against Resolve 19.1.3 Studio, 20.3.2 Studio, 21.0.2 Studio and 21.0.3 free (via the bridge). — [README](https://github.com/samuelgursky/davinci-resolve-mcp)
- Example prompt from the README: "Build a ProRes 422 HQ render plan, validate the settings, and queue the job". — [README](https://github.com/samuelgursky/davinci-resolve-mcp)
- Signals: 3.6k stars, 440 forks, 1,142 commits; last commit 19 Oct 2026 ("bump version to 4.14.4"). — [GitHub](https://github.com/samuelgursky/davinci-resolve-mcp); [commits feed](https://github.com/samuelgursky/davinci-resolve-mcp/commits/main.atom)

**Premiere Pro**
- **hetpatel-11/Adobe_Premiere_Pro_MCP** (community; "MCP Bridge for Adobe Premiere Pro"): 283 tools behind `search_tools`/`invoke_tool`. "CEP is the supported production bridge; UXP remains experimental." Install: `npm install -g adobe-premiere-pro-mcp` then `premiere-pro-mcp --install-cep`; `--doctor` checks the setup. Then restart Premiere, open `Window > Extensions > MCP Bridge (CEP)`, and run `verify_premiere_connection`. Claude Code plugin, run from a clone: `/plugin marketplace add .` then `/plugin install premiere-pro-mcp@adobe-premiere-pro-mcp`. It needs Premiere Pro 2020+ and is "actively used and tested on Premiere Pro 26.0". `PREMIERE_MCP_TOOLSET=full` lists every tool. The `.mcpb` bundle is unsigned. The README has a Telemetry section. — [README](https://github.com/hetpatel-11/Adobe_Premiere_Pro_MCP). 724 stars, 136 forks, 169 commits; last commit 13 Oct 2026. — [GitHub](https://github.com/hetpatel-11/Adobe_Premiere_Pro_MCP); [commits feed](https://github.com/hetpatel-11/Adobe_Premiere_Pro_MCP/commits/main.atom)
- **morim3/mcp_adobe_premiere** (UXP): "currently in active development and is not ready for production use". Requires Premiere Pro Beta 25.3+ and the UXP Developer Tool. — [README](https://github.com/morim3/mcp_adobe_premiere)
- nguyenph88/Premiere-Pro-MCP (UXP, reportedly verified on Premiere 26.2.2, requires 25.6+) is secondary/unverified: its raw README was not found at main/master. — [search summary of directory listings](https://glama.ai/mcp/servers/@hetpatel-11/Adobe_Premiere_Pro_MCP)

**After Effects**
- **Dakkshin/after-effects-mcp**: composition, layer and animation tools via an ExtendScript panel. Prerequisites are AE 2022+ and Node 14+. Install: `npm install`, `npm run build`, `npm run install-bridge`, then in AE open "Window > mcp-bridge-auto.jsx" with "Auto-run commands" enabled. It documents a `.mcp.json` config for Claude Code. — [README](https://github.com/Dakkshin/after-effects-mcp). 765 stars, 139 forks, 31 commits; last commit 1 Apr 2026. — [GitHub](https://github.com/Dakkshin/after-effects-mcp); [commits feed](https://github.com/Dakkshin/after-effects-mcp/commits/main.atom)
- Aodaruma/adobe-mcp-rs (Rust; AE plus experimental Premiere) is secondary/unverified. — [GitHub link from search](https://github.com/Aodaruma/adobe-mcp-rs)

**Adobe official (hosted)**
- "Adobe for creativity" is a Claude connector launched 28 Apr 2026 with 50+ tools across Photoshop, Illustrator, Firefly, Express, Premiere, Lightroom, InDesign and Stock. It requires a Creative Cloud subscription. Sources are secondary and the Premiere coverage is thin. — [weandthecolor.com](https://weandthecolor.com/how-does-the-adobe-for-creativity-connector-work-in-claude/210357); [godberrystudios.com review](https://godberrystudios.com/posts/claude-for-creative-work-9-connectors-tested-2026/). No official Adobe MCP controlling desktop Premiere or After Effects timelines was found. — [usecarly.com](https://www.usecarly.com/blog/adobe-mcp/)

**CapCut / Jianying**
- **VectCutAPI** (sun-guannan; previous name CapCutAPI): "a **toA (toAgent)** video editing tool" with API and MCP for draft management, multi-track editing, keyframes, subtitles (SRT), effects and stickers. It can "Export projects as drafts to import into CapCut or Jianying" and render in the cloud. Requires Python 3.10+, Jianying or CapCut International, and FFmpeg. — [README](https://github.com/sun-guannan/VectCutAPI). 2.3k stars, 484 forks; last commit 16 Oct 2026. — [GitHub](https://github.com/sun-guannan/VectCutAPI); [commits feed](https://github.com/sun-guannan/VectCutAPI/commits/main.atom)

**Final Cut Pro / Kdenlive / Blender (secondary/unverified unless noted)**
- FCP: `fcp-mcp` (dreliq9) installs via `pipx install fcp-mcp`. It has 88 tools for FCPXML editing and live control on macOS. — [PyPI fcp-mcp](https://pypi.org/project/fcp-mcp/). DareDev256/fcpxml-mcp-server: FCPXML generation, 48 stars. — [enterprisedna listing](https://enterprisedna.co/directories/mcp/daredev256-fcpxml-mcp-server)
- Kdenlive: Va1bhav512/kdenlive-mcp-server (36 tools, wraps cli-anything-kdenlive) and CatCut (Windows, offline). — [glama](https://glama.ai/mcp/servers/Va1bhav512/kdenlive-mcp-server); [PyPI catcut](https://pypi.org/project/catcut). auto-editor can also export Kdenlive, FCP and Resolve timelines (verified). — [auto-editor README](https://github.com/WyattBlue/auto-editor)
- Blender: ahujasid/blender-mcp is now "MCP for Blender". Install with `claude mcp add blender uvx mcp-for-blender` and `uvx mcp-for-blender install-addon`. It exposes "Code execution" (Blender Python), so it can drive the VSE via bpy, but it is built for 3D scenes. — [README](https://github.com/ahujasid/blender-mcp)

### Inferences
- If you own Resolve Studio, the Resolve MCP is the only NLE integration mature enough for real editing (timeline assembly from markers, render queue, review markers). Start in compound mode to save context.
- With the free Resolve, or for any NLE, the most robust path is often to cut in Bash with auto-editor or ffmpeg and hand over an XML/EDL (`--export resolve|premiere|final-cut-pro`). That avoids fragile live-app bridges.
- Premiere and After Effects bridges depend on Adobe's CEP/ExtendScript, which Adobe is phasing toward UXP. Expect breakage on Premiere version bumps, and pin versions.

### Gaps
- No star or last-commit data was gathered for fcp-mcp, the Kdenlive servers, adobe-mcp-rs, nguyenph88/Premiere-Pro-MCP, or blender-mcp.
- Adobe's own documentation for the "Adobe for creativity" connector, including which Premiere operations it supports, could not be read (primary pages were not fetched).
- No first-hand reliability reports (Reddit/HN) on the Premiere or After Effects MCPs were found.

---

## Q4. Which AI video/audio generation MCPs usable from Claude Code are real and maintained (Runway, Luma, Kling, Veo, ElevenLabs, fal, Replicate)?

### Takeaway
Use the hosted official servers:
- **ElevenLabs** at `https://api.elevenlabs.io/v1/mcp` (OAuth). The local `elevenlabs-mcp` is deprecated.
- **fal** at `mcp.fal.ai/mcp`, which also reaches Kling, Veo, LTX and others.
- **Replicate** at `mcp.replicate.com`.
- **Google's Genmedia MCP servers** for Veo 3.1, Lyria, Chirp and Gemini TTS.

Avoid the **Runway** MCP repo (archived) and the **Luma** MCP repo (stale since April 2025). I found no official Kling MCP.

### Cited Findings
- **ElevenLabs**: the local MCP README says "**This local MCP server is deprecated in favor of the ElevenLabs hosted MCP server.** The hosted server is available at `https://api.elevenlabs.io/v1/mcp`… It authenticates with OAuth… This repository is no longer actively maintained." The legacy local install was `uvx` / `pip install elevenlabs-mcp` with `ELEVENLABS_API_KEY`, and "ElevenLabs credits are needed". — [elevenlabs/elevenlabs-mcp README](https://github.com/elevenlabs/elevenlabs-mcp)
- **Runway**: "This repository has been archived." It used `RUNWAYML_API_SECRET` and needed a Runway API developer account with billing. — [runwayml/runway-api-mcp-server README](https://github.com/runwayml/runway-api-mcp-server)
- **Luma**: setup via `sh setup.sh` with an API key; models "ray-2", "ray-flash-2", "ray-1-6". Last commit 18 Apr 2025 ("mcp is cool"), so it is **stale**. — [lumalabs/luma-api-mcp README](https://github.com/lumalabs/luma-api-mcp); [commits feed](https://github.com/lumalabs/luma-api-mcp/commits/main.atom)
- **Google Veo/Lyria/TTS**: "MCP Servers for Google Cloud Genmedia APIs" (Go) cover Veo 3 and 3.1, Gemini Omni (video with audio), Gemini Image ("Nano Banana"), Gemini TTS, Chirp 3 HD, Lyria, and AVTool for compositing. Install: `curl -sL https://raw.githubusercontent.com/GoogleCloudPlatform/genmedia-creative-studio/main/experiments/mcp-genmedia/mcp-genmedia-go/install-online.sh | bash`. Auth is via ADC (`gcloud auth application-default login`), with env vars `PROJECT_ID`, `LOCATION` and `GENMEDIA_BUCKET`. Bundled Agent Skills include `genmedia-video-editor`, `genmedia-producer` and `install-mcp-genmedia`. It lives under `experiments/`. — [mcp-genmedia README](https://github.com/GoogleCloudPlatform/vertex-ai-creative-studio/tree/main/experiments/mcp-genmedia)
- **fal**: the official hosted MCP at `mcp.fal.ai/mcp` uses HTTP transport with the fal API key as a Bearer `Authorization` header. It offers model search, schema, inference, uploads and docs, with tools such as `search_models`, `run_model` and `submit_job`. These details are secondary; fal.ai was unreachable for direct verification. — [fal docs (via search)](https://fal.ai/docs/documentation/setting-up/mcp); [hackmd guide](https://hackmd.io/@BASHCAT/SJdT43O3bx). A community alternative is raveenb/fal-mcp-server (local, `FAL_KEY`), which reaches Kling, Veo, Sora and LTX. — [glama](https://glama.ai/mcp/servers/raveenb/fal-mcp-server)
- **Replicate**: the official hosted MCP is at mcp.replicate.com. Claude Code setup: `claude mcp add replicate https://mcp.replicate.com/sse --transport sse --scope user`, then `/mcp` to authenticate. This is secondary (from a search summary of Replicate docs). deepfates/mcp-replicate is an older community experiment. — [Replicate docs: MCP](https://replicate.com/docs/reference/mcp); [Replicate blog](https://replicate.com/blog/remote-mcp-server)

### Inferences
- Probable Claude Code command for ElevenLabs hosted MCP: `claude mcp add --transport http elevenlabs https://api.elevenlabs.io/v1/mcp`, then complete OAuth via `/mcp`. This is inferred from the generic `claude mcp add --transport http <name> <url>` syntax in the [Claude Code docs](https://code.claude.com/docs/en/best-practices) and has not been verified against ElevenLabs docs.
- For Kling, Veo, LTX, Wan and similar models, an aggregator MCP (fal or Replicate) is simpler than per-vendor servers. Generation is paid per call, so set budgets.
- For voiceover inside video projects, video-use and HyperFrames' `/media-use` already integrate TTS/ASR. A separate MCP is only needed for ad-hoc generation.

### Gaps
- fal and ElevenLabs official pages were not reachable (DNS failure in this session), so their exact Claude Code commands are not quoted from a primary source.
- I did not find an official Kling MCP server or a current official Luma MCP, and pricing for the generation APIs was not researched.

---

## Q5. Practical end-to-end workflows (talking-head cleanup, product promo, vertical social cuts, b-roll) and how Claude can verify results

### Takeaway
Use Bash and skills, and close the loop with machine-readable checks: `ffprobe` metadata, extracted frames or filmstrips that Claude reads as images, Remotion `--frames` stills, and HyperFrames `snapshot`/`check`/`lint`. Give Claude the transcript as text rather than "watching" video. Apply this to talking-head cleanup (auto-editor or video-use, then captions), product promos (Remotion `/remotion-create` or HyperFrames `/product-launch-video`), vertical cuts (HyperFrames or Kinocut Shorts/Reels), and b-roll assembly (video-use or the Resolve MCP).

### Cited Findings
- Verification principle: "Give Claude a check it can run: tests, a build, a screenshot to compare… Have Claude show evidence rather than asserting success." A Stop hook or `/goal` can gate completion. — [Claude Code best practices](https://code.claude.com/docs/en/best-practices)
- video-use verification design: "The LLM never watches the video. It **reads** it". Layer 1 is the packed transcript (about 12 KB for all takes). Layer 2 is `timeline_view`, a filmstrip, waveform and word-label PNG produced on demand. "Naive approach: 30,000 frames × 1,500 tokens = 45M tokens of noise." The pipeline is "Transcribe → Pack → LLM Reasons → EDL → Render → Self-Eval", with re-render capped at 3 attempts. — [video-use README](https://github.com/browser-use/video-use)
- video-use workflow: `cd /path/to/your/videos`, `claude`, then "edit these into a launch video". It "inventories the sources, proposes a strategy, waits for your OK, then produces `edit/final.mp4`" and persists memory in `project.md`. — [video-use README](https://github.com/browser-use/video-use)
- Remotion promo workflow: run `/remotion-create Make a promo video for a record store`. Studio opens immediately for preview, and you render only on an explicit ask. Check visuals via `npx remotion render [composition-id] out/frames --frames=0,30,90 --image-format=png`. — [Remotion docs: Agent Skills](https://www.remotion.dev/docs/ai/skills); [remotion-render SKILL.md](https://github.com/remotion-dev/remotion/blob/main/packages/skills/skills/remotion-render/SKILL.md)
- Remotion captions workflow: transcribe with `@remotion/whisper-webgpu` (GPU required) or `@remotion/install-whisper-cpp`, convert to the `Caption[]` JSON, and display with `@remotion/captions`. — [remotion-captions SKILL.md](https://github.com/remotion-dev/remotion/blob/main/packages/skills/skills/remotion-captions/SKILL.md)
- HyperFrames workflows: `/product-launch-video` (from a URL or brief, "sweet spot 30-90s"), `/embedded-captions` ("Adding captions / subtitles to an existing talking-head video"), `/talking-head-recut` (lower-thirds, callouts, PiP), `/motion-graphics` ("MP4 or transparent overlay"). The CLI has `lint`, `check`, `snapshot`, `preview` and `render`. — [HyperFrames README](https://github.com/heygen-com/hyperframes)
- Silence-removal first pass: `auto-editor talk.mp4 --margin 0.2sec`. Review what would be cut with `--when-active cut --when-inactive nil`. To finish in an NLE, use `--export resolve` or `--export premiere`. — [auto-editor README](https://github.com/WyattBlue/auto-editor)
- Vertical/social: Kinocut advertises "Shorts/Reels repurposing" and quality gates. — [Kinocut README](https://github.com/KyaniteLabs/kinocut). Adobe's connector reportedly handles "resizing a video for Reels" (secondary). — [weandthecolor.com](https://weandthecolor.com/how-does-the-adobe-for-creativity-connector-work-in-claude/210357)
- B-roll and NLE finishing: the Resolve MCP covers media pool organization, editing, review markers and render queues. — [davinci-resolve-mcp README](https://github.com/samuelgursky/davinci-resolve-mcp). misbahsy's `add_b_roll` tool exists but the server is stale. — [video-audio-mcp README](https://github.com/misbahsy/video-audio-mcp)

### Inferences
**Talking-head cleanup recipe (Bash)**
1. Normalize the source: `ffprobe -v error -show_streams -of json in.mp4`.
2. Cut silence: `auto-editor in.mp4 --margin 0.15s,0.25s -o cut.mp4`.
3. Extract audio for whisper.cpp: `ffmpeg -i cut.mp4 -ar 16000 -ac 1 -c:a pcm_s16le cut.wav`.
4. Transcribe: `whisper-cli -m ggml-base.en.bin -f cut.wav -osrt`.
5. Burn captions last: `ffmpeg -i cut.mp4 -vf "subtitles=cut.wav.srt" -c:a copy out.mp4`.

The flags are standard usage and should be checked with `--help`. Prefer word-level timestamps if captions are to be animated (as in Remotion/HyperFrames).

**Vertical cut recipe:** `ffmpeg -i in.mp4 -vf "crop=ih*9/16:ih,scale=1080:1920" -c:a copy vertical.mp4`. Or author natively at 1080×1920 in Remotion or HyperFrames.

**Verification loop to put in CLAUDE.md or a skill:**
- After each render, run `ffprobe` on duration, codec, resolution and fps, and assert the values.
- Extract frames at cut points and key moments, for example `ffmpeg -ss <t> -i out.mp4 -frames:v 1 check_<t>.png`, or a contact sheet with `ffmpeg -i out.mp4 -vf "fps=1/5,scale=320:-1,tile=4x4" sheet.png`. Have Claude Read the PNGs.
- Check audio for pops and levels with `ffmpeg -i out.mp4 -af loudnorm=print_format=json -f null -`.

**Codec pitfalls:**
- Deliver H.264 with `-pix_fmt yuv420p` and `-movflags +faststart` for social platforms.
- Use ProRes 4444 or WebM VP9 for alpha overlays. Remotion and HyperFrames each have transparent-output docs.
- Avoid re-encoding in each step (video-use rule 2).

**Long renders:** run them in the background (Claude Code `run_in_background`), and use cloud render options (Remotion Lambda, HyperFrames `cloud render`/`lambda`) for batch jobs.

### Gaps
- No primary-source, end-to-end case studies with timing data (render minutes per output minute) were found for Remotion, HyperFrames or video-use.
- The ffmpeg command lines in Inferences are standard usage, but they were not executed in this session (ffmpeg was not tested). Verify them locally.
- No Reddit/HN or YouTube walkthroughs were retrievable (several blog domains such as tella.com failed DNS), so community sentiment is not represented.
