import React, { useState } from 'react';
import { 
  Folder, 
  FolderOpen, 
  File, 
  Lock, 
  Search, 
  ChevronRight,
  ChevronDown
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
  const [isScopeExpanded, setIsScopeExpanded] = useState(false);

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

  const totalRulesCount = selectedNode 
    ? (selectedNode.scope.allowed.length + selectedNode.requiredContracts.length + selectedNode.scope.forbidden.length)
    : 0;

  const renderFileTree = (nodes: ProjectFile[], depth = 0) => {
    return (
      <div className="flex flex-col">
        {nodes.map(node => {
          if (searchQuery && !node.name.toLowerCase().includes(searchQuery.toLowerCase()) && node.type === 'file') {
            return null;
          }

          const isFolder = node.type === 'folder';
          const isExpanded = expandedFolders[node.id];
          const isForbidden = isFileForbidden(node.path);
          const isSelected = activeFileId === node.id;

          if (isFolder) {
            return (
              <div key={node.id} className="select-none">
                <button
                  onClick={() => toggleFolder(node.id)}
                  style={{ paddingLeft: `${depth * 10 + 8}px` }}
                  className="w-full flex items-center space-x-1.5 py-1 px-2 text-xs text-[rgba(255,255,255,0.7)] hover:bg-[rgba(255,255,255,0.04)] hover:text-white transition-colors text-left font-mono"
                >
                  {isExpanded ? (
                    <FolderOpen className="w-3.5 h-3.5 text-[rgba(255,255,255,0.4)] shrink-0" />
                  ) : (
                    <Folder className="w-3.5 h-3.5 text-[rgba(255,255,255,0.3)] shrink-0" />
                  )}
                  <span className="font-normal text-[11px] truncate">{node.name}</span>
                </button>
                {isExpanded && node.children && renderFileTree(node.children, depth + 1)}
              </div>
            );
          }

          return (
            <button
              key={node.id}
              onClick={() => onSelectFile(node)}
              style={{ paddingLeft: `${depth * 10 + 16}px` }}
              className={`w-full flex items-center justify-between py-1 px-2 text-xs transition-colors text-left font-mono group ${
                isSelected
                  ? 'bg-[rgba(255,255,255,0.08)] text-white font-medium border-l border-white'
                  : isForbidden
                  ? 'text-[rgba(255,255,255,0.3)] hover:bg-[rgba(255,255,255,0.03)]'
                  : 'text-[rgba(255,255,255,0.65)] hover:bg-[rgba(255,255,255,0.04)] hover:text-white'
              }`}
            >
              <div className="flex items-center space-x-1.5 min-w-0 truncate">
                <File className="w-3.5 h-3.5 text-[rgba(255,255,255,0.35)] shrink-0" />
                <span className="truncate text-[11px]">{node.name}</span>
              </div>

              <div className="flex items-center space-x-1 shrink-0 ml-1.5">
                {node.isFrozen && (
                  <Lock className="w-2.5 h-2.5 text-[rgba(255,255,255,0.4)]" title="Frozen Contract / Spec" />
                )}
                {node.status === 'modified' && (
                  <span className="w-1.5 h-1.5 rounded-full bg-[#5e9cff]" title="Modified in active run" />
                )}
                {isForbidden && (
                  <span className="w-1.5 h-1.5 rounded-full bg-[#ec6a6a]/60" title="Forbidden in current Node scope" />
                )}
              </div>
            </button>
          );
        })}
      </div>
    );
  };

  return (
    <aside className="w-[228px] bg-[#0B0B0C] border-r border-[rgba(255,255,255,0.075)] flex flex-col h-full select-none shrink-0 overflow-hidden font-sans">
      {/* Explorer Header */}
      <div className="px-3 py-2 border-b border-[rgba(255,255,255,0.06)] flex items-center justify-between">
        <span className="text-xs font-semibold text-[rgba(255,255,255,0.85)]">Files</span>
        <span className="text-[10px] font-mono text-[rgba(255,255,255,0.4)]">
          src/
        </span>
      </div>

      {/* File Search Input */}
      <div className="px-2 py-1.5 border-b border-[rgba(255,255,255,0.06)]">
        <div className="relative">
          <Search className="w-3 h-3 text-[rgba(255,255,255,0.35)] absolute left-2 top-2" />
          <input
            type="text"
            value={searchQuery}
            onChange={e => setSearchQuery(e.target.value)}
            placeholder="Filter files..."
            className="w-full bg-[rgba(255,255,255,0.03)] border border-[rgba(255,255,255,0.06)] focus:border-[rgba(255,255,255,0.2)] rounded-xs pl-6 pr-2 py-0.5 text-xs text-[rgba(255,255,255,0.8)] font-mono placeholder:text-[rgba(255,255,255,0.3)] outline-none"
          />
        </div>
      </div>

      {/* File Tree View */}
      <div className="flex-1 overflow-y-auto py-1">
        {renderFileTree(files)}
      </div>

      {/* Collapsible Scope Isolation Bar (32px default, expandable on click) */}
      <div className="border-t border-[rgba(255,255,255,0.075)] bg-[#111113] shrink-0">
        <button
          onClick={() => setIsScopeExpanded(!isScopeExpanded)}
          className="w-full h-8 px-3 flex items-center justify-between text-xs text-[rgba(255,255,255,0.7)] hover:text-white hover:bg-[rgba(255,255,255,0.03)] transition-colors cursor-pointer"
        >
          <div className="flex items-center space-x-1.5 truncate">
            {selectedNode ? (
              <>
                <span className="font-mono text-[11px] font-medium text-white">{selectedNode.nodeId}</span>
                <span className="text-[11px] text-[rgba(255,255,255,0.4)]">Scope</span>
                <span className="text-[10px] text-[rgba(255,255,255,0.3)]">·</span>
                <span className="text-[10px] text-[rgba(255,255,255,0.5)]">{totalRulesCount} rules</span>
              </>
            ) : (
              <span className="text-[11px] text-[rgba(255,255,255,0.4)]">No Scope Selected</span>
            )}
          </div>
          {isScopeExpanded ? (
            <ChevronDown className="w-3 h-3 text-[rgba(255,255,255,0.4)]" />
          ) : (
            <ChevronRight className="w-3 h-3 text-[rgba(255,255,255,0.4)]" />
          )}
        </button>

        {/* Expanded Scope Detail Drawer */}
        {isScopeExpanded && selectedNode && (
          <div className="px-3 pb-3 pt-1 space-y-2 border-t border-[rgba(255,255,255,0.05)] bg-[#0B0B0C] text-[11px] font-mono animate-in fade-in">
            {/* Allowed Scope */}
            <div>
              <div className="text-[10px] text-[rgba(255,255,255,0.5)] mb-1 font-sans font-medium">
                Allowed Write-Set
              </div>
              <div className="space-y-0.5 text-[rgba(255,255,255,0.85)] text-[10px]">
                {selectedNode.scope.allowed.map((p, idx) => (
                  <div key={idx} className="truncate bg-[rgba(255,255,255,0.03)] px-1.5 py-0.5 rounded-xs border border-[rgba(255,255,255,0.06)]">
                    {p}
                  </div>
                ))}
              </div>
            </div>

            {/* Required Contract */}
            {selectedNode.requiredContracts.length > 0 && (
              <div>
                <div className="text-[10px] text-[rgba(255,255,255,0.5)] mb-1 font-sans font-medium">
                  Contracts
                </div>
                <div className="space-y-0.5 text-[rgba(255,255,255,0.85)] text-[10px]">
                  {selectedNode.requiredContracts.map((c, idx) => (
                    <div key={idx} className="truncate bg-[rgba(255,255,255,0.03)] px-1.5 py-0.5 rounded-xs border border-[rgba(255,255,255,0.06)]">
                      {c}
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Forbidden Scope */}
            {selectedNode.scope.forbidden.length > 0 && (
              <div>
                <div className="text-[10px] text-[#ec6a6a]/80 mb-1 font-sans font-medium">
                  Forbidden
                </div>
                <div className="space-y-0.5 text-[rgba(255,255,255,0.6)] text-[10px]">
                  {selectedNode.scope.forbidden.map((f, idx) => (
                    <div key={idx} className="truncate bg-[rgba(236,106,106,0.05)] px-1.5 py-0.5 rounded-xs border border-[rgba(236,106,106,0.15)] text-[#ec6a6a]/90">
                      {f}
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}
      </div>
    </aside>
  );
};
