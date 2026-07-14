# Scroll-Linked River Animation — Design

## Goal

Add a decorative, hand-drawn-style river illustration that winds vertically down the homepage, visually separating each section's content into left/right, with a small boat that progresses along the river as the user scrolls.

## Scope

- Homepage (`pages/index.js`) only.
- Desktop/tablet (`md` breakpoint, ≥768px) only. Not rendered on mobile.
- Purely visual/decorative — no new data, no backend changes, no new npm dependencies.

## Sections covered

The river spans the 5 existing `<section>` blocks on the homepage, in order, using their real background colors (confirmed from `pages/index.js`):

| id | Background |
|---|---|
| `home` | cream (`#FAF8F5` gradient) |
| `about` | dark green (`#005748`) |
| `produce` | cream (`#FAF8F5`) |
| `visit` | dark green (`#005748`) |
| `produce-explore` | cream (`#FAF8F5`) |

## Component

New file: `components/ScrollRiver.js`.

Mounted once in `pages/index.js`, absolutely positioned inside a new wrapping `<div className="relative">` that contains all 5 existing `<section>` elements (structural wrapper only — no visual/layout changes to the sections themselves).

### Path generation

- On mount (and on resize/content-height changes), measure the wrapper's total height and each section's `offsetTop`/`offsetHeight` via `document.getElementById(sectionId)` — boundaries come from real DOM measurement, not hardcoded percentages, so the river stays correct if section content (and therefore height) changes later.
- Generate a sine-wave centerline down the full height: `x(y) = centerX + amplitude * sin(y / height * frequency * 2π)`, oscillating roughly between 35%–65% of container width. `amplitude` and `frequency` are named constants at the top of the file for easy tuning.
- Sample the sine wave at a fixed point density (e.g. every ~40px of height) and convert the point list into a single smooth SVG path string using cubic Bezier segments (Catmull-Rom-to-Bezier conversion, a small self-contained helper function in the component — no new dependency).
- Split the single path into per-section sub-paths at the measured section boundaries so each can be styled independently, while remaining visually continuous (segments share exact start/end points).

### Rendering

- One `<svg>` absolutely positioned, `width: 100%`, `height: 100%` of the wrapper, `viewBox` matching measured pixel dimensions, `pointer-events: none`, `z-index` placed above section backgrounds but below section content (section content already has `relative z-10`/`z-20` per existing classes, so the river sits at a lower z-index, e.g. `z-[5]`).
- Each per-section `<path>` rendered with:
  - `stroke`: `#005748` (dark green) with a soft `#FAF6D9`-tinted glow/bank when the section background is cream; `#FAF6D9` (warm gold/cream) stroke when the section background is dark green.
  - `fill: none`, rounded linecap/linejoin for a hand-drawn feel, plus a subtle lower-opacity wider duplicate stroke behind it to suggest a "bank" edge.

### Boat

- Custom inline SVG boat (simple hand-drawn hull + sail shape, 2-3 flat fill colors from the site's earthy palette), defined as a small sub-component within the same file.
- Rendered in a `<g>` transformed via inline `style={{ transform: `translate(${x}px, ${y}px) rotate(${angle}deg)` }}`.
- Position/angle computed each scroll frame:
  - `scrollProgress` = clamp 0–1 of how far the wrapper has scrolled through the viewport (`(scrollY - wrapperTop + viewportHeight/2) / wrapperHeight`, clamped).
  - `point = fullPath.getPointAtLength(scrollProgress * totalLength)`
  - `angle` from the tangent: sample a second point slightly further along the path (`getPointAtLength(len + Δ)`) and compute `atan2(dy, dx)`.
- A small idle CSS keyframe animation (gentle bob + slight rotation oscillation, a few px/degrees, ~3s ease-in-out loop) layers on top of the scroll-driven transform for polish so the boat doesn't feel static between scroll events. Implemented as a nested inner element so it composes with the outer scroll transform instead of overwriting it.

### Scroll & resize handling

- Single `scroll` listener (on `window`, passive) that sets a `requestAnimationFrame`-throttled flag to recompute boat position — avoids layout thrash on high-frequency scroll events.
- `ResizeObserver` on the wrapper element recomputes path geometry and section boundaries (handles window resize, language switch changing text height, images loading in).
- All listeners registered/cleaned up in a `useEffect`, following existing component patterns in the codebase.

### Responsiveness / SSR safety

- Component checks `window.matchMedia('(min-width: 768px)')` in a `useEffect`, tracked in state, initialized `false`.
- Renders `null` until mounted client-side and the media query matches — avoids hydration mismatch and keeps mobile layout untouched (mobile sections already single-column with no room for a side-by-side river).

## Out of scope

- No changes to section content, copy, or existing layout/grid classes beyond adding the wrapping `<div>`.
- No interactivity on the boat/river (not clickable).
- No new npm dependencies (no framer-motion, no GSAP).
- No changes to `/farms`, `/products`, or other pages — homepage only.

## Testing / verification

- `npm run lint` and `npm run build` must pass.
- Manual verification in the browser preview: confirm the river renders continuously across all 5 sections with correct alternating colors, the boat's vertical position tracks scroll position smoothly, and both are absent below the `md` breakpoint (resize window to mobile width and confirm no river/boat, no layout shift, no console errors).
