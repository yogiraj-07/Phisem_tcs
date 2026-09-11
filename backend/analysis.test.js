const { test } = require('node:test');
const assert = require('node:assert/strict');
const { createApp } = require('./server');
const { scoreMessage, parseModelResult } = require('./analysis');

const mockResult = { risk_score: 10, red_flags: [], explanation: 'No clear phishing indicators; sender is unverified.', safe_action: 'Check your official college portal.' };
async function withApi(generate, run) {
  const server = createApp(generate).listen(0, '127.0.0.1');
  await new Promise(resolve => server.once('listening', resolve));
  const post = async body => {
    const response = await fetch(`http://127.0.0.1:${server.address().port}/analyze`, {
      method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(body),
    });
    return { status: response.status, data: await response.json() };
  };
  try { await run(post); } finally { await new Promise(resolve => server.close(resolve)); }
}

test('overlapping words and HTTPS count once; substrings do not match', () => {
  assert.equal(scoreMessage('payment').risk_score, 25);
  assert.equal(scoreMessage('https://college.example').risk_score, 10);
  assert.equal(scoreMessage('repayment and payoff').risk_score, 0);
});
test('input validation rejects missing, non-string, blank and oversized messages', async () => {
  await withApi(() => { throw Error('must not call model'); }, async post => {
    for (const body of [null, {}, { message: 123 }, { message: {} }, { message: ' ' }, { message: 'x'.repeat(1001) }]) {
      assert.equal((await post(body)).status, 400);
    }
  });
});
test('frontend request and legacy text request return the same schema', async () => {
  await withApi(async payload => {
    assert.equal(payload.format, 'json');
    return { data: { response: JSON.stringify(mockResult) } };
  }, async post => {
    for (const body of [{ message: 'Class is at 10 AM.' }, { text: 'Class is at 10 AM.' }]) {
      const { status, data } = await post(body);
      assert.equal(status, 200);
      assert.equal(data.risk, 'SAFE');
      assert.equal(data.risk_score, 10);
      assert.equal(data.confidence, null);
      assert.equal(data.llmUsed, true);
      assert.deepEqual(data.red_flags, []);
      assert.equal(data.safe_action, mockResult.safe_action);
    }
  });
});
test('combined high-risk indicators use rules with honest provenance', async () => {
  await withApi(() => { throw Error('model should not run'); }, async post => {
    const { status, data } = await post({ message: 'Pay ₹500 to confirm your scholarship eligibility. Click this link immediately.' });
    assert.equal(status, 200);
    assert.equal(data.risk, 'HIGH RISK');
    assert.equal(data.risk_score, 65);
    assert.equal(data.llmUsed, false);
    assert.equal(data.analysis_source, 'Keyword rules');
  });
});
test('model outage and invalid output return errors rather than invented verdicts', async () => {
  await withApi(async () => { throw Error('offline'); }, async post => {
    const result = await post({ message: 'Class is at 10 AM.' });
    assert.equal(result.status, 503);
    assert.equal(result.data.risk, undefined);
  });
  await withApi(async () => ({ data: { response: '{}' } }), async post => {
    assert.equal((await post({ message: 'Hello' })).status, 502);
  });
});
test('model output validates bounds and ignores model-supplied provenance', () => {
  for (const risk_score of [-1, 101, '90', null]) {
    assert.throws(() => parseModelResult(JSON.stringify({ ...mockResult, risk_score })));
  }
  assert.throws(() => parseModelResult('not json'));
  assert.equal(parseModelResult(JSON.stringify({ ...mockResult, risk_score: 60, risk: 'SAFE', llmUsed: false })).risk, 'HIGH RISK');
});
