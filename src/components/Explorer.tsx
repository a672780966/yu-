import React, { useState } from 'react';
import { 
  Folder, 
  FolderOpen, 
  FileCode, 
  FileText, 
  Lock, 
  Check, 
  ShieldAlert, 
  Search, 
  FileJson,
  Database,
  Terminal,
  FileCheck2
} from 'lucide-react';
import { ProjectFile, DevManifest } from '../types';

interface ExplorerProps {
  files: ProjectFile[];
  selectedNode: DevManifest | null;
  activeFileId: string | null;
  onSelectFile: (file: ProjectFile) => void;
}

export const Explorer: React.FC<ExplorerProps> = ({
  files,
  selectedNode,
  activeFileId,
  onSelectFile
}) => {
  const [expandedFolders, setExpandedFolders] = useState<Record<string, boolean>>({
    'src': true,
    'src-core': true,
    'src-features': true,
    'contracts': true,
    'artifacts': true
  });
  const [searchQuery, setSearchQuery] = useState('');

  const toggleFolder = (folderId: string) => {
    setExpandedFolders(prev => ({
      ...prev,
      [folderId]: !prev[folderId]
    }));
  };

  // Helper to test if a file path is within allowed scope
  const isFileAllowed = (filePath: string): boolean => {
    if (!selectedNode) return true;
    return selectedNode.scope.allowed.some(pattern => {
      const cleanPattern = pattern.replace('/**', '').replace('/*', '');
      return filePath.startsWith(cleanPattern);
    });
  };

  // Helper to test if a file path is forbidden
  const isFileForbidden = (filePath: string): boolean => {
    if (!selectedNode) return false;
    return selectedNode.scope.forbidden.some(pattern => {
      const cleanPattern = pattern.replace('/**', '').replace('/*', '');
      return filePath.startsWith(cleanPattern);
    });
  };

  const getFileIcon = (file: ProjectFile) => {
    if (file.name.endsWith('.yaml') || file.name.endsWith('.yml')) {
      return <FileText className="w-3.5 h-3.5 text-amber-400 shrink-0" />;
    }
    if (file.name.endsWith('.json') || file.name.endsWith('.lock')) {
      return <FileJson className="w-3.5 h-3.5 text-yellow-500 shrink-0" />;
    }
    if (file.name.endsWith('.wasm') || file.name.endsWith('.sql')) {
      return <Database className="w-3.5 h-3.5 text-cyan-400 shrink-0" />;
    }
    if (file.name.endsWith('.ts') || file.name.endsWith('.tsx')) {
      return <FileCode className="w-3.5 h-3.5 text-blue-400 shrink-0" />;
    }
    return <FileText className="w-3.5 h-3.5 text-slate-400 shrink-0" />;
  };

  const renderFileTree = (nodes: ProjectFile[], depth = 0) => {
    return (
      <div className="flex flex-col">
        {nodes.map(node => {
          if (searchQuery && !node.name.toLowerCase().includes(searchQuery.toLowerCase()) && node.type === 'file') {
            return null;
          }

          const isFolder = node.type === 'folder';
          const isExpanded = expandedFolders[node.id];
          const isAllowed = isFileAllowed(node.path);
          const isForbidden = isFileForbidden(node.path);
          const isSelected = activeFileId === node.id;

          if (isFolder) {
            return (
              <div key={node.id} className="select-none">
                <button
                  onClick={() => toggleFolder(node.id)}
                  style={{ paddingLeft: `${depth * 12 + 8}px` }}
                  className="w-full flex items-center space-x-1.5 py-1 px-2 text-xs text-slate-300 hover:bg-[#181d24] hover:text-slate-100 transition-colors text-left font-mono"
                >
                  {isExpanded ? (
                    <FolderOpen className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                  ) : (
                    <Folder className="w-3.5 h-3.5 text-slate-500 shrink-0" />
                  )}
                  <span className="font-semibold">{node.name}</span>
                </button>
                {isExpanded && node.children && renderFileTree(node.children, depth + 1)}
              </div>
            );
          }

          return (
            <button
              key={node.id}
              onClick={() => onSelectFile(node)}
              style={{ paddingLeft: `${depth * 12 + 16}px` }}
              className={`w-full flex items-center justify-between py-1 px-2 text-xs transition-colors text-left font-mono group ${
                isSelected
                  ? 'bg-[#1e2633] text-slate-100 font-medium border-l-2 border-blue-500'
                  : isForbidden
                  ? 'text-slate-600 hover:bg-[#14181f] opacity-60'
                  : isAllowed && selectedNode
                  ? 'text-slate-200 hover:bg-[#181e26] font-medium'
                  : 'text-slate-400 hover:bg-[#161b22] hover:text-slate-200'
              }`}
            >
              <div className="flex items-center space-x-1.5 min-w-0 truncate">
                {getFileIcon(node)}
                <span className="truncate">{node.name}</span>
              </div>

              <div className="flex items-center space-x-1 shrink-0 ml-2">
                {node.isFrozen && (
                  <span className="text-[10px] px-1 py-0.2 bg-cyan-950 text-cyan-400 border border-cyan-800/40 rounded flex items-center space-x-0.5">
                    <Lock className="w-2.5 h-2.5" />
                    <span>FRZ</span>
                  </span>
                )}
                {node.status === 'modified' && (
                  <span className="w-1.5 h-1.5 rounded-full bg-blue-400" title="Modified in active run" />
                )}
                {isForbidden && (
                  <Lock className="w-3 h-3 text-red-500/70" title="Forbidden in current Node scope" />
                )}
                {isAllowed && selectedNode && (
                  <Check className="w-3 h-3 text-emerald-400/80" title="In-Scope for current Node" />
                )}
              </div>
            </button>
          );
        })}
      </div>
    );
  };

  return (
    <aside className="w-64 bg-[#0D0D0D] border-r border-[#262626] flex flex-col h-full select-none shrink-0 overflow-hidden font-sans">
      {/* Explorer Header */}
      <div className="p-3 border-b border-[#262626] flex items-center justify-between bg-[#0A0A0A]">
        <div className="flex items-center space-x-2">
          <span className="text-xs font-bold text-white font-mono tracking-wider">PROJECT EXPLORER</span>
        </div>
        <span className="text-[10px] font-mono text-[#737373] bg-[#141414] px-1.5 py-0.5 rounded-sm border border-[#262626]">
          src/
        </span>
      </div>

      {/* File Search Input */}
      <div className="p-2 border-b border-[#262626] bg-[#0D0D0D]">
        <div className="relative">
          <Search className="w-3 h-3 text-[#737373] absolute left-2 top-2" />
          <input
            type="text"
            value={searchQuery}
            onChange={e => setSearchQuery(e.target.value)}
            placeholder="Filter files..."
            className="w-full bg-[#141414] border border-[#262626] focus:border-white rounded-sm pl-7 pr-2 py-1 text-xs text-[#E5E5E5] font-mono placeholder:text-[#525252] outline-none"
          />
        </div>
      </div>

      {/* File Tree View */}
      <div className="flex-1 overflow-y-auto py-1 scrollbar-thin scrollbar-thumb-[#262626]">
        {renderFileTree(files)}
      </div>

      {/* Scope Expression for Current Selected Node */}
      <div className="border-t border-[#262626] bg-[#0A0A0A] p-3 shrink-0">
        <div className="flex items-center justify-between mb-2">
          <span className="text-[10px] font-bold text-[#A3A3A3] font-mono tracking-wider">
            SCOPE ISOLATION
          </span>
          {selectedNode ? (
            <span className="text-[10px] font-mono px-1.5 py-0.5 bg-[#141414] text-blue-400 border border-blue-500/30 rounded-sm font-bold">
              {selectedNode.nodeId}
            </span>
          ) : (
            <span className="text-[10px] text-[#525252] font-mono">No Selection</span>
          )}
        </div>

        {selectedNode ? (
          <div className="space-y-2 text-[11px] font-mono">
            {/* Allowed Scope */}
            <div>
              <div className="text-[#737373] text-[10px] mb-0.5 font-semibold flex items-center space-x-1">
                <Check className="w-3 h-3 text-emerald-400" />
                <span>ALLOWED (WRITE-SET)</span>
              </div>
              <div className="space-y-1 pl-4 text-emerald-300 text-[10px]">
                {selectedNode.scope.allowed.map((p, idx) => (
                  <div key={idx} className="truncate bg-[#141414] px-1.5 py-0.5 rounded-sm border border-emerald-500/20">
                    {p}
                  </div>
                ))}
              </div>
            </div>

            {/* Required Contract */}
            {selectedNode.requiredContracts.length > 0 && (
              <div>
                <div className="text-[#737373] text-[10px] mb-0.5 font-semibold flex items-center space-x-1">
                  <Lock className="w-3 h-3 text-cyan-400" />
                  <span>CONTRACTS</span>
                </div>
                <div className="space-y-1 pl-4 text-cyan-300 text-[10px]">
                  {selectedNode.requiredContracts.map((c, idx) => (
                    <div key={idx} className="truncate flex items-center space-x-1 bg-[#141414] px-1.5 py-0.5 rounded-sm border border-cyan-500/20">
                      <span className="w-1.5 h-1.5 rounded-full bg-cyan-400"></span>
                      <span>{c}</span>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Forbidden Scope */}
            {selectedNode.scope.forbidden.length > 0 && (
              <div>
                <div className="text-[#737373] text-[10px] mb-0.5 font-semibold flex items-center space-x-1">
                  <ShieldAlert className="w-3 h-3 text-red-400" />
                  <span>FORBIDDEN</span>
                </div>
                <div className="space-y-1 pl-4 text-red-400/80 text-[10px]">
                  {selectedNode.scope.forbidden.map((f, idx) => (
                    <div key={idx} className="truncate flex items-center space-x-1 bg-[#141414] px-1.5 py-0.5 rounded-sm border border-red-500/20">
                      <Lock className="w-2.5 h-2.5 text-red-400" />
                      <span>{f}</span>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        ) : (
          <div className="text-[11px] text-[#525252] italic font-mono text-center py-2">
            Select a Node in DAG to inspect isolated scope bounds.
          </div>
        )}
      </div>
    </aside>
  );
};
