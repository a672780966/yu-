import React, { useState } from 'react';
import { 
  ChevronUp, 
  ChevronDown, 
  X, 
  Cpu, 
  ShieldCheck, 
  Lock, 
  CheckCircle2, 
  AlertTriangle, 
  Layers, 
  Sparkles,
  ExternalLink,
  Bot,
  Terminal,
  Play,
  RotateCcw,
  Check,
  Zap,
  Info,
  Flame,
  FileCode,
  Key
} from 'lucide-react';
import { DevManifest, NodeStatus, ContractItem } from '../types';

interface AgentConfigurationDockProps {
  devs: Record<string, DevManifest>;
  selectedNodeId: string | null;
  contracts: Record<string, ContractItem>;
  activeSlots: (string | null)[];
  onSelectNode: (nodeId: string) => void;
  onOpenEditorForNode: (nodeId: string) => void;
  onUpdateCapability?: (nodeId: string, skills: string[], mcpServers: string[], status: 'SEALED' | 'DRAFT', hash?: string) => void;
  onTriggerRun?: (nodeId: string) => void;
}

const AVAILABLE_SKILLS = [
  'React 18',
  'TypeScript',
  'Playwright',
  'Tailwind CSS',
  'Packaging & Tarball',
  'Rust Wasm Toolchain'
];

const AVAILABLE_MCP_SERVERS = [
  'Codebase Memory (CBM)',
  'Context7 Live Search',
  'Browser Automation',
  'Container Sandbox',
  'Test Executor'
];

