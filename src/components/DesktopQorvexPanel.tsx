import React, { useEffect, useRef, useState } from 'react';
import {
  ArrowLeft,
  BookOpen,
  Check,
  CheckCircle2,
  ChevronRight,
  ChevronsDown,
  Copy,
  Loader2,
  Pin,
  Send,
  Share2,
  Sparkles,
  Volume2,
} from 'lucide-react';
import { CHIXUS_AI_BOT_AVATAR, CHIXUS_AI_BOT_ID, cleanAiMessageText } from '../chixusAiandVoice';

const QORVEX_COVER_IMAGE = '/assets/aistudio/file_00000000bda48246b7e0c341de9bfaaf_b886482d.png';

export interface DesktopQorvexChatMsg {
  id: string;
  contactId: string;
  sender: 'me' | 'them';
  text: string;
  timestamp: string;
  imageAttachment?: string;
  audioAttachment?: string;
  fileAttachment?: {
    name: string;
    size?: number;
    type: string;
    content?: string;
    dataUrl?: string;
  };
  isPinned?: boolean;
  deliveryStatus?: 'sent' | 'delivered' | 'read';
}

export interface DesktopQorvexContact {
  id: string;
  name: string;
  role: string;
  status: string;
  avatar?: string;
  isBlocked?: boolean;
}

export interface DesktopQorvexThinkingStep {
  id: string;
  label: string;
  detail: string;
  status: 'done' | 'active' | 'pending';
}

interface DesktopQorvexPanelProps {
  contact: DesktopQorvexContact;
  messages: DesktopQorvexChatMsg[];
  userName: string;
  userAvatar: string;
  newChatText: string;
  onChangeNewChatText: (val: string) => void;
  onSendMessage: (e: React.FormEvent) => void;
  onQuickPrompt: (prompt: string) => void;
  onBackToMessages: () => void;
  onOpenProfile: () => void;
  isAiTyping: boolean;
  thinkingSteps?: DesktopQorvexThinkingStep[];
  isAttachMenuOpen: boolean;
  onToggleAttachMenu: () => void;
  onCloseAttachMenu: () => void;
  onSelectVoiceAttach: () => void;
  onSelectCameraAttach: () => void;
  onSelectFileAttach: () => void;
  isRecordingVoiceNote?: boolean;
  voiceNoteRecordingSeconds?: number;
  onStopVoiceRecording?: () => void;
  onCancelVoiceRecording?: () => void;
  chatImageAttachment: string | null;
  chatVoiceNoteAttachment: string | null;
  chatFileAttachment: { name: string } | null;
  onClearImageAttachment: () => void;
  onClearVoiceAttachment: () => void;
  onClearFileAttachment: () => void;
  speakingChatMsgId: string | null;
  onToggleSpeakMessage: (msgId: string, text: string) => void;
  onCopyMessage: (msg: DesktopQorvexChatMsg) => void;
  onPinMessage: (msgId: string) => void;
  onShareMessage: (msg: DesktopQorvexChatMsg) => void;
  onZoomImage: (url: string) => void;
  onReadFileAttachment: (msg: DesktopQorvexChatMsg) => void;
  scrollRef?: React.RefObject<HTMLDivElement | null>;
}

const QORVEX_QUICK_PROMPTS = [
  'Diagnose PCB short circuit step-by-step',
  'Verify power rail voltage & ripple checks',
  'Give me a hardware safety lockout checklist',
  'Summarize my CHIXUS node & feed status',
];

