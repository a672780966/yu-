import { DevManifest, ContractItem, ArtifactItem, ProjectFile, ImplementationNode, PlanningNode, CopilotMessage } from '../types';

export const INITIAL_CONTRACTS: Record<string, ContractItem> = {
  'auth-contract.yaml': {
    id: 'auth-contract.yaml',
    name: 'AuthContract',
    version: 'v2.1',
    status: 'FROZEN',
    hash: 'a3c9b841e210ff48c909e4d1f238914b7e2890a3fe81',
    schemaFile: 'contracts/auth-contract.yaml',
    lastUpdated: '2026-08-27 14:20 UTC',
    content: `# YU Contract: AuthContract v2.1 (FROZEN)
# Hash: a3c9b841e210ff48c909e4d1f238914b7e2890a3fe81
contract_version: "2.1.0"
contract_status: FROZEN
sealed_at: "2026-08-27T14:20:00Z"
target_services:
  - AuthService
  - TokenService
  - GatewayVerifier

interfaces:
  SessionTokenPayload:
    sub: string (uuid)
    tenant_id: string
    roles: array[string]
    exp: integer (timestamp)
    scope: array[string]

  AuthenticationRequest:
    grant_type: enum["password", "refresh_token", "api_key"]
    credentials:
      principal: string
      secret: string (redacted)
      mfa_token?: string

  AuthenticationResponse:
    access_token: string (jwt)
    refresh_token: string (opaque)
    expires_in: 3600
    token_type: "Bearer"

invariants:
  - "Tokens must be signed with RS256 algorithm"
  - "Token expiry must strictly reject leeway > 60 seconds"
  - "Revocation check must be O(1) in-memory Bloom filter"
`
  },
  'payment-contract.yaml': {
    id: 'payment-contract.yaml',
    name: 'PaymentContract',
    version: 'v1.0',
    status: 'FROZEN',
    hash: 'c819a773bc2810a400192eef88102a991823a0018b9c',
    schemaFile: 'contracts/payment-contract.yaml',
    lastUpdated: '2026-08-26 11:00 UTC',
    content: `# YU Contract: PaymentContract v1.0 (FROZEN)
# Hash: c819a773bc2810a400192eef88102a991823a0018b9c
contract_version: "1.0.0"
contract_status: FROZEN
target_services:
  - PaymentProcessor
  - LedgerService

interfaces:
  PaymentIntent:
    intent_id: string (uuid)
    amount: integer (cents)
    currency: enum["USD", "EUR", "GBP", "JPY"]
    idempotency_key: string
    customer_id: string

  PaymentReceipt:
    transaction_id: string
    status: enum["SUCCEEDED", "REQUIRES_ACTION", "FAILED"]
    settled_at: string (iso8601)
`
  },
  'storage-contract.yaml': {
    id: 'storage-contract.yaml',
    name: 'StorageContract',
    version: 'v1.4',
    status: 'FROZEN',
    hash: '9f81bc20148ad67140b2890c44199aa12903fe44129a',
    schemaFile: 'contracts/storage-contract.yaml',
    lastUpdated: '2026-08-25 09:30 UTC',
    content: `# YU Contract: StorageContract v1.4 (FROZEN)
contract_version: "1.4.0"
contract_status: FROZEN
storage_adapters:
  - LocalWorktreeFS
  - S3CompatibleBlob
`
  }
};

export const INITIAL_ARTIFACTS: Record<string, ArtifactItem> = {
  'AuthSchema.json': {
    id: 'AuthSchema.json',
    name: 'AuthSchema (Compiled JSON Schema)',
    hash: '7b2049e89a01f77c',
    size: '14.2 KB',
    status: 'FROZEN',
    producedBy: 'DEV-040'
  },
  'CoreCryptoBundle.wasm': {
    id: 'CoreCryptoBundle.wasm',
    name: 'CoreCrypto WebAssembly Bundle',
    hash: 'e810a992bc44391a',
    size: '184 KB',
    status: 'FROZEN',
    producedBy: 'DEV-039'
  },
  'PaymentLedgerSchema.sql': {
    id: 'PaymentLedgerSchema.sql',
    name: 'Payment Ledger DDL Schema',
    hash: '55bc0912fa8901cc',
    size: '8.4 KB',
    status: 'FROZEN',
    producedBy: 'DEV-038'
  }
};

