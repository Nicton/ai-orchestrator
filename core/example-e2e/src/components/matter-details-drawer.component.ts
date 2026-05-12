import { expect, type Locator } from '@playwright/test';

export class MatterDetailsDrawerComponent {
  constructor(private readonly root: Locator) {}

  closeButton() {
    return this.root.getByTestId('close-drawer-button');
  }

  field(name: 'id' | 'title' | 'status' | 'owner') {
    return this.root.getByTestId(`details-${name}`);
  }

  async expectOpened(): Promise<this> {
    await expect(this.root).toBeVisible();
    return this;
  }

  async expectMatterId(matterId: string): Promise<this> {
    await expect(this.field('id')).toHaveText(matterId);
    return this;
  }

  async expectStatus(status: string): Promise<this> {
    await expect(this.field('status')).toHaveText(status);
    return this;
  }

  async readOwner(): Promise<string> {
    const value = await this.field('owner').textContent();
    return value?.trim() ?? '';
  }

  async close(): Promise<void> {
    await this.closeButton().click();
    await expect(this.root).toBeHidden();
  }
}
