import React from 'react';
import { 
  ShieldCheck, 
  FileCode, 
  Terminal, 
  CheckCircle2, 
  AlertCircle, 
  Lock, 
  Cpu, 
  GitCommit,
  Layers,
  FileCheck
} from 'lucide-react';
import { DevManifest } from '../types';

interface EvidenceViewerProps {
  node: DevManifest;
}

export const EvidenceViewer: React.FC<EvidenceViewerProps> = ({ node }) => {
  const activeRun = node.currentRun || (node.historyRuns && node.historyRuns[0]);

  if (!activeRun) {
    return (
      <div className="max-w-4xl mx-auto p-12 text-center text-[#737373] font-mono text-xs border border-dashed border-[#262626] rounded-sm bg-[#0D0D0D]">
        <Cpu className="w-8 h-8 mx-auto mb-2 text-[#525252]" />
        <p className="font-semibold text-white mb-1">No Construction Run Executed Yet</p>
        <p className="text-[11px] text-[#737373]">
          This Node is currently in [{node.status}]. Confirm DEV and satisfy dependencies to launch an isolated ephemeral run.
        </p>
      </div>
    );
  }

  const { evidence } = activeRun;
  const verdict = evidence.auditVerdict;

  return (
    <div className="max-w-4xl mx-auto space-y-4 select-none font-mono text-xs">
      {/* Run Metadata Header */}
      <div className="bg-[#121212] p-4 rounded-sm border border-[#262626] flex items-center justify-between">
        <div className="flex items-center space-x-3">
          <div className="p-2 bg-[#1C1C1C] text-blue-400 border border-blue-500/30 rounded-xs">
            <Cpu className="w-5 h-5" />
          </div>
          <div>
            <div className="flex items-center space-x-2">
              <span className="font-bold text-white text-sm">{activeRun.runId}</span>
              <span className="px-2 py-0.5 bg-[#1C1C1C] text-blue-400 rounded-xs text-[10px] border border-blue-500/30 font-bold">
                Worker: {activeRun.workerName}
              </span>
            </div>
            <div className="text-[11px] text-[#737373] mt-0.5">
              Workspace: <span className="text-[#D4D4D4]">{activeRun.workspacePath}</span>
            </div>
          </div>
        </div>

        <div className="text-right">
          <div className="text-[11px] text-[#737373]">
            Started: <span className="text-white">{activeRun.startedAt}</span>
          </div>
          {activeRun.completedAt && (
            <div className="text-[11px] text-[#737373] mt-0.5">
              Completed: <span className="text-emerald-400">{activeRun.completedAt}</span>
            </div>
          )}
        </div>
      </div>

      {/* Fresh Claude Final Review Verdict Card */}
      {verdict ? (
        <div className="bg-[#14101A] p-4 rounded-sm border border-purple-500/40 space-y-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-2">
              <ShieldCheck className="w-4 h-4 text-purple-400" />
              <span className="font-bold text-purple-200 text-sm">FRESH CLAUDE FINAL REVIEW</span>
              <span className="text-[10px] px-1.5 py-0.5 bg-[#1E142B] text-purple-300 border border-purple-500/40 rounded-xs">
                Stateless Review Run
              </span>
            </div>

            <span className={`px-2 py-0.5 rounded-xs text-xs font-bold ${
              verdict.status === 'PASS' 
                ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/40' 
                : 'bg-amber-500/10 text-amber-300 border border-amber-500/40'
            }`}>
              VERDICT: {verdict.status}
            </span>
          </div>

          <div className="bg-[#0A0A0A] p-3 rounded-sm border border-purple-500/20 text-[#D4D4D4] text-[11px] leading-relaxed">
            {verdict.summary}
          </div>

          <div className="grid grid-cols-2 gap-2 text-[10px] text-[#737373] pt-1 border-t border-purple-500/20">
            <div>
              <span className="text-[#525252] font-semibold">AUDIT SCOPE:</span> {verdict.auditScope}
            </div>
            <div className="text-right">
              <span className="text-[#525252] font-semibold">EVALUATED AT:</span> {verdict.evaluatedAt}
            </div>
          </div>

          {verdict.findings && verdict.findings.length > 0 && (
            <div className="space-y-1.5 pt-2">
              <span className="text-[10px] font-bold text-[#A3A3A3] block">FINDINGS:</span>
              {verdict.findings.map(f => (
                <div key={f.id} className="p-2 bg-amber-500/10 border border-amber-500/30 rounded-sm flex items-center justify-between text-[11px]">
                  <div className="flex items-center space-x-2">
                    <span className="px-1.5 py-0.2 bg-amber-500/20 text-amber-300 rounded-xs font-bold text-[10px]">
                      {f.severity}
                    </span>
                    <span className="text-[#E5E5E5]">{f.file}:{f.line}</span>
                    <span className="text-[#A3A3A3]">— {f.message}</span>
                  </div>
                  <span className="text-[10px] text-amber-400 font-bold uppercase">{f.status}</span>
                </div>
              ))}
            </div>
          )}
        </div>
      ) : (
        <div className="bg-[#121212] p-3 rounded-sm border border-[#262626] flex items-center justify-between text-[#737373]">
          <div className="flex items-center space-x-2">
            <ShieldCheck className="w-4 h-4 text-[#525252]" />
            <span>Audit Stage: <strong className="text-white">Awaiting Fresh Claude Review</strong></span>
          </div>
          <span className="text-[10px] text-[#525252]">Scope will be strictly isolated to this Run Package</span>
        </div>
      )}

      {/* Code Diff Section */}
      <div className="bg-[#121212] p-4 rounded-sm border border-[#262626] space-y-2">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-2">
            <FileCode className="w-4 h-4 text-blue-400" />
            <span className="font-bold text-white">CHANGED FILES & DIFF</span>
          </div>
          <span className="text-[10px] text-[#737373]">{activeRun.diffSummary}</span>
        </div>

        <div className="flex flex-wrap gap-1.5 mb-2">
          {activeRun.changedFiles.map((file, idx) => (
            <span key={idx} className="px-2 py-0.5 bg-[#0A0A0A] text-[#D4D4D4] rounded-xs border border-[#262626] text-[10px]">
              {file}
            </span>
          ))}
        </div>

        <pre className="bg-[#0A0A0A] p-3 rounded-sm border border-[#262626] text-[11px] text-emerald-400 leading-relaxed overflow-x-auto">
          {evidence.diffSnippet}
        </pre>
      </div>

      {/* Test Execution Output */}
      <div className="bg-[#121212] p-4 rounded-sm border border-[#262626] space-y-2">
        <div className="flex items-center space-x-2">
          <Terminal className="w-4 h-4 text-amber-400" />
          <span className="font-bold text-white">AUTOMATED TEST RESULTS</span>
        </div>

        <div className="bg-[#0A0A0A] p-3 rounded-sm border border-[#262626] text-[11px] text-[#D4D4D4] space-y-1">
          <div className="text-emerald-400 font-bold">{evidence.testOutput}</div>
          <div className="text-[#737373] text-[10px] mt-2">Commands executed in container sandbox:</div>
          {evidence.commandsRun.map((cmd, idx) => (
            <div key={idx} className="text-[#A3A3A3] text-[10px] pl-2">
              $ {cmd}
            </div>
          ))}
        </div>
      </div>

      {/* Cryptographic Hashes & Receipts */}
      <div className="grid grid-cols-2 gap-4">
        <div className="bg-[#121212] p-3 rounded-sm border border-[#262626]">
          <span className="text-[#737373] text-[10px] block mb-1">GIT COMMIT HASH</span>
          <div className="flex items-center space-x-1.5 text-white">
            <GitCommit className="w-3.5 h-3.5 text-blue-400" />
            <span className="font-bold">{evidence.gitCommitHash}</span>
          </div>
        </div>

        <div className="bg-[#121212] p-3 rounded-sm border border-[#262626]">
          <span className="text-[#737373] text-[10px] block mb-1">INTEGRITY SHA-256</span>
          <div className="flex items-center space-x-1.5 text-white">
            <Lock className="w-3.5 h-3.5 text-cyan-400" />
            <span className="font-bold">{evidence.integrityHash}</span>
          </div>
        </div>
      </div>
    </div>
  );
};
