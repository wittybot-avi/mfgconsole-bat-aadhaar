
export const seedMismatch = () => {
  const now = new Date().toISOString();
  
  const skus = [{
    id: 'sku-mismatch',
    skuCode: 'VV360-MISMATCH',
    skuName: 'Vanguard Mismatch Demo',
    seriesCount: 16,
    parallelCount: 1,
    requiredModules: 1,
    status: 'ACTIVE',
    rules: { minCells: 16, maxCells: 16, allowedChemistry: ['LFP'], requiredScans: ['CELL_SERIAL'] },
    createdAt: now,
    updatedAt: now
  }];

  const lots = [{
    id: 'lot-mismatch',
    lotCode: 'CATL-ERR-COUNT',
    supplierName: 'CATL',
    quantityReceived: 50,
    status: 'READY_TO_BIND',
    generatedCount: 20,
    scannedCount: 20,
    createdAt: now,
    updatedAt: now
  }];

  // Only seed 14 serials bound to a module that expects 16
  const serials = Array.from({ length: 14 }).map((_, i) => ({
    serial: `SN-MIS-${String(i + 1).padStart(3, '0')}`,
    lotId: 'lot-mismatch',
    status: 'BOUND',
    generatedAt: now,
    scannedAt: now,
    actor: 'System Seeder'
  }));

  const bindings = serials.map(s => ({
    moduleId: 'MOD-ERROR-01',
    serial: s.serial,
    lotId: 'lot-mismatch',
    lotCode: 'CATL-ERR-COUNT',
    boundAt: now,
    actor: 'System Seeder'
  }));

  const modules = [{
    id: 'MOD-ERROR-01',
    skuId: 'sku-mismatch',
    skuCode: 'VV360-MISMATCH',
    targetCells: 16,
    boundCellSerials: serials.map(s => s.serial),
    status: 'IN_PROGRESS',
    createdBy: 'Operator Error',
    createdAt: now,
    updatedAt: now
  }];

  localStorage.setItem('aayatana_skus_v1', JSON.stringify(skus));
  localStorage.setItem('aayatana_cell_lots_v1', JSON.stringify(lots));
  localStorage.setItem('aayatana_cell_serials_v1_lot-mismatch', JSON.stringify(serials));
  localStorage.setItem('aayatana_cell_bindings_v1', JSON.stringify(bindings));
  localStorage.setItem('aayatana_modules_v1', JSON.stringify(modules));
  localStorage.setItem('aayatana_packs_v1', JSON.stringify([]));
};
