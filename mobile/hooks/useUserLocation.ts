import * as Location from "expo-location";
import { useCallback, useEffect, useRef, useState } from "react";

import { useAppStore } from "@/store/useAppStore";
import { CampusCoordinate } from "@/types/domain";

export function useUserLocation() {
  const [location, setLocation] = useState<CampusCoordinate | undefined>(
    undefined,
  );
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | undefined>(undefined);
  const locationPermissionStatus = useAppStore(
    (state) => state.locationPermissionStatus,
  );
  const setLocationPermissionStatus = useAppStore(
    (state) => state.setLocationPermissionStatus,
  );
  const watchSubscriptionRef = useRef<Location.LocationSubscription | null>(
    null,
  );

  const requestPermission = useCallback(async (): Promise<boolean> => {
    setIsLoading(true);
    setError(undefined);

    try {
      const permission = await Location.requestForegroundPermissionsAsync();
      const status = permission.status === "granted" ? "granted" : "denied";
      setLocationPermissionStatus(status);
      return permission.status === "granted";
    } catch (requestError) {
      console.log("PathFindr location permission error", requestError);
      setError("We could not request your location permission.");
      setLocationPermissionStatus("denied");
      return false;
    } finally {
      setIsLoading(false);
    }
  }, [setLocationPermissionStatus]);

  const refreshLocation = useCallback(async (): Promise<void> => {
    setIsLoading(true);
    setError(undefined);

    try {
      const current = await Location.getCurrentPositionAsync({
        accuracy: Location.Accuracy.High,
      });
      setLocation({
        latitude: current.coords.latitude,
        longitude: current.coords.longitude,
      });
    } catch (locationError) {
      console.log("PathFindr location fetch error", locationError);
      setError("Unable to get your live position right now.");
    } finally {
      setIsLoading(false);
    }
  }, []);

  /** Start watching the device GPS for continuous position updates. */
  const startWatchingLocation = useCallback(async (): Promise<void> => {
    if (watchSubscriptionRef.current) return; // already watching

    try {
      const subscription = await Location.watchPositionAsync(
        {
          accuracy: Location.Accuracy.High,
          timeInterval: 4000,
          distanceInterval: 5,
        },
        (pos) => {
          setLocation({
            latitude: pos.coords.latitude,
            longitude: pos.coords.longitude,
          });
          setError(undefined);
        },
      );
      watchSubscriptionRef.current = subscription;
    } catch (watchError) {
      console.log("PathFindr GPS watch error", watchError);
    }
  }, []);

  /** Stop watching GPS. */
  const stopWatchingLocation = useCallback((): void => {
    watchSubscriptionRef.current?.remove();
    watchSubscriptionRef.current = null;
  }, []);

  // Auto-start watching when permission is granted
  useEffect(() => {
    if (locationPermissionStatus === "granted") {
      void refreshLocation();
      void startWatchingLocation();
    } else {
      stopWatchingLocation();
    }

    return () => {
      stopWatchingLocation();
    };
    // startWatchingLocation and stopWatchingLocation are stable useCallback refs
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [locationPermissionStatus, refreshLocation]);

  return {
    location,
    isLoading,
    error,
    locationPermissionStatus,
    requestPermission,
    refreshLocation,
    startWatchingLocation,
    stopWatchingLocation,
  };
}
