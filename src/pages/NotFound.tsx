import React, { useEffect, useState } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { Button, Card, CardContent } from '../components/ui/design-system';
import { Home, Compass, Map, Loader2, Info, ArrowRight } from 'lucide-react';
import { routerSafe } from '../utils/routerSafe';

/**
 * Safe Navigation Fallback
 * Renders within the Layout shell to maintain UI stability.
 * Patch PP-056B: Smart recovery suggestions.
 */
export default function NotFound() {
  const navigate = useNavigate();
  const location = useLocation();
  const [suggestion, setSuggestion] = useState<{ label: string, path: string } | null>(null);

  useEffect(() => {
    // Detect legacy patterns for smart suggestions
    const path = location.pathname.toLowerCase();
    if (path.includes('batch')) setSuggestion({ label: 'Manufacturing Batches', path: '/operate/batches' });
    else if (path.includes('inventory')) setSuggestion({ label: 'Inventory Console', path: '/inventory' });
    else if (path.includes('dispatch')) setSuggestion({ label: 'Dispatch Queue', path: '/dispatch' });
    else if (path.includes('battery')) setSuggestion({ label: 'Battery Trace', path: '/operate/batteries' });
    else if (path.includes('sku')) setSuggestion({ label: 'SKU Studio', path: '/sku' });

    // Auto-recovery: redirect to last good route after 4.5s (extended to allow user to read suggestion)
    const timer = setTimeout(() => {
      if (!suggestion) {
        const safePath = routerSafe.getLastGoodRoute();
        navigate(safePath, { replace: true });
      }
    }, 4500);

    return () => clearTimeout(timer);
  }, [navigate, location, suggestion]);

  const handleGoHome = () => {
    navigate('/', { replace: true });
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
        The route <code className="bg-slate-100 dark:bg-slate-800 px-1.5 py-0.5 rounded font-mono text-rose-500">{location.pathname}</code> is not registered in the system ledger.
      </p>

      <div className="flex flex-col gap-4 w-full max-w-sm">
        {suggestion && (
          <Card className="border-indigo-200 bg-indigo-50 dark:bg-indigo-950/30 dark:border-indigo-900 border-2">
            <CardContent className="p-4 flex flex-col gap-3 text-left">
              <div className="flex items-center gap-2 text-indigo-600 dark:text-indigo-400">
                <Info size={16} />
                <p className="text-[10px] font-black uppercase tracking-widest leading-none">Smart Recovery Hint</p>
              </div>
              <p className="text-xs font-medium">It looks like you're trying to access a legacy or malformed record path. Try returning to the main list:</p>
              <Button size="sm" onClick={() => navigate(suggestion.path)} className="bg-indigo-600 hover:bg-indigo-700 h-8 gap-2">
                Open {suggestion.label} <ArrowRight size={14} />
              </Button>
            </CardContent>
          </Card>
        )}

        {!suggestion && (
          <Card className="border-dashed border-slate-200 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-900/50">
            <CardContent className="p-4 flex items-center gap-3 text-left">
              <Loader2 className="text-primary h-5 w-5 animate-spin shrink-0" />
              <div className="space-y-0.5">
                <p className="text-[10px] font-black uppercase text-slate-400 tracking-wider">Router Safety Check</p>
                <p className="text-xs text-slate-600 dark:text-slate-400">Verifying safe return vector...</p>
              </div>
            </CardContent>
          </Card>
        )}

        <Button className="w-full gap-2 h-11 shadow-lg" onClick={handleGoHome}>
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