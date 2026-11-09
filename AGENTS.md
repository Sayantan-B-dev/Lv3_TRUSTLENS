# TrustLens — repository agent rules

These instructions apply to the whole repository. Read `srs.md` / `docs/source/SRS.md` before changing product behaviour.

## Product invariants

- **Evidence first, AI second.** AI may explain evidence but must never set, override or imply a different risk class.
- Risk classes are exactly: `Low Risk`, `Suspicious`, `High Risk`, `Confirmed Malicious`, `Inconclusive`. Keep backend, API and UI strings identical.
- The risk engine is deterministic and versioned (`trustlens-rules-v1`). Any rule change requires a new version and updated tests.
- `Low Risk` means “no significant findings in the checks that ran”, never “safe”. Degraded or low-coverage evidence must not silently become `Low Risk`.
- No fabricated scans, threat-intel hits, CVEs, certificate data or AI claims. Unavailable sources are reported as unavailable.
- Do not expose raw messages, full emails/phones or secrets in logs, reports, screenshots or chain data.

## Security invariants

- Never weaken SSRF controls: HTTP(S) only, ports 80/443, no embedded credentials, private/special-use IP blocking, DNS pinning, per-hop redirect validation, bounded response size.
- Never disable TLS verification or add `verify=False`; use the shared certifi context.
- Keep AI output schema-validated and evidence-ID checked. Unknown evidence => deterministic fallback.
- Keep report canonicalisation stable: NFC, sorted keys, compact separators, floats rounded to 4, SHA-256.
- Never commit `.env`, credentials, private keys, database files or generated artefacts.

## Workflow

- Run commands from the repository root. Backend commands use `services/backend/.venv`.
- Make the smallest coherent change; do not add unrequested features or dependencies.
- No automatic `git commit`, push, deploy, paid resource or testnet spend. A user must explicitly request those actions.
- Do not rewrite migrations that have been applied; add a new Alembic revision.
- Keep the single-page dashboard free of dead controls: every visible button must call a real API or perform a real local action.

## Checks before calling work complete

```bash
cd services/backend && ./.venv/Scripts/python.exe -m pytest
pnpm --dir apps/web typecheck && pnpm --dir apps/web test && pnpm --dir apps/web build
pnpm --dir contracts test
```

For database changes, also run `./.venv/Scripts/python.exe -m alembic upgrade head` against a scratch database. For UI changes, check desktop and narrow layouts and report any unverified visual behaviour.

## Layout

- `apps/web/components/Dashboard.tsx` owns client state and API actions.
- `services/backend/trustlens/intelligence/` contains deterministic checks and the risk engine.
- `services/backend/trustlens/api/` contains HTTP endpoints and serialisers.
- `services/backend/trustlens/services/jobs.py` owns queue leases and retries.
- `services/backend/trustlens/security/` owns SSRF, TLS context, redaction, sessions, canonicalisation.
- `contracts/` owns the registry and its tests.
- Project-specific skills live in `.agents/skills/`; specialist roles in `.opencode/agents/`.
