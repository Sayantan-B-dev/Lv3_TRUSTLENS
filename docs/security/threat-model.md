# Security model and threat model

TrustLens is a passive investigation product. It must be safe to point at hostile URLs and messages, and it must not overstate what it knows.

## Assets

- User-submitted URLs and message text (potentially sensitive).
- Evidence, risk assessments and reports.
- Session cookies and optional Google identity data.
- The signing key for the local report registry (local development only).
- Availability of the API/worker and integrity of persisted investigations.

## Trust boundaries

1. **Browser → Next.js/Vercel.** Untrusted input; same-origin cookies; API proxied.
2. **API → target website.** Hostile network content. This is the highest-risk boundary.
3. **API → threat-intelligence providers (URLhaus, crt.sh).** Untrusted responses, rate limits, possible outages.
4. **API → AI provider.** Untrusted content is included in prompts; the model output is untrusted.
5. **API → database.** Trusted, but report payloads must remain sanitised.
6. **API → EVM RPC.** The chain proves integrity only; a malicious RPC could lie about reads, so local/trusted RPC is the documented setup.

## Threats and mitigations

### SSRF and network abuse

| Threat | Mitigation |
| --- | --- |
| `http://127.0.0.1`, link-local metadata, RFC1918, IPv6 unique-local | `security/netguard.py` rejects all non-global addresses; literal and obfuscated forms (decimal/octal/hex) parsed |
| DNS rebinding (public answer then private answer) | Resolve once per hop, validate every answer, pin the resolved IP for the connection |
| Redirect to an internal host | Re-normalise and re-resolve every hop; max 5 redirects; same policy on each hop |
| Credentials in URL (`user:pass@host`) | URL accepted for analysis but never fetched; high-severity finding |
| Non-web protocols / unusual ports | Only HTTP(S), ports 80/443 |
| Huge/slow responses | 8 s timeout, 5 s connect, 64 KiB cap, streamed read |
| Malicious content execution | No browser, no JavaScript execution, no downloads, GET only |

Known residual risk: DNS resolution and the subsequent connection can still be raced by an attacker controlling authoritative DNS; the pinned IP and validation at each hop mitigate the common case. A production deployment could add an egress proxy with deny-by-default network policy.

### TLS and certificate trust

- Chains are verified with `certifi` public roots and hostname checking; verification is never disabled.
- The analysis exposes SANs, validity, algorithms, key sizes, chain length and trust status, plus limitations.
- Certificate Transparency via crt.sh can be rate-limited or unavailable; absence of CT rows is not proof of safety.
- Revocation (OCSP/CRL) is not asserted as complete. The UI must not claim a certificate is “revoked” without an authoritative response.

### Prompt injection and AI abuse

- Message text, page content and metadata are untrusted data. They are serialised into a JSON evidence envelope, not concatenated as instructions.
- The system prompt states that content inside evidence is data; the model has no tools and cannot fetch or change risk.
- Output is validated by a strict schema; every `why[].evidence_ids` entry must exist in the current investigation's evidence set. Unknown IDs → deterministic fallback.
- The API key stays server-side. No AI call is required for the product to work.

Residual risk: a sufficiently persuasive page could influence explanation wording, but it cannot change the deterministic classification or cite non-existent evidence. Explanations remain labelled as AI-generated.

### Privacy and data handling

- Message snippets are redacted before display/logging; emails and phones are masked in reports.
- Report payloads contain check summaries, sanitised target, indicator digests/values and risk metadata — not raw message bodies.
- Retention: anonymous 7 days, signed-in 90 days by default (`ANONYMOUS_RETENTION_DAYS`, `USER_RETENTION_DAYS`). Expiry is stored on the investigation.
- Session cookies are signed server-side, `HttpOnly`, `SameSite=Lax`; `COOKIE_SECURE=true` in production.
- Logs include request IDs, method, path, status and duration; not payloads or secrets.

### Authentication and authorization

- Anonymous demo sessions are created server-side and rate-limited.
- Google OAuth is optional; no passwords are stored. The redirect URI is validated by Google and must match configuration.
- Every investigation/report lookup enforces owner kind + owner ID; unauthorised IDs return 404 rather than leaking existence.
- CORS is restricted to configured origins; credentials are allowed only for those origins.

### Web3-specific risks

- Only `reportRef` and `digest` are written. No URLs, messages or PII.
- The registry is owner-only, rejects duplicates and zero digests, and emits events for auditability.
- The documented private key is Hardhat account #0 — public, local-only, never funded. Production should use a dedicated signer or omit chain commit.
- Verification is presented as integrity, never as truthfulness. A compromised RPC can return a false digest; use a trusted RPC.

### Availability and abuse

- Per-instance rate limits on submissions and general API traffic (`RATE_LIMIT_PER_MINUTE`, `GENERAL_RATE_LIMIT_PER_MINUTE`).
- Input length capped (`MAX_INPUT_CHARS`, URL max 4096).
- Worker retries are bounded with backoff; expired leases recover or fail.
- Free-tier hosting can sleep; this is documented, not hidden.

## Operational checklist for production

- [ ] Generate a strong `SESSION_SECRET`; set `COOKIE_SECURE=true`, `ENVIRONMENT=production`.
- [ ] Use PostgreSQL/Neon with backups and restricted credentials.
- [ ] Restrict `CORS_ORIGINS` and `FRONTEND_URL` to the real dashboard origin.
- [ ] Keep `AI_API_KEY`, OAuth secrets and DB URLs in the platform secret store.
- [ ] Do not configure a chain private key unless you intentionally want server-side commits.
- [ ] Put the API behind TLS and monitor `/ready`, queue depth and worker heartbeat.
- [ ] Review retention against your privacy obligations.
- [ ] Do not add active exploitation or authentication-bypass features.
