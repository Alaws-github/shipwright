# QA Lessons — Playwright Suite

Durable patterns and pitfalls for **this test suite** — not an incident log. Each entry is a **rule**: what to watch for and why. The tag shows how it was discovered (`bug` = found or fixed in the suite, `correction` = a user corrected an agent's assumption); the rule applies regardless of origin.

**Scope:** `playwright-qa/` only. Lessons about the app itself belong in the app's own docs.

| File | Holds |
|---|---|
| `QA-LESSONS.md` (this file) | Durable rules — "check for this before writing a test" |
| `scripts/KNOWN-ISSUES.md` | Specific open/resolved test-infrastructure issues (`ISS-TS-<slug>`) |
| `CLAUDE.md` | Project context, conventions, app map, identifier scheme |

**Adding an entry:** append a `###` heading with a short kebab-case slug (slugs merge cleanly across parallel edits; numbers don't). One rule, one `**Why:**`, one `**Applies to:**` if it's not obvious. No incident narration — that belongs in the commit or `KNOWN-ISSUES.md`. If an entry already covers the pattern, extend it. End every entry with `**Enforced by:**` — the check or `qa-ledger` rule that catches it, or `none - <why it needs judgement>`.

These starter entries were carried over from a mature suite because they apply to any Playwright suite against a live environment. Delete any that turn out not to apply here.

---

## Playwright API traps

### playwright-isvisible-is-one-shot `bug`
`locator.isVisible({ timeout })` does **not** wait — the `timeout` option is ignored, so it returns the state at that instant, and right after a `goto` it reliably reads `false` off a loading skeleton. Use a polling wait: `await expect(loc).toBeVisible({ timeout }).then(() => true).catch(() => false)`. Related trap: `await loc.isVisible().then(() => true).catch(() => false)` discards the boolean and always yields `true`. **Why:** both forms look like waits and silently invert cleanup and skip guards. **Applies to:** every `isVisible()` used as a precondition or cleanup guard, especially in `afterAll`, where a broken guard fails invisibly.
**Enforced by:** none - needs review of each guard.

### mcp-screenshot-filenames-resolve-from-the-repo-root `bug`
`browser_take_screenshot`'s `filename` is resolved from the MCP server's working directory — the **repo root** — not from the `--output-dir` in `.mcp.json` (only auto-named files go there). Pass the full path: `playwright-qa/qa-output/screenshots/<run-id>/<file>.png`, and give subagents that exact path. **Why:** files land outside `playwright-qa/` without any error, and the evidence folder looks empty. **Applies to:** every exploration walk and evidence capture.
**Enforced by:** none - after a walk, check `git status` for anything new outside `playwright-qa/`.

### an-expected-fail-test-must-fail-for-the-right-reason `bug`
A `test.fail()` test counts as passing whenever **anything** in it fails — a broken locator or a timeout counts the same as the known bug. Before declaring one, run it once as a plain `test(` and read the error: it must be the assertion that describes the bug, not a locator or setup failure. Put the bug note **above** the docstring. **Why:** an expected-fail test that fails for the wrong reason stays green forever and never turns red when the bug is fixed.
**Enforced by:** check `scripts/utils/qa-ledger.mjs` (docstring placement only); the failure reason needs a manual plain-test run.

### config-load-crash-is-a-toolchain-mismatch-not-a-suite-bug `bug`
If **every** Playwright command fails before any test loads, with a stack inside Playwright's own module loader (e.g. `context.conditions?.includes is not a function`), the cause is the Node/Playwright pairing, not the suite. `PLAYWRIGHT_FORCE_ASYNC_LOADER=1` is the known workaround for Node 22.16 + Playwright 1.61. **Why:** a `^` range on `@playwright/test` lets a fresh install move everyone onto a broken pairing at once. **Applies to:** any failure before the first test is collected — check Node and resolved Playwright versions before touching a spec.
**Enforced by:** none - see `scripts/KNOWN-ISSUES.md` → `ISS-TS-node-registerhooks-conditions-set`.

### a-cli-reporter-replaces-the-config-reporters `bug`
`--reporter=<x>` **replaces** every reporter in `playwright.config.ts`. A run with `--reporter=line` writes no `playwright-report/results.json`, so `npm run qa:baseline` silently reports the *previous* run. **Applies to:** any run whose JSON results are read afterwards — run it without `--reporter`, and check the run time `qa:baseline` prints.
**Enforced by:** none - command-line discipline.

## Shared live environment

### shared-env-tests-must-presweep-their-records `bug`
A test that creates named records on the shared environment must sweep its own leftovers **before** creating new ones, not only in `afterAll`. One skipped `afterAll` leaves an orphan, and orphans can block later runs (duplicate-name or duplicate-import guards). Scope the sweep to the suite's own name prefix so it can never touch a fixture record.
**Enforced by:** none - per-spec judgement.

### the-suite-can-be-ahead-of-the-deployed-app `bug`
The suite runs from a branch that can already carry a later ticket's test updates, while the test environment runs an earlier build. Before classifying a baseline failure as a regression or a mechanics fix, run `git log -3 -- <spec> <page object>` and check whether the last change came with a ticket that isn't in the release under test. If so, classify it as environment and leave the test alone. **Why:** "fixing" it reverts the later ticket's intended change; calling it a regression files a bug against working code.
**Enforced by:** none - needs a git/fixVersion comparison per failure.

### one-run-at-a-time `bug`
Never start a run while another is alive; confirm a previous run has exited by checking its process, not its log. Two concurrent runs sweep each other's records mid-test and write the same `test-results/`, so both runs' failures are meaningless. A background run piped through `tail` shows nothing until it exits.
**Enforced by:** none - process state needs a manual check.

### auth-cache-reuse-must-cover-the-whole-run `bug`
A cached login is safe to reuse only if its remaining lifetime covers the **entire** run about to start. Size `AUTH_REUSE_MINUTES` as *session lifetime − longest run*, and measure the real session lifetime rather than trusting documentation. **Why:** expiry mid-run looks like a wide regression, not an auth problem. **Applies to:** any run started a while after the last `npm run setup`; check the setup line says it signed in rather than "Reusing existing auth state" with a large age.
**Enforced by:** none - the window is configuration.

### verify-the-app-not-just-the-test-result `correction`
A green test isn't proof the app behaves as documented, and a red one isn't proof it doesn't. Before acting on a stale skip, a "feature removed" note or an "open bug" entry, re-check the live app and the linked Jira ticket's status and fixVersion — the note records what was true when written. **Why:** a skip whose reason has reversed keeps passing as a skip forever while coverage is lost.
**Enforced by:** none - needs a live check.

## Writing assertions

### wait-on-the-thing-that-actually-changes `bug`
After an action, wait on the specific state it changes — not on an element that's merely present afterwards. An element that exists on both the old and new page resolves instantly against the page being left; a list read before its fetch resolves returns the placeholder count. Wait on the URL for navigation, and poll for the **content** (`expect.poll(() => titles.count()).toBeGreaterThan(n)`), not the container, since skeleton cards count as containers.
**Enforced by:** none - judgement per assertion.

### an-action-can-reload-the-whole-page `bug`
Before chaining actions after a mutation, check whether the mutation reloads the page. Anything done during a reload is wiped or fails with "Execution context was destroyed", and the symptom lands on the next step or the next test. Arm `page.waitForEvent('load')` **before** the click and await it after — but only for actions that really reload, since awaiting a load that never comes hangs.
**Enforced by:** none - which actions reload has to be observed per action.

### hydration-can-wipe-early-input `bug`
On server-rendered React apps, the client re-render after hydration can reset a controlled input, so a value typed right after `goto` can silently disappear. In search/filter helpers, re-type inside the polling wait when `inputValue()` no longer equals the term. **Why:** it reads as "search is broken", never as "my text was erased".
**Enforced by:** none - implemented in page-object helpers.

### prefer-behaviour-assertions-size-coverage-to-risk `correction`
Decide how many cases a change needs from its risk, not a fixed quota, and make each case assert an **outcome** — a value, a URL parameter, a count, the result of an action — rather than that an element is visible. One render check per page is enough; spend the rest on flows and business rules. Calculation correctness belongs in backend tests; here, confirm it's wired up and displayed for the right inputs. **Why:** presence checks break on cosmetic markup changes and rarely catch a regression.
**Enforced by:** none - reviewed at Gate 2.

### never-disambiguate-with-a-class-you-dont-own `bug`
When two elements render the same text, disambiguate by structure whose meaning you control (an ancestor container, a role, a label), not by a third-party library's internal class name. When the library changes, a `:not(.lib-class)` guard silently stops excluding anything and fails on a different test than the one that changed.
**Enforced by:** none - locator review.

## Editing the suite

### scripted-edits-must-not-stop-at-first-match `bug`
When editing specs by script, anchor each replacement on something unique to the target test (its `test('<ID> …')` line), assert the expected number of matches before writing, and re-read the edited region afterwards. A first-match edit can rewrite the wrong test — and if that test is skipped, no run will ever reveal it.
**Enforced by:** none - edit discipline.

### generated-docs-must-ignore-line-endings `bug`
Any script that regenerates or compares tracked text must normalise line endings before comparing and write back in the file's own ending. On Windows checkouts with `core.autocrlf=true`, a byte-for-byte staleness check otherwise fails on every run.
**Enforced by:** check `scripts/utils/qa-ledger.mjs`.
