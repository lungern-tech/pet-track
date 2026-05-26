/**
 * 全局 API 配置。上线前改为真实网关地址，或通过 expo-constants / env 注入。
 */
let API_BASE_URL: string;
if (process.env.NODE_ENV === 'development') {
  API_BASE_URL = 'http://192.168.50.93:3030';
} else {
  API_BASE_URL = 'https://pet-track-service.onrender.com';
}

export { API_BASE_URL };

/** 单次请求超时（毫秒） */
export const API_TIMEOUT_MS = 30_000;
