import React, { useEffect, useMemo, useRef, useState } from 'react';
import {
  ActivityIndicator,
  InteractionManager,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Switch,
  Text,
  TextInput,
  View,
} from 'react-native';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';
import { Feather } from '@expo/vector-icons';
import { useIsFocused, useNavigation } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import type { CameraPosition, LatLng, MapViewRef } from 'expo-gaode-map';
import {
  Circle,
  ExpoGaodeMapModule,
  MapView,
  Marker,
  Polygon,
  Polyline,
} from 'expo-gaode-map';

import type { RootStackParamList } from '../navigation/types';
import { createGeofence } from '../services/geofencesApi';
import type { CreateGeofencePayload } from '../services/geofencesApi';
import { ApiError } from '../services/RequestManager';
import { useSettingsStore } from '../store/settingsStore';
import type { FenceType } from '../types/fence';
import {
  appendPolygonVertex,
  getPolygonFillPoints,
  getPolygonOutlinePoints,
  getPolygonVerticesForDisplay,
  isValidPolygon,
  normalizePolygonVertices,
  replacePolygonVertexAt,
} from '../utils/polygon';
import {
  PolygonVertexMarker,
  type VertexDragController,
} from '../components/PolygonVertexMarker';

type FenceCreateNav = NativeStackNavigationProp<RootStackParamList>;

const COLORS = {
  background: '#F5F4F1',
  surface: '#FFFFFF',
  surfaceMuted: '#EDECEA',
  primary: '#3D8A5A',
  primarySoft: '#C8F0D8',
  text: '#1A1918',
  textSecondary: '#6D6C6A',
  textMuted: '#9C9B99',
  border: '#E5E4E1',
  danger: '#E05252',
} as const;

const MIN_RADIUS = 100;
const MAX_RADIUS = 2000;
const RADIUS_STEP = 50;
const MAP_HEIGHT = 240;
const LOCATION_TIMEOUT_MS = 12_000;

const DEFAULT_CAMERA: CameraPosition = {
  target: { latitude: 39.9042, longitude: 116.4074 },
  zoom: 15,
};

const FENCE_STROKE = COLORS.primary;
const FENCE_FILL = 'rgba(61, 138, 90, 0.18)';

function formatCoordinate(value: number): string {
  return value.toFixed(5);
}

type FenceMapLayerProps = {
  type: FenceType;
  fenceCenter: LatLng;
  radius: number;
  polygonPoints: LatLng[];
  markerLayerKey?: number;
  draggingVertexIndex?: number | null;
  frozenMarkerPositions?: LatLng[] | null;
  onVertexDragStart?: (index: number) => void;
  onVertexDrag?: (index: number, point: LatLng) => void;
  onVertexDragEnd?: (index: number, point: LatLng) => void;
};

