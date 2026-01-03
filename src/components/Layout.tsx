import React, { useEffect, useState } from 'react';
import { useLocation, Link, Outlet, useNavigate } from 'react-router-dom';
import { 
  Menu, Bell, Search, Users, LogOut, Zap, AlertTriangle, X, Database, Monitor, Tag, ChevronDown, ChevronUp, Shield,
  BookOpen, ShieldCheck, History, LayoutDashboard, Activity, BarChart3, Layers, Archive, Box, Truck, Settings, Fingerprint, Plus, Warehouse, ClipboardCheck, ClipboardList, FileText
} from 'lucide-react';
import { useAppStore } from '../lib/store';
import { Button, Input, Badge } from './ui/design-system';
import { APP_VERSION, CURRENT_PATCH } from '../../app/patchInfo';
import { ScreenId, SCREEN_GROUPS } from '../rbac/screenIds';
import { canView, getMyPermissions } from '../rbac/can';
import { APP_ROUTES, getScreenIdForPath, isRouteRegistered } from '../../app/routeRegistry';
import { ROUTES, routes } from '../../app/routes';
import { DIAGNOSTIC_MODE } from '../app/diagnostics';
import { traceSearchService } from '../services/traceSearchService';
import { scenarioStore, DemoScenario } from '../demo/scenarioStore';
import { routerSafe } from '../utils/routerSafe';
import { HudPill } from './HudPill';
import { UnifiedDiagnosticPanel } from './UnifiedDiagnosticPanel';
import { navValidator } from '../app/navValidation';

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

/**
 * NAV CONFIG FOR PP-059
 */
interface NavGroup {
  label: string;
  screenIds?: ScreenId[];
  subGroups?: { label: string; screenIds: ScreenId[] }[];
}

const NAV_STRUCTURE: NavGroup[] = [
  {
    label: 'Control Tower',
    screenIds: SCREEN_GROUPS.CONTROL_TOWER
  },
  {
    label: 'Observe',
    screenIds: SCREEN_GROUPS.OBSERVE
  },
  {
    label: 'Design',
    screenIds: SCREEN_GROUPS.DESIGN
  },
  {
    label: 'Trace',
    screenIds: SCREEN_GROUPS.TRACE
  },
  {
    label: 'Operate',
    subGroups: [
      { label: 'Assembly', screenIds: SCREEN_GROUPS.OPERATE_ASSEMBLY },
      { label: 'SCM', screenIds: SCREEN_GROUPS.OPERATE_SCM },
      { label: 'Assure', screenIds: SCREEN_GROUPS.OPERATE_ASSURE },
    ]
  },
  {
    label: 'Admin',
    screenIds: SCREEN_GROUPS.ADMIN
  }
];

