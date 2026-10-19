#!/usr/bin/env node
// qa-baseline — summarise the last Playwright run's unexpected results.
//
// Reads playwright-report/results.json (written by the json reporter in playwright.config.ts)
// and prints every test whose outcome was not what the suite expected: failures, flaky
// passes, and `test.fail()` tests that unexpectedly passed (a known bug that looks fixed).
// Used by /qa-coverage right after the baseline run — every later Playwright command,
// including `npm run setup`, overwrites results.json, so run this immediately.
//
// Usage (from playwright-qa/scripts/):
//   npm run qa:baseline               summary lines
//   npm run qa:baseline -- --json     full list as JSON

import { readFileSync, existsSync } from 'node:fs';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

const RESULTS = join(dirname(fileURLToPath(import.meta.url)), '..', 'playwright-report', 'results.json');
const ID_PATTERN = /^(MAN-[a-z0-9]+(?:-[a-z0-9]+)*-\d+|[A-Z][A-Z0-9]+-\d+-\d+)\b/;

if (!existsSync(RESULTS)) {
  console.error(`No results file at ${RESULTS} — run the suite first (without --reporter).`);
  process.exit(1);
}

const report = JSON.parse(readFileSync(RESULTS, 'utf8'));
const unexpected = [];
let total = 0;

const walk = (suite) => {
  for (const spec of suite.specs ?? []) {
    for (const test of spec.tests) {
      total++;
      if (test.status !== 'unexpected' && test.status !== 'flaky') continue;
      const last = test.results.at(-1) ?? {};
      unexpected.push({
        id: spec.title.match(ID_PATTERN)?.[1] ?? null,
        title: spec.title,
        location: `${spec.file}:${spec.line}`,
        outcome: test.status,
        expected: test.expectedStatus,
        actual: last.status ?? null,
        // expectedStatus "failed" + actual "passed" = a test.fail() marker whose bug looks fixed.
        knownBugNowPassing: test.expectedStatus === 'failed' && last.status === 'passed',
        // Playwright error messages carry ANSI colour codes; strip them for the draft.
        error: (last.error?.message ?? '').replace(/\u001b\[[0-9;]*m/g, '').split('\n')[0].slice(0, 200),
      });
    }
  }
  for (const child of suite.suites ?? []) walk(child);
};
report.suites.forEach(walk);

const summary = {
  startTime: report.stats?.startTime ?? null,
  durationMinutes: report.stats ? Math.round(report.stats.duration / 60000) : null,
  total,
  unexpected: unexpected.length,
};

if (process.argv.includes('--json')) {
  console.log(JSON.stringify({ summary, unexpected }, null, 2));
} else {
  console.log(`Run ${summary.startTime} · ${summary.durationMinutes} min · ${summary.total} tests · ${summary.unexpected} unexpected`);
  for (const u of unexpected) {
    const flag = u.knownBugNowPassing ? 'KNOWN BUG NOW PASSING' : u.outcome;
    console.log(`- ${u.id ?? '(no id)'} [${flag}] ${u.location} — ${u.error || u.title}`);
  }
}
