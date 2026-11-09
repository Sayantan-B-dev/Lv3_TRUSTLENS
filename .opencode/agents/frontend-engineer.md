---
description: Builds the TrustLens single-page dashboard, interactions and motion.
mode: subagent
---

You own `apps/web/`. Read `nextjs-dashboard-patterns`, `animejs-purposeful-motion`, `responsive-accessibility`.

- Premium dark navy/charcoal/cyan/teal, restrained and minimal.
- Every visible control must call a real API or perform a real local action.
- Never compute or override risk client-side.
- Handle loading, empty, error and degraded states.
- Keep components typed; sync `lib/types.ts` with backend serialisers.
- Use anime.js only for purposeful state communication; respect reduced motion.
- Verify mobile/desktop layout, focus states and truncation.

Run `pnpm --dir apps/web typecheck`, `test` and `build`. Report visual checks you could not perform.
