import React, { useState, useEffect } from 'react';
import { 
  CheckSquare, 
  Square, 
  ShieldCheck, 
  FileCode, 
  Lock, 
  CheckCircle2, 
  AlertTriangle, 
  Layers, 
  Save, 
  Eye, 
  Terminal,
  FileCheck,
  Cpu
} from 'lucide-react';
import { DevManifest, ContractItem } from '../types';
import { EvidenceViewer } from './EvidenceViewer';

interface DevEditorProps {
  node: DevManifest;
  contracts: Record<string, ContractItem>;
  onUpdateDev: (updated: DevManifest) => void;
  onConfirmDev: (nodeId: string, confirmed: boolean) => void;
}

export const DevEditor: React.FC<DevEditorProps> = ({
  node,
  contracts,
  onUpdateDev,
  onConfirmDev
}) => {
  const [activeTab, setActiveTab] = useState<'manifest' | 'evidence' | 'contract' | 'code'>('manifest');
  const [goal, setGoal] = useState(node.goal);
  const [title, setTitle] = useState(node.title);
  const [hasUnsavedChanges, setHasUnsavedChanges] = useState(false);

  useEffect(() => {
    setGoal(node.goal);
    setTitle(node.title);
    setHasUnsavedChanges(false);
  }, [node.nodeId, node.goal, node.title]);

  const handleFieldChange = (newGoal: string, newTitle: string) => {
    setGoal(newGoal);
    setTitle(newTitle);
    setHasUnsavedChanges(true);

    // Rule 21: If an already confirmed DEV is modified, automatically cancel confirmation
    if (node.isConfirmed) {
      onUpdateDev({
        ...node,
        goal: newGoal,
        title: newTitle,
        isConfirmed: false,
        status: 'DRAFT'
      });
    }
  };

  const handleSave = () => {
    onUpdateDev({
      ...node,
      goal,
      title
    });
    setHasUnsavedChanges(false);
  };

  const selectedContract = contracts[node.requiredContracts[0]] || Object.values(contracts)[0];

  return (
    <div className="w-full h-full bg-[#0A0A0A] flex flex-col overflow-hidden select-none font-sans">
      {/* Editor Sub-Header Tabs */}
      <div className="h-10 bg-[#0D0D0D] border-b border-[#262626] px-4 flex items-center justify-between shrink-0">
        <div className="flex items-center space-x-1">
          <button
            onClick={() => setActiveTab('manifest')}
            className={`px-3 py-1.5 text-xs font-mono rounded-t-xs transition-colors cursor-pointer flex items-center space-x-1.5 ${
              activeTab === 'manifest'
                ? 'bg-[#141414] text-white font-bold border-t-2 border-white'
                : 'text-[#A3A3A3] hover:text-white'
            }`}
          >
            <FileCode className="w-3.5 h-3.5 text-blue-400" />
            <span>{node.nodeId}.dev.md</span>
          </button>

          <button
            onClick={() => setActiveTab('evidence')}
            className={`px-3 py-1.5 text-xs font-mono rounded-t-xs transition-colors cursor-pointer flex items-center space-x-1.5 ${
              activeTab === 'evidence'
                ? 'bg-[#141414] text-white font-bold border-t-2 border-purple-400'
                : 'text-[#A3A3A3] hover:text-white'
            }`}
          >
            <ShieldCheck className="w-3.5 h-3.5 text-purple-400" />
            <span>
              Evidence Package {node.currentRun ? `(${node.currentRun.runId})` : node.historyRuns[0] ? `(${node.historyRuns[0].runId})` : ''}
            </span>
          </button>

          <button
            onClick={() => setActiveTab('contract')}
            className={`px-3 py-1.5 text-xs font-mono rounded-t-xs transition-colors cursor-pointer flex items-center space-x-1.5 ${
              activeTab === 'contract'
                ? 'bg-[#141414] text-white font-bold border-t-2 border-cyan-400'
                : 'text-[#A3A3A3] hover:text-white'
            }`}
          >
            <Lock className="w-3.5 h-3.5 text-cyan-400" />
            <span>Contract Viewer</span>
          </button>
        </div>

        {/* Action Controls */}
        <div className="flex items-center space-x-2">
          {hasUnsavedChanges && (
            <button
              onClick={handleSave}
              className="flex items-center space-x-1 px-2.5 py-1 bg-white hover:bg-neutral-200 text-black rounded-xs text-xs font-mono font-bold transition-colors cursor-pointer"
            >
              <Save className="w-3 h-3" />
              <span>Save Draft</span>
            </button>
          )}

          {/* Safety Gate Confirmation Checkbox */}
          <button
            onClick={() => onConfirmDev(node.nodeId, !node.isConfirmed)}
            className={`flex items-center space-x-2 px-3 py-1 rounded-xs text-xs font-mono transition-colors cursor-pointer border ${
              node.isConfirmed
                ? 'bg-emerald-500/10 text-emerald-300 border-emerald-500/40 hover:bg-emerald-500/20'
                : 'bg-amber-500/10 text-amber-300 border-amber-500/30 hover:bg-amber-500/20'
            }`}
          >
            {node.isConfirmed ? (
              <CheckSquare className="w-4 h-4 text-emerald-400" />
            ) : (
              <Square className="w-4 h-4 text-amber-400" />
            )}
            <span className="font-bold">
              {node.isConfirmed ? 'CONFIRMED (Ready for DAG)' : 'CONFIRM DEV (Safety Gate)'}
            </span>
          </button>
        </div>
      </div>

      {/* Tab Body */}
      <div className="flex-1 overflow-y-auto p-6 scrollbar-thin scrollbar-thumb-[#262626]">
        {activeTab === 'manifest' && (
          <div className="max-w-4xl mx-auto space-y-5">
            {/* Header Banner */}
            <div className="bg-[#121212] p-4 rounded-sm border border-[#262626]">
              <div className="flex items-center justify-between mb-2">
                <div className="flex items-center space-x-2 font-mono">
                  <span className="text-xs px-2 py-0.5 bg-[#1C1C1C] text-blue-400 border border-blue-500/30 rounded-xs font-bold">
                    {node.nodeId}
                  </span>
                  <span className="text-xs text-[#737373]">Node Construction Manifest</span>
                </div>
                <div className="flex items-center space-x-2 font-mono text-xs">
                  <span className="text-[#737373]">STATUS:</span>
                  <span className="px-2 py-0.5 rounded-xs bg-[#1C1C1C] border border-[#262626] text-white font-bold">
                    {node.status}
                  </span>
                </div>
              </div>

              <input
                type="text"
                value={title}
                onChange={e => handleFieldChange(goal, e.target.value)}
                className="w-full text-lg font-bold text-white bg-transparent border-b border-transparent hover:border-[#404040] focus:border-white outline-none transition-colors py-1 font-mono"
                placeholder="DEV Title"
              />
            </div>

            {/* Section 1: 目标 (Goal) */}
            <div className="bg-[#121212] p-4 rounded-sm border border-[#262626] space-y-2">
              <div className="text-xs font-bold text-[#A3A3A3] uppercase tracking-wider font-mono flex items-center space-x-1.5">
                <span className="w-1.5 h-1.5 rounded-full bg-blue-400"></span>
                <span>1. 施工目标 (Goal)</span>
              </div>
              <textarea
                value={goal}
                onChange={e => handleFieldChange(e.target.value, title)}
                rows={3}
                className="w-full bg-[#0A0A0A] border border-[#262626] focus:border-white rounded-sm p-2.5 text-xs text-[#E5E5E5] font-mono leading-relaxed outline-none"
              />
            </div>

            {/* Section 2: 前置与依赖来源 (Preconditions & Sources) */}
            <div className="bg-[#121212] p-4 rounded-sm border border-[#262626] space-y-3">
              <div className="text-xs font-bold text-[#A3A3A3] uppercase tracking-wider font-mono flex items-center space-x-1.5">
                <span className="w-1.5 h-1.5 rounded-full bg-cyan-400"></span>
                <span>2. 前置与依赖来源 (Preconditions & Sources)</span>
              </div>

              <div className="grid grid-cols-2 gap-4 text-xs font-mono">
                <div className="bg-[#0A0A0A] p-3 rounded-sm border border-[#262626]">
                  <span className="text-[#737373] font-semibold block mb-1">DEPENDS ON (NODES):</span>
                  {node.dependsOn.length > 0 ? (
                    <div className="flex flex-wrap gap-1.5">
                      {node.dependsOn.map(dep => (
                        <span key={dep} className="px-2 py-0.5 bg-[#141414] text-emerald-400 rounded-xs border border-emerald-500/30">
                          {dep} (PASS)
                        </span>
                      ))}
                    </div>
                  ) : (
                    <span className="text-[#525252] italic">None (Root Node)</span>
                  )}
                </div>

                <div className="bg-[#0A0A0A] p-3 rounded-sm border border-[#262626]">
                  <span className="text-[#737373] font-semibold block mb-1">REQUIRED CONTRACTS:</span>
                  {node.requiredContracts.length > 0 ? (
                    <div className="flex flex-wrap gap-1.5">
                      {node.requiredContracts.map(ctr => (
                        <span key={ctr} className="px-2 py-0.5 bg-[#141414] text-cyan-300 rounded-xs border border-cyan-500/30 flex items-center space-x-1">
                          <Lock className="w-2.5 h-2.5" />
                          <span>{ctr}</span>
                        </span>
                      ))}
                    </div>
                  ) : (
                    <span className="text-[#525252] italic">No external contracts</span>
                  )}
                </div>
              </div>
            </div>

            {/* Section 3: 施工计划 (Construction Plan) */}
            <div className="bg-[#121212] p-4 rounded-sm border border-[#262626] space-y-2">
              <div className="text-xs font-bold text-[#A3A3A3] uppercase tracking-wider font-mono flex items-center space-x-1.5">
                <span className="w-1.5 h-1.5 rounded-full bg-purple-400"></span>
                <span>3. 施工任务清单 (Construction Tasks)</span>
              </div>
              <div className="space-y-1.5 text-xs font-mono bg-[#0A0A0A] p-3 rounded-sm border border-[#262626]">
                {node.constructionPlan.map((task, idx) => (
                  <div key={idx} className="flex items-start space-x-2 text-[#D4D4D4]">
                    <span className="text-[#525252] select-none">{idx + 1}.</span>
                    <span>{task}</span>
                  </div>
                ))}
              </div>
            </div>

            {/* Section 4: 验收标准 (Acceptance Criteria) */}
            <div className="bg-[#121212] p-4 rounded-sm border border-[#262626] space-y-2">
              <div className="text-xs font-bold text-[#A3A3A3] uppercase tracking-wider font-mono flex items-center space-x-1.5">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-400"></span>
                <span>4. 验收标准 (Acceptance Criteria)</span>
              </div>
              <div className="space-y-2 bg-[#0A0A0A] p-3 rounded-sm border border-[#262626] text-xs font-mono">
                {node.acceptance.map(ac => (
                  <div key={ac.id} className="flex items-center justify-between p-1.5 bg-[#141414] rounded-sm border border-[#262626]">
                    <div className="flex items-center space-x-2">
                      <span className={`w-2 h-2 rounded-full ${ac.passed ? 'bg-emerald-400' : 'bg-[#525252]'}`} />
                      <span className="font-bold text-[#737373]">{ac.id}:</span>
                      <span className="text-[#E5E5E5]">{ac.description}</span>
                    </div>
                    {ac.testReference && (
                      <span className="text-[10px] text-cyan-400 bg-[#1C1C1C] px-1.5 py-0.5 rounded-xs border border-cyan-500/30">
                        {ac.testReference}
                      </span>
                    )}
                  </div>
                ))}
              </div>
            </div>

            {/* Section 5: 禁止项 (Forbidden Constraints) */}
            <div className="bg-[#121212] p-4 rounded-sm border border-[#262626] space-y-2">
              <div className="text-xs font-bold text-[#A3A3A3] uppercase tracking-wider font-mono flex items-center space-x-1.5">
                <span className="w-1.5 h-1.5 rounded-full bg-red-400"></span>
                <span>5. 禁止项与安全隔离 (Forbidden Constraints)</span>
              </div>
              <div className="space-y-1.5 text-xs font-mono bg-[#141414] p-3 rounded-sm border border-red-500/30 text-red-300">
                {node.forbiddenItems.map((item, idx) => (
                  <div key={idx} className="flex items-start space-x-2">
                    <span className="text-red-500">✕</span>
                    <span>{item}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        {activeTab === 'evidence' && (
          <EvidenceViewer node={node} />
        )}

        {activeTab === 'contract' && (
          <div className="max-w-4xl mx-auto space-y-4">
            <div className="bg-[#121212] p-3 rounded-sm border border-[#262626] flex items-center justify-between font-mono text-xs">
              <div className="flex items-center space-x-2">
                <Lock className="w-4 h-4 text-cyan-400" />
                <span className="font-bold text-white">{selectedContract.name}</span>
                <span className="text-[#737373]">({selectedContract.version})</span>
              </div>
              <div className="flex items-center space-x-2">
                <span className="text-[#737373]">HASH:</span>
                <span className="text-cyan-400 bg-[#1C1C1C] px-2 py-0.5 rounded-xs border border-cyan-500/30">
                  {selectedContract.hash}
                </span>
              </div>
            </div>

            <pre className="bg-[#0A0A0A] p-4 rounded-sm border border-[#262626] font-mono text-xs text-[#D4D4D4] leading-relaxed overflow-x-auto">
              {selectedContract.content}
            </pre>
          </div>
        )}
      </div>
    </div>
  );
};
