import React, { useState, useRef } from 'react';
import { ZoomIn, ZoomOut, RotateCcw } from 'lucide-react';
import { PlanningNode } from '../types';

interface PlanningGraphProps {
  nodes?: PlanningNode[];
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
  { id: 'SPEC-01', title: 'Security Boundary', category: 'requirement', status: 'frozen', cx: 480, cy: 90, links: ['SPEC-02', 'CONTRACT-AUTH-V1', 'DEV-042'] },
  { id: 'SPEC-02', title: 'Session RFC', category: 'decision', status: 'frozen', cx: 280, cy: 220, links: ['CONTRACT-AUTH-V1'] },
  { id: 'CONTRACT-AUTH-V1', title: 'Auth Protocol V1.2', category: 'contract', status: 'frozen', cx: 480, cy: 230, links: ['DEV-042', 'DEV-043'] },
  { id: 'DEV-042', title: 'User Auth', category: 'dev', status: 'frozen', cx: 480, cy: 370, links: ['DEV-043', 'FUTURE-OAUTH'] },
  { id: 'DEV-043', title: 'Client Web UI', category: 'dev', status: 'draft', cx: 280, cy: 470, links: [] },
  { id: 'FUTURE-OAUTH', title: 'OAuth2 Sync', category: 'requirement', status: 'planned', cx: 680, cy: 370, links: ['FUTURE-RBAC'] },
  { id: 'FUTURE-RBAC', title: 'RBAC Policy', category: 'decision', status: 'planned', cx: 680, cy: 490, links: [] }
];

