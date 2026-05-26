import React, { useState } from 'react';
import {
  ActivityIndicator,
  Image,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Feather } from '@expo/vector-icons';
import { CommonActions, useNavigation, useRoute } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import type { RouteProp } from '@react-navigation/native';
import type { RootStackParamList } from '../navigation/types';
import { MainTabRoute, RootStackRoute } from '../navigation/types';
import { ApiError } from '../services/RequestManager';
import { registerDevice } from '../services/devicesApi';
import { createPet } from '../services/petsApi';
import { useSettingsStore } from '../store/settingsStore';
import { pickAndUploadDeviceAvatar } from '../utils/pickAndUploadDeviceAvatar';

const COLORS = {
  background: '#F5F4F1',
  surface: '#FFFFFF',
  primary: '#3D8A5A',
  primarySoft: '#C8F0D8',
  text: '#1A1918',
  textSecondary: '#6D6C6A',
  border: '#D1D0CD',
};

type DeviceMatchSuccessNav = NativeStackNavigationProp<RootStackParamList>;
type DeviceMatchSuccessRoute = RouteProp<
  RootStackParamList,
  typeof RootStackRoute.DeviceMatchSuccess
>;

export function DeviceMatchSuccessScreen() {
  const navigation = useNavigation<DeviceMatchSuccessNav>();
  const route = useRoute<DeviceMatchSuccessRoute>();
  const upsertDeviceAndSelect = useSettingsStore((s) => s.upsertDeviceAndSelect);
  const upsertPetAndSelect = useSettingsStore((s) => s.upsertPetAndSelect);
  const setDeviceAvatarUrl = useSettingsStore((s) => s.setDeviceAvatarUrl);
  const clearPetOnboardingDraft = useSettingsStore((s) => s.setPetOnboardingDraft);
  const setPrimaryPet = useSettingsStore((s) => s.setPrimaryPet);
  const deviceAvatarUrl = useSettingsStore((s) => s.deviceAvatarUrl);
  const petDraft = useSettingsStore((s) => s.petOnboardingDraft);
  const [name, setName] = useState(
    route.params?.petName ?? petDraft?.petName ?? '小白',
  );
  const [avatarUploading, setAvatarUploading] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);

  const deviceId = route.params?.deviceId ?? 'collar-ble-unknown';

  return (
    <SafeAreaView style={styles.safeArea}>
      <View style={styles.root}>
        <ScrollView
          style={styles.scroll}
          contentContainerStyle={styles.scrollContent}
          showsVerticalScrollIndicator={false}
        >
          <View style={styles.iconWrapper}>
            <View style={styles.iconCircleOuter}>
              <Feather name="check" size={60} color={COLORS.primary} />
            </View>
          </View>

          <Text style={styles.title}>设备匹配成功</Text>

          <View style={styles.card}>
            <View style={styles.field}>
              <Text style={styles.fieldLabel}>宠物头像</Text>
              <Text style={styles.fieldHint}>点击更换照片</Text>
              <Pressable
                accessibilityRole="button"
                accessibilityLabel="上传宠物头像"
                disabled={avatarUploading}
                onPress={async () => {
                  setAvatarUploading(true);
                  try {
                    await pickAndUploadDeviceAvatar();
                  } finally {
                    setAvatarUploading(false);
                  }
                }}
                style={({ pressed }) => [
                  styles.avatarCircle,
                  pressed && styles.avatarCirclePressed,
                ]}
              >
                {avatarUploading ? (
                  <ActivityIndicator color={COLORS.primary} />
                ) : deviceAvatarUrl ? (
                  <Image
                    source={{ uri: deviceAvatarUrl }}
                    style={styles.avatarImage}
                    resizeMode="cover"
                  />
                ) : (
                  <Feather name="image" size={32} color={COLORS.primary} />
                )}
              </Pressable>
            </View>

            <View style={styles.field}>
              <Text style={styles.fieldLabel}>宠物名称</Text>
              <TextInput
                style={styles.input}
                placeholder="请输入宠物名称"
                placeholderTextColor={COLORS.textSecondary}
                value={name}
                onChangeText={(t) => {
                  setName(t);
                  setSubmitError(null);
                }}
              />
            </View>
          </View>

          {submitError ? <Text style={styles.submitError}>{submitError}</Text> : null}

          <Pressable
            style={({ pressed }) => [
              styles.confirmButton,
              (pressed || submitting) && styles.confirmButtonPressed,
              submitting && styles.confirmButtonDisabled,
            ]}
            disabled={submitting}
            onPress={async () => {
              const trimmed = name.trim();
              if (!trimmed) {
                setSubmitError('请输入宠物名称');
                return;
              }
              setSubmitting(true);
              setSubmitError(null);
              try {
                const record = await registerDevice({
                  deviceId,
                  name: trimmed,
                  avatarUrl: deviceAvatarUrl?.trim() ?? '',
                });
                upsertDeviceAndSelect(record);
                if (record.avatarUrl?.trim()) {
                  setDeviceAvatarUrl(record.avatarUrl.trim());
                }
                const species = petDraft?.petType?.trim() ?? '';
                const breed = petDraft?.breed?.trim() ?? '';
                const birthDate = petDraft?.birthday?.trim() ?? '';
                const gender = petDraft?.gender ?? 'male';
                const avatarUrl = deviceAvatarUrl?.trim() ?? '';
                const pet = await createPet({
                  name: trimmed,
                  linkedDeviceId: record.id,
                  species,
                  breed,
                  gender,
                  birthDate,
                  avatarUrl,
                  notes: '',
                });
                upsertPetAndSelect(pet);
                setPrimaryPet(pet);
                clearPetOnboardingDraft(null);
                navigation.dispatch(
                  CommonActions.reset({
                    index: 0,
                    routes: [
                      {
                        name: RootStackRoute.MainTabs,
                        state: {
                          routes: [{ name: MainTabRoute.Home }],
                          index: 0,
                        },
                      },
                    ],
                  }),
                );
              } catch (e) {
                const message =
                  e instanceof ApiError
                    ? e.message
                    : e instanceof Error
                      ? e.message
                      : '添加设备失败，请稍后再试';
                setSubmitError(message);
              } finally {
                setSubmitting(false);
              }
            }}
          >
            {submitting ? (
              <ActivityIndicator color="#FFFFFF" />
            ) : (
              <Text style={styles.confirmText}>完成</Text>
            )}
          </Pressable>
        </ScrollView>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: COLORS.background,
  },
  root: {
    flex: 1,
    backgroundColor: COLORS.background,
  },
  scroll: {
    flex: 1,
  },
  scrollContent: {
    paddingHorizontal: 24,
    paddingBottom: 32,
    paddingTop: 48,
    gap: 24,
    alignItems: 'center',
  },
  iconWrapper: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  iconCircleOuter: {
    width: 120,
    height: 120,
    borderRadius: 60,
    backgroundColor: COLORS.primarySoft,
    alignItems: 'center',
    justifyContent: 'center',
  },
  title: {
    fontSize: 22,
    fontWeight: '600',
    color: COLORS.text,
    letterSpacing: -0.3,
  },
  card: {
    width: '100%',
    borderRadius: 16,
    backgroundColor: COLORS.surface,
    padding: 24,
    shadowColor: '#1A1918',
    shadowOpacity: 0.06,
    shadowOffset: { width: 0, height: 2 },
    shadowRadius: 8,
    elevation: 2,
    gap: 24,
  },
  field: {
    alignItems: 'center',
    gap: 12,
  },
  fieldLabel: {
    fontSize: 14,
    fontWeight: '500',
    color: COLORS.textSecondary,
  },
  fieldHint: {
    fontSize: 12,
    color: COLORS.textSecondary,
  },
  avatarCircle: {
    width: 100,
    height: 100,
    borderRadius: 50,
    borderWidth: 2,
    borderColor: COLORS.border,
    backgroundColor: COLORS.background,
    alignItems: 'center',
    justifyContent: 'center',
    overflow: 'hidden',
  },
  avatarCirclePressed: {
    opacity: 0.85,
  },
  avatarImage: {
    width: '100%',
    height: '100%',
  },
  input: {
    width: '100%',
    height: 52,
    borderRadius: 12,
    backgroundColor: COLORS.background,
    borderWidth: 1,
    borderColor: COLORS.border,
    paddingHorizontal: 16,
    fontSize: 15,
    color: COLORS.text,
  },
  confirmButton: {
    width: '100%',
    height: 52,
    borderRadius: 12,
    backgroundColor: COLORS.primary,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: COLORS.primary,
    shadowOpacity: 0.25,
    shadowOffset: { width: 0, height: 4 },
    shadowRadius: 8,
    elevation: 4,
  },
  confirmButtonPressed: {
    opacity: 0.9,
  },
  confirmButtonDisabled: {
    opacity: 0.85,
  },
  submitError: {
    width: '100%',
    fontSize: 13,
    color: '#E05252',
    textAlign: 'center',
  },
  confirmText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#FFFFFF',
  },
});

