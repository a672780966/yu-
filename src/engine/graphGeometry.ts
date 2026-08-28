/**
 * YU Precision Graph Geometry Engine (R3)
 * Unified 1152×648 canvas, 24px Macro Grid, 12px Sub Grid, 4px Base Unit.
 */

export const GRAPH_CANVAS_WIDTH = 1152;
export const GRAPH_CANVAS_HEIGHT = 648;
export const GRAPH_CENTER_X = 576; // Exact horizontal axis

// Entity Radii
export const RADIUS_MAIN_DEV = 36;
export const RADIUS_FOCUS_DEV = 44;
export const RADIUS_SUPPORT = 28; // Contract & Artifact
export const RADIUS_HIT_TARGET = 52; // Invisible pointer target

export interface HexPoint {
  x: number;
  y: number;
}

/**
 * Pointy-top regular hexagon points formula:
 * angle = 60° * i - 30°
 */
export function getHexPoints(cx: number, cy: number, r: number): string {
  const points: string[] = [];
  for (let i = 0; i < 6; i++) {
    const angle = (Math.PI / 3) * i - Math.PI / 6;
    const x = cx + r * Math.cos(angle);
    const y = cy + r * Math.sin(angle);
    points.push(`${x.toFixed(2)},${y.toFixed(2)}`);
  }
  return points.join(' ');
}

/**
 * Returns array of 6 vertices for a pointy-top hexagon
 */
export function getHexVertices(cx: number, cy: number, r: number): HexPoint[] {
  const vertices: HexPoint[] = [];
  for (let i = 0; i < 6; i++) {
    const angle = (Math.PI / 3) * i - Math.PI / 6;
    vertices.push({
      x: cx + r * Math.cos(angle),
      y: cy + r * Math.sin(angle)
    });
  }
  return vertices;
}

/**
 * Line segment intersection helper
 */
function lineIntersect(
  p1: HexPoint,
  p2: HexPoint,
  p3: HexPoint,
  p4: HexPoint
): HexPoint | null {
  const denom = (p4.y - p3.y) * (p2.x - p1.x) - (p4.x - p3.x) * (p2.y - p1.y);
  if (denom === 0) return null;

  const ua = ((p4.x - p3.x) * (p1.y - p3.y) - (p4.y - p3.y) * (p1.x - p3.x)) / denom;
  const ub = ((p2.x - p1.x) * (p1.y - p3.y) - (p2.y - p1.y) * (p1.x - p3.x)) / denom;

  if (ua >= 0 && ua <= 1 && ub >= 0 && ub <= 1) {
    return {
      x: p1.x + ua * (p2.x - p1.x),
      y: p1.y + ua * (p2.y - p1.y)
    };
  }
  return null;
}

/**
 * Calculates the exact ray intersection point from center (cx, cy) to target (tx, ty)
 * against the regular pointy-top hexagon perimeter, plus a visual mechanical gap (default 4px).
 */
export function getHexEdgePoint(
  cx: number,
  cy: number,
  r: number,
  tx: number,
  ty: number,
  gap: number = 4
): HexPoint {
  const vertices = getHexVertices(cx, cy, r);
  const center: HexPoint = { x: cx, y: cy };
  const target: HexPoint = { x: tx, y: ty };

  let closestIntersection: HexPoint | null = null;
  let minDistance = Infinity;

  for (let i = 0; i < 6; i++) {
    const v1 = vertices[i];
    const v2 = vertices[(i + 1) % 6];
    const hit = lineIntersect(center, target, v1, v2);
    if (hit) {
      const dist = Math.hypot(hit.x - cx, hit.y - cy);
      if (dist < minDistance) {
        minDistance = dist;
        closestIntersection = hit;
      }
    }
  }

  if (!closestIntersection) {
    // Fallback along ray
    const angle = Math.atan2(ty - cy, tx - cx);
    return {
      x: cx + (r + gap) * Math.cos(angle),
      y: cy + (r + gap) * Math.sin(angle)
    };
  }

  // Offset along the direction by the specified visual mechanical gap
  const angle = Math.atan2(ty - cy, tx - cx);
  return {
    x: closestIntersection.x + gap * Math.cos(angle),
    y: closestIntersection.y + gap * Math.sin(angle)
  };
}

