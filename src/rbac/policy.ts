import { ScreenId } from './screenIds';
import { PermissionVerb } from './verbs';

export type PolicyMap = Record<string, Partial<Record<ScreenId, PermissionVerb[]>>>;

export const RBAC_POLICY: PolicyMap = {
  // C1: Executive - View All
  C1: {
    [ScreenId.RUNBOOK_HUB]: ['V'],
    [ScreenId.RUNBOOK_DETAIL]: ['V'],
    [ScreenId.DASHBOARD]: ['V'],
    [ScreenId.DASHBOARD_EXEC_SUMMARY]: ['V'],
    [ScreenId.DASHBOARD_PRODUCTION]: ['V'],
    [ScreenId.DASHBOARD_QUALITY]: ['V'],
    [ScreenId.DASHBOARD_LOGISTICS]: ['V'],
    [ScreenId.DASHBOARD_RISK_COMPLIANCE]: ['V'],
    [ScreenId.TELEMETRY]: ['V'],
    [ScreenId.TELEMETRY_HISTORY_VIEW]: ['V'],
    [ScreenId.ANALYTICS]: ['V'],
    [ScreenId.ANALYTICS_OVERVIEW_TAB]: ['V'],
    [ScreenId.BATCHES_LIST]: ['V'],
    [ScreenId.BATCHES_DETAIL]: ['V'],
    [ScreenId.BATTERIES_LIST]: ['V'],
    [ScreenId.BATTERIES_DETAIL]: ['V'],
    [ScreenId.CELL_LOTS_LIST]: ['V'],
    [ScreenId.CELL_LOTS_DETAIL]: ['V'],
    [ScreenId.EOL_QA_QUEUE]: ['V'],
    [ScreenId.EOL_DETAILS]: ['V'],
    [ScreenId.COMPLIANCE]: ['V'],
    [ScreenId.COMPLIANCE_OVERVIEW_TAB]: ['V'],
    [ScreenId.WARRANTY]: ['V'],
    [ScreenId.WARRANTY_OVERVIEW]: ['V'],
    [ScreenId.SETTINGS]: ['V'],
    [ScreenId.SETTINGS_PROFILE]: ['V'],
  },

  // C2: Manufacturing - Shopfloor execution
  C2: {
    [ScreenId.RUNBOOK_HUB]: ['V'],
    [ScreenId.RUNBOOK_DETAIL]: ['V'],
    [ScreenId.DASHBOARD]: ['V'],
    [ScreenId.DASHBOARD_PRODUCTION]: ['V'],
    [ScreenId.BATCHES_LIST]: ['V', 'C', 'E'],
    [ScreenId.BATCHES_CREATE]: ['C'],
    [ScreenId.BATCHES_DETAIL]: ['V', 'E'],
    [ScreenId.MODULE_ASSEMBLY_LIST]: ['V', 'C', 'E'],
    [ScreenId.MODULE_ASSEMBLY_DETAIL]: ['V', 'E', 'X'],
    [ScreenId.PACK_ASSEMBLY_LIST]: ['V', 'C', 'E'],
    [ScreenId.PACK_ASSEMBLY_DETAIL]: ['V', 'E', 'X'],
    [ScreenId.BATTERIES_LIST]: ['V', 'C'],
    [ScreenId.BATTERIES_DETAIL]: ['V'],
    [ScreenId.CELL_LOTS_LIST]: ['V'],
    [ScreenId.CELL_LOTS_DETAIL]: ['V'],
    [ScreenId.EOL_QA_QUEUE]: ['V'],
    [ScreenId.EOL_DETAILS]: ['V'],
    [ScreenId.TELEMETRY]: ['V'],
  },

  // C3: Quality - Testing & Approval
  C3: {
    [ScreenId.RUNBOOK_HUB]: ['V'],
    [ScreenId.RUNBOOK_DETAIL]: ['V'],
    [ScreenId.DASHBOARD]: ['V'],
    [ScreenId.DASHBOARD_QUALITY]: ['V'],
    [ScreenId.DASHBOARD_RISK_COMPLIANCE]: ['V'],
    [ScreenId.PACK_ASSEMBLY_LIST]: ['V'],
    [ScreenId.PACK_ASSEMBLY_DETAIL]: ['V', 'E', 'A'],
    [ScreenId.CELL_LOTS_LIST]: ['V'],
    [ScreenId.CELL_LOTS_DETAIL]: ['V'],
    [ScreenId.EOL_QA_QUEUE]: ['V', 'C', 'E', 'A', 'X'],
    [ScreenId.EOL_DETAILS]: ['V', 'E', 'A', 'X'],
    [ScreenId.EOL_SETUP]: ['V', 'E', 'M'],
    [ScreenId.EOL_REVIEW]: ['V'],
    [ScreenId.COMPLIANCE]: ['V', 'C', 'E'],
    [ScreenId.COMPLIANCE_CHECKS_TAB]: ['V'],
    [ScreenId.COMPLIANCE_FINDINGS_TAB]: ['V', 'C', 'E'],
    [ScreenId.WARRANTY]: ['V', 'E'],
  },

  // C4: IT & Engineering - Full Config
  C4: {
    [ScreenId.RUNBOOK_HUB]: ['V'],
    [ScreenId.RUNBOOK_DETAIL]: ['V'],
    [ScreenId.DASHBOARD]: ['V'],
    [ScreenId.SETTINGS]: ['V', 'E', 'M'],
    [ScreenId.SETTINGS_USERS]: ['V', 'E', 'M'],
    [ScreenId.SETTINGS_API_KEYS]: ['V', 'E', 'M'],
    [ScreenId.RBAC_VIEW]: ['V', 'M'],
    [ScreenId.COMPLIANCE]: ['V'],
  },

  // C5: BMS & Firmware
  C5: {
    [ScreenId.RUNBOOK_HUB]: ['V'],
    [ScreenId.RUNBOOK_DETAIL]: ['V'],
    [ScreenId.DASHBOARD]: ['V'],
    [ScreenId.PROVISIONING]: ['V', 'E', 'X'],
    [ScreenId.TELEMETRY]: ['V', 'E'],
    [ScreenId.TELEMETRY_LIVE_VIEW]: ['V', 'E'],
    [ScreenId.BATTERIES_DETAIL]: ['V', 'E'],
  },
  
  // C6: Logistics
  C6: {
    [ScreenId.RUNBOOK_HUB]: ['V'],
    [ScreenId.RUNBOOK_DETAIL]: ['V'],
    [ScreenId.DASHBOARD]: ['V'],
    [ScreenId.DASHBOARD_LOGISTICS]: ['V'],
    [ScreenId.INVENTORY]: ['V', 'E', 'X'],
    [ScreenId.CELL_LOTS_LIST]: ['V', 'C', 'E'],
    [ScreenId.CELL_LOTS_CREATE]: ['C'],
    [ScreenId.CELL_LOTS_DETAIL]: ['V', 'E'],
    [ScreenId.DISPATCH_LIST]: ['V', 'C', 'E', 'X'],
    [ScreenId.DISPATCH_DETAIL]: ['V', 'E', 'X'],
    [ScreenId.CUSTODY]: ['V', 'X'],
    [ScreenId.CUSTODY_LIST]: ['V'],
    [ScreenId.CUSTODY_RECEIVE_ACTION]: ['X'],
  },

  // C7: Warranty
  C7: {
    [ScreenId.RUNBOOK_HUB]: ['V'],
    [ScreenId.RUNBOOK_DETAIL]: ['V'],
    [ScreenId.WARRANTY]: ['V', 'E', 'A', 'X'],
    [ScreenId.WARRANTY_OVERVIEW]: ['V'],
    [ScreenId.WARRANTY_CLAIMS_LIST]: ['V', 'E'],
    [ScreenId.BATTERIES_DETAIL]: ['V'],
  },

  // C8: Compliance
  C8: {
    [ScreenId.RUNBOOK_HUB]: ['V'],
    [ScreenId.RUNBOOK_DETAIL]: ['V'],
    [ScreenId.COMPLIANCE]: ['V', 'C', 'E', 'A', 'M'],
    [ScreenId.COMPLIANCE_OVERVIEW_TAB]: ['V'],
    [ScreenId.COMPLIANCE_CHECKS_TAB]: ['V', 'M'],
    [ScreenId.RBAC_VIEW]: ['V'],
  },

  // C9: External Partners
  C9: {
    [ScreenId.RUNBOOK_HUB]: ['V'],
    [ScreenId.RUNBOOK_DETAIL]: ['V'],
    [ScreenId.DASHBOARD]: ['V'],
    [ScreenId.CUSTODY]: ['V', 'X'],
    [ScreenId.CUSTODY_ACCEPT_REJECT_ACTION]: ['X'],
    [ScreenId.WARRANTY_EXTERNAL_INTAKE]: ['V', 'C'],
    [ScreenId.BATTERIES_LIST]: ['V'],
  }
};