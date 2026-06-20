import { Pressable, StyleSheet, Text } from 'react-native';

import { categoryColors, theme } from '@/constants/theme';
import { BuildingCategory } from '@/types/domain';

interface CategoryChipProps {
  label: string;
  category: BuildingCategory | 'all';
  isActive: boolean;
  onPress: () => void;
  testID?: string;
}

export function CategoryChip({ label, category, isActive, onPress, testID }: CategoryChipProps) {
  const activeColor = category === 'all' ? theme.colors.primary : categoryColors[category];

  return (
    <Pressable
      onPress={onPress}
      style={[styles.chip, isActive ? { backgroundColor: activeColor } : styles.inactiveChip]}
      testID={testID}
    >
      <Text style={[styles.label, isActive ? styles.activeLabel : styles.inactiveLabel]}>{label}</Text>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  chip: {
    paddingHorizontal: 14,
    paddingVertical: 10,
    borderRadius: theme.radius.pill,
    marginRight: 10,
  },
  inactiveChip: {
    backgroundColor: theme.colors.surface,
    borderWidth: 1,
    borderColor: theme.colors.border,
  },
  label: {
    fontSize: 14,
    fontFamily: 'Poppins_700Bold',
  },
  activeLabel: {
    color: '#FFFFFF',
  },
  inactiveLabel: {
    color: theme.colors.textMuted,
  },
});
