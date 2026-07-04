import * as Haptics from 'expo-haptics';
import { router } from 'expo-router';
import {
  ArrowRight,
  CheckCircle2,
  CornerDownLeft,
  CornerDownRight,
  MapPin,
  MapPinned,
  Navigation,
  Navigation2,
  X,
  ChevronDown,
  ChevronUp,
} from 'lucide-react-native';
import { useMemo, useState, useRef, useCallback } from 'react';
import {
  FlatList,
  Modal,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
  PanResponder,
  Animated,
  Dimensions,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';

import { NativeMapView, NativeMarker } from '@/components/NativeMapView';
import { PrimaryButton } from '@/components/PrimaryButton';
import { StateCard } from '@/components/StateCard';
import { theme } from '@/constants/theme';
import { useArrivalDetection } from '@/hooks/useArrivalDetection';
import { useBuildings } from '@/hooks/useCampusData';
import { useDirections } from '@/hooks/useDirections';
import { useUserLocation } from '@/hooks/useUserLocation';
import { Building } from '@/types/domain';
import { formatDistance } from '@/utils/geo';
import { generateSteps, NavigationStep } from '@/utils/navigation-steps';

// ── Building picker modal ─────────────────────────────────────────────────
function BuildingPicker({
  visible,
  title,
  buildings,
  onSelect,
  onClose,
}: {
  visible: boolean;
  title: string;
  buildings: Building[];
  onSelect: (b: Building) => void;
  onClose: () => void;
}) {
  return (
    <Modal visible={visible} animationType="slide" presentationStyle="pageSheet">
      <KeyboardAvoidingView
        style={{ flex: 1 }}
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      >
        <SafeAreaView style={pickerStyles.container} edges={['top']}>
          <View style={pickerStyles.header}>
            <Text style={pickerStyles.title}>{title}</Text>
            <Pressable onPress={onClose} style={pickerStyles.closeBtn}>
              <X size={20} color={theme.colors.text} />
            </Pressable>
          </View>
          <FlatList
            data={buildings}
            keyExtractor={item => item.id}
            contentContainerStyle={pickerStyles.list}
            keyboardShouldPersistTaps="handled"
            renderItem={({ item }) => (
              <Pressable
                style={pickerStyles.row}
                onPress={() => { void Haptics.selectionAsync(); onSelect(item); }}
              >
                <View style={pickerStyles.dot} />
                <View style={pickerStyles.rowText}>
                  <Text style={pickerStyles.name}>{item.name}</Text>
                  <Text style={pickerStyles.meta}>{item.code} · {item.category}</Text>
                </View>
                <ArrowRight size={16} color={theme.colors.textMuted} />
              </Pressable>
            )}
          />
        </SafeAreaView>
      </KeyboardAvoidingView>
    </Modal>
  );
}

const pickerStyles = StyleSheet.create({
  container: { flex: 1, backgroundColor: theme.colors.background },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingVertical: 16,
    borderBottomWidth: 1,
    borderBottomColor: theme.colors.border,
    backgroundColor: theme.colors.surface,
  },
  title: { fontSize: 18, fontFamily: 'Poppins_800ExtraBold', color: theme.colors.text },
  closeBtn: {
    width: 36, height: 36, borderRadius: 18,
    backgroundColor: theme.colors.surfaceAlt,
    alignItems: 'center', justifyContent: 'center',
  },
  list: { padding: 16, gap: 8 },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    backgroundColor: theme.colors.surface,
    borderRadius: 16,
    padding: 16,
    ...theme.shadow,
  },
  dot: {
    width: 10, height: 10, borderRadius: 5,
    backgroundColor: theme.colors.primary,
  },
  rowText: { flex: 1 },
  name: { fontSize: 15, fontFamily: 'Poppins_700Bold', color: theme.colors.text },
  meta: { fontSize: 12, fontFamily: 'DMSans_400Regular', color: theme.colors.textMuted, marginTop: 2 },
});

// ── Step icon ─────────────────────────────────────────────────────────────
function StepIcon({ type }: { type: NavigationStep['icon'] }) {
  switch (type) {
    case 'straight':   return <Navigation   size={16} color={theme.colors.primary} />;
    case 'turn-left':  return <CornerDownLeft  size={16} color={theme.colors.primary} />;
    case 'turn-right': return <CornerDownRight size={16} color={theme.colors.primary} />;
    case 'arrive':     return <MapPinned    size={16} color={theme.colors.accent} />;
    default: return null;
  }
}

