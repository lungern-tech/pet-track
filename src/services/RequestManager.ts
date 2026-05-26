import { API_BASE_URL, API_TIMEOUT_MS } from './apiConfig';
import { useAuthStore } from '../store/authStore';

export type HttpMethod = 'GET' | 'POST' | 'PUT' | 'PATCH' | 'DELETE';

export type RequestManagerOptions = {
  baseUrl?: string;
  timeoutMs?: number;
  defaultHeaders?: Record<string, string>;
};

export type RequestOptions = {
  /** URL 查询参数 */
  params?: Record<string, string | number | boolean | undefined | null>;
  /** JSON 请求体（对象会自动 JSON.stringify） */
  body?: unknown;
  headers?: Record<string, string>;
  signal?: AbortSignal;
  /** 为 true 时不附带 Authorization */
  skipAuth?: boolean;
};

export class ApiError extends Error {
  readonly status: number;
  readonly code?: string;
  readonly body?: unknown;

  constructor(
    message: string,
    options: { status: number; code?: string; body?: unknown },
  ) {
    super(message);
    this.name = 'ApiError';
    this.status = options.status;
    this.code = options.code;
    this.body = options.body;
  }
}

type BeforeRequestHook = (ctx: {
  url: string;
  method: HttpMethod;
  headers: Headers;
}) => void | Promise<void>;

type AfterResponseHook = (ctx: {
  url: string;
  method: HttpMethod;
  response: Response;
}) => void | Promise<void>;

/**
 * 应用内统一 HTTP 请求入口：基地址、超时、鉴权头、错误解析、可选钩子。
 * 建议在 TanStack Query 的 queryFn / mutationFn 中调用本类方法。
 */
export class RequestManager {
  private baseUrl: string;
  private timeoutMs: number;
  private defaultHeaders: Record<string, string>;
  private beforeRequestHooks: BeforeRequestHook[] = [];
  private afterResponseHooks: AfterResponseHook[] = [];

  constructor(options: RequestManagerOptions = {}) {
    this.baseUrl = (options.baseUrl ?? API_BASE_URL).replace(/\/$/, '');
    this.timeoutMs = options.timeoutMs ?? API_TIMEOUT_MS;
    this.defaultHeaders = {
      Accept: 'application/json',
      ...options.defaultHeaders,
    };
  }

  onBeforeRequest(hook: BeforeRequestHook): () => void {
    this.beforeRequestHooks.push(hook);
    return () => {
      this.beforeRequestHooks = this.beforeRequestHooks.filter((h) => h !== hook);
    };
  }

  onAfterResponse(hook: AfterResponseHook): () => void {
    this.afterResponseHooks.push(hook);
    return () => {
      this.afterResponseHooks = this.afterResponseHooks.filter((h) => h !== hook);
    };
  }

  setBaseUrl(url: string): void {
    this.baseUrl = url.replace(/\/$/, '');
  }

  private buildUrl(path: string, params?: RequestOptions['params']): string {
    const p = path.startsWith('/') ? path : `/${path}`;
    let url = `${this.baseUrl}${p}`;
    if (params) {
      const pairs: string[] = [];
      for (const [key, value] of Object.entries(params)) {
        if (value === undefined || value === null) continue;
        pairs.push(
          `${encodeURIComponent(key)}=${encodeURIComponent(String(value))}`,
        );
      }
      if (pairs.length > 0) {
        url += `?${pairs.join('&')}`;
      }
    }
    return url;
  }

  private getAccessToken(): string | null {
    return useAuthStore.getState().accessToken;
  }

