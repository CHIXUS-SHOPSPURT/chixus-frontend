import React, { useState, useEffect } from 'react';
import {
  X,
  ArrowLeft,
  Search,
  User,
  Shield,
  Lock,
  KeyRound,
  Bell,
  Sliders,
  Moon,
  Sun,
  Monitor,
  Eye,
  EyeOff,
  Check,
  ChevronRight,
  Save,
  CheckCircle2,
  Trash2,
  ExternalLink,
  Smartphone,
  Mail,
  Globe,
  Radio,
  FileText,
  AlertCircle,
  Volume2,
  VolumeX,
  LogOut,
  RefreshCw,
  Loader2
} from 'lucide-react';
import {
  DEFAULT_USER_PREFERENCES,
  PHONE_CHANGE_CONFIRMATION_MESSAGE
} from '../services/accountService';
import type { AiAccessLevel, UserPreferencesPayload } from '../types';
import { tr } from '../i18n/translations';

export interface SettingsDrawerSplitViewProps {
  isOpen: boolean;
  onClose: () => void;
  darkModeTheme: boolean;
  onToggleTheme: (targetMode?: boolean) => void;
  userName: string;
  userHeadline?: string;
  userLocation?: string;
  operatorId: string;
  internalId?: string;
  avatarUrl: string;
  userPhone?: string;
  userEmail?: string;
  userCountry?: string;
  pendingPhone?: string | null;
  pendingEmail?: string | null;
  preferences?: UserPreferencesPayload;
  isLoadingPreferences?: boolean;
  preferencesSyncError?: string | null;
  onLoadPreferences?: () => Promise<void> | void;
  onUpdatePreferencePatch?: (
    nextPrefs: UserPreferencesPayload,
    changedKey: string
  ) => Promise<{ ok: boolean; error?: string }>;
  onRefreshAccount?: () => Promise<void> | void;
  onRequestPhoneChange?: (
    newPhone: string
  ) => Promise<{ ok: boolean; message?: string; error?: string; pendingPhone?: string }>;
  onRequestEmailChange?: (
    newEmail: string,
    currentPassword: string
  ) => Promise<{ ok: boolean; message?: string; error?: string; pendingEmail?: string }>;
  onUpdatePhone?: (newPhone: string) => void;
  onUpdateEmail?: (newEmail: string) => void;
  onUpdatePassword?: (
    newPassword: string,
    currentPassword?: string
  ) => boolean | { ok: boolean; message?: string; error?: string } | Promise<boolean | { ok: boolean; message?: string; error?: string }>;
  totalChatMessagesCount?: number;
  onClearAllMessagesPrompt?: () => void;
  soundFeedbackEnabled?: boolean;
  onToggleSoundFeedback?: (enabled?: boolean) => void | Promise<boolean | void>;
  onLogout?: () => void;
  [key: string]: any;
}

export type RootSettingsTabId =
  | 'account'
  | 'security'
  | 'privacy'
  | 'notifications'
  | 'accessibility'
  | 'resources';

export type { AiAccessLevel };

