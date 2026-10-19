# Design decisions

[← Back to README](../README.md)

These are the decisions that shaped Shipwright. Each one records the context, what I chose, the alternatives I rejected, and the trade-off I accepted.

---

## 1. Humans decide; the agent prepares

**Context.** The expensive QA mistakes are judgement mistakes: calling a regression an intended change, filing a bug against working code, or signing off a release that shouldn't ship. An agent can gather evidence faster than a person, but it has no accountability for the call.

**Decision.** Split the workflow at three hard gates:

- **Gate 1** decides what's in scope and how to read ambiguous failures.
- **Gate 2** approves which tests to write.
- **Gate 3** records pass, fail or hold, the bug decisions, and the release sign-off.

The agent does everything between the gates and nothing beyond the current one.

**Alternatives rejected.**
- *Fully autonomous:* fast, but it moves the analyst's job from deciding to auditing, which is harder and slower.
- *A gate per action:* safe, but it produces approval fatigue, and fatigued approval is worse than none.

**Trade-off.** A release run takes three round-trips with the analyst. In exchange, each round-trip carries a complete, structured set of decisions.

---

## 2. Gates are answered in a file, not in chat

**Context.** A chat reply like "looks good" is ambiguous across 15 tickets and 6 findings, and it leaves no record.

**Decision.** At each gate the agent writes a section with explicit decision fields (`[ ] pass  [ ] fail  [ ] hold`) into `qa-output/drafts/<run-id>.md`. The analyst edits the file and the agent re-reads it. **An unmarked field is a question, never approval.**

**Why it works.**
- Every decision is explicit and tied to one item.
- The analyst can edit a drafted test case in place instead of describing the change.
- The file is the resume point if a session dies.
- The file holds the complete audit trail until the run finishes.

---

## 3. The app is the source of truth

**Context.** Tickets describe intent. The deployed app is what users get. These diverge all the time: unfinished work, scope changes, deploys that lag, and Done tickets that never reached the test environment.

**Decision.**
- Tests are written only for behaviour **observed in the live app**.
- Every ticket-versus-app disagreement becomes a numbered finding with a screenshot, decided by the analyst.
- When a ticket's change can't be found, the agent stops on that ticket and reports the likely reason (not deployed, different route, permission-gated or renamed). It doesn't hunt through the app, and it doesn't write the test from the ticket text anyway.

**Trade-off.** Some tickets end a run as "Not found — likely not deployed" with no new coverage. That is the correct outcome: a test written blind would have shown green coverage that doesn't exist.

---

## 4. The "how versus what" rule for changing tests

**Context.** The quickest way for an agent to get a green run is to change the assertion. That's also the quickest way to lose a regression.

**Decision.**
- The agent may change **how** a test finds things (locators, waits, page-object plumbing) without approval.
- It may change **what** a test expects only when a ticket in scope describes the new behaviour, or the analyst approves at a gate.
- Weakening an assertion to get green is forbidden outright.

**Supporting rules.** A test changed for an intended behaviour change gets the authorising ticket's `@tag`, so the reason is permanently traceable. "Locator not found" counts as mechanics only if a live snapshot shows the thing is still there.

---

## 5. Classify failures by evidence, and allow "undecided"

**Context.** Forcing every failure into a class means guessing on the ambiguous ones, and a confident guess is the dangerous kind.

**Decision.**
- Four classes (intended change, mechanics, possible regression, environment), each with a stated evidence bar.
- A fifth outcome, **undecided**, for failures where the evidence fits two classes. These go to the analyst with both candidates.
- Possible regressions are attributed to a likely ticket through `git log` on the affected route, with a **confidence level** (high or medium). If nothing links, they're reported as release-level.

**Trade-off.** The analyst sometimes gets a question the agent "could have" answered. That costs seconds. A wrong answer costs a production bug.

---

## 6. Scoped, permanent test IDs instead of a global counter

