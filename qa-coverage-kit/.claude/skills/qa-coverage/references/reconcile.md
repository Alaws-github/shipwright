# Reconcile

Only after the tests are green (or every remaining failure is reported and approved as a known failure). Most bookkeeping is generated; the rest is short and specific.

## Generated — never hand-edit

From `playwright-qa/scripts/`:

```
npm run qa:ledger -- --write
npm run qa:ledger -- --check        must exit 0
```

This regenerates `qa-output/test-index.md`, `qa-output/jira-test-mapping.md`, and the marker blocks in `playwright-qa/CLAUDE.md` (header) and `README.md` (spec table). If `--check` reports an ID or docstring error, fix the spec — not the generated output.

## Hand-maintained — only when the trigger applies

| File | Update when | What |
|---|---|---|
| `scripts/KNOWN-ISSUES.md` | A new test-infrastructure issue was root-caused, or an existing entry's status changed (e.g. its tests now pass) | New `## ISS-TS-<slug>: <title>` entry; or the existing entry's `**Status**` line. App bugs are **not** added here — they go to Jira |
| `qa-output/test-cases.md` | A new case is **not automated** (BLOCKED on data, manual-only) | Its prose, under its ID |
| `qa-output/test-data.md` | The user supplied domain-specific values | Record non-secret values, or the `.env` variable name for a secret — never the secret |
| `qa-output/features-and-workflows.md` | A feature or workflow appeared or materially changed | New `F-<slug>` / `WF-<slug>` entry, or amend the existing entry |
| `qa-output/user-stories.md` | Manual-test mode only | `### MAN-<slug>` story with the user-confirmed ACs |
| `README.md` "Permanently Skipped Tests" | A `test.skip()` was added or removed | The row, with its reason and issue ID |
| `playwright-qa/QA-LESSONS.md` | A defect in the suite was fixed or spotted, or the user corrected an assumption | A rule-shaped entry per the file's own format — immediately, not at the end |
| `playwright-qa/CLAUDE.md` "Last verified" | A convention, setup step, app-map entry or structure changed | The date only; counts are generated |

## Stage evidence for attaching

The Atlassian tools can't upload attachments to Jira or Confluence, so the user attaches evidence by hand. Copy every screenshot referenced by a finding or a discrepancy from `screenshots/<run-id>/` into `screenshots/<run-id>/to-attach/<KEY>/NN-<what-it-shows>.png` (numbered in the order they'll be read), and write `to-attach.md` beside them (`templates.md` → Evidence manifest). Fill in the bug keys after step 13.

## Before calling it done

- `--check` exits 0.
- Every test changed for an intended behaviour change carries the authorizing ticket's `@<KEY>` tag.
- Every possible regression and undecided item from Gate 1 appears in the report (release mode) or the completion summary — none silently dropped.
- The draft's status table shows every ticket reconciled or explicitly stopped with a reason.
- `git status` shows nothing new outside `playwright-qa/`.
