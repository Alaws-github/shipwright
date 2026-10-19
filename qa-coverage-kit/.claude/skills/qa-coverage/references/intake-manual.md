# Manual-test intake

The user has tested something by hand and wants it covered. There is no ticket, so there are no agreed ACs — the user's description is a starting point and the re-walk supplies the detail.

## Before opening the browser

Ask now — not after the walk — about anything the description leaves unclear:

- **Where** it lives: the route, or how to get there from the home page
- **Who**: which user role, if the feature is permission-dependent
- **Success state**: what the user saw when it worked ("a green toast said Project updated" beats "it saved")
- **Change**: whether anything that previously worked now behaves differently
- **Surprises**: slow loads, odd empty states, controls that didn't do what was expected — these are usually the best negative cases

Don't guess at any of these; a wrong assumption propagates into every case.

## Naming

Choose an area slug from the route or feature (`period-control`, `users-invite`) and confirm it with the user. The run-id and story are `MAN-<slug>`; tests are `MAN-<slug>-<n>`. Check `npm run qa:ledger -- --json` that no existing test already uses the slug; if one does, continue its numbering.

## Re-walk

Run SKILL.md Step 5 for this one area, walking the happy path **exactly as described**, then the edges the user may not have tried.

**If the app doesn't behave as described, stop and ask.** The environment may have changed since the manual test, the description may be of a different route, or what was seen was a one-off. All three matter before writing a single case.

## ACs

Derive ACs from observed behaviour and present them at Gate 2 **labelled as derived**. The user confirms, edits or rejects each one — what the app does is not automatically what it should do, and the user is the one who knows the difference. Only confirmed ACs get cases.

Record the story in `playwright-qa/qa-output/user-stories.md` as `### MAN-<slug>: <title>` with the confirmed ACs and `**Source**: manual test <date> | <route>`.

## Test data

The user has just tested this, so they almost certainly have the real domain-specific values to hand — ask for them rather than marking cases BLOCKED. The rule on secrets still holds: a credential goes in `scripts/.env` (the user adds it), and `test-data.md` records only the variable name.
