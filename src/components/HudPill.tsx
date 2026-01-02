import React from 'react';
import { Tag, Monitor, X } from 'lucide-react';

interface HudPillProps {
  onToggle: () => void;
  patchId: string;
  path: string;
  isRegistered: boolean;
  screenId: string;
  isDiagParamActive: boolean;
}

export const HudPill: React.FC<HudPillProps> = ({
  onToggle,
  patchId,
  path,
  isRegistered,
  screenId,
  isDiagParamActive,
}) => {
  return (
    <div className="fixed bottom-4 right-4 z-[9999] pointer-events-none flex flex-col items-end gap-1">
      <div 
        onClick={onToggle}
        className="pointer-events-auto cursor-pointer group bg-slate-900/95 hover:bg-slate-800 text-white px-3 py-1.5 rounded-full border border-slate-700 font-mono text-[10px] shadow-2xl backdrop-blur-md flex items-center gap-3 transition-all"
      >
        <div className="flex items-center gap-1.5 text-blue-400">
          <Monitor size={12} className={isDiagParamActive ? 'animate-pulse' : ''} />
          <span className="font-bold uppercase">HUD</span>
        </div>
        <span className="opacity-30">|</span>
        <div className="flex items-center gap-1">
          <span className="font-bold text-amber-400">{patchId}</span>
        </div>
        <span className="opacity-30">|</span>
        <div className="flex items-center gap-1 max-w-[150px] truncate">
          <span className="text-slate-400">PATH:</span>
          <span>{path}</span>
        </div>
        <span className="opacity-30">|</span>
        <div className="flex items-center gap-1">
          <span className="text-slate-400">REG:</span>
          <span className={isRegistered ? 'text-emerald-400 font-bold' : 'text-rose-400 font-bold'}>
            {isRegistered ? 'TRUE' : 'FALSE'}
          </span>
        </div>
        <span className="opacity-30">|</span>
        <div className="flex items-center gap-1 max-w-[100px] truncate">
          <span className="text-slate-400">SCREEN:</span>
          <span className="text-indigo-400 font-bold">{screenId}</span>
        </div>
        {isDiagParamActive && (
          <>
            <span className="opacity-30">|</span>
            <span className="text-[8px] font-black text-emerald-500 uppercase tracking-tighter">Diag On</span>
          </>
        )}
      </div>
    </div>
  );
};