export const INITIAL_DEVS: Record<string, DevManifest> = {
  'DEV-039': {
    nodeId: 'DEV-039',
    title: '底层加密与哈希引擎封装',
    goal: '提供基础 SHA256/RS256 签名以及 Worktree 隔离校验所必需的高性能 Rust/WASM 核心引擎。',
    status: 'PASS',
    isConfirmed: true,
    confirmedAt: '2026-08-26 09:00 UTC',
    confirmedBy: 'Tech Lead (Wu)',
    dependsOn: [],
    requiredContracts: ['storage-contract.yaml'],
    requiredArtifacts: [],
    producesArtifacts: ['CoreCryptoBundle.wasm'],
    scope: {
      allowed: ['src/core/crypto/**', 'tests/core/crypto/**'],
      forbidden: ['src/features/**', 'src/ui/**'],
      contracts: ['storage-contract.yaml'],
      artifacts: []
    },
    capabilities: {
      skills: ['Rust/Wasm', 'TypeScript', 'Crypto Engine'],
      mcpServers: ['Codebase Memory'],
      status: 'SEALED',
      sealedAt: '2026-08-26 09:05 UTC'
    },
    acceptance: [
      { id: 'AC-1', description: 'RS256 签名验证吞吐量 > 15,000 ops/sec', passed: true, testReference: 'crypto.bench.ts' },
      { id: 'AC-2', description: 'SHA256 哈希计算与标准 RFC 4634 一致', passed: true, testReference: 'crypto.test.ts' }
    ],
    forbiddenItems: ['禁止使用未经审计的外部 OpenSSL 动态依赖', '禁止在客户端直接暴露私钥签名接口'],
    constructionPlan: [
      '1. 引入 WebAssembly 原生编译的 RS256/SHA256 封装',
      '2. 实现 TypeScript 强类型隔离门禁 wrapper',
      '3. 构建自动化性能与正确性测试基准'
    ],
    completionReceipts: [
      'Evidence: RUN-039-001 PASS (Verdict: Fresh Claude)',
      'Git Commit: 9c8b712 (Hash: e810a992bc44391a)',
      'Tests: 18 passed, 0 failed (100% coverage)'
    ],
    historyRuns: [
      {
        runId: 'RUN-039-001',
        nodeId: 'DEV-039',
        workerName: 'Pi + Luna',
        state: 'COMPLETED',
        startedAt: '2026-08-26 09:10 UTC',
        completedAt: '2026-08-26 09:28 UTC',
        slotNumber: 1,
        workspacePath: '.yu/worktrees/run-039-001',
        scope: ['src/core/crypto/**'],
        changedFilesCount: 4,
        changedFiles: ['src/core/crypto/wasm_bridge.ts', 'src/core/crypto/hasher.ts', 'tests/core/crypto/crypto.test.ts', 'src/core/crypto/index.ts'],
        diffSummary: '+342 -12 lines',
        testPassedCount: 18,
        testTotalCount: 18,
        evidence: {
          diffSnippet: `+ export async function verifyRS256(payload: Uint8Array, signature: Uint8Array, pubKey: CryptoKey): Promise<boolean> {\n+   return wasmModule.verify_rs256(payload, signature, pubKey);\n+ }`,
          testOutput: '✓ 18 tests passed (0 failures) in 412ms',
          executionLogs: ['[Worker] Fresh Pi+Luna spawned in worktree .yu/worktrees/run-039-001', '[Audit] Fresh Claude review: PASS'],
          commandsRun: ['npm run test:crypto', 'wasm-pack build --target web'],
          gitCommitHash: '9c8b712',
          integrityHash: 'e810a992bc44391a',
          auditVerdict: {
            reviewer: 'Fresh Claude',
            status: 'PASS',
            evaluatedAt: '2026-08-26 09:32 UTC',
            auditScope: 'Isolated to RUN-039-001',
            findings: [],
            summary: 'Implementation strictly satisfies crypto invariants without leaking memory.'
          }
        }
      }
    ]
  },
  'DEV-040': {
    nodeId: 'DEV-040',
    title: '认证协议基础与凭证验证器',
    goal: '实现 SessionToken 校验、Token 撤销检测与 RBAC 权限解码，产出 AuthSchema 冻结构件。',
    status: 'PASS',
    isConfirmed: true,
    confirmedAt: '2026-08-26 14:00 UTC',
    confirmedBy: 'Tech Lead (Wu)',
    dependsOn: ['DEV-039'],
    requiredContracts: ['auth-contract.yaml'],
    requiredArtifacts: ['CoreCryptoBundle.wasm'],
    producesArtifacts: ['AuthSchema.json'],
    scope: {
      allowed: ['src/core/auth/**', 'tests/core/auth/**'],
      forbidden: ['src/features/payment/**', 'src/ui/**'],
      contracts: ['auth-contract.yaml'],
      artifacts: ['CoreCryptoBundle.wasm']
    },
    capabilities: {
      skills: ['TypeScript', 'Auth Protocols'],
      mcpServers: ['Codebase Memory'],
      status: 'SEALED',
      sealedAt: '2026-08-26 14:05 UTC'
    },
    acceptance: [
      { id: 'AC-1', description: '严格遵循 AuthContract v2.1 格式，正确解析 SessionTokenPayload', passed: true, testReference: 'token.test.ts' },
      { id: 'AC-2', description: 'Bloom Filter 撤销验证延迟 < 0.2ms', passed: true, testReference: 'revocation.test.ts' }
    ],
    forbiddenItems: ['禁止在日志打印包含 JWT 签名的原始字符串', '禁止硬编码密钥盐值'],
    constructionPlan: [
      '1. 搭建 Token 解码与签名核验管道',
      '2. 集成 Bloom Filter 撤销高速查询',
      '3. 生成 AuthSchema 冻结构件并计算 SHA-256'
    ],
    completionReceipts: [
      'Evidence: RUN-040-002 PASS (Verdict: Fresh Claude)',
      'Produced Artifact: AuthSchema.json [FROZEN 7b2049e89a01f77c]',
      'Tests: 24 passed, 0 failed'
    ],
    historyRuns: [
      {
        runId: 'RUN-040-002',
        nodeId: 'DEV-040',
        workerName: 'Pi + Luna',
        state: 'COMPLETED',
        startedAt: '2026-08-26 14:15 UTC',
        completedAt: '2026-08-26 14:48 UTC',
        slotNumber: 1,
        workspacePath: '.yu/worktrees/run-040-002',
        scope: ['src/core/auth/**'],
        changedFilesCount: 5,
        changedFiles: ['src/core/auth/token_decoder.ts', 'src/core/auth/revocation.ts', 'tests/core/auth/token.test.ts', 'contracts/auth-schema.json'],
        diffSummary: '+491 -30 lines',
        testPassedCount: 24,
        testTotalCount: 24,
        evidence: {
          diffSnippet: `+ export class TokenDecoder implements ITokenVerifier {\n+   constructor(private crypto: ICryptoEngine) {}\n+   public async decode(jwt: string): Promise<SessionTokenPayload> { ... }\n+ }`,
          testOutput: '✓ 24 tests passed (0 failures) in 680ms',
          executionLogs: ['[Worker] Fresh Pi+Luna compiled AuthSchema.json', '[Audit] Fresh Claude verified zero scope leaks.'],
          commandsRun: ['npm run test:auth-core', 'npx ajv compile -s contracts/auth-schema.json'],
          gitCommitHash: 'fa19c08',
          integrityHash: '7b2049e89a01f77c',
          auditVerdict: {
            reviewer: 'Fresh Claude',
            status: 'PASS',
            evaluatedAt: '2026-08-26 14:52 UTC',
            auditScope: 'Isolated to RUN-040-002',
            findings: [],
            summary: 'Token verification engine conforms 100% to AuthContract v2.1 frozen interface.'
          }
        }
      }
    ]
  },
  'DEV-041': {
    nodeId: 'DEV-041',
    title: '用户认证与权限服务 (Auth Feature Service)',
    goal: '基于 DEV-040 核心协议构建应用层 AuthService，支持登录、多租户鉴权、MFA 验证与令牌刷新。',
    status: 'RUNNING',
    isConfirmed: true,
    confirmedAt: '2026-08-27 15:00 UTC',
    confirmedBy: 'Tech Lead (Wu)',
    dependsOn: ['DEV-040'],
    requiredContracts: ['auth-contract.yaml'],
    requiredArtifacts: ['AuthSchema.json'],
    producesArtifacts: [],
    scope: {
      allowed: ['src/features/auth/**', 'tests/features/auth/**'],
      forbidden: ['src/features/payment/**', 'src/features/billing/**', 'src/ui/**'],
      contracts: ['auth-contract.yaml'],
      artifacts: ['AuthSchema.json']
    },
    capabilities: {
      skills: ['TypeScript', 'Express', 'JWT/MFA Security'],
      mcpServers: ['Codebase Memory'],
      status: 'SEALED',
      sealedAt: '2026-08-27 15:05 UTC'
    },
    acceptance: [
      { id: 'AC-1', description: '支持 password, refresh_token, api_key 三种 grant_type 鉴权', passed: true, testReference: 'auth.service.test.ts' },
      { id: 'AC-2', description: '多租户 tenant_id 隔离校验，防止跨租户越权查询', passed: true, testReference: 'tenant_isolation.test.ts' },
      { id: 'AC-3', description: 'MFA 校验失败时返回 40301 结构化标准错误代码', passed: false, testReference: 'mfa.test.ts' }
    ],
    forbiddenItems: ['禁止跨 Scope 读写 payment 目录下的账单配置', '禁止跳过 Contract 引入自定义 token 格式'],
    constructionPlan: [
      '1. 实现 AuthService.login() / refresh()',
      '2. 实现 MultiTenantPolicyEnforcer 租户隔离中间件',
      '3. 编写 端到端 鉴权与 MFA 单元测试'
    ],
    completionReceipts: [],
    slotNumber: 1,
    currentRun: {
      runId: 'RUN-041-001',
      nodeId: 'DEV-041',
      workerName: 'Pi + Luna',
      state: 'RUNNING',
      startedAt: '2026-08-27 15:42 UTC',
      slotNumber: 1,
      workspacePath: '.yu/worktrees/run-041-001',
      scope: ['src/features/auth/**'],
      changedFilesCount: 3,
      changedFiles: ['src/features/auth/auth.service.ts', 'src/features/auth/tenant.policy.ts', 'tests/features/auth/auth.service.test.ts'],
      diffSummary: '+215 -18 lines',
      testPassedCount: 6,
      testTotalCount: 8,
      evidence: {
        diffSnippet: `+ export class AuthService {\n+   async login(req: AuthenticationRequest): Promise<AuthenticationResponse> {\n+     const validated = await this.verifier.validate(req);\n+     return this.tokenIssuer.issueSession(validated);\n+   }\n+ }`,
        testOutput: 'PASS tests/features/auth/auth.service.test.ts (6 passed, 2 pending)',
        executionLogs: [
          '[15:42:01] Worker Pi+Luna initialized in worktree .yu/worktrees/run-041-001',
          '[15:43:10] Scope check verified: write-set strictly bounded within src/features/auth/**',
          '[15:44:22] Executing test suite against mock database context'
        ],
        commandsRun: ['npm run test:auth-feature', 'git status --porcelain'],
        gitCommitHash: '3d8a119',
        integrityHash: 'b4a091c7811902a'
      }
    },
    historyRuns: []
  },
  'DEV-042': {
    nodeId: 'DEV-042',
    title: '用户认证与权限网关中间件 (Auth Gateway Interceptor)',
    goal: '实现 API Gateway 层级的全局 JWT 拦截器与速率限制器，验证 Authorization Header 并注入上下文。',
    status: 'RUNNING',
    isConfirmed: true,
    confirmedAt: '2026-08-27 15:10 UTC',
    confirmedBy: 'Tech Lead (Wu)',
    dependsOn: ['DEV-040'],
    requiredContracts: ['auth-contract.yaml'],
    requiredArtifacts: ['AuthSchema.json'],
    producesArtifacts: [],
    scope: {
      allowed: ['src/features/gateway/**', 'tests/features/gateway/**'],
      forbidden: ['src/features/payment/**', 'src/features/auth/service.ts'],
      contracts: ['auth-contract.yaml'],
      artifacts: ['AuthSchema.json']
    },
    capabilities: {
      skills: ['TypeScript', 'Express Middleware', 'Rate Limiter'],
      mcpServers: ['Codebase Memory'],
      status: 'SEALED',
      sealedAt: '2026-08-27 15:12 UTC'
    },
    acceptance: [
      { id: 'AC-1', description: '拦截非法 JWT 请求并响应标准 401 Unauthorized', passed: true, testReference: 'gateway.auth.test.ts' },
      { id: 'AC-2', description: '支持 IP + TenantId 联合令牌桶限流 (2000 req/min)', passed: true, testReference: 'rate_limit.test.ts' },
      { id: 'AC-3', description: '下游请求头安全传递 X-User-Id 与 X-Tenant-Id', passed: true, testReference: 'header_injection.test.ts' }
    ],
    forbiddenItems: ['禁止直接修改 src/features/auth/service.ts (防止 Scope Write-Set 冲突)', '禁止直接访问底层数据库连接池'],
    constructionPlan: [
      '1. 实现 authGatewayMiddleware() 拦截逻辑',
      '2. 实现 TokenBucketRateLimiter 内存限流器',
      '3. 添加路由上下文注入与审计日志钩子'
    ],
    completionReceipts: [],
    slotNumber: 2,
    currentRun: {
      runId: 'RUN-042-003',
      nodeId: 'DEV-042',
      workerName: 'Pi + Luna',
      state: 'RUNNING',
      startedAt: '2026-08-27 15:42 UTC',
      slotNumber: 2,
      workspacePath: '.yu/worktrees/run-042-003',
      scope: ['src/features/gateway/**'],
      changedFilesCount: 3,
      changedFiles: ['src/features/gateway/auth.interceptor.ts', 'src/features/gateway/rate_limiter.ts', 'tests/features/gateway/gateway.test.ts'],
      diffSummary: '+184 -6 lines',
      testPassedCount: 7,
      testTotalCount: 9,
      evidence: {
        diffSnippet: `+ export const authGatewayInterceptor: RequestHandler = async (req, res, next) => {\n+   const authHeader = req.headers.authorization;\n+   if (!authHeader?.startsWith('Bearer ')) return res.status(401).json({ error: 'UNAUTHORIZED' });\n+   const payload = await tokenVerifier.verify(authHeader.slice(7));\n+   req.user = payload;\n+   next();\n+ };`,
        testOutput: 'PASS tests/features/gateway/gateway.test.ts (7 passed, 2 in progress)',
        executionLogs: [
          '[15:42:05] Worktree isolated at .yu/worktrees/run-042-003',
          '[15:44:00] Parallel gate verification: Scope isolation with DEV-041 confirmed (Zero overlap)',
          '[15:45:12] Token verification bench running smoothly'
        ],
        commandsRun: ['npm run test:gateway', 'git diff --stat'],
        gitCommitHash: '7a192fc',
        integrityHash: '91bc88192a00c14'
      }
    },
    historyRuns: []
  },
  'DEV-043': {
    nodeId: 'DEV-043',
    title: '统一账户中心与权限管理前端 UI 组件',
    goal: '基于 DEV-041 与 DEV-042 产出的鉴权服务与网关规范，开发统一用户中心登录/MFA绑定/租户切换界面。',
    status: 'WAITING',
    isConfirmed: true,
    confirmedAt: '2026-08-27 15:30 UTC',
    confirmedBy: 'Tech Lead (Wu)',
    dependsOn: ['DEV-041', 'DEV-042'],
    requiredContracts: ['auth-contract.yaml'],
    requiredArtifacts: ['AuthSchema.json'],
    producesArtifacts: [],
    scope: {
      allowed: ['src/ui/auth/**', 'tests/ui/auth/**'],
      forbidden: ['src/features/**', 'src/core/**'],
      contracts: ['auth-contract.yaml'],
      artifacts: ['AuthSchema.json']
    },
    capabilities: {
      skills: ['React', 'TypeScript', 'Tailwind CSS'],
      mcpServers: ['Codebase Memory'],
      status: 'SEALED',
      sealedAt: '2026-08-27 15:32 UTC'
    },
    acceptance: [
      { id: 'AC-1', description: '登录页支持账号密码与 MFA 双重验证', passed: false },
      { id: 'AC-2', description: 'Token 过期静默刷新与无缝重定向', passed: false },
      { id: 'AC-3', description: '响应式支持 1366x768 至 2560x1440 桌面分辨率', passed: false }
    ],
    forbiddenItems: ['禁止在客户端本地 localStorage 存储未经保护的私密 refresh token', '禁止使用非 Tailwind 样式'],
    constructionPlan: [
      '1. 搭建 AuthLoginView 与 MfaChallengeModal',
      '2. 封装 useAuthSession 响应式 React Hook',
      '3. 实现 Token 刷新拦截器'
    ],
    completionReceipts: [],
    historyRuns: []
  },
  'DEV-044': {
    nodeId: 'DEV-044',
    title: '多币种国际支付结算处理管道',
    goal: '对接国际支付网关（Stripe/Adyen）并按照 PaymentContract v1.0 实现多币种幂等结算。',
    status: 'BLOCKED',
    isConfirmed: true,
    confirmedAt: '2026-08-27 11:00 UTC',
    confirmedBy: 'Tech Lead (Wu)',
    dependsOn: ['DEV-039'],
    requiredContracts: ['payment-contract.yaml'],
    requiredArtifacts: ['PaymentLedgerSchema.sql'],
    producesArtifacts: [],
    scope: {
      allowed: ['src/features/payment/**', 'tests/features/payment/**'],
      forbidden: ['src/features/auth/**', 'src/ui/**'],
      contracts: ['payment-contract.yaml'],
      artifacts: ['PaymentLedgerSchema.sql']
    },
    capabilities: {
      skills: ['TypeScript', 'Payment Systems', 'Idempotency'],
      mcpServers: ['Codebase Memory'],
      status: 'SEALED',
      sealedAt: '2026-08-27 11:05 UTC'
    },
    acceptance: [
      { id: 'AC-1', description: '幂等性键 (Idempotency Key) 严格保障单笔订单绝不重复扣款', passed: false },
      { id: 'AC-2', description: '支持 USD/EUR/GBP/JPY 汇率四舍五入与复式记账', passed: false }
    ],
    forbiddenItems: ['禁止跨线程共享未经锁保护的账单事务状态'],
    constructionPlan: [
      '1. 封装 PaymentGatewayClient 适配器',
      '2. 实现 IdempotentLedgerWriter 写入器',
      '3. 对接 Webhook 回调验签'
    ],
    completionReceipts: [],
    blockedReason: '支付 SDK v4.2 与当前冻结的 PaymentContract v1.0 产生参数定义不兼容（要求 intent_id 升级为 RFC-9562 格式）。',
    blockResolutionOptions: [
      {
        key: 'A',
        title: '保持当前 Contract，修改适配器实现',
        description: '在 PaymentGatewayClient 内部做格式转换，保持 PaymentContract v1.0 冻结不变。',
        impact: '范围最小，不影响下游任何已冻结模块。'
      },
      {
        key: 'B',
        title: '升级 PaymentContract 至 v2.0',
        description: '将 PaymentContract 解冻并升级为 v2.0，统一对外暴露最新 RFC-9562 字段。',
        impact: '将触发下游 DEV-046 / DEV-048 的依赖审查 (Impact Detected)。'
      },
      {
        key: 'C',
        title: '延期此支付管道功能至 V1.3',
        description: '将 DEV-044 标记为 DEFERRED，移除本里程碑阻塞依赖。',
        impact: 'Milestone V1.2 仍可继续推进并按期发布。'
      }
    ],
    historyRuns: []
  },
  'DEV-045': {
    nodeId: 'DEV-045',
    title: '分布式事务审计与操作日志流水',
    goal: '实现高吞吐结构化 AuditLogWriter，支持系统事件哈希链校验与不可篡改存证。',
    status: 'AUDITING',
    isConfirmed: true,
    confirmedAt: '2026-08-27 10:00 UTC',
    confirmedBy: 'Tech Lead (Wu)',
    dependsOn: ['DEV-039'],
    requiredContracts: ['storage-contract.yaml'],
    requiredArtifacts: ['CoreCryptoBundle.wasm'],
    producesArtifacts: [],
    scope: {
      allowed: ['src/core/audit/**', 'tests/core/audit/**'],
      forbidden: ['src/features/payment/**', 'src/features/auth/**'],
      contracts: ['storage-contract.yaml'],
      artifacts: ['CoreCryptoBundle.wasm']
    },
    capabilities: {
      skills: ['TypeScript', 'Merkle Tree', 'Storage IO'],
      mcpServers: ['Codebase Memory'],
      status: 'SEALED',
      sealedAt: '2026-08-27 10:05 UTC'
    },
    acceptance: [
      { id: 'AC-1', description: '每条审计记录携带上一个 Block 的 Hash，构成哈希链', passed: true, testReference: 'audit_chain.test.ts' },
      { id: 'AC-2', description: '写入延迟 < 1.5ms (异步批量落盘)', passed: true, testReference: 'audit_bench.test.ts' }
    ],
    forbiddenItems: ['禁止阻塞业务请求的主线程 IO'],
    constructionPlan: [
      '1. 构建 HashLinkedAuditEntry 数据结构',
      '2. 接入 CoreCryptoBundle.wasm 进行哈希链签名',
      '3. 实现非阻塞 RingBuffer 批量写入'
    ],
    completionReceipts: [],
    slotNumber: 3,
    currentRun: {
      runId: 'RUN-045-001',
      nodeId: 'DEV-045',
      workerName: 'Pi + Luna',
      state: 'COMPLETED',
      startedAt: '2026-08-27 14:00 UTC',
      completedAt: '2026-08-27 14:35 UTC',
      slotNumber: 3,
      workspacePath: '.yu/worktrees/run-045-001',
      scope: ['src/core/audit/**'],
      changedFilesCount: 4,
      changedFiles: ['src/core/audit/audit_writer.ts', 'src/core/audit/hash_chain.ts', 'src/core/audit/ring_buffer.ts', 'tests/core/audit/audit.test.ts'],
      diffSummary: '+310 -14 lines',
      testPassedCount: 16,
      testTotalCount: 16,
      evidence: {
        diffSnippet: `+ export class HashLinkedAuditLog {\n+   private prevHash: string = GENESIS_HASH;\n+   public record(event: AuditEvent): void {\n+     const currentHash = computeHash(this.prevHash, event);\n+     this.ringBuffer.push({ ...event, prevHash: this.prevHash, hash: currentHash });\n+     this.prevHash = currentHash;\n+   }\n+ }`,
        testOutput: '✓ 16 tests passed (0 failures) in 320ms',
        executionLogs: [
          '[14:00:10] Worktree .yu/worktrees/run-045-001 initialized',
          '[14:30:15] Unit tests & Benchmark passed with 100% assertions green',
          '[14:35:00] Worker Pi+Luna status: WORK_COMPLETED -> Handed off to Fresh Claude Final Review'
        ],
        commandsRun: ['npm run test:audit', 'git diff --name-only'],
        gitCommitHash: '8b9101d',
        integrityHash: '4410a991823bc99',
        auditVerdict: {
          reviewer: 'Fresh Claude',
          status: 'PASS',
          evaluatedAt: '2026-08-27 14:40 UTC',
          auditScope: 'Isolated to RUN-045-001 (Audit Package #045)',
          findings: [
            {
              id: 'Finding-009',
              severity: 'LOW',
              file: 'src/core/audit/ring_buffer.ts',
              line: 42,
              message: '建议增加溢出阈值监控告警，避免极端高并发下队列占满丢包',
              status: 'OPEN'
            }
          ],
          summary: 'Audit log engine meets all isolation and cryptographic chaining requirements.'
        }
      }
    },
    historyRuns: []
  },
  'DEV-046': {
    nodeId: 'DEV-046',
    title: '财务记账分录与对账结算引擎',
    goal: '依赖 DEV-044 支付管道，生成会计复式记账借贷分录，实现日终对账平账。',
    status: 'WAITING',
    isConfirmed: true,
    confirmedAt: '2026-08-27 11:30 UTC',
    confirmedBy: 'Tech Lead (Wu)',
    dependsOn: ['DEV-044', 'DEV-045'],
    requiredContracts: ['payment-contract.yaml', 'storage-contract.yaml'],
    requiredArtifacts: ['PaymentLedgerSchema.sql'],
    producesArtifacts: [],
    scope: {
      allowed: ['src/features/accounting/**', 'tests/features/accounting/**'],
      forbidden: ['src/features/auth/**'],
      contracts: ['payment-contract.yaml', 'storage-contract.yaml'],
      artifacts: ['PaymentLedgerSchema.sql']
    },
    capabilities: {
      skills: ['TypeScript', 'Accounting Engine'],
      mcpServers: ['Codebase Memory'],
      status: 'SEALED',
      sealedAt: '2026-08-27 11:35 UTC'
    },
    acceptance: [
      { id: 'AC-1', description: '借贷分录金额必须恒等 balance = 0', passed: false },
      { id: 'AC-2', description: '支持对账流水自动差异标记 (DISCREPANCY_FLAG)', passed: false }
    ],
    forbiddenItems: ['禁止跨日期的单向资金调整'],
    constructionPlan: ['1. 双分录会计模型', '2. 日终平账流水比对'],
    completionReceipts: [],
    historyRuns: []
  },
  'DEV-047': {
    nodeId: 'DEV-047',
    title: '系统配置中心与动态特征开关 (Feature Flags Engine)',
    goal: '实现基于租户与环境的动态配置管理，支持灰度发布规则评估。',
    status: 'READY',
    isConfirmed: true,
    confirmedAt: '2026-08-27 14:00 UTC',
    confirmedBy: 'Tech Lead (Wu)',
    dependsOn: ['DEV-039'],
    requiredContracts: ['storage-contract.yaml'],
    requiredArtifacts: ['CoreCryptoBundle.wasm'],
    producesArtifacts: [],
    scope: {
      allowed: ['src/features/config/**', 'tests/features/config/**'],
      forbidden: ['src/features/auth/**', 'src/features/payment/**'],
      contracts: ['storage-contract.yaml'],
      artifacts: ['CoreCryptoBundle.wasm']
    },
    capabilities: {
      skills: ['TypeScript', 'Feature Flags'],
      mcpServers: ['Codebase Memory'],
      status: 'SEALED',
      sealedAt: '2026-08-27 14:05 UTC'
    },
    acceptance: [
      { id: 'AC-1', description: '灰度规则评估耗时 < 0.1ms', passed: false },
      { id: 'AC-2', description: '支持百分比分流与用户属性标签过滤', passed: false }
    ],
    forbiddenItems: ['禁止在配置变更时发生阻塞式全局重锁'],
    constructionPlan: ['1. 内存配置快照与读写分离', '2. 规则表达式求值器'],
    completionReceipts: [],
    historyRuns: []
  },
  'DEV-048': {
    nodeId: 'DEV-048',
    title: '支付收银台与账单报表前端页面',
    goal: '开发用户支付收银台、订单结算明细与账单下载界面。',
    status: 'WAITING',
    isConfirmed: true,
    confirmedAt: '2026-08-27 12:00 UTC',
    confirmedBy: 'Tech Lead (Wu)',
    dependsOn: ['DEV-044', 'DEV-043'],
    requiredContracts: ['payment-contract.yaml', 'auth-contract.yaml'],
    requiredArtifacts: [],
    producesArtifacts: [],
    scope: {
      allowed: ['src/ui/payment/**', 'tests/ui/payment/**'],
      forbidden: ['src/core/**', 'src/features/**'],
      contracts: ['payment-contract.yaml', 'auth-contract.yaml'],
      artifacts: []
    },
    capabilities: {
      skills: ['React', 'Tailwind CSS', 'Payment SDK'],
      mcpServers: ['Codebase Memory'],
      status: 'SEALED',
      sealedAt: '2026-08-27 12:05 UTC'
    },
    acceptance: [
      { id: 'AC-1', description: '支持信用卡、Apple Pay、Google Pay 等多种支付渠道', passed: false },
      { id: 'AC-2', description: '支付失败友好的错误原因展示与重试引导', passed: false }
    ],
    forbiddenItems: ['禁止在前端明文日志收集信用卡 CVV 码'],
    constructionPlan: ['1. CheckoutModal 与 PaymentElement 封装', '2. 订单状态轮询与成功页'],
    completionReceipts: [],
    historyRuns: []
  }
};

