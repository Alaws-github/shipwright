# Release intake and triage

## Fetch the release

`searchJiraIssuesUsingJql` with:

```
jql:    project = <jira.project> AND fixVersion = "<fixVersion>" ORDER BY key ASC
fields: summary, description, issuetype, status, priority, labels, parent, fixVersions, components, issuelinks
maxResults: 100   (page with nextPageToken until exhausted)
responseContentFormat: markdown
```

Quote the fixVersion exactly as the user gave it — release names can contain spaces (e.g. `2026-09 R4`). If the query returns nothing, stop and ask: the version name may be misspelled, or the release may not be in the project.

Do not fetch comments, changelog or attachments.

**The release tracking ticket** — only when `qa.release_tracking_label` is set. A ticket on the fixVersion with that label isn't a ticket to test: set it aside, and use it for the release sign-off at step 13 (`jira-actions.md` → Release sign-off). If the label is set but no ticket carries it, say so at Gate 3. If the label is empty, the sign-off is recorded only in the report.

**Status.** The QA status is `<jira.qa_status>`. Tickets in any other status are **flagged** in the triage table, not dropped: they may be undeployed, still in progress, or already Done. Treat them like any other ticket, but expect "not found in app" more often, and step 13 will not transition them (it only acts on tickets in `<jira.qa_status>`).

**Held tickets** from an earlier run are handled as `jira-actions.md` → Held tickets describes, alongside the release's other tickets.

**Feature.** Only when `[features]` is configured: record each ticket's feature from its `<features.label_prefix><feature>-s<n>` label (`intake-ticket.md` → Spec-synced tickets); tickets without one are "Other", and the report groups tickets by feature. Otherwise the report has one Tickets table.

## Triage — one bucket per ticket

| Bucket | Criteria | What happens |
|---|---|---|
| **Testable** | Has usable ACs and a plausible browser-visible change | Grouped by area and explored |
| **Too thin** | No usable ACs in the description (see `intake-ticket.md` → Extracting ACs) | A question at Gate 1; not explored |
| **No browser-visible change** | The change is backend-only, pipeline, infrastructure, docs, or config — judged from the ticket text **and** the git hints (commits for the key touch none of `<qa.frontend_paths>`) | Reported with no end-to-end test expected. If the ticket text suggests a user-visible effect but the commits don't, it is **Testable** — the app decides |
| **Already covered** | `npm run qa:ledger -- --tickets <all keys>` lists tests for it, and the ticket is not described as changing that behaviour | Its tests run in the baseline; no new drafting unless exploration shows the behaviour changed |

Issue type is a hint, not a rule: a Bug can have a browser-visible fix; a Story can be backend-only.

Sub-tasks: if a sub-task and its parent story are both in the release, triage the **story** and treat the sub-tasks as context for it. A sub-task alone in the release is triaged on its own.

## Group by area

For each Testable ticket, derive candidate routes (`intake-ticket.md` → Git and route hints). Group tickets whose routes share a page or tab strip into one **area**. Name areas by route (`project-settings`, `users-list`).

Order areas so shared prerequisites come first (e.g. a record-creation change before changes to that record's detail pages). Record the grouping and order in the draft.

## Draft file

Create `playwright-qa/qa-output/drafts/<run-id>.md` now (layout in `templates.md` → Draft file). run-id for a release is the fixVersion lower-cased with spaces as hyphens, e.g. `2026-09-r4`. Every later step updates this file's status table.
