import * as Haptics from 'expo-haptics';
import { router } from 'expo-router';
import {
  Locate,
  Search,
  Settings,
  User,
} from 'lucide-react-native';
import React, { useCallback, useMemo, useRef, useState } from 'react';
import {
  FlatList,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { MapCategoryFilter } from '@/components/MapCategoryFilter';
import { NativeMapView, NativeMarker, NativeMapViewRef } from '@/components/NativeMapView';
import { theme } from '@/constants/theme';
import { useBuildings } from '@/hooks/useCampusData';
import { useUserLocation } from '@/hooks/useUserLocation';
import { useAppStore } from '@/store/useAppStore';
import { Building, BuildingCategory, StoredMapRegion } from '@/types/domain';
import { clusterBuildings } from '@/utils/clustering';
import { formatDistance, getDistanceMeters, getInitialRegion } from '@/utils/geo';

// Category filters matching the spec
const SECTORS = ['All Sectors', 'Academic', 'Recreation', 'Sports & Parks', 'Core Services'] as const;
type Sector = typeof SECTORS[number];

const SECTOR_TO_CATEGORY: Record<Sector, BuildingCategory | 'all'> = {
  'All Sectors':   'all',
  'Academic':      'faculty',
  'Recreation':    'facility',
  'Sports & Parks':'lab',
  'Core Services': 'admin',
};

export default function MapScreen() {
  const mapRef = useRef<NativeMapViewRef>(null);
  const { buildings, isLoading } = useBuildings();
  const {
    location,
    locationPermissionStatus,
    requestPermission,
    refreshLocation,
    isLoading: isLocationLoading,
  } = useUserLocation();
  const lastMapRegion = useAppStore(s => s.lastMapRegion);
  const setLastMapRegion = useAppStore(s => s.setLastMapRegion);
  const setSelectedBuildingId = useAppStore(s => s.setSelectedBuildingId);

  const [currentRegion, setCurrentRegion] = useState<StoredMapRegion>(getInitialRegion(lastMapRegion));
  const [activeSector, setActiveSector] = useState<Sector>('All Sectors');
  const [selectedBuildingId, setLocalSelectedId] = useState<string | null>(null);

  const activeCategory = SECTOR_TO_CATEGORY[activeSector];

  const filteredBuildings = useMemo<Building[]>(() => {
    if (activeCategory === 'all') return buildings;
    return buildings.filter(b => b.category === activeCategory);
  }, [buildings, activeCategory]);

  const clusteredMarkers = useMemo<NativeMarker[]>(() => {
    const clusters = clusterBuildings(filteredBuildings, currentRegion);
    return clusters.map(c => ({
      id: c.id,
      coordinate: { latitude: c.latitude, longitude: c.longitude },
      title: c.title,
      color: c.color,
      isCluster: c.isCluster,
      clusterCount: c.count,
    }));
  }, [filteredBuildings, currentRegion]);

  const nearbyBuildings = useMemo<(Building & { distanceMeters: number })[]>(() => {
    if (!location) return filteredBuildings.map(b => ({ ...b, distanceMeters: 0 }));
    return filteredBuildings
      .map(b => ({ ...b, distanceMeters: getDistanceMeters(location, b.coordinate) }))
      .sort((a, b) => a.distanceMeters - b.distanceMeters);
  }, [filteredBuildings, location]);

  const selectedBuilding = useMemo(
    () => buildings.find(b => b.id === selectedBuildingId) ?? null,
    [buildings, selectedBuildingId],
  );

  const handleRegionChange = useCallback((region: StoredMapRegion) => {
    setCurrentRegion(region);
    setLastMapRegion(region);
  }, [setLastMapRegion]);

  const handleMarkerPress = useCallback((buildingId: string) => {
    void Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    setLocalSelectedId(buildingId);
    setSelectedBuildingId(buildingId);
  }, [setSelectedBuildingId]);

  const handleCenterOnUser = useCallback(async () => {
    void Haptics.selectionAsync();
    if (locationPermissionStatus !== 'granted') {
      await requestPermission();
      return;
    }
    await refreshLocation();
    if (location) {
      mapRef.current?.animateToRegion({
        latitude: location.latitude,
        longitude: location.longitude,
        latitudeDelta: 0.005,
        longitudeDelta: 0.005,
      }, 800);
    }
  }, [locationPermissionStatus, requestPermission, refreshLocation, location]);

  // Duration estimate: walking ~80m/min
  const walkMins = (m: number) => Math.max(1, Math.round(m / 80));

  return (
    <View style={styles.root}>
      {/* ── Full-screen map ─────────────────────────────────────────────── */}
      <NativeMapView
        ref={mapRef}
        region={getInitialRegion(lastMapRegion)}
        markers={clusteredMarkers}
        userLocation={location}
        onMarkerPress={handleMarkerPress}
        onRegionChangeComplete={handleRegionChange}
        style={styles.map}
        showsUserLocation={locationPermissionStatus === 'granted'}
      />

      {/* ── Top overlay (header + search + categories) ───────────────────── */}
      <SafeAreaView style={styles.topOverlay} edges={['top']} pointerEvents="box-none">
        {/* Header row */}
        <View style={styles.headerRow}>
          <View style={styles.headerLeft}>
            <Text style={styles.headerLabel}>LASUSTECH</Text>
            <Text style={styles.headerTitle}>Campus Guide</Text>
          </View>

          <View style={styles.headerRight}>
            <Pressable style={styles.headerBtn} onPress={() => router.push('/search')}>
              <Search size={18} color={theme.colors.primary} />
            </Pressable>
            <Pressable style={styles.headerBtn} onPress={() => router.push('/(tabs)/settings')}>
              <Settings size={18} color={theme.colors.text} />
            </Pressable>
            {/* Student profile avatar */}
            <Pressable
              style={styles.avatarBtn}
              onPress={() => router.push('/(tabs)/settings')}
              accessibilityLabel="Student profile"
            >
              <User size={18} color="#FFF" />
            </Pressable>
          </View>
        </View>

        {/* Search pill */}
        <Pressable style={styles.searchPill} onPress={() => router.push('/search')}>
          <Search size={16} color={theme.colors.textMuted} />
          <Text style={styles.searchPillText}>Search Nearby Campus…</Text>
          <Pressable style={styles.locateBtn} onPress={() => void handleCenterOnUser()}>
            <Locate size={16} color={theme.colors.primary} />
          </Pressable>
        </Pressable>

        {/* Sector filter chips */}
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.sectorRow}
          pointerEvents="box-none"
        >
          {SECTORS.map(s => {
            const active = s === activeSector;
            return (
              <Pressable
                key={s}
                style={[styles.sectorChip, active && styles.sectorChipActive]}
                onPress={() => { void Haptics.selectionAsync(); setActiveSector(s); }}
              >
                <Text style={[styles.sectorChipText, active && styles.sectorChipTextActive]}>{s}</Text>
              </Pressable>
            );
          })}
        </ScrollView>
      </SafeAreaView>

      {/* ── Bottom sheet: nearby places ──────────────────────────────────── */}
      <View style={styles.bottomSheet} pointerEvents="box-none">
        {/* Selected building highlight */}
        {selectedBuilding && (
          <View style={styles.selectedBar}>
            <Text style={styles.selectedLabel}>Selected:</Text>
            <Text style={styles.selectedName}>{selectedBuilding.name}</Text>
            <Pressable
              style={styles.selectedDirections}
              onPress={() => {
                void Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                router.push(`/directions?buildingId=${selectedBuilding.id}`);
              }}
            >
              <Text style={styles.selectedDirectionsText}>Directions</Text>
            </Pressable>
          </View>
        )}

        <Text style={styles.nearbyTitle}>Nearby Campus Places</Text>

        <FlatList
          data={nearbyBuildings.slice(0, 10)}
          keyExtractor={item => item.id}
          horizontal={false}
          scrollEnabled={false}
          renderItem={({ item }) => {
            const dist = location
              ? formatDistance(item.distanceMeters)
              : null;
            const mins = location ? walkMins(item.distanceMeters) : null;
            const isSelected = item.id === selectedBuildingId;

            return (
              <Pressable
                style={[styles.placeRow, isSelected && styles.placeRowSelected]}
                onPress={() => {
                  void Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                  handleMarkerPress(item.id);
                  router.push(`/building/${item.id}`);
                }}
              >
                {/* Thumbnail */}
                <View style={styles.placeThumb}>
                  <Text style={styles.placeCode}>{item.code}</Text>
                </View>

                {/* Info */}
                <View style={styles.placeInfo}>
                  <Text style={styles.placeName} numberOfLines={1}>{item.name}</Text>
                  <Text style={styles.placeCategory}>
                    {item.category.charAt(0).toUpperCase() + item.category.slice(1)} Facility
                  </Text>
                </View>

                {/* Distance badge */}
                {dist && mins ? (
                  <View style={styles.distBadge}>
                    <Text style={styles.distValue}>{dist}</Text>
                    <Text style={styles.distMins}>{mins} mins</Text>
                  </View>
                ) : (
                  <Pressable
                    style={styles.inspectBtn}
                    onPress={() => router.push(`/building/${item.id}`)}
                  >
                    <Text style={styles.inspectText}>INSPECT</Text>
                  </Pressable>
                )}
              </Pressable>
            );
          }}
        />
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: theme.colors.mapTint },
  map: { ...StyleSheet.absoluteFillObject },

  // Top overlay
  topOverlay: {
    position: 'absolute',
    top: 0, left: 0, right: 0,
    gap: 8,
    paddingBottom: 4,
  },
  headerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingTop: 6,
  },
  headerLeft: { gap: 1 },
  headerLabel: {
    fontSize: 10,
    fontFamily: 'Poppins_700Bold',
    color: theme.colors.primary,
    textTransform: 'uppercase',
    letterSpacing: 1,
  },
  headerTitle: {
    fontSize: 18,
    fontFamily: 'Poppins_800ExtraBold',
    color: theme.colors.text,
  },
  headerRight: { flexDirection: 'row', gap: 8 },
  headerBtn: {
    width: 38, height: 38, borderRadius: 12,
    backgroundColor: 'rgba(255,255,255,0.93)',
    alignItems: 'center', justifyContent: 'center',
    ...theme.shadow,
  },
  avatarBtn: {
    width: 38, height: 38, borderRadius: 19,
    backgroundColor: theme.colors.primary,
    alignItems: 'center', justifyContent: 'center',
    ...theme.shadow,
  },

  // Search pill
  searchPill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    marginHorizontal: 16,
    backgroundColor: 'rgba(255,255,255,0.96)',
    borderRadius: theme.radius.pill,
    paddingHorizontal: 16,
    paddingVertical: 12,
    ...theme.shadow,
  },
  searchPillText: {
    flex: 1,
    fontSize: 14,
    fontFamily: 'DMSans_400Regular',
    color: theme.colors.textMuted,
  },
  locateBtn: {
    width: 30, height: 30, borderRadius: 15,
    backgroundColor: theme.colors.surfaceAlt,
    alignItems: 'center', justifyContent: 'center',
  },

  // Sector chips
  sectorRow: { paddingHorizontal: 16, gap: 8 },
  sectorChip: {
    paddingHorizontal: 14,
    paddingVertical: 7,
    borderRadius: theme.radius.pill,
    backgroundColor: 'rgba(255,255,255,0.9)',
    borderWidth: 1,
    borderColor: theme.colors.border,
  },
  sectorChipActive: {
    backgroundColor: theme.colors.primary,
    borderColor: theme.colors.primary,
  },
  sectorChipText: {
    fontSize: 12,
    fontFamily: 'Poppins_700Bold',
    color: theme.colors.text,
  },
  sectorChipTextActive: { color: '#FFF' },

  // Bottom sheet
  bottomSheet: {
    position: 'absolute',
    bottom: 0, left: 0, right: 0,
    backgroundColor: 'rgba(255,255,255,0.97)',
    borderTopLeftRadius: 28,
    borderTopRightRadius: 28,
    paddingHorizontal: 18,
    paddingTop: 16,
    paddingBottom: 90, // clear tab bar
    maxHeight: '52%',
    ...theme.shadow,
  },

  // Selected building
  selectedBar: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    backgroundColor: theme.colors.surfaceAlt,
    borderRadius: 14,
    paddingHorizontal: 14,
    paddingVertical: 10,
    marginBottom: 12,
  },
  selectedLabel: { fontSize: 12, fontFamily: 'Poppins_700Bold', color: theme.colors.textMuted },
  selectedName: { flex: 1, fontSize: 14, fontFamily: 'Poppins_700Bold', color: theme.colors.text },
  selectedDirections: {
    backgroundColor: theme.colors.primary,
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: theme.radius.pill,
  },
  selectedDirectionsText: { fontSize: 12, fontFamily: 'Poppins_700Bold', color: '#FFF' },

  nearbyTitle: {
    fontSize: 16,
    fontFamily: 'Poppins_800ExtraBold',
    color: theme.colors.text,
    marginBottom: 10,
  },

  // Place row
  placeRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    paddingVertical: 10,
    borderBottomWidth: 1,
    borderBottomColor: theme.colors.border,
  },
  placeRowSelected: {
    backgroundColor: theme.colors.surfaceAlt,
    borderRadius: 12,
    paddingHorizontal: 8,
    borderBottomWidth: 0,
    marginHorizontal: -8,
  },
  placeThumb: {
    width: 44, height: 44, borderRadius: 12,
    backgroundColor: theme.colors.surfaceAlt,
    alignItems: 'center', justifyContent: 'center',
  },
  placeCode: { fontSize: 11, fontFamily: 'Poppins_800ExtraBold', color: theme.colors.primary },
  placeInfo: { flex: 1 },
  placeName: { fontSize: 14, fontFamily: 'Poppins_700Bold', color: theme.colors.text },
  placeCategory: { fontSize: 12, fontFamily: 'DMSans_400Regular', color: theme.colors.textMuted, marginTop: 2 },
  distBadge: { alignItems: 'flex-end', gap: 2 },
  distValue: { fontSize: 13, fontFamily: 'Poppins_800ExtraBold', color: theme.colors.primary },
  distMins: { fontSize: 11, fontFamily: 'DMSans_400Regular', color: theme.colors.textMuted },
  inspectBtn: {
    backgroundColor: theme.colors.primary,
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 8,
  },
  inspectText: { fontSize: 11, fontFamily: 'Poppins_700Bold', color: '#FFF' },
});
