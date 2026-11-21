# Lessons: general

Read for every change to this repository. Format and rules for adding an entry: [../LESSONS.md](../LESSONS.md).

## Working with the owner

### never-push-without-asking `correction`
Commit on a new branch and stop. Never `git push`, open a pull request or merge unless the owner asks in that conversation. **Why:** a push publishes the work, and approval for one push does not carry over to the next.
**Enforced by:** none - needs the owner's say each time.

### work-on-a-branch-not-main `correction`
Changes go on a short-lived branch named for what it does (`readme-redesign`, `repo-standards`), never straight on `main`. Say which branch a change landed on.
**Enforced by:** none - check `git branch --show-current` before the first edit.

### never-handle-secrets-in-chat `correction`
Never ask for, accept or repeat keys, tokens, passwords or connection strings in chat. If one appears, don't repeat it and tell the owner to rotate it. The suite's `.env` and `auth.json` are off limits to agents even when they would help.
**Enforced by:** none - the hook and deny rules cover the suite files; chat needs judgement.

### keep-work-proportionate `correction`
Do the smallest change that meets the request. Read only the parts of files you need, batch tool calls, and don't regenerate images, banners or screenshots unless the change affects them.
**Enforced by:** none - judgement.

### every-change-updates-its-records `correction`
A change isn't done until its records are updated in the same delivery: `CHANGELOG.md`, the README sections it affects, `CLAUDE.md` if a rule or the layout changed, and a lesson if something was learned. The checklist is in `AGENTS.md`.
**Enforced by:** none - checklist in AGENTS.md.

## Code and docs

### document-every-file-and-export `design`
Every code file starts with a header comment whose first sentence says what the file is for. Every export has a `/** ... */` comment directly above it. Inside code, comment the why, and name the lesson a line enforces.
**Enforced by:** check every-file-has-a-header, check exports-are-documented (scripts/checks/repo-checks.mjs).

### generated-text-is-never-hand-edited `design`
Text between generator markers (`<!-- qa-ledger:... -->`, `<!-- lessons-index:... -->`) and the files they write (`test-index.md`, `jira-test-mapping.md`) is rebuilt from the source. Fix the source and re-run the generator.
**Enforced by:** check npm run check (lessons index and qa-ledger both fail when stale).

### plain-english-no-new-em-dashes `design`
Docs, comments and UI text use plain English, short sentences and active voice, with no marketing language. New writing avoids em dashes; use a full stop, comma, colon or brackets. **Applies to:** new and rewritten text. Existing text and the test-title separator (`'PROJ-327-1 — title'`, which `qa-ledger` parses) are left as they are.
**Enforced by:** none - style needs a reader.

### keep-the-portfolio-and-the-kit-in-step `design`
The root README, `docs/architecture.md` and `docs/design-decisions.md` describe the kit. When the kit's behaviour, file names or commands change, update the description in the same change.
**Enforced by:** none - compare by reading.
