import { DevManifest, NodeStatus, ContractItem, ArtifactItem } from '../types';

export const MAX_ACTIVE_CONSTRUCTION_RUNS = 4;

export interface ParallelismState {
  devs: Record<string, DevManifest>;
  contracts: Record<string, ContractItem>;
  artifacts: Record<string, ArtifactItem>;
  activeSlots: (string | null)[]; // Array of size 4 containing nodeId or null
  logs: string[];
}

/**
 * Checks if two scopes have overlapping write-set paths
 */
export function checkScopeOverlap(scopeA: string[], scopeB: string[]): boolean {
  for (const pathA of scopeA) {
    const cleanA = pathA.replace('/**', '').replace('/*', '');
    for (const pathB of scopeB) {
      const cleanB = pathB.replace('/**', '').replace('/*', '');
      if (cleanA === cleanB || cleanA.startsWith(cleanB) || cleanB.startsWith(cleanA)) {
        return true;
      }
    }
  }
  return false;
}

/**
 * Check if a contract is currently in flux by any running node
 */
export function isContractMutating(contractId: string, devs: Record<string, DevManifest>): boolean {
  return Object.values(devs).some(dev => {
    return dev.status === 'RUNNING' && dev.scope.contracts.includes(contractId);
  });
}

/**
 * Calculates whether a node satisfies all preconditions to enter READY status
 */
export function evaluateNodePreconditions(
  node: DevManifest,
  allDevs: Record<string, DevManifest>,
  contracts: Record<string, ContractItem>,
  artifacts: Record<string, ArtifactItem>
): { isReady: boolean; reasons: string[] } {
  const reasons: string[] = [];

  // 1. DEV must be confirmed
  if (!node.isConfirmed) {
    reasons.push('DEV Manifest is in DRAFT (Needs user confirmation)');
  }

  // 2. depends_on must all be PASS
  for (const depId of node.dependsOn) {
    const parent = allDevs[depId];
    if (!parent) {
      reasons.push(`Unknown dependency ${depId}`);
    } else if (parent.status !== 'PASS') {
      reasons.push(`Dependency ${depId} is currently [${parent.status}] (requires PASS)`);
    }
  }

  // 3. required Contracts must be FROZEN and valid
  for (const ctrId of node.requiredContracts) {
    const ctr = contracts[ctrId];
    if (!ctr) {
      reasons.push(`Missing contract: ${ctrId}`);
    } else if (ctr.status !== 'FROZEN') {
      reasons.push(`Contract ${ctrId} is not FROZEN (status: ${ctr.status})`);
    }
  }

  // 4. required Artifacts must exist and be valid
  for (const artId of node.requiredArtifacts) {
    const art = artifacts[artId];
    if (!art) {
      reasons.push(`Missing required artifact: ${artId}`);
    } else if (art.status !== 'FROZEN' && art.status !== 'VALID') {
      reasons.push(`Artifact ${artId} is stale or invalid`);
    }
  }

  // 5. Capability manifest must be sealed
  if (node.capabilities.status !== 'SEALED') {
    reasons.push('Capabilities (Skills/MCP) are not sealed');
  }

  // 6. No unresolved BLOCK
  if (node.status === 'BLOCKED') {
    reasons.push(`Node has unresolved BLOCK: ${node.blockedReason || 'Unknown error'}`);
  }

  return {
    isReady: reasons.length === 0,
    reasons
  };
}

/**
 * Core Deterministic Scheduler Tick:
 * Recalculates all node readiness, checks 3-layer isolation gates, and allocates up to 4 slots.
 */
