const { writeFile } = require('node:fs/promises');
const { createApp } = require('./server');
const { parseAssessment } = require('./assessment');
const { cases } = require('./evaluation-cases');

function assessCase(sample, data) {
  const reasons = [];
  try {
    const normalized = parseAssessment(JSON.stringify({
      risk_score: data?.risk_score, evidence: data?.evidence,
      needs_context: data?.context_status === 'NEEDS_CONTEXT',
      explanation: data?.explanation, safe_action: data?.safe_action,
    }), sample.message, sample.expectation);
    if (!data || normalized.risk !== data.risk || data.sender_status !== 'UNVERIFIED' ||
        !['NEEDS_CONTEXT', 'ASSESSED'].includes(data.context_status) ||
        data.url_analysis?.scope !== 'LOCAL_STRUCTURE_ONLY' ||
        data.url_analysis?.reputation !== 'NOT_CHECKED' || data.url_analysis?.page_safety !== 'NOT_CHECKED') {
      throw new Error('INVALID_RESPONSE');
    }
  } catch {
    return { passed: false, valid: false, reasons: ['Invalid or inconsistent assessment response'], explanation_sections: false };
  }
  if (!sample.risks.includes(data.risk)) reasons.push(`Expected ${sample.risks.join(' or ')}, received ${data.risk}`);
  if ((data.context_status === 'NEEDS_CONTEXT') !== sample.context) reasons.push('Incorrect need for follow-up context');
  if (sample.category && !data.evidence.some(item => item.category === sample.category)) reasons.push(`Missing ${sample.category} evidence`);
  const shouldAsk = sample.context && sample.expectation === undefined;
  if (shouldAsk ? data.follow_up?.id !== 'expectation' : data.follow_up !== null) reasons.push('Incorrect follow-up question behavior');
  // Format is reported separately; more paragraphs are not evidence of accuracy.
  const explanationSections = ['Message purpose:', 'Risk basis:', 'Missing context:'].every(label => data.explanation.includes(label));
  return { passed: reasons.length === 0, valid: true, reasons, explanation_sections: explanationSections };
}

function summarize(rows, total) {
  const valid = rows.filter(row => row.valid);
  const benign = valid.filter(row => row.group === 'benign');
  const phishing = valid.filter(row => row.group === 'phishing');
  return {
    total, evaluated: rows.length, not_run: total - rows.length,
    passed: rows.filter(row => row.passed).length,
    failed_behavior: valid.filter(row => !row.passed).length,
    errors: rows.filter(row => !row.valid).length,
    false_alarms: { count: benign.filter(row => row.actual.risk !== 'SAFE').length, valid_benign_cases: benign.length },
    missed_high_risk: { count: phishing.filter(row => row.actual.risk !== 'HIGH RISK').length, valid_phishing_cases: phishing.length },
    explanation_sections: { count: valid.filter(row => row.explanation_sections).length, valid_results: valid.length },
  };
}

async function runEvaluation(submit, samples = cases, log = console.log) {
  const rows = [];
  for (const sample of samples) {
    log(`[${rows.length + 1}/${samples.length}] ${sample.id}...`);
    const start = Date.now();
    let row;
    try {
      const response = await submit({ message: sample.message, ...(sample.expectation ? { expectation: sample.expectation } : {}) });
      if (response.status !== 200) {
        row = { valid: false, passed: false, reasons: [`HTTP ${response.status}: ${response.data?.error || 'No assessment'}`], status: response.status };
      } else {
        row = { ...assessCase(sample, response.data), actual: response.data };
      }
    } catch {
      row = { valid: false, passed: false, reasons: ['Request failed or timed out; no assessment'] };
    }
    row = { id: sample.id, group: sample.group, input: sample.message, expectation: sample.expectation ?? null,
      expected: { risks: sample.risks, needs_context: sample.context }, ...row, duration_ms: Date.now() - start };
    rows.push(row);
    log(`${row.passed ? 'PASS' : row.valid ? 'FAIL' : 'ERROR'} ${sample.id}${row.actual ? `: ${row.actual.risk}, ${row.actual.risk_score}/100` : ''}${row.reasons.length ? ' — ' + row.reasons.join('; ') : ''}`);
    // Do not keep submitting if the provider is unavailable. Unrun cases remain visible.
    if (row.status === 503) { log('Ollama unavailable; stopping. Remaining cases are marked not run.'); break; }
  }
  return { created_at: new Date().toISOString(),
    scope: 'Small hand-labeled mock regression set; not a production accuracy estimate. Explanation quality still needs human review.',
    summary: summarize(rows, samples.length), results: rows };
}

async function main() {
  // Start this checkout's backend so an outdated running server cannot skew the evaluation.
  const server = createApp().listen(0, '127.0.0.1');
  await new Promise((resolve, reject) => { server.once('listening', resolve); server.once('error', reject); });
  try {
    const endpoint = `http://127.0.0.1:${server.address().port}/analyze`;
    console.log(`Testing ${cases.length} mock messages using this checkout and your local Ollama. This can take several minutes.`);
    const report = await runEvaluation(async body => {
      const response = await fetch(endpoint, { method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body), signal: AbortSignal.timeout(65000) });
      return { status: response.status, data: await response.json() };
    });
    await writeFile('evaluation-report.json', JSON.stringify(report, null, 2) + '\n');
    console.log(JSON.stringify(report.summary, null, 2));
    console.log('Saved evaluation-report.json. Review explanations and failures; this small mock set does not establish production accuracy.');
    process.exitCode = report.summary.passed === report.summary.total ? 0 : 1;
  } finally { await new Promise(resolve => server.close(resolve)); }
}

if (require.main === module) main().catch(error => { console.error(`Evaluation failed: ${error.code || 'unexpected error'}`); process.exitCode = 1; });
module.exports = { assessCase, summarize, runEvaluation };
