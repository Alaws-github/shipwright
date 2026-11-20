# AGENTS.md: how to work on Shipwright

For any agent or contributor. [CLAUDE.md](CLAUDE.md) has the rules and the layout; this file has the way of working.

## 1. Planning changes

A large change, one that spans the kit and the case study, or one that is hard to undo (renaming the suite folder, changing the ID scheme, changing gate order) needs a short plan agreed with the owner first. The plan says:

- the problem;
- assumptions, written so they can be checked;
- acceptance criteria;
- files affected, including indirect ones (the README, `docs/architecture.md`, SETUP.md);
- which `CLAUDE.md` rules it touches;
- options, only if there is a real choice, and a recommendation.

Questions, investigations and small fixes don't need a plan.

## 2. Recording lessons

Before changing anything, read the lesson files for that area (the table in [docs/LESSONS.md](docs/LESSONS.md)).

Add a lesson straight away, without asking, when you fix a defect, spot a bug while reading, the owner reports something broken, the owner corrects an assumption, or the owner makes a decision that a later change could undo. The format is in `docs/LESSONS.md`. Then run `npm run lessons`.

**Before acting on a request:** if it would bring back a pattern a lesson rules out, stop, name the slug, explain the risk, and ask.

## 3. Branches and delivery

- Never work on `main`. Make a branch named for the change.
- Commit only on that branch, and only when the owner asks or has said to. Never push, open a pull request or merge without asking (lesson `never-push-without-asking`).
- Check `git status` before starting, so earlier uncommitted work isn't lost.
- Never ask for or accept keys, tokens or passwords in chat.

## 4. Every change: update these files

- [ ] `CHANGELOG.md`: a section for the change.
- [ ] `README.md` and `docs/`: anything they say about what changed (layout, commands, counts such as "17 codified rules").
- [ ] `CLAUDE.md`: if a rule, command or the layout changed.
- [ ] The suite's `CLAUDE.md` and `README.md`: if a suite convention changed. Bump its **Last verified** date.
- [ ] `docs/lessons/` or `QA-LESSONS.md`: for every bug, correction or decision, then `npm run lessons`.
- [ ] `docs/context/project-history.md`: when a decision is made or changed.
- [ ] A check in `scripts/checks/repo-checks.mjs` when the rule can be checked by a script, including the case that must be refused.

## 5. Testing

Run `npm run check` from the root before handing over. It must pass. If you changed a TypeScript file in the suite and its dependencies are installed, also run `npm run typecheck` in `qa-coverage-kit/playwright-qa/scripts/`.

Changes to `docs/index.html` or the README's look: open them in a browser, in light and dark mode, at desktop and phone widths. GitHub renders the README, so check its preview too.

## 6. Writing

Plain English, short sentences, active voice. No marketing language. New writing has no em dashes. Every code file starts with a header comment saying what it is for; every export has a JSDoc comment. Details: [docs/CODING-STANDARDS.md](docs/CODING-STANDARDS.md).

The owner watches usage. Prefer the smallest change that does the job.
