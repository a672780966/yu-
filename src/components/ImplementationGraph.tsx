import React, { useState, useRef } from 'react';
import { Layers, ZoomIn, ZoomOut, RotateCcw, FileCode, Check } from 'lucide-react';
import { ImplementationNode } from '../types';

interface ImplementationGraphProps {
  nodes: ImplementationNode[];
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

  const getKindVisuals = (kind: ImplementationNode['kind']) => {
    switch (kind) {
      case 'controller':
        return { fill: '#0A1324', stroke: '#3b82f6', text: '#60a5fa', badge: 'CONTROLLER' };
      case 'service':
        return { fill: '#140D1E', stroke: '#a855f7', text: '#c084fc', badge: 'SERVICE' };
      case 'repo':
        return { fill: '#08160F', stroke: '#10b981', text: '#34d399', badge: 'REPO' };
      case 'test':
        return { fill: '#191207', stroke: '#f59e0b', text: '#fbbf24', badge: 'TEST' };
      case 'type':
        return { fill: '#0A151C', stroke: '#06b6d4', text: '#22d3ee', badge: 'TYPE' };
      default:
        return { fill: '#111111', stroke: '#333333', text: '#737373', badge: 'MODULE' };
    }
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
        <Layers className="w-3.5 h-3.5 text-purple-400" />
        <span className="text-[#737373] text-[11px] font-bold">CBM SYMBOL GRAPH:</span>
        <span className="font-semibold text-white">Hex Closure around {selectedId}</span>
        <span className="text-[#404040]">|</span>
        <span className="text-[10px] text-[#A3A3A3]">CALLS • IMPORTS • USES • DEFINES</span>
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

      {/* SVG Hexagonal Canvas */}
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
            <marker id="cbm-bond" viewBox="0 0 10 10" refX="6" refY="5" markerWidth="5" markerHeight="5" orient="auto-start-reverse">
              <polygon points="0,2 7,5 0,8" fill="#a855f7" />
            </marker>
            <marker id="cbm-default" viewBox="0 0 10 10" refX="6" refY="5" markerWidth="5" markerHeight="5" orient="auto-start-reverse">
              <polygon points="0,2 7,5 0,8" fill="#333333" />
            </marker>
          </defs>

          {/* Molecular Bond Lines */}
          {IMPLEMENTATION_MOLECULAR_NODES.map(node => {
            return node.calls.map(targetName => {
              const target = IMPLEMENTATION_MOLECULAR_NODES.find(n => n.name === targetName || n.id === targetName);
              if (!target) return null;

              const isHighlighted = selectedId === node.id || selectedId === target.id;

              return (
                <g key={`${node.id}->${target.id}`}>
                  <line
                    x1={node.cx}
                    y1={node.cy}
                    x2={target.cx}
                    y2={target.cy}
                    stroke={isHighlighted ? '#c084fc' : '#262626'}
                    strokeWidth={isHighlighted ? 2.5 : 1.5}
                    markerEnd={isHighlighted ? 'url(#cbm-bond)' : 'url(#cbm-default)'}
                    className="transition-colors duration-150"
                  />
                </g>
              );
            });
          })}

          {/* Hexagonal Symbols */}
          {IMPLEMENTATION_MOLECULAR_NODES.map(node => {
            const isSelected = selectedId === node.id;
            const radius = isSelected ? 48 : 36;
            const visuals = getKindVisuals(node.kind);
            const hexPoints = getHexPoints(node.cx, node.cy, radius);

            return (
              <g
                key={node.id}
                onClick={() => {
                  setSelectedId(node.id);
                  onSelectSymbol?.(node.name);
                }}
                className="cursor-pointer"
              >
                {/* Active Focus Outer Ring */}
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
                  className="transition-all duration-150"
                />

                {/* Inner Symbol Details */}
                <text
                  x={node.cx}
                  y={node.cy - 10}
                  textAnchor="middle"
                  dominantBaseline="central"
                  fill={visuals.text}
                  fontSize="8"
                  fontFamily="monospace"
                  fontWeight="bold"
                >
                  {visuals.badge}
                </text>

                <text
                  x={node.cx}
                  y={node.cy + 3}
                  textAnchor="middle"
                  dominantBaseline="central"
                  fill="#FFFFFF"
                  fontSize={isSelected ? '11' : '9.5'}
                  fontFamily="monospace"
                  fontWeight="bold"
                >
                  {node.name.length > 12 ? node.name.substring(0, 11) + '..' : node.name}
                </text>

                <text
                  x={node.cx}
                  y={node.cy + 15}
                  textAnchor="middle"
                  dominantBaseline="central"
                  fill="#737373"
                  fontSize="7.5"
                  fontFamily="sans-serif"
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
