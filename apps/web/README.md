# TrustLens dashboard

Next.js 16 App Router single-page client for TrustLens. The dashboard calls `/api/v1/*` on its own origin; Next.js rewrites those requests to the FastAPI service configured by `BACKEND_URL` (default `http://127.0.0.1:8000`).

```bash
# From the repository root, with the backend running:
pnpm --dir apps/web dev
```

Open http://localhost:3000. See the repository [README](../../README.md) for the full setup, tests and environment options.

```bash
pnpm --dir apps/web typecheck
pnpm --dir apps/web test
pnpm --dir apps/web build
```

All visible controls are wired to the real API. The client never assigns a risk class; it renders the server's deterministic result and evidence.
