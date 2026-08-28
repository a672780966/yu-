import React, { useState, useRef } from 'react';
import { 
  ZoomIn, 
  ZoomOut, 
  RotateCcw,
  ExternalLink,
  Eye,
  FileCode,
  CheckCircle2,
  Calendar,
  Layers,
  ArrowRight
} from 'lucide-react';
import { DevManifest, NodeStatus } from '../types';

interface ConstructionGraphProps {
  devs: Record<string, DevManifest>;
  selectedNodeId: string | null;
  onSelectNode: (nodeId: string) => void;
  activeSlots: (string | null)[];
  onOpenEditor?: (nodeId: string) => void;
  onViewEvidence?: (nodeId: string) => void;
}

// Deterministic molecular network layout coordinates
interface MolecularNodePos {
  id: string;
  cx: number;
  cy: number;
  type: 'dev' | 'contract' | 'artifact';
  label: string;
  subLabel?: string;
}

const MOLECULAR_POSITIONS: Record<string, MolecularNodePos> = {
  // Level 1: Root System
  'DEV-039': { id: 'DEV-039', cx: 500, cy: 90, type: 'dev', label: 'DEV-039', subLabel: 'Scaffold' },
  
  // Level 2: Architecture & Foundation
  'DEV-040': { id: 'DEV-040', cx: 330, cy: 220, type: 'dev', label: 'DEV-040', subLabel: 'Core Protocol' },
  'DEV-045': { id: 'DEV-045', cx: 670, cy: 220, type: 'dev', label: 'DEV-045', subLabel: 'Audit Pipeline' },
  'DEV-044': { id: 'DEV-044', cx: 860, cy: 220, type: 'dev', label: 'DEV-044', subLabel: 'External Sync' },
  
  // Intermediary Supporting Molecular Entities (Contracts & Artifacts)
  'CONTRACT-AUTH': { id: 'CONTRACT-AUTH', cx: 330, cy: 340, type: 'contract', label: 'Auth Contract', subLabel: 'V1.2' },
  'ARTIFACT-WASM': { id: 'ARTIFACT-WASM', cx: 160, cy: 450, type: 'artifact', label: 'Wasm Bin', subLabel: 'Artifact' },
  'ARTIFACT-RECEIPTS': { id: 'ARTIFACT-RECEIPTS', cx: 820, cy: 340, type: 'artifact', label: 'Receipts', subLabel: 'Signed' },

  // Level 3: Active Construction Tier
  'DEV-041': { id: 'DEV-041', cx: 160, cy: 340, type: 'dev', label: 'DEV-041', subLabel: 'Wasm Runtime' },
  'DEV-042': { id: 'DEV-042', cx: 500, cy: 340, type: 'dev', label: 'DEV-042', subLabel: 'User Auth' },
  'DEV-046': { id: 'DEV-046', cx: 670, cy: 380, type: 'dev', label: 'DEV-046', subLabel: 'Telemetry' },
  'DEV-047': { id: 'DEV-047', cx: 960, cy: 340, type: 'dev', label: 'DEV-047', subLabel: 'Webhook Sync' },

  // Level 4: Downstream Tier
  'DEV-043': { id: 'DEV-043', cx: 330, cy: 490, type: 'dev', label: 'DEV-043', subLabel: 'Web UI Client' },
  'DEV-048': { id: 'DEV-048', cx: 580, cy: 490, type: 'dev', label: 'DEV-048', subLabel: 'Release Gate' }
};

interface RelationBond {
  from: string;
  to: string;
  type: 'depends_on' | 'blocks' | 'uses' | 'implements' | 'validates';
  isSolid: boolean;
}

const BONDS: RelationBond[] = [
  { from: 'DEV-039', to: 'DEV-040', type: 'depends_on', isSolid: true },
  { from: 'DEV-039', to: 'DEV-045', type: 'depends_on', isSolid: true },
  { from: 'DEV-039', to: 'DEV-044', type: 'depends_on', isSolid: true },
  { from: 'DEV-040', to: 'DEV-041', type: 'depends_on', isSolid: true },
  { from: 'DEV-040', to: 'CONTRACT-AUTH', type: 'implements', isSolid: true },
  { from: 'CONTRACT-AUTH', to: 'DEV-042', type: 'validates', isSolid: true },
  { from: 'DEV-040', to: 'DEV-042', type: 'depends_on', isSolid: true },
  { from: 'DEV-041', to: 'ARTIFACT-WASM', type: 'uses', isSolid: true },
  { from: 'ARTIFACT-WASM', to: 'DEV-043', type: 'uses', isSolid: true },
  { from: 'DEV-041', to: 'DEV-043', type: 'depends_on', isSolid: true },
  { from: 'DEV-042', to: 'DEV-043', type: 'depends_on', isSolid: false },
  { from: 'DEV-044', to: 'DEV-047', type: 'blocks', isSolid: true },
  { from: 'DEV-045', to: 'ARTIFACT-RECEIPTS', type: 'uses', isSolid: true },
  { from: 'DEV-045', to: 'DEV-046', type: 'depends_on', isSolid: true },
  { from: 'DEV-046', to: 'DEV-048', type: 'depends_on', isSolid: false },
  { from: 'DEV-042', to: 'DEV-048', type: 'depends_on', isSolid: false }
];

