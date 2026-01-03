import React, { useState } from 'react';
import { Tag, Monitor, ChevronUp, ChevronDown, Clock, GitBranch, History } from 'lucide-react';
import { buildMeta } from '../app/buildMeta';

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
  const [isRevisionsOpen, setIsRevisionsOpen] = useState(false);

  return (
    <div className="fixed bottom-4 right-4 z-[9999] pointer-events-auto flex flex-col items-end gap-2">
      {/* Revisions Panel */}
      {isRevisionsOpen && (
        <div className="bg-slate-900 border border-slate-700 rounded-lg shadow-2xl overflow-hidden w-[350px] animate-in slide-in-from-bottom-2">
          <div className="bg-slate-800 px-3 py-2 border-b border-slate-700 flex justify-between items-center">
            <div className="flex items-center gap-2">
              <History size={12} className="text-indigo-400" />
              <span className="text-[10px] font-black text-white uppercase tracking-widest">Revision History</span>
            </div>
            <button onClick={() => setIsRevisionsOpen(false)} className="text-slate-400 hover:text-white transition-colors">
              <ChevronDown size={14} />
            </button>
          </div>
          <div className="max-h-[300px] overflow-y-auto p-4 space-y-4 font-mono text-[10px]">
            {/* Current Patch */}
            <div className="border-b border-indigo-500/30 pb-3">
              <div className="flex justify-between items-center mb-1">
                <span className="text-indigo-400 font-black">CURRENT</span>
                <span className="text-slate-500">{buildMeta.updatedAt}</span>
              </div>
              <p className="text-white font-bold mb-1">{buildMeta.patchId} — {buildMeta.patchName}</p>
              <ul className="space-y-1">
                {buildMeta.changeNotes.map((note, i) => (
                  <li key={i} className="text-slate-400 flex items-start gap-1.5 leading-relaxed">
                    <span className="text-indigo-500 mt-1 shrink-0">•</span> {note}
                  </li>
                ))}
              </ul>
            </div>
            {/* History List */}
            <div className="space-y-2">
              <p className="text-slate-500 font-bold uppercase tracking-tighter mb-2">Previous Patches</p>
              {buildMeta.history.slice(1).map((h, i) => (
                <div key={i} className="flex justify-between items-start border-b border-slate-800 pb-2 last:border-0 opacity-60 hover:opacity-100 transition-opacity">
                  <div className="space-y-0.5">
                    <p className="text-slate-300 font-bold">{h.patchId}</p>
                    <p className="text-slate-500 text-[9px]">{h.patchName}</p>
                  </div>
                  <span className="text-slate-600 text-[9px]">{h.updatedAt}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* Main Hud Pill */}
      <div className="flex flex-col items-end gap-1 pointer-events-none">
        <div 
          onClick={onToggle}
          className="pointer-events-auto cursor-pointer group bg-slate-900/95 hover:bg-slate-800 text-white px-3 py-1.5 rounded-full border border-slate-700 font-mono text-[10px] shadow-2xl backdrop-blur-md flex items-center gap-3 transition-all"
        >
          <div className="flex items-center gap-1.5 text-blue-400">
            <Monitor size={12} className={isDiagParamActive ? 'animate-pulse' : ''} />
            <span className="font-bold uppercase tracking-tighter">HUD</span>
          </div>
          <span className="opacity-30">|</span>
          <div 
            onClick={(e) => { e.stopPropagation(); setIsRevisionsOpen(!isRevisionsOpen); }}
            className="flex items-center gap-1.5 text-indigo-400 hover:text-indigo-300 transition-colors"
            title={`Revision: ${buildMeta.patchName} (${buildMeta.updatedAt})`}
          >
            <GitBranch size={10} />
            <span className="font-bold">BUILD {buildMeta.appVersion} | {buildMeta.patchId}</span>
            {isRevisionsOpen ? <ChevronDown size={10} /> : <ChevronUp size={10} />}
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
            <span className="text-slate-400">SCR:</span>
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
    </div>
  );
};