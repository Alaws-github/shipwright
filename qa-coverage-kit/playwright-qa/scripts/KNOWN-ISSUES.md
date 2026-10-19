# Known Issues — Playwright Test Suite

> **Scope:** test-suite and test-infrastructure issues only. **App bugs are filed in Jira** and referenced by their Jira key, never recorded here. Entries use `## ISS-TS-<slug>: <title>` (see `playwright-qa/CLAUDE.md` → Identifiers), and each has **Affected**, **Status**, **Symptom**, **Root cause** and **Workaround / fix** lines. Change the **Status** line when an entry is resolved; don't delete it.

## ISS-TS-node-registerhooks-conditions-set: Playwright config load crashes on some Node/Playwright pairings

**Affected**: every Playwright command — fails before any test is collected
**Status**: Watch — seen with Node 22.16 + Playwright 1.61 on another project

**Symptom**: `TypeError: context.conditions?.includes is not a function` inside Playwright's module loader (`esmLoaderSync`), raised while loading `playwright.config.ts`.

**Root cause**: Playwright 1.61 uses Node's synchronous `module.registerHooks` when it exists; Node 22.16 passes `context.conditions` as a `Set`, which has no `.includes()`.

**Workaround / fix**: set `PLAYWRIGHT_FORCE_ASYNC_LOADER=1` for the command, or move Node or Playwright to a pairing that doesn't crash and pin it.
