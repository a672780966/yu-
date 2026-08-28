import React, { useState, useRef, useEffect, useCallback } from 'react';
import { 
  GRAPH_CANVAS_WIDTH, 
  GRAPH_CANVAS_HEIGHT, 
  calculateFitTransform 
} from '../engine/graphGeometry';
import { GraphControls } from './GraphControls';

interface GraphViewportProps {
  children: React.ReactNode;
  className?: string;
  overlay?: React.ReactNode;
}

export const GraphViewport: React.FC<GraphViewportProps> = ({
  children,
  className = '',
  overlay
}) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const [zoom, setZoom] = useState(1);
  const [pan, setPan] = useState({ x: 0, y: 0 });
  const [isDragging, setIsDragging] = useState(false);
  const [dragStart, setDragStart] = useState({ x: 0, y: 0 });
  const [hasUserAdjusted, setHasUserAdjusted] = useState(false);

  // Auto fit based on container dimensions
  const fitToContainer = useCallback(() => {
    if (!containerRef.current) return;
    const { clientWidth, clientHeight } = containerRef.current;
    if (clientWidth > 0 && clientHeight > 0) {
      const transform = calculateFitTransform(clientWidth, clientHeight, GRAPH_CANVAS_WIDTH, GRAPH_CANVAS_HEIGHT, 48);
      setZoom(transform.scale);
      setPan({ x: transform.x, y: transform.y });
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
    return () => resizeObserver.disconnect();
  }, [fitToContainer, hasUserAdjusted]);

  const handleMouseDown = (e: React.MouseEvent) => {
    // Only drag when clicking background or svg container
    if (
      e.target === containerRef.current || 
      (e.target as HTMLElement).tagName === 'svg' ||
      (e.target as HTMLElement).classList.contains('yu-graph-canvas-bg')
    ) {
      setIsDragging(true);
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
    }
  };

  const handleMouseUp = () => {
    setIsDragging(false);
  };

  const handleZoomIn = () => {
    setZoom(prev => Math.min(prev + 0.15, 2.2));
    setHasUserAdjusted(true);
  };

  const handleZoomOut = () => {
    setZoom(prev => Math.max(prev - 0.15, 0.45));
    setHasUserAdjusted(true);
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
      {/* Subtle background grid on 24px Macro Grid */}
      <div className="absolute inset-0 pointer-events-none tech-grid-bg opacity-[0.065]" />

      {/* Floating Graph Controls (Top-Right, 96×32px) */}
      <div className="absolute top-3 right-3 z-30">
        <GraphControls
          onZoomIn={handleZoomIn}
          onZoomOut={handleZoomOut}
          onFit={handleFit}
        />
      </div>

      {/* Viewport Transform Layer */}
      <div
        style={{
          transform: `translate(${pan.x}px, ${pan.y}px) scale(${zoom})`,
          transformOrigin: '0 0',
          transition: isDragging ? 'none' : 'transform 180ms cubic-bezier(0.22, 1, 0.36, 1)'
        }}
        className="w-[1152px] h-[648px] relative pointer-events-auto yu-graph-canvas-bg"
      >
        {children}
      </div>

      {/* Optional Context Overlays (e.g. Focus Context Overlay) */}
      {overlay}
    </div>
  );
};