export const PlanningGraph: React.FC<PlanningGraphProps> = ({ onSelectNode }) => {
  const [selectedId, setSelectedId] = useState<string>('CONTRACT-AUTH-V1');
  const [hoveredId, setHoveredId] = useState<string | null>(null);
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

  return (
    <div 
      ref={containerRef}
      onMouseDown={handleMouseDown}
      onMouseMove={handleMouseMove}
      onMouseUp={handleMouseUp}
      onMouseLeave={handleMouseUp}
      className="relative w-full h-full bg-[#0B0B0C] overflow-hidden select-none cursor-grab active:cursor-grabbing"
    >
      {/* Background Engineering Grid */}
      <div className="absolute inset-0 pointer-events-none tech-grid-bg opacity-[0.06]" />

      {/* Floating Graph Controls */}
      <div className="absolute top-3 right-3 flex items-center space-x-1 bg-[#111113] p-1 rounded-xs border border-[rgba(255,255,255,0.08)] z-20 shadow-sm">
        <button 
          onClick={() => setZoom(prev => Math.min(prev + 0.15, 2.2))}
          className="p-1.5 hover:bg-[rgba(255,255,255,0.08)] text-[rgba(255,255,255,0.5)] hover:text-white rounded-xs transition-colors cursor-pointer"
          title="Zoom In"
        >
          <ZoomIn className="w-3.5 h-3.5" />
        </button>
        <button 
          onClick={() => setZoom(prev => Math.max(prev - 0.15, 0.5))}
          className="p-1.5 hover:bg-[rgba(255,255,255,0.08)] text-[rgba(255,255,255,0.5)] hover:text-white rounded-xs transition-colors cursor-pointer"
          title="Zoom Out"
        >
          <ZoomOut className="w-3.5 h-3.5" />
        </button>
        <button 
          onClick={() => { setZoom(1); setPan({ x: 50, y: 15 }); }}
          className="p-1.5 hover:bg-[rgba(255,255,255,0.08)] text-[rgba(255,255,255,0.5)] hover:text-white rounded-xs transition-colors cursor-pointer"
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
          transition: isDragging ? 'none' : 'transform 0.18s cubic-bezier(0.22, 1, 0.36, 1)'
        }}
        className="w-[1000px] h-[600px] relative pointer-events-auto"
      >
        <svg className="w-full h-full pointer-events-auto" viewBox="0 0 1000 600">
          <defs>
            <marker id="plan-focus" viewBox="0 0 10 10" refX="6" refY="5" markerWidth="4.5" markerHeight="4.5" orient="auto-start-reverse">
              <polygon points="0,2 7,5 0,8" fill="rgba(255,255,255,0.6)" />
            </marker>
            <marker id="plan-default" viewBox="0 0 10 10" refX="6" refY="5" markerWidth="4" markerHeight="4" orient="auto-start-reverse">
              <polygon points="0,2 7,5 0,8" fill="rgba(255,255,255,0.2)" />
            </marker>
          </defs>

          {/* Molecular Bonds */}
          {PLANNING_MOLECULAR_NODES.map(node => {
            return node.links.map(targetId => {
              const target = PLANNING_MOLECULAR_NODES.find(n => n.id === targetId);
              if (!target) return null;

              const isFrozenBond = node.status === 'frozen' && target.status === 'frozen';
              const isFocusBond = selectedId === node.id || selectedId === target.id;
              const isHoverBond = hoveredId === node.id || hoveredId === target.id;
              const isHighlighted = isFocusBond || isHoverBond;

              return (
                <g key={`${node.id}->${target.id}`}>
                  <line
                    x1={node.cx}
                    y1={node.cy}
                    x2={target.cx}
                    y2={target.cy}
                    stroke={isHighlighted ? 'rgba(255, 255, 255, 0.48)' : 'rgba(255, 255, 255, 0.11)'}
                    strokeWidth={isHighlighted ? 1.8 : 1.2}
                    strokeDasharray={isFrozenBond ? undefined : '4 4'}
                    markerEnd={isHighlighted ? 'url(#plan-focus)' : 'url(#plan-default)'}
                    className="transition-colors duration-150"
                  />
                </g>
              );
            });
          })}

          {/* Hexagonal Planning Entities */}
          {PLANNING_MOLECULAR_NODES.map(node => {
            const isSelected = selectedId === node.id;
            const isHovered = hoveredId === node.id;
            const radius = isSelected ? 44 : 36;
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
                onMouseEnter={() => setHoveredId(node.id)}
                onMouseLeave={() => setHoveredId(null)}
                className="cursor-pointer"
              >
                {/* Hexagon Body */}
                <polygon
                  points={hexPoints}
                  fill={isSelected ? 'rgba(255, 255, 255, 0.05)' : isHovered ? 'rgba(255, 255, 255, 0.035)' : 'rgba(255, 255, 255, 0.02)'}
                  stroke={isSelected ? 'rgba(255, 255, 255, 0.65)' : isHovered ? 'rgba(255, 255, 255, 0.3)' : 'rgba(255, 255, 255, 0.14)'}
                  strokeWidth={isSelected ? 2 : 1.2}
                  strokeDasharray={node.status !== 'frozen' ? '4 3' : undefined}
                  className="transition-all duration-150"
                />

                {/* Category & Status */}
                <text
                  x={node.cx}
                  y={node.cy - 10}
                  textAnchor="middle"
                  dominantBaseline="central"
                  fill="rgba(255, 255, 255, 0.4)"
                  fontSize="7.5"
                  fontFamily="sans-serif"
                  fontWeight="600"
                >
                  {node.category.toUpperCase()} • {node.status.toUpperCase()}
                </text>

                {/* Node ID */}
                <text
                  x={node.cx}
                  y={node.cy + 2}
                  textAnchor="middle"
                  dominantBaseline="central"
                  fill={isSelected ? '#FFFFFF' : 'rgba(255, 255, 255, 0.85)'}
                  fontSize={isSelected ? '10.5' : '9.5'}
                  fontFamily="monospace"
                  fontWeight="600"
                >
                  {node.id}
                </text>

                {/* Title */}
                <text
                  x={node.cx}
                  y={node.cy + 14}
                  textAnchor="middle"
                  dominantBaseline="central"
                  fill="rgba(255, 255, 255, 0.4)"
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

