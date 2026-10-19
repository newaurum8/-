# Advanced Claude Code usage for visual/creative work (frontend, SVG, video, 3D): hooks, subagents, CLAUDE.md, custom skills, image input, headless automation, permissions — state as of Claude Code v2.1.303 (Oct 2026)

Method note. Every Claude Code config key, event name and CLI flag below was checked against the current official docs. The docs were downloaded as raw Markdown (`https://code.claude.com/docs/en/<page>.md`) on 2026-10-19 and read in the relevant sections: hooks, hooks-guide, sub-agents, memory, skills, settings, settings-reference, permissions, permission-modes, headless, cli-reference, github-actions, common-workflows, best-practices, interactive-mode, tools-reference, scheduled-tasks, worktrees, goal, chrome, model-config, plugin-evals, plugins/host-marketplace and plugins/marketplace-reference. Platform docs (vision, agent-skills best practices), the skill-creator `SKILL.md` from anthropics/skills, and the claude-code-action README/docs were fetched raw too. playwright.dev and docs.blender.org were unreachable from the research environment (DNS block), so Playwright and Blender CLI flags come from search-result summaries and are marked. Domain commands for SVGO, resvg and Remotion are reused from the earlier domain notes (`research_notes/Скилы Claude фронтенд SVG видео 3D/svg.md`, `video.md`) or verified from the Remotion docs source.

Labels used below: **[verified]** means the key or syntax appears verbatim in the official docs. **[composed]** means a snippet I assembled from verified primitives that has not been run end to end. **[unverified]** means a domain flag I couldn't confirm in a primary source this session.

The earlier report covered install mechanics and the "render → look → fix" principle. These notes build on it and do not repeat it.

---

## 1. Hooks for automatic verification (lint/format/typecheck, SVG→PNG render, screenshots after frontend edits, Remotion validation)

### Takeaway
Put verification that must happen every time in `PostToolUse` hooks (matcher `Edit|Write`) and in `Stop` hooks, inside `.claude/settings.json`. A hook reports failures back to Claude in one of two ways: exit `2` with the message on stderr, or exit `0` with JSON `{"decision":"block","reason":…}` or `hookSpecificOutput.additionalContext`. A hook cannot send an image to Claude. The working pattern is for the hook to render a PNG and pass its *path* in `additionalContext`, with CLAUDE.md telling Claude to Read the preview. Keep slow work (full `tsc`, renders) in `async`/`asyncRewake` hooks or in a once-per-turn `Stop` hook, never in a blocking hook on every edit.

