import { useCallback, useEffect, useRef, useState } from "react";
import { generateWavePoints, pointsToSmoothPath, splitPointsBySection } from "./riverPath";

const CLOUD_SCALES = [1, 1.8, 0.6, 1.45, 2, 0.85, 1.15, 0.7, 1.6];
// Every third cloud (by seed) uses the grey palette instead of white, for variety.
const CLOUD_COLORS_WHITE = ["#FFFFFF", "#FFFDF7", "#FFFDF7", "#FFFDF7"];
const CLOUD_COLORS_GREY = ["#DDE2E2", "#CBD1D1", "#CBD1D1", "#CBD1D1"];

// ---------------------------------------------------------------------
// TRANSPARENCY — adjust these two to fade the river or the boat in/out.
// Both are plain 0 (invisible) to 1 (fully opaque) values.
const RIVER_OPACITY = 0.6;
const BOAT_OPACITY = 1;
// ---------------------------------------------------------------------

// Gradient stops for the water fill, giving the river some tonal
// variance down its length instead of one flat color. Kept within the
// #14bca6 teal-green family.
const RIVER_WATER_GRADIENT_STOPS = ["#0E8F7D", "#14BCA6", "#0B7566", "#3ED9C0"];
const RIVER_HIGHLIGHT_COLOR = "#CFF5EC";
const RIVER_HIGHLIGHT_OPACITY = 0.4;
const HIGHLIGHT_WIDTH_RATIO = 0.35; // fraction of river width
const RIVER_LABEL = "BRAHMAPUTRA RIVER";
const RIVER_LABEL_COLOR = "#111111";
// const RIVER_LABEL_OUTLINE_COLOR = "#FFFFFF";
const RIVER_LABEL_OUTLINE_COLOR = "";

const RIPPLE_SAMPLE_STRIDE = 3; // draw a ripple mark every Nth wave sample
const RIPPLE_COLOR = "#EAFBF7";

const WAVELENGTHS_PER_SECTION = 1;
const SAMPLE_SPACING = 40; // px

const CLOUD_COUNT = 15;
// boat.svg's nose points "up" (north) at rest; the tangent angle returned
// by atan2 is measured from due east, so it needs a +90deg correction to
// align the nose with the direction of travel.
const BOAT_HEADING_OFFSET = 90;
const BOAT_ART_SCALE = 0.55; // shrink boat.svg's 80x140 viewBox down

// Below this, sections stack as one full-width column (river runs wide
// behind the text). At and above it — including the "tablet" range below
// Tailwind's md breakpoint — content splits into two columns flanking a
// narrower gutter river, so this must line up with the pages/index.js
// breakpoint that introduces that split (currently `min-[600px]:`).
const MOBILE_BREAKPOINT = "(max-width: 599px)";

// Desktop: river winds through the gutter between two-column content.
// Kept narrow enough that its swing stays inside the middle grid columns
// the two-column sections leave clear (see pages/index.js's "about" and
// "visit" sections), instead of sweeping into the text/card columns.
const DESKTOP_TUNING = {
  amplitudeRatio: 0.12,
  riverWidthRatio: 0.075,
  riverWidthMin: 70,
  riverWidthMax: 120,
  boatScale: 1,
  cloudScale: 1,
};

// Mobile: single-column layout, so the river runs behind the text rather
// than in a dedicated gutter. Kept narrow (unlike the old wide full-width
// band) so it reads as a slim decorative ribbon instead of overwhelming
// the text; amplitude stays fairly big relative to that narrow width so
// the curve still reads as curvy.
const MOBILE_TUNING = {
  amplitudeRatio: 0.24,
  riverWidthRatio: 0.16,
  riverWidthMin: 30,
  riverWidthMax: 60,
  boatScale: 0.65,
  cloudScale: 0.7,
};

function clampRiverWidth(width, tuning) {
  return Math.max(tuning.riverWidthMin, Math.min(tuning.riverWidthMax, width * tuning.riverWidthRatio));
}

