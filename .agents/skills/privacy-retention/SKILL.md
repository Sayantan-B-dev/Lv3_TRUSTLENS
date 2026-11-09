---
name: privacy-retention
description: Use when handling message text, emails, phones, logs, reports, retention or exported data.
---

# Privacy and retention

Rules:

- Raw message bodies are untrusted and sensitive. Do not log them or place them in report payloads/chain data.
- `security/redaction.py` masks emails/phones for display and reports. Extend masking for new PII types rather than leaking.
- Reports include sanitised target, check summaries, indicator values/digests and risk metadata only.
- Logs use request IDs, method, path, status, duration — not bodies, cookies, tokens or API keys.
- Retention defaults: anonymous 7 days, signed-in 90 days; expire investigations accordingly. Do not silently keep data forever.
- Google OAuth stores identity fields needed for the session; no passwords.
- Anonymous sessions are rate-limited.
- Error messages must not include secrets or stack traces.
- Export is user-owned and sanitised.

If adding a field, classify it: operational, derived evidence, or PII. PII requires masking/retention review and must never reach the chain.