  async request<T>(
    method: HttpMethod,
    path: string,
    options: RequestOptions = {},
  ): Promise<T> {
    const { params, body, headers: extraHeaders, signal, skipAuth } = options;
    const url = this.buildUrl(path, params);

    const headers = new Headers(this.defaultHeaders);
    if (extraHeaders) {
      for (const [k, v] of Object.entries(extraHeaders)) {
        headers.set(k, v);
      }
    }

    if (!skipAuth) {
      const token = this.getAccessToken();
      if (token) {
        headers.set('Authorization', `Bearer ${token}`);
      }
    }

    let requestBody: string | undefined;
    if (body !== undefined && body !== null) {
      if (typeof body === 'string' || body instanceof FormData) {
        if (typeof body === 'string') {
          requestBody = body;
          if (!headers.has('Content-Type')) {
            headers.set('Content-Type', 'application/json');
          }
        } else {
          requestBody = undefined;
        }
      } else {
        headers.set('Content-Type', 'application/json');
        requestBody = JSON.stringify(body);
      }
    }

    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), this.timeoutMs);
    if (signal) {
      if (signal.aborted) controller.abort();
      else signal.addEventListener('abort', () => controller.abort(), { once: true });
    }

    for (const hook of this.beforeRequestHooks) {
      await hook({ url, method, headers });
    }

    if (__DEV__) {
      console.log(
        `[RequestManager] >>> ${method} ${url}`,
        requestBody ? `\n  body: ${requestBody.slice(0, 200)}` : '',
      );
    }

    let response: Response;
    try {
      response = await fetch(url, {
        method,
        headers,
        body:
          body instanceof FormData
            ? body
            : requestBody !== undefined
              ? requestBody
              : undefined,
        signal: controller.signal,
        redirect: 'manual',
      });
    } catch (e: unknown) {
      clearTimeout(timeoutId);
      if (__DEV__) {
        console.log(`[RequestManager] !!! ${method} ${url} 网络错误:`, e);
      }
      const msg =
        e instanceof Error
          ? e.name === 'AbortError'
            ? '请求超时或已取消'
            : e.message
          : '网络异常';
      throw new ApiError(msg, { status: 0 });
    }

    clearTimeout(timeoutId);

    if (__DEV__) {
      const loc = response.headers.get('location');
      console.log(
        `[RequestManager] <<< ${method} ${url}`,
        `\n  status: ${response.status}`,
        `\n  redirected: ${response.redirected}`,
        `\n  response url: ${response.url}`,
        loc ? `\n  location: ${loc}` : '',
      );
    }

    if (response.status >= 300 && response.status < 400) {
      const location = response.headers.get('location') ?? '';
      if (__DEV__) {
        console.warn(
          `[RequestManager] 服务端重定向: ${response.status} → ${location}`,
        );
      }
      throw new ApiError(
        `请求被重定向 (${response.status})，目标: ${location}`,
        { status: response.status },
      );
    }

    for (const hook of this.afterResponseHooks) {
      await hook({ url, method, response });
    }

    const contentType = response.headers.get('content-type') ?? '';
    const isJson = contentType.includes('application/json');

    let parsed: unknown;
    if (response.status === 204 || response.headers.get('content-length') === '0') {
      parsed = undefined;
    } else if (isJson) {
      const text = await response.text();
      parsed = text ? JSON.parse(text) : undefined;
    } else {
      parsed = await response.text();
    }

    if (!response.ok) {
      const message = this.extractErrorMessage(parsed, response.statusText);
      const code =
        parsed &&
        typeof parsed === 'object' &&
        'code' in parsed &&
        typeof (parsed as { code: unknown }).code === 'string'
          ? (parsed as { code: string }).code
          : undefined;
      throw new ApiError(message, {
        status: response.status,
        code,
        body: parsed,
      });
    }

    return parsed as T;
  }

  private extractErrorMessage(parsed: unknown, fallback: string): string {
    if (parsed && typeof parsed === 'object') {
      const o = parsed as Record<string, unknown>;
      if (typeof o.message === 'string') return o.message;
      if (typeof o.error === 'string') return o.error;
      if (typeof o.msg === 'string') return o.msg;
    }
    if (typeof parsed === 'string' && parsed.trim()) return parsed;
    return fallback || '请求失败';
  }

  get<T>(path: string, options?: Omit<RequestOptions, 'body'>): Promise<T> {
    return this.request<T>('GET', path, options);
  }

  post<T>(path: string, body?: unknown, options?: Omit<RequestOptions, 'body'>): Promise<T> {
    return this.request<T>('POST', path, { ...options, body });
  }

  put<T>(path: string, body?: unknown, options?: Omit<RequestOptions, 'body'>): Promise<T> {
    return this.request<T>('PUT', path, { ...options, body });
  }

  patch<T>(path: string, body?: unknown, options?: Omit<RequestOptions, 'body'>): Promise<T> {
    return this.request<T>('PATCH', path, { ...options, body });
  }

  delete<T>(path: string, options?: Omit<RequestOptions, 'body'>): Promise<T> {
    return this.request<T>('DELETE', path, options);
  }
}

/** 默认单例，业务代码优先使用 */
export const requestManager = new RequestManager();
