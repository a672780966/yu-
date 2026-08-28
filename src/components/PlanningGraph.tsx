import React, { useState } from 'react';
import { 
  GRAPH_CANVAS_WIDTH, 
  GRAPH_CANVAS_HEIGHT, 
  PLANNING_POSITIONS, 
  RADIUS_MAIN_DEV, 
  RADIUS_FOCUS_DEV, 
  RADIUS_HIT_TARGET, 
  getHexPoints, 
  computeBondEndpoints 
} from '../engine/graphGeometry';
import { GraphViewport } from './GraphViewport';

interface PlanningGraphProps {
  onSelectMilestone?: (milestoneId: string) => void;
}

export const PlanningGraph: React.FC<PlanningGraphProps> = ({ onSelectMilestone }) => {
  const [selectedId, setSelectedId] = useState<string>('CONTRACT-AUTH');
  const [hoveredId, setHoveredId] = useState<string | null>(null);

  const getStatusColor = (status: 'frozen' | 'draft' | 'planned') => {
    switch (status) {
      case 'frozen':
        return '#55c98b';
      case 'draft':
        return '#5e9cff';
      case 'planned':
        return 'rgba(255, 255, 255, 0.35)';
    }
  };

  return (
    <GraphViewport>
      <svg
        className="w-full h-full pointer-events-auto"
        viewBox={`0 0 ${GRAPH_CANVAS_WIDTH} ${GRAPH_CANVAS_HEIGHT}`}
      >
        <defs>
          <marker
            id="plan-focus"
            viewBox="0 0 10 10"
            refX="6"
            refY="5"
            markerWidth="4"
            markerHeight="4"
            orient="auto-start-reverse"
          >
            <polygon points="0,2 6,5 0,8" fill="rgba(255, 255, 255, 0.65)" />
          </marker>
        </defs>

        {/* Bond lines connecting milestones & contracts */}
        {PLANNING_POSITIONS.map(node => {
          return node.links.map(targetId => {
            const target = PLANNING_POSITIONS.find(n => n.id === targetId);
            if (!target) return null;

            const isFocusBond = selectedId === node.id || selectedId === target.id;
            const isHoverBond = hoveredId === node.id || hoveredId === target.id;
            const isHighlighted = isFocusBond || isHoverBond;

            const fromR = selectedId === node.id ? RADIUS_FOCUS_DEV : RADIUS_MAIN_DEV;
            const toR = selectedId === target.id ? RADIUS_FOCUS_DEV : RADIUS_MAIN_DEV;

            const { x1, y1, x2, y2 } = computeBondEndpoints(
              node.cx,
              node.cy,
              fromR,
              target.cx,
              target.cy,
              toR,
              4
            );

            return (
              <g key={`${node.id}->${target.id}`}>
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

                {/* Visible bond line */}
                <line
                  x1={x1}
                  y1={y1}
                  x2={x2}
                  y2={y2}
                  stroke={isHighlighted ? 'rgba(255, 255, 255, 0.55)' : 'rgba(255, 255, 255, 0.10)'}
                  strokeWidth={isHighlighted ? 1.5 : 1}
                  strokeDasharray={node.status === 'planned' || target.status === 'planned' ? '3 5' : undefined}
                  markerEnd={isHighlighted ? 'url(#plan-focus)' : undefined}
                  vectorEffect="non-scaling-stroke"
                  className="transition-colors duration-150"
                />
              </g>
            );
          });
        })}

        {/* Planning Matrix Hexagons */}
        {PLANNING_POSITIONS.map(node => {
          const isSelected = selectedId === node.id;
          const isHovered = hoveredId === node.id;
          const radius = isSelected ? RADIUS_FOCUS_DEV : RADIUS_MAIN_DEV;
          const hexPoints = getHexPoints(node.cx, node.cy, radius);
          const hitHexPoints = getHexPoints(node.cx, node.cy, RADIUS_HIT_TARGET);

          return (
            <g
              key={node.id}
              onClick={() => {
                setSelectedId(node.id);
                onSelectMilestone?.(node.id);
              }}
              onMouseEnter={() => setHoveredId(node.id)}
              onMouseLeave={() => setHoveredId(null)}
              className="cursor-pointer"
            >
              {/* Invisible Hit Hex */}
              <polygon
                points={hitHexPoints}
                fill="transparent"
                stroke="none"
                pointerEvents="all"
              />

              {/* Hexagon Body */}
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

              {/* Status Dot */}
              <circle
                cx={node.cx}
                cy={node.cy - (radius - 11)}
                r={isSelected ? 3 : 2.5}
                fill={getStatusColor(node.status)}
              />

              {/* ID / Name */}
              <text
                x={node.cx}
                y={node.cy + 1}
                textAnchor="middle"
                dominantBaseline="central"
                fill={isSelected ? '#FFFFFF' : 'rgba(255, 255, 255, 0.88)'}
                fontSize={isSelected ? '10.5' : '9.5'}
                fontFamily="monospace"
                fontWeight="600"
              >
                {node.id}
              </text>

              {/* Category / Title */}
              <text
                x={node.cx}
                y={node.cy + 13}
                textAnchor="middle"
                dominantBaseline="central"
                fill="rgba(255, 255, 255, 0.45)"
                fontSize="7.5"
                fontFamily="sans-serif"
              >
                {node.title.length > 12 ? node.title.substring(0, 11) + '..' : node.title}
              </text>
            </g>
          );
        })}
      </svg>
    </GraphViewport>
  );
};
