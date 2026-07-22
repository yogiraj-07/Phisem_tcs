const express = require("express");
const axios = require("axios");
const cors = require("cors");

const app = express();
app.use(cors());
app.use(express.json());

app.post("/analyze", async (req, res) => {
  const { text } = req.body;
  if (!text || text.trim() === "") {
  return res.status(400).json({
    error: "Message cannot be empty"
  });
}
if (text.length > 1000) {
  return res.status(400).json({
    error: "Message is too long"
  });
}

const lower = text.toLowerCase();

const blockedPatterns = [
  "ignore previous instructions",
  "forget your instructions",
  "system prompt",
  "<script>",
  "drop table",
  "delete database"
];

for (const pattern of blockedPatterns) {
  if (lower.includes(pattern)) {
    return res.json({
      blocked: true,
      reason: `Blocked because it contains "${pattern}"`
    });
  }
}
// ⚡ Lightweight Risk Scoring

let riskScore = 0;
let redFlags = [];

const riskKeywords = {
  "pay": 25,
  "payment": 25,
  "processing fee": 30,
  "registration fee": 30,

  "urgent": 20,
  "immediately": 20,
  "deadline": 15,

  "click here": 25,
  "http": 20,
  "verify": 20,

  "scholarship": 10,
  "internship": 10,
  "placement": 10,

  "guaranteed": 25,
  "reward": 20,
  "winner": 20,

  "password": 30,
  "otp": 30,
  "https": 20,
  "bit.ly": 25,
  "tinyurl": 25,
};

for (const keyword in riskKeywords) {
  if (lower.includes(keyword)) {
    riskScore += riskKeywords[keyword];
    redFlags.push(keyword);
  }
}

if (riskScore >= 60) {
  return res.json({
    risk: "HIGH RISK",
    confidence: `${Math.min(riskScore, 100)}%`,
    redFlags,
    explanation:
      "Multiple phishing indicators were detected.",

    safeAction:
      "Do not click links or make payments. Verify through official sources.",

    llmUsed: false
  });
}
  try {
    const response = await axios.post("http://localhost:11434/api/generate", {
      model: "llama3.2:3b",
      prompt:  `
You are a phishing detection assistant.

Analyze the following message for phishing attempts.

Check for:

- urgency
- payment requests
- suspicious links
- fake authority
- unrealistic rewards


Return ONLY JSON in this format:

{
  "risk": "",
  "confidence": "",
  "redFlags": [],
  "explanation": "",
  "safeAction": ""
}

Message:

${text}
`,
      stream: false
    });

    try {
      const parsed = JSON.parse(response.data.response);

      return res.json({
        ...parsed,
        llmUsed: true
      });

    } catch {
      return res.json({
        risk: "UNKNOWN",
        confidence: "N/A",
        explanation: "The AI returned an invalid format.",
        safeAction: "Please review the message manually.",
        llmUsed: true,
        rawResponse: response.data.response
      });
    }
  } catch (err) {
    return res.status(500).json({
      error: err.message
    });
  }
});
app.get("/", (req, res) => {
  res.json({
    status: "Backend is running 🚀"
  });
});
app.listen(5000, () => console.log("Server running on port 5000"));