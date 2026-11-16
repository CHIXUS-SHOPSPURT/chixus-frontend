import React, { useState } from 'react';
import { ChevronRight } from 'lucide-react';
import heroPcbImage from '../assets/images/chixus_hero_pcb_clean_1794819731664.jpg';

interface OnboardingWelcomeScreenProps {
  onGetStarted: () => void;
  onSignIn: () => void;
  logoSrc: string;
}

export const OnboardingWelcomeScreen: React.FC<OnboardingWelcomeScreenProps> = ({
  onGetStarted,
  onSignIn,
  logoSrc,
}) => {
  const [imageFailed, setImageFailed] = useState(false);

  return (
    <div
      id="chixus-onboarding-welcome"
      className="fixed inset-0 z-[99999] flex flex-col overflow-y-auto bg-[#080a0f] text-slate-100 selection:bg-slate-300/20 selection:text-white"
      style={{ fontFamily: "'Plus Jakarta Sans', -apple-system, BlinkMacSystemFont, sans-serif" }}
    >
      {/* Subtle dark industrial charcoal ambient lighting (zero dominant green / neon clutter) */}
      <div
        aria-hidden="true"
        className="pointer-events-none fixed inset-0"
        style={{
          background: `
            radial-gradient(65% 50% at 72% 38%, rgba(226, 232, 240, 0.055) 0%, transparent 72%),
            radial-gradient(50% 45% at 18% 82%, rgba(148, 163, 184, 0.04) 0%, transparent 70%),
            linear-gradient(180deg, #07090d 0%, #0b0e15 55%, #07090e 100%)
          `,
        }}
      />

      {/* Minimal Top Brand Header */}
      <header className="relative z-10 mx-auto flex w-full max-w-7xl items-center justify-between px-5 pt-5 pb-2 sm:px-8 sm:pt-7">
        <div className="flex items-center gap-3">
          <div className="flex h-9 w-9 items-center justify-center overflow-hidden rounded-lg border border-slate-300/25 bg-[#11151d] shadow-[inset_0_1px_0_rgba(255,255,255,0.16)]">
            <img
              src={logoSrc}
              alt="CHIXUS"
              className="h-full w-full object-cover"
              referrerPolicy="no-referrer"
            />
          </div>
          <span
            className="text-base font-bold tracking-[0.22em] text-slate-100 sm:text-lg"
            style={{ fontFamily: "'Chakra Petch', sans-serif" }}
          >
            CHIXUS
          </span>
        </div>
      </header>

      {/* Main Responsive Welcome Stage */}
      <main className="relative z-10 mx-auto flex w-full max-w-7xl flex-1 flex-col justify-center px-5 pt-3 pb-7 sm:px-8 sm:pt-6 sm:pb-10">
        <div className="grid w-full grid-cols-1 items-center gap-6 sm:gap-8 lg:grid-cols-12 lg:gap-12">
          {/* Hero Visual: 3D-Perspective Animated Circuit Board */}
          <div className="order-1 lg:order-2 lg:col-span-7">
            <div className="relative overflow-hidden rounded-2xl border border-slate-300/15 bg-[#0c0f16] shadow-[0_30px_90px_-24px_rgba(0,0,0,0.95),inset_0_1px_0_rgba(255,255,255,0.14)] sm:rounded-3xl">
              {/* Machined silver top bevel highlight */}
              <div
                aria-hidden="true"
                className="pointer-events-none absolute inset-x-0 top-0 z-30 h-px bg-gradient-to-r from-transparent via-slate-200/35 to-transparent"
              />

              {/* Perspective & Depth Aspect Container */}
              <div className="relative aspect-[16/10] w-full overflow-hidden bg-[#0a0d13] sm:aspect-[16/9]">
                <div className="chixus-pcb-stage relative h-full w-full">
                  {/* High-Quality Static Circuit-Board Vector Fallback Layer */}
                  <svg
                    aria-hidden="true"
                    viewBox="0 0 1600 900"
                    preserveAspectRatio="xMidYMid slice"
                    className="absolute inset-0 h-full w-full"
                  >
                    <defs>
                      <linearGradient id="pcbFallbackSubstrate" x1="0%" y1="0%" x2="100%" y2="100%">
                        <stop offset="0%" stopColor="#141821" />
                        <stop offset="50%" stopColor="#0e1118" />
                        <stop offset="100%" stopColor="#090b10" />
                      </linearGradient>
                      <linearGradient id="pcbFallbackSilicon" x1="0%" y1="0%" x2="100%" y2="100%">
                        <stop offset="0%" stopColor="#262b36" />
                        <stop offset="100%" stopColor="#14171f" />
                      </linearGradient>
                    </defs>
                    <rect width="1600" height="900" fill="url(#pcbFallbackSubstrate)" />
                    <g stroke="rgba(148, 163, 184, 0.22)" strokeWidth="2.5" fill="none">
                      <path d="M 160 220 L 420 365 L 555 415" />
                      <path d="M 225 505 L 385 590 L 535 510 L 650 560" />
                      <path d="M 780 570 L 725 620 L 825 685 L 1015 805" />
                      <path d="M 850 550 L 920 595 L 918 632 L 1165 795" />
                      <path d="M 935 500 L 1005 545 L 1055 535 L 1320 705" />
                      <path d="M 950 325 L 1065 260 L 1220 175" />
                    </g>
                    <polygon
                      points="780,275 1065,390 820,555 535,435"
                      fill="url(#pcbFallbackSilicon)"
                      stroke="rgba(203, 213, 225, 0.35)"
                      strokeWidth="2"
                    />
                  </svg>

                  {/* Macro Dark Graphite & Brushed Silver Hardware PCB Photograph */}
                  {!imageFailed && (
                    <img
                      src={heroPcbImage}
                      alt="Precision dark metallic printed circuit board under technical inspection"
                      onError={() => setImageFailed(true)}
                      className="relative z-10 h-full w-full object-cover object-center contrast-[1.03] brightness-[0.95]"
                      draggable={false}
                    />
                  )}

                  {/* Precision-Aligned Conductive Trace Illumination, Signal Pulses & Detection Reticles */}
                  <svg
                    aria-hidden="true"
                    viewBox="0 0 1600 900"
                    preserveAspectRatio="xMidYMid slice"
                    className="pointer-events-none absolute inset-0 z-20 h-full w-full"
                  >
                    <defs>
                      <filter id="coolWhiteBloom" x="-20%" y="-20%" width="140%" height="140%">
                        <feGaussianBlur stdDeviation="3.2" result="blur" />
                        <feMerge>
                          <feMergeNode in="blur" />
                          <feMergeNode in="SourceGraphic" />
                        </feMerge>
                      </filter>
                      <linearGradient id="traceCoolSilver" x1="0%" y1="0%" x2="100%" y2="100%">
                        <stop offset="0%" stopColor="rgba(226, 232, 240, 0.25)" />
                        <stop offset="50%" stopColor="rgba(248, 250, 252, 0.92)" />
                        <stop offset="100%" stopColor="rgba(203, 213, 225, 0.3)" />
                      </linearGradient>
                    </defs>

                    <g
                      className="chixus-trace-zone-1"
                      fill="none"
                      stroke="url(#traceCoolSilver)"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      filter="url(#coolWhiteBloom)"
                    >
                      <path d="M 155 215 L 415 358 L 548 418" strokeWidth="2.4" />
                      <path d="M 295 420 L 420 486 L 568 442" strokeWidth="2.6" />
                      <path d="M 225 508 L 372 592 L 538 512 L 642 562" strokeWidth="2.4" />
                    </g>

                    <g
                      className="chixus-trace-zone-2"
                      fill="none"
                      stroke="url(#traceCoolSilver)"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      filter="url(#coolWhiteBloom)"
                    >
                      <path d="M 548 442 L 818 568 L 1058 402" strokeWidth="2.8" />
                      <path d="M 780 575 L 725 625 L 822 686 L 1018 808" strokeWidth="2.6" />
                      <path d="M 848 556 L 912 600 L 912 632 L 1172 798" strokeWidth="2.6" />
                    </g>

                    <g
                      className="chixus-trace-zone-3"
                      fill="none"
                      stroke="url(#traceCoolSilver)"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      filter="url(#coolWhiteBloom)"
                    >
                      <path d="M 942 325 L 1058 260 L 1205 178" strokeWidth="2.4" />
                      <path d="M 928 506 L 992 548 L 1046 538 L 1335 718" strokeWidth="2.6" />
                      <path d="M 1032 454 L 1140 520 L 1245 480" strokeWidth="2.2" />
                    </g>

                    <g
                      fill="none"
                      stroke="#f8fafc"
                      strokeWidth="3.2"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      filter="url(#coolWhiteBloom)"
                    >
                      <path
                        className="chixus-signal-pulse"
                        d="M 225 508 L 372 592 L 538 512 L 642 562"
                      />
                      <path
                        className="chixus-signal-pulse"
                        d="M 780 575 L 725 625 L 822 686 L 1018 808"
                      />
                      <path
                        className="chixus-signal-pulse-delayed"
                        d="M 848 556 L 912 600 L 912 632 L 1172 798"
                      />
                      <path
                        className="chixus-signal-pulse-delayed"
                        d="M 928 506 L 992 548 L 1046 538 L 1335 718"
                      />
                    </g>

                    <g className="chixus-reticle-a" stroke="#f1f5f9" strokeWidth="2" fill="none">
                      <path d="M 272 414 L 272 398 L 288 398" />
                      <path d="M 314 398 L 330 398 L 330 414" />
                      <path d="M 330 436 L 330 452 L 314 452" />
                      <path d="M 288 452 L 272 452 L 272 436" />
                      <circle cx="301" cy="425" r="3.5" fill="#f8fafc" stroke="none" />
                    </g>

                    <g className="chixus-reticle-b" stroke="#f8fafc" strokeWidth="2" fill="none">
                      <path d="M 786 544 L 786 526 L 804 526" />
                      <path d="M 836 526 L 854 526 L 854 544" />
                      <path d="M 854 576 L 854 594 L 836 594" />
                      <path d="M 804 594 L 786 594 L 786 576" />
                      <circle cx="820" cy="560" r="4" fill="#ffffff" stroke="none" />
                    </g>

                    <g className="chixus-reticle-c" stroke="#f1f5f9" strokeWidth="2" fill="none">
                      <path d="M 1054 454 L 1054 438 L 1070 438" />
                      <path d="M 1098 438 L 1114 438 L 1114 454" />
                      <path d="M 1114 480 L 1114 496 L 1098 496" />
                      <path d="M 1070 496 L 1054 496 L 1054 480" />
                      <circle cx="1084" cy="467" r="3.5" fill="#f8fafc" stroke="none" />
                    </g>
                  </svg>

                  {/* Thin Silver / Cool-White Optical Scanning Beam */}
                  <div
                    aria-hidden="true"
                    className="chixus-pcb-scan-beam pointer-events-none absolute -top-[8%] left-0 z-30 h-[116%] w-[20%]"
                    style={{
                      background:
                        'linear-gradient(90deg, rgba(248, 250, 252, 0) 0%, rgba(226, 232, 240, 0.06) 64%, rgba(241, 245, 249, 0.24) 94%, rgba(255, 255, 255, 0.78) 99%, rgba(255, 255, 255, 0) 100%)',
                    }}
                  >
                    <div
                      className="absolute inset-y-0 right-0 w-[2px]"
                      style={{
                        background:
                          'linear-gradient(180deg, transparent 4%, rgba(248, 250, 252, 0.92) 25%, #ffffff 50%, rgba(248, 250, 252, 0.92) 75%, transparent 96%)',
                        boxShadow: '0 0 18px 2px rgba(248, 250, 252, 0.45)',
                      }}
                    />
                  </div>
                </div>

                {/* Subtle Studio Vignette Framing */}
                <div
                  aria-hidden="true"
                  className="pointer-events-none absolute inset-0 z-30"
                  style={{
                    background:
                      'radial-gradient(100% 95% at 50% 50%, transparent 56%, rgba(8, 10, 15, 0.78) 100%)',
                  }}
                />
              </div>
            </div>
          </div>

          {/* Welcome Headline, Value Proposition & Actions */}
          <div className="order-2 flex flex-col items-start text-left lg:order-1 lg:col-span-5">
            <p className="mb-3 text-[11px] font-semibold tracking-[0.22em] text-slate-400 uppercase">
              Technical Inspection System
            </p>

            <h1
              className="font-bold tracking-[-0.025em] text-slate-50"
              style={{
                fontSize: 'clamp(2.05rem, 3.8vw, 3.35rem)',
                lineHeight: 1.08,
              }}
            >
              Understand.
              <br />
              Diagnose. Resolve.
            </h1>

            <p className="mt-4 max-w-[44ch] text-[15px] leading-[1.6] text-slate-400 sm:mt-5 sm:text-base">
              AI-powered technical inspection that helps you understand equipment issues and navigate diagnostic processes.
            </p>

            {/* Primary & Secondary Actions */}
            <div className="mt-7 flex w-full flex-col gap-3 sm:mt-8 sm:w-auto sm:flex-row sm:items-center">
              <button
                type="button"
                id="onboarding-get-started-btn"
                onClick={onGetStarted}
                className="silver-metallic-button flex min-h-[48px] w-full cursor-pointer items-center justify-center gap-2 rounded-xl px-7 text-sm font-bold tracking-wide text-[#080a0f] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-slate-200 sm:w-auto"
              >
                <span>Get Started</span>
                <ChevronRight className="h-4 w-4 text-[#080a0f]" />
              </button>

              <button
                type="button"
                id="onboarding-sign-in-btn"
                onClick={onSignIn}
                className="flex min-h-[48px] w-full cursor-pointer items-center justify-center rounded-xl border border-slate-300/20 bg-[#12161f] px-7 text-sm font-semibold tracking-wide text-slate-200 transition-colors hover:border-slate-300/40 hover:bg-[#171c27] hover:text-white focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-slate-300 sm:w-auto"
              >
                <span>Sign In</span>
              </button>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
};
