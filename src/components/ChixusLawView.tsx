import React from 'react';
import { ShieldCheck, BookOpen, AlertTriangle, Key, Scale, Award } from 'lucide-react';
import { CHIXUS_LAWS } from '../data/chixusLaw';

export const ChixusLawView: React.FC = () => {
  return (
    <div className="space-y-6 max-w-4xl mx-auto">
      {/* Title & Introduction */}
      <div className="silver-gradient-surface rounded-2xl p-6 sm:p-8 space-y-4">
        <div className="flex items-center gap-3">
          <div className="p-2.5 rounded-lg bg-amber-500/10 border border-amber-500/30 text-amber-400">
            <Scale className="w-6 h-6" />
          </div>
          <div>
            <h1 className="text-xl sm:text-2xl font-bold text-white font-['Chakra_Petch',sans-serif]">
              The Sovereign Chixus Law
            </h1>
            <p className="text-xs sm:text-sm text-slate-300">
              Foundational canons of the decentralized electronics verification network.
            </p>
          </div>
        </div>

        {/* Mandate Notice */}
        <div className="p-4 rounded-xl bg-amber-950/20 border border-amber-500/30 space-y-1.5">
          <div className="flex items-center gap-2 text-amber-300 text-xs font-mono font-semibold">
            <AlertTriangle className="w-4 h-4 text-amber-400" />
            <span>CANONICAL MANDATE FOR ALL OPERATORS</span>
          </div>
          <p className="text-xs text-slate-300 leading-relaxed">
            All registered nodes operate under the covenant of personal custody. Never forget your 4-digit code. There is no password retrieval, no support override, and no reissue protocol.
          </p>
        </div>
      </div>

      {/* The 4 Tenets */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {CHIXUS_LAWS.map((law) => (
          <div
            key={law.id}
            className="silver-gradient-surface rounded-2xl p-6 space-y-3 relative group hover:border-slate-500/50 transition-all"
          >
            <div className="flex items-center justify-between border-b border-slate-700/60 pb-3">
              <span className="text-xs font-mono text-cyan-400 font-bold">
                CANON {law.number}
              </span>
              <ShieldCheck className="w-4 h-4 text-slate-400 group-hover:text-emerald-400 transition-colors" />
            </div>

            <h2 className="text-base font-semibold text-white font-['Chakra_Petch',sans-serif]">
              {law.title}
            </h2>

            <p className="text-xs text-cyan-300/90 font-mono">
              "{law.summary}"
            </p>

            <p className="text-xs text-slate-300 leading-relaxed pt-1">
              {law.fullRule}
            </p>
          </div>
        ))}
      </div>

      {/* Physical Safeguard Recommendation */}
      <div className="p-6 rounded-2xl bg-slate-900/60 border border-slate-800 space-y-3">
        <div className="flex items-center gap-2 text-xs font-mono text-slate-300 font-semibold">
          <Key className="w-4 h-4 text-amber-400" />
          <span>OPERATOR KEY RETENTION DIRECTIVE</span>
        </div>
        <p className="text-xs text-slate-400 leading-relaxed">
          Because your 4-digit code (such as your birth year or chosen permanent sequence) cannot be replaced, we advise every operator to engrave or securely record their 4-digit PIN in an off-line physical ledger. If access to your node is severed, that node identifier remains forever locked to that key.
        </p>
      </div>
    </div>
  );
};
