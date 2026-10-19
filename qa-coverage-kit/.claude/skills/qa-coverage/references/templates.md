# Templates

## Draft file

`playwright-qa/qa-output/drafts/<run-id>.md` (gitignored). It is the resume state **and the place the user answers every gate**: each gate section carries decision fields the user fills in by editing the file, then says so in chat. Re-read the file before acting on a gate. Deleted when the run completes.

```markdown
# qa-coverage draft — <run-id>
Mode: release <fixVersion> | ticket <KEY> | manual <slug>
Started: <date> | Last gate passed: none | Gate 1 | Gate 2 | Gate 3

> **How to answer a gate:** tick the boxes (`[x]`), add notes, or edit drafted cases directly in this file.
> Then reply in chat (e.g. "Gate 1 done"). Anything left unticked is asked about, never assumed.

## Status
| Ticket | Title | Jira status | Triage | Area | Explored | Drafted | Green | Reconciled | Decision | Jira done |
|---|---|---|---|---|---|---|---|---|---|---|

## Baseline
<run summary; extracted unexpected failures>

## Findings
| ID | Ticket / AC | Observed | Evidence |
|---|---|---|---|
| F1 | PROJ-327 AC2 | … | `PROJ-327-total-missing.png` |

## Areas
### <area> — routes: <…>
<walk summary returned by the subagent>

## Gate 1 — coverage impact
## Gate 2 — drafts
## Gate 3 — decisions
## Release report
## Jira actions
```

Chat message at every gate — short, because the detail is in the file:

> "Gate <n> ready — <one-line summary: counts, anything needing a decision>. Please review and mark your decisions in `<draft path>` § Gate <n>, then reply here."

## Area walk return (subagent → orchestrator)

```markdown
Area: <area> | Routes walked: <…> | Screenshots: <file names>
Per ticket:
- <KEY> — found at <route> | not found (<routes checked>; likely <reason>)
  Matches ticket: yes | discrepancies: <each, with AC reference and screenshot>
  Observed beyond the ticket: <edge cases, error states, surprises>
Elements (for tests): <role + accessible name | stable attributes | timing notes> …
Domain-specific data needed: <field: why> … | none
Broken behaviour seen: <one line each, with screenshot> | none
```

## Gate 1 — coverage impact

```markdown
## Gate 1 — coverage impact
Tickets: <n> (<n> testable, <n> too thin, <n> no browser change, <n> already covered, <n> not in <jira.qa_status>, <n> held)
Baseline: <passed>/<total> — <n> unexpected: <n> intended, <n> mechanics, <n> possible regression, <n> environment, <n> undecided

### Tickets — proceed?
- [ ] PROJ-327 — testable, found at /orders/:id, matches ticket — New 2 · Update 1 · Invalidated 0      Notes:
- [ ] PROJ-412 — too thin: description has no ACs ("<quoted text>") — **answer:**
- PROJ-401 — no browser-visible change (commits touch services/billing only) — reported, no action

### Existing tests
- PROJ-210-3 — **undecided**: Orders table lost its "Status" column; PROJ-327 touched this page but doesn't mention it
  [ ] intended change (update the test)   [ ] regression (leave it, report it)      Notes:
- MAN-users-2 — **possible regression**, linked to PROJ-390 (medium): Users table no longer sorts by Role — reported, test untouched
- PROJ-180-1 — mechanics only (heading moved into a card) — locator will be fixed

### Known bugs now passing
- [ ] PROJ-150-2 (PROJ-758, Done in 2026-09 R4) — remove the expected-failure marker?

### Questions
- Test data for PROJ-327 AC3 — an order with no line items: **answer:**
```

Rules: every *undecided* item and every *too thin* ticket needs an explicit answer; the **Invalidated** count — existing tests now asserting replaced behaviour — is the one most easily skipped, so list each by ID.

## Gate 2 — drafts (per area)

```markdown
## Gate 2 — drafts
### Area: order-detail

#### PROJ-327-1: Order total includes tax
[ ] approve   [ ] reject      Notes:
**Ticket**: PROJ-327 AC2 | **Type**: Positive | **Priority**: High
**Verifies**: the order detail page shows a total equal to subtotal plus tax for a taxable order.
**Preconditions**: Test order (fixtures/test-data.json), signed in as QA user

| # | Action | Expected result |
|---|---|---|
| 1 | Open /orders/<order id> | "Order summary" heading visible |
| 2 | Read Subtotal, Tax and Total | Total = Subtotal + Tax, to the cent |

**Test data**: Test order (fixtures/test-data.json) | **Automation notes**: totals load after the summary skeleton (~2s); scope by the summary card

#### Update: PROJ-210-3 — <the change> — authorized by PROJ-327 AC4
[ ] approve   [ ] reject      Notes:

#### Script plan
- `pages/OrderDetailPage.ts`: add `summaryValue(label)`, `summaryHeading`
- `tests/core/orders/orders.spec.ts`: append PROJ-327-1, PROJ-327-2
- Regression-run: orders.spec.ts, checkout.spec.ts (both import OrderDetailPage)
[ ] approve script plan      Notes:
```

The user may edit a case's table, title or Verifies line directly; use the edited version. Quality bar: every action names the exact control; every expected result is observable; one failure mode per negative case; concrete data; cases sized to risk with outcome assertions.

## Gate 3 — decisions

