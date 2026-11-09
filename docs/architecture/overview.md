# Architecture

## Context

TrustLens is one product with three runnable parts:

```text
┌──────────────────────────┐        /api/* rewrite        ┌─────────────────────────────┐
│ Next.js dashboard        │ ───────────────────────────▶ │ FastAPI API + worker        │
│ apps/web (port 3000)     │                              │ services/backend (port 8000)│
└──────────────────────────┘                              └──────────────┬──────────────┘
                                                                         │
                        ┌────────────────────────────────────────────────┼──────────────────────────┐
                        ▼                                                ▼                          ▼
              Intelligence pipeline                             SQLAlchemy / PostgreSQL      EVM JSON-RPC
       URL · DNS · HTTP · TLS · headers · messages         investigations, evidence, jobs      ReportRegistry
                        │                                                │                    (digest only)
                        └──────────────▶ deterministic risk ◀────────────┘
                                               │
                                        optional AI explainer
                                     (validated, never decisive)
```

The browser never talks to the database or chain directly. Next.js proxies `/api/*` to the FastAPI service so session cookies remain first-party on the dashboard origin. In production, Vercel rewrites to Render; locally, it rewrites to `127.0.0.1:8000`.

## Request lifecycle

1. `POST /api/v1/investigations` validates input, normalises a URL or accepts a message, resolves the anonymous/user principal, applies automation settings and rate limits, persists the investigation, and optionally enqueues a job.
2. The embedded worker claims a queued job in a short transaction. PostgreSQL uses `FOR UPDATE SKIP LOCKED`; SQLite uses an optimistic conditional update. A lease timestamp prevents two workers from processing the same job.
3. The pipeline runs applicable checks and persists a `CheckResult` for every check, including `unavailable`/`error` outcomes. Checks are independent; a failed network source does not fabricate a result.
4. Findings are converted to `RiskFinding`s and passed to the deterministic risk engine. The assessment (class, score, coverage, confidence, reasons, limitations, next actions) is persisted.
5. AI, if enabled, receives only structured evidence and the already-computed risk assessment. Its output must cite existing evidence IDs; otherwise the deterministic explanation is used. AI never mutates the risk class.
6. The API serialises the investigation, evidence, indicators, reports and AI explanation. The dashboard polls while a job is active and renders the result.
7. A report snapshots sanitised data into canonical JSON, computes SHA-256, derives a bytes32 report reference, and optionally commits the pair to the registry. Verification recomputes the digest and reads the registry independently.

## Backend modules

| Path | Responsibility |
| --- | --- |
| `trustlens/api/` | Routers, auth/principal dependency, ownership checks, serialisers, error contract |
| `trustlens/intelligence/` | Normalisation, DNS, SSRF-safe HTTP, TLS, CT, headers, domain heuristics, messages, correlation, risk, pipeline |
| `trustlens/ai/` | Provider abstraction, strict Pydantic schema, evidence validation, deterministic fallback |
| `trustlens/security/` | Netguard/SSRF, canonical JSON, redaction, sessions, TLS context, rate limiting |
| `trustlens/services/` | Report building, job queue, chain client |
| `trustlens/worker/` | Claim loop, heartbeat, processing, retry/failure handling, graceful shutdown |
| `trustlens/models.py` | SQLAlchemy entities: sessions/users, investigations, checks, evidence, risk, IOCs, relationships, reports, jobs, automation, rules, feedback |
| `migrations/` | Alembic initial schema and environment |

## Risk engine

Version: `trustlens-rules-v1`. Weights: critical 40, high 25, medium 12, low 4, info 0. Score is clamped to 0–100.

Decision order:

1. Any **authoritative** finding → `Confirmed Malicious`.
2. At least two significant (critical/high) findings **and** score ≥ 50 → `High Risk`.
3. Any significant finding **or** score ≥ 20 → `Suspicious`.
4. Coverage ≥ 0.5 → `Low Risk`.
5. Otherwise → `Inconclusive`.
6. If degraded sources exist and coverage < 0.75, a would-be `Low Risk` becomes `Inconclusive`.

Coverage = completed applicable checks / applicable checks. AI is excluded from coverage. Confidence combines coverage and significant findings, capped at 0.95; `Inconclusive` is capped at 0.5.

**Why these rules:** heuristic signals alone should not confirm malice; only an authoritative source (for example a URLhaus hit with provenance) can. Missing data is treated as unknown, not clean. The rules are pure and unit-tested at the boundaries.

## Report integrity

Canonical JSON: NFC-normalised strings, sorted keys, compact separators, floats rounded to four decimals, UTF-8, SHA-256. `report_ref = 0x + sha256("trustlens.report/v1:{investigation_id}:v{version}")`.

The on-chain registry stores `(bytes32 reportRef → bytes32 digest)` plus submitter/revision metadata. Raw URLs, message text, emails and PII never go on-chain. Verification proves the stored report still hashes to the committed digest; it does not prove the report is correct.

## Job queue semantics

- Statuses: `queued`, `running`, `succeeded`, `failed`.
- `attempts` increments on claim; `max_attempts` defaults to 4.
- Retry delay: `min(base * 2^(attempts-1), 600)` seconds. The investigation returns to `queued` while waiting.
- Leases expire after `WORKER_LEASE_SECONDS`; recovery requeues or fails after max attempts.
- Idempotency keys prevent duplicate jobs for the same investigation state.
- Worker heartbeat is persisted and surfaced by `/system/status`.

## Configuration and deployment

Settings are environment-driven (`pydantic-settings`), with SQLite and deterministic AI as safe defaults. The same code runs locally and on Render; no cloud account is needed for local use. See [`docs/deployment/free-tier.md`](../deployment/free-tier.md).

## Design trade-offs

- **One process for API + worker** keeps the free tier simple; a dedicated worker deployment is a future scaling step.
- **Deterministic risk + AI explanation** sacrifices “AI decides everything” novelty for auditability, which is the product's differentiator.
- **SQLite default** makes the project runnable with zero credentials; PostgreSQL remains the production path, with dialect-specific job claiming.
- **No Redis/Kubernetes/Docker** reduces setup burden for a hackathon and reviewers.
