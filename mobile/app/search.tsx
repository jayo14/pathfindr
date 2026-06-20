import { Image } from 'expo-image';
import { Stack, router } from 'expo-router';
import { useState } from 'react';
import {
    FlatList,
    Pressable,
    ScrollView,
    StyleSheet,
    Text,
    View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { CategoryChip } from '@/components/CategoryChip';
import { SearchInput } from '@/components/SearchInput';
import { StateCard } from '@/components/StateCard';
import { theme } from '@/constants/theme';
import { useFilteredBuildings } from '@/hooks/useCampusData';
import { BuildingCategory } from '@/types/domain';

const categories: { label: string; value: BuildingCategory | 'all' }[] = [
  { label: 'All', value: 'all' },
  { label: 'Faculty', value: 'faculty' },
  { label: 'Department', value: 'department' },
  { label: 'Library', value: 'library' },
  { label: 'Lab', value: 'lab' },
  { label: 'Admin', value: 'admin' },
  { label: 'Facility', value: 'facility' },
  { label: 'Hostel', value: 'hostel' },
];

export default function SearchScreen() {
  const [query, setQuery] = useState<string>('');
  const [category, setCategory] = useState<BuildingCategory | 'all'>('all');
  const { buildings, isLoading } = useFilteredBuildings(query, category);

  return (
    <SafeAreaView style={styles.container} testID="search-screen">
      <Stack.Screen options={{ headerShown: false }} />
      <View style={styles.header}>
        <Text style={styles.title}>Search campus</Text>
        <Text style={styles.subtitle}>Buildings, departments, and facilities</Text>
      </View>

      <View style={styles.searchWrap}>
        <SearchInput value={query} onChangeText={setQuery} placeholder="Find a lecture hall or office" testID="search-input" />
      </View>

      <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.chipRow}>
        {categories.map((item) => (
          <CategoryChip
            key={item.value}
            label={item.label}
            category={item.value}
            isActive={category === item.value}
            onPress={() => setCategory(item.value)}
            testID={`category-chip-${item.value}`}
          />
        ))}
      </ScrollView>

      {isLoading ? (
        <View style={styles.stateWrap}>
          <StateCard title="Preparing search" description="Indexing routes and campus spots for you." loading />
        </View>
      ) : buildings.length === 0 ? (
        <View style={styles.stateWrap}>
          <StateCard title="No places matched" description="Try another keyword or clear a category filter." />
        </View>
      ) : (
        <FlatList
          data={buildings}
          keyExtractor={(item) => item.id}
          contentContainerStyle={styles.listContent}
          renderItem={({ item }) => (
            <Pressable
              style={styles.resultCard}
              onPress={() => router.push(`/building/${item.id}`)}
              testID={`search-result-${item.id}`}
            >
              <Image source={{ uri: item.imageUrl }} style={styles.image} contentFit="cover" />
              <View style={styles.resultContent}>
                <Text style={styles.resultCode}>{item.code}</Text>
                <Text style={styles.resultTitle}>{item.name}</Text>
                <Text style={styles.resultDescription} numberOfLines={2}>
                  {item.description}
                </Text>
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
    gap: 4,
  },
  title: {
    color: theme.colors.text,
    fontSize: 30,
    fontFamily: 'Poppins_800ExtraBold',
  },
  subtitle: {
    color: theme.colors.textMuted,
    fontSize: 15,
    fontFamily: 'DMSans_400Regular',
  },
  searchWrap: {
    paddingHorizontal: 20,
    paddingTop: 18,
  },
  chipRow: {
    paddingHorizontal: 20,
    paddingVertical: 18,
  },
  stateWrap: {
    paddingHorizontal: 20,
  },
  listContent: {
    paddingHorizontal: 20,
    paddingBottom: 24,
    gap: 14,
  },
  resultCard: {
    flexDirection: 'row',
    gap: 14,
    borderRadius: 24,
    backgroundColor: theme.colors.surface,
    padding: 12,
    ...theme.shadow,
  },
  image: {
    width: 92,
    height: 92,
    borderRadius: 18,
  },
  resultContent: {
    flex: 1,
    justifyContent: 'center',
    gap: 6,
  },
  resultCode: {
    color: theme.colors.primary,
    fontSize: 12,
    fontFamily: 'Poppins_800ExtraBold',
    textTransform: 'uppercase',
    letterSpacing: 1.1,
  },
  resultTitle: {
    color: theme.colors.text,
    fontSize: 18,
    fontFamily: 'Poppins_800ExtraBold',
  },
  resultDescription: {
    color: theme.colors.textMuted,
    fontSize: 14,
    lineHeight: 20,
    fontFamily: 'DMSans_400Regular',
  },
});
