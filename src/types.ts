export type NodeStatus = 
  | 'DRAFT'
  | 'CONFIRMED'
  | 'WAITING'
  | 'READY'
  | 'QUEUED'
  | 'RUNNING'
  | 'AUDIT_READY'
  | 'AUDITING'
  | 'PASS'
  | 'FIX'
  | 'BLOCKED'
  | 'REVIEW_REQUIRED';

export type ContractStatus = 'DRAFT' | 'REVIEW' | 'ACCEPTED' | 'FROZEN' | 'SUPERSEDED';

export interface ContractItem {
  id: string;
  name: string;
  version: string;
  status: ContractStatus;
  hash: string;
  schemaFile: string;
  lastUpdated: string;
  content: string;
}

export interface ArtifactItem {
  id: string;
  name: string;
  hash: string;
  size: string;
  status: 'VALID' | 'STALE' | 'FROZEN';
  producedBy?: string;
}

export interface WorkerRun {
  runId: string;
  nodeId: string;
  workerName: string; // 'Fresh Pi + Luna'
  state: 'RUNNING' | 'COMPLETED' | 'FAILED';
  startedAt: string;
  completedAt?: string;
  slotNumber: number; // 1, 2, 3, 4
  workspacePath: string; // e.g. .yu/worktrees/run-042-003
  scope: string[];
  changedFilesCount: number;
  changedFiles: string[];
  diffSummary: string;
  testPassedCount: number;
  testTotalCount: number;
  evidence: RunEvidence;
}

export interface RunEvidence {
  diffSnippet: string;
  testOutput: string;
  executionLogs: string[];
  commandsRun: string[];
  gitCommitHash: string;
  integrityHash: string;
  auditVerdict?: AuditVerdict;
}

export interface AuditVerdict {
  reviewer: string; // 'Fresh Claude'
  status: 'PASS' | 'FIX_REQUIRED' | 'BLOCKED';
  evaluatedAt: string;
  auditScope: string; // 'Isolated to RUN-042-003'
  findings: AuditFinding[];
  summary: string;
}

export interface AuditFinding {
  id: string;
  severity: 'HIGH' | 'MEDIUM' | 'LOW';
  file: string;
  line: number;
  message: string;
  status: 'OPEN' | 'RESOLVED';
  isRelatedFinding?: boolean; // if found outside current scope
}

export interface NodeScope {
  allowed: string[];
  forbidden: string[];
  contracts: string[];
  artifacts: string[];
}

export interface CapabilityManifest {
  skills: string[];
  mcpServers: string[];
  status: 'SEALED' | 'DRAFT';
  sealedAt: string;
  hash?: string;
}

export interface AcceptanceCriterion {
  id: string;
  description: string;
  passed: boolean;
  testReference?: string;
}

export interface DevManifest {
  nodeId: string; // e.g. DEV-042
  title: string;
  goal: string;
  status: NodeStatus;
  isConfirmed: boolean;
  confirmedAt?: string;
  confirmedBy?: string;
  dependsOn: string[];
  requiredContracts: string[];
  requiredArtifacts: string[];
  producesArtifacts: string[];
  scope: NodeScope;
  capabilities: CapabilityManifest;
  acceptance: AcceptanceCriterion[];
  forbiddenItems: string[];
  constructionPlan: string[];
  completionReceipts: string[];
  currentRun?: WorkerRun;
  historyRuns: WorkerRun[];
  blockedReason?: string;
  blockResolutionOptions?: BlockOption[];
  slotNumber?: number; // active slot 1-4
}

export interface BlockOption {
  key: 'A' | 'B' | 'C';
  title: string;
  description: string;
  impact: string;
}

export interface ProjectFile {
  id: string;
  path: string;
  name: string;
  type: 'file' | 'folder';
  children?: ProjectFile[];
  isFrozen?: boolean;
  status?: 'modified' | 'clean' | 'forbidden';
  content?: string;
  language?: string;
}

export interface GraphNodePosition {
  x: number;
  y: number;
}

export type MainWorkspaceTab = 'graph' | 'editor' | 'release';
export type GraphSubTab = 'construction' | 'implementation' | 'planning';

export interface CopilotMessage {
  id: string;
  sender: 'user' | 'claude';
  timestamp: string;
  content: string;
  blockAction?: {
    nodeId: string;
    options: BlockOption[];
    resolvedOption?: string;
  };
  evidenceRef?: {
    nodeId: string;
    runId: string;
    title: string;
  };
}

export interface ImplementationNode {
  id: string;
  name: string;
  kind: 'controller' | 'service' | 'repo' | 'test' | 'type';
  file: string;
  calls: string[];
  x: number;
  y: number;
}

export interface PlanningNode {
  id: string;
  title: string;
  category: 'requirement' | 'contract' | 'decision' | 'dev';
  status: 'frozen' | 'draft' | 'planned';
  linkedDevs: string[];
  x: number;
  y: number;
}
