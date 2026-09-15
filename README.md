# Phisem — Message Phishing Detector

A prototype for assessing mock messages across banking, work, shopping, deliveries, education and personal conversations. Arbitrary questions, greetings and code are treated as text to assess, not commands to answer or execute. React/TypeScript frontend, Express backend, evidence-based contextual review and local Ollama (`llama3.2:3b`).

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

Scores: 0–29 SAFE, 30–59 SUSPICIOUS, 60–100 HIGH RISK. Every valid message receives contextual Ollama analysis. The model must supply exact message excerpts for concrete risk evidence. Unknown sender identity, a link or an unfamiliar domain alone must not raise risk under the assessment instructions. This semantic rule still needs evaluation with real model outputs. Model judgments remain approximate and can flag legitimate messages. Scores are not probabilities; SAFE does not verify authenticity. Links are not fetched and AI authorship is not established.

Validation errors return 400, oversized request bodies 413, unavailable Ollama 503, model timeout 504, and invalid model output 502. The UI displays errors without fabricating analysis.

## Mock demo messages

- Routine: `Your study group meets in Room 4 tomorrow at 10 AM.`
- Credential safety: `Never share your OTP or password with anyone.` (Requires contextual analysis; merely mentioning credentials is not proof of phishing.)
- Suspicious: `An unfamiliar placement coordinator asks you to verify your account at https://placement.example.`
- Suspicious payment example: `Pay ₹500 to confirm your scholarship eligibility. Click this link immediately.`

Use only mock examples, never real OTPs, passwords, bank details or student data. Model outputs may vary; these examples are not an accuracy benchmark.

## Verification

- Backend: `cd backend` then `node --test analysis.test.js url-analysis.test.js evaluation.test.js evaluation-fixes.test.js`.
- Frontend: `cd frontend` then `npm run lint` and `npm run build`.

Backend tests use a stubbed model to verify API behavior, validation, scoring and failure paths. A real local Ollama run is needed to evaluate model quality.

## Detailed explanations and real-model evaluation

The prompt now asks for three short explanation paragraphs: **Message purpose**, **Risk basis** and **Missing context**. This fits the existing five-field JSON response format; it does not introduce a new schema or require a model download. Paragraph structure is a prompt instruction, not a new validation gate, so a shorter otherwise-valid response still works. The report leads with the explanation, exact evidence excerpts and a relevant next action. Link observations and score interpretation remain separate. No excerpt being flagged means the model found no specific warning sign, not that the sender was verified.

To test actual Ollama judgments, keep Ollama running, open `backend`, and run:

```powershell
node evaluate-ollama.js
```

This starts the backend from the current checkout on a temporary local port and evaluates 18 hand-labeled mock cases through the same API, validation and retry path as the website. You do not need to start Express separately. Cases cover routine notices, credential-protection advice, expected payments, questions/code, indirect credential requests, remote access, payment threats and four expectation contexts. They are not included as completed examples in the model prompt. It can take several minutes; progress is printed after each case.

The summary counts false alarms on benign cases, high-risk phishing cases rated below HIGH RISK, context/evidence failures, invalid/failed requests and cases not run. It also reports explanation-section coverage separately; longer answers do not count as more accurate. Full mock inputs, actual assessments and failure reasons are saved in `backend/evaluation-report.json` (ignored by Git). Exit code 1 means a case failed or the run was incomplete; check the report to distinguish model behavior from unavailable Ollama.

These are developer-labeled regression examples, not an independent production benchmark. Inspect the explanations and exact quotes yourself, especially for incorrect claims about absent requests, sender identity or websites. Neither accuracy improvement nor probability calibration is established by prompt changes or unit tests. Real-model results are required before claiming an improvement.

### Findings from the first real-model report

The submitted 18-case run passed 12 automated checks, returned 3 behavior failures and produced 3 invalid assessments. One sign-in notification was misread as a credential request; two selection cases mishandled expectation or uncertainty. The code, OTP-threat and gift-card-threat cases returned 502 without the exact failed model output. Four of six phishing cases produced a HIGH RISK result; two had no assessment. The zero count of missed high-risk cases applied only to the four valid phishing responses.

Human review also found errors in cases labeled passed: recommendations to open unverified links, unsupported urgency/threat claims, and irrelevant advice. Automated labels and explanation headings do not validate reasoning. The prompt now defines evidence categories more precisely, contrasts account notifications with disclosure requests, and tells the model to use supplied expectation answers. A yes/no answer combined with `needs_context: true` is rejected with `CONTEXT_ALREADY_PROVIDED` and receives the existing single correction retry. Other unknowns may still be described in the explanation; this flag specifically refers to the expectation question. These prompt changes remain subject to real-model retesting.

For any detected link, the backend supplies an independent verification action instead of using the model's link recommendation. `safe_action_source` identifies `APPLICATION_POLICY` or `MODEL`; the UI explains the independent step. This safeguard leaves scores and evidence unchanged and does not validate the model's explanation. It only covers links the local extractor detects.

Evaluation report version 2 includes `phishing_coverage`, which counts every planned phishing case including failures and cases not run. It separately counts action-policy failures and marks every valid result for human review. The fixture messages and expected risk bands are unchanged; the new safety/context checks make its overall pass count stricter than version 1. These are now known regression cases used to develop the prompt, not unseen evaluation data.

Each mock request now includes `diagnostics` with its model attempts. Invalid attempts save a validation code and bounded raw mock response; valid attempts retain `model_safe_action` so an unsafe model recommendation is still visible even if the application replaces it. Transport diagnostics contain only code/status. This capture is installed only by the standalone evaluator and limited to fixed fixture inputs; normal website responses and server logs do not expose these diagnostics. `model` and `prompt_sha256` identify the evaluated setup. Run `node evaluate-ollama.js` again and inspect the full report, including cases marked `CHECKS PASS`.

