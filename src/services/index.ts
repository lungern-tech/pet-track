export type { BleDeviceInfo } from './BleService';
export {
  requestPermissions,
  observeBluetoothState,
  startScan,
  stopScan,
  connectToDevice,
  disconnectDevice,
  destroy,
} from './BleService';

export {
  RequestManager,
  ApiError,
  requestManager,
} from './RequestManager';
export type {
  HttpMethod,
  RequestManagerOptions,
  RequestOptions,
} from './RequestManager';

export { API_BASE_URL, API_TIMEOUT_MS } from './apiConfig';

export { registerUser } from './usersApi';
export type { RegisterPayload, RegisterSuccessResponse } from './usersApi';

export { loginUser } from './authApi';
export type {
  LoginPayload,
  AuthSuccessResponse,
} from './authApi';

export {
  uploadPublicImage,
  uploadPublicImageFromUri,
  buildImageFormData,
  DEFAULT_IMAGE_FIELD_NAME,
} from './uploadApi';
export type { ImageUploadPart, UploadImageResponse } from './uploadApi';

export { registerDevice, fetchDevices } from './devicesApi';
export type { RegisterDevicePayload, DeviceRecord } from './devicesApi';

export { createPet, fetchPets } from './petsApi';
export type { CreatePetPayload, PetRecord } from './petsApi';
