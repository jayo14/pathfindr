import { router } from 'expo-router';
import {
  ChevronRight,
  DatabaseZap,
  Download,
  GraduationCap,
  KeyRound,
  LogOut,
  MapPinned,
  QrCode,
  RefreshCcw,
  ShieldCheck,
  User,
  Wifi,
  Info,
} from 'lucide-react-native';
import { useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  Modal,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useQuery } from '@tanstack/react-query';

import { theme } from '@/constants/theme';
import { useCampusData } from '@/hooks/useCampusData';
import { changePassword, getMe } from '@/services/auth-service';
import { useAppStore } from '@/store/useAppStore';

// ── Reusable row component ───────────────────────────────────────────────
function SettingsRow({
  icon: Icon,
  iconColor = theme.colors.primary,
  iconBg = theme.colors.surfaceAlt,
  label,
  value,
  onPress,
  destructive = false,
  last = false,
}: {
  icon: any;
  iconColor?: string;
  iconBg?: string;
  label: string;
  value?: string;
  onPress?: () => void;
  destructive?: boolean;
  last?: boolean;
}) {
  return (
    <Pressable
      style={[styles.row, last && styles.rowLast]}
      onPress={onPress}
      disabled={!onPress}
    >
      <View style={[styles.rowIconWrap, { backgroundColor: iconBg }]}>
        <Icon size={17} color={iconColor} />
      </View>
      <View style={styles.rowContent}>
        <Text style={[styles.rowLabel, destructive && styles.rowLabelDanger]}>{label}</Text>
        {value ? <Text style={styles.rowValue} numberOfLines={1}>{value}</Text> : null}
      </View>
      {onPress && (
        <ChevronRight size={16} color={destructive ? theme.colors.danger : theme.colors.textMuted} />
      )}
    </Pressable>
  );
}

// ── Section wrapper ──────────────────────────────────────────────────────
function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <View style={styles.section}>
      <Text style={styles.sectionTitle}>{title}</Text>
      <View style={styles.sectionCard}>{children}</View>
    </View>
  );
}

