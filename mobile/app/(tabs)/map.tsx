import { router } from 'expo-router';
import { LocateFixed, MapPin, Search, Sparkles } from 'lucide-react-native';
import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { Animated, FlatList, Pressable, StyleSheet, Text, View } from 'react-native';
import * as Haptics from 'expo-haptics';
import { Image } from 'expo-image';
import { SafeAreaView } from 'react-native-safe-area-context';

import { MapCategoryFilter } from '@/components/MapCategoryFilter';
import { NativeMapView, NativeMarker, NativeMapViewRef } from '@/components/NativeMapView';
import { PrimaryButton } from '@/components/PrimaryButton';
import { SectionHeader } from '@/components/SectionHeader';
import { StateCard } from '@/components/StateCard';
import { theme } from '@/constants/theme';
import { useBuildings } from '@/hooks/useCampusData';
import { useUserLocation } from '@/hooks/useUserLocation';
import { useAppStore } from '@/store/useAppStore';
import { Building, StoredMapRegion, BuildingCategory } from '@/types/domain';
import { clusterBuildings } from '@/utils/clustering';
import { getInitialRegion } from '@/utils/geo';

export default function MapScreen() {
  const mapRef = useRef<NativeMapViewRef>(null);
  const { buildings, isLoading, isError } = useBuildings();
  const {
    location,
    locationPermissionStatus,
    requestPermission,
    refreshLocation,
    isLoading: isLocationLoading,
    error: locationError,
  } = useUserLocation();
  const lastMapRegion = useAppStore((state) => state.lastMapRegion);
  const setLastMapRegion = useAppStore((state) => state.setLastMapRegion);
  const setSelectedBuildingId = useAppStore((state) => state.setSelectedBuildingId);

  const [currentRegion, setCurrentRegion] = useState<StoredMapRegion>(
    getInitialRegion(lastMapRegion),
  );
  const [activeCategory, setActiveCategory] = useState<BuildingCategory | 'all'>('all');

  const filterFadeAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    Animated.timing(filterFadeAnim, {
      toValue: 1,
      duration: 200,
      useNativeDriver: true,
    }).start();
  }, [activeCategory, filterFadeAnim]);

  const handleRegionChange = useCallback(
    (region: StoredMapRegion) => {
      setCurrentRegion(region);
      setLastMapRegion(region);
    },
    [setLastMapRegion],
  );

  const filteredBuildings = useMemo(() => {
    if (activeCategory === 'all') return buildings;
    return buildings.filter(b => b.category === activeCategory);
  }, [buildings, activeCategory]);

  const clusteredMarkers = useMemo<NativeMarker[]>(() => {
    const clusters = clusterBuildings(filteredBuildings, currentRegion);
    return clusters.map((c) => ({
      id: c.id,
      coordinate: { latitude: c.latitude, longitude: c.longitude },
      title: c.title,
      color: c.color,
      isCluster: c.isCluster,
      clusterCount: c.count,
    }));
  }, [filteredBuildings, currentRegion]);

  const featuredBuildings = useMemo<Building[]>(() => filteredBuildings.slice(0, 4), [filteredBuildings]);

  const handleOpenSearch = useCallback((): void => {
    void Haptics.selectionAsync();
    router.push('/search');
  }, []);

  const handleMarkerPress = useCallback(
    (buildingId: string): void => {
      void Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
      setSelectedBuildingId(buildingId);
      router.push(`/building/${buildingId}`);
    },
    [setSelectedBuildingId],
  );

  const centerOnUser = useCallback(async (): Promise<void> => {
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
      }, 1000);
    }
  }, [locationPermissionStatus, requestPermission, refreshLocation, location]);

  const handleCategorySelect = (category: BuildingCategory | 'all') => {
    void Haptics.selectionAsync();
    filterFadeAnim.setValue(0);
    setActiveCategory(category);
  };

  return (
    <View style={styles.container}>
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

      <SafeAreaView style={styles.overlay} pointerEvents="box-none">
        <View style={styles.topBar}>
          <Pressable style={styles.searchBar} onPress={handleOpenSearch} testID="open-search-button">
            <Search color={theme.colors.textMuted} size={18} />
            <Text style={styles.searchLabel}>Search buildings, departments, facilities</Text>
          </Pressable>
          <Pressable
            style={styles.locateButton}
            onPress={() => void centerOnUser()}
            testID="center-location-button"
          >
            <LocateFixed color={theme.colors.primary} size={18} />
          </Pressable>
        </View>

        <View style={styles.bottomContainer} pointerEvents="box-none">
          <Animated.View style={{ opacity: filterFadeAnim }}>
            <MapCategoryFilter
              activeCategory={activeCategory}
              onSelect={handleCategorySelect}
            />
          </Animated.View>

          <View style={styles.bottomSheet}>
            <SectionHeader
              title="Explore campus"
              subtitle="Live position, smart markers, and quick routes"
              actionLabel="Search"
              onPressAction={handleOpenSearch}
            />

            {locationPermissionStatus !== 'granted' ? (
              <StateCard
                title="Turn on your location"
                description="Get live positioning and quicker walking directions across campus."
                loading={isLocationLoading}
              />
            ) : null}

            {locationError ? (
              <StateCard title="Location update paused" description={locationError} />
            ) : null}

            {isError ? (
              <StateCard title="Campus data unavailable" description="We could not load the campus map data right now." />
            ) : null}

            <View style={styles.quickActionRow}>
              <PrimaryButton
                label={locationPermissionStatus === 'granted' ? 'Refresh my location' : 'Enable location'}
                onPress={() => void centerOnUser()}
                isLoading={isLocationLoading}
                style={styles.flexButton}
                testID="location-permission-button"
              />
              <PrimaryButton
                label="Upcoming events"
                variant="secondary"
                onPress={() => router.push('/(tabs)/events')}
                style={styles.flexButton}
                testID="open-events-button"
              />
            </View>

            <View style={styles.sectionSpacing}>
              <SectionHeader title="Featured places" subtitle="Most visited spaces this week" />
            </View>

            {isLoading ? (
              <StateCard title="Loading campus hotspots" description="Pulling in landmarks and student favorites." loading />
            ) : (
              <FlatList
                data={featuredBuildings}
                horizontal
                keyExtractor={(item) => item.id}
                showsHorizontalScrollIndicator={false}
                contentContainerStyle={styles.featureList}
                renderItem={({ item }) => (
                  <Pressable
                    onPress={() => router.push(`/building/${item.id}`)}
                    style={styles.placeCard}
                    testID={`featured-building-${item.id}`}
                  >
                    <Image source={{ uri: item.imageUrl }} style={styles.placeImage} contentFit="cover" />
                    <View style={styles.placeContent}>
                      <View style={styles.placePill}>
                        <Sparkles color={theme.colors.primary} size={14} />
                        <Text style={styles.placePillText}>{item.code}</Text>
                      </View>
                      <Text style={styles.placeTitle}>{item.name}</Text>
                      <Text style={styles.placeSubtitle} numberOfLines={2}>
                        {item.description}
                      </Text>
                    </View>
                  </Pressable>
                )}
              />
            )}
          </View>
        </View>
      </SafeAreaView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: theme.colors.mapTint,
  },
  map: {
    ...StyleSheet.absoluteFillObject,
  },
  overlay: {
    flex: 1,
    justifyContent: 'space-between',
    paddingHorizontal: 0,
    paddingTop: 8,
  },
  topBar: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    paddingHorizontal: 16,
  },
  searchBar: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    borderRadius: theme.radius.pill,
    backgroundColor: 'rgba(255,255,255,0.95)',
    paddingHorizontal: 18,
    paddingVertical: 15,
    ...theme.shadow,
  },
  searchLabel: {
    flex: 1,
    color: theme.colors.textMuted,
    fontSize: 15,
    fontFamily: 'DMSans_400Regular',
  },
  locateButton: {
    width: 52,
    height: 52,
    borderRadius: 18,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'rgba(255,255,255,0.95)',
    ...theme.shadow,
  },
  bottomContainer: {
    gap: 0,
  },
  bottomSheet: {
    borderTopLeftRadius: 30,
    borderTopRightRadius: 30,
    backgroundColor: 'rgba(244, 247, 242, 0.98)',
    paddingHorizontal: 18,
    paddingTop: 20,
    paddingBottom: 12,
    gap: 14,
  },
  quickActionRow: {
    flexDirection: 'row',
    gap: 10,
  },
  flexButton: {
    flex: 1,
  },
  sectionSpacing: {
    marginTop: 4,
  },
  featureList: {
    paddingBottom: 8,
    gap: 14,
  },
  placeCard: {
    width: 236,
    borderRadius: 26,
    overflow: 'hidden',
    backgroundColor: theme.colors.surface,
    ...theme.shadow,
  },
  placeImage: {
    width: '100%',
    height: 140,
  },
  placeContent: {
    padding: 16,
    gap: 10,
  },
  placePill: {
    alignSelf: 'flex-start',
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    borderRadius: theme.radius.pill,
    backgroundColor: theme.colors.surfaceAlt,
    paddingHorizontal: 10,
    paddingVertical: 6,
  },
  placePillText: {
    color: theme.colors.primary,
    fontSize: 12,
    fontFamily: 'Poppins_800ExtraBold',
  },
  placeTitle: {
    color: theme.colors.text,
    fontSize: 18,
    fontFamily: 'Poppins_800ExtraBold',
  },
  placeSubtitle: {
    color: theme.colors.textMuted,
    fontSize: 14,
    lineHeight: 21,
    fontFamily: 'DMSans_400Regular',
  },
});
