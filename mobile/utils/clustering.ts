import { categoryColors } from "@/constants/theme";
import { Building, StoredMapRegion } from "@/types/domain";

export interface ClusteredBuildingMarker {
  id: string;
  latitude: number;
  longitude: number;
  count: number;
  buildingIds: string[];
  title: string;
  color: string;
  isCluster: boolean;
}

function thresholdForRegion(region: StoredMapRegion): number {
  return Math.max(region.latitudeDelta * 0.18, 0.00045);
}

const clusterCache = new Map<string, ClusteredBuildingMarker[]>();

export function clusterBuildings(
  buildings: Building[],
  region: StoredMapRegion,
): ClusteredBuildingMarker[] {
  const key = `${region.latitudeDelta.toFixed(4)}-${buildings.length}`;
  if (clusterCache.has(key)) return clusterCache.get(key)!;

  let start = 0;
  if (__DEV__) {
    start = performance.now();
  }

  const threshold = thresholdForRegion(region);
  const clusters: ClusteredBuildingMarker[] = [];

  buildings.forEach((building) => {
    const match = clusters.find((cluster) => {
      const latitudeGap = Math.abs(
        cluster.latitude - building.coordinate.latitude,
      );
      const longitudeGap = Math.abs(
        cluster.longitude - building.coordinate.longitude,
      );
      return latitudeGap < threshold && longitudeGap < threshold;
    });

    if (match) {
      const nextCount = match.count + 1;
      match.latitude =
        (match.latitude * match.count + building.coordinate.latitude) /
        nextCount;
      match.longitude =
        (match.longitude * match.count + building.coordinate.longitude) /
        nextCount;
      match.count = nextCount;
      match.buildingIds.push(building.id);
      match.title = `${nextCount} places`;
      match.color = "#0D8C60";
      match.isCluster = true;
      return;
    }

    clusters.push({
      id: building.id,
      latitude: building.coordinate.latitude,
      longitude: building.coordinate.longitude,
      count: 1,
      buildingIds: [building.id],
      title: building.name,
      color: categoryColors[building.category],
      isCluster: false,
    });
  });

  clusterCache.set(key, clusters);
  if (clusterCache.size > 50) clusterCache.clear(); // prevent memory leak

  if (__DEV__) {
    console.log(`[PathFindr] Clustering took ${(performance.now() - start).toFixed(1)}ms for ${buildings.length} buildings`);
  }

  return clusters;
}