export const INITIAL_PROJECT_FILES: ProjectFile[] = [
  {
    id: 'src',
    name: 'src',
    path: 'src',
    type: 'folder',
    children: [
      {
        id: 'src-core',
        name: 'core',
        path: 'src/core',
        type: 'folder',
        children: [
          {
            id: 'src-core-crypto',
            name: 'crypto',
            path: 'src/core/crypto',
            type: 'folder',
            children: [
              { id: 'src-core-crypto-wasm', name: 'wasm_bridge.ts', path: 'src/core/crypto/wasm_bridge.ts', type: 'file', language: 'typescript' },
              { id: 'src-core-crypto-hasher', name: 'hasher.ts', path: 'src/core/crypto/hasher.ts', type: 'file', language: 'typescript' }
            ]
          },
          {
            id: 'src-core-auth',
            name: 'auth',
            path: 'src/core/auth',
            type: 'folder',
            children: [
              { id: 'src-core-auth-token', name: 'token_decoder.ts', path: 'src/core/auth/token_decoder.ts', type: 'file', language: 'typescript' },
              { id: 'src-core-auth-revoc', name: 'revocation.ts', path: 'src/core/auth/revocation.ts', type: 'file', language: 'typescript' }
            ]
          },
          {
            id: 'src-core-audit',
            name: 'audit',
            path: 'src/core/audit',
            type: 'folder',
            children: [
              { id: 'src-core-audit-writer', name: 'audit_writer.ts', path: 'src/core/audit/audit_writer.ts', type: 'file', status: 'modified', language: 'typescript' },
              { id: 'src-core-audit-chain', name: 'hash_chain.ts', path: 'src/core/audit/hash_chain.ts', type: 'file', status: 'modified', language: 'typescript' },
              { id: 'src-core-audit-ring', name: 'ring_buffer.ts', path: 'src/core/audit/ring_buffer.ts', type: 'file', status: 'modified', language: 'typescript' }
            ]
          }
        ]
      },
      {
        id: 'src-features',
        name: 'features',
        path: 'src/features',
        type: 'folder',
        children: [
          {
            id: 'src-features-auth',
            name: 'auth',
            path: 'src/features/auth',
            type: 'folder',
            children: [
              { id: 'src-features-auth-service', name: 'auth.service.ts', path: 'src/features/auth/auth.service.ts', type: 'file', status: 'modified', language: 'typescript' },
              { id: 'src-features-auth-tenant', name: 'tenant.policy.ts', path: 'src/features/auth/tenant.policy.ts', type: 'file', status: 'modified', language: 'typescript' }
            ]
          },
          {
            id: 'src-features-gateway',
            name: 'gateway',
            path: 'src/features/gateway',
            type: 'folder',
            children: [
              { id: 'src-features-gateway-interceptor', name: 'auth.interceptor.ts', path: 'src/features/gateway/auth.interceptor.ts', type: 'file', status: 'modified', language: 'typescript' },
              { id: 'src-features-gateway-rate', name: 'rate_limiter.ts', path: 'src/features/gateway/rate_limiter.ts', type: 'file', status: 'modified', language: 'typescript' }
            ]
          },
          {
            id: 'src-features-payment',
            name: 'payment',
            path: 'src/features/payment',
            type: 'folder',
            children: [
              { id: 'src-features-payment-processor', name: 'payment.processor.ts', path: 'src/features/payment/payment.processor.ts', type: 'file', language: 'typescript' },
              { id: 'src-features-payment-ledger', name: 'ledger_writer.ts', path: 'src/features/payment/ledger_writer.ts', type: 'file', language: 'typescript' }
            ]
          }
        ]
      },
      {
        id: 'src-ui',
        name: 'ui',
        path: 'src/ui',
        type: 'folder',
        children: [
          { id: 'src-ui-auth-login', name: 'AuthLoginView.tsx', path: 'src/ui/auth/AuthLoginView.tsx', type: 'file', language: 'typescript' },
          { id: 'src-ui-auth-mfa', name: 'MfaChallengeModal.tsx', path: 'src/ui/auth/MfaChallengeModal.tsx', type: 'file', language: 'typescript' }
        ]
      }
    ]
  },
  {
    id: 'contracts',
    name: 'contracts',
    path: 'contracts',
    type: 'folder',
    children: [
      { id: 'contracts-auth', name: 'auth-contract.yaml', path: 'contracts/auth-contract.yaml', type: 'file', isFrozen: true, language: 'yaml' },
      { id: 'contracts-payment', name: 'payment-contract.yaml', path: 'contracts/payment-contract.yaml', type: 'file', isFrozen: true, language: 'yaml' },
      { id: 'contracts-storage', name: 'storage-contract.yaml', path: 'contracts/storage-contract.yaml', type: 'file', isFrozen: true, language: 'yaml' }
    ]
  },
  {
    id: 'artifacts',
    name: 'artifacts',
    path: 'artifacts',
    type: 'folder',
    children: [
      { id: 'artifacts-schema', name: 'AuthSchema.json', path: 'artifacts/AuthSchema.json', type: 'file', isFrozen: true, language: 'json' },
      { id: 'artifacts-wasm', name: 'CoreCryptoBundle.wasm', path: 'artifacts/CoreCryptoBundle.wasm', type: 'file', isFrozen: true, language: 'wasm' },
      { id: 'artifacts-sql', name: 'PaymentLedgerSchema.sql', path: 'artifacts/PaymentLedgerSchema.sql', type: 'file', isFrozen: true, language: 'sql' }
    ]
  },
  {
    id: 'specs',
    name: 'specs',
    path: 'specs',
    type: 'folder',
    children: [
      { id: 'specs-v12', name: 'milestone-v1.2.spec.md', path: 'specs/milestone-v1.2.spec.md', type: 'file', language: 'markdown' }
    ]
  },
  {
    id: '.yu',
    name: '.yu',
    path: '.yu',
    type: 'folder',
    children: [
      { id: 'yu-manifest', name: 'manifest.lock', path: '.yu/manifest.lock', type: 'file', language: 'json' },
      { id: 'yu-dag', name: 'dag.state.json', path: '.yu/dag.state.json', type: 'file', language: 'json' }
    ]
  }
];