export function computeSchedulerTick(currentState: ParallelismState): ParallelismState {
  const devs = { ...currentState.devs };
  const { contracts, artifacts } = currentState;
  const newLogs = [...currentState.logs];

  // 1. Identify currently running nodes and active slots
  const activeSlots: (string | null)[] = [null, null, null, null];
  const runningDevIds: string[] = [];

  Object.values(devs).forEach(dev => {
    if (dev.status === 'RUNNING' || dev.status === 'AUDITING') {
      runningDevIds.push(dev.nodeId);
      if (dev.slotNumber && dev.slotNumber >= 1 && dev.slotNumber <= 4) {
        activeSlots[dev.slotNumber - 1] = dev.nodeId;
      }
    }
  });

  // Assign any unslotted running nodes to available slot
  runningDevIds.forEach(nodeId => {
    if (!activeSlots.includes(nodeId)) {
      const freeIdx = activeSlots.findIndex(s => s === null);
      if (freeIdx !== -1) {
        activeSlots[freeIdx] = nodeId;
        devs[nodeId] = { ...devs[nodeId], slotNumber: freeIdx + 1 };
      }
    }
  });

  // 2. Evaluate all non-running / non-passed nodes
  Object.values(devs).forEach(node => {
    if (node.status === 'PASS' || node.status === 'BLOCKED' || node.status === 'RUNNING' || node.status === 'AUDITING') {
      return;
    }

    const { isReady } = evaluateNodePreconditions(node, devs, contracts, artifacts);

    if (isReady) {
      // Check for available slot
      const occupiedSlots = activeSlots.filter(Boolean).length;
      if (occupiedSlots < MAX_ACTIVE_CONSTRUCTION_RUNS) {
        // Check 3 Isolation Gates against currently RUNNING nodes:
        // Gate A: Dependency Isolation (Handled by preconditions)
        // Gate B: Scope Isolation
        let hasScopeConflict = false;
        let conflictWithNode = '';
        for (const runningId of runningDevIds) {
          const runningNode = devs[runningId];
          if (checkScopeOverlap(node.scope.allowed, runningNode.scope.allowed)) {
            hasScopeConflict = true;
            conflictWithNode = runningId;
            break;
          }
        }

        // Gate C: Contract Mutation Isolation
        let hasContractConflict = false;
        for (const ctrId of node.requiredContracts) {
          if (isContractMutating(ctrId, devs)) {
            hasContractConflict = true;
            break;
          }
        }

        if (hasScopeConflict) {
          devs[node.nodeId] = {
            ...node,
            status: 'WAITING'
          };
          newLogs.unshift(`[Gate Block] ${node.nodeId} PARALLEL_DENIED: Write-set scope conflicts with ${conflictWithNode}`);
        } else if (hasContractConflict) {
          devs[node.nodeId] = {
            ...node,
            status: 'WAITING'
          };
          newLogs.unshift(`[Gate Block] ${node.nodeId} PARALLEL_DENIED: Consumes a contract currently being modified`);
        } else {
          devs[node.nodeId] = {
            ...node,
            status: 'READY'
          };
        }
      } else {
        // All 4 slots full
        devs[node.nodeId] = {
          ...node,
          status: 'QUEUED'
        };
      }
    } else {
      // Preconditions not satisfied
      if (node.status !== 'DRAFT') {
        devs[node.nodeId] = {
          ...node,
          status: 'WAITING'
        };
      }
    }
  });

  return {
    devs,
    contracts,
    artifacts,
    activeSlots,
    logs: newLogs.slice(0, 50)
  };
}

/**
 * Dispatches a READY node into an active RUNNING construction run
 */
export function startNodeConstructionRun(nodeId: string, state: ParallelismState): ParallelismState {
  const devs = { ...state.devs };
  const target = devs[nodeId];
  if (!target || target.status !== 'READY') return state;

  const activeSlots = [...state.activeSlots];
  const freeSlotIdx = activeSlots.findIndex(s => s === null);
  if (freeSlotIdx === -1) {
    // Max runs reached
    devs[nodeId] = { ...target, status: 'QUEUED' };
    return { ...state, devs };
  }

  const slotNumber = freeSlotIdx + 1;
  activeSlots[freeSlotIdx] = nodeId;

  const runCount = (target.historyRuns?.length || 0) + 1;
  const runId = `RUN-${nodeId.replace('DEV-', '')}-${String(runCount).padStart(3, '0')}`;
  const now = new Date().toISOString().replace('T', ' ').substring(0, 16) + ' UTC';

  const newRun = {
    runId,
    nodeId,
    workerName: 'Pi + Luna',
    state: 'RUNNING' as const,
    startedAt: now,
    slotNumber,
    workspacePath: `.yu/worktrees/${runId.toLowerCase()}`,
    scope: target.scope.allowed,
    changedFilesCount: 2,
    changedFiles: target.scope.allowed.map(p => p.replace('/**', '/index.ts')),
    diffSummary: '+120 -8 lines',
    testPassedCount: 3,
    testTotalCount: 5,
    evidence: {
      diffSnippet: `+ // Fresh Pi + Luna implementation in isolated worktree ${runId}\n+ export function execute${target.nodeId.replace('-', '_')}() { return true; }`,
      testOutput: `RUNS tests in isolated scope...\n3 passed, 2 pending`,
      executionLogs: [
        `[${now}] Ephemeral worker Pi+Luna initialized in worktree .yu/worktrees/${runId.toLowerCase()}`,
        `[${now}] Scope lock strictly applied: ${target.scope.allowed.join(', ')}`
      ],
      commandsRun: [`npm test --scope=${target.scope.allowed[0]}`],
      gitCommitHash: Math.random().toString(16).substring(2, 9),
      integrityHash: Math.random().toString(16).substring(2, 18)
    }
  };

  devs[nodeId] = {
    ...target,
    status: 'RUNNING',
    slotNumber,
    currentRun: newRun
  };

  const newLogs = [
    `[Runtime] Slot #${slotNumber} allocated: ${nodeId} started Ephemeral Construction Run ${runId} (Pi + Luna)`,
    ...state.logs
  ];

  return computeSchedulerTick({
    ...state,
    devs,
    activeSlots,
    logs: newLogs
  });
}

