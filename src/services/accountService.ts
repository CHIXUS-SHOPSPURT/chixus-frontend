import {
  API_ENDPOINTS,
  clearAuthToken,
  getAuthHeaders,
  getAuthToken,
  setAuthToken
} from '../apiConfig';
import type {
  AccountChangeConfirmResponse,
  AccountChangeRequestResponse,
  AiAccessLevel,
  AuthSessionResponse,
  PermanentUserIdentity,
  UserPreferencesPayload
} from '../types';

export const PHONE_CHANGE_CONFIRMATION_MESSAGE =
  'A confirmation link has been sent to your registered email address. Please check your inbox to authorize this phone number change.';

export const DEFAULT_USER_PREFERENCES: UserPreferencesPayload = {
  emailAlerts: {
    weeklyReport: true,
    verifiedOnly: false,
    newUpdate: true,
    tips: true
  },
  inAppAlerts: {
    popupToast: true,
    appUpdate: true,
    directMessage: true,
    contactJoin: true
  },
  soundFeedback: true,
  isIdPublic: true,
  aiAccessLevel: 'everything',
  theme: 'white',
  language: 'English'
};

export class ApiRequestError extends Error {
  status: number;
  code?: string;
  details?: unknown;

  constructor(message: string, status = 500, code?: string, details?: unknown) {
    super(message);
    this.name = 'ApiRequestError';
    this.status = status;
    this.code = code;
    this.details = details;
  }
}

let unauthorizedCallback: (() => void) | null = null;

export function registerUnauthorizedHandler(cb: (() => void) | null): void {
  unauthorizedCallback = cb;
}

export function generateNonPhoneChixusId(countrySuffix = 'NG'): string {
  const suffix = (countrySuffix || 'NG').replace(/[^A-Z]/gi, '').toUpperCase().slice(0, 3) || 'NG';
  let randomDigits = 1000;
  try {
    if (typeof window !== 'undefined' && window.crypto && typeof window.crypto.getRandomValues === 'function') {
      const buf = new Uint32Array(1);
      window.crypto.getRandomValues(buf);
      randomDigits = 1000 + (buf[0] % 9000);
    } else {
      randomDigits = 1000 + Math.floor(Math.random() * 9000);
    }
  } catch {
    randomDigits = 1000 + Math.floor(Math.random() * 9000);
  }
  return `CHI-${randomDigits}-${suffix}`;
}

export function isPhoneIdentifier(input: string): boolean {
  const trimmed = (input || '').trim();
  if (!trimmed || trimmed.includes('@')) return false;
  if (/^CHI-/i.test(trimmed)) return false;
  const digits = trimmed.replace(/\D/g, '');
  return digits.length >= 7 && digits.length <= 16 && /^[+\d\s()-]+$/.test(trimmed);
}

export function normalizePhoneNumber(input: string): string {
  const trimmed = (input || '').trim();
  if (!trimmed) return '';
  const hasPlus = trimmed.startsWith('+');
  const collapsed = trimmed.replace(/[^\d+\s-]/g, '').replace(/\s+/g, ' ').trim();
  return hasPlus ? collapsed : collapsed;
}

export function normalizeAccountProfile(raw: Record<string, any> | null | undefined): PermanentUserIdentity {
  const u = raw || {};
  const chixusId = String(u.chixus_id || u.operator_id || u.node_id || u.secretId || u.id || '').trim().toUpperCase();
  const internalId = String(u.internal_id || u.user_uuid || u.uuid || u.db_id || chixusId || '').trim();
  return {
    internal_id: internalId,
    chixus_id: chixusId,
    phone_number: String(u.phone_number || u.phone || u.phoneNumber || '').trim(),
    email: String(u.email || '').trim().toLowerCase(),
    full_name: String(u.full_name || u.fullName || u.name || chixusId).trim(),
    username: String(u.username || chixusId).trim(),
    location: String(u.location || 'Sector Relay // Nigeria').trim(),
    headline: String(u.headline || '').trim(),
    country: String(u.country || 'Nigeria').trim(),
    avatar_url: u.avatar_url || u.avatarUrl || u.avatar || undefined,
    cover_url: u.cover_url || u.coverUrl || u.cover || undefined,
    summary: typeof u.summary === 'string' ? u.summary : undefined,
    inspections_conducted: Number(u.inspections_conducted ?? u.inspectionsConducted ?? u.inspections ?? 0) || 0,
    faults_isolated: Number(u.faults_isolated ?? u.faultsIsolated ?? u.faults ?? 0) || 0,
    ai_scan_accuracy: String(u.ai_scan_accuracy || u.aiScanAccuracy || u.accuracy || '0.0%'),
    is_id_public: u.is_id_public !== undefined ? Boolean(u.is_id_public) : (u.isIdPublic !== undefined ? Boolean(u.isIdPublic) : true),
    ai_access_level: (u.ai_access_level || u.aiAccessLevel || 'everything') as AiAccessLevel,
    pending_phone: u.pending_phone ?? u.pendingPhone ?? null,
    pending_email: u.pending_email ?? u.pendingEmail ?? null,
    created_at: u.created_at || u.createdAt || undefined
  };
}

