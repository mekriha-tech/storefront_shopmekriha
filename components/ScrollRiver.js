import { useCallback, useEffect, useRef, useState } from "react";
import { generateWavePoints, pointsToSmoothPath, splitPointsBySection } from "./riverPath";

const CLOUD_SCALES = [1, 0.6, 1.45, 0.85, 1.15, 0.7];

const SECTION_BG = {
  home: "cream",
  about: "cream",
  produce: "cream",
  visit: "cream",
  "produce-explore": "cream",
};

const RIVER_ON_CREAM = "#005748";
const BANK_ON_CREAM = "#F3EEE5";
const RIVER_ON_GREEN = "#FAF6D9";
const BANK_ON_GREEN = "#0A6B5A";

const WAVELENGTHS_PER_SECTION = 1;
const SAMPLE_SPACING = 40; // px
const HIGHLIGHT_WIDTH_RATIO = 0.35; // fraction of river width

const CLOUD_COUNT = 6;
const ROTATION_DAMPING = 0.35; // subtler tilt for the top-down boat
const FADE_HALF_RANGE_RATIO = 0.55; // fraction of viewport height, clear zone around the boat
const FAR_SECTION_OPACITY_RATIO = 0.4; // flat dimming for sections far from the boat

const MOBILE_BREAKPOINT = "(max-width: 767px)";

// Desktop: river winds through the gutter between two-column content.
const DESKTOP_TUNING = {
  amplitudeRatio: 0.15,
  riverWidthRatio: 0.075,
  riverWidthMin: 70,
  riverWidthMax: 120,
  riverOpacity: 0.55,
  highlightOpacity: 0.4,
  boatScale: 1,
  cloudScale: 1,
};

// Mobile: single-column layout, so the river runs full-width behind
// the text. Bigger amplitude relative to width so the curve actually
// reads as curvy instead of being masked by a wide straight band.
const MOBILE_TUNING = {
  amplitudeRatio: 0.24,
  riverWidthRatio: 0.4,
  riverWidthMin: 50,
  riverWidthMax: 130,
  riverOpacity: 0.4,
  highlightOpacity: 0.28,
  boatScale: 0.65,
  cloudScale: 0.7,
};

function strokeColorFor(bg) {
  return bg === "green" ? RIVER_ON_GREEN : RIVER_ON_CREAM;
}

function bankColorFor(bg) {
  return bg === "green" ? BANK_ON_GREEN : BANK_ON_CREAM;
}

function clampRiverWidth(width, tuning) {
  return Math.max(tuning.riverWidthMin, Math.min(tuning.riverWidthMax, width * tuning.riverWidthRatio));
}

function Boat({ x, y, angle, scale }) {
  return (
    <g style={{ transform: `translate(${x}px, ${y}px) rotate(${angle}deg) scale(${scale})`, transformOrigin: "0 0" }}>
      <g className="river-boat-bob">
        {/* Outer hull rim */}
        <path
          d="M0,-24 C9,-24 13,-9 13,0 C13,11 9,24 0,24 C-9,24 -13,11 -13,0 C-13,-9 -9,-24 0,-24 Z"
          fill="#F3E3C3"
          stroke="#5C3A1E"
          strokeWidth="1"
        />
        {/* Inner planked hull */}
        <path
          d="M0,-19 C7,-19 10,-8 10,0 C10,9 7,19 0,19 C-7,19 -10,9 -10,0 C-10,-8 -7,-19 0,-19 Z"
          fill="#8B5A2B"
        />
        {/* Plank lines */}
        <line x1="-8" y1="-8" x2="8" y2="-8" stroke="#5C3A1E" strokeWidth="0.75" opacity="0.55" />
        <line x1="-9.5" y1="0" x2="9.5" y2="0" stroke="#5C3A1E" strokeWidth="0.75" opacity="0.55" />
        <line x1="-8" y1="9" x2="8" y2="9" stroke="#5C3A1E" strokeWidth="0.75" opacity="0.55" />
        {/* Seat */}
        <rect x="-5.5" y="6" width="11" height="5" rx="2" fill="#EFD9AE" stroke="#5C3A1E" strokeWidth="0.5" />
      </g>
    </g>
  );
}

