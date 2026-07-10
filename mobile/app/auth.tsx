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
import { router } from 'expo-router';
import {
  Eye,
  EyeOff,
  Lock,
  Mail,
  MapPinned,
  ArrowLeft,
  ChevronRight,
} from 'lucide-react-native';
import { useState } from 'react';
import { SafeAreaView } from 'react-native-safe-area-context';

import { theme } from '@/constants/theme';
import * as authService from '@/services/auth-service';
import { useAppStore } from '@/store/useAppStore';

type AuthMode = 'login' | 'register' | 'forgot-password';

export default function AuthScreen() {
  const [mode, setMode] = useState<AuthMode>('login');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  const setIsAuthenticated = useAppStore((state) => state.setIsAuthenticated);
  const setHasCompletedOnboarding = useAppStore((state) => state.setHasCompletedOnboarding);
  const setIsGuest = useAppStore((state) => state.setIsGuest);
  const setUserEmail = useAppStore((state) => state.setUserEmail);
  const hasCompletedOnboarding = useAppStore((state) => state.hasCompletedOnboarding);

  const proceedAfterAuth = (): void => {
    if (hasCompletedOnboarding) {
      router.replace('/(tabs)/map');
    } else {
      router.replace('/onboarding');
    }
  };

  const handleGuestContinue = (): void => {
    setIsGuest(true);
    setIsAuthenticated(false);
    setUserEmail(undefined);
    proceedAfterAuth();
  };

  const handleSubmit = async (): Promise<void> => {
    if (mode === 'forgot-password') {
      if (!email.includes('@')) {
        Alert.alert("Invalid email", "Please enter a valid email address.");
        return;
      }
      setIsLoading(true);
      try {
        await authService.requestPasswordReset(email);
        Alert.alert("Email Sent", "If an account exists for this email, you will receive reset instructions.");
        setMode('login');
      } catch (err) {
        Alert.alert("Error", "Could not request password reset.");
      } finally {
        setIsLoading(false);
      }
      return;
    }

    if (!email.includes('@')) {
      Alert.alert("Invalid email", "Please enter a valid email address.");
      return;
    }
    if (password.length < 6) {
      Alert.alert("Weak password", "Password must be at least 6 characters.");
      return;
    }

    setIsLoading(true);
    try {
      if (mode === "register") {
        await authService.register(email.trim(), email.trim(), password);
        const data = await authService.login(email.trim(), password);
        setIsAuthenticated(true);
        setHasCompletedOnboarding(!!data.user.profile.has_completed_onboarding);
      } else {
        const data = await authService.login(email.trim(), password);
        setIsAuthenticated(true);
        setHasCompletedOnboarding(!!data.user.profile.has_completed_onboarding);
      }

      setIsGuest(false);
      setUserEmail(email.trim());
      proceedAfterAuth();
    } catch (error) {
      const message = error instanceof Error ? error.message : "Authentication failed.";
      Alert.alert(mode === "register" ? "Registration failed" : "Login failed", message);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <LinearGradient colors={['#E9F7EE', '#F4F7F2']} style={styles.gradient}>
      <SafeAreaView style={styles.safeArea}>
        <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : 'height'} style={styles.keyboardView}>
          <ScrollView contentContainerStyle={styles.scroll} keyboardShouldPersistTaps="handled">

            <View style={styles.header}>
              {mode === 'forgot-password' ? (
                <Pressable onPress={() => setMode('login')} style={styles.backBtn}>
                  <ArrowLeft color={theme.colors.text} size={24} />
                </Pressable>
              ) : (
                <View style={styles.brand}>
                  <View style={styles.brandMark}>
                    <MapPinned color="#FFFFFF" size={28} />
                  </View>
                  <Text style={styles.brandName}>PathFindr</Text>
                </View>
              )}
            </View>

            <View style={styles.content}>
              <Text style={styles.title}>
                {mode === 'login' ? 'Welcome back' :
                 mode === 'register' ? 'Create account' : 'Reset password'}
              </Text>
              <Text style={styles.subtitle}>
                {mode === 'login' ? 'Sign in to access your campus map and events.' :
                 mode === 'register' ? 'Join PathFindr to navigate campus smarter.' :
                 'Enter your email to receive a reset link.'}
              </Text>

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

                {mode !== 'forgot-password' && (
                  <View style={styles.inputWrap}>
                    <Lock color={theme.colors.textMuted} size={18} />
                    <TextInput
                      value={password}
                      onChangeText={setPassword}
                      placeholder="Password"
                      placeholderTextColor={theme.colors.textMuted}
                      secureTextEntry={!showPassword}
                      autoCapitalize="none"
                      style={styles.input}
                    />
                    <Pressable onPress={() => setShowPassword(!showPassword)}>
                      {showPassword ? <EyeOff color={theme.colors.textMuted} size={18} /> : <Eye color={theme.colors.textMuted} size={18} />}
                    </Pressable>
                  </View>
                )}

                {mode === 'login' && (
                  <Pressable onPress={() => setMode('forgot-password')} style={styles.forgotBtn}>
                    <Text style={styles.forgotText}>Forgot password?</Text>
                  </Pressable>
                )}

                <Pressable
                  style={[styles.primaryBtn, isLoading && styles.primaryBtnDisabled]}
                  onPress={() => void handleSubmit()}
                  disabled={isLoading}
                >
                  {isLoading ? <ActivityIndicator color="#FFFFFF" /> : (
                    <View style={styles.btnContent}>
                      <Text style={styles.primaryBtnText}>
                        {mode === 'login' ? 'Sign in' :
                         mode === 'register' ? 'Create account' : 'Send reset link'}
                      </Text>
                      <ChevronRight color="#FFFFFF" size={20} />
                    </View>
                  )}
                </Pressable>

                {(mode === 'login' || mode === 'register') && (
                  <>
                    <View style={styles.divider}>
                      <View style={styles.line} />
                      <Text style={styles.dividerText}>or</Text>
                      <View style={styles.line} />
                    </View>

                    <Pressable style={styles.guestBtn} onPress={handleGuestContinue}>
                      <Text style={styles.guestBtnText}>Continue as guest</Text>
                    </Pressable>
                  </>
                )}
              </View>

              <View style={styles.footer}>
                <Text style={styles.footerLabel}>
                  {mode === 'login' ? "Don't have an account?" : 'Already have an account?'}
                </Text>
                <Pressable onPress={() => setMode(mode === 'login' ? 'register' : 'login')}>
                  <Text style={styles.footerAction}>{mode === 'login' ? 'Sign up' : 'Sign in'}</Text>
                </Pressable>
              </View>
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
  header: { height: 60, justifyContent: 'center' },
  brand: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  brandMark: { width: 44, height: 44, borderRadius: 14, backgroundColor: theme.colors.primary, alignItems: 'center', justifyContent: 'center' },
  brandName: { fontSize: 22, fontFamily: 'Poppins_800ExtraBold', color: theme.colors.text },
  backBtn: { width: 40, height: 40, borderRadius: 20, backgroundColor: 'white', alignItems: 'center', justifyContent: 'center', borderWidth: 1, borderColor: '#EDF2ED' },
  content: { marginTop: 20 },
  title: { fontSize: 32, fontFamily: 'Poppins_800ExtraBold', color: theme.colors.text, marginBottom: 8 },
  subtitle: { fontSize: 16, fontFamily: 'DMSans_400Regular', color: theme.colors.textMuted, marginBottom: 32, lineHeight: 24 },
  card: { backgroundColor: 'white', borderRadius: 24, padding: 24, gap: 16, shadowColor: '#000', shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.05, shadowRadius: 10, elevation: 2 },
  inputWrap: { flexDirection: 'row', alignItems: 'center', gap: 12, backgroundColor: '#F9FBF9', borderWidth: 1, borderColor: '#EDF2ED', borderRadius: 16, paddingHorizontal: 16, height: 56 },
  input: { flex: 1, fontSize: 16, fontFamily: 'DMSans_400Regular', color: theme.colors.text },
  forgotBtn: { alignSelf: 'flex-end' },
  forgotText: { fontSize: 14, fontFamily: 'DMSans_600SemiBold', color: theme.colors.primary },
  primaryBtn: { backgroundColor: theme.colors.primary, height: 56, borderRadius: 16, alignItems: 'center', justifyContent: 'center' },
  primaryBtnDisabled: { opacity: 0.6 },
  btnContent: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  primaryBtnText: { color: 'white', fontSize: 16, fontFamily: 'Poppins_700Bold' },
  divider: { flexDirection: 'row', alignItems: 'center', gap: 12, marginVertical: 8 },
  line: { flex: 1, height: 1, backgroundColor: '#EDF2ED' },
  dividerText: { fontSize: 13, color: '#94A3B8', fontFamily: 'DMSans_500Medium' },
  guestBtn: { height: 56, borderRadius: 16, borderWidth: 1, borderColor: '#EDF2ED', alignItems: 'center', justifyContent: 'center' },
  guestBtnText: { fontSize: 15, fontFamily: 'Poppins_600SemiBold', color: theme.colors.text },
  footer: { flexDirection: 'row', justifyContent: 'center', gap: 8, marginTop: 32 },
  footerLabel: { fontSize: 14, color: theme.colors.textMuted, fontFamily: 'DMSans_400Regular' },
  footerAction: { fontSize: 14, color: theme.colors.primary, fontFamily: 'Poppins_700Bold' },
});
