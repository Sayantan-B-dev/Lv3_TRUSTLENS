#!/usr/bin/env python3
"""Generate a local engineering handoff without touching secrets.

Usage:
    python scripts/create_handoff.py

Writes .handoff/HANDOFF.md, which is git-ignored. The report includes the
current branch, working-tree state, a file inventory and the verification
commands. It does not read .env files or call external services.
"""

from __future__ import annotations

import subprocess
from datetime import datetime, timezone
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
OUT = ROOT / ".handoff" / "HANDOFF.md"
SKIP_DIRS = {
    ".git",
    ".next",
    "node_modules",
    ".venv",
    "__pycache__",
    ".pytest_cache",
    "artifacts",
    "cache",
    "dist",
    "coverage",
    ".handoff",
}


def git(*args: str) -> str:
    try:
        result = subprocess.run(
            ["git", *args],
            cwd=ROOT,
            capture_output=True,
            text=True,
            timeout=20,
            check=False,
        )
        return (result.stdout or result.stderr).strip() or "(no output)"
    except (OSError, subprocess.TimeoutExpired) as exc:
        return f"(git unavailable: {exc})"


def inventory() -> list[str]:
    files: list[str] = []
    for path in ROOT.rglob("*"):
        if not path.is_file():
            continue
        if any(part in SKIP_DIRS for part in path.parts):
            continue
        if path.name.startswith(".env") and path.name != ".env.example":
            continue
        if path.suffix in {".db", ".pyc", ".log"}:
            continue
        files.append(str(path.relative_to(ROOT)).replace("\\", "/"))
    return sorted(files)


def main() -> None:
    files = inventory()
    status = git("status", "--short")
    diffstat = git("diff", "--stat")
    recent = git("log", "--oneline", "-8")
    now = datetime.now(timezone.utc).strftime("%Y-%m-%d %H:%M UTC")

    content = f"""# TrustLens engineering handoff

Generated: {now}

## Repository

- Branch: {git("rev-parse", "--abbrev-ref", "HEAD")}
- Commit: {git("rev-parse", "--short", "HEAD")}

## Recent commits

```text
{recent}
```

## Working tree

```text
{status}
```

## Diff stat

```text
{diffstat}
```

## Verification commands

```bash
cd services/backend && ./.venv/Scripts/python.exe -m pytest
pnpm --dir apps/web typecheck
pnpm --dir apps/web test
pnpm --dir apps/web build
pnpm --dir contracts test
```

## Current deliverable map

- Backend API, intelligence pipeline, AI fallback, jobs, chain client: `services/backend/trustlens/`
- Tests: `services/backend/tests/`
- Dashboard: `apps/web/`
- Registry and tests: `contracts/`
- Documentation: `docs/`, `README.md`, `AGENTS.md`
- CI and deployment: `.github/workflows/ci.yml`, `render.yaml`

## Known limitations (carry forward honestly)

- Correlation is evidence-based but has no graph database or multi-investigation UI.
- TLS/CT checks depend on live external services; revocation is not asserted.
- Rate limiting is per instance.
- Blockchain verification proves report integrity, not truthfulness.
- Playwright/browser E2E is not part of the default test suite.
- Cloud deployment and Google OAuth require user-owned accounts and were not performed.

## Files ({len(files)})

```text
{chr(10).join(files)}
```

## Notes

- Never commit `.env` or real credentials.
- No automatic commit, push, deploy or testnet spend.
- Review `AGENTS.md` before making changes.
"""

    OUT.parent.mkdir(exist_ok=True)
    OUT.write_text(content, encoding="utf-8")
    print(f"Wrote {OUT.relative_to(ROOT)} ({len(files)} files indexed).")


if __name__ == "__main__":
    main()