export const INITIAL_IMPLEMENTATION_NODES: ImplementationNode[] = [
  { id: 'AuthController', name: 'AuthController', kind: 'controller', file: 'src/features/auth/auth.controller.ts', calls: ['AuthService', 'RateLimiter'], x: 260, y: 50 },
  { id: 'AuthService', name: 'AuthService', kind: 'service', file: 'src/features/auth/auth.service.ts', calls: ['TokenService', 'UserRepo', 'TenantPolicy'], x: 260, y: 160 },
  { id: 'TokenService', name: 'TokenService', kind: 'service', file: 'src/core/auth/token_decoder.ts', calls: ['CryptoEngine'], x: 120, y: 280 },
  { id: 'UserRepo', name: 'UserRepo', kind: 'repo', file: 'src/features/auth/user.repo.ts', calls: ['DatabasePool'], x: 300, y: 280 },
  { id: 'TenantPolicy', name: 'TenantPolicy', kind: 'service', file: 'src/features/auth/tenant.policy.ts', calls: [], x: 440, y: 280 },
  { id: 'CryptoEngine', name: 'CryptoEngine (Wasm)', kind: 'service', file: 'src/core/crypto/wasm_bridge.ts', calls: [], x: 120, y: 390 },
  { id: 'auth.test.ts', name: 'auth.test.ts', kind: 'test', file: 'tests/features/auth/auth.service.test.ts', calls: ['AuthService', 'TokenService'], x: 300, y: 390 }
];

