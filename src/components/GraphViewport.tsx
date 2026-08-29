import React, { useState, useRef, useEffect, useCallback } from 'react';
import { 
  GRAPH_CANVAS_WIDTH, 
  GRAPH_CANVAS_HEIGHT, 
  GOLDEN_FOCUS_POINTS,
  YU_GRAPH,
  calculateFitTransform 
} from '../engine/graphGeometry';
import { GraphControls } from './GraphControls';

interface GraphViewportProps {
  children: React.ReactNode;
  className?: string;
  overlay?: React.ReactNode;
  focusTarget?: { x: number; y: number } | null;
}

export const GraphViewport: React.FC<GraphViewportProps> = ({
  children,
  className = '',
  overlay,
  focusTarget
}) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const [zoom, setZoom] = useState(1);
  const [pan, setPan] = useState({ x: 0, y: 0 });
  const [isDragging, setIsDragging] = useState(false);
  const [dragStart, setDragStart] = useState({ x: 0, y: 0 });
  const [hasUserAdjusted, setHasUserAdjusted] = useState(false);
  const [isInteracting, setIsInteracting] = useState(false);
  const interactionTimerRef = useRef<NodeJS.Timeout | null>(null);

  const triggerInteractionState = () => {
    setIsInteracting(true);
    if (interactionTimerRef.current) {
      clearTimeout(interactionTimerRef.current);
    }
    interactionTimerRef.current = setTimeout(() => {
      setIsInteracting(false);
    }, 200);
  };

  // Auto fit based on container dimensions, default max scale 1.0
  const fitToContainer = useCallback(() => {
    if (!containerRef.current) return;
    const { clientWidth, clientHeight } = containerRef.current;
    if (clientWidth > 0 && clientHeight > 0) {
      const transform = calculateFitTransform(clientWidth, clientHeight, GRAPH_CANVAS_WIDTH, GRAPH_CANVAS_HEIGHT, 48);
      setZoom(transform.scale);
      setPan({ x: transform.x, y: transform.y });
      triggerInteractionState();
    }
  }, []);

  useEffect(() => {
    if (!containerRef.current) return;
    
    // Initial Fit
    fitToContainer();

    const resizeObserver = new ResizeObserver(() => {
      if (!hasUserAdjusted) {
        fitToContainer();
      }
    });

    resizeObserver.observe(containerRef.current);
    return () => {
      resizeObserver.disconnect();
      if (interactionTimerRef.current) clearTimeout(interactionTimerRef.current);
    };
  }, [fitToContainer, hasUserAdjusted]);

  // Golden Focus Camera logic
  useEffect(() => {
    if (!focusTarget || !containerRef.current) return;

    // Find closest Golden Focus Point in canvas space
    let closestPt = GOLDEN_FOCUS_POINTS[0];
    let minDistance = Infinity;

    for (const gp of GOLDEN_FOCUS_POINTS) {
      const dist = Math.hypot(focusTarget.x - gp.x, focusTarget.y - gp.y);
      if (dist < minDistance) {
        minDistance = dist;
        closestPt = gp;
      }
    }

    // Dead zone check: if target is within 48px of a golden point, keep camera intact
    if (minDistance <= YU_GRAPH.focusDeadZone) {
      return;
    }

    // If node is outside the dead zone, gently shift camera to align focus node with the closest golden anchor
    const { clientWidth, clientHeight } = containerRef.current;
    if (clientWidth > 0 && clientHeight > 0) {
      // Default base center
      const basePanX = (clientWidth - GRAPH_CANVAS_WIDTH * zoom) / 2;
      const basePanY = (clientHeight - GRAPH_CANVAS_HEIGHT * zoom) / 2;

      // Desired pan shifts node towards closest golden point
      const deltaX = (closestPt.x - focusTarget.x) * zoom;
      const deltaY = (closestPt.y - focusTarget.y) * zoom;

      setPan({
        x: basePanX + deltaX,
        y: basePanY + deltaY
      });
      triggerInteractionState();
    }
  }, [focusTarget, zoom]);

  const handleMouseDown = (e: React.MouseEvent) => {
    // Only drag when clicking background or svg canvas background
    if (
      e.target === containerRef.current || 
      (e.target as HTMLElement).tagName === 'svg' ||
      (e.target as HTMLElement).classList.contains('yu-graph-canvas-bg')
    ) {
      setIsDragging(true);
      setIsInteracting(true);
      setDragStart({ x: e.clientX - pan.x, y: e.clientY - pan.y });
      setHasUserAdjusted(true);
    }
  };

  const handleMouseMove = (e: React.MouseEvent) => {
    if (isDragging) {
      setPan({
        x: e.clientX - dragStart.x,
        y: e.clientY - dragStart.y
      });
      triggerInteractionState();
    }
  };

  const handleMouseUp = () => {
    if (isDragging) {
      setIsDragging(false);
      triggerInteractionState();
    }
  };

  const handleZoomIn = () => {
    setZoom(prev => Math.min(prev + 0.15, 2.2));
    setHasUserAdjusted(true);
    triggerInteractionState();
  };

  const handleZoomOut = () => {
    setZoom(prev => Math.max(prev - 0.15, 0.45));
    setHasUserAdjusted(true);
    triggerInteractionState();
  };

  const handleFit = () => {
    fitToContainer();
    setHasUserAdjusted(false);
  };

  return (
    <div
      ref={containerRef}
      onMouseDown={handleMouseDown}
      onMouseMove={handleMouseMove}
      onMouseUp={handleMouseUp}
      onMouseLeave={handleMouseUp}
      className={`relative w-full h-full bg-[#0B0B0C] overflow-hidden select-none cursor-grab active:cursor-grabbing font-sans ${className}`}
    >
      {/* Precision Background Grid: true 2.5%, 5% on active interaction */}
      <div 
        className={`absolute inset-0 pointer-events-none tech-grid-bg transition-opacity duration-180 ${
          isInteracting ? 'grid-active opacity-100' : 'opacity-100'
        }`} 
      />

      {/* Floating Graph Controls (Top-Right, ~124×32px) */}
      <div className="absolute top-3 right-3 z-30">
        <GraphControls
          zoom={zoom}
          onZoomIn={handleZoomIn}
          onZoomOut={handleZoomOut}
          onFit={handleFit}
        />
      </div>

      {/* Unified Viewport Transform Stage (1048×648 Golden Stage) */}
      <div
        style={{
          transform: `translate(${pan.x}px, ${pan.y}px) scale(${zoom})`,
          transformOrigin: '0 0',
          transition: isDragging ? 'none' : 'transform 180ms cubic-bezier(0.22, 1, 0.36, 1)'
        }}
        className="w-[1048px] h-[648px] relative pointer-events-auto yu-graph-canvas-bg"
      >
        {children}
      </div>

      {/* Context Overlays (e.g. 220×136 Rail Focus Annotation) */}
      {overlay}
    </div>
  );
};

