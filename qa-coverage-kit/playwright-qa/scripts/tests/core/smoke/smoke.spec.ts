import { test, expect } from '@playwright/test';
import { HomePage } from '../../../pages/HomePage';

test.describe('Smoke', () => {
  /** MAN-smoke-1: Signed-in user reaches the home page | MAN-smoke AC1 | Positive | Critical
   *  Verifies: the saved login opens the home page without being sent back to sign in. */
  test('MAN-smoke-1 — signed-in user reaches the home page', async ({ page }) => {
    const home = new HomePage(page);
    await home.goto();
    await expect(page).not.toHaveURL(/\/login/);
  });
});
