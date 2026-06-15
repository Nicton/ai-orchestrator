import { test } from '../../src/fixtures/app.fixture';
import { LoginPage } from '../../src/pages/login.page';
import { installDemoApp } from '../../src/infrastructure/demo-app';

test('REGRESSION: page methods return the next page only when UI context changes', async ({ page }) => {
  await installDemoApp(page);

  const loginPage = await new LoginPage(page).open();
  const dashboardPage = await loginPage.loginAs('qa-analyst');
  await dashboardPage.expectSignedInAs('QA Analyst');

  await dashboardPage.searchToolbar().search('MAT-102');
  await dashboardPage.resultsTable().openMatter('MAT-102');
  await dashboardPage.detailsDrawer().expectStatus('Review');
});
