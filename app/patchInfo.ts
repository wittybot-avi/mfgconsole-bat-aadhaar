/**
 * PATCH REGISTRY SYSTEM - SINGLE SOURCE OF TRUTH (PP-056D)
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
  id: "PP-056D",
  name: "BATCH_TO_MODULE_WORKFLOW",
  date: "2024-05-24",
  description: "Enabled end-to-end handoff from Manufacturing Batches to Module Assembly with automated module generation.",
  type: "hotfix"
};

export const PATCH_LEVEL = '56D';
export const LAST_PATCH_ID = CURRENT_PATCH.name;

export const PATCH_HISTORY: PatchMetadata[] = [
  CURRENT_PATCH,
  {
    id: "PP-056C",
    name: "CANONICAL_NAVIGATION_BUILDERS",
    date: "2024-05-24",
    description: "Replaced hardcoded path strings and manual replacements with centralized canonical route builders.",
    type: "hotfix"
  },
  {
    id: "PP-056B",
    name: "DIAGNOSTIC_CONSOLIDATION_AND_HUD_STABILIZATION",
    date: "2024-05-24",
    description: "Reintroduced standardized HUD and Unified Diagnostic Panel while removing redundant legacy debug overlays.",
    type: "hotfix"
  },
  {
    id: "PP-056F",
    name: "HOTFIX_EOL_ROUTE_LEDGER_AND_VERSION_STABILIZATION",
    date: "2024-05-24",
    description: "Synchronized EOL route ledger and consolidated versioning into a single source of truth to eliminate routing and labeling drift.",
    type: "hotfix"
  }
];