import { expect, type Page } from '@playwright/test';
import { MatterDetailsDrawerComponent } from '../components/matter-details-drawer.component';
import { DashboardPage } from '../pages/dashboard.page';
import { LoginPage } from '../pages/login.page';

export class MatterWorkbenchService {
  private loginPage: LoginPage;
  private dashboard?: DashboardPage;
  private selectedMatter?: MatterDetailsDrawerComponent;

  constructor(page: Page) {
    this.loginPage = new LoginPage(page);
  }

  async open(): Promise<this> {
    await this.loginPage.open();
    this.dashboard = undefined;
    this.selectedMatter = undefined;
    return this;
  }

  async loginAs(role: 'qa-analyst' | 'team-lead'): Promise<this> {
    this.dashboard = await this.loginPage.loginAs(role);
    this.selectedMatter = undefined;
    return this;
  }

  async searchFor(query: string): Promise<this> {
    const dashboard = this.requireDashboard();
    await dashboard.searchToolbar().search(query);
    await expect(dashboard.searchToolbar().resultsCountBadge()).not.toHaveText('0');
    this.selectedMatter = undefined;
    return this;
  }

  async openMatter(matterId: string): Promise<this> {
    const dashboard = this.requireDashboard();
    this.selectedMatter = await dashboard.resultsTable().openMatter(matterId);
    return this;
  }

  async expectSelectedMatterStatus(status: string): Promise<this> {
    await this.requireSelectedMatter().expectStatus(status);
    return this;
  }

  async readSelectedMatterOwner(): Promise<string> {
    return this.requireSelectedMatter().readOwner();
  }

  async resultsCount(): Promise<number> {
    return this.requireDashboard().searchToolbar().resultsCount();
  }

  currentDashboard(): DashboardPage {
    return this.requireDashboard();
  }

  private requireDashboard(): DashboardPage {
    if (!this.dashboard) {
      throw new Error('Dashboard is not ready. Call open() and loginAs() first.');
    }

    return this.dashboard;
  }

  private requireSelectedMatter(): MatterDetailsDrawerComponent {
    if (!this.selectedMatter) {
      throw new Error('No matter is selected. Call openMatter() first.');
    }

    return this.selectedMatter;
  }
}
