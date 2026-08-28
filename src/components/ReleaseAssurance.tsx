import React, { useState } from 'react';
import { 
  ShieldCheck, 
  CheckCircle2, 
  Terminal, 
  Lock
} from 'lucide-react';
import { DevManifest } from '../types';

interface ReleaseAssuranceProps {
  devs: Record<string, DevManifest>;
}

export const ReleaseAssurance: React.FC<ReleaseAssuranceProps> = () => {
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
    <div className="w-full h-full bg-[#0B0B0C] p-8 overflow-y-auto select-none font-sans">
      <div className="max-w-3xl mx-auto space-y-6">
        {/* Header */}
        <div className="p-4 bg-[#111113] rounded-xs border border-[rgba(255,255,255,0.075)] flex items-center justify-between">
          <div>
            <div className="flex items-center space-x-2 font-sans">
              <ShieldCheck className="w-4 h-4 text-white" />
              <span className="font-semibold text-white text-sm">Release Assurance Pipeline</span>
            </div>
            <p className="text-xs text-[rgba(255,255,255,0.4)] mt-1">
              Project Aurora • Milestone V1.2 • Strict Non-Automated User Gate
            </p>
          </div>

          <div className="text-right">
            <span className="px-2.5 py-1 bg-[rgba(255,255,255,0.04)] text-white border border-[rgba(255,255,255,0.1)] rounded-xs font-mono text-[11px] font-medium">
              TARGET: V1.2-STABLE
            </span>
          </div>
        </div>

        {/* 4 Pipeline Stages */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs font-sans">
          <div className="p-3.5 bg-[#111113] rounded-xs border border-[rgba(255,255,255,0.075)]">
            <div className="flex items-center justify-between mb-2">
              <span className="text-[rgba(255,255,255,0.5)] font-medium text-[11px]">1. VERIFICATION</span>
              <CheckCircle2 className="w-3.5 h-3.5 text-[#55c98b]" />
            </div>
            <div className="text-[11px] text-[rgba(255,255,255,0.85)] space-y-1">
              <div>✓ Acceptance Tests</div>
              <div>✓ Scope Checks</div>
              <div>✓ Contract Seals</div>
            </div>
          </div>

          <div className="p-3.5 bg-[#111113] rounded-xs border border-[rgba(255,255,255,0.075)]">
            <div className="flex items-center justify-between mb-2">
              <span className="text-[rgba(255,255,255,0.5)] font-medium text-[11px]">2. PACKAGING</span>
              <CheckCircle2 className="w-3.5 h-3.5 text-[#55c98b]" />
            </div>
            <div className="text-[11px] text-[rgba(255,255,255,0.85)] space-y-1">
              <div>✓ Wasm Bundles</div>
              <div>✓ Dist Tarball</div>
              <div>✓ Hashes Signed</div>
            </div>
          </div>

          <div className="p-3.5 bg-[#111113] rounded-xs border border-[rgba(255,255,255,0.075)]">
            <div className="flex items-center justify-between mb-2">
              <span className="text-[rgba(255,255,255,0.5)] font-medium text-[11px]">3. EXERCISES</span>
              <CheckCircle2 className="w-3.5 h-3.5 text-[#55c98b]" />
            </div>
            <div className="text-[11px] text-[rgba(255,255,255,0.85)] space-y-1">
              <div>✓ Install Test</div>
              <div>✓ Recovery Sim</div>
              <div>✓ Handoff Package</div>
            </div>
          </div>

          <div className="p-3.5 bg-[#111113] rounded-xs border border-[rgba(255,255,255,0.15)]">
            <div className="flex items-center justify-between mb-2">
              <span className="text-white font-medium text-[11px]">4. READINESS</span>
              <Lock className="w-3.5 h-3.5 text-[rgba(255,255,255,0.6)]" />
            </div>
            <div className="text-[11px] text-white font-medium">
              Ready for Decision
            </div>
          </div>
        </div>

        {/* Live Exercise Console */}
        <div className="p-4 bg-[#111113] rounded-xs border border-[rgba(255,255,255,0.075)] space-y-3 font-sans text-xs">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-2">
              <Terminal className="w-3.5 h-3.5 text-[rgba(255,255,255,0.6)]" />
              <span className="font-semibold text-white">Release Exercise Logs</span>
            </div>
            <button
              onClick={handleRunExercises}
              disabled={isExercising}
              className="px-2.5 py-1 bg-[rgba(255,255,255,0.04)] hover:bg-[rgba(255,255,255,0.08)] text-white rounded-xs border border-[rgba(255,255,255,0.08)] transition-colors cursor-pointer disabled:opacity-50 text-[11px] font-sans font-medium"
            >
              {isExercising ? 'Running Exercises...' : 'Re-run Release Exercises'}
            </button>
          </div>

          <div className="bg-[#0E0E10] p-3 rounded-xs border border-[rgba(255,255,255,0.06)] text-[11px] font-mono text-[rgba(255,255,255,0.7)] space-y-1.5 h-36 overflow-y-auto scrollbar-thin">
            {exerciseLogs.map((log, idx) => (
              <div key={idx} className={log.includes('✓') ? 'text-[#55c98b] font-medium' : 'text-[rgba(255,255,255,0.4)]'}>
                {log}
              </div>
            ))}
          </div>
        </div>

        {/* Final User Decision Gate */}
        <div className="p-6 bg-[#111113] rounded-xs border border-[rgba(255,255,255,0.075)] text-center space-y-4">
          <div>
            <span className="text-[11px] font-sans font-medium text-[rgba(255,255,255,0.4)] uppercase tracking-wider block mb-1">
              Human-in-the-Loop Release Gate
            </span>
            <h3 className="text-sm font-semibold text-white font-sans">
              {userApproved ? 'Release Approved & Sealed' : 'Ready for User Decision'}
            </h3>
            <p className="text-xs text-[rgba(255,255,255,0.4)] max-w-md mx-auto mt-1 font-sans">
              YU Workbench never auto-releases software. Final production sign-off requires explicit human decision.
            </p>
          </div>

          <div className="flex items-center justify-center space-x-4">
            <button
              onClick={() => setUserApproved(!userApproved)}
              className={`px-5 py-1.5 rounded-xs font-sans text-xs font-medium transition-colors cursor-pointer border flex items-center space-x-2 ${
                userApproved
                  ? 'bg-[rgba(85,201,139,0.12)] text-[#55c98b] border-[rgba(85,201,139,0.4)] hover:bg-[rgba(85,201,139,0.2)]'
                  : 'bg-white hover:bg-neutral-200 text-black border-white'
              }`}
            >
              <ShieldCheck className="w-3.5 h-3.5" />
              <span>{userApproved ? '✓ Milestone V1.2 Released' : 'Approve & Release Milestone V1.2'}</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

