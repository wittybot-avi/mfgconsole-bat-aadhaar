import { matchPath } from 'react-router-dom';
import { APP_ROUTES, RouteConfig } from '../../app/routeRegistry';

export interface NavDriftWarning {
  label: string;
  path: string;
  reason: 'UNREGISTERED_PATH' | 'MALFORMED_BUILDER' | 'ORPHAN_SCREEN';
}

/**
 * Singleton state for navigation warnings to be consumed by UnifiedDiagnosticPanel.
 */
class NavValidator {
  private warnings: NavDriftWarning[] = [];

  validate(navStructure: any[], pathResolver: (id: any) => string) {
    const newWarnings: NavDriftWarning[] = [];
    const registeredConfigs = Object.values(APP_ROUTES) as RouteConfig[];

    const checkItem = (screenId: any, label?: string) => {
      const path = pathResolver(screenId);
      
      // Check if path is validly computed
      if (!path || path === '#' || path === '/') return;

      // Check if path matches any registered pattern in routeRegistry
      const isRegistered = registeredConfigs.some(config => 
        !!matchPath({ path: config.path || '', end: true }, path)
      );

      if (!isRegistered) {
        newWarnings.push({
          label: label || 'Unknown Item',
          path,
          reason: 'UNREGISTERED_PATH'
        });
      }
    };

    navStructure.forEach(group => {
      if (group.screenIds) {
        group.screenIds.forEach((id: any) => checkItem(id));
      }
      if (group.subGroups) {
        group.subGroups.forEach((sg: any) => {
          sg.screenIds.forEach((id: any) => checkItem(id));
        });
      }
    });

    this.warnings = newWarnings;
    if (newWarnings.length > 0) {
      console.warn(`[NavValidator] Detected ${newWarnings.length} navigation drift warnings:`, newWarnings);
    }
  }

  getWarnings() {
    return this.warnings;
  }
}

export const navValidator = new NavValidator();