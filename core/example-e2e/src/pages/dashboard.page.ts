import { expect, type Page } from '@playwright/test';
import { MatterDetailsDrawerComponent } from '../components/matter-details-drawer.component';
import { MatterResultsTableComponent } from '../components/matter-results-table.component';
import { SearchToolbarComponent } from '../components/search-toolbar.component';

export class DashboardPage {
  constructor(private readonly page: Page) {}

  root() {
    return this.page.getByTestId('dashboard-page');
  }

  activeRole() {
    return this.page.getByTestId('active-role');
  }

  searchToolbar() {
    return new SearchToolbarComponent(
      this.page.getByTestId('search-toolbar'),
      this.page.getByTestId('results-body'),
    );
  }

  resultsTable() {
    return new MatterResultsTableComponent(
      this.page.getByTestId('results-table'),
      this.page.getByTestId('matter-details-drawer'),
    );
  }

  detailsDrawer() {
    return new MatterDetailsDrawerComponent(this.page.getByTestId('matter-details-drawer'));
  }

  async expectLoaded(): Promise<this> {
    await expect(this.root()).toBeVisible();
    await this.resultsTable().expectLoaded();
    return this;
  }

  async expectSignedInAs(roleLabel: string): Promise<this> {
    await expect(this.activeRole()).toHaveText(roleLabel);
    return this;
  }
}
