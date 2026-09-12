const express = require('express');
const axios = require('axios');
const cors = require('cors');
const { modelSchema, systemPrompt, parseAssessment, validationHints } = require('./assessment');

function createApp(generate = (payload, options) => axios.post('http://127.0.0.1:11434/api/generate', payload, options), reportValidation = code => console.warn('[analysis validation]', code)) {
  const app = express();
  app.use(cors());
  app.use(express.json({ limit: '16kb' }));

  app.post('/analyze', async (req, res) => {
    // Retain support for existing Thunder Client requests using { text }.
    const message = req.body?.message ?? req.body?.text;
    if (typeof message !== 'string' || !message.trim()) {
      return res.status(400).json({ error: 'Enter a non-empty message.' });
    }
    if (message.length > 1000) {
      return res.status(400).json({ error: 'Message must be 1,000 characters or fewer.' });
    }
    const expectation = req.body?.expectation;
    if (expectation !== undefined && !['yes', 'no', 'unsure'].includes(expectation)) {
      return res.status(400).json({ error: 'Expectation must be yes, no, or unsure.' });
    }
    const deadline = Date.now() + 60000;
    let validationCode;
    for (let attempt = 0; attempt < 2; attempt++) {
      let response;
      try {
        const timeout = deadline - Date.now();
        if (timeout <= 0) throw Object.assign(new Error('timeout'), { code: 'ETIMEDOUT' });
        response = await generate({
          model: 'llama3.2:3b', stream: false, format: modelSchema,
          system: systemPrompt + (validationCode ? '\nA prior attempt failed validation. Reassess the original message. Correction: ' + validationHints[validationCode] : ''),
          prompt: JSON.stringify({ message, expectation: expectation ?? 'not_provided' }),
          options: { temperature: 0 },
        }, { timeout });
      } catch (err) {
        if (err.code === 'ECONNABORTED' || err.code === 'ETIMEDOUT') {
          return res.status(504).json({ error: 'AI analysis timed out. The model may still be loading. Try again after it finishes loading.' });
        }
        if (err.response?.status === 404) {
          return res.status(503).json({ error: 'The AI model is unavailable. Run ollama pull llama3.2:3b on the backend computer, then retry.' });
        }
        if (err.code === 'ECONNREFUSED') {
          return res.status(503).json({ error: 'Cannot connect to Ollama. Open the Ollama app or run ollama serve on the backend computer, then retry.' });
        }
        return res.status(503).json({ error: 'Ollama could not complete analysis. Run ollama run llama3.2:3b on the backend computer to check that the model works.' });
      }
      try {
        return res.json(parseAssessment(response?.data?.response, message, expectation));
      } catch (err) {
        validationCode = Object.hasOwn(validationHints, err.code) ? err.code : 'INVALID_FIELDS';
        // Log only a fixed diagnostic code, never the message or model output.
        reportValidation(validationCode);
      }
    }
    return res.status(502).json({ error: 'AI could not produce a consistent assessment after an automatic retry. No risk assessment was produced.' });
  });
  app.get('/', (req, res) => res.json({ status: 'Backend is running' }));
  app.use((err, req, res, next) => {
    if (err.type === 'entity.too.large') return res.status(413).json({ error: 'Request is too large.' });
    if (err.type === 'entity.parse.failed') return res.status(400).json({ error: 'Request must contain valid JSON.' });
    return res.status(500).json({ error: 'Analysis failed. Please retry.' });
  });
  return app;
}
if (require.main === module) createApp().listen(5000, () => console.log('Server running on port 5000'));
module.exports = { createApp };
