import React, { useState } from 'react';
import { ShieldCheck, Cpu, ArrowLeft, CheckCircle2, AlertCircle, RefreshCw, Key } from 'lucide-react';
import type { Operator } from '../types';

interface EnrollmentViewProps {
  onCancel: () => void;
  onEnrolled: (operator: Operator) => void;
}

const SECTORS = [
  'SMT Optical Solder Inspection Bay',
  'Micro-BGA Solder Ball & Void Telemetry',
  'Fine-Pitch QFP Joint Diagnostics',
  'Surface Mount Discrete QA Enclave',
  'Power Electronics High-Current Verification'
];

export const EnrollmentView: React.FC<EnrollmentViewProps> = ({
  onCancel,
  onEnrolled,
}) => {
  const [nodeId, setNodeId] = useState(() => `OP-${Math.floor(1000 + Math.random() * 9000)}-ALPHA`);
  const [sector, setSector] = useState(SECTORS[0]);
  const [code, setCode] = useState('');
  const [confirmCode, setConfirmCode] = useState('');
  const [avatarSeed, setAvatarSeed] = useState('cyan');
  const [error, setError] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const generateRandomCallsign = () => {
    const prefixes = ['ALPHA', 'SIGMA', 'OMEGA', 'VECTOR', 'NEXUS', 'TITAN'];
    const prefix = prefixes[Math.floor(Math.random() * prefixes.length)];
    const num = Math.floor(1000 + Math.random() * 9000);
    setNodeId(`OP-${num}-${prefix}`);
  };

  const handleEnrollment = (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    if (!nodeId.trim()) {
      setError('Please provide a valid Node ID.');
      return;
    }

    if (code.length !== 4 || !/^\d{4}$/.test(code)) {
      setError('Your Sovereign Code must be exactly 4 digits (e.g. birth year: 1996, 2002).');
      return;
    }

    if (code !== confirmCode) {
      setError('The 4-digit Sovereign Codes do not match. Please re-enter carefully.');
      return;
    }

    setIsSubmitting(true);

    const newOperator: Operator = {
      nodeId: nodeId.trim().toUpperCase(),
      fourDigitCode: code,
      sector,
      avatarSeed,
      createdAt: new Date().toISOString(),
      verifiedCount: 0,
      chixusLawAccepted: true,
    };

    setTimeout(() => {
      setIsSubmitting(false);
      onEnrolled(newOperator);
    }, 400);
  };

  return (
    <div className="min-h-[calc(100vh-64px)] flex flex-col items-center justify-center p-4 sm:p-6 matrix-grid-bg">
      <div className="w-full max-w-2xl silver-gradient-surface rounded-2xl p-6 sm:p-8 relative">
        {/* Navigation Back */}
        <div className="flex items-center justify-between pb-5 border-b border-slate-700/60 mb-6">
          <button
            type="button"
            onClick={onCancel}
            className="inline-flex items-center gap-2 text-xs font-mono text-slate-400 hover:text-slate-200 transition-colors"
          >
            <ArrowLeft className="w-4 h-4" />
            <span>Return to Terminal</span>
          </button>

          <div className="flex items-center gap-2 px-3 py-1 rounded-full bg-slate-900 border border-slate-700 text-[11px] font-mono text-cyan-300">
            <ShieldCheck className="w-3.5 h-3.5 text-cyan-400" />
            <span>CHIXUS LAW ACKNOWLEDGED</span>
          </div>
        </div>

        {/* Header */}
        <div className="space-y-1 mb-6">
          <h1 className="text-2xl sm:text-3xl font-bold tracking-tight text-white font-['Chakra_Petch',sans-serif]">
            Node Enrollment
          </h1>
          <p className="text-xs sm:text-sm text-slate-300">
            Mint your sovereign operator identifier and lock your immutable 4-digit code.
          </p>
        </div>

        {/* Invariable 4-Digit Reminder Box */}
        <div className="mb-6 p-4 rounded-xl bg-amber-950/20 border border-amber-500/30 space-y-1.5">
          <div className="flex items-center gap-2 text-amber-300 text-xs font-mono font-semibold">
            <Key className="w-4 h-4 text-amber-400 shrink-0" />
            <span>IMMUTABLE 4-DIGIT CODE REQUIREMENT</span>
          </div>
          <p className="text-xs text-slate-300 leading-relaxed">
            Enter a <strong>four-digit code</strong> (such as your birth year or any unforgettable four-digit sequence). Under the Chixus Law, this code will never be replaced, reset, or altered once registered.
          </p>
        </div>

        {error && (
          <div className="mb-5 p-3.5 rounded-lg bg-red-950/40 border border-red-500/30 flex items-start gap-2.5 text-xs text-red-200">
            <AlertCircle className="w-4 h-4 text-red-400 mt-0.5 shrink-0" />
            <span>{error}</span>
          </div>
        )}

        <form onSubmit={handleEnrollment} className="space-y-5">
          {/* Node Callsign Identifier */}
          <div>
            <div className="flex items-center justify-between mb-1.5">
              <label className="text-xs font-mono text-slate-300">
                Operator Node Identifier (Callsign)
              </label>
              <button
                type="button"
                onClick={generateRandomCallsign}
                className="text-[11px] font-mono text-cyan-400 hover:text-cyan-300 inline-flex items-center gap-1 transition-colors"
              >
                <RefreshCw className="w-3 h-3" />
                <span>Generate ID</span>
              </button>
            </div>
            <input
              type="text"
              value={nodeId}
              onChange={(e) => setNodeId(e.target.value.toUpperCase())}
              placeholder="e.g. OP-8821-SIGMA"
              className="w-full px-3.5 py-2.5 rounded-lg bg-slate-950/90 border border-slate-700/80 text-sm text-slate-100 placeholder-slate-500 focus:outline-none focus:border-cyan-400 focus:ring-1 focus:ring-cyan-400 font-mono transition-colors"
            />
          </div>

          {/* Sector Selection */}
          <div>
            <label className="block text-xs font-mono text-slate-300 mb-1.5">
              Assigned Solder Inspection Sector
            </label>
            <select
              value={sector}
              onChange={(e) => setSector(e.target.value)}
              className="w-full px-3.5 py-2.5 rounded-lg bg-slate-950/90 border border-slate-700/80 text-sm text-slate-100 focus:outline-none focus:border-cyan-400 focus:ring-1 focus:ring-cyan-400 font-sans transition-colors cursor-pointer"
            >
              {SECTORS.map((s) => (
                <option key={s} value={s} className="bg-slate-900 text-slate-200">
                  {s}
                </option>
              ))}
            </select>
          </div>

          {/* 4-Digit Sovereign Code & Confirmation */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-mono text-slate-300 mb-1.5">
                4-Digit Sovereign Code
              </label>
              <input
                type="password"
                inputMode="numeric"
                maxLength={4}
                value={code}
                onChange={(e) => setCode(e.target.value.replace(/\D/g, '').slice(0, 4))}
                placeholder="e.g. 1998"
                className="w-full px-3.5 py-2.5 rounded-lg bg-slate-950/90 border border-slate-700/80 text-sm text-slate-100 placeholder-slate-600 focus:outline-none focus:border-amber-400 focus:ring-1 focus:ring-amber-400 font-mono tracking-widest text-center transition-colors"
              />
              <span className="text-[10px] text-slate-400 font-mono block mt-1">
                4 numeric digits (e.g. birth year)
              </span>
            </div>

            <div>
              <label className="block text-xs font-mono text-slate-300 mb-1.5">
                Confirm 4-Digit Code
              </label>
              <input
                type="password"
                inputMode="numeric"
                maxLength={4}
                value={confirmCode}
                onChange={(e) => setConfirmCode(e.target.value.replace(/\D/g, '').slice(0, 4))}
                placeholder="Re-enter 4 digits"
                className="w-full px-3.5 py-2.5 rounded-lg bg-slate-950/90 border border-slate-700/80 text-sm text-slate-100 placeholder-slate-600 focus:outline-none focus:border-amber-400 focus:ring-1 focus:ring-amber-400 font-mono tracking-widest text-center transition-colors"
              />
              <span className="text-[10px] text-slate-400 font-mono block mt-1">
                Must match exactly
              </span>
            </div>
          </div>

          {/* Avatar / Node Core Color */}
          <div>
            <label className="block text-xs font-mono text-slate-300 mb-2">
              Node Telemetry Core Color
            </label>
            <div className="flex items-center gap-3">
              {[
                { id: 'cyan', label: 'Cyan Core', bg: 'bg-cyan-500' },
                { id: 'silver', label: 'Silver Chrome', bg: 'bg-slate-300' },
                { id: 'emerald', label: 'Emerald Lead', bg: 'bg-emerald-500' },
                { id: 'amber', label: 'Amber Optic', bg: 'bg-amber-500' },
              ].map((opt) => (
                <button
                  key={opt.id}
                  type="button"
                  onClick={() => setAvatarSeed(opt.id)}
                  className={`flex items-center gap-2 px-3 py-1.5 rounded-lg border text-xs font-mono transition-all ${
                    avatarSeed === opt.id
                      ? 'border-white bg-slate-800 text-white shadow-sm'
                      : 'border-slate-800 bg-slate-950/60 text-slate-400 hover:text-slate-300'
                  }`}
                >
                  <span className={`w-2.5 h-2.5 rounded-full ${opt.bg}`} />
                  <span>{opt.label}</span>
                </button>
              ))}
            </div>
          </div>

          {/* Submit Action */}
          <div className="pt-4 border-t border-slate-800">
            <button
              type="submit"
              disabled={isSubmitting}
              className="w-full silver-metallic-button py-3 px-6 rounded-lg text-xs font-semibold uppercase tracking-wider flex items-center justify-center gap-2 cursor-pointer"
            >
              <Cpu className="w-4 h-4" />
              <span>{isSubmitting ? 'Minting Node...' : 'Mint Sovereign Node & Enter Matrix'}</span>
            </button>
            <p className="text-[11px] text-slate-400 text-center font-mono mt-2">
              By minting this node, you seal your 4-digit code under the Chixus Law.
            </p>
          </div>
        </form>
      </div>
    </div>
  );
};
