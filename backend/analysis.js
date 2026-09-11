// Heuristic scores are indicators, not calibrated probabilities.
const rules = [
  [/\b(?:pay|payment|processing fee|registration fee)\b/i, 25, 'Payment or fee requested'],
  [/\b(?:urgent|immediately|deadline)\b/i, 20, 'Urgency or time pressure'],
  [/\b(?:click here|click this link|verify)\b/i, 20, 'Link click or verification requested'],
  [/\b(?:guaranteed|reward|winner)\b/i, 25, 'Reward or guarantee language'],
  [/\b(?:password|otp)\b/i, 30, 'Sensitive credential mentioned'],
  [/\bhttps?:\/\/[^\s]+/i, 10, 'Link present; destination has not been verified'],
  [/\b(?:bit\.ly|tinyurl\.com)\//i, 20, 'Shortened link hides the destination'],
];

function classify(score) {
  return score >= 60 ? 'HIGH RISK' : score >= 30 ? 'SUSPICIOUS' : 'SAFE';
}

function scoreMessage(message) {
  const matched = rules.filter(([pattern]) => pattern.test(message));
  return {
    risk_score: Math.min(100, matched.reduce((sum, [, weight]) => sum + weight, 0)),
    red_flags: matched.map(([, , description]) => description),
  };
}

function parseModelResult(raw) {
  const data = JSON.parse(raw);
  if (!data || !Number.isInteger(data.risk_score) || data.risk_score < 0 || data.risk_score > 100 ||
      !Array.isArray(data.red_flags) || data.red_flags.length > 20 ||
      !data.red_flags.every(flag => typeof flag === 'string' && flag.trim() && flag.length <= 300) ||
      !['explanation', 'safe_action'].every(key => typeof data[key] === 'string' && data[key].trim() && data[key].length <= 2000)) {
    throw new Error('Invalid model response');
  }
  return {
    risk: classify(data.risk_score), risk_score: data.risk_score,
    confidence: null, red_flags: data.red_flags,
    explanation: data.explanation, safe_action: data.safe_action,
    analysis_source: 'Ollama (llama3.2:3b)', llmUsed: true,
  };
}

module.exports = { classify, scoreMessage, parseModelResult };
