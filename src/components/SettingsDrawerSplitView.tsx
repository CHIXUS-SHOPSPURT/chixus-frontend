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
  VolumeX
} from 'lucide-react';

export interface SettingsDrawerSplitViewProps {
  isOpen: boolean;
  onClose: () => void;
  darkModeTheme: boolean;
  onToggleTheme: (targetMode?: boolean) => void;
  userName: string;
  userHeadline?: string;
  userLocation?: string;
  operatorId: string;
  avatarUrl: string;
  userPhone?: string;
  userEmail?: string;
  userCountry?: string;
  onUpdatePhone?: (newPhone: string) => void;
  onUpdateEmail?: (newEmail: string) => void;
  onUpdatePassword?: (newPassword: string) => boolean | Promise<boolean>;
  totalChatMessagesCount?: number;
  onClearAllMessagesPrompt?: () => void;
  soundFeedbackEnabled?: boolean;
  onToggleSoundFeedback?: (enabled?: boolean) => void;
  [key: string]: any;
}

export type RootSettingsTabId =
  | 'account'
  | 'security'
  | 'privacy'
  | 'notifications'
  | 'accessibility'
  | 'resources';

export type AiAccessLevel =
  | 'feed'
  | 'inspect'
  | 'profile'
  | 'none'
  | 'everything'
  | 'no_message_allow_other';

