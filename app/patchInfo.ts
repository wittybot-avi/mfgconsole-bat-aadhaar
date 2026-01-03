/**
 * PATCH REGISTRY SYSTEM - PROXY TO BUILD META (PPP-056F)
 */
import { buildMeta } from '../src/app/buildMeta';

export interface PatchMetadata {
  id: string;
  name: string;
  date: string;
  description: string;
  type: 'foundation' | 'feature' | 'hotfix';
}

export const APP_VERSION = buildMeta.appVersion;

export const CURRENT_PATCH: PatchMetadata = {
  id: buildMeta.patchId,
  name: buildMeta.patchName,
  date: buildMeta.updatedAt,
  description: buildMeta.changeNotes[0],
  type: "hotfix"
};

export const PATCH_LEVEL = buildMeta.patchId.replace('PPP-', '');
export const LAST_PATCH_ID = CURRENT_PATCH.name;

export const PATCH_HISTORY: PatchMetadata[] = buildMeta.history.map(h => ({
  id: h.patchId,
  name: h.patchName,
  date: h.updatedAt,
  description: "See buildMeta.ts for change notes",
  type: "hotfix"
}));