export const AgentConfigurationDock: React.FC<AgentConfigurationDockProps> = ({
  devs,
  selectedNodeId,
  contracts,
  activeSlots,
  onSelectNode,
  onOpenEditorForNode,
  onUpdateCapability,
  onTriggerRun
}) => {
  const [isExpanded, setIsExpanded] = useState(true);
  
  const selectedNode = selectedNodeId ? devs[selectedNodeId] : (devs['DEV-042'] || Object.values(devs)[0]);

  // Local state for interactive skill/mcp selection if in draft
  const currentSkills = selectedNode?.capabilities.skills || ['React 18', 'TypeScript', 'Playwright'];
  const currentMcp = selectedNode?.capabilities.mcpServers || ['Codebase Memory (CBM)', 'Context7 Live Search'];
  const isSealed = selectedNode?.capabilities.status === 'SEALED';
  const capabilityHash = selectedNode?.capabilities.hash || (isSealed ? '82a7d4e9c18f3b6a90e2' : undefined);

  const toggleSkill = (skill: string) => {
    if (isSealed || selectedNode?.status === 'RUNNING') return;
    const next = currentSkills.includes(skill)
      ? currentSkills.filter(s => s !== skill)
      : [...currentSkills, skill];
    onUpdateCapability?.(selectedNode.nodeId, next, currentMcp, 'DRAFT');
  };

  const toggleMcp = (mcp: string) => {
    if (isSealed || selectedNode?.status === 'RUNNING') return;
    const next = currentMcp.includes(mcp)
      ? currentMcp.filter(m => m !== mcp)
      : [...currentMcp, mcp];
    onUpdateCapability?.(selectedNode.nodeId, currentSkills, next, 'DRAFT');
  };

  const handleSeal = () => {
    const pseudoHash = Math.random().toString(36).substring(2, 12) + Math.random().toString(36).substring(2, 12);
    onUpdateCapability?.(selectedNode.nodeId, currentSkills, currentMcp, 'SEALED', pseudoHash);
  };

  const handleUnseal = () => {
    if (selectedNode?.status === 'RUNNING') return;
    onUpdateCapability?.(selectedNode.nodeId, currentSkills, currentMcp, 'DRAFT', undefined);
  };

  const activeCount = activeSlots.filter(Boolean).length;

  return (
    <div className="bg-[#0D0D0D] border-t border-[#262626] flex flex-col select-none shrink-0 z-20 font-sans">
      {/* Top Dock Bar: Title, Concurrency Slots, Expand Toggle */}
      <div className="h-11 px-3 bg-[#0A0A0A] border-b border-[#262626] flex items-center justify-between overflow-x-auto scrollbar-none">
        {/* Left: Dock Label & Focus Node Badge */}
        <div className="flex items-center space-x-3 shrink-0">
          <button
            onClick={() => setIsExpanded(!isExpanded)}
            className="flex items-center space-x-1.5 px-2 py-1 bg-[#141414] hover:bg-[#262626] text-white rounded-xs border border-[#262626] text-xs font-mono font-bold transition-colors cursor-pointer"
            title={isExpanded ? 'Collapse Dock' : 'Expand Dock'}
          >
            {isExpanded ? <ChevronDown className="w-3.5 h-3.5" /> : <ChevronUp className="w-3.5 h-3.5" />}
            <span className="text-[11px] tracking-wide">AGENT DOCK</span>
          </button>

          {selectedNode && (
            <div className="flex items-center space-x-2 text-xs font-mono">
              <span className="text-[#525252]">|</span>
              <span className="text-[#737373] text-[11px]">FOCUS:</span>
              <span className="font-bold text-white px-1.5 py-0.5 bg-[#141414] rounded-xs border border-[#333333]">
                {selectedNode.nodeId}
              </span>
              <span className="text-[#D4D4D4] font-medium text-[11px] hidden sm:inline max-w-[160px] truncate font-sans">
                {selectedNode.title}
              </span>
              <span className={`text-[10px] px-1.5 py-0.2 rounded-xs border font-bold uppercase ${
                selectedNode.status === 'RUNNING' 
                  ? 'bg-blue-500/10 text-blue-400 border-blue-500/40' 
                  : selectedNode.status === 'PASS'
                  ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/30'
                  : selectedNode.status === 'BLOCKED'
                  ? 'bg-red-500/10 text-red-400 border-red-500/50'
                  : 'bg-[#141414] text-[#A3A3A3] border-[#262626]'
              }`}>
                {selectedNode.status}
              </span>
            </div>
          )}
        </div>

        {/* Center / Right: 4-Slot Active Concurrent Runs Track */}
        <div className="flex items-center space-x-2 shrink-0 ml-4">
          <div className="flex items-center space-x-1.5 text-xs font-mono mr-1">
            <span className="text-[10px] text-[#737373] font-bold uppercase">ACTIVE RUNS:</span>
            <span className="text-white font-bold px-1.5 py-0.2 bg-[#1C1C1C] rounded-xs border border-[#333333]">
              {activeCount} / 4
            </span>
          </div>

          {/* Slots 1 to 4 */}
          <div className="flex items-center space-x-1.5">
            {[1, 2, 3, 4].map(slotNum => {
              const assignedDevId = activeSlots[slotNum - 1];
              const assignedDev = assignedDevId ? devs[assignedDevId] : null;
              const isCurrent = assignedDevId === selectedNode?.nodeId;

              if (assignedDev) {
                const isAuditing = assignedDev.status === 'AUDITING' || assignedDev.status === 'AUDIT_READY';
                return (
                  <button
                    key={slotNum}
                    onClick={() => onSelectNode(assignedDev.nodeId)}
                    className={`flex items-center space-x-1.5 px-2 py-1 rounded-xs border text-[11px] font-mono cursor-pointer transition-all ${
                      isCurrent
                        ? 'bg-[#1A1A1A] border-white text-white shadow-xs'
                        : 'bg-[#141414] border-[#262626] text-[#A3A3A3] hover:border-[#525252] hover:text-white'
                    }`}
                    title={`Slot #${slotNum}: ${assignedDev.nodeId} (${isAuditing ? 'Fresh Claude Review' : 'Pi + Luna Worker'})`}
                  >
                    <span className={`w-1.5 h-1.5 rounded-full ${isAuditing ? 'bg-purple-400' : 'bg-blue-400 animate-pulse'}`} />
                    <span className="font-bold text-white">{assignedDev.nodeId}</span>
                    <span className="text-[9px] text-[#737373]">
                      {isAuditing ? 'Claude Review' : 'Pi+Luna'}
                    </span>
                  </button>
                );
              }

              return (
                <div
                  key={slotNum}
                  className="px-2 py-1 bg-[#0F0F0F] rounded-xs border border-dashed border-[#262626] text-[10px] font-mono text-[#525252]"
                >
                  SLOT {slotNum}: IDLE
                </div>
              );
            })}
          </div>
        </div>
      </div>

      {/* Expanded Agent Configuration Workspace */}
      {isExpanded && selectedNode && (
        <div className="p-3.5 bg-[#0D0D0D] border-b border-[#262626] overflow-y-auto max-h-[300px] scrollbar-thin scrollbar-thumb-[#262626]">
          {/* Node Scope & Boundary Header Strip */}
          <div className="mb-3 p-2 bg-[#121212] border border-[#262626] rounded-xs flex items-center justify-between text-xs font-mono">
            <div className="flex items-center space-x-3 truncate">
              <span className="text-[10px] font-bold text-[#737373] uppercase">NODE EXECUTION CONTEXT:</span>
              <span className="text-white font-bold">{selectedNode.nodeId}</span>
              <span className="text-[#525252]">|</span>
              <span className="text-[#A3A3A3] text-[11px] truncate font-sans">{selectedNode.goal}</span>
            </div>

            <div className="flex items-center space-x-2 shrink-0">
              <button
                onClick={() => onOpenEditorForNode(selectedNode.nodeId)}
                className="flex items-center space-x-1 px-2 py-0.5 bg-[#1C1C1C] hover:bg-[#262626] text-[#D4D4D4] hover:text-white rounded-xs border border-[#333333] text-[10px] font-mono transition-colors cursor-pointer"
              >
                <ExternalLink className="w-3 h-3" />
                <span>Open in DEV Editor</span>
              </button>
            </div>
          </div>

          {/* The Three Essential Agent Sections: Planner | Worker (with Skill/MCP & Sealing) | Reviewer */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-3 font-mono text-xs">
            
            {/* 1. PLANNER / SCHEDULER */}
            <div className="bg-[#121212] p-3 rounded-sm border border-[#262626] flex flex-col justify-between space-y-2.5">
              <div>
                <div className="flex items-center justify-between pb-1.5 border-b border-[#262626] mb-2">
                  <div className="flex items-center space-x-1.5">
                    <Bot className="w-3.5 h-3.5 text-cyan-400" />
                    <span className="font-bold text-white text-[11px] uppercase tracking-wider">
                      PLANNER / SCHEDULER
                    </span>
                  </div>
                  <span className="text-[9px] px-1.5 py-0.2 bg-cyan-500/10 text-cyan-400 border border-cyan-500/30 rounded-xs font-bold">
                    TASK READY
                  </span>
                </div>

                <div className="space-y-1.5 text-[11px]">
                  <div className="flex justify-between">
                    <span className="text-[#737373]">Model:</span>
                    <span className="text-white font-semibold">Claude 3.7 Sonnet</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-[#737373]">Role:</span>
                    <span className="text-[#D4D4D4]">Planning & Scheduling</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-[#737373]">Focus DEV:</span>
                    <span className="text-cyan-400 font-bold">{selectedNode.nodeId}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-[#737373]">Dependencies:</span>
                    <span className="text-[#D4D4D4]">
                      {selectedNode.dependsOn.length > 0 ? selectedNode.dependsOn.join(', ') : 'None (Root)'}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-[#737373]">Acceptance Specs:</span>
                    <span className="text-emerald-400 font-bold">
                      {selectedNode.acceptance.length} Acceptance Criteria
                    </span>
                  </div>
                </div>
              </div>

              <div className="p-2 bg-[#0A0A0A] rounded-xs border border-[#262626] text-[10px] text-[#737373] leading-relaxed">
                Planning discussions, scope freeze, and root-cause decisions are strictly directed via <strong className="text-[#A3A3A3]">YU Copilot</strong> on the right.
              </div>
            </div>

            {/* 2. WORKER CONFIGURATION & CAPABILITY SEALING */}
            <div className="bg-[#121212] p-3 rounded-sm border border-[#262626] flex flex-col justify-between space-y-2.5">
              <div>
                <div className="flex items-center justify-between pb-1.5 border-b border-[#262626] mb-2">
                  <div className="flex items-center space-x-1.5">
                    <Cpu className="w-3.5 h-3.5 text-blue-400" />
                    <span className="font-bold text-white text-[11px] uppercase tracking-wider">
                      WORKER (CONSTRUCTION)
                    </span>
                  </div>
                  <span className={`text-[9px] px-1.5 py-0.2 rounded-xs border font-bold uppercase ${
                    selectedNode.status === 'RUNNING'
                      ? 'bg-blue-500/10 text-blue-400 border-blue-500/40'
                      : isSealed
                      ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/30'
                      : 'bg-[#1C1C1C] text-[#A3A3A3] border-[#333333]'
                  }`}>
                    {selectedNode.status === 'RUNNING' ? 'RUNNING' : isSealed ? 'SEALED' : 'DRAFT'}
                  </span>
                </div>

                <div className="space-y-1 text-[11px] mb-2">
                  <div className="flex justify-between">
                    <span className="text-[#737373]">Runner / Model:</span>
                    <span className="text-white font-semibold">Pi Sandbox + Luna</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-[#737373]">Workspace:</span>
                    <span className="text-blue-400 font-bold">ISOLATED (Worktree)</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-[#737373]">Scope Bounds:</span>
                    <span className="text-[#D4D4D4] truncate max-w-[140px]" title={selectedNode.scope.allowed.join(', ')}>
                      {selectedNode.scope.allowed.join(', ')}
                    </span>
                  </div>
                </div>

                {/* Skills Toggle List */}
                <div className="space-y-1 pt-1.5 border-t border-[#1F1F1F]">
                  <div className="flex items-center justify-between text-[10px]">
                    <span className="text-[#737373] font-bold uppercase">SKILLS PROFILE:</span>
                    {isSealed && <span className="text-[9px] text-emerald-400 font-mono">🔒 Locked</span>}
                  </div>
                  <div className="grid grid-cols-2 gap-1 text-[10px]">
                    {AVAILABLE_SKILLS.map(skill => {
                      const isChecked = currentSkills.includes(skill);
                      return (
                        <button
                          key={skill}
                          type="button"
                          disabled={isSealed || selectedNode.status === 'RUNNING'}
                          onClick={() => toggleSkill(skill)}
                          className={`flex items-center space-x-1 px-1.5 py-0.5 rounded-xs border text-left cursor-pointer transition-colors ${
                            isChecked
                              ? 'bg-[#1C1C1C] border-blue-500/40 text-blue-300 font-medium'
                              : 'bg-[#0A0A0A] border-[#262626] text-[#525252] hover:text-[#737373]'
                          } ${isSealed || selectedNode.status === 'RUNNING' ? 'cursor-not-allowed opacity-90' : ''}`}
                        >
                          <span className={`w-2.5 h-2.5 rounded-2xs flex items-center justify-center border text-[8px] ${
                            isChecked ? 'border-blue-400 bg-blue-500 text-black' : 'border-[#404040] bg-transparent'
                          }`}>
                            {isChecked && '✓'}
                          </span>
                          <span className="truncate">{skill}</span>
                        </button>
                      );
                    })}
                  </div>
                </div>

                {/* MCP Servers Toggle List */}
                <div className="space-y-1 pt-1.5 border-t border-[#1F1F1F] mt-2">
                  <div className="flex items-center justify-between text-[10px]">
                    <span className="text-[#737373] font-bold uppercase">MCP CAPABILITIES:</span>
                  </div>
                  <div className="grid grid-cols-2 gap-1 text-[10px]">
                    {AVAILABLE_MCP_SERVERS.map(mcp => {
                      const isChecked = currentMcp.includes(mcp);
                      return (
                        <button
                          key={mcp}
                          type="button"
                          disabled={isSealed || selectedNode.status === 'RUNNING'}
                          onClick={() => toggleMcp(mcp)}
                          className={`flex items-center space-x-1 px-1.5 py-0.5 rounded-xs border text-left cursor-pointer transition-colors ${
                            isChecked
                              ? 'bg-[#1C1C1C] border-purple-500/40 text-purple-300 font-medium'
                              : 'bg-[#0A0A0A] border-[#262626] text-[#525252] hover:text-[#737373]'
                          } ${isSealed || selectedNode.status === 'RUNNING' ? 'cursor-not-allowed opacity-90' : ''}`}
                        >
                          <span className={`w-2.5 h-2.5 rounded-2xs flex items-center justify-center border text-[8px] ${
                            isChecked ? 'border-purple-400 bg-purple-500 text-black' : 'border-[#404040] bg-transparent'
                          }`}>
                            {isChecked && '✓'}
                          </span>
                          <span className="truncate">{mcp.split(' ')[0]}</span>
                        </button>
                      );
                    })}
                  </div>
                </div>
              </div>

              {/* Capability Lifecycle & Sealing Action */}
              <div className="pt-2 border-t border-[#1F1F1F]">
                {isSealed ? (
                  <div className="p-2 bg-[#0A0A0A] rounded-xs border border-emerald-500/30 flex items-center justify-between">
                    <div>
                      <div className="flex items-center space-x-1 text-emerald-400 font-bold text-[10px]">
                        <Lock className="w-3 h-3" />
                        <span>CAPABILITY SEALED (FINAL)</span>
                      </div>
                      <div className="text-[9px] text-[#737373] font-mono">
                        Hash: <span className="text-[#D4D4D4]">{capabilityHash?.substring(0, 16)}...</span>
                      </div>
                    </div>

                    {selectedNode.status !== 'RUNNING' && (
                      <button
                        onClick={handleUnseal}
                        className="px-2 py-1 bg-[#1C1C1C] hover:bg-[#262626] text-[#A3A3A3] hover:text-white rounded-xs border border-[#333333] text-[9px] font-mono transition-colors cursor-pointer"
                        title="Unseal to modify Skill/MCP"
                      >
                        Unseal (Draft)
                      </button>
                    )}
                  </div>
                ) : (
                  <div className="flex items-center space-x-2">
                    <button
                      onClick={handleSeal}
                      className="w-full flex items-center justify-center space-x-1.5 px-3 py-1.5 bg-white hover:bg-neutral-200 text-black font-bold rounded-xs text-[11px] font-mono transition-colors cursor-pointer"
                    >
                      <Lock className="w-3.5 h-3.5" />
                      <span>Seal Capability Profile</span>
                    </button>
                  </div>
                )}
              </div>
            </div>

            {/* 3. FINAL REVIEW (Fresh Claude) */}
            <div className="bg-[#121212] p-3 rounded-sm border border-[#262626] flex flex-col justify-between space-y-2.5">
              <div>
                <div className="flex items-center justify-between pb-1.5 border-b border-[#262626] mb-2">
                  <div className="flex items-center space-x-1.5">
                    <ShieldCheck className="w-3.5 h-3.5 text-purple-400" />
                    <span className="font-bold text-white text-[11px] uppercase tracking-wider">
                      FINAL REVIEW (CLAUDE)
                    </span>
                  </div>
                  <span className={`text-[9px] px-1.5 py-0.2 rounded-xs border font-bold uppercase ${
                    selectedNode.status === 'PASS'
                      ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/30'
                      : selectedNode.status === 'AUDITING'
                      ? 'bg-purple-500/10 text-purple-300 border-purple-500/40 animate-pulse'
                      : 'bg-[#1C1C1C] text-[#737373] border-[#333333]'
                  }`}>
                    {selectedNode.status === 'PASS' ? 'PASSED' : selectedNode.status === 'AUDITING' ? 'AUDITING' : 'WAITING'}
                  </span>
                </div>

                <div className="space-y-1.5 text-[11px] mb-2">
                  <div className="flex justify-between">
                    <span className="text-[#737373]">Model:</span>
                    <span className="text-white font-semibold">Claude 3.7 (Fresh Instance)</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-[#737373]">Access Mode:</span>
                    <span className="text-purple-300 font-bold">READ ONLY (Zero Write)</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-[#737373]">Audit Scope:</span>
                    <span className="text-[#D4D4D4]">Isolated Run Package</span>
                  </div>
                </div>

                {/* 4 Strict Isolation Guarantees */}
                <div className="space-y-1 pt-1.5 border-t border-[#1F1F1F]">
                  <div className="text-[10px] font-bold text-[#737373] uppercase mb-1">
                    STATELESS ISOLATION PROTOCOL:
                  </div>
                  <div className="grid grid-cols-2 gap-1 text-[10px]">
                    <div className="p-1 bg-[#0A0A0A] rounded-xs border border-purple-500/20 text-purple-300 flex items-center space-x-1">
                      <Check className="w-3 h-3 text-purple-400 shrink-0" />
                      <span>Fresh Context</span>
                    </div>
                    <div className="p-1 bg-[#0A0A0A] rounded-xs border border-purple-500/20 text-purple-300 flex items-center space-x-1">
                      <Check className="w-3 h-3 text-purple-400 shrink-0" />
                      <span>Read Only</span>
                    </div>
                    <div className="p-1 bg-[#0A0A0A] rounded-xs border border-purple-500/20 text-purple-300 flex items-center space-x-1">
                      <Check className="w-3 h-3 text-purple-400 shrink-0" />
                      <span>Current Run Only</span>
                    </div>
                    <div className="p-1 bg-[#0A0A0A] rounded-xs border border-purple-500/20 text-purple-300 flex items-center space-x-1">
                      <Check className="w-3 h-3 text-purple-400 shrink-0" />
                      <span>Unpolluted State</span>
                    </div>
                  </div>
                </div>
              </div>

              {/* Verdict Summary Footer */}
              <div className="p-2 bg-[#0A0A0A] rounded-xs border border-[#262626] text-[10px] text-[#A3A3A3]">
                {selectedNode.currentRun?.evidence.auditVerdict ? (
                  <div className="flex items-center justify-between">
                    <span className="text-emerald-400 font-bold">VERDICT: PASS (Signed)</span>
                    <span className="text-[#737373]">{selectedNode.currentRun.evidence.auditVerdict.evaluatedAt}</span>
                  </div>
                ) : (
                  <div className="text-[#737373]">
                    Awaits construction output & test receipts before launch.
                  </div>
                )}
              </div>
            </div>

          </div>
        </div>
      )}
    </div>
  );
};
