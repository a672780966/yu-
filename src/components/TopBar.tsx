import React, { useState } from 'react';
import { 
  Search, 
  RotateCcw,
  FastForward,
  Play,
  SlidersHorizontal
} from 'lucide-react';
import { DevManifest } from '../types';
import { YuLogo } from './YuLogo';

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
      {/* Left: Brand Monogram + Hierarchy + Active Status */}
      <div className="flex items-center space-x-3.5">
        {/* Brand Icon: 16px Flat YU Logo */}
        <div className="flex items-center space-x-2 text-white">
          <YuLogo size={16} variant="flat" />
        </div>

        {/* Project & Milestone Hierarchy */}
        <div className="flex items-center space-x-1.5 text-xs">
          <span className="font-semibold text-white tracking-tight">Aurora</span>
          <span className="text-[rgba(255,255,255,0.25)]">/</span>
          <span className="font-mono text-[11px] text-[rgba(255,255,255,0.6)]">V1.2</span>
        </div>

        {/* Quiet Running & Blocked Diagnostics (5px dots, tabular nums) */}
        <div className="flex items-center space-x-3 ml-2 pl-3 border-l border-[rgba(255,255,255,0.08)]">
          {runningCount > 0 && (
            <div className="flex items-center space-x-1.5 text-xs text-[rgba(255,255,255,0.75)] yu-data">
              <span className="w-[5px] h-[5px] rounded-full bg-[#5e9cff] animate-quiet-pulse" />
              <span>{runningCount} Running</span>
            </div>
          )}

          {blockedCount > 0 && (
            <div className="flex items-center space-x-1.5 text-xs text-[#ec6a6a] yu-data">
              <span className="w-[5px] h-[5px] rounded-full bg-[#ec6a6a]" />
              <span className="font-medium">{blockedCount} Blocked</span>
            </div>
          )}
        </div>
      </div>

      {/* Center: Precision Navigation with YU Rail Indicator */}
      <div className="flex items-center h-full space-x-1 font-sans">
        {(
          [
            { id: 'graph', label: 'Graph' },
            { id: 'editor', label: 'Editor' },
            { id: 'release', label: 'Release' }
          ] as const
        ).map(tab => {
          const isActive = currentTab === tab.id;
          return (
            <button
              key={tab.id}
              onClick={() => onChangeTab(tab.id)}
              className={`h-full px-4 text-xs font-medium transition-colors cursor-pointer flex items-center relative ${
                isActive
                  ? 'text-white'
                  : 'text-[rgba(255,255,255,0.5)] hover:text-[rgba(255,255,255,0.85)]'
              }`}
            >
              <span>{tab.label}</span>
              {isActive && (
                <svg
                  width="32"
                  height="6"
                  viewBox="0 0 32 6"
                  className="absolute bottom-0 left-1/2 -translate-x-1/2 text-white fill-none stroke-current"
                  strokeWidth="1.5"
                >
                  <path
                    d="M0 5.25 L20 5.25 L28 1.25"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    vectorEffect="non-scaling-stroke"
                  />
                </svg>
              )}
            </button>
          );
        })}
      </div>

      {/* Right: Search (32px), Dev Simulation Controls */}
      <div className="flex items-center space-x-2">
        {/* Quick Search */}
        <button
          onClick={onOpenSearch}
          className="h-8 flex items-center space-x-2 bg-[rgba(255,255,255,0.03)] hover:bg-[rgba(255,255,255,0.06)] active:bg-[rgba(255,255,255,0.09)] border border-[rgba(255,255,255,0.08)] px-3 rounded-xs text-xs text-[rgba(255,255,255,0.6)] transition-colors cursor-pointer"
        >
          <Search className="w-3.5 h-3.5 text-[rgba(255,255,255,0.4)]" />
          <span className="text-[11px] font-sans">Search</span>
          <kbd className="text-[9px] font-mono text-[rgba(255,255,255,0.35)] bg-[rgba(255,255,255,0.06)] px-1 py-0.5 rounded-2xs yu-data">Ctrl K</kbd>
        </button>

        {/* Developer Mode Simulation Toggle (32×32px) */}
        <button
          onClick={() => setShowDevControls(!showDevControls)}
          title="Toggle Developer Simulation Mode"
          className={`w-8 h-8 flex items-center justify-center rounded-xs border transition-colors cursor-pointer ${
            showDevControls 
              ? 'bg-[rgba(255,255,255,0.1)] border-[rgba(255,255,255,0.2)] text-white' 
              : 'border-transparent text-[rgba(255,255,255,0.4)] hover:text-white hover:bg-[rgba(255,255,255,0.04)]'
          }`}
        >
          <SlidersHorizontal className="w-3.5 h-3.5" />
        </button>

        {/* Simulation Controls (Hidden by default, shown in Developer Mode) */}
        {showDevControls && (
          <div className="flex items-center space-x-1 bg-[#18181A] p-0.5 rounded-xs border border-[rgba(255,255,255,0.12)] shadow-lg animate-in fade-in h-8">
            <button
              onClick={onStepScheduler}
              title="Step YU DAG Scheduler Tick"
              className="h-7 flex items-center space-x-1 px-2 hover:bg-[rgba(255,255,255,0.08)] text-white text-[11px] rounded-xs font-mono transition-colors cursor-pointer"
            >
              <FastForward className="w-3 h-3 text-cyan-400" />
              <span>Tick</span>
            </button>

            {firstRunning && (
              <button
                onClick={() => onSimulateWorkerComplete(firstRunning.nodeId)}
                title={`Simulate Worker Complete for ${firstRunning.nodeId}`}
                className="h-7 flex items-center space-x-1 px-2 hover:bg-[rgba(255,255,255,0.08)] text-[#5e9cff] text-[11px] rounded-xs font-mono transition-colors cursor-pointer"
              >
                <Play className="w-3 h-3" />
                <span>Fin {firstRunning.nodeId}</span>
              </button>
            )}

            {firstAuditing && (
              <button
                onClick={() => onSimulateClaudeAudit(firstAuditing.nodeId, 'PASS')}
                title={`Simulate Claude Audit Pass for ${firstAuditing.nodeId}`}
                className="h-7 flex items-center space-x-1 px-2 hover:bg-[rgba(255,255,255,0.08)] text-[#55c98b] text-[11px] rounded-xs font-mono transition-colors cursor-pointer"
              >
                <span>Audit Pass</span>
              </button>
            )}

            <button
              onClick={onResetDemo}
              title="Reset State"
              className="h-7 p-1.5 hover:bg-[rgba(255,255,255,0.08)] text-[rgba(255,255,255,0.5)] hover:text-white rounded-xs transition-colors cursor-pointer"
            >
              <RotateCcw className="w-3 h-3" />
            </button>
          </div>
        )}
      </div>
    </header>
  );
};
