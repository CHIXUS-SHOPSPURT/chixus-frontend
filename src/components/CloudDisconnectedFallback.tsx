import React from 'react';
import { RefreshCw, WifiOff, CloudOff, ShieldAlert, LogIn } from 'lucide-react';
import disconnectedIllustration from '../assets/images/chixus_cloud_disconnected_1794995174550.jpg';

export type CloudFallbackCategory =
  | 'no_internet'
  | 'server_reason'
  | 'unreachable'
  | 'session_expired';

export interface CloudSyncFailureState {
  category: CloudFallbackCategory;
  reason: string;
  statusCode?: number;
}

interface CloudDisconnectedFallbackProps {
  failure: CloudSyncFailureState;
  isRetrying?: boolean;
  onRetrySync: () => void;
  onOpenLogin?: () => void;
}

export const CloudDisconnectedFallback: React.FC<CloudDisconnectedFallbackProps> = ({
  failure,
  isRetrying = false,
  onRetrySync,
  onOpenLogin,
}) => {
  const isOffline = failure.category === 'no_internet';
  const isSessionIssue = failure.category === 'session_expired';

  const statusTag = isOffline
    ? 'NO INTERNET CONNECTION'
    : isSessionIssue
    ? 'CLOUD SESSION VERIFICATION REQUIRED'
    : failure.category === 'server_reason'
    ? 'CLOUD SERVICE NOTICE'
    : 'CLOUD SYNC DISCONNECTED';

  const headline = isOffline
    ? 'Internet Connection Required'
    : isSessionIssue
    ? 'Cloud Session Needs Attention'
    : 'Unable to Connect to CHIXUS Cloud';

  const IconComponent = isOffline ? WifiOff : isSessionIssue ? ShieldAlert : CloudOff;

  return (
    <div
      id="chixus-cloud-disconnected-fallback"
      className="fixed inset-0 z-[999990] flex items-center justify-center bg-[#070b12] px-4 py-6 overflow-y-auto select-none"
    >
      {/* Ambient Deep Cyan / Blue Radial Glow */}
      <div
        aria-hidden="true"
        className="pointer-events-none fixed inset-0 flex items-center justify-center overflow-hidden"
      >
        <div
          className="h-[460px] w-[460px] rounded-full blur-3xl opacity-30"
          style={{
            background:
              'radial-gradient(circle, rgba(45,212,191,0.22) 0%, rgba(59,130,246,0.2) 48%, transparent 78%)',
          }}
        />
      </div>

      <div className="relative z-10 w-full max-w-lg rounded-3xl border border-slate-700/70 bg-[#0d131f]/95 shadow-[0_24px_70px_rgba(0,0,0,0.85)] overflow-hidden backdrop-blur-xl">
        {/* Disconnected Artwork Hero */}
        <div className="relative h-52 sm:h-60 w-full overflow-hidden border-b border-slate-800/90 bg-[#070b12]">
          <img
            src={disconnectedIllustration}
            alt="CHIXUS Cloud Disconnected"
            className="h-full w-full object-cover object-center"
          />
          <div
            aria-hidden="true"
            className="absolute inset-0"
            style={{
              background:
                'linear-gradient(180deg, rgba(7,11,18,0.18) 0%, rgba(7,11,18,0.45) 60%, rgba(13,19,31,0.98) 100%)',
            }}
          />

          <div className="absolute top-3.5 left-4 inline-flex items-center gap-2 rounded-xl border border-amber-400/45 bg-[#090e18]/90 px-3 py-1.5 backdrop-blur-md">
            <IconComponent className="h-3.5 w-3.5 text-amber-400" />
            <span className="font-mono text-[10px] font-extrabold tracking-[0.14em] text-amber-300">
              {statusTag}
            </span>
          </div>
        </div>

        {/* Content & Clear Human-Readable Fallback Reason */}
        <div className="px-6 pb-6 pt-4 flex flex-col gap-4">
          <div>
            <h1
              className="text-xl sm:text-2xl font-bold text-white tracking-tight"
              style={{ fontFamily: "'Space Grotesk', -apple-system, sans-serif" }}
            >
              {headline}
            </h1>
            <p className="mt-1.5 text-xs sm:text-[13px] text-slate-400 leading-relaxed">
              CHIXUS syncs live with the cloud to protect your diagnostics, feed, and telemetry.
            </p>
          </div>

          {/* Dedicated Reason Box */}
          <div
            id="cloud-fallback-reason-box"
            className="rounded-2xl border border-cyan-500/30 bg-[#080d17] p-4"
          >
            <div className="font-mono text-[10px] font-bold uppercase tracking-[0.16em] text-sky-400 mb-1.5">
              Reason
            </div>
            <p className="text-[13px] sm:text-sm font-medium text-slate-100 leading-relaxed">
              {failure.reason}
            </p>
          </div>

          {/* Primary Retry + Optional Account Sign-In */}
          <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2.5 pt-1">
            <button
              type="button"
              id="cloud-fallback-retry-btn"
              disabled={isRetrying}
              onClick={onRetrySync}
              className="flex-1 inline-flex items-center justify-center gap-2 rounded-2xl bg-gradient-to-r from-teal-400 to-blue-500 px-5 py-3.5 text-xs sm:text-sm font-bold text-slate-950 shadow-[0_8px_24px_rgba(45,212,191,0.28)] hover:brightness-110 active:scale-[0.99] disabled:opacity-60 transition-all cursor-pointer"
            >
              <RefreshCw className={`h-4 w-4 ${isRetrying ? 'animate-spin' : ''}`} />
              <span>{isRetrying ? 'Reconnecting to Cloud...' : 'Retry Cloud Sync'}</span>
            </button>

            {isSessionIssue && onOpenLogin && (
              <button
                type="button"
                id="cloud-fallback-login-btn"
                onClick={onOpenLogin}
                className="inline-flex items-center justify-center gap-2 rounded-2xl border border-slate-700 bg-[#121928] px-4 py-3.5 text-xs sm:text-sm font-semibold text-slate-200 hover:border-sky-400/60 hover:text-white transition-all cursor-pointer"
              >
                <LogIn className="h-4 w-4 text-sky-400" />
                <span>Sign In</span>
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default CloudDisconnectedFallback;
