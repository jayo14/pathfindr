import { memo, useCallback, useMemo, useRef, forwardRef, useImperativeHandle, useEffect, useState } from "react";
import { AccessibilityInfo, StyleSheet, Text, View } from 'react-native';
import MapView, { Circle, Marker, Polyline } from 'react-native-maps';

import { categoryColors, theme } from '@/constants/theme';
import { CampusCoordinate, RouteSegment, StoredMapRegion } from '@/types/domain';

export interface NativeMarker {
  id: string;
  coordinate: CampusCoordinate;
  title: string;
  color?: string;
  isCluster?: boolean;
  clusterCount?: number;
}

interface NativeMapViewProps {
  region: StoredMapRegion;
  markers?: NativeMarker[];
  route?: RouteSegment[];
  userLocation?: CampusCoordinate;
  onMarkerPress?: (markerId: string) => void;
  onRegionChangeComplete?: (region: StoredMapRegion) => void;
  onMapReady?: () => void;
  style?: object;
  showsUserLocation?: boolean;
  followsUserLocation?: boolean;
  /**
   * When true (default), animates the polyline drawing from origin to
   * destination over ~750ms when a new route loads.
   * Set to false for static/mini-map contexts where animation is unnecessary.
   */
  animateRoute?: boolean;
}

// Animation target duration in ms and minimum starting points to show
const ROUTE_ANIM_DURATION_MS = 750;
const ROUTE_ANIM_INTERVAL_MS = 16; // ~60fps
const ROUTE_ANIM_MIN_START = 2;

const BuildingMarker = memo(({
  marker,
  onPress,
}: {
  marker: NativeMarker;
  onPress?: (id: string) => void;
}) => {
  const color = marker.color ?? theme.colors.primary;

  return (
    <Marker
      identifier={marker.id}
      coordinate={marker.coordinate}
      title={marker.title}
      onPress={() => onPress?.(marker.id)}
    >
      <View style={[styles.markerDot, { backgroundColor: color }]}>
        {marker.isCluster && marker.clusterCount && marker.clusterCount > 1 ? (
          <Text style={styles.clusterText}>{marker.clusterCount}</Text>
        ) : null}
      </View>
    </Marker>
  );
});

export interface NativeMapViewRef {
  animateToRegion: (region: StoredMapRegion, duration?: number) => void;
}

