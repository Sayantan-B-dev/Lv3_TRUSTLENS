---
name: evidence-first-analysis
description: Use when adding or changing an intelligence check, finding, evidence payload or limitation.
---

# Evidence-first analysis

Every check returns a structured outcome, not a verdict. The pipeline persists a `CheckResult` even when a source fails.

Required shape:

- `check_id`, `category`, `status` (`completed`, `unavailable`, `error`, `skipped_by_policy`)
- `severity`, `title`, `summary`
- `evidence` (facts actually observed)
- `findings`: `rule_id`, `severity`, `title`, `summary`, `evidence`, `impact`, `remediation`, `limitations`, `authoritative`
- `source` and `source_timestamp` when external data is used

Rules:

- Never fabricate a fact to fill a gap. If DNS/TLS/URLhaus/crt.sh fails, mark the check unavailable and explain why.
- Do not claim a site is safe. Prefer “no significant findings in the checks that ran”.
- Pair heuristics with false-positive limitations.
- Only authoritative, provenance-backed threat intelligence may set `authoritative=True`.
- Completed checks count toward coverage; skipped/unavailable do not.
- Keep evidence small and redacted; never log full message bodies or credentials.

Verify with unit tests for the pure analyser and an API test through `stub_network`.
