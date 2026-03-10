# Webnav Copilot Orchestrator

The `@webnav` Copilot Chat Participant enables you to harness a Multi-Agent system directly inside your VS Code workspace.

Instead of relying on a single back-and-forth LLM prompt, this extension routes your task through a specialized pipeline of Markdown-defined agents:
1. **Mapper** - Scopes the problem and creates a feature branch.
2. **Architect** - Writes an Architecture Decision Record (ADR) before any code is touched.
3. **Developer** - The "Linus Torvalds" persona that implements the code perfectly according to the ADR.
4. **QA** - Evaluates the code against tests and defines Acceptance Criteria.
5. **Optimizer** - Cleans up tech-debt and applies continuous self-improvement to the agent rules.

## Features
- **Local Source of Truth**: The extension reads from standard Markdown files in your workspace (`agents/*.md`). If you edit the rules, the agents update their behavior instantly.
- **Autonomous File Output**: The extension parses agent responses and automatically writes source code `typescript:src/my/file.ts`, documentation, and tests directly to your filesystem.
- **Copilot Powered**: Runs entirely on your existing GitHub Copilot subscription. No external API keys needed!

## How To Use
1. Ensure you have the GitHub Copilot extension installed.
2. Open a workspace that contains an `agents/` folder with your Markdown definitions.
3. Open the Copilot Chat window and type:
   `@webnav build a new login system`

The orchestrator will take over, streaming the thought processes and autonomously writing the required files.
