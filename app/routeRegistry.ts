import { 
  LayoutDashboard,
  Activity,
  BarChart3,
  Layers,
  Archive,
  ClipboardList,
  ClipboardCheck,
  Search,
  Box,
  Truck,
  ShieldCheck,
  History,
  Settings,
  Shield,
  Zap,
  Cpu,
  FileText,
  Warehouse,
  FileSpreadsheet,
  BookOpen,
  Map,
  Globe,
  Leaf,
  Recycle,
  Fingerprint,
  Play,
  Plus
} from 'lucide-react';
import { ScreenId } from '../src/rbac/screenIds';
import { matchPath } from 'react-router-dom';
import { ROUTES } from './routes';

export interface RouteConfig {
  icon: any;
  label: string;
  path: string;
  screenId: ScreenId;
  componentName: string;
}

/**
 * Route Registry
 */
export const APP_ROUTES: Record<string, RouteConfig> = {
  [ScreenId.RUNBOOK_HUB]: { icon: BookOpen, label: 'Runbooks', path: ROUTES.RUNBOOKS, screenId: ScreenId.RUNBOOK_HUB, componentName: 'RunbookHub.tsx' },
  [ScreenId.RUNBOOK_DETAIL]: { icon: Map, label: 'Runbook Details', path: ROUTES.RUNBOOK_DETAIL, screenId: ScreenId.RUNBOOK_DETAIL, componentName: 'RunbookDetail.tsx' },

  [ScreenId.DASHBOARD]: { icon: LayoutDashboard, label: 'Dashboard', path: ROUTES.DASHBOARD, screenId: ScreenId.DASHBOARD, componentName: 'Dashboard.tsx' },
  [ScreenId.DASHBOARD_EXEC_SUMMARY]: { icon: LayoutDashboard, label: 'Dashboard: Summary', path: ROUTES.DASHBOARD, screenId: ScreenId.DASHBOARD_EXEC_SUMMARY, componentName: 'Dashboard.tsx' },
  [ScreenId.TELEMETRY]: { icon: Activity, label: 'Telemetry', path: ROUTES.TELEMETRY, screenId: ScreenId.TELEMETRY, componentName: 'Telemetry.tsx' },
  [ScreenId.ANALYTICS]: { icon: BarChart3, label: 'Analytics', path: ROUTES.ANALYTICS, screenId: ScreenId.ANALYTICS, componentName: 'Analytics.tsx' },
  
  [ScreenId.SKU_LIST]: { icon: Layers, label: 'SKU Design', path: ROUTES.SKU_DESIGN, screenId: ScreenId.SKU_LIST, componentName: 'SkuList.tsx' },
  
  [ScreenId.CELL_LOTS_LIST]: { icon: Archive, label: 'Cell Serialization', path: ROUTES.CELL_SERIALIZATION_HAPPY, screenId: ScreenId.CELL_LOTS_LIST, componentName: 'CellLotsList.tsx' },
  [ScreenId.CELL_LOTS_CREATE]: { icon: Plus, label: 'Register Cell Shipment', path: ROUTES.CELL_SERIALIZATION_NEW, screenId: ScreenId.CELL_LOTS_CREATE, componentName: 'CreateCellLot.tsx' },
  [ScreenId.CELL_LOTS_DETAIL]: { icon: Search, label: 'Cell Lot Details', path: ROUTES.CELL_LOT_DETAIL, screenId: ScreenId.CELL_LOTS_DETAIL, componentName: 'CellLotDetail.tsx' },
  [ScreenId.LINEAGE_VIEW]: { icon: History, label: 'Lineage Audit', path: ROUTES.LINEAGE_AUDIT, screenId: ScreenId.LINEAGE_VIEW, componentName: 'LineageView.tsx' },
  
  [ScreenId.BATCHES_LIST]: { icon: Box, label: 'Manufacturing Batches', path: ROUTES.BATCHES, screenId: ScreenId.BATCHES_LIST, componentName: 'Batches.tsx' },
  [ScreenId.BATCHES_DETAIL]: { icon: Box, label: 'Batch Details', path: ROUTES.BATCH_DETAIL, screenId: ScreenId.BATCHES_DETAIL, componentName: 'BatchDetail.tsx' },
  
  [ScreenId.MODULE_ASSEMBLY_LIST]: { icon: Layers, label: 'Module Assembly', path: ROUTES.MODULE_ASSEMBLY, screenId: ScreenId.MODULE_ASSEMBLY_LIST, componentName: 'ModuleAssemblyList.tsx' },
  [ScreenId.MODULE_ASSEMBLY_DETAIL]: { icon: Layers, label: 'Module Detail', path: ROUTES.MODULE_ASSEMBLY_DETAIL, screenId: ScreenId.MODULE_ASSEMBLY_DETAIL, componentName: 'ModuleAssemblyDetail.tsx' },
  
  [ScreenId.PACK_ASSEMBLY_LIST]: { icon: Box, label: 'Pack Assembly', path: ROUTES.PACK_ASSEMBLY, screenId: ScreenId.PACK_ASSEMBLY_LIST, componentName: 'PackAssemblyList.tsx' },
  [ScreenId.PACK_ASSEMBLY_DETAIL]: { icon: Box, label: 'Pack Detail', path: ROUTES.PACK_ASSEMBLY_DETAIL, screenId: ScreenId.PACK_ASSEMBLY_DETAIL, componentName: 'PackAssemblyDetail.tsx' },
  
  [ScreenId.BATTERIES_LIST]: { icon: Fingerprint, label: 'Battery Identity', path: ROUTES.BATTERY_IDENTITY, screenId: ScreenId.BATTERIES_LIST, componentName: 'Batteries.tsx' },
  [ScreenId.BATTERIES_DETAIL]: { icon: Zap, label: 'Battery Detail', path: ROUTES.BATTERY_IDENTITY_DETAIL, screenId: ScreenId.BATTERIES_DETAIL, componentName: 'BatteryDetail.tsx' },
  
  [ScreenId.PROVISIONING_QUEUE]: { icon: Cpu, label: 'Provisioning Queue', path: ROUTES.PROVISIONING_QUEUE, screenId: ScreenId.PROVISIONING_QUEUE, componentName: 'ProvisioningQueue.tsx' },
  [ScreenId.PROVISIONING_STATION_SETUP]: { icon: Settings, label: 'Provisioning Setup', path: ROUTES.PROVISIONING_SETUP, screenId: ScreenId.PROVISIONING_STATION_SETUP, componentName: 'ProvisioningStationSetup.tsx' },
  
  [ScreenId.INVENTORY]: { icon: Warehouse, label: 'Inventory', path: ROUTES.INVENTORY, screenId: ScreenId.INVENTORY, componentName: 'InventoryList.tsx' },
  [ScreenId.DISPATCH_LIST]: { icon: Truck, label: 'Dispatch Orders', path: ROUTES.DISPATCH_ORDERS, screenId: ScreenId.DISPATCH_LIST, componentName: 'DispatchList.tsx' },
  [ScreenId.DISPATCH_DETAIL]: { icon: Truck, label: 'Dispatch Details', path: ROUTES.DISPATCH_DETAIL, screenId: ScreenId.DISPATCH_DETAIL, componentName: 'DispatchDetail.tsx' },

  [ScreenId.EOL_QA_QUEUE]: { icon: ClipboardCheck, label: 'EOL / QA Queue', path: ROUTES.EOL_QUEUE, screenId: ScreenId.EOL_QA_QUEUE, componentName: 'EolQaList.tsx' },
  [ScreenId.EOL_SETUP]: { icon: Settings, label: 'EOL Station Setup', path: ROUTES.EOL_SETUP, screenId: ScreenId.EOL_SETUP, componentName: 'EolStationSetup.tsx' },
  [ScreenId.EOL_REVIEW]: { icon: ClipboardList, label: 'EOL Review', path: ROUTES.EOL_REVIEW, screenId: ScreenId.EOL_REVIEW, componentName: 'EolReview.tsx' },
  [ScreenId.EOL_DETAILS]: { icon: Search, label: 'EOL Analysis', path: ROUTES.EOL_DETAILS, screenId: ScreenId.EOL_DETAILS, componentName: 'EolDetails.tsx' },

  [ScreenId.COMPLIANCE]: { icon: ShieldCheck, label: 'Compliance', path: ROUTES.COMPLIANCE, screenId: ScreenId.COMPLIANCE, componentName: 'Compliance.tsx' },
  [ScreenId.CUSTODY]: { icon: History, label: 'Chain of Custody', path: ROUTES.CUSTODY, screenId: ScreenId.CUSTODY, componentName: 'Custody.tsx' },
  [ScreenId.WARRANTY]: { icon: FileText, label: 'Warranty & Returns', path: ROUTES.WARRANTY_RETURNS, screenId: ScreenId.WARRANTY, componentName: 'Warranty.tsx' },
  [ScreenId.SETTINGS]: { icon: Settings, label: 'Settings', path: ROUTES.SETTINGS, screenId: ScreenId.SETTINGS, componentName: 'Settings.tsx' },
  [ScreenId.RBAC_VIEW]: { icon: Shield, label: 'Access Audit', path: ROUTES.ACCESS_AUDIT, screenId: ScreenId.RBAC_VIEW, componentName: 'RbacAdmin.tsx' },
  [ScreenId.SYSTEM_HEALTH]: { icon: Activity, label: 'System Health', path: ROUTES.SYSTEM_HEALTH, screenId: ScreenId.SYSTEM_HEALTH, componentName: 'DiagnosticsPage.tsx' },
};

/**
 * Hardened resolution to prevent boot-time crashes.
 */
export function getScreenIdForPath(pathname: string | null | undefined): ScreenId | undefined {
  if (!pathname) return undefined;
  try {
    const match = (Object.values(APP_ROUTES) as RouteConfig[]).find(config => 
      !!matchPath({ path: config.path || '', end: true }, pathname)
    );
    return match?.screenId;
  } catch (e) {
    console.error("[RouteRegistry] Resolution failure:", e);
    return undefined;
  }
}

export function isRouteRegistered(pathname: string): boolean {
  return !!getScreenIdForPath(pathname);
}