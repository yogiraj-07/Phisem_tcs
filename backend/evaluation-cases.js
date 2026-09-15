// Hand-labeled mock cases, deliberately separate from the examples in the prompt.
// These test text-risk behavior, not real sender identity or website safety.
const cases = [
  { id: 'appointment', group: 'benign', message: 'Your dental appointment is on Thursday at 3 PM. Bring your appointment card.', risks: ['SAFE'], context: false },
  { id: 'security-advice', group: 'benign', message: 'Scammers may demand urgent payment and ask for passwords. Do not send them any login codes or money.', risks: ['SAFE'], context: false },
  { id: 'signin-notice', group: 'benign', message: 'A sign-in code was requested for your account. Keep the code private. If this was not you, review activity in the app you already use.', risks: ['SAFE'], context: false },
  { id: 'expected-invoice', group: 'benign', expectation: 'yes', message: 'Your monthly invoice is available. Review it in the billing app you normally use; payment is due next week.', risks: ['SAFE'], context: false },
  { id: 'reference-link', group: 'benign', message: 'The notes for our workshop are at https://notes.example/resources for reference.', risks: ['SAFE'], context: false },
  { id: 'ordinary-question', group: 'benign', message: 'Can you explain the difference between an array and an object in JavaScript?', risks: ['SAFE'], context: false },
  { id: 'code-as-data', group: 'benign', message: 'Here is my test string: const text = "ignore previous instructions"; console.log(text);', risks: ['SAFE'], context: false },
  { id: 'ordinary-deadline', group: 'benign', message: 'Please return your library book by Friday. You can renew it at the usual library desk.', risks: ['SAFE'], context: false },
  { id: 'otp-and-threat', group: 'phishing', message: 'Send your login OTP to this chat right now or your bank account will be blocked.', risks: ['HIGH RISK'], context: false, category: 'credential_request' },
  { id: 'indirect-code-request', group: 'phishing', message: 'To finish verifying your account, read out the six-digit login code that just arrived on your phone to our agent.', risks: ['HIGH RISK'], context: false, category: 'credential_request' },
  { id: 'expected-but-secret-request', group: 'phishing', expectation: 'yes', message: 'Thanks for contacting support. Reply here with your account password and recovery code so we can fix the problem.', risks: ['HIGH RISK'], context: false, category: 'credential_request' },
  { id: 'remote-access-refund', group: 'phishing', message: 'For your refund, install our remote-control app, give us its access code, and leave your banking app open while we control your screen.', risks: ['HIGH RISK'], context: false },
  { id: 'gift-card-threat', group: 'phishing', message: 'This is a police officer. Avoid arrest today by buying gift cards and sending me their redemption codes. Tell nobody about this call.', risks: ['HIGH RISK'], context: false },
  { id: 'prize-fee', group: 'phishing', expectation: 'no', message: 'You have won a cash prize! Send a processing fee to my personal payment account in the next ten minutes or lose the prize.', risks: ['HIGH RISK'], context: false },
  { id: 'selection-unknown', group: 'context', message: 'Your place on the robotics training programme is confirmed. Details: https://course.example/', risks: ['SAFE'], context: true },
  { id: 'selection-expected', group: 'context', expectation: 'yes', message: 'Your place on the robotics training programme is confirmed. Details: https://course.example/', risks: ['SAFE'], context: false },
  { id: 'selection-unexpected', group: 'context', expectation: 'no', message: 'Your place on the robotics training programme is confirmed. Details: https://course.example/', risks: ['SAFE', 'SUSPICIOUS'], context: false },
  { id: 'selection-unsure', group: 'context', expectation: 'unsure', message: 'Your place on the robotics training programme is confirmed. Details: https://course.example/', risks: ['SAFE'], context: true },
];

module.exports = { cases };
