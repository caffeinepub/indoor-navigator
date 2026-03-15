import { FLOOR_DATA } from "@/data/floorData";

export interface NavNode {
  id: string;
  floorId: number;
  x: number;
  y: number;
  label?: string;
  type?: "room" | "corridor" | "stairs" | "elevator" | "exit";
}

export interface NavEdge {
  from: string;
  to: string;
  weight: number;
}

export interface BuildingGraph {
  nodes: NavNode[];
  edges: NavEdge[];
}

function dist(
  a: { x: number; y: number },
  b: { x: number; y: number },
): number {
  return Math.sqrt((a.x - b.x) ** 2 + (a.y - b.y) ** 2);
}

// Marker node id format: "<floorPrefix>_marker_<markerId>"
export function getMarkerNodeId(floorId: number, markerId: number): string {
  const prefix = floorId === 0 ? "g" : `f${floorId}`;
  return `${prefix}_marker_${markerId}`;
}

const FLOOR_PREFIXES = ["g", "f1", "f2"];

// Corridor waypoints per floor: top corridor (y~109) + bottom corridor (y~246)
// plus vertical junctions for mid-floor room access
const CORRIDOR_NODES: NavNode[] = [
  // --- Ground Floor top corridor (y=109) ---
  { id: "g_cor_t1", floorId: 0, x: 20, y: 109, type: "corridor" },
  { id: "g_cor_t2", floorId: 0, x: 70, y: 109, type: "corridor" },
  { id: "g_cor_t3", floorId: 0, x: 180, y: 109, type: "corridor" },
  { id: "g_cor_t4", floorId: 0, x: 300, y: 109, type: "corridor" },
  { id: "g_cor_t5", floorId: 0, x: 355, y: 109, type: "corridor" },
  // Ground Floor bottom corridor (y=246)
  { id: "g_cor_b1", floorId: 0, x: 20, y: 246, type: "corridor" },
  { id: "g_cor_b2", floorId: 0, x: 90, y: 246, type: "corridor" },
  { id: "g_cor_b3", floorId: 0, x: 220, y: 246, type: "corridor" },
  { id: "g_cor_b4", floorId: 0, x: 320, y: 246, type: "corridor" },
  { id: "g_cor_b5", floorId: 0, x: 355, y: 246, type: "corridor" },

  // --- Floor 1 top corridor ---
  { id: "f1_cor_t1", floorId: 1, x: 20, y: 109, type: "corridor" },
  { id: "f1_cor_t2", floorId: 1, x: 75, y: 109, type: "corridor" },
  { id: "f1_cor_t3", floorId: 1, x: 200, y: 109, type: "corridor" },
  { id: "f1_cor_t4", floorId: 1, x: 290, y: 109, type: "corridor" },
  { id: "f1_cor_t5", floorId: 1, x: 355, y: 109, type: "corridor" },
  // Floor 1 bottom corridor
  { id: "f1_cor_b1", floorId: 1, x: 20, y: 246, type: "corridor" },
  { id: "f1_cor_b2", floorId: 1, x: 80, y: 246, type: "corridor" },
  { id: "f1_cor_b3", floorId: 1, x: 195, y: 246, type: "corridor" },
  { id: "f1_cor_b4", floorId: 1, x: 320, y: 246, type: "corridor" },
  { id: "f1_cor_b5", floorId: 1, x: 355, y: 246, type: "corridor" },

  // --- Floor 2 top corridor ---
  { id: "f2_cor_t1", floorId: 2, x: 20, y: 109, type: "corridor" },
  { id: "f2_cor_t2", floorId: 2, x: 165, y: 109, type: "corridor" },
  { id: "f2_cor_t3", floorId: 2, x: 310, y: 109, type: "corridor" },
  { id: "f2_cor_t4", floorId: 2, x: 355, y: 109, type: "corridor" },
  // Floor 2 bottom corridor
  { id: "f2_cor_b1", floorId: 2, x: 20, y: 246, type: "corridor" },
  { id: "f2_cor_b2", floorId: 2, x: 75, y: 246, type: "corridor" },
  { id: "f2_cor_b3", floorId: 2, x: 165, y: 246, type: "corridor" },
  { id: "f2_cor_b4", floorId: 2, x: 220, y: 246, type: "corridor" },
  { id: "f2_cor_b5", floorId: 2, x: 320, y: 246, type: "corridor" },
  { id: "f2_cor_b6", floorId: 2, x: 355, y: 246, type: "corridor" },
];