## Checking the contextual review

Compare these mock messages in the UI. All results must say Sender unverified. These are evaluation cases, not guaranteed model outputs:

- Routine notice: `Your monthly statement is ready. Open your banking app to review it. Never share your OTP or password.`
- Keyword-heavy safety advice: `Beware of urgent payment requests. Never share your OTP or password. Do not click here or verify through an unsolicited link.`
- Credential request: `Urgent: your account will be closed. Reply with your OTP and password immediately to verify it.`
- Exact-copy limitation: submit the routine notice twice, imagining a real sender once and an impersonator once. The app cannot distinguish the unseen sender; low text risk is never proof of authenticity.

If AI analysis fails, run `ollama run llama3.2:3b` on the computer running Express and send it `hello`. If the model is missing, run `ollama pull llama3.2:3b`. If the service is unreachable, open Ollama or run `ollama serve`. A first request can time out while the model loads; retry after it responds locally.

This is an assessment tool, not a general Q&A assistant. Supporting varied text does not establish production readiness: real model evaluation on labeled examples, false-positive measurements, abuse/rate limits and deployment hardening remain necessary.

## Evidence and follow-up context

Results include `evidence` (category, exact quote, reason), `context_status`, `follow_up` and `expectation`. The server checks quotes against the submitted message and rejects elevated scores without evidence. This checks grounding, not whether the model interpreted the excerpt correctly.

If expectation matters, the UI asks whether you applied, initiated or expected the message. Select Yes / No / Not sure to resubmit the same message with `expectation: "yes" | "no" | "unsure"`. This is user-reported context, never sender authentication. Not sure can retain More context needed; the question is not repeated. Editing the message clears its assessment and answer.

Mock regression example: `You are selected for the Pilot Training Course. Visit https://training.example.` Expect a contextual question when the model identifies that expectation matters, no invented OTP/payment claim, and no link-only risk flag. Try all three answers separately. Model-generated question selection and risk remain subject to real-model evaluation.

## Invalid model assessments

The backend retries an invalid model assessment once with a fixed correction for the validation failure. Both attempts share a 60-second budget; transport errors are not retried. Only an enclosing JSON code fence is normalized. Evidence, score and context checks are retained, and no verdict is guessed when both attempts fail.

The backend terminal prints `[analysis validation] CODE` without the submitted message or model response. Codes include INVALID_JSON, INVALID_FIELDS, INVALID_EVIDENCE, QUOTE_NOT_IN_MESSAGE, RISK_WITHOUT_EVIDENCE, EXPECTATION_REQUIRED and CONTEXT_ALREADY_PROVIDED. If the UI still reports a failed assessment after retry, use this code to identify the failing check.

## Ollama works in the CLI but Phisem fails

From the backend folder run `node diagnose-ollama.js`. This tests a basic schema and the full Phisem request using the same Node/Axios transport as Express, with a fixed mock study-group message. It reports HTTP/transport errors or a validation code. No user messages are read. If both tests pass, restart the backend and reproduce the website request. The backend logs `[ollama request]` with only error code and HTTP status, not submitted content.

## Grammar compilation compatibility

Assessment requests use `format: "json"` and include field instructions and completed assessment examples in the system prompt. This avoids asking the Ollama runtime to compile the full constrained schema, which caused HTTP 400 `failed to parse grammar` on the reported installation. Backend field/evidence/context validation and the single correction retry still apply. The diagnostic and Express share the same assessment request builder. Real-model success must be checked locally; JSON mode alone does not ensure correct fields or conclusions.

The prompt uses completed JSON assessments rather than a serialized schema: the reported model copied schema metadata into its answer. Examples contrast a routine meeting notice, OTP safety advice, a credential request and an ambiguous selection offer. These in-prompt examples are not an independent accuracy benchmark. If the mock diagnostic fails validation, it now prints the fixed mock response so further debugging does not require a separate command.

## Local URL structure checks — no API key required

Every successful assessment now includes server-owned `url_analysis`. It extracts explicit HTTP/HTTPS and www links, parses the actual hostname using Node's URL parser, and reports user-information (@), IP-host, internationalized-domain, HTTP, non-default-port and backslash observations. It does not infer domain ownership from the last two labels or assume that an unfamiliar domain is malicious.

At most five unique URLs are inspected; additional links are counted as omitted. A www link is parsed using an assumed HTTPS scheme. Common surrounding punctuation is removed. Bare domains, obfuscated URLs, hidden HTML/Markdown display-target relationships and other schemes are not fully covered by this first version. This is a text extractor, not a browser navigation validator.

No link is opened: there is no DNS lookup, reputation service, redirect inspection or page download. Reputation and page safety always remain NOT_CHECKED, including when there are no structural observations. The backend does not assign risk points from these observations; Ollama may consider the observations alongside the message. Model accuracy remains unverified. The report displays plain hostnames, never clickable targets, and excludes URL user information, paths, queries and fragments.

The Local URL checks panel appears below the sender/context notices after successful analysis. It currently requires a successful model response like the rest of the assessment.

Mock checks:
- `https://bank.example@offers.example/` should show actual hostname `offers.example` and an @ observation.
- `https://bank.example.attacker.example/` should show the complete hostname, not claim it belongs to bank.example.
- `http://127.0.0.1:8080/` should show IP, HTTP and port observations without connecting.
- `https://example.org/` should say no structural observations, with reputation and page safety still not checked.

URL regression tests are included in `backend/url-analysis.test.js`; they cover extraction and server-owned observations without visiting any links.
