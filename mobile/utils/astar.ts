import { CampusCoordinate } from '@/types/domain';
import { getDistanceMeters } from '@/utils/geo';
import { CampusGraph, GraphNode } from '@/utils/dijkstra';

interface AStarResult {
  path: string[];
  distanceMeters: number;
}

/** Heuristic: straight-line distance from node to goal (admissible). */
function heuristic(graph: CampusGraph, nodeId: string, goalId: string): number {
  const node = graph.nodes[nodeId];
  const goal = graph.nodes[goalId];
  if (!node || !goal) return 0;
  return getDistanceMeters(node.coordinate, goal.coordinate);
}

/** A* pathfinding. Returns the shortest path or null if unreachable. */
export function astar(
  graph: CampusGraph,
  startId: string,
  endId: string
): AStarResult | null {
  if (!graph.nodes[startId] || !graph.nodes[endId]) return null;
  if (startId === endId) return { path: [startId], distanceMeters: 0 };

  // gScore: cost from start to node
  const gScore: Record<string, number> = {};
  // fScore: gScore + heuristic (estimated total cost)
  const fScore: Record<string, number> = {};
  const prev: Record<string, string | null> = {};
  const openSet = new Set<string>([startId]);
  const closedSet = new Set<string>();

  for (const id of Object.keys(graph.nodes)) {
    gScore[id] = Infinity;
    fScore[id] = Infinity;
    prev[id] = null;
  }
  gScore[startId] = 0;
  fScore[startId] = heuristic(graph, startId, endId);

  while (openSet.size > 0) {
    // Pick node in openSet with lowest fScore
    let current: string | null = null;
    let minF = Infinity;
    for (const id of openSet) {
      if (fScore[id] < minF) { minF = fScore[id]; current = id; }
    }
    if (!current) break;
    if (current === endId) {
      const path: string[] = [];
      let step: string | null = endId;
      while (step) { path.unshift(step); step = prev[step] ?? null; }
      return { path, distanceMeters: gScore[endId] };
    }
    openSet.delete(current);
    closedSet.add(current);

    for (const { nodeId: neighbor, distanceMeters: weight } of graph.adjacency[current] ?? []) {
      if (closedSet.has(neighbor)) continue;
      const tentativeG = gScore[current] + weight;
      if (tentativeG < gScore[neighbor]) {
        prev[neighbor] = current;
        gScore[neighbor] = tentativeG;
        fScore[neighbor] = tentativeG + heuristic(graph, neighbor, endId);
        openSet.add(neighbor);
      }
    }
  }
  return null; // no path found
}
