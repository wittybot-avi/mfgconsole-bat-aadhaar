/**
 * BUILD METADATA - SINGLE SOURCE OF TRUTH (PP-060)
 */

export interface PatchHistoryEntry {
  patchId: string;
  patchName: string;
  updatedAt: string;
}

export const buildMeta = {
  appVersion: '1.8.9n',
  patchId: 'PP-060',
  patchName: 'RESTORE_EMPTY_SECTIONS_AND_STABLE_IA_SKELETON',
  updatedAt: '2024-05-24',
  changeNotes: [
    'Stabilized Information Architecture (IA) with final top-level groupings: Control Tower, Observe, Design, Trace, Operate, and Admin.',
    'Implemented "Never Empty" rule for sidebar sections; showing placeholders instead of silent removal.',
    'Consolidated SOP Library and Governance into the Control Tower workspace.',
    'Restructured Operate section with functional sub-groups for Assembly, Supply Chain (SCM), and Assurance.',
    'Verified detail route resolution for Batches, Inventory, and Dispatch to eliminate Unknown Coordinates.',
    'Added diagnostic tooltips to unavailable sections to explain RBAC/Configuration filtering logic.',
    'Updated build metadata to single source of truth PP-060'
  ],
  history: [
    { patchId: 'PP-060', patchName: 'RESTORE_EMPTY_SECTIONS_AND_STABLE_IA_SKELETON', updatedAt: '2024-05-24' },
    { patchId: 'PP-059', patchName: 'NAV_GUARDRAILS_AND_REGISTRY_CONSISTENCY', updatedAt: '2024-05-24' },
    { patchId: 'PP-058', patchName: 'NAV_RESTRUCTURE_TO_TARGET_TAXONOMY', updatedAt: '2024-05-24' },
    { patchId: 'PP-057', patchName: 'RESTORE_MISSING_SCREENS_AND_SECTION_GUARDS', updatedAt: '2024-05-24' },
    { patchId: 'PPP-056F', patchName: 'HUD_BUILD_META_TRACKER', updatedAt: '2024-05-24' },
    { patchId: 'PP-056E', patchName: 'OBSERVE_RESTORATION', updatedAt: '2024-05-24' },
    { patchId: 'PP-056D', patchName: 'BATCH_TO_MODULE', updatedAt: '2024-05-24' },
    { patchId: 'PP-056C', patchName: 'CANONICAL_NAVIGATION', updatedAt: '2024-05-24' }
  ] as PatchHistoryEntry[]
};