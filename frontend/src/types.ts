export interface AnalysisRequest {
  message: string;
}

export interface AnalysisResponse {
  risk: "SAFE" | "SUSPICIOUS" | "HIGH RISK";
  risk_score: number;
  confidence: null;
  red_flags: string[];
  explanation: string;
  safe_action: string;
  analysis_source: string;
  llmUsed: boolean;
}

