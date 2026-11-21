// Route: / . The page a signed-in user lands on.
// TODO(setup): point `heading` at something that only renders once the page is ready.
import type { Locator, Page } from '@playwright/test';
import { BasePage } from './BasePage';

/** The home page: its ready marker and how to open it. */
export class HomePage extends BasePage {
  readonly heading: Locator;

  constructor(page: Page) {
    super(page);
    this.heading = page.getByRole('heading', { level: 1 });
  }

  /** Open the home page and wait until its heading has rendered. */
  async goto(): Promise<void> {
    await this.open('/', this.heading);
  }
}
