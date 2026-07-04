import { Camera, CameraView } from 'expo-camera';
import * as Haptics from 'expo-haptics';
import { Stack, useRouter } from 'expo-router';
import { Clipboard, QrCode, ScanLine, X } from 'lucide-react-native';
import { useCallback, useEffect, useRef, useState } from 'react';
import {
  Alert,
  KeyboardAvoidingView,
  Linking,
  Platform,
  Pressable,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';

import { PrimaryButton } from '@/components/PrimaryButton';
import { StateCard } from '@/components/StateCard';
import { theme } from '@/constants/theme';

// ── Permission status type ────────────────────────────────────────────────
type PermStatus = 'loading' | 'granted' | 'denied' | 'can-ask';

// ── Deep-link / URL parser ────────────────────────────────────────────────
/**
 * Parse a scanned payload and return a local Expo Router path if recognised,
 * or null if the payload is not a known PathFindr link.
 *
 * Accepted formats
 *   pathfindr://building/<id>
 *   pathfindr://directions?buildingId=<id>
 *   https://<host>/building/<id>
 *   <bare building slug>  (letters, digits and hyphens, ≥3 chars)
 */
function parsePayload(raw: string): string | null {
  const text = raw.trim();

  const deepBuilding = text.match(/^(?:pathfindr|rork-app):\/\/building\/([^?#/\s]+)/i);
  if (deepBuilding) return `/building/${deepBuilding[1]}`;

  const deepDir = text.match(/^(?:pathfindr|rork-app):\/\/directions\?buildingId=([^&#\s]+)/i);
  if (deepDir) return `/directions?buildingId=${deepDir[1]}`;

  const webBuilding = text.match(/https?:\/\/[^/]+\/building\/([^?#/\s]+)/i);
  if (webBuilding) return `/building/${webBuilding[1]}`;

  if (/^[a-z0-9-]{3,}$/i.test(text)) return `/building/${text}`;

  return null;
}

// ── Component ─────────────────────────────────────────────────────────────
export default function ScanScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();

  const [permStatus, setPermStatus] = useState<PermStatus>('loading');
  const [canAskAgain, setCanAskAgain] = useState(true);
  const [scanned, setScanned] = useState(false);
  const [manualText, setManualText] = useState('');
  const [manualError, setManualError] = useState('');
  const isProcessing = useRef(false);

  // Check permission on mount
  useEffect(() => {
    Camera.getCameraPermissionsAsync().then(result => {
      if (result.granted) {
        setPermStatus('granted');
      } else if (result.canAskAgain) {
        setPermStatus('can-ask');
        setCanAskAgain(true);
      } else {
        setPermStatus('denied');
        setCanAskAgain(false);
      }
    }).catch(() => setPermStatus('can-ask'));
  }, []);

  const requestPermission = useCallback(async () => {
    const result = await Camera.requestCameraPermissionsAsync();
    if (result.granted) {
      setPermStatus('granted');
    } else {
      setCanAskAgain(result.canAskAgain ?? false);
      setPermStatus('denied');
    }
  }, []);

  // Navigate to the resolved path or show a friendly error
  const handlePayload = useCallback((raw: string) => {
    if (isProcessing.current) return;
    isProcessing.current = true;

    const path = parsePayload(raw);
    if (path) {
      void Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      setTimeout(() => router.replace(path as any), 120);
    } else {
      void Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
      setScanned(false);
      isProcessing.current = false;
      Alert.alert(
        'Unrecognised QR code',
        'This code does not link to a known LASUSTECH building or PathFindr destination.\n\nMake sure you are scanning a PathFindr campus QR code.',
        [{ text: 'Try again', onPress: () => setScanned(false) }],
      );
    }
  }, [router]);

  const handleBarcodeScanned = useCallback(
    ({ data }: { data: string }) => {
      if (scanned) return;
      setScanned(true);
      handlePayload(data);
    },
    [scanned, handlePayload],
  );

  const handleManualSubmit = () => {
    const text = manualText.trim();
    if (!text) { setManualError('Please enter a link or building ID.'); return; }
    setManualError('');
    handlePayload(text);
  };

  // ── Still checking permissions ────────────────────────────────────────
  if (permStatus === 'loading') {
    return <View style={styles.root} />;
  }

  // ── Need to ask / was denied ─────────────────────────────────────────
  if (permStatus !== 'granted') {
    return (
      <SafeAreaView style={styles.permRoot} edges={['top', 'bottom']}>
        <Stack.Screen options={{ headerShown: false }} />
        <KeyboardAvoidingView
          style={{ flex: 1 }}
          behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        >
        <View style={styles.permScreen}>
          <View style={styles.permIconWrap}>
            <QrCode size={48} color={theme.colors.primary} />
          </View>

          <Text style={styles.permTitle}>Camera access needed</Text>
          <Text style={styles.permBody}>
            PathFindr uses your camera to scan QR codes on campus signage and
            open building information instantly. Your camera is only active
            while you are on this screen.
          </Text>

          {permStatus === 'can-ask' ? (
            <PrimaryButton
              label="Grant camera access"
              onPress={() => void requestPermission()}
              style={styles.permBtn}
            />
          ) : (
            <>
              <StateCard
                title="Permission denied"
                description="Camera access was denied. Open Settings to enable it, or use the manual link entry below."
              />
              <PrimaryButton
                label="Open Settings"
                onPress={() => void Linking.openSettings()}
                style={styles.permBtn}
              />
            </>
          )}

          {/* Manual fallback always available */}
          <View style={styles.manualSection}>
            <Text style={styles.manualLabel}>Or paste a link / building ID</Text>
            <View style={styles.manualRow}>
              <TextInput
                style={styles.manualInput}
                value={manualText}
                onChangeText={t => { setManualText(t); setManualError(''); }}
                placeholder="pathfindr://building/library-complex"
                placeholderTextColor={theme.colors.textMuted}
                autoCapitalize="none"
                autoCorrect={false}
              />
            </View>
            {manualError ? <Text style={styles.manualError}>{manualError}</Text> : null}
            <PrimaryButton label="Go" variant="secondary" onPress={handleManualSubmit} style={styles.manualBtn} />
          </View>

          <Pressable style={styles.backBtn} onPress={() => router.back()}>
            <Text style={styles.backBtnText}>Cancel</Text>
          </Pressable>
        </View>
        </KeyboardAvoidingView>
      </SafeAreaView>
    );
  }

  // ── Camera active ─────────────────────────────────────────────────────
  return (
    <View style={styles.root}>
      <Stack.Screen options={{ headerShown: false }} />

      <CameraView
        style={StyleSheet.absoluteFillObject}
        facing="back"
        barcodeScannerSettings={{ barcodeTypes: ['qr'] }}
        onBarcodeScanned={scanned ? undefined : handleBarcodeScanned}
      />

      {/* Dark vignette */}
      <View style={styles.overlay} pointerEvents="none">
        <View style={styles.scanWindow} />
      </View>

      {/* Top bar */}
      <SafeAreaView style={styles.topBar} edges={['top']} pointerEvents="box-none">
        <Pressable style={styles.closeBtn} onPress={() => router.back()}>
          <X size={20} color="#FFF" />
        </Pressable>
        <Text style={styles.scanTitle}>Scan Campus QR Code</Text>
        <View style={{ width: 40 }} />
      </SafeAreaView>

      {/* Frame corners */}
      <View style={styles.frameWrap} pointerEvents="none">
        <View style={[styles.corner, styles.cornerTL]} />
        <View style={[styles.corner, styles.cornerTR]} />
        <View style={[styles.corner, styles.cornerBL]} />
        <View style={[styles.corner, styles.cornerBR]} />
        <ScanLine size={28} color="rgba(255,255,255,0.7)" style={{ marginTop: 8 }} />
      </View>

      {/* Bottom panel */}
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        style={styles.bottomKAV}
      >
      <SafeAreaView
        style={[styles.bottomPanel, { paddingBottom: insets.bottom + 8 }]}
        edges={['bottom']}
      >
        <Text style={styles.hint}>
          Point your camera at a PathFindr QR code on campus signage
        </Text>

        {scanned && (
          <PrimaryButton
            label="Scan another"
            onPress={() => { setScanned(false); isProcessing.current = false; }}
            variant="secondary"
            style={styles.rescanBtn}
          />
        )}

        <View style={styles.manualSection}>
          <Text style={styles.manualLabelLight}>Or paste a link / building ID</Text>
          <View style={styles.manualRow}>
            <TextInput
              style={[styles.manualInput, styles.manualInputDark]}
              value={manualText}
              onChangeText={t => { setManualText(t); setManualError(''); }}
              placeholder="library-complex"
              placeholderTextColor="rgba(255,255,255,0.45)"
              autoCapitalize="none"
              autoCorrect={false}
            />
            <Pressable style={styles.manualSubmitBtn} onPress={handleManualSubmit}>
              <Clipboard size={18} color="#FFF" />
            </Pressable>
          </View>
          {manualError ? <Text style={styles.manualError}>{manualError}</Text> : null}
        </View>
      </SafeAreaView>
      </KeyboardAvoidingView>
    </View>
  );
}

const WINDOW_SIZE = 240;

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: '#000' },

  // Permission screen
  permRoot: { flex: 1, backgroundColor: theme.colors.background },
  permScreen: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: 28,
    gap: 16,
  },
  permIconWrap: {
    width: 88, height: 88, borderRadius: 28,
    backgroundColor: theme.colors.surfaceAlt,
    alignItems: 'center', justifyContent: 'center',
    marginBottom: 8,
  },
  permTitle: {
    fontSize: 24, fontFamily: 'Poppins_800ExtraBold',
    color: theme.colors.text, textAlign: 'center',
  },
  permBody: {
    fontSize: 15, fontFamily: 'DMSans_400Regular',
    color: theme.colors.textMuted, textAlign: 'center', lineHeight: 22,
  },
  permBtn: { width: '100%' },
  backBtn: {
    paddingVertical: 12, paddingHorizontal: 24,
    borderRadius: theme.radius.pill,
    borderWidth: 1, borderColor: theme.colors.border,
  },
  backBtnText: { fontSize: 15, fontFamily: 'Poppins_700Bold', color: theme.colors.textMuted },

  // Camera overlay
  overlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(0,0,0,0.62)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  scanWindow: { width: WINDOW_SIZE, height: WINDOW_SIZE, backgroundColor: 'transparent' },

  // Top bar
  topBar: {
    position: 'absolute', top: 0, left: 0, right: 0,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingBottom: 10,
  },
  closeBtn: {
    width: 40, height: 40, borderRadius: 20,
    backgroundColor: 'rgba(0,0,0,0.4)',
    alignItems: 'center', justifyContent: 'center',
  },
  scanTitle: { fontSize: 16, fontFamily: 'Poppins_700Bold', color: '#FFF' },

  // Frame corners
  frameWrap: {
    position: 'absolute',
    width: WINDOW_SIZE, height: WINDOW_SIZE,
    alignSelf: 'center',
    top: '50%',
    marginTop: -WINDOW_SIZE / 2,
    alignItems: 'center',
    justifyContent: 'flex-start',
  },
  corner: { position: 'absolute', width: 28, height: 28, borderColor: '#FFF' },
  cornerTL: { top: 0, left: 0, borderTopWidth: 3, borderLeftWidth: 3, borderTopLeftRadius: 4 },
  cornerTR: { top: 0, right: 0, borderTopWidth: 3, borderRightWidth: 3, borderTopRightRadius: 4 },
  cornerBL: { bottom: 0, left: 0, borderBottomWidth: 3, borderLeftWidth: 3, borderBottomLeftRadius: 4 },
  cornerBR: { bottom: 0, right: 0, borderBottomWidth: 3, borderRightWidth: 3, borderBottomRightRadius: 4 },

  // Bottom panel
  bottomKAV: {
    position: 'absolute', bottom: 0, left: 0, right: 0,
  },
  bottomPanel: {
    paddingHorizontal: 24,
    paddingTop: 20,
    gap: 14,
    backgroundColor: 'rgba(0,0,0,0.55)',
  },
  hint: {
    fontSize: 14, fontFamily: 'DMSans_400Regular',
    color: 'rgba(255,255,255,0.8)', textAlign: 'center',
  },
  rescanBtn: { width: '100%' },

  // Manual entry
  manualSection: { gap: 8, width: '100%' },
  manualLabel: {
    fontSize: 13, fontFamily: 'Poppins_700Bold',
    color: theme.colors.textMuted, textAlign: 'center',
  },
  manualLabelLight: {
    fontSize: 13, fontFamily: 'Poppins_700Bold',
    color: 'rgba(255,255,255,0.7)', textAlign: 'center',
  },
  manualRow: { flexDirection: 'row', gap: 8 },
  manualInput: {
    flex: 1, height: 48, borderRadius: 14, paddingHorizontal: 14,
    fontSize: 14, fontFamily: 'DMSans_400Regular',
    backgroundColor: theme.colors.surface, color: theme.colors.text,
    borderWidth: 1, borderColor: theme.colors.border,
  },
  manualInputDark: {
    backgroundColor: 'rgba(255,255,255,0.12)',
    color: '#FFF',
    borderColor: 'rgba(255,255,255,0.2)',
  },
  manualSubmitBtn: {
    width: 48, height: 48, borderRadius: 14,
    backgroundColor: theme.colors.primary,
    alignItems: 'center', justifyContent: 'center',
  },
  manualBtn: { width: '100%' },
  manualError: {
    fontSize: 12, fontFamily: 'DMSans_400Regular', color: theme.colors.danger,
  },
});
