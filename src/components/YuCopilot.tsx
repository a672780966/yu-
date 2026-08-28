import React, { useState } from 'react';
import { 
  Bot, 
  Send, 
  AlertTriangle, 
  CheckCircle2, 
  ChevronRight, 
  Layers, 
  Sparkles, 
  Eye,
  FileCode,
  Terminal,
  ShieldCheck
} from 'lucide-react';
import { CopilotMessage, DevManifest, BlockOption } from '../types';

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
    <aside className="w-80 bg-[#0D0D0D] border-l border-[#262626] flex flex-col h-full select-none shrink-0 overflow-hidden font-sans">
      {/* Copilot Header */}
      <div className="p-3 border-b border-[#262626] flex items-center justify-between bg-[#0A0A0A]">
        <div className="flex items-center space-x-2">
          <div className="w-5 h-5 rounded-xs bg-[#1C1C1C] border border-[#333333] flex items-center justify-center text-blue-400">
            <Bot className="w-3.5 h-3.5" />
          </div>
          <div>
            <span className="text-xs font-bold text-white font-mono">YU COPILOT</span>
            <span className="text-[10px] text-[#737373] font-mono block -mt-0.5">
              Project Assistant & Scheduler
            </span>
          </div>
        </div>

        {selectedNode && (
          <span className="text-[10px] font-mono px-2 py-0.5 bg-[#141414] text-[#E5E5E5] border border-[#262626] rounded-xs font-bold">
            {selectedNode.nodeId}
          </span>
        )}
      </div>

      {/* Messages Stream */}
      <div className="flex-1 overflow-y-auto p-3 space-y-3 text-xs font-mono scrollbar-thin scrollbar-thumb-[#262626]">
        {messages.map(msg => (
          <div
            key={msg.id}
            className={`space-y-2 ${
              msg.sender === 'user'
                ? 'bg-[#141414] p-3 rounded-sm border border-blue-500/30 text-white ml-3'
                : 'bg-[#121212] p-3 rounded-sm border border-[#262626] text-[#D4D4D4]'
            }`}
          >
            {/* Header info */}
            <div className="flex items-center justify-between text-[10px] text-[#737373] mb-1 border-b border-[#262626] pb-1">
              <span className="font-bold uppercase tracking-wider text-[#A3A3A3]">
                {msg.sender === 'user' ? 'USER DECISION' : 'CLAUDE PLANNER'}
              </span>
              <span>{msg.timestamp}</span>
            </div>

            {/* Message Body (Markdown format supported) */}
            <div className="text-[11px] leading-relaxed whitespace-pre-line text-[#E5E5E5]">
              {msg.content}
            </div>

            {/* Block Resolution Action Card */}
            {msg.blockAction && (
              <div className="mt-3 bg-[#1A0E10] p-3 rounded-sm border border-red-500/40 space-y-2.5">
                <div className="flex items-center space-x-1.5 text-red-400 font-bold text-[11px]">
                  <AlertTriangle className="w-3.5 h-3.5 shrink-0" />
                  <span>{msg.blockAction.nodeId} BLOCK DECISION REQUIRED</span>
                </div>

                <div className="space-y-2">
                  {msg.blockAction.options.map(opt => (
                    <button
                      key={opt.key}
                      onClick={() => onResolveBlockOption(msg.blockAction!.nodeId, opt.key)}
                      className={`w-full text-left p-2 rounded-xs transition-colors cursor-pointer border ${
                        msg.blockAction?.resolvedOption === opt.key
                          ? 'bg-emerald-500/20 border-emerald-500 text-emerald-200 font-bold'
                          : 'bg-[#120A0C] hover:bg-[#1E0F12] border-red-500/30 text-[#D4D4D4]'
                      }`}
                    >
                      <div className="font-bold text-[11px] text-white flex items-center justify-between">
                        <span>{opt.title}</span>
                        {msg.blockAction?.resolvedOption === opt.key && (
                          <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />
                        )}
                      </div>
                      <div className="text-[10px] text-[#A3A3A3] mt-0.5">{opt.description}</div>
                      <div className="text-[9px] text-cyan-400 mt-1">Result: {opt.impact}</div>
                    </button>
                  ))}
                </div>
              </div>
            )}

            {/* Evidence Quick Link */}
            {msg.evidenceRef && (
              <button
                onClick={() => onViewEvidence(msg.evidenceRef!.nodeId)}
                className="mt-2 flex items-center space-x-1.5 text-[10px] text-purple-300 bg-[#160E1E] hover:bg-[#20142B] px-2 py-1 rounded-xs border border-purple-500/30 transition-colors cursor-pointer"
              >
                <Eye className="w-3 h-3" />
                <span>View Evidence for {msg.evidenceRef.nodeId}</span>
              </button>
            )}
          </div>
        ))}
      </div>

      {/* Input Form */}
      <form onSubmit={handleSend} className="p-2.5 bg-[#0A0A0A] border-t border-[#262626]">
        <div className="relative">
          <input
            type="text"
            value={inputText}
            onChange={e => setInputText(e.target.value)}
            placeholder="Ask Copilot (e.g. why is DEV-044 blocked?)..."
            className="w-full bg-[#141414] border border-[#262626] focus:border-white rounded-sm pl-3 pr-8 py-2 text-xs text-white font-mono placeholder:text-[#525252] outline-none"
          />
          <button
            type="submit"
            disabled={!inputText.trim()}
            className="absolute right-1.5 top-1.5 p-1 bg-white hover:bg-neutral-200 disabled:opacity-20 text-black rounded-xs transition-colors cursor-pointer font-bold"
          >
            <Send className="w-3 h-3" />
          </button>
        </div>
      </form>
    </aside>
  );
};
