// Phase 15B Milestone M2 — the Error Redaction Helper approved in the Error Handling Review.
// Pure, no "server-only", no I/O — every future real Email/SMS/WhatsApp provider (Milestone M8+)
// must run its caught exception's message through this BEFORE it reaches any log line, and the
// secure server logger (Milestone M3) will call this itself so no caller can forget to.
//
// Redaction rule: replace only the SENSITIVE VALUE, never the surrounding text — a redacted
// string must still tell an engineer WHICH credential was present (a key name, a header label, a
// scheme) without ever revealing its actual value. "Authorization: Bearer eyJ..." becomes
// "Authorization: Bearer ********", not "[REDACTED]" or an empty string — losing the surrounding
// context would defeat the entire point of keeping this as a debugging aid.
//
// Ordering matters: more specific patterns run first so a generic pattern never gets a chance to
// mis-capture something a specific rule already knows how to handle correctly (see the
// Authorization-header vs. generic key=value ordering note below). Every replacement produces
// literal `********` characters, which never match any later pattern in this file — running the
// rules in sequence is safe, never double-mangles an already-redacted value.
const MASK = "********";

// "Authorization: <scheme> <value>" — covers Bearer, Basic, Digest, or any other scheme in one
// rule, keeping the scheme word visible (useful for debugging which auth mechanism was used)
// while masking only the credential value itself.
const AUTHORIZATION_HEADER_RE = /\b(Authorization:\s*)(\S+)(\s+)(\S+)/gi;

// Fallback for a bare "Bearer <token>" that appears without an "Authorization:" label (e.g.
// logged as `token: Bearer xyz` or embedded in a URL). Safe to run after the rule above — by then
// any already-masked "Bearer ********" simply re-matches to the same masked output (idempotent).
const BEARER_TOKEN_RE = /\bBearer\s+(\S+)/gi;

// SMTP/connection-string style credentials embedded in a URL: scheme://user:PASSWORD@host — keeps
// the scheme, username, and host visible (useful for identifying WHICH mailbox/account failed)
// while masking only the password segment.
const URL_EMBEDDED_CREDENTIAL_RE = /(:\/\/[^:/\s@]+:)([^@\s]+)(@)/g;

// Generic `key = value` / `key: value` redaction — covers API keys, secret keys, access/refresh/
// session/auth tokens, SMTP passwords, generic passwords, and provider account identifiers
// (Phone Number ID, Business Account ID, Account SID) that the Security Review flagged as
// server-only even though they aren't secrets in the traditional sense. Deliberately excludes
// "authorization" — that's fully handled by the two rules above. The `(?!Bearer\b|Basic\b)`
// lookahead exists because a bare key name like "token"/"secret" can legitimately precede a
// "Bearer <token>"/"Basic <value>" pair (e.g. "token: Bearer xyz") — without it, this rule would
// greedily treat the literal word "Bearer" itself as the value (since its own value-capture stops
// at the first whitespace), corrupting whatever the Bearer-specific rule above already masked
// correctly.
const KEY_VALUE_RE =
  /\b(api[_-]?key|secret[_-]?key|client[_-]?secret|access[_-]?token|auth[_-]?token|refresh[_-]?token|session[_-]?token|smtp[_-]?password|phone[_-]?number[_-]?id|business[_-]?account[_-]?id|account[_-]?sid|password|pwd|secret|token)(\s*[:=]\s*)(['"]?)(?!Bearer\b|Basic\b)([^\s'",;)}\]]+)\3/gi;

// JWTs conventionally start with "eyJ" (base64 for `{"`) and always have exactly three dot-
// separated base64url segments — a reliable, distinct shape from a generic long string. Fallback
// for a JWT that appears standalone, not already caught by the Bearer/key=value rules above.
const JWT_RE = /\beyJ[A-Za-z0-9\-_]+\.[A-Za-z0-9\-_]+\.[A-Za-z0-9\-_]*\b/g;

// A long, contiguous hexadecimal run (32+ chars, no separators) — long enough to be implausible
// as ordinary text, and deliberately NOT matching a dash-delimited UUID: a UUID's own word-
// boundary segments (8-4-4-4-12) are each well under 32 characters, so `tenantId`/`notificationId`
// (both UUIDs, both safe, non-secret internal identifiers per the Security Review) are never
// touched by this rule.
const LONG_HEX_RE = /\b[a-fA-F0-9]{32,}\b/g;

// A long, contiguous base64-alphabet run (28+ chars) with no separators — catches a raw API
// key/secret that wasn't preceded by a recognizable key name. The 28-character floor is
// deliberately conservative: it's long enough that ordinary words/sentences (which are broken up
// by spaces and punctuation the base64 alphabet excludes) essentially never reach it, while still
// catching realistic tokens, which are almost always well past this length.
const LONG_BASE64_RE = /\b[A-Za-z0-9+/]{28,}={0,2}\b/g;

function maskKeyValue(_match: string, key: string, separator: string): string {
  return `${key}${separator}${MASK}`;
}

function maskAuthorizationHeader(_match: string, label: string, scheme: string, space: string): string {
  return `${label}${scheme}${space}${MASK}`;
}

function maskUrlCredential(_match: string, prefix: string, _password: string, suffix: string): string {
  return `${prefix}${MASK}${suffix}`;
}

// Replaces every sensitive value this helper recognizes with a fixed mask, preserving everything
// else in the input untouched — key names, header labels, schemes, surrounding prose. Never
// removes the entire message; never returns an empty string just because a secret was found.
export function redactSecrets(input: string): string {
  if (!input) return input;

  let result = input;
  result = result.replace(AUTHORIZATION_HEADER_RE, maskAuthorizationHeader);
  result = result.replace(BEARER_TOKEN_RE, `Bearer ${MASK}`);
  result = result.replace(URL_EMBEDDED_CREDENTIAL_RE, maskUrlCredential);
  result = result.replace(KEY_VALUE_RE, maskKeyValue);
  result = result.replace(JWT_RE, MASK);
  result = result.replace(LONG_HEX_RE, MASK);
  result = result.replace(LONG_BASE64_RE, MASK);
  return result;
}