function FenceMapLayers({
  type,
  fenceCenter,
  radius,
  polygonPoints,
  markerLayerKey = 0,
  draggingVertexIndex = null,
  frozenMarkerPositions = null,
  onVertexDragStart,
  onVertexDrag,
  onVertexDragEnd,
}: FenceMapLayerProps) {
  const dragControllerRef = useRef<VertexDragController>({
    onStart: () => {},
    onDrag: () => {},
    onEnd: () => {},
  });
  dragControllerRef.current.onStart = (index) => onVertexDragStart?.(index);
  dragControllerRef.current.onDrag = (index, point) => onVertexDrag?.(index, point);
  dragControllerRef.current.onEnd = (index, point) => onVertexDragEnd?.(index, point);

  const markerDisplayPoints = useMemo(() => {
    const vertices = getPolygonVerticesForDisplay(polygonPoints);
    if (draggingVertexIndex == null || !frozenMarkerPositions) {
      return vertices;
    }
    return vertices.map((point, index) =>
      index === draggingVertexIndex
        ? frozenMarkerPositions[index] ?? point
        : point,
    );
  }, [polygonPoints, draggingVertexIndex, frozenMarkerPositions]);

  const polygonOutline = getPolygonOutlinePoints(polygonPoints);
  const polygonFill = getPolygonFillPoints(polygonPoints);
  const vertexDragEnabled = !!onVertexDragEnd;

  return (
    <>
      {type === 'circle' ? (
        <Circle
          center={fenceCenter}
          radius={radius}
          strokeWidth={2}
          strokeColor={FENCE_STROKE}
          fillColor={FENCE_FILL}
        />
      ) : null}
      {type === 'polygon' && polygonFill.length >= 4 ? (
        <Polygon
          points={polygonFill}
          strokeWidth={2}
          strokeColor={FENCE_STROKE}
          fillColor={FENCE_FILL}
          zIndex={1}
        />
      ) : null}
      {type === 'polygon' &&
      markerDisplayPoints.length >= 2 &&
      polygonFill.length < 4 ? (
        <Polyline
          points={polygonOutline}
          strokeWidth={2}
          strokeColor={FENCE_STROKE}
          zIndex={1}
        />
      ) : null}
      {type === 'polygon'
        ? markerDisplayPoints.map((point, index) => (
            <PolygonVertexMarker
              key={`polygon-point-${index}-${markerLayerKey}`}
              index={index}
              point={point}
              markerLayerKey={markerLayerKey}
              isDragging={draggingVertexIndex === index}
              draggable={vertexDragEnabled}
              dragControllerRef={dragControllerRef}
            />
          ))
        : null}
      {type === 'circle' ? (
        <Marker position={fenceCenter} pinColor="green" />
      ) : null}
    </>
  );
}

type PolygonPointsPanelProps = {
  points: LatLng[];
  onRemovePoint: (index: number) => void;
  onClear: () => void;
};

function PolygonPointsPanel({
  points,
  onRemovePoint,
  onClear,
}: PolygonPointsPanelProps) {
  const [collapsed, setCollapsed] = useState(false);

  if (collapsed) {
    return (
      <Pressable
        style={styles.pointsPanelCollapsed}
        onPress={() => setCollapsed(false)}
        accessibilityRole="button"
        accessibilityLabel="展开顶点列表"
      >
        <Feather name="chevron-left" size={16} color={COLORS.primary} />
        <View style={styles.pointsPanelCollapsedBadge}>
          <Text style={styles.pointsPanelCollapsedCount}>{points.length}</Text>
        </View>
        <Text style={styles.pointsPanelCollapsedLabel}>顶点</Text>
      </Pressable>
    );
  }

  return (
    <View style={styles.pointsPanel}>
      <Pressable
        style={styles.pointsPanelHeader}
        onPress={() => setCollapsed(true)}
        accessibilityRole="button"
        accessibilityLabel="收起顶点列表"
      >
        <Text style={styles.pointsPanelTitle}>已选顶点</Text>
        <View style={styles.pointsPanelHeaderActions}>
          <View style={styles.pointsPanelCountBadge}>
            <Text style={styles.pointsPanelCount}>{points.length}</Text>
          </View>
          <Feather name="chevron-right" size={16} color={COLORS.textMuted} />
        </View>
      </Pressable>

      {points.length === 0 ? (
        <Text style={styles.pointsPanelEmpty}>点击地图添加顶点</Text>
      ) : (
        <ScrollView
          style={styles.pointsList}
          showsVerticalScrollIndicator={false}
          nestedScrollEnabled
        >
          {points.map((point, index) => (
            <View key={`point-row-${index}`} style={styles.pointRow}>
              <View style={styles.pointRowText}>
                <Text style={styles.pointIndex}>点 {index + 1}</Text>
                <Text style={styles.pointCoord} numberOfLines={1}>
                  {formatCoordinate(point.latitude)},{' '}
                  {formatCoordinate(point.longitude)}
                </Text>
              </View>
              <Pressable
                style={styles.pointRemoveButton}
                onPress={() => onRemovePoint(index)}
                hitSlop={8}
                accessibilityRole="button"
                accessibilityLabel={`删除点 ${index + 1}`}
              >
                <Feather name="x" size={14} color={COLORS.textMuted} />
              </Pressable>
            </View>
          ))}
        </ScrollView>
      )}

      {points.length > 0 ? (
        <Pressable style={styles.pointsClearButton} onPress={onClear}>
          <Text style={styles.pointsClearText}>清除全部</Text>
        </Pressable>
      ) : null}
    </View>
  );
}

