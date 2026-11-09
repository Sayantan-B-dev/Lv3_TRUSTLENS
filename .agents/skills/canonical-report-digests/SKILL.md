---
name: canonical-report-digests
description: Use when changing report payloads, canonicalisation, hashing, report refs or export format.
---

# Canonical report digests

Files: `security/canonical.py`, `services/reports.py`, `api/reports.py`, `security/canonical.py` tests.

Canonical rules:

- NFC-normalise strings.
- Sort object keys.
- Compact separators (no whitespace).
- Floats rounded to 4 decimals.
- UTF-8 bytes, SHA-256 hex.
- Schema version `trustlens.report/v1` is part of the report payload.

Report reference:

```text
0x + sha256("trustlens.report/v1:{investigation_id}:v{version}")
```

Rules:

- Never change canonicalisation without a new schema version; existing digests must remain verifiable.
- Payload must be sanitised: no raw message bodies, full emails/phones or secrets.
- Report creation is idempotent for an existing uncommitted report; revisions get new refs.
- Verification recomputes the digest locally and reads the chain independently.
- State clearly: integrity ≠ truth.

Tests: order independence, content sensitivity, bytes32 length, payload masking.
