const { writeFile } = require('node:fs/promises');
const { createHash } = require('node:crypto');
const { createApp, requestOllama } = require('./server');
const { parseAssessment, systemPrompt, assessmentPayload } = require('./assessment');
const { cases } = require('./evaluation-cases');
const { createEvaluationRecorder } = require('./evaluation-diagnostics');
const { inspectUrls } = require('./url-analysis');
const { independentLinkAction } = require('./safe-action');

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
  const actionPolicyOk = inspectUrls(sample.message).links.length === 0 ||
    (data.safe_action_source === 'APPLICATION_POLICY' && data.safe_action === independentLinkAction(data));
  if (!actionPolicyOk) reasons.push('Unverified link did not receive the independent verification step');
  // Format is reported separately; more paragraphs are not evidence of accuracy.
  const explanationSections = ['Message purpose:', 'Risk basis:', 'Missing context:'].every(label => data.explanation.includes(label));
  return { passed: reasons.length === 0, valid: true, reasons, explanation_sections: explanationSections, action_policy_ok: actionPolicyOk };
}

function summarize(rows, samples) {
  const valid = rows.filter(row => row.valid);
  const benign = valid.filter(row => row.group === 'benign');
  const phishing = valid.filter(row => row.group === 'phishing');
  const allPhishing = rows.filter(row => row.group === 'phishing');
  const plannedPhishing = samples.filter(sample => sample.group === 'phishing').length;
  return {
    total: samples.length, evaluated: rows.length, not_run: samples.length - rows.length,
    passed: rows.filter(row => row.passed).length,
    failed_behavior: valid.filter(row => !row.passed).length,
    errors: rows.filter(row => !row.valid).length,
    false_alarms: { count: benign.filter(row => row.actual.risk !== 'SAFE').length, valid_benign_cases: benign.length },
    missed_high_risk: { count: phishing.filter(row => row.actual.risk !== 'HIGH RISK').length, valid_phishing_cases: phishing.length },
    phishing_coverage: {
      total_cases: plannedPhishing,
      high_risk_results: phishing.filter(row => row.actual.risk === 'HIGH RISK').length,
      lower_risk_results: phishing.filter(row => row.actual.risk !== 'HIGH RISK').length,
      no_valid_assessment: allPhishing.filter(row => !row.valid).length,
      not_run: plannedPhishing - allPhishing.length,
    },
    action_policy_failures: valid.filter(row => row.action_policy_ok === false).length,
    human_review_required: valid.length,
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
      if (response.diagnostics) row.diagnostics = response.diagnostics;
    } catch {
      row = { valid: false, passed: false, reasons: ['Request failed or timed out; no assessment'] };
    }
    row = { id: sample.id, group: sample.group, input: sample.message, expectation: sample.expectation ?? null,
      expected: { risks: sample.risks, needs_context: sample.context }, ...row, duration_ms: Date.now() - start };
    rows.push(row);
    log(`${row.passed ? 'CHECKS PASS' : row.valid ? 'CHECKS FAIL' : 'ERROR'} ${sample.id}${row.actual ? `: ${row.actual.risk}, ${row.actual.risk_score}/100` : ''}${row.reasons.length ? ' — ' + row.reasons.join('; ') : ''}`);
    // Do not keep submitting if the provider is unavailable. Unrun cases remain visible.
    if (row.status === 503) { log('Ollama unavailable; stopping. Remaining cases are marked not run.'); break; }
  }
  return { created_at: new Date().toISOString(), evaluation_version: 2,
    model: assessmentPayload('').model,
    prompt_sha256: createHash('sha256').update(systemPrompt).digest('hex'),
    scope: 'Known hand-labeled mock regression cases used during development. Automated checks do not establish correct reasoning or production accuracy; review every explanation and action.',
    summary: summarize(rows, samples), results: rows };
}

async function main() {
  // Start this checkout's backend so an outdated running server cannot skew the evaluation.
  const recorder = createEvaluationRecorder(requestOllama);
  const server = createApp(recorder.generate).listen(0, '127.0.0.1');
  await new Promise((resolve, reject) => { server.once('listening', resolve); server.once('error', reject); });
  try {
    const endpoint = `http://127.0.0.1:${server.address().port}/analyze`;
    console.log(`Testing ${cases.length} mock messages using this checkout and your local Ollama. This can take several minutes.`);
    const report = await runEvaluation(async body => {
      const response = await fetch(endpoint, { method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body), signal: AbortSignal.timeout(65000) });
      return { status: response.status, data: await response.json(), diagnostics: recorder.getAttempts(body) };
    });
    await writeFile('evaluation-report.json', JSON.stringify(report, null, 2) + '\n');
    console.log(JSON.stringify(report.summary, null, 2));
    console.log('Saved evaluation-report.json. Failed mock attempts include validation codes and model output. CHECKS PASS does not verify reasoning: review explanations and model_safe_action as well as the final action.');
    process.exitCode = report.summary.passed === report.summary.total ? 0 : 1;
  } finally { await new Promise(resolve => server.close(resolve)); }
}

if (require.main === module) main().catch(error => { console.error(`Evaluation failed: ${error.code || 'unexpected error'}`); process.exitCode = 1; });
module.exports = { assessCase, summarize, runEvaluation };
