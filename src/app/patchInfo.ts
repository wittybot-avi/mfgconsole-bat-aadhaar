/**
 * PATCH REGISTRY SYSTEM
 */

export interface PatchMetadata {
  id: string;
  name: string;
  date: string;
  description: string;
  type: 'foundation' | 'feature' | 'hotfix';
}

export const APP_VERSION = '1.8.9n';

export const CURRENT_PATCH: PatchMetadata = {
  id: "P-056A",
  name: "HOTFIX_WHITESCREEN_BOOT_GUARD",
  date: "2024-05-24",
  description: "Restored rendering by making the route registry, diagnostics, and RBAC guards boot-safe.",
  type: "hotfix"
};

export const PATCH_LEVEL = '56A';
export const LAST_PATCH_ID = CURRENT_PATCH.name;

export const PATCH_HISTORY: PatchMetadata[] = [
  CURRENT_PATCH,
  {
    id: "P-056",
    name: "ROUTE_LEDGER_RECONCILE_AND_SINGLE_DIAGNOSTIC",
    date: "2024-05-24",
    description: "Eliminated 'Unknown Coordinates' errors by reconciling the route ledger and unified diagnostic UI.",
    type: "hotfix"
  },
  {
    id: "P-055",
    name: "TRACE_ROUTES_FIX_HUD_CLEANUP",
    date: "2024-05-24",
    description: "Resolved Lineage redirect loop, fixed 'New Lot' sync hang, and consolidated redundant debug HUDs.",
    type: "hotfix"
  }
];