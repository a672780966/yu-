import React, { useState, useRef } from 'react';
import { 
  ZoomIn, 
  ZoomOut, 
  RotateCcw, 
  Cpu, 
  Lock, 
  Layers, 
  ShieldCheck,
  CheckCircle2,
  Box,
  FileCode,
  ArrowRight
} from 'lucide-react';
import { DevManifest, NodeStatus } from '../types';

interface ConstructionGraphProps {
  devs: Record<string, DevManifest>;
  selectedNodeId: string | null;
  onSelectNode: (nodeId: string) => void;
  activeSlots: (string | null)[];
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
  'DEV-039': { id: 'DEV-039', cx: 500, cy: 90, type: 'dev', label: 'DEV-039', subLabel: 'Project Scaffold' },
  
  // Level 2: Architecture & Foundation
  'DEV-040': { id: 'DEV-040', cx: 330, cy: 220, type: 'dev', label: 'DEV-040', subLabel: 'Core Protocol' },
  'DEV-045': { id: 'DEV-045', cx: 670, cy: 220, type: 'dev', label: 'DEV-045', subLabel: 'Audit Pipeline' },
  'DEV-044': { id: 'DEV-044', cx: 860, cy: 220, type: 'dev', label: 'DEV-044', subLabel: 'External Sync' },
  
