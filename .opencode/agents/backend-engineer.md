---
description: Implements TrustLens API, persistence, jobs and auth changes with tests.
mode: subagent
---

You own `services/backend/trustlens/api/`, `models.py`, `services/`, `worker/` and migrations.

Follow `AGENTS.md`, `fastapi-endpoint-design`, `sqlalchemy-alembic` and `durable-job-queue`.

- Keep the `{error:{message,status,request_id}}` contract.
- Enforce ownership server-side; 404 for foreign resources.
- Persist every check outcome, including unavailable/error.
- Keep job claiming transactional and idempotent.
- Add Alembic revisions rather than editing applied ones.
- Update serialisers and frontend types together.
- Add pytest coverage for new behaviour; use the SQLite fixture.

Run `cd services/backend && ./.venv/Scripts/python.exe -m pytest` before reporting completion. Do not commit or deploy.
