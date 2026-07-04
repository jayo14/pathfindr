import { Image } from 'expo-image';
import { router, useLocalSearchParams } from 'expo-router';
import {
  ArrowLeft,
  CalendarDays,
  Clock3,
  MapPin,
  Navigation2,
  Share2,
  Tag,
} from 'lucide-react-native';
import React from 'react';
import {
  Pressable,
  ScrollView,
  Share,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';

import { StateCard } from '@/components/StateCard';
import { theme } from '@/constants/theme';
import { useEvent } from '@/hooks/useCampusData';

const CATEGORY_COLOR: Record<string, string> = {
  academic: '#0D8C60',
  social:   '#7C5CFA',
  sports:   '#F27C42',
  career:   '#2078B4',
};

const CATEGORY_BG: Record<string, string> = {
  academic: '#E8F5F0',
  social:   '#F0ECFF',
  sports:   '#FFF3EC',
  career:   '#EBF4FF',
};

export default function EventDetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const { data: event, isLoading } = useEvent(id);
  const insets = useSafeAreaInsets();

  const color = event ? (CATEGORY_COLOR[event.category] ?? theme.colors.primary) : theme.colors.primary;
  const bg    = event ? (CATEGORY_BG[event.category]    ?? theme.colors.surfaceAlt) : theme.colors.surfaceAlt;

  const handleShare = async () => {
    if (!event) return;
    try {
      await Share.share({
        title: event.title,
        message: `${event.title}\n${event.dateLabel} at ${event.startTime}\n📍 ${event.locationName}`,
      });
    } catch { /* ignore */ }
  };

  if (isLoading) {
    return (
      <SafeAreaView style={styles.root} edges={['top', 'bottom']}>
        <View style={styles.backRow}>
          <Pressable style={styles.backBtn} onPress={() => router.back()}>
            <ArrowLeft size={20} color={theme.colors.text} />
          </Pressable>
        </View>
        <View style={styles.center}>
          <StateCard title="Loading event…" description="Just a moment." loading />
        </View>
      </SafeAreaView>
    );
  }

  if (!event) {
    return (
      <SafeAreaView style={styles.root} edges={['top', 'bottom']}>
        <View style={styles.backRow}>
          <Pressable style={styles.backBtn} onPress={() => router.back()}>
            <ArrowLeft size={20} color={theme.colors.text} />
          </Pressable>
        </View>
        <View style={styles.center}>
          <StateCard title="Event not found" description="This event may have been removed." />
        </View>
      </SafeAreaView>
    );
  }

  return (
    <View style={styles.root}>
      <ScrollView
        style={styles.scroll}
        contentContainerStyle={{ paddingBottom: insets.bottom + 32 }}
        showsVerticalScrollIndicator={false}
      >
        {/* Hero image */}
        <View style={styles.heroWrap}>
          <Image source={{ uri: event.imageUrl }} style={styles.heroImage} contentFit="cover" />
          {/* Dark gradient overlay */}
          <View style={styles.heroOverlay} />

          {/* Back + share controls on top of image */}
          <SafeAreaView style={styles.heroControls} edges={['top']}>
            <Pressable style={styles.backBtn} onPress={() => router.back()}>
              <ArrowLeft size={20} color="#FFF" />
            </Pressable>
            <Pressable style={styles.shareBtn} onPress={() => void handleShare()}>
              <Share2 size={18} color="#FFF" />
            </Pressable>
          </SafeAreaView>

          {/* Category badge on image */}
          <View style={[styles.heroBadge, { backgroundColor: bg }]}>
            <Tag size={11} color={color} />
            <Text style={[styles.heroBadgeText, { color }]}>
              {event.category.charAt(0).toUpperCase() + event.category.slice(1)}
            </Text>
          </View>
        </View>

        {/* Content card */}
        <View style={styles.card}>
          {/* Title */}
          <Text style={styles.title}>{event.title}</Text>

          {/* Meta chips row */}
          <View style={styles.metaRow}>
            <View style={styles.metaChip}>
              <CalendarDays size={14} color={theme.colors.primary} />
              <Text style={styles.metaText}>{event.dateLabel}</Text>
            </View>
            <View style={styles.metaChip}>
              <Clock3 size={14} color={theme.colors.primary} />
              <Text style={styles.metaText}>{event.startTime}</Text>
            </View>
          </View>

          {/* Location */}
          <View style={styles.locationCard}>
            <View style={styles.locationIcon}>
              <MapPin size={18} color={theme.colors.primary} />
            </View>
            <View style={styles.locationTexts}>
              <Text style={styles.locationLabel}>Location</Text>
              <Text style={styles.locationName}>{event.locationName}</Text>
            </View>
            <Pressable
              style={styles.directionsBtn}
              onPress={() => {
                if (event.buildingId) {
                  router.push(`/(tabs)/directions?buildingId=${event.buildingId}`);
                }
              }}
            >
              <Navigation2 size={14} color="#FFF" />
              <Text style={styles.directionsBtnText}>Go</Text>
            </Pressable>
          </View>

          {/* Divider */}
          <View style={styles.divider} />

          {/* Description */}
          <Text style={styles.sectionLabel}>About this event</Text>
          <Text style={styles.description}>{event.description}</Text>

          {/* Visual separator */}
          <View style={[styles.accentLine, { backgroundColor: color }]} />
        </View>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: theme.colors.background },
  scroll: { flex: 1 },
  center: { flex: 1, padding: 24, justifyContent: 'center' },

  // Hero
  heroWrap: { height: 300, position: 'relative' },
  heroImage: { ...StyleSheet.absoluteFillObject },
  heroOverlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(8,24,16,0.45)',
  },
  heroControls: {
    position: 'absolute',
    top: 0, left: 0, right: 0,
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingTop: 4,
  },
  backRow: {
    paddingHorizontal: 16,
    paddingTop: 8,
    paddingBottom: 4,
  },
  backBtn: {
    width: 40, height: 40, borderRadius: 20,
    backgroundColor: 'rgba(0,0,0,0.35)',
    alignItems: 'center', justifyContent: 'center',
  },
  shareBtn: {
    width: 40, height: 40, borderRadius: 20,
    backgroundColor: 'rgba(0,0,0,0.35)',
    alignItems: 'center', justifyContent: 'center',
  },
  heroBadge: {
    position: 'absolute',
    bottom: 16, left: 16,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: theme.radius.pill,
  },
  heroBadgeText: {
    fontSize: 12,
    fontFamily: 'Poppins_700Bold',
    textTransform: 'uppercase',
    letterSpacing: 0.4,
  },

  // Content card
  card: {
    marginHorizontal: 16,
    marginTop: -20,
    backgroundColor: theme.colors.surface,
    borderRadius: 24,
    padding: 20,
    gap: 14,
    ...theme.shadow,
  },
  title: {
    fontSize: 22,
    fontFamily: 'Poppins_800ExtraBold',
    color: theme.colors.text,
    lineHeight: 30,
  },

  // Meta
  metaRow: { flexDirection: 'row', gap: 10, flexWrap: 'wrap' },
  metaChip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: theme.colors.surfaceAlt,
    paddingHorizontal: 12,
    paddingVertical: 7,
    borderRadius: theme.radius.pill,
    borderWidth: 1,
    borderColor: theme.colors.border,
  },
  metaText: {
    fontSize: 13,
    fontFamily: 'Poppins_700Bold',
    color: theme.colors.text,
  },

  // Location card
  locationCard: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    backgroundColor: theme.colors.surfaceAlt,
    borderRadius: 16,
    padding: 14,
    borderWidth: 1,
    borderColor: theme.colors.border,
  },
  locationIcon: {
    width: 40, height: 40, borderRadius: 12,
    backgroundColor: theme.colors.surface,
    alignItems: 'center', justifyContent: 'center',
    borderWidth: 1, borderColor: theme.colors.border,
  },
  locationTexts: { flex: 1 },
  locationLabel: {
    fontSize: 10, fontFamily: 'Poppins_700Bold',
    color: theme.colors.textMuted,
    textTransform: 'uppercase', letterSpacing: 0.8,
  },
  locationName: {
    fontSize: 14, fontFamily: 'Poppins_700Bold', color: theme.colors.text, marginTop: 1,
  },
  directionsBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    backgroundColor: theme.colors.primary,
    paddingHorizontal: 14,
    paddingVertical: 9,
    borderRadius: theme.radius.pill,
  },
  directionsBtnText: {
    fontSize: 13, fontFamily: 'Poppins_700Bold', color: '#FFF',
  },

  divider: { height: 1, backgroundColor: theme.colors.border },

  sectionLabel: {
    fontSize: 12, fontFamily: 'Poppins_700Bold',
    color: theme.colors.textMuted,
    textTransform: 'uppercase', letterSpacing: 0.8,
  },
  description: {
    fontSize: 15,
    fontFamily: 'DMSans_400Regular',
    color: theme.colors.text,
    lineHeight: 24,
  },

  accentLine: {
    height: 3, borderRadius: 2, width: 48,
  },
});
