import { Search } from 'lucide-react-native';
import { StyleSheet, TextInput, View } from 'react-native';

import { theme } from '@/constants/theme';

interface SearchInputProps {
  value: string;
  onChangeText: (value: string) => void;
  placeholder?: string;
  testID?: string;
  /** Accessible label for the text field. Defaults to placeholder text. */
  accessibilityLabel?: string;
  /** Hint spoken after the label. */
  accessibilityHint?: string;
  /** Called when the field gains focus. */
  onFocus?: () => void;
  /** Called when the field loses focus. */
  onBlur?: () => void;
  /** Return key label. */
  returnKeyType?: 'search' | 'done' | 'go' | 'next';
  /** Auto-capitalisation behaviour. */
  autoCapitalize?: 'none' | 'sentences' | 'words' | 'characters';
}

export function SearchInput({
  value,
  onChangeText,
  placeholder = 'Search PathFindr',
  testID,
  accessibilityLabel,
  accessibilityHint,
  onFocus,
  onBlur,
  returnKeyType = 'search',
  autoCapitalize = 'none',
}: SearchInputProps) {
  return (
    <View
      style={styles.container}
      accessible={false}
    >
      {/* Icon is decorative — hidden from assistive tech */}
      <Search
        color={theme.colors.textMuted}
        size={18}
        accessibilityElementsHidden
        importantForAccessibility="no"
      />
      <TextInput
        value={value}
        onChangeText={onChangeText}
        placeholder={placeholder}
        placeholderTextColor={theme.colors.textMuted}
        style={styles.input}
        testID={testID}
        accessible={true}
        accessibilityRole="search"
        accessibilityLabel={accessibilityLabel ?? placeholder}
        accessibilityHint={accessibilityHint}
        accessibilityValue={{ text: value || undefined }}
        onFocus={onFocus}
        onBlur={onBlur}
        returnKeyType={returnKeyType}
        autoCapitalize={autoCapitalize}
        autoCorrect={false}
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
