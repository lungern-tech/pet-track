import { ApiError, requestManager } from './RequestManager';
import { useAuthStore } from '../store/authStore';

const UPLOAD_PATH = '/public/upload/image';

/** 与后端 multipart 字段名一致时可改，常见为 file / image */
export const DEFAULT_IMAGE_FIELD_NAME = 'file';

export type ImageUploadPart = {
  uri: string;
  name?: string;
  type?: string;
};

/** POST /public/upload/image 成功响应 */
export type UploadImageResponse = {
  key: string;
  url: string;
};

/**
 * 构造 multipart 请求体（React Native：append 需带 uri / name / type）
 */
export function buildImageFormData(
  file: ImageUploadPart,
  fieldName: string = DEFAULT_IMAGE_FIELD_NAME,
): FormData {
  const form = new FormData();
  const name = file.name ?? 'image.jpg';
  const type = file.type ?? 'image/jpeg';
  form.append(fieldName, {
    uri: file.uri,
    name,
    type,
  } as unknown as Blob);
  return form;
}

/**
 * POST /public/upload/image
 * 使用当前登录态的 Bearer token（不设置 skipAuth）。
 */
export async function uploadPublicImage<T = UploadImageResponse>(
  formData: FormData,
  options?: { signal?: AbortSignal },
): Promise<T> {
  const token = useAuthStore.getState().accessToken;
  if (!token?.trim()) {
    throw new ApiError('未登录或登录已失效，请先登录', { status: 401 });
  }

  return requestManager.post<T>(UPLOAD_PATH, formData, {
    signal: options?.signal,
    skipAuth: false,
  });
}

/**
 * 从相册/相机等得到的 uri 一键上传（默认字段名 {@link DEFAULT_IMAGE_FIELD_NAME}）。
 */
export async function uploadPublicImageFromUri<T = UploadImageResponse>(
  file: ImageUploadPart,
  options?: { signal?: AbortSignal; fieldName?: string },
): Promise<T> {
  const form = buildImageFormData(file, options?.fieldName ?? DEFAULT_IMAGE_FIELD_NAME);
  return uploadPublicImage<T>(form, { signal: options?.signal });
}
