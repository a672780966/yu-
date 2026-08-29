import React from 'react';
import { Minus, Plus, Maximize2 } from 'lucide-react';

interface GraphControlsProps {
  zoom?: number;
  onZoomIn: () => void;
  onZoomOut: () => void;
  onFit: () => void;
}

/**
 * Standard YU Graph Controls (R4 Golden Precision)
 * Container: ~124×32px, Hit: 28×28px, Icon: 14×14px, Gap: 2px.
 * Displays tabular numeric zoom percentage (- 100 + ⌖).
 */
export const GraphControls: React.FC<GraphControlsProps> = ({
  zoom = 1,
  onZoomIn,
  onZoomOut,
  onFit
}) => {
  // Format as 3-digit tabular percentage, e.g. 075, 100, 125
  const zoomPct = Math.round(zoom * 100);
  const formattedPct = zoomPct < 100 ? `0${zoomPct}` : `${zoomPct}`;

  return (
    <div className="flex items-center space-x-0.5 bg-[#111113] p-0.5 rounded-xs border border-[rgba(255,255,255,0.08)] shadow-sm z-20 select-none">
      <button
        onClick={onZoomOut}
        className="w-7 h-7 flex items-center justify-center rounded-xs text-[rgba(255,255,255,0.5)] hover:text-white hover:bg-[rgba(255,255,255,0.06)] active:bg-[rgba(255,255,255,0.1)] transition-colors cursor-pointer"
        title="Zoom Out (−)"
      >
        <Minus className="w-3.5 h-3.5" />
      </button>

      {/* Tabular numeric indicator */}
      <span className="w-8 text-center text-[10px] font-mono text-[rgba(255,255,255,0.65)] yu-data font-medium select-none">
        {formattedPct}
      </span>

      <button
        onClick={onZoomIn}
        className="w-7 h-7 flex items-center justify-center rounded-xs text-[rgba(255,255,255,0.5)] hover:text-white hover:bg-[rgba(255,255,255,0.06)] active:bg-[rgba(255,255,255,0.1)] transition-colors cursor-pointer"
        title="Zoom In (+)"
      >
        <Plus className="w-3.5 h-3.5" />
      </button>

      <button
        onClick={onFit}
        className="w-7 h-7 flex items-center justify-center rounded-xs text-[rgba(255,255,255,0.5)] hover:text-white hover:bg-[rgba(255,255,255,0.06)] active:bg-[rgba(255,255,255,0.1)] transition-colors cursor-pointer ml-0.5"
        title="Fit Network (⌖)"
      >
        <Maximize2 className="w-3.5 h-3.5" />
      </button>
    </div>
  );
};

