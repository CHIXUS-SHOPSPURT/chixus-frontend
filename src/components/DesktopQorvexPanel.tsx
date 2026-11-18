import React from 'react';
import { ArrowLeft, ChevronRight, Pin, Send, Volume2, Loader2 } from 'lucide-react';
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
}

export interface DesktopQorvexContact {
  id: string;
  name: string;
  role: string;
  status: string;
  avatar?: string;
  isBlocked?: boolean;
}

interface DesktopQorvexPanelProps {
  contact: DesktopQorvexContact;
  messages: DesktopQorvexChatMsg[];
  userName: string;
  userAvatar: string;
  newChatText: string;
  onChangeNewChatText: (val: string) => void;
  onSendMessage: (e: React.FormEvent) => void;
  onBackToMessages: () => void;
  onOpenProfile: () => void;
  isAiTyping: boolean;
  isAttachMenuOpen: boolean;
  onToggleAttachMenu: () => void;
  onSelectVoiceAttach: () => void;
  onSelectCameraAttach: () => void;
  onSelectFileAttach: () => void;
  chatImageAttachment: string | null;
  chatVoiceNoteAttachment: string | null;
  chatFileAttachment: { name: string } | null;
  onClearImageAttachment: () => void;
  onClearVoiceAttachment: () => void;
  onClearFileAttachment: () => void;
  speakingChatMsgId: string | null;
  onToggleSpeakMessage: (msgId: string, text: string) => void;
  scrollRef?: React.RefObject<HTMLDivElement | null>;
}

