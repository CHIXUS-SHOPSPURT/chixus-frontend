import React from 'react';
import heroPcbImg from '../assets/images/chixus_hero_pcb_clean_1794819731664.jpg';

interface OfficialWelcomeBannerProps {
  onClick?: () => void;
}

export const OfficialWelcomeBanner: React.FC<OfficialWelcomeBannerProps> = ({ onClick }) => {
  return (
    <div
      onClick={onClick}
      className="relative w-full overflow-hidden rounded-xl border border-slate-700/70 bg-[#070b12] cursor-pointer group"
    >
      <div className="relative h-32 sm:h-40 w-full overflow-hidden">
        <img
          src={heroPcbImg}
          alt="CHIXUS Diagnostic Telemetry"
          className="h-full w-full object-cover object-center opacity-55 transition-transform duration-500 group-hover:scale-[1.03]"
        />
        <div
          aria-hidden="true"
          className="absolute inset-0"
          style={{
            background:
              'linear-gradient(90deg, rgba(7, 11, 18, 0.92) 0%, rgba(13, 19, 31, 0.62) 48%, rgba(7, 11, 18, 0.92) 100%)',
          }}
        />
        {/* Subtle cyber grid overlay */}
        <div
          aria-hidden="true"
          className="pointer-events-none absolute inset-0 opacity-35"
          style={{
            backgroundImage:
              'radial-gradient(circle at 24% 50%, rgba(56, 189, 248, 0.25) 0%, transparent 45%)',
          }}
        />
        <div className="absolute inset-0 flex items-center justify-between px-4 sm:px-6">
          <div className="hidden sm:flex items-center gap-2 rounded-lg border border-cyan-400/30 bg-[#070b12]/80 px-2.5 py-1.5 backdrop-blur-sm">
            <span className="h-2 w-2 rounded-full bg-cyan-400 animate-pulse" />
            <span className="font-mono text-[10px] font-semibold tracking-wider text-cyan-300 uppercase">
              Diagnostics Online
            </span>
          </div>
          <div className="ml-auto text-right">
            <p
              className="text-base sm:text-xl font-bold tracking-tight text-white drop-shadow-[0_2px_10px_rgba(0,0,0,0.9)]"
              style={{ fontFamily: "'Space Grotesk', sans-serif" }}
            >
              Inspect. Diagnose.{' '}
              <span className="text-sky-400">Innovate.</span>
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default OfficialWelcomeBanner;
