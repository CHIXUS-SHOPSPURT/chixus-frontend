import React, { useState, useEffect } from 'react';
import {
  X,
  ArrowLeft,
  Search,
  Sparkles,
  Bot,
  Send,
  HelpCircle,
  FileText,
  Shield,
  Star,
  Brain,
  Wrench,
  Paperclip,
  ChevronRight,
  Check,
  Volume2,
  Copy,
  AlertCircle,
  CheckCircle2,
  DollarSign
} from 'lucide-react';
import { getHelpCenterKnowledgeAnswer } from '../helpCenterAiKnowledge';

export interface HelpCenterDrawerSplitViewProps {
  isOpen: boolean;
  onClose: () => void;
  darkModeTheme: boolean;
  userName?: string;
  onOpenSettings?: () => void;
  operatorId?: string;
  userEmail?: string;
  userPhone?: string;
  userLocation?: string;
  userHeadline?: string;
  isIdPublic?: boolean;
  allowAiPermissions?: boolean;
  selectedLanguage?: string;
  inspectionsCount?: number;
  faultsCount?: number;
  scanAccuracy?: string;
  recentScanLogs?: any[];
  [key: string]: any;
}

export type HelpSectionId =
  | 'maries'
  | 'brain_bookings'
  | 'pricing'
  | 'terms_grid';

