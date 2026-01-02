import React, { useEffect, useState } from 'react';
import { useLocation, Link, Outlet, useNavigate } from 'react-router-dom';
import { 
  Menu, Bell, Search, Users, LogOut, Zap, AlertTriangle, X, Database, Monitor, Tag, ChevronDown, ChevronUp, Shield
} from 'lucide-react';
import { useAppStore } from '../lib/store';
import { Button, Input, Badge } from './ui/design-system';
import { APP_VERSION, CURRENT_PATCH } from '../../app/patchInfo';
import { ScreenId, SCREEN_GROUPS } from '../rbac/screenIds';
import { canView, getMyPermissions } from '../rbac/can';
import { APP_ROUTES, getScreenIdForPath } from '../../app/routeRegistry';
import { ROUTES } from '../../app/routes';
import { DIAGNOSTIC_MODE } from '../app/diagnostics';
import { traceSearchService } from '../services/traceSearchService';
import { scenarioStore, DemoScenario } from '../demo/scenarioStore';
import { routerSafe } from '../utils/routerSafe';

/**
 * UNIFIED DIAGNOSTIC PANEL (P-056F Stabilization)
 * Single source of truth for debug info at top of page.
 * Enabled via ?diag=1 in URL or storage.
 */
const UnifiedDiagnosticPanel = () => {
  const location = useLocation();
  const screenId = getScreenIdForPath(location?.pathname);
  const { currentRole, currentCluster } = useAppStore();
  const [collapsed, setCollapsed] = useState(true);
  
  const [enabled] = useState(() => 
    DIAGNOSTIC_MODE && (
      window?.location?.search?.includes('diag=1') || 
      location?.search?.includes('diag=1') ||
      localStorage?.getItem('DIAG_ENABLED') === '1'
    )
  );

  if (!enabled) return null;

  const permissions = screenId ? getMyPermissions(currentCluster?.id || '', screenId) : [];
  const routeConfig = screenId ? APP_ROUTES?.[screenId] : null;

  return (
    <div className="bg-slate-900 border-b border-slate-700 text-white font-mono text-[10px] overflow-hidden shrink-0 z-[60]">
      <div 
        className="px-6 py-2 flex items-center justify-between cursor-pointer hover:bg-slate-800 transition-colors"
        onClick={() => setCollapsed(!collapsed)}
      >
        <div className="flex items-center gap-4">
          <div className="flex items-center gap-1.5 text-blue-400">
            <Monitor size={12} />
            <span className="font-bold uppercase tracking-widest">Diagnostic Ledger</span>
          </div>
          <span className="opacity-30">|</span>
          <div className="flex items-center gap-1">
             <Tag size={10} className="text-amber-400" />
             <span className="font-bold">{CURRENT_PATCH?.id || 'P-000'}</span>
          </div>
          <span className="opacity-30">|</span>
          <div className="flex items-center gap-1">
             <span className="text-slate-500 uppercase">Screen:</span>
             <span className={screenId ? 'text-emerald-400 font-bold' : 'text-rose-400 font-bold'}>
                {screenId || 'UNMAPPED'}
             </span>
          </div>
        </div>
        <div className="flex items-center gap-2">
            {!screenId && <Badge variant="destructive" className="h-4 text-[8px] font-black uppercase">Unregistered</Badge>}
            {collapsed ? <ChevronDown size={14} /> : <ChevronUp size={14} />}
        </div>
      </div>

      {!collapsed && (
        <div className="p-6 grid grid-cols-1 md:grid-cols-4 gap-8 bg-slate-950/50 border-t border-slate-800 animate-in slide-in-from-top-1 duration-300">
            <div className="space-y-2">
                <h4 className="font-black text-slate-500 uppercase tracking-tighter flex items-center gap-2 border-b border-slate-800 pb-1"><Database size={10}/> Identity</h4>
                <div className="space-y-1">
                    <p>Path: <span className="text-blue-400">{location?.pathname || 'N/A'}</span></p>
                    <p>Pattern: <span className="text-slate-400">{routeConfig?.path || 'N/A'}</span></p>
                    <p>Component: <span className="text-slate-400 font-bold italic">{routeConfig?.componentName || 'UNDEFINED'}</span></p>
                </div>
            </div>
            <div className="space-y-2">
                <h4 className="font-black text-slate-500 uppercase tracking-tighter flex items-center gap-2 border-b border-slate-800 pb-1"><Shield size={10}/> Access Control</h4>
                <div className="space-y-1">
                    <p>Cluster: <span className="text-amber-400">{currentCluster?.id || 'N/A'}</span></p>
                    <p>Role: <span className="text-slate-400">{currentRole?.name || 'N/A'}</span></p>
                    <p>Permissions: <span className="text-emerald-400">[{permissions?.join(', ') || ''}]</span></p>
                </div>
            </div>
            <div className="space-y-2">
                <h4 className="font-black text-slate-500 uppercase tracking-tighter flex items-center gap-2 border-b border-slate-800 pb-1"><AlertTriangle size={10}/> Ledger State</h4>
                <div className="space-y-1">
                    <p>Scenario: <span className="text-indigo-400">{scenarioStore?.getScenario() || 'UNKNOWN'}</span></p>
                    <p>Registry: <span className={screenId ? 'text-emerald-400 font-bold' : 'text-rose-400 font-bold'}>{screenId ? 'VALID' : 'UNREGISTERED'}</span></p>
                </div>
            </div>
            <div className="flex flex-col justify-end">
                <div className="p-3 bg-blue-500/10 border border-blue-500/20 rounded-lg text-blue-300 text-[9px] leading-relaxed">
                    <strong>PATCH {CURRENT_PATCH.id}:</strong> Consolidating versioning and stabilizing EOL route namespace.
                </div>
            </div>
        </div>
      )}
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
  const [currentScenario, setCurrentScenario] = useState<DemoScenario>(scenarioStore.getScenario());
  const [isSwitching, setIsSwitching] = useState(false);

  useEffect(() => {
    scenarioStore.init();
    if (location?.pathname) {
      routerSafe.trackRoute(location.pathname, location.search);
    }
  }, [location]);

  const handleLogout = () => {
    logout();
    navigate(ROUTES.LOGIN);
  };

  const handleGlobalSearch = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!searchQuery.trim() || searching) return;
    setSearching(true);
    try {
        const resolution = await traceSearchService.resolveIdentifier(searchQuery);
        if (resolution) {
            navigate(resolution.route);
            setSearchQuery('');
        } else {
            addNotification({ title: 'No Results', message: 'Identifier not found in registry.', type: 'info' });
        }
    } catch (err) {
        console.error("Search failed:", err);
    } finally {
        setSearching(false);
    }
  };

  const handleScenarioChange = (s: DemoScenario) => {
    if (s === currentScenario || isSwitching) return;
    setIsSwitching(true);
    scenarioStore.setScenario(s);
    setCurrentScenario(s);
    addNotification({ title: 'Scenario Change', message: `Wiping state for ${s}...`, type: 'info' });
    navigate(ROUTES.DASHBOARD, { replace: true });
    setTimeout(() => { window.location.reload(); }, 500);
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
    <div className={`min-h-screen bg-slate-50 dark:bg-slate-950 flex flex-col font-sans text-slate-900 dark:text-slate-100 overflow-hidden`}>
      <UnifiedDiagnosticPanel />
      <div className="flex flex-1 min-h-0 relative">
        <aside className={`${sidebarOpen ? 'w-64' : 'w-0'} fixed inset-y-0 z-50 flex flex-col transition-all duration-300 border-r bg-white dark:bg-slate-900 dark:border-slate-800 overflow-hidden`}>
          <div className="h-16 flex items-center px-6 border-b dark:border-slate-800 shrink-0">
            <div className={`h-8 w-8 rounded mr-3 flex items-center justify-center text-white font-bold ${isSuperUser ? 'bg-amber-500' : 'bg-primary'}`}>
              {isSuperUser ? <Zap size={18} fill="currentColor" /> : 'A'}
            </div>
            <span className="font-bold text-lg tracking-tight">Aayatana Tech</span>
          </div>

          <div className="flex-1 overflow-y-auto py-6 px-3">
            {renderNavGroup('SOP Guide', SCREEN_GROUPS.GUIDED)}
            {renderNavGroup('Observe', SCREEN_GROUPS.OBSERVE)}
            {renderNavGroup('Design', SCREEN_GROUPS.DESIGN)}
            {renderNavGroup('Trace', SCREEN_GROUPS.TRACE)}
            {renderNavGroup('Operate', SCREEN_GROUPS.OPERATE)}
            {renderNavGroup('Assure', SCREEN_GROUPS.ASSURE)}
            {renderNavGroup('Resolve', SCREEN_GROUPS.RESOLVE)}
            {renderNavGroup('Govern', SCREEN_GROUPS.GOVERN)}
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
                  onChange={e => setSearchQuery(e.target.value)}
                />
              </form>
              <div className="h-8 w-px bg-slate-200 dark:bg-slate-800 mx-2 hidden lg:block"></div>
              <div className={`hidden lg:flex items-center gap-2 px-3 py-1.5 rounded-full border bg-slate-50 dark:bg-slate-800/50`}>
                  <Database size={14} className="text-primary" />
                  <span className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider">Demo:</span>
                  <select 
                      className="bg-transparent text-xs font-bold focus:outline-none cursor-pointer text-slate-700 dark:text-slate-300"
                      value={currentScenario}
                      onChange={(e) => handleScenarioChange(e.target.value as DemoScenario)}
                  >
                      <option value="HAPPY_PATH">Happy Path</option>
                      <option value="MISMATCH">Mismatch</option>
                      <option value="TAMPER">Tamper</option>
                      <option value="EMPTY">Blank Slate</option>
                  </select>
              </div>
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
      </div>
    </div>
  );
};