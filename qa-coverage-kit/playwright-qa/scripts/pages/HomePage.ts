import { Page, Locator } from '@playwright/test';
import { BasePage } from './BasePage';

// Route: / — the page a signed-in user lands on.
// TODO(setup): point `heading` at something that only renders once the page is ready.
export class HomePage extends BasePage {
  readonly heading: Locator;

  constructor(page: Page) {
    super(page);
    this.heading = page.getByRole('heading', { level: 1 });
  }

  async goto(): Promise<void> {
    await this.open('/', this.heading);
  }
}
