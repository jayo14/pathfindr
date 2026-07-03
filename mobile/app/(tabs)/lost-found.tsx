import { Image } from 'expo-image';
import * as ImagePicker from 'expo-image-picker';
import {
  Image as ImageIcon,
  MapPin,
  Package,
  Plus,
  Search,
  X,
  Clock,
  Phone
} from 'lucide-react-native';
import { useState, useMemo } from 'react';
import {
  FlatList,
  Modal,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
  Alert,
  ActivityIndicator,
} from 'react-native';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';

import { StateCard } from '@/components/StateCard';
import { theme } from '@/constants/theme';
import { useLostAndFound } from '@/hooks/useCampusData';
import { submitLostAndFoundReport } from '@/services/campus-service';
import { LostItemReport } from '@/types/domain';
import { timeAgo } from '@/utils/time';

export default function LostFoundScreen() {
  const { reports: initialReports, isLoading, refetch } = useLostAndFound();
  const [localReports, setLocalReports] = useState<LostItemReport[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [isModalVisible, setIsModalVisible] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const insets = useSafeAreaInsets();

  const [form, setForm] = useState({
    title: '',
    status: 'lost' as 'lost' | 'found',
    locationName: '',
    description: '',
    contactHint: '',
    image: null as string | null,
  });

  const [errors, setErrors] = useState<Record<string, string>>({});

  const allReports = useMemo(() => {
    const combined = [...localReports, ...initialReports];
    return combined.filter((item, index, self) =>
      index === self.findIndex((t) => t.id === item.id)
    );
  }, [localReports, initialReports]);

  const filteredReports = useMemo(() => {
    return allReports.filter(report =>
      report.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      report.locationName.toLowerCase().includes(searchQuery.toLowerCase())
    );
  }, [allReports, searchQuery]);

  const handlePickImage = async () => {
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ['images'],
      allowsEditing: true,
      aspect: [4, 3],
      quality: 0.7,
    });
    if (!result.canceled) {
      setForm({ ...form, image: result.assets[0].uri });
    }
  };

  const validate = () => {
    const newErrors: Record<string, string> = {};
    if (!form.title.trim()) newErrors.title = 'Title is required';
    if (!form.locationName.trim()) newErrors.locationName = 'Location is required';
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async () => {
    if (!validate()) return;
    setIsSubmitting(true);
    try {
      const payload: Partial<LostItemReport> = {
        title: form.title,
        status: form.status,
        locationName: form.locationName,
        description: form.description,
        contactHint: form.contactHint,
        imageUrl: form.image ? 'https://via.placeholder.com/400' : undefined,
        reportedAt: new Date().toISOString(),
      };
      const result = await submitLostAndFoundReport(payload);
      setLocalReports([result, ...localReports]);
      setIsModalVisible(false);
      setForm({ title: '', status: 'lost', locationName: '', description: '', contactHint: '', image: null });
      Alert.alert('Success', 'Report submitted!');
    } catch {
      Alert.alert('Error', 'Failed to submit report. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  // FAB floats above the tab bar, which itself sits above the home indicator.
  // Tab bar visual base = 56 px; add the bottom inset for the home indicator.
  const fabBottom = 56 + insets.bottom + 16;

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <View style={styles.header}>
        <Text style={styles.title}>Lost & Found</Text>
        <Text style={styles.subtitle}>Help your fellow students find their belongings.</Text>
      </View>

      <View style={styles.searchContainer}>
        <View style={styles.searchBar}>
          <Search size={20} color={theme.colors.textMuted} />
          <TextInput
            placeholder="Search items..."
            style={styles.searchInput}
            value={searchQuery}
            onChangeText={setSearchQuery}
          />
        </View>
      </View>

      {isLoading && allReports.length === 0 ? (
        <View style={styles.centered}>
          <ActivityIndicator color={theme.colors.primary} size="large" />
        </View>
      ) : filteredReports.length === 0 ? (
        <View style={styles.centered}>
          <StateCard title="No reports yet" description="Be the first to help someone find their belongings." />
        </View>
      ) : (
        <FlatList
          data={filteredReports}
          keyExtractor={item => item.id}
          // Extra bottom padding so the last card is never hidden behind the FAB or tab bar
          contentContainerStyle={[styles.list, { paddingBottom: fabBottom + 16 }]}
          renderItem={({ item }) => (
            <View style={styles.itemCard}>
              <View style={styles.itemInfo}>
                <View style={[styles.statusBadge, { backgroundColor: item.status === 'lost' ? '#FEE2E2' : '#DCFCE7' }]}>
                  <Text style={[styles.statusText, { color: item.status === 'lost' ? '#EF4444' : '#22C55E' }]}>
                    {item.status.toUpperCase()}
                  </Text>
                </View>
                <Text style={styles.itemTitle}>{item.title}</Text>
                <View style={styles.metaRow}>
                  <MapPin size={14} color={theme.colors.textMuted} />
                  <Text style={styles.metaText}>{item.locationName}</Text>
                </View>
                <View style={styles.metaRow}>
                  <Clock size={14} color={theme.colors.textMuted} />
                  <Text style={styles.metaText}>{timeAgo(item.reportedAt)}</Text>
                </View>
                {item.contactHint ? (
                  <View style={styles.metaRow}>
                    <Phone size={14} color={theme.colors.textMuted} />
                    <Text style={styles.metaText} numberOfLines={1}>{item.contactHint}</Text>
                  </View>
                ) : null}
              </View>
              {item.imageUrl ? (
                <Image source={{ uri: item.imageUrl }} style={styles.itemImage} contentFit="cover" />
              ) : (
                <View style={styles.placeholderImage}>
                  <Package size={24} color={theme.colors.border} />
                </View>
              )}
            </View>
          )}
          onRefresh={refetch}
          refreshing={isLoading}
        />
      )}

      {/* FAB positioned above the tab bar + home indicator */}
      <Pressable style={[styles.fab, { bottom: fabBottom }]} onPress={() => setIsModalVisible(true)}>
        <Plus color="white" size={28} />
      </Pressable>

      <Modal visible={isModalVisible} animationType="slide" presentationStyle="pageSheet">
        {/* Only protect top — the sheet itself extends to device bottom */}
        <SafeAreaView style={styles.modalContainer} edges={['top']}>
          <View style={styles.modalHeader}>
            <Text style={styles.modalTitle}>Report Item</Text>
            <Pressable onPress={() => setIsModalVisible(false)}>
              <X color={theme.colors.text} size={24} />
            </Pressable>
          </View>

          <ScrollView style={styles.modalContent} keyboardShouldPersistTaps="handled">
            <View style={styles.toggleRow}>
              <Pressable
                style={[styles.toggleBtn, form.status === 'lost' && styles.toggleBtnActive]}
                onPress={() => setForm({ ...form, status: 'lost' })}
              >
                <Text style={[styles.toggleText, form.status === 'lost' && styles.toggleTextActive]}>Lost</Text>
              </Pressable>
              <Pressable
                style={[styles.toggleBtn, form.status === 'found' && styles.toggleBtnActive]}
                onPress={() => setForm({ ...form, status: 'found' })}
              >
                <Text style={[styles.toggleText, form.status === 'found' && styles.toggleTextActive]}>Found</Text>
              </Pressable>
            </View>

            <View style={styles.inputGroup}>
              <Text style={styles.label}>Item Title *</Text>
              <TextInput
                style={[styles.modalInput, errors.title && styles.inputError]}
                placeholder="e.g. Black Lenovo Backpack"
                value={form.title}
                onChangeText={text => setForm({ ...form, title: text })}
              />
              {errors.title ? <Text style={styles.errorText}>{errors.title}</Text> : null}
            </View>

            <View style={styles.inputGroup}>
              <Text style={styles.label}>Location *</Text>
              <TextInput
                style={[styles.modalInput, errors.locationName && styles.inputError]}
                placeholder="e.g. Near Library Block"
                value={form.locationName}
                onChangeText={text => setForm({ ...form, locationName: text })}
              />
              {errors.locationName ? <Text style={styles.errorText}>{errors.locationName}</Text> : null}
            </View>

            <View style={styles.inputGroup}>
              <Text style={styles.label}>Description</Text>
              <TextInput
                style={[styles.modalInput, styles.multilineInput]}
                placeholder="Describe the item..."
                multiline
                numberOfLines={4}
                value={form.description}
                onChangeText={text => setForm({ ...form, description: text })}
              />
            </View>

            <View style={styles.inputGroup}>
              <Text style={styles.label}>Contact Info</Text>
              <TextInput
                style={styles.modalInput}
                placeholder="e.g. WhatsApp +234..."
                value={form.contactHint}
                onChangeText={text => setForm({ ...form, contactHint: text })}
              />
            </View>

            <View style={styles.inputGroup}>
              <Text style={styles.label}>Photo</Text>
              <View style={styles.photoActions}>
                <Pressable style={styles.photoBtn} onPress={handlePickImage}>
                  <ImageIcon size={20} color={theme.colors.primary} />
                  <Text style={styles.photoBtnText}>Pick from Gallery</Text>
                </Pressable>
              </View>
              {form.image ? (
                <View style={styles.previewContainer}>
                  <Image source={{ uri: form.image }} style={styles.previewImage} />
                  <Pressable style={styles.removePhoto} onPress={() => setForm({ ...form, image: null })}>
                    <X size={16} color="white" />
                  </Pressable>
                </View>
              ) : null}
            </View>

            <Pressable
              style={[styles.submitBtn, isSubmitting && styles.submitBtnDisabled]}
              onPress={handleSubmit}
              disabled={isSubmitting}
            >
              {isSubmitting ? (
                <ActivityIndicator color="white" />
              ) : (
                <Text style={styles.submitBtnText}>Submit Report</Text>
              )}
            </Pressable>
          </ScrollView>
        </SafeAreaView>
      </Modal>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: theme.colors.background },
  header: { padding: 24, backgroundColor: theme.colors.surface },
  title: { fontSize: 28, fontFamily: 'Poppins_800ExtraBold', color: theme.colors.text },
  subtitle: { fontSize: 14, fontFamily: 'DMSans_400Regular', color: theme.colors.textMuted, marginTop: 4 },
  searchContainer: { padding: 16, backgroundColor: theme.colors.surface, borderBottomWidth: 1, borderBottomColor: '#F1F5F9' },
  searchBar: { flexDirection: 'row', alignItems: 'center', gap: 12, backgroundColor: '#F1F5F9', borderRadius: 12, paddingHorizontal: 16, height: 48 },
  searchInput: { flex: 1, fontFamily: 'DMSans_400Regular', fontSize: 15 },
  list: { padding: 16, gap: 12 },
  centered: { flex: 1, justifyContent: 'center', alignItems: 'center', padding: 20 },
  itemCard: { flexDirection: 'row', backgroundColor: theme.colors.surface, borderRadius: 20, padding: 14, gap: 14, ...theme.shadow, elevation: 2 },
  itemInfo: { flex: 1 },
  statusBadge: { alignSelf: 'flex-start', paddingHorizontal: 10, paddingVertical: 4, borderRadius: 8, marginBottom: 8 },
  statusText: { fontSize: 11, fontFamily: 'Poppins_700Bold' },
  itemTitle: { fontSize: 17, fontFamily: 'Poppins_700Bold', color: theme.colors.text, marginBottom: 6 },
  metaRow: { flexDirection: 'row', alignItems: 'center', gap: 6, marginBottom: 4 },
  metaText: { fontSize: 13, color: theme.colors.textMuted, fontFamily: 'DMSans_400Regular' },
  itemImage: { width: 90, height: 90, borderRadius: 16 },
  placeholderImage: { width: 90, height: 90, borderRadius: 16, backgroundColor: theme.colors.surfaceAlt, alignItems: 'center', justifyContent: 'center' },
  fab: { position: 'absolute', right: 24, width: 64, height: 64, borderRadius: 32, backgroundColor: theme.colors.primary, alignItems: 'center', justifyContent: 'center', ...theme.shadow, elevation: 8 },
  modalContainer: { flex: 1, backgroundColor: theme.colors.surface },
  modalHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', padding: 24, borderBottomWidth: 1, borderBottomColor: '#F1F5F9' },
  modalTitle: { fontSize: 22, fontFamily: 'Poppins_800ExtraBold' },
  modalContent: { padding: 24 },
  toggleRow: { flexDirection: 'row', gap: 12, marginBottom: 24 },
  toggleBtn: { flex: 1, height: 48, borderRadius: 14, borderWidth: 1, borderColor: theme.colors.border, alignItems: 'center', justifyContent: 'center', backgroundColor: theme.colors.surface },
  toggleBtnActive: { backgroundColor: theme.colors.primary, borderColor: theme.colors.primary },
  toggleText: { fontSize: 15, fontFamily: 'Poppins_700Bold', color: theme.colors.textMuted },
  toggleTextActive: { color: 'white' },
  inputGroup: { marginBottom: 24 },
  label: { fontSize: 15, fontFamily: 'Poppins_700Bold', color: theme.colors.text, marginBottom: 8 },
  modalInput: { height: 56, backgroundColor: theme.colors.surface, borderWidth: 1, borderColor: theme.colors.border, borderRadius: 16, paddingHorizontal: 16, fontSize: 16, fontFamily: 'DMSans_400Regular' },
  multilineInput: { height: 100, paddingTop: 16, textAlignVertical: 'top' },
  inputError: { borderColor: '#EF4444' },
  errorText: { color: '#EF4444', fontSize: 12, marginTop: 4, fontFamily: 'DMSans_400Regular' },
  photoActions: { flexDirection: 'row', gap: 12, marginBottom: 12 },
  photoBtn: { flex: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8, height: 50, borderRadius: 14, borderWidth: 1, borderColor: theme.colors.primary, borderStyle: 'dashed' },
  photoBtnText: { color: theme.colors.primary, fontFamily: 'Poppins_700Bold', fontSize: 14 },
  previewContainer: { position: 'relative', marginTop: 12 },
  previewImage: { width: '100%', height: 200, borderRadius: 16 },
  removePhoto: { position: 'absolute', top: 8, right: 8, width: 32, height: 32, borderRadius: 16, backgroundColor: 'rgba(0,0,0,0.5)', alignItems: 'center', justifyContent: 'center' },
  submitBtn: { backgroundColor: theme.colors.primary, height: 58, borderRadius: 18, alignItems: 'center', justifyContent: 'center', marginTop: 12, marginBottom: 40, ...theme.shadow },
  submitBtnDisabled: { opacity: 0.7 },
  submitBtnText: { color: 'white', fontSize: 16, fontFamily: 'Poppins_700Bold' },
});
