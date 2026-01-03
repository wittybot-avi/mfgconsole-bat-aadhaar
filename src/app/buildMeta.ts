/**
 * BUILD METADATA - SINGLE SOURCE OF TRUTH (PPP-056F)
 */

export interface PatchHistoryEntry {
  patchId: string;
  patchName: string;
  updatedAt: string;
}

export const buildMeta = {
  appVersion: '1.8.9n',
  patchId: 'PPP-056F',
  patchName: 'HUD_BUILD_META_TRACKER',
  updatedAt: '2024-05-24',
  changeNotes: [
    'Consolidated build metadata into single source of truth (buildMeta.ts)',
    'Integrated versioning and patch history directly into the Console HUD',
    'Removed legacy version stamps from sidebar footer to reduce UI noise',
    'Standardized revision tracking across all diagnostic layers',
    'Enabled collapsible revision history panel within the HUD'
  ],
  history: [
    { patchId: 'PPP-056F', patchName: 'HUD_BUILD_META_TRACKER', updatedAt: '2024-05-24' },
    { patchId: 'PP-056E', patchName: 'OBSERVE_RESTORATION', updatedAt: '2024-05-24' },
    { patchId: 'PP-056D', patchName: 'BATCH_TO_MODULE', updatedAt: '2024-05-24' },
    { patchId: 'PP-056C', patchName: 'CANONICAL_NAVIGATION', updatedAt: '2024-05-24' },
    { patchId: 'PP-056B', patchName: 'DIAGNOSTIC_CONSOLIDATION', updatedAt: '2024-05-24' },
    { patchId: 'P-056A', patchName: 'WHITESCREEN_BOOT_GUARD', updatedAt: '2024-05-24' },
    { patchId: 'P-056', patchName: 'ROUTE_LEDGER_RECONCILE', updatedAt: '2024-05-24' },
    { patchId: 'P-055', patchName: 'TRACE_ROUTES_FIX', updatedAt: '2024-05-24' }
  ] as PatchHistoryEntry[]
};