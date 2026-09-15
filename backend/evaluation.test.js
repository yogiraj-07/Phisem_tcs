const { test } = require('node:test');
const assert = require('node:assert/strict');
const { assessCase, runEvaluation } = require('./evaluate-ollama');
const { parseAssessment, examples } = require('./assessment');
const { inspectUrls } = require('./url-analysis');
const { cases } = require('./evaluation-cases');

function response(sample, risk_score = 10, evidence = []) {
  return { ...parseAssessment(JSON.stringify({ risk_score, evidence, needs_context: sample.context,
    explanation: 'Message purpose: Mock.\n\nRisk basis: Mock.\n\nMissing context: Mock.', safe_action: 'Use a known contact.' }), sample.message, sample.expectation),
    url_analysis: inspectUrls(sample.message) };
}

test('evaluation distinguishes false alarms, missed high risk and transport errors', async () => {
  const samples = [cases[0], cases[8], cases[9]];
  let index = 0;
  const report = await runEvaluation(async () => {
    const sample = samples[index++];
    if (index === 3) return { status: 504, data: { error: 'timeout' } };
    return { status: 200, data: index === 1 ? response(sample, 45, [{ category: 'other', quote: 'Thursday', reason: 'An intentionally wrong model interpretation.' }]) : response(sample) };
  }, samples, () => {});
  assert.equal(report.summary.passed, 0);
  assert.equal(report.summary.failed_behavior, 2);
  assert.equal(report.summary.errors, 1);
  assert.deepEqual(report.summary.false_alarms, { count: 1, valid_benign_cases: 1 });
  assert.deepEqual(report.summary.missed_high_risk, { count: 1, valid_phishing_cases: 1 });
});

test('unavailable provider stops evaluation without counting unrun cases as passes', async () => {
  const report = await runEvaluation(async () => ({ status: 503, data: { error: 'unavailable' } }), cases, () => {});
  assert.equal(report.summary.evaluated, 1);
  assert.equal(report.summary.errors, 1);
  assert.equal(report.summary.not_run, cases.length - 1);
  assert.equal(report.summary.passed, 0);
});

test('evaluation rejects contradictory scores, invented quotes and verification claims', () => {
  const sample = cases[0];
  for (const change of [
    { risk: 'HIGH RISK' }, { sender_status: 'VERIFIED' },
    { evidence: [{ category: 'credential_request', quote: 'give your OTP', reason: 'Not in the original text' }] },
    { url_analysis: { ...inspectUrls(sample.message), page_safety: 'SAFE' } },
  ]) assert.equal(assessCase(sample, { ...response(sample), ...change }).valid, false);
});

test('context cases require the correct follow-up and do not treat long explanations as accuracy', () => {
  const sample = cases.find(item => item.id === 'selection-unknown');
  const valid = response(sample);
  assert.equal(assessCase(sample, valid).passed, true);
  assert.equal(assessCase(sample, { ...valid, follow_up: null }).passed, false);
  assert.equal(assessCase(sample, { ...valid, context_status: 'ASSESSED' }).passed, false);
  const short = assessCase(sample, { ...valid, explanation: 'Brief but acceptable structured response.' });
  assert.equal(short.passed, true);
  assert.equal(short.explanation_sections, false);
});

test('evaluation cases are valid mock inputs and are separate from prompt examples', () => {
  assert.equal(new Set(cases.map(sample => sample.id)).size, cases.length);
  for (const sample of cases) {
    assert.ok(sample.message.length > 0 && sample.message.length <= 1000);
    assert.ok(!examples.some(example => example.input.message === sample.message));
  }
});
