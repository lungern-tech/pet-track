import React, { useCallback, useEffect, useRef, useState } from 'react';
import {
  ActivityIndicator,
  FlatList,
  ScrollView,
  StyleSheet,
  Text,
  View,
  Pressable,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Feather } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { State } from 'react-native-ble-plx';
import type { RootStackParamList } from '../navigation/types';
import { RootStackRoute } from '../navigation/types';
import { useSettingsStore } from '../store/settingsStore';
import {
  type BleDeviceInfo,
  connectToDevice,
  disconnectDevice,
  observeBluetoothState,
  requestPermissions,
  startScan,
  stopScan,
} from '../services/BleService';

const COLORS = {
  background: '#F5F4F1',
  surface: '#FFFFFF',
  primary: '#3D8A5A',
  text: '#1A1918',
  textSecondary: '#6D6C6A',
};

type DeviceMatchNav = NativeStackNavigationProp<RootStackParamList>;

export function DeviceMatchScreen() {
  const navigation = useNavigation<DeviceMatchNav>();
  const petDraft = useSettingsStore((s) => s.petOnboardingDraft);
  const [btOn, setBtOn] = useState(false);
  const [scanning, setScanning] = useState(false);
  const [devices, setDevices] = useState<BleDeviceInfo[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [connectingId, setConnectingId] = useState<string | null>(null);
  const scanTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    const unsubscribe = observeBluetoothState((state) => {
      setBtOn(state === State.PoweredOn);
    });
    return unsubscribe;
  }, []);

  useEffect(() => {
    return () => {
      if (scanTimerRef.current) clearTimeout(scanTimerRef.current);
      stopScan();
    };
  }, []);

  const handleStop = useCallback(async () => {
    if (scanTimerRef.current) clearTimeout(scanTimerRef.current);
    scanTimerRef.current = null;
    stopScan();
    setScanning(false);
    setDevices([]);
    setError(null);
    if (connectingId) {
      try {
        await disconnectDevice(connectingId);
      } catch {
        // ignore
      } finally {
        setConnectingId(null);
      }
    }
  }, [connectingId]);

  const handleStart = useCallback(async () => {
    setError(null);
    setDevices([]);

    if (!btOn) {
      setError('请先开启手机蓝牙');
      return;
    }

    const granted = await requestPermissions();
    if (!granted) {
      setError('蓝牙权限被拒绝，请在系统设置中授权');
      return;
    }

    setScanning(true);
    startScan(
      (device) => {
        setDevices((prev) => {
          if (prev.some((d) => d.id === device.id)) return prev;
          return [...prev, device];
        });
      },
      (err) => {
        setError(err.message);
        setScanning(false);
      },
    );

    if (scanTimerRef.current) clearTimeout(scanTimerRef.current);
    scanTimerRef.current = setTimeout(() => {
      stopScan();
      setScanning(false);
      scanTimerRef.current = null;
    }, 15000);
  }, [btOn]);

  const handleConnect = useCallback(
    async (device: BleDeviceInfo) => {
      stopScan();
      setScanning(false);
      setConnectingId(device.id);
      setError(null);
      try {
        await connectToDevice(device.id);
        setConnectingId(null);
        navigation.navigate(RootStackRoute.DeviceMatchSuccess, {
          deviceId: device.id,
          petName: petDraft?.petName,
        });
      } catch (err: any) {
        setConnectingId(null);
        setError(`连接失败: ${err?.message ?? '未知错误'}`);
      }
    },
    [navigation, petDraft?.petName],
  );

  const renderDevice = useCallback(
    ({ item }: { item: BleDeviceInfo }) => {
      const isConnecting = connectingId === item.id;
      return (
        <Pressable
          style={({ pressed }) => [
            styles.deviceRow,
            pressed && styles.deviceRowPressed,
          ]}
          onPress={() => handleConnect(item)}
          disabled={!!connectingId}
        >
          <View style={styles.deviceIconWrap}>
            <Feather name="radio" size={20} color={COLORS.primary} />
          </View>
          <View style={styles.deviceInfo}>
            <Text style={styles.deviceName}>{item.name}</Text>
            <Text style={styles.deviceId}>{item.id}</Text>
          </View>
          {isConnecting ? (
            <ActivityIndicator size="small" color={COLORS.primary} />
          ) : (
            <Text style={styles.rssiText}>{item.rssi}</Text>
          )}
        </Pressable>
      );
    },
    [connectingId, handleConnect],
  );

  return (
    <SafeAreaView style={styles.safeArea}>
      <View style={styles.root}>
        <View style={styles.header}>
          <Pressable
            onPress={() => navigation.goBack()}
            style={styles.backButton}
            hitSlop={12}
          >
            <Feather name="chevron-left" size={24} color={COLORS.text} />
          </Pressable>
          <Text style={styles.headerTitle}>设备匹配</Text>
          <View style={styles.headerRight} />
        </View>

        <ScrollView
          style={styles.scroll}
          contentContainerStyle={styles.scrollContent}
          showsVerticalScrollIndicator={false}
        >
          <View style={styles.card}>
            <Text style={styles.title}>准备搜索设备</Text>
            <Text style={styles.subtitle}>请确保：</Text>

            <View style={styles.steps}>
              <StepItem index={1} text="打开宠物项圈的电源开关" />
              <StepItem index={2} text="确保手机蓝牙已开启" />
              <StepItem index={3} text="将设备靠近手机（距离小于 1 米）" />
            </View>

            {error ? <Text style={styles.errorText}>{error}</Text> : null}

            <Pressable
              style={({ pressed }) => [
                scanning || connectingId
                  ? styles.secondaryButtonFull
                  : styles.primaryButtonFull,
                pressed && styles.primaryButtonPressed,
              ]}
              onPress={scanning || connectingId ? handleStop : handleStart}
              disabled={!!connectingId}
            >
              <Text
                style={
                  scanning || connectingId ? styles.secondaryText : styles.primaryText
                }
              >
                {scanning || connectingId ? '取消' : '开始'}
              </Text>
            </Pressable>
          </View>

          {scanning || devices.length > 0 ? (
            <View style={styles.listCard}>
              <View style={styles.listHeader}>
                <Text style={styles.listTitle}>
                  {scanning ? '正在搜索设备…' : `发现 ${devices.length} 个设备`}
                </Text>
                {scanning ? (
                  <ActivityIndicator size="small" color={COLORS.primary} />
                ) : null}
              </View>
              <FlatList
                data={devices}
                keyExtractor={(item) => item.id}
                renderItem={renderDevice}
                scrollEnabled={false}
                contentContainerStyle={devices.length === 0 ? styles.emptyList : undefined}
                ListEmptyComponent={
                  <Text style={styles.emptyText}>请将项圈靠近手机，等待设备出现</Text>
                }
                ItemSeparatorComponent={() => <View style={styles.separator} />}
              />
            </View>
          ) : null}
        </ScrollView>
      </View>
    </SafeAreaView>
  );
}

