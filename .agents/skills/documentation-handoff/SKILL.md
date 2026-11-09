---
name: documentation-handoff
description: Use when updating the README, docs, traceability, run instructions, demo script or handoff.
---

# Documentation and handoff

Rules:

- Commands must be copy-paste runnable from the stated directory and must have been run when claimed.
- Keep the SRS copy byte-identical to `srs.md`; do not edit the preserved source.
- Separate verified facts from plans. Never fabricate test results, deployments, credentials or scan outcomes.
- Document limitations (free-tier sleeping, TLS revocation, external API outages, blockchain integrity-not-truth).
- Update traceability when adding a module, test or known gap.
- Include Windows/Git Bash paths because that is the primary local environment, plus POSIX alternatives where useful.
- No secrets or real env values in docs.
- Keep the README quick-start ordered: install → env → migrate → API → web → tests.
- Handoff: `python scripts/create_handoff.py` writes a git-ignored report.

Check links resolve and commands match `package.json`, `requirements.txt` and `alembic.ini`. Re-run any check whose result is stated.
