# Example: a release run, gate by gate

[← Back to README](../README.md)

> **This is an illustrative walkthrough.** The project key (`PROJ`), tickets, routes and values are invented to show the workflow end to end. No client data is included. Every artefact below follows the exact formats defined in the skill's [templates](../qa-coverage-kit/.claude/skills/qa-coverage/references/templates.md).

**Scenario:** release `2026-09 R4` has just been deployed to the test environment. The QA analyst runs:

```text
/qa-coverage release "2026-09 R4"
```

---

## Step 0: Preflight

Before touching anything, the agent:

1. reads `workflow.toml`, `playwright-qa/CLAUDE.md` and `QA-LESSONS.md` in full
2. confirms the Playwright MCP browser tools are loaded
3. runs `npm run qa:ledger -- --check`, and refuses to build on an inconsistent suite if it fails
4. refreshes the login: `npm run setup`, then `browser_close`, so the MCP browser relaunches with the fresh session
5. checks for an existing draft `2026-09-r4.md`, and offers to resume if there is one
6. resolves the Atlassian `cloudId`

## Steps 1–2: Intake and triage

The agent fetches every ticket on the fixVersion with one JQL query, and reads git history for each key:

```text
project = PROJ AND fixVersion = "2026-09 R4" ORDER BY key ASC
```

| Ticket | Summary | Triage | Reason |
|---|---|---|---|
| PROJ-327 | Show tax on the order summary | **Testable** | 4 ACs; commits touch `src/app/orders/[id]/` |
| PROJ-390 | Users table: add "Last active" column | **Testable** | 2 ACs; commits touch `src/components/UsersTable.tsx` |
| PROJ-401 | Move invoice PDF generation to a queue | **No browser-visible change** | Commits touch `services/billing/` only, nothing under `frontend_paths` |
| PROJ-412 | Improve dashboard UX | **Too thin** | Description is "Make the dashboard feel snappier and cleaner." No observable ACs |

The agent groups the testable tickets by area (`order-detail`, `users-list`) and creates the draft file with a status table.

## Step 3: Baseline run

The agent runs the full suite against the deployed build *without* `--reporter`, so the JSON report is written. It then extracts the results immediately:

```text
$ npm run qa:baseline
Run 2026-10-19T09:12:04.000Z · 11 min · 64 tests · 3 unexpected
- PROJ-210-3 [unexpected] tests/core/orders/orders.spec.ts:88 — Error: expect(locator).toBeVisible() failed … getByRole('columnheader', { name: 'Status' })
- MAN-users-2 [unexpected] tests/core/users/users.spec.ts:41 — Error: expect(received).toEqual(expected) … sorted by Role
- PROJ-180-1 [unexpected] tests/core/orders/orders.spec.ts:12 — TimeoutError: locator.waitFor: getByRole('heading', { name: 'Recent orders' })
```

Each failure is classified against the live page:

| Test | Evidence | Class |
|---|---|---|
| PROJ-180-1 | Snapshot shows the "Recent orders" heading still exists, now inside a card with `level: 2` | **Test mechanics.** The locator gets fixed and the assertion stays the same |
| MAN-users-2 | Sorting by Role no longer reorders rows. PROJ-390 touched `UsersTable.tsx`, but its ACs say nothing about sorting | **Possible regression** → PROJ-390, *medium* confidence (shared component). The test is not touched |
| PROJ-210-3 | The "Status" column is gone from the orders table. PROJ-327 touched this page but doesn't mention removing it | **Undecided.** It could be an intended redesign or a regression, so the analyst decides |

## Step 5: Explore

A subagent walks each area in the live app through Playwright MCP and returns a structured summary:

```markdown
Area: order-detail | Routes walked: /orders, /orders/:id | Screenshots: PROJ-327-summary.png, PROJ-327-zero-rated.png
Per ticket:
- PROJ-327 — found at /orders/:id
  Matches ticket: AC1, AC3, AC4 yes | discrepancies: AC2 — Tax line missing when an order contains only zero-rated items (PROJ-327-zero-rated.png)
  Observed beyond the ticket: totals render after a ~2s skeleton; Tax row hidden when tax = 0
Elements (for tests): region "Order summary" | row labels "Subtotal", "Tax", "Total" (role=row) | wait on the Total value, not the card
Domain-specific data needed: an order containing only zero-rated items — need its ID
Broken behaviour seen: none beyond F1
```

This becomes finding **F1** in the draft.

---

## Gate 1: Coverage impact

The agent writes this into `qa-output/drafts/2026-09-r4.md` and stops. The analyst's ticks and notes are shown filled in.

