# Step 13 — Jira actions

Turn the QA engineer's Gate 3 decisions into Jira changes. The decision is the user's; this step only carries it out. Every write is listed and approved as a batch first (SKILL.md non-negotiable 5).

## Inputs

From the draft's Gate 3 section (re-read it — the user edited it):

- Per ticket: **pass / fail / hold**, and notes.
- Per finding (`F1…`): **file bug / not a bug / known (key)**, and **blocking yes / no**.
- Release mode: the **release sign-off**, approved or not approved (with the reason).

Any ticket or finding with no decision marked → ask; do not infer.

## Decision rules

| Decision | Jira action |
|---|---|
| **Pass**, and no finding for this ticket is marked *file bug* + *blocking* | Transition to `<jira.qa_passed_status>`; comment "QA passed" (template below) |
| **Fail** — a bug fix doesn't work, or an AC isn't met | Transition to `<jira.qa_failed_status>`; comment "QA failed" with the AC, reason, observed behaviour and evidence |
| **Hold**, or pass with a blocking bug | No transition — the ticket **stays in `<jira.qa_status>`**; comment "QA on hold" naming the blocking bug |
| Finding marked **file bug** | Filed as a Bug (below) — linked **Blocks** if blocking, **Relates** if not |
| Finding marked **known (key)** | A comment on that bug if the finding adds information, and the same link |
| Finding marked **not a bug** | Nothing in Jira; stays in the report as a closed finding |

A ticket the user marks **pass** but which has a finding marked *file bug* + *blocking* is a contradiction — ask which one they meant.

## Filing bugs

Bugs go first, because the links and comments need their keys.

1. **Duplicate search** per finding marked *file bug*: `searchJiraIssuesUsingJql` with `project = <jira.project> AND issuetype = "<jira.bug_issue_type>" AND statusCategory != Done AND text ~ "<2–4 distinctive words from the finding>"`, plus one query on the route or control name. A *known (key)* finding: fetch that key and confirm it really describes the finding.
2. **Bug triage table** — one row per finding: finding → action (create / comment on existing `<KEY>` / skip, and why) → summary → link type. A likely duplicate changes the action to "comment on existing"; a *known* key that doesn't cover the finding changes it to "create". Show it and **wait for confirmation**. Never create a ticket the table didn't show.
3. **Check the affects version exists**: `getJiraIssueTypeMetaWithFields` for the Bug type; the release fixVersion (release mode) or the ticket's fixVersion (single-ticket mode) must be in `versions`' allowed values. Match the name exactly. If it's missing, ask rather than omit it.
4. **Create** each approved bug with `createJiraIssue`: `projectKey: <jira.project>`, `issueTypeName: <jira.bug_issue_type>`, labels `<jira.bug_labels>`, `additional_fields: { "versions": [{ "name": "<affects version>" }] }`, and this body (`contentFormat: markdown`):

   ```markdown
   ## Summary
   <one sentence: what's wrong>
   ## Steps to reproduce
   1. … (from the walk or the failing test)
   ## Expected
   <what the AC or normal behaviour requires>
   ## Actual
   <exact message, value, URL or state observed on <qa.test_url>>
   ## Source
   Found by `/qa-coverage` on <date> while testing <ticket key> AC<n> (<fixVersion>). Report: <Confluence link, if any>
   ## Evidence
   <file names> — attached by hand (see the run's `to-attach.md`)
   ```
5. **Link** each bug to its originating ticket with `createIssueLink`: blocking → `type: "Blocks"`, `inwardIssue: <bug>`, `outwardIssue: <ticket>` ("<ticket> is blocked by <bug>"); non-blocking → `type: "Relates"`. Use the same link for a *known* bug.
6. **Write back** (release mode, report published): put each bug key into its finding's "Bug" cell of the Confluence report's Findings table (`getConfluencePage`, edit that cell, `updateConfluencePage`).

Steps 4–6 are writes: they go in the approved batch below, not before it.

## Order

