import { Platform, PermissionsAndroid } from 'react-native';
import { BleManager, Device, State } from 'react-native-ble-plx';

export type BleDeviceInfo = {
  id: string;
  name: string;
  rssi: number;
  isConnectable: boolean;
};

let manager: BleManager | null = null;

function getManager(): BleManager {
  if (!manager) {
    manager = new BleManager();
  }
  return manager;
}

export async function requestPermissions(): Promise<boolean> {
  if (Platform.OS === 'ios') {
    return true;
  }

  if (Platform.OS === 'android') {
    const apiLevel = Platform.Version;

    if (apiLevel >= 31) {
      const results = await PermissionsAndroid.requestMultiple([
        PermissionsAndroid.PERMISSIONS.BLUETOOTH_SCAN,
        PermissionsAndroid.PERMISSIONS.BLUETOOTH_CONNECT,
        PermissionsAndroid.PERMISSIONS.ACCESS_FINE_LOCATION,
      ]);

      return Object.values(results).every(
        (r) => r === PermissionsAndroid.RESULTS.GRANTED,
      );
    }

    const result = await PermissionsAndroid.request(
      PermissionsAndroid.PERMISSIONS.ACCESS_FINE_LOCATION,
    );
    return result === PermissionsAndroid.RESULTS.GRANTED;
  }

  return false;
}

export function observeBluetoothState(
  onStateChange: (state: State) => void,
): () => void {
  const mgr = getManager();
  const subscription = mgr.onStateChange((state) => {
    onStateChange(state);
  }, true);

  const fallbackTimer = setTimeout(async () => {
    try {
      const currentState = await mgr.state();
      onStateChange(currentState);
    } catch {}
  }, 1500);

  return () => {
    clearTimeout(fallbackTimer);
    subscription.remove();
  };
}

export function startScan(
  onDeviceFound: (device: BleDeviceInfo) => void,
  onError?: (error: Error) => void,
): void {
  const mgr = getManager();
  const seen = new Set<string>();

  mgr.startDeviceScan(null, { allowDuplicates: false }, (error, device) => {
    if (error) {
      onError?.(error);
      return;
    }

    if (!device) return;
    const displayName =
      (device.name && device.name.trim()) ||
      (typeof (device as any).localName === 'string'
        ? String((device as any).localName).trim()
        : '') ||
      '未知设备';

    if (seen.has(device.id)) return;
    seen.add(device.id);

    onDeviceFound({
      id: device.id,
      name: displayName,
      rssi: device.rssi ?? -100,
      isConnectable: device.isConnectable ?? false,
    });
  });
}

export function stopScan(): void {
  getManager().stopDeviceScan();
}

export async function connectToDevice(
  deviceId: string,
): Promise<Device> {
  const mgr = getManager();
  const device = await mgr.connectToDevice(deviceId);
  await device.discoverAllServicesAndCharacteristics();
  return device;
}

export async function disconnectDevice(deviceId: string): Promise<void> {
  const mgr = getManager();
  await mgr.cancelDeviceConnection(deviceId);
}

export function destroy(): void {
  if (manager) {
    manager.destroy();
    manager = null;
  }
}