export const DesktopQorvexPanel: React.FC<DesktopQorvexPanelProps> = ({
  contact,
  messages,
  userName,
  userAvatar,
  newChatText,
  onChangeNewChatText,
  onSendMessage,
  onQuickPrompt,
  onBackToMessages,
  onOpenProfile,
  isAiTyping,
  thinkingSteps = [],
  isAttachMenuOpen,
  onToggleAttachMenu,
  onCloseAttachMenu,
  onSelectVoiceAttach,
  onSelectCameraAttach,
  onSelectFileAttach,
  isRecordingVoiceNote = false,
  voiceNoteRecordingSeconds = 0,
  onStopVoiceRecording,
  onCancelVoiceRecording,
  chatImageAttachment,
  chatVoiceNoteAttachment,
  chatFileAttachment,
  onClearImageAttachment,
  onClearVoiceAttachment,
  onClearFileAttachment,
  speakingChatMsgId,
  onToggleSpeakMessage,
  onCopyMessage,
  onPinMessage,
  onShareMessage,
  onZoomImage,
  onReadFileAttachment,
  scrollRef,
}) => {
  const internalScrollRef = useRef<HTMLDivElement | null>(null);
  const attachContainerRef = useRef<HTMLDivElement | null>(null);
  const textareaRef = useRef<HTMLTextAreaElement | null>(null);
  const [showScrollDownBtn, setShowScrollDownBtn] = useState(false);
  const [copiedMsgId, setCopiedMsgId] = useState<string | null>(null);
  const isNearBottomRef = useRef(true);

  const setCombinedScrollRef = (node: HTMLDivElement | null) => {
    internalScrollRef.current = node;
    if (scrollRef && 'current' in scrollRef) {
      (scrollRef as React.MutableRefObject<HTMLDivElement | null>).current = node;
    }
  };

  const scrollToBottom = (smooth = true) => {
    const el = internalScrollRef.current;
    if (!el) return;
    if (smooth && typeof el.scrollTo === 'function') {
      el.scrollTo({ top: el.scrollHeight, behavior: 'smooth' });
    } else {
      el.scrollTop = el.scrollHeight;
    }
    isNearBottomRef.current = true;
    setShowScrollDownBtn(false);
  };

  // Auto-scroll smoothly when new messages arrive or Qorvex starts/stops thinking, if user hasn't scrolled up
  useEffect(() => {
    const el = internalScrollRef.current;
    if (!el) return;
    if (isNearBottomRef.current) {
      const raf = window.requestAnimationFrame(() => {
        if (internalScrollRef.current) {
          internalScrollRef.current.scrollTop = internalScrollRef.current.scrollHeight;
        }
      });
      return () => window.cancelAnimationFrame(raf);
    }
  }, [messages.length, isAiTyping, thinkingSteps.length]);

  // Auto-resize composer textarea cleanly
  useEffect(() => {
    const ta = textareaRef.current;
    if (!ta) return;
    ta.style.height = 'auto';
    ta.style.height = `${Math.min(ta.scrollHeight, 96)}px`;
  }, [newChatText]);

  // Close attach menu on outside click
  useEffect(() => {
    if (!isAttachMenuOpen) return;
    const handleOutside = (ev: MouseEvent) => {
      if (attachContainerRef.current && !attachContainerRef.current.contains(ev.target as Node)) {
        onCloseAttachMenu();
      }
    };
    document.addEventListener('mousedown', handleOutside);
    return () => document.removeEventListener('mousedown', handleOutside);
  }, [isAttachMenuOpen, onCloseAttachMenu]);

  const isQorvex =
    contact.id === CHIXUS_AI_BOT_ID ||
    contact.name === 'Qorvex' ||
    contact.name === 'Qordex' ||
    contact.name === 'CHIXUS AI';
  const contactAvatar = isQorvex ? CHIXUS_AI_BOT_AVATAR : contact.avatar || CHIXUS_AI_BOT_AVATAR;
  const hasSendablePayload = Boolean(
    newChatText.trim() ||
      chatImageAttachment ||
      chatVoiceNoteAttachment ||
      chatFileAttachment ||
      isRecordingVoiceNote
  );
  const pinnedMsgs = messages.filter((m) => m.isPinned);
  const latestPinned = pinnedMsgs.length > 0 ? pinnedMsgs[pinnedMsgs.length - 1] : null;

  const handleScroll = (e: React.UIEvent<HTMLDivElement>) => {
    const el = e.currentTarget;
    const distanceFromBottom = el.scrollHeight - el.scrollTop - el.clientHeight;
    const nearBottom = distanceFromBottom <= 64;
    isNearBottomRef.current = nearBottom;
    setShowScrollDownBtn(!nearBottom);
  };

  const handleComposerKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      if (hasSendablePayload && !isAiTyping) {
        isNearBottomRef.current = true;
        onSendMessage(e as unknown as React.FormEvent);
      }
    }
  };

  return (
    <aside
      id="desktop-qorvex-panel"
      className="hidden lg:flex lg:flex-col lg:h-screen min-h-0 max-h-screen overflow-hidden w-[300px] xl:w-[340px] shrink-0 border-l border-slate-800/80 bg-[#070b12] p-3 xl:p-3.5"
    >
      <div className="flex flex-1 min-h-0 flex-col rounded-2xl border border-slate-700/60 bg-[#0d131f] shadow-[0_14px_34px_rgba(0,0,0,0.55)] overflow-hidden">
        {/* Top Bar: <- Messages + Qorvex Live Neural Core */}
        <div className="flex shrink-0 items-center justify-between gap-2 border-b border-slate-800/90 bg-[#0a0f1a] px-3 py-2.5">
          <button
            type="button"
            id="desktop-qorvex-messages-btn"
            onClick={onBackToMessages}
            className="inline-flex items-center gap-1.5 rounded-lg border border-slate-700/70 bg-[#121928] px-2.5 py-1.5 font-mono text-[11px] font-semibold text-slate-200 hover:border-cyan-400/50 hover:text-white transition-colors cursor-pointer"
            title="Open full Messages workspace"
          >
            <ArrowLeft className="h-3.5 w-3.5 text-slate-300" />
            <span>Messages</span>
          </button>

          <button
            type="button"
            id="desktop-qorvex-header-profile-btn"
            onClick={onOpenProfile}
            className="flex items-center gap-2 text-left cursor-pointer min-w-0"
            title="View Qorvex Neural Core Profile"
          >
            <div className="relative h-8 w-8 shrink-0">
              <img
                src={contactAvatar}
                alt={contact.name}
                className="h-8 w-8 rounded-full object-cover border border-sky-400/70"
              />
              <span className="absolute -bottom-0.5 -right-0.5 h-2.5 w-2.5 rounded-full bg-emerald-400 border-2 border-[#0a0f1a]" />
            </div>
            <div className="min-w-0">
              <div className="truncate font-sans text-xs font-bold text-white leading-tight">
                {contact.name}
              </div>
              <div className="flex items-center gap-1 mt-0.5">
                <span className="h-1.5 w-1.5 rounded-full bg-emerald-400 animate-pulse" />
                <span className="font-mono text-[10px] font-semibold text-sky-300 truncate">
                  {isQorvex ? 'Live Neural Core' : contact.status || 'Online'}
                </span>
              </div>
            </div>
          </button>
        </div>

        {/* QORVEX // NEURAL CORE Banner Card */}
        <button
          type="button"
          onClick={onOpenProfile}
          className="relative h-[68px] w-full shrink-0 overflow-hidden border-b border-cyan-500/20 bg-[#070a12] cursor-pointer group text-left"
        >
          <img
            src={QORVEX_COVER_IMAGE}
            alt="Qorvex Neural Core"
            className="h-full w-full object-cover object-center opacity-60 transition-transform duration-500 group-hover:scale-105"
          />
          <div
            aria-hidden="true"
            className="absolute inset-0"
            style={{
              background:
                'linear-gradient(90deg, rgba(7, 11, 18, 0.94) 0%, rgba(13, 19, 31, 0.52) 55%, rgba(7, 11, 18, 0.92) 100%)',
            }}
          />
          <div className="absolute inset-0 flex items-center justify-between gap-2 px-3.5">
            <div className="min-w-0">
              <div className="font-mono text-[11px] font-black tracking-wider text-white">
                {isQorvex ? 'QORVEX // NEURAL CORE' : contact.name.toUpperCase()}
              </div>
              <div className="mt-0.5 font-mono text-[9.5px] text-sky-300 truncate">
                Think Deeper • Build Smarter • Live Diagnostics
              </div>
            </div>
            <span className="inline-flex items-center gap-1 shrink-0 rounded-xl border border-slate-600/80 bg-[#0b101b]/90 px-2.5 py-1.5 font-mono text-[10px] font-bold text-slate-100 group-hover:border-cyan-400/60">
              <span>Profile</span>
              <ChevronRight className="h-3 w-3 text-sky-300" />
            </span>
          </div>
        </button>

        {/* Pinned Message Strip */}
        {latestPinned && (
          <div className="flex shrink-0 items-center justify-between gap-2 border-b border-sky-500/25 bg-sky-950/35 px-3 py-1.5 font-mono text-[10.5px]">
            <div className="flex min-w-0 flex-1 items-center gap-1.5">
              <Pin className="h-3 w-3 shrink-0 text-sky-400" />
              <span className="shrink-0 font-bold text-sky-300">Pinned:</span>
              <span className="truncate text-slate-200">{cleanAiMessageText(latestPinned.text)}</span>
            </div>
            <button
              type="button"
              onClick={() => onPinMessage(latestPinned.id)}
              className="shrink-0 text-[10px] font-semibold text-slate-400 hover:text-white cursor-pointer"
            >
              Unpin
            </button>
          </div>
        )}

        {/* Scrollable Chat Message Area + Floating Scroll-to-Bottom Button */}
        <div className="relative flex-1 min-h-0 flex flex-col">
          <div
            ref={setCombinedScrollRef}
            id="desktop-qorvex-scroll-stream"
            onScroll={handleScroll}
            className="flex-1 min-h-0 overflow-y-auto overscroll-contain px-3 py-3 space-y-3 bg-[#090e17] [&::-webkit-scrollbar]:w-1.5 [&::-webkit-scrollbar-thumb]:rounded-full [&::-webkit-scrollbar-thumb]:bg-slate-700/75 [&::-webkit-scrollbar-track]:bg-transparent"
          >
            {messages.map((msg) => {
              const isMe = msg.sender === 'me';
              const cleanText = cleanAiMessageText(msg.text || '');
              const isSpeaking = speakingChatMsgId === msg.id;
              const isCopied = copiedMsgId === msg.id;

              return (
                <div
                  key={msg.id}
                  className={`flex items-start gap-2 ${isMe ? 'flex-row-reverse' : 'flex-row'}`}
                >
                  <img
                    src={isMe ? userAvatar : contactAvatar}
                    alt={isMe ? userName : contact.name}
                    onClick={() => {
                      if (!isMe) onOpenProfile();
                    }}
                    className={`h-7 w-7 shrink-0 rounded-full object-cover border border-sky-400/40 mt-0.5 ${
                      !isMe ? 'cursor-pointer hover:border-cyan-300' : ''
                    }`}
                  />
                  <div
                    className={`max-w-[85%] rounded-2xl px-3 py-2.5 text-[12px] leading-relaxed shadow-md ${
                      isMe
                        ? 'bg-sky-500/20 border border-sky-400/40 text-slate-100 rounded-tr-sm'
                        : 'bg-[#121928] border border-slate-700/70 text-slate-100 rounded-tl-sm'
                    }`}
                  >
                    {msg.isPinned && (
                      <div className="mb-1 inline-flex items-center gap-1 font-mono text-[9px] font-bold text-amber-400">
                        <Pin className="h-2.5 w-2.5" />
                        <span>Pinned</span>
                      </div>
                    )}

                    {msg.imageAttachment && (
                      <img
                        src={msg.imageAttachment}
                        alt="Attachment"
                        onClick={() => onZoomImage(msg.imageAttachment!)}
                        className="mb-2 max-h-44 w-full rounded-lg object-cover border border-slate-700 cursor-zoom-in hover:border-sky-400/60"
                      />
                    )}

                    {msg.audioAttachment && (
                      <div className="mb-2 flex items-center gap-1.5 rounded-lg border border-sky-500/30 bg-[#090e18] p-1.5">
                        <span className="text-xs">🎤</span>
                        <audio controls src={msg.audioAttachment} className="h-7 w-full max-w-[180px]" />
                      </div>
                    )}

                    {msg.fileAttachment && (
                      <div className="mb-2 rounded-lg border border-cyan-500/30 bg-[#090e18] p-2 font-mono text-[10px]">
                        <div className="flex items-center justify-between gap-2">
                          <span className="truncate font-bold text-cyan-300">
                            📁 {msg.fileAttachment.name}
                          </span>
                          <button
                            type="button"
                            onClick={() => onReadFileAttachment(msg)}
                            className="inline-flex shrink-0 items-center gap-1 rounded border border-sky-400/60 bg-sky-500/15 px-1.5 py-0.5 text-[9.5px] font-bold text-sky-300 hover:bg-sky-500/25 cursor-pointer"
                          >
                            <BookOpen className="h-2.5 w-2.5" />
                            <span>Read</span>
                          </button>
                        </div>
                        {msg.fileAttachment.content && msg.fileAttachment.content.trim() && (
                          <div className="mt-1.5 max-h-20 overflow-y-auto rounded bg-slate-950/80 p-1.5 text-[9.5px] text-slate-300 whitespace-pre-wrap break-words">
                            {msg.fileAttachment.content.slice(0, 320)}
                            {msg.fileAttachment.content.length > 320 ? '...' : ''}
                          </div>
                        )}
                      </div>
                    )}

                    <div className="whitespace-pre-wrap break-words font-sans">{cleanText}</div>

                    <div className="mt-2 flex flex-wrap items-center justify-between gap-1.5 font-mono text-[10px] text-slate-400">
                      <div className="flex items-center gap-1">
                        {!isMe && (
                          <button
                            type="button"
                            onClick={() => onToggleSpeakMessage(msg.id, cleanText)}
                            className={`inline-flex items-center gap-1 rounded-md border px-1.5 py-0.5 text-[9.5px] font-semibold transition-colors cursor-pointer ${
                              isSpeaking
                                ? 'border-red-400/60 bg-red-500/15 text-red-300'
                                : 'border-slate-700 bg-[#0b101b] text-slate-200 hover:border-sky-400/50'
                            }`}
                            title={isSpeaking ? 'Stop reading' : 'Read aloud'}
                          >
                            <Volume2 className="h-2.5 w-2.5 text-sky-400" />
                            <span>{isSpeaking ? 'Stop' : 'Read'}</span>
                          </button>
                        )}
                        <button
                          type="button"
                          onClick={() => {
                            onCopyMessage(msg);
                            setCopiedMsgId(msg.id);
                            window.setTimeout(() => {
                              setCopiedMsgId((prev) => (prev === msg.id ? null : prev));
                            }, 1600);
                          }}
                          className="inline-flex items-center gap-1 rounded-md border border-slate-700/80 bg-[#0b101b] px-1.5 py-0.5 text-[9.5px] text-slate-300 hover:border-sky-400/50 hover:text-white cursor-pointer"
                          title="Copy message"
                        >
                          {isCopied ? (
                            <Check className="h-2.5 w-2.5 text-emerald-400" />
                          ) : (
                            <Copy className="h-2.5 w-2.5" />
                          )}
                          <span>{isCopied ? 'Copied' : 'Copy'}</span>
                        </button>
                        <button
                          type="button"
                          onClick={() => onPinMessage(msg.id)}
                          className={`inline-flex items-center justify-center rounded-md border px-1.5 py-0.5 text-[9.5px] cursor-pointer ${
                            msg.isPinned
                              ? 'border-amber-400/50 bg-amber-500/10 text-amber-300'
                              : 'border-slate-700/80 bg-[#0b101b] text-slate-400 hover:border-sky-400/50 hover:text-white'
                          }`}
                          title={msg.isPinned ? 'Unpin message' : 'Pin message'}
                        >
                          <Pin className="h-2.5 w-2.5" />
                        </button>
                        {!isMe && (
                          <button
                            type="button"
                            onClick={() => onShareMessage(msg)}
                            className="inline-flex items-center justify-center rounded-md border border-slate-700/80 bg-[#0b101b] px-1.5 py-0.5 text-[9.5px] text-slate-400 hover:border-sky-400/50 hover:text-white cursor-pointer"
                            title="Share to Feed"
                          >
                            <Share2 className="h-2.5 w-2.5" />
                          </button>
                        )}
                      </div>
                      <span className="ml-auto text-[9.5px] text-slate-400">{msg.timestamp}</span>
                    </div>
                  </div>
                </div>
              );
            })}

            {isAiTyping && (
              <div className="rounded-xl border border-sky-500/40 bg-[#0e1524] p-2.5 shadow-lg space-y-2">
                <div className="flex items-center gap-2 text-[11px] font-mono font-bold text-white">
                  <Loader2 className="h-3.5 w-3.5 animate-spin text-sky-400 shrink-0" />
                  <span>Qorvex is thinking live...</span>
                </div>
                <div className="space-y-1.5">
                  {(thinkingSteps.length > 0
                    ? thinkingSteps
                    : [
                        {
                          id: 'fallback-step',
                          label: 'Analyzing prompt & system telemetry',
                          detail: 'Preparing response...',
                          status: 'active' as const,
                        },
                      ]
                  ).map((step) => (
                    <div
                      key={step.id}
                      className={`flex items-start gap-2 ${
                        step.status === 'pending' ? 'opacity-50' : 'opacity-100'
                      }`}
                    >
                      <div className="mt-0.5 shrink-0">
                        {step.status === 'done' ? (
                          <CheckCircle2 className="h-3 w-3 text-sky-300" />
                        ) : step.status === 'active' ? (
                          <span className="inline-block h-2 w-2 rounded-full bg-sky-400 animate-pulse m-0.5" />
                        ) : (
                          <span className="inline-block h-1.5 w-1.5 rounded-full bg-slate-500 m-1" />
                        )}
                      </div>
                      <div className="min-w-0 font-mono">
                        <div
                          className={`text-[10px] leading-tight ${
                            step.status === 'active'
                              ? 'font-bold text-sky-300'
                              : step.status === 'done'
                              ? 'font-semibold text-slate-200'
                              : 'text-slate-400'
                          }`}
                        >
                          {step.label}
                        </div>
                        <div className="text-[9px] text-slate-400 truncate">{step.detail}</div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>

          {showScrollDownBtn && (
            <button
              type="button"
              id="desktop-qorvex-scroll-bottom-btn"
              onClick={() => scrollToBottom(true)}
              title="Scroll to latest message"
              aria-label="Scroll to latest message"
              className="absolute bottom-3 right-3 z-20 flex h-7 w-7 items-center justify-center rounded-full border border-sky-400/60 bg-[#0b101b]/95 text-sky-400 shadow-lg hover:bg-sky-500/20 hover:text-white transition-colors cursor-pointer"
            >
              <ChevronsDown className="h-4 w-4" />
            </button>
          )}
        </div>

        {/* Interactive Quick Prompts Strip */}
        <div className="flex shrink-0 items-center gap-1.5 overflow-x-auto border-t border-slate-800/80 bg-[#0b101b] px-2.5 py-1.5 [&::-webkit-scrollbar]:hidden">
          <Sparkles className="h-3 w-3 shrink-0 text-sky-400" />
          {QORVEX_QUICK_PROMPTS.map((prompt) => (
            <button
              key={prompt}
              type="button"
              disabled={isAiTyping}
              onClick={() => {
                isNearBottomRef.current = true;
                onQuickPrompt(prompt);
              }}
              className="shrink-0 rounded-lg border border-slate-700/80 bg-[#121928] px-2 py-1 font-mono text-[9.5px] font-medium text-slate-200 hover:border-sky-400/60 hover:text-sky-300 disabled:opacity-45 cursor-pointer transition-colors"
            >
              {prompt}
            </button>
          ))}
        </div>

        {/* Live Voice Recording & Active Attachment Previews */}
        {(isRecordingVoiceNote || chatImageAttachment || chatVoiceNoteAttachment || chatFileAttachment) && (
          <div className="flex shrink-0 flex-col gap-1.5 border-t border-slate-800 bg-[#0b101b] px-3 py-2 text-[11px] font-mono text-sky-300">
            {isRecordingVoiceNote && (
              <div className="flex items-center justify-between gap-2 text-red-400 font-bold">
                <span>
                  🔴 🎤 {Math.floor(voiceNoteRecordingSeconds / 60)}:
                  {String(voiceNoteRecordingSeconds % 60).padStart(2, '0')}
                </span>
                <div className="flex items-center gap-1.5">
                  <button
                    type="button"
                    onClick={onStopVoiceRecording}
                    className="rounded border border-emerald-500/70 bg-emerald-500/15 px-2 py-0.5 text-xs cursor-pointer"
                    title="Finish recording"
                  >
                    ⏹️
                  </button>
                  <button
                    type="button"
                    onClick={onCancelVoiceRecording}
                    className="rounded border border-red-500/70 bg-red-500/15 px-2 py-0.5 text-xs cursor-pointer"
                    title="Cancel recording"
                  >
                    🗑️
                  </button>
                </div>
              </div>
            )}

            {(chatImageAttachment || chatVoiceNoteAttachment || chatFileAttachment) && (
              <div className="flex items-center justify-between gap-2">
                <span className="truncate">
                  {chatFileAttachment
                    ? `📁 ${chatFileAttachment.name}`
                    : chatImageAttachment
                    ? '📷 Image attached'
                    : '🎤 Voice note ready'}
                </span>
                <button
                  type="button"
                  onClick={() => {
                    onClearImageAttachment();
                    onClearVoiceAttachment();
                    onClearFileAttachment();
                  }}
                  className="text-red-400 hover:text-red-300 font-bold cursor-pointer shrink-0"
                >
                  Remove
                </button>
              </div>
            )}
          </div>
        )}

        {/* Bottom Chat Input Bar */}
        <form
          onSubmit={(e) => {
            isNearBottomRef.current = true;
            onSendMessage(e);
          }}
          className="relative flex shrink-0 items-end gap-2 border-t border-slate-800/90 bg-[#0a0f1a] px-2.5 py-2.5"
        >
          <div ref={attachContainerRef} className="relative shrink-0">
            <button
              type="button"
              id="desktop-qorvex-attach-btn"
              onClick={onToggleAttachMenu}
              title="Attachments (Voice, Image, Document)"
              className={`flex h-9 w-9 items-center justify-center rounded-xl border font-bold cursor-pointer transition-colors ${
                isAttachMenuOpen
                  ? 'border-sky-400 bg-sky-500/15 text-sky-300'
                  : 'border-slate-700/70 bg-[#121928] text-slate-300 hover:border-sky-400/50 hover:text-white'
              }`}
            >
              ⋯
            </button>

            {isAttachMenuOpen && (
              <div className="absolute bottom-11 left-0 z-30 flex flex-col gap-1.5 rounded-xl border border-sky-400/50 bg-[#101625] p-1.5 shadow-2xl">
                <button
                  type="button"
                  onClick={onSelectVoiceAttach}
                  className="flex h-9 w-9 items-center justify-center rounded-lg bg-[#192236] hover:bg-[#222e48] text-base cursor-pointer"
                  aria-label="Voice Note"
                  title="Record Voice Note"
                >
                  🎤
                </button>
                <button
                  type="button"
                  onClick={onSelectCameraAttach}
                  className="flex h-9 w-9 items-center justify-center rounded-lg bg-[#192236] hover:bg-[#222e48] text-base cursor-pointer"
                  aria-label="Attach Image"
                  title="Attach Image"
                >
                  📷
                </button>
                <button
                  type="button"
                  onClick={onSelectFileAttach}
                  className="flex h-9 w-9 items-center justify-center rounded-lg bg-[#192236] hover:bg-[#222e48] text-base cursor-pointer"
                  aria-label="Attach File"
                  title="Attach File or Document"
                >
                  📁
                </button>
              </div>
            )}
          </div>

          <textarea
            ref={textareaRef}
            id="desktop-qorvex-input"
            rows={1}
            value={newChatText}
            onChange={(e) => onChangeNewChatText(e.target.value)}
            onKeyDown={handleComposerKeyDown}
            placeholder={`Ask ${contact.name} anything...`}
            className="min-w-0 flex-1 resize-none rounded-xl border border-slate-800 bg-[#070b12] px-3 py-2 text-xs leading-snug text-slate-100 placeholder:text-slate-500 focus:border-sky-400/60 focus:outline-none max-h-24 overflow-y-auto"
          />

          <button
            type="submit"
            id="desktop-qorvex-send-btn"
            disabled={!hasSendablePayload || isAiTyping}
            className={`inline-flex h-9 shrink-0 items-center gap-1.5 rounded-xl px-3 font-mono text-[11px] font-bold transition-all ${
              hasSendablePayload && !isAiTyping
                ? 'bg-slate-100 text-[#070b12] hover:bg-white cursor-pointer shadow-sm'
                : 'bg-[#171e2d] text-slate-500 border border-slate-800 cursor-not-allowed'
            }`}
          >
            <Send className="h-3.5 w-3.5 -rotate-12" />
            <span>Send</span>
          </button>
        </form>
      </div>
    </aside>
  );
};

export default DesktopQorvexPanel;
