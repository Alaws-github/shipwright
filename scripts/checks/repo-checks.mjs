#!/usr/bin/env node
// Code checks that enforce lessons: file headers, documented exports, and the secret guard.
//
// Each check's name matches the `**Enforced by:** check <name>` line of the lesson it enforces,
// so a failure points straight at the rule. Add a check here when a lesson can be checked by a script.
//
// Usage (from the repo root): npm run check:code

import { readFileSync, readdirSync, statSync } from 'node:fs';
import { join, dirname, relative, extname } from 'node:path';
import { fileURLToPath } from 'node:url';
import { spawnSync } from 'node:child_process';

const ROOT = join(dirname(fileURLToPath(import.meta.url)), '..', '..');
const CODE_EXT = new Set(['.ts', '.mjs', '.cjs', '.js']);
const SKIP_DIRS = new Set(['node_modules', '.git', 'assets', 'playwright-report', 'test-results', '.playwright-mcp']);
const KIT = 'qa-coverage-kit';

const failures = [];
const fail = (check, detail) => failures.push(`${check}: ${detail}`);
const rel = (p) => relative(ROOT, p).replaceAll('\\', '/');
// Lesson generated-docs-must-ignore-line-endings: compare in LF.
const read = (p) => readFileSync(p, 'utf8').replaceAll('\r\n', '\n');

function walk(dir) {
  const out = [];
  for (const name of readdirSync(dir)) {
    if (SKIP_DIRS.has(name)) continue;
    const full = join(dir, name);
    if (statSync(full).isDirectory()) out.push(...walk(full));
    else out.push(full);
  }
  return out;
}

const codeFiles = walk(ROOT).filter((f) => CODE_EXT.has(extname(f)));

// ---------- every-file-has-a-header (lesson document-every-file-and-export)
// The first line after any shebang must be a comment saying what the file is for.
for (const f of codeFiles) {
  const first = read(f)
    .split('\n')
    .filter((l, i) => !(i === 0 && l.startsWith('#!')))
    .find((l) => l.trim());
  if (!first || !/^\s*(\/\/|\/\*)/.test(first)) fail('every-file-has-a-header', `${rel(f)} does not start with a header comment`);
}

// ---------- exports-are-documented (lesson document-every-file-and-export)
// Every export has a /** ... */ comment directly above it.
const EXPORT = /^export\s+(default\b|(async\s+)?function\b|class\b|const\b|let\b|type\b|interface\b|enum\b)/;
for (const f of codeFiles) {
  const lines = read(f).split('\n');
  lines.forEach((line, i) => {
    if (!EXPORT.test(line)) return;
    let j = i - 1;
    while (j >= 0 && !lines[j].trim()) j--;
    if (j < 0 || !lines[j].trim().endsWith('*/')) {
      fail('exports-are-documented', `${rel(f)}:${i + 1} has no /** ... */ comment above the export`);
    }
  });
}

// ---------- secret-guard-covers-deny-rules (lesson secret-guard-matches-deny-rules)
// Every path the settings deny to the Read tool must also be blocked by the shell hook, and an
// ordinary command must still pass. Runs the real hook, so a regex change is tested for real.
const hook = join(ROOT, KIT, '.claude', 'hooks', 'guard-secret-reads.mjs');
const runHook = (command, cwd = ROOT) =>
  spawnSync(process.execPath, [hook], { input: JSON.stringify({ tool_input: { command }, cwd }), encoding: 'utf8' }).status;
const settings = JSON.parse(read(join(ROOT, KIT, '.claude', 'settings.json')));
const denied = (settings.permissions?.deny ?? []).map((r) => r.match(/^Read\(\/?(.+)\)$/)?.[1]).filter(Boolean);
if (!denied.length) fail('secret-guard-covers-deny-rules', 'settings.json has no Read deny rules');
for (const path of denied) {
  for (const command of [`cat ${path}`, `Get-Content ${path.replaceAll('/', '\\')}`]) {
    if (runHook(command) !== 2) fail('secret-guard-covers-deny-rules', `hook lets "${command}" through`);
  }
}
for (const command of ['cat README.md', 'cat .claude/.env', 'npm run qa:ledger -- --check']) {
  if (runHook(command) !== 0) fail('secret-guard-covers-deny-rules', `hook blocks the harmless command "${command}"`);
}

console.log(`repo-checks: ${codeFiles.length} code files, ${failures.length} problems`);
for (const f of failures) console.log(`  x ${f}`);
process.exitCode = failures.length ? 1 : 0;