export function normalizePreferences(raw: Record<string, any> | null | undefined): UserPreferencesPayload {
  const p = (raw?.preferences || raw || {}) as Record<string, any>;
  const ea = (p.emailAlerts || p.email_alerts || p) as Record<string, any>;
  const ia = (p.inAppAlerts || p.in_app_alerts || p.inAppNotifications || p.in_app_notifications || p) as Record<string, any>;

  const boolOr = (val: unknown, fallback: boolean): boolean =>
    typeof val === 'boolean' ? val : fallback;

  const rawAi = p.aiAccessLevel || p.ai_access_level || 'everything';
  const validAi: AiAccessLevel[] = ['feed', 'inspect', 'profile', 'none', 'everything', 'no_message_allow_other'];
  const aiAccessLevel: AiAccessLevel = validAi.includes(rawAi) ? rawAi : 'everything';

  const rawTheme = p.theme || p.themeSelection || 'white';
  const theme: 'dark' | 'white' | 'system' =
    rawTheme === 'dark' || rawTheme === 'white' || rawTheme === 'system' ? rawTheme : 'white';

  return {
    emailAlerts: {
      weeklyReport: boolOr(ea.weeklyReport ?? ea.weekly_report ?? ea.email_weekly_report, DEFAULT_USER_PREFERENCES.emailAlerts.weeklyReport),
      verifiedOnly: boolOr(ea.verifiedOnly ?? ea.verified_only ?? ea.email_verified_only, DEFAULT_USER_PREFERENCES.emailAlerts.verifiedOnly),
      newUpdate: boolOr(ea.newUpdate ?? ea.new_update ?? ea.email_new_update, DEFAULT_USER_PREFERENCES.emailAlerts.newUpdate),
      tips: boolOr(ea.tips ?? ea.email_tips, DEFAULT_USER_PREFERENCES.emailAlerts.tips)
    },
    inAppAlerts: {
      popupToast: boolOr(ia.popupToast ?? ia.popup_toast ?? ia.inapp_popup_toast, DEFAULT_USER_PREFERENCES.inAppAlerts.popupToast),
      appUpdate: boolOr(ia.appUpdate ?? ia.app_update ?? ia.inapp_app_update, DEFAULT_USER_PREFERENCES.inAppAlerts.appUpdate),
      directMessage: boolOr(ia.directMessage ?? ia.direct_message ?? ia.inapp_direct_message, DEFAULT_USER_PREFERENCES.inAppAlerts.directMessage),
      contactJoin: boolOr(ia.contactJoin ?? ia.contact_join ?? ia.inapp_contact_join, DEFAULT_USER_PREFERENCES.inAppAlerts.contactJoin)
    },
    soundFeedback: boolOr(
      p.soundFeedback ?? p.sound_feedback ?? ia.soundFeedback ?? ia.sound_feedback,
      DEFAULT_USER_PREFERENCES.soundFeedback
    ),
    isIdPublic: boolOr(p.isIdPublic ?? p.is_id_public, DEFAULT_USER_PREFERENCES.isIdPublic),
    aiAccessLevel,
    theme,
    language: typeof (p.language || p.selectedLanguage) === 'string' && (p.language || p.selectedLanguage).trim()
      ? String(p.language || p.selectedLanguage).trim()
      : DEFAULT_USER_PREFERENCES.language,
    updatedAt: p.updatedAt || p.updated_at || undefined
  };
}

export function serializePreferencesForBackend(prefs: UserPreferencesPayload): Record<string, any> {
  return {
    emailAlerts: { ...prefs.emailAlerts },
    inAppAlerts: { ...prefs.inAppAlerts },
    soundFeedback: prefs.soundFeedback,
    isIdPublic: prefs.isIdPublic,
    aiAccessLevel: prefs.aiAccessLevel,
    theme: prefs.theme,
    language: prefs.language,
    // Also send canonical snake_case aliases so either FastAPI/PostgreSQL or Express handler receives exact keys cleanly
    email_alerts: {
      weekly_report: prefs.emailAlerts.weeklyReport,
      verified_only: prefs.emailAlerts.verifiedOnly,
      new_update: prefs.emailAlerts.newUpdate,
      tips: prefs.emailAlerts.tips
    },
    in_app_alerts: {
      popup_toast: prefs.inAppAlerts.popupToast,
      app_update: prefs.inAppAlerts.appUpdate,
      direct_message: prefs.inAppAlerts.directMessage,
      contact_join: prefs.inAppAlerts.contactJoin,
      sound_feedback: prefs.soundFeedback
    },
    sound_feedback: prefs.soundFeedback,
    is_id_public: prefs.isIdPublic,
    ai_access_level: prefs.aiAccessLevel
  };
}

