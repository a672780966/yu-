import React, { useState } from 'react';
import { 
  ExternalLink, 
  Eye
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
  const selectedPos = selectedNodeId ? CONSTRUCTION_POSITIONS[selectedNodeId] : null;

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

  // Determine diagonal placement for 220x136 Focus Annotation
  // Top-Left -> Bottom-Right; Top-Right -> Bottom-Left; Bottom-Left -> Top-Right; Bottom-Right -> Top-Left
  let annotationPlacementClass = 'bottom-6 left-6';
  if (selectedPos) {
    const isLeft = selectedPos.cx <= 524;
    const isTop = selectedPos.cy <= 324;
    if (isLeft && isTop) {
      annotationPlacementClass = 'bottom-6 right-6';
    } else if (!isLeft && isTop) {
      annotationPlacementClass = 'bottom-6 left-6';
    } else if (isLeft && !isTop) {
      annotationPlacementClass = 'top-14 right-6';
    } else {
      annotationPlacementClass = 'top-14 left-6';
    }
  }

  return (
    <div className="w-full h-full relative select-none">
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
          
          // Blocked bond only turns red when focused/hovered
          const isBlockedAndFocused = bond.type === 'blocks' && (isHighlighted || (selectedNodeId === bond.from && devs[bond.from]?.status === 'BLOCKED'));

          let strokeColor = 'rgba(255, 255, 255, 0.10)';
          let strokeWidth = 1;
          let markerEnd: string | undefined = undefined;

          if (isBlockedAndFocused) {
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

              {/* 3px Structural Anchors (Visible only when highlighted/focused) */}
              <circle
                cx={x1}
                cy={y1}
                r={1.5}
                fill="#0B0B0C"
                stroke="rgba(255, 255, 255, 0.4)"
                strokeWidth={1}
                vectorEffect="non-scaling-stroke"
                style={{ opacity: isHighlighted ? 1 : 0 }}
                className="transition-opacity duration-150 pointer-events-none"
              />
              <circle
                cx={x2}
                cy={y2}
                r={1.5}
                fill="#0B0B0C"
                stroke="rgba(255, 255, 255, 0.4)"
                strokeWidth={1}
                vectorEffect="non-scaling-stroke"
                style={{ opacity: isHighlighted ? 1 : 0 }}
                className="transition-opacity duration-150 pointer-events-none"
              />

              {/* Relationship label on Focus/Hover: Direct text without rect box */}
              {isHighlighted && (
                <text
                  x={midX}
                  y={midY - 5}
                  textAnchor="middle"
                  dominantBaseline="central"
                  fill="rgba(255, 255, 255, 0.55)"
                  fontSize="8.5"
                  fontFamily="monospace"
                  fontWeight="500"
                  className="pointer-events-none select-none"
                >
                  {bond.type}
                </text>
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
              {/* Invisible Hit Hex (r=52) */}
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

      {/* 3. FOCUS ANNOTATION (220×136 Golden Rectangle with Rail Callout) */}
      {selectedDev && (
        <div 
          className={`absolute ${annotationPlacementClass} w-[220px] h-[136px] z-20 pointer-events-auto flex font-sans select-none animate-in fade-in duration-150`}
        >
          {/* Structural Rail: ╲ and vertical line */}
          <div className="flex flex-col items-center shrink-0 pr-2 text-[rgba(255,255,255,0.45)]">
            <span className="text-[10px] leading-none font-mono">╲</span>
            <span className="w-[1px] flex-1 bg-[rgba(255,255,255,0.2)] block mt-0.5" />
          </div>

          {/* Content container */}
          <div className="flex-1 flex flex-col justify-between py-0.5 text-xs">
            {/* Header */}
            <div>
              <div className="flex items-center justify-between">
                <span className="font-mono text-white font-semibold text-[11px]">{selectedDev.nodeId}</span>
                <span className="text-[10px] font-mono text-[rgba(255,255,255,0.5)] yu-data">
                  {selectedDev.status === 'RUNNING' ? '02:41' : selectedDev.status}
                </span>
              </div>
              <div className="text-[11px] text-[rgba(255,255,255,0.7)] truncate">{selectedDev.title}</div>
            </div>

            {/* Diagnostic Lines */}
            <div className="space-y-0.5 text-[10px] font-mono text-[rgba(255,255,255,0.65)] yu-data">
              <div className="flex justify-between">
                <span className="text-[rgba(255,255,255,0.35)]">{selectedDev.dependsOn[0] || 'DEV-039'}</span>
                <span className="text-[rgba(255,255,255,0.4)]">UPSTREAM</span>
              </div>
              <div className="flex justify-between">
                <span className="text-[rgba(255,255,255,0.35)]">AUTH-V2</span>
                <span className="text-[rgba(255,255,255,0.4)]">CONTRACT</span>
              </div>
              <div className="flex justify-between">
                <span className="text-[rgba(255,255,255,0.35)]">{selectedDev.currentRun?.runId || 'RUN-042-003'}</span>
                <span className="text-[rgba(255,255,255,0.4)]">CURRENT</span>
              </div>
            </div>

            {/* Actions (28px height hit targets) */}
            <div className="flex items-center space-x-1.5 pt-1 border-t border-[rgba(255,255,255,0.06)]">
              {onOpenEditor && (
                <button
                  onClick={() => onOpenEditor(selectedDev.nodeId)}
                  className="h-7 flex-1 flex items-center justify-center space-x-1 px-2 bg-[rgba(255,255,255,0.04)] hover:bg-[rgba(255,255,255,0.08)] active:bg-[rgba(255,255,255,0.12)] text-white rounded-xs border border-[rgba(255,255,255,0.08)] text-[10px] transition-colors cursor-pointer"
                >
                  <ExternalLink className="w-3 h-3" />
                  <span>Open DEV</span>
                </button>
              )}
              {onViewEvidence && selectedDev.currentRun && (
                <button
                  onClick={() => onViewEvidence(selectedDev.nodeId)}
                  className="h-7 flex-1 flex items-center justify-center space-x-1 px-2 bg-[rgba(255,255,255,0.04)] hover:bg-[rgba(255,255,255,0.08)] active:bg-[rgba(255,255,255,0.12)] text-[rgba(255,255,255,0.85)] rounded-xs border border-[rgba(255,255,255,0.08)] text-[10px] transition-colors cursor-pointer"
                >
                  <Eye className="w-3 h-3" />
                  <span>Evidence</span>
                </button>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

