#!/usr/bin/env node
// PreToolUse hook: block shell commands that reference the QA suite's credential files.
//
// .claude/settings.json denies the Read tool on these paths, but a shell command
// (cat, type, Get-Content, cp, grep ...) isn't covered by a Read rule. This closes that gap
// for the Bash and PowerShell tools.
//
// The patterns err on the side of blocking: a path blocked by mistake costs one retry, while
// one that slips through can't be undone. They also match paths relative to the suite
// (scripts/.env from playwright-qa/, or a bare .env when the command runs inside
// playwright-qa/scripts/), and fixtures/auth.json anywhere.
//
// Keep this in sync with the Read deny rules in .claude/settings.json.
// Reads the hook payload (JSON) on stdin. Exit 2 blocks the call and sends stderr to the agent.

const NOT_PATH = String.raw`(?<![\w.\\/-])`; // start of a path token, so .claude/.env and my-scripts/.env don't match
const SECRET = new RegExp(
  [
    String.raw`playwright-qa[\\/]scripts[\\/]\.env(?![\w.-])`,
    NOT_PATH + String.raw`scripts[\\/]\.env(?![\w.-])`,
    String.raw`fixtures[\\/]auth\.json`,
  ].join('|'),
  'i',
);
const BARE_ENV = new RegExp(NOT_PATH + String.raw`\.env(?![\w.-])`, 'i');

const inSuiteScripts = (cwd) => /playwright-qa[\\/]scripts(?:[\\/]|$)/i.test(cwd ?? '');

let raw = '';
process.stdin.on('data', (chunk) => (raw += chunk));
process.stdin.on('end', () => {
  let payload;
  try {
    payload = JSON.parse(raw);
  } catch {
    process.exit(0);
  }
  const command = payload?.tool_input?.command ?? '';
  const hit = command.match(SECRET)?.[0] ?? (inSuiteScripts(payload?.cwd) ? command.match(BARE_ENV)?.[0] : undefined);
  if (!hit) process.exit(0);
  process.stderr.write(
    `Blocked: this command references a credential file (${hit}). Agents must not read, copy or print it ` +
      '(see the deny rules in .claude/settings.json). Refer to the variable name instead, or ask the user to run the command themselves.\n',
  );
  process.exit(2);
});
