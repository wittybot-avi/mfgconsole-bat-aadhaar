
/**
 * Router Safety Utility
 * Ensures navigation stays within the SPA and persists the last known good location.
 */

const LAST_GOOD_ROUTE_KEY = 'aayatana_last_good_route';

export const routerSafe = {
  /**
   * Persists the current path if it is internal and valid.
   */
  trackRoute(pathname: string, search: string = ''): void {
    if (!pathname || pathname === '*' || pathname.includes('http') || pathname === '/__notfound') {
      return;
    }
    const fullPath = pathname + (search || '');
    localStorage.setItem(LAST_GOOD_ROUTE_KEY, fullPath);
  },

  /**
   * Returns the last known good route or a default safe fallback.
   */
  getLastGoodRoute(): string {
    return localStorage.getItem(LAST_GOOD_ROUTE_KEY) || '/';
  },

  /**
   * Validates if a string is a safe internal route path.
   */
  isInternal(path: string): boolean {
    if (!path) return false;
    // Reject absolute URLs
    if (path.startsWith('http://') || path.startsWith('https://') || path.startsWith('//')) {
      return false;
    }
    return true;
  }
};