export function FenceCreateScreen() {
  const navigation = useNavigation<FenceCreateNav>();
  const isFocused = useIsFocused();
  const insets = useSafeAreaInsets();
  const upsertFence = useSettingsStore((s) => s.upsertFence);
  const primaryPet = useSettingsStore((s) => s.primaryPet);
  const mapRef = useRef<MapViewRef>(null);
  const fullscreenMapRef = useRef<MapViewRef>(null);
  const polygonPointsRef = useRef<LatLng[]>([]);
  const pendingVertexDragRef = useRef<{
    index: number;
    point: LatLng;
  } | null>(null);
  const vertexDragFrameRef = useRef<number | null>(null);

  const [name, setName] = useState('');
  const [type, setType] = useState<FenceType>('circle');
  const [radius, setRadius] = useState(500);
  const [enabled, setEnabled] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);

  const [initialCamera, setInitialCamera] = useState<CameraPosition | null>(null);
  const [mapHostReady, setMapHostReady] = useState(false);
  const [mapHasSize, setMapHasSize] = useState(Platform.OS !== 'web');
  const [locationGranted, setLocationGranted] = useState(false);
  const [fenceCenter, setFenceCenter] = useState<LatLng>(
    DEFAULT_CAMERA.target ?? { latitude: 39.9042, longitude: 116.4074 },
  );
  const [polygonPoints, setPolygonPoints] = useState<LatLng[]>([]);
  const [polygonMapFullscreen, setPolygonMapFullscreen] = useState(false);
  const [draggingVertexIndex, setDraggingVertexIndex] = useState<number | null>(
    null,
  );
  const [frozenMarkerPositions, setFrozenMarkerPositions] = useState<
    LatLng[] | null
  >(null);
  const [markerLayerKey, setMarkerLayerKey] = useState(0);

  polygonPointsRef.current = polygonPoints;

  useEffect(() => {
    if (Platform.OS === 'web') return;
    const t = setTimeout(() => setMapHasSize(true), 300);
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
      setInitialCamera(DEFAULT_CAMERA);
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

        finishWithDefaultCamera();

        if (granted && !cancelled) {
          try {
            const loc = await Promise.race([
              ExpoGaodeMapModule.getCurrentLocation(),
              new Promise<never>((_, reject) =>
                setTimeout(() => reject(new Error('location_timeout')), LOCATION_TIMEOUT_MS),
              ),
            ]);
            if (
              !cancelled &&
              loc &&
              typeof loc.latitude === 'number' &&
              typeof loc.longitude === 'number'
            ) {
              const target = {
                latitude: loc.latitude,
                longitude: loc.longitude,
              };
              setInitialCamera({ target, zoom: 15 });
              setFenceCenter(target);
            }
          } catch {
            // 保持默认中心
          }
        }
      } catch {
        if (!cancelled) {
          setInitialCamera(DEFAULT_CAMERA);
          setMapHostReady(true);
        }
      }
    };

    void run();
    return () => {
      cancelled = true;
    };
  }, []);

  const handleSave = async () => {
    if (saving) return;

    const trimmed = name.trim();
    if (!trimmed) {
      setError('请输入围栏名称');
      return;
    }

    if (type === 'polygon' && !isValidPolygon(polygonPoints)) {
      setError('多边形围栏至少需要 3 个顶点');
      return;
    }

    const deviceId = primaryPet?.linkedDeviceId ?? undefined;
    if (!deviceId) {
      setError('请先为宠物绑定设备后再创建围栏');
      return;
    }

    const payload: CreateGeofencePayload = {
      name: trimmed,
      type,
      deviceId,
      enabled,
    };

    if (type === 'circle') {
      payload.centerLatitude = fenceCenter.latitude;
      payload.centerLongitude = fenceCenter.longitude;
      payload.radiusMeters = radius;
    } else {
      payload.vertices = normalizePolygonVertices(polygonPoints).map((p) => ({
        latitude: p.latitude,
        longitude: p.longitude,
      }));
    }

    setSaving(true);
    setError(null);
    try {
      const created = await createGeofence(payload);
      upsertFence(created);
      navigation.goBack();
    } catch (e) {
      const message =
        e instanceof ApiError
          ? e.message
          : e instanceof Error
            ? e.message
            : '保存失败，请稍后重试';
      setError(message);
    } finally {
      setSaving(false);
    }
  };

  const decreaseRadius = () => {
    setRadius((value) => Math.max(MIN_RADIUS, value - RADIUS_STEP));
  };

  const increaseRadius = () => {
    setRadius((value) => Math.min(MAX_RADIUS, value + RADIUS_STEP));
  };

  const handleMapPress = (event: { nativeEvent: LatLng }) => {
    const { latitude, longitude } = event.nativeEvent;
    if (typeof latitude !== 'number' || typeof longitude !== 'number') return;

    const point = { latitude, longitude };
    if (type === 'polygon') {
      setPolygonPoints((prev) => appendPolygonVertex(prev, point));
      return;
    }

    setFenceCenter(point);
    void mapRef.current?.moveCamera({ target: point, zoom: 15 }, 200);
  };

  const handleFullscreenMapPress = (event: { nativeEvent: LatLng }) => {
    const { latitude, longitude } = event.nativeEvent;
    if (typeof latitude !== 'number' || typeof longitude !== 'number') return;
    setPolygonPoints((prev) =>
      appendPolygonVertex(prev, { latitude, longitude }),
    );
  };

  const handleCameraIdle = (event: {
    nativeEvent: { cameraPosition: CameraPosition };
  }) => {
    if (type !== 'circle') return;
    const target = event.nativeEvent.cameraPosition.target;
    if (
      target &&
      typeof target.latitude === 'number' &&
      typeof target.longitude === 'number'
    ) {
      setFenceCenter(target);
    }
  };

  const clearPolygonPoints = () => {
    setPolygonPoints([]);
  };

  const removePolygonPoint = (index: number) => {
    setPolygonPoints((prev) => {
      const vertices = getPolygonVerticesForDisplay(prev);
      return vertices.filter((_, vertexIndex) => vertexIndex !== index);
    });
  };

  const handleVertexDragStart = (index: number) => {
    const vertices = getPolygonVerticesForDisplay(polygonPointsRef.current);
    setFrozenMarkerPositions(vertices);
    setDraggingVertexIndex(index);
  };

  const flushPendingVertexDrag = () => {
    vertexDragFrameRef.current = null;
    const pending = pendingVertexDragRef.current;
    if (!pending) return;
    const { index, point } = pending;
    setPolygonPoints((prev) => replacePolygonVertexAt(prev, index, point));
  };

  const handleVertexDrag = (index: number, point: LatLng) => {
    pendingVertexDragRef.current = { index, point };
    if (vertexDragFrameRef.current != null) return;
    vertexDragFrameRef.current = requestAnimationFrame(flushPendingVertexDrag);
  };

  const handleVertexDragEnd = (index: number, point: LatLng) => {
    if (vertexDragFrameRef.current != null) {
      cancelAnimationFrame(vertexDragFrameRef.current);
      vertexDragFrameRef.current = null;
    }
    pendingVertexDragRef.current = { index, point };
    flushPendingVertexDrag();
    pendingVertexDragRef.current = null;
    setDraggingVertexIndex(null);
    setFrozenMarkerPositions(null);
    // 拖动结束后重建 Marker，避免高德 SDK 复用 annotation 导致全部消失
    setMarkerLayerKey((key) => key + 1);
  };

  useEffect(
    () => () => {
      if (vertexDragFrameRef.current != null) {
        cancelAnimationFrame(vertexDragFrameRef.current);
      }
    },
    [],
  );

  const openPolygonMapFullscreen = () => {
    if (type !== 'polygon') return;
    setPolygonMapFullscreen(true);
  };

  const closePolygonMapFullscreen = () => {
    setPolygonMapFullscreen(false);
    setDraggingVertexIndex(null);
    setFrozenMarkerPositions(null);
  };

  const handleTypeChange = (nextType: FenceType) => {
    setType(nextType);
    if (nextType !== 'polygon') {
      setPolygonMapFullscreen(false);
    }
  };

  const showMap =
    isFocused &&
    mapHostReady &&
    mapHasSize &&
    initialCamera &&
    Platform.OS !== 'web';

  const showFullscreenMap =
    polygonMapFullscreen &&
    isFocused &&
    mapHostReady &&
    initialCamera &&
    Platform.OS !== 'web';

  const renderMapBody = (
    ref: React.RefObject<MapViewRef | null>,
    onPress: (event: { nativeEvent: LatLng }) => void,
    onCameraIdle?: (event: { nativeEvent: { cameraPosition: CameraPosition } }) => void,
  ) => {
    if (!initialCamera) {
      return (
        <View style={styles.mapPlaceholder}>
          <ActivityIndicator size="small" color={COLORS.primary} />
          <Text style={styles.mapPlaceholderText}>地图加载中...</Text>
        </View>
      );
    }

    if (Platform.OS === 'web') {
      return (
        <View style={styles.mapPlaceholder}>
          <Feather name="map" size={32} color={COLORS.textMuted} />
          <Text style={styles.mapPlaceholderText}>Web 端暂不支持地图</Text>
        </View>
      );
    }

    if (!showMap) {
      return (
        <View style={styles.mapPlaceholder}>
          <ActivityIndicator size="small" color={COLORS.primary} />
        </View>
      );
    }

    return (
      <MapView
        ref={ref}
        style={StyleSheet.absoluteFill}
        initialCameraPosition={initialCamera}
        myLocationEnabled={locationGranted}
        onMapPress={onPress}
        onCameraIdle={onCameraIdle}
      >
        <FenceMapLayers
          type={type}
          fenceCenter={fenceCenter}
          radius={radius}
          polygonPoints={polygonPoints}
        />
      </MapView>
    );
  };

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
          <Text style={styles.headerTitle}>设置电子围栏</Text>
          <View style={styles.headerRight} />
        </View>

        <View
          style={styles.mapContainer}
          collapsable={false}
          onLayout={(e) => {
            const { width, height } = e.nativeEvent.layout;
            if (width >= 2 && height >= 2) {
              setMapHasSize(true);
            }
          }}
        >
          {type === 'polygon' ? (
            <Pressable
              style={styles.mapPressable}
              onPress={openPolygonMapFullscreen}
              accessibilityRole="button"
              accessibilityLabel="全屏绘制多边形围栏"
            >
              {renderMapBody(mapRef, () => undefined)}
              <View style={styles.mapLaunchOverlay} pointerEvents="none">
                <View style={styles.mapLaunchBadge}>
                  <Feather name="maximize-2" size={16} color={COLORS.primary} />
                  <Text style={styles.mapLaunchText}>点击全屏绘制多边形</Text>
                </View>
                {getPolygonVerticesForDisplay(polygonPoints).length > 0 ? (
                  <Text style={styles.mapLaunchSub}>
                    已选 {getPolygonVerticesForDisplay(polygonPoints).length} 个顶点
                  </Text>
                ) : null}
              </View>
            </Pressable>
          ) : (
            <>
              {renderMapBody(mapRef, handleMapPress, handleCameraIdle)}
              <View style={styles.mapHint} pointerEvents="none">
                <Text style={styles.mapHintText}>
                  拖动地图调整圆心，点击地图可设置中心
                </Text>
              </View>
            </>
          )}
        </View>

        <ScrollView
          style={styles.scroll}
          contentContainerStyle={styles.scrollContent}
          showsVerticalScrollIndicator={false}
          keyboardShouldPersistTaps="handled"
        >
          <View style={styles.field}>
            <Text style={styles.label}>围栏类型</Text>
            <View style={styles.typeRow}>
              <TypeOption
                label="圆形"
                active={type === 'circle'}
                onPress={() => handleTypeChange('circle')}
              />
              <TypeOption
                label="多边形"
                active={type === 'polygon'}
                onPress={() => handleTypeChange('polygon')}
              />
            </View>
          </View>

          <View style={styles.field}>
            <Text style={styles.label}>围栏名称</Text>
            <TextInput
              style={[styles.input, error ? styles.inputError : null]}
              placeholder="请输入围栏名称"
              placeholderTextColor={COLORS.textMuted}
              value={name}
              onChangeText={(value) => {
                setName(value);
                if (error) setError(null);
              }}
            />
            {error ? <Text style={styles.fieldError}>{error}</Text> : null}
          </View>

          {type === 'circle' ? (
            <View style={styles.field}>
              <Text style={styles.label}>围栏半径</Text>
              <View style={styles.radiusRow}>
                <Pressable style={styles.radiusButton} onPress={decreaseRadius}>
                  <Feather name="minus" size={18} color={COLORS.text} />
                </Pressable>
                <Text style={styles.radiusValue}>{radius} 米</Text>
                <Pressable style={styles.radiusButton} onPress={increaseRadius}>
                  <Feather name="plus" size={18} color={COLORS.text} />
                </Pressable>
              </View>
            </View>
          ) : null}

          <View style={styles.switchRow}>
            <View style={styles.switchTextCol}>
              <Text style={styles.switchTitle}>启用电子围栏</Text>
              <Text style={styles.switchSub}>宠物离开围栏范围时发送通知</Text>
            </View>
            <Switch
              value={enabled}
              onValueChange={setEnabled}
              trackColor={{ false: COLORS.border, true: COLORS.primarySoft }}
              thumbColor={enabled ? COLORS.primary : COLORS.surface}
            />
          </View>

          <Pressable
            style={[styles.saveButton, saving && styles.saveButtonDisabled]}
            onPress={() => void handleSave()}
            disabled={saving}
          >
            {saving ? (
              <ActivityIndicator color="#FFFFFF" />
            ) : (
              <Text style={styles.saveButtonText}>保存围栏</Text>
            )}
          </Pressable>
        </ScrollView>

        {showFullscreenMap ? (
          <View style={[styles.fullscreenOverlay, { paddingTop: insets.top }]}>
            <View style={styles.fullscreenHeader}>
              <Pressable
                style={styles.fullscreenCloseButton}
                onPress={closePolygonMapFullscreen}
                hitSlop={12}
              >
                <Feather name="x" size={22} color={COLORS.text} />
              </Pressable>
              <Text style={styles.fullscreenTitle}>绘制多边形围栏</Text>
              <Pressable
                style={styles.fullscreenDoneButton}
                onPress={closePolygonMapFullscreen}
              >
                <Text style={styles.fullscreenDoneText}>完成</Text>
              </Pressable>
            </View>

            <View style={styles.fullscreenMapContainer}>
              <MapView
                ref={fullscreenMapRef}
                style={StyleSheet.absoluteFill}
                initialCameraPosition={initialCamera}
                myLocationEnabled={locationGranted}
                onMapPress={handleFullscreenMapPress}
              >
                <FenceMapLayers
                  type="polygon"
                  fenceCenter={fenceCenter}
                  radius={radius}
                  polygonPoints={polygonPoints}
                  markerLayerKey={markerLayerKey}
                  draggingVertexIndex={draggingVertexIndex}
                  frozenMarkerPositions={frozenMarkerPositions}
                  onVertexDragStart={handleVertexDragStart}
                  onVertexDrag={handleVertexDrag}
                  onVertexDragEnd={handleVertexDragEnd}
                />
              </MapView>

              <View style={styles.fullscreenHint} pointerEvents="none">
                <Text style={styles.fullscreenHintText}>
                  点击添加顶点，长按拖动调整位置（至少 3 个，图形按位置自动闭合）
                </Text>
              </View>

              <View
                style={[
                  styles.fullscreenPointsWrap,
                  { bottom: Math.max(insets.bottom, 16) + 12 },
                ]}
              >
                <PolygonPointsPanel
                  points={getPolygonVerticesForDisplay(polygonPoints)}
                  onRemovePoint={removePolygonPoint}
                  onClear={clearPolygonPoints}
                />
              </View>
            </View>
          </View>
        ) : null}
      </View>
    </SafeAreaView>
  );
}

