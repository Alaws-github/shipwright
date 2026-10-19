# Ticket intake

Used by single-ticket mode, and per ticket inside release mode.

## Fetch

`getJiraIssue` with `fields: summary, description, issuetype, status, priority, labels, parent, fixVersions, components, issuelinks` and `responseContentFormat: markdown`. If it's a held ticket, see `jira-actions.md` → Held tickets. One call. No comments, changelog or attachments.

| From the ticket | Used for |
|---|---|
| Summary + description | What the change is meant to do |
| ACs (from the description) | Carried across **verbatim** where already testable |
| Labels, parent epic, components | Area, grouping |
| Priority | Case priority, mapped through `[jira.priority_map]` in `workflow.toml`. A priority not in the map → ask at Gate 2 (default Medium). The drafted case shows it, so the user can change it at Gate 2 |
| Status, fixVersions | Context only — a Done ticket may still be undeployed |

## Spec-synced tickets

Only when `[features]` is configured in `workflow.toml`. A ticket carrying the label `<features.label_prefix><feature>-s<n>` was generated from a feature spec, `<features.spec_dir>/<feature>.md`, story `S<n>`, and the spec is the home of its intent.

1. **Read the story from the spec** on the base branch: `git show origin/<git.base_branch>:<features.spec_dir>/<feature>.md`, section `S<n>`.
2. **Use the AC IDs as written.** Each AC is a `- AC<n>: …` bullet, and its number is permanent. Cite `<KEY> AC<n>` with that number; never renumber by position.
3. **Skip retired ACs** (e.g. `- AC2: (retired: …)`): write no case for one. An existing test that cites a retired AC is an **Invalidated** candidate at Gate 1.
4. **Compare the ticket with the spec.** If they differ, the spec is right: test against the spec, and list the difference under Gate 1 → Questions.
5. **Use the rest of the story.** **Constraints** suggest negative and boundary cases. Behaviour listed under **Out of scope** isn't a discrepancy: if the app lacks it, record that as observed and recommend *not a bug*.

## Extracting ACs

For any other ticket, ACs live in the ticket description. Look for, in order:

1. A heading or bold label named "Acceptance Criteria", "Acceptance criteria", "ACs" or "AC", followed by a list.
2. A checklist (`- [ ]` items) or a Given/When/Then block.
3. A numbered list of observable outcomes under a heading such as "Requirements" or "Expected behaviour".

Number them `AC1…ACn` in the order written. If none of these exist, or every item is too vague to observe ("works correctly", "improved UX"), the ticket is **too thin**: say so at Gate 1 with the exact description text, and ask. **Never write an AC yourself** — a fabricated AC becomes a test asserting something nobody agreed to, trusted later because it looks like every other case.

An AC that is testable but only partly observable in a browser (e.g. "value is computed from X") is kept; the case asserts the browser-visible part, and the report notes that correctness of the computation belongs in backend tests.

## Git and route hints

Code is a **hint**; the deployed app is truth. The test environment can lag the repo.

1. `git log --all --oneline --grep "<KEY>"` — commits mentioning the ticket, including merge commits.
2. `git show --stat --format= <sha>` for each — changed files.
3. Map changed files under `<qa.frontend_paths>` to routes using the rules in `playwright-qa/CLAUDE.md` → App map. A changed shared component → grep the frontend for its import to find the pages that render it.
4. Changed areas also point at **existing tests that may be invalidated**: grep `playwright-qa/scripts/pages/` and `scripts/tests/` for the route and for visible labels named in the ticket.

No commits found (or the app's code isn't in this repo) → derive candidate routes from the ticket text (page names, tab names, control labels) and the suite's page objects (`scripts/pages/*.ts` document which route each covers). Check `CLAUDE.md` → App map for pages that look alike but aren't the same.

## Not found

If exploration can't find the change, stop that ticket — don't hunt through the app, don't assume a feature flag, and never write cases from the ticket text. Report:

- routes checked, and what was found there instead
- the likely reason: **not deployed** (commits merged but the route/control is absent — cite the commit), **different route**, **permission-gated**, or **renamed**

In release mode the ticket's verdict becomes "Not found — likely not deployed" (or the other reason) and the rest of the release continues.
