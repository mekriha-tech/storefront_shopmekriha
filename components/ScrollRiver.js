import { useCallback, useEffect, useRef, useState } from "react";
import { generateWavePoints, pointsToSmoothPath, splitPointsBySection } from "./riverPath";

const CLOUD_SCALES = [1, 0.6, 1.45, 0.85, 1.15, 0.7];

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

const RIVER_WIDTH_RATIO = 0.075; // fraction of container width
const RIVER_WIDTH_MIN = 70;
const RIVER_WIDTH_MAX = 120;
const HIGHLIGHT_WIDTH_RATIO = 0.35; // fraction of river width

const CLOUD_COUNT = 6;
const ROTATION_DAMPING = 0.35; // subtler tilt for the top-down boat
const FADE_HALF_RANGE_RATIO = 0.55; // fraction of viewport height, clear zone around the boat

function strokeColorFor(bg) {
  return bg === "green" ? RIVER_ON_GREEN : RIVER_ON_CREAM;
}

function bankColorFor(bg) {
  return bg === "green" ? BANK_ON_GREEN : BANK_ON_CREAM;
}

function clampRiverWidth(width) {
  return Math.max(RIVER_WIDTH_MIN, Math.min(RIVER_WIDTH_MAX, width * RIVER_WIDTH_RATIO));
}

function Boat({ x, y, angle }) {
  return (
    <g style={{ transform: `translate(${x}px, ${y}px) rotate(${angle}deg)`, transformOrigin: "0 0" }}>
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

export default function ScrollRiver({ sectionIds, children }) {
  const wrapperRef = useRef(null);
  const svgPathRef = useRef(null);
  const [isDesktop, setIsDesktop] = useState(false);
  const [geometry, setGeometry] = useState(null);
  const [boat, setBoat] = useState({ x: 0, y: 0, angle: 0, viewportH: 900 });

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
    const riverWidth = clampRiverWidth(width);

    const wrapperTop = wrapper.getBoundingClientRect().top + window.scrollY;
    const boundaries = sectionIds.map((id) => {
      const el = document.getElementById(id);
      if (!el) return 0;
      return el.getBoundingClientRect().top + window.scrollY - wrapperTop;
    });
    boundaries[0] = 0;

    // Each segment's centerline is rendered directly as a thick STROKE
    // (not an offset-polygon ribbon) so the river band is mathematically
    // guaranteed to stay centered on the exact same curve the boat's
    // getPointAtLength() travels along - no separate offset/smoothing
    // math that could drift apart from the boat's path near curve peaks.
    const segments = splitPointsBySection(points, boundaries).map((segPoints, i) => {
      const bg = SECTION_BG[sectionIds[i]] || "cream";
      return {
        centerD: pointsToSmoothPath(segPoints),
        color: strokeColorFor(bg),
        bankColor: bankColorFor(bg),
      };
    });

    const centerlineD = segments.map((seg) => seg.centerD).join(" ");

    const cloudCount = Math.min(CLOUD_COUNT, points.length);
    const clouds = Array.from({ length: cloudCount }, (_, i) => {
      const idx = Math.round(((i + 1) / (cloudCount + 1)) * (points.length - 1));
      const point = points[idx];
      const side = i % 2 === 0 ? 1 : -1;
      return { x: point.x + side * riverWidth * 0.4, y: point.y, scale: CLOUD_SCALES[i % CLOUD_SCALES.length] };
    });

    setGeometry({ width, height, points, segments, centerlineD, clouds, riverWidth });
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
      const rawAngle = (Math.atan2(ahead.y - point.y, ahead.x - point.x) * 180) / Math.PI;
      const angle = rawAngle * ROTATION_DAMPING;

      setBoat({ x: point.x, y: point.y, angle, viewportH });
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

  const fadeHalfRange = boat.viewportH * FADE_HALF_RANGE_RATIO;
  const fadeY1 = boat.y - fadeHalfRange;
  const fadeY2 = boat.y + fadeHalfRange;

  return (
    <div ref={wrapperRef} className="relative">
      {isDesktop && geometry && (
        <svg
          className="absolute inset-0 z-30 pointer-events-none"
          width="100%"
          height="100%"
          viewBox={`0 0 ${geometry.width} ${geometry.height}`}
          preserveAspectRatio="none"
          aria-hidden="true"
        >
          <defs>
            <linearGradient id="riverFadeGradient" gradientUnits="userSpaceOnUse" x1="0" y1={fadeY1} x2="0" y2={fadeY2}>
              <stop offset="0%" stopColor="#fff" stopOpacity="0" />
              <stop offset="30%" stopColor="#fff" stopOpacity="1" />
              <stop offset="70%" stopColor="#fff" stopOpacity="1" />
              <stop offset="100%" stopColor="#fff" stopOpacity="0" />
            </linearGradient>
            <mask id="riverFadeMask">
              <rect x="0" y="0" width={geometry.width} height={geometry.height} fill="url(#riverFadeGradient)" />
            </mask>
          </defs>

          <g mask="url(#riverFadeMask)">
            {geometry.segments.map((seg, i) => (
              <g key={i}>
                <path
                  d={seg.centerD}
                  fill="none"
                  stroke={seg.color}
                  strokeWidth={geometry.riverWidth}
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  opacity="0.55"
                />
                <path
                  d={seg.centerD}
                  fill="none"
                  stroke={seg.bankColor}
                  strokeWidth={geometry.riverWidth * HIGHLIGHT_WIDTH_RATIO}
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  opacity="0.4"
                />
              </g>
            ))}
          </g>

          <path ref={svgPathRef} d={geometry.centerlineD} fill="none" stroke="none" />
          <Boat x={boat.x} y={boat.y} angle={boat.angle} />

          {geometry.clouds.map((cloud, i) => (
            <Cloud key={i} x={cloud.x} y={cloud.y} seed={i} scale={cloud.scale} />
          ))}
        </svg>
      )}
      {children}
    </div>
  );
}
