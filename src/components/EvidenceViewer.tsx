import React from 'react';
import { 
  ShieldCheck, 
  FileCode, 
  Terminal, 
  Lock, 
  Cpu, 
  GitCommit
} from 'lucide-react';
import { DevManifest } from '../types';

interface EvidenceViewerProps {
  node: DevManifest;
}

export const EvidenceViewer: React.FC<EvidenceViewerProps> = ({ node }) => {
  const activeRun = node.currentRun || (node.historyRuns && node.historyRuns[0]);

  if (!activeRun) {
    return (
      <div className="max-w-3xl mx-auto p-12 text-center text-[rgba(255,255,255,0.4)] font-sans text-xs border border-dashed border-[rgba(255,255,255,0.08)] rounded-xs bg-[#111113]">
        <Cpu className="w-8 h-8 mx-auto mb-3 text-[rgba(255,255,255,0.3)]" />
        <p className="font-semibold text-white mb-1">No Construction Run Executed Yet</p>
        <p className="text-[11px] text-[rgba(255,255,255,0.4)] max-w-sm mx-auto">
          This Node is currently in [{node.status}]. Confirm DEV and satisfy dependencies to launch an isolated ephemeral run.
        </p>
      </div>
    );
  }

  const { evidence } = activeRun;
  const verdict = evidence.auditVerdict;

  return (
    <div className="max-w-3xl mx-auto space-y-4 select-none font-sans text-xs">
      {/* Run Metadata Header */}
      <div className="p-4 bg-[#111113] rounded-xs border border-[rgba(255,255,255,0.075)] flex items-center justify-between">
        <div className="flex items-center space-x-3">
          <div className="p-2 bg-[rgba(255,255,255,0.04)] text-white border border-[rgba(255,255,255,0.08)] rounded-xs">
            <Cpu className="w-4 h-4" />
          </div>
          <div>
            <div className="flex items-center space-x-2">
              <span className="font-mono font-bold text-white text-sm">{activeRun.runId}</span>
              <span className="px-2 py-0.5 bg-[rgba(255,255,255,0.04)] text-[rgba(255,255,255,0.75)] rounded-xs text-[10px] border border-[rgba(255,255,255,0.08)] font-sans font-medium">
                Worker: {activeRun.workerName}
              </span>
            </div>
            <div className="text-[11px] text-[rgba(255,255,255,0.4)] mt-0.5 font-mono">
              Workspace: <span className="text-[rgba(255,255,255,0.75)]">{activeRun.workspacePath}</span>
            </div>
          </div>
        </div>

        <div className="text-right font-sans">
          <div className="text-[11px] text-[rgba(255,255,255,0.4)]">
            Started: <span className="text-white font-mono">{activeRun.startedAt}</span>
          </div>
          {activeRun.completedAt && (
            <div className="text-[11px] text-[rgba(255,255,255,0.4)] mt-0.5">
              Completed: <span className="text-[#55c98b] font-mono">{activeRun.completedAt}</span>
            </div>
          )}
        </div>
      </div>

      {/* Fresh Claude Final Review Verdict Card */}
      {verdict ? (
        <div className="p-4 bg-[#111113] rounded-xs border border-[rgba(255,255,255,0.12)] space-y-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-2">
              <ShieldCheck className="w-4 h-4 text-white" />
              <span className="font-bold text-white text-sm font-sans">Fresh Claude Final Review</span>
              <span className="text-[10px] px-1.5 py-0.5 bg-[rgba(255,255,255,0.04)] text-[rgba(255,255,255,0.6)] border border-[rgba(255,255,255,0.08)] rounded-xs font-mono">
                Stateless Review Run
              </span>
            </div>

            <span className={`px-2 py-0.5 rounded-xs text-xs font-mono font-medium ${
              verdict.status === 'PASS' 
                ? 'bg-[rgba(85,201,139,0.08)] text-[#55c98b] border border-[rgba(85,201,139,0.3)]' 
                : 'bg-[rgba(236,106,106,0.08)] text-[#ec6a6a] border border-[rgba(236,106,106,0.3)]'
            }`}>
              VERDICT: {verdict.status}
            </span>
          </div>

          <div className="bg-[#0E0E10] p-3 rounded-xs border border-[rgba(255,255,255,0.06)] text-[rgba(255,255,255,0.85)] text-[11px] leading-relaxed font-sans">
            {verdict.summary}
          </div>

          <div className="grid grid-cols-2 gap-2 text-[10px] text-[rgba(255,255,255,0.4)] pt-1 border-t border-[rgba(255,255,255,0.06)] font-mono">
            <div>
              <span className="text-[rgba(255,255,255,0.25)] font-semibold">AUDIT SCOPE:</span> {verdict.auditScope}
            </div>
            <div className="text-right">
              <span className="text-[rgba(255,255,255,0.25)] font-semibold">EVALUATED AT:</span> {verdict.evaluatedAt}
            </div>
          </div>

          {verdict.findings && verdict.findings.length > 0 && (
            <div className="space-y-1.5 pt-2">
              <span className="text-[10px] font-medium text-[rgba(255,255,255,0.4)] block font-sans">FINDINGS:</span>
              {verdict.findings.map(f => (
                <div key={f.id} className="p-2 bg-[rgba(255,255,255,0.02)] border border-[rgba(255,255,255,0.08)] rounded-xs flex items-center justify-between text-[11px]">
                  <div className="flex items-center space-x-2">
                    <span className="px-1.5 py-0.2 bg-[rgba(255,255,255,0.04)] text-white rounded-xs font-mono text-[10px]">
                      {f.severity}
                    </span>
                    <span className="text-white font-mono">{f.file}:{f.line}</span>
                    <span className="text-[rgba(255,255,255,0.6)] font-sans">— {f.message}</span>
                  </div>
                  <span className="text-[10px] text-white font-mono uppercase">{f.status}</span>
                </div>
              ))}
            </div>
          )}
        </div>
      ) : (
        <div className="p-3 bg-[#111113] rounded-xs border border-[rgba(255,255,255,0.075)] flex items-center justify-between text-[rgba(255,255,255,0.4)]">
          <div className="flex items-center space-x-2">
            <ShieldCheck className="w-4 h-4 text-[rgba(255,255,255,0.3)]" />
            <span>Audit Stage: <strong className="text-white">Awaiting Fresh Claude Review</strong></span>
          </div>
          <span className="text-[10px] text-[rgba(255,255,255,0.3)]">Scope will be strictly isolated to this Run Package</span>
        </div>
      )}

      {/* Code Diff Section */}
      <div className="p-4 bg-[#111113] rounded-xs border border-[rgba(255,255,255,0.075)] space-y-2">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-2">
            <FileCode className="w-3.5 h-3.5 text-[rgba(255,255,255,0.6)]" />
            <span className="font-semibold text-white font-sans">Changed Files & Diff</span>
          </div>
          <span className="text-[10px] font-mono text-[rgba(255,255,255,0.4)]">{activeRun.diffSummary}</span>
        </div>

        <div className="flex flex-wrap gap-1.5 mb-2">
          {activeRun.changedFiles.map((file, idx) => (
            <span key={idx} className="px-2 py-0.5 bg-[#0E0E10] text-[rgba(255,255,255,0.85)] rounded-xs border border-[rgba(255,255,255,0.08)] font-mono text-[10px]">
              {file}
            </span>
          ))}
        </div>

        <pre className="bg-[#0E0E10] p-3 rounded-xs border border-[rgba(255,255,255,0.06)] font-mono text-[11px] text-[#55c98b] leading-relaxed overflow-x-auto">
          {evidence.diffSnippet}
        </pre>
      </div>

      {/* Test Execution Output */}
      <div className="p-4 bg-[#111113] rounded-xs border border-[rgba(255,255,255,0.075)] space-y-2">
        <div className="flex items-center space-x-2">
          <Terminal className="w-3.5 h-3.5 text-[rgba(255,255,255,0.6)]" />
          <span className="font-semibold text-white font-sans">Automated Test Results</span>
        </div>

        <div className="bg-[#0E0E10] p-3 rounded-xs border border-[rgba(255,255,255,0.06)] text-[11px] space-y-1 font-mono">
          <div className="text-[#55c98b] font-medium">{evidence.testOutput}</div>
          <div className="text-[rgba(255,255,255,0.3)] text-[10px] mt-2 font-sans">Commands executed in container sandbox:</div>
          {evidence.commandsRun.map((cmd, idx) => (
            <div key={idx} className="text-[rgba(255,255,255,0.6)] text-[10px] pl-2 font-mono">
              $ {cmd}
            </div>
          ))}
        </div>
      </div>

      {/* Cryptographic Hashes & Receipts */}
      <div className="grid grid-cols-2 gap-4">
        <div className="p-3 bg-[#111113] rounded-xs border border-[rgba(255,255,255,0.075)]">
          <span className="text-[rgba(255,255,255,0.4)] text-[10px] block mb-1 font-sans font-medium">GIT COMMIT HASH</span>
          <div className="flex items-center space-x-1.5 text-white font-mono">
            <GitCommit className="w-3 h-3 text-[rgba(255,255,255,0.5)]" />
            <span className="font-medium">{evidence.gitCommitHash}</span>
          </div>
        </div>

        <div className="p-3 bg-[#111113] rounded-xs border border-[rgba(255,255,255,0.075)]">
          <span className="text-[rgba(255,255,255,0.4)] text-[10px] block mb-1 font-sans font-medium">INTEGRITY SHA-256</span>
          <div className="flex items-center space-x-1.5 text-white font-mono">
            <Lock className="w-3 h-3 text-[rgba(255,255,255,0.5)]" />
            <span className="font-medium">{evidence.integrityHash}</span>
          </div>
        </div>
      </div>
    </div>
  );
};

