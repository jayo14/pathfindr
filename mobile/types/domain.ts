export type BuildingCategory =
  | "faculty"
  | "department"
  | "library"
  | "lab"
  | "admin"
  | "facility"
  | "hostel";

export interface CampusCoordinate {
  latitude: number;
  longitude: number;
}

export interface Building {
  id: string;
  name: string;
  code: string;
  category: BuildingCategory;
  coordinate: CampusCoordinate;
  description: string;
  imageUrl: string;
  tags: string[];
  departments: string[];
  facilities: string[];
  openingHours: string;
}

export interface CampusEvent {
  id: string;
  title: string;
  description: string;
  dateLabel: string;
  startTime: string;
  locationName: string;
  buildingId: string;
  imageUrl: string;
  category: "academic" | "social" | "sports" | "career";
}

export interface LostItemReport {
  id: string;
  title: string;
  description: string;
  status: "lost" | "found";
  locationName: string;
  imageUrl: string;
  reportedAt: string;
  contactHint: string;
  buildingId?: string;
}

export interface RouteSegment {
  latitude: number;
  longitude: number;
}

export interface NavigationInstruction {
  instruction: string;
  distanceMeters: number;
  coordinate: RouteSegment;
}

export interface RouteSummary {
  points: RouteSegment[];
  distanceMeters: number;
  durationMinutes: number;
  instructions?: NavigationInstruction[];
}

export interface BuildingSearchFilters {
  query: string;
  category: BuildingCategory | "all";
}

export interface CachedCampusData {
  buildings: Building[];
  events: CampusEvent[];
  lostItems: LostItemReport[];
  updatedAt: string;
}

export interface StoredMapRegion {
  latitude: number;
  longitude: number;
  latitudeDelta: number;
  longitudeDelta: number;
}
