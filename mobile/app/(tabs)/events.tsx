import { Image } from 'expo-image';
import { router } from 'expo-router';
import { CalendarDays, Clock3, MapPin } from 'lucide-react-native';
import { FlatList, Pressable, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { SectionHeader } from '@/components/SectionHeader';
import { StateCard } from '@/components/StateCard';
import { theme } from '@/constants/theme';
import { useEvents } from '@/hooks/useCampusData';

export default function EventsScreen() {
  const { events, isLoading } = useEvents();

  return (
    <SafeAreaView style={styles.container} testID="events-screen">
      <View style={styles.header}>
        <Text style={styles.eyebrow}>Campus pulse</Text>
        <Text style={styles.title}>Upcoming events</Text>
        <Text style={styles.subtitle}>Stay close to the talks, showcases, and student moments shaping the week.</Text>
      </View>

      <View style={styles.sectionWrap}>
        <SectionHeader title="This week" subtitle="Fresh campus plans curated for students" />
      </View>

      {isLoading ? (
        <View style={styles.stateWrap}>
          <StateCard title="Loading events" description="Pulling in the latest happenings across campus." loading />
        </View>
      ) : events.length === 0 ? (
        <View style={styles.stateWrap}>
          <StateCard title="No events yet" description="When new activities are published, they will show up here." />
        </View>
      ) : (
        <FlatList
          data={events}
          keyExtractor={(item) => item.id}
          contentContainerStyle={styles.listContent}
          renderItem={({ item }) => (
            <Pressable
              style={styles.eventCard}
              onPress={() => router.push(`/building/${item.buildingId}`)}
              testID={`event-card-${item.id}`}
            >
              <Image source={{ uri: item.imageUrl }} style={styles.eventImage} contentFit="cover" />
              <View style={styles.eventContent}>
                <View style={styles.dateBadge}>
                  <CalendarDays color={theme.colors.primary} size={16} />
                  <Text style={styles.dateText}>{item.dateLabel}</Text>
                </View>
                <Text style={styles.eventTitle}>{item.title}</Text>
                <Text style={styles.eventDescription}>{item.description}</Text>
                <View style={styles.infoRow}>
                  <Clock3 color={theme.colors.textMuted} size={15} />
                  <Text style={styles.infoText}>{item.startTime}</Text>
                </View>
                <View style={styles.infoRow}>
                  <MapPin color={theme.colors.textMuted} size={15} />
                  <Text style={styles.infoText}>{item.locationName}</Text>
                </View>
              </View>
            </Pressable>
          )}
        />
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: theme.colors.background,
  },
  header: {
    paddingHorizontal: 20,
    paddingTop: 12,
    gap: 6,
  },
  eyebrow: {
    color: theme.colors.primary,
    fontSize: 13,
    fontFamily: 'Poppins_800ExtraBold',
    letterSpacing: 1.1,
    textTransform: 'uppercase',
  },
  title: {
    color: theme.colors.text,
    fontSize: 30,
    fontFamily: 'Poppins_800ExtraBold',
  },
  subtitle: {
    color: theme.colors.textMuted,
    fontSize: 15,
    lineHeight: 22,
    fontFamily: 'DMSans_400Regular',
  },
  sectionWrap: {
    paddingHorizontal: 20,
    paddingTop: 20,
    paddingBottom: 14,
  },
  stateWrap: {
    paddingHorizontal: 20,
  },
  listContent: {
    paddingHorizontal: 20,
    paddingBottom: 24,
    gap: 16,
  },
  eventCard: {
    borderRadius: 28,
    overflow: 'hidden',
    backgroundColor: theme.colors.surface,
    ...theme.shadow,
  },
  eventImage: {
    width: '100%',
    height: 190,
  },
  eventContent: {
    padding: 18,
    gap: 10,
  },
  dateBadge: {
    alignSelf: 'flex-start',
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    borderRadius: theme.radius.pill,
    backgroundColor: theme.colors.surfaceAlt,
    paddingHorizontal: 12,
    paddingVertical: 8,
  },
  dateText: {
    color: theme.colors.primary,
    fontSize: 13,
    fontFamily: 'Poppins_800ExtraBold',
  },
  eventTitle: {
    color: theme.colors.text,
    fontSize: 22,
    fontFamily: 'Poppins_800ExtraBold',
  },
  eventDescription: {
    color: theme.colors.textMuted,
    fontSize: 15,
    lineHeight: 22,
    fontFamily: 'DMSans_400Regular',
  },
  infoRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  infoText: {
    color: theme.colors.text,
    fontSize: 14,
    fontFamily: 'DMSans_600SemiBold',
  },
});
