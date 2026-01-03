/**
 * BUILD METADATA - SINGLE SOURCE OF TRUTH (PP-060B)
 */

export interface PatchHistoryEntry {
  patchId: string;
  patchName: string;
  updatedAt: string;
}

export const buildMeta = {
  appVersion: '1.8.9n',
  patchId: 'PP-060B',
  patchName: 'SIDEBAR_INTEGRITY_STABILITY',
  updatedAt: '2024-05-24',
  changeNotes: [
    'Stabilized module resolution by removing invalid @ path aliases.',
    'Standardized all navigation components to use explicit relative imports.',
    'Consolidated runtime status indicators to the Unified HUD Pill.',
    'Verified route registry consistency with sidebar navigation config.',
    'Updated build metadata to single source of truth PP-060B'
  ],
  history: [
    { patchId: 'PP-060B', patchName: 'SIDEBAR_INTEGRITY_STABILITY', updatedAt: '2024-05-24' },
    { patchId: 'PP-060A', patchName: 'CANONICAL_NAVIGATION_HARDENING', updatedAt: '2024-05-24' },
    { patchId: 'PP-060', patchName: 'RESTORE_EMPTY_SECTIONS_AND_STABLE_IA_SKELETON', updatedAt: '2024-05-24' },
    { patchId: 'PP-059', patchName: 'NAV_GUARDRAILS_AND_REGISTRY_CONSISTENCY', updatedAt: '2024-05-24' },
    { patchId: 'PP-058', patchName: 'NAV_RESTRUCTURE_TO_TARGET_TAXONOMY', updatedAt: '2024-05-24' },
    { patchId: 'PP-057', patchName: 'RESTORE_MISSING_SCREENS_AND_SECTION_GUARDS', updatedAt: '2024-05-24' },
    { patchId: 'PPP-056F', patchName: 'HUD_BUILD_META_TRACKER', updatedAt: '2024-05-24' }
  ] as PatchHistoryEntry[]
};