export const DesktopQorvexPanel: React.FC<DesktopQorvexPanelProps> = ({
  contact,
  messages,
  userAvatar,
  newChatText,
  onChangeNewChatText,
  onSendMessage,
  onBackToMessages,
  onOpenProfile,
  isAiTyping,
  isAttachMenuOpen,
  onToggleAttachMenu,
  onSelectVoiceAttach,
  onSelectCameraAttach,
  onSelectFileAttach,
  chatImageAttachment,
  chatVoiceNoteAttachment,
  chatFileAttachment,
  onClearImageAttachment,
  onClearVoiceAttachment,
  onClearFileAttachment,
  speakingChatMsgId,
  onToggleSpeakMessage,
  scrollRef,
}) => {
  const isQorvex =
    contact.id === CHIXUS_AI_BOT_ID ||
    contact.name === 'Qorvex' ||
    contact.name === 'Qordex' ||
    contact.name === 'CHIXUS AI';
  const contactAvatar = isQorvex ? CHIXUS_AI_BOT_AVATAR : contact.avatar || CHIXUS_AI_BOT_AVATAR;
  const hasSendablePayload = Boolean(
    newChatText.trim() || chatImageAttachment || chatVoiceNoteAttachment || chatFileAttachment
  );

  return (
    <aside
      id="desktop-qorvex-panel"
      className="hidden lg:flex lg:flex-col h-full w-[300px] xl:w-[340px] shrink-0 border-l border-slate-800/80 bg-[#070b12] p-3 xl:p-3.5"
    >
      <div className="flex flex-1 min-h-0 flex-col rounded-2xl border border-slate-700/60 bg-[#0d131f] shadow-[0_14px_34px_rgba(0,0,0,0.55)] overflow-hidden">
        {/* Top Bar: <- Messages + Qorvex Live Neural Core */}
        <div className="flex items-center justify-between gap-2 border-b border-slate-800/90 bg-[#0a0f1a] px-3 py-2.5">
          <button
            type="button"
            onClick={onBackToMessages}
            className="inline-flex items-center gap-1.5 rounded-lg border border-slate-700/70 bg-[#121928] px-2.5 py-1.5 font-mono text-[11px] font-semibold text-slate-200 hover:border-cyan-400/50 hover:text-white transition-colors cursor-pointer"
          >
            <ArrowLeft className="h-3.5 w-3.5 text-slate-300" />
            <span>Messages</span>
          </button>

          <button
            type="button"
            onClick={onOpenProfile}
            className="flex items-center gap-2 text-left cursor-pointer min-w-0"
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
        <div
          onClick={onOpenProfile}
          className="relative h-[74px] w-full shrink-0 overflow-hidden border-b border-cyan-500/20 bg-[#070a12] cursor-pointer group"
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
        </div>

        {/* Scrollable Chat Message Area */}
        <div
          ref={scrollRef as React.RefObject<HTMLDivElement>}
          className="flex-1 min-h-0 overflow-y-auto px-3 py-3 space-y-3 bg-[#090e17]"
        >
          {messages.map((msg) => {
            const isMe = msg.sender === 'me';
            const cleanText = cleanAiMessageText(msg.text || '');
            const isSpeaking = speakingChatMsgId === msg.id;

            return (
              <div
                key={msg.id}
                className={`flex items-start gap-2 ${isMe ? 'flex-row-reverse' : 'flex-row'}`}
              >
                <img
                  src={isMe ? userAvatar : contactAvatar}
                  alt={isMe ? 'You' : contact.name}
                  className="h-7 w-7 shrink-0 rounded-full object-cover border border-sky-400/40 mt-0.5"
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
                      className="mb-2 max-h-44 w-full rounded-lg object-cover border border-slate-700"
                    />
                  )}

                  {msg.fileAttachment && (
                    <div className="mb-2 rounded-lg border border-cyan-500/30 bg-[#090e18] px-2.5 py-1.5 font-mono text-[10px] text-cyan-300 truncate">
                      📁 {msg.fileAttachment.name}
                    </div>
                  )}

                  <div className="whitespace-pre-wrap break-words font-sans">{cleanText}</div>

                  <div
                    className={`mt-2 flex items-center gap-2 font-mono text-[10px] ${
                      isMe ? 'justify-end text-sky-300/80' : 'justify-between text-slate-400'
                    }`}
                  >
                    {!isMe && (
                      <button
                        type="button"
                        onClick={() => onToggleSpeakMessage(msg.id, cleanText)}
                        className={`inline-flex items-center gap-1 rounded-md border px-2 py-0.5 text-[10px] font-semibold transition-colors cursor-pointer ${
                          isSpeaking
                            ? 'border-red-400/60 bg-red-500/15 text-red-300'
                            : 'border-slate-700 bg-[#0b101b] text-slate-200 hover:border-sky-400/50'
                        }`}
                      >
                        <Volume2 className="h-3 w-3 text-sky-400" />
                        <span>{isSpeaking ? 'Stop' : 'Read Aloud'}</span>
                      </button>
                    )}
                    <span>{msg.timestamp}</span>
                  </div>
                </div>
              </div>
            );
          })}

          {isAiTyping && (
            <div className="flex items-center gap-2 px-2 py-1 text-xs font-mono text-sky-300">
              <Loader2 className="h-3.5 w-3.5 animate-spin text-sky-400" />
              <span>Qorvex is analyzing...</span>
            </div>
          )}
        </div>

        {/* Active Attachment Preview */}
        {(chatImageAttachment || chatVoiceNoteAttachment || chatFileAttachment) && (
          <div className="flex items-center justify-between gap-2 border-t border-slate-800 bg-[#0b101b] px-3 py-2 text-[11px] font-mono text-sky-300">
            <span className="truncate">
              {chatFileAttachment
                ? `📁 ${chatFileAttachment.name}`
                : chatImageAttachment
                ? '📷 Image attached'
                : '🎤 Voice note attached'}
            </span>
            <button
              type="button"
              onClick={() => {
                onClearImageAttachment();
                onClearVoiceAttachment();
                onClearFileAttachment();
              }}
              className="text-red-400 hover:text-red-300 font-bold cursor-pointer"
            >
              Remove
            </button>
          </div>
        )}

        {/* Bottom Chat Input Bar */}
        <form
          onSubmit={onSendMessage}
          className="relative flex items-center gap-2 border-t border-slate-800/90 bg-[#0a0f1a] px-2.5 py-2.5"
        >
          <div className="relative">
            <button
              type="button"
              onClick={onToggleAttachMenu}
              title="Attachments"
              className="flex h-9 w-9 items-center justify-center rounded-xl border border-slate-700/70 bg-[#121928] text-slate-300 hover:border-sky-400/50 hover:text-white cursor-pointer font-bold"
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
                >
                  🎤
                </button>
                <button
                  type="button"
                  onClick={onSelectCameraAttach}
                  className="flex h-9 w-9 items-center justify-center rounded-lg bg-[#192236] hover:bg-[#222e48] text-base cursor-pointer"
                  aria-label="Camera"
                >
                  📷
                </button>
                <button
                  type="button"
                  onClick={onSelectFileAttach}
                  className="flex h-9 w-9 items-center justify-center rounded-lg bg-[#192236] hover:bg-[#222e48] text-base cursor-pointer"
                  aria-label="File"
                >
                  📁
                </button>
              </div>
            )}
          </div>

          <input
            type="text"
            value={newChatText}
            onChange={(e) => onChangeNewChatText(e.target.value)}
            placeholder={`Message ${contact.name}...`}
            className="min-w-0 flex-1 rounded-xl border border-slate-800 bg-[#070b12] px-3 py-2 text-xs text-slate-100 placeholder:text-slate-500 focus:border-sky-400/60 focus:outline-none"
          />

          <button
            type="submit"
            disabled={!hasSendablePayload}
            className={`inline-flex h-9 items-center gap-1.5 rounded-xl px-3 font-mono text-[11px] font-bold transition-all ${
              hasSendablePayload
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
