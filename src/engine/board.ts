/** Grid geometry: directions, line of sight and path finding. Pure functions, no game rules. */

export type Dir = "N" | "E" | "S" | "W";

export interface Vec {
  x: number;
  y: number;
}

export const DIRS: Dir[] = ["N", "E", "S", "W"];
const DELTA: Record<Dir, Vec> = { N: { x: 0, y: -1 }, E: { x: 1, y: 0 }, S: { x: 0, y: 1 }, W: { x: -1, y: 0 } };

export const add = (p: Vec, d: Dir, n = 1): Vec => ({ x: p.x + DELTA[d].x * n, y: p.y + DELTA[d].y * n });
export const eq = (a: Vec, b: Vec) => a.x === b.x && a.y === b.y;
export const manhattan = (a: Vec, b: Vec) => Math.abs(a.x - b.x) + Math.abs(a.y - b.y);
export const rotate = (d: Dir, quarterTurns: number): Dir => DIRS[(((DIRS.indexOf(d) + quarterTurns) % 4) + 4) % 4]!;
export const right = (d: Dir) => rotate(d, 1);
export const left = (d: Dir) => rotate(d, -1);
export const back = (d: Dir) => rotate(d, 2);

/** Direction of a single orthogonal step from a to b, if there is one. */
export function dirTo(a: Vec, b: Vec): Dir | undefined {
  return DIRS.find((d) => eq(add(a, d), b));
}

/** Tiles strictly between a and b along a Bresenham line. */
export function lineBetween(a: Vec, b: Vec): Vec[] {
  const out: Vec[] = [];
  let x = a.x, y = a.y;
  const dx = Math.abs(b.x - a.x), dy = -Math.abs(b.y - a.y);
  const sx = a.x < b.x ? 1 : -1, sy = a.y < b.y ? 1 : -1;
  let err = dx + dy;
  for (;;) {
    if (x === b.x && y === b.y) break;
    const e2 = 2 * err;
    if (e2 >= dy) { err += dy; x += sx; }
    if (e2 <= dx) { err += dx; y += sy; }
    if (x === b.x && y === b.y) break;
    out.push({ x, y });
  }
  return out;
}

/**
 * Breadth-first search. Returns the path from `from` to the nearest tile matching `isGoal` (excluding `from`),
 * or undefined. `passable` decides which tiles can be entered; goal tiles must also be passable unless `goalMayBeBlocked`.
 */
export function bfs(
  from: Vec,
  isGoal: (p: Vec) => boolean,
  passable: (p: Vec) => boolean,
  goalMayBeBlocked = false,
  maxDepth = 200,
): Vec[] | undefined {
  const prev = new Map<string, Vec | null>([[`${from.x},${from.y}`, null]]);
  let frontier = [from];
  for (let depth = 0; depth < maxDepth && frontier.length; depth++) {
    const nextFrontier: Vec[] = [];
    for (const p of frontier) {
      for (const d of DIRS) {
        const n = add(p, d);
        const k = `${n.x},${n.y}`;
        if (prev.has(k)) continue;
        const goal = isGoal(n);
        if (!passable(n) && !(goal && goalMayBeBlocked)) continue;
        prev.set(k, p);
        if (goal) {
          const path = [n];
          let cur = p;
          while (prev.get(`${cur.x},${cur.y}`)) {
            path.unshift(cur);
            cur = prev.get(`${cur.x},${cur.y}`)!;
          }
          return path;
        }
        nextFrontier.push(n);
      }
    }
    frontier = nextFrontier;
  }
  return undefined;
}