// ── Main screen ───────────────────────────────────────────────────────────
export default function DirectionsTabScreen() {
  const { buildings } = useBuildings();
  const { location } = useUserLocation();
  const insets = useSafeAreaInsets();

  const [originBuilding, setOriginBuilding] = useState<Building | null>(null);
  const [destinationBuilding, setDestinationBuilding] = useState<Building | null>(null);
  const [showOriginPicker, setShowOriginPicker] = useState(false);
  const [showDestPicker, setShowDestPicker] = useState(false);
  const [isActiveNav, setIsActiveNav] = useState(false);

  const { width: SCREEN_WIDTH, height: SCREEN_HEIGHT } = Dimensions.get('window');
  const TAB_BAR_HEIGHT = 56 + insets.bottom;

  // Sheet snap positions (translateY relative to top of sheet container)
  // Peeked  = sheet takes ~32% of screen  → translateY = large
  // Expanded = sheet takes ~55% of screen  → translateY = small
  const SHEET_PEEK_HEIGHT   = SCREEN_HEIGHT * 0.32;
  const SHEET_EXPAND_HEIGHT = SCREEN_HEIGHT * 0.58;

  // The sheet sits inside a container that starts right below the map area.
  // We position it absolutely from the bottom and animate its height-like
  // appearance by translating it vertically inside a fixed-size wrapper.
  const WRAPPER_HEIGHT = SHEET_EXPAND_HEIGHT;                  // max sheet size
  const PEEK_OFFSET    = WRAPPER_HEIGHT - SHEET_PEEK_HEIGHT;   // how much to push down when peeked
  const EXPAND_OFFSET  = 0;                                    // full height = no offset

  const translateY    = useRef(new Animated.Value(PEEK_OFFSET)).current;
  const lastY         = useRef(PEEK_OFFSET);
  const isExpanded    = useRef(false);

  const snapTo = useCallback((targetY: number, animated = true) => {
    isExpanded.current = targetY === EXPAND_OFFSET;
    if (animated) {
      Animated.spring(translateY, {
        toValue: targetY,
        useNativeDriver: true,
        tension: 55,
        friction: 9,
      }).start(() => { lastY.current = targetY; });
    } else {
      translateY.setValue(targetY);
      lastY.current = targetY;
    }
  }, [translateY, EXPAND_OFFSET]);

  const panResponder = useRef(
    PanResponder.create({
      onStartShouldSetPanResponder: () => true,
      onMoveShouldSetPanResponder: (_, g) => Math.abs(g.dy) > 4,
      onPanResponderGrant: () => {
        translateY.setOffset(lastY.current);
        translateY.setValue(0);
      },
      onPanResponderMove: (_, g) => {
        const next = lastY.current + g.dy;
        if (next >= EXPAND_OFFSET && next <= PEEK_OFFSET) {
          translateY.setValue(g.dy);
        }
      },
      onPanResponderRelease: (_, g) => {
        translateY.flattenOffset();
        const curr = lastY.current + g.dy;
        let target: number;
        if (g.vy < -0.4 || curr < WRAPPER_HEIGHT / 2) {
          target = EXPAND_OFFSET;   // snap up
        } else {
          target = PEEK_OFFSET;     // snap down
        }
        snapTo(target);
      },
    })
  ).current;

  const origin = originBuilding?.coordinate ?? location ?? buildings[0]?.coordinate;
  const destination = destinationBuilding;

  const directionsQuery = useDirections(origin, destination?.coordinate);

  const { hasArrived, resetArrival } = useArrivalDetection({
    destination: destination?.coordinate,
    userLocation: location,
    thresholdMeters: 15,
    isActive: isActiveNav,
  });

  const steps = useMemo(() => {
    if (directionsQuery.data?.instructions?.length) {
      return directionsQuery.data.instructions.map((inst: any) => ({
        instruction: inst.instruction,
        distanceMeters: inst.distanceMeters,
        icon: (
          inst.instruction.includes('Turn left')  ? 'turn-left'  :
          inst.instruction.includes('Turn right') ? 'turn-right' :
          (inst.instruction.includes('Arrived') || inst.instruction.includes('arrived')) ? 'arrive' : 'straight'
        ) as NavigationStep['icon'],
      }));
    }
    if (!directionsQuery.data?.points || !destination) return [];
    return generateSteps(directionsQuery.data.points, destination.name);
  }, [directionsQuery.data, destination]);

  const toggleNav = () => {
    void Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    if (isActiveNav) resetArrival();
    setIsActiveNav(v => !v);
  };

  const mapRegion = useMemo(() => {
    if (origin && destination) {
      return {
        latitude:  (origin.latitude  + destination.coordinate.latitude)  / 2,
        longitude: (origin.longitude + destination.coordinate.longitude) / 2,
        latitudeDelta:  Math.abs(origin.latitude  - destination.coordinate.latitude)  * 3 + 0.006,
        longitudeDelta: Math.abs(origin.longitude - destination.coordinate.longitude) * 3 + 0.006,
      };
    }
    return { latitude: 6.4664, longitude: 3.5962, latitudeDelta: 0.01, longitudeDelta: 0.01 };
  }, [origin, destination]);

  const markers: NativeMarker[] = useMemo(() => {
    const m: NativeMarker[] = [];
    if (destination) {
      m.push({ id: destination.id, coordinate: destination.coordinate, title: destination.name, color: theme.colors.accent });
    }
    return m;
  }, [destination]);

  // Route summary pill content
  const routeSummary = directionsQuery.data
    ? `${directionsQuery.data.durationMinutes} min · ${formatDistance(directionsQuery.data.distanceMeters)}`
    : destination
    ? 'Calculating…'
    : 'Pick a destination';

  return (
    <View style={styles.root}>
      {/* ── Full-screen map (sits behind everything) ── */}
      <NativeMapView
        region={mapRegion}
        markers={markers}
        route={directionsQuery.data?.points ?? []}
        userLocation={origin}
        style={StyleSheet.absoluteFill}
        followsUserLocation={isActiveNav}
        showsUserLocation={isActiveNav}
      />

      {/* ── Top safe-area status bar area ── */}
      <SafeAreaView style={styles.topSafe} edges={['top']} pointerEvents="box-none">
        {/* Route summary floating pill */}
        <View style={styles.summaryRow}>
          <View style={styles.summaryPill}>
            <Navigation2 size={14} color={theme.colors.primary} />
            <Text style={styles.summaryText}>{routeSummary}</Text>
          </View>
          {directionsQuery.data && (
            <View style={styles.walkPill}>
              <Text style={styles.walkText}>🚶 Walk</Text>
            </View>
          )}
        </View>
      </SafeAreaView>

      {/* ── Arrival overlay ── */}
      {hasArrived && (
        <View style={styles.arrivalOverlay}>
          <View style={styles.arrivalCard}>
            <CheckCircle2 size={48} color={theme.colors.accent} />
            <Text style={styles.arrivalTitle}>You've arrived!</Text>
            <Text style={styles.arrivalSub}>{destination?.name}</Text>
            <PrimaryButton
              label="Done"
              onPress={() => { resetArrival(); setIsActiveNav(false); }}
              style={{ width: '100%', marginTop: 8 }}
            />
          </View>
        </View>
      )}

      {/* ── Bottom sheet wrapper ── */}
      <View
        style={[
          styles.sheetWrapper,
          { bottom: TAB_BAR_HEIGHT, height: WRAPPER_HEIGHT },
        ]}
        pointerEvents="box-none"
      >
        <Animated.View
          style={[styles.sheet, { transform: [{ translateY }] }]}
        >
          {/* Drag handle */}
          <View style={styles.handleArea} {...panResponder.panHandlers}>
            <View style={styles.handle} />
            {/* Collapse/expand hint */}
            <Pressable
              onPress={() => snapTo(isExpanded.current ? PEEK_OFFSET : EXPAND_OFFSET)}
              style={styles.handleToggle}
              hitSlop={10}
            >
              {isExpanded.current
                ? <ChevronDown size={18} color={theme.colors.textMuted} />
                : <ChevronUp   size={18} color={theme.colors.textMuted} />
              }
            </Pressable>
          </View>

          {/* Origin / Destination selectors */}
          <View style={styles.routeInputs}>
            <Pressable style={styles.routeInput} onPress={() => setShowOriginPicker(true)}>
              <View style={[styles.inputDot, { backgroundColor: theme.colors.primary }]} />
              <View style={styles.inputTexts}>
                <Text style={styles.inputLabel}>From</Text>
                <Text style={styles.inputValue} numberOfLines={1}>
                  {originBuilding ? originBuilding.name : 'My current location'}
                </Text>
              </View>
              <MapPin size={15} color={theme.colors.textMuted} />
            </Pressable>

            <View style={styles.routeDivider} />

            <Pressable style={styles.routeInput} onPress={() => setShowDestPicker(true)}>
              <View style={[styles.inputDot, { backgroundColor: theme.colors.accent }]} />
              <View style={styles.inputTexts}>
                <Text style={styles.inputLabel}>To</Text>
                <Text
                  style={[styles.inputValue, !destination && styles.inputPlaceholder]}
                  numberOfLines={1}
                >
                  {destination ? destination.name : 'Choose destination…'}
                </Text>
              </View>
              <MapPin size={15} color={theme.colors.textMuted} />
            </Pressable>
          </View>

          {/* Steps / states */}
          <View style={styles.stepsArea}>
            {!destination ? (
              <StateCard
                title="Where to?"
                description="Tap 'Choose destination' above to pick a building and get walking directions."
              />
            ) : directionsQuery.isLoading ? (
              <StateCard title="Finding route…" description="Calculating the best walking path." loading />
            ) : steps.length > 0 ? (
              <>
                <Text style={styles.stepsHeader}>
                  Step-by-step  ·  {steps.length} steps
                </Text>
                <ScrollView
                  style={styles.stepsList}
                  showsVerticalScrollIndicator={false}
                  nestedScrollEnabled
                >
                  {steps.map((step, i) => (
                    <View
                      key={i}
                      style={[styles.stepRow, i === 0 && isActiveNav && styles.stepHighlight]}
                    >
                      <View style={styles.stepIcon}>
                        <StepIcon type={step.icon} />
                      </View>
                      <Text style={styles.stepText} numberOfLines={3}>
                        {step.instruction}
                      </Text>
                      {step.distanceMeters > 0 && (
                        <Text style={styles.stepDist}>{step.distanceMeters}m</Text>
                      )}
                    </View>
                  ))}
                </ScrollView>
              </>
            ) : null}
          </View>

          {/* CTA row */}
          {destination && !directionsQuery.isLoading && (
            <View style={styles.ctaRow}>
              <PrimaryButton
                label={isActiveNav ? 'Stop Navigation' : 'Start Navigation'}
                onPress={toggleNav}
                variant={isActiveNav ? 'secondary' : 'primary'}
                style={styles.ctaBtn}
              />
              {!isActiveNav && (
                <Pressable
                  style={styles.refreshBtn}
                  onPress={() => void directionsQuery.refetch()}
                >
                  <Navigation2 size={20} color={theme.colors.primary} />
                </Pressable>
              )}
            </View>
          )}
        </Animated.View>
      </View>

      {/* ── Pickers ── */}
      <BuildingPicker
        visible={showOriginPicker}
        title="Choose start location"
        buildings={buildings}
        onSelect={b => { setOriginBuilding(b); setShowOriginPicker(false); }}
        onClose={() => setShowOriginPicker(false)}
      />
      <BuildingPicker
        visible={showDestPicker}
        title="Choose destination"
        buildings={buildings}
        onSelect={b => { setDestinationBuilding(b); setShowDestPicker(false); }}
        onClose={() => setShowDestPicker(false)}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: '#000' },

  // Top safe area (summary pill)
  topSafe: {
    position: 'absolute',
    top: 0, left: 0, right: 0,
    zIndex: 10,
    pointerEvents: 'box-none',
  },
  summaryRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    margin: 16,
    marginTop: 8,
  },
  summaryPill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 7,
    backgroundColor: 'rgba(255,255,255,0.95)',
    paddingHorizontal: 14,
    paddingVertical: 10,
    borderRadius: theme.radius.pill,
    ...theme.shadow,
  },
  summaryText: {
    fontSize: 14,
    fontFamily: 'Poppins_700Bold',
    color: theme.colors.primary,
  },
  walkPill: {
    backgroundColor: '#E8F5E9',
    paddingHorizontal: 12,
    paddingVertical: 10,
    borderRadius: theme.radius.pill,
    ...theme.shadow,
  },
  walkText: {
    fontSize: 13,
    fontFamily: 'Poppins_700Bold',
    color: '#2E7D32',
  },

  // Arrival overlay
  arrivalOverlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(0,0,0,0.45)',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 32,
    zIndex: 30,
  },
  arrivalCard: {
    width: '100%',
    borderRadius: 28,
    backgroundColor: theme.colors.surface,
    padding: 28,
    alignItems: 'center',
    gap: 10,
    ...theme.shadow,
  },
  arrivalTitle: { fontSize: 24, fontFamily: 'Poppins_800ExtraBold', color: theme.colors.text },
  arrivalSub:   { fontSize: 15, fontFamily: 'Poppins_700Bold',      color: theme.colors.primary },

  // Sheet wrapper + sheet
  sheetWrapper: {
    position: 'absolute',
    left: 0, right: 0,
    overflow: 'visible',
  },
  sheet: {
    flex: 1,
    backgroundColor: theme.colors.surface,
    borderTopLeftRadius: 26,
    borderTopRightRadius: 26,
    paddingHorizontal: 18,
    paddingBottom: 12,
    gap: 12,
    ...theme.shadow,
  },

  // Drag handle
  handleArea: {
    alignItems: 'center',
    paddingTop: 10,
    paddingBottom: 2,
    flexDirection: 'row',
    justifyContent: 'center',
  },
  handle: {
    width: 36, height: 5,
    borderRadius: 3,
    backgroundColor: '#CBD5E1',
  },
  handleToggle: {
    position: 'absolute',
    right: 0,
    padding: 4,
  },

  // Route inputs
  routeInputs: {
    backgroundColor: theme.colors.background,
    borderRadius: 18,
    borderWidth: 1,
    borderColor: theme.colors.border,
    overflow: 'hidden',
  },
  routeInput: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    paddingHorizontal: 16,
    paddingVertical: 13,
  },
  inputDot: { width: 10, height: 10, borderRadius: 5 },
  inputTexts: { flex: 1 },
  inputLabel: {
    fontSize: 10,
    fontFamily: 'Poppins_700Bold',
    color: theme.colors.textMuted,
    textTransform: 'uppercase',
    letterSpacing: 0.8,
  },
  inputValue: {
    fontSize: 14,
    fontFamily: 'Poppins_700Bold',
    color: theme.colors.text,
    marginTop: 1,
  },
  inputPlaceholder: {
    color: theme.colors.textMuted,
    fontFamily: 'DMSans_400Regular',
  },
  routeDivider: {
    height: 1,
    backgroundColor: theme.colors.border,
    marginLeft: 38,
  },

  // Steps
  stepsArea: { flex: 1, minHeight: 60 },
  stepsHeader: {
    fontSize: 13,
    fontFamily: 'Poppins_700Bold',
    color: theme.colors.textMuted,
    marginBottom: 4,
  },
  stepsList: { flex: 1 },
  stepRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 10,
    paddingHorizontal: 4,
    borderBottomWidth: 1,
    borderBottomColor: theme.colors.border,
    gap: 10,
  },
  stepHighlight: {
    backgroundColor: theme.colors.surfaceAlt,
    borderRadius: 10,
    borderBottomWidth: 0,
  },
  stepIcon: {
    width: 28, height: 28, borderRadius: 14,
    backgroundColor: theme.colors.surface,
    alignItems: 'center', justifyContent: 'center',
    borderWidth: 1, borderColor: theme.colors.border,
  },
  stepText: {
    flex: 1,
    fontSize: 13,
    fontFamily: 'DMSans_400Regular',
    color: theme.colors.text,
    lineHeight: 18,
  },
  stepDist: {
    fontSize: 11,
    fontFamily: 'Poppins_700Bold',
    color: theme.colors.textMuted,
  },

  // CTA
  ctaRow: {
    flexDirection: 'row',
    gap: 10,
    alignItems: 'center',
    paddingTop: 4,
  },
  ctaBtn: { flex: 1 },
  refreshBtn: {
    width: 50, height: 50, borderRadius: 25,
    backgroundColor: theme.colors.surfaceAlt,
    alignItems: 'center', justifyContent: 'center',
    borderWidth: 1, borderColor: theme.colors.border,
  },
});
