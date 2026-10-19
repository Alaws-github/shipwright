// Playwright configuration for the QA suite.
// workers: 1 + fullyParallel: false — sequential execution against a shared, live environment
// prevents auth and data conflicts. Auth state is seeded by auth.setup.ts.
//
// Keep the json reporter: /qa-coverage's baseline step reads playwright-report/results.json
// through `npm run qa:baseline`.
import { defineConfig, devices } from '@playwright/test';
import * as dotenv from 'dotenv';
dotenv.config();

export default defineConfig({
  testDir: './tests',
  timeout: 60000,
  // The suite's time budget. An overrun fails loudly instead of the run slowly growing past the
  // login lifetime. Keep it below the session lifetime minus the auth reuse window (auth.setup.ts).
  globalTimeout: 15 * 60 * 1000,
  fullyParallel: false,
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 2 : 0,
  workers: 1,
  reporter: [
    ['list'],
    ['html', { outputFolder: 'playwright-report', open: 'never' }],
    ['json', { outputFile: 'playwright-report/results.json' }],
  ],
  use: {
    baseURL: process.env.BASE_URL,
    trace: 'on-first-retry',
    screenshot: 'only-on-failure',
    video: 'retain-on-failure',
  },
  projects: [
    { name: 'setup', testMatch: '**/auth.setup.ts' },
    {
      name: 'chromium',
      use: { ...devices['Desktop Chrome'], storageState: 'fixtures/auth.json' },
      dependencies: ['setup'],
    },
  ],
});
