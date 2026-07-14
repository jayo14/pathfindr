import {
  ActivityIndicator,
  Alert,
  KeyboardAvoidingView,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { useRouter } from 'expo-router';
import { ArrowLeft, Mail, MapPinned } from 'lucide-react-native';
import { useState } from 'react';
import { SafeAreaView } from 'react-native-safe-area-context';

import { theme } from '@/constants/theme';
import * as authService from '@/services/auth-service';

export default function ForgotPasswordScreen() {
  const [email, setEmail] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [sent, setSent] = useState(false);
  const router = useRouter();

  const goBack = (): void => {
    if (router.canGoBack()) {
      router.back();
    } else {
      router.replace('/auth');
    }
  };

  const handleSubmit = async (): Promise<void> => {
    if (!email.includes('@')) {
      Alert.alert('Invalid email', 'Please enter a valid email address.');
      return;
    }
    setIsLoading(true);
    try {
      await authService.requestPasswordReset(email);
      setSent(true);
    } catch {
      Alert.alert('Error', 'Could not request password reset. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <LinearGradient colors={['#E9F7EE', '#F4F7F2']} style={styles.gradient}>
      <SafeAreaView style={styles.safeArea}>
        <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : 'height'} style={styles.keyboardView}>
          <ScrollView contentContainerStyle={styles.scroll} keyboardShouldPersistTaps="handled">
            <Pressable onPress={goBack} style={styles.backBtn}>
              <ArrowLeft color={theme.colors.text} size={24} />
            </Pressable>

            <View style={styles.brand}>
              <View style={styles.brandMark}>
                <MapPinned color="#FFFFFF" size={28} />
              </View>
              <Text style={styles.brandName}>PathFindr</Text>
            </View>

            <View style={styles.content}>
              <Text style={styles.title}>Reset password</Text>
              <Text style={styles.subtitle}>Enter your email to receive a reset link.</Text>

              {sent ? (
                <View style={styles.card}>
                  <Text style={styles.sentTitle}>Email sent</Text>
                  <Text style={styles.sentText}>
                    If an account exists for {email}, you will receive reset instructions shortly.
                  </Text>
                  <Pressable style={styles.primaryBtn} onPress={goBack}>
                    <Text style={styles.primaryBtnText}>Back to sign in</Text>
                  </Pressable>
                </View>
              ) : (
                <View style={styles.card}>
                  <View style={styles.inputWrap}>
                    <Mail color={theme.colors.textMuted} size={18} />
                    <TextInput
                      value={email}
                      onChangeText={setEmail}
                      placeholder="Email address"
                      placeholderTextColor={theme.colors.textMuted}
                      keyboardType="email-address"
                      autoCapitalize="none"
                      style={styles.input}
                    />
                  </View>

                  <Pressable
                    style={[styles.primaryBtn, isLoading && styles.primaryBtnDisabled]}
                    onPress={() => void handleSubmit()}
                    disabled={isLoading}
                  >
                    {isLoading ? <ActivityIndicator color="#FFFFFF" /> : (
                      <Text style={styles.primaryBtnText}>Send reset link</Text>
                    )}
                  </Pressable>
                </View>
              )}

              {!sent && (
                <View style={styles.footer}>
                  <Text style={styles.footerLabel}>Remembered your password?</Text>
                  <Pressable onPress={goBack}>
                    <Text style={styles.footerAction}>Sign in</Text>
                  </Pressable>
                </View>
              )}
            </View>
          </ScrollView>
        </KeyboardAvoidingView>
      </SafeAreaView>
    </LinearGradient>
  );
}

const styles = StyleSheet.create({
  gradient: { flex: 1 },
  safeArea: { flex: 1 },
  keyboardView: { flex: 1 },
  scroll: { flexGrow: 1, padding: 24 },
  backBtn: {
    width: 40, height: 40, borderRadius: 20, backgroundColor: 'white',
    alignItems: 'center', justifyContent: 'center', borderWidth: 1, borderColor: '#EDF2ED', marginTop: 8,
  },
  brand: { flexDirection: 'row', alignItems: 'center', gap: 12, marginTop: 20 },
  brandMark: {
    width: 44, height: 44, borderRadius: 14,
    backgroundColor: theme.colors.primary, alignItems: 'center', justifyContent: 'center',
  },
  brandName: { fontSize: 22, fontFamily: 'Poppins_800ExtraBold', color: theme.colors.text },
  content: { marginTop: 32 },
  title: { fontSize: 32, fontFamily: 'Poppins_800ExtraBold', color: theme.colors.text, marginBottom: 8 },
  subtitle: { fontSize: 16, fontFamily: 'DMSans_400Regular', color: theme.colors.textMuted, marginBottom: 32, lineHeight: 24 },
  card: {
    backgroundColor: 'white', borderRadius: 24, padding: 24, gap: 16,
    shadowColor: '#000', shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.05, shadowRadius: 10, elevation: 2,
  },
  inputWrap: {
    flexDirection: 'row', alignItems: 'center', gap: 12,
    backgroundColor: '#F9FBF9', borderWidth: 1, borderColor: '#EDF2ED', borderRadius: 16, paddingHorizontal: 16, height: 56,
  },
  input: { flex: 1, fontSize: 16, fontFamily: 'DMSans_400Regular', color: theme.colors.text },
  primaryBtn: {
    backgroundColor: theme.colors.primary, height: 56, borderRadius: 16,
    alignItems: 'center', justifyContent: 'center',
  },
  primaryBtnDisabled: { opacity: 0.6 },
  primaryBtnText: { color: 'white', fontSize: 16, fontFamily: 'Poppins_700Bold' },
  sentTitle: { fontSize: 18, fontFamily: 'Poppins_700Bold', color: theme.colors.text, marginBottom: 8 },
  sentText: { fontSize: 15, fontFamily: 'DMSans_400Regular', color: theme.colors.textMuted, lineHeight: 22 },
  footer: { flexDirection: 'row', justifyContent: 'center', gap: 8, marginTop: 32 },
  footerLabel: { fontSize: 14, color: theme.colors.textMuted, fontFamily: 'DMSans_400Regular' },
  footerAction: { fontSize: 14, color: theme.colors.primary, fontFamily: 'Poppins_700Bold' },
});
