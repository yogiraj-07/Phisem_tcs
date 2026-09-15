const { parseAssessment, validationHints } = require('./assessment');
const { cases } = require('./evaluation-cases');

const inputKey = (message, expectation) => JSON.stringify([message, expectation ?? null]);

// Only the standalone mock evaluator installs this wrapper. The normal server
// does not save model responses. Even here, only allowlisted fixture inputs are recorded.
function createEvaluationRecorder(generate, samples = cases) {
  const records = new Map(samples.map(sample => [inputKey(sample.message, sample.expectation), []]));
  return {
    async generate(payload, options) {
      let input;
      try { input = JSON.parse(payload.prompt); } catch { return generate(payload, options); }
      const expectation = input?.expectation === 'not_provided' ? undefined : input?.expectation;
      const attempts = records.get(inputKey(input?.message, expectation));
      if (!attempts) return generate(payload, options);
      const entry = { attempt: attempts.length + 1 };
      attempts.push(entry);
      let response;
      try {
        response = await generate(payload, options);
      } catch (error) {
        Object.assign(entry, { outcome: 'TRANSPORT_ERROR',
          code: typeof error.code === 'string' && /^[A-Z_]+$/.test(error.code) ? error.code : 'UNKNOWN',
          status: Number.isInteger(error.response?.status) ? error.response.status : null });
        throw error;
      }
      const raw = response?.data?.response;
      try {
        const assessment = parseAssessment(raw, input.message, expectation);
        Object.assign(entry, { outcome: 'VALID', model_safe_action: assessment.safe_action });
      } catch (error) {
        Object.assign(entry, { outcome: 'INVALID',
          validation_code: Object.hasOwn(validationHints, error.code) ? error.code : 'INVALID_FIELDS',
          raw_response: typeof raw === 'string' ? raw.slice(0, 12000) : null,
          raw_response_truncated: typeof raw === 'string' && raw.length > 12000 });
      }
      return response;
    },
    getAttempts(request) {
      return (records.get(inputKey(request.message, request.expectation)) ?? []).map(entry => ({ ...entry }));
    },
  };
}

module.exports = { createEvaluationRecorder };
