# TrustLens

**AI-powered web threat detection and digital trust intelligence.** TrustLens investigates suspicious links, domains, TLS trust, website security configuration and scam messages, then explains every finding with traceable evidence. Risk classification is deterministic; AI is optional and can only explain, never decide. Completed reports can be committed to a local EVM registry and verified independently.

> Evidence first. AI second. Transparency always.

---

## What works

- URL/domain investigation with SSRF-safe fetching, DNS pinning, redirect revalidation and IDN/typosquatting heuristics.
- TLS handshake, certificate-chain and Certificate Transparency intelligence, plus passive header and mixed-content review.
- Scam-message analysis with URL/email/phone/IP IOC extraction and cross-investigation correlation.
- Deterministic, versioned risk engine with exactly five outcomes: `Low Risk`, `Suspicious`, `High Risk`, `Confirmed Malicious`, `Inconclusive`.
- Optional AI explanation with strict evidence-ID validation, prompt-injection defences and a deterministic fallback when no key is present.
- Persistent investigation history, ownership isolation, feedback, export, automation pause/resume and automatic/manual modes.
- Durable database-backed job queue with leases, retries, exponential backoff and expired-lease recovery.
- Sanitised report export, canonical JSON + SHA-256 digest, Solidity `ReportRegistry`, local commit and independent verification.
- Single-page Next.js dashboard with anime.js motion; responsive dark interface; every visible control calls the real API.
- Backend, contract and frontend test suites plus CI and free-tier deployment configuration.

**Blockchain limitation:** the registry proves that a report's canonical bytes have not changed. It does not prove that the report's claims are true.

---

## Architecture

```text
Browser
  │
  ▼
Next.js 16 dashboard (apps/web)
  │  /api/* rewrite (BACKEND_URL)
  ▼
FastAPI API + embedded worker (services/backend)
  ├── Intelligence pipeline ── URL · DNS · HTTP · TLS · headers · messages · correlation
  ├── Deterministic risk engine (trustlens-rules-v1)
  ├── Optional AI explainer (evidence-bound, validated, fallback)
  ├── SQLAlchemy 2 ── SQLite locally / PostgreSQL (Neon) in production
  └── EVM JSON-RPC client ── Solidity ReportRegistry (digest + report ref only)
```

The API and worker share one process for the free-tier MVP. The job queue lives in the database, so no Redis, Docker or Kubernetes is required.

---

## Stack

| Layer | Technology |
| --- | --- |
| Frontend | Next.js 16.4 App Router, React 19.3, strict TypeScript, Tailwind CSS 4, anime.js 4 |
| Backend | Python 3.13, FastAPI, Pydantic v2, SQLAlchemy 2, Alembic |
| Database | SQLite by default; PostgreSQL 18 / Neon via `DATABASE_URL` |
| Intelligence | Python `ssl`, `cryptography`, `dnspython`, `httpx`, certifi roots |
| AI | Provider abstraction (`auto`, `none`, `mock`, `openai`, `deterministic`) |
| Web3 | Solidity 0.8.28, Hardhat 3, raw JSON-RPC + `eth-account` |
| Tests | pytest, Vitest, Hardhat/Mocha/Chai |

---

## Repository layout

```text
apps/web/                Next.js dashboard, API client, Vitest tests
services/backend/        FastAPI app, intelligence engine, AI, worker, migrations, pytest
contracts/               ReportRegistry.sol, Hardhat config, deploy script, contract tests
docs/                    SRS copy, architecture, security, testing, deployment, AI, learning
.agents/skills/          Project-specific engineering skills
.opencode/agents/        Specialist project agents
scripts/                 Commit planner and handoff generator
.github/workflows/       CI
render.yaml              Render blueprint for the API
```

---

## Prerequisites

- **Node.js 24** and **pnpm 11** (`corepack enable` if pnpm is unavailable).
- **Python 3.13** with `venv`.
- Git Bash on Windows is assumed below. macOS/Linux users replace `.venv/Scripts/python.exe` with `.venv/bin/python`.
- Optional: PostgreSQL 18, Google OAuth credentials, an OpenAI-compatible key, a local Hardhat chain.
- No cloud account, API key, Docker or PostgreSQL is required to run the core product.

---

## Run locally — complete process

Follow these steps in order. Commands are run from the repository root unless stated otherwise.

### 1. Install JavaScript dependencies

```bash
pnpm install
```

### 2. Create the backend environment

```bash
cd services/backend
python -m venv .venv
./.venv/Scripts/python.exe -m pip install --upgrade pip
./.venv/Scripts/python.exe -m pip install -r requirements.txt
```

### 3. Create your environment file

From the repository root:

```bash
cp .env.example .env
```

