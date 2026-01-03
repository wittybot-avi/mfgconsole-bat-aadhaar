/**
 * BUILD METADATA - SINGLE SOURCE OF TRUTH (PP-061)
 */

export interface PatchHistoryEntry {
  patchId: string;
  patchName: string;
  updatedAt: string;
}

export const buildMeta = {
  appVersion: '1.8.9n',
  patchId: 'PP-061',
  patchName: 'NAV_VISIBILITY_GUARD_AND_IA_RESTORATION',
  updatedAt: '2024-05-24',
  changeNotes: [
    'Implemented Nav Visibility Guard: sidebar sections and items are now persistent even if restricted or unregistered.',
    'Restored full IA set for Observe, Resolve, and Govern sections.',
    'Added "Exceptions Inbox" and "Access Audit" placeholders to fulfill target taxonomy.',
    'Enhanced HUD with real-time Navigation health metrics (Total/Enabled/Disabled).',
    'Disabled items now feature "RESTRICTED" or "UNREGISTERED" badges and diagnostic tooltips.',
    'Ensured relative imports across all navigation-critical modules for runtime stability.'
  ],
  history: [
    { patchId: 'PP-061', patchName: 'NAV_VISIBILITY_GUARD_AND_IA_RESTORATION', updatedAt: '2024-05-24' },
    { patchId: 'PP-060B', patchName: 'SIDEBAR_INTEGRITY_STABILITY', updatedAt: '2024-05-24' },
    { patchId: 'PP-060A', patchName: 'CANONICAL_NAVIGATION_HARDENING', updatedAt: '2024-05-24' },
    { patchId: 'PP-060', patchName: 'RESTORE_EMPTY_SECTIONS_AND_STABLE_IA_SKELETON', updatedAt: '2024-05-24' },
    { patchId: 'PP-059', patchName: 'NAV_GUARDRAILS_AND_REGISTRY_CONSISTENCY', updatedAt: '2024-05-24' },
    { patchId: 'PP-058', patchName: 'NAV_RESTRUCTURE_TO_TARGET_TAXONOMY', updatedAt: '2024-05-24' }
  ] as PatchHistoryEntry[]
};