import React, { useState, useEffect } from 'react';
import { 
  CheckSquare, 
  Square, 
  ShieldCheck, 
  FileCode, 
  Lock, 
  Save,
  Plus,
  Trash2,
  Check
} from 'lucide-react';
import { DevManifest, ContractItem } from '../types';
import { EvidenceViewer } from './EvidenceViewer';

interface DevEditorProps {
  node: DevManifest;
  contracts: Record<string, ContractItem>;
  onUpdateDev: (updated: DevManifest) => void;
  onConfirmDev: (nodeId: string, confirmed: boolean, fullDraft?: DevManifest) => void;
}

export const DevEditor: React.FC<DevEditorProps> = ({
  node,
  contracts,
  onUpdateDev,
  onConfirmDev
}) => {
  const [activeTab, setActiveTab] = useState<'manifest' | 'evidence' | 'contract'>('manifest');
  
  // Draft State representing the entire editable Manifest
  const [draft, setDraft] = useState<DevManifest>(node);
  const [hasUnsavedChanges, setHasUnsavedChanges] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [saveStatus, setSaveStatus] = useState<'saved' | 'saving' | 'dirty'>('saved');

  useEffect(() => {
    setDraft(node);
    setHasUnsavedChanges(false);
    setSaveStatus('saved');
  }, [node.nodeId]);

  const updateDraft = (patch: Partial<DevManifest>) => {
    const updated = { ...draft, ...patch };
    // If it was confirmed and we modify it, un-confirm it safely
    if (updated.isConfirmed) {
      updated.isConfirmed = false;
      updated.status = 'DRAFT';
    }
    setDraft(updated);
    setHasUnsavedChanges(true);
    setSaveStatus('dirty');
  };

  const handleSave = () => {
    setIsSaving(true);
    setSaveStatus('saving');
    setTimeout(() => {
      onUpdateDev(draft);
      setIsSaving(false);
      setHasUnsavedChanges(false);
      setSaveStatus('saved');
    }, 200);
  };

  const handleToggleConfirm = () => {
    if (isSaving) return;
    
    // Always persist latest draft before confirming
    const willConfirm = !draft.isConfirmed;
    const finalDraft: DevManifest = {
      ...draft,
      isConfirmed: willConfirm,
      status: willConfirm ? (draft.status === 'DRAFT' ? 'READY' : draft.status) : 'DRAFT'
    };
    
    onUpdateDev(finalDraft);
    onConfirmDev(node.nodeId, willConfirm, finalDraft);
    setDraft(finalDraft);
    setHasUnsavedChanges(false);
    setSaveStatus('saved');
  };

  const selectedContract = contracts[draft.requiredContracts[0]] || Object.values(contracts)[0];

  return (
    <div className="w-full h-full bg-[#0B0B0C] flex flex-col overflow-hidden select-none font-sans">
      {/* Editor Sub-Header Tabs (38px height, quiet border) */}
      <div className="h-[38px] bg-[#0E0E10] border-b border-[rgba(255,255,255,0.075)] px-4 flex items-center justify-between shrink-0">
        <div className="flex items-center h-full space-x-1">
          <button
            onClick={() => setActiveTab('manifest')}
            className={`h-full px-3 text-xs font-mono transition-colors cursor-pointer flex items-center space-x-1.5 border-b-2 ${
              activeTab === 'manifest'
                ? 'border-white text-white font-medium bg-[rgba(255,255,255,0.03)]'
                : 'border-transparent text-[rgba(255,255,255,0.45)] hover:text-white'
            }`}
          >
            <FileCode className="w-3.5 h-3.5" />
            <span>{node.nodeId}.dev.md</span>
          </button>

          <button
            onClick={() => setActiveTab('evidence')}
            className={`h-full px-3 text-xs font-mono transition-colors cursor-pointer flex items-center space-x-1.5 border-b-2 ${
              activeTab === 'evidence'
                ? 'border-white text-white font-medium bg-[rgba(255,255,255,0.03)]'
                : 'border-transparent text-[rgba(255,255,255,0.45)] hover:text-white'
            }`}
          >
            <ShieldCheck className="w-3.5 h-3.5" />
            <span>
              Evidence {draft.currentRun ? `(${draft.currentRun.runId})` : draft.historyRuns[0] ? `(${draft.historyRuns[0].runId})` : ''}
            </span>
          </button>

          <button
            onClick={() => setActiveTab('contract')}
            className={`h-full px-3 text-xs font-mono transition-colors cursor-pointer flex items-center space-x-1.5 border-b-2 ${
              activeTab === 'contract'
                ? 'border-white text-white font-medium bg-[rgba(255,255,255,0.03)]'
                : 'border-transparent text-[rgba(255,255,255,0.45)] hover:text-white'
            }`}
          >
            <Lock className="w-3.5 h-3.5" />
            <span>Contract Viewer</span>
          </button>
        </div>

        {/* Action Controls */}
        <div className="flex items-center space-x-3 text-xs font-sans">
          {/* Status badge */}
          <div className="flex items-center space-x-1 text-[11px] font-mono text-[rgba(255,255,255,0.4)]">
            {saveStatus === 'saving' && <span>Saving...</span>}
            {saveStatus === 'saved' && (
              <span className="flex items-center space-x-1 text-[rgba(255,255,255,0.4)]">
                <Check className="w-3 h-3 text-[#55c98b]" />
                <span>Draft Saved</span>
              </span>
            )}
            {saveStatus === 'dirty' && <span className="text-[#d5a94e]">Unsaved Changes</span>}
          </div>

          {hasUnsavedChanges && (
            <button
              onClick={handleSave}
              disabled={isSaving}
              className="flex items-center space-x-1 px-2.5 py-1 bg-white hover:bg-neutral-200 text-black rounded-xs text-xs font-medium transition-colors cursor-pointer disabled:opacity-50"
            >
              <Save className="w-3 h-3" />
              <span>Save Draft</span>
            </button>
          )}

          {/* Safety Gate Confirmation Checkbox */}
          <button
            onClick={handleToggleConfirm}
            disabled={isSaving}
            className={`flex items-center space-x-1.5 px-2.5 py-1 rounded-xs text-xs transition-colors cursor-pointer border ${
              draft.isConfirmed
                ? 'bg-[rgba(85,201,139,0.08)] text-[#55c98b] border-[rgba(85,201,139,0.3)]'
                : 'bg-[rgba(255,255,255,0.04)] text-[rgba(255,255,255,0.7)] border-[rgba(255,255,255,0.1)] hover:text-white'
            }`}
          >
            {draft.isConfirmed ? (
              <CheckSquare className="w-3.5 h-3.5 text-[#55c98b]" />
            ) : (
              <Square className="w-3.5 h-3.5 text-[rgba(255,255,255,0.4)]" />
            )}
            <span className="font-medium">
              {draft.isConfirmed ? 'Confirmed (Ready for DAG)' : 'Confirm DEV (Safety Gate)'}
            </span>
          </button>
        </div>
      </div>

      {/* Tab Body */}
      <div className="flex-1 overflow-y-auto p-6 scrollbar-thin">
        {activeTab === 'manifest' && (
          <div className="max-w-3xl mx-auto space-y-6">
            {/* Header Block */}
            <div className="p-4 bg-[#111113] rounded-xs border border-[rgba(255,255,255,0.075)] space-y-3">
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-2 font-mono">
                  <span className="text-xs px-2 py-0.5 bg-[rgba(255,255,255,0.05)] text-white border border-[rgba(255,255,255,0.1)] rounded-xs font-medium">
                    {draft.nodeId}
                  </span>
                  <span className="text-xs text-[rgba(255,255,255,0.4)] font-sans">Node Construction Manifest</span>
                </div>
                <div className="flex items-center space-x-2 text-xs font-sans">
                  <span className="text-[rgba(255,255,255,0.4)]">Status:</span>
                  <span className="px-2 py-0.5 rounded-xs bg-[rgba(255,255,255,0.04)] border border-[rgba(255,255,255,0.08)] text-white font-mono text-[11px]">
                    {draft.status}
                  </span>
                </div>
              </div>

              <input
                type="text"
                value={draft.title}
                onChange={e => updateDraft({ title: e.target.value })}
                className="w-full text-base font-semibold text-white bg-transparent border-b border-transparent hover:border-[rgba(255,255,255,0.2)] focus:border-[rgba(255,255,255,0.5)] outline-none transition-colors py-1 font-sans"
                placeholder="DEV Title"
              />
            </div>

            {/* Section 1: 施工目标 (Goal) */}
            <div className="p-4 bg-[#111113] rounded-xs border border-[rgba(255,255,255,0.075)] space-y-2">
              <div className="text-xs font-semibold text-[rgba(255,255,255,0.7)] font-sans flex items-center space-x-2">
                <span className="w-1.5 h-1.5 rounded-full bg-[rgba(255,255,255,0.5)]"></span>
                <span>1. 施工目标 (Goal)</span>
              </div>
              <textarea
                value={draft.goal}
                onChange={e => updateDraft({ goal: e.target.value })}
                rows={3}
                className="w-full bg-[#0E0E10] border border-[rgba(255,255,255,0.08)] focus:border-[rgba(255,255,255,0.4)] rounded-xs p-3 text-xs text-[rgba(255,255,255,0.9)] font-sans leading-relaxed outline-none"
              />
            </div>

            {/* Section 2: 前置与依赖来源 (Preconditions & Sources) */}
            <div className="p-4 bg-[#111113] rounded-xs border border-[rgba(255,255,255,0.075)] space-y-3">
              <div className="text-xs font-semibold text-[rgba(255,255,255,0.7)] font-sans flex items-center space-x-2">
                <span className="w-1.5 h-1.5 rounded-full bg-[rgba(255,255,255,0.5)]"></span>
                <span>2. 前置与依赖来源 (Preconditions & Sources)</span>
              </div>

              <div className="grid grid-cols-2 gap-4 text-xs">
                <div className="bg-[#0E0E10] p-3 rounded-xs border border-[rgba(255,255,255,0.06)]">
                  <span className="text-[rgba(255,255,255,0.4)] font-medium block mb-1 text-[11px]">DEPENDS ON (NODES):</span>
                  {draft.dependsOn.length > 0 ? (
                    <div className="flex flex-wrap gap-1.5">
                      {draft.dependsOn.map(dep => (
                        <span key={dep} className="px-2 py-0.5 bg-[rgba(255,255,255,0.04)] text-[rgba(255,255,255,0.85)] font-mono text-[11px] rounded-xs border border-[rgba(255,255,255,0.1)]">
                          {dep}
                        </span>
                      ))}
                    </div>
                  ) : (
                    <span className="text-[rgba(255,255,255,0.3)] italic text-[11px]">None (Root Node)</span>
                  )}
                </div>

                <div className="bg-[#0E0E10] p-3 rounded-xs border border-[rgba(255,255,255,0.06)]">
                  <span className="text-[rgba(255,255,255,0.4)] font-medium block mb-1 text-[11px]">REQUIRED CONTRACTS:</span>
                  {draft.requiredContracts.length > 0 ? (
                    <div className="flex flex-wrap gap-1.5">
                      {draft.requiredContracts.map(ctr => (
                        <span key={ctr} className="px-2 py-0.5 bg-[rgba(255,255,255,0.04)] text-[rgba(255,255,255,0.85)] font-mono text-[11px] rounded-xs border border-[rgba(255,255,255,0.1)] flex items-center space-x-1">
                          <Lock className="w-2.5 h-2.5 text-[rgba(255,255,255,0.5)]" />
                          <span>{ctr}</span>
                        </span>
                      ))}
                    </div>
                  ) : (
                    <span className="text-[rgba(255,255,255,0.3)] italic text-[11px]">No external contracts</span>
                  )}
                </div>
              </div>
            </div>

            {/* Section 3: 施工任务清单 (Construction Plan) */}
            <div className="p-4 bg-[#111113] rounded-xs border border-[rgba(255,255,255,0.075)] space-y-2">
              <div className="text-xs font-semibold text-[rgba(255,255,255,0.7)] font-sans flex items-center space-x-2">
                <span className="w-1.5 h-1.5 rounded-full bg-[rgba(255,255,255,0.5)]"></span>
                <span>3. 施工任务清单 (Construction Tasks)</span>
              </div>
              <div className="space-y-1.5 text-xs font-sans bg-[#0E0E10] p-3 rounded-xs border border-[rgba(255,255,255,0.06)]">
                {draft.constructionPlan.map((task, idx) => (
                  <div key={idx} className="flex items-start space-x-2 text-[rgba(255,255,255,0.8)]">
                    <span className="text-[rgba(255,255,255,0.3)] font-mono select-none">{idx + 1}.</span>
                    <span>{task}</span>
                  </div>
                ))}
              </div>
            </div>

            {/* Section 4: 验收标准 (Acceptance Criteria) */}
            <div className="p-4 bg-[#111113] rounded-xs border border-[rgba(255,255,255,0.075)] space-y-2">
              <div className="text-xs font-semibold text-[rgba(255,255,255,0.7)] font-sans flex items-center space-x-2">
                <span className="w-1.5 h-1.5 rounded-full bg-[rgba(255,255,255,0.5)]"></span>
                <span>4. 验收标准 (Acceptance Criteria)</span>
              </div>
              <div className="space-y-2 bg-[#0E0E10] p-3 rounded-xs border border-[rgba(255,255,255,0.06)] text-xs font-sans">
                {draft.acceptance.map(ac => (
                  <div key={ac.id} className="flex items-center justify-between p-2 bg-[#141416] rounded-xs border border-[rgba(255,255,255,0.06)]">
                    <div className="flex items-center space-x-2">
                      <span className={`w-1.5 h-1.5 rounded-full ${ac.passed ? 'bg-[#55c98b]' : 'bg-[rgba(255,255,255,0.2)]'}`} />
                      <span className="font-mono text-[11px] text-[rgba(255,255,255,0.4)]">{ac.id}:</span>
                      <span className="text-[rgba(255,255,255,0.85)]">{ac.description}</span>
                    </div>
                    {ac.testReference && (
                      <span className="text-[10px] font-mono text-[rgba(255,255,255,0.6)] bg-[rgba(255,255,255,0.04)] px-1.5 py-0.5 rounded-xs border border-[rgba(255,255,255,0.08)]">
                        {ac.testReference}
                      </span>
                    )}
                  </div>
                ))}
              </div>
            </div>

            {/* Section 5: 禁止项 (Forbidden Constraints) */}
            <div className="p-4 bg-[#111113] rounded-xs border border-[rgba(255,255,255,0.075)] space-y-2">
              <div className="text-xs font-semibold text-[rgba(255,255,255,0.7)] font-sans flex items-center space-x-2">
                <span className="w-1.5 h-1.5 rounded-full bg-[rgba(255,255,255,0.5)]"></span>
                <span>5. 禁止项与安全隔离 (Forbidden Constraints)</span>
              </div>
              <div className="space-y-1.5 text-xs font-sans bg-[#0E0E10] p-3 rounded-xs border border-[rgba(236,106,106,0.15)] text-[rgba(255,255,255,0.75)]">
                {draft.forbiddenItems.map((item, idx) => (
                  <div key={idx} className="flex items-start space-x-2">
                    <span className="text-[#ec6a6a]">✕</span>
                    <span>{item}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        {activeTab === 'evidence' && (
          <EvidenceViewer node={draft} />
        )}

        {activeTab === 'contract' && (
          <div className="max-w-3xl mx-auto space-y-4">
            <div className="bg-[#111113] p-3 rounded-xs border border-[rgba(255,255,255,0.075)] flex items-center justify-between text-xs font-sans">
              <div className="flex items-center space-x-2">
                <Lock className="w-3.5 h-3.5 text-[rgba(255,255,255,0.5)]" />
                <span className="font-semibold text-white">{selectedContract.name}</span>
                <span className="text-[rgba(255,255,255,0.4)]">({selectedContract.version})</span>
              </div>
              <div className="flex items-center space-x-2 font-mono">
                <span className="text-[rgba(255,255,255,0.4)] text-[11px]">HASH:</span>
                <span className="text-[rgba(255,255,255,0.8)] bg-[rgba(255,255,255,0.04)] px-2 py-0.5 rounded-xs border border-[rgba(255,255,255,0.08)] text-[11px]">
                  {selectedContract.hash}
                </span>
              </div>
            </div>

            <pre className="bg-[#0E0E10] p-4 rounded-xs border border-[rgba(255,255,255,0.075)] font-mono text-xs text-[rgba(255,255,255,0.8)] leading-relaxed overflow-x-auto">
              {selectedContract.content}
            </pre>
          </div>
        )}
      </div>
    </div>
  );
};


