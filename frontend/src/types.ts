export interface AnalysisRequest {
  message: string;
}

export interface AnalysisResponse {
  risk: "SAFE" | "SUSPICIOUS" | "HIGH RISK";
  confidence: number;
  red_flags: string[];
  explanation: string;
  safe_action: string;
  analysis_source: string;
  llmUsed: boolean;
}
