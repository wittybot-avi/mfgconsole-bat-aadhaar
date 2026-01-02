/**
 * Global Route Constants (PP-056D)
 */
export const ROUTES = {
  DASHBOARD: '/',
  LOGIN: '/login',
  
  // Observe
  TELEMETRY: '/telemetry',
  ANALYTICS: '/analytics',

  // Design
  SKU_DESIGN: '/design/sku',
  SKU_DETAIL: '/design/sku/:id',
  
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
  BATTERY_IDENTITY: '/operate/identity',
  BATTERY_IDENTITY_DETAIL: '/operate/identity/:id',
  INVENTORY: '/operate/inventory',
  INVENTORY_DETAIL: '/operate/inventory/:id',
  DISPATCH: '/operate/dispatch',
  DISPATCH_ORDERS: '/operate/dispatch',
  DISPATCH_DETAIL: '/operate/dispatch/:id',

  // Provisioning
  PROVISIONING_QUEUE: '/operate/provisioning/queue',
  PROVISIONING_SETUP: '/operate/provisioning/setup',
  PROVISIONING_WORKSTATION: '/operate/provisioning/workstation',

  // Assure
  EOL_QUEUE: '/assure/eol',
  EOL_DETAILS: '/assure/eol/details/:buildId',
  EOL_SETUP: '/assure/eol/stations',
  EOL_REVIEW: '/assure/eol/review',
  EOL_RUN: '/assure/eol/run/:buildId',
  EOL_AUDIT: '/assure/eol/audit/:buildId',

  // Govern & Resolve
  COMPLIANCE: '/govern/compliance',
  CUSTODY: '/govern/chain-of-custody',
  CUSTODY_DETAIL: '/govern/chain-of-custody/:dispatchId',
  WARRANTY_RETURNS: '/resolve/warranty-returns',
  WARRANTY_CLAIM_DETAIL: '/resolve/warranty-returns/claims/:claimId',
  WARRANTY_INTAKE: '/warranty/intake',

  // Admin
  SETTINGS: '/admin/settings',
  ACCESS_AUDIT: '/admin/access-audit',
  SYSTEM_HEALTH: '/diagnostics/system-health',

  // Guided
  RUNBOOKS: '/runbooks',
  RUNBOOK_DETAIL: '/runbooks/:runbookId',
};

/**
 * CANONICAL ROUTE BUILDERS
 */
const safeId = (id?: string) => id ? encodeURIComponent(id) : 'UNKNOWN';

export const routes = {
  dashboard: () => ROUTES.DASHBOARD,
  login: () => ROUTES.LOGIN,
  
  // Observe
  telemetry: () => ROUTES.TELEMETRY,
  analytics: () => ROUTES.ANALYTICS,
  
  // Design
  skuList: () => ROUTES.SKU_DESIGN,
  skuDetails: (id?: string) => ROUTES.SKU_DETAIL.replace(':id', safeId(id)),

  // Operate
  batchesList: () => ROUTES.BATCHES,
  batchDetails: (id?: string) => ROUTES.BATCH_DETAIL.replace(':id', safeId(id)),
  
  moduleAssemblyList: () => ROUTES.MODULE_ASSEMBLY,
  moduleDetails: (id?: string) => ROUTES.MODULE_ASSEMBLY_DETAIL.replace(':id', safeId(id)),
  
  packAssemblyList: () => ROUTES.PACK_ASSEMBLY,
  packDetails: (id?: string) => ROUTES.PACK_ASSEMBLY_DETAIL.replace(':id', safeId(id)),
  packBuildDetails: (id?: string) => ROUTES.PACK_ASSEMBLY_DETAIL.replace(':id', safeId(id)),
  
  batteryIdentityList: () => ROUTES.BATTERY_IDENTITY,
  batteryIdentityDetails: (id?: string) => ROUTES.BATTERY_IDENTITY_DETAIL.replace(':id', safeId(id)),

  inventoryList: () => ROUTES.INVENTORY,
  inventoryItem: (id?: string) => ROUTES.INVENTORY_DETAIL.replace(':id', safeId(id)),
  inventoryDetails: (id?: string) => ROUTES.INVENTORY_DETAIL.replace(':id', safeId(id)),

  dispatchList: () => ROUTES.DISPATCH,
  dispatchDetails: (id?: string) => ROUTES.DISPATCH_DETAIL.replace(':id', safeId(id)),

  // Assure
  eolHome: () => ROUTES.EOL_QUEUE,
  eolQueue: () => ROUTES.EOL_QUEUE,
  eolDetails: (id?: string) => ROUTES.EOL_DETAILS.replace(':buildId', safeId(id)),
  eolStationSetup: () => ROUTES.EOL_SETUP,
  eolReview: () => ROUTES.EOL_REVIEW,

  // Trace
  cellLotDetails: (id?: string) => ROUTES.CELL_LOT_DETAIL.replace(':lotId', safeId(id)),
  lineageAudit: (id?: string) => id ? ROUTES.LINEAGE_AUDIT_DETAIL.replace(':id', safeId(id)) : ROUTES.LINEAGE_AUDIT
};