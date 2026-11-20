# Coding standards

How code and docs are written in this repository. The suite's own conventions (page objects, test IDs, `test.fail()` rules) are in [the suite's CLAUDE.md](../qa-coverage-kit/playwright-qa/CLAUDE.md) and apply on top of these.

## Guides followed

| Area | Guide |
|---|---|
| Playwright tests | Playwright's own best practices: user-facing locators, web-first assertions, no fixed waits |
| TypeScript | `strict` on. Don't turn a check off to make an error go away |
| Node scripts | ES modules (`.mjs`), Node built-ins only, `node:` prefix on imports |
| Claude Code skill | Claude Code's skill format: frontmatter, then the workflow; detail in `references/` loaded per step |

## Naming

| What | Style | Example |
|---|---|---|
| Scripts and Node files | kebab-case, named for what they do | `qa-ledger.mjs`, `guard-secret-reads.mjs` |
| Page objects | PascalCase, `<Thing>Page.ts` | `HomePage.ts` |
| Spec files | kebab-case by area, `<area>.spec.ts` in `tests/core/<area>/` | `tests/core/smoke/smoke.spec.ts` |
| Functions and methods | camelCase verb phrase, named for what the user does in page objects | `selectPeriod`, `readLessons` |
| Booleans | `is`, `has`, `can`, `should` | `isCheck`, `knownBugNowPassing` |
| Constants and lookup tables | UPPER_SNAKE_CASE | `ID_PATTERN`, `LESSON_FILES` |
| Lesson slugs | kebab-case, never numbers | `secret-guard-matches-deny-rules` |
| Test IDs | `<TICKET>-<n>` or `MAN-<slug>-<n>` | `PROJ-327-1` |
| Skill reference files | kebab-case by step or topic | `intake-release.md` |

Short names (`f`, `l`, `m`) are fine inside a few lines where the meaning is obvious.

## Comments

1. **A header comment on every code file.** The first sentence says what the file is for. A shebang line may come first.

   ```js
   #!/usr/bin/env node
   // qa-baseline: summarise the last Playwright run's unexpected results.
   ```

2. **A `/** ... */` comment on every export**, directly above it: what a function returns or does, what a class or constant holds. One or two sentences.

   ```ts
   /** Open the home page and wait until its heading has rendered. */
   async goto(): Promise<void> {
   ```

3. **Inside code, comment the why**: a rule, a trap, a decision. When a line enforces a lesson, name it: `// QA-LESSONS: playwright-isvisible-is-one-shot` or `// lesson secret-guard-matches-deny-rules`.
4. No commented-out code. Section dividers in long files are fine.

Rules 1 and 2 are checked by `npm run check` (`every-file-has-a-header`, `exports-are-documented`).

## Structure

- One function, one job. A function that needs a comment to separate its parts should be split into named functions.
- Spec files hold no selectors; page objects do. Navigation goes through `BasePage.open(path, ready)`.
- Scripts that write generated text normalise line endings before comparing and write back in the file's own ending.
- Check scripts print one line per problem, `<check-name>: <file>:<line> <what is wrong>`, and exit 1 on any problem.

## Writing

Plain English, short sentences, active voice, no marketing language. New writing has no em dashes. Docs say what a thing does and why.
