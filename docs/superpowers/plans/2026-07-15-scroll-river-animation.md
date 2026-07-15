# Scroll-Linked River Animation Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Add a decorative hand-drawn river with a scroll-following boat that winds down the homepage, separating each section's content left/right.

**Architecture:** A pure-math helper module generates a sine-wave path and converts it to a smooth SVG `d` string. A `ScrollRiver` component wraps the 5 existing homepage `<section>` elements (as `children`, unmodified), measures their real DOM boundaries, renders one continuous SVG path split into per-section colored segments, and positions a small SVG boat via `getPointAtLength` driven by scroll progress.

**Tech Stack:** Next.js 16 (pages router), React 19, Tailwind v4, plain SVG + DOM APIs (`ResizeObserver`, `matchMedia`, `getPointAtLength`). No new npm dependencies.

## Global Constraints

- Homepage (`pages/index.js`) only — no changes to `/farms`, `/products`, or other pages.
- Do not modify the existing 5 `<section>` elements' content, classes, images, or backgrounds in any way — they are wrapped, not edited.
- Desktop/tablet only (`md` breakpoint, ≥768px) — renders nothing on mobile.
- No new npm dependencies.
- River/boat must not intercept clicks (`pointer-events: none`) and must render below section content, above section backgrounds.
- Section background/id mapping (from `pages/index.js`, verified in spec):
  - `home` → cream
  - `about` → dark green `#005748`
  - `produce` → cream
  - `visit` → dark green `#005748`
  - `produce-explore` → cream
- River stroke colors: `#005748` (dark green) on cream sections, `#FAF6D9` (warm cream) on dark-green sections — matches existing `--primary-green`/`--cream-accent` CSS vars in `styles/globals.css`.

---

### Task 1: Pure path-math helpers

**Files:**
- Create: `components/riverPath.js`

**Interfaces:**
- Consumes: nothing (pure functions, no DOM access).
- Produces (used by Task 2/3):
  - `generateWavePoints(height: number, centerX: number, amplitude: number, wavelengths: number, spacing?: number): {x:number,y:number}[]`
  - `pointsToSmoothPath(points: {x:number,y:number}[]): string` — SVG `d` attribute value
  - `splitPointsBySection(points: {x:number,y:number}[], boundaries: number[]): {x:number,y:number}[][]` — one point array per section, boundary-continuous

- [ ] **Step 1: Write `components/riverPath.js`**

```js
// Pure geometry helpers for the homepage scroll river.
// No DOM access here — keeps this file trivially sanity-checkable with plain `node`.

/**
 * Generate points for a vertical sine-wave centerline.
 */
export function generateWavePoints(height, centerX, amplitude, wavelengths, spacing = 40) {
  const points = [];
  const steps = Math.max(2, Math.ceil(height / spacing));
  for (let i = 0; i <= steps; i++) {
    const y = (i / steps) * height;
    const x = centerX + amplitude * Math.sin((y / height) * wavelengths * Math.PI * 2);
    points.push({ x, y });
  }
  return points;
}

/**
 * Convert an ordered list of points into a smooth SVG path `d` string
 * using Catmull-Rom-to-Bezier conversion.
 */
export function pointsToSmoothPath(points) {
  if (points.length < 2) return "";
  let d = `M ${points[0].x.toFixed(2)} ${points[0].y.toFixed(2)}`;
  for (let i = 0; i < points.length - 1; i++) {
    const p0 = points[i - 1] || points[i];
    const p1 = points[i];
    const p2 = points[i + 1];
    const p3 = points[i + 2] || p2;

    const cp1x = p1.x + (p2.x - p0.x) / 6;
    const cp1y = p1.y + (p2.y - p0.y) / 6;
    const cp2x = p2.x - (p3.x - p1.x) / 6;
    const cp2y = p2.y - (p3.y - p1.y) / 6;

    d += ` C ${cp1x.toFixed(2)} ${cp1y.toFixed(2)}, ${cp2x.toFixed(2)} ${cp2y.toFixed(2)}, ${p2.x.toFixed(2)} ${p2.y.toFixed(2)}`;
  }
  return d;
}

/**
 * Split full-path points into one array per section, using ascending
 * section start-Y boundaries (boundaries[0] must be 0). Each segment
 * after the first is prefixed with the previous segment's last point
 * so the drawn segments stay visually continuous.
 */
export function splitPointsBySection(points, boundaries) {
  const segments = boundaries.map(() => []);
  for (const point of points) {
    let segIndex = 0;
    for (let i = boundaries.length - 1; i >= 0; i--) {
      if (point.y >= boundaries[i]) {
        segIndex = i;
        break;
      }
    }
    segments[segIndex].push(point);
  }
  for (let i = 1; i < segments.length; i++) {
    const prevSeg = segments[i - 1];
    if (prevSeg.length > 0) {
      segments[i].unshift(prevSeg[prevSeg.length - 1]);
    }
  }
  return segments;
}
```

