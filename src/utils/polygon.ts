import type { LatLng } from 'expo-gaode-map';

const COORD_EPSILON = 1e-6;
const EARTH_RADIUS_M = 6_371_000;
/** 相邻顶点最小间距（米），避免重复点击产生零长度边 */
const MIN_VERTEX_DISTANCE_M = 3;

export function isSameLatLng(a: LatLng, b: LatLng, epsilon = COORD_EPSILON): boolean {
  return (
    Math.abs(a.latitude - b.latitude) <= epsilon &&
    Math.abs(a.longitude - b.longitude) <= epsilon
  );
}

export function distanceMeters(a: LatLng, b: LatLng): number {
  const lat1 = (a.latitude * Math.PI) / 180;
  const lat2 = (b.latitude * Math.PI) / 180;
  const dLat = lat2 - lat1;
  const dLng = ((b.longitude - a.longitude) * Math.PI) / 180;
  const h =
    Math.sin(dLat / 2) ** 2 +
    Math.cos(lat1) * Math.cos(lat2) * Math.sin(dLng / 2) ** 2;
  return 2 * EARTH_RADIUS_M * Math.asin(Math.min(1, Math.sqrt(h)));
}

/** 去掉首尾重复的闭合点，保留用户选择的顶点序列 */
export function normalizePolygonVertices(points: LatLng[]): LatLng[] {
  if (points.length === 0) return [];

  const ring = [...points];
  while (ring.length >= 2 && isSameLatLng(ring[0], ring[ring.length - 1])) {
    ring.pop();
  }
  return ring;
}

/** 过滤过近顶点，避免地图上出现重叠点或退化边 */
export function removeNearDuplicateVertices(
  points: LatLng[],
  minDistanceMeters = MIN_VERTEX_DISTANCE_M,
): LatLng[] {
  const vertices = normalizePolygonVertices(points);
  const result: LatLng[] = [];

  for (const point of vertices) {
    const tooClose = result.some(
      (existing) => distanceMeters(existing, point) < minDistanceMeters,
    );
    if (!tooClose) {
      result.push(point);
    }
  }

  return result;
}

function getCentroid(points: LatLng[]): LatLng {
  if (points.length === 0) {
    return { latitude: 0, longitude: 0 };
  }

  const sum = points.reduce(
    (acc, point) => ({
      latitude: acc.latitude + point.latitude,
      longitude: acc.longitude + point.longitude,
    }),
    { latitude: 0, longitude: 0 },
  );

  return {
    latitude: sum.latitude / points.length,
    longitude: sum.longitude / points.length,
  };
}

function getPolarAngle(centroid: LatLng, point: LatLng): number {
  return Math.atan2(
    point.latitude - centroid.latitude,
    point.longitude - centroid.longitude,
  );
}

/**
 * 按质心极角排序顶点，使边按空间位置依次相连，而不是点击顺序。
 */
export function orderPolygonVertices(points: LatLng[]): LatLng[] {
  const vertices = removeNearDuplicateVertices(points);
  if (vertices.length <= 2) {
    return vertices;
  }

  const centroid = getCentroid(vertices);
  return [...vertices].sort((a, b) => {
    const angleDiff = getPolarAngle(centroid, a) - getPolarAngle(centroid, b);
    if (Math.abs(angleDiff) > COORD_EPSILON) {
      return angleDiff;
    }
    return distanceMeters(centroid, a) - distanceMeters(centroid, b);
  });
}

/** 新增顶点：保留点击顺序，仅过滤过近重复点 */
export function appendPolygonVertex(points: LatLng[], point: LatLng): LatLng[] {
  if (!canAppendPolygonVertex(points, point)) {
    return points;
  }
  return [...normalizePolygonVertices(points), point];
}

export function canAppendPolygonVertex(
  points: LatLng[],
  point: LatLng,
  minDistanceMeters = MIN_VERTEX_DISTANCE_M,
): boolean {
  const vertices = normalizePolygonVertices(points);
  if (vertices.length === 0) return true;
  return vertices.every(
    (existing) => distanceMeters(existing, point) >= minDistanceMeters,
  );
}

/** 生成闭合描边路径：末尾补回起点 */
export function closePolygonRing(points: LatLng[]): LatLng[] {
  const vertices = orderPolygonVertices(points);
  if (vertices.length < 2) return vertices;

  const first = vertices[0];
  const last = vertices[vertices.length - 1];
  if (isSameLatLng(first, last)) {
    return vertices;
  }
  return [...vertices, first];
}

/** 绘制中（顶点不足 3 个）时使用折线预览 */
export function getPolygonOutlinePoints(points: LatLng[]): LatLng[] {
  const vertices = orderPolygonVertices(points);
  if (vertices.length < 2) return vertices;
  if (vertices.length === 2) return vertices;
  return closePolygonRing(vertices);
}

/** 填充多边形：至少 3 个不同顶点，并保证传给地图的是闭合环 */
export function getPolygonFillPoints(points: LatLng[]): LatLng[] {
  const vertices = orderPolygonVertices(points);
  if (vertices.length < 3) return [];
  return closePolygonRing(vertices);
}

export function isValidPolygon(points: LatLng[]): boolean {
  return orderPolygonVertices(points).length >= 3;
}

/** 标记点与列表面板使用：保留点击顺序，不去除拖动中的近点 */
export function getPolygonVerticesForDisplay(points: LatLng[]): LatLng[] {
  return normalizePolygonVertices(points);
}

/** 按展示序号替换单个顶点（基于索引，避免坐标匹配失败） */
export function replacePolygonVertexAt(
  points: LatLng[],
  vertexIndex: number,
  nextPoint: LatLng,
): LatLng[] {
  const vertices = normalizePolygonVertices(points);
  if (vertexIndex < 0 || vertexIndex >= vertices.length) {
    return vertices;
  }

  const updated = [...vertices];
  updated[vertexIndex] = nextPoint;
  return updated;
}

/** 拖动预览：始终应用坐标，用于围栏区域实时跟随 */
export function previewPolygonVertex(
  points: LatLng[],
  vertexIndex: number,
  nextPoint: LatLng,
): LatLng[] {
  return replacePolygonVertexAt(points, vertexIndex, nextPoint);
}

/** 拖动顶点：保留点击顺序，避免与其他顶点过近 */
export function movePolygonVertex(
  points: LatLng[],
  vertexIndex: number,
  nextPoint: LatLng,
  minDistanceMeters = MIN_VERTEX_DISTANCE_M,
): LatLng[] {
  const vertices = getPolygonVerticesForDisplay(points);
  const target = vertices[vertexIndex];
  if (!target) return points;

  const tooClose = vertices.some(
    (existing, index) =>
      index !== vertexIndex &&
      distanceMeters(existing, nextPoint) < minDistanceMeters,
  );
  if (tooClose) return points;

  return replacePolygonVertexAt(points, vertexIndex, nextPoint);
}