/**
 * Worker finishes construction -> moves to AUDIT_READY / AUDITING (Fresh Claude Review Run)
 */
export function completeWorkerConstruction(nodeId: string, state: ParallelismState): ParallelismState {
  const devs = { ...state.devs };
  const target = devs[nodeId];
  if (!target || target.status !== 'RUNNING' || !target.currentRun) return state;

  const updatedRun = {
    ...target.currentRun,
    state: 'COMPLETED' as const,
    completedAt: new Date().toISOString().replace('T', ' ').substring(0, 16) + ' UTC',
    testPassedCount: target.acceptance.length,
    testTotalCount: target.acceptance.length,
    evidence: {
      ...target.currentRun.evidence,
      testOutput: `✓ All ${target.acceptance.length} acceptance test suites passed green in 340ms`,
      executionLogs: [
        ...target.currentRun.evidence.executionLogs,
        `[Worker Complete] Pi+Luna generated WORK_COMPLETED + NODE_REPORT + DIFF + EVIDENCE package.`,
        `[Audit Handoff] Spawning Fresh Claude for isolated audit review.`
      ]
    }
  };

  devs[nodeId] = {
    ...target,
    status: 'AUDITING',
    currentRun: updatedRun
  };

  const newLogs = [
    `[Worker] ${nodeId} completed construction -> Handed off to Fresh Claude for isolated review`,
    ...state.logs
  ];

  return {
    ...state,
    devs,
    logs: newLogs
  };
}

/**
 * Final Claude Review verdict: PASS | FIX_REQUIRED | BLOCKED
 */
export function submitClaudeAuditVerdict(
  nodeId: string,
  verdict: 'PASS' | 'FIX_REQUIRED' | 'BLOCKED',
  summary: string,
  state: ParallelismState
): ParallelismState {
  const devs = { ...state.devs };
  const target = devs[nodeId];
  if (!target || !target.currentRun) return state;

  const currentRun = target.currentRun;
  const now = new Date().toISOString().replace('T', ' ').substring(0, 16) + ' UTC';

  const auditVerdict = {
    reviewer: 'Fresh Claude',
    status: verdict,
    evaluatedAt: now,
    auditScope: `Isolated to ${currentRun.runId}`,
    findings: [],
    summary: summary || (verdict === 'PASS' ? 'Audit verified 100% acceptance compliance and zero scope leakage.' : 'Revision needed.')
  };

  const finishedRun = {
    ...currentRun,
    evidence: {
      ...currentRun.evidence,
      auditVerdict
    }
  };

  const historyRuns = [...(target.historyRuns || []), finishedRun];

  let nextStatus: NodeStatus = 'PASS';
  if (verdict === 'PASS') {
    nextStatus = 'PASS';
  } else if (verdict === 'FIX_REQUIRED') {
    nextStatus = 'READY'; // Re-enters ready for clean Fresh Pi+Luna fix run
  } else {
    nextStatus = 'BLOCKED';
  }

  // Free the active slot
  const activeSlots = state.activeSlots.map(id => (id === nodeId ? null : id));

  devs[nodeId] = {
    ...target,
    status: nextStatus,
    slotNumber: undefined,
    currentRun: undefined,
    historyRuns,
    acceptance: target.acceptance.map(ac => ({ ...ac, passed: verdict === 'PASS' }))
  };

  const newLogs = [
    `[Audit] Fresh Claude verdict for ${nodeId} (${currentRun.runId}): ${verdict}. Slot released.`,
    ...state.logs
  ];

  return computeSchedulerTick({
    ...state,
    devs,
    activeSlots,
    logs: newLogs
  });
}
