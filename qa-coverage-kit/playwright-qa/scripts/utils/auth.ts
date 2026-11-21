// Signs the shared QA account in. auth.setup.ts calls it to write fixtures/auth.json.
// Tests reuse that saved login, so this only runs when the cache is missing or too old.
import type { Page } from '@playwright/test';

const EMAIL = process.env.QA_EMAIL!;
const PASSWORD = process.env.QA_PASSWORD!;

/**
 * Sign in through the app's login form and wait until the browser has left the login page.
 * TODO(setup): match your app's login form. Prefer role and label locators over CSS.
 */
export async function login(page: Page): Promise<void> {
  if (!EMAIL || !PASSWORD) throw new Error('QA_EMAIL and QA_PASSWORD must be set in scripts/.env');
  await page.goto('/login');
  await page.getByLabel('Email').fill(EMAIL);
  await page.getByLabel('Password').fill(PASSWORD);
  await page.getByRole('button', { name: 'Sign in' }).click();
  await page.waitForURL((url) => !url.pathname.startsWith('/login'), { timeout: 60000 });
}
