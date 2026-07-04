import AsyncStorage from "@react-native-async-storage/async-storage";
import { apiRequest } from "./api-client";
import { campusBuildings, campusEvents, lostItemReports } from "@/mocks/campus";
import {
  Building,
  CachedCampusData,
  CampusEvent,
  LostItemReport,
} from "@/types/domain";

const CAMPUS_CACHE_KEY = "pathfindr-campus-cache";

// ── Cache helpers ─────────────────────────────────────────────────────────

async function readCachedCampusData(): Promise<CachedCampusData | null> {
  const raw = await AsyncStorage.getItem(CAMPUS_CACHE_KEY);
  if (!raw) return null;
  try {
    return JSON.parse(raw) as CachedCampusData;
  } catch {
    return null;
  }
}

async function writeCachedCampusData(data: CachedCampusData): Promise<void> {
  await AsyncStorage.setItem(CAMPUS_CACHE_KEY, JSON.stringify(data));
}

// ── Campus aggregate ──────────────────────────────────────────────────────

/**
 * Fetches all campus data in one shot via GET /campus/.
 * Falls back to individual endpoints, then to local cache, then to mocks.
 */
export async function getCampusData(): Promise<CachedCampusData> {
  const cached = await readCachedCampusData();

  try {
    // Try the aggregate endpoint first (one round-trip)
    const aggregate = await getCampusAggregate();
    await writeCachedCampusData(aggregate);
    return aggregate;
  } catch {
    // Fall back to parallel individual requests
    try {
      const [buildings, events, lostItems] = await Promise.all([
        apiRequest<Building[]>("/buildings/"),
        apiRequest<CampusEvent[]>("/events/"),
        apiRequest<LostItemReport[]>("/lost-items/"),
      ]);
      const next: CachedCampusData = {
        buildings,
        events,
        lostItems,
        updatedAt: new Date().toISOString(),
      };
      await writeCachedCampusData(next);
      return next;
    } catch {
      if (cached) return cached;
      return {
        buildings: campusBuildings,
        events: campusEvents,
        lostItems: lostItemReports,
        updatedAt: new Date().toISOString(),
      };
    }
  }
}

/** GET /campus/ — all data in one request */
export async function getCampusAggregate(): Promise<CachedCampusData> {
  return apiRequest<CachedCampusData>("/campus/");
}

// ── Buildings ─────────────────────────────────────────────────────────────

/** GET /buildings/<id>/ */
export async function getBuildingById(id: string | number): Promise<Building> {
  return apiRequest<Building>(`/buildings/${id}/`);
}

/**
 * GET /buildings/search/?q=<query>&category=<cat>
 * Returns up to 20 results instantly.
 */
export async function searchBuildings(
  query: string,
  category?: string,
): Promise<Building[]> {
  const params: Record<string, string> = { q: query };
  if (category && category !== "all") params.category = category;
  return apiRequest<Building[]>("/buildings/search/", { params });
}

// ── Events ────────────────────────────────────────────────────────────────

/** GET /events/<id>/ */
export async function getEventById(id: string | number): Promise<CampusEvent> {
  return apiRequest<CampusEvent>(`/events/${id}/`);
}

// ── Lost & Found ──────────────────────────────────────────────────────────

/** POST /lost-items/ */
export async function submitLostAndFoundReport(
  report: Partial<LostItemReport>,
): Promise<LostItemReport> {
  return apiRequest<LostItemReport>("/lost-items/", {
    method: "POST",
    body: JSON.stringify({
      title: report.title,
      description: report.description ?? "",
      status: report.status ?? "lost",
      location_name: report.locationName,
      contact_hint: report.contactHint ?? "",
      image_url: report.imageUrl ?? "",
    }),
  });
}

/**
 * PATCH /lost-items/<id>/
 * Use to claim an item (status → 'found') or update contact details.
 */
export async function updateLostItem(
  id: string | number,
  patch: Partial<Pick<LostItemReport, "status" | "contactHint" | "description">>,
): Promise<LostItemReport> {
  const payload: Record<string, unknown> = {};
  if (patch.status !== undefined) payload.status = patch.status;
  if (patch.contactHint !== undefined) payload.contact_hint = patch.contactHint;
  if (patch.description !== undefined) payload.description = patch.description;

  return apiRequest<LostItemReport>(`/lost-items/${id}/`, {
    method: "PATCH",
    body: JSON.stringify(payload),
  });
}

/** DELETE /lost-items/<id>/ */
export async function deleteLostItem(id: string | number): Promise<void> {
  await apiRequest<void>(`/lost-items/${id}/`, { method: "DELETE" });
}

// ── Profile ───────────────────────────────────────────────────────────────

/** GET /profile/ */
export async function getProfile(): Promise<Record<string, unknown>> {
  return apiRequest("/profile/");
}

/** PATCH /profile/ */
export async function updateProfile(profileData: Record<string, unknown>): Promise<Record<string, unknown>> {
  return apiRequest("/profile/", {
    method: "PATCH",
    body: JSON.stringify(profileData),
  });
}

// ── Survey ────────────────────────────────────────────────────────────────

/** POST /surveys/ */
export async function submitSurvey(
  responses: Record<string, unknown>,
): Promise<unknown> {
  return apiRequest("/surveys/", {
    method: "POST",
    body: JSON.stringify({ responses }),
  });
}
