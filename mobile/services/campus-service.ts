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

async function readCachedCampusData(): Promise<CachedCampusData | null> {
  const rawCache = await AsyncStorage.getItem(CAMPUS_CACHE_KEY);
  if (!rawCache) return null;
  try {
    return JSON.parse(rawCache) as CachedCampusData;
  } catch (error) {
    console.log("PathFindr cache parse error", error);
    return null;
  }
}

async function writeCachedCampusData(data: CachedCampusData): Promise<void> {
  await AsyncStorage.setItem(CAMPUS_CACHE_KEY, JSON.stringify(data));
}

export async function getCampusData(): Promise<CachedCampusData> {
  const cached = await readCachedCampusData();

  try {
    const [buildings, events] = await Promise.all([
      apiRequest<Building[]>('/buildings/'),
      apiRequest<CampusEvent[]>('/events/'),
    ]);

    const lostItems = await apiRequest<LostItemReport[]>('/lost-items/');

    const nextData: CachedCampusData = {
      buildings,
      events,
      lostItems,
      updatedAt: new Date().toISOString(),
    };

    await writeCachedCampusData(nextData);
    return nextData;
  } catch (error) {
    console.log("PathFindr campus data fallback to cache", error);
    if (cached) return cached;
    return {
      buildings: campusBuildings,
      events: campusEvents,
      lostItems: lostItemReports,
      updatedAt: new Date().toISOString(),
    };
  }
}


export async function getBuildingById(id: string): Promise<Building> {
  return apiRequest<Building>(`/buildings/${id}/`);
}
export async function submitLostAndFoundReport(
  report: Partial<LostItemReport>,
): Promise<LostItemReport> {
  return apiRequest<LostItemReport>('/lost-items/', {
    method: 'POST',
    body: JSON.stringify(report),
  });
}

export async function submitSurvey(responses: Record<string, any>): Promise<any> {
    return apiRequest('/surveys/', {
        method: 'POST',
        body: JSON.stringify({ responses }),
    });
}

export async function updateProfile(profileData: any): Promise<any> {
    return apiRequest('/profile/', {
        method: 'PATCH',
        body: JSON.stringify(profileData),
    });
}
