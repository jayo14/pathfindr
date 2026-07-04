import { Stack, useLocalSearchParams, useRouter } from 'expo-router';
import * as Haptics from 'expo-haptics';
import * as Sharing from 'expo-sharing';
import {
  ArrowUpRight,
  CheckCircle2,
  MapPinned,
  Navigation,
  CornerDownLeft,
  CornerDownRight,
  Share2,
  Navigation2
} from 'lucide-react-native';
import { useMemo, useState, useRef } from 'react';
import {
  StyleSheet,
  Text,
  View,
  FlatList,
  Pressable,
  Alert,
  PanResponder,
  Animated,
  Dimensions,
} from 'react-native';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';

import { NativeMapView, NativeMarker } from '@/components/NativeMapView';
import { PrimaryButton } from '@/components/PrimaryButton';
import { StateCard } from '@/components/StateCard';
import { theme } from '@/constants/theme';
import { useBuildings } from '@/hooks/useCampusData';
import { useArrivalDetection } from '@/hooks/useArrivalDetection';
import { useDirections } from '@/hooks/useDirections';
import { useUserLocation } from '@/hooks/useUserLocation';
import { formatDistance } from '@/utils/geo';
import { generateSteps, NavigationStep } from '@/utils/navigation-steps';

export default function DirectionsScreen() {
  const params = useLocalSearchParams<{ buildingId: string }>();
  const { buildings } = useBuildings();
  const { location } = useUserLocation();
  const [isActiveNav, setIsActiveNav] = useState(false);
  const router = useRouter();
  const insets = useSafeAreaInsets();

  const { height: SCREEN_HEIGHT } = Dimensions.get('window');
  const SNAP_TOP = SCREEN_HEIGHT * 0.15; // 85% height
  const SNAP_BOTTOM = SCREEN_HEIGHT * 0.70; // 30% height (leaves 70% map)
  const COLLAPSED_SHIFT = SNAP_BOTTOM - SNAP_TOP;

  const translateY = useRef(new Animated.Value(COLLAPSED_SHIFT)).current;
  const lastTranslateY = useRef(COLLAPSED_SHIFT);

  const panResponder = useRef(
    PanResponder.create({
      onStartShouldSetPanResponder: () => true,
      onMoveShouldSetPanResponder: (evt, gestureState) => {
        return Math.abs(gestureState.dy) > 5;
      },
      onPanResponderGrant: () => {
        translateY.setOffset(lastTranslateY.current);
        translateY.setValue(0);
      },
      onPanResponderMove: (e, gestureState) => {
        const nextValue = lastTranslateY.current + gestureState.dy;
        if (nextValue >= 0 && nextValue <= COLLAPSED_SHIFT) {
          translateY.setValue(gestureState.dy);
        }
      },
      onPanResponderRelease: (e, gestureState) => {
        translateY.flattenOffset();
        const currentY = lastTranslateY.current + gestureState.dy;
        let targetY = COLLAPSED_SHIFT;

        if (gestureState.vy < -0.3) {
          targetY = 0; // Expand
        } else if (gestureState.vy > 0.3) {
          targetY = COLLAPSED_SHIFT; // Collapse
        } else {
          if (currentY < COLLAPSED_SHIFT / 2) {
            targetY = 0;
          } else {
            targetY = COLLAPSED_SHIFT;
          }
        }

        Animated.spring(translateY, {
          toValue: targetY,
          useNativeDriver: true,
          tension: 50,
          friction: 8,
        }).start(() => {
          lastTranslateY.current = targetY;
        });
      },
    })
  ).current;

  const destination = useMemo(
    () => buildings.find((building) => building.id === params.buildingId),
    [buildings, params.buildingId],
  );

  const origin = location ?? buildings[0]?.coordinate;
  const directionsQuery = useDirections(origin, destination?.coordinate);

  const { hasArrived, resetArrival } = useArrivalDetection({
    destination: destination?.coordinate,
    userLocation: location,
    thresholdMeters: 15,
    isActive: isActiveNav,
  });

  const steps = useMemo(() => {
    if (directionsQuery.data?.instructions && directionsQuery.data.instructions.length > 0) {
      return directionsQuery.data.instructions.map((inst: any) => ({
        instruction: inst.instruction,
        distanceMeters: inst.distanceMeters,
        icon: (inst.instruction.includes("Turn left") ? "turn-left" :
              inst.instruction.includes("Turn right") ? "turn-right" :
              inst.instruction.includes("Arrived") || inst.instruction.includes("arrived") ? "arrive" : "straight") as NavigationStep["icon"]
      }));
    }
    if (!directionsQuery.data?.points || !destination) return [];
    return generateSteps(directionsQuery.data.points, destination.name);
  }, [directionsQuery.data?.points, directionsQuery.data?.instructions, destination]);

  const handleShare = async () => {
    if (!destination) return;
    const isAvailable = await Sharing.isAvailableAsync();
    if (isAvailable) {
      await Sharing.shareAsync(`pathfindr://directions?buildingId=${destination.id}`, {
        dialogTitle: `Share route to ${destination.name}`,
      });
    } else {
      Alert.alert('Sharing unavailable', 'Your device does not support sharing.');
    }
  };

  const toggleActiveNav = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    if (isActiveNav) {
      // Stopping navigation also resets arrival so the hook is ready for reuse
      resetArrival();
    }
    setIsActiveNav(!isActiveNav);
  };

  const handleDismissArrival = () => {
    resetArrival();
    setIsActiveNav(false);
    // Navigate back to the map tab
    router.replace('/(tabs)/map');
  };

  if (!destination || !origin) {
    return (
      <SafeAreaView style={styles.container}>
        <StateCard title="Directions unavailable" description="Pick a destination from the map to start routing." />
      </SafeAreaView>
    );
  }

  const mapRegion = {
    latitude: (origin.latitude + destination.coordinate.latitude) / 2,
    longitude: (origin.longitude + destination.coordinate.longitude) / 2,
    latitudeDelta: Math.abs(origin.latitude - destination.coordinate.latitude) * 3 + 0.004,
    longitudeDelta: Math.abs(origin.longitude - destination.coordinate.longitude) * 3 + 0.004,
  };

  const markers: NativeMarker[] = [
    {
      id: destination.id,
      coordinate: destination.coordinate,
      title: destination.name,
      color: theme.colors.accent,
    },
  ];

  const StepIcon = ({ type }: { type: NavigationStep['icon'] }) => {
    switch (type) {
      case 'straight': return <Navigation size={18} color={theme.colors.primary} />;
      case 'turn-left': return <CornerDownLeft size={18} color={theme.colors.primary} />;
      case 'turn-right': return <CornerDownRight size={18} color={theme.colors.primary} />;
      case 'arrive': return <MapPinned size={18} color={theme.colors.accent} />;
      default: return null;
    }
  };

  return (
    <SafeAreaView style={styles.container} testID="directions-screen" edges={['bottom']}>
      <Stack.Screen options={{ headerShown: false }} />
      <NativeMapView
        region={mapRegion}
        markers={markers}
        route={directionsQuery.data?.points ?? []}
        userLocation={origin}
        style={styles.map}
        followsUserLocation={isActiveNav}
        showsUserLocation={isActiveNav}
      />

      {/* ── Arrival confirmation overlay ───────────────────────────────── */}
      {hasArrived ? (
        <View style={styles.arrivalOverlay}>
          <View style={styles.arrivalCard}>
            <View style={styles.arrivalIconWrap}>
              <CheckCircle2 size={40} color={theme.colors.accent} />
            </View>
            <Text style={styles.arrivalTitle}>You've arrived!</Text>
            <Text style={styles.arrivalSubtitle}>
              {destination.name}
            </Text>
            <Text style={styles.arrivalDescription}>
              You're within 15 m of your destination. Great navigation!
            </Text>
            <PrimaryButton
              label="Back to Map"
              onPress={handleDismissArrival}
              style={styles.arrivalButton}
            />
          </View>
        </View>
      ) : (
        /* ── Regular bottom sheet ──────────────────────────────────────── */
        <Animated.View
          style={[
            styles.overlayCard,
            isActiveNav && styles.activeOverlay,
            {
              transform: [{ translateY }],
              height: SCREEN_HEIGHT * 0.85,
              bottom: 0,
              left: 0,
              right: 0,
              margin: 0,
              borderBottomLeftRadius: 0,
              borderBottomRightRadius: 0,
              paddingBottom: insets.bottom + 16,
            }
          ]}
        >
          {/* Drag Handle Bar */}
          <View style={styles.dragHandleContainer} {...panResponder.panHandlers}>
            <View style={styles.dragHandle} />
          </View>

          <View style={styles.headerRow} {...panResponder.panHandlers}>
            <View style={styles.iconWrap}>
              <MapPinned color={theme.colors.primary} size={20} />
            </View>
            <View style={styles.headerCopy}>
              <Text style={styles.routeLabel}>Walking to</Text>
              <Text style={styles.routeTitle}>{destination.name}</Text>
            </View>
            <Pressable onPress={handleShare} style={styles.shareButton}>
              <Share2 size={20} color={theme.colors.primary} />
            </Pressable>
          </View>

          {directionsQuery.isLoading ? (
            <StateCard title="Drawing route" description="Calculating the best walking path across campus." loading />
          ) : directionsQuery.data ? (
            <>
              <View style={styles.metricsRow}>
                <View style={styles.metricCard}>
                  <Text style={styles.metricValue}>{formatDistance(directionsQuery.data.distanceMeters)}</Text>
                  <Text style={styles.metricLabel}>Distance</Text>
                </View>
                <View style={styles.metricCard}>
                  <Text style={styles.metricValue}>{directionsQuery.data.durationMinutes} min</Text>
                  <Text style={styles.metricLabel}>Walk time</Text>
                </View>
              </View>

              <View style={styles.stepsContainer}>
                <Text style={styles.stepsTitle}>Navigation Steps</Text>
                <FlatList
                  data={steps}
                  keyExtractor={(_, index) => index.toString()}
                  renderItem={({ item, index }) => (
                    <View style={[styles.stepRow, index === 0 && isActiveNav && styles.highlightedStep]}>
                      <View style={styles.stepIconWrap}>
                        <StepIcon type={item.icon} />
                      </View>
                      <View style={styles.stepContent}>
                        <Text style={styles.stepInstruction}>{item.instruction}</Text>
                        {item.distanceMeters > 0 && (
                          <Text style={styles.stepDistance}>{item.distanceMeters}m</Text>
                        )}
                      </View>
                    </View>
                  )}
                  style={styles.stepsList}
                  showsVerticalScrollIndicator={false}
                  nestedScrollEnabled
                />
              </View>
            </>
          ) : (
            <StateCard title="Route fallback ready" description="A simplified path is shown while live routing is unavailable." />
          )}

          <View style={styles.actionRow}>
            <PrimaryButton
              label={isActiveNav ? "Stop Navigation" : "Start Active Nav"}
              onPress={toggleActiveNav}
              variant={isActiveNav ? "secondary" : "primary"}
              style={styles.actionButton}
            />
            {!isActiveNav && (
              <Pressable
                style={styles.refreshButton}
                onPress={() => void directionsQuery.refetch()}
              >
                <Navigation2 size={20} color={theme.colors.primary} />
              </Pressable>
            )}
          </View>
        </Animated.View>
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: theme.colors.background,
  },
  map: {
    flex: 1,
  },
  // ── Arrival overlay ────────────────────────────────────────────────────
  arrivalOverlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(0,0,0,0.45)',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 32,
  },
  arrivalCard: {
    width: '100%',
    borderRadius: 28,
    backgroundColor: theme.colors.surface,
    padding: 28,
    alignItems: 'center',
    gap: 12,
    ...theme.shadow,
  },
  arrivalIconWrap: {
    width: 72,
    height: 72,
    borderRadius: 36,
    backgroundColor: theme.colors.surfaceAlt,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 4,
  },
  arrivalTitle: {
    fontSize: 26,
    fontFamily: 'Poppins_800ExtraBold',
    color: theme.colors.text,
    textAlign: 'center',
  },
  arrivalSubtitle: {
    fontSize: 16,
    fontFamily: 'Poppins_700Bold',
    color: theme.colors.primary,
    textAlign: 'center',
  },
  arrivalDescription: {
    fontSize: 14,
    fontFamily: 'DMSans_400Regular',
    color: theme.colors.textMuted,
    textAlign: 'center',
    lineHeight: 20,
  },
  arrivalButton: {
    marginTop: 8,
    width: '100%',
  },
  // ── Regular bottom sheet ───────────────────────────────────────────────
  overlayCard: {
    margin: 18,
    position: 'absolute',
    left: 0,
    right: 0,
    borderRadius: 28,
    backgroundColor: 'rgba(255,255,255,0.97)',
    padding: 18,
    gap: 16,
    ...theme.shadow,
  },
  dragHandleContainer: {
    width: '100%',
    height: 16,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: -8,
  },
  dragHandle: {
    width: 38,
    height: 5,
    borderRadius: 2.5,
    backgroundColor: '#CBD5E1',
  },
  activeOverlay: {
    borderColor: theme.colors.primary,
    borderWidth: 2,
  },
  headerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  iconWrap: {
    width: 44,
    height: 44,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: theme.colors.surfaceAlt,
  },
  headerCopy: {
    flex: 1,
    gap: 2,
  },
  routeLabel: {
    color: theme.colors.textMuted,
    fontSize: 13,
    fontFamily: 'Poppins_700Bold',
    textTransform: 'uppercase',
  },
  routeTitle: {
    color: theme.colors.text,
    fontSize: 20,
    fontFamily: 'Poppins_800ExtraBold',
  },
  shareButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: theme.colors.surfaceAlt,
    justifyContent: 'center',
    alignItems: 'center',
  },
  metricsRow: {
    flexDirection: 'row',
    gap: 12,
  },
  metricCard: {
    flex: 1,
    borderRadius: 22,
    backgroundColor: theme.colors.surfaceAlt,
    padding: 12,
    gap: 4,
    alignItems: 'center',
  },
  metricValue: {
    color: theme.colors.text,
    fontSize: 20,
    fontFamily: 'Poppins_800ExtraBold',
  },
  metricLabel: {
    color: theme.colors.textMuted,
    fontSize: 12,
    fontFamily: 'Poppins_700Bold',
  },
  stepsContainer: {
    flex: 1,
    gap: 8,
  },
  stepsTitle: {
    fontSize: 14,
    fontFamily: 'Poppins_700Bold',
    color: theme.colors.text,
    marginLeft: 4,
  },
  stepsList: {
    flex: 1,
  },
  stepRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
    paddingHorizontal: 8,
    borderBottomWidth: 1,
    borderBottomColor: theme.colors.border,
    gap: 12,
  },
  highlightedStep: {
    backgroundColor: theme.colors.surfaceAlt,
    borderRadius: 12,
    borderBottomWidth: 0,
  },
  stepIconWrap: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: theme.colors.surface,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: theme.colors.border,
  },
  stepContent: {
    flex: 1,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  stepInstruction: {
    fontSize: 14,
    fontFamily: 'DMSans_400Regular',
    color: theme.colors.text,
    flex: 1,
  },
  stepDistance: {
    fontSize: 12,
    fontFamily: 'Poppins_700Bold',
    color: theme.colors.textMuted,
    marginLeft: 8,
  },
  actionRow: {
    flexDirection: 'row',
    gap: 12,
    alignItems: 'center',
  },
  actionButton: {
    flex: 1,
  },
  refreshButton: {
    width: 54,
    height: 54,
    borderRadius: 27,
    backgroundColor: theme.colors.surfaceAlt,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: theme.colors.border,
  },
});
