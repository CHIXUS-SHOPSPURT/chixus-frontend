import React, { useEffect, useState } from 'react';
import { tr } from '../i18n/translations';

interface ChixusLoadingSplashProps {
  logoSrc: string;
  showRedirectStatus?: boolean;
  language?: string;
  onComplete: () => void;
  durationMs?: number;
}

export const ChixusLoadingSplash: React.FC<ChixusLoadingSplashProps> = ({
  logoSrc,
  showRedirectStatus = true,
  language = 'English',
  onComplete,
  durationMs = 2400,
}) => {
  const [progress, setProgress] = useState(0);
  const [imgSrc, setImgSrc] = useState(logoSrc || '/asset/icon.jpg');

  useEffect(() => {
    setImgSrc(logoSrc || '/asset/icon.jpg');
  }, [logoSrc]);

  useEffect(() => {
    const start = performance.now();
    let rafId = 0;
    let doneTimer: ReturnType<typeof setTimeout> | null = null;
    let completed = false;

    const finish = () => {
      if (completed) return;
      completed = true;
      onComplete();
    };

    const tick = (now: number) => {
      const elapsed = now - start;
      const ratio = Math.min(1, elapsed / durationMs);
      // Smooth ease-out curve up to 100%
      const eased = 1 - Math.pow(1 - ratio, 2.2);
      const pct = Math.round(eased * 100);
      setProgress(pct);

      if (ratio < 1) {
        rafId = requestAnimationFrame(tick);
      } else {
        setProgress(100);
        doneTimer = setTimeout(finish, 340);
      }
    };

    rafId = requestAnimationFrame(tick);
    return () => {
      cancelAnimationFrame(rafId);
      if (doneTimer) clearTimeout(doneTimer);
    };
  }, [durationMs, onComplete]);

  const isReady = progress >= 100;

  return (
    <div
      id="chixus-loading-splash"
      role="status"
      aria-live="polite"
      className="fixed inset-0 z-[180] flex flex-col items-center justify-center overflow-hidden select-none"
      style={{ backgroundColor: '#121620' }}
    >
      {/* Inline SVG Gooey Filter */}
      <svg className="absolute w-0 h-0 pointer-events-none" aria-hidden="true">
        <defs>
          <filter id="chixus-goo-filter">
            <feGaussianBlur in="SourceGraphic" stdDeviation="7.5" result="blur" />
            <feColorMatrix
              in="blur"
              mode="matrix"
              values="1 0 0 0 0  0 1 0 0 0  0 0 1 0 0  0 0 0 24 -10"
              result="goo"
            />
            <feComposite in="SourceGraphic" in2="goo" operator="atop" />
          </filter>
        </defs>
      </svg>

      {/* Breathing Atmospheric Aura */}
      <div
        className="chixus-splash-aura pointer-events-none absolute w-[320px] h-[320px] rounded-full blur-3xl"
        style={{ backgroundColor: 'rgba(8, 16, 24, 0.42)' }}
      />

      {/* Liquid Goo Container + Orbiting Droplets + Circular Logo */}
      <div className="relative flex items-center justify-center w-[210px] h-[210px]">
        {/* Gooey Layer */}
        <div
          className="chixus-goo-stage absolute inset-0 flex items-center justify-center"
          style={{ filter: 'url(#chixus-goo-filter)' }}
        >
          {/* Central Liquid Droplet */}
          <div
            className="w-[138px] h-[138px] rounded-full"
            style={{ backgroundColor: '#081018' }}
          />
          {/* 4 Orbiting Blobs */}
          <div
            className="chixus-goo-orbit chixus-goo-orbit-1 absolute w-8 h-8 rounded-full"
            style={{ backgroundColor: '#081018' }}
          />
          <div
            className="chixus-goo-orbit chixus-goo-orbit-2 absolute w-7 h-7 rounded-full"
            style={{ backgroundColor: '#132c48' }}
          />
          <div
            className="chixus-goo-orbit chixus-goo-orbit-3 absolute w-6 h-6 rounded-full"
            style={{ backgroundColor: '#081018' }}
          />
          <div
            className="chixus-goo-orbit chixus-goo-orbit-4 absolute w-7 h-7 rounded-full"
            style={{ backgroundColor: '#132c48' }}
          />
        </div>

        {/* Circular 132px Logo Stage */}
        <div
          className={`chixus-splash-logo-stage relative z-10 w-[132px] h-[132px] rounded-full overflow-hidden shadow-[0_18px_40px_rgba(0,0,0,0.65)] ${
            isReady ? 'chixus-splash-logo-ready' : ''
          }`}
          style={{
            border: '1px solid rgba(255, 255, 255, 0.16)',
            backgroundColor: '#081018',
          }}
        >
          <img
            src={imgSrc}
            alt="CHIXUS"
            onError={() => {
              if (imgSrc !== '/asset/icon.jpg') setImgSrc('/asset/icon.jpg');
            }}
            className="w-full h-full object-cover"
          />
          {/* Diagonal Sheen Sweep */}
          <div className="chixus-splash-sheen pointer-events-none absolute inset-0" />
        </div>
      </div>

      {/* Wordmark */}
      <div className="mt-7 flex flex-col items-center">
        <h1
          className="text-2xl sm:text-3xl font-black tracking-[0.28em] text-slate-100 pl-[0.28em]"
          style={{ fontFamily: "'Chakra Petch', 'Inter', sans-serif" }}
        >
          CHIXUS{' '}
        </h1>

        {/* 192px Progress Track */}
        <div
          className="mt-5 w-[192px] h-1.5 rounded-full overflow-hidden border border-white/10"
          style={{ backgroundColor: '#081018' }}
        >
          <div
            className="h-full rounded-full transition-[width] duration-100 ease-out"
            style={{
              width: `${progress}%`,
              background: 'linear-gradient(90deg, #132c48 0%, #3b82f6 65%, #93c5fd 100%)',
            }}
          />
        </div>

        {showRedirectStatus && (
          <p className="mt-3 text-[11px] font-bold uppercase tracking-[0.18em] text-slate-400">
            {isReady
              ? tr('Ready', language)
              : `${tr('Redirect to homepage', language)} · ${progress}%`}
          </p>
        )}
      </div>
    </div>
  );
};
