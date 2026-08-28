import React from 'react';
import { Minus, Plus, Maximize2 } from 'lucide-react';

interface GraphControlsProps {
  onZoomIn: () => void;
  onZoomOut: () => void;
  onFit: () => void;
}

/**
 * Standard YU Graph Controls
 * Container: 96×32px, Hit: 28×28px, Icon: 14×14px, Gap: 2px.
 */
export const GraphControls: React.FC<GraphControlsProps> = ({
  onZoomIn,
  onZoomOut,
  onFit
}) => {
  return (
    <div className="flex items-center space-x-0.5 bg-[#111113] p-0.5 rounded-xs border border-[rgba(255,255,255,0.08)] shadow-sm z-20 select-none">
      <button
        onClick={onZoomOut}
        className="w-7 h-7 flex items-center justify-center rounded-xs text-[rgba(255,255,255,0.5)] hover:text-white hover:bg-[rgba(255,255,255,0.06)] active:bg-[rgba(255,255,255,0.1)] transition-colors cursor-pointer"
        title="Zoom Out (−)"
      >
        <Minus className="w-3.5 h-3.5" />
      </button>

      <button
        onClick={onZoomIn}
        className="w-7 h-7 flex items-center justify-center rounded-xs text-[rgba(255,255,255,0.5)] hover:text-white hover:bg-[rgba(255,255,255,0.06)] active:bg-[rgba(255,255,255,0.1)] transition-colors cursor-pointer"
        title="Zoom In (+)"
      >
        <Plus className="w-3.5 h-3.5" />
      </button>

      <button
        onClick={onFit}
        className="w-7 h-7 flex items-center justify-center rounded-xs text-[rgba(255,255,255,0.5)] hover:text-white hover:bg-[rgba(255,255,255,0.06)] active:bg-[rgba(255,255,255,0.1)] transition-colors cursor-pointer"
        title="Fit Network"
      >
        <Maximize2 className="w-3.5 h-3.5" />
      </button>
    </div>
  );
};
