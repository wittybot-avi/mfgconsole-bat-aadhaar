import React, { useEffect, useState } from 'react';
import { useLocation, Link, Outlet, useNavigate } from 'react-router-dom';
import { 
  Menu, Bell, Search, Users, LogOut, Zap, AlertTriangle, X, Database, Monitor, Tag
} from 'lucide-react';
import { useAppStore } from '../src/lib/store';
import { Button, Input, Badge } from './ui/design-system';
import { APP_VERSION, CURRENT_PATCH } from '../app/patchInfo';
import { ScreenId, SCREEN_GROUPS } from '../src/rbac/screenIds';
import { canView } from '../src/rbac/can';
import { APP_ROUTES, isRouteRegistered } from '../app/routeRegistry';
import { ROUTES } from '../app/routes';
import { DIAGNOSTIC_MODE } from '../src/app/diagnostics';
import { traceSearchService } from '../src/services/traceSearchService';
import { scenarioStore, DemoScenario } from '../src/demo/scenarioStore';
import { routerSafe } from '../src/utils/routerSafe';

/**
 * CONSOLIDATED DIAGNOSTIC HUD
 * Standardized in P-055. Default OFF. 
 * Toggle via ?hud=1 or localStorage HUD_ENABLED=1
 */
const DiagnosticHUD = () => {
  const location = useLocation();
  const registered = isRouteRegistered(location.pathname);
  
  const [enabled, setEnabled] = useState(() => 
    localStorage.getItem('HUD_ENABLED') === '1' || window.location.search.includes('hud=1')
  );

  if (!enabled || !DIAGNOSTIC_MODE) return null;

  return (
    <div className="fixed bottom-4 right-4 z-[9999] pointer-events-none flex flex-col items-end gap-1">
      <div className="bg-slate-900/95 text-white px-3 py-2 rounded-lg border border-slate-700 font-mono text-[10px] shadow-2xl backdrop-blur-md flex items-center gap-3">
        <div className="flex items-center gap-1.5 text-blue-400">
          <Monitor size={12} />
          <span className="font-bold uppercase">Console HUD</span>
        </div>
        <span className="opacity-30">|</span>
        <div className="flex items-center gap-1">
          <Tag size={10} className="text-amber-400" />
          <span className="font-bold">{CURRENT_PATCH.id}</span>
        </div>
        <span className="opacity-30">|</span>
        <div className="flex items-center gap-1 max-w-[200px] truncate">
          <span className="text-slate-400">PATH:</span>
          <span>{location.pathname}</span>
        </div>
        <span className="opacity-30">|</span>
        <div className="flex items-center gap-1">
          <span className="text-slate-400">REG:</span>
          <span className={registered ? 'text-emerald-400 font-bold' : 'text-rose-400 font-bold'}>
            {registered ? 'TRUE' : 'FALSE'}
          </span>
        </div>
        <button 
          className="pointer-events-auto ml-2 opacity-50 hover:opacity-100" 
          onClick={() => { setEnabled(false); localStorage.setItem('HUD_ENABLED', '0'); }}
        >
          <X size={10} />
        </button>
      </div>
    </div>
  );
};

interface SidebarItemProps {
  icon: any;
  label: string;
  path: string;
  active: boolean;
  disabled?: boolean;
}

const SidebarItem: React.FC<SidebarItemProps> = ({ icon: Icon, label, path, active, disabled }) => {
  const content = (
    <div className={`flex items-center justify-between px-3 py-2 rounded-md transition-all ${disabled ? 'opacity-40 cursor-not-allowed bg-slate-50 dark:bg-slate-800/30' : active ? 'bg-primary/10 text-primary font-medium' : 'text-slate-500 hover:bg-slate-100 hover:text-slate-900 dark:text-slate-400 dark:hover:bg-slate-800'}`}>
      <div className="flex items-center gap-3">
        <Icon size={18} />
        <span className="text-sm">{label}</span>
      </div>
    </div>
  );
  if (disabled) return <div title="Access Restricted">{content}</div>;
  return <Link to={path}>{content}</Link>;
};

