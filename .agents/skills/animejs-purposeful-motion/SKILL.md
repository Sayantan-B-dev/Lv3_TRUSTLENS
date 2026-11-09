---
name: animejs-purposeful-motion
description: Use when adding or changing animations, scanning indicators, transitions or anime.js usage.
---

# Purposeful motion with anime.js

Allowed uses:

- Scan progress/radar sweep to communicate activity.
- Smooth appearance of evidence panels.
- Risk score/count transitions.
- Subtle state changes and hover feedback.

Rules:

- Motion must explain system state, not decorate empty space.
- Prefer SVG/CSS transforms; animate transform/opacity, not layout-heavy properties.
- Keep durations short (roughly 150–600 ms); avoid infinite distracting loops except a small scanning indicator while work is active.
- Respect `prefers-reduced-motion`: disable or reduce loops and large transitions.
- Clean up animations on unmount and when state ends.
- Do not fake progress; bind it to real request/job state.
- No excessive particles, glow or gradient animation.
- Keep the palette restrained (navy/charcoal/cyan/teal).

Verify in the production build and check both idle and active states. Reduced-motion behaviour should be visually checked if changed.
