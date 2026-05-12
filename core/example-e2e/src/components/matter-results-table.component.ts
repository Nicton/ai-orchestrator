import { expect, type Locator } from '@playwright/test';
import { MatterDetailsDrawerComponent } from './matter-details-drawer.component';

export class MatterResultsTableComponent {
  constructor(
    private readonly root: Locator,
    private readonly drawerRoot: Locator,
  ) {}

  body() {
    return this.root.getByTestId('results-body');
  }

  rowByMatterId(matterId: string) {
    return this.body().locator(`tr[data-matter-id="${matterId}"]`).first();
  }

  async expectLoaded(): Promise<this> {
    await expect(this.root).toBeVisible();
    await expect(this.body()).toBeVisible();
    return this;
  }

  async openMatter(matterId: string): Promise<MatterDetailsDrawerComponent> {
    const row = this.rowByMatterId(matterId);
    await expect(row).toBeVisible();
    await row.click();
    const drawer = new MatterDetailsDrawerComponent(this.drawerRoot);
    await drawer.expectOpened();
    await drawer.expectMatterId(matterId);
    return drawer;
  }
}