The defaults use SQLite at `services/backend/trustlens.db`, enable the embedded worker, and need no credentials. Never commit `.env`.

Optional frontend override (only if the API is not on `127.0.0.1:8000`):

```bash
printf 'BACKEND_URL=http://127.0.0.1:8000\n' > apps/web/.env.local
```

### 4. Apply the database migration

```bash
cd services/backend
./.venv/Scripts/python.exe -m alembic upgrade head
```

`AUTO_CREATE_SCHEMA=true` also creates missing tables at startup, but migrations are the source of truth for PostgreSQL.

### 5. Start the API (terminal 1)

```bash
cd services/backend
./.venv/Scripts/python.exe -m uvicorn trustlens.main:app --reload --port 8000
```

Verify:

```bash
curl http://127.0.0.1:8000/health
curl http://127.0.0.1:8000/ready
# API docs: http://127.0.0.1:8000/docs
```

### 6. Start the dashboard (terminal 2)

```bash
pnpm --dir apps/web dev
```

Open **http://localhost:3000**. The dashboard proxies `/api/*` to `BACKEND_URL` (default `http://127.0.0.1:8000`), so cookies and requests stay on one origin.

### 7. Use it

1. Choose **URL / domain** or **Scam message**.
2. Paste a target and submit. Automatic mode queues it immediately; Manual mode saves a draft you can run.
3. Watch the progress panel, then review the risk class, coverage, evidence, TLS, headers, indicators and remediation.
4. Pause/resume automation or toggle modules from the control panels; changes persist through the API.
5. Open a completed investigation, create a sanitised report, and verify its digest. Commit on-chain only when a registry is configured.

> Try benign `https://example.com` and suspicious `https://paypa1.com`. TrustLens never fabricates findings: if a network source is unavailable, the check is reported as unavailable and can make the overall result `Inconclusive`.

---

## Database configuration

### SQLite (default, zero setup)

```env
DATABASE_URL=sqlite+pysqlite:///./trustlens.db
```

Relative paths resolve from the backend working directory (`services/backend`).

### PostgreSQL / Neon

Create a database and set:

```env
DATABASE_URL=postgresql+psycopg://trustlens:YOUR_PASSWORD@localhost:5432/trustlens
DIRECT_DATABASE_URL=postgresql+psycopg://trustlens:YOUR_PASSWORD@localhost:5432/trustlens
```

For Neon, use the **pooled** URL for `DATABASE_URL` and the **direct** URL for `DIRECT_DATABASE_URL` (Alembic). Then run:

```bash
cd services/backend
./.venv/Scripts/python.exe -m alembic upgrade head
```

If `psql` is not on PATH on Windows, create the database/user with pgAdmin's Query Tool. Do not put credentials in Git or chat.

---

## Tests and checks

Run from the repository root, with the backend virtual environment activated for Python commands.

```bash
# Backend: 66 tests — SSRF/netguard, normalisation, domain, messages, risk, canonical JSON,
# API ownership, pause/manual mode, reports, worker retries/leases, AI validation fallback
cd services/backend && ./.venv/Scripts/python.exe -m pytest

# Frontend typecheck, unit tests and production build
pnpm --dir apps/web typecheck
pnpm --dir apps/web test
pnpm --dir apps/web build

# Solidity: compile + 8 contract tests
pnpm --dir contracts build
pnpm --dir contracts test

# Optional browser smoke flow (requires Google Chrome and both services running)
pnpm --dir apps/web test:e2e
```

If you activated the venv, `pnpm test:api` and `pnpm db:migrate` are convenience aliases.

---

## Optional: local blockchain verification

The application works without a chain. To exercise the Web3 path locally:

```bash
# Terminal 3 — local Hardhat node (chain ID 31337)
pnpm --dir contracts node

# Terminal 4 — deploy once per node session
pnpm --dir contracts deploy:local
```

Copy the printed address into your root `.env`:

```env
CHAIN_RPC_URL=http://127.0.0.1:8545
CHAIN_ID=31337
CHAIN_CONTRACT_ADDRESS=0x...
CHAIN_PRIVATE_KEY=0xac0974bec39a17e36ba4a6b4d238ff944bacb478cbed5efcae784d7bf4f2ff80
```

`CHAIN_PRIVATE_KEY` above is Hardhat's **public, well-known local account #0 key**. It must only ever be used against a disposable local chain. Never fund it or use it on a testnet/mainnet.

Restart the backend. In the dashboard, create a report → **Commit on-chain** → **Verify independently**. Verification should report `verified` with a matching on-chain digest. The chain stores only the report reference and SHA-256 digest — never raw URLs, message bodies, emails or PII.

---

