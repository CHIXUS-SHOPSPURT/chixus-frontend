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
      if (custom && custom.trim() && !custom.includes('chixus-project.onrender.com')) {
        return custom.trim().replace(/\/+$/, '');
      }
    }
  } catch {}

  // Check Vite environment variables
  const envUrl =
    import.meta.env.VITE_BACKEND_URL ||
    import.meta.env.VITE_FASTAPI_URL ||
    import.meta.env.VITE_API_URL ||
    '';

  if (envUrl && typeof envUrl === 'string') {
    return envUrl.trim().replace(/\/+$/, '');
  }

  // Fallback to same-origin relative URL
  return '';
}

export function getWebSocketUrl(): string {
  // Check explicit environment variable
  const envWs = import.meta.env.VITE_WS_URL || import.meta.env.VITE_FASTAPI_WS_URL || '';
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

export const API_ENDPOINTS = {
  HEALTH: () => `${getBackendBaseUrl()}/health`,
  INSPECT_SCAN: () => `${getBackendBaseUrl()}/api/v1/inspect-scan`,
  VERIFY_SAFETY: () => `${getBackendBaseUrl()}/inspect/verify-safety`,
  USER_SEARCH: (id: string) => `${getBackendBaseUrl()}/api/users/search?id=${encodeURIComponent(id)}`,
  AUTH_LOGIN: () => `${getBackendBaseUrl()}/api/auth/login`,
  AUTH_REGISTER: () => `${getBackendBaseUrl()}/api/auth/register`,
  AUTH_SEND_CODE: () => `${getBackendBaseUrl()}/api/auth/send-verification-code`,
  AUTH_VERIFY_CODE: () => `${getBackendBaseUrl()}/api/auth/verify-code`,
  POSTS: () => `${getBackendBaseUrl()}/api/posts`,
  PRESENCE_HEARTBEAT: () => `${getBackendBaseUrl()}/api/presence/heartbeat`,
  PRESENCE_ONLINE_USERS: () => `${getBackendBaseUrl()}/api/presence/online-users`
};
