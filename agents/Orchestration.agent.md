# Integrated Orchestration Pipeline (@webnav)

This file encodes the orchestration rules executed by the `src/extension.ts` VS Code Chat Participant. You are participating in a Multi-Agent State Machine.

## Pipeline Order:
1. **Mapping (Phase 0)** — Scopes the initial user prompt, defines the problem, and outputs the feature branch name.
2. **Architect (Phase 1)** — Reads the Mapping scope and writes an Architecture Decision Record (ADR) detailing the contracts and data models. *Hard Gate: If an ADR is not produced, the pipeline fails.*
3. **Developer (Phase 2)** — Implements the feature based STRICTLY on the Architect's ADR. Outputs the implementation code.
4. **QA (Phase 3)** — Critiques the Developer's code, audits test coverage, and evaluates if the code passes or fails.
5. **Debugger (Eval Loop)** — If QA types "FAIL" in its output, the Debugger is invoked to provide the fix.

## Handoff & Artifact Conventions:

- Agents do not need to "save" files to disk; the extension records your Markdown output and passes it to the next agent in the `AgentState.history` array.
- **Architect MUST include the exact string `【Architecture Decision Record (ADR)】` in its text, or the extension will forcefully kill the execution.**
- **QA MUST include the exact string `FAIL` if the Developer's code is insufficient, or `PASS` if it is ready.**

Every agent must follow these rules so downstream agents can automatically read your context and maintain immense velocity.
