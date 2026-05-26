import { requestManager } from './RequestManager';

export type LoginPayload = {
  email: string;
  password: string;
};

/** POST /auth/login 成功响应（应用内统一形状） */
export type AuthSuccessResponse = {
  accessToken: string;
  user: {
    id: number;
    email: string;
    displayName: string;
  };
};

function asRecord(v: unknown): Record<string, unknown> | null {
  if (v && typeof v === 'object' && !Array.isArray(v)) {
    return v as Record<string, unknown>;
  }
  return null;
}

function pickString(r: Record<string, unknown>, ...keys: string[]): string | undefined {
  for (const k of keys) {
    const v = r[k];
    if (typeof v === 'string') return v;
  }
  return undefined;
}

/**
 * 将后端多种常见 JSON 形状归一为 AuthSuccessResponse：
 * - 字段在 data 内或根上
 * - accessToken / access_token / token
 * - user 嵌套或与 token 同级（扁平）
 * - display_name、nickname 等 snake_case / 别名
 */
export function normalizeLoginResponse(raw: unknown): AuthSuccessResponse {
  const root = asRecord(raw);
  if (!root) {
    throw new Error('登录响应格式错误');
  }

  const inner =
    asRecord(root.data) ?? asRecord(root.result) ?? asRecord(root.payload) ?? root;

  const accessToken =
    pickString(inner, 'accessToken', 'access_token', 'token') ?? '';

  if (!accessToken) {
    throw new Error('登录响应缺少令牌');
  }

  const userObj = asRecord(inner.user);
  const src: Record<string, unknown> = userObj ? { ...inner, ...userObj } : { ...inner };

  const idRaw = src.id ?? src.userId ?? src.user_id;
  let id: number;
  if (typeof idRaw === 'number' && Number.isFinite(idRaw)) {
    id = idRaw;
  } else if (typeof idRaw === 'string' && idRaw.trim()) {
    const n = Number(idRaw);
    id = Number.isFinite(n) ? n : NaN;
  } else {
    id = NaN;
  }
  if (!Number.isFinite(id)) {
    throw new Error('登录响应缺少用户 id');
  }

  const email =
    pickString(src, 'email', 'userEmail', 'user_email', 'mail') ?? '';
  const displayName =
    pickString(src, 'displayName', 'display_name', 'nickname', 'name', 'username') ??
    '';

  return {
    accessToken,
    user: {
      id,
      email,
      displayName,
    },
  };
}

/**
 * POST /auth/login（无需登录态）
 */
export async function loginUser(payload: LoginPayload): Promise<AuthSuccessResponse> {
  const raw = await requestManager.post<unknown>('/auth/login', payload, {
    skipAuth: true,
  });
  return normalizeLoginResponse(raw);
}
