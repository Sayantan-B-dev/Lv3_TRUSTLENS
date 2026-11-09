---
name: durable-job-queue
description: Use when changing background jobs, workers, retries, leases, idempotency or queue status.
---

# Durable job queue

Files: `services/jobs.py`, `worker/runner.py`, `models.Job`.

Invariants:

- A job is a database row; enqueue is idempotent via `idempotency_key`.
- Claim in a short transaction. PostgreSQL: `FOR UPDATE SKIP LOCKED`. SQLite: optimistic conditional update and rowcount check.
- Claim increments `attempts`, sets `running` and a lease expiry.
- Retry delay is bounded exponential: `min(base * 2^(attempts-1), 600)`; investigation returns to `queued`.
- After `max_attempts`, job and investigation become `failed` with a safe error.
- Expired leases are recovered on startup and periodically; max-attempt jobs fail.
- Graceful shutdown stops claiming and waits for the current job.
- Heartbeat is persisted for `/system/status`; never claim if the worker is disabled.

Test retry, recovery, max-attempt failure and idempotency with SQLite. Do not add Redis or in-memory-only queues for the MVP.
