---
name: security-regression-tests
description: Use when fixing a security issue or changing SSRF, auth, AI, privacy or chain behaviour.
---

# Security regression tests

Every security fix needs a test that fails before the fix.

Where to add:

- SSRF, IP parsing, DNS: `tests/test_netguard_normalize.py`
- Domain deception: `tests/test_domain_messages.py`
- Message redaction: `tests/test_domain_messages.py`
- Risk boundaries/coverage: `tests/test_risk_canonical.py`
- Ownership, automation, reports, input limits: `tests/test_api_pipeline.py`
- Retries/leases: `tests/test_worker_ai.py`
- AI citation/fallback: `tests/test_worker_ai.py`
- Registry: `contracts/test/ReportRegistry.ts`

Rules:

- Use `stub_network`; never rely on public internet in tests.
- Assert the security property, not an implementation detail.
- Do not skip/weaken tests to get green; report environment limitations.
- Keep tests deterministic (no sleeps where avoidable; SQLite timezone-safe comparisons).
- Add both an allowed and a rejected case for new validation.

Run the full backend suite after any security change.
