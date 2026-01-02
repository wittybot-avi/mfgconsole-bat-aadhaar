/**
 * Global Route Constants
 */
export const ROUTES = {
  DASHBOARD: '/',
  LOGIN: '/login',
  
  // SOP Guide
  RUNBOOKS: '/runbooks',
  RUNBOOK_DETAIL: '/runbooks/:runbookId',
  
  // Observe
  TELEMETRY: '/telemetry',
  ANALYTICS: '/analytics',
  
  // Design
  SKU_DESIGN: '/sku',
  SKU_DETAIL: '/sku/:id',
  
  // Trace
  CELL_SERIALIZATION: '/trace/cells',
  CELL_SERIALIZATION_HAPPY: '/trace/cells/lot-happy',
  CELL_SERIALIZATION_NEW: '/trace/cells/new',
  CELL_LOT_DETAIL: '/trace/cells/:lotId',
  LINEAGE_AUDIT: '/trace/lineage',
  LINEAGE_AUDIT_DETAIL: '/trace/lineage/:id',
  
  // Operate
  BATCHES: '/operate/batches',
  BATCH_DETAIL: '/operate/batches/:id',
  MODULE_ASSEMBLY: '/operate/modules',
  MODULE_ASSEMBLY_DETAIL: '/operate/modules/:id',
  PACK_ASSEMBLY: '/operate/packs',
  PACK_ASSEMBLY_DETAIL: '/operate/packs/:id',
  BATTERY_IDENTITY: '/operate/batteries',
  BATTERY_IDENTITY_DETAIL: '/operate/batteries/:id',
  
  PROVISIONING_QUEUE: '/manufacturing/provisioning/queue',
  PROVISIONING_SETUP: '/manufacturing/provisioning/setup',
  PROVISIONING_WORKSTATION: '/assure/provisioning/:batteryId',
  
  INVENTORY: '/inventory',
  DISPATCH: '/dispatch',
  DISPATCH_ORDERS: '/dispatch',
  DISPATCH_DETAIL: '/dispatch/:orderId',

  // Assure (EOL Canonical Namespace)
  EOL_QUEUE: '/assure/eol',
  EOL_SETUP: '/assure/eol/station-setup',
  EOL_REVIEW: '/assure/eol/review',
  EOL_DETAILS: '/assure/eol/details/:buildId',
  EOL_RUN: '/assure/eol/run/:buildId',
  EOL_AUDIT: '/assure/eol/audit/:buildId',

  // Resolve
  WARRANTY_RETURNS: '/resolve/warranty-returns',
  WARRANTY_CLAIM_DETAIL: '/resolve/warranty-returns/claims/:claimId',
  WARRANTY_INTAKE: '/warranty/intake',

  // Govern
  COMPLIANCE: '/govern/compliance',
  CUSTODY: '/govern/chain-of-custody',
  CUSTODY_DETAIL: '/govern/chain-of-custody/:dispatchId',

  // Admin
  SETTINGS: '/admin/settings',
  ACCESS_AUDIT: '/admin/access-audit',

  // Diagnostics
  SYSTEM_HEALTH: '/diagnostics/system-health'
};

/**
 * CANONICAL ROUTE BUILDERS (PP-056C/F)
 * Use these for all UI navigation to ensure param safety and encoding.
 */
const safeId = (id?: string) => id ? encodeURIComponent(id) : '';

export const routes = {
  dashboard: () => ROUTES.DASHBOARD,
  login: () => ROUTES.LOGIN,
  
  // Design
  skuList: () => ROUTES.SKU_DESIGN,
  skuDetails: (id?: string) => id ? ROUTES.SKU_DETAIL.replace(':id', safeId(id)) : ROUTES.SKU_DESIGN,

  // Operate
  batchesList: () => ROUTES.BATCHES,
  batchDetails: (id?: string) => id ? ROUTES.BATCH_DETAIL.replace(':id', safeId(id)) : ROUTES.BATCHES,
  
  moduleAssemblyList: () => ROUTES.MODULE_ASSEMBLY,
  moduleDetails: (id?: string) => id ? ROUTES.MODULE_ASSEMBLY_DETAIL.replace(':id', safeId(id)) : ROUTES.MODULE_ASSEMBLY,
  
  packAssemblyList: () => ROUTES.PACK_ASSEMBLY,
  packDetails: (id?: string) => id ? ROUTES.PACK_ASSEMBLY_DETAIL.replace(':id', safeId(id)) : ROUTES.PACK_ASSEMBLY,
  packBuildDetails: (id?: string) => id ? ROUTES.PACK_ASSEMBLY_DETAIL.replace(':id', safeId(id)) : ROUTES.PACK_ASSEMBLY,
  
  batteryIdentityList: () => ROUTES.BATTERY_IDENTITY,
  batteryIdentityDetails: (id?: string) => id ? ROUTES.BATTERY_IDENTITY_DETAIL.replace(':id', safeId(id)) : ROUTES.BATTERY_IDENTITY,

  inventoryList: () => ROUTES.INVENTORY,
  inventoryDetails: (id?: string) => id ? ROUTES.BATTERY_IDENTITY_DETAIL.replace(':id', safeId(id)) : ROUTES.INVENTORY,

  dispatchList: () => ROUTES.DISPATCH_ORDERS,
  dispatchDetails: (id?: string) => id ? ROUTES.DISPATCH_DETAIL.replace(':orderId', safeId(id)) : ROUTES.DISPATCH_ORDERS,

  // Assure (EOL)
  eolQueue: () => ROUTES.EOL_QUEUE,
  eolDetails: (id?: string) => id ? ROUTES.EOL_DETAILS.replace(':buildId', safeId(id)) : ROUTES.EOL_QUEUE,
  eolRunTest: (id?: string) => id ? ROUTES.EOL_RUN.replace(':buildId', safeId(id)) : ROUTES.EOL_QUEUE,
  eolAudit: (id?: string) => id ? ROUTES.EOL_AUDIT.replace(':buildId', safeId(id)) : ROUTES.EOL_QUEUE,

  // Trace
  cellLotDetails: (id?: string) => id ? ROUTES.CELL_LOT_DETAIL.replace(':lotId', safeId(id)) : ROUTES.CELL_SERIALIZATION_HAPPY,
  lineageAudit: (id?: string) => id ? ROUTES.LINEAGE_AUDIT_DETAIL.replace(':id', safeId(id)) : ROUTES.LINEAGE_AUDIT
};