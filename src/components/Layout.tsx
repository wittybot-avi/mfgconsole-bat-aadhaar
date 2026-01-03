import React, { useEffect, useState } from 'react';
import { useLocation, Link, Outlet, useNavigate } from 'react-router-dom';
import { 
  Menu, Bell, Search, Users, LogOut, Zap, AlertTriangle, X, Database, Monitor, Tag
} from 'lucide-react';
import { useAppStore } from '../lib/store';
import { Button, Input, Badge, Tooltip } from './ui/design-system';
import { buildMeta } from '../app/buildMeta';
import { ScreenId } from '../rbac/screenIds';
import { canView, getMyPermissions } from '../rbac/can';
import { APP_ROUTES, getScreenIdForPath, isRouteRegistered } from '../../app/routeRegistry';
import { ROUTES, routes } from '../../app/routes';
import { DIAGNOSTIC_MODE } from '../app/diagnostics';
import { traceSearchService } from '../services/traceSearchService';
import { scenarioStore, DemoScenario } from '../demo/scenarioStore';
import { routerSafe } from '../utils/routerSafe';
import { HudPill } from './HudPill';
import { UnifiedDiagnosticPanel } from './UnifiedDiagnosticPanel';
import { navIntegrity } from '../app/navigationIntegrity';
import { NAV_SECTIONS, NavSection, NavItem } from '../app/navigation';

interface SidebarItemProps {
  icon?: any;
  label: string;
  path: string;
  active: boolean;
  disabled?: boolean;
  isComingSoon?: boolean;
  diagnosticInfo?: string;
  isConfigError?: boolean;
}

