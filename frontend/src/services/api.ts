import type { AnalysisRequest, AnalysisResponse } from '../types';

export const analyzeMessage = async (request: AnalysisRequest): Promise<AnalysisResponse> => {
  let response: Response;
  try {
    response = await fetch('/analyze', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(request),
      signal: AbortSignal.timeout(65000),
    });
  } catch {
    throw new Error('Cannot reach the analysis service or the request timed out. Check the backend and retry.');
  }
  const data = await response.json().catch(() => null);
  if (!response.ok) throw new Error(data?.error || 'Analysis failed. Please retry.');
  if (!data || !['SAFE', 'SUSPICIOUS', 'HIGH RISK'].includes(data.risk) ||
      !Number.isInteger(data.risk_score) || data.risk_score < 0 || data.risk_score > 100 ||
      !Array.isArray(data.red_flags) || !data.red_flags.every((flag: unknown) => typeof flag === 'string') ||
      typeof data.explanation !== 'string' || typeof data.safe_action !== 'string' ||
      typeof data.analysis_source !== 'string' || typeof data.llmUsed !== 'boolean' ||
      data.confidence !== null) {
    throw new Error('The service returned an invalid analysis. Please retry.');
  }
  return data;
};
