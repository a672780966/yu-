import React, { useState } from 'react';
import { 
  INITIAL_DEVS, 
  INITIAL_CONTRACTS, 
  INITIAL_ARTIFACTS, 
  INITIAL_PROJECT_FILES, 
  INITIAL_IMPLEMENTATION_NODES, 
  INITIAL_PLANNING_NODES,
  INITIAL_COPILOT_MESSAGES 
} from './data/initialData';
import { 
  DevManifest, 
  ContractItem, 
  ArtifactItem, 
  ProjectFile, 
  MainWorkspaceTab, 
  GraphSubTab, 
  CopilotMessage 
} from './types';
import { 
  computeSchedulerTick, 
  startNodeConstructionRun, 
  completeWorkerConstruction, 
  submitClaudeAuditVerdict,
  ParallelismState 
} from './engine/parallelismEngine';

import { TopBar } from './components/TopBar';
import { Explorer } from './components/Explorer';
import { ConstructionGraph } from './components/ConstructionGraph';
import { ImplementationGraph } from './components/ImplementationGraph';
import { PlanningGraph } from './components/PlanningGraph';
import { DevEditor } from './components/DevEditor';
import { ReleaseAssurance } from './components/ReleaseAssurance';
import { YuCopilot } from './components/YuCopilot';
import { AgentConfigurationDock } from './components/AgentConfigurationDock';
import { GlobalSearchModal } from './components/GlobalSearchModal';

