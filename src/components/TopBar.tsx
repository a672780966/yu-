import React, { useState } from 'react';
import { 
  Play, 
  CheckCircle2, 
  AlertTriangle, 
  Clock, 
  Search, 
  SlidersHorizontal, 
  Layers, 
  ShieldCheck, 
  RotateCcw,
  FastForward,
  Cpu
} from 'lucide-react';
import { DevManifest } from '../types';
import { MAX_ACTIVE_CONSTRUCTION_RUNS } from '../engine/parallelismEngine';

interface TopBarProps {
  devs: Record<string, DevManifest>;
  activeSlots: (string | null)[];
  onOpenSearch: () => void;
  onStepScheduler: () => void;
  onSimulateWorkerComplete: (nodeId: string) => void;
  onSimulateClaudeAudit: (nodeId: string, verdict: 'PASS' | 'FIX_REQUIRED' | 'BLOCKED') => void;
  onResetDemo: () => void;
  currentTab: 'graph' | 'editor' | 'release';
  onChangeTab: (tab: 'graph' | 'editor' | 'release') => void;
}

export const TopBar: React.FC<TopBarProps> = ({
  devs,
  activeSlots,
  onOpenSearch,
  onStepScheduler,
  onSimulateWorkerComplete,
  onSimulateClaudeAudit,
  onResetDemo,
  currentTab,
  onChangeTab
}) => {
  const devList: DevManifest[] = Object.values(devs);
  const passCount = devList.filter(d => d.status === 'PASS').length;
  const runningCount = devList.filter(d => d.status === 'RUNNING').length;
  const auditingCount = devList.filter(d => d.status === 'AUDITING').length;
  const blockedCount = devList.filter(d => d.status === 'BLOCKED').length;
  const readyCount = devList.filter(d => d.status === 'READY').length;
  const activeRunsCount = activeSlots.filter(Boolean).length;

  const firstRunning = devList.find(d => d.status === 'RUNNING');
  const firstAuditing = devList.find(d => d.status === 'AUDITING');

  return (
    <header className="h-14 bg-[#0A0A0A] border-b border-[#262626] px-4 flex items-center justify-between select-none shrink-0 z-30 font-sans">
      {/* Left: Brand + Project Metadata */}
      <div className="flex items-center space-x-5">
        {/* YU Logo */}
        <div className="flex items-center space-x-2.5">
          <div className="w-7 h-7 bg-white text-black font-black font-mono rounded-sm flex items-center justify-center text-xs shadow-sm tracking-tighter">
            YU
          </div>
          <div className="flex flex-col">
            <span className="text-xs font-bold tracking-wider text-white uppercase font-mono">
              IMPRM WORKBENCH
            </span>
            <span className="text-[10px] text-[#A3A3A3] font-mono tracking-tight -mt-0.5">
              V1.2 • CLAUDE + WORKER ARCH
            </span>
          </div>
        </div>

        <div className="h-5 w-px bg-[#262626]" />

        {/* Project Info */}
        <div className="flex items-center space-x-2.5 text-xs">
          <div className="flex items-center space-x-1.5 bg-[#141414] px-2.5 py-1 rounded-sm border border-[#262626]">
            <span className="text-[#737373] font-mono text-[10px] uppercase font-bold">PROJECT</span>
            <span className="font-semibold text-[#E5E5E5] font-mono text-[11px]">Aurora</span>
          </div>
          <div className="flex items-center space-x-1.5 bg-[#141414] px-2.5 py-1 rounded-sm border border-[#262626]">
            <span className="text-[#737373] font-mono text-[10px] uppercase font-bold">MILESTONE</span>
            <span className="font-semibold text-cyan-400 font-mono text-[11px]">V1.2</span>
          </div>
          <div className="flex items-center space-x-1 px-2 py-0.5 bg-emerald-500/10 text-emerald-400 border border-emerald-500/30 rounded-sm text-[10px] font-mono">
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-400"></span>
            <span className="font-bold">ACTIVE</span>
          </div>
        </div>
      </div>

      {/* Center: Concurrency Slots & Metrics */}
      <div className="flex items-center space-x-4">
        {/* Status Metrics Pills */}
        <div className="flex items-center space-x-1 text-xs font-mono">
          <span className="px-2 py-0.5 rounded-sm bg-[#141414] border border-emerald-500/30 text-emerald-400 font-semibold text-[11px]">
            {passCount + 26} PASS
          </span>
          <span className="px-2 py-0.5 rounded-sm bg-[#141414] border border-blue-500/30 text-blue-400 flex items-center space-x-1 text-[11px] font-semibold">
            <span className="w-1.5 h-1.5 rounded-full bg-blue-400 animate-pulse"></span>
            <span>{runningCount} RUNNING</span>
          </span>
          {auditingCount > 0 && (
            <span className="px-2 py-0.5 rounded-sm bg-[#141414] border border-purple-500/30 text-purple-300 text-[11px] font-semibold">
              {auditingCount} AUDITING
            </span>
          )}
          {blockedCount > 0 && (
            <span className="px-2 py-0.5 rounded-sm bg-[#141414] border border-red-500/40 text-red-400 font-bold text-[11px]">
              {blockedCount} BLOCKED
            </span>
          )}
          {readyCount > 0 && (
            <span className="px-2 py-0.5 rounded-sm bg-[#141414] border border-cyan-500/30 text-cyan-400 text-[11px]">
              {readyCount} READY
            </span>
          )}
        </div>

        <div className="h-5 w-px bg-[#262626]" />

        {/* 4 Concurrent Slots Indicator */}
        <div className="flex items-center space-x-2 bg-[#141414] px-3 py-1 rounded-sm border border-[#262626]">
          <div className="flex items-center space-x-1.5 text-xs">
            <Cpu className="w-3.5 h-3.5 text-blue-400" />
            <span className="text-[#A3A3A3] font-mono text-[10px] font-bold">SLOTS:</span>
            <span className="font-mono font-bold text-white text-[11px]">
              {activeRunsCount} / {MAX_ACTIVE_CONSTRUCTION_RUNS}
            </span>
          </div>

          <div className="flex items-center space-x-1">
            {activeSlots.map((nodeId, idx) => (
              <div
                key={idx}
                title={nodeId ? `Slot #${idx + 1}: ${nodeId}` : `Slot #${idx + 1}: IDLE`}
                className={`w-4 h-4 rounded-xs text-[9px] font-mono flex items-center justify-center font-bold border transition-colors ${
                  nodeId
                    ? 'bg-blue-600 text-white border-blue-400 shadow-[0_0_8px_rgba(59,130,246,0.3)]'
                    : 'bg-[#1C1C1C] text-[#525252] border-[#2E2E2E]'
                }`}
              >
                {idx + 1}
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Right: Search, Interactive Simulation Tools & Navigation */}
      <div className="flex items-center space-x-3">
        {/* Global Search Button */}
        <button
          onClick={onOpenSearch}
          className="flex items-center space-x-2 bg-[#141414] hover:bg-[#1C1C1C] border border-[#262626] hover:border-[#404040] px-2.5 py-1 rounded-sm text-xs text-[#A3A3A3] transition-colors cursor-pointer"
        >
          <Search className="w-3.5 h-3.5 text-[#737373]" />
          <span className="font-mono text-[11px]">Search (Ctrl+K)</span>
        </button>

        {/* Runtime Action Controls */}
        <div className="flex items-center space-x-1 bg-[#141414] p-0.5 rounded-sm border border-[#262626]">
          <button
            onClick={onStepScheduler}
            title="Step YU DAG Scheduler Tick (Recalculate Ready & Isolation)"
            className="flex items-center space-x-1 px-2 py-1 bg-[#1C1C1C] hover:bg-[#262626] text-white text-xs rounded-xs font-mono transition-colors cursor-pointer border border-[#2E2E2E]"
          >
            <FastForward className="w-3 h-3 text-cyan-400" />
            <span>Tick</span>
          </button>

          {firstRunning && (
            <button
              onClick={() => onSimulateWorkerComplete(firstRunning.nodeId)}
              title={`Simulate Worker (Pi+Luna) complete for ${firstRunning.nodeId}`}
              className="flex items-center space-x-1 px-2 py-1 bg-blue-500/10 hover:bg-blue-500/20 text-blue-300 text-xs rounded-xs font-mono transition-colors cursor-pointer border border-blue-500/30"
            >
              <Play className="w-3 h-3 text-blue-400" />
              <span>Fin {firstRunning.nodeId}</span>
            </button>
          )}

          {firstAuditing && (
            <button
              onClick={() => onSimulateClaudeAudit(firstAuditing.nodeId, 'PASS')}
              title={`Simulate Fresh Claude Review PASS for ${firstAuditing.nodeId}`}
              className="flex items-center space-x-1 px-2 py-1 bg-purple-500/10 hover:bg-purple-500/20 text-purple-300 text-xs rounded-xs font-mono transition-colors cursor-pointer border border-purple-500/30"
            >
              <ShieldCheck className="w-3 h-3 text-purple-400" />
              <span>Audit PASS</span>
            </button>
          )}

          <button
            onClick={onResetDemo}
            title="Reset Project State"
            className="p-1 hover:bg-[#262626] text-[#737373] hover:text-white rounded-xs transition-colors cursor-pointer"
          >
            <RotateCcw className="w-3.5 h-3.5" />
          </button>
        </div>

        {/* View Mode Toggle */}
        <div className="flex items-center bg-[#141414] p-0.5 rounded-sm border border-[#262626] text-xs font-mono">
          <button
            onClick={() => onChangeTab('graph')}
            className={`px-2.5 py-1 rounded-xs transition-colors cursor-pointer ${
              currentTab === 'graph'
                ? 'bg-white text-black font-bold shadow-xs'
                : 'text-[#A3A3A3] hover:text-white'
            }`}
          >
            Graph
          </button>
          <button
            onClick={() => onChangeTab('editor')}
            className={`px-2.5 py-1 rounded-xs transition-colors cursor-pointer ${
              currentTab === 'editor'
                ? 'bg-white text-black font-bold shadow-xs'
                : 'text-[#A3A3A3] hover:text-white'
            }`}
          >
            Editor
          </button>
          <button
            onClick={() => onChangeTab('release')}
            className={`px-2.5 py-1 rounded-xs transition-colors cursor-pointer flex items-center space-x-1 ${
              currentTab === 'release'
                ? 'bg-cyan-400 text-black font-bold shadow-xs'
                : 'text-[#A3A3A3] hover:text-white'
            }`}
          >
            <ShieldCheck className="w-3 h-3" />
            <span>Release</span>
          </button>
        </div>
      </div>
    </header>
  );
};
