import { useQuery } from "@tanstack/react-query";
import { useMemo } from "react";

import {
  getCampusData,
  getEventById,
  searchBuildings as apiBuildingSearch,
} from "@/services/campus-service";
import {
  Building,
  BuildingCategory,
  CampusEvent,
  LostItemReport,
} from "@/types/domain";
import { searchBuildings } from "@/utils/search";

// ── Campus aggregate ──────────────────────────────────────────────────────

export function useCampusData() {
  return useQuery({
    queryKey: ["campus-data"],
    queryFn: getCampusData,
    staleTime: 5 * 60 * 1000,
  });
}

// ── Buildings ─────────────────────────────────────────────────────────────

export function useBuildings() {
  const query = useCampusData();
  const buildings = useMemo<Building[]>(
    () => query.data?.buildings ?? [],
    [query.data?.buildings],
  );
  return { ...query, buildings };
}

export function useFilteredBuildings(
  queryText: string,
  category: BuildingCategory | "all",
) {
  const { buildings, ...query } = useBuildings();
  const filtered = useMemo<Building[]>(
    () => searchBuildings(buildings, { query: queryText, category }),
    [buildings, category, queryText],
  );
  return { ...query, buildings: filtered };
}

/**
 * Live search via GET /buildings/search/?q=...
 * Only fires when query has ≥2 chars.
 */
export function useBuildingSearch(query: string, category?: string) {
  return useQuery({
    queryKey: ["building-search", query, category],
    queryFn: () => apiBuildingSearch(query, category),
    enabled: query.trim().length >= 2,
    staleTime: 30 * 1000,
  });
}

// ── Events ────────────────────────────────────────────────────────────────

export function useEvents() {
  const query = useCampusData();
  const events = useMemo<CampusEvent[]>(
    () => query.data?.events ?? [],
    [query.data?.events],
  );
  return { ...query, events };
}

/**
 * Fetches a single event from GET /events/<id>/.
 * Pre-populates with cached data so the UI renders immediately.
 */
export function useEvent(id: string | undefined) {
  const { data: campusData } = useCampusData();
  const cachedEvent = campusData?.events.find((e) => e.id === id);

  return useQuery({
    queryKey: ["event", id],
    queryFn: () => getEventById(id!),
    enabled: !!id,
    placeholderData: cachedEvent,
    staleTime: 2 * 60 * 1000,
  });
}

// ── Lost & Found ──────────────────────────────────────────────────────────

export function useLostAndFound() {
  const query = useCampusData();
  const reports = useMemo<LostItemReport[]>(
    () => query.data?.lostItems ?? [],
    [query.data?.lostItems],
  );
  return { ...query, reports };
}