export default function SettingsScreen() {
  const campusDataQuery = useCampusData();
  const hasCompletedOnboarding     = useAppStore(s => s.hasCompletedOnboarding);
  const hasCompletedFreshersTour   = useAppStore(s => s.hasCompletedFreshersTour);
  const locationPermissionStatus   = useAppStore(s => s.locationPermissionStatus);
  const lastMapRegion              = useAppStore(s => s.lastMapRegion);
  const userEmail                  = useAppStore(s => s.userEmail);
  const isGuest                    = useAppStore(s => s.isGuest);
  const isAuthenticated            = useAppStore(s => s.isAuthenticated);
  const setHasCompletedOnboarding  = useAppStore(s => s.setHasCompletedOnboarding);
  const logout                     = useAppStore(s => s.logout);

  // Fetch live profile from /auth/me/ when signed in
  const { data: meData } = useQuery({
    queryKey: ['me'],
    queryFn: getMe,
    enabled: isAuthenticated && !isGuest,
    staleTime: 5 * 60 * 1000,
  });

  const displayName =
    meData?.profile?.fullName ||
    meData?.profile?.full_name ||
    meData?.username ||
    (isGuest ? 'Guest User' : userEmail?.split('@')[0] ?? 'Student');

  const displayEmail = meData?.email ?? (isGuest ? 'Not signed in' : userEmail ?? '');

  // Change-password modal state
  const [pwModalVisible, setPwModalVisible] = useState(false);
  const [oldPassword, setOldPassword]       = useState('');
  const [newPassword, setNewPassword]       = useState('');
  const [pwLoading, setPwLoading]           = useState(false);

  const handleChangePassword = async () => {
    if (!oldPassword || newPassword.length < 6) {
      Alert.alert('Validation', 'New password must be at least 6 characters.');
      return;
    }
    setPwLoading(true);
    try {
      await changePassword(oldPassword, newPassword);
      Alert.alert('Success', 'Password updated successfully.');
      setPwModalVisible(false);
      setOldPassword('');
      setNewPassword('');
    } catch (err) {
      const msg = err instanceof Error ? err.message : 'Failed to change password.';
      Alert.alert('Error', msg);
    } finally {
      setPwLoading(false);
    }
  };

  const handleLogout = () => {
    logout();
    router.replace('/auth');
  };

  const lastSync = campusDataQuery.data?.updatedAt
    ? new Date(campusDataQuery.data.updatedAt).toLocaleDateString('en-GB', {
        day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit',
      })
    : 'Not yet synced';

  const mapPos = lastMapRegion
    ? `${lastMapRegion.latitude.toFixed(3)}, ${lastMapRegion.longitude.toFixed(3)}`
    : 'Not saved';

  return (
    <SafeAreaView style={styles.root} edges={['top']} testID="settings-screen">
      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.scroll}
      >
        {/* ── Header ── */}
        <View style={styles.header}>
          <Text style={styles.eyebrow}>App</Text>
          <Text style={styles.title}>Settings</Text>
        </View>

        {/* ── Profile card ── */}
        <View style={styles.profileCard}>
          <View style={styles.profileAvatar}>
            <User size={28} color="#FFF" />
          </View>
          <View style={styles.profileInfo}>
            <Text style={styles.profileName}>{displayName}</Text>
            <Text style={styles.profileEmail}>{displayEmail}</Text>
          </View>
          <View style={[styles.profileBadge, isGuest ? styles.profileBadgeGuest : styles.profileBadgeAuth]}>
            <Text style={[styles.profileBadgeText, isGuest ? { color: '#F27C42' } : { color: '#0D8C60' }]}>
              {isGuest ? 'Guest' : 'Signed in'}
            </Text>
          </View>
        </View>

        {/* ── Campus ── */}
        <Section title="Campus">
          <SettingsRow
            icon={GraduationCap}
            iconColor="#0D8C60"
            iconBg="#E8F5F0"
            label={hasCompletedFreshersTour ? 'Replay Freshers Tour' : 'Freshers Tour'}
            value={hasCompletedFreshersTour ? 'Completed ✓' : 'Get to know the campus'}
            onPress={() => router.push('/freshers-tour')}
          />
          <SettingsRow
            icon={MapPinned}
            iconColor="#7C5CFA"
            iconBg="#F0ECFF"
            label="Last map position"
            value={mapPos}
            last
          />
        </Section>

        {/* ── Data & Offline ── */}
        <Section title="Data & Offline">
          <SettingsRow
            icon={Download}
            iconColor="#2078B4"
            iconBg="#EBF4FF"
            label="Last data sync"
            value={lastSync}
          />
          <SettingsRow
            icon={RefreshCcw}
            iconColor={theme.colors.primary}
            iconBg={theme.colors.surfaceAlt}
            label="Refresh campus data"
            onPress={() => void campusDataQuery.refetch()}
            last
          />
        </Section>

        {/* ── Permissions & Info ── */}
        <Section title="Permissions & Info">
          <SettingsRow
            icon={ShieldCheck}
            iconColor="#0D8C60"
            iconBg="#E8F5F0"
            label="Location access"
            value={locationPermissionStatus.charAt(0).toUpperCase() + locationPermissionStatus.slice(1)}
          />
          <SettingsRow
            icon={Wifi}
            iconColor="#2078B4"
            iconBg="#EBF4FF"
            label="Backend connection"
            value={process.env.EXPO_PUBLIC_API_URL ? 'Configured' : 'Default (localhost)'}
          />
          <SettingsRow
            icon={DatabaseZap}
            iconColor="#F27C42"
            iconBg="#FFF3EC"
            label="Supabase mode"
            value={process.env.EXPO_PUBLIC_SUPABASE_URL ? 'Live' : 'Mock fallback'}
            last
          />
        </Section>

        {/* ── Account ── */}
        <Section title="Account">
          <SettingsRow
            icon={Info}
            iconColor="#7C5CFA"
            iconBg="#F0ECFF"
            label={hasCompletedOnboarding ? 'Replay Onboarding' : 'View Onboarding'}
            onPress={() => {
              setHasCompletedOnboarding(false);
              router.replace('/onboarding');
            }}
          />
          {isAuthenticated && !isGuest && (
            <SettingsRow
              icon={KeyRound}
              iconColor="#2078B4"
              iconBg="#EBF4FF"
              label="Change Password"
              onPress={() => setPwModalVisible(true)}
            />
          )}
          <SettingsRow
            icon={LogOut}
            iconColor={theme.colors.danger}
            iconBg="#FFF0F0"
            label={isGuest ? 'Exit guest mode' : 'Sign out'}
            onPress={handleLogout}
            destructive
            last
          />
        </Section>

        <Text style={styles.version}>PathFindr v1.0.0 · LASUSTECH</Text>
      </ScrollView>

      {/* ── Change Password Modal ── */}
      <Modal visible={pwModalVisible} animationType="slide" presentationStyle="pageSheet">
        <SafeAreaView style={styles.modalContainer} edges={['top']}>
          <View style={styles.modalHeader}>
            <Text style={styles.modalTitle}>Change Password</Text>
            <Pressable onPress={() => { setPwModalVisible(false); setOldPassword(''); setNewPassword(''); }}>
              <Text style={styles.modalClose}>Cancel</Text>
            </Pressable>
          </View>
          <View style={styles.modalBody}>
            <Text style={styles.inputLabel}>Current password</Text>
            <TextInput
              style={styles.textInput}
              value={oldPassword}
              onChangeText={setOldPassword}
              placeholder="Enter current password"
              placeholderTextColor={theme.colors.textMuted}
              secureTextEntry
              autoCapitalize="none"
            />
            <Text style={[styles.inputLabel, { marginTop: 16 }]}>New password</Text>
            <TextInput
              style={styles.textInput}
              value={newPassword}
              onChangeText={setNewPassword}
              placeholder="At least 6 characters"
              placeholderTextColor={theme.colors.textMuted}
              secureTextEntry
              autoCapitalize="none"
            />
            <Pressable
              style={[styles.saveBtn, pwLoading && { opacity: 0.6 }]}
              onPress={() => void handleChangePassword()}
              disabled={pwLoading}
            >
              {pwLoading
                ? <ActivityIndicator color="#FFF" />
                : <Text style={styles.saveBtnText}>Update Password</Text>
              }
            </Pressable>
          </View>
        </SafeAreaView>
      </Modal>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  modalContainer: { flex: 1, backgroundColor: theme.colors.surface },
  modalHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', padding: 24, borderBottomWidth: 1, borderBottomColor: theme.colors.border },
  modalTitle: { fontSize: 22, fontFamily: 'Poppins_800ExtraBold', color: theme.colors.text },
  modalClose: { fontSize: 16, fontFamily: 'Poppins_700Bold', color: theme.colors.primary },
  modalBody: { padding: 24, gap: 12 },
  inputLabel: { fontSize: 14, fontFamily: 'Poppins_700Bold', color: theme.colors.text },
  textInput: { height: 50, borderWidth: 1, borderColor: theme.colors.border, borderRadius: 12, paddingHorizontal: 16, fontFamily: 'DMSans_400Regular', color: theme.colors.text, fontSize: 15, backgroundColor: theme.colors.surfaceAlt },
  saveBtn: { backgroundColor: theme.colors.primary, height: 50, borderRadius: 12, alignItems: 'center', justifyContent: 'center', marginTop: 24 },
  saveBtnText: { color: '#FFF', fontFamily: 'Poppins_700Bold', fontSize: 15 },

  root: { flex: 1, backgroundColor: theme.colors.background },
  scroll: { paddingBottom: 100 },

  header: {
    paddingHorizontal: 20,
    paddingTop: 8,
    paddingBottom: 16,
    gap: 2,
  },
  eyebrow: {
    fontSize: 11, fontFamily: 'Poppins_700Bold',
    color: theme.colors.primary,
    textTransform: 'uppercase', letterSpacing: 1.2,
  },
  title: {
    fontSize: 28, fontFamily: 'Poppins_800ExtraBold', color: theme.colors.text,
  },

  // Profile card
  profileCard: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 14,
    marginHorizontal: 20,
    marginBottom: 8,
    backgroundColor: theme.colors.surface,
    borderRadius: 20,
    padding: 16,
    ...theme.shadow,
  },
  profileAvatar: {
    width: 52, height: 52, borderRadius: 26,
    backgroundColor: theme.colors.primary,
    alignItems: 'center', justifyContent: 'center',
  },
  profileInfo: { flex: 1 },
  profileName: {
    fontSize: 16, fontFamily: 'Poppins_700Bold', color: theme.colors.text,
  },
  profileEmail: {
    fontSize: 12, fontFamily: 'DMSans_400Regular', color: theme.colors.textMuted, marginTop: 1,
  },
  profileBadge: {
    paddingHorizontal: 10, paddingVertical: 4, borderRadius: theme.radius.pill,
  },
  profileBadgeAuth: { backgroundColor: '#E8F5F0' },
  profileBadgeGuest: { backgroundColor: '#FFF3EC' },
  profileBadgeText: { fontSize: 11, fontFamily: 'Poppins_700Bold' },

  // Section
  section: { paddingHorizontal: 20, paddingTop: 20 },
  sectionTitle: {
    fontSize: 12, fontFamily: 'Poppins_700Bold',
    color: theme.colors.textMuted,
    textTransform: 'uppercase', letterSpacing: 0.9,
    marginBottom: 8,
  },
  sectionCard: {
    backgroundColor: theme.colors.surface,
    borderRadius: 18,
    overflow: 'hidden',
    ...theme.shadow,
  },

  // Row
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    paddingHorizontal: 14,
    paddingVertical: 13,
    borderBottomWidth: 1,
    borderBottomColor: theme.colors.border,
  },
  rowLast: { borderBottomWidth: 0 },
  rowIconWrap: {
    width: 34, height: 34, borderRadius: 10,
    alignItems: 'center', justifyContent: 'center',
  },
  rowContent: { flex: 1 },
  rowLabel: {
    fontSize: 15, fontFamily: 'Poppins_700Bold', color: theme.colors.text,
  },
  rowLabelDanger: { color: theme.colors.danger },
  rowValue: {
    fontSize: 12, fontFamily: 'DMSans_400Regular', color: theme.colors.textMuted, marginTop: 1,
  },

  version: {
    textAlign: 'center',
    fontSize: 12,
    fontFamily: 'DMSans_400Regular',
    color: theme.colors.textMuted,
    marginTop: 28,
    paddingBottom: 12,
  },
});
