---
name: fastapi-endpoint-design
description: Use when adding or changing API routes, dependencies, request models, serializers or error responses.
---

# FastAPI endpoint design

Files: `trustlens/api/`, `main.py`, `api/serializers.py`, `api/deps.py`.

Conventions:

- Prefix `/api/v1`. Routers are registered in `api/__init__.py`.
- Use Pydantic models with `extra="forbid"` for writes.
- Resolve the principal via `get_principal`; enforce ownership server-side. Unauthorised IDs return **404**, not 403, to avoid existence leaks.
- Errors use `{"error": {"message", "status", "request_id"}}` from the global handlers.
- Return 202 for accepted async work, 201 for created records, 204 for deletes.
- Rate-limit submissions and general API traffic.
- Serialise through shared functions; keep `apps/web/lib/types.ts` in sync.
- Never return secrets, raw messages, stack traces or internal paths.
- Add request IDs to logs, not payloads.
- Idempotency: existing uncommitted reports are reused; new revisions get new report refs.

Verify with `tests/test_api_pipeline.py`, including a second-session ownership check.
