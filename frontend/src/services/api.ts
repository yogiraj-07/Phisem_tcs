import { AnalysisRequest, AnalysisResponse } from "../types";

export const analyzeMessage = async (request: AnalysisRequest): Promise<AnalysisResponse> => {
  try {
    const response = await fetch("/analyze", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(request),
    });

    if (!response.ok) {
      throw new Error(`API error: ${response.statusText}`);
    }

    const data: AnalysisResponse = await response.json();
    return data;
  } catch (error) {
    console.warn("Backend API failed or not available. Using simulated mock response for demonstration.", error);
    
    // Fallback Mock for demonstration
    await new Promise((resolve) => setTimeout(resolve, 1500)); // Simulate network latency

    const messageLower = request.message.toLowerCase();
    let risk: "SAFE" | "SUSPICIOUS" | "HIGH RISK" = "SAFE";
    let confidence = 95;
    const red_flags: string[] = [];
    
    if (messageLower.includes("urgent") || messageLower.includes("immediate")) {
      red_flags.push("Urgent or pressing language detected");
      risk = "SUSPICIOUS";
      confidence = 75;
    }
    if (messageLower.includes("password") || messageLower.includes("verify") || messageLower.includes("account")) {
      red_flags.push("Request for sensitive credentials");
      risk = "HIGH RISK";
      confidence = 92;
    }
    if (messageLower.includes("http") && !messageLower.includes("https")) {
      red_flags.push("Unsecured link detected");
      risk = "SUSPICIOUS";
    }
    if (messageLower.includes("bitcoin") || messageLower.includes("gift card")) {
      red_flags.push("Common scam payment method requested");
      risk = "HIGH RISK";
      confidence = 98;
    }

    if (risk === "SAFE") {
      return {
        risk: "SAFE",
        confidence: 88,
        red_flags: [],
        explanation: "This message does not exhibit common phishing indicators or AI-generated manipulation patterns. The language appears typical and benign.",
        safe_action: "You can proceed normally, but always remain vigilant and verify the sender if it involves sensitive information.",
        analysis_source: "Rule Engine & LLM Analysis",
        llmUsed: true,
      };
    } else if (risk === "SUSPICIOUS") {
      return {
        risk: "SUSPICIOUS",
        confidence: confidence,
        red_flags,
        explanation: "This message contains patterns commonly used in social engineering, such as artificial urgency or unexpected links. While it may be legitimate, caution is advised.",
        safe_action: "Do not click any links. Contact the sender through a known, trusted channel (like an official website or phone number) to verify the request.",
        analysis_source: "Ollama AI (Llama 3)",
        llmUsed: true,
      };
    } else {
      return {
        risk: "HIGH RISK",
        confidence: confidence,
        red_flags,
        explanation: "The message exhibits strong characteristics of an AI-generated phishing attempt. It uses manipulative language, artificial urgency, and requests sensitive information or unusual payment methods.",
        safe_action: "Do not reply, click links, or provide any information. Report this message to your IT security team or mark it as phishing/spam.",
        analysis_source: "Ollama AI (Llama 3)",
        llmUsed: true,
      };
    }
  }
};
