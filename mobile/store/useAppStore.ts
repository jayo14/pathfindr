import AsyncStorage from "@react-native-async-storage/async-storage";
import { create } from "zustand";
import { createJSONStorage, persist } from "zustand/middleware";

import { StoredMapRegion } from "@/types/domain";

interface AppStoreState {
  // Auth
  isAuthenticated: boolean;
  isGuest: boolean;
  userEmail?: string;
  // Onboarding
  hasCompletedOnboarding: boolean;
  hasCompletedFreshersTour: boolean;
  // Map
  lastMapRegion?: StoredMapRegion;
  selectedBuildingId?: string;
  locationPermissionStatus: "unknown" | "granted" | "denied";
  // Actions
  setIsAuthenticated: (value: boolean) => void;
  setIsGuest: (value: boolean) => void;
  setUserEmail: (email?: string) => void;
  setHasCompletedOnboarding: (value: boolean) => void;
  setHasCompletedFreshersTour: (value: boolean) => void;
  setLastMapRegion: (region: StoredMapRegion) => void;
  setSelectedBuildingId: (buildingId?: string) => void;
  setLocationPermissionStatus: (
    status: "unknown" | "granted" | "denied",
  ) => void;
  logout: () => void;
}

export const useAppStore = create<AppStoreState>()(
  persist(
    (set) => ({
      isAuthenticated: false,
      isGuest: false,
      userEmail: undefined,
      hasCompletedOnboarding: false,
      hasCompletedFreshersTour: false,
      lastMapRegion: undefined,
      selectedBuildingId: undefined,
      locationPermissionStatus: "unknown",
      setIsAuthenticated: (value: boolean) =>
        set({ isAuthenticated: value }),
      setIsGuest: (value: boolean) =>
        set({ isGuest: value }),
      setUserEmail: (email?: string) =>
        set({ userEmail: email }),
      setHasCompletedOnboarding: (value: boolean) =>
        set({ hasCompletedOnboarding: value }),
      setHasCompletedFreshersTour: (value: boolean) =>
        set({ hasCompletedFreshersTour: value }),
      setLastMapRegion: (region: StoredMapRegion) =>
        set({ lastMapRegion: region }),
      setSelectedBuildingId: (buildingId?: string) =>
        set({ selectedBuildingId: buildingId }),
      setLocationPermissionStatus: (status: "unknown" | "granted" | "denied") =>
        set({ locationPermissionStatus: status }),
      logout: () =>
        set({ isAuthenticated: false, isGuest: false, userEmail: undefined }),
    }),
    {
      name: "pathfindr-app-store",
      storage: createJSONStorage(() => AsyncStorage),
      partialize: (state) => ({
        isAuthenticated: state.isAuthenticated,
        isGuest: state.isGuest,
        userEmail: state.userEmail,
        hasCompletedOnboarding: state.hasCompletedOnboarding,
        hasCompletedFreshersTour: state.hasCompletedFreshersTour,
        lastMapRegion: state.lastMapRegion,
        locationPermissionStatus: state.locationPermissionStatus,
      }),
    },
  ),
);
