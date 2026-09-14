const { test } = require('node:test');
const assert = require('node:assert/strict');
const { inspectUrls } = require('./url-analysis');
const { createApp } = require('./server');

test('extracts the actual destination, not the text before @', () => {
  const report = inspectUrls('Visit https://bank.example:secret@offers.example/login?token=private');
  assert.equal(report.links[0].hostname, 'offers.example');
  assert.ok(report.links[0].observations.some(item => item.code === 'USERINFO'));
  assert.ok(!JSON.stringify(report).includes('secret'));
  assert.ok(!JSON.stringify(report).includes('token=private'));
  assert.equal(report.reputation, 'NOT_CHECKED');
  assert.equal(report.page_safety, 'NOT_CHECKED');
});
test('retains a complete misleading subdomain rather than guessing ownership', () => {
  const link = inspectUrls('https://bank.example.attacker.example/').links[0];
  assert.equal(link.hostname, 'bank.example.attacker.example');
  assert.equal(link.status, 'PARSED');
});
test('detects IP hosts, internationalized domains and transport observations', () => {
  for (const url of ['http://127.0.0.1:8080/', 'http://[::1]/', 'http://2130706433/']) {
    const link = inspectUrls(url).links[0];
    assert.ok(link.observations.some(item => item.code === 'IP_HOST'));
    assert.ok(link.observations.some(item => item.code === 'HTTP'));
  }
  assert.ok(inspectUrls('https://bücher.example/').links[0].hostname.startsWith('xn--'));
  assert.ok(inspectUrls('https://bücher.example/').links[0].observations.some(item => item.code === 'IDN_HOST'));
});
test('handles punctuation, www and malformed links without throwing', () => {
  assert.equal(inspectUrls('(https://example.org/).').links[0].hostname, 'example.org');
  assert.equal(inspectUrls('https://example.org/a(b)').links[0].status, 'PARSED');
  assert.equal(inspectUrls('www.example.org').links[0].hostname, 'www.example.org');
  assert.equal(inspectUrls('https://[broken').links[0].status, 'INVALID_URL');
  assert.equal(inspectUrls('No links here').links.length, 0);
  assert.equal(inspectUrls('example.org javascript:alert(1)').links.length, 0);
});
test('deduplicates URLs and discloses inspection limits', () => {
  const message = Array.from({ length: 7 }, (_, i) => 'https://host' + i + '.example/').join(' ');
  const report = inspectUrls(message + ' https://host0.example/');
  assert.equal(report.links.length, 5);
  assert.equal(report.omitted, 2);
});
test('ordinary HTTPS produces observations without asserting safety or adding a score', () => {
  const report = inspectUrls('https://example.org/');
  assert.deepEqual(report.links[0].observations, []);
  assert.equal(report.risk_score, undefined);
  assert.equal(report.page_safety, 'NOT_CHECKED');
});
test('API passes local observations to the model but returns server-owned results', async () => {
  const message = 'See https://bank.example@offers.example/';
  const app = createApp(async payload => {
    assert.equal(JSON.parse(payload.prompt).local_url_observations.links[0].hostname, 'offers.example');
    return { data: { response: JSON.stringify({
      risk_score: 15, evidence: [], needs_context: false,
      explanation: 'There is a link to review.', safe_action: 'Verify independently.',
      url_analysis: { reputation: 'SAFE', page_safety: 'VERIFIED' },
    }) } };
  });
  const server = app.listen(0, '127.0.0.1');
  await new Promise(resolve => server.once('listening', resolve));
  try {
    const response = await fetch('http://127.0.0.1:' + server.address().port + '/analyze', {
      method: 'POST', headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ message, url_analysis: { reputation: 'SAFE' } }),
    });
    assert.equal(response.status, 200);
    const data = await response.json();
    assert.equal(data.url_analysis.links[0].hostname, 'offers.example');
    assert.equal(data.url_analysis.reputation, 'NOT_CHECKED');
    assert.equal(data.url_analysis.page_safety, 'NOT_CHECKED');
    assert.equal(data.risk_score, 15);
  } finally {
    await new Promise(resolve => server.close(resolve));
  }
});
