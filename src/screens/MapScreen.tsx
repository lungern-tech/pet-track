import React, { useCallback, useEffect, useRef, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  InteractionManager,
  Platform,
  Pressable,
  StyleSheet,
  Text,
  useWindowDimensions,
  View,
} from 'react-native';
import { Feather } from '@expo/vector-icons';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useFocusEffect, useIsFocused, useNavigation } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import type { CameraPosition, LatLng, MapViewRef } from 'expo-gaode-map';
import { ExpoGaodeMapModule, MapView, Marker } from 'expo-gaode-map';

import type { RootStackParamList } from '../navigation/types';
import { RootStackRoute } from '../navigation/types';
import { ActiveGeofenceLayers } from '../components/ActiveGeofenceLayers';
import { FenceListSheet } from '../components/FenceListSheet';
import {
  PET_MARKER_HEIGHT,
  PET_MARKER_WIDTH,
  PetMapMarkerBubble,
} from '../components/PetMapMarkerBubble';
import { fetchGeofences, updateGeofence } from '../services/geofencesApi';
import { ApiError } from '../services/RequestManager';
import type { FenceRecord } from '../types/fence';
import { useAuthStore, useSettingsStore } from '../store';

const COLORS = {
  background: '#F5F4F1',
  surface: '#FFFFFF',
  surfaceMuted: '#EDECEA',
  primary: '#3D8A5A',
  text: '#1A1918',
  textSecondary: '#6D6C6A',
  textMuted: '#9C9B99',
} as const;

const DEFAULT_CAMERA: CameraPosition = {
  target: { latitude: 39.9042, longitude: 116.4074 },
  zoom: 12,
};

const LOCATION_ZOOM = 16;

/** 与首页 mock 位置一致：北京市朝阳区三里屯 */
const DEMO_PET_LOCATION: LatLng = {
  latitude: 39.9338,
  longitude: 116.4544,
};

const LOCATION_TIMEOUT_MS = 12_000;

type MapNav = NativeStackNavigationProp<RootStackParamList>;

type LocateTarget = 'me' | 'pet';

