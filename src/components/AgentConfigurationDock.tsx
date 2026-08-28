import React, { useState } from 'react';
import { 
  ChevronUp, 
  ChevronDown, 
  Cpu, 
  ShieldCheck, 
  Lock, 
  ExternalLink,
  Bot,
  Check
} from 'lucide-react';
import { DevManifest, ContractItem } from '../types';

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
  activeSlots,
  onSelectNode,
  onOpenEditorForNode,
  onUpdateCapability
}) => {
  // Collapsed by default as per Quiet Control specifications
  const [isExpanded, setIsExpanded] = useState(false);
  
  const selectedNode = selectedNodeId ? devs[selectedNodeId] : (devs['DEV-042'] || Object.values(devs)[0]);

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
    <div className="bg-[#0B0B0C] border-t border-[rgba(255,255,255,0.075)] flex flex-col select-none shrink-0 z-20 font-sans">
      {/* Top Dock Bar (38px height): Focus Node & 4-Slot Concurrency */}
      <div className="h-[38px] px-4 bg-[#0E0E10] flex items-center justify-between overflow-x-auto scrollbar-none">
        {/* Left: Dock Label & Focus Node Badge */}
        <div className="flex items-center space-x-3 shrink-0">
          <button
            onClick={() => setIsExpanded(!isExpanded)}
            className="flex items-center space-x-1.5 px-2 py-1 bg-[rgba(255,255,255,0.04)] hover:bg-[rgba(255,255,255,0.08)] text-[rgba(255,255,255,0.8)] rounded-xs border border-[rgba(255,255,255,0.08)] text-xs font-sans font-medium transition-colors cursor-pointer"
            title={isExpanded ? 'Collapse Dock' : 'Expand Dock'}
          >
            {isExpanded ? <ChevronDown className="w-3.5 h-3.5" /> : <ChevronUp className="w-3.5 h-3.5" />}
            <span className="text-[11px]">Agent Configuration</span>
          </button>

          {selectedNode && (
            <div className="flex items-center space-x-2 text-xs font-sans">
              <span className="text-[rgba(255,255,255,0.2)]">|</span>
              <span className="text-[rgba(255,255,255,0.4)] text-[11px]">Focus:</span>
              <span className="font-mono text-white text-[11px] px-1.5 py-0.5 bg-[rgba(255,255,255,0.04)] rounded-xs border border-[rgba(255,255,255,0.1)]">
                {selectedNode.nodeId}
              </span>
              <span className="text-[rgba(255,255,255,0.7)] text-[11px] hidden sm:inline max-w-[150px] truncate">
                {selectedNode.title}
              </span>
            </div>
          )}
        </div>

        {/* Right: 4-Slot Active Concurrent Runs Track */}
        <div className="flex items-center space-x-2 shrink-0 ml-4">
          <div className="flex items-center space-x-1 text-xs font-mono mr-1">
            <span className="text-[10px] text-[rgba(255,255,255,0.4)] font-sans">Runs:</span>
            <span className="text-white text-[11px]">
              {activeCount}/4
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
                    className={`flex items-center space-x-1.5 px-2 py-0.5 rounded-xs border text-[11px] font-mono cursor-pointer transition-all ${
                      isCurrent
                        ? 'bg-[rgba(255,255,255,0.08)] border-[rgba(255,255,255,0.4)] text-white'
                        : 'bg-[rgba(255,255,255,0.02)] border-[rgba(255,255,255,0.075)] text-[rgba(255,255,255,0.6)] hover:text-white'
                    }`}
                    title={`Slot #${slotNum}: ${assignedDev.nodeId} (${isAuditing ? 'Claude Review' : 'Pi + Luna Worker'})`}
                  >
                    <span className={`w-1.5 h-1.5 rounded-full ${isAuditing ? 'bg-[#a487e8]' : 'bg-[#5e9cff] animate-quiet-pulse'}`} />
                    <span>{assignedDev.nodeId}</span>
                  </button>
                );
              }

              return (
                <div
                  key={slotNum}
                  className="px-2 py-0.5 bg-[rgba(255,255,255,0.01)] rounded-xs border border-dashed border-[rgba(255,255,255,0.06)] text-[10px] font-mono text-[rgba(255,255,255,0.25)]"
                >
                  Slot {slotNum}: Idle
                </div>
              );
            })}
          </div>
        </div>
      </div>

      {/* Expanded Agent Configuration Workspace (Flat layout) */}
      {isExpanded && selectedNode && (
        <div className="p-4 bg-[#0B0B0C] border-t border-[rgba(255,255,255,0.075)] overflow-y-auto max-h-[300px] scrollbar-thin">
          {/* Node Scope & Context Header Strip */}
          <div className="mb-3 pb-2.5 border-b border-[rgba(255,255,255,0.075)] flex items-center justify-between text-xs font-sans">
            <div className="flex items-center space-x-3 truncate">
              <span className="font-mono text-white font-semibold">{selectedNode.nodeId}</span>
              <span className="text-[rgba(255,255,255,0.2)]">|</span>
              <span className="text-[rgba(255,255,255,0.6)] text-[11px] truncate">{selectedNode.goal}</span>
            </div>

            <button
              onClick={() => onOpenEditorForNode(selectedNode.nodeId)}
              className="flex items-center space-x-1 px-2.5 py-1 bg-[rgba(255,255,255,0.04)] hover:bg-[rgba(255,255,255,0.08)] text-[rgba(255,255,255,0.8)] rounded-xs border border-[rgba(255,255,255,0.08)] text-[11px] font-sans transition-colors cursor-pointer shrink-0"
            >
              <ExternalLink className="w-3 h-3" />
              <span>Open in DEV Editor</span>
            </button>
          </div>

          {/* Three Roles: Planner | Worker | Reviewer */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-xs font-sans">
            
            {/* 1. PLANNER */}
            <div className="p-3 bg-[rgba(255,255,255,0.02)] rounded-xs border border-[rgba(255,255,255,0.075)] flex flex-col justify-between space-y-3">
              <div>
                <div className="flex items-center justify-between pb-2 border-b border-[rgba(255,255,255,0.06)] mb-2">
                  <div className="flex items-center space-x-1.5">
                    <Bot className="w-3.5 h-3.5 text-[rgba(255,255,255,0.7)]" />
                    <span className="font-medium text-white text-[11px]">Planner / Scheduler</span>
                  </div>
                  <span className="text-[9px] font-mono px-1.5 py-0.2 bg-[rgba(255,255,255,0.04)] text-[rgba(255,255,255,0.7)] border border-[rgba(255,255,255,0.08)] rounded-xs">
                    Claude 3.7
                  </span>
                </div>

                <div className="space-y-1.5 text-[11px]">
                  <div className="flex justify-between">
                    <span className="text-[rgba(255,255,255,0.4)]">Focus Node:</span>
                    <span className="font-mono text-white">{selectedNode.nodeId}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-[rgba(255,255,255,0.4)]">Dependencies:</span>
                    <span className="text-[rgba(255,255,255,0.8)] font-mono">
                      {selectedNode.dependsOn.length > 0 ? selectedNode.dependsOn.join(', ') : 'None (Root)'}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-[rgba(255,255,255,0.4)]">Acceptance Specs:</span>
                    <span className="text-[rgba(255,255,255,0.8)]">
                      {selectedNode.acceptance.length} Criteria Defined
                    </span>
                  </div>
                </div>
              </div>

              <div className="text-[10px] text-[rgba(255,255,255,0.4)] leading-relaxed">
                Scope freeze and decisions managed via YU Copilot.
              </div>
            </div>

            {/* 2. WORKER CONFIGURATION & CAPABILITY SEALING */}
            <div className="p-3 bg-[rgba(255,255,255,0.02)] rounded-xs border border-[rgba(255,255,255,0.075)] flex flex-col justify-between space-y-3">
              <div>
                <div className="flex items-center justify-between pb-2 border-b border-[rgba(255,255,255,0.06)] mb-2">
                  <div className="flex items-center space-x-1.5">
                    <Cpu className="w-3.5 h-3.5 text-[rgba(255,255,255,0.7)]" />
                    <span className="font-medium text-white text-[11px]">Worker (Pi + Luna)</span>
                  </div>
                  <span className={`text-[9px] font-mono px-1.5 py-0.2 rounded-xs border ${
                    isSealed
                      ? 'bg-[rgba(85,201,139,0.08)] text-[#55c98b] border-[rgba(85,201,139,0.3)]'
                      : 'bg-[rgba(255,255,255,0.04)] text-[rgba(255,255,255,0.6)] border-[rgba(255,255,255,0.08)]'
                  }`}>
                    {isSealed ? 'SEALED' : 'DRAFT'}
                  </span>
                </div>

                {/* Skills Profile Chips */}
                <div className="space-y-1 mb-2">
                  <div className="text-[10px] text-[rgba(255,255,255,0.4)] font-medium">Skills Profile:</div>
                  <div className="flex flex-wrap gap-1">
                    {AVAILABLE_SKILLS.map(skill => {
                      const isChecked = currentSkills.includes(skill);
                      return (
                        <button
                          key={skill}
                          type="button"
                          disabled={isSealed || selectedNode.status === 'RUNNING'}
                          onClick={() => toggleSkill(skill)}
                          className={`px-1.5 py-0.5 rounded-xs border text-[10px] transition-colors ${
                            isChecked
                              ? 'bg-[rgba(255,255,255,0.08)] border-[rgba(255,255,255,0.3)] text-white'
                              : 'bg-transparent border-[rgba(255,255,255,0.06)] text-[rgba(255,255,255,0.35)] hover:text-[rgba(255,255,255,0.7)]'
                          }`}
                        >
                          {skill}
                        </button>
                      );
                    })}
                  </div>
                </div>

                {/* MCP Capabilities */}
                <div className="space-y-1">
                  <div className="text-[10px] text-[rgba(255,255,255,0.4)] font-medium">MCP Capabilities:</div>
                  <div className="flex flex-wrap gap-1">
                    {AVAILABLE_MCP_SERVERS.map(mcp => {
                      const isChecked = currentMcp.includes(mcp);
                      return (
                        <button
                          key={mcp}
                          type="button"
                          disabled={isSealed || selectedNode.status === 'RUNNING'}
                          onClick={() => toggleMcp(mcp)}
                          className={`px-1.5 py-0.5 rounded-xs border text-[10px] transition-colors ${
                            isChecked
                              ? 'bg-[rgba(255,255,255,0.08)] border-[rgba(255,255,255,0.3)] text-white'
                              : 'bg-transparent border-[rgba(255,255,255,0.06)] text-[rgba(255,255,255,0.35)] hover:text-[rgba(255,255,255,0.7)]'
                          }`}
                        >
                          {mcp.split(' ')[0]}
                        </button>
                      );
                    })}
                  </div>
                </div>
              </div>

              {/* Sealing Action */}
              <div className="pt-2 border-t border-[rgba(255,255,255,0.06)]">
                {isSealed ? (
                  <div className="flex items-center justify-between text-[10px]">
                    <div className="flex items-center space-x-1 text-[#55c98b] font-mono">
                      <Lock className="w-3 h-3" />
                      <span>{capabilityHash?.substring(0, 10)}...</span>
                    </div>
                    {selectedNode.status !== 'RUNNING' && (
                      <button
                        onClick={handleUnseal}
                        className="text-[10px] text-[rgba(255,255,255,0.5)] hover:text-white underline cursor-pointer"
                      >
                        Unseal
                      </button>
                    )}
                  </div>
                ) : (
                  <button
                    onClick={handleSeal}
                    className="w-full py-1 bg-[rgba(255,255,255,0.08)] hover:bg-[rgba(255,255,255,0.14)] text-white rounded-xs text-[11px] font-sans border border-[rgba(255,255,255,0.15)] transition-colors cursor-pointer"
                  >
                    Seal Capability Profile
                  </button>
                )}
              </div>
            </div>

            {/* 3. FINAL REVIEW (Fresh Claude) */}
            <div className="p-3 bg-[rgba(255,255,255,0.02)] rounded-xs border border-[rgba(255,255,255,0.075)] flex flex-col justify-between space-y-3">
              <div>
                <div className="flex items-center justify-between pb-2 border-b border-[rgba(255,255,255,0.06)] mb-2">
                  <div className="flex items-center space-x-1.5">
                    <ShieldCheck className="w-3.5 h-3.5 text-[rgba(255,255,255,0.7)]" />
                    <span className="font-medium text-white text-[11px]">Final Review (Fresh Claude)</span>
                  </div>
                  <span className={`text-[9px] font-mono px-1.5 py-0.2 rounded-xs border ${
                    selectedNode.status === 'PASS'
                      ? 'bg-[rgba(85,201,139,0.08)] text-[#55c98b] border-[rgba(85,201,139,0.3)]'
                      : 'bg-[rgba(255,255,255,0.04)] text-[rgba(255,255,255,0.5)] border-[rgba(255,255,255,0.08)]'
                  }`}>
                    {selectedNode.status === 'PASS' ? 'PASSED' : 'WAITING'}
                  </span>
                </div>

                <div className="space-y-1.5 text-[11px]">
                  <div className="flex justify-between">
                    <span className="text-[rgba(255,255,255,0.4)]">Access:</span>
                    <span className="text-[rgba(255,255,255,0.8)]">Read Only</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-[rgba(255,255,255,0.4)]">Scope:</span>
                    <span className="text-[rgba(255,255,255,0.8)]">Current Run Artifacts</span>
                  </div>
                </div>

                <div className="mt-2.5 pt-2 border-t border-[rgba(255,255,255,0.06)] space-y-1">
                  <div className="text-[10px] text-[rgba(255,255,255,0.4)] font-medium">Isolation Protocol:</div>
                  <div className="grid grid-cols-2 gap-1 text-[10px] text-[rgba(255,255,255,0.7)]">
                    <div className="flex items-center space-x-1">
                      <Check className="w-3 h-3 text-[rgba(255,255,255,0.4)] shrink-0" />
                      <span>Fresh Context</span>
                    </div>
                    <div className="flex items-center space-x-1">
                      <Check className="w-3 h-3 text-[rgba(255,255,255,0.4)] shrink-0" />
                      <span>Zero Write</span>
                    </div>
                  </div>
                </div>
              </div>

              <div className="text-[10px] text-[rgba(255,255,255,0.4)]">
                {selectedNode.currentRun?.evidence.auditVerdict ? (
                  <span className="text-[#55c98b] font-mono">Verdict: PASS (Signed)</span>
                ) : (
                  <span>Awaits worker construction and evidence receipts.</span>
                )}
              </div>
            </div>

          </div>
        </div>
      )}
    </div>
  );
};

