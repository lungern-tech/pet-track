export type FenceType = 'circle' | 'polygon';

export type GeofenceVertex = {
  latitude: number;
  longitude: number;
};

export type FenceRecord = {
  id: number;
  name: string;
  type: FenceType;
  enabled: boolean;
  deviceId: number | null;
  centerLatitude?: number | null;
  centerLongitude?: number | null;
  radiusMeters?: number | null;
  vertices?: GeofenceVertex[] | null;
  createdAt?: string;
  updatedAt?: string;
};

export function getFenceSummary(fence: FenceRecord): string {
  if (fence.type === 'circle') {
    const radius = fence.radiusMeters ?? 500;
    return fence.enabled
      ? `圆形 · ${radius}米 · 进出围栏提醒`
      : `圆形 · ${radius}米 · 已关闭`;
  }
  const count = fence.vertices?.length ?? 0;
  const vertexHint = count > 0 ? `${count} 个顶点 · ` : '';
  return fence.enabled
    ? `${vertexHint}自定义多边形 · 进出围栏提醒`
    : `${vertexHint}自定义多边形 · 已关闭`;
}
