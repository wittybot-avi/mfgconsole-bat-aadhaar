import { NAV_SECTIONS, NavItem } from './navigation';
import { isRouteRegistered, APP_ROUTES } from '../../app/routeRegistry';
import { ScreenId } from '../rbac/screenIds';

export interface IntegrityWarning {
  type: 'UNREGISTERED_NAV' | 'MISSING_CORE_SCREEN' | 'MISMATCHED_SCREEN_ID';
  label: string;
  detail: string;
}

const CORE_SCREENS = [
  ScreenId.DASHBOARD,
  ScreenId.BATCHES_LIST,
  ScreenId.INVENTORY,
  ScreenId.DISPATCH_LIST,
  ScreenId.EOL_QA_QUEUE,
  ScreenId.SKU_LIST,
  ScreenId.CELL_LOTS_LIST,
  ScreenId.LINEAGE_VIEW,
  ScreenId.CUSTODY,
  ScreenId.COMPLIANCE,
  ScreenId.RBAC_VIEW
];

class NavigationIntegrity {
  private warnings: IntegrityWarning[] = [];

  validate() {
    const newWarnings: IntegrityWarning[] = [];
    const navItems: NavItem[] = [];

    // Flatten Nav Items
    NAV_SECTIONS.forEach(section => {
      if (section.items) navItems.push(...section.items);
      if (section.subGroups) {
        section.subGroups.forEach(sg => navItems.push(...sg.items));
      }
    });

    // 1. Check if nav items point to registered routes
    navItems.forEach(item => {
      const path = item.href();
      if (!isRouteRegistered(path)) {
        newWarnings.push({
          type: 'UNREGISTERED_NAV',
          label: item.label,
          detail: `Nav points to ${path} which is not in registry.`
        });
      }

      // 2. Check if item uses correct ScreenId mapping
      const registeredConfig = APP_ROUTES[item.screenId];
      if (!registeredConfig) {
         newWarnings.push({
             type: 'MISMATCHED_SCREEN_ID',
             label: item.label,
             detail: `Nav item refers to ScreenId ${item.screenId} which has no route config.`
         });
      }
    });

    // 3. Check for core screen coverage
    CORE_SCREENS.forEach(id => {
      const isPresent = navItems.some(item => item.screenId === id);
      if (!isPresent) {
        newWarnings.push({
          type: 'MISSING_CORE_SCREEN',
          label: id,
          detail: `Core screen ${id} is not present in nav config.`
        });
      }
    });

    this.warnings = newWarnings;
    if (newWarnings.length > 0) {
      console.warn(`[NavIntegrity] Detected ${newWarnings.length} integrity warnings:`, newWarnings);
    }
  }

  getWarnings() {
    return this.warnings;
  }
}

export const navIntegrity = new NavigationIntegrity();