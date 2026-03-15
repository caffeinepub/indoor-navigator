import type { NavNode } from "./graph";

export interface NavStep {
  id: number;
  iconType:
    | "straight"
    | "turn-left"
    | "turn-right"
    | "stairs"
    | "elevator"
    | "destination"
    | "start";
  text: string;
  floorId: number;
  active: boolean;
}

const FLOOR_LABELS: Record<number, string> = {
  0: "Ground Floor",
  1: "Floor 1",
  2: "Floor 2",
};

function floorLabel(floorId: number): string {
  return FLOOR_LABELS[floorId] ?? `Floor ${floorId}`;
}

interface AngleResult {
  angle: number;
  cross: number;
}

function getAngle(
  ax: number,
  ay: number,
  bx: number,
  by: number,
  cx: number,
  cy: number,
): AngleResult {
  // Angle at B from vector BA to vector BC
  const v1x = ax - bx;
  const v1y = ay - by;
  const v2x = cx - bx;
  const v2y = cy - by;
  const dot = v1x * v2x + v1y * v2y;
  const cross = v1x * v2y - v1y * v2x; // positive = left turn
  const angle = (Math.atan2(Math.abs(cross), dot) * 180) / Math.PI;
  return { angle, cross };
}

export function generateInstructions(path: NavNode[]): NavStep[] {
  if (path.length === 0) return [];

  const steps: NavStep[] = [];
  let stepId = 1;

  // Start step
  const startNode = path[0];
  steps.push({
    id: stepId++,
    iconType: "start",
    text: `Start at ${startNode.label ?? "your location"}`,
    floorId: startNode.floorId,
    active: true,
  });

  if (path.length === 1) {
    steps.push({
      id: stepId++,
      iconType: "destination",
      text: `Arrive at ${startNode.label ?? "destination"}`,
      floorId: startNode.floorId,
      active: false,
    });
    return steps;
  }

  let i = 1;
  while (i < path.length) {
    const prev = path[i - 1];
    const cur = path[i];

    // Floor change
    if (cur.floorId !== prev.floorId) {
      const via =
        cur.id.includes("elevator") || prev.id.includes("elevator")
          ? "Elevator"
          : cur.id.includes("stairs_b") || prev.id.includes("stairs_b")
            ? "Staircase B"
            : "Staircase A";
      const icon: NavStep["iconType"] =
        via === "Elevator" ? "elevator" : "stairs";
      steps.push({
        id: stepId++,
        iconType: icon,
        text: `Take the ${via} to ${floorLabel(cur.floorId)}`,
        floorId: cur.floorId,
        active: false,
      });
      i++;
      continue;
    }

    // Accumulate straight-line distance on same floor
    let segDist = 0;
    let j = i;
    while (
      j < path.length &&
      path[j].floorId === prev.floorId &&
      path[j].type !== "stairs" &&
      path[j].type !== "elevator"
    ) {
      segDist += Math.sqrt(
        (path[j].x - path[j - 1].x) ** 2 + (path[j].y - path[j - 1].y) ** 2,
      );

      // Check for significant direction change
      if (j < path.length - 1 && j > i) {
        const info = getAngle(
          path[j - 1].x,
          path[j - 1].y,
          path[j].x,
          path[j].y,
          path[j + 1].x,
          path[j + 1].y,
        );
        if (info.angle > 45) {
          break;
        }
      }
      j++;
    }

    const meters = Math.round(segDist * 0.1);
    const metersText = meters > 0 ? ` for ${meters}m` : "";

    // Check if a turn follows at position j
    if (j < path.length && j > i && j >= 2) {
      const info = getAngle(
        path[j - 2].x,
        path[j - 2].y,
        path[j - 1].x,
        path[j - 1].y,
        path[j].x,
        path[j].y,
      );
      if (info.angle > 45) {
        // Add straight segment before the turn
        if (j - 1 > i) {
          steps.push({
            id: stepId++,
            iconType: "straight",
            text: `Go straight${metersText} along the corridor`,
            floorId: cur.floorId,
            active: false,
          });
        }
        // Add turn step
        const turnDir: NavStep["iconType"] =
          info.cross > 0 ? "turn-left" : "turn-right";
        const nearLabel =
          path[j - 1].label && path[j - 1].type !== "corridor"
            ? ` near ${path[j - 1].label}`
            : "";
        steps.push({
          id: stepId++,
          iconType: turnDir,
          text: `Turn ${turnDir === "turn-left" ? "left" : "right"}${nearLabel}`,
          floorId: cur.floorId,
          active: false,
        });
        i = j;
        continue;
      }
    }

    steps.push({
      id: stepId++,
      iconType: "straight",
      text: `Go straight${metersText} along the corridor`,
      floorId: cur.floorId,
      active: false,
    });
    i = j;
  }

  const endNode = path[path.length - 1];
  steps.push({
    id: stepId++,
    iconType: "destination",
    text: `Arrive at ${endNode.label ?? "your destination"}`,
    floorId: endNode.floorId,
    active: false,
  });

  return steps;
}
