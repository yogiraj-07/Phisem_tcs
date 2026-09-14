import type { UrlAnalysis } from '../types';

export function UrlFindings({ analysis }: { analysis: UrlAnalysis }) {
  return (
    <section aria-label="Local URL checks" className="rounded-xl border border-gray-200 bg-white p-5">
      <h3 className="font-bold text-text-main">Local URL checks</h3>
      <p className="mt-2 text-sm text-text-muted">
        Reputation: not checked. Page safety: not checked. No websites were opened.
      </p>
      {analysis.links.length === 0 ? (
        <p className="mt-3 text-sm">No HTTP, HTTPS or www links detected. Bare domains and hidden link targets are not inspected.</p>
      ) : (
        <div className="mt-4 space-y-4">
          {analysis.links.map((link, index) => (
            <div key={index} className="rounded-lg border border-gray-200 p-4">
              <p className="text-sm font-semibold">Link {index + 1} — {link.status === 'PARSED' ? 'Actual hostname' : 'Unable to parse'}</p>
              {link.hostname && <p className="mt-1 break-all font-mono"><bdi dir="ltr">{link.hostname}</bdi></p>}
              {link.protocol && <p className="mt-1 text-xs text-text-muted">Scheme: {link.protocol.slice(0, -1).toUpperCase()}{link.port ? ' · Port: ' + link.port : ''}</p>}
              {link.observations.length > 0 ? (
                <ul className="mt-2 list-disc space-y-1 pl-5 text-sm">
                  {link.observations.map((item, i) => <li key={i}>{item.detail}</li>)}
                </ul>
              ) : <p className="mt-2 text-sm">No structural observations from these checks. This does not establish safety.</p>}
            </div>
          ))}
        </div>
      )}
      {analysis.omitted > 0 && <p className="mt-3 text-sm">Only the first 5 unique links were inspected; {analysis.omitted} additional links were omitted.</p>}
      <p className="mt-3 text-xs text-text-muted">These observations do not verify domain ownership or automatically add points to the text risk score.</p>
    </section>
  );
}
