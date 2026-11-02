import React, { useState } from 'react';
import { ShieldCheck, Key, CheckCircle, Cpu, Award, Lock, Hash, Clock, FileText } from 'lucide-react';
import type { Operator, InspectionResult } from '../types';

interface OperatorProfileViewProps {
  operator: Operator;
  inspectionHistory: InspectionResult[];
  onDisconnect: () => void;
}

export const OperatorProfileView: React.FC<OperatorProfileViewProps> = ({
  operator,
  inspectionHistory,
  onDisconnect,
}) => {
  const [testPin, setTestPin] = useState('');
  const [pinVerificationStatus, setPinVerificationStatus] = useState<'idle' | 'success' | 'fail'>('idle');

  const handleVerifyPin = (e: React.FormEvent) => {
    e.preventDefault();
    if (testPin === operator.fourDigitCode) {
      setPinVerificationStatus('success');
    } else {
      setPinVerificationStatus('fail');
    }
  };

  return (
    <div className="space-y-6 max-w-4xl mx-auto">
      {/* Header Profile Card */}
      <div className="tactical-surface tactical-beveled-frame rounded-2xl p-6 sm:p-8 relative">
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-6 pb-6 border-b border-slate-700/60">
          <div className="flex items-center gap-4">
            <div className="tactical-avatar-bezel w-16 h-16 rounded-full flex items-center justify-center text-cyan-400">
              <Cpu className="w-8 h-8" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h1 className="text-xl sm:text-2xl font-bold text-white font-['Chakra_Petch',sans-serif]">
                  {operator.nodeId}
                </h1>
                <span className="tactical-capsule-badge text-[10px] font-mono px-2 py-0.5">
                  MINTED NODE
                </span>
              </div>
              <p className="text-xs text-slate-300 font-mono mt-0.5">{operator.sector}</p>
              <p className="text-[11px] font-mono text-slate-400 mt-1 flex items-center gap-1.5">
                <Clock className="w-3 h-3" />
                <span>Enrolled on {new Date(operator.createdAt).toLocaleDateString()}</span>
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={onDisconnect}
            className="tactical-action-btn px-4 py-2 rounded-lg text-xs font-mono text-slate-300 hover:text-white transition-colors cursor-pointer"
          >
            Disconnect Node
          </button>
        </div>

        {/* Chixus Law Adherence Status */}
        <div className="mt-6 p-4 rounded-xl bg-emerald-950/20 border border-emerald-500/30 flex items-start gap-3">
          <ShieldCheck className="w-5 h-5 text-emerald-400 shrink-0 mt-0.5" />
          <div className="space-y-1">
            <div className="flex items-center gap-2 text-xs font-mono font-semibold text-emerald-300">
              <span>CHIXUS LAW STATUS: VERIFIED & COMPLIANT</span>
            </div>
            <p className="text-xs text-slate-300 leading-relaxed">
              This node has executed the solemn covenant of the Chixus Law. Operator holds absolute custody of their non-replaceable 4-digit code. Zero centralized resets can ever be executed against this node.
            </p>
          </div>
        </div>

        {/* Stats Grid */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3.5 mt-6">
          <div className="p-3.5 rounded-xl bg-slate-900/60 border border-slate-800">
            <span className="text-[11px] font-mono text-slate-400 block">Inspections</span>
            <span className="text-xl font-bold text-white font-mono mt-1 block">
              {operator.verifiedCount + inspectionHistory.length}
            </span>
          </div>

          <div className="p-3.5 rounded-xl bg-slate-900/60 border border-slate-800">
            <span className="text-[11px] font-mono text-slate-400 block">IPC Grade</span>
            <span className="text-xl font-bold text-cyan-400 font-mono mt-1 block">
              Class 3
            </span>
          </div>

          <div className="p-3.5 rounded-xl bg-slate-900/60 border border-slate-800">
            <span className="text-[11px] font-mono text-slate-400 block">Key Custody</span>
            <span className="text-xl font-bold text-emerald-400 font-mono mt-1 block">
              Sovereign
            </span>
          </div>

          <div className="p-3.5 rounded-xl bg-slate-900/60 border border-slate-800">
            <span className="text-[11px] font-mono text-slate-400 block">Reset Ability</span>
            <span className="text-xl font-bold text-slate-400 font-mono mt-1 block">
              Zero (None)
            </span>
          </div>
        </div>
      </div>

      {/* Sovereign 4-Digit Key Non-Custodial Verification Widget */}
      <div className="tactical-surface tactical-beveled-frame rounded-2xl p-6 space-y-4">
        <div className="flex items-center justify-between border-b border-slate-700/60 pb-3">
          <div className="flex items-center gap-2">
            <Lock className="w-4 h-4 text-amber-400" />
            <h2 className="text-sm font-semibold text-white font-mono">
              Sovereign 4-Digit Code Security Seal
            </h2>
          </div>
          <span className="tactical-capsule-badge text-[10px] font-mono px-2 py-0.5">
            IMMUTABLE
          </span>
        </div>

        <p className="text-xs text-slate-300 font-mono leading-relaxed">
          In accordance with the Chixus Law, your 4-digit code (such as your birth year) is cryptographically locked to your node. Test your memory below to verify your sovereign authorization PIN.
        </p>

        <form onSubmit={handleVerifyPin} className="flex flex-col sm:flex-row items-center gap-3">
          <input
            type="password"
            maxLength={4}
            value={testPin}
            onChange={(e) => {
              setTestPin(e.target.value.replace(/\D/g, '').slice(0, 4));
              setPinVerificationStatus('idle');
            }}
            placeholder="Verify 4-digit PIN"
            className="tactical-inset-input w-full sm:w-48 px-3.5 py-2 rounded-lg text-sm text-slate-100 placeholder-slate-600 font-mono text-center tracking-widest"
          />
          <button
            type="submit"
            className="w-full sm:w-auto tactical-brushed-silver-btn px-4 py-2 rounded-lg text-xs font-bold uppercase tracking-wider cursor-pointer"
          >
            Verify Key Memory
          </button>
        </form>

        {pinVerificationStatus === 'success' && (
          <div className="p-3 rounded-lg bg-emerald-950/40 border border-emerald-500/40 flex items-center gap-2 text-xs font-mono text-emerald-300">
            <CheckCircle className="w-4 h-4 text-emerald-400 shrink-0" />
            <span>AUTHORIZATION CONFIRMED: Sovereign memory intact. Your 4-digit key matches perfectly.</span>
          </div>
        )}

        {pinVerificationStatus === 'fail' && (
          <div className="p-3 rounded-lg bg-red-950/40 border border-red-500/40 flex items-center gap-2 text-xs font-mono text-red-300">
            <Lock className="w-4 h-4 text-red-400 shrink-0" />
            <span>MISMATCH: The entered code does not match. Remember the Chixus Law: credentials cannot be replaced!</span>
          </div>
        )}
      </div>

      {/* Recent Inspections Ledger */}
      <div className="tactical-surface tactical-beveled-frame rounded-2xl p-6 space-y-4">
        <div className="flex items-center justify-between border-b border-slate-700/60 pb-3">
          <div className="flex items-center gap-2">
            <FileText className="w-4 h-4 text-cyan-400" />
            <h2 className="text-sm font-semibold text-white font-mono">
              Attributed Inspection Ledger
            </h2>
          </div>
          <span className="text-[11px] font-mono text-slate-400">
            {inspectionHistory.length} recorded this session
          </span>
        </div>

        {inspectionHistory.length === 0 ? (
          <p className="text-xs text-slate-400 py-4 text-center font-mono">
            No inspection records attributed to this node yet. Use the Optical Fault Inspector to verify PCBs.
          </p>
        ) : (
          <div className="space-y-2">
            {inspectionHistory.map((insp) => (
              <div
                key={insp.id}
                className="p-3.5 rounded-xl bg-slate-900/60 border border-slate-800 flex items-center justify-between text-xs font-mono"
              >
                <div>
                  <p className="text-white font-semibold">{insp.boardIdentifier}</p>
                  <p className="text-[11px] text-slate-400">{insp.id} · {new Date(insp.timestamp).toLocaleTimeString()}</p>
                </div>
                <div className="text-right">
                  <span className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                    insp.status === 'FAIL' ? 'bg-red-950 border border-red-500/40 text-red-400' : 'bg-emerald-950 border border-emerald-500/40 text-emerald-400'
                  }`}>
                    {insp.status} ({insp.defects.length} Flaws)
                  </span>
                  <p className="text-[11px] text-slate-400 mt-1">Score: {insp.qualityScore}%</p>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};
