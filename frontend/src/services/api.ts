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
  const urls = data?.url_analysis;
  const validUrls = urls && urls.scope === 'LOCAL_STRUCTURE_ONLY' &&
    urls.reputation === 'NOT_CHECKED' && urls.page_safety === 'NOT_CHECKED' &&
    Number.isInteger(urls.omitted) && urls.omitted >= 0 &&
    Array.isArray(urls.links) && urls.links.length <= 5 && urls.links.every((link: any) =>
      link && ['PARSED', 'INVALID_URL'].includes(link.status) &&
      (link.hostname === null || typeof link.hostname === 'string') &&
      [null, 'http:', 'https:'].includes(link.protocol) &&
      (link.port === null || typeof link.port === 'string') &&
      Array.isArray(link.observations) && link.observations.every((item: any) =>
        item && typeof item.code === 'string' && typeof item.detail === 'string'));
  if (!validUrls || !data || !['SAFE', 'SUSPICIOUS', 'HIGH RISK'].includes(data.risk) ||
      !Number.isInteger(data.risk_score) || data.risk_score < 0 || data.risk_score > 100 ||
      !Array.isArray(data.red_flags) || !data.red_flags.every((flag: unknown) => typeof flag === 'string') ||
      typeof data.explanation !== 'string' || typeof data.safe_action !== 'string' ||
      typeof data.analysis_source !== 'string' || typeof data.llmUsed !== 'boolean' ||
      !Array.isArray(data.evidence) || !data.evidence.every((e: any) => e && typeof e.category === 'string' && typeof e.quote === 'string' && request.message.includes(e.quote) && typeof e.reason === 'string') ||
      !['NEEDS_CONTEXT', 'ASSESSED'].includes(data.context_status) ||
      ![null, 'yes', 'no', 'unsure'].includes(data.expectation) ||
      !(data.follow_up === null || (data.follow_up?.id === 'expectation' && typeof data.follow_up.question === 'string')) ||
      data.confidence !== null || data.sender_status !== 'UNVERIFIED') {
    throw new Error('The service returned an invalid analysis. Please retry.');
  }
  return data;
};
