import React, { useState } from 'react';
import { ShieldCheck, Cpu, KeyRound, ArrowRight, Eye, EyeOff, AlertCircle, Sparkles } from 'lucide-react';
export interface Operator {
  nodeId: string;
  fourDigitCode: string;
  sector: string;
  avatarSeed: string;
  createdAt: string;
  verifiedCount: number;
  chixusLawAccepted: boolean;
}

interface WelcomeViewProps {
  onLogin: (nodeId: string, code: string) => boolean;
  onRegisterClick: () => void;
  registeredNodes: Operator[];
}

export const WelcomeView: React.FC<WelcomeViewProps> = ({
  onLogin,
  onRegisterClick,
  registeredNodes,
}) => {
  const [nodeId, setNodeId] = useState('');
  const [code, setCode] = useState('');
  const [showCode, setShowCode] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage('');

    if (!nodeId.trim()) {
      setErrorMessage('Please enter your Operator Node ID.');
      return;
    }

    if (code.length !== 4 || !/^\d{4}$/.test(code)) {
      setErrorMessage('Please enter your valid 4-digit code.');
      return;
    }

    setIsSubmitting(true);
    const success = onLogin(nodeId.trim(), code);
    setIsSubmitting(false);

    if (!success) {
      setErrorMessage('Node ID or 4-digit access code did not match registered records. Remember: credentials cannot be reset.');
    }
  };

  const handleQuickFill = (node: Operator) => {
    setNodeId(node.nodeId);
    setCode(node.fourDigitCode);
    setErrorMessage('');
  };

  return (
    <div className="relative min-h-[calc(100vh-64px)] flex flex-col items-center justify-center p-4 sm:p-6 matrix-grid-bg">
      {/* Decorative ambient metallic glows */}
      <div className="absolute top-1/4 left-1/2 -translate-x-1/2 w-[600px] h-[300px] bg-gradient-to-r from-slate-600/10 via-cyan-500/10 to-slate-400/10 blur-[120px] pointer-events-none -z-10" />

      <div className="w-full max-w-4xl grid grid-cols-1 lg:grid-cols-12 gap-8 items-center">
        {/* Left Column: System Welcome & Overview */}
        <div className="lg:col-span-7 space-y-6">
          <div className="space-y-2">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-slate-800/80 border border-slate-700 text-xs font-mono text-slate-300">
              <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
              <span>CHIXUS Sovereign Electronics Network</span>
            </div>
            <h1 className="text-3xl sm:text-4xl lg:text-5xl font-bold tracking-tight text-white font-['Chakra_Petch',sans-serif]">
              Visual Fault <span className="text-transparent bg-clip-text bg-gradient-to-r from-slate-200 via-slate-300 to-cyan-300">Inspector</span>
            </h1>
            <p className="text-slate-300 text-sm sm:text-base leading-relaxed">
              Decentralized optical solder fault verification, IPC-A-610 surface mount diagnostics, and immutable operator credentials matrix.
            </p>
          </div>

          {/* Core Feature Highlights */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-2">
            <div className="p-3.5 rounded-lg bg-slate-900/60 border border-slate-800 space-y-1">
              <div className="flex items-center gap-2 text-slate-200 font-semibold text-xs font-mono">
                <Cpu className="w-4 h-4 text-cyan-400" />
                <span>Optical Micro-Inspection</span>
              </div>
              <p className="text-xs text-slate-400">
                Live camera HUD and high-res imagery analysis for cold joints, bridges, and tombstoning.
              </p>
            </div>

            <div className="p-3.5 rounded-lg bg-slate-900/60 border border-slate-800 space-y-1">
              <div className="flex items-center gap-2 text-slate-200 font-semibold text-xs font-mono">
                <ShieldCheck className="w-4 h-4 text-emerald-400" />
                <span>Zero-Custody Law</span>
              </div>
              <p className="text-xs text-slate-400">
                Permanent 4-digit code binding. Non-replaceable access keys and decentralized custody.
              </p>
            </div>
          </div>

          {/* Quick Enrolled Nodes list (if any exist) */}
          {registeredNodes.length > 0 && (
            <div className="pt-2">
              <p className="text-xs font-mono text-slate-400 mb-2">
                Available Local Nodes ({registeredNodes.length}):
              </p>
              <div className="flex flex-wrap gap-2">
                {registeredNodes.slice(0, 3).map((node) => (
                  <button
                    key={node.nodeId}
                    type="button"
                    onClick={() => handleQuickFill(node)}
                    className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded bg-slate-800/80 hover:bg-slate-700/80 border border-slate-700 text-xs font-mono text-slate-300 hover:text-white transition-colors"
                  >
                    <span>{node.nodeId}</span>
                    <span className="text-[10px] text-slate-400">({node.sector.split(' ')[0]})</span>
                  </button>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Right Column: Node Connection Terminal */}
        <div className="lg:col-span-5">
          <div className="tactical-surface tactical-beveled-frame rounded-2xl p-6 sm:p-7 relative">
            <div className="mb-6 space-y-1 border-b border-slate-700/60 pb-4">
              <div className="flex items-center justify-between">
                <h2 className="text-base font-semibold text-white font-['Chakra_Petch',sans-serif]">
                  Operator Authorization
                </h2>
                <div className="flex items-center gap-1.5 text-[11px] font-mono text-slate-300 bg-slate-800/80 px-2 py-0.5 rounded border border-slate-700">
                  <KeyRound className="w-3.5 h-3.5 text-cyan-400" />
                  <span>SECURE GATE</span>
                </div>
              </div>
              <p className="text-xs text-slate-400 font-mono">
                Authenticate node connection via your 4-digit sovereign code.
              </p>
            </div>

            {errorMessage && (
              <div className="mb-4 p-3 rounded-lg bg-red-950/40 border border-red-500/40 flex items-start gap-2.5 text-xs text-red-200 font-mono">
                <AlertCircle className="w-4 h-4 text-red-400 mt-0.5 shrink-0" />
                <span>{errorMessage}</span>
              </div>
            )}

            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="block text-xs font-mono text-slate-300 mb-1.5">
                  Operator Node ID
                </label>
                <input
                  type="text"
                  value={nodeId}
                  onChange={(e) => setNodeId(e.target.value)}
                  placeholder="e.g. ID: CHI-7649-NG"
                  className="tactical-inset-input w-full px-3.5 py-2.5 rounded-lg text-sm text-slate-100 placeholder-slate-500 font-mono"
                />
              </div>

              <div>
                <div className="flex items-center justify-between mb-1.5">
                  <label className="text-xs font-mono text-slate-300">
                    4-Digit Sovereign Code
                  </label>
                  <span className="text-[11px] text-slate-400 font-mono">
                    (Immutable PIN)
                  </span>
                </div>
                <div className="relative">
                  <input
                    type={showCode ? 'text' : 'password'}
                    maxLength={4}
                    value={code}
                    onChange={(e) => setCode(e.target.value.replace(/\D/g, '').slice(0, 4))}
                    placeholder="••••"
                    className="tactical-inset-input w-full px-3.5 py-2.5 rounded-lg text-sm text-slate-100 placeholder-slate-500 font-mono tracking-widest"
                  />
                  <button
                    type="button"
                    onClick={() => setShowCode(!showCode)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-200 p-1"
                    title={showCode ? 'Hide Code' : 'Show Code'}
                  >
                    {showCode ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
              </div>

              <button
                type="submit"
                disabled={isSubmitting}
                className="w-full tactical-brushed-silver-btn py-3 px-4 rounded-xl text-xs font-bold uppercase tracking-wider flex items-center justify-center gap-2 mt-4 cursor-pointer"
              >
                <span>Authorize Node Connection</span>
                <ArrowRight className="w-4 h-4" />
              </button>
            </form>

            {/* Registration Action: Exact requested phrase */}
            <div className="mt-6 pt-5 border-t border-slate-800/80 text-center">
              <button
                type="button"
                onClick={onRegisterClick}
                className="group inline-flex items-center gap-2 text-xs font-mono text-cyan-300 hover:text-cyan-200 transition-colors focus:outline-none focus:underline"
              >
                <Sparkles className="w-3.5 h-3.5 text-cyan-400 group-hover:rotate-12 transition-transform" />
                <span className="font-semibold underline underline-offset-4 decoration-cyan-500/40 group-hover:decoration-cyan-400">
                  New operator? Click here to register.
                </span>
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
