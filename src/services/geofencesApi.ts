import type { FenceType } from '../types/fence';
import type { FenceRecord, GeofenceVertex } from '../types/fence';
import { requestManager } from './RequestManager';

export type CreateGeofencePayload = {
  name: string;
  type: FenceType;
  deviceId?: number;
  enabled?: boolean;
  centerLatitude?: number;
  centerLongitude?: number;
  radiusMeters?: number;
  vertices?: GeofenceVertex[];
};

export type UpdateGeofencePayload = {
  name?: string;
  type?: FenceType;
  deviceId?: number | null;
  enabled?: boolean;
  centerLatitude?: number;
  centerLongitude?: number;
  radiusMeters?: number;
  vertices?: GeofenceVertex[];
};

function asRecord(v: unknown): Record<string, unknown> | null {
  if (v && typeof v === 'object' && !Array.isArray(v)) {
    return v as Record<string, unknown>;
  }
  return null;
}

function pickNumber(v: unknown): number | null {
  if (typeof v === 'number' && Number.isFinite(v)) return v;
  if (typeof v === 'string' && v.trim()) {
    const n = Number(v);
    return Number.isFinite(n) ? n : null;
  }
  return null;
}

function pickBoolean(v: unknown, fallback = false): boolean {
  if (typeof v === 'boolean') return v;
  return fallback;
}

function pickString(v: unknown): string {
  return typeof v === 'string' ? v : '';
}

function normalizeVertex(raw: unknown): GeofenceVertex | null {
  const o = asRecord(raw);
  if (!o) return null;
  const latitude = pickNumber(o.latitude);
  const longitude = pickNumber(o.longitude);
  if (latitude == null || longitude == null) return null;
  return { latitude, longitude };
}

function normalizeVertices(raw: unknown): GeofenceVertex[] | null {
  if (!Array.isArray(raw)) return null;
  const list = raw.map(normalizeVertex).filter((v): v is GeofenceVertex => v != null);
  return list.length > 0 ? list : null;
}

export function normalizeGeofence(raw: unknown): FenceRecord {
  const root = asRecord(raw) ?? {};
  const inner =
    asRecord(root.data) ?? asRecord(root.result) ?? asRecord(root.payload) ?? root;

  const id = pickNumber(inner.id) ?? 0;
  const typeRaw = pickString(inner.type);
  const type: FenceType = typeRaw === 'polygon' ? 'polygon' : 'circle';

  return {
    id,
    name: pickString(inner.name),
    type,
    enabled: pickBoolean(inner.enabled, true),
    deviceId: pickNumber(inner.deviceId),
    centerLatitude: pickNumber(inner.centerLatitude),
    centerLongitude: pickNumber(inner.centerLongitude),
    radiusMeters: pickNumber(inner.radiusMeters),
    vertices: normalizeVertices(inner.vertices),
    createdAt: pickString(inner.createdAt) || undefined,
    updatedAt: pickString(inner.updatedAt) || undefined,
  };
}

function normalizeGeofenceList(raw: unknown): FenceRecord[] {
  if (Array.isArray(raw)) return raw.map(normalizeGeofence);
  const root = asRecord(raw);
  if (!root) return [];
  const inner =
    (Array.isArray(root.data) && root.data) ||
    (Array.isArray(root.items) && root.items) ||
    (Array.isArray(root.geofences) && root.geofences) ||
    null;
  if (Array.isArray(inner)) return inner.map(normalizeGeofence);
  return [];
}

/** POST /geofences */
export async function createGeofence(
  payload: CreateGeofencePayload,
): Promise<FenceRecord> {
  const raw = await requestManager.post<unknown>('/geofences', payload);
  return normalizeGeofence(raw);
}

/** GET /geofences */
export async function fetchGeofences(): Promise<FenceRecord[]> {
  const raw = await requestManager.get<unknown>('/geofences');
  return normalizeGeofenceList(raw);
}

/** GET /geofences/:id */
export async function fetchGeofence(id: number): Promise<FenceRecord> {
  const raw = await requestManager.get<unknown>(`/geofences/${id}`);
  return normalizeGeofence(raw);
}

/** PATCH /geofences/:id */
export async function updateGeofence(
  id: number,
  payload: UpdateGeofencePayload,
): Promise<FenceRecord> {
  const raw = await requestManager.patch<unknown>(`/geofences/${id}`, payload);
  return normalizeGeofence(raw);
}

/** DELETE /geofences/:id */
export async function deleteGeofence(id: number): Promise<void> {
  await requestManager.delete(`/geofences/${id}`);
}
