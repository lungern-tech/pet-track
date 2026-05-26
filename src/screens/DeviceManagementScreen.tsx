import React, { useCallback, useState } from 'react';
import {
  ActivityIndicator,
  Image,
  Pressable,
  RefreshControl,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Feather } from '@expo/vector-icons';
import { useFocusEffect, useNavigation } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import type { RootStackParamList } from '../navigation/types';
import { RootStackRoute } from '../navigation/types';
import type { DeviceRecord } from '../services/devicesApi';
import { fetchDevices } from '../services/devicesApi';
import { ApiError } from '../services/RequestManager';
import { useSettingsStore } from '../store/settingsStore';

const COLORS = {
  background: '#F5F4F1',
  surface: '#FFFFFF',
  primary: '#3D8A5A',
  text: '#1A1918',
  textSecondary: '#6D6C6A',
  divider: '#E5E4E1',
  avatarGreen: '#C8F0D8',
  avatarOrange: '#FFE5D9',
  avatarBlue: '#E5F0FF',
  dotActive: '#3D8A5A',
  danger: '#E05252',
};

const AVATAR_PALETTE = [
  { bg: COLORS.avatarGreen, icon: COLORS.primary },
  { bg: COLORS.avatarOrange, icon: '#D89575' },
  { bg: COLORS.avatarBlue, icon: COLORS.primary },
] as const;

const shadowCard = {
  shadowColor: '#1A1918',
  shadowOpacity: 0.06,
  shadowOffset: { width: 0, height: 2 },
  shadowRadius: 8,
  elevation: 2,
} as const;

type DeviceManagementNav = NativeStackNavigationProp<RootStackParamList>;

export function DeviceManagementScreen() {
  const navigation = useNavigation<DeviceManagementNav>();
  const devices = useSettingsStore((s) => s.devices);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const loadDevices = useCallback(async (isPull: boolean) => {
    if (isPull) {
      setRefreshing(true);
    } else if (useSettingsStore.getState().devices.length === 0) {
      setLoading(true);
    }
    setError(null);
    try {
      const list = await fetchDevices();
      useSettingsStore.getState().setDevicesFromServer(list);
    } catch (e) {
      const message =
        e instanceof ApiError
          ? e.message
          : e instanceof Error
            ? e.message
            : '加载失败';
      setError(message);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useFocusEffect(
    useCallback(() => {
      void loadDevices(false);
    }, [loadDevices]),
  );

  const onRefresh = useCallback(() => {
    void loadDevices(true);
  }, [loadDevices]);

  return (
    <SafeAreaView style={styles.safeArea}>
      <View style={styles.root}>
        <View style={styles.header}>
          <Pressable
            onPress={() => navigation.goBack()}
            style={styles.backButton}
            hitSlop={12}
          >
            <Feather name="chevron-left" size={24} color={COLORS.primary} />
          </Pressable>
          <Text style={styles.headerTitle}>设备管理</Text>
          <View style={styles.headerRight} />
        </View>

        <ScrollView
          style={styles.scroll}
          contentContainerStyle={styles.scrollContent}
          showsVerticalScrollIndicator={false}
          refreshControl={
            <RefreshControl
              refreshing={refreshing}
              onRefresh={onRefresh}
              tintColor={COLORS.primary}
            />
          }
        >
          <Pressable
            style={styles.addButton}
            onPress={() => navigation.navigate(RootStackRoute.PetInfoEntry)}
          >
            <Feather name="plus" size={20} color={COLORS.primary} />
            <Text style={styles.addButtonText}>添加设备</Text>
          </Pressable>

          {error ? <Text style={styles.errorText}>{error}</Text> : null}

          {loading && devices.length === 0 ? (
            <View style={styles.loadingBox}>
              <ActivityIndicator size="large" color={COLORS.primary} />
            </View>
          ) : devices.length === 0 ? (
            <View style={styles.emptyBox}>
              <Text style={styles.emptyText}>暂无设备，请点击上方添加</Text>
            </View>
          ) : (
            <View style={styles.card}>
              {devices.map((device, index) => (
                <React.Fragment key={device.id}>
                  {index > 0 ? <View style={styles.divider} /> : null}
                  <DeviceListRow device={device} index={index} />
                </React.Fragment>
              ))}
            </View>
          )}
        </ScrollView>
      </View>
    </SafeAreaView>
  );
}

function DeviceListRow({ device, index }: { device: DeviceRecord; index: number }) {
  const palette = AVATAR_PALETTE[index % AVATAR_PALETTE.length];
  const uri = device.avatarUrl?.trim();

  return (
    <Pressable style={({ pressed }) => [styles.deviceRow, pressed && styles.deviceRowPressed]}>
      <View style={[styles.deviceAvatar, { backgroundColor: palette.bg }]}>
        {uri ? (
          <Image source={{ uri }} style={styles.deviceAvatarImage} resizeMode="cover" />
        ) : (
          <Feather name="cpu" size={24} color={palette.icon} />
        )}
      </View>
      <View style={styles.deviceInfo}>
        <Text style={styles.deviceName} numberOfLines={1}>
          {device.name?.trim() || '未命名项圈'}
        </Text>
        <View style={styles.statusRow}>
          <View style={[styles.statusDot, { backgroundColor: COLORS.dotActive }]} />
          <Text style={styles.statusText}>已绑定</Text>
        </View>
      </View>
      <Feather name="chevron-right" size={20} color={COLORS.textSecondary} />
    </Pressable>
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
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 24,
    paddingTop: 16,
    paddingBottom: 20,
  },
  backButton: {
    padding: 4,
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: '600',
    color: COLORS.text,
  },
  headerRight: {
    width: 32,
  },
  scroll: {
    flex: 1,
  },
  scrollContent: {
    paddingHorizontal: 24,
    paddingBottom: 24,
    paddingTop: 0,
    gap: 16,
  },
  addButton: {
    height: 56,
    borderRadius: 16,
    backgroundColor: COLORS.surface,
    borderWidth: 1,
    borderColor: COLORS.divider,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    ...shadowCard,
  },
  addButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: COLORS.primary,
  },
  errorText: {
    fontSize: 13,
    color: COLORS.danger,
    textAlign: 'center',
  },
  loadingBox: {
    paddingVertical: 48,
    alignItems: 'center',
  },
  emptyBox: {
    paddingVertical: 32,
    paddingHorizontal: 16,
    alignItems: 'center',
  },
  emptyText: {
    fontSize: 14,
    color: COLORS.textSecondary,
    textAlign: 'center',
  },
  card: {
    borderRadius: 16,
    backgroundColor: COLORS.surface,
    overflow: 'hidden',
    ...shadowCard,
  },
  deviceRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 20,
    gap: 12,
  },
  deviceRowPressed: {
    opacity: 0.92,
  },
  deviceAvatar: {
    width: 40,
    height: 40,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
    overflow: 'hidden',
  },
  deviceAvatarImage: {
    width: '100%',
    height: '100%',
  },
  deviceInfo: {
    flex: 1,
    gap: 4,
  },
  deviceName: {
    fontSize: 16,
    fontWeight: '600',
    color: COLORS.text,
  },
  statusRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  statusDot: {
    width: 8,
    height: 8,
    borderRadius: 999,
  },
  statusText: {
    fontSize: 13,
    color: COLORS.textSecondary,
  },
  divider: {
    height: 1,
    backgroundColor: COLORS.divider,
  },
});
