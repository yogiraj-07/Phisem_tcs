import type { AnalysisResponse } from '../types';
import { ShieldCheck, AlertTriangle, ShieldAlert, AlertCircle, Lightbulb, Fingerprint, BrainCircuit, Activity } from 'lucide-react';
import { UrlFindings } from './UrlFindings';
import CountUp from './CountUp';
import AnimatedContent from './AnimatedContent';

const evidenceLabels: Record<string, string> = {
  credential_request: 'Request for a login secret',
  payment_pressure: 'Pressure to pay',
  deceptive_destination: 'Misleading destination',
  unexpected_claim: 'Unexpected claim',
  coercion: 'Threat or coercion',
  remote_access: 'Request for device access',
  other: 'Other concern',
};

export function ResultCard({ result }: { result: AnalysisResponse }) {
  const isSafe = result.risk === 'SAFE';
  const isHighRisk = result.risk === 'HIGH RISK';
  const Icon = isSafe ? ShieldCheck : isHighRisk ? ShieldAlert : AlertTriangle;
  const badgeColor = isSafe ? 'bg-green-100 text-green-800 border-green-200'
    : isHighRisk ? 'bg-red-100 text-red-800 border-red-200' : 'bg-yellow-100 text-yellow-800 border-yellow-200';
  const progressColor = isSafe ? 'bg-status-success' : isHighRisk ? 'bg-status-danger' : 'bg-status-warning';
  const paragraphs = result.explanation.split(/\n\s*\n/).filter(paragraph => paragraph.trim());

  return (
    <AnimatedContent distance={40} direction="vertical" duration={0.8} ease="power3.out" initialOpacity={0} animateOpacity className="w-full">
      <div className="bg-white rounded-2xl shadow-xl shadow-gray-200/50 border border-gray-100 overflow-hidden">
        <div className="p-6 sm:p-8 border-b border-gray-100 flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div className="flex items-center gap-4">
            <div className={`p-4 rounded-2xl border ${badgeColor}`}><Icon className="h-9 w-9" /></div>
            <div>
              <h2 className="text-sm font-bold text-text-muted uppercase tracking-wider mb-2">Text Risk Assessment</h2>
              <span className={`inline-block px-3 py-1 text-sm font-bold uppercase rounded-full border ${badgeColor}`}>
                {isSafe ? 'Low text risk' : result.risk}
              </span>
              <p className="mt-2 text-sm text-text-muted">Sender unverified</p>
            </div>
          </div>
          <div className="w-full md:w-64 shrink-0 bg-surface-bg p-4 rounded-xl border border-gray-100">
            <div className="flex justify-between items-end gap-3 mb-2">
              <span className="text-xs font-bold text-text-muted uppercase flex items-center gap-1.5"><Activity className="h-3.5 w-3.5" /> Model estimate</span>
              <span className="text-xl font-black text-text-main"><CountUp from={0} to={result.risk_score} duration={1.5} />/100</span>
            </div>
            <div className="w-full bg-gray-200 rounded-full h-2.5 overflow-hidden" aria-hidden="true">
              <div className={`h-full ${progressColor}`} style={{ width: `${result.risk_score}%` }} />
            </div>
            <p className="mt-2 text-xs text-text-muted">Not a probability of fraud.</p>
          </div>
        </div>

        <div className="p-6 sm:p-8 space-y-6 bg-surface-bg/30">
          {result.context_status === 'NEEDS_CONTEXT' && <p className="rounded-lg border border-amber-200 bg-amber-50 p-3 font-semibold text-amber-900">More context needed. This assessment is provisional.</p>}
          {result.expectation && <p className="text-sm text-text-muted">Your context: {result.expectation === 'yes' ? 'You expected or initiated this message.' : result.expectation === 'no' ? 'You did not expect or initiate this message.' : 'You are not sure whether this message was expected.'}</p>}

          <section aria-label="Why this result" className="rounded-xl border border-gray-200 bg-white p-5 sm:p-6">
            <h3 className="font-bold text-text-main flex items-center gap-2 mb-4"><BrainCircuit className="h-5 w-5 text-brand-500" /> Why this result</h3>
            <div className="space-y-4 text-sm sm:text-base leading-relaxed text-text-main whitespace-pre-wrap wrap-break-word">
              {paragraphs.map((paragraph, index) => <p key={index}>{paragraph}</p>)}
            </div>
          </section>

          <section aria-label="Evidence in your message">
            <h3 className="font-bold text-text-main flex items-center gap-2 mb-3"><AlertCircle className="h-5 w-5 text-text-muted" /> Evidence in your message</h3>
            {result.evidence.length > 0 ? (
              <div className="grid gap-3 md:grid-cols-2">
                {result.evidence.map((flag, index) => (
                  <div key={index} className="p-4 bg-white border border-amber-200 rounded-xl">
                    <p className="flex items-center gap-2 text-sm font-bold text-amber-950"><Fingerprint className="h-4 w-4 shrink-0" />{evidenceLabels[flag.category] ?? 'Concern identified'}</p>
                    <blockquote className="mt-3 border-l-2 border-amber-300 pl-3 text-sm text-text-main whitespace-pre-wrap wrap-break-word">“{flag.quote}”</blockquote>
                    <p className="mt-3 text-sm text-text-muted wrap-break-word">{flag.reason}</p>
                  </div>
                ))}
              </div>
            ) : <p className="rounded-xl border border-gray-200 bg-white p-4 text-sm text-text-muted">The model did not identify a specific excerpt as a phishing warning sign. This does not authenticate the sender.</p>}
          </section>

          <section aria-label="What to do next" className="rounded-xl border border-brand-100 bg-brand-50/50 p-5">
            <h3 className="font-bold text-brand-900 flex items-center gap-2"><Lightbulb className="h-5 w-5" /> What to do next</h3>
            <p className="mt-3 text-sm sm:text-base leading-relaxed text-brand-900 whitespace-pre-wrap wrap-break-word">{result.safe_action}</p>
            {result.safe_action_source === 'APPLICATION_POLICY' && <p className="mt-3 text-xs text-text-muted">This step uses an independent contact or app because the pasted link has not been verified.</p>}
          </section>

          <UrlFindings analysis={result.url_analysis} />

          <details className="rounded-xl border border-gray-200 bg-white p-5 text-sm text-text-muted">
            <summary className="cursor-pointer font-bold text-text-main">How to interpret this assessment</summary>
            <div className="mt-4 space-y-3">
              <p>Source: {result.analysis_source}. The model assesses message wording; evidence excerpts are checked against the submitted text. Matching a quote does not establish that the model interpreted it correctly.</p>
              <p>Score bands: 0–29 low text risk, 30–59 suspicious, 60–100 high risk. Small differences within a band are not measured differences in the chance of fraud.</p>
              <p>Sender identity, domain ownership and real-world claims are unverified. A copied genuine message can have the same wording and score as the original. A low score does not confirm authenticity.</p>
            </div>
          </details>
        </div>
      </div>
    </AnimatedContent>
  );
}
