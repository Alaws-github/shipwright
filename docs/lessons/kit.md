# Lessons: kit

Read when changing anything in `qa-coverage-kit/` outside `playwright-qa/`: the skill, its reference files, `.claude/settings.json`, the hook, `.mcp.json` or `workflow.toml`. Suite lessons live in [QA-LESSONS.md](../../qa-coverage-kit/playwright-qa/QA-LESSONS.md), because they ship with the kit.

## Portability

### the-kit-is-self-contained `design`
Everything under `qa-coverage-kit/` (except `SETUP.md`) is copied into another repository. It must not link to or depend on files outside the kit (the root `docs/`, `CLAUDE.md`, `AGENTS.md` or `scripts/`). Project-specific values belong in `workflow.toml`, not in the skill.
**Enforced by:** none - read the diff for `../` links and root paths.

### the-suite-folder-name-is-a-contract `design`
The skill, settings, hook, `.mcp.json` and the suite's docs all assume the suite lives at `playwright-qa/`. Renaming it means a search and replace across all of them in one change (SETUP.md step 1 says so).
**Enforced by:** none - search for `playwright-qa` before renaming.

## Safety

### secret-guard-matches-deny-rules `bug`
`.claude/settings.json` denies the Read tool on the suite's credential files, but a shell command (`cat`, `Get-Content`, `cp`) isn't covered by a Read rule. The `guard-secret-reads` hook closes that gap, so every denied path must also be blocked by the hook, and harmless commands must still pass.
**Enforced by:** check secret-guard-covers-deny-rules (scripts/checks/repo-checks.mjs runs the real hook).

### write-tools-always-prompt `design`
The skill's `allowed-tools` line pre-approves read tools only. Jira and Confluence write tools stay off it, so every transition, comment, bug and page needs the person's approval at the moment it happens.
**Enforced by:** none - review the `allowed-tools` line in any change to SKILL.md.

### pin-the-mcp-server-version `bug`
`.mcp.json` pins `@playwright/mcp` to an exact version. A floating version lets a fresh `npx` move everyone onto a release with changed tool names or flags at once.
**Enforced by:** none - review `.mcp.json` changes.

### humans-decide-the-agent-prepares `design`
The skill drafts tests, classifications and Jira actions; a person answers each gate in the draft file before anything is written to Jira or Confluence. Never add a path that acts on Jira without a gate answer. See `docs/design-decisions.md` section 1.
**Enforced by:** none - read SKILL.md step order in any change.
