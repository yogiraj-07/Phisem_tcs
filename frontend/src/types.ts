export interface AnalysisRequest {
  message: string;
  expectation?: 'yes' | 'no' | 'unsure';
}

export interface AnalysisResponse {
  risk: "SAFE" | "SUSPICIOUS" | "HIGH RISK";
  risk_score: number;
  confidence: null;
  evidence: Array<{ category: string; quote: string; reason: string }>;
  context_status: 'NEEDS_CONTEXT' | 'ASSESSED';
  follow_up: { id: 'expectation'; question: string } | null;
  expectation: 'yes' | 'no' | 'unsure' | null;
  red_flags: string[];
  explanation: string;
  safe_action: string;
  analysis_source: string;
  llmUsed: boolean;
  sender_status: 'UNVERIFIED';
}

