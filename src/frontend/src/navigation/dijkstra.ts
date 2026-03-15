import type { BuildingGraph, NavNode } from "./graph";

export function findShortestPath(
  graph: BuildingGraph,
  startNodeId: string,
  endNodeId: string,
): { path: NavNode[]; totalDistance: number } | null {
  const { nodes, edges } = graph;

  // Build adjacency list
  const adj = new Map<string, { to: string; weight: number }[]>();
  for (const node of nodes) {
    adj.set(node.id, []);
  }
  for (const e of edges) {
    adj.get(e.from)?.push({ to: e.to, weight: e.weight });
  }

  const dist = new Map<string, number>();
  const prev = new Map<string, string | null>();

  for (const node of nodes) {
    dist.set(node.id, Number.POSITIVE_INFINITY);
    prev.set(node.id, null);
  }
  dist.set(startNodeId, 0);

  // Simple priority queue using an array (good enough for <200 nodes)
  // [distance, nodeId]
  const queue: [number, string][] = [[0, startNodeId]];
  const visited = new Set<string>();

  while (queue.length > 0) {
    // Pop minimum distance element
    queue.sort((a, b) => a[0] - b[0]);
    const [curDist, curId] = queue.shift()!;

    if (visited.has(curId)) continue;
    visited.add(curId);

    if (curId === endNodeId) break;

    const neighbors = adj.get(curId) ?? [];
    for (const { to, weight } of neighbors) {
      if (visited.has(to)) continue;
      const newDist = curDist + weight;
      if (newDist < (dist.get(to) ?? Number.POSITIVE_INFINITY)) {
        dist.set(to, newDist);
        prev.set(to, curId);
        queue.push([newDist, to]);
      }
    }
  }

  // Reconstruct path
  const totalDistance = dist.get(endNodeId) ?? Number.POSITIVE_INFINITY;
  if (!Number.isFinite(totalDistance)) return null;

  const path: NavNode[] = [];
  let cur: string | null | undefined = endNodeId;
  while (cur) {
    const node = nodes.find((n) => n.id === cur);
    if (node) path.unshift(node);
    cur = prev.get(cur);
  }

  if (path.length === 0 || path[0].id !== startNodeId) return null;

  return { path, totalDistance };
}
