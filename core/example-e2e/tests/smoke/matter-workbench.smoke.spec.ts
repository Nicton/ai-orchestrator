import { expect, test } from '../../src/fixtures/app.fixture';

test('SMOKE: fluent service flow opens a matter and verifies its status', async ({ app }) => {
  await app.open();
  await app.loginAs('qa-analyst');
  await app.searchFor('MAT-101');
  await app.openMatter('MAT-101');
  await app.expectSelectedMatterStatus('Open');

  await expect(app.currentDashboard().activeRole()).toHaveText('QA Analyst');
});

test('SMOKE: service may return meaningful values when that is the real outcome', async ({ app }) => {
  await app.open();
  await app.loginAs('team-lead');
  await app.searchFor('Ava');

  await expect(await app.resultsCount()).toBe(2);

  await app.openMatter('MAT-103');
  await expect(await app.readSelectedMatterOwner()).toBe('Ava');
});