export default function App() {
  // Parallelism State
  const [devs, setDevs] = useState<Record<string, DevManifest>>(INITIAL_DEVS);
  const [contracts, setContracts] = useState<Record<string, ContractItem>>(INITIAL_CONTRACTS);
  const [artifacts, setArtifacts] = useState<Record<string, ArtifactItem>>(INITIAL_ARTIFACTS);
  const [activeSlots, setActiveSlots] = useState<(string | null)[]>(['DEV-041', 'DEV-042', 'DEV-045', null]);
  const [schedulerLogs, setSchedulerLogs] = useState<string[]>([]);

  // Navigation & Selection State
  const [selectedNodeId, setSelectedNodeId] = useState<string>('DEV-044'); // default focused on blocked node as requested
  const [activeTab, setActiveTab] = useState<MainWorkspaceTab>('graph');
  const [graphSubTab, setGraphSubTab] = useState<GraphSubTab>('construction');
  const [activeFileId, setActiveFileId] = useState<string | null>('src-features-gateway-interceptor');
  const [isSearchOpen, setIsSearchOpen] = useState(false);

  // Copilot Stream State
  const [messages, setMessages] = useState<CopilotMessage[]>(INITIAL_COPILOT_MESSAGES);

  const selectedNode = selectedNodeId ? devs[selectedNodeId] || null : null;

  // 5-way linked selection
  const handleSelectNode = (nodeId: string) => {
    setSelectedNodeId(nodeId);
  };

  const handleOpenEditorForNode = (nodeId: string) => {
    setSelectedNodeId(nodeId);
    setActiveTab('editor');
  };

  // Safe DEV Update & Safety Gate
  const handleUpdateDev = (updated: DevManifest) => {
    setDevs(prev => ({
      ...prev,
      [updated.nodeId]: updated
    }));
  };

  const handleConfirmDev = (nodeId: string, confirmed: boolean) => {
    const target = devs[nodeId];
    if (!target) return;

    const nextStatus = confirmed ? 'WAITING' : 'DRAFT';
    const updated = {
      ...target,
      isConfirmed: confirmed,
      status: nextStatus,
      confirmedAt: confirmed ? new Date().toISOString().replace('T', ' ').substring(0, 16) + ' UTC' : undefined
    };

    const nextState = computeSchedulerTick({
      devs: { ...devs, [nodeId]: updated },
      contracts,
      artifacts,
      activeSlots,
      logs: schedulerLogs
    });

    setDevs(nextState.devs);
    setActiveSlots(nextState.activeSlots);
    setSchedulerLogs(nextState.logs);
  };

  // Step DAG Scheduler
  const handleStepScheduler = () => {
    // If there is any READY node, start a construction run
    const devList: DevManifest[] = Object.values(devs);
    const readyNode = devList.find(d => d.status === 'READY');
    if (readyNode) {
      const nextState = startNodeConstructionRun(readyNode.nodeId, {
        devs,
        contracts,
        artifacts,
        activeSlots,
        logs: schedulerLogs
      });
      setDevs(nextState.devs);
      setActiveSlots(nextState.activeSlots);
      setSchedulerLogs(nextState.logs);
      return;
    }

    const nextState = computeSchedulerTick({
      devs,
      contracts,
      artifacts,
      activeSlots,
      logs: schedulerLogs
    });
    setDevs(nextState.devs);
    setActiveSlots(nextState.activeSlots);
    setSchedulerLogs(nextState.logs);
  };

  // Simulate Worker Completion (Pi + Luna)
  const handleSimulateWorkerComplete = (nodeId: string) => {
    const nextState = completeWorkerConstruction(nodeId, {
      devs,
      contracts,
      artifacts,
      activeSlots,
      logs: schedulerLogs
    });
    setDevs(nextState.devs);
    setSchedulerLogs(nextState.logs);
  };

  // Simulate Claude Final Review Audit
  const handleSimulateClaudeAudit = (nodeId: string, verdict: 'PASS' | 'FIX_REQUIRED' | 'BLOCKED') => {
    const nextState = submitClaudeAuditVerdict(nodeId, verdict, '', {
      devs,
      contracts,
      artifacts,
      activeSlots,
      logs: schedulerLogs
    });
    setDevs(nextState.devs);
    setActiveSlots(nextState.activeSlots);
    setSchedulerLogs(nextState.logs);
  };

  // Reset Demo State
  const handleResetDemo = () => {
    setDevs(INITIAL_DEVS);
    setContracts(INITIAL_CONTRACTS);
    setArtifacts(INITIAL_ARTIFACTS);
    setActiveSlots(['DEV-041', 'DEV-042', 'DEV-045', null]);
    setSelectedNodeId('DEV-044');
    setMessages(INITIAL_COPILOT_MESSAGES);
  };

  // Copilot Interaction
  const handleSendMessage = (text: string) => {
    const userMsg: CopilotMessage = {
      id: `msg-${Date.now()}`,
      sender: 'user',
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      content: text
    };

    setMessages(prev => [...prev, userMsg]);

    // Simulated intelligent response based on project facts
    setTimeout(() => {
      let responseContent = `已收到关于项目 **Aurora** 的指示。正在根据 DAG 事实与 Contract 约束分析...`;

      if (text.toLowerCase().includes('044') || text.includes('阻塞') || text.includes('block')) {
        responseContent = `**DEV-044 阻塞深度分析：**
1. **根本原因：** 外部支付 SDK v4.2 强校验要求 intent_id 必须为 RFC-9562 格式，而当前已冻结的 \`PaymentContract v1.0\` 仍为标准 UUID。
2. **隔离现状：** DEV-044 目前已被 YU DAG 隔离阻断，**不会影响** 并行运行中的 DEV-041 (Auth) 与 DEV-042 (Gateway)。
3. **下游影响范围：** 仅有依赖于 DEV-044 的 DEV-046 (Accounting) 与 DEV-048 (Checkout UI) 会维持在 WAITING 状态。
4. **建议方案：** 推荐采纳 **方案 A**（在适配器内部做格式转接，不解冻已发布 Contract）。`;
      } else if (text.toLowerCase().includes('043') || text.includes('并行') || text.includes('parallel')) {
        responseContent = `**DEV-043 并行状态评估：**
- DEV-043 (统一账户前端) 显式依赖 DEV-041 与 DEV-042。
- 当前 DEV-041 与 DEV-042 正在 Slot 1 & Slot 2 进行并行施工 (Fresh Pi+Luna)。
- 只有当两者均通过 Fresh Claude 终审并取得 PASS 后，DEV-043 才会自动解锁并进入 READY 队列。`;
      } else if (text.includes('contract') || text.includes('冻结')) {
        responseContent = `**当前 Contract 状态：**
- \`AuthContract v2.1\`: 🔒 **FROZEN** (Hash: a3c9b841...)
- \`PaymentContract v1.0\`: 🔒 **FROZEN** (Hash: c819a773...)
- \`StorageContract v1.4\`: 🔒 **FROZEN** (Hash: 9f81bc20...)
所有的消费端 Node 均受到 Contract Mutation Isolation 保护。`;
      }

      const claudeMsg: CopilotMessage = {
        id: `msg-${Date.now() + 1}`,
        sender: 'claude',
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
        content: responseContent
      };
      setMessages(prev => [...prev, claudeMsg]);
    }, 600);
  };

  // Block Option Click
  const handleResolveBlockOption = (nodeId: string, optionKey: 'A' | 'B' | 'C') => {
    const target = devs[nodeId];
    if (!target) return;

    let resolutionText = '';
    let updatedNode = { ...target };

    if (optionKey === 'A') {
      resolutionText = `用户已确认决策 **[方案 A]**：保持 PaymentContract v1.0 冻结不变，在适配器内部做 RFC-9562 格式适配转接。\nDEV-044 阻塞已解除，已重新移入 READY 施工队列！`;
      updatedNode = {
        ...target,
        status: 'READY',
        blockedReason: undefined
      };
    } else if (optionKey === 'B') {
      resolutionText = `用户已确认决策 **[方案 B]**：升级 PaymentContract 至 v2.0。\n已触发下游变更影响检测 (Change Impact Detected)：DEV-046 与 DEV-048 已标记为 [REVIEW_REQUIRED]，需进行参数二次审核。`;
      updatedNode = {
        ...target,
        status: 'READY',
        blockedReason: undefined
      };
      // Mark downstream as REVIEW_REQUIRED
      setDevs(prev => ({
        ...prev,
        'DEV-046': { ...prev['DEV-046'], status: 'REVIEW_REQUIRED' },
        'DEV-048': { ...prev['DEV-048'], status: 'REVIEW_REQUIRED' }
      }));
    } else {
      resolutionText = `用户已确认决策 **[方案 C]**：延期 DEV-044 国际支付管道至 Milestone V1.3。\n已解除本版本阻塞依赖，Milestone V1.2 准备就绪。`;
      updatedNode = {
        ...target,
        status: 'DRAFT',
        blockedReason: 'DEFERRED TO V1.3'
      };
    }

    const nextState = computeSchedulerTick({
      devs: { ...devs, [nodeId]: updatedNode },
      contracts,
      artifacts,
      activeSlots,
      logs: schedulerLogs
    });

    setDevs(nextState.devs);
    setActiveSlots(nextState.activeSlots);

    // Update messages to record resolved option
    setMessages(prev => {
      const updatedMessages = prev.map(m => {
        if (m.blockAction?.nodeId === nodeId) {
          return {
            ...m,
            blockAction: {
              ...m.blockAction,
              resolvedOption: optionKey
            }
          };
        }
        return m;
      });

      return [
        ...updatedMessages,
        {
          id: `msg-${Date.now()}`,
          sender: 'claude',
          timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
          content: resolutionText
        }
      ];
    });
  };

  const handleUpdateCapability = (
    nodeId: string,
    skills: string[],
    mcpServers: string[],
    status: 'SEALED' | 'DRAFT',
    hash?: string
  ) => {
    const target = devs[nodeId];
    if (!target) return;
    const updated: DevManifest = {
      ...target,
      capabilities: {
        skills,
        mcpServers,
        status,
        sealedAt: status === 'SEALED' ? new Date().toISOString() : target.capabilities.sealedAt,
        hash
      }
    };
    setDevs(prev => ({ ...prev, [nodeId]: updated }));
  };

  const devList: DevManifest[] = Object.values(devs);
  const passCount = devList.filter(d => d.status === 'PASS').length;
  const blockedCount = devList.filter(d => d.status === 'BLOCKED').length;
  const activeRunsCount = activeSlots.filter(Boolean).length;

  return (
    <div className="flex flex-col h-screen w-screen bg-[#0a0c0f] text-slate-200 overflow-hidden select-none font-sans">
      {/* 1. TOP BAR */}
      <TopBar
        devs={devs}
        activeSlots={activeSlots}
        onOpenSearch={() => setIsSearchOpen(true)}
        onStepScheduler={handleStepScheduler}
        onSimulateWorkerComplete={handleSimulateWorkerComplete}
        onSimulateClaudeAudit={handleSimulateClaudeAudit}
        onResetDemo={handleResetDemo}
        currentTab={activeTab}
        onChangeTab={setActiveTab}
      />

      {/* 2. MAIN 3-COLUMN WORKSPACE (Explorer - Main Canvas - Copilot) */}
      <div className="flex-1 flex overflow-hidden min-h-0">
        {/* Left Column: Explorer (WHERE) */}
        <Explorer
          files={INITIAL_PROJECT_FILES}
          selectedNode={selectedNode}
          activeFileId={activeFileId}
          onSelectFile={file => {
            setActiveFileId(file.id);
            setActiveTab('editor');
          }}
        />

        {/* Center Column: Main Workspace (WHAT: Hexagonal Molecular Network / Editor / Release) */}
        <main className="flex-1 flex flex-col min-w-0 bg-[#0A0A0A] overflow-hidden">
          {activeTab === 'graph' && (
            <div className="flex-1 flex flex-col h-full overflow-hidden">
              {/* Graph Sub-Tabs Header (De-buttonized Quiet Tabs with 1px active indicator) */}
              <div className="h-9 bg-[#0B0B0C] border-b border-[rgba(255,255,255,0.075)] px-4 flex items-center justify-start space-x-6 shrink-0 font-sans">
                <button
                  onClick={() => setGraphSubTab('construction')}
                  className={`h-full relative text-xs transition-colors cursor-pointer flex items-center ${
                    graphSubTab === 'construction'
                      ? 'text-white font-medium'
                      : 'text-[rgba(255,255,255,0.45)] hover:text-[rgba(255,255,255,0.8)]'
                  }`}
                >
                  <span>Construction</span>
                  {graphSubTab === 'construction' && (
                    <span className="absolute bottom-0 left-0 right-0 h-[1.5px] bg-white" />
                  )}
                </button>
                <button
                  onClick={() => setGraphSubTab('implementation')}
                  className={`h-full relative text-xs transition-colors cursor-pointer flex items-center ${
                    graphSubTab === 'implementation'
                      ? 'text-white font-medium'
                      : 'text-[rgba(255,255,255,0.45)] hover:text-[rgba(255,255,255,0.8)]'
                  }`}
                >
                  <span>Implementation</span>
                  {graphSubTab === 'implementation' && (
                    <span className="absolute bottom-0 left-0 right-0 h-[1.5px] bg-white" />
                  )}
                </button>
                <button
                  onClick={() => setGraphSubTab('planning')}
                  className={`h-full relative text-xs transition-colors cursor-pointer flex items-center ${
                    graphSubTab === 'planning'
                      ? 'text-white font-medium'
                      : 'text-[rgba(255,255,255,0.45)] hover:text-[rgba(255,255,255,0.8)]'
                  }`}
                >
                  <span>Planning</span>
                  {graphSubTab === 'planning' && (
                    <span className="absolute bottom-0 left-0 right-0 h-[1.5px] bg-white" />
                  )}
                </button>
              </div>

              {/* Sub-View Render */}
              <div className="flex-1 min-h-0 overflow-hidden relative">
                {graphSubTab === 'construction' && (
                  <ConstructionGraph
                    devs={devs}
                    selectedNodeId={selectedNodeId}
                    onSelectNode={handleSelectNode}
                    activeSlots={activeSlots}
                  />
                )}

                {graphSubTab === 'implementation' && (
                  <ImplementationGraph
                    nodes={INITIAL_IMPLEMENTATION_NODES}
                  />
                )}

                {graphSubTab === 'planning' && (
                  <PlanningGraph
                    nodes={INITIAL_PLANNING_NODES}
                    onSelectNode={handleSelectNode}
                  />
                )}
              </div>
            </div>
          )}

          {activeTab === 'editor' && selectedNode && (
            <DevEditor
              node={selectedNode}
              contracts={contracts}
              onUpdateDev={handleUpdateDev}
              onConfirmDev={handleConfirmDev}
            />
          )}

          {activeTab === 'release' && (
            <ReleaseAssurance devs={devs} />
          )}
        </main>

        {/* Right Column: YU Copilot (WHY: Human-in-the-loop Discussion & Decisions) */}
        <YuCopilot
          messages={messages}
          selectedNode={selectedNode}
          onSendMessage={handleSendMessage}
          onResolveBlockOption={handleResolveBlockOption}
          onViewEvidence={nodeId => {
            setSelectedNodeId(nodeId);
            setActiveTab('editor');
          }}
        />
      </div>

      {/* 3. AGENT CONFIGURATION DOCK (HOW / WHO: Planner, Worker, Reviewer, Capabilities, 4-Slot Concurrency) */}
      <AgentConfigurationDock
        devs={devs}
        selectedNodeId={selectedNodeId}
        contracts={contracts}
        activeSlots={activeSlots}
        onSelectNode={handleSelectNode}
        onOpenEditorForNode={handleOpenEditorForNode}
        onUpdateCapability={handleUpdateCapability}
      />

      {/* Global Search Modal */}
      <GlobalSearchModal
        isOpen={isSearchOpen}
        onClose={() => setIsSearchOpen(false)}
        devs={devs}
        contracts={contracts}
        files={INITIAL_PROJECT_FILES}
        onSelectNode={handleSelectNode}
      />
    </div>
  );
}
