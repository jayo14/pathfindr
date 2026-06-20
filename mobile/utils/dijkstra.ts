import { CampusCoordinate, RouteSegment } from "@/types/domain";
import { getDistanceMeters } from "@/utils/geo";

export interface GraphNode {
  id: string;
  coordinate: CampusCoordinate;
}

export interface GraphEdge {
  from: string;
  to: string;
  distanceMeters: number;
}

export interface CampusGraph {
  nodes: Record<string, GraphNode>;
  adjacency: Record<string, Array<{ nodeId: string; distanceMeters: number }>>;
}

/** Build a campus graph from a list of nodes. Edges connect nearby nodes within
 *  maxEdgeMeters of each other, creating a navigable graph for pathfinding. */
export function buildCampusGraph(
  nodes: GraphNode[],
  maxEdgeMeters = 600,
): CampusGraph {
  const graph: CampusGraph = { nodes: {}, adjacency: {} };

  for (const node of nodes) {
    graph.nodes[node.id] = node;
    graph.adjacency[node.id] = [];
  }

  for (let i = 0; i < nodes.length; i++) {
    for (let j = i + 1; j < nodes.length; j++) {
      const dist = getDistanceMeters(
        nodes[i].coordinate,
        nodes[j].coordinate,
      );
      if (dist <= maxEdgeMeters) {
        graph.adjacency[nodes[i].id].push({
          nodeId: nodes[j].id,
          distanceMeters: dist,
        });
        graph.adjacency[nodes[j].id].push({
          nodeId: nodes[i].id,
          distanceMeters: dist,
        });
      }
    }
  }

  return graph;
}

interface DijkstraResult {
  path: string[];
  distanceMeters: number;
}

/** Run Dijkstra's algorithm on the campus graph to find the shortest path
 *  from startId to endId. Returns the ordered list of node IDs and total distance. */
export function dijkstra(
  graph: CampusGraph,
  startId: string,
  endId: string,
): DijkstraResult | null {
  if (!graph.nodes[startId] || !graph.nodes[endId]) return null;
  if (startId === endId)
    return { path: [startId], distanceMeters: 0 };

  const dist: Record<string, number> = {};
  const prev: Record<string, string | null> = {};
  const visited = new Set<string>();
  const queue = new Set<string>(Object.keys(graph.nodes));

  for (const id of queue) {
    dist[id] = Infinity;
    prev[id] = null;
  }
  dist[startId] = 0;

  while (queue.size > 0) {
    // Pick the unvisited node with the smallest distance
    let current: string | null = null;
    let minDist = Infinity;
    for (const id of queue) {
      if (dist[id] < minDist) {
        minDist = dist[id];
        current = id;
      }
    }

    if (current === null || current === endId) break;

    queue.delete(current);
    visited.add(current);

    for (const neighbor of graph.adjacency[current] ?? []) {
      if (visited.has(neighbor.nodeId)) continue;
      const alt = dist[current] + neighbor.distanceMeters;
      if (alt < dist[neighbor.nodeId]) {
        dist[neighbor.nodeId] = alt;
        prev[neighbor.nodeId] = current;
      }
    }
  }

  if (dist[endId] === Infinity) return null;

  // Reconstruct path
  const path: string[] = [];
  let step: string | null = endId;
  while (step !== null) {
    path.unshift(step);
    step = prev[step] ?? null;
  }

  return { path, distanceMeters: dist[endId] };
}

/** Convert a Dijkstra path (node IDs) to RouteSegment coordinates. */
export function pathToRouteSegments(
  graph: CampusGraph,
  path: string[],
): RouteSegment[] {
  return path
    .map((id) => graph.nodes[id]?.coordinate)
    .filter(Boolean) as RouteSegment[];
}

/** Find the nearest graph node to a given coordinate. */
export function nearestNode(
  graph: CampusGraph,
  coordinate: CampusCoordinate,
): string | null {
  let nearest: string | null = null;
  let nearestDist = Infinity;

  for (const [id, node] of Object.entries(graph.nodes)) {
    const d = getDistanceMeters(coordinate, node.coordinate);
    if (d < nearestDist) {
      nearestDist = d;
      nearest = id;
    }
  }

  return nearest;
}
