# Common Agent Rules (Single Source for agent authors)

This file lists the canonical, repository-wide rules that every agent definition in `.github/agents/` should follow or reference. Agents may include a single-line pointer to this file (for discoverability) but MUST NOT diverge from these rules without explicit maintainer approval.

Mandatory rules:

 - Limit Duplication: Agents should avoid duplicating rules or code across agent files; instead reference this `COMMON_RULES.md` as the canonical source. When duplication is necessary for discoverability, keep references short and point back to this file.

How to reference:

Add a single-line pointer inside your agent file's `Agent Configuration` section, for example:

    See .github/agents/COMMON_RULES.md for canonical rules.

This file is the canonical set of rules. Do not duplicate or alter these rules inside agent files; instead reference this file so the enforcement workflow can verify compliance.
