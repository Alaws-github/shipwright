# Setting up /qa-coverage in a new project

This kit adds the `/qa-coverage` Claude Code skill and the Playwright suite it maintains to a project. The skill takes a Jira release (fixVersion), a single ticket or a manual test. It explores the deployed test environment, writes and runs Playwright tests, and, after three QA review gates, publishes a Confluence report and makes the Jira changes QA approved.

This file is setup instructions only. Don't copy it into the target repo.

## What's in the kit

| Path | Goes to | Purpose |
|---|---|---|
| `.claude/skills/qa-coverage/` | repo root | The skill: `SKILL.md` plus 7 reference files it loads per step |
| `.claude/settings.json` | repo root (merge) | Denies the Read tool on the suite's credential files and registers the hook |
| `.claude/hooks/guard-secret-reads.mjs` | repo root | Blocks shell commands (`cat`, `Get-Content`, `cp`…) that touch those same files |
| `.mcp.json` | repo root (merge) | The Playwright MCP server the skill explores the app with |
| `workflow.toml` | repo root (merge) | Project values: Jira site/project/statuses, test URL, Confluence pages |
| `playwright-qa/` | repo root | The suite: config, auth setup, page objects, ID ledger, baseline script, docs |

## Prerequisites

- **Node 20+** and **Google Chrome** on the QA analyst's machine. The kit was verified on Node 22.22 with Playwright 1.64.1.
- **Claude Code** opened at the target repo's root.
- **Atlassian connector** connected in claude.ai (Settings → Connectors), with access to the Jira project and the Confluence space.
- A **QA account** on the test environment, and the Jira workflow's names for three statuses: "in QA", "passed QA" and "failed QA".

## Steps

### 1. Copy the files

Copy everything except `SETUP.md` into the target repo's root. If the repo already has `.claude/settings.json`, `.mcp.json` or `workflow.toml`, merge them rather than overwrite: add the two `deny` entries and the `PreToolUse` hook entry, add the `playwright` server, and add the TOML sections.

The skill assumes the suite lives at `playwright-qa/`. To use another folder name, search and replace `playwright-qa` across the kit (the skill, settings, hook, `.mcp.json` and the suite's docs) before copying.

### 2. Fill in `workflow.toml`

Set every value marked `REQUIRED`. Then:

- **`jira.qa_status` / `qa_passed_status` / `qa_failed_status`**: the exact status names from the Jira workflow. The skill matches transitions by target-status name.
- **`[jira.priority_map]`**: map your Jira priority names to Critical / High / Medium / Low.
- **`qa.frontend_paths`**: the folders where frontend code lives. Commits that touch them mark a ticket as browser-visible. Leave it empty if the app's code isn't in this repo.
- **`[confluence]`**: leave all three values empty to skip Confluence (the report then stays in the run's draft file). To publish, get the space ID from the `getConfluenceSpaces` tool and the parent page ID from the page's URL.
- **Optional**: set `qa.release_tracking_label` to record the release sign-off on a tracking ticket, and `[features]` if tickets are generated from spec files with permanent AC IDs.

### 3. Check the Atlassian tool names

The skill's `allowed-tools` line pre-approves Jira and Confluence *read* tools named `mcp__claude_ai_Atlassian__…`. That prefix comes from the claude.ai connector called "Atlassian". If the project uses a different Atlassian MCP server, run `/mcp` in Claude Code to see its tool prefix, and replace `mcp__claude_ai_Atlassian__` in `SKILL.md`'s frontmatter. Write tools are left off that line on purpose, so they always prompt for permission.

### 4. Set up the suite

```bash
cd playwright-qa/scripts
npm install
npx playwright install chromium
cp .env.example .env
```

Fill in `.env` yourself (`BASE_URL`, `QA_EMAIL`, `QA_PASSWORD`, `AUTH_REUSE_MINUTES`). The agent is blocked from reading it.

Then adapt the three files that depend on the app:

- **`scripts/utils/auth.ts`**: the login route and form locators.
- **`scripts/pages/HomePage.ts`**: an element that renders only once the landing page is ready.
- **`scripts/playwright.config.ts`**: `globalTimeout`, if the suite grows. Keep `AUTH_REUSE_MINUTES` + the longest run below the session lifetime.

Verify:

```bash
npm run setup          # signs in, writes fixtures/auth.json
npm test               # MAN-smoke-1 should pass
npm run qa:ledger -- --check
```

### 5. Fill in the app map

In `playwright-qa/CLAUDE.md` → **App map**, describe how source files map to routes, which pages look alike, which controls keep their state in the URL, the UI library's quirks, and the test accounts. The skill uses this to find what a ticket changed. Then set **Last verified** to today's date. In `QA-LESSONS.md`, delete any starter lesson that doesn't apply to this app.

### 6. Load the Playwright MCP

Restart Claude Code at the repo root and approve the `playwright` MCP server when asked. Check that it's loaded: `/mcp` should list `playwright` with its `browser_*` tools.

### 7. Commit

Commit `.claude/`, `.mcp.json`, `workflow.toml` and `playwright-qa/`. The suite's `.gitignore` already keeps out `.env`, `fixtures/auth.json`, drafts, screenshots and Playwright output.

## First run

Start with one ticket that's currently in the QA status: `/qa-coverage PROJ-123`. This runs the whole flow without the release baseline or the Confluence report. Then run a whole release: `/qa-coverage release "<exact fixVersion name>"`.

At each gate the skill writes a section with checkboxes into `playwright-qa/qa-output/drafts/<run-id>.md` and stops. Tick the boxes in that file, then reply in chat. Nothing is written to Jira or Confluence until Gate 3, and then only after you approve the exact list of changes. `playwright-qa/README.md` describes the analyst's side of the process; share it with the QA team.

## How this differs from the Anser original

| Anser version | This kit | Why |
|---|---|---|
| Calls `/bug-triage` to file bugs | Files bugs itself (`references/jira-actions.md` → Filing bugs): duplicate search, a triage table you confirm, create, link | No second skill to port; the code-level root-cause search is dropped |
| Legacy `TC-nnn` IDs, reserved IDs, the legacy suite | Only `<TICKET>-<n>` and `MAN-<slug>-<n>` | A new suite has no history to carry |
| V8 code-coverage fixture and monocart reporter | Left out | Optional. Port `fixtures/coverage.fixture.ts` later if you want coverage numbers |
| Release tracking ticket and feature specs required | Optional, switched on in `workflow.toml` | They depend on Anser's release pipeline and `/write-spec` |
| Anser routes, priority scheme, timings in the skill text | Moved to `workflow.toml` and `CLAUDE.md` → App map | Project-specific values live in config |
| Python secret-guard hook (`uv`) | Node hook | Node is already required by Playwright |
