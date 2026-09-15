export interface UrlAnalysis {
  scope: 'LOCAL_STRUCTURE_ONLY';
  reputation: 'NOT_CHECKED';
  page_safety: 'NOT_CHECKED';
  omitted: number;
  links: Array<{
    status: 'PARSED' | 'INVALID_URL';
    hostname: string | null;
    protocol: 'http:' | 'https:' | null;
    port: string | null;
    observations: Array<{ code: string; detail: string }>;
  }>;
}

export interface AnalysisRequest {
  message: string;
  expectation?: 'yes' | 'no' | 'unsure';
}

export interface AnalysisResponse {
  risk: "SAFE" | "SUSPICIOUS" | "HIGH RISK";
  risk_score: number;
  url_analysis: UrlAnalysis;
  confidence: null;
  evidence: Array<{ category: string; quote: string; reason: string }>;
  context_status: 'NEEDS_CONTEXT' | 'ASSESSED';
  follow_up: { id: 'expectation'; question: string } | null;
  expectation: 'yes' | 'no' | 'unsure' | null;
  red_flags: string[];
  explanation: string;
  safe_action: string;
  safe_action_source: 'APPLICATION_POLICY' | 'MODEL';
  analysis_source: string;
  llmUsed: boolean;
  sender_status: 'UNVERIFIED';
}
