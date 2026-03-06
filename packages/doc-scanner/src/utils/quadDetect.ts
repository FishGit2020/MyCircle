import type { Point } from './contourTrace';

/**
 * Douglas-Peucker polyline simplification.
 */
function douglasPeucker(points: Point[], epsilon: number): Point[] {
  if (points.length <= 2) return points;

  let maxDist = 0;
  let maxIdx = 0;
  const start = points[0];
  const end = points[points.length - 1];

  for (let i = 1; i < points.length - 1; i++) {
    const dist = perpendicularDistance(points[i], start, end);
    if (dist > maxDist) {
      maxDist = dist;
      maxIdx = i;
    }
  }

  if (maxDist > epsilon) {
    const left = douglasPeucker(points.slice(0, maxIdx + 1), epsilon);
    const right = douglasPeucker(points.slice(maxIdx), epsilon);
    return [...left.slice(0, -1), ...right];
  }

  return [start, end];
}

function perpendicularDistance(point: Point, lineStart: Point, lineEnd: Point): number {
  const dx = lineEnd.x - lineStart.x;
  const dy = lineEnd.y - lineStart.y;
  const len = Math.sqrt(dx * dx + dy * dy);
  if (len === 0) return Math.sqrt((point.x - lineStart.x) ** 2 + (point.y - lineStart.y) ** 2);
  return Math.abs(dx * (lineStart.y - point.y) - dy * (lineStart.x - point.x)) / len;
}

function contourArea(points: Point[]): number {
  let area = 0;
  for (let i = 0; i < points.length; i++) {
    const j = (i + 1) % points.length;
    area += points[i].x * points[j].y;
    area -= points[j].x * points[i].y;
  }
  return Math.abs(area) / 2;
}

/**
 * Detect the largest quadrilateral contour that is ≥ minAreaRatio of the image.
 * Returns 4 corner points in clockwise order (TL, TR, BR, BL), or null.
 */
export function detectQuad(
  contours: Point[][],
  width: number,
  height: number,
  minAreaRatio = 0.05
): Point[] | null {
  const imageArea = width * height;
  let bestQuad: Point[] | null = null;
  let bestArea = 0;

  for (const contour of contours) {
    const perimeter = contourPerimeter(contour);
    const epsilon = 0.02 * perimeter;
    const simplified = douglasPeucker(contour, epsilon);

    if (simplified.length === 4 || simplified.length === 5) {
      // Try to use 4 points — if 5, pick the 4 that form the largest quad
      const candidates = simplified.length === 4
        ? [simplified]
        : get4From5(simplified);

      for (const quad of candidates) {
        const area = contourArea(quad);
        if (area > bestArea && area >= imageArea * minAreaRatio) {
          bestArea = area;
          bestQuad = quad;
        }
      }
    }
  }

  if (!bestQuad) return null;
  return orderCorners(bestQuad);
}

function get4From5(points: Point[]): Point[][] {
  const result: Point[][] = [];
  for (let skip = 0; skip < 5; skip++) {
    result.push(points.filter((_, i) => i !== skip));
  }
  return result;
}

function contourPerimeter(points: Point[]): number {
  let perimeter = 0;
  for (let i = 0; i < points.length; i++) {
    const j = (i + 1) % points.length;
    perimeter += Math.sqrt((points[j].x - points[i].x) ** 2 + (points[j].y - points[i].y) ** 2);
  }
  return perimeter;
}

/**
 * Order 4 points clockwise: TL, TR, BR, BL.
 */
function orderCorners(points: Point[]): Point[] {
  // Sort by sum (x+y) for TL/BR, difference (y-x) for TR/BL
  const sorted = [...points];
  const sums = sorted.map(p => p.x + p.y);
  const diffs = sorted.map(p => p.y - p.x);

  const tl = sorted[sums.indexOf(Math.min(...sums))];
  const br = sorted[sums.indexOf(Math.max(...sums))];
  const tr = sorted[diffs.indexOf(Math.min(...diffs))];
  const bl = sorted[diffs.indexOf(Math.max(...diffs))];

  return [tl, tr, br, bl];
}
