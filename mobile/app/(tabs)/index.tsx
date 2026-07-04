import * as Haptics from 'expo-haptics';
import { Image } from 'expo-image';
import { router } from 'expo-router';
import {
  BookOpen,
  ChevronRight,
  Dumbbell,
  MapPin,
  QrCode,
  Settings,
  Sparkles,
  UtensilsCrossed,
  PackageSearch,
  Zap,
} from 'lucide-react-native';
import { ScrollView, StyleSheet, Text, View, Pressable } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { NativeMapView } from '@/components/NativeMapView';
import { theme } from '@/constants/theme';
import { useBuildings } from '@/hooks/useCampusData';
import { useUserLocation } from '@/hooks/useUserLocation';
import { getDistanceMeters, formatDistance, getInitialRegion } from '@/utils/geo';
import { useAppStore } from '@/store/useAppStore';

// ── Quick Access Categories ───────────────────────────────────────────────
const CATEGORIES = [
  { label: 'Academic',     icon: BookOpen,        color: '#0D8C60', bg: '#E8F5F0', filter: 'faculty',  route: null },
  { label: 'Lost & Found', icon: PackageSearch,   color: '#7C5CFA', bg: '#F0ECFF', filter: null,        route: '/(tabs)/lost-found' },
  { label: 'Sports',       icon: Dumbbell,        color: '#F27C42', bg: '#FFF3EC', filter: 'lab',       route: null },
  { label: 'Cafeteria',    icon: UtensilsCrossed, color: '#D85B73', bg: '#FFF0F4', filter: 'facility',  route: null },
] as const;

// Hard-coded "recent enquiries" (demo data — replace with persisted history later)
const RECENT = [
  { id: 'library-complex',   name: 'Library',    distance: '350m',  status: 'Open'   },
  { id: 'ict-center',        name: 'ICT Centre', distance: '650m',  status: 'Active' },
  { id: 'engineering-block', name: 'Computer Science', distance: '210m', status: 'Active' },
];