  // Intermediary Supporting Molecular Entities (Contracts & Artifacts)
  'CONTRACT-AUTH': { id: 'CONTRACT-AUTH', cx: 330, cy: 340, type: 'contract', label: 'Auth Contract', subLabel: 'V1.2 Frozen' },
  'ARTIFACT-WASM': { id: 'ARTIFACT-WASM', cx: 160, cy: 450, type: 'artifact', label: 'Wasm Artifact', subLabel: 'SHA-256 Valid' },
  'ARTIFACT-RECEIPTS': { id: 'ARTIFACT-RECEIPTS', cx: 820, cy: 340, type: 'artifact', label: 'Audit Receipts', subLabel: 'Signed' },

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
  activeSlots
}) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const [zoom, setZoom] = useState(1);
  const [pan, setPan] = useState({ x: 60, y: 20 });
  const [isDragging, setIsDragging] = useState(false);
  const [dragStart, setDragStart] = useState({ x: 0, y: 0 });
  const [hoveredNode, setHoveredNode] = useState<string | null>(null);
  const [hoveredBond, setHoveredBond] = useState<RelationBond | null>(null);

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

  const getNodeVisuals = (id: string, type: 'dev' | 'contract' | 'artifact') => {
    if (type === 'contract') {
      return {
        fill: '#0A151C',
        stroke: '#0ea5e9',
        textColor: '#38bdf8',
        dotColor: '#0ea5e9',
        statusText: 'CONTRACT'
      };
    }
    if (type === 'artifact') {
      return {
        fill: '#17120A',
        stroke: '#d97706',
        textColor: '#fbbf24',
        dotColor: '#d97706',
        statusText: 'ARTIFACT'
      };
    }

    const dev = devs[id];
    const status: NodeStatus = dev ? dev.status : 'WAITING';

    switch (status) {
      case 'PASS':
        return {
          fill: '#09150E',
          stroke: '#10b981',
          textColor: '#34d399',
          dotColor: '#10b981',
          statusText: 'PASS'
        };
      case 'RUNNING':
        return {
          fill: '#0B1324',
          stroke: '#3b82f6',
          textColor: '#60a5fa',
          dotColor: '#3b82f6',
          statusText: 'RUNNING'
        };
      case 'AUDITING':
      case 'AUDIT_READY':
        return {
          fill: '#150D1E',
          stroke: '#a855f7',
          textColor: '#c084fc',
          dotColor: '#a855f7',
          statusText: 'AUDITING'
        };
      case 'BLOCKED':
        return {
          fill: '#1B0D0E',
          stroke: '#ef4444',
          textColor: '#f87171',
          dotColor: '#ef4444',
          statusText: 'BLOCKED'
        };
      case 'READY':
        return {
          fill: '#0D161B',
          stroke: '#06b6d4',
          textColor: '#22d3ee',
          dotColor: '#06b6d4',
          statusText: 'READY'
        };
      default:
        return {
          fill: '#111111',
          stroke: '#333333',
          textColor: '#737373',
          dotColor: '#525252',
          statusText: status || 'WAITING'
        };
    }
  };

  const activeRunsCount = activeSlots.filter(Boolean).length;

  return (
    <div 
      ref={containerRef}
      onMouseDown={handleMouseDown}
      onMouseMove={handleMouseMove}
      onMouseUp={handleMouseUp}
      onMouseLeave={handleMouseUp}
      className="relative w-full h-full bg-[#0A0A0A] overflow-hidden select-none cursor-grab active:cursor-grabbing"
    >
      {/* Background Engineering Grid */}
      <div className="absolute inset-0 pointer-events-none tech-grid-bg opacity-30" />

      {/* Floating Graph Controls */}
      <div className="absolute top-3 right-3 flex items-center space-x-1.5 bg-[#141414] backdrop-blur p-1 rounded-sm border border-[#262626] z-20 shadow-md">
        <button 
          onClick={() => handleZoom(0.15)}
          className="p-1.5 hover:bg-[#262626] text-[#A3A3A3] hover:text-white rounded-xs transition-colors cursor-pointer"
          title="Zoom In"
        >
          <ZoomIn className="w-3.5 h-3.5" />
        </button>
        <button 
          onClick={() => handleZoom(-0.15)}
          className="p-1.5 hover:bg-[#262626] text-[#A3A3A3] hover:text-white rounded-xs transition-colors cursor-pointer"
          title="Zoom Out"
        >
          <ZoomOut className="w-3.5 h-3.5" />
        </button>
        <button 
          onClick={resetView}
          className="p-1.5 hover:bg-[#262626] text-[#A3A3A3] hover:text-white rounded-xs transition-colors cursor-pointer"
          title="Reset Focus View"
        >
          <RotateCcw className="w-3.5 h-3.5" />
        </button>
      </div>

      {/* Top Banner: Visual Language & Concurrency */}
      <div className="absolute top-3 left-3 flex items-center space-x-3 bg-[#141414] backdrop-blur px-3 py-1.5 rounded-sm border border-[#262626] z-20 text-xs font-mono">
        <div className="flex items-center space-x-1.5">
          <Layers className="w-3.5 h-3.5 text-blue-400" />
          <span className="text-white font-bold">HEXAGONAL MOLECULAR NETWORK</span>
        </div>
        <span className="text-[#404040]">|</span>
        <div className="flex items-center space-x-1 text-[11px]">
          <span className="text-[#737373]">CONSTRUCTION:</span>
          <span className="font-bold text-white">{activeRunsCount} / 4 Runs</span>
        </div>
        <span className="text-[#404040]">|</span>
        <span className="text-[10px] text-[#737373]">
          Focus: <strong className="text-white">{selectedNodeId || 'None'}</strong>
        </span>
      </div>

      {/* Transform Canvas */}
      <div
        style={{
          transform: `translate(${pan.x}px, ${pan.y}px) scale(${zoom})`,
          transformOrigin: '0 0',
          transition: isDragging ? 'none' : 'transform 0.1s ease-out'
        }}
        className="w-[1150px] h-[640px] relative pointer-events-auto"
      >
        <svg className="w-full h-full pointer-events-auto" viewBox="0 0 1150 640">
          <defs>
            {/* Molecular bond markers */}
            <marker id="bond-pass" viewBox="0 0 10 10" refX="6" refY="5" markerWidth="5" markerHeight="5" orient="auto-start-reverse">
              <polygon points="0,2 7,5 0,8" fill="#10b981" />
            </marker>
            <marker id="bond-active" viewBox="0 0 10 10" refX="6" refY="5" markerWidth="5" markerHeight="5" orient="auto-start-reverse">
              <polygon points="0,2 7,5 0,8" fill="#3b82f6" />
            </marker>
            <marker id="bond-blocked" viewBox="0 0 10 10" refX="6" refY="5" markerWidth="5" markerHeight="5" orient="auto-start-reverse">
              <polygon points="0,2 7,5 0,8" fill="#ef4444" />
            </marker>
            <marker id="bond-default" viewBox="0 0 10 10" refX="6" refY="5" markerWidth="5" markerHeight="5" orient="auto-start-reverse">
              <polygon points="0,2 7,5 0,8" fill="#333333" />
            </marker>
          </defs>

          {/* 1. Molecular Network Bonds (Edges) */}
          {BONDS.map((bond, idx) => {
            const fromPos = MOLECULAR_POSITIONS[bond.from];
            const toPos = MOLECULAR_POSITIONS[bond.to];
            if (!fromPos || !toPos) return null;

            const isHighlighted = 
              selectedNodeId === bond.from || 
              selectedNodeId === bond.to ||
              hoveredNode === bond.from ||
              hoveredNode === bond.to;

            const isParentPass = devs[bond.from]?.status === 'PASS';
            const isBlocked = bond.type === 'blocks' || devs[bond.to]?.status === 'BLOCKED';

            let strokeColor = '#262626';
            let marker = 'url(#bond-default)';
            if (isHighlighted) {
              strokeColor = '#ffffff';
              marker = 'url(#bond-active)';
            } else if (isBlocked) {
              strokeColor = '#ef4444';
              marker = 'url(#bond-blocked)';
            } else if (isParentPass) {
              strokeColor = '#10b981';
              marker = 'url(#bond-pass)';
            }

            const midX = (fromPos.cx + toPos.cx) / 2;
            const midY = (fromPos.cy + toPos.cy) / 2;

            return (
              <g 
                key={`${bond.from}->${bond.to}-${idx}`}
                onMouseEnter={() => setHoveredBond(bond)}
                onMouseLeave={() => setHoveredBond(null)}
                className="cursor-pointer"
              >
                {/* Visual Molecular Bond Line */}
                <line
                  x1={fromPos.cx}
                  y1={fromPos.cy}
                  x2={toPos.cx}
                  y2={toPos.cy}
                  stroke={strokeColor}
                  strokeWidth={isHighlighted ? 2.5 : bond.isSolid ? 1.5 : 1}
                  strokeDasharray={bond.isSolid ? undefined : '5 4'}
                  markerEnd={marker}
                  className="transition-colors duration-150"
                />

                {/* Optional Bond Type Badge on Hover/Focus */}
                {isHighlighted && (
                  <g transform={`translate(${midX}, ${midY})`}>
                    <rect
                      x="-36"
                      y="-9"
                      width="72"
                      height="18"
                      rx="2"
                      fill="#141414"
                      stroke="#404040"
                      strokeWidth="1"
                    />
                    <text
                      textAnchor="middle"
                      dominantBaseline="central"
                      fill="#D4D4D4"
                      fontSize="9"
                      fontFamily="monospace"
                      fontWeight="bold"
                    >
                      {bond.type}
                    </text>
                  </g>
                )}
              </g>
            );
          })}

          {/* 2. Hexagonal Nodes (Visual Entity Hierarchy) */}
          {Object.values(MOLECULAR_POSITIONS).map(nodePos => {
            const isSelected = selectedNodeId === nodePos.id;
            const isHovered = hoveredNode === nodePos.id;
            const dev = devs[nodePos.id];
            const isDev = nodePos.type === 'dev';

            // Hexagon sizing hierarchy: Focus Node (r=48), Standard Node (r=38), Supporting (r=28)
            let radius = 38;
            if (isSelected) radius = 48;
            else if (!isDev) radius = 28;

            const visuals = getNodeVisuals(nodePos.id, nodePos.type);
            const hexPoints = getHexPoints(nodePos.cx, nodePos.cy, radius);

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
                className="cursor-pointer"
              >
                {/* Focus selection outer glow */}
                {isSelected && (
                  <polygon
                    points={getHexPoints(nodePos.cx, nodePos.cy, radius + 6)}
                    fill="none"
                    stroke="#ffffff"
                    strokeWidth="2"
                    strokeOpacity="0.4"
                    strokeDasharray="4 3"
                    className="animate-spin-slow"
                  />
                )}

                {/* Hexagon Body */}
                <polygon
                  points={hexPoints}
                  fill={visuals.fill}
                  stroke={isSelected ? '#ffffff' : isHovered ? '#737373' : visuals.stroke}
                  strokeWidth={isSelected ? 2.5 : isHovered ? 2 : 1.5}
                  className="transition-all duration-150"
                />

                {/* Inner Hexagon Content */}
                {isDev ? (
                  <>
                    {/* Status Dot */}
                    <circle
                      cx={nodePos.cx}
                      cy={nodePos.cy - (radius - 14)}
                      r="3"
                      fill={visuals.dotColor}
                      className={dev?.status === 'RUNNING' ? 'animate-pulse' : ''}
                    />

                    {/* Node ID */}
                    <text
                      x={nodePos.cx}
                      y={nodePos.cy - 1}
                      textAnchor="middle"
                      dominantBaseline="central"
                      fill="#FFFFFF"
                      fontSize={isSelected ? '12' : '10.5'}
                      fontFamily="monospace"
                      fontWeight="bold"
                    >
                      {nodePos.label}
                    </text>

                    {/* Title or SubLabel */}
                    <text
                      x={nodePos.cx}
                      y={nodePos.cy + (isSelected ? 14 : 12)}
                      textAnchor="middle"
                      dominantBaseline="central"
                      fill={visuals.textColor}
                      fontSize={isSelected ? '9.5' : '8.5'}
                      fontFamily="sans-serif"
                      fontWeight="500"
                    >
                      {dev ? dev.title.substring(0, 10) : nodePos.subLabel}
                    </text>

                    {/* Status badge at bottom of hexagon */}
                    {isSelected && (
                      <g transform={`translate(${nodePos.cx}, ${nodePos.cy + radius + 14})`}>
                        <rect
                          x="-35"
                          y="-8"
                          width="70"
                          height="16"
                          rx="2"
                          fill="#141414"
                          stroke={visuals.stroke}
                          strokeWidth="1"
                        />
                        <text
                          textAnchor="middle"
                          dominantBaseline="central"
                          fill={visuals.textColor}
                          fontSize="8.5"
                          fontFamily="monospace"
                          fontWeight="bold"
                        >
                          ● {visuals.statusText}
                        </text>
                      </g>
                    )}
                  </>
                ) : (
                  /* Supporting Node (Contract or Artifact) */
                  <>
                    <text
                      x={nodePos.cx}
                      y={nodePos.cy - 4}
                      textAnchor="middle"
                      dominantBaseline="central"
                      fill={visuals.textColor}
                      fontSize="8"
                      fontFamily="monospace"
                      fontWeight="bold"
                    >
                      {nodePos.type === 'contract' ? 'CONTRACT' : 'ARTIFACT'}
                    </text>
                    <text
                      x={nodePos.cx}
                      y={nodePos.cy + 6}
                      textAnchor="middle"
                      dominantBaseline="central"
                      fill="#D4D4D4"
                      fontSize="7.5"
                      fontFamily="sans-serif"
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
    </div>
  );
};
