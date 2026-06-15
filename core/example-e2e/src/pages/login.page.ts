import { expect, type Page } from '@playwright/test';
import { DEMO_APP_URL } from '../infrastructure/demo-app';
import { DashboardPage } from './dashboard.page';

export class LoginPage {
  constructor(private readonly page: Page) {}

  root() {
    return this.page.getByTestId('login-page');
  }

  roleSelect() {
    return this.page.getByTestId('role-select');
  }

  signInButton() {
    return this.page.getByTestId('sign-in-button');
  }

  async open(): Promise<this> {
    await this.page.goto(DEMO_APP_URL, { waitUntil: 'domcontentloaded' });
    await expect(this.root()).toBeVisible();
    return this;
  }

  async loginAs(role: 'qa-analyst' | 'team-lead'): Promise<DashboardPage> {
    await expect(this.root()).toBeVisible();
    await this.roleSelect().selectOption(role);
    await this.signInButton().click();

    const dashboard = new DashboardPage(this.page);
    await dashboard.expectLoaded();
    return dashboard;
  }
}