type TypeOptionProps = {
  label: string;
  active: boolean;
  onPress: () => void;
};

function TypeOption({ label, active, onPress }: TypeOptionProps) {
  return (
    <Pressable
      style={[styles.typeOption, active && styles.typeOptionActive]}
      onPress={onPress}
    >
      <Text style={[styles.typeOptionText, active && styles.typeOptionTextActive]}>
        {label}
      </Text>
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
    paddingHorizontal: 16,
    paddingVertical: 8,
  },
  backButton: {
    width: 40,
    height: 40,
    alignItems: 'center',
    justifyContent: 'center',
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: COLORS.text,
  },
  headerRight: {
    width: 40,
  },
  mapContainer: {
    height: MAP_HEIGHT,
    marginHorizontal: 24,
    marginBottom: 12,
    borderRadius: 16,
    overflow: 'hidden',
    backgroundColor: COLORS.surfaceMuted,
  },
  mapPressable: {
    flex: 1,
  },
  mapLaunchOverlay: {
    ...StyleSheet.absoluteFillObject,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    backgroundColor: 'rgba(255, 255, 255, 0.08)',
  },
  mapLaunchBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 20,
    backgroundColor: 'rgba(255, 255, 255, 0.94)',
  },
  mapLaunchText: {
    fontSize: 13,
    fontWeight: '600',
    color: COLORS.primary,
  },
  mapLaunchSub: {
    fontSize: 12,
    color: COLORS.surface,
    fontWeight: '500',
    textShadowColor: 'rgba(0, 0, 0, 0.35)',
    textShadowOffset: { width: 0, height: 1 },
    textShadowRadius: 2,
  },
  fullscreenOverlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: COLORS.background,
    zIndex: 50,
  },
  fullscreenHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 10,
    backgroundColor: COLORS.surface,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.border,
  },
  fullscreenCloseButton: {
    width: 40,
    height: 40,
    alignItems: 'center',
    justifyContent: 'center',
  },
  fullscreenTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: COLORS.text,
  },
  fullscreenDoneButton: {
    minWidth: 40,
    height: 40,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 4,
  },
  fullscreenDoneText: {
    fontSize: 15,
    fontWeight: '600',
    color: COLORS.primary,
  },
  fullscreenMapContainer: {
    flex: 1,
    backgroundColor: COLORS.surfaceMuted,
  },
  fullscreenHint: {
    position: 'absolute',
    top: 12,
    left: 16,
    right: 16,
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 10,
    backgroundColor: 'rgba(255, 255, 255, 0.92)',
  },
  fullscreenHintText: {
    fontSize: 12,
    color: COLORS.textSecondary,
    textAlign: 'center',
  },
  fullscreenPointsWrap: {
    position: 'absolute',
    right: 16,
    maxHeight: 260,
  },
  pointsPanel: {
    width: 168,
    maxHeight: 260,
    borderRadius: 14,
    backgroundColor: COLORS.surface,
    paddingHorizontal: 10,
    paddingVertical: 10,
    gap: 8,
    ...shadowCard,
  },
  pointsPanelHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  pointsPanelHeaderActions: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  pointsPanelCollapsed: {
    width: 40,
    borderRadius: 14,
    backgroundColor: COLORS.surface,
    paddingVertical: 12,
    paddingHorizontal: 8,
    alignItems: 'center',
    gap: 8,
    ...shadowCard,
  },
  pointsPanelCollapsedBadge: {
    minWidth: 22,
    height: 22,
    borderRadius: 11,
    paddingHorizontal: 6,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: COLORS.primarySoft,
  },
  pointsPanelCollapsedCount: {
    fontSize: 12,
    fontWeight: '700',
    color: COLORS.primary,
  },
  pointsPanelCollapsedLabel: {
    fontSize: 11,
    fontWeight: '600',
    color: COLORS.textSecondary,
  },
  pointsPanelTitle: {
    fontSize: 13,
    fontWeight: '600',
    color: COLORS.text,
  },
  pointsPanelCountBadge: {
    minWidth: 22,
    height: 22,
    borderRadius: 11,
    paddingHorizontal: 6,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: COLORS.primarySoft,
  },
  pointsPanelCount: {
    fontSize: 12,
    fontWeight: '700',
    color: COLORS.primary,
  },
  pointsPanelEmpty: {
    fontSize: 12,
    color: COLORS.textMuted,
    lineHeight: 18,
  },
  pointsList: {
    maxHeight: 160,
  },
  pointRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingVertical: 6,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: COLORS.border,
  },
  pointRowText: {
    flex: 1,
    gap: 2,
  },
  pointIndex: {
    fontSize: 12,
    fontWeight: '600',
    color: COLORS.text,
  },
  pointCoord: {
    fontSize: 10,
    color: COLORS.textSecondary,
  },
  pointRemoveButton: {
    width: 22,
    height: 22,
    borderRadius: 11,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: COLORS.background,
  },
  pointsClearButton: {
    alignItems: 'center',
    paddingVertical: 4,
  },
  pointsClearText: {
    fontSize: 12,
    fontWeight: '600',
    color: COLORS.danger,
  },
  mapPlaceholder: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
  },
  mapPlaceholderText: {
    fontSize: 13,
    color: COLORS.textSecondary,
  },
  mapHint: {
    position: 'absolute',
    left: 12,
    right: 12,
    bottom: 12,
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 10,
    backgroundColor: 'rgba(255, 255, 255, 0.92)',
  },
  mapHintText: {
    fontSize: 12,
    color: COLORS.textSecondary,
    textAlign: 'center',
    lineHeight: 18,
  },
  scroll: {
    flex: 1,
  },
  scrollContent: {
    paddingHorizontal: 24,
    paddingBottom: 32,
    gap: 20,
  },
  field: {
    gap: 8,
  },
  label: {
    fontSize: 14,
    fontWeight: '500',
    color: COLORS.textSecondary,
  },
  typeRow: {
    flexDirection: 'row',
    gap: 10,
  },
  typeOption: {
    flex: 1,
    height: 44,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: COLORS.surface,
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  typeOptionActive: {
    borderColor: COLORS.primary,
    backgroundColor: COLORS.primarySoft,
  },
  typeOptionText: {
    fontSize: 14,
    fontWeight: '600',
    color: COLORS.textSecondary,
  },
  typeOptionTextActive: {
    color: COLORS.primary,
  },
  input: {
    height: 52,
    borderRadius: 12,
    backgroundColor: COLORS.surface,
    borderWidth: 1,
    borderColor: COLORS.border,
    paddingHorizontal: 16,
    fontSize: 16,
    color: COLORS.text,
  },
  inputError: {
    borderColor: COLORS.danger,
  },
  fieldError: {
    fontSize: 12,
    color: COLORS.danger,
    fontWeight: '500',
  },
  radiusRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 8,
    height: 52,
    borderRadius: 12,
    backgroundColor: COLORS.surface,
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  radiusButton: {
    width: 40,
    height: 40,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: COLORS.background,
  },
  radiusValue: {
    fontSize: 16,
    fontWeight: '600',
    color: COLORS.text,
  },
  switchRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 16,
    paddingHorizontal: 16,
    paddingVertical: 16,
    borderRadius: 12,
    backgroundColor: COLORS.surface,
    ...shadowCard,
  },
  switchTextCol: {
    flex: 1,
    gap: 4,
  },
  switchTitle: {
    fontSize: 15,
    fontWeight: '600',
    color: COLORS.text,
  },
  switchSub: {
    fontSize: 12,
    color: COLORS.textSecondary,
    lineHeight: 18,
  },
  saveButton: {
    height: 52,
    borderRadius: 12,
    backgroundColor: COLORS.primary,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 4,
  },
  saveButtonDisabled: {
    opacity: 0.7,
  },
  saveButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: COLORS.surface,
  },
});