export const Layout = () => {
  const { theme, toggleTheme, currentRole, currentCluster, logout, sidebarOpen, toggleSidebar, addNotification } = useAppStore();
  const location = useLocation();
  const navigate = useNavigate();
  const [searchQuery, setSearchQuery] = useState('');
  const [searching, setSearching] = useState(false);
  const [showNoMatch, setShowNoMatch] = useState(false);
  const [currentScenario, setCurrentScenario] = useState<DemoScenario>(scenarioStore.getScenario());
  const [isSwitching, setIsSwitching] = useState(false);

  useEffect(() => {
    scenarioStore.init();
    routerSafe.trackRoute(location.pathname, location.search);
  }, [location]);

  const handleLogout = () => {
    logout();
    navigate(ROUTES.LOGIN);
  };

  const handleGlobalSearch = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!searchQuery.trim() || searching) return;
    setSearching(true);
    setShowNoMatch(false);
    try {
        const resolution = await traceSearchService.resolveIdentifier(searchQuery);
        if (resolution) {
            navigate(resolution.route);
            setSearchQuery('');
        } else {
            setShowNoMatch(true);
        }
    } catch (err) {
        console.error("Search failed:", err);
    } finally {
        setSearching(false);
    }
  };

  const renderNavGroup = (groupName: string, screenIds: ScreenId[]) => {
    if (!currentCluster) return null;
    const visibleItems = screenIds.filter(id => canView(currentCluster.id, id));
    if (visibleItems.length === 0) return null;

    return (
      <div className="mb-6">
        <h3 className="px-3 mb-2 text-xs font-semibold text-slate-400 uppercase tracking-wider">{groupName}</h3>
        <div className="space-y-1">
          {visibleItems.map(id => {
            const config = APP_ROUTES[id];
            if (!config) return null;
            if (id.includes('DETAIL') || id.includes('EDIT') || id.includes('_RUN') || id.includes('_TAB')) return null;
            const displayPath = config.path.includes(':') ? config.path.split('/:')[0] : config.path;
            return (
              <SidebarItem 
                key={id}
                icon={config.icon} 
                label={config.label} 
                path={displayPath} 
                active={location.pathname === displayPath || (location.pathname.startsWith(displayPath) && displayPath !== '/')}
              />
            );
          })}
        </div>
      </div>
    );
  };

  if (!currentRole || !currentCluster) return null;
  const isSuperUser = currentCluster.id === 'CS';

  return (
    <div className={`min-h-screen bg-slate-50 dark:bg-slate-950 flex font-sans text-slate-900 dark:text-slate-100`}>
      <aside className={`${sidebarOpen ? 'w-64' : 'w-0'} fixed inset-y-0 z-50 flex flex-col transition-all duration-300 border-r bg-white dark:bg-slate-900 dark:border-slate-800 overflow-hidden`}>
        <div className="h-16 flex items-center px-6 border-b dark:border-slate-800 shrink-0">
          <div className={`h-8 w-8 rounded mr-3 flex items-center justify-center text-white font-bold ${isSuperUser ? 'bg-amber-500' : 'bg-primary'}`}>
            {isSuperUser ? <Zap size={18} fill="currentColor" /> : 'A'}
          </div>
          <span className="font-bold text-lg tracking-tight">Aayatana Tech</span>
        </div>

        <div className="flex-1 overflow-y-auto py-6 px-3">
          {/* Fix: Realigned navigation groups to match the updated ScreenId taxonomy defined in PP-058. Consolidated GUIDED, RESOLVE, and GOVERN into Control Tower, and correctly referenced functional sub-groups for Operate and Assurance. */}
          {renderNavGroup('Control Tower', SCREEN_GROUPS.CONTROL_TOWER)}
          {renderNavGroup('Observe', SCREEN_GROUPS.OBSERVE)}
          {renderNavGroup('Design', SCREEN_GROUPS.DESIGN)}
          {renderNavGroup('Trace', SCREEN_GROUPS.TRACE)}
          {renderNavGroup('Assembly', SCREEN_GROUPS.OPERATE_ASSEMBLY)}
          {renderNavGroup('Supply Chain', SCREEN_GROUPS.OPERATE_SCM)}
          {renderNavGroup('Assurance', SCREEN_GROUPS.OPERATE_ASSURE)}
          {renderNavGroup('Admin', SCREEN_GROUPS.ADMIN)}
        </div>

        <div className="p-4 border-t dark:border-slate-800 shrink-0">
          <div className="flex items-center gap-3 mb-3">
            <div className={`h-9 w-9 rounded-full flex items-center justify-center text-slate-500 ${isSuperUser ? 'bg-amber-100 dark:bg-amber-900/30 text-amber-600' : 'bg-slate-200 dark:bg-slate-700'}`}>
              <Users size={16} />
            </div>
            <div className="flex flex-col overflow-hidden">
              <span className="text-sm font-medium truncate" title={currentRole.name}>{currentRole.name}</span>
              <span className="text-xs text-slate-500 truncate">{currentCluster.id} Cluster</span>
            </div>
          </div>
          <div className="text-[10px] text-slate-400 dark:text-slate-600 font-mono leading-tight">
            v{APP_VERSION} | P{CURRENT_PATCH.id}<br/>
            {CURRENT_PATCH.name}
          </div>
        </div>
      </aside>

      <div className={`flex-1 flex flex-col transition-all duration-300 ${sidebarOpen ? 'pl-64' : 'pl-0'}`}>
        <header className="h-16 border-b bg-white dark:bg-slate-900 dark:border-slate-800 sticky top-0 z-40 px-6 flex items-center justify-between">
          <div className="flex items-center gap-4">
            <Button variant="ghost" size="icon" onClick={toggleSidebar}><Menu size={20} /></Button>
            <form onSubmit={handleGlobalSearch} className="relative hidden md:block w-72 lg:w-96">
              <Search className={`absolute left-2.5 top-2.5 h-4 w-4 ${searching ? 'text-primary animate-pulse' : 'text-muted-foreground'}`} />
              <Input 
                type="search" 
                placeholder="Global Search (Asset IDs, Serials)..." 
                className="pl-9 bg-slate-100 dark:bg-slate-800 border-none h-10" 
                value={searchQuery}
                onChange={e => { setSearchQuery(e.target.value); if (showNoMatch) setShowNoMatch(false); }}
              />
            </form>
          </div>

          <div className="flex items-center gap-3">
            <div className="flex items-center border rounded-md p-1 bg-slate-100 dark:bg-slate-800">
              <button onClick={toggleTheme} className="px-2 py-1 text-xs rounded shadow-sm bg-white dark:bg-slate-700 font-medium transition-all">
                {theme === 'light' ? 'Light' : 'Dark'}
              </button>
            </div>
            <Button variant="ghost" size="icon" onClick={handleLogout} title="Logout" className="text-rose-500">
              <LogOut className="h-4 w-4" />
            </Button>
          </div>
        </header>

        <main className="flex-1 p-6 overflow-auto">
          <Outlet />
        </main>
      </div>
      <DiagnosticHUD />
    </div>
  );
};
