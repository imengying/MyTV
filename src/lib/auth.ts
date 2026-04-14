import type { NextRequest } from 'next/server';

export type UserRole = 'owner' | 'admin' | 'user';

export interface AuthCookiePayload {
  username?: string;
  signature?: string;
  timestamp?: number;
}

export interface ClientAuthInfo {
  username: string;
  role: UserRole;
}

const CLIENT_AUTH_STORAGE_KEY = 'mytv_auth_meta';

// 从cookie获取认证信息 (服务端使用)
export function getAuthInfoFromCookie(
  request: NextRequest,
): AuthCookiePayload | null {
  const authCookie = request.cookies.get('auth');

  if (!authCookie) {
    return null;
  }

  try {
    const decoded = decodeURIComponent(authCookie.value);
    const authData = JSON.parse(decoded) as AuthCookiePayload;

    return {
      username:
        typeof authData.username === 'string' ? authData.username : undefined,
      signature:
        typeof authData.signature === 'string'
          ? authData.signature
          : undefined,
      timestamp:
        typeof authData.timestamp === 'number' &&
        Number.isFinite(authData.timestamp)
          ? authData.timestamp
          : undefined,
    };
  } catch {
    return null;
  }
}

function normalizeClientAuthInfo(
  authInfo: Partial<ClientAuthInfo> | null | undefined,
): ClientAuthInfo | null {
  if (!authInfo || typeof authInfo.username !== 'string' || !authInfo.username) {
    return null;
  }

  return {
    username: authInfo.username,
    role:
      authInfo.role === 'owner' || authInfo.role === 'admin'
        ? authInfo.role
        : 'user',
  };
}

export function getClientAuthInfo(): ClientAuthInfo | null {
  if (typeof window === 'undefined') {
    return null;
  }

  try {
    const raw = window.localStorage.getItem(CLIENT_AUTH_STORAGE_KEY);
    if (!raw) {
      return null;
    }

    return normalizeClientAuthInfo(JSON.parse(raw) as Partial<ClientAuthInfo>);
  } catch {
    return null;
  }
}

export function setClientAuthInfo(authInfo: ClientAuthInfo | null): void {
  if (typeof window === 'undefined') {
    return;
  }

  if (!authInfo) {
    window.localStorage.removeItem(CLIENT_AUTH_STORAGE_KEY);
    return;
  }

  window.localStorage.setItem(CLIENT_AUTH_STORAGE_KEY, JSON.stringify(authInfo));
}

export function clearClientAuthInfo(): void {
  setClientAuthInfo(null);
}

export async function refreshClientAuthInfo(): Promise<ClientAuthInfo | null> {
  if (typeof window === 'undefined') {
    return null;
  }

  try {
    const response = await fetch('/api/auth/session', {
      cache: 'no-store',
    });

    if (response.status === 401) {
      clearClientAuthInfo();
      return null;
    }

    if (!response.ok) {
      throw new Error(`获取会话信息失败: ${response.status}`);
    }

    const authInfo = normalizeClientAuthInfo(
      (await response.json()) as Partial<ClientAuthInfo>,
    );

    if (!authInfo) {
      throw new Error('会话信息格式错误');
    }

    setClientAuthInfo(authInfo);
    return authInfo;
  } catch {
    return getClientAuthInfo();
  }
}
