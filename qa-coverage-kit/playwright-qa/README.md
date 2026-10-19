# QA Playwright Suite

Black-box end-to-end tests for the app deployed at the test environment (`qa.test_url` in `workflow.toml`), kept current one release at a time with the `/qa-coverage` Claude Code skill.

## How the QA process works

After a release is deployed to test, the QA analyst runs `/qa-coverage` in Claude Code from the repo root. The skill does the exploration, test writing, bookkeeping and Jira/Confluence updates; the analyst makes every decision at three review gates, including signing off the release.

**It does:** read the release's tickets and sort them (testable, too thin, no browser-visible change, already covered); run the whole suite as a baseline and classify every unexpected failure (intended change, broken locator, possible regression, environment, undecided); explore each changed area in the live app and record every mismatch as a numbered finding with a screenshot; draft tests for approval, write them, run them to green (at most 3 fix attempts each) and re-run every spec it touched; then record your decisions, publish the report and make the Jira changes you approve.

**It doesn't:** write a test for behaviour it hasn't seen, invent acceptance criteria, weaken an assertion, change what an existing test expects without a ticket or your approval, write to Jira or Confluence before Gate 3, upload attachments or rank the backlog (it lists both for you), or check calculations, performance or security.

### Validating a release

You answer every gate **in the draft file** `qa-output/drafts/<run-id>.md`: tick the boxes, add notes or edit the drafted cases, then reply in chat ("Gate 1 done"). Anything left unticked is asked about, never assumed.

1. **Run** `/qa-coverage release "<fixVersion>"` — the exact Jira version name.
2. **Gate 1 — what changed.** Tick the tickets to proceed with; decide each *undecided* failing test (intended change or regression); answer the questions.
3. **Gate 2 — the new tests.** Approve or reject each proposed test and the script plan.
4. **The skill builds and runs** the tests, regenerates the docs, and stages evidence in `qa-output/screenshots/<run-id>/to-attach/`.
5. **Gate 3 — your decisions.** Pass / fail / hold per ticket; file bug / not a bug / known per finding, and whether it blocks; the release sign-off; approve the report.
6. **Publish and act.** The skill publishes the report to Confluence (if configured), files bugs (duplicate-checked, linked to the ticket), then lists every Jira change and makes them once you approve.
7. **Finish by hand:** move new bugs to the top of the backlog, attach the screenshots listed in `to-attach.md`, and commit the suite changes.

**Other uses:** `/qa-coverage PROJ-123` for one ticket (no Confluence report); `/qa-coverage "<where it is, what you did, what you saw>"` for something you tested manually (no Jira actions).

---

## Setup

```bash
cd scripts
npm install
npx playwright install --with-deps chromium
cp .env.example .env      # then fill in the values
npm run setup             # signs in and writes fixtures/auth.json
npm test
```

### Playwright MCP (for Claude Code sessions)

The repo-root `.mcp.json` defines a `playwright` MCP server that Claude Code uses to explore the live app:

- **First use:** approve the `playwright` server when Claude Code asks, then restart the session so its browser tools load.
- **Browser:** installed Google Chrome, headless, 1280×720.
- **Login:** the browser loads `scripts/fixtures/auth.json` **when it launches**. For a fresh login: `npm run setup`, then close the MCP browser (`browser_close`) so the next navigation relaunches it.
- **Output:** snapshots and screenshots go to `qa-output/screenshots/` (gitignored). Clear them when a run is finished.
- **Watching the browser:** add a local-scope server named `playwright` with the same arguments minus `--headless`; a local entry takes precedence.

---

## Running tests

From `scripts/`: `npm test` (whole suite), `npm run test:headed`, `npm run test:ui`, `npm run report`. One test: `npx playwright test --grep "PROJ-327-1"`.

After any hand change to specs: `npm run qa:ledger -- --write`, then `npm run qa:ledger -- --check` before committing.

### By spec file

<!-- qa-ledger:spec-table:start -->
| Command | Spec file | Test IDs | Tests |
|---|---|---|---|
| `npm run test:smoke` | `core/smoke/smoke.spec.ts` | MAN-smoke-1 | 1 |
<!-- qa-ledger:spec-table:end -->

---

## Permanently Skipped Tests

| Test | Reason | Issue |
|---|---|---|

---

## QA output

| File | Maintained by |
|---|---|
| `qa-output/test-index.md` | Generated (`qa:ledger`) |
| `qa-output/jira-test-mapping.md` | Generated (`qa:ledger`) |
| `qa-output/test-cases.md` | Hand — prose for cases with no automation |
| `qa-output/features-and-workflows.md` | Hand — `F-<slug>` / `WF-<slug>` entries |
| `qa-output/user-stories.md` | Hand — `MAN-<slug>` stories from manual-test runs |
| `qa-output/test-data.md` | Hand — non-secret test data, and the `.env` variable names of secrets |
