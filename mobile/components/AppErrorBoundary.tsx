import React from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';

import { theme } from '@/constants/theme';

interface AppErrorBoundaryProps {
  children: React.ReactNode;
}

interface AppErrorBoundaryState {
  hasError: boolean;
}

export class AppErrorBoundary extends React.Component<
  AppErrorBoundaryProps,
  AppErrorBoundaryState
> {
  state: AppErrorBoundaryState = {
    hasError: false,
  };

  static getDerivedStateFromError(): AppErrorBoundaryState {
    return { hasError: true };
  }

  componentDidCatch(error: Error): void {
    console.log('PathFindr boundary error', error);
  }

  private handleRetry = (): void => {
    this.setState({ hasError: false });
  };

  render() {
    if (this.state.hasError) {
      return (
        <View style={styles.container} testID="error-boundary-screen">
          <View style={styles.card}>
            <Text style={styles.eyebrow}>PathFindr</Text>
            <Text style={styles.title}>Something interrupted your route.</Text>
            <Text style={styles.description}>
              Refresh the screen and PathFindr will get you back on track.
            </Text>
            <Pressable onPress={this.handleRetry} style={styles.button} testID="retry-boundary-button">
              <Text style={styles.buttonText}>Try again</Text>
            </Pressable>
          </View>
        </View>
      );
    }

    return this.props.children;
  }
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: 24,
    backgroundColor: theme.colors.background,
  },
  card: {
    width: '100%',
    maxWidth: 420,
    borderRadius: 28,
    backgroundColor: theme.colors.surface,
    padding: 24,
    gap: 12,
    ...theme.shadow,
  },
  eyebrow: {
    color: theme.colors.primary,
    fontSize: 13,
    fontFamily: 'Poppins_700Bold',
    textTransform: 'uppercase',
    letterSpacing: 1.1,
  },
  title: {
    color: theme.colors.text,
    fontSize: 28,
    fontFamily: 'Poppins_800ExtraBold',
  },
  description: {
    color: theme.colors.textMuted,
    fontSize: 16,
    lineHeight: 23,
    fontFamily: 'DMSans_400Regular',
  },
  button: {
    marginTop: 8,
    borderRadius: theme.radius.pill,
    paddingVertical: 14,
    alignItems: 'center',
    backgroundColor: theme.colors.primary,
  },
  buttonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontFamily: 'Poppins_700Bold',
  },
});