```markdown
## Gate 1 — coverage impact
Tickets: 4 (2 testable, 1 too thin, 1 no browser change, 0 already covered, 0 not in In QA, 0 held)
Baseline: 61/64 — 3 unexpected: 0 intended, 1 mechanics, 1 possible regression, 0 environment, 1 undecided

### Tickets — proceed?
- [x] PROJ-327 — testable, found at /orders/:id, discrepancy F1 on AC2 — New 3 · Update 0 · Invalidated 0      Notes:
- [x] PROJ-390 — testable, found at /users — New 2 · Update 0 · Invalidated 0      Notes:
- PROJ-412 — too thin: description has no ACs ("Make the dashboard feel snappier and cleaner.") — **answer:** skip; I've asked the PO for ACs
- PROJ-401 — no browser-visible change (commits touch services/billing only) — reported, no action

### Existing tests
- PROJ-210-3 — **undecided**: Orders table lost its "Status" column; PROJ-327 touched this page but doesn't mention it
  [ ] intended change (update the test)   [x] regression (leave it, report it)      Notes: design never approved removing it
- MAN-users-2 — **possible regression**, linked to PROJ-390 (medium): Users table no longer sorts by Role — reported, test untouched
- PROJ-180-1 — mechanics only (heading moved into a card) — locator will be fixed

### Questions
- Test data for PROJ-327 AC2 — an order with only zero-rated items: **answer:** order 88213
```

The analyst replies in chat: *"Gate 1 done."*

## Gate 2: Drafted tests

```markdown
## Gate 2 — drafts
### Area: order-detail

#### PROJ-327-1: Order total includes tax
[x] approve   [ ] reject      Notes:
**Ticket**: PROJ-327 AC2 | **Type**: Positive | **Priority**: High
**Verifies**: the order detail page shows a total equal to subtotal plus tax for a taxable order.
**Preconditions**: Taxable order (fixtures/test-data.json), signed in as QA user

| # | Action | Expected result |
|---|---|---|
| 1 | Open /orders/<taxable order id> | "Order summary" region visible |
| 2 | Read Subtotal, Tax and Total | Total = Subtotal + Tax, to the cent |

**Test data**: taxable order (fixtures/test-data.json) | **Automation notes**: totals load after a ~2s skeleton; wait on the Total value, scope by the summary region

#### PROJ-327-2: Zero-rated order shows a Tax line of 0.00
[x] approve   [ ] reject      Notes:
**Ticket**: PROJ-327 AC2 | **Type**: Boundary | **Priority**: Medium
…

#### Script plan
- `pages/OrderDetailPage.ts`: add `summaryValue(label)`, `summaryRegion`
- `tests/core/orders/orders.spec.ts`: append PROJ-327-1, PROJ-327-2, PROJ-327-3; fix PROJ-180-1 locator
- Regression-run: orders.spec.ts, checkout.spec.ts (both import OrderDetailPage)
[x] approve script plan      Notes:
```

PROJ-327-2 asserts the behaviour AC2 requires, and the app currently fails it (F1). If the analyst decides F1 is a bug, the test is declared `test.fail()` with the bug key above its docstring, so it turns red the day the fix ships.

## Steps 8–10: Write, run to green, reconcile

The agent writes the page object and the specs:

```ts
// pages/OrderDetailPage.ts (excerpt)
export class OrderDetailPage extends BasePage {
  readonly summaryRegion: Locator;

  constructor(page: Page) {
    super(page);
    this.summaryRegion = page.getByRole('region', { name: 'Order summary' });
  }

  async goto(orderId: string): Promise<void> {
    await this.open(`/orders/${orderId}`, this.summaryRegion);
  }

  /** The amount in the summary row with this label, e.g. "Tax". */
  async summaryValue(label: string): Promise<number> {
    const cell = this.summaryRegion.getByRole('row', { name: label }).getByRole('cell').last();
    await expect(cell).not.toHaveText('');        // wait on the value itself, not the skeleton card
    return Number((await cell.innerText()).replace(/[^0-9.-]/g, ''));
  }
}
```

```ts
// tests/core/orders/orders.spec.ts (excerpt)
/** PROJ-327-1: Order total includes tax | PROJ-327 AC2 | Positive | High
 *  Verifies: the order detail page shows a total equal to subtotal plus tax for a taxable order. */
test('PROJ-327-1 — order total includes tax', { tag: ['@PROJ-327'] }, async ({ page }) => {
  const order = new OrderDetailPage(page);
  await order.goto(testData.knownRecords.taxableOrderId);
  const [subtotal, tax, total] = await Promise.all(['Subtotal', 'Tax', 'Total'].map((l) => order.summaryValue(l)));
  expect(tax).toBeGreaterThan(0);
  expect(total).toBeCloseTo(subtotal + tax, 2);
});
```

Then:

- **Run to green:** the new IDs pass. PROJ-327-2 fails on the AC2 assertion, as expected, and stays recorded as F1. The agent doesn't weaken it.
- **Regression run:** `orders.spec.ts` and `checkout.spec.ts`, since both import `OrderDetailPage`.
- **Reconcile:** `qa-ledger --write`, then `--check` exits 0. This regenerates `test-index.md` and `jira-test-mapping.md`. Evidence is copied to `screenshots/2026-09-r4/to-attach/PROJ-327/01-tax-missing-zero-rated.png`, with a manifest.

## Gate 3: Decisions

