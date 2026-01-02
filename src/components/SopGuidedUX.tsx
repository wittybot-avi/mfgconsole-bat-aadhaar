
import React, { ReactNode } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAppStore } from '../lib/store';
import { Button, Badge, Card, CardContent, Tooltip } from './ui/design-system';
import { workflowGuardrails, STATUS_MAP, GuardrailResult, NextStep } from '../services/workflowGuardrails';
import { Lightbulb, ShieldCheck, Lock, ArrowRight, User, Info, Loader2 } from 'lucide-react';
import { logger } from '../utils/logger';

// --- StageHeader Component ---
interface StageHeaderProps {
  stageCode: string;
  title: string;
  objective: string;
  entityLabel: string;
  status: string;
  primaryAction?: { label: string; onClick: () => void; icon?: any };
  diagnostics?: { route: string; entityId: string };
}

export const StageHeader: React.FC<StageHeaderProps> = ({ 
  stageCode, title, objective, entityLabel, status, primaryAction, diagnostics 
}) => {
  const { currentRole } = useAppStore();
  const statusCfg = STATUS_MAP[status] || { label: status, variant: 'default' as const };

  return (
    <div 
      className="mb-8 p-6 bg-white dark:bg-slate-900 border-b border-slate-200 dark:border-slate-800 animate-in fade-in slide-in-from-top-2"
      data-diagnostic-stage={stageCode}
      data-diagnostic-id={diagnostics?.entityId}
    >
      <div className="max-w-7xl mx-auto flex flex-col md:flex-row justify-between items-start md:items-center gap-6">
        <div className="flex gap-4">
          <div className="h-14 w-14 rounded-xl bg-primary/10 flex flex-col items-center justify-center shrink-0 border border-primary/20">
            <span className="text-[10px] font-bold text-primary uppercase opacity-60">Stage</span>
            <span className="text-xl font-black text-primary leading-tight">{stageCode}</span>
          </div>
          <div className="space-y-1">
            <div className="flex items-center gap-3">
              <h1 className="text-2xl font-bold tracking-tight">{title}</h1>
              <Badge variant={statusCfg.variant} className="px-3 py-0.5 text-[10px] font-bold uppercase tracking-wider">
                {statusCfg.label}
              </Badge>
            </div>
            <p className="text-sm text-slate-500 dark:text-slate-400 font-medium">{objective}</p>
            <div className="flex items-center gap-4 mt-2">
               <div className="flex items-center gap-1.5 px-2 py-0.5 bg-slate-100 dark:bg-slate-800 rounded text-[10px] font-mono text-slate-600">
                  <Info size={10} /> {entityLabel}
               </div>
               <Badge variant="outline" className="flex items-center gap-1.5 border-dashed border-slate-300 py-0.5 px-2 h-auto text-[9px] uppercase tracking-tighter">
                  <User size={10} /> {currentRole?.name}
               </Badge>
            </div>
          </div>
        </div>
        
        {primaryAction && (
          <Button onClick={primaryAction.onClick} className="gap-2 px-6 h-12 shadow-lg shadow-primary/20">
            {primaryAction.icon && <primaryAction.icon size={18} />}
            {primaryAction.label}
            <ArrowRight size={16} />
          </Button>
        )}
      </div>
    </div>
  );
};

// --- NextStepsPanel Component ---
interface NextStepsPanelProps {
  entity: any;
  // Fix: Added 'LOT' and 'DISPATCH' to satisfy type checks in pages using these entity types
  type: 'SKU' | 'BATCH' | 'MODULE' | 'PACK' | 'BATTERY' | 'LOT' | 'DISPATCH';
  className?: string;
}

export const NextStepsPanel: React.FC<NextStepsPanelProps> = ({ entity, type, className }) => {
  const navigate = useNavigate();
  const step = workflowGuardrails.getNextRecommendedStep(entity, type);
  
  if (!step) return null;

  return (
    <Card className={`bg-indigo-50/50 dark:bg-indigo-950/20 border-indigo-200 dark:border-indigo-800/50 border-2 border-dashed shadow-none animate-in zoom-in-95 duration-300 ${className}`}>
      <CardContent className="p-5 flex items-start gap-4">
        <div className="p-2.5 bg-indigo-100 dark:bg-indigo-900/50 rounded-lg text-indigo-600 dark:text-indigo-400 ring-4 ring-indigo-50 dark:ring-indigo-950/50">
          <Lightbulb size={24} />
        </div>
        <div className="flex-1 space-y-1">
          <div className="flex items-center gap-2">
            <h4 className="text-sm font-bold text-indigo-900 dark:text-indigo-100">Next Recommended Action</h4>
            <Badge variant="secondary" className="text-[9px] uppercase tracking-wider bg-indigo-200/50 text-indigo-700 dark:bg-indigo-900/50 dark:text-indigo-300 h-4">{step.roleRequired}</Badge>
          </div>
          <p className="text-xs text-indigo-700/80 dark:text-indigo-300/60 leading-relaxed">{step.description}</p>
          {step.path && (
            <div className="pt-2">
              <Button 
                size="sm" 
                variant="link" 
                className="p-0 h-auto text-indigo-600 dark:text-indigo-400 font-bold gap-1.5 hover:gap-2 transition-all"
                onClick={() => navigate(step.path)}
              >
                Go to {step.label} <ArrowRight size={14} />
              </Button>
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
};

// --- ActionGuard Component ---
interface ActionGuardProps {
  guard: GuardrailResult;
  onClick: () => void;
  label: string;
  icon?: any;
  variant?: any;
  size?: any;
  className?: string;
  loading?: boolean;
  actionName: string;
  entityId: string;
}

export const ActionGuard: React.FC<ActionGuardProps> = ({ 
  guard, onClick, label, icon: Icon, variant, size, className, loading, actionName, entityId 
}) => {
  const { theme } = useAppStore();

  const handleAction = () => {
    if (guard.allowed) {
      logger.info(`Action Executed: ${actionName}`, { entityId, status: 'Success' });
      onClick();
    } else {
      logger.warn(`Action Blocked: ${actionName}`, { entityId, reason: guard.reason });
    }
  };

  const btn = (
    <Button 
      variant={variant} 
      size={size}
      className={`${className} group relative overflow-hidden`} 
      onClick={handleAction} 
      disabled={!guard.allowed || loading}
      data-sop-action={actionName}
    >
      {loading ? <Loader2 size={16} className="animate-spin mr-2" /> : Icon && <Icon className="mr-2 h-4 w-4" />}
      {label}
      {!guard.allowed && <Lock className="ml-2 h-3 w-3 opacity-40 group-hover:scale-110 transition-transform" />}
      {guard.allowed && !loading && (
        <div className="absolute inset-0 bg-white/10 translate-y-full group-hover:translate-y-0 transition-transform pointer-events-none" />
      )}
    </Button>
  );

  if (!guard.allowed && guard.reason) {
    return (
      <Tooltip content={`Blocked: ${guard.reason}`}>
        <div className="w-full flex-1 cursor-not-allowed">
          {btn}
        </div>
      </Tooltip>
    );
  }

  return btn;
};
