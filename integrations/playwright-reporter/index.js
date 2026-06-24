/* tms-playwright-reporter — live reporter for the QA Platform (TMS/RMS).
 *
 * Streams run/test/step events to the TMS as they happen (onBegin → onTestBegin →
 * onStepBegin → onStepEnd → onTestEnd → onEnd), with a buffered retry queue and a
 * final bulk fallback so partial results survive a crash. Idempotent via eventId.
 *
 * Config via env:
 *   TMS_BASE_URL   e.g. https://searchify.asmalouski.com
 *   TMS_API_TOKEN  value of QA_API_TOKEN on the server (sent as x-qa-token)
 *   TMS_PROJECT_ID QA project id (cuid)
 *   TMS_TEST_PLAN_ID  optional — create the run from a test plan
 *   TMS_RUN_NAME   optional run title
 *   TMS_SEND_STEPS true|false (default true)
 *   TMS_BULK_FALLBACK true|false (default true)
 *
 * playwright.config.ts:
 *   reporter: [['tms-playwright-reporter']]
 */
const crypto = require('node:crypto');

class TmsReporter {
  constructor() {
    this.base = (process.env.TMS_BASE_URL || '').replace(/\/$/, '');
    this.token = process.env.TMS_API_TOKEN || '';
    this.projectId = process.env.TMS_PROJECT_ID || '';
    this.testPlanId = process.env.TMS_TEST_PLAN_ID || '';
    this.sendSteps = (process.env.TMS_SEND_STEPS || 'true') !== 'false';
    this.bulkFallback = (process.env.TMS_BULK_FALLBACK || 'true') !== 'false';
    this.runId = null;
    this.buffer = []; // events sent for bulk fallback
    this.enabled = !!(this.base && this.projectId);
  }

  externalId(test) {
    // stable, code-level id: relativeFile::fullTitle
    const file = (test.location && test.location.file) || '';
    const rel = file.split(/[\\/]/).slice(-3).join('/');
    return `${rel}::${test.titlePath().slice(1).join(' > ')}`;
  }

  async post(path, body) {
    if (!this.enabled) return null;
    const headers = { 'content-type': 'application/json' };
    if (this.token) headers['x-qa-token'] = this.token;
    for (let attempt = 0; attempt < 3; attempt++) {
      try {
        const res = await fetch(`${this.base}/api/qa${path}`, { method: 'POST', headers, body: JSON.stringify(body) });
        if (res.ok) return res.json().catch(() => ({}));
        if (res.status < 500) return null; // client error → don't retry
      } catch (_) { /* network → retry */ }
      await new Promise((r) => setTimeout(r, 300 * (attempt + 1)));
    }
    return null;
  }

  event(eventType, extra) {
    const e = { eventId: crypto.randomUUID(), eventType, timestamp: Date.now(), ...extra };
    this.buffer.push(e);
    if (this.runId) this.post(`/test-runs/${this.runId}/events`, e).catch(() => {});
    return e;
  }

  async onBegin(config, suite) {
    if (!this.enabled) { console.warn('[tms] disabled: set TMS_BASE_URL and TMS_PROJECT_ID'); return; }
    const title = process.env.TMS_RUN_NAME || `Playwright run ${new Date().toISOString()}`;
    const run = this.testPlanId
      ? await this.post(`/test-plans/${this.testPlanId}/runs`, { title, source: 'Automated' })
      : await this.post(`/projects/${this.projectId}/test-runs`, { title, source: 'Automated' });
    this.runId = run && run.id;
    if (this.runId) await this.post(`/test-runs/${this.runId}/start`, {});
    this.event('RunStarted', { total: suite.allTests().length });
  }

  onTestBegin(test) { this.event('TestStarted', { externalTestId: this.externalId(test), name: test.title }); }
  onStepBegin(test, result, step) { if (this.sendSteps && step.category === 'test.step') this.event('StepStarted', { externalTestId: this.externalId(test), title: step.title }); }
  onStepEnd(test, result, step) { if (this.sendSteps && step.category === 'test.step') this.event('StepFinished', { externalTestId: this.externalId(test), title: step.title, status: step.error ? 'Failed' : 'Passed', durationMs: step.duration }); }
  onTestEnd(test, result) {
    const map = { passed: 'Passed', failed: 'Failed', timedOut: 'Failed', skipped: 'Skipped', interrupted: 'Blocked' };
    this.event('TestFinished', { externalTestId: this.externalId(test), name: test.title, status: map[result.status] || 'Failed', durationMs: result.duration, failureMessage: result.error ? String(result.error.message || result.error).slice(0, 2000) : undefined });
  }

  async onEnd(result) {
    if (!this.enabled || !this.runId) return;
    this.event('RunFinished', { status: result.status });
    if (this.bulkFallback) {
      // resend everything as a safety net (TMS de-dups by eventId)
      await this.post(`/test-runs/${this.runId}/events/bulk`, { events: this.buffer }).catch(() => {});
    }
    await this.post(`/test-runs/${this.runId}/finish`, {}).catch(() => {});
  }
}

module.exports = TmsReporter;
