import { GraphNode } from "@/utils/dijkstra";

/**
 * Campus waypoint graph nodes.
 * Includes the main buildings plus intermediate footpath waypoints that
 * connect them so Dijkstra can route through realistic walking paths.
 */
export const campusGraphNodes: GraphNode[] = [
  // ── Buildings ──────────────────────────────────────────────────────────────
  {
    id: "ict-center",
    coordinate: { latitude: 6.4672, longitude: 3.5951 },
  },
  {
    id: "engineering-block",
    coordinate: { latitude: 6.4684, longitude: 3.5968 },
  },
  {
    id: "library-complex",
    coordinate: { latitude: 6.4661, longitude: 3.5979 },
  },
  {
    id: "admin-tower",
    coordinate: { latitude: 6.4655, longitude: 3.5946 },
  },
  {
    id: "science-labs",
    coordinate: { latitude: 6.4676, longitude: 3.5988 },
  },
  {
    id: "student-hub",
    coordinate: { latitude: 6.4648, longitude: 3.5961 },
  },

  // ── Intermediate Waypoints (footpaths & intersections) ─────────────────────
  // Central spine intersection
  {
    id: "wp-central-north",
    coordinate: { latitude: 6.4676, longitude: 3.5963 },
  },
  {
    id: "wp-central-south",
    coordinate: { latitude: 6.4657, longitude: 3.5963 },
  },
  {
    id: "wp-central-mid",
    coordinate: { latitude: 6.4666, longitude: 3.5963 },
  },

  // East–west corridor waypoints
  {
    id: "wp-east-north",
    coordinate: { latitude: 6.4676, longitude: 3.5978 },
  },
  {
    id: "wp-east-south",
    coordinate: { latitude: 6.4657, longitude: 3.5978 },
  },

  // Main gate / entrance
  {
    id: "wp-main-gate",
    coordinate: { latitude: 6.4644, longitude: 3.5963 },
  },

  // Extra path connectors
  {
    id: "wp-north-path",
    coordinate: { latitude: 6.4681, longitude: 3.5963 },
  },
  {
    id: "wp-lab-connector",
    coordinate: { latitude: 6.4676, longitude: 3.5984 },
  },
];
