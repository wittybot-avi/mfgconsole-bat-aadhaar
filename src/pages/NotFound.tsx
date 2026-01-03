import React, { useEffect, useState } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { Button, Card, CardContent } from '../components/ui/design-system';
import { Home, Compass, Map, Loader2, Info, ArrowRight } from 'lucide-react';
import { routerSafe } from '../utils/routerSafe';
import { resolvePath } from '../app/navAliases';
import { navigateCanonical } from '../app/navigation';
import { ScreenId } from '../rbac/screenIds';

/**
 * Unknown Coordinates (PP-061B)
 * Self-healing view that detours to canonical ScreenIds instead of raw strings.
 */
export default function NotFound() {
  const navigate = useNavigate();
  const location = useLocation();
  const [detour, setDetour] = useState<{ label: string, screenId: ScreenId } | null>(null);

  useEffect(() => {
    // Attempt to infer intent from legacy path
    const path = location.pathname.toLowerCase();
    
    if (path.includes('sku')) {
      setDetour({ label: 'SKU Design Studio', screenId: ScreenId.SKU_LIST });
    } else if (path.includes('batch')) {
      setDetour({ label: 'Manufacturing Batches', screenId: ScreenId.BATCHES_LIST });
    } else if (path.includes('inventory')) {
      setDetour({ label: 'Inventory Console', screenId: ScreenId.INVENTORY });
    } else if (path.includes('dispatch')) {
      setDetour({ label: 'Dispatch Center', screenId: ScreenId.DISPATCH_LIST });
    } else if (path.includes('eol')) {
      setDetour({ label: 'EOL Testing Hub', screenId: ScreenId.EOL_QA_QUEUE });
    } else if (path.includes('provisioning')) {
      setDetour({ label: 'Provisioning Queue', screenId: ScreenId.PROVISIONING_QUEUE });
    } else if (path.includes('runbook')) {
      setDetour({ label: 'Runbook Hub', screenId: ScreenId.RUNBOOK_HUB });
    } else if (path.includes('trace') || path.includes('lot') || path.includes('cell')) {
      setDetour({ label: 'Traceability Log', screenId: ScreenId.CELL_LOTS_LIST });
    }

    // Auto-recovery Detour after 5s if possible
    const timer = setTimeout(() => {
      const resolved = resolvePath(location.pathname);
      if (resolved !== location.pathname) {
        navigate(resolved, { replace: true });
      }
    }, 5000);

    return () => clearTimeout(timer);
  }, [location.pathname, navigate]);

  const handleDetour = () => {
    if (detour) {
      navigateCanonical(navigate, detour.screenId);
    } else {
      navigate('/', { replace: true });
    }
  };

  return (
    <div className="min-h-[60vh] flex flex-col items-center justify-center p-6 text-center animate-in fade-in duration-500">
      <div className="relative mb-8">
        <div className="absolute inset-0 bg-rose-500/10 blur-3xl rounded-full scale-150 animate-pulse" />
        <div className="relative h-24 w-24 bg-white dark:bg-slate-900 rounded-full flex items-center justify-center border-4 border-rose-500 shadow-xl">
          <Compass size={48} className="text-rose-500 animate-spin-slow" />
        </div>
      </div>

      <h1 className="text-3xl font-black tracking-tight text-slate-900 dark:text-white mb-2">
        Unknown Coordinates
      </h1>
      
      <p className="text-sm text-slate-500 dark:text-slate-400 max-w-md mx-auto mb-8 leading-relaxed">
        The route <code className="bg-slate-100 dark:bg-slate-800 px-1.5 py-0.5 rounded font-mono text-rose-500">{location.pathname}</code> is not in the system registry.
      </p>

      <div className="flex flex-col gap-4 w-full max-w-sm">
        {detour && (
          <Card className="border-indigo-200 bg-indigo-50 dark:bg-indigo-950/30 dark:border-indigo-900 border-2">
            <CardContent className="p-4 flex flex-col gap-3 text-left">
              <div className="flex items-center gap-2 text-indigo-600 dark:text-indigo-400">
                <Info size={16} />
                <p className="text-[10px] font-black uppercase tracking-widest leading-none">Self-Healing Detour</p>
              </div>
              <p className="text-xs font-medium">It looks like you're trying to reach a workstation. We recommend this workstation:</p>
              <Button size="sm" onClick={handleDetour} className="bg-indigo-600 hover:bg-indigo-700 h-8 gap-2">
                Open {detour.label} <ArrowRight size={14} />
              </Button>
            </CardContent>
          </Card>
        )}

        {!detour && (
          <Card className="border-dashed border-slate-200 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-900/50">
            <CardContent className="p-4 flex items-center gap-3 text-left">
              <Loader2 className="text-primary h-5 w-5 animate-spin shrink-0" />
              <div className="space-y-0.5">
                <p className="text-[10px] font-black uppercase text-slate-400 tracking-wider">Safety Sweep</p>
                <p className="text-xs text-slate-600 dark:text-slate-400">Checking registry for nearest canonical coordinate...</p>
              </div>
            </CardContent>
          </Card>
        )}

        <Button className="w-full gap-2 h-11 shadow-lg" onClick={() => navigate('/', { replace: true })}>
          <Home size={18} /> Return to Dashboard
        </Button>
      </div>

      <style dangerouslySetInnerHTML={{ __html: `
        @keyframes spin-slow {
          from { transform: rotate(0deg); }
          to { transform: rotate(360deg); }
        }
        .animate-spin-slow {
          animation: spin-slow 12s linear infinite;
        }
      `}} />
    </div>
  );
}