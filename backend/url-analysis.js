const { URL } = require('node:url');
const { isIP } = require('node:net');

// Text parsing only. No DNS, HTTP, reputation API, redirects or browser calls.
const MAX_LINKS = 5;
function trimPunctuation(candidate) {
  let value = candidate.replace(/[.,;!?]+$/g, '');
  for (const [open, close] of [['(', ')'], ['[', ']'], ['{', '}']]) {
    while (value.endsWith(close) && value.split(close).length > value.split(open).length) {
      value = value.slice(0, -1);
    }
  }
  return value.replace(/[.,;!?]+$/g, '');
}
function inspectUrls(message) {
  const candidates = typeof message === 'string'
    ? message.match(/\b(?:https?:\/\/|www\.)[^\s<>"'\x60]+/giu) || [] : [];
  const seen = new Set();
  const links = [];
  let omitted = 0;
  for (const candidate of candidates) {
    const raw = trimPunctuation(candidate);
    let parsed;
    try {
      parsed = new URL(/^www\./i.test(raw) ? 'https://' + raw : raw);
      if (!['http:', 'https:'].includes(parsed.protocol) || !parsed.hostname) parsed = undefined;
    } catch { parsed = undefined; }
    const key = parsed ? parsed.href : raw;
    if (seen.has(key)) continue;
    seen.add(key);
    if (links.length >= MAX_LINKS) { omitted++; continue; }
    const observations = [];
    const add = (code, detail) => observations.push({ code, detail });
    if (!parsed) {
      add('INVALID_URL', 'This link could not be parsed as an HTTP or HTTPS URL.');
      links.push({ status: 'INVALID_URL', hostname: null, protocol: null, port: null, observations });
      continue;
    }
    const hostname = parsed.hostname;
    if (/^www\./i.test(raw)) add('ASSUMED_SCHEME', 'No scheme was supplied; HTTPS was assumed for parsing only.');
    if (parsed.username || parsed.password) {
      add('USERINFO', 'Text before @ is user information, not the destination. The actual hostname is shown above.');
    }
    if (isIP(hostname.replace(/^\[|\]$/g, ''))) {
      add('IP_HOST', 'This link uses an IP address rather than a domain name. That alone does not prove phishing.');
    }
    if (hostname.split('.').some(label => label.startsWith('xn--'))) {
      add('IDN_HOST', 'This is an internationalized domain, shown in ASCII form. Such domains can be legitimate; compare the exact name independently.');
    }
    if (parsed.protocol === 'http:') {
      add('HTTP', 'The supplied URL uses HTTP. No connection was made, so redirects and transport security were not tested.');
    }
    if (parsed.port) add('CUSTOM_PORT', 'The URL specifies a non-default port. This can be legitimate.');
    if (raw.includes('\\')) add('BACKSLASH', 'Backslashes were normalized by the URL parser; inspect the resulting hostname carefully.');
    // Only the destination is returned: no URL credentials, path, query or fragment.
    links.push({ status: 'PARSED', hostname, protocol: parsed.protocol, port: parsed.port || null, observations });
  }
  return { scope: 'LOCAL_STRUCTURE_ONLY', reputation: 'NOT_CHECKED', page_safety: 'NOT_CHECKED', links, omitted };
}
module.exports = { inspectUrls, trimPunctuation };
