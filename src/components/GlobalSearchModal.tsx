import React, { useState, useEffect } from 'react';
import { Search, X, FileCode, Lock, Cpu, Database, ChevronRight } from 'lucide-react';
import { DevManifest, ContractItem, ProjectFile } from '../types';

interface GlobalSearchModalProps {
  isOpen: boolean;
  onClose: () => void;
  devs: Record<string, DevManifest>;
  contracts: Record<string, ContractItem>;
  files: ProjectFile[];
  onSelectNode: (nodeId: string) => void;
}

export const GlobalSearchModal: React.FC<GlobalSearchModalProps> = ({
  isOpen,
  onClose,
  devs,
  contracts,
  files,
  onSelectNode
}) => {
  const [query, setQuery] = useState('');

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key === 'k') {
        e.preventDefault();
        // Toggle search
      }
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

  return (
    <div className="fixed inset-0 bg-black/80 backdrop-blur-xs flex items-start justify-center pt-20 z-50 p-4 font-sans select-none">
      <div className="bg-[#121212] border border-[#262626] w-full max-w-xl rounded-sm shadow-2xl overflow-hidden">
        {/* Search Input Bar */}
        <div className="p-3 border-b border-[#262626] flex items-center space-x-3 bg-[#0A0A0A]">
          <Search className="w-4 h-4 text-[#737373] shrink-0" />
          <input
            autoFocus
            type="text"
            value={query}
            onChange={e => setQuery(e.target.value)}
            placeholder="Search project, DEV, Node, Contract, file, Run..."
            className="w-full bg-transparent text-white placeholder:text-[#525252] text-xs font-mono outline-none"
          />
          <button onClick={onClose} className="text-[#737373] hover:text-white p-1 cursor-pointer">
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Results List */}
        <div className="max-h-80 overflow-y-auto p-2 space-y-1 font-mono text-xs scrollbar-thin scrollbar-thumb-[#262626]">
          {/* DEVs */}
          {devResults.length > 0 && (
            <div className="mb-2">
              <span className="text-[10px] text-[#737373] font-bold uppercase px-2">CONSTRUCTION NODES</span>
              {devResults.map(d => (
                <button
                  key={d.nodeId}
                  onClick={() => {
                    onSelectNode(d.nodeId);
                    onClose();
                  }}
                  className="w-full flex items-center justify-between p-2 rounded-xs hover:bg-[#1A1A1A] text-[#E5E5E5] text-left transition-colors cursor-pointer border border-transparent hover:border-[#262626]"
                >
                  <div className="flex items-center space-x-2">
                    <span className="font-bold text-blue-400">{d.nodeId}</span>
                    <span className="text-[#D4D4D4] truncate max-w-sm">{d.title}</span>
                  </div>
                  <span className="text-[10px] text-[#737373] uppercase font-bold">{d.status}</span>
                </button>
              ))}
            </div>
          )}

          {/* Contracts */}
          {contractResults.length > 0 && (
            <div>
              <span className="text-[10px] text-[#737373] font-bold uppercase px-2">CONTRACTS</span>
              {contractResults.map(c => (
                <div
                  key={c.id}
                  className="w-full flex items-center justify-between p-2 rounded-xs hover:bg-[#1A1A1A] text-[#E5E5E5] text-left transition-colors cursor-pointer border border-transparent hover:border-[#262626]"
                >
                  <div className="flex items-center space-x-2">
                    <Lock className="w-3.5 h-3.5 text-cyan-400" />
                    <span className="font-bold text-cyan-300">{c.name}</span>
                    <span className="text-[#737373] text-[10px]">({c.version})</span>
                  </div>
                  <span className="text-[10px] text-cyan-400 bg-cyan-500/10 px-1.5 py-0.2 rounded-xs border border-cyan-500/30 font-bold">
                    {c.status}
                  </span>
                </div>
              ))}
            </div>
          )}

          {devResults.length === 0 && contractResults.length === 0 && (
            <div className="p-8 text-center text-[#525252] text-xs">
              No matching records found.
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
