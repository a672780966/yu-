import React, { useState } from 'react';
import { 
  ExternalLink, 
  Eye, 
  Lock, 
  Layers
} from 'lucide-react';
import { DevManifest, NodeStatus } from '../types';
import { 
  GRAPH_CANVAS_WIDTH, 
  GRAPH_CANVAS_HEIGHT, 
  CONSTRUCTION_POSITIONS, 
  RADIUS_MAIN_DEV, 
  RADIUS_FOCUS_DEV, 
  RADIUS_SUPPORT, 
  RADIUS_HIT_TARGET, 
  getHexPoints, 
  computeBondEndpoints 
} from '../engine/graphGeometry';
import { GraphViewport } from './GraphViewport';

interface ConstructionGraphProps {
  devs: Record<string, DevManifest>;
  selectedNodeId: string | null;
  onSelectNode: (nodeId: string) => void;
  activeSlots: (string | null)[];
  onOpenEditor?: (nodeId: string) => void;
  onViewEvidence?: (nodeId: string) => void;
}

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

export const ConstructionGraph: React.FC<ConstructionGraphProps> = ({
  devs,
  selectedNodeId,
  onSelectNode,
  onOpenEditor,
  onViewEvidence
}) => {
  const [hoveredNode, setHoveredNode] = useState<string | null>(null);
  const [hoveredBond, setHoveredBond] = useState<string | null>(null);

  const selectedDev = selectedNodeId ? devs[selectedNodeId] : null;

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
      case 'REVIEW_REQUIRED':
        return '#d5a94e';
      case 'READY':
        return '#5e9cff';
      default:
        return 'rgba(255, 255, 255, 0.28)';
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

  const focusOverlay = selectedDev ? (
    <div className="absolute bottom-4 left-4 w-[320px] bg-[#111113]/95 backdrop-blur-md border border-[rgba(255,255,255,0.08)] p-3 shadow-xl text-xs font-sans space-y-2.5 z-20 pointer-events-auto rounded-xs">
      {/* Structural Left Rail Signal */}
      <div className="flex items-start space-x-2.5">
        <div className="flex flex-col items-center shrink-0 pt-0.5 text-[rgba(255,255,255,0.5)]">
          <span className="text-[10px] leading-none font-mono">╲</span>
          <span className="w-[1px] h-full bg-[rgba(255,255,255,0.2)] block mt-0.5" />
        </div>

        <div className="flex-1 min-w-0 space-y-2">
          {/* Header */}
          <div className="flex items-center justify-between pb-1 border-b border-[rgba(255,255,255,0.06)]">
            <div className="flex items-center space-x-1.5 truncate">
              <span className="font-mono text-white font-semibold text-[11px]">{selectedDev.nodeId}</span>
              <span className="text-[rgba(255,255,255,0.25)]">·</span>
              <span className="text-[rgba(255,255,255,0.7)] text-[11px] truncate">{selectedDev.title}</span>
            </div>

            <div className="flex items-center space-x-1.5 font-mono text-[10px] shrink-0">
              <span className={`w-[5px] h-[5px] rounded-full ${
                selectedDev.status === 'PASS' ? 'bg-[#55c98b]' :
                selectedDev.status === 'RUNNING' ? 'bg-[#5e9cff] animate-quiet-pulse' :
                selectedDev.status === 'BLOCKED' ? 'bg-[#ec6a6a]' :
                selectedDev.status === 'AUDITING' ? 'bg-[#a487e8]' :
                'bg-[rgba(255,255,255,0.3)]'
              }`} />
              <span className="text-[rgba(255,255,255,0.85)] uppercase">{selectedDev.status}</span>
            </div>
          </div>

          {/* Quick Diagnostics */}
          <div className="space-y-1 text-[11px] text-[rgba(255,255,255,0.65)]">
            <div className="truncate">
              <span className="text-[rgba(255,255,255,0.35)]">Goal: </span>
              <span className="text-[rgba(255,255,255,0.85)]">{selectedDev.goal}</span>
            </div>
            <div className="flex justify-between font-mono text-[10px] yu-data">
              <span className="text-[rgba(255,255,255,0.35)]">Dependencies:</span>
              <span className="text-[rgba(255,255,255,0.85)]">
                {selectedDev.dependsOn.length > 0 ? selectedDev.dependsOn.join(', ') : 'Root Entity'}
              </span>
            </div>
            <div className="flex justify-between font-mono text-[10px] yu-data">
              <span className="text-[rgba(255,255,255,0.35)]">Scope Rules:</span>
              <span className="text-[rgba(255,255,255,0.85)]">
                {selectedDev.scope.allowed.length} write · {selectedDev.scope.forbidden.length} blocked
              </span>
            </div>
          </div>

          {/* Action Buttons: 32px height standard */}
          <div className="flex items-center space-x-2 pt-1 border-t border-[rgba(255,255,255,0.06)]">
            {onOpenEditor && (
              <button
                onClick={() => onOpenEditor(selectedDev.nodeId)}
                className="h-8 flex-1 flex items-center justify-center space-x-1.5 px-3 bg-[rgba(255,255,255,0.04)] hover:bg-[rgba(255,255,255,0.08)] active:bg-[rgba(255,255,255,0.12)] text-white rounded-xs border border-[rgba(255,255,255,0.08)] text-[11px] transition-colors cursor-pointer"
              >
                <ExternalLink className="w-3.5 h-3.5" />
                <span>Open DEV</span>
              </button>
            )}

            {onViewEvidence && selectedDev.currentRun && (
              <button
                onClick={() => onViewEvidence(selectedDev.nodeId)}
                className="h-8 flex-1 flex items-center justify-center space-x-1.5 px-3 bg-[rgba(255,255,255,0.04)] hover:bg-[rgba(255,255,255,0.08)] active:bg-[rgba(255,255,255,0.12)] text-[rgba(255,255,255,0.85)] rounded-xs border border-[rgba(255,255,255,0.08)] text-[11px] transition-colors cursor-pointer"
              >
                <Eye className="w-3.5 h-3.5" />
                <span>Evidence</span>
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  ) : null;

  return (
    <GraphViewport overlay={focusOverlay}>
      <svg
        className="w-full h-full pointer-events-auto"
        viewBox={`0 0 ${GRAPH_CANVAS_WIDTH} ${GRAPH_CANVAS_HEIGHT}`}
      >
        <defs>
          <marker
            id="bond-arrow-focus"
            viewBox="0 0 10 10"
            refX="6"
            refY="5"
            markerWidth="4"
            markerHeight="4"
            orient="auto-start-reverse"
          >
            <polygon points="0,2 6,5 0,8" fill="rgba(255, 255, 255, 0.65)" />
          </marker>
          <marker
            id="bond-arrow-blocked"
            viewBox="0 0 10 10"
            refX="6"
            refY="5"
            markerWidth="4"
            markerHeight="4"
            orient="auto-start-reverse"
          >
            <polygon points="0,2 6,5 0,8" fill="#ec6a6a" />
          </marker>
        </defs>

        {/* 1. MOLECULAR BONDS */}
        {BONDS.map((bond, idx) => {
          const fromPos = CONSTRUCTION_POSITIONS[bond.from];
          const toPos = CONSTRUCTION_POSITIONS[bond.to];
          if (!fromPos || !toPos) return null;

          const fromR = fromPos.type === 'dev' 
            ? (selectedNodeId === bond.from ? RADIUS_FOCUS_DEV : RADIUS_MAIN_DEV)
            : RADIUS_SUPPORT;
          const toR = toPos.type === 'dev'
            ? (selectedNodeId === bond.to ? RADIUS_FOCUS_DEV : RADIUS_MAIN_DEV)
            : RADIUS_SUPPORT;

          // Exact ray-boundary intersection with 4px mechanical gap
          const { x1, y1, x2, y2, midX, midY } = computeBondEndpoints(
            fromPos.cx,
            fromPos.cy,
            fromR,
            toPos.cx,
            toPos.cy,
            toR,
            4
          );

          const bondKey = `${bond.from}->${bond.to}`;
          const isFocusBond = selectedNodeId === bond.from || selectedNodeId === bond.to;
          const isHoverBond = hoveredNode === bond.from || hoveredNode === bond.to || hoveredBond === bondKey;
          const isHighlighted = isFocusBond || isHoverBond;
          const isBlocked = bond.type === 'blocks' && (isHighlighted || devs[bond.from]?.status === 'BLOCKED');

          // R3 Bond specification:
          // Default: Visible line 1px, Opacity 10%, Arrow: NONE
          // Focus: Line 1.5px, Opacity 55%, Arrow: YES
          // Blocked: Line 1.5px, Red 75%
          let strokeColor = 'rgba(255, 255, 255, 0.10)';
          let strokeWidth = 1;
          let markerEnd: string | undefined = undefined;

          if (isBlocked) {
            strokeColor = 'rgba(236, 106, 106, 0.75)';
            strokeWidth = 1.5;
            markerEnd = 'url(#bond-arrow-blocked)';
          } else if (isHighlighted) {
            strokeColor = 'rgba(255, 255, 255, 0.55)';
            strokeWidth = 1.5;
            markerEnd = 'url(#bond-arrow-focus)';
          } else if (selectedNodeId && !directNeighbors.has(bond.from) && !directNeighbors.has(bond.to)) {
            strokeColor = 'rgba(255, 255, 255, 0.035)';
          }

          return (
            <g
              key={`${bondKey}-${idx}`}
              onMouseEnter={() => setHoveredBond(bondKey)}
              onMouseLeave={() => setHoveredBond(null)}
              className="transition-opacity duration-150 cursor-pointer"
            >
              {/* Invisible 12px hover hit area */}
              <line
                x1={x1}
                y1={y1}
                x2={x2}
                y2={y2}
                stroke="transparent"
                strokeWidth={12}
                vectorEffect="non-scaling-stroke"
              />

              {/* Visible Bond line */}
              <line
                x1={x1}
                y1={y1}
                x2={x2}
                y2={y2}
                stroke={strokeColor}
                strokeWidth={strokeWidth}
                strokeDasharray={bond.isSolid ? undefined : '3 5'}
                markerEnd={markerEnd}
                vectorEffect="non-scaling-stroke"
                className="transition-colors duration-150"
              />

              {/* Relationship label on Focus/Hover */}
              {isHighlighted && (
                <g transform={`translate(${midX}, ${midY})`}>
                  <rect
                    x="-32"
                    y="-9"
                    width="64"
                    height="18"
                    rx="2"
                    fill="#111113"
                    stroke="rgba(255, 255, 255, 0.12)"
                    strokeWidth="1"
                    vectorEffect="non-scaling-stroke"
                  />
                  <text
                    textAnchor="middle"
                    dominantBaseline="central"
                    fill="rgba(255, 255, 255, 0.75)"
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

        {/* 2. HEXAGONAL NODES */}
        {Object.values(CONSTRUCTION_POSITIONS).map(nodePos => {
          const isSelected = selectedNodeId === nodePos.id;
          const isHovered = hoveredNode === nodePos.id;
          const isDirectNeighbor = directNeighbors.has(nodePos.id);
          const dev = devs[nodePos.id];
          const isDev = nodePos.type === 'dev';

          // Node radii: Main DEV r=36 (focus r=44), Support r=28
          let radius = isDev ? RADIUS_MAIN_DEV : RADIUS_SUPPORT;
          if (isSelected && isDev) radius = RADIUS_FOCUS_DEV;

          let nodeOpacity = 0.88;
          if (selectedNodeId) {
            if (isSelected) nodeOpacity = 1;
            else if (isDirectNeighbor) nodeOpacity = 0.85;
            else nodeOpacity = 0.28;
          }

          const hexPoints = getHexPoints(nodePos.cx, nodePos.cy, radius);
          const hitHexPoints = getHexPoints(nodePos.cx, nodePos.cy, RADIUS_HIT_TARGET);
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
              className="cursor-pointer transition-opacity duration-150"
            >
              {/* Invisible Hit Hex (r=52) guaranteeing generous touch/click target even at 0.5x zoom */}
              <polygon
                points={hitHexPoints}
                fill="transparent"
                stroke="none"
                pointerEvents="all"
              />

              {/* Visible Hexagon Facet */}
              <polygon
                points={hexPoints}
                fill={
                  isSelected
                    ? 'rgba(255, 255, 255, 0.05)'
                    : isHovered
                    ? 'rgba(255, 255, 255, 0.035)'
                    : 'rgba(255, 255, 255, 0.015)'
                }
                stroke={
                  isSelected
                    ? 'rgba(255, 255, 255, 0.7)'
                    : isHovered
                    ? 'rgba(255, 255, 255, 0.35)'
                    : 'rgba(255, 255, 255, 0.12)'
                }
                strokeWidth={isSelected ? 1.5 : 1}
                vectorEffect="non-scaling-stroke"
                className="transition-colors duration-150"
              />

              {isDev ? (
                <>
                  {/* Status Dot: 5px (Focus 6px) */}
                  <circle
                    cx={nodePos.cx}
                    cy={nodePos.cy - (radius - 11)}
                    r={isSelected ? 3 : 2.5}
                    fill={dotColor}
                    className={dev?.status === 'RUNNING' ? 'animate-quiet-pulse' : undefined}
                  />

                  {/* Primary Node ID */}
                  <text
                    x={nodePos.cx}
                    y={nodePos.cy + 1}
                    textAnchor="middle"
                    dominantBaseline="central"
                    fill={isSelected ? '#FFFFFF' : 'rgba(255, 255, 255, 0.88)'}
                    fontSize={isSelected ? '11' : '10'}
                    fontFamily="monospace"
                    fontWeight="600"
                  >
                    {nodePos.label}
                  </text>

                  {/* Subtitle / Title label */}
                  <text
                    x={nodePos.cx}
                    y={nodePos.cy + 13}
                    textAnchor="middle"
                    dominantBaseline="central"
                    fill="rgba(255, 255, 255, 0.45)"
                    fontSize="8"
                    fontFamily="sans-serif"
                  >
                    {dev ? (dev.title.length > 10 ? dev.title.substring(0, 9) + '…' : dev.title) : nodePos.subLabel}
                  </text>
                </>
              ) : (
                <>
                  {/* Contract or Artifact Label */}
                  <text
                    x={nodePos.cx}
                    y={nodePos.cy - 4}
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
                    fill="rgba(255, 255, 255, 0.75)"
                    fontSize="8.5"
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
    </GraphViewport>
  );
};