export const NativeMapView = memo(forwardRef<NativeMapViewRef, NativeMapViewProps>((props, ref) => {
  const {
    region,
    markers = [],
    route = [],
    userLocation,
    onMarkerPress,
    onRegionChangeComplete,
    onMapReady,
    style,
    showsUserLocation = false,
    followsUserLocation = false,
    animateRoute = true,
  } = props;

  const prevRegion = useRef<StoredMapRegion | null>(null);
  const mapRef = useRef<MapView>(null);
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);

  // Number of route points currently visible (drives the animated slice)
  const [visibleCount, setVisibleCount] = useState<number>(route.length);

  useImperativeHandle(ref, () => ({
    animateToRegion: (newRegion: StoredMapRegion, duration?: number) => {
      mapRef.current?.animateToRegion(newRegion, duration);
    },
  }));

  // Kick off (or skip) animation whenever the route array identity changes
  useEffect(() => {
    const fullCount = route.length;

    if (fullCount < 2) {
      setVisibleCount(fullCount);
      return;
    }

    // Clear any in-progress animation from a previous route
    if (intervalRef.current !== null) {
      clearInterval(intervalRef.current);
      intervalRef.current = null;
    }

    if (!animateRoute) {
      // Static mode — show the complete route immediately
      setVisibleCount(fullCount);
      return;
    }

    // Check OS reduce-motion preference asynchronously, then start or skip
    void AccessibilityInfo.isReduceMotionEnabled().then((reduceMotion) => {
      if (reduceMotion) {
        setVisibleCount(fullCount);
        return;
      }

      // Calculate how many points to add per tick so the total animation
      // completes in roughly ROUTE_ANIM_DURATION_MS regardless of route length.
      const totalTicks = ROUTE_ANIM_DURATION_MS / ROUTE_ANIM_INTERVAL_MS;
      const pointsPerTick = Math.max(1, Math.ceil((fullCount - ROUTE_ANIM_MIN_START) / totalTicks));

      // Start drawing from a small seed so users see motion from the very
      // first frame rather than nothing.
      setVisibleCount(ROUTE_ANIM_MIN_START);

      intervalRef.current = setInterval(() => {
        setVisibleCount((prev) => {
          const next = prev + pointsPerTick;
          if (next >= fullCount) {
            clearInterval(intervalRef.current!);
            intervalRef.current = null;
            return fullCount;
          }
          return next;
        });
      }, ROUTE_ANIM_INTERVAL_MS);
    });

    return () => {
      if (intervalRef.current !== null) {
        clearInterval(intervalRef.current);
        intervalRef.current = null;
      }
    };
    // route reference changes signal a new route; animateRoute is a static prop
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [route, animateRoute]);

  // Slice to the animated window; memoised so Polyline only re-renders on count change
  const visibleCoords = useMemo<RouteSegment[]>(
    () => (route.length > 1 ? route.slice(0, visibleCount) : route),
    [route, visibleCount],
  );

  const hasRoute = route.length > 1;
  // Start/end dots should appear once we have enough visible points to draw them
  const showStartDot = visibleCoords.length >= 1;
  const showEndDot = visibleCount >= route.length;

  const throttledRegionChange = useCallback(
    (r: any) => {
      const newRegion = {
        latitude: r.latitude,
        longitude: r.longitude,
        latitudeDelta: r.latitudeDelta,
        longitudeDelta: r.longitudeDelta,
      };
      if (prevRegion.current) {
        const latDiff = Math.abs(newRegion.latitude - prevRegion.current.latitude);
        const lonDiff = Math.abs(newRegion.longitude - prevRegion.current.longitude);
        if (latDiff < 0.0005 && lonDiff < 0.0005) return;
      }
      prevRegion.current = newRegion;
      onRegionChangeComplete?.(newRegion);
    },
    [onRegionChangeComplete],
  );

  return (
    <View style={[styles.container, style]}>
      <MapView
        ref={mapRef}
        style={StyleSheet.absoluteFillObject}
        initialRegion={region}
        showsUserLocation={showsUserLocation}
        followsUserLocation={followsUserLocation}
        showsMyLocationButton={false}
        showsCompass
        rotateEnabled={false}
        onMapReady={onMapReady}
        onRegionChangeComplete={throttledRegionChange}
      >
        {markers.map((marker) => (
          <BuildingMarker key={marker.id} marker={marker} onPress={onMarkerPress} />
        ))}

        {hasRoute && visibleCoords.length > 1 ? (
          <Polyline
            coordinates={visibleCoords}
            strokeColor={theme.colors.primary}
            strokeWidth={5}
            lineCap="round"
            lineJoin="round"
          />
        ) : null}

        {hasRoute && showStartDot ? (
          <Circle
            center={route[0]}
            radius={6}
            fillColor={theme.colors.primaryDark}
            strokeColor="#FFFFFF"
            strokeWidth={2}
          />
        ) : null}

        {hasRoute && showEndDot ? (
          <Circle
            center={route[route.length - 1]}
            radius={6}
            fillColor={theme.colors.accent}
            strokeColor="#FFFFFF"
            strokeWidth={2}
          />
        ) : null}

        {userLocation && !showsUserLocation ? (
          <>
            <Circle
              center={userLocation}
              radius={18}
              fillColor="rgba(33,150,243,0.15)"
              strokeColor="transparent"
            />
            <Circle
              center={userLocation}
              radius={7}
              fillColor="#2196F3"
              strokeColor="#FFFFFF"
              strokeWidth={2.5}
            />
          </>
        ) : null}
      </MapView>
    </View>
  );
}));

const styles = StyleSheet.create({
  container: {
    flex: 1,
    overflow: 'hidden',
  },
  markerDot: {
    width: 28,
    height: 28,
    borderRadius: 14,
    borderWidth: 3,
    borderColor: '#FFFFFF',
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 4,
    elevation: 4,
  },
  clusterText: {
    color: '#FFFFFF',
    fontSize: 10,
    fontFamily: 'Poppins_700Bold',
  },
});

export { categoryColors };
