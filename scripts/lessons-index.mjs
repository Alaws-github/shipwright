#!/usr/bin/env node
// Validates every lesson entry and rebuilds the generated index in docs/LESSONS.md.
//
// A lesson is a `### <slug> \`<tag>\`` heading in one of the LESSON_FILES, ending with an
// `**Enforced by:**` line (docs/LESSONS.md explains the format). This script fails on a bad slug,
// a bad tag, a repeated slug or a missing Enforced by line, so a lesson can't be half written.
//
// Usage (from the repo root):
//   npm run lessons          rebuild the index
//   npm run check:lessons    exit 1 if an entry is invalid or the index is stale

import { readFileSync, writeFileSync, existsSync } from 'node:fs';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

const ROOT = join(dirname(fileURLToPath(import.meta.url)), '..');
const INDEX_FILE = 'docs/LESSONS.md';

/** Every file that holds lessons, with the area its entries belong to. */
export const LESSON_FILES = [
  { path: 'docs/lessons/general.md', area: 'general' },
  { path: 'docs/lessons/kit.md', area: 'kit' },
  { path: 'qa-coverage-kit/playwright-qa/QA-LESSONS.md', area: 'suite' },
];

/** The tags a lesson may carry: how the rule was discovered. */
export const LESSON_TAGS = ['bug', 'correction', 'design'];

const SLUG = /^[a-z0-9]+(?:-[a-z0-9]+)*$/;
const HEADING = /^### (\S+)(?: `([^`]*)`)?\s*$/;
// An Enforced by line that starts with one of these words means a machine checks the rule.
const MACHINE_MARKS = ['check', 'test', 'code'];
const START = '<!-- lessons-index:start -->';
const END = '<!-- lessons-index:end -->';

// Checkouts with core.autocrlf=true have CRLF on disk. Work in LF (lesson generated-docs-must-ignore-line-endings).
const readLf = (rel) => readFileSync(join(ROOT, rel), 'utf8').replaceAll('\r\n', '\n');

/** Read every lesson entry from the lesson files, with any problems found in it. */
export function readLessons() {
  const lessons = [];
  const errors = [];
  for (const { path, area } of LESSON_FILES) {
    if (!existsSync(join(ROOT, path))) {
      errors.push(`${path}: lesson file is missing`);
      continue;
    }
    const lines = readLf(path).split('\n');
    lines.forEach((line, i) => {
      const m = line.match(HEADING);
      if (!m) return;
      const [, slug, tag] = m;
      const where = `${path}:${i + 1}`;
      const nextHeading = lines.findIndex((l, j) => j > i && /^#{1,3} /.test(l));
      const body = lines.slice(i + 1, nextHeading === -1 ? lines.length : nextHeading);
      const enforced = body.find((l) => l.startsWith('**Enforced by:**'))?.replace('**Enforced by:**', '').trim();
      if (!SLUG.test(slug)) errors.push(`${where}: slug "${slug}" is not kebab-case`);
      if (!LESSON_TAGS.includes(tag)) errors.push(`${where}: ${slug} has tag "${tag ?? ''}"; use one of ${LESSON_TAGS.join(', ')}`);
      if (!enforced) errors.push(`${where}: ${slug} has no **Enforced by:** line`);
      const mark = MACHINE_MARKS.find((w) => enforced?.startsWith(w)) ?? null;
      lessons.push({ slug, tag, area, path, mark, where });
    });
  }
  const seen = new Map();
  for (const l of lessons) {
    if (seen.has(l.slug)) errors.push(`${l.where}: slug ${l.slug} repeats ${seen.get(l.slug)}`);
    else seen.set(l.slug, l.where);
  }
  return { lessons, errors };
}

function renderIndex(lessons) {
  const lines = [`${lessons.length} lessons. A mark in brackets means a machine enforces the rule.`, ''];
  for (const { path, area } of LESSON_FILES) {
    const inArea = lessons.filter((l) => l.area === area);
    lines.push(`**${area}** ([${path}](${path.startsWith('docs/') ? path.slice(5) : `../${path}`}))`, '');
    for (const l of inArea) lines.push(`- \`${l.slug}\` ${l.tag}${l.mark ? ` (${l.mark})` : ''}`);
    lines.push('');
  }
  return lines.join('\n').trimEnd();
}

function main() {
  const isCheck = process.argv.includes('--check');
  const { lessons, errors } = readLessons();
  const text = readLf(INDEX_FILE);
  const start = text.indexOf(START);
  const end = text.indexOf(END);
  if (start === -1 || end < start) errors.push(`${INDEX_FILE}: missing ${START} / ${END} markers`);
  else {
    const updated = `${text.slice(0, start + START.length)}\n${renderIndex(lessons)}\n${text.slice(end)}`;
    if (updated !== text) {
      if (isCheck) errors.push(`${INDEX_FILE}: index is stale; run npm run lessons`);
      else {
        const eol = readFileSync(join(ROOT, INDEX_FILE), 'utf8').includes('\r\n') ? '\r\n' : '\n';
        writeFileSync(join(ROOT, INDEX_FILE), updated.replaceAll('\n', eol));
        console.log(`Wrote ${INDEX_FILE}`);
      }
    }
  }
  console.log(`lessons: ${lessons.length} entries, ${errors.length} problems`);
  for (const e of errors) console.log(`  x ${e}`);
  process.exitCode = errors.length ? 1 : 0;
}

if (process.argv[1] && fileURLToPath(import.meta.url) === process.argv[1]) main();
