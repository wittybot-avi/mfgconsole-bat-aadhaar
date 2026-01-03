import { ROUTES } from '../../app/routes';

/**
 * NAV_ALIASES (PP-061B)
 * Map of legacy or short paths to their canonical equivalents.
 */
export const NAV_ALIASES: Record<string, string> = {
  '/sku': ROUTES.SKU_DESIGN,
  '/batches': ROUTES.BATCHES,
  '/inventory': ROUTES.INVENTORY,
  '/dispatch': ROUTES.DISPATCH_ORDERS,
  '/eol': ROUTES.EOL_QUEUE,
  '/custody': ROUTES.CUSTODY,
  '/compliance': ROUTES.COMPLIANCE,
  '/settings': ROUTES.SETTINGS,
  '/rbac': ROUTES.ACCESS_AUDIT,
  '/runbooks': ROUTES.RUNBOOKS,
  '/telemetry': ROUTES.TELEMETRY,
  '/analytics': ROUTES.ANALYTICS,
  '/provisioning': ROUTES.PROVISIONING_QUEUE,
  '/control-tower': ROUTES.RUNBOOKS,
};

/**
 * Normalizes a path by removing trailing slashes and checking the alias map.
 */
export function resolvePath(path: string): string {
  if (!path) return '/';
  
  // Normalize trailing slash
  let normalized = path.length > 1 && path.endsWith('/') ? path.slice(0, -1) : path;
  
  // Handle absolute URL detection
  if (normalized.startsWith('http')) return normalized;

  // Check direct alias
  if (NAV_ALIASES[normalized]) return NAV_ALIASES[normalized];

  // Handle parameterized legacy patterns
  if (normalized.startsWith('/batches/')) {
    return normalized.replace('/batches/', '/operate/batches/');
  }
  if (normalized.startsWith('/inventory/')) {
    return normalized.replace('/inventory/', '/operate/inventory/');
  }
  if (normalized.startsWith('/eol/details/')) {
    return normalized.replace('/eol/details/', '/assure/eol/details/');
  }
  if (normalized.startsWith('/sku/')) {
    return normalized.replace('/sku/', '/design/sku/');
  }

  return normalized;
}