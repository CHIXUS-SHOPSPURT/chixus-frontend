/**
 * CHIXUS Unified Backend & WebSocket Configuration
 * 
 * Supports configurable endpoints via environment variables:
 * - VITE_BACKEND_URL or VITE_FASTAPI_URL or VITE_API_URL
 *   (e.g., http://localhost:8000 or https://api.chixus.network)
 * - VITE_WS_URL or VITE_FASTAPI_WS_URL
 *   (e.g., ws://localhost:8000/ws/rear-camera-stream or wss://api.chixus.network/ws/rear-camera-stream)
 * 
 * When variables are unset, requests use relative same-origin routing.
 */

export function getBackendBaseUrl(): string {
  // Check user-configured override in localStorage first
  try {
    if (typeof localStorage !== 'undefined') {
      const custom = localStorage.getItem('chixus_custom_backend_url');
      if (custom && custom.trim()) {
        return custom.trim().replace(/\/+$/, '');
      }
    }
  } catch {}

  // Check Vite environment variables
  const metaEnv = (import.meta as { env?: Record<string, string | undefined> })?.env;
  const envUrl =
    metaEnv?.VITE_BACKEND_URL ||
    metaEnv?.VITE_RENDER_URL ||
    metaEnv?.VITE_FASTAPI_URL ||
    metaEnv?.VITE_API_URL ||
    '';

  if (envUrl && typeof envUrl === 'string' && envUrl.trim()) {
    return envUrl.trim().replace(/\/+$/, '');
  }

  // Fallback to same-origin relative URL
  return '';
}

export function getWebSocketUrl(): string {
  // Check explicit environment variable
  const metaEnv = (import.meta as { env?: Record<string, string | undefined> })?.env;
  const envWs =
    metaEnv?.VITE_WS_URL ||
    metaEnv?.VITE_RENDER_WS_URL ||
    metaEnv?.VITE_FASTAPI_WS_URL ||
    '';
  if (envWs && typeof envWs === 'string' && envWs.trim()) {
    return envWs.trim();
  }

  // If backend base URL is configured with http/https, derive corresponding ws/wss
  const baseUrl = getBackendBaseUrl();
  if (baseUrl) {
    try {
      const parsed = new URL(baseUrl);
      const wsProto = parsed.protocol === 'https:' ? 'wss:' : 'ws:';
      return `${wsProto}//${parsed.host}/ws/rear-camera-stream`;
    } catch {}
  }

  // Fallback to current browser host
  if (typeof window !== 'undefined') {
    const proto = window.location.protocol === 'https:' ? 'wss:' : 'ws:';
    return `${proto}//${window.location.host}/ws/rear-camera-stream`;
  }

  return 'ws://localhost:8000/ws/rear-camera-stream';
}

export const AUTH_TOKEN_STORAGE_KEY = 'chixus_auth_token_v1';

export function getAuthToken(): string {
  try {
    if (typeof localStorage !== 'undefined') {
      return localStorage.getItem(AUTH_TOKEN_STORAGE_KEY) || '';
    }
  } catch {}
  return '';
}

export function setAuthToken(token: string): void {
  try {
    if (typeof localStorage !== 'undefined') {
      if (token && token.trim()) {
        localStorage.setItem(AUTH_TOKEN_STORAGE_KEY, token.trim());
      } else {
        localStorage.removeItem(AUTH_TOKEN_STORAGE_KEY);
      }
    }
  } catch {}
}

export function clearAuthToken(): void {
  try {
    if (typeof localStorage !== 'undefined') {
      localStorage.removeItem(AUTH_TOKEN_STORAGE_KEY);
    }
  } catch {}
}

export function getAuthHeaders(extraHeaders: Record<string, string> = {}): Record<string, string> {
  const token = getAuthToken();
  return {
    'Content-Type': 'application/json',
    ...(token ? { Authorization: `Bearer ${token}` } : {}),
    ...extraHeaders
  };
}

export const API_ENDPOINTS = {
  HEALTH: () => `${getBackendBaseUrl()}/health`,
  INSPECT_SCAN: () => `${getBackendBaseUrl()}/api/v1/inspect-scan`,
  VERIFY_SAFETY: () => `${getBackendBaseUrl()}/inspect/verify-safety`,
  USER_SEARCH: (id: string) => `${getBackendBaseUrl()}/api/users/search?id=${encodeURIComponent(id)}`,
  AUTH_LOGIN: () => `${getBackendBaseUrl()}/api/auth/login`,
  AUTH_REGISTER: () => `${getBackendBaseUrl()}/api/auth/register`,
  AUTH_LOGOUT: () => `${getBackendBaseUrl()}/api/auth/logout`,
  AUTH_SEND_CODE: () => `${getBackendBaseUrl()}/api/auth/send-verification-code`,
  AUTH_VERIFY_CODE: () => `${getBackendBaseUrl()}/api/auth/verify-code`,
  AUTH_RECOVER_ID: () => `${getBackendBaseUrl()}/api/auth/recover-id`,
  ACCOUNT_ME: () => `${getBackendBaseUrl()}/api/account/me`,
  SETTINGS_PREFERENCES: () => `${getBackendBaseUrl()}/api/settings/preferences`,
  ACCOUNT_CHANGE_PHONE_REQUEST: () => `${getBackendBaseUrl()}/api/account/change-phone/request`,
  ACCOUNT_CHANGE_PHONE_CONFIRM: () => `${getBackendBaseUrl()}/api/account/change-phone/confirm`,
  ACCOUNT_CHANGE_EMAIL_REQUEST: () => `${getBackendBaseUrl()}/api/account/change-email/request`,
  ACCOUNT_CHANGE_EMAIL_CONFIRM: () => `${getBackendBaseUrl()}/api/account/change-email/confirm`,
  ACCOUNT_CHANGE_PASSWORD: () => `${getBackendBaseUrl()}/api/account/change-password`,
  POSTS: () => `${getBackendBaseUrl()}/api/posts`,
  PRESENCE_HEARTBEAT: () => `${getBackendBaseUrl()}/api/presence/heartbeat`,
  PRESENCE_ONLINE_USERS: () => `${getBackendBaseUrl()}/api/presence/online-users`
};

