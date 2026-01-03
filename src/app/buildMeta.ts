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
  patchName: 'CANONICAL_RUNBOOK_NAV_GUARDRAIL',
  updatedAt: '2024-05-24',
  changeNotes: [
    'Enforced ScreenId-based navigation in Runbooks to eliminate "Unknown Coordinates".',
    'Introduced resolveCanonicalPath and navigateCanonical safety helpers.',
    'Hardened Recommended Action CTAs to use registry coordinates instead of raw strings.',
    'Updated NotFound recovery to automatically detour to canonical workstations via alias mapping.',
    'Standardized all workstation routing to ensure deterministic UI state transitions.'
  ],
  history: [
    { patchId: 'PP-061B', patchName: 'CANONICAL_RUNBOOK_NAV_GUARDRAIL', updatedAt: '2024-05-24' },
    { patchId: 'PP-061A', patchName: 'GOVERN_RESTORE_CONTROL_TOWER_VISIBILITY', updatedAt: '2024-05-24' },
    { patchId: 'PP-062', patchName: 'CONTROL_TOWER_RESTORE', updatedAt: '2024-05-24' },
    { patchId: 'PP-061', patchName: 'NAV_VISIBILITY_GUARD_AND_IA_RESTORATION', updatedAt: '2024-05-24' },
    { patchId: 'PP-060B', patchName: 'SIDEBAR_INTEGRITY_STABILITY', updatedAt: '2024-05-24' },
    { patchId: 'PP-060A', patchName: 'CANONICAL_NAVIGATION_HARDENING', updatedAt: '2024-05-24' }
  ] as PatchHistoryEntry[]
};