import { Tabs } from 'expo-router';
import { Calendar, Home, Map, MessageCircle, Navigation } from 'lucide-react-native';
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
      {/* 1 — Home */}
      <Tabs.Screen
        name="index"
        options={{
          title: 'Home',
          tabBarIcon: ({ color, size }) => <Home size={size} color={color} />,
        }}
      />

      {/* 2 — Map */}
      <Tabs.Screen
        name="map"
        options={{
          title: 'Map',
          tabBarIcon: ({ color, size }) => <Map size={size} color={color} />,
        }}
      />

      {/* 3 — Chat */}
      <Tabs.Screen
        name="ai-assistant"
        options={{
          title: 'Chat',
          tabBarIcon: ({ color, size }) => <MessageCircle size={size} color={color} />,
        }}
      />

      {/* 4 — Directions */}
      <Tabs.Screen
        name="directions"
        options={{
          title: 'Directions',
          tabBarIcon: ({ color, size }) => <Navigation size={size} color={color} />,
        }}
      />

      {/* 5 — Events */}
      <Tabs.Screen
        name="events"
        options={{
          title: 'Events',
          tabBarIcon: ({ color, size }) => <Calendar size={size} color={color} />,
        }}
      />

      {/* Hidden — still navigable by URL, not shown in the bar */}
      <Tabs.Screen name="lost-found" options={{ href: null }} />
      <Tabs.Screen name="settings"   options={{ href: null }} />
    </Tabs>
  );
}