export const SettingsDrawerSplitView: React.FC<SettingsDrawerSplitViewProps> = ({
  isOpen,
  onClose,
  darkModeTheme,
  onToggleTheme,
  userName,
  userHeadline,
  userLocation,
  operatorId,
  avatarUrl,
  userPhone = '',
  userEmail = '',
  userCountry = 'Nigeria',
  onUpdatePhone,
  onUpdateEmail,
  onUpdatePassword,
  totalChatMessagesCount = 0,
  onClearAllMessagesPrompt,
  soundFeedbackEnabled: soundFeedbackEnabledProp,
  onToggleSoundFeedback
}) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [activeTab, setActiveTab] = useState<RootSettingsTabId>('account');
  const [isMobileSubPageOpen, setIsMobileSubPageOpen] = useState(false);

  const [soundFeedbackActive, setSoundFeedbackActive] = useState<boolean>(() => {
    if (soundFeedbackEnabledProp !== undefined) return soundFeedbackEnabledProp;
    try {
      const saved = localStorage.getItem('chixus_sound_feedback_enabled_v1');
      return saved !== 'false';
    } catch {
      return true;
    }
  });

  useEffect(() => {
    if (soundFeedbackEnabledProp !== undefined) {
      setSoundFeedbackActive(soundFeedbackEnabledProp);
    }
  }, [soundFeedbackEnabledProp]);

  const handleToggleSoundFeedback = () => {
    const next = !soundFeedbackActive;
    setSoundFeedbackActive(next);
    try {
      localStorage.setItem('chixus_sound_feedback_enabled_v1', next ? 'true' : 'false');
    } catch {}
    if (onToggleSoundFeedback) {
      onToggleSoundFeedback(next);
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
    }
  }, [isOpen]);

  // ==========================================
  // 1. YOUR ACCOUNT: Editable Phone, Email, Country & Password change
  // ==========================================
  const [phoneState, setPhoneState] = useState(userPhone);
  const [isEditingPhone, setIsEditingPhone] = useState(false);
  const [emailState, setEmailState] = useState(userEmail);
  const [isEditingEmail, setIsEditingEmail] = useState(false);
  const [countryState, setCountryState] = useState(userCountry);

  // Sync initial props
  useEffect(() => {
    if (userPhone) setPhoneState(userPhone);
    if (userEmail) setEmailState(userEmail);
    if (userCountry) setCountryState(userCountry);
  }, [userPhone, userEmail, userCountry]);

  // Password fields
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showCurrentPass, setShowCurrentPass] = useState(false);
  const [showNewPass, setShowNewPass] = useState(false);
  const [showConfirmPass, setShowConfirmPass] = useState(false);
  const [passwordStatusMsg, setPasswordStatusMsg] = useState<{ text: string; isError: boolean } | null>(null);

  // ==========================================
  // 2. SECURITY & ACCESS: Public / Private ID Card
  // ==========================================
  const [isIdPublic, setIsIdPublic] = useState<boolean>(() => {
    try {
      const saved = localStorage.getItem('chixus_id_public_visibility_v1');
      return saved !== null ? saved === 'true' : true;
    } catch {
      return true;
    }
  });

  const handleToggleIdPublic = () => {
    const next = !isIdPublic;
    setIsIdPublic(next);
    try {
      localStorage.setItem('chixus_id_public_visibility_v1', String(next));
    } catch {}
  };

  // ==========================================
  // 3. PRIVACY & SAFETY: CHIXUS AI Access Control Group
  // ==========================================
  const [aiAccessLevel, setAiAccessLevel] = useState<AiAccessLevel>(() => {
    try {
      const saved = localStorage.getItem('chixus_ai_access_permission_v1');
      if (
        saved === 'feed' ||
        saved === 'inspect' ||
        saved === 'profile' ||
        saved === 'none' ||
        saved === 'everything' ||
        saved === 'no_message_allow_other'
      ) {
        return saved;
      }
    } catch {}
    return 'everything';
  });

  const [aiSaveToast, setAiSaveToast] = useState(false);

  const handleSelectAiAccess = (level: AiAccessLevel) => {
    setAiAccessLevel(level);
    try {
      localStorage.setItem('chixus_ai_access_permission_v1', level);
    } catch {}
    setAiSaveToast(true);
    setTimeout(() => setAiSaveToast(false), 2500);
  };

  // ==========================================
  // 4. NOTIFICATIONS: Email Alerts Group & In-App Group
  // ==========================================
  const [emailAlerts, setEmailAlerts] = useState({
    weeklyReport: true,
    verifiedOnly: false,
    newUpdate: true,
    tips: true
  });

  const [inAppAlerts, setInAppAlerts] = useState({
    popupToast: true,
    appUpdate: true,
    directMessage: true,
    contactJoin: true
  });

  // Load notifications settings from localStorage
  useEffect(() => {
    try {
      const savedEmail = localStorage.getItem('chixus_notif_email_alerts_v1');
      if (savedEmail) setEmailAlerts(JSON.parse(savedEmail));
      const savedInApp = localStorage.getItem('chixus_notif_inapp_alerts_v1');
      if (savedInApp) setInAppAlerts(JSON.parse(savedInApp));
    } catch {}
  }, []);

  const toggleEmailAlert = (key: keyof typeof emailAlerts) => {
    const next = { ...emailAlerts, [key]: !emailAlerts[key] };
    setEmailAlerts(next);
    try {
      localStorage.setItem('chixus_notif_email_alerts_v1', JSON.stringify(next));
    } catch {}
  };

  const toggleInAppAlert = (key: keyof typeof inAppAlerts) => {
    const next = { ...inAppAlerts, [key]: !inAppAlerts[key] };
    setInAppAlerts(next);
    try {
      localStorage.setItem('chixus_notif_inapp_alerts_v1', JSON.stringify(next));
    } catch {}
  };

  // ==========================================
  // 5. ACCESSIBILITY, DISPLAY & LANGUAGES
  // ==========================================
  const [themeSelection, setThemeSelection] = useState<'dark' | 'white' | 'system'>(() => {
    try {
      const saved = localStorage.getItem('chixus_theme_preference_v1');
      if (saved === 'dark' || saved === 'white' || saved === 'system') return saved;
    } catch {}
    return darkModeTheme ? 'dark' : 'white';
  });

  const handleSelectTheme = (mode: 'dark' | 'white' | 'system') => {
    setThemeSelection(mode);
    try {
      localStorage.setItem('chixus_theme_preference_v1', mode);
    } catch {}
    if (mode === 'dark') {
      onToggleTheme(true);
    } else if (mode === 'white') {
      onToggleTheme(false);
    } else {
      // System default check
      const prefersDark = window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').matches;
      onToggleTheme(prefersDark);
    }
  };

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

  const [selectedLanguage, setSelectedLanguage] = useState<string>(() => {
    try {
      return localStorage.getItem('chixus_selected_language_clean_v1') || 'English';
    } catch {
      return 'English';
    }
  });

  const handleSelectLanguage = (lang: string) => {
    setSelectedLanguage(lang);
    try {
      localStorage.setItem('chixus_selected_language_clean_v1', lang);
    } catch {}
  };

  // Password submission handler
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
    if (newPassword !== confirmPassword) {
      setPasswordStatusMsg({ text: 'New password and confirm password do not match.', isError: true });
      return;
    }

    try {
      if (onUpdatePassword) {
        const res = await onUpdatePassword(newPassword);
        if (res === false) {
          setPasswordStatusMsg({ text: 'Incorrect current password.', isError: true });
          return;
        }
      } else {
        // Fallback update to registered user vault
        const storedUsers = localStorage.getItem('chixus_registered_users');
        if (storedUsers) {
          const list = JSON.parse(storedUsers);
          if (Array.isArray(list)) {
            const updated = list.map((u: any) => {
              if (u?.secretId === operatorId || u?.fullName === userName) {
                return { ...u, password: newPassword, pin: newPassword };
              }
              return u;
            });
            localStorage.setItem('chixus_registered_users', JSON.stringify(updated));
          }
        }
      }
      setPasswordStatusMsg({ text: '✅ Password updated successfully.', isError: false });
      setCurrentPassword('');
      setNewPassword('');
      setConfirmPassword('');
    } catch (err: any) {
      setPasswordStatusMsg({ text: 'Failed to update password. Please try again.', isError: true });
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
      title: 'Your account',
      icon: User,
      subpageTitle: 'Your Account Information',
      subpageDescription: 'Review and update your phone number, email address, registered country, and account credentials.'
    },
    {
      id: 'security',
      title: 'Security and account access',
      icon: Lock,
      subpageTitle: 'Security and Account Access',
      subpageDescription: 'Manage sovereign ID visibility across public directories and configure device cryptographic authorization.'
    },
    {
      id: 'privacy',
      title: 'Privacy and safety',
      icon: Shield,
      subpageTitle: 'Privacy and Safety',
      subpageDescription: 'Configure fine-grained CHIXUS AI permissions and control how the neural engine interacts with your feed, inspector, and messages.'
    },
    {
      id: 'notifications',
      title: 'Notifications',
      icon: Bell,
      subpageTitle: 'Notification Preferences',
      subpageDescription: 'Configure email alerts for weekly metrics and toggle real-time on-screen popups and sound cues.'
    },
    {
      id: 'accessibility',
      title: 'Accessibility, display, and languages',
      icon: Sliders,
      subpageTitle: 'Accessibility, Display, and Languages',
      subpageDescription: 'Toggle sound feedback (click & tap audio cues), select color palette themes, and choose your preferred language.'
    },
    {
      id: 'resources',
      title: 'Additional resources',
      icon: FileText,
      subpageTitle: 'Additional Resources & Governance',
      subpageDescription: 'Access system specifications, telemetry integrity guarantees, and local cache management.'
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
                SETTINGS
              </div>
              <div style={{ fontSize: '10px', color: '#94a3b8', fontFamily: 'monospace' }}>
                System configuration & account controls
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
            <span>Close</span>
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
                    placeholder="Search settings"
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
                    <span>Back to Settings</span>
                  </button>
                </div>
              )}

              {/* Subpage Title & Description */}
              <div style={{ borderBottom: darkModeTheme ? '1px solid #222938' : '1px solid #e2e8f0', paddingBottom: '14px', marginBottom: '22px' }}>
                <div style={{ fontSize: '17px', fontWeight: 900, fontFamily: 'monospace', color: darkModeTheme ? '#ffffff' : '#0f172a' }}>
                  {activeItem.subpageTitle}
                </div>
                <div style={{ fontSize: '11.5px', color: '#94a3b8', fontFamily: 'monospace', marginTop: '4px', lineHeight: 1.5 }}>
                  {activeItem.subpageDescription}
                </div>
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
                    <div style={{ fontSize: '12px', fontWeight: 900, fontFamily: 'monospace', color: '#38bdf8', marginBottom: '14px' }}>
                      ACCOUNT CREDENTIALS
                    </div>

                    <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                      {/* Phone Number Item with Inline Update */}
                      <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                          <span style={{ fontSize: '11px', color: '#94a3b8', fontFamily: 'monospace' }}>Phone Number</span>
                          <button
                            type="button"
                            onClick={() => setIsEditingPhone(!isEditingPhone)}
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
                          <div style={{ display: 'flex', gap: '8px' }}>
                            <input
                              type="text"
                              value={phoneState}
                              onChange={(e) => setPhoneState(e.target.value)}
                              placeholder="+234..."
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
                              onClick={() => {
                                if (onUpdatePhone) onUpdatePhone(phoneState);
                                setIsEditingPhone(false);
                              }}
                              style={{
                                padding: '8px 14px',
                                borderRadius: '8px',
                                background: '#0284c7',
                                color: '#ffffff',
                                border: 'none',
                                fontSize: '11px',
                                fontFamily: 'monospace',
                                fontWeight: 'bold',
                                cursor: 'pointer'
                              }}
                            >
                              Save
                            </button>
                          </div>
                        ) : (
                          <div style={{ fontSize: '13px', fontWeight: 700, fontFamily: 'monospace' }}>
                            {phoneState || 'Not registered'}
                          </div>
                        )}
                      </div>

                      {/* Email Address Item with Inline Update */}
                      <div style={{ display: 'flex', flexDirection: 'column', gap: '6px', paddingTop: '10px', borderTop: darkModeTheme ? '1px solid #1c2230' : '1px solid #e2e8f0' }}>
                        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                          <span style={{ fontSize: '11px', color: '#94a3b8', fontFamily: 'monospace' }}>Email Address</span>
                          <button
                            type="button"
                            onClick={() => setIsEditingEmail(!isEditingEmail)}
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
                          <div style={{ display: 'flex', gap: '8px' }}>
                            <input
                              type="email"
                              value={emailState}
                              onChange={(e) => setEmailState(e.target.value)}
                              placeholder="user@example.com"
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
                              onClick={() => {
                                if (onUpdateEmail) onUpdateEmail(emailState);
                                setIsEditingEmail(false);
                              }}
                              style={{
                                padding: '8px 14px',
                                borderRadius: '8px',
                                background: '#0284c7',
                                color: '#ffffff',
                                border: 'none',
                                fontSize: '11px',
                                fontFamily: 'monospace',
                                fontWeight: 'bold',
                                cursor: 'pointer'
                              }}
                            >
                              Save
                            </button>
                          </div>
                        ) : (
                          <div style={{ fontSize: '13px', fontWeight: 700, fontFamily: 'monospace' }}>
                            {emailState || 'Not registered'}
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
                        style={{
                          marginTop: '4px',
                          padding: '12px 18px',
                          borderRadius: '8px',
                          background: '#0284c7',
                          color: '#ffffff',
                          border: 'none',
                          fontSize: '12px',
                          fontFamily: 'monospace',
                          fontWeight: 'bold',
                          cursor: 'pointer',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          gap: '8px'
                        }}
                      >
                        <Lock style={{ width: '15px', height: '15px' }} />
                        <span>Update password</span>
                      </button>
                    </form>
                  </div>
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
                            background: isIdPublic ? 'rgba(16, 185, 129, 0.16)' : 'rgba(148, 163, 184, 0.16)',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center'
                          }}
                        >
                          <KeyRound style={{ width: '16px', height: '16px', color: isIdPublic ? '#10b981' : '#94a3b8' }} />
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
                          background: isIdPublic ? '#10b981' : '#475569',
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
                            ? darkModeTheme ? 'rgba(16, 185, 129, 0.12)' : '#ecfdf5'
                            : darkModeTheme ? '#181d2a' : '#ffffff',
                          border: isIdPublic ? '1px solid #10b981' : '1px solid rgba(148, 163, 184, 0.2)'
                        }}
                      >
                        <div style={{ fontSize: '12px', fontWeight: 'bold', fontFamily: 'monospace', color: isIdPublic ? '#10b981' : '#94a3b8' }}>
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
                        CHIXUS AI ACCESS CONTROL
                      </div>
                      {aiSaveToast && (
                        <span style={{ fontSize: '10.5px', color: '#10b981', fontFamily: 'monospace', fontWeight: 'bold' }}>
                          ✓ Autosaved instantly
                        </span>
                      )}
                    </div>
                    <div style={{ fontSize: '11px', color: '#94a3b8', marginBottom: '16px', lineHeight: 1.4 }}>
                      Select the level of autonomous assistance and permission granted to CHIXUS AI across your account features. Changes autosave instantly.
                    </div>

                    {/* Radio Selection List */}
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                      {[
                        {
                          id: 'feed' as AiAccessLevel,
                          label: 'Allow to feed',
                          desc: 'CHIXUS AI can summarize feed posts, suggest technical replies, and moderate circuit discussions.'
                        },
                        {
                          id: 'inspect' as AiAccessLevel,
                          label: 'Allow to inspect',
                          desc: 'CHIXUS AI can run automated neural solder joint inspection and confidence calculations on uploaded board images.'
                        },
                        {
                          id: 'profile' as AiAccessLevel,
                          label: 'Allow to profile and account details',
                          desc: 'CHIXUS AI can analyze your verification credentials, star tiers, and historical inspection badges.'
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
                              onClick={() => toggleEmailAlert(item.key)}
                              style={{
                                position: 'relative',
                                width: '42px',
                                height: '24px',
                                borderRadius: '999px',
                                background: isChecked ? '#0284c7' : '#475569',
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
                              onClick={() => toggleInAppAlert(item.key)}
                              style={{
                                position: 'relative',
                                width: '42px',
                                height: '24px',
                                borderRadius: '999px',
                                background: isChecked ? '#10b981' : '#475569',
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
                          <div style={{ color: soundFeedbackActive ? '#10b981' : '#94a3b8' }}>
                            {soundFeedbackActive ? <Volume2 style={{ width: '18px', height: '18px' }} /> : <VolumeX style={{ width: '18px', height: '18px' }} />}
                          </div>
                          <div>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                              <span style={{ fontSize: '12.5px', fontWeight: 700, fontFamily: 'monospace' }}>
                                Sound Feedback
                              </span>
                              <span
                                style={{
                                  fontSize: '9px',
                                  fontFamily: 'monospace',
                                  fontWeight: 800,
                                  padding: '1px 5px',
                                  borderRadius: '3px',
                                  background: soundFeedbackActive ? 'rgba(16, 185, 129, 0.2)' : 'rgba(100, 116, 139, 0.2)',
                                  color: soundFeedbackActive ? '#10b981' : '#94a3b8',
                                  border: soundFeedbackActive ? '1px solid #10b981' : '1px solid #64748b'
                                }}
                              >
                                {soundFeedbackActive ? 'On' : 'Off'}
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
                            background: soundFeedbackActive ? '#10b981' : '#475569',
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
                          background: soundFeedbackActive ? 'rgba(16, 185, 129, 0.15)' : 'rgba(100, 116, 139, 0.15)',
                          border: soundFeedbackActive ? '1px solid rgba(16, 185, 129, 0.4)' : '1px solid rgba(100, 116, 139, 0.3)',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          color: soundFeedbackActive ? '#10b981' : '#94a3b8',
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
                            Sound Feedback
                          </span>
                          <span
                            id="sound-feedback-status-badge"
                            style={{
                              fontSize: '10px',
                              fontFamily: 'monospace',
                              fontWeight: 800,
                              padding: '2px 7px',
                              borderRadius: '4px',
                              background: soundFeedbackActive ? 'rgba(16, 185, 129, 0.2)' : 'rgba(100, 116, 139, 0.2)',
                              color: soundFeedbackActive ? '#10b981' : '#94a3b8',
                              border: soundFeedbackActive ? '1px solid #10b981' : '1px solid #64748b'
                            }}
                          >
                            {soundFeedbackActive ? 'On' : 'Off'}
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
                        background: soundFeedbackActive ? '#10b981' : '#475569',
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
                      INTERFACE THEME PALETTE
                    </div>
                    <div style={{ fontSize: '11px', color: '#94a3b8', marginBottom: '14px' }}>
                      Choose your visual styling: Dark (Charcoal), White (Light), or match system preferences.
                    </div>

                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(130px, 1fr))', gap: '10px' }}>
                      {[
                        { id: 'dark' as const, label: 'Dark', icon: Moon, desc: 'High-Tech Charcoal' },
                        { id: 'white' as const, label: 'White', icon: Sun, desc: 'Brushed Metallic Silver' },
                        { id: 'system' as const, label: 'System Default', icon: Monitor, desc: 'Automatic Sync' }
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
                      SUPPORTED LANGUAGES
                    </div>
                    <div style={{ fontSize: '11px', color: '#94a3b8', marginBottom: '14px', lineHeight: 1.4 }}>
                      Select your operational dialect. Rendered cleanly without ISO country suffixes.
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
                        <span style={{ fontSize: '11.5px', fontWeight: 'bold', fontFamily: 'monospace' }}>CHIXUS Grid Core v1.0.0</span>
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
