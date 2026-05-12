import { test as base } from '@playwright/test';
import { installDemoApp } from '../infrastructure/demo-app';
import { MatterWorkbenchService } from '../services/matter-workbench.service';

export const test = base.extend<{ app: MatterWorkbenchService }>({
  app: async ({ page }, use) => {
    await installDemoApp(page);
    await use(new MatterWorkbenchService(page));
  },
});

export { expect } from '@playwright/test';
