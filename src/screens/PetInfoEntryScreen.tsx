import React, { useMemo, useState } from 'react';
import {
  FlatList,
  Image,
  Modal,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Feather } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import DateTimePicker, { type DateTimePickerEvent } from '@react-native-community/datetimepicker';
import type { RootStackParamList } from '../navigation/types';
import { RootStackRoute } from '../navigation/types';
import { useSettingsStore } from '../store/settingsStore';
import { pickAndUploadDeviceAvatar } from '../utils/pickAndUploadDeviceAvatar';

type PetInfoNav = NativeStackNavigationProp<RootStackParamList>;

type Gender = 'male' | 'female';

const COLORS = {
  background: '#F5F4F1',
  surface: '#FFFFFF',
  primary: '#3D8A5A',
  primarySoft: '#C8F0D8',
  text: '#1A1918',
  textSecondary: '#6D6C6A',
  textMuted: '#9C9B99',
  border: '#E5E4E1',
  danger: '#E05252',
};

export function PetInfoEntryScreen() {
  const navigation = useNavigation<PetInfoNav>();
  const draft = useSettingsStore((s) => s.petOnboardingDraft);
  const deviceAvatarUrl = useSettingsStore((s) => s.deviceAvatarUrl);
  const setPetOnboardingDraft = useSettingsStore((s) => s.setPetOnboardingDraft);
  // primaryPet 由 /pets 接口返回写入（设备匹配完成后提交）

  const [petType, setPetType] = useState(draft?.petType ?? '');
  const [petName, setPetName] = useState(draft?.petName ?? '');
  const [breed, setBreed] = useState(draft?.breed ?? '');
  const [gender, setGender] = useState<Gender>(draft?.gender ?? 'male');
  const [birthday, setBirthday] = useState(draft?.birthday ?? '');
  const [weight, setWeight] = useState(draft?.weight ?? '');
  const [error, setError] = useState<string | null>(null);
  const [uploading, setUploading] = useState(false);
  const [petTypeOpen, setPetTypeOpen] = useState(false);
  const [breedOpen, setBreedOpen] = useState(false);
  const [birthdayOpen, setBirthdayOpen] = useState(false);

  const birthdayDate = useMemo(() => {
    const trimmed = birthday.trim();
    if (!trimmed) return null;
    const d = new Date(trimmed);
    return Number.isNaN(d.getTime()) ? null : d;
  }, [birthday]);

  const formatYmd = (d: Date) => {
    const y = d.getFullYear();
    const m = String(d.getMonth() + 1).padStart(2, '0');
    const day = String(d.getDate()).padStart(2, '0');
    return `${y}-${m}-${day}`;
  };

  const onContinue = () => {
    const trimmed = petName.trim();
    if (!trimmed) {
      setError('请输入宠物名称');
      return;
    }
    setError(null);
    const nextDraft = {
      petType: petType.trim(),
      petName: trimmed,
      breed: breed.trim(),
      gender,
      birthday: birthday.trim(),
      weight: weight.trim(),
    };
    setPetOnboardingDraft(nextDraft);
    navigation.navigate(RootStackRoute.DeviceMatch);
  };

  return (
    <SafeAreaView style={styles.safeArea}>
      <View style={styles.root}>
        <View style={styles.header}>
          <Pressable onPress={() => navigation.goBack()} style={styles.backButton} hitSlop={12}>
            <Feather name="chevron-left" size={24} color={COLORS.primary} />
          </Pressable>
          <Text style={styles.headerTitle}>添加宠物</Text>
          <View style={styles.headerRight} />
        </View>

        <ScrollView
          style={styles.scroll}
          contentContainerStyle={styles.scrollContent}
          showsVerticalScrollIndicator={false}
        >
          <View style={styles.group}>
            <Text style={styles.label}>宠物头像</Text>
            <Pressable
              style={({ pressed }) => [styles.avatarCircle, pressed && styles.avatarPressed]}
              onPress={async () => {
                setUploading(true);
                try {
                  await pickAndUploadDeviceAvatar();
                } finally {
                  setUploading(false);
                }
              }}
            >
              {deviceAvatarUrl ? (
                <Image source={{ uri: deviceAvatarUrl }} style={styles.avatarImage} resizeMode="cover" />
              ) : (
                <>
                  <Feather name="camera" size={28} color={COLORS.primary} />
                  <Text style={styles.uploadText}>{uploading ? '上传中...' : '上传照片'}</Text>
                </>
              )}
            </Pressable>
          </View>

          <View style={styles.group}>
            <Text style={styles.label}>宠物名称</Text>
            <TextInput
              style={styles.input}
              placeholder="例如：小白"
              placeholderTextColor={COLORS.textMuted}
              value={petName}
              onChangeText={(v) => {
                setPetName(v);
                setError(null);
              }}
            />
          </View>

          <View style={styles.group}>
            <Text style={styles.label}>宠物类型</Text>
            <SelectDropdown
              value={petType}
              placeholder="选择类型"
              open={petTypeOpen}
              options={PET_TYPE_OPTIONS}
              onOpenChange={setPetTypeOpen}
              onSelect={(v) => {
                setPetType(v);
                setError(null);
              }}
            />
          </View>

          <View style={styles.group}>
            <Text style={styles.label}>品种</Text>
            <SelectDropdown
              value={breed}
              placeholder="选择品种"
              open={breedOpen}
              options={BREED_OPTIONS}
              onOpenChange={setBreedOpen}
              onSelect={(v) => {
                setBreed(v);
                setError(null);
              }}
            />
          </View>

          <View style={styles.row2}>
            <View style={styles.col}>
              <Text style={styles.label}>性别</Text>
              <View style={styles.genderRow}>
                <Pressable
                  style={[styles.genderBtn, gender === 'male' && styles.genderBtnActive]}
                  onPress={() => setGender('male')}
                >
                  <Text style={[styles.genderText, gender === 'male' && styles.genderTextActive]}>公</Text>
                </Pressable>
                <Pressable
                  style={[styles.genderBtn, gender === 'female' && styles.genderBtnActive]}
                  onPress={() => setGender('female')}
                >
                  <Text style={[styles.genderText, gender === 'female' && styles.genderTextActive]}>母</Text>
                </Pressable>
              </View>
            </View>
            <View style={styles.col}>
              <Text style={styles.label}>生日</Text>
              <Pressable
                style={styles.selectRow}
                onPress={() => setBirthdayOpen(true)}
                accessibilityRole="button"
                accessibilityLabel="选择生日"
              >
                <Text
                  style={[
                    styles.selectText,
                    !birthday.trim() && styles.selectTextPlaceholder,
                  ]}
                  numberOfLines={1}
                >
                  {birthday.trim() ? birthday.trim() : '选择日期'}
                </Text>
                <Feather
                  name="calendar"
                  size={18}
                  color={birthday.trim() ? COLORS.textSecondary : COLORS.textMuted}
                />
              </Pressable>
            </View>
          </View>

          <View style={styles.group}>
            <Text style={styles.label}>体重</Text>
            <TextInput
              style={styles.input}
              placeholder="例如：6.8kg"
              placeholderTextColor={COLORS.textMuted}
              value={weight}
              onChangeText={setWeight}
            />
          </View>

          {error ? <Text style={styles.error}>{error}</Text> : null}

          <Pressable style={({ pressed }) => [styles.primaryButton, pressed && styles.primaryButtonPressed]} onPress={onContinue}>
            <Text style={styles.primaryText}>下一步</Text>
          </Pressable>
        </ScrollView>

        {birthdayOpen ? (
          <View style={styles.pickerOverlay}>
            <Pressable
              style={styles.modalBackdrop}
              onPress={() => setBirthdayOpen(false)}
            />
            <View style={styles.pickerSheet}>
              <View style={styles.pickerHeader}>
                <Pressable onPress={() => setBirthdayOpen(false)} hitSlop={12}>
                  <Text style={styles.pickerAction}>取消</Text>
                </Pressable>
                <Text style={styles.pickerTitle}>选择生日</Text>
                <Pressable onPress={() => setBirthdayOpen(false)} hitSlop={12}>
                  <Text style={styles.pickerAction}>完成</Text>
                </Pressable>
              </View>
              <DateTimePicker
                mode="date"
                value={birthdayDate ?? new Date(2020, 0, 1)}
                maximumDate={new Date()}
                display="spinner"
                onChange={(e: DateTimePickerEvent, date?: Date) => {
                  if (e.type === 'dismissed') return;
                  if (date) {
                    setBirthday(formatYmd(date));
                  }
                }}
              />
            </View>
          </View>
        ) : null}
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: { flex: 1, backgroundColor: COLORS.background },
  root: { flex: 1, backgroundColor: COLORS.background },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 24,
    paddingTop: 16,
    paddingBottom: 20,
  },
  backButton: { padding: 4 },
  headerTitle: { fontSize: 20, fontWeight: '600', color: COLORS.text },
  headerRight: { width: 24 },
  scroll: { flex: 1 },
  scrollContent: { paddingHorizontal: 24, paddingBottom: 24, gap: 14 },
  group: { gap: 8 },
  label: { fontSize: 15, fontWeight: '600', color: COLORS.text },
  avatarCircle: {
    width: 96,
    height: 96,
    borderRadius: 100,
    backgroundColor: COLORS.primarySoft,
    alignItems: 'center',
    justifyContent: 'center',
    overflow: 'hidden',
    gap: 4,
  },
  avatarPressed: { opacity: 0.88 },
  avatarImage: { width: '100%', height: '100%' },
  uploadText: { fontSize: 12, fontWeight: '600', color: COLORS.primary },
  input: {
    height: 48,
    borderRadius: 12,
    backgroundColor: COLORS.background,
    borderWidth: 1,
    borderColor: COLORS.border,
    paddingHorizontal: 16,
    fontSize: 14,
    color: COLORS.text,
  },
  row2: { flexDirection: 'row', gap: 12 },
  col: { flex: 1, gap: 8 },
  genderRow: { flexDirection: 'row', gap: 8 },
  genderBtn: {
    flex: 1,
    height: 48,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: COLORS.border,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: COLORS.background,
  },
  genderBtnActive: { borderColor: COLORS.primary, backgroundColor: COLORS.primarySoft },
  genderText: { color: COLORS.textSecondary, fontSize: 14, fontWeight: '600' },
  genderTextActive: { color: COLORS.primary },
  error: { color: COLORS.danger, fontSize: 13, textAlign: 'center' },
  primaryButton: {
    marginTop: 6,
    height: 52,
    borderRadius: 12,
    backgroundColor: COLORS.primary,
    alignItems: 'center',
    justifyContent: 'center',
  },
  primaryButtonPressed: { opacity: 0.9 },
  primaryText: { color: '#FFFFFF', fontSize: 16, fontWeight: '600' },
  selectRow: {
    height: 48,
    borderRadius: 12,
    backgroundColor: COLORS.background,
    borderWidth: 1,
    borderColor: COLORS.border,
    paddingHorizontal: 16,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 12,
  },
  selectText: {
    flex: 1,
    fontSize: 14,
    color: COLORS.text,
    fontWeight: '600',
  },
  selectTextPlaceholder: {
    color: COLORS.textMuted,
    fontWeight: '500',
  },
  modalBackdrop: {
    flex: 1,
    backgroundColor: '#00000055',
  },
  pickerOverlay: {
    ...StyleSheet.absoluteFillObject,
    justifyContent: 'flex-end',
  },
  pickerSheet: {
    backgroundColor: COLORS.background,
    borderTopLeftRadius: 16,
    borderTopRightRadius: 16,
    paddingBottom: 16,
  },
  pickerHeader: {
    paddingHorizontal: 16,
    paddingTop: 12,
    paddingBottom: 10,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  pickerAction: {
    fontSize: 14,
    fontWeight: '600',
    color: COLORS.primary,
  },
  pickerTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: COLORS.textSecondary,
  },
  modalSheet: {
    position: 'absolute',
    left: 0,
    right: 0,
    bottom: 0,
    borderTopLeftRadius: 16,
    borderTopRightRadius: 16,
    backgroundColor: COLORS.background,
    paddingTop: 12,
    paddingBottom: 12,
    paddingHorizontal: 16,
    gap: 8,
  },
  optionRow: {
    height: 48,
    borderRadius: 12,
    backgroundColor: COLORS.surface,
    borderWidth: 1,
    borderColor: COLORS.border,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 14,
  },
  optionRowSelected: {
    borderColor: COLORS.primary,
    backgroundColor: COLORS.primarySoft,
  },
  optionText: {
    fontSize: 14,
    fontWeight: '600',
    color: COLORS.text,
  },
});

