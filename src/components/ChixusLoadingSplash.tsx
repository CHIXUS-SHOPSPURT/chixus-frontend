import React, { useEffect, useRef, useState } from 'react';
import { tr } from '../i18n/translations';
import { sanitizeCloudFallbackReason } from '../apiConfig';
import { sharedNetworkConnectivityMonitor } from '../services/networkConnectivityService';
import type { CloudSyncFailureState } from './CloudDisconnectedFallback';

export type NetworkSyncResult =
  | void
  | boolean
  | {
      ok: boolean;
      category?: CloudSyncFailureState['category'];
      reason?: string;
      statusCode?: number;
    };

interface ChixusLoadingSplashProps {
  logoSrc: string;
  showRedirectStatus?: boolean;
  language?: string;
  onComplete: () => void;
  onSyncFailed?: (failure: CloudSyncFailureState) => void;
  onNetworkSync?: () => Promise<NetworkSyncResult>;
  minDurationMs?: number;
  maxDurationMs?: number;
}

export const ChixusLoadingSplash: React.FC<ChixusLoadingSplashProps> = ({
  logoSrc,
  showRedirectStatus = true,
  language = 'English',
  onComplete,
  onSyncFailed,
  onNetworkSync,
  minDurationMs = 2100,
  maxDurationMs = 5200,
}) => {
  const [progress, setProgress] = useState(0);
  const [syncPhaseLabel, setSyncPhaseLabel] = useState('Connecting');
  const [isReady, setIsReady] = useState(false);
  const [isFadingOut, setIsFadingOut] = useState(false);
  const [imgSrc, setImgSrc] = useState(logoSrc || '/asset/icon.jpg');
  const [tilt, setTilt] = useState<{ rx: number; ry: number }>({ rx: 0, ry: 0 });

  const onCompleteRef = useRef(onComplete);
  onCompleteRef.current = onComplete;

  const onSyncFailedRef = useRef(onSyncFailed);
  onSyncFailedRef.current = onSyncFailed;

  const onNetworkSyncRef = useRef(onNetworkSync);
  onNetworkSyncRef.current = onNetworkSync;

  useEffect(() => {
    setImgSrc(logoSrc || '/asset/icon.jpg');
  }, [logoSrc]);

  useEffect(() => {
    let cancelled = false;
    let rafId = 0;
    let settleTimer: ReturnType<typeof setTimeout> | null = null;
    let fadeTimer: ReturnType<typeof setTimeout> | null = null;
    let maxGuardTimer: ReturnType<typeof setTimeout> | null = null;

    const startTime = performance.now();
    let targetCeiling = 24;
    let displayProgress = 0;
    let syncFinished = false;
    let syncOutcome: CloudSyncFailureState | null = null;
    let finalized = false;

    const triggerSuccess = () => {
      if (cancelled || finalized) return;
      finalized = true;
      displayProgress = 100;
      setProgress(100);
      setSyncPhaseLabel('Ready');
      setIsReady(true);

      settleTimer = setTimeout(() => {
        if (cancelled) return;
        setIsFadingOut(true);
        fadeTimer = setTimeout(() => {
          if (!cancelled) {
            onCompleteRef.current();
          }
        }, 280);
      }, 320);
    };

    const triggerFailure = (failure: CloudSyncFailureState) => {
      if (cancelled || finalized) return;
      finalized = true;
      setSyncPhaseLabel('Disconnected');
      setIsFadingOut(true);
      fadeTimer = setTimeout(() => {
        if (!cancelled) {
          if (onSyncFailedRef.current) {
            onSyncFailedRef.current(failure);
          } else {
            onCompleteRef.current();
          }
        }
      }, 220);
    };

    const runCloudSyncCheck = async () => {
      try {
        if (typeof navigator !== 'undefined' && navigator.onLine === false) {
          syncOutcome = {
            category: 'no_internet',
            reason:
              'No active internet connection detected. Turn on Wi-Fi or mobile data so CHIXUS can sync with the cloud.',
          };
          syncFinished = true;
          return;
        }

        // Pass 1: Live connectivity & latency check
        if (!cancelled) {
          setSyncPhaseLabel('Syncing network');
          targetCeiling = 38;
        }
        const initialSnap = await Promise.race([
          sharedNetworkConnectivityMonitor.checkNow({ force: true }),
          new Promise<null>((resolve) => setTimeout(() => resolve(null), 2200)),
        ]).catch(() => null);

        if (typeof navigator !== 'undefined' && navigator.onLine === false) {
          syncOutcome = {
            category: 'no_internet',
            reason:
              'Your internet connection dropped while connecting. Please restore Wi-Fi or mobile data and retry.',
          };
          syncFinished = true;
          return;
        }

        // Pass 2: Cloud backend sync (health, feed, notifications, or backend fallback reason)
        if (!cancelled) {
          setSyncPhaseLabel('Syncing cloud');
          targetCeiling = 78;
        }

        if (onNetworkSyncRef.current) {
          const result = await Promise.race([
            onNetworkSyncRef.current(),
            new Promise<NetworkSyncResult>((resolve) =>
              setTimeout(
                () =>
                  resolve({
                    ok: false,
                    category: 'unreachable',
                    reason:
                      'Cloud synchronization timed out because the network is too slow or unreachable. Please check your connection and try again.',
                  }),
                3200
              )
            ),
          ]);

          if (result === false) {
            syncOutcome = {
              category: 'unreachable',
              reason: sanitizeCloudFallbackReason(undefined),
            };
            syncFinished = true;
            return;
          }

          if (result && typeof result === 'object' && result.ok === false) {
            syncOutcome = {
              category: result.category || 'server_reason',
              reason: sanitizeCloudFallbackReason(result.reason, result.statusCode),
              statusCode: result.statusCode,
            };
            syncFinished = true;
            return;
          }
        }

        // Pass 3: Confirm connectivity didn't report dead offline
        if (!cancelled) {
          setSyncPhaseLabel('Verifying node');
          targetCeiling = 96;
        }
        const finalSnap =
          initialSnap?.status === 'poor'
            ? await Promise.race([
                sharedNetworkConnectivityMonitor.checkNow({ force: true }),
                new Promise<null>((resolve) => setTimeout(() => resolve(null), 1500)),
              ]).catch(() => null)
            : initialSnap;

        if (
          finalSnap &&
          finalSnap.status === 'poor' &&
          typeof navigator !== 'undefined' &&
          navigator.onLine === false
        ) {
          syncOutcome = {
            category: 'no_internet',
            reason:
              'No active internet connection detected. CHIXUS requires a live cloud link rather than an offline session.',
          };
          syncFinished = true;
          return;
        }

        syncOutcome = null;
      } catch (err) {
        syncOutcome = {
          category:
            typeof navigator !== 'undefined' && navigator.onLine === false
              ? 'no_internet'
              : 'unreachable',
          reason:
            typeof navigator !== 'undefined' && navigator.onLine === false
              ? 'No active internet connection detected. Turn on Wi-Fi or mobile data to sync with CHIXUS Cloud.'
              : sanitizeCloudFallbackReason(err instanceof Error ? err.message : ''),
        };
      } finally {
        syncFinished = true;
        if (!syncOutcome) {
          targetCeiling = 100;
        }
      }
    };

    void runCloudSyncCheck();

    // Guaranteed timeout guard so slow connections fall back cleanly with a clear reason (never hangs forever)
    maxGuardTimer = setTimeout(() => {
      if (finalized || cancelled) return;
      if (syncFinished && !syncOutcome) {
        triggerSuccess();
      } else {
        triggerFailure(
          syncOutcome || {
            category:
              typeof navigator !== 'undefined' && navigator.onLine === false
                ? 'no_internet'
                : 'unreachable',
            reason:
              typeof navigator !== 'undefined' && navigator.onLine === false
                ? 'No internet connection detected. Please reconnect to enter CHIXUS.'
                : 'CHIXUS Cloud did not respond in time. Please check your internet connection or try again shortly.',
          }
        );
      }
    }, maxDurationMs);

    const tick = (now: number) => {
      if (cancelled || finalized) return;

      if (syncFinished && syncOutcome) {
        triggerFailure(syncOutcome);
        return;
      }

      const elapsed = now - startTime;
      const minTimeRatio = Math.min(1, elapsed / minDurationMs);

      const cap = syncFinished && !syncOutcome && minTimeRatio >= 1 ? 100 : Math.min(97, targetCeiling);
      const speed = syncFinished && !syncOutcome && minTimeRatio >= 1 ? 0.22 : 0.085;
      displayProgress = displayProgress + (cap - displayProgress) * speed;

      if (elapsed > 250 && displayProgress < Math.min(cap, minTimeRatio * 92)) {
        displayProgress = Math.min(cap, minTimeRatio * 92);
      }

      const rounded = Math.min(100, Math.max(0, Math.round(displayProgress)));
      setProgress((prev) => (rounded > prev ? rounded : prev));

      if (syncFinished && !syncOutcome && minTimeRatio >= 1 && rounded >= 99) {
        triggerSuccess();
        return;
      }

      rafId = requestAnimationFrame(tick);
    };

    rafId = requestAnimationFrame(tick);

    return () => {
      cancelled = true;
      cancelAnimationFrame(rafId);
      if (settleTimer) clearTimeout(settleTimer);
      if (fadeTimer) clearTimeout(fadeTimer);
      if (maxGuardTimer) clearTimeout(maxGuardTimer);
    };
  }, [minDurationMs, maxDurationMs]);

  const handlePointerMove = (e: React.PointerEvent<HTMLDivElement>) => {
    const rect = e.currentTarget.getBoundingClientRect();
    const nx = (e.clientX - rect.left) / rect.width - 0.5;
    const ny = (e.clientY - rect.top) / rect.height - 0.5;
    setTilt({
      rx: Number((-ny * 14).toFixed(2)),
      ry: Number((nx * 14).toFixed(2)),
    });
  };

  const handlePointerLeave = () => {
    setTilt({ rx: 0, ry: 0 });
  };

  return (
    <div
      id="chixus-loading-splash"
      role="status"
      aria-live="polite"
      className={`fixed inset-0 z-[999999] flex flex-col items-center justify-center overflow-hidden select-none transition-opacity duration-300 ${
        isFadingOut ? 'opacity-0 pointer-events-none' : 'opacity-100'
      }`}
      style={{ backgroundColor: '#121620' }}
    >
      {/* Mixed #2DD4BF + #3B82F6 Luminous Swirl Ambient Aura + Soft White Mist */}
      <div
        aria-hidden="true"
        className="pointer-events-none absolute inset-0 flex items-center justify-center"
      >
        <div
          className="chixus-splash-swirl absolute w-[420px] h-[420px] rounded-full blur-3xl"
          style={{
            background:
              'conic-gradient(from 0deg, rgba(45, 212, 191, 0.28) 0deg, rgba(255, 255, 255, 0.14) 70deg, rgba(59, 130, 246, 0.32) 165deg, rgba(45, 212, 191, 0.22) 255deg, rgba(255, 255, 255, 0.12) 320deg, rgba(45, 212, 191, 0.28) 360deg)',
          }}
        />
        <div
          className="chixus-splash-mist absolute w-[260px] h-[260px] rounded-full blur-2xl"
          style={{
            background:
              'radial-gradient(circle, rgba(255,255,255,0.22) 0%, rgba(45,212,191,0.18) 38%, rgba(59,130,246,0.16) 68%, transparent 100%)',
          }}
        />
      </div>

      {/* Entrance Spring + Magnetic 3D Pointer Tilt Container */}
      <div
        className="chixus-splash-entrance relative flex items-center justify-center w-[240px] h-[240px]"
        onPointerMove={handlePointerMove}
        onPointerLeave={handlePointerLeave}
      >
        <div
          className="relative flex items-center justify-center w-full h-full transition-transform duration-200 ease-out"
          style={{
            transform: `perspective(700px) rotateX(${tilt.rx}deg) rotateY(${tilt.ry}deg)`,
          }}
        >
          <div
            aria-hidden="true"
            className="chixus-acoustic-ripple-a pointer-events-none absolute w-[132px] h-[132px] rounded-full"
            style={{
              border: '1.5px solid rgba(45, 212, 191, 0.65)',
              boxShadow: '0 0 22px rgba(45, 212, 191, 0.28)',
            }}
          />
          <div
            aria-hidden="true"
            className="chixus-acoustic-ripple-b pointer-events-none absolute w-[132px] h-[132px] rounded-full"
            style={{
              border: '1.5px solid rgba(59, 130, 246, 0.6)',
              boxShadow: '0 0 24px rgba(59, 130, 246, 0.26)',
            }}
          />

          <div
            className={`chixus-cardiac-core relative z-10 w-[132px] h-[132px] rounded-full overflow-hidden ${
              isReady ? 'chixus-splash-logo-ready' : ''
            }`}
            style={{
              borderRadius: '9999px',
              backgroundColor: '#0b101b',
              boxShadow:
                '0 22px 48px rgba(0, 0, 0, 0.72), 0 0 32px rgba(45, 212, 191, 0.18), 0 0 42px rgba(59, 130, 246, 0.16), inset 0 0 0 1px rgba(255, 255, 255, 0.22)',
            }}
          >
            <img
              src={imgSrc}
              alt="CHIXUS"
              onError={() => {
                if (imgSrc !== '/asset/icon.jpg') setImgSrc('/asset/icon.jpg');
              }}
              className="w-full h-full object-cover rounded-full"
            />
            <div
              aria-hidden="true"
              className="pointer-events-none absolute inset-0 rounded-full"
              style={{
                boxShadow: 'inset 0 0 0 1px rgba(255, 255, 255, 0.24)',
              }}
            />
            <div className="chixus-splash-sheen pointer-events-none absolute inset-0" />
          </div>
        </div>
      </div>

      {/* Editorial Title, Empty Subtitle Slot, Status & Harmonic Breathing Dots */}
      <div className="relative z-10 mt-5 flex flex-col items-center text-center">
        <h1
          className="text-3xl sm:text-4xl font-semibold tracking-[0.26em] text-slate-100 pl-[0.26em]"
          style={{
            fontFamily: "'Space Grotesk', 'Chakra Petch', Georgia, serif",
            textShadow: '0 2px 18px rgba(45, 212, 191, 0.2)',
          }}
        >
          {'CHIXUS '}
        </h1>

        <p className="mt-1 min-h-[14px] text-xs text-slate-400 tracking-wide">{''}</p>

        <div aria-hidden="true" className="mt-3 flex items-center justify-center gap-2.5">
          <span
            className="chixus-harmonic-dot-1 h-2 w-2 rounded-full"
            style={{
              backgroundColor: '#2DD4BF',
              boxShadow: '0 0 10px rgba(45, 212, 191, 0.7)',
            }}
          />
          <span
            className="chixus-harmonic-dot-2 h-2 w-2 rounded-full"
            style={{
              backgroundColor: '#3B82F6',
              boxShadow: '0 0 10px rgba(59, 130, 246, 0.7)',
            }}
          />
          <span
            className="chixus-harmonic-dot-3 h-2 w-2 rounded-full"
            style={{
              backgroundColor: '#2DD4BF',
              boxShadow: '0 0 10px rgba(45, 212, 191, 0.7)',
            }}
          />
        </div>

        <div
          className="mt-4 w-[188px] h-1 rounded-full overflow-hidden border border-white/10"
          style={{ backgroundColor: 'rgba(15, 23, 42, 0.85)' }}
        >
          <div
            className="h-full rounded-full transition-[width] duration-150 ease-out"
            style={{
              width: `${progress}%`,
              background: 'linear-gradient(90deg, #2DD4BF 0%, #3B82F6 100%)',
            }}
          />
        </div>

        {showRedirectStatus && (
          <p className="mt-3 text-[11px] font-semibold uppercase tracking-[0.2em] text-slate-300">
            {isReady ? tr('Ready', language) : `${syncPhaseLabel} · ${progress}%`}
          </p>
        )}
      </div>
    </div>
  );
};
