import { NavigateFunction } from 'react-router-dom';
import { routes } from '../../app/routes';
import { ScreenId } from '../rbac/screenIds';
import { isRouteRegistered, APP_ROUTES } from '../../app/routeRegistry';
import { resolvePath } from './navAliases';

export interface NavItem {
  id: string;
  label: string;
  screenId: ScreenId;
  href: () => string;
  isComingSoon?: boolean;
}

export interface NavSection {
  sectionId: string;
  label: string;
  items?: NavItem[];
  subGroups?: { label: string; items: NavItem[] }[];
}

/**
 * CANONICAL PATH RESOLVER (PP-061B)
 * Transforms ScreenId + Params into a concrete registered route.
 */
export function resolveCanonicalPath(screenId: ScreenId, params?: Record<string, string>): string {
  const config = APP_ROUTES[screenId];
  if (!config) {
    console.error(`[NavGuardrail] CRITICAL: ScreenId "${screenId}" not found in route registry.`);
    return '/';
  }

  let path = config.path;
  if (params) {
    Object.entries(params).forEach(([key, value]) => {
      path = path.replace(`:${key}`, encodeURIComponent(value));
    });
  }

  // Fallback if placeholders still exist (missing params)
  if (path.includes(':')) {
    console.warn(`[NavGuardrail] Incomplete params for ${screenId}. Falling back to parent list.`);
    // Try to find the non-parameterized version or return dashboard
    return path.split('/:')[0] || '/';
  }

  return path;
}

/**
 * CANONICAL NAVIGATION (PP-061B)
 * Standard method for workstation/runbook navigation.
 */
export function navigateCanonical(
  navigate: NavigateFunction, 
  screenId: ScreenId, 
  params?: Record<string, string>,
  options?: { replace?: boolean; state?: any }
) {
  const resolved = resolveCanonicalPath(screenId, params);
  navigate(resolved, options);
}

/**
 * SAFE NAVIGATION HELPER (LEGACY/STRINGS)
 */
export function safeNavigate(
  navigate: NavigateFunction, 
  path: string, 
  options?: { replace?: boolean; state?: any }
) {
  const resolved = resolvePath(path);
  
  if (isRouteRegistered(resolved)) {
    navigate(resolved, options);
  } else {
    console.warn(`[NavGuardrail] DETOURED: "${path}" resolved to "${resolved}" which is not in registry. Defaulting to dashboard.`);
    navigate('/', options);
  }
}

/**
 * SINGLE SOURCE OF TRUTH FOR SIDEBAR
 */
export const NAV_SECTIONS: NavSection[] = [
  {
    sectionId: 'GOVERN',
    label: 'Govern',
    items: [
      { id: 'control-tower', label: 'Control Tower', screenId: ScreenId.RUNBOOK_HUB, href: () => routes.runbooks() },
      { id: 'compliance', label: 'Compliance', screenId: ScreenId.COMPLIANCE, href: () => routes.compliance() },
      { id: 'custody', label: 'Chain of Custody', screenId: ScreenId.CUSTODY, href: () => routes.custody() },
      { id: 'access-audit', label: 'Access Audit', screenId: ScreenId.RBAC_VIEW, href: () => routes.accessAudit() },
    ]
  },
  {
    sectionId: 'OBSERVE',
    label: 'Observe',
    items: [
      { id: 'dashboard', label: 'Dashboard', screenId: ScreenId.DASHBOARD, href: () => routes.dashboard() },
      { id: 'telemetry', label: 'Telemetry', screenId: ScreenId.TELEMETRY, href: () => routes.telemetry() },
      { id: 'analytics', label: 'Analytics', screenId: ScreenId.ANALYTICS, href: () => routes.analytics() },
    ]
  },
  {
    sectionId: 'RESOLVE',
    label: 'Resolve',
    items: [
      { id: 'warranty', label: 'Warranty & Returns', screenId: ScreenId.WARRANTY, href: () => routes.warrantyReturns() },
      { id: 'exceptions-inbox', label: 'Exceptions Inbox', screenId: ScreenId.WARRANTY_OVERVIEW, href: () => '#', isComingSoon: true }
    ]
  },
  {
    sectionId: 'DESIGN',
    label: 'Design',
    items: [
      { id: 'sku-design', label: 'SKU Design', screenId: ScreenId.SKU_LIST, href: () => routes.skuList() },
      { id: 'eol-setup', label: 'EOL Station Setup', screenId: ScreenId.EOL_SETUP, href: () => routes.eolStationSetup() },
      { id: 'prov-setup', label: 'Provisioning Setup', screenId: ScreenId.PROVISIONING_STATION_SETUP, href: () => routes.settings() },
    ]
  },
  {
    sectionId: 'TRACE',
    label: 'Trace',
    items: [
      { id: 'cell-serialization', label: 'Cell Serialization', screenId: ScreenId.CELL_LOTS_LIST, href: () => routes.cellSerialization() },
      { id: 'register-shipment', label: 'Register Shipment', screenId: ScreenId.CELL_LOTS_CREATE, href: () => '/trace/cells/new' },
      { id: 'lineage-audit', label: 'Lineage Audit', screenId: ScreenId.LINEAGE_VIEW, href: () => routes.lineageAudit() },
    ]
  },
  {
    sectionId: 'OPERATE',
    label: 'Operate',
    subGroups: [
      {
        label: 'Assembly',
        items: [
          { id: 'batches', label: 'Batches', screenId: ScreenId.BATCHES_LIST, href: () => routes.batchesList() },
          { id: 'modules', label: 'Modules', screenId: ScreenId.MODULE_ASSEMBLY_LIST, href: () => routes.moduleAssemblyList() },
          { id: 'packs', label: 'Packs', screenId: ScreenId.PACK_ASSEMBLY_LIST, href: () => routes.packAssemblyList() },
          { id: 'prov-queue', label: 'Provisioning Queue', screenId: ScreenId.PROVISIONING_QUEUE, href: () => routes.provisioningQueue() },
        ]
      },
      {
        label: 'SCM',
        items: [
          { id: 'inventory', label: 'Inventory', screenId: ScreenId.INVENTORY, href: () => routes.inventoryList() },
          { id: 'dispatch', label: 'Dispatch Orders', screenId: ScreenId.DISPATCH_LIST, href: () => routes.dispatchList() },
        ]
      },
      {
        label: 'Assure',
        items: [
          { id: 'eol-queue', label: 'EOL Queue', screenId: ScreenId.EOL_QA_QUEUE, href: () => routes.eolQueue() },
          { id: 'eol-review', label: 'EOL Review', screenId: ScreenId.EOL_REVIEW, href: () => routes.eolReview() },
        ]
      }
    ]
  },
  {
    sectionId: 'ADMIN',
    label: 'Admin',
    items: [
      { id: 'settings', label: 'Settings', screenId: ScreenId.SETTINGS, href: () => routes.settings() },
    ]
  }
];