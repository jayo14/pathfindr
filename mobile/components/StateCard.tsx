import { ActivityIndicator, StyleSheet, Text, View } from 'react-native';

import { theme } from '@/constants/theme';

interface StateCardProps {
  title: string;
  description: string;
  loading?: boolean;
}

export function StateCard({ title, description, loading = false }: StateCardProps) {
  return (
    <View style={styles.card} testID="state-card">
      {loading ? <ActivityIndicator color={theme.colors.primary} /> : null}
      <Text style={styles.title}>{title}</Text>
      <Text style={styles.description}>{description}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    borderRadius: theme.radius.lg,
    backgroundColor: theme.colors.surface,
    borderWidth: 1,
    borderColor: theme.colors.border,
    padding: 20,
    gap: 10,
    ...theme.shadow,
  },
  title: {
    color: theme.colors.text,
    fontSize: 18,
    fontFamily: 'Poppins_800ExtraBold',
  },
  description: {
    color: theme.colors.textMuted,
    fontSize: 15,
    lineHeight: 22,
    fontFamily: 'DMSans_400Regular',
  },
});
