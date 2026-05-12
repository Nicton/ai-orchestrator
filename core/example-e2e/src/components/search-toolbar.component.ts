import { expect, type Locator } from '@playwright/test';

export class SearchToolbarComponent {
  constructor(
    private readonly root: Locator,
    private readonly resultsBody: Locator,
  ) {}

  input() {
    return this.root.getByTestId('matter-search-input');
  }

  searchButton() {
    return this.root.getByTestId('matter-search-button');
  }

  resultsCountBadge() {
    return this.root.getByTestId('results-count');
  }

  async search(query: string): Promise<this> {
    await this.input().fill(query);
    await this.searchButton().click();
    await expect(this.resultsBody).toBeVisible();
    await expect(this.resultsCountBadge()).not.toHaveText('');
    return this;
  }

  async resultsCount(): Promise<number> {
    const countText = await this.resultsCountBadge().textContent();
    return Number(countText?.trim() ?? '0');
  }
}
