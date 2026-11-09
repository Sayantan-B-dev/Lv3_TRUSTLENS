---
name: responsive-accessibility
description: Use when changing layout, typography, color, controls or responsive behaviour of the dashboard.
---

# Responsive and accessible UI

Targets: mobile ~360 px, tablet ~768 px, desktop ≥1280 px.

Checklist:

- No horizontal overflow; grids collapse to one column; code/digests truncate with accessible full values.
- Controls meet touch target sizing and remain usable with keyboard.
- Visible `:focus-visible` styles; buttons have discernible labels/titles.
- Text contrast is sufficient on the dark palette; do not rely on color alone for risk.
- Headings are hierarchical; panels use labelled sections.
- Motion respects `prefers-reduced-motion`.
- Loading/error/empty states are announced and readable.
- Avoid clutter: one primary action per area, restrained borders and spacing.
- Do not add marketing sections or fake metrics.

Manual check at 360 px and 1440 px. Report anything not visually verified rather than claiming it.