type StepItemProps = {
  index: number;
  text: string;
};

function StepItem({ index, text }: StepItemProps) {
  return (
    <View style={styles.stepRow}>
      <View style={styles.stepIcon}>
        <Text style={styles.stepIconText}>{index}</Text>
      </View>
      <Text style={styles.stepText}>{text}</Text>
    </View>
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
    paddingVertical: 16,
    paddingHorizontal: 24,
    paddingBottom: 20,
    backgroundColor: COLORS.surface,
  },
  backButton: {
    padding: 4,
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: COLORS.text,
    letterSpacing: -0.2,
  },
  headerRight: {
    width: 24,
    height: 24,
  },
  scroll: {
    flex: 1,
  },
  scrollContent: {
    paddingHorizontal: 24,
    paddingBottom: 24,
    paddingTop: 0,
  },
  card: {
    marginTop: 24,
    borderRadius: 16,
    backgroundColor: COLORS.surface,
    padding: 32,
    shadowColor: '#1A1918',
    shadowOpacity: 0.06,
    shadowOffset: { width: 0, height: 2 },
    shadowRadius: 8,
    elevation: 2,
  },
  title: {
    fontSize: 22,
    fontWeight: '600',
    color: COLORS.text,
    letterSpacing: -0.3,
    marginBottom: 8,
  },
  subtitle: {
    fontSize: 16,
    fontWeight: '600',
    color: COLORS.textSecondary,
    marginBottom: 16,
  },
  steps: {
    gap: 16,
    marginBottom: 24,
  },
  stepRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  stepIcon: {
    width: 24,
    height: 24,
    borderRadius: 12,
    backgroundColor: COLORS.primary,
    alignItems: 'center',
    justifyContent: 'center',
  },
  stepIconText: {
    fontSize: 13,
    fontWeight: '600',
    color: '#FFFFFF',
  },
  stepText: {
    flex: 1,
    fontSize: 15,
    color: COLORS.text,
  },
  statusBlock: {
    gap: 8,
    marginBottom: 24,
  },
  statusText: {
    fontSize: 14,
    fontWeight: '500',
    color: COLORS.primary,
  },
  progressTrack: {
    height: 4,
    borderRadius: 100,
    backgroundColor: '#EDECEA',
    overflow: 'hidden',
  },
  progressBar: {
    width: '60%',
    height: '100%',
    borderRadius: 100,
    backgroundColor: COLORS.primary,
  },
  errorText: {
    marginBottom: 12,
    fontSize: 13,
    color: '#C2410C',
  },
  primaryButtonFull: {
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
  secondaryButtonFull: {
    width: '100%',
    height: 52,
    borderRadius: 12,
    backgroundColor: '#EDECEA',
    alignItems: 'center',
    justifyContent: 'center',
  },
  secondaryButtonPressed: {
    opacity: 0.9,
  },
  secondaryText: {
    fontSize: 16,
    fontWeight: '600',
    color: COLORS.textSecondary,
  },
  primaryButtonPressed: {
    opacity: 0.95,
  },
  primaryText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#FFFFFF',
  },
  listCard: {
    marginTop: 16,
    borderRadius: 16,
    backgroundColor: COLORS.surface,
    padding: 16,
    shadowColor: '#1A1918',
    shadowOpacity: 0.06,
    shadowOffset: { width: 0, height: 2 },
    shadowRadius: 8,
    elevation: 2,
  },
  listHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 12,
  },
  listTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: COLORS.text,
  },
  deviceRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
    paddingHorizontal: 12,
    borderRadius: 12,
    backgroundColor: '#FAFAF9',
    gap: 12,
  },
  deviceRowPressed: {
    opacity: 0.8,
  },
  deviceIconWrap: {
    width: 40,
    height: 40,
    borderRadius: 12,
    backgroundColor: '#E6F4EC',
    alignItems: 'center',
    justifyContent: 'center',
  },
  deviceInfo: {
    flex: 1,
    gap: 2,
  },
  deviceName: {
    fontSize: 14,
    fontWeight: '600',
    color: COLORS.text,
  },
  deviceId: {
    fontSize: 11,
    color: COLORS.textSecondary,
  },
  rssiText: {
    width: 40,
    textAlign: 'right',
    fontSize: 12,
    color: COLORS.textSecondary,
  },
  separator: {
    height: 8,
  },
  emptyList: {
    paddingVertical: 8,
  },
  emptyText: {
    fontSize: 13,
    color: COLORS.textSecondary,
  },
});

