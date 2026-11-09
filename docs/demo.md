# Reproducible demo script (5–7 minutes)

Use local services. Do not rely on the demo succeeding against arbitrary live sites; network sources can be unavailable. The product reports that honestly.

## Before the demo

```bash
pnpm install
cd services/backend
python -m venv .venv
./.venv/Scripts/python.exe -m pip install -r requirements.txt
cd ../..
cp .env.example .env
cd services/backend && ./.venv/Scripts/python.exe -m alembic upgrade head
./.venv/Scripts/python.exe -m uvicorn trustlens.main:app --reload --port 8000
```

Second terminal:

```bash
pnpm --dir apps/web dev
```

Open http://localhost:3000. Confirm the header shows the engine online and no red error banner.

Optional chain (third/fourth terminals):

```bash
pnpm --dir contracts node
pnpm --dir contracts deploy:local
# set CHAIN_CONTRACT_ADDRESS in .env and restart the API
```

## Script

### 1. Benign URL

- Paste `https://example.com`, keep **URL / domain**, submit.
- Show scanning states, then the risk panel.
- Point out: coverage, deterministic ruleset version, evidence checks, TLS trust, header findings, limitations. `Low Risk` explicitly says it is not proof of safety.

### 2. Suspicious domain

- Paste `https://paypa1.com/login`.
- Show the typosquatting/brand finding, the reason list and recommended actions.
- Explain that a similarity match is a prompt to investigate, not proof.

### 3. Scam message

- Switch to **Scam message**, paste:

```text
URGENT: your bank account is suspended. Share the OTP now and pay the processing fee
with a gift card. Verify at https://bank-secure-login.example/verify before midnight.
```

- Show extracted URLs/emails/indicators, urgency/credential/payment findings, correlation and remediation.
- Note that emails are redacted and the message body is not sent on-chain.

### 4. Automation and modules

- Pause automation in the header; submit another URL and show it is saved without queueing (or the API reports `paused`).
- Resume, open automation settings, toggle a module, and show the setting persists after refresh.
- Use manual mode to save a draft, then run it.

### 5. History, export and feedback

- Open a previous investigation from history.
- Export the sanitised report and open the JSON.
- Submit feedback (false positive/true positive) and show it is stored.

### 6. Report integrity and Web3

- On a completed investigation, **Create integrity report**.
- Show SHA-256 digest and bytes32 report reference.
- Click **Verify independently** with no chain: local digest is consistent; chain is `unavailable`, and the UI says so.
- With local Hardhat configured: **Commit on-chain**, show tx hash/block, then **Verify independently** → chain `verified`, digest match.
- Emphasise: only digest + reference are on-chain; verification proves integrity, not truth.

### 7. Close

- Summarise: SSRF-safe passive pipeline, deterministic risk, evidence-bound AI fallback, durable jobs, privacy, independent verification.
- Mention honest limits: free-tier sleeping, external source availability, TLS revocation/CT coverage.

## Reset demo data

Stop the API and delete `services/backend/trustlens.db` (SQLite) or drop/recreate the PostgreSQL schema and rerun `alembic upgrade head`. Deleting the local database is destructive; only do it in a demo environment.

## If something fails

- External checks unavailable → result may be `Inconclusive`; that is intended behaviour, not a UI bug.
- Worker idle → restart with `WORKER_ENABLED=true`; check `/api/v1/system/status`.
- Chain commit 409 → no contract address configured; 502 → node not running or wrong address/key.
- Port conflicts → change the port and `BACKEND_URL`, or stop the other process.