// Fixed stair/elevator nodes per floor
const VERTICAL_NODES: NavNode[] = FLOOR_PREFIXES.flatMap((pfx, floorId) => [
  {
    id: `${pfx}_stairs_a`,
    floorId,
    x: 20,
    y: 145,
    type: "stairs" as const,
    label: "Staircase A",
  },
  {
    id: `${pfx}_stairs_b`,
    floorId,
    x: 355,
    y: 280,
    type: "stairs" as const,
    label: "Staircase B",
  },
  {
    id: `${pfx}_elevator`,
    floorId,
    x: 355,
    y: 120,
    type: "elevator" as const,
    label: "Elevator",
  },
]);

// Build marker nodes from floorData
const MARKER_NODES: NavNode[] = FLOOR_DATA.flatMap((floor) =>
  floor.markers.map((m) => ({
    id: getMarkerNodeId(floor.id, m.id),
    floorId: floor.id,
    x: m.x,
    y: m.y,
    label: m.label,
    type:
      m.type === "stairs"
        ? "stairs"
        : m.type === "elevator"
          ? "elevator"
          : m.type === "exit"
            ? "exit"
            : "room",
  })),
);

const ALL_NODES: NavNode[] = [
  ...MARKER_NODES,
  ...CORRIDOR_NODES,
  ...VERTICAL_NODES,
];

// Helper: find nearest corridor node on a floor to a given point
function nearestCorridor(
  floorId: number,
  x: number,
  y: number,
  exclude?: string[],
): NavNode {
  const candidates = CORRIDOR_NODES.filter(
    (n) => n.floorId === floorId && !(exclude ?? []).includes(n.id),
  );
  let best = candidates[0];
  let bestDist = Number.POSITIVE_INFINITY;
  for (const n of candidates) {
    const d = dist(n, { x, y });
    if (d < bestDist) {
      bestDist = d;
      best = n;
    }
  }
  return best;
}

// Build edges
const edges: NavEdge[] = [];

function addEdge(from: string, to: string) {
  const a = ALL_NODES.find((n) => n.id === from);
  const b = ALL_NODES.find((n) => n.id === to);
  if (!a || !b) return;
  const w = dist(a, b);
  edges.push({ from, to, weight: w });
  edges.push({ from: to, to: from, weight: w });
}

// Per-floor corridor topology
const FLOOR_CORRIDOR_TOPOLOGY: [string, string][][] = [
  // Floor 0: top corridor horizontal links
  [
    ["g_cor_t1", "g_cor_t2"],
    ["g_cor_t2", "g_cor_t3"],
    ["g_cor_t3", "g_cor_t4"],
    ["g_cor_t4", "g_cor_t5"],
    // Bottom corridor horizontal links
    ["g_cor_b1", "g_cor_b2"],
    ["g_cor_b2", "g_cor_b3"],
    ["g_cor_b3", "g_cor_b4"],
    ["g_cor_b4", "g_cor_b5"],
    // Left spine: top-left -> stairs A -> bottom-left
    ["g_cor_t1", "g_stairs_a"],
    ["g_stairs_a", "g_cor_b1"],
    // Right spine: top-right -> elevator -> bottom-right -> stairs B
    ["g_cor_t5", "g_elevator"],
    ["g_elevator", "g_cor_b5"],
    ["g_cor_b5", "g_stairs_b"],
    // Mid vertical: t3 <-> b3 (approx center)
    ["g_cor_t3", "g_cor_b3"],
  ],
  // Floor 1: top corridor
  [
    ["f1_cor_t1", "f1_cor_t2"],
    ["f1_cor_t2", "f1_cor_t3"],
    ["f1_cor_t3", "f1_cor_t4"],
    ["f1_cor_t4", "f1_cor_t5"],
    ["f1_cor_b1", "f1_cor_b2"],
    ["f1_cor_b2", "f1_cor_b3"],
    ["f1_cor_b3", "f1_cor_b4"],
    ["f1_cor_b4", "f1_cor_b5"],
    ["f1_cor_t1", "f1_stairs_a"],
    ["f1_stairs_a", "f1_cor_b1"],
    ["f1_cor_t5", "f1_elevator"],
    ["f1_elevator", "f1_cor_b5"],
    ["f1_cor_b5", "f1_stairs_b"],
    ["f1_cor_t3", "f1_cor_b3"],
  ],
  // Floor 2: top corridor
  [
    ["f2_cor_t1", "f2_cor_t2"],
    ["f2_cor_t2", "f2_cor_t3"],
    ["f2_cor_t3", "f2_cor_t4"],
    ["f2_cor_b1", "f2_cor_b2"],
    ["f2_cor_b2", "f2_cor_b3"],
    ["f2_cor_b3", "f2_cor_b4"],
    ["f2_cor_b4", "f2_cor_b5"],
    ["f2_cor_b5", "f2_cor_b6"],
    ["f2_cor_t1", "f2_stairs_a"],
    ["f2_stairs_a", "f2_cor_b1"],
    ["f2_cor_t4", "f2_elevator"],
    ["f2_elevator", "f2_cor_b6"],
    ["f2_cor_b6", "f2_stairs_b"],
    ["f2_cor_t2", "f2_cor_b3"],
  ],
];

