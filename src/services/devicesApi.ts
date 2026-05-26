import { requestManager } from './RequestManager';

export type RegisterDevicePayload = {
  deviceId: string;
  name: string;
  avatarUrl: string;
};

/** POST /devices 成功响应 */
export type DeviceRecord = {
  id: number;
  deviceId: string;
  name: string;
  avatarUrl: string;
  createdAt: string;
  updatedAt: string;
};

/**
 * POST /devices（需登录态）
 */
export function registerDevice(payload: RegisterDevicePayload) {
  return requestManager.post<DeviceRecord>('/devices', payload);
}

function normalizeDevicesList(raw: unknown): DeviceRecord[] {
  if (Array.isArray(raw)) {
    return raw as DeviceRecord[];
  }
  if (raw && typeof raw === 'object') {
    const o = raw as Record<string, unknown>;
    if (Array.isArray(o.data)) return o.data as DeviceRecord[];
    if (Array.isArray(o.devices)) return o.devices as DeviceRecord[];
    if (Array.isArray(o.items)) return o.items as DeviceRecord[];
  }
  return [];
}

/**
 * GET /devices（需登录态）— 项圈列表
 */
export async function fetchDevices(): Promise<DeviceRecord[]> {
  const raw = await requestManager.get<unknown>('/devices');
  return normalizeDevicesList(raw);
}