export const INITIAL_PLANNING_NODES: PlanningNode[] = [
  { id: 'REQ-AUTH', title: '用户中心与多租户权限隔离体系', category: 'requirement', status: 'frozen', linkedDevs: ['DEV-040', 'DEV-041', 'DEV-042', 'DEV-043'], x: 80, y: 60 },
  { id: 'CTR-AUTH-V2', title: 'AuthContract v2.1 (FROZEN)', category: 'contract', status: 'frozen', linkedDevs: ['DEV-040', 'DEV-041', 'DEV-042'], x: 80, y: 190 },
  { id: 'DEC-WORKTREE', title: 'Git Worktree 物理隔离执行设计', category: 'decision', status: 'frozen', linkedDevs: ['DEV-039', 'DEV-041', 'DEV-042'], x: 360, y: 60 },
  { id: 'DEV-041-P', title: 'DEV-041 AuthService (RUNNING)', category: 'dev', status: 'frozen', linkedDevs: [], x: 360, y: 190 },
  { id: 'DEV-042-P', title: 'DEV-042 Gateway Interceptor (RUNNING)', category: 'dev', status: 'frozen', linkedDevs: [], x: 360, y: 300 },
  { id: 'REQ-PAYMENT', title: '全球合规多币种支付管道', category: 'requirement', status: 'draft', linkedDevs: ['DEV-044', 'DEV-046', 'DEV-048'], x: 620, y: 60 },
  { id: 'CTR-PAY-V1', title: 'PaymentContract v1.0 (BLOCKED ISSUE)', category: 'contract', status: 'draft', linkedDevs: ['DEV-044'], x: 620, y: 190 }
];

