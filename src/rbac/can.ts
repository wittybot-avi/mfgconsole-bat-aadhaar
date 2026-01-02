import { RBAC_POLICY } from './policy';
import { ScreenId } from './screenIds';
import { PermissionVerb, Verbs } from './verbs';

const ALL_VERBS = Object.values(Verbs);

export function canView(clusterId: string, screen: ScreenId): boolean {
  if (clusterId === 'CS') return true; // Super User bypass
  const perms = RBAC_POLICY[clusterId]?.[screen];
  return !!perms && perms.includes('V');
}

export function canDo(clusterId: string, screen: ScreenId, verb: PermissionVerb): boolean {
  if (clusterId === 'CS') return true; // Super User bypass
  const perms = RBAC_POLICY[clusterId]?.[screen];
  return !!perms && perms.includes(verb);
}

export function getMyPermissions(clusterId: string, screen: ScreenId): PermissionVerb[] {
  if (clusterId === 'CS') return ALL_VERBS; // Super User bypass
  return RBAC_POLICY[clusterId]?.[screen] || [];
}