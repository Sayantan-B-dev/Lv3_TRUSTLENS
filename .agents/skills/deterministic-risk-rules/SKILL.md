---
name: deterministic-risk-rules
description: Use when changing risk weights, thresholds, classifications, confidence or coverage behaviour.
---

# Deterministic risk rules

File: `services/backend/trustlens/intelligence/risk.py`. Ruleset version: `trustlens-rules-v1`.

Current logic:

1. Any authoritative finding → `Confirmed Malicious`.
2. ≥2 critical/high findings **and** score ≥50 → `High Risk`.
3. Any critical/high finding **or** score ≥20 → `Suspicious`.
4. Coverage ≥0.5 → `Low Risk`.
5. Else → `Inconclusive`.
6. Degraded sources + coverage <0.75 downgrade a would-be `Low Risk` to `Inconclusive`.

Weights: critical 40, high 25, medium 12, low 4, info 0. Score clamps 0–100. AI is excluded from coverage.

Rules:

- AI may never set or override this result.
- A change in behaviour requires a new ruleset version and updated UI metadata (`/meta`).
- Add boundary tests for both sides of every threshold.
- Keep the five class strings exactly; no synonyms.
- Treat missing evidence as unknown, not clean.
- Do not add a “Safe” class.

Verify: `tests/test_risk_canonical.py` and `tests/test_worker_ai.py`.
