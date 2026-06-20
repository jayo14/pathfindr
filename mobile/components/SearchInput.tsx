import { Search } from 'lucide-react-native';
import { StyleSheet, TextInput, View } from 'react-native';

import { theme } from '@/constants/theme';

interface SearchInputProps {
  value: string;
  onChangeText: (value: string) => void;
  placeholder?: string;
  testID?: string;
}

export function SearchInput({ value, onChangeText, placeholder = 'Search PathFindr', testID }: SearchInputProps) {
  return (
    <View style={styles.container}>
      <Search color={theme.colors.textMuted} size={18} />
      <TextInput
        value={value}
        onChangeText={onChangeText}
        placeholder={placeholder}
        placeholderTextColor={theme.colors.textMuted}
        style={styles.input}
        testID={testID}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    borderRadius: theme.radius.pill,
    backgroundColor: theme.colors.surface,
    borderWidth: 1,
    borderColor: theme.colors.border,
    paddingHorizontal: 16,
    paddingVertical: 14,
  },
  input: {
    flex: 1,
    color: theme.colors.text,
    fontSize: 16,
    fontFamily: 'DMSans_400Regular',
  },
});
