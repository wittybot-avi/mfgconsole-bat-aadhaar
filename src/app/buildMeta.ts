/**
 * BUILD METADATA - SINGLE SOURCE OF TRUTH (PP-059)
 */

export interface PatchHistoryEntry {
  patchId: string;
  patchName: string;
  updatedAt: string;
}

export const buildMeta = {
  appVersion: '1.8.9n',
  patchId: 'PP-059',
  patchName: 'NAV_GUARDRAILS_AND_REGISTRY_CONSISTENCY',
  updatedAt: '2024-05-24',
  changeNotes: [
    'Implemented runtime navigation validator to detect drift between sidebar configuration and route registry.',
    'Enhanced sidebar resilience with "Section unavailable" placeholders to prevent silent item disappearance.',
    'Standardized all navigation items to use canonical route builders from routes.ts exclusively.',
    'Added top-level module coverage patterns to routeRegistry to prevent Unknown Coordinates at root paths.',
    'Exposed navigation drift warnings directly in the Unified Diagnostic Panel for faster debugging.',
    'Updated build metadata to single source of truth PP-059'
  ],
  history: [
    { patchId: 'PP-059', patchName: 'NAV_GUARDRAILS_AND_REGISTRY_CONSISTENCY', updatedAt: '2024-05-24' },
    { patchId: 'PP-058', patchName: 'NAV_RESTRUCTURE_TO_TARGET_TAXONOMY', updatedAt: '2024-05-24' },
    { patchId: 'PP-057', patchName: 'RESTORE_MISSING_SCREENS_AND_SECTION_GUARDS', updatedAt: '2024-05-24' },
    { patchId: 'PPP-056F', patchName: 'HUD_BUILD_META_TRACKER', updatedAt: '2024-05-24' },
    { patchId: 'PP-056E', patchName: 'OBSERVE_RESTORATION', updatedAt: '2024-05-24' },
    { patchId: 'PP-056D', patchName: 'BATCH_TO_MODULE', updatedAt: '2024-05-24' },
    { patchId: 'PP-056C', patchName: 'CANONICAL_NAVIGATION', updatedAt: '2024-05-24' },
    { patchId: 'PP-056B', patchName: 'DIAGNOSTIC_CONSOLIDATION', updatedAt: '2024-05-24' }
  ] as PatchHistoryEntry[]
};