
export const seedTamper = () => {
  const now = new Date().toISOString();
  
  const skus = [{
    id: 'sku-tamper',
    skuCode: 'VV360-TAMPER',
    status: 'ACTIVE',
    seriesCount: 16,
    requiredModules: 2,
    createdAt: now,
    updatedAt: now
  }];

  const lots = [{
    id: 'lot-tamper',
    lotCode: 'CATL-TAMPER-DETECT',
    status: 'READY_TO_BIND',
    generatedCount: 100,
    scannedCount: 100,
    createdAt: now,
    updatedAt: now
  }];

  // Serial used twice
  const duplicateSerial = 'SN-DUPE-999';

  const bindings = [
    { moduleId: 'MOD-TAMP-01', serial: duplicateSerial, lotId: 'lot-tamper', lotCode: 'CATL-TAMPER-DETECT', boundAt: now, actor: 'Attacker' },
    { moduleId: 'MOD-TAMP-02', serial: duplicateSerial, lotId: 'lot-tamper', lotCode: 'CATL-TAMPER-DETECT', boundAt: now, actor: 'Attacker' }
  ];

  const modules = [
    { id: 'MOD-TAMP-01', skuId: 'sku-tamper', skuCode: 'VV360-TAMPER', targetCells: 16, boundCellSerials: [duplicateSerial], status: 'SEALED', updatedAt: now },
    { id: 'MOD-TAMP-02', skuId: 'sku-tamper', skuCode: 'VV360-TAMPER', targetCells: 16, boundCellSerials: [duplicateSerial], status: 'SEALED', updatedAt: now }
  ];

  const packs = [{
    id: 'PACK-TAMP-01',
    skuId: 'sku-tamper',
    skuCode: 'VV360-TAMPER',
    moduleIds: ['MOD-TAMP-01', 'MOD-TAMP-02'],
    status: 'QUARANTINED',
    qcStatus: 'FAILED',
    createdAt: now,
    updatedAt: now
  }];

  const testRuns = [{
    id: 'TR-TAMP',
    packId: 'PACK-TAMP-01',
    computedResult: 'FAIL',
    finalDecision: 'QUARANTINE',
    notes: 'Integrity Audit Failure: Serial SN-DUPE-999 detected in multiple modules.'
  }];

  localStorage.setItem('aayatana_skus_v1', JSON.stringify(skus));
  localStorage.setItem('aayatana_cell_lots_v1', JSON.stringify(lots));
  localStorage.setItem('aayatana_cell_bindings_v1', JSON.stringify(bindings));
  localStorage.setItem('aayatana_modules_v1', JSON.stringify(modules));
  localStorage.setItem('aayatana_packs_v1', JSON.stringify(packs));
  localStorage.setItem('aayatana_eol_test_runs_v1', JSON.stringify(testRuns));
};