### Cited Findings
**Where hooks live, structure, matchers**
- Hook locations: `~/.claude/settings.json` (all projects), `.claude/settings.json` (project, committable), `.claude/settings.local.json` (project, gitignored), managed policy, plugin `hooks/hooks.json`, skill frontmatter, subagent frontmatter. "Hook entries merge across settings levels rather than replacing each other" — [Hooks reference](https://code.claude.com/docs/en/hooks)
- Config has three levels: event → matcher group → hook handlers. Five handler types: `command`, `http`, `mcp_tool`, `prompt`, `agent` ("Agent hooks are experimental") — [Hooks reference](https://code.claude.com/docs/en/hooks)
- Matcher rules: `"*"`, `""` or omitted matches all. A value of only letters, digits, `_`, `-`, spaces, `,` and `|` is an exact string or list, so `Edit|Write` and `Edit, Write` each match either tool exactly. Any other character makes it an unanchored JavaScript regex (`Edit.*` also matches `NotebookEdit`; use `^Edit$`). "Matchers are case-sensitive" — [Hooks reference](https://code.claude.com/docs/en/hooks); [Hooks guide](https://code.claude.com/docs/en/hooks-guide)
- For tool events the matcher filters `tool_name`. MCP tools are `mcp__<server>__<tool>`, and the matcher for a whole server needs `.*` (`mcp__memory__.*`). Plugin-bundled MCP tools are `mcp__plugin_<plugin-name>_<server-name>__<tool>` — [Hooks reference](https://code.claude.com/docs/en/hooks)
- The per-handler `if` field takes one permission rule such as `"Bash(git *)"` or `"Edit(*.ts)"`. It is evaluated only on tool events and has no `&&`/`||`. A single-segment directory pattern like `"Edit(src/**)"` matches only `src` in the working directory; use `"Edit(**/src/**)"` for any depth (behavior changed in v2.1.214). "Because the `if` filter is best-effort, use the permission system rather than a hook to enforce a hard allow or deny" — [Hooks reference](https://code.claude.com/docs/en/hooks)
- Command-hook fields: `command`, `args` (exec form, no shell), `async`, `asyncRewake` ("runs in the background and wakes Claude on exit code 2"), `shell`, `onFailure` (`"continue"`/`"block"`, v2.1.295+). Common fields: `type`, `if`, `timeout` (defaults: 600 s for `command`/`http`/`mcp_tool`, 30 s `prompt`, 60 s `agent`), `statusMessage`, `once` (honored only in skill frontmatter) — [Hooks reference](https://code.claude.com/docs/en/hooks)
- Path placeholders: `${CLAUDE_PROJECT_DIR}`, `${CLAUDE_PLUGIN_ROOT}`, `${CLAUDE_PLUGIN_DATA}`. "Prefer exec form for any hook that references a path placeholder. In shell form, wrap each placeholder in double quotes." `${CLAUDE_PROJECT_DIR}` stays at the session root when Claude enters a worktree, while the input JSON's `cwd` follows Claude — [Hooks reference](https://code.claude.com/docs/en/hooks)
- Hook input (stdin JSON) carries `session_id`, `prompt_id`, `transcript_path`, `cwd`, `scratchpad_dir` (v2.1.257+), `permission_mode`, `effort`, `hook_event_name`, plus event fields. `PostToolUse` gets `tool_name`, `tool_input` (file paths always absolute), `tool_response`, `tool_use_id` and `duration_ms` — [Hooks reference](https://code.claude.com/docs/en/hooks)
- Hooks from settings and plugins also fire for tool calls made inside subagents, with `agent_id`/`agent_type` in the input — [Hooks reference](https://code.claude.com/docs/en/hooks)

**Feeding errors back to Claude (exit codes and JSON)**
- Exit `0` = success; Claude Code parses stdout as JSON if it is exactly one JSON object. Exit `2` = blocking error. Any other code is a non-blocking error. "Exit code 1 without valid JSON output is a non-blocking error… If your hook is meant to enforce a policy, use `exit 2`" — [Hooks reference](https://code.claude.com/docs/en/hooks)
- `PostToolUse` exit 2: "No [can't block]. Shows stderr to Claude; the tool already ran". "Claude never sees stderr from a hook that exits 0… To surface a warning to Claude from a `PostToolUse`… hook, exit 2 instead" — [Hooks reference](https://code.claude.com/docs/en/hooks)
- `PostToolUse` JSON decision control: `decision: "block"` "adds the `reason` next to the tool result", plus `additionalContext`, `updatedToolOutput` and `classifierContext` (v2.1.236+). The `Bash` output shape is `{stdout, stderr, interrupted, isImage}` — [Hooks reference](https://code.claude.com/docs/en/hooks)
- `additionalContext` is wrapped in a system reminder "next to the tool result" for PreToolUse/PostToolUse/PostToolBatch. `additionalContext`, `systemMessage` and plain stdout are each "capped at 10,000 characters". Text over the cap goes to a file with a 2,000-char preview, and "Claude Code doesn't ask Claude to read the file" — [Hooks reference](https://code.claude.com/docs/en/hooks)
- "Write the text as factual statements rather than imperative system instructions… Text framed as out-of-band system commands can trigger Claude's prompt-injection defenses" — [Hooks reference](https://code.claude.com/docs/en/hooks)
- "Print nothing but the JSON object to stdout"; a shell-profile echo breaks JSON parsing — [Hooks reference](https://code.claude.com/docs/en/hooks); [Hooks guide](https://code.claude.com/docs/en/hooks-guide)
- `Stop`: `decision: "block"` + `reason` keeps Claude working. `hookSpecificOutput.additionalContext` is "Non-error feedback… shown in the transcript as hook feedback rather than a hook error". The input has `stop_hook_active`, `last_assistant_message` and `background_tasks`. An 8-consecutive-continuation cap applies (`CLAUDE_CODE_STOP_HOOK_BLOCK_CAP`) — [Hooks reference](https://code.claude.com/docs/en/hooks)
- `PostToolBatch` fires once after a batch of parallel tool calls, with no matcher and a `tool_calls` array. `decision:"block"` or exit 2 "Stops the agentic loop before the next model call", so use it only for `additionalContext` — [Hooks reference](https://code.claude.com/docs/en/hooks)
- Async: `"async": true` runs in the background. "After the background process exits, Claude Code delivers the `additionalContext` and `systemMessage`… to Claude on the next conversation turn." Async hooks can't block. In `-p` mode Claude Code "kills any async hook still running at teardown". `asyncRewake` exit 2 "wakes Claude immediately even when the session is idle" — [Hooks reference](https://code.claude.com/docs/en/hooks)
- `prompt`/`agent` hooks return `{"ok": true|false, "reason": …}`. On `PostToolUse` a prompt hook's `ok:false` ends the turn by default; set `continueOnBlock: true` to feed the reason back instead. Agent hooks "spawn a subagent that can use tools like Read, Grep, and Glob", run up to 50 turns, and are experimental — [Hooks reference](https://code.claude.com/docs/en/hooks)
- `/goal` is "a built-in shortcut for a session-scoped prompt-based Stop hook" — [Hooks reference](https://code.claude.com/docs/en/hooks); [Goal](https://code.claude.com/docs/en/goal)

**Official examples to build on**
- The Prettier auto-format example: `PostToolUse`, matcher `Edit|Write`, `"command": "jq -r '.tool_input.file_path' | xargs npx prettier --write"`. To reformat files however they change, including via Bash, use `FileChanged` — [Hooks guide](https://code.claude.com/docs/en/hooks-guide)
- The async test-runner example (`run-tests-async.sh`): it reads `.tool_input.file_path`, runs tests, and prints `jq -nc --arg msg "$MSG" '{hookSpecificOutput: {hookEventName: "PostToolUse", additionalContext: $msg}}'` — [Hooks reference](https://code.claude.com/docs/en/hooks)
- A `PostToolUse` `Edit|Write` hook does not run "when a `Bash` command or a process outside Claude Code rewrites the same file". `FileChanged` watches *literal filenames in the working directory* (split on `|`; regexes not useful), and its stderr goes to the user only, with no decision control — [Hooks reference](https://code.claude.com/docs/en/hooks)
- Limitations: command hooks "can't trigger `/` commands or tool calls"; `PostToolUse` "can't undo actions" — [Hooks guide](https://code.claude.com/docs/en/hooks-guide)
- Debug: run `/hooks` (read-only browser of configured hooks), test by piping JSON (`echo '{"tool_name":"Bash","tool_input":{"command":"ls"}}' | ./my-hook.sh`), and use `claude --debug`. Disable all hooks with `"disableAllHooks": true` or `--settings '{"disableAllHooks": true}'` — [Hooks guide](https://code.claude.com/docs/en/hooks-guide); [Hooks reference](https://code.claude.com/docs/en/hooks)
- Workspace trust: interactive sessions hold back settings-file hooks until the folder is trusted. A `-p` or SDK session "treats the folder as trusted, so hooks committed in a repository's `.claude/settings.json` run in a folder you've never trusted" — [Hooks reference](https://code.claude.com/docs/en/hooks)

**Domain commands used in the snippets**
- Remotion: `npx remotion still <serve-url|entry-point>? [<composition-id>] [<output-location>]` with `--frame`. Multiple stills (v4.0.502+): `npx remotion render MyComp out/frames --frames=0,30,90 --image-format=png`. `npx remotion compositions <serve-url|entry-file>?` "Print list of composition IDs" — [Remotion docs: still](https://www.remotion.dev/docs/cli/still) (source: [still.mdx](https://github.com/remotion-dev/remotion/blob/main/packages/docs/docs/cli/still.mdx)); [Remotion docs: compositions](https://www.remotion.dev/docs/cli/compositions)
- SVGO v4: `svgo one.svg -o one.min.svg`, config `svgo.config.mjs`; v4 no longer removes `viewBox`/`<title>` by default. resvg: `resvg in.svg out.png -w 512`; static SVG only, no animation, "No native text rendering" — earlier notes, citing [svgo README](https://github.com/svg/svgo) and [resvg README](https://github.com/linebender/resvg)
- Playwright CLI: `npx playwright screenshot --full-page <url> <file>`, with `--device`, `--color-scheme` and `--wait-for-timeout`. `--viewport-size=800,600` is documented with `open`, and its use with `screenshot` is **[unverified]**; check `npx playwright screenshot --help` — search summary of [Playwright CLI docs](https://playwright.dev/docs/cli) (page not fetched)
- Blender: `-b/--background`; `-f/--render-frame`; "Arguments run in the order given", so `--render-output` must come before `--render-frame` — search summary of [Blender manual: Command Line Arguments](https://docs.blender.org/manual/en/3.0/advanced/command_line/arguments.html). The behavior of `--python-exit-code` was **[unverified]** this session

### Inferences

#### Snippet 1.1 — `.claude/settings.json`: format + lint + typecheck after each edit (frontend) [composed]
```json
{
  "$schema": "https://json.schemastore.org/claude-code-settings.json",
  "hooks": {
    "PostToolUse": [
      {
        "matcher": "Edit|Write",
        "hooks": [
          {
            "type": "command",
            "command": "${CLAUDE_PROJECT_DIR}/.claude/hooks/post-edit-check.sh",
            "args": [],
            "timeout": 60,
            "statusMessage": "prettier + eslint"
          },
          {
            "type": "command",
            "command": "${CLAUDE_PROJECT_DIR}/.claude/hooks/tsc-async.sh",
            "args": [],
            "asyncRewake": true,
            "timeout": 300
          }
        ]
      }
    ]
  }
}
```
`.claude/hooks/post-edit-check.sh` (`chmod +x`):
```bash
#!/usr/bin/env bash
# PostToolUse(Edit|Write): format, then lint the edited file. Errors go back to Claude via exit 2 + stderr.
set -uo pipefail
INPUT=$(cat)
FILE=$(jq -r '.tool_input.file_path // empty' <<<"$INPUT")
[[ -n "$FILE" && -f "$FILE" ]] || exit 0
cd "$CLAUDE_PROJECT_DIR" || exit 0
case "$FILE" in
  *.ts|*.tsx|*.js|*.jsx|*.css|*.scss|*.html|*.json|*.md)
    npx --no-install prettier --write "$FILE" >/dev/null 2>&1 ;;
esac
case "$FILE" in
  *.ts|*.tsx|*.js|*.jsx)
    if ! OUT=$(npx --no-install eslint --max-warnings=0 "$FILE" 2>&1); then
      printf 'ESLint errors in %s:\n%s\n' "$FILE" "$(head -c 8000 <<<"$OUT")" >&2
      exit 2   # PostToolUse: can't undo the edit, but Claude sees stderr and fixes it
    fi ;;
esac
exit 0
```
`.claude/hooks/tsc-async.sh`: a full-project typecheck is too slow to block every edit, so it runs in the background and wakes Claude only on failure:
```bash
#!/usr/bin/env bash
INPUT=$(cat)
FILE=$(jq -r '.tool_input.file_path // empty' <<<"$INPUT")
[[ "$FILE" == *.ts || "$FILE" == *.tsx ]] || exit 0
cd "$CLAUDE_PROJECT_DIR" || exit 0
if ! OUT=$(npx --no-install tsc --noEmit -p . 2>&1); then
  printf 'tsc --noEmit failed after editing %s:\n%s\n' "$FILE" "$(head -n 60 <<<"$OUT")" >&2
  exit 2   # asyncRewake: stderr is delivered to Claude as a system reminder
fi
exit 0
```
- The JSON alternative to exit 2 is `jq -nc --arg r "$OUT" '{decision:"block", reason:$r}'; exit 0`. Use one approach per hook, as the docs advise.
- Prettier rewriting the file right after Claude's edit is the officially documented pattern. Claude Code tracks file state, so the cost is that Claude may re-read the file before its next edit (**inference**).

#### Snippet 1.2 — SVG: optimize + rasterize after each `.svg` write, tell Claude where the PNG is [composed]
```json
{
  "hooks": {
    "PostToolUse": [
      {
        "matcher": "Edit|Write",
        "hooks": [
          { "type": "command", "command": "${CLAUDE_PROJECT_DIR}/.claude/hooks/svg-preview.sh", "args": [], "timeout": 60, "statusMessage": "Rendering SVG preview" }
        ]
      }
    ]
  }
}
```
```bash
#!/usr/bin/env bash
# .claude/hooks/svg-preview.sh — PostToolUse(Edit|Write) for *.svg
set -uo pipefail
INPUT=$(cat)
FILE=$(jq -r '.tool_input.file_path // empty' <<<"$INPUT")
[[ "$FILE" == *.svg && -f "$FILE" ]] || exit 0
OUTDIR=$(jq -r '.scratchpad_dir // empty' <<<"$INPUT"); OUTDIR=${OUTDIR:-"$CLAUDE_PROJECT_DIR/.claude/previews"}
mkdir -p "$OUTDIR"
PNG="$OUTDIR/$(basename "${FILE%.svg}").png"
# Optional: only auto-optimize static icons; animated/interactive SVGs lose IDs/groups under SVGO defaults
if [[ "$FILE" == */icons/* ]]; then
  OUT=$(npx --no-install svgo "$FILE" -o "$FILE" 2>&1) || { echo "SVGO failed on $FILE: $OUT" >&2; exit 2; }
fi
OUT=$(resvg "$FILE" "$PNG" -w 512 2>&1) || { echo "resvg could not render $FILE (malformed SVG?): $OUT" >&2; exit 2; }
jq -nc --arg f "$FILE" --arg p "$PNG" \
  '{hookSpecificOutput:{hookEventName:"PostToolUse",additionalContext:("A 512px-wide PNG render of " + $f + " was written to " + $p + ".")}}'
```
- The context string is a factual statement, per the docs' prompt-injection guidance. The *instruction* "after editing an SVG, Read the preview PNG the hook reports and compare it with the intent" belongs in CLAUDE.md or a skill. Reading the PNG costs visual tokens (§5), so leave the decision to Claude rather than forcing it each time (**inference**).
- If many SVGs are edited in parallel, a `PostToolBatch` hook (no matcher, `tool_calls` array) can render them all once and return one `additionalContext`. Never return `decision:block` from it, because that stops the loop (**inference** from the cited semantics).
- An alternative filter is `"if": "Edit(**/*.svg)"` on the handler. The docs don't state whether an `Edit(...)` `if` rule matches `Write` calls, so filtering by extension in the script is the safer choice (**inference**).

#### Snippet 1.3 — Frontend: one screenshot per turn via a `Stop` hook (not on every edit) [composed]
```json
{
  "hooks": {
    "Stop": [
      { "hooks": [ { "type": "command", "command": "${CLAUDE_PROJECT_DIR}/.claude/hooks/ui-screenshot.sh", "args": [], "timeout": 90, "statusMessage": "Screenshotting UI" } ] }
    ]
  }
}
```
```bash
#!/usr/bin/env bash
# .claude/hooks/ui-screenshot.sh — Stop: if UI files changed since the last shot, screenshot the dev server once
set -uo pipefail
INPUT=$(cat)
[[ "$(jq -r '.stop_hook_active' <<<"$INPUT")" == "true" ]] && exit 0      # avoid loops
cd "$CLAUDE_PROJECT_DIR" || exit 0
CHANGED=$(git status --porcelain -- src app components 2>/dev/null | grep -E '\.(tsx|jsx|vue|svelte|css|scss)$' || true)
[[ -n "$CHANGED" ]] || exit 0
DIR=".claude/previews"; mkdir -p "$DIR"
SIG=$(git diff -- src app components 2>/dev/null | sha1sum | cut -c1-12)
[[ -f "$DIR/.last" && "$(cat "$DIR/.last")" == "$SIG" ]] && exit 0         # same diff already reviewed
URL="${PREVIEW_URL:-http://localhost:3000/}"
curl -sf -o /dev/null "$URL" || exit 0                                     # dev server not running: skip
SHOT="$DIR/ui-$SIG.png"
npx --no-install playwright screenshot --full-page "$URL" "$SHOT" >/dev/null 2>&1 || exit 0
echo "$SIG" > "$DIR/.last"
jq -nc --arg p "$SHOT" --arg u "$URL" '{hookSpecificOutput:{hookEventName:"Stop",additionalContext:("UI source files changed this turn. A full-page screenshot of " + $u + " is at " + $p + "; reference designs are in design/.")}}'
```
Add `.claude/previews/` to `.gitignore`.
- Why a `Stop` hook rather than `PostToolUse`: a page screenshot takes seconds, and one per edit would multiply image reads (**inference**). Stop `additionalContext` "keeps the conversation going… labels it `Stop hook feedback`" without an error notice (cited). `stop_hook_active` plus the diff signature prevents the 8-continuation loop (**inference**).
- Instead of a script, a `type: "agent"` Stop hook ("Take a screenshot … compare with design/hero.png … ok:false if visibly different") can verify with tools. It is experimental, and I did not confirm whether agent-hook subagents can view images (**inference / gap**).

#### Snippet 1.4 — Remotion: validate compositions after edits, check stills on demand [composed]
```json
{
  "hooks": {
    "PostToolUse": [
      {
        "matcher": "Edit|Write",
        "hooks": [ { "type": "command", "command": "${CLAUDE_PROJECT_DIR}/.claude/hooks/remotion-validate.sh", "args": [], "async": true } ]
      }
    ]
  }
}
```
```bash
#!/usr/bin/env bash
# .claude/hooks/remotion-validate.sh — async: typecheck + make sure the bundle still lists compositions
INPUT=$(cat)
FILE=$(jq -r '.tool_input.file_path // empty' <<<"$INPUT")
[[ "$FILE" == */src/*.ts || "$FILE" == */src/*.tsx ]] || exit 0
cd "$CLAUDE_PROJECT_DIR" || exit 0
MSG=""
OUT=$(npx --no-install tsc --noEmit 2>&1) || MSG+="tsc failed: $(head -n 40 <<<"$OUT")"$'\n'
OUT=$(npx --no-install remotion compositions 2>&1) || MSG+="npx remotion compositions failed (bundle/registration error): $(tail -n 40 <<<"$OUT")"$'\n'
[[ -z "$MSG" ]] && MSG="Remotion check passed after editing $FILE: $(tail -n 5 <<<"$OUT" | tr '\n' ' ')"
jq -nc --arg m "$MSG" '{hookSpecificOutput:{hookEventName:"PostToolUse",additionalContext:$m}}'
```
- Frame stills (`npx remotion render <id> out/frames --frames=0,30,90 --image-format=png`) are better triggered from a skill or CLAUDE.md step, or a once-per-turn Stop hook like 1.3, because they're slow (**inference**). This matches the Remotion skill's "don't render unless asked; use Studio for preview" guidance from the earlier notes.
- I did not verify that `npx remotion compositions` exits non-zero on a broken bundle (**[unverified]**). If it doesn't, grep its output for the expected composition IDs.

#### Snippet 1.5 — Blender/3D: cheap syntax gate on bpy scripts [composed]
```json
{ "hooks": { "PostToolUse": [ { "matcher": "Edit|Write", "hooks": [ { "type": "command",
  "command": "f=$(jq -r '.tool_input.file_path // empty'); case \"$f\" in *.py) out=$(python3 -m py_compile \"$f\" 2>&1) || { echo \"Python syntax error in $f: $out\" >&2; exit 2; } ;; esac; exit 0" } ] } ] } }
```
- Don't run `blender -b … -P script.py` from a hook on every edit. A bpy script can mutate or save `.blend` files and run arbitrary code, so make the render an explicit step instead. That step is `blender -b scenes/main.blend -P scripts/build.py -o //../renders/preview_#### -F PNG -f 1`, with output options before `-f` (cited order rule). The `//` relative-to-blend-file path and `-F PNG` are **[unverified]** this session (**inference**).

### Gaps
- No official doc says a hook can attach an image to Claude's context. The `updatedToolOutput` Bash shape has `isImage`, but its use for injecting images is undocumented, so treat "pass a path, let Claude Read it" as the supported route.
- Whether `if: "Edit(...)"` matches `Write` tool calls is not stated explicitly.
- I did not verify whether `type: "agent"` hooks can view images, or what model they use for vision.
- The exit-code behavior of `npx remotion compositions` and the exact Playwright/Blender flags (`--viewport-size` for `screenshot`, `--python-exit-code`) could not be confirmed from primary sources here (sites blocked).

---

## 2. Subagents: defining visual-reviewer / a11y-auditor / render-checker; when they save vs. waste context

### Takeaway
A subagent is a Markdown file in `.claude/agents/<name>.md` (project) or `~/.claude/agents/` (user). Only `name` and `description` are required. Its useful optional fields are `tools`/`disallowedTools`, `model`, `effort`, `skills` (preloads full skill text), `mcpServers` (inline MCP visible only to that subagent, which suits a Playwright browser), `hooks`, `isolation: worktree`, `maxTurns`, `background` and `omitClaudeMd`. Use subagents for *high-volume* visual checks such as many breakpoints, frames or renders, where only a summary should return. Keep the iterative "look → tweak → look" design loop in the main conversation, where your feedback and the shared context matter.

### Cited Findings
- Scope and priority: managed settings (1) > `--agents` CLI JSON (2) > `.claude/agents/` (3) > `~/.claude/agents/` (4) > plugin `agents/` (5). Project agents are found by walking up from cwd. The files are watched, so edits apply "within a few seconds", except when the first `agents` dir is created mid-session, for `--add-dir` dirs, and with `--disable-slash-commands` — [Subagents](https://code.claude.com/docs/en/sub-agents)
- Frontmatter fields: `name` (≤256 chars, no `:`), `description`, `tools`, `disallowedTools`, `model` (`sonnet`, `opus`, `haiku`, `fable`, full ID, or `inherit`), `permissionMode`, `maxTurns`, `autoCompactWindow` (v2.1.296+), `skills`, `mcpServers`, `hooks`, `memory` (`user`/`project`/`local`), `background`, `omitClaudeMd` (v2.1.271+), `effort`, `isolation` (`worktree`), `color`, `initialPrompt`, `experimental.cacheTtl`. "Multi-word field names use camelCase… Claude Code ignores a field it doesn't recognize without reporting an error"; find typos with `claude --debug` and search `does not recognize or apply` — [Subagents](https://code.claude.com/docs/en/sub-agents)
- The body becomes the system prompt: "Subagents receive only this system prompt plus basic environment details… not the Claude Code system prompt" — [Subagents](https://code.claude.com/docs/en/sub-agents)
- A `tools` allowlist excludes MCP tools unless listed ("This example… can't edit files, write files, or use any MCP tools"). Whole-server entries are `mcp__github__*` in `tools` and `mcp__github` / `mcp__*` in `disallowedTools`. A `disallowedTools` entry with a specifier still removes the whole tool; to block specific commands, use a `permissions.deny` rule instead — [Subagents](https://code.claude.com/docs/en/sub-agents)
- Inline `mcpServers` example (`browser-tester` with `playwright: {type: stdio, command: npx, args: ["-y", "@playwright/mcp@latest"]}`): "To keep an MCP server out of the main conversation entirely and avoid its tool descriptions consuming context there, define it inline here" — [Subagents](https://code.claude.com/docs/en/sub-agents)
- Plugin subagents ignore `permissionMode`, `mcpServers`, `hooks` and `initialPrompt` — [Subagents](https://code.claude.com/docs/en/sub-agents)
- `skills:` injects "The full content of each listed skill… up to the first 32 distinct names". It can't preload `disable-model-invocation: true` skills — [Subagents](https://code.claude.com/docs/en/sub-agents)
- Model resolution: per-invocation `model` → frontmatter `model` → `CLAUDE_CODE_SUBAGENT_MODEL` → main model. Since v2.1.198 subagents inherit the session's extended-thinking setting, and there is "no per-subagent thinking setting" — [Subagents](https://code.claude.com/docs/en/sub-agents)
- Background subagents (the default when fork mode is on in interactive sessions) keep all MCP tools but only a reduced built-in set: `Read`, `Grep`, `Glob`, `LSP`, `Bash`, `PowerShell`, `Edit`, `Write`, `NotebookEdit`, `WebFetch`, `WebSearch`, `TodoWrite`, `Skill`, `ToolSearch`, worktree tools, `Monitor`, `TaskStop`, `SendMessage` and `Artifact` — [Subagents](https://code.claude.com/docs/en/sub-agents)
- Invocation: natural language ("Use the test-runner subagent…"), the `@"code-reviewer (agent)"` typeahead or `@agent-<name>`, or a session-wide `claude --agent <name>`. Including "use proactively" in the description encourages auto-delegation. Combined descriptions over 15,000 tokens trigger a startup warning — [Subagents](https://code.claude.com/docs/en/sub-agents)
- When to use which: "Isolate high-volume operations… the verbose output stays in the subagent's context while only the relevant summary returns". Use the **main conversation** when "The task needs frequent back-and-forth or iterative refinement", phases share significant context, the change is quick, or latency matters. Use **subagents** when output is verbose, when you need tool restrictions, or when work is self-contained. "Running many subagents that each return detailed results can consume significant context, and each subagent spends tokens of its own" — [Subagents](https://code.claude.com/docs/en/sub-agents)
- Adversarial review: "have a subagent review the diff in a fresh context". Also: "A reviewer prompted to find gaps will usually report some, even when the work is sound… Tell the reviewer to flag only gaps that affect correctness or the stated requirements" — [Best practices](https://code.claude.com/docs/en/best-practices)
- Example from the docs: `.claude/agents/code-reviewer.md` with `tools: Read, Glob, Grep` and `model: sonnet` — [Subagents](https://code.claude.com/docs/en/sub-agents)

### Inferences

#### Snippet 2.1 — `.claude/agents/visual-reviewer.md` [composed]
```markdown
---
name: visual-reviewer
description: Compares rendered output (UI screenshots, SVG renders, video frames, 3D renders) against a reference image or written spec and returns a prioritized list of concrete visual differences. Use proactively after UI/SVG/render changes when a reference exists in design/ or the user supplied one.
tools: Read, Glob, Bash
model: opus
effort: high
maxTurns: 20
color: purple
---
You are a meticulous visual QA reviewer. You do not edit files.

Inputs you will be given: path(s) to the ACTUAL render(s) and the REFERENCE image(s) or spec.
1. Read the reference first, then each actual image.
2. If a detail is too small to judge, crop it with ImageMagick into the session scratch dir
   (e.g. `magick actual.png -crop 600x400+0+0 crop.png`) and Read the crop.
3. Compare: layout/alignment, spacing scale, typography (family, size, weight, line-height),
   color vs. tokens, iconography, states, overflow/clipping, responsive breakage.
4. Report at most 15 differences, most severe first, as a table:
   | # | Region | Expected | Actual | Severity (blocker/major/minor) | Likely fix (file/CSS property) |
5. Only flag differences that violate the reference or the stated requirements; no taste opinions.
End with one line: VERDICT: MATCHES | MINOR_DIFFS | MAJOR_DIFFS.
```

#### Snippet 2.2 — `.claude/agents/a11y-auditor.md` (Playwright MCP visible only to this agent) [composed]
```markdown
---
name: a11y-auditor
description: Audits a running page for accessibility (semantics, names/roles, contrast, focus order, keyboard traps, alt text, reduced motion) using a real browser. Use when UI changes touch forms, navigation, dialogs, color tokens or SVG icons.
disallowedTools: Write, Edit, NotebookEdit
model: sonnet
maxTurns: 25
mcpServers:
  - playwright:
      type: stdio
      command: npx
      args: ["-y", "@playwright/mcp@latest"]
---
Open the URL you are given with the Playwright tools. Use the accessibility snapshot first (cheaper than
pixels); take screenshots only to check contrast/focus visuals. Check: landmarks, heading order, accessible
names, form labels, focus visibility and order (Tab through), color contrast of text/icons vs. tokens,
`<svg>` icons have `role="img"` + `<title>` or `aria-hidden="true"`, prefers-reduced-motion respected.
Return WCAG-referenced findings: | Element | Issue | WCAG SC | Fix |. Do not modify code.
```
- `disallowedTools` is used here instead of a `tools` allowlist, because an allowlist would also strip the inline Playwright MCP tools unless each is named (cited rule). If this agent ships inside a plugin, `mcpServers` is ignored (cited). Put the server in the plugin's `.mcp.json` and reference it by name (**inference**).

#### Snippet 2.3 — `.claude/agents/render-checker.md` (video/3D/SVG batch renders) [composed]
```markdown
---
name: render-checker
description: Renders preview stills/frames for Remotion compositions, Blender scenes or SVG files, inspects them, and reports only problems (black/empty frames, clipped text, wrong aspect ratio, missing assets, off-brand colors). Use when a change could affect many frames or files.
tools: Bash, Read, Glob
model: sonnet
background: true
maxTurns: 30
---
Render the smallest set that proves correctness: Remotion → `npx remotion render <id> out/frames --frames=0,<mid>,<last> --image-format=png`;
video files → `ffprobe` metadata + a few extracted frames; SVG → `resvg file.svg out.png -w 512`;
Blender → the project's headless preview command from CLAUDE.md. Read every produced PNG.
Report: | Asset/frame | Problem | Evidence (path) | Probable cause |. If everything is fine, say so in one line.
```

#### When subagents help vs. hurt (inference from the cited guidance and §5 token math)
- **They help** when there are many images. One 1920×1080 screenshot costs about 2,691 visual tokens on current high-res models (§5), so 3 breakpoints × 4 routes ≈ 32k tokens of images. In a `visual-reviewer`/`render-checker` subagent those stay out of the main context, and a ~1k-token table returns.
- **They help** when the browser MCP's tool definitions would otherwise sit in the main context (inline `mcpServers`, cited).
- **They help** for an unbiased "fresh eyes" comparison of your own output.
- **They hurt** during iterative design tuning ("a bit more padding… now warmer"). Each delegation starts cold: it must re-read the reference and code, which adds latency (cited). Your taste feedback also lives in the main thread.
- **They hurt** when Claude needs to *see* the image to decide the next edit. Don't delegate the look-step of a tight loop.
- A good hybrid: the main thread edits, the `visual-reviewer` subagent checks after each meaningful milestone, and you read only its verdict table.

### Gaps
- The docs don't say whether `tools:` accepts permission specifiers such as `Bash(npx playwright *)` as an allowlist inside the frontmatter. Use `permissions` rules for command-level limits.
- No official benchmark compares vision quality across subagent model aliases for design review. `model: opus` for visual-reviewer is a judgment call (§5).

---

## 3. CLAUDE.md for visual projects (what to include/exclude, size, `@imports`, `.claude/rules/`; samples for frontend, Remotion, Blender)

### Takeaway
Keep the root CLAUDE.md under about 200 lines. Fill it with things Claude can't infer: the exact render/preview/screenshot commands, where tokens and reference designs live, the "verify visually and show evidence" rule, and environment gotchas. Move per-area conventions (component styling, SVG rules, Remotion animation rules, bpy conventions) into path-scoped `.claude/rules/*.md` files with `paths:` frontmatter, which load only when Claude touches matching files. Multi-step procedures belong in skills. `@imports` organize content but do *not* save context.

### Cited Findings
- Locations: managed (`/etc/claude-code/CLAUDE.md` on Linux), `~/.claude/CLAUDE.md`, `./CLAUDE.md` or `./.claude/CLAUDE.md`, and `./CLAUDE.local.md` (personal, gitignore it). Files above cwd load at launch; subdirectory CLAUDE.md files load when Claude touches files there. All are concatenated, not overridden — [Memory](https://code.claude.com/docs/en/memory)
- Content: "Keep it to facts Claude should hold in every session: build commands, conventions, project layout, 'always do X' rules. If an entry is a multi-step procedure or only matters for one part of the codebase, move it to a skill or a path-scoped rule" — [Memory](https://code.claude.com/docs/en/memory)
- Size: "target under 200 lines per CLAUDE.md file. Longer files consume more context and reduce adherence… Imports help you organize a long file but don't reduce its context cost, because imported files also load at launch" — [Memory](https://code.claude.com/docs/en/memory)
- Write instructions that are concrete enough to verify ("Run `npm test` before committing" rather than "Test your changes") — [Memory](https://code.claude.com/docs/en/memory)
- Include/exclude table. Include Bash commands Claude can't guess, non-default code style, test instructions, repo etiquette, architecture decisions, env quirks and gotchas. Exclude what Claude can read from code, standard conventions, detailed API docs ("link to docs instead"), frequently changing info, tutorials, file-by-file descriptions and "write clean code". "Bloated CLAUDE.md files cause Claude to ignore your actual instructions!" Use "IMPORTANT" on a single line only; if you emphasize many lines, none stands out — [Best practices](https://code.claude.com/docs/en/best-practices)
- `@path/to/import` works with relative paths (resolved from the importing file) or absolute ones, recursively up to depth 4. Spaces are escaped with a backslash. Imports inside code spans/fences are ignored. External imports trigger a one-time approval dialog. `@~/.claude/my-project-instructions.md` shares personal notes across worktrees — [Memory](https://code.claude.com/docs/en/memory)
- Block-level HTML comments (`<!-- … -->`) are stripped before injection, so they cost no tokens — [Memory](https://code.claude.com/docs/en/memory)
- `.claude/rules/`: all `.md` files are discovered recursively. Without `paths`, a rule loads at launch like CLAUDE.md. With `paths:` (a YAML list or comma string of globs, brace expansion allowed), it loads when Claude Reads/Writes/Edits a matching file, or `cat`s it. `paths` is the only frontmatter field read. User-level rules live in `~/.claude/rules/`; rules can be symlinked across projects — [Memory](https://code.claude.com/docs/en/memory)
- Tools: `/init` (or `CLAUDE_CODE_NEW_INIT=1` for an interactive flow that also proposes skills and hooks), `/context` to confirm loaded memory files, `/doctor` to propose cuts, `/doctor prompt-audit` (v2.1.283+) for conflicts and stale references, `/memory` to view/edit, and `claudeMdExcludes` in monorepos — [Memory](https://code.claude.com/docs/en/memory); [Best practices](https://code.claude.com/docs/en/best-practices)
- "Claude treats CLAUDE.md files as context, not enforced configuration". Rules that must always hold belong in hooks/permissions — [Memory](https://code.claude.com/docs/en/memory); [Permissions](https://code.claude.com/docs/en/permissions)
- Remotion workflow facts reused from the earlier notes: run `npx remotion studio --no-open`, compositions at `http://localhost:3000/[composition-id]`, render only on explicit request, and keep Agent Skills in `.agents/skills` symlinked to `.claude/skills`, updated via `npx remotion skills update` — [remotion-best-practices SKILL.md](https://github.com/remotion-dev/remotion/blob/main/packages/skills/skills/remotion-best-practices/SKILL.md); [Remotion docs: skills CLI](https://www.remotion.dev/docs/cli/skills)

### Inferences

#### Snippet 3.1 — Frontend app `CLAUDE.md` (~45 lines) [composed]
```markdown
# acme-web — Next.js 16 + Tailwind v4

## Commands
- Dev server: `pnpm dev` → http://localhost:3000 (start with run_in_background before any visual check)
- Typecheck `pnpm tsc --noEmit` · Lint `pnpm lint` · Unit `pnpm test`
- Visual tests: `pnpm test:visual` (Playwright toHaveScreenshot). NEVER pass --update-snapshots unless I ask.
- Ad-hoc screenshot: `npx playwright screenshot --full-page http://localhost:3000/<route> .claude/previews/<name>.png`

## Design system (source of truth)
- Tokens: `src/styles/tokens.css` (CSS variables). Use tokens, never raw hex/px values.
- Primitives: reuse `src/components/ui/*` before creating components.
- Reference designs: `design/<route>/*.png` (desktop 1440, tablet 768, mobile 375).

## Visual verification
- IMPORTANT: after any UI change, screenshot the affected route at 375/768/1440, Read the PNGs, compare with
  design/, fix differences, repeat; finish by stating the screenshot paths you checked.
- Hooks render previews and report their paths; Read a preview when its file is relevant to the task.
- For >3 screenshots use the visual-reviewer subagent and return only its table.

## Gotchas
- `app/(marketing)` has its own layout + fonts; don't import dashboard CSS there.
- Images go through `next/image`; SVG icons through `src/icons/*.tsx` (currentColor).
<!-- maintainers: keep under 200 lines; component rules live in .claude/rules/ -->
```
`.claude/rules/components.md`:
```markdown
---
paths:
  - "src/components/**/*.{tsx,css}"
  - "app/**/*.tsx"
---
# Component rules
- Spacing only from the 4px scale (`gap-1`=4px …); radius via `--radius-*`.
- Every interactive element has visible :focus-visible and a 44×44px hit target on mobile.
- Dark mode via `data-theme`; test both themes when changing colors.
```
`.claude/rules/svg.md`:
```markdown
---
paths: "**/*.svg, src/icons/**"
---
# SVG rules
- Keep `viewBox`; never hard-code width/height on icons; monochrome icons use `currentColor`.
- Accessible: `role="img"` + `<title>`, or `aria-hidden="true"` if decorative.
- SVGO v4 via `npx svgo` with svgo.config.mjs; don't SVGO animated SVGs (IDs/groups are animation hooks).
- After editing, check the PNG preview the hook reports; text in logos → convert to paths for final assets.
```

#### Snippet 3.2 — Remotion project `CLAUDE.md` [composed]
```markdown
# promo-videos — Remotion 4

## Commands
- Preview (default): `npx remotion studio --no-open` → http://localhost:3000/<composition-id>
- List compositions: `npx remotion compositions`
- Spot-check frames: `npx remotion render <id> out/frames --frames=0,45,<last> --image-format=png`, then Read them
- One still: `npx remotion still <id> out/still.png --frame=30`
- Final MP4 ONLY when I explicitly ask: `npx remotion render <id> out/<id>.mp4`

## Conventions
- Animate only from `useCurrentFrame()` + `interpolate()`/`spring()`; durations in frames (fps from the composition).
- Default 1920×1080 @30fps; vertical cuts 1080×1920 live in `src/vertical/`.
- Brand tokens: `src/brand.ts` (colors, fonts, safe margins). Fonts via `@remotion/google-fonts`.
- Assets in `public/`, referenced with `staticFile()`.

## Skills
- Remotion Agent Skills are installed (.claude/skills → .agents/skills). After bumping remotion run `npx remotion skills update`.
```
- Whether "CSS transitions/animations are not allowed" belongs here depends on the Remotion skill, which already covers it per the earlier notes. Don't duplicate skill content in CLAUDE.md (**inference**).

#### Snippet 3.3 — Blender/3D project `CLAUDE.md` [composed; Blender flags partly unverified]
```markdown
# product-renders — Blender 5.x, scripted with bpy

## Layout
- `scenes/*.blend` — binary, never edit as text; `scripts/*.py` — bpy scripts (must be idempotent);
  `renders/` — gitignored output; `refs/` — reference photos/turnarounds.

## Commands
- Headless preview (order matters: output options BEFORE -f):
  `blender -b scenes/main.blend -P scripts/build.py -o //../renders/preview_#### -F PNG -f 1`
- Syntax-only check: `python3 -m py_compile scripts/<file>.py`
- After a preview render: Read the PNG and compare with refs/ (silhouette, materials, lighting, framing).

## Conventions
- Metric, Z-up, 1 unit = 1 m. Generated objects live in collection `GEN_*`; scripts delete and rebuild it.
- Preview renders: EEVEE, 50% resolution, ≤32 samples (set inside the script); Cycles only for finals I request.
- Never call `bpy.ops.wm.save_mainfile()` unless the task says to save the scene.
- MCP: `blender` MCP server (live scene) is for inspection/screenshots; batch work uses headless CLI.
```

#### What not to put in CLAUDE.md for visual projects (inference from the cited include/exclude table)
- Full design-system documentation, component catalogs, Remotion/three.js API notes, and long prompt "style essays" ("make it beautiful, modern…"). Put these in path-scoped rules, skills (e.g. the official `frontend-design` plugin) or linked docs.
- Hex values duplicated from the tokens file. These go stale; point to the file instead.

### Gaps
- No official Anthropic CLAUDE.md template targets visual/creative projects specifically. The samples above apply the general guidance.

---

## 4. Writing your own domain skills (skill-creator, authoring practices, scripts vs instructions, evals, packaging as a private plugin/marketplace)

### Takeaway
Write a domain skill as a short `SKILL.md`: a "pushy" third-person description of what it does and when to use it, plus a numbered workflow with a render → inspect → fix loop. Put deterministic work (rendering, optimizing, measuring, frame extraction) in bundled `scripts/` called via `${CLAUDE_SKILL_DIR}`, and long references in `references/`. Measure skills against a skill-off baseline: use the skill-creator plugin, `skillOverrides: {"x":"off"}`, or, for plugin skills, `claude plugin eval`, whose `llm` grader can judge PNG outputs as images. Ship skills, agents and hooks as a plugin in a private git marketplace registered per repo or org.

### Cited Findings
**Authoring (Claude Code + platform)**
- Skill frontmatter (Claude Code): `name`, `description` (recommended; "Put the key use case first"; `description` + `when_to_use` are truncated at 1,536 chars), `when_to_use`, `argument-hint`, `arguments`, `disable-model-invocation`, `user-invocable`, `allowed-tools` (pre-approves tools only "during the turn that invokes this skill"), `disallowed-tools`, `model`, `effort`, `context: fork`, `agent`, `background`, `hooks`, `paths` (globs; "Claude loads the skill automatically only when working with files matching the patterns"), `shell`, `metadata`, `license`, `compatibility` — [Skills](https://code.claude.com/docs/en/skills)
- Supporting files: `SKILL.md` + `reference.md` + `examples.md` + `scripts/helper.py` ("executed, not loaded"). Reference them from SKILL.md. Script paths use `${CLAUDE_SKILL_DIR}` so they resolve at personal, project or plugin level — [Skills](https://code.claude.com/docs/en/skills)
- A project skill's `allowed-tools` applies "even in a `-p` run in a folder you've never trusted… review the `allowed-tools` of skills checked into a repository" — [Skills](https://code.claude.com/docs/en/skills)
- Platform best practices: "Default assumption: Claude is already very smart". Match degrees of freedom to fragility: high freedom = text heuristics, medium = parameterized scripts/pseudocode, low = "Run exactly this script… Do not modify the command" for fragile operations. Implement feedback loops ("Run validator → fix errors → repeat"). "Use visual analysis: When inputs can be rendered as images, have Claude analyze them". "Create verifiable intermediate outputs" (plan → validate → execute) for batch/destructive ops. Make validation scripts verbose with specific error messages. Keep SKILL.md under 500 lines and references one level deep — [Platform: Skill authoring best practices](https://platform.claude.com/docs/en/agents-and-tools/agent-skills/best-practices)
- "Build evaluations first": identify gaps without a skill, create three scenarios, establish a baseline, write minimal instructions, then iterate. Use a Claude A (author) / Claude B (tester) loop. "There is not currently a built-in way to run these evaluations" (platform note; Claude Code now ships tools, see below) — [Platform: Skill authoring best practices](https://platform.claude.com/docs/en/agents-and-tools/agent-skills/best-practices)

**skill-creator**
- Install: `/plugin install skill-creator@claude-plugins-official`. If the marketplace is missing, run `/plugin marketplace add anthropics/claude-plugins-official`. Then ask, e.g., "evaluate my summarize-changes skill with skill-creator". It stores tests in `evals/evals.json`, spawns one subagent per case for clean context, grades into `grading.json`, writes with/without-skill `benchmark.json`, runs a blind A/B between versions, tunes descriptions with should/shouldn't-trigger prompts, and opens an HTML review viewer — [Skills](https://code.claude.com/docs/en/skills)
- From the skill-creator SKILL.md: Claude "has a tendency to 'undertrigger' skills… please make the skill descriptions a little bit 'pushy'". "Skills with objectively verifiable outputs… benefit from test cases. Skills with subjective outputs (writing style, art) often don't need them." Start with 2–3 realistic test prompts. Description optimization uses about 20 queries (8–10 should-trigger, 8–10 near-miss should-not-trigger) run through `python -m scripts.run_loop --eval-set … --skill-path … --model <session model> --max-iterations 5` with a 60/40 train/test split, choosing `best_description` by test score. "Claude only consults skills for tasks it can't easily handle on its own", so trigger evals must be substantive. When improving: generalize rather than overfit, keep the prompt lean, "Explain the why" (ALL-CAPS MUSTs are "a yellow flag"), and bundle scripts that every test run reinvented — [anthropics/skills: skill-creator SKILL.md](https://github.com/anthropics/skills/blob/main/skills/skill-creator/SKILL.md)

**Evaluation in Claude Code**
- Baseline: "run each one in a fresh session with the skill available and again with it turned off". Personal or project skills are turned off with `skillOverrides` `"off"`; plugin skills (not affected by `skillOverrides`) with `claude plugin eval` — [Skills](https://code.claude.com/docs/en/skills)
- `skillOverrides` states: `"on"`, `"name-only"`, `"user-invocable-only"`, `"off"`. The `/skills` menu writes them to `.claude/settings.local.json` — [Skills](https://code.claude.com/docs/en/skills)
- `claude plugin eval` (v2.1.269+): cases live in `evals/<case>/prompt.md` + `graders/<name>.md`. Each case runs 3× by default, with WITH/W/OUT arms and Δ. `claude plugin eval init` proposes cases. Grader types: `regex`, `tool_used`, `tool_order`, `file_exists`, `llm`, `baseline`. Grader focus `{ source: file, path: <path> }`: "A PNG, JPEG, GIF, or WebP file is shown to an `llm` judge as an image… render them to an image… and grade that". CI form: `claude plugin eval . --trust-plugin --json results.json --threshold 0.8 --model claude-sonnet-5 --judge-model claude-haiku-4-5 --no-publish --max-cost-usd 20`. Every run is a real billed model call — [Plugin evals](https://code.claude.com/docs/en/plugin-evals)
- `/skill-doctor` (v2.1.252+) reports each skill's context cost and usage — [Skills](https://code.claude.com/docs/en/skills)
- A project skill named `verify` (e.g. recorded by `/run-skill-generator` or `/verify`) is run by Claude before each commit (v2.1.286+) — [Skills](https://code.claude.com/docs/en/skills)

**Packaging and private distribution**
- A marketplace is `.claude-plugin/marketplace.json` with required `name`, `owner` (`name` required) and `plugins` (each entry needs `name` + `source`; a relative `"./plugins/x"` resolves from the marketplace root). Don't set `version` in both `plugin.json` and the entry. Unknown keys are ignored silently, and `claude plugin validate` warns about them — [Marketplace reference](https://code.claude.com/docs/en/plugins/marketplace-reference); [Host a marketplace](https://code.claude.com/docs/en/plugins/host-marketplace)
- Hosting options: GitHub (`/plugin marketplace add your-org/your-marketplace`), another git host (full URL), a hosted `marketplace.json` URL (then relative sources fail), or a shared directory. Pin with `#<ref>`. Install with `/plugin install <plugin>@<marketplace-name>`, where the name comes from `marketplace.json`, not from the repo name — [Host a marketplace](https://code.claude.com/docs/en/plugins/host-marketplace)
- Per-repo registration: `claude plugin marketplace add your-org/your-marketplace --scope project`, then commit the `.claude/settings.json` it writes. For an org, set `extraKnownMarketplaces` + `enabledPlugins` (+ `"autoUpdate": true`) in managed settings. Releases go out by bumping `version`, or by omitting it to track commits — [Host a marketplace](https://code.claude.com/docs/en/plugins/host-marketplace); [Settings reference](https://code.claude.com/docs/en/settings-reference)
- The GitHub Action can install plugins via `plugin_marketplaces` + `plugins` and run `/plugin-name:skill-name` as its `prompt` — [GitHub Actions](https://code.claude.com/docs/en/github-actions)

### Inferences

#### Snippet 4.1 — A domain skill: `.claude/skills/svg-icons/` [composed]
```text
.claude/skills/svg-icons/
├── SKILL.md
├── references/svg-a11y-and-svgo.md     # long rules, loaded only when needed
├── scripts/render.sh                   # resvg/rsvg-convert fallback → PNG (+ contact sheet)
└── scripts/check_svg.py                # verbose validator: viewBox, title/aria, colors vs tokens, size budget
```
```markdown
---
name: svg-icons
description: Creates, edits and optimizes SVG icons, logos and illustrations for this repo, rendering every draft to PNG and inspecting it before finishing. Use whenever the user asks for an icon, logo, pictogram, illustration, favicon, or any change to a .svg file, even if they don't say "SVG".
when_to_use: "draw an icon", "make a logo", "fix this svg", "optimize our icons", "convert to currentColor"
allowed-tools: Bash(bash ${CLAUDE_SKILL_DIR}/scripts/*) Bash(python3 ${CLAUDE_SKILL_DIR}/scripts/*) Bash(npx svgo *)
---
# SVG icon workflow
1. Read `src/styles/tokens.css` for colors; icons are 24×24 viewBox, 2px stroke, round caps unless told otherwise.
2. Write the SVG by hand (no base64, no editor metadata).
3. Render: `bash ${CLAUDE_SKILL_DIR}/scripts/render.sh <file.svg>` → prints PNG paths (512px + 24px).
   Read both PNGs. Check: optical balance, stroke consistency, legibility at 24px, nothing clipped.
4. Validate: `python3 ${CLAUDE_SKILL_DIR}/scripts/check_svg.py <file.svg>`; fix every reported error.
5. Optimize static icons with `npx svgo <file> -o <file>` (keeps viewBox/title in v4); re-render and confirm unchanged.
6. Report the final PNG paths and validator output.
For accessibility markup and SVGO overrides for animated SVGs, read `references/svg-a11y-and-svgo.md`.
```
- `paths:` is deliberately left out. With `paths`, the skill auto-loads only while Claude works on matching files, so "make me a logo" in a fresh session wouldn't trigger it (cited semantics → **inference**). Use `paths` for *editing-only* skills such as "Remotion composition conventions" (`paths: "src/**/*.tsx"` in a Remotion repo).
- Split by degrees of freedom: the aesthetic judgment is high freedom (text heuristics), while rendering, validation and optimization are low freedom (exact scripts). This applies the cited platform guidance.
- For subjective outputs, skill-creator says test cases are often unnecessary. For visual skills, still assert the *objective* parts (renders without error, viewBox present, ≤ N KB, PNG exists via `file_exists`) and use an `llm` image grader or the review viewer for the subjective part (**inference** from the cited grader capabilities).

#### Snippet 4.2 — A/B a personal/project skill from the shell [composed]
```bash
P="Create a 24px 'cloud-upload' icon in assets/icons/ matching our icon set"
claude -p "$P" --output-format json --max-turns 20 > with.json
claude -p "$P" --output-format json --max-turns 20 --settings '{"skillOverrides":{"svg-icons":"off"}}' > without.json
jq '{result: .result, cost: .total_cost_usd}' with.json without.json   # field names other than .result: check your output
```
- Run this in a throwaway worktree or reset between runs so the second run doesn't see the first's files (**inference**). `--settings` accepting inline JSON and `skillOverrides` are both cited; `total_cost_usd` is **[unverified]** (the docs say the json output includes "metadata" and "usage").

#### Snippet 4.3 — Plugin eval case with an image judge [composed from the cited layout]
```text
plugins/visual-toolkit/evals/cloud-icon/prompt.md
---
max_turns: 20          # field name per prompt.md frontmatter table — verify with `claude plugin eval init`
---
Create a 24px "cloud-upload" icon at out/cloud-upload.svg and render it to out/cloud-upload.png.

plugins/visual-toolkit/evals/cloud-icon/graders/renders.md
---
type: file_exists
path: "out/cloud-upload.png"
---

plugins/visual-toolkit/evals/cloud-icon/graders/looks-right.md
---
type: llm
focus: { source: file, path: out/cloud-upload.png }
---
PASS if the image clearly depicts a cloud with an upward arrow, strokes are uniform, nothing is clipped,
and it reads at small size. FAIL otherwise.
```
- The exact `prompt.md` frontmatter keys (turn limits, tools) must come from `claude plugin eval init` or the reference table. I saw only the `schema_version` row (**[unverified]** for `max_turns`).

#### Snippet 4.4 — Private plugin + marketplace layout [composed]
```text
acme-design-plugins/                       # git repo = marketplace root
├── .claude-plugin/marketplace.json
└── plugins/visual-toolkit/
    ├── .claude-plugin/plugin.json         # {"name":"visual-toolkit","description":"…","version":"0.3.0"}
    ├── skills/svg-icons/SKILL.md (+ scripts/, references/)
    ├── skills/remotion-house-style/SKILL.md
    ├── agents/visual-reviewer.md          # plugin agents: hooks/mcpServers/permissionMode ignored
    ├── hooks/hooks.json                   # e.g. the svg-preview hook using ${CLAUDE_PLUGIN_ROOT}
    ├── .mcp.json                          # playwright server for the reviewer (instead of inline mcpServers)
    └── evals/…
```
```json
{
  "$schema": "https://anthropic.com/claude-code/marketplace.schema.json",
  "name": "acme-design-tools",
  "owner": { "name": "Acme Design Engineering" },
  "description": "Visual QA, SVG, Remotion and 3D helpers",
  "plugins": [
    { "name": "visual-toolkit", "source": "./plugins/visual-toolkit", "description": "SVG/Remotion skills, visual-reviewer agent, preview hooks", "category": "design" }
  ]
}
```
Team rollout per repo: `claude plugin marketplace add acme/acme-design-plugins --scope project` → commit `.claude/settings.json`, then `/plugin install visual-toolkit@acme-design-tools`.
- The `$schema` URL value above is a placeholder **[unverified]**. The docs say `$schema` is "Ignored at load time", so it's safe to omit. I did not re-read the `plugin.json` fields beyond `name`/`version`/`description` this session; run `claude plugin validate` before publishing.

### Gaps
- I did not fetch the agentskills.io "Evaluating skills" page, which holds the full `evals/evals.json` assertion schema used by skill-creator.
- I don't know whether skill-creator's `run_loop` description optimizer is billed or limited differently from normal sessions.

---

## 5. Image input and visual feedback (paste, drag-drop, path, Read on PNG; size/token cost; "match this design" prompting; model choice, plan mode, thinking)

### Takeaway
Give Claude references by pasting (`Ctrl+V`; `Cmd+V` in iTerm2; `Alt+V` on Windows/WSL), drag-and-drop, or a file path. Claude reads its own renders with the Read tool, which returns PNG/JPG as vision content and downsizes large images. The cost is `⌈w/28⌉×⌈h/28⌉` visual tokens: about 2.7k for a 1080p screenshot on current high-res models, capped at 4,784 per image at 2576 px. Crop regions to see fine detail, use contact sheets for video, and rasterize SVG (Claude can't "see" SVG source). The best "match this design" prompt names the reference, demands a screenshot comparison, and asks for a list of differences. Use plan mode only for multi-file or uncertain redesigns.

### Cited Findings
- Ways to add images: "Drag and drop an image into the Claude Code window"; "Copy an image and paste it into the CLI with `Ctrl+V`, or with `Alt+V` on Windows and WSL"; "Provide an image path to Claude". Multiple images per conversation are fine. `[Image #N]` references can be Cmd/Ctrl+clicked to open — [Common workflows](https://code.claude.com/docs/en/common-workflows)
- The paste shortcut "Inserts an `[Image #N]` chip at the cursor so you can reference it positionally in your prompt"; `Cmd+V` in iTerm2 — [Interactive mode](https://code.claude.com/docs/en/interactive-mode)
- Read tool: "PNG, JPG, and other image formats are returned as visual content… Claude Code resizes and recompresses large images to fit the model's image size limits… An image that is still larger than 500KB after that resize is re-encoded as a JPEG at reduced quality… If Claude misses fine pixel-level detail in a large image, ask it to crop the region of interest first, for example with ImageMagick via Bash" — [Tools reference](https://code.claude.com/docs/en/tools-reference)
- A `Read(path)` deny rule also blocks attaching pasted or dragged image paths (v2.1.290+) — [Permissions](https://code.claude.com/docs/en/permissions)
- Vision limits: formats JPEG, PNG, GIF, WebP; "Animations are unsupported, and only the first frame is used". Max 8000×8000 px; 10 MB per image via the API (5 MB on Bedrock/Google Cloud). If a request has more than 20 images, a stricter per-image limit applies; "resize each image so that neither dimension exceeds 2000 px, or keep the request to 20 or fewer" — [Platform: Vision](https://platform.claude.com/docs/en/build-with-claude/vision)
- Tokens: "An image… costs `⌈width / 28⌉ × ⌈height / 28⌉` visual tokens". High-resolution tier for "Claude 4.7 and later models": 2576 px long edge / 4784 visual tokens. Standard tier: 1568 px / 1568. Table rows: 1000×1000 = 1296 tokens; 1920×1080 = 2691 (high-res, not resized) vs 1560 (standard, downsized to 1456×819); 3840×2160 → 2576×1449 = 4784. "High-resolution images can use up to roughly three times more visual tokens… downsample images before sending to control token costs". Example: Opus 5.5 at $4/M input ≈ $5.18 per thousand 1000×1000 images — [Platform: Vision](https://platform.claude.com/docs/en/build-with-claude/vision)
- Limitations: "Spatial reasoning: Claude's coordinate and localization outputs are approximate"; counting is approximate; accuracy drops on "very small images under 200 pixels"; heavy JPEG compression can make text unreadable — [Platform: Vision](https://platform.claude.com/docs/en/build-with-claude/vision)
- Prompt pattern from the docs: "[paste screenshot] implement this design. take a screenshot of the result and compare it to the original. list differences and fix them". "Have Claude show evidence rather than asserting success… or a screenshot of the result" — [Best practices](https://code.claude.com/docs/en/best-practices)
- Other docs prompts: "Generate CSS to match this design mockup", "What HTML structure would recreate this component?", "Describe the UI elements in this screenshot" — [Common workflows](https://code.claude.com/docs/en/common-workflows)
- Claude in Chrome: "Design verification: build a UI from a Figma mock, then open it in the browser to verify it matches". It can save screenshots to disk and record GIFs ("captures everything visible… including account details", so review before sharing) — [Chrome](https://code.claude.com/docs/en/chrome)
- Plan mode: `Shift+Tab` until `⏸ plan mode on`, or `claude --permission-mode plan`; `Ctrl+G` edits the plan. "Planning is most useful when you're uncertain about the approach, when the change modifies multiple files… If you could describe the diff in one sentence, skip the plan" — [Best practices](https://code.claude.com/docs/en/best-practices)
- Models: aliases `opus` (Opus 5.5 on the Anthropic API), `sonnet` (Sonnet 5.5), `haiku` (Haiku 5.5), `fable` (Fable 5.1), `best`, `opusplan` ("uses `opus` during plan mode, then switches to `sonnet` for execution"). Effort levels are `low`/`medium`/`high`/`xhigh`/`max`. `medium` is the default on Opus 5.5/Sonnet 5.5/Haiku 5.5; `high` suits "Work where verification matters". `ultrathink` in a prompt requests deeper reasoning for that turn, while "think hard" is ordinary text. Thinking "can't be turned off" on Opus 5.5, Sonnet 5.5, Haiku 5.5 or Fable — [Model config](https://code.claude.com/docs/en/model-config)
- `/goal <condition>`: a separate model re-checks the condition after every turn and Claude keeps working until it holds. This suits "Implementing a design doc until all acceptance criteria hold" — [Goal](https://code.claude.com/docs/en/goal); [Best practices](https://code.claude.com/docs/en/best-practices)

### Inferences
- **SVG is code, not an image**, to the vision model. Vision accepts only JPEG/PNG/GIF/WebP, and the Read docs list raster formats, so Claude must rasterize (resvg/rsvg-convert/Playwright) to see an SVG.
- Only the first frame of a GIF/animated image is seen. For **video**, extract frames or build one contact sheet. A 4×3 grid of 480 px frames is one ~1920×1080 image at about 2.7k tokens, versus 12 separate images. The ffmpeg `tile` filter recipe (`ffmpeg -i in.mp4 -vf "fps=1/2,scale=480:-1,tile=4x3" -frames:v 1 sheet.png`) is prior knowledge and **[unverified]** here.
- **Resolution strategy.** Send screenshots at about 1440–1920 px wide for layout judgment. Crop to about 600–1000 px regions for typography, icon or anti-aliasing detail (the docs' crop advice). Avoid 4K captures, which get downscaled to 2576 px anyway at max cost.
- **Long screenshot loops.** Every image in history is resent on each request. After roughly 20 images, the stricter many-image limit (≤2000 px each) and accumulating tokens argue for `/clear`, `/compact`, or pushing comparison into a subagent (§2). I did not verify how Claude Code itself handles the >20-image threshold (see Gaps).
- **A stronger "match this design" prompt template:**
  `[Image #1] is the target at 1440px. Implement it in src/app/pricing/page.tsx using our tokens (src/styles/tokens.css) and ui primitives. Then: start the dev server, screenshot /pricing at 1440 and 375, Read both, and compare against [Image #1] region by region (header, cards, CTA, footer). List every difference with expected vs actual, fix them, and repeat until differences are only sub-2px. Finish by listing the screenshot paths. Don't invent content not in the mock; use placeholders.`
  Naming regions and a tolerance compensates for approximate spatial reasoning (cited limitation). The "evidence" ending is from the cited best practice.
- **Model choice.** All current aliases (Opus 5.5, Sonnet 5.5, Haiku 5.5) are "4.7 and later", so they all get high-res vision. The tier doesn't differentiate them; reasoning quality does. Use `opus` (or `best`/`fable` for long autonomous redesigns) for design implementation and review. Use `sonnet` for routine UI edits and as the default `render-checker`. `haiku` can do cheap binary checks such as "is this frame black/blank?" in batch. This split is a judgment call with no official vision benchmark across aliases (**inference**).
- **Thinking.** On current models thinking is adaptive and always on. Raise `/effort high` for pixel-matching or multi-breakpoint work. Use `ultrathink` for a one-off hard layout problem (e.g. "why does this grid collapse at 768?"). Use `opusplan` + plan mode for a redesign touching many components: Opus plans, Sonnet executes.

### Gaps
- The docs don't state whether Claude Code downsizes images before the API's >20-image stricter limit, or whether it ever drops old images from history automatically.
- I found no official guidance on which model is best at visual design review.
- Read of `.svg` isn't explicitly documented; the "treated as text" behavior is inferred.

---

## 6. Automation at scale (headless `claude -p`, JSON output, `--allowedTools`, batch SVG/video pipelines, GitHub Actions visual review, worktrees for variants, `/loop`/scheduling)

### Takeaway
Drive batches with a shell loop over `claude -p` (or `/batch` for 5–30 worktree subagents). Use `--output-format json` + `--json-schema` for machine-readable results, `--allowedTools` + `--permission-mode dontAsk` to pre-approve exactly the render/optimize commands, and `--max-turns`/`--max-budget-usd` as cost caps. Prefer `--bare` for reproducibility. Let Claude do the judgment (what to cut, whether a render looks wrong) and let deterministic tools (SVGO, ffmpeg, Remotion, Blender) do the execution. For CI visual review, run Playwright screenshot tests first, then hand the diff images to `anthropics/claude-code-action@v1`. Use `claude --worktree <name>` sessions or `isolation: worktree` subagents for parallel design variants.

### Cited Findings
**Headless**
- `claude -p "…"`. Exit code is 0 on success and non-zero on failure. `--output-format text|json|stream-json`; `json` returns "structured JSON with result, session ID, and metadata". `--json-schema '<schema>'` puts the validated result in `structured_output`. Parse with `jq -r '.result'` / `jq '.structured_output'` — [Headless](https://code.claude.com/docs/en/headless)
- `--allowedTools "Bash,Read,Edit"` auto-approves. In auto mode a bare `Bash` entry is dropped. Baselines: `--permission-mode auto | dontAsk | acceptEdits`; `dontAsk` "denies every call that would otherwise prompt". `--permission-prompts none` (v2.1.259+) for unattended runs — [Headless](https://code.claude.com/docs/en/headless)
- `--bare` skips auto-discovery of hooks, skills, commands, subagents, plugins, MCP, auto memory and CLAUDE.md. It needs `ANTHROPIC_API_KEY` (no OAuth). Pass context with `--append-system-prompt(-file)`, `--settings`, `--mcp-config`, `--agents`, `--plugin-dir`. "`--bare` is the recommended mode for scripted and SDK calls, and will become the default for `-p` in a future release" — [Headless](https://code.claude.com/docs/en/headless)
- Other flags: `--max-turns`, `--max-budget-usd` ("Spend can pass the cap, so leave headroom"), `--no-session-persistence`, `--model`, `--fallback-model`, `--effort`, `--input-format stream-json`, `--tools` (restricts the built-in set) and `--disallowedTools` — [CLI reference](https://code.claude.com/docs/en/cli-reference)
- The official fan-out example is `for file in $(cat files.txt); do claude -p "Migrate $file … Return OK or FAIL." --allowedTools "Edit,Bash(git commit *)" --permission-mode dontAsk; done`. "Test on a few files, then run on all of them". Pipelines can use `claude -p "<prompt>" --output-format json | your_command` — [Best practices](https://code.claude.com/docs/en/best-practices)
- `/batch <instruction>` splits work across "5 to 30 subagents. Each subagent works in its own worktree" — [Best practices](https://code.claude.com/docs/en/best-practices)
- Security: without `--bare`, `-p` runs project hooks and `.mcp.json` servers even in untrusted folders. Review `.claude/` first or pass `--settings '{"disableAllHooks": true}'` — [Headless](https://code.claude.com/docs/en/headless); [Hooks reference](https://code.claude.com/docs/en/hooks)
- In `-p` mode, async hooks still running at teardown are killed — [Hooks reference](https://code.claude.com/docs/en/hooks)

**GitHub Actions**
- `anthropics/claude-code-action@v1` has two modes. Interactive mode, with no `prompt`, responds to `@claude`. Automation mode runs on a `prompt`, and results go to the run log unless the prompt directs posting and a posting tool is allowed. Inputs: `prompt`, `claude_args` (any CLI args, e.g. `--max-turns`, `--model`, `--allowedTools`, `--mcp-config`), `anthropic_api_key` / `claude_code_oauth_token`, `github_token`, `plugin_marketplaces`, `plugins`, `settings`, `trigger_phrase`, `use_bedrock`/`use_vertex`/`use_foundry`. Quick setup is `/install-github-app` — [GitHub Actions](https://code.claude.com/docs/en/github-actions)
- The review example posts inline comments with `claude_args: '--allowedTools "mcp__github_inline_comment__create_inline_comment"'`, required because "the… Action starts the MCP server that posts inline comments only when `--allowedTools`… names it". "GitHub withholds secrets from runs triggered by fork pull requests". The write-access and human-actor checks (`allowed_bots`, `allowed_non_write_users`) apply — [GitHub Actions](https://code.claude.com/docs/en/github-actions)
- Path-filtered triggers (`on.pull_request.paths`) appear in the action's "Review Only Specific File Paths" solution. The usage docs show "Fix Bugs from Screenshots: @claude Here's a screenshot… Claude can see and analyze images" — [claude-code-action solutions](https://github.com/anthropics/claude-code-action/blob/main/docs/solutions.md); [claude-code-action usage](https://github.com/anthropics/claude-code-action/blob/main/docs/usage.md)
- Cost controls: `--max-turns`, workflow timeouts, concurrency controls, and a concise CLAUDE.md "since Claude reads it on every run" — [GitHub Actions](https://code.claude.com/docs/en/github-actions)

**Parallelism and scheduling**
- `claude --worktree feature-auth` (a separate checkout under `<repo>/.claude/worktrees/<name>`; needs at least one commit). `.worktreeinclude` (gitignore syntax) copies gitignored files such as `.env` into new worktrees. Subagent `isolation: worktree` branches from the default branch by default and is auto-cleaned if unchanged — [Worktrees](https://code.claude.com/docs/en/worktrees); [Common workflows](https://code.claude.com/docs/en/common-workflows); [Subagents](https://code.claude.com/docs/en/sub-agents)
- Writer/Reviewer pattern: Session A implements, Session B reviews in a fresh context — [Best practices](https://code.claude.com/docs/en/best-practices)
- Scheduling: `/loop` is session-scoped (min 1 minute, restored on `--resume`), Desktop scheduled tasks are local (min 1 minute), Routines run in the cloud (min 1 hour, fresh clone), and GitHub Actions cover cron. "Be explicit about what success looks like" in scheduled prompts — [Scheduled tasks](https://code.claude.com/docs/en/scheduled-tasks); [Common workflows](https://code.claude.com/docs/en/common-workflows)

### Inferences

#### Snippet 6.1 — Batch SVG cleanup with visual self-check and JSONL report [composed]
```bash
#!/usr/bin/env bash
# Deterministic optimization doesn't need an LLM: run `npx svgo -rf assets/icons -o assets/icons` directly.
# Use Claude only for semantic cleanup (currentColor, a11y, consistent stroke) + visual sanity check.
set -uo pipefail
mkdir -p out/before out/after out/reports
SCHEMA='{"type":"object","properties":{"file":{"type":"string"},"status":{"type":"string","enum":["OK","VISUAL_CHANGE","FAIL"]},"notes":{"type":"string"}},"required":["file","status"]}'
for f in $(find assets/icons -name '*.svg' | sort); do          # `for`, not `while read`: claude -p reads stdin
  n=$(basename "$f" .svg)
  resvg "$f" "out/before/$n.png" -w 256 || continue
  claude -p "Clean up $f: keep viewBox and <title>, make monochrome fills/strokes currentColor, add role=\"img\" if missing, remove editor metadata. Then run: resvg $f out/after/$n.png -w 256. Read out/before/$n.png and out/after/$n.png and say whether the icon looks identical. Report per schema." \
    --allowedTools "Read,Edit,Bash(resvg *)" \
    --permission-mode dontAsk --max-turns 10 \
    --output-format json --json-schema "$SCHEMA" < /dev/null \
  | jq -c '.structured_output' >> out/reports/icons.jsonl
done
jq -r 'select(.status!="OK") | "\(.status)\t\(.file)\t\(.notes)"' out/reports/icons.jsonl
```
- `< /dev/null` and `for` avoid a classic bug: `claude -p` accepts piped stdin ("`cat error.log | claude -p`", cited), so inside `while read` it would swallow the file list (**inference**).
- To parallelize, replace the loop with `xargs -P 4` over a wrapper script. Every path is per-file, so runs don't collide.
- For reproducibility in CI add `--bare` (and `ANTHROPIC_API_KEY`). The prompt then must carry any CLAUDE.md rules via `--append-system-prompt-file` (cited).

#### Snippet 6.2 — Batch video cuts: Claude plans, ffmpeg executes [composed]
```bash
SCHEMA='{"type":"object","properties":{"cuts":{"type":"array","items":{"type":"object","properties":{"start":{"type":"number"},"end":{"type":"number"},"title":{"type":"string"}},"required":["start","end","title"]}}},"required":["cuts"]}'
for ep in transcripts/*.srt; do
  id=$(basename "$ep" .srt)
  claude -p "Read $ep. Pick the 3 strongest self-contained moments for 30-60s vertical shorts. Cut on sentence boundaries; times in seconds from the SRT." \
    --allowedTools "Read" --permission-mode dontAsk --max-turns 5 \
    --output-format json --json-schema "$SCHEMA" < /dev/null > "plans/$id.json"
  jq -e '.structured_output.cuts | length > 0 and all(.end > .start and (.end-.start) <= 60)' "plans/$id.json" >/dev/null || { echo "bad plan $id"; continue; }   # validate plan
  jq -r '.structured_output.cuts[] | "\(.start) \(.end)"' "plans/$id.json" | while read -r s e; do
    ffmpeg -nostdin -y -i "raw/$id.mp4" -ss "$s" -to "$e" -c:v libx264 -c:a aac "out/${id}_${s%.*}.mp4"
  done
done
```
- This is the platform's "plan → validate → execute" pattern applied to video (cited): the LLM never runs ffmpeg itself, and a jq gate rejects malformed plans. Use `-nostdin` because ffmpeg also reads stdin inside the `while` loop (**inference**). Output-side `-ss/-to` is the accurate (slower) form. ffmpeg seeking semantics are prior knowledge and **[unverified]** here.
- A follow-up `render-checker` pass (frames → Read) can verify the first and last frame of each clip.

#### Snippet 6.3 — GitHub Actions: Playwright visual tests, then Claude triages the diffs [composed]
```yaml
name: Visual review
on:
  pull_request:
    types: [opened, synchronize, ready_for_review]
    paths: ["src/**", "app/**", "public/**", "assets/**/*.svg", "tests/visual/**"]
concurrency: { group: visual-${{ github.event.pull_request.number }}, cancel-in-progress: true }
jobs:
  visual:
    runs-on: ubuntu-latest
    timeout-minutes: 30
    permissions:
      contents: read
      pull-requests: write
      id-token: write
    steps:
      - uses: actions/checkout@v6
        with: { fetch-depth: 1 }
      - uses: actions/setup-node@v4            # pin to the current major in your org
        with: { node-version: 22 }
      - run: npm ci && npx playwright install --with-deps chromium
      - name: Visual tests (record failure, don't stop)
        run: npx playwright test tests/visual || echo "VISUAL_FAILED=1" >> "$GITHUB_ENV"
      - uses: anthropics/claude-code-action@v1
        if: env.VISUAL_FAILED == '1'
        env:
          GH_TOKEN: ${{ github.token }}         # for `gh pr comment` (inferred requirement)
        with:
          anthropic_api_key: ${{ secrets.ANTHROPIC_API_KEY }}
          prompt: |
            REPO: ${{ github.repository }}  PR NUMBER: ${{ github.event.pull_request.number }}
            Playwright visual tests failed. For each *-diff.png under test-results/, Read the matching
            *-expected.png, *-actual.png and *-diff.png. Read the PR description with `gh pr view`.
            Classify each failure as INTENDED (explained by the PR) or REGRESSION, and post ONE PR comment
            with a table: test | verdict | what changed visually | likely source file. Do not edit files.
          claude_args: |
            --model claude-opus-5-5
            --max-turns 25
            --allowedTools "Read,Glob,Bash(gh pr view *),Bash(gh pr comment *)"
      - if: env.VISUAL_FAILED == '1'
        run: exit 1                              # keep the check red until baselines are updated by a human
```
- Playwright's `test-results/**/*-{expected,actual,diff}.png` naming and the need for `GH_TOKEN` with `gh` inside the action are prior knowledge, **[unverified]** here. The alternative cited posting route is `mcp__github_inline_comment__create_inline_comment`.
- Fork PRs get no secrets (cited), so this workflow only reviews same-repo branches. Baselines must be generated on the same OS/browser as CI, or every run "fails" (**inference**).

#### Snippet 6.4 — Parallel design variants with worktrees [cited commands + composed flow]
```bash
# three terminals (or the desktop app's worktree option), one variant each:
claude --worktree hero-minimal     # prompt: "Redesign the hero per design/brief.md, variant: minimal. Screenshot 1440/375 to .claude/previews/"
claude --worktree hero-bold
claude --worktree hero-editorial
# then, from the main checkout:
#   "Use the visual-reviewer subagent to compare .claude/worktrees/hero-*/.claude/previews/*.png against design/brief.md; rank them."
```
- Add `.env*` to `.worktreeinclude` so each worktree's dev server starts (cited mechanism). Give each variant's dev server a distinct port, e.g. `PORT=3001 pnpm dev` (**inference**).
- Inside one session, the equivalent is three `isolation: worktree` subagents, or `/batch` for many mechanical variants such as "regenerate all 40 icons in the new stroke style".
- I did not verify that `--worktree` combines with `-p` for fully headless variant generation (**[unverified]**).

#### Scheduling (inference)
- `/loop 10m check the Remotion render in out/ and report when it finishes or errors` suits polling a long local render in the same session. Use Desktop scheduled tasks for nightly local renders that need GPU/Blender. Use GitHub Actions cron or Routines for repo-level weekly visual audits, e.g. "screenshot every route, compare with last week's baseline, open an issue with regressions"; note Routines use a fresh clone and can't reach local apps.

### Gaps
- The exact JSON field names of `--output-format json` beyond `result`, `structured_output` and the session ID were not enumerated in the pages read (e.g. cost/usage keys).
- I don't know whether `claude-code-action` exposes `gh` with a token by default.
- No official Anthropic example of visual-regression triage with the action was found. The workflow above is composed.

---

## 7. Permission presets per domain (allow/ask/deny for npx remotion, ffmpeg, blender…) and settings scopes

### Takeaway
Put a team preset in the committed `.claude/settings.json` (`permissions.allow` / `ask` / `deny`), personal extras in `.claude/settings.local.json`, and machine-wide tools in `~/.claude/settings.json`. Rules evaluate **deny → ask → allow**, deny at any level wins, and lists merge across files. Allow the cheap verify/render-preview commands and leave expensive or irreversible ones (final renders, cloud renders, baseline updates, pushes) unlisted or under `ask`. Remember that allowing `blender -b … -P` or `node script` effectively allows arbitrary code, and that Read/Edit denies don't cover subprocess file writes. Use the sandbox for real enforcement.

### Cited Findings
- Rule syntax: `Bash(npm run *)`. "Put the `*` after the subcommand". A trailing ` *` also matches the bare command; `Bash(ls *)` ≠ `Bash(ls*)`; `:*` is equivalent at the end. Compound commands (`&&`, `||`, `;`, `|`, …) must match each subcommand. Wrappers such as `timeout`, `time`, `nice`, `nohup` and `stdbuf` are stripped, as are certain safe env assignments — [Permissions](https://code.claude.com/docs/en/permissions)
- "Rules are evaluated in order: deny, then ask, then allow. The first match in that order determines the outcome… a matching ask rule prompts even when a more specific allow rule also matches the same call" — [Permissions](https://code.claude.com/docs/en/permissions)
- Read/Edit rules use gitignore syntax: `//abs`, `~/home`, `/relative-to-settings-source`, `./` or bare = relative to cwd. A Read deny also blocks Edit/Write on that path. Write/NotebookEdit/Glob path rules are never consulted; use `Edit(...)`/`Read(...)`. "They don't apply to… arbitrary subprocesses that read or write files indirectly, like a Python or Node script… For OS-level enforcement… enable the sandbox". `.claudeignore` "has no effect" — [Permissions](https://code.claude.com/docs/en/permissions)
- "Yes, and don't ask again" saves to `.claude/settings.local.json` at the repo root, which also covers worktrees. Project `permissions.allow` applies only after the workspace-trust dialog; `-p` never shows it — [Permissions](https://code.claude.com/docs/en/permissions)
- Precedence: managed > `--settings` CLI > `.claude/settings.local.json` > `.claude/settings.json` > `~/.claude/settings.json`. "Lists merge instead of overriding". A user-level deny blocks a project-level allow and vice versa. `$schema: https://json.schemastore.org/claude-code-settings.json` gives editor validation (it may lag new keys) — [Settings](https://code.claude.com/docs/en/settings); [Permissions](https://code.claude.com/docs/en/permissions)
- `PreToolUse` hooks with `permissionDecision: "deny"` block even in `bypassPermissions`. Hooks can tighten but not loosen past deny rules — [Hooks guide](https://code.claude.com/docs/en/hooks-guide)
- Fewer prompts without losing control: allowlists + `/sandbox`. Auto mode is the built-in starting mode in v2.1.283+ for interactive terminal/VS Code sessions — [Best practices](https://code.claude.com/docs/en/best-practices)
- The bundled `/fewer-permission-prompts` skill scans transcripts for common read-only calls and proposes a project allowlist (present in this environment's skill list; not re-read in the docs this session).

### Inferences

#### Snippet 7.1 — Frontend + SVG preset (`.claude/settings.json`, committed) [composed]
```json
{
  "$schema": "https://json.schemastore.org/claude-code-settings.json",
  "permissions": {
    "allow": [
      "Bash(pnpm run *)", "Bash(npm run *)",
      "Bash(npx prettier *)", "Bash(npx eslint *)", "Bash(npx tsc *)",
      "Bash(npx playwright test *)", "Bash(npx playwright screenshot *)",
      "Bash(npx svgo *)", "Bash(resvg *)", "Bash(rsvg-convert *)",
      "Bash(magick *)", "Bash(identify *)",
      "Bash(curl -sf http://localhost:*)"
    ],
    "ask": [
      "Bash(npx playwright test * --update-snapshots*)",
      "Bash(npx playwright test * -u*)",
      "Bash(npm install *)", "Bash(pnpm add *)",
      "Bash(git push *)"
    ],
    "deny": [
      "Read(./.env)", "Read(./.env.*)",
      "Edit(/tests/**/*-snapshots/**)",
      "Bash(rm -rf *)"
    ]
  }
}
```
- Because ask beats allow (cited), the `--update-snapshots` ask rules still prompt even though `npx playwright test *` is allowed. The `Edit` deny on snapshot folders stops Claude from "fixing" a visual regression by hand-editing baselines. It does *not* stop a Bash subprocess from rewriting them (cited limitation), which is why the ask rule exists. The Playwright `*-snapshots/` folder naming is prior knowledge (**[unverified]**).

#### Snippet 7.2 — Remotion / video preset [composed]
```json
{
  "permissions": {
    "allow": [
      "Bash(npx remotion compositions *)",
      "Bash(npx remotion still *)",
      "Bash(npx remotion render * --frames=*)",
      "Bash(npx remotion studio *)",
      "Bash(npx remotion skills update *)",
      "Bash(npx tsc *)",
      "Bash(ffprobe *)",
      "Bash(ffmpeg -nostdin *)"
    ],
    "ask": [
      "Bash(npx remotion lambda *)",
      "Bash(npx remotion cloudrun *)",
      "Bash(npx hyperframes cloud *)"
    ],
    "deny": [
      "Edit(/public/footage/**)",
      "Read(./.env)"
    ]
  }
}
```
- A full `npx remotion render <id> out.mp4` is left *unlisted*, so it prompts in Manual mode and is denied under `dontAsk`. An `ask` rule for `npx remotion render *` would also catch the allowed `--frames` preview renders, since ask beats allow (cited order → **inference**). Cloud renders cost money, hence `ask`. The `Edit` deny protects raw footage from Claude's file tools, though not from ffmpeg overwriting via `-y` (cited subprocess caveat).

#### Snippet 7.3 — Blender / 3D preset [composed]
```json
{
  "permissions": {
    "allow": [
      "Bash(blender -b *)", "Bash(blender --background *)",
      "Bash(python3 -m py_compile *)",
      "Bash(magick *)"
    ],
    "ask": [
      "Bash(blender -b * --python-expr *)"
    ],
    "deny": [
      "Edit(/assets/source/**)",
      "Bash(blender * --addons *)"
    ]
  }
}
```
- `Bash(blender -b *)` with `-P script.py` runs arbitrary Python with your user rights, so it's equivalent to allowing `python3 *`. Pair it with `/sandbox` (filesystem/network isolation) or keep it in `.claude/settings.local.json` for trusted machines only (**inference** from the cited subprocess caveat). The `--addons` deny is illustrative; Blender flag names are **[unverified]**.
- For live-scene MCP servers (Blender/Godot/Unreal MCP from the earlier notes), the analogous control is an MCP rule in `permissions` (e.g. allow read-only `mcp__blender__get_*` and require approval for `mcp__blender__execute_*`). The MCP rule syntax is in the permissions doc's MCP section, which I did not read in detail (**[unverified]** specifics).

#### Scope placement (inference)
- `~/.claude/settings.json`: personal machine-wide allows for `resvg`, `magick`, `ffprobe`, plus `alwaysThinkingEnabled` and `effortLevel` preferences.
- `.claude/settings.json` (committed): the domain preset, hooks from §1, `extraKnownMarketplaces`/`enabledPlugins` for the team plugin (§4).
- `.claude/settings.local.json`: risky local allows (Blender `-P`, GPU renders), `skillOverrides` experiments, and approvals saved by "don't ask again".
- Managed settings: org-wide denies (secrets, `git push --force`), `strictKnownMarketplaces`, `allowManagedHooksOnly` where required.

### Gaps
- I did not read the exact MCP permission-rule syntax (wildcards per server/tool) and the sandbox configuration keys (`sandbox.*`) in detail this session. Check them in [Permissions](https://code.claude.com/docs/en/permissions) (MCP section) and [Sandboxing](https://code.claude.com/docs/en/sandboxing) before relying on them.
- Community sources on visual-verification setups were secondary and low-signal. They recommend the same Playwright-MCP/screenshot loop but add no verified configs: [Medium: Round-Trip Screenshot Testing](https://medium.com/@rotbart/giving-claude-code-eyes-round-trip-screenshot-testing-ce52f7dcc563), [qaskills.sh](https://qaskills.sh/blog/claude-code-screenshot-frontend-verification-mcp), [superdesign.dev](https://www.superdesign.dev/blog/claude-code-ui-design). I found no official Anthropic blog post dedicated to Claude Code for visual/design work beyond the docs cited above.
