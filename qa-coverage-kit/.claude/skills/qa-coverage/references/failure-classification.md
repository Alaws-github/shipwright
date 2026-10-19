# Baseline run and failure classification

This is what separates "the release changed this on purpose" from "the release broke this". Get it wrong in one direction and a regression is absorbed as the new expected behaviour; in the other, an intended change is reported as a bug.

## Baseline run (release mode)

Before writing anything, run the whole suite against the deployed release. From `playwright-qa/scripts/`:

```
npm run setup
npx playwright test --project=chromium
```

**Don't pass `--reporter`** on the baseline run: a CLI reporter replaces the config's reporters, so the JSON report the next step reads is never written, and `qa:baseline` would summarise a stale run. Check the run time `qa:baseline` prints matches the run you just did. The config writes `playwright-report/results.json`. **Extract from it immediately** — every later Playwright command, including `npm run setup`, overwrites it:

```
npm run qa:baseline -- --json
```

It lists every unexpected result (failures and flaky passes) with its test ID, location and first error line, and flags `knownBugNowPassing` for a `test.fail()` test that passed. Save the list into the draft's Baseline section.

If failures start partway through and continue unbroken on a run longer than `<qa.session_minutes>`, suspect session expiry: rerun the failed subset after `npm run setup` before classifying anything.

Never start a run while another is still alive (`QA-LESSONS.md` → `one-run-at-a-time`).

Single-ticket mode runs only the specs for the ticket's area, the same way.

## Known failures are not findings

Exclude from classification:

- Tests declared `test.skip()`, `test.fail()` or `test.fixme()` — `npm run qa:ledger` lists them under "Known failures".
- Tests named in an **open** `scripts/KNOWN-ISSUES.md` entry whose status says they are expected to fail or skip.

But: a `test.fail()` test that **passes** ("expected to fail, but passed"; `knownBugNowPassing` in `qa:baseline`) is a finding — the known bug looks fixed. Check the linked Jira ticket's status and fixVersion (`getJiraIssue`), and report it; removing the marker is an update proposed at Gate 1. The same holds for an open KNOWN-ISSUES entry whose tests now pass (`QA-LESSONS.md` → `verify-the-app-not-just-the-test-result`).

## Classify every other failure

| Class | Evidence required | Action |
|---|---|---|
| **Intended change** | A ticket **in this release** (or the single ticket) describes the new behaviour, and the app shows exactly that behaviour | Propose updating or superseding the test at Gate 1, citing the ticket and AC. Add the ticket's tag to the test when updated |
| **Test mechanics only** | Behaviour is unchanged — the element, text and outcome all still exist — but markup, role, name or position moved so the locator no longer resolves | Fix the locator/page object (no approval needed). The assertion's meaning must not change. Re-run to confirm |
| **Unexplained change — possible regression** | The app's behaviour differs from what the test asserts, and **no ticket in scope accounts for it** | **Do not touch the test.** Report it at Gate 1 and in the release report, linked to the most likely ticket via git hints (which commits touched that route/component), with a confidence level. If nothing links, report it as release-level |
| **Environment or test infrastructure** | Session expiry, fixture drift (`fixtures/test-data.json`), orphaned data from an earlier run, a toolchain crash, or the suite being ahead of the deployed app (`QA-LESSONS.md` → `the-suite-can-be-ahead-of-the-deployed-app`) — the app is fine | Fix the test or fixture; log an `ISS-TS-<slug>` entry in `scripts/KNOWN-ISSUES.md` if it's new |

To tell mechanics from behaviour, look at the live page (snapshot), not only the error. "Locator not found" is mechanics only if the thing it was looking for is still there under a different name or place; if it's gone, it's behaviour.

**When the evidence doesn't clearly point to one class, don't choose.** List it at Gate 1 as **undecided**, with what you observed and the two candidate classes, and let the user decide.

## Attribution for possible regressions

1. Identify the route/component the failing test exercises (its page object and spec).
2. `git log --all --oneline -- <frontend paths for that route/component>` — find commits since the previous release that touched it, and the ticket keys in their messages.
3. If a release ticket's commits touched it → link the regression to that ticket (**high** confidence if the ticket's area is exactly this; **medium** if it touched a shared component).
4. Otherwise → release-level, "no ticket linked".

This gives the ticket its recommendation in the report ("Recommend fail — likely regression in …"), but QA makes the call.
