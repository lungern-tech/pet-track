import React, { useCallback, useEffect, useRef, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  Animated,
  Easing,
  FlatList,
  Linking,
  Platform,
  Pressable,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Feather } from '@expo/vector-icons';
import { useNavigation, useRoute } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { State } from 'react-native-ble-plx';

import type { RootStackParamList } from '../navigation/types';
import { RootStackRoute } from '../navigation/types';
import { useSettingsStore } from '../store/settingsStore';
import {
  type BleDeviceInfo,
  connectToDevice,
  observeBluetoothState,
  requestPermissions,
  startScan,
  stopScan,
} from '../services/BleService';

type Nav = NativeStackNavigationProp<RootStackParamList>;
type Route = { key: string; name: RootStackRoute.BleSearch; params?: RootStackParamList[RootStackRoute.BleSearch] };

const COLORS = {
  background: '#F5F4F1',
  surface: '#FFFFFF',
  primary: '#3D8A5A',
  primarySoft: '#C8F0D8',
  text: '#1A1918',
  textSecondary: '#6D6C6A',
  textMuted: '#9C9B99',
  textLight: '#C4C2BF',
  divider: '#F0EFED',
  danger: '#E05252',
};

const shadowCard = {
  shadowColor: '#1A1918',
  shadowOpacity: 0.03,
  shadowOffset: { width: 0, height: 2 },
  shadowRadius: 12,
  elevation: 2,
} as const;

type ScanStatus = 'idle' | 'scanning' | 'stopped';
type BtState = 'unknown' | 'on' | 'off' | 'unauthorized';

function rssiToLevel(rssi: number): number {
  if (rssi >= -50) return 4;
  if (rssi >= -65) return 3;
  if (rssi >= -80) return 2;
  return 1;
}

function RssiIndicator({ rssi }: { rssi: number }) {
  const level = rssiToLevel(rssi);
  return (
    <View style={styles.rssiContainer}>
      {[1, 2, 3, 4].map((i) => (
        <View
          key={i}
          style={[
            styles.rssiBar,
            { height: 6 + i * 4 },
            i <= level ? styles.rssiBarActive : styles.rssiBarInactive,
          ]}
        />
      ))}
    </View>
  );
}

function PulseAnimation({ scanning }: { scanning: boolean }) {
  const scale1 = useRef(new Animated.Value(0.8)).current;
  const opacity1 = useRef(new Animated.Value(0.6)).current;
  const scale2 = useRef(new Animated.Value(0.8)).current;
  const opacity2 = useRef(new Animated.Value(0.6)).current;

  useEffect(() => {
    if (!scanning) {
      scale1.setValue(0.8);
      opacity1.setValue(0);
      scale2.setValue(0.8);
      opacity2.setValue(0);
      return;
    }

    const pulse = (
      scaleVal: Animated.Value,
      opacityVal: Animated.Value,
      delay: number,
    ) =>
      Animated.loop(
        Animated.sequence([
          Animated.delay(delay),
          Animated.parallel([
            Animated.timing(scaleVal, {
              toValue: 2.2,
              duration: 1800,
              easing: Easing.out(Easing.ease),
              useNativeDriver: true,
            }),
            Animated.timing(opacityVal, {
              toValue: 0,
              duration: 1800,
              easing: Easing.out(Easing.ease),
              useNativeDriver: true,
            }),
          ]),
          Animated.parallel([
            Animated.timing(scaleVal, {
              toValue: 0.8,
              duration: 0,
              useNativeDriver: true,
            }),
            Animated.timing(opacityVal, {
              toValue: 0.6,
              duration: 0,
              useNativeDriver: true,
            }),
          ]),
        ]),
      );

    const a1 = pulse(scale1, opacity1, 0);
    const a2 = pulse(scale2, opacity2, 600);
    a1.start();
    a2.start();

    return () => {
      a1.stop();
      a2.stop();
    };
  }, [scanning, scale1, opacity1, scale2, opacity2]);

  return (
    <View style={styles.pulseWrapper}>
      <Animated.View
        style={[
          styles.pulseRing,
          { transform: [{ scale: scale1 }], opacity: opacity1 },
        ]}
      />
      <Animated.View
        style={[
          styles.pulseRing,
          { transform: [{ scale: scale2 }], opacity: opacity2 },
        ]}
      />
      <View style={styles.bleIconCircle}>
        <Feather name="bluetooth" size={32} color={COLORS.primary} />
      </View>
    </View>
  );
}