- [ ] **Step 2: Sanity-check `generateWavePoints` with plain node (no test framework needed for pure math)**

Run:
```bash
node --input-type=module -e "
function generateWavePoints(height, centerX, amplitude, wavelengths, spacing = 40) {
  const points = [];
  const steps = Math.max(2, Math.ceil(height / spacing));
  for (let i = 0; i <= steps; i++) {
    const y = (i / steps) * height;
    const x = centerX + amplitude * Math.sin((y / height) * wavelengths * Math.PI * 2);
    points.push({ x, y });
  }
  return points;
}
const pts = generateWavePoints(1000, 500, 100, 2);
console.log('count:', pts.length);
console.log('first:', JSON.stringify(pts[0]));
console.log('last:', JSON.stringify(pts[pts.length - 1]));
"
```

Expected output:
```
count: 26
first: {"x":500,"y":0}
last: {"x":500,"y":1000}
```
(`first`/`last` x equal `centerX` because `sin(0) = 0` and `sin(2 * wavelengths * PI) = 0` for integer `wavelengths`.)

- [ ] **Step 3: Sanity-check `splitPointsBySection` continuity behavior**

Run:
```bash
node --input-type=module -e "
function splitPointsBySection(points, boundaries) {
  const segments = boundaries.map(() => []);
  for (const point of points) {
    let segIndex = 0;
    for (let i = boundaries.length - 1; i >= 0; i--) {
      if (point.y >= boundaries[i]) { segIndex = i; break; }
    }
    segments[segIndex].push(point);
  }
  for (let i = 1; i < segments.length; i++) {
    const prevSeg = segments[i - 1];
    if (prevSeg.length > 0) segments[i].unshift(prevSeg[prevSeg.length - 1]);
  }
  return segments;
}
const points = Array.from({length: 11}, (_, i) => ({x: 0, y: i * 10}));
const segs = splitPointsBySection(points, [0, 50]);
console.log('seg0 length:', segs[0].length);
console.log('seg1 length:', segs[1].length);
console.log('seg1 first y (should equal seg0 last y):', segs[1][0].y, segs[0][segs[0].length-1].y);
"
```

Expected output:
```
seg0 length: 5
seg1 length: 7
seg1 first y (should equal seg0 last y): 40 40
```

- [ ] **Step 4: Commit**

```bash
git add components/riverPath.js
git commit -m "Add pure path-math helpers for scroll river"
```

---

### Task 2: ScrollRiver component — static rendering

**Files:**
- Create: `components/ScrollRiver.js`
- Modify: `styles/globals.css` (append boat idle-bob keyframes at the end, no changes to existing rules)

**Interfaces:**
- Consumes: `generateWavePoints`, `pointsToSmoothPath`, `splitPointsBySection` from `components/riverPath.js` (Task 1).
- Produces (used by Task 3 and Task 4):
  - `export default function ScrollRiver({ sectionIds: string[], children })` — React component. `sectionIds` must be the `id` values of the direct-child `<section>` elements passed as `children`, in top-to-bottom order.

- [ ] **Step 1: Append boat idle-bob keyframes to `styles/globals.css`**

Add at the end of the file (after the existing `.animate-slide-down` rule, keep the trailing blank lines as-is):