export function MapScreen() {
  const navigation = useNavigation<MapNav>();
  const isFocused = useIsFocused();
  const accessToken = useAuthStore((s) => s.accessToken);
  const primaryPet = useSettingsStore((s) => s.primaryPet);
  const deviceAvatarUrl = useSettingsStore((s) => s.deviceAvatarUrl);
  const fences = useSettingsStore((s) => s.fences);
  const upsertFence = useSettingsStore((s) => s.upsertFence);

  useFocusEffect(
    useCallback(() => {
      if (!accessToken) return;
      let canceled = false;
      (async () => {
        try {
          const list = await fetchGeofences();
          if (!canceled) {
            useSettingsStore.getState().setFencesFromServer(list);
          }
        } catch {
          // 网络/鉴权失败时保留本地缓存
        }
      })();
      return () => {
        canceled = true;
      };
    }, [accessToken]),
  );
  const mapRef = useRef<MapViewRef>(null);
  const { height: windowHeight } = useWindowDimensions();
  const [initialCamera, setInitialCamera] = useState<CameraPosition | null>(
    null,
  );
  const [initError, setInitError] = useState<string | null>(null);
  const [locationGranted, setLocationGranted] = useState(false);
  const [mapHostReady, setMapHostReady] = useState(false);
  const [mapHasSize, setMapHasSize] = useState(Platform.OS !== 'web');
  const [mapViewKey, setMapViewKey] = useState(0);
  const [locatingTarget, setLocatingTarget] = useState<LocateTarget | null>(
    null,
  );
  const [fenceSheetVisible, setFenceSheetVisible] = useState(false);
  const [togglingFenceId, setTogglingFenceId] = useState<number | null>(null);
  const petLocation = primaryPet?.linkedDeviceId ? DEMO_PET_LOCATION : null;
  const petAvatarUri =
    primaryPet?.avatarUrl?.trim() || deviceAvatarUrl?.trim() || '';
  const petMarkerCacheKey = primaryPet
    ? `pet-marker-${primaryPet.id}-${petAvatarUri ? 'img' : 'icon'}`
    : undefined;
  const linkedDeviceId = primaryPet?.linkedDeviceId ?? null;

  useEffect(() => {
    if (Platform.OS === 'web') return;
    const t = setTimeout(() => {
      setMapHasSize(true);
    }, 300);
    return () => clearTimeout(t);
  }, []);

  useEffect(() => {
    if (Platform.OS === 'web') {
      setInitialCamera(DEFAULT_CAMERA);
      return;
    }

    let cancelled = false;

    const finishWithDefaultCamera = () => {
      if (cancelled) return;
      setInitialCamera({ ...DEFAULT_CAMERA, zoom: 15 });
      setMapHostReady(true);
    };

    const run = async () => {
      try {
        const privacy = ExpoGaodeMapModule.getPrivacyStatus();
        if (!privacy.isReady) {
          ExpoGaodeMapModule.setPrivacyConfig({
            hasShow: true,
            hasContainsPrivacy: true,
            hasAgree: true,
          });
          await new Promise<void>((r) => setTimeout(r, 50));
        }

        if (!ExpoGaodeMapModule.isSDKInitialized()) {
          ExpoGaodeMapModule.initSDK({});
        }

        const perm = await ExpoGaodeMapModule.checkLocationPermission();
        let granted = perm.granted;
        if (!granted) {
          const afterAsk = await ExpoGaodeMapModule.requestLocationPermission();
          granted = afterAsk.granted;
        }
        if (!cancelled) {
          setLocationGranted(granted);
        }

        await new Promise<void>((resolve) => {
          InteractionManager.runAfterInteractions(() => {
            setTimeout(resolve, 50);
          });
        });

        // 先结束 loading、用默认中心出图；避免 getCurrentLocation 在模拟器上长时间不返回导致一直转圈
        finishWithDefaultCamera();

        if (granted && !cancelled) {
          try {
            const loc = await Promise.race([
              ExpoGaodeMapModule.getCurrentLocation(),
              new Promise<never>((_, reject) =>
                setTimeout(
                  () => reject(new Error('location_timeout')),
                  LOCATION_TIMEOUT_MS,
                ),
              ),
            ]);
            if (
              !cancelled &&
              loc &&
              typeof loc.latitude === 'number' &&
              typeof loc.longitude === 'number'
            ) {
              setInitialCamera({
                target: {
                  latitude: loc.latitude,
                  longitude: loc.longitude,
                },
                zoom: 15,
              });
              setMapViewKey((k) => k + 1);
            }
          } catch {
            // 超时或失败：保持默认中心
          }
        }
      } catch (e) {
        if (!cancelled) {
          setInitError(e instanceof Error ? e.message : String(e));
          setLocationGranted(false);
          setInitialCamera({ ...DEFAULT_CAMERA, zoom: 15 });
          setMapHostReady(true);
        }
      }
    };

    void run();
    return () => {
      cancelled = true;
    };
  }, []);

  const handleFencePress = () => {
    setFenceSheetVisible(true);
  };

  const handleAddFence = () => {
    setFenceSheetVisible(false);
    navigation.navigate(RootStackRoute.FenceCreate);
  };

  const handleToggleFence = async (fence: FenceRecord) => {
    if (togglingFenceId != null) return;

    const nextEnabled = !fence.enabled;
    setTogglingFenceId(fence.id);
    upsertFence({ ...fence, enabled: nextEnabled });

    try {
      const updated = await updateGeofence(fence.id, { enabled: nextEnabled });
      upsertFence(updated);
    } catch (e) {
      upsertFence(fence);
      const message =
        e instanceof ApiError
          ? e.message
          : e instanceof Error
            ? e.message
            : '切换失败，请稍后重试';
      Alert.alert('操作失败', message);
    } finally {
      setTogglingFenceId(null);
    }
  };

  const focusMapOn = async (target: LatLng, zoom = LOCATION_ZOOM) => {
    const ref = mapRef.current;
    if (!ref) {
      Alert.alert('提示', '地图尚未就绪，请稍后再试');
      return;
    }
    await ref.moveCamera({ target, zoom }, 300);
  };

  const getCurrentLocation = async (): Promise<LatLng> => {
    let granted = locationGranted;
    if (!granted) {
      const afterAsk = await ExpoGaodeMapModule.requestLocationPermission();
      granted = afterAsk.granted;
      if (granted) {
        setLocationGranted(true);
      }
    }
    if (!granted) {
      throw new Error('permission_denied');
    }

    const loc = await Promise.race([
      ExpoGaodeMapModule.getCurrentLocation(),
      new Promise<never>((_, reject) =>
        setTimeout(() => reject(new Error('location_timeout')), LOCATION_TIMEOUT_MS),
      ),
    ]);

    if (
      loc &&
      typeof loc.latitude === 'number' &&
      typeof loc.longitude === 'number'
    ) {
      return {
        latitude: loc.latitude,
        longitude: loc.longitude,
      };
    }

    throw new Error('invalid_location');
  };

  const handleLocateMe = async () => {
    if (locatingTarget) return;
    setLocatingTarget('me');
    try {
      const target = await getCurrentLocation();
      await focusMapOn(target);
    } catch (e) {
      const message =
        e instanceof Error && e.message === 'permission_denied'
          ? '请允许应用访问位置信息'
          : '暂时无法获取您的位置，请稍后再试';
      Alert.alert('定位失败', message);
    } finally {
      setLocatingTarget(null);
    }
  };

  const handleLocatePet = async () => {
    if (locatingTarget) return;

    if (!primaryPet) {
      Alert.alert('暂无宠物', '请先添加宠物并绑定项圈');
      return;
    }

    if (!petLocation) {
      Alert.alert('暂无位置', '宠物位置待项圈上报，请稍后再试');
      return;
    }

    setLocatingTarget('pet');
    try {
      await focusMapOn(petLocation);
    } catch {
      Alert.alert('定位失败', '暂时无法移动到宠物位置，请稍后再试');
    } finally {
      setLocatingTarget(null);
    }
  };

  const showMapControls =
    isFocused &&
    mapHostReady &&
    mapHasSize &&
    initialCamera &&
    Platform.OS !== 'web';

  return (
    <SafeAreaView style={styles.safeArea}>
      <View style={styles.root}>
        <View style={styles.header}>
          <Pressable
            style={styles.headerBack}
            onPress={() => navigation.goBack()}
          >
            <Feather name="chevron-left" size={24} color={COLORS.text} />
          </Pressable>

          <Text style={styles.headerTitle}>实时定位</Text>

          <Pressable style={styles.headerMore}>
            <Feather name="more-vertical" size={24} color={COLORS.text} />
          </Pressable>
        </View>

        <View style={styles.entryRow}>
          <QuickEntry
            icon="navigation-2"
            label="轨迹回放"
            onPress={() => {
              // TODO: 导航到轨迹历史页面
            }}
          />
          <QuickEntry
            icon="crosshair"
            label="寻宠模式"
            onPress={() => {
              // TODO: 导航到寻宠模式详情
            }}
          />
        </View>

        <View
          style={[
            styles.mapContainer,
            { minHeight: Math.max(220, Math.floor(windowHeight * 0.5)) },
          ]}
          collapsable={false}
          onLayout={(e) => {
            const { width, height } = e.nativeEvent.layout;
            if (width >= 2 && height >= 2) {
              setMapHasSize(true);
            }
          }}
        >
          {!initialCamera ? (
            <View style={styles.mapPlaceholderContent}>
              <ActivityIndicator size="large" color={COLORS.primary} />
              <Text style={styles.mapPlaceholderTitle}>地图加载中...</Text>
              <Text style={styles.mapPlaceholderSub}>
                正在初始化高德地图与定位
              </Text>
            </View>
          ) : Platform.OS === 'web' ? (
            <View style={styles.mapPlaceholderContent}>
              <Feather
                name="map"
                size={64}
                color={COLORS.textMuted}
                style={styles.mapIcon}
              />
              <Text style={styles.mapPlaceholderTitle}>Web 端暂不支持高德地图</Text>
              <Text style={styles.mapPlaceholderSub}>
                请在 iOS / Android 真机或模拟器中使用本页
              </Text>
            </View>
          ) : (
            <>
              {!isFocused ? (
                <View
                  style={[StyleSheet.absoluteFill, styles.mapHostHidden]}
                />
              ) : !mapHostReady || !mapHasSize ? (
                <View style={styles.mapPlaceholderContent}>
                  <ActivityIndicator size="large" color={COLORS.primary} />
                  <Text style={styles.mapPlaceholderTitle}>准备地图视图…</Text>
                </View>
              ) : (
                <MapView
                  ref={mapRef}
                  key={mapViewKey}
                  style={StyleSheet.absoluteFill}
                  initialCameraPosition={initialCamera}
                  myLocationEnabled={locationGranted}
                  onLoad={() => {
                    // 地图就绪
                  }}
                >
                  <ActiveGeofenceLayers
                    fences={fences}
                    linkedDeviceId={linkedDeviceId}
                  />
                  {petLocation && primaryPet ? (
                    <Marker
                      position={petLocation}
                      anchor={{ x: 0.5, y: 1 }}
                      customViewWidth={PET_MARKER_WIDTH}
                      customViewHeight={PET_MARKER_HEIGHT}
                      cacheKey={petMarkerCacheKey}
                      zIndex={10}
                    >
                      <PetMapMarkerBubble
                        name={primaryPet.name}
                        avatarUri={petAvatarUri}
                      />
                    </Marker>
                  ) : null}
                </MapView>
              )}
              {initError ? (
                <View style={styles.errorChip}>
                  <Feather name="alert-circle" size={14} color="#B45309" />
                  <Text style={styles.errorChipText} numberOfLines={2}>
                    定位初始化异常，已显示默认区域：{initError}
                  </Text>
                </View>
              ) : null}
              {showMapControls ? (
                <View style={styles.mapFabColumn}>
                  <MapFabButton
                    icon="crosshair"
                    label="我的位置"
                    loading={locatingTarget === 'me'}
                    onPress={handleLocateMe}
                  />
                  <MapFabButton
                    icon="map-pin"
                    label="宠物位置"
                    loading={locatingTarget === 'pet'}
                    onPress={handleLocatePet}
                  />
                  <Pressable
                    style={styles.fenceFab}
                    onPress={handleFencePress}
                    accessibilityRole="button"
                    accessibilityLabel="围栏操作"
                  >
                    <Feather name="shield" size={20} color={COLORS.surface} />
                    <Text style={styles.fenceFabLabel}>围栏</Text>
                  </Pressable>
                </View>
              ) : null}
            </>
          )}
        </View>

        <FenceListSheet
          visible={fenceSheetVisible}
          fences={fences}
          onClose={() => setFenceSheetVisible(false)}
          onAdd={handleAddFence}
          onToggleFence={(fence) => void handleToggleFence(fence)}
          togglingFenceId={togglingFenceId}
        />
      </View>
    </SafeAreaView>
  );
}

