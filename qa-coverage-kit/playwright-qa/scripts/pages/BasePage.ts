import { Page, Locator, expect } from '@playwright/test';

export class BasePage {
  readonly page: Page;

  constructor(page: Page) {
    this.page = page;
  }

  /**
   * Go to `path` and wait until `ready` is visible. Callers pass the element that proves the page
   * has actually rendered — never a one-shot isVisible() and never networkidle
   * (QA-LESSONS: playwright-isvisible-is-one-shot, wait-on-the-thing-that-actually-changes).
   */
  async open(path: string, ready: Locator, timeout = 20000): Promise<void> {
    await this.page.goto(path);
    await expect(ready).toBeVisible({ timeout });
  }
}
