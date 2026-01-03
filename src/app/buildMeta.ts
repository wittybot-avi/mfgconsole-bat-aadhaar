/**
 * BUILD METADATA - SINGLE SOURCE OF TRUTH (PP-060A)
 */

export interface PatchHistoryEntry {
  patchId: string;
  patchName: string;
  updatedAt: string;
}

export const buildMeta = {
  appVersion: '1.8.9n',
  patchId: 'PP-060A',
  patchName: 'CANONICAL_NAVIGATION_HARDENING',
  updatedAt: '2024-05-24',
  changeNotes: [
    'Eliminated hardcoded strings in all Next Recommended Action CTAs in favor of canonical builders.',
    'Fixed Chain of Custody list-to-detail navigation to use registered routes.',
    'Implemented assertPathRegistered guardrail to prevent navigation to unregistered coordinates.',
    'Added legacy route redirects for /custody paths to maintain deep-link integrity.',
    'Updated build metadata to single source of truth PP-060A'
  ],
  history: [
    { patchId: 'PP-060A', patchName: 'CANONICAL_NAVIGATION_HARDENING', updatedAt: '2024-05-24' },
    { patchId: 'PP-060', patchName: 'RESTORE_EMPTY_SECTIONS_AND_STABLE_IA_SKELETON', updatedAt: '2024-05-24' },
    { patchId: 'PP-059', patchName: 'NAV_GUARDRAILS_AND_REGISTRY_CONSISTENCY', updatedAt: '2024-05-24' },
    { patchId: 'PP-058', patchName: 'NAV_RESTRUCTURE_TO_TARGET_TAXONOMY', updatedAt: '2024-05-24' },
    { patchId: 'PP-057', patchName: 'RESTORE_MISSING_SCREENS_AND_SECTION_GUARDS', updatedAt: '2024-05-24' },
    { patchId: 'PPP-056F', patchName: 'HUD_BUILD_META_TRACKER', updatedAt: '2024-05-24' },
    { patchId: 'PP-056E', patchName: 'OBSERVE_RESTORATION', updatedAt: '2024-05-24' }
  ] as PatchHistoryEntry[]
};