```css
/* Idle bob for the scroll-river boat (components/ScrollRiver.js) */
@keyframes riverBoatBob {
  0%, 100% {
    transform: translateY(0px) rotate(0deg);
  }
  50% {
    transform: translateY(-2px) rotate(2deg);
  }
}

.river-boat-bob {
  animation: riverBoatBob 3s ease-in-out infinite;
  transform-origin: center;
}
```

- [ ] **Step 2: Write `components/ScrollRiver.js` (static version — boat fixed at path start, no scroll wiring yet)**

```jsx
import { useCallback, useEffect, useRef, useState } from "react";
import { generateWavePoints, pointsToSmoothPath, splitPointsBySection } from "./riverPath";

const SECTION_BG = {
  home: "cream",
  about: "green",
  produce: "cream",
  visit: "green",
  "produce-explore": "cream",
};

const RIVER_ON_CREAM = "#005748";
const BANK_ON_CREAM = "#F3EEE5";
const RIVER_ON_GREEN = "#FAF6D9";
const BANK_ON_GREEN = "#0A6B5A";

const AMPLITUDE_RATIO = 0.15; // fraction of container width
const WAVELENGTHS_PER_SECTION = 1;
const SAMPLE_SPACING = 40; // px

function strokeColorFor(bg) {
  return bg === "green" ? RIVER_ON_GREEN : RIVER_ON_CREAM;
}

function bankColorFor(bg) {
  return bg === "green" ? BANK_ON_GREEN : BANK_ON_CREAM;
}

function Boat({ x, y, angle }) {
  return (
    <g style={{ transform: `translate(${x}px, ${y}px) rotate(${angle}deg)`, transformOrigin: "0 0" }}>
      <g className="river-boat-bob">
        <path d="M -14 4 L 14 4 L 9 12 L -9 12 Z" fill="#8B5A2B" stroke="#5C3A1E" strokeWidth="1" />
        <path d="M 0 4 L 0 -14" stroke="#5C3A1E" strokeWidth="1.5" />
        <path d="M 0 -14 L 10 -3 L 0 -3 Z" fill="#FAF6D9" stroke="#5C3A1E" strokeWidth="1" />
      </g>
    </g>
  );
}

export default function ScrollRiver({ sectionIds, children }) {
  const wrapperRef = useRef(null);
  const svgPathRef = useRef(null);
  const [isDesktop, setIsDesktop] = useState(false);
  const [geometry, setGeometry] = useState(null);
  const [boat, setBoat] = useState({ x: 0, y: 0, angle: 0 });

  useEffect(() => {
    const mql = window.matchMedia("(min-width: 768px)");
    const update = () => setIsDesktop(mql.matches);
    update();
    mql.addEventListener("change", update);
    return () => mql.removeEventListener("change", update);
  }, []);

  const measure = useCallback(() => {
    const wrapper = wrapperRef.current;
    if (!wrapper) return;

    const width = wrapper.offsetWidth;
    const height = wrapper.offsetHeight;
    if (!width || !height) return;

    const centerX = width / 2;
    const amplitude = width * AMPLITUDE_RATIO;
    const wavelengths = sectionIds.length * WAVELENGTHS_PER_SECTION;
    const points = generateWavePoints(height, centerX, amplitude, wavelengths, SAMPLE_SPACING);

    const wrapperTop = wrapper.getBoundingClientRect().top + window.scrollY;
    const boundaries = sectionIds.map((id) => {
      const el = document.getElementById(id);
      if (!el) return 0;
      return el.getBoundingClientRect().top + window.scrollY - wrapperTop;
    });
    boundaries[0] = 0;

    const segments = splitPointsBySection(points, boundaries).map((segPoints, i) => {
      const bg = SECTION_BG[sectionIds[i]] || "cream";
      return {
        d: pointsToSmoothPath(segPoints),
        color: strokeColorFor(bg),
        bankColor: bankColorFor(bg),
      };
    });

    setGeometry({ width, height, points, segments });
  }, [sectionIds]);

  useEffect(() => {
    if (!isDesktop) return undefined;
    measure();

    const ro = new ResizeObserver(() => measure());
    if (wrapperRef.current) ro.observe(wrapperRef.current);
    window.addEventListener("resize", measure);

    return () => {
      ro.disconnect();
      window.removeEventListener("resize", measure);
    };
  }, [isDesktop, measure]);

  useEffect(() => {
    if (!geometry || !geometry.points.length) return;
    const first = geometry.points[0];
    setBoat({ x: first.x, y: first.y, angle: 0 });
  }, [geometry]);

  return (
    <div ref={wrapperRef} className="relative">
      {isDesktop && geometry && (
        <svg
          className="absolute inset-0 z-0 pointer-events-none"
          width="100%"
          height="100%"
          viewBox={`0 0 ${geometry.width} ${geometry.height}`}
          preserveAspectRatio="none"
          aria-hidden="true"
        >
          {geometry.segments.map((seg, i) => (
            <g key={i}>
              <path d={seg.d} fill="none" stroke={seg.bankColor} strokeWidth="14" strokeLinecap="round" strokeLinejoin="round" opacity="0.5" />
              <path d={seg.d} fill="none" stroke={seg.color} strokeWidth="6" strokeLinecap="round" strokeLinejoin="round" opacity="0.85" />
            </g>
          ))}
          <path ref={svgPathRef} d={pointsToSmoothPath(geometry.points)} fill="none" stroke="none" />
          <Boat x={boat.x} y={boat.y} angle={boat.angle} />
        </svg>
      )}
      {children}
    </div>
  );
}
```

