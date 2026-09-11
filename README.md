# Phisem — Message Phishing Detector

A prototype for assessing mock messages across banking, work, shopping, deliveries, education and personal conversations. Arbitrary questions, greetings and code are treated as text to assess, not commands to answer or execute. React/TypeScript frontend, Express backend, keyword rules and local Ollama (`llama3.2:3b`).

## Run locally

Use Node.js 22 or newer and install Ollama separately.

1. Run `ollama pull llama3.2:3b`, then ensure Ollama is running (`ollama serve` if needed).
2. In one terminal: `cd backend`, `npm ci`, `npm start`.
3. In another terminal: `cd frontend`, `npm ci`, `npm run dev`.
4. Open http://localhost:3000. Vite forwards `/analyze` to the backend on port 5000.

Production hosting must also route `/analyze` to Express; the development proxy is not included in the built static files.

## API

`POST /analyze` with JSON `{ "message": "Class is at 10 AM." }`. Legacy `{ "text": "..." }` requests are also accepted. Input must be a non-empty string of at most 1,000 characters.

Successful responses contain `risk`, `risk_score` (0–100), `confidence` (null; no calibrated confidence is available), `red_flags`, `explanation`, `safe_action`, `analysis_source`, `llmUsed`, and `sender_status` (always UNVERIFIED). The UI displays SAFE as Low text risk; copied text cannot authenticate a sender.

Scores: 0–29 SAFE, 30–59 SUSPICIOUS, 60–100 HIGH RISK. Rules count each category once and pass candidate indicators to Ollama. Every valid message receives contextual Ollama analysis, including messages with many keyword matches. Keyword scores never bypass that review. Rules remain approximate and can flag legitimate messages. Scores are not probabilities; SAFE does not verify authenticity. Links are not fetched and AI authorship is not established.

Validation errors return 400, oversized request bodies 413, unavailable Ollama 503, model timeout 504, and invalid model output 502. The UI displays errors without fabricating analysis.

## Mock demo messages

- Routine: `Your study group meets in Room 4 tomorrow at 10 AM.`
- Credential safety: `Never share your OTP or password with anyone.` (Requires contextual analysis; merely mentioning credentials is not proof of phishing.)
- Suspicious: `An unfamiliar placement coordinator asks you to verify your account at https://placement.example.`
- Suspicious payment example: `Pay ₹500 to confirm your scholarship eligibility. Click this link immediately.`

Use only mock examples, never real OTPs, passwords, bank details or student data. Model outputs may vary; these examples are not an accuracy benchmark.

## Verification

- Backend: `cd backend` then `node --test analysis.test.js`.
- Frontend: `cd frontend` then `npm run lint` and `npm run build`.

Backend tests use a stubbed model to verify API behavior, validation, scoring and failure paths. A real local Ollama run is needed to evaluate model quality.

## Checking the contextual review

Compare these mock messages in the UI. All results must say Sender unverified. These are evaluation cases, not guaranteed model outputs:

- Routine notice: `Your monthly statement is ready. Open your banking app to review it. Never share your OTP or password.`
- Keyword-heavy safety advice: `Beware of urgent payment requests. Never share your OTP or password. Do not click here or verify through an unsolicited link.`
- Credential request: `Urgent: your account will be closed. Reply with your OTP and password immediately to verify it.`
- Exact-copy limitation: submit the routine notice twice, imagining a real sender once and an impersonator once. The app cannot distinguish the unseen sender; low text risk is never proof of authenticity.

If AI analysis fails, run `ollama run llama3.2:3b` on the computer running Express and send it `hello`. If the model is missing, run `ollama pull llama3.2:3b`. If the service is unreachable, open Ollama or run `ollama serve`. A first request can time out while the model loads; retry after it responds locally.

This is an assessment tool, not a general Q&A assistant. Supporting varied text does not establish production readiness: real model evaluation on labeled examples, false-positive measurements, abuse/rate limits and deployment hardening remain necessary.
