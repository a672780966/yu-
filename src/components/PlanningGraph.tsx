import React, { useState, useRef } from 'react';
import { Compass, ZoomIn, ZoomOut, RotateCcw, Lock, FileQuestion } from 'lucide-react';
import { PlanningNode } from '../types';

interface PlanningGraphProps {
  nodes: PlanningNode[];
  onSelectNode?: (nodeId: string) => void;
}

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

interface PlanningMolecularPos {
  id: string;
  title: string;
  category: 'requirement' | 'contract' | 'decision' | 'dev';
  status: 'frozen' | 'draft' | 'planned';
  cx: number;
  cy: number;
  links: string[];
}

const PLANNING_MOLECULAR_NODES: PlanningMolecularPos[] = [
  { id: 'SPEC-01', title: 'System Security Boundary', category: 'requirement', status: 'frozen', cx: 480, cy: 90, links: ['SPEC-02', 'CONTRACT-AUTH-V1', 'DEV-042'] },
  { id: 'SPEC-02', title: 'Session Lifecycle RFC', category: 'decision', status: 'frozen', cx: 280, cy: 220, links: ['CONTRACT-AUTH-V1'] },
  { id: 'CONTRACT-AUTH-V1', title: 'Auth Protocol V1.2', category: 'contract', status: 'frozen', cx: 480, cy: 230, links: ['DEV-042', 'DEV-043'] },
  { id: 'DEV-042', title: 'User Authentication', category: 'dev', status: 'frozen', cx: 480, cy: 370, links: ['DEV-043', 'FUTURE-OAUTH'] },
  { id: 'DEV-043', title: 'Client Web Workspace', category: 'dev', status: 'draft', cx: 280, cy: 470, links: [] },
  { id: 'FUTURE-OAUTH', title: 'OAuth2 Provider Sync', category: 'requirement', status: 'planned', cx: 680, cy: 370, links: ['FUTURE-RBAC'] },
  { id: 'FUTURE-RBAC', title: 'Fine-grained RBAC Policy', category: 'decision', status: 'planned', cx: 680, cy: 490, links: [] }
];

