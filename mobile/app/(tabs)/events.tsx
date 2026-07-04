import { Image } from 'expo-image';
import { router } from 'expo-router';
import { CalendarDays, Clock3, MapPin } from 'lucide-react-native';
import React, { useMemo, useState } from 'react';
import {
  FlatList,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
  ActivityIndicator,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { StateCard } from '@/components/StateCard';
import { theme } from '@/constants/theme';
import { useEvents } from '@/hooks/useCampusData';

type Category = 'all' | 'academic' | 'social' | 'sports' | 'career';

const TABS: { label: string; value: Category; color: string }[] = [
  { label: 'All',      value: 'all',      color: theme.colors.primary },
  { label: 'Academic', value: 'academic', color: '#0D8C60' },
  { label: 'Social',   value: 'social',   color: '#7C5CFA' },
  { label: 'Sports',   value: 'sports',   color: '#F27C42' },
  { label: 'Career',   value: 'career',   color: '#2078B4' },
];

const CATEGORY_BG: Record<Category | string, string> = {
  all:      theme.colors.surfaceAlt,
  academic: '#E8F5F0',
  social:   '#F0ECFF',
  sports:   '#FFF3EC',
  career:   '#EBF4FF',
};

const CATEGORY_COLOR: Record<Category | string, string> = {
  all:      theme.colors.primary,
  academic: '#0D8C60',
  social:   '#7C5CFA',
  sports:   '#F27C42',
  career:   '#2078B4',
};

export default function EventsScreen() {
  const { events, isLoading } = useEvents();
  const [activeTab, setActiveTab] = useState<Category>('all');

  const filtered = useMemo(() => {
    if (activeTab === 'all') return events;
    return events.filter(e => e.category === activeTab);
  }, [events, activeTab]);

  const featured = filtered[0] ?? null;
  const rest     = filtered.slice(1);

  return (
    <SafeAreaView style={styles.root} edges={['top']} testID="events-screen">
      {/* ── Header ── */}
      <View style={styles.header}>
        <View>
          <Text style={styles.eyebrow}>Campus Pulse</Text>
          <Text style={styles.title}>Events</Text>
        </View>
        {!isLoading && (
          <View style={styles.countBadge}>
            <Text style={styles.countText}>{filtered.length}</Text>
          </View>
        )}
      </View>

      {/* ── Category tabs ── */}
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={styles.tabs}
      >
        {TABS.map(tab => {
          const active = tab.value === activeTab;
          return (
            <Pressable
              key={tab.value}
              style={[styles.tab, active && { backgroundColor: tab.color, borderColor: tab.color }]}
              onPress={() => setActiveTab(tab.value)}
            >
              <Text style={[styles.tabText, active && styles.tabTextActive]}>
                {tab.label}
              </Text>
            </Pressable>
          );
        })}
      </ScrollView>

      {/* ── Content ── */}
      {isLoading ? (
        <View style={styles.center}>
          <ActivityIndicator color={theme.colors.primary} size="large" />
          <Text style={styles.loadingText}>Loading events…</Text>
        </View>
      ) : filtered.length === 0 ? (
        <View style={styles.center}>
          <StateCard
            title="Nothing here yet"
            description="New events will appear here when they're published."
          />
        </View>
      ) : (
        <FlatList
          data={rest}
          keyExtractor={item => item.id}
          contentContainerStyle={styles.list}
          showsVerticalScrollIndicator={false}
          ListHeaderComponent={
            featured ? (
              <FeaturedCard
                item={featured}
                onPress={() => router.push(`/building/${featured.buildingId}`)}
              />
            ) : null
          }
          renderItem={({ item }) => (
            <EventRow
              item={item}
              onPress={() => router.push(`/building/${item.buildingId}`)}
            />
          )}
          ItemSeparatorComponent={() => <View style={styles.separator} />}
        />
      )}
    </SafeAreaView>
  );
}

// ── Featured card (first item, full-width with image) ─────────────────────
function FeaturedCard({ item, onPress }: { item: any; onPress: () => void }) {
  const color = CATEGORY_COLOR[item.category] ?? theme.colors.primary;
  const bg    = CATEGORY_BG[item.category]    ?? theme.colors.surfaceAlt;

  return (
    <Pressable style={styles.featuredCard} onPress={onPress} testID={`event-featured-${item.id}`}>
      <Image source={{ uri: item.imageUrl }} style={styles.featuredImage} contentFit="cover" />
      {/* Gradient overlay feel */}
      <View style={styles.featuredOverlay} />
      <View style={styles.featuredContent}>
        <View style={[styles.badge, { backgroundColor: bg }]}>
          <Text style={[styles.badgeText, { color }]}>
            {item.category.charAt(0).toUpperCase() + item.category.slice(1)}
          </Text>
        </View>
        <Text style={styles.featuredTitle} numberOfLines={2}>{item.title}</Text>
        <View style={styles.featuredMeta}>
          <View style={styles.metaChip}>
            <CalendarDays size={12} color="rgba(255,255,255,0.85)" />
            <Text style={styles.metaChipText}>{item.dateLabel}</Text>
          </View>
          <View style={styles.metaChip}>
            <Clock3 size={12} color="rgba(255,255,255,0.85)" />
            <Text style={styles.metaChipText}>{item.startTime}</Text>
          </View>
          <View style={styles.metaChip}>
            <MapPin size={12} color="rgba(255,255,255,0.85)" />
            <Text style={styles.metaChipText} numberOfLines={1}>{item.locationName}</Text>
          </View>
        </View>
      </View>
    </Pressable>
  );
}

// ── Compact event row ─────────────────────────────────────────────────────
function EventRow({ item, onPress }: { item: any; onPress: () => void }) {
  const color = CATEGORY_COLOR[item.category] ?? theme.colors.primary;
  const bg    = CATEGORY_BG[item.category]    ?? theme.colors.surfaceAlt;

  return (
    <Pressable style={styles.row} onPress={onPress} testID={`event-card-${item.id}`}>
      {/* Date block */}
      <View style={styles.datePill}>
        <Text style={styles.dateDay}>
          {item.dateLabel?.split(' ')[1] ?? '—'}
        </Text>
        <Text style={styles.dateMon}>
          {item.dateLabel?.split(' ')[0]?.slice(0, 3) ?? ''}
        </Text>
      </View>

      {/* Main content */}
      <View style={styles.rowContent}>
        <View style={styles.rowTopRow}>
          <View style={[styles.badge, { backgroundColor: bg }]}>
            <Text style={[styles.badgeText, { color }]}>
              {item.category.charAt(0).toUpperCase() + item.category.slice(1)}
            </Text>
          </View>
          <Text style={styles.rowTime}>{item.startTime}</Text>
        </View>
        <Text style={styles.rowTitle} numberOfLines={1}>{item.title}</Text>
        <View style={styles.rowLocation}>
          <MapPin size={12} color={theme.colors.textMuted} />
          <Text style={styles.rowLocationText} numberOfLines={1}>{item.locationName}</Text>
        </View>
      </View>

      {/* Thumbnail */}
      {item.imageUrl ? (
        <Image source={{ uri: item.imageUrl }} style={styles.rowThumb} contentFit="cover" />
      ) : null}
    </Pressable>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: theme.colors.background },

  // Header
  header: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingTop: 8,
    paddingBottom: 4,
  },
  eyebrow: {
    fontSize: 11,
    fontFamily: 'Poppins_700Bold',
    color: theme.colors.primary,
    textTransform: 'uppercase',
    letterSpacing: 1.2,
  },
  title: {
    fontSize: 28,
    fontFamily: 'Poppins_800ExtraBold',
    color: theme.colors.text,
    lineHeight: 34,
  },
  countBadge: {
    minWidth: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: theme.colors.surfaceAlt,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 10,
    marginBottom: 2,
    borderWidth: 1,
    borderColor: theme.colors.border,
  },
  countText: {
    fontSize: 13,
    fontFamily: 'Poppins_800ExtraBold',
    color: theme.colors.primary,
  },

  // Tabs
  tabs: {
    paddingHorizontal: 20,
    paddingVertical: 12,
    gap: 8,
  },
  tab: {
    paddingHorizontal: 16,
    paddingVertical: 7,
    borderRadius: theme.radius.pill,
    backgroundColor: theme.colors.surface,
    borderWidth: 1,
    borderColor: theme.colors.border,
  },
  tabText: {
    fontSize: 13,
    fontFamily: 'Poppins_700Bold',
    color: theme.colors.text,
  },
  tabTextActive: { color: '#FFF' },

  // States
  center: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: 24,
    gap: 12,
  },
  loadingText: {
    fontSize: 14,
    fontFamily: 'DMSans_400Regular',
    color: theme.colors.textMuted,
  },

  // List
  list: {
    paddingHorizontal: 16,
    paddingBottom: 100,
    gap: 0,
  },
  separator: {
    height: 1,
    backgroundColor: theme.colors.border,
    marginLeft: 76,
  },

  // Featured card
  featuredCard: {
    borderRadius: 22,
    overflow: 'hidden',
    marginBottom: 16,
    height: 220,
    ...theme.shadow,
  },
  featuredImage: {
    ...StyleSheet.absoluteFillObject,
  },
  featuredOverlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(10,30,20,0.52)',
  },
  featuredContent: {
    flex: 1,
    justifyContent: 'flex-end',
    padding: 16,
    gap: 8,
  },
  featuredTitle: {
    fontSize: 20,
    fontFamily: 'Poppins_800ExtraBold',
    color: '#FFF',
    lineHeight: 26,
  },
  featuredMeta: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 6,
  },
  metaChip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: 'rgba(255,255,255,0.15)',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: theme.radius.pill,
  },
  metaChipText: {
    fontSize: 11,
    fontFamily: 'DMSans_400Regular',
    color: 'rgba(255,255,255,0.9)',
  },

  // Category badge (shared)
  badge: {
    alignSelf: 'flex-start',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 6,
  },
  badgeText: {
    fontSize: 10,
    fontFamily: 'Poppins_700Bold',
    textTransform: 'uppercase',
    letterSpacing: 0.4,
  },

  // Row card
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    backgroundColor: theme.colors.surface,
    paddingVertical: 13,
    paddingHorizontal: 12,
  },
  datePill: {
    width: 44,
    alignItems: 'center',
    gap: 1,
    flexShrink: 0,
  },
  dateDay: {
    fontSize: 20,
    fontFamily: 'Poppins_800ExtraBold',
    color: theme.colors.text,
    lineHeight: 24,
  },
  dateMon: {
    fontSize: 11,
    fontFamily: 'Poppins_700Bold',
    color: theme.colors.primary,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  rowContent: { flex: 1, gap: 3 },
  rowTopRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  rowTime: {
    fontSize: 11,
    fontFamily: 'Poppins_700Bold',
    color: theme.colors.textMuted,
    marginLeft: 'auto',
  },
  rowTitle: {
    fontSize: 14,
    fontFamily: 'Poppins_700Bold',
    color: theme.colors.text,
  },
  rowLocation: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  rowLocationText: {
    fontSize: 12,
    fontFamily: 'DMSans_400Regular',
    color: theme.colors.textMuted,
    flex: 1,
  },
  rowThumb: {
    width: 56,
    height: 56,
    borderRadius: 12,
    flexShrink: 0,
  },
});
