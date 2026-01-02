import { RBAC_POLICY } from './policy';
import { ScreenId, SCREEN_GROUPS } from './screenIds';
import { getRoleCapabilities } from './capabilityMap';
import { PATCH_LEVEL, LAST_PATCH_ID } from '../app/patchInfo';

export const generateRbacSnapshot = (clusterId: string, roleName: string) => {
  const allScreens = Object.values(SCREEN_GROUPS).flat() as ScreenId[];
  const allowedScreens: string[] = [];
  const deniedScreens: string[] = [];

  allScreens.forEach(screen => {
    // Check if explicitly allowed (or Super User)
    const perms = clusterId === 'CS' ? ['V', 'C', 'E', 'A', 'X', 'M'] : RBAC_POLICY[clusterId]?.[screen];
    if (perms && perms.includes('V')) {
      allowedScreens.push(screen);
    } else {
      deniedScreens.push(screen);
    }
  });

  const capabilities = getRoleCapabilities(clusterId);

  return {
    meta: {
      generatedAt: new Date().toISOString(),
      systemVersion: `v1.6.8-P${PATCH_LEVEL}`,
      patchId: LAST_PATCH_ID,
      environment: 'production-frontend-mock'
    },
    session: {
      clusterId,
      roleName,
      isAuthenticated: true
    },
    accessControl: {
      allowedScreens,
      deniedScreens,
      capabilities
    },
    policyHash: Math.random().toString(36).substring(7) // Mock hash
  };
};