/**
 * Computes boundary endpoints for a bond between Node A and Node B
 */
export function computeBondEndpoints(
  fromX: number,
  fromY: number,
  fromR: number,
  toX: number,
  toY: number,
  toR: number,
  gap: number = 4
): { x1: number; y1: number; x2: number; y2: number; midX: number; midY: number } {
  const start = getHexEdgePoint(fromX, fromY, fromR, toX, toY, gap);
  const end = getHexEdgePoint(toX, toY, toR, fromX, fromY, gap);

  return {
    x1: start.x,
    y1: start.y,
    x2: end.x,
    y2: end.y,
    midX: (start.x + end.x) / 2,
    midY: (start.y + end.y) / 2
  };
}

/**
 * Calculates adaptive fit scale for viewport, clamped to [0.65, 1.15]
 */
export function calculateFitTransform(
  viewportWidth: number,
  viewportHeight: number,
  contentWidth: number = GRAPH_CANVAS_WIDTH,
  contentHeight: number = GRAPH_CANVAS_HEIGHT,
  padding: number = 48
): { scale: number; x: number; y: number } {
  if (viewportWidth <= 0 || viewportHeight <= 0) {
    return { scale: 1, x: 0, y: 0 };
  }

  const scaleX = (viewportWidth - padding) / contentWidth;
  const scaleY = (viewportHeight - padding) / contentHeight;
  const rawScale = Math.min(scaleX, scaleY);
  const scale = Math.min(Math.max(rawScale, 0.65), 1.15);

  const scaledW = contentWidth * scale;
  const scaledH = contentHeight * scale;
  const x = (viewportWidth - scaledW) / 2;
  const y = (viewportHeight - scaledH) / 2;

  return { scale, x, y };
}

// -------------------------------------------------------------
// Snapped Node Coordinates on 12px Sub Grid
// -------------------------------------------------------------

export interface MolecularNodePos {
  id: string;
  cx: number;
  cy: number;
  type: 'dev' | 'contract' | 'artifact';
  label: string;
  subLabel?: string;
}

export const CONSTRUCTION_POSITIONS: Record<string, MolecularNodePos> = {
  'DEV-039': { id: 'DEV-039', cx: 576, cy: 96, type: 'dev', label: 'DEV-039', subLabel: 'Scaffold' },
  'DEV-040': { id: 'DEV-040', cx: 408, cy: 216, type: 'dev', label: 'DEV-040', subLabel: 'Core Protocol' },
  'DEV-045': { id: 'DEV-045', cx: 744, cy: 216, type: 'dev', label: 'DEV-045', subLabel: 'Audit Pipeline' },
  'DEV-044': { id: 'DEV-044', cx: 936, cy: 216, type: 'dev', label: 'DEV-044', subLabel: 'External Sync' },
  'CONTRACT-AUTH': { id: 'CONTRACT-AUTH', cx: 408, cy: 336, type: 'contract', label: 'Auth Contract', subLabel: 'V1.2' },
  'DEV-041': { id: 'DEV-041', cx: 228, cy: 336, type: 'dev', label: 'DEV-041', subLabel: 'Wasm Runtime' },
  'DEV-042': { id: 'DEV-042', cx: 576, cy: 336, type: 'dev', label: 'DEV-042', subLabel: 'User Auth' },
  'ARTIFACT-RECEIPTS': { id: 'ARTIFACT-RECEIPTS', cx: 888, cy: 336, type: 'artifact', label: 'Receipts', subLabel: 'Signed' },
  'DEV-047': { id: 'DEV-047', cx: 1032, cy: 336, type: 'dev', label: 'DEV-047', subLabel: 'Webhook Sync' },
  'DEV-046': { id: 'DEV-046', cx: 744, cy: 384, type: 'dev', label: 'DEV-046', subLabel: 'Telemetry' },
  'ARTIFACT-WASM': { id: 'ARTIFACT-WASM', cx: 228, cy: 456, type: 'artifact', label: 'Wasm Bin', subLabel: 'Artifact' },
  'DEV-043': { id: 'DEV-043', cx: 408, cy: 492, type: 'dev', label: 'DEV-043', subLabel: 'Web UI Client' },
  'DEV-048': { id: 'DEV-048', cx: 648, cy: 492, type: 'dev', label: 'DEV-048', subLabel: 'Release Gate' }
};