```markdown
## Gate 3 — decisions
Final run: <passed>/<total> · Regression-run specs: <list> · Report draft: § Release report below

### Tickets
#### PROJ-327 — Order total includes tax
Verdict: Covered — discrepancy reported (F1) · Recommendation: **fail** — AC2 not met (tax missing on zero-rated items)
Decision: [ ] pass → <jira.qa_passed_status>   [ ] fail → <jira.qa_failed_status>   [ ] hold (stays in <jira.qa_status>)
Notes (included in the Jira comment):

### Findings
#### F1 — Tax line missing for zero-rated items (PROJ-327 AC2) · evidence: 01-tax-missing.png
[ ] file bug   [ ] not a bug   [ ] known — key: ______      Blocking: [ ] yes  [ ] no
Notes:

### Release sign-off (release mode)
[ ] approved for production   [ ] not approved — reason:
Signed off by: ______   Date: ______

### Report
[ ] approve the release report below for publishing      Changes:
```

A finding against an AC of its own ticket is normally a **fail** of that ticket, not a separate bug; a finding in behaviour *outside* the ticket's ACs is a candidate bug, unless the ticket's spec lists it as Out of scope, which makes it *not a bug*. The recommendation says which, but the user decides.

The **release sign-off** is QA's decision for the whole release. It's recorded in the report and, when a tracking ticket is configured, on that ticket. It's separate from the per-ticket decisions: a release can be approved with tickets on hold, and the reason says so. This skill records the sign-off; it doesn't trigger a deploy. Single-ticket and manual runs have no sign-off.

## Release report (Confluence)

Title: `Release <fixVersion> — QA Coverage Report`. Written into the draft's § Release report, approved at Gate 3, published at step 12.

When `[features]` is configured, split the Tickets table by feature: one section per feature (linking its spec and Epic), then "Other tickets". Otherwise use one Tickets table.

```markdown
**Release:** <fixVersion> · **Environment:** <qa.test_url> · **Run:** <date> · **Suite:** <ledger header line>
**Release QA:** approved for production by <name> on <date> | not approved — <reason> (<name>, <date>)

## Summary
<n> tickets — <n> covered, <n> covered with discrepancies, <n> not found, <n> blocked, <n> no browser-visible change, <n> too thin.
QA decisions: <n> pass, <n> fail, <n> hold. Possible regressions: <n> (<n> unattributed).

## Tickets
| Ticket | Summary | Verdict | QA decision | Tests | Findings |
|---|---|---|---|---|---|
| [<KEY>](https://<jira.site>/browse/<KEY>) | … | Covered · Covered — discrepancy reported · Not found — likely not deployed · Blocked on test data · No browser-visible change · Too thin | Pass · Fail — <reason> · Hold — blocked by <bug> | <IDs> | F1, F3 |

## Findings
| # | Finding | Ticket / AC | Evidence | Blocking | Bug |
|---|---|---|---|---|---|
| F1 | <observed behaviour> | <KEY> AC<n> | <file names> | Yes / No | <filled in at step 13> |

## Possible regressions
| Test | What changed | Linked ticket | Confidence |

## Known bugs now passing
## Move to top of backlog
<bug keys created by this run>

## Test runs
Baseline: <passed>/<total> (<unexpected>) · Final: <passed>/<total> · Specs regression-run: <list>

## Scope note
Browser-level checks only; calculation correctness belongs in backend tests. Evidence files are staged locally for manual attachment.
```

## Publishing (Step 12)

Skipped when `confluence.qa_reports_page` is empty: tell the user the report is in the draft's § Release report, and move on.

1. Look for an existing report: `searchConfluenceUsingCql` with `cql: space = "<confluence.space_key>" AND title = "Release <fixVersion> — QA Coverage Report"`.
2. **If found (a re-run):** read it with `getConfluencePage` and carry every Jira link already in its Findings and Tickets tables into the matching row of the new report, then `updateConfluencePage` (`pageId`, same title, `contentFormat: markdown`, `versionMessage: "qa-coverage re-run <date>"`).
   **If not found:** `createConfluencePage` with `spaceId: "<confluence.space_id>"`, `parentId: "<confluence.qa_reports_page>"`, `contentFormat: markdown`.
3. Record the page ID and link in the draft; step 13 writes bug keys back into it and uses the link in Jira comments.

## Evidence manifest

`playwright-qa/qa-output/screenshots/<run-id>/to-attach/to-attach.md` (gitignored), with files copied into `to-attach/<KEY>/NN-<what-it-shows>.png`:

```markdown
# Evidence to attach — <run-id>
The Atlassian tools can't upload attachments. Attach these by hand, then delete this folder.

| File | Shows | Attach to |
|---|---|---|
| PROJ-327/01-tax-missing.png | Order detail — no Tax line for a zero-rated item | PROJ-327 (QA failed comment) · report § Findings F1 |
```

Fill "Attach to" with the real bug keys after step 13.

## Completion summary

```
Complete — <run-id>
─────────────────────────────
Tickets:          <n> — <n> passed → <jira.qa_passed_status>, <n> failed → <jira.qa_failed_status>, <n> held in <jira.qa_status>
Release QA:       approved by <name> | not approved — <reason> | n/a (single-ticket / manual)
New tests:        <IDs> (<n>)
Updated:          <IDs> — <ticket each>
Superseded:       <IDs>
Page objects:     <n> new, <n> extended
Test runs:        baseline <p>/<t>, final <p>/<t>, regression-run specs <list>
Findings:         <n> — <n> bugs filed, <n> added to existing, <n> not bugs
Move to top of backlog:  <bug keys>
Attach by hand:   <path to to-attach.md> (<n> files)
Ledger:           --check clean
Confluence:       <link> | none
Jira writes:      <n> transitions, <n> comments, <n> bugs, <n> links — all approved
─────────────────────────────
```
