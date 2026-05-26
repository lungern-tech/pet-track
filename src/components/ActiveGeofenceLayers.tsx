import React, { useMemo } from 'react';
import { Circle, Polygon } from 'expo-gaode-map';
import type { LatLng } from 'expo-gaode-map';

import type { FenceRecord } from '../types/fence';
import { getPolygonFillPoints } from '../utils/polygon';

const FENCE_STROKE = '#3D8A5A';
const FENCE_FILL = 'rgba(61, 138, 90, 0.18)';

function isRenderableCircle(fence: FenceRecord): boolean {
  return (
    fence.type === 'circle' &&
    typeof fence.centerLatitude === 'number' &&
    typeof fence.centerLongitude === 'number' &&
    typeof fence.radiusMeters === 'number' &&
    fence.radiusMeters > 0
  );
}

function isRenderablePolygon(fence: FenceRecord): boolean {
  return (
    fence.type === 'polygon' &&
    Array.isArray(fence.vertices) &&
    fence.vertices.length >= 3
  );
}

function verticesToLatLng(vertices: NonNullable<FenceRecord['vertices']>): LatLng[] {
  return vertices.map((v) => ({
    latitude: v.latitude,
    longitude: v.longitude,
  }));
}

export function filterActiveGeofences(
  fences: FenceRecord[],
  linkedDeviceId?: number | null,
): FenceRecord[] {
  return fences.filter((fence) => {
    if (!fence.enabled) return false;
    if (
      linkedDeviceId != null &&
      fence.deviceId != null &&
      fence.deviceId !== linkedDeviceId
    ) {
      return false;
    }
    return isRenderableCircle(fence) || isRenderablePolygon(fence);
  });
}

type ActiveGeofenceLayersProps = {
  fences: FenceRecord[];
  /** 当前宠物绑定的设备 id，仅显示该设备下的围栏 */
  linkedDeviceId?: number | null;
};

export function ActiveGeofenceLayers({
  fences,
  linkedDeviceId,
}: ActiveGeofenceLayersProps) {
  const activeFences = useMemo(
    () => filterActiveGeofences(fences, linkedDeviceId),
    [fences, linkedDeviceId],
  );

  return (
    <>
      {activeFences.map((fence) => {
        if (fence.type === 'circle' && isRenderableCircle(fence)) {
          return (
            <Circle
              key={`geofence-circle-${fence.id}`}
              center={{
                latitude: fence.centerLatitude!,
                longitude: fence.centerLongitude!,
              }}
              radius={fence.radiusMeters!}
              strokeWidth={2}
              strokeColor={FENCE_STROKE}
              fillColor={FENCE_FILL}
              zIndex={1}
            />
          );
        }

        if (fence.type === 'polygon' && isRenderablePolygon(fence)) {
          const fill = getPolygonFillPoints(verticesToLatLng(fence.vertices!));
          if (fill.length < 4) return null;
          return (
            <Polygon
              key={`geofence-polygon-${fence.id}`}
              points={fill}
              strokeWidth={2}
              strokeColor={FENCE_STROKE}
              fillColor={FENCE_FILL}
              zIndex={1}
            />
          );
        }

        return null;
      })}
    </>
  );
}