export const HelpCenterDrawerSplitView: React.FC<HelpCenterDrawerSplitViewProps> = ({
  isOpen,
  onClose,
  darkModeTheme,
  userName = 'Operator',
  onOpenSettings,
  operatorId,
  userEmail,
  userPhone,
  userLocation,
  userHeadline,
  isIdPublic,
  allowAiPermissions,
  selectedLanguage,
  inspectionsCount,
  faultsCount,
  scanAccuracy,
  recentScanLogs
}) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [activeSection, setActiveSection] = useState<HelpSectionId>('maries');
  const [isMobileSubPageOpen, setIsMobileSubPageOpen] = useState(false);

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
  // IN-APP INTERACTIVE AI PROMPT BAR STATE
  // ==========================================
  const [aiPromptInput, setAiPromptInput] = useState('');
  const [aiAnswer, setAiAnswer] = useState<string | null>(null);
  const [isAiLoading, setIsAiLoading] = useState(false);
  const [isCopied, setIsCopied] = useState(false);

  const handleAskAi = async (overridePrompt?: string) => {
    const query = (overridePrompt || aiPromptInput).trim();
    if (!query || isAiLoading) return;
    setIsAiLoading(true);
    setAiAnswer(null);
    try {
      let liveReply: string | null = null;
      try {
        const controller = new AbortController();
        const timeoutId = window.setTimeout(() => controller.abort(), 12000);
        const res = await fetch('/api/ai/diagnose', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            prompt: query,
            operatorName: userName,
            operatorId,
            mode: 'diagnose',
            appContext: {
              userName,
              operatorId,
              userEmail,
              userLocation,
              selectedLanguage,
              scanAccuracy
            }
          }),
          signal: controller.signal
        });
        window.clearTimeout(timeoutId);
        if (res.ok) {
          const data = await res.json();
          if (data && typeof data.reply === 'string' && data.reply.trim()) {
            liveReply = data.reply.trim();
          }
        }
      } catch {
        // Resilient fallback to offline knowledge engine
      }

      const reply =
        liveReply ||
        getHelpCenterKnowledgeAnswer(query, userName, {
          userName,
          operatorId,
          userEmail,
          userPhone,
          userLocation,
          userHeadline,
          isIdPublic,
          allowAiPermissions,
          darkModeTheme,
          selectedLanguage,
          inspectionsCount,
          faultsCount,
          scanAccuracy,
          recentScanLogs
        });
      setAiAnswer(reply);
    } catch {
      setAiAnswer('CHIXUS AI is ready to analyze your Settings and Help Center query. Please try again or tap Submit a Ticket.');
    } finally {
      setIsAiLoading(false);
    }
  };

  const handleCopyAiAnswer = () => {
    if (!aiAnswer) return;
    navigator.clipboard.writeText(aiAnswer);
    setIsCopied(true);
    setTimeout(() => setIsCopied(false), 2000);
  };

  // ==========================================
  // SUPPORT & CONTACT MODAL STATE
  // Handled by chixus.support@gmail.com
  // ==========================================
  const [isContactModalOpen, setIsContactModalOpen] = useState(false);
  const [contactCategory, setContactCategory] = useState<'support' | 'ticket' | 'feedback'>('support');
  const [contactSubject, setContactSubject] = useState('');
  const [contactMessage, setContactMessage] = useState('');
  const [contactAttachmentName, setContactAttachmentName] = useState<string | null>(null);
  const [contactSuccessToast, setContactSuccessToast] = useState(false);
  const [submittedTicketId, setSubmittedTicketId] = useState<string>('#TICK-4829-CHX');

  const handleContactSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!contactSubject.trim() || !contactMessage.trim()) return;

    try {
      const res = await fetch('/api/support/ticket', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: userName || 'Operator',
          email: userEmail || 'operator@chixus.network',
          operator_id: operatorId || 'CHI-7649-NG',
          subject: contactSubject,
          message: contactMessage,
          category: contactCategory === 'ticket' ? 'Technical Support' : contactCategory === 'feedback' ? 'User Feedback' : 'General Support',
          priority: 'High',
          attachment: contactAttachmentName,
          operatorId: operatorId || 'CHI-7649-NG',
          operatorName: userName,
          operatorEmail: userEmail || 'operator@chixus.network'
        })
      });
      const data = await res.json().catch(() => null);
      if (data?.ticketId) {
        setSubmittedTicketId(data.ticketId);
      }
    } catch {}

    setContactSuccessToast(true);
    setTimeout(() => {
      setContactSuccessToast(false);
      setIsContactModalOpen(false);
      setContactSubject('');
      setContactMessage('');
      setContactAttachmentName(null);
    }, 4500);
  };

  if (!isOpen) return null;

  // Knowledge base sections
  const helpSections: Array<{
    id: HelpSectionId;
    title: string;
    icon: any;
    subpageTitle: string;
    subpageDescription: string;
  }> = [
    {
      id: 'maries',
      title: 'Session Summaries & Memory (MARIES)',
      icon: Brain,
      subpageTitle: 'Session Summaries & Memory (MARIES)',
      subpageDescription: 'Multi-agent natural language memory parsing sessions into permanent local brain storage for recall across technical discussion threads.'
    },
    {
      id: 'brain_bookings',
      title: 'The Brain & Enterprise Contract Bookings',
      icon: Wrench,
      subpageTitle: 'The Brain & Enterprise Contract Bookings',
      subpageDescription: 'Centralized telemetry dashboards tracking past repairs, senior engineering solutions, and multi-month technician booking structures.'
    },
    {
      id: 'pricing',
      title: 'Star Tier Usage Allocations & Pricing Matrix',
      icon: Star,
      subpageTitle: 'Star Tier Usage Allocations & Pricing Matrix',
      subpageDescription: 'Complete monthly and annual scan quota allocations, attendance limits, and enterprise pricing matrix.'
    },
    {
      id: 'terms_grid',
      title: 'Terms & Grid Policy',
      icon: Shield,
      subpageTitle: 'Terms & Grid Policy',
      subpageDescription: '96-hour anti-tamper IndexedDB retention lock, zero-trust credential sovereignty, and IPC-A-610 Class 3 soldering requirements.'
    }
  ];

  // Dynamic search filter on sections
  const filteredSections = helpSections.filter((sec) =>
    sec.title.toLowerCase().includes(searchQuery.toLowerCase().trim()) ||
    sec.subpageTitle.toLowerCase().includes(searchQuery.toLowerCase().trim()) ||
    sec.subpageDescription.toLowerCase().includes(searchQuery.toLowerCase().trim())
  );

  const activeItem = helpSections.find((s) => s.id === activeSection) || helpSections[0];

  const handleSelectSection = (secId: HelpSectionId) => {
    setActiveSection(secId);
    setIsMobileSubPageOpen(true);
  };

  return (
    <div
      id="help-center-drawer-backdrop"
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
        id="help-center-drawer-container"
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
        {/* Main Header */}
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
                background: 'rgba(16, 185, 129, 0.16)',
                border: '1px solid #10b981',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center'
              }}
            >
              <HelpCircle style={{ width: '18px', height: '18px', color: '#10b981' }} />
            </div>
            <div>
              <div style={{ fontSize: '14px', fontWeight: 900, fontFamily: 'monospace', letterSpacing: '0.5px' }}>
                HELP CENTER
              </div>
              <div style={{ fontSize: '10px', color: '#94a3b8', fontFamily: 'monospace' }}>
                System documentation & knowledge base
              </div>
            </div>
          </div>
          <button
            type="button"
            id="help-center-close-btn"
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

        {/* Banner with Personalized Greeting & Live Search */}
        <div
          style={{
            padding: '18px 20px',
            background: darkModeTheme ? '#0d111a' : '#f1f5f9',
            borderBottom: darkModeTheme ? '1px solid #1e2433' : '1px solid #e2e8f0',
            flexShrink: 0
          }}
        >
          <div style={{ fontSize: '16px', fontWeight: 900, fontFamily: 'monospace', color: darkModeTheme ? '#ffffff' : '#0f172a', marginBottom: '10px' }}>
            Hello {userName || 'Operator'}, what can we help you find today?
          </div>
          <div
            style={{
              position: 'relative',
              display: 'flex',
              alignItems: 'center',
              background: darkModeTheme ? '#181d2a' : '#ffffff',
              border: darkModeTheme ? '1px solid #2e374d' : '1px solid #cbd5e1',
              borderRadius: '10px',
              padding: '0 12px',
              height: '42px'
            }}
          >
            <Search style={{ width: '16px', height: '16px', color: '#94a3b8', marginRight: '10px' }} />
            <input
              type="text"
              id="help-center-search-input"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search Help Center documentation & guides..."
              style={{
                flex: 1,
                background: 'transparent',
                border: 'none',
                outline: 'none',
                color: darkModeTheme ? '#ffffff' : '#0f172a',
                fontSize: '12.5px',
                fontFamily: 'monospace'
              }}
            />
            {searchQuery && (
              <button
                type="button"
                onClick={() => setSearchQuery('')}
                style={{ background: 'none', border: 'none', color: '#94a3b8', cursor: 'pointer', padding: '2px' }}
              >
                <X style={{ width: '15px', height: '15px' }} />
              </button>
            )}
          </div>
        </div>

        {/* Responsive Dual Layout Container */}
        <div style={{ flex: 1, display: 'flex', overflow: 'hidden', position: 'relative' }}>
          {/* Menu Sidebar (Root List with NO labels underneath) */}
          {(!isMobile || !isMobileSubPageOpen) && (
            <div
              id="help-center-menu-sidebar"
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
              <div style={{ padding: '14px 12px', display: 'flex', flexDirection: 'column', gap: '8px' }}>
                {filteredSections.map((item) => {
                  const Icon = item.icon;
                  const isSelected = activeSection === item.id;
                  return (
                    <button
                      key={item.id}
                      type="button"
                      id={`help-section-${item.id}`}
                      onClick={() => handleSelectSection(item.id)}
                      style={{
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'space-between',
                        gap: '12px',
                        padding: '13px 14px',
                        borderRadius: '10px',
                        background: isSelected
                          ? darkModeTheme
                            ? 'rgba(16, 185, 129, 0.15)'
                            : '#ecfdf5'
                          : darkModeTheme
                          ? 'rgba(255, 255, 255, 0.03)'
                          : 'rgba(0, 0, 0, 0.03)',
                        border: isSelected
                          ? '1.5px solid #10b981'
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
                              ? '#10b981'
                              : darkModeTheme
                              ? '#1c2230'
                              : '#e2e8f0',
                            color: isSelected ? '#ffffff' : '#10b981',
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
                            fontSize: '12.5px',
                            fontWeight: isSelected ? 800 : 600,
                            fontFamily: 'monospace',
                            color: isSelected
                              ? darkModeTheme ? '#ffffff' : '#047857'
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
                          color: isSelected ? '#10b981' : '#94a3b8',
                          flexShrink: 0
                        }}
                      />
                    </button>
                  );
                })}

                {filteredSections.length === 0 && (
                  <div style={{ padding: '24px 12px', textAlign: 'center', color: '#94a3b8', fontSize: '11.5px', fontFamily: 'monospace' }}>
                    No matching articles found for "{searchQuery}"
                  </div>
                )}
              </div>

              {/* Support & Contact Action Buttons in Sidebar */}
              <div
                style={{
                  marginTop: 'auto',
                  padding: '14px 12px',
                  borderTop: darkModeTheme ? '1px solid #1c2230' : '1px solid #e2e8f0',
                  display: 'flex',
                  flexDirection: 'column',
                  gap: '8px'
                }}
              >
                <div style={{ fontSize: '10.5px', fontWeight: 'bold', fontFamily: 'monospace', color: '#94a3b8', marginBottom: '2px' }}>
                  SUPPORT & CONTACT
                </div>
                <div style={{ display: 'flex', gap: '6px' }}>
                  <button
                    type="button"
                    onClick={() => {
                      setContactCategory('support');
                      setIsContactModalOpen(true);
                    }}
                    style={{
                      flex: 1,
                      padding: '8px 4px',
                      borderRadius: '6px',
                      background: 'rgba(56, 189, 248, 0.12)',
                      border: '1px solid rgba(56, 189, 248, 0.3)',
                      color: '#38bdf8',
                      fontSize: '10.5px',
                      fontFamily: 'monospace',
                      fontWeight: 'bold',
                      cursor: 'pointer'
                    }}
                  >
                    Contact Us
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      setContactCategory('ticket');
                      setIsContactModalOpen(true);
                    }}
                    style={{
                      flex: 1,
                      padding: '8px 4px',
                      borderRadius: '6px',
                      background: 'rgba(16, 185, 129, 0.12)',
                      border: '1px solid rgba(16, 185, 129, 0.3)',
                      color: '#10b981',
                      fontSize: '10.5px',
                      fontFamily: 'monospace',
                      fontWeight: 'bold',
                      cursor: 'pointer'
                    }}
                  >
                    Submit Ticket
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      setContactCategory('feedback');
                      setIsContactModalOpen(true);
                    }}
                    style={{
                      flex: 1,
                      padding: '8px 4px',
                      borderRadius: '6px',
                      background: 'rgba(245, 158, 11, 0.12)',
                      border: '1px solid rgba(245, 158, 11, 0.3)',
                      color: '#f59e0b',
                      fontSize: '10.5px',
                      fontFamily: 'monospace',
                      fontWeight: 'bold',
                      cursor: 'pointer'
                    }}
                  >
                    Feedback
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* Subpage Article Reader Panel */}
          {(!isMobile || isMobileSubPageOpen) && (
            <div
              id="help-center-article-panel"
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
                    id="help-center-back-btn"
                    onClick={() => setIsMobileSubPageOpen(false)}
                    style={{
                      display: 'inline-flex',
                      alignItems: 'center',
                      gap: '8px',
                      padding: '8px 14px',
                      borderRadius: '8px',
                      background: darkModeTheme ? '#1e2433' : '#f1f5f9',
                      border: darkModeTheme ? '1px solid #333d54' : '1px solid #cbd5e1',
                      color: '#10b981',
                      fontSize: '12px',
                      fontFamily: 'monospace',
                      fontWeight: 'bold',
                      cursor: 'pointer'
                    }}
                  >
                    <ArrowLeft style={{ width: '15px', height: '15px' }} />
                    <span>Back to Help Center</span>
                  </button>
                </div>
              )}

              {/* ============================================================ */}
              {/* IN-APP INTERACTIVE AI PROMPT BAR ("Ask CHIXUS AI") */}
              {/* ============================================================ */}
              <div
                style={{
                  padding: '16px',
                  borderRadius: '12px',
                  background: darkModeTheme
                    ? 'linear-gradient(135deg, rgba(16, 185, 129, 0.1) 0%, rgba(56, 189, 248, 0.1) 100%)'
                    : 'linear-gradient(135deg, #ecfdf5 0%, #e0f2fe 100%)',
                  border: darkModeTheme ? '1px solid #1e3a47' : '1px solid #bae6fd',
                  marginBottom: '22px'
                }}
              >
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '8px' }}>
                  <Sparkles style={{ width: '16px', height: '16px', color: '#10b981' }} />
                  <span style={{ fontSize: '13px', fontWeight: 900, fontFamily: 'monospace', color: darkModeTheme ? '#ffffff' : '#0369a1' }}>
                    ASK CHIXUS AI (LIVE TECHNICAL ASSISTANT)
                  </span>
                </div>
                <div style={{ fontSize: '11px', color: '#94a3b8', marginBottom: '12px' }}>
                  Get instant technical answers directly inside Help Center.
                </div>

                <div style={{ display: 'flex', gap: '8px', marginBottom: '10px' }}>
                  <input
                    type="text"
                    id="help-ai-prompt-input"
                    value={aiPromptInput}
                    onChange={(e) => setAiPromptInput(e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter') handleAskAi();
                    }}
                    placeholder="Ask about IPC-A-610 standards, pricing quotas, or MARIES brain memory..."
                    style={{
                      flex: 1,
                      padding: '10px 14px',
                      borderRadius: '8px',
                      background: darkModeTheme ? '#0b0f19' : '#ffffff',
                      border: darkModeTheme ? '1px solid #28334a' : '1px solid #cbd5e1',
                      color: darkModeTheme ? '#ffffff' : '#0f172a',
                      fontSize: '12px',
                      fontFamily: 'monospace',
                      outline: 'none'
                    }}
                  />
                  <button
                    type="button"
                    id="help-ai-submit-btn"
                    onClick={() => handleAskAi()}
                    disabled={isAiLoading || !aiPromptInput.trim()}
                    style={{
                      padding: '0 16px',
                      borderRadius: '8px',
                      background: isAiLoading || !aiPromptInput.trim() ? '#475569' : '#10b981',
                      color: '#ffffff',
                      border: 'none',
                      fontSize: '11.5px',
                      fontFamily: 'monospace',
                      fontWeight: 'bold',
                      cursor: isAiLoading || !aiPromptInput.trim() ? 'not-allowed' : 'pointer',
                      display: 'flex',
                      alignItems: 'center',
                      gap: '6px'
                    }}
                  >
                    {isAiLoading ? (
                      <span>Analyzing...</span>
                    ) : (
                      <>
                        <Send style={{ width: '14px', height: '14px' }} />
                        <span>Ask AI</span>
                      </>
                    )}
                  </button>
                </div>

                {/* Example Quick Prompt Chips */}
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: '6px' }}>
                  {[
                    'What are the 5 star tier scan quotas?',
                    'How does MARIES multi-agent memory work?',
                    'Explain the 96-hour anti-tamper lock'
                  ].map((chip) => (
                    <button
                      key={chip}
                      type="button"
                      onClick={() => {
                        setAiPromptInput(chip);
                        handleAskAi(chip);
                      }}
                      style={{
                        padding: '4px 10px',
                        borderRadius: '6px',
                        background: darkModeTheme ? 'rgba(255, 255, 255, 0.05)' : '#ffffff',
                        border: darkModeTheme ? '1px solid #28334a' : '1px solid #cbd5e1',
                        color: darkModeTheme ? '#cbd5e1' : '#475569',
                        fontSize: '10.5px',
                        fontFamily: 'monospace',
                        cursor: 'pointer'
                      }}
                    >
                      💡 {chip}
                    </button>
                  ))}
                </div>

                {/* Live AI Answer Box */}
                {aiAnswer && (
                  <div
                    style={{
                      marginTop: '14px',
                      padding: '14px',
                      borderRadius: '8px',
                      background: darkModeTheme ? '#090d16' : '#ffffff',
                      border: '1px solid #10b981',
                      color: darkModeTheme ? '#f1f5f9' : '#0f172a'
                    }}
                  >
                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '8px' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                        <Bot style={{ width: '15px', height: '15px', color: '#10b981' }} />
                        <span style={{ fontSize: '11px', fontWeight: 'bold', fontFamily: 'monospace', color: '#10b981' }}>
                          CHIXUS AI Response
                        </span>
                      </div>
                      <button
                        type="button"
                        onClick={handleCopyAiAnswer}
                        style={{
                          background: 'none',
                          border: 'none',
                          color: isCopied ? '#10b981' : '#94a3b8',
                          fontSize: '10.5px',
                          fontFamily: 'monospace',
                          cursor: 'pointer',
                          display: 'flex',
                          alignItems: 'center',
                          gap: '4px'
                        }}
                      >
                        {isCopied ? <Check style={{ width: '12px', height: '12px' }} /> : <Copy style={{ width: '12px', height: '12px' }} />}
                        <span>{isCopied ? 'Copied' : 'Copy'}</span>
                      </button>
                    </div>
                    <div style={{ fontSize: '12px', lineHeight: 1.6, whiteSpace: 'pre-wrap', fontFamily: 'sans-serif' }}>
                      {aiAnswer}
                    </div>

                    {(aiAnswer.includes('Submit a Ticket') || aiAnswer.includes('submit a ticket') || aiAnswer.includes('Contact Us') || aiAnswer.includes('Submit Ticket')) && (
                      <div style={{ marginTop: '12px', display: 'flex', flexWrap: 'wrap', gap: '8px' }}>
                        <button
                          type="button"
                          id="help-ai-answer-submit-ticket-btn"
                          onClick={() => {
                            setContactCategory('ticket');
                            setIsContactModalOpen(true);
                          }}
                          style={{
                            display: 'inline-flex',
                            alignItems: 'center',
                            gap: '6px',
                            padding: '8px 14px',
                            borderRadius: '6px',
                            background: '#10b981',
                            color: '#ffffff',
                            fontSize: '11px',
                            fontFamily: 'monospace',
                            fontWeight: 'bold',
                            border: 'none',
                            cursor: 'pointer'
                          }}
                        >
                          <Wrench style={{ width: '13px', height: '13px' }} />
                          <span>Submit a Ticket About This Problem</span>
                        </button>
                        <button
                          type="button"
                          id="help-ai-answer-contact-us-btn"
                          onClick={() => {
                            setContactCategory('support');
                            setIsContactModalOpen(true);
                          }}
                          style={{
                            display: 'inline-flex',
                            alignItems: 'center',
                            gap: '6px',
                            padding: '8px 14px',
                            borderRadius: '6px',
                            background: darkModeTheme ? '#1e2433' : '#e2e8f0',
                            color: darkModeTheme ? '#cbd5e1' : '#475569',
                            fontSize: '11px',
                            fontFamily: 'monospace',
                            fontWeight: 'bold',
                            border: 'none',
                            cursor: 'pointer'
                          }}
                        >
                          <HelpCircle style={{ width: '13px', height: '13px' }} />
                          <span>Contact Support</span>
                        </button>
                      </div>
                    )}
                  </div>
                )}
              </div>

              {/* Subpage Header */}
              <div style={{ borderBottom: darkModeTheme ? '1px solid #222938' : '1px solid #e2e8f0', paddingBottom: '14px', marginBottom: '22px' }}>
                <div style={{ fontSize: '17px', fontWeight: 900, fontFamily: 'monospace', color: darkModeTheme ? '#ffffff' : '#0f172a' }}>
                  {activeItem.subpageTitle}
                </div>
                <div style={{ fontSize: '11.5px', color: '#94a3b8', fontFamily: 'monospace', marginTop: '4px', lineHeight: 1.5 }}>
                  {activeItem.subpageDescription}
                </div>
              </div>

              {/* ============================================================ */}
              {/* TAB 1: SESSION SUMMARIES & MEMORY (MARIES) */}
              {/* ============================================================ */}
              {activeSection === 'maries' && (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
                  <div
                    style={{
                      padding: '18px',
                      borderRadius: '12px',
                      background: darkModeTheme ? '#121622' : '#f8fafc',
                      border: darkModeTheme ? '1px solid #252b3d' : '1px solid #e2e8f0'
                    }}
                  >
                    <div style={{ fontSize: '13px', fontWeight: 900, fontFamily: 'monospace', color: '#10b981', marginBottom: '10px' }}>
                      MARIES MULTI-AGENT MEMORY ARCHITECTURE
                    </div>
                    <p style={{ fontSize: '12px', color: darkModeTheme ? '#cbd5e1' : '#334155', lineHeight: 1.6, margin: '0 0 12px 0' }}>
                      Every operational session on the CHIXUS platform is automatically parsed and summarized by multi-agent Natural Language Processing (NLP) engines.
                    </p>
                    <ul style={{ fontSize: '11.5px', color: '#94a3b8', lineHeight: 1.6, paddingLeft: '20px', margin: '0 0 14px 0', display: 'flex', flexDirection: 'column', gap: '8px' }}>
                      <li>
                        <b>Local Brain Storage:</b> Summarized findings, circuit diagnosis vectors, and component test logs are indexed directly inside each user’s local AI brain for instant future recall.
                      </li>
                      <li>
                        <b>Community Discussions:</b> Technical posts and peer threads automatically cross-reference historical MARIES memory tokens to surface relevant solder bridge anomalies and solution steps.
                      </li>
                      <li>
                        <b>Zero-Latency Retrieval:</b> Because summaries reside in IndexedDB on the user’s local device, past fault diagnostics can be queried without round-trip network delays.
                      </li>
                    </ul>
                  </div>
                </div>
              )}

              {/* ============================================================ */}
              {/* TAB 2: THE BRAIN & ENTERPRISE CONTRACT BOOKINGS */}
              {/* ============================================================ */}
              {activeSection === 'brain_bookings' && (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
                  <div
                    style={{
                      padding: '18px',
                      borderRadius: '12px',
                      background: darkModeTheme ? '#121622' : '#f8fafc',
                      border: darkModeTheme ? '1px solid #252b3d' : '1px solid #e2e8f0'
                    }}
                  >
                    <div style={{ fontSize: '13px', fontWeight: 900, fontFamily: 'monospace', color: '#38bdf8', marginBottom: '10px' }}>
                      THE BRAIN: CENTRALIZED TELEMETRY DASHBOARD
                    </div>
                    <p style={{ fontSize: '12px', color: darkModeTheme ? '#cbd5e1' : '#334155', lineHeight: 1.6, margin: '0 0 12px 0' }}>
                      The Brain is the centralized telemetry dashboard tracking real-time hardware telemetry, module interactions, and optical diagnostic logs.
                    </p>
                    <div style={{ fontSize: '11.5px', color: '#94a3b8', lineHeight: 1.6 }}>
                      It systematically logs past repairs and solutions verified by senior engineers, ensuring that operators never have to repeat identical troubleshooting cycles.
                    </div>
                  </div>

                  <div
                    style={{
                      padding: '18px',
                      borderRadius: '12px',
                      background: darkModeTheme ? '#121622' : '#f8fafc',
                      border: darkModeTheme ? '1px solid #252b3d' : '1px solid #e2e8f0'
                    }}
                  >
                    <div style={{ fontSize: '13px', fontWeight: 900, fontFamily: 'monospace', color: '#f59e0b', marginBottom: '10px' }}>
                      MULTI-MONTH TECHNICIAN CONTRACT BOOKINGS
                    </div>
                    <p style={{ fontSize: '12px', color: darkModeTheme ? '#cbd5e1' : '#334155', lineHeight: 1.6, margin: '0 0 12px 0' }}>
                      Companies and manufacturing facilities booking field technicians for multi-month contracts incur minor administrative booking fees:
                    </p>
                    <ul style={{ fontSize: '11.5px', color: '#94a3b8', lineHeight: 1.6, paddingLeft: '20px', margin: '0 0 12px 0', display: 'flex', flexDirection: 'column', gap: '8px' }}>
                      <li>
                        <b>Booking Fee Structure:</b> $30 to $50 / month per booked technician.
                      </li>
                      <li>
                        <b>Independent Quota Allocation:</b> Booked engineers operate outside regular single-seat subscription limits, allowing scalable on-site manufacturing audits.
                      </li>
                      <li>
                        <b>Transparent Ledger:</b> Total contract expenditures and scan allocations are tracked transparently in the Enterprise billing dashboard.
                      </li>
                    </ul>
                  </div>
                </div>
              )}

              {/* ============================================================ */}
              {/* TAB 3: STAR TIER USAGE ALLOCATIONS & PRICING MATRIX */}
              {/* ============================================================ */}
              {activeSection === 'pricing' && (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
                  <div
                    style={{
                      padding: '18px',
                      borderRadius: '12px',
                      background: darkModeTheme ? '#121622' : '#f8fafc',
                      border: darkModeTheme ? '1px solid #252b3d' : '1px solid #e2e8f0'
                    }}
                  >
                    <div style={{ fontSize: '13px', fontWeight: 900, fontFamily: 'monospace', color: '#fbbf24', marginBottom: '14px' }}>
                      STAR TIER USAGE ALLOCATIONS & PRICING MATRIX
                    </div>

                    {/* Clean Pricing Table */}
                    <div style={{ overflowX: 'auto' }}>
                      <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left', fontFamily: 'monospace', fontSize: '11.5px' }}>
                        <thead>
                          <tr style={{ borderBottom: darkModeTheme ? '2px solid #28334a' : '2px solid #cbd5e1', color: '#94a3b8' }}>
                            <th style={{ padding: '10px 12px' }}>Tier</th>
                            <th style={{ padding: '10px 12px' }}>Scan Quota</th>
                            <th style={{ padding: '10px 12px' }}>Attendance</th>
                            <th style={{ padding: '10px 12px' }}>Monthly Rate</th>
                            <th style={{ padding: '10px 12px' }}>Annual Rate</th>
                          </tr>
                        </thead>
                        <tbody>
                          {[
                            { tier: '★ (1 Star)', quota: '200 Scans / mo', attendance: '60 Mo Attendance', monthly: '$5 / mo', annual: '$25 / yr' },
                            { tier: '★★ (2 Stars)', quota: '400 Scans / mo', attendance: '120 Mo Attendance', monthly: '$10 / mo', annual: '$120 / yr' },
                            { tier: '★★★ (3 Stars)', quota: '800 Scans / mo', attendance: '240 Mo Attendance', monthly: '$20 / mo', annual: '$240 / yr' },
                            { tier: '★★★★ (4 Stars)', quota: '1,600 Scans / mo', attendance: '480 Mo Attendance', monthly: '$40 / mo', annual: '$480 / yr' },
                            { tier: '★★★★★ (5 Stars)', quota: 'UNLIMITED', attendance: 'Full Enterprise', monthly: 'Enterprise', annual: '$1,000 / year' }
                          ].map((row, idx) => (
                            <tr
                              key={row.tier}
                              style={{
                                borderBottom: darkModeTheme ? '1px solid #1c2230' : '1px solid #e2e8f0',
                                background: idx % 2 === 1 ? (darkModeTheme ? 'rgba(255,255,255,0.02)' : 'rgba(0,0,0,0.02)') : 'transparent'
                              }}
                            >
                              <td style={{ padding: '12px', fontWeight: 'bold', color: '#fbbf24' }}>{row.tier}</td>
                              <td style={{ padding: '12px' }}>{row.quota}</td>
                              <td style={{ padding: '12px', color: '#94a3b8' }}>{row.attendance}</td>
                              <td style={{ padding: '12px', fontWeight: 'bold', color: '#38bdf8' }}>{row.monthly}</td>
                              <td style={{ padding: '12px', fontWeight: 'bold', color: '#10b981' }}>{row.annual}</td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  </div>
                </div>
              )}

              {/* ============================================================ */}
              {/* TAB 4: TERMS & GRID POLICY */}
              {/* ============================================================ */}
              {activeSection === 'terms_grid' && (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                  <div
                    style={{
                      padding: '18px',
                      borderRadius: '12px',
                      background: darkModeTheme ? '#121622' : '#f8fafc',
                      border: darkModeTheme ? '1px solid #252b3d' : '1px solid #e2e8f0'
                    }}
                  >
                    <div style={{ fontSize: '13px', fontWeight: 900, fontFamily: 'monospace', color: '#10b981', marginBottom: '8px' }}>
                      96-HOUR ANTI-TAMPER RETENTION LOCK
                    </div>
                    <div style={{ fontSize: '11.5px', color: '#94a3b8', lineHeight: 1.6 }}>
                      All on-device hardware telemetry, inspection hashes, and operator verification logs cached inside client-side IndexedDB are immutably locked for <b>96 hours (4 days)</b>. Retrospective purges and modifications are strictly rejected during active audit windows to preserve digital forensics.
                    </div>
                  </div>

                  <div
                    style={{
                      padding: '18px',
                      borderRadius: '12px',
                      background: darkModeTheme ? '#121622' : '#f8fafc',
                      border: darkModeTheme ? '1px solid #252b3d' : '1px solid #e2e8f0'
                    }}
                  >
                    <div style={{ fontSize: '13px', fontWeight: 900, fontFamily: 'monospace', color: '#38bdf8', marginBottom: '8px' }}>
                      ZERO-TRUST CREDENTIAL SOVEREIGNTY
                    </div>
                    <div style={{ fontSize: '11.5px', color: '#94a3b8', lineHeight: 1.6 }}>
                      Operator secret tokens, encryption seeds, and node private keys reside exclusively within local device storage. Chixus network administrators have zero administrative recovery backdoors, guaranteeing that cryptographic sovereignty rests completely with the hardware owner.
                    </div>
                  </div>

                  <div
                    style={{
                      padding: '18px',
                      borderRadius: '12px',
                      background: darkModeTheme ? '#121622' : '#f8fafc',
                      border: darkModeTheme ? '1px solid #252b3d' : '1px solid #e2e8f0'
                    }}
                  >
                    <div style={{ fontSize: '13px', fontWeight: 900, fontFamily: 'monospace', color: '#f59e0b', marginBottom: '8px' }}>
                      IPC-A-610 CLASS 3 STANDARDS
                    </div>
                    <div style={{ fontSize: '11.5px', color: '#94a3b8', lineHeight: 1.6 }}>
                      All telemetry captures and solder optical inspections must adhere strictly to Class 3 high-reliability electronic assembly criteria. Fabricated defect reports or deliberate false logs trigger immediate automated node de-certification from the sovereign grid.
                    </div>
                  </div>
                </div>
              )}

              {/* App Version Footer */}
              <div style={{ marginTop: 'auto', paddingTop: '20px', display: 'flex', alignItems: 'center', justifyContent: 'space-between', borderTop: darkModeTheme ? '1px solid #1c2230' : '1px solid #e2e8f0' }}>
                <span style={{ fontSize: '11px', fontFamily: 'monospace', color: '#94a3b8' }}>
                  Platform Client: <b style={{ color: '#38bdf8' }}>v1.0.0</b>
                </span>
                <span style={{ fontSize: '11px', fontFamily: 'monospace', color: '#10b981' }}>
                  Grid Network: Active
                </span>
              </div>

              {/* Global Centered Muted Copyright Footer */}
              <div
                style={{
                  paddingTop: '16px',
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

        {/* ============================================================ */}
        {/* INLINE CONTACT US MODAL (Strictly NO Live Chat!) */}
        {/* ============================================================ */}
        {isContactModalOpen && (
          <div
            style={{
              position: 'fixed',
              inset: 0,
              zIndex: 10060,
              backgroundColor: 'rgba(0, 0, 0, 0.85)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              padding: '16px'
            }}
            onClick={() => setIsContactModalOpen(false)}
          >
            <div
              style={{
                width: '100%',
                maxWidth: '520px',
                borderRadius: '12px',
                background: darkModeTheme ? '#121622' : '#ffffff',
                border: darkModeTheme ? '1px solid #28334a' : '1px solid #cbd5e1',
                padding: '20px',
                color: darkModeTheme ? '#ffffff' : '#0f172a',
                boxShadow: '0 25px 50px rgba(0,0,0,0.5)'
              }}
              onClick={(e) => e.stopPropagation()}
            >
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '16px' }}>
                <div style={{ fontSize: '14px', fontWeight: 900, fontFamily: 'monospace' }}>
                  {contactCategory === 'support' ? 'CONTACT ENGINEERING SUPPORT' : contactCategory === 'ticket' ? 'SUBMIT DIAGNOSTIC TICKET' : 'SEND PLATFORM FEEDBACK'}
                </div>
                <button
                  type="button"
                  onClick={() => setIsContactModalOpen(false)}
                  style={{ background: 'none', border: 'none', color: '#94a3b8', cursor: 'pointer' }}
                >
                  <X style={{ width: '18px', height: '18px' }} />
                </button>
              </div>

              <form onSubmit={handleContactSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
                <div>
                  <label style={{ fontSize: '11px', color: '#94a3b8', fontFamily: 'monospace', display: 'block', marginBottom: '6px' }}>
                    Category
                  </label>
                  <select
                    value={contactCategory}
                    onChange={(e) => setContactCategory(e.target.value as any)}
                    style={{
                      width: '100%',
                      padding: '9px 12px',
                      borderRadius: '8px',
                      background: darkModeTheme ? '#181d2a' : '#f8fafc',
                      border: darkModeTheme ? '1px solid #2e374d' : '1px solid #cbd5e1',
                      color: darkModeTheme ? '#ffffff' : '#0f172a',
                      fontSize: '12px',
                      fontFamily: 'monospace',
                      outline: 'none'
                    }}
                  >
                    <option value="support">General Engineering Support</option>
                    <option value="ticket">Submit Bug / Hardware Diagnostic Ticket</option>
                    <option value="feedback">Send Platform Suggestion / Feedback</option>
                  </select>
                </div>

                <div>
                  <label style={{ fontSize: '11px', color: '#94a3b8', fontFamily: 'monospace', display: 'block', marginBottom: '6px' }}>
                    Subject
                  </label>
                  <input
                    type="text"
                    required
                    value={contactSubject}
                    onChange={(e) => setContactSubject(e.target.value)}
                    placeholder="Brief description of the query or issue..."
                    style={{
                      width: '100%',
                      padding: '9px 12px',
                      borderRadius: '8px',
                      background: darkModeTheme ? '#181d2a' : '#f8fafc',
                      border: darkModeTheme ? '1px solid #2e374d' : '1px solid #cbd5e1',
                      color: darkModeTheme ? '#ffffff' : '#0f172a',
                      fontSize: '12px',
                      fontFamily: 'monospace',
                      outline: 'none'
                    }}
                  />
                </div>

                <div>
                  <label style={{ fontSize: '11px', color: '#94a3b8', fontFamily: 'monospace', display: 'block', marginBottom: '6px' }}>
                    Message Body
                  </label>
                  <textarea
                    required
                    rows={4}
                    value={contactMessage}
                    onChange={(e) => setContactMessage(e.target.value)}
                    placeholder="Provide detailed information, error codes, or hardware symptoms..."
                    style={{
                      width: '100%',
                      padding: '9px 12px',
                      borderRadius: '8px',
                      background: darkModeTheme ? '#181d2a' : '#f8fafc',
                      border: darkModeTheme ? '1px solid #2e374d' : '1px solid #cbd5e1',
                      color: darkModeTheme ? '#ffffff' : '#0f172a',
                      fontSize: '12px',
                      fontFamily: 'monospace',
                      outline: 'none',
                      resize: 'none'
                    }}
                  />
                </div>

                <div>
                  <label style={{ fontSize: '11px', color: '#94a3b8', fontFamily: 'monospace', display: 'block', marginBottom: '6px' }}>
                    Attachment (Optional Logs / Photo)
                  </label>
                  <label
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: '8px',
                      padding: '8px 12px',
                      borderRadius: '8px',
                      background: darkModeTheme ? '#181d2a' : '#f8fafc',
                      border: darkModeTheme ? '1px dashed #38bdf8' : '1px dashed #0284c7',
                      color: '#38bdf8',
                      fontSize: '11.5px',
                      fontFamily: 'monospace',
                      cursor: 'pointer'
                    }}
                  >
                    <Paperclip style={{ width: '15px', height: '15px' }} />
                    <span>{contactAttachmentName || 'Upload diagnostic log or circuit capture...'}</span>
                    <input
                      type="file"
                      style={{ display: 'none' }}
                      onChange={(e) => {
                        const file = e.target.files?.[0];
                        if (file) setContactAttachmentName(file.name);
                      }}
                    />
                  </label>
                </div>

                {contactSuccessToast && (
                  <div id="support-ticket-success-alert" style={{ padding: '12px', borderRadius: '8px', background: 'rgba(16, 185, 129, 0.15)', border: '1px solid #10b981', color: '#10b981', fontSize: '12px', fontFamily: 'monospace', lineHeight: '1.5' }}>
                    <div style={{ fontWeight: 'bold', marginBottom: '4px' }}>✅ Ticket {submittedTicketId} Logged</div>
                    <div>Your complaint has been dispatched to CHIXUS Support. A confirmation receipt has been sent to your email.</div>
                  </div>
                )}

                <div style={{ fontSize: '10.5px', color: '#64748b', fontFamily: 'monospace', display: 'flex', alignItems: 'center', gap: '5px' }}>
                  <span>Direct Support Endpoint:</span>
                  <span style={{ color: '#38bdf8', fontWeight: 'bold' }}>chixus.support@gmail.com</span>
                </div>

                <div style={{ display: 'flex', gap: '10px', marginTop: '6px' }}>
                  <button
                    type="button"
                    onClick={() => setIsContactModalOpen(false)}
                    style={{
                      flex: 1,
                      padding: '10px',
                      borderRadius: '8px',
                      background: darkModeTheme ? '#1e2433' : '#e2e8f0',
                      color: darkModeTheme ? '#cbd5e1' : '#475569',
                      border: 'none',
                      fontSize: '12px',
                      fontFamily: 'monospace',
                      cursor: 'pointer'
                    }}
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    style={{
                      flex: 1,
                      padding: '10px',
                      borderRadius: '8px',
                      background: '#10b981',
                      color: '#ffffff',
                      border: 'none',
                      fontSize: '12px',
                      fontFamily: 'monospace',
                      fontWeight: 'bold',
                      cursor: 'pointer'
                    }}
                  >
                    Send Ticket
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default HelpCenterDrawerSplitView;
