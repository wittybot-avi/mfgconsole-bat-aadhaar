import { routes } from '../../app/routes';
import { ScreenId } from '../rbac/screenIds';

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
 * SINGLE SOURCE OF TRUTH FOR SIDEBAR (PP-061)
 */
export const NAV_SECTIONS: NavSection[] = [
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
    sectionId: 'GOVERN',
    label: 'Govern',
    items: [
      { id: 'compliance', label: 'Compliance', screenId: ScreenId.COMPLIANCE, href: () => routes.compliance() },
      { id: 'custody', label: 'Chain of Custody', screenId: ScreenId.CUSTODY, href: () => routes.custody() },
      { id: 'access-audit', label: 'Access Audit', screenId: ScreenId.RBAC_VIEW, href: () => routes.accessAudit() },
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
      { id: 'rbac-admin', label: 'Permissions Matrix', screenId: ScreenId.RBAC_VIEW, href: () => routes.accessAudit() },
    ]
  }
];