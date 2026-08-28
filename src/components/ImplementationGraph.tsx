import React, { useState, useRef } from 'react';
import { ZoomIn, ZoomOut, RotateCcw } from 'lucide-react';
import { ImplementationNode } from '../types';

interface ImplementationGraphProps {
  nodes?: ImplementationNode[];
  onSelectSymbol?: (symbolName: string) => void;
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

interface SymbolMolecularPos {
  id: string;
  name: string;
  kind: 'controller' | 'service' | 'repo' | 'test' | 'type';
  file: string;
  cx: number;
  cy: number;
  calls: string[];
}

const IMPLEMENTATION_MOLECULAR_NODES: SymbolMolecularPos[] = [
  { id: 'AuthController', name: 'AuthController', kind: 'controller', file: 'src/auth/controller.ts', cx: 480, cy: 90, calls: ['AuthService', 'TokenValidator'] },
  { id: 'AuthService', name: 'AuthService', kind: 'service', file: 'src/auth/service.ts', cx: 480, cy: 230, calls: ['UserRepository', 'SessionStore', 'AuthTypes'] },
  { id: 'TokenValidator', name: 'TokenValidator', kind: 'service', file: 'src/auth/token.ts', cx: 280, cy: 190, calls: ['AuthTypes'] },
  { id: 'UserRepository', name: 'UserRepository', kind: 'repo', file: 'src/db/userRepo.ts', cx: 340, cy: 370, calls: ['AuthTypes'] },
  { id: 'SessionStore', name: 'SessionStore', kind: 'repo', file: 'src/db/session.ts', cx: 620, cy: 370, calls: ['AuthTypes'] },
  { id: 'AuthTypes', name: 'AuthTypes', kind: 'type', file: 'src/auth/types.ts', cx: 480, cy: 480, calls: [] },
  { id: 'AuthTest', name: 'AuthSuite.test', kind: 'test', file: 'tests/auth.test.ts', cx: 720, cy: 190, calls: ['AuthService'] }
];

export const ImplementationGraph: React.FC<ImplementationGraphProps> = ({ onSelectSymbol }) => {
  const [selectedId, setSelectedId] = useState<string>('AuthService');
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

      {/* SVG Hexagonal Canvas */}
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
            <marker id="cbm-focus" viewBox="0 0 10 10" refX="6" refY="5" markerWidth="4.5" markerHeight="4.5" orient="auto-start-reverse">
              <polygon points="0,2 7,5 0,8" fill="rgba(255,255,255,0.6)" />
            </marker>
            <marker id="cbm-default" viewBox="0 0 10 10" refX="6" refY="5" markerWidth="4" markerHeight="4" orient="auto-start-reverse">
              <polygon points="0,2 7,5 0,8" fill="rgba(255,255,255,0.2)" />
            </marker>
          </defs>

          {/* Molecular Bond Lines */}
          {IMPLEMENTATION_MOLECULAR_NODES.map(node => {
            return node.calls.map(targetName => {
              const target = IMPLEMENTATION_MOLECULAR_NODES.find(n => n.name === targetName || n.id === targetName);
              if (!target) return null;

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
                    markerEnd={isHighlighted ? 'url(#cbm-focus)' : 'url(#cbm-default)'}
                    className="transition-colors duration-150"
                  />
                </g>
              );
            });
          })}

          {/* Hexagonal Symbols */}
          {IMPLEMENTATION_MOLECULAR_NODES.map(node => {
            const isSelected = selectedId === node.id;
            const isHovered = hoveredId === node.id;
            const radius = isSelected ? 44 : 36;
            const hexPoints = getHexPoints(node.cx, node.cy, radius);

            return (
              <g
                key={node.id}
                onClick={() => {
                  setSelectedId(node.id);
                  onSelectSymbol?.(node.name);
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
                  className="transition-all duration-150"
                />

                {/* Symbol Kind Badge */}
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
                  {node.kind.toUpperCase()}
                </text>

                {/* Symbol Name */}
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
                  {node.name.length > 12 ? node.name.substring(0, 11) + '..' : node.name}
                </text>

                {/* File Path */}
                <text
                  x={node.cx}
                  y={node.cy + 14}
                  textAnchor="middle"
                  dominantBaseline="central"
                  fill="rgba(255, 255, 255, 0.4)"
                  fontSize="7.5"
                  fontFamily="monospace"
                >
                  {node.file.split('/').pop()}
                </text>
              </g>
            );
          })}
        </svg>
      </div>
    </div>
  );
};

