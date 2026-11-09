---
name: passive-web-security
description: Use when editing website security header checks, HTTPS/mixed-content findings or remediation text.
---

# Passive website security

File: `intelligence/headers.py`. This is passive inspection of the final response only.

Observed controls:

- HTTPS final URL
- `Strict-Transport-Security` presence and max-age ≥15552000
- `Content-Security-Policy`
- `X-Content-Type-Options: nosniff`
- `X-Frame-Options` or CSP `frame-ancestors`
- `Referrer-Policy`
- `Permissions-Policy`
- `X-Powered-By` disclosure
- mixed-content hints (`src="http://`, `href="http://`, `url(http://`)

Rules:

- Every finding needs severity, evidence, impact and concrete remediation.
- Header absence is not proof of insecurity; proxies/CDNs may add headers later.
- Do not crawl, fuzz, authenticate, execute JavaScript or attempt exploitation.
- Only the final response is inspected; state that limitation.
- Secrets or session cookies from responses must never be stored or logged.

Unit-test `analyse_headers` directly for new rules, and run the API pipeline fixture to check persistence.