export const Layout = () => {
  const { theme, toggleTheme, currentRole, currentCluster, logout, sidebarOpen, toggleSidebar, addNotification } = useAppStore();
  const location = useLocation();
  const navigate = useNavigate();
  const [searchQuery, setSearchQuery] = useState('');
  const [searching, setSearching] = useState(false);
  const [currentScenario, setCurrentScenario] = useState<DemoScenario>(scenarioStore.getScenario());
  const [isSwitching, setIsSwitching] = useState(false);

  // PP-056B Diagnostic State
  const [isDiagOpen, setIsDiagOpen] = useState(() => 
    location.search.includes('diag=1') || localStorage.getItem('DIAG_OPEN') === '1'
  );

  const resolvePath = (id: ScreenId): string => {
    // PP-059: Standardized to canonical route builders exclusively
    if (id === ScreenId.DASHBOARD) return routes.dashboard();
    if (id === ScreenId.TELEMETRY) return routes.telemetry();
    if (id === ScreenId.ANALYTICS) return routes.analytics();
    if (id === ScreenId.EOL_QA_QUEUE) return routes.eolHome();
    if (id === ScreenId.COMPLIANCE) return routes.compliance();
    if (id === ScreenId.CUSTODY) return routes.custody();
    if (id === ScreenId.WARRANTY) return routes.warrantyReturns();
    if (id === ScreenId.RBAC_VIEW) return routes.accessAudit();
    if (id === ScreenId.CELL_LOTS_LIST) return routes.cellSerialization();
    if (id === ScreenId.BATCHES_LIST) return routes.batchesList();
    if (id === ScreenId.MODULE_ASSEMBLY_LIST) return routes.moduleAssemblyList();
    if (id === ScreenId.PACK_ASSEMBLY_LIST) return routes.packAssemblyList();
    if (id === ScreenId.INVENTORY) return routes.inventoryList();
    if (id === ScreenId.DISPATCH_LIST) return routes.dispatchList();
    if (id === ScreenId.EOL_REVIEW) return routes.eolReview();
    if (id === ScreenId.SETTINGS) return routes.settings();
    if (id === ScreenId.EOL_SETUP) return routes.eolStationSetup();
    if (id === ScreenId.PROVISIONING_STATION_SETUP) return routes.settings(); // Mock redirect or specific if added
    if (id === ScreenId.PROVISIONING_QUEUE) return ROUTES.PROVISIONING_QUEUE;
    if (id === ScreenId.RUNBOOK_HUB) return routes.dashboard(); // Temp fallback or dedicated builder if exists
    if (id === ScreenId.LINEAGE_VIEW) return routes.lineageAudit();
    if (id === ScreenId.CELL_LOTS_CREATE) return ROUTES.CELL_SERIALIZATION_NEW;

    const config = APP_ROUTES[id];
    return config?.path || '#';
  };

  useEffect(() => {
    scenarioStore.init();
    if (location?.pathname) {
      routerSafe.trackRoute(location.pathname, location.search);
    }
    // PP-059: Run Nav Validation once on boot
    navValidator.validate(NAV_STRUCTURE, resolvePath);
  }, [location]);

  // Sync diag state from URL
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
        if (query.startsWith('LOT-') || query.includes('LFP') || query.includes('NMC')) {
            navigate(`${routes.cellSerialization() || '/trace/cells'}?q=${query}`);
        }
        else if (query.startsWith('PB-') || query.startsWith('PACK-')) {
            if (query.length > 5) navigate(routes.packBuildDetails(query));
            else navigate(`${routes.packAssemblyList()}?q=${query}`);
        }
        else if (query.startsWith('SN-') || query.startsWith('BAT-')) {
            if (query.length > 4) navigate(routes.batteryIdentityDetails(query));
            else navigate(`${routes.batteryIdentityList()}?q=${query}`);
        }
        else if (query.startsWith('INV-') || query.startsWith('BATT-')) {
            if (query.length > 5) navigate(routes.inventoryItem(query));
            else navigate(`${routes.inventoryList()}?q=${query}`);
        }
        else {
            const resolution = await traceSearchService.resolveIdentifier(searchQuery);
            if (resolution) {
                navigate(resolution.route);
            } else {
                addNotification({ title: 'No Results', message: 'Identifier not found. Use prefixes like LOT- or SN-.', type: 'info' });
            }
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

  const renderNavItems = (ids: ScreenId[]) => {
    if (!currentCluster) return null;
    const visibleIds = ids.filter(id => id && canView(currentCluster.id, id));
    
    return visibleIds.map(id => {
      const config = APP_ROUTES[id];
      if (!config) return null;
      if (id.includes('DETAIL') || id.includes('EDIT') || id.includes('_RUN') || id.includes('_TAB')) return null;
      
      const path = resolvePath(id);
      const displayPath = path.includes(':') ? path.split('/:')[0] : path;
      
      let label = config.label;
      if (id === ScreenId.RUNBOOK_HUB) label = 'SOP Library';
      if (id === ScreenId.RBAC_VIEW) label = 'Access Audit';

      return (
        <SidebarItem 
          key={id}
          icon={config.icon} 
          label={label} 
          path={displayPath} 
          active={location.pathname === displayPath || (location.pathname.startsWith(displayPath) && displayPath !== '/')}
        />
      );
    });
  };

  const renderNavGroup = (group: NavGroup) => {
    if (!currentCluster) return null;

    if (group.screenIds) {
      const visibleItems = group.screenIds.filter(id => id && canView(currentCluster.id, id));
      
      // PP-059: Section Placeholder Rule
      const hasVisibleItems = visibleItems.length > 0;
      const originalCount = group.screenIds.length;

      return (
        <div className="mb-6" key={group.label}>
          <h3 className="px-3 mb-2 text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] opacity-80">{group.label}</h3>
          <div className="space-y-1">
            {hasVisibleItems ? renderNavItems(group.screenIds) : originalCount > 0 && (
              <SidebarItem 
                icon={AlertTriangle} 
                label="⚠ Section unavailable" 
                path={ROUTES.DASHBOARD} 
                active={false} 
                disabled={true} 
              />
            )}
          </div>
        </div>
      );
    }

    if (group.subGroups) {
      const subGroupElements = group.subGroups.map(sg => {
        const visibleItems = sg.screenIds.filter(id => id && canView(currentCluster.id, id));
        const hasVisibleItems = visibleItems.length > 0;
        const originalCount = sg.screenIds.length;

        if (!hasVisibleItems && originalCount === 0) return null;

        return (
          <div key={sg.label} className="mt-4 first:mt-0">
            <h4 className="px-3 mb-1.5 text-[9px] font-bold text-slate-400/60 uppercase tracking-widest flex items-center gap-2">
              <div className="h-px bg-slate-200 dark:bg-slate-800 flex-1" />
              {sg.label}
              <div className="h-px bg-slate-200 dark:bg-slate-800 flex-1" />
            </h4>
            <div className="space-y-1">
              {hasVisibleItems ? renderNavItems(sg.screenIds) : (
                <SidebarItem 
                  icon={AlertTriangle} 
                  label="⚠ Sub-section unavailable" 
                  path={ROUTES.DASHBOARD} 
                  active={false} 
                  disabled={true} 
                />
              )}
            </div>
          </div>
        );
      }).filter(Boolean);

      if (subGroupElements.length === 0) return null;

      return (
        <div className="mb-6" key={group.label}>
          <h3 className="px-3 mb-2 text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] opacity-80">{group.label}</h3>
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

  // Diagnostic metadata
  const screenId = getScreenIdForPath(location.pathname) || 'UNKNOWN';
  const registered = isRouteRegistered(location.pathname);
  const routeConfig = APP_ROUTES[screenId];
  const permissions = getMyPermissions(currentCluster.id, screenId as ScreenId);

  return (
    <div className={`min-h-screen bg-slate-50 dark:bg-slate-950 flex flex-col font-sans text-slate-900 dark:text-slate-100 overflow-hidden`}>
      {DIAGNOSTIC_MODE && (
        <UnifiedDiagnosticPanel 
          isOpen={isDiagOpen}
          onToggle={handleToggleDiag}
          screenId={screenId}
          path={location.pathname}
          routePattern={routeConfig?.path || 'UNKNOWN'}
          componentName={routeConfig?.componentName || 'UNDEFINED'}
          role={currentRole.name}
          cluster={currentCluster.id}
          permissions={permissions}
          isRegistered={registered}
          patchId={CURRENT_PATCH.id}
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
            {NAV_STRUCTURE.map(group => renderNavGroup(group))}
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
              <p className="hidden md:block text-[9px] text-slate-400 font-bold uppercase tracking-widest pl-14">
                Try: <span className="text-primary/70">LOT-</span>, <span className="text-primary/70">PB-</span>, <span className="text-primary/70">SN-</span>, <span className="text-primary/70">INV-</span>
              </p>
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
          patchId={CURRENT_PATCH.id}
          path={location.pathname}
          isRegistered={registered}
          screenId={screenId}
          isDiagParamActive={location.search.includes('diag=1')}
        />
      )}
    </div>
  );
};