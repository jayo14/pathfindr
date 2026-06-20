import {
    CampusCoordinate,
    RouteSegment,
    StoredMapRegion,
} from "@/types/domain";

export function toRadians(value: number): number {
  return (value * Math.PI) / 180;
}

export function getDistanceMeters(
  start: CampusCoordinate,
  end: CampusCoordinate,
): number {
  const earthRadius = 6371000;
  const deltaLatitude = toRadians(end.latitude - start.latitude);
  const deltaLongitude = toRadians(end.longitude - start.longitude);
  const startLatitude = toRadians(start.latitude);
  const endLatitude = toRadians(end.latitude);

  const haversine =
    Math.sin(deltaLatitude / 2) * Math.sin(deltaLatitude / 2) +
    Math.cos(startLatitude) *
      Math.cos(endLatitude) *
      Math.sin(deltaLongitude / 2) *
      Math.sin(deltaLongitude / 2);

  const arc = 2 * Math.atan2(Math.sqrt(haversine), Math.sqrt(1 - haversine));
  return earthRadius * arc;
}

export function formatDistance(distanceMeters: number): string {
  if (distanceMeters < 1000) {
    return `${Math.round(distanceMeters)} m`;
  }

  return `${(distanceMeters / 1000).toFixed(1)} km`;
}

export function estimateWalkingMinutes(distanceMeters: number): number {
  return Math.max(1, Math.round(distanceMeters / 78));
}

export function midpoint(
  start: CampusCoordinate,
  end: CampusCoordinate,
): CampusCoordinate {
  return {
    latitude: (start.latitude + end.latitude) / 2,
    longitude: (start.longitude + end.longitude) / 2,
  };
}

export function createFallbackRoute(
  start: CampusCoordinate,
  end: CampusCoordinate,
): RouteSegment[] {
  const center = midpoint(start, end);

  return [
    start,
    {
      latitude: center.latitude + 0.00022,
      longitude: center.longitude - 0.00014,
    },
    end,
  ];
}

export function getInitialRegion(region?: StoredMapRegion): StoredMapRegion {
  return (
    region ?? {
      latitude: 6.4664,
      longitude: 3.5962,
      latitudeDelta: 0.008,
      longitudeDelta: 0.008,
    }
  );
}