// Add corridor edges
for (const floorEdges of FLOOR_CORRIDOR_TOPOLOGY) {
  for (const [a, b] of floorEdges) {
    addEdge(a, b);
  }
}

// Connect each marker to its nearest corridor node on the same floor
for (const floor of FLOOR_DATA) {
  const pfx = floor.id === 0 ? "g" : `f${floor.id}`;
  for (const m of floor.markers) {
    const nodeId = getMarkerNodeId(floor.id, m.id);
    const mType = m.type;
    // Staircase / elevator markers are already in VERTICAL_NODES with fixed IDs,
    // but also appear in MARKER_NODES as duplicates — connect both IDs to corridors
    if (mType === "stairs") {
      const stairId = m.id === 11 ? `${pfx}_stairs_a` : `${pfx}_stairs_b`;
      // marker node connects to stair node (they may differ slightly in coords)
      addEdge(nodeId, stairId);
    } else if (mType === "elevator") {
      addEdge(nodeId, `${pfx}_elevator`);
    } else {
      // Connect to nearest corridor node
      const nearest = nearestCorridor(floor.id, m.x, m.y);
      addEdge(nodeId, nearest.id);
      // Also connect to second nearest if room is between two corridor nodes
      const second = nearestCorridor(floor.id, m.x, m.y, [nearest.id]);
      if (second && dist(second, m) < 200) {
        addEdge(nodeId, second.id);
      }
    }
  }
}

// Cross-floor edges: stairs and elevators connect adjacent floors
// Weight = 50 pixels (penalty for floor change)
const CROSS_FLOOR_WEIGHT = 50;

function addCrossFloor(idA: string, idB: string) {
  edges.push({ from: idA, to: idB, weight: CROSS_FLOOR_WEIGHT });
  edges.push({ from: idB, to: idA, weight: CROSS_FLOOR_WEIGHT });
}

// Staircase A: 0<->1, 1<->2
addCrossFloor("g_stairs_a", "f1_stairs_a");
addCrossFloor("f1_stairs_a", "f2_stairs_a");
// Staircase B: 0<->1, 1<->2
addCrossFloor("g_stairs_b", "f1_stairs_b");
addCrossFloor("f1_stairs_b", "f2_stairs_b");
// Elevator: all floors including 0<->2 direct
addCrossFloor("g_elevator", "f1_elevator");
addCrossFloor("f1_elevator", "f2_elevator");
addCrossFloor("g_elevator", "f2_elevator");

// Also connect floor marker nodes for stairs/elevators to their vertical counterparts
for (const floor of FLOOR_DATA) {
  const pfx = floor.id === 0 ? "g" : `f${floor.id}`;
  for (const m of floor.markers) {
    if (m.type === "stairs") {
      const stairId = m.id === 11 ? `${pfx}_stairs_a` : `${pfx}_stairs_b`;
      // cross-floor marker<->stairs already handled above; just add same-floor link
      const nodeId = getMarkerNodeId(floor.id, m.id);
      addEdge(nodeId, stairId);
    } else if (m.type === "elevator") {
      const nodeId = getMarkerNodeId(floor.id, m.id);
      addEdge(nodeId, `${pfx}_elevator`);
    }
  }
}

export const BUILDING_GRAPH: BuildingGraph = {
  nodes: ALL_NODES,
  edges,
};

export function getNodeById(id: string): NavNode | undefined {
  return ALL_NODES.find((n) => n.id === id);
}