export interface SymbolMolecularPos {
  id: string;
  name: string;
  kind: 'controller' | 'service' | 'repo' | 'test' | 'type';
  file: string;
  cx: number;
  cy: number;
  calls: string[];
}

export const IMPLEMENTATION_POSITIONS: SymbolMolecularPos[] = [
  { id: 'AuthController', name: 'AuthController', kind: 'controller', file: 'src/auth/controller.ts', cx: 576, cy: 96, calls: ['AuthService', 'TokenValidator'] },
  { id: 'AuthService', name: 'AuthService', kind: 'service', file: 'src/auth/service.ts', cx: 576, cy: 228, calls: ['UserRepository', 'SessionStore', 'AuthTypes'] },
  { id: 'TokenValidator', name: 'TokenValidator', kind: 'service', file: 'src/auth/token.ts', cx: 372, cy: 192, calls: ['AuthTypes'] },
  { id: 'UserRepository', name: 'UserRepository', kind: 'repo', file: 'src/db/userRepo.ts', cx: 432, cy: 372, calls: ['AuthTypes'] },
  { id: 'SessionStore', name: 'SessionStore', kind: 'repo', file: 'src/db/session.ts', cx: 720, cy: 372, calls: ['AuthTypes'] },
  { id: 'AuthTypes', name: 'AuthTypes', kind: 'type', file: 'src/auth/types.ts', cx: 576, cy: 480, calls: [] },
  { id: 'AuthTest', name: 'AuthSuite.test', kind: 'test', file: 'tests/auth.test.ts', cx: 816, cy: 192, calls: ['AuthService'] }
];

export interface PlanningMolecularPos {
  id: string;
  title: string;
  category: 'requirement' | 'contract' | 'decision' | 'dev';
  status: 'frozen' | 'draft' | 'planned';
  cx: number;
  cy: number;
  links: string[];
}

export const PLANNING_POSITIONS: PlanningMolecularPos[] = [
  { id: 'SPEC-01', title: 'Security Boundary', category: 'requirement', status: 'frozen', cx: 576, cy: 96, links: ['SPEC-02', 'CONTRACT-AUTH', 'DEV-042'] },
  { id: 'SPEC-02', title: 'Session RFC', category: 'decision', status: 'frozen', cx: 372, cy: 216, links: ['CONTRACT-AUTH'] },
  { id: 'CONTRACT-AUTH', title: 'Auth Protocol V1.2', category: 'contract', status: 'frozen', cx: 576, cy: 228, links: ['DEV-042', 'DEV-043'] },
  { id: 'DEV-042', title: 'User Auth', category: 'dev', status: 'frozen', cx: 576, cy: 372, links: ['DEV-043', 'FUTURE-OAUTH'] },
  { id: 'DEV-043', title: 'Client Web UI', category: 'dev', status: 'draft', cx: 372, cy: 468, links: [] },
  { id: 'FUTURE-OAUTH', title: 'OAuth2 Sync', category: 'requirement', status: 'planned', cx: 780, cy: 372, links: ['FUTURE-RBAC'] },
  { id: 'FUTURE-RBAC', title: 'RBAC Policy', category: 'decision', status: 'planned', cx: 780, cy: 492, links: [] }
];
