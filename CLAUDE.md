# CLAUDE.md: Shipwright

Read next, in this order: [AGENTS.md](AGENTS.md) (how to work here), [docs/LESSONS.md](docs/LESSONS.md) (rules learned, by area), [docs/context/project-history.md](docs/context/project-history.md) (decisions already made). Working inside the suite? Its own [CLAUDE.md](qa-coverage-kit/playwright-qa/CLAUDE.md) and [QA-LESSONS.md](qa-coverage-kit/playwright-qa/QA-LESSONS.md) apply there too.

---

## What this is

Shipwright is a portfolio repository. It holds two things:

- **The kit** (`qa-coverage-kit/`): a Claude Code skill, `/qa-coverage`, plus the Playwright suite it maintains. A QA analyst copies the kit into a product repository. The skill takes a Jira release, a ticket or a manual test, explores the deployed test environment, writes and runs Playwright tests, and after three review gates publishes a Confluence report and makes the Jira changes QA approved.
- **The case study** (`README.md`, `docs/`, `assets/`): what the kit does, why it is built the way it is, and an example run.

Vocabulary: a **release** is a Jira fixVersion; a **gate** is a set of questions the analyst answers in the run's draft file; a **finding** is a gap between what a ticket intended and what the app does; the **ledger** (`qa-ledger`) checks test IDs and generates the suite's docs.

The owner is a QA engineer. Readers of the case study are hiring managers and engineers, so the writing is plain and the claims are ones the code backs up.

---

## Rules that must not break

Numbers are permanent. A retired rule keeps its number, marked retired, so "rule 4" in a lesson or comment stays valid.

1. **The agent prepares; people decide.** The skill never moves a ticket, comments, files a bug or publishes a page until the analyst has answered the gate in the draft file. Write tools are left off the skill's `allowed-tools` line so each one prompts. Enforced in `SKILL.md` (step order) and lesson `write-tools-always-prompt`.
2. **Agents never read the suite's credentials.** `.claude/settings.json` denies the Read tool on `playwright-qa/scripts/.env` and `fixtures/auth.json`; the `guard-secret-reads.mjs` hook blocks shell commands that name them. The two must match: check `secret-guard-covers-deny-rules` runs the real hook against every deny rule.
3. **Test IDs are scoped and permanent.** `<TICKET>-<n>` or `MAN-<slug>-<n>`, never renumbered or reused. `qa-ledger --check` fails on a duplicate or a missing docstring. Details in the suite's `CLAUDE.md`.
4. **Generated text is never hand-edited.** The suite's `test-index.md`, `jira-test-mapping.md`, the `qa-ledger` marker blocks, and the lessons index in `docs/LESSONS.md` are rebuilt by their scripts. `npm run check` fails when any is stale.
5. **The kit is self-contained.** Nothing under `qa-coverage-kit/` may depend on files outside it, because it is copied into other repositories. Project values live in `workflow.toml`. Lesson `the-kit-is-self-contained`.
6. **Every file says what it is for, and every export says what it does.** Header comment on every code file, `/** ... */` on every export. Checks `every-file-has-a-header` and `exports-are-documented`.
7. **The case study tells the truth about the kit.** When the kit changes, the README and `docs/` change with it. Lesson `keep-the-portfolio-and-the-kit-in-step`.

---

## Run it

From the repository root (Node 20+, no install needed):

```
npm run check            # lessons + code checks + the suite's ledger. Run before handing over.
npm run lessons          # rebuild the lessons index after adding or changing a lesson
```

From `qa-coverage-kit/playwright-qa/scripts/` (needs `npm install` and a filled-in `.env`, which only a person edits):

```
npm run setup            # sign in and save the login
npm test                 # the whole suite against the live test environment
npm run typecheck        # tsc on the suite
npm run qa:ledger -- --write   # regenerate the suite's docs after changing a spec
```

The suite needs a real deployed app, so in this portfolio repo `npm test` is not expected to run. The checks above are.

---

## Layout

```
CLAUDE.md  AGENTS.md  CHANGELOG.md  README.md  LICENSE  package.json
scripts/lessons-index.mjs         validates lessons, rebuilds the index in docs/LESSONS.md
scripts/checks/repo-checks.mjs    code checks that enforce lessons
docs/                             case study docs, coding standards, lessons, project history (docs/README.md lists them)
assets/                           logo, banner, social preview, logo concepts
qa-coverage-kit/                  the installable kit (everything but SETUP.md is copied into a product repo)
  SETUP.md                        adoption steps
  workflow.toml  .mcp.json        project values; pinned Playwright MCP server
  .claude/settings.json           deny rules and hook registration
  .claude/hooks/                  guard-secret-reads.mjs
  .claude/skills/qa-coverage/     SKILL.md and references/ loaded per step
  playwright-qa/                  the suite: its own CLAUDE.md, QA-LESSONS.md, README.md, qa-output/, scripts/
```

---

## Conventions

- Code style, naming and comments: [docs/CODING-STANDARDS.md](docs/CODING-STANDARDS.md).
- **A new check** goes in `scripts/checks/repo-checks.mjs`, named after the `Enforced by: check <name>` line of the lesson it enforces.
- **A change to the skill** keeps the gates, keeps write tools off `allowed-tools`, and updates `docs/architecture.md` if a step moves.
- **A change to the suite** follows the suite's `CLAUDE.md`, then `qa:ledger -- --write`.
- **Writing:** plain English, short sentences, Title Case on headings shown as UI, no new em dashes.

---

## Versions and delivery

Work on a branch, never on `main`. Commit when the owner asks, and never push without asking. Each delivery adds a section to `CHANGELOG.md`.

---

## Not built

- No ESLint, Prettier or pre-commit hook. The repo has no install step, and the checks above use Node built-ins only. Add them if the kit grows past a handful of files.
- No automated run of the suite in this repo: it needs a live app and credentials.
- The comment and export checks cover code files only, not the skill's Markdown.
