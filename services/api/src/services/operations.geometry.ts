import polygonClipping, { type MultiPolygon } from "polygon-clipping";
import type { Geometry } from "./operations.types.js";

type Point = [number, number];
const cross = (a: Point, b: Point, c: Point) => (b[0] - a[0]) * (c[1] - a[1]) - (b[1] - a[1]) * (c[0] - a[0]);
const same = (a: Point, b: Point) => a[0] === b[0] && a[1] === b[1];
function onSegment(a: Point, b: Point, p: Point): boolean {
  return Math.abs(cross(a, b, p)) < 1e-12 && p[0] >= Math.min(a[0], b[0]) && p[0] <= Math.max(a[0], b[0]) &&
    p[1] >= Math.min(a[1], b[1]) && p[1] <= Math.max(a[1], b[1]);
}
function segmentsMeet(a: Point, b: Point, c: Point, d: Point): boolean {
  return onSegment(a, b, c) || onSegment(a, b, d) || onSegment(c, d, a) || onSegment(c, d, b) ||
    ((cross(a, b, c) > 0) !== (cross(a, b, d) > 0) && (cross(c, d, a) > 0) !== (cross(c, d, b) > 0));
}
function ringsMeet(a: Point[], b: Point[]): boolean {
  for (let i = 0; i < a.length - 1; i++) for (let j = 0; j < b.length - 1; j++) {
    if (segmentsMeet(a[i], a[i + 1], b[j], b[j + 1])) return true;
  }
  return false;
}
function inside(point: Point, ring: Point[]): boolean {
  let result = false;
  for (let i = 0; i < ring.length - 1; i++) {
    const a = ring[i], b = ring[i + 1];
    if ((a[1] > point[1]) !== (b[1] > point[1]) && point[0] < (b[0] - a[0]) * (point[1] - a[1]) / (b[1] - a[1]) + a[0]) result = !result;
  }
  return result;
}

/** Bounded topology validation before clipping. Reject open, degenerate,
 * self-crossing rings, invalid holes, overlapping polygons and dateline edges. */
export function validateGeometry(geometry: Geometry): number {
  const polygons = geometry.type === "Polygon" ? [geometry.coordinates] : geometry.coordinates;
  const points = polygons.reduce((sum, polygon) => sum + polygon.reduce((n, r) => n + r.length, 0), 0);
  if (points > 512) throw new Error("Geometry exceeds 512 coordinate limit");
  for (const rings of polygons) {
    for (const ring of rings) {
      if (!same(ring[0], ring[ring.length - 1])) throw new Error("Polygon rings must be closed");
      let signedArea = 0;
      for (let i = 0; i < ring.length - 1; i++) {
        if (same(ring[i], ring[i + 1]) || Math.abs(ring[i][0] - ring[i + 1][0]) > 180) throw new Error("Invalid polygon edge");
        signedArea += ring[i][0] * ring[i + 1][1] - ring[i + 1][0] * ring[i][1];
        const previous = ring[(i + ring.length - 2) % (ring.length - 1)];
        if (Math.abs(cross(previous, ring[i], ring[i + 1])) < 1e-12 &&
          (previous[0] - ring[i][0]) * (ring[i + 1][0] - ring[i][0]) + (previous[1] - ring[i][1]) * (ring[i + 1][1] - ring[i][1]) > 0) {
          throw new Error("Polygon edges backtrack");
        }
        for (let j = i + 2; j < ring.length - 1; j++) {
          if (i === 0 && j === ring.length - 2) continue;
          if (segmentsMeet(ring[i], ring[i + 1], ring[j], ring[j + 1])) throw new Error("Polygon ring self-intersects");
        }
      }
      if (Math.abs(signedArea) < 1e-12) throw new Error("Polygon ring has zero area");
    }
    for (let h = 1; h < rings.length; h++) {
      if (!inside(rings[h][0], rings[0]) || ringsMeet(rings[0], rings[h])) throw new Error("Polygon hole is outside or touches its shell");
      for (let other = 1; other < h; other++) {
        if (ringsMeet(rings[h], rings[other]) || inside(rings[h][0], rings[other]) || inside(rings[other][0], rings[h])) {
          throw new Error("Polygon holes overlap");
        }
      }
    }
  }
  for (let i = 0; i < polygons.length; i++) for (let j = i + 1; j < polygons.length; j++) {
    if (polygonClipping.intersection([polygons[i]], [polygons[j]]).length) throw new Error("MultiPolygon interiors overlap");
  }
  return points;
}

function coordinates(geometry: Geometry): MultiPolygon {
  return geometry.type === "Polygon" ? [geometry.coordinates] : geometry.coordinates;
}
export function intersection(a: Geometry, b: Geometry): Geometry | null {
  const result = polygonClipping.intersection(coordinates(a), coordinates(b));
  return result.length ? { type: "MultiPolygon", coordinates: result } : null;
}
export function union(geometries: Geometry[]): Geometry | null {
  if (!geometries.length) return null;
  const result = polygonClipping.union(coordinates(geometries[0]), ...geometries.slice(1).map(coordinates));
  return result.length ? { type: "MultiPolygon", coordinates: result } : null;
}
// Spherical GeoJSON area; holes subtract. Used for material-change sizing only,
// never to approximate geometric intersection or assign jurisdiction ownership.
export function areaKm2(geometry: Geometry): number {
  const rad = Math.PI / 180;
  function ringArea(ring: number[][]): number {
    let area = 0;
    for (let i = 0; i < ring.length - 1; i++) {
      area += (ring[i + 1][0] - ring[i][0]) * rad *
        (2 + Math.sin(ring[i][1] * rad) + Math.sin(ring[i + 1][1] * rad));
    }
    return Math.abs(area * 6371.0088 ** 2 / 2);
  }
  return coordinates(geometry).reduce((total, rings) => total +
    Math.max(0, ringArea(rings[0]) - rings.slice(1).reduce((sum, r) => sum + ringArea(r), 0)), 0);
}
export function materialExtentChange(a: Geometry, b: Geometry): boolean {
  const diff = polygonClipping.xor(coordinates(a), coordinates(b));
  const changed = diff.length ? areaKm2({ type: "MultiPolygon", coordinates: diff }) : 0;
  return changed > Math.max(0.001, Math.max(areaKm2(a), areaKm2(b)) * 0.1);
}