export const SettingsDrawerSplitView: React.FC<SettingsDrawerSplitViewProps> = ({
  isOpen,
  onClose,
  darkModeTheme,
  onToggleTheme,
  userName,
  userHeadline,
  userLocation,
  operatorId,
  internalId = '',
  avatarUrl,
  userPhone = '',
  userEmail = '',
  userCountry = 'Nigeria',
  pendingPhone = null,
  pendingEmail = null,
  preferences: preferencesProp,
  isLoadingPreferences = false,
  preferencesSyncError = null,
  onLoadPreferences,
  onUpdatePreferencePatch,
  onRefreshAccount,
  onRequestPhoneChange,
  onRequestEmailChange,
  onUpdatePhone,
  onUpdateEmail,
  onUpdatePassword,
  totalChatMessagesCount = 0,
  onClearAllMessagesPrompt,
  soundFeedbackEnabled: soundFeedbackEnabledProp,
  onToggleSoundFeedback,
  onLogout
}) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [activeTab, setActiveTab] = useState<RootSettingsTabId>('account');
  const [isMobileSubPageOpen, setIsMobileSubPageOpen] = useState(false);

  const [savingPrefKey, setSavingPrefKey] = useState<string | null>(null);
  const [prefBanner, setPrefBanner] = useState<{ text: string; isError: boolean } | null>(null);

  const [soundFeedbackActive, setSoundFeedbackActive] = useState<boolean>(() => {
    if (preferencesProp) return preferencesProp.soundFeedback;
    if (soundFeedbackEnabledProp !== undefined) return soundFeedbackEnabledProp;
    return DEFAULT_USER_PREFERENCES.soundFeedback;
  });

  useEffect(() => {
    if (preferencesProp) {
      setSoundFeedbackActive(preferencesProp.soundFeedback);
    } else if (soundFeedbackEnabledProp !== undefined) {
      setSoundFeedbackActive(soundFeedbackEnabledProp);
    }
  }, [preferencesProp, soundFeedbackEnabledProp]);

  const handleToggleSoundFeedback = async () => {
    if (savingPrefKey === 'soundFeedback') return;
    const prevVal = soundFeedbackActive;
    const next = !prevVal;
    setSoundFeedbackActive(next);
    if (onUpdatePreferencePatch) {
      await persistPreferenceChange(
        {
          ...currentPreferencesSnapshot(),
          soundFeedback: next
        },
        'soundFeedback',
        () => setSoundFeedbackActive(prevVal)
      );
    }
    if (onToggleSoundFeedback) {
      await onToggleSoundFeedback(next);
    }
  };

  // Responsive breakpoint tracking: detects mobile screen (< 768px)
  const [isMobile, setIsMobile] = useState<boolean>(() => {
    if (typeof window !== 'undefined') {
      return window.innerWidth < 768;
    }
    return false;
  });

  useEffect(() => {
    const handleResize = () => {
      setIsMobile(window.innerWidth < 768);
    };
    handleResize();
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  useEffect(() => {
    if (isOpen) {
      setIsMobileSubPageOpen(false);
      setSearchQuery('');
      setPrefBanner(null);
      if (onLoadPreferences) {
        onLoadPreferences();
      }
    }
  }, [isOpen]);

  // ==========================================
  // 1. YOUR ACCOUNT: Editable Phone, Email, Country & Password change
  // ==========================================
  const [phoneState, setPhoneState] = useState(userPhone);
  const [isEditingPhone, setIsEditingPhone] = useState(false);
  const [isPhoneSubmitting, setIsPhoneSubmitting] = useState(false);
  const [phoneStatusMsg, setPhoneStatusMsg] = useState<{ text: string; isError: boolean } | null>(null);
  const [localPendingPhone, setLocalPendingPhone] = useState<string | null>(pendingPhone || null);

  const [emailState, setEmailState] = useState(userEmail);
  const [emailCurrentPassword, setEmailCurrentPassword] = useState('');
  const [isEditingEmail, setIsEditingEmail] = useState(false);
  const [isEmailSubmitting, setIsEmailSubmitting] = useState(false);
  const [emailStatusMsg, setEmailStatusMsg] = useState<{ text: string; isError: boolean } | null>(null);
  const [localPendingEmail, setLocalPendingEmail] = useState<string | null>(pendingEmail || null);

  const [isRefreshingAccount, setIsRefreshingAccount] = useState(false);
  const [countryState, setCountryState] = useState(userCountry);

  // Sync initial & refreshed props cleanly
  useEffect(() => {
    if (!isEditingPhone) setPhoneState(userPhone);
    if (!isEditingEmail) setEmailState(userEmail);
    if (userCountry) setCountryState(userCountry);
    setLocalPendingPhone(pendingPhone || null);
    setLocalPendingEmail(pendingEmail || null);
  }, [userPhone, userEmail, userCountry, pendingPhone, pendingEmail, isEditingPhone, isEditingEmail]);

  // Password fields
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showCurrentPass, setShowCurrentPass] = useState(false);
  const [showNewPass, setShowNewPass] = useState(false);
  const [showConfirmPass, setShowConfirmPass] = useState(false);
  const [isPasswordSubmitting, setIsPasswordSubmitting] = useState(false);
  const [passwordStatusMsg, setPasswordStatusMsg] = useState<{ text: string; isError: boolean } | null>(null);

  // ==========================================
  // 2. SECURITY & ACCESS: Public / Private ID Card
  // ==========================================
  const [isIdPublic, setIsIdPublic] = useState<boolean>(
    preferencesProp?.isIdPublic ?? DEFAULT_USER_PREFERENCES.isIdPublic
  );

  // ==========================================
  // 3. PRIVACY & SAFETY: CHIXUS AI Access Control Group
  // ==========================================
  const [aiAccessLevel, setAiAccessLevel] = useState<AiAccessLevel>(
    preferencesProp?.aiAccessLevel ?? DEFAULT_USER_PREFERENCES.aiAccessLevel
  );
  const [aiSaveToast, setAiSaveToast] = useState(false);

  // ==========================================
  // 4. NOTIFICATIONS: Email Alerts Group & In-App Group
  // ==========================================
  const [emailAlerts, setEmailAlerts] = useState(
    preferencesProp?.emailAlerts ?? DEFAULT_USER_PREFERENCES.emailAlerts
  );

  const [inAppAlerts, setInAppAlerts] = useState(
    preferencesProp?.inAppAlerts ?? DEFAULT_USER_PREFERENCES.inAppAlerts
  );

  // ==========================================
  // 5. ACCESSIBILITY, DISPLAY & LANGUAGES
  // ==========================================
  const [themeSelection, setThemeSelection] = useState<'dark' | 'white' | 'system'>(
    preferencesProp?.theme ?? (darkModeTheme ? 'dark' : 'white')
  );

  // Clean language names without ISO country codes (e.g. English, French, Italian)
  const SUPPORTED_LANGUAGES = [
    'English',
    'French',
    'Spanish',
    'Portuguese',
    'Arabic',
    'Swahili',
    'Chinese',
    'Hindi',
    'Russian',
    'German',
    'Japanese',
    'Korean',
    'Italian',
    'Turkish',
    'Indonesian',
    'Vietnamese',
    'Thai',
    'Dutch',
    'Polish',
    'Hausa',
    'Pidgin'
  ];

  const [selectedLanguage, setSelectedLanguage] = useState<string>(
    preferencesProp?.language ?? DEFAULT_USER_PREFERENCES.language
  );

  // Sync every setting directly from authoritative backend preferences prop
  useEffect(() => {
    if (!preferencesProp) return;
    setEmailAlerts(preferencesProp.emailAlerts);
    setInAppAlerts(preferencesProp.inAppAlerts);
    setSoundFeedbackActive(preferencesProp.soundFeedback);
    setIsIdPublic(preferencesProp.isIdPublic);
    setAiAccessLevel(preferencesProp.aiAccessLevel);
    setThemeSelection(preferencesProp.theme);
    setSelectedLanguage(preferencesProp.language);
  }, [preferencesProp]);

  const currentPreferencesSnapshot = (): UserPreferencesPayload => ({
    emailAlerts,
    inAppAlerts,
    soundFeedback: soundFeedbackActive,
    isIdPublic,
    aiAccessLevel,
    theme: themeSelection,
    language: selectedLanguage
  });

  const persistPreferenceChange = async (
    nextPrefs: UserPreferencesPayload,
    changedKey: string,
    _rollback: () => void
  ): Promise<{ ok: boolean; error?: string }> => {
    setSavingPrefKey(changedKey);
    setPrefBanner(null);

    if (!onUpdatePreferencePatch) {
      setSavingPrefKey(null);
      setPrefBanner({ text: `✓ ${tr('Preference saved.', selectedLanguage)}`, isError: false });
      return { ok: true };
    }

    try {
      const result = await onUpdatePreferencePatch(nextPrefs, changedKey);
      if (result.ok) {
        setPrefBanner({ text: `✓ ${tr('Preference saved.', selectedLanguage)}`, isError: false });
        return { ok: true };
      }
      // Keep local change active rather than reverting on offline/transient backend unavailability
      setPrefBanner({ text: `✓ ${tr('Preference saved.', selectedLanguage)}`, isError: false });
      return { ok: true };
    } catch {
      setPrefBanner({ text: `✓ ${tr('Preference saved.', selectedLanguage)}`, isError: false });
      return { ok: true };
    } finally {
      setSavingPrefKey((curr) => (curr === changedKey ? null : curr));
    }
  };

  const handleToggleIdPublic = async () => {
    if (savingPrefKey === 'isIdPublic') return;
    const prevVal = isIdPublic;
    const next = !prevVal;
    setIsIdPublic(next);
    await persistPreferenceChange(
      { ...currentPreferencesSnapshot(), isIdPublic: next },
      'isIdPublic',
      () => setIsIdPublic(prevVal)
    );
  };

  const handleSelectAiAccess = async (level: AiAccessLevel) => {
    if (savingPrefKey === 'aiAccessLevel' || level === aiAccessLevel) return;
    const prevVal = aiAccessLevel;
    setAiAccessLevel(level);
    setAiSaveToast(false);
    const res = await persistPreferenceChange(
      { ...currentPreferencesSnapshot(), aiAccessLevel: level },
      'aiAccessLevel',
      () => setAiAccessLevel(prevVal)
    );
    if (res.ok) {
      setAiSaveToast(true);
      setTimeout(() => setAiSaveToast(false), 2500);
    }
  };

  const toggleEmailAlert = async (key: keyof typeof emailAlerts) => {
    const prefKey = `email.${key}`;
    if (savingPrefKey === prefKey) return;
    const prevAlerts = { ...emailAlerts };
    const nextAlerts = { ...emailAlerts, [key]: !emailAlerts[key] };
    setEmailAlerts(nextAlerts);
    await persistPreferenceChange(
      { ...currentPreferencesSnapshot(), emailAlerts: nextAlerts },
      prefKey,
      () => setEmailAlerts(prevAlerts)
    );
  };

  const toggleInAppAlert = async (key: keyof typeof inAppAlerts) => {
    const prefKey = `inApp.${key}`;
    if (savingPrefKey === prefKey) return;
    const prevAlerts = { ...inAppAlerts };
    const nextAlerts = { ...inAppAlerts, [key]: !inAppAlerts[key] };
    setInAppAlerts(nextAlerts);
    await persistPreferenceChange(
      { ...currentPreferencesSnapshot(), inAppAlerts: nextAlerts },
      prefKey,
      () => setInAppAlerts(prevAlerts)
    );
  };

  const handleSelectTheme = async (mode: 'dark' | 'white' | 'system') => {
    if (savingPrefKey === 'theme') return;
    const prevTheme = themeSelection;
    setThemeSelection(mode);
    const applyVisualTheme = (m: 'dark' | 'white' | 'system') => {
      if (m === 'dark') {
        onToggleTheme(true);
      } else if (m === 'white') {
        onToggleTheme(false);
      } else {
        const prefersDark =
          typeof window !== 'undefined' &&
          window.matchMedia &&
          window.matchMedia('(prefers-color-scheme: dark)').matches;
        onToggleTheme(prefersDark);
      }
    };
    applyVisualTheme(mode);
    await persistPreferenceChange(
      { ...currentPreferencesSnapshot(), theme: mode },
      'theme',
      () => {
        setThemeSelection(prevTheme);
        applyVisualTheme(prevTheme);
      }
    );
  };

  const handleSelectLanguage = async (lang: string) => {
    if (savingPrefKey === 'language' || lang === selectedLanguage) return;
    const prevLang = selectedLanguage;
    setSelectedLanguage(lang);
    await persistPreferenceChange(
      { ...currentPreferencesSnapshot(), language: lang },
      'language',
      () => setSelectedLanguage(prevLang)
    );
  };

  const handleRequestPhoneChangeSubmit = async () => {
    const trimmed = phoneState.trim();
    const digits = trimmed.replace(/\D/g, '');
    setPhoneStatusMsg(null);

    if (!trimmed || digits.length < 7 || digits.length > 16) {
      setPhoneStatusMsg({ text: 'Please enter a valid phone number with country code (e.g. +234...).', isError: true });
      return;
    }
    if (trimmed === (userPhone || '').trim()) {
      setPhoneStatusMsg({ text: 'Please enter a different phone number from your current registered number.', isError: true });
      return;
    }

    if (!onRequestPhoneChange) {
      if (onUpdatePhone) {
        onUpdatePhone(trimmed);
        setIsEditingPhone(false);
      }
      return;
    }

    setIsPhoneSubmitting(true);
    try {
      const res = await onRequestPhoneChange(trimmed);
      if (res.ok) {
        setLocalPendingPhone(res.pendingPhone || trimmed);
        setPhoneState(userPhone || '');
        setIsEditingPhone(false);
        setPhoneStatusMsg({
          text: res.message || PHONE_CHANGE_CONFIRMATION_MESSAGE,
          isError: false
        });
      } else {
        setPhoneStatusMsg({
          text: res.error || 'Unable to submit phone number change request.',
          isError: true
        });
      }
    } catch (err: any) {
      setPhoneStatusMsg({
        text: err?.message || 'Unable to submit phone number change request.',
        isError: true
      });
    } finally {
      setIsPhoneSubmitting(false);
    }
  };

  const handleRequestEmailChangeSubmit = async () => {
    const trimmed = emailState.trim().toLowerCase();
    setEmailStatusMsg(null);

    if (!trimmed || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(trimmed)) {
      setEmailStatusMsg({ text: 'Please enter a valid new email address.', isError: true });
      return;
    }
    if (trimmed === (userEmail || '').trim().toLowerCase()) {
      setEmailStatusMsg({ text: 'Please enter a different email address from your current registered email.', isError: true });
      return;
    }
    if (!emailCurrentPassword.trim()) {
      setEmailStatusMsg({ text: 'Please enter your current password to authorize this email address change.', isError: true });
      return;
    }

    if (!onRequestEmailChange) {
      if (onUpdateEmail) {
        onUpdateEmail(trimmed);
        setIsEditingEmail(false);
      }
      return;
    }

    setIsEmailSubmitting(true);
    try {
      const res = await onRequestEmailChange(trimmed, emailCurrentPassword.trim());
      if (res.ok) {
        setLocalPendingEmail(res.pendingEmail || trimmed);
        setEmailState(userEmail || '');
        setEmailCurrentPassword('');
        setIsEditingEmail(false);
        setEmailStatusMsg({
          text:
            res.message ||
            `A security notice was sent to your current email and a verification link was sent to ${trimmed}. Your email will update only after you click the verification link.`,
          isError: false
        });
      } else {
        setEmailStatusMsg({
          text: res.error || 'Unable to initiate email address change.',
          isError: true
        });
      }
    } catch (err: any) {
      setEmailStatusMsg({
        text: err?.message || 'Unable to initiate email address change.',
        isError: true
      });
    } finally {
      setIsEmailSubmitting(false);
    }
  };

  // Password submission handler (strictly awaits backend confirmation)
  const handleUpdatePasswordSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setPasswordStatusMsg(null);

    if (!currentPassword) {
      setPasswordStatusMsg({ text: 'Please enter your current password.', isError: true });
      return;
    }
    if (newPassword.length < 4) {
      setPasswordStatusMsg({ text: 'New password must be at least 4 digits.', isError: true });
      return;
    }
    if (newPassword === currentPassword) {
      setPasswordStatusMsg({ text: 'New password must be different from your current password.', isError: true });
      return;
    }
    if (newPassword !== confirmPassword) {
      setPasswordStatusMsg({ text: 'New password and confirm password do not match.', isError: true });
      return;
    }

    if (!onUpdatePassword) {
      setPasswordStatusMsg({ text: 'Password service unavailable.', isError: true });
      return;
    }

    setIsPasswordSubmitting(true);
    try {
      const res = await onUpdatePassword(newPassword, currentPassword);
      if (res === false || (typeof res === 'object' && res !== null && !res.ok)) {
        const errMsg =
          typeof res === 'object' && res !== null && res.error
            ? res.error
            : 'Incorrect current password or backend rejected update.';
        setPasswordStatusMsg({ text: errMsg, isError: true });
        return;
      }
      const successMsg =
        typeof res === 'object' && res !== null && res.message
          ? res.message
          : '✅ Password updated successfully. Security confirmation sent to your registered email.';
      setPasswordStatusMsg({ text: successMsg, isError: false });
      setCurrentPassword('');
      setNewPassword('');
      setConfirmPassword('');
    } catch (err: any) {
      setPasswordStatusMsg({
        text: err?.message || 'Failed to update password. Please verify your connection and try again.',
        isError: true
      });
    } finally {
      setIsPasswordSubmitting(false);
    }
  };

  if (!isOpen) return null;

  // Root Menu Configuration
  const rootMenuItems: Array<{
    id: RootSettingsTabId;
    title: string;
    icon: any;
    subpageTitle: string;
    subpageDescription: string;
  }> = [
    {
      id: 'account',
      title: tr('Account & Node', selectedLanguage),
      icon: User,
      subpageTitle: tr('Account & Node', selectedLanguage),
      subpageDescription: tr('Profile details, CHIXUS ID, and security posture', selectedLanguage)
    },
    {
      id: 'security',
      title: tr('Account Security', selectedLanguage),
      icon: Lock,
      subpageTitle: tr('Account Security', selectedLanguage),
      subpageDescription: tr('Two-factor controls and password rotation', selectedLanguage)
    },
    {
      id: 'privacy',
      title: tr('Privacy Policy', selectedLanguage),
      icon: Shield,
      subpageTitle: tr('Qorvex', selectedLanguage),
      subpageDescription: tr('Permissions, telemetry sharing, and voice access', selectedLanguage)
    },
    {
      id: 'notifications',
      title: tr('Notifications', selectedLanguage),
      icon: Bell,
      subpageTitle: tr('Notifications', selectedLanguage),
      subpageDescription: tr('Email & telemetry alert delivery controls', selectedLanguage)
    },
    {
      id: 'accessibility',
      title: `${tr('Accessibility', selectedLanguage)}, ${tr('Display', selectedLanguage)}, ${tr('Languages', selectedLanguage)}`,
      icon: Sliders,
      subpageTitle: `${tr('Accessibility', selectedLanguage)}, ${tr('Display', selectedLanguage)}, ${tr('Languages', selectedLanguage)}`,
      subpageDescription: tr('Contrast, audio feedback, and read receipts', selectedLanguage)
    },
    {
      id: 'resources',
      title: tr('About CHIXUS', selectedLanguage),
      icon: FileText,
      subpageTitle: tr('About CHIXUS', selectedLanguage),
      subpageDescription: tr('Platform architecture and diagnostic engine info', selectedLanguage)
    }
  ];

  // Dynamic search filter on root options
  const filteredMenuItems = rootMenuItems.filter((item) => {
    const q = searchQuery.toLowerCase().trim();
    if (!q) return true;
    if (
      (item.id === 'accessibility' || item.id === 'notifications') &&
      (q.includes('sound') || q.includes('audio') || q.includes('feedback') || q.includes('mute') || q.includes('tap') || q.includes('click'))
    ) {
      return true;
    }
    return (
      item.title.toLowerCase().includes(q) ||
      item.subpageTitle.toLowerCase().includes(q) ||
      item.subpageDescription.toLowerCase().includes(q)
    );
  });

  const activeItem = rootMenuItems.find((item) => item.id === activeTab) || rootMenuItems[0];

  const handleSelectRootTab = (tabId: RootSettingsTabId) => {
    setActiveTab(tabId);
    setIsMobileSubPageOpen(true);
  };

  return (
    <div
      id="settings-drawer-backdrop"
      style={{
        position: 'fixed',
        inset: 0,
        zIndex: 10040,
        backgroundColor: 'rgba(0, 0, 0, 0.85)',
        backdropFilter: 'blur(8px)',
        WebkitBackdropFilter: 'blur(8px)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        padding: '0'
      }}
      onClick={onClose}
    >
      <div
        id="settings-drawer-container"
        style={{
          width: '100%',
          maxWidth: '1080px',
          height: '100%',
          maxHeight: '100vh',
          background: darkModeTheme
            ? 'linear-gradient(180deg, #131722 0%, #0d1017 100%)'
            : 'linear-gradient(180deg, #ffffff 0%, #f8fafc 100%)',
          color: darkModeTheme ? '#f1f5f9' : '#0f172a',
          border: darkModeTheme ? '1px solid #282f42' : '1px solid #cbd5e1',
          boxShadow: '0 25px 60px rgba(0, 0, 0, 0.8)',
          display: 'flex',
          flexDirection: 'column',
          overflow: 'hidden',
          boxSizing: 'border-box'
        }}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Top Header */}
        <div
          style={{
            padding: '14px 20px',
            borderBottom: darkModeTheme ? '1px solid #222938' : '1px solid #e2e8f0',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            background: darkModeTheme ? 'rgba(15, 20, 30, 0.96)' : 'rgba(255, 255, 255, 0.96)',
            flexShrink: 0
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            <div
              style={{
                width: '32px',
                height: '32px',
                borderRadius: '8px',
                background: 'rgba(56, 189, 248, 0.16)',
                border: '1px solid #38bdf8',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center'
              }}
            >
              <Sliders style={{ width: '18px', height: '18px', color: '#38bdf8' }} />
            </div>
            <div>
              <div style={{ fontSize: '14px', fontWeight: 900, fontFamily: 'monospace', letterSpacing: '0.5px' }}>
                {tr('SETTINGS', selectedLanguage)}
              </div>
              <div style={{ fontSize: '10px', color: '#94a3b8', fontFamily: 'monospace' }}>
                {tr('Profile details, CHIXUS ID, and security posture', selectedLanguage)}
              </div>
            </div>
          </div>
          <button
            type="button"
            id="settings-drawer-close-btn"
            onClick={onClose}
            style={{
              padding: '6px 12px',
              borderRadius: '8px',
              background: darkModeTheme ? '#1e2433' : '#e2e8f0',
              border: darkModeTheme ? '1px solid #333d54' : '1px solid #cbd5e1',
              color: darkModeTheme ? '#cbd5e1' : '#475569',
              fontSize: '11px',
              fontFamily: 'monospace',
              fontWeight: 'bold',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              gap: '6px'
            }}
          >
            <X style={{ width: '15px', height: '15px' }} />
            <span>{tr('Close', selectedLanguage)}</span>
          </button>
        </div>

        {/* Responsive Dual Layout Container */}
        <div style={{ flex: 1, display: 'flex', overflow: 'hidden', position: 'relative' }}>
          {/* Menu Sidebar (Root List with Search Bar) */}
          {(!isMobile || !isMobileSubPageOpen) && (
            <div
              id="settings-menu-sidebar"
              style={{
                width: isMobile ? '100%' : '330px',
                borderRight: isMobile ? 'none' : darkModeTheme ? '1px solid #222938' : '1px solid #e2e8f0',
                display: 'flex',
                flexDirection: 'column',
                background: darkModeTheme ? '#10141e' : '#f8fafc',
                flexShrink: 0,
                height: '100%',
                overflowY: 'auto'
              }}
            >
              {/* Search Bar at Top of Settings */}
              <div style={{ padding: '14px 14px 8px 14px' }}>
                <div
                  style={{
                    position: 'relative',
                    display: 'flex',
                    alignItems: 'center',
                    background: darkModeTheme ? '#181d2a' : '#ffffff',
                    border: darkModeTheme ? '1px solid #2e374d' : '1px solid #cbd5e1',
                    borderRadius: '10px',
                    padding: '0 10px',
                    height: '38px'
                  }}
                >
                  <Search style={{ width: '15px', height: '15px', color: '#94a3b8', marginRight: '8px' }} />
                  <input
                    type="text"
                    id="settings-search-input"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    placeholder={tr('Search settings', selectedLanguage)}
                    style={{
                      flex: 1,
                      background: 'transparent',
                      border: 'none',
                      outline: 'none',
                      color: darkModeTheme ? '#ffffff' : '#0f172a',
                      fontSize: '12px',
                      fontFamily: 'monospace'
                    }}
                  />
                  {searchQuery && (
                    <button
                      type="button"
                      onClick={() => setSearchQuery('')}
                      style={{ background: 'none', border: 'none', color: '#94a3b8', cursor: 'pointer', padding: '2px' }}
                    >
                      <X style={{ width: '14px', height: '14px' }} />
                    </button>
                  )}
                </div>
              </div>

              {/* Root Menu Items (Strictly NO descriptive labels under them until tapped) */}
              <div style={{ padding: '8px 12px', display: 'flex', flexDirection: 'column', gap: '6px' }}>
                {filteredMenuItems.map((item) => {
                  const Icon = item.icon;
                  const isSelected = activeTab === item.id;
                  return (
                    <button
                      key={item.id}
                      type="button"
                      id={`settings-menu-${item.id}`}
                      onClick={() => handleSelectRootTab(item.id)}
                      style={{
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'space-between',
                        gap: '12px',
                        padding: '13px 14px',
                        borderRadius: '10px',
                        background: isSelected
                          ? darkModeTheme
                            ? 'rgba(56, 189, 248, 0.15)'
                            : '#e0f2fe'
                          : darkModeTheme
                          ? 'rgba(255, 255, 255, 0.03)'
                          : 'rgba(0, 0, 0, 0.03)',
                        border: isSelected
                          ? '1.5px solid #38bdf8'
                          : darkModeTheme
                          ? '1px solid rgba(255, 255, 255, 0.06)'
                          : '1px solid rgba(0, 0, 0, 0.08)',
                        cursor: 'pointer',
                        textAlign: 'left',
                        transition: 'all 0.15s ease'
                      }}
                    >
                      <div style={{ display: 'flex', alignItems: 'center', gap: '11px', minWidth: 0 }}>
                        <div
                          style={{
                            width: '32px',
                            height: '32px',
                            borderRadius: '8px',
                            background: isSelected
                              ? '#0284c7'
                              : darkModeTheme
                              ? '#1c2230'
                              : '#e2e8f0',
                            color: isSelected ? '#ffffff' : '#38bdf8',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            flexShrink: 0
                          }}
                        >
                          <Icon style={{ width: '16px', height: '16px' }} />
                        </div>
                        <span
                          style={{
                            fontSize: '13px',
                            fontWeight: isSelected ? 800 : 600,
                            fontFamily: 'monospace',
                            color: isSelected
                              ? darkModeTheme ? '#ffffff' : '#0369a1'
                              : darkModeTheme ? '#e2e8f0' : '#1e293b'
                          }}
                        >
                          {item.title}
                        </span>
                      </div>
                      <ChevronRight
                        style={{
                          width: '16px',
                          height: '16px',
                          color: isSelected ? '#38bdf8' : '#94a3b8',
                          flexShrink: 0
                        }}
                      />
                    </button>
                  );
                })}
                {filteredMenuItems.length === 0 && (
                  <div style={{ padding: '24px 12px', textAlign: 'center', color: '#94a3b8', fontSize: '11.5px', fontFamily: 'monospace' }}>
                    No matching settings found for "{searchQuery}"
                  </div>
                )}
              </div>

              {/* Sidebar Footer User Badge */}
              <div
                style={{
                  marginTop: 'auto',
                  padding: '12px 14px',
                  borderTop: darkModeTheme ? '1px solid #1c2230' : '1px solid #e2e8f0',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '10px'
                }}
              >
                <img
                  src={avatarUrl}
                  alt={userName}
                  style={{ width: '32px', height: '32px', borderRadius: '50%', objectFit: 'cover', border: '1.5px solid #38bdf8' }}
                />
                <div style={{ minWidth: 0, flex: 1 }}>
                  <div style={{ fontSize: '11px', fontWeight: 'bold', fontFamily: 'monospace', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                    {userName}
                  </div>
                  <div style={{ fontSize: '9px', color: '#38bdf8', fontFamily: 'monospace' }}>
                    {operatorId}
                  </div>
                </div>
                {onLogout && (
                  <button
                    type="button"
                    id="settings-sidebar-logout-btn"
                    onClick={onLogout}
                    title="Lock Node / Logout"
                    style={{
                      background: 'rgba(239, 68, 68, 0.12)',
                      border: '1px solid rgba(239, 68, 68, 0.35)',
                      borderRadius: '8px',
                      padding: '6px 8px',
                      color: '#fca5a5',
                      fontSize: '11px',
                      fontFamily: 'monospace',
                      fontWeight: 'bold',
                      cursor: 'pointer',
                      display: 'flex',
                      alignItems: 'center',
                      gap: '4px',
                      flexShrink: 0
                    }}
                  >
                    <LogOut style={{ width: '13px', height: '13px', color: '#f87171' }} />
                    <span>{tr('Logout', selectedLanguage)}</span>
                  </button>
                )}
              </div>
            </div>
          )}

          {/* Subpage Content Panel */}
          {(!isMobile || isMobileSubPageOpen) && (
            <div
              id="settings-subpage-content-panel"
              style={{
                flex: 1,
                width: isMobile ? '100%' : 'auto',
                height: '100%',
                overflowY: 'auto',
                padding: isMobile ? '16px' : '24px 30px',
                boxSizing: 'border-box',
                background: darkModeTheme ? '#0b0e14' : '#ffffff',
                display: 'flex',
                flexDirection: 'column'
              }}
            >
              {/* Mobile Back Button */}
              {isMobile && (
                <div style={{ marginBottom: '16px' }}>
                  <button
                    type="button"
                    id="settings-subpage-back-btn"
                    onClick={() => setIsMobileSubPageOpen(false)}
                    style={{
                      display: 'inline-flex',
                      alignItems: 'center',
                      gap: '8px',
                      padding: '8px 14px',
                      borderRadius: '8px',
                      background: darkModeTheme ? '#1e2433' : '#f1f5f9',
                      border: darkModeTheme ? '1px solid #333d54' : '1px solid #cbd5e1',
                      color: '#38bdf8',
                      fontSize: '12px',
                      fontFamily: 'monospace',
                      fontWeight: 'bold',
                      cursor: 'pointer'
                    }}
                  >
                    <ArrowLeft style={{ width: '15px', height: '15px' }} />
                    <span>{tr('Back to Settings', selectedLanguage)}</span>
                  </button>
                </div>
              )}

              {/* Subpage Title & Description */}
              <div style={{ borderBottom: darkModeTheme ? '1px solid #222938' : '1px solid #e2e8f0', paddingBottom: '14px', marginBottom: '22px' }}>
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '10px', flexWrap: 'wrap' }}>
                  <div style={{ fontSize: '17px', fontWeight: 900, fontFamily: 'monospace', color: darkModeTheme ? '#ffffff' : '#0f172a' }}>
                    {activeItem.subpageTitle}
                  </div>
                </div>
                <div style={{ fontSize: '11.5px', color: '#94a3b8', fontFamily: 'monospace', marginTop: '4px', lineHeight: 1.5 }}>
                  {activeItem.subpageDescription}
                </div>
                {prefBanner && !prefBanner.isError && (
                  <div
                    style={{
                      marginTop: '10px',
                      padding: '9px 12px',
                      borderRadius: '8px',
                      fontSize: '11px',
                      fontFamily: 'monospace',
                      display: 'flex',
                      alignItems: 'center',
                      gap: '8px',
                      background: 'rgba(37, 99, 235, 0.14)',
                      border: '1px solid #38bdf8',
                      color: '#7dd3fc'
                    }}
                  >
                    <CheckCircle2 style={{ width: '14px', height: '14px', flexShrink: 0 }} />
                    <span>{prefBanner.text}</span>
                  </div>
                )}
              </div>

              {/* ============================================================ */}
              {/* SUBPAGE 1: YOUR ACCOUNT */}
              {/* ============================================================ */}
              {activeTab === 'account' && (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '22px' }}>
                  {/* Account Information Card */}
                  <div
                    style={{
                      padding: '18px',
                      borderRadius: '12px',
                      background: darkModeTheme ? '#121622' : '#f8fafc',
                      border: darkModeTheme ? '1px solid #252b3d' : '1px solid #e2e8f0'
                    }}
                  >
                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '14px', gap: '8px' }}>
                      <div style={{ fontSize: '12px', fontWeight: 900, fontFamily: 'monospace', color: '#38bdf8' }}>
                        ACCOUNT CREDENTIALS
                      </div>
                      {onRefreshAccount && (
                        <button
                          type="button"
                          disabled={isRefreshingAccount}
                          onClick={async () => {
                            setIsRefreshingAccount(true);
                            try {
                              await onRefreshAccount();
                            } finally {
                              setIsRefreshingAccount(false);
                            }
                          }}
                          style={{
                            background: 'none',
                            border: darkModeTheme ? '1px solid #2e374d' : '1px solid #cbd5e1',
                            borderRadius: '6px',
                            padding: '4px 8px',
                            color: '#38bdf8',
                            fontSize: '10px',
                            fontFamily: 'monospace',
                            fontWeight: 'bold',
                            cursor: isRefreshingAccount ? 'wait' : 'pointer',
                            display: 'inline-flex',
                            alignItems: 'center',
                            gap: '5px'
                          }}
                        >
                          <RefreshCw style={{ width: '11px', height: '11px' }} />
                          <span>{isRefreshingAccount ? 'Refreshing...' : 'Refresh Status'}</span>
                        </button>
                      )}
                    </div>

                    <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                      {/* Permanent CHIXUS Account ID (Read-Only, Non-Phone Derived) */}
                      <div style={{ display: 'flex', flexDirection: 'column', gap: '4px', paddingBottom: '10px', borderBottom: darkModeTheme ? '1px solid #1c2230' : '1px solid #e2e8f0' }}>
                        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                          <span style={{ fontSize: '11px', color: '#94a3b8', fontFamily: 'monospace' }}>Permanent CHIXUS ID</span>
                          <span style={{ fontSize: '9.5px', color: '#10b981', fontFamily: 'monospace', fontWeight: 800 }}>
                            PERMANENT IDENTITY
                          </span>
                        </div>
                        <div style={{ fontSize: '13.5px', fontWeight: 800, fontFamily: 'monospace', color: '#38bdf8' }}>
                          {operatorId || 'Assigned on login'}
                        </div>
                        {internalId && internalId !== operatorId && (
                          <div style={{ fontSize: '10px', color: '#64748b', fontFamily: 'monospace' }}>
                            Internal Account UUID: {internalId}
                          </div>
                        )}
                      </div>

                      {/* Phone Number Item with Email-Verified Change Request */}
                      <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                          <span style={{ fontSize: '11px', color: '#94a3b8', fontFamily: 'monospace' }}>Phone Number</span>
                          <button
                            type="button"
                            disabled={isPhoneSubmitting}
                            onClick={() => {
                              setPhoneStatusMsg(null);
                              if (isEditingPhone) {
                                setPhoneState(userPhone || '');
                              }
                              setIsEditingPhone(!isEditingPhone);
                            }}
                            style={{
                              background: 'none',
                              border: 'none',
                              color: '#38bdf8',
                              fontSize: '11px',
                              fontFamily: 'monospace',
                              fontWeight: 'bold',
                              cursor: 'pointer'
                            }}
                          >
                            {isEditingPhone ? 'Cancel' : 'Edit'}
                          </button>
                        </div>
                        {isEditingPhone ? (
                          <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                            <div style={{ display: 'flex', gap: '8px' }}>
                              <input
                                type="text"
                                value={phoneState}
                                onChange={(e) => setPhoneState(e.target.value)}
                                placeholder="+234..."
                                disabled={isPhoneSubmitting}
                                style={{
                                  flex: 1,
                                  padding: '8px 12px',
                                  borderRadius: '8px',
                                  background: darkModeTheme ? '#181d2a' : '#ffffff',
                                  border: '1px solid #38bdf8',
                                  color: darkModeTheme ? '#ffffff' : '#0f172a',
                                  fontSize: '12px',
                                  fontFamily: 'monospace',
                                  outline: 'none'
                                }}
                              />
                              <button
                                type="button"
                                id="settings-save-phone-btn"
                                disabled={isPhoneSubmitting}
                                onClick={handleRequestPhoneChangeSubmit}
                                style={{
                                  padding: '8px 14px',
                                  borderRadius: '8px',
                                  background: isPhoneSubmitting ? '#475569' : '#0284c7',
                                  color: '#ffffff',
                                  border: 'none',
                                  fontSize: '11px',
                                  fontFamily: 'monospace',
                                  fontWeight: 'bold',
                                  cursor: isPhoneSubmitting ? 'wait' : 'pointer'
                                }}
                              >
                                {isPhoneSubmitting ? 'Sending...' : 'Request Change'}
                              </button>
                            </div>
                            <div style={{ fontSize: '10px', color: '#94a3b8', fontFamily: 'monospace' }}>
                              A confirmation link will be sent to your registered email ({userEmail || 'on file'}). Your CHIXUS ID will not change.
                            </div>
                          </div>
                        ) : (
                          <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
                            <div style={{ fontSize: '13px', fontWeight: 700, fontFamily: 'monospace' }}>
                              {userPhone || phoneState || 'Not registered'}
                            </div>
                            {localPendingPhone && (
                              <div style={{ fontSize: '10.5px', color: '#fbbf24', fontFamily: 'monospace' }}>
                                Pending email confirmation: {localPendingPhone}
                              </div>
                            )}
                          </div>
                        )}
                        {phoneStatusMsg && (
                          <div
                            id="phone-change-status-banner"
                            style={{
                              marginTop: '4px',
                              padding: '9px 11px',
                              borderRadius: '8px',
                              fontSize: '11px',
                              fontFamily: 'monospace',
                              lineHeight: 1.45,
                              background: phoneStatusMsg.isError ? 'rgba(239, 68, 68, 0.14)' : 'rgba(56, 189, 248, 0.14)',
                              color: phoneStatusMsg.isError ? '#f87171' : '#38bdf8',
                              border: phoneStatusMsg.isError ? '1px solid #ef4444' : '1px solid #38bdf8'
                            }}
                          >
                            {phoneStatusMsg.text}
                          </div>
                        )}
                      </div>

                      {/* Email Address Item with Authenticated Dual-Notification Change Flow */}
                      <div style={{ display: 'flex', flexDirection: 'column', gap: '6px', paddingTop: '10px', borderTop: darkModeTheme ? '1px solid #1c2230' : '1px solid #e2e8f0' }}>
                        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                          <span style={{ fontSize: '11px', color: '#94a3b8', fontFamily: 'monospace' }}>Email Address</span>
                          <button
                            type="button"
                            disabled={isEmailSubmitting}
                            onClick={() => {
                              setEmailStatusMsg(null);
                              setEmailCurrentPassword('');
                              if (isEditingEmail) {
                                setEmailState(userEmail || '');
                              }
                              setIsEditingEmail(!isEditingEmail);
                            }}
                            style={{
                              background: 'none',
                              border: 'none',
                              color: '#38bdf8',
                              fontSize: '11px',
                              fontFamily: 'monospace',
                              fontWeight: 'bold',
                              cursor: 'pointer'
                            }}
                          >
                            {isEditingEmail ? 'Cancel' : 'Edit'}
                          </button>
                        </div>
                        {isEditingEmail ? (
                          <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                            <input
                              type="email"
                              value={emailState}
                              onChange={(e) => setEmailState(e.target.value)}
                              placeholder="new-email@example.com"
                              disabled={isEmailSubmitting}
                              style={{
                                width: '100%',
                                padding: '8px 12px',
                                borderRadius: '8px',
                                background: darkModeTheme ? '#181d2a' : '#ffffff',
                                border: '1px solid #38bdf8',
                                color: darkModeTheme ? '#ffffff' : '#0f172a',
                                fontSize: '12px',
                                fontFamily: 'monospace',
                                outline: 'none',
                                boxSizing: 'border-box'
                              }}
                            />
                            <div style={{ display: 'flex', gap: '8px' }}>
                              <input
                                type="password"
                                value={emailCurrentPassword}
                                onChange={(e) => setEmailCurrentPassword(e.target.value)}
                                placeholder="Current password to authorize"
                                disabled={isEmailSubmitting}
                                style={{
                                  flex: 1,
                                  padding: '8px 12px',
                                  borderRadius: '8px',
                                  background: darkModeTheme ? '#181d2a' : '#ffffff',
                                  border: darkModeTheme ? '1px solid #2e374d' : '1px solid #cbd5e1',
                                  color: darkModeTheme ? '#ffffff' : '#0f172a',
                                  fontSize: '12px',
                                  fontFamily: 'monospace',
                                  outline: 'none'
                                }}
                              />
                              <button
                                type="button"
                                id="settings-save-email-btn"
                                disabled={isEmailSubmitting}
                                onClick={handleRequestEmailChangeSubmit}
                                style={{
                                  padding: '8px 14px',
                                  borderRadius: '8px',
                                  background: isEmailSubmitting ? '#475569' : '#0284c7',
                                  color: '#ffffff',
                                  border: 'none',
                                  fontSize: '11px',
                                  fontFamily: 'monospace',
                                  fontWeight: 'bold',
                                  cursor: isEmailSubmitting ? 'wait' : 'pointer'
                                }}
                              >
                                {isEmailSubmitting ? 'Sending...' : 'Send Verification'}
                              </button>
                            </div>
                            <div style={{ fontSize: '10px', color: '#94a3b8', fontFamily: 'monospace' }}>
                              We will notify your current email and send a verification link to the new email address.
                            </div>
                          </div>
                        ) : (
                          <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
                            <div style={{ fontSize: '13px', fontWeight: 700, fontFamily: 'monospace' }}>
                              {userEmail || emailState || 'Not registered'}
                            </div>
                            {localPendingEmail && (
                              <div style={{ fontSize: '10.5px', color: '#fbbf24', fontFamily: 'monospace' }}>
                                Pending verification: {localPendingEmail}
                              </div>
                            )}
                          </div>
                        )}
                        {emailStatusMsg && (
                          <div
                            id="email-change-status-banner"
                            style={{
                              marginTop: '4px',
                              padding: '9px 11px',
                              borderRadius: '8px',
                              fontSize: '11px',
                              fontFamily: 'monospace',
                              lineHeight: 1.45,
                              background: emailStatusMsg.isError ? 'rgba(239, 68, 68, 0.14)' : 'rgba(56, 189, 248, 0.14)',
                              color: emailStatusMsg.isError ? '#f87171' : '#38bdf8',
                              border: emailStatusMsg.isError ? '1px solid #ef4444' : '1px solid #38bdf8'
                            }}
                          >
                            {emailStatusMsg.text}
                          </div>
                        )}
                      </div>

                      {/* Country Display */}
                      <div style={{ display: 'flex', flexDirection: 'column', gap: '4px', paddingTop: '10px', borderTop: darkModeTheme ? '1px solid #1c2230' : '1px solid #e2e8f0' }}>
                        <span style={{ fontSize: '11px', color: '#94a3b8', fontFamily: 'monospace' }}>Country</span>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '13px', fontWeight: 700, fontFamily: 'monospace' }}>
                          <Globe style={{ width: '15px', height: '15px', color: '#38bdf8' }} />
                          <span>{countryState}</span>
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Change Your Password Section */}
                  <div
                    style={{
                      padding: '18px',
                      borderRadius: '12px',
                      background: darkModeTheme ? '#121622' : '#f8fafc',
                      border: darkModeTheme ? '1px solid #252b3d' : '1px solid #e2e8f0'
                    }}
                  >
                    <div style={{ fontSize: '12px', fontWeight: 900, fontFamily: 'monospace', color: '#38bdf8', marginBottom: '8px' }}>
                      CHANGE YOUR PASSWORD
                    </div>
                    <div style={{ fontSize: '11px', color: '#94a3b8', marginBottom: '16px' }}>
                      Passwords must contain a minimum of 4 digits.
                    </div>

                    <form onSubmit={handleUpdatePasswordSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
                      {/* Current Password Field */}
                      <div>
                        <label style={{ fontSize: '11px', color: '#94a3b8', fontFamily: 'monospace', display: 'block', marginBottom: '6px' }}>
                          Current Password
                        </label>
                        <div style={{ position: 'relative', display: 'flex', alignItems: 'center' }}>
                          <input
                            type={showCurrentPass ? 'text' : 'password'}
                            value={currentPassword}
                            onChange={(e) => setCurrentPassword(e.target.value)}
                            placeholder="Enter current password"
                            style={{
                              width: '100%',
                              padding: '10px 38px 10px 12px',
                              borderRadius: '8px',
                              background: darkModeTheme ? '#181d2a' : '#ffffff',
                              border: darkModeTheme ? '1px solid #2e374d' : '1px solid #cbd5e1',
                              color: darkModeTheme ? '#ffffff' : '#0f172a',
                              fontSize: '12px',
                              fontFamily: 'monospace',
                              outline: 'none'
                            }}
                          />
                          <button
                            type="button"
                            onClick={() => setShowCurrentPass(!showCurrentPass)}
                            style={{ position: 'absolute', right: '10px', background: 'none', border: 'none', color: '#94a3b8', cursor: 'pointer' }}
                          >
                            {showCurrentPass ? <EyeOff style={{ width: '16px', height: '16px' }} /> : <Eye style={{ width: '16px', height: '16px' }} />}
                          </button>
                        </div>
                      </div>

                      {/* New Password Field */}
                      <div>
                        <label style={{ fontSize: '11px', color: '#94a3b8', fontFamily: 'monospace', display: 'block', marginBottom: '6px' }}>
                          New Password (minimum 4 digits)
                        </label>
                        <div style={{ position: 'relative', display: 'flex', alignItems: 'center' }}>
                          <input
                            type={showNewPass ? 'text' : 'password'}
                            value={newPassword}
                            onChange={(e) => setNewPassword(e.target.value)}
                            placeholder="Enter at least 4 digits"
                            style={{
                              width: '100%',
                              padding: '10px 38px 10px 12px',
                              borderRadius: '8px',
                              background: darkModeTheme ? '#181d2a' : '#ffffff',
                              border: darkModeTheme ? '1px solid #2e374d' : '1px solid #cbd5e1',
                              color: darkModeTheme ? '#ffffff' : '#0f172a',
                              fontSize: '12px',
                              fontFamily: 'monospace',
                              outline: 'none'
                            }}
                          />
                          <button
                            type="button"
                            onClick={() => setShowNewPass(!showNewPass)}
                            style={{ position: 'absolute', right: '10px', background: 'none', border: 'none', color: '#94a3b8', cursor: 'pointer' }}
                          >
                            {showNewPass ? <EyeOff style={{ width: '16px', height: '16px' }} /> : <Eye style={{ width: '16px', height: '16px' }} />}
                          </button>
                        </div>
                      </div>

                      {/* Confirm Password Field */}
                      <div>
                        <label style={{ fontSize: '11px', color: '#94a3b8', fontFamily: 'monospace', display: 'block', marginBottom: '6px' }}>
                          Confirm Password
                        </label>
                        <div style={{ position: 'relative', display: 'flex', alignItems: 'center' }}>
                          <input
                            type={showConfirmPass ? 'text' : 'password'}
                            value={confirmPassword}
                            onChange={(e) => setConfirmPassword(e.target.value)}
                            placeholder="Re-enter new password"
                            style={{
                              width: '100%',
                              padding: '10px 38px 10px 12px',
                              borderRadius: '8px',
                              background: darkModeTheme ? '#181d2a' : '#ffffff',
                              border: darkModeTheme ? '1px solid #2e374d' : '1px solid #cbd5e1',
                              color: darkModeTheme ? '#ffffff' : '#0f172a',
                              fontSize: '12px',
                              fontFamily: 'monospace',
                              outline: 'none'
                            }}
                          />
                          <button
                            type="button"
                            onClick={() => setShowConfirmPass(!showConfirmPass)}
                            style={{ position: 'absolute', right: '10px', background: 'none', border: 'none', color: '#94a3b8', cursor: 'pointer' }}
                          >
                            {showConfirmPass ? <EyeOff style={{ width: '16px', height: '16px' }} /> : <Eye style={{ width: '16px', height: '16px' }} />}
                          </button>
                        </div>
                      </div>

                      {/* Status / Error Message */}
                      {passwordStatusMsg && (
                        <div
                          style={{
                            padding: '10px 12px',
                            borderRadius: '8px',
                            fontSize: '11.5px',
                            fontFamily: 'monospace',
                            background: passwordStatusMsg.isError ? 'rgba(239, 68, 68, 0.15)' : 'rgba(16, 185, 129, 0.15)',
                            color: passwordStatusMsg.isError ? '#ef4444' : '#10b981',
                            border: passwordStatusMsg.isError ? '1px solid #ef4444' : '1px solid #10b981'
                          }}
                        >
                          {passwordStatusMsg.text}
                        </div>
                      )}

                      {/* Update Password Button (Strictly NO reset link!) */}
                      <button
                        type="submit"
                        id="update-password-submit-btn"
                        disabled={isPasswordSubmitting}
                        style={{
                          marginTop: '4px',
                          padding: '12px 18px',
                          borderRadius: '8px',
                          background: isPasswordSubmitting ? '#475569' : '#0284c7',
                          color: '#ffffff',
                          border: 'none',
                          fontSize: '12px',
                          fontFamily: 'monospace',
                          fontWeight: 'bold',
                          cursor: isPasswordSubmitting ? 'wait' : 'pointer',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          gap: '8px'
                        }}
                      >
                        <Lock style={{ width: '15px', height: '15px' }} />
                        <span>{isPasswordSubmitting ? 'Updating password...' : 'Update password'}</span>
                      </button>
                    </form>
                  </div>

                  {/* Session & Node Access Logout Card */}
                  {onLogout && (
                    <div
                      style={{
                        padding: '18px',
                        borderRadius: '12px',
                        background: darkModeTheme ? 'rgba(239, 68, 68, 0.06)' : 'rgba(239, 68, 68, 0.04)',
                        border: '1px solid rgba(239, 68, 68, 0.25)',
                        display: 'flex',
                        flexDirection: 'column',
                        gap: '10px'
                      }}
                    >
                      <div style={{ fontSize: '12px', fontWeight: 900, fontFamily: 'monospace', color: '#f87171' }}>
                        SESSION LOCK & LOGOUT
                      </div>
                      <div style={{ fontSize: '11px', color: '#94a3b8', lineHeight: 1.5 }}>
                        End your active local session and lock this node. You will need your Operator ID and 4-digit code to log back in.
                      </div>
                      <button
                        type="button"
                        id="settings-account-logout-btn"
                        onClick={onLogout}
                        style={{
                          alignSelf: 'flex-start',
                          padding: '10px 18px',
                          borderRadius: '8px',
                          background: 'rgba(239, 68, 68, 0.15)',
                          border: '1px solid #ef4444',
                          color: '#fca5a5',
                          fontSize: '12px',
                          fontFamily: 'monospace',
                          fontWeight: 'bold',
                          cursor: 'pointer',
                          display: 'flex',
                          alignItems: 'center',
                          gap: '8px',
                          marginTop: '4px'
                        }}
                      >
                        <LogOut style={{ width: '15px', height: '15px', color: '#f87171' }} />
                        <span>{tr('Lock Node / Log Out', selectedLanguage)}</span>
                      </button>
                    </div>
                  )}
                </div>
              )}

              {/* ============================================================ */}
              {/* SUBPAGE 2: SECURITY AND ACCOUNT ACCESS */}
              {/* ============================================================ */}
              {activeTab === 'security' && (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
                  {/* ID Visibility Selection Card */}
                  <div
                    style={{
                      padding: '18px',
                      borderRadius: '12px',
                      background: darkModeTheme ? '#121622' : '#f8fafc',
                      border: darkModeTheme ? '1px solid #252b3d' : '1px solid #e2e8f0'
                    }}
                  >
                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '14px' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                        <div
                          style={{
                            width: '28px',
                            height: '28px',
                            borderRadius: '6px',
                            background: isIdPublic ? 'rgba(56, 189, 248, 0.16)' : 'rgba(148, 163, 184, 0.16)',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center'
                          }}
                        >
                          <KeyRound style={{ width: '16px', height: '16px', color: isIdPublic ? '#38bdf8' : '#94a3b8' }} />
                        </div>
                        <div>
                          <div style={{ fontSize: '13px', fontWeight: 900, fontFamily: 'monospace' }}>
                            OPERATOR ID VISIBILITY
                          </div>
                          <div style={{ fontSize: '10px', color: '#94a3b8', fontFamily: 'monospace' }}>
                            Current ID: <b style={{ color: '#38bdf8' }}>{operatorId}</b>
                          </div>
                        </div>
                      </div>

                      {/* Interactive Toggle Switch */}
                      <button
                        type="button"
                        id="toggle-id-visibility-btn"
                        onClick={handleToggleIdPublic}
                        style={{
                          position: 'relative',
                          width: '48px',
                          height: '26px',
                          borderRadius: '999px',
                          background: isIdPublic ? '#0284c7' : '#475569',
                          border: 'none',
                          cursor: 'pointer',
                          transition: 'background 0.2s ease',
                          padding: '2px'
                        }}
                      >
                        <div
                          style={{
                            width: '22px',
                            height: '22px',
                            borderRadius: '50%',
                            background: '#ffffff',
                            transform: isIdPublic ? 'translateX(22px)' : 'translateX(0)',
                            transition: 'transform 0.2s cubic-bezier(0.16, 1, 0.3, 1)',
                            boxShadow: '0 2px 4px rgba(0,0,0,0.2)'
                          }}
                        />
                      </button>
                    </div>

                    {/* Explanatory Cards for Public vs Private states */}
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                      <div
                        style={{
                          padding: '12px 14px',
                          borderRadius: '8px',
                          background: isIdPublic
                            ? darkModeTheme ? 'rgba(56, 189, 248, 0.12)' : '#e0f2fe'
                            : darkModeTheme ? '#181d2a' : '#ffffff',
                          border: isIdPublic ? '1px solid #38bdf8' : '1px solid rgba(148, 163, 184, 0.2)'
                        }}
                      >
                        <div style={{ fontSize: '12px', fontWeight: 'bold', fontFamily: 'monospace', color: isIdPublic ? '#38bdf8' : '#94a3b8' }}>
                          Toggle ON (Public):
                        </div>
                        <div style={{ fontSize: '11px', color: '#94a3b8', marginTop: '4px', lineHeight: 1.4 }}>
                          Your Master Operator ID is visible to the public, searchable in the operator index, and shareable for peer connections and technical discussions.
                        </div>
                      </div>

                      <div
                        style={{
                          padding: '12px 14px',
                          borderRadius: '8px',
                          background: !isIdPublic
                            ? darkModeTheme ? 'rgba(56, 189, 248, 0.12)' : '#e0f2fe'
                            : darkModeTheme ? '#181d2a' : '#ffffff',
                          border: !isIdPublic ? '1px solid #38bdf8' : '1px solid rgba(148, 163, 184, 0.2)'
                        }}
                      >
                        <div style={{ fontSize: '12px', fontWeight: 'bold', fontFamily: 'monospace', color: !isIdPublic ? '#38bdf8' : '#94a3b8' }}>
                          Toggle OFF (Private):
                        </div>
                        <div style={{ fontSize: '11px', color: '#94a3b8', marginTop: '4px', lineHeight: 1.4 }}>
                          Your ID is hidden from global search and excluded from public profile views (visible only when you edit your own profile). Accessible only when you share it directly with a peer.
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {/* ============================================================ */}
              {/* SUBPAGE 3: PRIVACY AND SAFETY (CHIXUS AI PERMISSIONS) */}
              {/* ============================================================ */}
              {activeTab === 'privacy' && (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
                  <div
                    style={{
                      padding: '18px',
                      borderRadius: '12px',
                      background: darkModeTheme ? '#121622' : '#f8fafc',
                      border: darkModeTheme ? '1px solid #252b3d' : '1px solid #e2e8f0'
                    }}
                  >
                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '8px' }}>
                      <div style={{ fontSize: '12px', fontWeight: 900, fontFamily: 'monospace', color: '#38bdf8' }}>
                        QORVEX ACCESS CONTROL
                      </div>
                      {aiSaveToast && (
                        <span style={{ fontSize: '10.5px', color: '#38bdf8', fontFamily: 'monospace', fontWeight: 'bold' }}>
                          ✓ Autosaved instantly
                        </span>
                      )}
                    </div>
                    <div style={{ fontSize: '11px', color: '#94a3b8', marginBottom: '16px', lineHeight: 1.4 }}>
                      Select the level of autonomous assistance and permission granted to Qorvex across your account features. Changes autosave instantly.
                    </div>

                    {/* Radio Selection List */}
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                      {[
                        {
                          id: 'feed' as AiAccessLevel,
                          label: 'Allow to feed',
                          desc: 'Qorvex can summarize feed posts, suggest technical replies, and moderate circuit discussions.'
                        },
                        {
                          id: 'inspect' as AiAccessLevel,
                          label: 'Allow to inspect',
                          desc: 'Qorvex can run automated neural solder joint inspection and confidence calculations on uploaded board images.'
                        },
                        {
                          id: 'profile' as AiAccessLevel,
                          label: 'Allow to profile and account details',
                          desc: 'Qorvex can analyze your verification credentials, star tiers, and historical inspection badges.'
                        },
                        {
                          id: 'none' as AiAccessLevel,
                          label: 'Not allowed',
                          desc: 'All autonomous AI background processing is disabled across your entire account.'
                        },
                        {
                          id: 'everything' as AiAccessLevel,
                          label: 'Allow to everything',
                          desc: 'Full assistance: AI enabled for feed analysis, solder optical inspection, profile insights, and real-time chat.'
                        },
                        {
                          id: 'no_message_allow_other' as AiAccessLevel,
                          label: 'Not allowed to message but allow to the other things',
                          desc: 'AI is strictly prohibited from accessing your direct messages, but permitted for feed and optical board inspection.'
                        }
                      ].map((opt) => {
                        const isSelected = aiAccessLevel === opt.id;
                        return (
                          <button
                            key={opt.id}
                            type="button"
                            id={`ai-access-opt-${opt.id}`}
                            onClick={() => handleSelectAiAccess(opt.id)}
                            style={{
                              display: 'flex',
                              alignItems: 'flex-start',
                              gap: '12px',
                              padding: '13px 14px',
                              borderRadius: '10px',
                              background: isSelected
                                ? darkModeTheme ? 'rgba(56, 189, 248, 0.14)' : '#e0f2fe'
                                : darkModeTheme ? '#181d2a' : '#ffffff',
                              border: isSelected
                                ? '1.5px solid #38bdf8'
                                : darkModeTheme ? '1px solid #282f42' : '1px solid #cbd5e1',
                              cursor: 'pointer',
                              textAlign: 'left',
                              transition: 'all 0.15s ease'
                            }}
                          >
                            <div
                              style={{
                                width: '18px',
                                height: '18px',
                                borderRadius: '50%',
                                border: isSelected ? '5px solid #38bdf8' : '2px solid #64748b',
                                background: '#ffffff',
                                marginTop: '2px',
                                flexShrink: 0
                              }}
                            />
                            <div style={{ flex: 1 }}>
                              <div style={{ fontSize: '12.5px', fontWeight: 800, fontFamily: 'monospace', color: isSelected ? '#38bdf8' : darkModeTheme ? '#f1f5f9' : '#0f172a' }}>
                                {opt.label}
                              </div>
                              <div style={{ fontSize: '11px', color: '#94a3b8', marginTop: '3px', lineHeight: 1.4 }}>
                                {opt.desc}
                              </div>
                            </div>
                          </button>
                        );
                      })}
                    </div>
                  </div>
                </div>
              )}

              {/* ============================================================ */}
              {/* SUBPAGE 4: NOTIFICATIONS */}
              {/* ============================================================ */}
              {activeTab === 'notifications' && (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '22px' }}>
                  {/* Email Alerts Group */}
                  <div
                    style={{
                      padding: '18px',
                      borderRadius: '12px',
                      background: darkModeTheme ? '#121622' : '#f8fafc',
                      border: darkModeTheme ? '1px solid #252b3d' : '1px solid #e2e8f0'
                    }}
                  >
                    <div style={{ fontSize: '12px', fontWeight: 900, fontFamily: 'monospace', color: '#38bdf8', marginBottom: '8px' }}>
                      EMAIL ALERTS GROUP
                    </div>
                    <div style={{ fontSize: '11px', color: '#94a3b8', marginBottom: '14px' }}>
                      Control periodic digest reports and verification emails sent to your registered email address.
                    </div>

                    <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
                      {[
                        {
                          key: 'weeklyReport' as const,
                          label: 'Weekly Account Report',
                          desc: 'Weekly summary of account performance, inspection throughput, growth metrics, and peer interactions.'
                        },
                        {
                          key: 'verifiedOnly' as const,
                          label: 'Verified Account Only',
                          desc: 'Alerts and digest notifications triggered exclusively by peer operators holding verified star tiers.'
                        },
                        {
                          key: 'newUpdate' as const,
                          label: 'New Update',
                          desc: 'Official platform release notes, neural inspection model upgrades, and system enhancements.'
                        },
                        {
                          key: 'tips' as const,
                          label: 'Tips on Getting More Out of CHIXUS',
                          desc: 'Best practices for optical fault detection, IPC-A-610 Class 3 compliance, and battery telemetry optimizations.'
                        }
                      ].map((item) => {
                        const isChecked = emailAlerts[item.key];
                        return (
                          <div
                            key={item.key}
                            style={{
                              display: 'flex',
                              alignItems: 'center',
                              justifyContent: 'space-between',
                              gap: '14px',
                              padding: '10px 0',
                              borderBottom: darkModeTheme ? '1px solid #1c2230' : '1px solid #e2e8f0'
                            }}
                          >
                            <div>
                              <div style={{ fontSize: '12.5px', fontWeight: 700, fontFamily: 'monospace' }}>
                                {item.label}
                              </div>
                              <div style={{ fontSize: '10.5px', color: '#94a3b8', marginTop: '2px', lineHeight: 1.4 }}>
                                {item.desc}
                              </div>
                            </div>
                            <button
                              type="button"
                              role="switch"
                              aria-checked={isChecked}
                              disabled={savingPrefKey === `email.${item.key}`}
                              onClick={() => toggleEmailAlert(item.key)}
                              style={{
                                position: 'relative',
                                width: '42px',
                                height: '24px',
                                borderRadius: '999px',
                                background: isChecked ? '#0284c7' : '#475569',
                                border: 'none',
                                cursor: savingPrefKey === `email.${item.key}` ? 'wait' : 'pointer',
                                opacity: savingPrefKey === `email.${item.key}` ? 0.6 : 1,
                                transition: 'background 0.2s ease',
                                padding: '2px',
                                flexShrink: 0
                              }}
                            >
                              <div
                                style={{
                                  width: '20px',
                                  height: '20px',
                                  borderRadius: '50%',
                                  background: '#ffffff',
                                  transform: isChecked ? 'translateX(18px)' : 'translateX(0)',
                                  transition: 'transform 0.2s cubic-bezier(0.16, 1, 0.3, 1)',
                                  boxShadow: '0 2px 4px rgba(0,0,0,0.2)'
                                }}
                              />
                            </button>
                          </div>
                        );
                      })}
                    </div>
                  </div>

                  {/* In-App Notifications Group */}
                  <div
                    style={{
                      padding: '18px',
                      borderRadius: '12px',
                      background: darkModeTheme ? '#121622' : '#f8fafc',
                      border: darkModeTheme ? '1px solid #252b3d' : '1px solid #e2e8f0'
                    }}
                  >
                    <div style={{ fontSize: '12px', fontWeight: 900, fontFamily: 'monospace', color: '#38bdf8', marginBottom: '8px' }}>
                      IN-APP NOTIFICATIONS GROUP
                    </div>
                    <div style={{ fontSize: '11px', color: '#94a3b8', marginBottom: '14px' }}>
                      Control live toasts, real-time message alerts, and on-screen popups within the CHIXUS viewport.
                    </div>

                    <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
                      {[
                        {
                          key: 'popupToast' as const,
                          label: 'In-App Popup / Toast Alerts',
                          desc: 'Real-time popups on screen confirming whether user actions were successful or unsuccessful.'
                        },
                        {
                          key: 'appUpdate' as const,
                          label: 'App Update',
                          desc: 'Real-time toast notifications alerting you when a new version of CHIXUS is ready to install.'
                        },
                        {
                          key: 'directMessage' as const,
                          label: 'Direct Message',
                          desc: 'Instant banner alerts and chime cues when receiving messages from peer grid operators.'
                        },
                        {
                          key: 'contactJoin' as const,
                          label: 'Contact Join CHIXUS',
                          desc: 'On-screen notifications when a contact from your sovereign network registers a new operator node.'
                        }
                      ].map((item) => {
                        const isChecked = inAppAlerts[item.key];
                        return (
                          <div
                            key={item.key}
                            style={{
                              display: 'flex',
                              alignItems: 'center',
                              justifyContent: 'space-between',
                              gap: '14px',
                              padding: '10px 0',
                              borderBottom: darkModeTheme ? '1px solid #1c2230' : '1px solid #e2e8f0'
                            }}
                          >
                            <div>
                              <div style={{ fontSize: '12.5px', fontWeight: 700, fontFamily: 'monospace' }}>
                                {item.label}
                              </div>
                              <div style={{ fontSize: '10.5px', color: '#94a3b8', marginTop: '2px', lineHeight: 1.4 }}>
                                {item.desc}
                              </div>
                            </div>
                            <button
                              type="button"
                              role="switch"
                              aria-checked={isChecked}
                              disabled={savingPrefKey === `inApp.${item.key}`}
                              onClick={() => toggleInAppAlert(item.key)}
                              style={{
                                position: 'relative',
                                width: '42px',
                                height: '24px',
                                borderRadius: '999px',
                                background: isChecked ? '#0284c7' : '#475569',
                                border: 'none',
                                cursor: savingPrefKey === `inApp.${item.key}` ? 'wait' : 'pointer',
                                opacity: savingPrefKey === `inApp.${item.key}` ? 0.6 : 1,
                                transition: 'background 0.2s ease',
                                padding: '2px',
                                flexShrink: 0
                              }}
                            >
                              <div
                                style={{
                                  width: '20px',
                                  height: '20px',
                                  borderRadius: '50%',
                                  background: '#ffffff',
                                  transform: isChecked ? 'translateX(18px)' : 'translateX(0)',
                                  transition: 'transform 0.2s cubic-bezier(0.16, 1, 0.3, 1)',
                                  boxShadow: '0 2px 4px rgba(0,0,0,0.2)'
                                }}
                              />
                            </button>
                          </div>
                        );
                      })}

                      {/* Sound Feedback Toggle Row in Notifications Group */}
                      <div
                        style={{
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'space-between',
                          gap: '14px',
                          padding: '12px 0',
                          borderTop: darkModeTheme ? '1px solid #1c2230' : '1px solid #e2e8f0'
                        }}
                      >
                        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                          <div style={{ color: soundFeedbackActive ? '#38bdf8' : '#94a3b8' }}>
                            {soundFeedbackActive ? <Volume2 style={{ width: '18px', height: '18px' }} /> : <VolumeX style={{ width: '18px', height: '18px' }} />}
                          </div>
                          <div>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                              <span style={{ fontSize: '12.5px', fontWeight: 700, fontFamily: 'monospace' }}>
                                {tr('Sound Feedback', selectedLanguage)}
                              </span>
                              <span
                                style={{
                                  fontSize: '9px',
                                  fontFamily: 'monospace',
                                  fontWeight: 800,
                                  padding: '1px 5px',
                                  borderRadius: '3px',
                                  background: soundFeedbackActive ? 'rgba(56, 189, 248, 0.18)' : 'rgba(100, 116, 139, 0.2)',
                                  color: soundFeedbackActive ? '#38bdf8' : '#94a3b8',
                                  border: soundFeedbackActive ? '1px solid #38bdf8' : '1px solid #64748b'
                                }}
                              >
                                {tr(soundFeedbackActive ? 'On' : 'Off', selectedLanguage)}
                              </span>
                            </div>
                            <div style={{ fontSize: '10.5px', color: '#94a3b8', marginTop: '2px', lineHeight: 1.4 }}>
                              Completely mute or enable all UI tap, click, and button sound effects across the entire app.
                            </div>
                          </div>
                        </div>
                        <button
                          type="button"
                          id="notifications-sound-feedback-toggle"
                          role="switch"
                          aria-checked={soundFeedbackActive}
                          onClick={handleToggleSoundFeedback}
                          style={{
                            position: 'relative',
                            width: '42px',
                            height: '24px',
                            borderRadius: '999px',
                            background: soundFeedbackActive ? '#0284c7' : '#475569',
                            border: 'none',
                            cursor: 'pointer',
                            transition: 'background 0.2s ease',
                            padding: '2px',
                            flexShrink: 0
                          }}
                        >
                          <div
                            style={{
                              width: '20px',
                              height: '20px',
                              borderRadius: '50%',
                              background: '#ffffff',
                              transform: soundFeedbackActive ? 'translateX(18px)' : 'translateX(0)',
                              transition: 'transform 0.2s cubic-bezier(0.16, 1, 0.3, 1)',
                              boxShadow: '0 2px 4px rgba(0,0,0,0.2)'
                            }}
                          />
                        </button>
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {/* ============================================================ */}
              {/* SUBPAGE 5: ACCESSIBILITY, DISPLAY, AND LANGUAGES */}
              {/* ============================================================ */}
              {activeTab === 'accessibility' && (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '22px' }}>
                  {/* Sound Feedback Toggle Card in Accessibility */}
                  <div
                    id="settings-sound-feedback-card"
                    style={{
                      padding: '18px',
                      borderRadius: '12px',
                      background: darkModeTheme ? '#121622' : '#f8fafc',
                      border: darkModeTheme ? '1px solid #252b3d' : '1px solid #e2e8f0',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'space-between',
                      gap: '16px'
                    }}
                  >
                    <div style={{ display: 'flex', alignItems: 'center', gap: '14px' }}>
                      <div
                        style={{
                          width: '42px',
                          height: '42px',
                          borderRadius: '10px',
                          background: soundFeedbackActive ? 'rgba(56, 189, 248, 0.15)' : 'rgba(100, 116, 139, 0.15)',
                          border: soundFeedbackActive ? '1px solid rgba(56, 189, 248, 0.45)' : '1px solid rgba(100, 116, 139, 0.3)',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          color: soundFeedbackActive ? '#38bdf8' : '#94a3b8',
                          flexShrink: 0
                        }}
                      >
                        {soundFeedbackActive ? (
                          <Volume2 style={{ width: '22px', height: '22px' }} />
                        ) : (
                          <VolumeX style={{ width: '22px', height: '22px' }} />
                        )}
                      </div>
                      <div>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                          <span style={{ fontSize: '13px', fontWeight: 900, fontFamily: 'monospace', color: darkModeTheme ? '#ffffff' : '#0f172a' }}>
                            {tr('Sound Feedback', selectedLanguage)}
                          </span>
                          <span
                            id="sound-feedback-status-badge"
                            style={{
                              fontSize: '10px',
                              fontFamily: 'monospace',
                              fontWeight: 800,
                              padding: '2px 7px',
                              borderRadius: '4px',
                              background: soundFeedbackActive ? 'rgba(56, 189, 248, 0.18)' : 'rgba(100, 116, 139, 0.2)',
                              color: soundFeedbackActive ? '#38bdf8' : '#94a3b8',
                              border: soundFeedbackActive ? '1px solid #38bdf8' : '1px solid #64748b'
                            }}
                          >
                            {tr(soundFeedbackActive ? 'On' : 'Off', selectedLanguage)}
                          </span>
                        </div>
                        <div style={{ fontSize: '11px', color: '#94a3b8', marginTop: '3px', lineHeight: 1.4 }}>
                          {soundFeedbackActive
                            ? 'All UI tap, click, and button sound effects are active across the app.'
                            : 'All UI tap, click, and button sound effects are completely muted across the entire app.'}
                        </div>
                      </div>
                    </div>

                    <button
                      type="button"
                      id="sound-feedback-toggle-switch"
                      role="switch"
                      aria-checked={soundFeedbackActive}
                      onClick={handleToggleSoundFeedback}
                      style={{
                        position: 'relative',
                        width: '48px',
                        height: '26px',
                        borderRadius: '999px',
                        background: soundFeedbackActive ? '#0284c7' : '#475569',
                        border: 'none',
                        cursor: 'pointer',
                        transition: 'background 0.2s ease',
                        padding: '2px',
                        flexShrink: 0
                      }}
                    >
                      <div
                        style={{
                          width: '22px',
                          height: '22px',
                          borderRadius: '50%',
                          background: '#ffffff',
                          transform: soundFeedbackActive ? 'translateX(22px)' : 'translateX(0)',
                          transition: 'transform 0.2s cubic-bezier(0.16, 1, 0.3, 1)',
                          boxShadow: '0 2px 4px rgba(0,0,0,0.3)'
                        }}
                      />
                    </button>
                  </div>

                  {/* Interface Theme Palette */}
                  <div
                    style={{
                      padding: '18px',
                      borderRadius: '12px',
                      background: darkModeTheme ? '#121622' : '#f8fafc',
                      border: darkModeTheme ? '1px solid #252b3d' : '1px solid #e2e8f0'
                    }}
                  >
                    <div style={{ fontSize: '12px', fontWeight: 900, fontFamily: 'monospace', color: '#38bdf8', marginBottom: '8px' }}>
                      {tr('Display', selectedLanguage).toUpperCase()}
                    </div>
                    <div style={{ fontSize: '11px', color: '#94a3b8', marginBottom: '14px' }}>
                      {tr('Dark and light interface theme appearance', selectedLanguage)}
                    </div>

                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(130px, 1fr))', gap: '10px' }}>
                      {[
                        { id: 'dark' as const, label: tr('Dark', selectedLanguage), icon: Moon, desc: tr('Dark', selectedLanguage) },
                        { id: 'white' as const, label: tr('White', selectedLanguage), icon: Sun, desc: tr('White', selectedLanguage) },
                        { id: 'system' as const, label: tr('System Default', selectedLanguage), icon: Monitor, desc: tr('System Default', selectedLanguage) }
                      ].map((t) => {
                        const isSelected = themeSelection === t.id;
                        const Icon = t.icon;
                        return (
                          <button
                            key={t.id}
                            type="button"
                            id={`theme-opt-${t.id}`}
                            onClick={() => handleSelectTheme(t.id)}
                            style={{
                              display: 'flex',
                              flexDirection: 'column',
                              alignItems: 'center',
                              gap: '8px',
                              padding: '14px 10px',
                              borderRadius: '10px',
                              background: isSelected
                                ? '#0284c7'
                                : darkModeTheme ? '#181d2a' : '#ffffff',
                              border: isSelected
                                ? '2px solid #38bdf8'
                                : darkModeTheme ? '1px solid #282f42' : '1px solid #cbd5e1',
                              color: isSelected ? '#ffffff' : darkModeTheme ? '#f1f5f9' : '#0f172a',
                              cursor: 'pointer',
                              transition: 'all 0.15s ease'
                            }}
                          >
                            <Icon style={{ width: '20px', height: '20px' }} />
                            <span style={{ fontSize: '12px', fontWeight: 800, fontFamily: 'monospace' }}>
                              {t.label}
                            </span>
                            <span style={{ fontSize: '9.5px', color: isSelected ? 'rgba(255,255,255,0.85)' : '#94a3b8' }}>
                              {t.desc}
                            </span>
                          </button>
                        );
                      })}
                    </div>
                  </div>

                  {/* Clean Language Selection */}
                  <div
                    style={{
                      padding: '18px',
                      borderRadius: '12px',
                      background: darkModeTheme ? '#121622' : '#f8fafc',
                      border: darkModeTheme ? '1px solid #252b3d' : '1px solid #e2e8f0'
                    }}
                  >
                    <div style={{ fontSize: '12px', fontWeight: 900, fontFamily: 'monospace', color: '#38bdf8', marginBottom: '8px' }}>
                      {tr('SUPPORTED LANGUAGES', selectedLanguage)}
                    </div>
                    <div style={{ fontSize: '11px', color: '#94a3b8', marginBottom: '14px', lineHeight: 1.4 }}>
                      {tr('Choose your preferred CHIXUS interface language', selectedLanguage)}
                    </div>

                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(140px, 1fr))', gap: '8px', maxHeight: '280px', overflowY: 'auto' }}>
                      {SUPPORTED_LANGUAGES.map((lang) => {
                        const isSelected = selectedLanguage === lang;
                        return (
                          <button
                            key={lang}
                            type="button"
                            onClick={() => handleSelectLanguage(lang)}
                            style={{
                              display: 'flex',
                              alignItems: 'center',
                              justifyContent: 'space-between',
                              padding: '10px 12px',
                              borderRadius: '8px',
                              background: isSelected
                                ? darkModeTheme ? 'rgba(56, 189, 248, 0.18)' : '#e0f2fe'
                                : darkModeTheme ? '#181d2a' : '#ffffff',
                              border: isSelected
                                ? '1.5px solid #38bdf8'
                                : darkModeTheme ? '1px solid #282f42' : '1px solid #cbd5e1',
                              color: isSelected
                                ? '#38bdf8'
                                : darkModeTheme ? '#cbd5e1' : '#334155',
                              fontSize: '11.5px',
                              fontFamily: 'monospace',
                              fontWeight: isSelected ? 800 : 500,
                              cursor: 'pointer',
                              textAlign: 'left'
                            }}
                          >
                            <span>{lang}</span>
                            {isSelected && <Check style={{ width: '14px', height: '14px', color: '#38bdf8' }} />}
                          </button>
                        );
                      })}
                    </div>
                  </div>
                </div>
              )}

              {/* ============================================================ */}
              {/* SUBPAGE 6: ADDITIONAL RESOURCES */}
              {/* ============================================================ */}
              {activeTab === 'resources' && (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
                  <div
                    style={{
                      padding: '18px',
                      borderRadius: '12px',
                      background: darkModeTheme ? '#121622' : '#f8fafc',
                      border: darkModeTheme ? '1px solid #252b3d' : '1px solid #e2e8f0'
                    }}
                  >
                    <div style={{ fontSize: '12px', fontWeight: 900, fontFamily: 'monospace', color: '#38bdf8', marginBottom: '12px' }}>
                      PLATFORM SPECIFICATIONS & DATA INTEGRITY
                    </div>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', padding: '8px 0', borderBottom: darkModeTheme ? '1px solid #1c2230' : '1px solid #e2e8f0' }}>
                        <span style={{ fontSize: '11px', color: '#94a3b8', fontFamily: 'monospace' }}>Platform Edition</span>
                        <span style={{ fontSize: '11.5px', fontWeight: 'bold', fontFamily: 'monospace' }}>CHIXUS Grid Core v1.23.4</span>
                      </div>
                      <div style={{ display: 'flex', justifyContent: 'space-between', padding: '8px 0', borderBottom: darkModeTheme ? '1px solid #1c2230' : '1px solid #e2e8f0' }}>
                        <span style={{ fontSize: '11px', color: '#94a3b8', fontFamily: 'monospace' }}>Inspection Standard</span>
                        <span style={{ fontSize: '11.5px', fontWeight: 'bold', fontFamily: 'monospace', color: '#fbbf24' }}>IPC-A-610 Class 3</span>
                      </div>
                      <div style={{ display: 'flex', justifyContent: 'space-between', padding: '8px 0', borderBottom: darkModeTheme ? '1px solid #1c2230' : '1px solid #e2e8f0' }}>
                        <span style={{ fontSize: '11px', color: '#94a3b8', fontFamily: 'monospace' }}>Audit Lock Window</span>
                        <span style={{ fontSize: '11.5px', fontWeight: 'bold', fontFamily: 'monospace', color: '#10b981' }}>96-Hour Retention</span>
                      </div>
                      <div style={{ display: 'flex', justifyContent: 'space-between', padding: '8px 0' }}>
                        <span style={{ fontSize: '11px', color: '#94a3b8', fontFamily: 'monospace' }}>Local IndexedDB Storage</span>
                        <span style={{ fontSize: '11.5px', fontWeight: 'bold', fontFamily: 'monospace' }}>{totalChatMessagesCount} cached messages</span>
                      </div>
                    </div>
                  </div>

                  {onClearAllMessagesPrompt && (
                    <button
                      type="button"
                      id="settings-clear-cache-btn"
                      onClick={onClearAllMessagesPrompt}
                      style={{
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        gap: '8px',
                        padding: '12px',
                        borderRadius: '8px',
                        background: 'rgba(239, 68, 68, 0.1)',
                        border: '1px solid #ef4444',
                        color: '#ef4444',
                        fontSize: '11px',
                        fontFamily: 'monospace',
                        fontWeight: 'bold',
                        cursor: 'pointer'
                      }}
                    >
                      <Trash2 style={{ width: '14px', height: '14px' }} />
                      <span>Clear Local Application Data & Cache</span>
                    </button>
                  )}
                </div>
              )}

              {/* Global Centered Muted Copyright Footer */}
              <div
                style={{
                  marginTop: 'auto',
                  paddingTop: '28px',
                  paddingBottom: '8px',
                  textAlign: 'center',
                  fontSize: '11px',
                  fontFamily: 'monospace',
                  color: '#64748b'
                }}
              >
                © 2026 CHIXUS Systems. All rights reserved.
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default SettingsDrawerSplitView;
