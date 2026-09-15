// Uses only a fixed mock message; never reads user submissions or environment secrets.
const axios = require('axios');
const { assessmentPayload, parseAssessment } = require('./assessment');

async function diagnose(generate = (payload, options) => axios.post('http://127.0.0.1:11434/api/generate', payload, options), log = console.log) {
  const message = 'Your study group meets tomorrow at 10 AM.';
  for (const stage of ['basic', 'full assessment']) {
    const payload = stage === 'basic' ? {
      model: 'llama3.2:3b', stream: false,
      prompt: 'Return JSON with risk_score equal to 10.',
      format: { type: 'object', properties: { risk_score: { type: 'integer' } }, required: ['risk_score'] },
    } : assessmentPayload(message);
    log(`Testing ${stage} through Node/Axios...`);
    let response;
    try {
      response = await generate(payload, { timeout: 60000 });
      log(`${stage}: HTTP ${response.status ?? 200}`);
    } catch (err) {
      // Avoid dumping Axios config (contains payload/headers) or entire error objects.
      log(`${stage}: FAILED code=${err.code ?? 'unknown'} HTTP=${err.response?.status ?? 'none'}`);
      const detail = err.response?.data?.error;
      if (typeof detail === 'string') log(`Ollama error for mock request: ${detail.slice(0, 1500).replace(/[\r\n]+/g, ' ')}`);
      return false;
    }
    if (stage === 'full assessment') {
      try {
        const assessment = parseAssessment(response?.data?.response, message);
        log(`Validation passed: ${assessment.risk}, ${assessment.risk_score}/100`);
      } catch (err) {
        log(`Validation failed: ${err.code ?? 'INVALID_FIELDS'}`);
        // This command only submits the fixed mock message above.
        const raw = response?.data?.response;
        if (typeof raw === 'string') log(`Model response for mock request: ${raw.slice(0, 5000)}`);
        return false;
      }
    }
  }
  log('Both requests passed. Restart Express and retry the website; any remaining failure is specific to the running server or submitted message.');
  return true;
}
if (require.main === module) diagnose().then(ok => { process.exitCode = ok ? 0 : 1; });
module.exports = { diagnose };
