import { LinearGradient } from 'expo-linear-gradient';
import { router } from 'expo-router';
import {
  MapPin,
  User,
  GraduationCap,
  MessageSquare,
  ChevronRight,
  CheckCircle2,
} from 'lucide-react-native';
import { useState } from 'react';
import {
  KeyboardAvoidingView,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Switch,
  Text,
  TextInput,
  View,
  Alert,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { theme } from '@/constants/theme';
import { updateProfile, submitSurvey } from '@/services/campus-service';
import { useAppStore } from '@/store/useAppStore';

const STEPS = [
  {
    icon: MapPin,
    color: '#0D8C60',
    bg: '#E8F5F0',
    title: 'Welcome to PathFindr',
    subtitle: 'Your smart campus companion for LASUSTECH. Find buildings, get directions, and never get lost.',
  },
  {
    icon: User,
    color: '#7C5CFA',
    bg: '#F0ECFF',
    title: 'Tell us about you',
    subtitle: 'Help us personalise your campus experience with a few quick details.',
  },
  {
    icon: MessageSquare,
    color: '#F27C42',
    bg: '#FFF3EC',
    title: 'Quick feedback',
    subtitle: 'One short question so we can keep improving PathFindr for you.',
  },
];

export default function OnboardingScreen() {
  const setHasCompletedOnboarding = useAppStore(s => s.setHasCompletedOnboarding);
  const isGuest = useAppStore(s => s.isGuest);

  const [step, setStep] = useState(0);   // 0 = welcome, 1 = profile, 2 = survey

  // Profile fields
  const [fullName, setFullName]       = useState('');
  const [isStudent, setIsStudent]     = useState(true);
  const [college, setCollege]         = useState('');
  const [department, setDepartment]   = useState('');
  const [yearOfStudy, setYearOfStudy] = useState('');
  const [survey, setSurvey]           = useState('');

  const totalSteps = STEPS.length;
  const current = STEPS[step];

  const handleNext = async () => {
    if (step === 0) {
      setStep(1);
      return;
    }

    if (step === 1) {
      if (!fullName.trim()) {
        Alert.alert('Required', 'Please enter your full name.');
        return;
      }
      setStep(2);
      return;
    }

    // step === 2 — finish
    if (!isGuest) {
      try {
        await updateProfile({
          full_name: fullName,
          is_student: isStudent,
          college:       isStudent ? college     : null,
          department:    isStudent ? department   : null,
          year_of_study: isStudent ? yearOfStudy : null,
          has_completed_onboarding: true,
        });
        await submitSurvey({ onboarding_survey: survey });
      } catch (err) {
        console.error('Profile update failed', err);
      }
    }
    setHasCompletedOnboarding(true);
    router.replace('/(tabs)/map');
  };

  const isLastStep = step === totalSteps - 1;

  return (
    <KeyboardAvoidingView
      style={{ flex: 1 }}
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
    >
      <LinearGradient colors={['#E4F4EB', '#F4F7F2', '#FFFFFF']} style={styles.root}>
        <SafeAreaView style={styles.safe} edges={['top', 'bottom']}>

          {/* ── Progress dots ── */}
          <View style={styles.progressRow}>
            {STEPS.map((_, i) => (
              <View
                key={i}
                style={[
                  styles.dot,
                  i === step && styles.dotActive,
                  i < step  && styles.dotDone,
                ]}
              />
            ))}
          </View>

          {/* ── Scrollable content ── */}
          <ScrollView
            contentContainerStyle={styles.scroll}
            keyboardShouldPersistTaps="handled"
            showsVerticalScrollIndicator={false}
          >
            {/* Step illustration / icon */}
            <View style={[styles.illustrationWrap, { backgroundColor: current.bg }]}>
              <current.icon size={52} color={current.color} strokeWidth={1.5} />
            </View>

            {/* Title & subtitle */}
            <Text style={styles.stepLabel}>
              Step {step + 1} of {totalSteps}
            </Text>
            <Text style={styles.title}>{current.title}</Text>
            <Text style={styles.subtitle}>{current.subtitle}</Text>

            {/* ── Step 1: Profile form ── */}
            {step === 1 && (
              <View style={styles.form}>
                <View style={styles.inputGroup}>
                  <Text style={styles.label}>Full name</Text>
                  <View style={styles.inputWrap}>
                    <User size={16} color={theme.colors.textMuted} />
                    <TextInput
                      style={styles.input}
                      value={fullName}
                      onChangeText={setFullName}
                      placeholder="Your full name"
                      placeholderTextColor={theme.colors.textMuted}
                      autoCapitalize="words"
                    />
                  </View>
                </View>

                <View style={styles.toggleCard}>
                  <GraduationCap size={18} color={theme.colors.primary} />
                  <Text style={styles.toggleLabel}>I'm a student</Text>
                  <Switch
                    value={isStudent}
                    onValueChange={setIsStudent}
                    trackColor={{ false: theme.colors.border, true: theme.colors.primary }}
                    thumbColor="#FFF"
                  />
                </View>

                {isStudent && (
                  <>
                    <View style={styles.inputGroup}>
                      <Text style={styles.label}>College</Text>
                      <View style={styles.inputWrap}>
                        <TextInput
                          style={styles.input}
                          value={college}
                          onChangeText={setCollege}
                          placeholder="e.g. Science & Technology"
                          placeholderTextColor={theme.colors.textMuted}
                        />
                      </View>
                    </View>
                    <View style={styles.inputGroup}>
                      <Text style={styles.label}>Department</Text>
                      <View style={styles.inputWrap}>
                        <TextInput
                          style={styles.input}
                          value={department}
                          onChangeText={setDepartment}
                          placeholder="e.g. Computer Science"
                          placeholderTextColor={theme.colors.textMuted}
                        />
                      </View>
                    </View>
                    <View style={styles.inputGroup}>
                      <Text style={styles.label}>Year of study</Text>
                      <View style={styles.inputWrap}>
                        <TextInput
                          style={styles.input}
                          value={yearOfStudy}
                          onChangeText={setYearOfStudy}
                          placeholder="e.g. Year 2"
                          placeholderTextColor={theme.colors.textMuted}
                        />
                      </View>
                    </View>
                  </>
                )}
              </View>
            )}

            {/* ── Step 2: Survey ── */}
            {step === 2 && (
              <View style={styles.form}>
                <View style={styles.inputGroup}>
                  <Text style={styles.label}>Why are you using PathFindr?</Text>
                  <TextInput
                    style={styles.textArea}
                    value={survey}
                    onChangeText={setSurvey}
                    placeholder="Navigating to lectures, finding the library, exploring campus…"
                    placeholderTextColor={theme.colors.textMuted}
                    multiline
                    numberOfLines={5}
                    textAlignVertical="top"
                  />
                </View>
              </View>
            )}
          </ScrollView>

          {/* ── Footer actions ── */}
          <View style={styles.footer}>
            <Pressable
              style={styles.nextBtn}
              onPress={() => void handleNext()}
            >
              {isLastStep
                ? <CheckCircle2 size={20} color="#FFF" />
                : null
              }
              <Text style={styles.nextBtnText}>
                {step === 0 ? "Get started" : isLastStep ? "All done!" : "Continue"}
              </Text>
              {!isLastStep && <ChevronRight size={18} color="#FFF" />}
            </Pressable>

            {step > 0 && (
              <Pressable style={styles.backBtn} onPress={() => setStep(s => s - 1)}>
                <Text style={styles.backBtnText}>Back</Text>
              </Pressable>
            )}

            {step === 0 && (
              <Pressable
                style={styles.skipBtn}
                onPress={() => {
                  setHasCompletedOnboarding(true);
                  router.replace('/(tabs)/map');
                }}
              >
                <Text style={styles.skipBtnText}>Skip for now</Text>
              </Pressable>
            )}
          </View>
        </SafeAreaView>
      </LinearGradient>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1 },
  safe: { flex: 1 },

  // Progress dots
  progressRow: {
    flexDirection: 'row',
    justifyContent: 'center',
    gap: 8,
    paddingTop: 16,
    paddingBottom: 4,
  },
  dot: {
    width: 8, height: 8, borderRadius: 4,
    backgroundColor: theme.colors.border,
  },
  dotActive: {
    width: 24,
    backgroundColor: theme.colors.primary,
  },
  dotDone: {
    backgroundColor: theme.colors.primary,
    opacity: 0.4,
  },

  // Scroll content
  scroll: {
    paddingHorizontal: 28,
    paddingTop: 24,
    paddingBottom: 16,
    gap: 12,
  },

  // Illustration
  illustrationWrap: {
    width: 100, height: 100,
    borderRadius: 30,
    alignItems: 'center', justifyContent: 'center',
    alignSelf: 'center',
    marginBottom: 8,
  },

  stepLabel: {
    fontSize: 12, fontFamily: 'Poppins_700Bold',
    color: theme.colors.primary,
    textTransform: 'uppercase', letterSpacing: 1,
    textAlign: 'center',
  },
  title: {
    fontSize: 26, fontFamily: 'Poppins_800ExtraBold',
    color: theme.colors.text,
    textAlign: 'center', lineHeight: 34,
  },
  subtitle: {
    fontSize: 15, fontFamily: 'DMSans_400Regular',
    color: theme.colors.textMuted,
    textAlign: 'center', lineHeight: 23,
  },

  // Form
  form: { gap: 16, marginTop: 8 },
  inputGroup: { gap: 6 },
  label: {
    fontSize: 13, fontFamily: 'Poppins_700Bold', color: theme.colors.text,
  },
  inputWrap: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    backgroundColor: theme.colors.surface,
    borderRadius: 14,
    paddingHorizontal: 14,
    paddingVertical: 14,
    borderWidth: 1,
    borderColor: theme.colors.border,
  },
  input: {
    flex: 1, fontSize: 15,
    fontFamily: 'DMSans_400Regular',
    color: theme.colors.text,
  },
  toggleCard: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    backgroundColor: theme.colors.surface,
    borderRadius: 14,
    paddingHorizontal: 14,
    paddingVertical: 14,
    borderWidth: 1,
    borderColor: theme.colors.border,
  },
  toggleLabel: {
    flex: 1, fontSize: 15, fontFamily: 'Poppins_700Bold', color: theme.colors.text,
  },
  textArea: {
    backgroundColor: theme.colors.surface,
    borderRadius: 14,
    padding: 14,
    fontSize: 15,
    fontFamily: 'DMSans_400Regular',
    color: theme.colors.text,
    borderWidth: 1,
    borderColor: theme.colors.border,
    minHeight: 120,
  },

  // Footer
  footer: {
    paddingHorizontal: 28,
    paddingTop: 8,
    paddingBottom: 8,
    gap: 10,
  },
  nextBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    backgroundColor: theme.colors.primary,
    borderRadius: theme.radius.pill,
    paddingVertical: 16,
    ...theme.shadow,
  },
  nextBtnText: {
    fontSize: 16, fontFamily: 'Poppins_800ExtraBold', color: '#FFF',
  },
  backBtn: {
    alignItems: 'center',
    paddingVertical: 10,
  },
  backBtnText: {
    fontSize: 14, fontFamily: 'Poppins_700Bold', color: theme.colors.textMuted,
  },
  skipBtn: {
    alignItems: 'center',
    paddingVertical: 10,
  },
  skipBtnText: {
    fontSize: 14, fontFamily: 'DMSans_400Regular', color: theme.colors.textMuted,
  },
});
