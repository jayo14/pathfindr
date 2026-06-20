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
} from 'react-native';
import { useRouter } from 'expo-router';
import { Sparkles, Send, MapPin, Bot, User as UserIcon } from 'lucide-react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { theme } from '@/constants/theme';
import { ChatMessage, sendChatMessage } from '@/services/ai-service';
import { NativeMapView } from '@/components/NativeMapView';
import { StateCard } from '@/components/StateCard';

const INITIAL_MESSAGE: ChatMessage = {
  id: 'welcome',
  role: 'assistant',
  content: "Hi! I'm your PathFindr assistant. Ask me to navigate anywhere on campus — try 'How do I get to the library?' or 'Where is the admin office?'",
};

const TypingIndicator = () => {
  const dot1 = useRef(new Animated.Value(0)).current;
  const dot2 = useRef(new Animated.Value(0)).current;
  const dot3 = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    const animate = (dot: Animated.Value, delay: number) => {
      return Animated.loop(
        Animated.sequence([
          Animated.delay(delay),
          Animated.timing(dot, { toValue: 1, duration: 400, useNativeDriver: true }),
          Animated.timing(dot, { toValue: 0, duration: 400, useNativeDriver: true }),
        ])
      ).start();
    };

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
    transform: [{
      translateY: dot.interpolate({
        inputRange: [0, 1],
        outputRange: [0, -4]
      })
    }]
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

export default function AIAssistantScreen() {
  const [messages, setMessages] = useState<ChatMessage[]>([INITIAL_MESSAGE]);
  const [inputText, setInputText] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const flatListRef = useRef<FlatList>(null);
  const router = useRouter();

  useEffect(() => {
    scrollToBottom();
  }, [messages, isLoading]);

  const scrollToBottom = () => {
    if (messages.length > 0) {
      setTimeout(() => {
        flatListRef.current?.scrollToEnd({ animated: true });
      }, 100);
    }
  };

  const handleSend = async () => {
    if (!inputText.trim() || isLoading) return;

    const userMsg: ChatMessage = {
      id: Date.now().toString(),
      role: 'user',
      content: inputText.trim(),
    };

    setMessages(prev => [...prev, userMsg]);
    const currentInput = inputText;
    setInputText('');
    setIsLoading(true);
    setError(null);

    try {
      const response = await sendChatMessage(messages, currentInput);
      const assistantMsg: ChatMessage = {
        ...response,
        id: (Date.now() + 1).toString(),
      };
      setMessages(prev => [...prev, assistantMsg]);
    } catch (err) {
      setError('Failed to get response from assistant. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  const renderMessage = ({ item }: { item: ChatMessage }) => {
    const isUser = item.role === 'user';

    return (
      <View style={[styles.messageContainer, isUser ? styles.userContainer : styles.assistantContainer]}>
        {!isUser && (
          <View style={styles.avatar}>
            <Sparkles size={16} color={theme.colors.primary} />
          </View>
        )}
        <View style={styles.messageContent}>
          <View style={[styles.bubble, isUser ? styles.userBubble : styles.assistantBubble]}>
            <Text style={[styles.messageText, isUser ? styles.userText : styles.assistantText]}>
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
              />
              <View style={styles.mapOverlay}>
                <Text style={styles.mapStats}>
                  {item.routeData.distanceMeters}m • {item.routeData.durationMinutes} min walk
                </Text>
              </View>
            </View>
          )}

          {item.buildingId && (
            <TouchableOpacity
              style={styles.buildingChip}
              onPress={() => router.push(`/building/${item.buildingId}` as any)}
            >
              <MapPin size={14} color={theme.colors.primary} />
              <Text style={styles.buildingChipText}>View Building Details</Text>
            </TouchableOpacity>
          )}
        </View>
        {isUser && (
          <View style={[styles.avatar, styles.userAvatar]}>
            <UserIcon size={16} color="white" />
          </View>
        )}
      </View>
    );
  };

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <View style={styles.header}>
        <View style={styles.headerTitleContainer}>
          <Sparkles size={20} color={theme.colors.primary} style={styles.headerIcon} />
          <View>
            <Text style={styles.headerTitle}>PathFindr AI</Text>
            <Text style={styles.headerSubtitle}>Ask me anything about campus</Text>
          </View>
        </View>
      </View>

      {error && (
        <View style={styles.errorPadding}>
          <StateCard
            title="Assistant Error"
            description={error}
          />
        </View>
      )}

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
        <View style={styles.inputBar}>
          <TextInput
            style={styles.input}
            placeholder="How do I get to the library?"
            placeholderTextColor={theme.colors.textMuted}
            value={inputText}
            onChangeText={setInputText}
            multiline
            maxLength={500}
          />
          <TouchableOpacity
            style={[styles.sendButton, !inputText.trim() && styles.sendButtonDisabled]}
            onPress={handleSend}
            disabled={!inputText.trim() || isLoading}
          >
            <Send size={20} color="white" />
          </TouchableOpacity>
        </View>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: theme.colors.background,
  },
  header: {
    padding: theme.spacing.md,
    backgroundColor: theme.colors.surface,
    borderBottomWidth: 1,
    borderBottomColor: theme.colors.border,
    ...theme.shadow,
  },
  headerTitleContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  headerIcon: {
    marginRight: theme.spacing.sm,
  },
  headerTitle: {
    fontSize: 18,
    fontFamily: 'Poppins_700Bold',
    color: theme.colors.text,
  },
  headerSubtitle: {
    fontSize: 12,
    fontFamily: 'DMSans_400Regular',
    color: theme.colors.textMuted,
  },
  listContent: {
    padding: theme.spacing.md,
    paddingBottom: theme.spacing.xl,
  },
  messageContainer: {
    flexDirection: 'row',
    marginBottom: theme.spacing.md,
    maxWidth: '85%',
  },
  userContainer: {
    alignSelf: 'flex-end',
  },
  assistantContainer: {
    alignSelf: 'flex-start',
  },
  avatar: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: theme.colors.surfaceAlt,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: theme.spacing.sm,
    borderWidth: 1,
    borderColor: theme.colors.border,
  },
  userAvatar: {
    marginLeft: theme.spacing.sm,
    marginRight: 0,
    backgroundColor: theme.colors.primary,
    borderColor: theme.colors.primaryDark,
  },
  messageContent: {
    flex: 1,
  },
  bubble: {
    padding: theme.spacing.md,
    borderRadius: theme.radius.md,
    ...theme.shadow,
  },
  userBubble: {
    backgroundColor: theme.colors.primary,
    borderBottomRightRadius: 4,
  },
  assistantBubble: {
    backgroundColor: theme.colors.surface,
    borderBottomLeftRadius: 4,
  },
  messageText: {
    fontSize: 15,
    fontFamily: 'DMSans_400Regular',
    lineHeight: 22,
  },
  userText: {
    color: 'white',
  },
  assistantText: {
    color: theme.colors.text,
  },
  mapContainer: {
    marginTop: theme.spacing.sm,
    borderRadius: theme.radius.md,
    overflow: 'hidden',
    height: 200,
    borderWidth: 1,
    borderColor: theme.colors.border,
  },
  miniMap: {
    flex: 1,
  },
  mapOverlay: {
    position: 'absolute',
    bottom: 8,
    left: 8,
    right: 8,
    backgroundColor: 'rgba(255,255,255,0.9)',
    paddingVertical: 4,
    paddingHorizontal: 8,
    borderRadius: theme.radius.sm,
    borderWidth: 1,
    borderColor: theme.colors.border,
  },
  mapStats: {
    fontSize: 12,
    fontFamily: 'Poppins_700Bold',
    color: theme.colors.primary,
    textAlign: 'center',
  },
  buildingChip: {
    marginTop: theme.spacing.sm,
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: theme.colors.surfaceAlt,
    paddingVertical: 8,
    paddingHorizontal: 12,
    borderRadius: theme.radius.pill,
    alignSelf: 'flex-start',
    borderWidth: 1,
    borderColor: theme.colors.border,
  },
  buildingChipText: {
    fontSize: 13,
    fontFamily: 'Poppins_700Bold',
    color: theme.colors.primary,
    marginLeft: 6,
  },
  inputBar: {
    flexDirection: 'row',
    padding: theme.spacing.md,
    backgroundColor: theme.colors.surface,
    borderTopWidth: 1,
    borderTopColor: theme.colors.border,
    alignItems: 'center',
  },
  input: {
    flex: 1,
    backgroundColor: theme.colors.background,
    borderRadius: theme.radius.pill,
    paddingHorizontal: 16,
    paddingVertical: 8,
    maxHeight: 100,
    color: theme.colors.text,
    fontFamily: 'DMSans_400Regular',
    fontSize: 15,
  },
  sendButton: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: theme.colors.primary,
    alignItems: 'center',
    justifyContent: 'center',
    marginLeft: theme.spacing.sm,
  },
  sendButtonDisabled: {
    backgroundColor: theme.colors.textMuted,
  },
  typingContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    height: 20,
    width: 40,
  },
  errorPadding: {
    padding: theme.spacing.md,
  }
});
