Project: webnav
===============

Overview
--------
webnav is a VS Code extension and repo that coordinates multiple agent personas to assist development workflows inside VS Code. The extension orchestrates a pipeline of agents (Mapping, Architect, Developer, Debugger, QA, etc.) to go from a user prompt → ADR → implementation → verification.

Repository layout
---------------
- `src/` — extension source (TypeScript). The main entrypoint is `src/extension.ts`.
- `agents/` — human-readable agent persona definitions used by the orchestrator. Every file here is a prompt template consumed by the extension.
- `docs/` — documentation. This file lives at `docs/documentation/DETAILED_DOCUMENTATION.md`.
- `tests/` — test harnesses and integration checks used by QA agent.

Agents (how to author and avoid parsing issues)
---------------------------------------------
The agent files under `agents/` are Markdown prompt templates. To keep the orchestrator robust, follow these rules:

1. Use a consistent code-fence style: three backticks for fenced blocks (```chatagent or ```markdown). Some tools parsing these files expect exactly three backticks; using 4 backticks or inconsistent fences can break parsers.
2. Do not emit raw runtime metadata inside agent responses. In particular agents must not provide `responseMeta`, raw JSON response envelopes, or other tool-run metadata. Instead, return pure Markdown (and code blocks when necessary). The extension wraps and records runtime metadata itself.
3. Keep the top-level structure consistent: a short header, `## Role Definition`, a short persona paragraph, `### Responsibilities`, and an `Output` or `Format` section describing exact machine-readable output.
4. Avoid stray tokens or non-semantic text before the opening fences (e.g. stray words like "yeah"). These can break simple parsers that expect the first non-empty line to be the fence or header.

Fixing agent inconsistencies
---------------------------
This repository includes `scripts/normalize_agents.js`, a small Node.js helper that will:

- Normalize opening/closing code-fences to exactly three backticks when needed.
- Remove accidental stray tokens at the top of files (e.g. a leading "yeah").
- Inject a small `Agent Configuration` block into agent files that lack it to enforce: "Output Mode: Markdown only; do not emit raw JSON/response metadata."

Run the normalizer locally before committing or merging:

```bash
node ./scripts/normalize_agents.js
git add agents/
git commit -m "fix(agents): normalize fences and inject agent configuration"
```

Developer notes
---------------
- If you change the agent prompt format, update `docs/documentation/DETAILED_DOCUMENTATION.md` and re-run the normalizer.
- The extension (`src/extension.ts`) already expects Markdown outputs from agents. If you add new agent features that require structured data, prefer using explicit fenced code blocks with language and path hints (for example: ````markdown:docs/adr/NAME.md````) — but keep the fence count to three.

Contact
-------
Maintainers: see repository README.md for owner/contacts.
