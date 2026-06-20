import { useQuery } from "@tanstack/react-query";
import { useMemo } from "react";

import { getCampusData } from "@/services/campus-service";
import {
    Building,
    BuildingCategory,
    CampusEvent,
    LostItemReport,
} from "@/types/domain";

export function useCampusData() {
  return useQuery({
    queryKey: ["campus-data"],
    queryFn: getCampusData,
  });
}

export function useBuildings() {
  const query = useCampusData();

  const buildings = useMemo<Building[]>(
    () => query.data?.buildings ?? [],
    [query.data?.buildings],
  );

  return {
    ...query,
    buildings,
  };
}

export function useEvents() {
  const query = useCampusData();

  const events = useMemo<CampusEvent[]>(
    () => query.data?.events ?? [],
    [query.data?.events],
  );

  return {
    ...query,
    events,
  };
}

export function useLostAndFound() {
  const query = useCampusData();

  const reports = useMemo<LostItemReport[]>(
    () => query.data?.lostItems ?? [],
    [query.data?.lostItems],
  );

  return {
    ...query,
    reports,
  };
}

export function useFilteredBuildings(
  queryText: string,
  category: BuildingCategory | "all",
) {
  const { buildings, ...query } = useBuildings();

  const filtered = useMemo<Building[]>(() => {
    const normalizedQuery = queryText.trim().toLowerCase();

    return buildings.filter((building) => {
      const matchesCategory =
        category === "all" ? true : building.category === category;
      const matchesQuery =
        normalizedQuery.length === 0
          ? true
          : [
              building.name,
              building.code,
              ...building.tags,
              ...building.departments,
              ...building.facilities,
            ]
              .join(" ")
              .toLowerCase()
              .includes(normalizedQuery);

      return matchesCategory && matchesQuery;
    });
  }, [buildings, category, queryText]);

  return {
    ...query,
    buildings: filtered,
  };
}
