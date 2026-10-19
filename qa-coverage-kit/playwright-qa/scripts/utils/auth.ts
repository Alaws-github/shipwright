import { Page } from '@playwright/test';

// Shared QA account used by auth.setup.ts to seed fixtures/auth.json.
// Tests consume the saved storage state — this only runs when the cache is absent or too old.
const EMAIL = process.env.QA_EMAIL!;
const PASSWORD = process.env.QA_PASSWORD!;

// TODO(setup): match your app's login form. Prefer role/label locators over CSS.
export async function login(page: Page): Promise<void> {
  if (!EMAIL || !PASSWORD) throw new Error('QA_EMAIL and QA_PASSWORD must be set in scripts/.env');
  await page.goto('/login');
  await page.getByLabel('Email').fill(EMAIL);
  await page.getByLabel('Password').fill(PASSWORD);
  await page.getByRole('button', { name: 'Sign in' }).click();
  await page.waitForURL((url) => !url.pathname.startsWith('/login'), { timeout: 60000 });
}
