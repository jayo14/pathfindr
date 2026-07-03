import * as Haptics from 'expo-haptics';
import { useEffect, useRef, useState } from 'react';

import { CampusCoordinate } from '@/types/domain';
import { getDistanceMeters } from '@/utils/geo';

const DEFAULT_THRESHOLD_METERS = 15;
/** Minimum milliseconds between distance checks to avoid draining the battery. */
const CHECK_INTERVAL_MS = 3000;

interface UseArrivalDetectionOptions {
  /** The target coordinate the user is navigating toward. */
  destination: CampusCoordinate | undefined;
  /** Live user position, updated externally (e.g. from useUserLocation). */
  userLocation: CampusCoordinate | undefined;
  /**
   * Distance in metres within which arrival is declared.
   * Defaults to 15 m.
   */
  thresholdMeters?: number;
  /**
   * When false the hook is dormant — no checks, no haptic, no state change.
   * Set to true only while an active route is in progress so the detection
   * does not re-fire on incidental proximity.
   */
  isActive: boolean;
}

interface UseArrivalDetectionResult {
  /** True after the user has arrived at the destination (fires once per activation). */
  hasArrived: boolean;
  /** Call this to reset arrival state, e.g. when starting a new route. */
  resetArrival: () => void;
}

/**
 * Watches the live distance between `userLocation` and `destination`.
 * Fires exactly once per activation (isActive=true session) when the user
 * comes within `thresholdMeters`. Triggers a haptic notification and sets
 * `hasArrived` to true. Resets cleanly when `isActive` flips back to false
 * or when `resetArrival` is called explicitly.
 *
 * Distance checks are throttled to at most once every 3 s to preserve battery.
 */
export function useArrivalDetection({
  destination,
  userLocation,
  thresholdMeters = DEFAULT_THRESHOLD_METERS,
  isActive,
}: UseArrivalDetectionOptions): UseArrivalDetectionResult {
  const [hasArrived, setHasArrived] = useState(false);

  // Track whether we have already fired for this activation to guarantee
  // exactly-once semantics without relying on stale closure state.
  const hasArrivedRef = useRef(false);
  // Timestamp of the last distance check (ms epoch).
  const lastCheckRef = useRef<number>(0);

  // Reset when the hook becomes inactive (e.g. user stops navigation or
  // starts a new route).
  useEffect(() => {
    if (!isActive) {
      hasArrivedRef.current = false;
      setHasArrived(false);
      lastCheckRef.current = 0;
    }
  }, [isActive]);

  useEffect(() => {
    // Guard: only run checks while navigation is active, destination is set,
    // user location is known, and arrival hasn't been detected yet.
    if (!isActive || !destination || !userLocation || hasArrivedRef.current) {
      return;
    }

    const now = Date.now();
    if (now - lastCheckRef.current < CHECK_INTERVAL_MS) {
      // Too soon since the last check — skip to avoid excessive computation.
      return;
    }
    lastCheckRef.current = now;

    const distance = getDistanceMeters(userLocation, destination);

    if (distance <= thresholdMeters) {
      // Mark as arrived immediately via ref to prevent any concurrent tick
      // from also firing (the state setter is async).
      hasArrivedRef.current = true;
      setHasArrived(true);

      // Deliver satisfying haptic feedback: a heavy impact followed by a
      // notification success pattern.
      void Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Heavy).then(() =>
        Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success),
      );
    }
  }, [userLocation, destination, isActive, thresholdMeters]);

  const resetArrival = () => {
    hasArrivedRef.current = false;
    lastCheckRef.current = 0;
    setHasArrived(false);
  };

  return { hasArrived, resetArrival };
}