export default function HomeScreen() {
  const { buildings } = useBuildings();
  const { location } = useUserLocation();
  const lastMapRegion = useAppStore(s => s.lastMapRegion);

  // Campus-gate region fallback
  const mapRegion = getInitialRegion(lastMapRegion);

  // Compute distance badge for a building (fallback to static if no GPS)
  const distanceTo = (buildingId: string) => {
    if (!location) return null;
    const b = buildings.find(x => x.id === buildingId);
    if (!b) return null;
    return formatDistance(getDistanceMeters(location, b.coordinate));
  };

  const handleCategoryPress = (cat: typeof CATEGORIES[number]) => {
    void Haptics.selectionAsync();
    if (cat.route) {
      router.push(cat.route as any);
    } else if (cat.filter) {
      router.push(`/(tabs)/map?category=${cat.filter}` as any);
    }
  };

  return (
    <SafeAreaView style={styles.root} edges={['top']}>
      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.scroll}
      >
        {/* ── Top bar ───────────────────────────────────────────────────── */}
        <View style={styles.topBar}>
          <View style={styles.topBarLeft}>
            <Text style={styles.greeting}>LASUSTECH</Text>
            <Text style={styles.appName}>PathFindr</Text>
          </View>
          <View style={styles.topBarRight}>
            <Pressable
              style={styles.iconBtn}
              onPress={() => router.push('/scan')}
              accessibilityLabel="Scan QR code"
            >
              <QrCode size={20} color={theme.colors.primary} />
            </Pressable>
            <Pressable
              style={styles.iconBtn}
              onPress={() => router.push('/(tabs)/settings')}
              accessibilityLabel="Settings"
            >
              <Settings size={20} color={theme.colors.text} />
            </Pressable>
          </View>
        </View>

        {/* ── Hero: Where to? ───────────────────────────────────────────── */}
        <View style={styles.heroSection}>
          <Text style={styles.heroTitle}>Where to?</Text>
          <Text style={styles.heroSub}>
            Find your way around the campus with ease.
          </Text>

          <Pressable
            style={styles.searchBar}
            onPress={() => router.push({ pathname: '/(tabs)/map', params: { focusSearch: 'true' } })}
            accessibilityLabel="Search campus buildings"
          >
            <MapPin size={18} color={theme.colors.textMuted} />
            <Text style={styles.searchPlaceholder}>Search Campus Buildings…</Text>
          </Pressable>
        </View>

        {/* ── Quick Access Categories ───────────────────────────────────── */}
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>Quick Access</Text>
            <Pressable onPress={() => router.push('/(tabs)/map')}>
              <Text style={styles.sectionAction}>See all</Text>
            </Pressable>
          </View>

          <View style={styles.categoryGrid}>
            {CATEGORIES.map(cat => (
              <Pressable
                key={cat.label}
                style={[styles.categoryCard, { backgroundColor: cat.bg }]}
                onPress={() => handleCategoryPress(cat)}
              >
                <View style={[styles.categoryIcon, { backgroundColor: cat.color + '22' }]}>
                  <cat.icon size={22} color={cat.color} />
                </View>
                <Text style={[styles.categoryLabel, { color: cat.color }]}>{cat.label}</Text>
              </Pressable>
            ))}
          </View>
        </View>

        {/* ── Campus Map Preview ────────────────────────────────────────── */}
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>Campus Map</Text>
            <Pressable onPress={() => router.push('/(tabs)/map')}>
              <Text style={styles.sectionAction}>Open full map</Text>
            </Pressable>
          </View>

          <Pressable
            style={styles.mapPreviewWrap}
            onPress={() => router.push('/(tabs)/map')}
            accessibilityLabel="Open campus map"
          >
            <NativeMapView
              region={mapRegion}
              style={styles.mapPreview}
              animateRoute={false}
              showsUserLocation={false}
            />
            {/* Overlay label */}
            <View style={styles.mapLabel}>
              <MapPin size={12} color={theme.colors.primary} />
              <Text style={styles.mapLabelText}>Currently at Main Gate</Text>
            </View>
          </Pressable>
        </View>

        {/* ── Recent Location Enquiries ─────────────────────────────────── */}
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>Recent Enquiries</Text>
          </View>

          <View style={styles.recentList}>
            {RECENT.map((item, idx) => {
              const liveDist = distanceTo(item.id);
              const isOpen = item.status === 'Open';
              return (
                <Pressable
                  key={item.id}
                  style={[styles.recentRow, idx === RECENT.length - 1 && styles.recentRowLast]}
                  onPress={() => router.push(`/building/${item.id}`)}
                >
                  <View style={styles.recentIcon}>
                    <MapPin size={16} color={theme.colors.primary} />
                  </View>
                  <View style={styles.recentText}>
                    <Text style={styles.recentName}>{item.name}</Text>
                    <Text style={styles.recentMeta}>
                      {liveDist ?? item.distance} away ·{' '}
                      <Text style={{ color: isOpen ? theme.colors.success : theme.colors.primary }}>
                        {item.status}
                      </Text>
                    </Text>
                  </View>
                  <ChevronRight size={16} color={theme.colors.textMuted} />
                </Pressable>
              );
            })}
          </View>
        </View>

        {/* ── AI Promo ──────────────────────────────────────────────────── */}
        <Pressable
          style={styles.aiPromo}
          onPress={() => router.push('/(tabs)/ai-assistant')}
          accessibilityLabel="Open AI assistant"
        >
          <View style={styles.aiPromoIcon}>
            <Sparkles size={28} color="#FFF" />
          </View>
          <View style={styles.aiPromoText}>
            <Text style={styles.aiPromoTitle}>Ask AI anything</Text>
            <Text style={styles.aiPromoSub}>
              Fastest route, lecture rooms, cafeteria menus — chat with our smart assistant!
            </Text>
          </View>
          <View style={styles.aiPromoArrow}>
            <Zap size={18} color={theme.colors.accent} />
          </View>
        </Pressable>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: theme.colors.background },
  scroll: { paddingBottom: 100 },

  // Top bar
  topBar: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingTop: 8,
    paddingBottom: 4,
  },
  topBarLeft: { gap: 2 },
  appName: { fontSize: 22, fontFamily: 'Poppins_800ExtraBold', color: theme.colors.text },
  greeting: { fontSize: 11, fontFamily: 'Poppins_700Bold', color: theme.colors.primary, textTransform: 'uppercase', letterSpacing: 1 },
  topBarRight: { flexDirection: 'row', gap: 10 },
  iconBtn: {
    width: 40, height: 40, borderRadius: 20,
    backgroundColor: theme.colors.surface,
    alignItems: 'center', justifyContent: 'center',
    borderWidth: 1, borderColor: theme.colors.border,
    ...theme.shadow,
  },

  // Hero
  heroSection: {
    paddingHorizontal: 20,
    paddingTop: 20,
    paddingBottom: 8,
    gap: 8,
  },
  heroTitle: { fontSize: 32, fontFamily: 'Poppins_800ExtraBold', color: theme.colors.text },
  heroSub: { fontSize: 15, fontFamily: 'DMSans_400Regular', color: theme.colors.textMuted, lineHeight: 22 },
  searchBar: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    backgroundColor: theme.colors.surface,
    borderRadius: theme.radius.pill,
    paddingHorizontal: 18,
    paddingVertical: 16,
    marginTop: 6,
    borderWidth: 1,
    borderColor: theme.colors.border,
    ...theme.shadow,
  },
  searchPlaceholder: { flex: 1, fontSize: 15, fontFamily: 'DMSans_400Regular', color: theme.colors.textMuted },

  // Sections
  section: { paddingHorizontal: 20, paddingTop: 24 },
  sectionHeader: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 14 },
  sectionTitle: { fontSize: 18, fontFamily: 'Poppins_800ExtraBold', color: theme.colors.text },
  sectionAction: { fontSize: 14, fontFamily: 'Poppins_700Bold', color: theme.colors.primary },

  // Category grid
  categoryGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 12 },
  categoryCard: {
    width: '47%',
    borderRadius: 20,
    padding: 16,
    gap: 10,
    ...theme.shadow,
  },
  categoryIcon: {
    width: 44, height: 44, borderRadius: 14,
    alignItems: 'center', justifyContent: 'center',
  },
  categoryLabel: { fontSize: 14, fontFamily: 'Poppins_700Bold' },

  // Map preview
  mapPreviewWrap: {
    height: 180,
    borderRadius: 22,
    overflow: 'hidden',
    ...theme.shadow,
  },
  mapPreview: { flex: 1 },
  mapLabel: {
    position: 'absolute',
    bottom: 10,
    left: 12,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: 'rgba(255,255,255,0.92)',
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: theme.radius.pill,
    borderWidth: 1,
    borderColor: theme.colors.border,
  },
  mapLabelText: { fontSize: 12, fontFamily: 'Poppins_700Bold', color: theme.colors.primary },

  // Recent
  recentList: {
    backgroundColor: theme.colors.surface,
    borderRadius: 20,
    overflow: 'hidden',
    ...theme.shadow,
  },
  recentRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 14,
    borderBottomWidth: 1,
    borderBottomColor: theme.colors.border,
    gap: 12,
  },
  recentRowLast: { borderBottomWidth: 0 },
  recentIcon: {
    width: 36, height: 36, borderRadius: 12,
    backgroundColor: theme.colors.surfaceAlt,
    alignItems: 'center', justifyContent: 'center',
  },
  recentText: { flex: 1 },
  recentName: { fontSize: 15, fontFamily: 'Poppins_700Bold', color: theme.colors.text },
  recentMeta: { fontSize: 13, fontFamily: 'DMSans_400Regular', color: theme.colors.textMuted, marginTop: 2 },

  // AI promo
  aiPromo: {
    marginHorizontal: 20,
    marginTop: 24,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 14,
    backgroundColor: theme.colors.primary,
    borderRadius: 24,
    padding: 18,
    ...theme.shadow,
  },
  aiPromoIcon: {
    width: 52, height: 52, borderRadius: 16,
    backgroundColor: 'rgba(255,255,255,0.15)',
    alignItems: 'center', justifyContent: 'center',
  },
  aiPromoText: { flex: 1, gap: 4 },
  aiPromoTitle: { fontSize: 16, fontFamily: 'Poppins_800ExtraBold', color: '#FFF' },
  aiPromoSub: { fontSize: 13, fontFamily: 'DMSans_400Regular', color: 'rgba(255,255,255,0.8)', lineHeight: 18 },
  aiPromoArrow: {
    width: 36, height: 36, borderRadius: 18,
    backgroundColor: 'rgba(255,255,255,0.15)',
    alignItems: 'center', justifyContent: 'center',
  },
});