1. **Bugs** — the triage table above, approved, then created and linked.
2. **Re-fetch each ticket's status** (`getJiraIssue`, `fields: status`). If a ticket is no longer in `<jira.qa_status>` (someone moved it since intake), drop its action from the batch and report it — never transition from an unexpected status. The release tracking ticket is the exception: its sign-off row moves it from whatever status it's in.
3. **Build the batch**: one row per ticket — current status → target status (or "no transition"), and the full comment text, with the bug keys filled in.
4. **Show the batch and stop for approval** (in chat, and written to the draft).
5. **Execute** each row:
   - `getTransitionsForJiraIssue` → choose the transition whose **target status name** is `<jira.qa_passed_status>` or `<jira.qa_failed_status>` (match on `to.name`, not the transition's own name). If none is available from the current status, skip that row and report it — don't chain transitions.
   - `transitionJiraIssue` with that transition ID.
   - `addCommentToJiraIssue` with the comment (`contentFormat: markdown`).
6. **Report back**: what was done per ticket, anything skipped and why, the new bugs to rank, and the attachments to add.

## Release sign-off

Release mode only, and only when `qa.release_tracking_label` is set and intake found the tracking ticket. Otherwise the sign-off lives only in the report.

| Sign-off | Jira action on the tracking ticket |
|---|---|
| **Approved** | Transition to `<jira.qa_passed_status>`; comment "Release QA approved" (below) |
| **Not approved** | Transition to `<jira.qa_failed_status>`; comment "Release QA not approved" with the reason |

Include it in the batch as its own row, after the tickets. Name the build QA tested (commit or build number); if it isn't known, ask QA, and write `Tested build: unknown` if they can't say.

## Comment templates

**QA passed**
```markdown
**QA passed — <fixVersion>** (`/qa-coverage`, <date>)
All acceptance criteria verified on <qa.test_url>. Tests: <IDs>.
Report: <Confluence link>                          ← release mode only
<Non-blocking bugs raised: <keys>>                 ← only if any
```

**QA failed**
```markdown
**QA failed — <fixVersion>** (`/qa-coverage`, <date>)
**Failed:** AC<n> — "<AC text, verbatim>"
**Observed:** <what the app did — exact message, value, URL, or state>
**Expected:** <what the AC requires>
**Steps:** <numbered, from the walk or the failing test>
**Evidence:** <file names> — to be attached (see `to-attach.md` in the run folder); report: <Confluence link>
<Other ACs: AC<n> passed, …>
```

**QA on hold**
```markdown
**QA on hold — <fixVersion>** (`/qa-coverage`, <date>)
Acceptance criteria pass, but <bug key> (<one-line summary>) blocks this ticket. It stays in <jira.qa_status> until that bug is resolved or judged non-blocking; re-check with `/qa-coverage <this key>`.
Report: <Confluence link>
```

**Release QA approved** (tracking ticket)
```markdown
**Release QA approved — <fixVersion>** (`/qa-coverage`, <date>)
Tested build: <commit or build> on <qa.test_url>. Tickets: <n> passed, <n> on hold (<keys>), <n> failed (<keys>).
Report: <Confluence link>
```

**Release QA not approved** (tracking ticket)
```markdown
**Release QA not approved — <fixVersion>** (`/qa-coverage`, <date>)
**Reason:** <the reason from Gate 3>
Tested build: <commit or build>. Blocking: <bug and ticket keys>. Report: <Confluence link>
```

## Held tickets

A ticket in `<jira.qa_status>` with an inward **"is blocked by"** link to a Bug was held by an earlier run. Intake (a release re-run, or `/qa-coverage <KEY>`) checks the blocking bug first:

- Blocking bug **Done** → re-verify the ticket's ACs and the bug's fix (run the ticket's tests, and walk the bug's steps). If both hold, propose the **pass** action at Gate 3.
- Blocking bug **not Done** → report it as still held; ask whether the user now judges the bug **non-blocking**. If yes, propose changing the link to **Relates** and the pass action at Gate 3.

## Afterwards

- **Backlog ranking can't be done by the tools.** List every bug created in this step under "Move to top of backlog" in the completion summary (and the report, release mode).
- **Attachments can't be uploaded by the tools.** Point the user at `screenshots/<run-id>/to-attach/to-attach.md`, which says which file goes on which ticket, bug, or report section.
