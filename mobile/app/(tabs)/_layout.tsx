import { Tabs } from 'expo-router';
import { Home, Map, MessageCircle, Navigation } from 'lucide-react-native';
import { Pressable, StyleSheet, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { theme } from '@/constants/theme';

export default function TabLayout() {
  const insets = useSafeAreaInsets();

  const TAB_BAR_BASE = 56;
  const tabBarHeight = TAB_BAR_BASE + insets.bottom;

  return (
    <Tabs
      screenOptions={{
        headerShown: false,
        tabBarActiveTintColor: theme.colors.primary,
        tabBarInactiveTintColor: theme.colors.textMuted,
        tabBarStyle: {
          backgroundColor: theme.colors.surface,
          borderTopColor: theme.colors.border,
          borderTopWidth: 1,
          height: tabBarHeight,
          paddingBottom: insets.bottom + 4,
          paddingTop: 8,
        },
        tabBarLabelStyle: {
          fontSize: 11,
          fontFamily: 'Poppins_700Bold',
        },
      }}
    >
      {/* Tab 1 — Home */}
      <Tabs.Screen
        name="index"
        options={{
          title: 'Home',
          tabBarIcon: ({ color, size }) => <Home size={size} color={color} />,
        }}
      />

      {/* Tab 2 — Map (centre FAB) */}
      <Tabs.Screen
        name="map"
        options={{
          title: 'Map',
          tabBarButton: ({ style, onPress }) => (
            <Pressable
              onPress={onPress as any}
              style={[style as any, styles.fabContainer]}
            >
              <View style={styles.fab}>
                <Map size={28} color="#FFF" />
              </View>
            </Pressable>
          ),
        }}
      />

      {/* Tab 3 — Chat */}
      <Tabs.Screen
        name="ai-assistant"
        options={{
          title: 'Chat',
          tabBarIcon: ({ color, size }) => <MessageCircle size={size} color={color} />,
        }}
      />

      {/* Tab 4 — Directions */}
      <Tabs.Screen
        name="directions"
        options={{
          title: 'Directions',
          tabBarIcon: ({ color, size }) => <Navigation size={size} color={color} />,
        }}
      />

      {/* Hidden tabs — still navigable by URL, just not shown in the bar */}
      <Tabs.Screen name="events"     options={{ href: null }} />
      <Tabs.Screen name="lost-found" options={{ href: null }} />
      <Tabs.Screen name="settings"   options={{ href: null }} />
    </Tabs>
  );
}

const styles = StyleSheet.create({
  fabContainer: {
    top: -28,
    justifyContent: 'center',
    alignItems: 'center',
  },
  fab: {
    width: 64,
    height: 64,
    borderRadius: 32,
    backgroundColor: theme.colors.primary,
    justifyContent: 'center',
    alignItems: 'center',
    ...theme.shadow,
    elevation: 8,
    borderWidth: 4,
    borderColor: '#FFF',
  },
});
