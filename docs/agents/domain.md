# Domain Docs

How the engineering skills should consume this repo's domain documentation when exploring the codebase.

## Before exploring, read these

- **`CONTEXT.md`** at the repo root, or
- **`CONTEXT-MAP.md`** at the repo root if it exists — it points at one `CONTEXT.md` per context. Read each one relevant to the topic.
- **`docs/adr/`** — read ADRs that touch the area you're about to work in. In multi-context repos, also check `src/<context>/docs/adr/` for context-scoped decisions.

If any of these files don't exist, **proceed silently**. Don't flag their absence; don't suggest creating them upfront. The `/domain-modeling` skill (reached via `/grill-with-docs` and `/improve-codebase-architecture`) creates them lazily when terms or decisions actually get resolved.

## File structure

Single-context repo (this repo):

```
/
├── CONTEXT.md
├── docs/adr/
│   └── 0001-distribution-shell-on-oh-dsh.md
├── docs/selection.md
└── (upstream vendored code under plugins/, web/, upstream/)
```

## Use the glossary's vocabulary

When your output names a domain concept (in an issue title, a refactor proposal, a hypothesis, a test name), use the term as defined in `CONTEXT.md`. Don't drift to synonyms the glossary explicitly avoids.

If the concept you need isn't in the glossary yet, that's a signal — either you're inventing language the project doesn't use (reconsider) or there's a real gap (note it for `/domain-modeling`).

## Flag ADR conflicts

If your output contradicts an existing ADR, surface it explicitly rather than silently overriding:

> _Contradicts ADR-0001 (发行版外壳：以 oh-dsh 为基座的源码级 fork) — but worth reopening because…_

## Repo-specific note

This repo is a **one-time copy of `hust-open-atom-club/oh-dsh`** (`@4a183a3`) that evolves independently — upstream updates are not merged. The upstream git history is preserved under `git remote upstream`. `plugins/`, `web/`, `upstream/` are vendored upstream code; our own work lives in the root docs, `CONTEXT.md`, and any changes we make to the vendored trees.
