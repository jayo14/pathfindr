import React, { useState, useRef, useEffect } from 'react';
import {
  StyleSheet,
  View,
  Text,
  TextInput,
  TouchableOpacity,
  FlatList,
  KeyboardAvoidingView,
  Platform,
  ActivityIndicator,
  Animated,
  ScrollView,
} from 'react-native';
import { useRouter } from 'expo-router';
import { MessageCircle, Send, MapPin, User as UserIcon, Sparkles } from 'lucide-react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { theme } from '@/constants/theme';
import { ChatMessage, sendChatMessage } from '@/services/ai-service';
import { NativeMapView } from '@/components/NativeMapView';
import { StateCard } from '@/components/StateCard';

// ── Quick-reply suggestion chips ──────────────────────────────────────────
const QUICK_REPLIES = [
  'Nearest Library',
  'Restroom',
  'ICT Center',
  'Cafeteria Menu',
] as const;

const INITIAL_MESSAGE: ChatMessage = {
  id: 'welcome',
  role: 'assistant',
  content:
    "Hello! I'm your LASUSTECH Campus Guide. How can I help you find your way around today?",
};

// ── Typing indicator ──────────────────────────────────────────────────────
const TypingIndicator = () => {
  const dot1 = useRef(new Animated.Value(0)).current;
  const dot2 = useRef(new Animated.Value(0)).current;
  const dot3 = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    const animate = (dot: Animated.Value, delay: number) =>
      Animated.loop(
        Animated.sequence([
          Animated.delay(delay),
          Animated.timing(dot, { toValue: 1, duration: 400, useNativeDriver: true }),
          Animated.timing(dot, { toValue: 0, duration: 400, useNativeDriver: true }),
        ]),
      ).start();

    animate(dot1, 0);
    animate(dot2, 200);
    animate(dot3, 400);
  }, []);

  const dotStyle = (dot: Animated.Value) => ({
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: theme.colors.textMuted,
    marginHorizontal: 2,
    transform: [{ translateY: dot.interpolate({ inputRange: [0, 1], outputRange: [0, -4] }) }],
  });

  return (
    <View style={styles.assistantBubble}>
      <View style={styles.typingContainer}>
        <Animated.View style={dotStyle(dot1)} />
        <Animated.View style={dotStyle(dot2)} />
        <Animated.View style={dotStyle(dot3)} />
      </View>
    </View>
  );
};

