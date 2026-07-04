import * as Haptics from 'expo-haptics';
import { router, useLocalSearchParams } from 'expo-router';
import {
  Locate,
  Search,
  Settings,
  User,
  MapPin,
  X,
  Navigation2,
} from 'lucide-react-native';
import React, { useCallback, useMemo, useRef, useState, useEffect } from 'react';
import {
  Animated,
  FlatList,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { NativeMapView, NativeMarker, NativeMapViewRef } from '@/components/NativeMapView';
import { theme } from '@/constants/theme';
import { useBuildings } from '@/hooks/useCampusData';
import { useUserLocation } from '@/hooks/useUserLocation';
import { useAppStore } from '@/store/useAppStore';
import { Building, BuildingCategory, StoredMapRegion } from '@/types/domain';
import { clusterBuildings } from '@/utils/clustering';
import { formatDistance, getDistanceMeters, getInitialRegion } from '@/utils/geo';
import { searchBuildings } from '@/utils/search';

const SECTORS = ['All', 'Academic', 'Recreation', 'Sports', 'Services'] as const;
type Sector = typeof SECTORS[number];

const SECTOR_TO_CATEGORY: Record<Sector, BuildingCategory | 'all'> = {
  'All':        'all',
  'Academic':   'faculty',
  'Recreation': 'facility',
  'Sports':     'lab',
  'Services':   'admin',
};

export default function MapScreen() {
  const mapRef = useRef<NativeMapViewRef>(null);
  const searchInputRef = useRef<TextInput>(null);
  const params = useLocalSearchParams<{ focusSearch?: string }>();
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
  const [activeSector, setActiveSector] = useState<Sector>('All');
  const [selectedBuildingId, setLocalSelectedId] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [isSearchFocused, setIsSearchFocused] = useState(false);

  // Animate search suggestions in/out
  const suggestionAnim = useRef(new Animated.Value(0)).current;

  const showingSuggestions = searchQuery.trim().length > 0 && isSearchFocused;

  useEffect(() => {
    Animated.spring(suggestionAnim, {
      toValue: showingSuggestions ? 1 : 0,
      useNativeDriver: true,
      tension: 60,
      friction: 9,
    }).start();
  }, [showingSuggestions]);

  useEffect(() => {
    if (params.focusSearch === 'true') {
      setTimeout(() => {
        searchInputRef.current?.focus();
      }, 300);
    }
  }, [params.focusSearch]);

  const activeCategory = SECTOR_TO_CATEGORY[activeSector];

  const filteredBuildings = useMemo<Building[]>(() => {
    let result = buildings;
    if (activeCategory !== 'all') {
      result = result.filter(b => b.category === activeCategory);
    }
    if (searchQuery.trim() !== '') {
      result = searchBuildings(result, { query: searchQuery });
    }
    return result;
  }, [buildings, activeCategory, searchQuery]);

  const handleSelectBuilding = useCallback((building: Building) => {
    void Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    setSearchQuery(building.name);
    setLocalSelectedId(building.id);
    setSelectedBuildingId(building.id);
    setIsSearchFocused(false);
    searchInputRef.current?.blur();

    if (building.coordinate) {
      mapRef.current?.animateToRegion({
        latitude: building.coordinate.latitude,
        longitude: building.coordinate.longitude,
        latitudeDelta: 0.004,
        longitudeDelta: 0.004,
      }, 700);
    }
  }, [setSelectedBuildingId]);

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
      }, 700);
    }
  }, [locationPermissionStatus, requestPermission, refreshLocation, location]);

  const handleClearSearch = useCallback(() => {
    setSearchQuery('');
    setLocalSelectedId(null);
    setSelectedBuildingId(undefined);
    searchInputRef.current?.focus();
  }, [setSelectedBuildingId]);

  const walkMins = (m: number) => Math.max(1, Math.round(m / 80));

  return (
    <View style={styles.root}>
      {/* Full-screen map */}
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

      {/* Top overlay: header + search + chips */}
      <SafeAreaView style={styles.topOverlay} edges={['top']} pointerEvents="box-none">
        {/* Header row */}
        <View style={styles.headerRow}>
          <View style={styles.headerLeft}>
            <Text style={styles.headerLabel}>LASUSTECH</Text>
            <Text style={styles.headerTitle}>Campus Guide</Text>
          </View>
          <View style={styles.headerRight}>
            <Pressable
              style={styles.headerBtn}
              onPress={() => router.push('/(tabs)/settings')}
              accessible={true}
              accessibilityRole="button"
              accessibilityLabel="Open settings"
            >
              <Settings size={18} color={theme.colors.text} />
            </Pressable>
            <Pressable
              style={styles.avatarBtn}
              onPress={() => router.push('/(tabs)/settings')}
              accessible={true}
              accessibilityRole="button"
              accessibilityLabel="Profile"
              accessibilityHint="Opens your account settings"
            >
              <User size={18} color="#FFF" />
            </Pressable>
          </View>
        </View>

        {/* Search pill */}
        <View
          style={[styles.searchPill, isSearchFocused && styles.searchPillFocused]}
          accessible={false}
        >
          {/* Decorative icon */}
          <Search
            size={16}
            color={isSearchFocused ? theme.colors.primary : theme.colors.textMuted}
            accessibilityElementsHidden
            importantForAccessibility="no"
          />
          <TextInput
            ref={searchInputRef}
            style={styles.searchPillInput}
            value={searchQuery}
            onChangeText={setSearchQuery}
            placeholder="Search buildings, facilities…"
            placeholderTextColor={theme.colors.textMuted}
            onFocus={() => setIsSearchFocused(true)}
            onBlur={() => setTimeout(() => setIsSearchFocused(false), 150)}
            returnKeyType="search"
            autoCorrect={false}
            autoCapitalize="none"
            accessible={true}
            accessibilityRole="search"
            accessibilityLabel="Search campus buildings and facilities"
            accessibilityHint="Type to filter map results by building name or category"
            accessibilityValue={{ text: searchQuery || undefined }}
          />
          {searchQuery.length > 0 ? (
            <Pressable
              onPress={handleClearSearch}
              style={styles.iconBtn}
              hitSlop={8}
              accessible={true}
              accessibilityRole="button"
              accessibilityLabel="Clear search"
            >
              <X size={16} color={theme.colors.textMuted} />
            </Pressable>
          ) : null}
          <Pressable
            style={styles.locateBtn}
            onPress={() => void handleCenterOnUser()}
            accessible={true}
            accessibilityRole="button"
            accessibilityLabel="Center map on my location"
            accessibilityHint={
              locationPermissionStatus === 'granted'
                ? 'Moves the map to show your current position'
                : 'Requests location permission then centres the map on you'
            }
          >
            <Locate size={16} color={theme.colors.primary} />
          </Pressable>
        </View>

        {/* Search suggestions */}
        {showingSuggestions && (
          <Animated.View
            style={[
              styles.suggestionsContainer,
              {
                opacity: suggestionAnim,
                transform: [{ translateY: suggestionAnim.interpolate({ inputRange: [0, 1], outputRange: [-8, 0] }) }],
              },
            ]}
          >
            {filteredBuildings.length === 0 ? (
              <View style={styles.noResultsRow}>
                <Text style={styles.noResultsText}>No buildings matched "{searchQuery}"</Text>
              </View>
            ) : (
              <FlatList
                data={filteredBuildings.slice(0, 6)}
                keyExtractor={item => item.id}
                keyboardShouldPersistTaps="handled"
                scrollEnabled={false}
                renderItem={({ item }) => (
                  <Pressable
                    style={styles.suggestionRow}
                    onPress={() => handleSelectBuilding(item)}
                    accessible={true}
                    accessibilityRole="button"
                    accessibilityLabel={`${item.name}, ${item.category}`}
                    accessibilityHint="Opens this building on the map"
                  >
                    <View
                      style={styles.suggestionIcon}
                      accessible={false}
                      importantForAccessibility="no"
                    >
                      <MapPin size={14} color={theme.colors.primary} />
                    </View>
                    <View style={styles.suggestionTexts}>
                      <Text style={styles.suggestionName}>{item.name}</Text>
                      <Text style={styles.suggestionMeta}>{item.code} · {item.category}</Text>
                    </View>
                  </Pressable>
                )}
              />
            )}
          </Animated.View>
        )}

        {/* Sector filter chips */}
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.sectorRow}
          pointerEvents="box-none"
          keyboardShouldPersistTaps="handled"
        >
          {SECTORS.map(s => {
            const active = s === activeSector;
            return (
              <Pressable
                key={s}
                style={[styles.sectorChip, active && styles.sectorChipActive]}
                onPress={() => { void Haptics.selectionAsync(); setActiveSector(s); }}
                accessible={true}
                accessibilityRole="tab"
                accessibilityLabel={s}
                accessibilityHint={`Filter map to show ${s === 'All' ? 'all buildings' : s.toLowerCase() + ' buildings'}`}
                accessibilityState={{ selected: active }}
              >
                <Text style={[styles.sectorChipText, active && styles.sectorChipTextActive]}>{s}</Text>
              </Pressable>
            );
          })}
        </ScrollView>
      </SafeAreaView>

      {/* Bottom sheet: nearby places */}
      <View style={styles.bottomSheet} pointerEvents="box-none">
        {/* Selected building highlight */}
        {selectedBuilding && (
          <View
            style={styles.selectedBar}
            accessible={true}
            accessibilityLabel={`Selected building: ${selectedBuilding.name}`}
          >
            <MapPin size={14} color={theme.colors.primary} accessibilityElementsHidden importantForAccessibility="no" />
            <View style={styles.selectedInfo} accessible={false}>
              <Text style={styles.selectedName} numberOfLines={1}>{selectedBuilding.name}</Text>
              <Text style={styles.selectedCategory}>
                {selectedBuilding.category.charAt(0).toUpperCase() + selectedBuilding.category.slice(1)}
              </Text>
            </View>
            <Pressable
              style={styles.directionsBtn}
              onPress={() => {
                void Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                router.push(`/directions?buildingId=${selectedBuilding.id}`);
              }}
              accessible={true}
              accessibilityRole="button"
              accessibilityLabel={`Get directions to ${selectedBuilding.name}`}
              accessibilityHint="Starts turn-by-turn walking directions"
            >
              <Navigation2 size={13} color="#FFF" accessibilityElementsHidden importantForAccessibility="no" />
              <Text style={styles.directionsBtnText}>Directions</Text>
            </Pressable>
            <Pressable
              onPress={() => { setLocalSelectedId(null); setSearchQuery(''); setSelectedBuildingId(undefined); }}
              style={styles.closeSelectedBtn}
              hitSlop={8}
              accessible={true}
              accessibilityRole="button"
              accessibilityLabel="Dismiss selected building"
            >
              <X size={14} color={theme.colors.textMuted} />
            </Pressable>
          </View>
        )}

        <Text style={styles.nearbyTitle}>
          {searchQuery.trim()
            ? `${filteredBuildings.length} result${filteredBuildings.length !== 1 ? 's' : ''} found`
            : 'Nearby Campus Places'}
        </Text>

        <FlatList
          data={nearbyBuildings.slice(0, 8)}
          keyExtractor={item => item.id}
          horizontal={false}
          scrollEnabled={false}
          renderItem={({ item }) => {
            const dist = location ? formatDistance(item.distanceMeters) : null;
            const mins = location ? walkMins(item.distanceMeters) : null;
            const isSelected = item.id === selectedBuildingId;

            return (
              <Pressable
                style={[styles.placeRow, isSelected && styles.placeRowSelected]}
                onPress={() => {
                  void Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                  handleSelectBuilding(item);
                  router.push(`/building/${item.id}`);
                }}
                accessible={true}
                accessibilityRole="button"
                accessibilityLabel={
                  dist && mins
                    ? `${item.name}, ${item.category}, ${dist}, about ${mins} minutes walk`
                    : `${item.name}, ${item.category}`
                }
                accessibilityHint="Opens building details"
                accessibilityState={{ selected: isSelected }}
              >
                <View style={[styles.placeThumb, isSelected && styles.placeThumbSelected]}>
                  <Text style={styles.placeCode}>{item.code}</Text>
                </View>
                <View style={styles.placeInfo}>
                  <Text style={styles.placeName} numberOfLines={1}>{item.name}</Text>
                  <Text style={styles.placeCategory}>
                    {item.category.charAt(0).toUpperCase() + item.category.slice(1)}
                  </Text>
                </View>
                {dist && mins ? (
                  <View style={styles.distBadge}>
                    <Text style={styles.distValue}>{dist}</Text>
                    <Text style={styles.distMins}>{mins} min</Text>
                  </View>
                ) : (
                  <View style={styles.inspectBtn}>
                    <Text style={styles.inspectText}>View</Text>
                  </View>
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

  // ── Top overlay
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
    letterSpacing: 1.2,
  },
  headerTitle: {
    fontSize: 18,
    fontFamily: 'Poppins_800ExtraBold',
    color: theme.colors.text,
  },
  headerRight: { flexDirection: 'row', gap: 8 },
  headerBtn: {
    width: 38, height: 38, borderRadius: 12,
    backgroundColor: 'rgba(255,255,255,0.95)',
    alignItems: 'center', justifyContent: 'center',
    ...theme.shadow,
  },
  avatarBtn: {
    width: 38, height: 38, borderRadius: 19,
    backgroundColor: theme.colors.primary,
    alignItems: 'center', justifyContent: 'center',
    ...theme.shadow,
  },

  // ── Search pill
  searchPill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    marginHorizontal: 16,
    backgroundColor: 'rgba(255,255,255,0.97)',
    borderRadius: theme.radius.pill,
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderWidth: 1.5,
    borderColor: 'transparent',
    ...theme.shadow,
  },
  searchPillFocused: {
    borderColor: theme.colors.primary,
    backgroundColor: '#FFF',
  },
  searchPillInput: {
    flex: 1,
    fontSize: 14,
    fontFamily: 'DMSans_400Regular',
    color: theme.colors.text,
    paddingVertical: 0,
  },
  iconBtn: {
    padding: 4,
    justifyContent: 'center',
    alignItems: 'center',
  },
  locateBtn: {
    width: 32, height: 32, borderRadius: 16,
    backgroundColor: theme.colors.surfaceAlt,
    alignItems: 'center', justifyContent: 'center',
  },

  // ── Search suggestions
  suggestionsContainer: {
    backgroundColor: '#FFF',
    borderRadius: 18,
    marginHorizontal: 16,
    paddingVertical: 4,
    ...theme.shadow,
    zIndex: 99,
    overflow: 'hidden',
  },
  noResultsRow: {
    paddingVertical: 16,
    paddingHorizontal: 18,
  },
  noResultsText: {
    fontSize: 13,
    fontFamily: 'DMSans_400Regular',
    color: theme.colors.textMuted,
    textAlign: 'center',
  },
  suggestionRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 11,
    paddingHorizontal: 14,
    gap: 12,
    borderBottomWidth: 1,
    borderBottomColor: theme.colors.border,
  },
  suggestionIcon: {
    width: 28, height: 28, borderRadius: 8,
    backgroundColor: theme.colors.surfaceAlt,
    alignItems: 'center', justifyContent: 'center',
  },
  suggestionTexts: { flex: 1 },
  suggestionName: {
    fontSize: 14,
    fontFamily: 'Poppins_700Bold',
    color: theme.colors.text,
  },
  suggestionMeta: {
    fontSize: 11,
    fontFamily: 'DMSans_400Regular',
    color: theme.colors.textMuted,
    marginTop: 1,
  },

  // ── Sector chips
  sectorRow: { paddingHorizontal: 16, gap: 8 },
  sectorChip: {
    paddingHorizontal: 14,
    paddingVertical: 7,
    borderRadius: theme.radius.pill,
    backgroundColor: 'rgba(255,255,255,0.92)',
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

  // ── Bottom sheet: nearby places
  bottomSheet: {
    position: 'absolute',
    bottom: 0, left: 0, right: 0,
    backgroundColor: 'rgba(255,255,255,0.98)',
    borderTopLeftRadius: 28,
    borderTopRightRadius: 28,
    paddingHorizontal: 18,
    paddingTop: 14,
    paddingBottom: 72,
    maxHeight: '50%',
    ...theme.shadow,
  },

  // Selected building bar
  selectedBar: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    backgroundColor: theme.colors.surfaceAlt,
    borderRadius: 14,
    paddingHorizontal: 12,
    paddingVertical: 10,
    marginBottom: 10,
    borderWidth: 1,
    borderColor: theme.colors.border,
  },
  selectedInfo: { flex: 1 },
  selectedName: {
    fontSize: 13,
    fontFamily: 'Poppins_700Bold',
    color: theme.colors.text,
  },
  selectedCategory: {
    fontSize: 11,
    fontFamily: 'DMSans_400Regular',
    color: theme.colors.textMuted,
  },
  directionsBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    backgroundColor: theme.colors.primary,
    paddingHorizontal: 12,
    paddingVertical: 7,
    borderRadius: theme.radius.pill,
  },
  directionsBtnText: {
    fontSize: 12,
    fontFamily: 'Poppins_700Bold',
    color: '#FFF',
  },
  closeSelectedBtn: {
    padding: 4,
  },

  nearbyTitle: {
    fontSize: 15,
    fontFamily: 'Poppins_800ExtraBold',
    color: theme.colors.text,
    marginBottom: 8,
  },

  // Place row
  placeRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    paddingVertical: 9,
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
    width: 42, height: 42, borderRadius: 11,
    backgroundColor: theme.colors.surfaceAlt,
    alignItems: 'center', justifyContent: 'center',
  },
  placeThumbSelected: {
    backgroundColor: theme.colors.primary,
  },
  placeCode: {
    fontSize: 10,
    fontFamily: 'Poppins_800ExtraBold',
    color: theme.colors.primary,
  },
  placeInfo: { flex: 1 },
  placeName: {
    fontSize: 13,
    fontFamily: 'Poppins_700Bold',
    color: theme.colors.text,
  },
  placeCategory: {
    fontSize: 11,
    fontFamily: 'DMSans_400Regular',
    color: theme.colors.textMuted,
    marginTop: 1,
  },
  distBadge: { alignItems: 'flex-end', gap: 1 },
  distValue: {
    fontSize: 13,
    fontFamily: 'Poppins_800ExtraBold',
    color: theme.colors.primary,
  },
  distMins: {
    fontSize: 10,
    fontFamily: 'DMSans_400Regular',
    color: theme.colors.textMuted,
  },
  inspectBtn: {
    backgroundColor: theme.colors.surfaceAlt,
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: theme.colors.border,
  },
  inspectText: {
    fontSize: 11,
    fontFamily: 'Poppins_700Bold',
    color: theme.colors.primary,
  },
});
