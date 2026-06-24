/* testcafe-reporter-tms — TestCafe reporter for the QA Platform (TMS/RMS).
 *
 * Sends task/test events (reportTaskStart → reportTestStart → reportTestDone →
 * reportTaskDone). Step-level reporting in TestCafe is not native; this reporter
 * works at test level (the TMS architecture still accepts step events if you add
 * manual instrumentation). Buffered with a final bulk fallback; idempotent.
 *
 * Env config (same as the Playwright reporter):
 *   TMS_BASE_URL, TMS_API_TOKEN, TMS_PROJECT_ID, TMS_TEST_PLAN_ID, TMS_RUN_NAME, TMS_BULK_FALLBACK
 *
 * .testcaferc.json: { "reporter": "tms" }   (or `testcafe ... -r tms`)
 */
const crypto = require('node:crypto');

function makeClient() {
  const base = (process.env.TMS_BASE_URL || '').replace(/\/$/, '');
  const token = process.env.TMS_API_TOKEN || '';
  const projectId = process.env.TMS_PROJECT_ID || '';
  const testPlanId = process.env.TMS_TEST_PLAN_ID || '';
  const bulkFallback = (process.env.TMS_BULK_FALLBACK || 'true') !== 'false';
  const enabled = !!(base && projectId);
  const buffer = [];
  async function post(path, body) {
    if (!enabled) return null;
    const headers = { 'content-type': 'application/json' };
    if (token) headers['x-qa-token'] = token;
    for (let a = 0; a < 3; a++) {
      try { const r = await fetch(`${base}/api/qa${path}`, { method: 'POST', headers, body: JSON.stringify(body) }); if (r.ok) return r.json().catch(() => ({})); if (r.status < 500) return null; } catch (_) {}
      await new Promise((res) => setTimeout(res, 300 * (a + 1)));
    }
    return null;
  }
  return { base, projectId, testPlanId, bulkFallback, enabled, buffer, post };
}

module.exports = function () {
  const c = makeClient();
  let runId = null; let currentFixture = '';
  const ev = (eventType, extra) => { const e = { eventId: crypto.randomUUID(), eventType, timestamp: Date.now(), ...extra }; c.buffer.push(e); if (runId) c.post(`/test-runs/${runId}/events`, e).catch(() => {}); };
  const extId = (name) => `${currentFixture}::${name}`;

  return {
    noColors: true,
    async reportTaskStart(startTime, userAgents, testCount) {
      if (!c.enabled) { return; }
      const title = process.env.TMS_RUN_NAME || `TestCafe run ${new Date().toISOString()}`;
      const run = c.testPlanId ? await c.post(`/test-plans/${c.testPlanId}/runs`, { title, source: 'Automated' }) : await c.post(`/projects/${c.projectId}/test-runs`, { title, source: 'Automated' });
      runId = run && run.id;
      if (runId) await c.post(`/test-runs/${runId}/start`, {});
      ev('RunStarted', { total: testCount });
    },
    reportFixtureStart(name) { currentFixture = name; },
    reportTestStart(name) { ev('TestStarted', { externalTestId: extId(name), name }); },
    reportTestDone(name, testRunInfo) {
      const status = testRunInfo.skipped ? 'Skipped' : (testRunInfo.errs && testRunInfo.errs.length ? 'Failed' : 'Passed');
      const msg = (testRunInfo.errs && testRunInfo.errs.length) ? this.formatError(testRunInfo.errs[0]).slice(0, 2000) : undefined;
      ev('TestFinished', { externalTestId: extId(name), name, status, durationMs: testRunInfo.durationMs, failureMessage: msg });
    },
    async reportTaskDone(endTime, passed, warnings, result) {
      if (!c.enabled || !runId) return;
      ev('RunFinished', { status: 'completed' });
      if (c.bulkFallback) await c.post(`/test-runs/${runId}/events/bulk`, { events: c.buffer }).catch(() => {});
      await c.post(`/test-runs/${runId}/finish`, {}).catch(() => {});
    },
  };
};
