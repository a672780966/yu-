import React, { useState } from 'react';
import { 
  ChevronUp, 
  ChevronDown, 
  Lock, 
  ExternalLink,
  Bot,
  Cpu,
  ShieldCheck,
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
  const [isConfiguring, setIsConfiguring] = useState(false);
  
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
    setIsConfiguring(false);
  };

  const handleUnseal = () => {
    if (selectedNode?.status === 'RUNNING') return;
    onUpdateCapability?.(selectedNode.nodeId, currentSkills, currentMcp, 'DRAFT', undefined);
    setIsConfiguring(true);
  };

  const activeCount = activeSlots.filter(Boolean).length;

  return (
    <div className="bg-[#0B0B0C] border-t border-[rgba(255,255,255,0.075)] flex flex-col select-none shrink-0 z-20 font-sans">
      {/* Top Dock Bar (48px height): Quiet summary of Focus pipeline & 4-Slot dot indicator */}
      <div className="h-12 px-4 bg-[#0E0E10] flex items-center justify-between overflow-x-auto scrollbar-none">
        {/* Left: Focus Pipeline summary */}
        <div className="flex items-center space-x-3 shrink-0">
          <button
            onClick={() => setIsExpanded(!isExpanded)}
            className="flex items-center space-x-1.5 px-2 py-1 bg-[rgba(255,255,255,0.04)] hover:bg-[rgba(255,255,255,0.08)] text-[rgba(255,255,255,0.8)] rounded-xs border border-[rgba(255,255,255,0.08)] text-xs font-sans font-medium transition-colors cursor-pointer"
            title={isExpanded ? 'Collapse Dock' : 'Expand Dock'}
          >
            {isExpanded ? <ChevronDown className="w-3.5 h-3.5" /> : <ChevronUp className="w-3.5 h-3.5" />}
            <span className="text-[11px]">Agent Pipeline</span>
          </button>

          {selectedNode && (
            <div className="flex items-center space-x-2 text-xs font-sans">
              <span className="font-mono text-white text-[11px] font-medium">
                {selectedNode.nodeId}
              </span>
              <span className="text-[rgba(255,255,255,0.3)]">·</span>
              {/* Compact Pipeline Flow: Claude ✓ → Pi+Luna ● → Claude ○ */}
              <div className="flex items-center space-x-1.5 text-[11px] font-sans text-[rgba(255,255,255,0.65)]">
                <span className="text-[rgba(255,255,255,0.9)]">Claude <span className="text-[#55c98b]">✓</span></span>
                <span className="text-[rgba(255,255,255,0.25)]">→</span>
                <span className="text-[rgba(255,255,255,0.9)]">
                  Pi + Luna <span className="inline-block w-1.5 h-1.5 rounded-full bg-[#5e9cff] animate-quiet-pulse ml-0.5" />
                </span>
                <span className="text-[rgba(255,255,255,0.25)]">→</span>
                <span className="text-[rgba(255,255,255,0.5)]">Claude <span className="text-[rgba(255,255,255,0.3)]">○</span></span>
              </div>
            </div>
          )}
        </div>

        {/* Right: 4-Slot Dot Indicators (Runs ● ● ● ○ 3/4) */}
        <div className="flex items-center space-x-3 shrink-0 ml-4">
          <div className="flex items-center space-x-2 text-xs font-sans">
            <span className="text-[11px] text-[rgba(255,255,255,0.4)]">Runs</span>
            
            {/* 4 Dots */}
            <div className="flex items-center space-x-1.5">
              {[1, 2, 3, 4].map(slotNum => {
                const assignedDevId = activeSlots[slotNum - 1];
                const assignedDev = assignedDevId ? devs[assignedDevId] : null;
                const isAuditing = assignedDev?.status === 'AUDITING' || assignedDev?.status === 'AUDIT_READY';
                const isRunning = assignedDev?.status === 'RUNNING';

                let dotColorClass = 'bg-[rgba(255,255,255,0.15)]';
                if (isRunning) dotColorClass = 'bg-[#5e9cff] animate-quiet-pulse';
                else if (isAuditing) dotColorClass = 'bg-[#a487e8]';

                return (
                  <button
                    key={slotNum}
                    onClick={() => {
                      if (assignedDevId) onSelectNode(assignedDevId);
                    }}
                    title={assignedDev ? `${assignedDev.nodeId}: ${assignedDev.title} (${isRunning ? 'Running' : 'Auditing'})` : `Slot #${slotNum}: Idle`}
                    className={`w-2.5 h-2.5 rounded-full transition-transform hover:scale-125 cursor-pointer ${dotColorClass}`}
                  />
                );
              })}
            </div>

            <span className="text-[11px] font-mono text-[rgba(255,255,255,0.6)]">
              {activeCount}/4
            </span>
          </div>
        </div>
      </div>

      {/* Expanded Agent Configuration Workspace (Flat 3-Column Plane with 1px separators) */}
      {isExpanded && selectedNode && (
        <div className="p-4 bg-[#0B0B0C] border-t border-[rgba(255,255,255,0.075)] overflow-y-auto max-h-[280px] scrollbar-thin">
          {/* Header Link */}
          <div className="mb-3 pb-2 border-b border-[rgba(255,255,255,0.06)] flex items-center justify-between text-xs font-sans">
            <div className="flex items-center space-x-2 truncate">
              <span className="font-mono text-white font-semibold">{selectedNode.nodeId}</span>
              <span className="text-[rgba(255,255,255,0.2)]">|</span>
              <span className="text-[rgba(255,255,255,0.6)] text-[11px] truncate">{selectedNode.title}</span>
            </div>

            <button
              onClick={() => onOpenEditorForNode(selectedNode.nodeId)}
              className="flex items-center space-x-1 px-2.5 py-0.5 bg-[rgba(255,255,255,0.04)] hover:bg-[rgba(255,255,255,0.08)] text-[rgba(255,255,255,0.8)] rounded-xs border border-[rgba(255,255,255,0.08)] text-[11px] font-sans transition-colors cursor-pointer shrink-0"
            >
              <ExternalLink className="w-3 h-3" />
              <span>Open in DEV Editor</span>
            </button>
          </div>

          {/* Three Roles: Claude Plan | Pi + Luna Build | Claude Review (Flat 3-Column with 1px vertical borders) */}
          <div className="grid grid-cols-1 md:grid-cols-3 divide-y md:divide-y-0 md:divide-x divide-[rgba(255,255,255,0.075)] text-xs font-sans">
            
            {/* Column 1: CLAUDE (Plan) */}
            <div className="py-2 md:py-0 md:pr-4 space-y-3">
              <div className="flex items-center justify-between pb-1.5 border-b border-[rgba(255,255,255,0.05)]">
                <div>
                  <div className="font-semibold text-white text-[12px]">Claude</div>
                  <div className="text-[10px] text-[rgba(255,255,255,0.4)]">Plan</div>
                </div>
                <span className="text-[10px] font-mono text-[#55c98b] font-medium">Ready</span>
              </div>

              <div className="space-y-2 text-[11px]">
                <div>
                  <div className="text-[10px] text-[rgba(255,255,255,0.4)] uppercase font-semibold mb-0.5">Dependencies</div>
                  <div className="font-mono text-[rgba(255,255,255,0.85)]">
                    {selectedNode.dependsOn.length > 0 ? selectedNode.dependsOn.join(', ') : 'None (Root Node)'}
                  </div>
                </div>
                <div>
                  <div className="text-[10px] text-[rgba(255,255,255,0.4)] uppercase font-semibold mb-0.5">Acceptance Criteria</div>
                  <div className="text-[rgba(255,255,255,0.7)]">{selectedNode.acceptance.length} Specs Defined</div>
                </div>
              </div>
            </div>

            {/* Column 2: PI + LUNA (Build) */}
            <div className="py-2 md:py-0 md:px-4 space-y-3">
              <div className="flex items-center justify-between pb-1.5 border-b border-[rgba(255,255,255,0.05)]">
                <div>
                  <div className="font-semibold text-white text-[12px]">Pi + Luna</div>
                  <div className="text-[10px] text-[rgba(255,255,255,0.4)]">Build</div>
                </div>
                <span className="text-[10px] font-mono text-[#5e9cff] font-medium flex items-center space-x-1">
                  <span className="w-1.5 h-1.5 rounded-full bg-[#5e9cff] animate-quiet-pulse" />
                  <span>Running</span>
                </span>
              </div>

              <div className="space-y-2 text-[11px]">
                {/* Skills Summary or Detailed Config */}
                <div>
                  <div className="flex items-center justify-between text-[10px] text-[rgba(255,255,255,0.4)] uppercase font-semibold mb-0.5">
                    <span>Skills ({currentSkills.length})</span>
                    {!isSealed && (
                      <button
                        onClick={() => setIsConfiguring(!isConfiguring)}
                        className="text-[10px] text-[rgba(255,255,255,0.6)] hover:text-white underline cursor-pointer"
                      >
                        {isConfiguring ? 'Done' : 'Configure'}
                      </button>
                    )}
                  </div>
                  {isConfiguring && !isSealed ? (
                    <div className="flex flex-wrap gap-1 mt-1">
                      {AVAILABLE_SKILLS.map(skill => {
                        const isChecked = currentSkills.includes(skill);
                        return (
                          <button
                            key={skill}
                            type="button"
                            onClick={() => toggleSkill(skill)}
                            className={`px-1.5 py-0.5 rounded-xs border text-[10px] transition-colors ${
                              isChecked
                                ? 'bg-[rgba(255,255,255,0.08)] border-[rgba(255,255,255,0.3)] text-white'
                                : 'bg-transparent border-[rgba(255,255,255,0.06)] text-[rgba(255,255,255,0.35)]'
                            }`}
                          >
                            {skill}
                          </button>
                        );
                      })}
                    </div>
                  ) : (
                    <div className="text-[rgba(255,255,255,0.85)] font-mono text-[11px]">
                      {currentSkills.join(' · ')}
                    </div>
                  )}
                </div>

                {/* MCP Summary */}
                <div>
                  <div className="text-[10px] text-[rgba(255,255,255,0.4)] uppercase font-semibold mb-0.5">
                    MCP Servers ({currentMcp.length})
                  </div>
                  <div className="text-[rgba(255,255,255,0.85)] font-mono text-[11px]">
                    {currentMcp.map(m => m.split(' ')[0]).join(' · ')}
                  </div>
                </div>

                {/* Capability Sealing */}
                <div>
                  <div className="text-[10px] text-[rgba(255,255,255,0.4)] uppercase font-semibold mb-0.5">Capability Gate</div>
                  <div className="flex items-center justify-between text-[10px]">
                    <span className="flex items-center space-x-1 text-[#55c98b] font-mono">
                      <Lock className="w-3 h-3" />
                      <span>{isSealed ? 'Sealed Profile' : 'Draft Profile'}</span>
                    </span>
                    {isSealed ? (
                      selectedNode.status !== 'RUNNING' && (
                        <button onClick={handleUnseal} className="text-[10px] text-[rgba(255,255,255,0.5)] hover:text-white underline cursor-pointer">
                          Unseal
                        </button>
                      )
                    ) : (
                      <button onClick={handleSeal} className="text-[10px] text-[rgba(255,255,255,0.8)] hover:text-white underline cursor-pointer">
                        Seal
                      </button>
                    )}
                  </div>
                </div>
              </div>
            </div>

            {/* Column 3: CLAUDE (Review) */}
            <div className="py-2 md:py-0 md:pl-4 space-y-3">
              <div className="flex items-center justify-between pb-1.5 border-b border-[rgba(255,255,255,0.05)]">
                <div>
                  <div className="font-semibold text-white text-[12px]">Claude</div>
                  <div className="text-[10px] text-[rgba(255,255,255,0.4)]">Review</div>
                </div>
                <span className="text-[10px] font-mono text-[rgba(255,255,255,0.5)] font-medium">Waiting</span>
              </div>

              <div className="space-y-2 text-[11px]">
                <div>
                  <div className="text-[10px] text-[rgba(255,255,255,0.4)] uppercase font-semibold mb-0.5">Review Context</div>
                  <div className="text-[rgba(255,255,255,0.7)]">Fresh Process · Read-only</div>
                </div>
                <div>
                  <div className="text-[10px] text-[rgba(255,255,255,0.4)] uppercase font-semibold mb-0.5">Verification</div>
                  <div className="text-[rgba(255,255,255,0.7)]">Current Run Receipts & Scope Hash</div>
                </div>
              </div>
            </div>

          </div>
        </div>
      )}
    </div>
  );
};

