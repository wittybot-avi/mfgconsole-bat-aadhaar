/**
 * BUILD METADATA - SINGLE SOURCE OF TRUTH (PP-058)
 */

export interface PatchHistoryEntry {
  patchId: string;
  patchName: string;
  updatedAt: string;
}

export const buildMeta = {
  appVersion: '1.8.9n',
  patchId: 'PP-058',
  patchName: 'NAV_RESTRUCTURE_TO_TARGET_TAXONOMY',
  updatedAt: '2024-05-24',
  changeNotes: [
    'Restructured sidebar navigation to agreed target taxonomy: Control Tower, Observe, Design, Trace, Operate, and Admin.',
    'Implemented visual sub-grouping within the Operate section (Assembly, SCM, Assure).',
    'Relocated setup and configuration screens (EOL Setup, Provisioning Setup) under the Design section.',
    'Consolidated SOP Library and Governance into the Control Tower.',
    'Maintained empty-section guards to ensure a clean UI footprint across different RBAC clusters.',
    'Updated build metadata to single source of truth PP-058'
  ],
  history: [
    { patchId: 'PP-058', patchName: 'NAV_RESTRUCTURE_TO_TARGET_TAXONOMY', updatedAt: '2024-05-24' },
    { patchId: 'PP-057', patchName: 'RESTORE_MISSING_SCREENS_AND_SECTION_GUARDS', updatedAt: '2024-05-24' },
    { patchId: 'PPP-056F', patchName: 'HUD_BUILD_META_TRACKER', updatedAt: '2024-05-24' },
    { patchId: 'PP-056E', patchName: 'OBSERVE_RESTORATION', updatedAt: '2024-05-24' },
    { patchId: 'PP-056D', patchName: 'BATCH_TO_MODULE', updatedAt: '2024-05-24' },
    { patchId: 'PP-056C', patchName: 'CANONICAL_NAVIGATION', updatedAt: '2024-05-24' },
    { patchId: 'PP-056B', patchName: 'DIAGNOSTIC_CONSOLIDATION', updatedAt: '2024-05-24' },
    { patchId: 'P-056A', patchName: 'WHITESCREEN_BOOT_GUARD', updatedAt: '2024-05-24' }
  ] as PatchHistoryEntry[]
};