
import { ScreenId } from './screenIds';
import { canView } from './can';
import { Cluster } from './clusters';

export const getLandingRouteForRole = (cluster: Cluster | null): string => {
  if (!cluster) return '/login';

  // Priority list of screens to land on
  const PRIORITY_SCREENS: Array<{ id: ScreenId, path: string }> = [
    { id: ScreenId.DASHBOARD, path: '/' },
    { id: ScreenId.BATCHES_LIST, path: '/batches' },
    { id: ScreenId.INVENTORY, path: '/inventory' },
    // Fix: Corrected invalid ScreenId property reference from EOL_QA_STATION to EOL_QA_QUEUE.
    { id: ScreenId.EOL_QA_QUEUE, path: '/eol' },
    { id: ScreenId.TELEMETRY, path: '/telemetry' },
    { id: ScreenId.COMPLIANCE, path: '/compliance' },
    { id: ScreenId.SETTINGS, path: '/settings' },
  ];

  for (const screen of PRIORITY_SCREENS) {
    if (canView(cluster.id, screen.id)) {
      return screen.path;
    }
  }

  // Fallback if nothing else matches (e.g., C9 might only see specific things)
  // Check full list if priority fails
  if (canView(cluster.id, ScreenId.DISPATCH)) return '/dispatch';
  if (canView(cluster.id, ScreenId.CUSTODY)) return '/custody';

  return '/'; // Default to root, RouteGuard will catch it if invalid
};
