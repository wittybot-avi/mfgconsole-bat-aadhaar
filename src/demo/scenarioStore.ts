
import { seedHappyPath } from './scenarios/happyPath';
import { seedMismatch } from './scenarios/mismatch';
import { seedTamper } from './scenarios/tamper';
import { seedEmpty } from './scenarios/empty';

export type DemoScenario = 'HAPPY_PATH' | 'MISMATCH' | 'TAMPER' | 'EMPTY';

class ScenarioStore {
  private STORAGE_KEY = 'DEMO_SCENARIO';
  
  // Storage keys used by services to ensure total wipe
  private SERVICE_KEYS = [
    'aayatana_skus_v1',
    'aayatana_modules_v1',
    'aayatana_packs_v1',
    'aayatana_cell_lots_v1',
    'aayatana_lineage_events_v1',
    'aayatana_cell_bindings_v1',
    'aayatana_eol_test_runs_v1',
    'aayatana_quarantine_v1',
    'aayatana_cell_serials_v1' // base prefix
  ];

  getScenario(): DemoScenario {
    return (localStorage.getItem(this.STORAGE_KEY) as DemoScenario) || 'HAPPY_PATH';
  }

  setScenario(scenario: DemoScenario) {
    localStorage.setItem(this.STORAGE_KEY, scenario);
    this.resetAndSeedAllStores(scenario);
  }

  resetAndSeedAllStores(scenario: DemoScenario) {
    // 1. Wipe everything
    this.SERVICE_KEYS.forEach(key => {
      if (key === 'aayatana_cell_serials_v1') {
        // Multi-lot cleanup
        Object.keys(localStorage).forEach(lsKey => {
          if (lsKey.startsWith(key)) localStorage.removeItem(lsKey);
        });
      } else {
        localStorage.removeItem(key);
      }
    });

    // 2. Run Seeder
    switch (scenario) {
      case 'HAPPY_PATH':
        seedHappyPath();
        break;
      case 'MISMATCH':
        seedMismatch();
        break;
      case 'TAMPER':
        seedTamper();
        break;
      case 'EMPTY':
        seedEmpty();
        break;
    }
  }

  // Helper to ensure first-load has a coherent state
  init() {
    if (!localStorage.getItem('DEMO_INITIALIZED')) {
      this.resetAndSeedAllStores(this.getScenario());
      localStorage.setItem('DEMO_INITIALIZED', 'true');
    }
  }
}

export const scenarioStore = new ScenarioStore();
