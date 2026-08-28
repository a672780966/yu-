import React, { useState } from 'react';
import { 
  Search, 
  ShieldCheck, 
  RotateCcw,
  FastForward,
  Play,
  SlidersHorizontal
} from 'lucide-react';
import { DevManifest } from '../types';

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
  onOpenSearch,
  onStepScheduler,
  onSimulateWorkerComplete,
  onSimulateClaudeAudit,
  onResetDemo,
  currentTab,
  onChangeTab
}) => {
  const [showDevControls, setShowDevControls] = useState(false);
  const devList: DevManifest[] = Object.values(devs);
  const runningCount = devList.filter(d => d.status === 'RUNNING').length;
  const blockedCount = devList.filter(d => d.status === 'BLOCKED').length;
  const firstRunning = devList.find(d => d.status === 'RUNNING');
  const firstAuditing = devList.find(d => d.status === 'AUDITING');

  return (
    <header className="h-12 bg-[#0B0B0C] border-b border-[rgba(255,255,255,0.075)] px-4 flex items-center justify-between select-none shrink-0 z-30 font-sans">
      {/* Left: YU Logo + Project & Milestone */}
      <div className="flex items-center space-x-3.5">
        {/* Geometric YU Monogram Glyph */}
        <div className="flex items-center space-x-2">
          <svg className="w-5 h-5 text-white" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M4 4l8 9 8-9" />
            <path d="M12 13v7" />
            <path d="M7 21h10" />
          </svg>
          <span className="font-bold text-sm tracking-tight text-white">YU</span>
        </div>

        <span className="text-[rgba(255,255,255,0.2)] text-xs">/</span>

        {/* Project Name & Milestone */}
        <div className="flex items-center space-x-2 text-xs">
          <span className="font-semibold text-white">Aurora</span>
          <span className="text-[rgba(255,255,255,0.4)] text-xs">/</span>
          <span className="font-mono text-[11px] text-[rgba(255,255,255,0.6)]">V1.2</span>
        </div>

        {/* Quiet Indicators: Only Show Active / Abnormal Status */}
        <div className="flex items-center space-x-2.5 ml-2 pl-3 border-l border-[rgba(255,255,255,0.08)]">
          {runningCount > 0 && (
            <div className="flex items-center space-x-1.5 text-xs text-[rgba(255,255,255,0.7)]">
              <span className="w-2 h-2 rounded-full bg-[#5e9cff] animate-quiet-pulse" />
              <span>{runningCount} Running</span>
            </div>
          )}

          {blockedCount > 0 && (
            <div className="flex items-center space-x-1.5 text-xs text-[#ec6a6a]">
              <span className="w-2 h-2 rounded-full bg-[#ec6a6a]" />
              <span className="font-medium">{blockedCount} Blocked</span>
            </div>
          )}
        </div>
      </div>

      {/* Center: Main View Navigation */}
      <div className="flex items-center space-x-1 bg-[rgba(255,255,255,0.03)] p-0.5 rounded-xs border border-[rgba(255,255,255,0.06)] text-xs font-sans">
        <button
          onClick={() => onChangeTab('graph')}
          className={`px-3 py-1 rounded-xs transition-colors cursor-pointer text-xs font-medium ${
            currentTab === 'graph'
              ? 'bg-[rgba(255,255,255,0.12)] text-white shadow-xs'
              : 'text-[rgba(255,255,255,0.6)] hover:text-white'
          }`}
        >
          Construction
        </button>
        <button
          onClick={() => onChangeTab('editor')}
          className={`px-3 py-1 rounded-xs transition-colors cursor-pointer text-xs font-medium ${
            currentTab === 'editor'
              ? 'bg-[rgba(255,255,255,0.12)] text-white shadow-xs'
              : 'text-[rgba(255,255,255,0.6)] hover:text-white'
          }`}
        >
          Editor
        </button>
        <button
          onClick={() => onChangeTab('release')}
          className={`px-3 py-1 rounded-xs transition-colors cursor-pointer text-xs font-medium flex items-center space-x-1 ${
            currentTab === 'release'
              ? 'bg-[rgba(255,255,255,0.12)] text-white shadow-xs'
              : 'text-[rgba(255,255,255,0.6)] hover:text-white'
          }`}
        >
          <span>Release</span>
        </button>
      </div>

      {/* Right: Search, Dev Mode & Actions */}
      <div className="flex items-center space-x-2">
        {/* Search */}
        <button
          onClick={onOpenSearch}
          className="flex items-center space-x-2 bg-[rgba(255,255,255,0.03)] hover:bg-[rgba(255,255,255,0.06)] border border-[rgba(255,255,255,0.08)] px-2.5 py-1 rounded-xs text-xs text-[rgba(255,255,255,0.6)] transition-colors cursor-pointer"
        >
          <Search className="w-3.5 h-3.5 text-[rgba(255,255,255,0.4)]" />
          <span className="text-[11px] font-sans">Search</span>
          <kbd className="text-[9px] font-mono text-[rgba(255,255,255,0.3)] bg-[rgba(255,255,255,0.05)] px-1 rounded-2xs">⌘K</kbd>
        </button>

        {/* Developer Simulation Mode Toggle */}
        <button
          onClick={() => setShowDevControls(!showDevControls)}
          title="Toggle Simulation Controls"
          className={`p-1.5 rounded-xs border transition-colors cursor-pointer ${
            showDevControls 
              ? 'bg-[rgba(255,255,255,0.1)] border-[rgba(255,255,255,0.2)] text-white' 
              : 'border-transparent text-[rgba(255,255,255,0.4)] hover:text-white'
          }`}
        >
          <SlidersHorizontal className="w-3.5 h-3.5" />
        </button>

        {/* Simulation Controls (Hidden by default, shown when developer mode clicked) */}
        {showDevControls && (
          <div className="flex items-center space-x-1 bg-[#18181A] p-0.5 rounded-xs border border-[rgba(255,255,255,0.12)] shadow-lg animate-in fade-in">
            <button
              onClick={onStepScheduler}
              title="Step YU DAG Scheduler Tick"
              className="flex items-center space-x-1 px-2 py-0.5 hover:bg-[rgba(255,255,255,0.08)] text-white text-[11px] rounded-xs font-mono transition-colors cursor-pointer"
            >
              <FastForward className="w-3 h-3 text-cyan-400" />
              <span>Tick</span>
            </button>

            {firstRunning && (
              <button
                onClick={() => onSimulateWorkerComplete(firstRunning.nodeId)}
                title={`Worker Complete for ${firstRunning.nodeId}`}
                className="flex items-center space-x-1 px-2 py-0.5 hover:bg-[rgba(255,255,255,0.08)] text-[#5e9cff] text-[11px] rounded-xs font-mono transition-colors cursor-pointer"
              >
                <Play className="w-3 h-3" />
                <span>Fin {firstRunning.nodeId}</span>
              </button>
            )}

            {firstAuditing && (
              <button
                onClick={() => onSimulateClaudeAudit(firstAuditing.nodeId, 'PASS')}
                title={`Audit PASS for ${firstAuditing.nodeId}`}
                className="flex items-center space-x-1 px-2 py-0.5 hover:bg-[rgba(255,255,255,0.08)] text-[#a487e8] text-[11px] rounded-xs font-mono transition-colors cursor-pointer"
              >
                <ShieldCheck className="w-3 h-3" />
                <span>Audit</span>
              </button>
            )}

            <button
              onClick={onResetDemo}
              title="Reset Project"
              className="p-1 hover:bg-[rgba(255,255,255,0.08)] text-[rgba(255,255,255,0.5)] hover:text-white rounded-xs transition-colors cursor-pointer"
            >
              <RotateCcw className="w-3 h-3" />
            </button>
          </div>
        )}
      </div>
    </header>
  );
};
