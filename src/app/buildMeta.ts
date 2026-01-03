/**
 * BUILD METADATA - SINGLE SOURCE OF TRUTH (PP-061B)
 */

export interface PatchHistoryEntry {
  patchId: string;
  patchName: string;
  updatedAt: string;
}

export const buildMeta = {
  appVersion: '1.8.9o',
  patchId: 'PP-061B',
  patchName: 'CANONICAL_NAV_GUARDRAILS',
  updatedAt: '2024-05-24',
  changeNotes: [
    'Implemented Navigation Normalization Layer to prevent "Unknown Coordinates".',
    'Added Canonical Route Alias map for legacy paths (/sku, /eol, etc.).',
    'Hardened sidebar visibility logic to prevent vanishing sections during state transitions.',
    'Enhanced NotFound recovery with smart alias resolution.',
    'Standardized all programmatic navigation via safeNavigate helper.'
  ],
  history: [
    { patchId: 'PP-061B', patchName: 'CANONICAL_NAV_GUARDRAILS', updatedAt: '2024-05-24' },
    { patchId: 'PP-061A', patchName: 'GOVERN_RESTORE_CONTROL_TOWER_VISIBILITY', updatedAt: '2024-05-24' },
    { patchId: 'PP-062', patchName: 'CONTROL_TOWER_RESTORE', updatedAt: '2024-05-24' },
    { patchId: 'PP-061', patchName: 'NAV_VISIBILITY_GUARD_AND_IA_RESTORATION', updatedAt: '2024-05-24' },
    { patchId: 'PP-060B', patchName: 'SIDEBAR_INTEGRITY_STABILITY', updatedAt: '2024-05-24' },
    { patchId: 'PP-060A', patchName: 'CANONICAL_NAVIGATION_HARDENING', updatedAt: '2024-05-24' },
    { patchId: 'PP-060', patchName: 'RESTORE_EMPTY_SECTIONS_AND_STABLE_IA_SKELETON', updatedAt: '2024-05-24' }
  ] as PatchHistoryEntry[]
};