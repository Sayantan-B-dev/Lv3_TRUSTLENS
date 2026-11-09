---
name: message-ioc-extraction
description: Use when changing scam-message heuristics, URL/email/phone/IP extraction, redaction or correlation inputs.
---

# Message and IOC extraction

File: `intelligence/messages.py`, URL extraction in `intelligence/normalize.py`.

Behaviour:

- Extract http(s)/www URLs, emails, IPs, phone-like values and domains.
- Score social-engineering patterns: urgency, credential/OTP requests, payment/gift-card demands, secrecy, remote-access tools, threats, impersonation.
- Produce rule findings with evidence and limitations; message analysis is heuristic, not proof of fraud.
- Redact emails/phones in displayed text and report payloads. Raw messages must not appear in logs.
- Cap parsing work; input length is bounded by `MAX_INPUT_CHARS`.
- Extracted URLs may be investigated as additional checks; keep check IDs stable and explainable.

Rules:

- Do not execute links from messages automatically without the SSRF-safe pipeline.
- Avoid overclaiming: benign messages must not be labelled fraud.
- Add a benign case whenever adding a strong heuristic.
- Correlation may use indicator values/digests, never raw personal data.

Verify: `tests/test_domain_messages.py` and `tests/test_api_pipeline.py` message case.