**Context.** A global `TC-001…TC-n` sequence breaks under parallel work. Two branches pick the same next number, and then someone renumbers, breaking every reference in Jira comments and reports. The Anser suite carried legacy `TC-nnn` IDs and reserved ranges for exactly this reason.

**Decision.** IDs are scoped to their origin: `<TICKET>-<n>` for ticket work and `MAN-<area>-<n>` for manual work. They're never reused or renumbered, and removing a test retires its ID.

**Consequences.**
- No coordination is needed between people or agent runs.
- The ID alone shows where a test came from. Tags show every ticket that changed it later.
- The next number is a local lookup (`qa-ledger --tickets PROJ-327`), not a shared resource.

---

## 7. Generate the docs from the specs

**Context.** Hand-maintained test indexes drift within a sprint. Then nobody trusts them, and nobody updates them.

**Decision.**
- The spec file (docstring + code + readable page-object method names) is the record of an automated test.
- `qa-ledger --write` generates the index, the Jira mapping and summary blocks from the specs.
- `--check` fails if anything is stale or malformed.
- Prose test cases exist only for tests with **no** automation.

**Details that made it robust.**
- Static parsing, with no Playwright config load and no `.env`, so it runs anywhere, including CI.
- Marker-delimited blocks (`<!-- qa-ledger:header:start -->`), so generated content can live inside hand-written files.
- Line-ending normalisation, since a byte-for-byte check fails on every Windows checkout that uses `autocrlf`.

---

## 8. Enforce safety with tooling, not just instructions

**Context.** An instruction like "never read `.env`" is a request. A model can misread the request, or be steered past it by content it reads.

**Decision.** Layered enforcement:

1. **Permission deny rules** on the Read tool for the credential files.
2. **A `PreToolUse` hook** that blocks any shell command referencing them. This closes the `cat`, `Get-Content` and `cp` gap a Read rule leaves open.
3. **Jira and Confluence write tools are not pre-approved**, so each write prompts even after Gate 3 approval.
4. **Edits pre-approved only inside `playwright-qa/`.**
5. **`disable-model-invocation: true`**, so the skill runs only when a human types the command.

**Trade-off.** The hook's patterns deliberately err towards blocking. A false positive costs one retry. A leaked credential can't be taken back.

---

## 9. Bound every loop

**Context.** An agent fixing a failing test can loop indefinitely, drifting further from the original intent with each attempt.

**Decision.**
- **At most 3 fix attempts per failing test.** Then the agent stops and reports the test, the last error, and what it tried.
- **Diagnosis comes before any edit,** with named symptom-to-cause rules. A locator timeout points to the selector or late-loading content. Wide late failures point to session expiry. A test that passes alone but fails in the suite points to shared state, and is never fixed by adding a retry.

---

## 10. Turn lessons into rules with an "enforced by" line

**Context.** Incident logs grow and go unread. The same Playwright traps get hit again by the next person, or the next agent run.

**Decision.** `QA-LESSONS.md` holds **rules, not stories**. Each entry has:

- a kebab-case slug, which merges cleanly across branches
- one rule
- a **Why**
- an **Enforced by** line naming the check that catches it, or `none - <why it needs judgement>`

The agent must re-read the file before writing any locator or wait.

**Consequence.** The "Enforced by" line makes the gaps visible. It shows which rules are automated and which still depend on review, which is a natural backlog for future checks.

---

## 11. Separate the workflow from the project

**Context.** The Anser original had that project's routes, priority scheme, timings and release pipeline written into the skill text, and it depended on a second skill (`/bug-triage`).

**Decision.**
- Machine-readable project values go into `workflow.toml`.
- Judgement-level knowledge goes into the suite's **App map** in `CLAUDE.md`.
- Anser-specific features (release tracking ticket, feature-spec sync) become **optional sections that switch themselves off when empty**.
- The bug filing that `/bug-triage` handled is folded in: duplicate search, a triage table the analyst confirms, then create and link.
- The Python hook is rewritten in Node, which Playwright already requires.

**Result.** Adopting the kit means editing one config file, three app-specific suite files and an App map. The workflow itself installs unchanged.
