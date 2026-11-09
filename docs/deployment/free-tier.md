# Free-tier deployment: Vercel + Render + Neon

This guide deploys the existing code. The agent did **not** create accounts, deploy, or spend testnet funds. Do not commit secrets. Free tiers change; verify current limits before relying on them.

## 1. Database — Neon PostgreSQL

1. Create a Neon project in the closest available region (Singapore / `ap-southeast-1` if offered).
2. Copy two connection strings:
   - **Pooled** → `DATABASE_URL` (used by the app).
   - **Direct** → `DIRECT_DATABASE_URL` (used by Alembic migrations).
3. Keep `sslmode=require` in the URLs.
4. Local alternative: PostgreSQL 18 with a `trustlens` database and user. SQLite also works with no setup.

## 2. Backend — Render

The repository includes [`render.yaml`](../../render.yaml). Either use the blueprint or create a Web Service manually:

- **Repository:** this repo.
- **Root directory:** `services/backend`.
- **Runtime:** Python 3.13.
- **Build command:** `pip install -r requirements.txt && alembic upgrade head`
- **Start command:** `uvicorn trustlens.main:app --host 0.0.0.0 --port $PORT`
- **Health check path:** `/ready`
- **Plan:** Free (note: sleeps after inactivity).

Environment variables:

```env
ENVIRONMENT=production
DATABASE_URL=postgresql+psycopg://...pooled...
DIRECT_DATABASE_URL=postgresql+psycopg://...direct...
SESSION_SECRET=<generate a long random value>
COOKIE_SECURE=true
FRONTEND_URL=https://your-app.vercel.app
CORS_ORIGINS=https://your-app.vercel.app
WORKER_ENABLED=true
AI_PROVIDER=auto
AI_API_KEY=<optional>
THREAT_INTEL_ENABLED=true
CT_LOOKUP_ENABLED=true
```

Optional: Google OAuth (`GOOGLE_CLIENT_ID`, `GOOGLE_CLIENT_SECRET`, `GOOGLE_REDIRECT_URI=https://your-app.vercel.app/api/v1/auth/google/callback`), chain variables only if you intentionally run a registry.

Do not set `CHAIN_PRIVATE_KEY` on Render unless you have a deliberate signer design. The local Hardhat key is public.

After deploy, check:

```bash
curl https://YOUR-SERVICE.onrender.com/health
curl https://YOUR-SERVICE.onrender.com/ready
```

If migrations fail, confirm `DIRECT_DATABASE_URL` is the direct host and that the database is reachable.

## 3. Frontend — Vercel

1. Import the repository into Vercel.
2. **Root Directory:** `apps/web`.
3. Framework preset: Next.js. Build command `pnpm build` (default), install at repo root via the workspace.
4. Environment variable:

```env
BACKEND_URL=https://YOUR-SERVICE.onrender.com
```

5. Deploy. Open the Vercel URL. The `/api/*` rewrite proxies to Render, so cookies stay on the Vercel origin.

If Vercel's build cannot see workspace dependencies, set the project root to the repository root and the output/app directory to `apps/web`; the included `pnpm-workspace.yaml` is the source of truth.

Update Render's `CORS_ORIGINS`/`FRONTEND_URL` to the final Vercel domain after the first deploy, then restart the service.

## 4. Google OAuth (optional)

In Google Cloud Console:

- Authorised JavaScript origin: `https://your-app.vercel.app`
- Authorised redirect URI: `https://your-app.vercel.app/api/v1/auth/google/callback`

Set the same values in Render. A mismatch produces `redirect_uri_mismatch`. Without OAuth, anonymous demo sessions still work.

## 5. Blockchain (optional, not required for hosting)

Local only by default. A public testnet would require explicit approval, a funded deployer, and a deliberate key-management decision. Never use the documented Hardhat key on a public network. If no registry is configured, the UI clearly shows “Registry offline” and still verifies the canonical digest locally.

## 6. CI

`.github/workflows/ci.yml` runs backend tests, frontend typecheck/tests/build, and contract tests on push/PR. It needs no secrets and does not deploy.

## Free-tier limitations (be honest with judges/users)

- Render Free services sleep after inactivity; the first request may be slow. Monthly instance-hour limits apply.
- Neon Free has storage/compute limits and may suspend idle computes.
- Vercel Hobby has usage and commercial-eligibility restrictions.
- No SLA, no guaranteed uptime, no managed backups on free plans.
- The embedded worker stops when the web service sleeps; queued jobs resume after wake.
- AI/URLhaus/crt.sh/Google are external dependencies with their own quotas and outages.
- In-process rate limiting is per instance; it is not a distributed control.

## Production hardening checklist

- Strong `SESSION_SECRET`; secure cookies; HTTPS everywhere.
- Restrict CORS/frontend URLs to the real origin.
- Rotate any key that was ever exposed; never commit `.env`.
- Use a dedicated DB role with least privilege.
- Monitor `/ready`, worker heartbeat and queue depth.
- Add a shared rate limiter and an egress-restricted fetch proxy if scaling beyond a demo.
- Review retention and privacy requirements for your jurisdiction.