```markdown
## Gate 3 — decisions
Final run: 66/69 · Regression-run specs: orders.spec.ts, checkout.spec.ts, users.spec.ts

### Tickets
#### PROJ-327 — Show tax on the order summary
Verdict: Covered — discrepancy reported (F1) · Recommendation: **fail** — AC2 not met (tax line missing on zero-rated orders)
Decision: [ ] pass → Ready for Release   [x] fail → In Progress   [ ] hold (stays in In QA)
Notes (included in the Jira comment): zero-rated orders are common for our EU customers

#### PROJ-390 — Users table: "Last active" column
Verdict: Covered · possible regression MAN-users-2 linked (medium) · Recommendation: **hold** pending the Role-sort decision
Decision: [ ] pass   [ ] fail   [x] hold (stays in In QA)
Notes:

### Findings
#### F1 — Tax line missing for zero-rated orders (PROJ-327 AC2) · evidence: 01-tax-missing-zero-rated.png
[ ] file bug   [x] not a bug — it's a fail of PROJ-327 itself   [ ] known — key: ______      Blocking: [ ] yes  [ ] no

#### F2 — Users table no longer sorts by Role (possible regression, PROJ-390) · evidence: 01-role-sort.png
[x] file bug   [ ] not a bug   [ ] known — key: ______      Blocking: [x] yes  [ ] no

#### F3 — Orders table lost its "Status" column (PROJ-210-3, regression per Gate 1)
[x] file bug   [ ] not a bug   [ ] known — key: ______      Blocking: [ ] yes  [x] no

### Release sign-off
[ ] approved for production   [x] not approved — reason: PROJ-327 failed; Role sort regression blocks PROJ-390
Signed off by: A. Analyst   Date: 2026-10-19

### Report
[x] approve the release report below for publishing      Changes:
```

## Steps 12–13: Publish and act

**Bug triage table**, shown and confirmed before anything is created:

| Finding | Duplicate search | Action | Summary | Link |
|---|---|---|---|---|
| F2 | 0 open bugs match "sort Role users table" | create | Users table no longer sorts by Role | PROJ-390 **is blocked by** new bug |
| F3 | PROJ-799 "Orders Status column missing" (open) | **comment on existing PROJ-799** | — | PROJ-327 **relates to** PROJ-799 |

**The approved batch:**

| Ticket | Current → target | Comment |
|---|---|---|
| PROJ-327 | In QA → **In Progress** | QA failed: AC2, observed vs expected, steps, evidence |
| PROJ-390 | In QA → *no transition* | QA on hold: blocked by PROJ-815 |
| PROJ-815 (new bug) | created | Summary, steps, expected, actual, source, evidence |
| PROJ-799 | — | Comment adding the observation from this release |

The comment posted on PROJ-327:

```markdown
**QA failed — 2026-09 R4** (`/qa-coverage`, 2026-10-19)
**Failed:** AC2 — "The order summary shows a Tax line for every order"
**Observed:** For order 88213 (zero-rated items only) the summary shows Subtotal and Total but no Tax line.
**Expected:** A Tax line of 0.00.
**Steps:** 1. Open /orders/88213  2. Wait for the Order summary  3. Read the summary rows
**Evidence:** 01-tax-missing-zero-rated.png — to be attached (see to-attach.md); report: <Confluence link>
Other ACs: AC1, AC3, AC4 passed. Note from QA: zero-rated orders are common for our EU customers.
```

The **Confluence report** "Release 2026-09 R4 — QA Coverage Report" is created under the QA reports page. It contains the ticket verdicts, the findings with bug keys written back in, the possible regressions with confidence levels, and the test-run summary.

## Completion summary

```text
Complete — 2026-09-r4
─────────────────────────────
Tickets:          4 — 0 passed → Ready for Release, 1 failed → In Progress, 1 held in In QA
Release QA:       not approved — PROJ-327 failed; Role sort regression blocks PROJ-390
New tests:        PROJ-327-1, PROJ-327-2, PROJ-327-3, PROJ-390-1, PROJ-390-2 (5)
Updated:          PROJ-180-1 — locator only
Superseded:       none
Page objects:     0 new, 2 extended
Test runs:        baseline 61/64, final 66/69, regression-run specs orders, checkout, users
Findings:         3 — 1 bug filed, 1 added to existing, 1 not a bug
Move to top of backlog:  PROJ-815
Attach by hand:   qa-output/screenshots/2026-09-r4/to-attach/to-attach.md (3 files)
Ledger:           --check clean
Confluence:       <link>
Jira writes:      1 transition, 3 comments, 1 bug, 2 links — all approved
─────────────────────────────
```

## What the analyst actually did

The analyst:

- answered three gates by ticking boxes in one file
- typed one test-data value (an order ID)
- made the four judgement calls that matter: is the missing Status column a regression, does F1 fail PROJ-327, does the Role-sort bug block PROJ-390, and does this release ship

Everything else was prepared, executed and documented by the agent, and every external write was reviewed before it happened.
