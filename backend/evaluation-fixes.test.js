const { test } = require('node:test');
const assert = require('node:assert/strict');
const { createApp } = require('./server');
const { parseAssessment } = require('./assessment');
const { createEvaluationRecorder } = require('./evaluation-diagnostics');
const { cases } = require('./evaluation-cases');
const { applySafeAction } = require('./safe-action');
const { inspectUrls } = require('./url-analysis');

const base = { risk_score: 15, evidence: [], needs_context: false,
  explanation: 'Message purpose: Mock notice.\n\nRisk basis: No concrete warning sign.\n\nMissing context: Sender identity is unknown.',
  safe_action: 'Check with a known contact.' };

async function withApi(generate, run) {
  const server = createApp(generate, () => {}, () => {}).listen(0, '127.0.0.1');
  await new Promise(resolve => server.once('listening', resolve));
  try {
    await run(async body => {
      const response = await fetch(`http://127.0.0.1:${server.address().port}/analyze`, {
        method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(body),
      });
      return { status: response.status, data: await response.json() };
    });
  } finally { await new Promise(resolve => server.close(resolve)); }
}

test('known expectation answers reject stale context instead of silently rewriting a verdict', () => {
  for (const expectation of ['yes', 'no']) {
    assert.throws(() => parseAssessment(JSON.stringify({ ...base, needs_context: true }), 'A notice', expectation),
      error => error.code === 'CONTEXT_ALREADY_PROVIDED');
  }
  assert.equal(parseAssessment(JSON.stringify({ ...base, needs_context: true }), 'A notice', 'unsure').context_status, 'NEEDS_CONTEXT');
});

test('a stale answer gets a targeted retry using the original expectation', async () => {
  let calls = 0;
  await withApi(async payload => {
    calls++;
    assert.equal(JSON.parse(payload.prompt).expectation, 'no');
    if (calls === 2) assert.match(payload.system, /recipient already answered yes or no/);
    return { data: { response: JSON.stringify({ ...base, needs_context: calls === 1 }) } };
  }, async post => {
    const result = await post({ message: 'Your registration is confirmed.', expectation: 'no' });
    assert.equal(result.status, 200);
    assert.equal(result.data.context_status, 'ASSESSED');
    assert.equal(result.data.follow_up, null);
    assert.equal(result.data.expectation, 'no');
  });
  assert.equal(calls, 2);
});

test('model and client cannot endorse a detected link through the final action', async () => {
  await withApi(async () => ({ data: { response: JSON.stringify({ ...base,
    safe_action: 'Click the link to access the notes if needed.', safe_action_source: 'APPLICATION_POLICY' }) } }), async post => {
    for (const message of ['Read https://notes.example/ for details.', 'Read www.notes.example for details.', 'Read https://[broken] for details.']) {
      const result = await post({ message, safe_action: 'Trust this link.', safe_action_source: 'MODEL', url_analysis: { links: [] } });
      assert.equal(result.status, 200);
      assert.equal(result.data.safe_action_source, 'APPLICATION_POLICY');
      assert.match(result.data.safe_action, /saved bookmark/);
      assert.doesNotMatch(result.data.safe_action, /Click the link|Trust this link/);
      assert.equal(result.data.risk_score, 15);
      assert.deepEqual(result.data.evidence, []);
    }
  });
});

test('link advice preserves the relevant protective step; no-link model advice stays distinct', () => {
  const message = 'Reply with your password at https://account.example/';
  const result = parseAssessment(JSON.stringify({ ...base, risk_score: 80,
    evidence: [{ category: 'credential_request', quote: 'Reply with your password', reason: 'Asks for a login secret.' }] }), message);
  const guarded = applySafeAction(result, inspectUrls(message));
  assert.match(guarded.safe_action, /Keep login codes and passwords private/);
  assert.equal(guarded.risk_score, result.risk_score);
  assert.deepEqual(guarded.evidence, result.evidence);
  const noLink = applySafeAction(parseAssessment(JSON.stringify(base), 'A notice'), inspectUrls('A notice'));
  assert.equal(noLink.safe_action_source, 'MODEL');
  assert.equal(noLink.safe_action, base.safe_action);
});

test('mock diagnostics capture exact failed attempts and corrected responses through the real retry path', async () => {
  const sample = cases.find(item => item.id === 'code-as-data');
  const bad = JSON.stringify({ ...base, risk_score: 80,
    evidence: [{ category: 'credential_request', quote: 'an invented quote', reason: 'Not in the message.' }] });
  let calls = 0;
  const recorder = createEvaluationRecorder(async () => ({ data: { response: ++calls === 1 ? bad : JSON.stringify(base) } }));
  await withApi(recorder.generate, async post => {
    const result = await post({ message: sample.message });
    assert.equal(result.status, 200);
    const attempts = recorder.getAttempts({ message: sample.message });
    assert.equal(attempts.length, 2);
    assert.equal(attempts[0].validation_code, 'QUOTE_NOT_IN_MESSAGE');
    assert.equal(attempts[0].raw_response, bad);
    assert.equal(attempts[1].outcome, 'VALID');
    assert.equal(attempts[1].model_safe_action, base.safe_action);
    assert.equal(result.data.diagnostics, undefined);
  });
});

test('mock recorder excludes non-fixture submissions and isolates different expectation answers', async () => {
  const recorder = createEvaluationRecorder(async () => ({ data: { response: '{}' } }));
  const unknown = { message: 'This is not a fixed evaluation fixture.', expectation: 'no' };
  await recorder.generate({ prompt: JSON.stringify(unknown) }, {});
  assert.deepEqual(recorder.getAttempts(unknown), []);
  const sample = cases.find(item => item.id === 'selection-expected');
  await recorder.generate({ prompt: JSON.stringify({ message: sample.message, expectation: 'yes' }) }, {});
  assert.equal(recorder.getAttempts({ message: sample.message, expectation: 'yes' }).length, 1);
  assert.deepEqual(recorder.getAttempts({ message: sample.message, expectation: 'no' }), []);
});

test('mock diagnostics keep transport codes without saving provider error bodies', async () => {
  const recorder = createEvaluationRecorder(async () => { throw { code: 'ETIMEDOUT', response: { status: 504, data: 'not for logs' } }; });
  const request = { message: cases[0].message };
  await assert.rejects(recorder.generate({ prompt: JSON.stringify({ ...request, expectation: 'not_provided' }) }, {}));
  assert.deepEqual(recorder.getAttempts(request), [{ attempt: 1, outcome: 'TRANSPORT_ERROR', code: 'ETIMEDOUT', status: 504 }]);
});