const SidebarItem: React.FC<SidebarItemProps> = ({ icon: Icon, label, path, active, disabled, isComingSoon, diagnosticInfo, isConfigError }) => {
  const content = (
    <div className={`group flex items-center justify-between px-3 py-2 rounded-md transition-all ${disabled ? 'opacity-40 cursor-not-allowed bg-slate-50 dark:bg-slate-800/30' : active ? 'bg-primary/10 text-primary font-medium' : 'text-slate-500 hover:bg-slate-100 hover:text-slate-900 dark:text-slate-400 dark:hover:bg-slate-800'}`}>
      <div className="flex items-center gap-3">
        {isConfigError ? <AlertTriangle size={18} className="text-rose-500" /> : Icon && <Icon size={18} className={disabled ? 'text-slate-400' : ''} />}
        <span className="text-sm truncate">{label}</span>
      </div>
      {isComingSoon && (
        <Badge variant="outline" className="text-[7px] h-3 px-1 font-black bg-slate-100 dark:bg-slate-800 uppercase tracking-tighter">WIP</Badge>
      )}
    </div>
  );

  if (disabled) {
    return (
      <Tooltip content={diagnosticInfo || "This module is temporarily filtered out based on your current role or configuration."}>
        <div className="w-full">{content}</div>
      </Tooltip>
    );
  }

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

  const [isDiagOpen, setIsDiagOpen] = useState(() => 
    location.search.includes('diag=1') || localStorage.getItem('DIAG_OPEN') === '1'
  );

  useEffect(() => {
    scenarioStore.init();
    if (location?.pathname) {
      routerSafe.trackRoute(location.pathname, location.search);
    }
    // PP-060B: Run Integrity Check
    navIntegrity.validate();
  }, [location]);

  useEffect(() => {
    if (location.search.includes('diag=1') && !isDiagOpen) {
      setIsDiagOpen(true);
    }
  }, [location.search]);

  const handleLogout = () => {
    logout();
    navigate(ROUTES.LOGIN);
  };

  const handleGlobalSearch = async (e: React.FormEvent) => {
    e.preventDefault();
    const query = searchQuery.trim().toUpperCase();
    if (!query || searching) return;
    
    setSearching(true);
    try {
        const resolution = await traceSearchService.resolveIdentifier(searchQuery);
        if (resolution) {
            navigate(resolution.route);
        } else {
            addNotification({ title: 'No Results', message: 'Identifier not found. Use prefixes like LOT- or SN-.', type: 'info' });
        }
        setSearchQuery('');
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

  const handleToggleDiag = () => {
    const newState = !isDiagOpen;
    setIsDiagOpen(newState);
    localStorage.setItem('DIAG_OPEN', newState ? '1' : '0');
  };

  const renderNavSection = (section: NavSection) => {
    if (!currentCluster) return null;

    const checkAccess = (item: NavItem) => canView(currentCluster.id, item.screenId);

    // 1. Process Flat Items
    if (section.items) {
      const visibleItems = section.items.filter(checkAccess);
      const hasVisibleItems = visibleItems.length > 0;
      const originalCount = section.items.length;

      if (originalCount > 0 && !hasVisibleItems) {
        if (isDiagOpen) {
          return (
            <div className="mb-6 opacity-40 grayscale" key={section.sectionId}>
              <h3 className="px-3 mb-2 text-[10px] font-black text-slate-400 uppercase tracking-[0.2em]">{section.label} (FILTERED)</h3>
              <SidebarItem 
                label="Section temporarily unavailable" 
                path={ROUTES.DASHBOARD} 
                active={false} 
                disabled={true} 
                diagnosticInfo={`All ${originalCount} items filtered for cluster ${currentCluster.id}`}
              />
            </div>
          );
        }
        return null;
      }

      return (
        <div className="mb-6" key={section.sectionId}>
          <h3 className="px-3 mb-2 text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] opacity-80">{section.label}</h3>
          <div className="space-y-1">
            {visibleItems.map(item => {
              const routeCfg = APP_ROUTES[item.screenId];
              return (
                <SidebarItem 
                  key={item.id}
                  icon={routeCfg?.icon}
                  label={item.label}
                  path={item.href()}
                  active={location.pathname === item.href() || (location.pathname.startsWith(item.href()) && item.href() !== '/')}
                />
              );
            })}
          </div>
        </div>
      );
    }

    // 2. Process SubGroups (Operate Pattern)
    if (section.subGroups) {
      const subGroupElements = section.subGroups.map(sg => {
        const visibleItems = sg.items.filter(checkAccess);
        if (visibleItems.length === 0) return null;

        return (
          <div key={sg.label} className="mt-4 first:mt-0">
            <h4 className="px-3 mb-1.5 text-[9px] font-bold text-slate-400/60 uppercase tracking-widest flex items-center gap-2">
              <div className="h-px bg-slate-200 dark:bg-slate-800 flex-1" />
              {sg.label}
              <div className="h-px bg-slate-200 dark:bg-slate-800 flex-1" />
            </h4>
            <div className="space-y-1">
              {visibleItems.map(item => {
                const routeCfg = APP_ROUTES[item.screenId];
                return (
                  <SidebarItem 
                    key={item.id}
                    icon={routeCfg?.icon}
                    label={item.label}
                    path={item.href()}
                    active={location.pathname === item.href()}
                  />
                );
              })}
            </div>
          </div>
        );
      }).filter(Boolean);

      if (subGroupElements.length === 0) return null;

      return (
        <div className="mb-6" key={section.sectionId}>
          <h3 className="px-3 mb-2 text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] opacity-80">{section.label}</h3>
          <div className="space-y-1">
            {subGroupElements}
          </div>
        </div>
      );
    }

    return null;
  };

  if (!currentRole || !currentCluster) return null;
  const isSuperUser = currentCluster.id === 'CS';

  const screenId = getScreenIdForPath(location.pathname) || 'UNKNOWN';
  const registered = isRouteRegistered(location.pathname);
  const routeConfig = APP_ROUTES[screenId as string];
  const permissions = getMyPermissions(currentCluster.id, screenId as ScreenId);

  return (
    <div className={`min-h-screen bg-slate-50 dark:bg-slate-950 flex flex-col font-sans text-slate-900 dark:text-slate-100 overflow-hidden`}>
      {DIAGNOSTIC_MODE && (
        <UnifiedDiagnosticPanel 
          isOpen={isDiagOpen}
          onToggle={handleToggleDiag}
          screenId={screenId as string}
          path={location.pathname}
          routePattern={routeConfig?.path || 'UNKNOWN'}
          componentName={routeConfig?.componentName || 'UNDEFINED'}
          role={currentRole.name}
          cluster={currentCluster.id}
          permissions={permissions}
          isRegistered={registered}
          patchId={buildMeta.patchId}
          scenario={scenarioStore.getScenario()}
        />
      )}

      <div className="flex flex-1 min-h-0 relative">
        <aside className={`${sidebarOpen ? 'w-64' : 'w-0'} fixed inset-y-0 z-50 flex flex-col transition-all duration-300 border-r bg-white dark:bg-slate-900 dark:border-slate-800 overflow-hidden`}>
          <div className="h-16 flex items-center px-6 border-b dark:border-slate-800 shrink-0">
            <div className={`h-8 w-8 rounded mr-3 flex items-center justify-center text-white font-bold ${isSuperUser ? 'bg-amber-500' : 'bg-primary'}`}>
              {isSuperUser ? <Zap size={18} fill="currentColor" /> : 'A'}
            </div>
            <span className="font-bold text-lg tracking-tight">Aayatana Tech</span>
          </div>

          <div className="flex-1 overflow-y-auto py-6 px-3">
            {NAV_SECTIONS.map(section => renderNavSection(section))}
          </div>

          <div className="p-4 border-t dark:border-slate-800 shrink-0">
            <div className="flex items-center gap-3">
              <div className={`h-9 w-9 rounded-full flex items-center justify-center text-slate-500 ${isSuperUser ? 'bg-amber-100 dark:bg-amber-900/30 text-amber-600' : 'bg-slate-200 dark:bg-slate-700'}`}>
                <Users size={16} />
              </div>
              <div className="flex flex-col overflow-hidden">
                <span className="text-sm font-medium truncate" title={currentRole.name}>{currentRole.name}</span>
                <span className="text-xs text-slate-500 truncate">{currentCluster.id} Cluster</span>
              </div>
            </div>
          </div>
        </aside>

        <div className={`flex-1 flex flex-col transition-all duration-300 ${sidebarOpen ? 'pl-64' : 'pl-0'}`}>
          <header className="h-16 border-b bg-white dark:bg-slate-900 dark:border-slate-800 sticky top-0 z-40 px-6 flex items-center justify-between">
            <div className="flex flex-col flex-1 gap-1">
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
      
      {DIAGNOSTIC_MODE && (
        <HudPill 
          onToggle={handleToggleDiag}
          patchId={buildMeta.patchId}
          path={location.pathname}
          isRegistered={registered}
          screenId={screenId as string}
          isDiagParamActive={isDiagOpen}
        />
      )}
    </div>
  );
};