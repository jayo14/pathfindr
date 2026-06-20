import { LinearGradient } from 'expo-linear-gradient';
import { router } from 'expo-router';
import { useState } from 'react';
import { ScrollView, StyleSheet, Text, View, TextInput, Switch, Alert } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { PrimaryButton } from '@/components/PrimaryButton';
import { theme } from '@/constants/theme';
import { useAppStore } from '@/store/useAppStore';
import { updateProfile, submitSurvey } from '@/services/campus-service';

export default function OnboardingScreen() {
  const setHasCompletedOnboarding = useAppStore((state) => state.setHasCompletedOnboarding);
  const isGuest = useAppStore((state) => state.isGuest);

  const [step, setStep] = useState(1);
  const [fullName, setFullName] = useState('');
  const [isStudent, setIsStudent] = useState(true);
  const [college, setCollege] = useState('');
  const [department, setDepartment] = useState('');
  const [yearOfStudy, setYearOfStudy] = useState('');
  const [surveyResponse, setSurveyResponse] = useState('');

  const handleContinue = async (): Promise<void> => {
    if (step === 1) {
      if (!fullName) {
        Alert.alert('Required', 'Please enter your full name.');
        return;
      }
      setStep(2);
    } else if (step === 2) {
        if (!isGuest) {
            try {
                await updateProfile({
                    full_name: fullName,
                    is_student: isStudent,
                    college: isStudent ? college : null,
                    department: isStudent ? department : null,
                    year_of_study: isStudent ? yearOfStudy : null,
                    has_completed_onboarding: true,
                });
                await submitSurvey({ onboarding_survey: surveyResponse });
            } catch (error) {
                console.error("Failed to update profile", error);
            }
        }
      setHasCompletedOnboarding(true);
      router.replace('/(tabs)/map');
    }
  };

  return (
    <View style={styles.container}>
      <LinearGradient colors={['#DFF5E6', '#F4F7F2']} style={styles.hero}>
        <SafeAreaView style={styles.safeArea} edges={['top']}>
          <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
            <View style={styles.headlineWrap}>
              <Text style={styles.eyebrow}>Step {step} of 2</Text>
              <Text style={styles.title}>
                {step === 1 ? "Tell us about yourself" : "Help us improve PathFindr"}
              </Text>
            </View>

            {step === 1 ? (
              <View style={styles.form}>
                <Text style={styles.label}>Full Name</Text>
                <TextInput
                  style={styles.input}
                  value={fullName}
                  onChangeText={setFullName}
                  placeholder="Enter your name"
                />

                <View style={styles.switchRow}>
                  <Text style={styles.label}>Are you a student?</Text>
                  <Switch value={isStudent} onValueChange={setIsStudent} />
                </View>

                {isStudent && (
                  <>
                    <Text style={styles.label}>College</Text>
                    <TextInput
                      style={styles.input}
                      value={college}
                      onChangeText={setCollege}
                      placeholder="e.g. Science & Tech"
                    />
                    <Text style={styles.label}>Department</Text>
                    <TextInput
                      style={styles.input}
                      value={department}
                      onChangeText={setDepartment}
                      placeholder="e.g. Computer Science"
                    />
                    <Text style={styles.label}>Year of Study</Text>
                    <TextInput
                      style={styles.input}
                      value={yearOfStudy}
                      onChangeText={setYearOfStudy}
                      placeholder="e.g. Year 3"
                    />
                  </>
                )}
              </View>
            ) : (
              <View style={styles.form}>
                <Text style={styles.label}>Short Survey: Why are you using PathFindr?</Text>
                <TextInput
                  style={[styles.input, styles.textArea]}
                  value={surveyResponse}
                  onChangeText={setSurveyResponse}
                  placeholder="Your response..."
                  multiline
                  numberOfLines={4}
                />
              </View>
            )}
          </ScrollView>
        </SafeAreaView>
      </LinearGradient>
      <SafeAreaView edges={['bottom']} style={styles.footer}>
        <PrimaryButton
            label={step === 1 ? "Next" : "Complete Onboarding"}
            onPress={() => void handleContinue()}
        />
      </SafeAreaView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: theme.colors.background,
  },
  hero: {
    flex: 1,
  },
  safeArea: {
    flex: 1,
  },
  content: {
    paddingHorizontal: 24,
    paddingTop: 28,
    paddingBottom: 24,
    gap: 30,
  },
  headlineWrap: {
    gap: 12,
    paddingTop: 16,
  },
  eyebrow: {
    fontSize: 13,
    fontFamily: 'Poppins_800ExtraBold',
    letterSpacing: 1.2,
    textTransform: 'uppercase',
    color: theme.colors.primary,
  },
  title: {
    fontSize: 32,
    lineHeight: 40,
    fontFamily: 'Poppins_800ExtraBold',
    color: theme.colors.text,
  },
  form: {
    gap: 16,
  },
  label: {
    fontSize: 16,
    fontFamily: 'Poppins_600SemiBold',
    color: theme.colors.text,
  },
  input: {
    backgroundColor: '#FFFFFF',
    borderRadius: theme.radius.md,
    padding: 14,
    fontSize: 16,
    borderWidth: 1,
    borderColor: theme.colors.border,
  },
  textArea: {
    height: 120,
    textAlignVertical: 'top',
  },
  switchRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 8,
  },
  footer: {
    paddingHorizontal: 24,
    paddingTop: 12,
    paddingBottom: 20,
    backgroundColor: theme.colors.background,
  },
});