const PET_TYPE_OPTIONS = ['猫', '狗', '其他'] as const;
const BREED_OPTIONS = [
  '英短',
  '美短',
  '泰迪',
  '金毛',
  '柴犬',
  '其他',
] as const;

function SelectDropdown(props: {
  value: string;
  placeholder: string;
  options: readonly string[];
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSelect: (value: string) => void;
}) {
  const { value, placeholder, options, open, onOpenChange, onSelect } = props;
  const selectedText = value.trim();

  return (
    <>
      <Pressable
        style={styles.selectRow}
        onPress={() => onOpenChange(true)}
        accessibilityRole="button"
        accessibilityLabel={placeholder}
      >
        <Text
          style={[
            styles.selectText,
            !selectedText && styles.selectTextPlaceholder,
          ]}
          numberOfLines={1}
        >
          {selectedText || placeholder}
        </Text>
        <Feather
          name="chevron-down"
          size={18}
          color={selectedText ? COLORS.textSecondary : COLORS.textMuted}
        />
      </Pressable>

      <Modal
        visible={open}
        transparent
        animationType="fade"
        onRequestClose={() => onOpenChange(false)}
      >
        <Pressable
          style={styles.modalBackdrop}
          onPress={() => onOpenChange(false)}
        >
          <View style={styles.modalSheet}>
            <Text
              style={{
                fontSize: 13,
                fontWeight: '600',
                color: COLORS.textSecondary,
                marginBottom: 4,
              }}
            >
              请选择
            </Text>
            <FlatList
              data={[...options]}
              keyExtractor={(item) => item}
              ItemSeparatorComponent={() => <View style={{ height: 8 }} />}
              renderItem={({ item }) => {
                const isSelected = item === selectedText;
                return (
                  <Pressable
                    style={[
                      styles.optionRow,
                      isSelected && styles.optionRowSelected,
                    ]}
                    onPress={() => {
                      onSelect(item);
                      onOpenChange(false);
                    }}
                  >
                    <Text style={styles.optionText}>{item}</Text>
                  </Pressable>
                );
              }}
            />
          </View>
        </Pressable>
      </Modal>
    </>
  );
}
