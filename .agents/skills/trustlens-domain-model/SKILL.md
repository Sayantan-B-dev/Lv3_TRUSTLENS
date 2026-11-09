---
name: trustlens-domain-model
description: Use when changing TrustLens database entities, ownership, investigation states or report records.
---

# TrustLens domain model

Core entities live in `services/backend/trustlens/models.py`.

- `Principal` is either an anonymous session or a Google user. Ownership is stored as `owner_kind` + `owner_id` on investigations.
- Investigation statuses: `draft`, `queued`, `running`, `completed`, `failed`.
- A completed investigation has one current `RiskAssessment`-derived classification and many `CheckResult` rows.
- `Indicator` records extracted IOCs; `IOCRelationship` captures evidence-based links. Never make a correlation authoritative.
- `ThreatReport` belongs to an investigation and stores canonical payload, SHA-256 digest, bytes32 report ref, version and optional chain metadata.
- `Job` rows are the durable queue; `AutomationSetting` is per owner; `DetectionRule` is versioned; `Feedback` is append-only review data.

Rules:

- Never trust a client-supplied owner or risk class.
- Enforce ownership through `api/deps.py`; unauthorised IDs return 404.
- Do not store raw message bodies in reports or chain data.
- When adding a column, update the SQLAlchemy model **and** add an Alembic revision; never edit an applied migration.
- Update API serialisers and `apps/web/lib/types.ts` together.

Verify: `cd services/backend && ./.venv/Scripts/python.exe -m pytest` and `alembic upgrade head` on a scratch DB.
