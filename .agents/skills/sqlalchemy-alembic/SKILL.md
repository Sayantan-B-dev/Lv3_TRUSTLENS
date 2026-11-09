---
name: sqlalchemy-alembic
description: Use when adding database tables, columns, indexes, constraints or Alembic migrations.
---

# SQLAlchemy 2 + Alembic

Files: `models.py`, `db.py`, `migrations/`, `alembic.ini`.

Workflow:

1. Change the SQLAlchemy model with typed `Mapped[...]` fields and explicit constraints.
2. Add a new Alembic revision under `migrations/versions/` (do not rewrite applied revisions).
3. Run `alembic upgrade head` against a scratch SQLite DB and, when available, PostgreSQL.
4. Update serialisers, API types and tests together.

Conventions:

- UUID string primary keys; UTC timestamps via `utcnow()`.
- Ownership: `owner_kind` + `owner_id`, indexed.
- Store JSON payloads for evidence/report data; add indexes for lookup paths.
- Use `DIRECT_DATABASE_URL` for migrations in production (Neon direct host).
- SQLite is for local/tests; production concurrency needs PostgreSQL.
- Never add destructive migrations without an explicit user request.

Verify schema: `sqlite3` unavailable? Use SQLAlchemy inspector or a Python snippet; do not add a dependency just to inspect.
