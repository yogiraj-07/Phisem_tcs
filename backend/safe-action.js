// Link destinations are never visited or authenticated. Keep the recommendation
// independent of the model's willingness to endorse an unverified pasted link.
// This policy changes advice only; it never changes a score or evidence.
function independentLinkAction(assessment) {
  const categories = new Set(assessment.evidence.map(item => item.category));
  if (categories.has('credential_request')) return 'Keep login codes and passwords private. Review the request in an app you already use or through an independently found official contact.';
  if (categories.has('remote_access')) return 'Keep control of your device. Check the support or refund request through an independently found official contact before granting access.';
  if (categories.has('payment_pressure') || categories.has('coercion')) return 'Pause the requested action and check the demand through an independently found official contact before sending money or information.';
  if (assessment.context_status === 'NEEDS_CONTEXT' && assessment.follow_up) return 'First answer whether you expected this message, then check the request through a contact or app you already know.';
  if (assessment.context_status === 'NEEDS_CONTEXT') return 'Check the request with a contact you already know before sharing information or paying.';
  return 'Find the information through a saved bookmark, an app you already use, or an independently located official contact.';
}

function applySafeAction(assessment, urlAnalysis) {
  const hasLink = urlAnalysis.links.length > 0;
  return {
    ...assessment,
    safe_action: hasLink ? independentLinkAction(assessment) : assessment.safe_action,
    safe_action_source: hasLink ? 'APPLICATION_POLICY' : 'MODEL',
  };
}

module.exports = { independentLinkAction, applySafeAction };
