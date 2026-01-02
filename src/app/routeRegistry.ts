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
import { ScreenId } from '../rbac/screenIds';
import { matchPath } from 'react-router-dom';
import { ROUTES } from '../../app/routes';

export interface RouteConfig {
  icon: any;
  label: string;
  path: string;
  screenId: ScreenId;
  componentName: string;
}

/**
 * Route Registry - SINGLE SOURCE OF TRUTH
 * Using canonical ROUTES constants to ensure alignment between Sidebar and Router.
 */
export const APP_ROUTES: Record<string, RouteConfig> = {
  // Guided
  [ScreenId.RUNBOOK_HUB]: { icon: BookOpen, label: 'Runbooks', path: ROUTES.RUNBOOKS, screenId: ScreenId.RUNBOOK_HUB, componentName: 'RunbookHub.tsx' },
  [ScreenId.RUNBOOK_DETAIL]: { icon: Map, label: 'Runbook Details', path: ROUTES.RUNBOOK_DETAIL, screenId: ScreenId.RUNBOOK_DETAIL, componentName: 'RunbookDetail.tsx' },

  // Observe
  [ScreenId.DASHBOARD]: { icon: LayoutDashboard, label: 'Dashboard', path: ROUTES.DASHBOARD, screenId: ScreenId.DASHBOARD, componentName: 'Dashboard.tsx' },
  [ScreenId.DASHBOARD_EXEC_SUMMARY]: { icon: LayoutDashboard, label: 'Dashboard: Summary', path: ROUTES.DASHBOARD, screenId: ScreenId.DASHBOARD_EXEC_SUMMARY, componentName: 'Dashboard.tsx' },
  [ScreenId.DASHBOARD_PRODUCTION]: { icon: LayoutDashboard, label: 'Dashboard: Production', path: ROUTES.DASHBOARD, screenId: ScreenId.DASHBOARD_PRODUCTION, componentName: 'Dashboard.tsx' },
  [ScreenId.DASHBOARD_QUALITY]: { icon: LayoutDashboard, label: 'Dashboard: Quality', path: ROUTES.DASHBOARD, screenId: ScreenId.DASHBOARD_QUALITY, componentName: 'Dashboard.tsx' },
  [ScreenId.DASHBOARD_LOGISTICS]: { icon: LayoutDashboard, label: 'Dashboard: Logistics', path: ROUTES.DASHBOARD, screenId: ScreenId.DASHBOARD_LOGISTICS, componentName: 'Dashboard.tsx' },
  [ScreenId.DASHBOARD_RISK_COMPLIANCE]: { icon: LayoutDashboard, label: 'Dashboard: Risk', path: ROUTES.DASHBOARD, screenId: ScreenId.DASHBOARD_RISK_COMPLIANCE, componentName: 'Dashboard.tsx' },

  [ScreenId.TELEMETRY]: { icon: Activity, label: 'Telemetry', path: ROUTES.TELEMETRY, screenId: ScreenId.TELEMETRY, componentName: 'Telemetry.tsx' },
  [ScreenId.TELEMETRY_LIVE_VIEW]: { icon: Activity, label: 'Telemetry: Live', path: ROUTES.TELEMETRY, screenId: ScreenId.TELEMETRY_LIVE_VIEW, componentName: 'Telemetry.tsx' },
  [ScreenId.TELEMETRY_HISTORY_VIEW]: { icon: Activity, label: 'Telemetry: History', path: ROUTES.TELEMETRY, screenId: ScreenId.TELEMETRY_HISTORY_VIEW, componentName: 'Telemetry.tsx' },
  [ScreenId.TELEMETRY_EXPORT]: { icon: Activity, label: 'Telemetry: Export', path: ROUTES.TELEMETRY, screenId: ScreenId.TELEMETRY_EXPORT, componentName: 'Telemetry.tsx' },

  [ScreenId.ANALYTICS]: { icon: BarChart3, label: 'Analytics', path: ROUTES.ANALYTICS, screenId: ScreenId.ANALYTICS, componentName: 'Analytics.tsx' },
  [ScreenId.ANALYTICS_OVERVIEW_TAB]: { icon: BarChart3, label: 'Analytics: Overview', path: ROUTES.ANALYTICS, screenId: ScreenId.ANALYTICS_OVERVIEW_TAB, componentName: 'Analytics.tsx' },
  [ScreenId.ANALYTICS_BATCH_TAB]: { icon: BarChart3, label: 'Analytics: Batches', path: ROUTES.ANALYTICS, screenId: ScreenId.ANALYTICS_BATCH_TAB, componentName: 'Analytics.tsx' },
  [ScreenId.ANALYTICS_STATION_TAB]: { icon: BarChart3, label: 'Analytics: Stations', path: ROUTES.ANALYTICS, screenId: ScreenId.ANALYTICS_STATION_TAB, componentName: 'Analytics.tsx' },
  [ScreenId.ANALYTICS_QUALITY_TAB]: { icon: BarChart3, label: 'Analytics: Quality', path: ROUTES.ANALYTICS, screenId: ScreenId.ANALYTICS_QUALITY_TAB, componentName: 'Analytics.tsx' },
  [ScreenId.ANALYTICS_LOCATION_TAB]: { icon: BarChart3, label: 'Analytics: Location', path: ROUTES.ANALYTICS, screenId: ScreenId.ANALYTICS_LOCATION_TAB, componentName: 'Analytics.tsx' },
  [ScreenId.ANALYTICS_REPORTS_TAB]: { icon: BarChart3, label: 'Analytics: Reports', path: ROUTES.ANALYTICS, screenId: ScreenId.ANALYTICS_REPORTS_TAB, componentName: 'Analytics.tsx' },
  [ScreenId.ANALYTICS_EXPORT]: { icon: BarChart3, label: 'Analytics: Export', path: ROUTES.ANALYTICS, screenId: ScreenId.ANALYTICS_EXPORT, componentName: 'Analytics.tsx' },
  
  // Design
  [ScreenId.SKU_LIST]: { icon: Layers, label: 'SKU Design', path: ROUTES.SKU_DESIGN, screenId: ScreenId.SKU_LIST, componentName: 'SkuList.tsx' },
  
  // Trace
  [ScreenId.CELL_LOTS_LIST]: { icon: Archive, label: 'Cell Serialization', path: ROUTES.CELL_SERIALIZATION_HAPPY, screenId: ScreenId.CELL_LOTS_LIST, componentName: 'CellLotsList.tsx' },
  [ScreenId.CELL_LOTS_CREATE]: { icon: Plus, label: 'Register Cell Shipment', path: ROUTES.CELL_SERIALIZATION_NEW, screenId: ScreenId.CELL_LOTS_CREATE, componentName: 'CreateCellLot.tsx' },
  [ScreenId.CELL_LOTS_DETAIL]: { icon: Search, label: 'Cell Lot Details', path: ROUTES.CELL_LOT_DETAIL, screenId: ScreenId.CELL_LOTS_DETAIL, componentName: 'CellLotDetail.tsx' },
  [ScreenId.LINEAGE_VIEW]: { icon: History, label: 'Lineage Audit', path: ROUTES.LINEAGE_AUDIT, screenId: ScreenId.LINEAGE_VIEW, componentName: 'LineageView.tsx' },
  
  // Operate
  [ScreenId.BATCHES_LIST]: { icon: Box, label: 'Manufacturing Batches', path: ROUTES.BATCHES, screenId: ScreenId.BATCHES_LIST, componentName: 'Batches.tsx' },
  [ScreenId.BATCHES_CREATE]: { icon: Box, label: 'Create Batch', path: ROUTES.BATCHES, screenId: ScreenId.BATCHES_CREATE, componentName: 'Batches.tsx' },
  [ScreenId.BATCHES_DETAIL]: { icon: Box, label: 'Batch Details', path: ROUTES.BATCH_DETAIL, screenId: ScreenId.BATCHES_DETAIL, componentName: 'BatchDetail.tsx' },
  
  [ScreenId.MODULE_ASSEMBLY_LIST]: { icon: Layers, label: 'Module Assembly', path: ROUTES.MODULE_ASSEMBLY, screenId: ScreenId.MODULE_ASSEMBLY_LIST, componentName: 'ModuleAssemblyList.tsx' },
  [ScreenId.MODULE_ASSEMBLY_DETAIL]: { icon: Layers, label: 'Module Detail', path: ROUTES.MODULE_ASSEMBLY_DETAIL, screenId: ScreenId.MODULE_ASSEMBLY_DETAIL, componentName: 'ModuleAssemblyDetail.tsx' },
  
  [ScreenId.PACK_ASSEMBLY_LIST]: { icon: Box, label: 'Pack Assembly', path: ROUTES.PACK_ASSEMBLY, screenId: ScreenId.PACK_ASSEMBLY_LIST, componentName: 'PackAssemblyList.tsx' },
  [ScreenId.PACK_ASSEMBLY_DETAIL]: { icon: Box, label: 'Pack Detail', path: ROUTES.PACK_ASSEMBLY_DETAIL, screenId: ScreenId.PACK_ASSEMBLY_DETAIL, componentName: 'PackAssemblyDetail.tsx' },
  
  [ScreenId.BATTERIES_LIST]: { icon: Fingerprint, label: 'Battery Identity', path: ROUTES.BATTERY_IDENTITY, screenId: ScreenId.BATTERIES_LIST, componentName: 'Batteries.tsx' },
  [ScreenId.BATTERIES_DETAIL]: { icon: Zap, label: 'Battery Detail', path: ROUTES.BATTERY_IDENTITY_DETAIL, screenId: ScreenId.BATTERIES_DETAIL, componentName: 'BatteryDetail.tsx' },
  
  [ScreenId.PROVISIONING]: { icon: Cpu, label: 'Provisioning Workstation', path: ROUTES.PROVISIONING_WORKSTATION, screenId: ScreenId.PROVISIONING, componentName: 'ProvisioningConsole.tsx' },
  [ScreenId.PROVISIONING_QUEUE]: { icon: Cpu, label: 'Provisioning Queue', path: ROUTES.PROVISIONING_QUEUE, screenId: ScreenId.PROVISIONING_QUEUE, componentName: 'ProvisioningQueue.tsx' },
  [ScreenId.PROVISIONING_STATION_SETUP]: { icon: Settings, label: 'Provisioning Setup', path: ROUTES.PROVISIONING_SETUP, screenId: ScreenId.PROVISIONING_STATION_SETUP, componentName: 'ProvisioningStationSetup.tsx' },
  
  [ScreenId.INVENTORY]: { icon: Warehouse, label: 'Inventory', path: ROUTES.INVENTORY, screenId: ScreenId.INVENTORY, componentName: 'InventoryList.tsx' },
  [ScreenId.DISPATCH]: { icon: Truck, label: 'Dispatch', path: ROUTES.DISPATCH_ORDERS, screenId: ScreenId.DISPATCH, componentName: 'DispatchList.tsx' },
  [ScreenId.DISPATCH_LIST]: { icon: Truck, label: 'Dispatch Orders', path: ROUTES.DISPATCH_ORDERS, screenId: ScreenId.DISPATCH_LIST, componentName: 'DispatchList.tsx' },
  [ScreenId.DISPATCH_DETAIL]: { icon: Truck, label: 'Dispatch Details', path: ROUTES.DISPATCH_DETAIL, screenId: ScreenId.DISPATCH_DETAIL, componentName: 'DispatchDetail.tsx' },

  // Assure
  [ScreenId.EOL_QA_QUEUE]: { icon: ClipboardCheck, label: 'EOL / QA Queue', path: ROUTES.EOL_QUEUE, screenId: ScreenId.EOL_QA_QUEUE, componentName: 'EolQaList.tsx' },
  [ScreenId.EOL_SETUP]: { icon: Settings, label: 'EOL Station Setup', path: ROUTES.EOL_SETUP, screenId: ScreenId.EOL_SETUP, componentName: 'EolStationSetup.tsx' },
  [ScreenId.EOL_REVIEW]: { icon: ClipboardList, label: 'EOL Review', path: ROUTES.EOL_REVIEW, screenId: ScreenId.EOL_REVIEW, componentName: 'EolReview.tsx' },
  [ScreenId.EOL_DETAILS]: { icon: Search, label: 'EOL Analysis', path: ROUTES.EOL_DETAILS, screenId: ScreenId.EOL_DETAILS, componentName: 'EolDetails.tsx' },
  [ScreenId.EOL_RUN_TEST]: { icon: Play, label: 'EOL Test Session', path: ROUTES.EOL_RUN, screenId: ScreenId.EOL_RUN_TEST, componentName: 'EolRunTest.tsx' },
  [ScreenId.EOL_AUDIT_DETAIL]: { icon: History, label: 'EOL Audit Detail', path: ROUTES.EOL_AUDIT, screenId: ScreenId.EOL_AUDIT_DETAIL, componentName: 'EolAuditDetail.tsx' },

  // Govern
  [ScreenId.COMPLIANCE]: { icon: ShieldCheck, label: 'Compliance', path: ROUTES.COMPLIANCE, screenId: ScreenId.COMPLIANCE, componentName: 'Compliance.tsx' },
  [ScreenId.COMPLIANCE_OVERVIEW_TAB]: { icon: ShieldCheck, label: 'Compliance: Overview', path: ROUTES.COMPLIANCE, screenId: ScreenId.COMPLIANCE_OVERVIEW_TAB, componentName: 'Compliance.tsx' },
  [ScreenId.COMPLIANCE_CHECKS_TAB]: { icon: ShieldCheck, label: 'Compliance: Checks', path: ROUTES.COMPLIANCE, screenId: ScreenId.COMPLIANCE_CHECKS_TAB, componentName: 'Compliance.tsx' },
  [ScreenId.COMPLIANCE_FINDINGS_TAB]: { icon: ShieldCheck, label: 'Compliance: Findings', path: ROUTES.COMPLIANCE, screenId: ScreenId.COMPLIANCE_FINDINGS_TAB, componentName: 'Compliance.tsx' },
  [ScreenId.COMPLIANCE_EVIDENCE_TAB]: { icon: ShieldCheck, label: 'Compliance: Evidence', path: ROUTES.COMPLIANCE, screenId: ScreenId.COMPLIANCE_EVIDENCE_TAB, componentName: 'Compliance.tsx' },
  [ScreenId.COMPLIANCE_AUDIT_TRAIL_TAB]: { icon: ShieldCheck, label: 'Compliance: Audit', path: ROUTES.COMPLIANCE, screenId: ScreenId.COMPLIANCE_AUDIT_TRAIL_TAB, componentName: 'Compliance.tsx' },
  [ScreenId.COMPLIANCE_FUTURE_TAB]: { icon: ShieldCheck, label: 'Compliance: Future', path: ROUTES.COMPLIANCE, screenId: ScreenId.COMPLIANCE_FUTURE_TAB, componentName: 'Compliance.tsx' },
  [ScreenId.COMPLIANCE_FINDINGS_EDIT]: { icon: ShieldCheck, label: 'Compliance: Edit Finding', path: ROUTES.COMPLIANCE, screenId: ScreenId.COMPLIANCE_FINDINGS_EDIT, componentName: 'Compliance.tsx' },
  [ScreenId.COMPLIANCE_DPP_PREVIEW]: { icon: Globe, label: 'DPP Preview', path: ROUTES.COMPLIANCE, screenId: ScreenId.COMPLIANCE_DPP_PREVIEW, componentName: 'Compliance.tsx' },
  [ScreenId.COMPLIANCE_SUSTAINABILITY_PREVIEW]: { icon: Leaf, label: 'Sust. Preview', path: ROUTES.COMPLIANCE, screenId: ScreenId.COMPLIANCE_SUSTAINABILITY_PREVIEW, componentName: 'Compliance.tsx' },
  [ScreenId.COMPLIANCE_RECYCLING_PREVIEW]: { icon: Recycle, label: 'Recycle Preview', path: ROUTES.COMPLIANCE, screenId: ScreenId.COMPLIANCE_RECYCLING_PREVIEW, componentName: 'Compliance.tsx' },
  [ScreenId.COMPLIANCE_REG_EXPORT_PREVIEW]: { icon: FileText, label: 'Reg. Export Preview', path: ROUTES.COMPLIANCE, screenId: ScreenId.COMPLIANCE_REG_EXPORT_PREVIEW, componentName: 'Compliance.tsx' },

  [ScreenId.CUSTODY]: { icon: History, label: 'Chain of Custody', path: ROUTES.CUSTODY, screenId: ScreenId.CUSTODY, componentName: 'Custody.tsx' },
  [ScreenId.CUSTODY_OVERVIEW]: { icon: History, label: 'Custody: Overview', path: ROUTES.CUSTODY, screenId: ScreenId.CUSTODY_OVERVIEW, componentName: 'Custody.tsx' },
  [ScreenId.CUSTODY_LIST]: { icon: History, label: 'Custody: List', path: ROUTES.CUSTODY, screenId: ScreenId.CUSTODY_LIST, componentName: 'Custody.tsx' },
  [ScreenId.CUSTODY_EXCEPTIONS]: { icon: History, label: 'Custody: Exceptions', path: ROUTES.CUSTODY, screenId: ScreenId.CUSTODY_EXCEPTIONS, componentName: 'Custody.tsx' },
  [ScreenId.CUSTODY_RECEIVE_ACTION]: { icon: History, label: 'Custody: Receive', path: ROUTES.CUSTODY, screenId: ScreenId.CUSTODY_RECEIVE_ACTION, componentName: 'Custody.tsx' },
  [ScreenId.CUSTODY_ACCEPT_REJECT_ACTION]: { icon: History, label: 'Custody: Accept/Reject', path: ROUTES.CUSTODY, screenId: ScreenId.CUSTODY_ACCEPT_REJECT_ACTION, componentName: 'Custody.tsx' },
  
  // Resolve
  [ScreenId.WARRANTY]: { icon: FileText, label: 'Warranty & Returns', path: ROUTES.WARRANTY_RETURNS, screenId: ScreenId.WARRANTY, componentName: 'Warranty.tsx' },
  [ScreenId.WARRANTY_OVERVIEW]: { icon: FileText, label: 'Warranty: Overview', path: ROUTES.WARRANTY_RETURNS, screenId: ScreenId.WARRANTY_OVERVIEW, componentName: 'Warranty.tsx' },
  [ScreenId.WARRANTY_CLAIMS_LIST]: { icon: FileText, label: 'Warranty: List', path: ROUTES.WARRANTY_RETURNS, screenId: ScreenId.WARRANTY_CLAIMS_LIST, componentName: 'Warranty.tsx' },
  [ScreenId.WARRANTY_EXTERNAL_INTAKE]: { icon: FileSpreadsheet, label: 'Submit Claim', path: ROUTES.WARRANTY_INTAKE, screenId: ScreenId.WARRANTY_EXTERNAL_INTAKE, componentName: 'WarrantyIntake.tsx' },
  [ScreenId.WARRANTY_CREATE_CLAIM_INTERNAL]: { icon: FileText, label: 'Warranty: Create Internal', path: ROUTES.WARRANTY_RETURNS, screenId: ScreenId.WARRANTY_CREATE_CLAIM_INTERNAL, componentName: 'Warranty.tsx' },
  [ScreenId.WARRANTY_UPDATE_CLAIM_INTERNAL]: { icon: FileText, label: 'Warranty: Update Internal', path: ROUTES.WARRANTY_RETURNS, screenId: ScreenId.WARRANTY_UPDATE_CLAIM_INTERNAL, componentName: 'Warranty.tsx' },
  [ScreenId.WARRANTY_DECIDE_DISPOSITION]: { icon: FileText, label: 'Warranty: Decide', path: ROUTES.WARRANTY_RETURNS, screenId: ScreenId.WARRANTY_DECIDE_DISPOSITION, componentName: 'Warranty.tsx' },
  [ScreenId.WARRANTY_CLOSE_CLAIM]: { icon: FileText, label: 'Warranty: Close', path: ROUTES.WARRANTY_RETURNS, screenId: ScreenId.WARRANTY_CLOSE_CLAIM, componentName: 'Warranty.tsx' },
  [ScreenId.WARRANTY_EXPORT]: { icon: FileText, label: 'Warranty: Export', path: ROUTES.WARRANTY_RETURNS, screenId: ScreenId.WARRANTY_EXPORT, componentName: 'Warranty.tsx' },

  // Admin
  [ScreenId.SETTINGS]: { icon: Settings, label: 'Settings', path: ROUTES.SETTINGS, screenId: ScreenId.SETTINGS, componentName: 'Settings.tsx' },
  [ScreenId.SETTINGS_PROFILE]: { icon: Settings, label: 'Settings: Profile', path: ROUTES.SETTINGS, screenId: ScreenId.SETTINGS_PROFILE, componentName: 'Settings.tsx' },
  [ScreenId.SETTINGS_USERS]: { icon: Settings, label: 'Settings: Users', path: ROUTES.SETTINGS, screenId: ScreenId.SETTINGS_USERS, componentName: 'Settings.tsx' },
  [ScreenId.SETTINGS_API_KEYS]: { icon: Settings, label: 'Settings: API', path: ROUTES.SETTINGS, screenId: ScreenId.SETTINGS_API_KEYS, componentName: 'Settings.tsx' },
  [ScreenId.SETTINGS_NOTIFICATIONS]: { icon: Settings, label: 'Settings: Notif', path: ROUTES.SETTINGS, screenId: ScreenId.SETTINGS_NOTIFICATIONS, componentName: 'Settings.tsx' },
  [ScreenId.SETTINGS_WEBHOOKS]: { icon: Settings, label: 'Settings: Webhooks', path: ROUTES.SETTINGS, screenId: ScreenId.SETTINGS_WEBHOOKS, componentName: 'Settings.tsx' },
  [ScreenId.SETTINGS_EXPORT]: { icon: Settings, label: 'Settings: Export', path: ROUTES.SETTINGS, screenId: ScreenId.SETTINGS_EXPORT, componentName: 'Settings.tsx' },
  [ScreenId.RBAC_VIEW]: { icon: Shield, label: 'Access Audit', path: ROUTES.ACCESS_AUDIT, screenId: ScreenId.RBAC_VIEW, componentName: 'RbacAdmin.tsx' },
  
  // Diagnostics
  [ScreenId.SYSTEM_HEALTH]: { icon: Activity, label: 'System Health', path: ROUTES.SYSTEM_HEALTH, screenId: ScreenId.SYSTEM_HEALTH, componentName: 'DiagnosticsPage.tsx' },
};

/**
 * Validates if the current pathname matches a registered route pattern.
 */
export function isRouteRegistered(pathname: string): boolean {
  return (Object.values(APP_ROUTES) as RouteConfig[]).some(config => 
    !!matchPath({ path: config.path, end: true }, pathname)
  );
}

/**
 * Identifies the ScreenId for a given pathname based on registered routes.
 * Added to resolve module member missing error in src/components/Layout.tsx.
 */
export function getScreenIdForPath(pathname: string): ScreenId | undefined {
  const match = (Object.values(APP_ROUTES) as RouteConfig[]).find(config => 
    !!matchPath({ path: config.path, end: true }, pathname)
  );
  return match?.screenId;
}

/**
 * Diagnostic self-test for registered paths.
 */
export function assertRegisteredPaths() {
  const warnings: string[] = [];
  (Object.values(ScreenId) as string[]).forEach(id => {
      if (!APP_ROUTES[id]) warnings.push(`[REGISTRY_FAIL] Missing config for: ${id}`);
  });
  if (warnings.length > 0) {
      console.warn("Route Registry Self-Test Warnings:", warnings);
  }
  return warnings;
}

export function checkConsistency() {
  return assertRegisteredPaths();
}