const BOAT_WIDTH = 80 * BOAT_ART_SCALE;
const BOAT_HEIGHT = 140 * BOAT_ART_SCALE;

function Boat({ x, y, angle, scale }) {
  return (
    <g style={{ transform: `translate(${x}px, ${y}px)`, transformOrigin: "0 0" }} opacity={BOAT_OPACITY}>
      {/* Unrotated so the wake ripples stay level with the water regardless of
          boat heading. Pure CSS loop, so it keeps rippling even while the
          boat is stationary between scrolls, not just while moving. */}
      <g className="river-boat-wake" style={{ transform: `scale(${scale})`, transformOrigin: "0 0" }}>
        <path d="M -22 -5 Q -13 -11 -4 -5" fill="none" stroke={RIPPLE_COLOR} strokeWidth="2.4" strokeLinecap="round" />
        <path d="M 6 5 Q 16 -2 26 5" fill="none" stroke={RIPPLE_COLOR} strokeWidth="2.4" strokeLinecap="round" />
        <path d="M -10 15 Q -1 9 8 15" fill="none" stroke={RIPPLE_COLOR} strokeWidth="2.4" strokeLinecap="round" />
        <path d="M -26 8 Q -18 3 -10 8" fill="none" stroke={RIPPLE_COLOR} strokeWidth="2" strokeLinecap="round" />
        <path d="M 12 -8 Q 19 -13 26 -8" fill="none" stroke={RIPPLE_COLOR} strokeWidth="2" strokeLinecap="round" />
      </g>
      <g style={{ transform: `rotate(${angle}deg) scale(${scale})`, transformOrigin: "0 0" }}>
        <g className="river-boat-bob">
          <image
            href="/boat.svg"
            x={-BOAT_WIDTH / 2}
            y={-BOAT_HEIGHT / 2}
            width={BOAT_WIDTH}
            height={BOAT_HEIGHT}
          />
        </g>
      </g>
    </g>
  );
}

function Cloud({ x, y, seed, scale }) {
  const duration = 12 + (seed % 5) * 2;
  const delay = -((seed % 4) * 3);
  const [c0, c1, c2, c3] = seed % 3 === 0 ? CLOUD_COLORS_GREY : CLOUD_COLORS_WHITE;
  return (
    <g transform={`translate(${x}, ${y}) scale(${scale})`}>
      <g className="river-cloud-drift" style={{ animationDuration: `${duration}s`, animationDelay: `${delay}s` }}>
        <ellipse cx="0" cy="-4" rx="20" ry="13" fill={c0} opacity="0.95" />
        <ellipse cx="-18" cy="3" rx="16" ry="10" fill={c1} opacity="0.92" />
        <ellipse cx="18" cy="3" rx="18" ry="11" fill={c2} opacity="0.92" />
        <ellipse cx="0" cy="6" rx="24" ry="10" fill={c3} opacity="0.92" />
      </g>
    </g>
  );
}

// A short curved dash suggesting a ripple crossing the water, rotated to
// the local flow direction of the wave it's placed on.
function RippleMark({ x, y, angle, width }) {
  const len = width * 0.9;
  return (
    <g transform={`translate(${x}, ${y}) rotate(${angle})`}>
      <path
        d={`M ${-len / 2} 0 Q 0 ${-len * 0.22} ${len / 2} 0`}
        fill="none"
        stroke={RIPPLE_COLOR}
        strokeWidth={Math.max(1.5, width * 0.05)}
        strokeLinecap="round"
        opacity="0.5"
      />
    </g>
  );
}

/**
 * ScrollRiver wraps homepage sections and gives each one a small,
 * section-scoped river/boat/cloud layer to render as the FIRST child
 * inside itself (so it paints behind that section's own text/icons,
 * which must be given `relative z-10` or higher to win the stacking
 * order). `children` is a render-prop: `(renderLayer) => ReactNode`,
 * where `renderLayer(sectionId)` returns that section's layer.
 *
 * A single continuous (invisible) path spanning the whole wrapper is
 * still used to drive the boat via getPointAtLength, so its motion
 * stays smooth across section boundaries even though each section
 * only renders its own local slice of the river.
 */
