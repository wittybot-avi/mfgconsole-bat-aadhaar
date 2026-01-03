import React from 'react';
import { Monitor, Database, Shield, ChevronUp, Tag, Compass, CheckCircle, AlertTriangle } from 'lucide-react';
import { Badge } from './ui/design-system';
import { navValidator } from '../app/navValidation';
import { navIntegrity } from '../app/navigationIntegrity';

interface UnifiedDiagnosticPanelProps {
  isOpen: boolean;
  onToggle: () => void;
  screenId: string;
  path: string;
  routePattern: string;
  componentName: string;
  role: string;
  cluster: string;
  permissions: string[];
  isRegistered: boolean;
  patchId: string;
  scenario: string;
}

export const UnifiedDiagnosticPanel: React.FC<UnifiedDiagnosticPanelProps> = ({
  isOpen,
  onToggle,
  screenId,
  path,
  routePattern,
  componentName,
  role,
  cluster,
  permissions,
  isRegistered,
  patchId,
  scenario,
}) => {
  if (!isOpen) return null;

  const navWarnings = navValidator.getWarnings();
  const integrityWarnings = navIntegrity.getWarnings();

  return (
    <div className="bg-slate-900 border-b border-slate-700 text-white font-mono text-[10px] overflow-hidden shrink-0 z-[100] animate-in slide-in-from-top duration-200">
      <div 
        className="px-6 py-2 flex items-center justify-between cursor-pointer hover:bg-slate-800 transition-colors border-b border-slate-800"
        onClick={onToggle}
      >
        <div className="flex items-center gap-4">
          <div className="flex items-center gap-1.5 text-blue-400">
            <Monitor size={12} />
            <span className="font-bold uppercase tracking-widest">Diagnostic Mode</span>
          </div>
          <span className="opacity-30">|</span>
          <span className="text-slate-300 font-bold">{componentName || screenId || 'UNKNOWN'}</span>
        </div>
        <div className="flex items-center gap-3">
          {(navWarnings.length > 0 || integrityWarnings.length > 0) && (
            <Badge variant="warning" className="h-4 text-[8px] font-black uppercase">
              {navWarnings.length + integrityWarnings.length} Integrity Warn
            </Badge>
          )}
          {!isRegistered && <Badge variant="destructive" className="h-4 text-[8px] font-black uppercase">Unregistered</Badge>}
          <ChevronUp size={14} className="text-slate-500" />
        </div>
      </div>

      <div className="p-6 grid grid-cols-1 md:grid-cols-3 gap-8 bg-slate-950/50">
        {/* Column 1: Identity */}
        <div className="space-y-3">
          <h4 className="font-black text-slate-500 uppercase tracking-tighter flex items-center gap-2 border-b border-slate-800 pb-1">
            <Tag size={10} className="text-amber-400" /> Identity
          </h4>
          <div className="space-y-1.5">
            <p className="flex justify-between"><span className="text-slate-500">ScreenId:</span> <span className={screenId !== 'UNKNOWN' ? 'text-emerald-400 font-bold' : 'text-rose-400'}>{screenId}</span></p>
            <p className="flex justify-between"><span className="text-slate-500">Path:</span> <span className="text-blue-400">{path}</span></p>
            <p className="flex justify-between"><span className="text-slate-500">Pattern:</span> <span className="text-slate-400 italic">{routePattern}</span></p>
            <p className="flex justify-between"><span className="text-slate-500">Reg:</span> <span className={isRegistered ? 'text-emerald-400' : 'text-rose-400'}>{isRegistered ? 'TRUE' : 'FALSE'}</span></p>
          </div>
        </div>

        {/* Column 2: Nav Integrity */}
        <div className="space-y-3">
          <h4 className="font-black text-slate-500 uppercase tracking-tighter flex items-center gap-2 border-b border-slate-800 pb-1">
            <Compass size={10} className="text-blue-400" /> Nav Integrity
          </h4>
          <div className="space-y-2 max-h-[150px] overflow-y-auto pr-2">
            {integrityWarnings.length === 0 && navWarnings.length === 0 ? (
                <p className="text-emerald-500 flex items-center gap-2"><CheckCircle size={10}/> All nav items matched.</p>
            ) : (
                <>
                    {integrityWarnings.map((w, i) => (
                        <div key={i} className="text-[8px] text-rose-300 border-l-2 border-rose-500 pl-2 py-0.5">
                            <span className="font-black uppercase block">{w.type}</span>
                            <span>{w.label}: {w.detail}</span>
                        </div>
                    ))}
                    {navWarnings.map((w, i) => (
                        <div key={`v-${i}`} className="text-[8px] text-amber-300 border-l-2 border-amber-500 pl-2 py-0.5">
                            <span className="font-black uppercase block">DRIFT</span>
                            <span>{w.label}: {w.path}</span>
                        </div>
                    ))}
                </>
            )}
          </div>
        </div>

        {/* Column 3: Data Source */}
        <div className="space-y-3">
          <h4 className="font-black text-slate-500 uppercase tracking-tighter flex items-center gap-2 border-b border-slate-800 pb-1">
            <Database size={10} className="text-emerald-400" /> Data Source
          </h4>
          <div className="space-y-1.5">
            <p className="flex justify-between"><span className="text-slate-500">Scenario:</span> <span className="text-indigo-400 font-bold">{scenario}</span></p>
            <p className="flex justify-between"><span className="text-slate-500">Role:</span> <span className="text-slate-300">{role}</span></p>
            <p className="flex justify-between"><span className="text-slate-500">Cluster:</span> <span className="text-amber-400">{cluster}</span></p>
            <p className="flex justify-between"><span className="text-slate-500">Patch:</span> <span className="text-amber-400">{patchId}</span></p>
          </div>
        </div>
      </div>
      
      <div className="px-6 py-1.5 bg-slate-900 border-t border-slate-800 flex justify-end">
        <div className="flex items-center gap-2 text-rose-500/50">
          <AlertTriangle size={10} />
          <span className="text-[8px] uppercase font-bold">Runtime Environment Mock</span>
        </div>
      </div>
    </div>
  );
};