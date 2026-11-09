---
name: nextjs-dashboard-patterns
description: Use when editing the TrustLens dashboard, API client, polling, history or report controls.
---

# Next.js dashboard patterns

Key files: `components/Dashboard.tsx`, `lib/api.ts`, `lib/types.ts`, panel components.

Rules:

- `Dashboard.tsx` owns shared state and actions; panels are presentational and receive typed props.
- Every visible button must call the real API or perform a real local action. No placeholders, fake toggles or decorative controls.
- Never assign a risk class client-side; render the server's classification.
- Use `/api/v1` relative URLs; Next rewrites to `BACKEND_URL` so cookies stay first-party.
- Handle loading, empty, error and degraded states explicitly. Show API error messages from the `{error:{message}}` envelope.
- Poll only while an investigation is active; stop on completion/failure/unmount.
- Keep accessibility: labels, `aria-*`, focus styles, keyboard activation.
- Keep TypeScript strict and sync shared types with backend serialisers.
- Avoid adding state libraries; small hooks/effects are sufficient.

Verify: `pnpm --dir apps/web typecheck && pnpm --dir apps/web test && pnpm --dir apps/web build`.