async function apiFetchJson<T>(
  url: string,
  options: RequestInit & { requireAuth?: boolean; timeoutMs?: number } = {}
): Promise<T> {
  const { requireAuth = true, timeoutMs = 12000, headers, ...rest } = options;

  if (requireAuth && !getAuthToken()) {
    throw new ApiRequestError(
      'Authenticated session required. Please log in again to save or load account settings.',
      401,
      'AUTH_TOKEN_MISSING'
    );
  }

  const controller = new AbortController();
  const timeoutId = window.setTimeout(() => controller.abort(), timeoutMs);

  try {
    const res = await fetch(url, {
      ...rest,
      headers: getAuthHeaders((headers as Record<string, string>) || {}),
      signal: controller.signal
    });
    window.clearTimeout(timeoutId);

    const contentType = res.headers.get('content-type') || '';
    let data: any = null;
    if (contentType.includes('application/json')) {
      data = await res.json().catch(() => null);
    } else {
      const text = await res.text().catch(() => '');
      try {
        data = text ? JSON.parse(text) : null;
      } catch {
        data = null;
      }
    }

    if (res.status === 401) {
      if (requireAuth && unauthorizedCallback) {
        unauthorizedCallback();
      }
      throw new ApiRequestError(
        data?.message || data?.detail || data?.error || 'Session expired or invalid authentication credentials.',
        401,
        data?.code || 'UNAUTHORIZED',
        data
      );
    }

    if (!res.ok) {
      throw new ApiRequestError(
        data?.message || data?.detail || data?.error || `Request failed with HTTP ${res.status}`,
        res.status,
        data?.code,
        data
      );
    }

    if (data === null) {
      throw new ApiRequestError(
        'Backend returned an unexpected non-JSON response. Please check your Backend Server Endpoint.',
        res.status || 502,
        'INVALID_BACKEND_RESPONSE'
      );
    }

    return data as T;
  } catch (err: unknown) {
    window.clearTimeout(timeoutId);
    if (err instanceof ApiRequestError) throw err;
    if (err instanceof Error && err.name === 'AbortError') {
      throw new ApiRequestError('Backend request timed out. Please verify your connection and try again.', 408, 'TIMEOUT');
    }
    throw new ApiRequestError(
      err instanceof Error ? err.message : 'Unable to reach CHIXUS backend server.',
      0,
      'NETWORK_ERROR'
    );
  }
}

export async function loginWithIdentifier(
  identifier: string,
  password: string
): Promise<{ token: string; user: PermanentUserIdentity; preferences?: UserPreferencesPayload }> {
  const cleanId = identifier.trim().toUpperCase();
  const isChixusId = /^CHI-[A-Z0-9]{4}-[A-Z]{2,3}$/i.test(cleanId);
  if (!isChixusId) {
    throw new ApiRequestError(
      'Invalid ID — Please enter a valid CHIXUS ID (e.g. CHI-2022-NG).',
      400,
      'INVALID_CHIXUS_ID'
    );
  }

  const payload: Record<string, any> = {
    chixus_id: cleanId,
    operator_id: cleanId,
    node_id: cleanId,
    identifier: cleanId,
    password: password.trim()
  };

  const data = await apiFetchJson<AuthSessionResponse>(API_ENDPOINTS.AUTH_LOGIN(), {
    method: 'POST',
    requireAuth: false,
    body: JSON.stringify(payload)
  });

  const token = String(data.access_token || data.token || '').trim();
  if (token) {
    setAuthToken(token);
  }

  const rawUser = data.user || data.operator || {
    chixus_id: data.chixus_id || data.operator_id || data.node_id,
    internal_id: data.internal_id
  };
  const user = normalizeAccountProfile(rawUser);
  const preferences = data.preferences ? normalizePreferences(data.preferences) : undefined;

  return { token, user, preferences };
}

