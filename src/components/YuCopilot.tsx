import React, { useState } from 'react';
import { 
  Bot, 
  Send, 
  AlertTriangle, 
  CheckCircle2, 
  Eye
} from 'lucide-react';
import { CopilotMessage, DevManifest } from '../types';

interface YuCopilotProps {
  messages: CopilotMessage[];
  selectedNode: DevManifest | null;
  onSendMessage: (text: string) => void;
  onResolveBlockOption: (nodeId: string, optionKey: 'A' | 'B' | 'C') => void;
  onViewEvidence: (nodeId: string) => void;
}

export const YuCopilot: React.FC<YuCopilotProps> = ({
  messages,
  selectedNode,
  onSendMessage,
  onResolveBlockOption,
  onViewEvidence
}) => {
  const [inputText, setInputText] = useState('');

  const handleSend = (e: React.FormEvent) => {
    e.preventDefault();
    if (!inputText.trim()) return;
    onSendMessage(inputText.trim());
    setInputText('');
  };

  return (
    <aside className="w-80 bg-[#0E0E10] border-l border-[rgba(255,255,255,0.075)] flex flex-col h-full select-none shrink-0 overflow-hidden font-sans">
      {/* Copilot Header (48px height matching TopBar) */}
      <div className="h-12 px-4 border-b border-[rgba(255,255,255,0.075)] flex items-center justify-between bg-[#0E0E10] shrink-0">
        <div className="flex items-center space-x-2">
          <div className="w-5 h-5 rounded-xs bg-[rgba(255,255,255,0.05)] border border-[rgba(255,255,255,0.1)] flex items-center justify-center text-[rgba(255,255,255,0.8)]">
            <Bot className="w-3.5 h-3.5" />
          </div>
          <div>
            <span className="text-xs font-semibold text-white tracking-tight">YU Copilot</span>
            <span className="text-[10px] text-[rgba(255,255,255,0.4)] block font-sans -mt-0.5">
              Planner & Decision
            </span>
          </div>
        </div>

        {selectedNode && (
          <span className="text-[10px] font-mono px-2 py-0.5 bg-[rgba(255,255,255,0.04)] text-[rgba(255,255,255,0.8)] border border-[rgba(255,255,255,0.1)] rounded-xs font-medium">
            {selectedNode.nodeId}
          </span>
        )}
      </div>

      {/* Messages Stream (Seamless vertical thread, flat cards) */}
      <div className="flex-1 overflow-y-auto p-4 space-y-4 text-xs font-sans scrollbar-thin">
        {messages.map(msg => (
          <div
            key={msg.id}
            className={`space-y-1.5 pb-3 border-b border-[rgba(255,255,255,0.05)] last:border-0 ${
              msg.sender === 'user'
                ? 'text-white'
                : 'text-[rgba(255,255,255,0.85)]'
            }`}
          >
            {/* Header info */}
            <div className="flex items-center justify-between text-[10px] text-[rgba(255,255,255,0.4)] font-mono">
              <span className="font-semibold uppercase tracking-wider text-[rgba(255,255,255,0.6)]">
                {msg.sender === 'user' ? 'User' : 'Claude Planner'}
              </span>
              <span>{msg.timestamp}</span>
            </div>

            {/* Message Body */}
            <div className="text-[12px] leading-relaxed whitespace-pre-line text-[rgba(255,255,255,0.9)]">
              {msg.content}
            </div>

            {/* Block Resolution Action (Clean callout with subtle red border) */}
            {msg.blockAction && (
              <div className="mt-3 bg-[rgba(236,106,106,0.04)] p-3 rounded-xs border border-[rgba(236,106,106,0.2)] space-y-2.5">
                <div className="flex items-center space-x-1.5 text-[#ec6a6a] font-medium text-[11px] font-mono">
                  <AlertTriangle className="w-3.5 h-3.5 shrink-0" />
                  <span>{msg.blockAction.nodeId} RESOLUTION REQUIRED</span>
                </div>

                <div className="space-y-1.5">
                  {msg.blockAction.options.map(opt => (
                    <button
                      key={opt.key}
                      onClick={() => onResolveBlockOption(msg.blockAction!.nodeId, opt.key)}
                      className={`w-full text-left p-2.5 rounded-xs transition-colors cursor-pointer border ${
                        msg.blockAction?.resolvedOption === opt.key
                          ? 'bg-[rgba(85,201,139,0.08)] border-[rgba(85,201,139,0.4)] text-white'
                          : 'bg-[#111113] hover:bg-[#161619] border-[rgba(255,255,255,0.08)] text-[rgba(255,255,255,0.85)]'
                      }`}
                    >
                      <div className="font-medium text-[11px] text-white flex items-center justify-between">
                        <span>{opt.title}</span>
                        {msg.blockAction?.resolvedOption === opt.key && (
                          <CheckCircle2 className="w-3.5 h-3.5 text-[#55c98b]" />
                        )}
                      </div>
                      <div className="text-[11px] text-[rgba(255,255,255,0.5)] mt-0.5">{opt.description}</div>
                      <div className="text-[10px] text-[#5e9cff] font-mono mt-1">Impact: {opt.impact}</div>
                    </button>
                  ))}
                </div>
              </div>
            )}

            {/* Evidence Quick Link */}
            {msg.evidenceRef && (
              <button
                onClick={() => onViewEvidence(msg.evidenceRef!.nodeId)}
                className="mt-2 flex items-center space-x-1.5 text-[11px] text-[rgba(255,255,255,0.7)] bg-[rgba(255,255,255,0.04)] hover:bg-[rgba(255,255,255,0.08)] px-2.5 py-1 rounded-xs border border-[rgba(255,255,255,0.1)] transition-colors cursor-pointer"
              >
                <Eye className="w-3 h-3 text-[rgba(255,255,255,0.5)]" />
                <span>View Evidence for {msg.evidenceRef.nodeId}</span>
              </button>
            )}
          </div>
        ))}
      </div>

      {/* Input Form (Seamless 1px border) */}
      <form onSubmit={handleSend} className="p-3 bg-[#0B0B0C] border-t border-[rgba(255,255,255,0.075)] shrink-0">
        <div className="relative flex items-center">
          <input
            type="text"
            value={inputText}
            onChange={e => setInputText(e.target.value)}
            placeholder="Ask Copilot (e.g. why is DEV-044 blocked?)..."
            className="w-full bg-[#141416] border border-[rgba(255,255,255,0.1)] focus:border-[rgba(255,255,255,0.4)] rounded-xs pl-3 pr-8 py-2 text-xs text-white font-sans placeholder:text-[rgba(255,255,255,0.3)] outline-none transition-colors"
          />
          <button
            type="submit"
            disabled={!inputText.trim()}
            className="absolute right-1.5 p-1 bg-white hover:bg-neutral-200 disabled:opacity-20 text-black rounded-xs transition-opacity cursor-pointer"
          >
            <Send className="w-3 h-3" />
          </button>
        </div>
      </form>
    </aside>
  );
};

