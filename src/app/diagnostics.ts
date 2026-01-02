export const DIAGNOSTIC_MODE = true;

export interface DiagnosticData {
  pageName: string;
  componentName: string;
  route: string;
  screenId: string;
  recordsLoaded?: number;
  dataSource?: string;
}
