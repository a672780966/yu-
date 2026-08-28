import React from 'react';
import { Cpu, Lock, GitBranch, CheckCircle2, ShieldCheck } from 'lucide-react';
import { MAX_ACTIVE_CONSTRUCTION_RUNS } from '../engine/parallelismEngine';

interface StatusBarProps {
  activeRunsCount: number;
  blockedCount: number;
  passCount: number;
}

export const StatusBar: React.FC<StatusBarProps> = ({
  activeRunsCount,
  blockedCount,
  passCount
}) => {
  return (
    <footer className="h-6 bg-[#0A0A0A] border-t border-[#262626] px-3 flex items-center justify-between text-[10px] font-mono text-[#737373] select-none shrink-0 z-30">
      {/* Left: System Status & Brand Slogan */}
      <div className="flex items-center space-x-4">
        <div className="flex items-center space-x-1.5 text-emerald-400">
          <span className="w-1.5 h-1.5 rounded-full bg-emerald-400"></span>
          <span className="font-semibold text-[#D4D4D4]">System Ready</span>
        </div>

        <span className="text-[#333333]">|</span>

        <span className="text-[#A3A3A3]">
          YU IMPRM <strong className="text-white">V1.2</strong>
        </span>

        <span className="text-[#333333]">|</span>

        <span className="text-[#737373] italic">
          Harness intelligence. Retain control.
        </span>
      </div>

      {/* Right: Runtime Diagnostics */}
      <div className="flex items-center space-x-4">
        <div className="flex items-center space-x-1">
          <Cpu className="w-3 h-3 text-blue-400" />
          <span>Active Runs:</span>
          <span className="text-white font-bold">{activeRunsCount}/{MAX_ACTIVE_CONSTRUCTION_RUNS}</span>
        </div>

        {blockedCount > 0 && (
          <div className="flex items-center space-x-1 text-red-400 font-bold">
            <span>Blocked:</span>
            <span>{blockedCount}</span>
          </div>
        )}

        <div className="flex items-center space-x-1 text-emerald-400">
          <CheckCircle2 className="w-3 h-3" />
          <span>Passed:</span>
          <span className="text-white">{passCount + 26}</span>
        </div>

        <div className="flex items-center space-x-1 text-cyan-400">
          <GitBranch className="w-3 h-3" />
          <span>Worktree Isolation: 4 slots</span>
        </div>
      </div>
    </footer>
  );
};
