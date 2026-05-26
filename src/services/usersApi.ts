import { requestManager } from './RequestManager';

export type RegisterPayload = {
  email: string;
  password: string;
  displayName: string;
};

/** POST /users/register 成功响应 */
export type RegisterSuccessResponse = {
  id: number;
  email: string;
  displayName: string;
  createdAt: string;
};

/**
 * POST /users/register（无需登录态）
 */
export function registerUser(payload: RegisterPayload) {
  return requestManager.post<RegisterSuccessResponse>(
    '/users/register',
    payload,
    {
      skipAuth: true,
    },
  );
}