## Optional integrations

| Integration | Required? | Configure |
| --- | --- | --- |
| AI explanation | No | `AI_PROVIDER=auto` + `AI_API_KEY`; without a key the deterministic explainer is used |
| Google OAuth | No | `GOOGLE_CLIENT_ID`, `GOOGLE_CLIENT_SECRET`; redirect URI must match exactly |
| URLhaus | No key | `THREAT_INTEL_ENABLED=true`; optional `URLHAUS_AUTH_KEY` for higher limits |
| crt.sh | No key | `CT_LOOKUP_ENABLED=true` |
| PostgreSQL/Neon | No | `DATABASE_URL` + `DIRECT_DATABASE_URL` |
| EVM registry | No | local Hardhat address + local dev key |

Production must change `SESSION_SECRET`, set `COOKIE_SECURE=true`, and use `ENVIRONMENT=production`.

---

## Deployment

Detailed beginner-friendly steps are in [`docs/deployment/free-tier.md`](docs/deployment/free-tier.md). The intended free topology:

- **Vercel** — Next.js in `apps/web`; set `BACKEND_URL` to the Render URL.
- **Render** — one Python web service from `services/backend`; `render.yaml` is included.
- **Neon** — PostgreSQL; pooled URL for the app, direct URL for migrations.
- **GitHub Actions** — CI only (`.github/workflows/ci.yml`).

Free tiers sleep, have instance-hour and usage limits, and are not an uptime guarantee. Local development never requires these accounts.

---

## Security, privacy and honest limits

- **SSRF defence:** only `http`/`https`, only ports 80/443, credentials rejected, every resolved IP checked against private/special-use ranges, DNS pinned per hop, redirects revalidated (max 5), response capped at 64 KiB.
- **Passive only:** TrustLens fetches public pages, headers and TLS metadata. It does not exploit, brute-force, log in, execute JavaScript or download malware.
- **TLS:** certificate chains are verified with certifi's public roots; the system does not silently disable verification. Revocation and full CT coverage have limitations and are labelled as such.
- **AI:** schema-validated output; every claim must cite an existing evidence ID; unknown IDs trigger deterministic fallback; AI never sets or overrides risk. Message text is untrusted data, never instructions.
- **Privacy:** raw messages are redacted for display/logging; reports mask emails/phones and store only indicator digests and values where needed; retention defaults are 7 days anonymous / 90 days signed-in.
- **Web3:** only `report_ref` + `digest` go on-chain; verification proves byte integrity, not truthfulness.
- **No secrets in the repo.** `.env` is ignored; `.env.example` contains only a documented local dev key.

---

## Troubleshooting

| Symptom | Fix |
| --- | --- |
| Dashboard shows “Cannot reach the TrustLens API” | Start uvicorn on port 8000; check `BACKEND_URL`; ensure only one process owns the port. |
| `unable to get local issuer certificate` | TrustLens already uses certifi roots. Check system proxy/VPN or corporate interception; never disable TLS verification. |
| Worker shows idle | Set `WORKER_ENABLED=true`, restart the API, check `/api/v1/system/status`. |
| Queue item stays queued | Worker disabled, automation paused, or the job is backing off after a retry. |
| `database is locked` (SQLite) | Run one API/worker process; use PostgreSQL for concurrent production workloads. |
| Alembic cannot connect | `DIRECT_DATABASE_URL` must be a direct (non-pooled) PostgreSQL URL. |
| Google sign-in redirects fail | Register the exact `GOOGLE_REDIRECT_URI`, including scheme/host/port. |
| Commit says registry not configured | Set `CHAIN_CONTRACT_ADDRESS`, restart, and ensure the Hardhat node is running. |
| Port already in use | `pnpm --dir apps/web dev -- -p 3001` or change the uvicorn port and `BACKEND_URL`. |

---

## Documentation

- [SRS (verbatim source)](docs/source/SRS.md)
- [Requirements traceability](docs/traceability.md)
- [Architecture](docs/architecture/overview.md)
- [Security model](docs/security/threat-model.md)
- [Testing strategy](docs/testing/strategy.md)
- [Free-tier deployment](docs/deployment/free-tier.md)
- [AI context and prompt contract](docs/ai/README.md)
- [Demo script](docs/demo.md)
- [Learning and interview guide](docs/learning/guide.md)
- [Repository agent rules](AGENTS.md)

---

## Status

Built and validated locally on Windows/Git Bash: backend test suite, frontend typecheck/tests/production build, Solidity compile and contract tests, a live two-service proxy flow, the Playwright browser smoke flow, and a live local Hardhat report commit + verification. Optional cloud deployment and Google OAuth require your own accounts and were not deployed automatically.
