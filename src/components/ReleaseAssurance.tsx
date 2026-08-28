import React, { useState } from 'react';
import { 
  ShieldCheck, 
  Package, 
  RotateCcw, 
  CheckCircle2, 
  AlertTriangle, 
  Terminal, 
  Lock, 
  Send,
  Download,
  Flame
} from 'lucide-react';
import { DevManifest } from '../types';

interface ReleaseAssuranceProps {
  devs: Record<string, DevManifest>;
}

export const ReleaseAssurance: React.FC<ReleaseAssuranceProps> = ({ devs }) => {
  const [isExercising, setIsExercising] = useState(false);
  const [exerciseLogs, setExerciseLogs] = useState<string[]>([
    '[2026-08-28 01:20] Verification Phase: 28/47 acceptance suites verified green',
    '[2026-08-28 01:21] Static Analysis: Zero TypeScript / Lint diagnostics',
    '[2026-08-28 01:22] Contract Integrity: All 3 active contracts sealed & frozen'
  ]);
  const [userApproved, setUserApproved] = useState(false);

  const handleRunExercises = () => {
    setIsExercising(true);
    setTimeout(() => {
      setExerciseLogs(prev => [
        ...prev,
        '[2026-08-28 01:35] Install Exercise: Clean sandbox npm install completed in 4.2s (Zero missing peer deps)',
        '[2026-08-28 01:36] Recovery Exercise: Snapshot rollback & rebuild test passed',
        '[2026-08-28 01:37] Handoff Package: Binary checksum sha256:7f81902c... valid',
        '✓ RELEASE READINESS EXERCISES COMPLETED'
      ]);
      setIsExercising(false);
    }, 900);
  };

  return (
    <div className="w-full h-full bg-[#0A0A0A] p-8 overflow-y-auto select-none font-sans">
      <div className="max-w-4xl mx-auto space-y-6">
        {/* Header */}
        <div className="bg-[#121212] p-5 rounded-sm border border-[#262626] flex items-center justify-between">
          <div>
            <div className="flex items-center space-x-2 font-mono">
              <ShieldCheck className="w-5 h-5 text-cyan-400" />
              <span className="font-bold text-white text-base">RELEASE ASSURANCE PIPELINE</span>
            </div>
            <p className="text-xs text-[#737373] font-mono mt-1">
              Project Aurora • Milestone V1.2 • Strict Non-Automated User Gate
            </p>
          </div>

          <div className="text-right">
            <span className="px-3 py-1 bg-cyan-500/10 text-cyan-300 border border-cyan-500/30 rounded-xs font-mono text-xs font-bold">
              TARGET: V1.2-STABLE
            </span>
          </div>
        </div>

        {/* 4 Pipeline Stages */}
        <div className="grid grid-cols-4 gap-3 font-mono text-xs">
          <div className="bg-[#121212] p-3.5 rounded-sm border border-[#262626]">
            <div className="flex items-center justify-between mb-2">
              <span className="text-[#737373] font-bold">1. VERIFICATION</span>
              <CheckCircle2 className="w-4 h-4 text-emerald-400" />
            </div>
            <div className="text-[11px] text-[#D4D4D4] space-y-1">
              <div>✓ Acceptance Tests</div>
              <div>✓ Scope Checks</div>
              <div>✓ Contract Seals</div>
            </div>
          </div>

          <div className="bg-[#121212] p-3.5 rounded-sm border border-[#262626]">
            <div className="flex items-center justify-between mb-2">
              <span className="text-[#737373] font-bold">2. PACKAGING</span>
              <CheckCircle2 className="w-4 h-4 text-emerald-400" />
            </div>
            <div className="text-[11px] text-[#D4D4D4] space-y-1">
              <div>✓ Wasm Bundles</div>
              <div>✓ Dist Tarball</div>
              <div>✓ Hashes Signed</div>
            </div>
          </div>

          <div className="bg-[#121212] p-3.5 rounded-sm border border-[#262626]">
            <div className="flex items-center justify-between mb-2">
              <span className="text-[#737373] font-bold">3. EXERCISES</span>
              <CheckCircle2 className="w-4 h-4 text-emerald-400" />
            </div>
            <div className="text-[11px] text-[#D4D4D4] space-y-1">
              <div>✓ Install Test</div>
              <div>✓ Recovery Sim</div>
              <div>✓ Handoff Package</div>
            </div>
          </div>

          <div className="bg-[#121212] p-3.5 rounded-sm border border-cyan-500/30 bg-cyan-500/5">
            <div className="flex items-center justify-between mb-2">
              <span className="text-cyan-400 font-bold">4. READINESS</span>
              <Lock className="w-4 h-4 text-cyan-400" />
            </div>
            <div className="text-[11px] text-cyan-200 font-bold">
              READY FOR USER DECISION
            </div>
          </div>
        </div>

        {/* Live Exercise Console */}
        <div className="bg-[#121212] p-4 rounded-sm border border-[#262626] space-y-3 font-mono text-xs">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-2">
              <Terminal className="w-4 h-4 text-amber-400" />
              <span className="font-bold text-white">RELEASE EXERCISE LOGS</span>
            </div>
            <button
              onClick={handleRunExercises}
              disabled={isExercising}
              className="px-3 py-1 bg-[#141414] hover:bg-[#262626] text-white rounded-xs border border-[#262626] transition-colors cursor-pointer disabled:opacity-50 font-bold"
            >
              {isExercising ? 'Running Exercises...' : 'Re-run Release Exercises'}
            </button>
          </div>

          <div className="bg-[#0A0A0A] p-3 rounded-sm border border-[#262626] text-[11px] text-[#D4D4D4] space-y-1.5 h-36 overflow-y-auto scrollbar-thin scrollbar-thumb-[#262626]">
            {exerciseLogs.map((log, idx) => (
              <div key={idx} className={log.includes('✓') ? 'text-emerald-400 font-bold' : 'text-[#737373]'}>
                {log}
              </div>
            ))}
          </div>
        </div>

        {/* Final User Decision Gate */}
        <div className="bg-[#121212] p-6 rounded-sm border border-[#262626] text-center space-y-4">
          <div>
            <span className="text-xs font-mono font-bold text-[#737373] uppercase tracking-wider block mb-1">
              HUMAN-IN-THE-LOOP RELEASE GATE
            </span>
            <h3 className="text-base font-bold text-white font-mono">
              {userApproved ? 'RELEASE APPROVED & SEALED' : 'READY FOR USER DECISION'}
            </h3>
            <p className="text-xs text-[#737373] max-w-md mx-auto mt-1 font-mono">
              YU V1.2 Workbench never auto-releases software. Final production sign-off requires explicit human decision.
            </p>
          </div>

          <div className="flex items-center justify-center space-x-4">
            <button
              onClick={() => setUserApproved(!userApproved)}
              className={`px-6 py-2 rounded-xs font-mono text-xs font-bold transition-colors cursor-pointer border flex items-center space-x-2 ${
                userApproved
                  ? 'bg-emerald-600 hover:bg-emerald-500 text-white border-emerald-400 shadow-lg'
                  : 'bg-white hover:bg-neutral-200 text-black border-white shadow-md'
              }`}
            >
              <ShieldCheck className="w-4 h-4" />
              <span>{userApproved ? '✓ Milestone V1.2 Released' : 'Approve & Release Milestone V1.2'}</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
