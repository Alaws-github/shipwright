// Auth setup — runs once before the suite as the 'setup' project dependency.
// Caches storage state in fixtures/auth.json and reuses it only while enough session is left
// for a whole run (QA-LESSONS: auth-cache-reuse-must-cover-the-whole-run).
import { test as setup } from '@playwright/test';
import { login } from '../utils/auth';
import * as fs from 'fs';

const AUTH_FILE = 'fixtures/auth.json';
const MAX_AGE_MS = Number(process.env.AUTH_REUSE_MINUTES ?? 10) * 60 * 1000;

setup('authenticate', async ({ page }) => {
  if (fs.existsSync(AUTH_FILE)) {
    const age = Date.now() - fs.statSync(AUTH_FILE).mtimeMs;
    if (age < MAX_AGE_MS) {
      console.log('Reusing existing auth state (age: ' + Math.round(age / 1000) + 's)');
      return;
    }
  }
  await login(page);
  await page.context().storageState({ path: AUTH_FILE });
});