type QuickEntryProps = {
  icon: React.ComponentProps<typeof Feather>['name'];
  label: string;
  onPress: () => void;
};

function QuickEntry({ icon, label, onPress }: QuickEntryProps) {
  return (
    <Pressable style={styles.entryButton} onPress={onPress}>
      <Feather name={icon} size={18} color={COLORS.primary} />
      <Text style={styles.entryLabel}>{label}</Text>
    </Pressable>
  );
}

type MapFabButtonProps = {
  icon: React.ComponentProps<typeof Feather>['name'];
  label: string;
  loading?: boolean;
  onPress: () => void;
};

function MapFabButton({ icon, label, loading, onPress }: MapFabButtonProps) {
  return (
    <Pressable
      style={styles.mapFabButton}
      onPress={onPress}
      disabled={loading}
      accessibilityRole="button"
      accessibilityLabel={label}
    >
      {loading ? (
        <ActivityIndicator size="small" color={COLORS.primary} />
      ) : (
        <Feather name={icon} size={20} color={COLORS.primary} />
      )}
    </Pressable>
  );
}

const shadowCard = {
  shadowColor: '#1A1918',
  shadowOpacity: 0.06,
  shadowOffset: { width: 0, height: 2 },
  shadowRadius: 8,
  elevation: 2,
} as const;

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
    paddingTop: 12,
    paddingBottom: 8,
  },
  headerBack: {
    width: 32,
    height: 32,
    alignItems: 'center',
    justifyContent: 'center',
  },
  headerMore: {
    width: 32,
    height: 32,
    alignItems: 'center',
    justifyContent: 'center',
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: COLORS.text,
  },
  entryRow: {
    flexDirection: 'row',
    gap: 12,
    paddingHorizontal: 24,
    paddingBottom: 12,
  },
  entryButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    height: 44,
    borderRadius: 12,
    backgroundColor: COLORS.surface,
    ...shadowCard,
  },
  entryLabel: {
    fontSize: 13,
    fontWeight: '600',
    color: COLORS.text,
  },
  mapContainer: {
    flex: 1,
    marginTop: 4,
    backgroundColor: COLORS.surfaceMuted,
    overflow: 'hidden',
  },
  mapHostHidden: {
    backgroundColor: COLORS.surfaceMuted,
  },
  mapPlaceholderContent: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    paddingHorizontal: 24,
  },
  mapIcon: {
    marginBottom: 4,
  },
  mapPlaceholderTitle: {
    fontSize: 15,
    color: COLORS.textSecondary,
  },
  mapPlaceholderSub: {
    fontSize: 12,
    color: COLORS.textMuted,
    textAlign: 'center',
  },
  errorChip: {
    position: 'absolute',
    left: 12,
    right: 12,
    top: 12,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    paddingHorizontal: 12,
    paddingVertical: 10,
    borderRadius: 12,
    backgroundColor: '#FEF3C7',
  },
  errorChipText: {
    flex: 1,
    fontSize: 12,
    color: '#92400E',
  },
  mapFabColumn: {
    position: 'absolute',
    right: 16,
    bottom: 24,
    alignItems: 'flex-end',
    gap: 10,
  },
  mapFabButton: {
    width: 44,
    height: 44,
    borderRadius: 22,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: COLORS.surface,
    ...shadowCard,
  },
  fenceFab: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderRadius: 24,
    backgroundColor: COLORS.primary,
    ...shadowCard,
  },
  fenceFabLabel: {
    fontSize: 14,
    fontWeight: '600',
    color: COLORS.surface,
  },
});
