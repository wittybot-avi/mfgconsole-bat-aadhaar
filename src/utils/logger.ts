
import { useAppStore } from '../lib/store';
import { scenarioStore } from '../demo/scenarioStore';

export type LogLevel = 'info' | 'warn' | 'error';

const getContext = () => {
  const state = useAppStore.getState();
  return {
    path: window.location.hash || window.location.pathname,
    role: state.currentRole?.id || 'unauthenticated',
    cluster: state.currentCluster?.id || 'none',
    scenario: scenarioStore.getScenario(),
    timestamp: new Date().toISOString(),
    version: '1.8.3'
  };
};

export const logger = {
  info: (message: string, data?: any) => {
    console.info(`[INFO] ${message}`, { ...getContext(), ...data });
  },
  warn: (message: string, data?: any) => {
    console.warn(`[WARN] ${message}`, { ...getContext(), ...data });
  },
  error: (message: string, error?: any) => {
    console.error(`[ERROR] ${message}`, { ...getContext(), error });
  },
  getDiagnostics: (error?: Error) => {
    const ctx = getContext();
    return JSON.stringify({
      ...ctx,
      errorName: error?.name,
      errorMessage: error?.message,
      errorStack: error?.stack,
      userAgent: navigator.userAgent
    }, null, 2);
  }
};