export default function ScrollRiver({ sectionIds, children }) {
  const wrapperRef = useRef(null);
  const svgPathRef = useRef(null);
  const [isMobile, setIsMobile] = useState(false);
  const [geometry, setGeometry] = useState(null);
  const [boat, setBoat] = useState({ x: 0, y: 0, angle: 0, viewportH: 900, sectionIndex: 0 });

  useEffect(() => {
    const mql = window.matchMedia(MOBILE_BREAKPOINT);
    const update = () => setIsMobile(mql.matches);
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

    const tuning = isMobile ? MOBILE_TUNING : DESKTOP_TUNING;

    const wrapperTop = wrapper.getBoundingClientRect().top + window.scrollY;
    const boundaries = sectionIds.map((id) => {
      const el = document.getElementById(id);
      if (!el) return 0;
      return el.getBoundingClientRect().top + window.scrollY - wrapperTop;
    });
    boundaries[0] = 0;

    const centerX = width / 2;
    const amplitude = width * tuning.amplitudeRatio;
    const wavelengths = sectionIds.length * WAVELENGTHS_PER_SECTION;
    // Force an exact sample at every internal section boundary so each
    // section's independently-smoothed local curve starts/ends precisely
    // at its own edge instead of falling short and creating a seam.
    const points = generateWavePoints(height, centerX, amplitude, wavelengths, SAMPLE_SPACING, boundaries.slice(1));
    const riverWidth = clampRiverWidth(width, tuning);

    // Each segment's centerline is rendered as a thick STROKE (not an
    // offset-polygon ribbon) so the river band stays mathematically
    // centered on the exact curve the boat travels along. `centerD`
    // is in wrapper-global coordinates (for the invisible measuring
    // path); `localD` is the same curve shifted so y=0 is that
    // section's own top, for rendering inside the section itself.
    const rawSegments = splitPointsBySection(points, boundaries);
    // How far past each section's own edge to keep drawing the visible
    // stroke. Without this, the path's round line-cap lands exactly on
    // the section's clip edge and gets flattened into a visible straight
    // "cut" across the river instead of continuing into the next section
    // (which is drawing its own overdraw over the same spot).
    const overdrawMargin = riverWidth;
    const segments = rawSegments.map((segPoints, i) => {
      const top = boundaries[i];
      const bottom = i + 1 < boundaries.length ? boundaries[i + 1] : height;

      const prevSeg = i > 0 ? rawSegments[i - 1] : null;
      const nextSeg = i + 1 < rawSegments.length ? rawSegments[i + 1] : null;
      const leadIn = prevSeg ? prevSeg.filter((p) => p.y < top && p.y >= top - overdrawMargin) : [];
      const trailOut = nextSeg ? nextSeg.filter((p) => p.y > bottom && p.y <= bottom + overdrawMargin) : [];
      const overdrawPoints = [...leadIn, ...segPoints, ...trailOut];
      const localPoints = overdrawPoints.map((p) => ({ x: p.x, y: p.y - top }));

      // Place the river-name label near a peak/trough of the wave (where
      // the curve runs closest to straight down) rather than blindly at
      // the segment's midpoint — a zero-crossing has the steepest sideways
      // tangent and makes the label read crooked or backwards. Biased
      // toward the lower half of the segment, but not right at the very
      // bottom — too close to the edge and it gets clipped/lost at the
      // seam between sections.
      let labelIndex = Math.floor(segPoints.length * 0.6);
      if (segPoints.length > 4) {
        const lo = Math.floor(segPoints.length * 0.45);
        const hi = Math.ceil(segPoints.length * 0.7);
        let flattest = Infinity;
        for (let p = lo; p < hi; p++) {
          const prev = segPoints[p - 1] || segPoints[p];
          const next = segPoints[p + 1] || segPoints[p];
          const dx = Math.abs(next.x - prev.x);
          if (dx < flattest) {
            flattest = dx;
            labelIndex = p;
          }
        }
      }
      const labelOffsetPercent = segPoints.length > 1 ? (labelIndex / (segPoints.length - 1)) * 100 : 50;

      return {
        centerD: pointsToSmoothPath(segPoints),
        localD: pointsToSmoothPath(localPoints),
        top,
        height: Math.max(1, bottom - top),
        labelOffsetPercent,
      };
    });

    const centerlineD = segments.map((seg) => seg.centerD).join(" ");

    const sectionIndexForY = (y) => {
      let idx = 0;
      for (let s = 0; s < segments.length; s++) {
        if (y >= segments[s].top) idx = s;
      }
      return idx;
    };

    const cloudCount = Math.min(CLOUD_COUNT, points.length);
    const clouds = Array.from({ length: cloudCount }, (_, i) => {
      const idx = Math.round(((i + 1) / (cloudCount + 1)) * (points.length - 1));
      const point = points[idx];
      const side = i % 2 === 0 ? 1 : -1;
      const y = point.y;
      const sectionIndex = sectionIndexForY(y);
      return {
        x: point.x + side * riverWidth * 0.4,
        y,
        localY: y - segments[sectionIndex].top,
        sectionIndex,
        scale: CLOUD_SCALES[i % CLOUD_SCALES.length] * tuning.cloudScale,
      };
    });

    const ripples = [];
    for (let i = 1; i < points.length - 1; i += RIPPLE_SAMPLE_STRIDE) {
      const point = points[i];
      const prev = points[i - 1];
      const next = points[i + 1];
      const angle = (Math.atan2(next.y - prev.y, next.x - prev.x) * 180) / Math.PI;
      const sectionIndex = sectionIndexForY(point.y);
      const side = Math.floor(i / RIPPLE_SAMPLE_STRIDE) % 2 === 0 ? 1 : -1;
      ripples.push({
        x: point.x + side * riverWidth * 0.18,
        localY: point.y - segments[sectionIndex].top,
        angle,
        sectionIndex,
      });
    }

    setGeometry({ width, height, segments, centerlineD, clouds, ripples, riverWidth, tuning, sectionIndexForY });
  }, [sectionIds, isMobile]);

  useEffect(() => {
    measure();

    const ro = new ResizeObserver(() => measure());
    if (wrapperRef.current) ro.observe(wrapperRef.current);
    window.addEventListener("resize", measure);

    return () => {
      ro.disconnect();
      window.removeEventListener("resize", measure);
    };
  }, [measure]);

  useEffect(() => {
    if (!geometry) return undefined;

    let ticking = false;

    const updateBoat = () => {
      ticking = false;
      const wrapper = wrapperRef.current;
      const pathEl = svgPathRef.current;
      if (!wrapper || !pathEl) return;

      const rect = wrapper.getBoundingClientRect();
      const viewportH = window.innerHeight;
      const totalHeight = geometry.segments.reduce((sum, seg) => sum + seg.height, 0);
      const raw = (viewportH / 2 - rect.top) / totalHeight;
      const progress = Math.min(1, Math.max(0, raw));

      const totalLength = pathEl.getTotalLength();
      const point = pathEl.getPointAtLength(progress * totalLength);
      const ahead = pathEl.getPointAtLength(Math.min(totalLength, progress * totalLength + 1));
      const rawAngle = (Math.atan2(ahead.y - point.y, ahead.x - point.x) * 180) / Math.PI;
      const angle = rawAngle + BOAT_HEADING_OFFSET;

      setBoat({ x: point.x, y: point.y, angle, viewportH, sectionIndex: geometry.sectionIndexForY(point.y) });
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
  }, [geometry]);

  const renderLayer = useCallback(
    (sectionId) => {
      if (!geometry) return null;
      const idx = sectionIds.indexOf(sectionId);
      if (idx === -1) return null;

      const seg = geometry.segments[idx];
      const localBoatY = boat.y - seg.top;
      const pathId = `riverCenterline-${sectionId}`;
      const gradientId = `riverWater-${sectionId}`;

      return (
        <svg
          className="absolute inset-0 z-0 pointer-events-none"
          width="100%"
          height="100%"
          viewBox={`0 0 ${geometry.width} ${seg.height}`}
          preserveAspectRatio="none"
          aria-hidden="true"
        >
          <defs>
            {/* y1/y2 are offset by this section's own top so every section
                samples the same conceptual gradient spanning the full page
                height — otherwise each section's gradient restarts from
                0%, creating a visible color jump at every seam. */}
            <linearGradient
              id={gradientId}
              gradientUnits="userSpaceOnUse"
              x1="0"
              y1={-seg.top}
              x2="0"
              y2={geometry.height - seg.top}
            >
              {RIVER_WATER_GRADIENT_STOPS.map((color, i) => (
                <stop key={color} offset={`${(i / (RIVER_WATER_GRADIENT_STOPS.length - 1)) * 100}%`} stopColor={color} />
              ))}
            </linearGradient>
          </defs>
          <path
            id={pathId}
            d={seg.localD}
            fill="none"
            stroke={`url(#${gradientId})`}
            strokeWidth={geometry.riverWidth}
            strokeLinecap="round"
            strokeLinejoin="round"
            opacity={RIVER_OPACITY}
          />
          <path
            d={seg.localD}
            fill="none"
            stroke={RIVER_HIGHLIGHT_COLOR}
            strokeWidth={geometry.riverWidth * HIGHLIGHT_WIDTH_RATIO}
            strokeLinecap="round"
            strokeLinejoin="round"
            opacity={RIVER_HIGHLIGHT_OPACITY}
          />

          {geometry.ripples
            .filter((ripple) => ripple.sectionIndex === idx)
            .map((ripple, i) => (
              <RippleMark key={i} x={ripple.x} y={ripple.localY} angle={ripple.angle} width={geometry.riverWidth} />
            ))}

          <text
            fontSize={geometry.riverWidth * 0.1}
            fontWeight="700"
            letterSpacing="1"
            fill={RIVER_LABEL_COLOR}
            stroke={RIVER_LABEL_OUTLINE_COLOR}
            strokeWidth={geometry.riverWidth * 0.015}
            paintOrder="stroke"
            opacity={0.5}
          >
            <textPath href={`#${pathId}`} startOffset={`${seg.labelOffsetPercent}%`} textAnchor="middle">
              {/* dy on a nested tspan (rather than the textPath itself) is what
                  reliably shifts text off the centerline in Chromium — this
                  moves the label toward the right bank instead of dead center. */}
              <tspan dy={-geometry.riverWidth * 0.22}>{RIVER_LABEL}</tspan>
            </textPath>
          </text>

          {boat.sectionIndex === idx && (
            <Boat x={boat.x} y={localBoatY} angle={boat.angle} scale={geometry.tuning.boatScale} />
          )}

          {geometry.clouds
            .filter((cloud) => cloud.sectionIndex === idx)
            .map((cloud, i) => (
              <Cloud key={i} x={cloud.x} y={cloud.localY} seed={idx * 10 + i} scale={cloud.scale} />
            ))}
        </svg>
      );
    },
    [geometry, boat, sectionIds]
  );

  return (
    <div ref={wrapperRef} className="relative">
      {geometry && (
        <svg
          className="absolute inset-0 pointer-events-none opacity-0"
          width="100%"
          height="100%"
          viewBox={`0 0 ${geometry.width} ${geometry.segments.reduce((sum, seg) => sum + seg.height, 0)}`}
          preserveAspectRatio="none"
          aria-hidden="true"
        >
          <path ref={svgPathRef} d={geometry.centerlineD} fill="none" stroke="none" />
        </svg>
      )}
      {typeof children === "function" ? children(renderLayer) : children}
    </div>
  );
}
