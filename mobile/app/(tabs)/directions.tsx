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
} from 'lucide-react-native';
import { useMemo, useState } from 'react';
import {
  FlatList,
  Modal,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
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

  // Origin: use live GPS location if no building selected; otherwise use the
  // selected origin building's coordinate.
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
    if (directionsQuery.data?.instructions && directionsQuery.data.instructions.length > 0) {
      return directionsQuery.data.instructions.map((inst: any) => ({
        instruction: inst.instruction,
        distanceMeters: inst.distanceMeters,
        icon: (
          inst.instruction.includes('Turn left') ? 'turn-left' :
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

  const handleDismissArrival = () => {
    resetArrival();
    setIsActiveNav(false);
  };

  const mapRegion = useMemo(() => {
    if (origin && destination) {
      return {
        latitude: (origin.latitude + destination.coordinate.latitude) / 2,
        longitude: (origin.longitude + destination.coordinate.longitude) / 2,
        latitudeDelta: Math.abs(origin.latitude - destination.coordinate.latitude) * 3 + 0.006,
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

  const StepIcon = ({ type }: { type: NavigationStep['icon'] }) => {
    switch (type) {
      case 'straight':    return <Navigation   size={16} color={theme.colors.primary} />;
      case 'turn-left':   return <CornerDownLeft  size={16} color={theme.colors.primary} />;
      case 'turn-right':  return <CornerDownRight size={16} color={theme.colors.primary} />;
      case 'arrive':      return <MapPinned    size={16} color={theme.colors.accent}   />;
      default: return null;
    }
  };

  return (
    <SafeAreaView style={styles.root} edges={['top']}>
      {/* ── Map ─────────────────────────────────────────────────────────── */}
      <View style={styles.mapWrap}>
        <NativeMapView
          region={mapRegion}
          markers={markers}
          route={directionsQuery.data?.points ?? []}
          userLocation={origin}
          style={styles.map}
          followsUserLocation={isActiveNav}
          showsUserLocation={isActiveNav}
        />
      </View>

      {/* ── Arrival overlay ─────────────────────────────────────────────── */}
      {hasArrived && (
        <View style={styles.arrivalOverlay}>
          <View style={styles.arrivalCard}>
            <CheckCircle2 size={44} color={theme.colors.accent} />
            <Text style={styles.arrivalTitle}>You've arrived!</Text>
            <Text style={styles.arrivalSub}>{destination?.name}</Text>
            <PrimaryButton label="Done" onPress={handleDismissArrival} style={{ width: '100%', marginTop: 8 }} />
          </View>
        </View>
      )}

      {/* ── Bottom panel ────────────────────────────────────────────────── */}
      <View style={[styles.panel, { paddingBottom: insets.bottom + 8 }]}>
        {/* Route header pill */}
        <View style={styles.routeHeaderRow}>
          <View style={styles.pill}>
            <Navigation2 size={14} color={theme.colors.primary} />
            <Text style={styles.pillText}>
              {directionsQuery.data
                ? `${directionsQuery.data.durationMinutes} min · ${formatDistance(directionsQuery.data.distanceMeters)}`
                : 'Fastest Route'}
            </Text>
          </View>
          {directionsQuery.data && (
            <View style={styles.modePill}>
              <Text style={styles.modeText}>🏃 Walk</Text>
            </View>
          )}
        </View>

        {/* Origin / Destination selectors */}
        <View style={styles.routeInputs}>
          <Pressable style={styles.routeInput} onPress={() => setShowOriginPicker(true)}>
            <View style={[styles.inputDot, { backgroundColor: theme.colors.primary }]} />
            <View style={styles.inputTexts}>
              <Text style={styles.inputLabel}>Start Location</Text>
              <Text style={styles.inputValue} numberOfLines={1}>
                {originBuilding ? originBuilding.name : 'Currently at Campus Hub'}
              </Text>
            </View>
            <MapPin size={16} color={theme.colors.textMuted} />
          </Pressable>

          <View style={styles.divider} />

          <Pressable style={styles.routeInput} onPress={() => setShowDestPicker(true)}>
            <View style={[styles.inputDot, { backgroundColor: theme.colors.accent }]} />
            <View style={styles.inputTexts}>
              <Text style={styles.inputLabel}>Target Location</Text>
              <Text style={[styles.inputValue, !destination && styles.inputPlaceholder]} numberOfLines={1}>
                {destination ? destination.name : 'Choose a destination…'}
              </Text>
            </View>
            <MapPin size={16} color={theme.colors.textMuted} />
          </Pressable>
        </View>

        {/* Steps / states */}
        {!destination ? (
          <StateCard
            title="Where are you headed?"
            description="Tap 'Target Location' above to pick a building and get step-by-step walking directions."
          />
        ) : directionsQuery.isLoading ? (
          <StateCard title="Calculating route…" description="Finding the best walking path across campus." loading />
        ) : directionsQuery.data && steps.length > 0 ? (
          <View style={styles.stepsSection}>
            <Text style={styles.stepsHeader}>Step-by-step directions</Text>
            <ScrollView style={styles.stepsList} showsVerticalScrollIndicator={false} nestedScrollEnabled>
              {steps.map((step, i) => (
                <View key={i} style={[styles.stepRow, i === 0 && isActiveNav && styles.stepHighlight]}>
                  <View style={styles.stepIcon}><StepIcon type={step.icon} /></View>
                  <Text style={styles.stepText} numberOfLines={3}>{step.instruction}</Text>
                  {step.distanceMeters > 0 && (
                    <Text style={styles.stepDist}>{step.distanceMeters}m</Text>
                  )}
                </View>
              ))}
            </ScrollView>
          </View>
        ) : null}

        {/* CTA */}
        {destination && !directionsQuery.isLoading && (
          <View style={styles.ctaRow}>
            <PrimaryButton
              label={isActiveNav ? 'Stop Navigation' : 'Start Navigation Simulation'}
              onPress={toggleNav}
              variant={isActiveNav ? 'secondary' : 'primary'}
              style={styles.ctaBtn}
            />
            {!isActiveNav && (
              <Pressable style={styles.refreshBtn} onPress={() => void directionsQuery.refetch()}>
                <Navigation2 size={20} color={theme.colors.primary} />
              </Pressable>
            )}
          </View>
        )}
      </View>

      {/* ── Pickers ──────────────────────────────────────────────────────── */}
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
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: theme.colors.background },
  mapWrap: { flex: 1 },
  map: { flex: 1 },

  // Arrival
  arrivalOverlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(0,0,0,0.45)',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 32,
    zIndex: 20,
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
  arrivalSub: { fontSize: 15, fontFamily: 'Poppins_700Bold', color: theme.colors.primary },

  // Panel
  panel: {
    backgroundColor: theme.colors.surface,
    borderTopLeftRadius: 28,
    borderTopRightRadius: 28,
    padding: 18,
    gap: 14,
    ...theme.shadow,
    maxHeight: '55%',
  },

  // Route header
  routeHeaderRow: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  pill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: theme.colors.surfaceAlt,
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: theme.radius.pill,
  },
  pillText: { fontSize: 14, fontFamily: 'Poppins_700Bold', color: theme.colors.primary },
  modePill: {
    backgroundColor: '#E8F5E9',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: theme.radius.pill,
  },
  modeText: { fontSize: 13, fontFamily: 'Poppins_700Bold', color: '#2E7D32' },

  // Route inputs
  routeInputs: {
    backgroundColor: theme.colors.background,
    borderRadius: 20,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: theme.colors.border,
  },
  routeInput: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    paddingHorizontal: 16,
    paddingVertical: 14,
  },
  inputDot: { width: 10, height: 10, borderRadius: 5 },
  inputTexts: { flex: 1 },
  inputLabel: { fontSize: 11, fontFamily: 'Poppins_700Bold', color: theme.colors.textMuted, textTransform: 'uppercase', letterSpacing: 0.6 },
  inputValue: { fontSize: 15, fontFamily: 'Poppins_700Bold', color: theme.colors.text, marginTop: 1 },
  inputPlaceholder: { color: theme.colors.textMuted, fontFamily: 'DMSans_400Regular' },
  divider: { height: 1, backgroundColor: theme.colors.border, marginLeft: 38 },

  // Steps
  stepsSection: { gap: 8 },
  stepsHeader: { fontSize: 14, fontFamily: 'Poppins_700Bold', color: theme.colors.text },
  stepsList: { maxHeight: 180 },
  stepRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 10,
    paddingHorizontal: 6,
    borderBottomWidth: 1,
    borderBottomColor: theme.colors.border,
    gap: 10,
  },
  stepHighlight: {
    backgroundColor: theme.colors.surfaceAlt,
    borderRadius: 12,
    borderBottomWidth: 0,
  },
  stepIcon: {
    width: 28, height: 28, borderRadius: 14,
    backgroundColor: theme.colors.surface,
    alignItems: 'center', justifyContent: 'center',
    borderWidth: 1, borderColor: theme.colors.border,
  },
  stepText: { flex: 1, fontSize: 13, fontFamily: 'DMSans_400Regular', color: theme.colors.text },
  stepDist: { fontSize: 11, fontFamily: 'Poppins_700Bold', color: theme.colors.textMuted },

  // CTA
  ctaRow: { flexDirection: 'row', gap: 10, alignItems: 'center' },
  ctaBtn: { flex: 1 },
  refreshBtn: {
    width: 52, height: 52, borderRadius: 26,
    backgroundColor: theme.colors.surfaceAlt,
    alignItems: 'center', justifyContent: 'center',
    borderWidth: 1, borderColor: theme.colors.border,
  },
});