export async function registerOperatorAccount(input: {
  candidateChixusId: string;
  fullName: string;
  location: string;
  phoneNumber: string;
  email: string;
  password: string;
  headline?: string;
  country: string;
}): Promise<{ token: string; user: PermanentUserIdentity; preferences?: UserPreferencesPayload }> {
  const data = await apiFetchJson<AuthSessionResponse>(API_ENDPOINTS.AUTH_REGISTER(), {
    method: 'POST',
    requireAuth: false,
    body: JSON.stringify({
      chixus_id: input.candidateChixusId,
      operator_id: input.candidateChixusId,
      id_generation_policy: 'NON_PHONE_DERIVED',
      full_name: input.fullName.trim(),
      username: input.candidateChixusId,
      location: input.location.trim(),
      phone: normalizePhoneNumber(input.phoneNumber),
      phone_number: normalizePhoneNumber(input.phoneNumber),
      email: input.email.trim().toLowerCase(),
      password: input.password.trim(),
      headline: (input.headline || '').trim(),
      country: input.country.trim()
    })
  });

  const token = String(data.access_token || data.token || '').trim();
  if (token) {
    setAuthToken(token);
  }

  const rawUser = data.user || data.operator || {
    chixus_id: data.chixus_id || data.operator_id || data.node_id || input.candidateChixusId,
    internal_id: data.internal_id,
    full_name: input.fullName,
    location: input.location,
    phone_number: input.phoneNumber,
    email: input.email,
    headline: input.headline,
    country: input.country
  };

  return {
    token,
    user: normalizeAccountProfile(rawUser),
    preferences: data.preferences ? normalizePreferences(data.preferences) : undefined
  };
}

export async function fetchAuthenticatedAccount(): Promise<PermanentUserIdentity> {
  const data = await apiFetchJson<{ status: string; user: Record<string, any> }>(API_ENDPOINTS.ACCOUNT_ME(), {
    method: 'GET',
    requireAuth: true
  });
  return normalizeAccountProfile(data.user || data);
}

export async function fetchUserPreferences(): Promise<UserPreferencesPayload> {
  const data = await apiFetchJson<{ status?: string; preferences?: Record<string, any> }>(
    API_ENDPOINTS.SETTINGS_PREFERENCES(),
    {
      method: 'GET',
      requireAuth: true
    }
  );
  return normalizePreferences(data);
}

export async function saveUserPreferences(prefs: UserPreferencesPayload): Promise<UserPreferencesPayload> {
  const data = await apiFetchJson<{ status?: string; preferences?: Record<string, any> }>(
    API_ENDPOINTS.SETTINGS_PREFERENCES(),
    {
      method: 'PUT',
      requireAuth: true,
      body: JSON.stringify(serializePreferencesForBackend(prefs))
    }
  );
  return normalizePreferences(data?.preferences ? data : { preferences: { ...prefs, ...(data || {}) } });
}

export async function requestPhoneNumberChange(newPhone: string): Promise<AccountChangeRequestResponse> {
  const normalized = normalizePhoneNumber(newPhone);
  return apiFetchJson<AccountChangeRequestResponse>(API_ENDPOINTS.ACCOUNT_CHANGE_PHONE_REQUEST(), {
    method: 'POST',
    requireAuth: true,
    body: JSON.stringify({
      new_phone: normalized,
      newPhone: normalized
    })
  });
}

export async function confirmPhoneNumberChange(token: string): Promise<AccountChangeConfirmResponse> {
  return apiFetchJson<AccountChangeConfirmResponse>(API_ENDPOINTS.ACCOUNT_CHANGE_PHONE_CONFIRM(), {
    method: 'POST',
    requireAuth: false,
    body: JSON.stringify({ token: token.trim() })
  });
}

export async function requestEmailAddressChange(
  newEmail: string,
  currentPassword: string
): Promise<AccountChangeRequestResponse> {
  const cleanEmail = newEmail.trim().toLowerCase();
  return apiFetchJson<AccountChangeRequestResponse>(API_ENDPOINTS.ACCOUNT_CHANGE_EMAIL_REQUEST(), {
    method: 'POST',
    requireAuth: true,
    body: JSON.stringify({
      new_email: cleanEmail,
      newEmail: cleanEmail,
      current_password: currentPassword,
      currentPassword
    })
  });
}

export async function confirmEmailAddressChange(token: string): Promise<AccountChangeConfirmResponse> {
  return apiFetchJson<AccountChangeConfirmResponse>(API_ENDPOINTS.ACCOUNT_CHANGE_EMAIL_CONFIRM(), {
    method: 'POST',
    requireAuth: false,
    body: JSON.stringify({ token: token.trim() })
  });
}

export async function changeAccountPassword(
  currentPassword: string,
  newPassword: string
): Promise<{ status: string; message: string }> {
  return apiFetchJson<{ status: string; message: string }>(API_ENDPOINTS.ACCOUNT_CHANGE_PASSWORD(), {
    method: 'POST',
    requireAuth: true,
    body: JSON.stringify({
      current_password: currentPassword,
      new_password: newPassword,
      currentPassword,
      newPassword
    })
  });
}

export async function logoutSession(): Promise<void> {
  const token = getAuthToken();
  try {
    if (token) {
      await fetch(API_ENDPOINTS.AUTH_LOGOUT(), {
        method: 'POST',
        headers: getAuthHeaders()
      }).catch(() => {});
    }
  } finally {
    clearAuthToken();
  }
}
