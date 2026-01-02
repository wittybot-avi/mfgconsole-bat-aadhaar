import React, { useEffect, useState } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { useAppStore } from '../lib/store';
import { ScreenId } from '../rbac/screenIds';
import { canView } from '../rbac/can';
import { Button } from './ui/design-system';
import { ShieldAlert, Loader2 } from 'lucide-react';

interface RouteGuardProps {
  screen: ScreenId;
  children: React.ReactNode;
}

const AccessDenied = ({ screen }: { screen: ScreenId }) => {
  const navigate = useNavigate();

  return (
    <div className="flex flex-col items-center justify-center h-[80vh] p-4 text-center">
      <div className="bg-red-50 dark:bg-red-900/20 p-4 rounded-full mb-6">
        <ShieldAlert className="h-12 w-12 text-red-500" />
      </div>
      <h1 className="text-3xl font-bold mb-2">Access Denied</h1>
      <p className="text-muted-foreground max-w-md mb-8">
        You do not have permission to view <span className="font-mono text-sm bg-slate-100 dark:bg-slate-800 px-1 rounded">{screen}</span>.
      </p>
      <div className="flex gap-4">
        <Button variant="outline" onClick={() => navigate('/')}>Back to Dashboard</Button>
        <Button onClick={() => navigate('/login')}>Switch Role</Button>
      </div>
    </div>
  );
};

/**
 * RouteGuard
 * Hardened for P-056A to prevent boot-time navigation during initial render.
 */
export const RouteGuard: React.FC<RouteGuardProps> = ({ screen, children }) => {
  const { currentCluster, isAuthenticated } = useAppStore();
  const [hydrated, setHydrated] = useState(false);
  const navigate = useNavigate();

  useEffect(() => {
    // 300ms hydration grace period to ensure store syncs from storage
    const timer = setTimeout(() => setHydrated(true), 300);
    
    if (hydrated && !isAuthenticated) {
        navigate('/login', { replace: true });
    }

    return () => clearTimeout(timer);
  }, [isAuthenticated, hydrated, navigate]);

  if (!hydrated) {
    return (
      <div className="flex flex-col items-center justify-center h-[60vh] gap-3">
        <Loader2 className="animate-spin text-primary opacity-20" size={32} />
        <span className="text-[10px] font-black uppercase text-slate-400 tracking-widest">Hydrating RBAC Node...</span>
      </div>
    );
  }

  // Final access check
  if (!currentCluster) return null; 

  const isAllowed = canView(currentCluster.id, screen);
  return isAllowed ? <>{children}</> : <AccessDenied screen={screen} />;
};