function Cloud({ x, y, seed, scale }) {
  const duration = 12 + (seed % 5) * 2;
  const delay = -((seed % 4) * 3);
  return (
    <g transform={`translate(${x}, ${y}) scale(${scale})`}>
      <g className="river-cloud-drift" style={{ animationDuration: `${duration}s`, animationDelay: `${delay}s` }}>
        <ellipse cx="0" cy="-4" rx="20" ry="13" fill="#FFFFFF" opacity="0.95" />
        <ellipse cx="-18" cy="3" rx="16" ry="10" fill="#FFFDF7" opacity="0.92" />
        <ellipse cx="18" cy="3" rx="18" ry="11" fill="#FFFDF7" opacity="0.92" />
        <ellipse cx="0" cy="6" rx="24" ry="10" fill="#FFFDF7" opacity="0.92" />
      </g>
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

    const centerX = width / 2;
    const amplitude = width * tuning.amplitudeRatio;
    const wavelengths = sectionIds.length * WAVELENGTHS_PER_SECTION;
    const points = generateWavePoints(height, centerX, amplitude, wavelengths, SAMPLE_SPACING);
    const riverWidth = clampRiverWidth(width, tuning);

    const wrapperTop = wrapper.getBoundingClientRect().top + window.scrollY;
    const boundaries = sectionIds.map((id) => {
      const el = document.getElementById(id);
      if (!el) return 0;
      return el.getBoundingClientRect().top + window.scrollY - wrapperTop;
    });
    boundaries[0] = 0;

    // Each segment's centerline is rendered as a thick STROKE (not an
    // offset-polygon ribbon) so the river band stays mathematically
    // centered on the exact curve the boat travels along. `centerD`
    // is in wrapper-global coordinates (for the invisible measuring
    // path); `localD` is the same curve shifted so y=0 is that
    // section's own top, for rendering inside the section itself.
    const rawSegments = splitPointsBySection(points, boundaries);
    const segments = rawSegments.map((segPoints, i) => {
      const bg = SECTION_BG[sectionIds[i]] || "cream";
      const top = boundaries[i];
      const bottom = i + 1 < boundaries.length ? boundaries[i + 1] : height;
      const localPoints = segPoints.map((p) => ({ x: p.x, y: p.y - top }));
      return {
        centerD: pointsToSmoothPath(segPoints),
        localD: pointsToSmoothPath(localPoints),
        color: strokeColorFor(bg),
        bankColor: bankColorFor(bg),
        top,
        height: Math.max(1, bottom - top),
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

    setGeometry({ width, height, segments, centerlineD, clouds, riverWidth, tuning, sectionIndexForY });
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
      const angle = rawAngle * ROTATION_DAMPING;

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
      const fadeHalfRange = boat.viewportH * FADE_HALF_RANGE_RATIO;
      const nearBoat = boat.y + fadeHalfRange >= seg.top && boat.y - fadeHalfRange <= seg.top + seg.height;
      const localBoatY = boat.y - seg.top;
      const gradId = `riverFade-${sectionId}`;
      const maskId = `riverMask-${sectionId}`;

      return (
        <svg
          className="absolute inset-0 z-0 pointer-events-none"
          width="100%"
          height="100%"
          viewBox={`0 0 ${geometry.width} ${seg.height}`}
          preserveAspectRatio="none"
          aria-hidden="true"
        >
          {nearBoat ? (
            <>
              <defs>
                <linearGradient
                  id={gradId}
                  gradientUnits="userSpaceOnUse"
                  x1="0"
                  y1={localBoatY - fadeHalfRange}
                  x2="0"
                  y2={localBoatY + fadeHalfRange}
                >
                  <stop offset="0%" stopColor="#fff" stopOpacity="0" />
                  <stop offset="30%" stopColor="#fff" stopOpacity="1" />
                  <stop offset="70%" stopColor="#fff" stopOpacity="1" />
                  <stop offset="100%" stopColor="#fff" stopOpacity="0" />
                </linearGradient>
                <mask id={maskId}>
                  <rect x="0" y="0" width={geometry.width} height={seg.height} fill={`url(#${gradId})`} />
                </mask>
              </defs>
              <g mask={`url(#${maskId})`}>
                <path
                  d={seg.localD}
                  fill="none"
                  stroke={seg.color}
                  strokeWidth={geometry.riverWidth}
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  opacity={geometry.tuning.riverOpacity}
                />
                <path
                  d={seg.localD}
                  fill="none"
                  stroke={seg.bankColor}
                  strokeWidth={geometry.riverWidth * HIGHLIGHT_WIDTH_RATIO}
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  opacity={geometry.tuning.highlightOpacity}
                />
              </g>
            </>
          ) : (
            <g>
              <path
                d={seg.localD}
                fill="none"
                stroke={seg.color}
                strokeWidth={geometry.riverWidth}
                strokeLinecap="round"
                strokeLinejoin="round"
                opacity={geometry.tuning.riverOpacity * FAR_SECTION_OPACITY_RATIO}
              />
              <path
                d={seg.localD}
                fill="none"
                stroke={seg.bankColor}
                strokeWidth={geometry.riverWidth * HIGHLIGHT_WIDTH_RATIO}
                strokeLinecap="round"
                strokeLinejoin="round"
                opacity={geometry.tuning.highlightOpacity * FAR_SECTION_OPACITY_RATIO}
              />
            </g>
          )}

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