export const INITIAL_COPILOT_MESSAGES: CopilotMessage[] = [
  {
    id: 'msg-1',
    sender: 'claude',
    timestamp: '15:40',
    content: `当前项目：**Aurora** (Milestone: **V1.2**)
- 已完成: **28 / 47** 节点 (PASS)
- 当前活跃运行: **2** (DEV-041, DEV-042)
- 阻塞节点: **1** (DEV-044)
- 终审中: **1** (DEV-045)
- 就绪节点: **3** (DEV-047 等待调度)

⚠️ **当前需要注意：**
**DEV-044** 因支付 SDK v4.2 与当前冻结的 \`PaymentContract v1.0\` 字段定义不匹配处于 **BLOCKED** 状态。请审阅下方的决策建议：`,
    blockAction: {
      nodeId: 'DEV-044',
      options: [
        {
          key: 'A',
          title: 'A: 保持当前 Contract，修改适配器实现',
          description: '在 PaymentGatewayClient 内部做格式转换，保持 PaymentContract v1.0 冻结不变。',
          impact: '范围最小，不影响下游任何已冻结模块。'
        },
        {
          key: 'B',
          title: 'B: 升级 PaymentContract 至 v2.0',
          description: '将 PaymentContract 解冻并升级为 v2.0，统一对外暴露最新 RFC-9562 字段。',
          impact: '将触发下游 DEV-046 / DEV-048 的依赖审查 (Impact Detected)。'
        },
        {
          key: 'C',
          title: 'C: 延期此支付管道功能至 V1.3',
          description: '将 DEV-044 标记为 DEFERRED，移除本里程碑阻塞依赖。',
          impact: 'Milestone V1.2 仍可继续推进并按期发布。'
        }
      ]
    }
  }
];
