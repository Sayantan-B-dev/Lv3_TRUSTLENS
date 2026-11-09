---
name: tls-trust-analysis
description: Use when changing TLS handshakes, certificate parsing, SAN checks, CT lookups or trust messaging.
---

# TLS trust analysis

Files: `intelligence/tls.py`, `security/tlsctx.py`, `intelligence/threat_intel.py`.

Rules:

- Verify chains with `certifi` public roots and hostname checking. Never disable verification or fall back silently to unverified connections.
- Parse the leaf and chain: subject, issuer, SANs, validity window, signature/key algorithms, key size, chain length, trust result.
- Report hostname/SAN mismatch as a finding; do not assert intent.
- Distrust of a root is a fact about this environment; explain certifi usage in docs.
- crt.sh/CT results are coverage-dependent and rate-limited. Mark unavailable honestly.
- Do not claim revocation status unless an authoritative OCSP/CRL check was actually performed. TrustLens currently labels this limitation.
- Never present a valid certificate as proof of legitimacy.

Verify with a live smoke against a known public site and keep synthetic fixtures for API tests. A TLS check failure must reduce coverage or add a limitation, never become “Low Risk” silently.