export function BleSearchScreen() {
  const navigation = useNavigation<Nav>();
  const route = useRoute<Route>();
  const [devices, setDevices] = useState<BleDeviceInfo[]>([]);
  const [scanStatus, setScanStatus] = useState<ScanStatus>('idle');
  const [btState, setBtState] = useState<BtState>('unknown');
  const [connectingId, setConnectingId] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const unsubscribe = observeBluetoothState((state) => {
      console.log('[BLE] Bluetooth state:', state);
      switch (state) {
        case State.PoweredOn:
          setBtState('on');
          break;
        case State.PoweredOff:
        case State.Resetting:
          setBtState('off');
          break;
        case State.Unauthorized:
          setBtState('unauthorized');
          break;
        case State.Unknown:
        case State.Unsupported:
        default:
          break;
      }
    });
    return unsubscribe;
  }, []);

  useEffect(() => {
    const timer = setTimeout(() => {
      setBtState((prev) => (prev === 'unknown' ? 'off' : prev));
    }, 3000);
    return () => clearTimeout(timer);
  }, []);

  useEffect(() => {
    return () => {
      stopScan();
    };
  }, []);

  useEffect(() => {
    if (btState === 'on' && route.params?.autoStart) {
      handleStartScan();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [btState, route.params?.autoStart]);

  const handleStartScan = useCallback(async () => {
    setError(null);
    setDevices([]);

    const granted = await requestPermissions();
    if (!granted) {
      setError('蓝牙权限被拒绝，请在系统设置中授权');
      setScanStatus('stopped');
      return;
    }

    setScanStatus('scanning');
    startScan(
      (device) => {
        setDevices((prev) => {
          if (prev.some((d) => d.id === device.id)) return prev;
          return [...prev, device];
        });
      },
      (err) => {
        setError(err.message);
        setScanStatus('stopped');
      },
    );

    setTimeout(() => {
      stopScan();
      setScanStatus('stopped');
    }, 15000);
  }, []);

  const handleConnect = useCallback(
    async (device: BleDeviceInfo) => {
      stopScan();
      setScanStatus('stopped');
      setConnectingId(device.id);
      setError(null);

      try {
        await connectToDevice(device.id);
        setConnectingId(null);
        const draft = useSettingsStore.getState().petOnboardingDraft;
        navigation.navigate(RootStackRoute.DeviceMatchSuccess, {
          deviceId: device.id,
          petName: draft?.petName,
        });
      } catch (err: any) {
        setConnectingId(null);
        setError(`连接失败: ${err.message ?? '未知错误'}`);
      }
    },
    [navigation],
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
            <RssiIndicator rssi={item.rssi} />
          )}
        </Pressable>
      );
    },
    [connectingId, handleConnect],
  );

  const renderEmpty = () => {
    if (scanStatus === 'scanning') return null;

    return (
      <View style={styles.emptyState}>
        <Feather name="search" size={48} color={COLORS.textLight} />
        <Text style={styles.emptyTitle}>
          {scanStatus === 'idle' ? '准备搜索设备' : '未发现设备'}
        </Text>
        <Text style={styles.emptySubtitle}>
          请确保设备已开启并靠近手机
        </Text>
      </View>
    );
  };

  const openBluetoothSettings = useCallback(() => {
    if (Platform.OS === 'ios') {
      Linking.openURL('App-Prefs:Bluetooth');
    } else {
      Linking.sendIntent('android.settings.BLUETOOTH_SETTINGS').catch(() =>
        Linking.openSettings(),
      );
    }
  }, []);

  const renderBluetoothOff = () => (
    <View style={styles.stateContainer}>
      <View style={styles.stateIconCircle}>
        <Feather name="bluetooth" size={40} color={COLORS.textMuted} />
      </View>
      <Text style={styles.stateTitle}>蓝牙未开启</Text>
      <Text style={styles.stateSubtitle}>
        请在系统设置中开启蓝牙以搜索附近设备
      </Text>
      <Pressable
        style={({ pressed }) => [
          styles.settingsButton,
          pressed && styles.scanButtonPressed,
        ]}
        onPress={openBluetoothSettings}
      >
        <Feather name="bluetooth" size={16} color="#FFFFFF" />
        <Text style={styles.scanButtonText}>打开蓝牙</Text>
      </Pressable>
    </View>
  );

  const openSettings = useCallback(() => {
    Alert.alert(
      '蓝牙权限未授权',
      'PetTrack 需要蓝牙权限来搜索和连接宠物追踪设备，请前往系统设置开启。',
      [
        { text: '取消', style: 'cancel' },
        {
          text: '前往设置',
          onPress: () => {
            if (Platform.OS === 'ios') {
              Linking.openURL('app-settings:');
            } else {
              Linking.openSettings();
            }
          },
        },
      ],
    );
  }, []);

  useEffect(() => {
    if (btState === 'unauthorized') {
      openSettings();
    }
  }, [btState, openSettings]);

  const renderUnauthorized = () => (
    <View style={styles.stateContainer}>
      <View style={styles.stateIconCircle}>
        <Feather name="shield-off" size={40} color={COLORS.danger} />
      </View>
      <Text style={styles.stateTitle}>蓝牙权限未授权</Text>
      <Text style={styles.stateSubtitle}>
        请在系统设置中允许 PetTrack 使用蓝牙
      </Text>
      <Pressable
        style={({ pressed }) => [
          styles.settingsButton,
          pressed && styles.scanButtonPressed,
        ]}
        onPress={openSettings}
      >
        <Feather name="settings" size={16} color="#FFFFFF" />
        <Text style={styles.scanButtonText}>前往设置</Text>
      </Pressable>
    </View>
  );

  const showDeviceList = btState === 'on';

  return (
    <SafeAreaView style={styles.safeArea}>
      <View style={styles.root}>
        <View style={styles.header}>
          <Pressable
            onPress={() => {
              stopScan();
              navigation.goBack();
            }}
            style={styles.backButton}
            hitSlop={12}
          >
            <Feather name="chevron-left" size={24} color={COLORS.text} />
          </Pressable>
          <Text style={styles.headerTitle}>搜索设备</Text>
          <View style={styles.headerRight} />
        </View>

        {showDeviceList ? (
          <>
            <View style={styles.scanHeader}>
              <PulseAnimation scanning={scanStatus === 'scanning'} />
              <Text style={styles.scanTitle}>
                {scanStatus === 'scanning'
                  ? '正在搜索附近设备...'
                  : scanStatus === 'stopped'
                    ? `搜索完成，发现 ${devices.length} 个设备`
                    : '准备搜索设备'}
              </Text>
              {scanStatus === 'scanning' && (
                <Text style={styles.scanSubtitle}>
                  请将设备靠近手机，保持距离在 1 米内
                </Text>
              )}
            </View>

            {error && (
              <View style={styles.errorBanner}>
                <Feather name="alert-circle" size={16} color={COLORS.danger} />
                <Text style={styles.errorText}>{error}</Text>
              </View>
            )}

            <FlatList
              data={devices}
              keyExtractor={(item) => item.id}
              renderItem={renderDevice}
              ListEmptyComponent={renderEmpty}
              contentContainerStyle={styles.listContent}
              ItemSeparatorComponent={() => (
                <View style={styles.separatorWrapper}>
                  <View style={styles.separator} />
                </View>
              )}
              style={styles.list}
            />

            <View style={styles.bottomBar}>
              <Pressable
                style={({ pressed }) => [
                  styles.scanButton,
                  scanStatus === 'scanning' && styles.scanButtonDisabled,
                  pressed && styles.scanButtonPressed,
                ]}
                onPress={handleStartScan}
                disabled={scanStatus === 'scanning'}
              >
                <Feather
                  name={scanStatus === 'scanning' ? 'loader' : 'refresh-cw'}
                  size={18}
                  color="#FFFFFF"
                />
                <Text style={styles.scanButtonText}>
                  {scanStatus === 'scanning' ? '搜索中...' : '重新扫描'}
                </Text>
              </Pressable>
            </View>
          </>
        ) : btState === 'off' ? (
          renderBluetoothOff()
        ) : btState === 'unauthorized' ? (
          renderUnauthorized()
        ) : (
          <View style={styles.stateContainer}>
            <ActivityIndicator size="large" color={COLORS.primary} />
            <Text style={styles.stateTitle}>正在检查蓝牙状态...</Text>
          </View>
        )}
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
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    height: 56,
    paddingHorizontal: 16,
  },
  backButton: {
    width: 24,
    height: 24,
    alignItems: 'center',
    justifyContent: 'center',
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: COLORS.text,
  },
  headerRight: {
    width: 24,
  },

  scanHeader: {
    alignItems: 'center',
    paddingVertical: 24,
    gap: 12,
  },
  scanTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: COLORS.text,
  },
  scanSubtitle: {
    fontSize: 13,
    color: COLORS.textMuted,
  },

  pulseWrapper: {
    width: 100,
    height: 100,
    alignItems: 'center',
    justifyContent: 'center',
  },
  pulseRing: {
    position: 'absolute',
    width: 80,
    height: 80,
    borderRadius: 40,
    borderWidth: 2,
    borderColor: COLORS.primary,
  },
  bleIconCircle: {
    width: 64,
    height: 64,
    borderRadius: 32,
    backgroundColor: COLORS.primarySoft,
    alignItems: 'center',
    justifyContent: 'center',
  },

  errorBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginHorizontal: 16,
    marginBottom: 8,
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 12,
    backgroundColor: '#FDE8E8',
  },
  errorText: {
    flex: 1,
    fontSize: 13,
    color: COLORS.danger,
  },

  list: {
    flex: 1,
  },
  listContent: {
    paddingHorizontal: 16,
    paddingBottom: 16,
    flexGrow: 1,
  },
  deviceRow: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.surface,
    paddingVertical: 14,
    paddingHorizontal: 16,
    borderRadius: 16,
    gap: 12,
    ...shadowCard,
  },
  deviceRowPressed: {
    opacity: 0.7,
  },
  deviceIconWrap: {
    width: 40,
    height: 40,
    borderRadius: 12,
    backgroundColor: COLORS.primarySoft,
    alignItems: 'center',
    justifyContent: 'center',
  },
  deviceInfo: {
    flex: 1,
    gap: 2,
  },
  deviceName: {
    fontSize: 15,
    fontWeight: '600',
    color: COLORS.text,
  },
  deviceId: {
    fontSize: 11,
    color: COLORS.textMuted,
  },

  rssiContainer: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    gap: 2,
    height: 24,
  },
  rssiBar: {
    width: 4,
    borderRadius: 2,
  },
  rssiBarActive: {
    backgroundColor: COLORS.primary,
  },
  rssiBarInactive: {
    backgroundColor: COLORS.divider,
  },

  separatorWrapper: {
    height: 8,
  },
  separator: {
    height: 8,
  },

  emptyState: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 60,
    gap: 12,
  },
  emptyTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: COLORS.textSecondary,
  },
  emptySubtitle: {
    fontSize: 13,
    color: COLORS.textMuted,
  },

  stateContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 40,
    gap: 16,
  },
  stateIconCircle: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: COLORS.divider,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 8,
  },
  stateTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: COLORS.text,
  },
  stateSubtitle: {
    fontSize: 14,
    color: COLORS.textMuted,
    textAlign: 'center',
    lineHeight: 20,
  },

  bottomBar: {
    paddingHorizontal: 16,
    paddingVertical: 12,
    paddingBottom: 8,
  },
  scanButton: {
    flexDirection: 'row',
    height: 52,
    borderRadius: 14,
    backgroundColor: COLORS.primary,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    shadowColor: COLORS.primary,
    shadowOpacity: 0.25,
    shadowOffset: { width: 0, height: 4 },
    shadowRadius: 8,
    elevation: 4,
  },
  scanButtonDisabled: {
    opacity: 0.7,
  },
  scanButtonPressed: {
    opacity: 0.9,
  },
  scanButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#FFFFFF',
  },
  settingsButton: {
    flexDirection: 'row',
    height: 48,
    borderRadius: 14,
    backgroundColor: COLORS.primary,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    paddingHorizontal: 32,
    marginTop: 8,
  },
});