// ── Main screen ───────────────────────────────────────────────────────────
export default function ChatScreen() {
  const [messages, setMessages] = useState<ChatMessage[]>([INITIAL_MESSAGE]);
  const [inputText, setInputText] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const flatListRef = useRef<FlatList>(null);
  const router = useRouter();

  useEffect(() => {
    if (messages.length > 0) {
      setTimeout(() => flatListRef.current?.scrollToEnd({ animated: true }), 100);
    }
  }, [messages, isLoading]);

  const handleSend = async (text?: string) => {
    const msg = (text ?? inputText).trim();
    if (!msg || isLoading) return;

    const userMsg: ChatMessage = {
      id: Date.now().toString(),
      role: 'user',
      content: msg,
    };

    setMessages(prev => [...prev, userMsg]);
    setInputText('');
    setIsLoading(true);
    setError(null);

    try {
      const response = await sendChatMessage(messages, msg);
      const assistantMsg: ChatMessage = {
        ...response,
        id: (Date.now() + 1).toString(),
      };
      setMessages(prev => [...prev, assistantMsg]);
    } catch {
      setError('Failed to get a response from the assistant. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  const renderMessage = ({ item }: { item: ChatMessage }) => {
    const isUser = item.role === 'user';

    return (
      <View style={[styles.msgRow, isUser ? styles.msgRowUser : styles.msgRowAssistant]}>
        {!isUser && (
          <View style={styles.avatar}>
            <Sparkles size={14} color={theme.colors.primary} />
          </View>
        )}
        <View style={styles.msgContent}>
          <View style={[styles.bubble, isUser ? styles.userBubble : styles.assistantBubble]}>
            <Text style={[styles.msgText, isUser ? styles.userText : styles.assistantText]}>
              {item.content}
            </Text>
          </View>

          {item.routeData && item.routeData.points.length > 0 && (
            <View style={styles.mapContainer}>
              <NativeMapView
                region={{
                  latitude: item.routeData.points[0].latitude,
                  longitude: item.routeData.points[0].longitude,
                  latitudeDelta: 0.005,
                  longitudeDelta: 0.005,
                }}
                route={item.routeData.points}
                style={styles.miniMap}
                animateRoute={false}
              />
              <View style={styles.mapOverlay}>
                <Text style={styles.mapStats}>
                  {item.routeData.distanceMeters}m · {item.routeData.durationMinutes} min walk
                </Text>
              </View>
            </View>
          )}

          {item.buildingId && (
            <TouchableOpacity
              style={styles.buildingChip}
              onPress={() => router.push(`/building/${item.buildingId}` as any)}
            >
              <MapPin size={13} color={theme.colors.primary} />
              <Text style={styles.buildingChipText}>View Building Details</Text>
            </TouchableOpacity>
          )}
        </View>

        {isUser && (
          <View style={[styles.avatar, styles.userAvatar]}>
            <UserIcon size={14} color="#FFF" />
          </View>
        )}
      </View>
    );
  };

  return (
    <SafeAreaView style={styles.root} edges={['top']}>
      {/* Header */}
      <View style={styles.header}>
        <View style={styles.headerIcon}>
          <MessageCircle size={20} color={theme.colors.primary} />
        </View>
        <View>
          <Text style={styles.headerTitle}>LASUSTECH Guide</Text>
          <Text style={styles.headerSub}>Ask about buildings, wifi, restrooms…</Text>
        </View>
      </View>

      {/* Error */}
      {error && (
        <View style={styles.errorWrap}>
          <StateCard title="Assistant error" description={error} />
        </View>
      )}

      {/* Messages */}
      <FlatList
        ref={flatListRef}
        data={messages}
        keyExtractor={item => item.id}
        renderItem={renderMessage}
        contentContainerStyle={styles.listContent}
        ListFooterComponent={isLoading ? <TypingIndicator /> : null}
      />

      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        keyboardVerticalOffset={Platform.OS === 'ios' ? 90 : 0}
      >
        {/* Quick reply chips */}
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.chipsRow}
        >
          {QUICK_REPLIES.map(chip => (
            <TouchableOpacity
              key={chip}
              style={styles.chip}
              onPress={() => void handleSend(chip)}
              disabled={isLoading}
            >
              <Text style={styles.chipText}>{chip}</Text>
            </TouchableOpacity>
          ))}
        </ScrollView>

        {/* Input bar */}
        <View style={styles.inputBar}>
          <TextInput
            style={styles.input}
            placeholder="Ask about buildings, wifi, restrooms…"
            placeholderTextColor={theme.colors.textMuted}
            value={inputText}
            onChangeText={setInputText}
            multiline
            maxLength={500}
            onSubmitEditing={() => void handleSend()}
            returnKeyType="send"
          />
          <TouchableOpacity
            style={[styles.sendBtn, (!inputText.trim() || isLoading) && styles.sendBtnDisabled]}
            onPress={() => void handleSend()}
            disabled={!inputText.trim() || isLoading}
          >
            {isLoading ? (
              <ActivityIndicator size="small" color="#FFF" />
            ) : (
              <Send size={18} color="#FFF" />
            )}
          </TouchableOpacity>
        </View>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: theme.colors.background },

  // Header
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    paddingHorizontal: 18,
    paddingVertical: 14,
    backgroundColor: theme.colors.surface,
    borderBottomWidth: 1,
    borderBottomColor: theme.colors.border,
    ...theme.shadow,
  },
  headerIcon: {
    width: 40, height: 40, borderRadius: 14,
    backgroundColor: theme.colors.surfaceAlt,
    alignItems: 'center', justifyContent: 'center',
  },
  headerTitle: { fontSize: 16, fontFamily: 'Poppins_700Bold', color: theme.colors.text },
  headerSub: { fontSize: 12, fontFamily: 'DMSans_400Regular', color: theme.colors.textMuted },

  errorWrap: { padding: 16 },

  // Message list
  listContent: { padding: 16, paddingBottom: 8 },
  msgRow: {
    flexDirection: 'row',
    marginBottom: 14,
    maxWidth: '85%',
  },
  msgRowUser: { alignSelf: 'flex-end' },
  msgRowAssistant: { alignSelf: 'flex-start' },
  avatar: {
    width: 30, height: 30, borderRadius: 15,
    backgroundColor: theme.colors.surfaceAlt,
    alignItems: 'center', justifyContent: 'center',
    marginRight: 8,
    borderWidth: 1, borderColor: theme.colors.border,
  },
  userAvatar: {
    marginRight: 0, marginLeft: 8,
    backgroundColor: theme.colors.primary,
    borderColor: theme.colors.primaryDark,
  },
  msgContent: { flex: 1 },
  bubble: { padding: 14, borderRadius: 18, ...theme.shadow },
  userBubble: { backgroundColor: theme.colors.primary, borderBottomRightRadius: 4 },
  assistantBubble: { backgroundColor: theme.colors.surface, borderBottomLeftRadius: 4 },
  msgText: { fontSize: 15, fontFamily: 'DMSans_400Regular', lineHeight: 22 },
  userText: { color: '#FFF' },
  assistantText: { color: theme.colors.text },

  // Mini map
  mapContainer: {
    marginTop: 8,
    borderRadius: 16,
    overflow: 'hidden',
    height: 180,
    borderWidth: 1,
    borderColor: theme.colors.border,
  },
  miniMap: { flex: 1 },
  mapOverlay: {
    position: 'absolute',
    bottom: 8, left: 8, right: 8,
    backgroundColor: 'rgba(255,255,255,0.9)',
    paddingVertical: 4, paddingHorizontal: 8,
    borderRadius: theme.radius.sm,
    borderWidth: 1, borderColor: theme.colors.border,
  },
  mapStats: { fontSize: 12, fontFamily: 'Poppins_700Bold', color: theme.colors.primary, textAlign: 'center' },

  // Building chip
  buildingChip: {
    marginTop: 8,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: theme.colors.surfaceAlt,
    paddingVertical: 7,
    paddingHorizontal: 12,
    borderRadius: theme.radius.pill,
    alignSelf: 'flex-start',
    borderWidth: 1,
    borderColor: theme.colors.border,
  },
  buildingChipText: { fontSize: 12, fontFamily: 'Poppins_700Bold', color: theme.colors.primary },

  // Quick reply chips
  chipsRow: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    gap: 8,
  },
  chip: {
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: theme.radius.pill,
    backgroundColor: theme.colors.surface,
    borderWidth: 1,
    borderColor: theme.colors.border,
  },
  chipText: { fontSize: 13, fontFamily: 'Poppins_700Bold', color: theme.colors.primary },

  // Input bar
  inputBar: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    paddingHorizontal: 16,
    paddingVertical: 10,
    backgroundColor: theme.colors.surface,
    borderTopWidth: 1,
    borderTopColor: theme.colors.border,
  },
  input: {
    flex: 1,
    backgroundColor: theme.colors.background,
    borderRadius: theme.radius.pill,
    paddingHorizontal: 16,
    paddingVertical: 10,
    maxHeight: 100,
    color: theme.colors.text,
    fontFamily: 'DMSans_400Regular',
    fontSize: 15,
    borderWidth: 1,
    borderColor: theme.colors.border,
  },
  sendBtn: {
    width: 44, height: 44, borderRadius: 22,
    backgroundColor: theme.colors.primary,
    alignItems: 'center', justifyContent: 'center',
  },
  sendBtnDisabled: { backgroundColor: theme.colors.textMuted },

  // Typing indicator
  typingContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    height: 20,
    width: 40,
  },
});
