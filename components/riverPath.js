// Pure geometry helpers for the homepage scroll river.
// No DOM access here — keeps this file trivially sanity-checkable with plain `node`.

/**
 * Generate points for a vertical sine-wave centerline. `extraYs` (e.g.
 * section boundary Y positions) are computed with the same formula and
 * merged in, sorted, so callers can guarantee an exact sample exists at
 * those Y values — otherwise a boundary can fall between two regularly
 * spaced samples and a per-section split of the curve won't quite reach
 * the section edge, leaving a small gap/seam where it's rendered.
 */
export function generateWavePoints(height, centerX, amplitude, wavelengths, spacing = 40, extraYs = []) {
  const points = [];
  const steps = Math.max(2, Math.ceil(height / spacing));
  const waveX = (y) => centerX + amplitude * Math.sin((y / height) * wavelengths * Math.PI * 2);
  for (let i = 0; i <= steps; i++) {
    const y = (i / steps) * height;
    points.push({ x: waveX(y), y });
  }
  for (const y of extraYs) {
    if (y <= 0 || y >= height) continue;
    if (points.some((p) => Math.abs(p.y - y) < 0.5)) continue;
    points.push({ x: waveX(y), y });
  }
  points.sort((a, b) => a.y - b.y);
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
 * section start-Y boundaries (boundaries[0] must be 0). A point exactly
 * at an internal boundary naturally starts the segment after it; it's
 * also mirrored onto the end of the previous segment (assumes `points`
 * already contains an exact sample at each boundary — see the `extraYs`
 * param on `generateWavePoints`), so adjacent segments' independently
 * smoothed curves share a precise start/end point and render with no
 * seam between sections.
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
    if (segments[i].length > 0) {
      segments[i - 1].push(segments[i][0]);
    }
  }
  return segments;
}