// Helper to compute pointy-top hexagon points
function getHexPoints(cx: number, cy: number, r: number): string {
  const points: string[] = [];
  for (let i = 0; i < 6; i++) {
    const angle = (Math.PI / 3) * i - Math.PI / 6;
    const x = cx + r * Math.cos(angle);
    const y = cy + r * Math.sin(angle);
    points.push(`${x.toFixed(1)},${y.toFixed(1)}`);
  }
  return points.join(' ');
}

export const ConstructionGraph: React.FC<ConstructionGraphProps> = ({
  devs,
  selectedNodeId,
  onSelectNode,
  onOpenEditor,
  onViewEvidence
}) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const [graphMode, setGraphMode] = useState<'construction' | 'implementation' | 'planning'>('construction');
  const [zoom, setZoom] = useState(1);
  const [pan, setPan] = useState({ x: 60, y: 20 });
  const [isDragging, setIsDragging] = useState(false);
  const [dragStart, setDragStart] = useState({ x: 0, y: 0 });
  const [hoveredNode, setHoveredNode] = useState<string | null>(null);

  const selectedDev = selectedNodeId ? devs[selectedNodeId] : null;

  const handleMouseDown = (e: React.MouseEvent) => {
    if (e.target === containerRef.current || (e.target as HTMLElement).tagName === 'svg') {
      setIsDragging(true);
      setDragStart({ x: e.clientX - pan.x, y: e.clientY - pan.y });
    }
  };

  const handleMouseMove = (e: React.MouseEvent) => {
    if (isDragging) {
      setPan({
        x: e.clientX - dragStart.x,
        y: e.clientY - dragStart.y
      });
    }
  };

  const handleMouseUp = () => {
    setIsDragging(false);
  };

  const handleZoom = (delta: number) => {
    setZoom(prev => Math.min(Math.max(prev + delta, 0.5), 2.2));
  };

  const resetView = () => {
    setZoom(1);
    setPan({ x: 60, y: 20 });
  };

  const getStatusDotColor = (status?: NodeStatus) => {
    switch (status) {
      case 'PASS':
        return '#55c98b';
      case 'RUNNING':
        return '#5e9cff';
      case 'AUDITING':
      case 'AUDIT_READY':
        return '#a487e8';
      case 'BLOCKED':
        return '#ec6a6a';
      case 'READY':
        return '#5e9cff';
      default:
        return '#525252';
    }
  };

  // Find direct neighbors of selected node
  const directNeighbors = new Set<string>();
  if (selectedNodeId) {
    directNeighbors.add(selectedNodeId);
    BONDS.forEach(b => {
      if (b.from === selectedNodeId) directNeighbors.add(b.to);
      if (b.to === selectedNodeId) directNeighbors.add(b.from);
    });
  }

  return (
    <div 
      ref={containerRef}
      onMouseDown={handleMouseDown}
      onMouseMove={handleMouseMove}
      onMouseUp={handleMouseUp}
      onMouseLeave={handleMouseUp}
      className="relative w-full h-full bg-[#0B0B0C] overflow-hidden select-none cursor-grab active:cursor-grabbing font-sans"
    >
      {/* Engineering Grid (Subtle 6% opacity) */}
      <div className="absolute inset-0 pointer-events-none tech-grid-bg opacity-[0.06]" />

      {/* Graph Subviews Selector (Top-Left) */}
      <div className="absolute top-3 left-4 flex items-center space-x-1 bg-[#111113] p-0.5 rounded-xs border border-[rgba(255,255,255,0.08)] z-20 shadow-sm text-xs">
        <button
          onClick={() => setGraphMode('construction')}
          className={`px-2.5 py-1 rounded-xs transition-colors cursor-pointer text-xs ${
            graphMode === 'construction'
              ? 'bg-[rgba(255,255,255,0.12)] text-white font-medium shadow-xs'
              : 'text-[rgba(255,255,255,0.55)] hover:text-white'
          }`}
        >
          Construction
        </button>
        <button
          onClick={() => setGraphMode('implementation')}
          className={`px-2.5 py-1 rounded-xs transition-colors cursor-pointer text-xs ${
            graphMode === 'implementation'
              ? 'bg-[rgba(255,255,255,0.12)] text-white font-medium shadow-xs'
              : 'text-[rgba(255,255,255,0.55)] hover:text-white'
          }`}
        >
          Implementation
        </button>
        <button
          onClick={() => setGraphMode('planning')}
          className={`px-2.5 py-1 rounded-xs transition-colors cursor-pointer text-xs ${
            graphMode === 'planning'
              ? 'bg-[rgba(255,255,255,0.12)] text-white font-medium shadow-xs'
              : 'text-[rgba(255,255,255,0.55)] hover:text-white'
          }`}
        >
          Planning
        </button>
      </div>

      {/* Floating Zoom/Pan Controls (Top-Right) */}
      <div className="absolute top-3 right-3 flex items-center space-x-1 bg-[#111113] p-1 rounded-xs border border-[rgba(255,255,255,0.08)] z-20 shadow-sm">
        <button 
          onClick={() => handleZoom(0.15)}
          className="p-1.5 hover:bg-[rgba(255,255,255,0.08)] text-[rgba(255,255,255,0.5)] hover:text-white rounded-xs transition-colors cursor-pointer"
          title="Zoom In"
        >
          <ZoomIn className="w-3.5 h-3.5" />
        </button>
        <button 
          onClick={() => handleZoom(-0.15)}
          className="p-1.5 hover:bg-[rgba(255,255,255,0.08)] text-[rgba(255,255,255,0.5)] hover:text-white rounded-xs transition-colors cursor-pointer"
          title="Zoom Out"
        >
          <ZoomOut className="w-3.5 h-3.5" />
        </button>
        <button 
          onClick={resetView}
          className="p-1.5 hover:bg-[rgba(255,255,255,0.08)] text-[rgba(255,255,255,0.5)] hover:text-white rounded-xs transition-colors cursor-pointer"
          title="Reset View"
        >
          <RotateCcw className="w-3.5 h-3.5" />
        </button>
      </div>

      {/* 1. Main View: Construction (Hexagonal Molecular Network) */}
      {graphMode === 'construction' && (
        <div
          style={{
            transform: `translate(${pan.x}px, ${pan.y}px) scale(${zoom})`,
            transformOrigin: '0 0',
            transition: isDragging ? 'none' : 'transform 0.18s cubic-bezier(0.22, 1, 0.36, 1)'
          }}
          className="w-[1150px] h-[640px] relative pointer-events-auto"
        >
          <svg className="w-full h-full pointer-events-auto" viewBox="0 0 1150 640">
            <defs>
              <marker id="bond-focus" viewBox="0 0 10 10" refX="6" refY="5" markerWidth="4.5" markerHeight="4.5" orient="auto-start-reverse">
                <polygon points="0,2 7,5 0,8" fill="rgba(255,255,255,0.6)" />
              </marker>
            </defs>

            {/* Molecular Network Bonds (Default: Clean lines without arrows) */}
            {BONDS.map((bond, idx) => {
              const fromPos = MOLECULAR_POSITIONS[bond.from];
              const toPos = MOLECULAR_POSITIONS[bond.to];
              if (!fromPos || !toPos) return null;

              const isFocusBond = 
                selectedNodeId === bond.from || 
                selectedNodeId === bond.to;

              const isHoverBond = 
                hoveredNode === bond.from || 
                hoveredNode === bond.to;

              const isHighlighted = isFocusBond || isHoverBond;
              const isBlocked = bond.type === 'blocks' && isHighlighted;

              // Neutral quiet bonds: Focus = 0.48, Default = 0.11, Unrelated = 0.04
              let strokeColor = 'rgba(255, 255, 255, 0.10)';
              let strokeWidth = 1.2;

              if (isHighlighted) {
                strokeColor = isBlocked ? '#ec6a6a' : 'rgba(255, 255, 255, 0.5)';
                strokeWidth = 2;
              } else if (selectedNodeId && !directNeighbors.has(bond.from) && !directNeighbors.has(bond.to)) {
                strokeColor = 'rgba(255, 255, 255, 0.035)';
              }

              const midX = (fromPos.cx + toPos.cx) / 2;
              const midY = (fromPos.cy + toPos.cy) / 2;

              return (
                <g key={`${bond.from}->${bond.to}-${idx}`} className="transition-opacity duration-200">
                  {/* Molecular Bond Line (Arrow ONLY on Focus/Hover) */}
                  <line
                    x1={fromPos.cx}
                    y1={fromPos.cy}
                    x2={toPos.cx}
                    y2={toPos.cy}
                    stroke={strokeColor}
                    strokeWidth={strokeWidth}
                    strokeDasharray={bond.isSolid ? undefined : '4 4'}
                    markerEnd={isHighlighted ? 'url(#bond-focus)' : undefined}
                    className="transition-colors duration-150"
                  />

                  {/* Bond Type Label on Focus/Hover */}
                  {isHighlighted && (
                    <g transform={`translate(${midX}, ${midY})`}>
                      <rect
                        x="-30"
                        y="-8"
                        width="60"
                        height="16"
                        rx="2"
                        fill="#111113"
                        stroke="rgba(255, 255, 255, 0.12)"
                        strokeWidth="1"
                      />
                      <text
                        textAnchor="middle"
                        dominantBaseline="central"
                        fill="rgba(255, 255, 255, 0.7)"
                        fontSize="8.5"
                        fontFamily="monospace"
                        fontWeight="500"
                      >
                        {bond.type}
                      </text>
                    </g>
                  )}
                </g>
              );
            })}

            {/* Hexagonal Nodes (Quiet Neutral Base + Status Dots) */}
            {Object.values(MOLECULAR_POSITIONS).map(nodePos => {
              const isSelected = selectedNodeId === nodePos.id;
              const isHovered = hoveredNode === nodePos.id;
              const isDirectNeighbor = directNeighbors.has(nodePos.id);
              const dev = devs[nodePos.id];
              const isDev = nodePos.type === 'dev';

              let radius = isDev ? 37 : 27;
              if (isSelected) radius = 45;

              let nodeOpacity = 0.8;
              if (selectedNodeId) {
                if (isSelected) nodeOpacity = 1;
                else if (isDirectNeighbor) nodeOpacity = 0.9;
                else nodeOpacity = 0.32;
              }

              const hexPoints = getHexPoints(nodePos.cx, nodePos.cy, radius);
              const dotColor = isDev ? getStatusDotColor(dev?.status) : '#0ea5e9';

              return (
                <g
                  key={nodePos.id}
                  onClick={e => {
                    e.stopPropagation();
                    if (isDev) {
                      onSelectNode(nodePos.id);
                    }
                  }}
                  onMouseEnter={() => setHoveredNode(nodePos.id)}
                  onMouseLeave={() => setHoveredNode(null)}
                  style={{ opacity: nodeOpacity }}
                  className="cursor-pointer transition-opacity duration-200"
                >
                  <polygon
                    points={hexPoints}
                    fill={isSelected ? 'rgba(255, 255, 255, 0.05)' : isHovered ? 'rgba(255, 255, 255, 0.035)' : 'rgba(255, 255, 255, 0.02)'}
                    stroke={isSelected ? 'rgba(255, 255, 255, 0.65)' : isHovered ? 'rgba(255, 255, 255, 0.3)' : 'rgba(255, 255, 255, 0.14)'}
                    strokeWidth={isSelected ? 2 : 1.2}
                    className="transition-all duration-150"
                  />

                  {isDev ? (
                    <>
                      <circle
                        cx={nodePos.cx}
                        cy={nodePos.cy - (radius - 12)}
                        r="2.5"
                        fill={dotColor}
                      />
                      <text
                        x={nodePos.cx}
                        y={nodePos.cy}
                        textAnchor="middle"
                        dominantBaseline="central"
                        fill={isSelected ? '#FFFFFF' : 'rgba(255, 255, 255, 0.85)'}
                        fontSize={isSelected ? '11.5' : '10'}
                        fontFamily="monospace"
                        fontWeight="600"
                      >
                        {nodePos.label}
                      </text>
                      <text
                        x={nodePos.cx}
                        y={nodePos.cy + 13}
                        textAnchor="middle"
                        dominantBaseline="central"
                        fill="rgba(255, 255, 255, 0.5)"
                        fontSize="8.5"
                        fontFamily="sans-serif"
                      >
                        {dev ? (dev.title.length > 10 ? dev.title.substring(0, 9) + '…' : dev.title) : nodePos.subLabel}
                      </text>
                    </>
                  ) : (
                    <>
                      <text
                        x={nodePos.cx}
                        y={nodePos.cy - 3}
                        textAnchor="middle"
                        dominantBaseline="central"
                        fill="rgba(255, 255, 255, 0.4)"
                        fontSize="7.5"
                        fontFamily="sans-serif"
                        fontWeight="600"
                      >
                        {nodePos.type === 'contract' ? 'CONTRACT' : 'ARTIFACT'}
                      </text>
                      <text
                        x={nodePos.cx}
                        y={nodePos.cy + 7}
                        textAnchor="middle"
                        dominantBaseline="central"
                        fill="rgba(255, 255, 255, 0.7)"
                        fontSize="8"
                        fontFamily="monospace"
                      >
                        {nodePos.label.split(' ')[0]}
                      </text>
                    </>
                  )}
                </g>
              );
            })}
          </svg>
        </div>
      )}

      {/* 2. Subview: Implementation (DAG Code & Artifact Pipeline Flow) */}
      {graphMode === 'implementation' && (
        <div className="w-full h-full p-16 overflow-auto">
          <div className="max-w-4xl mx-auto space-y-6 text-xs font-sans">
            <div className="text-[rgba(255,255,255,0.4)] text-[11px] uppercase tracking-wider font-semibold">
              Implementation Pipeline DAG
            </div>

            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
              {(Object.values(devs) as DevManifest[]).slice(0, 8).map(d => (
                <div
                  key={d.nodeId}
                  onClick={() => onSelectNode(d.nodeId)}
                  className={`p-3 rounded-xs border transition-colors cursor-pointer ${
                    selectedNodeId === d.nodeId
                      ? 'bg-[rgba(255,255,255,0.06)] border-white text-white'
                      : 'bg-[#111113] border-[rgba(255,255,255,0.08)] text-[rgba(255,255,255,0.8)] hover:border-[rgba(255,255,255,0.2)]'
                  }`}
                >
                  <div className="flex items-center justify-between font-mono text-[11px] mb-1">
                    <span>{d.nodeId}</span>
                    <span className={`w-2 h-2 rounded-full ${
                      d.status === 'PASS' ? 'bg-[#55c98b]' :
                      d.status === 'RUNNING' ? 'bg-[#5e9cff]' :
                      d.status === 'BLOCKED' ? 'bg-[#ec6a6a]' :
                      'bg-[rgba(255,255,255,0.3)]'
                    }`} />
                  </div>
                  <div className="font-semibold text-white mb-1.5 text-[12px] truncate">{d.title}</div>
                  <div className="text-[10px] text-[rgba(255,255,255,0.4)] truncate">{d.scope.allowed[0]}</div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* 3. Subview: Planning (Milestones & Roadmap Matrix) */}
      {graphMode === 'planning' && (
        <div className="w-full h-full p-16 overflow-auto">
          <div className="max-w-4xl mx-auto space-y-6 text-xs font-sans">
            <div className="text-[rgba(255,255,255,0.4)] text-[11px] uppercase tracking-wider font-semibold">
              Project Milestone Matrix · Aurora V1.2
            </div>

            <div className="space-y-3">
              {[
                { milestone: 'M1 Foundation', status: 'COMPLETED', nodes: ['DEV-039', 'DEV-040'], progress: '100%' },
                { milestone: 'M2 Core Capabilities', status: 'IN_PROGRESS', nodes: ['DEV-041', 'DEV-042', 'DEV-045'], progress: '75%' },
                { milestone: 'M3 Integrations & Webhooks', status: 'BLOCKED', nodes: ['DEV-044', 'DEV-047'], progress: '40%' },
                { milestone: 'M4 Release Gate & Packaging', status: 'PENDING', nodes: ['DEV-043', 'DEV-048'], progress: '0%' },
              ].map(m => (
                <div key={m.milestone} className="p-3 bg-[#111113] border border-[rgba(255,255,255,0.08)] rounded-xs flex items-center justify-between">
                  <div>
                    <div className="font-semibold text-white text-[12px]">{m.milestone}</div>
                    <div className="text-[11px] text-[rgba(255,255,255,0.5)] font-mono mt-0.5">{m.nodes.join(' · ')}</div>
                  </div>
                  <div className="flex items-center space-x-3">
                    <span className="font-mono text-[11px] text-[rgba(255,255,255,0.7)]">{m.progress}</span>
                    <span className={`px-2 py-0.5 text-[10px] font-mono rounded-xs border ${
                      m.status === 'COMPLETED' ? 'text-[#55c98b] border-[rgba(85,201,139,0.3)] bg-[rgba(85,201,139,0.05)]' :
                      m.status === 'IN_PROGRESS' ? 'text-[#5e9cff] border-[rgba(94,156,255,0.3)] bg-[rgba(94,156,255,0.05)]' :
                      m.status === 'BLOCKED' ? 'text-[#ec6a6a] border-[rgba(236,106,106,0.3)] bg-[rgba(236,106,106,0.05)]' :
                      'text-[rgba(255,255,255,0.4)] border-[rgba(255,255,255,0.08)]'
                    }`}>
                      {m.status}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* Focus Context Overlay (Floating Bottom-Left Sheet) */}
      {selectedDev && graphMode === 'construction' && (
        <div className="absolute bottom-4 left-4 w-80 bg-[#111113]/95 backdrop-blur-md border border-[rgba(255,255,255,0.12)] rounded-xs p-3.5 shadow-xl text-xs font-sans space-y-2.5 z-20 animate-in fade-in">
          {/* Header */}
          <div className="flex items-center justify-between pb-1.5 border-b border-[rgba(255,255,255,0.08)]">
            <div className="flex items-center space-x-2">
              <span className="font-mono text-white font-semibold text-[12px]">{selectedDev.nodeId}</span>
              <span className="text-[rgba(255,255,255,0.3)]">·</span>
              <span className="text-[rgba(255,255,255,0.7)] text-[11px] truncate max-w-[130px]">{selectedDev.title}</span>
            </div>

            <div className="flex items-center space-x-1 font-mono text-[10px]">
              <span className={`w-1.5 h-1.5 rounded-full ${
                selectedDev.status === 'PASS' ? 'bg-[#55c98b]' :
                selectedDev.status === 'RUNNING' ? 'bg-[#5e9cff] animate-quiet-pulse' :
                selectedDev.status === 'BLOCKED' ? 'bg-[#ec6a6a]' :
                'bg-[rgba(255,255,255,0.4)]'
              }`} />
              <span className="text-[rgba(255,255,255,0.8)]">{selectedDev.status}</span>
            </div>
          </div>

          {/* Details */}
          <div className="space-y-1.5 text-[11px] text-[rgba(255,255,255,0.65)]">
            <div>
              <span className="text-[rgba(255,255,255,0.4)] font-medium">Goal: </span>
              <span className="text-[rgba(255,255,255,0.9)]">{selectedDev.goal}</span>
            </div>
            <div className="flex justify-between font-mono text-[10px]">
              <span className="text-[rgba(255,255,255,0.4)]">Depends On:</span>
              <span className="text-[rgba(255,255,255,0.8)]">
                {selectedDev.dependsOn.length > 0 ? selectedDev.dependsOn.join(', ') : 'None'}
              </span>
            </div>
            <div className="flex justify-between font-mono text-[10px]">
              <span className="text-[rgba(255,255,255,0.4)]">Scope Rules:</span>
              <span className="text-[rgba(255,255,255,0.8)]">
                {selectedDev.scope.allowed.length} write / {selectedDev.scope.forbidden.length} forbidden
              </span>
            </div>
          </div>

          {/* Quick Actions */}
          <div className="flex items-center space-x-2 pt-1 border-t border-[rgba(255,255,255,0.06)]">
            {onOpenEditor && (
              <button
                onClick={() => onOpenEditor(selectedDev.nodeId)}
                className="flex-1 flex items-center justify-center space-x-1 py-1 bg-[rgba(255,255,255,0.05)] hover:bg-[rgba(255,255,255,0.1)] text-white rounded-xs border border-[rgba(255,255,255,0.1)] text-[11px] transition-colors cursor-pointer"
              >
                <ExternalLink className="w-3 h-3" />
                <span>Open Editor</span>
              </button>
            )}

            {onViewEvidence && selectedDev.currentRun && (
              <button
                onClick={() => onViewEvidence(selectedDev.nodeId)}
                className="flex-1 flex items-center justify-center space-x-1 py-1 bg-[rgba(255,255,255,0.05)] hover:bg-[rgba(255,255,255,0.1)] text-[rgba(255,255,255,0.85)] rounded-xs border border-[rgba(255,255,255,0.1)] text-[11px] transition-colors cursor-pointer"
              >
                <Eye className="w-3 h-3" />
                <span>Evidence</span>
              </button>
            )}
          </div>
        </div>
      )}
    </div>
  );
};

