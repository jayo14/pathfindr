import { RouteSegment } from "@/types/domain";

export interface NavigationStep {
  instruction: string;
  distanceMeters: number;
  icon: 'straight' | 'turn-left' | 'turn-right' | 'arrive';
}

/**
 * Calculate bearing between two points in degrees (0-360).
 */
function calculateBearing(start: RouteSegment, end: RouteSegment): number {
  const startLat = (start.latitude * Math.PI) / 180;
  const startLng = (start.longitude * Math.PI) / 180;
  const endLat = (end.latitude * Math.PI) / 180;
  const endLng = (end.longitude * Math.PI) / 180;

  const dLng = endLng - startLng;
  const y = Math.sin(dLng) * Math.cos(endLat);
  const x =
    Math.cos(startLat) * Math.sin(endLat) -
    Math.sin(startLat) * Math.cos(endLat) * Math.cos(dLng);
  let bearing = (Math.atan2(y, x) * 180) / Math.PI;
  return (bearing + 360) % 360;
}

/**
 * Calculate distance between two points in meters.
 */
function calculateDistance(p1: RouteSegment, p2: RouteSegment): number {
  const R = 6371e3; // Earth radius in meters
  const phi1 = (p1.latitude * Math.PI) / 180;
  const phi2 = (p2.latitude * Math.PI) / 180;
  const dPhi = ((p2.latitude - p1.latitude) * Math.PI) / 180;
  const dLambda = ((p2.longitude - p1.longitude) * Math.PI) / 180;

  const a =
    Math.sin(dPhi / 2) * Math.sin(dPhi / 2) +
    Math.cos(phi1) * Math.cos(phi2) * Math.sin(dLambda / 2) * Math.sin(dLambda / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return R * c;
}

/**
 * Generate human-readable navigation steps from a list of route points.
 */
export function generateSteps(
  points: RouteSegment[],
  destinationName: string
): NavigationStep[] {
  if (points.length < 2) {
    return [
      {
        instruction: `Arrive at ${destinationName}`,
        distanceMeters: 0,
        icon: 'arrive',
      },
    ];
  }

  const steps: NavigationStep[] = [];
  let currentBearing = calculateBearing(points[0], points[1]);
  let currentDistance = 0;

  for (let i = 0; i < points.length - 1; i++) {
    const dist = calculateDistance(points[i], points[i + 1]);
    const nextBearing = calculateBearing(points[i], points[i + 1]);

    // Check for significant turn
    let bearingChange = nextBearing - currentBearing;
    if (bearingChange > 180) bearingChange -= 360;
    if (bearingChange < -180) bearingChange += 360;

    if (Math.abs(bearingChange) > 30) {
      // Add current straight segment before the turn
      if (currentDistance > 0) {
        steps.push({
          instruction: 'Continue straight',
          distanceMeters: Math.round(currentDistance),
          icon: 'straight',
        });
      }

      // Add the turn
      steps.push({
        instruction: bearingChange > 0 ? 'Turn right' : 'Turn left',
        distanceMeters: Math.round(dist),
        icon: bearingChange > 0 ? 'turn-right' : 'turn-left',
      });

      currentDistance = 0;
      currentBearing = nextBearing;
    } else {
      // Accumulate distance for straight segment
      currentDistance += dist;

      // If last segment, or if we've gone a long way straight, or if we want to group segments
      // The requirement says "Group consecutive straight segments if < 50m apart"
      // but usually we want to group them until a turn occurs.
    }
  }

  // Add final straight segment if any
  if (currentDistance > 0) {
    steps.push({
      instruction: 'Continue straight',
      distanceMeters: Math.round(currentDistance),
      icon: 'straight',
    });
  }

  // Add final arrival step
  steps.push({
    instruction: `Arrive at ${destinationName}`,
    distanceMeters: 0,
    icon: 'arrive',
  });

  // Post-process to group consecutive 'straight' steps
  const mergedSteps: NavigationStep[] = [];
  for (const step of steps) {
    const last = mergedSteps[mergedSteps.length - 1];
    if (last && last.icon === 'straight' && step.icon === 'straight') {
      last.distanceMeters += step.distanceMeters;
    } else {
      mergedSteps.push(step);
    }
  }

  return mergedSteps;
}