export const PlanningGraph: React.FC<PlanningGraphProps> = ({ onSelectNode }) => {
  const [selectedId, setSelectedId] = useState<string>('CONTRACT-AUTH-V1');
  const [zoom, setZoom] = useState(1);
  const [pan, setPan] = useState({ x: 50, y: 15 });
  const [isDragging, setIsDragging] = useState(false);
  const [dragStart, setDragStart] = useState({ x: 0, y: 0 });
  const containerRef = useRef<HTMLDivElement>(null);

  const handleMouseDown = (e: React.MouseEvent) => {
    if (e.target === containerRef.current || (e.target as HTMLElement).tagName === 'svg') {
      setIsDragging(true);
      setDragStart({ x: e.clientX - pan.x, y: e.clientY - pan.y });
    }
  };

  const handleMouseMove = (e: React.MouseEvent) => {
    if (isDragging) {
      setPan({ x: e.clientX - dragStart.x, y: e.clientY - dragStart.y });
    }
  };

  const handleMouseUp = () => {
    setIsDragging(false);
  };

  const getNodeVisuals = (category: string, status: 'frozen' | 'draft' | 'planned') => {
    if (status === 'frozen') {
      return {
        fill: '#08171F',
        stroke: '#0ea5e9',
        text: '#38bdf8',
        isDashed: false,
        badge: 'FROZEN'
      };
    }
    if (status === 'draft') {
      return {
        fill: '#141414',
        stroke: '#525252',
        text: '#D4D4D4',
        isDashed: true,
        badge: 'DRAFT'
      };
    }
    return {
      fill: '#0F0F0F',
      stroke: '#333333',
      text: '#737373',
      isDashed: true,
      badge: 'PLANNED'
    };
  };

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

      {/* Header Info */}
      <div className="absolute top-3 left-3 z-10 flex items-center space-x-2.5 bg-[#141414] backdrop-blur px-3 py-1.5 rounded-sm border border-[#262626] text-xs font-mono">
        <Compass className="w-3.5 h-3.5 text-cyan-400" />
        <span className="text-[#737373] text-[11px] font-bold">PLANNING SPECIFICATION GRAPH:</span>
        <span className="text-white font-semibold">Where is the project heading?</span>
        <span className="text-[#404040]">|</span>
        <span className="text-[10px] text-cyan-300">Solid: Frozen Fact</span>
        <span className="text-[10px] text-[#737373]">Dashed: Planned / Future</span>
      </div>

      {/* Floating Graph Controls */}
      <div className="absolute top-3 right-3 flex items-center space-x-1.5 bg-[#141414] backdrop-blur p-1 rounded-sm border border-[#262626] z-20 shadow-md">
        <button 
          onClick={() => setZoom(prev => Math.min(prev + 0.15, 2.2))}
          className="p-1.5 hover:bg-[#262626] text-[#A3A3A3] hover:text-white rounded-xs transition-colors cursor-pointer"
          title="Zoom In"
        >
          <ZoomIn className="w-3.5 h-3.5" />
        </button>
        <button 
          onClick={() => setZoom(prev => Math.max(prev - 0.15, 0.5))}
          className="p-1.5 hover:bg-[#262626] text-[#A3A3A3] hover:text-white rounded-xs transition-colors cursor-pointer"
          title="Zoom Out"
        >
          <ZoomOut className="w-3.5 h-3.5" />
        </button>
        <button 
          onClick={() => { setZoom(1); setPan({ x: 50, y: 15 }); }}
          className="p-1.5 hover:bg-[#262626] text-[#A3A3A3] hover:text-white rounded-xs transition-colors cursor-pointer"
          title="Reset View"
        >
          <RotateCcw className="w-3.5 h-3.5" />
        </button>
      </div>

      {/* SVG Canvas */}
      <div
        style={{
          transform: `translate(${pan.x}px, ${pan.y}px) scale(${zoom})`,
          transformOrigin: '0 0',
          transition: isDragging ? 'none' : 'transform 0.1s ease-out'
        }}
        className="w-[1000px] h-[600px] relative pointer-events-auto"
      >
        <svg className="w-full h-full pointer-events-auto" viewBox="0 0 1000 600">
          <defs>
            <marker id="plan-bond-frozen" viewBox="0 0 10 10" refX="6" refY="5" markerWidth="5" markerHeight="5" orient="auto-start-reverse">
              <polygon points="0,2 7,5 0,8" fill="#0ea5e9" />
            </marker>
            <marker id="plan-bond-default" viewBox="0 0 10 10" refX="6" refY="5" markerWidth="5" markerHeight="5" orient="auto-start-reverse">
              <polygon points="0,2 7,5 0,8" fill="#404040" />
            </marker>
          </defs>

          {/* Molecular Bonds */}
          {PLANNING_MOLECULAR_NODES.map(node => {
            return node.links.map(targetId => {
              const target = PLANNING_MOLECULAR_NODES.find(n => n.id === targetId);
              if (!target) return null;

              const isFrozenBond = node.status === 'frozen' && target.status === 'frozen';
              const isSelected = selectedId === node.id || selectedId === target.id;

              return (
                <g key={`${node.id}->${target.id}`}>
                  <line
                    x1={node.cx}
                    y1={node.cy}
                    x2={target.cx}
                    y2={target.cy}
                    stroke={isSelected ? '#38bdf8' : isFrozenBond ? '#0ea5e9' : '#333333'}
                    strokeWidth={isSelected ? 2.5 : 1.5}
                    strokeDasharray={isFrozenBond ? undefined : '5 4'}
                    markerEnd={isFrozenBond ? 'url(#plan-bond-frozen)' : 'url(#plan-bond-default)'}
                    className="transition-colors duration-150"
                  />
                </g>
              );
            });
          })}

          {/* Hexagonal Planning Entities */}
          {PLANNING_MOLECULAR_NODES.map(node => {
            const isSelected = selectedId === node.id;
            const radius = isSelected ? 48 : 36;
            const visuals = getNodeVisuals(node.category, node.status);
            const hexPoints = getHexPoints(node.cx, node.cy, radius);

            return (
              <g
                key={node.id}
                onClick={() => {
                  setSelectedId(node.id);
                  if (node.id.startsWith('DEV-')) {
                    onSelectNode?.(node.id);
                  }
                }}
                className="cursor-pointer"
              >
                {/* Active Outer Glow */}
                {isSelected && (
                  <polygon
                    points={getHexPoints(node.cx, node.cy, radius + 6)}
                    fill="none"
                    stroke="#ffffff"
                    strokeWidth="1.5"
                    strokeOpacity="0.4"
                    strokeDasharray="4 3"
                  />
                )}

                {/* Hexagon Body */}
                <polygon
                  points={hexPoints}
                  fill={visuals.fill}
                  stroke={isSelected ? '#ffffff' : visuals.stroke}
                  strokeWidth={isSelected ? 2.5 : 1.5}
                  strokeDasharray={visuals.isDashed ? '4 3' : undefined}
                  className="transition-all duration-150"
                />

                {/* Category & Status */}
                <text
                  x={node.cx}
                  y={node.cy - 12}
                  textAnchor="middle"
                  dominantBaseline="central"
                  fill={visuals.text}
                  fontSize="7.5"
                  fontFamily="monospace"
                  fontWeight="bold"
                >
                  {node.category.toUpperCase()} • {visuals.badge}
                </text>

                {/* Node ID / Title */}
                <text
                  x={node.cx}
                  y={node.cy + 1}
                  textAnchor="middle"
                  dominantBaseline="central"
                  fill="#FFFFFF"
                  fontSize={isSelected ? '10.5' : '9'}
                  fontFamily="monospace"
                  fontWeight="bold"
                >
                  {node.id}
                </text>

                <text
                  x={node.cx}
                  y={node.cy + 14}
                  textAnchor="middle"
                  dominantBaseline="central"
                  fill="#A3A3A3"
                  fontSize="7.5"
                  fontFamily="sans-serif"
                >
                  {node.title.length > 14 ? node.title.substring(0, 13) + '..' : node.title}
                </text>
              </g>
            );
          })}
        </svg>
      </div>
    </div>
  );
};
