# dsh-skillport

**Every skill you already have — Claude Code, Codex, Cursor, Gemini CLI — works in DSH.**

`dsh-skillport` is a [DeepSeek Harness](https://github.com/deepseek-ai/deepseek-harness) plugin bundle that makes DSH the next implementer of the open **Agent Skills** standard (`SKILL.md`). Anthropic released the spec in Dec 2025 and 30+ harnesses read it (Codex CLI, Cursor, Gemini CLI, Copilot/VS Code, Goose, Windsurf); DSH did not. Skillport imports the whole existing ecosystem with **zero migration**: your `.claude/skills/` library, your Cursor rules, your Claude Code slash commands all become DSH skills the moment the plugin loads.

## What you get

| Format | Source | How it lands in DSH |
|---|---|---|
| Agent Skills `SKILL.md` | `.claude/skills/`, `~/.claude/skills/` (Claude Code) | model-invocable skills |
| Agent Skills `SKILL.md` | `~/.gemini/antigravity/skills/` (Gemini CLI) | model-invocable skills |
| Agent Skills `SKILL.md` | `extraPaths` (config) | model-invocable skills |
| Agent Skills `SKILL.md` | `.dsh/skills/`, `.agents/skills/` (+ user roots) | scanned natively by DSH — skillport never double-scans |
| Cursor rules | `.cursor/rules/*.mdc` | converted to model-invocable skills (source `cursor`) |
| Claude Code commands | `.claude/commands/*.md` | converted to **user-invokable** skills (`/name`) |
| Context files | `AGENTS.md`, `CLAUDE.md` | injected as project context **only if** DSH does not already (native `dsh-agent-instructions` wins — no double-injection) |

Skills flow into the native skill registry (`ctx.skills`), so the platform's own catalog injection, progressive-disclosure index, and the `skill` loader tool surface them automatically. **Registrations are Cordis effects: `dsh plugin remove @dsh-skillport/bundle` unloads every imported skill cleanly** — a live demo of the platform's teardown model.

## Why this shape

DSH already ships a full skill stack: a provider registry with rank-based dedup, catalog injection (names + descriptions in the system prompt), and a `skill` tool that loads bodies and resolves bundled file paths. Skillport's job is narrower and honest: **discover the locations DSH does not cover, convert the adjacent formats, and make the result debuggable.** That is exactly the spec's "check first — don't double-inject" instruction applied to the whole surface:

- `.dsh/skills` + `.agents/skills` are scanned by DSH's native `dsh-skill-filesystem`; skillport detects that provider and skips those sets (falling back to scanning them itself only when the native provider is absent, so the full table holds in any composition).
- The spec's "injection" (names + descriptions) and "use_skill" (load body + resolve resources) are the native `dsh-tool-skill` catalog and `skill` tool — skillport feeds them, it does not duplicate them.
- `AGENTS.md`/`CLAUDE.md` are injected natively by `dsh-agent-instructions`; skillport takes over only when that plugin is absent.

## Install

```sh
dsh plugin --profile web add @dsh-skillport/bundle
```

Then in a session: ask the model to load a skill you used to own in Claude Code — the catalog lists it and the `skill` tool loads it, bundled resources included.

## Config

All fields optional (profile patch or `cordis.patch.yml`):

```yaml
plugins:
  dsh-skillport:
    sources: [dsh, claude, agents, gemini]   # which discovery sets to scan
    extraPaths: []                            # extra SKILL.md dirs (e.g. ~/skills, a shared drive)
    convert:
      cursorRules: true                       # .cursor/rules/*.mdc → skills
      contextFiles: true                      # AGENTS.md / CLAUDE.md (skipped when DSH handles natively)
      claudeCommands: true                    # .claude/commands/*.md → user-invokable skills
    maxIndexEntries: 100                      # prompt-bloat cap: beyond this, skillport's model-invocable
                                              # candidates become user-invocable only (find_skill surfaces them)
    providerName: skillport                   # provider name in the skill registry
```

## Skills doctor

Trigger-quality is the fuzzy failure mode: skills tuned for Claude's triggering habits may fire differently on DeepSeek models. Skillport turns that into a debuggable surface.

In-session (`/skills doctor [<description>]`):

```
/skills doctor
## project-claude (1)
- commit-helper — Craft conventional-commit messages from staged changes.
## project-dsh (1)
- deploy — Deploy the application to staging or production with rollback.

/skills doctor deploy the app to production
Test-fire: "deploy the app to production"
- deploy [skillport/project-dsh] score=0.83
    "Deploy the application to staging or production with rollback."
```

Terminal (no DSH session needed):

```sh
skills-doctor --cwd ~/work/projectx list
skills-doctor --cwd ~/work/projectx test-fire "deploy the app to production"
```

## Pinned spec revision

The Agent Skills format is young and versioned. Skillport pins the revision it implements — see [docs/spec-revision.md](docs/spec-revision.md) — and ships a conformance fixture suite (missing fields, unicode names, nested resources) so spec drift fails loudly in CI.

## Non-goals (deliberately)

- **Claude Code plugins / hooks / subagents** — executable host-specific semantics; porting prose-and-scripts is honest, pretending to port hook systems is a bug factory.
- **MCP config translation** — out of scope.
- **Codex / Cursor extension binaries** — out of scope.
- Skillport never gets its own execution path: skills that carry scripts run through DSH's normal shell tool inside its sandbox, so the sandbox policy stays the single enforcement point.

## Development

```sh
pnpm install
pnpm build
pnpm test        # 60 tests: spec conformance, discovery, dedup, converters,
                 # doctor, find_skill, plugin integration, CLI, goldens
```

Fixtures: `test/fixtures/` holds one skill per source format, conformance edge cases, and the checked-in goldens for the injected index + doctor report.

## License

MIT

