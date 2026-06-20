import React from 'react';
import {
  ScrollView,
  StyleSheet,
  Text,
  Pressable,
  View,
} from 'react-native';

import { theme, categoryColors } from '@/constants/theme';
import { BuildingCategory } from '@/types/domain';

interface MapCategoryFilterProps {
  activeCategory: BuildingCategory | 'all';
  onSelect: (category: BuildingCategory | 'all') => void;
}

const CATEGORIES: { label: string; value: BuildingCategory | 'all'; emoji: string }[] = [
  { label: 'All', value: 'all', emoji: '📍' },
  { label: 'Faculty', value: 'faculty', emoji: '🎓' },
  { label: 'Department', value: 'department', emoji: '🏛️' },
  { label: 'Library', value: 'library', emoji: '📚' },
  { label: 'Lab', value: 'lab', emoji: '🔬' },
  { label: 'Admin', value: 'admin', emoji: '🏢' },
  { label: 'Facility', value: 'facility', emoji: '⚡' },
  { label: 'Hostel', value: 'hostel', emoji: '🏠' },
];

export function MapCategoryFilter({ activeCategory, onSelect }: MapCategoryFilterProps) {
  return (
    <View style={styles.container}>
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={styles.scrollContent}
      >
        {CATEGORIES.map((cat) => {
          const isActive = activeCategory === cat.value;
          const catColor = cat.value === 'all'
            ? theme.colors.primary
            : categoryColors[cat.value as BuildingCategory] || theme.colors.primary;

          return (
            <Pressable
              key={cat.value}
              onPress={() => onSelect(cat.value)}
              style={[
                styles.chip,
                isActive
                  ? { backgroundColor: catColor }
                  : styles.inactiveChip
              ]}
            >
              <Text style={styles.emoji}>{cat.emoji}</Text>
              <Text
                style={[
                  styles.label,
                  isActive ? styles.activeLabel : styles.inactiveLabel
                ]}
              >
                {cat.label}
              </Text>
            </Pressable>
          );
        })}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    height: 48,
    marginVertical: 8,
  },
  scrollContent: {
    paddingHorizontal: 16,
    gap: 8,
    alignItems: 'center',
  },
  chip: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 999,
    gap: 6,
    ...theme.shadow,
    elevation: 4,
  },
  inactiveChip: {
    backgroundColor: theme.colors.surface,
    borderWidth: 1,
    borderColor: theme.colors.border,
  },
  emoji: {
    fontSize: 14,
  },
  label: {
    fontSize: 13,
    fontFamily: 'Poppins_700Bold',
  },
  activeLabel: {
    color: '#FFFFFF',
  },
  inactiveLabel: {
    color: theme.colors.textMuted,
  },
});
