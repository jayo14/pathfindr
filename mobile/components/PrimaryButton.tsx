import { useRef } from 'react';
import {
    ActivityIndicator,
    Animated,
    GestureResponderEvent,
    Pressable,
    StyleSheet,
    Text,
    ViewStyle,
} from 'react-native';

import { theme } from '@/constants/theme';

interface PrimaryButtonProps {
  label: string;
  onPress: (event: GestureResponderEvent) => void;
  variant?: 'primary' | 'secondary';
  isLoading?: boolean;
  style?: ViewStyle;
  testID?: string;
  /** Override the default accessibilityLabel (defaults to `label`). */
  accessibilityLabel?: string;
  /** Hint read after the label, e.g. "Starts turn-by-turn directions". */
  accessibilityHint?: string;
  /** Defaults to 'button'. */
  accessibilityRole?: 'button' | 'link' | 'none';
  /** Mark disabled state for assistive tech even when not loading. */
  disabled?: boolean;
}

export function PrimaryButton({
  label,
  onPress,
  variant = 'primary',
  isLoading = false,
  style,
  testID,
  accessibilityLabel,
  accessibilityHint,
  accessibilityRole = 'button',
  disabled = false,
}: PrimaryButtonProps) {
  const scale = useRef(new Animated.Value(1)).current;

  const animateTo = (value: number): void => {
    Animated.spring(scale, {
      toValue: value,
      useNativeDriver: true,
      speed: 22,
      bounciness: 6,
    }).start();
  };

  const isSecondary = variant === 'secondary';
  const isDisabled  = isLoading || disabled;

  return (
    <Animated.View style={[{ transform: [{ scale }] }, style]}>
      <Pressable
        disabled={isDisabled}
        onPress={onPress}
        onPressIn={() => animateTo(0.97)}
        onPressOut={() => animateTo(1)}
        style={[styles.button, isSecondary ? styles.secondaryButton : styles.primaryButton]}
        testID={testID}
        accessible={true}
        accessibilityRole={accessibilityRole}
        accessibilityLabel={accessibilityLabel ?? label}
        accessibilityHint={accessibilityHint}
        accessibilityState={{ disabled: isDisabled, busy: isLoading }}
      >
        {isLoading ? (
          <ActivityIndicator color={isSecondary ? theme.colors.primary : '#FFFFFF'} />
        ) : (
          <Text style={[styles.label, isSecondary ? styles.secondaryLabel : styles.primaryLabel]}>
            {label}
          </Text>
        )}
      </Pressable>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  button: {
    minHeight: 54,
    borderRadius: theme.radius.pill,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 22,
  },
  primaryButton: {
    backgroundColor: theme.colors.primary,
  },
  secondaryButton: {
    backgroundColor: theme.colors.surface,
    borderWidth: 1,
    borderColor: theme.colors.border,
  },
  label: {
    fontSize: 16,
    fontFamily: 'Poppins_700Bold',
  },
  primaryLabel: {
    color: '#FFFFFF',
  },
  secondaryLabel: {
    color: theme.colors.primary,
  },
});
