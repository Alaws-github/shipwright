# Project history

What a new session needs so it doesn't re-ask settled questions. Longer reasoning for the kit's design is in [design-decisions.md](../design-decisions.md).

## Who and why

Shipwright is a QA engineer's portfolio piece. It shows a working Claude Code skill and Playwright suite that keep end-to-end coverage true to what a release actually shipped. Readers are hiring managers and engineers; the kit's users are QA analysts who copy it into their product repository.

## How the owner works

- Claude Code in VS Code, on Windows.
- One branch per change, merged by pull request. Never push without asking.
- Plain-English docs. Small, focused changes.

## What has been decided, and why

| Decision | Why |
|---|---|
| The agent prepares, people decide, at three gates answered in a file | Jira and Confluence changes are visible to the whole team and hard to undo; a file answer is reviewable and resumable |
| Test IDs scoped to their ticket, never a global counter | Parallel branches can't collide, and nothing is renumbered |
| Suite docs generated from the specs by `qa-ledger` | Hand-kept docs drift |
| Credentials blocked by deny rules and a shell hook | Instructions alone don't stop a shell command reading `.env` |
| Lessons are slugs with an `Enforced by` line | Slugs merge cleanly; the line says whether a machine or a reader checks the rule |
| Root repo has no npm dependencies; checks use Node built-ins | Keeps the portfolio cloneable and checkable with no install |
| No ESLint, Prettier or husky yet | Too few code files to justify an install step; revisit if the kit grows |
| New writing avoids em dashes; existing text left as is | Adopted with the repository standards; rewriting every doc wasn't worth the churn |
| Ship's wheel logo, motto on the banner | Chosen from four rounds of concepts (`assets/logo-concepts/`) |

## Versions

| Date | What it added |
|---|---|
| 2026-10-19 | The kit and case study; MIT licence; README intro |
| 2026-10-20 | Logo, social preview and README header image |
| 2026-10-26 | Ship's wheel logo and motto; every logo concept kept |
| 2026-11-20 | README redesign; repository standards (CLAUDE.md, AGENTS.md, lessons, checks) |