Note: the SVG is rendered as the **first** child of the wrapper, before `{children}`. All 5 `<section>` elements use `position: relative` (some with explicit `z-20`, others `z-index: auto`); the river `<svg>` uses `position: absolute` with no explicit `z-index` conflict (`z-0`). Per CSS stacking rules, among positioned siblings with equal/auto z-index, later DOM order paints on top — so the sections (which come after the svg in the DOM) always paint above the river automatically, with zero changes needed to any section's classes.

- [ ] **Step 3: Verify the build compiles with the new files**

Run:
```bash
npm run build
```
Expected: `✓ Compiled successfully` (component isn't wired into any page yet, so this only checks the new files have no syntax/type errors — Next.js compiles all files under `components/`).

- [ ] **Step 4: Commit**

```bash
git add components/ScrollRiver.js styles/globals.css
git commit -m "Add ScrollRiver component with static path/boat rendering"
```

---

### Task 3: Scroll-driven boat position

**Files:**
- Modify: `components/ScrollRiver.js`

**Interfaces:**
- Consumes: `svgPathRef`, `geometry`, `isDesktop` state already defined in Task 2.
- Produces: no new exports — internal behavior change only (boat now tracks scroll position instead of staying fixed at the path start).

- [ ] **Step 1: Replace the static-boat `useEffect` from Task 2 with a scroll-driven one**

In `components/ScrollRiver.js`, replace this block from Task 2:

```jsx
  useEffect(() => {
    if (!geometry || !geometry.points.length) return;
    const first = geometry.points[0];
    setBoat({ x: first.x, y: first.y, angle: 0 });
  }, [geometry]);
```

with:

```jsx
  useEffect(() => {
    if (!isDesktop || !geometry) return undefined;

    let ticking = false;

    const updateBoat = () => {
      ticking = false;
      const wrapper = wrapperRef.current;
      const pathEl = svgPathRef.current;
      if (!wrapper || !pathEl) return;

      const rect = wrapper.getBoundingClientRect();
      const viewportH = window.innerHeight;
      const raw = (viewportH / 2 - rect.top) / geometry.height;
      const progress = Math.min(1, Math.max(0, raw));

      const totalLength = pathEl.getTotalLength();
      const point = pathEl.getPointAtLength(progress * totalLength);
      const ahead = pathEl.getPointAtLength(Math.min(totalLength, progress * totalLength + 1));
      const angle = (Math.atan2(ahead.y - point.y, ahead.x - point.x) * 180) / Math.PI;

      setBoat({ x: point.x, y: point.y, angle });
    };

    const onScroll = () => {
      if (!ticking) {
        ticking = true;
        requestAnimationFrame(updateBoat);
      }
    };

    updateBoat();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, [isDesktop, geometry]);
```

- [ ] **Step 2: Run build to confirm no syntax errors**

Run:
```bash
npm run build
```
Expected: `✓ Compiled successfully`

- [ ] **Step 3: Commit**

```bash
git add components/ScrollRiver.js
git commit -m "Drive river boat position/rotation from scroll progress"
```

---

### Task 4: Integrate into the homepage

**Files:**
- Modify: `pages/index.js`

**Interfaces:**
- Consumes: `ScrollRiver` default export from `components/ScrollRiver.js` (Task 2/3).
- Produces: nothing further downstream — this is the final integration task.

- [ ] **Step 1: Import `ScrollRiver` in `pages/index.js`**

Add near the top with the other imports (after the `Cal_Sans` import block, before `defaultTranslations`):

```js
import ScrollRiver from "../components/ScrollRiver";
```

- [ ] **Step 2: Wrap the 5 existing `<section>` elements with `<ScrollRiver>`**

In `pages/index.js`, the hero section starts right after the `</header>` closing tag with the comment `{/* Hero Section */}` (around line 376), and the last section (`produce-explore`) closes right before the comment `{/* Expanded Premium Footer */}` (around line 774). Insert the opening tag immediately after `</header>` and the closing tag immediately before `{/* Expanded Premium Footer */}`, wrapping all 5 sections and their in-between comments — **do not change anything inside the sections themselves**:

```jsx
        </header>

        <ScrollRiver sectionIds={["home", "about", "produce", "visit", "produce-explore"]}>
          {/* Hero Section */}
          <section id="home" className="relative overflow-hidden min-h-[82vh] bg-gradient-to-br from-[#FAF8F5] via-[#FAF8F5] to-[#F3EEE5] flex items-center">
            {/* ...unchanged existing content... */}
          </section>

          {/* Section 2: Growing Stronger, Together */}
          <section id="about" className="relative overflow-hidden min-h-[82vh] border-t border-gray-100 bg-[#005748] text-[#FAF6D9] flex items-center">
            {/* ...unchanged existing content... */}
          </section>

          {/* Section 3: Know Your Crop Journey */}
          <section id="produce" className="bg-[#FAF8F5] py-20 md:py-28 border-t border-gray-100 relative z-20">
            {/* ...unchanged existing content... */}
          </section>

          {/* Section 4: Visit the Farm */}
          <section id="visit" className="relative overflow-hidden min-h-[80vh] bg-[#005748] text-[#FAF6D9] flex items-center py-20 md:py-28 border-t border-gray-100">
            {/* ...unchanged existing content... */}
          </section>

          {/* Section 5: Explore Our Produce */}
          <section id="produce-explore" className="bg-[#FAF8F5] py-20 md:py-28 border-t border-gray-100 relative z-20">
            {/* ...unchanged existing content... */}
          </section>
        </ScrollRiver>

        {/* Expanded Premium Footer */}
```

(The `{/* ...unchanged existing content... */}` placeholders above represent the actual, already-existing JSX inside each section — do not delete or rewrite it, only add the two `ScrollRiver` wrapper lines around the whole group.)

- [ ] **Step 3: Run lint and build**

Run:
```bash
npm run lint
npm run build
```
Expected: both succeed with no errors (the pre-existing "Cal Sans font fallback" warning is expected and unrelated).

- [ ] **Step 4: Manually verify in the browser**

Start the dev server (`npm run dev` or via the project's preview tooling) and check:
1. At a desktop width (≥768px): the river renders continuously from the hero section down through the footer boundary, with dark-green stroke on cream sections and cream stroke on the dark-green (`about`, `visit`) sections.
2. Scroll the page top to bottom: the boat moves smoothly down the river and its heading follows the curve; no console errors.
3. Resize to a mobile width (<768px): river and boat are both absent, and the mobile layout (single-column sections, existing images/backgrounds) is pixel-identical to before this change — no layout shift.
4. Confirm no existing section's background color, image, or text changed.

- [ ] **Step 5: Commit**

```bash
git add pages/index.js
git commit -m "Wrap homepage sections with scroll-linked river animation"
```
