import { useQuery } from "@tanstack/react-query";

import { campusGraphNodes } from "@/constants/campusGraph";
import { CampusCoordinate, RouteSummary } from "@/types/domain";
import {
    createFallbackRoute,
    estimateWalkingMinutes,
    getDistanceMeters,
} from "@/utils/geo";
import {
    buildCampusGraph,
    dijkstra,
    nearestNode,
    pathToRouteSegments,
} from "@/utils/dijkstra";
import { astar } from "@/utils/astar";

/** Campus graph built once from the static waypoint list. */
const campusGraph = buildCampusGraph(campusGraphNodes);

/** Attempt to fetch a live walking route from OSRM (internet access required).
 *  Falls back to Dijkstra on the campus graph when unavailable. */
async function fetchWalkingRoute(
  origin: CampusCoordinate,
  destination: CampusCoordinate,
): Promise<RouteSummary> {
  const url = `https://router.project-osrm.org/route/v1/foot/${origin.longitude},${origin.latitude};${destination.longitude},${destination.latitude}?overview=full&geometries=geojson`;

  try {
    const response = await fetch(url);
    const payload = (await response.json()) as {
      routes?: Array<{
        distance: number;
        duration: number;
        geometry: {
          coordinates: [number, number][];
        };
      }>;
    };

    const route = payload.routes?.[0];

    if (!route) {
      throw new Error("Missing route");
    }

    return {
      distanceMeters: route.distance,
      durationMinutes: Math.max(1, Math.round(route.duration / 60)),
      points: route.geometry.coordinates.map(([longitude, latitude]) => ({
        latitude,
        longitude,
      })),
    };
  } catch {
    // Fall back to A* or Dijkstra's algorithm on the campus graph
    return computeDijkstraRoute(origin, destination);
  }
}

/** Compute a route using A* or Dijkstra's algorithm on the campus waypoint graph.
 *  Uses the haversine distance as the edge weight. */
function computeDijkstraRoute(
  origin: CampusCoordinate,
  destination: CampusCoordinate,
): RouteSummary {
  const startId = nearestNode(campusGraph, origin);
  const endId = nearestNode(campusGraph, destination);

  if (startId && endId) {
    const result = astar(campusGraph, startId, endId) ?? dijkstra(campusGraph, startId, endId);
    if (result && result.path.length > 1) {
      const segments = pathToRouteSegments(campusGraph, result.path);
      // Prepend the exact origin and append the exact destination
      const points = [origin, ...segments, destination];

      // Sum actual segment distances for accurate distance reporting
      let distanceMeters = 0;
      for (let i = 0; i < points.length - 1; i++) {
        distanceMeters += getDistanceMeters(points[i], points[i + 1]);
      }

      return {
        distanceMeters,
        durationMinutes: estimateWalkingMinutes(distanceMeters),
        points,
      };
    }
  }

  // Last resort: straight-line fallback
  const distanceMeters = getDistanceMeters(origin, destination);
  return {
    distanceMeters,
    durationMinutes: estimateWalkingMinutes(distanceMeters),
    points: createFallbackRoute(origin, destination),
  };
}

export function useDirections(
  origin?: CampusCoordinate,
  destination?: CampusCoordinate,
) {
  return useQuery({
    queryKey: [
      "directions",
      origin?.latitude,
      origin?.longitude,
      destination?.latitude,
      destination?.longitude,
    ],
    enabled: Boolean(origin && destination),
    queryFn: async () =>
      fetchWalkingRoute(
        origin as CampusCoordinate,
        destination as CampusCoordinate,
      ),
  });
}

export function useAStarDirections(
  origin?: CampusCoordinate,
  destination?: CampusCoordinate,
) {
  return useQuery({
    queryKey: [
      "astar-directions",
      origin?.latitude,
      origin?.longitude,
      destination?.latitude,
      destination?.longitude,
    ],
    enabled: Boolean(origin && destination),
    queryFn: async () =>
      computeDijkstraRoute(
        origin as CampusCoordinate,
        destination as CampusCoordinate,
      ),
  });
}
