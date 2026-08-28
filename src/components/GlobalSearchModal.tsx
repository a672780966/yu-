import React, { useState, useEffect } from 'react';
import { Search, X, FileCode, Lock, File } from 'lucide-react';
import { DevManifest, ContractItem, ProjectFile } from '../types';

interface GlobalSearchModalProps {
  isOpen: boolean;
  onClose: () => void;
  devs: Record<string, DevManifest>;
  contracts: Record<string, ContractItem>;
  files: ProjectFile[];
  onSelectNode: (nodeId: string) => void;
  onSelectFile?: (file: ProjectFile) => void;
}

export const GlobalSearchModal: React.FC<GlobalSearchModalProps> = ({
  isOpen,
  onClose,
  devs,
  contracts,
  files,
  onSelectNode,
  onSelectFile
}) => {
  const [query, setQuery] = useState('');

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && isOpen) {
        onClose();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  const devResults: DevManifest[] = (Object.values(devs) as DevManifest[]).filter(
    d => d.nodeId.toLowerCase().includes(query.toLowerCase()) || d.title.toLowerCase().includes(query.toLowerCase())
  );

  const contractResults: ContractItem[] = (Object.values(contracts) as ContractItem[]).filter(
    c => c.name.toLowerCase().includes(query.toLowerCase()) || c.id.toLowerCase().includes(query.toLowerCase())
  );

  // Flatten files
  const flatFiles: ProjectFile[] = [];
  const walk = (items: ProjectFile[]) => {
    for (const item of items) {
      if (item.type === 'file') flatFiles.push(item);
      if (item.children) walk(item.children);
    }
  };
  walk(files);

  const fileResults = flatFiles.filter(f => f.name.toLowerCase().includes(query.toLowerCase()));

  return (
    <div 
      onClick={onClose}
      className="fixed inset-0 bg-black/75 backdrop-blur-xs flex items-start justify-center pt-24 z-50 p-4 font-sans select-none animate-in fade-in"
    >
      <div 
        onClick={e => e.stopPropagation()}
        className="bg-[#111113] border border-[rgba(255,255,255,0.1)] w-full max-w-lg rounded-xs shadow-2xl overflow-hidden"
      >
        {/* Search Input Bar (36px high input) */}
        <div className="p-3 border-b border-[rgba(255,255,255,0.08)] flex items-center space-x-2.5 bg-[#0B0B0C]">
          <Search className="w-4 h-4 text-[rgba(255,255,255,0.4)] shrink-0" />
          <input
            autoFocus
            type="text"
            value={query}
            onChange={e => setQuery(e.target.value)}
            placeholder="Search DEV units, Contracts, and Project files…"
            className="w-full bg-transparent text-white placeholder:text-[rgba(255,255,255,0.3)] text-xs font-sans outline-none"
          />
          <button
            onClick={onClose}
            className="w-7 h-7 flex items-center justify-center rounded-xs text-[rgba(255,255,255,0.4)] hover:text-white hover:bg-[rgba(255,255,255,0.06)] transition-colors cursor-pointer"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Results List */}
        <div className="max-h-80 overflow-y-auto p-2 space-y-2 text-xs font-sans scrollbar-thin">
          {/* DEVs */}
          {devResults.length > 0 && (
            <div>
              <span className="text-[10px] text-[rgba(255,255,255,0.4)] font-semibold uppercase px-2 tracking-wider">
                CONSTRUCTION NODES
              </span>
              <div className="space-y-0.5 mt-1">
                {devResults.map(d => (
                  <button
                    key={d.nodeId}
                    onClick={() => {
                      onSelectNode(d.nodeId);
                      onClose();
                    }}
                    className="w-full h-8 flex items-center justify-between px-2.5 rounded-xs hover:bg-[rgba(255,255,255,0.06)] text-white text-left transition-colors cursor-pointer"
                  >
                    <div className="flex items-center space-x-2 truncate">
                      <span className="font-mono font-semibold text-[#5e9cff] text-[11px]">{d.nodeId}</span>
                      <span className="text-[rgba(255,255,255,0.75)] truncate text-[11px]">{d.title}</span>
                    </div>
                    <span className="text-[10px] font-mono text-[rgba(255,255,255,0.4)] uppercase shrink-0">
                      {d.status}
                    </span>
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Contracts */}
          {contractResults.length > 0 && (
            <div>
              <span className="text-[10px] text-[rgba(255,255,255,0.4)] font-semibold uppercase px-2 tracking-wider">
                CONTRACTS
              </span>
              <div className="space-y-0.5 mt-1">
                {contractResults.map(c => (
                  <div
                    key={c.id}
                    className="w-full h-8 flex items-center justify-between px-2.5 rounded-xs hover:bg-[rgba(255,255,255,0.06)] text-[rgba(255,255,255,0.9)] text-left transition-colors"
                  >
                    <div className="flex items-center space-x-2">
                      <Lock className="w-3 h-3 text-[rgba(255,255,255,0.5)]" />
                      <span className="font-mono text-white text-[11px]">{c.name}</span>
                      <span className="text-[rgba(255,255,255,0.35)] text-[10px]">{c.version}</span>
                    </div>
                    <span className="text-[10px] font-mono text-[#55c98b]">
                      {c.status}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Files */}
          {fileResults.length > 0 && query && (
            <div>
              <span className="text-[10px] text-[rgba(255,255,255,0.4)] font-semibold uppercase px-2 tracking-wider">
                FILES
              </span>
              <div className="space-y-0.5 mt-1">
                {fileResults.map(f => (
                  <button
                    key={f.id}
                    onClick={() => {
                      onSelectFile?.(f);
                      onClose();
                    }}
                    className="w-full h-8 flex items-center justify-between px-2.5 rounded-xs hover:bg-[rgba(255,255,255,0.06)] text-left transition-colors cursor-pointer"
                  >
                    <div className="flex items-center space-x-2 truncate">
                      <File className="w-3 h-3 text-[rgba(255,255,255,0.4)]" />
                      <span className="font-mono text-[11px] text-[rgba(255,255,255,0.85)] truncate">{f.name}</span>
                    </div>
                    <span className="text-[10px] font-mono text-[rgba(255,255,255,0.35)] truncate max-w-[140px]">
                      {f.path}
                    </span>
                  </button>
                ))}
              </div>
            </div>
          )}

          {devResults.length === 0 && contractResults.length === 0 && (
            <div className="p-8 text-center text-[rgba(255,255,255,0.35)] text-xs">
              No matching records found.
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
