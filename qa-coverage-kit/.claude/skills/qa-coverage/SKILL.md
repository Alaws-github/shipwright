---
name: qa-coverage
description: Bring the black-box Playwright suite in `playwright-qa/` up to date with what shipped — for a whole release (by Jira fixVersion), a single Jira ticket, or a feature someone tested manually. Explores the live test environment, compares what shipped against what the tickets intended, separates intended changes from possible regressions, drafts and writes tests, runs them to green, reconciles the suite's generated docs, publishes a per-ticket QA coverage report to Confluence (release mode), and — after the QA engineer's decisions — transitions tickets, comments with evidence, and files linked bugs. Use when the user says "qa-coverage", "QA the release", "cover this release", "add tests for PROJ-123", "update the suite for this ticket", or "I manually tested X, add coverage". Accepts `release <fixVersion>`, a Jira ticket key, or a quoted description of a manual test.
disable-model-invocation: true
allowed-tools: Read, Grep, Glob, Agent, Edit(/playwright-qa/**), Write(/playwright-qa/**), Bash(git log:*), Bash(git show:*), Bash(npm run qa:ledger:*), Bash(npm run qa:baseline:*), Bash(npm run setup:*), Bash(npx playwright test:*), mcp__claude_ai_Atlassian__getAccessibleAtlassianResources, mcp__claude_ai_Atlassian__getJiraIssue, mcp__claude_ai_Atlassian__searchJiraIssuesUsingJql, mcp__claude_ai_Atlassian__getTransitionsForJiraIssue, mcp__claude_ai_Atlassian__getJiraIssueTypeMetaWithFields, mcp__claude_ai_Atlassian__getConfluencePage, mcp__claude_ai_Atlassian__searchConfluenceUsingCql, mcp__playwright__browser_navigate, mcp__playwright__browser_navigate_back, mcp__playwright__browser_snapshot, mcp__playwright__browser_take_screenshot, mcp__playwright__browser_click, mcp__playwright__browser_type, mcp__playwright__browser_press_key, mcp__playwright__browser_select_option, mcp__playwright__browser_fill_form, mcp__playwright__browser_hover, mcp__playwright__browser_wait_for, mcp__playwright__browser_handle_dialog, mcp__playwright__browser_tabs, mcp__playwright__browser_console_messages, mcp__playwright__browser_network_requests, mcp__playwright__browser_close
---

# QA Coverage

Keep the Playwright suite in `playwright-qa/` true to what is deployed on the test environment (`qa.test_url`), and turn the QA engineer's decisions into Jira actions. The unit of work is a **release**; a single ticket or a manual test is a release of one.

```
/qa-coverage release "2026-09 R4"     every ticket with that fixVersion — primary mode
/qa-coverage PROJ-327                 one ticket (hotfix, re-check, held ticket)
/qa-coverage "<what I tested>"        a feature tested manually, no ticket
```

The ticket says what was intended; the app says what exists. Where they disagree, the app wins and the disagreement is a **finding** reported to the user — never resolved silently in either direction.

Project values come from `workflow.toml` at the repo root. In this skill a placeholder such as `<jira.qa_status>` means that value. Optional sections (`[features]`, `qa.release_tracking_label`, `confluence.qa_reports_page`) switch their behaviour off when empty — each reference file says what happens then.

## Non-negotiables

1. **Never write a test for behaviour you have not observed in the live app.** A ticket that is Done may not be deployed. Cases written from ticket text alone read perfectly and test nothing.
2. **Never invent or renumber acceptance criteria.** No usable ACs in the ticket → a question to the user, not a guessed case.
3. **The how-vs-what rule.** You may change **how** a test finds things (locators, waits, page-object plumbing) on your own. You may change **what** a test expects only when a ticket in scope describes the new behaviour, or the user approves it at a gate. See `references/failure-classification.md`.
4. **Never weaken an assertion to get green.** A genuine app failure is a finding.
5. **Writes outside the repo happen only after Gate 3, only as an approved batch.** Step 12 publishes the report to Confluence; step 13 makes the Jira actions (bugs, transitions, comments, links). Before any write, list every one — ticket, action, exact content — and wait for approval. None of these tools is pre-approved, so each also raises a permission prompt. Before Gate 3, Jira and Confluence are read-only.
6. **Credentials never enter context or files.** Never read `playwright-qa/scripts/.env` or `fixtures/auth.json` (the settings and hook deny both). Never fabricate domain-specific test data; ask, or mark the case BLOCKED. Never write a secret to `test-data.md` — record the `.env` variable name instead.
7. **Repo writes only inside `playwright-qa/`.** QA lessons go to `playwright-qa/QA-LESSONS.md`.
8. **Gates are hard stops, and the draft file is where the user answers.** At each gate, write the full gate section — with its decision fields — to the draft, post a short summary and the draft's path in chat, and stop. The user records decisions by **editing the draft**, then replies in chat. Re-read the draft before acting. An unmarked decision field is **not** approval: ask about it.

**Pre-approved tools.** `allowed-tools` pre-approves; it does not restrict. Edits and writes are pre-approved **only inside `playwright-qa/`**. Jira and Confluence writes are deliberately not pre-approved.

**Approval.** Invoking this skill is the user's permission to run up to Gate 1, writing only evidence and draft paths (`playwright-qa/qa-output/screenshots/`, `playwright-qa/qa-output/drafts/`). The user's reply after completing a gate's decisions approves the steps up to the next gate. Nothing beyond the current gate runs without that reply.

## Step 0 — Preflight

Run from the repo root; test and ledger commands run from `playwright-qa/scripts/`.

1. **Read** `workflow.toml`, `playwright-qa/CLAUDE.md` and `playwright-qa/QA-LESSONS.md` in full. The last two are the only source for Playwright traps, the app map and suite conventions — this skill does not restate them.
2. **Browser tools.** Confirm the `mcp__playwright__*` tools are available. If not, stop: "Playwright MCP isn't loaded — see `playwright-qa/README.md` → Playwright MCP."
3. **Ledger.** `npm run qa:ledger -- --check` must exit 0. If it fails, stop and report the errors — do not build on an inconsistent suite.
4. **Login.** `npm run setup`, then `browser_close`, then navigate. The MCP browser reads `fixtures/auth.json` only when it launches, and a login lasts about `<qa.session_minutes>` minutes — repeat this sequence before each area walk and whenever you land on the login page.
5. **Resume.** Look for `playwright-qa/qa-output/drafts/<run-id>.md` (run-id = the fixVersion slug, ticket key, or `MAN-<slug>`). If one exists, show its status table and offer: "Resume `<run-id>` at `<last gate passed>`?" Resume only if the user agrees.
6. **Atlassian.** `getAccessibleAtlassianResources` for `cloudId` (site `jira.site`).

## Release flow

| # | Step | Detail |
|---|------|--------|
| 1 | **Intake** — fetch every ticket in the fixVersion, including held tickets from an earlier run | `references/intake-release.md` |
| 2 | **Triage** each ticket: testable / too thin / no browser-visible change / already covered | `references/intake-release.md` |
| 3 | **Baseline run** — full suite against the deployed release; classify every unexpected failure | `references/failure-classification.md` |
| 4 | **Group** testable tickets by area (route/page), using git and route hints | `references/intake-ticket.md` |
| 5 | **Explore** each area in the live app, one area at a time; compare each ticket's intent with what shipped | below |
| 6 | **Gate 1 — coverage impact** | `references/templates.md` |
| 7 | **Draft** cases and script plan per area → **Gate 2** | `references/templates.md` |
| 8 | **Write** tests and page-object changes | below |
| 9 | **Run to green**, then regression-run every affected spec | below |
| 10 | **Reconcile** — ledger, KNOWN-ISSUES, docs; stage evidence for attaching | `references/reconcile.md` |
| 11 | **Gate 3 — decisions**: the user marks pass / fail / hold per ticket, file / not a bug / known per finding, and the release sign-off | `references/templates.md` |
| 12 | **Publish** the report to Confluence (skipped when `confluence.qa_reports_page` is empty — the report stays in the draft for the user to copy) | `references/templates.md` → Publishing |
| 13 | **Jira actions** — bugs first, then transitions and comments | `references/jira-actions.md` |

**Single-ticket mode** runs steps 1–2 for one ticket (`references/intake-ticket.md`), skips the full baseline (run only the specs the ticket's area touches, and classify their failures the same way), then steps 4–11 and 13. There is no Confluence report: step 13's comments carry the evidence text directly. A held ticket is handled as `references/jira-actions.md` → Held tickets describes.

**Manual-test mode** replaces intake with `references/intake-manual.md`, then runs steps 5–10 with Gates 1 and 2. There is no ticket, so no Gate 3 or Jira actions; broken behaviour found is listed for the user to file. At Gate 2 the ACs are derived from observation and must be confirmed by the user — what the app does is not automatically what it should do.

## Step 5 — Explore (per area)

Scoped, not a crawl. Delegate each area's walk to one subagent at a time (there is a single MCP browser, so never two in parallel); it returns the structured summary in `references/templates.md` → "Area walk return". Instruct it with the non-negotiables above and these rules:

- Refresh the login first (Step 0.4).
- Navigate the candidate routes from the git/route hints. Per page: navigate → snapshot once → screenshot key states; extract everything needed from that one snapshot.
- Walk the happy path as a user would, then visible edges: empty state, validation, permission boundaries, error path, reload/back.
- For every element a test will touch, capture accessible role and name, stable attributes, and timing (async load, skeleton).
- Save evidence with `browser_take_screenshot` and the **full repo-relative path** `playwright-qa/qa-output/screenshots/<run-id>/<TICKET>-<state>.png` — the filename resolves from the repo root, not the MCP output dir (`QA-LESSONS.md` → `mcp-screenshot-filenames-resolve-from-the-repo-root`). Screenshot every discrepancy and every broken behaviour — they become the evidence for Jira comments and bugs.
- **Not found → stop that ticket, don't hunt.** Report routes checked, what was found instead, and the likely reason (not deployed — code merged but route absent is evidence of this / different route / permission-gated / renamed).
- Classify form fields as generic or domain-specific; list every domain-specific value needed. Submit nothing partially filled.

Record every ticket-vs-app discrepancy and anything broken in the draft as a numbered **finding** (`F1`, `F2`, …) with its ticket, the AC it relates to, what was observed, and its screenshot.

## Step 8 — Write

- **IDs** are `<TICKET>-<n>`, numbered within the ticket: next `n` = highest existing for that ticket + 1 (`npm run qa:ledger -- --tickets <KEY>`). Manual work uses `MAN-<area-slug>-<n>`. IDs are never reused or renumbered.
- **Docstring and tags** exactly as `playwright-qa/CLAUDE.md` → Identifiers: `<ID>: <title> | <ticket> AC<n> | <Type> | <Priority>` plus a one-sentence `Verifies:` line; `{ tag: ['@<TICKET>'] }` for the originating ticket, and add `@<TICKET>` to any existing test a ticket changes.
- **Page Object Model.** No locators in specs. Extend existing page objects; add a class only for a genuinely unmodelled page. Name methods for what the user does.
- **Append, don't rewrite.** Add tests to the spec file for the area. Change an existing test only for a Gate-approved update or a locator-level fix.
- **Coverage sized to risk, assertions on outcomes** — `QA-LESSONS.md` → `prefer-behaviour-assertions-size-coverage-to-risk`.
- Before writing any locator or wait, re-check `QA-LESSONS.md` — its traps are the ones this suite has already paid for.

## Step 9 — Run to green

From `playwright-qa/scripts/`: `npx playwright test <spec> --project=chromium --grep "<ID>|<ID>" --reporter=line`.

- **At most 3 fix attempts per failing test.** Then stop and report the test, the last error, and what was tried.
- Diagnose before editing: locator timeout → selector or async load (never a blind `waitForTimeout`); wide unrelated failures on a long run → session expiry, rerun a subset; record-not-found → `fixtures/test-data.json` drift, verify live; passes alone, fails in suite → shared state, never add a retry.
- A failure caused by the app being broken is a finding, not a test to fix (non-negotiable 4) — add it to the findings list with a screenshot.
- **Regression run:** after the new tests pass, run every spec that imports a page object you changed (grep `scripts/tests/` for the class name). Classify any new failure with `references/failure-classification.md`.
- Report actual results with output. Never claim green without the run.

## Finishing

After step 13 (or the last step of the mode): delete the run's draft, delete the MCP's auto-named files from `screenshots/` (`page-*.yml`, `console-*.log`), keep `screenshots/<run-id>/to-attach/` until the user has attached the evidence, and print the completion summary from `references/templates.md`.
