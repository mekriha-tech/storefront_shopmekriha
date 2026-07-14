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
